import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  private http = inject(HttpClient);
  
 
  private baseUrl = 'http://localhost/mesatrabajoBACKEND/backend'; 

  constructor() { }


  login(email: string, password: string): Observable<any> {
    const body = { email: email, password: password };
    return this.http.post(`${this.baseUrl}/login.php`, body);
  }


  register(usuario: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register.php`, usuario);
  }


  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_users.php`);
  }

  createTicket(ticketData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create_tickets.php`, ticketData);
  }

  getTicketsHoy(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_tickets.php`);
  }

  getHistoryTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/history_tickets.php`);
  }


  getMisTickets(nombrePersonal: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_tickets_personal.php?personal=${nombrePersonal}`);
  }


  actualizarEstadoTicket(id: number, nuevoEstado: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/update_tickets_personal.php`, { id, estado: nuevoEstado });
  }
}