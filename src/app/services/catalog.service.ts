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

    return this.http.get<PaginatedList<MasterProduct>>(`${this.baseUrl}/catalog/master-products`, { params: httpParams }).pipe(
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

    return this.http.get<PaginatedList<VendorProduct>>(`${this.baseUrl}/products`, { params: httpParams }).pipe(
      catchError(() => of(this.getMockVendorProducts(params.searchTerm)))
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/catalog/categories`).pipe(
      catchError(() => of([
        { id: 'cat1', nameAr: 'خضروات وفواكه', nameEn: 'Fruits & Vegetables' },
        { id: 'cat2', nameAr: 'زيوت وطعام', nameEn: 'Oils & Food' },
        { id: 'cat3', nameAr: 'منظفات', nameEn: 'Cleaning' }
      ]))
    );
  }

  addToStore(request: any): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/products`, request);
  }

  private getMockVendorProducts(search?: string): PaginatedList<VendorProduct> {
    let items: VendorProduct[] = [
      {
        id: 'v1',
        masterProductId: '1',
        nameAr: 'طماطم طازجة درجة أولى',
        nameEn: 'Premium Fresh Tomato',
        categoryNameAr: 'خضروات وفواكه',
        categoryNameEn: 'Fruits & Vegetables',
        brandNameAr: 'مزارع زادنا',
        brandNameEn: 'Zadana Farms',
        unitNameAr: 'كيلو جرام',
        unitNameEn: 'KG',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop',
        sellingPrice: 12.5,
        stockQty: 150,
        isActive: true
      },
      {
        id: 'v2',
        masterProductId: '3',
        nameAr: 'زيت دوار الشمس عافية (1.5 لتر)',
        nameEn: 'Afia Sunflower Oil (1.5L)',
        categoryNameAr: 'زيوت وطعام',
        categoryNameEn: 'Oils & Food',
        brandNameAr: 'عافية',
        brandNameEn: 'Afia',
        unitNameAr: 'زجاجة',
        unitNameEn: 'Bottle',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=200&auto=format&fit=crop',
        sellingPrice: 85.0,
        stockQty: 40,
        isActive: true
      }
    ];

    if (search) {
      items = items.filter(i => i.nameAr.includes(search) || i.nameEn.toLowerCase().includes(search.toLowerCase()));
    }

    return {
      items: items,
      pageNumber: 1,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false
    };
  }

  private getMockPaginatedProducts(search?: string, catId?: string): PaginatedList<MasterProduct> {
    let items = [
      {
        id: '1',
        nameAr: 'طماطم طازجة درجة أولى',
        nameEn: 'Premium Fresh Tomato',
        categoryNameAr: 'خضروات وفواكه',
        categoryNameEn: 'Fruits & Vegetables',
        brandNameAr: 'مزارع زادنا',
        brandNameEn: 'Zadana Farms',
        unitNameAr: 'كيلو جرام',
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
        categoryNameAr: 'زيوت وطعام',
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
        categoryNameAr: 'زيوت وطعام',
        categoryNameEn: 'Oils & Food',
        brandNameAr: 'أبوسنبلتين',
        brandNameEn: 'Abu Sumbulatein',
        unitNameAr: 'شيكارة',
        unitNameEn: 'Sack',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=200&auto=format&fit=crop',
        categoryId: 'cat2'
      }
    ];

    if (search) {
      items = items.filter(i => i.nameAr.includes(search) || i.nameEn.toLowerCase().includes(search.toLowerCase()));
    }
    if (catId) {
      items = items.filter(i => i.categoryId === catId);
    }

    return {
      items: items,
      pageNumber: 1,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false
    };
  }
}
