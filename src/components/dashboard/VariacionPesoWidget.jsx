import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Tab,
  IconButton,
  Alert,
  Paper,
  TablePagination
} from '@mui/material';
import {
  Scale as ScaleIcon,
  Warning as WarningIcon,
  CheckCircle as OkIcon,
  Error as ErrorIcon,
  ReceiptLong as VoucherIcon,
  Description as DocumentIcon,
  Biotech as BioIcon,
  AccountTree as ChainIcon,
  InfoOutlined as InfoIcon,
  Visibility as VisibilityIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  getVariacionPeso,
  getVariacionPesoDetalle,
  getVariacionPesoRecepciones,
  getOrigenesRecepcionPlanta,
  getTrazabilidadLote,
  getTrazabilidadLoteDetalle
} from '../../services/reportesService';
import TablaDetalleHallazgos from './comun/TablaDetalleHallazgos';
import { exportarCsv } from '../../utils/exportarCsv';

/**
 * TV.5 · VariacionPesoWidget: Indicador 6 (Variación de Peso Comercializador → Planta).
 * Consolida la única fórmula canónica vinculante acordada en la reunión del 9 de octubre.
 * No compara pesaje de planta contra orígenes biológicos (K5).
 */
export default function VariacionPesoWidget({ dateRange }) {
  const [metrics, setMetrics] = useState({
    umbralPct: 5.0,
    comercializadorPlanta: {
      totalRecepciones: 0,
      recepcionesVerde: 0,
      recepcionesAmarillo: 0,
      recepcionesRojo: 0,
      totalesPorSemaforo: { VERDE: 0, AMARILLO: 0, ROJO: 0 },
      promedioDeltaPct: null,
      sinHumedadVerificada: 0,
      topDesviaciones: []
    },
    pesaje: { total: 0, promedioVariacionPct: null, fueraUmbral: 0 },
    documental: { total: 0, promedioVariacionPct: null, fueraUmbral: 0 },
    consolidado: { totalConciliaciones: 0, promedioVariacionPct: null, fueraUmbral: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal Principal de Auditoría
  const [openModal, setOpenModal] = useState(false);
  const [tabModal, setTabModal] = useState(0); // 0: Comercializador->Planta, 1: Conciliación Acopio, 2: Lote y Merma

  // Pestaña 0: Comercializador -> Planta (Romana)
  const [recepcionesData, setRecepcionesData] = useState([]);
  const [recepcionesTotal, setRecepcionesTotal] = useState(0);
  const [recepcionesPage, setRecepcionesPage] = useState(0);
  const [recepcionesPageSize, setRecepcionesPageSize] = useState(20);
  const [loadingRecepciones, setLoadingRecepciones] = useState(false);
  const [filtroSemaforo, setFiltroSemaforo] = useState('TODOS');
  const [filtroTramo, setFiltroTramo] = useState('TODOS');

  // Modal secundario: Orígenes biológicos informativos
  const [origenesModalOpen, setOrigenesModalOpen] = useState(false);
  const [origenesData, setOrigenesData] = useState([]);
  const [origenesLoading, setOrigenesLoading] = useState(false);
  const [origenesPlantaInfo, setOrigenesPlantaInfo] = useState(null);

  // Pestaña 1: Conciliaciones de Acopio
  const [conciliacionesDetalle, setConciliacionesDetalle] = useState([]);
  const [filtroTipoConciliacion, setFiltroTipoConciliacion] = useState('TODOS');

  // Pestaña 2: Trazabilidad por Lote
  const [lotesDetalle, setLotesDetalle] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);

  const parseDates = useCallback(() => {
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
  }, [dateRange]);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const filters = parseDates();
      const pesoData = await getVariacionPeso(filters);

      const safePeso = pesoData || {};
      let safeComPlanta = null;
      if (safePeso.comercializadorPlanta && !safePeso.comercializadorPlanta.error && safePeso.comercializadorPlanta.disponible !== false) {
        safeComPlanta = safePeso.comercializadorPlanta;
      } else {
        safeComPlanta = {
          error: safePeso.comercializadorPlanta?.error || 'Indicador no disponible',
          disponible: false,
          totalRecepciones: null,
          promedioDeltaPct: null,
          totalesPorSemaforo: { VERDE: 0, AMARILLO: 0, ROJO: 0 }
        };
      }

      setMetrics({
        umbralPct: safePeso.umbralPct || 5.0,
        comercializadorPlanta: safeComPlanta,
        pesaje: safePeso.pesaje || { total: 0, promedioVariacionPct: null, fueraUmbral: 0 },
        documental: safePeso.documental || { total: 0, promedioVariacionPct: null, fueraUmbral: 0 },
        consolidado: safePeso.consolidado || { totalConciliaciones: 0, promedioVariacionPct: null, fueraUmbral: 0 }
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching métricas de variación de peso:', err);
      setError(err.message || 'Error al obtener métricas');
    } finally {
      setLoading(false);
    }
  }, [parseDates]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Carga paginada de recepciones comercializador -> planta (TV.3)
  const fetchRecepciones = useCallback(async (page = 0, size = 20) => {
    setLoadingRecepciones(true);
    try {
      const filters = parseDates();
      if (filtroSemaforo !== 'TODOS') filters.semaforo = filtroSemaforo;
      if (filtroTramo !== 'TODOS') filters.tramo = filtroTramo;
      filters.page = page;
      filters.size = size;

      const resp = await getVariacionPesoRecepciones(filters);
      if (resp && resp.content) {
        setRecepcionesData(resp.content);
        setRecepcionesTotal(resp.totalElements || 0);
      } else if (Array.isArray(resp)) {
        setRecepcionesData(resp);
        setRecepcionesTotal(resp.length);
      } else {
        setRecepcionesData([]);
        setRecepcionesTotal(0);
      }
    } catch (err) {
      console.error('Error fetching recepciones variacion peso:', err);
      setRecepcionesData([]);
      setRecepcionesTotal(0);
    } finally {
      setLoadingRecepciones(false);
    }
  }, [parseDates, filtroSemaforo, filtroTramo]);

  // Al abrir el modal o cambiar de pestaña
  const handleOpenDetalle = async () => {
    setOpenModal(true);
    setRecepcionesPage(0);
    fetchRecepciones(0, recepcionesPageSize);
    // Carga de conciliaciones de acopio y lotes en background
    try {
      const filters = parseDates();
      const [detallesPeso, detallesLotes] = await Promise.all([
        getVariacionPesoDetalle(filters),
        getTrazabilidadLoteDetalle(filters)
      ]);
      setConciliacionesDetalle(detallesPeso || []);
      setLotesDetalle(detallesLotes || []);
    } catch (err) {
      console.error('Error pre-fetching datos complementarios:', err);
    }
  };

  useEffect(() => {
    if (openModal && tabModal === 0) {
      fetchRecepciones(recepcionesPage, recepcionesPageSize);
    }
  }, [openModal, tabModal, recepcionesPage, recepcionesPageSize, filtroSemaforo, filtroTramo, fetchRecepciones]);

  // Lazy loading de orígenes biológicos informativos (TV.3)
  const handleVerOrigenes = async (recepcion) => {
    setOrigenesPlantaInfo(recepcion);
    setOrigenesModalOpen(true);
    setOrigenesLoading(true);
    try {
      const data = await getOrigenesRecepcionPlanta(recepcion.plantaId);
      setOrigenesData(data || []);
    } catch (err) {
      console.error('Error fetching orígenes de recepción:', err);
      setOrigenesData([]);
    } finally {
      setOrigenesLoading(false);
    }
  };

  // Alertas generales
  const comPlanta = metrics.comercializadorPlanta;
  const rojoCount = comPlanta?.totalesPorSemaforo?.ROJO ?? comPlanta?.recepcionesRojo ?? 0;
  const amarilloCount = comPlanta?.totalesPorSemaforo?.AMARILLO ?? comPlanta?.recepcionesAmarillo ?? 0;
  const verdeCount = comPlanta?.totalesPorSemaforo?.VERDE ?? comPlanta?.recepcionesVerde ?? 0;
  const hasAlertas = rojoCount > 0;

  // Exportar recepciones a CSV
  const handleExportarRecepciones = () => {
    if (!recepcionesData || recepcionesData.length === 0) return;
    const headers = [
      'Folio Planta', 'N° Voucher', 'Fecha Pesaje', 'Planta Titular', 'Comercializador',
      'Kg Despacho', 'Kg Romana', 'Delta Kg', 'Delta %', 'Delta Eq %',
      'Días Tránsito', 'Humedad Despacho', 'Humedad Recepción', 'Semáforo', 'Criterio Biológico'
    ];
    const rows = recepcionesData.map(r => [
      r.folioPlanta || '',
      r.voucherRomanaNumero || '',
      r.fechaPesaje ? new Date(r.fechaPesaje).toLocaleDateString('es-CL') : '',
      r.plantaNombre || '',
      r.comercializadorNombre || r.despachos?.[0]?.declaradorNombre || '',
      r.kgDespacho ?? '',
      r.kgRomana ?? '',
      r.deltaKg ?? '',
      r.deltaPct != null ? `${r.deltaPct}%` : '',
      r.deltaEquivalentePct != null ? `${r.deltaEquivalentePct}%` : '',
      r.diasTransito ?? '',
      r.humedadDespacho || '',
      r.humedadRecepcion || '',
      r.semaforo || '',
      r.inconsistenciaBiologica || r.motivoBiologico || ''
    ]);
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    exportarCsv({
      filename: `recepciones_comercializador_planta_${timestamp}.csv`,
      headers,
      rows
    });
  };

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
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        border: '1px solid',
        borderColor: hasAlertas ? 'error.light' : 'divider',
        bgcolor: 'background.paper',
        boxShadow: hasAlertas
          ? '0 10px 15px -3px rgba(239, 68, 68, 0.05)'
          : '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: hasAlertas
            ? '0 12px 25px -3px rgba(239, 68, 68, 0.09)'
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
            <ScaleIcon sx={{ color: hasAlertas ? 'error.main' : '#6366f1' }} />
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
          Contraste físico y control biológico de mermas. Métrica centralizada vinculante con pesaje en romana.
        </Typography>

        <Divider sx={{ mb: 2.5, borderColor: hasAlertas ? 'error.light' : 'divider' }} />

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
            {/* KPI Canónico Vinculante: Comercializador -> Planta (Romana) */}
            <Box
              sx={{
                mb: 2.5,
                p: 2.2,
                borderRadius: 3,
                border: '2px solid',
                borderColor: hasAlertas ? 'error.light' : '#6366f1',
                bgcolor: hasAlertas ? 'rgba(239, 68, 68, 0.03)' : 'rgba(99, 102, 241, 0.04)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.08)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <ChainIcon sx={{ color: hasAlertas ? 'error.main' : '#4f46e5', fontSize: 24 }} />
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary', lineHeight: 1.2 }}>
                        Comercializador → Planta (Romana)
                      </Typography>
                      <Tooltip
                        title="Compara la suma de despachos consumidos por la planta contra el pesaje neto registrado en romana. Única métrica vinculante con consecuencias sancionatorias."
                        arrow
                      >
                        <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'pointer' }} />
                      </Tooltip>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                      Suma Despachos Consumidos vs Báscula / Romana Certificada (Dictamen 2026)
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="VINCULANTE PRINCIPAL"
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22, bgcolor: '#4f46e5' }}
                />
              </Box>

              {comPlanta?.disponible === false || comPlanta?.error ? (
                <Box sx={{ p: 2.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'warning.main', textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.dark', fontFamily: 'Outfit' }}>
                    Indicador no disponible
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', mt: 0.5, display: 'block' }}>
                    {comPlanta?.error || 'El cálculo centralizado de variación de peso no está disponible en este momento.'}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                      Recepciones en Romana
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary', mt: 0.5 }}>
                      {(comPlanta?.totalRecepciones || 0).toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                      Promedio Variación (Δ%)
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        fontFamily: 'Outfit',
                        mt: 0.5,
                        color: comPlanta?.promedioDeltaPct != null && Math.abs(comPlanta.promedioDeltaPct) > (metrics.umbralPct || 5.0)
                          ? 'error.main'
                          : 'text.primary'
                      }}
                    >
                      {comPlanta?.promedioDeltaPct !== null && comPlanta?.promedioDeltaPct !== undefined
                        ? `${comPlanta.promedioDeltaPct > 0 ? '+' : ''}${comPlanta.promedioDeltaPct}%`
                        : '—'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                      Semáforo de Riesgo
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.8, mt: 0.6 }}>
                      <Tooltip title={`${verdeCount} recepciones conformes (Verde)`}>
                        <Chip
                          icon={<OkIcon sx={{ fontSize: '13px !important' }} />}
                          label={verdeCount}
                          size="small"
                          color="success"
                          sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22 }}
                        />
                      </Tooltip>
                      <Tooltip title={`${amarilloCount} recepciones con merma/atención (Amarillo)`}>
                        <Chip
                          icon={<WarningIcon sx={{ fontSize: '13px !important' }} />}
                          label={amarilloCount}
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22 }}
                        />
                      </Tooltip>
                      <Tooltip title={`${rojoCount} recepciones con discrepancia crítica (Rojo)`}>
                        <Chip
                          icon={<ErrorIcon sx={{ fontSize: '13px !important' }} />}
                          label={rojoCount}
                          size="small"
                          color="error"
                          sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22 }}
                        />
                      </Tooltip>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                      Sin Humedad Verificada
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        fontFamily: 'Outfit',
                        mt: 0.5,
                        color: (comPlanta?.sinHumedadVerificada || 0) > 0 ? 'warning.main' : 'text.primary'
                      }}
                    >
                      {comPlanta?.sinHumedadVerificada || 0}
                      <Typography component="span" variant="caption" sx={{ ml: 0.8, color: 'text.secondary', fontWeight: 600 }}>
                        recepciones
                      </Typography>
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
            </Box>

            {/* Dos Poblaciones de Control Secundarias / Informativas */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                        Conciliación de Acopio (Comercializador)
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                        Balance contable compras vs ventas del acopiador
                      </Typography>
                    </Box>
                    <Chip
                      label="INFORMATIVO"
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, color: 'text.secondary' }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                        {metrics.consolidado?.totalConciliaciones || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                        Conciliaciones
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          fontFamily: 'Outfit',
                          color: metrics.consolidado?.promedioVariacionPct != null && Math.abs(metrics.consolidado.promedioVariacionPct) > (metrics.umbralPct || 5.0) ? 'warning.main' : 'text.primary'
                        }}
                      >
                        {metrics.consolidado?.promedioVariacionPct !== null && metrics.consolidado?.promedioVariacionPct !== undefined
                          ? `${metrics.consolidado.promedioVariacionPct > 0 ? '+' : ''}${metrics.consolidado.promedioVariacionPct}%`
                          : '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                        Promedio Variación
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
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
                        Cruce Documental de Guías
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                        Consistencia de guías tributarias y despacho
                      </Typography>
                    </Box>
                    <Chip
                      label="DOCUMENTAL"
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, color: 'text.secondary' }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                        {metrics.documental?.total || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                        Documentos
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          fontFamily: 'Outfit',
                          color: (metrics.documental?.fueraUmbral || 0) > 0 ? 'warning.main' : 'text.primary'
                        }}
                      >
                        {metrics.documental?.fueraUmbral || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                        Fuera de Umbral
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Total Consolidado y Botón de Detalle */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: 1, borderColor: 'divider', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 600 }}>
                Total Recepciones Auditadas: <strong>{(comPlanta?.totalRecepciones || 0).toLocaleString('es-CL')}</strong> con romana
                {' '}({rojoCount} alertas críticas)
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

        {/* Modal de Detalle con 3 Pestañas (TV.5) */}
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="xl"
          fullWidth
          slotProps={{
            paper: {
              sx: { borderRadius: 4, overflow: 'hidden', minHeight: '80vh' }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
                  Auditoría de Variación de Peso y Consistencia Biológica (Indicador 6)
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                  Métrica vinculante canónica: Recepción en Planta con Romana vs Despachos. Orígenes biológicos informativos (K5).
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportarRecepciones}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Exportar CSV
              </Button>
            </Box>
          </DialogTitle>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 3 }}>
            <Tabs
              value={tabModal}
              onChange={(_, val) => setTabModal(val)}
              sx={{ '& .MuiTab-root': { fontFamily: 'Outfit', fontWeight: 700, textTransform: 'none' } }}
            >
              <Tab icon={<ChainIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Comercializador → Planta Romana (${recepcionesTotal}) [VINCULANTE]`} />
              <Tab icon={<ScaleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Conciliación de Acopio (${conciliacionesDetalle.length}) [INFORMATIVO]`} />
              <Tab icon={<BioIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Trazabilidad por Lote y Merma (${lotesDetalle.length}) [AUDITORÍA LOTE]`} />
            </Tabs>
          </Box>

          <DialogContent dividers sx={{ p: 0, borderColor: 'divider' }}>
            {/* PESTAÑA 0 · Comercializador -> Planta (Romana) [VINCULANTE PRINCIPAL] */}
            {tabModal === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Barra de Filtros Rápidos */}
                <Box sx={{ p: 1.5, px: 3, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 700 }}>
                      Semáforo:
                    </Typography>
                    {['TODOS', 'ROJO', 'AMARILLO', 'VERDE'].map(s => (
                      <Chip
                        key={s}
                        label={s}
                        size="small"
                        clickable
                        color={filtroSemaforo === s ? (s === 'ROJO' ? 'error' : s === 'AMARILLO' ? 'warning' : s === 'VERDE' ? 'success' : 'primary') : 'default'}
                        variant={filtroSemaforo === s ? 'filled' : 'outlined'}
                        onClick={() => {
                          setFiltroSemaforo(s);
                          setRecepcionesPage(0);
                        }}
                        sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                      />
                    ))}

                    <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 20 }} />

                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontWeight: 700 }}>
                      Tramo Humedad:
                    </Typography>
                    {['TODOS', 'SECO', 'HUMEDO', 'EQUIVALENTE'].map(t => (
                      <Chip
                        key={t}
                        label={t}
                        size="small"
                        clickable
                        color={filtroTramo === t ? 'primary' : 'default'}
                        variant={filtroTramo === t ? 'filled' : 'outlined'}
                        onClick={() => {
                          setFiltroTramo(t);
                          setRecepcionesPage(0);
                        }}
                        sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`Total: ${recepcionesTotal}`}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                    <IconButton size="small" onClick={() => fetchRecepciones(recepcionesPage, recepcionesPageSize)}>
                      <RefreshIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Tabla Canónica de Recepciones */}
                {loadingRecepciones ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : recepcionesData.length === 0 ? (
                  <Typography sx={{ p: 4, color: 'text.secondary', fontFamily: 'Inter', textAlign: 'center' }}>
                    No se encontraron recepciones en planta que coincidan con los filtros seleccionados.
                  </Typography>
                ) : (
                  <TableContainer sx={{ maxHeight: 'calc(75vh - 200px)' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Folio Recepción</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Voucher Romana</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Fecha Ingreso</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Planta Titular</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Despachos / Comercializador</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Kg Despacho</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Kg Romana</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Δkg</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Δ%</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Δeq%</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Tránsito</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Humedad</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Evaluación Biológica</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Orígenes (K5)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recepcionesData.map((row, idx) => {
                          const isRojo = row.semaforo === 'ROJO';
                          const isAmarillo = row.semaforo === 'AMARILLO';
                          return (
                            <TableRow key={idx} hover sx={{ bgcolor: isRojo ? 'rgba(239, 68, 68, 0.02)' : 'inherit' }}>
                              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>
                                {row.folioPlanta || `#${row.plantaId}`}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                {row.voucherRomanaNumero ? (
                                  <Chip
                                    icon={<VoucherIcon sx={{ fontSize: 13 }} />}
                                    label={row.voucherRomanaNumero}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                                  />
                                ) : (
                                  <Chip label="S/Voucher" size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                                )}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                {row.fechaPesaje ? new Date(row.fechaPesaje).toLocaleDateString('es-CL') : (row.fechaIngresoPlanta ? new Date(row.fechaIngresoPlanta).toLocaleDateString('es-CL') : '—')}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                {row.plantaNombre || '—'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                {row.despachos && row.despachos.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                    {row.despachos.map((d, dIdx) => (
                                      <Chip
                                        key={dIdx}
                                        label={`${d.tipoDeclaracion}: ${d.folio || ('#' + d.declaracionId)} (${d.kg?.toLocaleString('es-CL')} kg)`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.68rem', height: 20 }}
                                      />
                                    ))}
                                  </Box>
                                ) : (
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {row.comercializadorNombre || 'Despacho directo'}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }} align="right">
                                {row.kgDespacho != null ? row.kgDespacho.toLocaleString('es-CL') : '0'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem', fontWeight: 800, color: 'primary.main' }} align="right">
                                {row.kgRomana != null ? row.kgRomana.toLocaleString('es-CL') : '0'}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: row.deltaKg < 0 ? 'error.main' : 'text.primary'
                                }}
                                align="right"
                              >
                                {row.deltaKg != null ? `${row.deltaKg > 0 ? '+' : ''}${row.deltaKg.toLocaleString('es-CL')}` : '0'}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: '0.85rem',
                                  fontWeight: 800,
                                  color: isRojo ? 'error.main' : isAmarillo ? 'warning.main' : 'success.main'
                                }}
                                align="right"
                              >
                                {row.deltaPct != null ? `${row.deltaPct > 0 ? '+' : ''}${row.deltaPct}%` : '0.0%'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }} align="right">
                                {row.deltaEquivalentePct != null ? `${row.deltaEquivalentePct > 0 ? '+' : ''}${row.deltaEquivalentePct}%` : '—'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.78rem' }} align="center">
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {row.diasTransito != null ? `${row.diasTransito} d` : `${Math.round(row.horasTransitoPromedio || 0)} h`}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                {row.humedadDespacho !== row.humedadRecepcion ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Chip label={row.humedadDespacho || 'S/D'} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>→</Typography>
                                    <Chip label={row.humedadRecepcion || 'S/D'} size="small" color="warning" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />
                                  </Box>
                                ) : (
                                  <Chip label={row.humedadRecepcion || row.humedadDespacho || '—'} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                  <Chip
                                    label={row.semaforo || 'VERDE'}
                                    size="small"
                                    color={isRojo ? 'error' : isAmarillo ? 'warning' : 'success'}
                                    sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                                  />
                                  {row.inconsistenciaBiologica && row.inconsistenciaBiologica !== 'NORMAL' && (
                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: isRojo ? 'error.dark' : 'warning.dark' }}>
                                      {row.inconsistenciaBiologica}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                                  onClick={() => handleVerOrigenes(row)}
                                  sx={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    py: 0.2,
                                    px: 1,
                                    borderRadius: 1.5
                                  }}
                                >
                                  Orígenes
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Paginación */}
                <TablePagination
                  component="div"
                  count={recepcionesTotal}
                  page={recepcionesPage}
                  onPageChange={(_, newPage) => setRecepcionesPage(newPage)}
                  rowsPerPage={recepcionesPageSize}
                  onRowsPerPageChange={(e) => {
                    setRecepcionesPageSize(parseInt(e.target.value, 10));
                    setRecepcionesPage(0);
                  }}
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  labelRowsPerPage="Filas por página:"
                  sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
                />
              </Box>
            )}

            {/* PESTAÑA 1 · Conciliación de Acopio (Comercializador) [INFORMATIVO] */}
            {tabModal === 1 && (
              <Box sx={{ p: 2 }}>
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.82rem' } }}>
                  <strong>Informativo:</strong> Balance contable interno de compras vs ventas del comercializador intermedio. No representa el tramo físico de recepción en planta ni tiene valor probatorio de merma.
                </Alert>

                <Box sx={{ mb: 1.5, display: 'flex', gap: 1 }}>
                  {['TODOS', 'PESAJE', 'DOCUMENTO'].map(tipo => (
                    <Chip
                      key={tipo}
                      label={tipo}
                      size="small"
                      clickable
                      color={filtroTipoConciliacion === tipo ? 'primary' : 'default'}
                      variant={filtroTipoConciliacion === tipo ? 'filled' : 'outlined'}
                      onClick={() => setFiltroTipoConciliacion(tipo)}
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  ))}
                </Box>

                <TableContainer sx={{ maxHeight: 460 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Eslabón</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Fecha</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Actor / Titular</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Kg Origen</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Kg Destino / Romana</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Variación (%)</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Voucher</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {conciliacionesDetalle
                        .filter(c => filtroTipoConciliacion === 'TODOS' || (c.tipoRegistro || '').toUpperCase() === filtroTipoConciliacion)
                        .map((row, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontSize: '0.8rem' }}>
                              <Chip label={row.tipoRegistro} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
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
                            <TableCell sx={{ fontSize: '0.82rem', fontWeight: 700 }} align="right">
                              {row.kgDestino ? row.kgDestino.toLocaleString('es-CL') : '—'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.85rem', fontWeight: 800 }} align="right">
                              {row.variacionPct != null ? `${row.variacionPct > 0 ? '+' : ''}${row.variacionPct}%` : '0.0%'}
                            </TableCell>
                            <TableCell align="center">
                              {row.voucherRomanaNumero ? (
                                <Chip label={row.voucherRomanaNumero} size="small" color="success" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                              ) : (
                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* PESTAÑA 2 · Trazabilidad por Lote y Merma Biológica [AUDITORÍA LOTE] */}
            {tabModal === 2 && (
              <Box sx={{ p: 2 }}>
                <TableContainer sx={{ maxHeight: 460 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Folio Origen</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Actor Origen</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie / Humedad</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Kg Origen</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Kg Planta</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Tramo Cerrado</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Δ% Peso</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Tránsito</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Severidad Biológica (R8.1)</TableCell>
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
                          <TableCell align="center">
                            <Chip
                              label={row.tramoCerrado || 'COMERCIALIZADOR_PLANTA'}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              color: row.alertaVariacion ? 'error.main' : 'text.primary'
                            }}
                            align="right"
                          >
                            {row.deltaPct != null ? `${row.deltaPct > 0 ? '+' : ''}${row.deltaPct}%` : '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem' }} align="center">
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {row.diasTranscurridos} d viaje
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {row.severidadBiologica === 'CRITICA' ? (
                              <Chip label="CRÍTICA" size="small" sx={{ fontSize: '0.68rem', height: 22, fontWeight: 900, bgcolor: '#b91c1c', color: '#fff' }} />
                            ) : row.severidadBiologica === 'ATENCION' ? (
                              <Chip label="ATENCIÓN" size="small" sx={{ fontSize: '0.68rem', height: 22, fontWeight: 800, bgcolor: '#f59e0b', color: '#fff' }} />
                            ) : (
                              <Chip label="NEUTRA" size="small" color="success" variant="outlined" sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700 }} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', pl: 1 }}>
              {tabModal === 0
                ? `Mostrando ${recepcionesData.length} de ${recepcionesTotal} recepciones en planta contrastadas con despachos en romana.`
                : tabModal === 1
                ? `Mostrando ${conciliacionesDetalle.length} conciliaciones internas de comercializador.`
                : `Mostrando ${lotesDetalle.length} lotes con trazabilidad biológica de custodia.`}
            </Typography>
            <Button onClick={() => setOpenModal(false)} sx={{ fontFamily: 'Inter', fontWeight: 600 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal Secundario: Orígenes Biológicos Informativos (Lazy Loading TV.3 / K5) */}
        <Dialog
          open={origenesModalOpen}
          onClose={() => setOrigenesModalOpen(false)}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: { sx: { borderRadius: 3 } }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
            Orígenes Biológicos de la Recepción: {origenesPlantaInfo?.folioPlanta || `#${origenesPlantaInfo?.plantaId}`}
          </DialogTitle>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Informativo: No se compara contra la romana
              </Typography>
              <Typography variant="caption">
                Conforme a la doctrina de trazabilidad 2026, una recepción en planta se contrasta únicamente contra los despachos consumidos. Los orígenes biológicos se despliegan para auditoría de custodia sin deducir mermas contra la báscula de destino.
              </Typography>
            </Alert>

            {origenesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : origenesData.length === 0 ? (
              <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
                No se registran declaraciones de origen asociadas a este despacho.
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo Declaración</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Folio Origen</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Titular / Pescador</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>RUT</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Kg Declarados</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {origenesData.map((orig, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Chip
                            label={orig.tipoDeclaracion}
                            size="small"
                            color={orig.tipoDeclaracion === 'ARMADOR' ? 'info' : orig.tipoDeclaracion === 'RECOLECTOR' ? 'success' : 'secondary'}
                            sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {orig.folio || `#${orig.origenId}`}
                        </TableCell>
                        <TableCell>{orig.declaradorNombre || '—'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{orig.declaradorRut || '—'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {orig.kg != null ? orig.kg.toLocaleString('es-CL') : '0'} kg
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOrigenesModalOpen(false)}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
