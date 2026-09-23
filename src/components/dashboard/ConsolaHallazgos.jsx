import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Stack,
  Tooltip,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Speed as SpeedIcon,
  Scale as ScaleIcon,
  Assessment as AssessmentIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon,
  WarningAmber as WarningIcon,
  Block as BlockIcon,
  DoneAll as DoneAllIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';
import { getPerfil } from '../../auth/sesion';
import { puedeHacer } from '../../auth/perfiles';

// Metadatos de configuración visual para cada tipo de marca
const MARCA_CONFIG = {
  EN_VEDA: {
    label: 'En Veda',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: GavelIcon,
    indicador: 'Indicador 5',
    descripcion: 'Extracción en periodo o método bajo decreto de veda vigente',
  },
  LED_EXCEDIDO: {
    label: 'LED Excedido',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: SpeedIcon,
    indicador: 'Indicador 4',
    descripcion: 'Sobrepaso de límite de extracción diario por embarcación/pescador',
  },
  DESEMBARQUE_ATIPICO: {
    label: 'Desembarque Atípico',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.3)',
    icon: ScaleIcon,
    indicador: 'Indicador 1',
    descripcion: 'Volumen individual superior al umbral operativo de fiscalización',
  },
  CUOTA_EXCEDIDA: {
    label: 'Cuota Excedida',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: AssessmentIcon,
    indicador: 'Indicador 3',
    descripcion: 'Consumo acumulado sobre el límite biológico efectivo autorizado',
  },
  POSTERIOR_CIERRE: {
    label: 'Posterior Cierre',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.1)',
    border: 'rgba(236, 72, 153, 0.3)',
    icon: LockIcon,
    indicador: 'Indicador 3',
    descripcion: 'Declaración ingresada con fecha posterior al cierre de cuota',
  },
};

export default function ConsolaHallazgos() {
  const perfil = getPerfil();
  const puedeResolver = puedeHacer(perfil, 'RESOLVER_HALLAZGO');

  const [hallazgos, setHallazgos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filtros
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendientes'); // 'pendientes' | 'resueltas' | 'todas'
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filtroMarca) params.marca = filtroMarca;
      if (filtroEstado === 'pendientes') params.soloPendientes = true;
      else if (filtroEstado === 'resueltas') params.resuelta = true;
      if (filtroTipo) params.tipo = filtroTipo;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [resLista, resResumen] = await Promise.all([
        api.get('/api/declaracion-marcas', { params }),
        api.get('/api/declaracion-marcas/resumen').catch(() => null),
      ]);

      setHallazgos(Array.isArray(resLista.data) ? resLista.data : []);
      if (resResumen && resResumen.data) {
        setResumen(resResumen.data);
      }
    } catch (err) {
      console.error('Error cargando hallazgos:', err);
      setError('No se pudieron obtener las marcas de fiscalización del servidor.');
    } finally {
      setLoading(false);
    }
  }, [filtroMarca, filtroEstado, filtroTipo, startDate, endDate]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleResolver = async (id) => {
    try {
      await api.put(`/api/declaracion-marcas/${id}/resolver`);
      setActionSuccess(`Hallazgo #${id} marcado como RESUELTO.`);
      setTimeout(() => setActionSuccess(null), 3500);
      cargarDatos();
    } catch (err) {
      console.error('Error al resolver marca:', err);
      setError('Error al actualizar el estado del hallazgo.');
    }
  };

  const handleReabrir = async (id) => {
    try {
      await api.put(`/api/declaracion-marcas/${id}/reabrir`);
      setActionSuccess(`Hallazgo #${id} REABIERTO.`);
      setTimeout(() => setActionSuccess(null), 3500);
      cargarDatos();
    } catch (err) {
      console.error('Error al reabrir marca:', err);
      setError('Error al reabrir el hallazgo.');
    }
  };

  // Filtrado de texto local
  const hallazgosFiltrados = useMemo(() => {
    if (!filtroTexto.trim()) return hallazgos;
    const txt = filtroTexto.toLowerCase();
    return hallazgos.filter((h) => {
      const detalle = (h.detalle || '').toLowerCase();
      const tipo = (h.declaracionTipo || '').toLowerCase();
      const marca = (h.marca || '').toLowerCase();
      const idStr = String(h.id || '');
      const decIdStr = String(h.declaracionId || '');
      return (
        detalle.includes(txt) ||
        tipo.includes(txt) ||
        marca.includes(txt) ||
        idStr.includes(txt) ||
        decIdStr.includes(txt)
      );
    });
  }, [hallazgos, filtroTexto]);

  const exportarCSV = () => {
    if (!hallazgosFiltrados.length) return;
    const headers = ['ID', 'Marca', 'Tipo Faena', 'ID Faena', 'Detalle', 'Regla ID', 'Resuelta', 'Fecha Detección'];
    const rows = hallazgosFiltrados.map((h) => [
      h.id,
      h.marca,
      h.declaracionTipo,
      h.declaracionId ?? 'BLOQUEADO',
      `"${(h.detalle || '').replace(/"/g, '""')}"`,
      h.reglaId ?? '',
      h.resuelta ? 'SI' : 'NO',
      h.createdAt ? new Date(h.createdAt).toLocaleString('es-CL') : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hallazgos_fiscalizacion_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Banner Principal */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 4,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', display: 'flex' }}>
                  <GavelIcon fontSize="medium" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                  Consola de Hallazgos de Fiscalización (RX.1)
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.75)', maxWidth: 850 }}>
                Auditoría permanente de marcas operativas de terreno bajo el protocolo refinado Sernapesca del 11 de septiembre.
                Reúne infracciones de Veda, Excesos de Límite Diario (LED), Desembarques Atípicos y Controles de Cuota.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={cargarDatos}
                disabled={loading}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.08)' },
                }}
              >
                Actualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<FileDownloadIcon />}
                onClick={exportarCSV}
                disabled={!hallazgosFiltrados.length}
                sx={{
                  bgcolor: '#3b82f6',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#2563eb' },
                }}
              >
                Exportar CSV
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Alertas informativas */}
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 3 }}>
          {actionSuccess}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* 5 Tarjetas KPI por Marca (Filtro Rápido) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(MARCA_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const count = resumen?.porMarca?.[key] ?? 0;
          const isSelected = filtroMarca === key;

          return (
            <Grid item xs={12} sm={6} md={2.4} key={key}>
              <Card
                elevation={0}
                onClick={() => setFiltroMarca(isSelected ? '' : key)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3.5,
                  p: 2,
                  border: 1.5,
                  borderColor: isSelected ? cfg.color : 'divider',
                  bgcolor: isSelected ? cfg.bg : 'background.paper',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? `0 8px 20px -4px ${cfg.color}33` : '0 2px 4px rgba(0,0,0,0.02)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: cfg.color,
                    boxShadow: `0 8px 16px -4px ${cfg.color}22`,
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      p: 0.8,
                      borderRadius: 2,
                      bgcolor: cfg.bg,
                      color: cfg.color,
                      display: 'flex',
                    }}
                  >
                    <Icon sx={{ fontSize: 22 }} />
                  </Box>
                  <Chip
                    label={cfg.indicador}
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: 'background.default',
                      color: 'text.secondary',
                    }}
                  />
                </Stack>

                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  {cfg.label}
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: cfg.color }}>
                  {count}
                </Typography>

                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block', mt: 0.5, lineHeight: 1.2 }}>
                  {cfg.descripcion}
                </Typography>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Barra de Filtros */}
      <Card elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Tipo de Marca"
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
            >
              <MenuItem value="">Todas las marcas</MenuItem>
              {Object.entries(MARCA_CONFIG).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v.label} ({k})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <MenuItem value="pendientes">Solo Pendientes</MenuItem>
              <MenuItem value="resueltas">Solo Resueltas</MenuItem>
              <MenuItem value="todas">Todas</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Faena / Declaración"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <MenuItem value="">Todos los tipos</MenuItem>
              <MenuItem value="RECOLECTOR">Recolector</MenuItem>
              <MenuItem value="ARMADOR">Armador</MenuItem>
              <MenuItem value="AREA">Área (AMERB)</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              type="date"
              fullWidth
              size="small"
              label="Fecha Desde"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              type="date"
              fullWidth
              size="small"
              label="Fecha Hasta"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={1.5}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => {
                setFiltroMarca('');
                setFiltroEstado('pendientes');
                setFiltroTipo('');
                setFiltroTexto('');
                setStartDate('');
                setEndDate('');
              }}
              sx={{ textTransform: 'none', height: 40 }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>

        {/* Buscador de texto libre */}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por matrícula, RUT armador, resolución, texto de infracción..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Card>

      {/* Tabla de Hallazgos */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)') }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Marca Formal</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Origen / Faena</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Detalle Nominal del Hallazgo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Regla / Ref.</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Detección</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} color="secondary" />
                    <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                      Cargando marcas de fiscalización...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : hallazgosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <DoneAllIcon sx={{ fontSize: 44, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                      Sin Hallazgos Pendientes
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 450, mx: 'auto' }}>
                      No se encontraron marcas de fiscalización activas con los filtros actuales. Todas las declaraciones cumplen con la normativa.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                hallazgosFiltrados
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((h) => {
                    const cfg = MARCA_CONFIG[h.marca] || {
                      label: h.marca,
                      color: '#64748b',
                      bg: 'rgba(100, 116, 139, 0.1)',
                      icon: WarningIcon,
                    };
                    const Icon = cfg.icon;
                    const esBloqueado = h.declaracionId === null;

                    return (
                      <TableRow key={h.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        {/* Estado */}
                        <TableCell>
                          <Chip
                            label={h.resuelta ? 'RESUELTO' : 'PENDIENTE'}
                            size="small"
                            color={h.resuelta ? 'success' : 'warning'}
                            variant={h.resuelta ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                          />
                        </TableCell>

                        {/* Marca */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ color: cfg.color, display: 'flex' }}>
                              <Icon sx={{ fontSize: 18 }} />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: cfg.color }}>
                                {h.marca}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                                #{h.id}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Origen Faena */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {h.declaracionTipo}
                          </Typography>
                          {esBloqueado ? (
                            <Chip
                              icon={<BlockIcon sx={{ fontSize: 12 }} />}
                              label="Intento Bloqueado (422)"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20, mt: 0.3 }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Faena ID: #{h.declaracionId}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Detalle Nominal */}
                        <TableCell sx={{ maxWidth: 420 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.82rem',
                              lineHeight: 1.35,
                              color: h.resuelta ? 'text.secondary' : 'text.primary',
                              fontWeight: h.resuelta ? 400 : 500,
                            }}
                          >
                            {h.detalle}
                          </Typography>
                        </TableCell>

                        {/* Regla ID */}
                        <TableCell>
                          {h.reglaId ? (
                            <Chip
                              label={`Regla #${h.reglaId}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.68rem', height: 20 }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Fecha */}
                        <TableCell>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {h.createdAt ? new Date(h.createdAt).toLocaleDateString('es-CL') : '—'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                            {h.createdAt ? new Date(h.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </Typography>
                        </TableCell>

                        {/* Acción */}
                        <TableCell align="center">
                          {puedeResolver ? (
                            !h.resuelta ? (
                              <Tooltip title="Marcar como fiscalizado / resuelto">
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
                                  onClick={() => handleResolver(h.id)}
                                  sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.3, px: 1.2, borderRadius: 2 }}
                                >
                                  Resolver
                                </Button>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Reabrir hallazgo">
                                <IconButton size="small" color="default" onClick={() => handleReabrir(h.id)}>
                                  <HistoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.7rem' }}>
                              Sólo lectura
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={hallazgosFiltrados.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Card>
    </Box>
  );
}
