import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './core/components/confirm-dialog.component';
import { ToastComponent } from './core/components/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmDialogComponent, ToastComponent],
  template: '<router-outlet /><app-confirm-dialog /><app-toast />',
})
export class App {}
