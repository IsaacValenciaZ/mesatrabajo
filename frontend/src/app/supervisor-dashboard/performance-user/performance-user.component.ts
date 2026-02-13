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

  loading: boolean = true;
  completados: number = 0; 
  incompletos: number = 0;
  total: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && !changes['user'].firstChange) {
      this.obtenerEstadisticas();
    }
  }

  ngOnInit(): void {
    this.obtenerEstadisticas();
  }

  obtenerEstadisticas(): void {
    if (!this.user || !this.user.nombre) return;
    
    this.loading = true;
    const nombreLimpio = this.user.nombre.trim();
    const url = `http://localhost/mesatrabajoBACKEND/backend/get_tickets_personal.php?personal=${nombreLimpio}`;

    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.total = res.length;
          this.completados = res.filter(t => t.estado && t.estado.toLowerCase() === 'completo').length;
          this.incompletos = res.filter(t => t.estado && t.estado.toLowerCase() === 'incompleto').length;
          
          this.loading = false;
          this.cdr.detectChanges(); 
          
          // Retardo para asegurar que el canvas sea visible en el DOM
          setTimeout(() => this.renderChart(), 100);
        } else {
          this.resetCounts();
        }
      },
      error: (err) => {
        console.error('Error al conectar con el backend:', err);
        this.resetCounts();
      }
    });
  }

  resetCounts(): void {
    this.total = 0;
    this.completados = 0;
    this.incompletos = 0;
    this.loading = false;
    this.cdr.detectChanges();
  }

  renderChart(): void {
    if (!this.canvas) return;
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) { 
      this.chartInstance.destroy(); 
    }

    // Usamos 'any' en la configuración para que TypeScript acepte 'cutout' sin errores
    const config: any = {
      type: 'doughnut',
      data: {
        labels: ['Completados', 'Incompletos'],
        datasets: [{
          data: [this.completados, this.incompletos],
          backgroundColor: ['#28a745', '#dc3545'],
          hoverBackgroundColor: ['#218838', '#c82333'],
          borderWidth: 0,
          cutout: '80%' // Propiedad que causaba el error de tipado
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    };

    this.chartInstance = new Chart(ctx, config);
  }

  ngOnDestroy(): void { 
    if (this.chartInstance) {
      this.chartInstance.destroy(); 
    }
  }
}