import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css'
})
export class TicketsComponent implements OnInit {
  private apiService = inject(ApiService);
  usersList: any[] = [];
  newTicket = { destinatarioId: '', asunto: '', mensaje: '' };

  ngOnInit() {
    this.apiService.getUsers().subscribe(data => this.usersList = data || []);
  }

  enviarTicket() {
    console.log("Enviando...", this.newTicket);
    alert('Ticket enviado (Simulación)');
    this.newTicket = { destinatarioId: '', asunto: '', mensaje: '' };
  }
}