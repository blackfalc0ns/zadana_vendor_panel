import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, combineLatest } from 'rxjs';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import {
  EmailProvisioningStatus,
  EmployeeStatus,
  EmployeeVm,
  InvitationVm,
  PermissionActionOption,
  PermissionModuleConfig,
  STAFF_PERMISSION_ACTIONS,
  STAFF_PERMISSION_MODULES,
  BranchVm
} from '../../models/staff-branches.models';
import { StaffBranchesService } from '../../services/staff-branches.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    AppPanelHeaderComponent
  ],
  templateUrl: './employee-detail.component.html'
})
export class EmployeeDetailComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  employee: EmployeeVm | null = null;
  branches: BranchVm[] = [];
  invitations: InvitationVm[] = [];
  readonly permissionModules: PermissionModuleConfig[] = STAFF_PERMISSION_MODULES;
  readonly permissionActions: PermissionActionOption[] = STAFF_PERMISSION_ACTIONS;

  private langSub: Subscription;
  private dataSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly staffBranchesService: StaffBranchesService,
    private readonly translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });
  }

  ngOnInit(): void {
    const employeeId = this.route.snapshot.paramMap.get('id');

    if (!employeeId) {
      this.router.navigate(['/staff']);
      return;
    }

    this.dataSub = combineLatest([
      this.staffBranchesService.getEmployeeById(employeeId),
      this.staffBranchesService.getBranches(),
      this.staffBranchesService.getInvitations()
    ]).subscribe(([employee, branches, invitations]) => {
      if (!employee) {
        this.router.navigate(['/staff']);
        return;
      }

      this.employee = employee;
      this.branches = branches;
      this.invitations = invitations;
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  get accessibleBranches(): BranchVm[] {
    if (!this.employee) {
      return [];
    }

    return this.branches.filter((branch) => this.employee!.branchIds.includes(branch.id));
  }

  get employeeInvitations(): InvitationVm[] {
    if (!this.employee) {
      return [];
    }

    return this.invitations.filter((invitation) =>
      invitation.contact === this.employee!.contact
      || invitation.contact === this.employee!.workEmail
      || invitation.targetName === this.employee!.fullName
    );
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

  statusKey(status: EmployeeStatus): string {
    switch (status) {
      case 'active':
        return 'STAFF_BRANCHES.STATUSES.EMPLOYEE_ACTIVE';
      case 'invited':
        return 'STAFF_BRANCHES.STATUSES.EMPLOYEE_INVITED';
      default:
        return 'STAFF_BRANCHES.STATUSES.EMPLOYEE_SUSPENDED';
    }
  }

  statusBadgeClass(status: EmployeeStatus): string {
    switch (status) {
      case 'active':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'invited':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      default:
        return 'border-rose-200 bg-rose-50 text-rose-700';
    }
  }

  workEmailStatusKey(status: EmailProvisioningStatus): string {
    return status === 'connected'
      ? 'STAFF_BRANCHES.WORK_EMAIL.STATUSES.CONNECTED'
      : 'STAFF_BRANCHES.WORK_EMAIL.STATUSES.NOT_PROVISIONED';
  }

  workEmailStatusBadgeClass(status: EmailProvisioningStatus): string {
    return status === 'connected'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';
  }

  canUseAction(module: PermissionModuleConfig, actionId: string): boolean {
    return module.actions.includes(actionId as never);
  }

  toggleEmployeeStatus(): void {
    if (!this.employee) {
      return;
    }

    const nextStatus: EmployeeStatus = this.employee.status === 'suspended' ? 'active' : 'suspended';
    this.staffBranchesService.updateEmployeeStatus(this.employee.id, nextStatus);
  }
}
