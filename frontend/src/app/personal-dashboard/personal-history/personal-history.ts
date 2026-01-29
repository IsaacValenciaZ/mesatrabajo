import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2'; 
import { Chart, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables); 

@Component({
  selector: 'app-personal-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-history.html',
  styleUrls: ['../personal-dashboard.css', './personal-history.css'] 
})
export class PersonalHistoryComponent implements OnInit {

  private apiService = inject(ApiService);
  private cd = inject(ChangeDetectorRef);

  user: any = {};
  ticketsTodos: any[] = []; 
  ticketsFiltrados: any[] = [];
  gruposPorDia: { fecha: string, tickets: any[] }[] = [];
  mesesDisponibles: string[] = [];
  mesSeleccionado: string = ''; 
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
        const rawData = data || [];
        this.ticketsTodos = rawData.filter((t: any) => 
            t.estado === 'Completo' || t.estado === 'Incompleto'
        );
        
        this.generarOpcionesMeses();

        if (this.mesesDisponibles.length > 0) {
            this.mesSeleccionado = this.mesesDisponibles[0];
            this.aplicarFiltroMes();
        } else {
            this.organizarPorFecha(this.ticketsTodos);
        }

        this.cargando = false;
        this.cd.detectChanges(); 
      },
      error: (err) => {
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }

  generarOpcionesMeses() {
      const setMeses = new Set<string>();
      this.ticketsTodos.forEach(t => {
          if(t.fecha) {
             const mesAnio = t.fecha.substring(0, 7);
             setMeses.add(mesAnio);
          }
      });
      this.mesesDisponibles = Array.from(setMeses).sort().reverse();
  }

  aplicarFiltroMes() {
      if (!this.mesSeleccionado) {
          this.ticketsFiltrados = this.ticketsTodos;
      } else {
          this.ticketsFiltrados = this.ticketsTodos.filter(t => 
              t.fecha.startsWith(this.mesSeleccionado)
          );
      }
      this.organizarPorFecha(this.ticketsFiltrados);
  }

  organizarPorFecha(lista: any[]) {
    const grupos: { [key: string]: any[] } = {};
    lista.forEach(ticket => {
      const fechaSolo = ticket.fecha.split(' ')[0]; 
      if (!grupos[fechaSolo]) grupos[fechaSolo] = [];
      grupos[fechaSolo].push(ticket);
    });
    this.gruposPorDia = Object.keys(grupos)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(fecha => ({ fecha: fecha, tickets: grupos[fecha] }));
  }

  obtenerNombreMes(mesAnio: string): string {
      const [anio, mes] = mesAnio.split('-');
      const fecha = new Date(parseInt(anio), parseInt(mes) - 1, 1);
      const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fecha);
      return `${nombreMes} ${anio}`.charAt(0).toUpperCase() + `${nombreMes} ${anio}`.slice(1);
  }

  cambiarEstado(ticket: any) {
    Swal.fire({
      title: '¿Corregir reporte?',
      text: `El reporte #${ticket.id} volverá a estar pendiente.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, corregir',
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

  verEstadisticasDia(grupo: any) {
    const stats = this.calcularEstadisticas(grupo.tickets);
    
    const htmlContent = `
      <div style="padding: 10px;">
        <h3 style="color:#56212f; margin-top:0;">Reporte del Día</h3>
        <p style="color:#666; margin-bottom: 20px;">
           Fecha: <strong>${grupo.fecha}</strong> | Total: <strong>${stats.total}</strong>
        </p>
        
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
            <div style="width: 160px;">
                <h6 style="margin-bottom: 5px; font-weight:700;">Estatus</h6>
                <canvas id="chartDiaEstatus" width="160" height="160"></canvas>
            </div>
            <div style="width: 160px;">
                <h6 style="margin-bottom: 5px; font-weight:700;">Puntualidad</h6>
                <canvas id="chartDiaPuntualidad" width="160" height="160"></canvas>
            </div>
             <div style="width: 160px;">
                <h6 style="margin-bottom: 5px; font-weight:700;">Tiempos</h6>
                <canvas id="chartDiaTiempos" width="160" height="160"></canvas>
            </div>
        </div>
        
        <div style="margin-top: 20px; background: #f8f9fa; padding: 10px; border-radius: 10px;">
            <h3 style="color: #56212f; margin: 0;">⏱️ ${stats.tiempoPromedio}</h3>
            <small style="color: #888;">Tiempo promedio de respuesta</small>
        </div>
      </div>
    `;

    Swal.fire({
      html: htmlContent,
      width: '750px', 
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        this.renderizarGraficas('chartDiaEstatus', 'chartDiaPuntualidad', 'chartDiaTiempos', stats);
      }
    });
  }

  verResumenMensual() {
    const datosAnalizar = this.ticketsFiltrados;
    if (datosAnalizar.length === 0) {
      Swal.fire('Sin datos', 'No hay historial en este mes.', 'info');
      return;
    }

    const stats = this.calcularEstadisticas(datosAnalizar);
    const nombreMes = this.obtenerNombreMes(this.mesSeleccionado);

    const htmlContent = `
      <div style="padding: 10px;">
        <h3 style="color:#56212f; margin-top:0;">${nombreMes}</h3>
        <p style="color:#666; margin-bottom: 20px;">Analizando <strong>${stats.total}</strong> reportes</p>
        
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px;">
            <div style="width: 200px;">
                <h5 style="margin-bottom: 10px;">Estatus</h5>
                <canvas id="chartMesEstatus" width="200" height="200"></canvas>
            </div>
            <div style="width: 200px;">
                <h5 style="margin-bottom: 10px;">Puntualidad</h5>
                <canvas id="chartMesPuntualidad" width="200" height="200"></canvas>
            </div>
             <div style="width: 200px;">
                <h5 style="margin-bottom: 10px;">Distribución Tiempos</h5>
                <canvas id="chartMesTiempos" width="200" height="200"></canvas>
            </div>
        </div>

        <div style="margin-top: 30px; background: #f8f9fa; padding: 15px; border-radius: 10px;">
            <h3 style="color: #56212f; margin: 0;">⏱️ ${stats.tiempoPromedio}</h3>
            <small style="color: #888;">Tiempo promedio de solución en ${nombreMes}</small>
        </div>
      </div>
    `;

    Swal.fire({
      html: htmlContent,
      width: '850px',
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        this.renderizarGraficas('chartMesEstatus', 'chartMesPuntualidad', 'chartMesTiempos', stats);
      }
    });
  }

  calcularEstadisticas(listaTickets: any[]) {
      let total = listaTickets.length;
      let completos = 0;
      let incompletos = 0;
      let aTiempo = 0;
      let tarde = 0;
      let sumaMinutos = 0;
      let conteoConTiempo = 0;

      let rapido = 0; 
      let normal = 0; 
      let lento = 0;  

      listaTickets.forEach(t => {
         if (t.estado === 'Completo') {
            completos++;
            if (t.fecha_fin && t.fecha_limite) {
               if (t.fecha_fin <= t.fecha_limite) aTiempo++;
               else tarde++;
            } else {
               tarde++; 
            }
            
            if (t.fecha && t.fecha_fin) {
               const inicio = new Date(t.fecha).getTime();
               const fin = new Date(t.fecha_fin).getTime();
               const diff = fin - inicio; 
               
               if (diff > 0) {
                  const minutos = diff / (1000 * 60);
                  const horas = minutos / 60;

                  sumaMinutos += minutos;
                  conteoConTiempo++;

                  if (horas < 1) rapido++;
                  else if (horas <= 24) normal++;
                  else lento++;
               }
            }
         } else if (t.estado === 'Incompleto') {
            incompletos++;
         }
      });

      let tiempoPromedio = "N/A";
      if (conteoConTiempo > 0) {
         const avgMins = Math.round(sumaMinutos / conteoConTiempo);
         const hrs = Math.floor(avgMins / 60);
         const mins = avgMins % 60;
         tiempoPromedio = `${hrs}h ${mins}m`;
      }

      return { total, completos, incompletos, aTiempo, tarde, tiempoPromedio, rapido, normal, lento };
  }

  renderizarGraficas(idEstatus: string, idPuntualidad: string, idTiempos: string, stats: any) {
      const ctx1 = document.getElementById(idEstatus) as HTMLCanvasElement;
      if(ctx1) {
          new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Completos', 'Incompletos'],
                datasets: [{
                    data: [stats.completos, stats.incompletos],
                    backgroundColor: ['#22c55e', '#ef4444'],
                    hoverOffset: 4
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
          });
      }

      const ctx2 = document.getElementById(idPuntualidad) as HTMLCanvasElement;
      if(ctx2) {
          new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: ['A tiempo', 'Tarde'],
                datasets: [{
                    data: [stats.aTiempo, stats.tarde],
                    backgroundColor: ['#166534', '#ef4444'],
                    hoverOffset: 4
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
          });
      }

      const ctx3 = document.getElementById(idTiempos) as HTMLCanvasElement;
      if(ctx3) {
          new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: ['<1h', '1-24h', '>24h'],
                datasets: [{
                    label: 'Reportes',
                    data: [stats.rapido, stats.normal, stats.lento],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'], 
                    borderRadius: 5
                }]
            },
            options: { 
                responsive: true, 
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
          });
      }
  }
}