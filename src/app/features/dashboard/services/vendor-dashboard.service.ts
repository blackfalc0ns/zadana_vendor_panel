import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorDashboardEtaHealth, VendorDashboardOverview } from '../models/vendor-dashboard.models';
import { repairUtf8Mojibake } from '../../../shared/utils/text-normalization.util';

interface DashboardOverviewApiResponse {
  generatedAtUtc?: string;
  GeneratedAtUtc?: string;
  period?: string;
  Period?: string;
  heroStats?: VendorDashboardOverview['heroStats'];
  HeroStats?: VendorDashboardOverview['heroStats'];
  ordersSection?: VendorDashboardOverview['ordersSection'];
  OrdersSection?: VendorDashboardOverview['ordersSection'];
  salesSection?: VendorDashboardOverview['salesSection'];
  SalesSection?: VendorDashboardOverview['salesSection'];
  inventorySection?: VendorDashboardOverview['inventorySection'];
  InventorySection?: VendorDashboardOverview['inventorySection'];
  offersSection?: VendorDashboardOverview['offersSection'];
  OffersSection?: VendorDashboardOverview['offersSection'];
  financeSection?: VendorDashboardOverview['financeSection'];
  FinanceSection?: VendorDashboardOverview['financeSection'];
  disputesSection?: VendorDashboardOverview['disputesSection'];
  DisputesSection?: VendorDashboardOverview['disputesSection'];
  staffSection?: VendorDashboardOverview['staffSection'];
  StaffSection?: VendorDashboardOverview['staffSection'];
  alertsFeed?: VendorDashboardOverview['alertsFeed'];
  AlertsFeed?: VendorDashboardOverview['alertsFeed'];
}

@Injectable({
  providedIn: 'root'
})
export class VendorDashboardService {
  private readonly baseUrl = `${environment.apiUrl}/vendor/dashboard`;
  private readonly requestTimeoutMs = 45000;
  private cachedOverview?: VendorDashboardOverview;
  private cachedPeriod?: string;
  private inFlightRequest$?: Observable<VendorDashboardOverview>;

  constructor(private readonly http: HttpClient) {}

  getOverview(period: string = '7d', forceRefresh = false): Observable<VendorDashboardOverview> {
    if (!forceRefresh && this.cachedOverview && this.cachedPeriod === period) {
      return of(this.cachedOverview);
    }

    if (!forceRefresh && this.inFlightRequest$ && this.cachedPeriod === period) {
      return this.inFlightRequest$;
    }

    this.cachedPeriod = period;
    this.inFlightRequest$ = this.http.get<DashboardOverviewApiResponse>(`${this.baseUrl}/overview`, {
      params: { period }
    }).pipe(
      timeout(this.requestTimeoutMs),
      map((response) => this.normalizeOverview(response)),
      tap((overview) => {
        this.cachedOverview = overview;
      }),
      catchError((error) => {
        if (this.cachedOverview && this.cachedPeriod === period) {
          return of(this.cachedOverview);
        }

        return throwError(() => error);
      }),
      shareReplay(1),
      tap({
        finalize: () => {
          this.inFlightRequest$ = undefined;
        }
      })
    );

    return this.inFlightRequest$;
  }

  invalidateCache(): void {
    this.cachedOverview = undefined;
    this.cachedPeriod = undefined;
    this.inFlightRequest$ = undefined;
  }

  isAbortError(error: unknown): boolean {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return true;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      return true;
    }

    if (error instanceof Error && /abort|cancel/i.test(error.message)) {
      return true;
    }

    return false;
  }

  private normalizeOverview(response: DashboardOverviewApiResponse | null | undefined): VendorDashboardOverview {
    const source = (response ?? {}) as DashboardOverviewApiResponse;

    return {
      generatedAtUtc: String(source.generatedAtUtc ?? source.GeneratedAtUtc ?? new Date().toISOString()),
      period: String(source.period ?? source.Period ?? '7d'),
      heroStats: this.pickSection(source.heroStats, source.HeroStats, this.emptyHeroStats()),
      ordersSection: this.normalizeOrdersSection(this.pickSection(source.ordersSection, source.OrdersSection, this.emptyOrdersSection())),
      salesSection: this.normalizeSalesSection(this.pickSection(source.salesSection, source.SalesSection, this.emptySalesSection())),
      inventorySection: this.pickSection(source.inventorySection, source.InventorySection, this.emptyInventorySection()),
      offersSection: this.normalizeOffersSection(this.pickSection(source.offersSection, source.OffersSection, this.emptyOffersSection())),
      financeSection: this.normalizeFinanceSection(this.pickSection(source.financeSection, source.FinanceSection, this.emptyFinanceSection())),
      disputesSection: this.normalizeDisputesSection(this.pickSection(source.disputesSection, source.DisputesSection, this.emptyDisputesSection())),
      staffSection: this.normalizeStaffSection(this.pickSection(source.staffSection, source.StaffSection, this.emptyStaffSection())),
      alertsFeed: Array.isArray(source.alertsFeed)
        ? source.alertsFeed
        : Array.isArray(source.AlertsFeed)
          ? source.AlertsFeed
          : []
    };
  }

  private pickSection<T>(primary: T | undefined, fallback: T | undefined, empty: T): T {
    return primary ?? fallback ?? empty;
  }

  private normalizeOrdersSection(section: VendorDashboardOverview['ordersSection']): VendorDashboardOverview['ordersSection'] {
    const raw = section as VendorDashboardOverview['ordersSection'] & {
      EtaHealth?: VendorDashboardEtaHealth;
      Funnel?: VendorDashboardOverview['ordersSection']['funnel'];
      StatusBreakdown?: VendorDashboardOverview['ordersSection']['statusBreakdown'];
      OrdersTrend?: VendorDashboardOverview['ordersSection']['ordersTrend'];
      UrgentOrders?: VendorDashboardOverview['ordersSection']['urgentOrders'];
      LatestAlerts?: VendorDashboardOverview['ordersSection']['latestAlerts'];
    };

    return {
      ...section,
      etaHealth: this.normalizeEtaHealth(raw.etaHealth ?? raw.EtaHealth),
      funnel: raw.funnel ?? raw.Funnel ?? [],
      statusBreakdown: raw.statusBreakdown ?? raw.StatusBreakdown ?? [],
      ordersTrend: raw.ordersTrend ?? raw.OrdersTrend ?? [],
      urgentOrders: raw.urgentOrders ?? raw.UrgentOrders ?? [],
      latestAlerts: raw.latestAlerts ?? raw.LatestAlerts ?? []
    };
  }

  private normalizeEtaHealth(value: VendorDashboardEtaHealth | null | undefined): VendorDashboardEtaHealth {
    const raw = (value ?? {}) as VendorDashboardEtaHealth & Record<string, number | string | undefined>;
    return {
      onTimeRate: Number(raw.onTimeRate ?? raw['OnTimeRate'] ?? 0),
      averageDeliveryTimeMinutes: Number(raw.averageDeliveryTimeMinutes ?? raw['AverageDeliveryTimeMinutes'] ?? 0),
      averagePreparationTimeMinutes: Number(raw.averagePreparationTimeMinutes ?? raw['AveragePreparationTimeMinutes'] ?? 0),
      averageDispatchLeadMinutes: Number(raw.averageDispatchLeadMinutes ?? raw['AverageDispatchLeadMinutes'] ?? 0),
      averageLastMileMinutes: Number(raw.averageLastMileMinutes ?? raw['AverageLastMileMinutes'] ?? 0),
      recommendedBufferMinutes: Number(raw.recommendedBufferMinutes ?? raw['RecommendedBufferMinutes'] ?? 0),
      sampleSize: Number(raw.sampleSize ?? raw['SampleSize'] ?? 0),
      calibrationSource: String(raw.calibrationSource ?? raw['CalibrationSource'] ?? '')
    };
  }

  private normalizeSalesSection(section: VendorDashboardOverview['salesSection']): VendorDashboardOverview['salesSection'] {
    const data = section.data ?? (section as unknown as { Data?: VendorDashboardOverview['salesSection']['data'] }).Data ?? this.emptySalesSection().data;
    const deltas = section.deltas ?? (section as unknown as { Deltas?: VendorDashboardOverview['salesSection']['deltas'] }).Deltas ?? this.emptySalesSection().deltas;
    const rawData = data as typeof data & {
      WeekdayPerformance?: typeof data.weekdayPerformance;
      SalesVsOrdersTrend?: typeof data.salesVsOrdersTrend;
      TopCategories?: typeof data.topCategories;
      TopProducts?: typeof data.topProducts;
      UnderperformingProducts?: typeof data.underperformingProducts;
    };

    return {
      data: {
        ...data,
        weekdayPerformance: rawData.weekdayPerformance ?? rawData.WeekdayPerformance ?? [],
        salesVsOrdersTrend: rawData.salesVsOrdersTrend ?? rawData.SalesVsOrdersTrend ?? [],
        topCategories: rawData.topCategories ?? rawData.TopCategories ?? [],
        topProducts: rawData.topProducts ?? rawData.TopProducts ?? [],
        underperformingProducts: rawData.underperformingProducts ?? rawData.UnderperformingProducts ?? []
      },
      deltas
    };
  }

  private normalizeOffersSection(section: VendorDashboardOverview['offersSection']): VendorDashboardOverview['offersSection'] {
    const raw = section as typeof section & {
      LinkedProductsByType?: typeof section.linkedProductsByType;
      OffersByType?: typeof section.offersByType;
      DiscountBands?: typeof section.discountBands;
    };

    return {
      ...section,
      linkedProductsByType: raw.linkedProductsByType ?? raw.LinkedProductsByType ?? [],
      offersByType: raw.offersByType ?? raw.OffersByType ?? [],
      discountBands: raw.discountBands ?? raw.DiscountBands ?? []
    };
  }

  private normalizeDisputesSection(section: VendorDashboardOverview['disputesSection']): VendorDashboardOverview['disputesSection'] {
    const raw = section as typeof section & {
      TypeBreakdown?: typeof section.typeBreakdown;
      StatusBreakdown?: typeof section.statusBreakdown;
      DisputeTrend?: typeof section.disputeTrend;
      AwaitingAction?: typeof section.awaitingAction;
      RecentEscalations?: typeof section.recentEscalations;
    };

    return {
      ...section,
      typeBreakdown: raw.typeBreakdown ?? raw.TypeBreakdown ?? [],
      statusBreakdown: raw.statusBreakdown ?? raw.StatusBreakdown ?? [],
      disputeTrend: raw.disputeTrend ?? raw.DisputeTrend ?? [],
      awaitingAction: raw.awaitingAction ?? raw.AwaitingAction ?? [],
      recentEscalations: raw.recentEscalations ?? raw.RecentEscalations ?? []
    };
  }

  private normalizeStaffSection(section: VendorDashboardOverview['staffSection']): VendorDashboardOverview['staffSection'] {
    const raw = section as typeof section & {
      BranchStatusBreakdown?: typeof section.branchStatusBreakdown;
      StaffRoleDistribution?: typeof section.staffRoleDistribution;
    };

    return {
      ...section,
      branchStatusBreakdown: raw.branchStatusBreakdown ?? raw.BranchStatusBreakdown ?? [],
      staffRoleDistribution: raw.staffRoleDistribution ?? raw.StaffRoleDistribution ?? []
    };
  }

  private normalizeFinanceSection(section: VendorDashboardOverview['financeSection']): VendorDashboardOverview['financeSection'] {
    const raw = section as typeof section & {
      LedgerTypeBreakdown?: typeof section.ledgerTypeBreakdown;
      SettlementStatusBreakdown?: typeof section.settlementStatusBreakdown;
      SalesVsPayoutsTrend?: typeof section.salesVsPayoutsTrend;
    };

    return {
      ...section,
      ledgerTypeBreakdown: raw.ledgerTypeBreakdown ?? raw.LedgerTypeBreakdown ?? [],
      settlementStatusBreakdown: raw.settlementStatusBreakdown ?? raw.SettlementStatusBreakdown ?? [],
      salesVsPayoutsTrend: raw.salesVsPayoutsTrend ?? raw.SalesVsPayoutsTrend ?? [],
      branchRevenues: (section.branchRevenues ?? []).map((branch) => ({
        ...branch,
        branchName: repairUtf8Mojibake(branch.branchName)
      }))
    };
  }

  private emptyHeroStats(): VendorDashboardOverview['heroStats'] {
    return {
      pendingOrders: 0,
      lateOrders: 0,
      readyForPickup: 0,
      driverIssues: 0,
      openDisputes: 0,
      lowStockCritical: 0
    };
  }

  private emptyOrdersSection(): VendorDashboardOverview['ordersSection'] {
    return {
      pendingOrders: 0,
      lateOrders: 0,
      readyForPickup: 0,
      driverIssues: 0,
      openDisputes: 0,
      lowStockCritical: 0,
      prepEfficiencyScore: 0,
      averagePrepTimeMinutes: 0,
      etaHealth: {
        onTimeRate: 0,
        averageDeliveryTimeMinutes: 0,
        averagePreparationTimeMinutes: 0,
        averageDispatchLeadMinutes: 0,
        averageLastMileMinutes: 0,
        recommendedBufferMinutes: 0,
        sampleSize: 0,
        calibrationSource: ''
      },
      ordersTrend: [],
      statusBreakdown: [],
      funnel: [],
      urgentOrders: [],
      latestAlerts: []
    };
  }

  private emptySalesSection(): VendorDashboardOverview['salesSection'] {
    return {
      data: {
        grossSales: 0,
        paidSales: 0,
        ordersCount: 0,
        averageOrderValue: 0,
        cancellationRate: 0,
        refundRate: 0,
        lostRevenueAmount: 0,
        salesVsOrdersTrend: [],
        weekdayPerformance: [],
        topProducts: [],
        topCategories: [],
        underperformingProducts: []
      },
      deltas: {
        salesDelta: 0,
        ordersDelta: 0,
        averageOrderValueDelta: 0
      }
    };
  }

  private emptyInventorySection(): VendorDashboardOverview['inventorySection'] {
    return {
      activeProducts: 0,
      outOfStock: 0,
      lowStock: 0,
      inactiveProducts: 0,
      productsWithOffers: 0,
      idleCapitalAmount: 0,
      stockHealthDistribution: [],
      inventoryRiskList: [],
      catalogGrowth: [],
      criticalStockWatchlist: [],
      noMovementProducts: []
    };
  }

  private emptyOffersSection(): VendorDashboardOverview['offersSection'] {
    return {
      activeOffers: 0,
      clearanceItems: 0,
      expiringOffers: 0,
      offerCoverage: 0,
      offersByType: [],
      discountBands: [],
      linkedProductsByType: [],
      expiringOffersList: [],
      promotionCandidates: []
    };
  }

  private emptyFinanceSection(): VendorDashboardOverview['financeSection'] {
    return {
      availableBalance: 0,
      pendingSettlement: 0,
      netSales: 0,
      fees: 0,
      payoutsPaid: 0,
      holdAmount: 0,
      financialLifecycleMode: '',
      branchRevenues: [],
      salesVsPayoutsTrend: [],
      settlementStatusBreakdown: [],
      ledgerTypeBreakdown: [],
      recentSettlements: [],
      recentLedgerEntries: []
    };
  }

  private emptyDisputesSection(): VendorDashboardOverview['disputesSection'] {
    return {
      openDisputes: 0,
      highPriorityDisputes: 0,
      refundRequests: 0,
      awaitingVendorResponse: 0,
      statusBreakdown: [],
      typeBreakdown: [],
      disputeTrend: [],
      awaitingAction: [],
      recentEscalations: []
    };
  }

  private emptyStaffSection(): VendorDashboardOverview['staffSection'] {
    return {
      activeBranches: 0,
      activeStaff: 0,
      pendingInvitations: 0,
      branchesNeedingCoverage: 0,
      branchStatusBreakdown: [],
      staffRoleDistribution: []
    };
  }
}
