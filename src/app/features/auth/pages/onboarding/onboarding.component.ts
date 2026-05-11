import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, map, of, switchMap } from 'rxjs';
import * as L from 'leaflet';

import {
  BANKS,
  BUSINESS_TYPES,
  NATIONALITIES,
  PAYMENT_CYCLES,
  SelectOption,
  RegionOption,
  CityOption
} from '../../constants/vendor-onboarding.constants';
import { GeographyService, SaudiCityDto, SaudiRegionDto } from '../../services/geography.service';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppInputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { AppSelectComponent } from '../../../../shared/components/ui/form-controls/select/select.component';
import { AppCardComponent } from '../../../../shared/components/ui/card/card.component';
import { AppBadgeComponent } from '../../../../shared/components/ui/feedback/badge/badge.component';
import { AppSectionHeaderComponent } from '../../../../shared/components/ui/layout/section-header/section-header.component';
import { OnboardingSeedData, OnboardingStepItem } from '../../models/auth.models';
import { environment } from '../../../../../environments/environment';
import { RegisterVendorPayload } from '../../../../core/auth/models/vendor-auth.models';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';
import { VendorProfile } from '../../../settings/models/vendor-profile.models';
import { VendorProfileService } from '../../../settings/services/vendor-profile.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    TranslateModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectComponent,
    AppCardComponent,
    AppBadgeComponent,
    AppSectionHeaderComponent
  ],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly logoPath = 'assets/images/logo/zadana-mark.svg';
  readonly stepItems: OnboardingStepItem[] = [
    {
      id: 1,
      labelKey: 'ONBOARDING.STEP_BASIC',
      sectionKey: 'ONBOARDING.SECTIONS.BASIC_INFO'
    },
    {
      id: 2,
      labelKey: 'ONBOARDING.STEP_LOCATION',
      sectionKey: 'ONBOARDING.SECTIONS.LOCATION'
    },
    {
      id: 3,
      labelKey: 'ONBOARDING.STEP_LEGAL',
      sectionKey: 'ONBOARDING.SECTIONS.LEGAL'
    },
    {
      id: 4,
      labelKey: 'ONBOARDING.STEP_FINANCE',
      sectionKey: 'ONBOARDING.SECTIONS.FINANCE'
    },
    {
      id: 5,
      labelKey: 'ONBOARDING.STEP_DOCS',
      sectionKey: 'ONBOARDING.SECTIONS.DOCS'
    }
  ];
  readonly stepDescriptionKeys: Record<number, string> = {
    1: 'ONBOARDING.STEP_DESCRIPTIONS.BASIC',
    2: 'ONBOARDING.STEP_DESCRIPTIONS.LOCATION',
    3: 'ONBOARDING.STEP_DESCRIPTIONS.LEGAL',
    4: 'ONBOARDING.STEP_DESCRIPTIONS.FINANCE',
    5: 'ONBOARDING.STEP_DESCRIPTIONS.DOCS'
  };
  readonly vendorSeed: OnboardingSeedData = {
    store: {
      businessNameAr: 'مؤسسة التقنية الحديثة التجارية',
      businessNameEn: 'Modern Tech Trading Est.',
      businessType: 'RETAIL',
      contactPhone: '+966501234567',
      description: 'متجر متخصص في بيع الإلكترونيات والأجهزة الذكية مع تجهيزات للشحن السريع وخدمة ما بعد البيع.',
      region: 'CENTRAL',
      city: 'RIYADH',
      nationalAddress: '7293 طريق الملك فهد، حي الملقا، الرياض 13524',
      registrationDate: '15 Jan 2022'
    },
    owner: {
      fullName: 'عبدالله بن خالد بن عبدالعزيز',
      email: 'info@moderntech.com',
      phone: '+966501234567',
      idNumber: '1012344321',
      nationality: 'SAUDI'
    },
    legal: {
      commercialRegistrationNumber: '1010123456',
      expiryDate: '2026-12-31',
      taxId: '300123456789012',
      licenseNumber: 'L-987654'
    },
    banking: {
      bankName: 'ALRAJHI',
      iban: 'SA1280000000608012345678',
      swiftCode: 'RJHISARI',
      paymentCycle: 'BIWEEKLY'
    },
    meta: {
      reviewStatusAr: 'قيد المراجعة',
      reviewStatusEn: 'In review',
      lastUpdate: '18:01 - 14/03/2026',
      syncedFromAr: 'مستوحى من ملف Vendor Details في لوحة السوبر أدمن لتكون المراجعة أوضح وأسهل.',
      syncedFromEn: 'Inspired by the Vendor Details view in the super admin panel for clearer review.'
    }
  };

  onboardingForm!: FormGroup;
  currentStep = 1;
  totalSteps = this.stepItems.length;
  isSubmitting = false;
  submissionError = '';
  isEditMode = false;
  private currentProfile: VendorProfile | null = null;
  storeLogo: File | null = null;
  crDocument: File | null = null;
  taxDocument: File | null = null;
  licenseDocument: File | null = null;
  isLocating = false;
  locationError = '';

  // Leaflet map
  private leafletMap: L.Map | null = null;
  private leafletMarker: L.Marker | null = null;
  private readonly defaultCenter: L.LatLngExpression = [24.7136, 46.6753]; // Riyadh
  private readonly defaultZoom = 6;

  businessTypes: SelectOption[] = BUSINESS_TYPES;
  regions: RegionOption[] = [];
  allCities: CityOption[] = [];
  filteredCities: CityOption[] = [];
  nationalities: SelectOption[] = NATIONALITIES;
  banks: SelectOption[] = BANKS;
  paymentCycles: SelectOption[] = PAYMENT_CYCLES;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private http: HttpClient,
    private authService: VendorAuthService,
    private ngZone: NgZone,
    private geographyService: GeographyService,
    private profileService: VendorProfileService
  ) {
    const savedLang = localStorage.getItem('vendor_lang') || localStorage.getItem('lang') || 'ar';
    this.translate.use(savedLang);
  }

  ngOnInit(): void {
    this.isEditMode = this.route.snapshot.queryParamMap.get('mode') === 'edit';
    this.initForm();
    if (this.isEditMode) {
      this.relaxEditModeValidators();
      this.loadProfileForEdit();
    } else {
      this.patchSeedData();
    }
    this.loadRegions();

    this.onboardingForm.get('step2.region')?.valueChanges.subscribe((regionValue: string) => {
      if (regionValue) {
        this.onRegionChange(regionValue);
        return;
      }

      this.allCities = [];
      this.filteredCities = [];
    });

    this.onboardingForm.get('step2.city')?.valueChanges.subscribe((cityValue: string) => {
      if (cityValue) {
        this.onCityChange(cityValue);
      }
    });
  }
  ngAfterViewInit(): void {
    // Delay map init so the DOM is ready
    setTimeout(() => this.initLeafletMap(), 300);
  }

  ngOnDestroy(): void {
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
  }

  get isRTL(): boolean {
    const lang = this.translate.currentLang || localStorage.getItem('vendor_lang') || localStorage.getItem('lang') || 'ar';
    return lang === 'ar';
  }

  get activeStep(): OnboardingStepItem {
    return this.stepItems[this.currentStep - 1];
  }

  get activeStepDescriptionKey(): string {
    return this.stepDescriptionKeys[this.currentStep];
  }

  get progressPercentage(): number {
    return Math.round((this.currentStep / this.totalSteps) * 100);
  }

  get completionPercentage(): number {
    const completed = this.stepItems.filter((step) => this.getStepGroup(step.id).valid).length;
    return Math.round((completed / this.totalSteps) * 100);
  }

  get hasBranchCoordinates(): boolean {
    const step2 = this.getStepGroup(2);
    return !!step2.get('branchLatitude')?.value && !!step2.get('branchLongitude')?.value;
  }

  get reviewStatusLabelKey(): string {
    return 'DASHBOARD.STATUS_LIVE'; // Or similar status key
  }

  get syncedFromLabelKey(): string {
    return 'ONBOARDING.SYNC_SOURCE_HELP'; 
  }

  switchLanguage(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('vendor_lang', lang);
    localStorage.setItem('lang', lang);
    this.refreshLocalizedGeographyLabels(lang);
  }

  nextStep(): void {
    const currentGroup = this.getStepGroup(this.currentStep);
    if (currentGroup.invalid) {
      currentGroup.markAllAsTouched();
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      // Reinitialise map when entering step 2
      if (this.currentStep === 2) {
        setTimeout(() => this.initLeafletMap(), 200);
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  setStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      // Reinitialise map when navigating to step 2
      if (step === 2) {
        setTimeout(() => this.initLeafletMap(), 200);
      }
    }
  }

  /**
   * Called when the user selects a region.
   * Filters cities dropdown and pans the map to the region center.
   */
  onRegionChange(regionValue: string, preferredCity = ''): void {
    const step2 = this.getStepGroup(2);
    if (!preferredCity) {
      step2.get('city')?.setValue('', { emitEvent: false });
    }
    this.allCities = [];
    this.filteredCities = [];

    const region = this.regions.find((item) => item.value === regionValue);
    if (region && this.leafletMap) {
      this.leafletMap.setView([region.lat, region.lng], region.zoom);
    }

    this.geographyService.getCities(regionValue).subscribe({
      next: (cities) => {
        if (step2.get('region')?.value !== regionValue) {
          return;
        }

        this.allCities = cities.map((city) => this.toCityOption(city));
        this.filteredCities = this.allCities;
        if (preferredCity && this.filteredCities.some((city) => city.value === preferredCity)) {
          step2.get('city')?.setValue(preferredCity, { emitEvent: false });
          this.onCityChange(preferredCity);
        }
      },
      error: () => {
        this.allCities = [];
        this.filteredCities = [];
      }
    });
  }

  onCityChange(cityValue: string): void {
    const city = this.filteredCities.find((item) => item.value === cityValue);
    if (city && this.leafletMap) {
      this.leafletMap.setView([city.lat, city.lng], city.zoom);
    }
  }
  onLogoSelected(event: Event): void {
    const file = this.getSelectedFile(event);
    if (!file) {
      return;
    }

    this.storeLogo = file;
    this.onboardingForm.get('step5.hasLogo')?.setValue(true);
    this.onboardingForm.get('step5.hasLogo')?.markAsTouched();
  }

  onCRDocSelected(event: Event): void {
    const file = this.getSelectedFile(event);
    if (!file) {
      return;
    }

    if (!this.isPdfFile(file)) {
      this.submissionError = this.isRTL
        ? 'يجب رفع السجل التجاري بصيغة PDF.'
        : 'Commercial registration must be uploaded as a PDF file.';
      return;
    }

    this.crDocument = file;
    this.submissionError = '';
    this.onboardingForm.get('step5.hasCRDoc')?.setValue(true);
    this.onboardingForm.get('step5.hasCRDoc')?.markAsTouched();
  }

  onTaxDocSelected(event: Event): void {
    const file = this.getSelectedFile(event);
    if (!file) {
      return;
    }

    if (!this.isPdfFile(file)) {
      this.submissionError = this.isRTL
        ? 'يجب رفع الشهادة الضريبية بصيغة PDF.'
        : 'Tax certificate must be uploaded as a PDF file.';
      return;
    }

    this.taxDocument = file;
    this.submissionError = '';
    this.onboardingForm.get('step5.hasTaxDoc')?.setValue(true);
    this.onboardingForm.get('step5.hasTaxDoc')?.markAsTouched();
  }

  onLicenseDocSelected(event: Event): void {
    const file = this.getSelectedFile(event);
    if (!file) {
      return;
    }

    if (!this.isPdfFile(file)) {
      this.submissionError = this.isRTL
        ? 'يجب رفع الرخصة بصيغة PDF.'
        : 'License document must be uploaded as a PDF file.';
      return;
    }

    this.licenseDocument = file;
    this.submissionError = '';
    this.onboardingForm.get('step5.hasLicenseDoc')?.setValue(true);
    this.onboardingForm.get('step5.hasLicenseDoc')?.markAsTouched();
  }

  triggerFileInput(inputId: string): void {
    document.getElementById(inputId)?.click();
  }

  removeFile(type: 'logo' | 'cr' | 'tax' | 'license'): void {
    if (type === 'logo') {
      this.storeLogo = null;
      this.onboardingForm.get('step5.hasLogo')?.setValue(false);
      const input = document.getElementById('logoInput') as HTMLInputElement | null;
      if (input) {
        input.value = '';
      }
      return;
    }

    if (type === 'cr') {
      this.crDocument = null;
      this.onboardingForm.get('step5.hasCRDoc')?.setValue(false);
      const input = document.getElementById('crInput') as HTMLInputElement | null;
      if (input) {
        input.value = '';
      }
      return;
    }

    if (type === 'tax') {
      this.taxDocument = null;
      this.onboardingForm.get('step5.hasTaxDoc')?.setValue(false);
      const input = document.getElementById('taxInput') as HTMLInputElement | null;
      if (input) {
        input.value = '';
      }
      return;
    }

    this.licenseDocument = null;
    this.onboardingForm.get('step5.hasLicenseDoc')?.setValue(false);
    const input = document.getElementById('licenseInput') as HTMLInputElement | null;
    if (input) {
      input.value = '';
    }
  }

  /**
   * Initialise the interactive Leaflet map for step 2.
   * Uses OpenStreetMap tiles (free, no API key required).
   */
  private initLeafletMap(): void {
    const container = document.getElementById('leaflet-map-container');
    if (!container) return;

    // Avoid double-init
    if (this.leafletMap) {
      this.leafletMap.invalidateSize();
      return;
    }

    // Fix default marker icon path issue in Angular/webpack
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const defaultIcon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = defaultIcon;

    this.leafletMap = L.map(container, {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.leafletMap);

    // Click handler â†’ set marker + update form
    this.leafletMap.on('click', (e: L.LeafletMouseEvent) => {
      this.ngZone.run(() => {
        this.placeMarker(e.latlng.lat, e.latlng.lng);
        this.setBranchCoordinates(e.latlng.lat, e.latlng.lng);
      });
    });

    // If coordinates already exist, place marker
    if (this.hasBranchCoordinates) {
      const step2 = this.onboardingForm.get('step2') as FormGroup;
      const lat = Number(step2.get('branchLatitude')?.value);
      const lng = Number(step2.get('branchLongitude')?.value);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        this.placeMarker(lat, lng);
        this.leafletMap.setView([lat, lng], 14);
      }
    }
  }

  /**
   * Place or move the marker on the Leaflet map.
   */
  private placeMarker(lat: number, lng: number): void {
    if (!this.leafletMap) return;

    if (this.leafletMarker) {
      this.leafletMarker.setLatLng([lat, lng]);
    } else {
      this.leafletMarker = L.marker([lat, lng], { draggable: true }).addTo(this.leafletMap);
      // Allow dragging the marker to refine location
      this.leafletMarker.on('dragend', () => {
        const pos = this.leafletMarker!.getLatLng();
        this.ngZone.run(() => {
          this.setBranchCoordinates(pos.lat, pos.lng);
        });
      });
    }

    this.leafletMap.setView([lat, lng], Math.max(this.leafletMap.getZoom(), 13));
  }

  useCurrentLocation(): void {
    this.locationError = '';

    if (!navigator.geolocation) {
      this.locationError = this.translate.instant('ONBOARDING.MAP.GEO_UNSUPPORTED');
      return;
    }

    this.isLocating = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isLocating = false;
        const { latitude, longitude } = position.coords;
        this.setBranchCoordinates(latitude, longitude);
        this.placeMarker(latitude, longitude);
      },
      () => {
        this.isLocating = false;
        this.locationError = this.translate.instant('ONBOARDING.MAP.GEO_FAILED');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  }

  onSubmit(): void {
    this.stepItems.forEach((step) => this.getStepGroup(step.id).markAllAsTouched());
    this.submissionError = '';

    if (this.onboardingForm.invalid) {
      this.currentStep = this.stepItems.find((step) => this.getStepGroup(step.id).invalid)?.id ?? 1;
      return;
    }

    if (this.isEditMode) {
      this.submitEditMode();
      return;
    }

    const draft = this.authService.getValidRegistrationDraft();
    if (!draft) {
      this.submissionError = this.translate.instant('ONBOARDING.ERRORS.START_FROM_REGISTER');
      void this.router.navigate(['/register']);
      return;
    }

    this.isSubmitting = true;
    const step1 = this.getStepGroup(1).getRawValue();
    const step2 = this.getStepGroup(2).getRawValue();
    const step3 = this.getStepGroup(3).getRawValue();
    const step4 = this.getStepGroup(4).getRawValue();

    forkJoin({
      logoUrl: this.storeLogo ? this.uploadFile(this.storeLogo, 'uploads/vendors/logos') : of<string | null>(null),
      commercialRegisterDocumentUrl: this.crDocument ? this.uploadFile(this.crDocument, 'uploads/vendors/commercial-register') : of<string | null>(null),
      taxDocumentUrl: this.taxDocument ? this.uploadFile(this.taxDocument, 'uploads/vendors/tax-certificates') : of<string | null>(null),
      licenseDocumentUrl: this.licenseDocument ? this.uploadFile(this.licenseDocument, 'uploads/vendors/licenses') : of<string | null>(null)
    }).pipe(
      map(({ logoUrl, commercialRegisterDocumentUrl, taxDocumentUrl, licenseDocumentUrl }) => {
        const payload: RegisterVendorPayload = {
          fullName: draft.fullName,
          email: draft.email,
          phone: step1.ownerPhone,
          password: draft.password,
          businessNameAr: step1.businessNameAr,
          businessNameEn: step1.businessNameEn,
          businessType: step1.businessType,
          commercialRegistrationNumber: step3.commercialRegistrationNumber,
          commercialRegistrationExpiryDate: step3.expiryDate || null,
          contactEmail: step1.ownerEmail,
          contactPhone: step1.contactPhone,
          descriptionAr: step1.description,
          descriptionEn: step1.description,
          ownerName: step1.ownerName,
          ownerEmail: step1.ownerEmail,
          ownerPhone: step1.ownerPhone,
          idNumber: step3.idNumber,
          nationality: step3.nationality,
          region: step2.region,
          city: step2.city,
          nationalAddress: step2.nationalAddress,
          taxId: step3.taxId,
          licenseNumber: step3.licenseNumber,
          bankName: step4.bankName,
          accountHolderName: step1.ownerName,
          iban: step4.iban,
          swiftCode: step4.swiftCode,
          payoutCycle: step4.paymentCycle,
          logoUrl,
          commercialRegisterDocumentUrl,
          taxDocumentUrl,
          licenseDocumentUrl,
          branchName: draft.preferredStoreName || step1.businessNameEn || step1.businessNameAr,
          branchAddressLine: step2.nationalAddress,
          branchLatitude: Number(step2.branchLatitude),
          branchLongitude: Number(step2.branchLongitude),
          branchContactPhone: step1.contactPhone,
          branchDeliveryRadiusKm: 5
        };

        return payload;
      }),
      switchMap((payload) => this.authService.registerVendor(payload))
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        const currentBizName = this.isRTL ? step1.businessNameAr : step1.businessNameEn;
        localStorage.setItem('onboarding_biz_name', currentBizName || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME'));
        void this.router.navigate(['/submission-success']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.submissionError = error?.error?.detail
          || error?.error?.message
          || error?.message
          || this.translate.instant('ONBOARDING.ERRORS.SUBMIT_FAILED');
      }
    });
  }

  trackStep(_index: number, step: OnboardingStepItem): number {
    return step.id;
  }

  getFieldClasses(step: string, field: string, type: 'input' | 'textarea' | 'select' = 'input'): string {
    const baseClasses = 'w-full rounded-2xl border bg-slate-50 px-4 text-[14px] font-bold text-slate-900 outline-none transition-all duration-200 focus:border-zadna-primary focus:bg-white focus:ring-4 focus:ring-zadna-primary/10';
    const invalidClass = this.isInvalid(step, field) ? 'border-red-300 bg-red-50/80' : 'border-slate-200';
    const sizeClass = type === 'textarea' ? 'min-h-[136px] resize-none py-4' : 'h-14';
    const selectClass = type === 'select' ? 'appearance-none cursor-pointer' : '';

    return [baseClasses, invalidClass, sizeClass, selectClass].join(' ');
  }

  getDirectionalFieldClasses(mode: 'context' | 'ltr' | 'rtl' = 'context', type: 'input' | 'textarea' | 'select' = 'input'): string {
    const baseDir = mode === 'ltr'
      ? 'text-left'
      : mode === 'rtl'
        ? 'text-right'
        : this.isRTL
          ? 'text-right'
          : 'text-left';

    const selectPadding = type === 'select' ? (this.isRTL ? 'pr-4 pl-10' : 'pl-4 pr-10') : '';
    return [baseDir, selectPadding].filter(Boolean).join(' ');
  }

  getFieldDir(mode: 'context' | 'ltr' | 'rtl' = 'context'): 'ltr' | 'rtl' {
    if (mode === 'ltr') {
      return 'ltr';
    }

    if (mode === 'rtl') {
      return 'rtl';
    }

    return this.isRTL ? 'rtl' : 'ltr';
  }

  getPreviewValueClasses(mode: 'context' | 'ltr' | 'rtl' = 'context'): string {
    if (mode === 'ltr') {
      return 'text-left';
    }

    if (mode === 'rtl') {
      return 'text-right';
    }

    return this.isRTL ? 'text-right' : 'text-left';
  }

  getStepButtonClasses(stepId: number): string {
    const isCurrent = this.currentStep === stepId;
    const isComplete = this.onboardingForm.get(`step${stepId}`)?.valid;

    if (isCurrent) {
      return 'border-zadna-primary bg-zadna-primary/5 shadow-sm';
    }

    if (isComplete) {
      return 'border-emerald-200 bg-emerald-50/80';
    }

    return 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50';
  }

  getStepIndexClasses(stepId: number): string {
    const isCurrent = this.currentStep === stepId;
    const isComplete = this.onboardingForm.get(`step${stepId}`)?.valid;

    if (isCurrent) {
      return 'border-zadna-primary bg-white text-zadna-primary';
    }

    if (isComplete) {
      return 'border-emerald-500 bg-emerald-500 text-white';
    }

    return 'border-slate-200 bg-slate-50 text-slate-400';
  }

  getPreviewCardClasses(active: boolean): string {
    return active
      ? 'rounded-3xl border border-zadna-primary/30 bg-zadna-primary/5 p-5'
      : 'rounded-3xl border border-slate-200 bg-white p-5';
  }

  getUploadCardClasses(step: string, field: string): string {
    return this.isInvalid(step, field)
      ? 'rounded-3xl border border-dashed border-red-300 bg-red-50/60 p-5'
      : 'rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-5';
  }

  getCompletionLabel(stepId: number): string {
    if (this.getStepGroup(stepId).valid) {
      return 'ONBOARDING.STEP_STATUS.COMPLETE';
    }

    if (stepId === this.currentStep) {
      return 'ONBOARDING.STEP_STATUS.ACTIVE';
    }

    return 'ONBOARDING.STEP_STATUS.UPCOMING';
  }

  getFileSizeInMb(file: File | null): string {
    if (!file) {
      return '0.00';
    }

    return (file.size / 1024 / 1024).toFixed(2);
  }

  optionLabel(options: SelectOption[], value: string | null | undefined, fallback = 'ONBOARDING.MISSING_VALUE'): string {
    if (!value) {
      return fallback;
    }

    const option = options.find((item) => item.value === value);
    return option?.label ?? option?.labelKey ?? fallback;
  }

  valueOrFallback(value: string | null | undefined, fallback = '-'): string {
    return value && value.trim() ? value : fallback;
  }

  isInvalid(step: string, field: string): boolean {
    const control = this.onboardingForm.get(`step${step}.${field}`);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isPreviewActive(section: 'store' | 'legal' | 'bank' | 'docs'): boolean {
    if (section === 'store') {
      return this.currentStep === 1 || this.currentStep === 2;
    }

    if (section === 'legal') {
      return this.currentStep === 3;
    }

    if (section === 'bank') {
      return this.currentStep === 4;
    }

    return this.currentStep === 5;
  }

  private loadRegions(): void {
    this.geographyService.getRegions().subscribe({
      next: (regions) => {
        this.regions = regions.map((region) => this.toRegionOption(region));

        const selectedRegion = this.getStepGroup(2).get('region')?.value;
        const selectedCity = this.getStepGroup(2).get('city')?.value;
        if (selectedRegion) {
          this.onRegionChange(selectedRegion, selectedCity);
        }
      },
      error: () => {
        this.regions = [];
        this.allCities = [];
        this.filteredCities = [];
      }
    });
  }

  private toRegionOption(region: SaudiRegionDto): RegionOption {
    return {
      value: region.code,
      label: this.localizeName(region.nameAr, region.nameEn),
      nameAr: region.nameAr,
      nameEn: region.nameEn,
      lat: region.latitude,
      lng: region.longitude,
      zoom: region.mapZoom
    };
  }

  private toCityOption(city: SaudiCityDto): CityOption {
    return {
      value: city.code,
      label: this.localizeName(city.nameAr, city.nameEn),
      nameAr: city.nameAr,
      nameEn: city.nameEn,
      region: city.regionCode,
      lat: city.latitude,
      lng: city.longitude,
      zoom: city.mapZoom
    };
  }

  private refreshLocalizedGeographyLabels(lang = this.translate.currentLang || 'ar'): void {
    this.regions = this.regions.map((region) => ({
      ...region,
      label: this.localizeName(region.nameAr, region.nameEn, lang)
    }));

    this.allCities = this.allCities.map((city) => ({
      ...city,
      label: this.localizeName(city.nameAr, city.nameEn, lang)
    }));

    this.filteredCities = this.filteredCities.map((city) => ({
      ...city,
      label: this.localizeName(city.nameAr, city.nameEn, lang)
    }));
  }

  private localizeName(nameAr?: string, nameEn?: string, lang = this.translate.currentLang || 'ar'): string {
    return lang === 'ar'
      ? (nameAr || nameEn || '')
      : (nameEn || nameAr || '');
  }

  private initForm(): void {
    this.onboardingForm = this.fb.group({
      step1: this.fb.group({
        businessNameAr: ['', [Validators.required, Validators.minLength(3)]],
        businessNameEn: ['', [Validators.required, Validators.minLength(3)]],
        businessType: ['', Validators.required],
        contactPhone: ['', [Validators.required, Validators.pattern(/^([0-9+]{9,15})$/)]],
        description: ['', [Validators.required, Validators.maxLength(500)]],
        ownerName: ['', [Validators.required, Validators.minLength(3)]],
        ownerEmail: ['', [Validators.required, Validators.email]],
        ownerPhone: ['', [Validators.required, Validators.pattern(/^([0-9+]{9,15})$/)]]
      }),
      step2: this.fb.group({
        region: ['', Validators.required],
        city: ['', Validators.required],
        nationalAddress: ['', Validators.required],
        branchLatitude: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
        branchLongitude: ['', [Validators.required, Validators.min(-180), Validators.max(180)]]
      }),
      step3: this.fb.group({
        idNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        nationality: ['', Validators.required],
        commercialRegistrationNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        expiryDate: ['', Validators.required],
        taxId: ['', [Validators.required, Validators.pattern(/^3[0-9]{14}$/)]],
        licenseNumber: ['']
      }),
      step4: this.fb.group({
        bankName: ['', Validators.required],
        iban: ['', [Validators.required, Validators.pattern(/^SA[a-zA-Z0-9]{22}$/)]],
        swiftCode: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(11)]],
        paymentCycle: ['', Validators.required]
      }),
      step5: this.fb.group({
        hasLogo: [false],
        hasCRDoc: [false, Validators.requiredTrue],
        hasTaxDoc: [false, Validators.requiredTrue],
        hasLicenseDoc: [false, Validators.requiredTrue]
      })
    });
  }

  private relaxEditModeValidators(): void {
    const step2 = this.getStepGroup(2);
    step2.get('branchLatitude')?.clearValidators();
    step2.get('branchLatitude')?.updateValueAndValidity();
    step2.get('branchLongitude')?.clearValidators();
    step2.get('branchLongitude')?.updateValueAndValidity();

    const step5 = this.getStepGroup(5);
    ['hasCRDoc', 'hasTaxDoc', 'hasLicenseDoc'].forEach((field) => {
      step5.get(field)?.clearValidators();
      step5.get(field)?.updateValueAndValidity();
    });
  }

  private loadProfileForEdit(): void {
    this.profileService.loadProfileForGuard(true).subscribe({
      next: (profile) => {
        this.currentProfile = profile;
        this.patchProfileData(profile);
      },
      error: (error) => {
        this.submissionError = error?.error?.detail
          || error?.error?.message
          || error?.message
          || this.translate.instant('ONBOARDING.ERRORS.SUBMIT_FAILED');
      }
    });
  }

  private patchProfileData(profile: VendorProfile): void {
    this.onboardingForm.reset({
      step1: {
        businessNameAr: profile.storeNameAr,
        businessNameEn: profile.storeNameEn,
        businessType: profile.businessType,
        contactPhone: profile.supportPhone,
        description: profile.descriptionAr || profile.descriptionEn,
        ownerName: profile.ownerName,
        ownerEmail: profile.ownerEmail,
        ownerPhone: profile.ownerPhone
      },
      step2: {
        region: profile.region,
        city: profile.city,
        nationalAddress: profile.nationalAddress,
        branchLatitude: '',
        branchLongitude: ''
      },
      step3: {
        idNumber: profile.idNumber,
        nationality: profile.nationality,
        commercialRegistrationNumber: profile.commercialRegistrationNumber,
        expiryDate: profile.expiryDate,
        taxId: profile.taxId,
        licenseNumber: profile.licenseNumber
      },
      step4: {
        bankName: profile.bankName,
        iban: profile.iban,
        swiftCode: profile.swiftCode,
        paymentCycle: profile.payoutCycle
      },
      step5: {
        hasLogo: profile.hasLogo,
        hasCRDoc: profile.hasCRDoc,
        hasTaxDoc: profile.hasTaxDoc,
        hasLicenseDoc: profile.hasLicenseDoc
      }
    });

    if (profile.region && this.regions.length) {
      this.onRegionChange(profile.region, profile.city);
    }
  }

  private patchSeedData(): void {
    const defaultAr = this.translate.instant('COMMON.DEFAULT_VENDOR_NAME');
    const defaultEn = 'Modern Tech Trading Est.';
    const draft = this.authService.getValidRegistrationDraft();

    this.onboardingForm.patchValue({
      step1: {
        businessNameAr: draft?.preferredStoreName || defaultAr || this.vendorSeed.store.businessNameAr,
        businessNameEn: draft?.preferredStoreName || defaultEn || this.vendorSeed.store.businessNameEn,
        businessType: this.vendorSeed.store.businessType,
        contactPhone: this.vendorSeed.store.contactPhone,
        description: this.vendorSeed.store.description,
        ownerName: draft?.fullName || this.vendorSeed.owner.fullName,
        ownerEmail: draft?.email || this.vendorSeed.owner.email,
        ownerPhone: this.vendorSeed.owner.phone
      },
      step2: {
        region: this.vendorSeed.store.region,
        city: this.vendorSeed.store.city,
        nationalAddress: this.vendorSeed.store.nationalAddress
      },
      step3: {
        idNumber: this.vendorSeed.owner.idNumber,
        nationality: this.vendorSeed.owner.nationality,
        commercialRegistrationNumber: this.vendorSeed.legal.commercialRegistrationNumber,
        expiryDate: this.vendorSeed.legal.expiryDate,
        taxId: this.vendorSeed.legal.taxId,
        licenseNumber: this.vendorSeed.legal.licenseNumber
      },
      step4: {
        bankName: this.vendorSeed.banking.bankName,
        iban: this.vendorSeed.banking.iban,
        swiftCode: this.vendorSeed.banking.swiftCode,
        paymentCycle: this.vendorSeed.banking.paymentCycle
      }
    });

    this.onboardingForm.reset({
      step1: {
        businessNameAr: draft?.preferredStoreName || '',
        businessNameEn: draft?.preferredStoreName || '',
        businessType: '',
        contactPhone: '',
        description: '',
        ownerName: draft?.fullName || '',
        ownerEmail: draft?.email || '',
        ownerPhone: ''
      },
      step2: {
        region: '',
        city: '',
        nationalAddress: '',
        branchLatitude: '',
        branchLongitude: ''
      },
      step3: {
        idNumber: '',
        nationality: '',
        commercialRegistrationNumber: '',
        expiryDate: '',
        taxId: '',
        licenseNumber: ''
      },
      step4: {
        bankName: '',
        iban: '',
        swiftCode: '',
        paymentCycle: ''
      },
      step5: {
        hasLogo: false,
        hasCRDoc: false,
        hasTaxDoc: false,
        hasLicenseDoc: false
      }
    });

    // Reset localStorage if it was broken so the header updates immediately
    const stored = localStorage.getItem('onboarding_biz_name');
    if (stored && (stored.includes('Ã™') || stored.includes('Ã˜'))) {
       localStorage.removeItem('onboarding_biz_name');
    }
  }

  private getStepGroup(step: number): FormGroup {
    return this.onboardingForm.get(`step${step}`) as FormGroup;
  }

  private getSelectedFile(event: Event): File | null {
    const input = event.target as HTMLInputElement | null;
    return input?.files?.item(0) ?? null;
  }

  private isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  private setBranchCoordinates(latitude: number, longitude: number): void {
    const step2 = this.getStepGroup(2);
    step2.patchValue({
      branchLatitude: latitude.toFixed(6),
      branchLongitude: longitude.toFixed(6)
    });
    step2.get('branchLatitude')?.markAsTouched();
    step2.get('branchLongitude')?.markAsTouched();
    step2.updateValueAndValidity();
  }

  private submitEditMode(): void {
    const profile = this.currentProfile || this.profileService.getProfileSnapshot();
    if (!profile.status) {
      this.submissionError = this.translate.instant('ONBOARDING.ERRORS.SUBMIT_FAILED');
      return;
    }

    this.isSubmitting = true;
    const step1 = this.getStepGroup(1).getRawValue();
    const step2 = this.getStepGroup(2).getRawValue();
    const step3 = this.getStepGroup(3).getRawValue();
    const step4 = this.getStepGroup(4).getRawValue();

    forkJoin({
      logoUrl: this.storeLogo ? this.uploadFile(this.storeLogo, 'uploads/vendors/logos') : of<string | null>(null),
      commercialRegisterDocumentUrl: this.crDocument ? this.uploadFile(this.crDocument, 'uploads/vendors/commercial-register') : of<string | null>(null),
      taxDocumentUrl: this.taxDocument ? this.uploadFile(this.taxDocument, 'uploads/vendors/tax-certificates') : of<string | null>(null),
      licenseDocumentUrl: this.licenseDocument ? this.uploadFile(this.licenseDocument, 'uploads/vendors/licenses') : of<string | null>(null)
    }).pipe(
      map(({ logoUrl, commercialRegisterDocumentUrl, taxDocumentUrl, licenseDocumentUrl }) => ({
        ...profile,
        storeNameAr: step1.businessNameAr,
        storeNameEn: step1.businessNameEn,
        businessType: step1.businessType,
        supportPhone: step1.contactPhone,
        supportEmail: step1.ownerEmail,
        descriptionAr: step1.description,
        descriptionEn: step1.description,
        ownerName: step1.ownerName,
        ownerEmail: step1.ownerEmail,
        ownerPhone: step1.ownerPhone,
        region: step2.region,
        city: step2.city,
        nationalAddress: step2.nationalAddress,
        idNumber: step3.idNumber,
        nationality: step3.nationality,
        commercialRegistrationNumber: step3.commercialRegistrationNumber,
        expiryDate: step3.expiryDate,
        taxId: step3.taxId,
        licenseNumber: step3.licenseNumber,
        bankName: step4.bankName,
        iban: step4.iban,
        swiftCode: step4.swiftCode,
        payoutCycle: step4.paymentCycle,
        logoUrl: logoUrl || profile.logoUrl || null,
        hasLogo: !!(logoUrl || profile.logoUrl),
        commercialRegisterDocumentUrl: commercialRegisterDocumentUrl || profile.commercialRegisterDocumentUrl || null,
        taxDocumentUrl: taxDocumentUrl || profile.taxDocumentUrl || null,
        licenseDocumentUrl: licenseDocumentUrl || profile.licenseDocumentUrl || null,
        hasCRDoc: !!(commercialRegisterDocumentUrl || profile.commercialRegisterDocumentUrl),
        hasTaxDoc: !!(taxDocumentUrl || profile.taxDocumentUrl),
        hasLicenseDoc: !!(licenseDocumentUrl || profile.licenseDocumentUrl)
      } as VendorProfile)),
      switchMap((nextProfile) => this.profileService.updateOnboardingProfile(nextProfile)),
      switchMap(() => this.profileService.submitForReview())
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        const currentBizName = this.isRTL ? step1.businessNameAr : step1.businessNameEn;
        localStorage.setItem('onboarding_biz_name', currentBizName || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME'));
        void this.router.navigate(['/submission-success']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.submissionError = error?.error?.detail
          || error?.error?.message
          || error?.message
          || this.translate.instant('ONBOARDING.ERRORS.SUBMIT_FAILED');
      }
    });
  }

  private uploadFile(file: File, directory: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('directory', directory);

    return this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, formData).pipe(
      map((response) => response.url)
    );
  }
}

