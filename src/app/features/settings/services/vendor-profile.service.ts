import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface VendorOperatingHour {
  dayKey: string;
  from: string;
  to: string;
  isOpen: boolean;
}

export interface VendorProfile {
  storeNameAr: string;
  storeNameEn: string;
  businessType: string;
  supportPhone: string;
  supportEmail: string;
  descriptionAr: string;
  descriptionEn: string;
  region: string;
  city: string;
  nationalAddress: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  idNumber: string;
  nationality: string;
  taxId: string;
  commercialRegistrationNumber: string;
  expiryDate: string;
  licenseNumber: string;
  bankName: string;
  iban: string;
  swiftCode: string;
  payoutCycle: string;
  hasLogo: boolean;
  hasCRDoc: boolean;
  reviewStatus: 'active' | 'pending';
  joinedAt: string;
  operatingHours: VendorOperatingHour[];
}

@Injectable({
  providedIn: 'root'
})
export class VendorProfileService {
  private readonly storageKey = 'vendor_profile';
  private readonly profileSubject = new BehaviorSubject<VendorProfile>(this.loadProfile());

  readonly profile$ = this.profileSubject.asObservable();

  getProfile(): Observable<VendorProfile> {
    return this.profile$;
  }

  getProfileSnapshot(): VendorProfile {
    return this.profileSubject.value;
  }

  saveProfile(profile: VendorProfile): void {
    localStorage.setItem(this.storageKey, JSON.stringify(profile));
    localStorage.setItem('onboarding_biz_name', profile.storeNameAr || profile.storeNameEn || 'Vendor');
    this.profileSubject.next(profile);
  }

  private loadProfile(): VendorProfile {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as VendorProfile;
        return {
          ...this.getDefaultProfile(),
          ...parsed
        };
      } catch {
        return this.getDefaultProfile();
      }
    }

    return this.getDefaultProfile();
  }

  private getDefaultProfile(): VendorProfile {
    return {
      storeNameAr: 'مؤسسة التقنية الحديثة التجارية',
      storeNameEn: 'Modern Tech Trading Est.',
      businessType: 'RETAIL',
      supportPhone: '+966501234567',
      supportEmail: 'info@moderntech.com',
      descriptionAr: 'متجر متخصص في بيع الإلكترونيات والأجهزة الذكية مع تجهيزات للشحن السريع وخدمة ما بعد البيع.',
      descriptionEn: 'A store specialized in electronics and smart devices with fast shipping readiness and after-sales support.',
      region: 'CENTRAL',
      city: 'RIYADH',
      nationalAddress: '7293 طريق الملك فهد، حي الملقا، الرياض 13524',
      ownerName: 'عبدالله بن خالد بن عبدالعزيز',
      ownerEmail: 'info@moderntech.com',
      ownerPhone: '+966501234567',
      idNumber: '1012344321',
      nationality: 'SAUDI',
      taxId: '300123456789012',
      commercialRegistrationNumber: '1010123456',
      expiryDate: '2026-12-31',
      licenseNumber: 'L-987654',
      bankName: 'ALRAJHI',
      iban: 'SA1280000000608012345678',
      swiftCode: 'RJHISARI',
      payoutCycle: 'BIWEEKLY',
      hasLogo: true,
      hasCRDoc: true,
      reviewStatus: 'pending',
      joinedAt: '15 Jan 2022',
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
