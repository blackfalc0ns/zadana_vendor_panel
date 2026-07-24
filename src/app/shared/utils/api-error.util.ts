import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

type ApiErrorBody = {
  code?: string;
  errorCode?: string;
  detail?: string;
  message?: string;
  title?: string;
  errors?: Record<string, string[] | string>;
  extensions?: {
    errorCode?: string;
    code?: string;
  };
};

type ApiErrorLike = {
  status?: number;
  error?: ApiErrorBody | string;
  message?: string;
};

export type ApiErrorMessageOptions = {
  fallbackKey?: string;
  codePrefix?: string;
};

export function describeApiError(
  error: unknown,
  translate: TranslateService,
  options: ApiErrorMessageOptions = {}
): string {
  const fallback = translateKey(translate, options.fallbackKey) || translate.instant('COMMON.API_ERRORS.UNKNOWN');
  const candidate = toApiErrorLike(error);
  const body = toApiErrorBody(candidate?.error);

  if (!candidate) {
    return fallback;
  }

  const errorCode = extractErrorCode(body);
  const codeMessage = translateErrorCode(errorCode, translate, options.codePrefix);
  if (codeMessage) {
    return codeMessage;
  }

  if (candidate.status === 0) {
    return translate.instant('COMMON.API_ERRORS.NETWORK');
  }

  // Prefer the API detail/message for auth failures so callers see the real reason
  // (wrong app role, invalid Google token, etc.) instead of a generic permission string.
  if (candidate.status === 401 || candidate.status === 403) {
    const specific = (body?.detail || body?.message || '').trim();
    if (specific) {
      return specific;
    }
    return translate.instant('COMMON.API_ERRORS.UNAUTHORIZED');
  }

  if (candidate.status === 409) {
    return translate.instant('COMMON.API_ERRORS.CONFLICT');
  }

  const validationMessages = extractApiValidationMessages(error);
  if (validationMessages.length) {
    return validationMessages.join(' ');
  }

  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error.trim();
  }

  return body?.detail
    || body?.message
    || body?.title
    || candidate.message
    || fallback;
}

export function extractApiValidationMessages(error: unknown): string[] {
  const body = toApiErrorBody(toApiErrorLike(error)?.error);
  const validation = body?.errors;

  if (!validation) {
    return [];
  }

  return Object.values(validation)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((message): message is string => typeof message === 'string' && message.trim().length > 0)
    .map((message) => message.trim());
}

function extractErrorCode(body: ApiErrorBody | null): string | undefined {
  if (!body) {
    return undefined;
  }

  return body.errorCode || body.code || body.extensions?.errorCode || body.extensions?.code;
}

function translateErrorCode(code: string | undefined, translate: TranslateService, codePrefix?: string): string | null {
  if (!code) {
    return null;
  }

  const scopedKey = codePrefix ? `${codePrefix}.${code}` : null;
  const scopedMessage = translateKey(translate, scopedKey);
  if (scopedMessage) {
    return scopedMessage;
  }

  return translateKey(translate, `COMMON.API_ERROR_CODES.${code}`);
}

function translateKey(translate: TranslateService, key: string | undefined | null): string | null {
  if (!key) {
    return null;
  }

  const message = translate.instant(key);
  return message && message !== key ? message : null;
}

function toApiErrorLike(error: unknown): ApiErrorLike | null {
  if (error instanceof HttpErrorResponse) {
    return error as ApiErrorLike;
  }

  if (typeof error !== 'object' || error === null) {
    return null;
  }

  return error as ApiErrorLike;
}

function toApiErrorBody(errorBody: ApiErrorLike['error']): ApiErrorBody | null {
  if (typeof errorBody !== 'object' || errorBody === null) {
    return null;
  }

  return errorBody;
}
