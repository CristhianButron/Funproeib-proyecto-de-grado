import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { InscritoReporte, ReporteFiltro } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  constructor(private api: ApiService) {}

  listarInscritos(filtro: ReporteFiltro): Observable<InscritoReporte[]> {
    const params = new URLSearchParams();
    Object.entries(filtro).forEach(([clave, valor]) => {
      if (valor !== null && valor !== undefined && valor !== '') {
        params.set(clave, String(valor));
      }
    });
    const query = params.toString();
    return this.api.get<InscritoReporte[]>(`/reportes/inscritos${query ? '?' + query : ''}`);
  }

  listarPaises(): Observable<string[]> {
    return this.api.get<string[]>('/reportes/paises');
  }

  listarDepartamentos(): Observable<string[]> {
    return this.api.get<string[]>('/reportes/departamentos');
  }
}
