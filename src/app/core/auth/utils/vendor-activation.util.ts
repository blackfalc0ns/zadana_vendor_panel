export interface VendorActivationSnapshot {
  status?: string | null;
  reviewState?: string | null;
  commercialAccessEnabled?: boolean | null;
}

function normalizeActivationValue(value?: string | null): string {
  return `${value || ''}`.trim().replace(/[\s_-]+/g, '').toLowerCase();
}

export function canAccessVendorDashboard(profile: VendorActivationSnapshot | null | undefined): boolean {
  if (!profile) {
    return false;
  }

  if (profile.commercialAccessEnabled) {
    return true;
  }

  const status = normalizeActivationValue(profile.status);
  const reviewState = normalizeActivationValue(profile.reviewState);

  return status === 'active'
    || status === 'approved'
    || status === 'verified'
    || reviewState === 'verified'
    || reviewState === 'approved'
    || reviewState === 'active';
}
