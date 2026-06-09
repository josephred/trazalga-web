import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../../api/axiosConfig';

export default function ExtraccionVedaWidget({ dateRange }) {
  const [metrics, setMetrics] = useState({ declaracionesVeda: 0, totalKgVeda: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openModal, setOpenModal] = useState(false);
  const [detalle, setDetalle] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        let queryParams = '';
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          queryParams = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        }
        
        const response = await api.get(`/reportes/extraccion-veda${queryParams}`);
        setMetrics(response.data);
      } catch (err) {
        console.error('Error fetching extraccion en veda metrics:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  const hasInfractions = metrics.declaracionesVeda > 0;

  const handleOpenDetalle = async () => {
    setOpenModal(true);
    setLoadingDetalle(true);
    try {
      let queryParams = '';
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        queryParams = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      const response = await api.get(`/reportes/extraccion-veda-detalle${queryParams}`);
      setDetalle(response.data);
    } catch (err) {
      console.error('Error fetching detalle veda:', err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: hasInfractions ? 'error.light' : 'background.paper',
        color: hasInfractions ? 'error.contrastText' : 'text.primary',
        transition: 'background-color 0.3s ease',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <WarningAmberIcon sx={{ mr: 1, color: hasInfractions ? 'inherit' : 'warning.main' }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
          Extracción en Veda
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
        Declaraciones de extracción realizadas durante un periodo de veda (Incumplimiento Crítico).
      </Typography>
      
      <Divider sx={{ mb: 2, bgcolor: hasInfractions ? 'rgba(255,255,255,0.2)' : 'divider' }} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress color={hasInfractions ? 'inherit' : 'primary'} />
        </Box>
      ) : error ? (
        <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
          {error}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexGrow: 1, mt: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {metrics.declaracionesVeda}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.9 }}>
                Declaraciones
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {metrics.totalKgVeda.toLocaleString('es-CL')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.9 }}>
                Volumen (Kg)
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              color={hasInfractions ? 'inherit' : 'primary'}
              size="small"
              onClick={handleOpenDetalle}
              sx={{ color: hasInfractions ? 'error.main' : 'inherit' }}
            >
              Ver detalle
            </Button>
          </Box>
        </Box>
      )}

      {/* Modal Detalle */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de Extracciones en Veda</DialogTitle>
        <DialogContent dividers>
          {loadingDetalle ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : detalle.length === 0 ? (
            <Typography>No hay declaraciones en veda registradas para este periodo.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Perfil</strong></TableCell>
                    <TableCell><strong>Actor</strong></TableCell>
                    <TableCell><strong>Especie</strong></TableCell>
                    <TableCell align="right"><strong>Volumen (Kg)</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalle.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.fecha).toLocaleDateString('es-CL')}</TableCell>
                      <TableCell>{row.perfil}</TableCell>
                      <TableCell>{row.actor}</TableCell>
                      <TableCell>{row.especie}</TableCell>
                      <TableCell align="right">{row.kg.toLocaleString('es-CL')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

    </Paper>
  );
}
