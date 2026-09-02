import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CiudadResponse, PaisResponse } from '../models/ubicacion.model';

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  constructor(private api: ApiService) {}

  listarPaises(): Observable<PaisResponse[]> {
    return this.api.get<PaisResponse[]>('/ubicaciones/paises');
  }

  listarCiudades(idPais: number): Observable<CiudadResponse[]> {
    return this.api.get<CiudadResponse[]>(`/ubicaciones/paises/${idPais}/ciudades`);
  }
}
