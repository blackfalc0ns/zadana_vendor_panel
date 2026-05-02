import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import {
  VendorDisputeActivityVm,
  VendorDisputeDetailVm,
  VendorDisputePriority,
  VendorDisputeStatus,
  VendorDisputeType
} from '../../models/vendor-disputes.models';
import { VendorDisputesService } from '../../services/vendor-disputes.service';

@Component({
  selector: 'app-vendor-dispute-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    AppPanelHeaderComponent
  ],
  templateUrl: './vendor-dispute-detail.component.html'
})
export class VendorDisputeDetailComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  dispute: VendorDisputeDetailVm | null = null;
  responseDraft = '';
  flashMessage = '';
  isSubmitting = false;

  private langSub: Subscription;
  private detailSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly disputesService: VendorDisputesService,
    private readonly translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.flashMessage = '';
    });
  }

  ngOnInit(): void {
    const caseId = this.route.snapshot.paramMap.get('id');

    if (!caseId) {
      this.router.navigate(['/disputes']);
      return;
    }

    this.loadDispute(caseId);
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.detailSub?.unsubscribe();
  }

  get canRespond(): boolean {
    return !!this.dispute
      && !this.isSubmitting
      && this.dispute.allowedActions.includes('message')
      && !!this.responseDraft.trim();
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(value));
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(value));
  }

  statusKey(status: VendorDisputeStatus | string): string {
    return `VENDOR_DISPUTES.STATUS.${this.normalizeStatus(status).toUpperCase()}`;
  }

  typeKey(type: VendorDisputeType | string): string {
    return `VENDOR_DISPUTES.TYPE.${this.normalizeType(type).toUpperCase()}`;
  }

  priorityKey(priority: VendorDisputePriority | string): string {
    return `VENDOR_DISPUTES.PRIORITY.${this.normalizePriority(priority).toUpperCase()}`;
  }

  statusClass(status: VendorDisputeStatus | string): string {
    switch (this.normalizeStatus(status)) {
      case 'in_review':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      case 'awaiting_customer_evidence':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'approved':
      case 'resolved':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'rejected':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      default:
        return 'border-violet-200 bg-violet-50 text-violet-700';
    }
  }

  priorityClass(priority: VendorDisputePriority | string): string {
    switch (this.normalizePriority(priority)) {
      case 'critical':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'high':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'medium':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  }

  trackByActivity(_index: number, activity: VendorDisputeActivityVm): string {
    return activity.id;
  }

  participantLabel(role: string): string {
    return `VENDOR_DISPUTES.PARTICIPANTS.${role.trim().toUpperCase()}`;
  }

  isOwnMessage(authorRole: string): boolean {
    return authorRole.trim().toLowerCase() === 'vendor';
  }

  submitResponse(): void {
    if (!this.dispute || !this.responseDraft.trim() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const responseText = this.responseDraft.trim();

    this.disputesService.respondToDispute(this.dispute.id, responseText).subscribe({
      next: () => {
        this.responseDraft = '';
        this.flashMessage = this.translate.instant('VENDOR_DISPUTES.DETAIL.RESPONSE_SENT');
        this.isSubmitting = false;
        this.loadDispute(this.dispute!.id);
      },
      error: () => {
        this.flashMessage = this.translate.instant('VENDOR_DISPUTES.DETAIL.RESPONSE_FAILED');
        this.isSubmitting = false;
      }
    });
  }

  private loadDispute(caseId: string): void {
    this.detailSub?.unsubscribe();
    this.detailSub = this.disputesService.getDisputeById(caseId).subscribe({
      next: (dispute) => {
        this.dispute = dispute;
      },
      error: () => {
        this.router.navigate(['/disputes']);
      }
    });
  }

  private normalizeType(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizeStatus(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizePriority(value: string): string {
    return value.trim().toLowerCase();
  }
}
