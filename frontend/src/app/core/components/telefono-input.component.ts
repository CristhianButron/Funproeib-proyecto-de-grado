import { Component, forwardRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CODIGOS_PAIS } from '../data/codigos-pais';

/**
 * Selector de código de país + número, para postulantes internacionales.
 * Implementa ControlValueAccessor para integrarse con formControlName como
 * un <input> más; el valor expuesto al formulario es un único string
 * "+591 70012345" (código y número separados por un espacio).
 */
@Component({
  selector: 'app-telefono-input',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="flex gap-2">
    <select [(ngModel)]="codigo" (ngModelChange)="emitir()" [disabled]="disabled" class="campo w-[9.5rem] shrink-0 disabled:bg-surface-high disabled:text-on-surface-variant">
      @for (c of codigos; track c.pais) {
        <option [value]="c.codigo">{{ c.codigo }} · {{ c.pais }}</option>
      }
    </select>
    <input [(ngModel)]="numero" (ngModelChange)="emitir()" (input)="limpiar($event)" (blur)="onTouched()"
      type="tel" inputmode="numeric" [disabled]="disabled" placeholder="Ej: 70012345"
      class="campo flex-1 disabled:bg-surface-high disabled:text-on-surface-variant" />
  </div>
  `,
  styles: [`
    .campo { padding:.6rem .8rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; transition: all .15s; }
    .campo:focus { border-color:#1d4e74; box-shadow:0 0 0 2px rgba(29,78,116,.2); }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TelefonoInputComponent), multi: true }],
})
export class TelefonoInputComponent implements ControlValueAccessor {
  codigos = CODIGOS_PAIS;
  codigo = '+591';
  numero = '';
  disabled = false;

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    if (!value) {
      this.codigo = '+591';
      this.numero = '';
      return;
    }
    const match = value.trim().match(/^(\+\d{1,4})\s*(.*)$/);
    if (match) {
      this.codigo = match[1];
      this.numero = match[2];
    } else {
      // Dato antiguo guardado sin código de país: se conserva como número.
      this.numero = value.trim();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  limpiar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '');
    if (soloDigitos !== input.value) {
      this.numero = soloDigitos;
    }
  }

  emitir(): void {
    this.onChange(this.numero.trim() ? `${this.codigo} ${this.numero.trim()}` : '');
  }
}
