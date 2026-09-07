import api from '../api/axiosConfig';

/**
 * Obtiene el listado de reportes aplicando filtros de fecha y tipo.
 */
export const getReportes = async (filters) => {
  const { fechaInicio, fechaFin, tipoReporte } = filters;
  const response = await api.get('/reportes', {
    params: {
      fechaInicio,
      fechaFin,
      tipoReporte
    }
  });
  return response.data;
};

/**
 * Obtiene el resumen global de reportes para el dashboard dentro de un rango de fechas.
 */
export const getResumenGlobal = async (dateRange) => {
  const params = {};
  if (dateRange) {
    if (Array.isArray(dateRange)) {
      if (dateRange[0]) {
        params.startDate = typeof dateRange[0].format === 'function' ? dateRange[0].format('YYYY-MM-DD') : dateRange[0];
      }
      if (dateRange[1]) {
        params.endDate = typeof dateRange[1].format === 'function' ? dateRange[1].format('YYYY-MM-DD') : dateRange[1];
      }
    } else {
      if (dateRange.startDate) {
        params.startDate = dateRange.startDate;
      }
      if (dateRange.endDate) {
        params.endDate = dateRange.endDate;
      }
    }
  }
  
  const response = await api.get('/reportes/resumen-global', { params });
  return response.data;
};

const formatParams = (filters) => {
  const params = {};
  if (!filters) return params;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.especieId) params.especieId = filters.especieId;
  if (filters.comunaId) params.comunaId = filters.comunaId;
  if (filters.regionId) params.regionId = filters.regionId;
  if (filters.perfil) params.perfil = filters.perfil;
  if (filters.umbral) params.umbral = filters.umbral;
  if (filters.semaforo) params.semaforo = filters.semaforo;
  if (filters.fecha) params.fecha = filters.fecha;
  return params;
};

export const getDesembarqueFisico = async (filters) => {
  const response = await api.get('/reportes/desembarque-fisico', { params: formatParams(filters) });
  return response.data;
};

export const getDesembarqueFisicoDetalle = async (filters) => {
  const response = await api.get('/reportes/desembarque-fisico-detalle', { params: formatParams(filters) });
  return response.data;
};

export const getCapturaCorregida = async (filters) => {
  const response = await api.get('/reportes/captura-corregida', { params: formatParams(filters) });
  return response.data;
};

export const getLimiteExtraccionDiario = async (fecha) => {
  const response = await api.get('/reportes/limite-extraccion-diario', { params: fecha ? { fecha } : {} });
  return response.data;
};

export const getRetencionBodega = async () => {
  const response = await api.get('/reportes/retencion-bodega');
  return response.data;
};

export const getTrazabilidadLote = async (filters) => {
  const response = await api.get('/reportes/trazabilidad-lote', { params: formatParams(filters) });
  return response.data;
};

export const getTrazabilidadLoteDetalle = async (filters) => {
  const response = await api.get('/reportes/trazabilidad-lote-detalle', { params: formatParams(filters) });
  return response.data;
};

