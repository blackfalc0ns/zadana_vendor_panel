import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppCardComponent } from '../../../../shared/components/ui/card/card.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppBadgeComponent } from '../../../../shared/components/ui/feedback/badge/badge.component';

@Component({
  selector: 'app-submission-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    AppCardComponent,
    AppButtonComponent,
    AppBadgeComponent
  ],
  templateUrl: './submission-success.component.html',
  styleUrl: './submission-success.component.scss'
})
export class SubmissionSuccessComponent implements OnInit {
  today = new Date();
  applicationId = 'ZDN-' + Math.floor(Math.random() * 9000000 + 1000000);
  businessName = '';

  constructor(
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // If we had a state service, we'd get the real biz name here.
    // For now, we can pick from localStorage or just show a default.
    this.businessName = localStorage.getItem('onboarding_biz_name') || 'Your Store';
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  get isRTL(): boolean {
    return this.translate.currentLang === 'ar';
  }
}

