import { CommonModule, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { RouterModule, ActivatedRoute, ParamMap, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { Subject, Subscription, timer } from 'rxjs';
import { catchError, filter, finalize, skip, switchMap, takeUntil } from 'rxjs/operators';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import {
  VendorDashboardAlertItem,
  VendorDashboardBranchRevenue,
  VendorDashboardBreakdownSlice,
  VendorDashboardDualTrendPoint,
  VendorDashboardOverview,
  VendorDashboardRankedItem
} from '../../models/vendor-dashboard.models';
import { VendorDashboardService } from '../../services/vendor-dashboard.service';
import { StaffBranchesService } from '../../../staff/services/staff-branches.service';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';
import { VendorAccessScope, VendorCurrentUser } from '../../../../core/auth/models/vendor-auth.models';
import { looksLikeUtf8Mojibake, repairUtf8Mojibake } from '../../../../shared/utils/text-normalization.util';
import {
  normalizeVendorDisputeStatus,
  normalizeVendorDisputeType
} from '../../../disputes/utils/vendor-dispute-display.utils';
import {
  resolveVendorLedgerDefaultKey,
  resolveVendorLedgerMemo,
  resolveVendorLedgerReferenceKey,
  resolveVendorOrderStatusKey,
  resolveVendorSettlementStatusKey
} from '../../utils/vendor-dashboard-i18n.utils';

Chart.register(...registerables);

type DashboardTabId =
  | 'overview'
  | 'operations'
  | 'sales'
  | 'inventory'
  | 'offers'
  | 'finance'
  | 'risk'
  | 'staff';

interface DashboardNavItem {
  id: DashboardTabId;
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

const DASHBOARD_REFRESH_MS = 60000;
const DASHBOARD_TAB_IDS: DashboardTabId[] = [
  'overview',
  'operations',
  'sales',
  'inventory',
  'offers',
  'finance',
  'risk',
  'staff'
];
const DASHBOARD_PERIOD_IDS: Array<'today' | '7d' | '30d' | '90d'> = ['today', '7d', '30d', '90d'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    BaseChartDirective,
    AppPanelHeaderComponent
  ],
  providers: [DatePipe, DecimalPipe, PercentPipe],
  templateUrl: './vendor-dashboard.component.html',
  styleUrl: './vendor-dashboard.component.scss'
})
export class VendorDashboardComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  currentLang = 'ar';
  overview: VendorDashboardOverview | null = null;
  isLoading = false;
  dashboardError = '';
  selectedPeriod: 'today' | '7d' | '30d' | '90d' = '7d';
  readonly periods: Array<'today' | '7d' | '30d' | '90d'> = ['today', '7d', '30d', '90d'];
  activeTabId: DashboardTabId = 'overview';
  private readonly renderedTabIds = new Set<DashboardTabId>(['overview']);
  readonly sectionNav: DashboardNavItem[] = [
    { id: 'overview', labelKey: 'DASHBOARD.SECTION_NAV.OVERVIEW' },
    { id: 'operations', labelKey: 'DASHBOARD.SECTION_NAV.OPERATIONS' },
    { id: 'sales', labelKey: 'DASHBOARD.SECTION_NAV.SALES' },
    { id: 'inventory', labelKey: 'DASHBOARD.SECTION_NAV.INVENTORY' },
    { id: 'offers', labelKey: 'DASHBOARD.SECTION_NAV.OFFERS' },
    { id: 'finance', labelKey: 'DASHBOARD.SECTION_NAV.FINANCE' },
    { id: 'risk', labelKey: 'DASHBOARD.SECTION_NAV.RISK' },
    { id: 'staff', labelKey: 'DASHBOARD.SECTION_NAV.STAFF' }
  ];

  private readonly destroy$ = new Subject<void>();
  private readonly reload$ = new Subject<boolean>();
  private readonly langSub: Subscription;
  private readonly branchNameById = new Map<string, string>();

  constructor(
    private readonly translate: TranslateService,
    private readonly dashboardService: VendorDashboardService,
    private readonly staffBranchesService: StaffBranchesService,
    private readonly vendorAuthService: VendorAuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly datePipe: DatePipe,
    private readonly decimalPipe: DecimalPipe,
    private readonly percentPipe: PercentPipe
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.cdr.markForCheck();
      this.currentLang = event.lang;
      this.rebuildChartCache();
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.reload$
      .pipe(
        switchMap((showLoading) => {
          if (showLoading) {
            this.isLoading = true;
            this.cdr.markForCheck();
          }

          return this.dashboardService.getOverview(this.selectedPeriod, true).pipe(
            finalize(() => {
              this.isLoading = false;
              this.cdr.markForCheck();
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (overview) => {
          try {
            this.overview = overview;
            this.dashboardError = '';
            this.rebuildChartCache();
          } catch {
            if (!this.overview) {
              this.dashboardError = this.translate.instant('DASHBOARD.ERROR');
            }
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          if (this.dashboardService.isAbortError(error)) {
            return;
          }

          if (!this.overview) {
            this.dashboardError = this.translate.instant('DASHBOARD.ERROR');
            this.cdr.markForCheck();
          }
        }
      });

    this.hydrateFromQueryParams(this.route.snapshot.queryParamMap);

    this.route.queryParamMap
      .pipe(
        skip(1),
        takeUntil(this.destroy$)
      )
      .subscribe((params) => {
        this.hydrateFromQueryParams(params, true);
      });

    this.loadOverview();

    this.staffBranchesService.getBranches()
      .pipe(takeUntil(this.destroy$))
      .subscribe((branches) => {
        this.branchNameById.clear();
        branches.forEach((branch) => {
          this.branchNameById.set(branch.id, branch.name);
        });
        this.cdr.markForCheck();
      });

    timer(DASHBOARD_REFRESH_MS, DASHBOARD_REFRESH_MS)
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
    this.syncDashboardQueryParams();
    this.loadOverview();
  }

  refreshDashboard(): void {
    this.loadOverview();
  }

  setActiveTab(tabId: DashboardTabId): void {
    if (this.activeTabId === tabId) {
      return;
    }

    this.activeTabId = tabId;
    this.renderedTabIds.add(tabId);
    this.syncDashboardQueryParams();
    this.cdr.markForCheck();
  }

  private hydrateFromQueryParams(params: ParamMap, reloadOnPeriodChange = false): void {
    const tab = params.get('tab');
    if (tab && this.isDashboardTabId(tab) && tab !== this.activeTabId) {
      this.activeTabId = tab;
      this.renderedTabIds.add(tab);
      this.cdr.markForCheck();
    }

    const period = params.get('period');
    if (period && this.isDashboardPeriod(period) && period !== this.selectedPeriod) {
      this.selectedPeriod = period;
      if (reloadOnPeriodChange) {
        this.loadOverview();
      }
      this.cdr.markForCheck();
    }
  }

  private syncDashboardQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tab: this.activeTabId,
        period: this.selectedPeriod
      },
      queryParamsHandling: 'merge',
      replaceUrl: false
    });
  }

  private isDashboardTabId(value: string): value is DashboardTabId {
    return DASHBOARD_TAB_IDS.includes(value as DashboardTabId);
  }

  private isDashboardPeriod(value: string): value is 'today' | '7d' | '30d' | '90d' {
    return DASHBOARD_PERIOD_IDS.includes(value as 'today' | '7d' | '30d' | '90d');
  }

  shouldRenderTab(tabId: DashboardTabId): boolean {
    return this.renderedTabIds.has(tabId);
  }

  loadOverview(showLoading = true): void {
    this.reload$.next(showLoading);
  }

  get lastUpdatedLabel(): string {
    return this.overview?.generatedAtUtc
      ? this.formatDateTime(this.overview.generatedAtUtc)
      : '-';
  }

  get currentUser(): VendorCurrentUser | null {
    return this.vendorAuthService.currentUserSnapshot;
  }

  get activeScope(): VendorAccessScope | null {
    return this.currentUser?.access?.activeScope ?? null;
  }

  get currentWorkspaceName(): string {
    return this.activeScope?.scopeEntityName?.trim() || this.translate.instant('DASHBOARD.CONTEXT.UNKNOWN_BRANCH');
  }

  get currentWorkspaceTypeKey(): string {
    return this.activeScope?.scopeClassification === 'branch'
      ? 'STAFF_BRANCHES.BRANCH_TYPES.BRANCH'
      : 'STAFF_BRANCHES.BRANCH_TYPES.PRIMARY';
  }

  get currentWorkspaceRoleName(): string {
    return this.activeScope?.roleName?.trim() || '-';
  }

  get showWorkspaceRole(): boolean {
    return !!this.activeScope?.roleName?.trim();
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
      labels: slices.map((slice) => this.resolveSliceLabel(context, slice)),
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
      labels: slices.map((slice) => this.resolveSliceLabel(context, slice)),
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

  readonly charts = this.createEmptyChartCache();

  readonly barChartOptions: ChartConfiguration['options'] = {
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

  readonly dualAxisOptions: ChartConfiguration['options'] = {
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
        beginAtZero: true,
        position: 'left',
        border: { display: false },
        grid: { color: 'rgba(226, 232, 240, 0.6)', drawTicks: false },
        ticks: { font: { family: 'Inter, sans-serif' }, padding: 8 }
      },
      y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, border: { display: false }, ticks: { font: { family: 'Inter, sans-serif' } } }
    }
  };

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
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

  private emptyBarChart(): ChartData<'bar'> {
    return { labels: [], datasets: [] };
  }

  private emptyDoughnutChart(): ChartData<'doughnut'> {
    return { labels: [], datasets: [] };
  }

  private emptyLineChart(): ChartData<'line'> {
    return { labels: [], datasets: [] };
  }

  private createEmptyChartCache() {
    return {
      overviewSalesVsOrders: this.emptyBarChart(),
      overviewSettlements: this.emptyDoughnutChart(),
      operationsOrdersTrend: this.emptyBarChart(),
      operationsOrderStatus: this.emptyDoughnutChart(),
      salesTrend: this.emptyBarChart(),
      salesTopCategories: this.emptyDoughnutChart(),
      inventoryStockHealth: this.emptyDoughnutChart(),
      inventoryRiskBar: this.emptyBarChart(),
      inventoryCatalogGrowth: this.emptyLineChart(),
      offersByType: this.emptyDoughnutChart(),
      discountBands: this.emptyBarChart(),
      financeSalesVsPayouts: this.emptyBarChart(),
      financeSettlements: this.emptyDoughnutChart(),
      disputeStatus: this.emptyDoughnutChart(),
      disputeTrend: this.emptyLineChart()
    };
  }

  private rebuildChartCache(): void {
    const ov = this.overview;
    if (!ov) {
      Object.assign(this.charts, this.createEmptyChartCache());
      return;
    }

    this.charts.overviewSalesVsOrders = this.buildDualAxisChart(
      ov.salesSection.data.salesVsOrdersTrend,
      'DASHBOARD.CHARTS.SALES',
      'DASHBOARD.CHARTS.ORDERS'
    );
    this.charts.overviewSettlements = this.buildDoughnutChart(ov.financeSection.settlementStatusBreakdown, 'settlements');
    this.charts.operationsOrdersTrend = this.buildDualAxisChart(
      ov.ordersSection.ordersTrend,
      'DASHBOARD.CHARTS.ORDERS',
      'DASHBOARD.CHARTS.SALES'
    );
    this.charts.operationsOrderStatus = this.buildDoughnutChart(ov.ordersSection.statusBreakdown, 'order-status');
    this.charts.salesTrend = this.charts.overviewSalesVsOrders;
    this.charts.salesTopCategories = this.buildDoughnutChart(ov.salesSection.data.topCategories, 'generic');
    this.charts.inventoryStockHealth = this.buildDoughnutChart(ov.inventorySection.stockHealthDistribution, 'stock-health');
    this.charts.inventoryRiskBar = this.buildBarChart(this.buildRankedSlices(ov.inventorySection.inventoryRiskList), 'generic');
    this.charts.inventoryCatalogGrowth = this.buildLineChart(ov.inventorySection.catalogGrowth, 'DASHBOARD.CHARTS.PRODUCTS');
    this.charts.offersByType = this.buildDoughnutChart(ov.offersSection.offersByType, 'offer-types');
    this.charts.discountBands = this.buildBarChart(ov.offersSection.discountBands, 'discount-bands');
    this.charts.financeSalesVsPayouts = this.buildDualAxisChart(
      ov.financeSection.salesVsPayoutsTrend,
      'DASHBOARD.CHARTS.SALES',
      'DASHBOARD.CHARTS.PAYOUTS'
    );
    this.charts.financeSettlements = this.charts.overviewSettlements;
    this.charts.disputeStatus = this.buildDoughnutChart(ov.disputesSection.statusBreakdown, 'dispute-status');
    this.charts.disputeTrend = this.buildLineChart(ov.disputesSection.disputeTrend, 'DASHBOARD.CHARTS.DISPUTES');
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

  alertIcon(severity: VendorDashboardAlertItem['severity']): string {
    switch (severity) {
      case 'critical': return 'warning';
      case 'warning': return 'error_outline';
      default: return 'notifications';
    }
  }

  alertIconBgClass(severity: VendorDashboardAlertItem['severity']): string {
    switch (severity) {
      case 'critical': return 'bg-rose-100/80 text-rose-600';
      case 'warning': return 'bg-amber-100/80 text-amber-600';
      default: return 'bg-sky-100/80 text-sky-600';
    }
  }

  alertSeverityLabelKey(severity: VendorDashboardAlertItem['severity']): string {
    switch (severity) {
      case 'critical':
        return 'ALERTS_CENTER.SEVERITY.CRITICAL';
      case 'warning':
        return 'ALERTS_CENTER.SEVERITY.WARNING';
      default:
        return 'ALERTS_CENTER.SEVERITY.INFO';
    }
  }

  kpiToneLineClass(tone: DashboardMetricCard['tone']): string {
    switch (tone) {
      case 'critical': return 'bg-rose-500';
      case 'warning': return 'bg-amber-500';
      case 'success': return 'bg-emerald-500';
      case 'primary': return 'bg-zadna-primary';
      default: return 'bg-slate-200';
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
    const label = this.currentLang === 'ar' ? item.labelAr : item.labelEn;
    return repairUtf8Mojibake(label);
  }

  branchDisplayName(branch: VendorDashboardBranchRevenue): string {
    if (branch.branchId === 'main') {
      return this.translate.instant('STAFF_BRANCHES.BRANCH_TYPES.PRIMARY');
    }

    const catalogName = this.branchNameById.get(branch.branchId)?.trim();
    if (catalogName) {
      return catalogName;
    }

    const repaired = repairUtf8Mojibake(branch.branchName);
    if (repaired && !looksLikeUtf8Mojibake(repaired)) {
      return repaired;
    }

    return this.translate.instant('DASHBOARD.CONTEXT.UNKNOWN_BRANCH');
  }

  formatCurrency(value: number): string {
    return `${this.decimalPipe.transform(value, '1.0-0') ?? '0'} ${this.translate.instant('COMMON.CURRENCY')}`;
  }

  branchRevenueShare(branch: VendorDashboardBranchRevenue): number {
    const items = this.overview?.financeSection.branchRevenues ?? [];
    const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0);

    if (totalRevenue <= 0) {
      return 0;
    }

    return Math.round((branch.revenue / totalRevenue) * 100);
  }

  formatDate(value: string): string {
    return this.safeDateTransform(value, 'MMM d, y');
  }

  formatDateTime(value: string): string {
    return this.safeDateTransform(value, 'MMM d, y, h:mm a');
  }

  translateOrderStatus(status: string): string {
    const key = resolveVendorOrderStatusKey(status);
    const translated = this.translate.instant(key);
    return translated === key ? status : translated;
  }

  translateSettlementStatus(status: string): string {
    const key = resolveVendorSettlementStatusKey(status);
    const translated = this.translate.instant(key);
    return translated === key ? status : translated;
  }

  translateLedgerLabel(label: string): string {
    const memo = resolveVendorLedgerMemo(label);
    if (memo) {
      const translated = this.translate.instant(memo.key, memo.params);
      return translated === memo.key ? label : translated;
    }

    const defaultKey = resolveVendorLedgerDefaultKey(label);
    if (defaultKey) {
      const translated = this.translate.instant(defaultKey);
      return translated === defaultKey ? label : translated;
    }

    return label;
  }

  translateLedgerReference(reference: string): string {
    const key = resolveVendorLedgerReferenceKey(reference);
    if (!key) {
      return reference;
    }

    const translated = this.translate.instant(key);
    return translated === key ? reference : translated;
  }

  private formatTrendLabel(label: string): string {
    const trimmed = label.trim();
    const localized = this.localizeTrendLabel(trimmed);
    if (localized !== trimmed) {
      return localized;
    }

    return this.sliceLabel('generic', trimmed);
  }

  private localizeTrendLabel(label: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
      return this.safeDateTransform(label, this.currentLang === 'ar' ? 'd MMM' : 'MMM d', label);
    }

    const monthIndex = VendorDashboardComponent.EN_MONTH_ABBREVS
      .findIndex((month) => month.toLowerCase() === label.toLowerCase());
    if (monthIndex >= 0) {
      const monthDate = new Date(Date.UTC(2026, monthIndex, 1));
      return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' }).format(monthDate);
    }

    const weekdayIndex = VendorDashboardComponent.EN_WEEKDAY_ABBREVS
      .findIndex((weekday) => weekday.toLowerCase() === label.toLowerCase());
    if (weekdayIndex >= 0) {
      const weekdayDate = new Date(Date.UTC(2026, 0, 4 + weekdayIndex));
      return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }).format(weekdayDate);
    }

    const weekMatch = label.match(/^W(\d+)$/i);
    if (weekMatch) {
      return this.currentLang === 'ar'
        ? `أسبوع ${weekMatch[1]}`
        : `Week ${weekMatch[1]}`;
    }

    return label;
  }

  private resolveSliceLabel(context: string, slice: VendorDashboardBreakdownSlice): string {
    const translatedFromKey = this.sliceLabel(context, slice.key);
    if (context !== 'generic') {
      return translatedFromKey;
    }

    const rawLabel = (slice.label || '').trim();
    if (/[\u0600-\u06FF]/.test(rawLabel)) {
      return rawLabel;
    }

    if (translatedFromKey !== this.fallbackGenericLabel(slice.key)) {
      return translatedFromKey;
    }

    return rawLabel || translatedFromKey;
  }

  private fallbackGenericLabel(key: string): string {
    return (key || '').replace(/_/g, ' ');
  }

  private static readonly EN_MONTH_ABBREVS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  private static readonly EN_WEEKDAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        return this.translate.instant(`VENDOR_DISPUTES.STATUS.${normalizeVendorDisputeStatus(key).toUpperCase()}`);
      case 'dispute-type':
        return this.translate.instant(`VENDOR_DISPUTES.TYPE.${normalizeVendorDisputeType(key).toUpperCase()}`);
      case 'branch-status':
        return key === 'active'
          ? this.translate.instant('COMMON.STATUS_ACTIVE')
          : this.translate.instant('COMMON.STATUS_INACTIVE');
      default: {
        const normalizedKey = (key || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
        const chartLabelKey = `DASHBOARD.CHART_LABELS.${normalizedKey}`;
        const chartLabel = this.translate.instant(chartLabelKey);
        if (chartLabel !== chartLabelKey) {
          return chartLabel;
        }

        return this.fallbackGenericLabel(key);
      }
    }
  }

  private orderStatusLabel(key: string): string {
    const translationKey = resolveVendorOrderStatusKey(key);
    const translated = this.translate.instant(translationKey);
    return translated === translationKey ? this.fallbackGenericLabel(key) : translated;
  }

  private weekdayLabel(dayIndex: number): string {
    const weekday = new Date(Date.UTC(2026, 4, 3 + dayIndex));
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }).format(weekday);
  }
}
