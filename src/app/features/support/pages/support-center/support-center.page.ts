import { CommonModule, NgClass } from '@angular/common';
import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { Subscription, combineLatest } from 'rxjs';
import { VendorProfileService } from '../../../settings/services/vendor-profile.service';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
  DetailTabNavItem,
  DetailTabsNavComponent
} from '../../../../shared/components/ui/navigation/detail-tabs-nav/detail-tabs-nav.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';
import { AppFlashBannerComponent } from '../../../../shared/components/ui/feedback/flash-banner/flash-banner.component';
import { AppMetricCardComponent } from '../../../../shared/components/ui/data-display/metric-card/metric-card.component';
import { AppEmptyStateComponent } from '../../../../shared/components/ui/data-display/empty-state/empty-state.component';
import { AppFilterPanelComponent } from '../../../../shared/components/ui/layout/filter-panel/filter-panel.component';
import { AppPageSectionShellComponent } from '../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';
import { AppModalShellComponent } from '../../../../shared/components/ui/overlay/modal-shell/modal-shell.component';
import {
  CreateSupportTicketInput,
  LocalizedTextVm,
  SupportArticleType,
  SupportCategory,
  SupportCenterView,
  SupportPriority,
  SupportReferenceArticleVm,
  SupportSummaryVm,
  SupportTagTone,
  SupportTicketStatus,
  VendorSupportTicketVm
} from '../../models/support-center.models';
import { SupportCenterService } from '../../services/support-center.service';
import { CreateTicketDraft, ReferenceFilters, SupportFilters } from './support-center.page.models';

@Component({
  selector: 'app-support-center-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    DetailTabsNavComponent,
    AppPaginationComponent,
    AppFlashBannerComponent,
    AppMetricCardComponent,
    AppEmptyStateComponent,
    AppFilterPanelComponent,
    AppPageSectionShellComponent,
    AppModalShellComponent
  , SearchableSelectComponent],
  templateUrl: './support-center.page.html'
})
export class SupportCenterPageComponent implements OnInit, DoCheck, OnDestroy {

  get mappedFilterPriorityOptions() { return [{value: 'all', labelKey: 'SUPPORT_CENTER.FILTERS.ALL_PRIORITIES'}].concat(this.priorityOptions.map((x: any) => ({value: x, labelKey: this.priorityKey(x)}))); }
  get mappedFilterCategoryOptions() { return [{value: 'all', labelKey: 'SUPPORT_CENTER.FILTERS.ALL_CATEGORIES'}].concat(this.categoryOptions.map((x: any) => ({value: x, labelKey: this.categoryKey(x)}))); }
  get mappedFilterTypeOptions() { return [{value: 'all', labelKey: 'SUPPORT_CENTER.FILTERS.ALL_TYPES'}].concat(this.articleTypeOptions.map((x: any) => ({value: x, labelKey: this.articleTypeKey(x)}))); }
  get mappedCategoryOptions() { return this.categoryOptions.map((x: any) => ({value: x, labelKey: this.categoryKey(x)})); }
  get mappedPriorityOptions() { return this.priorityOptions.map((x: any) => ({value: x, labelKey: this.priorityKey(x)})); }

  currentLang = 'ar';
  activeView: SupportCenterView = 'support';
  isFiltersExpanded = true;
  isCreateTicketModalOpen = false;
  vendorDisplayName = 'Vendor Team';
  flashMessage = '';
  flashTone: 'success' | 'info' = 'success';

  tickets: VendorSupportTicketVm[] = [];
  referenceArticles: SupportReferenceArticleVm[] = [];
  summary: SupportSummaryVm = {
    openTickets: 0,
    pendingFollowUps: 0,
    averageResponseHours: 0,
    referenceCount: 0
  };

  readonly supportFilters: SupportFilters = {
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all'
  };

  readonly referenceFilters: ReferenceFilters = {
    search: '',
    category: 'all',
    type: 'all'
  };

  readonly ticketDraft: CreateTicketDraft = this.createEmptyTicketDraft();
  readonly categoryOptions: SupportCategory[] = ['orders', 'products', 'finance', 'offers', 'staff', 'profile', 'technical', 'general'];
  readonly priorityOptions: SupportPriority[] = ['low', 'medium', 'high', 'urgent'];
  readonly articleTypeOptions: SupportArticleType[] = ['guide', 'policy', 'checklist'];
  readonly pageSize = 10;
  private readonly currentPages: Record<SupportCenterView, number> = {
    support: 1,
    reference: 1
  };

  private langSub: Subscription;
  private dataSub?: Subscription;
  private profileSub?: Subscription;
  private querySub?: Subscription;
  private lastFilterSignatures: Record<SupportCenterView, string> = {
    support: '',
    reference: ''
  };

  constructor(
    private readonly route: ActivatedRoute,
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

    this.querySub = this.route.queryParamMap.subscribe((params) => {
      const requestedView = params.get('view');
      if (requestedView === 'support' || requestedView === 'reference') {
        this.activeView = requestedView;
      }

      const requestedCategory = params.get('category');
      const category = this.isSupportCategory(requestedCategory) ? requestedCategory : undefined;

      if (params.get('action') === 'ticket') {
        this.activeView = 'support';
        this.openCreateTicket(category);
      }
    });

    this.dataSub = combineLatest([
      this.supportCenterService.getTickets(),
      this.supportCenterService.getSummary(),
      this.supportCenterService.getReferenceArticles()
    ]).subscribe(([tickets, summary, referenceArticles]) => {
      this.tickets = tickets;
      this.summary = summary;
      this.referenceArticles = referenceArticles;
    });

    this.profileSub = this.profileService.getProfile().subscribe(() => {
      this.updateVendorDisplayName();
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub?.unsubscribe();
    this.profileSub?.unsubscribe();
    this.querySub?.unsubscribe();
  }

  ngDoCheck(): void {
    this.syncFilterSignature('support', this.supportFilters);
    this.syncFilterSignature('reference', this.referenceFilters);
  }

  get viewTabs(): DetailTabNavItem[] {
    return [
      {
        id: 'support',
        labelKey: 'SUPPORT_CENTER.TABS.SUPPORT',
        icon: 'support_agent',
        count: this.tickets.length,
        attention: this.summary.pendingFollowUps > 0
      },
      {
        id: 'reference',
        labelKey: 'SUPPORT_CENTER.TABS.REFERENCE',
        icon: 'menu_book',
        count: this.referenceArticles.length
      }
    ];
  }

  get currentPanelTitle(): string {
    return this.activeView === 'support'
      ? 'SUPPORT_CENTER.SECTIONS.SUPPORT_TITLE'
      : 'SUPPORT_CENTER.SECTIONS.REFERENCE_TITLE';
  }

  get currentPanelSubtitle(): string {
    return this.activeView === 'support'
      ? 'SUPPORT_CENTER.SECTIONS.SUPPORT_SUBTITLE'
      : 'SUPPORT_CENTER.SECTIONS.REFERENCE_SUBTITLE';
  }

  get filteredTickets(): VendorSupportTicketVm[] {
    const search = this.supportFilters.search.trim().toLowerCase();

    return [...this.tickets]
      .filter((ticket) => {
        if (search) {
          const matchesSearch = [
            ticket.reference,
            ticket.subject.ar,
            ticket.subject.en,
            ticket.summary.ar,
            ticket.summary.en
          ].some((value) => value.toLowerCase().includes(search));

          if (!matchesSearch) {
            return false;
          }
        }

        if (this.supportFilters.status !== 'all' && ticket.status !== this.supportFilters.status) {
          return false;
        }

        if (this.supportFilters.priority !== 'all' && ticket.priority !== this.supportFilters.priority) {
          return false;
        }

        if (this.supportFilters.category !== 'all' && ticket.category !== this.supportFilters.category) {
          return false;
        }

        return true;
      })
      .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());
  }

  get filteredArticles(): SupportReferenceArticleVm[] {
    const search = this.referenceFilters.search.trim().toLowerCase();

    return [...this.referenceArticles]
      .filter((article) => {
        if (search) {
          const matchesSearch = [
            article.title.ar,
            article.title.en,
            article.summary.ar,
            article.summary.en
          ].some((value) => value.toLowerCase().includes(search));

          if (!matchesSearch) {
            return false;
          }
        }

        if (this.referenceFilters.category !== 'all' && article.category !== this.referenceFilters.category) {
          return false;
        }

        if (this.referenceFilters.type !== 'all' && article.type !== this.referenceFilters.type) {
          return false;
        }

        return true;
      })
      .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());
  }

  get pagedTickets(): VendorSupportTicketVm[] {
    return this.paginateItems(this.filteredTickets, 'support');
  }

  get pagedArticles(): SupportReferenceArticleVm[] {
    return this.paginateItems(this.filteredArticles, 'reference');
  }

  get activeTotalCount(): number {
    return this.activeView === 'support'
      ? this.filteredTickets.length
      : this.filteredArticles.length;
  }

  get activeTotalPages(): number {
    return this.totalPagesForCount(this.activeTotalCount);
  }

  get activeCurrentPage(): number {
    return this.getClampedPage(this.activeView, this.activeTotalCount);
  }

  get ticketTotalPages(): number {
    return this.totalPagesForCount(this.filteredTickets.length);
  }

  get referenceTotalPages(): number {
    return this.totalPagesForCount(this.filteredArticles.length);
  }

  get hasActiveFilters(): boolean {
    if (this.activeView === 'support') {
      return !!this.supportFilters.search.trim()
        || this.supportFilters.status !== 'all'
        || this.supportFilters.priority !== 'all'
        || this.supportFilters.category !== 'all';
    }

    return !!this.referenceFilters.search.trim()
      || this.referenceFilters.category !== 'all'
      || this.referenceFilters.type !== 'all';
  }

  get canSubmitTicket(): boolean {
    return !!this.ticketDraft.subject.trim() && !!this.ticketDraft.message.trim();
  }

  setActiveView(viewId: string): void {
    this.activeView = viewId as SupportCenterView;
  }

  resetFilters(): void {
    this.supportFilters.search = '';
    this.supportFilters.status = 'all';
    this.supportFilters.priority = 'all';
    this.supportFilters.category = 'all';

    this.referenceFilters.search = '';
    this.referenceFilters.category = 'all';
    this.referenceFilters.type = 'all';

    this.currentPages.support = 1;
    this.currentPages.reference = 1;
  }

  onPageChange(page: number): void {
    this.currentPages[this.activeView] = page;
  }

  openCreateTicket(category?: SupportCategory): void {
    this.ticketDraft.subject = '';
    this.ticketDraft.priority = 'medium';
    this.ticketDraft.category = category || 'general';
    this.ticketDraft.message = '';
    this.isCreateTicketModalOpen = true;
  }

  closeCreateTicketModal(): void {
    this.isCreateTicketModalOpen = false;
  }

  submitCreateTicket(): void {
    if (!this.canSubmitTicket) {
      return;
    }

    const input: CreateSupportTicketInput = {
      subject: this.createLocalizedDraft(this.ticketDraft.subject),
      category: this.ticketDraft.category,
      priority: this.ticketDraft.priority,
      summary: this.createLocalizedDraft(this.ticketDraft.message),
      initialMessage: this.createLocalizedDraft(this.ticketDraft.message),
      authorName: this.vendorDisplayName
    };

    const ticket = this.supportCenterService.createTicket(input);
    this.isCreateTicketModalOpen = false;
    this.activeView = 'support';
    this.showFlash('SUPPORT_CENTER.FEEDBACK.TICKET_CREATED', 'success');
  }

  resetDemoState(): void {
    this.supportCenterService.resetSeedState();
    this.resetFilters();
    this.activeView = 'support';
    this.showFlash('SUPPORT_CENTER.FEEDBACK.SEED_RESET', 'info');
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

  statusKey(status: SupportTicketStatus): string {
    return `SUPPORT_CENTER.STATUSES.${status.toUpperCase()}`;
  }

  priorityKey(priority: SupportPriority): string {
    return `SUPPORT_CENTER.PRIORITIES.${priority.toUpperCase()}`;
  }

  articleTypeKey(type: SupportArticleType): string {
    return `SUPPORT_CENTER.ARTICLE_TYPES.${type.toUpperCase()}`;
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

  trackByTicketId(_index: number, ticket: VendorSupportTicketVm): string {
    return ticket.id;
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

  private createLocalizedDraft(text: string): LocalizedTextVm {
    const normalized = text.trim();
    return {
      ar: normalized,
      en: normalized
    };
  }

  private createEmptyTicketDraft(): CreateTicketDraft {
    return {
      subject: '',
      category: 'general',
      priority: 'medium',
      message: ''
    };
  }

  private isSupportCategory(value: string | null): value is SupportCategory {
    return !!value && this.categoryOptions.includes(value as SupportCategory);
  }

  private totalPagesForCount(count: number): number {
    return Math.max(1, Math.ceil(count / this.pageSize));
  }

  private getClampedPage(view: SupportCenterView, count: number): number {
    return Math.min(this.currentPages[view], this.totalPagesForCount(count));
  }

  private paginateItems<T>(items: T[], view: SupportCenterView): T[] {
    const currentPage = this.getClampedPage(view, items.length);
    const startIndex = (currentPage - 1) * this.pageSize;
    return items.slice(startIndex, startIndex + this.pageSize);
  }

  private showFlash(key: string, tone: 'success' | 'info'): void {
    this.flashMessage = this.translate.instant(key);
    this.flashTone = tone;

    setTimeout(() => {
      if (this.flashMessage === this.translate.instant(key)) {
        this.flashMessage = '';
      }
    }, 2800);
  }

  private syncFilterSignature(view: SupportCenterView, filters: unknown): void {
    const nextSignature = JSON.stringify(filters);
    if (this.lastFilterSignatures[view] === nextSignature) {
      return;
    }

    this.lastFilterSignatures[view] = nextSignature;
    this.currentPages[view] = 1;
  }
}
