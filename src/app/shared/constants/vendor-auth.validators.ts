import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Matches backend EmailValidationRules.HasComTopLevelDomain + EmailAddress. */
export function comEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (!value) {
      return null;
    }

    if (!BASIC_EMAIL_PATTERN.test(value)) {
      return { email: true };
    }

    if (!value.toLowerCase().endsWith('.com')) {
      return { comEmail: true };
    }

    return null;
  };
}

export function passwordMatchValidator(
  passwordKey = 'password',
  confirmKey = 'confirmPassword'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const passwordControl = group.get(passwordKey);
    const confirmControl = group.get(confirmKey);

    if (!passwordControl || !confirmControl) {
      return null;
    }

    const password = passwordControl.value ?? '';
    const confirm = confirmControl.value ?? '';

    if (!confirm) {
      return null;
    }

    if (password !== confirm) {
      const existing = { ...(confirmControl.errors || {}) };
      existing['mismatch'] = true;
      confirmControl.setErrors(existing);
      return { mismatch: true };
    }

    if (confirmControl.errors?.['mismatch']) {
      const rest = { ...confirmControl.errors };
      delete rest['mismatch'];
      confirmControl.setErrors(Object.keys(rest).length ? rest : null);
    }

    return null;
  };
}
