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

export interface VendorFinanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  titleKey: string;
  bodyKey: string;
  actionLabelKey: string;
}

export interface VendorFinanceSnapshot {
  availableBalance: number;
  pendingSettlement: number;
  nextPayoutDate: string;
  payoutMethod: string;
  holdAmount: number;
  kpis: VendorFinanceKpi[];
  trend: VendorFinanceTrendPoint[];
  settlements: VendorSettlement[];
  ledger: VendorLedgerEntry[];
  alerts: VendorFinanceAlert[];
}
