import { Component, OnInit, Signal, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { ToastService } from '../../core/services/toast.service';
import { ProgramaResponse, EstadoPrograma } from '../../core/models/programa.model';
import { badgePrograma, colorBordePrograma, colorTextoPrograma } from '../../core/utils/estado-colores';

@Component({
  selector: 'app-programas-admin',
  imports: [FormsModule, RouterLink],
  template: `
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-extrabold text-primary-dark">Programas de formación</h1>
        <p class="text-on-surface-variant">Crea y gestiona las convocatorias.</p>
      </div>
      <a routerLink="/admin/programas/nuevo" class="px-5 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-card">
        <span class="material-symbols-outlined">add</span> Crear programa
      </a>
    </div>

    <!-- Búsqueda y orden -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-3 mb-4 flex items-center gap-3 flex-wrap">
      <div class="flex items-center gap-2 flex-1 min-w-[200px]">
        <span class="material-symbols-outlined text-outline">search</span>
        <input [(ngModel)]="busqueda" (ngModelChange)="busquedaSignal.set($event)" class="flex-1 outline-none text-sm" placeholder="Buscar por nombre o tipo..." />
      </div>
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-outline text-[20px]">sort</span>
        <select [(ngModel)]="orden" (ngModelChange)="ordenSignal.set($event)" class="text-sm font-semibold rounded-lg px-2 py-1.5 border border-outline-variant bg-white cursor-pointer">
          <option value="fecha">Fecha de inicio</option>
          <option value="nombre">Nombre (A-Z)</option>
          <option value="tipo">Tipo</option>
        </select>
      </div>
    </div>

    <!-- Resumen por estado -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      @for (e of estados; track e) {
        <div class="bg-white p-4 rounded-xl shadow-card border-l-4" [class]="colorBorde(e)">
          <p class="text-xs text-on-surface-variant uppercase font-bold">{{ e }}</p>
          <p class="text-2xl font-extrabold" [class]="colorTexto(e)">{{ contarEstado(e) }}</p>
        </div>
      }
    </div>

    <!-- Tarjetas de programas -->
    @if (cargando()) {
      <p class="p-6 text-on-surface-variant">Cargando...</p>
    } @else {
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (p of programasFiltrados(); track p.id) {
          <div [routerLink]="destinoRuta(p.estado)" [queryParams]="{ programa: p.id }"
            class="group bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow border-l-4 flex flex-col cursor-pointer" [class]="colorBorde(p.estado)"
            [title]="esFinalizado(p.estado) ? 'Ver beneficiarios de este programa' : 'Ver postulantes de este programa'">
            <div class="p-5 flex-1">
              <div class="flex items-center justify-between mb-3">
                <span class="inline-flex items-center gap-1 text-xs font-bold uppercase text-on-surface-variant">
                  <span class="material-symbols-outlined text-[16px]">{{ iconoTipo(p.tipo) }}</span> {{ p.tipo }}
                </span>
                <span class="px-3 py-1 rounded-full text-xs font-bold" [class]="badge(p.estado)">{{ p.estado }}</span>
              </div>
              <h3 class="font-bold text-lg text-on-surface leading-tight group-hover:text-primary transition-colors">{{ p.nombre }}</h3>
              @if (p.edicion) { <p class="text-xs text-on-surface-variant mt-0.5">Edición {{ p.edicion }}</p> }
              <div class="mt-4 space-y-2 text-sm text-on-surface-variant">
                <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">event</span>{{ p.fechaInicio }} → {{ p.fechaFin }}</p>
                <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">groups</span>{{ p.cuposDisponibles }} cupos</p>
                <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">how_to_reg</span>{{ p.totalPostulantes }} postulante{{ p.totalPostulantes === 1 ? '' : 's' }}</p>
                @if (esFinalizado(p.estado)) {
                  <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-secondary">verified</span>{{ p.totalBeneficiarios }} beneficiario{{ p.totalBeneficiarios === 1 ? '' : 's' }}</p>
                }
              </div>
              <p class="mt-3 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {{ esFinalizado(p.estado) ? 'Ver beneficiarios' : 'Ver postulantes' }} <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </p>
            </div>
            <div class="border-t border-outline-variant px-5 py-3 flex items-center justify-between gap-2" (click)="$event.stopPropagation()">
              <select [ngModel]="p.estado" (ngModelChange)="cambiarEstado(p, $event)" class="text-xs font-semibold rounded-lg px-2 py-1.5 border border-outline-variant bg-white cursor-pointer">
                <option value="BORRADOR">Borrador</option>
                <option value="ACTIVO">Activo</option>
                <option value="ABIERTO">Abierto</option>
                <option value="CERRADO">Cerrado</option>
              </select>
              <a [routerLink]="['/admin/programas', p.id]" class="px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed transition-colors text-xs font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">edit</span> Editar programa
              </a>
            </div>
          </div>
        } @empty {
          <div class="col-span-full text-center py-16 text-on-surface-variant bg-white rounded-xl border border-outline-variant">
            <span class="material-symbols-outlined text-5xl text-outline-variant">school</span>
            <p class="mt-3">No hay programas que coincidan.</p>
          </div>
        }
      </div>
    }
  </div>

  `,
})
export class ProgramasAdminComponent implements OnInit {
  estados: EstadoPrograma[] = ['BORRADOR', 'ACTIVO', 'ABIERTO', 'CERRADO'];

  programas = signal<ProgramaResponse[]>([]);
  busqueda = '';
  busquedaSignal = signal('');
  orden: 'fecha' | 'nombre' | 'tipo' = 'fecha';
  ordenSignal = signal<'fecha' | 'nombre' | 'tipo'>('fecha');

  programasFiltrados = computed(() => {
    const b = this.busquedaSignal().toLowerCase().trim();
    const filtrados = !b ? this.programas()
      : this.programas().filter(p => p.nombre.toLowerCase().includes(b) || p.tipo.toLowerCase().includes(b));

    const orden = this.ordenSignal();
    return [...filtrados].sort((a, b) => {
      if (orden === 'nombre') return a.nombre.localeCompare(b.nombre);
      if (orden === 'tipo') return a.tipo.localeCompare(b.tipo) || a.nombre.localeCompare(b.nombre);
      return a.fechaInicio.localeCompare(b.fechaInicio);
    });
  });

  cargando = signal(true);
  readonly mensaje: Signal<string | null>;
  readonly mensajeError: Signal<boolean>;

  constructor(private programaService: ProgramaService, private toast: ToastService) {
    this.mensaje = toast.mensaje;
    this.mensajeError = toast.esError;
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.programaService.listarTodos().subscribe({
      next: (data) => { this.programas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  cambiarEstado(p: ProgramaResponse, estado: EstadoPrograma): void {
    this.programaService.cambiarEstado(p.id, estado).subscribe({
      next: (a) => { this.programas.update(l => l.map(x => x.id === p.id ? { ...x, estado: a.estado } : x)); this.notificar('Estado actualizado', false); },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al cambiar estado', true),
    });
  }

  badge = badgePrograma;
  colorBorde = colorBordePrograma;
  colorTexto = colorTextoPrograma;

  iconoTipo(tipo: string): string {
    const map: Record<string, string> = {
      DIPLOMADO: 'school',
      CURSO: 'menu_book',
      TALLER: 'construction',
    };
    return map[tipo] ?? 'school';
  }

  contarEstado(estado: EstadoPrograma): number {
    return this.programas().filter(p => p.estado === estado).length;
  }

  // ACTIVO/CERRADO: la selección de postulantes ya pasó, lo relevante ahora
  // es el seguimiento de los beneficiarios. BORRADOR/ABIERTO: todavía se
  // está formando o recibiendo postulaciones.
  esFinalizado(estado: EstadoPrograma): boolean {
    return estado === 'ACTIVO' || estado === 'CERRADO';
  }

  destinoRuta(estado: EstadoPrograma): string[] {
    return this.esFinalizado(estado) ? ['/admin/beneficiarios'] : ['/admin/postulantes'];
  }

  private notificar(msg: string, error: boolean): void {
    this.toast.notificar(msg, error);
  }
}
