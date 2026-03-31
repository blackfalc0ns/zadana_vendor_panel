import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-product-media-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div 
      [class]="containerClass"
      class="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-3 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50">
      
      <div 
        [class]="aspectRatio"
        class="overflow-hidden rounded-[24px] bg-slate-50 border border-slate-100">
        <img 
          [src]="imageUrl || 'assets/images/placeholders/product.png'" 
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110">
      </div>

      <!-- Action Overlay -->
      @if (canChange) {
        <div class="absolute inset-x-6 bottom-6 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <button 
            (click)="onChange.emit()"
            class="rounded-xl bg-white/90 px-4 py-2 text-[0.7rem] font-black text-slate-700 shadow-xl backdrop-blur-md transition-all hover:bg-white active:scale-95">
            {{ 'PRODUCTS.CHANGE_IMAGE' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProductMediaCardComponent {
  @Input() imageUrl: string | null = null;
  @Input() canChange = false;
  @Input() aspectRatio = 'aspect-square';
  @Input() containerClass = '';
  
  @Output() onChange = new EventEmitter<void>();
}
