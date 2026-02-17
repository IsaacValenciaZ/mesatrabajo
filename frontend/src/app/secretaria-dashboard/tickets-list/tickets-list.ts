import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { ApiService } from '../../services/api';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets-list.html',
  styleUrl: './tickets-list.css'
})
export class TicketsListComponent implements OnInit {
  private apiService = inject(ApiService);
  private cd = inject(ChangeDetectorRef); 

  ticketsTodos: any[] = [];
  ticketsFiltrados: any[] = [];
  gruposPorDia: { fecha: string, tickets: any[] }[] = [];

  mesesDisponibles: string[] = [];
  mesSeleccionado: string = '';
  mostrarCalendario: boolean = false;
  diasCalendario: any[] = [];
  diaSeleccionado: number | null = null;
  cargando: boolean = false;
  
  secretariaId: number = 0;

  ngOnInit() {
    const userStored = localStorage.getItem('usuario_actual');
    if (userStored) {
        const user = JSON.parse(userStored);
        this.secretariaId = user.id; 
        this.cargarHistorial();
    } else {
        console.error("Error: No hay sesión iniciada.");
        this.cargando = false;
    }
  }

  cargarHistorial() {
    this.cargando = true;
    
    this.apiService.getTicketsCreadosPorSecretaria(this.secretariaId).subscribe({
      next: (data) => {
        this.ticketsTodos = data || [];
        
        this.generarOpcionesMeses();

        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const mesActualStr = `${anio}-${mes}`; 
        
        if (this.mesesDisponibles.includes(mesActualStr)) {
            this.mesSeleccionado = mesActualStr;
        } else if (this.mesesDisponibles.length > 0) {
            this.mesSeleccionado = this.mesesDisponibles[0];
        }

        this.aplicarFiltroMes(true);
        
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => { 
          console.error("Error cargando historial:", err);
          this.cargando = false; 
      }
    });
  }

  generarOpcionesMeses() {
    const mesesSet = new Set<string>();
    this.ticketsTodos.forEach(t => {
      if(t.fecha) {
         const mesAnio = t.fecha.substring(0, 7); 
         mesesSet.add(mesAnio);
      }
    });
    this.mesesDisponibles = Array.from(mesesSet).sort().reverse();
  }

  aplicarFiltroMes(limpiarDia: boolean = true) {
    if (limpiarDia) {
        this.diaSeleccionado = null; 
    }
    
    if (!this.mesSeleccionado) {
        this.ticketsFiltrados = this.ticketsTodos;
    } else {
        this.ticketsFiltrados = this.ticketsTodos.filter(t => 
            t.fecha && t.fecha.startsWith(this.mesSeleccionado)
        );
    }

    this.generarDiasCalendario(this.ticketsFiltrados); 
    
    if (this.diaSeleccionado === null) {
        this.organizarPorFecha(this.ticketsFiltrados);
    }
    this.cd.detectChanges();
  }

  organizarPorFecha(lista: any[]) {
    if (!lista || lista.length === 0) {
        this.gruposPorDia = [];
        return;
    }
    const grupos: { [key: string]: any[] } = {};
    lista.forEach(ticket => {
        const fechaSola = ticket.fecha.split(' ')[0];
        if (!grupos[fechaSola]) grupos[fechaSola] = [];
        grupos[fechaSola].push(ticket);
    });
    this.gruposPorDia = Object.keys(grupos)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(fecha => ({ fecha: fecha, tickets: grupos[fecha] }));
  }

  toggleCalendario() { this.mostrarCalendario = !this.mostrarCalendario; }

  generarDiasCalendario(ticketsDelMes: any[]) {
    if (!this.mesSeleccionado) return;
    const [anio, mes] = this.mesSeleccionado.split('-').map(Number);
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const primerDiaSemana = new Date(anio, mes - 1, 1).getDay(); 

    this.diasCalendario = [];
    for (let i = 0; i < primerDiaSemana; i++) {
      this.diasCalendario.push({ dia: null, tieneTickets: false });
    }
    for (let i = 1; i <= diasEnMes; i++) {
      const diaStr = `${this.mesSeleccionado}-${i.toString().padStart(2, '0')}`;
      const tieneTickets = ticketsDelMes.some(t => t.fecha.startsWith(diaStr));
      this.diasCalendario.push({
        dia: i, fechaCompleta: diaStr, tieneTickets: tieneTickets,
        tickets: ticketsDelMes.filter(t => t.fecha.startsWith(diaStr))
      });
    }
  }

  seleccionarDia(diaObj: any) {
    if (!diaObj.dia) return; 
    
    if (this.diaSeleccionado === diaObj.dia) {
        this.diaSeleccionado = null;
        this.organizarPorFecha(this.ticketsFiltrados); 
    } else {
        this.diaSeleccionado = diaObj.dia;
        this.organizarPorFecha(diaObj.tickets); 
        this.mostrarCalendario = false; 
    }
  }

  obtenerNombreMes(mesStr: string): string {
    if (!mesStr) return '';
    const [anio, mes] = mesStr.split('-');
    const date = new Date(parseInt(anio), parseInt(mes) - 1, 1);
    const nombre = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  }

  verResumenMensual() {
    this.mostrarResumen(this.ticketsFiltrados, this.obtenerNombreMes(this.mesSeleccionado));
  }

  verEstadisticasDia(grupo: any) {
     this.mostrarResumen(grupo.tickets, `Reporte del Día: ${grupo.fecha}`);
  }

  mostrarResumen(listaTickets: any[], titulo: string) {
    if (listaTickets.length === 0) { Swal.fire('Sin datos', 'No hay historial.', 'info'); return; }
    
    const stats = this.calcularEstadisticas(listaTickets);
    
    const htmlContent = `
      <div style="padding: 10px;">
        <h3 style="color:#56212f; margin-top:0;">${titulo}</h3>
        <p style="color:#666; margin-bottom: 20px;">Total: <strong>${stats.total}</strong> reportes</p>
        
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px;">
            <div style="width: 220px;"> 
                <h5 style="margin-bottom: 10px; color:#56212f;">Por Prioridad</h5> 
                <canvas id="chartPrioridad" width="220" height="220"></canvas> 
            </div>
            <div style="width: 220px;"> 
                <h5 style="margin-bottom: 10px; color:#56212f;">Por Categoría</h5> 
                <canvas id="chartProblema" width="220" height="220"></canvas> 
            </div>
        </div>
      </div>`;
    
    Swal.fire({ html: htmlContent, width: '700px', showConfirmButton: false, showCloseButton: true, didOpen: () => { this.renderizarGraficas('chartPrioridad', 'chartProblema', stats); } });
  }

  calcularEstadisticas(listaTickets: any[]) {
      let total = listaTickets.length;
      let alta = 0, media = 0, baja = 0;
      const problemas: {[key: string]: number} = {};

      listaTickets.forEach(t => {
         if (t.prioridad === 'Alta') alta++;
         else if (t.prioridad === 'Media') media++;
         else if (t.prioridad === 'Baja') baja++;

         const desc = t.descripcion || 'Otro';
         problemas[desc] = (problemas[desc] || 0) + 1;
      });
      return { total, alta, media, baja, problemas };
  }

  renderizarGraficas(idPrioridad: string, idProblema: string, stats: any) {
      const ctx1 = document.getElementById(idPrioridad) as HTMLCanvasElement;
      if(ctx1) { 
          new Chart(ctx1, { 
              type: 'pie', 
              data: { 
                  labels: ['Alta', 'Media', 'Baja'], 
                  datasets: [{ data: [stats.alta, stats.media, stats.baja], backgroundColor: ['#28f328', '#f3f028', '#f32828'], hoverOffset: 4 }] 
              }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } 
          }); 
      }
      const ctx2 = document.getElementById(idProblema) as HTMLCanvasElement;
      if(ctx2) { 
          const labels = Object.keys(stats.problemas);
          const data = Object.values(stats.problemas);
          const backgroundColors = labels.map(() => '#56212f'); 
          new Chart(ctx2, { 
              type: 'bar', 
              data: { labels: labels, datasets: [{ label: 'Tickets', data: data, backgroundColor: backgroundColors, borderRadius: 5 }] }, 
              options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } 
          }); 
      }
  }

  verNotaCompleta(nota: string) {
    Swal.fire({
      title: 'Detalle de la Nota', text: nota, icon: 'info', confirmButtonText: 'Cerrar', confirmButtonColor: '#2c3e50'
    })
  }
}