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
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Scale as ScaleIcon,
  Warning as WarningIcon,
  CheckCircle as OkIcon,
  AccessTime as AccessTimeIcon,
  Warehouse as WarehouseIcon,
  WaterDrop as WaterIcon
} from '@mui/icons-material';
import { getTrazabilidadLote, getTrazabilidadLoteDetalle } from '../../services/reportesService';

export default function VariacionPesoWidget({ dateRange }) {
  const [metrics, setMetrics] = useState({
    totalLotes: 0,
    totalKgOrigen: 0,
    totalKgDestino: 0,
    promedioVariacionPct: 0,
    lotesEnBodegaVirtual: 0,
    alertasVariacion: 0,
    alertasMerma: 0,
    umbralVariacionPct: 5.0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [detalle, setDetalle] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const parseDates = () => {
    const filters = {};
    if (dateRange) {
      if (Array.isArray(dateRange)) {
        if (dateRange[0]) filters.startDate = typeof dateRange[0].format === 'function' ? dateRange[0].format('YYYY-MM-DD') : dateRange[0];
        if (dateRange[1]) filters.endDate = typeof dateRange[1].format === 'function' ? dateRange[1].format('YYYY-MM-DD') : dateRange[1];
      } else {
        if (dateRange.startDate) filters.startDate = dateRange.startDate;
        if (dateRange.endDate) filters.endDate = dateRange.endDate;
      }
    }
    return filters;
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const filters = parseDates();
        const data = await getTrazabilidadLote(filters);
        setMetrics(data || {});
        setError(null);
      } catch (err) {
        console.error('Error fetching trazabilidad por lote:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  const hasAlertas = (metrics?.alertasVariacion || 0) > 0 || (metrics?.alertasMerma || 0) > 0;

  const handleOpenDetalle = async () => {
    setOpenModal(true);
    setLoadingDetalle(true);
    try {
      const filters = parseDates();
      const res = await getTrazabilidadLoteDetalle(filters);
      setDetalle(res || []);
    } catch (err) {
      console.error('Error fetching detalle trazabilidad lote:', err);
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
        bgcolor: 'background.paper',
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ScaleIcon sx={{ mr: 1, color: hasAlertas ? 'error.main' : '#8b5cf6' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
              Variación de Peso y Cadena de Custodia (Indicador 6)
            </Typography>
          </Box>
          {metrics?.bioPerdidaActivo === false && (
            <Chip
              label="Merma Biológica Inactiva"
              size="small"
              color="default"
              sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
            />
          )}
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Trazabilidad por lote (folio origen) desde la extracción hasta la planta de destino. Umbral general de alerta: ±{metrics.umbralVariacionPct || 5.0}%
          {metrics?.bioPerdidaActivo === false
            ? ' · [Control de merma biológica desactivado en Administración]'
            : ' y consistencia biológica de mermas en tránsito.'}
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
                  {((metrics && metrics.totalLotes) || 0).toLocaleString('es-CL')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'Inter' }}>
                  Lotes Trazados
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                  {metrics.promedioVariacionPct !== null && metrics.promedioVariacionPct !== undefined
                    ? `${metrics.promedioVariacionPct > 0 ? '+' : ''}${metrics.promedioVariacionPct}%`
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
                  {(metrics.alertasVariacion || 0) + (metrics.alertasMerma || 0)}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: hasAlertas ? '#b91c1c' : 'text.secondary', fontFamily: 'Inter' }}>
                  Alertas de Cadena
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
                Ver Detalle de Trazabilidad de Lotes
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
            Trazabilidad por Lote (Folio Origen) y Cadena de Custodia
            <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', mt: 0.5 }}>
              Seguimiento Origen &rarr; Comercializador &rarr; Planta. Incluye estado de humedad, días transcurridos y evaluación de consistencia biológica.
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, borderColor: 'divider' }}>
            {metrics?.bioPerdidaActivo === false && (
              <Box sx={{ p: 1.5, px: 3, bgcolor: 'rgba(245, 158, 11, 0.08)', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                  Nota: El control de merma biológica esperada por humedad está desactivado en Administración (parámetro <code>bio_perdida_activo = false</code>).
                </Typography>
              </Box>
            )}
            {loadingDetalle ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : detalle.length === 0 ? (
              <Typography sx={{ p: 4, color: 'text.secondary', fontFamily: 'Inter', textAlign: 'center' }}>
                No hay lotes con trazabilidad registrados para este periodo.
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 460 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Folio Origen</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Origen (Actor / Tipo)</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Especie / Humedad</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Kg Origen</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Kg Comercializador</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Kg Planta</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">&Delta; Peso (%)</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Tránsito / Bodega</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Estado / Alertas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{row.folioOrigen}</TableCell>
                        <TableCell sx={{ fontSize: '0.82rem' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{row.actorOrigen}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.eslabonOrigen} {row.embarcacion ? `(${row.embarcacion})` : ''}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem' }}>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{row.especie}</Typography>
                          <Chip label={row.humedadOrigen} size="small" sx={{ fontSize: '0.68rem', height: 18, mt: 0.3 }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }} align="right">{row.kgOrigen?.toLocaleString('es-CL')}</TableCell>
                        <TableCell sx={{ fontSize: '0.82rem' }} align="right">{row.kgComercializador ? row.kgComercializador.toLocaleString('es-CL') : '—'}</TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'secondary.main' }} align="right">{row.kgPlanta ? row.kgPlanta.toLocaleString('es-CL') : '—'}</TableCell>
                        <TableCell
                          sx={{
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: row.alertaVariacion ? 'error.main' : 'text.primary'
                          }}
                          align="right"
                        >
                          {row.deltaPct > 0 ? `+${row.deltaPct}%` : `${row.deltaPct}%`}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }} align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{row.diasTranscurridos} d viaje</Typography>
                            {row.diasEnBodega > 0 && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>{row.diasEnBodega} d bodega</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                            {row.alertaMerma && (
                              <Tooltip title={row.motivoMerma || 'Merma inconsistente'}>
                                <Chip label="Merma Anómala" size="small" color="error" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />
                              </Tooltip>
                            )}
                            {row.alertaVariacion && (
                              <Chip label="Fuera Umbral" size="small" color="warning" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />
                            )}
                            {!row.alertaMerma && !row.alertaVariacion && (
                              <Chip label="OK" size="small" color="success" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ fontFamily: 'Inter' }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
