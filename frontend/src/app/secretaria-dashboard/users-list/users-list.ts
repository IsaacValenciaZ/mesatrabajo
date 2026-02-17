import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // 1. IMPORTAR ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css'
})
export class UsersListComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef); 

  usersList: any[] = [];

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.usersList = data || [];
        this.cd.detectChanges(); 
      },
      error: (err) => console.error(err)
    });
  }

  get personalUsers() {
    return (this.usersList || []).filter(u => u.rol === 'personal');
  }

  irATickets(userId: any) {
    this.router.navigate(['/secretaria/tickets']);
  }
}