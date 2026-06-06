import { Component, Input, OnChanges, SimpleChanges, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertModalService } from '../../../../../core/notifications/services/alert-modal.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-flash-banner',
  standalone: true,
  imports: [CommonModule],
  template: ''
})
export class AppFlashBannerComponent implements OnChanges {
  private readonly alertModalService = inject(AlertModalService);
  private readonly translate = inject(TranslateService);

  @Input() message = '';
  @Input() tone: 'success' | 'info' | 'warning' | 'error' = 'success';
  @Input() customClass = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message) {
      const isAr = (this.translate.currentLang || 'ar') === 'ar';
      const direction = isAr ? 'rtl' : 'ltr';

      const typeMap = {
        success: 'success',
        info: 'info',
        warning: 'warning',
        error: 'error'
      } as const;

      const titleMap = {
        success: isAr ? 'نجاح' : 'Success',
        info: isAr ? 'معلومة' : 'Info',
        warning: isAr ? 'تحذير' : 'Warning',
        error: isAr ? 'خطأ' : 'Error'
      };

      this.alertModalService.open({
        title: titleMap[this.tone] || '',
        message: this.message,
        type: typeMap[this.tone] || 'info',
        direction,
        titleIsTranslationKey: false
      });
    }
  }
}
