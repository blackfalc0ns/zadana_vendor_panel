import { CommonModule, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule],
  template: `
    <div [ngClass]="resolvedContainerClass">
      <ng-content select="[icon]"></ng-content>
      <p [ngClass]="resolvedTitleClass">
        {{ translateTitle ? (title | translate) : title }}
      </p>
      @if (subtitle) {
        <p [ngClass]="resolvedSubtitleClass">
          {{ translateSubtitle ? (subtitle | translate) : subtitle }}
        </p>
      }
      <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `
})
export class AppEmptyStateComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() translateTitle = true;
  @Input() translateSubtitle = true;
  @Input() dashed = false;
  @Input() compact = false;
  @Input() customClass = '';

  get resolvedContainerClass(): string {
    const base = this.compact
      ? 'px-6 py-12 text-center'
      : 'rounded-[24px] px-6 py-12 text-center';
    const border = this.dashed
      ? 'border border-dashed border-slate-300 bg-slate-50'
      : '';

    return `${base} ${border} ${this.customClass}`.trim();
  }

  get resolvedTitleClass(): string {
    return this.compact
      ? 'text-[0.98rem] font-black text-slate-900'
      : 'text-[0.95rem] font-black text-slate-900';
  }

  get resolvedSubtitleClass(): string {
    return this.compact
      ? 'mt-2 text-[0.8rem] font-bold text-slate-500'
      : 'mt-2 text-[0.78rem] font-bold text-slate-500';
  }
}
