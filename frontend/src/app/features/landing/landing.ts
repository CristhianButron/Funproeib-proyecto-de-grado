import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { ProgramaResponse } from '../../core/models/programa.model';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  template: `
  <div class="min-h-screen flex flex-col bg-surface">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-outline-variant">
      <div class="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="logo-funproeib.png" alt="Funproeib Andes" class="h-14 w-auto object-contain" />
          <div class="hidden sm:block">
            <p class="font-extrabold text-primary-dark leading-tight text-lg">Funproeib Andes</p>
            <p class="text-xs text-on-surface-variant">Gestión Académica y Postulaciones</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/login" class="px-5 py-2 rounded-lg font-semibold text-primary hover:bg-surface-low transition-colors">
            Iniciar sesión
          </a>
          <a routerLink="/registro" class="px-5 py-2 rounded-lg font-semibold bg-primary text-white hover:bg-primary-dark transition-colors shadow-card">
            Registrarse
          </a>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="bg-gradient-to-b from-white to-surface">
      <div class="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span class="inline-block px-3 py-1 rounded-full bg-secondary-light text-on-secondary-container text-xs font-bold mb-4">
            Educación Intercultural Bilingüe
          </span>
          <h1 class="text-4xl md:text-5xl font-extrabold text-primary-dark leading-tight tracking-tight">
            Postula a los programas de formación de Funproeib Andes
          </h1>
          <p class="mt-5 text-on-surface-variant text-lg leading-relaxed">
            Plataforma para gestionar convocatorias, postulaciones y evaluación de
            programas de formación en educación intercultural bilingüe, liderazgo
            indígena y revitalización lingüística.
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <a routerLink="/registro" class="px-7 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-all shadow-card flex items-center gap-2">
              <span class="material-symbols-outlined">how_to_reg</span>
              Quiero postularme
            </a>
            <a href="#programas" class="px-7 py-3 rounded-xl font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-2">
              <span class="material-symbols-outlined">school</span>
              Ver programas
            </a>
          </div>
        </div>
        <div class="flex justify-center">
          <div class="bg-white rounded-3xl shadow-card-hover p-10 border border-outline-variant">
            <img src="logo-funproeib.png" alt="Funproeib Andes" class="h-64 w-auto object-contain" />
          </div>
        </div>
      </div>
    </section>

    <!-- Características -->
    <section class="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-6">
      @for (f of caracteristicas; track f.titulo) {
        <div class="bg-white rounded-2xl p-6 border border-outline-variant shadow-card">
          <div class="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center mb-4">
            <span class="material-symbols-outlined">{{ f.icono }}</span>
          </div>
          <h3 class="font-bold text-on-surface text-lg">{{ f.titulo }}</h3>
          <p class="text-on-surface-variant text-sm mt-2 leading-relaxed">{{ f.texto }}</p>
        </div>
      }
    </section>

    <!-- Programas -->
    <section id="programas" class="bg-white border-y border-outline-variant">
      <div class="max-w-6xl mx-auto px-6 py-14">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-extrabold text-primary-dark">Programas disponibles</h2>
          <p class="text-on-surface-variant mt-2">Convocatorias abiertas para postulación</p>
        </div>

        @if (cargando()) {
          <p class="text-center text-on-surface-variant py-10">Cargando programas...</p>
        } @else if (programasAbiertos().length === 0) {
          <div class="text-center py-12 text-on-surface-variant">
            <span class="material-symbols-outlined text-5xl text-outline-variant">inbox</span>
            <p class="mt-3">No hay convocatorias abiertas en este momento.</p>
          </div>
        } @else {
          <div class="grid md:grid-cols-3 gap-6">
            @for (p of programasAbiertos(); track p.id) {
              <div class="rounded-2xl border border-outline-variant overflow-hidden shadow-card hover:shadow-card-hover transition-shadow bg-white flex flex-col">
                <div class="h-2 bg-gradient-to-r from-primary to-secondary"></div>
                <div class="p-6 flex-1 flex flex-col">
                  <span class="text-xs font-bold text-secondary uppercase">{{ p.tipo }}</span>
                  <h3 class="font-bold text-on-surface text-lg mt-1">{{ p.nombre }}</h3>
                  <div class="mt-4 space-y-2 text-sm text-on-surface-variant flex-1">
                    <p class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[18px] text-primary">event</span>
                      {{ p.fechaInicio }} → {{ p.fechaFin }}
                    </p>
                    <p class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[18px] text-primary">groups</span>
                      {{ p.cuposDisponibles }} cupos disponibles
                    </p>
                  </div>
                  <a routerLink="/registro" class="mt-5 w-full text-center px-4 py-2 rounded-lg font-semibold bg-primary text-white hover:bg-primary-dark transition-colors">
                    Postularme
                  </a>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>

    <!-- CTA Footer -->
    <footer class="bg-tertiary text-white mt-auto">
      <div class="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <img src="logo-funproeib.png" alt="Funproeib" class="h-12 w-auto bg-white rounded-lg p-1" />
          <div>
            <p class="font-bold">Funproeib Andes</p>
            <p class="text-on-tertiary-container text-sm">Sistema de Gestión Académica</p>
          </div>
        </div>
        <p class="text-on-tertiary-container text-sm text-center">
          © 2026 Fundación Funproeib Andes · Cochabamba, Bolivia
        </p>
      </div>
    </footer>
  </div>
  `,
})
export class LandingComponent implements OnInit {
  programas = signal<ProgramaResponse[]>([]);
  cargando = signal(true);

  caracteristicas = [
    { icono: 'verified', titulo: 'Postulación en línea', texto: 'Regístrate y postula a las convocatorias abiertas sin trámites en papel.' },
    { icono: 'fact_check', titulo: 'Verificación de requisitos', texto: 'Carga tus documentos y el sistema valida automáticamente los requisitos.' },
    { icono: 'workspace_premium', titulo: 'Evaluación transparente', texto: 'Tu postulación es evaluada con criterios definidos para cada programa.' },
  ];

  programasAbiertos = signal<ProgramaResponse[]>([]);

  constructor(private programaService: ProgramaService) {}

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe({
      next: (data) => {
        this.programas.set(data);
        this.programasAbiertos.set(data.filter(p => p.estado === 'ABIERTO'));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
