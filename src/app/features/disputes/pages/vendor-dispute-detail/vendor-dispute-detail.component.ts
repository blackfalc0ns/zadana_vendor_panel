import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AlertsCenterService } from '../../../alerts/services/alerts-center.service';
import {
  VendorDisputeActivityVm,
  VendorDisputeDetailVm,
  VendorDisputePriority,
  VendorDisputeStatus,
  VendorDisputeType
} from '../../models/vendor-disputes.models';
import { VendorDisputesService } from '../../services/vendor-disputes.service';
import {
  getVendorDisputeCompensationLabel,
  getVendorDisputeDisplayState,
  getVendorDisputeSettlementLabel,
  normalizeVendorDisputePriority,
  normalizeVendorDisputeStatus,
  normalizeVendorDisputeType
} from '../../utils/vendor-dispute-display.utils';

@Component({
  selector: 'app-vendor-dispute-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NgClass
  ],
  templateUrl: './vendor-dispute-detail.component.html',
  styles: [`
    :host {
      display: block;
    }

    .dispute-detail-shell {
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(165, 238, 253, 0.32), transparent 34%),
        radial-gradient(circle at bottom right, rgba(255, 184, 112, 0.14), transparent 30%),
        #f8fafb;
    }

    .dispute-glass-card {
      background: rgba(255, 255, 255, 0.74);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.55);
      box-shadow: 0 14px 40px -24px rgba(0, 73, 83, 0.34);
    }

    .dispute-glass-button {
      background: linear-gradient(135deg, #004953, #00626f);
      box-shadow: 0 10px 24px -18px rgba(0, 98, 111, 0.85);
    }

    .conversation-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #bec8cb transparent;
    }

    .conversation-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .conversation-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .conversation-scrollbar::-webkit-scrollbar-thumb {
      background: #bec8cb;
      border-radius: 999px;
    }

    .conversation-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #00626f;
    }
  `]
})
export class VendorDisputeDetailComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  dispute: VendorDisputeDetailVm | null = null;
  responseDraft = '';
  flashMessage = '';
  isSubmitting = false;
  selectedImage: string | null = null;

  private langSub: Subscription;
  private detailSub?: Subscription;
  private alertsSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly disputesService: VendorDisputesService,
    private readonly translate: TranslateService,
    private readonly alertsCenterService: AlertsCenterService
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
    this.alertsSub = this.alertsCenterService.getRealtimeAlerts().subscribe((alert) => {
      if (!this.dispute) {
        return;
      }

      if (alert.route === `/disputes/${this.dispute.id}` || alert.route.startsWith('/disputes')) {
        this.loadDispute(this.dispute.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.detailSub?.unsubscribe();
    this.alertsSub?.unsubscribe();
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
    return getVendorDisputeDisplayState(
      {
        type: 'complaint',
        status,
        settlementStatus: null,
        compensationType: null,
        message: ''
      },
      this.currentLang
    ).displayStatusClass;
  }

  displayStatusLabel(dispute: VendorDisputeDetailVm): string {
    return getVendorDisputeDisplayState(dispute, this.currentLang).displayStatusLabel;
  }

  displayTypeLabel(dispute: VendorDisputeDetailVm): string {
    return getVendorDisputeDisplayState(dispute, this.currentLang).displayTypeLabel;
  }

  displayTypeMetaLabel(dispute: VendorDisputeDetailVm): string {
    return getVendorDisputeDisplayState(dispute, this.currentLang).displayTypeMetaLabel;
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

  settlementLabel(value: string | null): string {
    return getVendorDisputeSettlementLabel(value, this.currentLang);
  }

  shouldShowWaitingOn(dispute: VendorDisputeDetailVm): boolean {
    const status = this.normalizeStatus(dispute.status);
    return status !== 'resolved' && status !== 'rejected' && this.normalizeRole(dispute.waitingOnRole).length > 0;
  }

  compensationLabel(value: string | null): string {
    return getVendorDisputeCompensationLabel(value, this.currentLang);
  }

  refundMethodLabel(value: string | null): string {
    switch ((value || '').toLowerCase()) {
      case 'same_method':
        return this.currentLang === 'ar' ? 'نفس وسيلة الدفع' : 'Same payment method';
      case 'coupon':
        return this.currentLang === 'ar' ? 'كوبون تعويضي' : 'Compensation coupon';
      default:
        return value ?? (this.currentLang === 'ar' ? 'غير محدد' : 'Not set');
    }
  }

  costBearerLabel(value: string | null): string {
    switch ((value || '').toLowerCase()) {
      case 'vendor':
        return this.currentLang === 'ar' ? 'المتجر' : 'Vendor';
      case 'platform':
        return this.currentLang === 'ar' ? 'المنصة' : 'Platform';
      case 'shared':
        return this.currentLang === 'ar' ? 'مشترك' : 'Shared';
      default:
        return value ?? (this.currentLang === 'ar' ? 'غير محدد' : 'Not set');
    }
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

  goBack(): void {
    this.router.navigate(['/disputes']);
  }

  printPage(): void {
    window.print();
  }

  authorRoleLabel(role: string): string {
    switch (this.normalizeRole(role)) {
      case 'vendor':
        return this.currentLang === 'ar' ? 'التاجر' : 'Vendor';
      case 'customer':
        return this.currentLang === 'ar' ? 'العميل' : 'Customer';
      case 'support':
      case 'admin':
        return this.currentLang === 'ar' ? 'الدعم' : 'Support';
      case 'driver':
        return this.currentLang === 'ar' ? 'المندوب' : 'Driver';
      case 'system':
        return this.currentLang === 'ar' ? 'النظام' : 'System';
      default:
        return role;
    }
  }

  authorInitial(role: string): string {
    const normalizedRole = this.normalizeRole(role);
    if (this.currentLang === 'ar') {
      switch (normalizedRole) {
        case 'vendor':
          return 'ت';
        case 'customer':
          return 'ع';
        case 'support':
        case 'admin':
          return 'د';
        case 'driver':
          return 'م';
        case 'system':
          return 'ن';
        default:
          return role.slice(0, 1).toUpperCase();
      }
    }

    return role.slice(0, 1).toUpperCase();
  }

  authorBadgeClass(role: string): string {
    switch (this.normalizeRole(role)) {
      case 'vendor':
        return 'border-[#00626f]/20 bg-[#00626f]/10 text-[#00626f]';
      case 'customer':
        return 'border-slate-200 bg-slate-100 text-slate-700';
      case 'support':
      case 'admin':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'driver':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  }

  authorBubbleClass(role: string): string {
    return this.isOwnMessage(role)
      ? 'border-[#00626f]/12 bg-[#00626f]/6 text-slate-800'
      : 'border-slate-200/80 bg-white text-slate-800';
  }

  attachmentIcon(fileName: string): string {
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.endsWith('.pdf')) {
      return 'picture_as_pdf';
    }
    if (lowerFileName.match(/\.(xlsx|xls|csv)$/)) {
      return 'table_view';
    }
    if (lowerFileName.match(/\.(doc|docx)$/)) {
      return 'description';
    }
    if (lowerFileName.match(/\.(zip|rar|7z)$/)) {
      return 'folder_zip';
    }
    return this.isImageUrl(fileName) ? 'image' : 'attach_file';
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
    return normalizeVendorDisputeType(value);
  }

  private normalizeStatus(value: string): string {
    return normalizeVendorDisputeStatus(value);
  }

  private normalizePriority(value: string): string {
    return normalizeVendorDisputePriority(value);
  }

  private normalizeRole(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
  }

  isImageUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/) !== null || lowerUrl.startsWith('data:image/');
  }

  openImage(url: string): void {
    if (this.isImageUrl(url)) {
      this.selectedImage = url;
    } else {
      window.open(url, '_blank', 'noreferrer');
    }
  }

  closeImage(): void {
    this.selectedImage = null;
  }
}
