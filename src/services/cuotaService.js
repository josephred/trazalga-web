import api from '../api/axiosConfig';

/**
 * Servicio para gestión y auditoría de cuotas de extracción.
 */
export const cuotaService = {
  /**
   * Recalcula hallazgos de una cuota de extracción (TC.10).
   * Solo para perfil ADMINISTRADOR (acción EJECUTAR_RECALCULO).
   * 
   * @param {number|string} cuotaId 
   * @param {string} [desde] Fecha inicio YYYY-MM-DD (opcional)
   * @param {string} [hasta] Fecha fin YYYY-MM-DD (opcional)
   * @returns {Promise<object>} ResumenRecalculoCuotaDTO
   */
  async recalcularHallazgos(cuotaId, desde, hasta) {
    const params = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    const response = await api.post(`/api/cuotas/${cuotaId}/recalcular-hallazgos`, null, { params });
    return response.data;
  },

  /**
   * Obtiene el historial de eventos de una cuota (TC.2).
   * 
   * @param {number|string} cuotaId 
   * @returns {Promise<Array>}
   */
  async getEventos(cuotaId) {
    const response = await api.get(`/api/cuotas/${cuotaId}/eventos`);
    return response.data;
  },

  /**
   * Cierra administrativamente una cuota.
   * 
   * @param {number|string} cuotaId 
   * @param {string} [observacion] 
   * @returns {Promise<object>}
   */
  async cerrarCuota(cuotaId, observacion) {
    const response = await api.put(`/api/cuotas/${cuotaId}/cerrar`, { observacion });
    return response.data;
  },

  /**
   * Reabre una cuota cerrada con motivo obligatorio.
   * 
   * @param {number|string} cuotaId 
   * @param {string} motivo 
   * @returns {Promise<object>}
   */
  async reabrirCuota(cuotaId, motivo) {
    const response = await api.put(`/api/cuotas/${cuotaId}/reabrir`, { motivo });
    return response.data;
  }
};

export default cuotaService;
