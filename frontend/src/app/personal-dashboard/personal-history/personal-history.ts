import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2'; 
import { Chart, registerables } from 'chart.js';

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
  private cdr = inject(ChangeDetectorRef);

  user: any = {};
  cargando = true;
  ticketsTodos: any[] = []; 
  ticketsFiltrados: any[] = []; 
  
  diasCalendario: any[] = [];
  diaSeleccionado: number | null = null;
  mostrarCalendario: boolean = false;
  mesesDisponibles: string[] = [];
  mesSeleccionado: string = ''; 
  gruposPorDia: { fecha: string, tickets: any[] }[] = [];

  ngOnInit() {
    const userStored = localStorage.getItem('usuario_actual');
    if (userStored) {
      this.user = JSON.parse(userStored);
      this.cargarHistorialTickets();
    }
  }

  toggleCalendario() {
    this.mostrarCalendario = !this.mostrarCalendario;
  }

  cargarHistorialTickets() {
    this.cargando = true;
    
    this.apiService.getMisTickets(this.user.nombre).subscribe({
      next: (datosServidor) => {
        const registros = datosServidor || [];
        
        this.ticketsTodos = registros.filter((ticket: any) => 
            ticket.estado === 'Completo' || 
            ticket.estado === 'Incompleto' || 
            ticket.estado === 'Completado'
        );
        
        this.generarOpcionesMeses();

        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        
        const mesActual = `${anio}-${mes}`; 
        const fechaHoy = `${anio}-${mes}-${dia}`; 

        if (this.mesesDisponibles.includes(mesActual)) {
            this.mesSeleccionado = mesActual;
        } else if (this.mesesDisponibles.length > 0) {
            this.mesSeleccionado = this.mesesDisponibles[0];
        } else {
            this.mesSeleccionado = '';
        }

        this.aplicarFiltroMes(false); 

        const ticketsDeHoy = this.ticketsFiltrados.filter(ticket => 
            ticket.fecha && ticket.fecha.startsWith(fechaHoy)
        );

        if (ticketsDeHoy.length > 0) {
            this.diaSeleccionado = parseInt(dia);
            this.organizarTicketsPorFecha(ticketsDeHoy);
        } else {
            this.diaSeleccionado = null;
            this.organizarTicketsPorFecha(this.ticketsFiltrados);
        }

        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Error al cargar el historial:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarOpcionesMeses() {
      const mesesUnicos = new Set<string>();
      
      this.ticketsTodos.forEach(ticket => {
          if (ticket.fecha) {
             const mesAnio = ticket.fecha.substring(0, 7);
             mesesUnicos.add(mesAnio);
          }
      });
      
      this.mesesDisponibles = Array.from(mesesUnicos).sort().reverse();
  }

  aplicarFiltroMes(limpiarSeleccion: boolean = true) {
      if (limpiarSeleccion) {
          this.diaSeleccionado = null; 
      }
      
      if (!this.mesSeleccionado) {
          this.ticketsFiltrados = this.ticketsTodos;
      } else {
          this.ticketsFiltrados = this.ticketsTodos.filter(ticket => 
              ticket.fecha && ticket.fecha.startsWith(this.mesSeleccionado)
          );
      }
      
      this.construirMatrizCalendario(); 
      
      if (limpiarSeleccion) {
          this.organizarTicketsPorFecha(this.ticketsFiltrados);
      }
  }

  construirMatrizCalendario() {
    if (!this.mesSeleccionado) return;

    const [anioStr, mesStr] = this.mesSeleccionado.split('-');
    const anio = parseInt(anioStr);
    const mes = parseInt(mesStr);

    const primerDiaSemana = new Date(anio, mes - 1, 1).getDay(); 
    const totalDiasMes = new Date(anio, mes, 0).getDate(); 

    this.diasCalendario = [];

    for (let i = 0; i < primerDiaSemana; i++) {
        this.diasCalendario.push({ dia: null, tickets: [] });
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const fechaFormateada = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const ticketsDelDia = this.ticketsFiltrados.filter(ticket => 
            ticket.fecha && ticket.fecha.startsWith(fechaFormateada)
        );

        this.diasCalendario.push({
            dia: dia,
            fechaCompleta: fechaFormateada,
            tickets: ticketsDelDia,
            tieneTickets: ticketsDelDia.length > 0
        });
    }
  }

  seleccionarDia(diaCalendario: any) {
    if (!diaCalendario.dia) return; 
    
    if (this.diaSeleccionado === diaCalendario.dia) {
        this.diaSeleccionado = null;
        this.organizarTicketsPorFecha(this.ticketsFiltrados); 
    } else {
        this.diaSeleccionado = diaCalendario.dia;
        this.organizarTicketsPorFecha(diaCalendario.tickets); 
        this.mostrarCalendario = false; 
    }
  }

  organizarTicketsPorFecha(listaTickets: any[]) {
    if (!listaTickets || listaTickets.length === 0) {
        this.gruposPorDia = [];
        return;
    }

    const ticketsAgrupados: { [key: string]: any[] } = {};
    
    listaTickets.forEach(ticket => {
      if (ticket.fecha) { 
          const fechaSinHora = ticket.fecha.split(' ')[0]; 
          if (!ticketsAgrupados[fechaSinHora]) {
              ticketsAgrupados[fechaSinHora] = [];
          }
          ticketsAgrupados[fechaSinHora].push(ticket);
      }
    });

    this.gruposPorDia = Object.keys(ticketsAgrupados)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(fecha => ({ fecha: fecha, tickets: ticketsAgrupados[fecha] }));
  }

  obtenerNombreMes(formatoMesAnio: string): string {
      if (!formatoMesAnio) return '';
      const [anio, mes] = formatoMesAnio.split('-');
      const fechaReferencia = new Date(parseInt(anio), parseInt(mes) - 1, 1);
      const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fechaReferencia);
      
      return `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${anio}`;
  }

  verNotaCompleta(nota: string) {
      Swal.fire({
        title: 'Detalle de la Nota',
        text: nota || 'Sin información adicional.',
        icon: 'info',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#56212f',
        background: '#fff',
        iconColor: '#977e5b'
      });
  }

  verEvidenciaFinal(ticket: any) {
      const imagenData = ticket.evidencia_archivo; 

      Swal.fire({
        title: `Resolución del Ticket #${ticket.id}`,
        html: `
          <div style="text-align: left; padding: 5px;">
            <p style="font-weight: bold; color: #56212f; margin-bottom: 5px;">Descripción de la solución:</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 5px solid #27ae60; margin-bottom: 15px; max-height: 150px; overflow-y: auto;">
              ${ticket.descripcion_resolucion || 'El técnico no proporcionó una descripción de las tareas realizadas.'}
            </div>
            
            ${imagenData ? `
              <p style="font-weight: bold; color: #56212f; margin-bottom: 5px;">Evidencia fotográfica:</p>
              <div style="text-align: center; border: 1px solid #ddd; padding: 5px; border-radius: 8px; background: #fff;">
                <img id="img-evidencia-${ticket.id}" src="${imagenData}" 
                     style="width: 100%; max-height: 250px; object-fit: contain; border-radius: 4px; cursor: zoom-in; transition: transform 0.2s;"
                     onmouseover="this.style.transform='scale(1.02)'"
                     onmouseout="this.style.transform='scale(1)'">
                <small style="display:block; color: #666; margin-top: 8px; font-weight: bold;">
                  <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">zoom_in</span> 
                  Haz clic en la imagen para ampliarla
                </small>
              </div>
            ` : '<p style="color: #999; font-style: italic; text-align: center;">Sin evidencia fotográfica adjunta.</p>'}
          </div>
        `,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#56212f',
        width: '600px',
        didOpen: () => {
          if (imagenData) {
            const visorImagen = document.getElementById(`img-evidencia-${ticket.id}`);
            if (visorImagen) {
                visorImagen.addEventListener('click', () => {
                this.abrirImagenCompleta(imagenData, ticket.id);
              });
            }
          }
        }
      });
  }

  abrirImagenCompleta(imagenBase64: string, idTicket: number) {
      Swal.fire({
        title: `Evidencia - Ticket #${idTicket}`,
        imageUrl: imagenBase64,
        imageAlt: 'Evidencia técnica adjunta',
        width: '90%',
        padding: '1em',
        color: '#fff',
        background: '#1a1a1a', 
        backdrop: `rgba(0,0,0,0.85)`,
        showConfirmButton: false,  
        showCloseButton: true, 
        customClass: {
          image: 'img-fluid',
          popup: 'swal-wide'
        }
      });
  }

  cambiarEstado(ticket: any) {
    Swal.fire({
      title: '¿Reabrir reporte?',
      text: `El ticket #${ticket.id} volverá a la lista de pendientes.`,
      icon: 'question', 
      showCancelButton: true, 
      confirmButtonText: 'Sí, corregir', 
      confirmButtonColor: '#56212f', 
      cancelButtonText: 'Cancelar'
    }).then((resultado) => {
      if (resultado.isConfirmed) {
          this.guardarNuevoEstado(ticket.id, 'En espera');
      }
    });
  }

  guardarNuevoEstado(idTicket: number, estadoActualizado: string) {
    this.apiService.actualizarEstadoTicket(idTicket, estadoActualizado).subscribe({
      next: (respuesta) => {
        if (respuesta.status === true) {
          const alertaNotificacion = Swal.mixin({ 
              toast: true, 
              position: 'top-end', 
              showConfirmButton: false, 
              timer: 3000, 
              timerProgressBar: true 
          });
          alertaNotificacion.fire({ icon: 'success', title: 'Estado actualizado correctamente' });
          this.cargarHistorialTickets(); 
        } else { 
            Swal.fire('Error', 'No se pudo actualizar el estado en el servidor.', 'error'); 
        }
      }
    });
  }

  calcularEstadisticas(listaTickets: any[]) {
      const estadisticas = {
          total: listaTickets.length,
          completos: 0,
          vencidos: 0,
          aTiempo: 0,
          tarde: 0,
          rapido: 0,
          normal: 0,
          lento: 0,
          tiempoPromedio: 'N/A'
      };

      let sumaMinutosTotales = 0; 
      let ticketsConTiempoValido = 0;
      
      listaTickets.forEach(ticket => {
         if (ticket.estado === 'Completo' || ticket.estado === 'Completado') {
            estadisticas.completos++;
            
            if (ticket.fecha_fin && ticket.fecha_limite) { 
                if (ticket.fecha_fin <= ticket.fecha_limite) {
                    estadisticas.aTiempo++; 
                } else {
                    estadisticas.tarde++; 
                }
            } else { 
                estadisticas.tarde++; 
            }
            
            if (ticket.fecha && ticket.fecha_fin) {
               const tiempoInicio = new Date(ticket.fecha).getTime(); 
               const tiempoFin = new Date(ticket.fecha_fin).getTime(); 
               const diferenciaMs = tiempoFin - tiempoInicio; 
               
               if (diferenciaMs > 0) {
                  const minutosTranscurridos = diferenciaMs / (1000 * 60); 
                  sumaMinutosTotales += minutosTranscurridos; 
                  ticketsConTiempoValido++;
                  
                  if (minutosTranscurridos < 60) estadisticas.rapido++; 
                  else if (minutosTranscurridos <= 1440) estadisticas.normal++; 
                  else estadisticas.lento++;
               }
            }
         } else if (ticket.estado === 'Incompleto') { 
             estadisticas.vencidos++; 
         }
      });
      
      if (ticketsConTiempoValido > 0) {
         const promedioMins = Math.round(sumaMinutosTotales / ticketsConTiempoValido); 
         const horas = Math.floor(promedioMins / 60); 
         const minutos = promedioMins % 60; 
         estadisticas.tiempoPromedio = `${horas}h ${minutos}m`;
      }

      return estadisticas;
  }

  verEstadisticasDia(grupo: any) {
      const resultados = this.calcularEstadisticas(grupo.tickets);
      const diseñoHtml = `
        <div style="padding: 10px;">
          <h3 style="color:#56212f; margin-top:0;">Resumen del Día</h3>
          <p style="color:#666; margin-bottom: 20px;">Fecha analizada: <strong>${grupo.fecha}</strong> | Total de reportes: <strong>${resultados.total}</strong></p>
          <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
              <div style="width: 160px;"> 
                  <h6 style="margin-bottom: 5px; font-weight:700;">Estatus</h6> 
                  <canvas id="graficaEstatusDia" width="160" height="160"></canvas> 
              </div>
              <div style="width: 160px;"> 
                  <h6 style="margin-bottom: 5px; font-weight:700;">Puntualidad</h6> 
                  <canvas id="graficaPuntualidadDia" width="160" height="160"></canvas> 
              </div>
               <div style="width: 160px;"> 
                   <h6 style="margin-bottom: 5px; font-weight:700;">Tiempos de Solución</h6> 
                   <canvas id="graficaTiemposDia" width="160" height="160"></canvas> 
               </div>
          </div>
          <div style="margin-top: 20px; background: #f8f9fa; padding: 10px; border-radius: 10px;">
              <h3 style="color: #56212f; margin: 0;">⏱️ ${resultados.tiempoPromedio}</h3> 
              <small style="color: #888;">Tiempo promedio de respuesta</small>
          </div>
        </div>`;
        
      Swal.fire({ 
          html: diseñoHtml, 
          width: '750px', 
          showConfirmButton: false, 
          showCloseButton: true, 
          didOpen: () => { 
              this.renderizarGraficasCJS('graficaEstatusDia', 'graficaPuntualidadDia', 'graficaTiemposDia', resultados); 
          } 
      });
  }

  verResumenMensual() {
    const listaAnalisis = this.ticketsFiltrados;
    
    if (listaAnalisis.length === 0) { 
        Swal.fire('Datos insuficientes', 'No hay historial registrado en este mes.', 'info'); 
        return; 
    }
    
    const resultados = this.calcularEstadisticas(listaAnalisis);
    const etiquetaMes = this.obtenerNombreMes(this.mesSeleccionado);
    
    const diseñoHtml = `
      <div style="padding: 10px;">
        <h3 style="color:#56212f; margin-top:0;">Estadísticas de ${etiquetaMes}</h3>
        <p style="color:#666; margin-bottom: 20px;">Analizando un volumen de <strong>${resultados.total}</strong> reportes</p>
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px;">
            <div style="width: 200px;"> 
                <h5 style="margin-bottom: 10px;">Estatus</h5> 
                <canvas id="graficaEstatusMes" width="200" height="200"></canvas> 
            </div>
            <div style="width: 200px;"> 
                <h5 style="margin-bottom: 10px;">Puntualidad</h5> 
                <canvas id="graficaPuntualidadMes" width="200" height="200"></canvas> 
            </div>
             <div style="width: 200px;"> 
                 <h5 style="margin-bottom: 10px;">Distribución de Tiempos</h5> 
                 <canvas id="graficaTiemposMes" width="200" height="200"></canvas> 
             </div>
        </div>
        <div style="margin-top: 30px; background: #f8f9fa; padding: 15px; border-radius: 10px;">
            <h3 style="color: #56212f; margin: 0;">⏱️ ${resultados.tiempoPromedio}</h3> 
            <small style="color: #888;">Tiempo promedio de solución en el periodo actual</small>
        </div>
      </div>`;
      
    Swal.fire({ 
        html: diseñoHtml, 
        width: '850px', 
        showConfirmButton: false, 
        showCloseButton: true, 
        didOpen: () => { 
            this.renderizarGraficasCJS('graficaEstatusMes', 'graficaPuntualidadMes', 'graficaTiemposMes', resultados); 
        } 
    });
  }

  renderizarGraficasCJS(idEstatus: string, idPuntualidad: string, idTiempos: string, metricas: any) {
      const contextoEstatus = document.getElementById(idEstatus) as HTMLCanvasElement;
      if (contextoEstatus) { 
          new Chart(contextoEstatus, { 
              type: 'doughnut', 
              data: { 
                  labels: ['Completados', 'Vencidos'], 
                  datasets: [{ 
                      data: [metricas.completos, metricas.vencidos], 
                      backgroundColor: ['#28f328', '#f32828'], 
                      hoverOffset: 4 
                  }] 
              }, 
              options: { responsive: true, plugins: { legend: { position: 'bottom' } } } 
          }); 
      }
      
      const contextoPuntualidad = document.getElementById(idPuntualidad) as HTMLCanvasElement;
      if (contextoPuntualidad) { 
          new Chart(contextoPuntualidad, { 
              type: 'pie', 
              data: { 
                  labels: ['A tiempo', 'Con retraso', 'Vencido'], 
                  datasets: [{ 
                      data: [metricas.aTiempo, metricas.tarde, metricas.vencidos], 
                      backgroundColor: ['#28f328', '#f3f028', '#f32828'], 
                      hoverOffset: 4 
                  }] 
              }, 
              options: { responsive: true, plugins: { legend: { position: 'bottom' } } } 
          }); 
      }
      
      const contextoTiempos = document.getElementById(idTiempos) as HTMLCanvasElement;
      if (contextoTiempos) { 
          new Chart(contextoTiempos, { 
              type: 'bar', 
              data: { 
                  labels: ['< 1h', '1h - 24h', '> 24h'], 
                  datasets: [{ 
                      label: 'Volumen de Reportes', 
                      data: [metricas.rapido, metricas.normal, metricas.lento], 
                      backgroundColor: ['#28f328', '#f3f028', '#f32828'], 
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