import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Button,
  Chip,
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
import ScheduleIcon from '@mui/icons-material/Schedule';
import api from '../../api/axiosConfig';

// Formatea horas como "3,5 h" o "2d 16h" cuando supera las 48 horas
const formatHoras = (horas) => {
  if (horas === null || horas === undefined) return '—';
  if (horas >= 48) {
    const dias = Math.floor(horas / 24);
    const resto = Math.round(horas % 24);
    return `${dias}d ${resto}h`;
  }
  return `${horas.toLocaleString('es-CL', { maximumFractionDigits: 1 })} h`;
};

export default function TiempoValidacionWidget({ dateRange }) {
  const [metrics, setMetrics] = useState({
    promedioHoras: null,
    maxHoras: null,
    validadas: 0,
    pendientes: 0,
    pendientesMas48h: 0,
    totalDeclaraciones: 0
  });
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
        const response = await api.get(`/reportes/tiempo-validacion${queryParams}`);
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tiempo validacion:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  const hasRiesgo = metrics.pendientesMas48h > 0;

  const handleOpenDetalle = async () => {
    setOpenModal(true);
    setLoadingDetalle(true);
    try {
      let queryParams = '';
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        queryParams = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      const response = await api.get(`/reportes/tiempo-validacion-detalle${queryParams}`);
      setDetalle(response.data);
    } catch (err) {
      console.error('Error fetching detalle tiempo validacion:', err);
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
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
          borderColor: '#cbd5e1',
        }
      }}
    >
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <ScheduleIcon sx={{ mr: 1, color: '#0ea5e9' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a' }}>
            Tiempo Extracción → Validación
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Horas entre la declaración de origen y su recepción por un comercializador (Riesgo Operacional).
        </Typography>

        <Divider sx={{ mb: 2.5, borderColor: '#f1f5f9' }} />

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', my: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: '#0f172a' }}>
                  {formatHoras(metrics.promedioHoras)}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', fontFamily: 'Inter' }}>
                  Promedio validación
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: '#0f172a' }}>
                  {metrics.validadas.toLocaleString('es-CL')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', fontFamily: 'Inter' }}>
                  Validadas
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontFamily: 'Outfit',
                    color: hasRiesgo ? '#f59e0b' : '#0f172a'
                  }}
                >
                  {metrics.pendientesMas48h.toLocaleString('es-CL')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: hasRiesgo ? '#b45309' : '#64748b', fontFamily: 'Inter' }}>
                  Pendientes &gt;48h
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleOpenDetalle}
                sx={{
                  bgcolor: '#0a192f',
                  '&:hover': { bgcolor: '#172a45' },
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontFamily: 'Outfit',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  boxShadow: 'none'
                }}
              >
                Ver Detalle de Tiempos
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
            Detalle Tiempo Extracción → Validación
            <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', mt: 0.5 }}>
              Las 50 validaciones más lentas y los 50 pendientes más antiguos (los pendientes se miden hasta ahora).
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, borderColor: '#f1f5f9' }}>
            {loadingDetalle ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : detalle.length === 0 ? (
              <Typography sx={{ p: 4, color: '#64748b', fontFamily: 'Inter', textAlign: 'center' }}>
                No hay declaraciones registradas para este periodo.
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Declarada</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Perfil</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Actor</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Especie</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }} align="right">Tiempo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.map((row) => (
                      <TableRow
                        key={`${row.perfil}-${row.id}`}
                        sx={{
                          '&:hover': { bgcolor: '#f8fafc' },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>
                          {new Date(row.fecha).toLocaleDateString('es-CL')} {row.hora ? row.hora.substring(0, 5) : ''}
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter', fontWeight: 600 }}>{row.perfil}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.actor}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.especie}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip
                            label={row.estado === 'VALIDADA' ? 'Validada' : 'Pendiente'}
                            size="small"
                            sx={{
                              fontFamily: 'Inter',
                              fontWeight: 600,
                              fontSize: '0.72rem',
                              bgcolor: row.estado === 'VALIDADA' ? '#f0fdf4' : '#fffbeb',
                              color: row.estado === 'VALIDADA' ? '#047857' : '#b45309',
                              border: '1px solid',
                              borderColor: row.estado === 'VALIDADA' ? '#bbf7d0' : '#fde68a'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Outfit', fontWeight: 700, color: row.estado === 'VALIDADA' ? '#0f172a' : '#b45309' }} align="right">
                          {formatHoras(row.horas)}
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
