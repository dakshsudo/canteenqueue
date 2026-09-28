import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'menu', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'menu',
    loadComponent: () => import('./features/menu/menu.component').then(m => m.MenuComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'orders',
    canActivate: [authGuard, roleGuard(['student'])],
    loadComponent: () => import('./features/orders/order-history.component').then(m => m.OrderHistoryComponent)
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard, roleGuard(['student'])],
    loadComponent: () => import('./features/orders/order-track.component').then(m => m.OrderTrackComponent)
  },
  {
    path: 'queue',
    loadComponent: () => import('./features/queue/queue-board.component').then(m => m.QueueBoardComponent)
  },
  {
    path: 'staff',
    canActivate: [authGuard, roleGuard(['staff', 'admin'])],
    loadComponent: () => import('./features/staff/staff-dashboard.component').then(m => m.StaffDashboardComponent)
  },
  {
    path: 'staff/scan',
    canActivate: [authGuard, roleGuard(['staff', 'admin'])],
    loadComponent: () => import('./features/staff/qr-scanner.component').then(m => m.QrScannerComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  { path: '**', redirectTo: 'menu' }
];
