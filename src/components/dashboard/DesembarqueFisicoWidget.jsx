import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Scale as ScaleIcon,
  WarningAmber as WarningIcon,
  FilterList as FilterIcon,
  KeyboardArrowDown as DownIcon,
  KeyboardArrowUp as UpIcon,
  Inventory2 as BoxIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDesembarqueFisico, getDesembarqueFisicoDetalle } from '../../services/reportesService';
import api from '../../api/axiosConfig';

const COLOR_PRIMARIO = '#059669';
const COLOR_ATIPICO = '#f59e0b';

export default function DesembarqueFisicoWidget({ dateRange }) {
  const theme = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetalle, setShowDetalle] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Filtros dinámicos
  const [perfil, setPerfil] = useState('TODOS');
  const [especieId, setEspecieId] = useState('');
  const [comunaId, setComunaId] = useState('');
  const [especies, setEspecies] = useState([]);
  const [comunas, setComunas] = useState([]);

  useEffect(() => {
    // Cargar catálogos dinámicos
    api.get('/especies').then(r => setEspecies(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get('/comunas').then(r => setComunas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

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
    if (perfil && perfil !== 'TODOS') filters.perfil = perfil;
    if (especieId) filters.especieId = especieId;
    if (comunaId) filters.comunaId = comunaId;
    return filters;
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const filters = parseDates();
        const res = await getDesembarqueFisico(filters);
        setMetrics(res);
      } catch (err) {
        console.error('Error cargando desembarque físico:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange, perfil, especieId, comunaId]);

  const handleToggleDetalle = async () => {
    if (!showDetalle && detalle.length === 0) {
      setLoadingDetalle(true);
      try {
        const filters = parseDates();
        const res = await getDesembarqueFisicoDetalle(filters);
        setDetalle(res || []);
      } catch (err) {
        console.error('Error cargando detalle de desembarque:', err);
      } finally {
        setLoadingDetalle(false);
      }
    }
    setShowDetalle(!showDetalle);
  };

  const chartData = (metrics?.porEspecie || []).slice(0, 7);

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
        {/* Cabecera y Filtros */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 3,
                bgcolor: 'rgba(5, 150, 105, 0.12)',
                color: COLOR_PRIMARIO,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ScaleIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                Desembarque Físico (Indicador 1)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                Kilogramos reales recibidos en costa · Base técnica kg
              </Typography>
            </Box>
          </Box>

          {/* Barra de Filtros */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
                sx={{ borderRadius: 2, fontSize: '0.82rem', fontFamily: 'Inter' }}
              >
                <MenuItem value="TODOS">Todos los perfiles</MenuItem>
                <MenuItem value="RECOLECTOR">Recolector</MenuItem>
                <MenuItem value="ARMADOR">Armador</MenuItem>
                <MenuItem value="AREA">Área de Manejo</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={especieId}
                onChange={(e) => setEspecieId(e.target.value)}
                displayEmpty
                sx={{ borderRadius: 2, fontSize: '0.82rem', fontFamily: 'Inter' }}
              >
                <MenuItem value="">Todas las especies</MenuItem>
                {especies.map(e => (
                  <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={comunaId}
                onChange={(e) => setComunaId(e.target.value)}
                displayEmpty
                sx={{ borderRadius: 2, fontSize: '0.82rem', fontFamily: 'Inter' }}
              >
                <MenuItem value="">Todas las comunas</MenuItem>
                {comunas.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: 250 }}>
            <CircularProgress size={36} color="success" />
          </Box>
        ) : (
          <>
            {/* Tarjetas de Resumen KPI */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50', border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Desembarque Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                    {(metrics?.totalDesembarqueKg || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })} <span style={{ fontSize: '0.85rem' }}>kg</span>
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50', border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Declaraciones
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>
                    {(metrics?.totalDeclaraciones || 0).toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50', border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Promedio / Faena
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>
                    {(metrics?.promedioDeclaracionKg || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 })} <span style={{ fontSize: '0.85rem' }}>kg</span>
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: (metrics?.declaracionesAtipicas || 0) > 0 ? 'rgba(245, 158, 11, 0.08)' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50',
                    border: 1,
                    borderColor: (metrics?.declaracionesAtipicas || 0) > 0 ? 'warning.main' : 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: (metrics?.declaracionesAtipicas || 0) > 0 ? 'warning.dark' : 'text.secondary', fontWeight: 700 }}>
                      Desembarques Atípicos
                    </Typography>
                    {(metrics?.declaracionesAtipicas || 0) > 0 && <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                  </Box>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: (metrics?.declaracionesAtipicas || 0) > 0 ? 'warning.main' : 'text.primary', mt: 0.5 }}>
                    {metrics?.declaracionesAtipicas || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>( &gt; {((metrics?.umbralAtipicoKg || 5000)).toLocaleString('es-CL')} kg)</span>
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Gráfico de barras por Especie */}
            <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 1.5 }}>
              Desembarque Físico por Especie
            </Typography>

            <Box sx={{ width: '100%', height: 220, mb: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="especie" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}t`} />
                  <Tooltip
                    formatter={(value) => [`${value.toLocaleString('es-CL')} kg`, 'Desembarque']}
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 12,
                      border: `1px solid ${theme.palette.divider}`,
                      fontFamily: 'Inter',
                      fontSize: '0.85rem'
                    }}
                  />
                  <Bar dataKey="totalKg" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? COLOR_PRIMARIO : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {/* Botón para expandir tabla de detalle */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Button
                size="small"
                endIcon={showDetalle ? <UpIcon /> : <DownIcon />}
                onClick={handleToggleDetalle}
                sx={{ textTransform: 'none', fontFamily: 'Outfit', fontWeight: 600, color: 'text.secondary' }}
              >
                {showDetalle ? 'Ocultar Detalle de Declaraciones' : 'Ver Detalle de Declaraciones'}
              </Button>
            </Box>

            {/* Tabla desplegable */}
            <Collapse in={showDetalle}>
              <Box sx={{ mt: 2 }}>
                {loadingDetalle ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Folio</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Perfil</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Fecha</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Actor</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Comuna</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Desembarque (kg)</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detalle.map((d) => (
                          <TableRow key={`${d.perfil}-${d.id}`} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{d.folio || `ID-${d.id}`}</TableCell>
                            <TableCell><Chip label={d.perfil} size="small" sx={{ fontSize: '0.7rem', height: 20 }} /></TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{d.fecha ? new Date(d.fecha).toLocaleDateString('es-CL') : '—'}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{d.actor}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{d.especie}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{d.comuna}</TableCell>
                            <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700 }} align="right">
                              {d.desembarqueKg?.toLocaleString('es-CL')}
                            </TableCell>
                            <TableCell align="center">
                              {d.esAtipico ? (
                                <Chip label="Atípico" size="small" color="warning" sx={{ fontSize: '0.7rem', height: 20, fontWeight: 700 }} />
                              ) : (
                                <Chip label="Normal" size="small" sx={{ fontSize: '0.7rem', height: 20, bgcolor: 'divider' }} />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
}
