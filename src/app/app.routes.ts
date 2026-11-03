import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in – ThreatLens',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard – ThreatLens',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'threats',
        title: 'Threat Feed – ThreatLens',
        loadComponent: () => import('./features/threat-feed/threat-feed.component').then((m) => m.ThreatFeedComponent)
      },
      {
        path: 'threats/:id',
        title: 'Threat Details – ThreatLens',
        loadComponent: () => import('./features/threat-feed/threat-detail.component').then((m) => m.ThreatDetailComponent)
      },
      {
        path: 'ioc',
        title: 'IOC Lookup – ThreatLens',
        loadComponent: () => import('./features/threat-feed/ioc-lookup.component').then((m) => m.IocLookupComponent)
      },
      {
        path: 'incidents',
        title: 'Incidents – ThreatLens',
        loadComponent: () => import('./features/incidents/incidents.component').then((m) => m.IncidentsComponent)
      },
      {
        path: 'reports',
        title: 'Reports – ThreatLens',
        loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent)
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        title: 'User Management – ThreatLens',
        loadComponent: () => import('./features/admin/users.component').then((m) => m.UsersComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
