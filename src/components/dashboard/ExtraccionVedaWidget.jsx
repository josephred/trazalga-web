import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Card,
  CardContent
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

  if (loading) {
    return (
      <Card 
        elevation={0}
        sx={{ 
          height: '100%', 
          borderRadius: 4, 
          border: '1px solid #e2e8f0',
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

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4, 
        border: '1px solid',
        borderColor: hasInfractions ? '#fca5a5' : '#e2e8f0',
        background: hasInfractions 
          ? 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)' 
          : '#ffffff',
        boxShadow: hasInfractions 
          ? '0 10px 15px -3px rgba(239, 68, 68, 0.04)' 
          : '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: hasInfractions
            ? '0 12px 25px -3px rgba(239, 68, 68, 0.08)'
            : '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
          borderColor: hasInfractions ? '#ef4444' : '#cbd5e1',
        }
      }}
    >
      {/* Borde izquierdo rojo para denotar advertencia crítica */}
      {hasInfractions && (
        <Box 
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            bgcolor: '#ef4444'
          }}
        />
      )}

      <CardContent sx={{ p: 3, pl: hasInfractions ? 4 : 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <WarningAmberIcon sx={{ mr: 1, color: hasInfractions ? '#ef4444' : '#f59e0b' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a' }}>
            Extracción en Veda
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Declaraciones de extracción realizadas durante periodos de veda decretados (Incumplimiento Crítico).
        </Typography>
        
        <Divider sx={{ mb: 2.5, borderColor: hasInfractions ? '#fee2e2' : '#f1f5f9' }} />

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', my: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    fontFamily: 'Outfit', 
                    color: hasInfractions ? '#ef4444' : '#0f172a' 
                  }}
                >
                  {metrics.declaracionesVeda}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', fontFamily: 'Inter' }}>
                  Declaraciones
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    fontFamily: 'Outfit', 
                    color: hasInfractions ? '#ef4444' : '#0f172a' 
                  }}
                >
                  {metrics.totalKgVeda.toLocaleString('es-CL')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', fontFamily: 'Inter' }}>
                  Volumen (Kg)
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleOpenDetalle}
                sx={{ 
                  bgcolor: hasInfractions ? '#ef4444' : '#0a192f',
                  '&:hover': {
                    bgcolor: hasInfractions ? '#dc2626' : '#172a45',
                  },
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontFamily: 'Outfit',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  boxShadow: 'none'
                }}
              >
                Ver Detalle de Infracciones
              </Button>
            </Box>
          </Box>
        )}

        {/* Modal de Detalle */}
        <Dialog 
          open={openModal} 
          onClose={() => setOpenModal(false)} 
          maxWidth="md" 
          fullWidth
          slotProps={{
            paper: {
              sx: { borderRadius: 4, overflow: 'hidden' }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a', bgcolor: '#fbfbfb', borderBottom: '1px solid #f1f5f9', p: 3 }}>
            Detalle de Extracciones en Veda
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, borderColor: '#f1f5f9' }}>
            {loadingDetalle ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : detalle.length === 0 ? (
              <Typography sx={{ p: 4, color: '#64748b', fontFamily: 'Inter', textAlign: 'center' }}>
                No hay declaraciones en veda registradas para este periodo.
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Perfil</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Actor</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Especie</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }} align="right">Volumen (Kg)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.map((row) => (
                      <TableRow 
                        key={row.id}
                        sx={{ 
                          '&:hover': { bgcolor: '#f8fafc' }, 
                          transition: 'background-color 0.2s ease' 
                        }}
                      >
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{new Date(row.fecha).toLocaleDateString('es-CL')}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter', fontWeight: 600 }}>{row.perfil}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.actor}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.especie}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Outfit', fontWeight: 700, color: '#ef4444' }} align="right">
                          {row.kg.toLocaleString('es-CL')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, bgcolor: '#fbfbfb', borderTop: '1px solid #f1f5f9' }}>
            <Button 
              onClick={() => setOpenModal(false)}
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                textTransform: 'none',
                color: '#64748b'
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
