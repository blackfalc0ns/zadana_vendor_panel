# Vendor Disputes Display Rules For Mobile

This file documents the display rule that fixed the misleading `Under review` / `قيد المراجعة` badge in the vendor disputes experience.

## Problem

The vendor disputes API returns multiple concepts at the same time:

- `status`: the workflow state of the case itself
- `type`: the base case type
- `settlementStatus`: the outcome of return-request settlement
- `waitingOnRole`: who is expected to reply next

The old UI mixed these concepts together, so a case could appear as:

- closed return request
- closed after coupon redemption
- but still showing `Under review` because `waitingOnRole` was empty and the UI fell back to a generic review label

This is incorrect.

## Correct Display Policy

### 1. Main status

The main status badge must come from `status` only.

- `submitted` => `مقدمة` / `Submitted`
- `in_review` => `قيد المراجعة` / `In review`
- `awaiting_customer_evidence` => `بانتظار الأدلة` / `Awaiting evidence`
- `approved` => `تمت الموافقة` / `Approved`
- `rejected` => `مرفوضة` / `Rejected`
- `resolved` => `مغلقة` / `Closed`

Do not derive the main status from `settlementStatus`.

### 2. Type label

The type label is operational and may be derived from `type + status + settlementStatus`.

For `return_request`:

- before closing => `طلب إرجاع`
- `approved` without final settlement => `طلب إرجاع معتمد`
- `approved` + `coupon_issued` => `طلب إرجاع معوّض بكوبون`
- `resolved` + `cash_refunded` => `طلب إرجاع مسترد`
- `resolved` + `coupon_issued` => `طلب إرجاع معوّض بكوبون`
- `resolved` + `coupon_redeemed` => `طلب إرجاع مغلق`
- `rejected` => `طلب إرجاع مرفوض`

For non-return requests:

- `complaint` => `شكوى`
- `driver_report` => `بلاغ سائق`
- `driver_dispute` => `نزاع سائق`

### 3. Waiting-on badge

The `waitingOnRole` badge is secondary metadata only.

Show it only when all of the following are true:

- `status` is not `resolved`
- `status` is not `rejected`
- `waitingOnRole` is not null/empty

Do not show a fallback `Under review` / `قيد المراجعة` badge when `waitingOnRole` is empty.

This is the exact bug that caused the confusing mobile/web display.

### 4. Settlement badge

`settlementStatus` is an outcome badge for return requests only.

Examples:

- `pending_review`
- `approved`
- `cash_refunded`
- `coupon_issued`
- `coupon_redeemed`
- `rejected`

This badge must not replace the main status badge.

## Mobile Implementation Checklist

- Use `status` for the main status chip.
- Use derived operational text for the type label.
- Hide `waitingOnRole` for `resolved` and `rejected` cases.
- Hide `waitingOnRole` if the backend returns null or empty.
- Keep `settlementStatus` as a separate secondary chip for return requests only.
- Make sure list screen and detail screen use the same mapping rules.

## Expected Examples

### Closed after coupon redemption

Input:

- `type = return_request`
- `status = resolved`
- `settlementStatus = coupon_redeemed`
- `waitingOnRole = null`

Expected:

- main status: `مغلقة`
- type: `طلب إرجاع مغلق`
- type meta: `أُغلقت بعد استخدام الكوبون`
- settlement badge: `تم استخدام الكوبون`
- waiting badge: hidden

### Approved and coupon issued

Input:

- `type = return_request`
- `status = approved`
- `settlementStatus = coupon_issued`

Expected:

- main status: `تمت الموافقة`
- type: `طلب إرجاع معوّض بكوبون`
- settlement badge: `تم إصدار كوبون`

### Rejected return request

Input:

- `type = return_request`
- `status = rejected`
- `waitingOnRole = customer`

Expected:

- main status: `مرفوضة`
- type: `طلب إرجاع مرفوض`
- waiting badge: hidden

## Reference

The current web implementation follows these rules in:

- `src/app/features/disputes/utils/vendor-dispute-display.utils.ts`
- `src/app/features/disputes/pages/vendor-disputes-list/`
- `src/app/features/disputes/pages/vendor-dispute-detail/`
