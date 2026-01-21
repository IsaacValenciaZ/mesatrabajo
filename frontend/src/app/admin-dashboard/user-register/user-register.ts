import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-register.html',
  styleUrl: './user-register.css'
})
export class UserRegisterComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);

  newUser = { nombre: '', email: '', password: '', rol: 'personal' };

  registrarUsuario() {
    this.apiService.register(this.newUser).subscribe({
      next: () => {
        alert('Usuario registrado con éxito');
        this.router.navigate(['/admin/usuarios']); // Redirigir a la lista
      },
      error: () => alert('Error al registrar')
    });
  }
}