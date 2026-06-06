import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-product-price-stock-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div [formGroup]="form" class="space-y-5">
      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="flex h-6 w-6 items-center justify-center rounded-lg bg-zadna-primary/10 text-zadna-primary">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </span>
          <h3 class="text-xs font-black text-slate-900">{{ 'PRODUCTS.PRICING_SECTION' | translate }}</h3>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="group block rounded-[14px] border border-slate-200 bg-slate-50/80 p-3 transition-all focus-within:border-zadna-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-zadna-primary/5"
                 [ngClass]="{ 'border-rose-300': isInvalid('tradePrice'), 'bg-rose-50/40': isInvalid('tradePrice') }">
            <span class="mb-1 block text-[0.62rem] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-zadna-primary">
              {{ 'PRODUCTS.TRADE_PRICE' | translate }}
            </span>
            <div class="flex items-end gap-1.5">
              <input type="number" min="0" step="0.01" formControlName="tradePrice"
                class="min-w-0 flex-1 bg-transparent text-lg font-black text-slate-900 outline-none placeholder:text-slate-300">
              <span class="pb-0.5 text-[0.65rem] font-black text-slate-400">{{ 'COMMON.EGP' | translate }}</span>
            </div>
          </label>

          <label class="group block rounded-[14px] border border-slate-200 bg-slate-50/80 p-3 transition-all focus-within:border-zadna-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-zadna-primary/5"
                 [ngClass]="{ 'border-rose-300': isInvalid('sellingPrice'), 'bg-rose-50/40': isInvalid('sellingPrice') }">
            <span class="mb-1 block text-[0.62rem] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-zadna-primary">
              {{ 'PRODUCTS.SELLING_PRICE' | translate }}
            </span>
            <div class="flex items-end gap-1.5">
              <input type="number" min="0" step="0.01" formControlName="sellingPrice"
                class="min-w-0 flex-1 bg-transparent text-lg font-black text-emerald-600 outline-none placeholder:text-slate-300">
              <span class="pb-0.5 text-[0.65rem] font-black text-slate-400">{{ 'COMMON.EGP' | translate }}</span>
            </div>
          </label>

          <label class="group block rounded-[14px] border border-slate-200 bg-slate-50/80 p-3 transition-all focus-within:border-zadna-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-zadna-primary/5"
                 [ngClass]="{ 'border-rose-300': isInvalid('discountPercentage') }">
            <span class="mb-1 block text-[0.62rem] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-zadna-primary">
              {{ 'PRODUCTS.DISCOUNT_LABEL' | translate }}
            </span>
            <div class="flex items-end gap-1.5">
              <input type="number" min="0" max="99" step="0.01" formControlName="discountPercentage"
                class="min-w-0 flex-1 bg-transparent text-lg font-black text-amber-600 outline-none placeholder:text-slate-300">
              <span class="pb-0.5 text-[0.65rem] font-black text-slate-400">%</span>
            </div>
            <p class="mt-1.5 text-[0.6rem] font-bold leading-relaxed text-slate-400">{{ 'PRODUCTS.DISCOUNT_HELPER' | translate }}</p>
          </label>
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
          </span>
          <h3 class="text-xs font-black text-slate-900">{{ 'PRODUCTS.INVENTORY_SECTION' | translate }}</h3>
        </div>

        <label class="group block max-w-xs rounded-[14px] border border-slate-200 bg-slate-50/80 p-3 transition-all focus-within:border-zadna-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-zadna-primary/5"
               [ngClass]="{ 'border-rose-300': isInvalid('stockQty') }">
          <span class="mb-1 block text-[0.62rem] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-zadna-primary">
            {{ 'PRODUCTS.STOCK_LABEL' | translate }}
          </span>
          <div class="flex items-end gap-1.5">
            <input type="number" min="0" step="1" formControlName="stockQty"
              class="min-w-0 flex-1 bg-transparent text-lg font-black text-slate-900 outline-none placeholder:text-slate-300">
            <span class="pb-0.5 text-[0.65rem] font-black uppercase text-slate-400">{{ unitName }}</span>
          </div>
        </label>
      </section>

      <section class="overflow-hidden rounded-[18px] border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 shadow-sm">
        <h4 class="mb-3 text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-400">
          {{ 'PRODUCTS.PROFIT_SUMMARY' | translate }}
        </h4>
        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div class="rounded-[12px] border border-slate-100 bg-white p-3 shadow-sm">
            <p class="text-[0.58rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.ORIGINAL_PRICE' | translate }}</p>
            <p class="mt-0.5 text-base font-black text-slate-700">{{ compareAtPrice | number:'1.2-2' }} <span class="text-[0.65rem] text-slate-400">{{ 'COMMON.EGP' | translate }}</span></p>
          </div>
          <div class="rounded-[12px] border border-slate-100 bg-white p-3 shadow-sm">
            <p class="text-[0.58rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.SAVINGS_VALUE' | translate }}</p>
            <p class="mt-0.5 text-base font-black text-amber-600">{{ savingsValue | number:'1.2-2' }} <span class="text-[0.65rem]">{{ 'COMMON.EGP' | translate }}</span></p>
          </div>
          <div class="rounded-[12px] border border-indigo-100 bg-indigo-50/50 p-3">
            <p class="text-[0.58rem] font-black uppercase tracking-widest text-indigo-400">{{ currentLang === 'ar' ? 'ربح التاجر' : 'Vendor profit' }}</p>
            <p class="mt-0.5 text-base font-black text-indigo-700">{{ vendorProfitPerUnit | number:'1.2-2' }} <span class="text-[0.65rem]">{{ 'COMMON.EGP' | translate }}</span></p>
          </div>
          <div class="rounded-[12px] border border-rose-100 bg-rose-50/50 p-3">
            <p class="text-[0.58rem] font-black uppercase tracking-widest text-rose-400">{{ currentLang === 'ar' ? 'عمولة المنصة' : 'Platform commission' }}</p>
            <p class="mt-0.5 text-base font-black text-rose-600">{{ expectedPlatformCommission | number:'1.2-2' }} <span class="text-[0.65rem]">{{ 'COMMON.EGP' | translate }}</span></p>
          </div>
          <div class="rounded-[12px] bg-emerald-500 p-3 shadow-md shadow-emerald-500/20">
            <p class="text-[0.58rem] font-black uppercase tracking-widest text-emerald-100">{{ currentLang === 'ar' ? 'صافي التاجر' : 'Vendor net' }}</p>
            <p class="mt-0.5 text-base font-black text-white">{{ vendorNetAfterCommission | number:'1.2-2' }} <span class="text-[0.65rem] text-emerald-100">{{ 'COMMON.EGP' | translate }}</span></p>
          </div>
        </div>
      </section>
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

  isInvalid(controlName: string): boolean {
    const control = this.form?.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
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
