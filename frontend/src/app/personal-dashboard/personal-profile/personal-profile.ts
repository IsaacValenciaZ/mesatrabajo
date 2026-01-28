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

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/update_profile.php'; 

  user: any = { nombre: '', email: '' }; 
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
      Swal.fire('Atención', 'El nombre y el correo son obligatorios', 'warning');
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
          
          const stored = localStorage.getItem('usuario_actual');
          let fullUser = stored ? JSON.parse(stored) : {};
          fullUser.nombre = this.user.nombre;
          fullUser.email = this.user.email;
          
          localStorage.setItem('usuario_actual', JSON.stringify(fullUser));

          Swal.fire({
            icon: 'success',
            title: '¡Perfil Actualizado!',
            text: 'Tus datos se guardaron correctamente.',
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
      error: () => Swal.fire('Error', 'Fallo de conexión con el servidor', 'error')
    });
  }
}