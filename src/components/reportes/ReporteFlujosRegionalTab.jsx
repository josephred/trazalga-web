// src/components/reportes/ReporteFlujosRegionalTab.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  AltRoute as FlowIcon,
  WarningAmber as WarningIcon,
  CheckCircleOutline as CheckIcon,
  Scale as ScaleIcon,
  Inventory2 as BatchIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip as LeafletTooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getFlujosOrigenDestino, getCatalogosFiltrosFlujos } from '../../services/reportesService';
import {
  ponderarGrosorFlujo,
  formatearKm,
  calcularDistanciaHaversineKm,
  formatearCoordenadaWgs84,
  construirFilasCsvFlujosOrigenDestino,
} from '../comun/mapaTrazabilidadUtils';
import { exportarCsv } from '../../utils/exportarCsv';

function crearIconoOrigenFlujo(fuente) {
  const esReferencia = fuente === 'REFERENCIA';
  const fill = esReferencia ? '#059669' : '#10b981';
  const badge = esReferencia ? '●' : 'G';
  return L.divIcon({
    className: 'trazalga-flujo-origen-marker',
    html: `<div style="
      width:24px;
      height:24px;
      border-radius:50%;
      background:${fill};
      border:3px solid #ffffff;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      display:flex;
      align-items:center;
      justify-content:center;
      color:#ffffff;
      font-size:11px;
      font-weight:800;
    ">${badge}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function crearIconoPlantaFlujo(fuente) {
  const esGps = fuente === 'GPS';
  const bg = esGps ? '#d97706' : '#4338ca';
  const label = esGps ? 'P*' : 'P';
  return L.divIcon({
    className: 'trazalga-flujo-planta-marker',
    html: `<div style="
      width:28px;
      height:28px;
      border-radius:7px;
      background:${bg};
      border:3px solid #ffffff;
      box-shadow:0 3px 8px rgba(0,0,0,0.35);
      display:flex;
      align-items:center;
      justify-content:center;
      color:#ffffff;
      font-size:12px;
      font-weight:900;
    ">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function MapResizerFlujos({ triggerKey }) {
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

function FitBoundsFlujos({ coordsList }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !coordsList || coordsList.length === 0) return;
    try {
      if (coordsList.length === 1) {
        map.setView(coordsList[0], 11);
      } else {
        map.fitBounds(L.latLngBounds(coordsList), { padding: [44, 44], maxZoom: 12 });
      }
    } catch {
      // ignora error si contenedor oculto
    }
  }, [map, coordsList]);
  return null;
}

const formatearKg = (val) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return '0 kg';
  return `${n.toLocaleString('es-CL', { maximumFractionDigits: 1 })} kg`;
};

const labelFuente = (fuente, detalle) => {
  if (fuente === 'REFERENCIA') {
    return detalle ? `Referencia (${detalle})` : 'Referencia oficial';
  }
  if (fuente === 'GPS') {
    return detalle === 'GPS_RECEPCION' ? 'GPS de recepción' : 'GPS de declaración';
  }
  return 'Sin coordenadas';
};

/**
 * QM.3 · Pestaña regional «Mapa de flujos» en Reportes.
 */
export default function ReporteFlujosRegionalTab({ dateRange }) {
  const [especies, setEspecies] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [especieId, setEspecieId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    getCatalogosFiltrosFlujos({ signal: controller.signal }).then(({ especies: esp, regiones: reg }) => {
      setEspecies(esp);
      setRegiones(reg);
    });
    return () => controller.abort();
  }, []);

  const cargarFlujos = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getFlujosOrigenDestino(
        {
          startDate: dateRange?.startDate || undefined,
          endDate: dateRange?.endDate || undefined,
          especieId: especieId || undefined,
          regionId: regionId || undefined,
        },
        { signal }
      );
      setDatos(resp);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      setError(err?.response?.data?.message || 'Error al cargar flujos regionales origen → destino.');
    } finally {
      setLoading(false);
    }
  }, [dateRange?.startDate, dateRange?.endDate, especieId, regionId]);

  useEffect(() => {
    const controller = new AbortController();
    cargarFlujos(controller.signal);
    return () => controller.abort();
  }, [cargarFlujos]);

  const flujosMapa = useMemo(() => (Array.isArray(datos?.flujosMapa) ? datos.flujosMapa : []), [datos]);
  const flujosSinCoordenadas = useMemo(
    () => (Array.isArray(datos?.flujosSinCoordenadas) ? datos.flujosSinCoordenadas : []),
    [datos]
  );
  const declaraciones = useMemo(() => (Array.isArray(datos?.declaraciones) ? datos.declaraciones : []), [datos]);
  const resumen = useMemo(() => datos?.resumen || {}, [datos]);

  const handleExportarCsv = () => {
    if (declaraciones.length === 0) return;
    const { headers, rows } = construirFilasCsvFlujosOrigenDestino(declaraciones);
    const sufijoInicio = dateRange?.startDate || 'inicio';
    const sufijoFin = dateRange?.endDate || 'hoy';
    exportarCsv({
      headers,
      rows,
      nombreArchivo: `flujos_origen_destino_${sufijoInicio}_${sufijoFin}`,
    });
  };

  const maxDesembarqueKg = useMemo(
    () => flujosMapa.reduce((mx, f) => Math.max(mx, Number(f.desembarqueKg) || 0), 0),
    [flujosMapa]
  );

  const { origenesUnicos, plantasUnicas, allCoords } = useMemo(() => {
    const origMap = new Map();
    const plantMap = new Map();
    const coords = [];

    flujosMapa.forEach((f) => {
      const o = f.origen || {};
      const p = f.planta || {};
      const oLat = Number(o.latitud);
      const oLon = Number(o.longitud);
      const pLat = Number(p.latitud);
      const pLon = Number(p.longitud);

      if (Number.isFinite(oLat) && Number.isFinite(oLon)) {
        coords.push([oLat, oLon]);
        const oKey = `${oLat.toFixed(5)}|${oLon.toFixed(5)}|${o.nombre || ''}`;
        if (!origMap.has(oKey)) {
          origMap.set(oKey, {
            key: oKey,
            lat: oLat,
            lon: oLon,
            nombre: o.nombre || 'Origen',
            tipo: o.tipo || o.tipoDeclaracion || 'ORIGEN',
            regionNombre: o.regionNombre,
            fuente: o.fuente,
            fuenteDetalle: o.fuenteDetalle,
            desembarqueKg: 0,
            declaracionesCount: 0,
            destinos: new Set(),
          });
        }
        const entry = origMap.get(oKey);
        entry.desembarqueKg += Number(f.desembarqueKg) || 0;
        entry.declaracionesCount += Number(f.declaracionesCount) || 0;
        if (p.nombre) entry.destinos.add(p.nombre);
      }

      if (Number.isFinite(pLat) && Number.isFinite(pLon)) {
        coords.push([pLat, pLon]);
        const pKey = `${pLat.toFixed(5)}|${pLon.toFixed(5)}|${p.codigo || p.nombre || ''}`;
        if (!plantMap.has(pKey)) {
          plantMap.set(pKey, {
            key: pKey,
            lat: pLat,
            lon: pLon,
            nombre: p.nombre || 'Planta',
            codigo: p.codigo,
            fuente: p.fuente,
            fuenteDetalle: p.fuenteDetalle,
            desembarqueKg: 0,
            declaracionesCount: 0,
            origenes: new Set(),
          });
        }
        const pEntry = plantMap.get(pKey);
        pEntry.desembarqueKg += Number(f.desembarqueKg) || 0;
        pEntry.declaracionesCount += Number(f.declaracionesCount) || 0;
        if (o.nombre) pEntry.origenes.add(o.nombre);
      }
    });

    return {
      origenesUnicos: Array.from(origMap.values()),
      plantasUnicas: Array.from(plantMap.values()),
      allCoords: coords,
    };
  }, [flujosMapa]);

  const mapCenter = useMemo(() => {
    if (allCoords.length > 0) return allCoords[0];
    return [-29.9533, -71.3395];
  }, [allCoords]);

  return (
    <Box>
      {/* Filtros regionales */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {dateRange?.startDate && (
            <Grid size={{ xs: 12, md: 3 }}>
              <Chip
                label={`Período: ${dateRange.startDate} al ${dateRange.endDate}`}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  fontFamily: 'Inter',
                  fontSize: '0.8rem',
                  py: 2.2,
                  px: 1,
                  width: '100%',
                  justifyContent: 'flex-start',
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(14, 165, 233, 0.12)' : '#f0f9ff'),
                  color: 'primary.main',
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(14, 165, 233, 0.3)' : '#bae6fd'),
                }}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6, md: dateRange?.startDate ? 3 : 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Especie"
              value={especieId}
              onChange={(e) => setEspecieId(e.target.value)}
            >
              <MenuItem value="">Todas las especies</MenuItem>
              {especies.map((esp) => (
                <MenuItem key={esp.id} value={String(esp.id)}>
                  {esp.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: dateRange?.startDate ? 3 : 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Región de origen"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
            >
              <MenuItem value="">Todas las regiones</MenuItem>
              {regiones.map((reg) => (
                <MenuItem key={reg.id} value={String(reg.id)}>
                  {reg.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: dateRange?.startDate ? 3 : 4 }}>
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => cargarFlujos()}
                disabled={loading}
                sx={{ fontWeight: 700, py: 1 }}
              >
                Consultar
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportarCsv}
                disabled={loading || declaraciones.length === 0}
                sx={{ fontWeight: 700, py: 1 }}
              >
                Exportar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tarjetas de resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <FlowIcon color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Flujos en mapa
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {resumen.paresConCoordenadas ?? flujosMapa.length} / {resumen.totalPares ?? 0}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <WarningIcon color={flujosSinCoordenadas.length > 0 ? 'warning' : 'success'} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Sin coordenadas
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {resumen.paresSinCoordenadas ?? flujosSinCoordenadas.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <ScaleIcon color="success" />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Desembarque / Captura
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {formatearKg(resumen.desembarqueTotalKg)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Captura: {formatearKg(resumen.capturaTotalKg)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <BatchIcon color="secondary" />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Declaraciones de origen
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {resumen.totalDeclaraciones ?? declaraciones.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Mapa regional de flujos */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Mapa regional de flujos origen → planta
            </Typography>
            <Typography variant="caption" color="text.secondary">
              El grosor de cada línea es proporcional a los kilos desembarcados recibidos en planta.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
            <Chip size="small" label="● Origen (Ref./GPS)" sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 700 }} />
            <Chip size="small" label="P Planta oficial" sx={{ bgcolor: '#eef2ff', color: '#3730a3', fontWeight: 700 }} />
            <Chip size="small" label="P* Planta (GPS recepción)" sx={{ bgcolor: '#fffbeb', color: '#92400e', fontWeight: 700 }} />
          </Stack>
        </Box>

        {loading && !datos ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress size={38} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Construyendo red regional origen → destino...
            </Typography>
          </Box>
        ) : flujosMapa.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="info" sx={{ justifyContent: 'center' }}>
              No hay pares origen → planta con coordenadas completas para el período y filtros seleccionados.
            </Alert>
          </Box>
        ) : (
          <Box sx={{ height: 470, width: '100%', position: 'relative' }}>
            <MapContainer
              center={mapCenter}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapResizerFlujos triggerKey={`${flujosMapa.length}-${especieId}-${regionId}-${dateRange?.startDate}`} />
              <FitBoundsFlujos coordsList={allCoords} />

              {flujosMapa.map((f) => {
                const oLat = Number(f.origen.latitud);
                const oLon = Number(f.origen.longitud);
                const pLat = Number(f.planta.latitud);
                const pLon = Number(f.planta.longitud);
                const distKm = calcularDistanciaHaversineKm([oLat, oLon], [pLat, pLon]);
                const grosor = ponderarGrosorFlujo(f.desembarqueKg, maxDesembarqueKg);
                const esPlantaGps = f.planta.fuente === 'GPS';

                return (
                  <Polyline
                    key={f.id}
                    positions={[
                      [oLat, oLon],
                      [pLat, pLon],
                    ]}
                    pathOptions={{
                      color: esPlantaGps ? '#d97706' : '#1d4ed8',
                      weight: grosor,
                      opacity: 0.78,
                      dashArray: esPlantaGps ? '7, 6' : undefined,
                    }}
                  >
                    <LeafletTooltip sticky>
                      <div>
                        <strong>{f.origen.nombre}</strong> → <strong>{f.planta.nombre}</strong>
                        <br />
                        Desembarque: {formatearKg(f.desembarqueKg)} ({f.declaracionesCount} decl.)
                      </div>
                    </LeafletTooltip>
                    <Popup>
                      <Box sx={{ minWidth: 230 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                          {f.origen.nombre} → {f.planta.nombre}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Origen:</strong> {f.origen.tipo} · {labelFuente(f.origen.fuente, f.origen.fuenteDetalle)}
                        </Typography>
                        {f.origen.regionNombre && (
                          <Typography variant="body2">
                            <strong>Región origen:</strong> {f.origen.regionNombre}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          <strong>Planta:</strong> {f.planta.codigo ? `[${f.planta.codigo}] ` : ''}
                          {labelFuente(f.planta.fuente, f.planta.fuenteDetalle)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Desembarque:</strong> {formatearKg(f.desembarqueKg)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Captura:</strong> {formatearKg(f.capturaKg)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Declaraciones:</strong> {f.declaracionesCount} (en {f.recepcionesCount} recep.)
                        </Typography>
                        {distKm !== null && (
                          <Typography variant="body2">
                            <strong>Distancia geodésica:</strong> {formatearKm(distKm)}
                          </Typography>
                        )}
                        {Array.isArray(f.especies) && f.especies.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Especies: {f.especies.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    </Popup>
                  </Polyline>
                );
              })}

              {origenesUnicos.map((o) => (
                <Marker
                  key={o.key}
                  position={[o.lat, o.lon]}
                  icon={crearIconoOrigenFlujo(o.fuente)}
                >
                  <Popup>
                    <Box sx={{ minWidth: 210 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {o.nombre}
                      </Typography>
                      <Typography variant="body2">
                        {o.tipo} · {labelFuente(o.fuente, o.fuenteDetalle)}
                      </Typography>
                      {o.regionNombre && (
                        <Typography variant="body2">Región: {o.regionNombre}</Typography>
                      )}
                      <Typography variant="body2">
                        Salida: {formatearKg(o.desembarqueKg)} ({o.declaracionesCount} decl.)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        WGS84: {formatearCoordenadaWgs84(o.lat)}, {formatearCoordenadaWgs84(o.lon)}
                      </Typography>
                    </Box>
                  </Popup>
                </Marker>
              ))}

              {plantasUnicas.map((p) => (
                <Marker
                  key={p.key}
                  position={[p.lat, p.lon]}
                  icon={crearIconoPlantaFlujo(p.fuente)}
                >
                  <Popup>
                    <Box sx={{ minWidth: 210 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {p.nombre} {p.codigo ? `(${p.codigo})` : ''}
                      </Typography>
                      <Typography variant="body2">
                        {labelFuente(p.fuente, p.fuenteDetalle)}
                      </Typography>
                      <Typography variant="body2">
                        Desembarque recibido: {formatearKg(p.desembarqueKg)} ({p.declaracionesCount} decl.)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        WGS84: {formatearCoordenadaWgs84(p.lat)}, {formatearCoordenadaWgs84(p.lon)}
                      </Typography>
                    </Box>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Box>
        )}
      </Paper>

      {/* Tabla de flujos sin coordenadas */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Flujos sin coordenadas en algún extremo ({flujosSinCoordenadas.length})
          </Typography>
        </Box>
        {flujosSinCoordenadas.length === 0 ? (
          <Box sx={{ p: 2.5 }}>
            <Alert severity="success" icon={<CheckIcon />}>
              Todos los pares origen → planta del período cuentan con coordenadas válidas en origen y destino.
            </Alert>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 380 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Origen</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Fuente origen</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Región</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Planta destino</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Fuente planta</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Declaraciones</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Desembarque (kg)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Motivo explícito</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flujosSinCoordenadas.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {row.origen?.nombre || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.origen?.tipoDeclaracion || row.origen?.tipo || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={labelFuente(row.origen?.fuente, row.origen?.fuenteDetalle)}
                        color={row.origen?.fuente === 'SIN_COORDENADAS' ? 'warning' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{row.origen?.regionNombre || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {row.planta?.nombre || '-'}
                      </Typography>
                      {row.planta?.codigo && (
                        <Typography variant="caption" color="text.secondary">
                          Cód. {row.planta.codigo}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={labelFuente(row.planta?.fuente, row.planta?.fuenteDetalle)}
                        color={row.planta?.fuente === 'SIN_COORDENADAS' ? 'warning' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{row.declaracionesCount ?? 0}</TableCell>
                    <TableCell align="right">{formatearKg(row.desembarqueKg)}</TableCell>
                    <TableCell>
                      <Tooltip title={row.motivoSinCoordenadas || ''}>
                        <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 600 }}>
                          {row.motivoSinCoordenadas || 'Coordenadas incompletas'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
