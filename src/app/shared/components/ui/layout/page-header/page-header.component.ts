import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Params, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div [ngClass]="headerClasses">
      @if (showBack) {
        <a
          [routerLink]="backLink"
          [queryParams]="backQueryParams"
          [attr.aria-label]="backLabel | translate"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-zadna-primary/20 hover:bg-slate-50 hover:text-zadna-primary active:scale-[0.98]"
        >
          <svg class="back-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M15 19l-7-7 7-7"></path>
          </svg>
        </a>
      }

      <div class="min-w-0 flex-1 space-y-1.5">
        @if (eyebrow) {
          <p class="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-zadna-primary/70">
            {{ eyebrow }}
          </p>
        }

        <h1 class="text-2xl font-black tracking-tight text-slate-900">
          <ng-content select="[title]">{{ title }}</ng-content>
        </h1>

        @if (description) {
          <p class="max-w-3xl text-[0.85rem] font-bold leading-6 text-slate-500">
            {{ description }}
          </p>
        }
      </div>

      <div class="flex flex-wrap items-center gap-3 sm:justify-end">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    :host-context([dir='rtl']) .back-icon {
      transform: rotate(180deg);
    }
  `]
})
export class AppPageHeaderComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() eyebrow = '';
  @Input() customClass = '';
  @Input() showBack = false;
  @Input() backLink: string | any[] = '/';
  @Input() backQueryParams?: Params;
  @Input() backLabel = 'COMMON.BACK';

  get headerClasses(): string {
    return `relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/85 px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${this.customClass}`.trim();
  }
}
