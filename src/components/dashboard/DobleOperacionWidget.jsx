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

export default function DobleOperacionWidget({ dateRange }) {
  const [metrics, setMetrics] = useState({ totalCoincidencias: 0, detalle: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        let queryParams = '';
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          queryParams = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        }
        
        const response = await api.get(`/reportes/doble-operacion${queryParams}`);
        setMetrics(response.data);
      } catch (err) {
        console.error('Error fetching doble operacion metrics:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  const hasInfractions = metrics.totalCoincidencias > 0;
  const detalle = metrics.detalle || [];

  const handleOpenDetalle = () => {
    setOpenModal(true);
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

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4, 
        border: '1px solid',
        borderColor: hasInfractions ? 'error.light' : 'divider',
        background: hasInfractions 
          ? (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(180deg, #450a0a 0%, #1e293b 100%)' : 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)' 
          : 'background.paper',
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
          borderColor: hasInfractions ? 'error.main' : 'divider',
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
            bgcolor: 'error.main'
          }}
        />
      )}

      <CardContent sx={{ p: 3, pl: hasInfractions ? 4 : 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <WarningAmberIcon sx={{ mr: 1, color: hasInfractions ? 'error.main' : 'warning.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
            Doble Operación (ALA / AMERB)
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Posibles duplicidades: mismo actor, especie y día declarados en Área de Libre Acceso y en Área de Manejo con volúmenes similares (revisión del fiscalizador).
        </Typography>
        
        <Divider sx={{ mb: 2.5, borderColor: hasInfractions ? 'error.light' : 'divider' }} />

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    fontFamily: 'Outfit', 
                    color: hasInfractions ? 'error.main' : 'text.primary' 
                  }}
                >
                  {metrics.totalCoincidencias}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'Inter' }}>
                  Coincidencias sospechosas
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleOpenDetalle}
                disabled={metrics.totalCoincidencias === 0}
                sx={{ 
                  bgcolor: hasInfractions ? 'error.main' : 'primary.main',
                  '&:hover': {
                    bgcolor: hasInfractions ? 'error.dark' : 'primary.light',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'divider',
                    color: 'text.disabled'
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
                Ver Detalle
              </Button>
            </Box>
          </Box>
        )}

        {/* Modal de Detalle */}
        <Dialog 
          open={openModal} 
          onClose={() => setOpenModal(false)} 
          maxWidth="lg" 
          fullWidth
          slotProps={{
            paper: {
              sx: { borderRadius: 4, overflow: 'hidden' }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', p: 3 }}>
            Detalle de Coincidencias Sospechosas
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, borderColor: 'divider' }}>
            {detalle.length === 0 ? (
              <Typography sx={{ p: 4, color: 'text.secondary', fontFamily: 'Inter', textAlign: 'center' }}>
                No se detectaron posibles dobles operaciones para este periodo.
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Actor</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Especie</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Origen ALA</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }} align="right">Kg ALA</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }} align="right">Kg AMERB</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }} align="right">Δ%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.map((row) => (
                      <TableRow 
                        key={`${row.tipoAla}-${row.alaId}-${row.areaId}`}
                        sx={{ 
                          '&:hover': { bgcolor: 'background.default' }, 
                          transition: 'background-color 0.2s ease' 
                        }}
                      >
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{new Date(row.fecha).toLocaleDateString('es-CL')}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>
                          {row.actor}
                          <Typography variant="caption" display="block" sx={{ color: 'text.disabled' }}>
                            {row.rut}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.especie}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.tipoAla}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Outfit', fontWeight: 600 }} align="right">
                          {((row && row.kgAla) || 0).toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Outfit', fontWeight: 600 }} align="right">
                          {((row && row.kgAmerb) || 0).toLocaleString('es-CL')}
                          <Typography variant="caption" display="block" sx={{ color: 'text.disabled', fontFamily: 'Inter', fontWeight: 400 }}>
                            {row.amerb}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Outfit', fontWeight: 700, color: 'error.main' }} align="right">
                          {row.variacionPct > 0 ? `+${row.variacionPct}` : row.variacionPct}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
            <Button 
              onClick={() => setOpenModal(false)}
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                textTransform: 'none',
                color: 'text.secondary'
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
