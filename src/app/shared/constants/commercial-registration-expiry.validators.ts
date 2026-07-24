import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Calendar-month minimum remaining validity for commercial registration. */
export const COMMERCIAL_REGISTRATION_MIN_REMAINING_MONTHS = 1;

export function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  // Clamp overflow (e.g. Jan 31 + 1 month).
  if (result.getDate() < day) {
    result.setDate(0);
  }
  return result;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function commercialRegistrationMinExpiryDate(
  from: Date = new Date(),
  months = COMMERCIAL_REGISTRATION_MIN_REMAINING_MONTHS
): Date {
  return startOfLocalDay(addCalendarMonths(startOfLocalDay(from), months));
}

export function parseDateInputValue(value: unknown): Date | null {
  const raw = (value ?? '').toString().trim();
  if (!raw) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : startOfLocalDay(parsed);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Commercial registration expiry must be at least one calendar month from today
 * (also rejects today and any past date).
 */
export function commercialRegistrationExpiryValidator(
  months = COMMERCIAL_REGISTRATION_MIN_REMAINING_MONTHS
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (!value) {
      return null;
    }

    const expiry = parseDateInputValue(value);
    if (!expiry) {
      return { expiryDateInvalid: true };
    }

    const minimum = commercialRegistrationMinExpiryDate(new Date(), months);
    if (expiry.getTime() < minimum.getTime()) {
      return {
        expiryDateTooSoon: {
          minDate: formatDateInputValue(minimum)
        }
      };
    }

    return null;
  };
}
