import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-personal-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-dashboard.html',
  styleUrl: './personal-dashboard.css'
})
export class PersonalDashboardComponent implements OnInit {

  user: any = {};
  router = inject(Router);

  ngOnInit() {
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

  logout() {
    localStorage.removeItem('usuario_actual');
    this.router.navigate(['/login']);
  }

  
}