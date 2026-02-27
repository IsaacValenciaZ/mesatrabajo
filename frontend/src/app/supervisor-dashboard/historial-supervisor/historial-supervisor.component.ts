import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-historial-supervisor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-supervisor.component.html',
  styleUrl: './historial-supervisor.component.css'
})
export class HistorialSupervisorComponent implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef); 

  listaHistorialCompleto: any[] = [];
  listaTicketsFiltrados: any[] = [];
  reportesAgrupadosPorDia: { fecha: string, tickets: any[] }[] = [];
  opcionesMesesDisponibles: string[] = [];
  mesFiltroSeleccionado: string = '';
  calendarioVisible: boolean = false;
  diasDelCalendario: any[] = [];
  diaFiltroSeleccionado: number | null = null;
  estadoCargaActivo: boolean = false;

  ngOnInit() {
    this.solicitarDatosHistorial();
  }

    solicitarDatosHistorial() {
    this.estadoCargaActivo = true;

    this.apiService.getTicketsHoy().subscribe({ 
      next: (respuestaApi: any[]) => {
        this.listaHistorialCompleto = respuestaApi || [];
        this.construirListaDeMesesDisponibles();
        
        const fechaActual = new Date();
        const cadenaMesActual = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
        
        if (this.opcionesMesesDisponibles.includes(cadenaMesActual)) {
            this.mesFiltroSeleccionado = cadenaMesActual;
        } else if (this.opcionesMesesDisponibles.length > 0) {
            this.mesFiltroSeleccionado = this.opcionesMesesDisponibles[0];
        }

        this.aplicarFiltroMensual(true);
        this.estadoCargaActivo = false;
        this.cdr.detectChanges();
      },
      error: (error) => { 
        this.estadoCargaActivo = false;
        console.error("Error al obtener tickets:", error);
      }
    });
  }
  
 

  construirListaDeMesesDisponibles() {
    const mesesUnicosSet = new Set<string>();
    this.listaHistorialCompleto.forEach(ticket => {
      if(ticket.fecha) mesesUnicosSet.add(ticket.fecha.substring(0, 7));
    });
    this.opcionesMesesDisponibles = Array.from(mesesUnicosSet).sort().reverse();
  }

  aplicarFiltroMensual(reiniciarFiltroDia: boolean = true) {
    if (reiniciarFiltroDia) this.diaFiltroSeleccionado = null;
    this.listaTicketsFiltrados = !this.mesFiltroSeleccionado 
      ? this.listaHistorialCompleto 
      : this.listaHistorialCompleto.filter(t => t.fecha?.startsWith(this.mesFiltroSeleccionado));

    this.construirEstructuraCalendario(this.listaTicketsFiltrados);
    if (this.diaFiltroSeleccionado === null) this.agruparTicketsPorDia(this.listaTicketsFiltrados);
    this.cdr.detectChanges();
  }

  agruparTicketsPorDia(lista: any[]) {
    if (!lista || lista.length === 0) { this.reportesAgrupadosPorDia = []; return; }
    const objetoAgrupador: { [key: string]: any[] } = {};
    lista.forEach(reg => {
      const fecha = reg.fecha.split(' ')[0];
      if (!objetoAgrupador[fecha]) objetoAgrupador[fecha] = [];
      objetoAgrupador[fecha].push(reg);
    });
    this.reportesAgrupadosPorDia = Object.keys(objetoAgrupador)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(fecha => ({ fecha, tickets: objetoAgrupador[fecha] }));
  }

  alternarVistaCalendario() { this.calendarioVisible = !this.calendarioVisible; }

  construirEstructuraCalendario(tickets: any[]) {
    if (!this.mesFiltroSeleccionado) return;
    const [año, mes] = this.mesFiltroSeleccionado.split('-').map(Number);
    const diasEnMes = new Date(año, mes, 0).getDate();
    const inicioSig = new Date(año, mes - 1, 1).getDay();
    this.diasDelCalendario = [];
    for (let i = 0; i < inicioSig; i++) this.diasDelCalendario.push({ dia: null });
    for (let d = 1; d <= diasEnMes; d++) {
      const fechaC = `${this.mesFiltroSeleccionado}-${d.toString().padStart(2, '0')}`;
      this.diasDelCalendario.push({
        dia: d, tieneTickets: tickets.some(t => t.fecha.startsWith(fechaC)),
        tickets: tickets.filter(t => t.fecha.startsWith(fechaC))
      });
    }
  }

  filtrarPorDiaSeleccionado(objDia: any) {
    if (!objDia.dia) return;
    this.diaFiltroSeleccionado = (this.diaFiltroSeleccionado === objDia.dia) ? null : objDia.dia;
    this.agruparTicketsPorDia(this.diaFiltroSeleccionado ? objDia.tickets : this.listaTicketsFiltrados);
    if (this.diaFiltroSeleccionado) this.calendarioVisible = false;
  }

  obtenerNombreMesFormateado(cadena: string): string {
    if (!cadena) return '';
    const fecha = new Date(parseInt(cadena.split('-')[0]), parseInt(cadena.split('-')[1]) - 1, 1);
    const res = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return res.charAt(0).toUpperCase() + res.slice(1);
  }

  mostrarGraficasMensuales() { this.lanzarModalGraficas(this.listaTicketsFiltrados, this.obtenerNombreMesFormateado(this.mesFiltroSeleccionado)); }

  mostrarGraficasDiarias(grupo: any) { this.lanzarModalGraficas(grupo.tickets, `Reporte del Día: ${grupo.fecha}`); }

  lanzarModalGraficas(tickets: any[], titulo: string) {
    if (tickets.length === 0) { Swal.fire('Sin datos', 'No hay historial.', 'info'); return; }
    const m = this.generarAnalisis(tickets);
    Swal.fire({
      html: `<h3 style="color:#56212f">${titulo}</h3><p>Total: ${m.total}</p>
             <div style="display:flex; justify-content:center; gap:20px; flex-wrap:wrap">
               <canvas id="chartPrio" width="200" height="200"></canvas>
               <canvas id="chartCat" width="200" height="200"></canvas>
             </div>`,
      width: '700px', showCloseButton: true, showConfirmButton: false,
      didOpen: () => { this.crearCharts('chartPrio', 'chartCat', m); }
    });
  }

  generarAnalisis(tickets: any[]) {
    const res = { total: tickets.length, alta: 0, media: 0, baja: 0, problemas: {} as any };
    tickets.forEach(t => {
      if (t.prioridad === 'Alta') res.alta++;
      else if (t.prioridad === 'Media') res.media++;
      else if (t.prioridad === 'Baja') res.baja++;
      res.problemas[t.descripcion] = (res.problemas[t.descripcion] || 0) + 1;
    });
    return res;
  }

  crearCharts(id1: string, id2: string, m: any) {
    new Chart(document.getElementById(id1) as HTMLCanvasElement, {
      type: 'pie', data: { labels: ['Alta', 'Media', 'Baja'], datasets: [{ data: [m.alta, m.media, m.baja], backgroundColor: ['#f32828', '#f3f028', '#28f328'] }] }
    });
    new Chart(document.getElementById(id2) as HTMLCanvasElement, {
      type: 'bar', data: { labels: Object.keys(m.problemas), datasets: [{ label: 'Tickets', data: Object.values(m.problemas), backgroundColor: '#56212f' }] }
    });
  }

  abrirDetalleNotaCompleta(nota: string) { Swal.fire({ title: 'Nota', text: nota, icon: 'info', confirmButtonColor: '#2c3e50' }); }
}