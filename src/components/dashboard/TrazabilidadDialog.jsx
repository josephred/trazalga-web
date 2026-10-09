import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton, 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Chip, 
  Divider, 
  Paper, 
  Tooltip, 
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FactoryIcon from '@mui/icons-material/Factory';
import PhishingIcon from '@mui/icons-material/Phishing';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScaleIcon from '@mui/icons-material/Scale';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpaIcon from '@mui/icons-material/Spa';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NaturePeopleIcon from '@mui/icons-material/NaturePeople';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import MapIcon from '@mui/icons-material/Map';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import api from '../../api/axiosConfig';

export default function TrazabilidadDialog({ open, onClose, declaracionId, tipoReporte, row }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'graph' | 'map'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [copiedFolio, setCopiedFolio] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleOpenDetail = (data) => {
    if (!data) return;
    setDetailData(data);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
    setCopiedFolio(false);
    setCopiedSummary(false);
  };

  const handleCopyFolio = (folio) => {
    if (!folio) return;
    navigator.clipboard.writeText(folio);
    setCopiedFolio(true);
    setTimeout(() => setCopiedFolio(false), 2000);
  };

  const handleCopySummary = () => {
    if (!detailData) return;
    const summary = `DECLARACIÓN TRAZABILIDAD - TRAZALGA
Tipo: ${detailData.tipoNodo || '-'}
Folio: ${detailData.folio || '-'}
Fecha: ${formatDate(detailData.fecha)} ${detailData.hora || ''}
Cantidad: ${formatKg(detailData.cantidad)}
Actor: ${detailData.nombreActor || '-'} (RUT: ${detailData.rutActor || '-'})
Destinatario: ${detailData.nombreDestinatario || '-'}
Especie: ${detailData.especie || '-'}
Estado Humedad: ${detailData.estadoHumedad || '-'}
Ubicación: ${detailData.caleta || detailData.comuna || '-'}`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const getNumericTipo = (tipo) => {
    if (!tipo) return 1;
    const t = String(tipo).toLowerCase();
    if (t.includes('recolector')) return 1;
    if (t.includes('armador')) return 2;
    if (t.includes('area') || t.includes('área')) return 3;
    if (t.includes('comercializador')) return 4;
    if (t.includes('abastecimiento') || t.includes('planta')) return 5;
    if (t.includes('produccion') || t.includes('producción')) return 6;
    if (t.includes('destino')) return 7;
    return 1;
  };

  const formatKg = (val) => {
    if (val === null || val === undefined) return '0 kg';
    const num = Number(val);
    return isNaN(num) ? `${val} kg` : `${num.toLocaleString('es-CL')} kg`;
  };

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return String(d);
    }
  };

  const getNodeTheme = (tipoNodo = '') => {
    const t = String(tipoNodo).toLowerCase();
    if (t.includes('recolector')) {
      return {
        primary: '#0284c7', // Sky 600
        bgLight: '#f0f9ff',
        border: '#bae6fd',
        gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        badgeBg: '#e0f2fe',
        badgeColor: '#0369a1',
        icon: <PhishingIcon sx={{ fontSize: 16 }} />
      };
    }
    if (t.includes('armador')) {
      return {
        primary: '#0284c7',
        bgLight: '#f0f9ff',
        border: '#bae6fd',
        gradient: 'linear-gradient(135deg, #0284c7 0%, #075985 100%)',
        badgeBg: '#e0f2fe',
        badgeColor: '#0369a1',
        icon: <DirectionsBoatIcon sx={{ fontSize: 16 }} />
      };
    }
    if (t.includes('area') || t.includes('área') || t.includes('amerb')) {
      return {
        primary: '#0284c7',
        bgLight: '#f0f9ff',
        border: '#bae6fd',
        gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        badgeBg: '#e0f2fe',
        badgeColor: '#0369a1',
        icon: <NaturePeopleIcon sx={{ fontSize: 16 }} />
      };
    }
    if (t.includes('comercializador')) {
      return {
        primary: '#d97706', // Amber 600
        bgLight: '#fffbeb',
        border: '#fde68a',
        gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        badgeBg: '#fef3c7',
        badgeColor: '#b45309',
        icon: <LocalShippingIcon sx={{ fontSize: 16 }} />
      };
    }
    if (t.includes('planta')) {
      return {
        primary: '#059669', // Emerald 600
        bgLight: '#ecfdf5',
        border: '#a7f3d0',
        gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        badgeBg: '#d1fae5',
        badgeColor: '#047857',
        icon: <FactoryIcon sx={{ fontSize: 16 }} />
      };
    }
    return {
      primary: '#64748b',
      bgLight: '#f8fafc',
      border: '#e2e8f0',
      gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      badgeBg: '#f1f5f9',
      badgeColor: '#475569',
      icon: <AccountTreeIcon sx={{ fontSize: 16 }} />
    };
  };

  const createCustomMapIcon = (tipoNodo) => {
    const theme = getNodeTheme(tipoNodo);
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          background: ${theme.primary};
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  useEffect(() => {
    if (open && row) {
      setLoading(true);
      const tipo = getNumericTipo(row.tipoReporte || tipoReporte);
      api.get(`/reportes/trazabilidad/${tipo}/${declaracionId}`)
        .then(res => {
          buildFlowFromData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching trazabilidad", err);
          setNodes([]);
          setEdges([]);
          setLoading(false);
        });
    } else {
      setNodes([]);
      setEdges([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row]);

  const buildFlowFromData = (data) => {
    const flowNodes = [];
    const flowEdges = [];
    
    if (!data || !data.nodos) return;

    // Build Adjacency and In-Degree
    const adj = {};
    const inDegree = {};
    data.nodos.forEach(n => { 
      adj[n.idUnico] = []; 
      inDegree[n.idUnico] = 0; 
    });
    
    if (data.enlaces) {
      data.enlaces.forEach(e => {
        if (adj[e.source]) adj[e.source].push(e.target);
        if (inDegree[e.target] !== undefined) inDegree[e.target]++;
      });
    }

    // Determine root nodes (in-degree 0)
    let queue = Object.keys(inDegree).filter(k => inDegree[k] === 0);
    if (queue.length === 0 && data.nodos.length > 0) queue.push(data.nodos[0].idUnico);

    // Calculate depths (longest path)
    const depths = {};
    queue.forEach(k => { depths[k] = 0; });
    while (queue.length > 0) {
      let curr = queue.shift();
      (adj[curr] || []).forEach(child => {
        if (depths[child] === undefined) {
           depths[child] = depths[curr] + 1;
           queue.push(child);
        } else if (depths[curr] + 1 > depths[child]) {
           depths[child] = depths[curr] + 1;
           queue.push(child);
        }
      });
    }

    // Calculate counts per level for X positioning
    const levelCounts = {};
    data.nodos.forEach(n => { 
       const d = depths[n.idUnico] || 0;
       levelCounts[d] = (levelCounts[d] || 0) + 1;
    });

    const levelCurrent = {};

    data.nodos.forEach(n => {
      const d = depths[n.idUnico] || 0;
      levelCurrent[d] = (levelCurrent[d] || 0) + 1;
      
      const totalInLevel = levelCounts[d];
      const xOffset = totalInLevel > 1 ? (levelCurrent[d] - 1 - (totalInLevel - 1) / 2) * 270 : 0;
      const xPos = 250 + xOffset;
      const yPos = 40 + d * 230;
      
      const theme = getNodeTheme(n.tipoNodo);

      flowNodes.push({
        id: n.idUnico,
        position: { x: xPos, y: yPos },
        data: { 
          rawNode: n,
          label: (
            <Box 
              onClick={() => handleOpenDetail(n)}
              sx={{ 
                p: 1.5, 
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(248, 250, 252, 0.8)'
                }
              }}
            >
              {/* Top header badge */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                <Chip
                  size="small"
                  icon={theme.icon}
                  label={n.tipoNodo}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    bgcolor: theme.badgeBg,
                    color: theme.badgeColor,
                    border: `1px solid ${theme.border}`,
                    height: 22,
                    '& .MuiChip-icon': { color: theme.badgeColor }
                  }}
                />
                {n.folio && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontWeight: 800, 
                      color: theme.primary, 
                      fontSize: '0.72rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 100
                    }}
                  >
                    #{n.folio}
                  </Typography>
                )}
              </Box>

              {/* Actor Name */}
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 800, 
                  color: '#0f172a', 
                  fontSize: '0.82rem', 
                  lineHeight: 1.25, 
                  mb: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {n.nombreActor || 'Sin emisor especificado'}
              </Typography>

              {/* RUT */}
              {n.rutActor && (
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontSize: '0.7rem' }}>
                  RUT: {n.rutActor}
                </Typography>
              )}

              {/* Metrics pill: Kg y Fecha */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  bgcolor: '#f8fafc', 
                  p: 0.8, 
                  borderRadius: 1.5, 
                  border: '1px solid #f1f5f9',
                  mb: 1.2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScaleIcon sx={{ fontSize: 14, color: theme.primary }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.75rem' }}>
                    {formatKg(n.cantidad)}
                  </Typography>
                </Box>
                {n.fecha && (
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                    {formatDate(n.fecha)}
                  </Typography>
                )}
              </Box>

              {/* Botón Ver Detalle */}
              <Button
                size="small"
                fullWidth
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDetail(n);
                }}
                startIcon={<InfoOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                sx={{
                  py: 0.4,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 1.5,
                  bgcolor: theme.primary,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: theme.primary,
                    filter: 'brightness(0.92)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }
                }}
              >
                Ver Detalle Completo
              </Button>
            </Box>
          ) 
        },
        style: { 
          background: '#ffffff', 
          border: `2px solid ${theme.border}`,
          borderRadius: '14px',
          width: 235,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          cursor: 'pointer'
        }
      });
    });

    if (data.enlaces) {
      data.enlaces.forEach(e => {
        flowEdges.push({
          id: `edge-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          animated: true,
          style: { stroke: '#0284c7', strokeWidth: 2.2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#0284c7' }
        });
      });
    }

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  // Colectar todos los puntos GPS disponibles para el mapa y trazado de ruta
  const mapPoints = useMemo(() => {
    const list = [];
    if (row && row.latitud && row.longitud) {
      list.push({
        lat: Number(row.latitud),
        lng: Number(row.longitud),
        title: row.emisorNombre || 'Declaración Origen',
        rut: row.emisorRut,
        tipo: row.tipoReporte || 'Origen',
        folio: row.folio || row.folioOrigen,
        cantidad: row.desembarque || row.cantidad,
        rawNode: row
      });
    }

    nodes.forEach(nd => {
      const raw = nd.data?.rawNode;
      if (raw && raw.latitud && raw.longitud) {
        const isDup = list.some(p => Math.abs(p.lat - raw.latitud) < 0.0001 && Math.abs(p.lng - raw.longitud) < 0.0001);
        if (!isDup) {
          list.push({
            lat: Number(raw.latitud),
            lng: Number(raw.longitud),
            title: raw.nombreActor || raw.tipoNodo,
            rut: raw.rutActor,
            tipo: raw.tipoNodo,
            folio: raw.folio,
            cantidad: raw.cantidad,
            rawNode: raw
          });
        }
      }
    });

    return list;
  }, [row, nodes]);

  const mapCenter = useMemo(() => {
    if (mapPoints.length > 0) return [mapPoints[0].lat, mapPoints[0].lng];
    if (row?.latitud && row?.longitud) return [row.latitud, row.longitud];
    return [-41.4693, -72.9424];
  }, [mapPoints, row]);

  const activeTheme = detailData ? getNodeTheme(detailData.tipoNodo) : getNodeTheme('');

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth 
      PaperProps={{ 
        sx: { 
          borderRadius: 3.5, 
          overflow: 'hidden',
          height: isFullscreen ? '96vh' : '82vh',
          maxHeight: isFullscreen ? '98vh' : '900px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          bgcolor: '#0f172a',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        } 
      }}
    >
      {/* ========================================================================= */}
      {/* CABECERA PRINCIPAL MODERNA (SLATE NAVY CON GLASSMORPHISM Y CONTROLES) */}
      {/* ========================================================================= */}
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          py: 1.8, 
          px: 3, 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        {/* Título & Badge Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box 
            sx={{ 
              width: 44, 
              height: 44, 
              borderRadius: 2.5, 
              background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)', 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)'
            }}
          >
            <AccountTreeIcon />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.25rem' }, color: '#ffffff', lineHeight: 1.2 }}>
                Flujo de Trazabilidad Animado
              </Typography>
              {row?.folio && (
                <Chip 
                  size="small" 
                  label={`Folio #${row.folio}`} 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontWeight: 800, 
                    bgcolor: 'rgba(56, 189, 248, 0.15)', 
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    height: 22
                  }} 
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>
              Inspección interactiva de la cadena de custodia con geolocalización satelital
            </Typography>
          </Box>
        </Box>

        {/* Selector de Vistas (Grafo / Dividido / Mapa) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => { if (next) setViewMode(next); }}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 2.5,
              p: 0.4,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              '& .MuiToggleButton-root': {
                color: '#94a3b8',
                px: 1.6,
                py: 0.5,
                border: 'none',
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '0.72rem',
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: '#0284c7',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                  '&:hover': { bgcolor: '#0369a1' }
                },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }
              }
            }}
          >
            <ToggleButton value="split">
              <ViewSidebarIcon sx={{ fontSize: 16, mr: 0.6 }} />
              Dividido
            </ToggleButton>
            <ToggleButton value="graph">
              <AccountTreeIcon sx={{ fontSize: 16, mr: 0.6 }} />
              Solo Grafo
            </ToggleButton>
            <ToggleButton value="map">
              <MapIcon sx={{ fontSize: 16, mr: 0.6 }} />
              Solo Mapa
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Botón Fullscreen */}
          <Tooltip title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
            <IconButton
              onClick={() => setIsFullscreen(!isFullscreen)}
              sx={{ 
                color: '#94a3b8', 
                bgcolor: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': { color: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.15)' } 
              }}
            >
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Botón Cerrar */}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ 
              color: '#94a3b8', 
              bgcolor: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '&:hover': { color: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.15)' } 
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ========================================================================= */}
      {/* CONTENIDO INTERACTIVO (GRAFO Y/O MAPA SEGÚN VIEWMODE) */}
      {/* ========================================================================= */}
      <DialogContent sx={{ p: 0, flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Panel Izquierdo: ReactFlow Canvas */}
        {(viewMode === 'split' || viewMode === 'graph') && (
          <Box 
            sx={{ 
              flex: viewMode === 'split' ? '1 1 55%' : '1 1 100%', 
              borderRight: viewMode === 'split' ? '1px solid #e2e8f0' : 'none', 
              position: 'relative',
              bgcolor: '#f8fafc',
              height: '100%'
            }}
          >
            {/* Banner guía flotante */}
            <Box
              sx={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 5,
                bgcolor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(8px)',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                px: 1.6,
                py: 0.6,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 16, color: '#0284c7' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.73rem' }}>
                Haz clic en cualquier tarjeta para abrir su declaración completa
              </Typography>
            </Box>

            <ReactFlow 
              nodes={nodes} 
              edges={edges} 
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(event, node) => {
                if (node?.data?.rawNode) {
                  handleOpenDetail(node.data.rawNode);
                }
              }}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={1.2}
              attributionPosition="bottom-right"
            >
              <Background color="#cbd5e1" gap={18} size={1} />
              <Controls style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <MiniMap 
                nodeStrokeWidth={2} 
                zoomable 
                pannable 
                nodeColor={(n) => {
                  const tipo = n.data?.rawNode?.tipoNodo || '';
                  if (tipo.includes('Comercializador')) return '#d97706';
                  if (tipo.includes('Planta')) return '#059669';
                  return '#0284c7';
                }}
                style={{ 
                  borderRadius: 10, 
                  overflow: 'hidden', 
                  border: '1px solid #cbd5e1', 
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)', 
                  width: 140, 
                  height: 95, 
                  background: '#ffffff' 
                }} 
              />
            </ReactFlow>
          </Box>
        )}

        {/* Panel Derecho: Mapa Leaflet con Georreferenciación y Rutas */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <Box 
            sx={{ 
              flex: viewMode === 'split' ? '1 1 45%' : '1 1 100%', 
              position: 'relative',
              height: '100%',
              bgcolor: '#0f172a'
            }}
          >
            {/* Overlay flotante informativo en mapa */}
            <Box
              sx={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 1000,
                bgcolor: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 2.5,
                p: 1.4,
                color: '#ffffff',
                boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                maxWidth: 260
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 17, color: '#38bdf8' }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.72rem' }}>
                  Ruta Geográfica
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.3, fontSize: '0.7rem' }}>
                {mapPoints.length > 0 
                  ? `${mapPoints.length} punto(s) GPS trazado(s) en la costa`
                  : 'Ubicación referencial de la declaración consultada'}
              </Typography>
            </Box>

            <MapContainer 
              center={mapCenter} 
              zoom={row?.latitud ? 12 : 6} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
              />

              {/* Trazado de ruta conectando los puntos GPS de la cadena */}
              {mapPoints.length >= 2 && (
                <Polyline 
                  positions={mapPoints.map(p => [p.lat, p.lng])}
                  color="#0284c7"
                  weight={3.5}
                  dashArray="6, 8"
                  opacity={0.85}
                />
              )}

              {/* Marcadores de todos los hitos georreferenciados */}
              {mapPoints.map((p, idx) => (
                <Marker 
                  key={idx} 
                  position={[p.lat, p.lng]}
                  icon={createCustomMapIcon(p.tipo)}
                >
                  <Popup>
                    <Box sx={{ p: 0.5, minWidth: 170 }}>
                      <Chip 
                        size="small" 
                        label={p.tipo} 
                        sx={{ 
                          fontSize: '0.68rem', 
                          fontWeight: 700, 
                          height: 20, 
                          mb: 0.8,
                          bgcolor: getNodeTheme(p.tipo).badgeBg,
                          color: getNodeTheme(p.tipo).badgeColor,
                          border: `1px solid ${getNodeTheme(p.tipo).border}`
                        }} 
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.25, mb: 0.3 }}>
                        {p.title}
                      </Typography>
                      {p.rut && (
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                          RUT: {p.rut}
                        </Typography>
                      )}
                      {p.folio && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#0284c7', fontWeight: 800, display: 'block', mb: 0.5 }}>
                          Folio: #{p.folio}
                        </Typography>
                      )}
                      {p.cantidad && (
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', display: 'block', mb: 1 }}>
                          {formatKg(p.cantidad)}
                        </Typography>
                      )}
                      <Button
                        size="small"
                        fullWidth
                        variant="contained"
                        onClick={() => handleOpenDetail(p.rawNode)}
                        sx={{
                          py: 0.3,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: 1.5,
                          bgcolor: getNodeTheme(p.tipo).primary,
                          boxShadow: 'none'
                        }}
                      >
                        Ver Detalle Completo
                      </Button>
                    </Box>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Box>
        )}
      </DialogContent>

      {/* ========================================================================= */}
      {/* BARRA INFERIOR / FOOTER RIBBON (LEYENDA Y MÉTRICAS) */}
      {/* ========================================================================= */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          bgcolor: '#0f172a',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        {/* Leyenda Visual */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
            Eslabones:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#0284c7' }} />
            <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.72rem' }}>
              Origen (Recolector / Armador / AMERB)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#d97706' }} />
            <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.72rem' }}>
              Comercializador
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#059669' }} />
            <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.72rem' }}>
              Planta (Abastecimiento / Prod. / Destino)
            </Typography>
          </Box>
        </Box>

        {/* Resumen & Botón Cerrar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScaleIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Total Nodos en Red: <strong style={{ color: '#ffffff' }}>{nodes.length}</strong>
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={onClose}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 0.5,
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'none',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.22)'
              }
            }}
          >
            Cerrar Flujo
          </Button>
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* SUB-MODAL DE DETALLE COMPLETO DE LA DECLARACIÓN */}
      {/* ========================================================================= */}
      <Dialog 
        open={detailOpen} 
        onClose={handleCloseDetail} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 3.5, 
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
          } 
        }}
      >
        {detailData && (
          <>
            {/* Cabecera visual moderna con gradiente */}
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                color: '#ffffff', 
                p: { xs: 2.5, sm: 3 },
                position: 'relative',
                borderBottom: `4px solid ${activeTheme.primary}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box 
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 2.5, 
                      background: activeTheme.gradient,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                    }}
                  >
                    {activeTheme.icon}
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                      <Chip 
                        size="small" 
                        label={detailData.tipoNodo || 'DECLARACIÓN'} 
                        sx={{ 
                          fontWeight: 800, 
                          fontSize: '0.72rem', 
                          bgcolor: 'rgba(255, 255, 255, 0.15)', 
                          color: '#ffffff',
                          backdropFilter: 'blur(4px)',
                          letterSpacing: 0.5
                        }} 
                      />
                      <Chip 
                        size="small" 
                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#4ade80 !important' }} />}
                        label={detailData.estado || 'REGISTRADA'} 
                        sx={{ 
                          fontWeight: 700, 
                          fontSize: '0.7rem', 
                          bgcolor: 'rgba(74, 222, 128, 0.15)', 
                          color: '#4ade80',
                          border: '1px solid rgba(74, 222, 128, 0.3)'
                        }} 
                      />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.45rem' }, color: '#ffffff' }}>
                      Detalle de la Declaración
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#94a3b8', fontWeight: 600 }}>
                        Folio: <strong style={{ color: '#38bdf8' }}>{detailData.folio || 'Sin Folio'}</strong>
                      </Typography>
                      {detailData.folio && (
                        <Tooltip title={copiedFolio ? "¡Copiado!" : "Copiar Folio"}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyFolio(detailData.folio)} 
                            sx={{ color: copiedFolio ? '#4ade80' : '#94a3b8', p: 0.4 }}
                          >
                            {copiedFolio ? <CheckIcon fontSize="inherit" /> : <ContentCopyIcon fontSize="inherit" />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>
                
                <IconButton
                  aria-label="close"
                  onClick={handleCloseDetail}
                  sx={{ 
                    color: '#94a3b8', 
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    '&:hover': { color: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.15)' } 
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: '#f8fafc' }}>
              {/* Tarjetas KPI de Resumen Rápido */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2.5, 
                      border: '1px solid #e2e8f0', 
                      bgcolor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: activeTheme.primary }}>
                      <ScaleIcon fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Cantidad
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      {formatKg(detailData.cantidad)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Peso declarado
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2.5, 
                      border: '1px solid #e2e8f0', 
                      bgcolor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0284c7' }}>
                      <CalendarMonthIcon fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Fecha
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      {formatDate(detailData.fecha)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Hora: {detailData.hora || 'No reg.'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2.5, 
                      border: '1px solid #e2e8f0', 
                      bgcolor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#10b981' }}>
                      <SpaIcon fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Recurso
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {detailData.especie || 'No informada'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {detailData.estadoHumedad || 'Humedad s/d'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2.5, 
                      border: '1px solid #e2e8f0', 
                      bgcolor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6366f1' }}>
                      <AccountTreeIcon fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        ID Declaración
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      #{detailData.idDeclaracion || detailData.id || '-'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Tipo: {detailData.tipoNodo || '-'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Secciones detalladas en Cards */}
              <Grid container spacing={2.5}>
                {/* 1. Actores: Emisor y Destinatario */}
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2.5, 
                      borderRadius: 3, 
                      border: '1px solid #e2e8f0', 
                      bgcolor: '#ffffff',
                      height: '100%' 
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                      <PersonIcon color="primary" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Actor Emisor (Titular)
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                          NOMBRE O RAZÓN SOCIAL
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {detailData.nombreActor || 'No especificado'}
                        </Typography>
                      </Box>

                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            RUT EMISOR
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {detailData.rutActor || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            RPA / CÓDIGO SERNAPESCA
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {detailData.codigoSernapesca || '-'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                          ROL EN LA CADENA
                        </Typography>
                        <Chip 
                          size="small" 
                          label={detailData.tipoNodo || 'Actor'} 
                          sx={{ mt: 0.5, fontWeight: 700, bgcolor: activeTheme.bgLight, color: activeTheme.primary }} 
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* 2. Destinatario de la Carga */}
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2.5, 
                      borderRadius: 3, 
                      border: '1px solid #e2e8f0', 
                      bgcolor: '#ffffff',
                      height: '100%' 
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                      <BusinessIcon color="secondary" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Destinatario (Receptor)
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                          DESTINATARIO NOMBRADO
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {detailData.nombreDestinatario || 'Pendiente de asignación / Destino final'}
                        </Typography>
                      </Box>

                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            RUT / CÓDIGO RECEPTOR
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {detailData.rutDestinatario || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            EVENTO / DESCRIPCIÓN
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {detailData.descripcionEvento || 'Declaración en sistema'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Paper>
                </Grid>

                {/* 3. Detalles de Recurso y Ubicación */}
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2.5, 
                      borderRadius: 3, 
                      border: '1px solid #e2e8f0', 
                      bgcolor: '#ffffff',
                      height: '100%' 
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                      <LocationOnIcon sx={{ color: '#e11d48' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Ubicación y Georreferencia
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1.5}>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            CALETA / PLANTA / SECTOR
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {detailData.caleta || detailData.varaderoOAmerb || 'No informada'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            COMUNA / REGIÓN
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {[detailData.comuna, detailData.region].filter(Boolean).join(', ') || '-'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, border: '1px solid #f1f5f9' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5 }}>
                          COORDENADAS GPS CAPTURADAS
                        </Typography>
                        {detailData.latitud && detailData.longitud ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                              Lat: {detailData.latitud.toFixed(4)}, Lon: {detailData.longitud.toFixed(4)}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                              href={`https://www.google.com/maps?q=${detailData.latitud},${detailData.longitud}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ py: 0.2, px: 1, fontSize: '0.7rem', borderRadius: 1.5, textTransform: 'none' }}
                            >
                              Ver Mapa
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            Sin coordenadas GPS directas asociadas a la declaración
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* 4. Logística y Transporte */}
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2.5, 
                      borderRadius: 3, 
                      border: '1px solid #e2e8f0', 
                      bgcolor: '#ffffff',
                      height: '100%' 
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                      <LocalShippingIcon sx={{ color: '#d97706' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Transporte y Respaldo Legal
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1.5}>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            PATENTE CAMIÓN
                          </Typography>
                          {detailData.patente ? (
                            <Chip 
                              size="small" 
                              label={detailData.patente} 
                              sx={{ mt: 0.3, fontWeight: 800, bgcolor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }} 
                            />
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>-</Typography>
                          )}
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            PATENTE CARRO
                          </Typography>
                          {detailData.patenteCarro ? (
                            <Chip 
                              size="small" 
                              label={detailData.patenteCarro} 
                              sx={{ mt: 0.3, fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }} 
                            />
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>-</Typography>
                          )}
                        </Grid>
                      </Grid>

                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            CONDUCTOR / CHOFER
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {detailData.chofer || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            RUT CONDUCTOR
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {detailData.rutChofer || '-'}
                          </Typography>
                        </Grid>
                      </Grid>

                      {detailData.docNumero && (
                        <Box sx={{ bgcolor: '#f8fafc', p: 1.2, borderRadius: 2, border: '1px solid #f1f5f9' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            DOCUMENTO TRIBUTARIO ASOCIADO
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {detailData.docTipo || 'Doc'}: {detailData.docNumero} {detailData.docFecha ? `(${formatDate(detailData.docFecha)})` : ''}
                          </Typography>
                        </Box>
                      )}

                      {(detailData.embarcacion || detailData.buzo) && (
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                              EMBARCACIÓN
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                              {detailData.embarcacion || '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                              BUZO
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                              {detailData.buzo || '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      )}
                    </Stack>
                  </Paper>
                </Grid>

                {/* 5. Trazabilidad de Orígenes y Tokens */}
                {detailData.declaracionesSeleccionadas && (
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 3, 
                        border: '1px solid #e2e8f0', 
                        bgcolor: '#ffffff' 
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                        <AccountTreeIcon color="primary" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          Declaraciones de Origen Consumidas
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
                        Esta declaración consolidó y consumió las siguientes cargas previas en la cadena de custodia:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {detailData.declaracionesSeleccionadas.split(';').filter(Boolean).map((token, i) => (
                          <Chip 
                            key={i} 
                            label={token.trim()} 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, px: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={copiedSummary ? <CheckIcon /> : <ContentCopyIcon />}
                onClick={handleCopySummary}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 700,
                  color: copiedSummary ? '#10b981' : '#475569',
                  borderColor: copiedSummary ? '#10b981' : '#cbd5e1'
                }}
              >
                {copiedSummary ? "¡Resumen Copiado!" : "Copiar Ficha Resumida"}
              </Button>

              <Button
                variant="contained"
                onClick={handleCloseDetail}
                sx={{ 
                  borderRadius: 2, 
                  px: 3, 
                  fontWeight: 700, 
                  textTransform: 'none',
                  bgcolor: '#0f172a',
                  '&:hover': { bgcolor: '#1e293b' }
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Dialog>
  );
}
