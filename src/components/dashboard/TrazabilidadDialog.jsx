import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Box, 
  CircularProgress,
  Typography,
  Button,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const handleOpenDetail = (data) => {
    setDetailData(data);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
  };

  const getNumericTipo = (tipo) => {
    if (!tipo) return 1;
    const t = tipo.toLowerCase();
    if (t.includes('recolector')) return 1;
    if (t.includes('armador')) return 2;
    if (t.includes('area') || t.includes('área')) return 3;
    if (t.includes('comercializador')) return 4;
    if (t.includes('abastecimiento')) return 5;
    if (t.includes('produccion') || t.includes('producción')) return 6;
    if (t.includes('destino')) return 7;
    return 1;
  };

  useEffect(() => {
    if (open && row) {
      const tipo = getNumericTipo(row.tipoReporte || tipoReporte);
      api.get(`/reportes/trazabilidad/${tipo}/${declaracionId}`)
        .then(res => {
          buildFlowFromData(res.data, row);
        })
        .catch(err => {
          console.error("Error fetching trazabilidad", err);
          // Fallback al menos
          setNodes([]);
          setEdges([]);
        });
    } else {
      setNodes([]);
      setEdges([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row]);

  const buildFlowFromData = (data, r) => {
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
      // Center nodes in the level
      const xOffset = totalInLevel > 1 ? (levelCurrent[d] - 1 - (totalInLevel - 1) / 2) * 250 : 0;
      const xPos = 250 + xOffset;
      const yPos = 50 + d * 220;
      
      const color = getColorCode(n.tipoNodo);

      flowNodes.push({
        id: n.idUnico,
        position: { x: xPos, y: yPos },
        data: { 
          label: (
            <div style={{ padding: '10px', textAlign: 'center' }}>
              <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{n.tipoNodo}</strong>
              {n.folio && <span style={{ fontSize: '11px', color: '#1976d2', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>Folio: {n.folio}</span>}
              <span style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>{n.nombreActor}</span>
              {n.fecha && <span style={{ fontSize: '10px', color: '#888', display: 'block', marginTop: '4px' }}>{new Date(n.fecha).toLocaleDateString()}</span>}
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenDetail(n); }}
                style={{
                  marginTop: '8px',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Ver Detalle
              </button>
            </div>
          ) 
        },
        style: { 
          background: '#fff', 
          border: `2px solid ${color}`,
          borderRadius: '8px',
          width: 200,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
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
          style: { stroke: '#1976d2', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2' }
        });
      });
    }

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const getColorCode = (tipoNodo) => {
    if (tipoNodo.includes("Recolector") || tipoNodo.includes("Armador") || tipoNodo.includes("Área")) return "#1976d2"; // blue
    if (tipoNodo.includes("Comercializador")) return "#ed6c02"; // orange
    if (tipoNodo.includes("Planta")) return "#2e7d32"; // green
    return "#757575"; // grey
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Flujo de Trazabilidad Animado
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ height: '60vh', p: 0, display: 'flex' }}>
        <Box sx={{ flex: 1, borderRight: '1px solid #ddd', position: 'relative' }}>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={1.2}
            attributionPosition="bottom-right"
          >
            <Background color="#ccc" gap={16} />
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          </ReactFlow>
        </Box>
        <Box sx={{ flex: 1, position: 'relative' }}>
          {row ? (
            <MapContainer 
              center={[row.latitud || -41.4693, row.longitud || -72.9424]} 
              zoom={row.latitud ? 13 : 5} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <Marker position={[row.latitud || -41.4693, row.longitud || -72.9424]}>
                <Popup>
                  <strong>{row.emisorNombre}</strong><br/>
                  Rut: {row.emisorRut}<br/>
                  Declaración: {row.tipoReporte}<br/>
                  {!row.latitud && <span style={{color: 'red', fontSize: '10px'}}>(Ubicación de prueba)</span>}
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
              <Typography>Cargando mapa...</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Sub-modal para mostrar el detalle de la declaración */}
      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle>
          Detalle de la Declaración
          <IconButton
            aria-label="close"
            onClick={handleCloseDetail}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1"><strong>Folio:</strong> {detailData.folio}</Typography>
              <Typography variant="body1"><strong>Fecha:</strong> {detailData.fecha ? new Date(detailData.fecha).toLocaleDateString() : '-'}</Typography>
              <Typography variant="body1"><strong>Cantidad:</strong> {detailData.cantidad} kg</Typography>
              <Typography variant="body1"><strong>Tipo de Nodo:</strong> {detailData.tipoNodo}</Typography>
              <Typography variant="body1"><strong>Actor:</strong> {detailData.nombreActor} ({detailData.rutActor})</Typography>
              <Typography variant="body1"><strong>Evento:</strong> {detailData.descripcionEvento}</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
