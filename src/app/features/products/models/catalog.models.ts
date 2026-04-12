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
  isActive?: boolean;
}

export interface UnitOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

export type CatalogRequestType = 'product' | 'brand' | 'category';
export type ProductRequestStatus = 'Pending' | 'Approved' | 'Rejected';

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
