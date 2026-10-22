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

/**
 * Servicio para consultar el resumen y distribución de versiones de la app móvil (TP.1).
 */
export const getVersionesApp = async (perfil = '') => {
  const params = perfil ? { perfil } : {};
  const response = await api.get('/admin/versiones-app', { params });
  return response.data;
};

/**
 * Servicio para procesar o aplicar importación de coordenadas GPS vía CSV (TG.1).
 */
export const importarCoordenadas = async (archivo, aplicar = false, forzar = false) => {
  const formData = new FormData();
  formData.append('file', archivo);
  const response = await api.post('/admin/coordenadas/importar', formData, {
    params: { aplicar, forzar },
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * Obtiene métricas de cobertura de georreferenciación nacional y por región (TG.1).
 */
export const getCoberturaCoordenadas = async () => {
  const response = await api.get('/admin/coordenadas/cobertura');
  return response.data;
};

