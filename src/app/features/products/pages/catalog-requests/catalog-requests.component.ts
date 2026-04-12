import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CatalogService } from '../../services/catalog.service';
import { ProductRequest } from '../../models/catalog.models';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';

@Component({
  selector: 'app-catalog-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, AppPageHeaderComponent, AppPaginationComponent],
  template: `
    <div class="space-y-6" [dir]="translate.currentLang === 'ar' ? 'rtl' : 'ltr'">
      <app-page-header
        [title]="'PRODUCTS.REQUESTS_TITLE' | translate"
        [description]="'PRODUCTS.REQUESTS_SUBTITLE' | translate"
        [showBack]="true"
        backLink="/products">
      </app-page-header>

      <div class="flex flex-wrap items-center gap-3">
        <select [(ngModel)]="typeFilter" (ngModelChange)="loadRequests()" class="h-11 rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none">
          <option value="all">{{ 'PRODUCTS.REQUESTS_ALL' | translate }}</option>
          <option value="product">{{ 'PRODUCTS.REQUESTS_PRODUCTS' | translate }}</option>
          <option value="brand">{{ 'PRODUCTS.REQUESTS_BRANDS' | translate }}</option>
          <option value="category">{{ 'PRODUCTS.REQUESTS_CATEGORIES' | translate }}</option>
        </select>

        <select [(ngModel)]="statusFilter" (ngModelChange)="loadRequests()" class="h-11 rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none">
          <option value="all">{{ 'PRODUCTS.FILTERS.ALL_STATUSES' | translate }}</option>
          <option value="Pending">{{ 'CATALOG.STATUS_PENDING' | translate }}</option>
          <option value="Approved">{{ 'CATALOG.STATUS_APPROVED' | translate }}</option>
          <option value="Rejected">{{ 'CATALOG.STATUS_REJECTED' | translate }}</option>
        </select>
      </div>

      <div class="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
        @if (isLoading) {
          <div class="flex h-52 items-center justify-center">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-zadna-primary/20 border-t-zadna-primary"></div>
          </div>
        } @else if (requests.length === 0) {
          <div class="flex h-56 flex-col items-center justify-center gap-3 text-center">
            <h3 class="text-lg font-black text-slate-800">{{ 'PRODUCTS.REQUESTS_EMPTY_TITLE' | translate }}</h3>
            <p class="text-sm font-bold text-slate-500">{{ 'PRODUCTS.REQUESTS_EMPTY_DESC' | translate }}</p>
          </div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (request of requests; track request.id) {
              <div class="grid gap-4 px-5 py-4 md:grid-cols-[140px,1fr,140px,160px]">
                <div class="flex items-center gap-3">
                  <div class="h-12 w-12 overflow-hidden rounded-[16px] border border-slate-100 bg-slate-50">
                    <img [src]="request.imageUrl || 'assets/images/placeholders/product.svg'" class="h-full w-full object-cover">
                  </div>
                  <div class="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                    {{ ('PRODUCTS.REQUEST_TYPE_' + request.requestType.toUpperCase()) | translate }}
                  </div>
                </div>

                <div>
                  <div class="text-sm font-black text-slate-900">{{ getRequestDisplayName(request) }}</div>
                  <div class="mt-1 text-xs font-bold text-slate-500">
                    {{ getRequestContext(request) }}
                  </div>
                  @if (request.adminNotes) {
                    <div class="mt-2 rounded-[14px] bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                      {{ request.adminNotes }}
                    </div>
                  }
                </div>

                <div class="flex items-center text-sm font-black text-slate-700">
                  {{ request.createdAtUtc | date:'mediumDate' }}
                </div>

                <div class="flex items-center justify-between gap-3">
                  <span class="inline-flex rounded-full px-3 py-1 text-xs font-black"
                    [ngClass]="{
                      'bg-amber-100 text-amber-700': request.status === 'Pending',
                      'bg-emerald-100 text-emerald-700': request.status === 'Approved',
                      'bg-rose-100 text-rose-700': request.status === 'Rejected'
                    }">
                    {{ ('CATALOG.STATUS_' + request.status.toUpperCase()) | translate }}
                  </span>

                  <span class="text-xs font-bold text-slate-400">{{ getReviewerLabel(request) }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <app-pagination
        [currentPage]="pageNumber"
        [totalPages]="totalPages"
        (pageChange)="onPageChange($event)">
      </app-pagination>
    </div>
  `
})
export class CatalogRequestsComponent implements OnInit {
  requests: ProductRequest[] = [];
  isLoading = false;
  typeFilter: 'all' | 'product' | 'brand' | 'category' = 'all';
  statusFilter: 'all' | 'Pending' | 'Approved' | 'Rejected' = 'all';
  pageNumber = 1;
  totalPages = 1;

  constructor(
    private readonly catalogService: CatalogService,
    public readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.catalogService.getCatalogRequests({
      type: this.typeFilter,
      status: this.statusFilter,
      pageNumber: this.pageNumber,
      pageSize: 10
    }).subscribe({
      next: (response) => {
        this.requests = response.items;
        this.totalPages = response.totalPages || 1;
        this.isLoading = false;
      },
      error: () => {
        this.requests = [];
        this.totalPages = 1;
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.pageNumber = page;
    this.loadRequests();
  }

  getRequestDisplayName(request: ProductRequest): string {
    const isArabic = this.translate.currentLang === 'ar';
    const localizedName = isArabic ? request.productNameAr : request.productNameEn;
    const fallbackName = isArabic ? request.productNameEn : request.productNameAr;

    return localizedName || fallbackName || this.translate.instant('PRODUCTS.REQUESTS_UNNAMED_PRODUCT');
  }

  getRequestContext(request: ProductRequest): string {
    const isArabic = this.translate.currentLang === 'ar';
    const localizedContext = isArabic
      ? request.categoryNameAr || request.parentCategoryNameAr || request.suggestedBrandName
      : request.categoryNameEn || request.parentCategoryNameEn || request.suggestedBrandNameEn || request.suggestedBrandName;

    return localizedContext || this.translate.instant('PRODUCTS.REQUESTS_NO_CONTEXT');
  }

  getReviewerLabel(request: ProductRequest): string {
    return request.reviewedBy || this.translate.instant('PRODUCTS.REQUESTS_UNREVIEWED');
  }
}
