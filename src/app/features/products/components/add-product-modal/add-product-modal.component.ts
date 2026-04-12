import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MasterProduct } from '../../models/catalog.models';
import { ProductPriceStockFormComponent } from '../product-price-stock-form/product-price-stock-form.component';

@Component({
  selector: 'app-add-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ProductPriceStockFormComponent],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40 animate-in fade-in duration-300">
      <div 
        class="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
        
        <!-- Header -->
        <div class="relative p-6 pb-2">
          <button 
            (click)="onClose()"
            class="absolute end-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div class="flex items-center gap-4">
            <div class="h-16 w-16 overflow-hidden rounded-[18px] bg-slate-50 border border-slate-100">
              <img [src]="product?.imageUrl || 'assets/images/placeholders/product.svg'" class="h-full w-full object-cover">
            </div>
            <div>
              <h2 class="text-base font-black text-slate-900 truncate max-w-sm">{{ currentLang === 'ar' ? product?.nameAr : product?.nameEn }}</h2>
              <p class="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">{{ currentLang === 'ar' ? product?.categoryNameAr : product?.categoryNameEn }}</p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6">
          <form [formGroup]="productForm" (submit)="onSubmit($event)" class="space-y-6">
            
            <app-product-price-stock-form 
              [form]="productForm" 
              [unitName]="(currentLang === 'ar' ? product?.unitNameAr : product?.unitNameEn) || ''">
            </app-product-price-stock-form>

            <div class="flex items-center gap-3 pt-2">
              <button 
                type="button"
                (click)="onClose()"
                class="flex-1 rounded-[16px] border border-slate-200 py-3 text-[0.8rem] font-black text-slate-500 transition-all hover:bg-slate-50 active:scale-[0.98]">
                {{ 'COMMON.CANCEL' | translate }}
              </button>
              <button 
                type="submit"
                [disabled]="productForm.invalid"
                class="flex-[2] rounded-[16px] bg-zadna-primary py-3 text-[0.8rem] font-black text-white shadow-lg shadow-zadna-primary/25 transition-all hover:bg-zadna-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
                {{ 'PRODUCTS.ADD_TO_STORE_NOW' | translate }}
              </button>
            </div>
          </form>
        </div>

        <!-- Footer Hint -->
        <div class="bg-slate-50/50 p-4 text-center">
          <p class="text-[0.65rem] font-medium text-slate-400">
            {{ 'PRODUCTS.AGREE_POLICIES' | translate }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `]
})
export class AddProductModalComponent {
  @Input() product: MasterProduct | null = null;
  @Input() currentLang: string = 'ar';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ sellingPrice: number, stockQuantity: number, discountPercentage: number }>();

  productForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.productForm = this.fb.group({
      sellingPrice: [null, [Validators.required, Validators.min(0.01)]],
      stockQty: [0, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  onClose() {
    this.close.emit();
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      this.confirm.emit({ 
        sellingPrice: formValue.sellingPrice, 
        stockQuantity: formValue.stockQty,
        discountPercentage: formValue.discountPercentage
      });
    }
  }
}
