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
import ScaleIcon from '@mui/icons-material/Scale';
import api from '../../api/axiosConfig';

const ESLABON_LABEL = {
  'ORIGEN-COMERCIALIZADOR': 'Origen a Comercializador',
  'COMERCIALIZADOR-PLANTA': 'Comercializador a Planta',
  RECOLECTOR: 'Recolector (pesaje)',
  ARMADOR: 'Armador (pesaje)',
  AREA: 'Área Manejo (pesaje)',
  COMERCIALIZADOR: 'Comercializador (pesaje)'
};

export default function VariacionPesoWidget({ dateRange }) {
  const [metrics, setMetrics] = useState({
    totalConciliaciones: 0,
    promedioVariacionPct: null,
    fueraUmbral: 0,
    pesajes: 0,
    documentos: 0,
    umbralPct: 5
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
        const response = await api.get(`/reportes/variacion-peso${queryParams}`);
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching variacion de peso:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  const hasAlertas = metrics.fueraUmbral > 0;

  const handleOpenDetalle = async () => {
    setOpenModal(true);
    setLoadingDetalle(true);
    try {
      let queryParams = '';
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        queryParams = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      const response = await api.get(`/reportes/variacion-peso-detalle${queryParams}`);
      setDetalle(response.data);
    } catch (err) {
      console.error('Error fetching detalle variacion peso:', err);
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
        borderColor: hasAlertas ? 'error.light' : 'divider',
        background: hasAlertas
          ? (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(180deg, #450a0a 0%, #1e293b 100%)' : 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)'
          : 'background.paper',
        boxShadow: hasAlertas
          ? '0 10px 15px -3px rgba(239, 68, 68, 0.04)'
          : '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: hasAlertas
            ? '0 12px 25px -3px rgba(239, 68, 68, 0.08)'
            : '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
          borderColor: hasAlertas ? 'error.main' : 'divider',
        }
      }}
    >
      {hasAlertas && (
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

      <CardContent sx={{ p: 3, pl: hasAlertas ? 4 : 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <ScaleIcon sx={{ mr: 1, color: hasAlertas ? 'error.main' : '#8b5cf6' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
            Variación de Peso
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Diferencia entre lo declarado en origen y lo recepcionado en destino, por pesaje y por conciliación de documentos. Umbral de alerta: ±{metrics.umbralPct}% (Posible Adulteración).
        </Typography>

        <Divider sx={{ mb: 2.5, borderColor: hasAlertas ? 'error.light' : 'divider' }} />

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', my: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                  {((metrics && metrics.totalConciliaciones) || 0).toLocaleString('es-CL')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'Inter' }}>
                  Conciliaciones
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                  {metrics.promedioVariacionPct !== null && metrics.promedioVariacionPct !== undefined
                    ? `${((metrics && metrics.promedioVariacionPct) || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`
                    : '—'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'Inter' }}>
                  Variación promedio
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontFamily: 'Outfit',
                    color: hasAlertas ? 'error.main' : 'text.primary'
                  }}
                >
                  {((metrics && metrics.fueraUmbral) || 0).toLocaleString('es-CL')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: hasAlertas ? '#b91c1c' : 'text.secondary', fontFamily: 'Inter' }}>
                  Fuera de umbral
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleOpenDetalle}
                sx={{
                  bgcolor: hasAlertas ? 'error.main' : 'primary.main',
                  '&:hover': { bgcolor: hasAlertas ? 'error.dark' : 'primary.light' },
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontFamily: 'Outfit',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  boxShadow: 'none'
                }}
              >
                Ver Detalle de Variaciones
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
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', p: 3 }}>
            Detalle de Variaciones de Peso
            <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', mt: 0.5 }}>
              Ordenado por mayor variación absoluta. Máximo 100 registros.
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, borderColor: 'divider' }}>
            {loadingDetalle ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : detalle.length === 0 ? (
              <Typography sx={{ p: 4, color: 'text.secondary', fontFamily: 'Inter', textAlign: 'center' }}>
                No hay conciliaciones de peso registradas para este periodo.
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Eslabón</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Actor</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Especie</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }} align="right">Origen (kg)</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }} align="right">Destino (kg)</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }} align="right">Δ%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.map((row, idx) => {
                      const fueraUmbral = row.variacionPct !== null && Math.abs(row.variacionPct) > metrics.umbralPct;
                      return (
                        <TableRow
                          key={idx}
                          sx={{
                            '&:hover': { bgcolor: 'background.default' },
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{new Date(row.fecha).toLocaleDateString('es-CL')}</TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <Chip
                              label={ESLABON_LABEL[row.eslabon] || row.eslabon}
                              size="small"
                              sx={{
                                fontFamily: 'Inter',
                                fontWeight: 600,
                                fontSize: '0.72rem',
                                bgcolor: row.tipoRegistro === 'PESAJE' ? '#eff6ff' : '#f5f3ff',
                                color: row.tipoRegistro === 'PESAJE' ? '#1d4ed8' : '#6d28d9',
                                border: '1px solid',
                                borderColor: row.tipoRegistro === 'PESAJE' ? '#bfdbfe' : '#ddd6fe'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.actor}</TableCell>
                          <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.especie}</TableCell>
                          <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }} align="right">
                            {((row && row.kgOrigen) || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 })}
                          </TableCell>
                          <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }} align="right">
                            {((row && row.kgDestino) || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 })}
                          </TableCell>
                          <TableCell
                            sx={{
                              py: 1.5,
                              fontFamily: 'Outfit',
                              fontWeight: 700,
                              color: fueraUmbral ? 'error.main' : 'text.primary'
                            }}
                            align="right"
                          >
                            {row && row.variacionPct > 0 ? '+' : ''}{((row && row.variacionPct) || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 })}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
