import { CommonModule, NgClass } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateVm } from '../../models/ui-contracts.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule],
  template: `
    <div [ngClass]="resolvedContainerClass">
      <span class="material-symbols-outlined mb-5 text-[28px] leading-none text-[#8bbfca]">{{ icon }}</span>
      <ng-content select="[icon]"></ng-content>
      <h3 [ngClass]="resolvedTitleClass">
        {{ shouldTranslateTitle ? (resolvedTitle | translate) : resolvedTitle }}
      </h3>
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
  @Input() icon = 'category';

  get resolvedContainerClass(): string {
    const base = 'min-h-[320px] rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50/35 px-6 py-16 text-center flex flex-col items-center justify-center';
    const border = this.isDashed ? '' : '';

    return `${base} ${border} ${this.state?.customClass || this.customClass}`.trim();
  }

  get resolvedTitleClass(): string {
    return this.isCompact
      ? 'text-[1.35rem] font-black text-slate-900 tracking-normal leading-tight'
      : 'text-[1.35rem] font-black text-slate-900 tracking-normal leading-tight';
  }

  get resolvedSubtitleClass(): string {
    return this.isCompact
      ? 'mt-3 max-w-md text-[0.86rem] font-extrabold text-slate-500 leading-6'
      : 'mt-3 max-w-md text-[0.86rem] font-extrabold text-slate-500 leading-6';
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
