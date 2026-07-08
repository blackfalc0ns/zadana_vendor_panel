import { CommonModule, NgClass } from '@angular/common';
import {
 AfterViewChecked,
 ChangeDetectionStrategy,
 ChangeDetectorRef,
 Component,
 DoCheck,
 ElementRef,
 NgZone,
 OnDestroy,
 OnInit,
 ViewChild,
 inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { PhoneInputComponent } from '../../../../shared/components/ui/form-controls/phone-input/phone-input.component';
import { Subscription, combineLatest, forkJoin } from 'rxjs';
import { SelectOption } from '../../../auth/constants/vendor-onboarding.constants';
import { GeographyService, SaudiCityDto, SaudiRegionDto } from '../../../auth/services/geography.service';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';
import { AppFlashBannerComponent } from '../../../../shared/components/ui/feedback/flash-banner/flash-banner.component';
import { AppFilterPanelComponent } from '../../../../shared/components/ui/layout/filter-panel/filter-panel.component';
import { AppPageSectionShellComponent } from '../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';
import {
 BranchCreationInput,
 BranchOperatingHourVm,
 BranchStatus,
 BranchVm,
 EmployeeStatus,
 EmployeeVm,
 InvitationStatus,
 InvitationType,
 InvitationVm,
 PermissionAction,
 PermissionActionOption,
 PermissionMatrixVm,
 PermissionModuleConfig,
 RoleTemplate,
 ROLE_TEMPLATE_OPTIONS,
 STAFF_PERMISSION_ACTIONS,
 STAFF_PERMISSION_MODULES,
 StaffView,
 cloneOperatingHours,
 clonePermissionMatrix,
 createRoleTemplatePermissions,
 defaultOperatingHours
} from '../../models/staff-branches.models';
import { StaffBranchesService } from '../../services/staff-branches.service';
import { VendorAccessService } from '../../../../core/auth/services/vendor-access.service';
import {
 BranchFilters,
 BranchWizardDraft,
 EmployeeFilters,
 EmployeeModalDraft,
 InvitationFilters
} from './staff-branches.page.models';

@Component({
 changeDetection: ChangeDetectionStrategy.OnPush,
 selector: 'app-staff-branches-page',
 standalone: true,
 imports: [
 CommonModule,
 FormsModule,
 RouterModule,
 TranslateModule,
 NgClass,
 AppPageHeaderComponent,
 AppPaginationComponent,
 AppFlashBannerComponent,
 AppFilterPanelComponent,
 AppPageSectionShellComponent,
 SearchableSelectComponent,
 PhoneInputComponent
 ],
 templateUrl: './staff-branches.page.html'
})
export class StaffBranchesPageComponent implements OnInit, DoCheck, AfterViewChecked, OnDestroy {
 private readonly cdr = inject(ChangeDetectorRef);
 private readonly ngZone = inject(NgZone);

 @ViewChild('branchLocationMap') private branchLocationMap?: ElementRef<HTMLDivElement>;

 get mappedActiveBranchOptions(): SearchableSelectOption[] {
 return [
 {value: 'all', labelKey: 'STAFF_BRANCHES.FILTERS.ALL_BRANCHES'},...this.activeBranchOptions.map((x: any) => ({value: x.id, label: x.name}))
 ];
 }

 get branchStatusFilterOptions(): SearchableSelectOption[] {
 return [
 { value: 'all', labelKey: 'STAFF_BRANCHES.FILTERS.ALL_STATUSES' },
 { value: 'active', labelKey: 'STAFF_BRANCHES.STATUSES.BRANCH_ACTIVE' },
 { value: 'pending', labelKey: 'STAFF_BRANCHES.STATUSES.BRANCH_PENDING' },
 { value: 'suspended', labelKey: 'STAFF_BRANCHES.STATUSES.BRANCH_SUSPENDED' },
 { value: 'archived', labelKey: 'STAFF_BRANCHES.STATUSES.BRANCH_ARCHIVED' }
 ];
 }

 get branchCityFilterOptions(): SearchableSelectOption[] {
 return [
 { value: '', labelKey: 'STAFF_BRANCHES.FILTERS.ALL_CITIES' },...this.branchCityOptions
 ];
 }

 get branchManagerFilterOptions(): SearchableSelectOption[] {
 return [
 { value: '', labelKey: 'STAFF_BRANCHES.FILTERS.ALL_MANAGERS' },...this.branchManagerOptions
 ];
 }

 get employeeStatusFilterOptions(): SearchableSelectOption[] {
 return [
 { value: 'all', labelKey: 'STAFF_BRANCHES.FILTERS.ALL_STATUSES' },
 { value: 'active', labelKey: 'STAFF_BRANCHES.STATUSES.EMPLOYEE_ACTIVE' },
 { value: 'invited', labelKey: 'STAFF_BRANCHES.STATUSES.EMPLOYEE_INVITED' },
 { value: 'suspended', labelKey: 'STAFF_BRANCHES.STATUSES.EMPLOYEE_SUSPENDED' }
 ];
 }

 get employeeRoleTemplateFilterOptions(): SearchableSelectOption[] {
 return [
 { value: 'all', labelKey: 'STAFF_BRANCHES.FILTERS.ALL_TEMPLATES' },...this.roleTemplates
 ];
 }

 get invitationStatusFilterOptions(): SearchableSelectOption[] {
 return [
 { value: 'all', labelKey: 'STAFF_BRANCHES.FILTERS.ALL_STATUSES' },
 { value: 'pending', labelKey: 'STAFF_BRANCHES.STATUSES.INVITATION_PENDING' },
 { value: 'accepted', labelKey: 'STAFF_BRANCHES.STATUSES.INVITATION_ACCEPTED' },
 { value: 'expired', labelKey: 'STAFF_BRANCHES.STATUSES.INVITATION_EXPIRED' },
 { value: 'revoked', labelKey: 'STAFF_BRANCHES.STATUSES.INVITATION_REVOKED' },
 { value: 'delivery_failed', labelKey: 'STAFF_BRANCHES.STATUSES.INVITATION_DELIVERY_FAILED' }
 ];
 }

 get invitationTypeFilterOptions(): SearchableSelectOption[] {
 return [
 { value: 'all', labelKey: 'STAFF_BRANCHES.FILTERS.ALL_TYPES' },
 { value: 'branch_manager', labelKey: 'STAFF_BRANCHES.INVITATION_TYPES.BRANCH_MANAGER' },
 { value: 'employee', labelKey: 'STAFF_BRANCHES.INVITATION_TYPES.EMPLOYEE' }
 ];
 }

 get branchKindOptions(): SearchableSelectOption[] {
 return [
 { value: 'branch', labelKey: 'STAFF_BRANCHES.BRANCH_TYPES.BRANCH' },
 { value: 'primary', labelKey: 'STAFF_BRANCHES.BRANCH_TYPES.PRIMARY' }
 ];
 }

 currentLang = 'ar';
 activeView: StaffView = 'branches';
 isFiltersExpanded = false;

 branches: BranchVm[] = [];
 employees: EmployeeVm[] = [];
 invitations: InvitationVm[] = [];

 regions: SelectOption[] = [];
 cities: SelectOption[] = [];
 private regionDirectory: SaudiRegionDto[] = [];
 private cityDirectory: SaudiCityDto[] = [];
 readonly roleTemplates = ROLE_TEMPLATE_OPTIONS;
 readonly permissionModules: PermissionModuleConfig[] = STAFF_PERMISSION_MODULES;
 readonly permissionActions: PermissionActionOption[] = STAFF_PERMISSION_ACTIONS;
 readonly branchWizardSteps = [
 'STAFF_BRANCHES.BRANCH_WIZARD.STEPS.INFO',
 'STAFF_BRANCHES.BRANCH_WIZARD.STEPS.LOCATION',
 'STAFF_BRANCHES.BRANCH_WIZARD.STEPS.MANAGER'
 ];

 readonly branchFilters: BranchFilters = {
 search: '',
 status: 'all',
 city: '',
 manager: ''
 };

 readonly employeeFilters: EmployeeFilters = {
 search: '',
 status: 'all',
 roleTemplate: 'all',
 branchId: 'all'
 };

 readonly invitationFilters: InvitationFilters = {
 search: '',
 status: 'all',
 type: 'all',
 branchId: 'all'
 };

 isBranchWizardOpen = false;
 branchWizardStep = 1;
 branchDraft = this.createEmptyBranchDraft();
 readonly pageSize = 10;
 private readonly currentPages: Record<StaffView, number> = {
 branches: 1,
 employees: 1,
 invitations: 1
 };

 isEmployeeModalOpen = false;
 editingEmployee: EmployeeVm | null = null;
 employeeDraft = this.createEmptyEmployeeDraft();

 flashMessage = '';
 flashTone: 'success' | 'info' = 'success';

 private langSub: Subscription;
 private dataSub?: Subscription;
 private routeSub?: Subscription;
 private geographySub?: Subscription;
 private branchLocationLeafletMap: L.Map | null = null;
 private branchLocationMarker: L.Marker | null = null;
 private branchDeliveryRadiusCircle: L.Circle | null = null;
 private branchLocationMapElement: HTMLElement | null = null;
 private static leafletDefaultIconConfigured = false;
 private readonly defaultBranchMapView = {
 lat: 24.7136,
 lng: 46.6753,
 zoom: 6
 };
 private lastFilterSignatures: Record<StaffView, string> = {
 branches: '',
 employees: '',
 invitations: ''
 };

 constructor(
 private readonly route: ActivatedRoute,
 private readonly router: Router,
 private readonly staffBranchesService: StaffBranchesService,
 private readonly vendorAccessService: VendorAccessService,
 private readonly translate: TranslateService,
 private readonly geographyService: GeographyService
 ) {
 this.currentLang = this.translate.currentLang || 'ar';
 this.langSub = this.translate.onLangChange.subscribe((event) => {
 this.cdr.markForCheck();
 this.currentLang = event.lang;
 this.refreshGeographyLabels();
 if (this.flashMessage) {
 this.flashMessage = '';
 }
 });
 }

 ngOnInit(): void {
 this.loadGeographyOptions();

 this.dataSub = combineLatest([
 this.staffBranchesService.getBranches(),
 this.staffBranchesService.getEmployees(),
 this.staffBranchesService.getInvitations()
 ]).subscribe(([branches, employees, invitations]) => {
 this.cdr.markForCheck();
 this.branches = branches;
 this.employees = employees;
 this.invitations = invitations;
 });

 this.routeSub = this.route.queryParamMap.subscribe((params) => {
 this.cdr.markForCheck();

 const view = params.get('view');
 if (view === 'branches' || view === 'employees' || view === 'invitations') {
 if (this.activeView!== view) {
 this.activeView = view;
 }
 }

 const action = params.get('action');

 if (action === 'branch') {
 this.activeView = 'branches';
 this.openBranchWizard();
 this.clearActionQueryParam('branches');
 } else if (action === 'employee') {
 this.activeView = 'employees';
 this.openEmployeeInvite();
 this.clearActionQueryParam('employees');
 }
 });
 }

 ngOnDestroy(): void {
 this.destroyBranchLocationMap();
 this.langSub.unsubscribe();
 this.dataSub?.unsubscribe();
 this.routeSub?.unsubscribe();
 this.geographySub?.unsubscribe();
 }

 ngAfterViewChecked(): void {
 if (this.isBranchWizardOpen && this.branchWizardStep === 2) {
 this.ensureBranchLocationMap();
 return;
 }

 this.destroyBranchLocationMap();
 }

 ngDoCheck(): void {
 this.syncFilterSignature('branches', this.branchFilters);
 this.syncFilterSignature('employees', this.employeeFilters);
 this.syncFilterSignature('invitations', this.invitationFilters);
 }

 get primaryViewTabs(): Array<Record<string, unknown>> {
 return [
 {
 id: 'branches',
 label: `${this.translate.instant('STAFF_BRANCHES.VIEWS.BRANCHES')} · ${this.filteredBranches.length}`,
 translateLabel: false
 },
 {
 id: 'employees',
 label: `${this.translate.instant('STAFF_BRANCHES.VIEWS.EMPLOYEES')} · ${this.filteredEmployees.length}`,
 translateLabel: false
 }
 ];
 }

 get primaryViewValue(): string {
 return this.activeView === 'branches' || this.activeView === 'employees'
 ? this.activeView
 : '';
 }

 get activePanelTitle(): string {
 switch (this.activeView) {
 case 'employees':
 return 'STAFF_BRANCHES.SECTIONS.EMPLOYEES_TITLE';
 case 'invitations':
 return 'STAFF_BRANCHES.SECTIONS.INVITATIONS_TITLE';
 default:
 return 'STAFF_BRANCHES.SECTIONS.BRANCHES_TITLE';
 }
 }

 get activePanelSubtitle(): string {
 switch (this.activeView) {
 case 'employees':
 return 'STAFF_BRANCHES.SECTIONS.EMPLOYEES_SUBTITLE';
 case 'invitations':
 return 'STAFF_BRANCHES.SECTIONS.INVITATIONS_SUBTITLE';
 default:
 return 'STAFF_BRANCHES.SECTIONS.BRANCHES_SUBTITLE';
 }
 }

 get pendingInvitationsCount(): number {
 return this.invitations.filter((invitation) => invitation.status === 'pending').length;
 }

 get invitationsToggleLabel(): string {
 return `${this.translate.instant('STAFF_BRANCHES.VIEWS.INVITATIONS')} · ${this.filteredInvitations.length}`;
 }

 get hasPrimaryBranch(): boolean {
 return this.branches.some((branch) => branch.isPrimary && branch.status!== 'archived');
 }

 get canManageBranchLifecycle(): boolean {
 return!this.vendorAccessService.hasScope('VendorPanel', 'VendorBranch');
 }

 get hasBranchLocationCoordinates(): boolean {
 return this.isLatitude(this.branchDraft.latitude) && this.isLongitude(this.branchDraft.longitude);
 }

 get branchWizardCityOptions(): SelectOption[] {
 const selectedRegion = this.branchDraft.region;
 const cities = selectedRegion
 ? this.cityDirectory.filter((city) => city.regionCode === selectedRegion)
 : this.cityDirectory;

 return cities.map((city) => this.toCityOption(city));
 }

 get branchLocationCoordinateText(): string {
 if (!this.hasBranchLocationCoordinates) {
 return '-';
 }

 return `${this.branchDraft.latitude?.toFixed(6)}, ${this.branchDraft.longitude?.toFixed(6)}`;
 }

 get isEditingEmployee(): boolean {
 return!!this.editingEmployee;
 }

 get canSubmitEmployeeModal(): boolean {
 if (this.isEditingEmployee) {
 return true;
 }

 return!!this.employeeDraft.fullName.trim()
 && this.isValidEmail(this.employeeDraft.contact)
 && this.employeeDraft.branchIds.length > 0;
 }

 get filteredBranches(): BranchVm[] {
 return this.branches.filter((branch) => {
 if (!this.matchesSearch(
 [
 branch.name,
 branch.code,
 branch.phone,
 branch.managerName,
 branch.managerContact
 ],
 this.branchFilters.search
 )) {
 return false;
 }

 if (this.branchFilters.status!== 'all' && branch.status!== this.branchFilters.status) {
 return false;
 }

 if (this.branchFilters.city && branch.city!== this.branchFilters.city) {
 return false;
 }

 if (this.branchFilters.manager && branch.managerName!== this.branchFilters.manager) {
 return false;
 }

 return true;
 });
 }

 get filteredEmployees(): EmployeeVm[] {
 return this.employees.filter((employee) => {
 if (!this.matchesSearch(
 [
 employee.fullName,
 employee.contact,
 this.translate.instant(employee.jobTitle)
 ],
 this.employeeFilters.search
 )) {
 return false;
 }

 if (this.employeeFilters.status!== 'all' && employee.status!== this.employeeFilters.status) {
 return false;
 }

 if (this.employeeFilters.roleTemplate!== 'all' && employee.roleTemplate!== this.employeeFilters.roleTemplate) {
 return false;
 }

 if (this.employeeFilters.branchId!== 'all' &&!employee.branchIds.includes(this.employeeFilters.branchId)) {
 return false;
 }

 return true;
 });
 }

 get filteredInvitations(): InvitationVm[] {
 return this.invitations.filter((invitation) => {
 if (!this.matchesSearch(
 [
 invitation.targetName,
 invitation.contact,
 this.translate.instant(this.invitationTypeKey(invitation.type))
 ],
 this.invitationFilters.search
 )) {
 return false;
 }

 if (this.invitationFilters.status!== 'all' && invitation.status!== this.invitationFilters.status) {
 return false;
 }

 if (this.invitationFilters.type!== 'all' && invitation.type!== this.invitationFilters.type) {
 return false;
 }

 if (this.invitationFilters.branchId!== 'all' &&!invitation.branchIds.includes(this.invitationFilters.branchId)) {
 return false;
 }

 return true;
 });
 }

 get pagedBranches(): BranchVm[] {
 return this.paginateItems(this.filteredBranches, 'branches');
 }

 get pagedEmployees(): EmployeeVm[] {
 return this.paginateItems(this.filteredEmployees, 'employees');
 }

 get pagedInvitations(): InvitationVm[] {
 return this.paginateItems(this.filteredInvitations, 'invitations');
 }

 get activeTotalCount(): number {
 if (this.activeView === 'branches') {
 return this.filteredBranches.length;
 }

 if (this.activeView === 'employees') {
 return this.filteredEmployees.length;
 }

 return this.filteredInvitations.length;
 }

 get activeTotalPages(): number {
 return this.totalPagesForCount(this.activeTotalCount);
 }

 get activeCurrentPage(): number {
 return this.getClampedPage(this.activeView, this.activeTotalCount);
 }

 get branchCityOptions(): Array<{ value: string; label: string }> {
 return this.uniqueOptions(
 this.branches.map((branch) => ({
 value: branch.city,
 label: this.optionLabel(this.cities, branch.city)
 }))
 );
 }

 get branchManagerOptions(): Array<{ value: string; label: string }> {
 return this.uniqueOptions(
 this.branches.map((branch) => {
 const managerName = this.normalizeOptionLabel(branch.managerName);
 return {
 value: managerName,
 label: managerName
 };
 })
 );
 }

 get activeBranchOptions(): BranchVm[] {
 return this.branches.filter((branch) => branch.status!== 'archived');
 }

 get hasActiveFilters(): boolean {
 if (this.activeView === 'branches') {
 return!!this.branchFilters.search.trim()
 || this.branchFilters.status!== 'all'
 ||!!this.branchFilters.city
 ||!!this.branchFilters.manager;
 }

 if (this.activeView === 'employees') {
 return!!this.employeeFilters.search.trim()
 || this.employeeFilters.status!== 'all'
 || this.employeeFilters.roleTemplate!== 'all'
 || this.employeeFilters.branchId!== 'all';
 }

 return!!this.invitationFilters.search.trim()
 || this.invitationFilters.status!== 'all'
 || this.invitationFilters.type!== 'all'
 || this.invitationFilters.branchId!== 'all';
 }

 setActiveView(view: string): void {
 const nextView = view as StaffView;
 if (this.activeView === nextView) {
 return;
 }

 this.activeView = nextView;
 this.syncViewQueryParam();
 this.cdr.markForCheck();
 }

 resetFilters(): void {
 this.branchFilters.search = '';
 this.branchFilters.status = 'all';
 this.branchFilters.city = '';
 this.branchFilters.manager = '';

 this.employeeFilters.search = '';
 this.employeeFilters.status = 'all';
 this.employeeFilters.roleTemplate = 'all';
 this.employeeFilters.branchId = 'all';

 this.invitationFilters.search = '';
 this.invitationFilters.status = 'all';
 this.invitationFilters.type = 'all';
 this.invitationFilters.branchId = 'all';

 this.currentPages.branches = 1;
 this.currentPages.employees = 1;
 this.currentPages.invitations = 1;
 }

 onPageChange(page: number): void {
 this.currentPages[this.activeView] = page;
 }

 openBranchWizard(): void {
 if (!this.canManageBranchLifecycle) {
 return;
 }

 this.branchDraft = this.createEmptyBranchDraft();
 this.applySelectedCityLocationIfMissing();
 this.branchWizardStep = 1;
 this.isBranchWizardOpen = true;
 }

 closeBranchWizard(): void {
 this.isBranchWizardOpen = false;
 this.destroyBranchLocationMap();
 }

 goToBranchWizardStep(step: number): void {
 this.branchWizardStep = step;
 }

 nextBranchWizardStep(): void {
 if (this.branchWizardStep < 3 && this.canMoveFromBranchWizardStep(this.branchWizardStep)) {
 this.branchWizardStep += 1;
 }
 }

 previousBranchWizardStep(): void {
 if (this.branchWizardStep > 1) {
 this.branchWizardStep -= 1;
 }
 }

 canMoveFromBranchWizardStep(step: number): boolean {
 if (step === 1) {
 const primaryChoiceInvalid = this.branchDraft.branchKind === 'primary' && this.hasPrimaryBranch;

 return!!this.branchDraft.name.trim()
 &&!!this.branchDraft.phone.trim()
 &&!!this.branchDraft.managerName.trim()
 &&!primaryChoiceInvalid;
 }

 if (step === 2) {
 return!!this.branchDraft.region
 &&!!this.branchDraft.city
 &&!!this.branchDraft.addressLine.trim()
 && this.branchDraft.deliveryRadiusKm > 0
 && this.hasBranchLocationCoordinates
 && this.branchDraft.operatingHours.some((hour) => hour.isOpen);
 }

 return!!this.branchDraft.managerName.trim() && this.isValidEmail(this.branchDraft.managerContact);
 }

 onBranchRegionChange(regionCode: string): void {
 this.branchDraft.region = regionCode;

 const currentCity = this.findSelectedCity();
 if (currentCity?.regionCode === regionCode) {
 this.applySelectedMapRange();
 return;
 }

 const firstRegionCity = this.cityDirectory.find((city) => city.regionCode === regionCode);
 if (firstRegionCity) {
 this.branchDraft.city = firstRegionCity.code;
 this.applySelectedMapRange();
 this.setBranchLocation(firstRegionCity.latitude, firstRegionCity.longitude, firstRegionCity.mapZoom || 13);
 return;
 }

 this.branchDraft.city = '';
 const region = this.regionDirectory.find((item) => item.code === regionCode);
 if (region) {
 this.applySelectedMapRange();
 this.setBranchLocation(region.latitude, region.longitude, region.mapZoom || 8);
 }
 }

 onBranchCityChange(cityCode: string): void {
 this.branchDraft.city = cityCode;
 this.applySelectedMapRange();
 this.selectBranchCityCenter();
 }

 selectBranchCityCenter(): void {
 const city = this.findSelectedCity();
 if (!city) {
 return;
 }

 this.branchDraft.region = city.regionCode || this.branchDraft.region;
 this.setBranchLocation(city.latitude, city.longitude, city.mapZoom || 13);
 }

 onBranchCoordinateInputChange(): void {
 if (!this.hasBranchLocationCoordinates) {
 this.cdr.markForCheck();
 return;
 }

 this.setBranchLocation(
 Number(this.branchDraft.latitude),
 Number(this.branchDraft.longitude),
 Math.max(this.branchLocationLeafletMap?.getZoom() ?? 13, 13)
 );
 }

 onBranchDeliveryRadiusChange(): void {
 this.updateBranchDeliveryRadiusCircle();
 }

 useCurrentBranchLocation(): void {
 if (!navigator.geolocation) {
 this.showFlash('ONBOARDING.MAP.GEO_UNSUPPORTED', 'info');
 return;
 }

 navigator.geolocation.getCurrentPosition(
 (position) => {
 this.ngZone.run(() => {
 this.setBranchLocation(position.coords.latitude, position.coords.longitude, 15);
 });
 },
 () => {
 this.ngZone.run(() => {
 this.showFlash('ONBOARDING.MAP.GEO_FAILED', 'info');
 });
 },
 {
 enableHighAccuracy: true,
 timeout: 12000,
 maximumAge: 0
 }
 );
 }

 submitBranchWizard(): void {
 if (!this.canMoveFromBranchWizardStep(3)) {
 return;
 }

 const input: BranchCreationInput = {
 name: this.branchDraft.name,
 code: this.branchDraft.code,
 isPrimary: this.branchDraft.branchKind === 'primary',
 phone: this.branchDraft.phone,
 managerName: this.branchDraft.managerName,
 managerContact: this.branchDraft.managerContact,
 region: this.branchDraft.region,
 city: this.branchDraft.city,
 addressLine: this.branchDraft.addressLine,
 latitude: this.branchDraft.latitude,
 longitude: this.branchDraft.longitude,
 deliveryRadiusKm: this.branchDraft.deliveryRadiusKm,
 operatingHours: cloneOperatingHours(this.branchDraft.operatingHours),
 inviteMessage: this.branchDraft.inviteMessage
 };

 this.staffBranchesService.createBranch(input).subscribe({
 next: () => {
 this.closeBranchWizard();
 this.showFlash('STAFF_BRANCHES.FEEDBACK.BRANCH_CREATED', 'success');
 this.cdr.markForCheck();
 },
 error: (error) => {
 this.closeBranchWizard();
 const message = error?.error?.message as string | undefined;
 this.showFlash(message || 'STAFF_BRANCHES.FEEDBACK.INVITATION_SEND_FAILED', 'info');
 this.cdr.markForCheck();
 }
 });
 }

 toggleBranchDay(hour: BranchOperatingHourVm, isOpen: boolean): void {
 hour.isOpen = isOpen;
 }

 openEmployeeInvite(): void {
 this.editingEmployee = null;
 this.employeeDraft = this.createEmptyEmployeeDraft();
 this.isEmployeeModalOpen = true;
 }

 openEmployeePermissions(employee: EmployeeVm): void {
 const defaultPermissions = createRoleTemplatePermissions(employee.roleTemplate);

 this.editingEmployee = employee;
 this.employeeDraft = {
 fullName: employee.fullName,
 contact: employee.contact,
 roleTemplate: employee.roleTemplate,
 branchIds: [...employee.branchIds],
 customizePermissions:!this.permissionMatrixMatches(employee.permissions, defaultPermissions),
 permissions: clonePermissionMatrix(employee.permissions)
 };
 this.isEmployeeModalOpen = true;
 }

 closeEmployeeModal(): void {
 this.isEmployeeModalOpen = false;
 this.editingEmployee = null;
 }

 selectEmployeeTemplate(template: RoleTemplate): void {
 this.employeeDraft.roleTemplate = template;
 this.employeeDraft.permissions = createRoleTemplatePermissions(template);
 }

 toggleEmployeeBranch(branchId: string, checked: boolean): void {
 if (checked) {
 this.employeeDraft.branchIds = [branchId];
 return;
 }

 this.employeeDraft.branchIds = this.employeeDraft.branchIds.filter((id) => id!== branchId);
 }

 onCustomizePermissionsChange(enabled: boolean): void {
 this.employeeDraft.customizePermissions = enabled;

 if (!enabled) {
 this.employeeDraft.permissions = createRoleTemplatePermissions(this.employeeDraft.roleTemplate);
 }
 }

 updatePermission(moduleId: string, action: PermissionAction, checked: boolean): void {
 const targetModule = moduleId as keyof PermissionMatrixVm;
 this.employeeDraft.permissions[targetModule][action] = checked;
 }

 submitEmployeeModal(): void {
 if (this.isEditingEmployee) {
 this.staffBranchesService.updateEmployeePermissions(
 this.editingEmployee!.id,
 this.employeeDraft.roleTemplate,
 this.employeeDraft.permissions
 ).subscribe({
 next: () => {
 this.closeEmployeeModal();
 this.showFlash('STAFF_BRANCHES.FEEDBACK.PERMISSIONS_UPDATED', 'success');
 this.cdr.markForCheck();
 },
 error: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_ACTION_FAILED', 'info');
 this.cdr.markForCheck();
 }
 });
 return;
 }

 if (!this.canSubmitEmployeeModal) {
 return;
 }

 this.staffBranchesService.inviteEmployee({
 fullName: this.employeeDraft.fullName,
 contact: this.employeeDraft.contact,
 roleTemplate: this.employeeDraft.roleTemplate,
 branchIds: [...this.employeeDraft.branchIds],
 permissions: clonePermissionMatrix(this.employeeDraft.permissions)
 }).subscribe({
 next: () => {
 this.closeEmployeeModal();
 this.activeView = 'invitations';
 this.syncViewQueryParam();
 this.showFlash('STAFF_BRANCHES.FEEDBACK.EMPLOYEE_INVITED', 'success');
 this.cdr.markForCheck();
 },
 error: (error) => {
 this.closeEmployeeModal();
 const code = error?.error?.code as string | undefined;
 const message = error?.error?.message as string | undefined;
 const feedbackKey = code === 'STAFF_ALREADY_EXISTS'
 ? 'STAFF_BRANCHES.ACCEPT.STAFF_ALREADY_EXISTS'
 : (message || 'STAFF_BRANCHES.FEEDBACK.INVITATION_SEND_FAILED');
 this.showFlash(feedbackKey, 'info');
 this.cdr.markForCheck();
 }
 });
 }

 toggleEmployeeStatus(employee: EmployeeVm): void {
 const nextStatus: EmployeeStatus = employee.status === 'suspended' ? 'active' : 'suspended';
 this.staffBranchesService.updateEmployeeStatus(employee.id, nextStatus).subscribe({
 next: () => {
 this.showFlash(
 nextStatus === 'active'
 ? 'STAFF_BRANCHES.FEEDBACK.EMPLOYEE_ACTIVATED'
 : 'STAFF_BRANCHES.FEEDBACK.EMPLOYEE_SUSPENDED',
 'info'
 );
 this.cdr.markForCheck();
 },
 error: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_ACTION_FAILED', 'info');
 this.cdr.markForCheck();
 }
 });
 }

 updateBranchStatus(branch: BranchVm, status: BranchStatus): void {
 if (!this.canManageBranchLifecycle) {
 return;
 }

 if (status === 'archived') {
 this.deleteBranch(branch);
 return;
 }

 this.staffBranchesService.updateBranchStatus(branch.id, status).subscribe({
 next: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.BRANCH_STATUS_UPDATED', 'info');
 this.cdr.markForCheck();
 },
 error: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.BRANCH_DELETE_FAILED', 'info');
 this.cdr.markForCheck();
 }
 });
 }

 deleteBranch(branch: BranchVm): void {
 if (!this.canManageBranchLifecycle) {
 return;
 }

 const confirmed = window.confirm(
 this.translate.instant('STAFF_BRANCHES.CONFIRMATIONS.DELETE_BRANCH', { name: branch.name })
 );

 if (!confirmed) {
 return;
 }

 this.staffBranchesService.deleteBranch(branch.id).subscribe({
 next: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.BRANCH_DELETED', 'success');
 this.cdr.markForCheck();
 },
 error: (error) => {
 const code = error?.error?.code as string | undefined;
 this.showFlash(this.branchDeleteFeedbackKey(code), 'info');
 this.cdr.markForCheck();
 }
 });
 }

 async copyInvitationLink(invitation: InvitationVm): Promise<void> {
 try {
 await navigator.clipboard.writeText(invitation.link);
 this.showFlash('STAFF_BRANCHES.FEEDBACK.LINK_COPIED', 'success');
 } catch {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.LINK_COPY_FALLBACK', 'info');
 }
 }

 resendInvitation(invitation: InvitationVm): void {
 this.staffBranchesService.resendInvitation(invitation.id).subscribe({
 next: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_RESENT', 'success');
 this.cdr.markForCheck();
 },
 error: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_ACTION_FAILED', 'info');
 this.cdr.markForCheck();
 }
 });
 }

 revokeInvitation(invitation: InvitationVm): void {
 this.staffBranchesService.revokeInvitation(invitation.id).subscribe({
 next: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_REVOKED', 'info');
 this.cdr.markForCheck();
 },
 error: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_ACTION_FAILED', 'info');
 this.cdr.markForCheck();
 }
 });
 }

 deleteInvitation(invitation: InvitationVm): void {
 const confirmed = window.confirm(
 this.translate.instant('STAFF_BRANCHES.CONFIRMATIONS.DELETE_INVITATION', { name: invitation.targetName })
 );

 if (!confirmed) {
 return;
 }

 this.staffBranchesService.deleteInvitation(invitation.id).subscribe({
 next: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_DELETED', 'success');
 this.cdr.markForCheck();
 },
 error: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_ACTION_FAILED', 'info');
 this.cdr.markForCheck();
 }
 });
 }

 deleteEmployee(employee: EmployeeVm): void {
 const confirmed = window.confirm(
 this.translate.instant('STAFF_BRANCHES.CONFIRMATIONS.DELETE_EMPLOYEE', { name: employee.fullName })
 );

 if (!confirmed) {
 return;
 }

 this.staffBranchesService.deleteEmployee(employee.id).subscribe({
 next: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.EMPLOYEE_DELETED', 'success');
 this.cdr.markForCheck();
 },
 error: () => {
 this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_ACTION_FAILED', 'info');
 this.cdr.markForCheck();
 }
 });
 }

 private loadGeographyOptions(): void {
 this.geographySub = this.geographyService.getRegions().subscribe({
 next: (regions) => {
 this.cdr.markForCheck();
 this.regionDirectory = regions;
 this.regions = regions.map((region) => this.toRegionOption(region));

 forkJoin(regions.map((region) => this.geographyService.getCities(region.code))).subscribe((cityGroups) => {
 this.cdr.markForCheck();
 this.cityDirectory = cityGroups.flat();
 this.cities = this.cityDirectory.map((city) => this.toCityOption(city));
 this.applySelectedCityLocationIfMissing();
 });
 },
 error: () => {
 this.cdr.markForCheck();
 this.regionDirectory = [];
 this.cityDirectory = [];
 this.regions = [];
 this.cities = [];
 }
 });
 }

 private refreshGeographyLabels(): void {
 this.regions = this.regions.map((region) => ({...region,
 label: this.localizeName(region.nameAr, region.nameEn)
 }));

 this.cities = this.cities.map((city) => ({...city,
 label: this.localizeName(city.nameAr, city.nameEn)
 }));
 }

 private toRegionOption(region: SaudiRegionDto): SelectOption {
 return {
 value: region.code,
 label: this.localizeName(region.nameAr, region.nameEn),
 nameAr: region.nameAr,
 nameEn: region.nameEn
 };
 }

 private toCityOption(city: SaudiCityDto): SelectOption {
 return {
 value: city.code,
 label: this.localizeName(city.nameAr, city.nameEn),
 nameAr: city.nameAr,
 nameEn: city.nameEn
 };
 }

 private localizeName(nameAr?: string, nameEn?: string): string {
 return this.currentLang === 'ar'
 ? (nameAr || nameEn || '')
 : (nameEn || nameAr || '');
 }

 optionLabel(options: SelectOption[], value: string): string {
 const item = options.find((option) => option.value === value);
 return item ? (item.label || this.translate.instant(item.labelKey || '')) : value;
 }

 roleTemplateLabelKey(value: RoleTemplate): string {
 return this.roleTemplates.find((template) => template.value === value)?.labelKey
 || 'STAFF_BRANCHES.TEMPLATES.BRANCH_MANAGER';
 }

 branchNamesText(branchIds: string[]): string {
 return branchIds.map((branchId) => this.branches.find((branch) => branch.id === branchId)?.name).filter((value): value is string =>!!value).join(' / ');
 }

 formatDate(dateText: string): string {
 return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-SA' : 'en-US', { timeZone: 'Asia/Riyadh',
 year: 'numeric',
 month: 'short',
 day: 'numeric'
 }).format(new Date(dateText));
 }

 formatDateTime(dateText: string | null): string {
 if (!dateText) {
 return this.translate.instant('STAFF_BRANCHES.TABLE.NO_ACTIVITY');
 }

 return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-SA' : 'en-US', { timeZone: 'Asia/Riyadh',
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 hour: 'numeric',
 minute: '2-digit'
 }).format(new Date(dateText));
 }

 branchTypeKey(branch: BranchVm): string {
 return branch.isPrimary
 ? 'STAFF_BRANCHES.BRANCH_TYPES.PRIMARY'
 : 'STAFF_BRANCHES.BRANCH_TYPES.BRANCH';
 }

 branchStatusKey(status: BranchStatus): string {
 switch (status) {
 case 'active':
 return 'STAFF_BRANCHES.STATUSES.BRANCH_ACTIVE';
 case 'pending':
 return 'STAFF_BRANCHES.STATUSES.BRANCH_PENDING';
 case 'suspended':
 return 'STAFF_BRANCHES.STATUSES.BRANCH_SUSPENDED';
 default:
 return 'STAFF_BRANCHES.STATUSES.BRANCH_ARCHIVED';
 }
 }

 private branchDeleteFeedbackKey(code?: string): string {
 switch (code) {
 case 'PRIMARY_BRANCH_DELETE_FORBIDDEN':
 return 'STAFF_BRANCHES.FEEDBACK.BRANCH_DELETE_PRIMARY_FORBIDDEN';
 case 'BRANCH_DELETE_BLOCKED_PRODUCTS':
 return 'STAFF_BRANCHES.FEEDBACK.BRANCH_DELETE_BLOCKED_PRODUCTS';
 case 'BRANCH_DELETE_BLOCKED_ORDERS':
 return 'STAFF_BRANCHES.FEEDBACK.BRANCH_DELETE_BLOCKED_ORDERS';
 case 'BRANCH_DELETE_BLOCKED_STAFF':
 return 'STAFF_BRANCHES.FEEDBACK.BRANCH_DELETE_BLOCKED_STAFF';
 case 'BRANCH_DELETE_BLOCKED_INVITATIONS':
 return 'STAFF_BRANCHES.FEEDBACK.BRANCH_DELETE_BLOCKED_INVITATIONS';
 default:
 return 'STAFF_BRANCHES.FEEDBACK.BRANCH_DELETE_FAILED';
 }
 }

 employeeStatusKey(status: EmployeeStatus): string {
 switch (status) {
 case 'active':
 return 'STAFF_BRANCHES.STATUSES.EMPLOYEE_ACTIVE';
 case 'invited':
 return 'STAFF_BRANCHES.STATUSES.EMPLOYEE_INVITED';
 default:
 return 'STAFF_BRANCHES.STATUSES.EMPLOYEE_SUSPENDED';
 }
 }

 invitationStatusKey(status: InvitationStatus): string {
 switch (status) {
 case 'pending':
 return 'STAFF_BRANCHES.STATUSES.INVITATION_PENDING';
 case 'accepted':
 return 'STAFF_BRANCHES.STATUSES.INVITATION_ACCEPTED';
 case 'expired':
 return 'STAFF_BRANCHES.STATUSES.INVITATION_EXPIRED';
 case 'delivery_failed':
 return 'STAFF_BRANCHES.STATUSES.INVITATION_DELIVERY_FAILED';
 default:
 return 'STAFF_BRANCHES.STATUSES.INVITATION_REVOKED';
 }
 }

 invitationTypeKey(type: InvitationType): string {
 return type === 'branch_manager'
 ? 'STAFF_BRANCHES.INVITATION_TYPES.BRANCH_MANAGER'
 : 'STAFF_BRANCHES.INVITATION_TYPES.EMPLOYEE';
 }

 statusBadgeClass(status: BranchStatus | EmployeeStatus | InvitationStatus): string {
 switch (status) {
 case 'active':
 case 'accepted':
 return 'border-emerald-200 bg-emerald-50 text-emerald-700';
 case 'pending':
 case 'invited':
 return 'border-amber-200 bg-amber-50 text-amber-700';
 case 'suspended':
 case 'expired':
 case 'delivery_failed':
 return 'border-rose-200 bg-rose-50 text-rose-700';
 case 'archived':
 case 'revoked':
 return 'border-slate-200 bg-slate-100 text-slate-600';
 default:
 return 'border-slate-200 bg-slate-100 text-slate-600';
 }
 }

 linkedBranchNames(branchIds: string[]): string {
 return branchIds.map((branchId) => this.branches.find((branch) => branch.id === branchId)?.name).filter((value): value is string =>!!value).join(' • ');
 }

 canUseAction(module: PermissionModuleConfig, action: PermissionAction): boolean {
 return module.actions.includes(action);
 }

 trackByValue(_index: number, item: { value: string }): string {
 return item.value;
 }

 private ensureBranchLocationMap(): void {
 const element = this.branchLocationMap?.nativeElement;
 if (!element) {
 return;
 }

 if (this.branchLocationLeafletMap && this.branchLocationMapElement === element) {
 return;
 }

 this.destroyBranchLocationMap();
 this.configureLeafletDefaultIcon();

 const initialView = this.getBranchMapInitialView();
 this.branchLocationMapElement = element;
 this.branchLocationLeafletMap = L.map(element, {
 center: [initialView.lat, initialView.lng],
 zoom: initialView.zoom,
 zoomControl: true,
 scrollWheelZoom: false,
 attributionControl: true
 });

 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
 attribution: '&copy; OpenStreetMap',
 maxZoom: 19
 }).addTo(this.branchLocationLeafletMap);

 this.applySelectedMapRange();

 this.branchLocationLeafletMap.on('click', (event: L.LeafletMouseEvent) => {
 this.ngZone.run(() => {
 this.setBranchLocation(event.latlng.lat, event.latlng.lng);
 });
 });

 if (this.hasBranchLocationCoordinates) {
 this.upsertBranchLocationMarker(
 Number(this.branchDraft.latitude),
 Number(this.branchDraft.longitude)
 );
 this.updateBranchDeliveryRadiusCircle();
 }

 window.setTimeout(() => {
 this.branchLocationLeafletMap?.invalidateSize();
 }, 0);
 }

 private destroyBranchLocationMap(): void {
 if (!this.branchLocationLeafletMap) {
 return;
 }

 this.branchLocationLeafletMap.remove();
 this.branchLocationLeafletMap = null;
 this.branchLocationMarker = null;
 this.branchDeliveryRadiusCircle = null;
 this.branchLocationMapElement = null;
 }

 private configureLeafletDefaultIcon(): void {
 if (StaffBranchesPageComponent.leafletDefaultIconConfigured) {
 return;
 }

 L.Marker.prototype.options.icon = L.icon({
 iconRetinaUrl: 'assets/marker-icon-2x.png',
 iconUrl: 'assets/marker-icon.png',
 shadowUrl: 'assets/marker-shadow.png',
 iconSize: [25, 41],
 iconAnchor: [12, 41],
 popupAnchor: [1, -34],
 tooltipAnchor: [16, -28],
 shadowSize: [41, 41]
 });
 StaffBranchesPageComponent.leafletDefaultIconConfigured = true;
 }

 private getBranchMapInitialView(): { lat: number; lng: number; zoom: number } {
 if (this.hasBranchLocationCoordinates) {
 return {
 lat: Number(this.branchDraft.latitude),
 lng: Number(this.branchDraft.longitude),
 zoom: 14
 };
 }

 const city = this.findSelectedCity();
 if (city) {
 return {
 lat: city.latitude,
 lng: city.longitude,
 zoom: city.mapZoom || 13
 };
 }

 const region = this.regionDirectory.find((item) => item.code === this.branchDraft.region);
 if (region) {
 return {
 lat: region.latitude,
 lng: region.longitude,
 zoom: region.mapZoom || 8
 };
 }

 return this.defaultBranchMapView;
 }

 private getSelectedAreaMapView(): { lat: number; lng: number; zoom: number; rangeKm: number } {
 const city = this.findSelectedCity();
 if (city) {
 const zoom = city.mapZoom || 13;

 return {
 lat: city.latitude,
 lng: city.longitude,
 zoom,
 rangeKm: this.mapRangeKmForZoom(zoom, 18)
 };
 }

 const region = this.regionDirectory.find((item) => item.code === this.branchDraft.region);
 if (region) {
 const zoom = region.mapZoom || 8;

 return {
 lat: region.latitude,
 lng: region.longitude,
 zoom,
 rangeKm: this.mapRangeKmForZoom(zoom, 180)
 };
 }

 return {...this.defaultBranchMapView,
 rangeKm: 320
 };
 }

 private applySelectedMapRange(): void {
 if (!this.branchLocationLeafletMap) {
 return;
 }

 const area = this.getSelectedAreaMapView();
 const bounds = L.latLng(area.lat, area.lng).toBounds(area.rangeKm * 2000).pad(0.2);
 this.branchLocationLeafletMap.setMaxBounds(bounds);
 this.branchLocationLeafletMap.setMinZoom(Math.max(area.zoom - 3, 5));
 this.branchLocationLeafletMap.setMaxZoom(18);
 }

 private mapRangeKmForZoom(zoom: number, fallbackKm: number): number {
 if (!Number.isFinite(zoom)) {
 return fallbackKm;
 }

 if (zoom >= 13) {
 return 12;
 }

 if (zoom >= 12) {
 return 22;
 }

 if (zoom >= 11) {
 return 40;
 }

 if (zoom >= 10) {
 return 70;
 }

 if (zoom >= 9) {
 return 120;
 }

 if (zoom >= 8) {
 return 220;
 }

 return 360;
 }

 private setBranchLocation(lat: number, lng: number, zoom?: number): void {
 if (!this.isLatitude(lat) ||!this.isLongitude(lng)) {
 return;
 }

 const nextLat = this.roundCoordinate(lat);
 const nextLng = this.roundCoordinate(lng);
 this.branchDraft.latitude = nextLat;
 this.branchDraft.longitude = nextLng;
 this.upsertBranchLocationMarker(nextLat, nextLng);
 this.updateBranchDeliveryRadiusCircle();

 if (this.branchLocationLeafletMap) {
 const nextZoom = zoom ?? Math.max(this.branchLocationLeafletMap.getZoom(), 13);
 this.branchLocationLeafletMap.setView([nextLat, nextLng], nextZoom);
 }

 this.cdr.markForCheck();
 }

 private upsertBranchLocationMarker(lat: number, lng: number): void {
 if (!this.branchLocationLeafletMap) {
 return;
 }

 if (this.branchLocationMarker) {
 this.branchLocationMarker.setLatLng([lat, lng]);
 return;
 }

 this.branchLocationMarker = L.marker([lat, lng], { draggable: true }).addTo(this.branchLocationLeafletMap);
 this.branchLocationMarker.on('dragend', () => {
 const position = this.branchLocationMarker?.getLatLng();
 if (!position) {
 return;
 }

 this.ngZone.run(() => {
 this.setBranchLocation(position.lat, position.lng);
 });
 });
 }

 private updateBranchDeliveryRadiusCircle(): void {
 if (!this.branchLocationLeafletMap ||!this.hasBranchLocationCoordinates) {
 this.branchDeliveryRadiusCircle?.remove();
 this.branchDeliveryRadiusCircle = null;
 return;
 }

 const radiusMeters = Number(this.branchDraft.deliveryRadiusKm || 0) * 1000;
 if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
 this.branchDeliveryRadiusCircle?.remove();
 this.branchDeliveryRadiusCircle = null;
 return;
 }

 const latLng: L.LatLngExpression = [
 Number(this.branchDraft.latitude),
 Number(this.branchDraft.longitude)
 ];

 if (this.branchDeliveryRadiusCircle) {
 this.branchDeliveryRadiusCircle.setLatLng(latLng);
 this.branchDeliveryRadiusCircle.setRadius(radiusMeters);
 return;
 }

 this.branchDeliveryRadiusCircle = L.circle(latLng, {
 radius: radiusMeters,
 color: '#127c8c',
 fillColor: '#127c8c',
 fillOpacity: 0.08,
 weight: 1.5
 }).addTo(this.branchLocationLeafletMap);
 }

 private applySelectedCityLocationIfMissing(): void {
 if (this.hasBranchLocationCoordinates) {
 return;
 }

 const city = this.findSelectedCity();
 if (city) {
 this.branchDraft.region = city.regionCode || this.branchDraft.region;
 this.setBranchLocation(city.latitude, city.longitude, city.mapZoom || 13);
 }
 }

 private findSelectedCity(): SaudiCityDto | undefined {
 return this.cityDirectory.find((city) => city.code === this.branchDraft.city);
 }

 private isLatitude(value: number | string | null | undefined): boolean {
 if (value === null || value === undefined || value === '') {
 return false;
 }

 const numeric = Number(value);
 return Number.isFinite(numeric) && numeric >= -90 && numeric <= 90;
 }

 private isLongitude(value: number | string | null | undefined): boolean {
 if (value === null || value === undefined || value === '') {
 return false;
 }

 const numeric = Number(value);
 return Number.isFinite(numeric) && numeric >= -180 && numeric <= 180;
 }

 private roundCoordinate(value: number): number {
 return Number(value.toFixed(6));
 }

 private clearActionQueryParam(view: StaffView): void {
 void this.router.navigate([], {
 relativeTo: this.route,
 queryParams: { action: null, view },
 queryParamsHandling: 'merge',
 replaceUrl: true
 });
 }

 private syncViewQueryParam(): void {
 void this.router.navigate([], {
 relativeTo: this.route,
 queryParams: { view: this.activeView },
 queryParamsHandling: 'merge',
 replaceUrl: false
 });
 }

 private createEmptyBranchDraft(): BranchWizardDraft {
 return {
 name: '',
 code: '',
 branchKind: 'branch',
 phone: '',
 managerName: '',
 managerContact: '',
 region: 'CENTRAL',
 city: 'RIYADH',
 addressLine: '',
 latitude: null,
 longitude: null,
 deliveryRadiusKm: 8,
 operatingHours: defaultOperatingHours(),
 inviteMessage: ''
 };
 }

 private createEmptyEmployeeDraft(): EmployeeModalDraft {
 const roleTemplate: RoleTemplate = 'branch_manager';

 return {
 fullName: '',
 contact: '',
 roleTemplate,
 branchIds: [],
 customizePermissions: false,
 permissions: createRoleTemplatePermissions(roleTemplate)
 };
 }

 private permissionMatrixMatches(first: PermissionMatrixVm, second: PermissionMatrixVm): boolean {
 return this.permissionModules.every((module) =>
 this.permissionActions.every((action) => first[module.id][action.id] === second[module.id][action.id])
 );
 }

 private normalizeOptionLabel(value: string | null | undefined): string {
 return `${value ?? ''}`.replace(/\s+/g, ' ').trim();
 }

 private uniqueOptions(items: Array<{ value: string; label: string }>): Array<{ value: string; label: string }> {
 const seen = new Set<string>();

 return items.filter((item) => {
 if (!item.value || seen.has(item.value)) {
 return false;
 }

 seen.add(item.value);
 return true;
 });
 }

 private matchesSearch(values: Array<string | undefined | null>, term: string): boolean {
 const normalizedTerm = term.trim().toLowerCase();

 if (!normalizedTerm) {
 return true;
 }

 return values.some((value) => (value || '').toLowerCase().includes(normalizedTerm));
 }

 private isValidEmail(value: string): boolean {
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
 }

 private totalPagesForCount(count: number): number {
 return Math.max(1, Math.ceil(count / this.pageSize));
 }

 private getClampedPage(view: StaffView, count: number): number {
 return Math.min(this.currentPages[view], this.totalPagesForCount(count));
 }

 private paginateItems<T>(items: T[], view: StaffView): T[] {
 const currentPage = this.getClampedPage(view, items.length);
 const startIndex = (currentPage - 1) * this.pageSize;
 return items.slice(startIndex, startIndex + this.pageSize);
 }

 private showFlash(key: string, tone: 'success' | 'info'): void {
 this.flashMessage = this.translate.instant(key);
 this.flashTone = tone;

 setTimeout(() => {
 if (this.flashMessage === this.translate.instant(key)) {
 this.flashMessage = '';
 }
 }, 2800);
 }

 private syncFilterSignature(view: StaffView, filters: unknown): void {
 const nextSignature = JSON.stringify(filters);
 if (this.lastFilterSignatures[view] === nextSignature) {
 return;
 }

 this.lastFilterSignatures[view] = nextSignature;
 this.currentPages[view] = 1;
 }
}
