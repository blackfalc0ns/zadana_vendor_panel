import { CommonModule, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-panel-header',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule],
  template: `
    <div [ngClass]="resolvedContainerClass">
      <div [ngClass]="resolvedContentClass">
        @if (eyebrow || title || subtitle) {
          <div>
            @if (eyebrow) {
              <p [ngClass]="resolvedEyebrowClass">
                {{ translateEyebrow ? (eyebrow | translate) : eyebrow }}
              </p>
            }
            @if (title) {
              <h2 [ngClass]="resolvedTitleClass">
                {{ translateTitle ? (title | translate) : title }}
              </h2>
            }
            @if (subtitle) {
              <p [ngClass]="resolvedSubtitleClass">
                {{ translateSubtitle ? (subtitle | translate) : subtitle }}
              </p>
            }
          </div>
        }

        <div class="flex flex-wrap items-center gap-3">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
    </div>
  `
})
export class AppPanelHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() translateEyebrow = true;
  @Input() translateTitle = true;
  @Input() translateSubtitle = true;
  @Input() containerClass = '';
  @Input() contentClass = '';
  @Input() eyebrowClass = '';
  @Input() titleClass = '';
  @Input() subtitleClass = '';

  get resolvedContainerClass(): string {
    return this.containerClass || 'border-b border-slate-100 px-6 py-5';
  }

  get resolvedContentClass(): string {
    return this.contentClass || 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between';
  }

  get resolvedEyebrowClass(): string {
    return this.eyebrowClass || 'text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-zadna-primary/75';
  }

  get resolvedTitleClass(): string {
    return this.titleClass || 'text-[1rem] font-black text-slate-900';
  }

  get resolvedSubtitleClass(): string {
    return this.subtitleClass || 'mt-1 text-[0.75rem] font-bold text-slate-500';
  }
}
