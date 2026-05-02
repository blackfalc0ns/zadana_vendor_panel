import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  VendorDisputeDetailVm,
  VendorDisputeListItemVm,
  VendorDisputesListVm
} from '../models/vendor-disputes.models';

interface VendorOrderCasesListResponseApi {
  items: VendorOrderCaseListItemApi[];
  page: number;
  pageSize: number;
  total: number;
}

interface VendorOrderCaseListItemApi {
  id: string;
  orderId: string;
  orderNumber: string;
  type: string;
  status: string;
  priority: string;
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

interface VendorOrderCaseDetailApi extends VendorOrderCaseListItemApi {
  queue: string;
  decisionNotes: string | null;
  requestedRefundAmount: number | null;
  approvedRefundAmount: number | null;
  refundMethod: string | null;
  costBearer: string | null;
  closedAt: string | null;
  participants: Array<{
    role: string;
    isInitiator: boolean;
    isAwaitingResponse: boolean;
  }>;
  allowedActions: string[];
  attachments: Array<{
    fileName: string;
    fileUrl: string;
  }>;
  activities: Array<{
    id: string;
    action: string;
    messageType: string;
    title: string;
    note: string | null;
    actorRole: string;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    action: string;
    messageType: string;
    title: string;
    body: string | null;
    authorRole: string;
    visibleTo: string[];
    isInternalOnly: boolean;
    createdAt: string;
    attachments: Array<{
      fileName: string;
      fileUrl: string;
    }>;
  }>;
}

interface VendorOrderCaseRespondResponseApi {
  caseId: string;
  response: string;
  respondedAt: string;
  caseStatus: string;
}

@Injectable({
  providedIn: 'root'
})
export class VendorDisputesService {
  private readonly apiUrl = `${environment.apiUrl}/vendor/order-cases`;

  constructor(private readonly http: HttpClient) {}

  getDisputes(filters: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  } = {}): Observable<VendorDisputesListVm> {
    let params = new HttpParams()
      .set('page', String(Math.max(1, filters.page ?? 1)))
      .set('pageSize', String(Math.max(1, filters.pageSize ?? 10)));

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }

    if (filters.type && filters.type !== 'all') {
      params = params.set('type', filters.type);
    }

    return this.http.get<VendorOrderCasesListResponseApi>(this.apiUrl, { params }).pipe(
      map((response) => ({
        items: response.items.map((item) => this.mapListItem(item)),
        page: response.page,
        pageSize: response.pageSize,
        total: response.total
      }))
    );
  }

  getDisputeById(caseId: string): Observable<VendorDisputeDetailVm> {
    return this.http.get<VendorOrderCaseDetailApi>(`${this.apiUrl}/${caseId}`).pipe(
      map((response) => this.mapDetail(response))
    );
  }

  respondToDispute(caseId: string, response: string): Observable<VendorOrderCaseRespondResponseApi> {
    return this.http.post<VendorOrderCaseRespondResponseApi>(`${this.apiUrl}/${caseId}/respond`, { response });
  }

  private mapListItem(item: VendorOrderCaseListItemApi): VendorDisputeListItemVm {
    return {
      id: item.id,
      orderId: item.orderId,
      orderNumber: item.orderNumber,
      type: this.normalizeType(item.type),
      status: this.normalizeStatus(item.status),
      priority: this.normalizePriority(item.priority),
      reasonCode: item.reasonCode,
      message: item.message,
      vendorResponse: item.vendorResponse,
      vendorRespondedAt: item.vendorRespondedAt,
      customerVisibleNote: item.customerVisibleNote,
      initiatorRole: item.initiatorRole,
      waitingOnRole: item.waitingOnRole,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  private mapDetail(item: VendorOrderCaseDetailApi): VendorDisputeDetailVm {
    return {
      ...this.mapListItem(item),
      queue: item.queue,
      decisionNotes: item.decisionNotes,
      requestedRefundAmount: item.requestedRefundAmount,
      approvedRefundAmount: item.approvedRefundAmount,
      refundMethod: item.refundMethod,
      costBearer: item.costBearer,
      closedAt: item.closedAt,
      participants: item.participants.map((participant) => ({ ...participant })),
      allowedActions: [...item.allowedActions],
      attachments: item.attachments.map((attachment) => ({ ...attachment })),
      activities: item.activities.map((activity) => ({ ...activity })),
      messages: item.messages.map((message) => ({
        ...message,
        visibleTo: [...message.visibleTo],
        attachments: message.attachments.map((attachment) => ({ ...attachment }))
      }))
    };
  }

  private normalizeType(value: string): string {
    const normalized = value.trim().toLowerCase();

    switch (normalized) {
      case 'returnrequest':
        return 'return_request';
      case 'driverreport':
        return 'driver_report';
      case 'driverdispute':
        return 'driver_dispute';
      default:
        return normalized;
    }
  }

  private normalizeStatus(value: string): string {
    const normalized = value.trim().toLowerCase();

    switch (normalized) {
      case 'inreview':
        return 'in_review';
      case 'awaitingcustomerevidence':
        return 'awaiting_customer_evidence';
      default:
        return normalized;
    }
  }

  private normalizePriority(value: string): string {
    return value.trim().toLowerCase();
  }
}
