import { Routes } from '@angular/router';
import { vendorAuthGuard } from './core/auth/guards/vendor-auth.guard';
import { vendorGuestGuard } from './core/auth/guards/vendor-guest.guard';

export const routes: Routes = [
  // --- Auth Pages (No layout) ---
  {
    path: 'login',
    canActivate: [vendorGuestGuard],
    loadComponent: () => import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [vendorGuestGuard],
    loadComponent: () => import('./features/auth/pages/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [vendorGuestGuard],
    loadComponent: () => import('./features/auth/pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    canActivate: [vendorGuestGuard],
    loadComponent: () => import('./features/auth/pages/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent)
  },
  {
    path: 'onboarding',
    canActivate: [vendorGuestGuard],
    loadComponent: () => import('./features/auth/pages/onboarding/onboarding.component').then((m) => m.OnboardingComponent)
  },
  {
    path: 'submission-success',
    loadComponent: () => import('./features/auth/pages/submission-success/submission-success.component').then((m) => m.SubmissionSuccessComponent)
  },
  
  // --- Secured Layout Routes ---
  {
    path: '',
    canActivate: [vendorAuthGuard],
    loadComponent: () => import('./core/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/vendor-dashboard/vendor-dashboard.component').then((m) => m.VendorDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/pages/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'products/submit',
        loadComponent: () => import('./features/products/pages/product-submission/product-submission.component').then(m => m.ProductSubmissionComponent)
      },
      {
        path: 'products/requests',
        loadComponent: () => import('./features/products/pages/catalog-requests/catalog-requests.component').then(m => m.CatalogRequestsComponent)
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
        path: 'alerts',
        loadComponent: () => import('./features/alerts/pages/alerts-center/alerts-center.page').then(m => m.AlertsCenterPageComponent)
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
        path: 'orders/create',
        loadComponent: () => import('./features/orders/pages/order-create/order-create.component').then(m => m.ManualOrderCreateComponent)
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
        path: 'support/tickets/:id',
        loadComponent: () => import('./features/support/pages/support-ticket-detail/support-ticket-detail.component').then(m => m.SupportTicketDetailComponent)
      },
      {
        path: 'support/reference/:id',
        loadComponent: () => import('./features/support/pages/support-reference-detail/support-reference-detail.component').then(m => m.SupportReferenceDetailComponent)
      },
      {
        path: 'support',
        loadComponent: () => import('./features/support/pages/support-center/support-center.page').then(m => m.SupportCenterPageComponent)
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
