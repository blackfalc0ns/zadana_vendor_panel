import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppCardComponent } from '../../../../shared/components/ui/card/card.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
  VendorFinancePeriod,
  VendorFinanceSnapshot,
  VendorLedgerEntry,
  VendorSettlement
} from '../../models/vendor-finance.models';
import { VendorFinanceService } from '../../services/vendor-finance.service';

@Component({
  selector: 'app-vendor-finance-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, AppCardComponent, AppButtonComponent, AppPanelHeaderComponent, AppPageHeaderComponent],
  template: `
    <div class="min-h-full bg-[#FAFAFA] pb-12 font-sans" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- Top Header / Balance Banner -->
      <div class="border-b border-slate-200 bg-white px-6 py-8">
        <div class="mx-auto max-w-7xl flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div class="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-slate-500 mb-2 uppercase">
              <span>{{ 'VENDOR_FINANCE.TITLE' | translate }}</span>
              <span class="text-slate-300">•</span>
              <span class="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Status</span>
            </div>
            <h1 class="text-4xl font-bold tracking-tight text-slate-900">{{ formatCurrency(snapshot?.availableBalance || 0) }}</h1>
            <p class="mt-2 text-[13px] font-medium text-slate-500">{{ 'VENDOR_FINANCE.OVERVIEW.AVAILABLE_BALANCE' | translate }} • {{ 'VENDOR_FINANCE.OVERVIEW.READY_FOR_TRANSFER' | translate }}</p>
          </div>
          
          <div class="flex flex-col items-end gap-4">
            <div class="flex items-center rounded-lg border border-slate-200 bg-slate-50/50 p-1 shadow-sm">
              <button
                *ngFor="let item of periods"
                (click)="setPeriod(item.value)"
                class="rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all"
                [ngClass]="currentPeriod === item.value ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'"
              >
                {{ item.labelKey | translate }}
              </button>
            </div>
            <div class="flex gap-2.5">
              <button class="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors">
                View Reports
              </button>
              <button class="inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-4 text-[11px] font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors">
                <span class="material-symbols-outlined mr-1.5 text-[14px]">download</span>
                {{ 'VENDOR_FINANCE.ACTIONS.DOWNLOAD_STATEMENT' | translate }}
              </button>
            </div>
          </div>
        </div>

        <!-- Secondary Metrics Row within Banner -->
        <div class="mx-auto max-w-7xl mt-8 grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 pt-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:rtl:divide-x-reverse">
          <div class="px-4 py-3 sm:px-0 sm:pr-8 sm:py-0">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{{ 'VENDOR_FINANCE.OVERVIEW.PENDING_SETTLEMENT' | translate }}</p>
            <p class="mt-1.5 text-xl font-bold tracking-tight text-slate-900">{{ formatCurrency(snapshot?.pendingSettlement || 0) }}</p>
          </div>
          <div class="px-4 py-3 sm:px-8 sm:py-0">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{{ 'VENDOR_FINANCE.OVERVIEW.NEXT_PAYOUT' | translate }}</p>
            <p class="mt-1.5 text-sm font-bold text-slate-900">{{ formatDate(snapshot?.nextPayoutDate) }}</p>
            <p class="mt-1 text-[11px] font-medium text-slate-500">Method: <span class="text-slate-700">{{ snapshot?.payoutMethod }}</span></p>
          </div>
          <div class="px-4 py-3 sm:px-8 sm:py-0">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{{ 'VENDOR_FINANCE.OVERVIEW.HOLD_AMOUNT' | translate }}</p>
            <p class="mt-1.5 text-sm font-bold text-rose-600">{{ formatCurrency(snapshot?.holdAmount || 0) }}</p>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        <!-- Bento Grid Layout -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          <!-- Main Chart Area (Spans 2 columns) -->
          <div class="rounded-[16px] border border-slate-200 bg-white shadow-sm lg:col-span-2 overflow-hidden">
            <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/30 px-6 py-5">
              <h2 class="text-sm font-bold tracking-tight text-slate-900">{{ 'VENDOR_FINANCE.CHART.TITLE' | translate }}</h2>
              <div class="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
                <span class="flex items-center gap-1.5"><div class="h-2.5 w-2.5 rounded-[3px] bg-slate-800"></div>Sales</span>
                <span class="flex items-center gap-1.5"><div class="h-2.5 w-2.5 rounded-[3px] bg-emerald-500"></div>Payouts</span>
              </div>
            </div>
            
            <div class="p-6">
              <!-- KPI Mini-cards above chart -->
              <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div *ngFor="let kpi of snapshot?.kpis || []" class="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-md">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-[11px] font-semibold text-slate-500">{{ kpi.labelKey | translate }}</p>
                    <span class="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold" [ngClass]="getDeltaClass(kpi.trend, kpi.tone)">
                      <span class="material-symbols-outlined text-[12px]">{{ kpi.trend === 'up' ? 'arrow_upward' : 'arrow_downward' }}</span>
                      {{ kpi.delta }}%
                    </span>
                  </div>
                  <p class="text-base font-bold tracking-tight text-slate-900">{{ formatCurrency(kpi.value) }}</p>
                </div>
              </div>

              <!-- Bar Chart -->
              <div class="flex h-[200px] items-end gap-3 sm:gap-6 border-b border-slate-100 pb-2">
                <div *ngFor="let point of snapshot?.trend || []" class="group relative flex flex-1 flex-col justify-end h-full">
                  <!-- Tooltip -->
                  <div class="absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-center text-[11px] font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100 z-10 pointer-events-none whitespace-nowrap">
                    <span class="text-slate-300">Sales:</span> {{ formatCurrency(point.sales) }} <br/>
                    <span class="text-slate-300">Payouts:</span> {{ formatCurrency(point.payout) }}
                  </div>
                  <!-- Bars -->
                  <div class="relative flex w-full flex-col justify-end h-full items-center gap-1.5">
                    <div class="w-full max-w-[28px] rounded-t-md bg-slate-800 transition-colors duration-300 group-hover:bg-zadna-primary" [style.height.%]="getBarWidth(point.sales)"></div>
                    <div class="w-full max-w-[28px] rounded-t-md bg-emerald-500 transition-colors duration-300 group-hover:bg-emerald-400" [style.height.%]="getBarWidth(point.payout)"></div>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between mt-3 gap-3 sm:gap-6 px-1">
                <div *ngFor="let point of snapshot?.trend || []" class="flex-1 text-center">
                  <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{{ getMonthLabel(point.label) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Alerts & Lifecycle -->
          <div class="flex flex-col gap-6">
            <!-- Alerts Component -->
            <div class="rounded-[16px] border border-slate-200 bg-white shadow-sm flex-1 overflow-hidden">
              <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/30 px-6 py-5">
                <h2 class="text-sm font-bold tracking-tight text-slate-900">Action Required</h2>
                <span class="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">{{ (snapshot?.alerts || []).length }}</span>
              </div>
              <div class="p-3">
                <div *ngIf="(snapshot?.alerts || []).length === 0" class="flex h-40 items-center justify-center text-[12px] font-medium text-slate-400">
                  <div class="text-center">
                    <span class="material-symbols-outlined text-[32px] text-slate-200 mb-2 block">task_alt</span>
                    No pending actions.
                  </div>
                </div>
                <div *ngFor="let alert of snapshot?.alerts || []" class="mx-2 my-2.5 rounded-xl border-l-[3px] bg-slate-50/50 p-4 transition-colors hover:bg-slate-50" [ngClass]="getAlertClass(alert.severity)">
                  <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined text-[18px] mt-0.5">{{ alert.severity === 'critical' ? 'error' : (alert.severity === 'warning' ? 'warning' : 'info') }}</span>
                    <div>
                      <p class="text-[13px] font-bold text-slate-900">{{ alert.titleKey | translate }}</p>
                      <p class="mt-1 text-[11px] font-medium text-slate-600 leading-relaxed">{{ alert.bodyKey | translate }}</p>
                      <button class="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 transition-colors">
                        {{ alert.actionLabelKey | translate }}
                        <span class="material-symbols-outlined text-[12px] rtl:rotate-180">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dense Data Tables Section -->
        <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          <!-- Ledger Table -->
          <div class="rounded-[16px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
              <h2 class="text-sm font-bold tracking-tight text-slate-900">Recent Transactions</h2>
              <button class="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">View all</button>
            </div>
            <table class="w-full text-left text-[13px]">
              <thead class="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th class="px-6 py-3 font-semibold">Description</th>
                  <th class="px-6 py-3 font-semibold">Date</th>
                  <th class="px-6 py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 bg-white">
                <tr *ngIf="(snapshot?.ledger || []).length === 0">
                  <td colspan="3" class="px-6 py-10 text-center text-[12px] font-medium text-slate-400">No transactions found.</td>
                </tr>
                <tr *ngFor="let entry of snapshot?.ledger || []" class="group hover:bg-slate-50/80 transition-colors">
                  <td class="px-6 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all" [ngClass]="entry.direction === 'in' ? '!bg-emerald-50 !text-emerald-600' : ''">
                        <span class="material-symbols-outlined text-[16px]">{{ entry.direction === 'in' ? 'arrow_downward' : 'arrow_upward' }}</span>
                      </div>
                      <div>
                        <p class="font-bold text-slate-900">{{ currentLang === 'ar' ? entry.titleAr : entry.titleEn }}</p>
                        <p class="text-[11px] text-slate-500 font-mono mt-0.5">{{ entry.reference }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-3.5 text-[12px] font-medium text-slate-500">{{ formatDate(entry.date) }}</td>
                  <td class="px-6 py-3.5 text-right">
                    <p class="font-bold tracking-tight" [ngClass]="entry.direction === 'in' ? 'text-emerald-600' : 'text-slate-900'">
                      {{ entry.direction === 'in' ? '+' : '-' }}{{ formatCurrency(entry.amount) }}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Settlements Table -->
          <div class="rounded-[16px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
              <h2 class="text-sm font-bold tracking-tight text-slate-900">Upcoming Settlements</h2>
              <button class="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Details</button>
            </div>
            <table class="w-full text-left text-[13px]">
              <thead class="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th class="px-6 py-3 font-semibold">Batch ID</th>
                  <th class="px-6 py-3 font-semibold">Status</th>
                  <th class="px-6 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 bg-white">
                <tr *ngIf="(snapshot?.settlements || []).length === 0">
                  <td colspan="3" class="px-6 py-10 text-center text-[12px] font-medium text-slate-400">No settlements scheduled.</td>
                </tr>
                <tr *ngFor="let settlement of snapshot?.settlements || []" class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-6 py-3.5">
                    <p class="font-bold text-slate-900">{{ settlement.code }}</p>
                    <p class="text-[11px] font-medium text-slate-500 mt-0.5">{{ formatDate(settlement.date) }}</p>
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold border" [ngClass]="getSettlementClass(settlement)">
                      {{ getSettlementLabel(settlement) | translate }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5 text-right font-bold tracking-tight text-slate-900">
                    {{ formatCurrency(settlement.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  `

})
export class VendorFinanceDashboardComponent implements OnInit {
  private financeService = inject(VendorFinanceService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);

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
    const period = this.route.snapshot.queryParamMap.get('period');
    if (period === 'today' || period === 'week' || period === 'month' || period === 'quarter') {
      this.currentPeriod = period;
    }
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
      return 'bg-rose-50 text-rose-700';
    }

    if (tone === 'success') {
      return 'bg-emerald-50 text-emerald-700';
    }

    if (tone === 'warning') {
      return 'bg-amber-50 text-amber-700';
    }

    return 'bg-slate-50 text-slate-700';
  }

  getSettlementClass(settlement: VendorSettlement): string {
    if (settlement.status === 'paid') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (settlement.status === 'processing') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-slate-100 text-slate-700 border-slate-200';
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
      return 'border-rose-300 text-rose-800';
    }

    if (severity === 'warning') {
      return 'border-amber-300 text-amber-800';
    }

    return 'border-slate-300 text-slate-800';
  }
}
