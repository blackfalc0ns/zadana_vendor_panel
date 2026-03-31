import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class AppButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'ghost' | 'danger-ghost' = 'primary';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() isLoading = false;
  @Input() customClass = '';

  @Output() btnClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const baseClasses = 'btn-base';
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      outline: 'btn-outline',
      danger: 'btn-danger',
      ghost: 'btn-ghost',
      'danger-ghost': 'btn-danger-ghost'
    }[this.variant];

    const sizeClasses = {
      xs: 'h-8 px-2 text-[10px]',
      sm: 'h-9 px-4 text-[10px]',
      md: 'h-12 px-8 text-xs',
      lg: 'h-14 px-10 text-sm'
    }[this.size];

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${this.customClass}`;
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.isLoading) {
      this.btnClick.emit(event);
    }
  }
}
