import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  
  private apiService = inject(ApiService);
  private router = inject(Router);

  constructor() {}

  login() {
    console.log("Intentando loguear con:", this.email, this.password); 

    if (this.email === '' || this.password === '') {
      alert('Por favor llena todos los campos');
      return;
    }

    this.apiService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log("Respuesta del servidor:", response);

        if (response.status === true) {
       
          localStorage.setItem('usuario_actual', JSON.stringify(response.data));

          alert('¡Bienvenido ' + response.data.nombre + '!');
          
      
          const rol = response.data.rol;

          if (rol === 'admin') {
            this.router.navigate(['/admin']);
          } else if (rol === 'supervisor') {
            this.router.navigate(['/supervisor']);
          } else {
            this.router.navigate(['/personal']);
          }
          
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (error) => {
        console.error("Error de conexión:", error);
        alert('Hubo un error al conectar con el servidor.');
      }
    });
  }
}