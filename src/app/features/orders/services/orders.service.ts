import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OrderDetail,
  OrderFulfillmentStatus,
  OrderItem,
  OrderListItem,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
  OrderTimelineEntry,
  PaginatedOrdersResponse
} from '../models/orders.models';

interface VendorOrdersApiResponse {
  items: VendorOrderListItemApiModel[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface VendorOrderListItemApiModel {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  itemsCount: number;
  placedAtUtc: string;
  isLate: boolean;
}

interface VendorOrderDetailApiModel {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  notes?: string | null;
  placedAtUtc: string;
  items: VendorOrderItemApiModel[];
  timeline: VendorOrderTimelineApiModel[];
}

interface VendorOrderItemApiModel {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface VendorOrderTimelineApiModel {
  status: string;
  label: string;
  timestampUtc: string;
  isCompleted: boolean;
  note?: string | null;
}

interface VendorOrderStatusMutationResponse {
  orderId: string;
  status: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly apiUrl = `${environment.apiUrl}/vendor/orders`;

  constructor(private readonly http: HttpClient) {}

  getOrders(params: {
    pageNumber: number;
    pageSize: number;
    status?: OrderStatus | 'ALL';
    searchTerm?: string;
    paymentMethod?: OrderPaymentMethod | 'ALL';
    lateState?: 'ALL' | 'LATE' | 'ONTIME';
  }): Observable<PaginatedOrdersResponse> {
    const requestParams = new HttpParams()
      .set('page', '1')
      .set('pageSize', '250');

    return this.http.get<VendorOrdersApiResponse>(this.apiUrl, { params: requestParams }).pipe(
      map((response) => response.items.map((item) => this.mapListItem(item))),
      map((items) => this.applyFilters(items, params)),
      map((items) => this.toPaginatedResponse(items, params.pageNumber, params.pageSize))
    );
  }

  getOrderById(id: string): Observable<OrderDetail | null> {
    return this.http.get<VendorOrderDetailApiModel>(`${this.apiUrl}/${id}`).pipe(
      map((order) => this.mapDetail(order))
    );
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<OrderDetail> {
    const action = this.resolveMutationAction(status);
    return this.http.post<VendorOrderStatusMutationResponse>(`${this.apiUrl}/${orderId}/${action}`, {}).pipe(
      switchMap(() => this.http.get<VendorOrderDetailApiModel>(`${this.apiUrl}/${orderId}`)),
      map((order) => this.mapDetail(order))
    );
  }

  createOrder(orderData: any): Observable<any> {
    const lineItems = Array.isArray(orderData?.items) ? orderData.items : [];
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + Number(item?.total || 0), 0);
    const deliveryFee = 0;
    const tax = 0;

    return of({
      id: `manual-${Date.now()}`,
      displayId: `manual-${Date.now()}`,
      customerName: orderData?.customerName || '',
      customerPhone: orderData?.customerPhone || '',
      customerAddress: orderData?.customerAddress || '',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toISOString(),
      status: 'NEW' as OrderStatus,
      paymentStatus: (orderData?.paymentMethodType === 'CARD' ? 'PAID' : 'COD_PENDING') as OrderPaymentStatus,
      paymentMethodType: (orderData?.paymentMethodType || 'COD') as OrderPaymentMethod,
      paymentMethodLabel: orderData?.paymentMethodLabel || 'Manual',
      fulfillmentStatus: 'QUEUED' as OrderFulfillmentStatus,
      total: subtotal + deliveryFee + tax,
      subtotal,
      deliveryFee,
      tax,
      itemCount: lineItems.length,
      isLate: false,
      hasActiveIssue: false,
      items: lineItems,
      timeline: [
        {
          status: 'NEW' as OrderStatus,
          labelAr: 'تم إنشاء الطلب محليًا',
          labelEn: 'Order created locally',
          timestamp: new Date().toISOString(),
          isCompleted: true
        }
      ]
    });
  }

  private applyFilters(items: OrderListItem[], params: {
    status?: OrderStatus | 'ALL';
    searchTerm?: string;
    paymentMethod?: OrderPaymentMethod | 'ALL';
    lateState?: 'ALL' | 'LATE' | 'ONTIME';
  }): OrderListItem[] {
    let filtered = [...items];

    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((item) => item.status === params.status);
    }

    if (params.searchTerm?.trim()) {
      const normalizedSearch = params.searchTerm.trim().toLowerCase();
      filtered = filtered.filter((item) =>
        item.displayId.toLowerCase().includes(normalizedSearch) ||
        item.customerName.toLowerCase().includes(normalizedSearch) ||
        item.customerPhone.toLowerCase().includes(normalizedSearch)
      );
    }

    if (params.paymentMethod && params.paymentMethod !== 'ALL') {
      filtered = filtered.filter((item) => item.paymentMethodType === params.paymentMethod);
    }

    if (params.lateState === 'LATE') {
      filtered = filtered.filter((item) => item.isLate);
    }

    if (params.lateState === 'ONTIME') {
      filtered = filtered.filter((item) => !item.isLate);
    }

    return filtered;
  }

  private toPaginatedResponse(items: OrderListItem[], pageNumber: number, pageSize: number): PaginatedOrdersResponse {
    const safePageSize = Math.max(1, pageSize);
    const safePageNumber = Math.max(1, pageNumber);
    const totalCount = items.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
    const startIndex = (safePageNumber - 1) * safePageSize;

    return {
      items: items.slice(startIndex, startIndex + safePageSize),
      pageNumber: Math.min(safePageNumber, totalPages),
      pageSize: safePageSize,
      totalCount,
      totalPages
    };
  }

  private mapListItem(item: VendorOrderListItemApiModel): OrderListItem {
    const status = this.mapBackendStatus(item.status);
    const paymentMethodType = this.mapPaymentMethod(item.paymentMethod);

    return {
      id: item.id,
      displayId: item.orderNumber,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      date: this.formatDate(item.placedAtUtc),
      time: item.placedAtUtc,
      status,
      paymentStatus: this.mapPaymentStatus(item.paymentStatus),
      paymentMethodType,
      fulfillmentStatus: this.mapFulfillmentStatus(status),
      paymentMethodLabel: this.mapPaymentMethodLabel(paymentMethodType),
      total: item.totalAmount,
      itemCount: item.itemsCount,
      isLate: item.isLate,
      hasActiveIssue: status === 'CANCELLED'
    };
  }

  private mapDetail(item: VendorOrderDetailApiModel): OrderDetail {
    const status = this.mapBackendStatus(item.status);
    const paymentMethodType = this.mapPaymentMethod(item.paymentMethod);
    const tax = Math.max(0, item.totalAmount - item.subtotal - item.deliveryFee);

    return {
      id: item.id,
      displayId: item.orderNumber,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      customerAddress: item.customerAddress,
      date: this.formatDate(item.placedAtUtc),
      time: item.placedAtUtc,
      status,
      paymentStatus: this.mapPaymentStatus(item.paymentStatus),
      paymentMethodType,
      fulfillmentStatus: this.mapFulfillmentStatus(status),
      paymentMethodLabel: this.mapPaymentMethodLabel(paymentMethodType),
      total: item.totalAmount,
      subtotal: item.subtotal,
      deliveryFee: item.deliveryFee,
      tax,
      itemCount: item.items.length,
      isLate: false,
      hasActiveIssue: status === 'CANCELLED',
      notes: item.notes ?? undefined,
      items: item.items.map((orderItem) => this.mapOrderItem(orderItem)),
      timeline: item.timeline.map((timelineItem) => this.mapTimelineItem(timelineItem))
    };
  }

  private mapOrderItem(item: VendorOrderItemApiModel): OrderItem {
    return {
      id: item.id,
      nameAr: item.productName,
      nameEn: item.productName,
      quantity: item.quantity,
      price: item.unitPrice,
      total: item.lineTotal,
      sku: item.id.slice(0, 8)
    };
  }

  private mapTimelineItem(item: VendorOrderTimelineApiModel): OrderTimelineEntry {
    const status = this.mapBackendStatus(item.status);
    const label = this.getStatusLabel(status);

    return {
      status,
      labelAr: label.ar,
      labelEn: label.en,
      timestamp: item.timestampUtc,
      isCompleted: item.isCompleted,
      notes: item.note ?? undefined
    };
  }

  private resolveMutationAction(status: OrderStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'accept';
      case 'IN_PROGRESS':
        return 'preparing';
      case 'READY_FOR_PICKUP':
        return 'ready';
      default:
        throw new Error(`Order status action is not supported for ${status}.`);
    }
  }

  private mapBackendStatus(status: string): OrderStatus {
    switch (status) {
      case 'PendingPayment':
      case 'Placed':
      case 'PendingVendorAcceptance':
        return 'NEW';
      case 'Accepted':
        return 'CONFIRMED';
      case 'Preparing':
        return 'IN_PROGRESS';
      case 'ReadyForPickup':
        return 'READY_FOR_PICKUP';
      case 'DriverAssigned':
      case 'PickedUp':
        return 'PICKED_UP';
      case 'OnTheWay':
        return 'OUT_FOR_DELIVERY';
      case 'Delivered':
        return 'DELIVERED';
      case 'Refunded':
        return 'RETURNED';
      case 'Cancelled':
      case 'VendorRejected':
      case 'DeliveryFailed':
        return 'CANCELLED';
      default:
        return 'NEW';
    }
  }

  private mapPaymentStatus(status: string): OrderPaymentStatus {
    switch (status) {
      case 'Paid':
        return 'PAID';
      case 'Failed':
        return 'FAILED';
      case 'Refunded':
        return 'REFUNDED';
      case 'PartiallyRefunded':
        return 'PARTIALLY_REFUNDED';
      case 'Pending':
      case 'Initiated':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  }

  private mapPaymentMethod(method: string): OrderPaymentMethod {
    return method === 'Card' ? 'CARD' : 'COD';
  }

  private mapPaymentMethodLabel(method: OrderPaymentMethod): string {
    return method === 'CARD' ? 'بطاقة بنكية' : 'نقدًا عند الاستلام';
  }

  private mapFulfillmentStatus(status: OrderStatus): OrderFulfillmentStatus {
    switch (status) {
      case 'CONFIRMED':
      case 'IN_PROGRESS':
        return 'PREPARING';
      case 'READY_FOR_PICKUP':
        return 'READY_FOR_PICKUP';
      case 'PICKED_UP':
        return 'PICKED_UP';
      case 'OUT_FOR_DELIVERY':
        return 'ON_ROUTE';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'DELIVERED';
      case 'CANCELLED':
      case 'RETURNED':
        return 'CANCELLED';
      default:
        return 'QUEUED';
    }
  }

  private getStatusLabel(status: OrderStatus): { ar: string; en: string } {
    const labels: Record<OrderStatus, { ar: string; en: string }> = {
      NEW: { ar: 'طلب جديد', en: 'New order' },
      CONFIRMED: { ar: 'تم التأكيد', en: 'Confirmed' },
      IN_PROGRESS: { ar: 'قيد التجهيز', en: 'Preparing' },
      READY_FOR_PICKUP: { ar: 'جاهز للاستلام', en: 'Ready for pickup' },
      PICKED_UP: { ar: 'تم الاستلام من المندوب', en: 'Picked up' },
      OUT_FOR_DELIVERY: { ar: 'في الطريق', en: 'On the way' },
      DELIVERED: { ar: 'تم التوصيل', en: 'Delivered' },
      COMPLETED: { ar: 'مكتمل', en: 'Completed' },
      CANCELLED: { ar: 'ملغي', en: 'Cancelled' },
      RETURNED: { ar: 'مرتجع', en: 'Returned' }
    };

    return labels[status];
  }

  private formatDate(dateText: string): string {
    const parsedDate = new Date(dateText);
    if (Number.isNaN(parsedDate.getTime())) {
      return dateText;
    }

    return parsedDate.toISOString().slice(0, 10);
  }
}
