import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="headerClasses">
      <div class="space-y-1">
        @if (eyebrow) {
          <p class="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-zadna-primary/70">
            {{ eyebrow }}
          </p>
        }

        <h1 class="text-2xl font-black tracking-tight text-slate-900">
          <ng-content select="[title]">{{ title }}</ng-content>
        </h1>

        @if (description) {
          <p class="text-[0.85rem] font-bold text-slate-500">
            {{ description }}
          </p>
        }
      </div>

      <div class="flex flex-wrap items-center gap-3">
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
export class AppPageHeaderComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() eyebrow = '';
  @Input() customClass = '';

  get headerClasses(): string {
    return `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${this.customClass}`.trim();
  }
}
