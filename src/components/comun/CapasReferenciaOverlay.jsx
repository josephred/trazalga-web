// src/components/comun/CapasReferenciaOverlay.jsx
import React, { useEffect, useState } from 'react';
import { FormControlLabel, Switch, Typography, Box } from '@mui/material';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getCapasGeorreferencia } from '../../services/reportesService';
import { formatearCoordenadaWgs84 } from './mapaTrazabilidadUtils';

function crearIconoCapa(color, letra, shape = 'circle') {
  const radius = shape === 'square' ? '4px' : '50%';
  return L.divIcon({
    className: `trazalga-capa-ref-${letra.toLowerCase()}`,
    html: `<div style="
      width:18px;
      height:18px;
      border-radius:${radius};
      background:${color};
      border:2px solid #ffffff;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
      display:flex;
      align-items:center;
      justify-content:center;
      color:#ffffff;
      font-size:9px;
      font-weight:800;
    ">${letra}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const ICON_CALETA = crearIconoCapa('#0d9488', 'C', 'circle');
const ICON_VARADERO = crearIconoCapa('#f59e0b', 'V', 'circle');
const ICON_PLANTA = crearIconoCapa('#6366f1', 'P', 'square');

export function useCapasReferencia(regionId = '') {
  const [capasData, setCapasData] = useState(null);
  const [verCaletas, setVerCaletas] = useState(false);
  const [verVaraderos, setVerVaraderos] = useState(false);
  const [verPlantas, setVerPlantas] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getCapasGeorreferencia({ regionId: regionId || undefined }, { signal: controller.signal })
      .then((data) => setCapasData(data))
      .catch(() => {
        // Silencioso si el rol no tiene acceso o falla red; el mapa base sigue operativo
      });
    return () => controller.abort();
  }, [regionId]);

  return {
    capasData,
    verCaletas,
    setVerCaletas,
    verVaraderos,
    setVerVaraderos,
    verPlantas,
    setVerPlantas,
  };
}

export function ControlesCapasReferencia({
  capasData,
  verCaletas,
  setVerCaletas,
  verVaraderos,
  setVerVaraderos,
  verPlantas,
  setVerPlantas,
}) {
  const cob = capasData?.cobertura || {};
  const labelCobertura = (nombre, stats) => {
    if (!stats || stats.total === undefined) return nombre;
    return `${nombre} (${stats.conCoordenadas ?? 0}/${stats.total ?? 0})`;
  };

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={verCaletas}
            onChange={(e) => setVerCaletas(e.target.checked)}
            inputProps={{ 'aria-label': 'Capa Caletas' }}
          />
        }
        label={
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f766e' }}>
            {labelCobertura('Caletas', cob.caletas)}
          </Typography>
        }
        data-testid="toggle-capa-caletas"
        sx={{ m: 0 }}
      />
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={verVaraderos}
            onChange={(e) => setVerVaraderos(e.target.checked)}
            inputProps={{ 'aria-label': 'Capa Varaderos' }}
          />
        }
        label={
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#b45309' }}>
            {labelCobertura('Varaderos', cob.varaderos)}
          </Typography>
        }
        data-testid="toggle-capa-varaderos"
        sx={{ m: 0 }}
      />
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={verPlantas}
            onChange={(e) => setVerPlantas(e.target.checked)}
            inputProps={{ 'aria-label': 'Capa Plantas' }}
          />
        }
        label={
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#4338ca' }}>
            {labelCobertura('Plantas catastro', cob.plantas)}
          </Typography>
        }
        data-testid="toggle-capa-plantas"
        sx={{ m: 0 }}
      />
    </>
  );
}

export function CapasReferenciaMarkers({ capasData, verCaletas, verVaraderos, verPlantas }) {
  if (!capasData) return null;

  const caletas = verCaletas && Array.isArray(capasData.caletas) ? capasData.caletas : [];
  const varaderos = verVaraderos && Array.isArray(capasData.varaderos) ? capasData.varaderos : [];
  const plantas = verPlantas && Array.isArray(capasData.plantas) ? capasData.plantas : [];

  return (
    <>
      {caletas.map((c) => (
        <Marker key={`capa-cal-${c.id}`} position={[Number(c.latitud), Number(c.longitud)]} icon={ICON_CALETA}>
          <Popup>
            <Box sx={{ minWidth: 180 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Caleta: {c.nombre}
              </Typography>
              {c.comuna && <Typography variant="body2">Comuna: {c.comuna}</Typography>}
              {c.region && <Typography variant="body2">Región: {c.region}</Typography>}
              <Typography variant="caption" color="text.secondary">
                WGS84: {formatearCoordenadaWgs84(c.latitud)}, {formatearCoordenadaWgs84(c.longitud)}
              </Typography>
            </Box>
          </Popup>
        </Marker>
      ))}
      {varaderos.map((v) => (
        <Marker key={`capa-var-${v.id}`} position={[Number(v.latitud), Number(v.longitud)]} icon={ICON_VARADERO}>
          <Popup>
            <Box sx={{ minWidth: 180 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Varadero: {v.nombre}
              </Typography>
              {v.comuna && <Typography variant="body2">Comuna: {v.comuna}</Typography>}
              {v.region && <Typography variant="body2">Región: {v.region}</Typography>}
              <Typography variant="caption" color="text.secondary">
                WGS84: {formatearCoordenadaWgs84(v.latitud)}, {formatearCoordenadaWgs84(v.longitud)}
              </Typography>
            </Box>
          </Popup>
        </Marker>
      ))}
      {plantas.map((p) => (
        <Marker key={`capa-pl-${p.id}`} position={[Number(p.latitud), Number(p.longitud)]} icon={ICON_PLANTA}>
          <Popup>
            <Box sx={{ minWidth: 180 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Planta: {p.nombre} {p.codigo ? `[${p.codigo}]` : ''}
              </Typography>
              {p.tipo && <Typography variant="body2">Tipo: {p.tipo}</Typography>}
              {p.comuna && <Typography variant="body2">Comuna: {p.comuna}</Typography>}
              <Typography variant="caption" color="text.secondary">
                WGS84: {formatearCoordenadaWgs84(p.latitud)}, {formatearCoordenadaWgs84(p.longitud)}
              </Typography>
            </Box>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
