import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AppPanelHeaderComponent } from '../panel-header/panel-header.component';

@Component({
  selector: 'app-page-section-shell',
  standalone: true,
  imports: [CommonModule, AppPanelHeaderComponent],
  template: `
    <div [class]="resolvedWrapperClass">
      @if (title || subtitle) {
        <app-panel-header
          [title]="title"
          [subtitle]="subtitle"
          [translateTitle]="translateTitle"
          [translateSubtitle]="translateSubtitle">
          <ng-content select="[actions]"></ng-content>
        </app-panel-header>
      }

      <div [class]="resolvedBodyClass">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class AppPageSectionShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() translateTitle = true;
  @Input() translateSubtitle = true;
  @Input() wrapperClass = '';
  @Input() bodyClass = '';

  get resolvedWrapperClass(): string {
    return `overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50 ${this.wrapperClass}`.trim();
  }

  get resolvedBodyClass(): string {
    return this.bodyClass;
  }
}
