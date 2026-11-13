import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Paper,
  Stack
} from '@mui/material';
import {
  Factory as FactoryIcon,
  CheckCircle as OkIcon,
  WarningAmber as WarnIcon,
  HelpOutline as HelpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getRendimientoPlanta } from '../../services/reportesService';

const formatNum = (val, dec = 1) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return Number(val).toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('es-CL');
};

export default function RendimientoPlantaWidget({ dateRange }) {
  const [data, setData] = useState({
    resumen: { total: 0, normales: 0, anomalas: 0, sinReferencia: 0, rendimientoActivo: true, toleranciaPct: 5 },
    porPlantaFormato: [],
    detalle: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  const cargar = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getRendimientoPlanta(dateRange, {}, { signal });
      if (resp) {
        setData({
          resumen: resp.resumen || { total: 0, normales: 0, anomalas: 0, sinReferencia: 0, rendimientoActivo: true, toleranciaPct: 5 },
          porPlantaFormato: resp.porPlantaFormato || [],
          detalle: resp.detalle || []
        });
      }
    } catch (err) {
      if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
        setError('No se pudo cargar el control de rendimiento en planta.');
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    const controller = new AbortController();
    cargar(controller.signal);
    return () => controller.abort();
  }, [cargar]);

  const { resumen, porPlantaFormato, detalle } = data;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%'
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: 'rgba(13, 148, 136, 0.12)',
                color: '#0d9488',
                display: 'flex'
              }}
            >
              <FactoryIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1.2 }}>
                Rendimiento en Planta de Proceso
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Balance de biomasa y formatos · Tolerancia +{formatNum(resumen.toleranciaPct ?? 5, 0)} %
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              label={resumen.rendimientoActivo !== false ? 'Control Activo' : 'Control Apagado'}
              color={resumen.rendimientoActivo !== false ? 'success' : 'default'}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
            <Tooltip title="Recargar">
              <IconButton size="small" onClick={() => cargar()} disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {resumen.rendimientoActivo === false && (
          <Alert severity="info" sx={{ mb: 2 }}>
            La emisión de alertas automáticas (`rendimiento_activo`) está desactivada en Administración.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Total evaluadas
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {resumen.total || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', borderColor: '#bbf7d0' }}>
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                Normales
              </Typography>
              <Typography variant="h5" color="success.main" sx={{ fontWeight: 800 }}>
                {resumen.normales || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', borderColor: '#fecdd3' }}>
              <Typography variant="caption" sx={{ color: '#be123c', fontWeight: 700 }}>
                Anómalas
              </Typography>
              <Typography variant="h5" sx={{ color: '#be123c', fontWeight: 800 }}>
                {resumen.anomalas || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Sin referencia
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 800 }}>
                {resumen.sinReferencia || 0}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label={`Por Planta y Formato (${porPlantaFormato.length})`} sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab label={`Detalle Producciones (${detalle.length})`} sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : tab === 0 ? (
          porPlantaFormato.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No hay producciones registradas en el período seleccionado.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 340 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Planta</TableCell>
                    <TableCell>Especie / Formato</TableCell>
                    <TableCell align="right">Prod.</TableCell>
                    <TableCell align="right">Entrada (kg)</TableCell>
                    <TableCell align="right">Producto (kg)</TableCell>
                    <TableCell align="right">Rend. prom.</TableCell>
                    <TableCell align="right">Anómalas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {porPlantaFormato.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.plantaNombre}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.productoNombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.especieNombre || '—'}{row.productoCodigo ? ` · Cód. ${row.productoCodigo}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{row.producciones}</TableCell>
                      <TableCell align="right">{formatNum(row.masaEntradaKg, 0)}</TableCell>
                      <TableCell align="right">{formatNum(row.masaProductoKg, 0)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {row.rendimientoPromedioPct != null ? `${formatNum(row.rendimientoPromedioPct, 2)} %` : '—'}
                      </TableCell>
                      <TableCell align="right">
                        {row.anomalas > 0 ? (
                          <Chip size="small" label={row.anomalas} color="error" sx={{ fontWeight: 700, height: 20 }} />
                        ) : (
                          '0'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : detalle.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No hay producciones registradas en el período seleccionado.
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 340 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Folio</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Planta / Formato</TableCell>
                  <TableCell align="right">Entrada (kg)</TableCell>
                  <TableCell align="right">Producto (kg)</TableCell>
                  <TableCell align="right">Rend. (%)</TableCell>
                  <TableCell align="right">Máx. teór.</TableCell>
                  <TableCell>Fuente / Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalle.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{d.folio || `#${d.id}`}</TableCell>
                    <TableCell>{formatDate(d.fechaProduccion)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.plantaNombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{d.productoNombre || '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">{formatNum(d.masaEntradaKg, 1)}</TableCell>
                    <TableCell align="right">{formatNum(d.masaProductoKg, 1)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: d.anomalo ? '#be123c' : 'text.primary' }}>
                      {d.rendimientoPct != null ? `${formatNum(d.rendimientoPct, 2)} %` : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {d.rendimientoMaxTeoricoPct != null ? `${formatNum(d.rendimientoMaxTeoricoPct, 2)} %` : '—'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {d.clasificacion === 'ANOMALO' ? (
                          <Chip icon={<WarnIcon sx={{ fontSize: 13 }} />} size="small" label="ANÓMALO" color="error" sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700 }} />
                        ) : d.clasificacion === 'NORMAL' ? (
                          <Chip icon={<OkIcon sx={{ fontSize: 13 }} />} size="small" label="NORMAL" color="success" variant="outlined" sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700 }} />
                        ) : (
                          <Chip icon={<HelpIcon sx={{ fontSize: 13 }} />} size="small" label="SIN REF." variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {d.rendimientoFuente || '—'}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
