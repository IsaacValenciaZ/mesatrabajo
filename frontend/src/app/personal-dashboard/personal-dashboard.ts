import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-personal-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './personal-dashboard.html',
  styleUrl: './personal-dashboard.css'
})
export class PersonalDashboardComponent implements OnInit {

  router = inject(Router);
  user: any = {};
  menuAbierto: boolean = true; 

  ngOnInit() {
    this.verificarSesion();
  }

  verificarSesion() {
    const userStored = localStorage.getItem('usuario_actual');
    if (userStored) {
      this.user = JSON.parse(userStored);
      if(this.user.rol !== 'personal') {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  logout() {
    localStorage.removeItem('usuario_actual');
    this.router.navigate(['/login']);
  }
}