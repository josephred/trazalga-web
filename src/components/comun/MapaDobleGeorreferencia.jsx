// src/components/comun/MapaDobleGeorreferencia.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  Stack,
  Paper,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  PhoneAndroid as PhoneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Phishing as FishIcon,
  LocalShipping as TruckIcon,
  Factory as FactoryIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para íconos estándar de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Coordenadas conocidas de referencia para caletas y comunas de Coquimbo / Atacama (fallback)
const COORDENADAS_CALETAS = {
  coquimbo: [-29.9533, -71.3436],
  'la serena': [-29.9027, -71.2519],
  tongoy: [-30.2547, -71.4939],
  guanaqueros: [-30.1983, -71.4242],
  'los vilos': [-31.9125, -71.5122],
  pichidangui: [-32.1436, -71.5317],
  huentelauquen: [-31.5833, -71.5500],
  chanaral: [-26.3478, -70.6219],
  caldera: [-27.0667, -70.8167],
  huasco: [-28.4667, -71.2167],
  default: [-29.9533, -71.3436],
};

function resolverCoordenada(item, fallbackIndex = 0) {
  if (item.latitud && item.longitud && !isNaN(Number(item.latitud)) && !isNaN(Number(item.longitud))) {
    return [Number(item.latitud), Number(item.longitud)];
  }
  if (item.geo && item.geo.gps && item.geo.gps.lat && item.geo.gps.lon) {
    return [Number(item.geo.gps.lat), Number(item.geo.gps.lon)];
  }
  if (item.geo && item.geo.referencia && item.geo.referencia.lat && item.geo.referencia.lon) {
    return [Number(item.geo.referencia.lat), Number(item.geo.referencia.lon)];
  }

  // Búsqueda por nombre de caleta o comuna
  const clave = (item.caleta || item.comuna || item.varaderoOAmerb || '').toLowerCase().trim();
  for (const [nom, coords] of Object.entries(COORDENADAS_CALETAS)) {
    if (clave.includes(nom)) {
      // Dispersión sutil si hay múltiples orígenes en la misma caleta
      const jitter = fallbackIndex * 0.002;
      return [coords[0] + jitter, coords[1] + jitter];
    }
  }

  const base = COORDENADAS_CALETAS.default;
  const jitter = fallbackIndex * 0.0025;
  return [base[0] + jitter, base[1] + jitter];
}

/**
 * Resizer que invalida el tamaño de Leaflet para garantizar renderizado completo
 */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/**
 * Ajustador automático de límites (bounds) del mapa según los puntos presentes
 */
function FitBounds({ puntos }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !puntos || puntos.length === 0) return;
    try {
      const validPoints = puntos.filter(p => Array.isArray(p.coords) && p.coords.length === 2 && !isNaN(p.coords[0]) && !isNaN(p.coords[1]));
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints.map(p => p.coords));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    } catch (e) {
      console.warn('No se pudo ajustar bounds del mapa:', e);
    }
  }, [map, puntos]);
  return null;
}

export default function MapaDobleGeorreferencia({
  origenes = [],
  comercializadores = [],
  planta = null,
  altura = '340px',
  titulo = 'Origen y lugar de declaración (TG.4)',
}) {
  const [leyendaAbierta, setLeyendaAbierta] = useState(false);
  const containerRef = useRef(null);

  // Construir puntos normalizados
  const { puntosNormalizados, lineas } = useMemo(() => {
    const list = [];
    const lines = [];

    // 1. Orígenes
    origenes.forEach((orig, idx) => {
      const coordsOrigen = resolverCoordenada(orig, idx);
      const id = orig.id || `orig-${idx}`;

      // Punto A: Origen del recurso (varadero / caleta) - marcador sólido
      list.push({
        id: `recurso-${id}`,
        tipo: 'RECURSO',
        eslabon: 'Origen del Recurso',
        nombre: orig.caleta || orig.varaderoOAmerb || 'Varadero / Caleta',
        detalle: `${orig.nombre || 'Recolector'} · ${orig.desembarqueKg ? `${orig.desembarqueKg} kg` : ''}`,
        coords: coordsOrigen,
        color: '#16a34a', // Verde esmeralda
      });

      // Punto B: Lugar de declaración (GPS móvil) si existe o si se evaluó
      const tieneGpsDeclaracion = Boolean(orig.geo?.gps?.lat || orig.latitudDeclaracion || (orig.latitud && orig.longitud));
      if (tieneGpsDeclaracion) {
        // Si hay coordenadas distintas para declaración
        const coordsDecl = orig.geo?.gps
          ? [Number(orig.geo.gps.lat), Number(orig.geo.gps.lon)]
          : [coordsOrigen[0] + 0.003, coordsOrigen[1] + 0.003]; // ligero desplazamiento de demostración

        list.push({
          id: `decl-${id}`,
          tipo: 'DECLARACION',
          eslabon: 'Lugar de Declaración (GPS Teléfono)',
          nombre: `Declaración ${orig.folioOrigen || orig.folioDesembarque || ''}`,
          detalle: `${orig.hora || ''} · ${orig.geo?.evaluacion || 'COHERENTE'}`,
          coords: coordsDecl,
          color: '#0284c7', // Azul cielo
        });

        // Línea punteada que une origen físico con lugar de declaración
        lines.push({
          coords: [coordsOrigen, coordsDecl],
          color: orig.geo?.evaluacion === 'LEJANA' ? '#dc2626' : '#16a34a',
          dashArray: '5, 5',
          distancia: orig.geo?.distanciaKm ? `${orig.geo.distanciaKm.toFixed(2)} km` : '0.3 km',
        });
      }
    });

    // 2. Comercializador
    comercializadores.forEach((com, idx) => {
      const coordsCom = resolverCoordenada(com, idx + 10);
      list.push({
        id: `com-${com.id || idx}`,
        tipo: 'COMERCIALIZADOR',
        eslabon: 'Comercializador / Traslado',
        nombre: com.nombre || 'Bodega Comercializador',
        detalle: `Patente: ${com.patenteCamion || 'S/P'} · Chofer: ${com.chofer || 'No informado'}`,
        coords: coordsCom,
        color: '#9333ea', // Morado
      });
    });

    // 3. Planta
    if (planta && planta.recepcionada) {
      const coordsPlanta = resolverCoordenada(planta, 20);
      list.push({
        id: `pla-${planta.id || 0}`,
        tipo: 'PLANTA',
        eslabon: 'Planta de Abastecimiento',
        nombre: planta.nombrePlanta || 'Planta de Proceso',
        detalle: `${planta.comuna || ''} · Romana: ${planta.conRomana ? `${planta.pesoRomanaKg} kg` : 'Declarado'}`,
        coords: coordsPlanta,
        color: '#0d9488', // Teal
      });
    }

    return { puntosNormalizados: list, lineas: lines };
  }, [origenes, comercializadores, planta]);

  const defaultCenter = puntosNormalizados[0]?.coords || COORDENADAS_CALETAS.default;

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', mb: 3 }}>
      {/* Cabecera de la sección */}
      <Box
        sx={{
          p: 2,
          bgcolor: (t) => t.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
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
        <IconButton
          size="small"
          onClick={() => setLeyendaAbierta(!leyendaAbierta)}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          aria-label="Ver leyenda"
        >
          {leyendaAbierta ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Leyenda Plegable */}
      <Collapse in={leyendaAbierta}>
        <Box sx={{ p: 1.5, bgcolor: (t) => t.palette.mode === 'light' ? '#f1f5f9' : '#0f172a', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#16a34a' }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Origen Físico (Caleta/Varadero)</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #0284c7', bgcolor: 'transparent' }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Lugar Declaración (GPS)</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#9333ea' }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Comercializador</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#0d9488' }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Planta</Typography>
            </Stack>
          </Stack>
        </Box>
      </Collapse>

      {/* Contenedor Leaflet */}
      <Box ref={containerRef} sx={{ height: altura, width: '100%', position: 'relative' }}>
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
          <MapResizer />
          <FitBounds puntos={puntosNormalizados} />

          {/* Líneas punteadas de georreferencia origen-declaración */}
          {lineas.map((line, idx) => (
            <Polyline
              key={`line-${idx}`}
              positions={line.coords}
              color={line.color}
              dashArray={line.dashArray}
              weight={2.5}
            />
          ))}

          {/* Marcadores */}
          {puntosNormalizados.map((pto) => (
            <CircleMarker
              key={pto.id}
              center={pto.coords}
              radius={pto.tipo === 'DECLARACION' ? 7 : 9}
              pathOptions={{
                color: pto.color,
                fillColor: pto.tipo === 'DECLARACION' ? '#ffffff' : pto.color,
                fillOpacity: pto.tipo === 'DECLARACION' ? 0.9 : 0.85,
                weight: pto.tipo === 'DECLARACION' ? 3 : 1.5,
              }}
            >
              <Popup>
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: pto.color }}>
                    {pto.eslabon}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {pto.nombre}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {pto.detalle}
                  </Typography>
                </Box>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </Box>
    </Card>
  );
}
