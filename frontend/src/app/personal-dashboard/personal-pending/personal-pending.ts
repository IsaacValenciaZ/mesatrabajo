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

 cambiarEstado(ticket: any) {
    Swal.fire({
      title: `Finalizar Ticket #${ticket.id}`,
      html: `
        <div style="text-align: left;">
          <label style="font-weight: bold; font-size: 0.9rem;">Reporte de solución:</label>
          <textarea id="solucion-text" class="swal2-textarea" style="margin: 10px 0; width: 90%; height: 100px;" placeholder="¿Qué se reparó o realizó?"></textarea>
          
          <label style="font-weight: bold; font-size: 0.9rem; display: block; margin-top: 10px;">Adjuntar imagen de evidencia:</label>
          <input type="file" id="evidencia-file" class="swal2-file" accept="image/*" style="width: 100%; margin-top: 5px;">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar y Finalizar',
      confirmButtonColor: '#27ae60',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const resolucion = (document.getElementById('solucion-text') as HTMLTextAreaElement).value;
        const fileInput = (document.getElementById('evidencia-file') as HTMLInputElement).files?.[0];

        if (!resolucion) {
          Swal.showValidationMessage('La descripción de la solución es obligatoria');
          return false;
        }
        return { resolucion: resolucion, archivo: fileInput };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.enviarEvidenciaFinal(ticket.id, result.value.resolucion, result.value.archivo);
      }
    });
}
enviarEvidenciaFinal(id: number, resolucion: string, archivo?: File) {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('estado', 'Completo');
    formData.append('descripcion_resolucion', resolucion);
    
    if (archivo) {
      formData.append('evidencia', archivo);
    }

    this.apiService.actualizarEstadoTicketConEvidencia(formData).subscribe({
      next: (res: any) => {
        if (res.status === true) {
          Swal.fire({ icon: 'success', title: 'Ticket cerrado correctamente', timer: 2000, showConfirmButton: false });
          this.cargarTickets(); 
        } else {
          Swal.fire('Error', res.message || 'No se pudo actualizar', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error de conexión', 'No se pudo conectar con el servidor', 'error');
      }
    });
}
}