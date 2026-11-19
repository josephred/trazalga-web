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

export function esEslabonComercializador(eslabon) {
  return String(eslabon || '').toUpperCase().includes('COMERCIALIZADOR');
}

export function esCoordenadaChileValida(lat, lon) {
  if (!esNumeroValido(lat) || !esNumeroValido(lon)) return false;
  const nLat = Number(lat);
  const nLon = Number(lon);
  if (nLat === 0 && nLon === 0) return false;
  return nLat >= -56 && nLat <= -17 && nLon >= -76 && nLon <= -66;
}

export function sumarDistanciasSegmentosKm(points = []) {
  if (!Array.isArray(points) || points.length < 2) return null;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = calcularDistanciaHaversineKm(points[i], points[i + 1]);
    if (d === null) return null;
    total += d;
  }
  return total;
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
 * - lineasTrazaOrigenDestino (continuas origen -> [comercializador(es)] -> planta si pasarPorComercializador=true)
 * - comercializadoresSinCoords (folios sin coordenadas para nota de respaldo en leyenda)
 * - avisosTraza (avisos explícitos cuando un extremo carece de coordenadas o no existe)
 */
export function construirCapasMapaCadena(
  items,
  { plantaNoRecepcionada = false, pasarPorComercializador = true } = {}
) {
  const gruposOrigenMap = new Map();
  const gruposPlantaMap = new Map();
  const gpsList = [];
  const lines = [];
  const coords = [];
  const sinGps = [];
  const sinRef = [];
  const origenesItems = [];
  const comercializadoresItems = [];
  const plantasAbastecimientoItems = [];
  const otrasPlantasItems = [];

  (items || []).forEach((item) => {
    const geo = item.geo || {};
    const ref = geo.referencia;
    const gps = geo.gps;
    const evaluacion = geo.evaluacion || 'SIN_GPS';
    const esOrigen = esEslabonOrigen(item.eslabon);
    const esCom = esEslabonComercializador(item.eslabon);
    const esPlantaAbast = esEslabonPlantaAbastecimiento(item.eslabon);
    const esOtraPlanta = !esPlantaAbast && esEslabonPlanta(item.eslabon);

    if (esOrigen) {
      origenesItems.push(item);
    } else if (esCom) {
      comercializadoresItems.push(item);
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
  const comercializadoresSinCoords = [];

  const puntosComercializadores = [];
  if (pasarPorComercializador && comercializadoresItems.length > 0) {
    comercializadoresItems.forEach((cItem) => {
      const ep = elegirCoordenadaEndpoint(cItem);
      if (ep && esCoordenadaChileValida(ep.coords[0], ep.coords[1])) {
        puntosComercializadores.push({ item: cItem, endpoint: ep });
      } else {
        comercializadoresSinCoords.push(`#${cItem.folio}`);
      }
    });
  }

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
        const routeCoords = [
          origEndpoint.coords,
          ...puntosComercializadores.map((c) => c.endpoint.coords),
          destEndpoint.coords,
        ];
        const distanciaKm = sumarDistanciasSegmentosKm(routeCoords);
        lineasTrazaOrigenDestino.push({
          id: `traza-${origItem.id}-a-${plantaItem.id}`,
          coords: routeCoords,
          pasaPorComercializador: puntosComercializadores.length > 0,
          comercializadores: puntosComercializadores.map((c) => ({
            id: c.item.id,
            folio: c.item.folio,
            actor: c.item.actor,
            coords: c.endpoint.coords,
          })),
          conRespaldoDirecto: comercializadoresSinCoords.length > 0,
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
    comercializadoresSinCoords,
    todasLasCoordenadas: coords,
    sinGpsItems: sinGps,
    sinReferenciaItems: sinRef,
  };
}

/**
 * ZM.2 · Construye la polilínea origen -> [comercializador(es)] -> planta para el mapa regional.
 */
export function construirTrazaFlujoRegional(flujo, { pasarPorComercializador = true } = {}) {
  const oLat = Number(flujo?.origen?.latitud);
  const oLon = Number(flujo?.origen?.longitud);
  const pLat = Number(flujo?.planta?.latitud);
  const pLon = Number(flujo?.planta?.longitud);
  if (!esCoordenadaChileValida(oLat, oLon) || !esCoordenadaChileValida(pLat, pLon)) {
    return {
      positions: [],
      pasosIntermedios: [],
      faltaCoordenadaComercializador: false,
      distanciaKmTotal: null,
    };
  }

  const rawList = Array.isArray(flujo?.comercializadores) && flujo.comercializadores.length > 0
    ? flujo.comercializadores
    : (flujo?.comercializadorFolio || esCoordenadaChileValida(flujo?.comercializadorLatitud, flujo?.comercializadorLongitud))
      ? [
        {
          folio: flujo.comercializadorFolio || 'COM',
          latitud: flujo.comercializadorLatitud,
          longitud: flujo.comercializadorLongitud,
          fuente: flujo.comercializadorFuente || 'SIN_COORDENADAS',
        },
      ]
      : [];

  const pasosIntermedios = [];
  let faltaCoord = Boolean(flujo?.algunComercializadorSinCoordenadas);
  if (pasarPorComercializador) {
    rawList.forEach((c) => {
      if (esCoordenadaChileValida(c?.latitud, c?.longitud)) {
        pasosIntermedios.push({
          folio: c.folio || '-',
          coords: [Number(c.latitud), Number(c.longitud)],
          fuente: c.fuente || 'GPS_DECLARACION',
        });
      } else {
        faltaCoord = true;
      }
    });
  }

  const positions = [
    [oLat, oLon],
    ...pasosIntermedios.map((p) => p.coords),
    [pLat, pLon],
  ];
  return {
    positions,
    pasosIntermedios,
    faltaCoordenadaComercializador: pasarPorComercializador && faltaCoord,
    distanciaKmTotal: sumarDistanciasSegmentosKm(positions),
  };
}

/**
 * QM.3 · Escala el grosor visual (2.5 a 9 px) de una línea origen -> planta
 * según los kilos desembarcados respecto al máximo del período.
 */
export function ponderarGrosorFlujo(desembarqueKg, maxDesembarqueKg) {
  const kg = Number(desembarqueKg);
  const max = Number(maxDesembarqueKg);
  if (!Number.isFinite(kg) || kg <= 0 || !Number.isFinite(max) || max <= 0) {
    return 2.5;
  }
  const ratio = Math.min(1, Math.max(0, kg / max));
  const grosor = 2.5 + 6.5 * Math.sqrt(ratio);
  return Math.round(grosor * 10) / 10;
}

/**
 * QE.1 / QE.2 · Formatea coordenadas WGS84 (EPSG:4326) siempre con separador decimal punto.
 */
export function formatearCoordenadaWgs84(valor, decimales = 6) {
  if (!esNumeroValido(valor)) return '';
  return Number(valor).toFixed(decimales);
}

export const HEADERS_CSV_FLUJOS = [
  'FOLIO_ORI',
  'TIPO_ORI',
  'FECHA_ORI',
  'ESPECIE',
  'DESEMB_KG',
  'CAPT_KG',
  'NOM_ORI',
  'LAT_ORI',
  'LON_ORI',
  'FTE_ORI',
  'FOLIO_COM',
  'LAT_COM',
  'LON_COM',
  'FTE_COM',
  'NOM_PLA',
  'COD_PLA',
  'COM_PLA',
  'LAT_PLA',
  'LON_PLA',
  'FTE_PLA',
  'FOLIO_REC',
  'FECHA_REC',
  'ROMANA_KG',
  'REF_ORI',
];

function resolverRefOriCsv(d) {
  if (d?.origenReferenciaFuente) {
    return String(d.origenReferenciaFuente).trim().toUpperCase().slice(0, 10);
  }
  const fte = String(d?.origenFuente || '').trim().toUpperCase();
  if (fte === 'GPS') return 'GPS';
  const det = String(d?.origenFuenteDetalle || '').trim().toUpperCase();
  if (det.includes('VARADERO')) return 'VARADERO';
  if (det === 'CALETA') return 'CALETA';
  if (det === 'AMERB') return 'AMERB';
  if (det.includes('GPS')) return 'GPS';
  return 'SIN_COORD';
}

function formatearFechaIsoCsv(valor) {
  if (!valor) return '';
  const s = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

/**
 * QE.1 / ZE.2 · Construye encabezados (<= 10 caracteres ASCII para compatibilidad SIG/shapefile)
 * y filas (una por declaración de origen) para exportarCsv con separador decimal punto WGS84.
 */
export function construirFilasCsvFlujosOrigenDestino(declaraciones = []) {
  const lista = Array.isArray(declaraciones) ? declaraciones : [];
  const rows = lista.map((d) => [
    d?.origenFolio ?? '',
    d?.origenTipo ?? '',
    formatearFechaIsoCsv(d?.origenFecha),
    d?.especie ?? '',
    esNumeroValido(d?.desembarqueKg) ? Number(d.desembarqueKg) : '',
    esNumeroValido(d?.capturaKg) ? Number(d.capturaKg) : '',
    d?.origenNombre ?? '',
    formatearCoordenadaWgs84(d?.origenLatitud),
    formatearCoordenadaWgs84(d?.origenLongitud),
    d?.origenFuente ?? 'SIN_COORDENADAS',
    d?.comercializadorFolio ?? '',
    formatearCoordenadaWgs84(d?.comercializadorLatitud),
    formatearCoordenadaWgs84(d?.comercializadorLongitud),
    d?.comercializadorFuente ?? '',
    d?.plantaNombre ?? '',
    d?.plantaCodigo ?? '',
    d?.plantaComuna ?? '',
    formatearCoordenadaWgs84(d?.plantaLatitud),
    formatearCoordenadaWgs84(d?.plantaLongitud),
    d?.plantaFuente ?? 'SIN_COORDENADAS',
    d?.recepcionFolio ?? '',
    formatearFechaIsoCsv(d?.recepcionFecha),
    esNumeroValido(d?.pesoRomanaKg) ? Number(d.pesoRomanaKg) : '',
    resolverRefOriCsv(d),
  ]);
  return {
    headers: HEADERS_CSV_FLUJOS,
    rows,
  };
}

export const HEADERS_COORDENADAS_TRANSACCION = [
  'Latitud Origen',
  'Longitud Origen',
  'Latitud Destino',
  'Longitud Destino',
];

/**
 * QE.2 · Serializa coordenadas origen/destino al final de la planilla de transacciones con punto decimal WGS84.
 */
export function mapearCoordenadasTransaccionCsv(row) {
  return [
    formatearCoordenadaWgs84(row?.latitudOrigen),
    formatearCoordenadaWgs84(row?.longitudOrigen),
    formatearCoordenadaWgs84(row?.latitudDestino),
    formatearCoordenadaWgs84(row?.longitudDestino),
  ];
}
