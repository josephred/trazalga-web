import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Warehouse as WarehouseIcon,
  Circle as CircleIcon,
  Warning as WarningIcon,
  Store as StoreIcon,
  ToggleOff as ToggleOffIcon,
  CheckCircleOutline as CheckIcon
} from '@mui/icons-material';
import { getRetencionBodega } from '../../services/reportesService';

export default function RetencionBodegaWidget() {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getRetencionBodega();
        setData(res);
      } catch (err) {
        console.error('Error cargando retención en bodega:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSemaforoColor = (sem) => {
    switch (sem) {
      case 'VERDE': return '#10b981';
      case 'AMARILLA': return '#f59e0b';
      case 'NARANJA': return '#f97316';
      case 'ROJA': return '#ef4444';
      default: return theme.palette.text.disabled;
    }
  };

  const isDesactivado = data?.activo === false || data?.controlDesactivado === true;
  const isSinLotes = !isDesactivado && (!data?.lotes || data.lotes.length === 0);
  const isConResultados = !isDesactivado && data?.lotes && data.lotes.length > 0;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: 1,
        borderColor: isDesactivado ? 'divider' : (data?.semaforoRojo || 0) > 0 ? 'error.light' : 'divider',
        bgcolor: 'background.paper',
        p: { xs: 2, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: (data?.semaforoRojo || 0) > 0
          ? '0 10px 15px -3px rgba(239, 68, 68, 0.04)'
          : '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)'
      }}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Cabecera */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 3,
                bgcolor: isDesactivado
                  ? 'action.hover'
                  : (data?.semaforoRojo || 0) > 0
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(59, 130, 246, 0.1)',
                color: isDesactivado ? 'text.secondary' : (data?.semaforoRojo || 0) > 0 ? '#ef4444' : 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <WarehouseIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                  Retención en Bodega Virtual (Indicador 7)
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                Control anti-invención de stock · Semáforo preventivo por días sin destino a planta
              </Typography>
            </Box>
          </Box>

          {/* Badge de Estado en Cabecera */}
          {!loading && (
            <Box>
              {isDesactivado ? (
                <Chip
                  icon={<ToggleOffIcon sx={{ fontSize: 16 }} />}
                  label="Control Desactivado"
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24, bgcolor: 'action.hover', color: 'text.secondary' }}
                />
              ) : isSinLotes ? (
                <Chip
                  icon={<CheckIcon sx={{ fontSize: 14 }} />}
                  label="Control Activo · Sin Lotes"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24 }}
                />
              ) : (
                <Chip
                  label={`${data?.totalLotesEnBodega || data?.lotes?.length || 0} lotes retenidos`}
                  size="small"
                  color={(data?.semaforoRojo || 0) > 0 ? 'error' : (data?.semaforoNaranja || 0) > 0 ? 'warning' : 'primary'}
                  sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24 }}
                />
              )}
            </Box>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: 250 }}>
            <CircularProgress size={36} color="primary" />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
            {/* ESTADO 1: Control Desactivado en Administración (R7.1) */}
            {isDesactivado && (
              <Box
                sx={{
                  p: 4,
                  my: 'auto',
                  borderRadius: 3,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)',
                  border: '1.5px dashed',
                  borderColor: '#f59e0b',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 1.5
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    bgcolor: 'rgba(245, 158, 11, 0.15)',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <WarningIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box sx={{ maxWidth: 500 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: '#b45309', mb: 0.5 }}>
                    Control de retención en bodega desactivado en Administración
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'Inter', color: 'text.secondary', lineHeight: 1.5, fontSize: '0.85rem' }}>
                    La supervisión de tiempos de permanencia en bodega virtual está inactiva mediante el parámetro administrativo <code>retencion_bodega_activo = false</code>.
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1.5, fontFamily: 'Inter', color: 'text.disabled' }}>
                    Para habilitar el semáforo anti-invención de stock y monitorear el acopio de comercializadores, active este control en <strong>Administración → Configuración General</strong>.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ESTADO 2: Control Activo sin Lotes que Clasificar / Sin Recepciones en Planta (R7.1) */}
            {isSinLotes && (
              <Box
                sx={{
                  p: 4,
                  my: 'auto',
                  borderRadius: 3,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.03)' : 'rgba(59, 130, 246, 0.02)',
                  border: '1.5px dashed',
                  borderColor: 'primary.light',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 1.5
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <StoreIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box sx={{ maxWidth: 520 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary', mb: 0.5 }}>
                    sin recepciones en planta registradas
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'Inter', color: 'text.secondary', lineHeight: 1.5, fontSize: '0.85rem' }}>
                    El control anti-invención de stock se encuentra plenamente activo. En este momento no existen lotes retenidos en bodega virtual pendientes de despacho o aún no se han registrado ingresos en planta en el período evaluado.
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    <Chip label={`Amarilla: ${data?.diasAmarilla || 3}d`} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                    <Chip label={`Naranja: ${data?.diasNaranja || 5}d`} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                    <Chip label={`Roja: ≥${data?.diasRoja || 7}d`} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                    <Chip label={`Recurso: ${data?.estadosSujetos || 'HUMEDO'}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                  </Box>
                </Box>
              </Box>
            )}

            {/* ESTADO 3: Control Activo con Resultados (R7.1) */}
            {isConResultados && (
              <>
                {/* KPI Semáforo Cards */}
                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.08)', border: 1, borderColor: '#10b981' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <CircleIcon sx={{ fontSize: 12, color: '#10b981' }} />
                        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                          Verde (&lt; {data?.diasAmarilla || 3}d)
                        </Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: '#10b981', mt: 0.5 }}>
                        {data?.semaforoVerde || 0} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>lotes</span>
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(245, 158, 11, 0.08)', border: 1, borderColor: '#f59e0b' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <CircleIcon sx={{ fontSize: 12, color: '#f59e0b' }} />
                        <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 700 }}>
                          Amarilla ({data?.diasAmarilla || 3}-{data?.diasNaranja || 5}d)
                        </Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: '#f59e0b', mt: 0.5 }}>
                        {data?.semaforoAmarillo || 0} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>lotes</span>
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(249, 115, 22, 0.08)', border: 1, borderColor: '#f97316' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <CircleIcon sx={{ fontSize: 12, color: '#f97316' }} />
                        <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 700 }}>
                          Naranja ({data?.diasNaranja || 5}-{data?.diasRoja || 7}d)
                        </Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: '#f97316', mt: 0.5 }}>
                        {data?.semaforoNaranja || 0} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>lotes</span>
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: (data?.semaforoRojo || 0) > 0 ? 'rgba(239, 68, 68, 0.12)' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50', border: 1, borderColor: '#ef4444' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <CircleIcon sx={{ fontSize: 12, color: '#ef4444' }} />
                        <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700 }}>
                          Roja (&ge; {data?.diasRoja || 7}d)
                        </Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: '#ef4444', mt: 0.5 }}>
                        {data?.semaforoRojo || 0} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>lotes</span>
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Tabla de Lotes Retenidos */}
                <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 1.5 }}>
                  Lotes Retenidos por Comercializadores (Total: {(data?.totalKgEnBodega || 0).toLocaleString('es-CL')} kg)
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, maxHeight: 240 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Folio Origen</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Comercializador</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Humedad</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Kg Adquiridos</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Días en Bodega</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Semáforo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.lotes.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.folioOrigen}</TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 600 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <StoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              {row.actorComercializador || 'Comercializador'}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem' }}>{row.especie}</TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem' }}>{row.humedadOrigen}</TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 700 }} align="right">
                            {row.kgComercializador?.toLocaleString('es-CL')}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 700 }} align="center">
                            {row.diasEnBodega} d
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={<CircleIcon sx={{ fontSize: '10px !important', color: `${getSemaforoColor(row.semaforo)} !important` }} />}
                              label={row.semaforo}
                              size="small"
                              sx={{
                                fontSize: '0.68rem',
                                height: 20,
                                fontWeight: 700,
                                bgcolor: `${getSemaforoColor(row.semaforo)}15`,
                                color: getSemaforoColor(row.semaforo),
                                border: `1px solid ${getSemaforoColor(row.semaforo)}40`
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
