import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MasterProductSelectorModalComponent } from '../../../products/components/master-product-selector-modal/master-product-selector-modal.component';
import { AddProductModalComponent } from '../../../products/components/add-product-modal/add-product-modal.component';
import { CatalogService, MasterProduct } from '../../../../services/catalog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule, MasterProductSelectorModalComponent, AddProductModalComponent],
  templateUrl: './vendor-dashboard.component.html',
  styleUrl: './vendor-dashboard.component.scss'
})
export class VendorDashboardComponent implements OnDestroy {
  currentLang: string = 'ar';
  private langSub: Subscription;

  // Modal States
  isSelectorModalOpen = false;
  isPricingModalOpen = false;
  selectedMasterProduct: MasterProduct | null = null;

  constructor(
    private readonly translate: TranslateService,
    private readonly catalogService: CatalogService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe(event => this.currentLang = event.lang);
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
  }

  readonly actionCardClassMap: Record<string, string[]> = {
    warm: [
      'border-orange-200',
      'bg-[linear-gradient(180deg,rgba(255,243,230,0.95),rgba(255,255,255,0.96))]'
    ],
    soft: [
      'border-slate-200',
      'bg-[linear-gradient(180deg,rgba(247,250,252,0.96),rgba(255,255,255,0.94))]'
    ],
    dark: [
      'border-slate-700',
      'bg-[linear-gradient(180deg,rgba(30,41,59,0.96),rgba(15,23,42,0.98))]',
      'text-white'
    ]
  };

  readonly metrics = [
    { value: 'EGP 128K', labelKey: 'DASHBOARD.TOTAL_SALES', noteKey: 'DASHBOARD.TOTAL_SALES_NOTE' },
    { value: '18', labelKey: 'DASHBOARD.ACTIVE_OFFERS', noteKey: 'DASHBOARD.ACTIVE_OFFERS_NOTE' },
    { value: '24', labelKey: 'DASHBOARD.PENDING_ORDERS', noteKey: 'DASHBOARD.PENDING_ORDERS_NOTE' }
  ];

  readonly checklist = [
    {
      titleKey: 'DASHBOARD.CHECKLIST.CONFIRM_ORDERS_TITLE',
      bodyKey: 'DASHBOARD.CHECKLIST.CONFIRM_ORDERS_BODY',
    },
    {
      titleKey: 'DASHBOARD.CHECKLIST.LOW_STOCK_TITLE',
      bodyKey: 'DASHBOARD.CHECKLIST.LOW_STOCK_BODY',
    },
    {
      titleKey: 'DASHBOARD.CHECKLIST.REFRESH_OFFERS_TITLE',
      bodyKey: 'DASHBOARD.CHECKLIST.REFRESH_OFFERS_BODY',
    }
  ];

  readonly quickActions = [
    {
      titleKey: 'DASHBOARD.ADD_PRODUCTS',
      bodyKey: 'DASHBOARD.ADD_PRODUCTS_DESC',
      accent: 'warm'
    },
    {
      titleKey: 'DASHBOARD.TRACK_SHIPMENTS',
      bodyKey: 'DASHBOARD.TRACK_SHIPMENTS_DESC',
      accent: 'soft'
    },
    {
      titleKey: 'DASHBOARD.ADJUST_HOURS',
      bodyKey: 'DASHBOARD.ADJUST_HOURS_DESC',
      accent: 'dark'
    }
  ];

  readonly timeline = [
    {
      time: '09:15',
      titleKey: 'DASHBOARD.TIMELINE.RAMADAN_CAMPAIGN'
    },
    {
      time: '10:00',
      titleKey: 'DASHBOARD.TIMELINE.NEW_ORDERS'
    },
    {
      time: '11:30',
      titleKey: 'DASHBOARD.TIMELINE.LOW_INVENTORY'
    }
  ];

  getActionCardClasses(accent: string): string[] {
    return this.actionCardClassMap[accent] ?? this.actionCardClassMap['soft'];
  }

  // --- Modal Workflow ---
  
  onAddProductClick(): void {
    this.isSelectorModalOpen = true;
  }

  onProductSelected(product: MasterProduct): void {
    this.selectedMasterProduct = product;
    this.isSelectorModalOpen = false;
    this.isPricingModalOpen = true;
  }

  onPricingConfirm(event: { sellingPrice: number, stockQuantity: number }): void {
    if (!this.selectedMasterProduct) return;

    const request = {
      masterProductId: this.selectedMasterProduct.id,
      sellingPrice: event.sellingPrice,
      stockQty: event.stockQuantity
    };

    this.catalogService.addToStore(request).subscribe({
      next: () => {
        // Success feedback (using alert for now per previous code)
        alert(this.currentLang === 'ar' ? 'تمت إضافة المنتج بنجاح!' : 'Product added successfully!');
        this.closeAllModals();
      },
      error: () => {
        alert(this.currentLang === 'ar' ? 'حدث خطأ أثناء الإضافة' : 'Error adding product');
      }
    });
  }

  closeAllModals(): void {
    this.isSelectorModalOpen = false;
    this.isPricingModalOpen = false;
    this.selectedMasterProduct = null;
  }



}
