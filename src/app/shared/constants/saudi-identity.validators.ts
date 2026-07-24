import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Saudi National ID (citizens) starts with 1.
 * Iqama / residency ID (non-citizens) starts with 2.
 * Both are 10 digits and must pass the official checksum.
 */
export function isValidSaudiIdentityChecksum(id: string): boolean {
  if (!/^[12]\d{9}$/.test(id)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = Number(id.charAt(i));
    if (i % 2 === 0) {
      const doubled = String(digit * 2).padStart(2, '0');
      sum += Number(doubled.charAt(0)) + Number(doubled.charAt(1));
    } else {
      sum += digit;
    }
  }

  return sum % 10 === 0;
}

export function normalizeNationality(value: unknown): string {
  return (value ?? '').toString().trim().toUpperCase();
}

export function isSaudiNationality(nationality: unknown): boolean {
  return normalizeNationality(nationality) === 'SAUDI';
}

/**
 * Cross-field validator: reads sibling `nationality` from the parent FormGroup.
 * - SAUDI → National ID must start with 1
 * - any other selected nationality → Iqama must start with 2
 */
export function saudiIdentityNumberValidator(nationalityKey = 'nationality'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (!value) {
      return null;
    }

    if (!/^\d{10}$/.test(value)) {
      return { identityDigits: true };
    }

    const nationality = normalizeNationality(control.parent?.get(nationalityKey)?.value);
    const prefix = value.charAt(0);

    if (nationality === 'SAUDI') {
      if (prefix !== '1') {
        return { saudiNationalIdPrefix: true };
      }
    } else if (nationality) {
      if (prefix !== '2') {
        return { iqamaIdPrefix: true };
      }
    } else if (prefix !== '1' && prefix !== '2') {
      return { identityPrefix: true };
    }

    if (!isValidSaudiIdentityChecksum(value)) {
      return { identityChecksum: true };
    }

    return null;
  };
}
