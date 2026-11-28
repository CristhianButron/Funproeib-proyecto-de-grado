import { Component, OnInit, Signal, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../core/services/usuario.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioResponse } from '../../core/models/usuario.model';

/**
 * Verificación de identidad de una cuenta: página propia (ruta
 * /admin/usuarios/:id), no un modal flotante. El dashboard y la lista de
 * Usuarios enlazan acá directamente.
 */
@Component({
  selector: 'app-ficha-usuario',
  imports: [RouterLink],
  template: `
  <div class="max-w-3xl mx-auto">
    <div class="mb-4 flex items-center justify-between flex-wrap gap-2">
      <nav class="flex items-center gap-1.5 text-sm min-w-0" aria-label="Ruta de navegación">
        <a routerLink="../usuarios" class="font-semibold text-on-surface-variant hover:text-primary transition-colors">Usuarios</a>
        <span class="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
        <span class="font-semibold text-on-surface truncate">{{ usuario()?.nombreCompleto || 'Ficha' }}</span>
      </nav>
      <button (click)="volver()" class="text-sm font-semibold text-on-surface-variant hover:text-primary flex items-center gap-1 shrink-0">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span> Volver
      </button>
    </div>

    @if (cargando()) {
      <p class="text-on-surface-variant py-10 text-center">Cargando...</p>
    } @else if (!usuario()) {
      <div class="bg-white rounded-xl border border-outline-variant p-10 text-center text-on-surface-variant">
        No se encontró la cuenta.
      </div>
    } @else {
      <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
        <div class="bg-primary text-white px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <h1 class="font-bold text-xl flex items-center gap-2"><span class="material-symbols-outlined">fingerprint</span> Verificación de identidad</h1>
          @if (usuario()!.identidadVerificada) {
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/20 flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">verified</span> Verificada
            </span>
          }
        </div>

        <div class="p-6 space-y-5">
          <div>
            <p class="font-semibold text-lg">{{ usuario()!.nombreCompleto }}</p>
            <p class="text-sm text-on-surface-variant">CI: {{ usuario()!.ci }}{{ usuario()!.ciExtension ? ' ' + usuario()!.ciExtension : '' }} · {{ usuario()!.correo }}</p>
          </div>
          <p class="text-xs text-on-surface-variant">Compara las fotos con el nombre y CI declarados antes de decidir.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-bold text-on-surface-variant uppercase mb-2">Anverso</p>
              @if (imgAnverso()) {
                <img [src]="imgAnverso()" class="w-full rounded-lg border border-outline-variant" alt="Anverso del carnet" />
              } @else {
                <p class="text-sm text-on-surface-variant">Cargando...</p>
              }
            </div>
            <div>
              <p class="text-xs font-bold text-on-surface-variant uppercase mb-2">Reverso</p>
              @if (imgReverso()) {
                <img [src]="imgReverso()" class="w-full rounded-lg border border-outline-variant" alt="Reverso del carnet" />
              } @else {
                <p class="text-sm text-on-surface-variant">Cargando...</p>
              }
            </div>
          </div>
          @if (!usuario()!.identidadVerificada) {
            <div class="flex flex-wrap gap-2 pt-4 border-t border-outline-variant">
              <button (click)="verificarIdentidad()" class="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-1">
                <span class="material-symbols-outlined text-[18px]">check_circle</span> Verificar identidad
              </button>
              <button (click)="rechazarIdentidad()" class="px-4 py-2 rounded-lg text-sm font-bold bg-error text-white hover:opacity-90 transition-colors flex items-center gap-1">
                <span class="material-symbols-outlined text-[18px]">block</span> Rechazar y eliminar cuenta
              </button>
            </div>
          }
        </div>
      </div>
    }
  </div>
  `,
})
export class FichaUsuarioComponent implements OnInit {
  cargando = signal(true);
  usuario = signal<UsuarioResponse | null>(null);
  imgAnverso = signal<string | null>(null);
  imgReverso = signal<string | null>(null);

  readonly mensaje: Signal<string | null>;
  readonly mensajeError: Signal<boolean>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private usuarioService: UsuarioService,
    private confirmDialog: ConfirmDialogService,
    private toast: ToastService,
  ) {
    this.mensaje = toast.mensaje;
    this.mensajeError = toast.esError;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.cargando.set(false); return; }
    this.cargar(id);
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.usuarioService.obtenerPorId(id).subscribe({
      next: (u) => {
        this.usuario.set(u);
        this.cargando.set(false);
        this.usuarioService.obtenerCarnet(id, 'anverso').subscribe(blob => this.imgAnverso.set(URL.createObjectURL(blob)));
        this.usuarioService.obtenerCarnet(id, 'reverso').subscribe(blob => this.imgReverso.set(URL.createObjectURL(blob)));
      },
      error: () => this.cargando.set(false),
    });
  }

  verificarIdentidad(): void {
    const u = this.usuario();
    if (!u) return;
    this.usuarioService.verificarIdentidad(u.id).subscribe({
      next: (actualizado) => { this.usuario.set(actualizado); this.notificar(`Identidad de ${actualizado.nombreCompleto} verificada.`, false); },
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo verificar la identidad', true),
    });
  }

  // Elimina la cuenta completa (ver UsuarioServiceImpl en el backend): por
  // eso pide confirmación fuerte y luego vuelve al listado, porque el
  // registro deja de existir.
  async rechazarIdentidad(): Promise<void> {
    const u = this.usuario();
    if (!u) return;
    const confirmado = await this.confirmDialog.confirmar({
      titulo: 'Rechazar identidad',
      mensaje: `¿Rechazar la identidad de ${u.nombreCompleto}?\n\n` +
        'Esta acción ELIMINA PERMANENTEMENTE su cuenta y todas sus postulaciones, ' +
        'y le envía un correo informando que se detectó un posible intento de falsificación de identidad. No se puede deshacer.',
      textoConfirmar: 'Rechazar y eliminar cuenta',
      peligroso: true,
    });
    if (!confirmado) return;

    this.usuarioService.rechazarIdentidad(u.id).subscribe({
      next: () => this.router.navigate(['..'], { relativeTo: this.route }),
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo rechazar la identidad', true),
    });
  }

  volver(): void {
    this.location.back();
  }

  private notificar(msg: string, error: boolean): void {
    this.toast.notificar(msg, error);
  }
}
