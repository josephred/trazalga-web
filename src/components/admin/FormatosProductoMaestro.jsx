import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Category as CategoryIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';
import {
  actualizarProductoAdmin,
  cambiarEstadoProductoAdmin,
  crearProductoAdmin,
  getProductosAdmin,
} from '../../services/adminService';
import ImportarCatalogoDialog from './ImportarCatalogoDialog';

const FORM_VACIO = {
  id: null,
  codigo: '',
  nombre: '',
  descripcion: '',
  presentacion: '',
  calibre: '',
  humedadEstado: null,
  especie: null,
  activo: true,
  fuente: 'LOCAL',
};

export default function FormatosProductoMaestro() {
  const [productos, setProductos] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [humedadEstados, setHumedadEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [soloActivos, setSoloActivos] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [lista, resMaestros] = await Promise.all([
        getProductosAdmin(),
        api.get('/api/cuotas/maestros'),
      ]);
      setProductos(Array.isArray(lista) ? lista : []);
      if (resMaestros?.data) {
        setEspecies(resMaestros.data.especies || []);
        const hums = [...(resMaestros.data.humedadEstados || [])].sort((a, b) => a.id - b.id);
        setHumedadEstados(hums);
      }
    } catch (err) {
      console.error('Error cargando catálogo de formatos:', err);
      setErrorMsg('No se pudo cargar el catálogo de formatos de producto.');
    } finally {
      setLoading(false);
    }
  };

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productos.filter((p) => {
      if (soloActivos && p.activo === false) return false;
      if (!q) return true;
      return (
        (p.codigo || '').toLowerCase().includes(q) ||
        (p.nombre || '').toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q) ||
        (p.presentacion || '').toLowerCase().includes(q) ||
        (p.calibre || '').toLowerCase().includes(q) ||
        (p.humedadEstadoNombre || '').toLowerCase().includes(q) ||
        (p.especieNombre || '').toLowerCase().includes(q)
      );
    });
  }, [productos, search, soloActivos]);

  const handleOpenNuevo = () => {
    setFormData(FORM_VACIO);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEditar = (item) => {
    setFormData({
      id: item.id,
      codigo: item.codigo || '',
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      presentacion: item.presentacion || '',
      calibre: item.calibre || '',
      humedadEstado: humedadEstados.find((h) => h.id === item.humedadEstadoId) || null,
      especie: especies.find((e) => e.id === item.especieId) || null,
      activo: item.activo !== false,
      fuente: item.fuente || 'LOCAL',
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!formData.nombre || !formData.nombre.trim()) {
      setErrorMsg('El nombre del formato es obligatorio.');
      return;
    }
    try {
      setSaving(true);
      setErrorMsg(null);
      const payload = {
        codigo: formData.codigo?.trim() ? formData.codigo.trim().toUpperCase() : null,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        presentacion: formData.presentacion?.trim() || null,
        calibre: formData.calibre?.trim() || null,
        humedadEstadoId: formData.humedadEstado?.id || null,
        especieId: formData.especie?.id || null,
        activo: !!formData.activo,
        fuente: formData.fuente || 'LOCAL',
      };
      if (formData.id) {
        await actualizarProductoAdmin(formData.id, payload);
        setSuccessMsg('Formato actualizado correctamente.');
      } else {
        await crearProductoAdmin(payload);
        setSuccessMsg('Formato creado correctamente.');
      }
      setModalOpen(false);
      await cargarDatos();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al guardar el formato.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (item) => {
    try {
      await cambiarEstadoProductoAdmin(item.id, item.activo === false);
      setSuccessMsg(`Formato "${item.nombre}" ${item.activo === false ? 'activado' : 'desactivado'}.`);
      await cargarDatos();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'No se pudo cambiar el estado del formato.');
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <CategoryIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Catálogo de Formatos de Producto (NF.1 / NF.3)
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Asocia código oficial, estado de humedad del formato (usado en Rendimiento) y especie opcional.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => setImportDialogOpen(true)}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Importar catálogo
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenNuevo}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Nuevo formato
              </Button>
            </Grid>
          </Grid>

          {errorMsg && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}
          {successMsg && (
            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setSuccessMsg(null)}>
              {successMsg}
            </Alert>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mt: 3, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Buscar por código, nombre, humedad o especie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 300, flexGrow: 1, maxWidth: 460 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={<Switch checked={soloActivos} onChange={(e) => setSoloActivos(e.target.checked)} size="small" />}
                label={<Typography variant="body2">Solo activos</Typography>}
              />
              <Chip label={`${filtrados.length} de ${productos.length} formatos`} size="small" variant="outlined" />
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Nombre / Descripción</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Especie</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Presentación</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Calibre</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Humedad</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Usos</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No se encontraron formatos con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtrados.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          {item.codigo ? (
                            <Chip label={item.codigo} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Sin código
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.nombre}
                          </Typography>
                          {item.descripcion && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {item.descripcion}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={item.especieNombre ? 'text.primary' : 'text.secondary'}>
                            {item.especieNombre || 'Cualquier especie'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={item.presentacion ? 'text.primary' : 'text.secondary'}>
                            {item.presentacion || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={item.calibre ? 'text.primary' : 'text.secondary'}>
                            {item.calibre || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {item.humedadEstadoNombre ? (
                            <Chip label={item.humedadEstadoNombre} size="small" />
                          ) : (
                            <Typography variant="caption" color="warning.main">
                              Sin asignar
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={`Producción: ${item.usosProduccion ?? 0} · Destino: ${item.usosDestino ?? 0}`}>
                            <Chip
                              label={item.usosTotales ?? 0}
                              size="small"
                              color={(item.usosTotales ?? 0) > 0 ? 'info' : 'default'}
                              variant="outlined"
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            <Switch
                              size="small"
                              checked={item.activo !== false}
                              onChange={() => handleToggleActivo(item)}
                              color="success"
                            />
                            <Chip
                              label={item.activo !== false ? 'Activo' : 'Inactivo'}
                              size="small"
                              color={item.activo !== false ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Editar formato">
                            <IconButton size="small" onClick={() => handleOpenEditar(item)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear / Editar Formato */}
      <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {formData.id ? 'Editar formato de producto' : 'Nuevo formato de producto'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                size="small"
                label="Código oficial"
                placeholder="Ej: SER-SECO-01"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                helperText="Opcional hasta importar catálogo Sernapesca"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                fullWidth
                required
                size="small"
                label="Nombre del formato"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={humedadEstados}
                getOptionLabel={(o) => o?.nombre || ''}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                value={formData.humedadEstado}
                onChange={(_, v) => setFormData({ ...formData, humedadEstado: v })}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Humedad del formato" helperText="Usada para calcular rendimiento (NP.4)" />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={especies}
                getOptionLabel={(o) => o?.nombre || ''}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                value={formData.especie}
                onChange={(_, v) => setFormData({ ...formData, especie: v })}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Especie (opcional)" helperText="Vacío = válido para cualquier especie" />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Presentación"
                placeholder="Ej: PICADA, ENTERO, POLVO"
                value={formData.presentacion}
                onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Calibre (opcional)"
                placeholder="Ej: 3/4, FINO, FARDO"
                value={formData.calibre}
                onChange={(e) => setFormData({ ...formData, calibre: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Descripción"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    color="success"
                  />
                }
                label="Formato activo (visible en selectores de Producción y Destino)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleGuardar} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ImportarCatalogoDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImportacionExitosa={cargarDatos}
      />
    </Box>
  );
}

