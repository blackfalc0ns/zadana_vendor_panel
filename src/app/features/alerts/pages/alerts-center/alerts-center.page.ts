import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, combineLatest } from 'rxjs';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
  DetailTabNavItem,
  DetailTabsNavComponent
} from '../../../../shared/components/ui/navigation/detail-tabs-nav/detail-tabs-nav.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';
import { AppFlashBannerComponent } from '../../../../shared/components/ui/feedback/flash-banner/flash-banner.component';
import { AppMetricCardComponent } from '../../../../shared/components/ui/data-display/metric-card/metric-card.component';
import { AppEmptyStateComponent } from '../../../../shared/components/ui/data-display/empty-state/empty-state.component';
import { AppFilterPanelComponent } from '../../../../shared/components/ui/layout/filter-panel/filter-panel.component';
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

@Component({
  selector: 'app-alerts-center-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    AppPanelHeaderComponent,
    DetailTabsNavComponent,
    AppPaginationComponent,
    AppFlashBannerComponent,
    AppMetricCardComponent,
    AppEmptyStateComponent,
    AppFilterPanelComponent,
    AppPageSectionShellComponent
  ],
  templateUrl: './alerts-center.page.html'
})
export class AlertsCenterPageComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  isFiltersExpanded = true;
  activeQuickView: AlertQuickView = 'all';
  flashMessage = '';
  flashTone: 'success' | 'info' = 'success';

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

  constructor(
    private readonly alertsCenterService: AlertsCenterService,
    private readonly translate: TranslateService,
    private readonly router: Router
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });
  }

  ngOnInit(): void {
    this.dataSub = combineLatest([
      this.alertsCenterService.getAlerts(),
      this.alertsCenterService.getSummary()
    ]).subscribe(([alerts, summary]) => {
      this.alerts = alerts;
      this.summary = summary;
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub?.unsubscribe();
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

  get hasActiveFilters(): boolean {
    return !!this.filters.search.trim()
      || this.filters.source !== 'all'
      || this.filters.severity !== 'all'
      || this.filters.state !== 'all';
  }

  get sourceOptions(): AlertSource[] {
    return ['orders', 'products', 'offers', 'finance', 'support', 'staff', 'reviews', 'profile'];
  }

  setActiveQuickView(view: string): void {
    this.activeQuickView = view as AlertQuickView;
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.filters.search = '';
    this.filters.source = 'all';
    this.filters.severity = 'all';
    this.filters.state = 'all';
    this.currentPage = 1;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
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
      case 'reviews':
        return 'ALERTS_CENTER.SOURCES.REVIEWS';
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

  stateLabelKey(state: AlertState): string {
    switch (state) {
      case 'archived':
        return 'ALERTS_CENTER.STATE.ARCHIVED';
      case 'read':
        return 'ALERTS_CENTER.STATE.READ';
      default:
        return 'ALERTS_CENTER.STATE.UNREAD';
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
      case 'reviews':
        return 'border-rose-200 bg-rose-50 text-rose-700';
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

  stateBadgeClass(state: AlertState): string {
    switch (state) {
      case 'archived':
        return 'border-slate-300 bg-slate-100 text-slate-600';
      case 'read':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      default:
        return 'border-zadna-primary/20 bg-zadna-primary/10 text-zadna-primary';
    }
  }

  formatDateTime(dateText: string): string {
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(dateText));
  }

  alertText(text: LocalizedAlertText): string {
    return this.currentLang === 'ar' ? text.ar : text.en;
  }

  trackByAlertId(_index: number, alert: AlertCenterItemVm): string {
    return alert.id;
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

    setTimeout(() => {
      if (this.flashMessage === this.translate.instant(key)) {
        this.flashMessage = '';
      }
    }, 2800);
  }
}
