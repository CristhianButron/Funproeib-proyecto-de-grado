import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListaNegraService, ListaNegraResponse, MotivoListaNegra } from '../../core/services/listanegra.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-lista-negra',
  imports: [FormsModule],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Lista negra</h1>
      <p class="text-on-surface-variant">Postulantes bloqueados por CI. No podrán postularse mientras estén activos.</p>
    </div>

    @if (mensaje()) {
      <div class="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <!-- Agregar -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6">
      <p class="font-bold text-on-surface mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-error">block</span> Agregar a lista negra</p>
      <div class="grid sm:grid-cols-4 gap-3 items-end">
        <div class="sm:col-span-1">
          <label class="block text-xs font-semibold mb-1">CI del postulante</label>
          <input [(ngModel)]="nuevo.ciPostulante" class="campo" placeholder="Ej: 1234567" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold mb-1">Motivo</label>
          <select [(ngModel)]="nuevo.motivo" class="campo">
            <option value="ABANDONO">Abandono de programa</option>
            <option value="CONDUCTA">Mala conducta</option>
            <option value="INCUMPLIMIENTO">Incumplimiento</option>
          </select>
        </div>
        <button (click)="agregar()" class="py-2.5 rounded-lg bg-error text-white font-bold hover:opacity-90 transition-colors">Bloquear</button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
      @if (cargando()) {
        <p class="p-6 text-on-surface-variant">Cargando...</p>
      } @else {
        <table class="w-full text-left">
          <thead class="bg-surface-low">
            <tr>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">CI</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Motivo</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Fecha</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Registrado por</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            @for (e of entradas(); track e.id) {
              <tr class="hover:bg-surface-low transition-colors">
                <td class="px-6 py-4 font-bold text-error">{{ e.ciPostulante }}</td>
                <td class="px-6 py-4 text-sm">{{ e.motivo }}</td>
                <td class="px-6 py-4 text-sm">{{ e.fechaRegistro }}</td>
                <td class="px-6 py-4 text-sm text-on-surface-variant">{{ e.registradoPorNombre }}</td>
                <td class="px-6 py-4 text-right">
                  <button (click)="desactivar(e)" class="px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed text-sm font-semibold">Quitar bloqueo</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="px-6 py-10 text-center text-on-surface-variant">No hay postulantes en lista negra.</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#1e3a8a; box-shadow:0 0 0 2px rgba(30,58,138,.2); }
  `],
})
export class ListaNegraComponent implements OnInit {
  entradas = signal<ListaNegraResponse[]>([]);
  cargando = signal(true);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  nuevo: { ciPostulante: string; motivo: MotivoListaNegra } = { ciPostulante: '', motivo: 'ABANDONO' };

  constructor(private listaNegraService: ListaNegraService, private auth: AuthService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.listaNegraService.listarActivos().subscribe({
      next: (d) => { this.entradas.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  agregar(): void {
    if (!this.nuevo.ciPostulante.trim()) { this.notificar('Ingresa el CI', true); return; }
    const idRegistradoPor = this.auth.usuario()?.id;
    if (!idRegistradoPor) return;
    this.listaNegraService.agregar({ ...this.nuevo, idRegistradoPor }).subscribe({
      next: (e) => { this.entradas.update(l => [...l, e]); this.nuevo = { ciPostulante: '', motivo: 'ABANDONO' }; this.notificar('Postulante bloqueado', false); },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al bloquear', true),
    });
  }

  desactivar(e: ListaNegraResponse): void {
    this.listaNegraService.desactivar(e.id).subscribe({
      next: () => { this.entradas.update(l => l.filter(x => x.id !== e.id)); this.notificar('Bloqueo retirado', false); },
      error: (err) => this.notificar(err.error?.mensaje || 'Error', true),
    });
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
