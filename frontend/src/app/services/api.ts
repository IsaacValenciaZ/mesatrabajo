import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  private http = inject(HttpClient);
 
  private apiUrl = 'http://localhost/mesatrabajoBACKEND/backend'; 

  constructor() { }


  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login.php`, { email, password });
  }


  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register.php`, userData);
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get_users.php`);
  }
}