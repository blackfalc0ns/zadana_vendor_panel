import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { BrandOption, Category, UnitOption } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';
import { UploadProgressComponent } from '../../../../shared/components/ui/feedback/upload-progress/upload-progress.component';
import { ImageUploadPhase, optimizeImageForUpload } from '../../../../shared/utils/image-upload-optimizer';
import { AlertModalService } from '../../../../core/notifications/services/alert-modal.service';
import { describeApiError } from '../../../../shared/utils/api-error.util';

type CategoryLevelKey = 'activity' | 'sub_activity' | 'category' | 'sub_category';
type CategoryRequestKind = 'category' | 'sub_category';
@Component({
 selector: 'app-product-request-modal',
 standalone: true,
 imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, SearchableSelectComponent, UploadProgressComponent],
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
 <input type="text" formControlName="nameAr" class="h-11 w-full rounded-xl border bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [class.border-rose-300]="requestForm.get('nameAr')?.invalid && requestForm.get('nameAr')?.touched" [class.border-slate-200]="!(requestForm.get('nameAr')?.invalid && requestForm.get('nameAr')?.touched)" [placeholder]="'PRODUCTS.NAME_AR' | translate">
 @if (requestForm.get('nameAr')?.invalid && requestForm.get('nameAr')?.touched) {
 <p class="text-[0.68rem] font-bold text-rose-500">{{ requestForm.get('nameAr')?.errors?.['required'] ? ('PRODUCTS.FIELD_REQUIRED' | translate) : ('PRODUCTS.NAME_MIN_LENGTH' | translate) }}</p>
 }
 <textarea formControlName="descriptionAr" rows="3" class="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.DESCRIPTION_AR' | translate"></textarea>
 </div>

 <div class="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4" dir="ltr">
 <h4 class="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-widest text-slate-400">
 <span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
 {{ 'COMMON.ENGLISH_DATA' | translate }}
 </h4>
 <input type="text" formControlName="nameEn" class="h-11 w-full rounded-xl border bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [class.border-rose-300]="requestForm.get('nameEn')?.invalid && requestForm.get('nameEn')?.touched" [class.border-slate-200]="!(requestForm.get('nameEn')?.invalid && requestForm.get('nameEn')?.touched)" [placeholder]="'PRODUCTS.NAME_EN' | translate">
 @if (requestForm.get('nameEn')?.invalid && requestForm.get('nameEn')?.touched) {
 <p class="text-[0.68rem] font-bold text-rose-500">{{ requestForm.get('nameEn')?.errors?.['required'] ? ('PRODUCTS.FIELD_REQUIRED' | translate) : ('PRODUCTS.NAME_MIN_LENGTH' | translate) }}</p>
 }
 <textarea formControlName="descriptionEn" rows="3" class="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.DESCRIPTION_EN' | translate"></textarea>
 </div>
 </div>

 <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
 <div class="space-y-2">
 <label class="text-[0.72rem] font-black uppercase text-slate-500">{{ 'PRODUCTS.FILTERS.PACKAGE_TYPE' | translate }}</label>
 <app-searchable-select
 formControlName="packageTypeId"
 [options]="packageTypeOptions"
 [placeholder]="currentLang === 'ar' ? 'اختر نوع العبوة' : 'Select package type'"
 [searchPlaceholder]="'COMMON.SEARCH'"
 [noResultsText]="'COMMON.NO_RESULTS'">
 </app-searchable-select>
 </div>

 <div class="space-y-2">
 <label class="text-[0.72rem] font-black uppercase text-slate-500">{{ 'PRODUCTS.FILTERS.SIZE_VALUE' | translate }}</label>
 <input
 type="number"
 min="0"
 step="0.01"
 formControlName="measurementValue"
 class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none"
 [placeholder]="currentLang === 'ar' ? 'مثال: 1.5' : 'Example: 1.5'">
 </div>

 <div class="space-y-2">
 <label class="text-[0.72rem] font-black uppercase text-slate-500">{{ 'PRODUCTS.FILTERS.MEASUREMENT_UNIT' | translate }} *</label>
 <app-searchable-select
 formControlName="unitId"
 [options]="measurementUnitOptions"
 [placeholder]="currentLang === 'ar' ? 'اختر وحدة المقاس' : 'Select measurement unit'"
 [searchPlaceholder]="'COMMON.SEARCH'"
 [noResultsText]="'COMMON.NO_RESULTS'">
 </app-searchable-select>
 @if (requestForm.get('unitId')?.invalid && requestForm.get('unitId')?.touched) {
 <p class="text-[0.68rem] font-bold text-rose-500">{{ 'PRODUCTS.UNIT_SELECTION_REQUIRED' | translate }}</p>
 }
 </div>
 </div>

 @if (sizePreview) {
 <div class="rounded-2xl border border-teal-100 bg-teal-50/50 px-4 py-3">
 <p class="text-[0.68rem] font-black uppercase tracking-widest text-teal-600">{{ 'PRODUCTS.SIZE_PREVIEW' | translate }}</p>
 <p class="mt-1 text-[0.85rem] font-black text-teal-900">{{ sizePreview }}</p>
 </div>
 }

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

 <div class="rounded-2xl border bg-white p-4 shadow-sm" [class.border-rose-300]="showCategorySelectionError" [class.border-slate-200]="!showCategorySelectionError">
 <div class="flex items-start justify-between gap-3">
 <div>
 <p class="text-[0.72rem] font-black uppercase text-slate-500">{{ 'PRODUCTS.CATEGORY' | translate }} *</p>
 <p class="mt-1 text-[0.82rem] font-bold text-slate-900">{{ selectedCategoryLabel || ('COMMON.SELECT_CATEGORY' | translate) }}</p>
 @if (selectedCategoryMeta) {
 <p class="mt-1 text-[0.68rem] font-bold text-slate-400">{{ selectedCategoryMeta }}</p>
 }
 @if (!canOpenCategoryModal) {
 <p class="mt-1 text-[0.68rem] font-bold text-amber-600">{{ 'PRODUCTS.CATEGORY_REQUIRES_BRAND' | translate }}</p>
 }
 @if (showCategorySelectionError) {
 <p class="mt-1 text-[0.68rem] font-bold text-rose-500">{{ 'PRODUCTS.CATEGORY_SELECTION_REQUIRED' | translate }}</p>
 }
 </div>
 <button
 type="button"
 (click)="openCategoryModal()"
 [disabled]="!canOpenCategoryModal"
 class="rounded-xl border border-slate-200 px-3 py-2 text-[0.72rem] font-black text-zadna-primary disabled:cursor-not-allowed disabled:opacity-50">
 {{ 'PRODUCTS.OPEN_CATEGORY_MODAL' | translate }}
 </button>
 </div>
 </div>
 </div>

 <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
 <div class="mb-4 flex items-center justify-between gap-3">
 <div>
 <p class="text-[0.72rem] font-black uppercase text-slate-500">{{ 'PRODUCTS.PRODUCT_IMAGES' | translate }}</p>
 <p class="mt-1 text-[0.68rem] font-bold text-slate-400">{{ 'PRODUCTS.PRODUCT_IMAGES_HINT' | translate }}</p>
 </div>
 @if (productImageItems.length < maxProductImages) {
 <label class="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-[0.72rem] font-black text-zadna-primary">
 {{ 'PRODUCTS.ADD_IMAGE' | translate }}
 <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple class="hidden" (change)="onProductImagesSelected($event)">
 </label>
 }
 </div>

 @if (isOptimizingProductImage) {
 <p class="text-[0.75rem] font-black text-slate-600">{{ 'PRODUCTS.IMAGE_OPTIMIZING' | translate }}</p>
 } @else if (productImageItems.length) {
 <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
 @for (item of productImageItems; track item.id; let index = $index) {
 <div class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
 <img [src]="item.previewUrl" class="h-28 w-full object-cover" alt="">
 <div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-slate-900/70 px-2 py-1.5">
 <span class="truncate text-[0.62rem] font-black uppercase tracking-widest text-white">
 {{ index === 0 ? ('PRODUCTS.PRIMARY_IMAGE' | translate) : ('PRODUCTS.IMAGE' | translate) + ' ' + (index + 1) }}
 </span>
 <button type="button" (click)="removeProductImage(item.id)" class="text-[0.62rem] font-black text-rose-300">
 {{ 'PRODUCTS.REMOVE_IMAGE' | translate }}
 </button>
 </div>
 </div>
 }
 </div>
 } @else {
 <label class="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-6 text-center transition-all hover:bg-slate-50/60">
 <p class="text-[0.75rem] font-black text-slate-600">{{ 'PRODUCTS.UPLOAD_PHOTO' | translate }}</p>
 <p class="text-[0.65rem] font-bold text-slate-400">{{ 'COMMON.OPTIONAL' | translate }} · {{ 'PRODUCTS.IMAGE_FORMATS' | translate }}</p>
 <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple class="hidden" (change)="onProductImagesSelected($event)">
 </label>
 }
 </div>

 @if (isSubmitting && uploadFileCount > 0) {
 <div class="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
 <app-upload-progress [progress]="uploadProgress" [phase]="uploadPhase"></app-upload-progress>
 </div>
 }

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
 <input type="file" accept=".jpg,.jpeg,.png,.webp" class="hidden" (change)="onBrandImageSelected($event)">
 </label>
 </div>

 @if (brandImagePreviewUrl) {
 <div class="mt-4 flex items-center gap-3">
 <img [src]="brandImagePreviewUrl" class="h-14 w-14 rounded-2xl border border-amber-100 bg-slate-50 object-cover">
 <button type="button" (click)="removeBrandImage()" class="text-[0.72rem] font-black text-rose-500">
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
 <div class="mt-4 rounded-2xl border border-cyan-200 bg-white px-4 py-3">
 <p class="text-[0.72rem] font-black uppercase tracking-widest text-cyan-700">{{ 'PRODUCTS.CATEGORY_KIND_SUB_CATEGORY' | translate }}</p>
 <p class="mt-1 text-[0.75rem] font-bold text-slate-600">{{ 'PRODUCTS.NEW_CATEGORY_LEAF_HINT' | translate }}</p>
 </div>

 <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
 <input type="text" formControlName="nameAr" class="h-11 w-full rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.NEW_SUB_CATEGORY_AR' | translate">
 <input type="text" formControlName="nameEn" class="h-11 w-full rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.NEW_SUB_CATEGORY_EN' | translate" dir="ltr">

 <app-searchable-select
 formControlName="activityId"
 [options]="activityDropdownOptions"
 [placeholder]="'PRODUCTS.SELECT_ACTIVITY'"
 [searchPlaceholder]="'COMMON.SEARCH'"
 [noResultsText]="'COMMON.NO_RESULTS'"
 (selectionChange)="onActivityChanged()">
 </app-searchable-select>

 <app-searchable-select
 formControlName="subActivityId"
 [disabled]="!categoryDraftForm.get('activityId')?.value"
 [options]="subActivityDropdownOptions"
 [placeholder]="'PRODUCTS.SELECT_SUB_ACTIVITY'"
 [searchPlaceholder]="'COMMON.SEARCH'"
 [noResultsText]="'COMMON.NO_RESULTS'"
 (selectionChange)="onSubActivityChanged()">
 </app-searchable-select>

 <app-searchable-select
 formControlName="categoryParentId"
 [disabled]="!categoryDraftForm.get('subActivityId')?.value"
 [options]="categoryParentDropdownOptions"
 [placeholder]="'PRODUCTS.SELECT_PARENT_CATEGORY_FOR_SUB'"
 [searchPlaceholder]="'COMMON.SEARCH'"
 [noResultsText]="'COMMON.NO_RESULTS'"
 (selectionChange)="onCategoryParentChanged()">
 </app-searchable-select>

 <input type="number" min="1" formControlName="displayOrder" class="h-11 w-full rounded-xl border border-cyan-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none" [placeholder]="'PRODUCTS.DISPLAY_ORDER' | translate">
 </div>

 <div class="mt-4 rounded-2xl border border-cyan-200/70 bg-white p-4">
 <div class="grid gap-3 md:grid-cols-2">
 <div>
 <p class="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.CATEGORY_REQUEST_KIND' | translate }}</p>
 <p class="mt-1 text-[0.82rem] font-bold text-slate-800">{{ 'PRODUCTS.CATEGORY_KIND_SUB_CATEGORY' | translate }}</p>
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
 <input type="file" accept=".jpg,.jpeg,.png,.webp" class="hidden" (change)="onCategoryImageSelected($event)">
 </label>
 </div>

 @if (categoryImagePreviewUrl) {
 <div class="mt-4 flex items-center gap-3">
 <img [src]="categoryImagePreviewUrl" class="h-14 w-14 rounded-2xl border border-cyan-100 bg-slate-50 object-cover">
 <button type="button" (click)="removeCategoryImage()" class="text-[0.72rem] font-black text-rose-500">
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
 :host { display: contents; }.no-scrollbar::-webkit-scrollbar { display: none; }.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
 `]
})
export class ProductRequestModalComponent implements OnInit, OnDestroy {
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
 productImageItems: Array<{ id: string; file: File; previewUrl: string }> = [];
 readonly maxProductImages = 5;
 brandImagePreviewUrl = '';
 categoryImagePreviewUrl = '';
 isOptimizingProductImage = false;
 isOptimizingBrandImage = false;
 isOptimizingCategoryImage = false;
 showCategorySelectionError = false;
 uploadProgress = 0;
 uploadPhase: ImageUploadPhase = 'preparing';
 private readonly fileProgress = new Map<string, number>();
 readonly categoryRequestKindOptions: CategoryRequestKind[] = ['category', 'sub_category'];

 constructor(
 private readonly fb: FormBuilder,
 private readonly catalogService: CatalogService,
 private readonly alertModalService: AlertModalService,
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
 packageTypeId: [''],
 measurementValue: [null],
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
 requestKind: ['sub_category'],
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

 this.requestForm.get('brandId')?.valueChanges.subscribe(brandId => this.syncCategoryWithBrandSelection(brandId || null, true));
 this.requestForm.get('categoryId')?.valueChanges.subscribe(categoryId => this.syncBrandWithCategorySelection(categoryId || null));

 this.loadData();
 }

 ngOnDestroy(): void {
 this.clearProductImages();
 this.revokePreviewUrl('brand');
 this.revokePreviewUrl('category');
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
 const allLevelTwo = this.flatCategories.filter(category => (category.level ?? 0) === 2);
 const subActivityId = this.categoryDraftForm.get('subActivityId')?.value as string | null;
 const activityId = this.categoryDraftForm.get('activityId')?.value as string | null;

 if (!subActivityId) {
 return [];
 }

 let scoped = allLevelTwo.filter(category => this.isCategoryUnderAncestor(category, subActivityId));
 if (activityId) {
 scoped = scoped.filter(category => this.isCategoryUnderAncestor(category, activityId));
 }

 const brand = this.getSelectedBrand();
 if (!brand) {
 return scoped;
 }

 const linkedIds = this.getBrandLinkedCategoryIds(brand);
 if (linkedIds.size === 0) {
 return scoped;
 }

 return scoped.filter((category) => this.isBrandRelatedToParentCategory(category, linkedIds));
 }

 get categoryParentDropdownOptions(): SearchableSelectOption[] {
 return this.toCategoryDropdownOptions(this.categoryParentOptions);
 }

 get filteredBrandOptions(): BrandOption[] {
 const categoryId = this.requestForm.get('categoryId')?.value as string | null;
 if (!categoryId || this.categoryDraftForm.get('isNew')?.value) {
 return this.brands;
 }

 return this.brands.filter((brand) => this.doesBrandMatchCategory(brand, categoryId));
 }

 get filteredExistingCategoryOptions(): Category[] {
 const assignable = this.flatCategories.filter(category => this.isProductAssignableCategory(category));
 const brand = this.getSelectedBrand();
 if (!brand) {
 return [];
 }

 const linkedIds = this.getBrandLinkedCategoryIds(brand);
 if (linkedIds.size === 0) {
 return assignable;
 }

 return assignable.filter((category) => this.doesCategoryMatchBrandLinks(category, linkedIds));
 }

 get brandDropdownOptions(): SearchableSelectOption[] {
 return this.filteredBrandOptions.map(brand => ({
 value: brand.id,
 label: this.getBrandOptionLabel(brand)
 }));
 }

 get existingCategoryDropdownOptions(): SearchableSelectOption[] {
 return this.toCategoryDropdownOptions(this.filteredExistingCategoryOptions);
 }

 get brandRequestCategoryOptions(): Category[] {
 return this.flatCategories.filter(category => this.isNestedCategory(category));
 }

 get brandRequestCategoryDropdownOptions(): SearchableSelectOption[] {
 return this.toCategoryDropdownOptions(this.brandRequestCategoryOptions);
 }

 get canOpenCategoryModal(): boolean {
 return !!this.getSelectedBrand() || !!this.brandDraftForm.get('isNew')?.value;
 }

 get measurementUnitOptions(): SearchableSelectOption[] {
 return this.unitOptions.filter((option) => {
 const unit = this.units.find((item) => item.id === option.value);
 return unit?.kind === 'Measurement';
 });
 }

 get packageTypeOptions(): SearchableSelectOption[] {
 return this.unitOptions.filter((option) => {
 const unit = this.units.find((item) => item.id === option.value);
 return unit?.kind === 'Packaging';
 });
 }

 get sizePreview(): string {
 const packageTypeId = this.requestForm.get('packageTypeId')?.value as string | null;
 const measurementValue = this.requestForm.get('measurementValue')?.value;
 const unitId = this.requestForm.get('unitId')?.value as string | null;
 const packageType = packageTypeId ? this.units.find((unit) => unit.id === packageTypeId) : null;
 const measurementUnit = unitId ? this.units.find((unit) => unit.id === unitId) : null;
 const packageLabel = packageType
 ? (this.currentLang === 'ar' ? packageType.nameAr : packageType.nameEn)
 : '';
 const unitLabel = measurementUnit
 ? (this.currentLang === 'ar' ? measurementUnit.nameAr : measurementUnit.nameEn)
 : '';
 const valueLabel = measurementValue!== null && measurementValue!== undefined && `${measurementValue}`.trim()!== ''
 ? `${measurementValue}`
 : '';

 return [packageLabel, valueLabel, unitLabel].filter(Boolean).join(' ').trim();
 }

 get requiresActivitySelection(): boolean {
 return false;
 }

 get requiresSubActivitySelection(): boolean {
 return false;
 }

 get requiresCategorySelection(): boolean {
 return !!this.categoryDraftForm.get('isNew')?.value;
 }

 get selectedRequestKind(): CategoryRequestKind {
 return 'sub_category';
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

 openCategoryModal(): void {
 if (!this.canOpenCategoryModal) {
 return;
 }
 this.isCategoryModalOpen = true;
 }

 toggleBrandDraftMode(): void {
 const next =!this.brandDraftForm.get('isNew')?.value;
 this.brandDraftForm.patchValue({ isNew: next, brandId: '', categoryId: '', logoUrl: '' });
 this.removeBrandImage();
 this.applyBrandDraftValidators(next);
 }

 toggleCategoryDraftMode(): void {
 const next =!this.categoryDraftForm.get('isNew')?.value;
 this.categoryDraftForm.patchValue({
 isNew: next,
 categoryId: '',
 requestKind: 'sub_category',
 nameAr: '',
 nameEn: '',
 activityId: '',
 subActivityId: '',
 categoryParentId: '',
 displayOrder: 1,
 imageUrl: ''
 });
 this.removeCategoryImage();
 this.applyCategoryDraftValidators(next);
 this.syncCategorySelectionValidator(next);
 if (next) {
 this.categoryDraftForm.patchValue({ requestKind: 'sub_category' });
 this.prefillHierarchyFromBrand();
 this.autoSelectSingleCategoryParent();
 }
 }

 saveBrandDraft(): void {
 const isNew =!!this.brandDraftForm.get('isNew')?.value;

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

 const brandCategoryId = this.brandDraftForm.get('categoryId')?.value as string | null;
 if (brandCategoryId) {
 const brandCategory = this.flatCategories.find((item) => item.id === brandCategoryId) || null;
 if (brandCategory && this.isProductAssignableCategory(brandCategory)) {
 this.requestForm.patchValue({ categoryId: brandCategoryId });
 this.categoryDraftForm.patchValue({ isNew: false, categoryId: brandCategoryId });
 this.syncCategorySelectionValidator(false);
 this.selectedCategoryLabel = this.getCategoryOptionLabel(brandCategory);
 this.selectedCategoryMeta = brandCategory.displayOrder
 ? `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${brandCategory.displayOrder}`
 : '';
 this.showCategorySelectionError = false;
 } else {
 this.clearCategorySelection();
 }
 } else {
 this.clearCategorySelection();
 }
 } else {
 const brandId = this.brandDraftForm.get('brandId')?.value;
 const brand = this.brands.find(item => item.id === brandId);
 if (!brand) {
 return;
 }

 this.requestForm.patchValue({ brandId });
 this.selectedBrandLabel = this.currentLang === 'ar' ? brand.nameAr : brand.nameEn;
 this.brandDraftForm.patchValue({ categoryId: '', nameAr: '', nameEn: '', logoUrl: '' });
 this.removeBrandImage();
 this.syncCategoryWithBrandSelection(brandId, true);
 }

 this.closeBrandModal();
 }

 saveCategoryDraft(): void {
 const isNew =!!this.categoryDraftForm.get('isNew')?.value;

 if (isNew) {
 this.applyCategoryDraftValidators(true);
 if (this.categoryDraftForm.invalid) {
 this.categoryDraftForm.markAllAsTouched();
 return;
 }

 const order = this.categoryDraftForm.get('displayOrder')?.value || 1;
 const previewPath = this.buildRequestedCategoryPathPreview();

 this.requestForm.patchValue({ categoryId: '' });
 this.syncCategorySelectionValidator(true);
 this.selectedCategoryLabel = this.currentLang === 'ar'
 ? this.categoryDraftForm.get('nameAr')?.value
 : this.categoryDraftForm.get('nameEn')?.value;
 this.selectedCategoryMeta = [
 `${this.translate.instant('PRODUCTS.CATEGORY_REQUEST_KIND')}: ${this.translate.instant('PRODUCTS.CATEGORY_KIND_SUB_CATEGORY')}`,
 previewPath ? `${this.translate.instant('PRODUCTS.CATEGORY_PLACEMENT_PREVIEW')}: ${previewPath}` : '',
 `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${order}`
 ].filter(Boolean).join(' • ');
 this.showCategorySelectionError = false;
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
 requestKind: 'sub_category',
 activityId: '',
 subActivityId: '',
 categoryParentId: '',
 displayOrder: 1,
 imageUrl: ''
 });
 this.removeCategoryImage();
 this.syncCategorySelectionValidator(false);
 this.showCategorySelectionError = false;
 }

 this.closeCategoryModal();
 }

 onSubmit(event: Event): void {
 event.preventDefault();
 this.showCategorySelectionError =!this.isCategoryResolved();

 if (!this.canSubmitRequest()) {
 this.requestForm.markAllAsTouched();
 if (this.categoryDraftForm.get('isNew')?.value) {
 this.categoryDraftForm.markAllAsTouched();
 }
 if (this.brandDraftForm.get('isNew')?.value) {
 this.brandDraftForm.markAllAsTouched();
 }
 return;
 }

 this.isSubmitting = true;
 this.fileProgress.clear();
 this.uploadProgress = 0;
 this.uploadPhase = 'preparing';
 const formValue = this.requestForm.getRawValue();
 const brandDraft = this.brandDraftForm.getRawValue();
 const categoryDraft = this.categoryDraftForm.getRawValue();

 forkJoin({
 brandLogoUrl: brandDraft.isNew && this.brandImageFile
 ? this.catalogService.uploadFile(this.brandImageFile, 'uploads/catalog/brand-requests', this.trackUpload('brand'))
 : of<string | null>(null),
 categoryImageUrl: categoryDraft.isNew && this.categoryImageFile
 ? this.catalogService.uploadFile(this.categoryImageFile, 'uploads/catalog/category-requests', this.trackUpload('category'))
 : of<string | null>(null),
 productImageUrls: this.productImageItems.length
 ? forkJoin(
 this.productImageItems.map((item, index) =>
 this.catalogService.uploadFile(
 item.file,
 'uploads/catalog/product-requests',
 this.trackUpload(`product-${index}`)
 )
 )
 )
 : of<string[]>([])
 }).pipe(
 map(({ brandLogoUrl, categoryImageUrl, productImageUrls }) => ({
 product: {
 nameAr: formValue.nameAr,
 nameEn: formValue.nameEn,
 descriptionAr: formValue.descriptionAr || '',
 descriptionEn: formValue.descriptionEn || '',
 categoryId: categoryDraft.isNew ? null : formValue.categoryId || null,
 brandId: brandDraft.isNew ? null : formValue.brandId || null,
 packageTypeId: formValue.packageTypeId || null,
 measurementValue: formValue.measurementValue!== null && formValue.measurementValue!== undefined && `${formValue.measurementValue}`.trim()!== ''
 ? Number(formValue.measurementValue)
 : null,
 unitId: formValue.unitId || null,
 imageUrl: productImageUrls[0] || null,
 imageUrls: productImageUrls
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
 void this.alertModalService.showAlert(
 this.translate.instant('PRODUCTS.REQUEST_SUBMITTED_SUCCESS'),
 'COMMON.SUCCESS',
 'success'
 );
 this.submitted.emit();
 },
 error: (error) => {
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

 async onBrandImageSelected(event: Event): Promise<void> {
 const input = event.target as HTMLInputElement;
 const file = input.files?.[0];
 if (!file) {
 return;
 }

 input.value = '';
 this.isOptimizingBrandImage = true;
 try {
 const prepared = await optimizeImageForUpload(file, 0);
 this.brandImageFile = prepared;
 this.setPreviewUrl('brand', prepared);
 this.brandDraftForm.patchValue({ logoUrl: this.brandImagePreviewUrl });
 } finally {
 this.isOptimizingBrandImage = false;
 }
 }

 async onCategoryImageSelected(event: Event): Promise<void> {
 const input = event.target as HTMLInputElement;
 const file = input.files?.[0];
 if (!file) {
 return;
 }

 input.value = '';
 this.isOptimizingCategoryImage = true;
 try {
 const prepared = await optimizeImageForUpload(file, 0);
 this.categoryImageFile = prepared;
 this.setPreviewUrl('category', prepared);
 this.categoryDraftForm.patchValue({ imageUrl: this.categoryImagePreviewUrl });
 } finally {
 this.isOptimizingCategoryImage = false;
 }
 }

 async onProductImagesSelected(event: Event): Promise<void> {
 const input = event.target as HTMLInputElement;
 const files = Array.from(input.files ?? []);
 input.value = '';

 if (!files.length) {
 return;
 }

 const remainingSlots = this.maxProductImages - this.productImageItems.length;
 if (remainingSlots <= 0) {
 return;
 }

 this.isOptimizingProductImage = true;
 try {
 for (const file of files.slice(0, remainingSlots)) {
 const prepared = await optimizeImageForUpload(file, 0);
 this.productImageItems.push({
 id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
 file: prepared,
 previewUrl: URL.createObjectURL(prepared)
 });
 }
 } finally {
 this.isOptimizingProductImage = false;
 }
 }

 removeProductImage(itemId: string): void {
 const index = this.productImageItems.findIndex((item) => item.id === itemId);
 if (index === -1) {
 return;
 }

 URL.revokeObjectURL(this.productImageItems[index].previewUrl);
 this.productImageItems.splice(index, 1);
 }

 private clearProductImages(): void {
 this.productImageItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
 this.productImageItems = [];
 }

 removeBrandImage(): void {
 this.brandImageFile = null;
 this.revokePreviewUrl('brand');
 this.brandDraftForm.patchValue({ logoUrl: '' });
 }

 removeCategoryImage(): void {
 this.categoryImageFile = null;
 this.revokePreviewUrl('category');
 this.categoryDraftForm.patchValue({ imageUrl: '' });
 }

 get uploadFileCount(): number {
 return [
 this.brandDraftForm.get('isNew')?.value && this.brandImageFile,
 this.categoryDraftForm.get('isNew')?.value && this.categoryImageFile,...this.productImageItems.map(() => true)
 ].filter(Boolean).length;
 }

 private trackUpload(key: string): (progress: { percent: number; phase: ImageUploadPhase }) => void {
 return (progress) => {
 this.fileProgress.set(key, progress.percent);
 const values = Array.from(this.fileProgress.values());
 this.uploadProgress = values.length
 ? Math.round(values.reduce((total, value) => total + value, 0) / this.uploadFileCount)
 : 0;
 this.uploadPhase = progress.phase;
 };
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
 this.categoryDraftForm.patchValue({ subActivityId: '', categoryParentId: '' });
 this.autoSelectSingleSubActivity();
 this.autoSelectSingleCategoryParent();
 this.applyCategoryDraftValidators(true);
 }

 onSubActivityChanged(): void {
 this.categoryDraftForm.patchValue({ categoryParentId: '' });
 this.autoSelectSingleCategoryParent();
 this.applyCategoryDraftValidators(true);
 }

 onCategoryParentChanged(): void {
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

 const path = this.getCategoryPathLabel(category);
 return path || (this.currentLang === 'ar' ? category.nameAr : category.nameEn);
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
 return this.isSubmitting ||!this.canSubmitRequest();
 }

 private canSubmitRequest(): boolean {
 if (this.requestForm.invalid) {
 return false;
 }

 if (!this.isCategoryResolved()) {
 return false;
 }

 if (this.categoryDraftForm.get('isNew')?.value && this.categoryDraftForm.invalid) {
 return false;
 }

 if (this.brandDraftForm.get('isNew')?.value
 && (this.brandDraftForm.get('categoryId')?.invalid
 || this.brandDraftForm.get('nameAr')?.invalid
 || this.brandDraftForm.get('nameEn')?.invalid)) {
 return false;
 }

 return true;
 }

 private isCategoryResolved(): boolean {
 if (this.categoryDraftForm.get('isNew')?.value) {
 return!this.categoryDraftForm.invalid;
 }

 return!!this.requestForm.get('categoryId')?.value;
 }

 private setPreviewUrl(kind: 'brand' | 'category', file: File): void {
 this.revokePreviewUrl(kind);
 const previewUrl = URL.createObjectURL(file);

 if (kind === 'brand') {
 this.brandImagePreviewUrl = previewUrl;
 return;
 }

 this.categoryImagePreviewUrl = previewUrl;
 }

 private revokePreviewUrl(kind: 'brand' | 'category'): void {
 if (kind === 'brand' && this.brandImagePreviewUrl) {
 URL.revokeObjectURL(this.brandImagePreviewUrl);
 this.brandImagePreviewUrl = '';
 return;
 }

 if (kind === 'category' && this.categoryImagePreviewUrl) {
 URL.revokeObjectURL(this.categoryImagePreviewUrl);
 this.categoryImagePreviewUrl = '';
 }
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
 activityId?.setValidators([Validators.required]);
 subActivityId?.setValidators([Validators.required]);
 categoryParentId?.setValidators([Validators.required]);
 this.categoryDraftForm.get('requestKind')?.setValue('sub_category', { emitEvent: false });
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
 return this.categoryDraftForm.get('categoryParentId')?.value || null;
 }

 private resolveRequestedTargetLevel(): CategoryLevelKey {
 return 'sub_category';
 }

 private isProductAssignableCategory(category: Category): boolean {
 const level = category.level ?? 0;
 return level === 2 || level === 3;
 }

 private isNestedCategory(category: Category): boolean {
 return category.parentCategoryId != null && category.parentCategoryId !== '';
 }

 private isCategoryUnderAncestor(category: Category, ancestorId: string): boolean {
 let current: Category | undefined = category;

 while (current) {
 if (current.id === ancestorId) {
 return true;
 }

 const parentId: string | null | undefined = current.parentCategoryId;
 current = parentId ? this.flatCategories.find(item => item.id === parentId) : undefined;
 }

 return false;
 }

 private isBrandRelatedToParentCategory(parent: Category, linkedIds: Set<string>): boolean {
 if (linkedIds.has(parent.id) || this.doesCategoryMatchBrandLinks(parent, linkedIds)) {
 return true;
 }

 return Array.from(linkedIds).some((linkedId) => {
 const linked = this.flatCategories.find((item) => item.id === linkedId);
 return !!linked && this.isCategoryUnderAncestor(linked, parent.id);
 });
 }

 private prefillHierarchyFromBrand(): void {
 const brand = this.getSelectedBrand();
 if (!brand) {
 return;
 }

 const linkedIds = this.getBrandLinkedCategoryIds(brand);
 if (linkedIds.size === 0) {
 return;
 }

 const preferredParent = this.resolvePreferredParentFromBrandLinks(linkedIds);
 if (!preferredParent) {
 return;
 }

 const path = this.getCategoryAncestorPath(preferredParent);
 const activity = path.find((item) => (item.level ?? 0) === 0) || null;
 const subActivity = path.find((item) => (item.level ?? 0) === 1) || null;

 this.categoryDraftForm.patchValue({
 activityId: activity?.id || '',
 subActivityId: subActivity?.id || '',
 categoryParentId: preferredParent.id,
 requestKind: 'sub_category'
 });
 }

 private resolvePreferredParentFromBrandLinks(linkedIds: Set<string>): Category | null {
 const linkedCategories = Array.from(linkedIds)
 .map((id) => this.flatCategories.find((item) => item.id === id) || null)
 .filter((item): item is Category => !!item);

 const levelTwo = linkedCategories.find((item) => (item.level ?? 0) === 2);
 if (levelTwo) {
 return levelTwo;
 }

 for (const linked of linkedCategories) {
 if ((linked.level ?? 0) > 2) {
 const parent = linked.parentCategoryId
 ? this.flatCategories.find((item) => item.id === linked.parentCategoryId) || null
 : null;
 if (parent && (parent.level ?? 0) === 2) {
 return parent;
 }
 }
 }

 return null;
 }

 private getCategoryAncestorPath(category: Category): Category[] {
 const path: Category[] = [];
 let current: Category | undefined = category;
 while (current) {
 path.unshift(current);
 const parentId: string | null | undefined = current.parentCategoryId;
 current = parentId ? this.flatCategories.find((item) => item.id === parentId) : undefined;
 }
 return path;
 }

 private autoSelectSingleSubActivity(): void {
 const options = this.subActivityOptions;
 if (options.length === 1) {
 this.categoryDraftForm.patchValue({ subActivityId: options[0].id });
 this.autoSelectSingleCategoryParent();
 }
 }

 private autoSelectSingleCategoryParent(): void {
 const options = this.categoryParentOptions;
 if (options.length === 1) {
 this.categoryDraftForm.patchValue({ categoryParentId: options[0].id });
 }
 }

 private getBrandOptionLabel(brand: BrandOption): string {
 const name = this.currentLang === 'ar' ? brand.nameAr : brand.nameEn;
 const categoryName = this.currentLang === 'ar' ? brand.categoryNameAr : brand.categoryNameEn;
 return categoryName ? `${name} · ${categoryName}` : name;
 }

 private toCategoryDropdownOptions(categories: Category[]): SearchableSelectOption[] {
 return categories.map(category => ({
 value: category.id,
 label: this.getCategoryOptionLabel(category)
 }));
 }

 private getSelectedBrand(): BrandOption | null {
 if (this.brandDraftForm.get('isNew')?.value) {
 const categoryId = this.brandDraftForm.get('categoryId')?.value as string | null;
 if (!categoryId) {
 return null;
 }

 return {
 id: '',
 nameAr: this.brandDraftForm.get('nameAr')?.value || '',
 nameEn: this.brandDraftForm.get('nameEn')?.value || '',
 categoryId,
 categoryIds: [categoryId]
 };
 }

 const brandId = this.requestForm.get('brandId')?.value as string | null;
 return brandId ? this.brands.find((item) => item.id === brandId) || null : null;
 }

 private getBrandLinkedCategoryIds(brand: BrandOption): Set<string> {
 return new Set([
 ...(brand.categoryIds || []),
 ...(brand.categoryId ? [brand.categoryId] : []),
 ...(brand.categories || []).map((item) => item.categoryId)
 ].filter(Boolean));
 }

 private doesBrandMatchCategory(brand: BrandOption, categoryId: string): boolean {
 const linkedIds = this.getBrandLinkedCategoryIds(brand);
 if (linkedIds.size === 0) {
 return true;
 }

 const category = this.flatCategories.find((item) => item.id === categoryId) || null;
 if (!category) {
 return linkedIds.has(categoryId);
 }

 return this.doesCategoryMatchBrandLinks(category, linkedIds);
 }

 private doesCategoryMatchBrandLinks(category: Category, linkedIds: Set<string>): boolean {
 if (linkedIds.has(category.id)) {
 return true;
 }

 return Array.from(linkedIds).some((linkedId) => this.isCategoryUnderAncestor(category, linkedId));
 }

 private clearCategorySelection(): void {
 this.requestForm.patchValue({ categoryId: '' }, { emitEvent: false });
 this.categoryDraftForm.patchValue({
 isNew: false,
 categoryId: '',
 nameAr: '',
 nameEn: '',
 requestKind: 'sub_category',
 activityId: '',
 subActivityId: '',
 categoryParentId: '',
 displayOrder: 1,
 imageUrl: ''
 }, { emitEvent: false });
 this.syncCategorySelectionValidator(false);
 this.selectedCategoryLabel = '';
 this.selectedCategoryMeta = '';
 }

 private syncCategoryWithBrandSelection(brandId: string | null, forceReset = false): void {
 if (!brandId) {
 if (forceReset) {
 this.clearCategorySelection();
 }
 return;
 }

 const brand = this.brands.find(item => item.id === brandId);
 if (!brand) {
 return;
 }

 this.selectedBrandLabel = this.currentLang === 'ar' ? brand.nameAr : brand.nameEn;

 const currentCategoryId = this.requestForm.get('categoryId')?.value as string | null;
 const linkedIds = this.getBrandLinkedCategoryIds(brand);
 const currentCategory = currentCategoryId
 ? this.flatCategories.find((item) => item.id === currentCategoryId) || null
 : null;
 const currentMatches = !!currentCategory
 && (linkedIds.size === 0 || this.doesCategoryMatchBrandLinks(currentCategory, linkedIds));

 if (currentMatches && !forceReset) {
 return;
 }

 const matchingCategories = this.flatCategories.filter((category) =>
 this.isProductAssignableCategory(category)
 && (linkedIds.size === 0 || this.doesCategoryMatchBrandLinks(category, linkedIds))
 );

 if (matchingCategories.length === 1) {
 const category = matchingCategories[0];
 this.requestForm.patchValue({ categoryId: category.id }, { emitEvent: false });
 this.categoryDraftForm.patchValue({ isNew: false, categoryId: category.id }, { emitEvent: false });
 this.syncCategorySelectionValidator(false);
 this.selectedCategoryLabel = this.getCategoryOptionLabel(category);
 this.selectedCategoryMeta = category.displayOrder
 ? `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${category.displayOrder}`
 : '';
 this.showCategorySelectionError = false;
 return;
 }

 this.clearCategorySelection();
 }

 private syncBrandWithCategorySelection(categoryId: string | null): void {
 if (!categoryId) {
 return;
 }

 const category = this.flatCategories.find(item => item.id === categoryId) || null;
 if (!category) {
 return;
 }

 this.selectedCategoryLabel = this.getCategoryOptionLabel(category);
 this.selectedCategoryMeta = category.displayOrder
 ? `${this.translate.instant('PRODUCTS.DISPLAY_ORDER')}: ${category.displayOrder}`
 : '';

 const brandId = this.requestForm.get('brandId')?.value as string | null;
 if (!brandId) {
 return;
 }

 const brand = this.brands.find((item) => item.id === brandId) || null;
 if (brand && !this.doesBrandMatchCategory(brand, categoryId)) {
 this.requestForm.patchValue({ brandId: '' }, { emitEvent: false });
 this.selectedBrandLabel = '';
 }
 }

 private flattenCategories(categories: Category[]): Category[] {
 return categories.flatMap(category => [
 category,...(category.subCategories ? this.flattenCategories(category.subCategories) : [])
 ]);
 }
}
