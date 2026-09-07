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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  Search as SearchIcon,
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  DateRange as DateRangeIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

/** Normaliza "yyyy-MM-dd" para inputs type=date */
const aInputDate = (v) => (v ? String(v).slice(0, 10) : '');

const FORM_VACIO = {
  id: null,
  especie: null,
  humedadEstado: null,
  factor: '1.0000',
  vigenciaInicio: new Date().toISOString().slice(0, 10),
  vigenciaFin: '',
  resolucion: '',
  descripcion: '',
  activo: true,
};

export default function FactoresConversionMaestro() {
  const [factores, setFactores] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [humedadEstados, setHumedadEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [soloActivos, setSoloActivos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [soloActivos]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resFactores, resMaestros] = await Promise.all([
        api.get(`/api/factores-conversion?soloActivos=${soloActivos}`),
        api.get('/api/cuotas/maestros'),
      ]);
      setFactores(Array.isArray(resFactores.data) ? resFactores.data : []);
      if (resMaestros.data) {
        setEspecies(resMaestros.data.especies || []);
        setHumedadEstados(resMaestros.data.humedadEstados || []);
      }
    } catch (err) {
      console.error('Error cargando factores de conversión:', err);
      setErrorMsg('No se pudieron cargar los factores de conversión.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNuevo = () => {
    setFormData({
      ...FORM_VACIO,
      especie: especies[0] || null,
      humedadEstado: humedadEstados[0] || null,
      vigenciaInicio: new Date().toISOString().slice(0, 10),
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEditar = (factor) => {
    setFormData({
      id: factor.id,
      especie: especies.find((e) => e.id === factor.especie?.id) || factor.especie || null,
      humedadEstado: humedadEstados.find((h) => h.id === factor.humedadEstado?.id) || factor.humedadEstado || null,
      factor: factor.factor != null ? String(factor.factor) : '1.0000',
      vigenciaInicio: aInputDate(factor.vigenciaInicio),
      vigenciaFin: aInputDate(factor.vigenciaFin),
      resolucion: factor.resolucion || '',
      descripcion: factor.descripcion || '',
      activo: factor.activo ?? true,
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!formData.especie?.id) {
      setErrorMsg('Debe seleccionar una especie.');
      return;
    }
    if (!formData.humedadEstado?.id) {
      setErrorMsg('Debe seleccionar un estado de humedad.');
      return;
    }
    const numFactor = parseFloat(formData.factor);
    if (isNaN(numFactor) || numFactor <= 0) {
      setErrorMsg('El factor de conversión debe ser un número decimal mayor que cero.');
      return;
    }
    if (!formData.vigenciaInicio) {
      setErrorMsg('Debe especificar la fecha de inicio de vigencia.');
      return;
    }
    if (formData.vigenciaFin && formData.vigenciaFin < formData.vigenciaInicio) {
      setErrorMsg('La fecha de fin de vigencia no puede ser anterior a la de inicio.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const payload = {
        especie: { id: formData.especie.id },
        humedadEstado: { id: formData.humedadEstado.id },
        factor: numFactor,
        vigenciaInicio: formData.vigenciaInicio ? `${formData.vigenciaInicio}T00:00:00.000Z` : null,
        vigenciaFin: formData.vigenciaFin ? `${formData.vigenciaFin}T23:59:59.000Z` : null,
        resolucion: formData.resolucion.trim() || null,
        descripcion: formData.descripcion.trim() || null,
        activo: Boolean(formData.activo),
      };

      if (formData.id) {
        await api.put(`/api/factores-conversion/${formData.id}`, payload);
        setSuccessMsg('Factor de conversión actualizado correctamente.');
      } else {
        await api.post('/api/factores-conversion', payload);
        setSuccessMsg('Factor de conversión registrado correctamente.');
      }

      setModalOpen(false);
      cargarDatos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error guardando factor de conversión:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al guardar el factor de conversión.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/api/factores-conversion/${itemToDelete.id}`);
      setSuccessMsg('Factor de conversión eliminado correctamente.');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      cargarDatos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error eliminando factor:', err);
      setErrorMsg('No se pudo eliminar el factor. Es posible que ya esté referenciado en declaraciones históricas.');
      setDeleteConfirmOpen(false);
    }
  };

  const factoresFiltrados = useMemo(() => {
    const q = search.toLowerCase().trim();
    return factores.filter((f) => {
      const esp = (f.especie?.nombre || '').toLowerCase();
      const hum = (f.humedadEstado?.nombre || f.humedadEstado?.estado || '').toLowerCase();
      const res = (f.resolucion || '').toLowerCase();
      const desc = (f.descripcion || '').toLowerCase();
      return !q || esp.includes(q) || hum.includes(q) || res.includes(q) || desc.includes(q);
    });
  }, [factores, search]);

  return (
    <Box>
      {/* Banner explicativo del Indicador 2 */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(16, 185, 129, 0.03) 100%)',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <ScienceIcon color="secondary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
              Indicador 2: Factores de Conversión Biológica (Captura Corregida)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', lineHeight: 1.6 }}>
            Define la equivalencia biológica oficial entre el <strong>desembarque físico (kg)</strong> y la <strong>captura corregida (kg)</strong> según especie y estado de humedad (húmedo, semi-seco, seco). Los factores poseen vigencia temporal para respaldar resoluciones de Subpesca y congelar el histórico sin alterar declaraciones pasadas.
          </Typography>
        </CardContent>
      </Card>

      {/* Alertas */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* Barra de herramientas */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por especie, humedad o resolución..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: 260, sm: 340 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={soloActivos}
                onChange={(e) => setSoloActivos(e.target.checked)}
                color="secondary"
              />
            }
            label={<Typography variant="body2" sx={{ fontFamily: 'Inter' }}>Solo Activos</Typography>}
          />
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={handleOpenNuevo}
          sx={{
            borderRadius: 2.5,
            textTransform: 'none',
            fontFamily: 'Outfit',
            fontWeight: 600,
            px: 2.5,
          }}
        >
          Nuevo Factor
        </Button>
      </Box>

      {/* Tabla de Factores */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Estado Humedad</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Factor Biológico</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Vigencia Inicio</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Vigencia Fin</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Resolución</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} color="secondary" />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      Cargando factores de conversión...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : factoresFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No se encontraron factores de conversión registrados.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                factoresFiltrados.map((item) => (
                  <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {item.especie?.nombre || `Especie ID ${item.especie?.id}`}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.humedadEstado?.nombre || item.humedadEstado?.estado || 'N/A'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: (t) =>
                            item.humedadEstado?.nombre?.toLowerCase().includes('seco')
                              ? 'rgba(234, 179, 8, 0.15)'
                              : 'rgba(14, 165, 233, 0.15)',
                          color: (t) =>
                            item.humedadEstado?.nombre?.toLowerCase().includes('seco')
                              ? '#ca8a04'
                              : 'secondary.main',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                      {parseFloat(item.factor || 1).toFixed(4)}
                    </TableCell>
                    <TableCell>
                      {item.vigenciaInicio ? String(item.vigenciaInicio).slice(0, 10) : '—'}
                    </TableCell>
                    <TableCell>
                      {item.vigenciaFin ? (
                        String(item.vigenciaFin).slice(0, 10)
                      ) : (
                        <Chip label="Indefinida" size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.resolucion ? (
                        <Tooltip title={item.descripcion || item.resolucion}>
                          <Typography variant="body2" sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.resolucion}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.activo ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={item.activo ? 'success' : 'default'}
                        variant={item.activo ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Editar Factor">
                          <IconButton size="small" onClick={() => handleOpenEditar(item)} color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Factor">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setItemToDelete(item);
                              setDeleteConfirmOpen(true);
                            }}
                            color="error"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal de Creación / Edición */}
      <Dialog
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700, pb: 1 }}>
          {formData.id ? 'Editar Factor de Conversión' : 'Nuevo Factor de Conversión'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <Autocomplete
            options={especies}
            getOptionLabel={(opt) => opt.nombre || `ID ${opt.id}`}
            value={formData.especie}
            onChange={(e, val) => setFormData((p) => ({ ...p, especie: val }))}
            renderInput={(params) => (
              <TextField {...params} label="Especie de Alga *" placeholder="Seleccione especie" />
            )}
          />

          <Autocomplete
            options={humedadEstados}
            getOptionLabel={(opt) => opt.nombre || opt.estado || `ID ${opt.id}`}
            value={formData.humedadEstado}
            onChange={(e, val) => setFormData((p) => ({ ...p, humedadEstado: val }))}
            renderInput={(params) => (
              <TextField {...params} label="Estado de Humedad *" placeholder="Ej. Húmedo, Seco..." />
            )}
          />

          <TextField
            label="Factor de Conversión (Multiplicador Decimal) *"
            type="number"
            inputProps={{ step: '0.0001', min: '0.0001' }}
            value={formData.factor}
            onChange={(e) => setFormData((p) => ({ ...p, factor: e.target.value }))}
            helperText="Equivalencia para convertir kg declarados a captura biológica. Ej: 3.5800 para alga seca, 1.0000 para húmeda."
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Vigencia Desde *"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.vigenciaInicio}
              onChange={(e) => setFormData((p) => ({ ...p, vigenciaInicio: e.target.value }))}
            />
            <TextField
              label="Vigencia Hasta (Opcional)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.vigenciaFin}
              onChange={(e) => setFormData((p) => ({ ...p, vigenciaFin: e.target.value }))}
              helperText="Dejar vacío si rige indefinidamente."
            />
          </Box>

          <TextField
            label="Resolución / Decreto Respaldo"
            value={formData.resolucion}
            onChange={(e) => setFormData((p) => ({ ...p, resolucion: e.target.value }))}
            placeholder="Ej. Res. Ex. Subpesca Nº 142/2024"
          />

          <TextField
            label="Descripción o Nota Técnica (Opcional)"
            multiline
            rows={2}
            value={formData.descripcion}
            onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Observaciones de aplicación, laboratorio o porcentaje de humedad de referencia."
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.activo}
                onChange={(e) => setFormData((p) => ({ ...p, activo: e.target.checked }))}
                color="secondary"
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Factor Activo en el Motor de Reglas</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setModalOpen(false)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleGuardar}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar Factor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          ¿Eliminar Factor de Conversión?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ¿Estás seguro de que deseas eliminar el factor de conversión para{' '}
            <strong>{itemToDelete?.especie?.nombre}</strong> (
            {itemToDelete?.humedadEstado?.nombre || itemToDelete?.humedadEstado?.estado}) de{' '}
            <strong>{itemToDelete?.factor}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleEliminar}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
