import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CatalogService } from '../../services/catalog.service';
import { Category } from '../../models/catalog.models';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppCategorySelectorComponent } from '../../../../shared/components/ui/category-selector/category-selector.component';

@Component({
  selector: 'app-product-submission',
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
    <div class="space-y-6 animate-fade-in pb-12">
      <app-page-header
        [title]="'CATALOG.SUBMIT_NEW_PRODUCT' | translate"
        [description]="'CATALOG.SUBMIT_NEW_PRODUCT_DESC' | translate"
        [showBack]="true"
        backLink="/products">
      </app-page-header>

      <div class="max-w-4xl mx-auto">
        <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="space-y-6">
          
          <!-- Basic Info Card -->
          <div class="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
            <h3 class="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
              <span class="w-2 h-6 bg-zadna-primary rounded-full"></span>
              {{ 'CATALOG.BASIC_INFO' | translate }}
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Name Ar -->
              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'CATALOG.PRODUCT_NAME_AR' | translate }} *
                </label>
                <input type="text" formControlName="productNameAr"
                  class="h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all outline-none"
                  [placeholder]="'CATALOG.PRODUCT_NAME_AR_PLACEHOLDER' | translate">
              </div>

              <!-- Name En -->
              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'CATALOG.PRODUCT_NAME_EN' | translate }} *
                </label>
                <input type="text" formControlName="productNameEn"
                  class="h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all outline-none"
                  [placeholder]="'CATALOG.PRODUCT_NAME_EN_PLACEHOLDER' | translate">
              </div>

              <!-- Description Ar -->
              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'CATALOG.DESCRIPTION_AR' | translate }}
                </label>
                <textarea formControlName="descriptionAr" rows="3"
                  class="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all outline-none resize-none"></textarea>
              </div>

              <!-- Description En -->
              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'CATALOG.DESCRIPTION_EN' | translate }}
                </label>
                <textarea formControlName="descriptionEn" rows="3"
                  class="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all outline-none resize-none"></textarea>
              </div>
            </div>
          </div>

          <!-- Category & Brand Card -->
          <div class="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
            <h3 class="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
              <span class="w-2 h-6 bg-zadna-primary rounded-full"></span>
              {{ 'CATALOG.CLASSIFICATION' | translate }}
            </h3>

            <div class="space-y-6">
              <!-- Hierarchical Category Selector -->
              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'CATALOG.SELECT_CATEGORY_HIERARCHY' | translate }} *
                </label>
                <app-category-selector
                  [categories]="categories"
                  [isAr]="translate.currentLang === 'ar'"
                  (categoryChange)="onCategoryChange($event)">
                </app-category-selector>
              </div>

              <!-- Suggested Brand -->
              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'CATALOG.SUGGESTED_BRAND' | translate }}
                </label>
                <input type="text" formControlName="suggestedBrandName"
                  class="h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all outline-none"
                  [placeholder]="'CATALOG.BRAND_NAME_PLACEHOLDER' | translate">
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4">
            <app-button
              type="button"
              variant="secondary"
              routerLink="/products">
              {{ 'COMMON.CANCEL' | translate }}
            </app-button>
            <app-button
              type="submit"
              variant="primary"
              [disabled]="productForm.invalid || isSubmitting"
              [isLoading]="isSubmitting">
              {{ 'CATALOG.SUBMIT_REQUEST' | translate }}
            </app-button>
          </div>

        </form>
      </div>
    </div>
  `
})
export class ProductSubmissionComponent implements OnInit {
  productForm: FormGroup;
  categories: Category[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService,
    public translate: TranslateService,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      productNameAr: ['', [Validators.required, Validators.minLength(3)]],
      productNameEn: ['', [Validators.required, Validators.minLength(3)]],
      descriptionAr: [''],
      descriptionEn: [''],
      categoryId: ['', Validators.required],
      suggestedBrandName: [''],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe(res => {
      this.categories = res;
    });
  }

  onCategoryChange(id: string | null): void {
    this.productForm.patchValue({ categoryId: id });
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    this.isSubmitting = true;
    this.catalogService.submitProductRequest(this.productForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        // Navigate back or to success page
        alert(this.translate.instant('CATALOG.REQUEST_SUBMITTED_SUCCESS'));
        this.router.navigate(['/products']);
      },
      error: () => {
        this.isSubmitting = false;
        alert(this.translate.instant('COMMON.ERROR_OCCURRED'));
      }
    });
  }
}
