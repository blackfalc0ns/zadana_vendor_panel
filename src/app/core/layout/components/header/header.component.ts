import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AlertCenterItemVm, LocalizedAlertText } from '../../../../features/alerts/models/alerts-center.models';
import { AlertsCenterService } from '../../../../features/alerts/services/alerts-center.service';

@Component({
  selector: 'app-vendor-header',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  @Input() currentLang: string = 'ar';
  @Input() isSidebarOpen: boolean = false;
  @Input() isMobileMenuOpen: boolean = false;
  @Input() userName: string = 'User';
  @Input() userRole: string = 'Vendor';
  @Input() initials: string = 'U';
  
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleMobileMenu = new EventEmitter<void>();
  @Output() languageSwitch = new EventEmitter<void>();
  @Output() logoutAction = new EventEmitter<void>();

  @ViewChild('alertsContainer') alertsContainer?: ElementRef<HTMLElement>;

  alertsPanelOpen = false;
  unreadCount$?: Observable<number>;
  bellAlerts$?: Observable<AlertCenterItemVm[]>;

  constructor(
    private readonly alertsCenterService: AlertsCenterService,
    private readonly router: Router
  ) {
  }

  ngOnInit(): void {
    this.scheduleAlertsHydration();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleMobileMenu(): void {
    this.toggleMobileMenu.emit();
  }

  onLanguageSwitch(): void {
    this.languageSwitch.emit();
  }

  onLogout(): void {
    this.logoutAction.emit();
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
      case 'reviews':
        return 'ALERTS_CENTER.SOURCES.REVIEWS';
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

  private scheduleAlertsHydration(): void {
    const hydrate = () => {
      this.unreadCount$ = this.alertsCenterService.getUnreadCount();
      this.bellAlerts$ = this.alertsCenterService.getBellAlerts();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }).requestIdleCallback(
        () => hydrate()
      );
      return;
    }

    setTimeout(hydrate, 900);
  }
}
