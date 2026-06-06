import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService } from '../../../../../core/notifications/services/toast.service';
import { ToastItem, ToastType } from '../../../../../core/notifications/models/toast.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div
      class="pointer-events-none fixed bottom-5 z-[1200] flex w-[min(92vw,24rem)] flex-col gap-3"
      [class.end-5]="currentLang !== 'ar'"
      [class.start-5]="currentLang === 'ar'"
      [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      @for (toast of toastService.toasts$ | async; track toast.id) {
        <div
          class="pointer-events-auto overflow-hidden rounded-[20px] border border-white/70 bg-white/95 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.45)] backdrop-blur-xl"
          [@toastEnterLeave]
          (mouseenter)="toastService.pause(toast.id)"
          (mouseleave)="toastService.resume(toast.id)">
          <div class="flex items-start gap-3 p-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" [ngClass]="iconWrapClass(toast.type)">
              @switch (toast.type) {
                @case ('success') {
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                }
                @case ('error') {
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
                @case ('warning') {
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-7.55 13.1A1 1 0 003.61 18h16.78a1 1 0 00.87-1.5l-7.55-13.1a1 1 0 00-1.74 0z" />
                  </svg>
                }
                @default {
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              }
            </div>

            <div class="min-w-0 flex-1 pt-0.5">
              <p class="text-[0.82rem] font-black leading-snug text-slate-900">{{ toast.title }}</p>
              @if (toast.message) {
                <p class="mt-1 text-[0.76rem] font-bold leading-relaxed text-slate-500">{{ toast.message }}</p>
              }
            </div>

            <button
              type="button"
              (click)="toastService.dismiss(toast.id)"
              class="inline-flex shrink-0 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <div class="h-1 w-full bg-slate-100">
            <div
              class="h-full origin-left animate-[toast-progress_linear_forwards]"
              [ngClass]="progressClass(toast.type)"
              [style.animation-duration.ms]="toast.durationMs">
            </div>
          </div>
        </div>
      }
    </div>
  `,
  animations: [
    trigger('toastEnterLeave', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px) scale(0.98)' }),
        animate('260ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(8px) scale(0.98)' }))
      ])
    ])
  ],
  styles: [`
    @keyframes toast-progress {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  currentLang = this.translate.currentLang || 'ar';

  constructor() {
    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.cdr.markForCheck();
    });
  }

  iconWrapClass(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-600';
      case 'error':
        return 'bg-rose-500/10 text-rose-600';
      case 'warning':
        return 'bg-amber-500/10 text-amber-600';
      default:
        return 'bg-sky-500/10 text-sky-600';
    }
  }

  progressClass(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-rose-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-sky-500';
    }
  }
}
