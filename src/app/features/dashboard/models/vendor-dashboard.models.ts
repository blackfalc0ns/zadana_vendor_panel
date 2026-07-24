export interface VendorDashboardRouteQuery {
  [key: string]: string;
}

export interface VendorDashboardHeroStats {
  pendingOrders: number;
  lateOrders: number;
  readyForPickup: number;
  driverIssues: number;
  openDisputes: number;
  lowStockCritical: number;
}

export interface VendorDashboardBreakdownSlice {
  key: string;
  label: string;
  value: number;
}

export interface VendorDashboardTrendPoint {
  label: string;
  value: number;
}

export interface VendorDashboardDualTrendPoint {
  label: string;
  value: number;
  secondaryValue: number;
}

export interface VendorDashboardRankedItem {
  id: string;
  labelAr: string;
  labelEn: string;
  metric: number;
  secondaryMetric: number;
}

export interface VendorDashboardUrgentOrder {
  id: string;
  orderNumber: string;
  status: string;
  placedAtUtc: string;
  reasonKey: string;
}

export interface VendorDashboardSettlementListItem {
  id: string;
  code: string;
  amount: number;
  status: string;
  occurredAtUtc: string;
  ordersCount: number;
}

export interface VendorDashboardLedgerListItem {
  id: string;
  type: string;
  label: string;
  amount: number;
  direction: string;
  occurredAtUtc: string;
  reference: string;
}

export interface VendorDashboardDisputeListItem {
  id: string;
  type: string;
  status: string;
  priority: string;
  message: string;
  occurredAtUtc: string;
}

export interface VendorDashboardBranchRevenue {
  branchId: string;
  branchName: string;
  revenue: number;
  ordersCount: number;
  averageOrderValue: number;
}

export interface VendorDashboardAlertItem {
  id: string;
  domain: string;
  severity: 'critical' | 'warning' | 'info';
  titleKey: string;
  bodyKey: string;
  route: string;
  routeQuery: VendorDashboardRouteQuery;
}

export interface VendorDashboardEtaHealth {
  onTimeRate: number;
  averageDeliveryTimeMinutes: number;
  averagePreparationTimeMinutes: number;
  averageDispatchLeadMinutes: number;
  averageLastMileMinutes: number;
  recommendedBufferMinutes: number;
  sampleSize: number;
  calibrationSource: string;
}

export interface VendorDashboardOrdersSection {
  pendingOrders: number;
  lateOrders: number;
  readyForPickup: number;
  driverIssues: number;
  openDisputes: number;
  lowStockCritical: number;
  prepEfficiencyScore: number;
  averagePrepTimeMinutes: number;
  etaHealth: VendorDashboardEtaHealth;
  ordersTrend: VendorDashboardDualTrendPoint[];
  statusBreakdown: VendorDashboardBreakdownSlice[];
  funnel: VendorDashboardBreakdownSlice[];
  urgentOrders: VendorDashboardUrgentOrder[];
  latestAlerts: VendorDashboardAlertItem[];
}

export interface VendorDashboardDeltaSummary {
  salesDelta: number;
  ordersDelta: number;
  averageOrderValueDelta: number;
}

export interface VendorDashboardSalesSection {
  grossSales: number;
  paidSales: number;
  ordersCount: number;
  averageOrderValue: number;
  cancellationRate: number;
  refundRate: number;
  lostRevenueAmount: number;
  salesVsOrdersTrend: VendorDashboardDualTrendPoint[];
  weekdayPerformance: VendorDashboardBreakdownSlice[];
  topProducts: VendorDashboardRankedItem[];
  topCategories: VendorDashboardBreakdownSlice[];
  underperformingProducts: VendorDashboardRankedItem[];
}

export interface VendorDashboardSalesSectionEnvelope {
  data: VendorDashboardSalesSection;
  deltas: VendorDashboardDeltaSummary;
}

export interface VendorDashboardInventorySection {
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  inactiveProducts: number;
  productsWithOffers: number;
  idleCapitalAmount: number;
  stockHealthDistribution: VendorDashboardBreakdownSlice[];
  inventoryRiskList: VendorDashboardRankedItem[];
  catalogGrowth: VendorDashboardTrendPoint[];
  criticalStockWatchlist: VendorDashboardRankedItem[];
  noMovementProducts: VendorDashboardRankedItem[];
}

export interface VendorDashboardOffersSection {
  activeOffers: number;
  clearanceItems: number;
  expiringOffers: number;
  offerCoverage: number;
  offersByType: VendorDashboardBreakdownSlice[];
  discountBands: VendorDashboardBreakdownSlice[];
  linkedProductsByType: VendorDashboardBreakdownSlice[];
  expiringOffersList: VendorDashboardRankedItem[];
  promotionCandidates: VendorDashboardRankedItem[];
}

export interface VendorDashboardFinanceSection {
  availableBalance: number;
  pendingSettlement: number;
  netSales: number;
  fees: number;
  payoutsPaid: number;
  holdAmount: number;
  nextSettlementAt?: string;
  financialLifecycleMode: string;
  branchRevenues: VendorDashboardBranchRevenue[];
  salesVsPayoutsTrend: VendorDashboardDualTrendPoint[];
  settlementStatusBreakdown: VendorDashboardBreakdownSlice[];
  ledgerTypeBreakdown: VendorDashboardBreakdownSlice[];
  recentSettlements: VendorDashboardSettlementListItem[];
  recentLedgerEntries: VendorDashboardLedgerListItem[];
}

export interface VendorDashboardDisputesSection {
  openDisputes: number;
  highPriorityDisputes: number;
  refundRequests: number;
  awaitingVendorResponse: number;
  statusBreakdown: VendorDashboardBreakdownSlice[];
  typeBreakdown: VendorDashboardBreakdownSlice[];
  disputeTrend: VendorDashboardTrendPoint[];
  awaitingAction: VendorDashboardDisputeListItem[];
  recentEscalations: VendorDashboardDisputeListItem[];
}

export interface VendorDashboardStaffSection {
  activeBranches: number;
  activeStaff: number;
  pendingInvitations: number;
  branchesNeedingCoverage: number;
  branchStatusBreakdown: VendorDashboardBreakdownSlice[];
  staffRoleDistribution: VendorDashboardBreakdownSlice[];
}

export interface VendorDashboardOverview {
  generatedAtUtc: string;
  period: string;
  heroStats: VendorDashboardHeroStats;
  ordersSection: VendorDashboardOrdersSection;
  salesSection: VendorDashboardSalesSectionEnvelope;
  inventorySection: VendorDashboardInventorySection;
  offersSection: VendorDashboardOffersSection;
  financeSection: VendorDashboardFinanceSection;
  disputesSection: VendorDashboardDisputesSection;
  staffSection: VendorDashboardStaffSection;
  alertsFeed: VendorDashboardAlertItem[];
}
