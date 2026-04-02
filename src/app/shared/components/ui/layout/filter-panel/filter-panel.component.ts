import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AppPanelHeaderComponent } from '../panel-header/panel-header.component';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, AppPanelHeaderComponent],
  template: `
    <div [class]="resolvedWrapperClass">
      <app-panel-header
        [title]="title"
        [subtitle]="subtitle"
        [translateTitle]="translateTitle"
        [translateSubtitle]="translateSubtitle"
        containerClass="border-b border-slate-100 px-6 py-4"
        contentClass="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        titleClass="text-[0.95rem] font-black text-slate-900"
        subtitleClass="text-[0.72rem] font-bold text-slate-500"
      >
        <ng-content select="[actions]"></ng-content>
      </app-panel-header>

      <div [class]="resolvedBodyClass">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class AppFilterPanelComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() translateTitle = true;
  @Input() translateSubtitle = true;
  @Input() wrapperClass = '';
  @Input() bodyClass = '';

  get resolvedWrapperClass(): string {
    return `overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-sm animate-in slide-in-from-top-2 duration-300 ${this.wrapperClass}`.trim();
  }

  get resolvedBodyClass(): string {
    return this.bodyClass || 'grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4';
  }
}
