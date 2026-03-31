export type OrderStatus = 
  | 'NEW' 
  | 'CONFIRMED'
  | 'IN_PROGRESS' 
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'RETURNED';

export type OrderPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'COD_PENDING';

export type OrderFulfillmentStatus =
  | 'QUEUED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'ON_ROUTE'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  nameAr: string;
  nameEn: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl?: string;
  sku: string;
  unitAr?: string;
  unitEn?: string;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  labelAr: string;
  labelEn: string;
  timestamp: string;
  isCompleted: boolean;
  notes?: string;
}

export interface OrderListItem {
  id: string;
  displayId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  paymentMethodLabel: string;
  total: number;
  itemCount: number;
  isLate: boolean;
  hasActiveIssue: boolean;
}

export interface OrderDetail extends OrderListItem {
  customerAddress: string;
  customerLocation?: { lat: number; lng: number };
  items: OrderItem[];
  timeline: OrderTimelineEntry[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  notes?: string;
  driverName?: string;
  driverPhone?: string;
  driverImage?: string;
  driverRating?: number;
  driverVehiclePlate?: string;
  driverVehicleType?: string;
  driverCompanyAr?: string;
  driverCompanyEn?: string;
  estimatedDelivery?: string;
}

export interface PaginatedOrdersResponse {
  items: OrderListItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
