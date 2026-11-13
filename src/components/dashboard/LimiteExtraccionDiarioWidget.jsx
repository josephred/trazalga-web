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
  Alert,
  Tabs,
  Tab,
  TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Speed as SpeedIcon,
  DirectionsBoat as BoatIcon,
  Person as PersonIcon,
  CheckCircle as OkIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Block as BlockIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { getLimiteExtraccionDiario, getLedHallazgos } from '../../services/reportesService';

// 'YYYY-MM-DD' -> 'DD-MM-YYYY', sin pasar por Date para no cambiar de día por la zona horaria
const formatoDia = (iso) => {
  if (!iso || typeof iso !== 'string') return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return a && m && d ? `${d}-${m}-${a}` : iso;
};

const kg = (valor) => (valor == null ? null : `${Number(valor).toLocaleString('es-CL')} kg`);

const SinDato = () => (
  <Typography component="span" variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
    sin dato
  </Typography>
);

const TIPO_HALLAZGO = { EMBARCACION: 'Embarcación', AMERB: 'AMERB', RECOLECTOR: 'Recolector' };
const UNIDAD_MONITOREO = { EMBARCACION: 'Embarcación', BUZO: 'Buzo', USUARIO: 'Usuario' };
const ORIGEN = { ARMADOR: 'Armador', AREA: 'AMERB', RECOLECTOR: 'Recolector' };

export default function LimiteExtraccionDiarioWidget({ dateRange }) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  // Día del monitoreo: por defecto el último del período; se puede elegir otro dentro del período
  const [dia, setDia] = useState(dateRange?.endDate || '');
  useEffect(() => {
    setDia(dateRange?.endDate || '');
  }, [dateRange]);
  
  // Estado para pestaña 0: Monitoreo diario
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para pestaña 1: Hallazgos del período
  const [hallazgos, setHallazgos] = useState([]);
  const [loadingHallazgos, setLoadingHallazgos] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getLimiteExtraccionDiario(dia || null);
        setData(res);
      } catch (err) {
        console.error('Error cargando monitoreo LED:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dia]);

  useEffect(() => {
    const fetchHallazgos = async () => {
      setLoadingHallazgos(true);
      try {
        const filters = {};
        if (dateRange && dateRange.startDate) filters.startDate = dateRange.startDate;
        if (dateRange && dateRange.endDate) filters.endDate = dateRange.endDate;
        const res = await getLedHallazgos(filters);
        setHallazgos(res || []);
      } catch (err) {
        console.error('Error cargando hallazgos LED por rango:', err);
      } finally {
        setLoadingHallazgos(false);
      }
    };

    fetchHallazgos();
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
  const diaMostrado = data?.dia || dia;
  const esFinDelPeriodo = Boolean(dateRange?.endDate) && diaMostrado === dateRange.endDate;

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
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
                  <>Monitoreo por {data?.unidadAgregacion || 'EMBARCACION'} · Límite base: <strong>{data.limiteOficialKg?.toLocaleString('es-CL')} kg/día</strong> ({data?.nombreRegla})</>
                )}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={sinRegla ? 'Sin Regla Activa' : (data?.modoAccion === 'BLOQUEO_DECLARACION' ? 'Bloqueo Activo' : 'Solo Alerta')}
              size="small"
              color={sinRegla ? 'default' : (data?.modoAccion === 'BLOQUEO_DECLARACION' ? 'error' : 'warning')}
              sx={{ fontWeight: 700, fontSize: '0.72rem', height: 24 }}
            />
          </Box>
        </Box>

        {/* Pestañas de Navegación */}
        <Tabs 
          value={tab} 
          onChange={(e, v) => setTab(v)} 
          sx={{ 
            minHeight: 38,
            mb: 2.5,
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 38,
              py: 0.5,
              textTransform: 'none',
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: '0.85rem'
            }
          }}
        >
          <Tab 
            icon={<AssessmentIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start" 
            label="Monitoreo Diario" 
          />
          <Tab 
            icon={<HistoryIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                Hallazgos del Período
                {hallazgos.length > 0 && (
                  <Chip 
                    label={hallazgos.length} 
                    size="small" 
                    color="error" 
                    sx={{ height: 18, fontSize: '0.68rem', fontWeight: 800, px: 0.3 }}
                  />
                )}
              </Box>
            } 
          />
        </Tabs>

        {/* CONTENIDO PESTAÑA 0: MONITOREO DIARIO */}
        {tab === 0 && (
          loading ? (
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

              {/* Día monitoreado (NL.3): el monitoreo es de un solo día, no de todo el período */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  {diaMostrado
                    ? <>Monitoreo del {formatoDia(diaMostrado)}{esFinDelPeriodo ? ', fin del período' : ''}</>
                    : 'Monitoreo de hoy'}
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  label="Día"
                  value={dia || ''}
                  onChange={(e) => setDia(e.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { min: dateRange?.startDate || undefined, max: dateRange?.endDate || undefined }
                  }}
                  sx={{ width: 170 }}
                />
              </Box>

              {/* KPI Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50', border: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                      Monitoreados
                    </Typography>
                    <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>
                      {data?.totalMonitoreados || 0}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.08)', border: 1, borderColor: 'success.main' }}>
                    <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 700, display: 'block' }}>
                      Dentro de Límite
                    </Typography>
                    <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                      {data?.dentroLimite || 0}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(245, 158, 11, 0.08)', border: 1, borderColor: 'warning.main' }}>
                    <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 700, display: 'block' }}>
                      Alerta / Tolerancia
                    </Typography>
                    <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'warning.main', mt: 0.5 }}>
                      {(data?.advertencia || 0) + (data?.enTolerancia || 0)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
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
                Kilos del día vs Límite
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', display: 'block', mt: -1, mb: 1.5 }}>
                Cada fila suma el día según su regla (por embarcación, buzo o usuario; desembarque o captura), igual que la validación al declarar.
                {data?.sumaArea ? ' Incluye las declaraciones de área de manejo.' : ' No incluye las declaraciones de área de manejo.'}
                {data?.sinUnidad > 0 && ` ${data.sinUnidad} faena(s) quedan fuera: su regla acumula por una unidad que la declaración no trae.`}
              </Typography>

              {(!data?.detalle || data.detalle.length === 0) ? (
                <Box sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50', border: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No se registran declaraciones afectas al LED el {formatoDia(diaMostrado) || 'día seleccionado'}.
                  </Typography>
                </Box>
              ) : (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 3,
                    maxHeight: 260,
                    width: '100%',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    '& th:first-of-type, & td:first-of-type': {
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      bgcolor: 'background.paper',
                      boxShadow: (theme) => `2px 0 4px -1px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)'}`,
                    },
                    '& thead th:first-of-type': {
                      zIndex: 3,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'grey.50',
                      boxShadow: (theme) => `2px 0 4px -1px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)'}`,
                    }
                  }}
                >
                  <Table size="small" sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Embarcación / unidad</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Matrícula / RUT</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Método</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Kg del día</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', width: 140 }}>Consumo Límite</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.detalle.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 600 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {row.tipo && row.tipo !== 'EMBARCACION'
                                ? <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                : <BoatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                              {row.nombre}
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 400 }}>
                              {UNIDAD_MONITOREO[row.tipo] || 'Embarcación'}
                              {Array.isArray(row.origenes) && row.origenes.length > 0 && ` · ${row.origenes.map((o) => ORIGEN[o] || o).join(' + ')}`}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.matricula}</TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem' }}>{row.metodo}</TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 700 }} align="right">
                            {row.kgDesembarcados?.toLocaleString('es-CL')}
                            {row.metrica === 'CAPTURA' && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 400 }}>
                                captura
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.sinReglaAplicable ? (
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                Sin regla aplicable
                              </Typography>
                            ) : (
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
                            )}
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
          )
        )}

        {/* CONTENIDO PESTAÑA 1: HALLAZGOS DEL PERÍODO (R4.2) */}
        {tab === 1 && (
          loadingHallazgos ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: 250 }}>
              <CircularProgress size={36} sx={{ color: '#ef4444' }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Infracciones Acumuladas de Límite Diario (LED_EXCEDIDO)
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                  Total: {hallazgos.length} excesos registrados · Ordenados por exceso descendente
                  {dateRange?.startDate && dateRange?.endDate && ` · ${formatoDia(dateRange.startDate)} al ${formatoDia(dateRange.endDate)}`}
                </Typography>
              </Box>

              {hallazgos.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50', border: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                    No se registran excesos de Límite de Extracción Diario (LED_EXCEDIDO) en el rango de fechas seleccionado.
                  </Typography>
                </Box>
              ) : (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 3,
                    maxHeight: 320,
                    width: '100%',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    '& th:first-of-type, & td:first-of-type': {
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      bgcolor: 'background.paper',
                      boxShadow: (theme) => `2px 0 4px -1px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)'}`,
                    },
                    '& thead th:first-of-type': {
                      zIndex: 3,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'grey.50',
                      boxShadow: (theme) => `2px 0 4px -1px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)'}`,
                    }
                  }}
                >
                  <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Folio</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Fecha</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Embarcación</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Declarante (RUT)</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Caleta</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Kg Día</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Límite</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'error.main' }} align="right">Exceso</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Regla Aplicada</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {hallazgos.map((row, idx) => (
                        <TableRow key={row.marcaId || idx} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>
                            {row.folio || (
                              <Typography component="span" variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', fontFamily: 'Inter' }}>
                                sin folio
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.8rem' }}>
                            {row.fecha ? new Date(row.fecha).toLocaleDateString('es-CL') : '—'}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.8rem' }}>
                            <Chip
                              label={TIPO_HALLAZGO[row.tipo] || row.tipo || '—'}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 600 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              {row.tipo === 'RECOLECTOR'
                                ? <PersonIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                : <BoatIcon sx={{ fontSize: 15, color: 'text.secondary' }} />}
                              {row.tipo === 'RECOLECTOR' ? row.armador : row.embarcacion}
                            </Box>
                            {row.matricula && row.matricula !== '—' && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', display: 'block' }}>
                                {row.matricula}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.8rem' }}>
                            {row.armador}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.8rem' }}>
                            {row.caleta || '—'}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 600 }} align="right">
                            {kg(row.kgDia) ?? <SinDato />}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem' }} align="right">
                            {kg(row.limiteKg) ?? <SinDato />}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 800, color: 'error.main' }} align="right">
                            {row.excesoKg == null
                              ? <SinDato />
                              : <>+{kg(row.excesoKg)}{row.excesoPct != null && ` (${row.excesoPct}%)`}</>}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'text.secondary' }}>
                            {row.nombreRegla || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )
        )}
      </CardContent>
    </Card>
  );
}
