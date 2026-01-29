import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api'; 
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-personal-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-profile.html',
  styleUrls: ['./personal-profile.css']
})
export class PersonalProfileComponent implements OnInit {

  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/update_profile.php'; 

  user: any = { nombre: '', email: '' }; 
  newPassword = '';
  confirmPassword = ''; 
  
  // Variables para la gráfica y el título
  tituloMesActual = ''; // <--- NUEVA VARIABLE PARA EL TÍTULO
  totalTickets = 0;
  completados = 0;
  incompletos = 0;
  eficiencia = 0;

  ngOnInit() {
    this.generarTituloMes(); // <--- Generamos el título al iniciar
    const stored = localStorage.getItem('usuario_actual');
    if (stored) {
      this.user = JSON.parse(stored);
      this.cargarEstadisticas();
    }
  }

  
  generarTituloMes() {
    const fecha = new Date();
    const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fecha);
    const anio = fecha.getFullYear();
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
    
    this.tituloMesActual = `${mesCapitalizado}/${anio}`;
  }

  cargarEstadisticas() {
    const cacheBuster = new Date().getTime();
    this.apiService.getMisTickets(this.user.id).subscribe({
      next: (data: any[]) => {
        const todos = data || [];
        
        const fechaHoy = new Date();
        const prefijoMes = `${fechaHoy.getFullYear()}-${String(fechaHoy.getMonth() + 1).padStart(2, '0')}`;

        const ticketsMesActual = todos.filter(t => t.fecha && t.fecha.startsWith(prefijoMes));

        this.totalTickets = ticketsMesActual.length;
        this.completados = ticketsMesActual.filter(t => t.estado === 'Completo').length;
        this.incompletos = this.totalTickets - this.completados;

        this.eficiencia = 0;
        if (this.totalTickets > 0) {
            this.eficiencia = Math.round((this.completados / this.totalTickets) * 100);
        }

        this.renderChart(); 
        this.procesarDatosMensuales(todos); 
      },
      error: () => console.error('Error al cargar estadísticas')
    });
  }

  procesarDatosMensuales(tickets: any[]) {
      const grupos: { [key: string]: { total: number, completados: number } } = {};

      tickets.forEach(t => {
          if (!t.fecha) return;
          const mes = t.fecha.substring(0, 7); 
          if (!grupos[mes]) grupos[mes] = { total: 0, completados: 0 };
          
          grupos[mes].total++;
          if (t.estado === 'Completo') grupos[mes].completados++;
      });

      const etiquetas: string[] = [];
      const datosEficiencia: number[] = [];

      Object.keys(grupos).sort().forEach(mesKey => {
          const fechaObj = new Date(mesKey + '-02'); 
          const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(fechaObj);
          
          etiquetas.push(nombreMes); 
          const total = grupos[mesKey].total;
          const comp = grupos[mesKey].completados;
          const porcentaje = total > 0 ? Math.round((comp / total) * 100) : 0;
          datosEficiencia.push(porcentaje); 
      });

      this.renderMonthlyChart(etiquetas, datosEficiencia);
  }

  renderChart() {
    const ctx = document.getElementById('profileChart') as HTMLCanvasElement;
    if (ctx) {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) existingChart.destroy();

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completados', 'Pendientes'],
                datasets: [{
                    data: [this.completados, this.incompletos],
                    backgroundColor: ['#22c55e', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                cutout: '75%',
                plugins: { legend: { display: false } }
            }
        });
    }
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
                      y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { callback: (val) => val + '%' } },
                      x: { grid: { display: false } }
                  },
                  plugins: { legend: { display: false } }
              }
          });
      }
  }

  actualizarPerfil() { 
    if (!this.user.nombre || !this.user.email) {
        Swal.fire('Atención', 'Datos incompletos', 'warning'); 
        return;
    }

    const payload = { 
        id: this.user.id, 
        nombre: this.user.nombre, 
        email: this.user.email, 
        password: this.newPassword 
    };

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
              

                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!', 
                    text: 'Perfil actualizado correctamente',
                    confirmButtonColor: '#56212f'
                }).then(() => {
                    window.location.reload(); 
                });

            } else { 
                Swal.fire('Error', res.message, 'error'); 
            }
        },
        error: () => Swal.fire('Error', 'Fallo de conexión', 'error')
    });
}
}