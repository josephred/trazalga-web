import React, { useState, useEffect, useMemo } from 'react';
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
  Tabs,
  Tab,
  Button,
  IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Shield as ShieldIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  CheckCircle as OkIcon,
  Store as StoreIcon,
  Factory as FactoryIcon,
  Person as PersonIcon,
  FilterAltOff as ClearFilterIcon,
  AccountTree as FlowIcon,
  ToggleOff as ToggleOffIcon
} from '@mui/icons-material';
import { getPerfiladorRiesgo } from '../../services/reportesService';
import IndicadorHelpButton from './IndicadorHelpButton';
import TrazabilidadDialog from './TrazabilidadDialog';

export default function PerfiladorRiesgoWidget({ dateRange }) {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [celdaFiltro, setCeldaFiltro] = useState(null); // { variacion: 'ROJO', retencion: 'ROJO' }
  const [nivelFiltro, setNivelFiltro] = useState('TODOS');
  const [selectedLote, setSelectedLote] = useState(null);
  const [trazabilidadOpen, setTrazabilidadOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const filters = {
          startDate: dateRange?.startDate,
          endDate: dateRange?.endDate
        };
        const res = await getPerfiladorRiesgo(filters);
        setData(res);
      } catch (err) {
        console.error('Error cargando perfilador de riesgo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const isDesactivado = data?.activo === false || data?.controlDesactivado === true;

  // Filtrado de lotes según celda de la matriz o nivel
  const lotesFiltrados = useMemo(() => {
    if (!data?.lotes) return [];
    let list = data.lotes;

    if (celdaFiltro) {
      list = list.filter(
        (l) => l.nivelVariacion === celdaFiltro.variacion && l.nivelRetencion === celdaFiltro.retencion
      );
    } else if (nivelFiltro !== 'TODOS') {
      list = list.filter((l) => l.nivelRiesgo === nivelFiltro);
    }

    return list;
  }, [data?.lotes, celdaFiltro, nivelFiltro]);

  const handleCellClick = (variacion, retencion) => {
    if (celdaFiltro && celdaFiltro.variacion === variacion && celdaFiltro.retencion === retencion) {
      setCeldaFiltro(null);
    } else {
      setCeldaFiltro({ variacion, retencion });
      setNivelFiltro('TODOS');
    }
  };

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'ROJO':
        return '#ef4444';
      case 'AMARILLO':
        return '#f59e0b';
      case 'VERDE':
        return '#10b981';
      default:
        return theme.palette.text.secondary;
    }
  };

  const getActorIcon = (tipo) => {
    if (!tipo) return <PersonIcon sx={{ fontSize: 16 }} />;
    const t = tipo.toUpperCase();
    if (t.includes('PLANTA')) return <FactoryIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />;
    if (t.includes('COMERCIAL')) return <StoreIcon sx={{ fontSize: 16, color: '#3b82f6' }} />;
    return <PersonIcon sx={{ fontSize: 16, color: '#10b981' }} />;
  };

  // Helper para armar la matriz 3x3
  const matrizDict = useMemo(() => {
    const dict = {};
    if (data?.matriz) {
      data.matriz.forEach((c) => {
        dict[`${c.variacion}_${c.retencion}`] = c;
      });
    }
    return dict;
  }, [data?.matriz]);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: 1,
        borderColor: (data?.resumen?.rojo?.conteo || 0) > 0 ? 'error.light' : 'divider',
        bgcolor: 'background.paper',
        p: { xs: 2, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow:
          (data?.resumen?.rojo?.conteo || 0) > 0
            ? '0 10px 20px -3px rgba(239, 68, 68, 0.06)'
            : '0 4px 6px -1px rgba(0,0,0,0.02)'
      }}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Cabecera */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 3,
                bgcolor: isDesactivado
                  ? 'action.hover'
                  : (data?.resumen?.rojo?.conteo || 0) > 0
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(59, 130, 246, 0.1)',
                color: isDesactivado
                  ? 'text.secondary'
                  : (data?.resumen?.rojo?.conteo || 0) > 0
                    ? '#ef4444'
                    : 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                  Perfilador de Riesgo de Fiscalización (Indicador 9)
                </Typography>
                <IndicadorHelpButton indicadorId={9} />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                Matriz de correlación Variación &times; Retención · Modulador biológico · Agravantes Veda/LED
              </Typography>
            </Box>
          </Box>

          {!loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isDesactivado ? (
                <Chip
                  icon={<ToggleOffIcon sx={{ fontSize: 16 }} />}
                  label="Perfilador Desactivado"
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24, bgcolor: 'action.hover', color: 'text.secondary' }}
                />
              ) : (
                <Chip
                  label={`${data?.resumen?.totalLotes || 0} lotes evaluados`}
                  size="small"
                  color={(data?.resumen?.rojo?.conteo || 0) > 0 ? 'error' : 'primary'}
                  sx={{ fontWeight: 700, fontSize: '0.72rem', height: 24 }}
                />
              )}
            </Box>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: 320 }}>
            <CircularProgress size={36} color="primary" />
          </Box>
        ) : isDesactivado ? (
          /* Estado Desactivado */
          <Box
            sx={{
              p: 4,
              my: 'auto',
              borderRadius: 3,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)'),
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
                Perfilador de riesgo de fiscalización desactivado en Administración
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Inter', color: 'text.secondary', lineHeight: 1.5, fontSize: '0.85rem' }}>
                La matriz de correlación multidimensional y jerarquización de actores se encuentra inactiva mediante el parámetro administrativo <code>riesgo_activo = false</code>.
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, fontFamily: 'Inter', color: 'text.disabled' }}>
                Para habilitar el perfilador de riesgo, active este control en <strong>Administración &rarr; Configuración General</strong>.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            {/* KPI Cards: Tres Niveles de Riesgo */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12} sm={4}>
                <Box
                  onClick={() => { setNivelFiltro(nivelFiltro === 'VERDE' ? 'TODOS' : 'VERDE'); setCeldaFiltro(null); }}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                    border: 1.5,
                    borderColor: nivelFiltro === 'VERDE' ? '#10b981' : 'rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#10b981', transform: 'translateY(-2px)' }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <OkIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>
                        Bajo Riesgo
                      </Typography>
                    </Box>
                    <Chip label={`${data?.resumen?.verde?.porcentaje || 0}%`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#059669' }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: '#10b981', mt: 1 }}>
                    {data?.resumen?.verde?.conteo || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>lotes</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                    {(data?.resumen?.verde?.kg || 0).toLocaleString('es-CL')} kg consistentes
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box
                  onClick={() => { setNivelFiltro(nivelFiltro === 'AMARILLO' ? 'TODOS' : 'AMARILLO'); setCeldaFiltro(null); }}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)',
                    border: 1.5,
                    borderColor: nivelFiltro === 'AMARILLO' ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#f59e0b', transform: 'translateY(-2px)' }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <WarningIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                      <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 800, textTransform: 'uppercase' }}>
                        Riesgo Medio
                      </Typography>
                    </Box>
                    <Chip label={`${data?.resumen?.amarillo?.porcentaje || 0}%`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: '#f59e0b', mt: 1 }}>
                    {data?.resumen?.amarillo?.conteo || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>lotes</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                    {(data?.resumen?.amarillo?.kg || 0).toLocaleString('es-CL')} kg en seguimiento
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box
                  onClick={() => { setNivelFiltro(nivelFiltro === 'ROJO' ? 'TODOS' : 'ROJO'); setCeldaFiltro(null); }}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: (data?.resumen?.rojo?.conteo || 0) > 0 ? 'rgba(239, 68, 68, 0.1)' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50',
                    border: 1.5,
                    borderColor: nivelFiltro === 'ROJO' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#ef4444', transform: 'translateY(-2px)' }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                      <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 800, textTransform: 'uppercase' }}>
                        Riesgo Crítico
                      </Typography>
                    </Box>
                    <Chip label={`${data?.resumen?.rojo?.porcentaje || 0}%`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c' }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: '#ef4444', mt: 1 }}>
                    {data?.resumen?.rojo?.conteo || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>lotes</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                    {(data?.resumen?.rojo?.kg || 0).toLocaleString('es-CL')} kg prioritarios de fiscalización
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Pestañas de Navegación */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 40 }}>
                <Tab label="Matriz & Lotes de Riesgo" sx={{ fontWeight: 700, fontSize: '0.82rem', minHeight: 40 }} />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>Jerarquía de Actores (Fiscalización)</span>
                      {data?.actores?.length > 0 && (
                        <Chip label={data.actores.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                      )}
                    </Box>
                  }
                  sx={{ fontWeight: 700, fontSize: '0.82rem', minHeight: 40 }}
                />
              </Tabs>
            </Box>

            {/* PESTAÑA 0: MATRIZ 3x3 Y LOTES */}
            {tab === 0 && (
              <Box>
                {/* Matriz 3x3 Interactiva de Correlación */}
                <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 1 }}>
                  Matriz de Correlación Bidimensional (Variación de Peso &times; Retención en Bodega)
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                  Haga clic en cualquier celda para aislar los lotes que se concentran en ese cuadrante de riesgo:
                </Typography>

                <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, p: 2, mb: 2.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'grey.50' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem', width: '22%' }}>
                          &Delta; Peso \ Retención
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem', color: '#10b981' }}>
                          Verde (&lt; 3d)
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem', color: '#f59e0b' }}>
                          Amarillo (3 &ndash; 7d)
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem', color: '#ef4444' }}>
                          Rojo (&ge; 7d)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {['VERDE', 'AMARILLO', 'ROJO'].map((vRow) => {
                        const rowLabel = vRow === 'VERDE' ? 'Verde (< 5%)' : vRow === 'AMARILLO' ? 'Amarillo (5-10%)' : 'Rojo (≥ 10%)';
                        const rowColor = getNivelColor(vRow);
                        return (
                          <TableRow key={vRow}>
                            <TableCell sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.75rem', color: rowColor }}>
                              {rowLabel}
                            </TableCell>
                            {['VERDE', 'AMARILLO', 'ROJO'].map((rCol) => {
                              const celda = matrizDict[`${vRow}_${rCol}`] || { conteo: 0, kg: 0 };
                              const isSelected = celdaFiltro?.variacion === vRow && celdaFiltro?.retencion === rCol;
                              const dominantColor = getNivelColor(celda.nivelDominante || (vRow === 'ROJO' || rCol === 'ROJO' ? 'ROJO' : vRow === 'AMARILLO' || rCol === 'AMARILLO' ? 'AMARILLO' : 'VERDE'));
                              return (
                                <TableCell
                                  key={rCol}
                                  align="center"
                                  onClick={() => handleCellClick(vRow, rCol)}
                                  sx={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    bgcolor: isSelected
                                      ? `${dominantColor}25`
                                      : celda.conteo > 0
                                        ? `${dominantColor}0d`
                                        : 'transparent',
                                    border: isSelected ? `2px solid ${dominantColor}` : 1,
                                    borderColor: isSelected ? dominantColor : 'divider',
                                    '&:hover': {
                                      bgcolor: `${dominantColor}20`
                                    }
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: dominantColor }}>
                                    {celda.conteo} {celda.conteo === 1 ? 'lote' : 'lotes'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                                    {(celda.kg || 0).toLocaleString('es-CL')} kg
                                  </Typography>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>

                {/* Filtro activo */}
                {(celdaFiltro || nivelFiltro !== 'TODOS') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Filtro activo:
                    </Typography>
                    {celdaFiltro && (
                      <Chip
                        label={`Cuadrante: &Delta; Peso ${celdaFiltro.variacion} & Retención ${celdaFiltro.retencion}`}
                        size="small"
                        onDelete={() => setCeldaFiltro(null)}
                        color="primary"
                        sx={{ fontSize: '0.72rem', fontWeight: 700 }}
                      />
                    )}
                    {nivelFiltro !== 'TODOS' && (
                      <Chip
                        label={`Nivel: ${nivelFiltro}`}
                        size="small"
                        onDelete={() => setNivelFiltro('TODOS')}
                        sx={{ fontSize: '0.72rem', fontWeight: 700, bgcolor: `${getNivelColor(nivelFiltro)}20`, color: getNivelColor(nivelFiltro) }}
                      />
                    )}
                    <Button
                      size="small"
                      startIcon={<ClearFilterIcon />}
                      onClick={() => { setCeldaFiltro(null); setNivelFiltro('TODOS'); }}
                      sx={{ fontSize: '0.72rem', textTransform: 'none' }}
                    >
                      Restablecer todos los lotes
                    </Button>
                  </Box>
                )}

                {/* Tabla de Lotes de Riesgo */}
                <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 1 }}>
                  Lotes Clasificados ({lotesFiltrados.length}) &middot; Ordenados por Nivel de Riesgo
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, maxHeight: 380 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Folio</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Origen &middot; Actor</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">&Delta; Peso (%)</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Bodega</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Severidad Bio</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Agravantes</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Nivel Riesgo</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Motivo de Clasificación</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Acción</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lotesFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            No existen lotes en el filtro seleccionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        lotesFiltrados.map((lote, idx) => {
                          const nivelColor = getNivelColor(lote.nivelRiesgo);
                          return (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700 }}>
                                {lote.folioOrigen}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                  {lote.actorOrigen}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                                  {lote.eslabonOrigen} &middot; {lote.rutOrigen}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                {lote.especie}
                                <Chip label={lote.humedadOrigen} size="small" sx={{ fontSize: '0.65rem', height: 18, ml: 0.5 }} />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.82rem', color: lote.nivelVariacion === 'ROJO' ? 'error.main' : lote.nivelVariacion === 'AMARILLO' ? 'warning.main' : 'text.primary' }}>
                                {lote.deltaPct > 0 ? `+${lote.deltaPct}%` : `${lote.deltaPct}%`}
                              </TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                {lote.diasEnBodega} d
                              </TableCell>
                              <TableCell align="center">
                                {lote.severidadBiologica === 'CRITICA' ? (
                                  <Chip label="CRÍTICA" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#b91c1c', color: '#fff', fontWeight: 800 }} />
                                ) : lote.severidadBiologica === 'ATENCION' ? (
                                  <Chip label="ATENCIÓN" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#f59e0b', color: '#fff', fontWeight: 800 }} />
                                ) : lote.severidadBiologica === 'NEUTRA' ? (
                                  <Chip label="NEUTRA" size="small" color="success" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }} />
                                ) : (
                                  <Chip label="—" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {lote.marcasAgravantes && lote.marcasAgravantes.length > 0 ? (
                                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {lote.marcasAgravantes.map((m, mIdx) => (
                                      <Chip
                                        key={mIdx}
                                        label={m}
                                        size="small"
                                        color="error"
                                        sx={{ fontSize: '0.65rem', height: 20, fontWeight: 800 }}
                                      />
                                    ))}
                                  </Box>
                                ) : (
                                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>Ninguno</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={lote.nivelRiesgo}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 900,
                                    bgcolor: `${nivelColor}15`,
                                    color: nivelColor,
                                    border: `1.5px solid ${nivelColor}`
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.78rem', maxWidth: 280, color: 'text.secondary', lineHeight: 1.3 }}>
                                {lote.motivoRiesgo}
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="Ver trazabilidad completa del lote">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      setSelectedLote(lote);
                                      setTrazabilidadOpen(true);
                                    }}
                                  >
                                    <FlowIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* PESTAÑA 1: JERARQUÍA DE ACTORES */}
            {tab === 1 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 1 }}>
                  Jerarquización de Actores para Fiscalización Focalizada
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                  Los actores se ordenan por su peor nivel vigente (Rojo &gt; Amarillo &gt; Verde), cantidad de lotes críticos y volumen total en kilogramos:
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, maxHeight: 420 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Actor</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Eslabón</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Peor Nivel</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Lotes Rojos</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Lotes Amarillos</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Lotes Verdes</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Total Lotes</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Total Kg Movilizados</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.actores?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            No hay actores con lotes registrados en el período.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data?.actores?.map((actor, idx) => {
                          const peorColor = getNivelColor(actor.peorNivel);
                          return (
                            <TableRow key={idx} hover sx={{ bgcolor: actor.lotesRojo > 0 ? 'rgba(239, 68, 68, 0.03)' : 'inherit' }}>
                              <TableCell sx={{ fontWeight: 700, fontSize: '0.84rem' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getActorIcon(actor.tipoActor)}
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                      {actor.actor}
                                    </Typography>
                                    {actor.rut && (
                                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                                        {actor.rut}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                <Chip label={actor.tipoActor} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={actor.peorNivel}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 800,
                                    bgcolor: `${peorColor}15`,
                                    color: peorColor,
                                    border: `1px solid ${peorColor}60`
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: actor.lotesRojo > 0 ? '#ef4444' : 'text.disabled' }}>
                                {actor.lotesRojo}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: actor.lotesAmarillo > 0 ? '#f59e0b' : 'text.disabled' }}>
                                {actor.lotesAmarillo}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: actor.lotesVerde > 0 ? '#10b981' : 'text.disabled' }}>
                                {actor.lotesVerde}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.84rem' }}>
                                {actor.totalLotes}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.84rem' }}>
                                {(actor.totalKg || 0).toLocaleString('es-CL')} kg
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {/* Modal de Trazabilidad */}
      {selectedLote && (
        <TrazabilidadDialog
          open={trazabilidadOpen}
          onClose={() => setTrazabilidadOpen(false)}
          declaracionId={selectedLote.folioOrigen}
          tipoReporte={selectedLote.eslabonOrigen}
          row={selectedLote}
        />
      )}
    </Card>
  );
}
