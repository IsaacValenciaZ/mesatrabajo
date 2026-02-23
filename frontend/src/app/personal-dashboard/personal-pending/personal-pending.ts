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
  private cdr = inject(ChangeDetectorRef);

  usuarioActual: any = {};
  listaTicketsPendientes: any[] = []; 
  cargandoDatos = true;
  fechaReferenciaActual = new Date(); 

  ngOnInit() {
    const usuarioGuardado = localStorage.getItem('usuario_actual');
    if (usuarioGuardado) {
      this.usuarioActual = JSON.parse(usuarioGuardado);
      this.obtenerTicketsPendientes();
    }
  }

  obtenerTicketsPendientes() {
    this.cargandoDatos = true;
    
    this.apiService.getMisTickets(this.usuarioActual.nombre).subscribe({
      next: (datosDelServidor) => {
        const todosLosTickets = datosDelServidor || [];
        this.fechaReferenciaActual = new Date();
      
        this.listaTicketsPendientes = todosLosTickets.filter((ticket: any) => 
            ticket.estado === 'En espera' || ticket.estado === 'Asignado' || !ticket.estado
        );
    
        this.listaTicketsPendientes.sort((a, b) => {
             return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
        });
        
        this.cargandoDatos = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Error al obtener tickets pendientes", err);
        this.cargandoDatos = false;
        this.cdr.detectChanges();
      }
    });
  }

  verificarVencimiento(fechaLimite: string): boolean {
    if (!fechaLimite) return false;
    return new Date(fechaLimite) < this.fechaReferenciaActual;
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

  abrirModalFinalizacion(ticketSeleccionado: any) {
    Swal.fire({
      title: `Finalizar Ticket #${ticketSeleccionado.id}`,
      html: `
        <div style="text-align: left;">
          <label style="font-weight: bold; font-size: 0.9rem;">Reporte de solución:</label>
          <textarea id="solucion-text" class="swal2-textarea" style="margin: 10px 0; width: 90%; height: 100px;" placeholder="¿Qué tareas se realizaron para resolver el problema?"></textarea>
          
          <label style="font-weight: bold; font-size: 0.9rem; display: block; margin-top: 10px;">Adjuntar imagen de evidencia:</label>
          <input type="file" id="evidencia-file" class="swal2-file" accept="image/*" style="width: 100%; margin-top: 5px;">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar y Finalizar',
      confirmButtonColor: '#27ae60',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const descripcionResolucion = (document.getElementById('solucion-text') as HTMLTextAreaElement).value;
        const archivoEvidencia = (document.getElementById('evidencia-file') as HTMLInputElement).files?.[0];

        if (!descripcionResolucion || descripcionResolucion.trim() === '') {
          Swal.showValidationMessage('La descripción de la solución es obligatoria');
          return false;
        }
        
        return { resolucion: descripcionResolucion, archivo: archivoEvidencia };
      }
    }).then((resultadoModal) => {
      if (resultadoModal.isConfirmed) {
        this.procesarCierreDeTicket(
            ticketSeleccionado.id, 
            resultadoModal.value.resolucion, 
            resultadoModal.value.archivo
        );
      }
    });
  }

  procesarCierreDeTicket(idTicket: number, resolucionTexto: string, archivoAdjunto?: File) {
    const formularioDatos = new FormData();
    formularioDatos.append('id', idTicket.toString());
    formularioDatos.append('estado', 'Completo');
    formularioDatos.append('descripcion_resolucion', resolucionTexto);
    
    if (archivoAdjunto) {
      formularioDatos.append('evidencia', archivoAdjunto);
    }

    this.apiService.actualizarEstadoTicketConEvidencia(formularioDatos).subscribe({
      next: (respuestaServidor: any) => {
        if (respuestaServidor.status === true) {
          Swal.fire({ 
              icon: 'success', 
              title: 'Ticket cerrado correctamente', 
              timer: 2000, 
              showConfirmButton: false 
          });
          this.obtenerTicketsPendientes(); 
        } else {
          Swal.fire('Error', respuestaServidor.message || 'No se pudo actualizar el estado del ticket', 'error');
        }
      },
      error: (err) => {
        console.error("Error en la petición de cierre", err);
        Swal.fire('Error de conexión', 'No se pudo conectar con el servidor', 'error');
      }
    });
  }
}