import { Routes } from '@angular/router';

import { studyPlansAuthGuard } from './core/auth/study-plans-auth.guard';
import { LoginPage } from './features/auth/login.page';
import { PlansPage } from './features/plans/plans.page';
import { ShellComponent } from './layouts/shell.component';

export const routes: Routes = [
  { path: 'login', title: 'Iniciar sesión', component: LoginPage },
  {
    path: '',
    component: ShellComponent,
    canActivate: [studyPlansAuthGuard],
    children: [{ path: '', title: 'Planes de estudio', component: PlansPage }],
  },
  { path: '**', redirectTo: '' },
];
