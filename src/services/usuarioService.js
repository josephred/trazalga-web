import axios from 'axios';

/**
 * Obtiene la lista de usuarios desde el backend de core.
 */
export const getUsuarios = async () => {
  const response = await axios.get('/v-core/usuario');
  return response.data;
};
