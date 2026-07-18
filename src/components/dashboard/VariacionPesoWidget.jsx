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
        borderColor: hasAlertas ? '#fca5a5' : '#e2e8f0',
        background: hasAlertas
          ? 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)'
          : '#ffffff',
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
          borderColor: hasAlertas ? '#ef4444' : '#cbd5e1',
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
            bgcolor: '#ef4444'
          }}
        />
      )}

      <CardContent sx={{ p: 3, pl: hasAlertas ? 4 : 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <ScaleIcon sx={{ mr: 1, color: hasAlertas ? '#ef4444' : '#8b5cf6' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a' }}>
            Variación de Peso
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Diferencia entre lo declarado en origen y lo recepcionado en destino, por pesaje y por conciliación de documentos. Umbral de alerta: ±{metrics.umbralPct}% (Posible Adulteración).
        </Typography>

        <Divider sx={{ mb: 2.5, borderColor: hasAlertas ? '#fee2e2' : '#f1f5f9' }} />

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', my: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: '#0f172a' }}>
                  {((metrics && metrics.totalConciliaciones) || 0).toLocaleString('es-CL')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', fontFamily: 'Inter' }}>
                  Conciliaciones
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: '#0f172a' }}>
                  {metrics.promedioVariacionPct !== null && metrics.promedioVariacionPct !== undefined
                    ? `${((metrics && metrics.promedioVariacionPct) || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`
                    : '—'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', fontFamily: 'Inter' }}>
                  Variación promedio
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontFamily: 'Outfit',
                    color: hasAlertas ? '#ef4444' : '#0f172a'
                  }}
                >
                  {((metrics && metrics.fueraUmbral) || 0).toLocaleString('es-CL')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: hasAlertas ? '#b91c1c' : '#64748b', fontFamily: 'Inter' }}>
                  Fuera de umbral
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleOpenDetalle}
                sx={{
                  bgcolor: hasAlertas ? '#ef4444' : '#0a192f',
                  '&:hover': { bgcolor: hasAlertas ? '#dc2626' : '#172a45' },
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
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a', bgcolor: '#fbfbfb', borderBottom: '1px solid #f1f5f9', p: 3 }}>
            Detalle de Variaciones de Peso
            <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', mt: 0.5 }}>
              Ordenado por mayor variación absoluta. Máximo 100 registros.
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, borderColor: '#f1f5f9' }}>
            {loadingDetalle ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : detalle.length === 0 ? (
              <Typography sx={{ p: 4, color: '#64748b', fontFamily: 'Inter', textAlign: 'center' }}>
                No hay conciliaciones de peso registradas para este periodo.
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Eslabón</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Actor</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }}>Especie</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }} align="right">Origen (kg)</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }} align="right">Destino (kg)</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', fontFamily: 'Outfit', borderBottom: '2px solid #e2e8f0' }} align="right">Δ%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.map((row, idx) => {
                      const fueraUmbral = row.variacionPct !== null && Math.abs(row.variacionPct) > metrics.umbralPct;
                      return (
                        <TableRow
                          key={idx}
                          sx={{
                            '&:hover': { bgcolor: '#f8fafc' },
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
                              color: fueraUmbral ? '#ef4444' : '#0f172a'
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
