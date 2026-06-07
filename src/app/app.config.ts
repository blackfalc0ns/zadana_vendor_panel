import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DialogModule } from '@angular/cdk/dialog';

import { routes } from './app.routes';
import { vendorAuthInterceptor } from './core/auth/interceptors/vendor-auth.interceptor';

const TRANSLATION_ASSET_VERSION = '2026-06-07-branch-map-1';

// Custom Loader to guarantee compatibility and fix "0 arguments" error
export class CustomTranslateLoader implements TranslateLoader {
  private readonly files = [
    'common',
    'auth',
    'dashboard',
    'catalog',
    'offers',
    'orders',
    'settings'
  ];

  constructor(private http: HttpClient) {}
  
  getTranslation(lang: string): Observable<any> {
    const requests = this.files.map((file) =>
      this.http.get(`./assets/i18n/${lang}/${file}.json?v=${TRANSLATION_ASSET_VERSION}`).pipe(
        catchError((err) => {
          console.error(`Failed to load translation file: ${lang}/${file}.json`, err);
          return of({});
        })
      )
    );

    return forkJoin(requests).pipe(
      map((jsonArray) => {
        return jsonArray.reduce((acc, current) => ({ ...acc, ...current }), {});
      })
    );
  }
}

export function LoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

export function initializeTranslations(translate: TranslateService) {
  return () => {
    const savedLang = localStorage.getItem('vendor_lang') || localStorage.getItem('lang') || 'ar';
    translate.setDefaultLang(savedLang);
    return firstValueFrom(translate.use(savedLang));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
    provideHttpClient(withInterceptors([vendorAuthInterceptor])),
    provideAnimations(),
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
      deps: [TranslateService],
      multi: true
    }
  ]
};
