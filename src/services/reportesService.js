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
  if (dateRange && dateRange[0]) {
    // Si dateRange[0] es un objeto dayjs/moment/Date, podemos usar format si existe, o pasarlo directo
    params.startDate = typeof dateRange[0].format === 'function' 
      ? dateRange[0].format('YYYY-MM-DD') 
      : dateRange[0];
  }
  if (dateRange && dateRange[1]) {
    params.endDate = typeof dateRange[1].format === 'function' 
      ? dateRange[1].format('YYYY-MM-DD') 
      : dateRange[1];
  }
  
  const response = await api.get('/reportes/resumen-global', { params });
  return response.data;
};
