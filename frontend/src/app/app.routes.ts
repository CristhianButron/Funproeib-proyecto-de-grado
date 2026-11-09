import { Routes } from '@angular/router';
import { adminGuard, authGuard, evaluadorGuard, postulanteGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/landing/landing').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent) },
  { path: 'registro', loadComponent: () => import('./features/auth/registro').then(m => m.RegistroComponent) },
  { path: 'verificar-correo', loadComponent: () => import('./features/auth/verificar-correo').then(m => m.VerificarCorreoComponent) },
  {
    path: 'cambiar-password',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/cambiar-password-obligatorio').then(m => m.CambiarPasswordObligatorioComponent),
  },

  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard').then(m => m.AdminDashboardComponent) },
      { path: 'programas', loadComponent: () => import('./features/admin/programas-admin').then(m => m.ProgramasAdminComponent) },
      { path: 'postulantes', loadComponent: () => import('./features/admin/postulantes').then(m => m.PostulantesComponent) },
      { path: 'evaluaciones', loadComponent: () => import('./features/admin/evaluaciones').then(m => m.EvaluacionesComponent) },
      { path: 'criterios', loadComponent: () => import('./features/admin/criterios-admin').then(m => m.CriteriosAdminComponent) },
      { path: 'reportes', loadComponent: () => import('./features/admin/reportes').then(m => m.ReportesComponent) },
      { path: 'lista-negra', loadComponent: () => import('./features/admin/lista-negra').then(m => m.ListaNegraComponent) },
      { path: 'usuarios', loadComponent: () => import('./features/admin/usuarios-admin').then(m => m.UsuariosAdminComponent) },
      { path: 'perfil', loadComponent: () => import('./features/perfil/mi-perfil').then(m => m.MiPerfilComponent) },
    ],
  },

  {
    path: 'portal',
    canActivate: [postulanteGuard],
    loadComponent: () => import('./features/portal/portal-layout').then(m => m.PortalLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/portal/portal-programas').then(m => m.PortalProgramasComponent) },
      { path: 'mis-postulaciones', loadComponent: () => import('./features/portal/portal-mis-postulaciones').then(m => m.PortalMisPostulacionesComponent) },
      { path: 'perfil', loadComponent: () => import('./features/perfil/mi-perfil').then(m => m.MiPerfilComponent) },
    ],
  },

  {
    path: 'evaluador',
    canActivate: [evaluadorGuard],
    loadComponent: () => import('./features/evaluador/evaluador-layout').then(m => m.EvaluadorLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/admin/evaluaciones').then(m => m.EvaluacionesComponent) },
      { path: 'postulantes', loadComponent: () => import('./features/admin/postulantes').then(m => m.PostulantesComponent) },
      { path: 'reportes', loadComponent: () => import('./features/admin/reportes').then(m => m.ReportesComponent) },
      { path: 'perfil', loadComponent: () => import('./features/perfil/mi-perfil').then(m => m.MiPerfilComponent) },
    ],
  },

  { path: '**', redirectTo: '' },
];
