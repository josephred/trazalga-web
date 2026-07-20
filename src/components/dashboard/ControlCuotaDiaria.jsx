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

  // Colores y fondos explícitos y refinados para las barras de progreso
  const getProgressColors = (porcentaje) => {
    if (porcentaje >= 100) return { bar: 'error.main', bg: '#fef2f2', label: '#b91c1c' }; // Rojo
    if (porcentaje >= 80) return { bar: 'warning.main', bg: '#fffbeb', label: '#b45309' }; // Naranja/Amber
    return { bar: 'success.main', bg: '#f0fdf4', label: '#047857' }; // Verde
  };

  if (loading) {
    return (
      <Card 
        elevation={0}
        sx={{ 
          height: '100%', 
          borderRadius: 4, 
          border: 1, borderColor: 'divider',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 250 
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  if (error) {
    return (
      <Card 
        elevation={0}
        sx={{ 
          height: '100%', 
          borderRadius: 4, 
          border: 1, borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', mb: 2 }}>
            Control Cuota Diaria
          </Typography>
          <Typography color="error" sx={{ fontFamily: 'Inter', fontSize: '0.9rem' }}>{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        borderRadius: 4, 
        border: 1, borderColor: 'divider',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
          borderColor: 'divider',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
            Control de Cuotas
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
                displayEmpty
                slotProps={{
                  input: {
                    sx: { borderRadius: 3, fontFamily: 'Inter', fontSize: '0.85rem' }
                  }
                }}
              >
                <MenuItem value="RECOLECTOR" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Recolector</MenuItem>
                <MenuItem value="ARMADOR" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Armador</MenuItem>
                <MenuItem value="AREA" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Área Manejo</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                displayEmpty
                slotProps={{
                  input: {
                    sx: { borderRadius: 3, fontFamily: 'Inter', fontSize: '0.85rem' }
                  }
                }}
              >
                <MenuItem value="DIARIO" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Diario</MenuItem>
                <MenuItem value="SEMANAL" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Semanal</MenuItem>
                <MenuItem value="MENSUAL" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Mensual</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Divider sx={{ mb: 3, borderColor: 'divider' }} />
        
        {cuotas.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
              No hay cuotas activas configuradas para este perfil/periodo.
            </Typography>
          </Box>
        ) : (
          cuotas.map((cuota, index) => {
            const displayPercentage = cuota.porcentajeUso > 100 ? 100 : cuota.porcentajeUso;
            const colors = getProgressColors(cuota.porcentajeUso);
            
            return (
              <Box key={index} sx={{ mb: 3, '&:last-child': { mb: 1 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'baseline' }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
                      {cuota.especieNombre}
                    </Typography>
                    {cuota.alcance && cuota.alcance !== 'Global' && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'Inter',
                          color: 'text.secondary',
                          bgcolor: 'divider',
                          border: 1, borderColor: 'divider',
                          borderRadius: 2,
                          px: 1,
                          py: 0.1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 180
                        }}
                        title={cuota.alcance}
                      >
                        {cuota.alcance}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: 'Inter', fontSize: '0.825rem', color: 'text.secondary' }}>
                    {cuota.volumenExtraido?.toLocaleString('es-CL')} / {cuota.limiteCuota?.toLocaleString('es-CL')} kg{' '}
                    <span style={{ fontWeight: 700, color: colors.label }}>
                      ({cuota.porcentajeUso}%)
                    </span>
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={displayPercentage} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    bgcolor: 'divider',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: colors.bar,
                    }
                  }}
                />
              </Box>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
