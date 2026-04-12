import { CommonModule, NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { QuickTabVm } from '../../models/ui-contracts.models';

export interface PillTabItem extends QuickTabVm {
  value: string;
  label: string;
  translateLabel?: boolean;
}

@Component({
  selector: 'app-pill-tabs',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule],
  template: `
    <div [ngClass]="resolvedContainerClass" role="tablist" [attr.aria-orientation]="'horizontal'">
      @for (tab of tabs; track tab.value; let index = $index) {
        <button
          #tabButton
          type="button"
          (click)="selectTab(tab.value)"
          (keydown)="onTabKeydown($event, index)"
          [ngClass]="tab.value === activeValue ? resolvedActiveTabClass : resolvedInactiveTabClass"
          [disabled]="tab.disabled"
          [attr.role]="'tab'"
          [attr.tabindex]="tab.value === activeValue ? 0 : -1"
          [attr.aria-selected]="tab.value === activeValue"
          [attr.aria-label]="tab.ariaLabel || null"
          class="rounded-full border px-5 py-2.5 text-[0.74rem] font-black transition-all disabled:cursor-not-allowed disabled:opacity-45">
          {{ (tab.translateLabel ?? true) ? (tab.label | translate) : tab.label }}
        </button>
      }
    </div>
  `
})
export class AppPillTabsComponent {
  @ViewChildren('tabButton') private readonly tabButtons?: QueryList<ElementRef<HTMLButtonElement>>;

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
    const targetTab = this.tabs.find((tab) => tab.value === value);
    if (targetTab?.disabled) {
      return;
    }

    if (value !== this.activeValue) {
      this.activeValueChange.emit(value);
      return;
    }

    this.activeValueChange.emit(value);
  }

  onTabKeydown(event: KeyboardEvent, index: number): void {
    if (!this.tabs.length) {
      return;
    }

    const lastIndex = this.tabs.length - 1;
    let targetIndex = index;

    switch (event.key) {
      case 'ArrowRight':
        targetIndex = this.isRtl() ? index - 1 : index + 1;
        break;
      case 'ArrowLeft':
        targetIndex = this.isRtl() ? index + 1 : index - 1;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = lastIndex;
        break;
      case 'Enter':
      case ' ':
        this.selectTab(this.tabs[index].value);
        event.preventDefault();
        return;
      default:
        return;
    }

    event.preventDefault();

    if (targetIndex > lastIndex) {
      targetIndex = 0;
    }

    if (targetIndex < 0) {
      targetIndex = lastIndex;
    }

    this.focusTab(targetIndex);
    this.selectTab(this.tabs[targetIndex].value);
  }

  private focusTab(index: number): void {
    const button = this.tabButtons?.get(index)?.nativeElement;
    button?.focus();
  }

  private isRtl(): boolean {
    return typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  }
}
