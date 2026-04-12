import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        (click)="close.emit()"
        class="absolute inset-0 h-full w-full cursor-default"
        [attr.aria-label]="closeAriaLabel">
      </button>

      <div
        #panel
        [class]="resolvedPanelClass"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-labelledby]="title ? titleId : null">
        <div class="border-b border-slate-100 px-6 py-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              @if (eyebrow) {
                <p class="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-zadna-primary/70">
                  {{ translateEyebrow ? (eyebrow | translate) : eyebrow }}
                </p>
              }

              @if (title) {
                <h3 [id]="titleId" class="mt-2 text-[1.1rem] font-black text-slate-900">
                  {{ translateTitle ? (title | translate) : title }}
                </h3>
              }

              @if (subtitle) {
                <p class="mt-1 text-[0.76rem] font-bold text-slate-500">
                  {{ translateSubtitle ? (subtitle | translate) : subtitle }}
                </p>
              }
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <ng-content select="[headerActions]"></ng-content>

              @if (showCloseButton) {
                <button
                  type="button"
                  (click)="close.emit()"
                  [attr.aria-label]="closeAriaLabel"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-700">
                  <span class="text-lg leading-none">x</span>
                </button>
              }
            </div>
          </div>
        </div>

        <div [class]="resolvedBodyClass">
          <ng-content></ng-content>
        </div>

        @if (hasFooter) {
          <div [class]="resolvedFooterClass">
            <ng-content select="[footer]"></ng-content>
          </div>
        }
      </div>
    </div>
  `
})
export class AppModalShellComponent implements AfterViewInit {
  @ViewChild('panel') private readonly panel?: ElementRef<HTMLDivElement>;

  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() translateEyebrow = true;
  @Input() translateTitle = true;
  @Input() translateSubtitle = true;
  @Input() showCloseButton = true;
  @Input() hasFooter = false;
  @Input() closeAriaLabel = 'Close modal';
  @Input() panelClass = '';
  @Input() bodyClass = '';
  @Input() footerClass = '';
  @Output() readonly close = new EventEmitter<void>();

  readonly titleId = `modal-title-${Math.random().toString(36).slice(2, 10)}`;

  get resolvedPanelClass(): string {
    return `relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] ${this.panelClass}`.trim();
  }

  get resolvedBodyClass(): string {
    return this.bodyClass || 'overflow-y-auto px-6 py-6';
  }

  get resolvedFooterClass(): string {
    return this.footerClass || 'flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4';
  }

  ngAfterViewInit(): void {
    this.panel?.nativeElement.focus();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = this.getFocusableElements();
    if (!focusable.length) {
      event.preventDefault();
      this.panel?.nativeElement.focus();
      return;
    }

    const currentIndex = focusable.findIndex((element) => element === document.activeElement);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && (currentIndex <= 0 || document.activeElement === this.panel?.nativeElement)) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && currentIndex === focusable.length - 1) {
      event.preventDefault();
      first.focus();
    }
  }

  private getFocusableElements(): HTMLElement[] {
    return Array.from(
      this.panel?.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) || []
    ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
  }
}
