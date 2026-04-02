import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
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
  private readonly storageKey = 'vendor_reviews_workspace';
  private readonly reviewsSubject = new BehaviorSubject<CustomerReviewVm[]>(this.loadReviews());

  getReviews(): Observable<CustomerReviewVm[]> {
    return this.reviewsSubject.pipe(map((reviews) => cloneReviews(reviews)));
  }

  getSummary(): Observable<ReviewSummaryVm> {
    return this.reviewsSubject.pipe(map((reviews) => this.buildSummary(reviews)));
  }

  replyToReview(reviewId: string, message: string): void {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return;
    }

    const timestamp = new Date().toISOString();
    this.setReviews((reviews) => reviews.map((review) => {
      if (review.id !== reviewId) {
        return review;
      }

      const updatedReview: CustomerReviewVm = {
        ...review,
        replyStatus: 'replied',
        attentionState: this.resolveAttentionState(review.rating, 'replied'),
        vendorReply: {
          message: normalizedMessage,
          createdAt: timestamp
        }
      };

      return updatedReview;
    }));
  }

  updateReply(reviewId: string, message: string): void {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return;
    }

    const timestamp = new Date().toISOString();
    this.setReviews((reviews) => reviews.map((review) => {
      if (review.id !== reviewId) {
        return review;
      }

      const updatedReview: CustomerReviewVm = {
        ...review,
        replyStatus: 'replied',
        attentionState: this.resolveAttentionState(review.rating, 'replied'),
        vendorReply: {
          message: normalizedMessage,
          createdAt: review.vendorReply?.createdAt || timestamp,
          updatedAt: timestamp
        }
      };

      return updatedReview;
    }));
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
    localStorage.removeItem(this.storageKey);
    this.reviewsSubject.next(this.buildSeedReviews());
  }

  private loadReviews(): CustomerReviewVm[] {
    const stored = localStorage.getItem(this.storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CustomerReviewVm[];
        return parsed.map((review) => this.normalizeReview(review));
      } catch {
        return this.buildSeedReviews();
      }
    }

    return this.buildSeedReviews();
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

  private buildSeedReviews(): CustomerReviewVm[] {
    const reviews: CustomerReviewVm[] = [
      {
        id: 'review-product-1',
        type: 'product',
        customerName: 'Ahmed Ali',
        customerMaskedName: this.maskCustomerName('Ahmed Ali'),
        rating: 5,
        title: 'Fresh batch and solid consistency',
        comment: 'The tomato batch arrived fresh, clean, and exactly as described. I would reorder this product again for the next supply cycle.',
        createdAt: '2026-03-31T09:20:00.000Z',
        visibility: 'published',
        replyStatus: 'none',
        attentionState: 'normal',
        isVerifiedPurchase: true,
        productId: 'v1',
        productName: 'Premium Fresh Tomato'
      },
      {
        id: 'review-order-1',
        type: 'order',
        customerName: 'Sara Mohamed',
        customerMaskedName: this.maskCustomerName('Sara Mohamed'),
        rating: 1,
        title: 'Late order and weak packaging',
        comment: 'The order arrived much later than expected and two items were packed poorly. The delivery experience needs follow-up.',
        createdAt: '2026-04-01T18:10:00.000Z',
        visibility: 'published',
        replyStatus: 'none',
        attentionState: 'needs_attention',
        isVerifiedPurchase: true,
        orderId: 'ord_7',
        orderDisplayId: '1007',
        deliveryRating: 1,
        packagingRating: 2,
        accuracyRating: 2
      },
      {
        id: 'review-product-2',
        type: 'product',
        customerName: 'Nour Hassan',
        customerMaskedName: this.maskCustomerName('Nour Hassan'),
        rating: 4,
        title: 'Good quality with one minor issue',
        comment: 'The oil quality was good overall, but one bottle arrived with a slightly damaged label. Product quality itself was acceptable.',
        createdAt: '2026-03-28T12:15:00.000Z',
        visibility: 'published',
        replyStatus: 'replied',
        attentionState: 'normal',
        isVerifiedPurchase: true,
        productId: 'v2',
        productName: 'Afia Sunflower Oil (1.5L)',
        vendorReply: {
          message: 'Thanks for the detailed note. We already shared the packaging feedback with the branch team and we appreciate your review.',
          createdAt: '2026-03-28T15:00:00.000Z'
        }
      },
      {
        id: 'review-product-3',
        type: 'product',
        customerName: 'Khaled Mourad',
        customerMaskedName: this.maskCustomerName('Khaled Mourad'),
        rating: 2,
        title: 'Stock was low and pack looked old',
        comment: 'The rice pack was still usable, but the outer packaging looked old and the shelf presentation did not feel premium.',
        createdAt: '2026-03-25T10:00:00.000Z',
        visibility: 'hidden',
        replyStatus: 'none',
        attentionState: 'needs_attention',
        isVerifiedPurchase: true,
        productId: 'v3',
        productName: 'Indian Basmati Rice (5KG)'
      },
      {
        id: 'review-order-2',
        type: 'order',
        customerName: 'Laila Ibrahim',
        customerMaskedName: this.maskCustomerName('Laila Ibrahim'),
        rating: 3,
        title: 'Accurate order with delivery friction',
        comment: 'The order itself was accurate, but the driver needed an extra confirmation call before arrival. Overall acceptable but not smooth.',
        createdAt: '2026-03-29T16:35:00.000Z',
        visibility: 'published',
        replyStatus: 'none',
        attentionState: 'normal',
        isVerifiedPurchase: true,
        orderId: 'ord_12',
        orderDisplayId: '1012',
        deliveryRating: 2,
        packagingRating: 4,
        accuracyRating: 5,
        media: [
          'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=320&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=320&auto=format&fit=crop'
        ]
      },
      {
        id: 'review-order-3',
        type: 'order',
        customerName: 'Yassin Mahmoud',
        customerMaskedName: this.maskCustomerName('Yassin Mahmoud'),
        rating: 2,
        title: 'Delivery improved after follow-up',
        comment: 'The first delivery attempt was delayed, but support followed up and the second handoff was much better than expected.',
        createdAt: '2026-03-22T13:05:00.000Z',
        visibility: 'published',
        replyStatus: 'replied',
        attentionState: 'normal',
        isVerifiedPurchase: true,
        orderId: 'ord_14',
        orderDisplayId: '1014',
        deliveryRating: 2,
        packagingRating: 3,
        accuracyRating: 4,
        vendorReply: {
          message: 'We appreciate your patience. The branch supervisor reviewed the delay and we have tightened the dispatch handoff for similar orders.',
          createdAt: '2026-03-22T17:30:00.000Z',
          updatedAt: '2026-03-23T09:10:00.000Z'
        }
      }
    ];

    this.persistReviews(reviews);
    return reviews;
  }

  private resolveAttentionState(rating: number, replyStatus: CustomerReviewVm['replyStatus']): ReviewAttentionState {
    return rating <= 2 && replyStatus === 'none' ? 'needs_attention' : 'normal';
  }

  private setReviews(projector: (reviews: CustomerReviewVm[]) => CustomerReviewVm[]): void {
    const nextReviews = projector(this.reviewsSubject.value).map((review) => this.normalizeReview(review));
    this.persistReviews(nextReviews);
    this.reviewsSubject.next(nextReviews);
  }

  private persistReviews(reviews: CustomerReviewVm[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(reviews));
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
