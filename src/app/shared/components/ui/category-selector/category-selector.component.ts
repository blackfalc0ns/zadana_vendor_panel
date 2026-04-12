import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../../../features/products/models/catalog.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-category-selector',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Level 1 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ltr:ml-1 rtl:mr-1">
            {{ 'CATALOG.CATEGORY_L1' | translate }}
          </label>
          <select 
            (change)="onLevel1Change($any($event.target).value)"
            class="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all cursor-pointer">
            <option value="">{{ 'COMMON.SELECT' | translate }}</option>
            <option *ngFor="let cat of level1Categories" [value]="cat.id">
              {{ isAr ? cat.nameAr : cat.nameEn }}
            </option>
          </select>
        </div>

        <!-- Level 2 -->
        <div class="flex flex-col gap-1.5" *ngIf="level2Categories.length > 0">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ltr:ml-1 rtl:mr-1">
            {{ 'CATALOG.CATEGORY_L2' | translate }}
          </label>
          <select 
            (change)="onLevel2Change($any($event.target).value)"
            class="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all cursor-pointer">
            <option value="">{{ 'COMMON.SELECT' | translate }}</option>
            <option *ngFor="let cat of level2Categories" [value]="cat.id">
              {{ isAr ? cat.nameAr : cat.nameEn }}
            </option>
          </select>
        </div>

        <!-- Level 3 -->
        <div class="flex flex-col gap-1.5" *ngIf="level3Categories.length > 0">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ltr:ml-1 rtl:mr-1">
            {{ 'CATALOG.CATEGORY_L3' | translate }}
          </label>
          <select 
            (change)="onLevel3Change($any($event.target).value)"
            class="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all cursor-pointer">
            <option value="">{{ 'COMMON.SELECT' | translate }}</option>
            <option *ngFor="let cat of level3Categories" [value]="cat.id">
              {{ isAr ? cat.nameAr : cat.nameEn }}
            </option>
          </select>
        </div>
      </div>

      <!-- Selection Path -->
      <div class="flex items-center gap-2 px-3 py-2 bg-zadna-primary/[0.03] border border-zadna-primary/10 rounded-lg" *ngIf="selectedPath.length > 0">
        <span class="text-[10px] font-black text-zadna-primary uppercase">{{ 'CATALOG.SELECTED_PATH' | translate }}:</span>
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <ng-container *ngFor="let step of selectedPath; let last = last">
            <span class="text-xs font-bold text-slate-600 whitespace-nowrap">{{ step }}</span>
            <svg *ngIf="!last" class="w-3 h-3 text-slate-300 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `
  ]
})
export class AppCategorySelectorComponent implements OnInit {
  @Input() categories: Category[] = [];
  @Input() initialCategoryId?: string;
  @Input() isAr: boolean = true;
  @Output() categoryChange = new EventEmitter<string | null>();

  level1Categories: Category[] = [];
  level2Categories: Category[] = [];
  level3Categories: Category[] = [];

  selectedL1: string = '';
  selectedL2: string = '';
  selectedL3: string = '';

  selectedPath: string[] = [];

  ngOnInit(): void {
    this.level1Categories = this.categories;
    if (this.initialCategoryId) {
      // Find and select initial
    }
  }

  onLevel1Change(id: string): void {
    this.selectedL1 = id;
    this.selectedL2 = '';
    this.selectedL3 = '';
    this.level2Categories = [];
    this.level3Categories = [];
    
    if (id) {
      const cat = this.level1Categories.find(c => c.id === id);
      this.level2Categories = cat?.subCategories || [];
      this.updatePath();
      this.categoryChange.emit(id);
    } else {
      this.updatePath();
      this.categoryChange.emit(null);
    }
  }

  onLevel2Change(id: string): void {
    this.selectedL2 = id;
    this.selectedL3 = '';
    this.level3Categories = [];

    if (id) {
      const cat = this.level2Categories.find(c => c.id === id);
      this.level3Categories = cat?.subCategories || [];
      this.updatePath();
      this.categoryChange.emit(id);
    } else {
      this.updatePath();
      this.categoryChange.emit(this.selectedL1);
    }
  }

  onLevel3Change(id: string): void {
    this.selectedL3 = id;
    this.updatePath();
    this.categoryChange.emit(id || this.selectedL2);
  }

  private updatePath(): void {
    this.selectedPath = [];
    if (this.selectedL1) {
      const c1 = this.level1Categories.find(c => c.id === this.selectedL1);
      if (c1) this.selectedPath.push(this.isAr ? c1.nameAr : c1.nameEn);
    }
    if (this.selectedL2) {
      const c2 = this.level2Categories.find(c => c.id === this.selectedL2);
      if (c2) this.selectedPath.push(this.isAr ? c2.nameAr : c2.nameEn);
    }
    if (this.selectedL3) {
      const c3 = this.level3Categories.find(c => c.id === this.selectedL3);
      if (c3) this.selectedPath.push(this.isAr ? c3.nameAr : c3.nameEn);
    }
  }
}
