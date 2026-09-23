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
  Tooltip,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import {
  Scale as ScaleIcon,
  Warning as WarningIcon,
  CheckCircle as OkIcon,
  ReceiptLong as VoucherIcon,
  Description as DocumentIcon,
  Biotech as BioIcon
} from '@mui/icons-material';
import {
  getVariacionPeso,
  getVariacionPesoDetalle,
  getTrazabilidadLote,
  getTrazabilidadLoteDetalle
} from '../../services/reportesService';

export default function VariacionPesoWidget({ dateRange }) {
  const [metrics, setMetrics] = useState({
    umbralPct: 5.0,
    totalConciliaciones: 0,
    promedioVariacionPct: null,
    fueraUmbral: 0,
    pesajes: 0,
    documentos: 0,
    pesaje: { total: 0, promedioVariacionPct: null, fueraUmbral: 0 },
    documental: { total: 0, promedioVariacionPct: null, fueraUmbral: 0 },
    consolidado: { totalConciliaciones: 0, promedioVariacionPct: null, fueraUmbral: 0 }
  });
  const [loteMetrics, setLoteMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [tabModal, setTabModal] = useState(0);
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // TODOS | PESAJE | DOCUMENTO
  const [conciliacionesDetalle, setConciliacionesDetalle] = useState([]);
  const [lotesDetalle, setLotesDetalle] = useState([]);
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
        const [pesoData, loteData] = await Promise.all([
          getVariacionPeso(filters),
          getTrazabilidadLote(filters)
        ]);

        const safePeso = pesoData || {};
        const safePesaje = safePeso.pesaje ? {
          total: safePeso.pesaje.total ?? safePeso.pesajes ?? 0,
          promedioVariacionPct: (safePeso.pesaje.total > 0 || safePeso.pesajes > 0)
            ? (safePeso.pesaje.promedioVariacionPct ?? null)
            : null,
          fueraUmbral: safePeso.pesaje.fueraUmbral ?? 0
        } : {
          total: safePeso.pesajes || 0,
          promedioVariacionPct: safePeso.pesajes > 0 ? (safePeso.promedioPesajesPct ?? null) : null,
          fueraUmbral: 0
        };
        const safeDocumental = safePeso.documental ? {
          total: safePeso.documental.total ?? safePeso.documentos ?? 0,
          promedioVariacionPct: (safePeso.documental.total > 0 || safePeso.documentos > 0)
            ? (safePeso.documental.promedioVariacionPct ?? safePeso.promedioVariacionPct ?? null)
            : null,
          fueraUmbral: safePeso.documental.fueraUmbral ?? safePeso.fueraUmbral ?? 0
        } : {
          total: safePeso.documentos || 0,
          promedioVariacionPct: safePeso.documentos > 0 ? (safePeso.promedioVariacionPct ?? null) : null,
          fueraUmbral: safePeso.fueraUmbral || 0
        };
        const safeConsolidado = safePeso.consolidado || {
          totalConciliaciones: safePeso.totalConciliaciones || ((safePesaje.total || 0) + (safeDocumental.total || 0)),
          promedioVariacionPct: safePeso.totalConciliaciones > 0 ? (safePeso.promedioVariacionPct ?? null) : null,
          fueraUmbral: safePeso.fueraUmbral || 0
        };

        setMetrics({
          ...safePeso,
          pesaje: safePesaje,
          documental: safeDocumental,
          consolidado: safeConsolidado
        });
        setLoteMetrics(loteData || {});
        setError(null);
      } catch (err) {
        console.error('Error fetching métricas de variación de peso:', err);
        setError(err.message || 'Error al obtener métricas');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  const hasAlertas = (metrics?.fueraUmbral || 0) > 0 || (metrics?.pesaje?.fueraUmbral || 0) > 0;

  const handleOpenDetalle = async () => {
    setOpenModal(true);
    setLoadingDetalle(true);
    try {
      const filters = parseDates();
      const [detallesPeso, detallesLotes] = await Promise.all([
        getVariacionPesoDetalle(filters),
        getTrazabilidadLoteDetalle(filters)
      ]);
      setConciliacionesDetalle(detallesPeso || []);
      setLotesDetalle(detallesLotes || []);
    } catch (err) {
      console.error('Error fetching detalle conciliaciones:', err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const conciliacionesFiltradas = conciliacionesDetalle.filter(row => {
    if (filtroTipo === 'TODOS') return true;
    return (row.tipoRegistro || '').toUpperCase() === filtroTipo;
  });

  if (loading) {
    return (
      <Card
        elevation={0}
        sx={{
          height: '100%',
          borderRadius: 4,
          border: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 280
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
        {/* Cabecera del Indicador */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScaleIcon sx={{ color: hasAlertas ? 'error.main' : '#8b5cf6' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
              Variación en Peso (Indicador 6)
            </Typography>
          </Box>
          <Chip
            label={`Tolerancia ±${metrics.umbralPct || 5.0}%`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.72rem', height: 24 }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'Inter', lineHeight: 1.5 }}>
          Control de mermas y adulteración física. Se auditan dos poblaciones independientes: <strong>Pesaje físico en romana</strong> (vinculante) vs <strong>Conciliación documental</strong> (cruce de guías).
        </Typography>

        <Divider sx={{ mb: 2.5, borderColor: hasAlertas ? 'error.light' : 'divider' }} />

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
            {/* Dos Poblaciones de Control R6.1 */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {/* Población 1: Pesaje Físico en Romana */}
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: '1.5px solid',
                    borderColor: 'primary.light',
                    bgcolor: 'rgba(59, 130, 246, 0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'primary.dark' }}>
                        Pesaje en Romana
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                        Báscula certificada con voucher
                      </Typography>
                    </Box>
                    <Chip
                      label="VINCULANTE"
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5 }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                        {metrics.pesaje?.total || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                        Pesajes Físicos
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          fontFamily: 'Outfit',
                          color: metrics.pesaje?.promedioVariacionPct != null && Math.abs(metrics.pesaje.promedioVariacionPct) > (metrics.umbralPct || 5.0) ? 'error.main' : 'text.primary'
                        }}
                      >
                        {metrics.pesaje?.promedioVariacionPct !== null && metrics.pesaje?.promedioVariacionPct !== undefined
                          ? `${metrics.pesaje.promedioVariacionPct > 0 ? '+' : ''}${metrics.pesaje.promedioVariacionPct}%`
                          : '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                        Promedio Variación
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                      Fuera de umbral:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: (metrics.pesaje?.fueraUmbral || 0) > 0 ? 'error.main' : 'success.main'
                      }}
                    >
                      {metrics.pesaje?.fueraUmbral || 0} alertas
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Población 2: Conciliación Documental */}
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(100, 116, 139, 0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                        Conciliación Documental
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                        Cruce declarativo de guías
                      </Typography>
                    </Box>
                    <Chip
                      label="CRUCE GUÍAS"
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, color: 'text.secondary' }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5 }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                        {metrics.documental?.total || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                        Documentos
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          fontFamily: 'Outfit',
                          color: metrics.documental?.promedioVariacionPct != null && Math.abs(metrics.documental.promedioVariacionPct) > (metrics.umbralPct || 5.0) ? 'warning.main' : 'text.primary'
                        }}
                      >
                        {metrics.documental?.promedioVariacionPct !== null && metrics.documental?.promedioVariacionPct !== undefined
                          ? `${metrics.documental.promedioVariacionPct > 0 ? '+' : ''}${metrics.documental.promedioVariacionPct}%`
                          : '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                        Promedio Variación
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                      Fuera de umbral:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: (metrics.documental?.fueraUmbral || 0) > 0 ? 'warning.main' : 'text.secondary'
                      }}
                    >
                      {metrics.documental?.fueraUmbral || 0} alertas
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Total Consolidado y Botón de Detalle */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: 1, borderColor: 'divider', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                Total Consolidado: <strong>{(metrics.consolidado?.totalConciliaciones || metrics.totalConciliaciones || 0).toLocaleString('es-CL')}</strong> conciliaciones
                {' '}({metrics.pesaje?.total || 0} pesajes + {metrics.documental?.total || 0} documentos)
              </Typography>

              <Button
                variant="contained"
                onClick={handleOpenDetalle}
                size="small"
                sx={{
                  bgcolor: hasAlertas ? 'error.main' : 'primary.main',
                  '&:hover': { bgcolor: hasAlertas ? 'error.dark' : 'primary.dark' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontFamily: 'Outfit',
                  fontWeight: 600,
                  px: 2.5,
                  py: 0.8,
                  boxShadow: 'none'
                }}
              >
                Auditoría y Detalle Nominal
              </Button>
            </Box>
          </Box>
        )}

        {/* Modal de Detalle con Doble Pestaña: Conciliaciones vs Trazabilidad */}
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
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
                  Auditoría de Variación de Peso y Consistencia Biológica
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                  Separación formal entre pesaje físico en báscula/romana y cruce documental de declaraciones.
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 3 }}>
            <Tabs value={tabModal} onChange={(_, val) => setTabModal(val)} sx={{ '& .MuiTab-root': { fontFamily: 'Outfit', fontWeight: 700, textTransform: 'none' } }}>
              <Tab icon={<ScaleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Conciliaciones de Peso (${conciliacionesDetalle.length})`} />
              <Tab icon={<BioIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Trazabilidad por Lote y Merma Biológica (${lotesDetalle.length})`} />
            </Tabs>
          </Box>

          <DialogContent dividers sx={{ p: 0, borderColor: 'divider' }}>
            {loadingDetalle ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : tabModal === 0 ? (
              /* Pestaña 0: Conciliaciones de Peso (Pesaje vs Documental) */
              <Box>
                <Box sx={{ p: 1.5, px: 3, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                    Filtrar por tipo de conciliación:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`Todos (${conciliacionesDetalle.length})`}
                      size="small"
                      clickable
                      color={filtroTipo === 'TODOS' ? 'primary' : 'default'}
                      onClick={() => setFiltroTipo('TODOS')}
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                    <Chip
                      icon={<VoucherIcon sx={{ fontSize: 14 }} />}
                      label={`Pesaje en Romana (${conciliacionesDetalle.filter(c => c.tipoRegistro === 'PESAJE').length})`}
                      size="small"
                      clickable
                      color={filtroTipo === 'PESAJE' ? 'primary' : 'default'}
                      onClick={() => setFiltroTipo('PESAJE')}
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                    <Chip
                      icon={<DocumentIcon sx={{ fontSize: 14 }} />}
                      label={`Documental (${conciliacionesDetalle.filter(c => c.tipoRegistro === 'DOCUMENTO').length})`}
                      size="small"
                      clickable
                      color={filtroTipo === 'DOCUMENTO' ? 'primary' : 'default'}
                      onClick={() => setFiltroTipo('DOCUMENTO')}
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  </Box>
                </Box>

                {conciliacionesFiltradas.length === 0 ? (
                  <Typography sx={{ p: 4, color: 'text.secondary', fontFamily: 'Inter', textAlign: 'center' }}>
                    No se encontraron conciliaciones con el filtro seleccionado.
                  </Typography>
                ) : (
                  <TableContainer sx={{ maxHeight: 460 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Tipo</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Eslabón</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Fecha</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Actor / Titular</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Especie</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Kg Origen</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Kg Destino / Romana</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Variación (%)</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Voucher Romana</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {conciliacionesFiltradas.map((row, idx) => {
                          const fuera = Math.abs(row.variacionPct || 0) > (metrics.umbralPct || 5.0);
                          const esPesaje = row.tipoRegistro === 'PESAJE';
                          return (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                <Chip
                                  label={row.tipoRegistro}
                                  size="small"
                                  color={esPesaje ? 'primary' : 'default'}
                                  variant={esPesaje ? 'filled' : 'outlined'}
                                  sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{row.eslabon}</TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                {row.fecha ? new Date(row.fecha).toLocaleDateString('es-CL') : '—'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem' }}>{row.actor || '—'}</TableCell>
                              <TableCell sx={{ fontSize: '0.82rem' }}>{row.especie || '—'}</TableCell>
                              <TableCell sx={{ fontSize: '0.82rem' }} align="right">
                                {row.kgOrigen ? row.kgOrigen.toLocaleString('es-CL') : '—'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem', fontWeight: 700, color: esPesaje ? 'primary.main' : 'text.primary' }} align="right">
                                {row.kgDestino ? row.kgDestino.toLocaleString('es-CL') : '—'}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: '0.85rem',
                                  fontWeight: 800,
                                  color: fuera ? 'error.main' : 'text.primary'
                                }}
                                align="right"
                              >
                                {row.variacionPct !== null && row.variacionPct !== undefined
                                  ? `${row.variacionPct > 0 ? '+' : ''}${row.variacionPct}%`
                                  : '0.0%'}
                              </TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                                {row.voucherRomanaNumero ? (
                                  <Chip
                                    icon={<VoucherIcon sx={{ fontSize: 13 }} />}
                                    label={row.voucherRomanaNumero}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                                  />
                                ) : (
                                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            ) : (
              /* Pestaña 1: Trazabilidad por Lote y Reglas Biológicas R6.4 */
              <Box>
                {lotesDetalle.length === 0 ? (
                  <Typography sx={{ p: 4, color: 'text.secondary', fontFamily: 'Inter', textAlign: 'center' }}>
                    No hay lotes con trazabilidad registrados para este periodo.
                  </Typography>
                ) : (
                  <TableContainer sx={{ maxHeight: 460 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Folio Origen</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Origen</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Especie / Humedad</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Kg Origen</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Kg Planta</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">&Delta; Peso (%)</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Tránsito</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Severidad Biológica (R8.1)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lotesDetalle.map((row, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{row.folioOrigen}</TableCell>
                            <TableCell sx={{ fontSize: '0.82rem' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{row.actorOrigen}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.eslabonOrigen}</Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.82rem' }}>
                              <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{row.especie}</Typography>
                              <Chip label={row.humedadOrigen} size="small" sx={{ fontSize: '0.68rem', height: 18, mt: 0.3 }} />
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }} align="right">{row.kgOrigen?.toLocaleString('es-CL')}</TableCell>
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
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                {row.diasTranscurridos} d viaje
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {row.severidadBiologica === 'CRITICA' ? (
                                <Tooltip title={row.motivoMerma || "Inconsistencia biológica crítica: alga húmeda transportada por 3 o más días sin registrar merma o con incremento de peso. Presunción de blanqueo o hidratación no declarada en ruta."}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                    <Chip
                                      label="CRÍTICA"
                                      size="small"
                                      sx={{ fontSize: '0.68rem', height: 22, fontWeight: 900, bgcolor: '#b91c1c', color: '#fff' }}
                                    />
                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#b91c1c', fontWeight: 700 }}>
                                      {row.inconsistenciaBiologica}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              ) : row.severidadBiologica === 'ATENCION' ? (
                                <Tooltip title={row.motivoMerma || (row.inconsistenciaBiologica === 'SECO_MERMA_EXCESIVA' ? "Alga seca con merma superior al límite físico tolerable (3%)." : "Merma húmeda inferior a la tasa de evaporación física esperada.")}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                    <Chip
                                      label="ATENCIÓN"
                                      size="small"
                                      sx={{ fontSize: '0.68rem', height: 22, fontWeight: 800, bgcolor: '#f59e0b', color: '#fff' }}
                                    />
                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 600 }}>
                                      {row.inconsistenciaBiologica}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              ) : row.severidadBiologica === 'NEUTRA' ? (
                                <Chip label="NEUTRA" size="small" color="success" variant="outlined" sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700 }} />
                              ) : (
                                <Tooltip title="Control biológico desactivado en Administración (bio_perdida_activo = false)">
                                  <Chip label="DESACTIVADO" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'action.hover', color: 'text.disabled' }} />
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', pl: 1 }}>
              {tabModal === 0
                ? `Mostrando ${conciliacionesFiltradas.length} de ${conciliacionesDetalle.length} conciliaciones evaluadas.`
                : `Mostrando ${lotesDetalle.length} lotes con trazabilidad de origen a destino.`}
            </Typography>
            <Button onClick={() => setOpenModal(false)} sx={{ fontFamily: 'Inter', fontWeight: 600 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
