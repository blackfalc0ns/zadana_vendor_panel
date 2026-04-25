import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CustomerReviewVm,
  ReviewAttentionState,
  ReviewSummaryVm,
  cloneReview,
  cloneReviews
} from '../models/reviews.models';

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private readonly baseUrl = `${environment.apiUrl}/vendor/reviews`;
  private readonly reviewsSubject = new BehaviorSubject<CustomerReviewVm[]>([]);

  constructor(private readonly http: HttpClient) {
    this.refresh().subscribe();
  }

  getReviews(): Observable<CustomerReviewVm[]> {
    return this.reviewsSubject.pipe(map((reviews) => cloneReviews(reviews)));
  }

  getSummary(): Observable<ReviewSummaryVm> {
    return this.reviewsSubject.pipe(map((reviews) => this.buildSummary(reviews)));
  }

  refresh(): Observable<CustomerReviewVm[]> {
    return this.http.get<CustomerReviewVm[]>(this.baseUrl).pipe(
      map((reviews) => {
        const normalized = reviews.map((review) => this.normalizeReview(review));
        this.reviewsSubject.next(normalized);
        return cloneReviews(normalized);
      })
    );
  }

  replyToReview(reviewId: string, message: string): void {
    this.saveReply(reviewId, message);
  }

  updateReply(reviewId: string, message: string): void {
    this.saveReply(reviewId, message);
  }

  toggleVisibility(reviewId: string): void {
    this.setReviews((reviews) => reviews.map((review) => {
      if (review.id !== reviewId) {
        return review;
      }

      return {
        ...review,
        visibility: review.visibility === 'hidden' ? 'published' : 'hidden'
      };
    }));
  }

  resetSeedState(): void {
    this.refresh().subscribe();
  }

  private saveReply(reviewId: string, message: string): void {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      return;
    }

    this.http.post<{ message: string; createdAt: string; updatedAt?: string }>(
      `${this.baseUrl}/${reviewId}/reply`,
      { message: normalizedMessage }
    ).subscribe((reply) => {
      this.setReviews((reviews) => reviews.map((review) => {
        if (review.id !== reviewId) {
          return review;
        }

        return {
          ...review,
          replyStatus: 'replied',
          attentionState: this.resolveAttentionState(review.rating, 'replied'),
          vendorReply: reply
        };
      }));
    });
  }

  private normalizeReview(review: CustomerReviewVm): CustomerReviewVm {
    const replyStatus = review.vendorReply ? 'replied' : review.replyStatus || 'none';

    return {
      ...cloneReview(review),
      customerMaskedName: review.customerMaskedName || this.maskCustomerName(review.customerName),
      visibility: review.visibility || 'published',
      replyStatus,
      attentionState: this.resolveAttentionState(review.rating, replyStatus)
    };
  }

  private buildSummary(reviews: CustomerReviewVm[]): ReviewSummaryVm {
    const totalReviews = reviews.length;
    const ratingTotal = reviews.reduce((sum, review) => sum + review.rating, 0);

    return {
      averageRating: totalReviews ? Number((ratingTotal / totalReviews).toFixed(1)) : 0,
      totalReviews,
      pendingReplyCount: reviews.filter((review) => review.replyStatus === 'none').length,
      hiddenCount: reviews.filter((review) => review.visibility === 'hidden').length,
      lowRatingCount: reviews.filter((review) => review.rating <= 2).length
    };
  }

  private resolveAttentionState(rating: number, replyStatus: CustomerReviewVm['replyStatus']): ReviewAttentionState {
    return rating <= 2 && replyStatus === 'none' ? 'needs_attention' : 'normal';
  }

  private setReviews(projector: (reviews: CustomerReviewVm[]) => CustomerReviewVm[]): void {
    const nextReviews = projector(this.reviewsSubject.value).map((review) => this.normalizeReview(review));
    this.reviewsSubject.next(nextReviews);
  }

  private maskCustomerName(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => {
        if (part.length <= 2) {
          return `${part[0] || ''}*`;
        }

        return `${part.slice(0, 2)}${'*'.repeat(Math.max(1, part.length - 2))}`;
      })
      .join(' ');
  }
}
