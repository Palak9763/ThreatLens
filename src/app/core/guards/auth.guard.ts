import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/models';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/** Blocks routes for users that are not logged in. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

/** Role based access: route data `{ roles: ['admin'] }`. */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const roles = (route.data['roles'] ?? []) as Role[];
  if (auth.hasRole(...roles)) return true;
  toast.show('Access denied: your role cannot open that page.', 'error');
  return router.createUrlTree(['/dashboard']);
};

/** Prevents logged-in users from seeing the login page again. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? router.createUrlTree(['/dashboard']) : true;
};
