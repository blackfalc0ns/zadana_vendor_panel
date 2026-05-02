import { CommonModule, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { Subject, Subscription, timer } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import {
  VendorDashboardAlertItem,
  VendorDashboardBreakdownSlice,
  VendorDashboardDualTrendPoint,
  VendorDashboardOverview,
  VendorDashboardRankedItem,
  VendorDashboardReviewListItem
} from '../../models/vendor-dashboard.models';
import { VendorDashboardService } from '../../services/vendor-dashboard.service';

Chart.register(...registerables);

interface DashboardNavItem {
  id: string;
  labelKey: string;
}

interface DashboardMetricCard {
  labelKey: string;
  value: any;
  format: 'number' | 'currency' | 'percent' | 'rating' | 'date' | 'text';
  route?: string;
  queryParams?: Record<string, string>;
  tone?: 'primary' | 'warning' | 'critical' | 'success' | 'default';
  delta?: number;
}

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    BaseChartDirective,
    AppPageHeaderComponent,
    AppPanelHeaderComponent
  ],
  providers: [DatePipe, DecimalPipe, PercentPipe],
  templateUrl: './vendor-dashboard.component.html',
  styleUrl: './vendor-dashboard.component.scss'
})
export class VendorDashboardComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  overview: VendorDashboardOverview | null = null;
  isLoading = false;
  dashboardError = '';
  selectedPeriod: 'today' | '7d' | '30d' | '90d' = '7d';
  readonly periods: Array<'today' | '7d' | '30d' | '90d'> = ['today', '7d', '30d', '90d'];
  activeTabId = 'operations';
  readonly sectionNav: DashboardNavItem[] = [
    { id: 'operations', labelKey: 'DASHBOARD.SECTION_NAV.OPERATIONS' },
    { id: 'sales', labelKey: 'DASHBOARD.SECTION_NAV.SALES' },
    { id: 'inventory', labelKey: 'DASHBOARD.SECTION_NAV.INVENTORY' },
    { id: 'offers', labelKey: 'DASHBOARD.SECTION_NAV.OFFERS' },
    { id: 'reviews', labelKey: 'DASHBOARD.SECTION_NAV.REVIEWS' },
    { id: 'finance', labelKey: 'DASHBOARD.SECTION_NAV.FINANCE' },
    { id: 'risk', labelKey: 'DASHBOARD.SECTION_NAV.RISK' },
    { id: 'staff', labelKey: 'DASHBOARD.SECTION_NAV.STAFF' }
  ];

  private readonly destroy$ = new Subject<void>();
  private readonly langSub: Subscription;

  constructor(
    private readonly translate: TranslateService,
    private readonly dashboardService: VendorDashboardService,
    private readonly datePipe: DatePipe,
    private readonly decimalPipe: DecimalPipe,
    private readonly percentPipe: PercentPipe
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });
  }

  ngOnInit(): void {
    this.loadOverview();
    timer(60000, 60000)
      .pipe(
        filter(() => !document.hidden),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.loadOverview(false));
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  setPeriod(period: 'today' | '7d' | '30d' | '90d'): void {
    if (this.selectedPeriod === period) {
      return;
    }

    this.selectedPeriod = period;
    this.loadOverview();
  }

  refreshDashboard(): void {
    this.loadOverview();
  }

  loadOverview(showLoading = true): void {
    if (showLoading) {
      this.isLoading = true;
    }

    this.dashboardService.getOverview(this.selectedPeriod).subscribe({
      next: (overview) => {
        this.overview = overview;
        this.dashboardError = '';
        this.isLoading = false;
      },
      error: () => {
        this.dashboardError = this.translate.instant('DASHBOARD.ERROR');
        this.isLoading = false;
      }
    });
  }

  get lastUpdatedLabel(): string {
    return this.overview?.generatedAtUtc
      ? this.formatDateTime(this.overview.generatedAtUtc)
      : '-';
  }

  get heroCards(): DashboardMetricCard[] {
    if (!this.overview) {
      return [];
    }

    return [
      {
        labelKey: 'DASHBOARD.HERO.PENDING_ORDERS',
        value: this.overview.heroStats.pendingOrders,
        format: 'number',
        route: '/orders',
        queryParams: { status: 'NEW' },
        tone: 'primary'
      },
      {
        labelKey: 'DASHBOARD.HERO.LATE_ORDERS',
        value: this.overview.heroStats.lateOrders,
        format: 'number',
        route: '/orders',
        queryParams: { lateState: 'LATE' },
        tone: 'critical'
      },
      {
        labelKey: 'DASHBOARD.HERO.READY_FOR_PICKUP',
        value: this.overview.heroStats.readyForPickup,
        format: 'number',
        route: '/orders',
        queryParams: { status: 'READY_FOR_PICKUP' },
        tone: 'success'
      },
      {
        labelKey: 'DASHBOARD.HERO.DRIVER_ISSUES',
        value: this.overview.heroStats.driverIssues,
        format: 'number',
        route: '/orders',
        queryParams: { status: 'DRIVER_ASSIGNMENT_IN_PROGRESS' },
        tone: 'warning'
      },
      {
        labelKey: 'DASHBOARD.HERO.OPEN_DISPUTES',
        value: this.overview.heroStats.openDisputes,
        format: 'number',
        route: '/disputes',
        queryParams: { status: 'in_review' },
        tone: 'critical'
      },
      {
        labelKey: 'DASHBOARD.HERO.LOW_STOCK',
        value: this.overview.heroStats.lowStockCritical,
        format: 'number',
        route: '/products',
        queryParams: { stockState: 'low' },
        tone: 'warning'
      }
    ];
  }

  get operationsCards(): DashboardMetricCard[] {
    if (!this.overview) {
      return [];
    }

    return [
      {
        labelKey: 'DASHBOARD.OPERATIONS.PREP_EFFICIENCY',
        value: this.overview.ordersSection.prepEfficiencyScore / 100,
        format: 'percent',
        tone: this.overview.ordersSection.prepEfficiencyScore < 80 ? 'warning' : 'success'
      },
      {
        labelKey: 'DASHBOARD.OPERATIONS.AVG_PREP_TIME',
        value: this.overview.ordersSection.averagePrepTimeMinutes,
        format: 'number'
      }
    ];
  }

  get salesCards(): DashboardMetricCard[] {
    if (!this.overview) {
      return [];
    }

    return [
      {
        labelKey: 'DASHBOARD.SALES.GROSS_SALES',
        value: this.overview.salesSection.data.grossSales,
        format: 'currency',
        delta: this.overview.salesSection.deltas.salesDelta
      },
      {
        labelKey: 'DASHBOARD.SALES.PAID_SALES',
        value: this.overview.salesSection.data.paidSales,
        format: 'currency'
      },
      {
        labelKey: 'DASHBOARD.SALES.ORDERS_COUNT',
        value: this.overview.salesSection.data.ordersCount,
        format: 'number',
        delta: this.overview.salesSection.deltas.ordersDelta
      },
      {
        labelKey: 'DASHBOARD.SALES.AVERAGE_ORDER_VALUE',
        value: this.overview.salesSection.data.averageOrderValue,
        format: 'currency',
        delta: this.overview.salesSection.deltas.averageOrderValueDelta
      },
      {
        labelKey: 'DASHBOARD.SALES.CANCELLATION_RATE',
        value: this.overview.salesSection.data.cancellationRate,
        format: 'percent'
      },
      {
        labelKey: 'DASHBOARD.SALES.REFUND_RATE',
        value: this.overview.salesSection.data.refundRate,
        format: 'percent'
      },
      {
        labelKey: 'DASHBOARD.SALES.LOST_REVENUE',
        value: this.overview.salesSection.data.lostRevenueAmount,
        format: 'currency',
        tone: 'critical'
      }
    ];
  }

  get inventoryCards(): DashboardMetricCard[] {
    if (!this.overview) {
      return [];
    }

    return [
      { labelKey: 'DASHBOARD.INVENTORY.ACTIVE_PRODUCTS', value: this.overview.inventorySection.activeProducts, format: 'number' },
      { labelKey: 'DASHBOARD.INVENTORY.OUT_OF_STOCK', value: this.overview.inventorySection.outOfStock, format: 'number' },
      { labelKey: 'DASHBOARD.INVENTORY.LOW_STOCK', value: this.overview.inventorySection.lowStock, format: 'number' },
      { labelKey: 'DASHBOARD.INVENTORY.INACTIVE_PRODUCTS', value: this.overview.inventorySection.inactiveProducts, format: 'number' },
      { labelKey: 'DASHBOARD.INVENTORY.PRODUCTS_WITH_OFFERS', value: this.overview.inventorySection.productsWithOffers, format: 'number' },
      { labelKey: 'DASHBOARD.INVENTORY.IDLE_CAPITAL', value: this.overview.inventorySection.idleCapitalAmount, format: 'currency', tone: 'warning' }
    ];
  }

  get offersCards(): DashboardMetricCard[] {
    if (!this.overview) {
      return [];
    }

    return [
      { labelKey: 'DASHBOARD.OFFERS.ACTIVE_OFFERS', value: this.overview.offersSection.activeOffers, format: 'number' },
      { labelKey: 'DASHBOARD.OFFERS.CLEARANCE_ITEMS', value: this.overview.offersSection.clearanceItems, format: 'number' },
      { labelKey: 'DASHBOARD.OFFERS.EXPIRING_OFFERS', value: this.overview.offersSection.expiringOffers, format: 'number' },
      { labelKey: 'DASHBOARD.OFFERS.OFFER_COVERAGE', value: this.overview.offersSection.offerCoverage, format: 'percent' }
    ];
  }

  get reviewsCards(): DashboardMetricCard[] {
    if (!this.overview) {
      return [];
    }

    return [
      { labelKey: 'DASHBOARD.REVIEWS.AVERAGE_RATING', value: this.overview.reviewsSection.averageRating, format: 'rating' },
      { labelKey: 'DASHBOARD.REVIEWS.TOTAL_REVIEWS', value: this.overview.reviewsSection.totalReviews, format: 'number' },
      { labelKey: 'DASHBOARD.REVIEWS.LOW_RATING_COUNT', value: this.overview.reviewsSection.lowRatingCount, format: 'number' },
      { labelKey: 'DASHBOARD.REVIEWS.PENDING_REPLIES', value: this.overview.reviewsSection.pendingReplies, format: 'number' },
      { labelKey: 'DASHBOARD.REVIEWS.HIDDEN_REVIEWS', value: this.overview.reviewsSection.hiddenReviews, format: 'number' }
    ];
  }

  get financeCards(): DashboardMetricCard[] {
    if (!this.overview) {
      return [];
    }

    return [
      { labelKey: 'DASHBOARD.FINANCE.AVAILABLE_BALANCE', value: this.overview.financeSection.availableBalance, format: 'currency' },
      { labelKey: 'DASHBOARD.FINANCE.PENDING_SETTLEMENT', value: this.overview.financeSection.pendingSettlement, format: 'currency' },
      { labelKey: 'DASHBOARD.FINANCE.NET_SALES', value: this.overview.financeSection.netSales, format: 'currency' },
      { labelKey: 'DASHBOARD.FINANCE.FEES', value: this.overview.financeSection.fees, format: 'currency' },
      { labelKey: 'DASHBOARD.FINANCE.PAYOUTS_PAID', value: this.overview.financeSection.payoutsPaid, format: 'currency' },
      { labelKey: 'DASHBOARD.FINANCE.HOLD_AMOUNT', value: this.overview.financeSection.holdAmount, format: 'currency' },
      { labelKey: 'DASHBOARD.FINANCE.NEXT_SETTLEMENT', value: this.overview.financeSection.nextSettlementAt, format: 'date', tone: 'primary' },
      { labelKey: 'DASHBOARD.FINANCE.LIFECYCLE_MODE', value: this.overview.financeSection.financialLifecycleMode, format: 'text', tone: 'default' }
    ];
  }

  get disputesCards(): DashboardMetricCard[] {
    if (!this.overview) {
      return [];
    }

    return [
      { labelKey: 'DASHBOARD.DISPUTES.OPEN', value: this.overview.disputesSection.openDisputes, format: 'number' },
      { labelKey: 'DASHBOARD.DISPUTES.HIGH_PRIORITY', value: this.overview.disputesSection.highPriorityDisputes, format: 'number' },
      { labelKey: 'DASHBOARD.DISPUTES.REFUND_REQUESTS', value: this.overview.disputesSection.refundRequests, format: 'number' },
      { labelKey: 'DASHBOARD.DISPUTES.AWAITING_VENDOR_RESPONSE', value: this.overview.disputesSection.awaitingVendorResponse, format: 'number' }
    ];
  }

  get staffCards(): DashboardMetricCard[] {
    if (!this.overview) {
      return [];
    }

    return [
      { labelKey: 'DASHBOARD.STAFF.ACTIVE_BRANCHES', value: this.overview.staffSection.activeBranches, format: 'number' },
      { labelKey: 'DASHBOARD.STAFF.ACTIVE_STAFF', value: this.overview.staffSection.activeStaff, format: 'number' },
      { labelKey: 'DASHBOARD.STAFF.PENDING_INVITATIONS', value: this.overview.staffSection.pendingInvitations, format: 'number' },
      { labelKey: 'DASHBOARD.STAFF.BRANCHES_NEEDING_COVERAGE', value: this.overview.staffSection.branchesNeedingCoverage, format: 'number' }
    ];
  }

  buildDualAxisChart(points: VendorDashboardDualTrendPoint[], primaryKey: string, secondaryKey: string): ChartData<'bar'> {
    return {
      labels: points.map((point) => this.formatTrendLabel(point.label)),
      datasets: [
        {
          type: 'bar',
          label: this.translate.instant(primaryKey),
          data: points.map((point) => point.value),
          backgroundColor: 'rgba(13, 148, 136, 0.85)',
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 40,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: this.translate.instant(secondaryKey),
          data: points.map((point) => point.secondaryValue),
          borderColor: 'rgba(245, 158, 11, 1)',
          backgroundColor: 'rgba(245, 158, 11, 0.16)',
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: 'rgba(245, 158, 11, 1)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ] as never
    };
  }

  buildBarChart(slices: VendorDashboardBreakdownSlice[], context: string, horizontal = false): ChartData<'bar'> {
    return {
      labels: slices.map((slice) => slice.label || this.sliceLabel(context, slice.key)),
      datasets: [
        {
          label: this.translate.instant('DASHBOARD.CHARTS.COUNT'),
          data: slices.map((slice) => slice.value),
          backgroundColor: ['#0d9488', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#64748b'],
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 40
        }
      ]
    };
  }

  buildDoughnutChart(slices: VendorDashboardBreakdownSlice[], context: string): ChartData<'doughnut'> {
    return {
      labels: slices.map((slice) => slice.label || this.sliceLabel(context, slice.key)),
      datasets: [
        {
          data: slices.map((slice) => slice.value),
          backgroundColor: ['#0d9488', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#64748b'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }
      ]
    };
  }

  buildRankedSlices(items: VendorDashboardRankedItem[]): VendorDashboardBreakdownSlice[] {
    return items.map((item) => ({
      key: item.id,
      label: this.labelForRankedItem(item),
      value: item.metric
    }));
  }

  buildLineChart(points: { label: string; value: number }[], labelKey: string): ChartData<'line'> {
    return {
      labels: points.map((point) => this.formatTrendLabel(point.label)),
      datasets: [
        {
          label: this.translate.instant(labelKey),
          data: points.map((point) => point.value),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#3b82f6',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  get barChartOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          titleFont: { size: 13, family: 'Inter, sans-serif' },
          bodyFont: { size: 13, family: 'Inter, sans-serif' },
          displayColors: false,
          cornerRadius: 8
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter, sans-serif' } } },
        y: { 
          beginAtZero: true, 
          border: { display: false },
          grid: { color: 'rgba(226, 232, 240, 0.6)', drawTicks: false },
          ticks: { font: { family: 'Inter, sans-serif' }, padding: 8 }
        }
      }
    };
  }

  get dualAxisOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { 
          display: true, 
          position: 'bottom',
          labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter, sans-serif' } }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter, sans-serif' } } },
        y: { 
          beginAtZero: true, position: 'left', 
          border: { display: false },
          grid: { color: 'rgba(226, 232, 240, 0.6)', drawTicks: false },
          ticks: { font: { family: 'Inter, sans-serif' }, padding: 8 }
        },
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, border: { display: false }, ticks: { font: { family: 'Inter, sans-serif' } } }
      }
    };
  }

  get doughnutOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: { 
          position: 'right', 
          labels: { usePointStyle: true, padding: 20, font: { family: 'Inter, sans-serif' } }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          cornerRadius: 8
        }
      }
    };
  }

  metricToneClass(tone: DashboardMetricCard['tone']): string {
    switch (tone) {
      case 'critical':
        return 'border-rose-200 bg-rose-50/70';
      case 'warning':
        return 'border-amber-200 bg-amber-50/70';
      case 'success':
        return 'border-emerald-200 bg-emerald-50/70';
      case 'primary':
        return 'border-teal-200 bg-teal-50/80';
      default:
        return 'border-slate-200 bg-white';
    }
  }

  alertClass(severity: VendorDashboardAlertItem['severity']): string {
    switch (severity) {
      case 'critical':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-800';
      default:
        return 'border-sky-200 bg-sky-50 text-sky-700';
    }
  }

  formatMetricValue(card: DashboardMetricCard): string {
    if (card.value == null) {
      return '-';
    }

    if (card.format === 'currency') {
      return this.formatCurrency(card.value);
    }

    if (card.format === 'percent') {
      return this.percentPipe.transform(card.value, '1.0-1') ?? '0%';
    }

    if (card.format === 'rating') {
      return this.decimalPipe.transform(card.value, '1.1-1') ?? '0.0';
    }

    if (card.format === 'date') {
      return this.formatDate(card.value);
    }

    if (card.format === 'text') {
      return String(card.value);
    }

    return this.decimalPipe.transform(card.value, '1.0-0') ?? '0';
  }

  formatDelta(delta?: number): string {
    if (delta === undefined || delta === null) {
      return '';
    }

    const formatted = this.percentPipe.transform(Math.abs(delta), '1.0-1') ?? '0%';
    return `${delta >= 0 ? '+' : '-'}${formatted}`;
  }

  deltaClass(delta?: number): string {
    if (delta === undefined || delta === null) {
      return 'text-slate-400';
    }

    return delta >= 0 ? 'text-emerald-600' : 'text-rose-600';
  }

  labelForRankedItem(item: VendorDashboardRankedItem): string {
    return this.currentLang === 'ar' ? item.labelAr : item.labelEn;
  }

  formatCurrency(value: number): string {
    return `${this.decimalPipe.transform(value, '1.0-0') ?? '0'} ${this.translate.instant('COMMON.CURRENCY')}`;
  }

  getRoundedRating(): number {
    return Math.round(this.overview?.reviewsSection?.averageRating ?? 0);
  }

  formatDate(value: string): string {
    return this.safeDateTransform(value, 'MMM d, y');
  }

  formatDateTime(value: string): string {
    return this.safeDateTransform(value, 'MMM d, y, h:mm a');
  }

  shortComment(item: VendorDashboardReviewListItem): string {
    return item.comment.length > 120 ? `${item.comment.slice(0, 120).trim()}...` : item.comment;
  }

  private formatTrendLabel(label: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
      return this.safeDateTransform(label, 'MMM d', label);
    }

    return this.sliceLabel('generic', label);
  }

  private safeDateTransform(value: string, format: string, fallback = '-'): string {
    try {
      return this.datePipe.transform(value, format, undefined, this.currentLang === 'ar' ? 'ar' : 'en-US') ?? fallback;
    } catch {
      return fallback;
    }
  }

  private sliceLabel(context: string, key: string): string {
    switch (context) {
      case 'order-status':
        return this.orderStatusLabel(key);
      case 'order-funnel':
        return this.translate.instant(`DASHBOARD.FUNNEL.${key.toUpperCase()}`);
      case 'weekday':
        return this.weekdayLabel(Number(key));
      case 'stock-health':
        return this.translate.instant(`DASHBOARD.STOCK_HEALTH.${key.toUpperCase().replace(/-/g, '_')}`);
      case 'offer-types':
        return this.translate.instant(`DASHBOARD.OFFER_TYPES.${key.toUpperCase()}`);
      case 'discount-bands':
        return `${key}%`;
      case 'reply-breakdown':
        return this.translate.instant(`DASHBOARD.REPLY_BREAKDOWN.${key.toUpperCase()}`);
      case 'settlements':
        return this.translate.instant(`DASHBOARD.SETTLEMENT_STATUS.${key.toUpperCase()}`);
      case 'ledger':
        return this.translate.instant(`DASHBOARD.LEDGER_TYPES.${key.toUpperCase()}`);
      case 'dispute-status':
        return this.translate.instant(`VENDOR_DISPUTES.STATUS.${key.toUpperCase()}`);
      case 'dispute-type':
        return this.translate.instant(`VENDOR_DISPUTES.TYPE.${key.toUpperCase()}`);
      case 'branch-status':
        return key === 'active'
          ? this.translate.instant('COMMON.STATUS_ACTIVE')
          : this.translate.instant('COMMON.STATUS_INACTIVE');
      default:
        return key.replace(/_/g, ' ');
    }
  }

  private orderStatusLabel(key: string): string {
    const map: Record<string, string> = {
      PendingVendorAcceptance: 'ORDERS.STATUS_NEW',
      Placed: 'ORDERS.STATUS_NEW',
      Accepted: 'ORDERS.STATUS_CONFIRMED',
      Preparing: 'ORDERS.STATUS_IN_PROGRESS',
      ReadyForPickup: 'ORDERS.STATUS_READY',
      DriverAssignmentInProgress: 'ORDERS.STATUS_READY',
      DriverAssigned: 'ORDERS.STATUS_READY',
      Delivered: 'ORDERS.STATUS_COMPLETED',
      Cancelled: 'ORDERS.STATUS_CANCELLED',
      VendorRejected: 'ORDERS.STATUS_CANCELLED'
    };

    return this.translate.instant(map[key] ?? 'COMMON.STATUS');
  }

  private weekdayLabel(dayIndex: number): string {
    const weekday = new Date(Date.UTC(2026, 4, 3 + dayIndex));
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }).format(weekday);
  }
}
