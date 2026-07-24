import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * /register now redirects into the unified onboarding wizard
 * (account credentials are step 1 of onboarding).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-register',
  standalone: true,
  template: `
    <div class="min-h-[100dvh] flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">
      ...
    </div>
  `
})
export class RegisterComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigate(['/onboarding'], { replaceUrl: true });
  }
}
