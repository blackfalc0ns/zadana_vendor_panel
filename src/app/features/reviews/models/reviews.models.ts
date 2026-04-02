export type ReviewType = 'product' | 'order';
export type ReviewVisibility = 'published' | 'hidden';
export type ReviewReplyStatus = 'none' | 'replied';
export type ReviewAttentionState = 'normal' | 'needs_attention';
export type ReviewSortBy = 'newest' | 'rating_low' | 'rating_high';
export type ReviewQuickView = 'all' | 'needs_reply' | 'low_rating' | 'hidden';

export interface VendorReplyVm {
  message: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerReviewVm {
  id: string;
  type: ReviewType;
  customerName: string;
  customerMaskedName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  visibility: ReviewVisibility;
  replyStatus: ReviewReplyStatus;
  attentionState: ReviewAttentionState;
  isVerifiedPurchase: boolean;
  productId?: string;
  productName?: string;
  orderId?: string;
  orderDisplayId?: string;
  deliveryRating?: number;
  packagingRating?: number;
  accuracyRating?: number;
  vendorReply?: VendorReplyVm;
  media?: string[];
}

export interface ReviewSummaryVm {
  averageRating: number;
  totalReviews: number;
  pendingReplyCount: number;
  hiddenCount: number;
  lowRatingCount: number;
}

export interface ReviewFiltersVm {
  search: string;
  type: 'all' | ReviewType;
  rating: 'all' | 1 | 2 | 3 | 4 | 5;
  visibility: 'all' | ReviewVisibility;
  replyStatus: 'all' | ReviewReplyStatus;
  dateFrom: string;
  dateTo: string;
  sortBy: ReviewSortBy;
}

export function cloneReview(review: CustomerReviewVm): CustomerReviewVm {
  return {
    ...review,
    vendorReply: review.vendorReply ? { ...review.vendorReply } : undefined,
    media: review.media ? [...review.media] : undefined
  };
}

export function cloneReviews(reviews: CustomerReviewVm[]): CustomerReviewVm[] {
  return reviews.map((review) => cloneReview(review));
}
