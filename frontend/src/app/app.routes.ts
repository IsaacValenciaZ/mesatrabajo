import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
//Hijas
import { UsersListComponent } from './admin-dashboard/users-list/users-list';
import { UserRegisterComponent } from './admin-dashboard/user-register/user-register';
import { TicketsComponent } from './admin-dashboard/tickets/tickets';
import { TicketsListComponent } from './admin-dashboard/tickets-list/tickets-list';

import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard';
import { PersonalDashboardComponent } from './personal-dashboard/personal-dashboard';
import { authGuard } from './auth.guard'; 

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    
  
   { 
    path: 'admin', 
    component: AdminDashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'tickets', pathMatch: 'full' }, 
       { path: 'tickets', component: TicketsComponent },
      { path: 'usuarios', component: UsersListComponent },
      { path: 'registro', component: UserRegisterComponent },
      { path: 'tickets-list', component: TicketsListComponent },

    ]
  },
    { path: 'supervisor', component: SupervisorDashboardComponent },
    { path: 'personal', component: PersonalDashboardComponent },
   
];