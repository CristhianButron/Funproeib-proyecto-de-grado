import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ProgramaResponse } from '../../core/models/programa.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  template: `
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-primary-dark">Resumen general</h1>
      <p class="text-on-surface-variant">Estado actual de los programas de formación.</p>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
      @for (kpi of kpis(); track kpi.label) {
        <div class="bg-white p-5 rounded-xl shadow-card border border-outline-variant">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3" [class]="kpi.bg">
            <span class="material-symbols-outlined" [class]="kpi.fg">{{ kpi.icono }}</span>
          </div>
          <p class="text-sm text-on-surface-variant">{{ kpi.label }}</p>
          <p class="text-3xl font-extrabold text-primary-dark mt-1">{{ kpi.valor }}</p>
        </div>
      }
    </div>

    <!-- Acciones rápidas -->
    <h2 class="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
      <span class="material-symbols-outlined text-primary">bolt</span> Acciones rápidas
    </h2>
    <div class="grid sm:grid-cols-3 gap-5 mb-8">
      <a routerLink="/admin/programas" class="flex flex-col items-center justify-center gap-3 bg-primary text-white py-8 rounded-xl shadow-card hover:bg-primary-dark transition-all">
        <span class="material-symbols-outlined text-4xl">add_circle</span>
        <span class="font-bold">Crear programa</span>
      </a>
      <a routerLink="/admin/postulantes" class="flex flex-col items-center justify-center gap-3 bg-white border-2 border-primary text-primary py-8 rounded-xl shadow-card hover:bg-primary hover:text-white transition-all">
        <span class="material-symbols-outlined text-4xl">visibility</span>
        <span class="font-bold">Ver postulantes</span>
      </a>
      <a routerLink="/admin/evaluaciones" class="flex flex-col items-center justify-center gap-3 bg-secondary text-white py-8 rounded-xl shadow-card hover:opacity-90 transition-all">
        <span class="material-symbols-outlined text-4xl">fact_check</span>
        <span class="font-bold">Evaluar postulaciones</span>
      </a>
    </div>

    <!-- Tabla programas -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
      <div class="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
        <h2 class="font-bold text-primary-dark">Programas actuales</h2>
        <a routerLink="/admin/programas" class="text-primary text-sm font-semibold hover:underline">Ver todos</a>
      </div>
      @if (cargando()) {
        <p class="p-6 text-on-surface-variant">Cargando...</p>
      } @else {
        <table class="w-full text-left">
          <thead class="bg-surface-low">
            <tr>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Programa</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Tipo</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Cupos</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            @for (p of programas(); track p.id) {
              <tr class="hover:bg-surface-low transition-colors">
                <td class="px-6 py-4 font-semibold text-primary">{{ p.nombre }}</td>
                <td class="px-6 py-4 text-on-surface-variant text-sm">{{ p.tipo }}</td>
                <td class="px-6 py-4 text-sm">{{ p.cuposDisponibles }}</td>
                <td class="px-6 py-4">
                  <span class="px-3 py-1 rounded-full text-xs font-bold" [class]="badge(p.estado)">{{ p.estado }}</span>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="px-6 py-8 text-center text-on-surface-variant">Aún no hay programas. Crea el primero.</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  programas = signal<ProgramaResponse[]>([]);
  totalPostulantes = signal(0);
  cargando = signal(true);

  kpis = signal<{ label: string; valor: number; icono: string; bg: string; fg: string }[]>([]);

  constructor(private programaService: ProgramaService, private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe({
      next: (data) => {
        this.programas.set(data);
        this.usuarioService.listarTodos().subscribe(users => {
          const postulantes = users.filter(u => u.rol === 'POSTULANTE').length;
          this.kpis.set([
            { label: 'Programas abiertos', valor: data.filter(p => p.estado === 'ABIERTO').length, icono: 'school', bg: 'bg-primary-fixed', fg: 'text-primary' },
            { label: 'Total programas', valor: data.length, icono: 'library_books', bg: 'bg-secondary-light', fg: 'text-on-secondary-container' },
            { label: 'Postulantes', valor: postulantes, icono: 'group', bg: 'bg-primary-fixed', fg: 'text-primary' },
            { label: 'Cerrados', valor: data.filter(p => p.estado === 'CERRADO').length, icono: 'check_circle', bg: 'bg-surface-high', fg: 'text-on-surface-variant' },
          ]);
          this.cargando.set(false);
        });
      },
      error: () => this.cargando.set(false),
    });
  }

  badge(estado: string): string {
    const map: Record<string, string> = {
      BORRADOR: 'bg-surface-high text-on-surface-variant',
      ACTIVO: 'bg-primary-fixed text-primary',
      ABIERTO: 'bg-secondary-light text-on-secondary-container',
      CERRADO: 'bg-error-container text-on-error-container',
    };
    return map[estado] ?? 'bg-surface-high text-on-surface-variant';
  }
}
