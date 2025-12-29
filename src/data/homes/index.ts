/**
 * Índice de casas/propiedades disponibles
 * Agrega aquí las nuevas casas que quieras que aparezcan en el selector
 */

import centroMedicoSanRafael from './centro-medico-san-rafael.json';
import hospitalCentral from './hospital-central.json';
import clinicaPrivada from './clinica-privada.json';
import centroSaludComunitario from './centro-salud-comunitario.json';
import residenciaGeriatrica from './residencia-geriatrica.json';

export interface HomeFile {
  id: string;
  name: string;
  data: any;
}

export const availableHomes: HomeFile[] = [
  {
    id: 'centro-medico-san-rafael',
    name: 'Centro Médico San Rafael',
    data: centroMedicoSanRafael
  },
  {
    id: 'hospital-central',
    name: 'Hospital Central',
    data: hospitalCentral
  },
  {
    id: 'clinica-privada',
    name: 'Clínica Privada El Ángel',
    data: clinicaPrivada
  },
  {
    id: 'centro-salud-comunitario',
    name: 'Centro de Salud Comunitario',
    data: centroSaludComunitario
  },
  {
    id: 'residencia-geriatrica',
    name: 'Residencia Geriátrica San José',
    data: residenciaGeriatrica
  }
];

