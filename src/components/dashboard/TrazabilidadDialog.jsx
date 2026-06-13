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

  useEffect(() => {
    if (open && row) {
      buildFlowFromRow(row);
    } else {
      setNodes([]);
      setEdges([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row]);

  const buildFlowFromRow = (r) => {
    const flowNodes = [];
    const flowEdges = [];
    let yPos = 50;

    const createNode = (id, title, actor, date, color, folioData) => {
      flowNodes.push({
        id: id,
        position: { x: 250, y: yPos },
        data: { 
          label: (
            <div style={{ padding: '10px', textAlign: 'center' }}>
              <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{title}</strong>
              {folioData && <span style={{ fontSize: '11px', color: '#1976d2', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>Folio: {folioData}</span>}
              <span style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>{actor}</span>
              {date && <span style={{ fontSize: '10px', color: '#888', display: 'block', marginTop: '4px' }}>{new Date(date).toLocaleDateString()}</span>}
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenDetail(r); }}
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
      yPos += 220;
    };

    const createEdge = (sourceId, targetId) => {
      flowEdges.push({
        id: `edge-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        animated: true,
        style: { stroke: '#1976d2', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2' }
      });
    };

    // 1. Emisor
    createNode('n1', r.tipoReporte, `${r.emisorNombre} (${r.emisorRut})`, r.fecha, '#1976d2', r.folio);

    // 2. Receptor
    let receptorType = "Receptor";
    if (r.tipoReporte === 'Recolector' || r.tipoReporte === 'Armador') receptorType = "Comercializador";
    else if (r.tipoReporte === 'Comercializador') receptorType = "Planta Abastecimiento";
    
    createNode('n2', receptorType, `${r.receptorNombre} (${r.receptorRut})`, null, '#ed6c02', null);
    createEdge('n1', 'n2');

    let lastNodeId = 'n2';

    // 3. Planta Abastecimiento Extendida
    if (r.plantaAbastecimiento && r.plantaAbastecimiento !== '-') {
      createNode('n3', 'Planta Abastecimiento', r.plantaAbastecimiento, r.fechaComercializador, '#2e7d32', r.folioRelacionado);
      createEdge(lastNodeId, 'n3');
      lastNodeId = 'n3';
    }

    // 4. Planta Producción Extendida
    if (r.plantaProduccion && r.plantaProduccion !== '-') {
      createNode('n4', 'Planta Producción', r.plantaProduccion, r.fechaPlantaAbastecimiento, '#2e7d32', null);
      createEdge(lastNodeId, 'n4');
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
          {row && row.latitud && row.longitud ? (
            <MapContainer center={[row.latitud, row.longitud]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[row.latitud, row.longitud]}>
                <Popup>
                  <strong>{row.emisorNombre}</strong><br/>
                  Rut: {row.emisorRut}<br/>
                  Declaración: {row.tipoReporte}
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
              <Typography>Geolocalización no disponible para esta declaración.</Typography>
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
              <Typography variant="body1"><strong>Especie:</strong> {detailData.especie}</Typography>
              <Typography variant="body1"><strong>Composición:</strong> {detailData.composicion || '-'}</Typography>
              <Typography variant="body1"><strong>Estado Humedad:</strong> {detailData.estadoHumedad || '-'}</Typography>
              <Typography variant="body1"><strong>Emisor:</strong> {detailData.emisorNombre} ({detailData.emisorRut})</Typography>
              <Typography variant="body1"><strong>Receptor:</strong> {detailData.receptorNombre} ({detailData.receptorRut})</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
