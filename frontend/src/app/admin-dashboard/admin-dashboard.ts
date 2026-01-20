import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  
  router = inject(Router);
  http = inject(HttpClient); 


  apiUrl = 'http://localhost/backend/get_users.php';
  

  apiUrlRegistro = 'http://localhost/backend/register.php';

  isSidebarOpen: boolean = true; 
  currentSection: string = 'registro'; 

  newUser = { nombre: '', email: '', rol: 'personal', password: '' };
  newTicket = { destinatarioId: '', asunto: '', mensaje: '' };
  
  usersList: any[] = [];

  get usuariosPersonal() {
    return this.usersList.filter(user => user.rol === 'personal');
  }

  ngOnInit() {
    this.obtenerUsuarios();
  }

  obtenerUsuarios() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        console.log('Todos los usuarios recibidos:', data);

        this.usersList = data.filter(user => user.rol === 'personal');
        
        console.log('Lista final filtrada:', this.usersList);
      },
      error: (err) => {
        console.error('Error conectando a la BD (GET):', err);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  cambiarSeccion(seccion: string) {
    this.currentSection = seccion;
    if (window.innerWidth < 768) {
      this.isSidebarOpen = false;
    }
  }


  registrarUsuario() {
    console.log("Enviando datos...", this.newUser);


    if (!this.newUser.nombre || !this.newUser.email || !this.newUser.password) {
        alert("Por favor completa todos los campos");
        return;
    }

 
    this.http.post(this.apiUrlRegistro, this.newUser).subscribe({
        next: (response: any) => {
            console.log("Respuesta del servidor:", response);

            if (response.status === true) {
                alert("¡Usuario registrado exitosamente!");
                

                this.newUser = { nombre: '', email: '', rol: 'personal', password: '' };
                

                this.obtenerUsuarios();
            } else {
                alert("Error: " + response.message);
            }
        },
        error: (error) => {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor.");
        }
    });
  }

  enviarTicket() {
    if(!this.newTicket.destinatarioId || !this.newTicket.mensaje) {
      alert("Por favor selecciona un destinatario y escribe un mensaje");
      return;
    }
    
    const destinatario = this.usersList.find(u => u.id == Number(this.newTicket.destinatarioId));
    
    console.log("Enviando ticket a:", destinatario?.nombre);
    console.log("Datos:", this.newTicket);
    
    alert(`Ticket enviado correctamente a ${destinatario?.nombre}`);
    
    this.newTicket = { destinatarioId: '', asunto: '', mensaje: '' };
  }

  logout() {
    localStorage.removeItem('usuario_actual');
    this.router.navigate(['/login']);
  }
}