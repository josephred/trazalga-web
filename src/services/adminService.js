import api from '../api/axiosConfig';

/**
 * Servicio para consultar el estado de ejecución y observabilidad de tareas programadas (TA.6).
 */
export const getTareasProgramadas = async () => {
  const response = await api.get('/admin/tareas-programadas');
  return response.data;
};

export const getHistorialTareasProgramadas = async () => {
  const response = await api.get('/admin/tareas-programadas/historial');
  return response.data;
};
