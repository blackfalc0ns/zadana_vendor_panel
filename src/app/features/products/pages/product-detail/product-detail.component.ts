import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CatalogService, VendorProduct } from '../../../../services/catalog.service';
import { ProductStatusBadgeComponent } from '../../components/product-status-badge/product-status-badge.component';
import { ProductMediaCardComponent } from '../../components/product-media-card/product-media-card.component';
import { ProductPriceStockFormComponent } from '../../components/product-price-stock-form/product-price-stock-form.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterModule,
    ProductStatusBadgeComponent,
    ProductMediaCardComponent,
    ProductPriceStockFormComponent
  ],
  template: `
    <div class="px-2 pb-12 sm:px-0" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <!-- Sticky Action Header -->
      <div class="sticky top-0 z-20 -mx-4 mb-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-4 backdrop-blur-md sm:mx-0 sm:rounded-[24px] sm:border sm:px-6">
        <div class="flex items-center gap-4">
          <button 
            routerLink="/products"
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition-all hover:text-zadna-primary hover:shadow-md active:scale-95">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" [attr.d]="currentLang === 'ar' ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'"></path>
            </svg>
          </button>
          <div>
            <h1 class="text-[0.95rem] font-black text-slate-900 tracking-tight sm:text-xl">{{ 'PRODUCTS.DETAILS_TITLE' | translate }}</h1>
            <p class="hidden text-[0.7rem] font-bold text-slate-400 sm:block">{{ 'PRODUCTS.DETAILS_SUBTITLE' | translate }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Status Toggle -->
          <button 
            (click)="toggleStatus()"
            class="hidden transition-all hover:scale-105 active:scale-95 sm:block">
            <app-product-status-badge [isActive]="product?.isActive || false"></app-product-status-badge>
          </button>

          <button 
            (click)="saveChanges()"
            [disabled]="productForm.invalid || isSaving"
            class="flex items-center justify-center gap-2 rounded-xl bg-zadna-primary px-6 py-2.5 text-[0.75rem] font-black text-white shadow-xl shadow-zadna-primary/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale">
            @if (isSaving) {
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
            }
            {{ 'PRODUCTS.SAVE_CHANGES' | translate }}
          </button>
        </div>
      </div>

      @if (isLoading) {
        <div class="flex h-96 flex-col items-center justify-center gap-4">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-zadna-primary/10 border-t-zadna-primary"></div>
          <span class="text-sm font-bold text-slate-400 animate-pulse">{{ 'COMMON.LOADING' | translate }}...</span>
        </div>
      } @else if (product) {
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          <!-- Left Column: Media & Primary Info -->
          <div class="space-y-6 lg:col-span-4">
            <app-product-media-card 
              [imageUrl]="product.imageUrl || null" 
              [canChange]="true"
              (onChange)="onHandleImageChange()">
            </app-product-media-card>

            <!-- Basic Info Summary -->
            <div class="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
              <h3 class="mb-4 text-[0.8rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.BASIC_INFO' | translate }}</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-[0.8rem] font-bold text-slate-500">{{ 'PRODUCTS.BRAND' | translate }}</span>
                  <span class="text-[0.8rem] font-black text-slate-900">{{ currentLang === 'ar' ? product.brandNameAr : product.brandNameEn }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[0.8rem] font-bold text-slate-500">{{ 'PRODUCTS.CATEGORY' | translate }}</span>
                  <span class="inline-flex rounded-lg bg-slate-50 px-2 py-1 text-[0.75rem] font-black text-zadna-primary">{{ currentLang === 'ar' ? product.categoryNameAr : product.categoryNameEn }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[0.8rem] font-bold text-slate-500">{{ 'PRODUCTS.UNIT' | translate }}</span>
                  <span class="text-[0.8rem] font-black text-slate-900">{{ currentLang === 'ar' ? product.unitNameAr : product.unitNameEn }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Forms & Technical Details -->
          <div class="space-y-6 lg:col-span-8">
            <form [formGroup]="productForm" class="space-y-6">
              
              <!-- Pricing & Stock Card -->
              <div class="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                <div class="mb-6 flex items-center justify-between border-b border-slate-50 pb-4">
                  <h3 class="text-[0.9rem] font-black text-slate-900">{{ 'PRODUCTS.PRICING_STOCK' | translate }}</h3>
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>

                <app-product-price-stock-form 
                  [form]="productForm" 
                  [unitName]="(currentLang === 'ar' ? product.unitNameAr : product.unitNameEn) || ''">
                </app-product-price-stock-form>
              </div>

              <!-- Catalog Details -->
              <div class="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                <div class="mb-6 flex items-center justify-between border-b border-slate-50 pb-4">
                  <h3 class="text-[0.9rem] font-black text-slate-900">{{ 'PRODUCTS.CATALOG_INFO' | translate }}</h3>
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>

                <div class="space-y-6">
                  <div class="space-y-2">
                    <label class="text-[0.75rem] font-black text-slate-500">{{ 'PRODUCTS.HEADER_PRODUCT' | translate }}</label>
                    <p class="text-[0.95rem] font-black text-slate-900 leading-relaxed">
                      {{ currentLang === 'ar' ? product.nameAr : product.nameEn }}
                    </p>
                  </div>

                  <div class="space-y-2">
                    <label class="text-[0.75rem] font-black text-slate-500">{{ 'PRODUCTS.DESCRIPTION' | translate }}</label>
                    <p class="text-[0.82rem] font-medium leading-relaxed text-slate-500">
                      {{ 'PRODUCTS.CATALOG_DESC_NOTE' | translate }}
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  productId: string | null = null;
  product: VendorProduct | null = null;
  isLoading = true;
  isSaving = false;
  currentLang = 'ar';
  private langSub: Subscription;
  productForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe(event => this.currentLang = event.lang);

    this.productForm = this.fb.group({
      sellingPrice: [0, [Validators.required, Validators.min(0.01)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      stockQty: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.loadProduct(this.productId);
    } else {
      this.router.navigate(['/products']);
    }
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
  }

  loadProduct(id: string): void {
    this.isLoading = true;
    this.catalogService.getVendorProductById(id).subscribe({
      next: (data) => {
        this.product = data;
        this.productForm.patchValue({
          sellingPrice: data.sellingPrice,
          discountPercentage: data.discountPercentage || 0,
          stockQty: data.stockQty
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/products']);
      }
    });
  }

  toggleStatus(): void {
    if (!this.product) return;
    this.product.isActive = !this.product.isActive;
  }

  onHandleImageChange(): void {
    console.log('Change image clicked');
    // Implement image upload logic here
  }

  saveChanges(): void {
    if (this.productForm.invalid || !this.product) return;

    this.isSaving = true;
    const updateData = {
      ...this.productForm.value,
      isActive: this.product.isActive
    };

    this.catalogService.updateVendorProduct(this.product.id, updateData).subscribe({
      next: () => {
        this.isSaving = false;
        this.translate.get('PRODUCTS.UPDATE_SUCCESS').subscribe(msg => alert(msg));
        this.router.navigate(['/products']);
      },
      error: () => {
        this.isSaving = false;
        this.translate.get('PRODUCTS.UPDATE_ERROR').subscribe(msg => alert(msg));
      }
    });
  }
}
