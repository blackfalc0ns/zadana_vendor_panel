import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppCheckboxComponent } from '../../../../shared/components/ui/form-controls/checkbox/checkbox.component';
import { AppModalShellComponent } from '../../../../shared/components/ui/overlay/modal-shell/modal-shell.component';
import { CreateCouponOfferPayload } from '../../models/offers.models';

@Component({
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
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.COUPON_CODE' | translate }}</span>
              <input formControlName="code" type="text" class="offer-input" [placeholder]="'OFFERS.CREATE.COUPON_CODE_PLACEHOLDER' | translate">
            </label>

            <label class="space-y-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.DISCOUNT_TYPE' | translate }}</span>
              <app-searchable-select formControlName="type" [options]="[{value: 'percentage', labelKey: 'OFFERS.CREATE.VALUE_PERCENTAGE'}, {value: 'fixed', labelKey: 'OFFERS.CREATE.VALUE_FIXED'}]" [placeholder]="'OFFERS.CREATE.TYPE'"></app-searchable-select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.DISCOUNT_VALUE' | translate }}</span>
              <input formControlName="value" type="number" class="offer-input" [placeholder]="'0'">
            </label>

            <label class="space-y-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.MIN_ORDER' | translate }}</span>
              <input formControlName="minOrder" type="number" class="offer-input" [placeholder]="'0'">
            </label>

            <label class="space-y-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.USAGE_LIMIT' | translate }}</span>
              <input formControlName="usageLimit" type="number" class="offer-input" [placeholder]="'100'">
            </label>

            <label class="space-y-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.ENDS_AT' | translate }}</span>
              <input formControlName="endsAt" type="date" class="offer-input">
            </label>

            <label class="space-y-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.AUDIENCE_AR' | translate }}</span>
              <input formControlName="audienceAr" type="text" class="offer-input" [placeholder]="'OFFERS.CREATE.AUDIENCE_AR_PLACEHOLDER' | translate">
            </label>

            <label class="space-y-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.AUDIENCE_EN' | translate }}</span>
              <input formControlName="audienceEn" type="text" class="offer-input" [placeholder]="'OFFERS.CREATE.AUDIENCE_EN_PLACEHOLDER' | translate">
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.NOTE_AR' | translate }}</span>
              <textarea formControlName="noteAr" rows="3" class="offer-textarea" [placeholder]="'OFFERS.CREATE.NOTE_AR_PLACEHOLDER' | translate"></textarea>
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.NOTE_EN' | translate }}</span>
              <textarea formControlName="noteEn" rows="3" class="offer-textarea" [placeholder]="'OFFERS.CREATE.NOTE_EN_PLACEHOLDER' | translate"></textarea>
            </label>

            <div class="md:col-span-2 rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3">
              <app-checkbox formControlName="isActive">
                {{ 'OFFERS.CREATE.ACTIVE_COUPON' | translate }}
              </app-checkbox>
            </div>
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
            <app-button [disabled]="form.invalid" (btnClick)="submit()">
              {{ 'OFFERS.CREATE.SAVE_COUPON' | translate }}
            </app-button>
          </div>
        </div>
      </app-modal-shell>
    }
  `,
  styles: [`
    .offer-input {
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
    }

    .offer-input:focus,
    .offer-textarea:focus {
      border-color: rgb(45 212 191 / 0.35);
      background: white;
      box-shadow: 0 0 0 4px rgb(45 212 191 / 0.08);
    }

    .offer-textarea {
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
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<CreateCouponOfferPayload>();

  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService
  ) {
    this.form = this.fb.nonNullable.group({
      code: ['', [Validators.required, Validators.minLength(4)]],
      type: this.fb.nonNullable.control<'percentage' | 'fixed'>('percentage'),
      value: this.fb.nonNullable.control(10, [Validators.required, Validators.min(1)]),
      minOrder: this.fb.nonNullable.control(100, [Validators.required, Validators.min(0)]),
      usageLimit: this.fb.nonNullable.control(100, [Validators.required, Validators.min(1)]),
      endsAt: this.fb.nonNullable.control(this.buildDefaultEndDate(), Validators.required),
      audienceAr: ['', [Validators.required, Validators.minLength(2)]],
      audienceEn: ['', [Validators.required, Validators.minLength(2)]],
      noteAr: ['', [Validators.required, Validators.minLength(4)]],
      noteEn: ['', [Validators.required, Validators.minLength(4)]],
      isActive: this.fb.nonNullable.control(true)
    });
  }

  get currentLang(): string {
    return this.translate.currentLang || 'ar';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saved.emit(this.form.getRawValue());
    this.resetForm();
  }

  handleClose(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.form.reset({
      code: '',
      type: 'percentage',
      value: 10,
      minOrder: 100,
      usageLimit: 100,
      endsAt: this.buildDefaultEndDate(),
      audienceAr: '',
      audienceEn: '',
      noteAr: '',
      noteEn: '',
      isActive: true
    });
  }

  private buildDefaultEndDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().slice(0, 10);
  }
}
