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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
  Anchor as AnchorIcon,
  HelpOutline as HelpOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

export default function CaletasMaestro() {
  const [caletas, setCaletas] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [varaderos, setVaraderos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterEstadoGeo, setFilterEstadoGeo] = useState('TODOS');
  const [mensaje, setMensaje] = useState(null);

  // Modal para editar caleta
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCaleta, setEditingCaleta] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [formLatitud, setFormLatitud] = useState('');
  const [formLongitud, setFormLongitud] = useState('');
  const [formVaraderoId, setFormVaraderoId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resCaletas, resRegiones, resComunas, resVaraderos] = await Promise.allSettled([
        api.get('/api/caletas'),
        api.get('/region'),
        api.get('/comuna'),
        api.get('/varadero')
      ]);

      if (resCaletas.status === 'fulfilled' && Array.isArray(resCaletas.value.data)) {
        setCaletas(resCaletas.value.data);
      }
      if (resRegiones.status === 'fulfilled' && Array.isArray(resRegiones.value.data)) {
        setRegiones(resRegiones.value.data);
      }
      if (resComunas.status === 'fulfilled' && Array.isArray(resComunas.value.data)) {
        setComunas(resComunas.value.data);
      }
      if (resVaraderos.status === 'fulfilled' && Array.isArray(resVaraderos.value.data)) {
        setVaraderos(resVaraderos.value.data);
      }
    } catch (err) {
      console.error('Error al cargar datos de caletas:', err);
      setMensaje({ type: 'error', text: 'Error al conectar con el servidor para cargar caletas.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (caleta) => {
    setEditingCaleta(caleta);
    setFormNombre(caleta.nombre || '');
    setFormLatitud(caleta.latitud != null ? String(caleta.latitud) : '');
    setFormLongitud(caleta.longitud != null ? String(caleta.longitud) : '');
    setFormVaraderoId(caleta.varadero ? String(caleta.varadero.id) : '');
    setModalOpen(true);
  };

  const handleCopiarVaradero = () => {
    if (!formVaraderoId) return;
    const v = varaderos.find(item => String(item.id) === String(formVaraderoId));
    if (v && v.latitud != null && v.longitud != null) {
      setFormLatitud(String(v.latitud));
      setFormLongitud(String(v.longitud));
    } else {
      setMensaje({ type: 'warning', text: 'El varadero seleccionado no cuenta con coordenadas GPS cargadas.' });
    }
  };

  const handleGuardar = async () => {
    if (!editingCaleta) return;
    setSaving(true);
    try {
      const latNum = formLatitud.trim() !== '' ? parseFloat(formLatitud.replace(',', '.')) : null;
      const lonNum = formLongitud.trim() !== '' ? parseFloat(formLongitud.replace(',', '.')) : null;

      let varaderoObj = null;
      if (formVaraderoId) {
        varaderoObj = varaderos.find(v => String(v.id) === String(formVaraderoId)) || { id: Number(formVaraderoId) };
      }

      const payload = {
        ...editingCaleta,
        nombre: formNombre.trim(),
        latitud: latNum,
        longitud: lonNum,
        varadero: varaderoObj
      };

      const res = await api.put(`/api/caletas/${editingCaleta.id}`, payload);
      const updated = res.data || payload;

      setCaletas(prev => prev.map(c => c.id === updated.id ? updated : c));
      setMensaje({ type: 'success', text: `Coordenadas y datos actualizados para caleta ${updated.nombre}.` });
      setModalOpen(false);
    } catch (err) {
      console.error('Error al guardar caleta:', err);
      setMensaje({ type: 'error', text: 'Error al actualizar las coordenadas de la caleta.' });
    } finally {
      setSaving(false);
    }
  };

  const getEstadoGeo = (c) => {
    if (c.latitud != null && c.longitud != null) return 'DIRECTA';
    if (c.varadero && c.varadero.latitud != null && c.varadero.longitud != null) return 'VARADERO';
    return 'SIN_REFERENCIA';
  };

  const filteredCaletas = caletas.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      (c.nombre && c.nombre.toLowerCase().includes(term)) ||
      (c.comuna?.nombre && c.comuna.nombre.toLowerCase().includes(term)) ||
      (c.region?.nombre && c.region.nombre.toLowerCase().includes(term)) ||
      (c.varadero?.nombre && c.varadero.nombre.toLowerCase().includes(term));

    const matchRegion = !filterRegion || (c.region && String(c.region.id) === String(filterRegion));

    const estadoGeo = getEstadoGeo(c);
    const matchEstado =
      filterEstadoGeo === 'TODOS' ||
      (filterEstadoGeo === 'DIRECTA' && estadoGeo === 'DIRECTA') ||
      (filterEstadoGeo === 'VARADERO' && estadoGeo === 'VARADERO') ||
      (filterEstadoGeo === 'SIN_REFERENCIA' && estadoGeo === 'SIN_REFERENCIA');

    return matchSearch && matchRegion && matchEstado;
  });

  const countDirecta = caletas.filter(c => getEstadoGeo(c) === 'DIRECTA').length;
  const countVaradero = caletas.filter(c => getEstadoGeo(c) === 'VARADERO').length;
  const countSinRef = caletas.filter(c => getEstadoGeo(c) === 'SIN_REFERENCIA').length;

  return (
    <Box sx={{ width: '100%' }}>
      {mensaje && (
        <Alert
          severity={mensaje.type}
          onClose={() => setMensaje(null)}
          sx={{ mb: 3, borderRadius: 3, fontFamily: 'Inter' }}
        >
          {mensaje.text}
        </Alert>
      )}

      {/* Tarjeta de Resumen y Métricas de Georreferenciación */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
              Coordenadas Oficiales Propias
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5, fontFamily: 'Outfit' }}>
              {countDirecta} <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>caletas</Typography>
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Coordenadas directas verificadas (lat/lon).
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
              Fallback vía Varadero
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'warning.main', mt: 0.5, fontFamily: 'Outfit' }}>
              {countVaradero} <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>caletas</Typography>
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Hereda coordenadas del varadero asociado.
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
              Sin Referencia GPS
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.disabled', mt: 0.5, fontFamily: 'Outfit' }}>
              {countSinRef} <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>caletas</Typography>
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Modo degradado: informa sin generar marca.
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Controles de Búsqueda y Filtros */}
      <Card elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3.5, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por caleta, comuna o varadero..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Región</InputLabel>
              <Select
                value={filterRegion}
                label="Región"
                onChange={(e) => setFilterRegion(e.target.value)}
              >
                <MenuItem value="">Todas las Regiones</MenuItem>
                {regiones.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado Georreferenciación</InputLabel>
              <Select
                value={filterEstadoGeo}
                label="Estado Georreferenciación"
                onChange={(e) => setFilterEstadoGeo(e.target.value)}
              >
                <MenuItem value="TODOS">Todos los Estados</MenuItem>
                <MenuItem value="DIRECTA">Coordenada Directa Oficial</MenuItem>
                <MenuItem value="VARADERO">Fallback vía Varadero</MenuItem>
                <MenuItem value="SIN_REFERENCIA">Sin Coordenadas (Modo Degradado)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={cargarDatos}
              disabled={loading}
              sx={{ textTransform: 'none', fontFamily: 'Outfit', fontWeight: 600, borderRadius: 2.5 }}
            >
              Actualizar
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Tabla Principal de Caletas */}
      <Card elevation={0} sx={{ borderRadius: 4, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Caleta</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Comuna / Región</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Varadero Asociado</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Coordenadas Oficiales (GPS)</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Estado Indicador 9</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>Cargando catálogo de caletas...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredCaletas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>No se encontraron caletas que coincidan con los filtros.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCaletas.map((c) => {
                  const estado = getEstadoGeo(c);
                  return (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'text.secondary' }}>
                        #{c.id}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                          {c.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'Inter' }}>
                          {c.comuna?.nombre || '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {c.region?.nombre || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {c.varadero ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AnchorIcon sx={{ fontSize: 14, color: 'info.main' }} />
                            <Typography variant="body2" sx={{ fontFamily: 'Inter' }}>
                              {c.varadero.nombre}
                            </Typography>
                            {c.varadero.latitud != null && (
                              <Tooltip title={`Varadero GPS: (${c.varadero.latitud?.toFixed(4)}, ${c.varadero.longitud?.toFixed(4)})`}>
                                <LocationOnIcon sx={{ fontSize: 14, color: 'success.main' }} />
                              </Tooltip>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>Sin varadero</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {c.latitud != null && c.longitud != null ? (
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {c.latitud.toFixed(4)}, {c.longitud.toFixed(4)}
                          </Typography>
                        ) : c.varadero && c.varadero.latitud != null ? (
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'warning.main', fontWeight: 600 }}>
                            {c.varadero.latitud.toFixed(4)}, {c.varadero.longitud.toFixed(4)} (Varadero)
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            Sin coordenadas
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {estado === 'DIRECTA' && (
                          <Chip
                            label="Coordenada Directa"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        )}
                        {estado === 'VARADERO' && (
                          <Chip
                            label="Fallback Varadero"
                            color="warning"
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        )}
                        {estado === 'SIN_REFERENCIA' && (
                          <Chip
                            label="Sin Referencia"
                            size="small"
                            sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.secondary' }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEdit(c)}
                          sx={{ textTransform: 'none', fontFamily: 'Inter', fontWeight: 600, py: 0.2 }}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal para Editar Caleta y Coordenadas */}
      <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          Editar Coordenadas: {editingCaleta?.nombre}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, fontSize: '0.85rem' }}>
            Ajusta las coordenadas geográficas oficiales de la caleta. Estas coordenadas se emplean como punto de referencia contra el GPS de la app móvil para detectar el indicador ORIGEN_GEO_INCONSISTENTE (T9.1 / T9.3).
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Nombre de Caleta"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Varadero Asociado</InputLabel>
              <Select
                value={formVaraderoId}
                label="Varadero Asociado"
                onChange={(e) => setFormVaraderoId(e.target.value)}
              >
                <MenuItem value="">Sin Varadero</MenuItem>
                {varaderos.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.nombre} {v.latitud != null ? `(GPS: ${v.latitud.toFixed(4)}, ${v.longitud.toFixed(4)})` : '(Sin GPS)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formVaraderoId && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="text"
                  color="warning"
                  startIcon={<AnchorIcon />}
                  onClick={handleCopiarVaradero}
                  sx={{ textTransform: 'none', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Adoptar Coordenadas del Varadero
                </Button>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Latitud Oficial (°)"
                  placeholder="Ej: -29.9533"
                  value={formLatitud}
                  onChange={(e) => setFormLatitud(e.target.value)}
                  helperText="Formato decimal WGS84"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Longitud Oficial (°)"
                  placeholder="Ej: -71.3395"
                  value={formLongitud}
                  onChange={(e) => setFormLongitud(e.target.value)}
                  helperText="Formato decimal WGS84"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setModalOpen(false)} disabled={saving} sx={{ fontFamily: 'Inter' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardar}
            disabled={saving}
            sx={{
              bgcolor: 'secondary.main',
              '&:hover': { bgcolor: '#0284c7' },
              fontFamily: 'Outfit',
              fontWeight: 600
            }}
          >
            {saving ? <CircularProgress size={20} /> : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
