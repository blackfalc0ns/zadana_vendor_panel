import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { AppModalShellComponent } from './modal-shell.component';

describe('AppModalShellComponent', () => {
  let fixture: ComponentFixture<AppModalShellComponent>;
  let component: AppModalShellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModalShellComponent],
      providers: [
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

    fixture = TestBed.createComponent(AppModalShellComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test modal');
    fixture.detectChanges();
  });

  it('renders a dialog with an accessible title binding', () => {
    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');
    const title = host.querySelector('h3');

    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe(component.titleId);
    expect(title?.id).toBe(component.titleId);
  });

  it('emits close when escape is pressed', () => {
    const closeSpy = spyOn(component.close, 'emit');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closeSpy).toHaveBeenCalled();
  });
});
