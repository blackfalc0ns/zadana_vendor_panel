import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vendor-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
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
}
