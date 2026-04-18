import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppModalShellComponent } from '../../../../shared/components/ui/overlay/modal-shell/modal-shell.component';
import {
  CategoryCampaignCreateOption,
  CreateCategoryCampaignPayload
} from '../../models/offers.models';

@Component({
  selector: 'app-category-campaign-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    AppModalShellComponent,
    AppButtonComponent
  , SearchableSelectComponent],
  template: `
    @if (isOpen) {
      <app-modal-shell
        eyebrow="OFFERS.CREATE.CATEGORY_EYEBROW"
        title="OFFERS.CREATE.CATEGORY_TITLE"
        subtitle="OFFERS.CREATE.CATEGORY_HINT"
        [hasFooter]="true"
        (close)="handleClose()">
        <div [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
          <form [formGroup]="form" class="grid gap-4 md:grid-cols-2">
            <label class="space-y-2 md:col-span-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.CATEGORY_FIELD' | translate }}</span>
              <app-searchable-select formControlName="categoryId" [options]="mappedCategoryOptions" [placeholder]="'OFFERS.CREATE.CATEGORY_PLACEHOLDER'"></app-searchable-select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.DISCOUNT_PERCENTAGE' | translate }}</span>
              <input formControlName="discountPercentage" type="number" class="offer-input" [placeholder]="'15'">
            </label>

            <label class="space-y-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.ENDS_AT' | translate }}</span>
              <input formControlName="endsAt" type="date" class="offer-input">
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.HEADLINE_AR' | translate }}</span>
              <input formControlName="headlineAr" type="text" class="offer-input" [placeholder]="'OFFERS.CREATE.HEADLINE_AR_PLACEHOLDER' | translate">
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.HEADLINE_EN' | translate }}</span>
              <input formControlName="headlineEn" type="text" class="offer-input" [placeholder]="'OFFERS.CREATE.HEADLINE_EN_PLACEHOLDER' | translate">
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.NOTE_AR' | translate }}</span>
              <textarea formControlName="noteAr" rows="3" class="offer-textarea" [placeholder]="'OFFERS.CREATE.CATEGORY_NOTE_AR_PLACEHOLDER' | translate"></textarea>
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.NOTE_EN' | translate }}</span>
              <textarea formControlName="noteEn" rows="3" class="offer-textarea" [placeholder]="'OFFERS.CREATE.CATEGORY_NOTE_EN_PLACEHOLDER' | translate"></textarea>
            </label>

            @if (selectedCategoryOption; as selectedCategory) {
              <div class="md:col-span-2 grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-3">
                <div>
                  <div class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.TABLE.CATEGORY' | translate }}</div>
                  <div class="mt-1 text-[0.84rem] font-black text-slate-900">
                    {{ currentLang === 'ar' ? selectedCategory.categoryNameAr : selectedCategory.categoryNameEn }}
                  </div>
                </div>
                <div>
                  <div class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.TABLE.INCLUDED_PRODUCTS' | translate }}</div>
                  <div class="mt-1 text-[0.84rem] font-black text-slate-900">{{ selectedCategory.productsIncluded }}</div>
                </div>
                <div>
                  <div class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.CREATE.DISCOUNT_PERCENTAGE' | translate }}</div>
                  <div class="mt-1 text-[0.84rem] font-black text-zadna-primary">{{ form.controls.discountPercentage.value || 0 }}%</div>
                </div>
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
            <app-button [disabled]="form.invalid" (btnClick)="submit()">
              {{ 'OFFERS.CREATE.SAVE_CATEGORY' | translate }}
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
export class CategoryCampaignModalComponent {

  get mappedCategoryOptions(): SearchableSelectOption[] {
    return this.categoryOptions.map((x: any) => ({
      value: x.categoryId,
      label: (this.currentLang === 'ar' ? x.categoryNameAr : x.categoryNameEn) + ' (' + x.productsIncluded + ')'
    }));
  }

  @Input() isOpen = false;
  @Input() categoryOptions: CategoryCampaignCreateOption[] = [];
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<CreateCategoryCampaignPayload>();

  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService
  ) {
    this.form = this.fb.nonNullable.group({
      categoryId: ['', Validators.required],
      discountPercentage: this.fb.nonNullable.control(15, [Validators.required, Validators.min(1), Validators.max(90)]),
      endsAt: this.fb.nonNullable.control(this.buildDefaultEndDate(), Validators.required),
      headlineAr: ['', [Validators.required, Validators.minLength(4)]],
      headlineEn: ['', [Validators.required, Validators.minLength(4)]],
      noteAr: ['', [Validators.required, Validators.minLength(4)]],
      noteEn: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  get currentLang(): string {
    return this.translate.currentLang || 'ar';
  }

  get selectedCategoryOption(): CategoryCampaignCreateOption | undefined {
    return this.categoryOptions.find((item) => item.categoryId === this.form.controls.categoryId.value);
  }

  submit(): void {
    if (this.form.invalid || !this.selectedCategoryOption) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    this.saved.emit({
      categoryId: values.categoryId,
      categoryNameAr: this.selectedCategoryOption.categoryNameAr,
      categoryNameEn: this.selectedCategoryOption.categoryNameEn,
      productsIncluded: this.selectedCategoryOption.productsIncluded,
      discountPercentage: values.discountPercentage,
      endsAt: values.endsAt || this.buildDefaultEndDate(),
      headlineAr: values.headlineAr,
      headlineEn: values.headlineEn,
      noteAr: values.noteAr,
      noteEn: values.noteEn
    });
    this.resetForm();
  }

  handleClose(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.form.reset({
      categoryId: '',
      discountPercentage: 15,
      endsAt: this.buildDefaultEndDate(),
      headlineAr: '',
      headlineEn: '',
      noteAr: '',
      noteEn: ''
    });
  }

  private buildDefaultEndDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 10);
    return date.toISOString().slice(0, 10);
  }
}
