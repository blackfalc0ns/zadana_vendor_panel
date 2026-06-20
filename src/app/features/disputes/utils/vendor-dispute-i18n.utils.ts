import { VendorDisputeDetailVm } from '../models/vendor-disputes.models';
import { normalizeVendorDisputeType } from './vendor-dispute-display.utils';

function compactToken(value: string): string {
  return value.trim().replace(/[^a-z0-9]/gi, '').toLowerCase();
}

const KNOWN_SYSTEM_NOTE_PREFIXES = [
  'your return request',
  'your refund',
  'your compensation coupon',
  'a compensation coupon',
  'more information is required',
  'the request matches platform policy',
  'the request did not meet',
  'the case was closed',
  'the case was rejected',
  'support shared an update',
  'we received the return request',
  'we received the support case',
  'we need additional information',
  'the support case linked',
  'additional evidence is required',
  'the support team reviewed'
];

export function shouldLocalizeDisputeText(value: string, language: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return language !== 'ar';
  }

  const lower = trimmed.toLowerCase();
  return KNOWN_SYSTEM_NOTE_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export function resolveVendorDisputeRoleKey(role: string | null | undefined): string | null {
  const normalized = (role ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return `VENDOR_DISPUTES.PARTICIPANTS.${normalized.toUpperCase()}`;
}

export function resolveVendorDisputeWaitingOnKey(role: string | null | undefined): string {
  const normalized = (role ?? '').trim().toLowerCase();
  return `VENDOR_DISPUTES.WAITING_ON.${(normalized || 'REVIEW').toUpperCase()}`;
}

export function resolveVendorDisputeQueueKey(queue: string | null | undefined): string | null {
  const normalized = compactToken(queue ?? '');
  const map: Record<string, string> = {
    support: 'VENDOR_DISPUTES.QUEUE.SUPPORT',
    finance: 'VENDOR_DISPUTES.QUEUE.FINANCE',
    operations: 'VENDOR_DISPUTES.QUEUE.OPERATIONS',
    risk: 'VENDOR_DISPUTES.QUEUE.RISK',
    legal: 'VENDOR_DISPUTES.QUEUE.LEGAL',
    driverops: 'VENDOR_DISPUTES.QUEUE.DRIVER_OPS'
  };

  return map[normalized] ?? null;
}

export function resolveVendorDisputeReasonCodeKey(type: string, code: string | null | undefined): string | null {
  const normalizedType = normalizeVendorDisputeType(type);
  const normalizedCode = (code ?? '').trim().toLowerCase();
  if (!normalizedCode) {
    return null;
  }

  return `VENDOR_DISPUTES.REASONS.${normalizedType.toUpperCase()}.${normalizedCode.toUpperCase()}`;
}

export function resolveVendorDisputeActivityTitleKey(action: string | null | undefined): string | null {
  const normalized = (action ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return `VENDOR_DISPUTES.ACTIVITY.${normalized.toUpperCase()}.TITLE`;
}

export function resolveVendorDisputeActivityNoteKey(
  activity: { action: string; messageType?: string },
  dispute: VendorDisputeDetailVm
): string | null {
  const action = (activity.action ?? '').trim().toLowerCase();
  const messageType = (activity.messageType ?? '').trim().toLowerCase();

  if (messageType === 'decision') {
    return 'VENDOR_DISPUTES.ACTIVITY.DECISION.NOTE';
  }

  if (messageType === 'public_note') {
    return 'VENDOR_DISPUTES.ACTIVITY.PUBLIC_NOTE.NOTE';
  }

  if (!action) {
    return null;
  }

  return `VENDOR_DISPUTES.ACTIVITY.${action.toUpperCase()}.NOTE`;
}

export function resolveVendorDisputeCustomerNoteKey(dispute: VendorDisputeDetailVm): string | null {
  const status = dispute.status;
  const settlement = (dispute.settlementStatus ?? '').toLowerCase();

  if (settlement === 'cash_refunded' || settlement === 'coupon_redeemed' || settlement === 'coupon_issued') {
    return `VENDOR_DISPUTES.CUSTOMER_NOTE.SETTLEMENT.${settlement.toUpperCase()}`;
  }

  return status ? `VENDOR_DISPUTES.CUSTOMER_NOTE.STATUS.${status.toUpperCase()}` : null;
}

export function resolveVendorDisputeDecisionNoteKey(dispute: VendorDisputeDetailVm): string | null {
  const status = dispute.status;
  const type = normalizeVendorDisputeType(dispute.type);
  const settlement = (dispute.settlementStatus ?? '').toLowerCase();

  if (settlement === 'cash_refunded' || settlement === 'coupon_redeemed' || settlement === 'coupon_issued') {
    return `VENDOR_DISPUTES.DECISION_NOTE.SETTLEMENT.${settlement.toUpperCase()}`;
  }

  if (status === 'approved' && type === 'return_request') {
    return 'VENDOR_DISPUTES.DECISION_NOTE.STATUS.APPROVED_RETURN';
  }

  return status ? `VENDOR_DISPUTES.DECISION_NOTE.STATUS.${status.toUpperCase()}` : null;
}

export function resolveVendorDisputeSettlementKey(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) {
    return 'VENDOR_DISPUTES.SETTLEMENT_STATUS.PENDING_REVIEW';
  }

  return `VENDOR_DISPUTES.SETTLEMENT_STATUS.${normalized.toUpperCase()}`;
}

export function resolveVendorDisputeCompensationKey(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) {
    return 'VENDOR_DISPUTES.COMPENSATION_TYPES.PENDING';
  }

  return `VENDOR_DISPUTES.COMPENSATION_TYPES.${normalized.toUpperCase()}`;
}

export function resolveVendorDisputeRefundMethodKey(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return `VENDOR_DISPUTES.REFUND_METHOD.${normalized.toUpperCase()}`;
}

export function resolveVendorDisputeCostBearerKey(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return `VENDOR_DISPUTES.COST_BEARER.${normalized.toUpperCase()}`;
}
