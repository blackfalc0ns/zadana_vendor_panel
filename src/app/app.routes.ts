import { Routes } from '@angular/router';
import { VendorDashboardComponent } from './features/dashboard/pages/vendor-dashboard/vendor-dashboard.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { ForgotPasswordComponent } from './features/auth/pages/forgot-password/forgot-password.component';
import { OnboardingComponent } from './features/auth/pages/onboarding/onboarding.component';
import { SubmissionSuccessComponent } from './features/auth/pages/submission-success/submission-success.component';
import { LayoutComponent } from './core/layout/layout.component';

export const routes: Routes = [
  // --- Auth Pages (No layout) ---
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'onboarding',
    component: OnboardingComponent
  },
  {
    path: 'submission-success',
    component: SubmissionSuccessComponent
  },
  
  // --- Secured Layout Routes ---
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: VendorDashboardComponent
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/pages/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/products/pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/pages/order-list/order-list.component').then(m => m.OrderListComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/pages/order-details/order-details.component').then(m => m.OrderDetailsComponent)
      }
    ]
  },
  
  // --- Fallback ---
  {
    path: '**',
    redirectTo: 'login'
  }
];
