import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
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
  Collapse,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Scale as ScaleIcon,
  WarningAmber as WarningIcon,
  KeyboardArrowDown as DownIcon,
  KeyboardArrowUp as UpIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDesembarqueFisico, getDesembarqueFisicoDetalle } from '../../services/reportesService';
import api from '../../api/axiosConfig';

const COLOR_PRIMARIO = '#059669';
const COLOR_SECUNDARIO = '#10b981';

export default function DesembarqueFisicoWidget({ dateRange }) {
  const theme = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetalle, setShowDetalle] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Dimensión de agrupación activa (T7)
  const [agruparPor, setAgruparPor] = useState('CALETA');

  // Filtros dimensionales
  const [perfil, setPerfil] = useState('TODOS');
  const [especieId, setEspecieId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [provinciaId, setProvinciaId] = useState('');
  const [comunaId, setComunaId] = useState('');
  const [caletaId, setCaletaId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');

  // Catálogos
  const [especies, setEspecies] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [caletas, setCaletas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Carga inicial de catálogos base
  useEffect(() => {
    api.get('/api/especies').then((r) => setEspecies(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get('/api/regiones').catch(() => api.get('/regiones')).then((r) => setRegiones(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get('/api/usuarios').catch(() => api.get('/usuario')).then((r) => setUsuarios(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  // Cascada: cuando cambia región
  useEffect(() => {
    setProvinciaId('');
    setComunaId('');
    setCaletaId('');
    if (regionId) {
      api.get(`/api/provincias?regionId=${regionId}`).then((r) => setProvincias(Array.isArray(r.data) ? r.data : [])).catch(() => setProvincias([]));
      api.get(`/api/comunas?regionId=${regionId}`).then((r) => setComunas(Array.isArray(r.data) ? r.data : [])).catch(() => setComunas([]));
      api.get(`/api/caletas?regionId=${regionId}`).then((r) => setCaletas(Array.isArray(r.data) ? r.data : [])).catch(() => setCaletas([]));
    } else {
      setProvincias([]);
      setComunas([]);
      setCaletas([]);
    }
  }, [regionId]);

  // Cascada: cuando cambia provincia
  useEffect(() => {
    setComunaId('');
    setCaletaId('');
    if (provinciaId) {
      api.get(`/api/comunas?provinciaId=${provinciaId}`).then((r) => setComunas(Array.isArray(r.data) ? r.data : [])).catch(() => setComunas([]));
    } else if (regionId) {
      api.get(`/api/comunas?regionId=${regionId}`).then((r) => setComunas(Array.isArray(r.data) ? r.data : [])).catch(() => setComunas([]));
    }
  }, [provinciaId]);

  // Cascada: cuando cambia comuna
  useEffect(() => {
    setCaletaId('');
    if (comunaId) {
      api.get(`/api/caletas?comunaId=${comunaId}`).then((r) => setCaletas(Array.isArray(r.data) ? r.data : [])).catch(() => setCaletas([]));
    } else if (regionId) {
      api.get(`/api/caletas?regionId=${regionId}`).then((r) => setCaletas(Array.isArray(r.data) ? r.data : [])).catch(() => setCaletas([]));
    }
  }, [comunaId]);

  const hayFiltrosActivos = Boolean(
    (perfil && perfil !== 'TODOS') || especieId || regionId || provinciaId || comunaId || caletaId || usuarioId
  );

  const handleLimpiarFiltros = () => {
    setPerfil('TODOS');
    setEspecieId('');
    setRegionId('');
    setProvinciaId('');
    setComunaId('');
    setCaletaId('');
    setUsuarioId('');
  };

  const parseFilters = () => {
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
    if (regionId) filters.regionId = regionId;
    if (provinciaId) filters.provinciaId = provinciaId;
    if (comunaId) filters.comunaId = comunaId;
    if (caletaId) filters.caletaId = caletaId;
    if (usuarioId) filters.usuarioId = usuarioId;
    if (agruparPor) filters.agruparPor = agruparPor;
    return filters;
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const filters = parseFilters();
        const res = await getDesembarqueFisico(filters);
        setMetrics(res);
        if (showDetalle) {
          const detRes = await getDesembarqueFisicoDetalle(filters);
          setDetalle(detRes || []);
        }
      } catch (err) {
        console.error('Error cargando desembarque físico:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange, perfil, especieId, regionId, provinciaId, comunaId, caletaId, usuarioId, agruparPor]);

  const handleToggleDetalle = async () => {
    if (!showDetalle && detalle.length === 0) {
      setLoadingDetalle(true);
      try {
        const filters = parseFilters();
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

  const chartData = (metrics?.datosAgrupados || metrics?.porEspecie || []).slice(0, 8);

  const etiquetaAgrupacion = {
    CALETA: 'Caleta',
    RECOLECTOR: 'Persona / Recolector',
    ESPECIE: 'Especie',
    COMUNA: 'Comuna',
    PROVINCIA: 'Provincia',
    REGION: 'Región',
  }[agruparPor] || 'Grupo';

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
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
      }}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Cabecera y Switch de Agrupación */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 3,
                bgcolor: 'rgba(5, 150, 105, 0.12)',
                color: COLOR_PRIMARIO,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ScaleIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                Desembarque Físico (Indicador 1)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                Kilogramos reales recibidos en costa · Base técnica kg · Tendencias por caleta o persona (Sernapesca)
              </Typography>
            </Box>
          </Box>

          {/* Selector de Agrupación Normativa (T7) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>
              Agrupar por:
            </Typography>
            <ToggleButtonGroup
              value={agruparPor}
              exclusive
              onChange={(e, val) => val && setAgruparPor(val)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  py: 0.5,
                  px: 1.2,
                },
              }}
            >
              <ToggleButton value="CALETA">🏝️ Caleta</ToggleButton>
              <ToggleButton value="RECOLECTOR">👤 Persona</ToggleButton>
              <ToggleButton value="ESPECIE">🐟 Especie</ToggleButton>
              <ToggleButton value="COMUNA">Comuna</ToggleButton>
              <ToggleButton value="PROVINCIA">Provincia</ToggleButton>
              <ToggleButton value="REGION">Región</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Barra de Filtros Encadenados Jerárquicos */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
            p: 1.5,
            mb: 2.5,
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50'),
            borderRadius: 2.5,
            border: 1,
            borderColor: 'divider',
          }}
        >
          {/* Región */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2, fontSize: '0.78rem', fontFamily: 'Inter' }}
            >
              <MenuItem value="">Todas las regiones</MenuItem>
              {regiones.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Provincia (encadenada a región) */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={provinciaId}
              onChange={(e) => setProvinciaId(e.target.value)}
              displayEmpty
              disabled={!regionId || provincias.length === 0}
              sx={{ borderRadius: 2, fontSize: '0.78rem', fontFamily: 'Inter' }}
            >
              <MenuItem value="">Todas las provincias</MenuItem>
              {provincias.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Comuna (encadenada) */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={comunaId}
              onChange={(e) => setComunaId(e.target.value)}
              displayEmpty
              disabled={comunas.length === 0}
              sx={{ borderRadius: 2, fontSize: '0.78rem', fontFamily: 'Inter' }}
            >
              <MenuItem value="">Todas las comunas</MenuItem>
              {comunas.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Caleta (encadenada) */}
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={caletaId}
              onChange={(e) => setCaletaId(e.target.value)}
              displayEmpty
              disabled={caletas.length === 0}
              sx={{ borderRadius: 2, fontSize: '0.78rem', fontFamily: 'Inter' }}
            >
              <MenuItem value="">Todas las caletas</MenuItem>
              {caletas.map((cal) => (
                <MenuItem key={cal.id} value={cal.id}>
                  {cal.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Persona / Recolector */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2, fontSize: '0.78rem', fontFamily: 'Inter' }}
            >
              <MenuItem value="">Todos los declarantes</MenuItem>
              {usuarios.map((u) => {
                const nom = `${u.nombres || ''} ${u.apellidop || ''}`.trim() || `Usuario ${u.id}`;
                return (
                  <MenuItem key={u.id} value={u.id}>
                    {nom} {u.rut ? `(${u.rut})` : ''}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Especie */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={especieId}
              onChange={(e) => setEspecieId(e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2, fontSize: '0.78rem', fontFamily: 'Inter' }}
            >
              <MenuItem value="">Todas las especies</MenuItem>
              {especies.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Perfil */}
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              sx={{ borderRadius: 2, fontSize: '0.78rem', fontFamily: 'Inter' }}
            >
              <MenuItem value="TODOS">Todos los perfiles</MenuItem>
              <MenuItem value="RECOLECTOR">Recolector</MenuItem>
              <MenuItem value="ARMADOR">Armador</MenuItem>
              <MenuItem value="AREA">Área de Manejo</MenuItem>
            </Select>
          </FormControl>

          {/* Botón limpiar */}
          {hayFiltrosActivos && (
            <Tooltip title="Restablecer todos los filtros">
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<ResetIcon sx={{ fontSize: 16 }} />}
                onClick={handleLimpiarFiltros}
                sx={{ borderRadius: 2, fontSize: '0.75rem', textTransform: 'none', py: 0.5, px: 1.5 }}
              >
                Limpiar
              </Button>
            </Tooltip>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: 250 }}>
            <CircularProgress size={36} color="success" />
          </Box>
        ) : (
          <>
            {/* Tarjetas de Resumen KPI */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50'), border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Desembarque Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                    {(metrics?.totalDesembarqueKg || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })} <span style={{ fontSize: '0.85rem' }}>kg</span>
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50'), border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Declaraciones
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>
                    {(metrics?.totalDeclaraciones || 0).toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50'), border: 1, borderColor: 'divider' }}>
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
                    bgcolor: (metrics?.declaracionesAtipicas || 0) > 0 ? 'rgba(245, 158, 11, 0.08)' : (t) => (t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50'),
                    border: 1,
                    borderColor: (metrics?.declaracionesAtipicas || 0) > 0 ? 'warning.main' : 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: (metrics?.declaracionesAtipicas || 0) > 0 ? 'warning.dark' : 'text.secondary', fontWeight: 700 }}>
                      Desembarques Atípicos
                    </Typography>
                    {(metrics?.declaracionesAtipicas || 0) > 0 && <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                  </Box>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: (metrics?.declaracionesAtipicas || 0) > 0 ? 'warning.main' : 'text.primary', mt: 0.5 }}>
                    {metrics?.declaracionesAtipicas || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>( &gt; {(metrics?.umbralAtipicoKg || 5000).toLocaleString('es-CL')} kg)</span>
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Gráfico Dinámico por Agrupación */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                Tendencia de Desembarque Físico por {etiquetaAgrupacion}
              </Typography>
              <Chip
                label={`${(metrics?.datosAgrupados || []).length} ${etiquetaAgrupacion}(s)`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
              />
            </Box>

            {chartData.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">No se registran desembarques para los filtros seleccionados.</Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 210, mb: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="grupo"
                      stroke={theme.palette.text.secondary}
                      fontSize={10}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke={theme.palette.text.secondary}
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}t` : `${val}k`)}
                    />
                    <RechartsTooltip
                      formatter={(value, name, item) => [
                        `${Number(value).toLocaleString('es-CL')} kg (${item?.payload?.porcentaje || 0}%)`,
                        'Desembarque Físico',
                      ]}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 12,
                        border: `1px solid ${theme.palette.divider}`,
                        fontFamily: 'Inter',
                        fontSize: '0.85rem',
                      }}
                    />
                    <Bar dataKey="totalKg" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? COLOR_PRIMARIO : COLOR_SECUNDARIO} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Tabla Resumen de Agrupación (Ranking de Caleta, Persona, Especie, etc.) */}
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2.5, mb: 2, maxHeight: 200 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'grey.100') } }}>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>{etiquetaAgrupacion}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Total Desembarque</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">% del Total</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Declaraciones</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Promedio / Faena</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(metrics?.datosAgrupados || []).slice(0, 15).map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{row.grupo}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {Number(row.totalKg || 0).toLocaleString('es-CL')} kg
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`${row.porcentaje || 0}%`} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8rem' }}>{row.totalDeclaraciones}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>
                        {Number(row.promedioDeclaracionKg || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 })} kg
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Botón para expandir detalle de declaraciones individuales */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Button
                size="small"
                endIcon={showDetalle ? <UpIcon /> : <DownIcon />}
                onClick={handleToggleDetalle}
                sx={{ textTransform: 'none', fontFamily: 'Outfit', fontWeight: 600, color: 'text.secondary' }}
              >
                {showDetalle ? 'Ocultar Detalle de Declaraciones' : 'Ver Detalle de Declaraciones (Auditoría)'}
              </Button>
            </Box>

            {/* Tabla desplegable de detalle individual */}
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
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Actor / Declarante</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Caleta</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Comuna</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Provincia</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Desembarque (kg)</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detalle.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                              No hay declaraciones que coincidan con los filtros.
                            </TableCell>
                          </TableRow>
                        ) : (
                          detalle.map((d) => (
                            <TableRow key={`${d.perfil}-${d.id}`} hover>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{d.folio || `ID-${d.id}`}</TableCell>
                              <TableCell><Chip label={d.perfil} size="small" sx={{ fontSize: '0.7rem', height: 20 }} /></TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>{d.fecha ? new Date(d.fecha).toLocaleDateString('es-CL') : '—'}</TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                {d.actor} {d.rut ? `(${d.rut})` : ''}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>{d.especie}</TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>{d.caleta || '—'}</TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>{d.comuna || '—'}</TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>{d.provincia || '—'}</TableCell>
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
                          ))
                        )}
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
