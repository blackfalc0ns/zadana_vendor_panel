import { VendorDisputeDetailVm, VendorDisputeListItemVm, VendorDisputePriority, VendorDisputeStatus, VendorDisputeType } from '../models/vendor-disputes.models';

type VendorDisputeLike = Pick<
 VendorDisputeListItemVm | VendorDisputeDetailVm,
 'type' | 'status' | 'settlementStatus' | 'compensationType' | 'message'
>;

export interface VendorDisputeDisplayState {
 displayTypeLabel: string;
 displayTypeMetaLabel: string;
 displayStatusLabel: string;
 displayStatusClass: string;
}

function compactDisputeToken(value: string): string {
 return value.trim().replace(/_/g, '').toLowerCase();
}

export function normalizeVendorDisputeType(value: VendorDisputeType | string): string {
 const compact = compactDisputeToken(value);

 switch (compact) {
 case 'returnrequest':
 return 'return_request';
 case 'driverreport':
 return 'driver_report';
 case 'driverdispute':
 return 'driver_dispute';
 default:
 return value.trim().toLowerCase();
 }
}

export function normalizeVendorDisputeStatus(value: VendorDisputeStatus | string): string {
 const compact = compactDisputeToken(value);

 switch (compact) {
 case 'inreview':
 return 'in_review';
 case 'awaitingcustomerevidence':
 return 'awaiting_customer_evidence';
 default:
 return value.trim().toLowerCase();
 }
}

export function normalizeVendorDisputePriority(value: VendorDisputePriority | string): string {
 return value.trim().toLowerCase();
}

export function getVendorDisputeDisplayState(dispute: VendorDisputeLike, language: string): VendorDisputeDisplayState {
 return {
 displayTypeLabel: getVendorDisputeDisplayTypeLabel(dispute, language),
 displayTypeMetaLabel: getVendorDisputeDisplayTypeMetaLabel(dispute, language),
 displayStatusLabel: getVendorDisputeStatusLabel(dispute.status, language),
 displayStatusClass: getVendorDisputeStatusClass(dispute.status)
 };
}

export function getVendorDisputeTypeLabel(type: VendorDisputeType | string, language: string): string {
 const isArabic = language === 'ar';

 switch (normalizeVendorDisputeType(type)) {
 case 'return_request':
 return isArabic ? 'طلب إرجاع' : 'Return request';
 case 'driver_report':
 return isArabic ? 'بلاغ مندوب' : 'Driver report';
 case 'driver_dispute':
 return isArabic ? 'نزاع مندوب' : 'Driver dispute';
 default:
 return isArabic ? 'شكوى' : 'Complaint';
 }
}

export function getVendorDisputeDisplayTypeLabel(dispute: VendorDisputeLike, language: string): string {
 const isArabic = language === 'ar';
 const type = normalizeVendorDisputeType(dispute.type);
 const status = normalizeVendorDisputeStatus(dispute.status);
 const settlementStatus = (dispute.settlementStatus || '').toLowerCase();

 if (type!== 'return_request') {
 return getVendorDisputeTypeLabel(dispute.type, language);
 }

 if (status === 'resolved') {
 switch (settlementStatus) {
 case 'cash_refunded':
 return isArabic ? 'طلب إرجاع مسترجع' : 'Refunded return request';
 case 'coupon_issued':
 return isArabic ? 'طلب إرجاع معوّض بكوبون' : 'Coupon-compensated return request';
 case 'coupon_redeemed':
 return isArabic ? 'طلب إرجاع مغلق' : 'Closed return request';
 default:
 return isArabic ? 'طلب إرجاع مغلق' : 'Closed return request';
 }
 }

 if (status === 'rejected') {
 return isArabic ? 'طلب إرجاع مرفوض' : 'Rejected return request';
 }

 if (status === 'approved') {
 return settlementStatus === 'coupon_issued'
 ? (isArabic ? 'طلب إرجاع معوّض بكوبون' : 'Coupon-compensated return request')
 : (isArabic ? 'طلب إرجاع معتمد' : 'Approved return request');
 }

 return isArabic ? 'طلب إرجاع' : 'Return request';
}

export function getVendorDisputeDisplayTypeMetaLabel(dispute: VendorDisputeLike, language: string): string {
 const isArabic = language === 'ar';
 const type = normalizeVendorDisputeType(dispute.type);
 const status = normalizeVendorDisputeStatus(dispute.status);
 const settlementStatus = (dispute.settlementStatus || '').toLowerCase();
 const compensationType = (dispute.compensationType || '').toLowerCase();

 if (type!== 'return_request') {
 return dispute.message;
 }

 switch (settlementStatus) {
 case 'coupon_redeemed':
 return isArabic ? 'أُغلقت بعد استخدام الكوبون' : 'Closed after coupon redemption';
 case 'coupon_issued':
 return isArabic ? 'أصدرنا كوبون التعويض للعميل' : 'A compensation coupon was issued to the customer';
 case 'cash_refunded':
 return isArabic ? 'رجّعنا المبلغ للعميل' : 'The customer refund was completed';
 case 'approved':
 return isArabic ? 'اعتمدنا الطلب وهو بانتظار إتمام التسوية' : 'The request was approved and is awaiting settlement completion';
 case 'rejected':
      return isArabic ? 'انرفض طلب الإرجاع' : 'The return request was rejected';
 }

 if (status === 'approved') {
 if (compensationType === 'coupon_compensation') {
 return isArabic ? 'اعتمدنا تعويض العميل بكوبون' : 'Customer compensation was approved as a coupon';
 }

 if (compensationType === 'cash_refund') {
 return isArabic ? 'اعتمدنا رد المبلغ للعميل' : 'Customer cash refund was approved';
 }

      return isArabic ? 'انقبل الطلب ونكمل الإجراء' : 'Approved and awaiting final completion';
 }

 return dispute.message;
}

export function getVendorDisputeStatusLabel(status: VendorDisputeStatus | string, language: string): string {
 const isArabic = language === 'ar';

 switch (normalizeVendorDisputeStatus(status)) {
 case 'submitted':
 return isArabic ? 'مقدمة' : 'Submitted';
 case 'in_review':
 return isArabic ? 'تحت المراجعة' : 'In review';
 case 'awaiting_customer_evidence':
 return isArabic ? 'بانتظار الأدلة' : 'Awaiting evidence';
 case 'approved':
  return isArabic ? 'انقبل' : 'Approved';
 case 'rejected':
 return isArabic ? 'مرفوضة' : 'Rejected';
 case 'resolved':
 return isArabic ? 'مغلقة' : 'Closed';
 default:
 return status;
 }
}

export function getVendorDisputeStatusClass(status: VendorDisputeStatus | string): string {
 switch (normalizeVendorDisputeStatus(status)) {
 case 'in_review':
 return 'border-sky-200 bg-sky-50 text-sky-700';
 case 'awaiting_customer_evidence':
 return 'border-amber-200 bg-amber-50 text-amber-700';
 case 'approved':
 return 'border-emerald-200 bg-emerald-50 text-emerald-700';
 case 'resolved':
 return 'border-slate-200 bg-slate-100 text-slate-700';
 case 'rejected':
 return 'border-rose-200 bg-rose-50 text-rose-700';
 default:
 return 'border-violet-200 bg-violet-50 text-violet-700';
 }
}

export function getVendorDisputeSettlementLabel(value: string | null, language: string): string {
 const isArabic = language === 'ar';

 switch ((value || '').toLowerCase()) {
 case 'cash_refunded':
 return isArabic ? 'رجعنا المبلغ' : 'Cash refunded';
 case 'coupon_issued':
 return isArabic ? 'أصدرنا كوبون' : 'Coupon issued';
 case 'coupon_redeemed':
 return isArabic ? 'استخدم العميل الكوبون' : 'Coupon redeemed';
 case 'approved':
 return isArabic ? 'اعتماد بانتظار التسوية' : 'Approved, awaiting settlement';
 case 'rejected':
 return isArabic ? 'انرفضت' : 'Rejected';
 default:
 return isArabic ? 'بانتظار المراجعة' : 'Pending review';
 }
}

export function getVendorDisputeSettlementClass(value: string | null): string {
 switch ((value || '').toLowerCase()) {
 case 'cash_refunded':
 return 'border-emerald-200 bg-emerald-50 text-emerald-700';
 case 'coupon_issued':
 case 'coupon_redeemed':
 return 'border-cyan-200 bg-cyan-50 text-cyan-700';
 case 'approved':
 return 'border-indigo-200 bg-indigo-50 text-indigo-700';
 case 'rejected':
 return 'border-rose-200 bg-rose-50 text-rose-700';
 default:
 return 'border-amber-200 bg-amber-50 text-amber-700';
 }
}

export function getVendorDisputeCompensationLabel(value: string | null, language: string): string {
 const isArabic = language === 'ar';

 switch ((value || '').toLowerCase()) {
 case 'cash_refund':
 return isArabic ? 'تعويض نقدي' : 'Cash compensation';
 case 'coupon_compensation':
 return isArabic ? 'تعويض بكوبون' : 'Coupon compensation';
 default:
 return isArabic ? 'قيد التحديد' : 'Pending decision';
 }
}
