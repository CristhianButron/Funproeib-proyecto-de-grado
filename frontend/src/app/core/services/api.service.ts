import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // En desarrollo apunta a localhost:8080; en el build de producción
  // ("ng build") se reemplaza por environment.production.ts, que debe
  // apuntar a la URL real del backend ya desplegado.
  readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`);
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}${path}`, body);
  }

  patch<T>(path: string, params?: Record<string, string>): Observable<T> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.http.patch<T>(`${this.base}${path}${query}`, {});
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`);
  }
}
