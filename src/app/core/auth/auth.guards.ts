import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/invoice.model';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree([auth.isAuditor() ? '/dashboard' : '/invoices']);
};

export const roleGuard = (...roles: UserRole[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  const role = auth.role();
  if (role && roles.includes(role)) {
    return true;
  }
  return router.createUrlTree(['/invoices']);
};
