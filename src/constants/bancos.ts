export interface Banco {
  id: string;
  nombre: string;
}

export const BANCOS_COLOMBIA: Banco[] = [
  { id: 'bancolombia',  nombre: 'Bancolombia' },
  { id: 'nequi',        nombre: 'Nequi' },
  { id: 'davivienda',   nombre: 'Davivienda' },
  { id: 'daviplata',    nombre: 'Daviplata' },
  { id: 'bogota',       nombre: 'Banco de Bogotá' },
  { id: 'bbva',         nombre: 'BBVA Colombia' },
  { id: 'occidente',    nombre: 'Banco de Occidente' },
  { id: 'av_villas',    nombre: 'Banco AV Villas' },
  { id: 'popular',      nombre: 'Banco Popular' },
  { id: 'caja_social',  nombre: 'Banco Caja Social' },
  { id: 'itau',         nombre: 'Itaú' },
  { id: 'scotiabank',   nombre: 'Scotiabank Colpatria' },
  { id: 'agrario',      nombre: 'Banco Agrario' },
  { id: 'nubank',       nombre: 'Nubank' },
  { id: 'lulo_bank',    nombre: 'Lulo Bank' },
  { id: 'rappipay',     nombre: 'RappiPay' },
  { id: 'otro',         nombre: 'Otro' },
];