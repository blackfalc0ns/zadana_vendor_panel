import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-page-section-shell',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div [class]="resolvedWrapperClass">
      @if (title || subtitle) {
        <div [class]="resolvedHeaderContainerClass">
          <div [class]="resolvedHeaderContentClass">
            <div>
              @if (title) {
                <h2 [class]="resolvedTitleClass">
                  {{ translateTitle ? (title | translate) : title }}
                </h2>
              }

              @if (subtitle) {
                <p [class]="resolvedSubtitleClass">
                  {{ translateSubtitle ? (subtitle | translate) : subtitle }}
                </p>
              }
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <ng-content select="[actions]"></ng-content>
            </div>
          </div>
        </div>
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
  @Input() headerContainerClass = '';
  @Input() headerContentClass = '';
  @Input() titleClass = '';
  @Input() subtitleClass = '';

  get resolvedWrapperClass(): string {
    return `overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50 ${this.wrapperClass}`.trim();
  }

  get resolvedBodyClass(): string {
    return this.bodyClass;
  }

  get resolvedHeaderContainerClass(): string {
    return this.headerContainerClass || 'border-b border-slate-100 px-6 py-5';
  }

  get resolvedHeaderContentClass(): string {
    return this.headerContentClass || 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between';
  }

  get resolvedTitleClass(): string {
    return this.titleClass || 'text-[1rem] font-black text-slate-900';
  }

  get resolvedSubtitleClass(): string {
    return this.subtitleClass || 'mt-1 text-[0.75rem] font-bold text-slate-500';
  }
}
