import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { TranslateModule } from '@ngx-translate/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export interface AlertModalData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  direction?: 'rtl' | 'ltr';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="fixed top-6 z-[100] w-[90vw] max-w-sm pointer-events-none transition-all duration-300"
         [ngClass]="data.direction === 'rtl' ? 'right-6' : 'left-6'">
      <div 
        class="pointer-events-auto relative flex items-start gap-4 overflow-hidden rounded-[22px] bg-white/90 backdrop-blur-xl p-4 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.15)] border border-white/50 border-s-4"
        [ngClass]="{
          'border-s-emerald-500': data.type === 'success',
          'border-s-rose-500': data.type === 'error',
          'border-s-sky-500': data.type === 'info',
          'border-s-amber-500': data.type === 'warning'
        }"
        [@toastAnimation]="'in'"
        (mouseenter)="pauseTimer()"
        (mouseleave)="resumeTimer()"
        [dir]="data.direction || 'rtl'">
      
        <!-- Icon -->
        <div class="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-[14px]"
          [ngClass]="{
            'bg-emerald-500/10 text-emerald-600': data.type === 'success',
            'bg-rose-500/10 text-rose-600': data.type === 'error',
            'bg-sky-500/10 text-sky-600': data.type === 'info',
            'bg-amber-500/10 text-amber-600': data.type === 'warning'
          }">
          @if (data.type === 'success') {
            <svg class="h-5.5 w-5.5 animate-[check_0.5s_ease-out_forwards]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          } @else if (data.type === 'error') {
            <svg class="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          } @else if (data.type === 'warning') {
            <svg class="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-7.55 13.1A1 1 0 003.61 18h16.78a1 1 0 00.87-1.5l-7.55-13.1a1 1 0 00-1.74 0z" />
            </svg>
          } @else {
            <svg class="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        </div>
 
        <!-- Content -->
        <div class="flex-1 pt-0.5">
          <h3 class="text-[0.82rem] font-black text-slate-900 tracking-tight leading-snug">
            {{ data.title | translate }}
          </h3>
          <p class="mt-1 text-[0.76rem] font-bold leading-normal text-slate-500">
            {{ data.message }}
          </p>
        </div>
 
        <!-- Close Button -->
        <button 
          (click)="close()"
          class="flex-shrink-0 inline-flex rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors">
          <svg class="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  `,
  animations: [
    trigger('toastAnimation', [
      state('in', style({ transform: 'translateY(0) scale(1)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateY(-20px) scale(0.95)', opacity: 0 }),
        animate('0.35s cubic-bezier(0.34, 1.56, 0.64, 1)')
      ]),
      transition('* => void', [
        animate('0.2s ease-in', style({ transform: 'translateY(-15px) scale(0.95)', opacity: 0 }))
      ])
    ])
  ],
  styles: [`
    @keyframes check {
      0% { stroke-dasharray: 0, 100; opacity: 0; }
      100% { stroke-dasharray: 100, 0; opacity: 1; }
    }
  `]
})
export class AlertModalComponent implements OnInit, OnDestroy {
  private timeoutId?: any;
  private readonly duration = 4000;

  constructor(
    @Inject(DIALOG_DATA) public data: AlertModalData,
    private dialogRef: DialogRef<AlertModalComponent>
  ) {}

  ngOnInit(): void {
    this.resumeTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  pauseTimer(): void {
    this.clearTimer();
  }

  resumeTimer(): void {
    this.clearTimer();
    this.timeoutId = setTimeout(() => this.close(), this.duration);
  }

  private clearTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
