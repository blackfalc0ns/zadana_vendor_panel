export interface CouponOffer {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  usageCount: number;
  usageLimit: number;
  endsAt: string;
  isActive: boolean;
  audienceAr: string;
  audienceEn: string;
  noteAr: string;
  noteEn: string;
}

export interface CreateCouponOfferPayload {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  usageLimit: number;
  endsAt: string;
  isActive: boolean;
  audienceAr: string;
  audienceEn: string;
  noteAr: string;
  noteEn: string;
}

export interface CategoryCampaign {
  id: string;
  categoryId: string;
  categoryNameAr: string;
  categoryNameEn: string;
  discountPercentage: number;
  productsIncluded: number;
  endsAt: string;
  headlineAr: string;
  headlineEn: string;
  noteAr: string;
  noteEn: string;
}

export interface CategoryCampaignCreateOption {
  categoryId: string;
  categoryNameAr: string;
  categoryNameEn: string;
  productsIncluded: number;
}

export interface CreateCategoryCampaignPayload {
  categoryId: string;
  categoryNameAr: string;
  categoryNameEn: string;
  discountPercentage: number;
  productsIncluded: number;
  endsAt: string;
  headlineAr: string;
  headlineEn: string;
  noteAr: string;
  noteEn: string;
}

export interface ClearanceOffer {
  id?: string;
  productId: string;
  nameAr: string;
  nameEn: string;
  imageUrl?: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  sellingPrice: number;
  compareAtPrice?: number | null;
  discountPercentage: number;
  stockQty: number;
  savingsValue: number;
  urgency: 'critical' | 'warning';
}

export interface CreateClearanceOfferPayload {
  productId: string;
  nameAr: string;
  nameEn: string;
  imageUrl?: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  sellingPrice: number;
  compareAtPrice: number;
  discountPercentage: number;
  stockQty: number;
  savingsValue: number;
  urgency: 'critical' | 'warning';
}
