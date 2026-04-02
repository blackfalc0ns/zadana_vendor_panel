import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, combineLatest } from 'rxjs';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
  DetailTabNavItem,
  DetailTabsNavComponent
} from '../../../../shared/components/ui/navigation/detail-tabs-nav/detail-tabs-nav.component';
import {
  CustomerReviewVm,
  ReviewFiltersVm,
  ReviewQuickView,
  ReviewReplyStatus,
  ReviewSortBy,
  ReviewSummaryVm,
  ReviewType,
  ReviewVisibility
} from '../../models/reviews.models';
import { ReviewsService } from '../../services/reviews.service';

@Component({
  selector: 'app-reviews-center-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    AppPanelHeaderComponent,
    DetailTabsNavComponent
  ],
  templateUrl: './reviews-center.page.html'
})
export class ReviewsCenterPageComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  isFiltersExpanded = true;
  activeQuickView: ReviewQuickView = 'all';
  selectedReviewId: string | null = null;
  replyDraft = '';
  flashMessage = '';
  flashTone: 'success' | 'info' = 'success';

  reviews: CustomerReviewVm[] = [];
  summary: ReviewSummaryVm = {
    averageRating: 0,
    totalReviews: 0,
    pendingReplyCount: 0,
    hiddenCount: 0,
    lowRatingCount: 0
  };

  readonly filters: ReviewFiltersVm = {
    search: '',
    type: 'all',
    rating: 'all',
    visibility: 'all',
    replyStatus: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'newest'
  };

  readonly stars = [1, 2, 3, 4, 5];

  private langSub: Subscription;
  private dataSub?: Subscription;

  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      if (this.flashMessage) {
        this.flashMessage = '';
      }
    });
  }

  ngOnInit(): void {
    this.dataSub = combineLatest([
      this.reviewsService.getReviews(),
      this.reviewsService.getSummary()
    ]).subscribe(([reviews, summary]) => {
      this.reviews = reviews;
      this.summary = summary;

      if (this.selectedReviewId && !reviews.some((review) => review.id === this.selectedReviewId)) {
        this.closeDrawer();
      }
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  get quickTabs(): DetailTabNavItem[] {
    return [
      {
        id: 'all',
        labelKey: 'REVIEWS.QUICK_TABS.ALL',
        count: this.reviews.length
      },
      {
        id: 'needs_reply',
        labelKey: 'REVIEWS.QUICK_TABS.NEEDS_REPLY',
        count: this.reviews.filter((review) => review.replyStatus === 'none').length,
        attention: this.reviews.some((review) => review.replyStatus === 'none')
      },
      {
        id: 'low_rating',
        labelKey: 'REVIEWS.QUICK_TABS.LOW_RATING',
        count: this.reviews.filter((review) => review.rating <= 2).length
      },
      {
        id: 'hidden',
        labelKey: 'REVIEWS.QUICK_TABS.HIDDEN',
        count: this.reviews.filter((review) => review.visibility === 'hidden').length
      }
    ];
  }

  get filteredReviews(): CustomerReviewVm[] {
    let items = [...this.reviews];

    items = items.filter((review) => this.matchesQuickView(review));
    items = items.filter((review) => this.matchesFilters(review));
    items = this.sortReviews(items, this.filters.sortBy);

    return items;
  }

  get selectedReview(): CustomerReviewVm | null {
    return this.reviews.find((review) => review.id === this.selectedReviewId) || null;
  }

  get hasActiveFilters(): boolean {
    return !!this.filters.search.trim()
      || this.filters.type !== 'all'
      || this.filters.rating !== 'all'
      || this.filters.visibility !== 'all'
      || this.filters.replyStatus !== 'all'
      || !!this.filters.dateFrom
      || !!this.filters.dateTo
      || this.filters.sortBy !== 'newest';
  }

  setActiveQuickView(viewId: string): void {
    this.activeQuickView = viewId as ReviewQuickView;
  }

  resetFilters(): void {
    this.filters.search = '';
    this.filters.type = 'all';
    this.filters.rating = 'all';
    this.filters.visibility = 'all';
    this.filters.replyStatus = 'all';
    this.filters.dateFrom = '';
    this.filters.dateTo = '';
    this.filters.sortBy = 'newest';
  }

  openReview(review: CustomerReviewVm): void {
    this.selectedReviewId = review.id;
    this.replyDraft = review.vendorReply?.message || '';
  }

  openReply(review: CustomerReviewVm): void {
    this.openReview(review);
  }

  closeDrawer(): void {
    this.selectedReviewId = null;
    this.replyDraft = '';
  }

  submitReply(): void {
    const review = this.selectedReview;
    const message = this.replyDraft.trim();

    if (!review || !message) {
      return;
    }

    if (review.vendorReply) {
      this.reviewsService.updateReply(review.id, message);
      this.showFlash('REVIEWS.FEEDBACK.REPLY_UPDATED', 'success');
    } else {
      this.reviewsService.replyToReview(review.id, message);
      this.showFlash('REVIEWS.FEEDBACK.REPLY_SENT', 'success');
    }
  }

  toggleReviewVisibility(review: CustomerReviewVm): void {
    this.reviewsService.toggleVisibility(review.id);
    this.showFlash(
      review.visibility === 'hidden'
        ? 'REVIEWS.FEEDBACK.REVIEW_PUBLISHED'
        : 'REVIEWS.FEEDBACK.REVIEW_HIDDEN',
      'info'
    );
  }

  resetDemoState(): void {
    this.reviewsService.resetSeedState();
    this.closeDrawer();
    this.activeQuickView = 'all';
    this.resetFilters();
    this.showFlash('REVIEWS.FEEDBACK.SEED_RESET', 'info');
  }

  reviewTypeKey(type: ReviewType): string {
    return type === 'product'
      ? 'REVIEWS.TYPES.PRODUCT'
      : 'REVIEWS.TYPES.ORDER';
  }

  visibilityKey(visibility: ReviewVisibility): string {
    return visibility === 'hidden'
      ? 'REVIEWS.VISIBILITY.HIDDEN'
      : 'REVIEWS.VISIBILITY.PUBLISHED';
  }

  replyStatusKey(status: ReviewReplyStatus): string {
    return status === 'replied'
      ? 'REVIEWS.REPLY_STATUS.REPLIED'
      : 'REVIEWS.REPLY_STATUS.NONE';
  }

  visibilityBadgeClass(visibility: ReviewVisibility): string {
    return visibility === 'hidden'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  replyBadgeClass(status: ReviewReplyStatus): string {
    return status === 'replied'
      ? 'border-sky-200 bg-sky-50 text-sky-700'
      : 'border-slate-200 bg-slate-100 text-slate-600';
  }

  ratingToneClass(rating: number): string {
    if (rating >= 4) {
      return 'text-emerald-500';
    }

    if (rating === 3) {
      return 'text-amber-500';
    }

    return 'text-rose-500';
  }

  referenceRouterLink(review: CustomerReviewVm): string[] | null {
    if (review.type === 'product' && review.productId) {
      return ['/products', review.productId];
    }

    if (review.type === 'order' && review.orderId) {
      return ['/orders', review.orderId];
    }

    return null;
  }

  referenceLabel(review: CustomerReviewVm): string {
    if (review.type === 'product') {
      return review.productName || '-';
    }

    return review.orderDisplayId ? `#${review.orderDisplayId}` : '-';
  }

  formatDate(dateText: string): string {
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateText));
  }

  formatDateTime(dateText?: string): string {
    if (!dateText) {
      return '-';
    }

    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(dateText));
  }

  averageLabel(value: number): string {
    return value.toFixed(1);
  }

  roundedAverageRating(): number {
    return Math.round(this.summary.averageRating);
  }

  commentSnippet(comment: string): string {
    if (comment.length <= 110) {
      return comment;
    }

    return `${comment.slice(0, 110).trim()}...`;
  }

  trackByReviewId(_index: number, review: CustomerReviewVm): string {
    return review.id;
  }

  private matchesQuickView(review: CustomerReviewVm): boolean {
    switch (this.activeQuickView) {
      case 'needs_reply':
        return review.replyStatus === 'none';
      case 'low_rating':
        return review.rating <= 2;
      case 'hidden':
        return review.visibility === 'hidden';
      default:
        return true;
    }
  }

  private matchesFilters(review: CustomerReviewVm): boolean {
    const normalizedSearch = this.filters.search.trim().toLowerCase();

    if (normalizedSearch) {
      const searchableParts = [
        review.customerName,
        review.customerMaskedName,
        review.productName,
        review.orderDisplayId,
        review.title,
        review.comment
      ];

      const matchesSearch = searchableParts.some((part) => (part || '').toLowerCase().includes(normalizedSearch));

      if (!matchesSearch) {
        return false;
      }
    }

    if (this.filters.type !== 'all' && review.type !== this.filters.type) {
      return false;
    }

    if (this.filters.rating !== 'all' && review.rating !== this.filters.rating) {
      return false;
    }

    if (this.filters.visibility !== 'all' && review.visibility !== this.filters.visibility) {
      return false;
    }

    if (this.filters.replyStatus !== 'all' && review.replyStatus !== this.filters.replyStatus) {
      return false;
    }

    if (this.filters.dateFrom) {
      const reviewTime = new Date(review.createdAt).getTime();
      const startTime = new Date(`${this.filters.dateFrom}T00:00:00`).getTime();
      if (reviewTime < startTime) {
        return false;
      }
    }

    if (this.filters.dateTo) {
      const reviewTime = new Date(review.createdAt).getTime();
      const endTime = new Date(`${this.filters.dateTo}T23:59:59`).getTime();
      if (reviewTime > endTime) {
        return false;
      }
    }

    return true;
  }

  private sortReviews(reviews: CustomerReviewVm[], sortBy: ReviewSortBy): CustomerReviewVm[] {
    return [...reviews].sort((first, second) => {
      if (sortBy === 'rating_low' && first.rating !== second.rating) {
        return first.rating - second.rating;
      }

      if (sortBy === 'rating_high' && first.rating !== second.rating) {
        return second.rating - first.rating;
      }

      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    });
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
}
