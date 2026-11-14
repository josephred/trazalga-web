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
  Switch,
  FormControlLabel,
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
import {
  EVALUACION_COLORES,
  FUENTE_LABELS,
  formatearKm,
  formatearFechaHora,
  esEslabonOrigen,
  esEslabonPlanta,
  normalizarEntradas,
  construirCapasMapaCadena,
} from './mapaTrazabilidadUtils';

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
 * Marcador distintivo para Planta oficial del catastro Sernapesca / maestro plantas.
 */
function crearIconoPlantaOficial(contador = 1) {
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
    className: 'trazalga-marker-planta-oficial',
    html: `<div style="
      position:relative;
      width:28px;
      height:28px;
      border-radius:7px;
      background:#4338ca;
      border:3px solid #ffffff;
      box-shadow:0 3px 8px rgba(0,0,0,0.35);
      display:flex;
      align-items:center;
      justify-content:center;
      color:#ffffff;
      font-size:13px;
      font-weight:900;
      letter-spacing:-0.02em;
    " title="Planta oficial (catastro)">P${badgeHtml}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
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
    } catch {
      // ignore bounds error on hidden container
    }
  }, [map, coordsList]);
  return null;
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
  const [mostrarTraza, setMostrarTraza] = useState(true);

  const items = useMemo(
    () => normalizarEntradas({ puntos, nodos, origenes, comercializadores, planta }),
    [puntos, nodos, origenes, comercializadores, planta]
  );

  const plantaNoRecepcionada =
    !Array.isArray(puntos) &&
    !Array.isArray(nodos) &&
    (!planta || !planta.recepcionada);

  const {
    origenesAgrupados,
    plantasReferencia,
    marcadoresGps,
    lineasPares,
    lineasTrazaOrigenDestino,
    avisosTraza,
    todasLasCoordenadas,
    sinGpsItems,
    sinReferenciaItems,
  } = useMemo(
    () => construirCapasMapaCadena(items, { plantaNoRecepcionada }),
    [items, plantaNoRecepcionada]
  );

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
              borderRadius: '4px',
              bgcolor: '#4338ca',
              border: '2px solid #ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Planta oficial (catastro)
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

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 22, borderTop: '3.5px solid #2563eb', borderRadius: 1 }} />
          <FormControlLabel
            control={
              <Switch
                size="small"
                color="primary"
                checked={mostrarTraza}
                onChange={(e) => setMostrarTraza(e.target.checked)}
                inputProps={{ 'aria-label': 'Traza origen → destino' }}
              />
            }
            label={
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Traza origen → destino
              </Typography>
            }
            data-testid="toggle-traza-origen-destino"
            sx={{ m: 0, ml: 0.25 }}
          />
        </Stack>
      </Stack>
    </Box>
  );

  const avisosFaltantes = (sinGpsItems.length > 0 || sinReferenciaItems.length > 0 || avisosTraza.length > 0) && (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      flexWrap="wrap"
      useFlexGap
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
      {avisosTraza.map((aviso, idx) => (
        <Chip
          key={`aviso-traza-${idx}`}
          data-testid="aviso-traza-faltante"
          size="small"
          icon={<WarningIcon fontSize="small" />}
          color="info"
          variant="outlined"
          label={aviso}
          sx={{ fontWeight: 700 }}
        />
      ))}
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

          {/* Líneas continuas directas origen → planta (D41: bypass comercializador) */}
          {mostrarTraza &&
            lineasTrazaOrigenDestino.map((traza) => (
              <Polyline
                key={traza.id}
                positions={traza.coords}
                pathOptions={{
                  color: '#2563eb',
                  weight: 3.5,
                  opacity: 0.85,
                }}
              >
                <LeafletTooltip sticky direction="top" opacity={0.94}>
                  <span style={{ fontWeight: 800, fontSize: '11px', color: '#1d4ed8' }}>
                    #{traza.origen.folio} → #{traza.destino.folio}
                    {traza.distanciaTexto ? ` · ${traza.distanciaTexto}` : ''}
                  </span>
                </LeafletTooltip>
                <Popup>
                  <Box sx={{ p: 0.5, minWidth: 220 }}>
                    <Chip
                      size="small"
                      label="Traza directa origen → destino"
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        mb: 0.75,
                        bgcolor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                      }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', color: '#0f172a', mb: 0.4 }}>
                      <strong>Origen (#{traza.origen.folio}):</strong> {traza.origen.label} (
                      {traza.origen.tipoFuente === 'REFERENCIA' ? 'Referencia oficial' : 'GPS declarado'})
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#0f172a', mb: 0.4 }}>
                      <strong>Destino (#{traza.destino.folio}):</strong> {traza.destino.label} (
                      {traza.destino.tipoFuente === 'REFERENCIA' ? 'Planta oficial' : 'GPS declarado'})
                    </Typography>
                    {traza.distanciaTexto && (
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#1d4ed8' }}>
                        Distancia lineal: {traza.distanciaTexto}
                      </Typography>
                    )}
                  </Box>
                </Popup>
              </Polyline>
            ))}

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

          {/* Marcadores oficiales de Planta de destino (catastro Sernapesca / maestro plantas) */}
          {plantasReferencia.map((grp) => {
            const count = grp.declaraciones.length;
            const etiquetaGrupo = count > 1 ? `${grp.nombre} · ${count} recepciones` : grp.nombre;
            return (
              <Marker
                key={`planta-ref-${grp.key}`}
                position={grp.coords}
                icon={crearIconoPlantaOficial(count)}
              >
                <Popup>
                  <Box sx={{ p: 0.5, minWidth: 200 }}>
                    <Chip
                      size="small"
                      label={`Planta oficial (${grp.tipo})`}
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        mb: 0.75,
                        bgcolor: '#eef2ff',
                        color: '#3730a3',
                        border: '1px solid #c7d2fe',
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
                        {esEslabonPlanta(m.item.eslabon) ? 'Distancia a planta oficial' : 'Distancia al origen'}: {distStr} ({evalInfo.label})
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
