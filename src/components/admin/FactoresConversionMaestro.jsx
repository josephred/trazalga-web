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
  Switch,
  Tooltip,
  InputAdornment,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Grid,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  Search as SearchIcon,
  Science as ScienceIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Sync as SyncIcon,
  WarningAmber as WarningAmberIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
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

// Estados de humedad estándar (1 a 4)
const ESTADOS_HUMEDAD_DEFAULT = [
  { id: 1, nombre: 'Húmedo' },
  { id: 2, nombre: 'Semi Húmedo' },
  { id: 3, nombre: 'Semi Seco' },
  { id: 4, nombre: 'Seco' },
];

export default function FactoresConversionMaestro() {
  const [factores, setFactores] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [humedadEstados, setHumedadEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [soloActivos, setSoloActivos] = useState(false);
  const [vista, setVista] = useState('matriz'); // 'matriz' | 'lista'
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Estado para el modal de Recálculo Masivo
  const [recalculoModalOpen, setRecalculoModalOpen] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [recalculando, setRecalculando] = useState(false);
  const [recalculoResumen, setRecalculoResumen] = useState(null);
  const [recalculoError, setRecalculoError] = useState(null);

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
        const hums = resMaestros.data.humedadEstados || [];
        // Ordenar estados de humedad por ID ascendente (1 a 4)
        hums.sort((a, b) => a.id - b.id);
        setHumedadEstados(hums.length > 0 ? hums : ESTADOS_HUMEDAD_DEFAULT);
      }
    } catch (err) {
      console.error('Error cargando factores de conversión:', err);
      setErrorMsg('No se pudieron cargar los factores de conversión.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNuevo = (especiePrevia = null, humedadPrevia = null) => {
    setFormData({
      ...FORM_VACIO,
      especie: especiePrevia || especies[0] || null,
      humedadEstado: humedadPrevia || humedadEstados[0] || null,
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
    if (isNaN(numFactor) || numFactor < 1.0) {
      setErrorMsg('El factor de conversión debe ser mayor o igual a 1.0. La captura biológica nunca puede ser menor que el desembarque físico.');
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
        resolucion: formData.resolucion?.trim() || null,
        descripcion: formData.descripcion?.trim() || null,
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

  const handleEjecutarRecalculo = async () => {
    try {
      setRecalculando(true);
      setRecalculoError(null);
      const res = await api.post(`/api/factores-conversion/recalcular-historico?dryRun=${dryRun}`);
      setRecalculoResumen(res.data);
      if (!dryRun) {
        setSuccessMsg('Recálculo histórico aplicado y registrado en auditoría.');
        cargarDatos();
      }
    } catch (err) {
      console.error('Error en recálculo histórico:', err);
      setRecalculoError(err.response?.data?.message || err.message || 'Error al ejecutar el recálculo.');
    } finally {
      setRecalculando(false);
    }
  };

  // Agrupador para la vista de matriz
  const matrizDatos = useMemo(() => {
    const mapa = {};
    factores.forEach((f) => {
      const espId = f.especie?.id;
      const humId = f.humedadEstado?.id;
      if (!espId || !humId) return;

      const clave = `${espId}-${humId}`;
      if (!mapa[clave]) mapa[clave] = [];
      mapa[clave].push(f);
    });
    return mapa;
  }, [factores]);

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

  const especiesFiltradas = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return especies;
    return especies.filter((e) => (e.nombre || '').toLowerCase().includes(q));
  }, [especies, search]);

  // Identificador de especie oficial: todas las especies cuentan con factor oficial
  const esOficial = () => true;

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ScienceIcon color="secondary" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                  Matriz Oficial de Factores de Conversión Biológica (Indicador 2)
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', mt: 0.25 }}>
                  Define el factor multiplicador según especie y estado de humedad (captura = desembarque × factor).
                  Garantiza las 64 combinaciones vigentes oficiales de Sernapesca (13-09-2026).
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<SyncIcon />}
              onClick={() => {
                setRecalculoResumen(null);
                setRecalculoError(null);
                setDryRun(true);
                setRecalculoModalOpen(true);
              }}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, fontFamily: 'Outfit' }}
            >
              Recalcular Histórico
            </Button>
          </Box>
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
            placeholder="Filtrar por nombre de especie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: 240, sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <ToggleButtonGroup
            value={vista}
            exclusive
            onChange={(e, next) => next && setVista(next)}
            size="small"
            color="secondary"
          >
            <ToggleButton value="matriz" sx={{ textTransform: 'none', fontWeight: 600, px: 2 }}>
              <ViewModuleIcon sx={{ mr: 0.75, fontSize: 18 }} /> Matriz (16x4)
            </ToggleButton>
            <ToggleButton value="lista" sx={{ textTransform: 'none', fontWeight: 600, px: 2 }}>
              <ViewListIcon sx={{ mr: 0.75, fontSize: 18 }} /> Lista Detallada
            </ToggleButton>
          </ToggleButtonGroup>

          {vista === 'lista' && (
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
          )}
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenNuevo()}
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

      {/* VISTA 1: MATRIZ COMPLETA (16x4) */}
      {vista === 'matriz' ? (
        <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'grey.100') }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', width: '28%' }}>Especie de Alga</TableCell>
                  {humedadEstados.map((hum) => (
                    <TableCell key={hum.id} align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit', width: '18%' }}>
                      {hum.nombre}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={36} color="secondary" />
                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Cargando matriz de factores...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  especiesFiltradas.map((esp) => (
                    <TableRow key={esp.id} hover>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{esp.nombre}</span>
                          {esOficial(esp.id) ? (
                            <Chip label="Oficial" size="small" color="primary" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                          ) : (
                            <Chip label="Provisorio" size="small" color="default" sx={{ fontSize: '0.65rem', height: 18 }} />
                          )}
                        </Box>
                      </TableCell>

                      {humedadEstados.map((hum) => {
                        const listaCeldas = matrizDatos[`${esp.id}-${hum.id}`] || [];
                        const activas = listaCeldas.filter((f) => Boolean(f.activo));
                        const factorActivo = activas[0];
                        const hayDuplicados = activas.length > 1;
                        const estaVacia = activas.length === 0;
                        const esProvisorio = factorActivo && (
                          (factorActivo.descripcion || '').toLowerCase().includes('provisorio') ||
                          (factorActivo.descripcion || '').toLowerCase().includes('sin factor oficial') ||
                          (factorActivo.resolucion || '').toLowerCase().includes('provisorio')
                        );

                        return (
                          <TableCell key={hum.id} align="center" sx={{ p: 1.25 }}>
                            {estaVacia ? (
                              <Tooltip title="Sin factor vigente configurado. Clic para añadir.">
                                <Box
                                  onClick={() => handleOpenNuevo(esp, hum)}
                                  sx={{
                                    border: '1px dashed #cbd5e1',
                                    borderRadius: 2,
                                    py: 1,
                                    px: 1.5,
                                    bgcolor: 'rgba(239, 68, 68, 0.04)',
                                    color: 'error.main',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.5,
                                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main' }}>
                                    Vacía (+)
                                  </Typography>
                                </Box>
                              </Tooltip>
                            ) : (
                              <Box
                                onClick={() => handleOpenEditar(factorActivo)}
                                sx={{
                                  borderRadius: 2,
                                  p: 1,
                                  bgcolor: hayDuplicados
                                    ? 'rgba(245, 158, 11, 0.12)'
                                    : esProvisorio
                                    ? 'rgba(234, 179, 8, 0.08)'
                                    : 'rgba(14, 165, 233, 0.08)',
                                  border: 1,
                                  borderColor: hayDuplicados
                                    ? 'warning.main'
                                    : esProvisorio
                                    ? 'rgba(234, 179, 8, 0.3)'
                                    : 'secondary.light',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  '&:hover': {
                                    boxShadow: 2,
                                    transform: 'scale(1.02)',
                                  },
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                                    {parseFloat(factorActivo.factor || 1).toFixed(4)}
                                  </Typography>
                                  {hayDuplicados && (
                                    <Tooltip title={`¡Advertencia! Hay ${activas.length} filas vigentes para esta combinación.`}>
                                      <WarningAmberIcon color="warning" sx={{ fontSize: 16 }} />
                                    </Tooltip>
                                  )}
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5, gap: 0.5 }}>
                                  {esProvisorio && (
                                    <Chip
                                      label="1.0 Prov."
                                      size="small"
                                      sx={{
                                        fontSize: '0.65rem',
                                        height: 18,
                                        bgcolor: 'rgba(234, 179, 8, 0.2)',
                                        color: '#b45309',
                                        fontWeight: 700,
                                      }}
                                    />
                                  )}
                                  {!esProvisorio && (
                                    <Chip
                                      label="Oficial"
                                      size="small"
                                      sx={{
                                        fontSize: '0.65rem',
                                        height: 18,
                                        bgcolor: 'rgba(14, 165, 233, 0.2)',
                                        color: 'secondary.dark',
                                        fontWeight: 700,
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        /* VISTA 2: LISTA DETALLADA */
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
      )}

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
            inputProps={{ step: '0.0001', min: '1.0000' }}
            value={formData.factor}
            onChange={(e) => setFormData((p) => ({ ...p, factor: e.target.value }))}
            helperText="Equivalencia biológica (≥ 1.0000). Ej: 3.5800 para seco oficial, 1.1300 húmedo oficial, 1.0000 provisorio."
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
            label="Resolución / Respaldo Sernapesca"
            value={formData.resolucion}
            onChange={(e) => setFormData((p) => ({ ...p, resolucion: e.target.value }))}
            placeholder="Ej. Res. Ex. Sernapesca 13-09-2026"
          />

          <TextField
            label="Descripción o Nota Técnica"
            multiline
            rows={2}
            value={formData.descripcion}
            onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Ej. Valor provisorio 1,0 - sin factor oficial de Sernapesca al 13-09-2026"
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

      {/* Modal de Recálculo Masivo Histórico */}
      <Dialog
        open={recalculoModalOpen}
        onClose={() => !recalculando && setRecalculoModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          Recálculo Masivo de Captura Biológica Histórica
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <strong>Advertencia de impacto en cuotas:</strong> Al ejecutar este proceso de manera definitiva, la captura imputada a todas las declaraciones históricas será recalculada según la tabla de factores vigentes a su fecha de extracción. Esto incrementará la captura acumulada y puede provocar que varias cuotas pasen a estado <strong>excedido</strong>.
          </Alert>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  color="secondary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Modo Simulación (dryRun = {dryRun ? 'true' : 'false'})
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {dryRun
                      ? 'Calcula las variaciones y lista de regularización sin modificar la base de datos.'
                      : '¡ATENCIÓN! Modo de escritura: modificará declaraciones y registrará cambios en auditoría.'}
                  </Typography>
                </Box>
              }
            />
          </Box>

          {recalculoError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {recalculoError}
            </Alert>
          )}

          {recalculoResumen && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontFamily: 'Outfit' }}>
                Resultado del {recalculoResumen.dryRun ? 'Simulacro' : 'Recálculo Efectivo'}:
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary">Procesadas</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{recalculoResumen.totalProcesadas}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.08)' }}>
                    <Typography variant="caption" color="success.dark">Actualizadas</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>{recalculoResumen.totalActualizadas}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.08)' }}>
                    <Typography variant="caption" color="error.dark">Omitidas</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>{recalculoResumen.totalOmitidas}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: 'rgba(14, 165, 233, 0.08)' }}>
                    <Typography variant="caption" color="secondary.dark">Variación Total</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                      +{(recalculoResumen.variacionTotalKg || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })} kg
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {recalculoResumen.regularizaciones?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'warning.dark' }}>
                    Lista de Regularización ({recalculoResumen.regularizaciones.length} declaraciones):
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 150, borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Folio</TableCell>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Motivo</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recalculoResumen.regularizaciones.map((reg, i) => (
                          <TableRow key={i}>
                            <TableCell>{reg.tipoDeclaracion}</TableCell>
                            <TableCell>{reg.folio || reg.id}</TableCell>
                            <TableCell>{reg.fecha}</TableCell>
                            <TableCell>{reg.motivo}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRecalculoModalOpen(false)} disabled={recalculando}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            color={dryRun ? 'primary' : 'error'}
            onClick={handleEjecutarRecalculo}
            disabled={recalculando}
            startIcon={recalculando ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />}
            sx={{ fontWeight: 700, textTransform: 'none', px: 2.5 }}
          >
            {recalculando ? 'Procesando...' : dryRun ? 'Ejecutar Simulación' : 'Ejecutar Recálculo Definitivo'}
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
