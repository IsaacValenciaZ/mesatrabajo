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
    const cacheBuster = new Date().getTime();
    
    // Usamos 'nombre' o 'id' según como haya quedado tu servicio (aquí respeto tu código actual)
    this.apiService.getMisTickets(this.user.nombre).subscribe({
      next: (data) => {
        const todos = data || [];
        this.fechaActual = new Date();

        // 1. BARRIDO AUTOMÁTICO DE VENCIDOS
        todos.forEach((t: any) => {
            // Solo analizamos los que están activos (ni completos, ni incompletos)
            if (t.estado !== 'Completo' && t.estado !== 'Incompleto') {
                if (t.fecha_limite && new Date(t.fecha_limite) < this.fechaActual) {
                    
                    // ¡VENCIDO! Lo marcamos como Incompleto silenciosamente
                    this.marcarComoVencido(t.id);
                    
                    // Lo marcamos localmente para que el filtro de abajo lo oculte ya
                    t.estado = 'Incompleto'; 
                }
            }
        });

        // 2. FILTRO: Mostrar solo lo que NO está completo NI incompleto
        this.ticketsPendientes = todos.filter((t: any) => 
            t.estado !== 'Completo' && t.estado !== 'Incompleto'
        );
        
        this.cargando = false;
        this.cd.detectChanges(); 
      },
      error: (err) => {
        this.cargando = false;
      }
    });
  }

  // Función auxiliar silenciosa (sin alertas)
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
      confirmButtonColor: '#c3b08f',
      background: '#fff',
      iconColor: '#977e5b'
    });
  }

  cambiarEstado(ticket: any) {
    Swal.fire({
      title: 'Actualizar Estado',
      text: `Reporte #${ticket.id}`,
      icon: 'question',
      input: 'select',
      inputOptions: {
        'En espera': '🟡 En espera',
        'Incompleto': '🔴 Incompleto', // Opción manual
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
            toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
          });
          Toast.fire({ icon: 'success', title: 'Estado actualizado' });
          this.cargarTickets(); 
        } else {
          Swal.fire('Error', 'No se pudo actualizar', 'error');
        }
      }
    });
  }
}