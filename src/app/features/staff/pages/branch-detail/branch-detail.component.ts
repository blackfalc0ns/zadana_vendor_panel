import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, combineLatest } from 'rxjs';
import { SelectOption } from '../../../auth/constants/vendor-onboarding.constants';
import { GeographyService, SaudiCityDto, SaudiRegionDto } from '../../../auth/services/geography.service';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { BranchOperatingHourVm, BranchStatus, BranchUpdateInput, BranchVm, EmployeeVm, InvitationVm, cloneOperatingHours } from '../../models/staff-branches.models';
import { StaffBranchesService } from '../../services/staff-branches.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-branch-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    AppPanelHeaderComponent
  ],
  templateUrl: './branch-detail.component.html'
})
export class BranchDetailComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  currentLang = 'ar';
  branch: BranchVm | null = null;
  employees: EmployeeVm[] = [];
  invitations: InvitationVm[] = [];
  regions: SelectOption[] = [];
  cities: SelectOption[] = [];
  editDraft: BranchUpdateInput | null = null;
  isEditingProfile = false;
  isSavingProfile = false;
  feedbackMessage = '';
  feedbackTone: 'success' | 'info' = 'success';

  private langSub: Subscription;
  private dataSub?: Subscription;
  private geographySub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly staffBranchesService: StaffBranchesService,
    private readonly translate: TranslateService,
    private readonly geographyService: GeographyService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.cdr.markForCheck();
      this.currentLang = event.lang;
      this.refreshGeographyLabels();
    });
  }

  ngOnInit(): void {
    this.loadGeographyOptions();

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
      this.cdr.markForCheck();
      if (!branch) {
        this.router.navigate(['/staff']);
        return;
      }

      this.branch = branch;
      this.employees = employees;
      this.invitations = invitations;
      if (!this.isEditingProfile) {
        this.editDraft = this.createEditDraft(branch);
      }
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub?.unsubscribe();
    this.geographySub?.unsubscribe();
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

  get canSaveProfile(): boolean {
    return !!this.editDraft
      && !!this.editDraft.name.trim()
      && !!this.editDraft.phone.trim()
      && !!this.editDraft.managerName.trim()
      && this.isValidEmail(this.editDraft.managerContact)
      && !!this.editDraft.region
      && !!this.editDraft.city
      && !!this.editDraft.addressLine.trim()
      && Number(this.editDraft.deliveryRadiusKm) > 0
      && this.isLatitude(this.editDraft.latitude)
      && this.isLongitude(this.editDraft.longitude)
      && this.editDraft.operatingHours.some((hour) => hour.isOpen);
  }

  cityLabel(value: string): string {
    return this.optionLabel(this.cities, value);
  }

  regionLabel(value: string): string {
    return this.optionLabel(this.regions, value);
  }

  optionLabel(options: SelectOption[], value: string): string {
    const item = options.find((option) => option.value === value);
    return item ? (item.label || this.translate.instant(item.labelKey || '')) : value;
  }

  private loadGeographyOptions(): void {
    this.geographySub = this.geographyService.getRegions().subscribe({
      next: (regions) => {
        this.cdr.markForCheck();
        this.regions = regions.map((region) => this.toRegionOption(region));

        combineLatest(regions.map((region) => this.geographyService.getCities(region.code))).subscribe((cityGroups) => {
      this.cdr.markForCheck();
          this.cities = cityGroups.flat().map((city) => this.toCityOption(city));
        });
      },
      error: () => {
        this.cdr.markForCheck();
        this.regions = [];
        this.cities = [];
      }
    });
  }

  private refreshGeographyLabels(): void {
    this.regions = this.regions.map((region) => ({
      ...region,
      label: this.localizeName(region.nameAr, region.nameEn)
    }));

    this.cities = this.cities.map((city) => ({
      ...city,
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

  beginEditProfile(): void {
    if (!this.branch) {
      return;
    }

    this.editDraft = this.createEditDraft(this.branch);
    this.isEditingProfile = true;
    this.feedbackMessage = '';
  }

  cancelEditProfile(): void {
    this.isEditingProfile = false;
    this.editDraft = this.branch ? this.createEditDraft(this.branch) : null;
    this.feedbackMessage = '';
  }

  saveProfile(): void {
    if (!this.branch || !this.editDraft || !this.canSaveProfile) {
      return;
    }

    this.isSavingProfile = true;
    this.staffBranchesService.updateBranch(this.branch.id, this.editDraft).subscribe({
      next: () => {
        this.isSavingProfile = false;
        this.isEditingProfile = false;
        this.showFeedback(this.currentLang === 'ar' ? 'تم تحديث بروفايل الفرع.' : 'Branch profile updated.', 'success');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isSavingProfile = false;
        this.showFeedback(error?.error?.message || (this.currentLang === 'ar' ? 'تعذر حفظ بروفايل الفرع.' : 'Unable to save branch profile.'), 'info');
        this.cdr.markForCheck();
      }
    });
  }

  toggleEditDay(hour: BranchOperatingHourVm, isOpen: boolean): void {
    hour.isOpen = isOpen;
  }

  updateBranchStatus(status: BranchStatus): void {
    if (!this.branch) {
      return;
    }

    this.staffBranchesService.updateBranchStatus(this.branch.id, status).subscribe({
      next: () => {
        this.showFeedback(this.currentLang === 'ar' ? 'تم تحديث حالة الفرع.' : 'Branch status updated.', 'success');
        this.cdr.markForCheck();
      },
      error: () => {
        this.showFeedback(this.currentLang === 'ar' ? 'تعذر تحديث حالة الفرع.' : 'Unable to update branch status.', 'info');
        this.cdr.markForCheck();
      }
    });
  }

  private createEditDraft(branch: BranchVm): BranchUpdateInput {
    return {
      name: branch.name,
      code: branch.code,
      isPrimary: branch.isPrimary,
      phone: branch.phone,
      managerName: branch.managerName,
      managerContact: branch.managerContact,
      region: branch.region,
      city: branch.city,
      addressLine: branch.addressLine,
      latitude: branch.latitude,
      longitude: branch.longitude,
      deliveryRadiusKm: branch.deliveryRadiusKm,
      operatingHours: cloneOperatingHours(branch.operatingHours)
    };
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

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private showFeedback(message: string, tone: 'success' | 'info'): void {
    this.feedbackMessage = message;
    this.feedbackTone = tone;
    window.setTimeout(() => {
      if (this.feedbackMessage === message) {
        this.feedbackMessage = '';
        this.cdr.markForCheck();
      }
    }, 2800);
  }
}
