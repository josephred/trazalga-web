import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Box, 
  CircularProgress,
  Typography
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

import api from '../../api/axiosConfig';

export default function TrazabilidadDialog({ open, onClose, declaracionId, tipoReporte, row }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

    const createNode = (id, title, actor, date, color) => {
      flowNodes.push({
        id: id,
        position: { x: 250, y: yPos },
        data: { 
          label: (
            <div style={{ padding: '10px', textAlign: 'center' }}>
              <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{title}</strong>
              <span style={{ fontSize: '12px', color: '#555' }}>{actor}</span>
              <br/>
              {date && <span style={{ fontSize: '10px', color: '#888' }}>{new Date(date).toLocaleDateString()}</span>}
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
      yPos += 150;
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
    createNode('n1', r.tipoReporte, `${r.emisorNombre} (${r.emisorRut})`, r.fecha, '#1976d2');

    // 2. Receptor
    let receptorType = "Receptor";
    if (r.tipoReporte === 'Recolector' || r.tipoReporte === 'Armador') receptorType = "Comercializador";
    else if (r.tipoReporte === 'Comercializador') receptorType = "Planta Abastecimiento";
    
    createNode('n2', receptorType, `${r.receptorNombre} (${r.receptorRut})`, null, '#ed6c02');
    createEdge('n1', 'n2');

    let lastNodeId = 'n2';

    // 3. Planta Abastecimiento Extendida
    if (r.plantaAbastecimiento && r.plantaAbastecimiento !== '-') {
      createNode('n3', 'Planta Abastecimiento', r.plantaAbastecimiento, r.fechaComercializador, '#2e7d32');
      createEdge(lastNodeId, 'n3');
      lastNodeId = 'n3';
    }

    // 4. Planta Producción Extendida
    if (r.plantaProduccion && r.plantaProduccion !== '-') {
      createNode('n4', 'Planta Producción', r.plantaProduccion, r.fechaPlantaAbastecimiento, '#2e7d32');
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
      <DialogContent dividers sx={{ height: '60vh', p: 0 }}>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#ccc" gap={16} />
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          </ReactFlow>
      </DialogContent>
    </Dialog>
  );
}
