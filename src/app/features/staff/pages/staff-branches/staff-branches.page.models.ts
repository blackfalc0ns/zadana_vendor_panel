import {
  BranchOperatingHourVm,
  BranchStatus,
  EmployeeStatus,
  InvitationStatus,
  InvitationType,
  PermissionMatrixVm,
  RoleTemplate
} from '../../models/staff-branches.models';

export interface BranchFilters {
  search: string;
  status: 'all' | BranchStatus;
  city: string;
  manager: string;
}

export interface EmployeeFilters {
  search: string;
  status: 'all' | EmployeeStatus;
  roleTemplate: 'all' | RoleTemplate;
  branchId: 'all' | string;
}

export interface InvitationFilters {
  search: string;
  status: 'all' | InvitationStatus;
  type: 'all' | InvitationType;
  branchId: 'all' | string;
}

export interface BranchWizardDraft {
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

export interface EmployeeModalDraft {
  fullName: string;
  contact: string;
  roleTemplate: RoleTemplate;
  branchIds: string[];
  customizePermissions: boolean;
  permissions: PermissionMatrixVm;
}
