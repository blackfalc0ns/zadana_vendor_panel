import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isValidSaudiMobileNumber } from './saudi-phone.constants';

export function saudiMobilePhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value == null || value === '') {
      return null;
    }

    return isValidSaudiMobileNumber(String(value)) ? null : { saudiMobilePhone: true };
  };
}

export const SAUDI_MOBILE_PHONE_PATTERN = /^\+9665(0|1|3|4|5|6|7|8|9)\d{7}$/;
