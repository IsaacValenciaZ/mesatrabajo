import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';


import { SecretariaDashboardComponent } from './secretaria-dashboard/secretaria-dashboard';
import { UsersListComponent } from './secretaria-dashboard/users-list/users-list';
//import { UserRegisterComponent } from './secretaria-dashboard/user-register/user-register';
import { TicketsComponent } from './secretaria-dashboard/tickets/tickets';
import { TicketsListComponent } from './secretaria-dashboard/tickets-list/tickets-list';
import { UserProfileComponent } from './secretaria-dashboard/user-profile/user-profile';
import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard';
import { PersonalActivoComponent } from './supervisor-dashboard/personal-activo/personal-activo.component';
import { HistorialEntradasComponent } from './supervisor-dashboard/historial-tickets/historial-tickets.component';
import { PersonalDashboardComponent } from './personal-dashboard/personal-dashboard';
import { PersonalPendingComponent } from './personal-dashboard/personal-pending/personal-pending';
import { PersonalHistoryComponent } from './personal-dashboard/personal-history/personal-history';
import { PersonalProfileComponent } from './personal-dashboard/personal-profile/personal-profile';

import { authGuard } from './auth.guard';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },

    { path: 'login', component: LoginComponent },

    {
        path: 'secretaria',
        component: SecretariaDashboardComponent,
        canActivate: [authGuard],
        children: [
        { path: '', redirectTo: 'personal-activo', pathMatch: 'full' }, 
        { path: 'personal-activo', component: PersonalActivoComponent },
        { path: 'historial-entradas', component: HistorialEntradasComponent }
        ]
    },

    {
        path: 'supervisor',
        component: SupervisorDashboardComponent,
        children: [
            { path: 'personal-activo', component: PersonalActivoComponent },
            { path: 'historial-entradas', component: HistorialEntradasComponent }
        ]
    },

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