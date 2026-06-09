import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  LinearProgress, 
  CircularProgress,
  Divider,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import api from '../../api/axiosConfig';

export default function ControlCuotaDiaria({ dateRange }) {
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState('DIARIO');
  const [perfil, setPerfil] = useState('RECOLECTOR');

  useEffect(() => {
    const fetchCuotas = async () => {
      try {
        const params = new URLSearchParams();
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          params.append('startDate', dateRange.startDate);
          params.append('endDate', dateRange.endDate);
        }
        params.append('periodo', periodo);
        params.append('perfil', perfil);
        
        const response = await api.get(`/cuotas/dashboard-diario?${params.toString()}`);
        setCuotas(response.data);
      } catch (err) {
        console.error('Error fetching cuotas:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCuotas();
  }, [dateRange, periodo, perfil]);

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Control Cuota (Volumen Extraído vs Límite)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
                displayEmpty
              >
                <MenuItem value="RECOLECTOR">Recolector</MenuItem>
                <MenuItem value="ARMADOR">Armador</MenuItem>
                <MenuItem value="AREA">Área de Manejo</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                displayEmpty
              >
                <MenuItem value="DIARIO">Diario</MenuItem>
                <MenuItem value="SEMANAL">Semanal</MenuItem>
                <MenuItem value="MENSUAL">Mensual</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
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
