import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription, filter } from 'rxjs';
import { VendorAccessService } from '../../../auth/services/vendor-access.service';
import { VendorAuthService } from '../../../auth/services/vendor-auth.service';

export interface SidebarItem {
 icon: string | SafeHtml;
 label: string;
 description: string;
 route: string;
 exact?: boolean;
 queryParams?: Record<string, string>;
 badge?: string;
 badgeType?: 'new' | 'number' | 'notification' | 'progress';
 permissions?: string[];
 permissionMatch?: 'any' | 'all';
 category: 'overview' | 'operations' | 'catalog' | 'management';
}

export interface SidebarCategory {
 label: string;
 items: SidebarItem[];
}

interface SidebarCursorTooltip {
 visible: boolean;
 text: string;
 x: number;
 y: number;
 active: boolean;
}

@Component({
 changeDetection: ChangeDetectionStrategy.OnPush,
 selector: 'app-vendor-sidebar',
 standalone: true,
 imports: [CommonModule, RouterModule, RouterLinkActive, TranslateModule],
 templateUrl: './sidebar.component.html',
 styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy, OnChanges {
 private readonly cdr = inject(ChangeDetectorRef);
 private sanitizer = inject(DomSanitizer);
 private accessService = inject(VendorAccessService);
 private authService = inject(VendorAuthService);
 private translate = inject(TranslateService);
 private router = inject(Router);
 private routerEventsSub?: Subscription;
 private authSub?: Subscription;

 @Input() currentLang: string = 'ar';
 @Input() userName: string = 'Ember Crest';
 @Input() userRole: string = 'Vendor';
 @Input() initials: string = 'مت';

 @Input() isMobileMenuOpen = false;
 @Input() isCollapsed = false;

 @Output() toggleMobileMenu = new EventEmitter<void>();
 @Output() collapseSidebar = new EventEmitter<void>();
 @Output() languageSwitch = new EventEmitter<void>();
 @Output() logoutAction = new EventEmitter<void>();

 menuCategories: SidebarCategory[] = [];
 cursorTooltip: SidebarCursorTooltip = {
 visible: false,
 text: '',
 x: 0,
 y: 0,
 active: false
 };

 ngOnInit() {
 this.menuItems = this.menuItems.map(item => ({...item,
 icon: this.sanitizer.bypassSecurityTrustHtml(item.icon as string)
 }));
 this.rebuildMenuCategories();

 this.authSub = this.authService.currentUser$.subscribe(() => {
 this.rebuildMenuCategories();
 this.cdr.markForCheck();
 });

 this.routerEventsSub = this.router.events.pipe(
 filter((event): event is NavigationEnd => event instanceof NavigationEnd)
 ).subscribe(() => this.cdr.markForCheck());
 }

 ngOnDestroy() {
 this.routerEventsSub?.unsubscribe();
 this.authSub?.unsubscribe();
 }

 ngOnChanges(changes: SimpleChanges): void {
 if (changes['isCollapsed'] &&!this.isCollapsed) {
 this.hideCursorTooltip();
 }
 }

 trackByCategory(_index: number, category: SidebarCategory): string {
 return category.label;
 }

 trackByItem(_index: number, item: SidebarItem): string {
 return item.route;
 }

 private static readonly exactLinkActiveOptions = {
 paths: 'exact' as const,
 queryParams: 'ignored' as const,
 fragment: 'ignored' as const,
 matrixParams: 'ignored' as const
 };

 private static readonly subsetLinkActiveOptions = {
 paths: 'subset' as const,
 queryParams: 'ignored' as const,
 fragment: 'ignored' as const,
 matrixParams: 'ignored' as const
 };

 getLinkActiveOptions(item: SidebarItem): {
 paths: 'exact' | 'subset';
 queryParams: 'ignored';
 fragment: 'ignored';
 matrixParams: 'ignored';
 } {
 return item.exact
 ? SidebarComponent.exactLinkActiveOptions
 : SidebarComponent.subsetLinkActiveOptions;
 }

 onSidebarNavigate(item: SidebarItem, event: Event): void {
 const currentPath = (this.router.url || '/').split('?')[0].split('#')[0];
 const targetPath = item.route;
 const alreadyOnRoute = item.exact
 ? currentPath === targetPath
 : currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);

 if (alreadyOnRoute && (!item.queryParams || this.queryParamsMatch(item.queryParams))) {
 event.preventDefault();
 event.stopPropagation();
 this.onNavClick();
 return;
 }

 this.onNavClick();
 }

 private queryParamsMatch(expected: Record<string, string>): boolean {
 const tree = this.router.parseUrl(this.router.url);
 const current = tree.queryParams;
 return Object.entries(expected).every(([key, value]) => current[key] === value);
 }

 private rebuildMenuCategories(): void {
 const categories: { label: string; key: SidebarItem['category'] }[] = [
 { label: 'SIDEBAR.CAT_OVERVIEW', key: 'overview' },
 { label: 'SIDEBAR.CAT_OPERATIONS', key: 'operations' },
 { label: 'SIDEBAR.CAT_CATALOG', key: 'catalog' },
 { label: 'SIDEBAR.CAT_MANAGEMENT', key: 'management' }
 ];

 this.menuCategories = categories.map(cat => ({
 label: cat.label,
 items: this.menuItems.filter(item => item.category === cat.key && this.canAccessItem(item))
 })).filter(cat => cat.items.length > 0);
 }

 switchLanguage(): void {
 this.languageSwitch.emit();
 }

 onToggleMobileMenu(): void {
 this.toggleMobileMenu.emit();
 }

 onCollapseSidebar(): void {
 this.collapseSidebar.emit();
 }

 /** Chevron-left SVG: collapse points inward; expand points outward — flipped for RTL/LTR. */
 get collapseToggleChevronClass(): string {
 const isRtl = this.currentLang === 'ar';

 if (this.isCollapsed) {
 // Expand: LTR → right, RTL → left
 return isRtl ? '' : 'rotate-180';
 }

 // Collapse: LTR → left, RTL → right
 return isRtl ? 'rotate-180' : '';
 }

 /** Mobile drawer close chevron points toward the screen edge. */
 get mobileCloseChevronClass(): string {
 return this.currentLang === 'ar' ? 'rotate-180' : '';
 }

 onNavClick(): void {
 this.hideCursorTooltip();

 if (this.isMobileMenuOpen) {
 this.toggleMobileMenu.emit();
 }
 }

 onLinkHoverStart(labelKey: string, event: MouseEvent): void {
 if (!this.isCollapsed) {
 return;
 }

 const target = event.currentTarget as HTMLElement | null;
 this.cursorTooltip.text = this.translate.instant(labelKey);
 this.cursorTooltip.active = target?.classList.contains('is-active') ?? false;
 this.cursorTooltip.visible = true;
 this.setCursorTooltipPosition(event);
 this.cdr.markForCheck();
 }

 onLinkHoverMove(event: MouseEvent): void {
 if (!this.isCollapsed ||!this.cursorTooltip.visible) {
 return;
 }

 this.setCursorTooltipPosition(event);
 this.cdr.markForCheck();
 }

 hideCursorTooltip(): void {
 if (!this.cursorTooltip.visible) {
 return;
 }

 this.cursorTooltip.visible = false;
 this.cdr.markForCheck();
 }

 private setCursorTooltipPosition(event: MouseEvent): void {
 const offset = 14;
 this.cursorTooltip.x = event.clientX + (this.currentLang === 'ar' ? -offset : offset);
 this.cursorTooltip.y = event.clientY + offset;
 }

 logout(): void {
 this.logoutAction.emit();
 }

 private canAccessItem(item: SidebarItem): boolean {
 if (!item.permissions || item.permissions.length === 0) {
 return true;
 }

 return item.permissionMatch === 'all'
 ? this.accessService.hasAllPermissions(item.permissions)
 : this.accessService.hasAnyPermission(item.permissions);
 }
 
 menuItems: SidebarItem[] = [
 {
 icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />',
 label: 'SIDEBAR.DASHBOARD',
 description: 'SIDEBAR.DASHBOARD_DESC',
 route: '/dashboard',
 exact: true,
 queryParams: { tab: 'overview' },
 permissions: ['vendor_dashboard.view'],
 category: 'overview'
 },
 {
 icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />',
 label: 'SIDEBAR.ORDERS',
 description: 'SIDEBAR.ORDERS_DESC',
 route: '/orders',
 badge: 'New',
 badgeType: 'new',
 permissions: ['vendor_orders.view'],
 category: 'operations'
 },
 {
 icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 22h6M12 18v4M5 4h14l-1 8a4 4 0 0 1-4 3H10a4 4 0 0 1-4-3L5 4Zm2.5 0a4.5 4.5 0 0 0 9 0" />',
 label: 'SIDEBAR.DISPUTES',
 description: 'SIDEBAR.DISPUTES_DESC',
 route: '/disputes',
 permissions: ['vendor_disputes.view'],
 category: 'operations'
 },
 {
 icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
 label: 'SIDEBAR.SUPPORT',
 description: 'SIDEBAR.SUPPORT_DESC',
 route: '/support',
 exact: true,
 permissions: ['vendor_support.view'],
 category: 'operations'
 },
 {
 icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />',
 label: 'SIDEBAR.PRODUCTS',
 description: 'SIDEBAR.PRODUCTS_DESC',
 route: '/products',
 permissions: ['vendor_catalog.view'],
 category: 'catalog'
 },
 {
 icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />',
 label: 'SIDEBAR.OFFERS',
 description: 'SIDEBAR.OFFERS_DESC',
 route: '/offers',
 queryParams: { type: 'direct' },
 permissions: ['vendor_offers.view'],
 category: 'catalog'
 },
 {
 icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />',
 label: 'SIDEBAR.FINANCE',
 description: 'SIDEBAR.FINANCE_DESC',
 route: '/finance',
 queryParams: { period: 'month' },
 permissions: ['vendor_finance.view'],
 category: 'management'
 },
 {
 icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />',
 label: 'SIDEBAR.STAFF_BRANCHES',
 description: 'SIDEBAR.STAFF_BRANCHES_DESC',
 route: '/staff',
 queryParams: { view: 'branches' },
 permissions: ['vendor_staff.view', 'vendor_branch_team.view'],
 permissionMatch: 'any',
 category: 'management'
 },
 {
 icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />',
 label: 'SIDEBAR.SETTINGS',
 description: 'SIDEBAR.SETTINGS_DESC',
 route: '/profile',
 queryParams: { tab: 'store-section' },
 permissions: ['vendor_profile.view'],
 category: 'management'
 },
 {
 icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />',
 label: 'SIDEBAR.TERMS',
 description: 'SIDEBAR.TERMS_DESC',
 route: '/legal/terms',
 category: 'management'
 }
 ];
}
