import { Component, OnInit, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit { 

  email = '';
  password = '';
  
vistaRecuperar = false;

  private apiService = inject(ApiService);
  private router = inject(Router);

  ngOnInit() {
    this.verificarSesionExistente();
  }

  verificarSesionExistente() {
    const usuarioGuardado = localStorage.getItem('usuario_actual');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      this.redirigirPorRol(usuario.rol);
    }
  }

  redirigirPorRol(rol: string) {
    if (rol === 'admin') {
      this.router.navigate(['/admin']);
    } else if (rol === 'supervisor') {
      this.router.navigate(['/supervisor']);
    } else {
      this.router.navigate(['/personal']);
    }
  }

  toggleVista() {
    this.vistaRecuperar = !this.vistaRecuperar;
  }

  login() {
    console.log("Intentando loguear con:", this.email, this.password);

    
    if (this.email === '' || this.password === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, ingresa tu correo y contraseña.',
        confirmButtonColor: '#8b2136' 
      });
      return;
    }

    this.apiService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        console.log("Respuesta:", response);

        if (response.status === true) {
          localStorage.setItem('usuario_actual', JSON.stringify(response.data));
          
         
          Swal.fire({
            icon: 'success',
            title: `¡Bienvenido ${response.data.nombre}!`,
            text: 'Ingresando al sistema...',
            timer: 1500, 
            showConfirmButton: false
          }).then(() => {
            
            this.redirigirPorRol(response.data.rol);
          });
          
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: response.message || 'Usuario o contraseña incorrectos',
            confirmButtonColor: '#8b2136'
          });
        }
      },
      error: (error: any) => {
        console.error("Error:", error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar con el servidor. Intenta más tarde.',
          confirmButtonColor: '#2c3e50'
        });
      }
    });
  }


  enviarCorreoRecuperacion() {
    if (!this.email) {
      Swal.fire('Atención', 'Por favor ingresa tu correo electrónico para continuar.', 'warning');
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Solicitud Enviada',
      text: 'Se envio un correo para confirmar.',
      confirmButtonColor: '#8b2136'
    }).then(() => {

      this.toggleVista();
    });
  }
}