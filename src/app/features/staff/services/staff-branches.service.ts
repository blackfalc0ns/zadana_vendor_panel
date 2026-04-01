import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { VendorProfileService } from '../../settings/services/vendor-profile.service';
import {
  buildWorkEmail,
  normalizeCompanyDomain,
  resolveWorkEmailProvisioningStatus
} from '../../../shared/utils/work-email.utils';
import {
  BranchCreationInput,
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
  createRoleTemplatePermissions,
  defaultOperatingHours
} from '../models/staff-branches.models';

interface StaffWorkspaceState {
  branches: BranchVm[];
  employees: EmployeeVm[];
  invitations: InvitationVm[];
}

@Injectable({
  providedIn: 'root'
})
export class StaffBranchesService {
  private readonly stateSubject = new BehaviorSubject<StaffWorkspaceState>(this.buildInitialState());

  constructor(private readonly vendorProfileService: VendorProfileService) {}

  getBranches(): Observable<BranchVm[]> {
    return this.stateSubject.pipe(map((state) => state.branches));
  }

  getBranchById(branchId: string): Observable<BranchVm | undefined> {
    return this.stateSubject.pipe(map((state) => state.branches.find((branch) => branch.id === branchId)));
  }

  getEmployees(): Observable<EmployeeVm[]> {
    return this.stateSubject.pipe(map((state) => state.employees));
  }

  getEmployeeById(employeeId: string): Observable<EmployeeVm | undefined> {
    return this.stateSubject.pipe(map((state) => state.employees.find((employee) => employee.id === employeeId)));
  }

  getInvitations(): Observable<InvitationVm[]> {
    return this.stateSubject.pipe(map((state) => state.invitations));
  }

  getInvitationById(invitationId: string): Observable<InvitationVm | undefined> {
    return this.stateSubject.pipe(map((state) => state.invitations.find((invitation) => invitation.id === invitationId)));
  }

  createBranch(input: BranchCreationInput): BranchVm {
    const branch: BranchVm = {
      id: this.generateId('branch'),
      name: input.name.trim(),
      code: input.code.trim() || this.generateBranchCode(input.name),
      isPrimary: input.isPrimary,
      status: 'pending',
      phone: input.phone.trim(),
      managerName: input.managerName.trim(),
      managerContact: input.managerContact.trim(),
      region: input.region,
      city: input.city,
      addressLine: input.addressLine.trim(),
      deliveryRadiusKm: input.deliveryRadiusKm,
      workingDays: countOpenDays(input.operatingHours),
      createdAt: new Date().toISOString(),
      operatingHours: cloneOperatingHours(input.operatingHours)
    };

    const manager = this.buildEmployee({
      fullName: input.managerName,
      contact: input.managerContact,
      roleTemplate: 'branch_manager',
      branchIds: [branch.id],
      permissions: createRoleTemplatePermissions('branch_manager')
    }, 'invited');

    const invitation = this.buildInvitation(
      'branch_manager',
      input.managerName,
      input.managerContact,
      [branch.id]
    );

    this.setState((state) => ({
      branches: [branch, ...state.branches],
      employees: [manager, ...state.employees],
      invitations: [invitation, ...state.invitations]
    }));

    return branch;
  }

  updateBranchStatus(branchId: string, status: BranchVm['status']): void {
    this.setState((state) => ({
      ...state,
      branches: state.branches.map((branch) =>
        branch.id === branchId
          ? { ...branch, status }
          : branch
      )
    }));
  }

  inviteEmployee(input: EmployeeInviteInput): EmployeeVm {
    const employee = this.buildEmployee(input, 'invited');
    const invitation = this.buildInvitation('employee', input.fullName, input.contact, input.branchIds);

    this.setState((state) => ({
      branches: state.branches,
      employees: [employee, ...state.employees],
      invitations: [invitation, ...state.invitations]
    }));

    return employee;
  }

  createEmployee(input: EmployeeInviteInput): EmployeeVm {
    const employee = this.buildEmployee(input, 'active');

    this.setState((state) => ({
      ...state,
      employees: [employee, ...state.employees]
    }));

    return employee;
  }

  updateEmployeePermissions(employeeId: string, roleTemplate: RoleTemplate, permissions: EmployeeVm['permissions']): void {
    this.setState((state) => ({
      ...state,
      employees: state.employees.map((employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              roleTemplate,
              jobTitle: this.getTemplateLabelKey(roleTemplate),
              permissions: clonePermissionMatrix(permissions)
            }
          : employee
      )
    }));
  }

  updateEmployeeStatus(employeeId: string, status: EmployeeStatus): void {
    this.setState((state) => ({
      ...state,
      employees: state.employees.map((employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              status,
              lastActiveAt: status === 'active' ? new Date().toISOString() : employee.lastActiveAt
            }
          : employee
      )
    }));
  }

  resendInvitation(invitationId: string): void {
    const sentAt = new Date().toISOString();
    const expiresAt = this.createExpiryDate(sentAt);

    this.setState((state) => ({
      ...state,
      invitations: state.invitations.map((invitation) =>
        invitation.id === invitationId
          ? {
              ...invitation,
              status: 'pending',
              sentAt,
              expiresAt
            }
          : invitation
      )
    }));
  }

  revokeInvitation(invitationId: string): void {
    this.setState((state) => ({
      ...state,
      invitations: state.invitations.map((invitation) =>
        invitation.id === invitationId
          ? {
              ...invitation,
              status: 'revoked'
            }
          : invitation
      )
    }));
  }

  private buildEmployee(input: EmployeeInviteInput, status: EmployeeStatus): EmployeeVm {
    const companyDomain = this.currentCompanyDomain;
    const workEmail = input.workEmail || buildWorkEmail(input.fullName, companyDomain, input.contact);

    return {
      id: this.generateId('employee'),
      fullName: input.fullName.trim(),
      jobTitle: this.getTemplateLabelKey(input.roleTemplate),
      contact: input.contact.trim(),
      workEmail,
      emailProvisioningStatus: input.emailProvisioningStatus || resolveWorkEmailProvisioningStatus(companyDomain),
      status,
      roleTemplate: input.roleTemplate,
      branchIds: [...input.branchIds],
      permissions: clonePermissionMatrix(input.permissions),
      lastActiveAt: status === 'active' ? new Date().toISOString() : null
    };
  }

  private buildInvitation(type: InvitationType, targetName: string, contact: string, branchIds: string[]): InvitationVm {
    const id = this.generateId('invite');
    const sentAt = new Date().toISOString();

    return {
      id,
      type,
      targetName: targetName.trim(),
      contact: contact.trim(),
      branchIds: [...branchIds],
      status: 'pending',
      sentAt,
      expiresAt: this.createExpiryDate(sentAt),
      link: `https://vendor.zadana.app/invitations/${id}`
    };
  }

  private buildInitialState(): StaffWorkspaceState {
    const companyDomain = this.currentCompanyDomain || 'moderntech.com';
    const domainStatus = resolveWorkEmailProvisioningStatus(companyDomain);
    const primaryBranchId = this.generateId('branch');
    const northBranchId = this.generateId('branch');
    const warehouseBranchId = this.generateId('branch');

    const branches: BranchVm[] = [
      {
        id: primaryBranchId,
        name: 'الفرع الرئيسي - القاهرة',
        code: 'HQ-CAR-01',
        isPrimary: true,
        status: 'active',
        phone: '+201000000101',
        managerName: 'أحمد خالد',
        managerContact: 'ahmed.khaled@moderntech.com',
        region: 'CENTRAL',
        city: 'RIYADH',
        addressLine: 'المقر الرئيسي - شارع العليا التجاري',
        deliveryRadiusKm: 14,
        workingDays: 7,
        createdAt: '2026-01-18T10:00:00.000Z',
        operatingHours: defaultOperatingHours()
      },
      {
        id: northBranchId,
        name: 'فرع التحضير السريع',
        code: 'BR-RYD-02',
        isPrimary: false,
        status: 'pending',
        phone: '+201000000202',
        managerName: 'سارة نبيل',
        managerContact: 'sara.nabil@moderntech.com',
        region: 'CENTRAL',
        city: 'RIYADH',
        addressLine: 'حي النرجس - بوابة الخدمات السريعة',
        deliveryRadiusKm: 9,
        workingDays: 6,
        createdAt: '2026-03-20T08:30:00.000Z',
        operatingHours: defaultOperatingHours().map((hour, index) =>
          index === 6 ? { ...hour, isOpen: false } : hour
        )
      },
      {
        id: warehouseBranchId,
        name: 'فرع المخزون والدعم',
        code: 'WH-RYD-03',
        isPrimary: false,
        status: 'suspended',
        phone: '+201000000303',
        managerName: 'محمد سمير',
        managerContact: 'mohamed.sameer@moderntech.com',
        region: 'CENTRAL',
        city: 'RIYADH',
        addressLine: 'المنطقة اللوجستية - المستودع الشرقي',
        deliveryRadiusKm: 6,
        workingDays: 5,
        createdAt: '2026-02-11T12:15:00.000Z',
        operatingHours: defaultOperatingHours().map((hour, index) =>
          index >= 5 ? { ...hour, isOpen: false } : hour
        )
      }
    ];

    const employees: EmployeeVm[] = [
      {
        id: this.generateId('employee'),
        fullName: 'أحمد خالد',
        jobTitle: this.getTemplateLabelKey('branch_manager'),
        contact: 'ahmed.khaled@moderntech.com',
        workEmail: buildWorkEmail('Ø£Ø­Ù…Ø¯ Ø®Ø§Ù„Ø¯', companyDomain, 'ahmed.khaled@moderntech.com'),
        emailProvisioningStatus: domainStatus,
        status: 'active',
        roleTemplate: 'branch_manager',
        branchIds: [primaryBranchId],
        permissions: createRoleTemplatePermissions('branch_manager'),
        lastActiveAt: '2026-04-01T08:45:00.000Z'
      },
      {
        id: this.generateId('employee'),
        fullName: 'نورا حسين',
        jobTitle: this.getTemplateLabelKey('orders_clerk'),
        contact: '+201055555111',
        workEmail: buildWorkEmail('Ù†ÙˆØ±Ø§ Ø­Ø³ÙŠÙ†', companyDomain, '+201055555111'),
        emailProvisioningStatus: domainStatus,
        status: 'invited',
        roleTemplate: 'orders_clerk',
        branchIds: [northBranchId],
        permissions: createRoleTemplatePermissions('orders_clerk'),
        lastActiveAt: null
      },
      {
        id: this.generateId('employee'),
        fullName: 'محمود طارق',
        jobTitle: this.getTemplateLabelKey('inventory_clerk'),
        contact: 'mahmoud.tarek@moderntech.com',
        workEmail: buildWorkEmail('Ù…Ø­Ù…ÙˆØ¯ Ø·Ø§Ø±Ù‚', companyDomain, 'mahmoud.tarek@moderntech.com'),
        emailProvisioningStatus: domainStatus,
        status: 'suspended',
        roleTemplate: 'inventory_clerk',
        branchIds: [warehouseBranchId],
        permissions: createRoleTemplatePermissions('inventory_clerk'),
        lastActiveAt: '2026-03-27T14:20:00.000Z'
      }
    ];

    const invitations: InvitationVm[] = [
      {
        id: this.generateId('invite'),
        type: 'branch_manager',
        targetName: 'سارة نبيل',
        contact: 'sara.nabil@moderntech.com',
        branchIds: [northBranchId],
        status: 'pending',
        sentAt: '2026-03-20T09:00:00.000Z',
        expiresAt: '2026-04-05T09:00:00.000Z',
        link: 'https://vendor.zadana.app/invitations/branch-manager-1'
      },
      {
        id: this.generateId('invite'),
        type: 'employee',
        targetName: 'نورا حسين',
        contact: '+201055555111',
        branchIds: [northBranchId],
        status: 'pending',
        sentAt: '2026-03-29T11:30:00.000Z',
        expiresAt: '2026-04-05T11:30:00.000Z',
        link: 'https://vendor.zadana.app/invitations/orders-clerk-1'
      },
      {
        id: this.generateId('invite'),
        type: 'employee',
        targetName: 'خالد مراد',
        contact: 'khaled.mourad@moderntech.com',
        branchIds: [primaryBranchId, warehouseBranchId],
        status: 'accepted',
        sentAt: '2026-03-12T10:10:00.000Z',
        expiresAt: '2026-03-19T10:10:00.000Z',
        link: 'https://vendor.zadana.app/invitations/ops-accepted-1'
      }
    ];

    return {
      branches,
      employees,
      invitations
    };
  }

  private setState(projector: (state: StaffWorkspaceState) => StaffWorkspaceState): void {
    this.stateSubject.next(projector(this.stateSubject.value));
  }

  private createExpiryDate(dateText: string): string {
    const date = new Date(dateText);
    date.setDate(date.getDate() + 7);
    return date.toISOString();
  }

  private generateId(prefix: string): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private generateBranchCode(name: string): string {
    const normalized = name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 8);

    return `${normalized || 'BRANCH'}-${Math.floor(10 + Math.random() * 89)}`;
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

  private get currentCompanyDomain(): string {
    return normalizeCompanyDomain(this.vendorProfileService.getProfileSnapshot().companyDomain);
  }
}
