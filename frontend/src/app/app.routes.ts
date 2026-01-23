import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';

// Admin Components
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { UsersListComponent } from './admin-dashboard/users-list/users-list';
import { UserRegisterComponent } from './admin-dashboard/user-register/user-register';
import { TicketsComponent } from './admin-dashboard/tickets/tickets';
import { TicketsListComponent } from './admin-dashboard/tickets-list/tickets-list';

// Supervisor
import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard';

// Personal Components (Layout y Hijos)
import { PersonalDashboardComponent } from './personal-dashboard/personal-dashboard';
import { PersonalPendingComponent } from './personal-dashboard/personal-pending/personal-pending';
import { PersonalHistoryComponent } from './personal-dashboard/personal-history/personal-history';

import { authGuard } from './auth.guard'; 

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    
    // RUTA ADMIN
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

    // RUTA SUPERVISOR
    { path: 'supervisor', component: SupervisorDashboardComponent },

    // RUTA PERSONAL (Ahora con Hijos)
    { 
        path: 'personal', 
        component: PersonalDashboardComponent, // El Layout (Menú)
        // canActivate: [authGuard], // Descomenta si usas el guard aquí también
        children: [
            { path: '', redirectTo: 'mis-reportes', pathMatch: 'full' }, // Redirección por defecto
            { path: 'mis-reportes', component: PersonalPendingComponent },
            { path: 'historial', component: PersonalHistoryComponent }
        ]
    },
];