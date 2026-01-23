import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-personal-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-history.html',
  styleUrls: ['../personal-dashboard.css']
})
export class PersonalHistoryComponent implements OnInit {

  private apiService = inject(ApiService);
  private cd = inject(ChangeDetectorRef);

  user: any = {};
  ticketsHistorial: any[] = []; 
  cargando = true;

  ngOnInit() {
    const userStored = localStorage.getItem('usuario_actual');
    if (userStored) {
      this.user = JSON.parse(userStored);
      this.cargarTickets();
    }
  }

  cargarTickets() {
    this.cargando = true;
    const cacheBuster = new Date().getTime();
    
    this.apiService.getMisTickets(this.user.nombre + '&t=' + cacheBuster).subscribe({
      next: (data) => {
        const todos = data || [];
        this.ticketsHistorial = todos.filter((t: any) => t.estado === 'Completo');
        this.cargando = false;
        this.cd.detectChanges(); 
      },
      error: (err) => {
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }

  cambiarEstado(ticket: any) {
    Swal.fire({
      title: '¿Reabrir reporte?',
      text: `El reporte #${ticket.id} volverá a estar activo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, reabrir',
      confirmButtonColor: '#56212f', 
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardarNuevoEstado(ticket.id, 'En espera');
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
          Toast.fire({ icon: 'success', title: 'Reporte reabierto' });
          this.cargarTickets(); 
        } else {
          Swal.fire('Error', 'No se pudo actualizar', 'error');
        }
      }
    });
  }
}