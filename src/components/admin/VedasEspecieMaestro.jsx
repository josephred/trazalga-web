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
  Autocomplete,
  Alert,
  CircularProgress,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  Block as BlockIcon,
  Schedule as ScheduleIcon,
  EventAvailable as EventAvailableIcon,
  Search as SearchIcon,
  Gavel as GavelIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

const NOMBRES_MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const aFechaLocal = (v) => {
  if (!v) return null;
  const s = String(v).slice(0, 10);
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const hoyLocal = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

const estadoDe = (v) => {
  const hoy = hoyLocal();
  const mesActual = hoy.getMonth() + 1;

  if (Boolean(v.recurrenciaAnual)) {
    if (!v.mesesVeda) return 'EXPIRADA';
    const meses = v.mesesVeda.split(',').map((m) => parseInt(m.trim())).filter(Boolean);
    return meses.includes(mesActual) ? 'VIGENTE' : 'PROGRAMADA';
  }

  const ini = aFechaLocal(v.fechaInicio);
  const fin = aFechaLocal(v.fechaFin);
  if (!ini || !fin) return 'EXPIRADA';
  if (fin < hoy) return 'EXPIRADA';
  if (ini > hoy) return 'PROGRAMADA';
  return 'VIGENTE';
};

const fmtFecha = (v) => {
  const f = aFechaLocal(v);
  return f
    ? f.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
};

const aInputDate = (v) => (v ? String(v).slice(0, 10) : '');

const FORM_VACIO = {
  id: null,
  especie: null,
  region: null,
  extraccionTipo: null,
  tipoPeriodo: 'RECURRENTE', // 'RECURRENTE' o 'FECHAS'
  recurrenciaAnual: true,
  mesesVeda: '1,2,4,5,6,7,8,10,11', // Caso huiro negro: 9 meses vedado, habilitado en Mar(3), Sep(9), Dic(12)
  fechaInicio: '',
  fechaFin: '',
  resolucion: '',
  observacion: '',
  activo: true,
};

export default function VedasEspecieMaestro() {
  const [vedas, setVedas] = useState([]);
  const [maestros, setMaestros] = useState({ especies: [], regiones: [], extraccionTipos: [] });
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [filtroTexto, setFiltroTexto] = useState('');

  // Dialog crear/editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [porEliminar, setPorEliminar] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const [vedasRes, maestrosRes] = await Promise.all([
        api.get('/api/vedas'),
        api.get('/api/vedas/maestros'),
      ]);
      setVedas(Array.isArray(vedasRes.data) ? vedasRes.data : []);
      setMaestros(maestrosRes.data || { especies: [], regiones: [], extraccionTipos: [] });
    } catch (error) {
      console.error('Error cargando vedas:', error);
      setMensaje({ type: 'error', text: 'Error al cargar las vedas de especies.' });
    } finally {
      setLoading(false);
    }
  };

  const mesesArray = useMemo(() => {
    if (!form.mesesVeda) return [];
    return form.mesesVeda
      .split(',')
      .map((m) => parseInt(m.trim()))
      .filter((m) => !isNaN(m) && m >= 1 && m <= 12);
  }, [form.mesesVeda]);

  const toggleMes = (mesNum) => {
    let nuevos;
    if (mesesArray.includes(mesNum)) {
      nuevos = mesesArray.filter((m) => m !== mesNum);
    } else {
      nuevos = [...mesesArray, mesNum].sort((a, b) => a - b);
    }
    setForm((p) => ({ ...p, mesesVeda: nuevos.join(',') }));
  };

  const seleccionarTodosLosMeses = () => {
    setForm((p) => ({ ...p, mesesVeda: '1,2,3,4,5,6,7,8,9,10,11,12' }));
  };

  const limpiarMeses = () => {
    setForm((p) => ({ ...p, mesesVeda: '' }));
  };

  const abrirNueva = () => {
    setForm({
      ...FORM_VACIO,
      especie: maestros.especies?.[0] || null,
      region: null,
      extraccionTipo: null,
      tipoPeriodo: 'RECURRENTE',
      recurrenciaAnual: true,
      mesesVeda: '1,2,4,5,6,7,8,10,11',
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const abrirEdicion = (v) => {
    const esRecurrente = Boolean(v.recurrenciaAnual);
    setForm({
      id: v.id,
      especie: maestros.especies?.find((e) => e.id === v.especie?.id) || v.especie || null,
      region: maestros.regiones?.find((r) => r.id === v.region?.id) || v.region || null,
      extraccionTipo: maestros.extraccionTipos?.find((et) => et.id === v.extraccionTipo?.id) || v.extraccionTipo || null,
      tipoPeriodo: esRecurrente ? 'RECURRENTE' : 'FECHAS',
      recurrenciaAnual: esRecurrente,
      mesesVeda: v.mesesVeda || '',
      fechaInicio: aInputDate(v.fechaInicio),
      fechaFin: aInputDate(v.fechaFin),
      resolucion: v.resolucion || '',
      observacion: v.observacion || '',
      activo: v.activo ?? true,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const guardar = async () => {
    setFormError(null);
    if (!form.especie?.id) {
      setFormError('Debe seleccionar la especie afectada por la veda.');
      return;
    }

    const esRecurrente = form.tipoPeriodo === 'RECURRENTE';

    if (esRecurrente) {
      if (!form.mesesVeda || !form.mesesVeda.trim()) {
        setFormError('Debe seleccionar al menos un mes en veda para la recurrencia anual.');
        return;
      }
    } else {
      if (!form.fechaInicio || !form.fechaFin) {
        setFormError('Indique la fecha de inicio y de término de la veda.');
        return;
      }
      if (form.fechaInicio > form.fechaFin) {
        setFormError('La fecha de inicio de la veda no puede ser posterior a la fecha de término.');
        return;
      }
    }

    const payload = {
      especie: { id: form.especie.id },
      region: form.region ? { id: form.region.id } : null,
      extraccionTipo: form.extraccionTipo ? { id: form.extraccionTipo.id } : null,
      recurrenciaAnual: esRecurrente,
      mesesVeda: esRecurrente ? form.mesesVeda : null,
      fechaInicio: !esRecurrente && form.fechaInicio ? `${form.fechaInicio}T00:00:00.000Z` : null,
      fechaFin: !esRecurrente && form.fechaFin ? `${form.fechaFin}T23:59:59.000Z` : null,
      resolucion: form.resolucion?.trim() || null,
      observacion: form.observacion?.trim() || null,
      activo: Boolean(form.activo),
    };

    try {
      setSaving(true);
      if (form.id) {
        await api.put(`/api/vedas/${form.id}`, payload);
      } else {
        await api.post('/api/vedas', payload);
      }
      setDialogOpen(false);
      setMensaje({ type: 'success', text: `Veda ${form.id ? 'actualizada' : 'creada'} correctamente.` });
      setTimeout(() => setMensaje(null), 4000);
      await cargar();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'No se pudo guardar la veda. Verifica los datos.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    try {
      await api.delete(`/api/vedas/${porEliminar.id}`);
      setPorEliminar(null);
      setMensaje({ type: 'success', text: 'Veda eliminada correctamente.' });
      setTimeout(() => setMensaje(null), 4000);
      await cargar();
    } catch {
      setPorEliminar(null);
      setMensaje({ type: 'error', text: 'No se pudo eliminar la veda.' });
    }
  };

  const vedasFiltradas = useMemo(() => {
    const txt = filtroTexto.trim().toLowerCase();
    return vedas.filter((v) => {
      if (filtroEstado !== 'TODAS' && estadoDe(v) !== filtroEstado) return false;
      if (!txt) return true;
      const blob = [
        v.especie?.nombre,
        v.region?.nombre,
        v.extraccionTipo?.nombre,
        v.resolucion,
        v.observacion,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(txt);
    });
  }, [vedas, filtroEstado, filtroTexto]);

  return (
    <Box>
      {/* Banner explicativo del Indicador 5 */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(234, 179, 8, 0.03) 100%)',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <BlockIcon color="error" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
              Indicador 5: Control de Vedas de Especies y Métodos
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', lineHeight: 1.6 }}>
            Configura vedas biológicas obligatorias cruzando <strong>Especie</strong>, <strong>Región</strong> y <strong>Método de Extracción</strong> (barreteado, varado, buceo).
            Soporta <strong>Recurrencia Anual</strong> con máscara de meses (ej. huiro negro habilitado únicamente en marzo, septiembre y diciembre) o <strong>Rango de Fechas</strong> extraordinarias.
            El motor evalúa contra la <strong>fecha de extracción declarada</strong> y bloquea (HTTP 422) o alerta según la política parametrizada.
          </Typography>
        </CardContent>
      </Card>

      {/* Alertas */}
      {mensaje && (
        <Alert severity={mensaje.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMensaje(null)}>
          {mensaje.text}
        </Alert>
      )}

      {/* Barra de herramientas */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={filtroEstado}
            exclusive
            onChange={(e, v) => v && setFiltroEstado(v)}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                fontFamily: 'Inter',
                fontWeight: 600,
                px: 2,
              },
            }}
          >
            <ToggleButton value="TODAS">Todas</ToggleButton>
            <ToggleButton value="VIGENTE">Vigentes</ToggleButton>
            <ToggleButton value="PROGRAMADA">Programadas</ToggleButton>
            <ToggleButton value="EXPIRADA">Expiradas</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            size="small"
            placeholder="Buscar por especie, método, resolución…"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: 260, sm: 320 } }}
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
          Nueva Veda
        </Button>
      </Box>

      {/* Tabla de vedas */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Método de Extracción</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Región</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Tipo de Periodo / Calendario</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Estado Actual</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Resolución</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} color="secondary" />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      Cargando vedas de especies...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : vedasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No se encontraron vedas configuradas.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vedasFiltradas.map((v) => {
                  const est = estadoDe(v);
                  const esRecurrente = Boolean(v.recurrenciaAnual);
                  const meses = esRecurrente && v.mesesVeda
                    ? v.mesesVeda.split(',').map((m) => parseInt(m.trim())).filter(Boolean)
                    : [];

                  return (
                    <TableRow key={v.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {v.especie?.nombre || 'Todas las especies'}
                      </TableCell>

                      <TableCell>
                        {v.extraccionTipo ? (
                          <Chip label={v.extraccionTipo.nombre} size="small" color="primary" variant="outlined" />
                        ) : (
                          <Chip label="Todos los métodos" size="small" sx={{ opacity: 0.7 }} />
                        )}
                      </TableCell>

                      <TableCell>
                        {v.region?.nombre || <Typography variant="caption" sx={{ color: 'text.secondary' }}>Todas las regiones</Typography>}
                      </TableCell>

                      <TableCell>
                        {esRecurrente ? (
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                                Recurrencia Anual ({meses.length} meses vedados):
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap', maxWidth: 280 }}>
                              {NOMBRES_MESES.map((nombreMes, idx) => {
                                const mesNum = idx + 1;
                                const enVeda = meses.includes(mesNum);
                                return (
                                  <Box
                                    key={nombreMes}
                                    sx={{
                                      fontSize: '0.65rem',
                                      px: 0.6,
                                      py: 0.2,
                                      borderRadius: 1,
                                      bgcolor: enVeda ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                      color: enVeda ? 'error.main' : 'success.main',
                                      fontWeight: 700,
                                      border: 1,
                                      borderColor: enVeda ? 'error.light' : 'success.light',
                                    }}
                                  >
                                    {nombreMes}
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2">
                            {fmtFecha(v.fechaInicio)} — {fmtFecha(v.fechaFin)}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={
                            est === 'VIGENTE' ? <BlockIcon sx={{ fontSize: 14 }} /> :
                            est === 'PROGRAMADA' ? <ScheduleIcon sx={{ fontSize: 14 }} /> :
                            <EventAvailableIcon sx={{ fontSize: 14 }} />
                          }
                          label={est}
                          size="small"
                          color={est === 'VIGENTE' ? 'error' : est === 'PROGRAMADA' ? 'warning' : 'default'}
                          variant={est === 'VIGENTE' ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                        />
                      </TableCell>

                      <TableCell>
                        {v.resolucion ? (
                          <Tooltip title={v.observacion || v.resolucion}>
                            <Typography variant="body2" sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {v.resolucion}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="Editar Veda">
                            <IconButton size="small" onClick={() => abrirEdicion(v)} color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar Veda">
                            <IconButton
                              size="small"
                              onClick={() => setPorEliminar(v)}
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

      {/* Dialog Formulario Ampliado */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          {form.id ? 'Editar Veda de Especie' : 'Nueva Veda de Especie'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {formError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          {/* Especie, Método y Región */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <Autocomplete
              options={maestros.especies || []}
              getOptionLabel={(e) => e.nombre || `ID ${e.id}`}
              value={form.especie}
              onChange={(e, val) => setForm((p) => ({ ...p, especie: val }))}
              renderInput={(params) => <TextField {...params} label="Especie *" placeholder="Seleccione especie" />}
            />

            <Autocomplete
              options={maestros.extraccionTipos || []}
              getOptionLabel={(et) => et.nombre || `ID ${et.id}`}
              value={form.extraccionTipo}
              onChange={(e, val) => setForm((p) => ({ ...p, extraccionTipo: val }))}
              renderInput={(params) => <TextField {...params} label="Método Extracción" placeholder="Todos los métodos" />}
            />

            <Autocomplete
              options={maestros.regiones || []}
              getOptionLabel={(r) => r.nombre || `ID ${r.id}`}
              value={form.region}
              onChange={(e, val) => setForm((p) => ({ ...p, region: val }))}
              renderInput={(params) => <TextField {...params} label="Región" placeholder="Todas las regiones" />}
            />
          </Box>

          {/* Tipo de Periodo */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1 }}>
                Tipo de Periodo de Veda:
              </FormLabel>
              <RadioGroup
                row
                value={form.tipoPeriodo}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((p) => ({
                    ...p,
                    tipoPeriodo: val,
                    recurrenciaAnual: val === 'RECURRENTE',
                  }));
                }}
              >
                <FormControlLabel
                  value="RECURRENTE"
                  control={<Radio color="secondary" />}
                  label="Anual Recurrente (se repite todos los años sin recarga)"
                />
                <FormControlLabel
                  value="FECHAS"
                  control={<Radio color="primary" />}
                  label="Por Rango de Fechas (fechas puntuales/extraordinarias)"
                />
              </RadioGroup>
            </FormControl>

            {form.tipoPeriodo === 'RECURRENTE' ? (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Selecciona los meses en que la especie está <strong>EN VEDA</strong>:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={seleccionarTodosLosMeses} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                      Todos
                    </Button>
                    <Button size="small" onClick={limpiarMeses} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                      Ninguno
                    </Button>
                  </Box>
                </Box>

                {/* 12 botones de meses interactivos */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
                  {NOMBRES_MESES.map((nombreMes, idx) => {
                    const mesNum = idx + 1;
                    const enVeda = mesesArray.includes(mesNum);
                    return (
                      <Button
                        key={nombreMes}
                        variant={enVeda ? 'contained' : 'outlined'}
                        color={enVeda ? 'error' : 'inherit'}
                        onClick={() => toggleMes(mesNum)}
                        sx={{
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          borderRadius: 2,
                        }}
                      >
                        {nombreMes}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
                <TextField
                  label="Fecha de Inicio *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.fechaInicio}
                  onChange={(e) => setForm((p) => ({ ...p, fechaInicio: e.target.value }))}
                />
                <TextField
                  label="Fecha de Término *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.fechaFin}
                  onChange={(e) => setForm((p) => ({ ...p, fechaFin: e.target.value }))}
                />
              </Box>
            )}
          </Box>

          {/* Vista Previa del Calendario Anual */}
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase' }}>
              Vista Previa del Calendario Anual (Impacto en Fiscalización):
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 0.5, textAlign: 'center' }}>
              {NOMBRES_MESES.map((nombreMes, idx) => {
                const mesNum = idx + 1;
                let enVeda = false;
                if (form.tipoPeriodo === 'RECURRENTE') {
                  enVeda = mesesArray.includes(mesNum);
                } else if (form.fechaInicio && form.fechaFin) {
                  const y = new Date().getFullYear();
                  const inicioMes = new Date(y, idx, 1);
                  const finMes = new Date(y, idx + 1, 0);
                  const fIni = aFechaLocal(form.fechaInicio);
                  const fFin = aFechaLocal(form.fechaFin);
                  if (fIni && fFin && fIni <= finMes && fFin >= inicioMes) {
                    enVeda = true;
                  }
                }

                return (
                  <Box
                    key={nombreMes}
                    sx={{
                      p: 0.8,
                      borderRadius: 1.5,
                      bgcolor: enVeda ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: enVeda ? 'error.main' : 'success.main',
                      border: 1,
                      borderColor: enVeda ? 'error.light' : 'success.light',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', fontSize: '0.7rem' }}>
                      {nombreMes}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 700 }}>
                      {enVeda ? 'VEDADO' : 'LIBRE'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          <TextField
            label="Nº Resolución / Decreto Subpesca"
            placeholder="Ej. Res. Ex. Subpesca Nº 321/2024"
            value={form.resolucion}
            onChange={(e) => setForm((p) => ({ ...p, resolucion: e.target.value }))}
          />

          <TextField
            label="Observaciones (Opcional)"
            multiline
            rows={2}
            value={form.observacion}
            onChange={(e) => setForm((p) => ({ ...p, observacion: e.target.value }))}
            placeholder="Fundamentos biológicos, excepciones para ciertas caletas o notas de fiscalización."
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.activo}
                onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                color="secondary"
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Veda Activa en el Servidor</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={guardar}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar Veda'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmar Eliminación */}
      <Dialog
        open={Boolean(porEliminar)}
        onClose={() => setPorEliminar(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          ¿Eliminar Veda de Especie?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ¿Estás seguro de que deseas eliminar la veda para <strong>{porEliminar?.especie?.nombre}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPorEliminar(null)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={eliminar}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
