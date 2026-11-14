// Pure helpers for dual georeferencing and direct origin-to-plant chain traces (QM.2 / D41).

export const EVALUACION_COLORES = {
  COHERENTE: { color: '#16a34a', label: 'Coherente (≤ umbral)' },
  PRECISION_BAJA: { color: '#d97706', label: 'Precisión GPS baja (> 500 m)' },
  LEJANA: { color: '#dc2626', label: 'Lejana (> umbral)' },
  SIN_REFERENCIA: { color: '#64748b', label: 'Sin coordenadas de origen' },
  SIN_GPS: { color: '#64748b', label: 'Sin GPS' },
};

export const FUENTE_LABELS = {
  VARADERO_DECLARADO: 'Varadero declarado (planilla Sernapesca)',
  CALETA: 'Caleta declarada',
  VARADERO_CALETA: 'Varadero asociado a caleta',
  AMERB: 'Área de manejo (AMERB)',
  SERNAPESCA_2026_10: 'Planilla Sernapesca',
  MANUAL: 'Coordenada manual',
  SEMILLA: 'Semilla inicial',
  MAESTRO_PLANTA: 'Catastro oficial de plantas',
};

export function esNumeroValido(val) {
  return (
    val !== null &&
    val !== undefined &&
    String(val).trim() !== '' &&
    Number.isFinite(Number(val))
  );
}

export function formatearKm(val) {
  if (!esNumeroValido(val)) return null;
  return `${Number(val).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

export function formatearFechaHora(ts) {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(ts);
  }
}

export function esEslabonOrigen(eslabon) {
  const s = String(eslabon || '').toUpperCase();
  return (
    s.includes('ORIGEN') ||
    s.includes('RECOLECTOR') ||
    s.includes('ARMADOR') ||
    s.includes('AREA') ||
    s.includes('ÁREA') ||
    s.includes('AMERB')
  );
}

export function esEslabonPlantaAbastecimiento(eslabon) {
  const s = String(eslabon || '').toUpperCase();
  return s === 'PLANTA_ABASTECIMIENTO' || s === 'PLANTA';
}

export function esEslabonPlanta(eslabon) {
  return String(eslabon || '').toUpperCase().includes('PLANTA');
}

export function calcularDistanciaHaversineKm(coordA, coordB) {
  if (!Array.isArray(coordA) || !Array.isArray(coordB)) return null;
  const [lat1, lon1] = coordA;
  const [lat2, lon2] = coordB;
  if (!esNumeroValido(lat1) || !esNumeroValido(lon1) || !esNumeroValido(lat2) || !esNumeroValido(lon2)) {
    return null;
  }
  const toRad = (deg) => (Number(deg) * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function elegirCoordenadaEndpoint(item) {
  const geo = item?.geo || {};
  const ref = geo.referencia;
  if (ref && esNumeroValido(ref.lat) && esNumeroValido(ref.lon)) {
    return {
      coords: [Number(ref.lat), Number(ref.lon)],
      tipoFuente: 'REFERENCIA',
      labelFuente: ref.nombre || 'Referencia oficial',
    };
  }
  const gps = geo.gps;
  if (gps && esNumeroValido(gps.lat) && esNumeroValido(gps.lon)) {
    return {
      coords: [Number(gps.lat), Number(gps.lon)],
      tipoFuente: 'GPS',
      labelFuente: 'GPS declarado',
    };
  }
  return null;
}

/**
 * Normaliza las distintas fuentes (puntos directos, nodos del modal o secciones de la ficha)
 * al contrato unificado `{ id, eslabon, folio, actor, rut, geo, rawNode }`,
 * sin inventar jamás coordenadas faltantes ni usar centroides comunales.
 */
export function normalizarEntradas({ puntos, nodos, origenes, comercializadores, planta }) {
  if (Array.isArray(puntos) && puntos.length > 0) {
    return puntos.map((p, idx) => ({
      id: p.id || `pto-${idx}`,
      eslabon: p.eslabon || p.tipo || 'ORIGEN',
      folio: p.folio || '-',
      actor: p.actor || p.nombre || 'Declarante',
      rut: p.rut || null,
      geo: p.geo || null,
      rawNode: p.rawNode || p,
    }));
  }

  if (Array.isArray(nodos) && nodos.length > 0) {
    return nodos.map((n, idx) => {
      const raw = n.data?.rawNode || n;
      const tieneGpsDirecto = esNumeroValido(raw.latitud) && esNumeroValido(raw.longitud);
      const geo =
        raw.geo ||
        (tieneGpsDirecto
          ? {
              gps: {
                lat: Number(raw.latitud),
                lon: Number(raw.longitud),
                precisionM: raw.precisionMetros ?? null,
                capturadoEn: raw.capturaTimestamp ?? null,
                offline: Boolean(raw.enviadoOffline),
              },
              referencia: null,
              distanciaKm: null,
              evaluacion: esEslabonOrigen(raw.tipoNodo) ? 'SIN_REFERENCIA' : 'COHERENTE',
              umbralKm: 30,
            }
          : {
              gps: null,
              referencia: null,
              distanciaKm: null,
              evaluacion: 'SIN_GPS',
              umbralKm: 30,
            });
      return {
        id: raw.idUnico || raw.id || `nodo-${idx}`,
        eslabon: raw.tipoNodo || 'ORIGEN',
        folio: raw.folio || '-',
        actor: raw.nombreActor || 'Declarante',
        rut: raw.rutActor || null,
        geo,
        rawNode: raw,
      };
    });
  }

  const resultado = [];
  (origenes || []).forEach((o, idx) => {
    const tieneGpsFallback = esNumeroValido(o.latitud) && esNumeroValido(o.longitud);
    const geo =
      o.geo ||
      (tieneGpsFallback
        ? {
            gps: {
              lat: Number(o.latitud),
              lon: Number(o.longitud),
              precisionM: null,
              capturadoEn: null,
              offline: false,
            },
            referencia: null,
            distanciaKm: null,
            evaluacion: 'SIN_REFERENCIA',
            umbralKm: 30,
          }
        : {
            gps: null,
            referencia: null,
            distanciaKm: null,
            evaluacion: 'SIN_GPS',
            umbralKm: 30,
          });
    resultado.push({
      id: `orig-${o.tipo || 'ORIGEN'}-${o.id || idx}`,
      eslabon: o.tipo || 'ORIGEN',
      folio: o.folioOrigen || o.folioDesembarque || o.folio || '-',
      actor: o.nombre || 'Recolector / Origen',
      rut: o.rut || null,
      geo,
      rawNode: o,
    });
  });

  (comercializadores || []).forEach((c, idx) => {
    if (c.geo && (c.geo.gps || c.geo.referencia)) {
      resultado.push({
        id: `com-${c.id || idx}`,
        eslabon: 'COMERCIALIZADOR',
        folio: c.folio || '-',
        actor: c.nombre || 'Comercializador',
        rut: c.rut || null,
        geo: c.geo,
        rawNode: c,
      });
    }
  });

  if (planta && planta.recepcionada) {
    resultado.push({
      id: `pla-${planta.id || 0}`,
      eslabon: 'PLANTA_ABASTECIMIENTO',
      folio: planta.folio || planta.folioDeclaracionAPla || planta.folioOrigen || '-',
      actor: planta.nombrePlanta || 'Planta de Abastecimiento',
      rut: planta.rutPlanta || null,
      geo: planta.geo || {
        gps: null,
        referencia: null,
        distanciaKm: null,
        evaluacion: 'SIN_GPS',
        umbralKm: 30,
      },
      rawNode: planta,
    });
  }

  return resultado;
}

/**
 * Construye todas las capas geográficas para MapaDobleGeorreferencia:
 * - origenesAgrupados (puntos oficiales de origen)
 * - plantasReferencia (puntos oficiales del catastro de planta)
 * - marcadoresGps (puntos declarados por GPS)
 * - lineasPares (punteadas referencia–GPS sin alterar comportamiento previo)
 * - lineasTrazaOrigenDestino (continuas directas origen → planta, bypass comercializador)
 * - avisosTraza (avisos explícitos cuando un extremo carece de coordenadas o no existe)
 */
export function construirCapasMapaCadena(items, { plantaNoRecepcionada = false } = {}) {
  const gruposOrigenMap = new Map();
  const gruposPlantaMap = new Map();
  const gpsList = [];
  const lines = [];
  const coords = [];
  const sinGps = [];
  const sinRef = [];
  const origenesItems = [];
  const plantasAbastecimientoItems = [];
  const otrasPlantasItems = [];

  (items || []).forEach((item) => {
    const geo = item.geo || {};
    const ref = geo.referencia;
    const gps = geo.gps;
    const evaluacion = geo.evaluacion || 'SIN_GPS';
    const esOrigen = esEslabonOrigen(item.eslabon);
    const esPlantaAbast = esEslabonPlantaAbastecimiento(item.eslabon);
    const esOtraPlanta = !esPlantaAbast && esEslabonPlanta(item.eslabon);

    if (esOrigen) {
      origenesItems.push(item);
    } else if (esPlantaAbast) {
      plantasAbastecimientoItems.push(item);
    } else if (esOtraPlanta) {
      otrasPlantasItems.push(item);
    }

    const tieneRef = ref && esNumeroValido(ref.lat) && esNumeroValido(ref.lon);
    const tieneGps = gps && esNumeroValido(gps.lat) && esNumeroValido(gps.lon);

    if (!tieneGps) {
      sinGps.push(item);
    }
    if (esOrigen && !tieneRef) {
      sinRef.push(item);
    }

    if (tieneRef) {
      const lat = Number(ref.lat);
      const lon = Number(ref.lon);
      const key = `${lat.toFixed(5)}_${lon.toFixed(5)}`;
      coords.push([lat, lon]);

      if (esOrigen) {
        if (!gruposOrigenMap.has(key)) {
          gruposOrigenMap.set(key, {
            key,
            coords: [lat, lon],
            nombre: ref.nombre || 'Origen del recurso',
            tipo: ref.tipo || 'ORIGEN',
            fuente: ref.fuente || 'SERNAPESCA_2026_10',
            declaraciones: [],
          });
        }
        gruposOrigenMap.get(key).declaraciones.push(item);
      } else {
        if (!gruposPlantaMap.has(key)) {
          gruposPlantaMap.set(key, {
            key,
            coords: [lat, lon],
            nombre: ref.nombre || item.actor || 'Planta oficial',
            tipo: ref.tipo || 'PLANTA',
            fuente: ref.fuente || 'MAESTRO_PLANTA',
            declaraciones: [],
          });
        }
        gruposPlantaMap.get(key).declaraciones.push(item);
      }
    }

    if (tieneGps) {
      const lat = Number(gps.lat);
      const lon = Number(gps.lon);
      coords.push([lat, lon]);
      gpsList.push({
        id: `gps-${item.id}`,
        coords: [lat, lon],
        item,
        gps,
        ref: tieneRef ? ref : null,
        evaluacion,
        distanciaKm: geo.distanciaKm,
        umbralKm: geo.umbralKm ?? 30,
      });
    }

    if (tieneRef && tieneGps) {
      const colorLinea = EVALUACION_COLORES[evaluacion]?.color || '#16a34a';
      lines.push({
        id: `par-${item.id}`,
        coords: [
          [Number(ref.lat), Number(ref.lon)],
          [Number(gps.lat), Number(gps.lon)],
        ],
        color: colorLinea,
        evaluacion,
        distanciaTexto: formatearKm(geo.distanciaKm),
        folio: item.folio,
        actor: item.actor,
      });
    }
  });

  const plantasDestino =
    plantasAbastecimientoItems.length > 0 ? plantasAbastecimientoItems : otrasPlantasItems;
  const lineasTrazaOrigenDestino = [];
  const avisosTraza = [];

  if (origenesItems.length === 0 && plantasDestino.length > 0) {
    avisosTraza.push('Sin traza origen → destino: sin eslabón de origen en la cadena');
  } else if (origenesItems.length > 0 && plantasDestino.length === 0) {
    avisosTraza.push(
      plantaNoRecepcionada
        ? 'Sin traza origen → destino: cadena aún no recepcionada en planta'
        : 'Sin traza origen → destino: sin planta de destino en la cadena'
    );
  } else if (origenesItems.length > 0 && plantasDestino.length > 0) {
    const destSinCoords = [];
    const origSinCoords = new Set();

    plantasDestino.forEach((plantaItem) => {
      const destEndpoint = elegirCoordenadaEndpoint(plantaItem);
      if (!destEndpoint) {
        destSinCoords.push(`#${plantaItem.folio}`);
        return;
      }

      origenesItems.forEach((origItem) => {
        const origEndpoint = elegirCoordenadaEndpoint(origItem);
        if (!origEndpoint) {
          origSinCoords.add(`#${origItem.folio}`);
          return;
        }
        const distanciaKm = calcularDistanciaHaversineKm(origEndpoint.coords, destEndpoint.coords);
        lineasTrazaOrigenDestino.push({
          id: `traza-${origItem.id}-a-${plantaItem.id}`,
          coords: [origEndpoint.coords, destEndpoint.coords],
          origen: {
            id: origItem.id,
            folio: origItem.folio,
            actor: origItem.actor,
            eslabon: origItem.eslabon,
            tipoFuente: origEndpoint.tipoFuente,
            label: origEndpoint.labelFuente,
          },
          destino: {
            id: plantaItem.id,
            folio: plantaItem.folio,
            actor: plantaItem.actor,
            eslabon: plantaItem.eslabon,
            tipoFuente: destEndpoint.tipoFuente,
            label: destEndpoint.labelFuente,
          },
          distanciaKm,
          distanciaTexto: formatearKm(distanciaKm),
        });
      });
    });

    if (destSinCoords.length > 0) {
      avisosTraza.push(
        `Sin traza origen → destino: planta ${destSinCoords.join(', ')} sin coordenadas oficiales ni GPS`
      );
    }
    if (origSinCoords.size > 0) {
      const lista = Array.from(origSinCoords);
      const preview = `${lista.slice(0, 3).join(', ')}${lista.length > 3 ? '…' : ''}`;
      avisosTraza.push(
        `Sin traza para ${lista.length === 1 ? 'origen' : `${lista.length} orígenes`} (${preview}): sin coordenadas de origen ni GPS`
      );
    }
  }

  return {
    origenesAgrupados: Array.from(gruposOrigenMap.values()),
    plantasReferencia: Array.from(gruposPlantaMap.values()),
    marcadoresGps: gpsList,
    lineasPares: lines,
    lineasTrazaOrigenDestino,
    avisosTraza,
    todasLasCoordenadas: coords,
    sinGpsItems: sinGps,
    sinReferenciaItems: sinRef,
  };
}
