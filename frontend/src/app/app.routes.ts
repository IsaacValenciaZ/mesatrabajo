import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard';
import { PersonalDashboardComponent } from './personal-dashboard/personal-dashboard';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    
  
    { path: 'admin', component: AdminDashboardComponent },
    { path: 'supervisor', component: SupervisorDashboardComponent },
    { path: 'personal', component: PersonalDashboardComponent }
];