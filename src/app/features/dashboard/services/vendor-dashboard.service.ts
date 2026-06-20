import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorDashboardOverview } from '../models/vendor-dashboard.models';
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
      ordersSection: this.pickSection(source.ordersSection, source.OrdersSection, this.emptyOrdersSection()),
      salesSection: this.pickSection(source.salesSection, source.SalesSection, this.emptySalesSection()),
      inventorySection: this.pickSection(source.inventorySection, source.InventorySection, this.emptyInventorySection()),
      offersSection: this.pickSection(source.offersSection, source.OffersSection, this.emptyOffersSection()),
      financeSection: this.normalizeFinanceSection(this.pickSection(source.financeSection, source.FinanceSection, this.emptyFinanceSection())),
      disputesSection: this.pickSection(source.disputesSection, source.DisputesSection, this.emptyDisputesSection()),
      staffSection: this.pickSection(source.staffSection, source.StaffSection, this.emptyStaffSection()),
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

  private normalizeFinanceSection(section: VendorDashboardOverview['financeSection']): VendorDashboardOverview['financeSection'] {
    return {
      ...section,
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
