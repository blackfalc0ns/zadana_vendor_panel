import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConfirmDialogData } from '../models/confirm-dialog.models';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private readonly dialogSubject = new BehaviorSubject<ConfirmDialogData | null>(null);
  private resolveFn: ((result: boolean) => void) | null = null;

  readonly dialog$ = this.dialogSubject.asObservable();

  get activeDialog(): ConfirmDialogData | null {
    return this.dialogSubject.value;
  }

  open(data: ConfirmDialogData): Promise<boolean> {
    if (this.dialogSubject.value) {
      this.close(false);
    }

    return new Promise<boolean>((resolve) => {
      this.resolveFn = resolve;
      this.dialogSubject.next(data);
    });
  }

  close(result: boolean): void {
    this.dialogSubject.next(null);
    this.resolveFn?.(result);
    this.resolveFn = null;
  }
}
