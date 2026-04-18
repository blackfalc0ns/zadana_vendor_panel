import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppModalShellComponent } from '../../../../shared/components/ui/overlay/modal-shell/modal-shell.component';
import { VendorProduct } from '../../../products/models/catalog.models';
import { CreateClearanceOfferPayload } from '../../models/offers.models';

@Component({
  selector: 'app-clearance-offer-modal',
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
        eyebrow="OFFERS.CREATE.CLEARANCE_EYEBROW"
        title="OFFERS.CREATE.CLEARANCE_TITLE"
        subtitle="OFFERS.CREATE.CLEARANCE_HINT"
        [hasFooter]="true"
        (close)="handleClose()">
        <div [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
          @if (products.length === 0) {
            <div class="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
              <div class="text-[0.88rem] font-black text-slate-900">{{ 'OFFERS.CREATE.NO_LOW_STOCK_PRODUCTS' | translate }}</div>
              <div class="mt-2 text-[0.76rem] font-bold text-slate-500">{{ 'OFFERS.CREATE.NO_LOW_STOCK_PRODUCTS_HINT' | translate }}</div>
            </div>
          } @else {
            <form [formGroup]="form" class="grid gap-4 md:grid-cols-2">
              <label class="space-y-2 md:col-span-2">
                <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.PRODUCT_FIELD' | translate }}</span>
                <app-searchable-select formControlName="productId" [options]="mappedProductOptions" [placeholder]="'OFFERS.CREATE.PRODUCT_PLACEHOLDER'"></app-searchable-select>
              </label>

              <label class="space-y-2">
                <span class="text-[0.74rem] font-black text-slate-600">{{ 'OFFERS.CREATE.DISCOUNT_PERCENTAGE' | translate }}</span>
                <input formControlName="discountPercentage" type="number" class="offer-input" [placeholder]="'20'">
              </label>

              <div class="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-3">
                <div class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.CREATE.URGENCY' | translate }}</div>
                <div class="mt-2 text-[0.8rem] font-black" [ngClass]="selectedUrgency === 'critical' ? 'text-rose-700' : 'text-orange-700'">
                  {{ selectedUrgency === 'critical' ? ('OFFERS.FILTERS.URGENCY_CRITICAL' | translate) : ('OFFERS.FILTERS.URGENCY_WARNING' | translate) }}
                </div>
              </div>

              @if (selectedProduct; as product) {
                <div class="md:col-span-2 grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-4">
                  <div>
                    <div class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.CREATE.CURRENT_PRICE' | translate }}</div>
                    <div class="mt-1 text-[0.84rem] font-black text-slate-900">{{ product.sellingPrice | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}</div>
                  </div>
                  <div>
                    <div class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.CREATE.COMPARE_PRICE' | translate }}</div>
                    <div class="mt-1 text-[0.84rem] font-black text-zadna-primary">{{ previewCompareAtPrice | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}</div>
                  </div>
                  <div>
                    <div class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.CREATE.CURRENT_STOCK' | translate }}</div>
                    <div class="mt-1 text-[0.84rem] font-black text-slate-900">{{ product.stockQty }}</div>
                  </div>
                  <div>
                    <div class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.SAVINGS_LABEL' | translate }}</div>
                    <div class="mt-1 text-[0.84rem] font-black text-emerald-700">{{ previewSavings | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}</div>
                  </div>
                </div>
              }
            </form>
          }
        </div>

        <div footer>
          <div class="text-[0.72rem] font-bold text-slate-400">
            {{ 'OFFERS.CREATE.MODAL_HELP' | translate }}
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <app-button variant="ghost" (btnClick)="handleClose()">
              {{ 'COMMON.CANCEL' | translate }}
            </app-button>
            <app-button [disabled]="form.invalid || !selectedProduct" (btnClick)="submit()">
              {{ 'OFFERS.CREATE.SAVE_CLEARANCE' | translate }}
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

    .offer-input:focus {
      border-color: rgb(45 212 191 / 0.35);
      background: white;
      box-shadow: 0 0 0 4px rgb(45 212 191 / 0.08);
    }
  `]
})
export class ClearanceOfferModalComponent {

  get mappedProductOptions(): SearchableSelectOption[] {
    return this.products.map((x: any) => ({
      value: x.id,
      label: (this.currentLang === 'ar' ? x.nameAr : x.nameEn) + ' - ' + x.stockQty
    }));
  }

  @Input() isOpen = false;
  @Input() products: VendorProduct[] = [];
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<CreateClearanceOfferPayload>();

  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService
  ) {
    this.form = this.fb.nonNullable.group({
      productId: ['', Validators.required],
      discountPercentage: this.fb.nonNullable.control(20, [Validators.required, Validators.min(5), Validators.max(90)])
    });
  }

  get currentLang(): string {
    return this.translate.currentLang || 'ar';
  }

  get selectedProduct(): VendorProduct | undefined {
    return this.products.find((product) => product.id === this.form.controls.productId.value);
  }

  get selectedUrgency(): 'critical' | 'warning' {
    return (this.selectedProduct?.stockQty || 0) <= 5 ? 'critical' : 'warning';
  }

  get previewCompareAtPrice(): number {
    if (!this.selectedProduct) {
      return 0;
    }

    const discount = this.form.controls.discountPercentage.value || 0;
    const compareAtPrice = this.selectedProduct.sellingPrice / (1 - discount / 100);
    return Number(compareAtPrice.toFixed(2));
  }

  get previewSavings(): number {
    if (!this.selectedProduct) {
      return 0;
    }

    return Number(Math.max(this.previewCompareAtPrice - this.selectedProduct.sellingPrice, 0).toFixed(2));
  }

  submit(): void {
    if (this.form.invalid || !this.selectedProduct) {
      this.form.markAllAsTouched();
      return;
    }

    this.saved.emit({
      productId: this.selectedProduct.id,
      nameAr: this.selectedProduct.nameAr,
      nameEn: this.selectedProduct.nameEn,
      imageUrl: this.selectedProduct.imageUrl,
      categoryNameAr: this.selectedProduct.categoryNameAr,
      categoryNameEn: this.selectedProduct.categoryNameEn,
      sellingPrice: this.selectedProduct.sellingPrice,
      compareAtPrice: this.previewCompareAtPrice,
      discountPercentage: this.form.controls.discountPercentage.value,
      stockQty: this.selectedProduct.stockQty,
      savingsValue: this.previewSavings,
      urgency: this.selectedUrgency
    });
    this.resetForm();
  }

  handleClose(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.form.reset({
      productId: '',
      discountPercentage: 20
    });
  }
}
