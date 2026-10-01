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
  Tooltip,
  Button,
  ButtonGroup
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Warehouse as WarehouseIcon,
  Circle as CircleIcon,
  Warning as WarningIcon,
  Store as StoreIcon,
  ToggleOff as ToggleOffIcon,
  CheckCircleOutline as CheckIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  ErrorOutline as ErrorOutlineIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import { getRetencionBodega } from '../../services/reportesService';

export default function RetencionBodegaWidget({ dateRange }) {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroSemaforo, setFiltroSemaforo] = useState('ROJO'); // 'ROJO' | 'TODOS' | 'AMARILLO' | 'VERDE' | 'BODEGA'
  const [filtroHumedad, setFiltroHumedad] = useState('TODOS'); // 'TODOS' | 'HUMEDO' | 'SEMI_HUMEDO' | 'SEMI_SECO' | 'SECO'

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
    const fetchData = async () => {
      setLoading(true);
      try {
        const filters = parseDates();
        const res = await getRetencionBodega(filters);
        setData(res);
      } catch (err) {
        console.error('Error cargando retención en bodega (Res. 3602):', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const getSemaforoColor = (sem) => {
    switch (sem) {
      case 'VERDE': return '#10b981';
      case 'AMARILLO': case 'AMARILLA': return '#f59e0b';
      case 'NARANJA': return '#f97316';
      case 'ROJO': case 'ROJA': return '#ef4444';
      default: return theme.palette.text.disabled;
    }
  };

  const isDesactivado = data?.activo === false || data?.controlDesactivado === true;
  const isSinLotes = !isDesactivado && (!data?.lotes || data.lotes.length === 0);
  const isConResultados = !isDesactivado && data?.lotes && data.lotes.length > 0;

  // Filas normativas de la matriz 4x3 según Res. 3602
  const filasMatriz = [
    {
      clave: 'HUMEDO',
      nombre: 'Húmedo',
      plazoDesc: `≤ ${data?.parametros?.humedoMaxHoras || 24} h`,
      data: data?.matriz?.HUMEDO || { VERDE: 0, AMARILLO: 0, ROJO: 0, totalLotes: 0, totalKg: 0 }
    },
    {
      clave: 'SEMI_HUMEDO',
      nombre: 'Semihúmedo',
      plazoDesc: `≤ ${data?.parametros?.semihumedoMaxHoras || 72} h (3 días)`,
      data: data?.matriz?.SEMI_HUMEDO || { VERDE: 0, AMARILLO: 0, ROJO: 0, totalLotes: 0, totalKg: 0 }
    },
    {
      clave: 'SEMI_SECO',
      nombre: 'Semiseco',
      plazoDesc: `≤ ${data?.parametros?.semisecoMaxHoras || 216} h (9 días)`,
      data: data?.matriz?.SEMI_SECO || { VERDE: 0, AMARILLO: 0, ROJO: 0, totalLotes: 0, totalKg: 0 }
    },
    {
      clave: 'SECO',
      nombre: 'Seco',
      plazoDesc: 'Sin límite temporal',
      data: data?.matriz?.SECO || { VERDE: 0, AMARILLO: 0, ROJO: 0, totalLotes: 0, totalKg: 0 }
    }
  ];

  // Filtrado de lotes para la tabla detallada
  const lotesFiltrados = (data?.lotes || []).filter(row => {
    if (filtroSemaforo === 'ROJO' && row.semaforo !== 'ROJO') return false;
    if (filtroSemaforo === 'AMARILLO' && row.semaforo !== 'AMARILLO') return false;
    if (filtroSemaforo === 'VERDE' && row.semaforo !== 'VERDE') return false;
    if (filtroSemaforo === 'BODEGA' && !row.enBodega) return false;

    if (filtroHumedad !== 'TODOS') {
      const humNorm = (row.estadoDeclarado || '').toUpperCase();
      if (filtroHumedad === 'HUMEDO' && (!humNorm.includes('HUM') || humNorm.includes('SEMI'))) return false;
      if (filtroHumedad === 'SEMI_HUMEDO' && (!humNorm.includes('SEMI') || !humNorm.includes('HUM'))) return false;
      if (filtroHumedad === 'SEMI_SECO' && (!humNorm.includes('SEMI') || !humNorm.includes('SEC'))) return false;
      if (filtroHumedad === 'SECO' && (!humNorm.includes('SEC') || humNorm.includes('SEMI'))) return false;
    }

    return true;
  });

  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
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
                  Retención en Bodega Virtual (Indicador 7 — Res. 3602)
                </Typography>
                <Chip
                  label="RES. 3602"
                  size="small"
                  sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, bgcolor: 'secondary.50', color: 'secondary.main', border: 1, borderColor: 'secondary.200' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                Control anti-invención de stock · Tramos normativos de permanencia por estado de humedad
              </Typography>
            </Box>
          </Box>

          {/* Badges de Estado en Cabecera */}
          {!loading && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
                <>
                  <Chip
                    icon={<StoreIcon sx={{ fontSize: 14 }} />}
                    label={`${data?.totalLotesEnBodega || 0} en bodega (${(data?.totalKgEnBodega || 0).toLocaleString('es-CL')} kg)`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: 24 }}
                  />
                  {(data?.semaforoRojo || 0) > 0 ? (
                    <Chip
                      icon={<ErrorOutlineIcon sx={{ fontSize: 14 }} />}
                      label={`${data?.semaforoRojo} lotes en alerta roja`}
                      size="small"
                      color="error"
                      sx={{ fontWeight: 800, fontSize: '0.7rem', height: 24 }}
                    />
                  ) : (
                    <Chip
                      icon={<CheckIcon sx={{ fontSize: 14 }} />}
                      label="0 fuera de plazo"
                      size="small"
                      color="success"
                      sx={{ fontWeight: 700, fontSize: '0.7rem', height: 24 }}
                    />
                  )}
                </>
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
            {/* ESTADO 1: Control Desactivado en Administración */}
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
                    La supervisión de tiempos de permanencia en bodega virtual según tramos de la Res. 3602 está inactiva mediante el parámetro administrativo <code>retencion_bodega_activo = false</code>.
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1.5, fontFamily: 'Inter', color: 'text.disabled' }}>
                    Para habilitar el semáforo normativo por tramos de humedad (24h / 72h / 216h), active este control en <strong>Administración → Configuración General</strong>.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ESTADO 2: Control Activo sin Lotes que Clasificar */}
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
                    Sin lotes en bodega pendientes de despacho
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'Inter', color: 'text.secondary', lineHeight: 1.5, fontSize: '0.85rem' }}>
                    El control normativo Res. 3602 se encuentra plenamente activo. En este momento no existen lotes retenidos en bodega virtual pendientes de despacho para el período evaluado.
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    <Chip label={`Húmedo: ≤ ${data?.parametros?.humedoMaxHoras || 24} h`} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                    <Chip label={`Semihúmedo: ≤ ${data?.parametros?.semihumedoMaxHoras || 72} h`} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                    <Chip label={`Semiseco: ≤ ${data?.parametros?.semisecoMaxHoras || 216} h`} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                    <Chip label="Seco: Sin límite" size="small" variant="outlined" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                  </Box>
                </Box>
              </Box>
            )}

            {/* ESTADO 3: Control Activo con Resultados (T7.3) */}
            {isConResultados && (
              <>
                {/* 1. MATRIZ 4x3: Filas = Estados de Humedad (Res. 3602), Columnas = Semáforo */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'text.primary' }}>
                        Matriz de Retención por Estado de Humedad (Res. 3602)
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                      Preaviso preventivo al {data?.parametros?.preavisoPct || 80}% del plazo máximo
                    </Typography>
                  </Box>

                  <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'grey.100' }}>
                          <TableCell sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem', width: '28%' }}>
                            Estado de Humedad Declarado
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem', width: '22%' }}>
                            Plazo Máximo Normativo
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem', color: '#059669', bgcolor: 'rgba(16, 185, 129, 0.08)' }} align="center">
                            Verde (Conforme)
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem', color: '#d97706', bgcolor: 'rgba(245, 158, 11, 0.08)' }} align="center">
                            Amarillo (Preaviso)
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem', color: '#b91c1c', bgcolor: 'rgba(239, 68, 68, 0.08)' }} align="center">
                            Rojo (Excedido)
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem' }} align="right">
                            Total Lotes / Masa (kg)
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filasMatriz.map((row) => {
                          const m = row.data;
                          return (
                            <TableRow key={row.clave} hover>
                              <TableCell sx={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.82rem' }}>
                                {row.nombre}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.78rem', color: 'text.secondary' }}>
                                {row.plazoDesc}
                              </TableCell>
                              <TableCell align="center" sx={{ bgcolor: 'rgba(16, 185, 129, 0.03)' }}>
                                <Chip
                                  label={`${m.VERDE || 0}`}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    height: 22,
                                    minWidth: 36,
                                    bgcolor: (m.VERDE || 0) > 0 ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                    color: (m.VERDE || 0) > 0 ? '#059669' : 'text.disabled'
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center" sx={{ bgcolor: 'rgba(245, 158, 11, 0.03)' }}>
                                <Chip
                                  label={`${m.AMARILLO || 0}`}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    height: 22,
                                    minWidth: 36,
                                    bgcolor: (m.AMARILLO || 0) > 0 ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                                    color: (m.AMARILLO || 0) > 0 ? '#d97706' : 'text.disabled'
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center" sx={{ bgcolor: 'rgba(239, 68, 68, 0.03)' }}>
                                <Chip
                                  label={`${m.ROJO || 0}`}
                                  size="small"
                                  sx={{
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    height: 22,
                                    minWidth: 36,
                                    bgcolor: (m.ROJO || 0) > 0 ? '#ef4444' : 'transparent',
                                    color: (m.ROJO || 0) > 0 ? '#ffffff' : 'text.disabled'
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: 'Inter', fontSize: '0.8rem', fontWeight: 600 }}>
                                {m.totalLotes || 0} lotes · <span style={{ color: theme.palette.text.secondary }}>{((m.totalKg || 0)).toLocaleString('es-CL')} kg</span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* 2. BARRA DE FILTROS PARA AUDITORÍA DE LOTES */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'Inter', fontWeight: 700, color: 'text.secondary' }}>
                      Filtrar lotes:
                    </Typography>
                    <ButtonGroup size="small" variant="outlined" sx={{ '& .MuiButton-root': { textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, px: 1.5, py: 0.3 } }}>
                      <Button
                        variant={filtroSemaforo === 'ROJO' ? 'contained' : 'outlined'}
                        color="error"
                        onClick={() => setFiltroSemaforo('ROJO')}
                      >
                        En Rojo ({data?.semaforoRojo || 0})
                      </Button>
                      <Button
                        variant={filtroSemaforo === 'AMARILLO' ? 'contained' : 'outlined'}
                        color="warning"
                        onClick={() => setFiltroSemaforo('AMARILLO')}
                      >
                        En Amarillo ({data?.semaforoAmarillo || 0})
                      </Button>
                      <Button
                        variant={filtroSemaforo === 'BODEGA' ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => setFiltroSemaforo('BODEGA')}
                      >
                        Solo en Bodega ({data?.totalLotesEnBodega || 0})
                      </Button>
                      <Button
                        variant={filtroSemaforo === 'TODOS' ? 'contained' : 'outlined'}
                        onClick={() => setFiltroSemaforo('TODOS')}
                      >
                        Todos ({data?.totalLotes || 0})
                      </Button>
                    </ButtonGroup>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Chip
                      size="small"
                      clickable
                      label="Todas humedades"
                      color={filtroHumedad === 'TODOS' ? 'default' : 'default'}
                      variant={filtroHumedad === 'TODOS' ? 'filled' : 'outlined'}
                      onClick={() => setFiltroHumedad('TODOS')}
                      sx={{ fontSize: '0.68rem', height: 22 }}
                    />
                    <Chip
                      size="small"
                      clickable
                      label="Húmedo"
                      color={filtroHumedad === 'HUMEDO' ? 'primary' : 'default'}
                      variant={filtroHumedad === 'HUMEDO' ? 'filled' : 'outlined'}
                      onClick={() => setFiltroHumedad('HUMEDO')}
                      sx={{ fontSize: '0.68rem', height: 22 }}
                    />
                    <Chip
                      size="small"
                      clickable
                      label="Semihúmedo"
                      color={filtroHumedad === 'SEMI_HUMEDO' ? 'primary' : 'default'}
                      variant={filtroHumedad === 'SEMI_HUMEDO' ? 'filled' : 'outlined'}
                      onClick={() => setFiltroHumedad('SEMI_HUMEDO')}
                      sx={{ fontSize: '0.68rem', height: 22 }}
                    />
                    <Chip
                      size="small"
                      clickable
                      label="Semiseco"
                      color={filtroHumedad === 'SEMI_SECO' ? 'primary' : 'default'}
                      variant={filtroHumedad === 'SEMI_SECO' ? 'filled' : 'outlined'}
                      onClick={() => setFiltroHumedad('SEMI_SECO')}
                      sx={{ fontSize: '0.68rem', height: 22 }}
                    />
                  </Box>
                </Box>

                {/* 3. TABLA DE LOTES EVALUADOS */}
                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Folio</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Especie</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Kg</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Estado Declarado</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Tramo Real</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Horas Transcurridas</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Plazo Máx.</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Ubicación / Destino</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Semáforo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lotesFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary', fontFamily: 'Inter' }}>
                            No hay lotes que coincidan con los filtros seleccionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        lotesFiltrados.map((row, idx) => {
                          const esRojo = row.semaforo === 'ROJO';
                          const esAmarillo = row.semaforo === 'AMARILLO';
                          return (
                            <TableRow key={idx} hover sx={{ bgcolor: esRojo ? 'rgba(239, 68, 68, 0.02)' : 'inherit' }}>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700 }}>
                                {row.folio}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem' }}>
                                {row.especie}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 700 }} align="right">
                                {row.kg?.toLocaleString('es-CL')}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.8rem', fontWeight: 600 }}>
                                <Chip
                                  label={row.estadoDeclarado}
                                  size="small"
                                  sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700 }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.8rem' }}>
                                <Tooltip title={row.inconsistenciaHumedad ? `Inconsistencia biológica: declarado como ${row.estadoDeclarado}, pero por tiempo transcurrido (${row.horasTranscurridas} h) ya corresponde a ${row.tramoReal}.` : 'Consistente'}>
                                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: row.inconsistenciaHumedad ? 800 : 500,
                                        color: row.inconsistenciaHumedad ? 'error.main' : 'text.primary',
                                        fontSize: '0.75rem'
                                      }}
                                    >
                                      {row.tramoReal}
                                    </Typography>
                                    {row.inconsistenciaHumedad && (
                                      <WarningIcon sx={{ fontSize: 13, color: 'error.main' }} />
                                    )}
                                  </Box>
                                </Tooltip>
                              </TableCell>
                              <TableCell align="center" sx={{ fontFamily: 'Inter', fontSize: '0.8rem', fontWeight: 700 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.8rem', color: esRojo ? 'error.main' : 'text.primary' }}>
                                    {row.horasTranscurridas} h
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                    {(row.horasTranscurridas / 24).toFixed(1)} días
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center" sx={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'text.secondary' }}>
                                {row.plazoMaxHoras !== null && row.plazoMaxHoras !== undefined ? `${row.plazoMaxHoras} h` : 'Sin límite'}
                              </TableCell>
                              <TableCell align="center">
                                {row.enBodega ? (
                                  <Chip
                                    icon={<StoreIcon sx={{ fontSize: 12 }} />}
                                    label="En Bodega Virtual"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700 }}
                                  />
                                ) : (
                                  <Chip
                                    icon={<LocalShippingIcon sx={{ fontSize: 12 }} />}
                                    label="Despachado a Planta"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }}
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  icon={<CircleIcon sx={{ fontSize: '10px !important', color: `${getSemaforoColor(row.semaforo)} !important` }} />}
                                  label={row.semaforo}
                                  size="small"
                                  sx={{
                                    fontSize: '0.68rem',
                                    height: 20,
                                    fontWeight: 800,
                                    bgcolor: `${getSemaforoColor(row.semaforo)}15`,
                                    color: getSemaforoColor(row.semaforo),
                                    border: `1px solid ${getSemaforoColor(row.semaforo)}40`
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
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
