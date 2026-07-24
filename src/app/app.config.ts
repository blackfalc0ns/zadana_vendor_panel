import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DialogModule } from '@angular/cdk/dialog';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';

import { routes } from './app.routes';
import { vendorAuthInterceptor } from './core/auth/interceptors/vendor-auth.interceptor';
import { ChunkLoadErrorHandler } from './core/services/chunk-load-error-handler';

const TRANSLATION_ASSET_VERSION = '2026-07-24-google-auth-6';

function deepMergeTranslations(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = output[key];
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      output[key] = deepMergeTranslations(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else {
      output[key] = sourceValue;
    }
  }
  return output;
}

// Custom Loader to guarantee compatibility and fix "0 arguments" error
export class CustomTranslateLoader implements TranslateLoader {
  static readonly essentialFiles = ['common', 'auth'];
  static readonly deferredFiles = ['dashboard', 'catalog', 'offers', 'orders', 'settings'];

  private readonly files = [
    ...CustomTranslateLoader.essentialFiles,
    ...CustomTranslateLoader.deferredFiles
  ];

  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.loadFiles(lang, this.files);
  }

  loadFiles(lang: string, files: readonly string[]): Observable<any> {
    const requests = files.map((file) =>
      this.http.get(`./assets/i18n/${lang}/${file}.json?v=${TRANSLATION_ASSET_VERSION}`).pipe(
        catchError((err) => {
          console.error(`Failed to load translation file: ${lang}/${file}.json`, err);
          return of({});
        })
      )
    );

    return forkJoin(requests).pipe(
      map((jsonArray) =>
        jsonArray.reduce<Record<string, unknown>>(
          (acc, current) => deepMergeTranslations(acc, (current || {}) as Record<string, unknown>),
          {}
        )
      )
    );
  }
}

export function LoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

export function initializeTranslations(translate: TranslateService, http: HttpClient) {
  const loader = new CustomTranslateLoader(http);

  return () => {
    const savedLang = localStorage.getItem('vendor_lang') || localStorage.getItem('lang') || 'ar';
    translate.setDefaultLang(savedLang);

    return firstValueFrom(
      loader.loadFiles(savedLang, CustomTranslateLoader.essentialFiles).pipe(
        tap((essentialTranslations) => translate.setTranslation(savedLang, essentialTranslations, true)),
        switchMap(() => translate.use(savedLang)),
        tap(() => {
          loader.loadFiles(savedLang, CustomTranslateLoader.deferredFiles).pipe(
            tap((deferredTranslations) => translate.setTranslation(savedLang, deferredTranslations, true))
          ).subscribe();
        })
      )
    ).then(() => undefined);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withPreloading(PreloadAllModules)
    ),
    provideHttpClient(withInterceptors([vendorAuthInterceptor])),
    provideAnimations(),
    {
      provide: DATE_PIPE_DEFAULT_OPTIONS,
      useValue: { timezone: '+0300' }
    },
    {
      provide: ErrorHandler,
      useClass: ChunkLoadErrorHandler
    },
    importProvidersFrom(
      DialogModule,
      TranslateModule.forRoot({
        fallbackLang: 'ar',
        loader: {
          provide: TranslateLoader,
          useFactory: LoaderFactory,
          deps: [HttpClient]
        }
      })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslateService, HttpClient],
      multi: true
    }
  ]
};
