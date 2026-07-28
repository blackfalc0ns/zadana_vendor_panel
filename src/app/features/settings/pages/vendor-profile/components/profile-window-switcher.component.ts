import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { ProfileWorkspaceWindow, ProfileWorkspaceWindowId } from '../vendor-profile.view-models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-window-switcher',
  standalone: true,
  imports: [CommonModule, NgClass],
  styleUrl: './profile-window-switcher.component.scss',
  template: `
    <div class="profile-window-switcher-track">
      <nav class="profile-window-switcher" aria-label="Tabs">
        <button
          *ngFor="let window of windows; let first = first; let last = last"
          type="button"
          (click)="windowChange.emit(window.id)"
          class="profile-window-switcher__tab group focus:z-10 focus:outline-none"
        [ngClass]="{
          'text-zadna-primary bg-white/80 shadow-sm': activeWindowId === window.id,
          'text-slate-500 hover:bg-white/60 hover:text-slate-700': activeWindowId !== window.id,
          'lg:rounded-l-2xl': (first && currentLang !== 'ar') || (last && currentLang === 'ar'),
          'lg:rounded-r-2xl': (last && currentLang !== 'ar') || (first && currentLang === 'ar')
        }">
        <div class="profile-window-switcher__tab-meta">
          <span class="material-symbols-outlined text-[18px]"
            [ngClass]="activeWindowId === window.id ? 'text-zadna-primary' : 'text-slate-400'">
            {{ window.icon }}
          </span>
          <span class="rounded-full px-2 py-0.5 text-[0.62rem] font-black transition-colors lg:hidden"
            [ngClass]="activeWindowId === window.id ? 'bg-gradient-to-r from-zadna-primary/20 to-teal-500/20 text-teal-800' : 'bg-slate-200/60 text-slate-600'">
            {{ counts[window.id] ?? 0 }}
          </span>
        </div>

        <span class="profile-window-switcher__tab-label">
          {{ currentLang === 'ar' ? window.labelAr : window.labelEn }}
        </span>

        <span class="hidden rounded-full px-2.5 py-0.5 text-[0.65rem] font-black transition-colors lg:inline-flex"
          [ngClass]="activeWindowId === window.id ? 'bg-gradient-to-r from-zadna-primary/20 to-teal-500/20 text-teal-800' : 'bg-slate-200/60 text-slate-600'">
          {{ counts[window.id] ?? 0 }}
        </span>

        <span aria-hidden="true" class="absolute inset-x-2 bottom-0 hidden h-1 rounded-full transition-all duration-300 lg:inset-x-0 lg:block lg:rounded-none"
          [ngClass]="activeWindowId === window.id ? 'bg-gradient-to-r from-zadna-primary to-teal-400 shadow-[0_-2px_10px_rgba(20,184,166,0.3)]' : 'bg-transparent group-hover:bg-slate-200/50'"></span>
        </button>

        <span class="profile-window-switcher__spacer" aria-hidden="true"></span>
      </nav>
    </div>
  `
})
export class ProfileWindowSwitcherComponent {
  @Input() currentLang: 'ar' | 'en' | string = 'ar';
  @Input() windows: ProfileWorkspaceWindow[] = [];
  @Input() activeWindowId: ProfileWorkspaceWindowId = 'basics';
  @Input() counts: Partial<Record<ProfileWorkspaceWindowId, number>> = {};

  @Output() windowChange = new EventEmitter<ProfileWorkspaceWindowId>();
}
