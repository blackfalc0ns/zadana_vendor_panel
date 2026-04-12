import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Category, VendorProduct } from '../../products/models/catalog.models';
import { persistWorkspaceState, readWorkspaceState } from '../../../shared/utils/workspace-storage.util';
import {
  CategoryCampaign,
  ClearanceOffer,
  CouponOffer,
  CreateCategoryCampaignPayload,
  CreateClearanceOfferPayload,
  CreateCouponOfferPayload
} from '../models/offers.models';

interface OffersWorkspaceState {
  coupons: CouponOffer[];
  categoryCampaigns: CategoryCampaign[];
  clearanceOffers: ClearanceOffer[];
}

@Injectable({
  providedIn: 'root'
})
export class OffersService {
  private readonly storageKey = 'vendor_offers_workspace';
  private readonly couponsSubject: BehaviorSubject<CouponOffer[]>;
  private readonly categoryCampaignsSubject: BehaviorSubject<CategoryCampaign[]>;
  private readonly clearanceOffersSubject: BehaviorSubject<ClearanceOffer[]>;

  constructor() {
    const workspace = readWorkspaceState<OffersWorkspaceState | null>(this.storageKey, null);

    this.couponsSubject = new BehaviorSubject<CouponOffer[]>(
      workspace?.coupons?.length ? workspace.coupons : this.buildSeedCoupons()
    );
    this.categoryCampaignsSubject = new BehaviorSubject<CategoryCampaign[]>(
      workspace?.categoryCampaigns ?? []
    );
    this.clearanceOffersSubject = new BehaviorSubject<ClearanceOffer[]>(
      workspace?.clearanceOffers ?? []
    );
  }

  getCouponOffers(): Observable<CouponOffer[]> {
    return this.couponsSubject.asObservable();
  }

  getCategoryCampaigns(): Observable<CategoryCampaign[]> {
    return this.categoryCampaignsSubject.asObservable();
  }

  getClearanceOffers(): Observable<ClearanceOffer[]> {
    return this.clearanceOffersSubject.asObservable();
  }

  initializeDerivedCollections(categories: Category[], products: VendorProduct[]): void {
    let didChange = false;

    if (!this.categoryCampaignsSubject.value.length) {
      this.categoryCampaignsSubject.next(this.buildCategoryCampaigns(categories, products));
      didChange = true;
    }

    if (!this.clearanceOffersSubject.value.length) {
      this.clearanceOffersSubject.next(this.buildClearanceOffers(products));
      didChange = true;
    }

    if (didChange) {
      this.persistWorkspace();
    }
  }

  createCouponOffer(payload: CreateCouponOfferPayload): void {
    const nextCoupon: CouponOffer = {
      id: `coupon-${Date.now()}`,
      usageCount: 0,
      ...payload
    };

    this.couponsSubject.next([nextCoupon, ...this.couponsSubject.value]);
    this.persistWorkspace();
  }

  createCategoryCampaign(payload: CreateCategoryCampaignPayload): void {
    const nextCampaign: CategoryCampaign = {
      id: `campaign-${payload.categoryId}-${Date.now()}`,
      ...payload
    };

    this.categoryCampaignsSubject.next([nextCampaign, ...this.categoryCampaignsSubject.value]);
    this.persistWorkspace();
  }

  createClearanceOffer(payload: CreateClearanceOfferPayload): void {
    const nextOffer: ClearanceOffer = {
      id: `clearance-${payload.productId}`,
      ...payload
    };

    const filtered = this.clearanceOffersSubject.value.filter((item) => item.productId !== payload.productId);
    this.clearanceOffersSubject.next([nextOffer, ...filtered]);
    this.persistWorkspace();
  }

  buildCategoryCampaigns(categories: Category[], products: VendorProduct[]): CategoryCampaign[] {
    return categories
      .filter((category) => products.some((product) => product.categoryId === category.id))
      .slice(0, 3)
      .map((category, index) => {
        const productsIncluded = products.filter(
          (product) => product.categoryId === category.id
        ).length;

        const campaignConfigs = [
          {
            discountPercentage: 12,
            headlineAr: 'دفع مبيعات القسم الأكثر طلبًا',
            headlineEn: 'Push the most in-demand category',
            noteAr: 'مناسب لرفع معدل الشراء المتكرر في القسم.',
            noteEn: 'Useful for increasing repeat purchases in this category.'
          },
          {
            discountPercentage: 18,
            headlineAr: 'عرض أسبوعي لجذب الطلبات الكبيرة',
            headlineEn: 'Weekly offer to attract larger baskets',
            noteAr: 'جرعة خصم أعلى للأقسام التي تتحمل المنافسة السعرية.',
            noteEn: 'A stronger discount for categories that can absorb price competition.'
          },
          {
            discountPercentage: 9,
            headlineAr: 'حملة خفيفة للحفاظ على الهامش',
            headlineEn: 'Light campaign to protect margin',
            noteAr: 'مناسبة للأقسام ذات الهامش الحساس.',
            noteEn: 'Good for margin-sensitive categories.'
          }
        ];

        const config = campaignConfigs[index % campaignConfigs.length];

        return {
          id: `campaign-${category.id}`,
          categoryId: category.id,
          categoryNameAr: category.nameAr,
          categoryNameEn: category.nameEn,
          discountPercentage: config.discountPercentage,
          productsIncluded,
          endsAt: `2026-04-${18 + index}`,
          headlineAr: config.headlineAr,
          headlineEn: config.headlineEn,
          noteAr: config.noteAr,
          noteEn: config.noteEn
        };
      });
  }

  buildClearanceOffers(products: VendorProduct[]): ClearanceOffer[] {
    return products
      .filter((product) => product.stockQty > 0 && product.stockQty <= 12)
      .sort((first, second) => first.stockQty - second.stockQty)
      .slice(0, 6)
      .map((product) => {
        const compareAtPrice = product.compareAtPrice ?? this.getRecommendedCompareAtPrice(product);
        return {
          id: `clearance-${product.id}`,
          productId: product.id,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          imageUrl: product.imageUrl,
          categoryNameAr: product.categoryNameAr,
          categoryNameEn: product.categoryNameEn,
          sellingPrice: product.sellingPrice,
          compareAtPrice,
          discountPercentage: product.discountPercentage || this.getRecommendedDiscount(product.stockQty),
          stockQty: product.stockQty,
          savingsValue: Number(Math.max(compareAtPrice - product.sellingPrice, 0).toFixed(2)),
          urgency: product.stockQty <= 5 ? 'critical' : 'warning'
        };
      });
  }

  private buildSeedCoupons(): CouponOffer[] {
    return [
      {
        id: 'coupon-ramadan',
        code: 'RAMADAN15',
        type: 'percentage',
        value: 15,
        minOrder: 250,
        usageCount: 84,
        usageLimit: 200,
        endsAt: '2026-04-20',
        isActive: true,
        audienceAr: 'كل العملاء',
        audienceEn: 'All customers',
        noteAr: 'كوبون موسمي لرفع التحويلات في الطلبات المتوسطة.',
        noteEn: 'Seasonal coupon to lift conversion on medium baskets.'
      },
      {
        id: 'coupon-bulk',
        code: 'BULK40',
        type: 'fixed',
        value: 40,
        minOrder: 600,
        usageCount: 29,
        usageLimit: 80,
        endsAt: '2026-04-15',
        isActive: true,
        audienceAr: 'عملاء الجملة',
        audienceEn: 'Bulk buyers',
        noteAr: 'خصم ثابت مناسب للطلبات الكبيرة وقيم السلة المرتفعة.',
        noteEn: 'Fixed discount suitable for large baskets and bulk buyers.'
      },
      {
        id: 'coupon-new',
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minOrder: 150,
        usageCount: 112,
        usageLimit: 150,
        endsAt: '2026-04-30',
        isActive: true,
        audienceAr: 'العملاء الجدد',
        audienceEn: 'New customers',
        noteAr: 'مخصص لاكتساب عملاء جدد لأول طلب فقط.',
        noteEn: 'Designed for first-order acquisition.'
      }
    ];
  }

  private getRecommendedDiscount(stockQty: number): number {
    if (stockQty <= 3) {
      return 25;
    }

    if (stockQty <= 6) {
      return 18;
    }

    return 12;
  }

  private getRecommendedCompareAtPrice(product: VendorProduct): number {
    const discount = this.getRecommendedDiscount(product.stockQty);
    const compareAtPrice = product.sellingPrice / (1 - discount / 100);
    return Number(compareAtPrice.toFixed(2));
  }

  private persistWorkspace(): void {
    persistWorkspaceState<OffersWorkspaceState>(this.storageKey, {
      coupons: this.couponsSubject.value,
      categoryCampaigns: this.categoryCampaignsSubject.value,
      clearanceOffers: this.clearanceOffersSubject.value
    });
  }
}
