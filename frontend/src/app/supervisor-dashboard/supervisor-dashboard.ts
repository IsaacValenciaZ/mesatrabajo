import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ViewUserComponent } from './view-user/view-user.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { DeleteUserComponent } from './delete-user/delete-user.component';
import { CreateUserComponent } from './create-user/create-user.component';  
@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule,
    ViewUserComponent,
    EditUserComponent,
    DeleteUserComponent,
    CreateUserComponent,
  ],
  templateUrl: './supervisor-dashboard.html',
  styleUrl: './supervisor-dashboard.css'

})
export class SupervisorDashboardComponent implements OnInit {

  http = inject(HttpClient);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/get_users.php';
  
showView: boolean = false;
showEdit: boolean = false;
showDelete: boolean = false;
selectedUser: any = null; 
showCreate: boolean = false;

openViewModal(user: any) {
  this.selectedUser = user;
  this.showView = true;
}

openEditModal(user: any) {
  this.selectedUser = { ...user }; 
  this.showEdit = true;
}

openDeleteModal(user: any) {
  this.selectedUser = user;
  this.showDelete = true;
}

openCreateModal() {
    this.showCreate = true;
}

handleCreateUser(newUser: any) {
    console.log("Creando usuario:", newUser);
    const tempId = this.usersList.length + 1;
    this.usersList.push({ id: tempId, ...newUser });
    this.calcularEstadisticas();
    this.closeModals();
  }

closeModals() {
  this.showView = false;
  this.showEdit = false;
  this.showDelete = false;
  this.selectedUser = null;
  this.showCreate = false;
}

  usersList: any[] = [];


  totalUsers: number = 0;
  countPersonal: number = 0;
  countAdmin: number = 0;
  countSupervisor: number = 0;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        console.log("Datos recibidos:", data);

        this.usersList = data;
        this.calcularEstadisticas();


        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error cargando usuarios:", err)
    });
  }

  calcularEstadisticas() {
    if (!this.usersList) return;

    this.totalUsers = this.usersList.length;


    this.countPersonal = this.usersList.filter(u =>
      u.rol && u.rol.trim().toLowerCase() === 'personal'
    ).length;


    this.countAdmin = this.usersList.filter(u =>
      u.rol && (u.rol.trim().toLowerCase() === 'admin' || u.rol.trim().toLowerCase() === 'administrador')
    ).length;


    this.countSupervisor = this.usersList.filter(u =>
      u.rol && u.rol.trim().toLowerCase() === 'supervisor'
    ).length;
  }

  logout() {
    localStorage.removeItem('usuario_actual');
    this.router.navigate(['/login']);
  }
}
 


