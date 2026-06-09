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

export default function TrazabilidadDialog({ open, onClose, declaracionId, tipoReporte }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && declaracionId && tipoReporte) {
      fetchTrazabilidad(declaracionId, tipoReporte);
    } else {
      setNodes([]);
      setEdges([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, declaracionId, tipoReporte]);

  const fetchTrazabilidad = async (id, tipo) => {
    setLoading(true);
    try {
      const tipoId = getTipoId(tipo);
      if (!tipoId) {
        console.error("Tipo de reporte no reconocido", tipo);
        setLoading(false);
        return;
      }
      
      const { data } = await api.get(`/reportes/trazabilidad/${tipoId}/${id}`);
      
      // Mapear los datos a Nodos y Edges de React Flow
      const flowNodes = [];
      const flowEdges = [];

      // Como actualmente la API devuelve un nodo, crearemos un nodo falso de destino si es recolector/armador
      // para mostrar la animación de la flecha, o dibujaremos solo el nodo devuelto.
      
      data.forEach((nodo, index) => {
        // Posición X fija (centro), Posición Y calculada por índice para ir de arriba a abajo
        flowNodes.push({
          id: `node-${nodo.idDeclaracion}`,
          position: { x: 250, y: 50 + (index * 200) },
          data: { 
            label: (
              <div style={{ padding: '10px', textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{nodo.tipoNodo}</strong>
                <span style={{ fontSize: '12px', color: '#555' }}>{nodo.nombreActor}</span>
                <br/>
                <span style={{ fontSize: '10px', color: '#888' }}>{nodo.folio} | {nodo.cantidad} kg</span>
              </div>
            ) 
          },
          style: { 
            background: '#fff', 
            border: `2px solid ${getColorCode(nodo.tipoNodo)}`,
            borderRadius: '8px',
            width: 200,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }
        });

        // Si tuvieramos un array de la cadena completa, conectaríamos el nodo N con el N+1:
        if (index > 0) {
          flowEdges.push({
            id: `edge-${data[index-1].idDeclaracion}-${nodo.idDeclaracion}`,
            source: `node-${data[index-1].idDeclaracion}`,
            target: `node-${nodo.idDeclaracion}`,
            animated: true,
            style: { stroke: '#1976d2', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#1976d2',
            },
          });
        }
      });

      // ---- MOCK PARA EFECTO VISUAL SI SOLO HAY 1 NODO ----
      if (data.length === 1) {
        const n = data[0];
        let destinoNombre = "Destino pendiente";
        if (n.tipoNodo.includes("Recolector") || n.tipoNodo.includes("Armador")) destinoNombre = "Comercializador / Planta";
        else if (n.tipoNodo.includes("Comercializador")) destinoNombre = "Planta Destino";
        
        flowNodes.push({
          id: `node-mock-dest`,
          position: { x: 250, y: 250 },
          data: { label: <div><strong>{destinoNombre}</strong><br/><span style={{fontSize:'10px'}}>Próximo eslabón...</span></div> },
          style: { background: '#f5f5f5', border: '2px dashed #ccc', borderRadius: '8px', width: 200 }
        });

        flowEdges.push({
          id: `edge-mock`,
          source: `node-${n.idDeclaracion}`,
          target: `node-mock-dest`,
          animated: true,
          style: { stroke: '#aaa', strokeWidth: 2, strokeDasharray: '5 5' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#aaa' }
        });
      }

      setNodes(flowNodes);
      setEdges(flowEdges);

    } catch (error) {
      console.error("Error al obtener trazabilidad", error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoId = (tipo) => {
    switch (tipo) {
      case "Recolector": return 1;
      case "Armador": return 2;
      case "Área de Manejo": return 3;
      case "Comercializador": return 4;
      case "Planta Abastecimiento": return 5;
      case "Planta Producción": return 6;
      case "Planta Destino": return 7;
      default: return null;
    }
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
