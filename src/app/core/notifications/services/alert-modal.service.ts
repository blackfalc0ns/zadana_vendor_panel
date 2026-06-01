import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { AlertModalComponent, AlertModalData } from '../../../shared/components/ui/overlay/alert-modal/alert-modal.component';
import { AppConfirmModalComponent } from '../../../shared/components/ui/overlay/confirm-modal/confirm-modal.component';
import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class AlertModalService {
  private dialog = inject(Dialog);
  private translateService = inject(TranslateService);

  open(data: AlertModalData) {
    return this.dialog.open<void>(AlertModalComponent, {
      data,
      hasBackdrop: false,
      panelClass: ['bg-transparent', 'shadow-none', 'pointer-events-none'],
      closeOnNavigation: false
    });
  }

  success(message: string, title: string = 'COMMON.SUCCESS') {
    return this.open({
      title,
      message,
      type: 'success'
    });
  }

  error(message: string, title: string = 'COMMON.ERROR') {
    return this.open({
      title,
      message,
      type: 'error'
    });
  }

  info(message: string, title: string = 'COMMON.INFO') {
    return this.open({
      title,
      message,
      type: 'info'
    });
  }

  warning(message: string, title: string = 'COMMON.WARNING') {
    return this.open({
      title,
      message,
      type: 'warning'
    });
  }

  async showAlert(message: string, title: string = 'COMMON.INFO', type: 'info' | 'success' | 'warning' | 'danger' = 'info'): Promise<void> {
    const isAr = (this.translateService.currentLang || 'ar') === 'ar';
    const direction = isAr ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open<boolean>(AppConfirmModalComponent, {
      data: {
        title,
        message,
        type,
        confirmText: isAr ? 'موافق' : 'OK',
        isConfirm: false,
        direction
      },
      hasBackdrop: true,
      backdropClass: ['bg-slate-950/45', 'backdrop-blur-sm', 'fixed', 'inset-0'],
      panelClass: ['fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'p-4']
    });
    await firstValueFrom(dialogRef.closed);
  }

  async showConfirm(
    message: string,
    title: string = 'COMMON.WARNING',
    options?: { confirmText?: string; cancelText?: string; type?: 'info' | 'success' | 'warning' | 'danger' }
  ): Promise<boolean> {
    const isAr = (this.translateService.currentLang || 'ar') === 'ar';
    const direction = isAr ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open<boolean>(AppConfirmModalComponent, {
      data: {
        title,
        message,
        type: options?.type || 'warning',
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        isConfirm: true,
        direction
      },
      hasBackdrop: true,
      backdropClass: ['bg-slate-950/45', 'backdrop-blur-sm', 'fixed', 'inset-0'],
      panelClass: ['fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'p-4']
    });
    const result = await firstValueFrom(dialogRef.closed);
    return !!result;
  }
}
