import { Routes } from '@angular/router';
import { adminGuard, postulanteGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/landing/landing').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent) },
  { path: 'registro', loadComponent: () => import('./features/auth/registro').then(m => m.RegistroComponent) },

  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard').then(m => m.AdminDashboardComponent) },
      { path: 'programas', loadComponent: () => import('./features/admin/programas-admin').then(m => m.ProgramasAdminComponent) },
      { path: 'postulantes', loadComponent: () => import('./features/admin/postulantes').then(m => m.PostulantesComponent) },
      { path: 'evaluaciones', loadComponent: () => import('./features/admin/evaluaciones').then(m => m.EvaluacionesComponent) },
      { path: 'lista-negra', loadComponent: () => import('./features/admin/lista-negra').then(m => m.ListaNegraComponent) },
    ],
  },

  {
    path: 'portal',
    canActivate: [postulanteGuard],
    loadComponent: () => import('./features/portal/portal-layout').then(m => m.PortalLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/portal/portal-programas').then(m => m.PortalProgramasComponent) },
      { path: 'mis-postulaciones', loadComponent: () => import('./features/portal/portal-mis-postulaciones').then(m => m.PortalMisPostulacionesComponent) },
    ],
  },

  { path: '**', redirectTo: '' },
];
