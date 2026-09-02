export interface PaisResponse {
  id: number;
  nombre: string;
}

export interface CiudadResponse {
  id: number;
  nombre: string;
  idPais: number;
  nombrePais: string;
}
