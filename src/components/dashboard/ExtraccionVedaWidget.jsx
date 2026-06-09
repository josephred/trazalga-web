import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../../api/axiosConfig';

export default function ExtraccionVedaWidget({ dateRange }) {
  const [metrics, setMetrics] = useState({ declaracionesVeda: 0, totalKgVeda: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      )}
    </Paper>
  );
}
