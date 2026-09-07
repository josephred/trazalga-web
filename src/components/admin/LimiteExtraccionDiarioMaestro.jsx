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
  Slider,
  Tooltip,
  InputAdornment,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  FormControl,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  Search as SearchIcon,
  Speed as SpeedIcon,
  DirectionsBoat as DirectionsBoatIcon,
  Person as PersonIcon,
  Pool as PoolIcon,
  Block as BlockIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

const aInputDate = (v) => (v ? String(v).slice(0, 10) : '');

const FORM_VACIO = {
  id: null,
  nombreRegla: '',
  especie: null,
  extraccionTipo: null,
  region: null,
  perfilAplicable: 'ARMADOR',
  unidadAgregacion: 'EMBARCACION',
  metrica: 'DESEMBARQUE',
  limiteKg: 2000,
  margenToleranciaPct: 0,
  modoAccion: 'SOLO_ALERTA',
  vigenciaInicio: new Date().toISOString().slice(0, 10),
  vigenciaFin: '',
  activo: true,
};

const fmtKg = (n) =>
  `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(n ?? 0)} kg`;

export default function LimiteExtraccionDiarioMaestro() {
  const [reglas, setReglas] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [extraccionTipos, setExtraccionTipos] = useState([]);
  const [regiones, setRegiones] = useState([]);
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
      const [resReglas, resMaestros] = await Promise.all([
        api.get(`/api/limites-extraccion-diario?soloActivos=${soloActivos}`),
        api.get('/api/cuotas/maestros'),
      ]);
      setReglas(Array.isArray(resReglas.data) ? resReglas.data : []);
      if (resMaestros.data) {
        setEspecies(resMaestros.data.especies || []);
        setExtraccionTipos(resMaestros.data.extraccionTipos || []);
        setRegiones(resMaestros.data.regiones || []);
      }
    } catch (err) {
      console.error('Error cargando reglas LED:', err);
      setErrorMsg('No se pudieron cargar las reglas de límite de extracción diario.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNuevo = () => {
    setFormData({
      ...FORM_VACIO,
      nombreRegla: 'LED Diario Oficial',
      vigenciaInicio: new Date().toISOString().slice(0, 10),
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEditar = (regla) => {
    setFormData({
      id: regla.id,
      nombreRegla: regla.nombreRegla || '',
      especie: especies.find((e) => e.id === regla.especie?.id) || regla.especie || null,
      extraccionTipo: extraccionTipos.find((et) => et.id === regla.extraccionTipo?.id) || regla.extraccionTipo || null,
      region: regiones.find((r) => r.id === regla.region?.id) || regla.region || null,
      perfilAplicable: regla.perfilAplicable || 'ARMADOR',
      unidadAgregacion: regla.unidadAgregacion || 'EMBARCACION',
      metrica: regla.metrica || 'DESEMBARQUE',
      limiteKg: regla.limiteKg != null ? Number(regla.limiteKg) : 2000,
      margenToleranciaPct: regla.margenToleranciaPct != null ? Number(regla.margenToleranciaPct) : 0,
      modoAccion: regla.modoAccion || 'SOLO_ALERTA',
      vigenciaInicio: aInputDate(regla.vigenciaInicio),
      vigenciaFin: aInputDate(regla.vigenciaFin),
      activo: regla.activo ?? true,
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!formData.nombreRegla.trim()) {
      setErrorMsg('Debe ingresar un nombre descriptivo para la regla.');
      return;
    }
    const numLimite = parseFloat(formData.limiteKg);
    if (isNaN(numLimite) || numLimite <= 0) {
      setErrorMsg('El límite diario en kg debe ser un número mayor a 0.');
      return;
    }
    if (!formData.vigenciaInicio) {
      setErrorMsg('Debe indicar la fecha de inicio de vigencia.');
      return;
    }
    if (formData.vigenciaFin && formData.vigenciaFin < formData.vigenciaInicio) {
      setErrorMsg('La fecha de fin de vigencia no puede ser anterior al inicio.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const payload = {
        nombreRegla: formData.nombreRegla.trim(),
        especie: formData.especie ? { id: formData.especie.id } : null,
        extraccionTipo: formData.extraccionTipo ? { id: formData.extraccionTipo.id } : null,
        region: formData.region ? { id: formData.region.id } : null,
        perfilAplicable: formData.perfilAplicable,
        unidadAgregacion: formData.unidadAgregacion,
        metrica: formData.metrica,
        limiteKg: numLimite,
        margenToleranciaPct: parseFloat(formData.margenToleranciaPct || 0),
        modoAccion: formData.modoAccion,
        vigenciaInicio: formData.vigenciaInicio ? `${formData.vigenciaInicio}T00:00:00.000Z` : null,
        vigenciaFin: formData.vigenciaFin ? `${formData.vigenciaFin}T23:59:59.000Z` : null,
        activo: Boolean(formData.activo),
      };

      if (formData.id) {
        await api.put(`/api/limites-extraccion-diario/${formData.id}`, payload);
        setSuccessMsg('Regla de límite diario actualizada correctamente.');
      } else {
        await api.post('/api/limites-extraccion-diario', payload);
        setSuccessMsg('Regla de límite diario creada correctamente.');
      }

      setModalOpen(false);
      cargarDatos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error guardando regla LED:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al guardar la regla LED.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/api/limites-extraccion-diario/${itemToDelete.id}`);
      setSuccessMsg('Regla LED eliminada correctamente.');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      cargarDatos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error eliminando regla LED:', err);
      setErrorMsg('No se pudo eliminar la regla.');
      setDeleteConfirmOpen(false);
    }
  };

  const reglasFiltradas = useMemo(() => {
    const q = search.toLowerCase().trim();
    return reglas.filter((r) => {
      const nom = (r.nombreRegla || '').toLowerCase();
      const esp = (r.especie?.nombre || '').toLowerCase();
      const met = (r.extraccionTipo?.nombre || '').toLowerCase();
      const reg = (r.region?.nombre || '').toLowerCase();
      return !q || nom.includes(q) || esp.includes(q) || met.includes(q) || reg.includes(q);
    });
  }, [reglas, search]);

  const getUnidadIcon = (u) => {
    switch (u) {
      case 'EMBARCACION':
        return <DirectionsBoatIcon sx={{ fontSize: 16 }} />;
      case 'BUZO':
        return <PoolIcon sx={{ fontSize: 16 }} />;
      case 'USUARIO':
      default:
        return <PersonIcon sx={{ fontSize: 16 }} />;
    }
  };

  return (
    <Box>
      {/* Banner explicativo del Indicador 4 */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(234, 179, 8, 0.06) 0%, rgba(14, 165, 233, 0.03) 100%)',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <SpeedIcon color="warning" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
              Indicador 4: Límite de Extracción Diario (LED)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', lineHeight: 1.6 }}>
            Configura los límites máximos diarios en kilogramos (por defecto <strong>2.000 kg</strong> físicos por <strong>Embarcación</strong> en huiro palo por barreteado). Permite parametrizar el perfil aplicable, la unidad de acumulación (embarcación, usuario o buzo), la métrica evaluada (desembarque o captura) y el modo de acción (alerta o bloqueo estricto con HTTP 422).
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
            placeholder="Buscar por regla, especie o método..."
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
          Nueva Regla LED
        </Button>
      </Box>

      {/* Tabla de Reglas LED */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Regla</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Método</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Región</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Agrupación</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Límite Diario</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Tolerancia</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Modo Acción</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} color="secondary" />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      Cargando reglas de límite diario...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : reglasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No se encontraron reglas LED configuradas.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reglasFiltradas.map((item) => (
                  <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {item.nombreRegla}
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        Perfil: {item.perfilAplicable || 'TODOS'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.especie ? (
                        <Chip label={item.especie.nombre} size="small" variant="outlined" />
                      ) : (
                        <Chip label="Todas las especies" size="small" sx={{ opacity: 0.7 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.extraccionTipo ? (
                        <Chip label={item.extraccionTipo.nombre} size="small" color="primary" variant="outlined" />
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Todos</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.region ? item.region.nombre : <Typography variant="caption" sx={{ color: 'text.secondary' }}>Nacional</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getUnidadIcon(item.unidadAgregacion)}
                        label={item.unidadAgregacion || 'EMBARCACION'}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                      {fmtKg(item.limiteKg)}
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem' }}>
                        en {item.metrica || 'DESEMBARQUE'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`+${item.margenToleranciaPct || 0}%`}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: (item.margenToleranciaPct || 0) > 0 ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={item.modoAccion === 'BLOQUEO_DECLARACION' ? <BlockIcon sx={{ fontSize: 14 }} /> : <NotificationsActiveIcon sx={{ fontSize: 14 }} />}
                        label={item.modoAccion === 'BLOQUEO_DECLARACION' ? 'Bloqueo' : 'Alerta'}
                        size="small"
                        color={item.modoAccion === 'BLOQUEO_DECLARACION' ? 'error' : 'warning'}
                        variant={item.modoAccion === 'BLOQUEO_DECLARACION' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
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
                        <Tooltip title="Editar Regla LED">
                          <IconButton size="small" onClick={() => handleOpenEditar(item)} color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Regla">
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
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700, pb: 1 }}>
          {formData.id ? 'Editar Regla de Límite Diario (LED)' : 'Nueva Regla de Límite Diario (LED)'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <TextField
            label="Nombre de la Regla *"
            placeholder="Ej. LED Oficial Huiro Palo Barreteado"
            value={formData.nombreRegla}
            onChange={(e) => setFormData((p) => ({ ...p, nombreRegla: e.target.value }))}
            fullWidth
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <Autocomplete
              options={especies}
              getOptionLabel={(opt) => opt.nombre || `ID ${opt.id}`}
              value={formData.especie}
              onChange={(e, val) => setFormData((p) => ({ ...p, especie: val }))}
              renderInput={(params) => (
                <TextField {...params} label="Especie (opcional: Todas)" placeholder="Cualquiera" />
              )}
            />

            <Autocomplete
              options={extraccionTipos}
              getOptionLabel={(opt) => opt.nombre || `ID ${opt.id}`}
              value={formData.extraccionTipo}
              onChange={(e, val) => setFormData((p) => ({ ...p, extraccionTipo: val }))}
              renderInput={(params) => (
                <TextField {...params} label="Método Extracción (opcional)" placeholder="Cualquiera" />
              )}
            />

            <Autocomplete
              options={regiones}
              getOptionLabel={(opt) => opt.nombre || `ID ${opt.id}`}
              value={formData.region}
              onChange={(e, val) => setFormData((p) => ({ ...p, region: val }))}
              renderInput={(params) => (
                <TextField {...params} label="Región (opcional)" placeholder="Nacional" />
              )}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <TextField
              select
              label="Perfil Aplicable"
              value={formData.perfilAplicable}
              onChange={(e) => setFormData((p) => ({ ...p, perfilAplicable: e.target.value }))}
            >
              <MenuItem value="ARMADOR">ARMADOR (Embarcación)</MenuItem>
              <MenuItem value="RECOLECTOR">RECOLECTOR (Orilla)</MenuItem>
              <MenuItem value="TODOS">TODOS</MenuItem>
            </TextField>

            <TextField
              select
              label="Unidad de Acumulación *"
              value={formData.unidadAgregacion}
              onChange={(e) => setFormData((p) => ({ ...p, unidadAgregacion: e.target.value }))}
              helperText="Agrupa por embarcación, usuario o buzo"
            >
              <MenuItem value="EMBARCACION">Embarcación (recomendado)</MenuItem>
              <MenuItem value="USUARIO">Usuario declarante</MenuItem>
              <MenuItem value="BUZO">Buzo participante</MenuItem>
            </TextField>

            <TextField
              select
              label="Métrica Evaluada *"
              value={formData.metrica}
              onChange={(e) => setFormData((p) => ({ ...p, metrica: e.target.value }))}
            >
              <MenuItem value="DESEMBARQUE">Desembarque Físico (kg)</MenuItem>
              <MenuItem value="CAPTURA">Captura Corregida (kg)</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Límite Diario en Kilogramos (kg) *"
              type="number"
              inputProps={{ min: '1', step: '10' }}
              value={formData.limiteKg}
              onChange={(e) => setFormData((p) => ({ ...p, limiteKg: e.target.value }))}
              InputProps={{
                endAdornment: <InputAdornment position="end">kg / día</InputAdornment>,
              }}
              helperText="2.000 kg según resolución oficial para huiro palo"
            />

            <Box sx={{ px: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                Margen de Tolerancia Adicional: {formData.margenToleranciaPct}%
              </Typography>
              <Slider
                value={formData.margenToleranciaPct}
                onChange={(e, val) => setFormData((p) => ({ ...p, margenToleranciaPct: val }))}
                min={0}
                max={20}
                step={0.5}
                valueLabelDisplay="auto"
                color="secondary"
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Límite con tolerancia:{' '}
                <strong>
                  {fmtKg(Number(formData.limiteKg || 0) * (1 + Number(formData.margenToleranciaPct || 0) / 100))}
                </strong>
              </Typography>
            </Box>
          </Box>

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
              helperText="Dejar vacío si aplica permanentemente."
            />
          </Box>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1 }}>
                Modo de Acción ante Exceso del Límite Diario:
              </FormLabel>
              <RadioGroup
                row
                value={formData.modoAccion}
                onChange={(e) => setFormData((p) => ({ ...p, modoAccion: e.target.value }))}
              >
                <FormControlLabel
                  value="SOLO_ALERTA"
                  control={<Radio color="secondary" />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Solo Alerta</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Permite guardar la declaración, registra la marca LED_EXCEDIDO y notifica a fiscalización.
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="BLOQUEO_DECLARACION"
                  control={<Radio color="error" />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>Bloqueo Estricto (HTTP 422)</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Impide emitir la declaración si la suma del día excede el límite + tolerancia.
                      </Typography>
                    </Box>
                  }
                  sx={{ mt: 1 }}
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={formData.activo}
                onChange={(e) => setFormData((p) => ({ ...p, activo: e.target.checked }))}
                color="secondary"
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Regla Activa en el Servidor</Typography>}
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
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar Regla LED'}
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
          ¿Eliminar Regla LED?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ¿Estás seguro de que deseas eliminar la regla <strong>{itemToDelete?.nombreRegla}</strong>?
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
