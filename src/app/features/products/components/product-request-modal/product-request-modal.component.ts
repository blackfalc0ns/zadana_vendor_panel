import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BrandOption, CatalogService, Category, UnitOption } from '../../../../services/catalog.service';

@Component({
  selector: 'app-product-request-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div class="w-full max-w-4xl overflow-hidden rounded-[32px] bg-white shadow-2xl" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
        <div class="relative border-b border-slate-100 bg-slate-50/50 p-6 px-8">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-zadna-primary/10 text-zadna-primary">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-black tracking-tight text-slate-900">{{ 'PRODUCTS.REQUEST_NEW_TITLE' | translate }}</h2>
              <p class="text-[0.8rem] font-bold text-slate-500">{{ 'PRODUCTS.REQUEST_NEW_SUBTITLE' | translate }}</p>
            </div>
          </div>

          <button type="button" (click)="onClose()" class="absolute end-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-600">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="max-h-[78vh] overflow-y-auto p-8 no-scrollbar">
          <form [formGroup]="requestForm" (submit)="onSubmit($event)" class="space-y-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <h4 class="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-widest text-zadna-primary">
                  <span class="h-1.5 w-1.5 rounded-full bg-zadna-primary"></span>
                  {{ 'COMMON.ARABIC_DATA' | translate }}
                </h4>
                <input type="text" formControlName="nameAr" class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.NAME_AR' | translate">
                <textarea formControlName="descriptionAr" rows="3" class="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.DESCRIPTION_AR' | translate"></textarea>
              </div>

              <div class="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4" dir="ltr">
                <h4 class="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-widest text-slate-400">
                  <span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                  {{ 'COMMON.ENGLISH_DATA' | translate }}
                </h4>
                <input type="text" formControlName="nameEn" class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.NAME_EN' | translate">
                <textarea formControlName="descriptionEn" rows="3" class="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.DESCRIPTION_EN' | translate"></textarea>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-6">
              <select formControlName="unitId" class="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none">
                <option value="">{{ 'COMMON.SELECT_UNIT' | translate }}</option>
                @for (unit of units; track unit.id) {
                  <option [value]="unit.id">{{ currentLang === 'ar' ? unit.nameAr : unit.nameEn }}</option>
                }
              </select>
            </div>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-[0.72rem] font-black uppercase text-slate-500">{{ 'PRODUCTS.BRAND' | translate }}</p>
                    <p class="mt-1 text-[0.82rem] font-bold text-slate-900">{{ selectedBrandLabel || ('PRODUCTS.SELECT_BRAND' | translate) }}</p>
                  </div>
                  <button type="button" (click)="isBrandModalOpen = true" class="rounded-xl border border-slate-200 px-3 py-2 text-[0.72rem] font-black text-zadna-primary">
                    {{ 'PRODUCTS.OPEN_BRAND_MODAL' | translate }}
                  </button>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-[0.72rem] font-black uppercase text-slate-500">{{ 'PRODUCTS.CATEGORY' | translate }}</p>
                    <p class="mt-1 text-[0.82rem] font-bold text-slate-900">{{ selectedCategoryLabel || ('COMMON.SELECT_CATEGORY' | translate) }}</p>
                    @if (selectedCategoryMeta) {
                      <p class="mt-1 text-[0.68rem] font-bold text-slate-400">{{ selectedCategoryMeta }}</p>
                    }
                  </div>
                  <button type="button" (click)="isCategoryModalOpen = true" class="rounded-xl border border-slate-200 px-3 py-2 text-[0.72rem] font-black text-zadna-primary">
                    {{ 'PRODUCTS.OPEN_CATEGORY_MODAL' | translate }}
                  </button>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 p-6 text-center">
              <p class="text-[0.75rem] font-black text-slate-600">{{ 'PRODUCTS.UPLOAD_PHOTO' | translate }}</p>
              <p class="text-[0.65rem] font-bold text-slate-400">{{ 'COMMON.OPTIONAL' | translate }}</p>
            </div>

            <div class="flex items-center gap-4 pt-4">
              <button type="button" (click)="onClose()" class="flex-1 rounded-2xl border border-slate-200 py-3.5 text-[0.82rem] font-black text-slate-500">{{ 'COMMON.CANCEL' | translate }}</button>
              <button type="submit" [disabled]="requestForm.invalid || isSubmitting" class="flex-[2] rounded-2xl bg-zadna-primary py-3.5 text-[0.82rem] font-black text-white">
                @if (isSubmitting) {
                  <div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                } @else {
                  {{ 'PRODUCTS.SUBMIT_REQUEST' | translate }}
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    @if (isBrandModalOpen) {
      <div class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        <div class="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h3 class="text-lg font-black text-slate-900">{{ 'PRODUCTS.BRAND_MODAL_TITLE' | translate }}</h3>
              <p class="text-[0.8rem] font-bold text-slate-500">{{ 'PRODUCTS.BRAND_MODAL_DESC' | translate }}</p>
            </div>
            <button type="button" (click)="closeBrandModal()" class="h-10 w-10 rounded-full bg-slate-50 text-slate-400">×</button>
          </div>

          <div class="mt-5 space-y-4" [formGroup]="brandDraftForm">
            <select formControlName="brandId" class="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none">
              <option value="">{{ 'PRODUCTS.SELECT_BRAND' | translate }}</option>
              @for (brand of brands; track brand.id) {
                <option [value]="brand.id">{{ currentLang === 'ar' ? brand.nameAr : brand.nameEn }}</option>
              }
            </select>

            <div class="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[0.78rem] font-black text-amber-800">{{ 'PRODUCTS.REQUEST_MISSING_BRAND' | translate }}</p>
                  <p class="mt-1 text-[0.72rem] font-bold text-amber-700/80">{{ 'PRODUCTS.REQUEST_MISSING_BRAND_HINT' | translate }}</p>
                </div>
                <button type="button" (click)="toggleBrandDraftMode()" class="rounded-xl bg-white px-3 py-2 text-[0.72rem] font-black text-amber-700">
                  {{ brandDraftForm.get('isNew')?.value ? ('COMMON.CANCEL' | translate) : ('PRODUCTS.ADD_NEW_BRAND' | translate) }}
                </button>
              </div>

              @if (brandDraftForm.get('isNew')?.value) {
                <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input type="text" formControlName="nameAr" class="h-11 w-full rounded-xl border border-amber-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.NEW_BRAND_AR' | translate">
                  <input type="text" formControlName="nameEn" class="h-11 w-full rounded-xl border border-amber-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.NEW_BRAND_EN' | translate" dir="ltr">
                </div>

                <div class="mt-4 rounded-2xl border border-amber-200/70 bg-white p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[0.75rem] font-black text-slate-700">{{ 'PRODUCTS.BRAND_IMAGE' | translate }}</p>
                      <p class="mt-1 text-[0.68rem] font-bold text-slate-400">{{ 'COMMON.OPTIONAL' | translate }}</p>
                    </div>
                    <label class="cursor-pointer rounded-xl border border-amber-200 px-3 py-2 text-[0.72rem] font-black text-amber-700">
                      {{ 'PRODUCTS.UPLOAD_IMAGE' | translate }}
                      <input type="file" accept="image/*" class="hidden" (change)="onBrandImageSelected($event)">
                    </label>
                  </div>

                  @if (brandDraftForm.get('logoUrl')?.value) {
                    <div class="mt-4 flex items-center gap-3">
                      <img [src]="brandDraftForm.get('logoUrl')?.value" class="h-14 w-14 rounded-2xl border border-amber-100 bg-slate-50 object-cover">
                      <button type="button" (click)="brandDraftForm.patchValue({ logoUrl: '' })" class="text-[0.72rem] font-black text-rose-500">
                        {{ 'PRODUCTS.REMOVE_IMAGE' | translate }}
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="mt-6 flex items-center gap-3">
            <button type="button" (click)="closeBrandModal()" class="flex-1 rounded-2xl border border-slate-200 py-3 text-[0.8rem] font-black text-slate-500">{{ 'COMMON.CANCEL' | translate }}</button>
            <button type="button" (click)="saveBrandDraft()" class="flex-1 rounded-2xl bg-zadna-primary py-3 text-[0.8rem] font-black text-white">{{ 'COMMON.SAVE' | translate }}</button>
          </div>
        </div>
      </div>
    }

    @if (isCategoryModalOpen) {
      <div class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        <div class="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h3 class="text-lg font-black text-slate-900">{{ 'PRODUCTS.CATEGORY_MODAL_TITLE' | translate }}</h3>
              <p class="text-[0.8rem] font-bold text-slate-500">{{ 'PRODUCTS.CATEGORY_MODAL_DESC' | translate }}</p>
            </div>
            <button type="button" (click)="closeCategoryModal()" class="h-10 w-10 rounded-full bg-slate-50 text-slate-400">×</button>
          </div>

          <div class="mt-5 space-y-4" [formGroup]="categoryDraftForm">
            <select formControlName="categoryId" class="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none">
              <option value="">{{ 'COMMON.SELECT_CATEGORY' | translate }}</option>
              @for (category of categories; track category.id) {
                <option [value]="category.id">{{ getCategoryPathLabel(category) }}</option>
              }
            </select>

            <div class="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[0.78rem] font-black text-cyan-800">{{ 'PRODUCTS.REQUEST_MISSING_CATEGORY' | translate }}</p>
                  <p class="mt-1 text-[0.72rem] font-bold text-cyan-700/80">{{ 'PRODUCTS.REQUEST_MISSING_CATEGORY_HINT' | translate }}</p>
                </div>
                <button type="button" (click)="toggleCategoryDraftMode()" class="rounded-xl bg-white px-3 py-2 text-[0.72rem] font-black text-cyan-700">
                  {{ categoryDraftForm.get('isNew')?.value ? ('COMMON.CANCEL' | translate) : ('PRODUCTS.ADD_NEW_CATEGORY' | translate) }}
                </button>
              </div>

              @if (categoryDraftForm.get('isNew')?.value) {
                <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input type="text" formControlName="nameAr" class="h-11 w-full rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.NEW_CATEGORY_AR' | translate">
                  <input type="text" formControlName="nameEn" class="h-11 w-full rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.NEW_CATEGORY_EN' | translate" dir="ltr">
                  <select formControlName="parentCategoryId" class="h-11 w-full appearance-none rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none">
                    <option value="">{{ 'PRODUCTS.SELECT_PARENT_CATEGORY' | translate }}</option>
                    @for (category of categories; track category.id) {
                      <option [value]="category.id">{{ getCategoryPathLabel(category) }}</option>
                    }
                  </select>
                  <input type="number" min="1" formControlName="displayOrder" class="h-11 w-full rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.DISPLAY_ORDER' | translate">
                </div>

                <div class="mt-4 rounded-2xl border border-cyan-200/70 bg-white p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[0.75rem] font-black text-slate-700">{{ 'PRODUCTS.CATEGORY_IMAGE' | translate }}</p>
                      <p class="mt-1 text-[0.68rem] font-bold text-slate-400">{{ 'COMMON.OPTIONAL' | translate }}</p>
                    </div>
                    <label class="cursor-pointer rounded-xl border border-cyan-200 px-3 py-2 text-[0.72rem] font-black text-cyan-700">
                      {{ 'PRODUCTS.UPLOAD_IMAGE' | translate }}
                      <input type="file" accept="image/*" class="hidden" (change)="onCategoryImageSelected($event)">
                    </label>
                  </div>

                  @if (categoryDraftForm.get('imageUrl')?.value) {
                    <div class="mt-4 flex items-center gap-3">
                      <img [src]="categoryDraftForm.get('imageUrl')?.value" class="h-14 w-14 rounded-2xl border border-cyan-100 bg-slate-50 object-cover">
                      <button type="button" (click)="categoryDraftForm.patchValue({ imageUrl: '' })" class="text-[0.72rem] font-black text-rose-500">
                        {{ 'PRODUCTS.REMOVE_IMAGE' | translate }}
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="mt-6 flex items-center gap-3">
            <button type="button" (click)="closeCategoryModal()" class="flex-1 rounded-2xl border border-slate-200 py-3 text-[0.8rem] font-black text-slate-500">{{ 'COMMON.CANCEL' | translate }}</button>
            <button type="button" (click)="saveCategoryDraft()" class="flex-1 rounded-2xl bg-zadna-primary py-3 text-[0.8rem] font-black text-white">{{ 'COMMON.SAVE' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ProductRequestModalComponent implements OnInit {
  @Input() initialName = '';
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  requestForm: FormGroup;
  brandDraftForm: FormGroup;
  categoryDraftForm: FormGroup;
  categories: Category[] = [];
  brands: BrandOption[] = [];
  units: UnitOption[] = [];
  isSubmitting = false;
  isBrandModalOpen = false;
  isCategoryModalOpen = false;
  currentLang = 'ar';
  selectedBrandLabel = '';
  selectedCategoryLabel = '';
  selectedCategoryMeta = '';

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService,
    private translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.translate.onLangChange.subscribe(event => (this.currentLang = event.lang));

    this.requestForm = this.fb.group({
      nameAr: ['', [Validators.required, Validators.minLength(3)]],
      nameEn: ['', [Validators.required, Validators.minLength(3)]],
      descriptionAr: [''],
      descriptionEn: [''],
      brandId: [''],
      categoryId: ['', Validators.required],
      unitId: ['', Validators.required]
    });

    this.brandDraftForm = this.fb.group({
      isNew: [false],
      brandId: [''],
      nameAr: [''],
      nameEn: [''],
      logoUrl: ['']
    });

    this.categoryDraftForm = this.fb.group({
      isNew: [false],
      categoryId: [''],
      nameAr: [''],
      nameEn: [''],
      parentCategoryId: [''],
      displayOrder: [1],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    if (this.initialName) {
      this.requestForm.patchValue({ nameAr: this.initialName, nameEn: this.initialName });
    }
    this.loadData();
  }

  loadData(): void {
    this.catalogService.getCategories().subscribe(cats => (this.categories = cats));
    this.catalogService.getBrands().subscribe(brands => (this.brands = brands));
    this.catalogService.getUnits().subscribe(units => (this.units = units));
  }

  onClose(): void {
    this.close.emit();
  }

  closeBrandModal(): void {
    this.isBrandModalOpen = false;
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen = false;
  }

  toggleBrandDraftMode(): void {
    const next = !this.brandDraftForm.get('isNew')?.value;
    this.brandDraftForm.patchValue({ isNew: next, brandId: '', logoUrl: '' });
    this.applyBrandDraftValidators(next);
  }

  toggleCategoryDraftMode(): void {
    const next = !this.categoryDraftForm.get('isNew')?.value;
    this.categoryDraftForm.patchValue({ isNew: next, categoryId: '', imageUrl: '' });
    this.applyCategoryDraftValidators(next);
  }

  saveBrandDraft(): void {
    const isNew = !!this.brandDraftForm.get('isNew')?.value;

    if (isNew) {
      this.applyBrandDraftValidators(true);
      if (this.brandDraftForm.get('nameAr')?.invalid || this.brandDraftForm.get('nameEn')?.invalid) {
        this.brandDraftForm.markAllAsTouched();
        return;
      }

      this.selectedBrandLabel = this.currentLang === 'ar'
        ? this.brandDraftForm.get('nameAr')?.value
        : this.brandDraftForm.get('nameEn')?.value;
      this.requestForm.patchValue({ brandId: '' });
    } else {
      const brandId = this.brandDraftForm.get('brandId')?.value;
      const brand = this.brands.find(item => item.id === brandId);
      if (!brand) return;

      this.requestForm.patchValue({ brandId });
      this.selectedBrandLabel = this.currentLang === 'ar' ? brand.nameAr : brand.nameEn;
      this.brandDraftForm.patchValue({ nameAr: '', nameEn: '', logoUrl: '' });
    }

    this.closeBrandModal();
  }

  saveCategoryDraft(): void {
    const isNew = !!this.categoryDraftForm.get('isNew')?.value;

    if (isNew) {
      this.applyCategoryDraftValidators(true);
      if (this.categoryDraftForm.invalid) {
        this.categoryDraftForm.markAllAsTouched();
        return;
      }

      const parentId = this.categoryDraftForm.get('parentCategoryId')?.value;
      const parent = this.categories.find(item => item.id === parentId);
      const order = this.categoryDraftForm.get('displayOrder')?.value || 1;

      this.requestForm.patchValue({ categoryId: '' });
      this.selectedCategoryLabel = this.currentLang === 'ar'
        ? this.categoryDraftForm.get('nameAr')?.value
        : this.categoryDraftForm.get('nameEn')?.value;
      this.selectedCategoryMeta = parent
        ? `${this.translate.instant('PRODUCTS.PARENT_CATEGORY')}: ${this.getCategoryPathLabel(parent)} • ${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${order}`
        : `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${order}`;
    } else {
      const categoryId = this.categoryDraftForm.get('categoryId')?.value;
      const category = this.categories.find(item => item.id === categoryId);
      if (!category) return;

      this.requestForm.patchValue({ categoryId });
      this.selectedCategoryLabel = this.getCategoryPathLabel(category);
      this.selectedCategoryMeta = category.displayOrder
        ? `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${category.displayOrder}`
        : '';
      this.categoryDraftForm.patchValue({ nameAr: '', nameEn: '', parentCategoryId: '', displayOrder: 1, imageUrl: '' });
    }

    this.closeCategoryModal();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.requestForm.invalid) return;

    this.isSubmitting = true;
    const formValue = this.requestForm.getRawValue();
    const brandDraft = this.brandDraftForm.getRawValue();
    const categoryDraft = this.categoryDraftForm.getRawValue();

    const payload = {
      product: {
        nameAr: formValue.nameAr,
        nameEn: formValue.nameEn,
        descriptionAr: formValue.descriptionAr || '',
        descriptionEn: formValue.descriptionEn || '',
        categoryId: categoryDraft.isNew ? null : formValue.categoryId || null,
        brandId: brandDraft.isNew ? null : formValue.brandId || null,
        unitId: formValue.unitId || null,
        images: []
      },
      requestedBrand: brandDraft.isNew
        ? {
            nameAr: brandDraft.nameAr,
            nameEn: brandDraft.nameEn,
            logoUrl: brandDraft.logoUrl || null,
            isActive: true
          }
        : null,
      requestedCategory: categoryDraft.isNew
        ? {
            nameAr: categoryDraft.nameAr,
            nameEn: categoryDraft.nameEn,
            parentCategoryId: categoryDraft.parentCategoryId || null,
            displayOrder: Number(categoryDraft.displayOrder || 1),
            imageUrl: categoryDraft.imageUrl || null,
            isActive: true
          }
        : null
    };

    this.catalogService.submitProductRequest(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitted.emit();
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  onBrandImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.brandDraftForm.patchValue({ logoUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  onCategoryImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.categoryDraftForm.patchValue({ imageUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  getCategoryPathLabel(category: Category): string {
    const names: string[] = [];
    let current: Category | undefined = category;

    while (current) {
      names.unshift(this.currentLang === 'ar' ? current.nameAr : current.nameEn);
      const parentId: string | null | undefined = current.parentCategoryId;
      current = parentId ? this.categories.find(item => item.id === parentId) : undefined;
    }

    return names.join(' / ');
  }

  private applyBrandDraftValidators(isNew: boolean): void {
    const ar = this.brandDraftForm.get('nameAr');
    const en = this.brandDraftForm.get('nameEn');

    if (isNew) {
      ar?.setValidators([Validators.required, Validators.minLength(2)]);
      en?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      ar?.clearValidators();
      en?.clearValidators();
    }

    ar?.updateValueAndValidity();
    en?.updateValueAndValidity();
  }

  private applyCategoryDraftValidators(isNew: boolean): void {
    const ar = this.categoryDraftForm.get('nameAr');
    const en = this.categoryDraftForm.get('nameEn');
    const order = this.categoryDraftForm.get('displayOrder');

    if (isNew) {
      ar?.setValidators([Validators.required, Validators.minLength(2)]);
      en?.setValidators([Validators.required, Validators.minLength(2)]);
      order?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      ar?.clearValidators();
      en?.clearValidators();
      order?.clearValidators();
    }

    ar?.updateValueAndValidity();
    en?.updateValueAndValidity();
    order?.updateValueAndValidity();
  }

}
