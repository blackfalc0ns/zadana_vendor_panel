import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';

interface InvitationPreview {
  id: string;
  type: 'branch_manager' | 'employee';
  targetName: string;
  contact: string;
  vendorName: string;
  branchIds: string[];
  expiresAt: string;
}

interface InvitationAcceptResponse {
  email: string;
  redirectTo: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invitation-accept',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule
  ],
  template: `
    <main class="min-h-[100dvh] relative font-sans flex flex-col lg:flex-row-reverse bg-zadna-bgLight overflow-hidden selection:bg-zadna-primary selection:text-white" [dir]="pageDirection">

      <!-- ================= TOP NAVIGATION (Language Switcher) ================= -->
      <div class="absolute top-6 sm:top-8 start-6 xl:start-12 z-50 flex items-center animate-puzzle-down stagger-1">
        <div class="flex items-center bg-white/70 backdrop-blur-xl border border-white/80 p-1.5 rounded-full shadow-sm" style="direction: ltr;">
          <button type="button" (click)="switchLanguage('en')"
            [ngClass]="{'bg-white text-zadna-primaryDark shadow-md scale-105': currentLang === 'en', 'text-gray-500 hover:text-zadna-primary hover:bg-white/40': currentLang !== 'en'}"
            class="px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300">
            {{ 'COMMON.ENGLISH' | translate }}
          </button>
          <button type="button" (click)="switchLanguage('ar')"
            [ngClass]="{'bg-white text-zadna-primaryDark shadow-md scale-105': currentLang === 'ar', 'text-gray-500 hover:text-zadna-primary hover:bg-white/40': currentLang !== 'ar'}"
            class="px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300">
            {{ 'COMMON.ARABIC' | translate }}
          </button>
        </div>
      </div>

      <!-- ================= RIGHT PANEL: EPIC MARKETPLACE VISION (Image + Text) ================= -->
      <div class="hidden lg:flex w-full lg:w-1/2 relative flex-col justify-center items-center py-12 px-8 xl:px-16 overflow-hidden animate-puzzle-left stagger-2">
        <!-- Background Image -->
        <div class="absolute inset-0 z-0">
          <img alt="Marketplace scene" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEW1c60Z9X6PmVaxPRNpxHur_LO28-RO0ykfGZxmL_U2d1obOjpzSaSELpZN4atHiahI64IQAkXKH4A-d3juNylCvj1adw5iVpTUU6iyDXcfePY-ugqzrgDCEto5JV8-2joyg0-HuGx2arCdm9s9Qx0-1Cvle1qFT4CjlFam86vwe3kIu5g7Q1vOdyrDNY0kEfJwxibrO6mnhaFP7d2EmRGFaXMqiHq3x6-MPaRphiy-Q2ZBix3vgcz9bYP9TFtYoKW0Z9C-WOFg" />
          <div class="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/60"></div>
        </div>

        <!-- Content Overlay -->
        <div class="relative z-10 w-full max-w-lg mx-auto text-start">
          <!-- Premium App Ribbon -->
          <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/30 border border-white/20 backdrop-blur-[2px] shadow-lg mb-10 transform hover:scale-105 transition-transform cursor-default animate-puzzle-up stagger-3">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-zadna-accent opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-zadna-accent"></span>
            </span>
            <span class="text-xs font-black tracking-widest text-white uppercase drop-shadow-md">
              {{ 'LOGIN.ADMIN_PORTAL' | translate }}
            </span>
          </div>

          <!-- Massive Headline -->
          <h1 class="text-4xl xl:text-[3rem] font-black text-white leading-[1.2] tracking-tight mb-6 animate-puzzle-up stagger-4 drop-shadow-xl">
            <div class="mb-2 md:mb-3">{{ 'LOGIN.HERO_TITLE_1' | translate }}</div>
            <span class="relative inline-block mt-2 md:mt-3">
              <span class="relative z-10 text-white drop-shadow-md">
                {{ 'LOGIN.HERO_TITLE_2' | translate }}
              </span>
              <svg class="absolute w-full h-3 md:h-4 -bottom-1 start-[-0.5rem] z-0 text-zadna-primary" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q 50 20 100 10" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round" />
              </svg>
            </span>
          </h1>

          <p class="text-lg text-white/90 font-bold leading-relaxed max-w-xl mb-12 tracking-wide animate-puzzle-up stagger-5 drop-shadow-xl">
            {{ 'LOGIN.HERO_DESC' | translate }}
          </p>
        </div>
      </div>

      <!-- ================= LEFT PANEL: THE FORM CONDUIT ================= -->
      <div class="w-full lg:w-1/2 min-h-[100dvh] shrink-0 relative flex justify-center items-center py-10 px-6 sm:px-12 animate-puzzle-right stagger-2">
        <!-- Decorative Soft Blurs -->
        <div class="absolute -top-32 -right-32 w-96 h-96 bg-zadna-accent/5 rounded-full blur-3xl opacity-60"></div>
        <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-zadna-primary/5 rounded-full blur-3xl opacity-60"></div>

        <!-- The Core Form Card -->
        <div class="w-full max-w-[440px] bg-white/90 backdrop-blur-2xl border border-white rounded-[1.5rem] p-6 sm:p-8 shadow-[0_30px_60px_-15px_rgba(18,124,140,0.1)] relative z-10">
          <!-- Top Highlight Line -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zadna-primary via-zadna-accent to-zadna-primary"></div>

          <!-- Brand Identity -->
          <div class="flex flex-col items-center mb-8 text-center animate-puzzle-scale-rotate stagger-4">
            <div class="w-full h-16 relative flex items-center justify-center group cursor-default">
              <div class="absolute inset-0 bg-zadna-primary/10 rounded-full blur-2xl scale-75 group-hover:scale-110 transition-transform duration-700"></div>
              <img src="assets/i18n/images/logo/logo-auth.png" width="800" height="309" alt="Zadna Logo" class="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(18,124,140,0.15)] z-10 transition-transform duration-500 hover:scale-110">
            </div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight mt-6 animate-puzzle-up stagger-5">
              @if (loading) {
                {{ 'STAFF_BRANCHES.ACCEPT.LOADING' | translate }}
              } @else if (success) {
                {{ 'STAFF_BRANCHES.ACCEPT.SUCCESS_TITLE' | translate }}
              } @else if (errorKey && !preview) {
                {{ 'STAFF_BRANCHES.ACCEPT.INVALID_TITLE' | translate }}
              } @else {
                {{ 'STAFF_BRANCHES.ACCEPT.TITLE' | translate }}
              }
            </h2>
          </div>

          <!-- Loading State -->
          @if (loading) {
            <div class="py-10 text-center flex flex-col items-center gap-4">
              <svg class="animate-spin h-10 w-10 text-zadna-primary" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-sm font-black text-gray-500">{{ 'STAFF_BRANCHES.ACCEPT.LOADING' | translate }}</span>
            </div>
          }

          <!-- Success State -->
          @else if (success) {
            <div class="space-y-6 text-center animate-puzzle-up">
              <div class="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p class="text-sm font-bold leading-relaxed text-gray-500">
                {{ 'STAFF_BRANCHES.ACCEPT.SUCCESS_BODY' | translate }}
              </p>

              <button
                type="button"
                (click)="goToLogin()"
                class="group relative w-full flex justify-center items-center py-3.5 px-4 overflow-hidden rounded-xl shadow-[0_8px_20px_rgba(18,124,140,0.3)] font-black text-white bg-zadna-primary focus:outline-none transition-transform active:scale-[0.98]">
                <div class="absolute inset-0 bg-gradient-to-r from-zadna-primaryDark via-zadna-primary to-zadna-primaryDark opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span class="relative z-10 flex items-center gap-2">
                  {{ 'STAFF_BRANCHES.ACCEPT.LOGIN' | translate }}
                  <svg class="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </span>
              </button>
            </div>
          }

          <!-- Invalid/Error State -->
          @else if (errorKey && !preview) {
            <div class="space-y-6 text-center animate-puzzle-up">
              <div class="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <p class="text-sm font-bold leading-relaxed text-gray-500">
                {{ errorKey | translate }}
              </p>

              <a routerLink="/login"
                class="flex w-full justify-center items-center py-3.5 px-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50 transition-all font-black text-gray-700 shadow-sm hover:shadow-md text-sm">
                {{ 'STAFF_BRANCHES.ACCEPT.LOGIN' | translate }}
              </a>
            </div>
          }

          <!-- Active Preview State (Accept Invitation Form) -->
          @else if (preview) {
            <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
              <!-- Welcome Subtitle -->
              <p class="text-sm font-semibold leading-relaxed text-gray-500 animate-puzzle-up stagger-5">
                {{ 'STAFF_BRANCHES.ACCEPT.SUBTITLE' | translate:{ vendor: preview.vendorName } }}
              </p>

              <!-- Invitation Details Box -->
              <div class="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-xs animate-puzzle-up stagger-5">
                <div class="flex items-center justify-between gap-3">
                  <span class="font-bold text-gray-400">{{ 'STAFF_BRANCHES.ACCEPT.INVITED_AS' | translate }}</span>
                  <span class="font-black text-gray-800">{{ preview.targetName }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="font-bold text-gray-400">{{ 'STAFF_BRANCHES.ACCEPT.EMAIL' | translate }}</span>
                  <span class="font-black text-gray-800">{{ preview.contact }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="font-bold text-gray-400">{{ 'STAFF_BRANCHES.ACCEPT.EXPIRES' | translate }}</span>
                  <span class="font-black text-gray-800">{{ formatDateTime(preview.expiresAt) }}</span>
                </div>
              </div>

              <!-- Full Name Input -->
              <div class="space-y-2 animate-puzzle-up stagger-6">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest block ms-1">
                  {{ 'STAFF_BRANCHES.ACCEPT.FULL_NAME' | translate }}
                </label>
                <div class="relative group">
                  <div class="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-zadna-primary transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <input type="text"
                    formControlName="fullName"
                    autocomplete="name"
                    [ngClass]="(form.get('fullName')?.touched || submitted) && form.get('fullName')?.invalid ? 'border-red-400 bg-red-50/20' : 'border-gray-100'"
                    class="block w-full py-3 ps-11 pe-4 bg-gray-50/50 border-2 focus:border-zadna-primary/30 focus:bg-white text-gray-900 rounded-xl placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-zadna-primary/10 transition-all font-bold text-sm shadow-sm hover:shadow-md">
                </div>
                <!-- Validation errors -->
                <div *ngIf="(form.get('fullName')?.touched || submitted) && form.get('fullName')?.invalid" class="px-1 animate-puzzle-up">
                  <span *ngIf="form.get('fullName')?.errors?.['required']" class="text-[10px] sm:text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                    {{ 'AUTH.ERR_REQUIRED' | translate }}
                  </span>
                </div>
              </div>

              <!-- Password Input -->
              <div class="space-y-2 animate-puzzle-up stagger-7">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest block ms-1">
                  {{ 'STAFF_BRANCHES.ACCEPT.PASSWORD' | translate }}
                </label>
                <div class="relative group">
                  <div class="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-zadna-primary transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <input [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="new-password"
                    [ngClass]="(form.get('password')?.touched || submitted) && form.get('password')?.invalid ? 'border-red-400 bg-red-50/20' : 'border-gray-100'"
                    class="block w-full py-3 ps-11 pe-11 bg-gray-50/50 border-2 focus:border-zadna-primary/30 focus:bg-white text-gray-900 rounded-xl placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-zadna-primary/10 transition-all font-bold text-base tracking-[0.2em] shadow-sm hover:shadow-md">
                  <button type="button" (click)="togglePassword()" class="absolute inset-y-0 end-0 pe-4 flex items-center text-gray-400 hover:text-zadna-primary transition-colors focus:outline-none cursor-pointer">
                    <svg *ngIf="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <svg *ngIf="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 01-1.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                    </svg>
                  </button>
                </div>
                <!-- Validation errors -->
                <div *ngIf="(form.get('password')?.touched || submitted) && form.get('password')?.invalid" class="px-1 animate-puzzle-up">
                  <span *ngIf="form.get('password')?.errors?.['required']" class="text-[10px] sm:text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                    {{ 'LOGIN.ERR_PASSWORD_REQUIRED' | translate }}
                  </span>
                  <span *ngIf="form.get('password')?.errors?.['minlength']" class="text-[10px] sm:text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                    {{ 'STAFF_BRANCHES.ACCEPT.WEAK_PASSWORD' | translate }}
                  </span>
                </div>
              </div>

              <!-- Confirm Password Input -->
              <div class="space-y-2 animate-puzzle-up stagger-8">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest block ms-1">
                  {{ 'STAFF_BRANCHES.ACCEPT.CONFIRM_PASSWORD' | translate }}
                </label>
                <div class="relative group">
                  <div class="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-zadna-primary transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <input [type]="showConfirmPassword ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    autocomplete="new-password"
                    [ngClass]="(form.get('confirmPassword')?.touched || submitted) && form.get('confirmPassword')?.invalid ? 'border-red-400 bg-red-50/20' : 'border-gray-100'"
                    class="block w-full py-3 ps-11 pe-11 bg-gray-50/50 border-2 focus:border-zadna-primary/30 focus:bg-white text-gray-900 rounded-xl placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-zadna-primary/10 transition-all font-bold text-base tracking-[0.2em] shadow-sm hover:shadow-md">
                  <button type="button" (click)="toggleConfirmPassword()" class="absolute inset-y-0 end-0 pe-4 flex items-center text-gray-400 hover:text-zadna-primary transition-colors focus:outline-none cursor-pointer">
                    <svg *ngIf="!showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <svg *ngIf="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 01-1.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                    </svg>
                  </button>
                </div>
                <!-- Validation errors -->
                <div *ngIf="(form.get('confirmPassword')?.touched || submitted) && form.get('confirmPassword')?.invalid" class="px-1 animate-puzzle-up">
                  <span *ngIf="form.get('confirmPassword')?.errors?.['required']" class="text-[10px] sm:text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                    {{ 'AUTH.ERR_REQUIRED' | translate }}
                  </span>
                </div>
              </div>

              <!-- Error Alert -->
              @if (errorKey) {
                <div class="rounded-2xl bg-red-50/40 backdrop-blur-md border border-red-100/50 p-4 flex items-center gap-4 shadow-sm animate-puzzle-up">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                  <p class="text-xs font-bold text-red-900 leading-relaxed">{{ errorKey | translate }}</p>
                </div>
              }

              <!-- Submit Button -->
              <div class="pt-4 animate-puzzle-up stagger-9">
                <button
                  type="submit"
                  [disabled]="submitting"
                  class="group relative w-full flex justify-center items-center py-3.5 px-4 overflow-hidden rounded-xl shadow-[0_8px_20px_rgba(18,124,140,0.3)] font-black text-white bg-zadna-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-[0.98]">
                  <div class="absolute inset-0 bg-gradient-to-r from-zadna-primaryDark via-zadna-primary to-zadna-primaryDark opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <span *ngIf="submitting" class="me-3 relative z-10">
                    <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  <span class="relative z-10 tracking-widest uppercase">
                    {{ submitting ? ('STAFF_BRANCHES.ACCEPT.SUBMITTING' | translate) : ('STAFF_BRANCHES.ACCEPT.SUBMIT' | translate) }}
                  </span>
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </main>
  `
})
export class InvitationAcceptComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  private readonly skipAuthHeaders = new HttpHeaders({ 'X-Skip-Auth': 'true' });
  private token = '';

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  loading = true;
  submitting = false;
  submitted = false;
  success = false;
  preview: InvitationPreview | null = null;
  errorKey = '';
  acceptedEmail = '';
  currentLang = this.translate.currentLang || this.translate.defaultLang || 'ar';
  showPassword = false;
  showConfirmPassword = false;

  get pageDirection(): 'rtl' | 'ltr' {
    return this.currentLang === 'ar' ? 'rtl' : 'ltr';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  switchLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.loading = false;
      this.errorKey = 'STAFF_BRANCHES.ACCEPT.INVALID_BODY';
      return;
    }

    this.http.get<InvitationPreview>(
      `${environment.apiUrl}/vendors/staff/invitations/accept/${encodeURIComponent(this.token)}`,
      { headers: this.skipAuthHeaders }
    ).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.acceptedEmail = preview.contact;
        this.form.patchValue({ fullName: preview.targetName });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorKey = 'STAFF_BRANCHES.ACCEPT.INVALID_BODY';
        this.cdr.markForCheck();
      }
    });
  }

  submit(): void {
    this.submitted = true;
    this.errorKey = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (value.password !== value.confirmPassword) {
      this.errorKey = 'STAFF_BRANCHES.ACCEPT.PASSWORD_MISMATCH';
      return;
    }

    this.submitting = true;
    this.http.post<InvitationAcceptResponse>(
      `${environment.apiUrl}/vendors/staff/invitations/accept`,
      {
        token: this.token,
        fullName: value.fullName,
        password: value.password
      },
      { headers: this.skipAuthHeaders }
    ).subscribe({
      next: (response) => {
        this.acceptedEmail = response.email || this.acceptedEmail;
        this.submitting = false;
        this.success = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting = false;
        const errorCode = err?.error?.extensions?.errorCode || err?.error?.code;
        if (errorCode === 'USER_ALREADY_EXISTS') {
          this.errorKey = 'STAFF_BRANCHES.ACCEPT.USER_ALREADY_EXISTS';
        } else if (errorCode === 'STAFF_ALREADY_EXISTS') {
          this.errorKey = 'STAFF_BRANCHES.ACCEPT.STAFF_ALREADY_EXISTS';
        } else if (errorCode === 'ROLE_NOT_CONFIGURED') {
          this.errorKey = 'STAFF_BRANCHES.ACCEPT.ROLE_NOT_CONFIGURED';
        } else if (errorCode === 'WEAK_PASSWORD') {
          this.errorKey = 'STAFF_BRANCHES.ACCEPT.WEAK_PASSWORD';
        } else if (errorCode === 'INVITATION_NOT_ACTIVE') {
          this.errorKey = 'STAFF_BRANCHES.ACCEPT.INVALID_BODY';
        } else {
          this.errorKey = 'STAFF_BRANCHES.ACCEPT.FAILED';
        }
        this.cdr.markForCheck();
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: this.acceptedEmail ? { email: this.acceptedEmail } : undefined
    });
  }

  formatDateTime(dateText: string): string {
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', { timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(dateText));
  }
}
