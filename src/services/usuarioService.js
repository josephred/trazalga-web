import axios from 'axios';
import { coreUrl } from '../api/axiosConfig';

let cachedUsuarios = null;
let cachedPlantas = null;

/**
 * Obtiene la lista de usuarios desde el backend de core con caché en memoria.
 * coreUrl() apunta directo al backend en producción (VITE_API_URL) o al proxy
 * '/v-core' en local.
 */
export const getUsuarios = async (forceRefresh = false) => {
  if (cachedUsuarios && !forceRefresh) {
    return cachedUsuarios;
  }
  const response = await axios.get(coreUrl('/usuario'));
  cachedUsuarios = response.data;
  return cachedUsuarios;
};

/**
 * Obtiene la lista de plantas desde el backend de core con caché en memoria.
 */
export const getPlantas = async (forceRefresh = false) => {
  if (cachedPlantas && !forceRefresh) {
    return cachedPlantas;
  }
  try {
    const response = await axios.get(coreUrl('/planta'));
    cachedPlantas = response.data;
    return cachedPlantas;
  } catch (err) {
    console.error('Error al obtener plantas:', err);
    return [];
  }
};

