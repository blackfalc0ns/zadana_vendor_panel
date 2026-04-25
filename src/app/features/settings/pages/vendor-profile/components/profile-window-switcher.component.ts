import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProfileWorkspaceWindow, ProfileWorkspaceWindowId } from '../vendor-profile.view-models';

@Component({
  selector: 'app-profile-window-switcher',
  standalone: true,
  imports: [CommonModule, NgClass],
  template: `
    <nav class="flex overflow-x-auto bg-white" aria-label="Tabs">
      <button
        *ngFor="let window of windows; let first = first; let last = last"
        type="button"
        (click)="windowChange.emit(window.id)"
        class="group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-bold transition-all hover:bg-slate-50 focus:z-10 focus:outline-none"
        [ngClass]="{
          'text-zadna-primary': activeWindowId === window.id,
          'text-slate-500 hover:text-slate-700': activeWindowId !== window.id,
          'rounded-l-[12px]': (first && currentLang !== 'ar') || (last && currentLang === 'ar'),
          'rounded-r-[12px]': (last && currentLang !== 'ar') || (first && currentLang === 'ar')
        }">
        <div class="flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[18px]" 
            [ngClass]="activeWindowId === window.id ? 'text-zadna-primary' : 'text-slate-400'">
            {{ window.icon }}
          </span>
          <span>{{ currentLang === 'ar' ? window.labelAr : window.labelEn }}</span>
          <span class="ml-1 rounded-full px-2 py-0.5 text-xs font-black transition-colors"
            [ngClass]="activeWindowId === window.id ? 'bg-zadna-primary/10 text-zadna-primary' : 'bg-slate-100 text-slate-600'">
            {{ counts[window.id] ?? 0 }}
          </span>
        </div>
        <span aria-hidden="true" class="absolute inset-x-0 bottom-0 h-0.5 transition-colors"
          [ngClass]="activeWindowId === window.id ? 'bg-zadna-primary' : 'bg-transparent group-hover:bg-slate-200'"></span>
      </button>
    </nav>
  `
})
export class ProfileWindowSwitcherComponent {
  @Input() currentLang: 'ar' | 'en' | string = 'ar';
  @Input() windows: ProfileWorkspaceWindow[] = [];
  @Input() activeWindowId: ProfileWorkspaceWindowId = 'basics';
  @Input() counts: Partial<Record<ProfileWorkspaceWindowId, number>> = {};

  @Output() windowChange = new EventEmitter<ProfileWorkspaceWindowId>();
}
