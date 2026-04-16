import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Category, MasterProduct } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';

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
              <h2 class="text-xl font-black text-slate-900 tracking-tight">{{ 'PRODUCTS.BANK_TITLE' | translate }}</h2>
              <p class="mt-0.5 text-[0.8rem] font-bold text-slate-500">{{ 'PRODUCTS.BANK_SUBTITLE' | translate }}</p>
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
          <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div class="relative group xl:w-[21rem] xl:min-w-[21rem]">
              <span class="absolute inset-y-0 start-4 flex items-center text-slate-400 group-focus-within:text-zadna-primary transition-colors">
                <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"></path>
                </svg>
              </span>
              <input 
                type="text" 
                [(ngModel)]="searchTerm" 
                (keyup.enter)="loadProducts()"
                [placeholder]="'PRODUCTS.SEARCH_PLACEHOLDER' | translate"
                class="h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 pe-4 ps-12 text-[0.85rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-[6px] focus:ring-zadna-primary/5 outline-none">
            </div>
            
            <div
              #categoryScroller
              class="no-scrollbar flex w-full min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [touch-action:pan-x] [-webkit-overflow-scrolling:touch] xl:cursor-grab"
              [ngClass]="isDraggingCategories ? 'xl:cursor-grabbing select-none' : ''"
              (wheel)="onCategoryWheel($event)"
              (mousedown)="onCategoryDragStart($event)"
              (mousemove)="onCategoryDragMove($event)"
              (mouseup)="onCategoryDragEnd()"
              (mouseleave)="onCategoryDragEnd()"
              (touchstart)="onCategoryTouchStart($event)"
              (touchmove)="onCategoryTouchMove($event)"
              (touchend)="onCategoryDragEnd()">
              <button 
                (click)="filterByCategory('')"
                [class]="selectedCategoryId === '' ? 'bg-zadna-primary text-white shadow-lg shadow-zadna-primary/25' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
                class="shrink-0 whitespace-nowrap px-4 py-2.5 text-[0.78rem] font-black rounded-xl transition-all active:scale-95">
                {{ 'COMMON.ALL' | translate }}
              </button>
              @for (cat of categories; track cat.id) {
                <button 
                  (click)="filterByCategory(cat.id)"
                  [class]="selectedCategoryId === cat.id ? 'bg-zadna-primary text-white shadow-lg shadow-zadna-primary/25' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
                  class="shrink-0 whitespace-nowrap px-4 py-2.5 text-[0.78rem] font-black rounded-xl transition-all active:scale-95">
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
              <span class="text-sm font-bold text-slate-400">{{ 'COMMON.LOADING' | translate }}</span>
            </div>
          } @else if (products.length === 0) {
            <div class="flex h-80 flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-slate-50 border border-slate-100 shadow-sm">
                <svg class="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-black text-slate-900 tracking-tight">
                {{ 'PRODUCTS.NO_RESULTS_FOR' | translate:{ term: searchTerm } }}
              </h3>
              <p class="mt-2 max-w-xs text-[0.8rem] font-bold text-slate-500 leading-relaxed">
                {{ 'PRODUCTS.REQUEST_HINT' | translate }}
              </p>
              
              <button 
                (click)="onRequestNew()"
                class="mt-8 flex items-center gap-2 rounded-2xl bg-zadna-primary px-8 py-3.5 text-[0.82rem] font-black text-white shadow-xl shadow-zadna-primary/25 transition-all hover:scale-105 active:scale-95">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {{ 'PRODUCTS.REQUEST_NEW_TITLE' | translate }}
              </button>
            </div>
          } @else {
            <div class="p-6">
              <table class="w-full text-start">
                <thead>
                  <tr class="border-b border-slate-50 text-[0.68rem] font-black uppercase tracking-[0.12em] text-slate-400">
                    <th class="pb-3 text-start">{{ 'COMMON.HEADER_PRODUCT' | translate }}</th>
                    <th class="pb-3 text-start">{{ 'PRODUCTS.BRAND' | translate }}</th>
                    <th class="pb-3 text-start">{{ 'PRODUCTS.CATEGORY' | translate }}</th>
                    <th class="pb-3 text-start">{{ 'PRODUCTS.UNIT' | translate }}</th>
                    <th class="pb-3 text-center">{{ currentLang === 'ar' ? 'تحديد' : 'Select' }}</th>
                    <th class="pb-3 text-end">{{ 'COMMON.ACTIONS' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @for (product of products; track product.id) {
                    <tr 
                      (click)="!product.isInVendorStore && toggleProduct(product, $event)"
                      [class.cursor-not-allowed]="product.isInVendorStore"
                      [class.bg-slate-50]="product.isInVendorStore"
                      class="group transition-colors hover:bg-slate-100/50">
                      <td class="py-3.5">
                        <div class="flex items-center gap-3" [class.opacity-60]="product.isInVendorStore">
                          <div class="h-12 w-12 shrink-0 overflow-hidden rounded-[14px] bg-slate-50 border border-slate-100 group-hover:border-zadna-primary/20 transition-all">
                            <img [src]="product.imageUrl || 'assets/images/placeholders/product.svg'" class="h-full w-full object-cover">
                          </div>
                          <div>
                            <span class="block text-[0.85rem] font-black text-slate-900 group-hover:text-zadna-primary transition-colors">{{ currentLang === 'ar' ? product.nameAr : product.nameEn }}</span>
                            <span class="text-[0.68rem] font-bold text-slate-400">{{ 'PRODUCTS.SKU' | translate }}: {{ product.id.substring(0, 8) }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5">
                        <span class="rounded-lg bg-slate-100 px-2.5 py-1 text-[0.68rem] font-black text-slate-600" [class.opacity-60]="product.isInVendorStore">
                          {{ currentLang === 'ar' ? (product.brandNameAr || ('COMMON.BRAND_GENERAL' | translate)) : (product.brandNameEn || ('COMMON.BRAND_GENERAL' | translate)) }}
                        </span>
                      </td>
                      <td class="py-3.5">
                        <span class="text-[0.72rem] font-bold text-slate-600" [class.opacity-60]="product.isInVendorStore">
                          {{ currentLang === 'ar' ? product.categoryNameAr : product.categoryNameEn }}
                        </span>
                      </td>
                      <td class="py-3.5">
                        <span class="text-[0.72rem] font-bold text-slate-600" [class.opacity-60]="product.isInVendorStore">
                          {{ currentLang === 'ar' ? (product.unitNameAr || ('PRODUCTS.UNIT_PIECE' | translate)) : (product.unitNameEn || ('PRODUCTS.UNIT_PIECE' | translate)) }}
                        </span>
                      </td>
                      <td class="py-3.5 text-center">
                        @if (!product.isInVendorStore) {
                          <input
                            type="checkbox"
                            [checked]="isSelected(product.id)"
                            (click)="$event.stopPropagation()"
                            (change)="toggleProduct(product, $event)">
                        }
                      </td>
                      <td class="py-3.5 text-end">
                        @if (product.isInVendorStore) {
                          <span class="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[0.7rem] font-black text-slate-500 whitespace-nowrap">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                            {{ 'PRODUCTS.ALREADY_ADDED' | translate }}
                          </span>
                        } @else {
                          <div class="flex items-center justify-end gap-2">
                            <button
                              (click)="onSelect(product); $event.stopPropagation()"
                              class="rounded-xl border border-slate-200 px-3 py-2 text-[0.72rem] font-black text-slate-700 transition-all transform active:scale-90">
                              {{ currentLang === 'ar' ? 'إضافة سريعة' : 'Quick add' }}
                            </button>
                            <button
                              (click)="toggleProduct(product, $event); $event.stopPropagation()"
                              class="rounded-xl bg-zadna-primary/10 px-3 py-2 text-[0.72rem] font-black text-zadna-primary hover:bg-zadna-primary hover:text-white transition-all transform active:scale-90">
                              {{ isSelected(product.id) ? (currentLang === 'ar' ? 'تم التحديد' : 'Selected') : ('PRODUCTS.BTN_SELECT' | translate) }}
                            </button>
                          </div>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
        <div class="border-t border-slate-100 bg-white px-6 py-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="text-sm font-black text-slate-600">
              {{ currentLang === 'ar' ? 'تم تحديد' : 'Selected' }}: {{ selectedProductIds.size }}
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                (click)="clearSelection()"
                class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                {{ currentLang === 'ar' ? 'مسح التحديد' : 'Clear selection' }}
              </button>
              <button
                type="button"
                (click)="confirmBulkSelection()"
                [disabled]="selectedProductIds.size === 0"
                class="rounded-2xl bg-zadna-primary px-4 py-2 text-xs font-black text-white shadow-lg shadow-zadna-primary/20 disabled:opacity-40">
                {{ currentLang === 'ar' ? 'مراجعة المحدد' : 'Review selected' }}
              </button>
            </div>
          </div>
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
  @ViewChild('categoryScroller') categoryScroller?: ElementRef<HTMLDivElement>;
  @Output() close = new EventEmitter<void>();
  @Output() selected = new EventEmitter<MasterProduct>();
  @Output() selectedBulk = new EventEmitter<MasterProduct[]>();
  @Output() requestProduct = new EventEmitter<string>();

  products: MasterProduct[] = [];
  categories: Category[] = [];
  selectedCategoryId: string = '';
  searchTerm: string = '';
  isLoading = true;
  currentLang: string = 'ar';
  selectedProductIds = new Set<string>();
  isDraggingCategories = false;
  private categoryDragStartX = 0;
  private categoryScrollStartLeft = 0;

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
      next: (data) => {
        const flatCategories = this.flattenCategories(data);
        this.categories = flatCategories.filter((category) => !!category.parentCategoryId);
      },
      error: () => {}
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.catalogService.getMasterProducts({
      searchTerm: this.searchTerm,
      categoryId: this.selectedCategoryId,
      pageSize: 1000
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

  onCategoryWheel(event: WheelEvent): void {
    const scroller = this.categoryScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) && event.deltaX === 0) {
      return;
    }

    event.preventDefault();
    scroller.scrollLeft += event.deltaX || event.deltaY;
  }

  onCategoryDragStart(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    const scroller = this.categoryScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    this.isDraggingCategories = true;
    this.categoryDragStartX = event.clientX;
    this.categoryScrollStartLeft = scroller.scrollLeft;
  }

  onCategoryDragMove(event: MouseEvent): void {
    if (!this.isDraggingCategories) {
      return;
    }

    event.preventDefault();
    const scroller = this.categoryScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    const deltaX = event.clientX - this.categoryDragStartX;
    scroller.scrollLeft = this.categoryScrollStartLeft - deltaX;
  }

  onCategoryTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    const scroller = this.categoryScroller?.nativeElement;
    if (!touch || !scroller) {
      return;
    }

    this.isDraggingCategories = true;
    this.categoryDragStartX = touch.clientX;
    this.categoryScrollStartLeft = scroller.scrollLeft;
  }

  onCategoryTouchMove(event: TouchEvent): void {
    if (!this.isDraggingCategories) {
      return;
    }

    const touch = event.touches[0];
    const scroller = this.categoryScroller?.nativeElement;
    if (!touch || !scroller) {
      return;
    }

    const deltaX = touch.clientX - this.categoryDragStartX;
    scroller.scrollLeft = this.categoryScrollStartLeft - deltaX;
  }

  onCategoryDragEnd(): void {
    this.isDraggingCategories = false;
  }

  onSelect(product: MasterProduct): void {
    this.selected.emit(product);
  }

  toggleProduct(product: MasterProduct, event?: Event): void {
    event?.stopPropagation();
    if (this.selectedProductIds.has(product.id)) {
      this.selectedProductIds.delete(product.id);
      return;
    }

    this.selectedProductIds.add(product.id);
  }

  isSelected(productId: string): boolean {
    return this.selectedProductIds.has(productId);
  }

  clearSelection(): void {
    this.selectedProductIds.clear();
  }

  confirmBulkSelection(): void {
    const selectedProducts = this.products.filter((product) => this.selectedProductIds.has(product.id));
    this.selectedBulk.emit(selectedProducts);
  }

  onClose() {
    this.close.emit();
  }

  onRequestNew(): void {
    this.requestProduct.emit(this.searchTerm);
  }

  private flattenCategories(categories: Category[] | null | undefined): Category[] {
    if (!categories?.length) {
      return [];
    }

    return categories.flatMap((category) => [
      category,
      ...this.flattenCategories(category.subCategories || [])
    ]);
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
