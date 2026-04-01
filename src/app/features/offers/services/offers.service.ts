import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category, VendorProduct } from '../../../services/catalog.service';

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

export interface ClearanceOffer {
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

@Injectable({
  providedIn: 'root'
})
export class OffersService {
  getCouponOffers(): Observable<CouponOffer[]> {
    return of([
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
    ]);
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
      .map((product) => ({
        productId: product.id,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        imageUrl: product.imageUrl,
        categoryNameAr: product.categoryNameAr,
        categoryNameEn: product.categoryNameEn,
        sellingPrice: product.sellingPrice,
        compareAtPrice: product.compareAtPrice ?? this.getRecommendedCompareAtPrice(product),
        discountPercentage: product.discountPercentage || this.getRecommendedDiscount(product.stockQty),
        stockQty: product.stockQty,
        savingsValue: Number(
          Math.max((product.compareAtPrice ?? this.getRecommendedCompareAtPrice(product)) - product.sellingPrice, 0).toFixed(2)
        ),
        urgency: product.stockQty <= 5 ? 'critical' : 'warning'
      }));
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
