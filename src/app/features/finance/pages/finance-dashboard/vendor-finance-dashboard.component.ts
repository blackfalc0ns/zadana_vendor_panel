import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppCardComponent } from '../../../../shared/components/ui/card/card.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
 VendorFinanceLedgerPage,
 VendorFinancePeriod,
 VendorFinanceSnapshot,
 VendorLedgerEntry,
 VendorSettlement
} from '../../models/vendor-finance.models';
import { VendorFinanceService } from '../../services/vendor-finance.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { AlertModalService } from '../../../../core/notifications/services/alert-modal.service';

@Component({
 changeDetection: ChangeDetectionStrategy.OnPush,
 selector: 'app-vendor-finance-dashboard',
 standalone: true,
 imports: [CommonModule, TranslateModule, AppCardComponent, AppButtonComponent, AppPanelHeaderComponent, AppPageHeaderComponent, BaseChartDirective],
 providers: [provideCharts(withDefaultRegisterables())],
 templateUrl: './vendor-finance-dashboard.component.html',
 styleUrl: './vendor-finance-dashboard.component.scss'
})
export class VendorFinanceDashboardComponent implements OnInit {
 private readonly cdr = inject(ChangeDetectorRef);
 private readonly destroyRef = inject(DestroyRef);
 private financeService = inject(VendorFinanceService);
 private translate = inject(TranslateService);
 private route = inject(ActivatedRoute);
 private router = inject(Router);
 private alertModalService = inject(AlertModalService);

 snapshot: VendorFinanceSnapshot | null = null;
 ledgerPage: VendorFinanceLedgerPage | null = null;
 isLoading = true;
 currentPeriod: VendorFinancePeriod = 'month';
 selectedBranchId: string | null = null;
 currentLang = this.translate.currentLang || 'ar';
 readonly ledgerPageSize = 10;

 periods = [
 { labelKey: 'VENDOR_FINANCE.PERIODS.TODAY', value: 'today' as VendorFinancePeriod },
 { labelKey: 'VENDOR_FINANCE.PERIODS.WEEK', value: 'week' as VendorFinancePeriod },
 { labelKey: 'VENDOR_FINANCE.PERIODS.MONTH', value: 'month' as VendorFinancePeriod },
 { labelKey: 'VENDOR_FINANCE.PERIODS.QUARTER', value: 'quarter' as VendorFinancePeriod }
 ];

 public barChartOptions: ChartConfiguration<'bar' | 'line'>['options'] = {
 responsive: true,
 maintainAspectRatio: false,
 scales: {
 x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 700 } } },
 y: {
 grid: { color: 'rgba(148,163,184,0.18)' },
 border: { display: false },
 ticks: {
 color: '#94a3b8',
 callback: (value) => this.formatCompactNumber(Number(value))
 }
 }
 },
 plugins: {
 legend: {
 display: true,
 position: 'top',
 align: 'start',
 labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 10, color: '#0f172a', font: { weight: 700 } }
 },
 tooltip: {
 mode: 'index',
 intersect: false,
 backgroundColor: 'rgba(15, 23, 42, 0.94)',
 titleFont: { weight: 700 },
 bodyFont: { weight: 600 },
 padding: 12,
 callbacks: {
 label: (context) => `${context.dataset.label}: ${this.formatCurrency(Number(context.raw ?? 0))}`
 }
 }
 }
 };
 public barChartType = 'bar' as const;
 public barChartData: ChartConfiguration<'bar' | 'line'>['data'] = {
 labels: [],
 datasets: []
 };

 ngOnInit(): void {
 this.translate.onLangChange.subscribe((event) => {
 this.cdr.markForCheck();
 this.currentLang = event.lang;
 this.updateChartData();
 });

 const period = this.route.snapshot.queryParamMap.get('period');
 if (period === 'today' || period === 'week' || period === 'month' || period === 'quarter') {
 this.currentPeriod = period;
 }

 const branchId = this.route.snapshot.queryParamMap.get('branchId');
 this.selectedBranchId = branchId?.trim() || null;

 this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
 const nextPeriod = params.get('period');
 const nextBranchId = params.get('branchId')?.trim() || null;
 let shouldReload = false;

 if (
 nextPeriod === 'today'
 || nextPeriod === 'week'
 || nextPeriod === 'month'
 || nextPeriod === 'quarter'
 ) {
 if (this.currentPeriod!== nextPeriod) {
 this.currentPeriod = nextPeriod;
 shouldReload = true;
 }
 }

 if (this.selectedBranchId!== nextBranchId) {
 this.selectedBranchId = nextBranchId;
 shouldReload = true;
 }

 if (shouldReload) {
 this.ledgerPage = null;
 this.loadData();
 }
 });

 this.loadData();
 }

 setPeriod(period: VendorFinancePeriod): void {
 if (this.currentPeriod === period) {
 return;
 }

 this.currentPeriod = period;
 this.ledgerPage = null;
 this.syncQueryParams();
 this.loadData();
 }

 setBranch(branchId: string | null): void {
 const normalized = branchId?.trim() || null;
 if (this.selectedBranchId === normalized) {
 return;
 }

 this.selectedBranchId = normalized;
 this.ledgerPage = null;
 this.syncQueryParams();
 this.loadData();
 }

 get canSelectBranch(): boolean {
 return!!this.snapshot?.branchScope?.canSelectBranch;
 }

 get branchOptions() {
 return this.snapshot?.branchScope?.branches ?? [];
 }

 get branchSections() {
 return this.snapshot?.branchSections ?? [];
 }

 get showBranchBreakdown(): boolean {
 return this.canSelectBranch &&!this.selectedBranchId && this.branchSections.length > 0;
 }

 get showWalletScopeHint(): boolean {
 return this.canSelectBranch &&!this.selectedBranchId;
 }

 isBranchSelected(branchId: string | null): boolean {
 return (this.selectedBranchId ?? null) === (branchId ?? null);
 }

 private syncQueryParams(): void {
 void this.router.navigate([], {
 relativeTo: this.route,
 queryParams: {
 period: this.currentPeriod,
 branchId: this.selectedBranchId || null
 },
 queryParamsHandling: 'merge',
 replaceUrl: false
 });
 }

 private loadData(): void {
 this.isLoading = true;
 this.financeService.getSnapshot(this.currentPeriod, this.selectedBranchId).subscribe((snapshot) => {
 this.cdr.markForCheck();
 this.snapshot = snapshot;
 if (snapshot.branchScope?.selectedBranchId!== undefined) {
 this.selectedBranchId = snapshot.branchScope.selectedBranchId ?? null;
 } else if (!snapshot.branchScope?.canSelectBranch && snapshot.branchScope?.branches.length === 1) {
 this.selectedBranchId = snapshot.branchScope.branches[0]?.id ?? null;
 }
 this.isLoading = false;
 this.updateChartData();
 });

 this.loadLedgerPage(1);
 }

 loadLedgerPage(page: number): void {
 this.financeService.getLedger(this.currentPeriod, page, this.ledgerPageSize, this.selectedBranchId).subscribe((ledgerPage) => {
 this.cdr.markForCheck();
 this.ledgerPage = ledgerPage;
 });
 }

 goToPreviousLedgerPage(): void {
 if (!this.canGoToPreviousLedgerPage()) {
 return;
 }

 this.loadLedgerPage((this.ledgerPage?.page ?? 1) - 1);
 }

 goToNextLedgerPage(): void {
 if (!this.canGoToNextLedgerPage()) {
 return;
 }

 this.loadLedgerPage((this.ledgerPage?.page ?? 1) + 1);
 }

 canGoToPreviousLedgerPage(): boolean {
 return (this.ledgerPage?.page ?? 1) > 1;
 }

 canGoToNextLedgerPage(): boolean {
 if (!this.ledgerPage) {
 return false;
 }

 return this.ledgerPage.page < this.ledgerPage.totalPages;
 }

 getLedgerItems(): VendorLedgerEntry[] {
 return this.ledgerPage?.items ?? this.snapshot?.ledger ?? [];
 }

 getLedgerPaginationLabel(): string {
 if (!this.ledgerPage || this.ledgerPage.totalPages <= 1) {
 return '';
 }

 return this.translate.instant('VENDOR_FINANCE.LEDGER.PAGE_STATUS', {
 page: this.ledgerPage.page,
 totalPages: this.ledgerPage.totalPages
 });
 }

 private updateChartData(): void {
 if (!this.snapshot?.trend) {
 return;
 }

 this.barChartData = {
 labels: this.snapshot.trend.map((point) => this.formatTrendLabel(point.label)),
 datasets: [
 {
 type: 'bar',
 data: this.snapshot.trend.map((point) => point.sales),
 label: this.getSalesDatasetLabel(),
 backgroundColor: 'rgba(15, 118, 110, 0.88)',
 hoverBackgroundColor: 'rgba(13, 148, 136, 1)',
 borderRadius: 10,
 borderSkipped: false,
 maxBarThickness: 28
 },
 {
 type: 'line',
 data: this.snapshot.trend.map((point) => point.payout),
 label: this.getPayoutDatasetLabel(),
 borderColor: 'rgba(249, 115, 22, 1)',
 backgroundColor: 'rgba(251, 146, 60, 0.16)',
 pointBackgroundColor: 'rgba(249, 115, 22, 1)',
 pointBorderColor: '#fff',
 pointBorderWidth: 2,
 pointRadius: 4,
 pointHoverRadius: 5,
 fill: true,
 tension: 0.35
 }
 ]
 };
 }

 formatCurrency(value: number): string {
 return new Intl.NumberFormat(this.currentLang === 'ar' ? 'ar-SA' : 'en-US', {
 minimumFractionDigits: 0,
 maximumFractionDigits: 0
 }).format(value) + ` ${this.translate.instant('COMMON.CURRENCY')}`;
 }

 formatDate(value?: string): string {
 if (!value) {
 return '-';
 }

 return new Date(value).toLocaleDateString(this.currentLang === 'ar' ? 'ar-SA' : 'en-US', { timeZone: 'Asia/Riyadh',
 day: 'numeric',
 month: 'short',
 year: 'numeric'
 });
 }

 getBarWidth(value: number): number {
 const max = Math.max(...(this.snapshot?.trend || []).map((item) => Math.max(item.sales, item.payout)), 1);
 return (value / max) * 100;
 }

 getTrendPoints() {
 return this.snapshot?.trend ?? [];
 }

 getTrendPeakSalesLabel(): string {
 const peak = this.getTrendPoints().reduce((best, point) => point.sales > best.sales ? point : best, { label: '', sales: 0, payout: 0 });
 return peak.label ? this.formatTrendLabel(peak.label) : '-';
 }

 getTrendPeakPayoutLabel(): string {
 const peak = this.getTrendPoints().reduce((best, point) => point.payout > best.payout ? point : best, { label: '', sales: 0, payout: 0 });
 return peak.label ? this.formatTrendLabel(peak.label) : '-';
 }

 getTrendTotalSales(): number {
 return this.getTrendPoints().reduce((sum, point) => sum + point.sales, 0);
 }

 getTrendTotalPayouts(): number {
 return this.getTrendPoints().reduce((sum, point) => sum + point.payout, 0);
 }

 getTrendNetGap(): number {
 return this.getTrendTotalSales() - this.getTrendTotalPayouts();
 }

 getTrendAverageSales(): number {
 const points = this.getTrendPoints();
 return points.length ? this.getTrendTotalSales() / points.length : 0;
 }

 getTrendAveragePayouts(): number {
 const points = this.getTrendPoints();
 return points.length ? this.getTrendTotalPayouts() / points.length : 0;
 }

 getTrendShareWidth(value: number): number {
 return this.getBarWidth(value);
 }

 getTrendSpread(point: { sales: number; payout: number }): number {
 return point.sales - point.payout;
 }

 getTrendSpreadClass(point: { sales: number; payout: number }): string {
 return this.getTrendSpread(point) >= 0 ? 'text-emerald-700' : 'text-rose-700';
 }

 formatTrendLabel(label: string): string {
 if (this.isMonthLabel(label)) {
 return this.getMonthLabel(label);
 }

 if (this.isDayLabel(label)) {
 return this.getDayLabel(label);
 }

 return label;
 }

 requestPayout(): void {
 const successMsg = this.translate.instant('VENDOR_FINANCE.ACTIONS.PAYOUT_SUCCESS_MSG') || 'Payout request submitted successfully and is pending review';
 void this.alertModalService.showAlert(successMsg, 'COMMON.SUCCESS', 'success');
 }

 reviewOrders(): void {
 void this.router.navigate(['/orders']);
 }

 getPeriodLabel(period: VendorFinancePeriod): string {
 return this.translate.instant(`VENDOR_FINANCE.PERIODS.${period.toUpperCase()}`);
 }

 getSalesDatasetLabel(): string {
 return this.translate.instant('VENDOR_FINANCE.CHART.SALES');
 }

 getPayoutDatasetLabel(): string {
 return this.translate.instant('VENDOR_FINANCE.CHART.PAYOUTS');
 }

 private getMonthLabel(label: string): string {
 const key = label.slice(0, 3).toUpperCase();
 const translated = this.translate.instant(`VENDOR_FINANCE.MONTHS.${key}`);
 return translated === `VENDOR_FINANCE.MONTHS.${key}` ? label : translated;
 }

 private getDayLabel(label: string): string {
 const key = label.slice(0, 3).toUpperCase();
 const translated = this.translate.instant(`VENDOR_FINANCE.DAYS.${key}`);
 return translated === `VENDOR_FINANCE.DAYS.${key}` ? label : translated;
 }

 private isMonthLabel(label: string): boolean {
 const key = label.slice(0, 3).toUpperCase();
 return ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].includes(key);
 }

 private isDayLabel(label: string): boolean {
 const key = label.slice(0, 3).toUpperCase();
 return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].includes(key);
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

 getLedgerReference(entry: VendorLedgerEntry): string {
 if (entry.reference === 'OrderRevenue') {
 return this.translate.instant('VENDOR_FINANCE.LEDGER.REFERENCES.ORDER_REVENUE');
 }

 if (entry.reference === 'VendorRecovery') {
 return this.translate.instant('VENDOR_FINANCE.LEDGER.REFERENCES.VENDOR_RECOVERY');
 }

 return this.formatReferenceFallback(entry.reference);
 }

 getLedgerDescription(entry: VendorLedgerEntry): string {
 const localized = this.currentLang === 'ar' ? entry.titleAr : entry.titleEn;
 if (localized?.trim()) {
 return localized;
 }

 return this.translate.instant(this.getLedgerLabel(entry));
 }

 getPayoutMethodLabel(method?: string | null): string {
 if (!method) {
 return this.translate.instant('VENDOR_FINANCE.PAYOUT_METHODS.BANK_TRANSFER');
 }

 if (method.toLowerCase().startsWith('bank transfer')) {
 const suffix = method.slice('Bank Transfer'.length).trim();
 const label = this.translate.instant('VENDOR_FINANCE.PAYOUT_METHODS.BANK_TRANSFER');
 return suffix ? `${label} ${suffix}` : label;
 }

 return method;
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

 getKpiLabel(kpi: VendorFinanceSnapshot['kpis'][number]): string {
 const translated = this.translate.instant(kpi.labelKey);
 return translated === kpi.labelKey ? kpi.id : translated;
 }

 private formatReferenceFallback(reference: string): string {
 return reference.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
 }

 private formatCompactNumber(value: number): string {
 return new Intl.NumberFormat(this.currentLang === 'ar' ? 'ar-SA' : 'en-US', {
 notation: 'compact',
 maximumFractionDigits: 1
 }).format(value);
 }
}
