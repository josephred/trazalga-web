// src/components/comun/MapaDobleGeorreferencia.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  Stack,
  IconButton,
  Collapse,
  Button,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  PhoneAndroid as PhoneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  WifiOff as WifiOffIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip as LeafletTooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const EVALUACION_COLORES = {
  COHERENTE: { color: '#16a34a', label: 'Coherente (≤ umbral)' },
  PRECISION_BAJA: { color: '#d97706', label: 'Precisión GPS baja (> 500 m)' },
  LEJANA: { color: '#dc2626', label: 'Lejana (> umbral)' },
  SIN_REFERENCIA: { color: '#64748b', label: 'Sin coordenadas de origen' },
  SIN_GPS: { color: '#64748b', label: 'Sin GPS' },
};

const FUENTE_LABELS = {
  VARADERO_DECLARADO: 'Varadero declarado (planilla Sernapesca)',
  CALETA: 'Caleta declarada',
  VARADERO_CALETA: 'Varadero asociado a caleta',
  AMERB: 'Área de manejo (AMERB)',
  SERNAPESCA_2026_10: 'Planilla Sernapesca',
  MANUAL: 'Coordenada manual',
  SEMILLA: 'Semilla inicial',
};

function formatearKm(val) {
  if (val === null || val === undefined || isNaN(Number(val))) return null;
  return `${Number(val).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

function formatearFechaHora(ts) {
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

/**
 * Marcador sólido para Origen del recurso (varadero, caleta o AMERB),
 * con contador "×N" cuando agrupa varios recolectores en el mismo punto.
 */
function crearIconoOrigenSolido(contador = 1) {
  const badgeHtml =
    contador > 1
      ? `<span style="
          position:absolute;
          top:-7px;
          right:-10px;
          background:#0f172a;
          color:#ffffff;
          border:2px solid #ffffff;
          border-radius:999px;
          padding:0 5px;
          font-size:10px;
          font-weight:800;
          line-height:15px;
          box-shadow:0 2px 4px rgba(0,0,0,0.3);
        ">×${contador}</span>`
      : '';

  return L.divIcon({
    className: 'trazalga-marker-origen-solido',
    html: `<div style="
      position:relative;
      width:26px;
      height:26px;
      border-radius:50%;
      background:#059669;
      border:3px solid #ffffff;
      box-shadow:0 3px 8px rgba(0,0,0,0.35);
      display:flex;
      align-items:center;
      justify-content:center;
      color:#ffffff;
      font-size:13px;
      font-weight:800;
    ">●${badgeHtml}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

/**
 * Marcador de contorno con ícono de teléfono para el Lugar de declaración (GPS).
 */
function crearIconoGpsContorno(evaluacion = 'COHERENTE') {
  const stroke = EVALUACION_COLORES[evaluacion]?.color || '#0284c7';
  return L.divIcon({
    className: 'trazalga-marker-gps-contorno',
    html: `<div style="
      width:28px;
      height:28px;
      border-radius:50%;
      background:#ffffff;
      border:3px solid ${stroke};
      box-shadow:0 3px 8px rgba(0,0,0,0.28);
      display:flex;
      align-items:center;
      justify-content:center;
      color:${stroke};
      font-size:14px;
      font-weight:800;
    " title="Lugar de declaración (GPS teléfono)">📱</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

/**
 * Resizer que invalida el tamaño de Leaflet al montar, cambiar pestaña o redimensionar (TF.3 / TG.4).
 */
function MapResizer({ triggerKey }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 120);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map, triggerKey]);
  return null;
}

/**
 * Ajusta el encuadre (fitBounds) sobre todos los puntos válidos presentes.
 */
function FitBounds({ coordsList }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !coordsList || coordsList.length === 0) return;
    try {
      const valid = coordsList.filter(
        (c) => Array.isArray(c) && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1])
      );
      if (valid.length === 1) {
        map.setView(valid[0], 12);
      } else if (valid.length > 1) {
        const bounds = L.latLngBounds(valid);
        map.fitBounds(bounds, { padding: [44, 44], maxZoom: 13 });
      }
    } catch (e) {
      // ignore bounds error on hidden container
    }
  }, [map, coordsList]);
  return null;
}

function esEslabonOrigen(eslabon) {
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

/**
 * Normaliza las distintas fuentes (puntos directos, nodos del modal o secciones de la ficha)
 * al contrato unificado `{ id, eslabon, folio, actor, rut, geo, rawNode }`,
 * sin inventar jamás coordenadas faltantes.
 */
function normalizarEntradas({ puntos, nodos, origenes, comercializadores, planta }) {
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
      const tieneGpsDirecto =
        raw.latitud !== null &&
        raw.latitud !== undefined &&
        raw.longitud !== null &&
        raw.longitud !== undefined &&
        !isNaN(Number(raw.latitud)) &&
        !isNaN(Number(raw.longitud));
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
        id: raw.id || `nodo-${idx}`,
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
    const tieneGpsFallback =
      o.latitud !== null &&
      o.latitud !== undefined &&
      o.longitud !== null &&
      o.longitud !== undefined &&
      !isNaN(Number(o.latitud)) &&
      !isNaN(Number(o.longitud));
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

  if (planta && planta.recepcionada && planta.geo && (planta.geo.gps || planta.geo.referencia)) {
    resultado.push({
      id: `pla-${planta.id || 0}`,
      eslabon: 'PLANTA_ABASTECIMIENTO',
      folio: planta.folio || '-',
      actor: planta.nombrePlanta || 'Planta de Abastecimiento',
      rut: planta.rutPlanta || null,
      geo: planta.geo,
      rawNode: planta,
    });
  }

  return resultado;
}

export default function MapaDobleGeorreferencia({
  puntos = null,
  nodos = null,
  origenes = [],
  comercializadores = [],
  planta = null,
  altura = '340px',
  titulo = 'Origen del recurso y lugar de declaración',
  modoEmbebido = false,
  triggerKey = null,
  onSelectNode = null,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [leyendaAbiertaMobile, setLeyendaAbiertaMobile] = useState(false);

  const items = useMemo(
    () => normalizarEntradas({ puntos, nodos, origenes, comercializadores, planta }),
    [puntos, nodos, origenes, comercializadores, planta]
  );

  // Construir marcadores agrupados de origen, marcadores individuales de GPS, líneas por par y avisos
  const {
    origenesAgrupados,
    marcadoresGps,
    lineasPares,
    todasLasCoordenadas,
    sinGpsItems,
    sinReferenciaItems,
  } = useMemo(() => {
    const gruposOrigenMap = new Map();
    const gpsList = [];
    const lines = [];
    const coords = [];
    const sinGps = [];
    const sinRef = [];

    items.forEach((item) => {
      const geo = item.geo || {};
      const ref = geo.referencia;
      const gps = geo.gps;
      const evaluacion = geo.evaluacion || 'SIN_GPS';
      const esOrigen = esEslabonOrigen(item.eslabon);

      const tieneRef =
        ref &&
        ref.lat !== null &&
        ref.lat !== undefined &&
        ref.lon !== null &&
        ref.lon !== undefined &&
        !isNaN(Number(ref.lat)) &&
        !isNaN(Number(ref.lon));

      const tieneGps =
        gps &&
        gps.lat !== null &&
        gps.lat !== undefined &&
        gps.lon !== null &&
        gps.lon !== undefined &&
        !isNaN(Number(gps.lat)) &&
        !isNaN(Number(gps.lon));

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
        if (!gruposOrigenMap.has(key)) {
          gruposOrigenMap.set(key, {
            key,
            coords: [lat, lon],
            nombre: ref.nombre || 'Origen del recurso',
            tipo: ref.tipo || 'ORIGEN',
            fuente: ref.fuente || 'SERNAPESCA_2026_10',
            declaraciones: [],
          });
          coords.push([lat, lon]);
        }
        gruposOrigenMap.get(key).declaraciones.push(item);
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

    return {
      origenesAgrupados: Array.from(gruposOrigenMap.values()),
      marcadoresGps: gpsList,
      lineasPares: lines,
      todasLasCoordenadas: coords,
      sinGpsItems: sinGps,
      sinReferenciaItems: sinRef,
    };
  }, [items]);

  const defaultCenter = todasLasCoordenadas[0] || [-29.9533, -71.3436];

  const contenidoLeyenda = (
    <Box
      data-testid="leyenda-mapa-doble-geo"
      sx={{
        px: 2,
        py: 1.2,
        bgcolor: (t) => (t.palette.mode === 'light' ? '#f1f5f9' : '#0f172a'),
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: '#059669',
              border: '2px solid #ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Origen del recurso (varadero / caleta / AMERB)
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: '#ffffff',
              border: '2.5px solid #0284c7',
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Lugar de declaración (GPS teléfono)
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 18, borderTop: '2.5px dashed #16a34a' }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Coherente
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 18, borderTop: '2.5px dashed #d97706' }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Precisión baja
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 18, borderTop: '2.5px dashed #dc2626' }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Lejana (&gt; umbral)
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );

  const avisosFaltantes = (sinGpsItems.length > 0 || sinReferenciaItems.length > 0) && (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      sx={{
        px: 2,
        py: 1,
        bgcolor: (t) => (t.palette.mode === 'light' ? '#fffbeb' : '#1e293b'),
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {sinGpsItems.length > 0 && (
        <Chip
          size="small"
          icon={<WarningIcon fontSize="small" />}
          color="warning"
          variant="outlined"
          label={`Sin GPS (${sinGpsItems.length}): ${sinGpsItems
            .slice(0, 3)
            .map((i) => `#${i.folio}`)
            .join(', ')}${sinGpsItems.length > 3 ? '…' : ''}`}
          sx={{ fontWeight: 700 }}
        />
      )}
      {sinReferenciaItems.length > 0 && (
        <Chip
          size="small"
          icon={<WarningIcon fontSize="small" />}
          color="default"
          variant="outlined"
          label={`Sin coordenadas de origen (${sinReferenciaItems.length}): ${sinReferenciaItems
            .slice(0, 3)
            .map((i) => `#${i.folio}`)
            .join(', ')}${sinReferenciaItems.length > 3 ? '…' : ''}`}
          sx={{ fontWeight: 700 }}
        />
      )}
    </Stack>
  );

  const renderMapaLeaflet = (heightStyle) => (
    <Box sx={{ height: heightStyle, width: '100%', position: 'relative' }}>
      {todasLasCoordenadas.length === 0 ? (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: (t) => (t.palette.mode === 'light' ? '#f8fafc' : '#0f172a'),
          }}
        >
          <Alert severity="info" sx={{ borderRadius: 2, fontWeight: 600 }}>
            Esta cadena no registra coordenadas GPS ni coordenadas de referencia de origen para dibujar en el mapa.
          </Alert>
        </Box>
      ) : (
        <MapContainer
          center={defaultCenter}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapResizer triggerKey={triggerKey} />
          <FitBounds coordsList={todasLasCoordenadas} />

          {/* Líneas punteadas por par origen–declaración (sin unir GPS entre sí) */}
          {lineasPares.map((line) => (
            <Polyline
              key={line.id}
              positions={line.coords}
              pathOptions={{
                color: line.color,
                dashArray: '6, 6',
                weight: 3,
                opacity: 0.9,
              }}
            >
              {line.distanciaTexto && (
                <LeafletTooltip permanent direction="center" opacity={0.92}>
                  <span style={{ fontWeight: 800, fontSize: '11px', color: line.color }}>
                    {line.distanciaTexto}
                  </span>
                </LeafletTooltip>
              )}
            </Polyline>
          ))}

          {/* Marcadores sólidos de Origen del recurso (agrupados cuando comparten coordenadas) */}
          {origenesAgrupados.map((grp) => {
            const count = grp.declaraciones.length;
            const etiquetaGrupo =
              count > 1
                ? `${grp.nombre} · ${count} recolectores`
                : grp.nombre;
            return (
              <Marker
                key={`origen-${grp.key}`}
                position={grp.coords}
                icon={crearIconoOrigenSolido(count)}
              >
                <Popup>
                  <Box sx={{ p: 0.5, minWidth: 200 }}>
                    <Chip
                      size="small"
                      label={`Origen del recurso (${grp.tipo})`}
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        mb: 0.75,
                        bgcolor: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.4 }}>
                      {etiquetaGrupo}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 0.5 }}>
                      Fuente referencia: <strong>{FUENTE_LABELS[grp.fuente] || grp.fuente}</strong>
                    </Typography>
                    <Stack spacing={0.4} sx={{ maxHeight: 130, overflowY: 'auto', mt: 0.5 }}>
                      {grp.declaraciones.map((d) => (
                        <Typography
                          key={d.id}
                          variant="caption"
                          sx={{ color: '#1e293b', display: 'block', fontSize: '0.72rem' }}
                        >
                          • Folio <strong>#{d.folio}</strong> — {d.actor}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcadores de contorno con ícono de teléfono para el Lugar de declaración (GPS) */}
          {marcadoresGps.map((m) => {
            const evalInfo = EVALUACION_COLORES[m.evaluacion] || EVALUACION_COLORES.COHERENTE;
            const distStr = formatearKm(m.distanciaKm);
            const fechaCaptura = formatearFechaHora(m.gps.capturadoEn);
            const fuenteRef = m.ref?.fuente ? FUENTE_LABELS[m.ref.fuente] || m.ref.fuente : null;

            return (
              <Marker
                key={m.id}
                position={m.coords}
                icon={crearIconoGpsContorno(m.evaluacion)}
              >
                <Popup>
                  <Box sx={{ p: 0.5, minWidth: 210 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.75, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        icon={<PhoneIcon sx={{ fontSize: '13px !important' }} />}
                        label="Lugar de declaración (GPS)"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor: '#f0f9ff',
                          color: '#0369a1',
                          border: '1px solid #bae6fd',
                        }}
                      />
                      {m.gps.offline && (
                        <Chip
                          size="small"
                          icon={<WifiOffIcon sx={{ fontSize: '12px !important' }} />}
                          label="Enviada sin conexión"
                          color="warning"
                          sx={{ height: 20, fontSize: '0.66rem', fontWeight: 800 }}
                        />
                      )}
                    </Stack>

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      Folio #{m.item.folio} · {m.item.actor}
                    </Typography>

                    {m.item.rut && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.4 }}>
                        RUT: {m.item.rut}
                      </Typography>
                    )}

                    {distStr && (
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, color: evalInfo.color, display: 'block', mt: 0.4 }}
                      >
                        Distancia al origen: {distStr} ({evalInfo.label})
                      </Typography>
                    )}

                    {!m.ref && esEslabonOrigen(m.item.eslabon) && (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mt: 0.4 }}>
                        Sin coordenadas de origen para comparar
                      </Typography>
                    )}

                    {fechaCaptura && (
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3 }}>
                        Captura GPS: {fechaCaptura}
                      </Typography>
                    )}

                    {m.gps.precisionM !== null && m.gps.precisionM !== undefined && (
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                        Precisión GPS: {Math.round(Number(m.gps.precisionM)).toLocaleString('es-CL')} m
                      </Typography>
                    )}

                    {fuenteRef && (
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                        Referencia: {m.ref.nombre} ({fuenteRef})
                      </Typography>
                    )}

                    {onSelectNode && m.item.rawNode && (
                      <Button
                        size="small"
                        fullWidth
                        variant="contained"
                        onClick={() => onSelectNode(m.item.rawNode)}
                        sx={{
                          mt: 1,
                          py: 0.3,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: 1.5,
                        }}
                      >
                        Ver Detalle Completo
                      </Button>
                    )}
                  </Box>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </Box>
  );

  if (modoEmbebido) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        {isMobile ? (
          <>
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                bgcolor: '#1e293b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                Doble georreferenciación (Origen vs GPS)
              </Typography>
              <Button
                size="small"
                onClick={() => setLeyendaAbiertaMobile(!leyendaAbiertaMobile)}
                endIcon={leyendaAbiertaMobile ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ color: '#38bdf8', textTransform: 'none', fontSize: '0.72rem', fontWeight: 700 }}
              >
                Leyenda
              </Button>
            </Box>
            <Collapse in={leyendaAbiertaMobile}>{contenidoLeyenda}</Collapse>
          </>
        ) : (
          contenidoLeyenda
        )}
        {avisosFaltantes}
        <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {renderMapaLeaflet('100%')}
        </Box>
      </Box>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        mb: 3,
      }}
    >
      {/* Cabecera */}
      <Box
        sx={{
          p: 2,
          bgcolor: (t) => (t.palette.mode === 'light' ? '#f8fafc' : '#1e293b'),
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <LocationIcon sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {titulo}
          </Typography>
        </Stack>
        {isMobile && (
          <IconButton
            size="small"
            onClick={() => setLeyendaAbiertaMobile(!leyendaAbiertaMobile)}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
            aria-label="Alternar leyenda del mapa"
          >
            {leyendaAbiertaMobile ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* Leyenda: siempre visible en desktop, plegable en móvil */}
      {isMobile ? <Collapse in={leyendaAbiertaMobile}>{contenidoLeyenda}</Collapse> : contenidoLeyenda}

      {/* Avisos de Sin GPS o Sin coordenadas de origen */}
      {avisosFaltantes}

      {/* Mapa */}
      {renderMapaLeaflet(altura)}
    </Card>
  );
}
