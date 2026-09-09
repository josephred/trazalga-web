import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Speed as SpeedIcon,
  DirectionsBoat as BoatIcon,
  CheckCircle as OkIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { getLimiteExtraccionDiario } from '../../services/reportesService';

export default function LimiteExtraccionDiarioWidget({ dateRange }) {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let fecha = null;
        if (dateRange && dateRange.endDate) {
          fecha = dateRange.endDate;
        }
        const res = await getLimiteExtraccionDiario(fecha);
        setData(res);
      } catch (err) {
        console.error('Error cargando monitoreo LED:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'NORMAL': return 'success';
      case 'ADVERTENCIA': return 'warning';
      case 'EN_TOLERANCIA': return 'warning';
      case 'EXCEDIDO': return 'error';
      default: return 'default';
    }
  };

  const sinRegla = Boolean(data?.sinReglaConfigurada || data?.limiteOficialKg == null);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        p: { xs: 2, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)'
      }}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Cabecera */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 3,
                bgcolor: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <SpeedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                Límite de Extracción Diario - LED (Indicador 4)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                {sinRegla ? (
                  <>Monitoreo por {data?.unidadAgregacion || 'EMBARCACION'} · <em>Sin regla oficial configurada</em></>
                ) : (
                  <>Monitoreo por {data?.unidadAgregacion || 'EMBARCACION'} · Límite: <strong>{data.limiteOficialKg.toLocaleString('es-CL')} kg/día</strong> ({data?.nombreRegla})</>
                )}
              </Typography>
            </Box>
          </Box>

          <Chip
            label={sinRegla ? 'Sin Regla Activa' : (data?.modoAccion === 'BLOQUEO_DECLARACION' ? 'Bloqueo Activo' : 'Solo Alerta')}
            size="small"
            color={sinRegla ? 'default' : (data?.modoAccion === 'BLOQUEO_DECLARACION' ? 'error' : 'warning')}
            sx={{ fontWeight: 700, fontSize: '0.72rem', height: 24 }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: 250 }}>
            <CircularProgress size={36} sx={{ color: '#3b82f6' }} />
          </Box>
        ) : (
          <>
            {sinRegla && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
                No se encuentran reglas oficiales de Límite de Extracción Diario (LED) activas en el sistema. Puede configurar o activar reglas en Administración → Límites de Extracción Diario.
              </Alert>
            )}

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50', border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Embarcaciones
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>
                    {data?.totalMonitoreados || 0}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.08)', border: 1, borderColor: 'success.main' }}>
                  <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 700, display: 'block' }}>
                    Dentro de Límite
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                    {data?.dentroLimite || 0}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(245, 158, 11, 0.08)', border: 1, borderColor: 'warning.main' }}>
                  <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 700, display: 'block' }}>
                    Alerta / Tolerancia
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'warning.main', mt: 0.5 }}>
                    {(data?.advertencia || 0) + (data?.enTolerancia || 0)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: (data?.excedidos || 0) > 0 ? 'rgba(239, 68, 68, 0.1)' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50', border: 1, borderColor: (data?.excedidos || 0) > 0 ? 'error.main' : 'divider' }}>
                  <Typography variant="caption" sx={{ color: (data?.excedidos || 0) > 0 ? 'error.main' : 'text.secondary', fontWeight: 700, display: 'block' }}>
                    Excedidos (&gt;100%)
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: (data?.excedidos || 0) > 0 ? 'error.main' : 'text.primary', mt: 0.5 }}>
                    {data?.excedidos || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Listado de embarcaciones activas */}
            <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 1.5 }}>
              Desembarques Diarios por Embarcación vs Límite
            </Typography>

            {(!data?.detalle || data.detalle.length === 0) ? (
              <Box sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50', border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No se registran desembarques de armadores en la fecha seleccionada.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, maxHeight: 260 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Embarcación</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Matrícula</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Método</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Desembarque (kg)</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', width: 140 }}>Consumo Límite</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.detalle.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 600 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BoatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            {row.nombre}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.matricula}</TableCell>
                        <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem' }}>{row.metodo}</TableCell>
                        <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 700 }} align="right">
                          {row.kgDesembarcados?.toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(row.porcentajeConsumido, 100)}
                              color={getStatusColor(row.estado)}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 35 }}>
                              {row.porcentajeConsumido}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={row.estado}
                            size="small"
                            color={getStatusColor(row.estado)}
                            sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
