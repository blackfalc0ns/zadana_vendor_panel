import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BranchCreationInput,
  BranchOperatingHourVm,
  BranchVm,
  EmployeeInviteInput,
  EmployeeStatus,
  EmployeeVm,
  InvitationStatus,
  InvitationType,
  InvitationVm,
  RoleTemplate,
  cloneOperatingHours,
  clonePermissionMatrix,
  countOpenDays,
  defaultOperatingHours
} from '../models/staff-branches.models';
import { repairUtf8Mojibake } from '../../../shared/utils/text-normalization.util';

interface StaffState {
  branches: BranchVm[];
  employees: EmployeeVm[];
  invitations: InvitationVm[];
}

interface InvitationApiDto {
  id: string;
  type: InvitationType;
  targetName: string;
  contact: string;
  branchIds: string[];
  status: InvitationStatus;
  sentAt: string;
  expiresAt: string;
  link: string;
  roleTemplate: RoleTemplate;
  sendAttemptCount: number;
  providerMessageId?: string | null;
  lastSendFailureReason?: string | null;
}

interface InvitationCreatePayload {
  type: InvitationType;
  targetName: string;
  contact: string;
  roleTemplate: RoleTemplate;
  branchIds: string[];
  permissions: EmployeeVm['permissions'];
  inviteMessage?: string;
}

interface BranchApiDto {
  id: string;
  name: string;
  code: string;
  isPrimary: boolean;
  status: BranchVm['status'];
  phone: string;
  managerName: string;
  managerContact: string;
  region: string;
  city: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  workingDays: number;
  createdAt: string;
  operatingHours: BranchOperatingHourVm[];
}

interface EmployeeApiDto {
  id: string;
  fullName: string;
  contact: string;
  status: EmployeeStatus;
  roleTemplate: RoleTemplate;
  branchIds: string[];
  lastActiveAt: string | null;
  roleCode: string;
  roleName: string;
  permissions: EmployeeVm['permissions'];
}

interface BranchCreatePayload {
  name: string;
  code: string;
  isPrimary: boolean;
  addressLine: string;
  phone: string;
  managerName: string;
  managerContact: string;
  region: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  deliveryRadiusKm: number;
  operatingHours: BranchOperatingHourVm[];
}

@Injectable({
  providedIn: 'root'
})
export class StaffBranchesService {
  private readonly branchesUrl = `${environment.apiUrl}/vendors/branches`;
  private readonly staffUrl = `${environment.apiUrl}/vendors/staff`;
  private readonly invitationsUrl = `${environment.apiUrl}/vendors/staff/invitations`;
  private readonly stateSubject = new BehaviorSubject<StaffState>(this.createEmptyState());

  constructor(private readonly http: HttpClient) {
    this.loadState();
  }

  getBranches(): Observable<BranchVm[]> {
    return this.stateSubject.pipe(map((state) => state.branches.map((branch) => this.cloneBranch(branch))));
  }

  getBranchById(branchId: string): Observable<BranchVm | undefined> {
    return this.stateSubject.pipe(
      map((state) => {
        const branch = state.branches.find((item) => item.id === branchId);
        return branch ? this.cloneBranch(branch) : undefined;
      })
    );
  }

  getEmployees(): Observable<EmployeeVm[]> {
    return this.stateSubject.pipe(map((state) => state.employees.map((employee) => this.cloneEmployee(employee))));
  }

  getEmployeeById(employeeId: string): Observable<EmployeeVm | undefined> {
    return this.stateSubject.pipe(
      map((state) => {
        const employee = state.employees.find((item) => item.id === employeeId);
        return employee ? this.cloneEmployee(employee) : undefined;
      })
    );
  }

  getInvitations(): Observable<InvitationVm[]> {
    return this.stateSubject.pipe(map((state) => state.invitations.map((invitation) => this.cloneInvitation(invitation))));
  }

  getInvitationById(invitationId: string): Observable<InvitationVm | undefined> {
    return this.stateSubject.pipe(
      map((state) => {
        const invitation = state.invitations.find((item) => item.id === invitationId);
        return invitation ? this.cloneInvitation(invitation) : undefined;
      })
    );
  }

  createBranch(input: BranchCreationInput): Observable<BranchVm> {
    return this.createServerBranch(input).pipe(
      switchMap((branch) =>
        this.createInvitation({
          type: 'branch_manager',
          targetName: input.managerName.trim(),
          contact: input.managerContact.trim(),
          roleTemplate: 'branch_manager',
          branchIds: [branch.id],
          permissions: this.createBranchManagerPermissions(),
          inviteMessage: input.inviteMessage
        }).pipe(map((invitation) => ({ branch, invitation })))
      ),
      map(({ branch, invitation }) => {
        this.setState((state) => ({
          ...state,
          branches: [branch, ...state.branches.filter((item) => item.id !== branch.id)],
          invitations: [invitation, ...state.invitations.filter((item) => item.id !== invitation.id)]
        }));

        return branch;
      })
    );
  }

  updateBranchStatus(branchId: string, status: BranchVm['status']): Observable<BranchVm> {
    const payload = { status: status === 'active' ? 'active' : 'suspended' };
    return this.http.put<BranchApiDto>(`${this.branchesUrl}/${branchId}/status`, payload).pipe(
      map((response) => this.mapBranch(response)),
      tap((branch) => {
        this.setState((state) => ({
          ...state,
          branches: state.branches.map((item) => item.id === branch.id ? branch : item)
        }));
      })
    );
  }

  inviteEmployee(input: EmployeeInviteInput): Observable<InvitationVm> {
    return this.createInvitation({
      type: 'employee',
      targetName: input.fullName,
      contact: input.contact,
      roleTemplate: input.roleTemplate,
      branchIds: input.branchIds,
      permissions: input.permissions
    }).pipe(
      tap((invitation) => {
        this.setState((state) => ({
          ...state,
          invitations: [invitation, ...state.invitations.filter((item) => item.id !== invitation.id)]
        }));
      })
    );
  }

  updateEmployeePermissions(
    employeeId: string,
    roleTemplate: RoleTemplate,
    permissions: EmployeeVm['permissions']
  ): Observable<EmployeeVm> {
    return this.http.put<EmployeeApiDto>(`${this.staffUrl}/${employeeId}/role`, { roleTemplate, permissions }).pipe(
      map((response) => this.mapEmployee(response)),
      tap((employee) => {
        this.setState((state) => ({
          ...state,
          employees: state.employees.map((item) => item.id === employee.id ? employee : item)
        }));
      })
    );
  }

  updateEmployeeStatus(employeeId: string, status: EmployeeStatus): Observable<EmployeeVm> {
    return this.http.put<EmployeeApiDto>(`${this.staffUrl}/${employeeId}/status`, { status }).pipe(
      map((response) => this.mapEmployee(response)),
      tap((employee) => {
        this.setState((state) => ({
          ...state,
          employees: state.employees.map((item) => item.id === employee.id ? employee : item)
        }));
      })
    );
  }

  resendInvitation(invitationId: string): Observable<InvitationVm> {
    return this.http.post<InvitationApiDto>(`${this.invitationsUrl}/${invitationId}/resend`, {}).pipe(
      map((response) => this.mapInvitation(response)),
      tap((invitation) => {
        this.setState((state) => ({
          ...state,
          invitations: state.invitations.map((item) => item.id === invitation.id ? invitation : item)
        }));
      })
    );
  }

  revokeInvitation(invitationId: string): Observable<InvitationVm> {
    return this.http.post<InvitationApiDto>(`${this.invitationsUrl}/${invitationId}/revoke`, {}).pipe(
      map((response) => this.mapInvitation(response)),
      tap((invitation) => {
        this.setState((state) => ({
          ...state,
          invitations: state.invitations.map((item) => item.id === invitation.id ? invitation : item)
        }));
      })
    );
  }

  deleteInvitation(invitationId: string): Observable<void> {
    return this.http.delete<void>(`${this.invitationsUrl}/${invitationId}`).pipe(
      tap(() => {
        this.setState((state) => ({
          ...state,
          invitations: state.invitations.filter((item) => item.id !== invitationId)
        }));
      })
    );
  }

  deleteBranch(branchId: string): Observable<void> {
    return this.http.delete<void>(`${this.branchesUrl}/${branchId}`).pipe(
      tap(() => {
        this.setState((state) => ({
          ...state,
          branches: state.branches.filter((branch) => branch.id !== branchId),
          invitations: state.invitations.filter((invitation) => !invitation.branchIds.includes(branchId)),
          employees: state.employees.filter((employee) => !employee.branchIds.includes(branchId))
        }));
      })
    );
  }

  deleteEmployee(employeeId: string): Observable<void> {
    return this.http.delete<void>(`${this.staffUrl}/${employeeId}`).pipe(
      tap(() => {
        this.setState((state) => ({
          ...state,
          employees: state.employees.filter((employee) => employee.id !== employeeId)
        }));
      })
    );
  }

  resetSeedState(): void {
    this.loadState();
  }

  private loadState(): void {
    this.fetchState().subscribe({
      next: (state) => this.stateSubject.next(state),
      error: () => this.stateSubject.next(this.createEmptyState())
    });
  }

  private fetchState(): Observable<StaffState> {
    return forkJoin({
      branches: this.http.get<BranchApiDto[]>(this.branchesUrl).pipe(catchError(() => of([] as BranchApiDto[]))),
      employees: this.http.get<EmployeeApiDto[]>(this.staffUrl).pipe(catchError(() => of([] as EmployeeApiDto[]))),
      invitations: this.http.get<InvitationApiDto[]>(this.invitationsUrl).pipe(catchError(() => of([] as InvitationApiDto[])))
    }).pipe(
      map(({ branches, employees, invitations }) => ({
        branches: branches.map((branch) => this.mapBranch(branch)),
        employees: employees.map((employee) => this.mapEmployee(employee)),
        invitations: invitations.map((invitation) => this.mapInvitation(invitation))
      }))
    );
  }

  private createEmptyState(): StaffState {
    return {
      branches: [],
      employees: [],
      invitations: []
    };
  }

  private setState(projector: (state: StaffState) => StaffState): void {
    const nextState = projector(this.stateSubject.value);
    this.stateSubject.next({
      branches: nextState.branches.map((branch) => this.cloneBranch(branch)),
      employees: nextState.employees.map((employee) => this.cloneEmployee(employee)),
      invitations: nextState.invitations.map((invitation) => this.cloneInvitation(invitation))
    });
  }

  private createInvitation(payload: InvitationCreatePayload): Observable<InvitationVm> {
    return this.http.post<InvitationApiDto>(this.invitationsUrl, payload).pipe(
      map((response) => this.mapInvitation(response))
    );
  }

  private createServerBranch(input: BranchCreationInput): Observable<BranchVm> {
    const payload: BranchCreatePayload = {
      name: input.name.trim(),
      code: input.code.trim() || this.generateBranchCode(input.name),
      isPrimary: input.isPrimary,
      addressLine: input.addressLine.trim(),
      phone: input.phone.trim(),
      managerName: input.managerName.trim(),
      managerContact: input.managerContact.trim(),
      region: input.region,
      city: input.city,
      latitude: this.normalizeCoordinate(input.latitude),
      longitude: this.normalizeCoordinate(input.longitude),
      deliveryRadiusKm: input.deliveryRadiusKm,
      operatingHours: cloneOperatingHours(input.operatingHours)
    };

    return this.http.post<BranchApiDto>(this.branchesUrl, payload).pipe(
      map((response) => this.mapBranch(response))
    );
  }

  private mapBranch(branch: BranchApiDto): BranchVm {
    const operatingHours = branch.operatingHours?.length
      ? cloneOperatingHours(branch.operatingHours)
      : defaultOperatingHours();

    return this.cloneBranch({
      id: branch.id,
      name: repairUtf8Mojibake(branch.name || ''),
      code: branch.code || this.generateBranchCode(branch.name || ''),
      isPrimary: !!branch.isPrimary,
      status: branch.status || 'active',
      phone: branch.phone || '',
      managerName: repairUtf8Mojibake(branch.managerName || ''),
      managerContact: repairUtf8Mojibake(branch.managerContact || ''),
      region: branch.region || '',
      city: branch.city || '',
      addressLine: repairUtf8Mojibake(branch.addressLine || ''),
      latitude: Number(branch.latitude ?? 0),
      longitude: Number(branch.longitude ?? 0),
      deliveryRadiusKm: Number(branch.deliveryRadiusKm ?? 5),
      workingDays: Number(branch.workingDays ?? countOpenDays(operatingHours)),
      createdAt: branch.createdAt || new Date().toISOString(),
      operatingHours
    });
  }

  private mapEmployee(employee: EmployeeApiDto): EmployeeVm {
    return this.cloneEmployee({
      id: employee.id,
      fullName: repairUtf8Mojibake(employee.fullName || ''),
      jobTitle: this.getTemplateLabelKey(employee.roleTemplate),
      contact: repairUtf8Mojibake(employee.contact || ''),
      status: employee.status,
      roleTemplate: employee.roleTemplate,
      branchIds: [...(employee.branchIds || [])],
      permissions: clonePermissionMatrix(employee.permissions),
      lastActiveAt: employee.lastActiveAt
    });
  }

  private mapInvitation(invitation: InvitationApiDto): InvitationVm {
    return this.cloneInvitation({
      id: invitation.id,
      type: invitation.type,
      targetName: invitation.targetName,
      contact: invitation.contact,
      branchIds: invitation.branchIds || [],
      status: invitation.status,
      sentAt: invitation.sentAt,
      expiresAt: invitation.expiresAt,
      link: invitation.link || ''
    });
  }

  private cloneBranch(branch: BranchVm): BranchVm {
    return {
      ...branch,
      name: repairUtf8Mojibake(branch.name),
      managerName: repairUtf8Mojibake(branch.managerName),
      managerContact: repairUtf8Mojibake(branch.managerContact),
      addressLine: repairUtf8Mojibake(branch.addressLine),
      operatingHours: cloneOperatingHours(branch.operatingHours)
    };
  }

  private cloneEmployee(employee: EmployeeVm): EmployeeVm {
    return {
      ...employee,
      fullName: repairUtf8Mojibake(employee.fullName),
      contact: repairUtf8Mojibake(employee.contact),
      branchIds: [...employee.branchIds],
      permissions: clonePermissionMatrix(employee.permissions)
    };
  }

  private cloneInvitation(invitation: InvitationVm): InvitationVm {
    return {
      ...invitation,
      targetName: repairUtf8Mojibake(invitation.targetName),
      contact: repairUtf8Mojibake(invitation.contact),
      link: repairUtf8Mojibake(invitation.link),
      branchIds: [...invitation.branchIds]
    };
  }

  private generateBranchCode(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 12) || 'BRANCH';
  }

  private normalizeCoordinate(value: number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private getTemplateLabelKey(template: RoleTemplate): string {
    switch (template) {
      case 'branch_manager':
        return 'STAFF_BRANCHES.TEMPLATES.BRANCH_MANAGER';
      case 'orders_clerk':
        return 'STAFF_BRANCHES.TEMPLATES.ORDERS_CLERK';
      default:
        return 'STAFF_BRANCHES.TEMPLATES.INVENTORY_CLERK';
    }
  }

  private createBranchManagerPermissions(): EmployeeVm['permissions'] {
    return {
      dashboard: { view: true, manage: false, approve: false, export: true },
      products: { view: true, manage: true, approve: false, export: true },
      inventory: { view: true, manage: true, approve: true, export: false },
      orders: { view: true, manage: true, approve: true, export: true },
      offers: { view: true, manage: true, approve: false, export: false },
      branches_staff: { view: true, manage: true, approve: true, export: false },
      profile: { view: true, manage: true, approve: false, export: false },
      finance: { view: true, manage: false, approve: false, export: false }
    };
  }
}
