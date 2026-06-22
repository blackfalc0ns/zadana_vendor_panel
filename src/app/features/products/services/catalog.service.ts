import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  optimizeImageForUpload,
  shouldOptimizeImageForUpload,
  ImageUploadProgress
} from '../../../shared/utils/image-upload-optimizer';
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
  packageTypeId?: string | null;
  packageTypeNameAr?: string | null;
  packageTypeNameEn?: string | null;
  measurementValue?: number | null;
  measurementUnitId?: string | null;
  measurementUnitNameAr?: string | null;
  measurementUnitNameEn?: string | null;
  variantGroupId?: string | null;
  displaySizeAr?: string | null;
  displaySizeEn?: string | null;
  status?: string;
  isInVendorStore?: boolean;
  vendorSellingPrice?: number | null;
  vendorCompareAtPrice?: number | null;
  vendorCostPrice?: number | null;
  vendorTradePrice?: number | null;
  images?: MasterProductImageApi[];
}

interface VendorProductApi {
  id: string;
  vendorId: string;
  masterProductId: string;
  costPrice?: number | null;
  tradePrice?: number | null;
  sellingPrice: number;
  compareAtPrice?: number | null;
  commissionRate?: number | null;
  stockQuantity: number;
  isAvailable: boolean;
  status?: string;
  canEditPrice?: boolean;
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
    branchId?: string | null;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<PaginatedList<MasterProduct>> {
    let httpParams = new HttpParams();
    if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.brandId) httpParams = httpParams.set('brandId', params.brandId);
    if (params.branchId?.trim()) httpParams = httpParams.set('branchId', params.branchId.trim());
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
    branchId?: string | null;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<PaginatedList<VendorProduct>> {
    let httpParams = new HttpParams();
    if (params.searchTerm) httpParams = httpParams.set('search', params.searchTerm);
    if (params.branchId?.trim()) httpParams = httpParams.set('branchId', params.branchId.trim());
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
      map((units) => (units || []).map((unit) => ({
        ...unit,
        kind: unit.kind === 'Packaging' ? ('Packaging' as const) : ('Measurement' as const)
      }))),
      catchError(() => of([]))
    );
  }

  getBrands(): Observable<BrandOption[]> {
    return this.http.get<BrandOption[]>(`${this.baseUrl}/catalog/brands`).pipe(
      catchError(() => of([]))
    );
  }

  submitProductRequest(data: any): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/product-requests`, this.normalizeProductRequestPayload(data));
  }

  uploadFile(
    file: File,
    directory: string,
    onProgress?: (progress: ImageUploadProgress) => void
  ): Observable<string> {
    onProgress?.({ percent: 3, phase: 'preparing' });
    const preparedFile$ = shouldOptimizeImageForUpload(file)
      ? from(optimizeImageForUpload(file))
      : of(file);

    return preparedFile$.pipe(
      switchMap((preparedFile) => {
        onProgress?.({ percent: 15, phase: 'uploading' });
        const formData = new FormData();
        formData.append('file', preparedFile);
        formData.append('directory', directory);
        return this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, formData, {
          observe: 'events',
          reportProgress: true
        }).pipe(
          tap((event) => {
            if (event.type === HttpEventType.UploadProgress) {
              const uploadPercent = event.total ? event.loaded / event.total : 0;
              onProgress?.({
                percent: Math.min(99, 15 + Math.round(uploadPercent * 84)),
                phase: 'uploading'
              });
            }
          }),
          filter((event): event is HttpResponse<{ url: string }> =>
            event.type === HttpEventType.Response),
          map((event) => {
            onProgress?.({ percent: 100, phase: 'uploading' });
            return event.body ?? { url: '' };
          })
        );
      }),
      map(response => response.url)
    );
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
      costPrice: request.costPrice ?? null,
      tradePrice: request.tradePrice ?? null,
      sellingPrice: request.sellingPrice,
      compareAtPrice: request.compareAtPrice ?? null,
      stockQty: request.stockQty,
      minOrderQty: 1,
      maxOrderQty: null,
      sku: null,
      branchId: request.branchId || null
    });
  }

  createBulkProducts(items: BulkVendorProductDraft[]): Observable<VendorProductBulkOperation> {
    const payload = {
      idempotencyKey: this.generateIdempotencyKey(),
      items: items.map((item) => ({
        masterProductId: item.masterProductId,
        tradePrice: item.tradePrice ?? null,
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
      costPrice: data.costPrice ?? null,
      tradePrice: data.tradePrice ?? null,
      stockQty: data.stockQty,
      customNameAr: null,
      customNameEn: null,
      customDescriptionAr: null,
      customDescriptionEn: null
    });
  }

  changeProductStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/products/${id}/status`, { isActive });
  }

  deleteVendorProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
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
      unitNameAr: item.displaySizeAr || item.unitNameAr || item.measurementUnitNameAr || undefined,
      unitNameEn: item.displaySizeEn || item.unitNameEn || item.measurementUnitNameEn || undefined,
      displaySizeAr: item.displaySizeAr || undefined,
      displaySizeEn: item.displaySizeEn || undefined,
      packageTypeId: item.packageTypeId || null,
      measurementValue: item.measurementValue ?? null,
      measurementUnitId: item.measurementUnitId || null,
      variantGroupId: item.variantGroupId || undefined,
      isInVendorStore: item.isInVendorStore ?? false,
      vendorSellingPrice: item.vendorSellingPrice ?? null,
      vendorCompareAtPrice: item.vendorCompareAtPrice ?? null,
      vendorCostPrice: item.vendorCostPrice ?? null,
      vendorTradePrice: item.vendorTradePrice ?? null,
      barcode: item.barcode || undefined,
      slug: item.slug || undefined
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
      packageTypeId: product.packageTypeId || null,
      measurementUnitId: product.measurementUnitId || null,
      measurementValue: product.measurementValue ?? null,
      displaySizeAr: product.displaySizeAr,
      displaySizeEn: product.displaySizeEn,
      variantGroupId: product.variantGroupId,
      costPrice: item.costPrice ?? null,
      tradePrice: item.tradePrice ?? null,
      sellingPrice: item.sellingPrice,
      compareAtPrice: item.compareAtPrice ?? null,
      commissionRate: item.commissionRate ?? null,
      discountPercentage: this.calculateDiscountPercentage(item.sellingPrice, item.compareAtPrice),
      stockQty: item.stockQuantity,
      isActive: ['active', 'outofstock'].includes((item.status || '').toLowerCase()),
      canEditPrice: item.canEditPrice ?? true
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
          packageTypeId: data.product.packageTypeId || null,
          measurementValue: data.product.measurementValue ?? null,
          imageUrl: data.product.imageUrl || data.product.imageUrls?.[0] || null,
          imageUrls: data.product.imageUrls?.length
            ? data.product.imageUrls
            : (data.product.imageUrl ? [data.product.imageUrl] : null)
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
