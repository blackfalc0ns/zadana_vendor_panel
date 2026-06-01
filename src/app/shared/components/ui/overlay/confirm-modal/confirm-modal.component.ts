import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { TranslateModule } from '@ngx-translate/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export interface ConfirmModalData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean; // If true, shows Cancel + Confirm. If false, shows single Confirm/OK (alert style)
  direction?: 'rtl' | 'ltr';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div 
      [dir]="data.direction || 'rtl'"
      class="w-[92vw] max-w-md overflow-hidden rounded-[24px] border border-white/60 bg-white/95 p-6 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)] backdrop-blur-xl animate-scale-up"
      [@dialogAnimation]="'in'">
      
      <!-- Decorative background accent gradient -->
      <div 
        class="absolute -left-16 -top-16 h-36 w-36 rounded-full blur-3xl opacity-20 pointer-events-none"
        [ngClass]="{
          'bg-emerald-400': data.type === 'success',
          'bg-rose-400': data.type === 'danger',
          'bg-amber-400': data.type === 'warning',
          'bg-sky-400': data.type === 'info'
        }">
      </div>

      <!-- Dialog Body -->
      <div class="relative flex flex-col items-center text-center">
        <!-- Premium Icon with Gradient Border & Pulse -->
        <div 
          class="flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner relative mb-5 transition-transform duration-500 hover:rotate-6"
          [ngClass]="{
            'bg-emerald-50 text-emerald-600 border border-emerald-100/80': data.type === 'success',
            'bg-rose-50 text-rose-600 border border-rose-100/80': data.type === 'danger',
            'bg-amber-50 text-amber-600 border border-amber-100/80': data.type === 'warning',
            'bg-sky-50 text-sky-600 border border-sky-100/80': data.type === 'info'
          }">
          
          <!-- Outer Pulsing Glow -->
          <span 
            class="absolute -inset-1 rounded-2xl opacity-40 animate-ping duration-1000 pointer-events-none"
            [ngClass]="{
              'bg-emerald-200': data.type === 'success',
              'bg-rose-200': data.type === 'danger',
              'bg-amber-200': data.type === 'warning',
              'bg-sky-200': data.type === 'info'
            }">
          </span>

          <!-- Success Check Icon -->
          @if (data.type === 'success') {
            <svg class="h-8 w-8 relative z-10 animate-draw-check" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          } 
          <!-- Danger/Trash Icon -->
          @else if (data.type === 'danger') {
            <svg class="h-8 w-8 relative z-10 animate-wiggle" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          } 
          <!-- Warning Exclamation Icon -->
          @else if (data.type === 'warning') {
            <svg class="h-8 w-8 relative z-10 animate-bounce-short" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          } 
          <!-- Info Details Icon -->
          @else {
            <svg class="h-8 w-8 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        </div>

        <!-- Title -->
        <h3 class="text-[1.125rem] font-black text-slate-900 tracking-tight leading-6">
          {{ data.title | translate }}
        </h3>

        <!-- Message Body -->
        <p class="mt-3 text-sm font-bold text-slate-500 leading-relaxed max-w-[320px]">
          {{ data.message | translate }}
        </p>

        <!-- Dynamic Actions Container -->
        <div class="mt-6 flex w-full flex-col sm:flex-row items-center gap-3 sm:justify-center">
          
          <!-- Confirm Button -->
          <button 
            type="button"
            (click)="onConfirm()"
            class="w-full sm:w-auto min-w-[120px] rounded-xl px-5 py-2.5 text-xs font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
            [ngClass]="{
              'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700': data.type === 'success',
              'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700': data.type === 'danger',
              'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700': data.type === 'warning',
              'bg-gradient-to-r from-zadna-primary to-teal-600 shadow-zadna-primary/20 hover:from-teal-600 hover:to-teal-700': data.type === 'info' || !data.type
            }">
            {{ (data.confirmText || 'COMMON.CONFIRM') | translate }}
          </button>

          <!-- Cancel/Dismiss Button (only visible if isConfirm is true) -->
          @if (data.isConfirm) {
            <button 
              type="button"
              (click)="onCancel()"
              class="w-full sm:w-auto min-w-[100px] rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-600 transition-all duration-300 hover:bg-slate-50 hover:text-slate-800">
              {{ (data.cancelText || 'COMMON.CANCEL') | translate }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('dialogAnimation', [
      state('in', style({ transform: 'scale(1)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'scale(0.92)', opacity: 0 }),
        animate('250ms cubic-bezier(0.34, 1.56, 0.64, 1)')
      ]),
      transition('* => void', [
        animate('180ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
      ])
    ])
  ],
  styles: [`
    :host {
      display: block;
      outline: none;
    }
    
    @keyframes draw-check {
      0% { stroke-dasharray: 0, 100; opacity: 0; }
      100% { stroke-dasharray: 100, 0; opacity: 1; }
    }
    .animate-draw-check {
      animation: draw-check 0.4s ease-out forwards;
    }

    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-8deg); }
      75% { transform: rotate(8deg); }
    }
    .animate-wiggle {
      animation: wiggle 0.5s ease-in-out;
    }

    @keyframes bounce-short {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    .animate-bounce-short {
      animation: bounce-short 0.8s ease-in-out infinite;
    }
  `]
})
export class AppConfirmModalComponent {
  constructor(
    @Inject(DIALOG_DATA) public data: ConfirmModalData,
    private dialogRef: DialogRef<boolean, AppConfirmModalComponent>
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
