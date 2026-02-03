import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para [(ngModel)]

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent {
  @Input() user: any;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  guardar() {
    this.save.emit(this.user);
  }
}