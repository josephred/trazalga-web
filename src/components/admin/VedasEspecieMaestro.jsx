import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
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
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

/*
 * Mantenedor de Vedas de Especies.
 *
 * Una veda prohíbe la extracción de una especie durante un rango de fechas,
 * en una región específica o en todas (región vacía). El estado se calcula
 * contra la fecha actual: VIGENTE (en curso), PROGRAMADA (aún no comienza)
 * o EXPIRADA (ya terminó). El backend valida especie y coherencia del rango.
 */

const ESTADOS = {
  VIGENTE: { label: 'Vigente', color: 'error.main', icon: <BlockIcon sx={{ fontSize: 16 }} /> },
  PROGRAMADA: { label: 'Programada', color: 'warning.main', icon: <ScheduleIcon sx={{ fontSize: 16 }} /> },
  EXPIRADA: { label: 'Expirada', color: 'text.secondary', icon: <EventAvailableIcon sx={{ fontSize: 16 }} /> },
};

/** Normaliza "yyyy-MM-dd" (o ISO) a Date local a medianoche, sin corrimiento de zona horaria. */
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

const duracionDias = (v) => {
  const ini = aFechaLocal(v.fechaInicio);
  const fin = aFechaLocal(v.fechaFin);
  if (!ini || !fin) return null;
  return Math.round((fin - ini) / 86400000) + 1;
};

/** Date → "yyyy-MM-dd" para inputs type=date. */
const aInputDate = (v) => (v ? String(v).slice(0, 10) : '');

const FORM_VACIO = {
  id: null,
  especie: null,
  region: null,
  fechaInicio: '',
  fechaFin: '',
  resolucion: '',
  observacion: '',
};

export default function VedasEspecieMaestro() {
  const [vedas, setVedas] = useState([]);
  const [maestros, setMaestros] = useState({ especies: [], regiones: [] });
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

  // Confirmación de borrado
  const [porEliminar, setPorEliminar] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const [vedasRes, maestrosRes] = await Promise.all([
        api.get('/vedas'),
        api.get('/vedas/maestros'),
      ]);
      setVedas(vedasRes.data || []);
      setMaestros(maestrosRes.data || { especies: [], regiones: [] });
    } catch (error) {
      console.error('Error cargando vedas', error);
      setMensaje({ type: 'error', text: 'Error al cargar las vedas de especies. Verifica el backend.' });
    } finally {
      setLoading(false);
    }
  };

  const vedasFiltradas = useMemo(() => {
    const txt = filtroTexto.trim().toLowerCase();
    return [...vedas]
      .sort((a, b) => (aFechaLocal(b.fechaInicio) ?? 0) - (aFechaLocal(a.fechaInicio) ?? 0))
      .filter((v) => {
        if (filtroEstado !== 'TODAS' && estadoDe(v) !== filtroEstado) return false;
        if (!txt) return true;
        const blob = [v.especie?.nombre, v.region?.nombre, v.resolucion, v.observacion]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(txt);
      });
  }, [vedas, filtroEstado, filtroTexto]);

  const resumen = useMemo(() => {
    const conteo = { VIGENTE: 0, PROGRAMADA: 0, EXPIRADA: 0 };
    vedas.forEach((v) => (conteo[estadoDe(v)] += 1));
    return conteo;
  }, [vedas]);

  const errorFechas = useMemo(() => {
    if (!form.fechaInicio || !form.fechaFin) return null;
    return form.fechaInicio > form.fechaFin
      ? 'La fecha de inicio no puede ser posterior a la fecha de término.'
      : null;
  }, [form.fechaInicio, form.fechaFin]);

  /* ------------------------------- Acciones ------------------------------- */

  const abrirNueva = () => {
    setForm(FORM_VACIO);
    setFormError(null);
    setDialogOpen(true);
  };

  const abrirEdicion = (v) => {
    setForm({
      id: v.id,
      especie: v.especie ? { id: v.especie.id, nombre: v.especie.nombre } : null,
      region: v.region ? { id: v.region.id, nombre: v.region.nombre } : null,
      fechaInicio: aInputDate(v.fechaInicio),
      fechaFin: aInputDate(v.fechaFin),
      resolucion: v.resolucion || '',
      observacion: v.observacion || '',
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const guardar = async () => {
    setFormError(null);
    if (!form.especie) {
      setFormError('Selecciona la especie afectada por la veda.');
      return;
    }
    if (!form.fechaInicio || !form.fechaFin) {
      setFormError('Indica la fecha de inicio y la fecha de término de la veda.');
      return;
    }
    if (errorFechas) {
      setFormError(errorFechas);
      return;
    }

    const payload = {
      especie: { id: form.especie.id },
      region: form.region ? { id: form.region.id } : null,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      resolucion: form.resolucion.trim() || null,
      observacion: form.observacion.trim() || null,
    };

    try {
      setSaving(true);
      if (form.id) {
        await api.put(`/vedas/${form.id}`, payload);
      } else {
        await api.post('/vedas', payload);
      }
      setDialogOpen(false);
      setMensaje({ type: 'success', text: `Veda ${form.id ? 'actualizada' : 'creada'} correctamente.` });
      setTimeout(() => setMensaje(null), 4000);
      await cargar();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'No se pudo guardar la veda. Verifica los datos y la conexión con el backend.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    try {
      await api.delete(`/vedas/${porEliminar.id}`);
      setPorEliminar(null);
      setMensaje({ type: 'success', text: 'Veda eliminada correctamente.' });
      setTimeout(() => setMensaje(null), 4000);
      await cargar();
    } catch {
      setPorEliminar(null);
      setMensaje({ type: 'error', text: 'No se pudo eliminar la veda.' });
    }
  };

  /* ------------------------------- Render ------------------------------- */

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      {mensaje && (
        <Alert severity={mensaje.type} sx={{ mb: 3, borderRadius: 3, fontFamily: 'Inter' }}>
          {mensaje.text}
        </Alert>
      )}

      {/* Cabecera del mantenedor */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: 1, borderColor: 'divider',
          bgcolor: 'background.paper',
          p: { xs: 2.5, md: 3 },
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <BlockIcon sx={{ color: 'error.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
              Vedas de Especies
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', maxWidth: 680, lineHeight: 1.6 }}>
            Configura los periodos de prohibición de extracción por especie, a nivel nacional o por región,
            con su resolución oficial. Las declaraciones dentro del periodo de veda generan alertas
            y aparecen en el reporte de extracción en veda.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, flexWrap: 'wrap' }}>
          {/* Mini KPIs de estado */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {Object.entries(ESTADOS).map(([k, meta]) => (
              <Tooltip key={k} title={`Vedas ${meta.label.toLowerCase()}s`}>
                <Chip
                  size="small"
                  icon={meta.icon}
                  label={`${resumen[k]} ${meta.label}`}
                  sx={{
                    bgcolor: `${meta.color}15`,
                    color: meta.color,
                    fontWeight: 700,
                    fontFamily: 'Inter',
                    '& .MuiChip-icon': { color: meta.color },
                  }}
                />
              </Tooltip>
            ))}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={abrirNueva}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.light' },
              boxShadow: 'none',
              borderRadius: 2.5,
              px: 3,
              py: 1.25,
              fontFamily: 'Outfit',
              whiteSpace: 'nowrap',
            }}
          >
            Nueva Veda
          </Button>
        </Box>
      </Card>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
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
              border: 1, borderColor: 'divider',
              color: 'text.secondary',
              '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.light' } },
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
          placeholder="Buscar por especie, región, resolución…"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', ml: 'auto' }}>
          {vedasFiltradas.length} veda(s)
        </Typography>
      </Box>

      {/* Tabla de vedas */}
      <TableContainer
        component={Card}
        elevation={0}
        sx={{ borderRadius: 4, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'background.default' }}>
              {['Estado', 'Especie', 'Región', 'Inicio', 'Término', 'Duración', 'Resolución', ''].map((h) => (
                <TableCell
                  key={h}
                  sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.4 }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {vedasFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: 'text.disabled', fontFamily: 'Inter' }}>
                  No hay vedas configuradas{filtroEstado !== 'TODAS' || filtroTexto ? ' con los filtros actuales' : ''}.
                  Crea la primera con «Nueva Veda».
                </TableCell>
              </TableRow>
            )}
            {vedasFiltradas.map((v) => {
              const est = estadoDe(v);
              const meta = ESTADOS[est];
              const dias = duracionDias(v);
              return (
                <TableRow key={v.id} hover sx={{ opacity: est === 'EXPIRADA' ? 0.6 : 1 }}>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={meta.icon}
                      label={meta.label}
                      sx={{
                        bgcolor: `${meta.color}15`,
                        color: meta.color,
                        fontWeight: 700,
                        fontFamily: 'Inter',
                        '& .MuiChip-icon': { color: meta.color },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Inter', fontWeight: 600, color: 'text.primary' }}>
                    {v.especie?.nombre || '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Inter', color: 'text.primary' }}>
                    {v.region?.nombre || <em style={{ color: 'text.disabled' }}>Todas</em>}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Inter', color: 'text.primary', whiteSpace: 'nowrap' }}>
                    {fmtFecha(v.fechaInicio)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Inter', color: 'text.primary', whiteSpace: 'nowrap' }}>
                    {fmtFecha(v.fechaFin)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Inter', color: 'text.primary' }}>
                    {dias != null ? `${dias} día(s)` : '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Inter', color: 'text.primary' }}>
                    {v.resolucion ? (
                      <Tooltip title={v.observacion || ''}>
                        <Chip
                          size="small"
                          variant="outlined"
                          icon={<GavelIcon sx={{ fontSize: 14 }} />}
                          label={v.resolucion}
                          sx={{ fontFamily: 'Inter', fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => abrirEdicion(v)}>
                        <EditIcon sx={{ fontSize: 19 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => setPorEliminar(v)}>
                        <DeleteOutlineIcon sx={{ fontSize: 19 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog crear / editar */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          {form.id ? 'Editar Veda' : 'Nueva Veda'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
            <Autocomplete
              options={maestros.especies}
              getOptionLabel={(o) => o.nombre || ''}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              value={form.especie}
              onChange={(e, v) => setForm((f) => ({ ...f, especie: v }))}
              renderInput={(params) => <TextField {...params} label="Especie *" />}
            />

            <Autocomplete
              options={maestros.regiones}
              getOptionLabel={(o) => o.nombre || ''}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              value={form.region}
              onChange={(e, v) => setForm((f) => ({ ...f, region: v }))}
              renderInput={(params) => (
                <TextField {...params} label="Región" helperText="Vacío = la veda aplica en todas las regiones." />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Fecha inicio *"
                type="date"
                value={form.fechaInicio}
                onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                error={!!errorFechas}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Fecha término *"
                type="date"
                value={form.fechaFin}
                onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                error={!!errorFechas}
                helperText={errorFechas || undefined}
                sx={{ flex: 1 }}
              />
            </Box>

            <TextField
              label="Resolución"
              value={form.resolucion}
              onChange={(e) => setForm((f) => ({ ...f, resolucion: e.target.value }))}
              placeholder="Ej. Res. Ex. N° 1234-2026 Subpesca"
              helperText="Número de la resolución o decreto que establece la veda (opcional)."
            />

            <TextField
              label="Observación"
              value={form.observacion}
              onChange={(e) => setForm((f) => ({ ...f, observacion: e.target.value }))}
              multiline
              rows={3}
              placeholder="Notas internas: motivo, alcance, excepciones…"
            />

            {formError && (
              <Alert severity="error" sx={{ borderRadius: 2.5, fontFamily: 'Inter' }}>
                {formError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ fontFamily: 'Outfit', color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={guardar}
            disabled={saving || !!errorFechas}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.light' }, boxShadow: 'none', borderRadius: 2.5, px: 3, fontFamily: 'Outfit' }}
          >
            {saving ? 'Guardando…' : 'Guardar Veda'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog open={!!porEliminar} onClose={() => setPorEliminar(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Eliminar veda</DialogTitle>
        <DialogContent>
          {porEliminar && (
            <Typography variant="body2" sx={{ fontFamily: 'Inter', color: 'text.primary' }}>
              ¿Eliminar la veda de <b>{porEliminar.especie?.nombre}</b> (
              {porEliminar.region?.nombre || 'todas las regiones'}, {fmtFecha(porEliminar.fechaInicio)} —{' '}
              {fmtFecha(porEliminar.fechaFin)})? Esta acción no se puede deshacer y las declaraciones en ese
              periodo dejarán de marcarse como extracción en veda.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setPorEliminar(null)} sx={{ fontFamily: 'Outfit', color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={eliminar} sx={{ boxShadow: 'none', borderRadius: 2.5, fontFamily: 'Outfit' }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
