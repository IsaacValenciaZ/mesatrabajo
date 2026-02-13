import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-personal-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-dashboard.html',
  styleUrl: './personal-dashboard.css'
})
export class PersonalDashboardComponent implements OnInit {

  private apiService = inject(ApiService);
  private router = inject(Router);

  user: any = {};
  misTickets: any[] = [];
  cargando = true;

  ngOnInit() {
    this.verificarSesion();
  }

  verificarSesion() {
    const userStored = localStorage.getItem('usuario_actual');
    if (userStored) {
      this.user = JSON.parse(userStored);
      
      if(this.user.rol !== 'personal') {
        this.router.navigate(['/login']);
        return;
      }

      this.cargarMisTickets();

    } else {
      this.router.navigate(['/login']);
    }
  }

  cargarMisTickets() {
    this.cargando = true;
    this.apiService.getMisTickets(this.user.nombre).subscribe({
      next: (data) => {
        this.misTickets = data || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  verNotaCompleta(nota: string) {
    Swal.fire({
      title: 'Detalle de la Nota',
      text: nota ? nota : 'Sin información adicional.',
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#c3b08f', 
      background: '#fff',
      iconColor: '#977e5b' 
    });
  }

  cambiarEstado(ticket: any) {
    Swal.fire({
      title: 'Actualizar Estado',
      text: `Reporte #${ticket.id} - ${ticket.descripcion}`,
      icon: 'question',
      input: 'select',
      inputOptions: {
        'En espera': '🟡 En espera',
        'Incompleto': '🔴 Incompleto',
        'Completo': '🟢 Completo'
      },
      inputValue: ticket.estado,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#56212f', 
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardarNuevoEstado(ticket.id, result.value);
      }
    });
  }

  guardarNuevoEstado(id: number, nuevoEstado: string) {
    this.apiService.actualizarEstadoTicket(id, nuevoEstado).subscribe({
      next: (res) => {
        if (res.status === true) {
          
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
          
          Toast.fire({
            icon: 'success',
            title: 'Estado actualizado'
          });

          this.cargarMisTickets(); 
        } else {
          Swal.fire('Error', res.message || 'No se pudo actualizar', 'error');
        }
      },
      error: () => Swal.fire('Error', 'Error de conexión', 'error')
    });
  }

  logout() {
    localStorage.removeItem('usuario_actual');
    this.router.navigate(['/login']);
  }
}