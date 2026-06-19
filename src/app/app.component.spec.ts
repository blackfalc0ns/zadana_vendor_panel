import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { AlertsCenterService } from './features/alerts/services/alerts-center.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({
          loader: {
            provide: TranslateLoader,
            useValue: {
              getTranslation: () => of({})
            }
          }
        })
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should default to arabic language', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.currentLang).toBe('ar');
  });

  it('should render the router shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('should start alerts monitoring before a vendor signs in', fakeAsync(() => {
    const alertsCenterService = TestBed.inject(AlertsCenterService);
    const startMonitoringSpy = spyOn(alertsCenterService, 'startMonitoring');
    const fixture = TestBed.createComponent(AppComponent);

    fixture.detectChanges();
    flushMicrotasks();

    expect(startMonitoringSpy).toHaveBeenCalledTimes(1);
    fixture.destroy();
  }));
});
