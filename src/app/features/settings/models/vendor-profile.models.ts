export interface VendorOperatingHour {
  dayKey: string;
  from: string;
  to: string;
  isOpen: boolean;
}

export interface VendorReviewSummary {
  totalItems: number;
  approvedItems: number;
  pendingVendorItems: number;
  submittedItems: number;
  changesRequestedItems: number;
  waivedItems: number;
}

export interface VendorReviewItem {
  code: string;
  status: string;
  reviewerId?: string | null;
  reviewerName?: string | null;
  decisionNote?: string | null;
  lastSubmittedAtUtc?: string | null;
  reviewedAtUtc?: string | null;
}

export interface VendorRequiredAction {
  code: string;
  message: string;
}

export interface VendorReviewAuditEntry {
  id: string;
  kind: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  message: string;
  roleLabel: string;
  authorName: string;
  createdAtUtc: string;
  actorUserId?: string | null;
  reviewItemCode?: string | null;
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
  hasTaxDoc?: boolean;
  hasLicenseDoc?: boolean;
  commercialRegisterDocumentUrl?: string | null;
  taxDocumentUrl?: string | null;
  licenseDocumentUrl?: string | null;
  reviewStatus: 'active' | 'pending';
  reviewState: string;
  commercialAccessEnabled: boolean;
  countryCode: string;
  complianceProfile: string;
  assignedReviewerId?: string | null;
  assignedReviewerName?: string | null;
  reviewSubmittedAtUtc?: string | null;
  reviewStartedAtUtc?: string | null;
  reviewCompletedAtUtc?: string | null;
  requestedChangesAtUtc?: string | null;
  lastReviewDecision?: string | null;
  reviewSummary: VendorReviewSummary;
  reviewItems: VendorReviewItem[];
  requiredActions: VendorRequiredAction[];
  reviewAuditEntries: VendorReviewAuditEntry[];
  missingDocumentsCount: number;
  canSubmitForReview: boolean;
  joinedAt: string;
  operatingHours: VendorOperatingHour[];
  acceptOrders?: boolean;
  minimumOrderAmount?: number | null;
  preparationTimeMinutes?: number | null;
  emailNotificationsEnabled?: boolean;
  smsNotificationsEnabled?: boolean;
  newOrdersNotificationsEnabled?: boolean;
}
