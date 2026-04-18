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
  isInVendorStore?: boolean;
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
  subCategories?: Category[] | null;
}

export interface BrandOption {
  id: string;
  nameAr: string;
  nameEn: string;
  logoUrl?: string;
  categoryId?: string | null;
  categoryNameAr?: string;
  categoryNameEn?: string;
  isActive?: boolean;
}

export interface UnitOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

export type CatalogRequestType = 'product' | 'brand' | 'category';
export type ProductRequestStatus = 'Pending' | 'Approved' | 'Rejected';
export type CategoryRequestKind = 'category' | 'sub_category';

export interface ProductRequest {
  id: string;
  requestType: CatalogRequestType;
  productNameAr: string;
  productNameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  categoryId?: string | null;
  categoryNameAr?: string;
  categoryNameEn?: string;
  brandId?: string | null;
  suggestedBrandName?: string;
  suggestedBrandNameEn?: string;
  parentCategoryNameAr?: string;
  parentCategoryNameEn?: string;
  requestKind?: CategoryRequestKind;
  requestedLevelKey?: string;
  requestedPathAr?: string;
  requestedPathEn?: string;
  approvedPathAr?: string;
  approvedPathEn?: string;
  displayOrder?: number | null;
  unitId?: string | null;
  unitNameAr?: string;
  unitNameEn?: string;
  imageUrl?: string;
  status: ProductRequestStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAtUtc?: string;
  createdAtUtc: string;
}

export interface CatalogNotification {
  id: string;
  title: string;
  body: string;
  type?: string | null;
  isRead: boolean;
  createdAtUtc: string;
}

export interface BulkVendorProductDraft {
  masterProductId: string;
  productNameAr: string;
  productNameEn: string;
  imageUrl?: string;
  branchId?: string | null;
  sku?: string | null;
  sellingPrice: number | null;
  discountPercentage?: number | null;
  compareAtPrice?: number | null;
  stockQty: number;
  minOrderQty: number;
  maxOrderQty?: number | null;
  selected?: boolean;
  error?: string | null;
}

export interface VendorProductBulkOperation {
  id: string;
  idempotencyKey: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'CompletedWithErrors' | 'Failed';
  totalRows: number;
  processedRows: number;
  succeededRows: number;
  failedRows: number;
  errorMessage?: string | null;
  createdAtUtc: string;
  startedAtUtc?: string | null;
  completedAtUtc?: string | null;
}

export interface VendorProductBulkOperationItem {
  id: string;
  rowNumber: number;
  masterProductId: string;
  productNameAr?: string | null;
  productNameEn?: string | null;
  sellingPrice: number;
  compareAtPrice?: number | null;
  stockQty: number;
  branchId?: string | null;
  sku?: string | null;
  minOrderQty: number;
  maxOrderQty?: number | null;
  status: 'Pending' | 'Succeeded' | 'Failed' | 'Skipped';
  errorMessage?: string | null;
  createdVendorProductId?: string | null;
}
