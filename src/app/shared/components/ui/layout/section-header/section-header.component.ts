import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="headerClasses">
      <div class="flex flex-col gap-1">
        <h2 class="text-xl font-black text-slate-800 tracking-tight leading-none">
          <ng-content select="[title]">{{ title }}</ng-content>
        </h2>
        <p *ngIf="description" class="text-xs font-bold text-slate-400 max-w-lg leading-relaxed">
          {{ description }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class AppSectionHeaderComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() customClass = '';

  get headerClasses(): string {
    return `flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ${this.customClass}`;
  }
}
