import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Typography, 
  Box, 
  CircularProgress,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
  TimelineDot
} from '@mui/lab';

import SetMealIcon from '@mui/icons-material/SetMeal';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FactoryIcon from '@mui/icons-material/Factory';
import PersonIcon from '@mui/icons-material/Person';

import api from '../../api/axiosConfig';

export default function TrazabilidadDialog({ open, onClose, declaracionId, tipoReporte }) {
  const [nodos, setNodos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && declaracionId && tipoReporte) {
      fetchTrazabilidad(declaracionId, tipoReporte);
    } else {
      setNodos([]);
    }
  }, [open, declaracionId, tipoReporte]);

  const fetchTrazabilidad = async (id, tipo) => {
    setLoading(true);
    try {
      // "tipoReporte" es una variable string (ej: "Recolector"). 
      // El backend recibe un Integer. Necesitamos mapearlo.
      const tipoId = getTipoId(tipo);
      if (!tipoId) {
        console.error("Tipo de reporte no reconocido", tipo);
        setLoading(false);
        return;
      }
      
      const { data } = await api.get(`/reportes/trazabilidad/${tipoId}/${id}`);
      setNodos(data);
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

  const getIcon = (tipoNodo) => {
    if (tipoNodo.includes("Recolector") || tipoNodo.includes("Armador") || tipoNodo.includes("Área")) return <SetMealIcon />;
    if (tipoNodo.includes("Comercializador")) return <LocalShippingIcon />;
    if (tipoNodo.includes("Planta")) return <FactoryIcon />;
    return <PersonIcon />;
  };

  const getColor = (tipoNodo) => {
    if (tipoNodo.includes("Recolector") || tipoNodo.includes("Armador") || tipoNodo.includes("Área")) return "primary";
    if (tipoNodo.includes("Comercializador")) return "warning";
    if (tipoNodo.includes("Planta")) return "success";
    return "grey";
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Línea de Trazabilidad
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Timeline position="alternate">
            {nodos.map((nodo, index) => (
              <TimelineItem key={index}>
                <TimelineOppositeContent
                  sx={{ m: 'auto 0' }}
                  align="right"
                  variant="body2"
                  color="text.secondary"
                >
                  {nodo.fecha ? new Date(nodo.fecha).toLocaleDateString() : ''}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineConnector />
                  <TimelineDot color={getColor(nodo.tipoNodo)}>
                    {getIcon(nodo.tipoNodo)}
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Paper elevation={3} sx={{ p: 2 }}>
                    <Typography variant="h6" component="span">
                      {nodo.tipoNodo}
                    </Typography>
                    <Typography>{nodo.nombreActor}</Typography>
                    <Typography variant="body2" color="textSecondary">RUT: {nodo.rutActor}</Typography>
                    <Typography variant="body2" color="textSecondary">Folio: {nodo.folio}</Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                      Cantidad: {nodo.cantidad} kg
                    </Typography>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
            {nodos.length === 0 && !loading && (
              <Typography align="center" color="textSecondary">No se encontró historial de trazabilidad.</Typography>
            )}
          </Timeline>
        )}
      </DialogContent>
    </Dialog>
  );
}
