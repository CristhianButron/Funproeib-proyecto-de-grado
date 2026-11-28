import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-password-requisitos',
  template: `
  <ul class="text-xs mt-1.5 space-y-1">
    <li class="flex items-center gap-1.5" [class]="cumpleLongitud() ? 'text-secondary' : 'text-on-surface-variant'">
      <span class="material-symbols-outlined text-[14px]">{{ cumpleLongitud() ? 'check_circle' : 'radio_button_unchecked' }}</span>
      Al menos 8 caracteres
    </li>
    <li class="flex items-center gap-1.5" [class]="cumpleMayuscula() ? 'text-secondary' : 'text-on-surface-variant'">
      <span class="material-symbols-outlined text-[14px]">{{ cumpleMayuscula() ? 'check_circle' : 'radio_button_unchecked' }}</span>
      Una letra mayúscula
    </li>
    <li class="flex items-center gap-1.5" [class]="cumpleNumero() ? 'text-secondary' : 'text-on-surface-variant'">
      <span class="material-symbols-outlined text-[14px]">{{ cumpleNumero() ? 'check_circle' : 'radio_button_unchecked' }}</span>
      Un número
    </li>
    <li class="flex items-center gap-1.5" [class]="cumpleSimbolo() ? 'text-secondary' : 'text-on-surface-variant'">
      <span class="material-symbols-outlined text-[14px]">{{ cumpleSimbolo() ? 'check_circle' : 'radio_button_unchecked' }}</span>
      Un símbolo (ej: ! @ # $ %)
    </li>
  </ul>
  `,
})
export class PasswordRequisitosComponent {
  @Input() password = '';

  cumpleLongitud(): boolean { return this.password.length >= 8; }
  cumpleMayuscula(): boolean { return /[A-Z]/.test(this.password); }
  cumpleNumero(): boolean { return /\d/.test(this.password); }
  cumpleSimbolo(): boolean { return /[^A-Za-z0-9\s]/.test(this.password); }
}
