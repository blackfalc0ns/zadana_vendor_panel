import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, combineLatest } from 'rxjs';
import { CITIES, REGIONS, SelectOption } from '../../../auth/constants/vendor-onboarding.constants';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { BranchStatus, BranchVm, EmployeeVm, InvitationVm } from '../../models/staff-branches.models';
import { StaffBranchesService } from '../../services/staff-branches.service';

@Component({
  selector: 'app-branch-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    AppPanelHeaderComponent
  ],
  templateUrl: './branch-detail.component.html'
})
export class BranchDetailComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  branch: BranchVm | null = null;
  employees: EmployeeVm[] = [];
  invitations: InvitationVm[] = [];

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
    const branchId = this.route.snapshot.paramMap.get('id');

    if (!branchId) {
      this.router.navigate(['/staff']);
      return;
    }

    this.dataSub = combineLatest([
      this.staffBranchesService.getBranchById(branchId),
      this.staffBranchesService.getEmployees(),
      this.staffBranchesService.getInvitations()
    ]).subscribe(([branch, employees, invitations]) => {
      if (!branch) {
        this.router.navigate(['/staff']);
        return;
      }

      this.branch = branch;
      this.employees = employees;
      this.invitations = invitations;
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  get branchEmployees(): EmployeeVm[] {
    if (!this.branch) {
      return [];
    }

    return this.employees.filter((employee) => employee.branchIds.includes(this.branch!.id));
  }

  get branchInvitations(): InvitationVm[] {
    if (!this.branch) {
      return [];
    }

    return this.invitations.filter((invitation) => invitation.branchIds.includes(this.branch!.id));
  }

  get pendingInvitationsCount(): number {
    return this.branchInvitations.filter((invitation) => invitation.status === 'pending').length;
  }

  get canArchive(): boolean {
    return !!this.branch && !this.branch.isPrimary && this.branch.status !== 'archived';
  }

  cityLabel(value: string): string {
    return this.optionLabel(CITIES, value);
  }

  regionLabel(value: string): string {
    return this.optionLabel(REGIONS, value);
  }

  optionLabel(options: SelectOption[], value: string): string {
    const item = options.find((option) => option.value === value);
    return item ? this.translate.instant(item.labelKey) : value;
  }

  formatDate(dateText: string): string {
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateText));
  }

  formatDateTime(dateText: string): string {
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

  statusBadgeClass(status: BranchStatus): string {
    switch (status) {
      case 'active':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'pending':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'suspended':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  }

  updateBranchStatus(status: BranchStatus): void {
    if (!this.branch) {
      return;
    }

    this.staffBranchesService.updateBranchStatus(this.branch.id, status);
  }
}
