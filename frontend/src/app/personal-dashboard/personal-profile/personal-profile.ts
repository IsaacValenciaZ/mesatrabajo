import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-personal-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-profile.html',
  styleUrls: ['./personal-profile.css']
})
export class PersonalProfileComponent implements OnInit {

  http = inject(HttpClient);
  apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/update_profile.php'; 

  user: any = {};
  newPassword = '';
  confirmPassword = ''; 

  ngOnInit() {
    const stored = localStorage.getItem('usuario_actual');
    if (stored) {
      this.user = JSON.parse(stored);
    }
  }

  actualizarPerfil() {
    
    if (!this.user.nombre || !this.user.email) {
      Swal.fire('Error', 'El nombre y correo no pueden estar vacíos', 'warning');
      return;
    }

    if (this.newPassword || this.confirmPassword) {
        if (this.newPassword !== this.confirmPassword) {
            Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
            return;
        }
    }

    const payload = {
      id: this.user.id,
      nombre: this.user.nombre,
      email: this.user.email,
      password: this.newPassword 
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: (res: any) => {
        if (res.status) {

          const updatedUser = { ...this.user }; 
          localStorage.setItem('usuario_actual', JSON.stringify(updatedUser));

          Swal.fire({
            icon: 'success',
            title: '¡Datos Actualizados!',
            confirmButtonColor: '#56212f'
          }).then(() => {
             window.location.reload();
          });
          
          this.newPassword = ''; 
          this.confirmPassword = '';

        } else {
          Swal.fire('Error', res.message || 'No se pudo actualizar', 'error');
        }
      },
      error: () => Swal.fire('Error', 'Error de conexión', 'error')
    });
  }
}