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
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  Public as PublicIcon,
  Terrain as TerrainIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  Scale as ScaleIcon,
  Search as SearchIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Gavel as GavelIcon,
  InfoOutlined as InfoIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

const aInputDate = (v) => (v ? String(v).slice(0, 10) : '');

const fmtKg = (n) =>
  `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(n ?? 0)} kg`;

const FORM_VACIO = {
  id: null,
  perfil: 'RECOLECTOR',
  nivelAgregacion: 'COMUNA',
  esPlantilla: false,
  macrozona: null,
  region: null,
  provincia: null,
  comuna: null,
  amerb: null,
  usuario: null,
  especie: null,
  extraccionTipo: null,
  humedadEstado: null,
  metrica: 'CAPTURA',
  periodo: 'MENSUAL',
  limiteKg: 5000,
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFin: '',
  resolucion: '',
  estado: 'ABIERTA',
  activo: true,
};

export default function CuotasExtraccionMaestro() {
  const [cuotas, setCuotas] = useState([]);
  const [consumos, setConsumos] = useState({});
  const [maestros, setMaestros] = useState({
    macrozonas: [],
    regiones: [],
    provincias: [],
    comunas: [],
    especies: [],
    extraccionTipos: [],
    humedadEstados: [],
    amerbs: [],
    usuarios: [],
  });
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  // Filtros
  const [filtroNivel, setFiltroNivel] = useState('TODOS');
  const [filtroTexto, setFiltroTexto] = useState('');

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [porEliminar, setPorEliminar] = useState(null);
  const [cuotaPorCerrar, setCuotaPorCerrar] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const [cuotasRes, maestrosRes] = await Promise.all([
        api.get('/api/cuotas'),
        api.get('/api/cuotas/maestros'),
      ]);
      const listaCuotas = Array.isArray(cuotasRes.data) ? cuotasRes.data : [];
      setCuotas(listaCuotas);
      setMaestros(maestrosRes.data || {});

      // Cargar consumo en segundo plano para cada cuota
      cargarConsumos(listaCuotas);
    } catch (error) {
      console.error('Error cargando cuotas:', error);
      setMensaje({ type: 'error', text: 'Error al cargar las cuotas de extracción desde el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const cargarConsumos = async (lista) => {
    const mapa = {};
    for (const c of lista) {
      try {
        const { data } = await api.get(`/api/cuotas/${c.id}/consumo`);
        if (data) {
          mapa[c.id] = data;
        }
      } catch (e) {
        // Silencioso para cuotas antiguas o sin datos
      }
    }
    setConsumos(mapa);
  };

  const abrirNueva = () => {
    setForm({
      ...FORM_VACIO,
      macrozona: null,
      region: maestros.regiones?.[0] || null,
      especie: maestros.especies?.[0] || null,
      fechaInicio: new Date().toISOString().slice(0, 10),
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const abrirEditar = (c) => {
    setForm({
      id: c.id,
      perfil: c.perfil || 'RECOLECTOR',
      nivelAgregacion: c.nivelAgregacion || 'COMUNA',
      esPlantilla: Boolean(c.esPlantilla),
      macrozona: maestros.macrozonas?.find((m) => m.id === c.macrozona?.id) || c.macrozona || null,
      region: maestros.regiones?.find((r) => r.id === c.region?.id) || c.region || null,
      provincia: maestros.provincias?.find((p) => p.id === c.provincia?.id) || c.provincia || null,
      comuna: maestros.comunas?.find((com) => com.id === c.comuna?.id) || c.comuna || null,
      amerb: maestros.amerbs?.find((a) => a.id === c.amerb?.id) || c.amerb || null,
      usuario: maestros.usuarios?.find((u) => u.id === c.usuario?.id) || c.usuario || null,
      especie: maestros.especies?.find((e) => e.id === c.especie?.id) || c.especie || null,
      extraccionTipo: maestros.extraccionTipos?.find((et) => et.id === c.extraccionTipo?.id) || c.extraccionTipo || null,
      humedadEstado: maestros.humedadEstados?.find((h) => h.id === c.humedadEstado?.id) || c.humedadEstado || null,
      metrica: c.metrica || 'CAPTURA',
      periodo: c.periodo || 'MENSUAL',
      limiteKg: c.limiteKg != null ? Number(c.limiteKg) : 5000,
      fechaInicio: aInputDate(c.fechaInicio),
      fechaFin: aInputDate(c.fechaFin),
      resolucion: c.resolucion || '',
      estado: c.estado || 'ABIERTA',
      activo: c.activo ?? true,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const provinciasFiltradas = useMemo(() => {
    if (!form.region?.id) return maestros.provincias || [];
    return (maestros.provincias || []).filter((p) => p.region?.id === form.region.id || p.regionId === form.region.id);
  }, [maestros.provincias, form.region]);

  const comunasFiltradas = useMemo(() => {
    if (form.provincia?.id) {
      return (maestros.comunas || []).filter((c) => c.provincia?.id === form.provincia.id || c.provinciaId === form.provincia.id);
    }
    if (form.region?.id) {
      return (maestros.comunas || []).filter((c) => c.region?.id === form.region.id || c.regionId === form.region.id);
    }
    return maestros.comunas || [];
  }, [maestros.comunas, form.provincia, form.region]);

  const handleGuardar = async () => {
    const lim = parseFloat(form.limiteKg);
    if (isNaN(lim) || lim <= 0) {
      setFormError('El límite debe ser un número positivo en kilogramos.');
      return;
    }
    if (form.nivelAgregacion === 'MACROZONA' && !form.macrozona) {
      setFormError('Debe seleccionar una macrozona para el nivel MACROZONA.');
      return;
    }
    if (!form.fechaInicio) {
      setFormError('Debe ingresar la fecha de inicio de vigencia.');
      return;
    }
    if (form.fechaFin && form.fechaFin < form.fechaInicio) {
      setFormError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    if (form.metrica === 'DESEMBARQUE' && !form.resolucion?.trim()) {
      setFormError('Sernapesca definió que las cuotas se descuentan obligatoriamente con captura biológica corregida. La métrica DESEMBARQUE sólo se permite si la resolución técnica de Subpesca lo especifica expresamente (campo resolución obligatorio).');
      return;
    }

    const payload = {
      perfil: form.perfil,
      nivelAgregacion: form.nivelAgregacion,
      esPlantilla: form.esPlantilla,
      macrozona: form.nivelAgregacion === 'MACROZONA' && form.macrozona ? { id: form.macrozona.id } : null,
      region: form.nivelAgregacion !== 'MACROZONA' && form.region ? { id: form.region.id } : null,
      provincia: form.nivelAgregacion !== 'MACROZONA' && form.provincia ? { id: form.provincia.id } : null,
      comuna: form.nivelAgregacion !== 'MACROZONA' && form.comuna ? { id: form.comuna.id } : null,
      amerb: form.perfil === 'AREA' && form.amerb ? { id: form.amerb.id } : null,
      usuario: form.usuario ? { id: form.usuario.id } : null,
      especie: form.especie ? { id: form.especie.id } : null,
      extraccionTipo: form.extraccionTipo ? { id: form.extraccionTipo.id } : null,
      humedadEstado: form.humedadEstado ? { id: form.humedadEstado.id } : null,
      metrica: form.metrica,
      periodo: form.periodo,
      limiteKg: lim,
      fechaInicio: form.fechaInicio ? `${form.fechaInicio}T00:00:00.000Z` : null,
      fechaFin: form.fechaFin ? `${form.fechaFin}T23:59:59.000Z` : null,
      resolucion: form.resolucion?.trim() || null,
      estado: form.estado,
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
      await cargar();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'No se pudo guardar la cuota. Verifica los datos.';
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
      await cargar();
    } catch (error) {
      console.error('Error cerrando cuota:', error);
      setMensaje({ type: 'error', text: 'No se pudo cerrar administrativamente la cuota.' });
      setCuotaPorCerrar(null);
    }
  };

  const toggleActivo = async (c) => {
    try {
      await api.put(`/api/cuotas/${c.id}`, { ...c, activo: !c.activo });
      await cargar();
    } catch (error) {
      setMensaje({ type: 'error', text: 'No se pudo cambiar el estado de la cuota.' });
    }
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    try {
      await api.delete(`/api/cuotas/${porEliminar.id}`);
      setPorEliminar(null);
      setMensaje({ type: 'success', text: 'Cuota eliminada correctamente.' });
      setTimeout(() => setMensaje(null), 4000);
      await cargar();
    } catch {
      setPorEliminar(null);
      setMensaje({ type: 'error', text: 'No se pudo eliminar la cuota.' });
    }
  };

  const cuotasFiltradas = useMemo(() => {
    const txt = filtroTexto.trim().toLowerCase();
    return cuotas.filter((c) => {
      if (filtroNivel !== 'TODOS' && (c.nivelAgregacion || 'COMUNA') !== filtroNivel) return false;
      if (!txt) return true;
      const blob = [
        c.macrozona?.nombre,
        c.especie?.nombre,
        c.region?.nombre,
        c.provincia?.nombre,
        c.comuna?.nombre,
        c.perfil,
        c.periodo,
        c.resolucion,
        c.extraccionTipo?.nombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(txt);
    });
  }, [cuotas, filtroNivel, filtroTexto]);

  return (
    <Box>
      {/* Banner explicativo del Indicador 3 */}
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
              Indicador 3: Cuotas de Extracción y Control de Saldos
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', lineHeight: 1.6 }}>
            Define límites por <strong>Región</strong>, <strong>Provincia</strong> (Atacama), <strong>Comuna</strong> (Coquimbo) o <strong>Cuotas Plantilla Individuales</strong> (Antofagasta).
            El motor de fiscalización descuenta en <strong>captura biológica corregida</strong> (o desembarque si se indica), imputa a la comuna de inscripción del declarante e impide declaraciones fuera de plazo cuando la cuota ha sido <strong>CERRADA</strong>.
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
            value={filtroNivel}
            exclusive
            onChange={(e, v) => v && setFiltroNivel(v)}
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
            <ToggleButton value="TODOS">Todos los Niveles</ToggleButton>
            <ToggleButton value="MACROZONA">Macrozona</ToggleButton>
            <ToggleButton value="REGION">Región</ToggleButton>
            <ToggleButton value="PROVINCIA">Provincia</ToggleButton>
            <ToggleButton value="COMUNA">Comuna</ToggleButton>
            <ToggleButton value="INDIVIDUAL">Individual</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            size="small"
            placeholder="Buscar por especie, territorio, resolución…"
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
          Nueva Cuota
        </Button>
      </Box>

      {/* Tabla de cuotas */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Alcance Territorial / Nivel</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie / Método</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Perfil & Periodo</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Límite Oficial</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', minWidth: 160 }}>Consumo en Vivo</TableCell>
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
                      Cargando cuotas de extracción...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : cuotasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No se encontraron cuotas registradas.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cuotasFiltradas.map((c) => {
                  const dataConsumo = consumos[c.id];
                  const pctConsumido = dataConsumo ? Number(dataConsumo.pctConsumido || 0) : null;
                  const pctRestante = dataConsumo ? Number(dataConsumo.pctRestante || 100) : null;
                  const estaCerrada = (c.estado || '').toUpperCase() === 'CERRADA';

                  return (
                    <TableRow key={c.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            label={c.nivelAgregacion || 'COMUNA'}
                            size="small"
                            color={c.nivelAgregacion === 'MACROZONA' ? 'secondary' : c.esPlantilla ? 'warning' : 'primary'}
                            variant={c.esPlantilla ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                          {c.esPlantilla && (
                            <Chip label="Plantilla Individual" size="small" sx={{ fontSize: '0.65rem' }} />
                          )}
                          {c.macrozona?.esNacional && (
                            <Chip label="Nacional" size="small" color="secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }} />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.macrozona ? `Macrozona ${c.macrozona.nombre}` : (c.comuna?.nombre || c.provincia?.nombre || c.region?.nombre || 'Nacional')}
                        </Typography>
                        {c.provincia && c.comuna && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Prov: {c.provincia.nombre} | Reg: {c.region?.nombre}
                          </Typography>
                        )}
                        {c.resolucion && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {c.resolucion}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.especie?.nombre || 'Todas las especies'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Método: {c.extraccionTipo?.nombre || 'Todos'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip label={c.perfil || 'RECOLECTOR'} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.5 }} />
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          Periodo: {c.periodo}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                          {fmtKg(c.limiteKg)}
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
                          {c.humedadEstado ? ` (${c.humedadEstado.nombre || c.humedadEstado.estado})` : ''}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {dataConsumo ? (
                          <Box sx={{ width: '100%', maxWidth: 200 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {fmtKg(dataConsumo.consumidoKg)} ({pctConsumido}%)
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  color: pctRestante < 10 ? 'error.main' : pctRestante < 25 ? 'warning.main' : 'success.main',
                                }}
                              >
                                {pctRestante}% disp.
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, pctConsumido || 0)}
                              color={pctConsumido >= 100 ? 'error' : pctConsumido >= 80 ? 'warning' : 'primary'}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Calculando…</Typography>
                        )}
                      </TableCell>

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
                          {c.fechaCierre && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                              Cierre: {String(c.fechaCierre).slice(0, 10)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          {!estaCerrada && (
                            <Tooltip title="Cerrar Cuota Administrativamente">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => setCuotaPorCerrar(c)}
                              >
                                <LockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Editar Cuota">
                            <IconButton size="small" onClick={() => abrirEditar(c)} color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      {/* Dialog Formulario Ampliado */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          {form.id ? 'Editar Cuota de Extracción' : 'Nueva Cuota de Extracción'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {formError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          {/* Fila 1: Perfil y Agregación */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <TextField
              select
              label="Perfil *"
              value={form.perfil}
              onChange={(e) => setForm((p) => ({ ...p, perfil: e.target.value }))}
            >
              <MenuItem value="RECOLECTOR">RECOLECTOR (Orilla)</MenuItem>
              <MenuItem value="ARMADOR">ARMADOR (Embarcación)</MenuItem>
              <MenuItem value="AREA">AREA (Manejo AMERB)</MenuItem>
            </TextField>

            <TextField
              select
              label="Nivel de Agregación *"
              value={form.nivelAgregacion}
              onChange={(e) => setForm((p) => ({ ...p, nivelAgregacion: e.target.value }))}
              helperText="Determina la agrupación del consumo"
            >
              <MenuItem value="MACROZONA">MACROZONA (Multirregional / Nacional)</MenuItem>
              <MenuItem value="REGION">REGION (Global regional)</MenuItem>
              <MenuItem value="PROVINCIA">PROVINCIA (Ej. Atacama)</MenuItem>
              <MenuItem value="COMUNA">COMUNA (Ej. Coquimbo)</MenuItem>
              <MenuItem value="INDIVIDUAL">INDIVIDUAL (Nominado)</MenuItem>
            </TextField>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.esPlantilla}
                    onChange={(e) => setForm((p) => ({ ...p, esPlantilla: e.target.checked }))}
                    color="secondary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Cuota Plantilla</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Límite individual para cada pescador (Antofagasta)
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>

          {/* Fila 2: Alcance Territorial */}
          {form.nivelAgregacion === 'MACROZONA' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              <Autocomplete
                options={maestros.macrozonas || []}
                getOptionLabel={(m) => `${m.nombre || `ID ${m.id}`}${m.esNacional ? ' (Ámbito Nacional)' : ''}`}
                value={form.macrozona}
                onChange={(e, val) => setForm((p) => ({ ...p, macrozona: val }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Macrozona Asignada *"
                    placeholder="Seleccione macrozona o Nacional"
                    helperText="Aplica concurrentemente sobre todas las declaraciones de las regiones integrantes"
                  />
                )}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              <Autocomplete
                options={maestros.regiones || []}
                getOptionLabel={(r) => r.nombre || `ID ${r.id}`}
                value={form.region}
                onChange={(e, val) => setForm((p) => ({ ...p, region: val, provincia: null, comuna: null }))}
                renderInput={(params) => <TextField {...params} label="Región (opcional)" placeholder="Todas" />}
              />

              <Autocomplete
                options={provinciasFiltradas}
                getOptionLabel={(prov) => prov.nombre || `ID ${prov.id}`}
                value={form.provincia}
                onChange={(e, val) => setForm((p) => ({ ...p, provincia: val, comuna: null }))}
                renderInput={(params) => <TextField {...params} label="Provincia (opcional)" placeholder="Todas" />}
              />

              <Autocomplete
                options={comunasFiltradas}
                getOptionLabel={(c) => c.nombre || `ID ${c.id}`}
                value={form.comuna}
                onChange={(e, val) => setForm((p) => ({ ...p, comuna: val }))}
                renderInput={(params) => <TextField {...params} label="Comuna (opcional)" placeholder="Todas" />}
              />
            </Box>
          )}

          {/* Fila 3: Especie y Método */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Autocomplete
              options={maestros.especies || []}
              getOptionLabel={(e) => e.nombre || `ID ${e.id}`}
              value={form.especie}
              onChange={(e, val) => setForm((p) => ({ ...p, especie: val }))}
              renderInput={(params) => <TextField {...params} label="Especie Objetivo" placeholder="Todas las especies" />}
            />

            <Autocomplete
              options={maestros.extraccionTipos || []}
              getOptionLabel={(et) => et.nombre || `ID ${et.id}`}
              value={form.extraccionTipo}
              onChange={(e, val) => setForm((p) => ({ ...p, extraccionTipo: val }))}
              renderInput={(params) => <TextField {...params} label="Método de Extracción" placeholder="Todos los métodos" />}
            />
          </Box>

          {/* Fila 4: Límite, Humedad de Expresión y Métrica */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Límite en Kilogramos (kg) *"
              type="number"
              inputProps={{ min: '1', step: '100' }}
              value={form.limiteKg}
              onChange={(e) => setForm((p) => ({ ...p, limiteKg: e.target.value }))}
              InputProps={{
                endAdornment: <InputAdornment position="end">kg</InputAdornment>,
              }}
            />

            <Autocomplete
              options={maestros.humedadEstados || []}
              getOptionLabel={(h) => h.nombre || h.estado || `ID ${h.id}`}
              value={form.humedadEstado}
              onChange={(e, val) => setForm((p) => ({ ...p, humedadEstado: val }))}
              renderInput={(params) => (
                <TextField {...params} label="Expresado en Humedad" placeholder="Por defecto en métrica" />
              )}
            />

            <TextField
              label="Métrica de Descuento"
              value={form.metrica === 'DESEMBARQUE' ? 'DESEMBARQUE (Excepción)' : 'CAPTURA (Obligatoria)'}
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {form.metrica === 'DESEMBARQUE' ? (
                      <WarningIcon color="warning" sx={{ fontSize: 18 }} />
                    ) : (
                      <LockIcon color="action" sx={{ fontSize: 18 }} />
                    )}
                  </InputAdornment>
                ),
              }}
              helperText={form.metrica === 'DESEMBARQUE' ? 'Descuento en kg físicos' : 'Fija por norma Sernapesca'}
            />
          </Box>

          {/* Excepción de Métrica a Desembarque */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: (t) =>
                form.metrica === 'DESEMBARQUE'
                  ? t.palette.mode === 'dark'
                    ? 'rgba(237, 108, 2, 0.12)'
                    : 'rgba(237, 108, 2, 0.08)'
                  : t.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(0,0,0,0.02)',
              borderRadius: 2,
              border: 1,
              borderColor: form.metrica === 'DESEMBARQUE' ? 'warning.main' : 'divider',
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
                <strong>Advertencia Sernapesca:</strong> Sernapesca definió que las cuotas se descuentan obligatoriamente con captura biológica corregida. Use desembarque sólo si la resolución lo indica expresamente.
              </Alert>
            )}
          </Box>

          {/* Fila 5: Periodo y Vigencia */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <TextField
              select
              label="Período *"
              value={form.periodo}
              onChange={(e) => setForm((p) => ({ ...p, periodo: e.target.value }))}
            >
              <MenuItem value="DIARIO">DIARIO</MenuItem>
              <MenuItem value="MENSUAL">MENSUAL</MenuItem>
              <MenuItem value="ANUAL">ANUAL</MenuItem>
              <MenuItem value="BIANUAL">BIANUAL</MenuItem>
            </TextField>

            <TextField
              label="Vigencia Inicio *"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.fechaInicio}
              onChange={(e) => setForm((p) => ({ ...p, fechaInicio: e.target.value }))}
            />

            <TextField
              label="Vigencia Fin (Opcional)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.fechaFin}
              onChange={(e) => setForm((p) => ({ ...p, fechaFin: e.target.value }))}
            />
          </Box>

          <TextField
            label={form.metrica === 'DESEMBARQUE' ? "Nº Resolución / Decreto Subpesca *" : "Nº Resolución / Decreto Subpesca"}
            placeholder="Ej. Res. Ex. Nº 142/2024"
            required={form.metrica === 'DESEMBARQUE'}
            error={form.metrica === 'DESEMBARQUE' && !form.resolucion?.trim()}
            helperText={
              form.metrica === 'DESEMBARQUE' && !form.resolucion?.trim()
                ? "Obligatorio por norma Sernapesca para cuotas en desembarque físico"
                : form.metrica === 'DESEMBARQUE'
                ? "Resolución requerida que avala la excepción de desembarque físico"
                : "Recomendado para trazabilidad jurídica del límite"
            }
            value={form.resolucion}
            onChange={(e) => setForm((p) => ({ ...p, resolucion: e.target.value }))}
          />

          <Box sx={{ display: 'flex', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.activo}
                  onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                  color="secondary"
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Cuota Activa</Typography>}
            />
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleGuardar}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar Cuota'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmar Cierre Administrativo */}
      <Dialog
        open={Boolean(cuotaPorCerrar)}
        onClose={() => setCuotaPorCerrar(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          ¿Cerrar Cuota Administrativamente?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Al cerrar la cuota <strong>#{cuotaPorCerrar?.id}</strong> (
            {cuotaPorCerrar?.especie?.nombre || 'General'},{' '}
            {cuotaPorCerrar?.comuna?.nombre || cuotaPorCerrar?.region?.nombre}), cualquier declaración posterior a la fecha de cierre será marcada con la alerta crítica <strong>POSTERIOR_CIERRE</strong> o bloqueada según la política de fiscalización.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCuotaPorCerrar(null)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleCerrarCuota}
            startIcon={<LockIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Confirmar Cierre de Cuota
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
          ¿Eliminar Cuota de Extracción?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ¿Estás seguro de que deseas eliminar la cuota #{porEliminar?.id}? Esta acción no se puede deshacer.
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
