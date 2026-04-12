import { CommonModule, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateVm } from '../../models/ui-contracts.models';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule],
  template: `
    <div [ngClass]="resolvedContainerClass">
      <ng-content select="[icon]"></ng-content>
      <p [ngClass]="resolvedTitleClass">
        {{ shouldTranslateTitle ? (resolvedTitle | translate) : resolvedTitle }}
      </p>
      @if (resolvedSubtitle) {
        <p [ngClass]="resolvedSubtitleClass">
          {{ shouldTranslateSubtitle ? (resolvedSubtitle | translate) : resolvedSubtitle }}
        </p>
      }
      <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `
})
export class AppEmptyStateComponent {
  @Input() state: EmptyStateVm | null = null;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() translateTitle = true;
  @Input() translateSubtitle = true;
  @Input() dashed = false;
  @Input() compact = false;
  @Input() customClass = '';

  get resolvedContainerClass(): string {
    const base = this.isCompact
      ? 'px-6 py-12 text-center'
      : 'rounded-[24px] px-6 py-12 text-center';
    const border = this.isDashed
      ? 'border border-dashed border-slate-300 bg-slate-50'
      : '';

    return `${base} ${border} ${this.state?.customClass || this.customClass}`.trim();
  }

  get resolvedTitleClass(): string {
    return this.isCompact
      ? 'text-[0.98rem] font-black text-slate-900'
      : 'text-[0.95rem] font-black text-slate-900';
  }

  get resolvedSubtitleClass(): string {
    return this.isCompact
      ? 'mt-2 text-[0.8rem] font-bold text-slate-500'
      : 'mt-2 text-[0.78rem] font-bold text-slate-500';
  }

  get resolvedTitle(): string {
    return this.state?.title || this.title;
  }

  get resolvedSubtitle(): string {
    return this.state?.subtitle || this.subtitle;
  }

  get shouldTranslateTitle(): boolean {
    return this.state?.translateTitle ?? this.translateTitle;
  }

  get shouldTranslateSubtitle(): boolean {
    return this.state?.translateSubtitle ?? this.translateSubtitle;
  }

  get isCompact(): boolean {
    return this.state?.compact ?? this.compact;
  }

  get isDashed(): boolean {
    return this.state?.dashed ?? this.dashed;
  }
}
