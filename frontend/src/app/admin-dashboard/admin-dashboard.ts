import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent {
  private router = inject(Router);
  isSidebarOpen = true;
  user: any = {nombre: ''};

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout() {
    localStorage.removeItem('usuario_actual');
    this.router.navigate(['/login']);
  }

  nombreUsuario: string = '';

  ngOnInit() {
    const usuarioGuardado = localStorage.getItem('usuario_actual');
    
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      this.nombreUsuario = usuario.nombre; 
    }
  }
  
}