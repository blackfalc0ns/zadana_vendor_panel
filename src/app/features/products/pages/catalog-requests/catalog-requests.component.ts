import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { CatalogService } from '../../services/catalog.service';
import { ProductRequest } from '../../models/catalog.models';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';

@Component({
  selector: 'app-catalog-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, AppPageHeaderComponent, AppPaginationComponent, SearchableSelectComponent],
  template: `
    <div class="space-y-6" [dir]="translate.currentLang === 'ar' ? 'rtl' : 'ltr'">
      <app-page-header
        [title]="'PRODUCTS.REQUESTS_TITLE' | translate"
        [description]="'PRODUCTS.REQUESTS_SUBTITLE' | translate"
        [showBack]="true"
        backLink="/products">
      </app-page-header>

      <!-- Filters Section -->
      <div class="flex flex-wrap items-center gap-3 bg-slate-50/50 rounded-[24px] p-2 border border-slate-100 w-max shadow-sm">
        <app-searchable-select [(ngModel)]="typeFilter" (ngModelChange)="loadRequests()" [options]="[{value:'all', labelKey:'PRODUCTS.REQUESTS_ALL'},{value:'product', labelKey:'PRODUCTS.REQUESTS_PRODUCTS'},{value:'brand', labelKey:'PRODUCTS.REQUESTS_BRANDS'},{value:'category', labelKey:'PRODUCTS.REQUESTS_CATEGORIES'}]" [placeholder]="'PRODUCTS.FILTERS.TYPE'"></app-searchable-select>

        <div class="h-6 w-px bg-slate-200"></div>

        <app-searchable-select [(ngModel)]="statusFilter" (ngModelChange)="loadRequests()" [options]="[{value:'all', labelKey:'PRODUCTS.FILTERS.ALL_STATUSES'},{value:'Pending', labelKey:'CATALOG.STATUS_PENDING'},{value:'Approved', labelKey:'CATALOG.STATUS_APPROVED'},{value:'Rejected', labelKey:'CATALOG.STATUS_REJECTED'}]" [placeholder]="'PRODUCTS.FILTERS.STATUS'"></app-searchable-select>
      </div>

      <!-- Main List Container -->
      <div class="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
        @if (isLoading) {
          <div class="flex h-64 items-center justify-center bg-slate-50/30">
            <div class="h-12 w-12 animate-spin rounded-[16px] border-[5px] border-zadna-primary/20 border-t-zadna-primary"></div>
          </div>
        } @else if (requests.length === 0) {
          <div class="flex h-64 flex-col items-center justify-center gap-4 text-center bg-slate-50/30">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-black text-slate-800">{{ 'PRODUCTS.REQUESTS_EMPTY_TITLE' | translate }}</h3>
              <p class="mt-1 text-sm font-bold text-slate-500">{{ 'PRODUCTS.REQUESTS_EMPTY_DESC' | translate }}</p>
            </div>
          </div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (request of requests; track request.id) {
              <div class="group flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 py-5 transition-all duration-300 hover:bg-slate-50/80">
                <!-- Left/Main Info -->
                <div class="flex items-center gap-4 max-w-2xl">
                  <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-[18px] border border-slate-100/80 bg-white shadow-sm ring-1 ring-slate-900/5">
                    <img [src]="request.imageUrl || 'assets/images/placeholders/product.svg'" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110">
                  </div>
                  
                  <div class="flex flex-col">
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="rounded bg-slate-100/80 px-2 py-0.5 text-[10px] font-black tracking-widest text-slate-600">
                        {{ ('PRODUCTS.REQUEST_TYPE_' + request.requestType.toUpperCase()) | translate }}
                      </span>
                      <h4 class="text-[15px] font-black text-slate-900 group-hover:text-zadna-primary transition-colors">
                        {{ getRequestDisplayName(request) }}
                      </h4>
                    </div>
                    
                    <p class="text-[13px] font-bold text-slate-500 flex items-center gap-1.5 line-clamp-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
                      </svg>
                      {{ getRequestContext(request) }}
                    </p>

                    @if (request.adminNotes) {
                      <div class="mt-3 inline-flex items-start gap-2 rounded-[14px] bg-rose-50/80 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                        <span class="leading-relaxed">{{ request.adminNotes }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Right Info and Status -->
                <div class="flex flex-row items-center justify-between w-full md:w-auto md:justify-end gap-6 md:gap-8 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-2xl md:rounded-none">
                  
                  <div class="flex flex-col items-start md:items-end">
                    <span class="text-[11px] font-bold text-slate-400 mb-0.5">{{ 'COMMON.CREATED_AT' | translate }}</span>
                    <span class="text-sm font-black text-slate-700">
                      {{ request.createdAtUtc | date:'mediumDate' }}
                    </span>
                  </div>

                  <div class="h-10 w-px bg-slate-200 hidden md:block"></div>
                  
                  <div class="flex flex-col items-end gap-2 min-w-[130px]">
                    <span class="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[11px] font-black tracking-wide ring-1 ring-inset w-full"
                      [ngClass]="{
                        'bg-amber-50 text-amber-600 ring-amber-500/30': request.status === 'Pending',
                        'bg-emerald-50 text-emerald-600 ring-emerald-500/30': request.status === 'Approved',
                        'bg-rose-50 text-rose-600 ring-rose-500/30': request.status === 'Rejected'
                      }">
                      {{ ('CATALOG.STATUS_' + request.status.toUpperCase()) | translate }}
                    </span>

                    <span class="text-[11px] font-bold text-slate-400 flex items-center justify-end gap-1.5 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
                      </svg>
                      <span class="truncate max-w-[90px]">{{ getReviewerLabel(request) }}</span>
                    </span>
                  </div>

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
      ? request.requestedPathAr || request.approvedPathAr || request.categoryNameAr || request.parentCategoryNameAr || request.suggestedBrandName
      : request.requestedPathEn || request.approvedPathEn || request.categoryNameEn || request.parentCategoryNameEn || request.suggestedBrandNameEn || request.suggestedBrandName;

    return localizedContext || this.translate.instant('PRODUCTS.REQUESTS_NO_CONTEXT');
  }

  getReviewerLabel(request: ProductRequest): string {
    return request.reviewedBy || this.translate.instant('PRODUCTS.REQUESTS_UNREVIEWED');
  }
}
