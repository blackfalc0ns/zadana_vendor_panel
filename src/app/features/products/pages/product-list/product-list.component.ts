import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CatalogService, VendorProduct, MasterProduct } from '../../../../services/catalog.service';
import { MasterProductSelectorModalComponent } from '../../components/master-product-selector-modal/master-product-selector-modal.component';
import { AddProductModalComponent } from '../../components/add-product-modal/add-product-modal.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TranslateModule, 
    MasterProductSelectorModalComponent, 
    AddProductModalComponent
  ],
  template: `
    <div class="space-y-6" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <!-- Header Section -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">{{ 'PRODUCTS.LIST_TITLE' | translate }}</h1>
          <p class="text-[0.85rem] font-bold text-slate-500">{{ 'PRODUCTS.LIST_SUBTITLE' | translate }}</p>
        </div>
        <button 
          (click)="onAddProductClick()"
          class="flex items-center justify-center gap-2 rounded-[18px] bg-zadna-primary px-6 py-3 text-[0.82rem] font-black text-white shadow-xl shadow-zadna-primary/25 transition-all hover:scale-105 active:scale-95">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
          </svg>
          {{ 'PRODUCTS.ADD_BUTTON' | translate }}
        </button>
      </div>

      <!-- Main Content / Table -->
      <div class="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50">
        <!-- Table Controls -->
        <div class="border-b border-slate-50 p-4">
          <div class="relative max-w-sm group">
            <span class="absolute inset-y-0 start-4 flex items-center text-slate-400 group-focus-within:text-zadna-primary transition-colors">
              <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"></path>
              </svg>
            </span>
            <input 
              type="text" 
              [(ngModel)]="searchTerm"
              (input)="loadProducts()"
              [placeholder]="'PRODUCTS.SEARCH_PLACEHOLDER' | translate"
              class="h-11 w-full rounded-[16px] border border-slate-100 bg-slate-50 pe-4 ps-11 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto no-scrollbar">
          @if (isLoading) {
            <div class="flex h-64 flex-col items-center justify-center gap-3">
              <div class="h-10 w-10 animate-spin rounded-full border-4 border-zadna-primary/20 border-t-zadna-primary"></div>
              <span class="text-sm font-bold text-slate-400">{{ 'COMMON.LOADING' | translate }}</span>
            </div>
          } @else if (products.length === 0) {
            <div class="flex h-80 flex-col items-center justify-center p-8 text-center">
              <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50">
                <svg class="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <h3 class="text-lg font-black text-slate-900">{{ 'PRODUCTS.EMPTY_TITLE' | translate }}</h3>
              <p class="max-w-xs text-sm font-bold text-slate-500">{{ 'PRODUCTS.EMPTY_DESC' | translate }}</p>
              <button 
                (click)="onAddProductClick()"
                class="mt-6 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-3 text-[0.8rem] font-black text-slate-500 transition-all hover:border-zadna-primary hover:text-zadna-primary">
                {{ 'PRODUCTS.ADD_FIRST' | translate }}
              </button>
            </div>
          } @else {
            <table class="w-full text-start border-collapse">
              <thead>
                <tr class="bg-slate-50/50 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.HEADER_PRODUCT' | translate }}</th>
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.HEADER_CATEGORY' | translate }}</th>
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.HEADER_PRICE' | translate }}</th>
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.HEADER_STOCK' | translate }}</th>
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.HEADER_STATUS' | translate }}</th>
                  <th class="px-3 py-3 text-center">{{ 'COMMON.ACTIONS' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (product of products; track product.id) {
                  <tr class="group transition-colors hover:bg-slate-50/50">
                    <td class="px-3 py-2.5">
                      <div class="flex items-center gap-3.5">
                        <div class="h-10 w-10 shrink-0 overflow-hidden rounded-[14px] bg-slate-50 border border-slate-100 group-hover:border-zadna-primary/20 transition-all">
                          <img [src]="product.imageUrl || 'assets/images/placeholders/product.png'" class="h-full w-full object-cover">
                        </div>
                        <div class="min-w-0">
                          <span class="block truncate text-[0.8rem] font-black text-slate-900 group-hover:text-zadna-primary transition-colors">
                            {{ currentLang === 'ar' ? product.nameAr : product.nameEn }}
                          </span>
                          <span class="text-[0.62rem] font-bold text-slate-400">
                            {{ currentLang === 'ar' ? (product.brandNameAr || 'مركة عامة') : (product.brandNameEn || 'General') }}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <span class="inline-flex rounded-lg bg-slate-100 px-2 py-0.5 text-[0.6rem] font-black text-slate-600">
                        {{ currentLang === 'ar' ? product.categoryNameAr : product.categoryNameEn }}
                      </span>
                    </td>
                    <td class="px-3 py-2.5">
                      <div class="flex flex-col gap-0.5">
                        <strong class="text-[0.8rem] font-black text-slate-900 leading-none">{{ product.sellingPrice }} <small class="text-[0.55rem] font-bold text-slate-400">{{ 'COMMON.EGP' | translate }}</small></strong>
                        <span class="text-[0.58rem] font-bold text-slate-400">{{ 'PRODUCTS.INCL_VAT' | translate }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <div class="flex items-center gap-1.5">
                        <div class="h-1.2 w-1.2 rounded-full" [ngClass]="product.stockQty > 20 ? 'bg-emerald-500' : 'bg-orange-500'"></div>
                        <span class="text-[0.75rem] font-black text-slate-700 leading-none">{{ product.stockQty }}</span>
                        <small class="text-[0.58rem] font-bold text-slate-400 uppercase">{{ currentLang === 'ar' ? product.unitNameAr : product.unitNameEn }}</small>
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <span 
                        [class]="product.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'"
                        class="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.6rem] font-black">
                        <span class="h-1.5 w-1.5 rounded-full" [class]="product.isActive ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                        {{ (product.isActive ? 'COMMON.STATUS_ACTIVE' : 'COMMON.STATUS_INACTIVE') | translate }}
                      </span>
                    </td>
                    <td class="px-3 py-2.5">
                      <div class="flex items-center justify-center gap-1">
                        <button class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 transition hover:bg-zadna-primary/10 hover:border-zadna-primary/20 hover:text-zadna-primary">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 transition hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>

    <!-- Modals -->
    @if (isSelectorModalOpen) {
      <app-master-product-selector-modal
        (close)="isSelectorModalOpen = false"
        (selected)="onProductSelected($event)">
      </app-master-product-selector-modal>
    }

    @if (isPricingModalOpen && selectedMasterProduct) {
      <app-add-product-modal
        [product]="selectedMasterProduct"
        (close)="isPricingModalOpen = false"
        (confirm)="onPricingConfirm($event)">
      </app-add-product-modal>
    }
  `,
  styles: [`
    :host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: VendorProduct[] = [];
  isLoading = true;
  searchTerm = '';
  currentLang = 'ar';
  private langSub: Subscription;

  // Modal States
  isSelectorModalOpen = false;
  isPricingModalOpen = false;
  selectedMasterProduct: MasterProduct | null = null;

  constructor(
    private catalogService: CatalogService,
    private translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe(event => this.currentLang = event.lang);
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.catalogService.getVendorProducts({
      searchTerm: this.searchTerm
    }).subscribe({
      next: (data) => {
        this.products = data.items;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // --- Modal Workflow ---
  
  onAddProductClick(): void {
    this.isSelectorModalOpen = true;
  }

  onProductSelected(product: MasterProduct): void {
    this.selectedMasterProduct = product;
    this.isSelectorModalOpen = false;
    this.isPricingModalOpen = true;
  }

  onPricingConfirm(event: { sellingPrice: number, stockQuantity: number }): void {
    if (!this.selectedMasterProduct) return;

    const request = {
      masterProductId: this.selectedMasterProduct.id,
      sellingPrice: event.sellingPrice,
      stockQty: event.stockQuantity
    };

    this.catalogService.addToStore(request).subscribe({
      next: () => {
        this.closeAllModals();
        this.loadProducts(); // Refresh the list
      },
      error: () => {
        alert(this.currentLang === 'ar' ? 'حدث خطأ أثناء الإضافة' : 'Error adding product');
      }
    });
  }

  closeAllModals(): void {
    this.isSelectorModalOpen = false;
    this.isPricingModalOpen = false;
    this.selectedMasterProduct = null;
  }
}
