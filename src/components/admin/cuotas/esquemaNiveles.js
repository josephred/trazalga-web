/**
 * esquemaNiveles.js
 * Definición centralizada de niveles de agregación territorial y personal para cuotas (TM.3).
 */

export const NIVELES_CUOTA = [
  {
    id: 'COMUNA',
    etiqueta: 'Comunal',
    descripcion: 'Aplica a una o varias comunas específicas de una región.',
    requiereComunas: true,
    requiereProvincia: false,
    requiereRegion: true,
    permitePlantilla: false,
    permiteUsuario: false,
    color: 'primary',
  },
  {
    id: 'PROVINCIA',
    etiqueta: 'Provincial',
    descripcion: 'Aplica a toda una provincia (orden Comunal ≤ Provincial ≤ Regional).',
    requiereComunas: false,
    requiereProvincia: true,
    requiereRegion: false,
    permitePlantilla: false,
    permiteUsuario: false,
    color: 'secondary',
  },
  {
    id: 'REGION',
    etiqueta: 'Regional',
    descripcion: 'Aplica a una región completa sin desglose comunal ni provincial.',
    requiereComunas: false,
    requiereProvincia: false,
    requiereRegion: true,
    permitePlantilla: false,
    permiteUsuario: false,
    color: 'info',
  },
  {
    id: 'INDIVIDUAL',
    etiqueta: 'Individual',
    descripcion: 'Asignación personal específica o plantilla de cuota por persona.',
    requiereComunas: false,
    requiereProvincia: false,
    requiereRegion: false,
    permitePlantilla: true,
    permiteUsuario: true,
    color: 'warning',
  },
];

/**
 * Valida la consistencia de un formulario de cuota según su nivel de agregación.
 * Retorna null si es válido, o un mensaje de error explicativo.
 */
export function validarFormularioPorNivel(form) {
  const nivel = form.nivelAgregacion || 'COMUNA';

  const lim = parseFloat(form.limiteKg);
  if (isNaN(lim) || lim <= 0) {
    return 'El límite debe ser un número positivo en kilogramos.';
  }

  if (!form.especie) {
    return 'La especie objetivo es obligatoria.';
  }

  if (!form.extraccionTipo) {
    return 'El método de extracción es obligatorio.';
  }

  if (!form.fechaInicio || !form.fechaFin) {
    return 'Las fechas de inicio y fin de vigencia son obligatorias.';
  }

  if (form.fechaFin < form.fechaInicio) {
    return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
  }

  // Validación de acotamiento mensual
  const iniY = form.fechaInicio.slice(0, 4);
  const iniM = form.fechaInicio.slice(5, 7);
  const finY = form.fechaFin.slice(0, 4);
  const finM = form.fechaFin.slice(5, 7);
  if (iniY !== finY || iniM !== finM) {
    return 'La vigencia mensual debe quedar acotada dentro del mismo mes calendario.';
  }

  if (form.metrica === 'DESEMBARQUE' && !form.resolucion?.trim()) {
    return 'Sernapesca definió que las cuotas se descuentan obligatoriamente con captura biológica corregida. La métrica DESEMBARQUE sólo se permite si la resolución técnica de Subpesca lo especifica expresamente (campo resolución obligatorio).';
  }

  // Validaciones territoriales / personales específicas
  if (nivel === 'COMUNA') {
    if (!form.comunas || form.comunas.length === 0) {
      return 'Debe seleccionar al menos una comuna para el nivel Comunal.';
    }
  } else if (nivel === 'PROVINCIA') {
    if (!form.provincia) {
      return 'Debe seleccionar una provincia para el nivel Provincial.';
    }
  } else if (nivel === 'REGION') {
    if (!form.region) {
      return 'Debe seleccionar una región para el nivel Regional.';
    }
  } else if (nivel === 'INDIVIDUAL') {
    if (form.esPlantilla) {
      if (!form.provincia && (!form.comunas || form.comunas.length === 0) && !form.region) {
        return 'Para una plantilla individual debe seleccionar al menos una provincia, región o comuna de referencia territorial.';
      }
    } else {
      if (!form.usuario) {
        return 'Debe seleccionar el usuario (persona específica) para la cuota individual.';
      }
    }
  }

  return null;
}

/**
 * Transforma los datos del formulario React al payload JSON esperado por el backend.
 */
export function construirPayloadCuota(form) {
  const nivel = form.nivelAgregacion || 'COMUNA';
  const lim = parseFloat(form.limiteKg);

  const payload = {
    ambito: form.ambito || 'AREA_LIBRE',
    nivelAgregacion: nivel,
    especie: { id: form.especie.id },
    extraccionTipo: { id: form.extraccionTipo.id },
    periodo: form.periodo || 'MENSUAL',
    fechaInicio: form.fechaInicio.slice(0, 10),
    fechaFin: form.fechaFin.slice(0, 10),
    limiteKg: lim,
    metrica: form.metrica || 'CAPTURA',
    humedadEstado: form.humedadEstado ? { id: form.humedadEstado.id } : null,
    modoAccion: form.modoAccion || 'SOLO_ALERTA',
    resolucion: form.resolucion?.trim() || null,
    estado: form.estado || 'ABIERTA',
    activo: Boolean(form.activo),
    esPlantilla: Boolean(form.esPlantilla),
  };

  // Asignaciones territoriales o personales según nivel
  if (nivel === 'COMUNA') {
    payload.comunas = (form.comunas || []).map((c) => ({ id: c.id }));
    payload.comuna = form.comunas && form.comunas.length > 0 ? { id: form.comunas[0].id } : null;
    payload.region = form.region ? { id: form.region.id } : null;
    payload.provincia = null;
    payload.usuario = null;
    payload.esPlantilla = false;
  } else if (nivel === 'PROVINCIA') {
    payload.provincia = form.provincia ? { id: form.provincia.id } : null;
    payload.region = form.provincia?.region ? { id: form.provincia.region.id } : (form.region ? { id: form.region.id } : null);
    payload.comunas = [];
    payload.comuna = null;
    payload.usuario = null;
    payload.esPlantilla = false;
  } else if (nivel === 'REGION') {
    payload.region = form.region ? { id: form.region.id } : null;
    payload.provincia = null;
    payload.comunas = [];
    payload.comuna = null;
    payload.usuario = null;
    payload.esPlantilla = false;
  } else if (nivel === 'INDIVIDUAL') {
    if (form.esPlantilla) {
      payload.esPlantilla = true;
      payload.usuario = null;
      payload.provincia = form.provincia ? { id: form.provincia.id } : null;
      payload.region = form.region ? { id: form.region.id } : (form.provincia?.region ? { id: form.provincia.region.id } : null);
      payload.comunas = (form.comunas || []).map((c) => ({ id: c.id }));
      payload.comuna = form.comunas && form.comunas.length > 0 ? { id: form.comunas[0].id } : null;
    } else {
      payload.esPlantilla = false;
      payload.usuario = form.usuario ? { id: form.usuario.id } : null;
      payload.provincia = form.provincia ? { id: form.provincia.id } : null;
      payload.region = form.region ? { id: form.region.id } : null;
      payload.comunas = [];
      payload.comuna = null;
    }
  }

  return payload;
}
