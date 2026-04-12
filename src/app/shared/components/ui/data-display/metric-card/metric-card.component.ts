import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MetricCardVm } from '../../models/ui-contracts.models';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div [class]="resolvedCardClass">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            {{ shouldTranslateLabel ? (resolvedLabel | translate) : resolvedLabel }}
          </p>
          <p class="mt-3 text-[1.65rem] font-black text-slate-900">{{ resolvedValue }}</p>

          @if (resolvedHint) {
            <p class="mt-2 text-[0.75rem] font-bold text-slate-500">
              {{ shouldTranslateHint ? (resolvedHint | translate: resolvedHintParams) : resolvedHint }}
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
  @Input() card: MetricCardVm | null = null;
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() hint = '';
  @Input() hintParams?: Record<string, unknown>;
  @Input() translateLabel = true;
  @Input() translateHint = true;
  @Input() customClass = '';

  get resolvedCardClass(): string {
    return `rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm ${this.card?.customClass || this.customClass}`.trim();
  }

  get resolvedLabel(): string {
    return this.card?.label || this.label;
  }

  get resolvedValue(): string | number {
    return this.card?.value ?? this.value;
  }

  get resolvedHint(): string {
    return this.card?.hint || this.hint;
  }

  get resolvedHintParams(): Record<string, unknown> | undefined {
    return this.card?.hintParams || this.hintParams;
  }

  get shouldTranslateLabel(): boolean {
    return this.card?.translateLabel ?? this.translateLabel;
  }

  get shouldTranslateHint(): boolean {
    return this.card?.translateHint ?? this.translateHint;
  }
}
