import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, switchMap, timer } from 'rxjs';
import {
  BulkVendorProductDraft,
  MasterProduct,
  VendorProductBulkOperation,
  VendorProductBulkOperationItem
} from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';

type BulkReviewStage = 'review' | 'submitting' | 'done';
type BulkValidationField = 'tradePrice' | 'sellingPrice' | 'discountPercentage' | 'stockQty';

interface RowValidationState {
  keys: string[];
  fields: BulkValidationField[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bulk-add-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  styles: [`
    :host { display: contents; }

    .bulk-table {
      table-layout: fixed;
    }

    .bulk-table thead th {
      position: sticky;
      top: 0;
      z-index: 2;
      background: rgb(248 250 252 / 0.95);
      backdrop-filter: blur(6px);
    }

    .bulk-table tbody tr.data-row td {
      vertical-align: middle;
    }

    .bulk-table input[type='number'] {
      width: 100%;
      min-width: 0;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    .bulk-table .field-wrap {
      width: 100%;
      max-width: 6.5rem;
      margin-inline: auto;
    }
  `],
  template: `
    <div class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
      <div
        class="relative flex h-full max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-slate-900/20"
        [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">

        @if (stage === 'submitting') {
          <div class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/85 backdrop-blur-sm">
            <span class="h-12 w-12 animate-spin rounded-full border-4 border-zadna-primary/20 border-t-zadna-primary"></span>
            <p class="text-sm font-black text-slate-700">{{ 'PRODUCTS.BULK.SUBMITTING' | translate }}</p>
          </div>
        }

        <div class="border-b border-slate-100 bg-gradient-to-b from-zadna-primary/[0.04] to-white px-6 py-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zadna-primary/10 text-zadna-primary">
                <span class="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
              <div>
                <h2 class="text-xl font-black tracking-tight text-slate-900">{{ 'PRODUCTS.BULK.TITLE' | translate }}</h2>
                <p class="mt-1 text-sm font-bold text-slate-500">{{ 'PRODUCTS.BULK.SUBTITLE' | translate }}</p>
              </div>
            </div>
            <button type="button" (click)="onClose()" class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200">
              <span class="text-lg font-black">×</span>
            </button>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <span class="rounded-full bg-slate-100 px-3 py-1.5 text-[0.72rem] font-black text-slate-600">
              {{ 'PRODUCTS.BULK.ROWS' | translate }}: {{ rows.length }}
            </span>
            <span class="rounded-full bg-zadna-primary/10 px-3 py-1.5 text-[0.72rem] font-black text-zadna-primary">
              {{ 'PRODUCTS.BULK.SELECTED' | translate }}: {{ selectedCount }}
            </span>
            @if (validationErrorCount > 0 && stage === 'review') {
              <span class="rounded-full bg-rose-50 px-3 py-1.5 text-[0.72rem] font-black text-rose-600 ring-1 ring-rose-200/60">
                {{ 'PRODUCTS.BULK.VALIDATION_BANNER' | translate:{ count: validationErrorCount } }}
              </span>
            }
          </div>
        </div>

        @if (submitErrorKey && stage === 'review') {
          <div class="mx-6 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {{ submitErrorKey | translate }}
          </div>
        }

        @if (stage !== 'done') {
          <div class="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
            <div class="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 class="text-sm font-black text-slate-900">{{ 'PRODUCTS.BULK.DEFAULTS_TITLE' | translate }}</h3>
                  <p class="mt-1 text-[0.72rem] font-bold text-slate-500">{{ 'PRODUCTS.BULK.DEFAULTS_HINT' | translate }}</p>
                </div>
              </div>
              <div class="mt-3 grid gap-3 md:grid-cols-2">
                <label class="space-y-1">
                  <span class="text-[0.72rem] font-black text-slate-500">{{ 'PRODUCTS.BULK.TRADE_PRICE' | translate }}</span>
                  <input type="number" min="0" step="0.01" [(ngModel)]="defaults.tradePrice" (ngModelChange)="onDefaultsChange()" class="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-zadna-primary/40 focus:ring-4 focus:ring-zadna-primary/5">
                </label>
                <label class="space-y-1">
                  <span class="text-[0.72rem] font-black text-slate-500">{{ 'PRODUCTS.BULK.SELLING_PRICE' | translate }}</span>
                  <input type="number" min="0" step="0.01" [(ngModel)]="defaults.sellingPrice" (ngModelChange)="onDefaultsChange()" class="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-zadna-primary/40 focus:ring-4 focus:ring-zadna-primary/5">
                </label>
              </div>
              <div class="mt-3 grid gap-3 md:grid-cols-2">
                <label class="space-y-1">
                  <span class="text-[0.72rem] font-black text-slate-500">{{ 'PRODUCTS.DISCOUNT_LABEL' | translate }}</span>
                  <div class="relative">
                    <input type="number" min="0" max="99" step="0.01" [(ngModel)]="defaults.discountPercentage" (ngModelChange)="onDefaultsChange()" class="h-11 w-full rounded-2xl border border-slate-200 px-3 pe-8 text-sm font-bold outline-none focus:border-zadna-primary/40 focus:ring-4 focus:ring-zadna-primary/5">
                    <span class="absolute end-3 top-1/2 -translate-y-1/2 text-[0.72rem] font-black text-slate-400">%</span>
                  </div>
                </label>
                <label class="space-y-1">
                  <span class="text-[0.72rem] font-black text-slate-500">{{ 'PRODUCTS.BULK.STOCK' | translate }}</span>
                  <input type="number" min="0" step="1" [(ngModel)]="defaults.stockQty" (ngModelChange)="onDefaultsChange()" class="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-zadna-primary/40 focus:ring-4 focus:ring-zadna-primary/5">
                </label>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" (click)="applyDefaultsToSelected()" class="rounded-2xl bg-zadna-primary px-4 py-2 text-xs font-black text-white shadow-lg shadow-zadna-primary/20">
                  {{ 'PRODUCTS.BULK.APPLY_SELECTED' | translate }}
                </button>
                <button type="button" (click)="applyDefaultsToAll()" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                  {{ 'PRODUCTS.BULK.APPLY_ALL' | translate }}
                </button>
                <button type="button" (click)="selectAllRows()" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                  {{ 'PRODUCTS.BULK.SELECT_ALL' | translate }}
                </button>
                <button type="button" (click)="clearSelection()" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                  {{ 'PRODUCTS.BULK.CLEAR_SELECTION' | translate }}
                </button>
              </div>
            </div>
          </div>
        }

        <div class="flex-1 overflow-auto px-6 py-5">
          @if (stage === 'done' && operation) {
            <div class="mb-5 rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
              <h3 class="text-sm font-black text-slate-900">{{ 'PRODUCTS.BULK.RESULT.TITLE' | translate }}</h3>
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <span class="rounded-full bg-zadna-primary/10 px-4 py-2 text-sm font-black text-zadna-primary">
                  {{ translateStatus(operation.status) }}
                </span>
                <span class="text-sm font-black text-slate-700">
                  {{ 'PRODUCTS.BULK.RESULT.PROGRESS' | translate:{ processed: operation.processedRows, total: operation.totalRows } }}
                </span>
                <span class="text-sm font-black text-emerald-600">{{ 'PRODUCTS.BULK.RESULT.SUCCEEDED' | translate }}: {{ operation.succeededRows }}</span>
                <span class="text-sm font-black text-rose-600">{{ 'PRODUCTS.BULK.RESULT.FAILED' | translate }}: {{ operation.failedRows }}</span>
              </div>
              @if (operation.errorMessage) {
                <p class="mt-3 text-sm font-bold text-rose-600">{{ translateBackendError(operation.errorMessage) }}</p>
              }
              <div class="mt-4 flex flex-wrap gap-2">
                <button type="button" (click)="copyErrors()" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                  {{ 'PRODUCTS.BULK.RESULT.COPY_ERRORS' | translate }}
                </button>
                <button type="button" (click)="emitCompleted()" class="rounded-2xl bg-zadna-primary px-4 py-2 text-xs font-black text-white">
                  {{ 'PRODUCTS.BULK.RESULT.REFRESH_LIST' | translate }}
                </button>
              </div>
              @if (copyFeedback) {
                <p class="mt-2 text-xs font-bold text-emerald-600">{{ 'PRODUCTS.BULK.RESULT.COPIED' | translate }}</p>
              }
            </div>
          }

          <div class="overflow-x-auto rounded-[24px] border border-slate-100 bg-white">
            <table class="bulk-table min-w-[980px] w-full border-collapse">
              <colgroup>
                <col style="width: 3rem">
                <col style="width: 36%">
                <col style="width: 9rem">
                <col style="width: 7rem">
                <col style="width: 7rem">
                <col style="width: 6.5rem">
                <col style="width: 5.5rem">
                <col style="width: 5.5rem">
              </colgroup>
              <thead>
                <tr class="border-b border-slate-200 text-[0.68rem] uppercase tracking-[0.12em] text-slate-400">
                  <th class="px-3 py-3 text-center">
                    <input type="checkbox" class="h-4 w-4 rounded border-slate-300" [checked]="allRowsSelected" (change)="toggleAllRows($any($event.target).checked)">
                  </th>
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.BULK.PRODUCT' | translate }}</th>
                  <th class="px-3 py-3 text-center">{{ 'PRODUCTS.BULK.SIZE' | translate }}</th>
                  <th class="px-3 py-3 text-center">{{ 'PRODUCTS.BULK.TRADE' | translate }}</th>
                  <th class="px-3 py-3 text-center">{{ 'PRODUCTS.BULK.SELLING' | translate }}</th>
                  <th class="px-2 py-3 text-center">{{ 'PRODUCTS.DISCOUNT_LABEL' | translate }}</th>
                  <th class="px-3 py-3 text-center">{{ 'PRODUCTS.BULK.STOCK' | translate }}</th>
                  <th class="px-3 py-3 text-center">{{ 'PRODUCTS.BULK.ACTION' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (row of pagedRows; track row.masterProductId) {
                  <tr class="data-row border-b border-slate-100 transition-colors" [ngClass]="getRowValidationKeys(row.masterProductId).length ? 'bg-rose-50/30' : 'hover:bg-slate-50/60'">
                    <td class="px-3 py-3 text-center">
                      <input type="checkbox" class="h-4 w-4 rounded border-slate-300" [(ngModel)]="row.selected">
                    </td>
                    <td class="px-3 py-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                          <img [src]="resolveImageUrl(row.imageUrl)" (error)="onImageError($event)" class="h-full w-full object-cover" [alt]="getProductName(row)">
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="truncate text-sm font-black text-slate-900" [title]="getProductName(row)">{{ getProductName(row) }}</div>
                          <div class="mt-0.5 text-[0.68rem] font-bold text-slate-400 font-mono">{{ row.masterProductId.substring(0, 8) }}</div>
                          @if (stage === 'done' && resultMap[row.masterProductId]) {
                            <span class="mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[0.62rem] font-black"
                              [ngClass]="resultMap[row.masterProductId].status === 'Succeeded' ? 'bg-emerald-100 text-emerald-700' : resultMap[row.masterProductId].status === 'Skipped' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'">
                              {{ translateStatus(resultMap[row.masterProductId].status) }}
                            </span>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-3 text-center">
                      <span class="inline-flex max-w-full items-center justify-center rounded-lg bg-cyan-50 px-2 py-1 text-[0.68rem] font-black leading-tight text-cyan-800 ring-1 ring-cyan-200/40">
                        {{ getRowDisplaySize(row) || ('PRODUCTS.BULK.STANDARD_SIZE' | translate) }}
                      </span>
                    </td>
                    <td class="px-2 py-3">
                      <div class="field-wrap">
                        <input type="number" min="0" step="0.01" [(ngModel)]="row.tradePrice" (ngModelChange)="onRowFieldChange()" [disabled]="stage !== 'review'" [class]="inputClass(row.masterProductId, 'tradePrice')">
                      </div>
                    </td>
                    <td class="px-2 py-3">
                      <div class="field-wrap">
                        <input type="number" min="0" step="0.01" [(ngModel)]="row.sellingPrice" (ngModelChange)="onRowFieldChange()" [disabled]="stage !== 'review'" [class]="inputClass(row.masterProductId, 'sellingPrice')">
                      </div>
                    </td>
                    <td class="px-2 py-3">
                      <div class="field-wrap relative">
                        <input type="number" min="0" max="99" step="0.01" [(ngModel)]="row.discountPercentage" (ngModelChange)="onRowFieldChange()" [disabled]="stage !== 'review'" [class]="inputClass(row.masterProductId, 'discountPercentage') + ' !pe-6'">
                        <span class="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-[0.62rem] font-black text-slate-400">%</span>
                      </div>
                    </td>
                    <td class="px-2 py-3">
                      <div class="field-wrap">
                        <input type="number" min="0" step="1" [(ngModel)]="row.stockQty" (ngModelChange)="onRowFieldChange()" [disabled]="stage !== 'review'" [class]="inputClass(row.masterProductId, 'stockQty')">
                      </div>
                    </td>
                    <td class="px-2 py-3 text-center">
                      @if (stage === 'review') {
                        <button type="button" (click)="removeRow(row.masterProductId)" class="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 px-2.5 text-[0.68rem] font-black text-rose-600 transition hover:bg-rose-50">
                          {{ 'PRODUCTS.BULK.REMOVE' | translate }}
                        </button>
                      }
                    </td>
                  </tr>

                  @if (stage === 'done' && resultMap[row.masterProductId].errorMessage) {
                    <tr class="border-b border-slate-100 bg-rose-50/20">
                      <td colspan="8" class="px-4 py-2">
                        <p class="text-[0.72rem] font-bold text-rose-600">
                          {{ translateBackendError(resultMap[row.masterProductId].errorMessage ?? '') }}
                        </p>
                      </td>
                    </tr>
                  } @else {
                    @if (getRowValidationKeys(row.masterProductId).length) {
                      <tr class="border-b border-slate-100 bg-rose-50/20">
                        <td colspan="8" class="space-y-1 px-4 py-2">
                          @for (validationKey of getRowValidationKeys(row.masterProductId); track validationKey) {
                            <p class="text-[0.72rem] font-bold text-rose-600">
                              {{ validationKey | translate }}
                            </p>
                          }
                        </td>
                      </tr>
                    }
                  }
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="border-t border-slate-100 bg-white px-6 py-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-sm font-black text-slate-600">
              <span>{{ 'PRODUCTS.BULK.PAGE' | translate }} {{ currentPage }} / {{ totalPages }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" (click)="previousPage()" [disabled]="currentPage === 1" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-40">‹</button>
              <button type="button" (click)="nextPage()" [disabled]="currentPage === totalPages" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-40">›</button>
              <button type="button" (click)="onClose()" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">
                {{ 'PRODUCTS.BULK.CLOSE' | translate }}
              </button>
              @if (stage === 'review') {
                <button type="button" (click)="submit()" [disabled]="validationErrorCount > 0 || rows.length === 0 || stage !== 'review'" class="rounded-2xl bg-zadna-primary px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-zadna-primary/20 disabled:opacity-40">
                  {{ 'PRODUCTS.BULK.SUBMIT' | translate }}
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  @Input() products: MasterProduct[] = [];
  @Input() currentLang = 'ar';
  @Input() branchId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<void>();

  rows: BulkVendorProductDraft[] = [];
  stage: BulkReviewStage = 'review';
  operation: VendorProductBulkOperation | null = null;
  resultItems: VendorProductBulkOperationItem[] = [];
  pollSub?: Subscription;
  langSub?: Subscription;
  currentPage = 1;
  readonly pageSize = 50;
  submitErrorKey: string | null = null;
  copyFeedback = false;

  private readonly maxPollAttempts = 60;
  private rowValidation = new Map<string, RowValidationState>();

  defaults = {
    tradePrice: null as number | null,
    sellingPrice: null as number | null,
    discountPercentage: 0 as number | null,
    stockQty: 0
  };

  private readonly backendErrorMap: Record<string, string> = {
    'Master product was not found.': 'PRODUCTS.BULK.ERRORS.MASTER_NOT_FOUND',
    'Product already exists in vendor store.': 'PRODUCTS.BULK.ERRORS.ALREADY_EXISTS',
    'Product already exists in vendor branch.': 'PRODUCTS.BULK.ERRORS.ALREADY_EXISTS',
    'Branch is invalid for this vendor.': 'PRODUCTS.BULK.ERRORS.BRANCH_INVALID',
    'Compare price must be greater than selling price.': 'PRODUCTS.BULK.ERRORS.COMPARE_PRICE_INVALID',
    'Trade price is required.': 'PRODUCTS.BULK.ERRORS.TRADE_REQUIRED',
    'Trade price must be less than or equal to selling price.': 'PRODUCTS.BULK.ERRORS.TRADE_GT_SELLING',
    'Minimum order quantity must be greater than zero.': 'PRODUCTS.BULK.ERRORS.MIN_ORDER_INVALID',
    'Maximum order quantity must be greater than or equal to minimum order quantity.': 'PRODUCTS.BULK.ERRORS.MAX_ORDER_INVALID',
    'Vendor was not found.': 'PRODUCTS.BULK.ERRORS.VENDOR_NOT_FOUND',
    'Vendor is not active.': 'PRODUCTS.BULK.ERRORS.VENDOR_INACTIVE',
    'Duplicate master products are not allowed in the same bulk request.': 'PRODUCTS.BULK.ERRORS.DUPLICATE_ITEMS',
    'One or more branch IDs do not belong to this vendor.': 'PRODUCTS.BULK.ERRORS.BRANCHES_INVALID'
  };

  constructor(private readonly catalogService: CatalogService) {}

  ngOnInit(): void {
    this.currentLang = this.translate.currentLang || this.currentLang;
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.cdr.markForCheck();
    });

    this.rows = this.products.map((product) => ({
      masterProductId: product.id,
      productNameAr: product.nameAr,
      productNameEn: product.nameEn,
      imageUrl: product.imageUrl,
      displaySizeAr: product.displaySizeAr,
      displaySizeEn: product.displaySizeEn,
      tradePrice: product.vendorTradePrice ?? null,
      sellingPrice: product.vendorSellingPrice ?? null,
      discountPercentage: this.calculateDiscountPercentage(product.vendorSellingPrice, product.vendorCompareAtPrice),
      compareAtPrice: product.vendorCompareAtPrice ?? null,
      stockQty: 0,
      branchId: this.branchId || null,
      sku: null,
      minOrderQty: 1,
      maxOrderQty: null,
      selected: true,
      error: null
    }));

    this.refreshValidation();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.langSub?.unsubscribe();
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

  get validationErrorCount(): number {
    return this.rowValidation.size;
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

  onDefaultsChange(): void {
    this.cdr.markForCheck();
  }

  onRowFieldChange(): void {
    this.refreshValidation();
  }

  toggleAllRows(checked: boolean): void {
    this.rows.forEach((row) => row.selected = checked);
    this.cdr.markForCheck();
  }

  selectAllRows(): void {
    this.toggleAllRows(true);
  }

  clearSelection(): void {
    this.toggleAllRows(false);
  }

  applyDefaultsToSelected(): void {
    this.rows.filter((row) => row.selected).forEach((row) => this.applyDefaults(row));
    this.refreshValidation();
  }

  applyDefaultsToAll(): void {
    this.rows.forEach((row) => this.applyDefaults(row));
    this.refreshValidation();
  }

  applyDefaults(row: BulkVendorProductDraft): void {
    if (this.defaults.tradePrice !== null) row.tradePrice = this.defaults.tradePrice;
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
    this.refreshValidation();
  }

  getRowValidationKeys(masterProductId: string): string[] {
    return this.rowValidation.get(masterProductId)?.keys ?? [];
  }

  fieldHasError(masterProductId: string, field: BulkValidationField): boolean {
    const state = this.rowValidation.get(masterProductId);
    return !!state?.fields.includes(field);
  }

  inputClass(masterProductId: string, field: BulkValidationField): string {
    const base = 'h-9 rounded-xl border px-2 text-sm font-bold outline-none transition focus:ring-4 focus:ring-zadna-primary/5 disabled:bg-slate-50 disabled:text-slate-500';
    if (this.fieldHasError(masterProductId, field)) {
      return `${base} border-rose-300 bg-rose-50/50 focus:border-rose-400`;
    }
    return `${base} border-slate-200 focus:border-zadna-primary/40`;
  }

  refreshValidation(): void {
    this.rowValidation.clear();

    for (const row of this.rows) {
      const validation = this.computeRowValidation(row);
      if (validation) {
        this.rowValidation.set(row.masterProductId, validation);
      } else {
        row.compareAtPrice = this.catalogService.calculateCompareAtPrice(row.sellingPrice ?? 0, row.discountPercentage ?? 0);
      }
    }

    this.cdr.markForCheck();
  }

  computeRowValidation(row: BulkVendorProductDraft): RowValidationState | null {
    const keys: string[] = [];
    const fields = new Set<BulkValidationField>();

    if (row.tradePrice == null || row.tradePrice <= 0) {
      keys.push('PRODUCTS.BULK.VALIDATION.TRADE_REQUIRED');
      fields.add('tradePrice');
    }

    if (row.sellingPrice === null || row.sellingPrice <= 0) {
      keys.push('PRODUCTS.BULK.VALIDATION.SELLING_REQUIRED');
      fields.add('sellingPrice');
    }

    const tradeValid = row.tradePrice != null && row.tradePrice > 0;
    const sellingValid = row.sellingPrice != null && row.sellingPrice > 0;
    if (tradeValid && sellingValid && row.tradePrice! > row.sellingPrice!) {
      keys.push('PRODUCTS.BULK.VALIDATION.TRADE_GT_SELLING');
      fields.add('tradePrice');
      fields.add('sellingPrice');
    }

    if ((row.discountPercentage ?? 0) < 0 || (row.discountPercentage ?? 0) >= 100) {
      keys.push('PRODUCTS.BULK.VALIDATION.DISCOUNT_RANGE');
      fields.add('discountPercentage');
    }

    if (row.stockQty < 0) {
      keys.push('PRODUCTS.BULK.VALIDATION.STOCK_NEGATIVE');
      fields.add('stockQty');
    }

    if (keys.length === 0) {
      return null;
    }

    return { keys, fields: [...fields] };
  }

  submit(): void {
    this.refreshValidation();
    if (this.validationErrorCount > 0 || this.rows.length === 0) {
      return;
    }

    this.stage = 'submitting';
    this.submitErrorKey = null;
    this.catalogService.createBulkProducts(this.rows).subscribe({
      next: (operation) => {
        this.cdr.markForCheck();
        this.operation = operation;
        if (this.isTerminalStatus(operation.status)) {
          this.loadResultItems(operation.id);
        } else {
          this.startPolling(operation.id);
        }
      },
      error: (error: unknown) => {
        this.cdr.markForCheck();
        this.stage = 'review';
        this.submitErrorKey = this.resolveSubmitErrorKey(error);
      }
    });
  }

  startPolling(operationId: string): void {
    this.pollSub?.unsubscribe();
    let attempts = 0;
    this.pollSub = timer(0, 2000)
      .pipe(switchMap(() => this.catalogService.getBulkOperation(operationId)))
      .subscribe({
        next: (operation) => {
          attempts += 1;
          this.cdr.markForCheck();
          this.operation = operation;
          if (this.isTerminalStatus(operation.status)) {
            this.loadResultItems(operationId);
            return;
          }

          if (attempts >= this.maxPollAttempts) {
            this.pollSub?.unsubscribe();
            this.stage = 'review';
            this.submitErrorKey = 'PRODUCTS.BULK.SUBMIT_TIMEOUT';
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.pollSub?.unsubscribe();
          this.cdr.markForCheck();
          this.stage = 'review';
          this.submitErrorKey = 'PRODUCTS.BULK.SUBMIT_ERROR';
        }
      });
  }

  private loadResultItems(operationId: string): void {
    this.catalogService.getBulkOperationItems(operationId).subscribe({
      next: (items) => {
        this.cdr.markForCheck();
        this.resultItems = items;
        this.stage = 'done';
        this.pollSub?.unsubscribe();
      },
      error: () => {
        this.pollSub?.unsubscribe();
        this.stage = 'review';
        this.submitErrorKey = 'PRODUCTS.BULK.SUBMIT_ERROR';
        this.cdr.markForCheck();
      }
    });
  }

  private isTerminalStatus(status: string): boolean {
    return status !== 'Pending' && status !== 'Processing';
  }

  copyErrors(): void {
    const errorText = this.resultItems
      .filter((item) => !!item.errorMessage)
      .map((item) => {
        const name = this.currentLang === 'ar'
          ? (item.productNameAr || item.productNameEn || item.masterProductId)
          : (item.productNameEn || item.productNameAr || item.masterProductId);
        return `#${item.rowNumber} ${name}: ${this.translateBackendError(item.errorMessage!)}`;
      })
      .join('\n');

    if (errorText) {
      navigator.clipboard?.writeText(errorText);
      this.copyFeedback = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copyFeedback = false;
        this.cdr.markForCheck();
      }, 2000);
    }
  }

  getRowDisplaySize(row: BulkVendorProductDraft): string {
    const size = this.currentLang === 'ar'
      ? (row.displaySizeAr || row.displaySizeEn || '')
      : (row.displaySizeEn || row.displaySizeAr || '');
    return size.trim();
  }

  getProductName(row: BulkVendorProductDraft): string {
    return this.currentLang === 'ar'
      ? (row.productNameAr || row.productNameEn)
      : (row.productNameEn || row.productNameAr);
  }

  resolveImageUrl(path?: string): string {
    if (!path) {
      return '/assets/images/placeholders/product.svg';
    }

    if (path.startsWith('http')) {
      return path;
    }

    return path.startsWith('/') ? path : `/${path}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/placeholders/product.svg';
  }

  translateStatus(status: string): string {
    const key = `PRODUCTS.BULK.STATUS.${status}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : status;
  }

  translateBackendError(message: string): string {
    const mapped = this.backendErrorMap[message.trim()];
    if (!mapped) {
      return message;
    }

    const translated = this.translate.instant(mapped);
    return translated !== mapped ? translated : message;
  }

  private calculateDiscountPercentage(sellingPrice?: number | null, compareAtPrice?: number | null): number {
    if (!sellingPrice || !compareAtPrice || compareAtPrice <= sellingPrice) {
      return 0;
    }

    return Math.round(((compareAtPrice - sellingPrice) / compareAtPrice) * 100);
  }

  resolveSubmitErrorKey(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = typeof error.error?.detail === 'string'
        ? error.error.detail
        : typeof error.error?.message === 'string'
          ? error.error.message
          : typeof error.error === 'string'
            ? error.error
            : null;

      if (detail) {
        const mapped = this.backendErrorMap[detail.trim()];
        if (mapped) {
          return mapped;
        }
      }
    }

    return 'PRODUCTS.BULK.SUBMIT_ERROR';
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
      this.cdr.markForCheck();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.cdr.markForCheck();
    }
  }
}
