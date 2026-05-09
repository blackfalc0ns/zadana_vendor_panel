import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { AlertModalComponent, AlertModalData } from '../../../shared/components/ui/overlay/alert-modal/alert-modal.component';

@Injectable({
  providedIn: 'root'
})
export class AlertModalService {
  private dialog = inject(Dialog);

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
}
