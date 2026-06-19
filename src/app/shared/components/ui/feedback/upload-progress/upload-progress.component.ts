import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { ImageUploadPhase } from '../../../../utils/image-upload-optimizer';

@Component({
  selector: 'app-upload-progress',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full" role="progressbar" [attr.aria-valuenow]="safeProgress" aria-valuemin="0" aria-valuemax="100">
      <div class="mb-2 flex items-center justify-between gap-3">
        <span class="text-[10px] font-black text-slate-600">{{ phaseLabel }}</span>
        <span class="text-[10px] font-black tabular-nums text-zadna-primary">{{ safeProgress }}%</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          class="h-full rounded-full bg-gradient-to-r from-zadna-primary to-cyan-400 transition-[width] duration-200 ease-out"
          [style.width.%]="safeProgress">
        </div>
      </div>
    </div>
  `
})
export class UploadProgressComponent {
  @Input() progress = 0;
  @Input() phase: ImageUploadPhase = 'preparing';

  constructor(private readonly translate: TranslateService) {}

  get safeProgress(): number {
    return Math.max(0, Math.min(100, Math.round(this.progress)));
  }

  get phaseLabel(): string {
    const isArabic = (this.translate.currentLang || 'ar').startsWith('ar');
    if (this.phase === 'preparing') {
      return isArabic ? 'جارٍ تجهيز الصورة' : 'Preparing image';
    }
    return isArabic ? 'جارٍ رفع الصورة' : 'Uploading image';
  }
}
