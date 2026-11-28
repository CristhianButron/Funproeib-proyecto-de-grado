import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListaNegraService, ListaNegraResponse, ListaNegraCandidatoResponse, MotivoListaNegra } from '../../core/services/listanegra.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioResponse } from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { SelectBuscableComponent, OpcionBuscable } from '../../core/components/select-buscable.component';

@Component({
  selector: 'app-lista-negra',
  imports: [FormsModule, SelectBuscableComponent],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Lista negra</h1>
      <p class="text-on-surface-variant">Postulantes bloqueados. No podrán postularse mientras estén activos.</p>
    </div>

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <!-- Agregar -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6">
      <p class="font-bold text-on-surface mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-error">block</span> Agregar a lista negra</p>

      <div class="grid sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold mb-1">Buscar postulante (nombre o CI)</label>
          <app-select-buscable [opciones]="opcionesPostulantes()" [valor]="idSeleccionado()"
            placeholder="Escribe un nombre o CI..." (cambio)="seleccionar($event)" />
          @if (personaInvalida()) { <p class="text-xs text-error mt-1">Selecciona un postulante</p> }
        </div>
        <div>
          <label class="block text-xs font-semibold mb-1">Motivo</label>
          <select [(ngModel)]="nuevo.motivo" class="campo">
            <option value="ABANDONO">Abandono de programa</option>
            <option value="CONDUCTA">Mala conducta</option>
            <option value="INCUMPLIMIENTO">Incumplimiento</option>
          </select>
        </div>
      </div>

      @if (personaSeleccionada(); as p) {
        <div class="mt-3 flex items-center gap-3 bg-surface-low rounded-lg px-4 py-3">
          <span class="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 font-bold text-sm">{{ inicial(p) }}</span>
          <div class="min-w-0">
            <p class="font-semibold text-sm text-on-surface truncate">{{ p.nombreCompleto }}</p>
            <p class="text-xs text-on-surface-variant">CI {{ p.ci }} @if (p.correo) { · {{ p.correo }} }</p>
          </div>
        </div>
      }

      <div class="mt-3">
        <label class="block text-xs font-semibold mb-1">Observaciones (opcional)</label>
        <textarea [(ngModel)]="nuevo.observaciones" rows="2" maxlength="500" class="campo w-full" placeholder="Detalles breves del motivo del bloqueo..."></textarea>
      </div>

      <div class="flex justify-end mt-3">
        <button (click)="agregar()" class="px-5 py-2.5 rounded-lg bg-error text-white font-bold hover:opacity-90 transition-colors">Bloquear</button>
      </div>
    </div>

    <!-- Candidatos por abandono -->
    @if (candidatos().length > 0) {
      <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6">
        <p class="font-bold text-on-surface mb-1 flex items-center gap-2"><span class="material-symbols-outlined text-primary">person_alert</span> Marcados como abandono</p>
        <p class="text-xs text-on-surface-variant mb-3">Tienen una postulación con aprovechamiento "Abandono" y todavía no están bloqueados.</p>
        <div class="space-y-2">
          @for (c of candidatos(); track c.idUsuario) {
            <div class="flex items-center justify-between gap-3 bg-surface-low rounded-lg px-4 py-3">
              <div class="min-w-0">
                <p class="font-semibold text-sm text-on-surface truncate">{{ c.nombreCompleto }} <span class="text-on-surface-variant font-normal">· CI {{ c.ci }}</span></p>
                <p class="text-xs text-on-surface-variant truncate">Abandonó: {{ c.programas.join(', ') }}</p>
              </div>
              <button (click)="bloquearCandidato(c)" class="shrink-0 px-3 py-1.5 rounded-lg text-error hover:bg-error-container text-xs font-bold transition-colors flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">block</span> Poner en lista negra
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
      @if (cargando()) {
        <p class="p-6 text-on-surface-variant">Cargando...</p>
      } @else {
        <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-surface-low">
            <tr>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Postulante</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Motivo</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Observaciones</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Fecha</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Registrado por</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            @for (e of entradas(); track e.id) {
              <tr class="hover:bg-surface-low transition-colors">
                <td class="px-6 py-4">
                  <p class="font-semibold text-sm text-on-surface">{{ e.nombrePostulante || 'Postulante no registrado' }}</p>
                  <p class="text-xs text-error font-bold">CI {{ e.ciPostulante }}</p>
                </td>
                <td class="px-6 py-4 text-sm">{{ labelMotivo(e.motivo) }}</td>
                <td class="px-6 py-4 text-sm text-on-surface-variant max-w-xs truncate" [title]="e.observaciones || ''">{{ e.observaciones || '—' }}</td>
                <td class="px-6 py-4 text-sm">{{ e.fechaRegistro }}</td>
                <td class="px-6 py-4 text-sm text-on-surface-variant">{{ e.registradoPorNombre }}</td>
                <td class="px-6 py-4 text-right">
                  <button (click)="desactivar(e)" class="px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed text-sm font-semibold">Quitar bloqueo</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="px-6 py-10 text-center text-on-surface-variant">No hay postulantes en lista negra.</td></tr>
            }
          </tbody>
        </table>
        </div>
      }
    </div>
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#1d4e74; box-shadow:0 0 0 2px rgba(29,78,116,.2); }
  `],
})
export class ListaNegraComponent implements OnInit {
  entradas = signal<ListaNegraResponse[]>([]);
  candidatos = signal<ListaNegraCandidatoResponse[]>([]);
  usuarios = signal<UsuarioResponse[]>([]);
  cargando = signal(true);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);
  personaInvalida = signal(false);

  idSeleccionado = signal<number | null>(null);
  personaSeleccionada = computed<UsuarioResponse | null>(() =>
    this.usuarios().find(u => u.id === this.idSeleccionado()) ?? null);

  opcionesPostulantes = computed<OpcionBuscable[]>(() =>
    this.usuarios()
      .filter(u => u.rol === 'POSTULANTE')
      .map(u => ({ id: u.id, nombre: `${u.nombreCompleto} — CI ${u.ci}` })));

  nuevo: { motivo: MotivoListaNegra; observaciones: string } = { motivo: 'ABANDONO', observaciones: '' };

  constructor(
    private listaNegraService: ListaNegraService,
    private usuarioService: UsuarioService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.usuarioService.listarTodos().subscribe(u => this.usuarios.set(u));
    this.listaNegraService.listarCandidatosAbandono().subscribe(c => this.candidatos.set(c));
  }

  cargar(): void {
    this.cargando.set(true);
    this.listaNegraService.listarActivos().subscribe({
      next: (d) => { this.entradas.set(d); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.notificar('No se pudo cargar la lista negra. Intenta de nuevo en unos segundos.', true); },
    });
  }

  inicial(p: UsuarioResponse): string {
    return (p.nombre?.[0] ?? '').toUpperCase();
  }

  labelMotivo(motivo: MotivoListaNegra): string {
    const map: Record<MotivoListaNegra, string> = {
      ABANDONO: 'Abandono de programa',
      CONDUCTA: 'Mala conducta',
      INCUMPLIMIENTO: 'Incumplimiento',
    };
    return map[motivo] ?? motivo;
  }

  seleccionar(id: number | null): void {
    this.idSeleccionado.set(id);
    this.personaInvalida.set(false);
  }

  agregar(): void {
    const persona = this.personaSeleccionada();
    if (!persona) { this.personaInvalida.set(true); return; }
    const idRegistradoPor = this.auth.usuario()?.id;
    if (!idRegistradoPor) return;

    this.listaNegraService.agregar({
      ciPostulante: persona.ci,
      motivo: this.nuevo.motivo,
      observaciones: this.nuevo.observaciones.trim() || undefined,
      idRegistradoPor,
    }).subscribe({
      next: (e) => {
        this.entradas.update(l => [...l, e]);
        this.candidatos.update(l => l.filter(c => c.ci !== persona.ci));
        this.idSeleccionado.set(null);
        this.nuevo = { motivo: 'ABANDONO', observaciones: '' };
        this.notificar('Postulante bloqueado', false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al bloquear', true),
    });
  }

  async bloquearCandidato(c: ListaNegraCandidatoResponse): Promise<void> {
    const confirmado = await this.confirmDialog.confirmar({
      titulo: 'Poner en lista negra',
      mensaje: `¿Bloquear a ${c.nombreCompleto} (CI ${c.ci}) por abandono de "${c.programas.join(', ')}"?`,
      textoConfirmar: 'Bloquear',
      peligroso: true,
    });
    if (!confirmado) return;

    const idRegistradoPor = this.auth.usuario()?.id;
    if (!idRegistradoPor) return;

    this.listaNegraService.agregar({
      ciPostulante: c.ci,
      motivo: 'ABANDONO',
      observaciones: `Abandonó: ${c.programas.join(', ')}`,
      idRegistradoPor,
    }).subscribe({
      next: (e) => {
        this.entradas.update(l => [...l, e]);
        this.candidatos.update(l => l.filter(x => x.idUsuario !== c.idUsuario));
        this.notificar('Postulante bloqueado', false);
      },
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
