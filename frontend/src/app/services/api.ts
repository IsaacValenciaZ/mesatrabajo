import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private http = inject(HttpClient);

  
  private baseUrl = 'http://localhost/backend'; 

  constructor() { }

login(email: string, password: string): Observable<any> {
    const body = { email: email, password: password };
    return this.http.post(`${this.baseUrl}/login.php`, body);
  }

  register(usuario: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register.php`, usuario);
  }
}