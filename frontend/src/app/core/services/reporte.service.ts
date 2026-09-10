import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BeneficiarioReporte, ReporteFiltro } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  constructor(private api: ApiService) {}

  listarBeneficiarios(filtro: ReporteFiltro): Observable<BeneficiarioReporte[]> {
    const params = new URLSearchParams();
    Object.entries(filtro).forEach(([clave, valor]) => {
      if (valor !== null && valor !== undefined && valor !== '') {
        params.set(clave, String(valor));
      }
    });
    const query = params.toString();
    return this.api.get<BeneficiarioReporte[]>(`/reportes/beneficiarios${query ? '?' + query : ''}`);
  }
}
