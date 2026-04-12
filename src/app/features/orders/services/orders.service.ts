import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { 
  OrderListItem, 
  OrderDetail, 
  OrderStatus, 
  PaginatedOrdersResponse,
  OrderItem,
  OrderTimelineEntry,
  OrderPaymentMethod
} from '../models/orders.models';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = 'api/vendors/orders'; // Placeholder for actual API

  // Mock data store for this session
  private mockOrders: OrderDetail[] = [];

  constructor(private http: HttpClient) {
    this.generateMockOrders();
  }

  getOrders(params: { 
    pageNumber: number; 
    pageSize: number; 
    status?: OrderStatus | 'ALL'; 
    searchTerm?: string;
    paymentMethod?: OrderPaymentMethod | 'ALL';
    lateState?: 'ALL' | 'LATE' | 'ONTIME';
  }): Observable<PaginatedOrdersResponse> {
    
    let filtered = [...this.mockOrders];

    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter(o => o.status === params.status);
    }

    if (params.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.displayId.toLowerCase().includes(term) || 
        o.customerName.toLowerCase().includes(term)
      );
    }

    if (params.paymentMethod && params.paymentMethod !== 'ALL') {
      filtered = filtered.filter((order) => order.paymentMethodType === params.paymentMethod);
    }

    if (params.lateState === 'LATE') {
      filtered = filtered.filter((order) => order.isLate);
    }

    if (params.lateState === 'ONTIME') {
      filtered = filtered.filter((order) => !order.isLate);
    }

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / params.pageSize);
    const startIndex = (params.pageNumber - 1) * params.pageSize;
    const items = filtered.slice(startIndex, startIndex + params.pageSize);

    return of({
      items,
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
      totalPages
    }).pipe(delay(600));
  }

  getOrderById(id: string): Observable<OrderDetail | null> {
    const order = this.mockOrders.find(o => o.id === id || o.displayId === id);
    return of(order || null).pipe(delay(400));
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<OrderDetail> {
    const order = this.mockOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    order.status = status;
    
    // Assign driver if moving to READY_FOR_PICKUP or later and not yet assigned
    const driverStatuses: OrderStatus[] = ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    if (driverStatuses.includes(status) && !order.driverName) {
      order.driverName = 'محمد حسن';
      order.driverPhone = '01223344556';
      order.driverRating = 4.8;
      order.driverVehiclePlate = 'ر ق ص ٤٥٦';
      order.driverVehicleType = 'موتوسيكل هوندا - أسود';
      order.driverCompanyAr = 'زادنا إكسبريس';
      order.driverCompanyEn = 'Zadana Express';
      order.estimatedDelivery = '30-45 mins';
    }

    // Add timeline entry
    const newEntry: OrderTimelineEntry = {
      status,
      timestamp: new Date().toISOString(),
      labelAr: this.getStatusLabel(status, 'ar'),
      labelEn: this.getStatusLabel(status, 'en'),
      isCompleted: true
    };
    
    order.timeline.push(newEntry);
    
    return of(order).pipe(delay(800));
  }

  private getStatusLabel(status: OrderStatus, lang: 'ar' | 'en'): string {
    const labels: Record<OrderStatus, { ar: string, en: string }> = {
      'NEW': { ar: 'طلب جديد', en: 'New Order' },
      'CONFIRMED': { ar: 'تم التأكيد', en: 'Confirmed' },
      'IN_PROGRESS': { ar: 'قيد التجهيز', en: 'Preparing' },
      'READY_FOR_PICKUP': { ar: 'جاهز للاستلام', en: 'Ready for Pickup' },
      'PICKED_UP': { ar: 'تم استلامه من المندوب', en: 'Picked up by Driver' },
      'OUT_FOR_DELIVERY': { ar: 'جاري التوصيل', en: 'On the way' },
      'DELIVERED': { ar: 'تم التوصيل', en: 'Delivered' },
      'COMPLETED': { ar: 'مكتمل', en: 'Completed' },
      'CANCELLED': { ar: 'ملغي', en: 'Cancelled' },
      'RETURNED': { ar: 'مرتجع', en: 'Returned' }
    };
    return labels[status][lang];
  }

  createOrder(orderData: any): Observable<any> {
    const newOrder: OrderDetail = {
      id: `man_${Date.now()}`,
      displayId: (2000 + this.mockOrders.length).toString(),
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'NEW',
      paymentStatus: 'PENDING',
      paymentMethodType: orderData.paymentMethodType,
      paymentMethodLabel: orderData.paymentMethodLabel,
      fulfillmentStatus: 'QUEUED',
      total: orderData.total,
      subtotal: orderData.total * 0.8, // Mock calculation
      deliveryFee: 35,
      tax: orderData.total * 0.14,
      itemCount: orderData.items.length,
      isLate: false,
      hasActiveIssue: false,
      items: orderData.items,
      timeline: [
        {
          status: 'NEW',
          timestamp: new Date().toISOString(),
          labelAr: 'تم إنشاء الطلب يدوياً',
          labelEn: 'Order Created Manually',
          isCompleted: true
        }
      ]
    };

    this.mockOrders.unshift(newOrder);
    return of(newOrder).pipe(delay(1000));
  }

  private generateMockOrders(): void {
    const statuses: OrderStatus[] = ['NEW', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED'];
    const customers = [
      { name: 'أحمد علي', phone: '01012345678', address: '١٥ شارع المعز، القاهرة' },
      { name: 'سارة محمد', phone: '01122334455', address: 'ميدان التحرير، الدقي' },
      { name: 'ياسين محمود', phone: '01233445566', address: 'المعادي، شارع ٩' },
      { name: 'ليلى إبراهيم', phone: '01555667788', address: 'التجمع الخامس، القاهرة الجديدة' },
      { name: 'كريم حسن', phone: '01009988776', address: 'الشيخ زايد، الجيزة' }
    ];

    for (let i = 1; i <= 50; i++) {
        const customer = customers[i % customers.length];
        const status = statuses[i % statuses.length];
        const subtotal = Math.floor(Math.random() * 1000) + 100;
        const deliveryFee = 35;
        const tax = subtotal * 0.14;
        const total = subtotal + deliveryFee + tax;

        const order: OrderDetail = {
          id: `ord_${i}`,
          displayId: (1000 + i).toString(),
          customerName: customer.name,
          customerPhone: customer.phone,
          customerAddress: customer.address,
          date: '2024-03-31',
          time: '14:30',
          status,
          paymentStatus: 'PAID',
          paymentMethodType: i % 2 === 0 ? 'CARD' : 'COD',
          fulfillmentStatus: 'QUEUED',
          paymentMethodLabel: i % 2 === 0 ? 'بطاقة بنكية' : 'نقداً عند الاستلام',
          total,
          subtotal,
          deliveryFee,
          tax,
          itemCount: 2,
          isLate: i % 7 === 0,
          hasActiveIssue: false,
          items: [
            { 
                id: 'p1', 
                nameAr: 'منتج تجريبي ١', 
                nameEn: 'Demo Product 1', 
                quantity: 1, 
                price: subtotal / 2, 
                total: subtotal / 2,
                sku: 'SKU-001'
            },
            { 
                id: 'p2', 
                nameAr: 'منتج تجريبي ٢', 
                nameEn: 'Demo Product 2', 
                quantity: 1, 
                price: subtotal / 2, 
                total: subtotal / 2,
                sku: 'SKU-002'
            }
          ],
          timeline: [
            {
              status: 'NEW',
              timestamp: '2024-03-31T14:30:00Z',
              labelAr: 'تم استلام الطلب',
              labelEn: 'Order Received',
              isCompleted: true
            }
          ]
        };

        // Populate more timeline if needed
        if (status !== 'NEW') {
            order.timeline.push({
                status: 'CONFIRMED',
                timestamp: '2024-03-31T14:45:00Z',
                labelAr: 'تم تأكيد الطلب',
                labelEn: 'Order Confirmed',
                isCompleted: true
            });
        }
        
        if (status === 'IN_PROGRESS' || status === 'READY_FOR_PICKUP' || status === 'DELIVERED') {
            order.timeline.push({
                status: 'IN_PROGRESS',
                timestamp: '2024-03-31T15:00:00Z',
                labelAr: 'جاري التجهيز',
                labelEn: 'Preparing',
                isCompleted: true
            });
        }

        if (['READY_FOR_PICKUP', 'DELIVERED'].includes(status)) {
           order.driverName = 'محمد حسن';
           order.driverPhone = '01223344556';
           order.driverRating = 4.8;
           order.driverVehiclePlate = 'ر ق ص ٤٥٦';
           order.driverVehicleType = 'موتوسيكل هوندا - أسود';
           order.driverCompanyAr = 'زادنا إكسبريس';
           order.driverCompanyEn = 'Zadana Express';
           order.estimatedDelivery = '30-45 mins';
        }

        this.mockOrders.push(order);
    }
  }
}
