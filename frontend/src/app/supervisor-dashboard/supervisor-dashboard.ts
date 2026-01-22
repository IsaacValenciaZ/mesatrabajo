import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supervisor-dashboard.html',
  styleUrl: './supervisor-dashboard.css'
})
export class SupervisorDashboardComponent implements OnInit {
  
  http = inject(HttpClient);
  router = inject(Router);
cdr = inject(ChangeDetectorRef);
  apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/get_users.php'; 

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