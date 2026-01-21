import { Component, OnInit, inject } from '@angular/core'; // Agrega OnInit
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
export class LoginComponent implements OnInit { // Implementa OnInit

  email = '';
  password = '';
  
  private apiService = inject(ApiService);
  private router = inject(Router);

  // 1. ESTO ES LO NUEVO: Revisar sesión al iniciar
  ngOnInit() {
    this.verificarSesionExistente();
  }

  verificarSesionExistente() {
    const usuarioGuardado = localStorage.getItem('usuario_actual');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      // Si ya existe, lo mandamos a su panel sin pedir login
      this.redirigirPorRol(usuario.rol);
    }
  }

  // Sacamos la lógica de redirección a una función para reusarla
  redirigirPorRol(rol: string) {
    if (rol === 'admin') {
      this.router.navigate(['/admin']);
    } else if (rol === 'supervisor') {
      this.router.navigate(['/supervisor']);
    } else {
      this.router.navigate(['/personal']);
    }
  }

  login() {
    console.log("Intentando loguear con:", this.email, this.password);

    if (this.email === '' || this.password === '') {
      alert('Por favor llena todos los campos');
      return;
    }

    this.apiService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        console.log("Respuesta:", response);

        if (response.status === true) {
          // Guardamos sesión
          localStorage.setItem('usuario_actual', JSON.stringify(response.data));
          
          alert('¡Bienvenido ' + response.data.nombre + '!');
          
          // Usamos la función auxiliar
          this.redirigirPorRol(response.data.rol);
          
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (error: any) => {
        console.error("Error:", error);
        alert('Error de conexión');
      }
    });
  }
}