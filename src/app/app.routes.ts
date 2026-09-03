import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [roleGuard('AUDITOR')],
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoice-list').then((m) => m.InvoiceListPage),
      },
      {
        path: 'invoices/new',
        canActivate: [roleGuard('OPERADOR')],
        loadComponent: () =>
          import('./features/invoices/invoice-create').then((m) => m.InvoiceCreatePage),
      },
      {
        path: 'invoices/:id',
        loadComponent: () =>
          import('./features/invoices/invoice-detail').then((m) => m.InvoiceDetailPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
