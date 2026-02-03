import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-user.component.html',
  styleUrls: ['./delete-user.component.css']
})
export class DeleteUserComponent {
  @Input() user: any;
  @Output() close = new EventEmitter<void>();
  @Output() confirmDelete = new EventEmitter<number>();

  confirmar() {
    this.confirmDelete.emit(this.user.id);
  }
}