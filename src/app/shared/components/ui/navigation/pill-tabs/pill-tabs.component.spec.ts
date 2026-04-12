import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { AppPillTabsComponent, PillTabItem } from './pill-tabs.component';

describe('AppPillTabsComponent', () => {
  let fixture: ComponentFixture<AppPillTabsComponent>;
  let component: AppPillTabsComponent;

  const tabs: PillTabItem[] = [
    { value: 'branches', label: 'Branches', translateLabel: false },
    { value: 'employees', label: 'Employees', translateLabel: false },
    { value: 'invitations', label: 'Invitations', translateLabel: false }
  ];

  beforeEach(async () => {
    document.documentElement.dir = 'ltr';

    await TestBed.configureTestingModule({
      imports: [AppPillTabsComponent],
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

    fixture = TestBed.createComponent(AppPillTabsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tabs', tabs);
    fixture.componentRef.setInput('activeValue', 'branches');
    fixture.detectChanges();
  });

  it('renders an accessible tablist', () => {
    const host = fixture.nativeElement as HTMLElement;
    const tabList = host.querySelector('[role="tablist"]');
    const renderedTabs = host.querySelectorAll('[role="tab"]');

    expect(tabList).not.toBeNull();
    expect(renderedTabs.length).toBe(3);
    expect(renderedTabs[0].getAttribute('aria-selected')).toBe('true');
    expect(renderedTabs[1].getAttribute('tabindex')).toBe('-1');
  });

  it('emits the next tab value when using arrow navigation', () => {
    const emitSpy = spyOn(component.activeValueChange, 'emit');
    const host = fixture.nativeElement as HTMLElement;
    const firstTab = host.querySelectorAll('button')[0];

    firstTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    expect(emitSpy).toHaveBeenCalledWith('employees');
  });
});
