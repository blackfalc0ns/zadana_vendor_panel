import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable } from 'rxjs';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DialogModule } from '@angular/cdk/dialog';

import { routes } from './app.routes';
import { vendorAuthInterceptor } from './core/auth/interceptors/vendor-auth.interceptor';

const TRANSLATION_ASSET_VERSION = '2026-05-09-stock-ui-1';

// Custom Loader to guarantee compatibility and fix "0 arguments" error
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}
  
  getTranslation(lang: string): Observable<any> {
    // Version the request so updated translations are fetched instead of stale cached JSON.
    return this.http.get(`./assets/i18n/${lang}.json?v=${TRANSLATION_ASSET_VERSION}`);
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
    provideRouter(routes),
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
