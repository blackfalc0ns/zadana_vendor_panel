import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Category, MasterProduct } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
          <div class="flex flex-col gap-3">
            <!-- Single row: Search (with pills inside) + Category pills beside it -->
            <div class="flex items-center gap-3">
              <!-- Search field with availability pills inside (fixed width) -->
              <div class="flex h-10 w-[22rem] shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:border-zadna-primary/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-zadna-primary/5">
                <span class="flex shrink-0 items-center ps-3 text-slate-400">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"></path>
                  </svg>
                </span>
                <input 
                  type="text" 
                  [(ngModel)]="searchTerm" 
                  (ngModelChange)="onSearchChange()"
                  (keyup.enter)="loadProducts()"
                  [placeholder]="currentLang === 'ar' ? 'البحث بالاسم أو الباركود...' : 'Search by name or barcode...'"
                  class="h-full min-w-0 flex-1 bg-transparent px-2 text-[0.72rem] font-bold text-slate-900 outline-none placeholder-slate-400">
                <div class="flex shrink-0 items-center gap-0.5 pe-1">
                  <button (click)="availabilityFilter = 'all'; applyClientFilters()"
                    class="rounded-md px-2 py-1 text-[0.6rem] font-black transition-all"
                    [ngClass]="availabilityFilter === 'all' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/60' : 'text-slate-400 hover:text-slate-600'">
                    {{ currentLang === 'ar' ? 'الكل' : 'All' }}
                  </button>
                  <button (click)="availabilityFilter = 'available'; applyClientFilters()"
                    class="rounded-md px-2 py-1 text-[0.6rem] font-black transition-all"
                    [ngClass]="availabilityFilter === 'available' ? 'bg-white text-zadna-primary shadow-sm ring-1 ring-zadna-primary/20' : 'text-slate-400 hover:text-slate-600'">
                    {{ currentLang === 'ar' ? 'غير مضاف' : 'New' }}
                  </button>
                  <button (click)="availabilityFilter = 'inStore'; applyClientFilters()"
                    class="rounded-md px-2 py-1 text-[0.6rem] font-black transition-all"
                    [ngClass]="availabilityFilter === 'inStore' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-200/60' : 'text-slate-400 hover:text-slate-600'">
                    {{ currentLang === 'ar' ? 'في متجري' : 'Mine' }}
                  </button>
                </div>
              </div>

              <!-- Category pills (scrollable, takes remaining space) -->
              <div
                #categoryScroller
                class="no-scrollbar flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [touch-action:pan-x] [-webkit-overflow-scrolling:touch]"
                (wheel)="onCategoryWheel($event)">
                <button 
                  (click)="filterByCategory('')"
                  class="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[0.65rem] font-black transition-all active:scale-95"
                  [ngClass]="selectedCategoryId === '' ? 'bg-zadna-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'">
                  {{ currentLang === 'ar' ? 'الكل' : 'All' }}
                </button>
                @for (cat of categories; track cat.id) {
                  <button 
                    (click)="filterByCategory(cat.id)"
                    class="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[0.65rem] font-black transition-all active:scale-95"
                    [ngClass]="selectedCategoryId === cat.id ? 'bg-zadna-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'">
                    {{ currentLang === 'ar' ? cat.nameAr : cat.nameEn }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto no-scrollbar">
          @if (isLoading) {
            <div class="p-4 space-y-3">
              @for (row of [1,2,3,4,5,6]; track row) {
                <div class="flex items-center gap-4 rounded-2xl border border-slate-50 p-4">
                  <span class="vendor-skeleton vendor-skeleton-avatar"></span>
                  <div class="flex-1 space-y-2">
                    <span class="vendor-skeleton vendor-skeleton-line w-3/4"></span>
                    <span class="vendor-skeleton vendor-skeleton-line sm w-1/2"></span>
                  </div>
                </div>
              }
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
            <div class="overflow-x-auto no-scrollbar">
              <table class="w-full text-start border-collapse">
                <thead>
                  <tr class="border-b border-slate-100 bg-slate-50/50 text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-400">
                    <th class="px-5 py-3.5 text-start w-10"></th>
                    <th class="px-5 py-3.5 text-start">{{ currentLang === 'ar' ? 'المنتج' : 'Product' }}</th>
                    <th class="px-5 py-3.5 text-start">{{ currentLang === 'ar' ? 'الحجم' : 'Size' }}</th>
                    <th class="px-5 py-3.5 text-start">{{ currentLang === 'ar' ? 'التصنيف' : 'Category' }}</th>
                    <th class="px-5 py-3.5 text-center">{{ currentLang === 'ar' ? 'الحالة' : 'Status' }}</th>
                    <th class="px-5 py-3.5 text-end">{{ currentLang === 'ar' ? 'إجراء' : 'Action' }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (group of groupedProducts; track group.groupId) {
                    <!-- Group header row (only if group has multiple sizes) -->
                    @if (group.variants.length > 1) {
                      <tr class="border-b border-slate-50 bg-slate-50/30">
                        <td class="px-5 py-2.5" colspan="6">
                          <div class="flex items-center gap-3">
                            <div class="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/60 p-0.5">
                              <img [src]="group.imageUrl || 'assets/images/placeholders/product.svg'" class="h-full w-full object-contain">
                            </div>
                            <div class="min-w-0">
                              <span class="text-[0.78rem] font-black text-slate-800">{{ group.name }}</span>
                              <span class="ms-2 inline-flex items-center rounded-md bg-violet-50 px-1.5 py-0.5 text-[0.58rem] font-black text-violet-600 ring-1 ring-violet-200/50">
                                {{ group.variants.length }} {{ currentLang === 'ar' ? 'أحجام' : 'sizes' }}
                              </span>
                            </div>
                            <span class="ms-auto text-[0.62rem] font-bold text-slate-400">{{ group.categoryName }}</span>
                          </div>
                        </td>
                      </tr>
                    }
                    <!-- Individual variant rows -->
                    @for (variant of group.variants; track variant.id; let isLast = $last) {
                      <tr
                        class="group transition-colors border-b"
                        [ngClass]="isSelected(variant.id)
                          ? 'bg-zadna-primary/5 border-zadna-primary/10'
                          : variant.isInVendorStore
                            ? 'bg-slate-50/40 border-slate-50'
                            : 'hover:bg-slate-50/60 border-slate-50 cursor-pointer'"
                        [class.cursor-not-allowed]="variant.isInVendorStore"
                        (click)="!variant.isInVendorStore && toggleProduct(variant, $event)">

                        <!-- Checkbox -->
                        <td class="px-5 py-3">
                          @if (variant.isInVendorStore) {
                            <span class="flex h-5 w-5 items-center justify-center rounded-md bg-slate-200 text-slate-400">
                              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                            </span>
                          } @else {
                            <span class="flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all"
                              [ngClass]="isSelected(variant.id)
                                ? 'border-zadna-primary bg-zadna-primary text-white'
                                : 'border-slate-300 bg-white group-hover:border-zadna-primary/40'">
                              @if (isSelected(variant.id)) {
                                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                              }
                            </span>
                          }
                        </td>

                        <!-- Product (image + name) -->
                        <td class="px-5 py-3">
                          <div class="flex items-center gap-3" [class.opacity-50]="variant.isInVendorStore">
                            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
                              <img [src]="variant.imageUrl || group.imageUrl || 'assets/images/placeholders/product.svg'" class="h-full w-full object-contain p-0.5">
                            </div>
                            <div class="min-w-0">
                              @if (group.variants.length === 1) {
                                <span class="block truncate text-[0.8rem] font-black text-slate-900 group-hover:text-zadna-primary transition-colors">
                                  {{ currentLang === 'ar' ? variant.nameAr : variant.nameEn }}
                                </span>
                              } @else {
                                <span class="block truncate text-[0.75rem] font-bold text-slate-600">
                                  {{ currentLang === 'ar' ? variant.nameAr : variant.nameEn }}
                                </span>
                              }
                              @if (group.brandName) {
                                <span class="text-[0.62rem] font-bold text-slate-400">{{ group.brandName }}</span>
                              }
                            </div>
                          </div>
                        </td>

                        <!-- Size -->
                        <td class="px-5 py-3">
                          <span class="inline-flex items-center rounded-lg bg-cyan-50 px-2.5 py-1 text-[0.7rem] font-black text-cyan-800 ring-1 ring-cyan-200/40"
                            [class.opacity-50]="variant.isInVendorStore">
                            {{ getProductDisplaySize(variant) || (currentLang === 'ar' ? 'قياسي' : 'Standard') }}
                          </span>
                        </td>

                        <!-- Category -->
                        <td class="px-5 py-3">
                          <span class="text-[0.7rem] font-bold text-slate-500" [class.opacity-50]="variant.isInVendorStore">
                            {{ group.categoryName || (currentLang === 'ar' ? 'بدون تصنيف' : 'Uncategorized') }}
                          </span>
                        </td>

                        <!-- Status -->
                        <td class="px-5 py-3 text-center">
                          @if (variant.isInVendorStore) {
                            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.62rem] font-black text-emerald-600 ring-1 ring-emerald-200/50">
                              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                              {{ currentLang === 'ar' ? 'في متجرك' : 'In store' }}
                            </span>
                          } @else if (isSelected(variant.id)) {
                            <span class="inline-flex items-center gap-1 rounded-full bg-zadna-primary/10 px-2.5 py-1 text-[0.62rem] font-black text-zadna-primary ring-1 ring-zadna-primary/20">
                              {{ currentLang === 'ar' ? 'محدد' : 'Selected' }}
                            </span>
                          } @else {
                            <span class="text-[0.62rem] font-bold text-slate-300">—</span>
                          }
                        </td>

                        <!-- Action -->
                        <td class="px-5 py-3 text-end">
                          @if (!variant.isInVendorStore) {
                            <button
                              (click)="onSelect(variant); $event.stopPropagation()"
                              class="inline-flex h-7 items-center gap-1 rounded-lg bg-zadna-primary px-3 text-[0.62rem] font-black text-white shadow-sm opacity-0 transition-all group-hover:opacity-100 active:scale-95">
                              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                              {{ currentLang === 'ar' ? 'إضافة' : 'Add' }}
                            </button>
                          }
                        </td>
                      </tr>
                    }
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
                (click)="onRequestNew()"
                class="rounded-2xl border border-zadna-primary/20 bg-zadna-primary/10 px-4 py-2 text-xs font-black text-zadna-primary">
                {{ currentLang === 'ar' ? 'إضافة منتج' : 'Add product' }}
              </button>
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
  private readonly cdr = inject(ChangeDetectorRef);
  @Input() initialSearchTerm: string = '';
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
  availabilityFilter: 'all' | 'available' | 'inStore' = 'all';
  private searchDebounceTimer: any = null;
  private categoryDragStartX = 0;
  private categoryScrollStartLeft = 0;

  constructor(
    private catalogService: CatalogService,
    private translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.translate.onLangChange.subscribe((event: any) => this.currentLang = event.lang);
  }

  /** Products filtered by category + availability (client-side) */
  get filteredProducts(): MasterProduct[] {
    let result = this.products;

    // Category filter: include products in the selected category or any of its descendants
    if (this.selectedCategoryId) {
      const descendantIds = this.getDescendantCategoryIds(this.selectedCategoryId);
      const matchIds = new Set([this.selectedCategoryId, ...descendantIds]);
      result = result.filter(p => matchIds.has(p.categoryId));
    }

    // Availability filter
    if (this.availabilityFilter === 'available') {
      result = result.filter(p => !p.isInVendorStore);
    } else if (this.availabilityFilter === 'inStore') {
      result = result.filter(p => p.isInVendorStore);
    }

    return result;
  }

  /** Get all descendant category IDs for a given parent */
  private getDescendantCategoryIds(parentId: string): string[] {
    const descendants: string[] = [];
    const queue = [parentId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = this.allFlatCategories.filter(c => c.parentCategoryId === currentId);
      for (const child of children) {
        descendants.push(child.id);
        queue.push(child.id);
      }
    }

    return descendants;
  }

  /** Groups products by variantGroupId so the vendor sees one card per product with sizes listed inside */
  get groupedProducts(): Array<{ groupId: string; name: string; imageUrl: string; categoryName: string; brandName: string; variants: MasterProduct[] }> {
    const groupMap = new Map<string, MasterProduct[]>();

    for (const product of this.filteredProducts) {
      const key = product.variantGroupId || product.id; // standalone products use their own id as group
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(product);
    }

    const groups: Array<{ groupId: string; name: string; imageUrl: string; categoryName: string; brandName: string; variants: MasterProduct[] }> = [];

    for (const [groupId, variants] of groupMap) {
      const representative = variants[0];
      groups.push({
        groupId,
        name: this.currentLang === 'ar'
          ? (representative.nameAr || representative.nameEn || '')
          : (representative.nameEn || representative.nameAr || ''),
        imageUrl: representative.imageUrl || '',
        categoryName: (this.currentLang === 'ar'
          ? (representative.categoryNameAr || representative.categoryNameEn || '')
          : (representative.categoryNameEn || representative.categoryNameAr || '')),
        brandName: (this.currentLang === 'ar'
          ? (representative.brandNameAr || representative.brandNameEn || '')
          : (representative.brandNameEn || representative.brandNameAr || '')),
        variants
      });
    }

    return groups;
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.loadProducts();
    }, 400);
  }

  applyClientFilters(): void {
    // Triggers change detection — filteredProducts getter handles the logic
  }

  ngOnInit(): void {
    this.searchTerm = this.initialSearchTerm;
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (data) => {
        this.cdr.markForCheck();
        const flatCategories = this.flattenCategories(data);
        this.allFlatCategories = flatCategories;
        // Show level 2 categories (children of root) — the main "التصنيف" level
        const rootIds = new Set(flatCategories.filter(c => !c.parentCategoryId).map(c => c.id));
        this.categories = flatCategories.filter(c => c.parentCategoryId && rootIds.has(c.parentCategoryId));
        // Re-enrich products if already loaded
        this.enrichProductsWithCategories();
      },
      error: () => {
        this.cdr.markForCheck();}
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.catalogService.getMasterProducts({
      searchTerm: this.searchTerm,
      pageSize: 1000
    }).subscribe({
      next: (data) => {
        this.cdr.markForCheck();
        this.products = data.items;
        this.enrichProductsWithCategories();
        this.isLoading = false;
      },
      error: () => {
        this.cdr.markForCheck();
        this.isLoading = false;
        this.products = this.getMockProducts();
      }
    });
  }

  private allFlatCategories: Category[] = [];

  private enrichProductsWithCategories(): void {
    if (!this.allFlatCategories.length || !this.products.length) {
      return;
    }

    for (const product of this.products) {
      if (!product.categoryNameAr && !product.categoryNameEn) {
        const cat = this.allFlatCategories.find(c => c.id === product.categoryId);
        if (cat) {
          product.categoryNameAr = cat.nameAr;
          product.categoryNameEn = cat.nameEn;
        }
      }
    }
  }

  filterByCategory(id: string): void {
    this.selectedCategoryId = id;
    // Filter client-side — don't reload from API since we load all products
    // This allows filtering by parent category to include all sub-category products
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

  getProductDisplaySize(product: MasterProduct): string {
    const displaySize = this.currentLang === 'ar'
      ? (product.displaySizeAr || product.displaySizeEn || '')
      : (product.displaySizeEn || product.displaySizeAr || '');

    if (displaySize.trim()) {
      return displaySize;
    }

    const unit = this.currentLang === 'ar'
      ? (product.unitNameAr || product.unitNameEn || '')
      : (product.unitNameEn || product.unitNameAr || '');

    if (product.measurementValue) {
      return `${product.measurementValue} ${unit}`.trim();
    }

    return unit;
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

  private resolveCategoryLevel(category: Category, allCategories: Category[]): number {
    if (typeof category.level === 'number') {
      return category.level;
    }

    let level = 0;
    let parentId = category.parentCategoryId;

    while (parentId) {
      const parent = allCategories.find((item) => item.id === parentId);
      if (!parent) {
        break;
      }

      level += 1;
      parentId = parent.parentCategoryId || null;
    }

    return level;
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
