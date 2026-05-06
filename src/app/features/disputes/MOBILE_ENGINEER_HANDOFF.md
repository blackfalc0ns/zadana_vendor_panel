# Mobile Engineer Handoff: Vendor Disputes Fix

This file is the implementation handoff for the mobile developer.

## Goal

Fix the vendor disputes screens so they do not:

- show `Under review` / `قيد المراجعة` for already closed cases
- mix Arabic text inside the English app
- confuse `status`, `type`, `settlementStatus`, and `waitingOnRole`

## API Fields To Use

Use these fields from `api/vendor/order-cases`:

- `status`
- `type`
- `settlementStatus`
- `waitingOnRole`
- `customerVisibleNote`
- `decisionNotes`
- `messages[].body`
- `messages[].title`

## Required Changes

### 1. Main status chip

Render the main status from `status` only.

- `submitted` => `Submitted`
- `in_review` => `In review`
- `awaiting_customer_evidence` => `Awaiting evidence`
- `approved` => `Approved`
- `rejected` => `Rejected`
- `resolved` => `Closed`

Do not use `settlementStatus` for the main status chip.

### 2. Type label

For `return_request`, render a derived operational label:

- default open case => `Return request`
- `approved` without final outcome => `Approved return request`
- `approved` + `coupon_issued` => `Coupon-compensated return request`
- `resolved` + `cash_refunded` => `Refunded return request`
- `resolved` + `coupon_issued` => `Coupon-compensated return request`
- `resolved` + `coupon_redeemed` => `Closed return request`
- `rejected` => `Rejected return request`

For other types:

- `complaint` => `Complaint`
- `driver_report` => `Driver report`
- `driver_dispute` => `Driver dispute`

### 3. Type meta text

For return requests, render a secondary line:

- `coupon_redeemed` => `Closed after coupon redemption`
- `coupon_issued` => `A compensation coupon was issued to the customer`
- `cash_refunded` => `The customer refund was completed`
- `approved` => `The request was approved and is awaiting settlement completion`

If none of the above applies, use the backend message/body if it is already English.

### 4. Waiting-on chip

Show the `waitingOnRole` chip only when:

- `status != resolved`
- `status != rejected`
- `waitingOnRole` is not null
- `waitingOnRole` is not empty

If the case is closed or rejected, hide the waiting chip completely.

Do not show a fallback `Under review` chip when `waitingOnRole` is empty.

### 5. Settlement chip

Keep `settlementStatus` as a secondary chip for return requests only.

Suggested labels:

- `pending_review` => `Pending review`
- `approved` => `Approved, awaiting settlement`
- `cash_refunded` => `Cash refunded`
- `coupon_issued` => `Coupon issued`
- `coupon_redeemed` => `Coupon redeemed`
- `rejected` => `Rejected`

### 6. English-only app behavior

When the mobile app is in English:

- use English labels for status/type/meta locally
- use the backend vendor-case response after the backend fallback fix for:
  - `customerVisibleNote`
  - `decisionNotes`
  - visible activity/message notes

If the app still receives Arabic raw text in these fields, treat that as a backend regression and log the payload.

## Screens To Update

- disputes list screen
- dispute details screen
- any case summary card reused elsewhere in mobile

## Acceptance Cases

### Case A

Input:

- `type = return_request`
- `status = resolved`
- `settlementStatus = coupon_redeemed`
- `waitingOnRole = null`

Expected:

- main status = `Closed`
- type = `Closed return request`
- type meta = `Closed after coupon redemption`
- settlement chip = `Coupon redeemed`
- waiting chip = hidden

### Case B

Input:

- `type = return_request`
- `status = approved`
- `settlementStatus = coupon_issued`

Expected:

- main status = `Approved`
- type = `Coupon-compensated return request`
- settlement chip = `Coupon issued`

### Case C

Input:

- `type = return_request`
- `status = rejected`
- `waitingOnRole = customer`

Expected:

- main status = `Rejected`
- type = `Rejected return request`
- waiting chip = hidden

### Case D

Input:

- app language = English
- backend note/message exists

Expected:

- no Arabic text should appear in visible case notes, decision notes, or visible support updates

## Web Reference

Web already applies the same behavior here:

- `src/app/features/disputes/utils/vendor-dispute-display.utils.ts`
- `src/app/features/disputes/pages/vendor-disputes-list/`
- `src/app/features/disputes/pages/vendor-dispute-detail/`
