import { firstValueFrom } from 'rxjs';
import { StaffBranchesService } from './staff-branches.service';
import { defaultOperatingHours } from '../models/staff-branches.models';

describe('StaffBranchesService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists branch creation into workspace storage', async () => {
    const service = new StaffBranchesService();
    const before = await firstValueFrom(service.getBranches());

    service.createBranch({
      name: 'Test Branch',
      code: 'TEST-01',
      isPrimary: false,
      phone: '+201000001111',
      managerName: 'Test Manager',
      managerContact: 'manager@example.com',
      region: 'CENTRAL',
      city: 'RIYADH',
      addressLine: 'Main street',
      deliveryRadiusKm: 8,
      operatingHours: defaultOperatingHours()
    });

    const after = await firstValueFrom(service.getBranches());
    const stored = JSON.parse(localStorage.getItem('vendor_staff_workspace') || '{}') as { branches?: Array<{ name: string }> };

    expect(after.length).toBe(before.length + 1);
    expect(stored.branches?.some((branch) => branch.name === 'Test Branch')).toBeTrue();
  });

  it('restores persisted state for a fresh service instance', async () => {
    new StaffBranchesService();
    const stored = JSON.parse(localStorage.getItem('vendor_staff_workspace') || '{}') as {
      branches: Array<Record<string, unknown>>;
    };

    stored.branches.unshift({
      id: 'branch-persisted',
      name: 'Persisted Branch',
      code: 'PERSIST-01',
      isPrimary: false,
      status: 'pending',
      phone: '+201000002222',
      managerName: 'Persisted Manager',
      managerContact: 'persisted@example.com',
      region: 'CENTRAL',
      city: 'RIYADH',
      addressLine: 'Warehouse district',
      deliveryRadiusKm: 6,
      workingDays: 7,
      createdAt: '2026-04-02T10:00:00.000Z',
      operatingHours: defaultOperatingHours()
    });
    localStorage.setItem('vendor_staff_workspace', JSON.stringify(stored));

    const secondService = new StaffBranchesService();
    const branches = await firstValueFrom(secondService.getBranches());

    expect(branches.some((branch) => branch.name === 'Persisted Branch')).toBeTrue();
  });

  it('resets to the seed workspace state', async () => {
    const service = new StaffBranchesService();

    service.createBranch({
      name: 'Reset Branch',
      code: 'RESET-01',
      isPrimary: false,
      phone: '+201000003333',
      managerName: 'Reset Manager',
      managerContact: 'reset@example.com',
      region: 'CENTRAL',
      city: 'RIYADH',
      addressLine: 'Reset avenue',
      deliveryRadiusKm: 5,
      operatingHours: defaultOperatingHours()
    });

    service.resetSeedState();
    const branches = await firstValueFrom(service.getBranches());

    expect(branches.some((branch) => branch.name === 'Reset Branch')).toBeFalse();
    expect(localStorage.getItem('vendor_staff_workspace')).not.toBeNull();
  });
});
