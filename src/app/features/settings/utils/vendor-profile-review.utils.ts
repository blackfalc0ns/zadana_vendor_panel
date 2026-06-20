import { VendorReviewItem } from '../models/vendor-profile.models';

export const PROFILE_FIELD_REVIEW_CODES: Record<string, string> = {
  storeNameAr: 'step1.businessNameAr',
  storeNameEn: 'step1.businessNameEn',
  businessType: 'step1.businessType',
  supportPhone: 'step1.contactPhone',
  supportEmail: 'step1.contactPhone',
  descriptionAr: 'step1.description',
  descriptionEn: 'step1.description',
  ownerName: 'step1.ownerName',
  ownerEmail: 'step1.ownerEmail',
  ownerPhone: 'step1.ownerPhone',
  region: 'step2.region',
  city: 'step2.city',
  nationalAddress: 'step2.nationalAddress',
  idNumber: 'step3.idNumber',
  nationality: 'step3.nationality',
  commercialRegistrationNumber: 'step3.commercialRegistrationNumber',
  expiryDate: 'step3.expiryDate',
  taxId: 'step3.taxId',
  licenseNumber: 'step3.licenseNumber',
  bankName: 'step4.bankName',
  iban: 'step4.iban',
  swiftCode: 'step4.swiftCode',
  payoutCycle: 'step4.paymentCycle'
};

export const PROFILE_DOCUMENT_REVIEW_CODES: Record<string, string> = {
  commercial: 'step5.commercial',
  tax: 'step5.tax',
  license: 'step5.license',
  logo: 'step5.logo'
};

export function findReviewItemByCode(
  items: VendorReviewItem[],
  codeOrSuffix: string
): VendorReviewItem | undefined {
  const normalized = codeOrSuffix.trim().toLowerCase();

  return items.find((item) => {
    const code = item.code.trim().toLowerCase();
    return code === normalized || code.endsWith(`.${normalized}`) || code.split('.').pop() === normalized;
  });
}

export function findReviewItemForField(
  items: VendorReviewItem[],
  fieldName: string
): VendorReviewItem | undefined {
  const reviewCode = PROFILE_FIELD_REVIEW_CODES[fieldName];
  return reviewCode ? findReviewItemByCode(items, reviewCode) : undefined;
}
