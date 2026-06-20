import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, debounceTime, distinctUntilChanged, of, Subject, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertCenterItemVm, LocalizedAlertText } from '../../../../features/alerts/models/alerts-center.models';
import { AlertsCenterService } from '../../../../features/alerts/services/alerts-center.service';
import { VendorGlobalSearchGroup, VendorGlobalSearchResult, VendorGlobalSearchService } from '../../../services/vendor-global-search.service';
import { VendorAuthService } from '../../../auth/services/vendor-auth.service';
import { VendorAccessScope, VendorCurrentUser } from '../../../auth/models/vendor-auth.models';
import { VendorProfileService } from '../../../../features/settings/services/vendor-profile.service';
import { VendorProfile } from '../../../../features/settings/models/vendor-profile.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vendor-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  @Input() currentLang: string = 'ar';
  @Input() storeLogoUrl: string | null = null;
  @Input() userName: string = 'User';
  @Input() userRole: string = 'Vendor';
  @Input() initials: string = 'U';

  currentWorkspaceName = '';
  currentWorkspaceTypeKey = 'STAFF_BRANCHES.BRANCH_TYPES.PRIMARY';
  accountBadgeLabelKey = 'HEADER.ACTIVE_ACCOUNT';
  accountBadgeClasses = 'bg-teal-50 text-teal-600 ring-teal-500/10';

  @Output() languageSwitch = new EventEmitter<void>();
  @Output() logoutAction = new EventEmitter<void>();

  @ViewChild('alertsContainer') alertsContainer?: ElementRef<HTMLElement>;
  @ViewChild('searchContainer') searchContainer?: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  alertsPanelOpen = false;
  unreadCount$?: Observable<number>;
  bellAlerts$?: Observable<AlertCenterItemVm[]>;

  searchQuery = '';
  isSearchOpen = false;
  isSearchLoading = false;
  activeResultIndex = -1;
  searchGroups: VendorGlobalSearchGroup[] = [];
  flatResults: VendorGlobalSearchResult[] = [];
  readonly minSearchLength = 2;
  private readonly searchInput$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly alertsCenterService: AlertsCenterService,
    private readonly vendorGlobalSearchService: VendorGlobalSearchService,
    private readonly vendorAuthService: VendorAuthService,
    private readonly profileService: VendorProfileService,
    private readonly translate: TranslateService,
    private readonly router: Router
  ) {
  }

  ngOnInit(): void {
    this.syncWorkspaceContext(this.vendorAuthService.currentUserSnapshot);
    this.syncAccountBadge(this.profileService.getProfileSnapshot());

    this.vendorAuthService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.syncWorkspaceContext(user);
        this.cdr.markForCheck();
      });

    this.profileService.getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((profile) => {
        this.syncAccountBadge(profile);
        this.cdr.markForCheck();
      });

    this.unreadCount$ = this.alertsCenterService.getUnreadCount();
    this.bellAlerts$ = this.alertsCenterService.getBellAlerts();

    this.searchInput$
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        tap((query) => {
          if (query.length < this.minSearchLength) {
            this.isSearchLoading = false;
            this.searchGroups = [];
            this.flatResults = [];
            this.activeResultIndex = -1;
            this.isSearchOpen = query.length > 0;
          } else {
            this.isSearchLoading = true;
            this.isSearchOpen = true;
          }
        }),
        switchMap((query) => {
          if (query.length < this.minSearchLength) {
            return of([] as VendorGlobalSearchGroup[]);
          }

          return this.vendorGlobalSearchService.search(query, this.currentLang === 'en' ? 'en' : 'ar');
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((groups) => {
      this.cdr.markForCheck();
        this.isSearchLoading = false;
        this.searchGroups = groups;
        this.rebuildFlatResults(groups);
      });
  }

  onLanguageSwitch(): void {
    this.languageSwitch.emit();
  }

  onLogout(): void {
    this.logoutAction.emit();
  }

  private syncWorkspaceContext(user: VendorCurrentUser | null): void {
    const scope = user?.access?.activeScope;
    const scopeName = scope?.scopeEntityName?.trim();

    if (scopeName) {
      localStorage.setItem('vendor_workspace_name', scopeName);
    }

    this.currentWorkspaceName = scopeName
      || localStorage.getItem('vendor_workspace_name')?.trim()
      || this.translate.instant('DASHBOARD.CONTEXT.UNKNOWN_BRANCH');

    this.currentWorkspaceTypeKey = scope?.scopeClassification === 'branch'
      ? 'STAFF_BRANCHES.BRANCH_TYPES.BRANCH'
      : 'STAFF_BRANCHES.BRANCH_TYPES.PRIMARY';
  }

  private syncAccountBadge(profile: VendorProfile): void {
    if (profile.commercialAccessEnabled) {
      this.accountBadgeLabelKey = 'HEADER.ACTIVE_ACCOUNT';
      this.accountBadgeClasses = 'bg-teal-50 text-teal-600 ring-teal-500/10';
      return;
    }

    switch ((profile.reviewState || '').toLowerCase()) {
      case 'underreview':
      case 'submitted':
        this.accountBadgeLabelKey = 'HEADER.UNDER_REVIEW';
        this.accountBadgeClasses = 'bg-sky-50 text-sky-700 ring-sky-500/10';
        return;
      case 'changesrequested':
      case 'changes_requested':
        this.accountBadgeLabelKey = 'HEADER.CHANGES_REQUESTED';
        this.accountBadgeClasses = 'bg-amber-50 text-amber-700 ring-amber-500/10';
        return;
      case 'rejected':
      case 'suspended':
        this.accountBadgeLabelKey = 'HEADER.ACCOUNT_SUSPENDED';
        this.accountBadgeClasses = 'bg-rose-50 text-rose-700 ring-rose-500/10';
        return;
      default:
        this.accountBadgeLabelKey = 'HEADER.PENDING_ACTIVATION';
        this.accountBadgeClasses = 'bg-amber-50 text-amber-700 ring-amber-500/10';
    }
  }

  get currentUser(): VendorCurrentUser | null {
    return this.vendorAuthService.currentUserSnapshot;
  }

  get activeScope(): VendorAccessScope | null {
    return this.currentUser?.access?.activeScope ?? null;
  }

  onAlertsButtonClick(): void {
    if (this.isMobileViewport()) {
      this.router.navigateByUrl('/alerts');
      return;
    }

    this.alertsPanelOpen = !this.alertsPanelOpen;
  }

  openAlertsCenter(): void {
    this.alertsPanelOpen = false;
    this.router.navigateByUrl('/alerts');
  }

  openAlert(alert: AlertCenterItemVm): void {
    if (alert.state !== 'archived') {
      this.alertsCenterService.markAsRead(alert.id);
    }

    this.alertsPanelOpen = false;
    this.router.navigateByUrl(this.buildRoute(alert));
  }

  markAlertReadState(alert: AlertCenterItemVm, event: MouseEvent): void {
    event.stopPropagation();

    if (alert.state === 'archived') {
      return;
    }

    if (alert.state === 'unread') {
      this.alertsCenterService.markAsRead(alert.id);
      return;
    }

    this.alertsCenterService.markAsUnread(alert.id);
  }

  markAllAsRead(event: MouseEvent): void {
    event.stopPropagation();
    this.alertsCenterService.markAllAsRead();
  }

  displayUnreadCount(count: number): string {
    return count > 99 ? '99+' : `${count}`;
  }

  sourceLabelKey(source: AlertCenterItemVm['source']): string {
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

  severityClass(severity: AlertCenterItemVm['severity']): string {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-sky-500';
    }
  }

  alertText(text: LocalizedAlertText): string {
    return this.currentLang === 'ar' ? text.ar : text.en;
  }

  formatDateTime(dateText: string): string {
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(dateText));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.alertsPanelOpen) {
      return;
    }

    const target = event.target as Node | null;
    if (target && this.alertsContainer?.nativeElement.contains(target)) {
      return;
    }

    this.alertsPanelOpen = false;
  }

  private buildRoute(alert: AlertCenterItemVm): string {
    if (!alert.routeQuery || !Object.keys(alert.routeQuery).length) {
      return alert.route;
    }

    const params = new URLSearchParams(alert.routeQuery);
    return `${alert.route}?${params.toString()}`;
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.searchInput$.next(value.trim());
  }

  onSearchFocus(): void {
    if (this.searchQuery.trim().length > 0 || this.searchGroups.length > 0) {
      this.isSearchOpen = true;
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.isSearchLoading = false;
    this.searchGroups = [];
    this.flatResults = [];
    this.activeResultIndex = -1;
    this.isSearchOpen = false;
  }

  handleSearchKeydown(event: KeyboardEvent): void {
    if (!this.shouldShowSearchOverlay) {
      if (event.key === 'Escape') {
        this.clearSearch();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveActiveResult(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActiveResult(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const targetIndex = this.activeResultIndex >= 0 ? this.activeResultIndex : 0;
      const result = this.flatResults[targetIndex];
      if (result) {
        this.selectSearchResult(result);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSearchOverlay();
    }
  }

  selectSearchResult(result: VendorGlobalSearchResult): void {
    this.closeSearchOverlay();
    void this.router.navigateByUrl(result.route);
  }

  closeSearchOverlay(): void {
    this.isSearchOpen = false;
    this.activeResultIndex = -1;
  }

  get shouldShowSearchOverlay(): boolean {
    return this.isSearchOpen && (
      this.isSearchLoading ||
      this.searchQuery.trim().length > 0 ||
      this.searchGroups.length > 0
    );
  }

  get isSearchQueryTooShort(): boolean {
    const length = this.searchQuery.trim().length;
    return length > 0 && length < this.minSearchLength;
  }

  get hasSearchResults(): boolean {
    return this.flatResults.length > 0;
  }

  isActiveResult(result: VendorGlobalSearchResult): boolean {
    return this.activeResultIndex === (result.flatIndex ?? -1);
  }

  trackBySearchGroup(index: number, group: VendorGlobalSearchGroup): string {
    return group.source || index.toString();
  }

  trackBySearchResult(index: number, result: VendorGlobalSearchResult): string {
    return `${result.type}:${result.id}:${index}`;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.shouldShowSearchOverlay) {
      return;
    }

    const target = event.target as Node | null;
    if (target && this.searchContainer?.nativeElement.contains(target)) {
      return;
    }

    this.closeSearchOverlay();
  }

  @HostListener('document:keydown', ['$event'])
  handleGlobalShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  }

  private moveActiveResult(direction: 1 | -1): void {
    if (this.flatResults.length === 0) {
      this.activeResultIndex = -1;
      return;
    }

    if (this.activeResultIndex === -1) {
      this.activeResultIndex = direction === 1 ? 0 : this.flatResults.length - 1;
      return;
    }

    this.activeResultIndex = (this.activeResultIndex + direction + this.flatResults.length) % this.flatResults.length;
  }

  private rebuildFlatResults(groups: VendorGlobalSearchGroup[]): void {
    let currentIndex = 0;
    this.flatResults = groups.flatMap((group) =>
      group.results.map((result) => {
        result.flatIndex = currentIndex++;
        return result;
      })
    );
    this.activeResultIndex = this.flatResults.length > 0 ? 0 : -1;
  }
}
