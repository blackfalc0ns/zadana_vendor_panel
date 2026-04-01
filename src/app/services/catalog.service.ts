import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MasterProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  brandNameAr?: string;
  brandNameEn?: string;
  categoryId: string;
  unitNameAr?: string;
  unitNameEn?: string;
}

export interface VendorProduct {
  id: string;
  masterProductId: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  imageUrl?: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  brandNameAr?: string;
  brandNameEn?: string;
  unitNameAr?: string;
  unitNameEn?: string;
  sellingPrice: number;
  compareAtPrice?: number | null;
  discountPercentage?: number;
  stockQty: number;
  isActive: boolean;
}

interface MasterProductImageApi {
  url: string;
  altText?: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

interface MasterProductApi {
  id: string;
  nameAr: string;
  nameEn: string;
  slug?: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  barcode?: string | null;
  categoryId: string;
  brandId?: string | null;
  unitOfMeasureId?: string | null;
  status?: string;
  images?: MasterProductImageApi[];
}

interface VendorProductApi {
  id: string;
  vendorId: string;
  masterProductId: string;
  sellingPrice: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  isAvailable: boolean;
  status?: string;
  masterProduct: MasterProductApi;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  imageUrl?: string;
  parentCategoryId?: string | null;
  displayOrder?: number;
  level?: number;
}

export interface BrandOption {
  id: string;
  nameAr: string;
  nameEn: string;
  logoUrl?: string;
  isActive?: boolean;
}

export interface UnitOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly baseUrl = `${environment.apiUrl}/vendor`;

  constructor(private http: HttpClient) {}

  getMasterProducts(params: {
    searchTerm?: string;
    categoryId?: string;
    brandId?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<PaginatedList<MasterProduct>> {
    let httpParams = new HttpParams();
    if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.brandId) httpParams = httpParams.set('brandId', params.brandId);
    if (params.pageNumber) httpParams = httpParams.set('pageNumber', (params.pageNumber || 1).toString());
    if (params.pageSize) httpParams = httpParams.set('pageSize', (params.pageSize || 10).toString());

    return this.http.get<PaginatedList<MasterProductApi>>(`${this.baseUrl}/catalog/master-products`, { params: httpParams }).pipe(
      map((response) => ({
        ...response,
        items: response.items.map((item) => this.mapMasterProduct(item))
      })),
      catchError(() => of(this.getMockPaginatedProducts(params.searchTerm, params.categoryId)))
    );
  }

  getVendorProducts(params: {
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<PaginatedList<VendorProduct>> {
    let httpParams = new HttpParams();
    if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
    if (params.pageNumber) httpParams = httpParams.set('pageNumber', (params.pageNumber || 1).toString());
    if (params.pageSize) httpParams = httpParams.set('pageSize', (params.pageSize || 10).toString());

    return this.http.get<PaginatedList<VendorProductApi>>(`${this.baseUrl}/products`, { params: httpParams }).pipe(
      map((response) => {
        let items = response.items.map((item) => this.mapVendorProduct(item));
        const pageNumber = params.pageNumber || response.pageNumber || 1;
        const pageSize = params.pageSize || response.items.length || 1;

        if (params.searchTerm) {
          const term = params.searchTerm.trim().toLowerCase();
          items = items.filter((item) =>
            item.nameAr.includes(params.searchTerm as string) ||
            item.nameEn.toLowerCase().includes(term)
          );
        }

        return {
          ...response,
          items,
          totalCount: params.searchTerm ? items.length : response.totalCount,
          totalPages: params.searchTerm ? Math.max(1, Math.ceil(items.length / pageSize)) : response.totalPages,
          hasPreviousPage: params.searchTerm ? pageNumber > 1 : response.hasPreviousPage,
          hasNextPage: params.searchTerm ? false : response.hasNextPage
        };
      }),
      catchError(() => of(this.getMockVendorProducts(params.searchTerm)))
    );
  }

  getVendorProductById(id: string): Observable<VendorProduct> {
    return this.http.get<VendorProductApi>(`${this.baseUrl}/products/${id}`).pipe(
      map((response) => this.mapVendorProduct(response)),
      catchError(() => {
        const mock = this.getMockVendorProducts().items.find((product) => product.id === id);
        if (mock) {
          return of(mock);
        }

        throw new Error('Product not found');
      })
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/catalog/categories`).pipe(
      catchError(() =>
        of([
          { id: 'cat-root-1', nameAr: 'الأغذية', nameEn: 'Food', parentCategoryId: null, displayOrder: 1, level: 1 },
          { id: 'cat-root-2', nameAr: 'المشروبات', nameEn: 'Beverages', parentCategoryId: null, displayOrder: 2, level: 1 },
          { id: 'cat1', nameAr: 'خضروات وفواكه', nameEn: 'Fruits & Vegetables', parentCategoryId: 'cat-root-1', displayOrder: 1, level: 2 },
          { id: 'cat2', nameAr: 'زيوت وأطعمة', nameEn: 'Oils & Food', parentCategoryId: 'cat-root-1', displayOrder: 2, level: 2 },
          { id: 'cat3', nameAr: 'منظفات', nameEn: 'Cleaning', parentCategoryId: null, displayOrder: 3, level: 1 }
        ])
      )
    );
  }

  getUnits(): Observable<UnitOption[]> {
    return of([
      { id: 'u1', nameAr: 'كيلوجرام', nameEn: 'KG' },
      { id: 'u2', nameAr: 'قطعة', nameEn: 'Piece' },
      { id: 'u3', nameAr: 'زجاجة', nameEn: 'Bottle' },
      { id: 'u4', nameAr: 'كيس', nameEn: 'Bag' },
      { id: 'u5', nameAr: 'كرتونة', nameEn: 'Carton' }
    ]);
  }

  getBrands(): Observable<BrandOption[]> {
    return of([
      { id: 'brand1', nameAr: 'مزارع زادنا', nameEn: 'Zadana Farms', isActive: true },
      { id: 'brand2', nameAr: 'عافية', nameEn: 'Afia', isActive: true },
      { id: 'brand3', nameAr: 'صحارى', nameEn: 'Sahara', isActive: true },
      { id: 'brand4', nameAr: 'أبو سنبلتين', nameEn: 'Abu Sumbulatein', isActive: true }
    ]);
  }

  submitProductRequest(data: any): Observable<void> {
    // In production: this.http.post<void>(`${this.baseUrl}/catalog/product-requests`, data)
    console.log('Submitting Product Request:', data);
    return of(void 0);
  }

  addToStore(request: any): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/products`, {
      masterProductId: request.masterProductId,
      sellingPrice: request.sellingPrice,
      compareAtPrice: request.compareAtPrice ?? null,
      costPrice: null,
      stockQty: request.stockQty,
      minOrderQty: 1,
      maxOrderQty: null,
      sku: null,
      branchId: null
    });
  }

  updateVendorProduct(id: string, data: any): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/products/${id}`, {
      sellingPrice: data.sellingPrice,
      compareAtPrice: data.compareAtPrice ?? null,
      stockQty: data.stockQty,
      customNameAr: null,
      customNameEn: null,
      customDescriptionAr: null,
      customDescriptionEn: null
    });
  }

  calculateDiscountPercentage(sellingPrice: number, compareAtPrice?: number | null): number {
    if (!compareAtPrice || compareAtPrice <= sellingPrice || compareAtPrice <= 0) {
      return 0;
    }

    return Math.round(((compareAtPrice - sellingPrice) / compareAtPrice) * 100);
  }

  calculateCompareAtPrice(sellingPrice: number, discountPercentage?: number | null): number | null {
    if (!discountPercentage || discountPercentage <= 0 || discountPercentage >= 100 || sellingPrice <= 0) {
      return null;
    }

    const compareAtPrice = sellingPrice / (1 - discountPercentage / 100);
    return Number(compareAtPrice.toFixed(2));
  }

  hasActiveOffer(product: VendorProduct): boolean {
    return !!product.compareAtPrice && product.compareAtPrice > product.sellingPrice;
  }

  private mapMasterProduct(item: MasterProductApi): MasterProduct {
    const primaryImage = item.images?.find((image) => image.isPrimary) || item.images?.[0];

    return {
      id: item.id,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      descriptionAr: item.descriptionAr || undefined,
      descriptionEn: item.descriptionEn || undefined,
      imageUrl: primaryImage?.url || undefined,
      categoryId: item.categoryId,
      categoryNameAr: undefined,
      categoryNameEn: undefined,
      brandNameAr: undefined,
      brandNameEn: undefined,
      unitNameAr: undefined,
      unitNameEn: undefined
    };
  }

  private mapVendorProduct(item: VendorProductApi): VendorProduct {
    const product = this.mapMasterProduct(item.masterProduct);

    return {
      id: item.id,
      masterProductId: item.masterProductId,
      categoryId: item.masterProduct.categoryId,
      nameAr: item.masterProduct.nameAr,
      nameEn: item.masterProduct.nameEn,
      imageUrl: product.imageUrl,
      categoryNameAr: product.categoryNameAr,
      categoryNameEn: product.categoryNameEn,
      brandNameAr: product.brandNameAr,
      brandNameEn: product.brandNameEn,
      unitNameAr: product.unitNameAr,
      unitNameEn: product.unitNameEn,
      sellingPrice: item.sellingPrice,
      compareAtPrice: item.compareAtPrice ?? null,
      discountPercentage: this.calculateDiscountPercentage(item.sellingPrice, item.compareAtPrice),
      stockQty: item.stockQuantity,
      isActive: item.isAvailable
    };
  }

  private getMockVendorProducts(search?: string): PaginatedList<VendorProduct> {
    let items: VendorProduct[] = [
      {
        id: 'v1',
        masterProductId: '1',
        categoryId: 'cat1',
        nameAr: 'طماطم طازجة درجة أولى',
        nameEn: 'Premium Fresh Tomato',
        categoryNameAr: 'خضروات وفواكه',
        categoryNameEn: 'Fruits & Vegetables',
        brandNameAr: 'مزارع زادنا',
        brandNameEn: 'Zadana Farms',
        unitNameAr: 'كيلوجرام',
        unitNameEn: 'KG',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop',
        sellingPrice: 12.5,
        compareAtPrice: 13.89,
        discountPercentage: 10,
        stockQty: 150,
        isActive: true
      },
      {
        id: 'v2',
        masterProductId: '3',
        categoryId: 'cat2',
        nameAr: 'زيت دوار الشمس عافية (1.5 لتر)',
        nameEn: 'Afia Sunflower Oil (1.5L)',
        categoryNameAr: 'زيوت وأطعمة',
        categoryNameEn: 'Oils & Food',
        brandNameAr: 'عافية',
        brandNameEn: 'Afia',
        unitNameAr: 'زجاجة',
        unitNameEn: 'Bottle',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=200&auto=format&fit=crop',
        sellingPrice: 85.0,
        compareAtPrice: null,
        stockQty: 40,
        isActive: true
      },
      {
        id: 'v3',
        masterProductId: '4',
        categoryId: 'cat2',
        nameAr: 'أرز بسمتي هندي (5 كجم)',
        nameEn: 'Indian Basmati Rice (5KG)',
        categoryNameAr: 'زيوت وأطعمة',
        categoryNameEn: 'Oils & Food',
        brandNameAr: 'أبو سنبلتين',
        brandNameEn: 'Abu Sumbulatein',
        unitNameAr: 'شيكارة',
        unitNameEn: 'Sack',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=200&auto=format&fit=crop',
        sellingPrice: 310,
        compareAtPrice: null,
        stockQty: 4,
        isActive: true
      }
    ];

    if (search) {
      items = items.filter((item) => item.nameAr.includes(search) || item.nameEn.toLowerCase().includes(search.toLowerCase()));
    }

    return {
      items,
      pageNumber: 1,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false
    };
  }

  private getMockPaginatedProducts(search?: string, catId?: string): PaginatedList<MasterProduct> {
    let items: MasterProduct[] = [
      {
        id: '1',
        nameAr: 'طماطم طازجة درجة أولى',
        nameEn: 'Premium Fresh Tomato',
        categoryNameAr: 'خضروات وفواكه',
        categoryNameEn: 'Fruits & Vegetables',
        brandNameAr: 'مزارع زادنا',
        brandNameEn: 'Zadana Farms',
        unitNameAr: 'كيلوجرام',
        unitNameEn: 'KG',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop',
        categoryId: 'cat1'
      },
      {
        id: '2',
        nameAr: 'بصل أحمر - مصفى',
        nameEn: 'Red Onion - Sorted',
        categoryNameAr: 'خضروات وفواكه',
        categoryNameEn: 'Fruits & Vegetables',
        brandNameAr: 'صحارى',
        brandNameEn: 'Sahara',
        unitNameAr: 'كيس (5 كجم)',
        unitNameEn: 'Bag (5KG)',
        imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=200&auto=format&fit=crop',
        categoryId: 'cat1'
      },
      {
        id: '3',
        nameAr: 'زيت دوار الشمس عافية (1.5 لتر)',
        nameEn: 'Afia Sunflower Oil (1.5L)',
        categoryNameAr: 'زيوت وأطعمة',
        categoryNameEn: 'Oils & Food',
        brandNameAr: 'عافية',
        brandNameEn: 'Afia',
        unitNameAr: 'زجاجة',
        unitNameEn: 'Bottle',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=200&auto=format&fit=crop',
        categoryId: 'cat2'
      },
      {
        id: '4',
        nameAr: 'أرز بسمتي هندي (5 كجم)',
        nameEn: 'Indian Basmati Rice (5KG)',
        categoryNameAr: 'زيوت وأطعمة',
        categoryNameEn: 'Oils & Food',
        brandNameAr: 'أبو سنبلتين',
        brandNameEn: 'Abu Sumbulatein',
        unitNameAr: 'شيكارة',
        unitNameEn: 'Sack',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=200&auto=format&fit=crop',
        categoryId: 'cat2'
      }
    ];

    if (search) {
      items = items.filter((item) => item.nameAr.includes(search) || item.nameEn.toLowerCase().includes(search.toLowerCase()));
    }

    if (catId) {
      items = items.filter((item) => item.categoryId === catId);
    }

    return {
      items,
      pageNumber: 1,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false
    };
  }
}
