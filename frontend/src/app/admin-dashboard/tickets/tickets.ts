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


  newTicket = { 
    nombre_usuario: '', 
    departamento: '',
    personalId: '',     
    descripcion: '',    
    prioridad: '',
    notas: ''           
  };
  
  fechaActual = new Date();
  
verNotaCompleta(nota: string) {
  Swal.fire({
    title: 'Detalle de la Nota',
    text: nota,
    icon: 'info',
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#c3b08f'
  })
}
  ngOnInit() {
    this.cargarUsuarios();
    this.cargarTicketsDelDia();
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

  enviarTicket() {
   
    const camposFaltantes: string[] = [];

if (!this.newTicket.nombre_usuario) camposFaltantes.push('Nombre del Usuario');
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

    const ticketParaBD = {
      nombre_usuario: this.newTicket.nombre_usuario,
      departamento: this.newTicket.departamento,
      descripcion: this.newTicket.descripcion, 
      prioridad: this.newTicket.prioridad,
      personal: tecnico ? tecnico.nombre : 'Desconocido',
      notas: this.newTicket.notas
    };

    this.apiService.createTicket(ticketParaBD).subscribe({
      next: (res) => {
        if(res.status === true) {
            alert('Ticket registrado correctamente');
            this.newTicket = { 
                nombre_usuario: '', departamento: '', personalId: '', 
                descripcion: '', prioridad: '', notas: '' 
            };
            this.cargarTicketsDelDia();
        } else {
            alert('Error BD: ' + (res.error || res.message));
        }
      },
      error: () => alert('Error de conexión con el servidor')
    });
  }

  
}