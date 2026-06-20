export interface VendorDashboardMemoTranslation {
  key: string;
  params?: Record<string, string>;
}

function compactToken(value: string): string {
  return value.trim().replace(/[^a-z0-9]/gi, '').toLowerCase();
}

const BACKEND_ORDER_STATUS_KEYS: Record<string, string> = {
  pendingpayment: 'ORDERS.STATUS_PENDING_PAYMENT',
  pendingbankconfirmation: 'ORDERS.STATUS_PENDING_BANK_CONFIRMATION',
  placed: 'ORDERS.STATUS_NEW',
  pendingvendoracceptance: 'ORDERS.STATUS_PENDING_VENDOR_ACCEPTANCE',
  accepted: 'ORDERS.STATUS_CONFIRMED',
  preparing: 'ORDERS.STATUS_IN_PROGRESS',
  readyforpickup: 'ORDERS.STATUS_READY_FOR_PICKUP',
  driverassignmentinprogress: 'ORDERS.STATUS_DRIVER_ASSIGNMENT_IN_PROGRESS',
  driverassigned: 'ORDERS.STATUS_DRIVER_ASSIGNED',
  pickedup: 'ORDERS.STATUS_PICKED_UP',
  ontheway: 'ORDERS.STATUS_OUT_FOR_DELIVERY',
  delivered: 'ORDERS.STATUS_DELIVERED',
  cancelled: 'ORDERS.STATUS_CANCELLED',
  vendorrejected: 'ORDERS.STATUS_VENDOR_REJECTED',
  deliveryfailed: 'ORDERS.STATUS_DELIVERY_FAILED',
  refunded: 'ORDERS.STATUS_REFUNDED'
};

const FRONTEND_ORDER_STATUS_KEYS: Record<string, string> = {
  NEW: 'ORDERS.STATUS_NEW',
  CONFIRMED: 'ORDERS.STATUS_CONFIRMED',
  IN_PROGRESS: 'ORDERS.STATUS_IN_PROGRESS',
  READY: 'ORDERS.STATUS_READY',
  READY_FOR_PICKUP: 'ORDERS.STATUS_READY_FOR_PICKUP',
  DRIVER_ASSIGNMENT_IN_PROGRESS: 'ORDERS.STATUS_DRIVER_ASSIGNMENT_IN_PROGRESS',
  DRIVER_ASSIGNED: 'ORDERS.STATUS_DRIVER_ASSIGNED',
  PICKED_UP: 'ORDERS.STATUS_PICKED_UP',
  OUT_FOR_DELIVERY: 'ORDERS.STATUS_OUT_FOR_DELIVERY',
  DELIVERED: 'ORDERS.STATUS_DELIVERED',
  COMPLETED: 'ORDERS.STATUS_COMPLETED',
  CANCELLED: 'ORDERS.STATUS_CANCELLED',
  RETURNED: 'ORDERS.STATUS_RETURNED',
  DELIVERY_FAILED: 'ORDERS.STATUS_DELIVERY_FAILED',
  REFUNDED: 'ORDERS.STATUS_REFUNDED'
};

export function resolveVendorOrderStatusKey(status: string | null | undefined): string {
  const raw = (status ?? '').trim();
  if (!raw) {
    return 'COMMON.STATUS';
  }

  if (/^[A-Z0-9_]+$/.test(raw)) {
    return FRONTEND_ORDER_STATUS_KEYS[raw] ?? 'COMMON.STATUS';
  }

  return BACKEND_ORDER_STATUS_KEYS[compactToken(raw)] ?? 'COMMON.STATUS';
}

export function resolveVendorSettlementStatusKey(status: string | null | undefined): string {
  const normalized = (status ?? '').trim().toLowerCase();
  switch (normalized) {
    case 'paid':
      return 'DASHBOARD.SETTLEMENT_STATUS.PAID';
    case 'processing':
      return 'DASHBOARD.SETTLEMENT_STATUS.PROCESSING';
    case 'scheduled':
      return 'DASHBOARD.SETTLEMENT_STATUS.SCHEDULED';
    default:
      return 'COMMON.STATUS';
  }
}

export function resolveVendorLedgerReferenceKey(reference: string | null | undefined): string | null {
  const raw = (reference ?? '').trim();
  if (!raw) {
    return null;
  }

  if (/^[0-9a-f-]{36}$/i.test(raw)) {
    return null;
  }

  const compact = compactToken(raw);
  const map: Record<string, string> = {
    order: 'DASHBOARD.LEDGER_REFERENCE.ORDER',
    orderrevenue: 'DASHBOARD.LEDGER_REFERENCE.ORDER_REVENUE',
    vendorrecovery: 'DASHBOARD.LEDGER_REFERENCE.VENDOR_RECOVERY',
    payout: 'DASHBOARD.LEDGER_REFERENCE.PAYOUT',
    settlement: 'DASHBOARD.LEDGER_REFERENCE.SETTLEMENT'
  };

  return map[compact] ?? null;
}

const DEFAULT_LEDGER_LABEL_KEYS: Record<string, string> = {
  orderrevenue: 'DASHBOARD.LEDGER_DEFAULTS.ORDER_REVENUE',
  payouthold: 'DASHBOARD.LEDGER_DEFAULTS.PAYOUT_HOLD',
  payoutholdrelease: 'DASHBOARD.LEDGER_DEFAULTS.PAYOUT_HOLD_RELEASE',
  vendorpayout: 'DASHBOARD.LEDGER_DEFAULTS.VENDOR_PAYOUT',
  refund: 'DASHBOARD.LEDGER_DEFAULTS.REFUND',
  walletadjustment: 'DASHBOARD.LEDGER_DEFAULTS.WALLET_ADJUSTMENT',
  walletcredit: 'DASHBOARD.LEDGER_DEFAULTS.WALLET_CREDIT',
  walletdebit: 'DASHBOARD.LEDGER_DEFAULTS.WALLET_DEBIT',
  settlement: 'DASHBOARD.LEDGER_DEFAULTS.SETTLEMENT',
  cashcollected: 'DASHBOARD.LEDGER_DEFAULTS.CASH_COLLECTED'
};

export function resolveVendorLedgerDefaultKey(label: string | null | undefined): string | null {
  const compact = compactToken(label ?? '');
  return DEFAULT_LEDGER_LABEL_KEYS[compact] ?? null;
}

export function resolveVendorLedgerMemo(description: string | null | undefined): VendorDashboardMemoTranslation | null {
  if (!description?.trim()) {
    return null;
  }

  const text = description.trim();
  const uuid = '([0-9a-f-]{36})';
  const orderRef = '(.+)';

  const patterns: Array<{ regex: RegExp; key: string; groups: string[] }> = [
    { regex: new RegExp(`^Payout paid ${uuid}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.PAYOUT_PAID', groups: ['id'] },
    { regex: new RegExp(`^Platform cash payout ${uuid}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.PLATFORM_CASH_PAYOUT', groups: ['id'] },
    { regex: new RegExp(`^Expected COD receivable for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.COD_RECEIVABLE', groups: ['order'] },
    { regex: new RegExp(`^Expected customer advance clearing for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.CUSTOMER_ADVANCE_CLEARING', groups: ['order'] },
    { regex: new RegExp(`^Revenue reconciliation delta for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.REVENUE_RECONCILIATION_DELTA', groups: ['order'] },
    { regex: new RegExp(`^Gateway receivable on payment captured for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.GATEWAY_RECEIVABLE', groups: ['order'] },
    { regex: new RegExp(`^Customer advance recognised for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.CUSTOMER_ADVANCE_RECOGNISED', groups: ['order'] },
    { regex: new RegExp(`^Customer advance recognized for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.CUSTOMER_ADVANCE_RECOGNISED', groups: ['order'] },
    { regex: new RegExp(`^COD cash collected for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.COD_CASH_COLLECTED', groups: ['order'] },
    { regex: new RegExp(`^Customer advance cleared for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.CUSTOMER_ADVANCE_CLEARED', groups: ['order'] },
    { regex: new RegExp(`^Vendor payable for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.VENDOR_PAYABLE', groups: ['order'] },
    { regex: new RegExp(`^Driver payable for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.DRIVER_PAYABLE', groups: ['order'] },
    { regex: new RegExp(`^Platform revenue for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.PLATFORM_REVENUE', groups: ['order'] },
    { regex: new RegExp(`^Tax payable for order ${orderRef}$`, 'i'), key: 'DASHBOARD.LEDGER_MEMOS.TAX_PAYABLE', groups: ['order'] },
    { regex: /^Driver withdrawal approved for transfer$/i, key: 'DASHBOARD.LEDGER_MEMOS.DRIVER_WITHDRAWAL_APPROVED', groups: [] }
  ];

  for (const { regex, key, groups } of patterns) {
    const match = regex.exec(text);
    if (!match) {
      continue;
    }

    const params: Record<string, string> = {};
    groups.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    return { key, params: groups.length > 0 ? params : undefined };
  }

  return null;
}
