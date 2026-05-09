import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-product-price-stock-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div [formGroup]="form" class="space-y-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5 items-start">
        <!-- Cost Price -->
        <div class="group relative rounded-[16px] border border-slate-200 bg-slate-50 p-3 transition-all focus-within:border-zadna-primary/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-zadna-primary/5">
          <label class="mb-1 block text-[0.65rem] font-black uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-zadna-primary">
            {{ currentLang === 'ar' ? 'سعر التكلفة' : 'Cost price' }}
          </label>
          <div class="flex items-center gap-2">
            <input 
              type="number" 
              formControlName="costPrice"
              class="w-full bg-transparent text-[1rem] font-black text-slate-900 outline-none placeholder:text-slate-300">
            <span class="text-[0.7rem] font-black text-slate-400 group-focus-within:text-zadna-primary transition-colors">
              {{ 'COMMON.EGP' | translate }}
            </span>
          </div>
        </div>

        <!-- Trade Price -->
        <div class="group relative rounded-[16px] border border-slate-200 bg-slate-50 p-3 transition-all focus-within:border-zadna-primary/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-zadna-primary/5">
          <label class="mb-1 block text-[0.65rem] font-black uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-zadna-primary">
            {{ currentLang === 'ar' ? 'السعر التجاري' : 'Trade price' }}
          </label>
          <div class="flex items-center gap-2">
            <input 
              type="number" 
              formControlName="tradePrice"
              class="w-full bg-transparent text-[1rem] font-black text-slate-900 outline-none placeholder:text-slate-300">
            <span class="text-[0.7rem] font-black text-slate-400 group-focus-within:text-zadna-primary transition-colors">
              {{ 'COMMON.EGP' | translate }}
            </span>
          </div>
        </div>

        <!-- Selling Price -->
        <div class="group relative rounded-[16px] border border-slate-200 bg-slate-50 p-3 transition-all focus-within:border-zadna-primary/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-zadna-primary/5">
          <label class="mb-1 block text-[0.65rem] font-black uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-zadna-primary">
            {{ currentLang === 'ar' ? 'سعر البيع' : 'Selling price' }}
          </label>
          <div class="flex items-center gap-2">
            <input 
              type="number" 
              formControlName="sellingPrice"
              class="w-full bg-transparent text-[1rem] font-black text-slate-900 outline-none placeholder:text-slate-300">
            <span class="text-[0.7rem] font-black text-slate-400 group-focus-within:text-zadna-primary transition-colors">
              {{ 'COMMON.EGP' | translate }}
            </span>
          </div>
        </div>

        <!-- Stock -->
        <div class="group relative rounded-[16px] border border-slate-200 bg-slate-50 p-3 transition-all focus-within:border-zadna-primary/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-zadna-primary/5">
          <label class="mb-1 block text-[0.65rem] font-black uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-zadna-primary">
            {{ 'PRODUCTS.STOCK_LABEL' | translate }}
          </label>
          <div class="flex items-center gap-2">
            <input 
              type="number" 
              formControlName="stockQty"
              class="w-full bg-transparent text-[1rem] font-black text-slate-900 outline-none placeholder:text-slate-300">
            <span class="text-[0.7rem] font-black uppercase text-slate-400 group-focus-within:text-zadna-primary transition-colors">
              {{ unitName }}
            </span>
          </div>
        </div>

        <!-- Discount -->
        <div class="flex flex-col gap-1.5">
          <div class="group relative rounded-[16px] border border-slate-200 bg-slate-50 p-3 transition-all focus-within:border-zadna-primary/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-zadna-primary/5">
            <label class="mb-1 block text-[0.65rem] font-black uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-zadna-primary">
              {{ 'PRODUCTS.DISCOUNT_LABEL' | translate }}
            </label>
            <div class="flex items-center gap-2">
              <input 
                type="number" 
                formControlName="discountPercentage"
                class="w-full bg-transparent text-[1rem] font-black text-slate-900 outline-none placeholder:text-slate-300">
              <span class="text-[0.8rem] font-black text-slate-400 group-focus-within:text-zadna-primary transition-colors">
                %
              </span>
            </div>
          </div>
          <p class="px-1 text-[0.6rem] font-bold text-slate-400 flex items-start gap-1">
            <svg class="h-3 w-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="leading-tight">{{ 'PRODUCTS.DISCOUNT_HELPER' | translate }}</span>
          </p>
        </div>
      </div>

      <!-- Financial Breakdown Bento Grid -->
      <div class="mt-6 rounded-[20px] border border-slate-100 bg-slate-50/50 p-4 shadow-sm">
        <h4 class="mb-3 text-[0.7rem] font-black uppercase tracking-widest text-slate-400">{{ currentLang === 'ar' ? 'ملخص الأرباح والأسعار' : 'Pricing & Profit Summary' }}</h4>
        <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          
          <!-- Final Price -->
          <div class="flex flex-col justify-center rounded-[16px] bg-white p-3 shadow-sm border border-slate-100">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              {{ 'PRODUCTS.FINAL_PRICE' | translate }}
            </span>
            <div class="flex items-baseline gap-1">
              <strong class="text-[1.05rem] font-black text-emerald-600">
                {{ sellingPrice | number:'1.2-2' }}
              </strong>
              <span class="text-[0.65rem] font-black text-emerald-600/70">{{ 'COMMON.EGP' | translate }}</span>
            </div>
          </div>

          <!-- Original Price -->
          <div class="flex flex-col justify-center rounded-[16px] bg-white p-3 shadow-sm border border-slate-100">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              {{ 'PRODUCTS.ORIGINAL_PRICE' | translate }}
            </span>
            <div class="flex items-baseline gap-1">
              <strong class="text-[1.05rem] font-black text-slate-700">
                {{ compareAtPrice | number:'1.2-2' }}
              </strong>
              <span class="text-[0.65rem] font-black text-slate-400">{{ 'COMMON.EGP' | translate }}</span>
            </div>
          </div>

          <!-- Savings Value -->
          <div class="flex flex-col justify-center rounded-[16px] bg-white p-3 shadow-sm border border-slate-100">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              {{ 'PRODUCTS.SAVINGS_VALUE' | translate }}
            </span>
            <div class="flex items-baseline gap-1">
              <strong class="text-[1.05rem] font-black text-amber-600">
                {{ savingsValue | number:'1.2-2' }}
              </strong>
              <span class="text-[0.65rem] font-black text-amber-600/70">{{ 'COMMON.EGP' | translate }}</span>
            </div>
          </div>

          <!-- Vendor Profit -->
          <div class="flex flex-col justify-center rounded-[16px] bg-white p-3 shadow-sm border border-slate-100 relative overflow-hidden group">
            <div class="absolute inset-y-0 start-0 w-1 bg-indigo-400 rounded-s-[16px]"></div>
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-slate-400 mb-0.5 ps-1.5">
              {{ currentLang === 'ar' ? 'ربح التاجر' : 'Vendor profit' }}
            </span>
            <div class="flex items-baseline gap-1 ps-1.5">
              <strong class="text-[1.05rem] font-black text-slate-800">
                {{ vendorProfitPerUnit | number:'1.2-2' }}
              </strong>
              <span class="text-[0.65rem] font-black text-slate-400">{{ 'COMMON.EGP' | translate }}</span>
            </div>
          </div>

          <!-- Platform Commission -->
          <div class="flex flex-col justify-center rounded-[16px] bg-white p-3 shadow-sm border border-slate-100 relative overflow-hidden group">
            <div class="absolute inset-y-0 start-0 w-1 bg-rose-400 rounded-s-[16px]"></div>
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-slate-400 mb-0.5 ps-1.5">
              {{ currentLang === 'ar' ? 'عمولة المنصة' : 'Platform commission' }}
            </span>
            <div class="flex items-baseline gap-1 ps-1.5">
              <strong class="text-[1.05rem] font-black text-rose-600">
                {{ expectedPlatformCommission | number:'1.2-2' }}
              </strong>
              <span class="text-[0.65rem] font-black text-rose-600/70">{{ 'COMMON.EGP' | translate }}</span>
            </div>
          </div>

          <!-- Vendor Net -->
          <div class="flex flex-col justify-center rounded-[16px] bg-emerald-500 p-3 shadow-md relative overflow-hidden group transform transition-transform hover:-translate-y-0.5">
            <div class="absolute -right-4 -top-4 w-12 h-12 bg-white/20 rounded-full blur-xl pointer-events-none"></div>
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-emerald-100 mb-0.5 relative z-10">
              {{ currentLang === 'ar' ? 'صافي التاجر' : 'Vendor net' }}
            </span>
            <div class="flex items-baseline gap-1 relative z-10">
              <strong class="text-[1.15rem] font-black text-white">
                {{ vendorNetAfterCommission | number:'1.2-2' }}
              </strong>
              <span class="text-[0.65rem] font-black text-emerald-100">{{ 'COMMON.EGP' | translate }}</span>
            </div>
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
  @Input() currentLang: string = 'ar';
  @Input() commissionRate: number | null = 5;

  get costPrice(): number {
    return this.readNumber('costPrice');
  }

  get tradePrice(): number {
    return this.readNumber('tradePrice');
  }

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

  get vendorProfitPerUnit(): number {
    return Number(Math.max(this.sellingPrice - this.tradePrice, 0).toFixed(2));
  }

  get expectedPlatformCommission(): number {
    const rate = this.commissionRate ?? 0;
    return Number(((this.vendorProfitPerUnit * rate) / 100).toFixed(2));
  }

  get vendorNetAfterCommission(): number {
    return Number(Math.max(this.vendorProfitPerUnit - this.expectedPlatformCommission, 0).toFixed(2));
  }

  private readNumber(controlName: string): number {
    const value = Number(this.form?.get(controlName)?.value ?? 0);
    return Number.isFinite(value) ? value : 0;
  }
}
