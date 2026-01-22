import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { ApiService } from '../../services/api';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tickets-list.html',
  styleUrl: './tickets-list.css'
})

export class TicketsListComponent implements OnInit {
  private apiService = inject(ApiService);
  private cd = inject(ChangeDetectorRef); 

  gruposDeTickets: any[] = [];

  ngOnInit() {
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.apiService.getHistoryTickets().subscribe(data => {
      this.gruposDeTickets = this.agruparPorDia(data || []);
      
 
      this.cd.detectChanges();
    });
  }

  agruparPorDia(listaTickets: any[]) {
    const grupos: { [key: string]: any[] } = {};

    listaTickets.forEach(ticket => {

      const fechaSola = ticket.fecha.split(' ')[0];
      
      if (!grupos[fechaSola]) {
        grupos[fechaSola] = [];
      }
      grupos[fechaSola].push(ticket);
    });

    return Object.keys(grupos)
      .sort((a, b) => b.localeCompare(a)) 
      .map(fecha => ({
        fecha: fecha,
        tickets: grupos[fecha]
      }));
  }

  verNotaCompleta(nota: string) {
    Swal.fire({
      title: 'Detalle de la Nota',
      text: nota,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#2c3e50'
    })
  }
}