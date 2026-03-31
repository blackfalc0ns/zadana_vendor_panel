import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-product-status-badge',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div 
      [class]="isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'"
      class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-black transition-all">
      <span class="h-1.5 w-1.5 rounded-full" [class]="isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
      @if (showLabel) {
        {{ (isActive ? 'COMMON.STATUS_ACTIVE' : 'COMMON.STATUS_INACTIVE') | translate }}
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; }
  `]
})
export class ProductStatusBadgeComponent {
  @Input() isActive = false;
  @Input() showLabel = true;
}
