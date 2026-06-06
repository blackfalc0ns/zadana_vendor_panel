import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import { ToastType } from '../models/toast.models';

export interface AlertModalData {
  title: string;
  message: string;
  type: ToastType;
  confirmText?: string;
  direction?: 'rtl' | 'ltr';
  titleIsTranslationKey?: boolean;
  dedupeKey?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertModalService {
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  open(data: AlertModalData) {
    this.toastService.show({
      title: data.title,
      message: data.message,
      type: data.type,
      titleIsTranslationKey: data.titleIsTranslationKey ?? true,
      dedupeKey: data.dedupeKey,
      source: 'action'
    });
  }

  success(message: string, title: string = 'COMMON.SUCCESS') {
    return this.open({ title, message, type: 'success' });
  }

  error(message: string, title: string = 'COMMON.ERROR') {
    return this.open({ title, message, type: 'error' });
  }

  info(message: string, title: string = 'COMMON.INFO') {
    return this.open({ title, message, type: 'info' });
  }

  warning(message: string, title: string = 'COMMON.WARNING') {
    return this.open({ title, message, type: 'warning' });
  }

  async showAlert(
    message: string,
    title: string = 'COMMON.INFO',
    type: 'info' | 'success' | 'warning' | 'danger' = 'info'
  ): Promise<void> {
    const toastType: ToastType = type === 'danger' ? 'error' : type;
    this.toastService.show({
      title,
      message,
      type: toastType,
      titleIsTranslationKey: true,
      source: 'action'
    });
  }

  async showConfirm(
    message: string,
    title: string = 'COMMON.WARNING',
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'info' | 'success' | 'warning' | 'danger';
      titleIsTranslationKey?: boolean;
      messageIsTranslationKey?: boolean;
      confirmTextIsTranslationKey?: boolean;
      cancelTextIsTranslationKey?: boolean;
    }
  ): Promise<boolean> {
    const isAr = (this.translateService.currentLang || 'ar') === 'ar';

    return this.confirmDialogService.open({
      title,
      message,
      type: options?.type || 'warning',
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      isConfirm: true,
      direction: isAr ? 'rtl' : 'ltr',
      titleIsTranslationKey: options?.titleIsTranslationKey,
      messageIsTranslationKey: options?.messageIsTranslationKey ?? false,
      confirmTextIsTranslationKey: options?.confirmTextIsTranslationKey,
      cancelTextIsTranslationKey: options?.cancelTextIsTranslationKey
    });
  }
}
