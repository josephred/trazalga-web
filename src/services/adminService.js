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

/**
 * Formatos de producto (NF.1 / NF.3).
 */
export const getProductosAdmin = async () => {
  const response = await api.get('/admin/productos');
  return response.data;
};

export const crearProductoAdmin = async (payload) => {
  const response = await api.post('/admin/productos', payload);
  return response.data;
};

export const actualizarProductoAdmin = async (id, payload) => {
  const response = await api.put(`/admin/productos/${id}`, payload);
  return response.data;
};

export const cambiarEstadoProductoAdmin = async (id, activo) => {
  const response = await api.put(`/admin/productos/${id}/activo`, { activo });
  return response.data;
};

export const importarCatalogoProductos = async (archivo, aplicar = false) => {
  const formData = new FormData();
  formData.append('file', archivo);
  const response = await api.post('/admin/productos/importar', formData, {
    params: { aplicar },
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

