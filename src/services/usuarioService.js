import axios from 'axios';
import { coreUrl } from '../api/axiosConfig';

/**
 * Obtiene la lista de usuarios desde el backend de core.
 * coreUrl() apunta directo al backend en producción (VITE_API_URL) o al proxy
 * '/v-core' en local.
 */
export const getUsuarios = async () => {
  const response = await axios.get(coreUrl('/usuario'));
  return response.data;
};
