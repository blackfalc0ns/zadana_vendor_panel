import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, combineLatest } from 'rxjs';
import { CITIES, REGIONS, SelectOption } from '../../../auth/constants/vendor-onboarding.constants';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
  DetailTabNavItem,
  DetailTabsNavComponent
} from '../../../../shared/components/ui/navigation/detail-tabs-nav/detail-tabs-nav.component';
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

interface BranchFilters {
  search: string;
  status: 'all' | BranchStatus;
  city: string;
  manager: string;
}

interface EmployeeFilters {
  search: string;
  status: 'all' | EmployeeStatus;
  roleTemplate: 'all' | RoleTemplate;
  branchId: 'all' | string;
}

interface InvitationFilters {
  search: string;
  status: 'all' | InvitationStatus;
  type: 'all' | InvitationType;
  branchId: 'all' | string;
}

interface BranchWizardDraft {
  name: string;
  code: string;
  branchKind: 'primary' | 'branch';
  phone: string;
  managerName: string;
  managerContact: string;
  region: string;
  city: string;
  addressLine: string;
  deliveryRadiusKm: number;
  operatingHours: BranchOperatingHourVm[];
  inviteMessage: string;
}

interface EmployeeModalDraft {
  fullName: string;
  contact: string;
  roleTemplate: RoleTemplate;
  branchIds: string[];
  customizePermissions: boolean;
  permissions: PermissionMatrixVm;
}

@Component({
  selector: 'app-staff-branches-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    AppPanelHeaderComponent,
    DetailTabsNavComponent
  ],
  templateUrl: './staff-branches.page.html'
})
export class StaffBranchesPageComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  activeView: StaffView = 'branches';
  isFiltersExpanded = true;

  branches: BranchVm[] = [];
  employees: EmployeeVm[] = [];
  invitations: InvitationVm[] = [];

  readonly regions: SelectOption[] = REGIONS;
  readonly cities: SelectOption[] = CITIES;
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

  isEmployeeModalOpen = false;
  editingEmployee: EmployeeVm | null = null;
  employeeDraft = this.createEmptyEmployeeDraft();

  flashMessage = '';
  flashTone: 'success' | 'info' = 'success';

  private langSub: Subscription;
  private dataSub?: Subscription;
  private routeSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly staffBranchesService: StaffBranchesService,
    private readonly translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      if (this.flashMessage) {
        this.flashMessage = '';
      }
    });
  }

  ngOnInit(): void {
    this.dataSub = combineLatest([
      this.staffBranchesService.getBranches(),
      this.staffBranchesService.getEmployees(),
      this.staffBranchesService.getInvitations()
    ]).subscribe(([branches, employees, invitations]) => {
      this.branches = branches;
      this.employees = employees;
      this.invitations = invitations;
    });

    this.routeSub = this.route.queryParamMap.subscribe((params) => {
      const action = params.get('action');

      if (action === 'branch') {
        this.activeView = 'branches';
        this.openBranchWizard();
        this.clearActionQueryParam();
      } else if (action === 'employee') {
        this.activeView = 'employees';
        this.openEmployeeInvite();
        this.clearActionQueryParam();
      }
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  get viewTabs(): DetailTabNavItem[] {
    return [
      {
        id: 'branches',
        labelKey: 'STAFF_BRANCHES.VIEWS.BRANCHES',
        icon: 'storefront',
        count: this.filteredBranches.length
      },
      {
        id: 'employees',
        labelKey: 'STAFF_BRANCHES.VIEWS.EMPLOYEES',
        icon: 'person',
        count: this.filteredEmployees.length
      },
      {
        id: 'invitations',
        labelKey: 'STAFF_BRANCHES.VIEWS.INVITATIONS',
        icon: 'verified_user',
        count: this.filteredInvitations.length,
        attention: this.pendingInvitationsCount > 0
      }
    ];
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

  get hasPrimaryBranch(): boolean {
    return this.branches.some((branch) => branch.isPrimary && branch.status !== 'archived');
  }

  get isEditingEmployee(): boolean {
    return !!this.editingEmployee;
  }

  get canSubmitEmployeeModal(): boolean {
    if (this.isEditingEmployee) {
      return true;
    }

    return !!this.employeeDraft.fullName.trim()
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

      if (this.branchFilters.status !== 'all' && branch.status !== this.branchFilters.status) {
        return false;
      }

      if (this.branchFilters.city && branch.city !== this.branchFilters.city) {
        return false;
      }

      if (this.branchFilters.manager && branch.managerName !== this.branchFilters.manager) {
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

      if (this.employeeFilters.status !== 'all' && employee.status !== this.employeeFilters.status) {
        return false;
      }

      if (this.employeeFilters.roleTemplate !== 'all' && employee.roleTemplate !== this.employeeFilters.roleTemplate) {
        return false;
      }

      if (this.employeeFilters.branchId !== 'all' && !employee.branchIds.includes(this.employeeFilters.branchId)) {
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

      if (this.invitationFilters.status !== 'all' && invitation.status !== this.invitationFilters.status) {
        return false;
      }

      if (this.invitationFilters.type !== 'all' && invitation.type !== this.invitationFilters.type) {
        return false;
      }

      if (this.invitationFilters.branchId !== 'all' && !invitation.branchIds.includes(this.invitationFilters.branchId)) {
        return false;
      }

      return true;
    });
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
      this.branches.map((branch) => ({
        value: branch.managerName,
        label: branch.managerName
      }))
    );
  }

  get activeBranchOptions(): BranchVm[] {
    return this.branches.filter((branch) => branch.status !== 'archived');
  }

  get hasActiveFilters(): boolean {
    if (this.activeView === 'branches') {
      return !!this.branchFilters.search.trim()
        || this.branchFilters.status !== 'all'
        || !!this.branchFilters.city
        || !!this.branchFilters.manager;
    }

    if (this.activeView === 'employees') {
      return !!this.employeeFilters.search.trim()
        || this.employeeFilters.status !== 'all'
        || this.employeeFilters.roleTemplate !== 'all'
        || this.employeeFilters.branchId !== 'all';
    }

    return !!this.invitationFilters.search.trim()
      || this.invitationFilters.status !== 'all'
      || this.invitationFilters.type !== 'all'
      || this.invitationFilters.branchId !== 'all';
  }

  setActiveView(view: string): void {
    this.activeView = view as StaffView;
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
  }

  openBranchWizard(): void {
    this.branchDraft = this.createEmptyBranchDraft();
    this.branchWizardStep = 1;
    this.isBranchWizardOpen = true;
  }

  closeBranchWizard(): void {
    this.isBranchWizardOpen = false;
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

      return !!this.branchDraft.name.trim()
        && !!this.branchDraft.phone.trim()
        && !!this.branchDraft.managerName.trim()
        && !primaryChoiceInvalid;
    }

    if (step === 2) {
      return !!this.branchDraft.region
        && !!this.branchDraft.city
        && !!this.branchDraft.addressLine.trim()
        && this.branchDraft.deliveryRadiusKm > 0
        && this.branchDraft.operatingHours.some((hour) => hour.isOpen);
    }

    return !!this.branchDraft.managerName.trim() && !!this.branchDraft.managerContact.trim();
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
      deliveryRadiusKm: this.branchDraft.deliveryRadiusKm,
      operatingHours: cloneOperatingHours(this.branchDraft.operatingHours),
      inviteMessage: this.branchDraft.inviteMessage
    };

    this.staffBranchesService.createBranch(input);
    this.closeBranchWizard();
    this.showFlash('STAFF_BRANCHES.FEEDBACK.BRANCH_CREATED', 'success');
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
      customizePermissions: !this.permissionMatrixMatches(employee.permissions, defaultPermissions),
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
      if (!this.employeeDraft.branchIds.includes(branchId)) {
        this.employeeDraft.branchIds = [...this.employeeDraft.branchIds, branchId];
      }
      return;
    }

    this.employeeDraft.branchIds = this.employeeDraft.branchIds.filter((id) => id !== branchId);
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
      );
      this.closeEmployeeModal();
      this.showFlash('STAFF_BRANCHES.FEEDBACK.PERMISSIONS_UPDATED', 'success');
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
    });

    this.closeEmployeeModal();
    this.activeView = 'employees';
    this.showFlash('STAFF_BRANCHES.FEEDBACK.EMPLOYEE_INVITED', 'success');
  }

  toggleEmployeeStatus(employee: EmployeeVm): void {
    const nextStatus: EmployeeStatus = employee.status === 'suspended' ? 'active' : 'suspended';
    this.staffBranchesService.updateEmployeeStatus(employee.id, nextStatus);
    this.showFlash(
      nextStatus === 'active'
        ? 'STAFF_BRANCHES.FEEDBACK.EMPLOYEE_ACTIVATED'
        : 'STAFF_BRANCHES.FEEDBACK.EMPLOYEE_SUSPENDED',
      'info'
    );
  }

  updateBranchStatus(branch: BranchVm, status: BranchStatus): void {
    this.staffBranchesService.updateBranchStatus(branch.id, status);
    this.showFlash('STAFF_BRANCHES.FEEDBACK.BRANCH_STATUS_UPDATED', 'info');
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
    this.staffBranchesService.resendInvitation(invitation.id);
    this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_RESENT', 'success');
  }

  revokeInvitation(invitation: InvitationVm): void {
    this.staffBranchesService.revokeInvitation(invitation.id);
    this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_REVOKED', 'info');
  }

  optionLabel(options: SelectOption[], value: string): string {
    const item = options.find((option) => option.value === value);
    return item ? this.translate.instant(item.labelKey) : value;
  }

  roleTemplateLabelKey(value: RoleTemplate): string {
    return this.roleTemplates.find((template) => template.value === value)?.labelKey
      || 'STAFF_BRANCHES.TEMPLATES.BRANCH_MANAGER';
  }

  branchNamesText(branchIds: string[]): string {
    return branchIds
      .map((branchId) => this.branches.find((branch) => branch.id === branchId)?.name)
      .filter((value): value is string => !!value)
      .join(' / ');
  }

  formatDate(dateText: string): string {
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateText));
  }

  formatDateTime(dateText: string | null): string {
    if (!dateText) {
      return this.translate.instant('STAFF_BRANCHES.TABLE.NO_ACTIVITY');
    }

    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
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
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'archived':
      case 'revoked':
        return 'border-slate-200 bg-slate-100 text-slate-600';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  }

  linkedBranchNames(branchIds: string[]): string {
    return branchIds
      .map((branchId) => this.branches.find((branch) => branch.id === branchId)?.name)
      .filter((value): value is string => !!value)
      .join(' • ');
  }

  canUseAction(module: PermissionModuleConfig, action: PermissionAction): boolean {
    return module.actions.includes(action);
  }

  trackByValue(_index: number, item: { value: string }): string {
    return item.value;
  }

  private clearActionQueryParam(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
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

  private showFlash(key: string, tone: 'success' | 'info'): void {
    this.flashMessage = this.translate.instant(key);
    this.flashTone = tone;

    setTimeout(() => {
      if (this.flashMessage === this.translate.instant(key)) {
        this.flashMessage = '';
      }
    }, 2800);
  }
}
