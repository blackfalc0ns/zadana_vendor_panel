export type OffersView = 'direct' | 'coupons' | 'categories' | 'clearance';

export interface DirectOfferFilters {
  category: string;
  discountBand: 'all' | string;
  stockBand: 'all' | 'low' | 'healthy';
}

export interface CouponOfferFilters {
  status: 'all' | 'active' | 'inactive';
  type: 'all' | 'percentage' | 'fixed';
  expiry: 'all' | 'soon' | 'later';
}

export interface CategoryCampaignFilters {
  category: string;
  discountBand: 'all' | string;
  expiry: 'all' | 'soon' | 'later';
}

export interface ClearanceOfferFilters {
  urgency: 'all' | 'critical' | 'warning';
  stockLimit: 'all' | string;
  category: string;
}

export interface OfferCategoryOption {
  value: string;
  label: string;
}
