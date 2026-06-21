import { CommonModule, NgClass } from '@angular/common';
import { Component, DoCheck, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { Subscription, combineLatest } from 'rxjs';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
  DetailTabNavItem,
  DetailTabsNavComponent
} from '../../../../shared/components/ui/navigation/detail-tabs-nav/detail-tabs-nav.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';
import { AppFlashBannerComponent } from '../../../../shared/components/ui/feedback/flash-banner/flash-banner.component';
import { AppMetricCardComponent } from '../../../../shared/components/ui/data-display/metric-card/metric-card.component';
import { AppEmptyStateComponent } from '../../../../shared/components/ui/data-display/empty-state/empty-state.component';
import { AppPageSectionShellComponent } from '../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';
import {
  AlertCenterItemVm,
  AlertFiltersVm,
  AlertQuickView,
  AlertSeverity,
  AlertSource,
  AlertState,
  AlertSummaryVm,
  LocalizedAlertText
} from '../../models/alerts-center.models';
import { AlertsCenterService } from '../../services/alerts-center.service';

type AlertDateGroupKey = 'today' | 'yesterday' | 'earlier';

interface AlertDateGroup {
  key: AlertDateGroupKey;
  labelKey: string;
  alerts: AlertCenterItemVm[];
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed' | 'error';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-alerts-center-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    DetailTabsNavComponent,
    AppPaginationComponent,
    AppFlashBannerComponent,
    AppMetricCardComponent,
    AppEmptyStateComponent,
    AppPageSectionShellComponent,
    SearchableSelectComponent
  ],
  templateUrl: './alerts-center.page.html',
  styles: [`
    :host { display: block; }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class AlertsCenterPageComponent implements OnInit, DoCheck, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  get mappedSourceOptions(): SearchableSelectOption[] {
    return [{ value: 'all', labelKey: 'ALERTS_CENTER.FILTERS.ALL_SOURCES' }].concat(
      this.sourceOptions.map((source) => ({ value: source, labelKey: this.sourceLabelKey(source) }))
    );
  }

  get severityFilterOptions(): SearchableSelectOption[] {
    return [
      { value: 'all', labelKey: 'ALERTS_CENTER.FILTERS.ALL_SEVERITY' },
      { value: 'critical', labelKey: 'ALERTS_CENTER.SEVERITY.CRITICAL' },
      { value: 'warning', labelKey: 'ALERTS_CENTER.SEVERITY.WARNING' },
      { value: 'info', labelKey: 'ALERTS_CENTER.SEVERITY.INFO' }
    ];
  }

  get stateFilterOptions(): SearchableSelectOption[] {
    return [
      { value: 'all', labelKey: 'ALERTS_CENTER.FILTERS.ALL_STATES' },
      { value: 'unread', labelKey: 'ALERTS_CENTER.STATE.UNREAD' },
      { value: 'read', labelKey: 'ALERTS_CENTER.STATE.READ' },
      { value: 'archived', labelKey: 'ALERTS_CENTER.STATE.ARCHIVED' }
    ];
  }

  currentLang = 'ar';
  activeQuickView: AlertQuickView = 'all';
  flashMessage = '';
  flashTone: 'success' | 'info' = 'success';
  loadStatus: LoadStatus = 'idle';
  loadError = false;
  realtimeStatus: RealtimeStatus = 'idle';

  alerts: AlertCenterItemVm[] = [];
  summary: AlertSummaryVm = {
    unreadCount: 0,
    criticalCount: 0,
    needsActionCount: 0,
    archivedCount: 0,
    totalCount: 0
  };

  readonly filters: AlertFiltersVm = {
    search: '',
    source: 'all',
    severity: 'all',
    state: 'all'
  };
  readonly pageSize = 10;
  currentPage = 1;

  private langSub: Subscription;
  private dataSub?: Subscription;
  private statusSub?: Subscription;
  private lastFilterSignature = '';

  constructor(
    private readonly alertsCenterService: AlertsCenterService,
    private readonly translate: TranslateService,
    private readonly router: Router
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.statusSub = combineLatest([
      this.alertsCenterService.getInitialLoadStatus(),
      this.alertsCenterService.getRealtimeConnectionState()
    ]).subscribe(([loadStatus, realtimeStatus]) => {
      this.loadStatus = loadStatus;
      this.loadError = loadStatus === 'error';
      this.realtimeStatus = realtimeStatus;
      this.cdr.markForCheck();
    });

    this.dataSub = combineLatest([
      this.alertsCenterService.getAlerts(),
      this.alertsCenterService.getSummary()
    ]).subscribe(([alerts, summary]) => {
      this.alerts = alerts;
      this.summary = summary;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub?.unsubscribe();
    this.statusSub?.unsubscribe();
  }

  ngDoCheck(): void {
    const nextSignature = JSON.stringify(this.filters);
    if (this.lastFilterSignature === nextSignature) {
      return;
    }

    this.lastFilterSignature = nextSignature;
    this.currentPage = 1;
  }

  get isInitialLoading(): boolean {
    return (this.loadStatus === 'loading' || this.loadStatus === 'idle') && this.alerts.length === 0;
  }

  get realtimeStatusLabelKey(): string {
    switch (this.realtimeStatus) {
      case 'connected':
        return 'ALERTS_CENTER.REALTIME.CONNECTED';
      case 'connecting':
      case 'reconnecting':
        return 'ALERTS_CENTER.REALTIME.CONNECTING';
      case 'error':
        return 'ALERTS_CENTER.REALTIME.ERROR';
      default:
        return 'ALERTS_CENTER.REALTIME.OFFLINE';
    }
  }

  get realtimeStatusClass(): string {
    switch (this.realtimeStatus) {
      case 'connected':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'connecting':
      case 'reconnecting':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'error':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }
  }

  get realtimeDotClass(): string {
    switch (this.realtimeStatus) {
      case 'connected':
        return 'bg-emerald-500 animate-pulse';
      case 'connecting':
      case 'reconnecting':
        return 'bg-amber-500 animate-pulse';
      case 'error':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  }

  get quickTabs(): DetailTabNavItem[] {
    return [
      {
        id: 'all',
        labelKey: 'ALERTS_CENTER.QUICK_TABS.ALL',
        count: this.alerts.length
      },
      {
        id: 'unread',
        labelKey: 'ALERTS_CENTER.QUICK_TABS.UNREAD',
        count: this.alerts.filter((alert) => alert.state === 'unread').length,
        attention: this.alerts.some((alert) => alert.state === 'unread')
      },
      {
        id: 'critical',
        labelKey: 'ALERTS_CENTER.QUICK_TABS.CRITICAL',
        count: this.alerts.filter((alert) => alert.severity === 'critical' && alert.state !== 'archived').length
      },
      {
        id: 'archived',
        labelKey: 'ALERTS_CENTER.QUICK_TABS.ARCHIVED',
        count: this.alerts.filter((alert) => alert.state === 'archived').length
      }
    ];
  }

  get filteredAlerts(): AlertCenterItemVm[] {
    return this.alerts
      .filter((alert) => this.matchesQuickView(alert))
      .filter((alert) => this.matchesFilters(alert));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAlerts.length / this.pageSize));
  }

  get currentPageValue(): number {
    return Math.min(this.currentPage, this.totalPages);
  }

  get pagedAlerts(): AlertCenterItemVm[] {
    const startIndex = (this.currentPageValue - 1) * this.pageSize;
    return this.filteredAlerts.slice(startIndex, startIndex + this.pageSize);
  }

  get groupedPagedAlerts(): AlertDateGroup[] {
    const groups = new Map<AlertDateGroupKey, AlertCenterItemVm[]>();

    for (const alert of this.pagedAlerts) {
      const key = this.resolveDateGroupKey(alert.createdAt);
      const bucket = groups.get(key) ?? [];
      bucket.push(alert);
      groups.set(key, bucket);
    }

    return (['today', 'yesterday', 'earlier'] as AlertDateGroupKey[])
      .filter((key) => groups.has(key))
      .map((key) => ({
        key,
        labelKey: `ALERTS_CENTER.DATE_GROUPS.${key.toUpperCase()}`,
        alerts: groups.get(key) ?? []
      }));
  }

  get hasActiveFilters(): boolean {
    return !!this.filters.search.trim()
      || this.filters.source !== 'all'
      || this.filters.severity !== 'all'
      || this.filters.state !== 'all';
  }

  get sourceOptions(): AlertSource[] {
    return ['orders', 'products', 'offers', 'finance', 'support', 'staff', 'profile'];
  }

  setActiveQuickView(view: string): void {
    this.activeQuickView = view as AlertQuickView;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.filters.search = '';
    this.filters.source = 'all';
    this.filters.severity = 'all';
    this.filters.state = 'all';
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  markAllAsRead(): void {
    this.alertsCenterService.markAllAsRead();
    this.showFlash('ALERTS_CENTER.FEEDBACK.ALL_READ', 'success');
  }

  toggleReadState(alert: AlertCenterItemVm): void {
    if (alert.state === 'archived') {
      return;
    }

    if (alert.state === 'unread') {
      this.alertsCenterService.markAsRead(alert.id);
      this.showFlash('ALERTS_CENTER.FEEDBACK.MARKED_READ', 'info');
      return;
    }

    this.alertsCenterService.markAsUnread(alert.id);
    this.showFlash('ALERTS_CENTER.FEEDBACK.MARKED_UNREAD', 'info');
  }

  toggleArchiveState(alert: AlertCenterItemVm): void {
    if (alert.state === 'archived') {
      this.alertsCenterService.unarchive(alert.id);
      this.showFlash('ALERTS_CENTER.FEEDBACK.RESTORED', 'success');
      return;
    }

    this.alertsCenterService.archive(alert.id);
    this.showFlash('ALERTS_CENTER.FEEDBACK.ARCHIVED', 'info');
  }

  openAlert(alert: AlertCenterItemVm): void {
    if (alert.state !== 'archived') {
      this.alertsCenterService.markAsRead(alert.id);
    }

    this.router.navigateByUrl(this.buildRoute(alert));
  }

  alertCardClass(alert: AlertCenterItemVm): string {
    if (alert.state === 'archived') {
      return 'border-slate-200/70 bg-slate-50/50';
    }

    if (alert.state === 'unread') {
      return 'border-zadna-primary/15 bg-gradient-to-br from-white to-teal-50/20';
    }

    return 'border-slate-200/80 bg-white';
  }

  severityIconClass(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 text-rose-600 ring-rose-200/70';
      case 'warning':
        return 'bg-amber-50 text-amber-600 ring-amber-200/70';
      default:
        return 'bg-sky-50 text-sky-600 ring-sky-200/70';
    }
  }

  sourceIcon(source: AlertSource): string {
    switch (source) {
      case 'orders':
        return 'receipt_long';
      case 'products':
        return 'inventory_2';
      case 'offers':
        return 'local_offer';
      case 'finance':
        return 'account_balance_wallet';
      case 'support':
        return 'support_agent';
      case 'staff':
        return 'groups';
      default:
        return 'storefront';
    }
  }

  sourceLabelKey(source: AlertSource): string {
    switch (source) {
      case 'orders':
        return 'ALERTS_CENTER.SOURCES.ORDERS';
      case 'products':
        return 'ALERTS_CENTER.SOURCES.PRODUCTS';
      case 'offers':
        return 'ALERTS_CENTER.SOURCES.OFFERS';
      case 'finance':
        return 'ALERTS_CENTER.SOURCES.FINANCE';
      case 'support':
        return 'ALERTS_CENTER.SOURCES.SUPPORT';
      case 'staff':
        return 'ALERTS_CENTER.SOURCES.STAFF';
      default:
        return 'ALERTS_CENTER.SOURCES.PROFILE';
    }
  }

  severityLabelKey(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return 'ALERTS_CENTER.SEVERITY.CRITICAL';
      case 'warning':
        return 'ALERTS_CENTER.SEVERITY.WARNING';
      default:
        return 'ALERTS_CENTER.SEVERITY.INFO';
    }
  }

  sourceBadgeClass(source: AlertSource): string {
    switch (source) {
      case 'orders':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      case 'products':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'offers':
        return 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700';
      case 'finance':
        return 'border-violet-200 bg-violet-50 text-violet-700';
      case 'support':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'staff':
        return 'border-indigo-200 bg-indigo-50 text-indigo-700';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-700';
    }
  }

  severityBadgeClass(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      default:
        return 'border-sky-200 bg-sky-50 text-sky-700';
    }
  }

  formatDateTime(dateText: string): string {
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', { timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(dateText));
  }

  formatRelativeTime(dateText: string): string {
    const createdAt = new Date(dateText);
    const diffMs = Date.now() - createdAt.getTime();

    if (Number.isNaN(diffMs)) {
      return dateText;
    }

    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) {
      return this.currentLang === 'ar' ? 'الآن' : 'Just now';
    }

    if (diffMs < hour) {
      const minutes = Math.max(1, Math.floor(diffMs / minute));
      return this.currentLang === 'ar'
        ? `منذ ${minutes} د`
        : `${minutes}m ago`;
    }

    if (diffMs < day) {
      const hours = Math.max(1, Math.floor(diffMs / hour));
      return this.currentLang === 'ar'
        ? `منذ ${hours} س`
        : `${hours}h ago`;
    }

    if (diffMs < day * 2) {
      return this.currentLang === 'ar' ? 'أمس' : 'Yesterday';
    }

    const days = Math.max(1, Math.floor(diffMs / day));
    return this.currentLang === 'ar'
      ? `منذ ${days} ي`
      : `${days}d ago`;
  }

  alertText(text: LocalizedAlertText): string {
    return this.currentLang === 'ar' ? text.ar : text.en;
  }

  trackByAlertId(_index: number, alert: AlertCenterItemVm): string {
    return alert.id;
  }

  private resolveDateGroupKey(dateText: string): AlertDateGroupKey {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) {
      return 'earlier';
    }

    const now = new Date();
    const saudiDateKey = (value: Date): string =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Riyadh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(value);
    const todayKey = saudiDateKey(now);
    const alertDateKey = saudiDateKey(date);

    if (alertDateKey === todayKey) {
      return 'today';
    }

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (alertDateKey === saudiDateKey(yesterday)) {
      return 'yesterday';
    }

    return 'earlier';
  }

  private matchesQuickView(alert: AlertCenterItemVm): boolean {
    switch (this.activeQuickView) {
      case 'unread':
        return alert.state === 'unread';
      case 'critical':
        return alert.severity === 'critical' && alert.state !== 'archived';
      case 'archived':
        return alert.state === 'archived';
      default:
        return true;
    }
  }

  private matchesFilters(alert: AlertCenterItemVm): boolean {
    const normalizedSearch = this.filters.search.trim().toLowerCase();

    if (normalizedSearch) {
      const searchable = [
        alert.title.ar,
        alert.title.en,
        alert.summary.ar,
        alert.summary.en
      ];

      if (!searchable.some((part) => part.toLowerCase().includes(normalizedSearch))) {
        return false;
      }
    }

    if (this.filters.source !== 'all' && alert.source !== this.filters.source) {
      return false;
    }

    if (this.filters.severity !== 'all' && alert.severity !== this.filters.severity) {
      return false;
    }

    if (this.filters.state !== 'all' && alert.state !== this.filters.state) {
      return false;
    }

    return true;
  }

  private buildRoute(alert: AlertCenterItemVm): string {
    if (!alert.routeQuery || !Object.keys(alert.routeQuery).length) {
      return alert.route;
    }

    const params = new URLSearchParams(alert.routeQuery);
    return `${alert.route}?${params.toString()}`;
  }

  private showFlash(key: string, tone: 'success' | 'info'): void {
    this.flashMessage = this.translate.instant(key);
    this.flashTone = tone;
    this.cdr.markForCheck();

    setTimeout(() => {
      if (this.flashMessage === this.translate.instant(key)) {
        this.flashMessage = '';
        this.cdr.markForCheck();
      }
    }, 2800);
  }
}
