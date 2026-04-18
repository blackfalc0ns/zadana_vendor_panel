import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { BrandOption, Category, UnitOption } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';

type CategoryLevelKey = 'activity' | 'sub_activity' | 'category' | 'sub_category';
type CategoryRequestKind = 'category' | 'sub_category';
@Component({
  selector: 'app-product-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, SearchableSelectComponent],
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
              <app-searchable-select
                formControlName="unitId"
                [options]="unitOptions"
                [placeholder]="'COMMON.SELECT_UNIT'"
                [searchPlaceholder]="'COMMON.SEARCH'"
                [noResultsText]="'COMMON.NO_RESULTS'">
              </app-searchable-select>
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
              <button type="submit" [disabled]="isSubmitDisabled" class="flex-[2] rounded-2xl bg-zadna-primary py-3.5 text-[0.82rem] font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
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
            <button type="button" (click)="closeBrandModal()" class="h-10 w-10 rounded-full bg-slate-50 text-slate-400">x</button>
          </div>

          <div class="mt-5 space-y-4" [formGroup]="brandDraftForm">
            <app-searchable-select
                      formControlName="brandId"
                      [options]="brandDropdownOptions"
                      [placeholder]="'PRODUCTS.SELECT_BRAND'"
                      [searchPlaceholder]="'COMMON.SEARCH'"
                      [noResultsText]="'COMMON.NO_RESULTS'"
                      (selectionChange)="brandDraftForm">
                    </app-searchable-select>

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
                  <div class="md:col-span-2">
                    <app-searchable-select
                      formControlName="categoryId"
                      [options]="brandRequestCategoryDropdownOptions"
                      [placeholder]="'PRODUCTS.SELECT_BRAND_CATEGORY'"
                      [searchPlaceholder]="'COMMON.SEARCH'"
                      [noResultsText]="'COMMON.NO_RESULTS'"
                      (selectionChange)="brandDraftForm">
                    </app-searchable-select>
                  </div>
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
            <button type="button" (click)="closeCategoryModal()" class="h-10 w-10 rounded-full bg-slate-50 text-slate-400">x</button>
          </div>

          <div class="mt-5 space-y-4" [formGroup]="categoryDraftForm">
            @if (!categoryDraftForm.get('isNew')?.value) {
              <app-searchable-select
                      formControlName="categoryId"
                      [options]="existingCategoryDropdownOptions"
                      [placeholder]="'COMMON.SELECT_CATEGORY'"
                      [searchPlaceholder]="'COMMON.SEARCH'"
                      [noResultsText]="'COMMON.NO_RESULTS'"
                      (selectionChange)="categoryDraftForm">
                    </app-searchable-select>
            }

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
                  <select formControlName="requestKind" (change)="onRequestKindChanged()" class="h-11 w-full appearance-none rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none md:col-span-2">
                    @for (requestKind of categoryRequestKindOptions; track requestKind) {
                      <option [value]="requestKind">{{ getRequestKindTranslateKey(requestKind) | translate }}</option>
                    }
                  </select>

                  <input type="text" formControlName="nameAr" class="h-11 w-full rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.NEW_CATEGORY_AR' | translate">
                  <input type="text" formControlName="nameEn" class="h-11 w-full rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.NEW_CATEGORY_EN' | translate" dir="ltr">

                  @if (requiresActivitySelection) {
                    <app-searchable-select
                      formControlName="activityId"
                      [options]="activityDropdownOptions"
                      [placeholder]="'PRODUCTS.SELECT_ACTIVITY'"
                      [searchPlaceholder]="'COMMON.SEARCH'"
                      [noResultsText]="'COMMON.NO_RESULTS'"
                      (selectionChange)="categoryDraftForm; onActivityChanged()">
                    </app-searchable-select>
                  }

                  @if (requiresSubActivitySelection) {
                    <app-searchable-select
                      formControlName="subActivityId"
                      [disabled]="!categoryDraftForm.get('activityId')?.value"
                      [options]="subActivityDropdownOptions"
                      [placeholder]="'PRODUCTS.SELECT_SUB_ACTIVITY_OPTIONAL'"
                      [searchPlaceholder]="'COMMON.SEARCH'"
                      [noResultsText]="'COMMON.NO_RESULTS'"
                      (selectionChange)="categoryDraftForm; onSubActivityChanged()">
                    </app-searchable-select>
                  }

                  @if (requiresCategorySelection) {
                    <app-searchable-select
                      formControlName="categoryParentId"
                      [options]="categoryParentDropdownOptions"
                      [placeholder]="'PRODUCTS.SELECT_PARENT_CATEGORY'"
                      [searchPlaceholder]="'COMMON.SEARCH'"
                      [noResultsText]="'COMMON.NO_RESULTS'"
                      (selectionChange)="categoryDraftForm">
                    </app-searchable-select>
                  }

                  <input type="number" min="1" formControlName="displayOrder" class="h-11 w-full rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.DISPLAY_ORDER' | translate">
                </div>

                <div class="mt-4 rounded-2xl border border-cyan-200/70 bg-white p-4">
                  <div class="grid gap-3 md:grid-cols-2">
                    <div>
                      <p class="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.CATEGORY_REQUEST_KIND' | translate }}</p>
                      <p class="mt-1 text-[0.82rem] font-bold text-slate-800">{{ getRequestKindTranslateKey(selectedRequestKind) | translate }}</p>
                    </div>
                    <div>
                      <p class="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.CATEGORY_PLACEMENT_PREVIEW' | translate }}</p>
                      <p class="mt-1 text-[0.82rem] font-bold text-slate-800">{{ buildRequestedCategoryPathPreview() || ('PRODUCTS.CATEGORY_PLACEMENT_PENDING' | translate) }}</p>
                    </div>
                  </div>

                  <div class="mt-4 flex items-center justify-between gap-3">
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
  flatCategories: Category[] = [];
  brands: BrandOption[] = [];
  units: UnitOption[] = [];
  isSubmitting = false;
  isBrandModalOpen = false;
  isCategoryModalOpen = false;
  currentLang = 'ar';
  selectedBrandLabel = '';
  selectedCategoryLabel = '';
  selectedCategoryMeta = '';
  brandImageFile: File | null = null;
  categoryImageFile: File | null = null;
  readonly categoryRequestKindOptions: CategoryRequestKind[] = ['category', 'sub_category'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly catalogService: CatalogService,
    public readonly translate: TranslateService
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
      categoryId: [''],
      nameAr: [''],
      nameEn: [''],
      logoUrl: ['']
    });

    this.categoryDraftForm = this.fb.group({
      isNew: [false],
      categoryId: [''],
      nameAr: [''],
      nameEn: [''],
      requestKind: ['category'],
      activityId: [''],
      subActivityId: [''],
      categoryParentId: [''],
      displayOrder: [1],
      imageUrl: ['']
    });

    this.syncCategorySelectionValidator(false);
  }

  ngOnInit(): void {
    if (this.initialName) {
      this.requestForm.patchValue({ nameAr: this.initialName, nameEn: this.initialName });
    }

    this.requestForm.get('brandId')?.valueChanges.subscribe(brandId => this.syncCategoryWithBrandSelection(brandId || null));
    this.requestForm.get('categoryId')?.valueChanges.subscribe(categoryId => this.syncBrandWithCategorySelection(categoryId || null));

    this.loadData();
  }

  get unitOptions(): SearchableSelectOption[] {
    return this.units.map(unit => ({
      value: unit.id,
      label: this.currentLang === 'ar' ? unit.nameAr : unit.nameEn
    }));
  }

  get activityOptions(): Category[] {
    return this.flatCategories.filter(category => (category.level ?? 0) === 0);
  }

  get activityDropdownOptions(): SearchableSelectOption[] {
    return this.toCategoryDropdownOptions(this.activityOptions);
  }

  get subActivityOptions(): Category[] {
    const activityId = this.categoryDraftForm.get('activityId')?.value;
    return activityId
      ? this.flatCategories.filter(category => category.parentCategoryId === activityId && (category.level ?? 0) === 1)
      : [];
  }

  get subActivityDropdownOptions(): SearchableSelectOption[] {
    return this.toCategoryDropdownOptions(this.subActivityOptions);
  }

  get categoryParentOptions(): Category[] {
    return this.flatCategories.filter(category => (category.level ?? 0) === 2);
  }

  get categoryParentDropdownOptions(): SearchableSelectOption[] {
    return this.toCategoryDropdownOptions(this.categoryParentOptions);
  }

  get filteredBrandOptions(): BrandOption[] {
    const selectedCategoryId = this.requestForm.get('categoryId')?.value as string | null;
    return !selectedCategoryId
      ? this.brands
      : this.brands.filter(brand => !brand.categoryId || brand.categoryId === selectedCategoryId);
  }

  get brandDropdownOptions(): SearchableSelectOption[] {
    return this.filteredBrandOptions.map(brand => ({
      value: brand.id,
      label: this.currentLang === 'ar' ? brand.nameAr : brand.nameEn
    }));
  }

  get filteredExistingCategoryOptions(): Category[] {
    const selectedBrandId = this.requestForm.get('brandId')?.value as string | null;
    const selectedBrand = selectedBrandId
      ? this.brands.find(brand => brand.id === selectedBrandId) || null
      : null;
    const levelThreeCategories = this.flatCategories.filter(category => this.isBrandAssignableCategory(category));

    return !selectedBrand?.categoryId
      ? levelThreeCategories
      : levelThreeCategories.filter(category => category.id === selectedBrand.categoryId);
  }

  get existingCategoryDropdownOptions(): SearchableSelectOption[] {
    return this.toCategoryDropdownOptions(this.filteredExistingCategoryOptions);
  }

  get brandRequestCategoryOptions(): Category[] {
    return this.flatCategories.filter(category => this.isBrandAssignableCategory(category));
  }

  get brandRequestCategoryDropdownOptions(): SearchableSelectOption[] {
    return this.toCategoryDropdownOptions(this.brandRequestCategoryOptions);
  }

  get requiresActivitySelection(): boolean {
    return this.selectedRequestKind === 'category';
  }

  get requiresSubActivitySelection(): boolean {
    return this.selectedRequestKind === 'category';
  }

  get requiresCategorySelection(): boolean {
    return this.selectedRequestKind === 'sub_category';
  }

  get selectedRequestKind(): CategoryRequestKind {
    return (this.categoryDraftForm.get('requestKind')?.value || 'category') as CategoryRequestKind;
  }

  loadData(): void {
    this.catalogService.getCategories().subscribe(categories => {
      this.categories = categories;
      this.flatCategories = this.flattenCategories(categories);
      this.syncBrandWithCategorySelection(this.requestForm.get('categoryId')?.value || null);
    });
    this.catalogService.getBrands().subscribe(brands => {
      this.brands = brands;
      this.syncCategoryWithBrandSelection(this.requestForm.get('brandId')?.value || null);
    });
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
    this.brandDraftForm.patchValue({ isNew: next, brandId: '', categoryId: '', logoUrl: '' });
    this.brandImageFile = null;
    this.applyBrandDraftValidators(next);
  }

  toggleCategoryDraftMode(): void {
    const next = !this.categoryDraftForm.get('isNew')?.value;
    this.categoryDraftForm.patchValue({
      isNew: next,
      categoryId: '',
      requestKind: 'category',
      activityId: '',
      subActivityId: '',
      categoryParentId: '',
      displayOrder: 1,
      imageUrl: ''
    });
    this.categoryImageFile = null;
    this.applyCategoryDraftValidators(next);
    this.syncCategorySelectionValidator(next);
  }

  saveBrandDraft(): void {
    const isNew = !!this.brandDraftForm.get('isNew')?.value;

    if (isNew) {
      this.applyBrandDraftValidators(true);
      if (this.brandDraftForm.get('nameAr')?.invalid
        || this.brandDraftForm.get('nameEn')?.invalid
        || this.brandDraftForm.get('categoryId')?.invalid) {
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
      if (!brand) {
        return;
      }

      this.requestForm.patchValue({ brandId });
      this.selectedBrandLabel = this.currentLang === 'ar' ? brand.nameAr : brand.nameEn;
      this.brandDraftForm.patchValue({ categoryId: '', nameAr: '', nameEn: '', logoUrl: '' });
      this.brandImageFile = null;
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

      const order = this.categoryDraftForm.get('displayOrder')?.value || 1;
      const previewPath = this.buildRequestedCategoryPathPreview();

      this.requestForm.patchValue({ categoryId: '' });
      this.selectedCategoryLabel = this.currentLang === 'ar'
        ? this.categoryDraftForm.get('nameAr')?.value
        : this.categoryDraftForm.get('nameEn')?.value;
      this.selectedCategoryMeta = [
        `${this.translate.instant('PRODUCTS.CATEGORY_REQUEST_KIND')}: ${this.translate.instant(this.getRequestKindTranslateKey(this.selectedRequestKind))}`,
        previewPath ? `${this.translate.instant('PRODUCTS.CATEGORY_PLACEMENT_PREVIEW')}: ${previewPath}` : '',
        `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${order}`
      ].filter(Boolean).join(' • ');
    } else {
      const categoryId = this.categoryDraftForm.get('categoryId')?.value;
      const category = this.flatCategories.find(item => item.id === categoryId);
      if (!category) {
        return;
      }

      this.requestForm.patchValue({ categoryId });
      this.selectedCategoryLabel = this.getCategoryOptionLabel(category);
      this.selectedCategoryMeta = category.displayOrder
        ? `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${category.displayOrder}`
        : '';
      this.categoryDraftForm.patchValue({
        nameAr: '',
        nameEn: '',
        requestKind: 'category',
        activityId: '',
        subActivityId: '',
        categoryParentId: '',
        displayOrder: 1,
        imageUrl: ''
      });
      this.categoryImageFile = null;
      this.syncCategorySelectionValidator(false);
      this.syncBrandWithCategorySelection(categoryId);
    }

    this.closeCategoryModal();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.requestForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.requestForm.getRawValue();
    const brandDraft = this.brandDraftForm.getRawValue();
    const categoryDraft = this.categoryDraftForm.getRawValue();

    forkJoin({
      brandLogoUrl: brandDraft.isNew && this.brandImageFile
        ? this.uploadFile(this.brandImageFile, 'uploads/catalog/brand-requests')
        : of<string | null>(null),
      categoryImageUrl: categoryDraft.isNew && this.categoryImageFile
        ? this.uploadFile(this.categoryImageFile, 'uploads/catalog/category-requests')
        : of<string | null>(null)
    }).pipe(
      map(({ brandLogoUrl, categoryImageUrl }) => ({
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
              categoryId: brandDraft.categoryId,
              nameAr: brandDraft.nameAr,
              nameEn: brandDraft.nameEn,
              logoUrl: brandLogoUrl,
              isActive: true
            }
          : null,
        requestedCategory: categoryDraft.isNew
          ? {
              nameAr: categoryDraft.nameAr,
              nameEn: categoryDraft.nameEn,
              targetLevel: this.resolveRequestedTargetLevel(),
              parentCategoryId: this.resolveRequestedParentCategoryId(),
              displayOrder: Number(categoryDraft.displayOrder || 1),
              imageUrl: categoryImageUrl,
              isActive: true
            }
          : null
      })),
      switchMap(payload => this.catalogService.submitProductRequest(payload))
    ).subscribe({
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
    if (!file) {
      return;
    }

    this.brandImageFile = file;
    this.brandDraftForm.patchValue({ logoUrl: URL.createObjectURL(file) });
  }

  onCategoryImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    this.categoryImageFile = file;
    this.categoryDraftForm.patchValue({ imageUrl: URL.createObjectURL(file) });
  }

  onRequestKindChanged(): void {
    this.categoryDraftForm.patchValue({
      activityId: '',
      subActivityId: '',
      categoryParentId: ''
    });
    this.applyCategoryDraftValidators(true);
  }

  onActivityChanged(): void {
    this.categoryDraftForm.patchValue({ subActivityId: '' });
    this.applyCategoryDraftValidators(true);
  }

  onSubActivityChanged(): void {
    this.applyCategoryDraftValidators(true);
  }

  getCategoryPathLabel(category: Category | null): string {
    if (!category) {
      return '';
    }

    const names: string[] = [];
    let current: Category | undefined = category;

    while (current) {
      names.unshift(this.currentLang === 'ar' ? current.nameAr : current.nameEn);
      const parentId: string | null | undefined = current.parentCategoryId;
      current = parentId ? this.flatCategories.find(item => item.id === parentId) : undefined;
    }

    return names.join(' / ');
  }

  getCategoryOptionLabel(category: Category | null): string {
    if (!category) {
      return '';
    }

    return this.currentLang === 'ar' ? category.nameAr : category.nameEn;
  }

  getRequestKindTranslateKey(requestKind: CategoryRequestKind | string | null | undefined): string {
    return requestKind === 'sub_category'
      ? 'PRODUCTS.CATEGORY_KIND_SUB_CATEGORY'
      : 'PRODUCTS.CATEGORY_KIND_CATEGORY';
  }

  buildRequestedCategoryPathPreview(): string {
    const localizedName = this.currentLang === 'ar'
      ? this.categoryDraftForm.get('nameAr')?.value
      : this.categoryDraftForm.get('nameEn')?.value;
    const parentId = this.resolveRequestedParentCategoryId();
    const parent = parentId ? this.flatCategories.find(category => category.id === parentId) || null : null;
    const segments = parent ? this.getCategoryPathLabel(parent).split(' / ').filter(Boolean) : [];

    if (localizedName) {
      segments.push(localizedName);
    }

    return segments.join(' / ');
  }

  get isSubmitDisabled(): boolean {
    const isNewCategory = !!this.categoryDraftForm.get('isNew')?.value;
    const isNewBrand = !!this.brandDraftForm.get('isNew')?.value;

    if (this.isSubmitting || this.requestForm.invalid) {
      return true;
    }

    if (isNewCategory && this.categoryDraftForm.invalid) {
      return true;
    }

    if (isNewBrand
      && (this.brandDraftForm.get('categoryId')?.invalid
        || this.brandDraftForm.get('nameAr')?.invalid
        || this.brandDraftForm.get('nameEn')?.invalid)) {
      return true;
    }

    return false;
  }

  private applyBrandDraftValidators(isNew: boolean): void {
    const categoryId = this.brandDraftForm.get('categoryId');
    const ar = this.brandDraftForm.get('nameAr');
    const en = this.brandDraftForm.get('nameEn');

    if (isNew) {
      categoryId?.setValidators([Validators.required]);
      ar?.setValidators([Validators.required, Validators.minLength(2)]);
      en?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      categoryId?.clearValidators();
      ar?.clearValidators();
      en?.clearValidators();
    }

    categoryId?.updateValueAndValidity();
    ar?.updateValueAndValidity();
    en?.updateValueAndValidity();
  }

  private applyCategoryDraftValidators(isNew: boolean): void {
    const ar = this.categoryDraftForm.get('nameAr');
    const en = this.categoryDraftForm.get('nameEn');
    const requestKind = this.categoryDraftForm.get('requestKind');
    const activityId = this.categoryDraftForm.get('activityId');
    const subActivityId = this.categoryDraftForm.get('subActivityId');
    const categoryParentId = this.categoryDraftForm.get('categoryParentId');
    const order = this.categoryDraftForm.get('displayOrder');

    if (isNew) {
      ar?.setValidators([Validators.required, Validators.minLength(2)]);
      en?.setValidators([Validators.required, Validators.minLength(2)]);
      requestKind?.setValidators([Validators.required]);
      order?.setValidators([Validators.required, Validators.min(1)]);
      activityId?.setValidators(this.requiresActivitySelection ? [Validators.required] : []);
      subActivityId?.setValidators([]);
      categoryParentId?.setValidators(this.requiresCategorySelection ? [Validators.required] : []);
    } else {
      ar?.clearValidators();
      en?.clearValidators();
      requestKind?.clearValidators();
      activityId?.clearValidators();
      subActivityId?.clearValidators();
      categoryParentId?.clearValidators();
      order?.clearValidators();
    }

    ar?.updateValueAndValidity();
    en?.updateValueAndValidity();
    requestKind?.updateValueAndValidity();
    activityId?.updateValueAndValidity();
    subActivityId?.updateValueAndValidity();
    categoryParentId?.updateValueAndValidity();
    order?.updateValueAndValidity();
  }

  private syncCategorySelectionValidator(isNew: boolean): void {
    const categoryId = this.requestForm.get('categoryId');
    if (!categoryId) {
      return;
    }

    if (isNew) {
      categoryId.clearValidators();
    } else {
      categoryId.setValidators([Validators.required]);
    }

    categoryId.updateValueAndValidity();
  }

  private resolveRequestedParentCategoryId(): string | null {
    if (this.selectedRequestKind === 'sub_category') {
      return this.categoryDraftForm.get('categoryParentId')?.value || null;
    }

    return this.categoryDraftForm.get('subActivityId')?.value
      || this.categoryDraftForm.get('activityId')?.value
      || null;
  }

  private resolveRequestedTargetLevel(): CategoryLevelKey {
    return this.selectedRequestKind === 'sub_category' ? 'sub_category' : 'category';
  }

  private isBrandAssignableCategory(category: Category): boolean {
    return (category.level ?? 0) === 2;
  }

  private toCategoryDropdownOptions(categories: Category[]): SearchableSelectOption[] {
    return categories.map(category => ({
      value: category.id,
      label: this.getCategoryOptionLabel(category)
    }));
  }

  private syncCategoryWithBrandSelection(brandId: string | null): void {
    if (!brandId) {
      return;
    }

    const brand = this.brands.find(item => item.id === brandId);
    if (!brand) {
      return;
    }

    this.selectedBrandLabel = this.currentLang === 'ar' ? brand.nameAr : brand.nameEn;

    if (!brand.categoryId) {
      return;
    }

    const selectedCategoryId = this.requestForm.get('categoryId')?.value;
    if (!selectedCategoryId) {
      this.requestForm.patchValue({ categoryId: brand.categoryId }, { emitEvent: false });
      const category = this.flatCategories.find(item => item.id === brand.categoryId) || null;
      this.selectedCategoryLabel = this.getCategoryOptionLabel(category);
      this.selectedCategoryMeta = category?.displayOrder
        ? `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${category.displayOrder}`
        : '';
      return;
    }

    if (selectedCategoryId !== brand.categoryId) {
      this.requestForm.patchValue({ categoryId: brand.categoryId }, { emitEvent: false });
      const category = this.flatCategories.find(item => item.id === brand.categoryId) || null;
      this.selectedCategoryLabel = this.getCategoryOptionLabel(category);
      this.selectedCategoryMeta = category?.displayOrder
        ? `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${category.displayOrder}`
        : '';
    }
  }

  private syncBrandWithCategorySelection(categoryId: string | null): void {
    if (!categoryId) {
      return;
    }

    const category = this.flatCategories.find(item => item.id === categoryId) || null;
    if (category) {
      this.selectedCategoryLabel = this.getCategoryOptionLabel(category);
      this.selectedCategoryMeta = category.displayOrder
        ? `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${category.displayOrder}`
        : '';
    }

    const selectedBrandId = this.requestForm.get('brandId')?.value;
    if (!selectedBrandId) {
      return;
    }

    const brand = this.brands.find(item => item.id === selectedBrandId);
    if (!brand?.categoryId || brand.categoryId === categoryId) {
      return;
    }

    this.requestForm.patchValue({ brandId: '' }, { emitEvent: false });
    this.selectedBrandLabel = '';
  }

  private flattenCategories(categories: Category[]): Category[] {
    return categories.flatMap(category => [
      category,
      ...(category.subCategories ? this.flattenCategories(category.subCategories) : [])
    ]);
  }

  private uploadFile(file: File, directory: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('directory', directory);

    return this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, formData).pipe(
      map(response => response.url)
    );
  }
}
