export type StaffView = 'branches' | 'employees' | 'invitations';

export type BranchStatus = 'active' | 'pending' | 'suspended' | 'archived';
export type EmployeeStatus = 'invited' | 'active' | 'suspended';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type InvitationType = 'branch_manager' | 'employee';
export type RoleTemplate = 'branch_manager' | 'orders_clerk' | 'inventory_clerk';
export type PermissionAction = 'view' | 'manage' | 'approve' | 'export';
export type PermissionModuleId =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'offers'
  | 'branches_staff'
  | 'profile'
  | 'finance';

export interface BranchOperatingHourVm {
  dayKey: string;
  from: string;
  to: string;
  isOpen: boolean;
}

export interface PermissionSet {
  view: boolean;
  manage: boolean;
  approve: boolean;
  export: boolean;
}

export type PermissionMatrixVm = Record<PermissionModuleId, PermissionSet>;

export interface BranchVm {
  id: string;
  name: string;
  code: string;
  isPrimary: boolean;
  status: BranchStatus;
  phone: string;
  managerName: string;
  managerContact: string;
  region: string;
  city: string;
  addressLine: string;
  deliveryRadiusKm: number;
  workingDays: number;
  createdAt: string;
  operatingHours: BranchOperatingHourVm[];
}

export interface EmployeeVm {
  id: string;
  fullName: string;
  jobTitle: string;
  contact: string;
  status: EmployeeStatus;
  roleTemplate: RoleTemplate;
  branchIds: string[];
  permissions: PermissionMatrixVm;
  lastActiveAt: string | null;
}

export interface InvitationVm {
  id: string;
  type: InvitationType;
  targetName: string;
  contact: string;
  branchIds: string[];
  status: InvitationStatus;
  sentAt: string;
  expiresAt: string;
  link: string;
}

export interface BranchCreationInput {
  name: string;
  code: string;
  isPrimary: boolean;
  phone: string;
  managerName: string;
  managerContact: string;
  region: string;
  city: string;
  addressLine: string;
  deliveryRadiusKm: number;
  operatingHours: BranchOperatingHourVm[];
  inviteMessage?: string;
}

export interface EmployeeInviteInput {
  fullName: string;
  contact: string;
  roleTemplate: RoleTemplate;
  branchIds: string[];
  permissions: PermissionMatrixVm;
}

export interface PermissionModuleConfig {
  id: PermissionModuleId;
  labelKey: string;
  actions: PermissionAction[];
}

export interface PermissionActionOption {
  id: PermissionAction;
  labelKey: string;
}

export interface RoleTemplateOption {
  value: RoleTemplate;
  labelKey: string;
  descriptionKey: string;
}

export const STAFF_PERMISSION_ACTIONS: PermissionActionOption[] = [
  { id: 'view', labelKey: 'STAFF_BRANCHES.PERMISSIONS.ACTIONS.VIEW' },
  { id: 'manage', labelKey: 'STAFF_BRANCHES.PERMISSIONS.ACTIONS.MANAGE' },
  { id: 'approve', labelKey: 'STAFF_BRANCHES.PERMISSIONS.ACTIONS.APPROVE' },
  { id: 'export', labelKey: 'STAFF_BRANCHES.PERMISSIONS.ACTIONS.EXPORT' }
];

export const STAFF_PERMISSION_MODULES: PermissionModuleConfig[] = [
  {
    id: 'dashboard',
    labelKey: 'STAFF_BRANCHES.PERMISSIONS.MODULES.DASHBOARD',
    actions: ['view', 'export']
  },
  {
    id: 'products',
    labelKey: 'STAFF_BRANCHES.PERMISSIONS.MODULES.PRODUCTS',
    actions: ['view', 'manage', 'export']
  },
  {
    id: 'inventory',
    labelKey: 'STAFF_BRANCHES.PERMISSIONS.MODULES.INVENTORY',
    actions: ['view', 'manage', 'approve']
  },
  {
    id: 'orders',
    labelKey: 'STAFF_BRANCHES.PERMISSIONS.MODULES.ORDERS',
    actions: ['view', 'manage', 'approve', 'export']
  },
  {
    id: 'offers',
    labelKey: 'STAFF_BRANCHES.PERMISSIONS.MODULES.OFFERS',
    actions: ['view', 'manage']
  },
  {
    id: 'branches_staff',
    labelKey: 'STAFF_BRANCHES.PERMISSIONS.MODULES.BRANCHES_STAFF',
    actions: ['view', 'manage', 'approve']
  },
  {
    id: 'profile',
    labelKey: 'STAFF_BRANCHES.PERMISSIONS.MODULES.PROFILE',
    actions: ['view', 'manage']
  },
  {
    id: 'finance',
    labelKey: 'STAFF_BRANCHES.PERMISSIONS.MODULES.FINANCE',
    actions: ['view', 'approve', 'export']
  }
];

export const ROLE_TEMPLATE_OPTIONS: RoleTemplateOption[] = [
  {
    value: 'branch_manager',
    labelKey: 'STAFF_BRANCHES.TEMPLATES.BRANCH_MANAGER',
    descriptionKey: 'STAFF_BRANCHES.TEMPLATES.BRANCH_MANAGER_HINT'
  },
  {
    value: 'orders_clerk',
    labelKey: 'STAFF_BRANCHES.TEMPLATES.ORDERS_CLERK',
    descriptionKey: 'STAFF_BRANCHES.TEMPLATES.ORDERS_CLERK_HINT'
  },
  {
    value: 'inventory_clerk',
    labelKey: 'STAFF_BRANCHES.TEMPLATES.INVENTORY_CLERK',
    descriptionKey: 'STAFF_BRANCHES.TEMPLATES.INVENTORY_CLERK_HINT'
  }
];

export const STAFF_OPERATING_DAYS: BranchOperatingHourVm[] = [
  { dayKey: 'SETTINGS_PROFILE.DAYS.SATURDAY', from: '09:00', to: '22:00', isOpen: true },
  { dayKey: 'SETTINGS_PROFILE.DAYS.SUNDAY', from: '09:00', to: '22:00', isOpen: true },
  { dayKey: 'SETTINGS_PROFILE.DAYS.MONDAY', from: '09:00', to: '22:00', isOpen: true },
  { dayKey: 'SETTINGS_PROFILE.DAYS.TUESDAY', from: '09:00', to: '22:00', isOpen: true },
  { dayKey: 'SETTINGS_PROFILE.DAYS.WEDNESDAY', from: '09:00', to: '22:00', isOpen: true },
  { dayKey: 'SETTINGS_PROFILE.DAYS.THURSDAY', from: '09:00', to: '23:00', isOpen: true },
  { dayKey: 'SETTINGS_PROFILE.DAYS.FRIDAY', from: '14:00', to: '23:30', isOpen: true }
];

function emptyPermissionSet(): PermissionSet {
  return {
    view: false,
    manage: false,
    approve: false,
    export: false
  };
}

export function createEmptyPermissionMatrix(): PermissionMatrixVm {
  return {
    dashboard: emptyPermissionSet(),
    products: emptyPermissionSet(),
    inventory: emptyPermissionSet(),
    orders: emptyPermissionSet(),
    offers: emptyPermissionSet(),
    branches_staff: emptyPermissionSet(),
    profile: emptyPermissionSet(),
    finance: emptyPermissionSet()
  };
}

export function clonePermissionMatrix(source: PermissionMatrixVm): PermissionMatrixVm {
  return {
    dashboard: { ...source.dashboard },
    products: { ...source.products },
    inventory: { ...source.inventory },
    orders: { ...source.orders },
    offers: { ...source.offers },
    branches_staff: { ...source.branches_staff },
    profile: { ...source.profile },
    finance: { ...source.finance }
  };
}

export function createRoleTemplatePermissions(template: RoleTemplate): PermissionMatrixVm {
  const matrix = createEmptyPermissionMatrix();

  switch (template) {
    case 'branch_manager':
      matrix.dashboard.view = true;
      matrix.dashboard.export = true;
      matrix.products.view = true;
      matrix.products.manage = true;
      matrix.products.export = true;
      matrix.inventory.view = true;
      matrix.inventory.manage = true;
      matrix.inventory.approve = true;
      matrix.orders.view = true;
      matrix.orders.manage = true;
      matrix.orders.approve = true;
      matrix.orders.export = true;
      matrix.offers.view = true;
      matrix.offers.manage = true;
      matrix.branches_staff.view = true;
      matrix.profile.view = true;
      break;

    case 'orders_clerk':
      matrix.dashboard.view = true;
      matrix.orders.view = true;
      matrix.orders.manage = true;
      matrix.orders.approve = true;
      matrix.orders.export = true;
      matrix.inventory.view = true;
      matrix.profile.view = true;
      break;

    case 'inventory_clerk':
      matrix.dashboard.view = true;
      matrix.products.view = true;
      matrix.inventory.view = true;
      matrix.inventory.manage = true;
      matrix.inventory.approve = true;
      matrix.orders.view = true;
      break;
  }

  return matrix;
}

export function cloneOperatingHours(hours: BranchOperatingHourVm[]): BranchOperatingHourVm[] {
  return hours.map((hour) => ({ ...hour }));
}

export function defaultOperatingHours(): BranchOperatingHourVm[] {
  return cloneOperatingHours(STAFF_OPERATING_DAYS);
}

export function countOpenDays(hours: BranchOperatingHourVm[]): number {
  return hours.filter((hour) => hour.isOpen).length;
}
