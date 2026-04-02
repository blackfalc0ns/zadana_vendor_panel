import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, combineLatest } from 'rxjs';
import { VendorProfileService } from '../../../settings/services/vendor-profile.service';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
  LocalizedTextVm,
  SupportArticleType,
  SupportCategory,
  SupportPriority,
  SupportReferenceArticleVm,
  SupportTagTone,
  SupportTicketStatus,
  VendorSupportTicketVm
} from '../../models/support-center.models';
import { SupportCenterService } from '../../services/support-center.service';

@Component({
  selector: 'app-support-ticket-detail',
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
  templateUrl: './support-ticket-detail.component.html'
})
export class SupportTicketDetailComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  ticket: VendorSupportTicketVm | null = null;
  relatedArticles: SupportReferenceArticleVm[] = [];
  composerDraft = '';
  flashMessage = '';
  vendorDisplayName = '';

  private langSub: Subscription;
  private dataSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly supportCenterService: SupportCenterService,
    private readonly profileService: VendorProfileService,
    private readonly translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.updateVendorDisplayName();
      if (this.flashMessage) {
        this.flashMessage = '';
      }
    });
  }

  ngOnInit(): void {
    this.updateVendorDisplayName();
    const ticketId = this.route.snapshot.paramMap.get('id');

    if (!ticketId) {
      this.router.navigate(['/support'], { queryParams: { view: 'support' } });
      return;
    }

    this.dataSub = combineLatest([
      this.supportCenterService.getTicketById(ticketId),
      this.supportCenterService.getReferenceArticles()
    ]).subscribe(([ticket, articles]) => {
      if (!ticket) {
        this.router.navigate(['/support'], { queryParams: { view: 'support' } });
        return;
      }

      this.ticket = ticket;
      this.relatedArticles = articles
        .filter((article) => article.category === ticket.category)
        .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  localized(value: LocalizedTextVm): string {
    return this.currentLang === 'ar' ? value.ar : value.en;
  }

  formatDate(dateText: string): string {
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateText));
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

  categoryKey(category: SupportCategory): string {
    return `SUPPORT_CENTER.CATEGORIES.${category.toUpperCase()}`;
  }

  articleTypeKey(type: SupportArticleType): string {
    return `SUPPORT_CENTER.ARTICLE_TYPES.${type.toUpperCase()}`;
  }

  statusKey(status: SupportTicketStatus): string {
    return `SUPPORT_CENTER.STATUSES.${status.toUpperCase()}`;
  }

  priorityKey(priority: SupportPriority): string {
    return `SUPPORT_CENTER.PRIORITIES.${priority.toUpperCase()}`;
  }

  statusClass(status: SupportTicketStatus): string {
    switch (status) {
      case 'open':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'in_progress':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      case 'waiting_vendor':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      default:
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }
  }

  priorityClass(priority: SupportPriority): string {
    switch (priority) {
      case 'urgent':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'high':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'medium':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  }

  tagClass(tone: SupportTagTone): string {
    switch (tone) {
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'info':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  }

  sendMessage(): void {
    const ticket = this.ticket;
    const message = this.composerDraft.trim();

    if (!ticket || !message) {
      return;
    }

    this.supportCenterService.addVendorMessage(ticket.id, { ar: message, en: message }, this.vendorDisplayName);
    this.composerDraft = '';
    this.flashMessage = this.translate.instant('SUPPORT_CENTER.FEEDBACK.MESSAGE_SENT');

    setTimeout(() => {
      if (this.flashMessage === this.translate.instant('SUPPORT_CENTER.FEEDBACK.MESSAGE_SENT')) {
        this.flashMessage = '';
      }
    }, 2800);
  }

  trackByArticleId(_index: number, article: SupportReferenceArticleVm): string {
    return article.id;
  }

  private updateVendorDisplayName(): void {
    const profile = this.profileService.getProfileSnapshot();
    this.vendorDisplayName = this.currentLang === 'ar'
      ? (profile.storeNameAr || profile.storeNameEn || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME'))
      : (profile.storeNameEn || profile.storeNameAr || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME'));
  }
}
