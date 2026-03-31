import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-vendor-user-profile',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {
  @Input() userName: string = 'Vendor Store';
  @Input() userRole: string = 'Owner';
  @Input() initials: string = 'VS';
  @Output() logout = new EventEmitter<void>();

  onLogout(): void {
    this.logout.emit();
  }
}
