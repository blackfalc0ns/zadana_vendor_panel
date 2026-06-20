export type VendorFinancePeriod = 'today' | 'week' | 'month' | 'quarter';

export interface VendorFinanceKpi {
  id: string;
  labelKey: string;
  value: number;
  delta: number;
  trend: 'up' | 'down';
  tone: 'primary' | 'success' | 'warning' | 'danger';
}

export interface VendorFinanceTrendPoint {
  label: string;
  sales: number;
  payout: number;
}

export interface VendorSettlement {
  id: string;
  code: string;
  date: string;
  status: 'scheduled' | 'processing' | 'paid';
  amount: number;
  ordersCount: number;
}

export interface VendorLedgerEntry {
  id: string;
  date: string;
  titleAr: string;
  titleEn: string;
  type: 'sale' | 'payout' | 'fee' | 'refund';
  amount: number;
  direction: 'in' | 'out';
  reference: string;
}

export interface VendorFinanceLedgerPage {
  items: VendorLedgerEntry[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface VendorFinanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  titleKey: string;
  bodyKey: string;
  actionLabelKey: string;
}

export interface VendorFinanceBranchOption {
  id: string;
  name: string;
  isPrimary: boolean;
}

export interface VendorFinanceBranchScope {
  canSelectBranch: boolean;
  selectedBranchId?: string | null;
  branches: VendorFinanceBranchOption[];
}

export interface VendorFinanceBranchSection {
  branchId: string;
  branchName: string;
  isPrimary: boolean;
  grossSales: number;
  vendorProfit: number;
  platformFees: number;
  vendorNet: number;
  ordersCount: number;
}

export interface VendorFinanceSnapshot {
  availableBalance: number;
  pendingSettlement: number;
  nextPayoutDate: string;
  payoutMethod: string;
  holdAmount: number;
  financialLifecycleModeStr: string;
  kpis: VendorFinanceKpi[];
  trend: VendorFinanceTrendPoint[];
  settlements: VendorSettlement[];
  ledger: VendorLedgerEntry[];
  alerts: VendorFinanceAlert[];
  branchScope?: VendorFinanceBranchScope;
  branchSections?: VendorFinanceBranchSection[];
}
