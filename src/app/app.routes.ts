import { Routes } from '@angular/router';
import { vendorAuthGuard } from './core/auth/guards/vendor-auth.guard';
import { vendorGuestGuard } from './core/auth/guards/vendor-guest.guard';
import { vendorOnboardingGuard } from './core/auth/guards/vendor-onboarding.guard';
import { VendorHasPermissionGuard } from './core/auth/guards/vendor-has-permission.guard';

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
    path: 'invitations/accept/:token',
    loadComponent: () => import('./features/staff/pages/invitation-accept/invitation-accept.component').then((m) => m.InvitationAcceptComponent)
  },
  {
    path: 'verify-email',
    canActivate: [vendorGuestGuard],
    loadComponent: () => import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'onboarding',
    canActivate: [vendorOnboardingGuard],
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
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_dashboard.view' },
        loadComponent: () => import('./features/dashboard/pages/vendor-dashboard/vendor-dashboard.component').then((m) => m.VendorDashboardComponent)
      },
      {
        path: 'products',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_catalog.view' },
        loadComponent: () => import('./features/products/pages/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'products/submit',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_catalog.create' },
        loadComponent: () => import('./features/products/pages/product-submission/product-submission.component').then(m => m.ProductSubmissionComponent)
      },
      {
        path: 'products/requests',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_catalog.approve' },
        loadComponent: () => import('./features/products/pages/catalog-requests/catalog-requests.component').then(m => m.CatalogRequestsComponent)
      },
      {
        path: 'products/:id',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_catalog.view' },
        loadComponent: () => import('./features/products/pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'offers',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_offers.view' },
        loadComponent: () => import('./features/offers/pages/offers-list/offers-list.component').then(m => m.OffersListComponent)
      },
      {
        path: 'alerts',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_alerts.view' },
        loadComponent: () => import('./features/alerts/pages/alerts-center/alerts-center.page').then(m => m.AlertsCenterPageComponent)
      },
      {
        path: 'orders',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_orders.view' },
        loadComponent: () => import('./features/orders/pages/order-list/order-list.component').then(m => m.OrderListComponent)
      },
      {
        path: 'orders/create',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_orders.edit' },
        loadComponent: () => import('./features/orders/pages/order-create/order-create.component').then(m => m.ManualOrderCreateComponent)
      },
      {
        path: 'orders/:id',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_orders.view' },
        loadComponent: () => import('./features/orders/pages/order-details/order-details.component').then(m => m.OrderDetailsComponent)
      },
      {
        path: 'disputes/:id',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_disputes.view' },
        loadComponent: () => import('./features/disputes/pages/vendor-dispute-detail/vendor-dispute-detail.component').then(m => m.VendorDisputeDetailComponent)
      },
      {
        path: 'disputes',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_disputes.view' },
        loadComponent: () => import('./features/disputes/pages/vendor-disputes-list/vendor-disputes-list.component').then(m => m.VendorDisputesListComponent)
      },
      {
        path: 'finance',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_finance.view' },
        loadComponent: () => import('./features/finance/pages/finance-dashboard/vendor-finance-dashboard.component').then(m => m.VendorFinanceDashboardComponent)
      },
      {
        path: 'staff/branches/:id',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: ['vendor_staff.view', 'vendor_branch_team.view'], permissionMatch: 'any' },
        loadComponent: () => import('./features/staff/pages/branch-detail/branch-detail.component').then(m => m.BranchDetailComponent)
      },
      {
        path: 'staff/employees/:id',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: ['vendor_staff.view', 'vendor_branch_team.view'], permissionMatch: 'any' },
        loadComponent: () => import('./features/staff/pages/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent)
      },
      {
        path: 'staff/invitations/:id',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: ['vendor_staff.view', 'vendor_branch_team.view'], permissionMatch: 'any' },
        loadComponent: () => import('./features/staff/pages/invitation-detail/invitation-detail.component').then(m => m.InvitationDetailComponent)
      },
      {
        path: 'staff',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: ['vendor_staff.view', 'vendor_branch_team.view'], permissionMatch: 'any' },
        loadComponent: () => import('./features/staff/pages/staff-branches/staff-branches.page').then(m => m.StaffBranchesPageComponent)
      },
      {
        path: 'support/tickets/:id',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_support.view' },
        loadComponent: () => import('./features/support/pages/support-ticket-detail/support-ticket-detail.component').then(m => m.SupportTicketDetailComponent)
      },
      {
        path: 'support/reference/:id',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_support.view' },
        loadComponent: () => import('./features/support/pages/support-reference-detail/support-reference-detail.component').then(m => m.SupportReferenceDetailComponent)
      },
      {
        path: 'support',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_support.view' },
        loadComponent: () => import('./features/support/pages/support-center/support-center.page').then(m => m.SupportCenterPageComponent)
      },
      {
        path: 'profile',
        canActivate: [VendorHasPermissionGuard],
        data: { permission: 'vendor_profile.view' },
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
