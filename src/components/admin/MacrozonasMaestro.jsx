import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Checkbox,
  InputAdornment,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Public as PublicIcon,
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  SelectAll as SelectAllIcon,
  Deselect as DeselectIcon,
  LocationOn as LocationOnIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

const FORM_VACIO = {
  id: null,
  nombre: '',
  codigo: '',
  descripcion: '',
  esNacional: false,
  activo: true,
  regionIds: [],
};

export default function MacrozonasMaestro() {
  const [macrozonas, setMacrozonas] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [selectedMz, setSelectedMz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mensaje, setMensaje] = useState(null);

  // Dialog para creación / edición
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Confirmación de desactivación
  const [porEliminar, setPorEliminar] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resMz, resReg] = await Promise.all([
        api.get('/api/macrozonas'),
        api.get('/api/regiones'),
      ]);
      const dataMz = Array.isArray(resMz.data) ? resMz.data : [];
      setMacrozonas(dataMz);
      const dataReg = Array.isArray(resReg.data) ? resReg.data : [];
      setRegiones(dataReg);

      if (dataMz.length > 0 && !selectedMz) {
        setSelectedMz(dataMz[0]);
      } else if (selectedMz) {
        const refrescada = dataMz.find((m) => m.id === selectedMz.id);
        if (refrescada) setSelectedMz(refrescada);
      }
    } catch (err) {
      console.error('Error al cargar datos de Macrozonas:', err);
      setMensaje({ type: 'error', text: 'Error al conectar con el servidor para cargar las macrozonas.' });
    } finally {
      setLoading(false);
    }
  };

  const abrirNueva = () => {
    setForm(FORM_VACIO);
    setFormError(null);
    setDialogOpen(true);
  };

  const abrirEditar = (mz) => {
    setForm({
      id: mz.id,
      nombre: mz.nombre || '',
      codigo: mz.codigo || '',
      descripcion: mz.descripcion || '',
      esNacional: Boolean(mz.esNacional),
      activo: mz.activo !== false,
      regionIds: Array.isArray(mz.regionIds) ? [...mz.regionIds] : [],
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const toggleRegion = (regionId) => {
    if (form.esNacional) return; // Si es nacional todas están incluidas
    setForm((prev) => {
      const exists = prev.regionIds.includes(regionId);
      const updated = exists
        ? prev.regionIds.filter((id) => id !== regionId)
        : [...prev.regionIds, regionId];
      return { ...prev, regionIds: updated };
    });
  };

  const seleccionarTodas = () => {
    const allIds = regiones.map((r) => r.id);
    setForm((prev) => ({ ...prev, regionIds: allIds }));
  };

  const limpiarSeleccion = () => {
    if (form.esNacional) return;
    setForm((prev) => ({ ...prev, regionIds: [] }));
  };

  const handleEsNacionalChange = (checked) => {
    if (checked) {
      const allIds = regiones.map((r) => r.id);
      setForm((prev) => ({ ...prev, esNacional: true, regionIds: allIds }));
    } else {
      setForm((prev) => ({ ...prev, esNacional: false }));
    }
  };

  const handleGuardar = async () => {
    if (!form.nombre || !form.nombre.trim()) {
      setFormError('El nombre de la macrozona es obligatorio.');
      return;
    }

    if (!form.esNacional && (!form.regionIds || form.regionIds.length === 0)) {
      setFormError('Debe asociar al menos una región a la macrozona, o marcarla como Nacional.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        id: form.id,
        nombre: form.nombre.trim(),
        codigo: form.codigo ? form.codigo.trim() : null,
        descripcion: form.descripcion ? form.descripcion.trim() : null,
        esNacional: form.esNacional,
        activo: form.activo,
        regionIds: form.esNacional ? regiones.map((r) => r.id) : form.regionIds,
      };

      if (form.id) {
        await api.put(`/api/macrozonas/${form.id}`, payload);
        setMensaje({ type: 'success', text: `Macrozona «${payload.nombre}» actualizada con éxito.` });
      } else {
        await api.post('/api/macrozonas', payload);
        setMensaje({ type: 'success', text: `Macrozona «${payload.nombre}» creada con éxito.` });
      }

      setDialogOpen(false);
      await cargarDatos();
    } catch (err) {
      console.error('Error guardando macrozona:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Error al guardar la macrozona.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!porEliminar) return;
    try {
      await api.delete(`/api/macrozonas/${porEliminar.id}`);
      setMensaje({ type: 'success', text: `Macrozona «${porEliminar.nombre}» desactivada.` });
      setPorEliminar(null);
      await cargarDatos();
    } catch (err) {
      console.error('Error al desactivar macrozona:', err);
      setMensaje({ type: 'error', text: 'Error al desactivar la macrozona.' });
    }
  };

  // Filtrado de macrozonas por texto
  const macrozonasFiltradas = macrozonas.filter((mz) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (mz.nombre && mz.nombre.toLowerCase().includes(term)) ||
      (mz.codigo && mz.codigo.toLowerCase().includes(term)) ||
      (mz.descripcion && mz.descripcion.toLowerCase().includes(term))
    );
  });

  return (
    <Box>
      {/* Header del mantenedor */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PublicIcon sx={{ color: 'secondary.main', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
              Catálogo de Macrozonas Configurables
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontFamily: 'Inter' }}>
            Configure macrozonas multirregionales (N:M) y la macrozona Nacional para la asignación y control transversal de cuotas, vedas y límites.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarDatos}
            disabled={loading}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={abrirNueva}
            color="secondary"
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
            }}
          >
            Nueva Macrozona
          </Button>
        </Box>
      </Box>

      {/* Alerta de notificación */}
      {mensaje && (
        <Alert
          severity={mensaje.type}
          onClose={() => setMensaje(null)}
          sx={{ mb: 3, borderRadius: 3, fontFamily: 'Inter' }}
        >
          {mensaje.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Columna Izquierda: Listado de Macrozonas */}
        <Grid item xs={12} lg={7}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: 1,
              borderColor: 'divider',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Buscar macrozona por nombre o código…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />
              <Chip
                label={`${macrozonasFiltradas.length} macrozonas`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Macrozona</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Regiones</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Estado</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={36} color="secondary" />
                        <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                          Cargando macrozonas…
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : macrozonasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <PublicIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          No se encontraron macrozonas registradas.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    macrozonasFiltradas.map((mz) => {
                      const isSelected = selectedMz?.id === mz.id;
                      const numRegiones = mz.regionIds?.length || 0;

                      return (
                        <TableRow
                          key={mz.id}
                          hover
                          selected={isSelected}
                          onClick={() => setSelectedMz(mz)}
                          sx={{
                            cursor: 'pointer',
                            '&.Mui-selected': {
                              bgcolor: (theme) => `${theme.palette.secondary.main}12`,
                            },
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {mz.nombre}
                              </Typography>
                              {mz.esNacional && (
                                <Chip
                                  icon={<FlagIcon sx={{ fontSize: 14 }} />}
                                  label="NACIONAL"
                                  size="small"
                                  color="primary"
                                  variant="filled"
                                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                                />
                              )}
                            </Box>
                            {mz.descripcion && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                {mz.descripcion}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {mz.codigo || '—'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
                              label={`${numRegiones} regiones`}
                              size="small"
                              variant="outlined"
                              color={numRegiones >= 16 ? 'primary' : 'default'}
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={mz.activo ? 'ACTIVA' : 'INACTIVA'}
                              size="small"
                              color={mz.activo ? 'success' : 'default'}
                              variant={mz.activo ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                            />
                          </TableCell>

                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                              <Tooltip title="Editar Macrozona">
                                <IconButton size="small" color="primary" onClick={() => abrirEditar(mz)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Desactivar Macrozona">
                                <IconButton size="small" color="error" onClick={() => setPorEliminar(mz)}>
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
        </Grid>

        {/* Columna Derecha: Detalle y Regiones de la Macrozona Seleccionada */}
        <Grid item xs={12} lg={5}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: 1,
              borderColor: 'divider',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'background.default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocationOnIcon sx={{ color: 'secondary.main' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
                    {selectedMz ? selectedMz.nombre : 'Composición Territorial'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {selectedMz ? `Código: ${selectedMz.codigo || 'S/C'} · ${selectedMz.esNacional ? 'Ámbito Nacional' : 'Multirregional'}` : 'Seleccione una macrozona para ver sus regiones'}
                  </Typography>
                </Box>
              </Box>

              {selectedMz && (
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => abrirEditar(selectedMz)}
                  variant="outlined"
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Editar
                </Button>
              )}
            </Box>

            <Box sx={{ p: 2.5 }}>
              {selectedMz ? (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
                    Regiones que la componen ({selectedMz.regionIds?.length || 0} de {regiones.length}):
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 480, overflowY: 'auto', p: 0.5 }}>
                    {regiones.map((reg) => {
                      const estaIncluida = selectedMz.regionIds?.includes(reg.id) || selectedMz.esNacional;
                      return (
                        <Chip
                          key={reg.id}
                          icon={estaIncluida ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <LocationOnIcon sx={{ fontSize: 16 }} />}
                          label={`${reg.codigo ? `[${reg.codigo}] ` : ''}${reg.nombre}`}
                          color={estaIncluida ? (selectedMz.esNacional ? 'primary' : 'secondary') : 'default'}
                          variant={estaIncluida ? 'filled' : 'outlined'}
                          sx={{
                            fontWeight: estaIncluida ? 700 : 500,
                            opacity: estaIncluida ? 1 : 0.45,
                            transition: 'all 0.2s ease',
                          }}
                        />
                      );
                    })}
                  </Box>

                  <Divider sx={{ my: 2.5 }} />

                  <Box sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', p: 2, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      CONTROL DE VIGENCIA HISTÓRICA:
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}>
                      Cualquier adición o retiro de regiones se versiona con fecha de inicio y término, garantizando que el consumo histórico de faenas previas se mantenga strictly inmutable.
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <PublicIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Seleccione una macrozona en la lista para ver su detalle territorial.
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog: Formulario Crear / Editar Macrozona */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 800, pb: 1 }}>
          {form.id ? 'Editar Macrozona' : 'Nueva Macrozona'}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {formError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          {/* Fila 1: Nombre, Código y Switches */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre de la Macrozona *"
                placeholder="Ej. Macrozona Norte, Centro-Sur..."
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Código Identificador"
                placeholder="Ej. MZ-NORTE"
                value={form.codigo}
                onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.activo}
                    onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                    color="success"
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Activa</Typography>}
              />
            </Grid>
          </Grid>

          {/* Descripción */}
          <TextField
            fullWidth
            label="Descripción o Alcance"
            placeholder="Detalles sobre decretos, cobertura o zonas marítimas asociadas..."
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            multiline
            rows={2}
          />

          {/* Switch Macrozona Nacional */}
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: form.esNacional ? 'primary.50' : 'background.default',
              border: 1,
              borderColor: form.esNacional ? 'primary.main' : 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease',
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Macrozona de Alcance Nacional
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Al activar esta opción, la macrozona incluye automáticamente las 16 regiones de Chile y se utiliza como Cuota Nacional.
              </Typography>
            </Box>
            <Switch
              checked={form.esNacional}
              onChange={(e) => handleEsNacionalChange(e.target.checked)}
              color="primary"
            />
          </Box>

          {/* Grilla de selección de regiones */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                Regiones que integran la macrozona ({form.regionIds.length} de {regiones.length} seleccionadas):
              </Typography>

              {!form.esNacional && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<SelectAllIcon />}
                    onClick={seleccionarTodas}
                    variant="text"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Seleccionar Todas
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeselectIcon />}
                    onClick={limpiarSeleccion}
                    variant="text"
                    color="inherit"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Limpiar
                  </Button>
                </Box>
              )}
            </Box>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                maxHeight: 280,
                overflowY: 'auto',
                bgcolor: form.esNacional ? 'action.hover' : 'background.paper',
              }}
            >
              <Grid container spacing={1}>
                {regiones.map((reg) => {
                  const checked = form.esNacional || form.regionIds.includes(reg.id);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={reg.id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={checked}
                            onChange={() => toggleRegion(reg.id)}
                            disabled={form.esNacional}
                            color="secondary"
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: checked ? 700 : 400 }}>
                            {reg.codigo ? `[${reg.codigo}] ` : ''}{reg.nombre}
                          </Typography>
                        }
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleGuardar}
            disabled={saving}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar Macrozona'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmar Desactivación */}
      <Dialog
        open={Boolean(porEliminar)}
        onClose={() => setPorEliminar(null)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          Confirmar Desactivación
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Está seguro de que desea desactivar la macrozona <strong>«{porEliminar?.nombre}»</strong>?
            No se eliminará el histórico de faenas ni cuotas asignadas, pero ya no aparecerá como opción activa para nuevas configuraciones.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPorEliminar(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button onClick={handleEliminar} color="error" variant="contained" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Desactivar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
