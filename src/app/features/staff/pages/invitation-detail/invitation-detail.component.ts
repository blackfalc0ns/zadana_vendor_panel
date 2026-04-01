import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, combineLatest } from 'rxjs';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { BranchVm, EmployeeVm, InvitationStatus, InvitationVm } from '../../models/staff-branches.models';
import { StaffBranchesService } from '../../services/staff-branches.service';

@Component({
  selector: 'app-invitation-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    AppPanelHeaderComponent
  ],
  templateUrl: './invitation-detail.component.html'
})
export class InvitationDetailComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  invitation: InvitationVm | null = null;
  branches: BranchVm[] = [];
  employees: EmployeeVm[] = [];
  flashMessage = '';
  flashTone: 'success' | 'info' = 'success';

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
      if (this.flashMessage) {
        this.flashMessage = '';
      }
    });
  }

  ngOnInit(): void {
    const invitationId = this.route.snapshot.paramMap.get('id');

    if (!invitationId) {
      this.router.navigate(['/staff']);
      return;
    }

    this.dataSub = combineLatest([
      this.staffBranchesService.getInvitationById(invitationId),
      this.staffBranchesService.getBranches(),
      this.staffBranchesService.getEmployees()
    ]).subscribe(([invitation, branches, employees]) => {
      if (!invitation) {
        this.router.navigate(['/staff']);
        return;
      }

      this.invitation = invitation;
      this.branches = branches;
      this.employees = employees;
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  get linkedBranches(): BranchVm[] {
    if (!this.invitation) {
      return [];
    }

    return this.branches.filter((branch) => this.invitation!.branchIds.includes(branch.id));
  }

  get matchedEmployee(): EmployeeVm | undefined {
    if (!this.invitation) {
      return undefined;
    }

    return this.employees.find((employee) =>
      employee.contact === this.invitation!.contact || employee.fullName === this.invitation!.targetName
    );
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

  statusBadgeClass(status: InvitationStatus): string {
    switch (status) {
      case 'accepted':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'pending':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'expired':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  }

  async copyInvitationLink(): Promise<void> {
    if (!this.invitation) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.invitation.link);
      this.showFlash('STAFF_BRANCHES.FEEDBACK.LINK_COPIED', 'success');
    } catch {
      this.showFlash('STAFF_BRANCHES.FEEDBACK.LINK_COPY_FALLBACK', 'info');
    }
  }

  resendInvitation(): void {
    if (!this.invitation) {
      return;
    }

    this.staffBranchesService.resendInvitation(this.invitation.id);
    this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_RESENT', 'success');
  }

  revokeInvitation(): void {
    if (!this.invitation) {
      return;
    }

    this.staffBranchesService.revokeInvitation(this.invitation.id);
    this.showFlash('STAFF_BRANCHES.FEEDBACK.INVITATION_REVOKED', 'info');
  }

  private showFlash(key: string, tone: 'success' | 'info'): void {
    this.flashMessage = this.translate.instant(key);
    this.flashTone = tone;

    setTimeout(() => {
      if (this.flashMessage === this.translate.instant(key)) {
        this.flashMessage = '';
      }
    }, 2600);
  }
}
