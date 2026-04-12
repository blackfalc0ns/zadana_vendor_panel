import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorAuthService } from '../../../core/auth/services/vendor-auth.service';
import { VendorOperatingHour, VendorProfile } from '../models/vendor-profile.models';

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
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  idNumber?: string | null;
  nationality?: string | null;
  payoutCycle?: string | null;
  status: string;
  accountStatus: string;
  logoUrl?: string | null;
  commercialRegisterDocumentUrl?: string | null;
  createdAtUtc: string;
  operationsSettings?: {
    acceptOrders: boolean;
    minimumOrderAmount?: number | null;
    preparationTimeMinutes?: number | null;
  } | null;
  notificationSettings?: {
    emailNotificationsEnabled: boolean;
    smsNotificationsEnabled: boolean;
    newOrdersNotificationsEnabled: boolean;
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

@Injectable({
  providedIn: 'root'
})
export class VendorProfileService {
  private readonly apiUrl = `${environment.apiUrl}/vendors/profile`;
  private readonly profileSubject = new BehaviorSubject<VendorProfile>(this.getDefaultProfile());
  private hasLoaded = false;

  readonly profile$ = this.profileSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: VendorAuthService
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

    return this.http.get<VendorWorkspaceApi>(this.apiUrl).pipe(
      map((workspace) => this.mapWorkspaceToProfile(workspace)),
      tap((profile) => {
        this.hasLoaded = true;
        this.profileSubject.next(profile);
        localStorage.setItem('onboarding_biz_name', profile.storeNameAr || profile.storeNameEn || 'Vendor');
      }),
      catchError((error) => {
        console.error('Failed to load vendor profile from API.', error);
        return of(this.profileSubject.value);
      })
    );
  }

  saveProfile(profile: VendorProfile): Observable<VendorProfile> {
    return this.updateStore(profile).pipe(
      switchMap(() => this.updateOwner(profile)),
      switchMap(() => this.updateContact(profile)),
      switchMap(() => this.updateLegal(profile)),
      switchMap(() => this.updateBanking(profile)),
      switchMap(() => this.updateHours(profile)),
      switchMap(() => this.updateOperationsSettings(profile)),
      switchMap(() => this.updateNotificationSettings(profile)),
      map((workspace) => this.mapWorkspaceToProfile(workspace)),
      tap((nextProfile) => {
        this.hasLoaded = true;
        this.profileSubject.next(nextProfile);
        localStorage.setItem('onboarding_biz_name', nextProfile.storeNameAr || nextProfile.storeNameEn || 'Vendor');
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
      logoUrl: null,
      commercialRegisterDocumentUrl: null,
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
      nationalAddress: profile.nationalAddress
    }).pipe(map((response) => this.unwrap(response)));
  }

  private updateLegal(profile: VendorProfile): Observable<VendorWorkspaceApi> {
    return this.http.put<ApiEnvelope<VendorWorkspaceApi>>(`${this.apiUrl}/legal`, {
      commercialRegistrationNumber: profile.commercialRegistrationNumber,
      commercialRegistrationExpiryDate: profile.expiryDate || null,
      taxId: profile.taxId,
      licenseNumber: profile.licenseNumber,
      commercialRegisterDocumentUrl: null
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
      newOrdersNotificationsEnabled: profile.newOrdersNotificationsEnabled ?? true
    }).pipe(map((response) => this.unwrap(response)));
  }

  private unwrap<T>(response: ApiEnvelope<T> | T): T {
    if (response && typeof response === 'object' && ('Data' in response || 'data' in response)) {
      const envelope = response as ApiEnvelope<T>;
      return (envelope.Data ?? envelope.data) as T;
    }

    return response as T;
  }

  private mapWorkspaceToProfile(workspace: VendorWorkspaceApi): VendorProfile {
    const operatingHours = [...(workspace.operatingHours || [])]
      .sort((left, right) => this.daySortIndex(left.dayOfWeek) - this.daySortIndex(right.dayOfWeek))
      .map((item) => this.mapHour(item.dayOfWeek, item.openTime, item.closeTime, item.isOpen));

    return {
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
      hasCRDoc: !!workspace.commercialRegisterDocumentUrl,
      reviewStatus: workspace.status === 'Active' ? 'active' : 'pending',
      joinedAt: this.formatDate(workspace.createdAtUtc),
      operatingHours: operatingHours.length ? operatingHours : this.getDefaultProfile().operatingHours,
      acceptOrders: workspace.operationsSettings?.acceptOrders ?? true,
      minimumOrderAmount: workspace.operationsSettings?.minimumOrderAmount ?? null,
      preparationTimeMinutes: workspace.operationsSettings?.preparationTimeMinutes ?? null,
      emailNotificationsEnabled: workspace.notificationSettings?.emailNotificationsEnabled ?? true,
      smsNotificationsEnabled: workspace.notificationSettings?.smsNotificationsEnabled ?? false,
      newOrdersNotificationsEnabled: workspace.notificationSettings?.newOrdersNotificationsEnabled ?? true
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

  private getDefaultProfile(): VendorProfile {
    return {
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
      hasCRDoc: false,
      reviewStatus: 'pending',
      joinedAt: '',
      acceptOrders: true,
      minimumOrderAmount: null,
      preparationTimeMinutes: null,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      newOrdersNotificationsEnabled: true,
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
