import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SearchableSelectComponent } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { AppEmptyStateComponent } from '../../../../shared/components/ui/data-display/empty-state/empty-state.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';
import { AlertsCenterService } from '../../../alerts/services/alerts-center.service';
import {
 VendorDisputeListItemVm,
 VendorDisputePriority,
 VendorDisputeStatus,
 VendorDisputeType
} from '../../models/vendor-disputes.models';
import { VendorDisputesService } from '../../services/vendor-disputes.service';
import {
 getVendorDisputeCompensationLabel,
 getVendorDisputeDisplayState,
 getVendorDisputeSettlementClass,
 getVendorDisputeSettlementLabel,
 normalizeVendorDisputePriority,
 normalizeVendorDisputeStatus,
 normalizeVendorDisputeType
} from '../../utils/vendor-dispute-display.utils';

@Component({
 changeDetection: ChangeDetectionStrategy.OnPush,
 selector: 'app-vendor-disputes-list',
 standalone: true,
 imports: [
 CommonModule,
 FormsModule,
 RouterModule,
 TranslateModule,
 SearchableSelectComponent,
 AppPageHeaderComponent,
 AppPanelHeaderComponent,
 AppPaginationComponent,
 AppEmptyStateComponent
 ],
 templateUrl: './vendor-disputes-list.component.html'
})
export class VendorDisputesListComponent implements OnInit, OnDestroy {
 private readonly cdr = inject(ChangeDetectorRef);
 currentLang = 'ar';
 isLoading = true;
 disputes: VendorDisputeListItemVm[] = [];

 filters = {
 search: '',
 status: 'all',
 type: 'all'
 };

 currentPage = 1;
 pageSize = 10;
 totalCount = 0;
 totalPages = 1;

 private langSub: Subscription;
 private dataSub?: Subscription;
 private readonly searchTerm$ = new Subject<string>();
 private searchSub?: Subscription;
 private alertsSub?: Subscription;

 constructor(
 private readonly disputesService: VendorDisputesService,
 private readonly translate: TranslateService,
 private readonly route: ActivatedRoute,
 private readonly alertsCenterService: AlertsCenterService
 ) {
 this.currentLang = this.translate.currentLang || 'ar';
 this.langSub = this.translate.onLangChange.subscribe((event) => {
 this.cdr.markForCheck();
 this.currentLang = event.lang;
 });
 this.searchSub = this.searchTerm$.pipe(
 debounceTime(300),
 distinctUntilChanged()
 ).subscribe(() => {
 this.cdr.markForCheck();
 this.currentPage = 1;
 this.loadDisputes();
 });
 }

 ngOnInit(): void {
 this.applyQueryParams();
 this.loadDisputes();
 this.alertsSub = this.alertsCenterService.getRealtimeAlerts().subscribe((alert) => {
 this.cdr.markForCheck();
 if (alert.route.startsWith('/disputes')) {
 this.loadDisputes();
 }
 });
 }

 ngOnDestroy(): void {
 this.langSub.unsubscribe();
 this.dataSub?.unsubscribe();
 this.searchSub?.unsubscribe();
 this.alertsSub?.unsubscribe();
 }

 get openCount(): number {
 return this.disputes.filter((item) =>!['resolved', 'rejected'].includes(this.normalizeStatus(item.status))).length;
 }

 get respondedCount(): number {
 return this.disputes.filter((item) =>!!item.vendorResponse?.trim()).length;
 }

 get waitingResponseCount(): number {
 return this.disputes.filter((item) => this.normalizeRole(item.waitingOnRole) === 'vendor').length;
 }

 onFiltersChange(): void {
 this.currentPage = 1;
 this.loadDisputes();
 }

 onSearchChange(value: string): void {
 this.filters.search = value;
 this.searchTerm$.next(value.trim());
 }

 resetFilters(): void {
 this.filters.search = '';
 this.filters.status = 'all';
 this.filters.type = 'all';
 this.currentPage = 1;
 this.loadDisputes();
 }

 onPageChange(page: number): void {
 this.currentPage = page;
 this.loadDisputes();
 }

 formatDateTime(value: string): string {
 return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-SA' : 'en-US', { timeZone: 'Asia/Riyadh',
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 hour: 'numeric',
 minute: '2-digit'
 }).format(new Date(value));
 }

 statusKey(status: VendorDisputeStatus | string): string {
 return `VENDOR_DISPUTES.STATUS.${this.normalizeStatus(status).toUpperCase()}`;
 }

 typeKey(type: VendorDisputeType | string): string {
 return `VENDOR_DISPUTES.TYPE.${this.normalizeType(type).toUpperCase()}`;
 }

 priorityKey(priority: VendorDisputePriority | string): string {
 return `VENDOR_DISPUTES.PRIORITY.${this.normalizePriority(priority).toUpperCase()}`;
 }

 statusClass(status: VendorDisputeStatus | string): string {
 return getVendorDisputeDisplayState(
 {
 type: 'complaint',
 status,
 settlementStatus: null,
 compensationType: null,
 message: ''
 },
 this.currentLang
 ).displayStatusClass;
 }

 displayStatusLabel(dispute: VendorDisputeListItemVm): string {
 return getVendorDisputeDisplayState(dispute, this.currentLang).displayStatusLabel;
 }

 displayTypeLabel(dispute: VendorDisputeListItemVm): string {
 return getVendorDisputeDisplayState(dispute, this.currentLang).displayTypeLabel;
 }

 displayTypeMetaLabel(dispute: VendorDisputeListItemVm): string {
 return getVendorDisputeDisplayState(dispute, this.currentLang).displayTypeMetaLabel;
 }

 priorityClass(priority: VendorDisputePriority | string): string {
 switch (this.normalizePriority(priority)) {
 case 'critical':
 return 'border-rose-200 bg-rose-50 text-rose-700';
 case 'high':
 return 'border-amber-200 bg-amber-50 text-amber-700';
 case 'medium':
 return 'border-sky-200 bg-sky-50 text-sky-700';
 default:
 return 'border-slate-200 bg-slate-100 text-slate-600';
 }
 }

 settlementLabel(value: string | null): string {
 return getVendorDisputeSettlementLabel(value, this.currentLang);
 }

 settlementClass(value: string | null): string {
 return getVendorDisputeSettlementClass(value);
 }

 compensationLabel(value: string | null): string {
 return getVendorDisputeCompensationLabel(value, this.currentLang);
 }

 isReturnRequest(dispute: VendorDisputeListItemVm): boolean {
 return this.normalizeType(dispute.type) === 'return_request';
 }

 private loadDisputes(): void {
 this.isLoading = true;
 this.dataSub?.unsubscribe();

 this.dataSub = this.disputesService.getDisputes({
 search: this.filters.search,
 status: this.toApiStatus(this.filters.status),
 type: this.toApiType(this.filters.type),
 page: this.currentPage,
 pageSize: this.pageSize
 }).subscribe({
 next: (response) => {
 this.cdr.markForCheck();
 this.disputes = response.items;
 this.currentPage = response.page;
 this.pageSize = response.pageSize;
 this.totalCount = response.total;
 this.totalPages = Math.max(1, Math.ceil(response.total / response.pageSize));
 this.isLoading = false;
 },
 error: () => {
 this.cdr.markForCheck();
 this.disputes = [];
 this.totalCount = 0;
 this.totalPages = 1;
 this.isLoading = false;
 }
 });
 }

 private normalizeType(value: string): string {
 return normalizeVendorDisputeType(value);
 }

 private normalizeStatus(value: string): string {
 return normalizeVendorDisputeStatus(value);
 }

 private normalizePriority(value: string): string {
 return normalizeVendorDisputePriority(value);
 }

 waitingLabelKey(waitingOnRole: string | null): string {
 switch (this.normalizeRole(waitingOnRole)) {
 case 'vendor':
 return 'VENDOR_DISPUTES.WAITING_ON.VENDOR';
 case 'customer':
 return 'VENDOR_DISPUTES.WAITING_ON.CUSTOMER';
 case 'driver':
 return 'VENDOR_DISPUTES.WAITING_ON.DRIVER';
 case 'admin':
 return 'VENDOR_DISPUTES.WAITING_ON.ADMIN';
 default:
 return 'VENDOR_DISPUTES.WAITING_ON.REVIEW';
 }
 }

 shouldShowWaitingOn(dispute: VendorDisputeListItemVm): boolean {
 const status = this.normalizeStatus(dispute.status);
 return status!== 'resolved' && status!== 'rejected' && this.normalizeRole(dispute.waitingOnRole).length > 0;
 }

 private normalizeRole(value: string | null | undefined): string {
 return value?.trim().toLowerCase() ?? '';
 }

 private toApiStatus(value: string): string | undefined {
 switch (value) {
 case 'submitted':
 return 'Submitted';
 case 'in_review':
 return 'InReview';
 case 'awaiting_customer_evidence':
 return 'AwaitingCustomerEvidence';
 case 'approved':
 return 'Approved';
 case 'rejected':
 return 'Rejected';
 case 'resolved':
 return 'Resolved';
 default:
 return undefined;
 }
 }

 private toApiType(value: string): string | undefined {
 switch (value) {
 case 'complaint':
 return 'Complaint';
 case 'return_request':
 return 'ReturnRequest';
 case 'driver_report':
 return 'DriverReport';
 case 'driver_dispute':
 return 'DriverDispute';
 default:
 return undefined;
 }
 }

 private applyQueryParams(): void {
 const params = this.route.snapshot.queryParamMap;
 const status = params.get('status');
 const type = params.get('type');

 if (status) {
 this.filters.status = status;
 }

 if (type) {
 this.filters.type = type;
 }
 }
}
