import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent {
  newUser = { nombre: '', email: '', rol: 'personal' }; 
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<any>();

  crear() {
    if (this.newUser.nombre && this.newUser.email) {
      this.create.emit(this.newUser);
      this.close.emit();
    } else {
      alert('Por favor completa todos los campos');
    }
  }
}