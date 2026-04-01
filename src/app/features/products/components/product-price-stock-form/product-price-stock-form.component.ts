import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-product-price-stock-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div [formGroup]="form" class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <!-- Price -->
      <div class="space-y-1.5">
        <label class="px-1 text-[0.72rem] font-black uppercase tracking-tight text-slate-500">
          {{ 'PRODUCTS.PRICE_LABEL' | translate }}
        </label>
        <div class="group relative">
          <input 
            type="number" 
            formControlName="sellingPrice"
            class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.9rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-[4px] focus:ring-zadna-primary/5 outline-none">
          <span class="absolute end-4 top-1/2 -translate-y-1/2 text-[0.7rem] font-black text-slate-400 group-focus-within:text-zadna-primary">
            {{ 'COMMON.EGP' | translate }}
          </span>
        </div>
      </div>

      <!-- Discount -->
      <div class="space-y-1.5">
        <label class="px-1 text-[0.72rem] font-black uppercase tracking-tight text-slate-500">
          {{ 'PRODUCTS.DISCOUNT_LABEL' | translate }}
        </label>
        <div class="group relative">
          <input 
            type="number" 
            formControlName="discountPercentage"
            class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.9rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-[4px] focus:ring-zadna-primary/5 outline-none">
          <span class="absolute end-4 top-1/2 -translate-y-1/2 text-[0.7rem] font-black text-slate-400 group-focus-within:text-zadna-primary">
            %
          </span>
        </div>
        <p class="px-1 text-[0.68rem] font-bold text-slate-400">
          {{ 'PRODUCTS.DISCOUNT_HELPER' | translate }}
        </p>
      </div>

      <!-- Stock -->
      <div class="space-y-1.5">
        <label class="px-1 text-[0.72rem] font-black uppercase tracking-tight text-slate-500">
          {{ 'PRODUCTS.STOCK_LABEL' | translate }}
        </label>
        <div class="group relative">
          <input 
            type="number" 
            formControlName="stockQty"
            class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.9rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-[4px] focus:ring-zadna-primary/5 outline-none">
          <span class="absolute end-4 top-1/2 -translate-y-1/2 text-[0.7rem] font-black text-slate-400 group-focus-within:text-zadna-primary uppercase">
            {{ unitName }}
          </span>
        </div>
      </div>

      <div class="md:col-span-3 rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <div>
            <span class="text-[0.68rem] font-black uppercase tracking-tight text-emerald-700/70">
              {{ 'PRODUCTS.FINAL_PRICE' | translate }}
            </span>
            <strong class="mt-1 block text-[1.05rem] font-black text-emerald-900">
              {{ sellingPrice | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}
            </strong>
          </div>

          <div>
            <span class="text-[0.68rem] font-black uppercase tracking-tight text-slate-500">
              {{ 'PRODUCTS.ORIGINAL_PRICE' | translate }}
            </span>
            <strong class="mt-1 block text-[1.05rem] font-black text-slate-900">
              {{ compareAtPrice | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}
            </strong>
          </div>

          <div>
            <span class="text-[0.68rem] font-black uppercase tracking-tight text-orange-700/80">
              {{ 'PRODUCTS.SAVINGS_VALUE' | translate }}
            </span>
            <strong class="mt-1 block text-[1.05rem] font-black text-orange-700">
              {{ savingsValue | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}
            </strong>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
  `]
})
export class ProductPriceStockFormComponent {
  @Input() form!: FormGroup;
  @Input() unitName: string = '';

  get sellingPrice(): number {
    return this.readNumber('sellingPrice');
  }

  get discountPercentage(): number {
    return this.readNumber('discountPercentage');
  }

  get compareAtPrice(): number {
    if (this.discountPercentage <= 0 || this.discountPercentage >= 100 || this.sellingPrice <= 0) {
      return this.sellingPrice;
    }

    return Number((this.sellingPrice / (1 - this.discountPercentage / 100)).toFixed(2));
  }

  get savingsValue(): number {
    return Number(Math.max(this.compareAtPrice - this.sellingPrice, 0).toFixed(2));
  }

  private readNumber(controlName: string): number {
    const value = Number(this.form?.get(controlName)?.value ?? 0);
    return Number.isFinite(value) ? value : 0;
  }
}
