import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Category, VendorProduct } from '../../products/models/catalog.models';
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
  private readonly stateUrl = `${environment.apiUrl}/vendor/workspace-state/offers`;
  private readonly couponsSubject = new BehaviorSubject<CouponOffer[]>([]);
  private readonly categoryCampaignsSubject = new BehaviorSubject<CategoryCampaign[]>([]);
  private readonly clearanceOffersSubject = new BehaviorSubject<ClearanceOffer[]>([]);

  constructor(private readonly http: HttpClient) {
    this.loadWorkspace();
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
        const productsIncluded = products.filter((product) => product.categoryId === category.id).length;
        const discountPercentage = [12, 18, 9][index % 3];

        return {
          id: `campaign-${category.id}`,
          categoryId: category.id,
          categoryNameAr: category.nameAr,
          categoryNameEn: category.nameEn,
          discountPercentage,
          productsIncluded,
          endsAt: new Date(Date.now() + (7 + index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          headlineAr: 'حملة مخصصة لتحسين مبيعات القسم',
          headlineEn: 'Focused campaign to lift category sales',
          noteAr: 'تم اقتراحها بناءً على المنتجات المتاحة داخل القسم.',
          noteEn: 'Suggested from currently available products in this category.'
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

  private loadWorkspace(): void {
    this.http.get<Partial<OffersWorkspaceState>>(this.stateUrl).subscribe({
      next: (workspace) => {
        this.couponsSubject.next(workspace.coupons ?? []);
        this.categoryCampaignsSubject.next(workspace.categoryCampaigns ?? []);
        this.clearanceOffersSubject.next(workspace.clearanceOffers ?? []);
      },
      error: () => {
        this.couponsSubject.next([]);
        this.categoryCampaignsSubject.next([]);
        this.clearanceOffersSubject.next([]);
      }
    });
  }

  private persistWorkspace(): void {
    const workspace: OffersWorkspaceState = {
      coupons: this.couponsSubject.value,
      categoryCampaigns: this.categoryCampaignsSubject.value,
      clearanceOffers: this.clearanceOffersSubject.value
    };

    this.http.put(this.stateUrl, workspace).subscribe();
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
}
