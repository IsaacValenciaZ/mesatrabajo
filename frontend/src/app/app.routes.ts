import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { RecoverAccountComponent } from './login/recover-account/recover-account';

import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { UsersListComponent } from './admin-dashboard/users-list/users-list';
//import { UserRegisterComponent } from './admin-dashboard/user-register/user-register';
import { TicketsComponent } from './admin-dashboard/tickets/tickets';
import { TicketsListComponent } from './admin-dashboard/tickets-list/tickets-list';
import { UserProfileComponent } from './admin-dashboard/user-profile/user-profile';

import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard';

import { PersonalDashboardComponent } from './personal-dashboard/personal-dashboard';
import { PersonalPendingComponent } from './personal-dashboard/personal-pending/personal-pending';
import { PersonalHistoryComponent } from './personal-dashboard/personal-history/personal-history';
import { PersonalProfileComponent } from './personal-dashboard/personal-profile/personal-profile';

import { authGuard } from './auth.guard'; 


export const routes: Routes = [
{ path: '', redirectTo: '/login', pathMatch: 'full' },
    
    { path: 'login', component: LoginComponent },

    { path: 'recover-account', component: RecoverAccountComponent },
     
    
     
     
    { 
        path: 'admin', 
        component: AdminDashboardComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'tickets', pathMatch: 'full' }, 
            { path: 'tickets', component: TicketsComponent },
            { path: 'usuarios', component: UsersListComponent },
           // { path: 'registro', component: UserRegisterComponent },
            { path: 'tickets-list', component: TicketsListComponent },
            { path: 'perfil', component: UserProfileComponent },

        ]
    },

    { path: 'supervisor', component: SupervisorDashboardComponent },

    { 
        path: 'personal', 
        component: PersonalDashboardComponent, 
        children: [
            { path: '', redirectTo: 'mis-reportes', pathMatch: 'full' }, 
            { path: 'mis-reportes', component: PersonalPendingComponent },
            { path: 'historial', component: PersonalHistoryComponent },
            { path: 'perfil', component: PersonalProfileComponent },
        ]
    },
];