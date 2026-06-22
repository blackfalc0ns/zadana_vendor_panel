import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CatalogService } from '../../services/catalog.service';
import { Category } from '../../models/catalog.models';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppCategorySelectorComponent } from '../../../../shared/components/ui/category-selector/category-selector.component';
import { AlertModalService } from '../../../../core/notifications/services/alert-modal.service';
import { describeApiError } from '../../../../shared/utils/api-error.util';
import { UploadProgressComponent } from '../../../../shared/components/ui/feedback/upload-progress/upload-progress.component';
import { ImageUploadPhase, optimizeImageForUpload } from '../../../../shared/utils/image-upload-optimizer';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-product-submission',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    AppPageHeaderComponent,
    AppButtonComponent,
    AppCategorySelectorComponent,
    UploadProgressComponent
  ],
  template: `
    <div class="space-y-6 animate-fade-in pb-12">
      <app-page-header
        [title]="'PRODUCTS.SUBMIT_NEW_PRODUCT' | translate"
        [description]="'PRODUCTS.SUBMIT_NEW_PRODUCT_DESC' | translate"
        [showBack]="true"
        backLink="/products">
      </app-page-header>

      <div class="max-w-4xl mx-auto">
        <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="space-y-6">
          
          <!-- Basic Info Card -->
          <div class="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
            <h3 class="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
              <span class="w-2 h-6 bg-zadna-primary rounded-full"></span>
              {{ 'PRODUCTS.BASIC_INFO' | translate }}
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Name Ar -->
              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'PRODUCTS.PRODUCT_NAME_AR' | translate }} *
                </label>
                <input type="text" formControlName="productNameAr"
                  class="h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all outline-none"
                  [placeholder]="'PRODUCTS.PRODUCT_NAME_AR_PLACEHOLDER' | translate">
              </div>

              <!-- Name En -->
              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'PRODUCTS.PRODUCT_NAME_EN' | translate }} *
                </label>
                <input type="text" formControlName="productNameEn"
                  class="h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all outline-none"
                  [placeholder]="'PRODUCTS.PRODUCT_NAME_EN_PLACEHOLDER' | translate">
              </div>

              <!-- Description Ar -->
              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'PRODUCTS.DESCRIPTION_AR' | translate }}
                </label>
                <textarea formControlName="descriptionAr" rows="3"
                  class="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all outline-none resize-none"></textarea>
              </div>

              <!-- Description En -->
              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'PRODUCTS.DESCRIPTION_EN' | translate }}
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
              {{ 'PRODUCTS.CLASSIFICATION' | translate }}
            </h3>

            <div class="space-y-6">
              <!-- Hierarchical Category Selector -->
              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider ltr:ml-1 rtl:mr-1">
                  {{ 'PRODUCTS.SELECT_CATEGORY_HIERARCHY' | translate }} *
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
                  {{ 'PRODUCTS.SUGGESTED_BRAND' | translate }}
                </label>
                <input type="text" formControlName="suggestedBrandName"
                  class="h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-zadna-primary/20 focus:border-zadna-primary transition-all outline-none"
                  [placeholder]="'PRODUCTS.BRAND_NAME_PLACEHOLDER' | translate">
              </div>
            </div>
          </div>
          <!-- Product Image Card -->
          <div class="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
            <h3 class="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
              <span class="w-2 h-6 bg-zadna-primary rounded-full"></span>
              {{ 'PRODUCTS.IMAGE' | translate }}
            </h3>

            <div class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-6 text-center relative hover:bg-slate-50/60 transition-all">
              @if (productImageFile) {
                <div class="flex items-center justify-between gap-4 px-4">
                  <div class="flex items-center gap-3">
                    <img [src]="productImagePreviewUrl" class="h-10 w-10 rounded-lg object-cover bg-white border">
                    <span class="text-[0.75rem] font-bold text-slate-600 truncate max-w-[200px]">{{ productImageFile.name }}</span>
                  </div>
                  <button type="button" (click)="removeProductImage()" class="text-[0.72rem] font-black text-rose-500">
                    {{ 'PRODUCTS.REMOVE_IMAGE' | translate }}
                  </button>
                </div>
              } @else {
                <label class="block w-full h-full cursor-pointer">
                  <p class="text-[0.75rem] font-black text-slate-600">{{ 'PRODUCTS.UPLOAD_PHOTO' | translate }}</p>
                  <p class="text-[0.65rem] font-bold text-slate-400">{{ 'COMMON.OPTIONAL' | translate }}</p>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" class="hidden" (change)="onProductImageSelected($event)">
                </label>
              }
            </div>
            @if (isSubmitting && productImageFile) {
              <div class="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-start">
                <app-upload-progress [progress]="uploadProgress" [phase]="uploadPhase"></app-upload-progress>
              </div>
            }
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
              {{ 'PRODUCTS.SUBMIT_REQUEST' | translate }}
            </app-button>
          </div>

        </form>
      </div>
    </div>
  `
})
export class ProductSubmissionComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  productForm: FormGroup;
  categories: Category[] = [];
  isSubmitting = false;
  productImageFile: File | null = null;
  productImagePreviewUrl = '';
  isOptimizingProductImage = false;
  uploadProgress = 0;
  uploadPhase: ImageUploadPhase = 'preparing';

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService,
    public translate: TranslateService,
    private router: Router,
    private alertModalService: AlertModalService
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
      this.cdr.markForCheck();
      this.categories = res;
    });
  }

  onCategoryChange(id: string | null): void {
    this.productForm.patchValue({ categoryId: id });
  }

  async onProductImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    input.value = '';
    this.isOptimizingProductImage = true;
    this.cdr.markForCheck();
    try {
      const prepared = await optimizeImageForUpload(file, 0);
      this.productImageFile = prepared;
      if (this.productImagePreviewUrl) {
        URL.revokeObjectURL(this.productImagePreviewUrl);
      }
      this.productImagePreviewUrl = URL.createObjectURL(prepared);
    } finally {
      this.isOptimizingProductImage = false;
      this.cdr.markForCheck();
    }
  }

  removeProductImage(): void {
    this.productImageFile = null;
    if (this.productImagePreviewUrl) {
      URL.revokeObjectURL(this.productImagePreviewUrl);
      this.productImagePreviewUrl = '';
    }
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    this.isSubmitting = true;
    this.uploadProgress = 0;
    this.uploadPhase = 'preparing';

    const upload$ = this.productImageFile
      ? this.catalogService.uploadFile(this.productImageFile, 'uploads/catalog/product-requests', (progress) => {
          this.uploadProgress = progress.percent;
          this.uploadPhase = progress.phase;
          this.cdr.markForCheck();
        })
      : of<string | null>(null);

    upload$.pipe(
      switchMap((productImageUrl) => {
        const payload = {
          ...this.productForm.value,
          imageUrl: productImageUrl
        };
        return this.catalogService.submitProductRequest(payload);
      })
    ).subscribe({
      next: () => {
        this.cdr.markForCheck();
        this.isSubmitting = false;
        void this.alertModalService.showAlert(this.translate.instant('PRODUCTS.REQUEST_SUBMITTED_SUCCESS'), 'COMMON.SUCCESS', 'success');
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.cdr.markForCheck();
        this.isSubmitting = false;
        void this.alertModalService.showAlert(
          describeApiError(error, this.translate, {
            fallbackKey: 'PRODUCTS.REQUEST_SUBMIT_FAILED',
            codePrefix: 'PRODUCTS.ERROR_CODES'
          }),
          'PRODUCTS.REQUEST_SUBMIT_FAILED_TITLE',
          'danger'
        );
      }
    });
  }
}
