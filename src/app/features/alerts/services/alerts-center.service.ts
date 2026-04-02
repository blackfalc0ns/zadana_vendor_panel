import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, combineLatest, map, of, shareReplay } from 'rxjs';
import { Category, CatalogService, VendorProduct } from '../../../services/catalog.service';
import { VendorFinanceAlert, VendorFinanceService, VendorFinanceSnapshot } from '../../finance/services/vendor-finance.service';
import { OffersService } from '../../offers/services/offers.service';
import { OrderListItem } from '../../orders/models/orders.models';
import { OrdersService } from '../../orders/services/orders.service';
import { CustomerReviewVm } from '../../reviews/models/reviews.models';
import { ReviewsService } from '../../reviews/services/reviews.service';
import { VendorProfile, VendorProfileService } from '../../settings/services/vendor-profile.service';
import { BranchVm, EmployeeVm, InvitationVm } from '../../staff/models/staff-branches.models';
import { StaffBranchesService } from '../../staff/services/staff-branches.service';
import { VendorSupportTicketVm } from '../../support/models/support-center.models';
import { SupportCenterService } from '../../support/services/support-center.service';
import {
  AlertCenterItemVm,
  AlertSummaryVm,
  AlertState,
  AlertSeverity,
  AlertWorkspaceSnapshotVm,
  AlertWorkspaceState,
  LocalizedAlertText,
  cloneAlerts
} from '../models/alerts-center.models';

@Injectable({
  providedIn: 'root'
})
export class AlertsCenterService {
  private readonly storageKey = 'vendor_alerts_workspace';
  private readonly workspaceSubject = new BehaviorSubject<AlertWorkspaceState>(this.loadWorkspace());
  private readonly generatedAtMap = new Map<string, string>();
  private latestAlertsCache: AlertCenterItemVm[] = [];
  private readonly ordersService = inject(OrdersService);
  private readonly catalogService = inject(CatalogService);
  private readonly offersService = inject(OffersService);
  private readonly vendorFinanceService = inject(VendorFinanceService);
  private readonly supportCenterService = inject(SupportCenterService);
  private readonly staffBranchesService = inject(StaffBranchesService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly profileService = inject(VendorProfileService);

  private readonly orders$ = this.ordersService.getOrders({
    pageNumber: 1,
    pageSize: 250
  }).pipe(
    map((response) => response.items),
    catchError(() => of([] as OrderListItem[])),
    shareReplay(1)
  );

  private readonly vendorProducts$ = this.catalogService.getVendorProducts({
    pageNumber: 1,
    pageSize: 200
  }).pipe(
    map((response) => response.items),
    catchError(() => of([] as VendorProduct[])),
    shareReplay(1)
  );

  private readonly categories$ = this.catalogService.getCategories().pipe(
    catchError(() => of([] as Category[])),
    shareReplay(1)
  );

  private readonly coupons$ = this.offersService.getCouponOffers().pipe(
    catchError(() => of([])),
    shareReplay(1)
  );

  private readonly financeSnapshot$ = this.vendorFinanceService.getSnapshot('month').pipe(
    catchError(() => of(null as VendorFinanceSnapshot | null)),
    shareReplay(1)
  );

  private readonly supportTickets$ = this.supportCenterService.getTickets().pipe(shareReplay(1));
  private readonly branches$ = this.staffBranchesService.getBranches().pipe(shareReplay(1));
  private readonly employees$ = this.staffBranchesService.getEmployees().pipe(shareReplay(1));
  private readonly invitations$ = this.staffBranchesService.getInvitations().pipe(shareReplay(1));
  private readonly reviews$ = this.reviewsService.getReviews().pipe(shareReplay(1));
  private readonly profile$ = this.profileService.getProfile().pipe(shareReplay(1));

  private readonly liveAlerts$ = combineLatest([
    this.orders$,
    this.vendorProducts$,
    this.categories$,
    this.coupons$,
    this.financeSnapshot$,
    this.supportTickets$,
    this.branches$,
    this.employees$,
    this.invitations$,
    this.reviews$,
    this.profile$
  ]).pipe(
    map(([
      orders,
      products,
      categories,
      coupons,
      financeSnapshot,
      tickets,
      branches,
      employees,
      invitations,
      reviews,
      profile
    ]) => this.buildLiveAlerts(
      orders,
      products,
      categories,
      coupons,
      financeSnapshot,
      tickets,
      branches,
      employees,
      invitations,
      reviews,
      profile
    )),
    shareReplay(1)
  );

  private readonly alerts$ = combineLatest([
    this.liveAlerts$,
    this.workspaceSubject
  ]).pipe(
    map(([liveAlerts, workspace]) => this.applyWorkspace(liveAlerts, workspace)),
    shareReplay(1)
  );

  constructor() {
    this.alerts$.subscribe((alerts) => {
      this.latestAlertsCache = alerts;
    });
  }

  getAlerts(): Observable<AlertCenterItemVm[]> {
    return this.alerts$.pipe(map((alerts) => cloneAlerts(alerts)));
  }

  getBellAlerts(): Observable<AlertCenterItemVm[]> {
    return this.alerts$.pipe(
      map((alerts) => alerts.filter((alert) => alert.state !== 'archived').slice(0, 5)),
      map((alerts) => cloneAlerts(alerts))
    );
  }

  getSummary(): Observable<AlertSummaryVm> {
    return this.alerts$.pipe(map((alerts) => this.buildSummary(alerts)));
  }

  getUnreadCount(): Observable<number> {
    return this.alerts$.pipe(
      map((alerts) => alerts.filter((alert) => alert.state === 'unread').length)
    );
  }

  markAsRead(alertId: string): void {
    this.setWorkspace((workspace) => ({
      ...workspace,
      readMap: {
        ...workspace.readMap,
        [alertId]: true
      }
    }));
  }

  markAsUnread(alertId: string): void {
    this.setWorkspace((workspace) => {
      const nextReadMap = { ...workspace.readMap };
      delete nextReadMap[alertId];

      return {
        ...workspace,
        readMap: nextReadMap
      };
    });
  }

  archive(alertId: string): void {
    const currentAlert = this.latestAlertsCache.find((alert) => alert.id === alertId);

    this.setWorkspace((workspace) => ({
      ...workspace,
      archivedMap: {
        ...workspace.archivedMap,
        [alertId]: true
      },
      archivedSnapshots: currentAlert
        ? {
            ...workspace.archivedSnapshots,
            [alertId]: this.toSnapshot(currentAlert)
          }
        : workspace.archivedSnapshots
    }));
  }

  unarchive(alertId: string): void {
    this.setWorkspace((workspace) => {
      const nextArchivedMap = { ...workspace.archivedMap };
      const nextArchivedSnapshots = { ...workspace.archivedSnapshots };
      delete nextArchivedMap[alertId];
      delete nextArchivedSnapshots[alertId];

      return {
        ...workspace,
        archivedMap: nextArchivedMap,
        archivedSnapshots: nextArchivedSnapshots
      };
    });
  }

  markAllAsRead(): void {
    const unreadIds = this.latestAlertsCache
      .filter((alert) => alert.state !== 'archived')
      .map((alert) => alert.id);

    if (!unreadIds.length) {
      return;
    }

    this.setWorkspace((workspace) => {
      const nextReadMap = { ...workspace.readMap };
      unreadIds.forEach((id) => {
        nextReadMap[id] = true;
      });

      return {
        ...workspace,
        readMap: nextReadMap
      };
    });
  }

  resetWorkspaceState(): void {
    localStorage.removeItem(this.storageKey);
    this.workspaceSubject.next(this.createEmptyWorkspace());
  }

  private buildLiveAlerts(
    orders: OrderListItem[],
    products: VendorProduct[],
    categories: Category[],
    coupons: Array<{ id: string; code: string; endsAt: string; isActive: boolean }>,
    financeSnapshot: VendorFinanceSnapshot | null,
    tickets: VendorSupportTicketVm[],
    branches: BranchVm[],
    employees: EmployeeVm[],
    invitations: InvitationVm[],
    reviews: CustomerReviewVm[],
    profile: VendorProfile
  ): AlertCenterItemVm[] {
    const alerts: AlertCenterItemVm[] = [];

    const newOrders = orders.filter((order) => order.status === 'NEW');
    if (newOrders.length) {
      alerts.push(this.createAlert({
        id: 'orders:new',
        source: 'orders',
        severity: 'warning',
        title: this.localized(
          `${newOrders.length} طلبات جديدة بانتظار التأكيد`,
          `${newOrders.length} new orders are waiting for confirmation`
        ),
        summary: this.localized(
          'راجع طابور الطلبات الجديدة وأكدها بسرعة قبل أن تتأثر مهلة التشغيل.',
          'Review the new orders queue and confirm it quickly before the operational SLA slips.'
        ),
        createdAt: this.pickLatestDate(newOrders.map((order) => this.normalizeDate(order.date)), this.referenceDate('orders:new')),
        route: '/orders',
        count: newOrders.length
      }));
    }

    const lateOrders = orders.filter((order) => order.isLate);
    if (lateOrders.length) {
      alerts.push(this.createAlert({
        id: 'orders:late',
        source: 'orders',
        severity: 'critical',
        title: this.localized(
          `${lateOrders.length} طلبات متأخرة تحتاج تدخلاً`,
          `${lateOrders.length} delayed orders need intervention`
        ),
        summary: this.localized(
          'هناك طلبات تجاوزت الوقت المتوقع للتجهيز أو التسليم وتحتاج متابعة فورية.',
          'Some orders exceeded the expected preparation or delivery time and need immediate follow-up.'
        ),
        createdAt: this.pickLatestDate(lateOrders.map((order) => this.normalizeDate(order.date)), this.referenceDate('orders:late')),
        route: '/orders',
        count: lateOrders.length
      }));
    }

    const lowStockProducts = products.filter((product) => product.stockQty > 0 && product.stockQty <= 5);
    lowStockProducts.forEach((product) => {
      const severity: AlertSeverity = product.stockQty <= 3 ? 'critical' : 'warning';
      alerts.push(this.createAlert({
        id: `products:low-stock:${product.id}`,
        source: 'products',
        severity,
        title: this.localized(
          `مخزون منخفض: ${product.nameAr}`,
          `Low stock: ${product.nameEn}`
        ),
        summary: this.localized(
          `الكمية الحالية ${product.stockQty} فقط، ويُفضّل تحديث المخزون أو إيقاف العرض مؤقتًا.`,
          `Only ${product.stockQty} units are left. Consider replenishing stock or pausing availability temporarily.`
        ),
        createdAt: this.referenceDate(`products:low-stock:${product.id}`),
        route: `/products/${product.id}`,
        entityId: product.id,
        count: product.stockQty
      }));
    });

    const inactiveProducts = products.filter((product) => !product.isActive);
    if (inactiveProducts.length) {
      alerts.push(this.createAlert({
        id: 'products:inactive',
        source: 'products',
        severity: 'warning',
        title: this.localized(
          `${inactiveProducts.length} منتجات غير نشطة`,
          `${inactiveProducts.length} products are currently inactive`
        ),
        summary: this.localized(
          'هناك منتجات متوقفة عن العرض الآن وتحتاج مراجعة قبل أن تؤثر على تغطية الكتالوج.',
          'Some products are currently inactive and should be reviewed before they affect catalog coverage.'
        ),
        createdAt: this.referenceDate('products:inactive'),
        route: '/products',
        count: inactiveProducts.length
      }));
    }

    const activeCoupons = coupons.filter((coupon) => coupon.isActive);
    const categoryCampaigns = this.offersService.buildCategoryCampaigns(categories, products);
    const expiringOfferItems = [
      ...activeCoupons.filter((coupon) => this.isWithinDays(coupon.endsAt, 7)),
      ...categoryCampaigns.filter((campaign) => this.isWithinDays(campaign.endsAt, 7))
    ];

    if (expiringOfferItems.length) {
      alerts.push(this.createAlert({
        id: 'offers:expiring',
        source: 'offers',
        severity: 'warning',
        title: this.localized(
          `${expiringOfferItems.length} عروض تنتهي خلال 7 أيام`,
          `${expiringOfferItems.length} offers expire within 7 days`
        ),
        summary: this.localized(
          'راجع الكوبونات والحملات القريبة من الانتهاء حتى لا تنتهي دون تمديد أو استبدال.',
          'Review coupons and campaigns nearing expiration so they do not end without an extension or replacement.'
        ),
        createdAt: this.pickLatestDate(
          expiringOfferItems.map((item) => this.normalizeDate(item.endsAt)),
          this.referenceDate('offers:expiring')
        ),
        route: '/offers',
        count: expiringOfferItems.length
      }));
    }

    const criticalClearanceOffers = this.offersService
      .buildClearanceOffers(products)
      .filter((offer) => offer.urgency === 'critical');

    if (criticalClearanceOffers.length) {
      alerts.push(this.createAlert({
        id: 'offers:clearance-critical',
        source: 'offers',
        severity: 'critical',
        title: this.localized(
          `${criticalClearanceOffers.length} منتجات في آخر القطع`,
          `${criticalClearanceOffers.length} products are in critical clearance`
        ),
        summary: this.localized(
          'هذه المنتجات وصلت إلى مستوى حرج من آخر القطع وتحتاج عرضًا سريعًا أو قرار مخزون واضحًا.',
          'These products reached a critical last-pieces state and need a fast offer or a clear stock decision.'
        ),
        createdAt: this.referenceDate('offers:clearance-critical'),
        route: '/offers',
        count: criticalClearanceOffers.length
      }));
    }

    financeSnapshot?.alerts.forEach((alert) => {
      const financeText = this.resolveFinanceAlertText(alert);
      alerts.push(this.createAlert({
        id: `finance:${alert.id}`,
        source: 'finance',
        severity: alert.severity,
        title: financeText.title,
        summary: financeText.summary,
        createdAt: this.normalizeDate(financeSnapshot.nextPayoutDate, this.referenceDate(`finance:${alert.id}`)),
        route: '/finance'
      }));
    });

    const waitingVendorTickets = tickets.filter((ticket) => ticket.status === 'waiting_vendor');
    if (waitingVendorTickets.length) {
      alerts.push(this.createAlert({
        id: 'support:waiting-vendor',
        source: 'support',
        severity: 'critical',
        title: this.localized(
          `${waitingVendorTickets.length} تذاكر دعم بانتظار ردك`,
          `${waitingVendorTickets.length} support tickets are waiting for your input`
        ),
        summary: this.localized(
          'يوجد دعم يحتاج مستندات أو توضيحات منك قبل استكمال المعالجة.',
          'Support is waiting for documents or clarifications from your team before moving forward.'
        ),
        createdAt: this.pickLatestDate(waitingVendorTickets.map((ticket) => ticket.updatedAt), this.referenceDate('support:waiting-vendor')),
        route: '/support',
        count: waitingVendorTickets.length
      }));
    }

    const highPriorityTickets = tickets.filter((ticket) =>
      ticket.status !== 'resolved'
      && ticket.status !== 'waiting_vendor'
      && (ticket.priority === 'high' || ticket.priority === 'urgent')
    );

    if (highPriorityTickets.length) {
      alerts.push(this.createAlert({
        id: 'support:high-priority',
        source: 'support',
        severity: 'warning',
        title: this.localized(
          `${highPriorityTickets.length} تذاكر عالية الأولوية مفتوحة`,
          `${highPriorityTickets.length} high-priority support tickets remain open`
        ),
        summary: this.localized(
          'تابع الحالات المصعدة أو العاجلة حتى لا تتأخر أكثر عن السياق التشغيلي الحالي.',
          'Review escalated or urgent cases before they drift further from the current operational context.'
        ),
        createdAt: this.pickLatestDate(highPriorityTickets.map((ticket) => ticket.updatedAt), this.referenceDate('support:high-priority')),
        route: '/support',
        count: highPriorityTickets.length
      }));
    }

    const pendingBranches = branches.filter((branch) => branch.status === 'pending');
    if (pendingBranches.length) {
      alerts.push(this.createAlert({
        id: 'staff:pending-branches',
        source: 'staff',
        severity: 'warning',
        title: this.localized(
          `${pendingBranches.length} فروع بانتظار المراجعة`,
          `${pendingBranches.length} branches are pending review`
        ),
        summary: this.localized(
          'هناك فروع لم تُفعّل بعد وما زالت تحتاج مراجعة تشغيلية قبل اعتمادها.',
          'Some branches are not active yet and still need operational review before approval.'
        ),
        createdAt: this.pickLatestDate(pendingBranches.map((branch) => branch.createdAt), this.referenceDate('staff:pending-branches')),
        route: '/staff',
        count: pendingBranches.length
      }));
    }

    const pendingInvitations = invitations.filter((invitation) => invitation.status === 'pending');
    if (pendingInvitations.length) {
      alerts.push(this.createAlert({
        id: 'staff:pending-invitations',
        source: 'staff',
        severity: 'info',
        title: this.localized(
          `${pendingInvitations.length} دعوات موظفين ما زالت معلقة`,
          `${pendingInvitations.length} staff invitations are still pending`
        ),
        summary: this.localized(
          'راجع الدعوات التي لم تُقبل بعد وتأكد من أن الوصول يصل إلى الفريق المناسب.',
          'Review invitations that are still waiting and make sure access reaches the right team members.'
        ),
        createdAt: this.pickLatestDate(pendingInvitations.map((invitation) => invitation.sentAt), this.referenceDate('staff:pending-invitations')),
        route: '/staff',
        count: pendingInvitations.length
      }));
    }

    const suspendedCount = branches.filter((branch) => branch.status === 'suspended').length
      + employees.filter((employee) => employee.status === 'suspended').length;

    if (suspendedCount) {
      alerts.push(this.createAlert({
        id: 'staff:suspended',
        source: 'staff',
        severity: 'warning',
        title: this.localized(
          `${suspendedCount} عناصر معلقة ضمن الفروع والموظفين`,
          `${suspendedCount} staff or branches are suspended`
        ),
        summary: this.localized(
          'يوجد فروع أو موظفون بحالة تعليق ويُفضّل مراجعة السبب قبل أن تتأثر التغطية أو الوصول.',
          'Some branches or employees are suspended and should be reviewed before coverage or access is affected.'
        ),
        createdAt: this.referenceDate('staff:suspended'),
        route: '/staff',
        count: suspendedCount
      }));
    }

    const lowRatingUnreplied = reviews.filter((review) => review.rating <= 2 && review.replyStatus === 'none');
    if (lowRatingUnreplied.length) {
      alerts.push(this.createAlert({
        id: 'reviews:low-rating-unreplied',
        source: 'reviews',
        severity: 'critical',
        title: this.localized(
          `${lowRatingUnreplied.length} تقييمات منخفضة بدون رد`,
          `${lowRatingUnreplied.length} low-rated reviews still have no reply`
        ),
        summary: this.localized(
          'هذه التقييمات تحتاج ردًا سريعًا لأنها تحمل تقييمًا منخفضًا وتؤثر على انطباع العملاء.',
          'These reviews need a fast reply because they carry a low rating and affect customer perception.'
        ),
        createdAt: this.pickLatestDate(lowRatingUnreplied.map((review) => review.createdAt), this.referenceDate('reviews:low-rating-unreplied')),
        route: '/reviews',
        count: lowRatingUnreplied.length
      }));
    }

    const unrepliedReviews = reviews.filter((review) => review.replyStatus === 'none');
    if (unrepliedReviews.length) {
      alerts.push(this.createAlert({
        id: 'reviews:pending-replies',
        source: 'reviews',
        severity: 'warning',
        title: this.localized(
          `${unrepliedReviews.length} تقييمات بانتظار رد رسمي`,
          `${unrepliedReviews.length} reviews are waiting for an official reply`
        ),
        summary: this.localized(
          'راجع التقييمات المفتوحة وأرسل ردًا واضحًا حتى لا تبقى دون متابعة.',
          'Review open reviews and send a clear vendor reply so they do not remain unattended.'
        ),
        createdAt: this.pickLatestDate(unrepliedReviews.map((review) => review.createdAt), this.referenceDate('reviews:pending-replies')),
        route: '/reviews',
        count: unrepliedReviews.length
      }));
    }

    if (profile.reviewStatus === 'pending') {
      alerts.push(this.createAlert({
        id: 'profile:review-pending',
        source: 'profile',
        severity: 'warning',
        title: this.localized(
          'الملف التجاري ما زال قيد المراجعة',
          'The store profile is still under review'
        ),
        summary: this.localized(
          'بيانات الملف التجاري لم تصل بعد إلى حالة الاعتماد الكامل، فراجع القسم القانوني والوثائق.',
          'The commercial profile has not reached a fully approved state yet. Review the legal section and uploaded documents.'
        ),
        createdAt: this.referenceDate('profile:review-pending'),
        route: '/profile'
      }));
    }

    if (!profile.hasLogo) {
      alerts.push(this.createAlert({
        id: 'profile:missing-logo',
        source: 'profile',
        severity: 'info',
        title: this.localized(
          'شعار المتجر غير مرفوع',
          'The store logo is missing'
        ),
        summary: this.localized(
          'أكمل ملف المتجر برفع شعار واضح حتى يظهر المتجر بشكل احترافي داخل اللوحة.',
          'Complete the profile by uploading a clear store logo so the brand looks ready across the panel.'
        ),
        createdAt: this.referenceDate('profile:missing-logo'),
        route: '/profile'
      }));
    }

    if (!profile.hasCRDoc) {
      alerts.push(this.createAlert({
        id: 'profile:missing-cr-doc',
        source: 'profile',
        severity: 'warning',
        title: this.localized(
          'مستند السجل التجاري غير مرفوع',
          'The commercial registration document is missing'
        ),
        summary: this.localized(
          'أضف نسخة من السجل التجاري حتى يكتمل ملف التاجر ويكون جاهزًا للمراجعة.',
          'Upload a copy of the commercial registration so the vendor profile becomes review-ready.'
        ),
        createdAt: this.referenceDate('profile:missing-cr-doc'),
        route: '/profile'
      }));
    }

    const daysUntilExpiry = this.daysUntil(profile.expiryDate);
    if (daysUntilExpiry <= 30) {
      alerts.push(this.createAlert({
        id: 'profile:expiry-soon',
        source: 'profile',
        severity: 'critical',
        title: this.localized(
          'السجل التجاري يقترب من الانتهاء',
          'The commercial registration is close to expiry'
        ),
        summary: this.localized(
          `تاريخ الانتهاء ${profile.expiryDate}، ويُفضّل تحديث البيانات قبل انتهاء الصلاحية خلال ${Math.max(daysUntilExpiry, 0)} يومًا.`,
          `The expiry date is ${profile.expiryDate}. Update the legal data before the record expires within ${Math.max(daysUntilExpiry, 0)} days.`
        ),
        createdAt: this.normalizeDate(profile.expiryDate, this.referenceDate('profile:expiry-soon')),
        route: '/profile'
      }));
    }

    return alerts.sort((first, second) => this.compareAlerts(first, second));
  }

  private applyWorkspace(liveAlerts: AlertCenterItemVm[], workspace: AlertWorkspaceState): AlertCenterItemVm[] {
    const hydratedLiveAlerts = liveAlerts.map((alert) => ({
      ...alert,
      state: this.resolveState(alert.id, workspace)
    }));

    const archivedFallbacks = Object.entries(workspace.archivedSnapshots)
      .filter(([id]) => workspace.archivedMap[id] && !hydratedLiveAlerts.some((alert) => alert.id === id))
      .map(([, snapshot]) => ({
        ...snapshot,
        title: { ...snapshot.title },
        summary: { ...snapshot.summary },
        routeQuery: snapshot.routeQuery ? { ...snapshot.routeQuery } : undefined,
        state: 'archived' as AlertState
      }));

    return [...hydratedLiveAlerts, ...archivedFallbacks]
      .sort((first, second) => this.compareAlerts(first, second));
  }

  private buildSummary(alerts: AlertCenterItemVm[]): AlertSummaryVm {
    return {
      unreadCount: alerts.filter((alert) => alert.state === 'unread').length,
      criticalCount: alerts.filter((alert) => alert.state !== 'archived' && alert.severity === 'critical').length,
      needsActionCount: alerts.filter((alert) => alert.state !== 'archived' && alert.severity !== 'info').length,
      archivedCount: alerts.filter((alert) => alert.state === 'archived').length,
      totalCount: alerts.length
    };
  }

  private createAlert(alert: Omit<AlertCenterItemVm, 'state'>): AlertCenterItemVm {
    return {
      ...alert,
      title: { ...alert.title },
      summary: { ...alert.summary },
      routeQuery: alert.routeQuery ? { ...alert.routeQuery } : undefined,
      createdAt: this.stableAlertTime(alert.id, alert.createdAt),
      state: 'unread'
    };
  }

  private resolveFinanceAlertText(alert: VendorFinanceAlert): {
    title: LocalizedAlertText;
    summary: LocalizedAlertText;
  } {
    switch (alert.id) {
      case 'alt-1':
        return {
          title: this.localized('جزء من الرصيد المالي ما زال معلقًا', 'Part of the balance is still on hold'),
          summary: this.localized(
            'بعض الطلبات ما زالت داخل فترة الإرجاع، لذلك تم تعليق جزء من التسوية مؤقتًا.',
            'Some orders are still within the return window, so a portion of the settlement remains temporarily held.'
          )
        };
      case 'alt-2':
        return {
          title: this.localized('ملف التحويل القادم جاهز تقريبًا', 'The next payout file is almost ready'),
          summary: this.localized(
            'راجع بيان الدورة القادمة قبل صرف التسوية النهائية للحساب.',
            'Review the upcoming payout statement before the final settlement is released.'
          )
        };
      default:
        return {
          title: this.localized('تنبيه مالي جديد', 'New finance alert'),
          summary: this.localized(
            'توجد ملاحظة مالية جديدة تحتاج مراجعة داخل لوحة المالية.',
            'There is a new finance note that needs review inside the finance dashboard.'
          )
        };
    }
  }

  private compareAlerts(first: Pick<AlertCenterItemVm, 'severity' | 'createdAt'>, second: Pick<AlertCenterItemVm, 'severity' | 'createdAt'>): number {
    const severityDelta = this.severityWeight(first.severity) - this.severityWeight(second.severity);
    if (severityDelta !== 0) {
      return severityDelta;
    }

    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  }

  private severityWeight(severity: AlertSeverity): number {
    switch (severity) {
      case 'critical':
        return 0;
      case 'warning':
        return 1;
      default:
        return 2;
    }
  }

  private resolveState(alertId: string, workspace: AlertWorkspaceState): AlertState {
    if (workspace.archivedMap[alertId]) {
      return 'archived';
    }

    if (workspace.readMap[alertId]) {
      return 'read';
    }

    return 'unread';
  }

  private toSnapshot(alert: AlertCenterItemVm): AlertWorkspaceSnapshotVm {
    return {
      id: alert.id,
      source: alert.source,
      severity: alert.severity,
      title: { ...alert.title },
      summary: { ...alert.summary },
      createdAt: alert.createdAt,
      route: alert.route,
      routeQuery: alert.routeQuery ? { ...alert.routeQuery } : undefined,
      count: alert.count,
      entityId: alert.entityId
    };
  }

  private stableAlertTime(alertId: string, fallback: string): string {
    const existing = this.generatedAtMap.get(alertId);
    if (existing) {
      return existing;
    }

    this.generatedAtMap.set(alertId, fallback);
    return fallback;
  }

  private pickLatestDate(values: Array<string | null | undefined>, fallback: string): string {
    const timestamps = values
      .map((value) => value ? new Date(value).getTime() : Number.NaN)
      .filter((value) => !Number.isNaN(value));

    if (!timestamps.length) {
      return fallback;
    }

    return new Date(Math.max(...timestamps)).toISOString();
  }

  private normalizeDate(dateText?: string | null, fallback = this.referenceDate('default')): string {
    if (!dateText) {
      return fallback;
    }

    const parsed = new Date(dateText);
    if (Number.isNaN(parsed.getTime())) {
      return fallback;
    }

    return parsed.toISOString();
  }

  private daysUntil(dateText: string): number {
    const parsed = new Date(dateText);
    if (Number.isNaN(parsed.getTime())) {
      return Number.POSITIVE_INFINITY;
    }

    const diff = parsed.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private isWithinDays(dateText: string, days: number): boolean {
    const remainingDays = this.daysUntil(dateText);
    return remainingDays >= 0 && remainingDays <= days;
  }

  private localized(ar: string, en: string): LocalizedAlertText {
    return { ar, en };
  }

  private referenceDate(key: string): string {
    const fallbackMap: Record<string, string> = {
      'orders:new': '2026-04-02T09:15:00.000Z',
      'orders:late': '2026-04-02T09:10:00.000Z',
      'products:inactive': '2026-04-02T08:50:00.000Z',
      'offers:expiring': '2026-04-02T08:40:00.000Z',
      'offers:clearance-critical': '2026-04-02T08:35:00.000Z',
      'support:waiting-vendor': '2026-04-02T09:00:00.000Z',
      'support:high-priority': '2026-04-02T08:55:00.000Z',
      'staff:pending-branches': '2026-04-02T08:30:00.000Z',
      'staff:pending-invitations': '2026-04-02T08:25:00.000Z',
      'staff:suspended': '2026-04-02T08:20:00.000Z',
      'reviews:low-rating-unreplied': '2026-04-02T08:10:00.000Z',
      'reviews:pending-replies': '2026-04-02T08:05:00.000Z',
      'profile:review-pending': '2026-04-02T07:55:00.000Z',
      'profile:missing-logo': '2026-04-02T07:50:00.000Z',
      'profile:missing-cr-doc': '2026-04-02T07:45:00.000Z',
      'profile:expiry-soon': '2026-04-02T07:40:00.000Z',
      default: '2026-04-02T07:30:00.000Z'
    };

    return fallbackMap[key] || fallbackMap['default'];
  }

  private setWorkspace(projector: (workspace: AlertWorkspaceState) => AlertWorkspaceState): void {
    const nextWorkspace = projector(this.workspaceSubject.value);
    this.persistWorkspace(nextWorkspace);
    this.workspaceSubject.next(nextWorkspace);
  }

  private persistWorkspace(workspace: AlertWorkspaceState): void {
    localStorage.setItem(this.storageKey, JSON.stringify(workspace));
  }

  private loadWorkspace(): AlertWorkspaceState {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AlertWorkspaceState;
        return {
          readMap: parsed.readMap || {},
          archivedMap: parsed.archivedMap || {},
          archivedSnapshots: parsed.archivedSnapshots || {}
        };
      } catch {
        return this.createEmptyWorkspace();
      }
    }

    return this.createEmptyWorkspace();
  }

  private createEmptyWorkspace(): AlertWorkspaceState {
    return {
      readMap: {},
      archivedMap: {},
      archivedSnapshots: {}
    };
  }
}
