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
  AccountTree as AccountTreeIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

/*
 * Mantenedor de Cuotas de Extracción.
 *
 * Alcances (del más específico al más general): USUARIO > ÁREA DE MANEJO > REGIÓN > GLOBAL.
 * Regla jerárquica (la valida también el backend al guardar):
 *   cuota de usuario ≤ cuota del área de manejo (si existe) ≤ cuota de la región (si existe),
 * comparando cuotas del mismo periodo y especie compatible (sin especie = todas).
 */

const ALCANCES = {
  REGION: { label: 'Región', color: '#0ea5e9', icon: <PublicIcon sx={{ fontSize: 18 }} /> },
  AREA: { label: 'Área de Manejo', color: '#ec4899', icon: <TerrainIcon sx={{ fontSize: 18 }} /> },
  USUARIO: { label: 'Usuario', color: '#f59e0b', icon: <PersonIcon sx={{ fontSize: 18 }} /> },
  GLOBAL: { label: 'Global', color: '#64748b', icon: <LanguageIcon sx={{ fontSize: 18 }} /> },
};

const PERFILES = ['RECOLECTOR', 'ARMADOR', 'AREA'];
const PERIODOS = ['DIARIO', 'MENSUAL'];

const alcanceDe = (c) => {
  if (c.usuario) return 'USUARIO';
  if (c.amerb) return 'AREA';
  if (c.region) return 'REGION';
  return 'GLOBAL';
};

const nombreUsuario = (u) =>
  u ? `${u.nombres || u.nombre || ''} ${u.apellidop || ''}`.trim() || `Usuario ${u.id}` : '';

const nombreRegionDe = (c) => c.region?.nombre || c.amerb?.region || null;

const describirAlcance = (c) => {
  const tipo = alcanceDe(c);
  if (tipo === 'USUARIO') return nombreUsuario(c.usuario);
  if (tipo === 'AREA') return c.amerb?.nombre || `AMERB ${c.amerb?.id}`;
  if (tipo === 'REGION') return c.region?.nombre || `Región ${c.region?.id}`;
  return 'Todas las regiones';
};

const fmtKg = (n) =>
  `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(n ?? 0)} kg`;

const FORM_VACIO = {
  id: null,
  alcance: 'REGION',
  region: null,
  amerb: null,
  usuario: null,
  especie: null,
  perfil: 'RECOLECTOR',
  periodo: 'DIARIO',
  limiteKg: '',
  activo: true,
};

export default function CuotasExtraccionMaestro() {
  const [cuotas, setCuotas] = useState([]);
  const [maestros, setMaestros] = useState({ regiones: [], especies: [], amerbs: [], usuarios: [] });
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  // Filtros de la tabla
  const [filtroAlcance, setFiltroAlcance] = useState('TODOS');
  const [filtroTexto, setFiltroTexto] = useState('');

  // Dialog de creación/edición
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Dialog de confirmación de borrado
  const [porEliminar, setPorEliminar] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const [cuotasRes, maestrosRes] = await Promise.all([
        api.get('/cuotas'),
        api.get('/cuotas/maestros'),
      ]);
      setCuotas(cuotasRes.data || []);
      setMaestros(maestrosRes.data || { regiones: [], especies: [], amerbs: [], usuarios: [] });
    } catch (error) {
      console.error('Error cargando cuotas', error);
      setMensaje({ type: 'error', text: 'Error al cargar las cuotas de extracción. Verifica el backend.' });
    } finally {
      setLoading(false);
    }
  };

  const cuotasFiltradas = useMemo(() => {
    const txt = filtroTexto.trim().toLowerCase();
    return cuotas.filter((c) => {
      if (filtroAlcance !== 'TODOS' && alcanceDe(c) !== filtroAlcance) return false;
      if (!txt) return true;
      const blob = [
        describirAlcance(c),
        nombreRegionDe(c),
        c.especie?.nombre,
        c.perfil,
        c.periodo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(txt);
    });
  }, [cuotas, filtroAlcance, filtroTexto]);

  /* ------- Topes jerárquicos aplicables al formulario (hint en vivo; el backend revalida) ------- */
  const topesJerarquicos = useMemo(() => {
    if (!dialogOpen) return [];
    const activas = cuotas.filter((c) => c.activo && c.id !== form.id);
    const compatibles = (c) =>
      c.periodo?.toUpperCase() === form.periodo &&
      (!c.especie || !form.especie || c.especie.id === form.especie.id);
    const regionForm =
      form.alcance === 'AREA' || (form.alcance === 'USUARIO' && form.amerb)
        ? form.amerb?.region || form.region?.nombre
        : form.region?.nombre;

    const topes = [];
    if (form.alcance === 'USUARIO' && form.amerb) {
      activas
        .filter((c) => alcanceDe(c) === 'AREA' && c.amerb?.id === form.amerb.id && compatibles(c))
        .forEach((c) => topes.push({ nivel: 'Área de manejo', nombre: describirAlcance(c), limite: c.limiteKg }));
    }
    if (form.alcance === 'USUARIO' || form.alcance === 'AREA') {
      if (regionForm) {
        activas
          .filter(
            (c) =>
              alcanceDe(c) === 'REGION' &&
              (c.region?.nombre || '').toLowerCase() === regionForm.toLowerCase() &&
              compatibles(c)
          )
          .forEach((c) => topes.push({ nivel: 'Región', nombre: describirAlcance(c), limite: c.limiteKg }));
      }
    }
    return topes;
  }, [dialogOpen, cuotas, form]);

  const limiteExcedeTope = useMemo(() => {
    const lim = parseFloat(form.limiteKg);
    if (isNaN(lim) || !topesJerarquicos.length) return null;
    const violado = topesJerarquicos.find((t) => lim > t.limite);
    return violado || null;
  }, [form.limiteKg, topesJerarquicos]);

  /* ------------------------------- Acciones ------------------------------- */

  const abrirNueva = () => {
    setForm(FORM_VACIO);
    setFormError(null);
    setDialogOpen(true);
  };

  const abrirEdicion = (c) => {
    setForm({
      id: c.id,
      alcance: alcanceDe(c),
      region: c.region ? { id: c.region.id, nombre: c.region.nombre } : null,
      amerb: c.amerb ? { id: c.amerb.id, nombre: c.amerb.nombre, region: c.amerb.region } : null,
      usuario: c.usuario
        ? { id: c.usuario.id, nombre: nombreUsuario(c.usuario), rut: c.usuario.rut || '' }
        : null,
      especie: c.especie ? { id: c.especie.id, nombre: c.especie.nombre } : null,
      perfil: c.perfil || 'RECOLECTOR',
      periodo: (c.periodo || 'DIARIO').toUpperCase(),
      limiteKg: c.limiteKg ?? '',
      activo: !!c.activo,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const cambiarAlcance = (nuevo) => {
    if (!nuevo) return;
    // Al cambiar el alcance se limpian las referencias que no correspondan.
    setForm((f) => ({
      ...f,
      alcance: nuevo,
      region: nuevo === 'GLOBAL' ? null : f.region,
      amerb: nuevo === 'REGION' || nuevo === 'GLOBAL' ? null : f.amerb,
      usuario: nuevo !== 'USUARIO' ? null : f.usuario,
    }));
  };

  const guardar = async () => {
    setFormError(null);

    const lim = parseFloat(form.limiteKg);
    if (isNaN(lim) || lim <= 0) {
      setFormError('Ingresa un límite en kilogramos mayor que 0.');
      return;
    }
    if (form.alcance === 'REGION' && !form.region) {
      setFormError('Selecciona la región a la que aplica la cuota.');
      return;
    }
    if (form.alcance === 'AREA' && !form.amerb) {
      setFormError('Selecciona el área de manejo a la que aplica la cuota.');
      return;
    }
    if (form.alcance === 'USUARIO' && !form.usuario) {
      setFormError('Selecciona el usuario al que aplica la cuota.');
      return;
    }

    const payload = {
      perfil: form.perfil,
      periodo: form.periodo,
      limiteKg: lim,
      activo: form.activo,
      especie: form.especie ? { id: form.especie.id } : null,
      region: form.alcance !== 'GLOBAL' && form.region ? { id: form.region.id } : null,
      amerb: (form.alcance === 'AREA' || form.alcance === 'USUARIO') && form.amerb ? { id: form.amerb.id } : null,
      usuario: form.alcance === 'USUARIO' && form.usuario ? { id: form.usuario.id } : null,
    };

    try {
      setSaving(true);
      if (form.id) {
        await api.put(`/cuotas/${form.id}`, payload);
      } else {
        await api.post('/cuotas', payload);
      }
      setDialogOpen(false);
      setMensaje({ type: 'success', text: `Cuota ${form.id ? 'actualizada' : 'creada'} correctamente.` });
      setTimeout(() => setMensaje(null), 4000);
      await cargar();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'No se pudo guardar la cuota. Verifica los datos y la conexión con el backend.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (c) => {
    try {
      await api.put(`/cuotas/${c.id}`, { ...c, activo: !c.activo });
      await cargar();
    } catch (error) {
      const msg = error.response?.data?.message || 'No se pudo cambiar el estado de la cuota.';
      setMensaje({ type: 'error', text: msg });
      setTimeout(() => setMensaje(null), 6000);
    }
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    try {
      await api.delete(`/cuotas/${porEliminar.id}`);
      setPorEliminar(null);
      setMensaje({ type: 'success', text: 'Cuota eliminada correctamente.' });
      setTimeout(() => setMensaje(null), 4000);
      await cargar();
    } catch {
      setPorEliminar(null);
      setMensaje({ type: 'error', text: 'No se pudo eliminar la cuota.' });
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
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
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
            <ScaleIcon sx={{ color: '#0ea5e9' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a' }}>
              Cuotas de Extracción
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', maxWidth: 680, lineHeight: 1.6 }}>
            Define límites de extracción por región, área de manejo o usuario, con cantidad máxima por especie.
            La jerarquía se respeta siempre: una cuota de usuario nunca puede superar la del área de manejo,
            y ninguna puede superar la de la región.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirNueva}
          sx={{
            bgcolor: '#0a192f',
            '&:hover': { bgcolor: '#172a45' },
            boxShadow: 'none',
            borderRadius: 2.5,
            px: 3,
            py: 1.25,
            fontFamily: 'Outfit',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Nueva Cuota
        </Button>
      </Card>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={filtroAlcance}
          exclusive
          onChange={(e, v) => v && setFiltroAlcance(v)}
          size="small"
          sx={{
            bgcolor: '#fff',
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontFamily: 'Inter',
              fontWeight: 600,
              px: 2,
              border: '1px solid #e2e8f0',
              color: '#64748b',
              '&.Mui-selected': { bgcolor: '#0a192f', color: '#fff', '&:hover': { bgcolor: '#172a45' } },
            },
          }}
        >
          <ToggleButton value="TODOS">Todas</ToggleButton>
          <ToggleButton value="REGION">Región</ToggleButton>
          <ToggleButton value="AREA">Área de Manejo</ToggleButton>
          <ToggleButton value="USUARIO">Usuario</ToggleButton>
          <ToggleButton value="GLOBAL">Global</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          size="small"
          placeholder="Buscar por nombre, especie, región…"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: '#94a3b8' }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 280, bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
        />
        <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', ml: 'auto' }}>
          {cuotasFiltradas.length} cuota(s)
        </Typography>
      </Box>

      {/* Tabla de cuotas */}
      <TableContainer
        component={Card}
        elevation={0}
        sx={{ borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}
      >
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              {['Alcance', 'Aplica a', 'Región', 'Especie', 'Perfil', 'Periodo', 'Límite', 'Activa', ''].map((h) => (
                <TableCell
                  key={h}
                  sx={{ fontWeight: 700, fontFamily: 'Outfit', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.4 }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cuotasFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6, color: '#94a3b8', fontFamily: 'Inter' }}>
                  No hay cuotas configuradas{filtroAlcance !== 'TODOS' || filtroTexto ? ' con los filtros actuales' : ''}.
                  Crea la primera con «Nueva Cuota».
                </TableCell>
              </TableRow>
            )}
            {cuotasFiltradas.map((c) => {
              const tipo = alcanceDe(c);
              const meta = ALCANCES[tipo];
              return (
                <TableRow key={c.id} hover sx={{ opacity: c.activo ? 1 : 0.55 }}>
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
                  <TableCell sx={{ fontFamily: 'Inter', fontWeight: 600, color: '#0f172a' }}>
                    {describirAlcance(c)}
                    {tipo === 'USUARIO' && c.usuario?.rut ? (
                      <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                        {c.usuario.rut}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Inter', color: '#475569' }}>{nombreRegionDe(c) || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'Inter', color: '#475569' }}>
                    {c.especie?.nombre || <em style={{ color: '#94a3b8' }}>Todas</em>}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={c.perfil} sx={{ fontFamily: 'Inter', fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Inter', color: '#475569' }}>{c.periodo}</TableCell>
                  <TableCell sx={{ fontFamily: 'Inter', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                    {fmtKg(c.limiteKg)}
                  </TableCell>
                  <TableCell>
                    <Switch size="small" checked={!!c.activo} onChange={() => toggleActivo(c)} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => abrirEdicion(c)}>
                        <EditIcon sx={{ fontSize: 19 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => setPorEliminar(c)}>
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
          {form.id ? 'Editar Cuota de Extracción' : 'Nueva Cuota de Extracción'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'Inter', display: 'block', mb: 1 }}>
            Alcance de la cuota
          </Typography>
          <ToggleButtonGroup
            value={form.alcance}
            exclusive
            onChange={(e, v) => cambiarAlcance(v)}
            size="small"
            fullWidth
            sx={{
              mb: 3,
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                fontFamily: 'Inter',
                fontWeight: 600,
                '&.Mui-selected': { bgcolor: '#0a192f', color: '#fff', '&:hover': { bgcolor: '#172a45' } },
              },
            }}
          >
            <ToggleButton value="REGION">Región</ToggleButton>
            <ToggleButton value="AREA">Área de Manejo</ToggleButton>
            <ToggleButton value="USUARIO">Usuario</ToggleButton>
            <ToggleButton value="GLOBAL">Global</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {(form.alcance === 'REGION' || form.alcance === 'USUARIO') && (
              <Autocomplete
                options={maestros.regiones}
                getOptionLabel={(o) => o.nombre || ''}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                value={form.region}
                onChange={(e, v) => setForm((f) => ({ ...f, region: v }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={form.alcance === 'REGION' ? 'Región *' : 'Región (contexto jerárquico, opcional)'}
                    helperText={
                      form.alcance === 'USUARIO'
                        ? 'Ancla la cuota del usuario al tope regional. Si eliges un área, la región se infiere de ella.'
                        : undefined
                    }
                  />
                )}
              />
            )}

            {(form.alcance === 'AREA' || form.alcance === 'USUARIO') && (
              <Autocomplete
                options={maestros.amerbs}
                getOptionLabel={(o) => (o.region ? `${o.nombre} — ${o.region}` : o.nombre || '')}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                value={form.amerb}
                onChange={(e, v) => setForm((f) => ({ ...f, amerb: v }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={form.alcance === 'AREA' ? 'Área de Manejo (AMERB) *' : 'Área de Manejo (contexto jerárquico, opcional)'}
                    helperText={
                      form.alcance === 'USUARIO'
                        ? 'Ancla la cuota del usuario al tope del área de manejo.'
                        : undefined
                    }
                  />
                )}
              />
            )}

            {form.alcance === 'USUARIO' && (
              <Autocomplete
                options={maestros.usuarios}
                getOptionLabel={(o) => (o.rut ? `${o.nombre} (${o.rut})` : o.nombre || '')}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                value={form.usuario}
                onChange={(e, v) => setForm((f) => ({ ...f, usuario: v }))}
                renderInput={(params) => <TextField {...params} label="Usuario *" />}
              />
            )}

            <Autocomplete
              options={maestros.especies}
              getOptionLabel={(o) => o.nombre || ''}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              value={form.especie}
              onChange={(e, v) => setForm((f) => ({ ...f, especie: v }))}
              renderInput={(params) => (
                <TextField {...params} label="Especie" helperText="Vacío = la cuota aplica a todas las especies." />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Perfil"
                value={form.perfil}
                onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value }))}
                sx={{ flex: 1 }}
              >
                {PERFILES.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Periodo"
                value={form.periodo}
                onChange={(e) => setForm((f) => ({ ...f, periodo: e.target.value }))}
                sx={{ flex: 1 }}
              >
                {PERIODOS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              label="Límite (kg)"
              type="number"
              value={form.limiteKg}
              onChange={(e) => setForm((f) => ({ ...f, limiteKg: e.target.value }))}
              error={!!limiteExcedeTope}
              InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
            />

            {/* Topes jerárquicos aplicables (informativo; el backend revalida al guardar) */}
            {topesJerarquicos.length > 0 && (
              <Alert
                icon={<AccountTreeIcon fontSize="small" />}
                severity={limiteExcedeTope ? 'error' : 'info'}
                sx={{ borderRadius: 2.5, fontFamily: 'Inter' }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, fontFamily: 'Inter' }}>
                  Topes por jerarquía ({form.periodo.toLowerCase()}):
                </Typography>
                {topesJerarquicos.map((t, i) => (
                  <Typography key={i} variant="body2" sx={{ fontFamily: 'Inter' }}>
                    • {t.nivel} «{t.nombre}»: máx. {fmtKg(t.limite)}
                  </Typography>
                ))}
                {limiteExcedeTope && (
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, fontFamily: 'Inter' }}>
                    El límite ingresado supera el tope de {limiteExcedeTope.nivel.toLowerCase()} «{limiteExcedeTope.nombre}».
                  </Typography>
                )}
              </Alert>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontFamily: 'Inter', fontWeight: 600, color: '#475569' }}>
                Cuota activa
              </Typography>
              <Switch checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />
            </Box>

            {formError && (
              <Alert severity="error" sx={{ borderRadius: 2.5, fontFamily: 'Inter' }}>
                {formError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ fontFamily: 'Outfit', color: '#64748b' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={guardar}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: '#0a192f', '&:hover': { bgcolor: '#172a45' }, boxShadow: 'none', borderRadius: 2.5, px: 3, fontFamily: 'Outfit' }}
          >
            {saving ? 'Guardando…' : 'Guardar Cuota'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog open={!!porEliminar} onClose={() => setPorEliminar(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Eliminar cuota</DialogTitle>
        <DialogContent>
          {porEliminar && (
            <Typography variant="body2" sx={{ fontFamily: 'Inter', color: '#475569' }}>
              ¿Eliminar la cuota de <b>{describirAlcance(porEliminar)}</b> (
              {porEliminar.especie?.nombre || 'todas las especies'}, {porEliminar.periodo},{' '}
              {fmtKg(porEliminar.limiteKg)})? Esta acción no se puede deshacer.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setPorEliminar(null)} sx={{ fontFamily: 'Outfit', color: '#64748b' }}>
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
