import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, combineLatest } from 'rxjs';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
  LocalizedTextVm,
  SupportArticleType,
  SupportCategory,
  SupportPriority,
  SupportReferenceArticleVm,
  SupportTicketStatus,
  VendorSupportTicketVm
} from '../../models/support-center.models';
import { SupportCenterService } from '../../services/support-center.service';

@Component({
  selector: 'app-support-reference-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    AppPanelHeaderComponent
  ],
  templateUrl: './support-reference-detail.component.html'
})
export class SupportReferenceDetailComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  article: SupportReferenceArticleVm | null = null;
  relatedTickets: VendorSupportTicketVm[] = [];

  private langSub: Subscription;
  private dataSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly supportCenterService: SupportCenterService,
    private readonly translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });
  }

  ngOnInit(): void {
    const articleId = this.route.snapshot.paramMap.get('id');

    if (!articleId) {
      this.router.navigate(['/support'], { queryParams: { view: 'reference' } });
      return;
    }

    this.dataSub = combineLatest([
      this.supportCenterService.getReferenceArticleById(articleId),
      this.supportCenterService.getTickets()
    ]).subscribe(([article, tickets]) => {
      if (!article) {
        this.router.navigate(['/support'], { queryParams: { view: 'reference' } });
        return;
      }

      this.article = article;
      this.relatedTickets = tickets
        .filter((ticket) => ticket.category === article.category)
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

  trackByTicketId(_index: number, ticket: VendorSupportTicketVm): string {
    return ticket.id;
  }
}
