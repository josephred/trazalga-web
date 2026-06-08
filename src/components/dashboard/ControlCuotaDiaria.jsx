import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  LinearProgress, 
  CircularProgress,
  Divider
} from '@mui/material';
import api from '../../api/axiosConfig';

export default function ControlCuotaDiaria({ dateRange }) {
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCuotas = async () => {
      try {
        let queryParams = '';
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          queryParams = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        }
        
        const response = await api.get(`/cuotas/dashboard-diario${queryParams}`);
        setCuotas(response.data);
      } catch (err) {
        console.error('Error fetching cuotas:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCuotas();
  }, [dateRange]);

  const getProgressColor = (porcentaje) => {
    if (porcentaje >= 100) return 'error'; // Rojo
    if (porcentaje >= 80) return 'warning'; // Naranja
    return 'success'; // Verde
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Control Cuota Diaria
          </Typography>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Control Cuota Diaria (Volumen Extraído vs Límite)
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {cuotas.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay cuotas diarias activas configuradas.
          </Typography>
        ) : (
          cuotas.map((cuota, index) => {
            // Asegurar que el porcentaje no sobrepase el 100% visualmente en la barra
            const displayPercentage = cuota.porcentajeUso > 100 ? 100 : cuota.porcentajeUso;
            
            return (
              <Box key={index} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {cuota.especieNombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cuota.volumenExtraido} / {cuota.limiteCuota} kg ({cuota.porcentajeUso}%)
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={displayPercentage} 
                  color={getProgressColor(cuota.porcentajeUso)}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
