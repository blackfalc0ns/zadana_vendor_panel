import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row" [dir]="isRTL ? 'rtl' : 'ltr'">
      <!-- Page Info -->
      <div class="flex items-center gap-4 text-[0.75rem] font-black text-slate-400">
        <span class="hidden sm:inline">
          {{ 'PAGINATION.PAGE_INFO' | translate:{current: currentPage, total: totalPages} }}
        </span>
        <span class="h-4 w-px bg-slate-200 hidden sm:block"></span>
        <span>{{ totalItemsLabel || ('PAGINATION.TOTAL_ITEMS' | translate:{count: totalCount}) }}</span>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center gap-2">
        <!-- Previous Button -->
        <button 
          (click)="onPageChange(currentPage - 1)"
          [disabled]="currentPage === 1"
          class="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[0.8rem] font-black text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-zadna-primary hover:enabled:bg-zadna-primary/5 hover:enabled:text-zadna-primary active:scale-95">
          <svg class="h-4 w-4" [class.rotate-180]="isRTL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path>
          </svg>
          {{ 'PAGINATION.PREVIOUS' | translate }}
        </button>

        <!-- Page Numbers (Compact) -->
        <div class="hidden items-center gap-1.5 md:flex">
          @for (page of visiblePages; track page) {
            <button 
              (click)="onPageChange(page)"
              [ngClass]="{
                'bg-zadna-primary text-white shadow-lg shadow-zadna-primary/30 border-zadna-primary': page === currentPage,
                'border-slate-100 bg-slate-50/50 text-slate-500': page !== currentPage
              }"
              class="h-10 w-10 rounded-xl border text-[0.8rem] font-black transition hover:enabled:border-zadna-primary/40 hover:enabled:bg-white hover:enabled:text-zadna-primary active:scale-95">
              {{ page }}
            </button>
          }
        </div>

        <!-- Next Button -->
        <button 
          (click)="onPageChange(currentPage + 1)"
          [disabled]="currentPage === totalPages"
          class="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[0.8rem] font-black text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-zadna-primary hover:enabled:bg-zadna-primary/5 hover:enabled:text-zadna-primary active:scale-95">
          {{ 'PAGINATION.NEXT' | translate }}
          <svg class="h-4 w-4" [class.rotate-180]="isRTL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
  `]
})
export class AppPaginationComponent {
  @Input() totalItemsLabel = '';
  @Input() currentPage = 1;
  @Input() totalCount = 0;
  @Input() pageSize = 10;
  @Input() totalPages = 1;
  @Input() isRTL = true;

  @Output() pageChange = new EventEmitter<number>();

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
