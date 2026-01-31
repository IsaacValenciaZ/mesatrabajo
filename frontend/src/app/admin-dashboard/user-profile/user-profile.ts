import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api'; 
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfileComponent implements OnInit {

  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/update_profile.php'; 

  user: any = { nombre: '', email: '' }; 
  newPassword = '';
  confirmPassword = ''; 
  tituloMesActual = ''; 
  creadosMesActual = 0;
  ticketsCreadosData: any[] = [];

  ngOnInit() {
    this.generarTituloMes(); 
    const stored = localStorage.getItem('usuario_actual');
    if (stored) {
      this.user = JSON.parse(stored);
      
     if (this.user.nombre) {
          this.cargarEstadisticasAsignadas(this.user.nombre); 
      }

      if (this.user.id) {
          this.cargarEstadisticasCreadas(this.user.id);
      }
    }
  }

  generarTituloMes() {
    const fecha = new Date();
    const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fecha);
    const anio = fecha.getFullYear();
    this.tituloMesActual = `${mes.charAt(0).toUpperCase() + mes.slice(1)}/${anio}`;
  }

  // --- 1. ASIGNADOS (Recibe STRING) ---
  cargarEstadisticasAsignadas(nombre: string) {
    this.apiService.getMisTickets(nombre).subscribe({
      next: (data: any[]) => {
        const todos = data || [];
        this.procesarEficienciaMensual(todos);
      },
      error: (e) => console.error("Error asignados:", e)
    });
  }

  procesarEficienciaMensual(tickets: any[]) {
      const grupos: any = {};
      tickets.forEach(t => {
          if (!t.fecha) return;
          const mes = t.fecha.substring(0, 7);
          if (!grupos[mes]) grupos[mes] = { total: 0, completados: 0 };
          grupos[mes].total++;
          if (t.estado === 'Completo') grupos[mes].completados++;
      });

      const etiquetas: string[] = [];
      const datos: number[] = [];
      Object.keys(grupos).sort().forEach(mesKey => {
          const fechaObj = new Date(mesKey + '-02');
          const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(fechaObj);
          etiquetas.push(nombreMes);
          const total = grupos[mesKey].total;
          const comp = grupos[mesKey].completados;
          const ef = total > 0 ? Math.round((comp / total) * 100) : 0;
          datos.push(ef);
      });
      this.dibujarLineaEficiencia(etiquetas, datos);
  }

  dibujarLineaEficiencia(labels: string[], data: number[]) {
      const ctx = document.getElementById('monthlyChart') as HTMLCanvasElement;
      if (ctx) {
          const existingChart = Chart.getChart(ctx);
          if (existingChart) existingChart.destroy();
          new Chart(ctx, {
              type: 'line',
              data: {
                  labels: labels,
                  datasets: [{
                      label: 'Eficiencia (%)',
                      data: data,
                      borderColor: '#56212f', backgroundColor: 'rgba(86, 33, 47, 0.1)',
                      borderWidth: 3, pointBackgroundColor: '#fff', pointBorderColor: '#56212f', fill: true, tension: 0.4
                  }]
              },
              options: {
                  responsive: true, maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, max: 100 }, x: { grid: { display: false } } },
                  plugins: { legend: { display: false } }
              }
          });
      }
  }

  // --- 2. CREADOS (Recibe NUMBER) ---
  cargarEstadisticasCreadas(id: number) {
      this.apiService.getTicketsCreadosPorAdmin(id).subscribe({
          next: (data: any[]) => {
              this.ticketsCreadosData = data || [];
              
              // Mes Actual
              const fechaHoy = new Date();
              const mesStr = String(fechaHoy.getMonth() + 1).padStart(2, '0');
              const prefijoMes = `${fechaHoy.getFullYear()}-${mesStr}`;
              const ticketsEsteMes = this.ticketsCreadosData.filter(t => t.fecha && t.fecha.startsWith(prefijoMes));
              this.creadosMesActual = ticketsEsteMes.length;
              this.renderChartCreadosMes();

              // Anual
              this.procesarRitmoAnual();
          },
          error: (err) => console.error("Error creados:", err)
      });
  }

  renderChartCreadosMes() {
      const ctx = document.getElementById('createdTotalChart') as HTMLCanvasElement;
      if (ctx) {
          const existingChart = Chart.getChart(ctx);
          if (existingChart) existingChart.destroy();
          // Lógica visual: si es 0 ponemos gris, si hay datos azul
          const hayDatos = this.creadosMesActual > 0;
          new Chart(ctx, {
              type: 'doughnut',
              data: {
                  labels: ['Este Mes'],
                  datasets: [{
                      data: hayDatos ? [this.creadosMesActual] : [1],
                      backgroundColor: hayDatos ? ['#3b82f6'] : ['#e2e8f0'],
                      borderWidth: 0
                  }]
              },
              options: {
                  responsive: true, cutout: '75%',
                  plugins: { legend: { display: false }, tooltip: { enabled: hayDatos } }
              }
          });
      }
  }

  procesarRitmoAnual() {
      const anioActual = new Date().getFullYear();
      const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const datosPorMes = new Array(12).fill(0); 

      this.ticketsCreadosData.forEach(t => {
          if (!t.fecha) return;
          const fechaT = new Date(t.fecha);
          if (fechaT.getFullYear() === anioActual) {
              const mesIndex = fechaT.getMonth(); 
              datosPorMes[mesIndex]++;
          }
      });

      const ctx = document.getElementById('createdHistoryChart') as HTMLCanvasElement;
      if (ctx) {
          const existingChart = Chart.getChart(ctx);
          if (existingChart) existingChart.destroy();
          new Chart(ctx, {
              type: 'bar',
              data: {
                  labels: mesesLabels,
                  datasets: [{
                      label: 'Tickets Creados',
                      data: datosPorMes,
                      backgroundColor: '#3b82f6',
                      borderRadius: 4,
                      barPercentage: 0.6
                  }]
              },
              options: {
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
              }
          });
      }
  }

  actualizarPerfil() { 
     if (!this.user.nombre || !this.user.email) {
         Swal.fire('Atención', 'Datos incompletos', 'warning'); return;
     }
     const payload = { id: this.user.id, nombre: this.user.nombre, email: this.user.email, password: this.newPassword };
     this.http.post(this.apiUrl, payload).subscribe({
         next: (res: any) => {
             if(res.status) {
                 const stored = localStorage.getItem('usuario_actual');
                 if (stored) {
                     let usuarioGuardado = JSON.parse(stored);
                     usuarioGuardado.nombre = this.user.nombre;
                     usuarioGuardado.email = this.user.email;
                     localStorage.setItem('usuario_actual', JSON.stringify(usuarioGuardado));
                 }
                 Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Perfil actualizado', confirmButtonColor: '#56212f' })
                 .then(() => window.location.reload());
             } else { Swal.fire('Error', res.message, 'error'); }
         }
     });
  }
}