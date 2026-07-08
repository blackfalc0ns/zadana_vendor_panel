import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppCheckboxComponent } from '../../../../shared/components/ui/form-controls/checkbox/checkbox.component';
import { AppModalShellComponent } from '../../../../shared/components/ui/overlay/modal-shell/modal-shell.component';
import { CreateCouponOfferPayload } from '../../models/offers.models';

@Component({
 changeDetection: ChangeDetectionStrategy.OnPush,
 selector: 'app-coupon-offer-modal',
 standalone: true,
 imports: [
 CommonModule,
 ReactiveFormsModule,
 TranslateModule,
 AppModalShellComponent,
 AppButtonComponent,
 AppCheckboxComponent
 , SearchableSelectComponent],
 template: `
 @if (isOpen) {
 <app-modal-shell
 eyebrow="OFFERS.CREATE.COUPON_EYEBROW"
 title="OFFERS.CREATE.COUPON_TITLE"
 subtitle="OFFERS.CREATE.COUPON_HINT"
 [hasFooter]="true"
 (close)="handleClose()">
 <div [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
 <form [formGroup]="form" class="grid gap-4 md:grid-cols-2" (ngSubmit)="submit()">
 <label class="space-y-2">
 <span class="text-[0.74rem] font-black text-slate-600">{{ currentLang === 'ar' ? 'كود الكوبون' : 'Coupon code' }}</span>
 <input formControlName="code" type="text" class="offer-input" [placeholder]="'OFFERS.CREATE.COUPON_CODE_PLACEHOLDER' | translate">
 </label>

 <label class="space-y-2">
 <span class="text-[0.74rem] font-black text-slate-600">{{ currentLang === 'ar' ? 'عنوان الكوبون' : 'Coupon title' }}</span>
 <input formControlName="title" type="text" class="offer-input" [placeholder]="currentLang === 'ar' ? 'مثال: خصم نهاية الأسبوع' : 'Example: Weekend discount'">
 </label>

 <label class="space-y-2">
 <span class="text-[0.74rem] font-black text-slate-600">{{ currentLang === 'ar' ? 'نوع الخصم' : 'Discount type' }}</span>
 <app-searchable-select formControlName="type" [options]="[{value: 'percentage', labelKey: 'OFFERS.CREATE.VALUE_PERCENTAGE'}, {value: 'fixed', labelKey: 'OFFERS.CREATE.VALUE_FIXED'}]" [placeholder]="'OFFERS.CREATE.TYPE'"></app-searchable-select>
 </label>

 <label class="space-y-2">
 <span class="text-[0.74rem] font-black text-slate-600">{{ currentLang === 'ar' ? 'قيمة الخصم' : 'Discount value' }}</span>
 <input formControlName="value" type="number" class="offer-input" [placeholder]="'0'">
 </label>

 <label class="space-y-2">
 <span class="text-[0.74rem] font-black text-slate-600">{{ currentLang === 'ar' ? 'الحد الأدنى للطلب' : 'Minimum order' }}</span>
 <input formControlName="minOrder" type="number" class="offer-input" [placeholder]="'0'">
 </label>

 <label class="space-y-2">
 <span class="text-[0.74rem] font-black text-slate-600">{{ currentLang === 'ar' ? 'حد الاستخدام الكلي' : 'Usage limit' }}</span>
 <input formControlName="usageLimit" type="number" class="offer-input" [placeholder]="'100'">
 </label>

 <label class="space-y-2">
 <span class="text-[0.74rem] font-black text-slate-600">{{ currentLang === 'ar' ? 'ينتهي في' : 'Ends at' }}</span>
 <input formControlName="endsAt" type="date" class="offer-input">
 </label>

 <label class="space-y-2">
 <span class="text-[0.74rem] font-black text-slate-600">{{ currentLang === 'ar' ? 'حد الاستخدام لكل عميل' : 'Per-user limit' }}</span>
 <input formControlName="perUserLimit" type="number" min="0" class="offer-input" [placeholder]="currentLang === 'ar' ? 'اختياري' : 'Optional'">
 </label>

 <label class="space-y-2">
 <span class="text-[0.74rem] font-black text-slate-600">{{ currentLang === 'ar' ? 'الحد الأقصى للخصم' : 'Max discount cap' }}</span>
 <input formControlName="maxDiscountAmount" type="number" min="0" class="offer-input" [placeholder]="currentLang === 'ar' ? 'اختياري مع النسبة' : 'Optional for percentage'">
 </label>

 <div class="md:col-span-2 rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3">
 <app-checkbox formControlName="isActive">
 {{ 'OFFERS.CREATE.ACTIVE_COUPON' | translate }}
 </app-checkbox>
 </div>
 @if (errorMessage) {
 <div class="md:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[0.78rem] font-bold text-rose-700">
 {{ errorMessage }}
 </div>
 }
 </form>
 </div>

 <div footer>
 <div class="text-[0.72rem] font-bold text-slate-400">
 {{ 'OFFERS.CREATE.MODAL_HELP' | translate }}
 </div>
 <div class="flex flex-wrap items-center gap-3">
 <app-button variant="ghost" (btnClick)="handleClose()">
 {{ 'COMMON.CANCEL' | translate }}
 </app-button>
 <app-button [disabled]="form.invalid || isSaving" (btnClick)="submit()">
 {{ isSaving ? (currentLang === 'ar' ? 'نحفظ...' : 'Saving...') : ('OFFERS.CREATE.SAVE_COUPON' | translate) }}
 </app-button>
 </div>
 </div>
 </app-modal-shell>
 }
 `,
 styles: [`.offer-input {
 width: 100%;
 height: 3rem;
 border-radius: 1rem;
 border: 1px solid rgb(226 232 240);
 background: rgb(248 250 252);
 padding: 0 1rem;
 font-size: 0.8rem;
 font-weight: 700;
 color: rgb(15 23 42);
 outline: none;
 transition: all 180ms ease;
 }.offer-input:focus,.offer-textarea:focus {
 border-color: rgb(45 212 191 / 0.35);
 background: white;
 box-shadow: 0 0 0 4px rgb(45 212 191 / 0.08);
 }.offer-textarea {
 width: 100%;
 border-radius: 1rem;
 border: 1px solid rgb(226 232 240);
 background: rgb(248 250 252);
 padding: 0.9rem 1rem;
 font-size: 0.8rem;
 font-weight: 700;
 color: rgb(15 23 42);
 outline: none;
 resize: vertical;
 transition: all 180ms ease;
 }
 `]
})
export class CouponOfferModalComponent {
 @Input() isOpen = false;
 @Input() isSaving = false;
 @Input() errorMessage = '';
 @Output() readonly close = new EventEmitter<void>();
 @Output() readonly saved = new EventEmitter<CreateCouponOfferPayload>();

 readonly form;

 constructor(
 private readonly fb: FormBuilder,
 private readonly translate: TranslateService
 ) {
 this.form = this.fb.nonNullable.group({
 code: ['', [Validators.required, Validators.minLength(4)]],
 title: ['', [Validators.required, Validators.minLength(3)]],
 type: this.fb.nonNullable.control<'percentage' | 'fixed'>('percentage'),
 value: this.fb.nonNullable.control(10, [Validators.required, Validators.min(1)]),
 minOrder: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
 usageLimit: this.fb.control<number | null>(100, [Validators.min(1)]),
 endsAt: this.fb.nonNullable.control(this.buildDefaultEndDate(), Validators.required),
 perUserLimit: this.fb.control<number | null>(null, [Validators.min(1)]),
 maxDiscountAmount: this.fb.control<number | null>(null, [Validators.min(1)]),
 isActive: this.fb.nonNullable.control(true)
 });
 }

 get currentLang(): string {
 return this.translate.currentLang || 'ar';
 }

 submit(): void {
 if (this.form.invalid || this.isSaving) {
 this.form.markAllAsTouched();
 return;
 }

 this.saved.emit(this.form.getRawValue());
 }

 handleClose(): void {
 this.resetForm();
 this.close.emit();
 }

 private resetForm(): void {
 this.form.reset({
 code: '',
 title: '',
 type: 'percentage',
 value: 10,
 minOrder: 0,
 usageLimit: 100,
 endsAt: this.buildDefaultEndDate(),
 perUserLimit: null,
 maxDiscountAmount: null,
 isActive: true
 });
 }

 private buildDefaultEndDate(): string {
 const date = new Date();
 date.setDate(date.getDate() + 14);
 return date.toISOString().slice(0, 10);
 }
}
