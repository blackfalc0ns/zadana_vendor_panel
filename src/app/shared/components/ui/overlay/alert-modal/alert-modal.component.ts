import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { TranslateModule } from '@ngx-translate/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export interface AlertModalData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  confirmText?: string;
}

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-md pointer-events-none">
      <div 
        class="pointer-events-auto relative flex items-start gap-4 overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md p-4 shadow-xl ring-1 ring-slate-900/5"
        [@toastAnimation]="'in'"
        (mouseenter)="pauseTimer()"
        (mouseleave)="resumeTimer()"
        [dir]="'rtl'">
      
        <!-- Decorative Side Line -->
        <div class="absolute inset-y-0 right-0 w-1.5"
          [ngClass]="{
            'bg-emerald-500': data.type === 'success',
            'bg-rose-500': data.type === 'error',
            'bg-sky-500': data.type === 'info'
          }">
        </div>

        <!-- Icon -->
        <div class="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full"
          [ngClass]="{
            'bg-emerald-100 text-emerald-600': data.type === 'success',
            'bg-rose-100 text-rose-600': data.type === 'error',
            'bg-sky-100 text-sky-600': data.type === 'info'
          }">
          @if (data.type === 'success') {
            <svg class="h-6 w-6 animate-[check_0.5s_ease-out_forwards]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          } @else if (data.type === 'error') {
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          } @else {
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        </div>

        <!-- Content -->
        <div class="flex-1 pt-0.5">
          <h3 class="text-sm font-bold text-slate-900">
            {{ data.title | translate }}
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            {{ data.message }}
          </p>
        </div>

        <!-- Close Button -->
        <button 
          (click)="close()"
          class="flex-shrink-0 ml-1 inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  `,
  animations: [
    trigger('toastAnimation', [
      state('in', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)')
      ]),
      transition('* => void', [
        animate('0.2s ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
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
