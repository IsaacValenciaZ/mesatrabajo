import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-personal-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-history.html',
  styleUrls: ['./personal-history.css'] 
})
export class PersonalHistoryComponent implements OnInit {

  private apiService = inject(ApiService);
  private cd = inject(ChangeDetectorRef);

  user: any = {};
  cargando = true;
  
  gruposPorDia: { fecha: string, tickets: any[] }[] = [];

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
        const historial = todos.filter((t: any) => t.estado === 'Completo');
        
        this.organizarPorFecha(historial);
        
        this.cargando = false;
        this.cd.detectChanges(); 
      },
      error: (err) => {
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }

  organizarPorFecha(lista: any[]) {
    const grupos: { [key: string]: any[] } = {};

    lista.forEach(ticket => {
    
      const fechaSolo = ticket.fecha.split(' ')[0]; 
      
      if (!grupos[fechaSolo]) {
        grupos[fechaSolo] = [];
      }
      grupos[fechaSolo].push(ticket);
    });

    this.gruposPorDia = Object.keys(grupos)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(fecha => ({
        fecha: fecha,
        tickets: grupos[fecha]
      }));
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


  verEstadisticasDia(grupo: any) {
    const total = grupo.tickets.length;
    
    // Calculamos métricas
    let aTiempo = 0;
    let tarde = 0;
    let sinDatos = 0;

    grupo.tickets.forEach((t: any) => {
      if (t.fecha_fin && t.fecha_limite) {
        if (t.fecha_fin <= t.fecha_limite) {
          aTiempo++;
        } else {
          tarde++;
        }
      } else {
        sinDatos++;
      }
    });

    const pctTiempo = Math.round((aTiempo / total) * 100);
    const pctTarde = Math.round((tarde / total) * 100);

    const htmlContent = `
      <div style="text-align: left; margin-top: 20px;">
        
        <div style="margin-bottom: 15px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span style="font-weight:bold; color:#166534">A Tiempo</span>
            <span>${aTiempo} (${pctTiempo}%)</span>
          </div>
          <div style="background:#e2e8f0; border-radius:10px; height:10px; width:100%; overflow:hidden;">
            <div style="background:#22c55e; height:100%; width:${pctTiempo}%"></div>
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span style="font-weight:bold; color:#991b1b">Tarde</span>
            <span>${tarde} (${pctTarde}%)</span>
          </div>
          <div style="background:#e2e8f0; border-radius:10px; height:10px; width:100%; overflow:hidden;">
            <div style="background:#ef4444; height:100%; width:${pctTarde}%"></div>
          </div>
        </div>

        <p style="font-size:0.9rem; color:#64748b; margin-top:20px; text-align:center;">
          Total de reportes del día: <strong>${total}</strong>
        </p>
      </div>
    `;

    Swal.fire({
      title: `Rendimiento del ${grupo.fecha}`,
      html: htmlContent,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#56212f'
    });
  }
}