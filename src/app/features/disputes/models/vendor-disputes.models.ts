export type VendorDisputeStatus =
  | 'submitted'
  | 'in_review'
  | 'awaiting_customer_evidence'
  | 'approved'
  | 'rejected'
  | 'resolved';

export type VendorDisputeType =
  | 'complaint'
  | 'return_request'
  | 'driver_report'
  | 'driver_dispute';

export type VendorDisputePriority = 'low' | 'medium' | 'high' | 'critical';

export interface VendorDisputeListItemVm {
  id: string;
  orderId: string;
  orderNumber: string;
  type: VendorDisputeType | string;
  status: VendorDisputeStatus | string;
  priority: VendorDisputePriority | string;
  reasonCode: string | null;
  message: string;
  vendorResponse: string | null;
  vendorRespondedAt: string | null;
  customerVisibleNote: string | null;
  initiatorRole: string;
  waitingOnRole: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDisputeAttachmentVm {
  fileName: string;
  fileUrl: string;
}

export interface VendorDisputeActivityVm {
  id: string;
  action: string;
  messageType: string;
  title: string;
  note: string | null;
  actorRole: string;
  createdAt: string;
}

export interface VendorDisputeMessageVm {
  id: string;
  action: string;
  messageType: string;
  title: string;
  body: string | null;
  authorRole: string;
  visibleTo: string[];
  isInternalOnly: boolean;
  createdAt: string;
  attachments: VendorDisputeAttachmentVm[];
}

export interface VendorDisputeParticipantVm {
  role: string;
  isInitiator: boolean;
  isAwaitingResponse: boolean;
}

export interface VendorDisputeDetailVm extends VendorDisputeListItemVm {
  queue: string;
  decisionNotes: string | null;
  requestedRefundAmount: number | null;
  approvedRefundAmount: number | null;
  refundMethod: string | null;
  costBearer: string | null;
  closedAt: string | null;
  participants: VendorDisputeParticipantVm[];
  allowedActions: string[];
  attachments: VendorDisputeAttachmentVm[];
  activities: VendorDisputeActivityVm[];
  messages: VendorDisputeMessageVm[];
}

export interface VendorDisputesListVm {
  items: VendorDisputeListItemVm[];
  page: number;
  pageSize: number;
  total: number;
}
