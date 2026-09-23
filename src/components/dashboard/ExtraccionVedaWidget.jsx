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
  CardContent,
  Chip
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DownloadIcon from '@mui/icons-material/FileDownload';
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
      setDetalle(response.data || []);
    } catch (err) {
      console.error('Error fetching detalle veda:', err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const exportarCSV = () => {
    if (!detalle || detalle.length === 0) return;
    const headers = ['Folio', 'Tipo Declaracion', 'Declarante', 'RUT', 'Caleta', 'Comuna', 'Region', 'Especie', 'Metodo', 'Fecha Extraccion', 'Kilos', 'Resolucion Infringida'];
    const rows = detalle.map(d => [
      `"${d.folio || ('FAENA-' + d.id)}"`,
      `"${d.tipoDeclaracion || d.perfil || ''}"`,
      `"${d.nombreDeclarante || d.actor || ''}"`,
      `"${d.rut || ''}"`,
      `"${d.caleta || ''}"`,
      `"${d.comuna || ''}"`,
      `"${d.region || ''}"`,
      `"${d.especie || ''}"`,
      `"${d.metodo || ''}"`,
      `"${d.fechaExtraccion ? new Date(d.fechaExtraccion).toLocaleDateString('es-CL') : (d.fecha ? new Date(d.fecha).toLocaleDateString('es-CL') : '')}"`,
      d.kilos || d.kg || 0,
      `"${d.resolucion || ''}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `extraccion_veda_detalle_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            Extracción en Veda
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Declaraciones de extracción realizadas durante periodos de veda decretados (Incumplimiento Crítico).
        </Typography>
        
        <Divider sx={{ mb: 2.5, borderColor: hasInfractions ? 'error.light' : 'divider' }} />

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
                    color: hasInfractions ? 'error.main' : 'text.primary' 
                  }}
                >
                  {metrics.declaracionesVeda}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'Inter' }}>
                  Declaraciones
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    fontFamily: 'Outfit', 
                    color: hasInfractions ? 'error.main' : 'text.primary' 
                  }}
                >
                  {((metrics && metrics.totalKgVeda) || 0).toLocaleString('es-CL')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'Inter' }}>
                  Volumen (Kg)
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleOpenDetalle}
                sx={{ 
                  bgcolor: hasInfractions ? 'error.main' : 'primary.main',
                  '&:hover': {
                    bgcolor: hasInfractions ? 'error.dark' : 'primary.light',
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
                Ver Detalle Nominal de Infracciones
              </Button>
            </Box>
          </Box>
        )}

        {/* Modal de Detalle Nominal */}
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
          <DialogTitle sx={{ 
            fontWeight: 700, 
            fontFamily: 'Outfit', 
            color: 'text.primary', 
            bgcolor: 'background.default', 
            borderBottom: 1, 
            borderColor: 'divider', 
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                Detalle Nominal de Extracciones en Veda (R5.1)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                Total infractor: {metrics.declaracionesVeda} faenas · {((metrics && metrics.totalKgVeda) || 0).toLocaleString('es-CL')} kg
              </Typography>
            </Box>
            <Button
              startIcon={<DownloadIcon />}
              onClick={exportarCSV}
              disabled={detalle.length === 0}
              variant="outlined"
              size="small"
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontFamily: 'Outfit', 
                fontWeight: 600,
                borderColor: 'divider'
              }}
            >
              Exportar CSV
            </Button>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, borderColor: 'divider' }}>
            {loadingDetalle ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : detalle.length === 0 ? (
              <Typography sx={{ p: 4, color: 'text.secondary', fontFamily: 'Inter', textAlign: 'center' }}>
                No hay declaraciones en veda registradas para este periodo.
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 460 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', fontFamily: 'Outfit' }}>Folio</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', fontFamily: 'Outfit' }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', fontFamily: 'Outfit' }}>Declarante (RUT)</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', fontFamily: 'Outfit' }}>Caleta / Comuna</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', fontFamily: 'Outfit' }}>Especie</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', fontFamily: 'Outfit' }}>Método</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', fontFamily: 'Outfit' }}>Fecha Faena</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', fontFamily: 'Outfit' }} align="right">Desembarque (Kg)</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', fontFamily: 'Outfit' }}>Resolución</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.map((row, idx) => (
                      <TableRow 
                        key={row.id || idx}
                        hover
                        sx={{ 
                          '&:hover': { bgcolor: 'background.default' }, 
                          transition: 'background-color 0.2s ease' 
                        }}
                      >
                        <TableCell sx={{ py: 1.2, fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>
                          {row.folio || ('FAENA-' + row.id)}
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Inter', fontSize: '0.8rem' }}>
                          <Chip 
                            label={row.tipoDeclaracion || row.perfil} 
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Inter', fontSize: '0.8rem' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            {row.nombreDeclarante || row.actor}
                          </Typography>
                          {row.rut && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {row.rut}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Inter', fontSize: '0.8rem' }}>
                          {row.caleta || '—'} {row.comuna ? `(${row.comuna})` : ''}
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Inter', fontSize: '0.8rem', fontWeight: 600 }}>
                          {row.especie}
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Inter', fontSize: '0.8rem' }}>
                          <Chip 
                            label={row.metodo || 'General'} 
                            size="small" 
                            color={row.metodo === 'Barreteado' ? 'error' : 'default'}
                            variant="outlined"
                            sx={{ fontSize: '0.68rem', height: 20 }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Inter', fontSize: '0.8rem' }}>
                          {row.fechaExtraccion 
                            ? new Date(row.fechaExtraccion).toLocaleDateString('es-CL')
                            : (row.fecha ? new Date(row.fecha).toLocaleDateString('es-CL') : '—')}
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Outfit', fontWeight: 700, color: 'error.main', fontSize: '0.85rem' }} align="right">
                          {((row.kilos != null ? row.kilos : row.kg) || 0).toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Inter', fontSize: '0.75rem', color: 'text.secondary' }}>
                          {row.resolucion || 'Subpesca'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
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
