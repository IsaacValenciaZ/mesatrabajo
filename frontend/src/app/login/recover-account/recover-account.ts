import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recover-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recover-account.html',
  styleUrls: ['./recover-account.css']
})
export class RecoverAccountComponent {
  
  private router = inject(Router);
  
  email: string = '';

  enviarCorreo() {
    if (!this.email) {
      Swal.fire('Atención', 'Por favor ingresa tu correo electrónico', 'warning');
      return;
    }


    Swal.fire({
      icon: 'success',
      title: 'Correo Enviado',
      text: 'Si el correo existe, recibirás las instrucciones en breve.',
      confirmButtonColor: '#8b2136'
    }).then(() => {
      this.router.navigate(['/login']);
    });
  }
}