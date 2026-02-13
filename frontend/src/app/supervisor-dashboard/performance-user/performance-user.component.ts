import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, inject, OnDestroy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-performance-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './performance-user.component.html',
  styleUrls: ['./performance-user.component.css']
})
export class PerformanceUserComponent implements OnInit, OnDestroy, OnChanges {
  @Input() user: any;
  @Output() close = new EventEmitter<void>();
  @ViewChild('myChart', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private chartInstance: Chart | null = null;

  loading = true;
  completados: number = 0; 
  incompletos: number = 0;
  total: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && !changes['user'].firstChange) {
      this.obtenerEstadisticas();
    }
  }

  ngOnInit() {
    this.obtenerEstadisticas();
  }

  obtenerEstadisticas() {
    if (!this.user || !this.user.nombre) return;
    
    this.loading = true;
    const nombreLimpio = this.user.nombre.trim();
    const url = `http://localhost/mesatrabajoBACKEND/backend/get_tickets_personal.php?personal=${nombreLimpio}`;

    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          
          this.total = res.length;
          
          this.completados = res.filter(t => t.estado.toLowerCase() === 'completo').length;
          this.incompletos = res.filter(t => t.estado.toLowerCase() === 'incompleto').length;
          
          this.loading = false;

          this.cdr.detectChanges(); 
          
          
          setTimeout(() => this.renderChart(), 100);
        } else {
          this.resetCounts();
        }
      },
      error: () => this.resetCounts()
    });
  }

  resetCounts() {
    this.total = 0;
    this.completados = 0;
    this.incompletos = 0;
    this.loading = false;
    this.cdr.detectChanges();
  }

  renderChart() {
    if (!this.canvas) return;
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) { this.chartInstance.destroy(); }

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completados', 'Incompletos'],
        datasets: [{
          data: [this.completados, this.incompletos], 
          backgroundColor: ['#28a745', '#dc3545'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  ngOnDestroy() { if (this.chartInstance) this.chartInstance.destroy(); }
}