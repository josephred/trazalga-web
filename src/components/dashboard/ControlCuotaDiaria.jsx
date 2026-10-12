import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  LinearProgress, 
  CircularProgress, 
  Divider, 
  FormControl, 
  Select, 
  MenuItem,
  Tabs,
  Tab,
  Chip,
  Button,
  Tooltip,
  Collapse,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Grid
} from '@mui/material';
import {
  KeyboardArrowDown as DownIcon,
  KeyboardArrowUp as UpIcon,
  WarningAmber as WarningIcon,
  Person as PersonIcon,
  CheckCircleOutline as CheckIcon,
  Autorenew as AutorenewIcon
} from '@mui/icons-material';
import api from '../../api/axiosConfig';
import { getCuotasSobrepasos, getCuotaPersonas } from '../../services/reportesService';
import TablaDetalleHallazgos from './comun/TablaDetalleHallazgos';
import { getPerfil } from '../../auth/sesion';
import { puedeHacer } from '../../auth/perfiles';
import { cuotaService } from '../../services/cuotaService';

export default function ControlCuotaDiaria({ dateRange }) {
  const navigate = useNavigate();
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comunaId, setComunaId] = useState('');
  const [extraccionTipoId, setExtraccionTipoId] = useState('');
  const [comunas, setComunas] = useState([]);
  const [extraccionTipos, setExtraccionTipos] = useState([]);

  // Cuota seleccionada por clic en tarjeta (TQ.2)
  const [cuotaSeleccionadaId, setCuotaSeleccionadaId] = useState(null);

  // Desplegable de auditoría y sobrepasos (TQ.2)
  const [showSobrepasos, setShowSobrepasos] = useState(false);
  const [tabIndex, setTabIndex] = useState(0); // 0: Declaraciones sobre límite, 1: Personas sobre tope
  const [filtroMarca, setFiltroMarca] = useState('TODAS'); // TODAS | CUOTA_EXCEDIDA | POSTERIOR_CIERRE | DECLARACION_EXTEMPORANEA

  // Tab 2: Personas por cuota individual (TM.2 / TQ.1 / TQ.2)
  const [soloSobreLimite, setSoloSobreLimite] = useState(true);
  const [cuotaPersonasId, setCuotaPersonasId] = useState('');
  const [personasData, setPersonasData] = useState([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [errorPersonas, setErrorPersonas] = useState(null);

  // TC.8: Parámetro de imputación territorial de armadores
  const [imputacionArmador, setImputacionArmador] = useState('INSCRIPCION');

  // Control de permisos y estado de recálculo (TC.10 / TQ.3)
  const perfil = getPerfil();
  const puedeRecalcular = puedeHacer(perfil, 'EJECUTAR_RECALCULO');
  const [recalculoModalOpen, setRecalculoModalOpen] = useState(false);
  const [cuotaPorRecalcular, setCuotaPorRecalcular] = useState(null);
  const [recalculando, setRecalculando] = useState(false);
  const [resultadoRecalculo, setResultadoRecalculo] = useState(null);
  const [recalculoError, setRecalculoError] = useState(null);

  // Cargar configuración general para nota territorial (TC.8)
  useEffect(() => {
    api.get('/api/configuracion-general')
      .then((res) => {
        if (Array.isArray(res.data)) {
          const param = res.data.find((c) => c.clave === 'cuota_imputacion_armador');
          if (param && param.valor) {
            setImputacionArmador(param.valor.trim().toUpperCase());
          }
        }
      })
      .catch(() => {});
  }, []);

  // Cargar maestros de comunas y métodos de extracción para los filtros
  useEffect(() => {
    const fetchMaestros = async () => {
      try {
        const res = await api.get('/cuotas/maestros');
        if (res.data) {
          if (res.data.comunas) {
            const sortedComunas = [...res.data.comunas].sort((a, b) => 
              (a.nombre || '').localeCompare(b.nombre || '')
            );
            setComunas(sortedComunas);
          }
          if (res.data.extraccionTipos) {
            setExtraccionTipos(res.data.extraccionTipos);
          }
        }
      } catch (err) {
        console.error('Error fetching maestros para cuotas:', err);
      }
    };
    fetchMaestros();
  }, []);

  // Cargar cuotas de áreas libres según filtros
  const fetchCuotas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      if (comunaId) {
        params.append('comunaId', comunaId);
      }
      if (extraccionTipoId) {
        params.append('extraccionTipoId', extraccionTipoId);
      }
      
      const response = await api.get(`/cuotas/dashboard-diario?${params.toString()}`);
      setCuotas(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching cuotas:', err);
      setError(err.message || 'Error desconocido al cargar cuotas');
    } finally {
      setLoading(false);
    }
  }, [dateRange, comunaId, extraccionTipoId]);

  useEffect(() => {
    fetchCuotas();
  }, [fetchCuotas]);

  const handleAbrirRecalculo = (cuota) => {
    setCuotaPorRecalcular(cuota);
    setResultadoRecalculo(null);
    setRecalculoError(null);
    setRecalculoModalOpen(true);
  };

  const handleCerrarRecalculo = () => {
    if (recalculando) return;
    setRecalculoModalOpen(false);
    setCuotaPorRecalcular(null);
    setResultadoRecalculo(null);
    setRecalculoError(null);
  };

  const handleEjecutarRecalculo = async () => {
    if (!cuotaPorRecalcular) return;
    setRecalculando(true);
    setRecalculoError(null);
    try {
      const res = await cuotaService.recalcularHallazgos(cuotaPorRecalcular.cuotaId);
      setResultadoRecalculo(res);
      fetchCuotas();
    } catch (err) {
      console.error('Error al recalcular hallazgos de cuota:', err);
      setRecalculoError(err.response?.data?.message || err.message || 'Error al ejecutar el recálculo.');
    } finally {
      setRecalculando(false);
    }
  };

  // Sincronizar cuotaPersonasId con selección o primera cuota disponible
  useEffect(() => {
    if (cuotaSeleccionadaId) {
      setCuotaPersonasId(cuotaSeleccionadaId);
    } else if (!cuotaPersonasId && cuotas.length > 0) {
      const candidata = cuotas.find((c) => c.esPlantilla || c.ambito === 'INDIVIDUAL') || cuotas[0];
      if (candidata) setCuotaPersonasId(candidata.cuotaId);
    }
  }, [cuotaSeleccionadaId, cuotas, cuotaPersonasId]);

  // Cargar desglose de personas para Tab 2 cuando está visible
  useEffect(() => {
    if (!showSobrepasos || tabIndex !== 1 || !cuotaPersonasId) return;

    let isMounted = true;
    setLoadingPersonas(true);
    setErrorPersonas(null);

    getCuotaPersonas(cuotaPersonasId, soloSobreLimite)
      .then((data) => {
        if (isMounted) {
          setPersonasData(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error cargando personas de cuota:', err);
          setErrorPersonas(err.message || 'Error al cargar el desglose por personas');
          setPersonasData([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingPersonas(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showSobrepasos, tabIndex, cuotaPersonasId, soloSobreLimite]);

  // Colores y fondos para las barras de progreso
  const getProgressColors = (porcentaje) => {
    if (porcentaje >= 100) return { bar: 'error.main', bg: '#fef2f2', label: '#b91c1c' }; // Rojo
    if (porcentaje >= 80) return { bar: 'warning.main', bg: '#fffbeb', label: '#b45309' }; // Naranja/Amber
    return { bar: 'success.main', bg: '#f0fdf4', label: '#047857' }; // Verde
  };

  // Manejador de clic en tarjeta de cuota (TQ.2)
  const handleToggleCardSelection = (id) => {
    if (cuotaSeleccionadaId === id) {
      setCuotaSeleccionadaId(null);
    } else {
      setCuotaSeleccionadaId(id);
      setShowSobrepasos(true);
    }
  };

  // Fetcher para Tab 1: Declaraciones sobre el límite (TQ.1)
  const fetcherSobrepasos = useCallback(
    async (params) => {
      const query = {
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
        comunaId: comunaId || undefined,
        extraccionTipoId: extraccionTipoId || undefined,
        cuotaId: cuotaSeleccionadaId || undefined,
        marcas: filtroMarca === 'TODAS' ? undefined : filtroMarca,
        ...params
      };
      return await getCuotasSobrepasos(query);
    },
    [dateRange, comunaId, extraccionTipoId, cuotaSeleccionadaId, filtroMarca]
  );

  // Columnas para Tab 1: Declaraciones sobre el límite (TQ.2)
  const columnasSobrepasos = useMemo(() => [
    {
      id: 'folio',
      label: 'Folio',
      mono: true,
      render: (r) => r.folio || (r.declaracionId ? `ID-${r.declaracionId}` : '—')
    },
    {
      id: 'actor',
      label: 'Agente / Perfil',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
            {r.actorNombre || '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {r.actorRut || ''}
            {r.actorPerfil && (
              <Chip label={r.actorPerfil} size="small" sx={{ fontSize: '0.62rem', height: 16 }} />
            )}
          </Typography>
        </Box>
      )
    },
    {
      id: 'embarcacion',
      label: 'Embarcación',
      render: (r) => (
        <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>
          {r.embarcacionNombre ? `${r.embarcacionNombre}${r.embarcacionCodigo ? ` (${r.embarcacionCodigo})` : ''}` : '—'}
        </Typography>
      )
    },
    {
      id: 'cuota',
      label: 'Cuota',
      render: (r) => (
        <Tooltip title={`${r.cuotaAlcance || ''} · ${r.cuotaEspecie || ''} · ${r.cuotaMetodo || ''} · ${r.cuotaVigencia || ''}`}>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
              {r.cuotaAlcance || `Cuota #${r.cuotaId}`}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {r.cuotaEspecie || ''} {r.cuotaMetodo ? `· ${r.cuotaMetodo}` : ''}
            </Typography>
          </Box>
        </Tooltip>
      )
    },
    {
      id: 'fechaDeclaracion',
      label: 'Fecha',
      render: (r) => {
        const f = r.fechaDeclaracion || r.fechaExtraccion;
        return f ? new Date(f).toLocaleDateString('es-CL') : '—';
      }
    },
    {
      id: 'kilosCaptura',
      label: 'kg / Captura',
      align: 'right',
      render: (r) => (
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
            {Number(r.kilos || 0).toLocaleString('es-CL')} kg
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {Number(r.captura || 0).toLocaleString('es-CL')} cap
          </Typography>
        </Box>
      )
    },
    {
      id: 'porcentajeConsumo',
      label: 'Consumo s/Límite (%)',
      align: 'right',
      render: (r) => (
        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 800, color: 'error.main' }}>
          {r.porcentajeConsumo != null ? `${r.porcentajeConsumo.toFixed(1)}%` : '—'}
        </Typography>
      )
    },
    {
      id: 'excesoKg',
      label: 'Exceso',
      align: 'right',
      render: (r) => (
        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'error.dark' }}>
          {r.excesoKg != null && r.excesoKg > 0 ? `+${Number(r.excesoKg).toLocaleString('es-CL')} kg` : '—'}
        </Typography>
      )
    },
    {
      id: 'marca',
      label: 'Marca',
      align: 'center',
      render: (r) => {
        const color = r.marca === 'POSTERIOR_CIERRE' ? 'error' : (r.marca === 'CUOTA_EXCEDIDA' ? 'warning' : 'secondary');
        return (
          <Chip
            label={r.marca}
            size="small"
            color={color}
            sx={{ fontSize: '0.66rem', height: 20, fontWeight: 700 }}
          />
        );
      }
    },
    {
      id: 'estadoGestion',
      label: 'Estado',
      align: 'center',
      render: (r) => {
        const resuelta = r.resuelta || r.estadoGestion === 'RESUELTA';
        return (
          <Chip
            label={r.estadoGestion || (resuelta ? 'Resuelta' : 'Pendiente')}
            size="small"
            color={resuelta ? 'success' : 'default'}
            variant="outlined"
            sx={{ fontSize: '0.66rem', height: 20, fontWeight: 600 }}
          />
        );
      }
    }
  ], []);

  // Chips para filtros de marca en Tab 1
  const chipsFiltroMarca = useMemo(() => [
    { id: 'TODAS', label: 'Todas las marcas', activo: filtroMarca === 'TODAS', onClick: () => setFiltroMarca('TODAS') },
    { id: 'CUOTA_EXCEDIDA', label: 'Cuota Excedida', activo: filtroMarca === 'CUOTA_EXCEDIDA', onClick: () => setFiltroMarca('CUOTA_EXCEDIDA') },
    { id: 'POSTERIOR_CIERRE', label: 'Posterior Cierre', activo: filtroMarca === 'POSTERIOR_CIERRE', onClick: () => setFiltroMarca('POSTERIOR_CIERRE') },
    { id: 'DECLARACION_EXTEMPORANEA', label: 'Extemporánea', activo: filtroMarca === 'DECLARACION_EXTEMPORANEA', onClick: () => setFiltroMarca('DECLARACION_EXTEMPORANEA') },
  ], [filtroMarca]);

  // Columnas para Tab 2: Personas sobre su tope individual (TQ.2)
  const columnasPersonas = useMemo(() => [
    {
      id: 'rut',
      label: 'RUT',
      mono: true,
      render: (r) => r.rut || '—'
    },
    {
      id: 'nombre',
      label: 'Nombre',
      render: (r) => (
        <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
          {r.nombre || '—'}
        </Typography>
      )
    },
    {
      id: 'perfil',
      label: 'Perfil',
      render: (r) => (
        <Chip label={r.perfil || '—'} size="small" sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }} />
      )
    },
    {
      id: 'embarcacionesUsadas',
      label: 'Embarcaciones',
      render: (r) => {
        if (Array.isArray(r.embarcacionesUsadas) && r.embarcacionesUsadas.length > 0) {
          return (
            <Typography variant="body2" sx={{ fontSize: '0.76rem' }}>
              {r.embarcacionesUsadas.join(', ')}
            </Typography>
          );
        }
        return '—';
      }
    },
    {
      id: 'cantidadDeclaraciones',
      label: 'Declaraciones',
      align: 'center',
      render: (r) => r.cantidadDeclaraciones || 0
    },
    {
      id: 'consumo',
      label: 'Consumo',
      align: 'right',
      render: (r) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
          {Number(r.consumo || 0).toLocaleString('es-CL')} kg
        </Typography>
      )
    },
    {
      id: 'limiteEfectivo',
      label: 'Tope Efectivo',
      align: 'right',
      render: (r) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          {Number(r.limiteEfectivo || 0).toLocaleString('es-CL')} kg
        </Typography>
      )
    },
    {
      id: 'porcentaje',
      label: '% Consumo',
      align: 'right',
      render: (r) => {
        const pct = r.porcentaje != null ? r.porcentaje : (r.limiteEfectivo > 0 ? (r.consumo / r.limiteEfectivo) * 100 : 0);
        const isOver = pct > 100;
        return (
          <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 800, color: isOver ? 'error.main' : 'text.primary' }}>
            {pct.toFixed(1)}%
          </Typography>
        );
      }
    },
    {
      id: 'exceso',
      label: 'Exceso',
      align: 'right',
      render: (r) => {
        const exc = r.exceso != null ? Number(r.exceso) : Math.max(0, Number(r.consumo || 0) - Number(r.limiteEfectivo || 0));
        return (
          <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 700, color: exc > 0 ? 'error.dark' : 'text.disabled' }}>
            {exc > 0 ? `+${exc.toLocaleString('es-CL')} kg` : '—'}
          </Typography>
        );
      }
    }
  ], []);

  // Chips para filtros de personas en Tab 2
  const chipsFiltroPersonas = useMemo(() => [
    { id: 'SOBRE_LIMITE', label: 'Solo sobre límite', activo: soloSobreLimite, color: 'error', onClick: () => setSoloSobreLimite(true) },
    { id: 'TODAS', label: 'Todas las personas con actividad', activo: !soloSobreLimite, onClick: () => setSoloSobreLimite(false) },
  ], [soloSobreLimite]);

  // Texto normativo dinámico según parámetro de imputación territorial (TC.8)
  const notaTerritorialTexto = useMemo(() => {
    if (imputacionArmador === 'CALETA_DESEMBARQUE' || imputacionArmador === 'CALETA') {
      return 'El consumo suma recolectores (comuna de inscripción) y armadores (caleta de desembarque). Las AMERB se controlan en su propio módulo.';
    }
    return 'El consumo suma recolectores y armadores según comuna de inscripción (regla TC.8). Las AMERB se controlan en su propio módulo.';
  }, [imputacionArmador]);

  if (loading && cuotas.length === 0) {
    return (
      <Card 
        elevation={0}
        sx={{ 
          height: '100%', 
          borderRadius: 4, 
          border: 1, borderColor: 'divider',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 250 
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  if (error && cuotas.length === 0) {
    return (
      <Card 
        elevation={0}
        sx={{ 
          height: '100%', 
          borderRadius: 4, 
          border: 1, borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', mb: 2 }}>
            Control de Cuotas
          </Typography>
          <Typography color="error" sx={{ fontFamily: 'Inter', fontSize: '0.9rem' }}>{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      elevation={0}
      sx={{ 
        width: '100%',
        height: '100%',
        borderRadius: 4, 
        border: 1, borderColor: 'divider',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
          borderColor: 'divider',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
              Control de Cuotas
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
              Áreas libres — Consumo combinado (Recolector + Armador)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Selector de Comuna */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={comunaId}
                onChange={(e) => setComunaId(e.target.value)}
                displayEmpty
                slotProps={{
                  input: {
                    sx: { borderRadius: 3, fontFamily: 'Inter', fontSize: '0.85rem' }
                  }
                }}
              >
                <MenuItem value="" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Todas las comunas</MenuItem>
                {comunas.map((c) => (
                  <MenuItem key={c.id} value={c.id} sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>
                    {c.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Selector de Método de Extracción */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={extraccionTipoId}
                onChange={(e) => setExtraccionTipoId(e.target.value)}
                displayEmpty
                slotProps={{
                  input: {
                    sx: { borderRadius: 3, fontFamily: 'Inter', fontSize: '0.85rem' }
                  }
                }}
              >
                <MenuItem value="" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Todos los métodos</MenuItem>
                {extraccionTipos.map((et) => (
                  <MenuItem key={et.id} value={et.id} sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>
                    {et.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Nota Normativa de Consumo Territorial (TC.8) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
            px: 1.5,
            py: 0.75,
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)'),
            borderLeft: 3,
            borderColor: '#8b5cf6',
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: 'Inter', color: 'text.secondary', fontSize: '0.74rem' }}>
            <strong>Nota territorial:</strong> {notaTerritorialTexto}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3, borderColor: 'divider' }} />
        
        {cuotas.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
              No hay cuotas de área libre activas para los filtros seleccionados.
            </Typography>
          </Box>
        ) : (
          cuotas.map((cuota, index) => {
            const limiteEfectivo = cuota.limiteEfectivo != null ? cuota.limiteEfectivo : (cuota.limiteCuota || 0);
            const limiteNominal = cuota.limiteNominal != null ? cuota.limiteNominal : limiteEfectivo;
            const isPlantilla = Boolean(cuota.esPlantilla);
            const displayPercentage = isPlantilla 
              ? Math.min(100, cuota.maxPorcentaje || cuota.porcentajeUso || 0)
              : (cuota.porcentajeUso > 100 ? 100 : cuota.porcentajeUso);
            const colors = getProgressColors(isPlantilla ? (cuota.maxPorcentaje || cuota.porcentajeUso || 0) : cuota.porcentajeUso);
            const isSelected = cuotaSeleccionadaId === cuota.cuotaId;
            
            return (
              <Box 
                key={cuota.cuotaId || index}
                onClick={() => handleToggleCardSelection(cuota.cuotaId)}
                sx={{ 
                  mb: 2.5, 
                  p: 2,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected 
                    ? (t => t.palette.mode === 'dark' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(5, 150, 105, 0.04)') 
                    : 'background.paper',
                  boxShadow: isSelected ? 2 : 0,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: isSelected ? 'primary.main' : 'primary.light',
                    transform: 'translateY(-1px)'
                  },
                  '&:last-child': { mb: 1 } 
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
                      {cuota.especieNombre}
                    </Typography>

                    {/* Chip de cuota seleccionada */}
                    {isSelected && (
                      <Chip 
                        size="small" 
                        label="Filtrando sobrepasos" 
                        color="primary" 
                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} 
                      />
                    )}

                    {/* Badge de Plantilla Individual (TM.2) */}
                    {isPlantilla && (
                      <Chip
                        size="small"
                        label="Plantilla Individual"
                        color="secondary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                      />
                    )}

                    {/* Badge de Vigencia Temporal (T1.7) */}
                    {cuota.vigenciaFormateada ? (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'Inter',
                          color: '#0284c7',
                          bgcolor: 'rgba(2, 132, 199, 0.08)',
                          border: 1, borderColor: 'rgba(2, 132, 199, 0.25)',
                          borderRadius: 2,
                          px: 0.8,
                          py: 0.1,
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }}
                      >
                        📅 {cuota.vigenciaFormateada}
                      </Typography>
                    ) : cuota.periodo && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'Inter',
                          color: '#7c3aed',
                          bgcolor: 'rgba(124, 58, 237, 0.08)',
                          border: 1, borderColor: 'rgba(124, 58, 237, 0.25)',
                          borderRadius: 2,
                          px: 0.8,
                          py: 0.1,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      >
                        {cuota.periodo}
                      </Typography>
                    )}

                    {/* Badge de Método de Extracción */}
                    {cuota.extraccionTipoNombre && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'Inter',
                          color: 'text.secondary',
                          bgcolor: 'action.hover',
                          border: 1, borderColor: 'divider',
                          borderRadius: 2,
                          px: 0.8,
                          py: 0.1,
                          fontSize: '0.68rem',
                          fontWeight: 600
                        }}
                      >
                        {cuota.extraccionTipoNombre}
                      </Typography>
                    )}

                    {/* Badge de Comunas (T1.7) */}
                    {(cuota.comunasNombre || cuota.comunaNombre) && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'Inter',
                          color: 'text.secondary',
                          bgcolor: 'action.hover',
                          border: 1, borderColor: 'divider',
                          borderRadius: 2,
                          px: 0.8,
                          py: 0.1,
                          fontSize: '0.68rem',
                          fontWeight: 600
                        }}
                        title={cuota.comunasNombre || cuota.comunaNombre}
                      >
                        📍 {cuota.comunasNombre || cuota.comunaNombre}
                      </Typography>
                    )}

                    {cuota.humedadEstadoNombre && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'Inter',
                          color: 'primary.main',
                          bgcolor: 'rgba(14, 165, 233, 0.08)',
                          border: 1, borderColor: 'rgba(14, 165, 233, 0.2)',
                          borderRadius: 2,
                          px: 0.8,
                          py: 0.1,
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      >
                        {cuota.humedadEstadoNombre}
                      </Typography>
                    )}

                    {cuota.alcance && cuota.alcance !== 'Global' && !cuota.alcance.startsWith('Comuna') && !cuota.comunasNombre && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'Inter',
                          color: 'text.secondary',
                          bgcolor: 'divider',
                          border: 1, borderColor: 'divider',
                          borderRadius: 2,
                          px: 1,
                          py: 0.1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 180
                        }}
                        title={cuota.alcance}
                      >
                        {cuota.alcance}
                      </Typography>
                    )}
                  </Box>

                  {/* Cifras de consumo */}
                  {isPlantilla ? (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'Inter', fontSize: '0.825rem', color: 'text.secondary' }}>
                        <span style={{ fontWeight: 700, color: colors.label }}>
                          {cuota.textoConsumoPlantilla || `${cuota.personasSobreLimite || 0} de ${cuota.personasConActividad || 0} personas sobre su tope (máx. ${(cuota.maxPorcentaje || cuota.porcentajeUso || 0).toFixed(1)}%)`}
                        </span>
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                        Tope individual de {limiteNominal?.toLocaleString('es-CL')} kg {cuota.humedadEstadoNombre || ''} por persona
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'Inter', fontSize: '0.825rem', color: 'text.secondary' }}>
                        {cuota.volumenExtraido?.toLocaleString('es-CL')} / {limiteEfectivo?.toLocaleString('es-CL')} kg ({cuota.metrica || 'CAPTURA'}){' '}
                        <span style={{ fontWeight: 700, color: colors.label }}>
                          ({cuota.porcentajeUso}%)
                        </span>
                      </Typography>
                      {cuota.descripcionEquivalencia ? (
                        <Typography variant="caption" sx={{ color: 'info.main', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                          {cuota.descripcionEquivalencia}
                        </Typography>
                      ) : (limiteNominal !== limiteEfectivo && limiteNominal > 0 && (
                        <Typography variant="caption" sx={{ color: 'info.main', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                          {limiteNominal.toLocaleString('es-CL')} kg nominal ≡ {limiteEfectivo.toLocaleString('es-CL')} kg captura
                        </Typography>
                      ))}
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                        Saldo disponible: {Math.max(0, limiteEfectivo - (cuota.volumenExtraido || 0)).toLocaleString('es-CL')} kg
                      </Typography>
                    </Box>
                  )}
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={displayPercentage} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    bgcolor: 'divider',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: colors.bar,
                    }
                  }}
                />

                {/* Aviso TQ.3: Declaraciones del período sin evaluar */}
                {cuota.declaracionesPreviasSinEvaluar != null && cuota.declaracionesPreviasSinEvaluar > 0 && (
                  <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      mt: 1.5,
                      p: 1.2,
                      borderRadius: 2,
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                      border: 1,
                      borderColor: 'warning.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      flexWrap: 'wrap'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" sx={{ fontSize: 18 }} />
                      <Typography variant="caption" sx={{ fontFamily: 'Inter', color: 'warning.dark', fontWeight: 600 }}>
                        <strong>{cuota.declaracionesPreviasSinEvaluar}</strong> {cuota.declaracionesPreviasSinEvaluar === 1 ? 'declaración' : 'declaraciones'} del período {cuota.declaracionesPreviasSinEvaluar === 1 ? 'anterior' : 'anteriores'} a la carga de esta cuota no {cuota.declaracionesPreviasSinEvaluar === 1 ? 'fue evaluada' : 'fueron evaluadas'}.
                      </Typography>
                    </Box>
                    {puedeRecalcular && (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        startIcon={<AutorenewIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAbrirRecalculo(cuota);
                        }}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          py: 0.3,
                          px: 1.2,
                          borderRadius: 2,
                          boxShadow: 0
                        }}
                      >
                        Recalcular hallazgos
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            );
          })
        )}

        {/* Botón y cabecera para desplegable de Detalle de Sobrepasos (TQ.2) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 1.5, borderTop: 1, borderColor: 'divider', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {cuotaSeleccionadaId && (
              <Chip
                label={`Filtrando sobrepasos por cuota #${cuotaSeleccionadaId}`}
                size="small"
                color="primary"
                onDelete={() => setCuotaSeleccionadaId(null)}
                sx={{ fontWeight: 700, fontSize: '0.72rem' }}
              />
            )}
          </Box>
          <Button
            size="small"
            variant={showSobrepasos ? 'outlined' : 'text'}
            color="primary"
            startIcon={<WarningIcon />}
            endIcon={showSobrepasos ? <UpIcon /> : <DownIcon />}
            onClick={() => setShowSobrepasos(!showSobrepasos)}
            sx={{ textTransform: 'none', fontFamily: 'Outfit', fontWeight: 700 }}
          >
            {showSobrepasos ? 'Ocultar Detalle de Sobrepasos' : 'Ver Detalle de Sobrepasos (Auditoría)'}
          </Button>
        </Box>

        {/* Sección desplegable: Detalle de sobrepasos en 2 pestañas (TQ.2) */}
        <Collapse in={showSobrepasos} unmountOnExit={false}>
          <Box sx={{ mt: 2, p: 2, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50' }}>
            <Tabs
              value={tabIndex}
              onChange={(e, v) => setTabIndex(v)}
              sx={{
                mb: 2,
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': { textTransform: 'none', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.82rem' }
              }}
            >
              <Tab label="1. Declaraciones sobre el límite" />
              <Tab label="2. Cuotas individuales: personas sobre su tope" />
            </Tabs>

            {/* PESTAÑA 1: Declaraciones sobre el límite */}
            {tabIndex === 0 && (
              <TablaDetalleHallazgos
                titulo="Declaraciones sobre el límite"
                subtitulo="Declaraciones registradas cuando el consumo superaba el límite o posteriores a cierre (TQ.1 · TQ.2)"
                columnas={columnasSobrepasos}
                filtrosChip={chipsFiltroMarca}
                fetcher={fetcherSobrepasos}
                exportarNombre="sobrepasos_declaraciones"
                onFilaClick={(r) => {
                  const tipo = r.declaracionTipo;
                  const id = r.declaracionId;
                  if (tipo && id) {
                    navigate(`/consultas/${tipo.toLowerCase()}/${id}`);
                  }
                }}
                vacio="No se registran sobrepasos de cuota para los filtros seleccionados."
                maxHeight={360}
                paginacion={true}
              />
            )}

            {/* PESTAÑA 2: Cuotas individuales: personas sobre su tope */}
            {tabIndex === 1 && (
              <Box>
                {/* Selector de cuota para inspección individual */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontFamily: 'Inter', fontWeight: 700, color: 'text.secondary' }}>
                    Cuota evaluada:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 260 }}>
                    <Select
                      value={cuotaPersonasId || ''}
                      onChange={(e) => setCuotaPersonasId(e.target.value)}
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, fontFamily: 'Inter', fontSize: '0.8rem', py: 0.25 }
                        }
                      }}
                    >
                      {cuotas.map((c) => (
                        <MenuItem key={c.cuotaId} value={c.cuotaId} sx={{ fontSize: '0.8rem', fontFamily: 'Inter' }}>
                          #{c.cuotaId} · {c.especieNombre} ({c.alcance || c.comunaNombre || 'Cuota'}) {c.esPlantilla ? '— [Plantilla]' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {errorPersonas && (
                  <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem' }}>
                    {errorPersonas}
                  </Alert>
                )}

                <TablaDetalleHallazgos
                  titulo="Consumo individual por persona"
                  subtitulo="Desglose de extracciones por persona y cálculo de tope individual (TM.2 · TQ.2)"
                  columnas={columnasPersonas}
                  filtrosChip={chipsFiltroPersonas}
                  data={personasData}
                  loading={loadingPersonas}
                  exportarNombre="personas_consumo_cuota"
                  vacio="No hay personas con declaraciones para la cuota y filtro seleccionados."
                  maxHeight={360}
                  paginacion={true}
                  initialPageSize={20}
                />
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>

      {/* Modal Diálogo de Recálculo de Hallazgos (TC.10 / TQ.3) */}
      <Dialog
        open={recalculoModalOpen}
        onClose={handleCerrarRecalculo}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutorenewIcon color="warning" />
          Recalcular Hallazgos de Cuota #{cuotaPorRecalcular?.cuotaId}
        </DialogTitle>
        <DialogContent>
          {cuotaPorRecalcular && (
            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'grey.50', border: 1, borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                {cuotaPorRecalcular.especieNombre} — {cuotaPorRecalcular.alcance || cuotaPorRecalcular.comunasNombre || cuotaPorRecalcular.comunaNombre || 'Cuota'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Método: {cuotaPorRecalcular.extraccionTipoNombre || 'Todos'} · Vigencia: {cuotaPorRecalcular.vigenciaFormateada || cuotaPorRecalcular.periodo || '—'}
              </Typography>
            </Box>
          )}

          {recalculoError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {recalculoError}
            </Alert>
          )}

          {!resultadoRecalculo ? (
            <DialogContentText sx={{ fontFamily: 'Inter', fontSize: '0.88rem', color: 'text.primary', lineHeight: 1.6 }}>
              Esta operación recorre cronológicamente todas las declaraciones aplicables dentro de la vigencia de la cuota.
              Reconstruirá el consumo acumulado secuencialmente y registrará las marcas correspondientes que falten (<code>CUOTA_EXCEDIDA</code>, <code>POSTERIOR_CIERRE</code> o <code>DECLARACION_EXTEMPORANEA</code>) con origen <strong>RECALCULO</strong>.
              <br /><br />
              <strong>Garantía de idempotencia:</strong> Las marcas existentes no se borrarán ni se duplicarán. Se registrará un evento de auditoría oficial <code>RECALCULADA</code>.
            </DialogContentText>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                Recálculo completado exitosamente para la cuota #{resultadoRecalculo.cuotaId}.
              </Alert>

              <Box sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1, color: 'success.dark' }}>
                  Resumen de Auditoría
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Declaraciones Evaluadas</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultadoRecalculo.declaracionesEvaluadas}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Marcas Nuevas Creadas</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: resultadoRecalculo.marcasNuevas > 0 ? 'warning.main' : 'text.primary' }}>
                      {resultadoRecalculo.marcasNuevas}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Marcas Preexistentes</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultadoRecalculo.marcasExistentes}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Consumo Reconstruido</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {resultadoRecalculo.consumoFinalKg?.toLocaleString('es-CL')} kg ({resultadoRecalculo.porcentajeFinalUso}%)
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {Array.isArray(resultadoRecalculo.marcasNuevasDetalle) && resultadoRecalculo.marcasNuevasDetalle.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Detalle de Marcas Nuevas Generadas ({resultadoRecalculo.marcasNuevasDetalle.length}):
                  </Typography>
                  <Box sx={{ maxHeight: 150, overflowY: 'auto', p: 1, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    {resultadoRecalculo.marcasNuevasDetalle.map((m, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.3, borderBottom: '1px dashed', borderColor: 'divider', fontSize: '0.75rem' }}>
                        <span><strong>{m.marca}</strong> ({m.tipoDeclaracion} #{m.declaracionId})</span>
                        <span style={{ color: '#64748b' }}>{m.motivo || m.observacion || ''}</span>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {!resultadoRecalculo ? (
            <>
              <Button onClick={handleCerrarRecalculo} disabled={recalculando} sx={{ textTransform: 'none', fontFamily: 'Inter' }}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={handleEjecutarRecalculo}
                disabled={recalculando}
                startIcon={recalculando ? <CircularProgress size={18} color="inherit" /> : <AutorenewIcon />}
                sx={{ textTransform: 'none', fontFamily: 'Outfit', fontWeight: 700, borderRadius: 2 }}
              >
                {recalculando ? 'Recalculando…' : 'Ejecutar Recálculo'}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCerrarRecalculo}
              sx={{ textTransform: 'none', fontFamily: 'Outfit', fontWeight: 700, borderRadius: 2 }}
            >
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  );
}
