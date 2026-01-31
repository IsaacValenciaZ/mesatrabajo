import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.html', 
  styleUrl: './tickets.css' 
})
export class TicketsComponent implements OnInit {
  private apiService = inject(ApiService);
  private cd = inject(ChangeDetectorRef);

  usersList: any[] = [];
  ticketsHoy: any[] = []; 
  fechaActual = new Date();

  mostrarListaDepartamentos = false;
  
  departamentosOriginales: string[] = [
    "Consejo Directivo", "Dirección General", "Órgano Interno de Control", 
    "Unidad de Modernización para la Calidad del Servicio", "Unidad de Asuntos Jurídicos e Igualdad de Género", 
    "Unidad de Comunicación Social", "Secretaría Técnica de la Junta de Gobierno",
    "Área de Auditoría", "Área de Quejas", "Área de Responsabilidades",
    "Depto. de Estudios y Proyectos para el Desarrollo Institucional", "Depto. de Sistemas Administrativos", 
    "Centro de Información y Documentación", "Depto. Jurídico Contencioso", "Depto. de Legislación y Consulta", 
    "Depto. de Asuntos Relacionados con los Derechos Humanos", "Depto. Jurídico Valle de México",
    "Subdirección de Educación Elemental", "Depto. de Planeación y Programación", "Depto. de Estadística", 
    "Depto. de Control Escolar", "Depto. de Evaluación Institucional", 
    "Depto. de Computación Electrónica en la Educación Elemental", "Depto. de Extensión y Vinculación Educativa",
    "Depto. de Educación Inicial", "Depto. de Educación Inicial No Escolarizada", "Depto. de Educación para Adultos",
    "Depto. de Educación Especial Valle de México", "Depto. de Educación Especial Valle de Toluca",
    "Depto. de Educación Preescolar del Valle de Toluca", "Depto. de Educación Preescolar del Valle de México",
    "Subdirección de Educación Primaria Región Toluca", "Subdirección de Educación Primaria Región Atlacomulco",
    "Subdirección de Educación Primaria Región Naucalpan", "Subdirección de Educación Primaria Región Ecatepec", 
    "Subdirección de Educación Primaria Región Nezahualcóyotl",
    "Subdirección de Educación Secundaria Valle de Toluca", "Depto. de Educación Secundaria General (Toluca)", 
    "Depto. de Educación Secundaria Técnica (Toluca)", "Depto. de Telesecundaria (Toluca)",
    "Subdirección de Educación Secundaria Valle de México", "Depto. de Educación Secundaria General (Valle Mex)", 
    "Depto. de Educación Secundaria Técnica (Valle Mex)", "Depto. de Telesecundaria (Valle Mex)",
    "Subdirección de Servicios Regionales Naucalpan", "Subdirección de Servicios Regionales Ecatepec", 
    "Subdirección de Servicios Regionales Nezahualcóyotl",
    "Depto. de Espacios Escolares", "Depto. de Equipamiento Escolar", "Depto. de Preservación de Instalaciones",
    "Subdirección de Desarrollo de Personal", "Subdirección de Administración de Personal", 
    "Depto. de Capacitación y Desarrollo", "Depto. de Prestaciones", "Depto. de Control y Calidad de Pago", 
    "Depto. de Registro y Archivo",
    "Subdirección de Recursos Materiales y Servicios", "Subdirección de Finanzas", 
    "Subdirección de Distribución de Cheques", "Depto. de Adquisiciones", "Depto. de Programación y Presupuesto", 
    "Depto. de Servicios Generales", "Depto. de Contabilidad", "Depto. de Almacén", "Depto. de Tesorería", 
    "Depto. de Inventarios",
    "Dirección de Informática - Depto. Técnico", "Dirección de Informática - Depto. Desarrollo de Sistemas", 
    "Dirección de Informática - Depto. Producción",
    "Depto. de Formación Profesional", "Depto. de Posgrado e Investigación", "Depto. de Actualización",
    "Coordinación Académica y de Operación Educativa", "Coordinación de Administración y Finanzas",
    "Depto. de Admisión y Promoción Vertical", "Depto. de Reconocimiento", "Depto. de Promoción en el Servicio",
    "Depto. de Educación Indígena", "Depto. para el Desarrollo de la Calidad Educativa", 
    "Depto. de Computación Electrónica Secundaria", "Depto. de Educación Física del Valle de México", 
    "Depto. de Educación Física del Valle de Toluca",
    "Depto. de Preparatoria Abierta Valle de México", "Depto. de Preparatoria Abierta Valle de Toluca",
    "Depto. de Apoyo Técnico", "Depto. de Administración de Personal", 
    "Depto. de Recursos Materiales y Financieros (Regionalizados)", "Depto. de Asuntos Laborales", 
    "Depto. de Trámite y Control de Personal", "Pagaduría Valle de Toluca", "Pagaduría Valle de México",
    "Dirección de Planeación y Evaluación"
  ];

  departamentosFiltrados: string[] = [...this.departamentosOriginales];

  newTicket = { 
    nombre_usuario: '', 
    departamento: '',
    personalId: '',     
    descripcion: '',    
    prioridad: '',
    notas: ''           
  };

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarTicketsDelDia();
  }

  filtrarDepartamentos(event: any) {
    const valor = event.target.value;
    this.newTicket.departamento = valor;
    this.mostrarListaDepartamentos = true;

    if (valor && valor.trim() !== '') {
      this.departamentosFiltrados = this.departamentosOriginales.filter((item) => {
        return (item.toLowerCase().indexOf(valor.toLowerCase()) > -1);
      });
    } else {
      this.departamentosFiltrados = [...this.departamentosOriginales];
    }
  }

  seleccionarDepartamento(dep: string) {
    this.newTicket.departamento = dep;
    this.mostrarListaDepartamentos = false;
  }

  ocultarListaRetrasada() {
    setTimeout(() => {
      this.mostrarListaDepartamentos = false;
    }, 200);
  }

  cargarUsuarios() {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        const todos = data || [];
        this.usersList = todos.filter((u: any) => u.rol === 'personal');
        this.cd.detectChanges();
      }
    });
  }

  cargarTicketsDelDia() {
    this.apiService.getTicketsHoy().subscribe({
      next: (data) => {
        this.ticketsHoy = data || [];
        this.cd.detectChanges();
      }
    });
  }

  verNotaCompleta(nota: string) {
    Swal.fire({
      title: 'Detalle de la Nota',
      text: nota,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#c3b08f' 
    });
  }

  enviarTicket() {
    const camposFaltantes: string[] = [];

    if (!this.newTicket.nombre_usuario) camposFaltantes.push('Solicitante');
    if (!this.newTicket.departamento)   camposFaltantes.push('Departamento');
    if (!this.newTicket.personalId)     camposFaltantes.push('Técnico');
    if (!this.newTicket.descripcion)    camposFaltantes.push('Categoría');
    if (!this.newTicket.prioridad)      camposFaltantes.push('Prioridad');

    if (camposFaltantes.length > 0) {
      Swal.fire({
        title: 'Campos Incompletos',
        text: 'Por favor completa: ' + camposFaltantes.join(', '), 
        icon: 'warning', 
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#56212f' 
      });
      return; 
    }

    const tecnico = this.usersList.find(u => u.id == this.newTicket.personalId);

    const adminActual = localStorage.getItem('usuario_actual');
    let idAdmin = null;
    if (adminActual) {
        const adminObj = JSON.parse(adminActual);
        idAdmin = adminObj.id;
    }


    const ticketParaBD = {
      nombre_usuario: this.newTicket.nombre_usuario,
      departamento: this.newTicket.departamento,
      descripcion: this.newTicket.descripcion, 
      prioridad: this.newTicket.prioridad,
      personal: tecnico ? tecnico.nombre : 'Desconocido',
      notas: this.newTicket.notas,
      admin_id: idAdmin 
    };

    this.apiService.createTicket(ticketParaBD).subscribe({
      next: (res) => {
        if(res.status === true) {
          
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            }
          });
          
          Toast.fire({
            icon: 'success',
            title: 'Ticket registrado correctamente'
          });

          this.newTicket = { 
            nombre_usuario: '', departamento: '', personalId: '', 
            descripcion: '', prioridad: '', notas: '' 
          };
          this.cargarTicketsDelDia();

        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: res.error || res.message,
            confirmButtonColor: '#56212f'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar con el servidor',
          confirmButtonColor: '#56212f'
        });
      }
    });
  }
}