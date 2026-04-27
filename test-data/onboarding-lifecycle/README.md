# Vendor Onboarding Lifecycle Test Kit

Use this folder to test the full `/register` -> `/onboarding` lifecycle.

## Local URLs

- Frontend: `http://localhost:4200`
- Backend API in development: `http://localhost:5298/api`
- Register page: `http://localhost:4200/register`
- Onboarding page: `http://localhost:4200/onboarding`

## Files To Upload

- Logo: `files/zadana-test-logo.svg`
- Commercial registration PDF: `files/commercial-registration-sample.pdf`
- Tax certificate PDF: `files/tax-certificate-sample.pdf`
- Operating license PDF: `files/operating-license-sample.pdf`

## Register Step

Use a fresh email each run if the backend rejects duplicate vendor emails.

```text
First name: Lifecycle
Last name: Tester
Store name: Zadana Lifecycle Test Store
Email: lifecycle.tester+001@example.com
Password: Test@12345
Confirm password: Test@12345
```

After submit, the app should save `vendor_register_draft` and redirect to `/onboarding`.

## Onboarding Step 1 - Store And Owner

```text
Business name AR: Zadana Lifecycle Test Store AR
Business name EN: Zadana Lifecycle Test Store
Business type: RETAIL
Contact phone: +966501234567
Description: Test vendor for validating registration draft lifecycle, onboarding submission, file uploads, and local backend integration.
Owner name: Lifecycle Tester
Owner email: lifecycle.tester+001@example.com
Owner phone: 34567+9665012
```

## Onboarding Step 2 - Location

Regions and cities must come from `GET http://localhost:5298/api/geography/regions`.

```text
Region: RIYADH
City: RIYADH
National address: 7293 King Fahd Road, Al Malqa, Riyadh 13524
Latitude: 24.774265
Longitude: 46.738586
```

If `RIYADH` is not available in your seeded database, choose any loaded region/city and keep the latitude/longitude above or click on the map.

## Onboarding Step 3 - Legal

```text
ID number: 1012344321
Nationality: SAUDI
Commercial registration number: 1010123456
CR expiry date: 2027-12-31
Tax ID: 312345678901234
License number: LIC-2026-0001
```

## Onboarding Step 4 - Bank

```text
Bank name: ALRAJHI
Payment cycle: PER_ORDER_DIRECT_PAYOUT
IBAN: SA0380000000608010167519
SWIFT code: RJHISARI

This displays as `طلب بطلب` in Arabic and `Order by order` in English.
```

## Onboarding Step 5 - Documents

Upload:

```text
Logo: files/zadana-test-logo.svg
Commercial registration: files/commercial-registration-sample.pdf
Tax certificate: files/tax-certificate-sample.pdf
Operating license: files/operating-license-sample.pdf
```

## Quick Lifecycle Checks

1. Open `/onboarding` with no draft: should redirect to `/register`.
2. Submit `/register`: should redirect to `/onboarding`.
3. Open DevTools Network: geography and vendor calls should use `http://localhost:5298/api/...`.
4. Submit onboarding: should call `POST http://localhost:5298/api/vendors/register`.
5. After success: `vendor_register_draft` should be removed and user should move to `/submission-success`.
6. Open `/onboarding` while logged in: should redirect to `/dashboard`.

## Console Shortcuts

Use `browser-console-lifecycle-snippets.js` if you want to create a valid or expired draft directly from browser DevTools.
