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
        path: 'offers',
        loadComponent: () => import('./features/offers/pages/offers-list/offers-list.component').then(m => m.OffersListComponent)
      },
      {
        path: 'reviews',
        loadComponent: () => import('./features/reviews/pages/reviews-center/reviews-center.page').then(m => m.ReviewsCenterPageComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/pages/order-list/order-list.component').then(m => m.OrderListComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/pages/order-details/order-details.component').then(m => m.OrderDetailsComponent)
      },
      {
        path: 'finance',
        loadComponent: () => import('./features/finance/pages/finance-dashboard/vendor-finance-dashboard.component').then(m => m.VendorFinanceDashboardComponent)
      },
      {
        path: 'staff/branches/:id',
        loadComponent: () => import('./features/staff/pages/branch-detail/branch-detail.component').then(m => m.BranchDetailComponent)
      },
      {
        path: 'staff/employees/:id',
        loadComponent: () => import('./features/staff/pages/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent)
      },
      {
        path: 'staff/invitations/:id',
        loadComponent: () => import('./features/staff/pages/invitation-detail/invitation-detail.component').then(m => m.InvitationDetailComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/staff/pages/staff-branches/staff-branches.page').then(m => m.StaffBranchesPageComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/settings/pages/vendor-profile/vendor-profile.component').then(m => m.VendorProfileComponent)
      }
    ]
  },
  
  // --- Fallback ---
  {
    path: '**',
    redirectTo: 'login'
  }
];
