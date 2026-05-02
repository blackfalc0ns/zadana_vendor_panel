import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export interface TableColumn {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  type?: 'text' | 'badge' | 'progress' | 'actions' | 'custom';
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

export interface TableAction {
  id: string;
  label: string;
  icon: string;
  color?: string;
  condition?: (item: Record<string, unknown>) => boolean;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: string;
  color?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <!-- Bulk Actions Toolbar -->
    <div *ngIf="showBulkActions && selectedItems.size > 0" 
         class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div class="bg-white/90 backdrop-blur-xl rounded-[2rem] px-6 py-4 shadow-2xl border border-slate-200/60 flex items-center gap-6">
        <!-- Selected Count -->
        <div class="flex items-center gap-3 px-4 border-l border-slate-200">
          <div class="w-8 h-8 rounded-full bg-zadna-primary text-white flex items-center justify-center text-xs font-black">
            {{ selectedItems.size }}
          </div>
          <span class="text-sm font-black text-slate-700">{{ 'COMMON.SELECTED_ITEMS' | translate }}</span>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex items-center gap-3">
          <button *ngFor="let action of bulkActions" 
                  (click)="onBulkAction(action)"
                  [class]="'flex items-center gap-2 px-5 py-2.5 rounded-[1.2rem] text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-lg ' + (action.color || 'bg-zadna-primary text-white')">
            <span class="material-symbols-outlined text-[18px]">{{ action.icon }}</span>
            {{ action.label | translate }}
          </button>
        </div>
        
        <!-- Close Button -->
        <button (click)="clearSelection()" 
                class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors ml-2">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
    </div>

    <!-- Desktop Table Content -->
    <div [class]="'hidden md:block w-full overflow-x-auto relative ' + containerClass">
      
      <!-- Loading Overlay -->
      <div *ngIf="isLoading" class="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
         <div class="flex flex-col items-center gap-3">
            <div class="h-10 w-10 border-4 border-slate-100 border-t-zadna-primary rounded-full animate-spin"></div>
            <span class="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest">{{ 'COMMON.LOADING' | translate }}</span>
         </div>
      </div>

      <table class="w-full border-separate border-spacing-y-0" style="min-width: 800px;">
        <colgroup>
          <col *ngIf="selectable" [style.width]="selectionColumnWidth">
          <col *ngFor="let col of columns" [style.width]="getColumnWidth(col)">
        </colgroup>
        <thead class="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-100/50">
          <tr>
            <th *ngIf="selectable" class="w-12 px-3 py-7 text-center align-middle">
              <input type="checkbox" 
                     [checked]="allSelected" 
                     (change)="toggleSelectAll()"
                     class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20">
            </th>
            <th *ngFor="let col of columns" 
                class="px-5 py-7 align-middle text-[10px] font-black uppercase text-slate-400/80 tracking-tighter"
                [class.text-center]="col.align === 'center'"
                [class.text-start]="col.align === 'left'"
                [class.text-end]="col.align === 'right'"
                [style.width]="col.width">
              <span class="inline-block transition-transform hover:scale-105 cursor-default">{{ col.title | translate }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of data; let i = index" 
              class="group bg-white/50 hover:bg-white transition-all duration-500 border-b border-slate-100/60"
              [class.cursor-pointer]="clickableRows"
              (click)="onRowClick(item)">
            
            <td *ngIf="selectable" class="w-12 px-3 py-6 text-center align-middle" (click)="$event.stopPropagation()">
              <input type="checkbox" 
                     [checked]="isSelected(item)" 
                     (change)="toggleSelectItem(item)"
                     class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20">
            </td>

            <td *ngFor="let col of columns" 
                class="px-5 py-6 align-middle overflow-hidden"
                [class.text-center]="col.align === 'center'"
                [class.text-start]="col.align === 'left'"
                [class.text-end]="col.align === 'right'">
              
              <!-- Text Column -->
              <ng-container *ngIf="col.type === 'text' || !col.type">
                <div class="min-w-0 truncate text-sm font-bold text-slate-700">
                  {{ getColumnValue(item, col.key) }}
                </div>
              </ng-container>

              <!-- Badge Column -->
              <div *ngIf="col.type === 'badge'" class="flex justify-center">
                <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-50 bg-white shadow-sm text-xs font-black">
                  {{ getColumnValue(item, col.key) | translate }}
                </span>
              </div>

              <!-- Progress Column -->
              <div *ngIf="col.type === 'progress'" class="flex flex-col items-center gap-1">
                <div class="w-full max-w-[60px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div class="h-full rounded-full transition-all bg-primary"
                       [style.width.%]="getProgressValue(item, col.key)"></div>
                </div>
                <span class="text-[9px] font-bold text-slate-500">{{ getProgressValue(item, col.key) }}%</span>
              </div>

              <!-- Actions Column -->
              <div *ngIf="col.type === 'actions'" class="flex justify-center gap-1.5 flex-wrap" (click)="$event.stopPropagation()">
                <button *ngFor="let action of getItemActions(item)" 
                        (click)="onAction(action, item)"
                        class="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                        [title]="action.label | translate">
                  <ng-container [ngSwitch]="action.icon">
                    <svg *ngSwitchCase="'visibility'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg *ngSwitchCase="'check_circle'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <svg *ngSwitchCase="'block'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </ng-container>
                </button>
              </div>

              <!-- Custom Column -->
              <ng-container *ngIf="col.type === 'custom'">
                <ng-container *ngTemplateOutlet="customColumnTemplate; context: { $implicit: item, column: col }"></ng-container>
              </ng-container>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4 relative">
      <!-- Loading Overlay (Mobile) -->
      <div *ngIf="isLoading" class="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
         <div class="h-10 w-10 border-4 border-slate-100 border-t-zadna-primary rounded-full animate-spin"></div>
      </div>

      <div *ngFor="let item of data" 
           class="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-all"
           [class.cursor-pointer]="clickableRows"
           (click)="onRowClick(item)">
        
        <ng-container *ngTemplateOutlet="mobileCardTemplate; context: { $implicit: item }"></ng-container>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="data.length === 0 && !isLoading" 
         class="relative p-20 text-center animate-in zoom-in duration-700">
      <div class="max-w-md mx-auto space-y-6">
        <div class="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center mx-auto text-slate-100">
          <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
          </svg>
        </div>
        <h3 class="text-3xl font-black text-slate-900 tracking-tight">{{ emptyStateTitle | translate }}</h3>
        <p class="text-sm font-bold text-slate-400 leading-relaxed">{{ emptyStateMessage | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .primary { color: var(--primary-color, #127c8c); }
    .bg-primary { background-color: var(--primary-color, #127c8c); }
    .text-primary { color: var(--primary-color, #127c8c); }
    .border-primary { border-color: var(--primary-color, #127c8c); }
    .focus\\:ring-primary\\/20:focus { box-shadow: 0 0 0 4px var(--primary-color-20, #127c8c33); }
    .hover\\:bg-primary:hover { background-color: var(--primary-color, #127c8c); }
  `]
})
export class DataTableComponent<T extends object = Record<string, unknown>> {
  @Input() data: T[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() bulkActions: BulkAction[] = [];
  @Input() selectable = false;
  @Input() showBulkActions = true;
  @Input() clickableRows = false;
  @Input() emptyStateTitle = 'COMMON.NO_RESULTS';
  @Input() emptyStateMessage = 'COMMON.NO_RESULTS';
  @Input() idField = 'id';
  @Input() isLoading = false;
  @Input() containerClass = '';

  @Output() rowClick = new EventEmitter<T>();
  @Output() actionClick = new EventEmitter<{ action: TableAction; item: T }>();
  @Output() bulkActionClick = new EventEmitter<{ action: BulkAction; items: T[] }>();
  @Output() selectionChange = new EventEmitter<T[]>();

  @ContentChild('customColumn') customColumnTemplate: TemplateRef<unknown> | null = null;
  @ContentChild('mobileCard') mobileCardTemplate: TemplateRef<unknown> | null = null;

  selectedItems = new Set<unknown>();
  readonly selectionColumnWidth = '3.5rem';

  get allSelected(): boolean {
    return this.data.length > 0 && this.data.every((item) => this.selectedItems.has(this.getItemId(item)));
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedItems.clear();
    } else {
      this.data.forEach((item) => this.selectedItems.add(this.getItemId(item)));
    }
    this.emitSelectionChange();
  }

  toggleSelectItem(item: T) {
    const id = this.getItemId(item);
    if (this.selectedItems.has(id)) {
      this.selectedItems.delete(id);
    } else {
      this.selectedItems.add(id);
    }
    this.emitSelectionChange();
  }

  isSelected(item: T): boolean {
    return this.selectedItems.has(this.getItemId(item));
  }

  onRowClick(item: T) {
    if (this.clickableRows) {
      this.rowClick.emit(item);
    }
  }

  onAction(action: TableAction, item: T) {
    this.actionClick.emit({ action, item });
  }

  onBulkAction(action: BulkAction) {
    const selectedData = this.data.filter((item) => this.selectedItems.has(this.getItemId(item)));
    this.bulkActionClick.emit({ action, items: selectedData });
  }

  clearSelection() {
    this.selectedItems.clear();
    this.emitSelectionChange();
  }

  getColumnValue(item: T, key: string): string {
    const value = this.getResolvedColumnValue(item, key);
    return value == null ? '' : String(value);
  }

  getProgressValue(item: T, key: string): number {
    const value = this.getResolvedColumnValue(item, key);
    return typeof value === 'number' ? value : Number(value ?? 0);
  }

  getItemActions(item: T): TableAction[] {
    return this.actions.filter((action) => !action.condition || action.condition(item as Record<string, unknown>));
  }

  getColumnWidth(column: TableColumn): string | null {
    return column.width ?? null;
  }

  private getItemId(item: T): unknown {
    return this.getFieldValue(item, this.idField);
  }

  private getResolvedColumnValue(item: T, key: string): unknown {
    return key.split('.').reduce<any>((obj, prop) => {
      return obj && typeof obj === 'object' ? obj[prop] : undefined;
    }, item);
  }

  private getFieldValue(item: T, field: string): any {
    return (item as any)[field];
  }

  private emitSelectionChange() {
    const selectedData = this.data.filter((item) => this.selectedItems.has(this.getItemId(item)));
    this.selectionChange.emit(selectedData);
  }
}
