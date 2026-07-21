import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { VendorNotificationSoundService } from '../../../../../core/notifications/services/vendor-notification-sound.service';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { AppPageSectionShellComponent } from '../../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';

@Component({
 changeDetection: ChangeDetectionStrategy.OnPush,
 selector: 'app-profile-operations-window',
 standalone: true,
 imports: [CommonModule, ReactiveFormsModule, TranslateModule, SearchableSelectComponent, AppPageSectionShellComponent],
 template: `
 <div [formGroup]="form" class="space-y-6">
 <div id="banking-section">
 <app-page-section-shell
 [title]="'SETTINGS_PROFILE.SECTIONS.BANKING'"
 [subtitle]="'SETTINGS_PROFILE.SECTIONS.BANKING_HINT'"
 wrapperClass="overflow-visible"
 bodyClass="grid gap-6 px-5 py-5">
 <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md">
 <div class="border-b border-white/40 bg-white/50 px-6 py-4 rounded-t-[1.5rem]">
 <span class="text-[0.75rem] font-black uppercase tracking-wider text-slate-700">{{ 'SETTINGS_PROFILE.UI.BANK_PROFILE' | translate }}</span>
 </div>
 <div class="grid gap-4 p-6 md:grid-cols-2">
 <label class="block">
 <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
 {{ 'ONBOARDING.FIELDS.BANK_NAME' | translate }} <span class="text-rose-500 font-extrabold">*</span>
 </span>
 <app-searchable-select 
 formControlName="bankName" 
 [options]="bankOptions" 
 [placeholder]="'ONBOARDING.FIELDS.BANK_NAME'"
 [error]="form.get('bankName')?.invalid && (form.get('bankName')?.touched || form.get('bankName')?.dirty) ? 'REGISTER.ERR_GENERAL' : ''"
 [isTouched]="form.get('bankName')?.touched || form.get('bankName')?.dirty || false"
 [isRequired]="true"
 ></app-searchable-select>
 </label>

 <label class="block">
 <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
 {{ 'ONBOARDING.FIELDS.PAYMENT_CYCLE' | translate }} <span class="text-rose-500 font-extrabold">*</span>
 </span>
 <app-searchable-select 
 formControlName="payoutCycle" 
 [options]="paymentCycleOptions" 
 [placeholder]="'ONBOARDING.FIELDS.PAYMENT_CYCLE'"
 [error]="form.get('payoutCycle')?.invalid && (form.get('payoutCycle')?.touched || form.get('payoutCycle')?.dirty) ? 'REGISTER.ERR_GENERAL' : ''"
 [isTouched]="form.get('payoutCycle')?.touched || form.get('payoutCycle')?.dirty || false"
 [isRequired]="true"
 ></app-searchable-select>
 </label>

 <label class="block">
 <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
 {{ 'ONBOARDING.FIELDS.PAYOUT_DAY' | translate }} <span class="text-rose-500 font-extrabold">*</span>
 </span>
 <app-searchable-select
 formControlName="payoutDay"
 [options]="payoutDayOptions"
 [placeholder]="'ONBOARDING.PLACEHOLDERS.SELECT_PAYOUT_DAY'"
 [error]="form.get('payoutDay')?.invalid && (form.get('payoutDay')?.touched || form.get('payoutDay')?.dirty) ? 'REGISTER.ERR_GENERAL' : ''"
 [isTouched]="form.get('payoutDay')?.touched || form.get('payoutDay')?.dirty || false"
 [isRequired]="true"
 ></app-searchable-select>
 </label>

 <label class="block">
 <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
 {{ 'ONBOARDING.FIELDS.IBAN' | translate }} <span class="text-rose-500 font-extrabold">*</span>
 </span>
 <input formControlName="iban" type="text" dir="ltr" [class]="fieldClass('iban', 'ltr')">
 <p *ngIf="form.get('iban')?.invalid && (form.get('iban')?.touched || form.get('iban')?.dirty)" 
 class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
 {{ 'REGISTER.ERR_GENERAL' | translate }}
 </p>
 </label>

 <label class="block">
 <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
 {{ 'ONBOARDING.FIELDS.SWIFT' | translate }}
 </span>
 <input formControlName="swiftCode" type="text" dir="ltr" class="uppercase" [class]="fieldClass('swiftCode', 'ltr')">
 </label>
 </div>
 </div>

 <div class="flex justify-end">
 <button
 type="button"
 (click)="saveBanking.emit()"
 [disabled]="isSavingBanking || isPayoutPreferenceLoading"
 class="inline-flex items-center justify-center gap-2 rounded-[10px] bg-slate-900 px-5 py-2.5 text-[0.8rem] font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 disabled:opacity-50 disabled:pointer-events-none">
 <span *ngIf="isSavingBanking" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
 <span *ngIf="!isSavingBanking" class="material-symbols-outlined text-[16px]">save</span>
 {{ 'SETTINGS_PROFILE.UI.SAVE_SECTION' | translate }}
 </button>
 </div>
 </app-page-section-shell>
 </div>

 <div id="operations-settings-section">
 <app-page-section-shell
 [title]="'SETTINGS_PROFILE.SECTIONS.OPERATIONS_SETTINGS'"
 [subtitle]="'SETTINGS_PROFILE.SECTIONS.OPERATIONS_SETTINGS_HINT'"
 bodyClass="grid gap-6 px-5 py-5">
 <div class="grid gap-5 lg:grid-cols-2">
 <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl p-6 shadow-sm transition-shadow hover:shadow-md lg:col-span-2">
 <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div class="max-w-2xl">
 <p class="text-sm font-bold text-slate-900">{{ currentLang === 'ar' ? 'ظهور المتجر في تطبيق العميل' : 'Store visibility in customer app' }}</p>
 <p class="mt-1 text-[0.72rem] font-semibold text-slate-500">
 {{ currentLang === 'ar'
                       ? 'إذا أخفيت المتجر مؤقتًا، بتختفي منتجاته من التطبيق لين ترجع ظهوره.'
                       : 'When switched offline, the store products are hidden from the customer app until it is turned online again.' }}
 </p>
 </div>

 <span
 class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.72rem] font-bold"
 [ngClass]="isStoreOffline() ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'">
 <span class="h-2 w-2 rounded-full" [ngClass]="isStoreOffline() ? 'bg-rose-500' : 'bg-emerald-500'"></span>
 {{ isStoreOffline()
                     ? (currentLang === 'ar' ? 'المتجر مخفي مؤقتًا' : 'Store is offline')
                     : (currentLang === 'ar' ? 'المتجر ظاهر' : 'Store is online') }}
 </span>
 </div>

 <div class="mt-4 grid gap-3 md:grid-cols-2">
 <button
 type="button"
 (click)="setStoreManualMode('online')"
 class="rounded-[12px] border px-4 py-3 text-start transition-all"
 [ngClass]="!isStoreOffline() ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40'">
 <span class="block text-[0.8rem] font-bold">{{ currentLang === 'ar' ? 'ظاهر' : 'Online' }}</span>
 <span class="mt-1 block text-[0.72rem] font-semibold">{{ currentLang === 'ar' ? 'المنتجات تظهر في التطبيق ويمكن استقبال الطلبات.' : 'Products stay visible in the app and can receive new orders.' }}</span>
 </button>

 <button
 type="button"
 (click)="setStoreManualMode('offline')"
 class="rounded-[12px] border px-4 py-3 text-start transition-all"
 [ngClass]="isStoreOffline() ? 'border-rose-300 bg-rose-50 text-rose-800 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-rose-200 hover:bg-rose-50/40'">
 <span class="block text-[0.8rem] font-bold">{{ currentLang === 'ar' ? 'مخفي مؤقتًا' : 'Offline' }}</span>
 <span class="mt-1 block text-[0.72rem] font-semibold">{{ currentLang === 'ar' ? 'إخفاء كل المنتجات من تطبيق العميل مؤقتًا.' : 'Temporarily hide all products from the customer app.' }}</span>
 </button>
 </div>

 <label *ngIf="isStoreOffline()" class="mt-4 block">
 <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
 {{ currentLang === 'ar' ? 'سبب الإخفاء الاختياري' : 'Optional offline reason' }}
 </span>
 <input formControlName="storeManualReason" type="text" [class]="fieldClass('storeManualReason')">
 </label>
 </div>

 <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl p-6 shadow-sm transition-shadow hover:shadow-md">
 <div class="flex items-center justify-between gap-3">
 <div>
 <p class="text-sm font-bold text-slate-900">{{ 'SETTINGS_PROFILE.OPERATIONS.ACCEPT_ORDERS' | translate }}</p>
 <p class="mt-1 text-[0.72rem] font-semibold text-slate-500">{{ 'SETTINGS_PROFILE.OPERATIONS.ACCEPT_ORDERS_HINT' | translate }}</p>
 </div>
 <label class="group relative flex cursor-pointer items-center justify-center">
 <input formControlName="acceptOrders" type="checkbox" class="peer sr-only">
 <div class="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20"></div>
 <div class="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-slate-300 bg-white transition-all peer-checked:left-[22px] peer-checked:border-white shadow-sm"></div>
 </label>
 </div>
 </div>

 <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl p-6 shadow-sm transition-shadow hover:shadow-md">
 <div class="grid gap-4 md:grid-cols-2">
 <label class="block">
 <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
 {{ 'SETTINGS_PROFILE.OPERATIONS.MINIMUM_ORDER_AMOUNT' | translate }}
 </span>
 <input formControlName="minimumOrderAmount" type="number" min="0" [class]="fieldClass('minimumOrderAmount', 'ltr')">
 </label>

 <label class="block">
 <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
 {{ 'SETTINGS_PROFILE.OPERATIONS.PREPARATION_TIME' | translate }}
 </span>
 <input formControlName="preparationTimeMinutes" type="number" min="0" [class]="fieldClass('preparationTimeMinutes', 'ltr')">
 </label>
 </div>
 </div>
 </div>

 <div class="flex justify-end">
 <button
 type="button"
 (click)="saveOperationsSettings.emit()"
 [disabled]="isSavingOperationsSettings"
 class="inline-flex items-center justify-center gap-2 rounded-[10px] bg-slate-900 px-5 py-2.5 text-[0.8rem] font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 disabled:opacity-50 disabled:pointer-events-none">
 <span *ngIf="isSavingOperationsSettings" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
 <span *ngIf="!isSavingOperationsSettings" class="material-symbols-outlined text-[16px]">save</span>
 {{ 'SETTINGS_PROFILE.UI.SAVE_SECTION' | translate }}
 </button>
 </div>
 </app-page-section-shell>
 </div>

 <div id="notification-settings-section">
 <app-page-section-shell
 [title]="'SETTINGS_PROFILE.SECTIONS.NOTIFICATION_SETTINGS'"
 [subtitle]="'SETTINGS_PROFILE.SECTIONS.NOTIFICATION_SETTINGS_HINT'"
 wrapperClass="overflow-visible"
 bodyClass="grid gap-4 px-5 py-5">
 <div class="rounded-[1.5rem] border border-violet-100/60 bg-gradient-to-r from-violet-50/60 via-white/40 to-sky-50/60 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md">
 <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
 
 <div class="flex items-start gap-4">
 <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm border border-violet-100">
 <span class="material-symbols-outlined text-[26px]">notifications_active</span>
 </div>
 <div>
 <h3 class="text-sm font-bold text-slate-900">{{ 'SETTINGS_PROFILE.NOTIFICATIONS.SOUND' | translate }}</h3>
 <p class="mt-1 text-[0.75rem] font-semibold text-slate-500 max-w-sm">{{ 'SETTINGS_PROFILE.NOTIFICATIONS.SOUND_HINT' | translate }}</p>
 </div>
 </div>

 <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
 <div class="w-full sm:w-[240px]">
 <app-searchable-select
 formControlName="notificationSound"
 [options]="notificationSoundOptions"
 [placeholder]="'SETTINGS_PROFILE.NOTIFICATIONS.SOUND'"
 [error]="form.get('notificationSound')?.invalid && (form.get('notificationSound')?.touched || form.get('notificationSound')?.dirty) ? 'REGISTER.ERR_GENERAL' : ''"
 [isTouched]="form.get('notificationSound')?.touched || form.get('notificationSound')?.dirty || false">
 </app-searchable-select>
 </div>
 
 <button
 type="button"
 (click)="previewNotificationSound()"
 class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[0.8rem] font-bold text-violet-700 shadow-sm border border-violet-200 transition-all hover:bg-violet-50 hover:border-violet-300 focus:ring-2 focus:ring-violet-500/20 active:scale-95">
 <span class="material-symbols-outlined text-[20px]">play_circle</span>
 {{ 'SETTINGS_PROFILE.NOTIFICATIONS.PREVIEW_SOUND' | translate }}
 </button>
 </div>

 </div>
 </div>

 <div class="grid gap-4 lg:grid-cols-3">
 <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl p-6 shadow-sm transition-shadow hover:shadow-md">
 <div class="flex items-start justify-between gap-3">
 <div>
 <p class="text-sm font-bold text-slate-900">{{ 'SETTINGS_PROFILE.NOTIFICATIONS.EMAIL' | translate }}</p>
 <p class="mt-1 text-[0.72rem] font-semibold text-slate-500">{{ 'SETTINGS_PROFILE.NOTIFICATIONS.EMAIL_HINT' | translate }}</p>
 </div>
 <label class="group relative flex cursor-pointer items-center justify-center">
 <input formControlName="emailNotificationsEnabled" type="checkbox" class="peer sr-only">
 <div class="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20"></div>
 <div class="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-slate-300 bg-white transition-all peer-checked:left-[22px] peer-checked:border-white shadow-sm"></div>
 </label>
 </div>
 </div>

 <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl p-6 shadow-sm transition-shadow hover:shadow-md">
 <div class="flex items-start justify-between gap-3">
 <div>
 <p class="text-sm font-bold text-slate-900">{{ 'SETTINGS_PROFILE.NOTIFICATIONS.SMS' | translate }}</p>
 <p class="mt-1 text-[0.72rem] font-semibold text-slate-500">{{ 'SETTINGS_PROFILE.NOTIFICATIONS.SMS_HINT' | translate }}</p>
 </div>
 <label class="group relative flex cursor-pointer items-center justify-center">
 <input formControlName="smsNotificationsEnabled" type="checkbox" class="peer sr-only">
 <div class="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20"></div>
 <div class="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-slate-300 bg-white transition-all peer-checked:left-[22px] peer-checked:border-white shadow-sm"></div>
 </label>
 </div>
 </div>

 <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl p-6 shadow-sm transition-shadow hover:shadow-md">
 <div class="flex items-start justify-between gap-3">
 <div>
 <p class="text-sm font-bold text-slate-900">{{ 'SETTINGS_PROFILE.NOTIFICATIONS.NEW_ORDERS' | translate }}</p>
 <p class="mt-1 text-[0.72rem] font-semibold text-slate-500">{{ 'SETTINGS_PROFILE.NOTIFICATIONS.NEW_ORDERS_HINT' | translate }}</p>
 </div>
 <label class="group relative flex cursor-pointer items-center justify-center">
 <input formControlName="newOrdersNotificationsEnabled" type="checkbox" class="peer sr-only">
 <div class="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20"></div>
 <div class="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-slate-300 bg-white transition-all peer-checked:left-[22px] peer-checked:border-white shadow-sm"></div>
 </label>
 </div>
 </div>
 </div>

 <div class="flex justify-end">
 <button
 type="button"
 (click)="saveNotifications.emit()"
 [disabled]="isSavingNotifications"
 class="inline-flex items-center justify-center gap-2 rounded-[10px] bg-slate-900 px-5 py-2.5 text-[0.8rem] font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 disabled:opacity-50 disabled:pointer-events-none">
 <span *ngIf="isSavingNotifications" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
 <span *ngIf="!isSavingNotifications" class="material-symbols-outlined text-[16px]">save</span>
 {{ 'SETTINGS_PROFILE.UI.SAVE_SECTION' | translate }}
 </button>
 </div>
 </app-page-section-shell>
 </div>

 <div id="hours-section">
 <app-page-section-shell
 [title]="'SETTINGS_PROFILE.SECTIONS.HOURS'"
 [subtitle]="'SETTINGS_PROFILE.SECTIONS.HOURS_HINT'"
 bodyClass="px-5 py-5">
 <div actions>
 <span class="inline-flex items-center gap-1.5 rounded-[6px] bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-bold text-emerald-700 border border-emerald-200">
 <span class="relative flex h-2 w-2">
 <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
 <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
 </span>
 {{ openDaysCount }} / {{ operatingHours.length }}
 </span>
 </div>

 <div formArrayName="operatingHours" class="grid gap-3">
 @for (hour of operatingHours.controls; track $index) {
 <div
 [formGroupName]="$index"
 class="flex flex-col md:flex-row md:items-center gap-4 rounded-[1.25rem] border border-white/60 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
 [ngClass]="hour.get('isOpen')?.value ? 'bg-emerald-50/50 backdrop-blur-xl' : 'bg-white/40 backdrop-blur-xl'">
 
 <div class="flex flex-1 items-center justify-between gap-4 md:justify-start md:min-w-[200px]">
 <div class="flex items-center gap-4">
 <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] shadow-sm border"
 [ngClass]="hour.get('isOpen')?.value ? 'bg-white border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'">
 <span class="material-symbols-outlined text-[22px]">{{ hour.get('isOpen')?.value ? 'storefront' : 'store_closed' }}</span>
 </div>
 <div>
 <p class="text-sm font-bold text-slate-900">{{ hour.get('dayKey')?.value | translate }}</p>
 <p class="text-[0.7rem] font-bold"
 [ngClass]="hour.get('isOpen')?.value ? 'text-emerald-600' : 'text-slate-500'">
 {{ hour.get('isOpen')?.value ? ('SETTINGS_PROFILE.OPEN_NOW' | translate) : ('COMMON.CLOSE' | translate) }}
 </p>
 </div>
 </div>

 <label class="group relative flex cursor-pointer items-center justify-center md:ml-auto">
 <input formControlName="isOpen" type="checkbox" class="peer sr-only">
 <div class="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20"></div>
 <div class="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-slate-300 bg-white transition-all peer-checked:left-[22px] peer-checked:border-white shadow-sm"></div>
 </label>
 </div>

 <div class="flex gap-4 md:ml-auto">
 <div class="flex-1 md:w-32">
 <label class="mb-1 block text-[0.66rem] font-bold text-slate-500" [ngClass]="{'opacity-50':!hour.get('isOpen')?.value}">{{ currentLang === 'ar' ? 'من' : 'From' }}</label>
 <input formControlName="from" type="time" [class]="timeFieldClass(hour.get('isOpen')?.value)">
 </div>
 <div class="flex-1 md:w-32">
 <label class="mb-1 block text-[0.66rem] font-bold text-slate-500" [ngClass]="{'opacity-50':!hour.get('isOpen')?.value}">{{ currentLang === 'ar' ? 'إلى' : 'To' }}</label>
 <input formControlName="to" type="time" [class]="timeFieldClass(hour.get('isOpen')?.value)">
 </div>
 </div>
 </div>
 }
 </div>

 <div class="mt-4 flex justify-end border-t border-slate-100 pt-4">
 <button
 type="button"
 (click)="saveHours.emit()"
 [disabled]="isSavingHours"
 class="inline-flex items-center justify-center gap-2 rounded-[10px] bg-slate-900 px-5 py-2.5 text-[0.8rem] font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 disabled:opacity-50 disabled:pointer-events-none">
 <span *ngIf="isSavingHours" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
 <span *ngIf="!isSavingHours" class="material-symbols-outlined text-[16px]">save</span>
 {{ 'SETTINGS_PROFILE.UI.SAVE_SECTION' | translate }}
 </button>
 </div>
 </app-page-section-shell>
 </div>
 </div>
 `
})
export class ProfileOperationsWindowComponent {
 @Input() currentLang: 'ar' | 'en' | string = 'ar';
 @Input({ required: true }) form!: FormGroup;
 @Input() bankOptions: SearchableSelectOption[] = [];
 @Input() paymentCycleOptions: SearchableSelectOption[] = [];
 @Input() payoutDayOptions: SearchableSelectOption[] = [];
 @Input() notificationSoundOptions: SearchableSelectOption[] = [];
 @Input() openDaysCount = 0;
 @Input() isSavingBanking = false;
 @Input() isPayoutPreferenceLoading = false;
 @Input() isSavingHours = false;
 @Input() isSavingOperationsSettings = false;
 @Input() isSavingNotifications = false;
 @Input() fieldClass!: (controlName: string, mode?: 'context' | 'ltr' | 'rtl') => string;
 @Input() timeFieldClass!: (isOpen: boolean) => string;

 @Output() saveBanking = new EventEmitter<void>();
 @Output() saveHours = new EventEmitter<void>();
 @Output() saveOperationsSettings = new EventEmitter<void>();
 @Output() saveNotifications = new EventEmitter<void>();

 constructor(
 private readonly notificationSoundService: VendorNotificationSoundService
 ) {}

 get operatingHours(): FormArray {
 return this.form.get('operatingHours') as FormArray;
 }

 isStoreOffline(): boolean {
 return this.form.get('storeManualMode')?.value === 'offline';
 }

 setStoreManualMode(mode: 'online' | 'offline'): void {
 this.form.patchValue({
 storeManualMode: mode,
 storeManualReason: mode === 'offline' ? this.form.get('storeManualReason')?.value : ''
 });
 }

 previewNotificationSound(): void {
 this.notificationSoundService.preview(this.form.get('notificationSound')?.value);
 }
}
