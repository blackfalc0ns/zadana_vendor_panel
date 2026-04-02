import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div [class]="resolvedCardClass">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            {{ translateLabel ? (label | translate) : label }}
          </p>
          <p class="mt-3 text-[1.65rem] font-black text-slate-900">{{ value }}</p>

          @if (hint) {
            <p class="mt-2 text-[0.75rem] font-bold text-slate-500">
              {{ translateHint ? (hint | translate: hintParams) : hint }}
            </p>
          }

          <ng-content select="[meta]"></ng-content>
        </div>

        <div class="shrink-0">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>
    </div>
  `
})
export class AppMetricCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() hint = '';
  @Input() hintParams?: Record<string, unknown>;
  @Input() translateLabel = true;
  @Input() translateHint = true;
  @Input() customClass = '';

  get resolvedCardClass(): string {
    return `rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm ${this.customClass}`.trim();
  }
}
