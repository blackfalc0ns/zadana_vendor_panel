import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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

      <div [class]="resolvedPanelClass">
        <div class="border-b border-slate-100 px-6 py-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              @if (eyebrow) {
                <p class="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-zadna-primary/70">
                  {{ translateEyebrow ? (eyebrow | translate) : eyebrow }}
                </p>
              }

              @if (title) {
                <h3 class="mt-2 text-[1.1rem] font-black text-slate-900">
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
export class AppModalShellComponent {
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

  get resolvedPanelClass(): string {
    return `relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] ${this.panelClass}`.trim();
  }

  get resolvedBodyClass(): string {
    return this.bodyClass || 'overflow-y-auto px-6 py-6';
  }

  get resolvedFooterClass(): string {
    return this.footerClass || 'flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4';
  }
}
