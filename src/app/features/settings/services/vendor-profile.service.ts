import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorAuthService } from '../../../core/auth/services/vendor-auth.service';
import { VendorNotificationSoundService, normalizeVendorNotificationSound } from '../../../core/notifications/services/vendor-notification-sound.service';
import { VendorOperatingHour, VendorProfile, VendorReviewAuditEntry, VendorReviewItem, VendorReviewSummary } from '../models/vendor-profile.models';

export type VendorLegalDocumentType = 'commercial' | 'tax' | 'license';

interface ApiEnvelope<T> {
  data?: T;
  Data?: T;
  message?: string;
  Message?: string;
}

interface VendorWorkspaceApi {
  id: string;
  businessNameAr: string;
  businessNameEn: string;
  businessType: string;
  commercialRegistrationNumber: string;
  commercialRegistrationExpiryDate?: string | null;
  taxId?: string | null;
  licenseNumber?: string | null;
  contactEmail: string;
  contactPhone: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  region?: string | null;
  city?: string | null;
  nationalAddress?: string | null;
  primaryBranchLatitude?: number | null;
  primaryBranchLongitude?: number | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  idNumber?: string | null;
  nationality?: string | null;
  payoutCycle?: string | null;
  status: string;
  accountStatus: string;
  rejectionReason?: string | null;
  logoUrl?: string | null;
  commercialRegisterDocumentUrl?: string | null;
  taxDocumentUrl?: string | null;
  licenseDocumentUrl?: string | null;
  createdAtUtc: string;
  countryCode?: string | null;
  complianceProfile?: string | null;
  reviewState?: string | null;
  commercialAccessEnabled?: boolean;
  assignedReviewerId?: string | null;
  assignedReviewerName?: string | null;
  reviewSubmittedAtUtc?: string | null;
  reviewStartedAtUtc?: string | null;
  reviewCompletedAtUtc?: string | null;
  requestedChangesAtUtc?: string | null;
  lastReviewDecision?: string | null;
  reviewSummary?: {
    totalItems: number;
    approvedItems: number;
    pendingVendorItems: number;
    submittedItems: number;
    changesRequestedItems: number;
    waivedItems: number;
  } | null;
  reviewItems?: Array<{
    code: string;
    status: string;
    targetType?: 'field' | 'document' | null;
    step?: number | null;
    reviewerId?: string | null;
    reviewerName?: string | null;
    decisionNote?: string | null;
    lastSubmittedAtUtc?: string | null;
    reviewedAtUtc?: string | null;
  }> | null;
  requiredActions?: Array<{
    code: string;
    message: string;
  }> | null;
  reviewAuditEntries?: Array<{
    id: string;
    kind: string;
    tone: string;
    message: string;
    roleLabel: string;
    authorName: string;
    createdAtUtc: string;
    actorUserId?: string | null;
    reviewItemCode?: string | null;
  }> | null;
  missingDocumentsCount?: number;
  canSubmitForReview?: boolean;
  operationsSettings?: {
    acceptOrders: boolean;
    minimumOrderAmount?: number | null;
    preparationTimeMinutes?: number | null;
  } | null;
  notificationSettings?: {
    emailNotificationsEnabled: boolean;
    smsNotificationsEnabled: boolean;
    newOrdersNotificationsEnabled: boolean;
    notificationSound?: string | null;
  } | null;
  primaryBankAccount?: {
    bankName?: string | null;
    accountHolderName?: string | null;
    iban?: string | null;
    swiftCode?: string | null;
  } | null;
  operatingHours?: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }>;
}

interface VendorStoreAvailabilityStateApi {
  manual_mode?: 'online' | 'offline' | string | null;
  manualMode?: 'online' | 'offline' | string | null;
  manual_reason?: string | null;
  manualReason?: string | null;
  updated_at_utc?: string | null;
  updatedAtUtc?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VendorProfileService {
  private readonly apiUrl = `${environment.apiUrl}/vendors/profile`;
  private readonly storeAvailabilityUrl = `${environment.apiUrl}/vendor/workspace-state/store-availability`;
  private readonly profileSubject = new BehaviorSubject<VendorProfile>(this.getDefaultProfile());
  private hasLoaded = false;

  readonly profile$ = this.profileSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: VendorAuthService,
    private readonly notificationSoundService: VendorNotificationSoundService
  ) {}

  getProfile(): Observable<VendorProfile> {
    return this.profile$;
  }

  getProfileSnapshot(): VendorProfile {
    return this.profileSubject.value;
  }

  loadProfile(force = false): Observable<VendorProfile> {
    if (!this.authService.isAuthenticatedSnapshot) {
      return of(this.profileSubject.value);
    }

    if (this.hasLoaded && !force) {
      return of(this.profileSubject.value);
    }

    return this.fetchProfile().pipe(
      catchError((error) => {
        console.error('Failed to load vendor profile from API.', error);
        return of(this.profileSubject.value);
      })
    );
  }

  loadProfileForGuard(force = false): Observable<VendorProfile> {
    if (!this.authService.hasApiSession) {
      return throwError(() => new Error('No vendor API session available.'));
    }

    if (this.hasLoaded && !force) {
      return of(this.profileSubject.value);
    }

    return this.fetchProfile();
  }

  saveStoreAvailability(manualMode: 'online' | 'offline', manualReason?: string | null): Observable<VendorProfile> {
    const currentProfile = this.profileSubject.value;
    const nextProfile: VendorProfile = {
      ...currentProfile,
      storeManualMode: manualMode,
      storeManualReason: manualMode === 'offline' ? (manualReason?.trim() || null) : null
    };

    return this.updateStoreAvailabilityState(nextProfile).pipe(
      map(() => nextProfile),
      tap((profile) => this.persistProfile(profile))
    );
  }

  saveProfile(profile: VendorProfile): Observable<VendorProfile> {
    const request$ = this.updateStore(profile).pipe(
      switchMap(() => this.updateOwner(profile)),
      switchMap(() => this.updateContact(profile)),
      switchMap(() => this.updateLegal(profile)),
      switchMap(() => this.updateBanking(profile)),
      switchMap(() => this.updateHours(profile)),
      switchMap(() => this.updateOperationsSettings(profile)),
      switchMap(() => this.updateNotificationSettings(profile)),
      switchMap(() => this.updateStoreAvailabilityState(profile)),
      switchMap((): Observable<VendorProfile> => this.fetchProfile()),
      tap((nextProfile) => this.persistProfile(nextProfile))
    );

    return request$ as Observable<VendorProfile>;
  }

  updateOnboardingProfile(profile: VendorProfile): Observable<VendorProfile> {
    return this.updateStore(profile).pipe(
      switchMap(() => this.updateOwner(profile)),
      switchMap(() => this.updateContact(profile)),
      switchMap(() => this.updateLegal(profile)),
      switchMap(() => this.updateBanking(profile)),
      map((workspace) => this.mapWorkspaceToProfile(workspace)),
      tap((nextProfile) => this.persistProfile(nextProfile))
    );
  }

  submitForReview(): Observable<VendorProfile> {
    return this.http.post<ApiEnvelope<VendorWorkspaceApi>>(`${this.apiUrl}/submit-for-review`, {}).pipe(
      map((response) => this.unwrap(response)),
      map((workspace) => this.mapWorkspaceToProfile(workspace)),
      tap((profile) => this.persistProfile(profile))
    );
  }

  uploadLegalDocument(documentType: VendorLegalDocumentType, file: File): Observable<VendorProfile> {
    const directoryMap: Record<VendorLegalDocumentType, string> = {
      commercial: 'uploads/vendors/commercial-register',
      tax: 'uploads/vendors/tax-certificates',
      license: 'uploads/vendors/licenses'
    };
    const propertyMap: Record<VendorLegalDocumentType, keyof Pick<VendorProfile, 'commercialRegisterDocumentUrl' | 'taxDocumentUrl' | 'licenseDocumentUrl'>> = {
      commercial: 'commercialRegisterDocumentUrl',
      tax: 'taxDocumentUrl',
      license: 'licenseDocumentUrl'
    };
    const formData = new FormData();

    formData.append('file', file);
    formData.append('directory', directoryMap[documentType]);

    return this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, formData).pipe(
      switchMap((response) => {
        const currentProfile = this.profileSubject.value;
        const nextProfile = {
          ...currentProfile,
          [propertyMap[documentType]]: response.url
        } as VendorProfile;

        return this.updateLegal(nextProfile);
      }),
      map((workspace) => this.mapWorkspaceToProfile(workspace)),
      tap((profile) => {
        this.hasLoaded = true;
        this.profileSubject.next(profile);
      })
    );
  }

  private updateStore(profile: VendorProfile): Observable<VendorWorkspaceApi> {
    return this.http.put<ApiEnvelope<VendorWorkspaceApi>>(`${this.apiUrl}/store`, {
      businessNameAr: profile.storeNameAr,
      businessNameEn: profile.storeNameEn,
      businessType: profile.businessType,
      contactEmail: profile.supportEmail,
      contactPhone: profile.supportPhone,
      descriptionAr: profile.descriptionAr,
      descriptionEn: profile.descriptionEn,
      logoUrl: profile.logoUrl || null,
      ...(profile.commercialRegisterDocumentUrl ? { commercialRegisterDocumentUrl: profile.commercialRegisterDocumentUrl } : {}),
      region: profile.region,
      city: profile.city,
      nationalAddress: profile.nationalAddress,
      commercialRegistrationNumber: profile.commercialRegistrationNumber
    }).pipe(map((response) => this.unwrap(response)));
  }

  private updateOwner(profile: VendorProfile): Observable<VendorWorkspaceApi> {
    return this.http.put<ApiEnvelope<VendorWorkspaceApi>>(`${this.apiUrl}/owner`, {
      ownerName: profile.ownerName,
      ownerEmail: profile.ownerEmail,
      ownerPhone: profile.ownerPhone,
      idNumber: profile.idNumber,
      nationality: profile.nationality
    }).pipe(map((response) => this.unwrap(response)));
  }

  private updateContact(profile: VendorProfile): Observable<VendorWorkspaceApi> {
    return this.http.put<ApiEnvelope<VendorWorkspaceApi>>(`${this.apiUrl}/contact`, {
      region: profile.region,
      city: profile.city,
      nationalAddress: profile.nationalAddress,
      branchLatitude: profile.branchLatitude ?? null,
      branchLongitude: profile.branchLongitude ?? null
    }).pipe(map((response) => this.unwrap(response)));
  }

  private updateLegal(profile: VendorProfile): Observable<VendorWorkspaceApi> {
    return this.http.put<ApiEnvelope<VendorWorkspaceApi>>(`${this.apiUrl}/legal`, {
      commercialRegistrationNumber: profile.commercialRegistrationNumber,
      commercialRegistrationExpiryDate: profile.expiryDate || null,
      taxId: profile.taxId,
      licenseNumber: profile.licenseNumber,
      ...(profile.commercialRegisterDocumentUrl ? { commercialRegisterDocumentUrl: profile.commercialRegisterDocumentUrl } : {}),
      ...(profile.taxDocumentUrl ? { taxDocumentUrl: profile.taxDocumentUrl } : {}),
      ...(profile.licenseDocumentUrl ? { licenseDocumentUrl: profile.licenseDocumentUrl } : {})
    }).pipe(map((response) => this.unwrap(response)));
  }

  private updateBanking(profile: VendorProfile): Observable<VendorWorkspaceApi> {
    return this.http.put<ApiEnvelope<VendorWorkspaceApi>>(`${this.apiUrl}/banking`, {
      bankName: profile.bankName,
      accountHolderName: profile.ownerName,
      iban: profile.iban,
      swiftCode: profile.swiftCode || null,
      payoutCycle: profile.payoutCycle
    }).pipe(map((response) => this.unwrap(response)));
  }

  private updateHours(profile: VendorProfile): Observable<VendorWorkspaceApi> {
    return this.http.put<ApiEnvelope<VendorWorkspaceApi>>(`${this.apiUrl}/hours`, {
      hours: profile.operatingHours.map((hour) => ({
        dayOfWeek: this.dayKeyToNumber(hour.dayKey),
        openTime: hour.from,
        closeTime: hour.to,
        isOpen: hour.isOpen
      }))
    }).pipe(map((response) => this.unwrap(response)));
  }

  private updateOperationsSettings(profile: VendorProfile): Observable<VendorWorkspaceApi> {
    return this.http.put<ApiEnvelope<VendorWorkspaceApi>>(`${this.apiUrl}/operations-settings`, {
      acceptOrders: profile.acceptOrders ?? true,
      minimumOrderAmount: profile.minimumOrderAmount ?? null,
      preparationTimeMinutes: profile.preparationTimeMinutes ?? null
    }).pipe(map((response) => this.unwrap(response)));
  }

  private updateNotificationSettings(profile: VendorProfile): Observable<VendorWorkspaceApi> {
    return this.http.put<ApiEnvelope<VendorWorkspaceApi>>(`${this.apiUrl}/notification-settings`, {
      emailNotificationsEnabled: profile.emailNotificationsEnabled ?? true,
      smsNotificationsEnabled: profile.smsNotificationsEnabled ?? false,
      newOrdersNotificationsEnabled: profile.newOrdersNotificationsEnabled ?? true,
      notificationSound: normalizeVendorNotificationSound(profile.notificationSound)
    }).pipe(map((response) => this.unwrap(response)));
  }

  private updateStoreAvailabilityState(profile: VendorProfile): Observable<VendorStoreAvailabilityStateApi> {
    const manualMode = profile.storeManualMode === 'offline' ? 'offline' : 'online';
    const manualReason = manualMode === 'offline'
      ? (profile.storeManualReason?.trim() || null)
      : null;

    return this.http.put<VendorStoreAvailabilityStateApi>(this.storeAvailabilityUrl, {
      manual_mode: manualMode,
      manual_reason: manualReason
    });
  }

  private unwrap<T>(response: ApiEnvelope<T> | T): T {
    if (response && typeof response === 'object' && ('Data' in response || 'data' in response)) {
      const envelope = response as ApiEnvelope<T>;
      return (envelope.Data ?? envelope.data) as T;
    }

    return response as T;
  }

  private fetchProfile(): Observable<VendorProfile> {
    return forkJoin({
      workspace: this.http.get<VendorWorkspaceApi>(this.apiUrl),
      storeAvailability: this.http.get<VendorStoreAvailabilityStateApi>(this.storeAvailabilityUrl).pipe(
        catchError(() => of<VendorStoreAvailabilityStateApi>({ manual_mode: 'online', manual_reason: null }))
      )
    }).pipe(
      map(({ workspace, storeAvailability }) => this.mapWorkspaceToProfile(workspace, storeAvailability)),
      tap((profile) => this.persistProfile(profile))
    );
  }

  private persistProfile(profile: VendorProfile): void {
    this.hasLoaded = true;
    this.profileSubject.next(profile);
    this.notificationSoundService.setSound(profile.notificationSound);
    localStorage.setItem('onboarding_biz_name', profile.storeNameAr || profile.storeNameEn || 'Vendor');
  }

  private mapWorkspaceToProfile(
    workspace: VendorWorkspaceApi,
    storeAvailability?: VendorStoreAvailabilityStateApi | null
  ): VendorProfile {
    const operatingHours = [...(workspace.operatingHours || [])]
      .sort((left, right) => this.daySortIndex(left.dayOfWeek) - this.daySortIndex(right.dayOfWeek))
      .map((item) => this.mapHour(item.dayOfWeek, item.openTime, item.closeTime, item.isOpen));
    const manualMode = this.normalizeStoreManualMode(storeAvailability);
    const manualReason = this.normalizeStoreManualReason(storeAvailability);
    const reviewSummary: VendorReviewSummary = workspace.reviewSummary ?? {
      totalItems: 0,
      approvedItems: 0,
      pendingVendorItems: 0,
      submittedItems: 0,
      changesRequestedItems: 0,
      waivedItems: 0
    };
    const reviewItems: VendorReviewItem[] = (workspace.reviewItems ?? []).map((item) => ({
      ...item
    }));
    const reviewAuditEntries: VendorReviewAuditEntry[] = (workspace.reviewAuditEntries ?? []).map((entry) => ({
      ...entry,
      tone: this.normalizeTone(entry.tone)
    }));
    const reviewState = workspace.reviewState || (workspace.status === 'Active' ? 'Verified' : 'AwaitingSubmission');

    return {
      status: workspace.status || '',
      storeNameAr: workspace.businessNameAr || '',
      storeNameEn: workspace.businessNameEn || '',
      businessType: workspace.businessType || '',
      supportPhone: workspace.contactPhone || '',
      supportEmail: workspace.contactEmail || '',
      descriptionAr: workspace.descriptionAr || '',
      descriptionEn: workspace.descriptionEn || '',
      region: workspace.region || '',
      city: workspace.city || '',
      nationalAddress: workspace.nationalAddress || '',
      branchLatitude: workspace.primaryBranchLatitude ?? null,
      branchLongitude: workspace.primaryBranchLongitude ?? null,
      ownerName: workspace.ownerName || '',
      ownerEmail: workspace.ownerEmail || '',
      ownerPhone: workspace.ownerPhone || '',
      idNumber: workspace.idNumber || '',
      nationality: workspace.nationality || '',
      taxId: workspace.taxId || '',
      commercialRegistrationNumber: workspace.commercialRegistrationNumber || '',
      expiryDate: workspace.commercialRegistrationExpiryDate ? workspace.commercialRegistrationExpiryDate.slice(0, 10) : '',
      licenseNumber: workspace.licenseNumber || '',
      bankName: workspace.primaryBankAccount?.bankName || '',
      iban: workspace.primaryBankAccount?.iban || '',
      swiftCode: workspace.primaryBankAccount?.swiftCode || '',
      payoutCycle: workspace.payoutCycle || '',
      hasLogo: !!workspace.logoUrl,
      logoUrl: workspace.logoUrl || null,
      hasCRDoc: !!workspace.commercialRegisterDocumentUrl,
      hasTaxDoc: !!workspace.taxDocumentUrl,
      hasLicenseDoc: !!workspace.licenseDocumentUrl,
      commercialRegisterDocumentUrl: workspace.commercialRegisterDocumentUrl || null,
      taxDocumentUrl: workspace.taxDocumentUrl || null,
      licenseDocumentUrl: workspace.licenseDocumentUrl || null,
      reviewStatus: workspace.status === 'Active' ? 'active' : 'pending',
      reviewState,
      rejectionReason: workspace.rejectionReason || null,
      commercialAccessEnabled: !!workspace.commercialAccessEnabled || workspace.status === 'Active',
      countryCode: workspace.countryCode || 'SA',
      complianceProfile: workspace.complianceProfile || 'SA_DEFAULT',
      assignedReviewerId: workspace.assignedReviewerId || null,
      assignedReviewerName: workspace.assignedReviewerName || null,
      reviewSubmittedAtUtc: workspace.reviewSubmittedAtUtc || null,
      reviewStartedAtUtc: workspace.reviewStartedAtUtc || null,
      reviewCompletedAtUtc: workspace.reviewCompletedAtUtc || null,
      requestedChangesAtUtc: workspace.requestedChangesAtUtc || null,
      lastReviewDecision: workspace.lastReviewDecision || null,
      reviewSummary,
      reviewItems,
      requiredActions: workspace.requiredActions ?? [],
      reviewAuditEntries,
      missingDocumentsCount: workspace.missingDocumentsCount ?? workspace.requiredActions?.length ?? 0,
      canSubmitForReview: workspace.canSubmitForReview ?? false,
      joinedAt: this.formatDate(workspace.createdAtUtc),
      operatingHours: operatingHours.length ? operatingHours : this.getDefaultProfile().operatingHours,
      acceptOrders: workspace.operationsSettings?.acceptOrders ?? true,
      storeManualMode: manualMode,
      storeManualReason: manualReason,
      minimumOrderAmount: workspace.operationsSettings?.minimumOrderAmount ?? null,
      preparationTimeMinutes: workspace.operationsSettings?.preparationTimeMinutes ?? null,
      emailNotificationsEnabled: workspace.notificationSettings?.emailNotificationsEnabled ?? true,
      smsNotificationsEnabled: workspace.notificationSettings?.smsNotificationsEnabled ?? false,
      newOrdersNotificationsEnabled: workspace.notificationSettings?.newOrdersNotificationsEnabled ?? true,
      notificationSound: normalizeVendorNotificationSound(workspace.notificationSettings?.notificationSound)
    };
  }

  private mapHour(dayOfWeek: number, openTime: string, closeTime: string, isOpen: boolean): VendorOperatingHour {
    return {
      dayKey: this.dayNumberToKey(dayOfWeek),
      from: openTime,
      to: closeTime,
      isOpen
    };
  }

  private dayNumberToKey(dayOfWeek: number): string {
    const map: Record<number, string> = {
      0: 'SETTINGS_PROFILE.DAYS.SUNDAY',
      1: 'SETTINGS_PROFILE.DAYS.MONDAY',
      2: 'SETTINGS_PROFILE.DAYS.TUESDAY',
      3: 'SETTINGS_PROFILE.DAYS.WEDNESDAY',
      4: 'SETTINGS_PROFILE.DAYS.THURSDAY',
      5: 'SETTINGS_PROFILE.DAYS.FRIDAY',
      6: 'SETTINGS_PROFILE.DAYS.SATURDAY'
    };

    return map[dayOfWeek] || 'SETTINGS_PROFILE.DAYS.SATURDAY';
  }

  private dayKeyToNumber(dayKey: string): number {
    const map: Record<string, number> = {
      'SETTINGS_PROFILE.DAYS.SUNDAY': 0,
      'SETTINGS_PROFILE.DAYS.MONDAY': 1,
      'SETTINGS_PROFILE.DAYS.TUESDAY': 2,
      'SETTINGS_PROFILE.DAYS.WEDNESDAY': 3,
      'SETTINGS_PROFILE.DAYS.THURSDAY': 4,
      'SETTINGS_PROFILE.DAYS.FRIDAY': 5,
      'SETTINGS_PROFILE.DAYS.SATURDAY': 6
    };

    return map[dayKey] ?? 6;
  }

  private daySortIndex(dayOfWeek: number): number {
    const order = [6, 0, 1, 2, 3, 4, 5];
    const index = order.indexOf(dayOfWeek);
    return index === -1 ? order.length : index;
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  }

  private normalizeTone(value?: string | null): 'info' | 'success' | 'warning' | 'danger' {
    switch ((value || '').toLowerCase()) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
      case 'error':
        return 'danger';
      default:
        return 'info';
    }
  }

  private normalizeStoreManualMode(
    storeAvailability?: VendorStoreAvailabilityStateApi | null
  ): 'online' | 'offline' {
    const value = (storeAvailability?.manual_mode ?? storeAvailability?.manualMode ?? 'online')
      .toString()
      .trim()
      .toLowerCase();

    return value === 'offline' ? 'offline' : 'online';
  }

  private normalizeStoreManualReason(storeAvailability?: VendorStoreAvailabilityStateApi | null): string | null {
    const value = storeAvailability?.manual_reason ?? storeAvailability?.manualReason ?? null;
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private getDefaultProfile(): VendorProfile {
    return {
      status: '',
      storeNameAr: '',
      storeNameEn: '',
      businessType: '',
      supportPhone: '',
      supportEmail: '',
      descriptionAr: '',
      descriptionEn: '',
      region: '',
      city: '',
      nationalAddress: '',
      branchLatitude: null,
      branchLongitude: null,
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      idNumber: '',
      nationality: '',
      taxId: '',
      commercialRegistrationNumber: '',
      expiryDate: '',
      licenseNumber: '',
      bankName: '',
      iban: '',
      swiftCode: '',
      payoutCycle: '',
      hasLogo: false,
      logoUrl: null,
      hasCRDoc: false,
      hasTaxDoc: false,
      hasLicenseDoc: false,
      commercialRegisterDocumentUrl: null,
      taxDocumentUrl: null,
      licenseDocumentUrl: null,
      reviewStatus: 'pending',
      reviewState: 'AwaitingSubmission',
      rejectionReason: null,
      commercialAccessEnabled: false,
      countryCode: 'SA',
      complianceProfile: 'SA_DEFAULT',
      assignedReviewerId: null,
      assignedReviewerName: null,
      reviewSubmittedAtUtc: null,
      reviewStartedAtUtc: null,
      reviewCompletedAtUtc: null,
      requestedChangesAtUtc: null,
      lastReviewDecision: null,
      reviewSummary: {
        totalItems: 0,
        approvedItems: 0,
        pendingVendorItems: 0,
        submittedItems: 0,
        changesRequestedItems: 0,
        waivedItems: 0
      },
      reviewItems: [],
      requiredActions: [],
      reviewAuditEntries: [],
      missingDocumentsCount: 0,
      canSubmitForReview: false,
      joinedAt: '',
      acceptOrders: true,
      storeManualMode: 'online',
      storeManualReason: null,
      minimumOrderAmount: null,
      preparationTimeMinutes: null,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      newOrdersNotificationsEnabled: true,
      notificationSound: normalizeVendorNotificationSound(undefined),
      operatingHours: [
        { dayKey: 'SETTINGS_PROFILE.DAYS.SATURDAY', from: '09:00', to: '22:00', isOpen: true },
        { dayKey: 'SETTINGS_PROFILE.DAYS.SUNDAY', from: '09:00', to: '22:00', isOpen: true },
        { dayKey: 'SETTINGS_PROFILE.DAYS.MONDAY', from: '09:00', to: '22:00', isOpen: true },
        { dayKey: 'SETTINGS_PROFILE.DAYS.TUESDAY', from: '09:00', to: '22:00', isOpen: true },
        { dayKey: 'SETTINGS_PROFILE.DAYS.WEDNESDAY', from: '09:00', to: '22:00', isOpen: true },
        { dayKey: 'SETTINGS_PROFILE.DAYS.THURSDAY', from: '09:00', to: '23:00', isOpen: true },
        { dayKey: 'SETTINGS_PROFILE.DAYS.FRIDAY', from: '14:00', to: '23:30', isOpen: true }
      ]
    };
  }
}
