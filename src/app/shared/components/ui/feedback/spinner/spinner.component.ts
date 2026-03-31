import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="spinnerWrapperClasses">
      <div 
        class="animate-spin rounded-full border-2" 
        [ngStyle]="{
          'width': size + 'px', 
          'height': size + 'px',
          'border-top-color': 'transparent',
          'border-right-color': color === 'white' ? 'white' : 'var(--zadna-primary)',
          'border-bottom-color': color === 'white' ? 'white' : 'var(--zadna-primary)',
          'border-left-color': color === 'white' ? 'white' : 'var(--zadna-primary)'
        }">
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    .animate-spin {
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class AppSpinnerComponent {
  @Input() size: number = 24;
  @Input() color: 'primary' | 'white' = 'primary';
  @Input() customClass: string = '';

  get spinnerWrapperClasses(): string {
    return `flex items-center justify-center ${this.customClass}`;
  }
}
