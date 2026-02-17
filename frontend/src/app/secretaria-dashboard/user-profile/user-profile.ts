import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  private cd = inject(ChangeDetectorRef);
  private apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/update_profile.php'; 

  user: any = { nombre: '', email: '' }; 
  newPassword = '';
  confirmPassword = ''; 
  tituloMesActual = ''; 
  
  creadosMesActual = 0;
  ticketsCreadosData: any[] = [];
  
  chartsReady = false; 

  datosAnualesLabels: string[] = [];
  datosAnualesValores: number[] = [];

  ngOnInit() {
    this.generarTituloMes(); 
    const stored = localStorage.getItem('usuario_actual');
    
    if (stored) {
      this.user = JSON.parse(stored);
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

  cargarEstadisticasCreadas(id: number) {
      this.apiService.getTicketsCreadosPorSecretaria(id).subscribe({
          next: (data: any[]) => {
              this.ticketsCreadosData = data || [];
              
              if(this.ticketsCreadosData.length > 0) {
                  console.log("EJEMPLO DE TICKET:", this.ticketsCreadosData[0]);
              }

              const hoy = new Date();
              const mesActual = hoy.getMonth(); 
              const anioActual = hoy.getFullYear();
              
              const ticketsEsteMes = this.ticketsCreadosData.filter(t => {
                  if (!t.fecha) return false;
                  const fechaTicket = new Date(t.fecha.replace(' ', 'T'));
                  return fechaTicket.getMonth() === mesActual && 
                         fechaTicket.getFullYear() === anioActual;
              });

              this.creadosMesActual = ticketsEsteMes.length;
              this.procesarRitmoAnual();
              this.chartsReady = true; 
              this.cd.detectChanges(); 

              setTimeout(() => {
                  this.renderChartCreadosMes(); 
                  this.renderMonthlyChart(this.datosAnualesLabels, this.datosAnualesValores);
                  this.renderAssignmentsChart();
              }, 100);
          },
          error: (err) => console.error("Error cargando stats:", err)
      });
  }

  renderMonthlyChart(labels: string[], data: number[]) {
      const ctx = document.getElementById('monthlyChart') as HTMLCanvasElement;
      if (ctx) {
          const existingChart = Chart.getChart(ctx);
          if (existingChart) existingChart.destroy();

          new Chart(ctx, {
              type: 'line', 
              data: {
                  labels: labels,
                  datasets: [{
                      label: 'Efectividad (%)',
                      data: data,
                      borderColor: '#56212f', 
                      backgroundColor: 'rgba(86, 33, 47, 0.1)', 
                      borderWidth: 3,
                      pointBackgroundColor: '#fff',
                      pointBorderColor: '#56212f',
                      fill: true, 
                      tension: 0.4 
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                      x: { grid: { display: false } }
                  },
                  plugins: { legend: { display: false } }
              }
          });
      }
  }

  renderChartCreadosMes() {
      const ctx = document.getElementById('createdTotalChart') as HTMLCanvasElement;
      if (!ctx) return;
      const existingChart = Chart.getChart(ctx);
      if (existingChart) existingChart.destroy();
      const hayDatos = this.creadosMesActual > 0;
      new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: ['Mis Tickets'],
              datasets: [{
                  data: hayDatos ? [this.creadosMesActual] : [1],
                  backgroundColor: hayDatos ? ['#3b82f6'] : ['#e2e8f0'],
                  borderWidth: 0
              }]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            cutout: '75%', 
            layout: {
                padding: 0 
            },
            plugins: { legend: { display: false }, tooltip: { enabled: hayDatos } } 
          }
      });
  }
renderAssignmentsChart() {
      const ctx = document.getElementById('createdHistoryChart') as HTMLCanvasElement;
      if (!ctx) return;

      const existingChart = Chart.getChart(ctx);
      if (existingChart) existingChart.destroy();

      const conteoPorPersona: { [key: string]: number } = {};
      const anioActual = new Date().getFullYear();

      if (this.ticketsCreadosData.length > 0) {
          console.log("Campos del ticket:", Object.keys(this.ticketsCreadosData[0]));
      }

      this.ticketsCreadosData.forEach(t => {
          if (!t.fecha) return;
          const fechaT = new Date(t.fecha.replace(' ', 'T'));
          
          if (!isNaN(fechaT.getTime()) && fechaT.getFullYear() === anioActual) {
              

              let nombrePersona = t.personal || 
                                  t.asignado_a || 
                                  t.nombre_asignado || 
                                  'Sin Asignar';

              if (!isNaN(Number(nombrePersona)) && nombrePersona !== 'Sin Asignar') {
                 nombrePersona = `Usuario ID: ${nombrePersona}`; 
              }

              conteoPorPersona[nombrePersona] = (conteoPorPersona[nombrePersona] || 0) + 1;
          }
      });

      let asignacionesOrdenadas = Object.entries(conteoPorPersona);
      asignacionesOrdenadas.sort((a, b) => b[1] - a[1]);

      const nombres = asignacionesOrdenadas.map(item => item[0]);
      const valores = asignacionesOrdenadas.map(item => item[1]);
      const colores = nombres.map((_, i) => this.obtenerColor(i));

      new Chart(ctx, {
          type: 'bar',
          data: {
              labels: nombres, 
              datasets: [{
                  label: 'Tickets',
                  data: valores,   
                  backgroundColor: colores,
                  borderColor: colores,
                  borderWidth: 1,
                  borderRadius: 4,
                  barPercentage: 0.6,
              }]
          },
          options: {
              indexAxis: 'y', 
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { display: false }, 
                  tooltip: {
                      callbacks: { label: (context) => `Tickets: ${context.raw}` }
                  }
              },
              scales: {
                  x: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 }, 
                      grid: { color: '#f1f5f9' }
                  },
                  y: {
                      grid: { display: false },
                      ticks: { 
                          font: { weight: 'bold' },
                          autoSkip: false
                      }
                  }
              }
          }
      });
  }

  procesarRitmoAnual() {
      const anioActual = new Date().getFullYear();
      this.datosAnualesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      this.datosAnualesValores = new Array(12).fill(0); 

      this.ticketsCreadosData.forEach(t => {
          if (!t.fecha) return;
          const fechaT = new Date(t.fecha.replace(' ', 'T'));
          if (!isNaN(fechaT.getTime()) && fechaT.getFullYear() === anioActual) {
              const mesIndex = fechaT.getMonth(); 
              this.datosAnualesValores[mesIndex]++;
          }
      });
  }

  obtenerColor(index: number): string {
      const colores = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
      return colores[index % colores.length];
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
                 Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Perfil actualizado', confirmButtonColor: '#56212f' }).then(() => window.location.reload());
             } else { Swal.fire('Error', res.message, 'error'); }
         }
     });
  }
}