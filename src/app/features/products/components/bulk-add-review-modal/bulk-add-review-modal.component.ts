import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription, interval, switchMap } from 'rxjs';
import {
  BulkVendorProductDraft,
  MasterProduct,
  VendorProductBulkOperation,
  VendorProductBulkOperationItem
} from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';

type BulkReviewStage = 'review' | 'submitting' | 'done';

@Component({
  selector: 'app-bulk-add-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div class="flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl shadow-slate-900/20" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
        <div class="border-b border-slate-100 px-6 py-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-black text-slate-900">{{ currentLang === 'ar' ? 'إضافة جماعية من البنك' : 'Bulk Add From Product Bank' }}</h2>
              <p class="mt-1 text-sm font-bold text-slate-500">
                {{ currentLang === 'ar' ? 'راجع البيانات الأساسية لكل منتج قبل الإرسال.' : 'Review the basic values for each product before submit.' }}
              </p>
            </div>
            <button type="button" (click)="onClose()" class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200">
              <span class="text-lg font-black">×</span>
            </button>
          </div>
        </div>

        <div class="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div class="rounded-[24px] border border-slate-200 bg-white p-4">
            <h3 class="text-sm font-black text-slate-900">{{ currentLang === 'ar' ? 'إعدادات جماعية سريعة' : 'Bulk defaults' }}</h3>
            <div class="mt-3 grid gap-3 md:grid-cols-3">
              <label class="space-y-1">
                <span class="text-[0.72rem] font-black text-slate-500">{{ currentLang === 'ar' ? 'سعر البيع' : 'Selling price' }}</span>
                <input type="number" [(ngModel)]="defaults.sellingPrice" class="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-zadna-primary/40">
              </label>
              <label class="space-y-1">
                <span class="text-[0.72rem] font-black text-slate-500">{{ 'PRODUCTS.DISCOUNT_LABEL' | translate }}</span>
                <div class="relative">
                  <input type="number" [(ngModel)]="defaults.discountPercentage" class="h-11 w-full rounded-2xl border border-slate-200 px-3 pe-8 text-sm font-bold outline-none focus:border-zadna-primary/40">
                  <span class="absolute end-3 top-1/2 -translate-y-1/2 text-[0.72rem] font-black text-slate-400">%</span>
                </div>
              </label>
              <label class="space-y-1">
                <span class="text-[0.72rem] font-black text-slate-500">{{ currentLang === 'ar' ? 'المخزون' : 'Stock' }}</span>
                <input type="number" [(ngModel)]="defaults.stockQty" class="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-zadna-primary/40">
              </label>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" (click)="applyDefaultsToSelected()" class="rounded-2xl bg-zadna-primary px-4 py-2 text-xs font-black text-white shadow-lg shadow-zadna-primary/20">
                {{ currentLang === 'ar' ? 'تطبيق على المحدد' : 'Apply to selected' }}
              </button>
              <button type="button" (click)="applyDefaultsToAll()" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                {{ currentLang === 'ar' ? 'تطبيق على الكل' : 'Apply to all' }}
              </button>
              <button type="button" (click)="selectAllRows()" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                {{ currentLang === 'ar' ? 'تحديد الكل' : 'Select all' }}
              </button>
              <button type="button" (click)="clearSelection()" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                {{ currentLang === 'ar' ? 'إلغاء التحديد' : 'Clear selection' }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-auto px-6 py-5">
          @if (stage === 'done' && operation) {
            <div class="mb-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div class="flex flex-wrap items-center gap-3">
                <span class="rounded-full bg-zadna-primary/10 px-4 py-2 text-sm font-black text-zadna-primary">{{ operation.status }}</span>
                <span class="text-sm font-black text-slate-700">{{ operation.processedRows }} / {{ operation.totalRows }}</span>
                <span class="text-sm font-black text-emerald-600">{{ currentLang === 'ar' ? 'نجح' : 'Succeeded' }}: {{ operation.succeededRows }}</span>
                <span class="text-sm font-black text-rose-600">{{ currentLang === 'ar' ? 'فشل' : 'Failed' }}: {{ operation.failedRows }}</span>
              </div>
              @if (operation.errorMessage) {
                <p class="mt-3 text-sm font-bold text-rose-600">{{ operation.errorMessage }}</p>
              }
              <div class="mt-4 flex gap-2">
                <button type="button" (click)="copyErrors()" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                  {{ currentLang === 'ar' ? 'نسخ الأخطاء' : 'Copy errors' }}
                </button>
                <button type="button" (click)="emitCompleted()" class="rounded-2xl bg-zadna-primary px-4 py-2 text-xs font-black text-white">
                  {{ currentLang === 'ar' ? 'تحديث القائمة' : 'Refresh list' }}
                </button>
              </div>
            </div>
          }

          <table class="min-w-[860px] w-full border-collapse">
            <thead>
              <tr class="border-b border-slate-100 text-[0.68rem] uppercase tracking-[0.12em] text-slate-400">
                <th class="pb-3 text-start"><input type="checkbox" [checked]="allRowsSelected" (change)="toggleAllRows($any($event.target).checked)"></th>
                <th class="pb-3 text-start">{{ currentLang === 'ar' ? 'المنتج' : 'Product' }}</th>
                <th class="pb-3 text-start">{{ currentLang === 'ar' ? 'سعر البيع' : 'Selling' }}</th>
                <th class="pb-3 text-start">{{ 'PRODUCTS.DISCOUNT_LABEL' | translate }}</th>
                <th class="pb-3 text-start">{{ currentLang === 'ar' ? 'المخزون' : 'Stock' }}</th>
                <th class="pb-3 text-end">{{ currentLang === 'ar' ? 'إجراء' : 'Action' }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (row of pagedRows; track row.masterProductId) {
                <tr class="align-top">
                  <td class="py-3">
                    <input type="checkbox" [(ngModel)]="row.selected">
                  </td>
                  <td class="py-3 pe-3">
                    <div class="flex items-center gap-3">
                      <div class="h-12 w-12 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                        <img [src]="row.imageUrl || 'assets/images/placeholders/product.svg'" class="h-full w-full object-cover">
                      </div>
                      <div>
                        <div class="text-sm font-black text-slate-900">{{ currentLang === 'ar' ? row.productNameAr : row.productNameEn }}</div>
                        <div class="text-[0.72rem] font-bold text-slate-400">{{ row.masterProductId }}</div>
                        @if (stage === 'done' && resultMap[row.masterProductId]) {
                          <div class="mt-1">
                            <span class="rounded-full px-3 py-1 text-[0.68rem] font-black"
                              [ngClass]="resultMap[row.masterProductId].status === 'Succeeded' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                              {{ resultMap[row.masterProductId].status }}
                            </span>
                            @if (resultMap[row.masterProductId].errorMessage) {
                              <div class="mt-2 max-w-[240px] text-[0.72rem] font-bold text-rose-600">{{ resultMap[row.masterProductId].errorMessage }}</div>
                            }
                          </div>
                        } @else {
                          @if (validateRow(row)) {
                            <div class="mt-2 max-w-[240px] text-[0.72rem] font-bold text-rose-600">{{ validateRow(row) }}</div>
                          }
                        }
                      </div>
                    </div>
                  </td>
                  <td class="py-3"><input type="number" [(ngModel)]="row.sellingPrice" [disabled]="stage !== 'review'" class="h-10 w-28 rounded-xl border border-slate-200 px-3 text-sm font-bold"></td>
                  <td class="py-3">
                    <div class="relative">
                      <input type="number" [(ngModel)]="row.discountPercentage" [disabled]="stage !== 'review'" class="h-10 w-28 rounded-xl border border-slate-200 px-3 pe-7 text-sm font-bold">
                      <span class="absolute end-3 top-1/2 -translate-y-1/2 text-[0.68rem] font-black text-slate-400">%</span>
                    </div>
                  </td>
                  <td class="py-3"><input type="number" [(ngModel)]="row.stockQty" [disabled]="stage !== 'review'" class="h-10 w-24 rounded-xl border border-slate-200 px-3 text-sm font-bold"></td>
                  <td class="py-3 text-end">
                    @if (stage === 'review') {
                      <button type="button" (click)="removeRow(row.masterProductId)" class="rounded-xl border border-rose-200 px-3 py-2 text-[0.72rem] font-black text-rose-600">
                        {{ currentLang === 'ar' ? 'حذف' : 'Remove' }}
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="border-t border-slate-100 px-6 py-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-sm font-black text-slate-600">
              <span>{{ currentLang === 'ar' ? 'إجمالي الصفوف' : 'Rows' }}: {{ rows.length }}</span>
              <span>•</span>
              <span>{{ currentLang === 'ar' ? 'المحدد' : 'Selected' }}: {{ selectedCount }}</span>
              <span>•</span>
              <span>{{ currentLang === 'ar' ? 'الصفحة' : 'Page' }} {{ currentPage }} / {{ totalPages }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" (click)="previousPage()" [disabled]="currentPage === 1" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-40">‹</button>
              <button type="button" (click)="nextPage()" [disabled]="currentPage === totalPages" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-40">›</button>
              <button type="button" (click)="onClose()" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                {{ currentLang === 'ar' ? 'إغلاق' : 'Close' }}
              </button>
              @if (stage === 'review') {
                <button type="button" (click)="submit()" [disabled]="hasValidationErrors || rows.length === 0" class="rounded-2xl bg-zadna-primary px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-zadna-primary/20 disabled:opacity-40">
                  {{ currentLang === 'ar' ? 'إرسال إضافة جماعية' : 'Submit bulk add' }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BulkAddReviewModalComponent implements OnInit, OnDestroy {
  @Input() products: MasterProduct[] = [];
  @Input() currentLang = 'ar';
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<void>();

  rows: BulkVendorProductDraft[] = [];
  stage: BulkReviewStage = 'review';
  operation: VendorProductBulkOperation | null = null;
  resultItems: VendorProductBulkOperationItem[] = [];
  pollSub?: Subscription;
  currentPage = 1;
  readonly pageSize = 50;

  defaults = {
    sellingPrice: null as number | null,
    discountPercentage: 0 as number | null,
    stockQty: 0
  };

  constructor(private readonly catalogService: CatalogService) {}

  ngOnInit(): void {
    this.rows = this.products.map((product) => ({
      masterProductId: product.id,
      productNameAr: product.nameAr,
      productNameEn: product.nameEn,
      imageUrl: product.imageUrl,
      sellingPrice: null,
      discountPercentage: 0,
      compareAtPrice: null,
      stockQty: 0,
      branchId: null,
      sku: null,
      minOrderQty: 1,
      maxOrderQty: null,
      selected: true,
      error: null
    }));
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  get pagedRows(): BulkVendorProductDraft[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  get selectedCount(): number {
    return this.rows.filter((row) => row.selected).length;
  }

  get allRowsSelected(): boolean {
    return this.rows.length > 0 && this.rows.every((row) => row.selected);
  }

  get hasValidationErrors(): boolean {
    return this.rows.some((row) => !!this.validateRow(row));
  }

  get resultMap(): Record<string, VendorProductBulkOperationItem> {
    return this.resultItems.reduce<Record<string, VendorProductBulkOperationItem>>((acc, item) => {
      acc[item.masterProductId] = item;
      return acc;
    }, {});
  }

  onClose(): void {
    this.close.emit();
  }

  emitCompleted(): void {
    this.completed.emit();
  }

  toggleAllRows(checked: boolean): void {
    this.rows.forEach((row) => row.selected = checked);
  }

  selectAllRows(): void {
    this.toggleAllRows(true);
  }

  clearSelection(): void {
    this.toggleAllRows(false);
  }

  applyDefaultsToSelected(): void {
    this.rows.filter((row) => row.selected).forEach((row) => this.applyDefaults(row));
  }

  applyDefaultsToAll(): void {
    this.rows.forEach((row) => this.applyDefaults(row));
  }

  applyDefaults(row: BulkVendorProductDraft): void {
    if (this.defaults.sellingPrice !== null) row.sellingPrice = this.defaults.sellingPrice;
    row.discountPercentage = this.defaults.discountPercentage ?? 0;
    row.compareAtPrice = this.catalogService.calculateCompareAtPrice(row.sellingPrice ?? 0, row.discountPercentage ?? 0);
    row.stockQty = this.defaults.stockQty;
  }

  removeRow(masterProductId: string): void {
    this.rows = this.rows.filter((row) => row.masterProductId !== masterProductId);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  validateRow(row: BulkVendorProductDraft): string | null {
    if (row.sellingPrice === null || row.sellingPrice <= 0) {
      return this.currentLang === 'ar' ? 'سعر البيع مطلوب ويجب أن يكون أكبر من صفر.' : 'Selling price is required and must be greater than zero.';
    }

    if ((row.discountPercentage ?? 0) < 0 || (row.discountPercentage ?? 0) >= 100) {
      return this.currentLang === 'ar' ? 'نسبة الخصم يجب أن تكون من 0 إلى أقل من 100.' : 'Discount percentage must be between 0 and less than 100.';
    }

    if (row.stockQty < 0) {
      return this.currentLang === 'ar' ? 'المخزون لا يمكن أن يكون سالبًا.' : 'Stock cannot be negative.';
    }

    row.compareAtPrice = this.catalogService.calculateCompareAtPrice(row.sellingPrice, row.discountPercentage ?? 0);
    return null;
  }

  submit(): void {
    if (this.hasValidationErrors || this.rows.length === 0) {
      return;
    }

    this.stage = 'submitting';
    this.catalogService.createBulkProducts(this.rows).subscribe({
      next: (operation) => {
        this.operation = operation;
        this.startPolling(operation.id);
      },
      error: () => {
        this.stage = 'review';
      }
    });
  }

  startPolling(operationId: string): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(2000)
      .pipe(switchMap(() => this.catalogService.getBulkOperation(operationId)))
      .subscribe({
        next: (operation) => {
          this.operation = operation;
          if (operation.status !== 'Pending' && operation.status !== 'Processing') {
            this.catalogService.getBulkOperationItems(operationId).subscribe({
              next: (items) => {
                this.resultItems = items;
                this.stage = 'done';
                this.pollSub?.unsubscribe();
              }
            });
          }
        }
      });
  }

  copyErrors(): void {
    const errorText = this.resultItems
      .filter((item) => !!item.errorMessage)
      .map((item) => `#${item.rowNumber} ${item.productNameAr || item.productNameEn || item.masterProductId}: ${item.errorMessage}`)
      .join('\n');

    if (errorText) {
      navigator.clipboard?.writeText(errorText);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }
}
