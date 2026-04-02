import { CommonModule, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-flash-banner',
  standalone: true,
  imports: [CommonModule, NgClass],
  template: `
    @if (message) {
      <div
        class="rounded-[20px] border px-4 py-3 text-[0.82rem] font-black shadow-sm"
        [ngClass]="resolvedClasses">
        {{ message }}
      </div>
    }
  `
})
export class AppFlashBannerComponent {
  @Input() message = '';
  @Input() tone: 'success' | 'info' | 'warning' | 'error' = 'success';
  @Input() customClass = '';

  get resolvedClasses(): string {
    const toneClasses = {
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      info: 'border-sky-200 bg-sky-50 text-sky-700',
      warning: 'border-amber-200 bg-amber-50 text-amber-700',
      error: 'border-rose-200 bg-rose-50 text-rose-700'
    }[this.tone];

    return `${toneClasses} ${this.customClass}`.trim();
  }
}
