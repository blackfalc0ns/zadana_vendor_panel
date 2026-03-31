import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MasterProduct } from '../../../../services/catalog.service';

@Component({
  selector: 'app-add-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40 animate-in fade-in duration-300">
      <div 
        class="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
        
        <!-- Header -->
        <div class="relative p-6 pb-0">
          <button 
            (click)="onClose()"
            class="absolute end-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div class="mb-4 flex items-center gap-4">
            <div class="h-16 w-16 overflow-hidden rounded-[18px] bg-slate-50 border border-slate-100">
              <img [src]="product?.imageUrl || 'assets/images/placeholders/product.png'" class="h-full w-full object-cover">
            </div>
            <div>
              <h2 class="text-base font-black text-slate-900">{{ currentLang === 'ar' ? product?.nameAr : product?.nameEn }}</h2>
              <p class="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">{{ currentLang === 'ar' ? product?.categoryNameAr : product?.categoryNameEn }}</p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6 pt-2">
          <form (submit)="onSubmit($event)" class="grid gap-4">
            <div class="grid gap-1.5">
              <label class="text-[0.72rem] font-black uppercase tracking-tight text-slate-500 px-1">
                {{ currentLang === 'ar' ? 'سعر البيع (ج.م)' : 'Selling Price (EGP)' }}
              </label>
              <input 
                type="number" 
                [(ngModel)]="sellingPrice" 
                name="sellingPrice"
                required
                placeholder="0.00"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.9rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-[4px] focus:ring-zadna-primary/5">
            </div>

            <div class="grid gap-1.5">
              <label class="text-[0.72rem] font-black uppercase tracking-tight text-slate-500 px-1">
                {{ currentLang === 'ar' ? 'الكمية المتوفرة' : 'Stock Quantity' }}
              </label>
              <input 
                type="number" 
                [(ngModel)]="stockQuantity" 
                name="stockQuantity"
                required
                placeholder="100"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.9rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-[4px] focus:ring-zadna-primary/5">
            </div>

            <div class="mt-2 flex items-center gap-3">
              <button 
                type="button"
                (click)="onClose()"
                class="flex-1 rounded-[16px] border border-slate-200 py-3 text-[0.8rem] font-black text-slate-500 transition-all hover:bg-slate-50 active:scale-[0.98]">
                {{ 'COMMON.CANCEL' | translate }}
              </button>
              <button 
                type="submit"
                [disabled]="!sellingPrice || stockQuantity < 0"
                class="flex-[2] rounded-[16px] bg-zadna-primary py-3 text-[0.8rem] font-black text-white shadow-lg shadow-zadna-primary/25 transition-all hover:bg-zadna-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
                {{ currentLang === 'ar' ? 'إضافة للمتجر الآن' : 'Add to store now' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Footer Hint -->
        <div class="bg-slate-50/50 p-4 text-center">
          <p class="text-[0.65rem] font-medium text-slate-400">
            {{ currentLang === 'ar' ? 'بإضافتك للمنتج، فإنك توافق على سياسات التسعير الخاصة بالمنصة.' : 'By adding this product, you agree to the platform pricing policies.' }}
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
  @Output() confirm = new EventEmitter<{ sellingPrice: number, stockQuantity: number }>();

  sellingPrice: number | null = null;
  stockQuantity: number = 0;

  onClose() {
    this.close.emit();
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.sellingPrice !== null) {
      this.confirm.emit({ 
        sellingPrice: this.sellingPrice, 
        stockQuantity: this.stockQuantity 
      });
    }
  }
}
