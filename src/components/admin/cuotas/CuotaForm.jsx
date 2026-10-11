import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  InputAdornment,
  Chip,
  RadioGroup,
  Radio,
  FormLabel,
  FormControl,
  Divider,
} from '@mui/material';
import {
  Scale as ScaleIcon,
  Search as SearchIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  LocationCity as CityIcon,
  Public as PublicIcon,
  Layers as LayersIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import api from '../../../api/axiosConfig';
import { NIVELES_CUOTA, validarFormularioPorNivel, construirPayloadCuota } from './esquemaNiveles';

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

const fmtTon = (kg) =>
  `= ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format((kg || 0) / 1000)} t`;

export default function CuotaForm({
  open,
  onClose,
  cuotaData,
  maestros,
  onSaved,
}) {
  const [form, setForm] = useState(cuotaData || {});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Búsqueda asíncrona de usuarios para nivel INDIVIDUAL
  const [usuarioQuery, setUsuarioQuery] = useState('');
  const [usuariosOpciones, setUsuariosOpciones] = useState([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);

  useEffect(() => {
    if (cuotaData) {
      setForm(cuotaData);
      setError(null);
      if (cuotaData.usuario) {
        setUsuariosOpciones([cuotaData.usuario]);
      }
    }
  }, [cuotaData]);

  const esCerrada = (form.estado || '').toUpperCase() === 'CERRADA';
  const esEdicion = Boolean(form.id);

  // Debounce para búsqueda de usuarios
  useEffect(() => {
    if (!open || form.nivelAgregacion !== 'INDIVIDUAL' || form.esPlantilla) return;
    if (!usuarioQuery || usuarioQuery.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        setBuscandoUsuarios(true);
        const res = await api.get('/api/usuarios/buscar', {
          params: { q: usuarioQuery },
        });
        setUsuariosOpciones(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error buscando usuarios:', err);
      } finally {
        setBuscandoUsuarios(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [usuarioQuery, open, form.nivelAgregacion, form.esPlantilla]);

  const handleCambioAnioMes = (nuevoAnio, nuevoMes) => {
    const y = parseInt(nuevoAnio, 10) || new Date().getFullYear();
    const m = parseInt(nuevoMes, 10) || (new Date().getMonth() + 1);
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

  const provinciasFiltradas = useMemo(() => {
    if (!form.region?.id) return maestros.provincias || [];
    return (maestros.provincias || []).filter(
      (p) => p.region?.id === form.region.id || p.regionId === form.region.id
    );
  }, [maestros.provincias, form.region]);

  const handleSubmit = async () => {
    if (esCerrada) {
      setError('Esta cuota está CERRADA administrativamente y no puede ser modificada.');
      return;
    }

    const errValidacion = validarFormularioPorNivel(form);
    if (errValidacion) {
      setError(errValidacion);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = construirPayloadCuota(form);

      let guardada;
      if (form.id) {
        const res = await api.put(`/api/cuotas/${form.id}`, payload);
        guardada = res.data;
      } else {
        const res = await api.post('/api/cuotas', payload);
        guardada = res.data;
      }

      if (onSaved) {
        onSaved(guardada);
      }
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al procesar la cuota en el servidor.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          fontFamily: 'Outfit',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <ScaleIcon color="secondary" />
        {esEdicion ? `Editar Cuota #${form.id}` : 'Nueva Cuota de Extracción'}
        {esCerrada && (
          <Chip
            icon={<LockIcon sx={{ fontSize: 14 }} />}
            label="CERRADA (Solo lectura)"
            size="small"
            color="error"
            sx={{ fontWeight: 700, ml: 'auto' }}
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {esCerrada && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2.5, borderRadius: 2 }}>
            Esta cuota fue cerrada administrativamente. Su límite, vigencia y alcance están
            fijados permanentemente como registro histórico no editable.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 1. Selector de Nivel de Agregación */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
            Nivel de Agregación Territorial / Personal
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 1 }}>
            {NIVELES_CUOTA.map((n) => {
              const seleccionado = form.nivelAgregacion === n.id;
              return (
                <Button
                  key={n.id}
                  variant={seleccionado ? 'contained' : 'outlined'}
                  color={n.color}
                  disabled={esCerrada}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      nivelAgregacion: n.id,
                      // Si cambia a individual, por defecto no plantilla a menos que se indique
                      esPlantilla: n.id === 'INDIVIDUAL' ? Boolean(prev.esPlantilla) : false,
                    }))
                  }
                  sx={{
                    flexDirection: 'column',
                    py: 1.2,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    borderWidth: seleccionado ? 2 : 1,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                    {n.etiqueta}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', opacity: 0.85, textAlign: 'center' }}>
                    {n.id === 'COMUNA' && '1 o más comunas'}
                    {n.id === 'PROVINCIA' && 'Provincia completa'}
                    {n.id === 'REGION' && 'Región completa'}
                    {n.id === 'INDIVIDUAL' && 'Persona / Plantilla'}
                  </Typography>
                </Button>
              );
            })}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* 2. Configuración territorial / personal según el nivel */}
        <Box sx={{ mb: 3 }}>
          {/* NIVEL COMUNA */}
          {form.nivelAgregacion === 'COMUNA' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                size="small"
                label="Región *"
                disabled={esCerrada}
                value={form.region?.id || ''}
                onChange={(e) => {
                  const reg = (maestros.regiones || []).find((r) => r.id === e.target.value);
                  setForm((prev) => ({ ...prev, region: reg, comunas: [] }));
                }}
                fullWidth
              >
                {(maestros.regiones || []).map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.nombre}
                  </MenuItem>
                ))}
              </TextField>

              <Autocomplete
                multiple
                disabled={esCerrada}
                options={comunasFiltradas}
                getOptionLabel={(option) => option.nombre || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={form.comunas || []}
                onChange={(e, val) => setForm((prev) => ({ ...prev, comunas: val }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Comunas asignadas *"
                    placeholder="Seleccione una o varias comunas..."
                    helperText="La cuota aplicará de forma consolidada a las declaraciones originadas en estas comunas."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.id}
                      label={option.nombre}
                      size="small"
                      color="primary"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Box>
          )}

          {/* NIVEL PROVINCIA */}
          {form.nivelAgregacion === 'PROVINCIA' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  select
                  size="small"
                  label="Filtrar por Región (opcional)"
                  disabled={esCerrada}
                  value={form.region?.id || ''}
                  onChange={(e) => {
                    const reg = (maestros.regiones || []).find((r) => r.id === e.target.value);
                    setForm((prev) => ({ ...prev, region: reg }));
                  }}
                >
                  <MenuItem value="">Todas las regiones</MenuItem>
                  {(maestros.regiones || []).map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.nombre}
                    </MenuItem>
                  ))}
                </TextField>

                <Autocomplete
                  disabled={esCerrada}
                  options={provinciasFiltradas}
                  getOptionLabel={(option) => option.nombre ? `${option.nombre} (${option.region?.nombre || ''})` : ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={form.provincia || null}
                  onChange={(e, val) => setForm((prev) => ({ ...prev, provincia: val, region: val?.region || prev.region }))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Provincia objetivo *"
                      placeholder="Seleccionar provincia..."
                      helperText="Orden de jerarquía: Comunal ≤ Provincial ≤ Regional"
                    />
                  )}
                />
              </Box>
            </Box>
          )}

          {/* NIVEL REGION */}
          {form.nivelAgregacion === 'REGION' && (
            <Box>
              <TextField
                select
                size="small"
                label="Región objetivo *"
                disabled={esCerrada}
                value={form.region?.id || ''}
                onChange={(e) => {
                  const reg = (maestros.regiones || []).find((r) => r.id === e.target.value);
                  setForm((prev) => ({ ...prev, region: reg }));
                }}
                fullWidth
                helperText="La cuota aplicará a toda la región como límite superior macro."
              >
                {(maestros.regiones || []).map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}

          {/* NIVEL INDIVIDUAL */}
          {form.nivelAgregacion === 'INDIVIDUAL' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl component="fieldset" disabled={esCerrada}>
                <FormLabel component="legend" sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  Modalidad de Cuota Individual
                </FormLabel>
                <RadioGroup
                  row
                  value={form.esPlantilla ? 'PLANTILLA' : 'PERSONA'}
                  onChange={(e) => {
                    const esPlan = e.target.value === 'PLANTILLA';
                    setForm((prev) => ({
                      ...prev,
                      esPlantilla: esPlan,
                      usuario: esPlan ? null : prev.usuario,
                    }));
                  }}
                >
                  <FormControlLabel
                    value="PLANTILLA"
                    control={<Radio size="small" />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Plantilla de Cuota (Tope General)
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Define un tope idéntico para cada pescador/armador del territorio
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="PERSONA"
                    control={<Radio size="small" />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Persona Específica
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Asigna una cuota personalizada a un único titular (prevalece sobre la plantilla)
                        </Typography>
                      </Box>
                    }
                    sx={{ ml: { xs: 0, sm: 3 }, mt: { xs: 1, sm: 0 } }}
                  />
                </RadioGroup>
              </FormControl>

              {form.esPlantilla ? (
                /* Ámbito territorial base de la plantilla */
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Autocomplete
                    disabled={esCerrada}
                    options={maestros.provincias || []}
                    getOptionLabel={(option) => option.nombre ? `${option.nombre} (${option.region?.nombre || ''})` : ''}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={form.provincia || null}
                    onChange={(e, val) => setForm((prev) => ({ ...prev, provincia: val, region: val?.region || prev.region }))}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Provincia de la plantilla"
                        placeholder="Seleccionar provincia..."
                      />
                    )}
                  />
                  <TextField
                    select
                    size="small"
                    label="Región alternativa"
                    disabled={esCerrada}
                    value={form.region?.id || ''}
                    onChange={(e) => {
                      const reg = (maestros.regiones || []).find((r) => r.id === e.target.value);
                      setForm((prev) => ({ ...prev, region: reg }));
                    }}
                  >
                    <MenuItem value="">Ninguna (usa provincia)</MenuItem>
                    {(maestros.regiones || []).map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              ) : (
                /* Buscador de persona específica */
                <Box>
                  <Autocomplete
                    disabled={esCerrada}
                    options={usuariosOpciones}
                    loading={buscandoUsuarios}
                    getOptionLabel={(opt) =>
                      opt.rut ? `${opt.rut} - ${opt.nombres || ''} ${opt.apellidop || ''} (${opt.perfil || 'Usuario'})` : ''
                    }
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    value={form.usuario || null}
                    onChange={(e, val) => setForm((prev) => ({ ...prev, usuario: val }))}
                    onInputChange={(e, val) => setUsuarioQuery(val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Buscar Persona por RUT o Nombre *"
                        placeholder="Escriba al menos 2 caracteres (ej. 12.345...)"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <>
                              {buscandoUsuarios ? <CircularProgress color="inherit" size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                        helperText="Busca en la nómina de usuarios activos por RUT, nombre o apellido."
                      />
                    )}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* 3. Parámetros biológicos y vigencia */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <TextField
            select
            size="small"
            label="Especie Objetivo *"
            disabled={esCerrada}
            value={form.especie?.id || ''}
            onChange={(e) => {
              const esp = (maestros.especies || []).find((s) => s.id === e.target.value);
              setForm((prev) => ({ ...prev, especie: esp }));
            }}
          >
            {(maestros.especies || []).map((esp) => (
              <MenuItem key={esp.id} value={esp.id}>
                {esp.nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Método de Extracción *"
            disabled={esCerrada}
            value={form.extraccionTipo?.id || ''}
            onChange={(e) => {
              const et = (maestros.extraccionTipos || []).find((t) => t.id === e.target.value);
              setForm((prev) => ({ ...prev, extraccionTipo: et }));
            }}
          >
            {(maestros.extraccionTipos || []).map((et) => (
              <MenuItem key={et.id} value={et.id}>
                {et.nombre}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Vigencia Mes / Año */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
          <TextField
            size="small"
            type="number"
            label="Año"
            disabled={esCerrada}
            value={form.anioVigencia || ''}
            onChange={(e) => handleCambioAnioMes(e.target.value, form.mesVigencia)}
          />

          <TextField
            select
            size="small"
            label="Mes"
            disabled={esCerrada}
            value={form.mesVigencia || ''}
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
            type="date"
            label="Inicio Vigencia *"
            disabled={esCerrada}
            value={form.fechaInicio ? String(form.fechaInicio).slice(0, 10) : ''}
            onChange={(e) => setForm((prev) => ({ ...prev, fechaInicio: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            size="small"
            type="date"
            label="Fin Vigencia *"
            disabled={esCerrada}
            value={form.fechaFin ? String(form.fechaFin).slice(0, 10) : ''}
            onChange={(e) => setForm((prev) => ({ ...prev, fechaFin: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {/* Límite en kg y Equivalencia */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <TextField
            size="small"
            type="number"
            label="Límite Oficial (kg) *"
            disabled={esCerrada}
            value={form.limiteKg ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, limiteKg: e.target.value }))}
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            }}
            helperText={fmtTon(Number(form.limiteKg))}
          />

          <TextField
            select
            size="small"
            label="Métrica *"
            disabled={esCerrada}
            value={form.metrica || 'CAPTURA'}
            onChange={(e) => setForm((prev) => ({ ...prev, metrica: e.target.value }))}
            helperText={
              form.metrica === 'DESEMBARQUE'
                ? 'Excepción normativa: exige campo Resolución'
                : 'Métrica estándar biológica'
            }
          >
            <MenuItem value="CAPTURA">CAPTURA (estándar biológico)</MenuItem>
            <MenuItem value="DESEMBARQUE">DESEMBARQUE (excepción)</MenuItem>
          </TextField>
        </Box>

        {/* Modo de Acción y Resolución */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 1 }}>
          <TextField
            select
            size="small"
            label="Modo de Acción *"
            disabled={esCerrada}
            value={form.modoAccion || 'SOLO_ALERTA'}
            onChange={(e) => setForm((prev) => ({ ...prev, modoAccion: e.target.value }))}
          >
            <MenuItem value="SOLO_ALERTA">SOLO_ALERTA (alerta visual sin bloqueo)</MenuItem>
            <MenuItem value="BLOQUEO_DECLARACION">BLOQUEO_DECLARACION (bloquea declaraciones al 100%)</MenuItem>
          </TextField>

          <TextField
            size="small"
            label={form.metrica === 'DESEMBARQUE' ? 'Resolución Técnica *' : 'Resolución Técnica (opcional)'}
            disabled={esCerrada}
            value={form.resolucion || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, resolucion: e.target.value }))}
            placeholder="Ej: Res. Ex. 1234/2026"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">
          {esCerrada ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!esCerrada && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving && <CircularProgress size={16} color="inherit" />}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {saving ? 'Guardando...' : esEdicion ? 'Actualizar Cuota' : 'Crear Cuota'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
