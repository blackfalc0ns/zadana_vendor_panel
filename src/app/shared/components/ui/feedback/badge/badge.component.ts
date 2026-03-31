import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="badgeClasses">
      <span *ngIf="dot" class="w-1.5 h-1.5 rounded-full mr-2" [ngClass]="dotClasses"></span>
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class AppBadgeComponent {
  @Input() variant: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() dot = false;
  @Input() rounded: 'full' | 'lg' = 'full';
  @Input() customClass = '';

  get badgeClasses(): string {
    const base = 'inline-flex items-center font-bold tracking-tight transition-all';
    
    const variants = {
      success: 'bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm shadow-emerald-500/5',
      warning: 'bg-amber-50 text-amber-600 border border-amber-100/50 shadow-sm shadow-amber-500/5',
      error: 'bg-rose-50 text-rose-600 border border-rose-100/50 shadow-sm shadow-rose-500/5',
      info: 'bg-sky-50 text-sky-600 border border-sky-100/50 shadow-sm shadow-sky-500/5',
      primary: 'bg-zadna-primary/5 text-zadna-primary border border-zadna-primary/10 shadow-sm shadow-zadna-primary/5',
      secondary: 'bg-slate-50 text-slate-600 border border-slate-200/50 shadow-sm shadow-slate-500/5'
    }[this.variant];

    const sizes = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-3 py-1 text-[11px]',
      lg: 'px-4 py-1.5 text-[12px]'
    }[this.size];

    const radius = {
      full: 'rounded-full',
      lg: 'rounded-lg'
    }[this.rounded];

    return `${base} ${variants} ${sizes} ${radius} ${this.customClass}`;
  }

  get dotClasses(): string {
    return {
      success: 'bg-emerald-500 animate-pulse',
      warning: 'bg-amber-500 animate-pulse',
      error: 'bg-rose-500 animate-pulse',
      info: 'bg-sky-500 animate-pulse',
      primary: 'bg-zadna-primary animate-pulse',
      secondary: 'bg-slate-400'
    }[this.variant];
  }
}
