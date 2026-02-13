import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent {


  private apiService = inject(ApiService);


  newUser = {
    nombre: '',
    email: '',
    password: '123456',
    rol: 'personal'
  };

  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<any>();

  crear() {

    if (this.newUser.nombre && this.newUser.email) {

      this.apiService.register(this.newUser).subscribe({
        next: (res) => {
      
          Swal.fire({
            icon: 'success',
            title: '¡Usuario Registrado!',
            text: `El usuario ${this.newUser.nombre} se guardó correctamente.`,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#56212f' 
          });

          this.create.emit(this.newUser);
      
          this.close.emit();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo conectar con la base de datos o el correo ya existe.',
            confirmButtonColor: '#56212f'
          });
        }
      });

    } else {
      
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, llena el nombre y el correo electrónico.',
        confirmButtonColor: '#000000'
      });
    }
  }
}