import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface DetailTabNavItem {
  id: string;
  labelKey: string;
  icon?: string;
  count?: number | string;
  attention?: boolean;
}

@Component({


  
  selector: 'app-detail-tabs-nav',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="w-full max-w-full overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
      <div class="flex w-max items-center gap-1 rounded-xl border border-slate-900/5 bg-slate-900/[0.04] p-[3px]">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            (click)="onTabClick(tab.id)"
            class="relative flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-black tracking-tight transition-all duration-300 sm:rounded-xl sm:px-6 sm:py-2.5 sm:text-xs md:text-sm"
            [ngClass]="isActive(tab.id)
              ? 'bg-gradient-to-br from-[#127c8c] to-[#0e5f6b] text-white shadow-md'
              : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'">
            @if (isActive(tab.id)) {
              <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent sm:rounded-xl">
                <div class="h-full w-full -translate-x-full animate-[shine_3s_infinite]"></div>
              </div>
            }

            <div class="relative z-10 flex h-full w-full items-center justify-center gap-2 px-1">
              @if (tab.icon) {
                <span class="flex h-4 w-4 items-center justify-center sm:h-[18px] sm:w-[18px]">
                  <svg viewBox="0 0 24 24" class="h-full w-full" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" aria-hidden="true">
                    <path [attr.d]="iconPath(tab.icon)"></path>
                  </svg>
                </span>
              }
              <span class="whitespace-nowrap transition-transform duration-300 group-hover/tab:scale-105">{{ tab.labelKey | translate }}</span>
              @if (tab.count !== undefined) {
                <span
                  class="flex h-[16px] min-w-[20px] items-center justify-center rounded-full px-1.5 text-[9px] font-bold transition-all duration-300 sm:h-[18px] sm:min-w-[22px] sm:text-[10px]"
                  [class]="isActive(tab.id) ? 'bg-white/20 text-white' : 'bg-slate-200/50 text-slate-500'">
                  {{ tab.count }}
                </span>
              }
              @if (tab.attention) {
                <span class="h-2 w-2 rounded-full bg-red-500"></span>
              }
            </div>
          </button>
        }

        <div class="h-1 w-1 shrink-0"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    @keyframes shine {
      100% {
        transform: translateX(100%);
      }
    }
  `]
})
export class DetailTabsNavComponent {
  @Input() tabs: DetailTabNavItem[] = [];
  @Input() activeTab = '';
  @Output() tabChange = new EventEmitter<string>();

  private readonly iconMap: Record<string, string> = {
    storefront: 'M3.75 9h16.5M5.25 9V6.75A1.5 1.5 0 0 1 6.75 5.25h10.5a1.5 1.5 0 0 1 1.5 1.5V9m-12 0v8.25A1.5 1.5 0 0 0 8.25 18.75h7.5a1.5 1.5 0 0 0 1.5-1.5V9m-7.5 9.75v-4.5h4.5v4.5',
    person: 'M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a7.5 7.5 0 0 1 15 0',
    location_on: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm4.5 0c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
    verified_user: 'M9 12.75 11.25 15 15 9.75M12 3l7.5 3v6c0 4.142-3.358 7.5-7.5 9-4.142-1.5-7.5-4.858-7.5-9V6L12 3Z',
    account_balance_wallet: 'M3.75 7.5A2.25 2.25 0 0 1 6 5.25h11.25A2.25 2.25 0 0 1 19.5 7.5v1.125m-15.75 0h15.75m0 0v7.875A2.25 2.25 0 0 1 17.25 18.75H6A2.25 2.25 0 0 1 3.75 16.5V8.625Zm12 4.125h.008v.008h-.008v-.008Z',
    schedule: 'M12 6v6l3.75 2.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    support_agent: 'M12 13.5c2.071 0 3.75-1.679 3.75-3.75S14.071 6 12 6 8.25 7.679 8.25 9.75 9.929 13.5 12 13.5Zm0 0c-3.106 0-5.625 2.015-5.625 4.5v.75h11.25V18c0-2.485-2.519-4.5-5.625-4.5ZM6 10.5H4.5A1.5 1.5 0 0 1 3 9V7.5A1.5 1.5 0 0 1 4.5 6H6m12 4.5h1.5A1.5 1.5 0 0 0 21 9V7.5A1.5 1.5 0 0 0 19.5 6H18',
    menu_book: 'M5.25 4.5h10.5A2.25 2.25 0 0 1 18 6.75v10.5A2.25 2.25 0 0 0 15.75 15H5.25A2.25 2.25 0 0 0 3 17.25V6.75A2.25 2.25 0 0 1 5.25 4.5Zm0 0A2.25 2.25 0 0 0 3 6.75v10.5A2.25 2.25 0 0 1 5.25 15H18m-9.75-7.5h4.5'
  };

  isActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }

  iconPath(iconName?: string): string {
    if (!iconName) {
      return '';
    }

    return this.iconMap[iconName] ?? 'M12 6v6l3.75 2.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
  }

  onTabClick(tabId: string): void {
    this.tabChange.emit(tabId);
  }
}
