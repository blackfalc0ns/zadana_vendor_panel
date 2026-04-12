import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable } from 'rxjs';

import { routes } from './app.routes';
import { vendorAuthInterceptor } from './core/auth/interceptors/vendor-auth.interceptor';
import { VendorAuthService } from './core/auth/services/vendor-auth.service';

// Custom Loader to guarantee compatibility and fix "0 arguments" error
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}
  
  getTranslation(lang: string): Observable<any> {
    // Direct path to your translation files
    return this.http.get(`./assets/i18n/${lang}.json`);
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

export function initializeVendorSession(authService: VendorAuthService) {
  return () => authService.initializeSession();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([vendorAuthInterceptor])),
    importProvidersFrom(
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
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeVendorSession,
      deps: [VendorAuthService],
      multi: true
    }
  ]
};
