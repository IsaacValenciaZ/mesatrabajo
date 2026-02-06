import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core'; // <--- 1. IMPORTA ESTO
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

  pasoActual = 0; 
  emailRecuperacion = '';
  tokenIngresado = '';
  nuevaPassword = '';
  confirmarPassword = '';

  private apiService = inject(ApiService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef); 

  ngOnInit() {
    this.verificarSesionExistente();
  }

  forzarCambioDePaso(nuevoPaso: number) {
    this.ngZone.run(() => {
      this.pasoActual = nuevoPaso;
      this.cdr.detectChanges(); 
    });
  }

  verificarSesionExistente() {
    const usuarioGuardado = localStorage.getItem('usuario_actual');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      this.redirigirPorRol(usuario.rol);
    }
  }

  redirigirPorRol(rol: string) {
    this.ngZone.run(() => {
        if (rol === 'admin') this.router.navigate(['/admin']);
        else if (rol === 'supervisor') this.router.navigate(['/supervisor']);
        else this.router.navigate(['/personal']);
    });
  }

  cambiarPaso(paso: number) {
    this.forzarCambioDePaso(paso); 
    if (paso === 0) {
      this.emailRecuperacion = '';
      this.tokenIngresado = '';
      this.nuevaPassword = '';
    }
  }

  login() {
    if (!this.email || !this.password) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Ingresa correo y contraseña.', confirmButtonColor: '#8b2136' });
      return;
    }

    this.apiService.login(this.email, this.password).subscribe({
      next: (response: any) => {
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
          Swal.fire({ icon: 'error', title: 'Acceso denegado', text: response.message, confirmButtonColor: '#8b2136' });
        }
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#2c3e50' })
    });
  }

  enviarToken() {
    if (!this.emailRecuperacion) {
      Swal.fire('Atención', 'Ingresa tu correo.', 'warning');
      return;
    }
    
    Swal.fire({ title: 'Enviando...', text: 'Conectando con el servidor', didOpen: () => Swal.showLoading() });
    
    this.apiService.enviarTokenRecuperacion(this.emailRecuperacion).subscribe({
      next: (res: any) => {
        if (res.status) {
          Swal.fire({
            icon: 'success',
            title: 'Código Enviado',
            text: res.message,
            confirmButtonColor: '#8b2136'
          }).then(() => {
            this.forzarCambioDePaso(2); 
          });
        } else {
          Swal.close();
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: (err) => {
        Swal.close();
        Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
      }
    });
  }

  verificarToken() {
    if (!this.tokenIngresado || this.tokenIngresado.length < 6) {
      Swal.fire('Error', 'Código inválido (debe ser de 6 dígitos).', 'error');
      return;
    }

    Swal.fire({ title: 'Verificando...', didOpen: () => Swal.showLoading() });

    this.apiService.verificarToken(this.emailRecuperacion, this.tokenIngresado).subscribe({
      next: (res: any) => {
        Swal.close(); 
        if (res.status) {
            this.forzarCambioDePaso(3);
        } else {
          Swal.fire('Código Incorrecto', res.message, 'error');
        }
      },
      error: () => {
        Swal.close();
        Swal.fire('Error', 'Error al verificar conexión.', 'error');
      }
    });
  }

  guardarPassword() {
    if (!this.nuevaPassword || !this.confirmarPassword) {
      Swal.fire('Atención', 'Llena ambos campos.', 'warning');
      return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
      return;
    }

    Swal.fire({ title: 'Actualizando...', didOpen: () => Swal.showLoading() });

    this.apiService.cambiarPassword(this.emailRecuperacion, this.nuevaPassword).subscribe({
      next: (res: any) => {
        if (res.status) {
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Contraseña actualizada. Inicia sesión.',
            confirmButtonColor: '#8b2136'
          }).then(() => {
            this.ngZone.run(() => {
              this.email = this.emailRecuperacion;
              this.password = '';
              this.forzarCambioDePaso(0); 
            });
          });
        } else {
          Swal.close();
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: () => {
        Swal.close();
        Swal.fire('Error', 'No se pudo actualizar la contraseña.', 'error');
      }
    });
  }
}