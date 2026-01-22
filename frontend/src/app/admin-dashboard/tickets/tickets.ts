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
   
    if (!this.newTicket.personalId || !this.newTicket.descripcion || !this.newTicket.nombre_usuario) {
      alert('Faltan datos: Selecciona Solicitante, Técnico y Tipo de Servicio');
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