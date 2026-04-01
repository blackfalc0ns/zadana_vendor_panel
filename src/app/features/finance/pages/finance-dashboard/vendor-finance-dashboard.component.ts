import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppCardComponent } from '../../../../shared/components/ui/card/card.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
  VendorFinancePeriod,
  VendorFinanceService,
  VendorFinanceSnapshot,
  VendorLedgerEntry,
  VendorSettlement
} from '../../services/vendor-finance.service';

@Component({
  selector: 'app-vendor-finance-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, AppCardComponent, AppButtonComponent, AppPanelHeaderComponent, AppPageHeaderComponent],
  template: `
    <div class="flex flex-col gap-4 animate-in fade-in duration-500" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <app-page-header
        [title]="'VENDOR_FINANCE.TITLE' | translate"
        [description]="'VENDOR_FINANCE.SUBTITLE' | translate"
        customClass="mb-0"
      >
        <div actions class="flex flex-wrap items-center gap-2">
          <div class="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              *ngFor="let item of periods"
              type="button"
              (click)="setPeriod(item.value)"
              class="rounded-lg px-3 py-1.5 text-[10px] font-black transition-all duration-200"
              [ngClass]="currentPeriod === item.value ? 'bg-zadna-primary text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
            >
              {{ item.labelKey | translate }}
            </button>
          </div>

          <app-button
            variant="outline"
            size="sm"
            customClass="!h-9 !rounded-xl !border-slate-200 !bg-white !px-4 !text-[10px] !text-slate-700"
          >
            {{ 'VENDOR_FINANCE.ACTIONS.DOWNLOAD_STATEMENT' | translate }}
          </app-button>
        </div>
      </app-page-header>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <app-card rounded="2xl" padding="sm" customClass="border-slate-200/80">
          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{{ 'VENDOR_FINANCE.OVERVIEW.AVAILABLE_BALANCE' | translate }}</p>
          <div class="mt-3 flex items-end justify-between gap-3">
            <div>
              <p class="text-2xl font-black tracking-tight text-slate-900">{{ formatCurrency(snapshot?.availableBalance || 0) }}</p>
              <p class="mt-1.5 text-[11px] font-bold text-emerald-600">{{ 'VENDOR_FINANCE.OVERVIEW.READY_FOR_TRANSFER' | translate }}</p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <span class="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
          </div>
        </app-card>

        <app-card rounded="2xl" padding="sm" customClass="border-slate-200/80">
          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{{ 'VENDOR_FINANCE.OVERVIEW.PENDING_SETTLEMENT' | translate }}</p>
          <div class="mt-3 flex items-end justify-between gap-3">
            <div>
              <p class="text-2xl font-black tracking-tight text-slate-900">{{ formatCurrency(snapshot?.pendingSettlement || 0) }}</p>
              <p class="mt-1.5 text-[11px] font-bold text-amber-600">{{ 'VENDOR_FINANCE.OVERVIEW.IN_NEXT_CYCLE' | translate }}</p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <span class="material-symbols-outlined text-[18px]">schedule</span>
            </div>
          </div>
        </app-card>

        <app-card rounded="2xl" padding="sm" customClass="border-slate-200/80">
          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{{ 'VENDOR_FINANCE.OVERVIEW.PAYOUT_PROFILE' | translate }}</p>
          <div class="mt-3 space-y-1.5">
            <p class="text-sm font-black text-slate-900">{{ snapshot?.payoutMethod }}</p>
            <p class="text-[11px] font-bold text-slate-500">{{ 'VENDOR_FINANCE.OVERVIEW.NEXT_PAYOUT' | translate }}: {{ formatDate(snapshot?.nextPayoutDate) }}</p>
            <p class="text-[11px] font-bold text-rose-500">{{ 'VENDOR_FINANCE.OVERVIEW.HOLD_AMOUNT' | translate }}: {{ formatCurrency(snapshot?.holdAmount || 0) }}</p>
          </div>
        </app-card>
      </div>

      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <app-card *ngFor="let kpi of snapshot?.kpis || []" rounded="2xl" padding="sm" customClass="border-slate-200/70">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{{ kpi.labelKey | translate }}</p>
              <p class="mt-2 text-xl font-black tracking-tight text-slate-900">{{ formatCurrency(kpi.value) }}</p>
            </div>
            <span class="rounded-full px-2 py-1 text-[9px] font-black" [ngClass]="getDeltaClass(kpi.trend, kpi.tone)">
              {{ kpi.trend === 'up' ? '+' : '' }}{{ kpi.delta }}%
            </span>
          </div>
        </app-card>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <app-card class="xl:col-span-7" rounded="2xl" padding="sm" customClass="border-slate-200/80">
          <app-panel-header
            [title]="'VENDOR_FINANCE.CHART.TITLE'"
            [subtitle]="'VENDOR_FINANCE.CHART.SUBTITLE'"
            containerClass="mb-4 border-b border-slate-100 pb-4"
            contentClass="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            titleClass="text-base font-black text-slate-900"
            subtitleClass="mt-1 text-[11px] font-bold text-slate-500"
          >
            <div actions class="flex items-center gap-3 text-[10px] font-black">
              <span class="flex items-center gap-1.5 text-zadna-primary"><span class="h-2 w-2 rounded-full bg-zadna-primary"></span>{{ 'VENDOR_FINANCE.CHART.SALES' | translate }}</span>
              <span class="flex items-center gap-1.5 text-emerald-600"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>{{ 'VENDOR_FINANCE.CHART.PAYOUTS' | translate }}</span>
            </div>
          </app-panel-header>

          <div class="space-y-3">
            <div *ngFor="let point of snapshot?.trend || []" class="space-y-1.5">
              <div class="flex items-center justify-between text-[10px] font-black text-slate-500">
                <span>{{ getMonthLabel(point.label) }}</span>
                <span>{{ formatCurrency(point.sales) }}</span>
              </div>
              <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-zadna-primary/90" [style.width.%]="getBarWidth(point.sales)"></div>
              </div>
              <div class="flex items-center justify-between text-[10px] font-black text-slate-400">
                <span>{{ 'VENDOR_FINANCE.CHART.PAYOUTS' | translate }}</span>
                <span>{{ formatCurrency(point.payout) }}</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-emerald-50">
                <div class="h-full rounded-full bg-emerald-500" [style.width.%]="getBarWidth(point.payout)"></div>
              </div>
            </div>
          </div>
        </app-card>

        <app-card class="xl:col-span-5" rounded="2xl" padding="sm" customClass="border-slate-200/80">
          <app-panel-header
            [title]="'VENDOR_FINANCE.SETTLEMENTS.TITLE'"
            [subtitle]="'VENDOR_FINANCE.SETTLEMENTS.SUBTITLE'"
            containerClass="mb-4 border-b border-slate-100 pb-4"
            contentClass="flex items-center justify-between gap-3"
            titleClass="text-base font-black text-slate-900"
            subtitleClass="mt-1 text-[11px] font-bold text-slate-500"
          ></app-panel-header>

          <div class="space-y-2.5">
            <div *ngFor="let settlement of snapshot?.settlements || []" class="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[13px] font-black text-slate-900">{{ settlement.code }}</p>
                  <p class="mt-1 text-[11px] font-bold text-slate-500">{{ formatDate(settlement.date) }} • {{ settlement.ordersCount }} {{ 'VENDOR_FINANCE.SETTLEMENTS.ORDERS' | translate }}</p>
                </div>
                <span class="rounded-full px-2 py-1 text-[9px] font-black" [ngClass]="getSettlementClass(settlement)">
                  {{ getSettlementLabel(settlement) | translate }}
                </span>
              </div>
              <div class="mt-3 text-lg font-black tracking-tight text-slate-900">{{ formatCurrency(settlement.amount) }}</div>
            </div>
          </div>
        </app-card>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <app-card class="xl:col-span-7" rounded="2xl" padding="none" customClass="border-slate-200/80 overflow-hidden">
          <app-panel-header
            [title]="'VENDOR_FINANCE.LEDGER.TITLE'"
            [subtitle]="'VENDOR_FINANCE.LEDGER.SUBTITLE'"
            containerClass="border-b border-slate-100 px-4 py-4"
            contentClass="flex items-center justify-between gap-3"
            titleClass="text-base font-black text-slate-900"
            subtitleClass="mt-1 text-[11px] font-bold text-slate-500"
          ></app-panel-header>

          <div class="divide-y divide-slate-100">
            <div *ngFor="let entry of snapshot?.ledger || []" class="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p class="text-[13px] font-black text-slate-900">{{ currentLang === 'ar' ? entry.titleAr : entry.titleEn }}</p>
                <p class="mt-1 text-[11px] font-bold text-slate-500">{{ formatDate(entry.date) }} • {{ entry.reference }}</p>
              </div>
              <div class="text-end">
                <p class="text-[13px] font-black" [ngClass]="entry.direction === 'in' ? 'text-emerald-600' : 'text-rose-500'">
                  {{ entry.direction === 'in' ? '+' : '-' }}{{ formatCurrency(entry.amount) }}
                </p>
                <p class="mt-1 text-[10px] font-black text-slate-400">{{ getLedgerLabel(entry) | translate }}</p>
              </div>
            </div>
          </div>
        </app-card>

        <app-card class="xl:col-span-5" rounded="2xl" padding="sm" customClass="border-slate-200/80">
          <app-panel-header
            [title]="'VENDOR_FINANCE.ALERTS.TITLE'"
            [subtitle]="'VENDOR_FINANCE.ALERTS.SUBTITLE'"
            containerClass="mb-4 border-b border-slate-100 pb-4"
            contentClass="flex items-center justify-between gap-3"
            titleClass="text-base font-black text-slate-900"
            subtitleClass="mt-1 text-[11px] font-bold text-slate-500"
          >
            <span actions class="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-600">
              {{ (snapshot?.alerts || []).length }}
            </span>
          </app-panel-header>

          <div class="space-y-2.5">
            <div *ngFor="let alert of snapshot?.alerts || []" class="rounded-xl border p-3" [ngClass]="getAlertClass(alert.severity)">
              <p class="text-[13px] font-black">{{ alert.titleKey | translate }}</p>
              <p class="mt-1.5 text-[11px] font-bold opacity-80">{{ alert.bodyKey | translate }}</p>
              <button type="button" class="mt-2 text-[11px] font-black underline underline-offset-4">
                {{ alert.actionLabelKey | translate }}
              </button>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `
})
export class VendorFinanceDashboardComponent implements OnInit {
  private financeService = inject(VendorFinanceService);
  private translate = inject(TranslateService);

  snapshot: VendorFinanceSnapshot | null = null;
  currentPeriod: VendorFinancePeriod = 'month';
  currentLang = this.translate.currentLang || 'ar';

  periods = [
    { labelKey: 'VENDOR_FINANCE.PERIODS.TODAY', value: 'today' as VendorFinancePeriod },
    { labelKey: 'VENDOR_FINANCE.PERIODS.WEEK', value: 'week' as VendorFinancePeriod },
    { labelKey: 'VENDOR_FINANCE.PERIODS.MONTH', value: 'month' as VendorFinancePeriod },
    { labelKey: 'VENDOR_FINANCE.PERIODS.QUARTER', value: 'quarter' as VendorFinancePeriod }
  ];

  ngOnInit(): void {
    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });
    this.loadData();
  }

  setPeriod(period: VendorFinancePeriod): void {
    this.currentPeriod = period;
    this.loadData();
  }

  private loadData(): void {
    this.financeService.getSnapshot(this.currentPeriod).subscribe((snapshot) => {
      this.snapshot = snapshot;
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ` ${this.translate.instant('COMMON.CURRENCY')}`;
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleDateString(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getBarWidth(value: number): number {
    const max = Math.max(...(this.snapshot?.trend || []).map((item) => Math.max(item.sales, item.payout)), 1);
    return (value / max) * 100;
  }

  getMonthLabel(month: string): string {
    return this.translate.instant(`VENDOR_FINANCE.MONTHS.${month.toUpperCase()}`);
  }

  getDeltaClass(trend: 'up' | 'down', tone: string): string {
    if (trend === 'down' && tone === 'warning') {
      return 'bg-emerald-50 text-emerald-700';
    }

    if (tone === 'danger') {
      return 'bg-rose-50 text-rose-600';
    }

    if (tone === 'success') {
      return 'bg-emerald-50 text-emerald-700';
    }

    if (tone === 'warning') {
      return 'bg-amber-50 text-amber-700';
    }

    return 'bg-zadna-primary/10 text-zadna-primary';
  }

  getSettlementClass(settlement: VendorSettlement): string {
    if (settlement.status === 'paid') {
      return 'bg-emerald-50 text-emerald-700';
    }

    if (settlement.status === 'processing') {
      return 'bg-amber-50 text-amber-700';
    }

    return 'bg-blue-50 text-blue-700';
  }

  getSettlementLabel(settlement: VendorSettlement): string {
    if (settlement.status === 'paid') {
      return 'VENDOR_FINANCE.SETTLEMENTS.PAID';
    }

    if (settlement.status === 'processing') {
      return 'VENDOR_FINANCE.SETTLEMENTS.PROCESSING';
    }

    return 'VENDOR_FINANCE.SETTLEMENTS.SCHEDULED';
  }

  getLedgerLabel(entry: VendorLedgerEntry): string {
    return `VENDOR_FINANCE.LEDGER.${entry.type.toUpperCase()}`;
  }

  getAlertClass(severity: 'info' | 'warning' | 'critical'): string {
    if (severity === 'critical') {
      return 'border-rose-200 bg-rose-50 text-rose-700';
    }

    if (severity === 'warning') {
      return 'border-amber-200 bg-amber-50 text-amber-800';
    }

    return 'border-blue-200 bg-blue-50 text-blue-700';
  }
}
