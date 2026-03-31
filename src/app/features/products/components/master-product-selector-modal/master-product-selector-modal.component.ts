import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CatalogService, MasterProduct, Category } from '../../../../services/catalog.service';

@Component({
  selector: 'app-master-product-selector-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-300">
      <div 
        class="flex h-full max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300"
        [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
        
        <!-- Header -->
        <div class="border-b border-slate-100 p-6 pb-4">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-black text-slate-900 tracking-tight">{{ currentLang === 'ar' ? 'اختر المنتج من بنك المنتجات' : 'Select Product from Catalog' }}</h2>
              <p class="mt-0.5 text-[0.8rem] font-bold text-slate-500">{{ currentLang === 'ar' ? 'ابحث عن المنتج الذي تود إضافته لمتجرك' : 'Search for the product you want to add to your store' }}</p>
            </div>
            <button 
              (click)="onClose()"
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 hover:scale-110 active:scale-95">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Search & Filters -->
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div class="relative flex-1 group">
              <span class="absolute inset-y-0 start-4 flex items-center text-slate-400 group-focus-within:text-zadna-primary transition-colors">
                <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"></path>
                </svg>
              </span>
              <input 
                type="text" 
                [(ngModel)]="searchTerm" 
                (keyup.enter)="loadProducts()"
                [placeholder]="currentLang === 'ar' ? 'ابحث باسم المنتج...' : 'Search by product name...'"
                class="h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 pe-4 ps-12 text-[0.85rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-[6px] focus:ring-zadna-primary/5 outline-none">
            </div>
            
            <div class="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button 
                (click)="filterByCategory('')"
                [class]="selectedCategoryId === '' ? 'bg-zadna-primary text-white shadow-lg shadow-zadna-primary/25' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
                class="whitespace-nowrap px-4 py-2.5 text-[0.78rem] font-black rounded-xl transition-all active:scale-95">
                {{ currentLang === 'ar' ? 'الكل' : 'All' }}
              </button>
              @for (cat of categories; track cat.id) {
                <button 
                  (click)="filterByCategory(cat.id)"
                  [class]="selectedCategoryId === cat.id ? 'bg-zadna-primary text-white shadow-lg shadow-zadna-primary/25' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
                  class="whitespace-nowrap px-4 py-2.5 text-[0.78rem] font-black rounded-xl transition-all active:scale-95">
                  {{ currentLang === 'ar' ? cat.nameAr : cat.nameEn }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto no-scrollbar">
          @if (isLoading) {
            <div class="flex h-64 w-full flex-col items-center justify-center gap-3">
              <div class="h-10 w-10 animate-spin rounded-full border-4 border-zadna-primary/20 border-t-zadna-primary"></div>
              <span class="text-sm font-bold text-slate-400">{{ currentLang === 'ar' ? 'جاري البحث...' : 'Searching catalog...' }}</span>
            </div>
          } @else if (products.length === 0) {
            <div class="flex h-64 flex-col items-center justify-center p-8 text-center text-slate-400">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <svg class="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <h3 class="text-base font-black text-slate-900">{{ currentLang === 'ar' ? 'لا يوجد نتائج' : 'No products found' }}</h3>
              <p class="text-sm font-bold">{{ currentLang === 'ar' ? 'جرب البحث بكلمة أخرى أو تصفية مختلفة' : 'Try searching for something else' }}</p>
            </div>
          } @else {
            <div class="p-6">
              <table class="w-full text-start">
                <thead>
                  <tr class="border-b border-slate-50 text-[0.68rem] font-black uppercase tracking-[0.12em] text-slate-400">
                    <th class="pb-3 text-start">{{ currentLang === 'ar' ? 'المنتج' : 'Product' }}</th>
                    <th class="pb-3 text-start">{{ currentLang === 'ar' ? 'البرند' : 'Brand' }}</th>
                    <th class="pb-3 text-start">{{ currentLang === 'ar' ? 'التصنيف' : 'Category' }}</th>
                    <th class="pb-3 text-start">{{ currentLang === 'ar' ? 'القياس' : 'Unit' }}</th>
                    <th class="pb-3 text-end">{{ currentLang === 'ar' ? 'إجراء' : 'Action' }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @for (product of products; track product.id) {
                    <tr 
                      (click)="onSelect(product)"
                      class="group cursor-pointer transition-colors hover:bg-slate-50/80">
                      <td class="py-3.5">
                        <div class="flex items-center gap-3">
                          <div class="h-12 w-12 shrink-0 overflow-hidden rounded-[14px] bg-slate-50 border border-slate-100 group-hover:border-zadna-primary/20 transition-all">
                            <img [src]="product.imageUrl || 'assets/images/placeholders/product.png'" class="h-full w-full object-cover">
                          </div>
                          <div>
                            <span class="block text-[0.85rem] font-black text-slate-900 group-hover:text-zadna-primary transition-colors">{{ currentLang === 'ar' ? product.nameAr : product.nameEn }}</span>
                            <span class="text-[0.68rem] font-bold text-slate-400">SKU: {{ product.id.substring(0, 8) }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5">
                        <span class="rounded-lg bg-slate-100 px-2.5 py-1 text-[0.68rem] font-black text-slate-600">
                          {{ currentLang === 'ar' ? (product.brandNameAr || 'برند عام') : (product.brandNameEn || 'General') }}
                        </span>
                      </td>
                      <td class="py-3.5">
                        <span class="text-[0.72rem] font-bold text-slate-600">
                          {{ currentLang === 'ar' ? product.categoryNameAr : product.categoryNameEn }}
                        </span>
                      </td>
                      <td class="py-3.5">
                        <span class="text-[0.72rem] font-bold text-slate-600">
                          {{ currentLang === 'ar' ? (product.unitNameAr || 'قطعة') : (product.unitNameEn || 'Piece') }}
                        </span>
                      </td>
                      <td class="py-3.5 text-end">
                        <button class="rounded-xl bg-zadna-primary/10 px-3 py-2 text-[0.72rem] font-black text-zadna-primary hover:bg-zadna-primary hover:text-white transition-all transform active:scale-90">
                           {{ currentLang === 'ar' ? 'اختيار' : 'Select' }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class MasterProductSelectorModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() selected = new EventEmitter<MasterProduct>();

  products: MasterProduct[] = [];
  categories: Category[] = [];
  selectedCategoryId: string = '';
  searchTerm: string = '';
  isLoading = true;
  currentLang: string = 'ar';

  constructor(
    private catalogService: CatalogService,
    private translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.translate.onLangChange.subscribe((event: any) => this.currentLang = event.lang);
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: () => {}
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.catalogService.getMasterProducts({
      searchTerm: this.searchTerm,
      categoryId: this.selectedCategoryId
    }).subscribe({
      next: (data) => {
        this.products = data.items;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Mock data for demonstration
        this.products = this.getMockProducts();
      }
    });
  }

  filterByCategory(id: string): void {
    this.selectedCategoryId = id;
    this.loadProducts();
  }

  onSelect(product: MasterProduct): void {
    this.selected.emit(product);
  }

  onClose() {
    this.close.emit();
  }

  getMockProducts(): MasterProduct[] {
    return [
      {
        id: '1',
        nameAr: 'طماطم طازجة',
        nameEn: 'Fresh Tomato',
        categoryNameAr: 'خضروات',
        categoryNameEn: 'Vegetables',
        brandNameAr: 'مزارع زادنا',
        brandNameEn: 'Zadana Farms',
        unitNameAr: 'كيلو',
        unitNameEn: 'KG',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop',
        categoryId: 'cat1'
      },
      {
        id: '2',
        nameAr: 'بصل أحمر مصفى',
        nameEn: 'Premium Red Onion',
        categoryNameAr: 'خضروات',
        categoryNameEn: 'Vegetables',
        brandNameAr: 'صحارى',
        brandNameEn: 'Sahara',
        unitNameAr: 'كيس (5 كجم)',
        unitNameEn: 'Bag (5KG)',
        imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=200&auto=format&fit=crop',
        categoryId: 'cat1'
      },
      {
        id: '3',
        nameAr: 'زيت دوار الشمس (1.5 لتر)',
        nameEn: 'Sunflower Oil (1.5L)',
        categoryNameAr: 'زيوت وطعام',
        categoryNameEn: 'Oils & Food',
        brandNameAr: 'عافية',
        brandNameEn: 'Afia',
        unitNameAr: 'زجاجة',
        unitNameEn: 'Bottle',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=200&auto=format&fit=crop',
        categoryId: 'cat2'
      }
    ];
  }
}
