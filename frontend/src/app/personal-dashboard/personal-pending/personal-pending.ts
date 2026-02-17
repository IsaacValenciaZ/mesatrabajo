import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-personal-pending',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './personal-pending.html',
  styleUrls: ['./personal-pending.css'] 
})
export class PersonalPendingComponent implements OnInit {

  private apiService = inject(ApiService);
  private cd = inject(ChangeDetectorRef);

  user: any = {};
  ticketsPendientes: any[] = []; 
  cargando = true;
  fechaActual = new Date(); 

  ngOnInit() {
    const userStored = localStorage.getItem('usuario_actual');
    if (userStored) {
      this.user = JSON.parse(userStored);
      this.cargarTickets();
    }
  }

  cargarTickets() {
    this.cargando = true;
    
    this.apiService.getMisTickets(this.user.nombre).subscribe({
      next: (data) => {
        const todos = data || [];
        this.fechaActual = new Date();
      
        todos.forEach((t: any) => {
    
            if (t.estado !== 'Completo' && t.estado !== 'Completado' && t.fecha_limite && new Date(t.fecha_limite) < this.fechaActual) {
                
            }
        });

        this.ticketsPendientes = todos.filter((t: any) => 
            (t.estado === 'En espera' || t.estado === 'Asignado' || !t.estado)
        );
    
        this.ticketsPendientes.sort((a, b) => {
             return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
        });
        
        this.cargando = false;
        this.cd.detectChanges(); 
      },
      error: (err) => {
        this.cargando = false;
      }
    });
  }
  marcarComoVencido(id: number) {
      this.apiService.actualizarEstadoTicket(id, 'Incompleto').subscribe({
          next: () => console.log(`Ticket ${id} movido a historial por vencimiento.`),
          error: (e) => console.error(e)
      });
  }

  esVencido(fechaLimite: string): boolean {
    if (!fechaLimite) return false;
    return new Date(fechaLimite) < this.fechaActual;
  }

  verNotaCompleta(nota: string) {
    Swal.fire({
      title: 'Detalle de la Nota',
      text: nota ? nota : 'Sin información adicional.',
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#56212f',
      background: '#fff',
      iconColor: '#977e5b'
    });
  }

  // Solo permitir COMPLETAR
  cambiarEstado(ticket: any) {
    Swal.fire({
      title: '¿Finalizar Reporte?',
      text: `¿Confirmas que el reporte #${ticket.id} ha sido atendido?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Completar',
      confirmButtonColor: '#27ae60', 
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardarNuevoEstado(ticket.id, 'Completo');
      }
    });
  }

  guardarNuevoEstado(id: number, nuevoEstado: string) {
    this.apiService.actualizarEstadoTicket(id, nuevoEstado).subscribe({
      next: (res) => {
        if (res.status === true) {
          const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
          });
          Toast.fire({ icon: 'success', title: 'Ticket completado' });
          this.cargarTickets(); 
        } else {
          Swal.fire('Error', 'No se pudo actualizar', 'error');
        }
      }
    });
  }
}