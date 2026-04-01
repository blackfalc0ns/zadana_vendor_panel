import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface PillTabItem {
  value: string;
  label: string;
  translateLabel?: boolean;
}

@Component({
  selector: 'app-pill-tabs',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule],
  template: `
    <div [ngClass]="resolvedContainerClass">
      @for (tab of tabs; track tab.value) {
        <button
          type="button"
          (click)="selectTab(tab.value)"
          [ngClass]="tab.value === activeValue ? resolvedActiveTabClass : resolvedInactiveTabClass"
          class="rounded-full border px-5 py-2.5 text-[0.74rem] font-black transition-all">
          {{ (tab.translateLabel ?? true) ? (tab.label | translate) : tab.label }}
        </button>
      }
    </div>
  `
})
export class AppPillTabsComponent {
  @Input() tabs: PillTabItem[] = [];
  @Input() activeValue = '';
  @Input() containerClass = '';
  @Input() activeTabClass = '';
  @Input() inactiveTabClass = '';

  @Output() activeValueChange = new EventEmitter<string>();

  get resolvedContainerClass(): string {
    return this.containerClass || 'flex flex-wrap items-center gap-3';
  }

  get resolvedActiveTabClass(): string {
    return this.activeTabClass || 'border-zadna-primary bg-zadna-primary text-white shadow-lg shadow-zadna-primary/20';
  }

  get resolvedInactiveTabClass(): string {
    return this.inactiveTabClass || 'border-slate-200 bg-slate-50 text-slate-700 hover:border-zadna-primary/20 hover:text-zadna-primary';
  }

  selectTab(value: string): void {
    if (value !== this.activeValue) {
      this.activeValueChange.emit(value);
      return;
    }

    this.activeValueChange.emit(value);
  }
}
