import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, timeout } from 'rxjs';
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
 assignedDriver?: VendorAssignedDriverApiModel | null;
 driverArrivalState?: string;
 driverArrivalUpdatedAtUtc?: string | null;
 pickupOtp?: string | null;
 canConfirmPickup?: boolean;
 pickupOtpStatus?: string;
 vendorLocation?: { latitude: number; longitude: number } | null;
 customerLocation?: { latitude: number; longitude: number } | null;
 driverLiveLocation?: {
 latitude: number;
 longitude: number;
 accuracyMeters?: number | null;
 recordedAtUtc: string;
 } | null;
 items: VendorOrderItemApiModel[];
 timeline: VendorOrderTimelineApiModel[];
}

interface VendorAssignedDriverApiModel {
 id: string;
 name: string;
 phoneNumber?: string | null;
 vehicleType: string;
 plateNumber: string;
 imageUrl?: string | null;
}

interface VendorOrderItemApiModel {
 id: string;
 productName: string;
 productNameAr?: string;
 productNameEn?: string;
 quantity: number;
 unitPrice: number;
 lineTotal: number;
 imageUrl?: string | null;
 variantDisplaySize?: string | null;
 packageTypeName?: string | null;
 measurementValue?: number | null;
 measurementUnitName?: string | null;
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
 private static readonly VENDOR_TIMELINE_FLOW: OrderStatus[] = [
 'NEW',
 'CONFIRMED',
 'IN_PROGRESS',
 'READY_FOR_PICKUP',
 'DRIVER_ASSIGNMENT_IN_PROGRESS',
 'DRIVER_ASSIGNED',
 'PICKED_UP',
 'OUT_FOR_DELIVERY',
 'DELIVERED'
 ];

 private static readonly TERMINAL_STATUSES: OrderStatus[] = ['CANCELLED', 'DELIVERY_FAILED', 'REFUNDED'];

 private readonly apiUrl = `${environment.apiUrl}/vendor/orders`;
 private cachedAllOrders: OrderListItem[] | null = null;
 private allOrdersRequest$?: Observable<OrderListItem[]>;

 constructor(private readonly http: HttpClient) {}

 invalidateOrdersCache(): void {
 this.cachedAllOrders = null;
 this.allOrdersRequest$ = undefined;
 }

 getOrders(params: {
 pageNumber: number;
 pageSize: number;
 status?: OrderStatus | 'ALL';
 searchTerm?: string;
 paymentMethod?: OrderPaymentMethod | 'ALL';
 lateState?: 'ALL' | 'LATE' | 'ONTIME';
 }): Observable<PaginatedOrdersResponse> {
 return this.fetchAllOrders().pipe(
 map((items) => this.applyFilters(items, params)),
 map((items) => this.toPaginatedResponse(items, params.pageNumber, params.pageSize))
 );
 }

 exportOrders(filters?: {
 search?: string;
 status?: string;
 paymentMethod?: string;
 }): Observable<Blob> {
 let params = new HttpParams();

 if (filters?.search?.trim()) {
 params = params.set('search', filters.search.trim());
 }

 if (filters?.status && filters.status !== 'ALL') {
 params = params.set('status', filters.status);
 }

 if (filters?.paymentMethod && filters.paymentMethod !== 'ALL') {
 params = params.set('paymentMethod', filters.paymentMethod);
 }

 return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
 }

 getOrdersSummary(): Observable<{
 total: number;
 new: number;
 inProgress: number;
 late: number;
 }> {
 return this.fetchAllOrders().pipe(
 map((items) => ({
 total: items.length,
 new: items.filter((order) => order.status === 'NEW').length,
 inProgress: items.filter((order) =>
 ['CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP'].includes(order.status)
 ).length,
 late: items.filter((order) => order.isLate).length
 }))
 );
 }

 private fetchAllOrders(): Observable<OrderListItem[]> {
 if (this.cachedAllOrders) {
 return of(this.cachedAllOrders);
 }

 if (!this.allOrdersRequest$) {
 const requestParams = new HttpParams().set('page', '1').set('pageSize', '250');

 this.allOrdersRequest$ = this.http.get<VendorOrdersApiResponse>(this.apiUrl, { params: requestParams }).pipe(
 timeout(15000),
 map((response) => this.extractApiItems(response).map((item) => this.mapListItem(item))),
 tap((items) => {
 this.cachedAllOrders = items;
 }),
 catchError(() => {
 if (this.cachedAllOrders) {
 return of(this.cachedAllOrders);
 }

 return of([]);
 }),
 finalize(() => {
 this.allOrdersRequest$ = undefined;
 }),
 shareReplay(1)
 );
 }

 return this.allOrdersRequest$;
 }

 private extractApiItems(response: VendorOrdersApiResponse | null | undefined): VendorOrderListItemApiModel[] {
 const rawItems = (response as { items?: VendorOrderListItemApiModel[]; Items?: VendorOrderListItemApiModel[] } | null | undefined)?.items
 ?? (response as { Items?: VendorOrderListItemApiModel[] } | null | undefined)?.Items
 ?? [];

 return Array.isArray(rawItems) ? rawItems : [];
 }

 getOrderById(id: string): Observable<OrderDetail | null> {
 return this.http.get<VendorOrderDetailApiModel>(`${this.apiUrl}/${id}`).pipe(
 timeout(15000),
 map((order) => this.mapDetail(order)),
 catchError(() => of(null))
 );
 }

 updateOrderStatus(orderId: string, status: OrderStatus): Observable<OrderDetail> {
 const action = this.resolveMutationAction(status);
 return this.http.post<VendorOrderStatusMutationResponse>(`${this.apiUrl}/${orderId}/${action}`, {}).pipe(
 switchMap(() => this.http.get<VendorOrderDetailApiModel>(`${this.apiUrl}/${orderId}`)),
 map((order) => this.mapDetail(order)),
 tap(() => this.invalidateOrdersCache())
 );
 }

 confirmPickupOtp(orderId: string, otpCode: string): Observable<OrderDetail> {
 return this.http.post<{ orderId: string; assignmentId: string; status: string; message: string }>(
 `${this.apiUrl}/${orderId}/confirm-pickup`,
 { otpCode }
 ).pipe(
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
 backendStatus: 'PendingVendorAcceptance',
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
  labelAr: 'أنشأنا الطلب محليًا',
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

 if (params.status && params.status!== 'ALL') {
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

 if (params.paymentMethod && params.paymentMethod!== 'ALL') {
 filtered = filtered.filter((item) => item.paymentMethodType === params.paymentMethod);
 }

 if (params.lateState === 'LATE') {
 filtered = filtered.filter((item) => item.isLate);
 }

 if (params.lateState === 'ONTIME') {
 filtered = filtered.filter((item) =>!item.isLate);
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
 const raw = item as VendorOrderListItemApiModel & Record<string, unknown>;
 const statusValue = String(raw.status ?? raw['Status'] ?? '');
 const paymentMethodValue = String(raw.paymentMethod ?? raw['PaymentMethod'] ?? '');
 const paymentStatusValue = String(raw.paymentStatus ?? raw['PaymentStatus'] ?? '');
 const placedAtUtc = String(raw.placedAtUtc ?? raw['PlacedAtUtc'] ?? '');

 const status = this.mapBackendStatus(statusValue);
 const paymentMethodType = this.mapPaymentMethod(paymentMethodValue);

 return {
 id: String(raw.id ?? raw['Id'] ?? ''),
 displayId: String(raw.orderNumber ?? raw['OrderNumber'] ?? ''),
 backendStatus: statusValue,
 customerName: String(raw.customerName ?? raw['CustomerName'] ?? ''),
 customerPhone: String(raw.customerPhone ?? raw['CustomerPhone'] ?? ''),
 date: this.formatDate(placedAtUtc),
 time: placedAtUtc,
 status,
 paymentStatus: this.mapPaymentStatus(paymentStatusValue),
 paymentMethodType,
 fulfillmentStatus: this.mapFulfillmentStatus(status),
 paymentMethodLabel: this.mapPaymentMethodLabel(paymentMethodType),
 total: Number(raw.totalAmount ?? raw['TotalAmount'] ?? 0),
 itemCount: Number(raw.itemsCount ?? raw['ItemsCount'] ?? 0),
 isLate: Boolean(raw.isLate ?? raw['IsLate'] ?? false),
 hasActiveIssue: status === 'CANCELLED'
 };
 }

 private mapDetail(item: VendorOrderDetailApiModel): OrderDetail {
 const raw = item as VendorOrderDetailApiModel & Record<string, unknown>;
 const status = this.mapBackendStatus(String(raw.status ?? raw['Status'] ?? ''));
 const paymentMethodType = this.mapPaymentMethod(String(raw.paymentMethod ?? raw['PaymentMethod'] ?? ''));
 const subtotal = Number(raw.subtotal ?? raw['Subtotal'] ?? 0);
 const deliveryFee = Number(raw.deliveryFee ?? raw['DeliveryFee'] ?? 0);
 const totalAmount = Number(raw.totalAmount ?? raw['TotalAmount'] ?? 0);
 const tax = Math.max(0, totalAmount - subtotal - deliveryFee);
 const driver = (raw.assignedDriver ?? raw['AssignedDriver']) as VendorAssignedDriverApiModel | null | undefined;
 const rawItems = (raw.items ?? raw['Items']) as VendorOrderItemApiModel[] | undefined;
 const items = Array.isArray(rawItems) ? rawItems : [];
 const rawTimeline = (raw.timeline ?? raw['Timeline']) as VendorOrderTimelineApiModel[] | undefined;
 const timeline = Array.isArray(rawTimeline) ? rawTimeline : [];
 const placedAtUtc = String(raw.placedAtUtc ?? raw['PlacedAtUtc'] ?? '');

 return {
 id: String(raw.id ?? raw['Id'] ?? ''),
 displayId: String(raw.orderNumber ?? raw['OrderNumber'] ?? ''),
 backendStatus: String(raw.status ?? raw['Status'] ?? ''),
 customerName: String(raw.customerName ?? raw['CustomerName'] ?? ''),
 customerPhone: String(raw.customerPhone ?? raw['CustomerPhone'] ?? ''),
 customerAddress: String(raw.customerAddress ?? raw['CustomerAddress'] ?? ''),
 date: this.formatDate(placedAtUtc),
 time: placedAtUtc,
 status,
 paymentStatus: this.mapPaymentStatus(String(raw.paymentStatus ?? raw['PaymentStatus'] ?? '')),
 paymentMethodType,
 fulfillmentStatus: this.mapFulfillmentStatus(status),
 paymentMethodLabel: this.mapPaymentMethodLabel(paymentMethodType),
 total: totalAmount,
 subtotal,
 deliveryFee,
 tax,
 itemCount: items.length,
 isLate: false,
 hasActiveIssue: status === 'CANCELLED',
 notes: (raw.notes ?? raw['Notes']) ? String(raw.notes ?? raw['Notes']) : undefined,
 driverName: driver?.name,
 driverPhone: driver?.phoneNumber ?? undefined,
 driverVehicleType: driver?.vehicleType,
 driverVehiclePlate: driver?.plateNumber,
 driverImage: driver?.imageUrl ?? undefined,
 items: items.map((orderItem) => this.mapOrderItem(orderItem)),
 timeline: this.buildFullVendorTimeline(
 status,
 timeline,
 placedAtUtc
 ),
 canConfirmPickup: Boolean(raw.canConfirmPickup ?? raw['CanConfirmPickup'] ?? false),
 pickupOtpStatus: (raw.pickupOtpStatus ?? raw['PickupOtpStatus']) ? String(raw.pickupOtpStatus ?? raw['PickupOtpStatus']) : undefined,
 vendorLocation: this.mapCoordinatePair(raw.vendorLocation ?? raw['VendorLocation']),
 customerLocation: this.mapCoordinatePair(raw.customerLocation ?? raw['CustomerLocation']),
 driverLiveLocation: this.mapDriverLiveLocation(raw.driverLiveLocation ?? raw['DriverLiveLocation'])
 };
 }

 private mapCoordinatePair(value: unknown): { lat: number; lng: number } | undefined {
 const raw = value as { latitude?: number; longitude?: number; Latitude?: number; Longitude?: number } | null | undefined;
 if (!raw) {
 return undefined;
 }

 const lat = Number(raw.latitude ?? raw.Latitude);
 const lng = Number(raw.longitude ?? raw.Longitude);
 if (Number.isNaN(lat) || Number.isNaN(lng)) {
 return undefined;
 }

 return { lat, lng };
 }

 private mapDriverLiveLocation(value: unknown): OrderDetail['driverLiveLocation'] {
 const raw = value as {
 latitude?: number;
 longitude?: number;
 accuracyMeters?: number | null;
 recordedAtUtc?: string;
 Latitude?: number;
 Longitude?: number;
 AccuracyMeters?: number | null;
 RecordedAtUtc?: string;
 } | null | undefined;

 if (!raw) {
 return undefined;
 }

 const lat = Number(raw.latitude ?? raw.Latitude);
 const lng = Number(raw.longitude ?? raw.Longitude);
 if (Number.isNaN(lat) || Number.isNaN(lng)) {
 return undefined;
 }

 return {
 lat,
 lng,
 accuracyMeters: raw.accuracyMeters ?? raw.AccuracyMeters ?? undefined,
 recordedAtUtc: String(raw.recordedAtUtc ?? raw.RecordedAtUtc ?? '')
 };
 }

 private mapOrderItem(item: VendorOrderItemApiModel): OrderItem {
 const raw = item as VendorOrderItemApiModel & Record<string, unknown>;
 const imageUrl = raw.imageUrl ?? raw['ImageUrl'] ?? raw['snapshotImageUrl'] ?? raw['SnapshotImageUrl'];
 const productName = String(raw.productName ?? raw['ProductName'] ?? '');
 const productNameAr = String(raw.productNameAr ?? raw['ProductNameAr'] ?? productName);
 const productNameEn = String(raw.productNameEn ?? raw['ProductNameEn'] ?? productName);
 const id = String(raw.id ?? raw['Id'] ?? '');

 return {
 id,
 nameAr: productNameAr,
 nameEn: productNameEn,
 quantity: Number(raw.quantity ?? raw['Quantity'] ?? 0),
 price: Number(raw.unitPrice ?? raw['UnitPrice'] ?? 0),
 total: Number(raw.lineTotal ?? raw['LineTotal'] ?? 0),
 imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : undefined,
 variantDisplaySize: (raw.variantDisplaySize ?? raw['VariantDisplaySize']) ? String(raw.variantDisplaySize ?? raw['VariantDisplaySize']) : undefined,
 packageTypeName: (raw.packageTypeName ?? raw['PackageTypeName']) ? String(raw.packageTypeName ?? raw['PackageTypeName']) : undefined,
 measurementValue: this.toNullableNumber(raw.measurementValue ?? raw['MeasurementValue']),
 measurementUnitName: (raw.measurementUnitName ?? raw['MeasurementUnitName']) ? String(raw.measurementUnitName ?? raw['MeasurementUnitName']) : undefined,
 sku: id ? id.slice(0, 8) : ''
 };
 }

 private toNullableNumber(value: unknown): number | null {
 if (value === null || value === undefined || value === '') {
 return null;
 }

 const parsed = Number(value);
 return Number.isNaN(parsed) ? null : parsed;
 }

 private mapTimelineItem(item: VendorOrderTimelineApiModel): OrderTimelineEntry {
 return this.parseTimelineItem(item);
 }

 private parseTimelineItem(item: VendorOrderTimelineApiModel): OrderTimelineEntry {
 const raw = item as VendorOrderTimelineApiModel & Record<string, unknown>;
 const backendStatus = String(raw.status ?? raw['Status'] ?? '');
 const status = this.mapBackendStatus(backendStatus);
 const label = this.getStatusLabel(status);
 const timestamp = String(raw.timestampUtc ?? raw['TimestampUtc'] ?? '');
 const note = raw.note ?? raw['Note'];

 return {
 status,
 labelAr: label.ar,
 labelEn: label.en,
 timestamp,
 isCompleted: Boolean(raw.isCompleted ?? raw['IsCompleted'] ?? true),
 notes: typeof note === 'string' && note.trim() ? note.trim() : undefined
 };
 }

 private buildFullVendorTimeline(
 currentStatus: OrderStatus,
 rawTimeline: VendorOrderTimelineApiModel[],
 placedAtUtc: string
 ): OrderTimelineEntry[] {
 const parsedHistory = rawTimeline.map((item) => this.parseTimelineItem(item));
 const historyTimestamps = this.buildStatusTimestampMap(parsedHistory, placedAtUtc);
 const historyNotes = this.buildStatusNotesMap(parsedHistory);
 const isTerminal = OrdersService.TERMINAL_STATUSES.includes(currentStatus);
 const currentFlowRank = this.getFlowRank(currentStatus);

 let stepStatuses: OrderStatus[];

 if (currentStatus === 'REFUNDED') {
 stepStatuses = [...OrdersService.VENDOR_TIMELINE_FLOW, 'REFUNDED'];
 } else if (currentStatus === 'CANCELLED' || currentStatus === 'DELIVERY_FAILED') {
 const maxReachedRank = this.resolveMaxReachedFlowRank(parsedHistory, currentStatus);
 stepStatuses = [...OrdersService.VENDOR_TIMELINE_FLOW.filter((status) => this.getFlowRank(status) <= maxReachedRank),
 currentStatus
 ];
 } else {
 stepStatuses = [...OrdersService.VENDOR_TIMELINE_FLOW];
 }

 const completedThroughRank = isTerminal
 ? currentStatus === 'REFUNDED'
 ? this.getFlowRank('DELIVERED')
 : this.resolveMaxReachedFlowRank(parsedHistory, currentStatus)
 : currentFlowRank;

 return stepStatuses.map((status) => {
 const label = this.getStatusLabel(status);
 const flowRank = this.getFlowRank(status);
 const isTerminalStep = OrdersService.TERMINAL_STATUSES.includes(status);
 const isCompleted = isTerminalStep
 ? true
 : flowRank <= completedThroughRank;

 return {
 status,
 labelAr: label.ar,
 labelEn: label.en,
 timestamp: '',
 changedAtUtc: this.resolveChangedAtUtc(status, historyTimestamps, placedAtUtc, isCompleted),
 isCompleted,
 notes: historyNotes.get(status)
 };
 });
 }

 private buildStatusTimestampMap(
 parsedHistory: OrderTimelineEntry[],
 placedAtUtc: string
 ): Map<OrderStatus, string> {
 const sorted = [...parsedHistory].sort(
 (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
 );
 const map = new Map<OrderStatus, string>();

 for (const entry of sorted) {
 if (!entry.timestamp || map.has(entry.status)) {
 continue;
 }

 map.set(entry.status, entry.timestamp);
 }

 if (!map.has('NEW') && placedAtUtc) {
 map.set('NEW', placedAtUtc);
 }

 return map;
 }

 private buildStatusNotesMap(parsedHistory: OrderTimelineEntry[]): Map<OrderStatus, string> {
 const sorted = [...parsedHistory].sort(
 (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
 );
 const map = new Map<OrderStatus, string>();

 for (const entry of sorted) {
 if (!entry.notes) {
 continue;
 }

 map.set(entry.status, entry.notes);
 }

 return map;
 }

 private resolveChangedAtUtc(
 status: OrderStatus,
 historyTimestamps: Map<OrderStatus, string>,
 placedAtUtc: string,
 isCompleted: boolean
 ): string | undefined {
 const recorded = historyTimestamps.get(status);
 if (recorded) {
 return recorded;
 }

 if (status === 'NEW' && isCompleted && placedAtUtc) {
 return placedAtUtc;
 }

 return undefined;
 }

 private getFlowRank(status: OrderStatus): number {
 if (status === 'CANCELLED' || status === 'DELIVERY_FAILED') {
 return 999;
 }

 if (status === 'REFUNDED') {
 return 1000;
 }

 const index = OrdersService.VENDOR_TIMELINE_FLOW.indexOf(status);
 return index >= 0 ? index : -1;
 }

 private resolveMaxReachedFlowRank(
 historyEntries: OrderTimelineEntry[],
 currentStatus: OrderStatus
 ): number {
 const ranks = historyEntries.map((entry) => this.getFlowRank(entry.status)).filter((rank) => rank >= 0);

 if (!OrdersService.TERMINAL_STATUSES.includes(currentStatus)) {
 ranks.push(this.getFlowRank(currentStatus));
 }

 return ranks.length ? Math.max(...ranks) : 0;
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
 switch ((status ?? '').trim().toLowerCase()) {
 case 'pendingpayment':
 case 'pendingbankconfirmation':
 case 'placed':
 case 'pendingvendoracceptance':
 return 'NEW';
 case 'accepted':
 return 'CONFIRMED';
 case 'preparing':
 return 'IN_PROGRESS';
 case 'readyforpickup':
 return 'READY_FOR_PICKUP';
 case 'driverassignmentinprogress':
 return 'DRIVER_ASSIGNMENT_IN_PROGRESS';
 case 'driverassigned':
 return 'DRIVER_ASSIGNED';
 case 'pickedup':
 return 'PICKED_UP';
 case 'ontheway':
 return 'OUT_FOR_DELIVERY';
 case 'delivered':
 return 'DELIVERED';
 case 'refunded':
 return 'REFUNDED';
 case 'deliveryfailed':
 return 'DELIVERY_FAILED';
 case 'cancelled':
 case 'vendorrejected':
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
 case 'DRIVER_ASSIGNMENT_IN_PROGRESS':
 return 'READY_FOR_PICKUP';
 case 'DRIVER_ASSIGNED':
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
 CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
 IN_PROGRESS: { ar: 'تحت التجهيز', en: 'Preparing' },
 READY_FOR_PICKUP: { ar: 'جاهز للاستلام', en: 'Ready for pickup' },
  DRIVER_ASSIGNMENT_IN_PROGRESS: { ar: 'نبحث عن مندوب', en: 'Finding a driver' },
 DRIVER_ASSIGNED: { ar: 'مُعيّن له مندوب', en: 'Driver assigned' },
 PICKED_UP: { ar: 'مستلم من المتجر', en: 'Picked up' },
 OUT_FOR_DELIVERY: { ar: 'في الطريق', en: 'On the way' },
 DELIVERED: { ar: 'مسلّم', en: 'Delivered' },
 COMPLETED: { ar: 'مكتمل', en: 'Completed' },
 CANCELLED: { ar: 'ملغي', en: 'Cancelled' },
 RETURNED: { ar: 'مرتجع', en: 'Returned' },
 DELIVERY_FAILED: { ar: 'فشل التوصيل', en: 'Delivery failed' },
 REFUNDED: { ar: 'مسترجع', en: 'Refunded' }
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
