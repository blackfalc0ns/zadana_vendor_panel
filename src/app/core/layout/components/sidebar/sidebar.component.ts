import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { AlertsCenterService } from '../../../../features/alerts/services/alerts-center.service';

export interface SidebarItem {
  icon: string | SafeHtml;
  label: string;
  route: string;
  exact?: boolean;
  badge?: string;
  badgeType?: 'new' | 'number' | 'notification' | 'progress';
}

@Component({
  selector: 'app-vendor-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private alertsCenterService = inject(AlertsCenterService);

  @Input() currentLang: string = 'ar';
  readonly unreadCount$: Observable<number> = this.alertsCenterService.getUnreadCount();
  @Input() userName: string = 'Ember Crest';
  @Input() userRole: string = 'Vendor';
  @Input() initials: string = 'مت';

  ngOnInit() {
    this.menuItems = this.menuItems.map(item => ({
      ...item,
      icon: this.sanitizer.bypassSecurityTrustHtml(item.icon as string)
    }));
  }
  
  menuItems: SidebarItem[] = [
    {
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />',
      label: 'SIDEBAR.DASHBOARD',
      route: '/',
      exact: true
    },
    {
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />',
      label: 'SIDEBAR.PRODUCTS',
      route: '/products'
    },
    {
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />',
      label: 'SIDEBAR.ORDERS',
      route: '/orders',
      badge: 'New',
      badgeType: 'new'
    },
    {
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />',
      label: 'SIDEBAR.OFFERS',
      route: '/offers'
    },
    {
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />',
      label: 'SIDEBAR.FINANCE',
      route: '/finance'
    },
    {
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />',
      label: 'SIDEBAR.STAFF_BRANCHES',
      route: '/staff'
    },
    {
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />',
      label: 'SIDEBAR.REVIEWS',
      route: '/reviews'
    },
    {
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />',
      label: 'SIDEBAR.SETTINGS',
      route: '/profile'
    }
  ];
}
