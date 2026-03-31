import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class AppCardComponent {
  @Input() variant: 'default' | 'glass' | 'outline' = 'default';
  @Input() hover = false;
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() rounded: 'xl' | '2xl' | '3xl' | 'full-pane' = '2xl';
  @Input() customClass = '';

  get cardClasses(): string {
    const base = 'relative overflow-hidden transition-all duration-500';
    
    const variants = {
      default: 'bg-white border border-slate-100 shadow-sm',
      glass: 'premium-glass',
      outline: 'bg-transparent border-2 border-slate-100'
    }[this.variant];

    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }[this.padding];

    const radius = {
      xl: 'rounded-xl',
      '2xl': 'rounded-[2rem]',
      '3xl': 'rounded-[2.5rem]',
      'full-pane': 'rounded-none'
    }[this.rounded];

    const hoverClass = this.hover ? 'premium-card-hover' : '';

    return `${base} ${variants} ${paddings} ${radius} ${hoverClass} ${this.customClass}`;
  }
}
