import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
  Alert,
  CircularProgress,
  Switch,
  Tooltip,
  InputAdornment,
  FormControlLabel,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  Scale as ScaleIcon,
  Search as SearchIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  WarningAmber as WarningIcon,
  Tune as TuneIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Terrain as TerrainIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

const MESES = [
  { id: 1, nombre: 'Enero' },
  { id: 2, nombre: 'Febrero' },
  { id: 3, nombre: 'Marzo' },
  { id: 4, nombre: 'Abril' },
  { id: 5, nombre: 'Mayo' },
  { id: 6, nombre: 'Junio' },
  { id: 7, nombre: 'Julio' },
  { id: 8, nombre: 'Agosto' },
  { id: 9, nombre: 'Septiembre' },
  { id: 10, nombre: 'Octubre' },
  { id: 11, nombre: 'Noviembre' },
  { id: 12, nombre: 'Diciembre' },
];

const pad = (n) => String(n).padStart(2, '0');

const calcFechasMes = (y, m) => {
  const ultimoDia = new Date(y, m, 0).getDate();
  return {
    inicio: `${y}-${pad(m)}-01`,
    fin: `${y}-${pad(m)}-${pad(ultimoDia)}`,
  };
};

const fmtKg = (n) =>
  `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(n ?? 0)} kg`;

const fmtTon = (kg) =>
  `= ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format((kg || 0) / 1000)} t`;

const ANIO_ACTUAL = new Date().getFullYear();
const MES_ACTUAL = new Date().getMonth() + 1;

const FORM_VACIO = {
  id: null,
  ambito: 'AREA_LIBRE',
  nivelAgregacion: 'COMUNA',
  region: null,
  comunas: [],
  especie: null,
  extraccionTipo: null,
  periodo: 'MENSUAL',
  anioVigencia: ANIO_ACTUAL,
  mesVigencia: MES_ACTUAL,
  fechaInicio: calcFechasMes(ANIO_ACTUAL, MES_ACTUAL).inicio,
  fechaFin: calcFechasMes(ANIO_ACTUAL, MES_ACTUAL).fin,
  limiteKg: 100000,
  metrica: 'CAPTURA',
  humedadEstado: null,
  modoAccion: 'SOLO_ALERTA',
  resolucion: '',
  estado: 'ABIERTA',
  activo: true,
};

export default function CuotasExtraccionMaestro() {
  const [cuotas, setCuotas] = useState([]);
  const [maestros, setMaestros] = useState({
    regiones: [],
    comunas: [],
    especies: [],
    extraccionTipos: [],
    humedadEstados: [],
  });
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  // Filtros de listado
  const [filtroAnio, setFiltroAnio] = useState(ANIO_ACTUAL);
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroComuna, setFiltroComuna] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [verAmerb, setVerAmerb] = useState(false);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [porEliminar, setPorEliminar] = useState(null);
  const [cuotaPorCerrar, setCuotaPorCerrar] = useState(null);

  useEffect(() => {
    cargarMaestros();
  }, []);

  useEffect(() => {
    cargarListado();
  }, [filtroAnio, filtroMes, filtroComuna, filtroMetodo, verAmerb]);

  const cargarMaestros = async () => {
    try {
      const res = await api.get('/api/cuotas/maestros');
      setMaestros(res.data || {});
    } catch (e) {
      console.error('Error cargando maestros de cuotas:', e);
    }
  };

  const cargarListado = async () => {
    try {
      setLoading(true);
      const params = {
        anio: filtroAnio || undefined,
        mes: filtroMes || undefined,
        comunaId: filtroComuna || undefined,
        extraccionTipoId: filtroMetodo || undefined,
        ambito: verAmerb ? 'AMERB' : 'AREA_LIBRE',
      };
      const res = await api.get('/api/cuotas/listado', { params });
      setCuotas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando listado de cuotas:', error);
      setMensaje({ type: 'error', text: 'Error al cargar las cuotas desde el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const abrirNueva = () => {
    const fechas = calcFechasMes(ANIO_ACTUAL, MES_ACTUAL);
    setForm({
      ...FORM_VACIO,
      region: maestros.regiones?.[0] || null,
      comunas: [],
      especie: maestros.especies?.[0] || null,
      extraccionTipo: maestros.extraccionTipos?.[0] || null,
      fechaInicio: fechas.inicio,
      fechaFin: fechas.fin,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const abrirEditar = (c) => {
    if (c.esFormatoAnterior) {
      setMensaje({
        type: 'warning',
        text: `La cuota #${c.id} tiene formato anterior. Sólo puede ser cerrada o desactivada desde este mantenedor.`,
      });
      setTimeout(() => setMensaje(null), 5000);
      return;
    }

    if (c.ambito === 'AMERB') {
      setMensaje({
        type: 'info',
        text: `La cuota #${c.id} es de Área de Manejo (AMERB) y se encuentra en modo sólo lectura en este listado.`,
      });
      setTimeout(() => setMensaje(null), 5000);
      return;
    }

    // Resolver año y mes de vigencia inicial
    let y = ANIO_ACTUAL;
    let m = MES_ACTUAL;
    if (c.fechaInicio) {
      const dt = new Date(c.fechaInicio);
      if (!isNaN(dt.getTime())) {
        y = dt.getUTCFullYear();
        m = dt.getUTCMonth() + 1;
      }
    }

    // Resolver comunas seleccionadas
    const cIds = c.comunaIds ? Array.from(c.comunaIds) : (c.comunaId ? [c.comunaId] : []);
    const comunasSel = (maestros.comunas || []).filter((cm) => cIds.includes(cm.id));

    // Resolver región
    const regSel = (maestros.regiones || []).find((r) => r.id === c.regionId) ||
      (comunasSel.length > 0 && comunasSel[0].regionId
        ? (maestros.regiones || []).find((r) => r.id === comunasSel[0].regionId)
        : null);

    setForm({
      id: c.id,
      ambito: 'AREA_LIBRE',
      nivelAgregacion: c.nivelAgregacion === 'REGION' ? 'REGION' : 'COMUNA',
      region: regSel || maestros.regiones?.[0] || null,
      comunas: comunasSel,
      especie: (maestros.especies || []).find((e) => e.id === c.especieId) || null,
      extraccionTipo: (maestros.extraccionTipos || []).find((et) => et.id === c.extraccionTipoId) || null,
      periodo: 'MENSUAL',
      anioVigencia: y,
      mesVigencia: m,
      fechaInicio: c.fechaInicio ? String(c.fechaInicio).slice(0, 10) : '',
      fechaFin: c.fechaFin ? String(c.fechaFin).slice(0, 10) : '',
      limiteKg: c.limiteKg != null ? Number(c.limiteKg) : 100000,
      metrica: c.metrica || 'CAPTURA',
      humedadEstado: (maestros.humedadEstados || []).find((h) => h.id === c.humedadEstadoId) || null,
      modoAccion: c.modoAccion || 'SOLO_ALERTA',
      resolucion: c.resolucion || '',
      estado: c.estado || 'ABIERTA',
      activo: c.activo ?? true,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleCambioAnioMes = (nuevoAnio, nuevoMes) => {
    const y = parseInt(nuevoAnio, 10) || ANIO_ACTUAL;
    const m = parseInt(nuevoMes, 10) || MES_ACTUAL;
    const fechas = calcFechasMes(y, m);
    setForm((prev) => ({
      ...prev,
      anioVigencia: y,
      mesVigencia: m,
      fechaInicio: fechas.inicio,
      fechaFin: fechas.fin,
    }));
  };

  const comunasFiltradas = useMemo(() => {
    if (!form.region?.id) return maestros.comunas || [];
    return (maestros.comunas || []).filter(
      (c) => c.region?.id === form.region.id || c.regionId === form.region.id
    );
  }, [maestros.comunas, form.region]);

  const handleGuardar = async () => {
    const lim = parseFloat(form.limiteKg);
    if (isNaN(lim) || lim <= 0) {
      setFormError('El límite debe ser un número positivo en kilogramos.');
      return;
    }

    if (form.nivelAgregacion === 'COMUNA' && (!form.comunas || form.comunas.length === 0)) {
      setFormError('Debe seleccionar al menos una comuna para el nivel Comunal.');
      return;
    }

    if (form.nivelAgregacion === 'REGION' && !form.region) {
      setFormError('Debe seleccionar una región para el nivel Regional.');
      return;
    }

    if (!form.especie) {
      setFormError('La especie objetivo es obligatoria.');
      return;
    }

    if (!form.extraccionTipo) {
      setFormError('El método de extracción es obligatorio.');
      return;
    }

    if (!form.fechaInicio || !form.fechaFin) {
      setFormError('Las fechas de inicio y fin de vigencia son obligatorias.');
      return;
    }

    if (form.fechaFin < form.fechaInicio) {
      setFormError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    // Validar que ambas fechas caigan dentro del mismo mes calendario
    const iniY = form.fechaInicio.slice(0, 4);
    const iniM = form.fechaInicio.slice(5, 7);
    const finY = form.fechaFin.slice(0, 4);
    const finM = form.fechaFin.slice(5, 7);
    if (iniY !== finY || iniM !== finM) {
      setFormError('La vigencia mensual debe quedar acotada dentro del mismo mes calendario.');
      return;
    }

    if (form.metrica === 'DESEMBARQUE' && !form.resolucion?.trim()) {
      setFormError(
        'Sernapesca definió que las cuotas se descuentan obligatoriamente con captura biológica corregida. La métrica DESEMBARQUE sólo se permite si la resolución técnica de Subpesca lo especifica expresamente (campo resolución obligatorio).'
      );
      return;
    }

    const payload = {
      ambito: 'AREA_LIBRE',
      nivelAgregacion: form.nivelAgregacion,
      region: form.region ? { id: form.region.id } : null,
      comunas: form.nivelAgregacion === 'COMUNA' ? form.comunas.map((c) => ({ id: c.id })) : [],
      comuna: form.nivelAgregacion === 'COMUNA' && form.comunas.length > 0 ? { id: form.comunas[0].id } : null,
      especie: { id: form.especie.id },
      extraccionTipo: { id: form.extraccionTipo.id },
      periodo: 'MENSUAL',
      fechaInicio: form.fechaInicio.slice(0, 10),
      fechaFin: form.fechaFin.slice(0, 10),
      limiteKg: lim,
      metrica: form.metrica || 'CAPTURA',
      humedadEstado: form.humedadEstado ? { id: form.humedadEstado.id } : null,
      modoAccion: form.modoAccion || 'SOLO_ALERTA',
      resolucion: form.resolucion?.trim() || null,
      estado: form.estado || 'ABIERTA',
      activo: Boolean(form.activo),
    };

    try {
      setSaving(true);
      if (form.id) {
        await api.put(`/api/cuotas/${form.id}`, payload);
      } else {
        await api.post('/api/cuotas', payload);
      }
      setDialogOpen(false);
      setMensaje({ type: 'success', text: `Cuota ${form.id ? 'actualizada' : 'creada'} correctamente.` });
      setTimeout(() => setMensaje(null), 4000);
      await cargarListado();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'No se pudo guardar la cuota. Verifica los datos ingresados.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCerrarCuota = async () => {
    if (!cuotaPorCerrar) return;
    try {
      await api.put(`/api/cuotas/${cuotaPorCerrar.id}/cerrar`);
      setMensaje({ type: 'success', text: `Cuota #${cuotaPorCerrar.id} cerrada administrativamente.` });
      setCuotaPorCerrar(null);
      setTimeout(() => setMensaje(null), 4000);
      await cargarListado();
    } catch (error) {
      console.error('Error cerrando cuota:', error);
      setMensaje({ type: 'error', text: 'No se pudo cerrar administrativamente la cuota.' });
      setCuotaPorCerrar(null);
    }
  };

  const toggleActivo = async (c) => {
    try {
      const fechaIni = c.fechaInicio ? String(c.fechaInicio).slice(0, 10) : null;
      const fechaF = c.fechaFin ? String(c.fechaFin).slice(0, 10) : null;
      const payload = {
        ambito: c.ambito || 'AREA_LIBRE',
        nivelAgregacion: c.nivelAgregacion || 'COMUNA',
        region: c.regionId ? { id: c.regionId } : null,
        comunas: c.comunaIds ? Array.from(c.comunaIds).map((id) => ({ id })) : [],
        comuna: c.comunaId ? { id: c.comunaId } : null,
        especie: c.especieId ? { id: c.especieId } : null,
        extraccionTipo: c.extraccionTipoId ? { id: c.extraccionTipoId } : null,
        periodo: c.periodo || 'MENSUAL',
        fechaInicio: fechaIni,
        fechaFin: fechaF,
        limiteKg: c.limiteKg,
        metrica: c.metrica || 'CAPTURA',
        humedadEstado: c.humedadEstadoId ? { id: c.humedadEstadoId } : null,
        modoAccion: c.modoAccion || 'SOLO_ALERTA',
        resolucion: c.resolucion,
        estado: c.estado || 'ABIERTA',
        activo: !c.activo,
      };
      await api.put(`/api/cuotas/${c.id}`, payload);
      await cargarListado();
    } catch (error) {
      const msg = error.response?.data?.message || 'No se pudo cambiar el estado de la cuota.';
      setMensaje({ type: 'error', text: msg });
      setTimeout(() => setMensaje(null), 5000);
    }
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    try {
      await api.delete(`/api/cuotas/${porEliminar.id}`);
      setPorEliminar(null);
      setMensaje({ type: 'success', text: 'Cuota eliminada correctamente.' });
      setTimeout(() => setMensaje(null), 4000);
      await cargarListado();
    } catch {
      setPorEliminar(null);
      setMensaje({ type: 'error', text: 'No se pudo eliminar la cuota.' });
    }
  };

  const cuotasFiltradas = useMemo(() => {
    const txt = filtroTexto.trim().toLowerCase();
    if (!txt) return cuotas;
    return cuotas.filter((c) => {
      const blob = [
        c.alcance,
        c.especieNombre,
        c.extraccionTipoNombre,
        c.vigenciaDescripcion,
        c.resolucion,
        c.metrica,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(txt);
    });
  }, [cuotas, filtroTexto]);

  return (
    <Box>
      {/* Banner explicativo de Cuotas Áreas Libres */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(14, 165, 233, 0.03) 100%)',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <ScaleIcon color="secondary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
              Cuotas Comunales Mensuales de Áreas Libres (Recolectores y Armadores)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', lineHeight: 1.6 }}>
            Límites mensuales decretados por Subpesca para áreas libres. El consumo acumula conjuntamente
            a <strong>recolectores de orilla</strong> (imputados por comuna de residencia) y <strong>armadores artesanales</strong> (imputados por caleta de desembarque).
            El motor descuenta en <strong>captura biológica corregida</strong> (o desembarque con resolución) y evalúa alertas o bloqueos concurrentemente.
          </Typography>
        </CardContent>
      </Card>

      {/* Alertas */}
      {mensaje && (
        <Alert severity={mensaje.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMensaje(null)}>
          {mensaje.text}
        </Alert>
      )}

      {/* Barra de herramientas y filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Filtro Año */}
          <TextField
            select
            size="small"
            label="Año"
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(Number(e.target.value))}
            sx={{ width: 110 }}
          >
            {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>

          {/* Filtro Mes */}
          <TextField
            select
            size="small"
            label="Mes"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            sx={{ width: 140 }}
          >
            <MenuItem value="">Todos los meses</MenuItem>
            {MESES.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.nombre}
              </MenuItem>
            ))}
          </TextField>

          {/* Filtro Comuna */}
          <TextField
            select
            size="small"
            label="Comuna"
            value={filtroComuna}
            onChange={(e) => setFiltroComuna(e.target.value)}
            sx={{ width: 160 }}
          >
            <MenuItem value="">Todas las comunas</MenuItem>
            {(maestros.comunas || []).map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nombre}
              </MenuItem>
            ))}
          </TextField>

          {/* Filtro Método */}
          <TextField
            select
            size="small"
            label="Método"
            value={filtroMetodo}
            onChange={(e) => setFiltroMetodo(e.target.value)}
            sx={{ width: 150 }}
          >
            <MenuItem value="">Todos los métodos</MenuItem>
            {(maestros.extraccionTipos || []).map((et) => (
              <MenuItem key={et.id} value={et.id}>
                {et.nombre}
              </MenuItem>
            ))}
          </TextField>

          {/* Buscador de texto */}
          <TextField
            size="small"
            placeholder="Buscar por especie, resolución…"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: 200, sm: 240 } }}
          />

          {/* Switch Ver AMERB */}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={verAmerb}
                onChange={(e) => setVerAmerb(e.target.checked)}
                color="secondary"
              />
            }
            label={
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Ver cuotas AMERB
              </Typography>
            }
            sx={{ ml: 0.5 }}
          />
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={abrirNueva}
          sx={{
            borderRadius: 2.5,
            textTransform: 'none',
            fontFamily: 'Outfit',
            fontWeight: 600,
            px: 2.5,
          }}
        >
          Nueva Cuota
        </Button>
      </Box>

      {/* Tabla de cuotas */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Alcance Territorial</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie / Método</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Vigencia</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Límite Oficial</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', minWidth: 170 }}>Consumo en Vivo</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} color="secondary" />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      Cargando cuotas y consumo...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : cuotasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No se encontraron cuotas para los filtros seleccionados.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cuotasFiltradas.map((c) => {
                  const pctConsumido = c.porcentajeUso != null ? c.porcentajeUso : 0;
                  const estaCerrada = (c.estado || '').toUpperCase() === 'CERRADA';
                  const esAmerb = c.ambito === 'AMERB';

                  return (
                    <TableRow key={c.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Alcance Territorial */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={c.nivelAgregacion || 'COMUNA'}
                            size="small"
                            color={c.nivelAgregacion === 'REGION' ? 'secondary' : 'primary'}
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                          {c.esFormatoAnterior && (
                            <Chip
                              icon={<HistoryIcon sx={{ fontSize: 13 }} />}
                              label="formato anterior"
                              size="small"
                              color="warning"
                              variant="filled"
                              sx={{ fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                          {esAmerb && (
                            <Chip
                              icon={<TerrainIcon sx={{ fontSize: 13 }} />}
                              label="AMERB"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.alcance || c.comunasNombre || c.regionNombre || `Cuota #${c.id}`}
                        </Typography>
                        {c.resolucion && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {c.resolucion}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Especie / Método */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.especieNombre || 'Sin especie'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Método: {c.extraccionTipoNombre || 'Todos'}
                        </Typography>
                      </TableCell>

                      {/* Vigencia */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {c.vigenciaDescripcion || c.periodo}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {c.periodo}
                        </Typography>
                      </TableCell>

                      {/* Límite Oficial */}
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                          {fmtKg(c.limiteKg)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {fmtTon(c.limiteKg)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            color: c.metrica === 'DESEMBARQUE' ? 'warning.main' : 'text.secondary',
                            fontSize: '0.7rem',
                            fontWeight: c.metrica === 'DESEMBARQUE' ? 600 : 400,
                          }}
                        >
                          en {c.metrica || 'CAPTURA'}
                          {c.metrica === 'DESEMBARQUE' && ' (Excepción)'}
                          {c.humedadEstadoNombre && c.humedadEstadoNombre !== 'Sin conversión'
                            ? ` (${c.humedadEstadoNombre})`
                            : ''}
                        </Typography>
                      </TableCell>

                      {/* Consumo en Vivo */}
                      <TableCell>
                        <Box sx={{ width: '100%', maxWidth: 220 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {fmtKg(c.consumoAcumulado)} ({pctConsumido}%)
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                color: pctConsumido >= 100 ? 'error.main' : pctConsumido >= 80 ? 'warning.main' : 'success.main',
                              }}
                            >
                              {fmtKg(c.saldoDisponible)} disp.
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, pctConsumido || 0)}
                            color={pctConsumido >= 100 ? 'error' : pctConsumido >= 80 ? 'warning' : 'primary'}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Chip
                            icon={estaCerrada ? <LockIcon sx={{ fontSize: 14 }} /> : <LockOpenIcon sx={{ fontSize: 14 }} />}
                            label={estaCerrada ? 'CERRADA' : 'ABIERTA'}
                            size="small"
                            color={estaCerrada ? 'error' : 'success'}
                            variant={estaCerrada ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                          />
                          <Chip
                            label={c.modoAccion === 'BLOQUEO_DECLARACION' ? 'Bloqueo' : 'Alerta'}
                            size="small"
                            color={c.modoAccion === 'BLOQUEO_DECLARACION' ? 'error' : 'default'}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', fontWeight: 600, height: 20 }}
                          />
                        </Box>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, alignItems: 'center' }}>
                          <Tooltip title={c.activo ? 'Desactivar cuota' : 'Activar cuota'}>
                            <Switch
                              size="small"
                              checked={Boolean(c.activo)}
                              onChange={() => toggleActivo(c)}
                              color="secondary"
                            />
                          </Tooltip>

                          {!c.esFormatoAnterior && !esAmerb && (
                            <Tooltip title="Editar Cuota">
                              <IconButton size="small" onClick={() => abrirEditar(c)} color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {!estaCerrada && (
                            <Tooltip title="Cerrar Cuota Administrativamente">
                              <IconButton
                                size="small"
                                onClick={() => setCuotaPorCerrar(c)}
                                color="warning"
                              >
                                <LockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Eliminar Cuota">
                            <IconButton
                              size="small"
                              onClick={() => setPorEliminar(c)}
                              color="error"
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal Formulario Definitivo */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          {form.id ? 'Editar Cuota Comunal / Regional' : 'Nueva Cuota de Área Libre'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {formError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          {/* Fila 1: Nivel de Agregación y Región */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              select
              label="Nivel de Agregación *"
              value={form.nivelAgregacion}
              onChange={(e) => {
                const nv = e.target.value;
                setForm((p) => ({
                  ...p,
                  nivelAgregacion: nv,
                  comunas: nv === 'REGION' ? [] : p.comunas,
                }));
              }}
              helperText="Comunal (una o varias comunas) o Regional (toda la región)"
            >
              <MenuItem value="COMUNA">COMUNAL (Una o más comunas)</MenuItem>
              <MenuItem value="REGION">REGIONAL (Toda la región)</MenuItem>
            </TextField>

            <Autocomplete
              options={maestros.regiones || []}
              getOptionLabel={(r) => r.nombre || `ID ${r.id}`}
              value={form.region}
              onChange={(e, val) => setForm((p) => ({ ...p, region: val, comunas: [] }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={form.nivelAgregacion === 'REGION' ? 'Región *' : 'Región (Filtro de comunas)'}
                  placeholder="Seleccione región"
                  helperText={form.nivelAgregacion === 'COMUNA' ? 'Filtra las comunas disponibles abajo' : 'Ámbito regional obligatorio'}
                />
              )}
            />
          </Box>

          {/* Fila 2: Comuna(s) con Chips Múltiples */}
          {form.nivelAgregacion === 'COMUNA' && (
            <Autocomplete
              multiple
              options={comunasFiltradas}
              getOptionLabel={(c) => c.nombre || `ID ${c.id}`}
              value={form.comunas || []}
              onChange={(e, val) => setForm((p) => ({ ...p, comunas: val }))}
              renderTags={(val, getTagProps) =>
                val.map((option, index) => (
                  <Chip
                    key={option.id}
                    label={option.nombre}
                    size="small"
                    color="primary"
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Comuna(s) de la Cuota *"
                  placeholder={form.comunas?.length === 0 ? 'Seleccione una o más comunas' : ''}
                  helperText="Selección múltiple (ej. Coquimbo + La Serena). La cuota sumará el consumo conjunto de ambas."
                />
              )}
            />
          )}

          {/* Fila 3: Especie y Método de Extracción */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Autocomplete
              options={maestros.especies || []}
              getOptionLabel={(e) => e.nombre || `ID ${e.id}`}
              value={form.especie}
              onChange={(e, val) => setForm((p) => ({ ...p, especie: val }))}
              renderInput={(params) => (
                <TextField {...params} label="Especie Objetivo *" placeholder="Seleccione especie" />
              )}
            />

            <Autocomplete
              options={maestros.extraccionTipos || []}
              getOptionLabel={(et) => et.nombre || `ID ${et.id}`}
              value={form.extraccionTipo}
              onChange={(e, val) => setForm((p) => ({ ...p, extraccionTipo: val }))}
              renderInput={(params) => (
                <TextField {...params} label="Método de Extracción *" placeholder="Seleccione método" />
              )}
            />
          </Box>

          {/* Fila 4: Mes de Vigencia y Fechas Acotadas */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'), border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Mes de Vigencia (Periodo Mensual)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1.5fr 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label="Año"
                value={form.anioVigencia}
                onChange={(e) => handleCambioAnioMes(e.target.value, form.mesVigencia)}
              >
                {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Mes de Vigencia"
                value={form.mesVigencia}
                onChange={(e) => handleCambioAnioMes(form.anioVigencia, e.target.value)}
              >
                {MESES.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.nombre}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                label="Fecha Inicio *"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.fechaInicio}
                onChange={(e) => setForm((p) => ({ ...p, fechaInicio: e.target.value }))}
                helperText="Día 1 por defecto"
              />

              <TextField
                size="small"
                label="Fecha Fin *"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.fechaFin}
                onChange={(e) => setForm((p) => ({ ...p, fechaFin: e.target.value }))}
                helperText="Último día del mes"
              />
            </Box>
          </Box>

          {/* Fila 5: Cantidad en kg con equivalencia en toneladas */}
          <TextField
            label="Límite Oficial de Extracción (kg) *"
            type="number"
            inputProps={{ min: '1', step: '1000' }}
            value={form.limiteKg}
            onChange={(e) => setForm((p) => ({ ...p, limiteKg: e.target.value }))}
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            }}
            helperText={fmtTon(form.limiteKg)}
          />

          {/* Opciones Avanzadas en Acordeón Colapsable */}
          <Accordion elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <TuneIcon fontSize="small" color="action" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Opciones avanzadas
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  (Métrica: {form.metrica} · Humedad: {form.humedadEstado?.nombre || 'Sin conversión'} · Modo: {form.modoAccion} · Estado: {form.estado})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {/* Humedad de expresión */}
              <Autocomplete
                options={maestros.humedadEstados || []}
                getOptionLabel={(h) => h.nombre || h.estado || `ID ${h.id}`}
                value={form.humedadEstado}
                onChange={(e, val) => setForm((p) => ({ ...p, humedadEstado: val }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Expresado en Humedad (Opcional)"
                    placeholder="Sin conversión por defecto"
                    helperText="Aplica factor biológico si la cuota fue decretada en humedad distinta de fresco"
                  />
                )}
              />

              {/* Métrica y advertencia */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: form.metrica === 'DESEMBARQUE' ? 'warning.main' : 'divider',
                  bgcolor: (t) =>
                    form.metrica === 'DESEMBARQUE'
                      ? t.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.12)' : 'rgba(237, 108, 2, 0.08)'
                      : 'transparent',
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.metrica === 'DESEMBARQUE'}
                      onChange={(e) => {
                        const esDesembarque = e.target.checked;
                        setForm((p) => ({ ...p, metrica: esDesembarque ? 'DESEMBARQUE' : 'CAPTURA' }));
                      }}
                      color="warning"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: form.metrica === 'DESEMBARQUE' ? 'warning.main' : 'text.primary' }}>
                      Excepción normativa: La resolución técnica especifica descuento por desembarque físico
                    </Typography>
                  }
                />
                {form.metrica === 'DESEMBARQUE' && (
                  <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 1, fontSize: '0.82rem', py: 0.5 }}>
                    <strong>Advertencia Sernapesca:</strong> Sernapesca definió que las cuotas se descuentan obligatoriamente con captura biológica corregida. Use desembarque sólo si la resolución técnica lo indica expresamente.
                  </Alert>
                )}
              </Box>

              {/* Modo de acción ante exceso */}
              <TextField
                select
                label="Política de Acción ante Exceso"
                value={form.modoAccion}
                onChange={(e) => setForm((p) => ({ ...p, modoAccion: e.target.value }))}
                helperText="SOLO_ALERTA rotula con CUOTA_EXCEDIDA. BLOQUEO_DECLARACION rechaza la declaración en terreno (HTTP 422)."
              >
                <MenuItem value="SOLO_ALERTA">SOLO_ALERTA (Recomendado por evidencia histórica)</MenuItem>
                <MenuItem value="BLOQUEO_DECLARACION">BLOQUEO_DECLARACION (Bloqueo estricto)</MenuItem>
              </TextField>

              {/* Nº Resolución */}
              <TextField
                label={form.metrica === 'DESEMBARQUE' ? 'Nº Resolución / Decreto Subpesca *' : 'Nº Resolución / Decreto Subpesca (Opcional)'}
                placeholder="Ej. Res. Ex. Nº 142/2026"
                required={form.metrica === 'DESEMBARQUE'}
                value={form.resolucion}
                onChange={(e) => setForm((p) => ({ ...p, resolucion: e.target.value }))}
                helperText={
                  form.metrica === 'DESEMBARQUE'
                    ? 'Obligatorio por norma Sernapesca para cuotas en desembarque físico'
                    : 'Recomendado para trazabilidad jurídica'
                }
              />

              {/* Estado administrativo y switch activo */}
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <TextField
                  select
                  size="small"
                  label="Estado Administrativo"
                  value={form.estado}
                  onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
                  sx={{ width: 180 }}
                >
                  <MenuItem value="ABIERTA">ABIERTA</MenuItem>
                  <MenuItem value="CERRADA">CERRADA</MenuItem>
                </TextField>

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.activo}
                      onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                      color="secondary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Cuota Activa en Sistema</Typography>}
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleGuardar} variant="contained" color="secondary" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : form.id ? 'Guardar Cambios' : 'Crear Cuota'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmar Cierre */}
      <Dialog open={Boolean(cuotaPorCerrar)} onClose={() => setCuotaPorCerrar(null)} maxWidth="xs">
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Cerrar Cuota Administrativamente</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Confirmas el cierre administrativo de la cuota #{cuotaPorCerrar?.id} ({cuotaPorCerrar?.alcance})?
            Las declaraciones posteriores a este cierre quedarán registradas con la marca POSTERIOR_CIERRE.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCuotaPorCerrar(null)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleCerrarCuota} color="warning" variant="contained">
            Cerrar Cuota
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={Boolean(porEliminar)} onClose={() => setPorEliminar(null)} maxWidth="xs">
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Eliminar Cuota</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Estás seguro de que deseas eliminar permanentemente la cuota #{porEliminar?.id} ({porEliminar?.alcance})?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPorEliminar(null)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={eliminar} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
