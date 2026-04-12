import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrdersService } from '../../services/orders.service';
import { CatalogService } from '../../../products/services/catalog.service';
import { Category, VendorProduct } from '../../../products/models/catalog.models';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppCategorySelectorComponent } from '../../../../shared/components/ui/category-selector/category-selector.component';

@Component({
  selector: 'app-manual-order-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    AppPageHeaderComponent,
    AppButtonComponent,
    AppCategorySelectorComponent
  ],
  template: `
    <div class="space-y-6 animate-fade-in pb-20">
      <app-page-header
        [title]="'ORDERS.CREATE_MANUAL_ORDER' | translate"
        [description]="'ORDERS.CREATE_MANUAL_ORDER_DESC' | translate"
        [showBack]="true"
        backLink="/orders">
      </app-page-header>

      <div class="max-w-5xl mx-auto">
        <!-- Wizard Progress -->
        <div class="flex items-center justify-between mb-8 px-4">
          <div class="flex flex-col items-center gap-2">
            <div [class]="'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ' + (currentStep >= 1 ? 'bg-zadna-primary text-white shadow-lg shadow-zadna-primary/30' : 'bg-slate-100 text-slate-400')">1</div>
            <span [class]="'text-[10px] font-black uppercase tracking-widest ' + (currentStep >= 1 ? 'text-zadna-primary' : 'text-slate-400')">{{ 'ORDERS.SELECT_CUSTOMER' | translate }}</span>
          </div>
          <div class="flex-1 h-px bg-slate-200 mx-4 mb-6"></div>
          <div class="flex flex-col items-center gap-2">
            <div [class]="'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ' + (currentStep >= 2 ? 'bg-zadna-primary text-white shadow-lg shadow-zadna-primary/30' : 'bg-slate-100 text-slate-400')">2</div>
            <span [class]="'text-[10px] font-black uppercase tracking-widest ' + (currentStep >= 2 ? 'text-zadna-primary' : 'text-slate-400')">{{ 'ORDERS.ADD_PRODUCTS' | translate }}</span>
          </div>
          <div class="flex-1 h-px bg-slate-200 mx-4 mb-6"></div>
          <div class="flex flex-col items-center gap-2">
            <div [class]="'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ' + (currentStep >= 3 ? 'bg-zadna-primary text-white shadow-lg shadow-zadna-primary/30' : 'bg-slate-100 text-slate-400')">3</div>
            <span [class]="'text-[10px] font-black uppercase tracking-widest ' + (currentStep >= 3 ? 'text-zadna-primary' : 'text-slate-400')">{{ 'ORDERS.ORDER_SUMMARY' | translate }}</span>
          </div>
        </div>

        <!-- Step 1: Customer Selection -->
        <div *ngIf="currentStep === 1" class="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 shadow-sm animate-slide-up">
           <div class="flex flex-col gap-6 max-w-2xl mx-auto">
              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider">{{ 'ORDERS.CUSTOMER_PHONE' | translate }} *</label>
                <div class="relative">
                  <input type="text" [(ngModel)]="customerPhone" 
                    class="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-700 outline-none focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all"
                    placeholder="01xxxxxxxxx">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider">{{ 'ORDERS.CUSTOMER_NAME' | translate }} *</label>
                <input type="text" [(ngModel)]="customerName"
                  class="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-700 outline-none focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all">
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider">{{ 'ORDERS.DELIVERY_ADDRESS' | translate }} *</label>
                <textarea [(ngModel)]="customerAddress" rows="3"
                  class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-700 outline-none focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all resize-none"></textarea>
              </div>

              <div class="flex justify-end pt-4">
                <app-button 
                  [disabled]="!customerPhone || !customerName || !customerAddress"
                  (click)="nextStep()">
                  {{ 'COMMON.CONTINUE' | translate }}
                </app-button>
              </div>
           </div>
        </div>

        <!-- Step 2: Product Addition -->
        <div *ngIf="currentStep === 2" class="space-y-6 animate-slide-up">
           <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Catalog & Filter -->
              <div class="lg:col-span-2 space-y-6">
                <div class="bg-white rounded-[2rem] border border-slate-200/60 p-6 shadow-sm">
                   <app-category-selector
                    [categories]="categories"
                    [isAr]="translate.currentLang === 'ar'"
                    (categoryChange)="onCategoryFilterChange($event)">
                   </app-category-selector>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div *ngFor="let product of filteredProducts" class="bg-white p-4 rounded-3xl border border-slate-200/60 flex items-center gap-4 hover:shadow-md transition-all group">
                      <img [src]="product.imageUrl" class="w-16 h-16 rounded-2xl object-cover bg-slate-50">
                      <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-bold text-slate-800 truncate">{{ translate.currentLang === 'ar' ? product.nameAr : product.nameEn }}</h4>
                        <p class="text-xs font-black text-zadna-primary">{{ product.sellingPrice }} {{ 'COMMON.EGP' | translate }}</p>
                      </div>
                      <button (click)="addProduct(product)" class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-zadna-primary hover:text-white transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                   </div>
                </div>
              </div>

              <!-- Cart/Selection sidebar -->
              <div class="bg-slate-900 rounded-[2.5rem] p-6 text-white h-fit sticky top-6">
                <h3 class="text-sm font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {{ 'ORDERS.SELECTED_ITEMS' | translate }}
                </h3>

                <div class="space-y-4 max-h-[400px] overflow-y-auto mb-6 pr-2">
                  <div *ngFor="let item of selectedItems" class="flex items-center gap-3 animate-slide-in">
                    <div class="flex-1 min-w-0">
                       <p class="text-xs font-bold truncate">{{ translate.currentLang === 'ar' ? item.nameAr : item.nameEn }}</p>
                       <p class="text-[10px] text-white/50">{{ item.quantity }} x {{ item.price }} {{ 'COMMON.EGP' | translate }}</p>
                    </div>
                    <div class="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                      <button (click)="updateQty(item, -1)" class="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded">-</button>
                      <span class="text-xs font-black w-4 text-center">{{ item.quantity }}</span>
                      <button (click)="updateQty(item, 1)" class="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded">+</button>
                    </div>
                  </div>
                  <div *ngIf="selectedItems.length === 0" class="py-12 text-center">
                    <p class="text-xs font-bold text-white/30">{{ 'ORDERS.NO_ITEMS_SELECTED' | translate }}</p>
                  </div>
                </div>

                <div class="border-t border-white/10 pt-6 space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-white/50">{{ 'ORDERS.SUBTOTAL' | translate }}</span>
                    <span class="text-sm font-black">{{ calculateTotal() }} {{ 'COMMON.EGP' | translate }}</span>
                  </div>
                  <app-button 
                    variant="primary"
                    customClass="w-full !rounded-2xl"
                    [disabled]="selectedItems.length === 0"
                    (click)="nextStep()">
                    {{ 'COMMON.CONTINUE' | translate }}
                  </app-button>
                </div>
              </div>
           </div>
        </div>

        <!-- Step 3: Summary -->
        <div *ngIf="currentStep === 3" class="max-w-3xl mx-auto space-y-6 animate-slide-up">
           <div class="bg-white rounded-[2.5rem] border border-slate-200/60 overflow-hidden shadow-sm">
             <div class="p-8 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-zadna-primary/10 text-zadna-primary flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-black text-slate-900">{{ 'ORDERS.CONFIRM_ORDER' | translate }}</h3>
                  <p class="text-xs font-bold text-slate-400">{{ 'ORDERS.REVIEW_BEFORE_SUBMIT' | translate }}</p>
                </div>
             </div>
             
             <div class="p-8 space-y-8">
               <!-- Customer Summary -->
               <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div class="space-y-4">
                   <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ 'ORDERS.CUSTOMER_INFO' | translate }}</h4>
                   <div class="flex flex-col gap-1">
                     <p class="text-sm font-black text-slate-800">{{ customerName }}</p>
                     <p class="text-xs font-bold text-slate-500">{{ customerPhone }}</p>
                     <p class="text-xs font-bold text-slate-500 leading-relaxed">{{ customerAddress }}</p>
                   </div>
                 </div>
                 <div class="space-y-4">
                   <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ 'ORDERS.PAYMENT_DETAILS' | translate }}</h4>
                   <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-bold text-slate-500">{{ 'ORDERS.TOTAL' | translate }}</span>
                        <span class="text-lg font-black text-zadna-primary">{{ calculateTotal() }} {{ 'COMMON.EGP' | translate }}</span>
                      </div>
                      <p class="text-[10px] font-black text-slate-400 uppercase">{{ 'ORDERS.PAYMENT_ON_DELIVERY' | translate }}</p>
                   </div>
                 </div>
               </div>

               <!-- Items list -->
               <div class="space-y-4">
                 <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ 'ORDERS.ORDER_ITEMS' | translate }}</h4>
                 <div class="border border-slate-100 rounded-2xl overflow-hidden">
                   <table class="w-full text-sm">
                     <thead class="bg-slate-50 border-b border-slate-100">
                       <tr>
                         <th class="px-4 py-3 text-right font-black text-[10px] uppercase text-slate-400">{{ 'ORDERS.ITEM' | translate }}</th>
                         <th class="px-4 py-3 text-center font-black text-[10px] uppercase text-slate-400">{{ 'ORDERS.QTY' | translate }}</th>
                         <th class="px-4 py-3 text-left font-black text-[10px] uppercase text-slate-400">{{ 'ORDERS.TOTAL' | translate }}</th>
                       </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-50">
                       <tr *ngFor="let item of selectedItems">
                         <td class="px-4 py-4 font-bold text-slate-700">{{ translate.currentLang === 'ar' ? item.nameAr : item.nameEn }}</td>
                         <td class="px-4 py-4 text-center font-black text-slate-600">{{ item.quantity }}</td>
                         <td class="px-4 py-4 text-left font-black text-slate-900">{{ item.price * item.quantity }} {{ 'COMMON.EGP' | translate }}</td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
           </div>

           <div class="flex justify-between gap-4">
             <app-button variant="secondary" (click)="prevStep()">{{ 'COMMON.BACK' | translate }}</app-button>
             <app-button [isLoading]="isSubmitting" (click)="placeOrder()">{{ 'ORDERS.PLACE_ORDER' | translate }}</app-button>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ManualOrderCreateComponent implements OnInit {
  currentStep = 1;
  customerPhone = '';
  customerName = '';
  customerAddress = '';
  
  categories: Category[] = [];
  products: VendorProduct[] = [];
  filteredProducts: VendorProduct[] = [];
  selectedItems: any[] = [];
  
  isSubmitting = false;

  constructor(
    private ordersService: OrdersService,
    private catalogService: CatalogService,
    private router: Router,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.catalogService.getCategories().subscribe(res => this.categories = res);
    this.catalogService.getVendorProducts({ pageSize: 50 }).subscribe(res => {
      this.products = res.items;
      this.filteredProducts = res.items;
    });
  }

  nextStep(): void {
    if (this.currentStep < 3) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  onCategoryFilterChange(catId: string | null): void {
    if (catId) {
      this.filteredProducts = this.products.filter(p => p.categoryId === catId);
    } else {
      this.filteredProducts = this.products;
    }
  }

  addProduct(product: VendorProduct): void {
    const existing = this.selectedItems.find(i => i.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.selectedItems.push({
        id: product.id,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        price: product.sellingPrice,
        quantity: 1
      });
    }
  }

  updateQty(item: any, delta: number): void {
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.selectedItems = this.selectedItems.filter(i => i !== item);
    }
  }

  calculateTotal(): number {
    return this.selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  placeOrder(): void {
    this.isSubmitting = true;
    const orderData = {
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerAddress: this.customerAddress,
      items: this.selectedItems.map(i => ({
        id: i.id,
        nameAr: i.nameAr,
        nameEn: i.nameEn,
        quantity: i.quantity,
        price: i.price,
        total: i.price * i.quantity
      })),
      total: this.calculateTotal(),
      paymentMethodType: 'COD',
      paymentMethodLabel: 'نقداً عند الاستلام'
    };

    this.ordersService.createOrder(orderData).subscribe({
      next: () => {
        this.isSubmitting = false;
        alert(this.translate.instant('ORDERS.ORDER_PLACED_SUCCESS'));
        this.router.navigate(['/orders']);
      },
      error: () => {
        this.isSubmitting = false;
        alert(this.translate.instant('COMMON.ERROR_OCCURRED'));
      }
    });
  }
}
