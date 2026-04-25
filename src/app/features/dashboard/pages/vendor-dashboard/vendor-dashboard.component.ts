import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MasterProductSelectorModalComponent } from '../../../products/components/master-product-selector-modal/master-product-selector-modal.component';
import { AddProductModalComponent } from '../../../products/components/add-product-modal/add-product-modal.component';
import { Subscription } from 'rxjs';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { MasterProduct } from '../../../products/models/catalog.models';
import { CatalogService } from '../../../products/services/catalog.service';
import { VendorDashboardQuickActionAccent, VendorDashboardSnapshot } from '../../models/vendor-dashboard.models';
import { VendorDashboardService } from '../../services/vendor-dashboard.service';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule, MasterProductSelectorModalComponent, AddProductModalComponent, AppPanelHeaderComponent, AppPageHeaderComponent],
  templateUrl: './vendor-dashboard.component.html',
  styleUrl: './vendor-dashboard.component.scss'
})
export class VendorDashboardComponent implements OnInit, OnDestroy {
  currentLang: string = 'ar';
  private langSub: Subscription;

  // Modal States
  isSelectorModalOpen = false;
  isPricingModalOpen = false;
  selectedMasterProduct: MasterProduct | null = null;
  metrics: VendorDashboardSnapshot['metrics'] = [];
  checklist: VendorDashboardSnapshot['checklist'] = [];
  quickActions: VendorDashboardSnapshot['quickActions'] = [];
  timeline: VendorDashboardSnapshot['timeline'] = [];
  isLoadingDashboard = false;
  dashboardError = '';
  private dashboardSub?: Subscription;

  constructor(
    private readonly translate: TranslateService,
    private readonly catalogService: CatalogService,
    private readonly dashboardService: VendorDashboardService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe(event => this.currentLang = event.lang);
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
    this.dashboardSub?.unsubscribe();
  }

  private loadDashboard(): void {
    this.isLoadingDashboard = true;
    this.dashboardError = '';
    this.dashboardSub = this.dashboardService.getSnapshot().subscribe({
      next: (dashboardSnapshot) => {
        this.metrics = dashboardSnapshot.metrics;
        this.checklist = dashboardSnapshot.checklist;
        this.quickActions = dashboardSnapshot.quickActions;
        this.timeline = dashboardSnapshot.timeline;
        this.isLoadingDashboard = false;
      },
      error: () => {
        this.dashboardError = 'تعذر تحميل لوحة التحكم من الخادم.';
        this.isLoadingDashboard = false;
      }
    });
  }

  readonly actionCardClassMap: Record<VendorDashboardQuickActionAccent, string[]> = {
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

  getActionCardClasses(accent: VendorDashboardQuickActionAccent): string[] {
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

  onPricingConfirm(event: { sellingPrice: number, stockQuantity: number, discountPercentage: number }): void {
    if (!this.selectedMasterProduct) return;

    const request = {
      masterProductId: this.selectedMasterProduct.id,
      sellingPrice: event.sellingPrice,
      stockQty: event.stockQuantity,
      compareAtPrice: this.catalogService.calculateCompareAtPrice(event.sellingPrice, event.discountPercentage)
    };

    this.catalogService.addToStore(request).subscribe({
      next: () => {
        // Success feedback
        this.translate.get('COMMON.SUCCESS').subscribe(msg => alert(msg));
        this.closeAllModals();
      },
      error: () => {
        this.translate.get('COMMON.ERROR').subscribe(msg => alert(msg));
      }
    });
  }

  closeAllModals(): void {
    this.isSelectorModalOpen = false;
    this.isPricingModalOpen = false;
    this.selectedMasterProduct = null;
  }



}
