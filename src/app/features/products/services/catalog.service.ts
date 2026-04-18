import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  BulkVendorProductDraft,
  BrandOption,
  CatalogNotification,
  Category,
  MasterProduct,
  PaginatedList,
  ProductRequest,
  VendorProductBulkOperation,
  VendorProductBulkOperationItem,
  UnitOption,
  VendorProduct
} from '../models/catalog.models';

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
  brandNameAr?: string | null;
  brandNameEn?: string | null;
  unitOfMeasureId?: string | null;
  unitNameAr?: string | null;
  unitNameEn?: string | null;
  status?: string;
  isInVendorStore?: boolean;
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

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly baseUrl = `${environment.apiUrl}/vendor`;

  constructor(private readonly http: HttpClient) {}

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
        items: (response.items || []).map((item) => this.mapMasterProduct(item))
      })),
      catchError(() => of({ items: [], pageNumber: 1, totalPages: 1, totalCount: 0, hasPreviousPage: false, hasNextPage: false }))
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
      map((response) => ({
        ...response,
        items: (response.items || []).map((item) => this.mapVendorProduct(item))
      })),
      catchError(() => of({ items: [], pageNumber: 1, totalPages: 1, totalCount: 0, hasPreviousPage: false, hasNextPage: false }))
    );
  }

  getVendorProductById(id: string): Observable<VendorProduct> {
    return this.http.get<VendorProductApi>(`${this.baseUrl}/products/${id}`).pipe(
      map((response) => this.mapVendorProduct(response))
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/catalog/categories`).pipe(
      catchError(() => of([]))
    );
  }

  getUnits(): Observable<UnitOption[]> {
    return this.http.get<UnitOption[]>(`${this.baseUrl}/catalog/units`).pipe(
      catchError(() => of([]))
    );
  }

  getBrands(): Observable<BrandOption[]> {
    return this.http.get<BrandOption[]>(`${this.baseUrl}/catalog/brands`).pipe(
      catchError(() => of([]))
    );
  }

  submitProductRequest(data: any): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/catalog/product-requests`, this.normalizeProductRequestPayload(data));
  }

  submitBrandRequest(payload: { categoryId: string; nameAr: string; nameEn: string; logoUrl?: string | null }): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/catalog/brand-requests`, payload);
  }

  submitCategoryRequest(payload: {
    nameAr: string;
    nameEn: string;
    targetLevel: string;
    parentCategoryId?: string | null;
    displayOrder?: number;
    imageUrl?: string | null;
  }): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/catalog/category-requests`, payload);
  }

  getCatalogRequests(params?: {
    type?: 'all' | 'product' | 'brand' | 'category';
    status?: 'all' | 'Pending' | 'Approved' | 'Rejected';
    pageNumber?: number;
    pageSize?: number;
  }): Observable<PaginatedList<ProductRequest>> {
    let httpParams = new HttpParams();
    if (params?.type && params.type !== 'all') httpParams = httpParams.set('type', params.type);
    if (params?.status && params.status !== 'all') httpParams = httpParams.set('status', params.status);
    if (params?.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());

    return this.http.get<PaginatedList<any>>(`${this.baseUrl}/catalog/request-center`, { params: httpParams }).pipe(
      map((response) => ({
        ...response,
        items: (response.items || []).map((item) => this.mapCatalogRequest(item))
      })),
      catchError(() => of({ items: [], pageNumber: 1, totalPages: 1, totalCount: 0, hasPreviousPage: false, hasNextPage: false }))
    );
  }

  getCatalogNotifications(): Observable<CatalogNotification[]> {
    return this.http.get<CatalogNotification[]>(`${this.baseUrl}/catalog/notifications`).pipe(
      catchError(() => of([]))
    );
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

  createBulkProducts(items: BulkVendorProductDraft[]): Observable<VendorProductBulkOperation> {
    const payload = {
      idempotencyKey: this.generateIdempotencyKey(),
      items: items.map((item) => ({
        masterProductId: item.masterProductId,
        sellingPrice: item.sellingPrice,
        compareAtPrice: item.compareAtPrice ?? this.calculateCompareAtPrice(item.sellingPrice ?? 0, item.discountPercentage ?? 0),
        stockQty: item.stockQty,
        branchId: item.branchId || null,
        sku: item.sku || null,
        minOrderQty: item.minOrderQty,
        maxOrderQty: item.maxOrderQty ?? null
      }))
    };

    return this.http.post<VendorProductBulkOperation>(`${this.baseUrl}/products/bulk`, payload);
  }

  getBulkOperation(operationId: string): Observable<VendorProductBulkOperation> {
    return this.http.get<VendorProductBulkOperation>(`${this.baseUrl}/products/bulk/${operationId}`);
  }

  getBulkOperationItems(operationId: string): Observable<VendorProductBulkOperationItem[]> {
    return this.http.get<VendorProductBulkOperationItem[]>(`${this.baseUrl}/products/bulk/${operationId}/items`);
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
      brandNameAr: item.brandNameAr || undefined,
      brandNameEn: item.brandNameEn || undefined,
      unitNameAr: item.unitNameAr || undefined,
      unitNameEn: item.unitNameEn || undefined,
      isInVendorStore: item.isInVendorStore ?? false
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

  private normalizeProductRequestPayload(data: any): any {
    if (data?.product) {
      return {
        product: {
          nameAr: data.product.nameAr,
          nameEn: data.product.nameEn,
          descriptionAr: data.product.descriptionAr || null,
          descriptionEn: data.product.descriptionEn || null,
          categoryId: data.product.categoryId || null,
          brandId: data.product.brandId || null,
          unitId: data.product.unitId || null,
          imageUrl: data.product.imageUrl || data.product.images?.[0]?.url || null
        },
        requestedBrand: data.requestedBrand || null,
        requestedCategory: data.requestedCategory
          ? {
              ...data.requestedCategory,
              targetLevel: data.requestedCategory.targetLevel
            }
          : null
      };
    }

    return {
      product: {
        nameAr: data.productNameAr,
        nameEn: data.productNameEn,
        descriptionAr: data.descriptionAr || null,
        descriptionEn: data.descriptionEn || null,
        categoryId: data.categoryId || null,
        brandId: null,
        unitId: null,
        imageUrl: data.imageUrl || null
      },
      requestedBrand: data.suggestedBrandName
        ? {
            nameAr: data.suggestedBrandName,
            nameEn: data.suggestedBrandName,
            logoUrl: null
          }
        : null,
      requestedCategory: null
    };
  }

  private mapCatalogRequest(item: any): ProductRequest {
    return {
      id: item.id,
      requestType: item.requestType,
      productNameAr: item.nameAr,
      productNameEn: item.nameEn,
      descriptionAr: item.descriptionAr || undefined,
      descriptionEn: item.descriptionEn || undefined,
      categoryId: item.categoryId || null,
      categoryNameAr: item.categoryNameAr || undefined,
      categoryNameEn: item.categoryNameEn || undefined,
      brandId: item.brandId || null,
      suggestedBrandName: item.brandNameAr || undefined,
      suggestedBrandNameEn: item.brandNameEn || undefined,
      parentCategoryNameAr: item.parentCategoryNameAr || undefined,
      parentCategoryNameEn: item.parentCategoryNameEn || undefined,
      requestKind: item.requestKind || undefined,
      requestedLevelKey: item.requestedLevelKey || undefined,
      requestedPathAr: item.requestedPathAr || undefined,
      requestedPathEn: item.requestedPathEn || undefined,
      approvedPathAr: item.approvedPathAr || undefined,
      approvedPathEn: item.approvedPathEn || undefined,
      displayOrder: item.displayOrder ?? null,
      unitId: item.unitId || null,
      unitNameAr: item.unitNameAr || undefined,
      unitNameEn: item.unitNameEn || undefined,
      imageUrl: item.imageUrl || undefined,
      status: item.status,
      adminNotes: item.rejectionReason || undefined,
      reviewedBy: item.reviewedBy || undefined,
      reviewedAtUtc: item.reviewedAtUtc || undefined,
      createdAtUtc: item.createdAtUtc
    };
  }

  private generateIdempotencyKey(): string {
    return `vendor-bulk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
