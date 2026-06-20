import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { OrdersService } from '../../features/orders/services/orders.service';
import { CatalogService } from '../../features/products/services/catalog.service';
import { OrderListItem } from '../../features/orders/models/orders.models';
import { VendorProduct, MasterProduct } from '../../features/products/models/catalog.models';

export type VendorGlobalSearchSource = 'navigation' | 'orders' | 'products' | 'master_products';

export interface VendorGlobalSearchResult {
  id: string;
  type: VendorGlobalSearchSource;
  title: string;
  subtitle: string;
  route: string;
  badge?: string | null;
  icon: string;
  flatIndex?: number;
}

export interface VendorGlobalSearchGroup {
  source: VendorGlobalSearchSource;
  labelKey: string;
  results: VendorGlobalSearchResult[];
}

interface VendorNavigationSearchEntry {
  id: string;
  route: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  keywords: string[];
}

@Injectable({
  providedIn: 'root'
})
export class VendorGlobalSearchService {
  private readonly maxResultsPerSource = 5;
  private readonly navigationEntries: VendorNavigationSearchEntry[] = [
    {
      id: 'dashboard',
      route: '/dashboard',
      icon: 'space_dashboard',
      titleAr: 'لوحة التحكم',
      titleEn: 'Dashboard',
      subtitleAr: 'نظرة عامة على أداء المتجر والعمليات المفتوحة',
      subtitleEn: 'Overview of store performance and open operations',
      keywords: ['dashboard', 'home', 'overview', 'لوحة', 'الرئيسية', 'لوحة التحكم']
    },
    {
      id: 'orders',
      route: '/orders',
      icon: 'receipt_long',
      titleAr: 'الطلبات',
      titleEn: 'Orders',
      subtitleAr: 'إدارة طلبات العملاء وحالات التجهيز والشحن',
      subtitleEn: 'Manage customer orders, prep, and delivery states',
      keywords: ['orders', 'order', 'طلبات', 'الطلبات', 'طلب', 'اوردر']
    },
    {
      id: 'orders-create',
      route: '/orders/create',
      icon: 'add_shopping_cart',
      titleAr: 'إنشاء طلب يدوي',
      titleEn: 'Create Manual Order',
      subtitleAr: 'إنشاء وتسجيل طلب جديد لعميل يدويًا',
      subtitleEn: 'Create and log a new order manually for a customer',
      keywords: ['create order', 'new order', 'manual order', 'انشاء طلب', 'طلب جديد', 'طلب يدوي']
    },
    {
      id: 'products',
      route: '/products',
      icon: 'inventory_2',
      titleAr: 'المنتجات',
      titleEn: 'Products',
      subtitleAr: 'إدارة المنتجات المخزنة والأسعار وحالة توفرها',
      subtitleEn: 'Manage in-store products, prices, and stock status',
      keywords: ['products', 'catalog', 'my store', 'المنتجات', 'منتجاتي', 'المخزن', 'أسعار']
    },
    {
      id: 'products-submit',
      route: '/products/submit',
      icon: 'add_circle',
      titleAr: 'تقديم منتج جديد',
      titleEn: 'Submit New Product',
      subtitleAr: 'تقديم طلب إضافة منتج جديد لبنك المنتجات',
      subtitleEn: 'Submit request to add a new product to the master catalog',
      keywords: ['submit product', 'request product', 'تقديم منتج', 'اضافة منتج', 'طلب اضافة منتج']
    },
    {
      id: 'products-requests',
      route: '/products/requests',
      icon: 'assignment',
      titleAr: 'طلبات المنتجات',
      titleEn: 'Product Requests',
      subtitleAr: 'متابعة وحالات طلبات المنتجات المقدمة للإدارة',
      subtitleEn: 'Track status of product submission requests sent to admins',
      keywords: ['requests', 'submission status', 'طلبات المنتجات', 'حالة الطلبات']
    },
    {
      id: 'offers',
      route: '/offers',
      icon: 'local_offer',
      titleAr: 'العروض والخصومات',
      titleEn: 'Offers & Discounts',
      subtitleAr: 'إدارة العروض الترويجية وخصومات المنتجات',
      subtitleEn: 'Manage marketing campaigns and product discounts',
      keywords: ['offers', 'discounts', 'promotions', 'عروض', 'خصومات', 'تخفيضات']
    },
    {
      id: 'alerts',
      route: '/alerts',
      icon: 'notifications',
      titleAr: 'مركز التنبيهات',
      titleEn: 'Alerts Center',
      subtitleAr: 'استعراض التنبيهات والتحديثات والطلبات المتأخرة',
      subtitleEn: 'Browse alerts, system updates, and late order warnings',
      keywords: ['alerts', 'notifications', 'warn', 'تنبيهات', 'اشعارات', 'إشعارات']
    },
    {
      id: 'disputes',
      route: '/disputes',
      icon: 'gavel',
      titleAr: 'النزاعات والشكاوى',
      titleEn: 'Disputes & Issues',
      subtitleAr: 'متابعة وحل الشكاوى والنزاعات المفتوحة مع العملاء',
      subtitleEn: 'Track and resolve open disputes or customer tickets',
      keywords: ['disputes', 'issues', 'claims', 'نزاعات', 'شكاوى', 'مشاكل']
    },
    {
      id: 'finance',
      route: '/finance',
      icon: 'payments',
      titleAr: 'المالية والتقارير',
      titleEn: 'Finances & Reports',
      subtitleAr: 'متابعة المستحقات والأرباح وحالة الحساب المالي',
      subtitleEn: 'Monitor payouts, revenues, and store wallet statements',
      keywords: ['finance', 'payout', 'wallet', 'المالية', 'ارباح', 'أرباح', 'محفظة', 'تقارير']
    },
    {
      id: 'staff',
      route: '/staff',
      icon: 'badge',
      titleAr: 'الموظفون والفروع',
      titleEn: 'Staff & Branches',
      subtitleAr: 'إدارة الفروع والموظفين والصلاحيات الممنوحة لهم',
      subtitleEn: 'Manage store branches, employees, and permissions',
      keywords: ['staff', 'employees', 'branches', 'roles', 'فروع', 'موظفين', 'صلاحيات']
    },
    {
      id: 'support',
      route: '/support',
      icon: 'contact_support',
      titleAr: 'الدعم الفني',
      titleEn: 'Support Center',
      subtitleAr: 'فتح تذاكر دعم فني جديدة والتواصل مع الإدارة',
      subtitleEn: 'Open support tickets and chat with platform admins',
      keywords: ['support', 'help', 'ticket', 'دعم فني', 'مساعدة', 'تذاكر']
    },
    {
      id: 'profile',
      route: '/profile',
      icon: 'account_circle',
      titleAr: 'الملف الشخصي للمتجر',
      titleEn: 'Store Profile',
      subtitleAr: 'تحديث بيانات المتجر والمواعيد وإعدادات الحساب',
      subtitleEn: 'Update store details, timing, and profile settings',
      keywords: ['profile', 'settings', 'account', 'ملف', 'حسابي', 'اعدادات', 'إعدادات']
    }
  ];

  constructor(
    private readonly ordersService: OrdersService,
    private readonly catalogService: CatalogService
  ) {}

  search(query: string, locale: 'ar' | 'en' = 'ar'): Observable<VendorGlobalSearchGroup[]> {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      return of([]);
    }

    const navigationResults = this.searchNavigation(normalizedQuery, locale);

    return forkJoin({
      orders: this.ordersService.getOrders({
        pageNumber: 1,
        pageSize: this.maxResultsPerSource,
        searchTerm: normalizedQuery,
        status: 'ALL',
        paymentMethod: 'ALL',
        lateState: 'ALL'
      }).pipe(
        map((response) => response.items || []),
        catchError(() => of([] as OrderListItem[]))
      ),
      products: this.catalogService.getVendorProducts({
        pageNumber: 1,
        pageSize: this.maxResultsPerSource,
        searchTerm: normalizedQuery
      }).pipe(
        map((response) => response.items || []),
        catchError(() => of([] as VendorProduct[]))
      ),
      masterProducts: this.catalogService.getMasterProducts({
        pageNumber: 1,
        pageSize: this.maxResultsPerSource,
        searchTerm: normalizedQuery
      }).pipe(
        map((response) => response.items || []),
        catchError(() => of([] as MasterProduct[]))
      )
    }).pipe(
      map((result) => this.buildGroups(result, navigationResults, locale))
    );
  }

  private buildGroups(
    payload: {
      orders: OrderListItem[];
      products: VendorProduct[];
      masterProducts: MasterProduct[];
    },
    navigationResults: VendorGlobalSearchResult[],
    locale: 'ar' | 'en'
  ): VendorGlobalSearchGroup[] {
    const groups: VendorGlobalSearchGroup[] = [
      {
        source: 'navigation',
        labelKey: 'HEADER_SEARCH.GROUPS.NAVIGATION',
        results: navigationResults
      },
      {
        source: 'orders',
        labelKey: 'HEADER_SEARCH.GROUPS.ORDERS',
        results: payload.orders.map((item) => ({
          id: item.id,
          type: 'orders',
          title: item.displayId || item.id,
          subtitle: this.joinParts([item.customerName, item.customerPhone]),
          route: `/orders/${item.id}`,
          badge: item.status,
          icon: 'receipt_long'
        }))
      },
      {
        source: 'products',
        labelKey: 'HEADER_SEARCH.GROUPS.PRODUCTS',
        results: payload.products.map((item) => ({
          id: item.id,
          type: 'products',
          title: this.pickLocalized(item.nameAr, item.nameEn, locale),
          subtitle: this.joinParts([
            this.pickLocalized(item.brandNameAr, item.brandNameEn, locale),
            this.pickLocalized(item.categoryNameAr, item.categoryNameEn, locale),
            this.pickLocalized(item.displaySizeAr, item.displaySizeEn, locale)
          ]),
          route: `/products/${item.id}`,
          badge: item.sellingPrice ? `${item.sellingPrice} SAR` : null,
          icon: 'inventory_2'
        }))
      },
      {
        source: 'master_products',
        labelKey: 'HEADER_SEARCH.GROUPS.MASTER_PRODUCTS',
        results: payload.masterProducts.map((item) => ({
          id: item.id,
          type: 'master_products',
          title: this.pickLocalized(item.nameAr, item.nameEn, locale),
          subtitle: this.joinParts([
            this.pickLocalized(item.brandNameAr, item.brandNameEn, locale),
            this.pickLocalized(item.categoryNameAr, item.categoryNameEn, locale),
            this.pickLocalized(item.displaySizeAr, item.displaySizeEn, locale)
          ]),
          route: `/products?openSelector=true&search=${encodeURIComponent(this.pickLocalized(item.nameAr, item.nameEn, locale))}`,
          badge: locale === 'ar' ? 'كتالوج' : 'Catalog',
          icon: 'add_shopping_cart'
        }))
      }
    ];

    return groups.filter((group) => group.results.length > 0);
  }

  private searchNavigation(query: string, locale: 'ar' | 'en'): VendorGlobalSearchResult[] {
    const normalizedQuery = this.normalizeText(query);

    return this.navigationEntries
      .map((entry) => {
        const searchableText = [
          entry.titleAr,
          entry.titleEn,
          entry.subtitleAr,
          entry.subtitleEn,
          ...entry.keywords
        ]
          .map((value) => this.normalizeText(value))
          .join(' ');

        return {
          entry,
          score: this.computeNavigationScore(entry, searchableText, normalizedQuery, locale)
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxResultsPerSource)
      .map(({ entry }) => ({
        id: entry.id,
        type: 'navigation',
        title: locale === 'ar' ? entry.titleAr : entry.titleEn,
        subtitle: locale === 'ar' ? entry.subtitleAr : entry.subtitleEn,
        route: entry.route,
        icon: entry.icon
      }));
  }

  private computeNavigationScore(
    entry: VendorNavigationSearchEntry,
    searchableText: string,
    normalizedQuery: string,
    locale: 'ar' | 'en'
  ): number {
    const title = this.normalizeText(locale === 'ar' ? entry.titleAr : entry.titleEn);
    const altTitle = this.normalizeText(locale === 'ar' ? entry.titleEn : entry.titleAr);

    if (title === normalizedQuery) return 200;
    if (title.startsWith(normalizedQuery)) return 150;
    if (entry.keywords.some((keyword) => this.normalizeText(keyword) === normalizedQuery)) return 130;
    if (searchableText.includes(normalizedQuery) && title.includes(normalizedQuery)) return 110;
    if (altTitle.includes(normalizedQuery)) return 90;
    if (searchableText.includes(normalizedQuery)) return 70;

    return 0;
  }

  private pickLocalized(ar?: string | null, en?: string | null, locale: 'ar' | 'en' = 'ar'): string {
    const primary = locale === 'ar' ? ar : en;
    const fallback = locale === 'ar' ? en : ar;
    return (primary || fallback || '').trim();
  }

  private joinParts(parts: Array<string | null | undefined>): string {
    return parts
      .map((part) => (part ?? '').trim())
      .filter((part) => part.length > 0 && part !== '-')
      .join(' • ');
  }

  private normalizeText(value: string): string {
    return value
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
