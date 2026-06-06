import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, HostListener, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ConfirmDialogService } from '../../../../../core/notifications/services/confirm-dialog.service';
import { ConfirmDialogData } from '../../../../../core/notifications/models/confirm-dialog.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirm-dialog-host',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    @if (dialog) {
      <div
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
        [dir]="dialog.direction || (currentLang === 'ar' ? 'rtl' : 'ltr')"
        (click)="onCancel()">
        <div
          #panel
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          class="relative w-[92vw] max-w-md overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] outline-none"
          [@dialogAnimation]="'in'"
          (click)="$event.stopPropagation()">

          <div
            class="pointer-events-none absolute -start-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl"
            [ngClass]="accentGlowClass()">
          </div>

          <div class="relative flex flex-col items-center text-center">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm" [ngClass]="iconWrapClass()">
              @if (dialog.type === 'success') {
                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              } @else if (dialog.type === 'danger') {
                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              } @else if (dialog.type === 'warning') {
                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              } @else {
                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            </div>

            <h3 class="text-lg font-black leading-snug text-slate-900">
              {{ resolveText(dialog.title, dialog.titleIsTranslationKey !== false) }}
            </h3>

            <p class="mt-3 max-w-[22rem] text-sm font-bold leading-relaxed text-slate-500">
              {{ resolveText(dialog.message, !!dialog.messageIsTranslationKey) }}
            </p>

            <div class="mt-6 grid w-full gap-3" [class.grid-cols-2]="dialog.isConfirm !== false">
              @if (dialog.isConfirm !== false) {
                <button
                  type="button"
                  (click)="onCancel()"
                  class="min-h-11 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                  {{ resolveText(dialog.cancelText || 'COMMON.CANCEL', dialog.cancelTextIsTranslationKey ?? !dialog.cancelText) }}
                </button>
              }

              <button
                #confirmButton
                type="button"
                (click)="onConfirm()"
                class="min-h-11 rounded-[14px] px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                [ngClass]="confirmButtonClass()"
                [class.col-span-2]="dialog.isConfirm === false">
                {{ resolveText(dialog.confirmText || 'COMMON.CONFIRM', dialog.confirmTextIsTranslationKey ?? !dialog.confirmText) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  animations: [
    trigger('dialogAnimation', [
      state('in', style({ transform: 'scale(1)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'scale(0.96)', opacity: 0 }),
        animate('220ms cubic-bezier(0.22, 1, 0.36, 1)')
      ]),
      transition('* => void', [
        animate('160ms ease-in', style({ transform: 'scale(0.98)', opacity: 0 }))
      ])
    ])
  ],
  styles: [`:host { display: contents; }`]
})
export class ConfirmDialogHostComponent implements OnDestroy {
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);
  private sub?: Subscription;
  private previousOverflow = '';

  dialog: ConfirmDialogData | null = null;
  currentLang = this.translate.currentLang || 'ar';

  @ViewChild('confirmButton') private confirmButton?: ElementRef<HTMLButtonElement>;

  constructor() {
    this.sub = this.confirmDialogService.dialog$.subscribe((dialog) => {
      this.dialog = dialog;
      if (dialog) {
        this.previousOverflow = this.document.body.style.overflow;
        this.document.body.style.overflow = 'hidden';
        setTimeout(() => this.confirmButton?.nativeElement.focus(), 0);
      } else {
        this.document.body.style.overflow = this.previousOverflow;
      }
      this.cdr.markForCheck();
    });

    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.document.body.style.overflow = this.previousOverflow;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog) {
      this.onCancel();
    }
  }

  resolveText(value: string, asTranslationKey: boolean): string {
    if (!asTranslationKey) {
      return value;
    }

    const translated = this.translate.instant(value);
    return translated && translated !== value ? translated : value;
  }

  iconWrapClass(): string {
    switch (this.dialog?.type) {
      case 'success':
        return 'border-emerald-100 bg-emerald-50 text-emerald-600';
      case 'danger':
        return 'border-rose-100 bg-rose-50 text-rose-600';
      case 'warning':
        return 'border-amber-100 bg-amber-50 text-amber-600';
      default:
        return 'border-sky-100 bg-sky-50 text-sky-600';
    }
  }

  accentGlowClass(): string {
    switch (this.dialog?.type) {
      case 'success':
        return 'bg-emerald-300';
      case 'danger':
        return 'bg-rose-300';
      case 'warning':
        return 'bg-amber-300';
      default:
        return 'bg-sky-300';
    }
  }

  confirmButtonClass(): string {
    switch (this.dialog?.type) {
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25';
      default:
        return 'bg-zadna-primary hover:bg-zadna-primaryDark shadow-zadna-primary/25';
    }
  }

  onConfirm(): void {
    this.confirmDialogService.close(true);
  }

  onCancel(): void {
    this.confirmDialogService.close(false);
  }
}
