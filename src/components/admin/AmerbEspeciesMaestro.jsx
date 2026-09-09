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
  Terrain as TerrainIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Phishing as PhishingIcon,
  Refresh as RefreshIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

export default function AmerbEspeciesMaestro() {
  const [amerbs, setAmerbs] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [selectedAmerb, setSelectedAmerb] = useState(null);
  const [habilitadas, setHabilitadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHabilitadas, setLoadingHabilitadas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mensaje, setMensaje] = useState(null);

  // Modal para agregar especie
  const [modalOpen, setModalOpen] = useState(false);
  const [formEspecieId, setFormEspecieId] = useState('');
  const [formResolucion, setFormResolucion] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      const [resAmerb, resEsp] = await Promise.all([
        api.get('/api/amerbs'),
        api.get('/api/especies')
      ]);
      const dataAmerb = Array.isArray(resAmerb.data) ? resAmerb.data : [];
      setAmerbs(dataAmerb);
      setEspecies(Array.isArray(resEsp.data) ? resEsp.data : []);
      if (dataAmerb.length > 0 && !selectedAmerb) {
        seleccionarAmerb(dataAmerb[0]);
      }
    } catch (err) {
      console.error('Error al cargar datos de AMERB:', err);
      setMensaje({ type: 'error', text: 'Error al conectar con el servidor para cargar AMERBs.' });
    } finally {
      setLoading(false);
    }
  };

  const seleccionarAmerb = async (amerb) => {
    setSelectedAmerb(amerb);
    setLoadingHabilitadas(true);
    try {
      const res = await api.get(`/api/amerb-especies-habilitadas?amerbId=${amerb.id}`);
      setHabilitadas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al cargar especies habilitadas:', err);
      setHabilitadas([]);
    } finally {
      setLoadingHabilitadas(false);
    }
  };

  const handleOpenModal = () => {
    setFormEspecieId('');
    setFormResolucion('');
    setModalOpen(true);
  };

  const handleGuardarEspecie = async () => {
    if (!formEspecieId) {
      setMensaje({ type: 'error', text: 'Debe seleccionar una especie.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        amerb: { id: selectedAmerb.id },
        especie: { id: Number(formEspecieId) },
        resolucion: formResolucion || null,
        activo: true
      };
      await api.post('/api/amerb-especies-habilitadas', payload);
      setMensaje({ type: 'success', text: 'Especie habilitada exitosamente para el área de manejo.' });
      setModalOpen(false);
      seleccionarAmerb(selectedAmerb);
    } catch (err) {
      console.error('Error al habilitar especie:', err);
      setMensaje({ type: 'error', text: 'Error al registrar la especie habilitada.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarHabilitada = async (id) => {
    if (!window.confirm('¿Seguro que desea remover la autorización de esta especie en el AMERB?')) return;
    try {
      await api.delete(`/api/amerb-especies-habilitadas/${id}`);
      setMensaje({ type: 'success', text: 'Autorización de especie eliminada.' });
      seleccionarAmerb(selectedAmerb);
    } catch (err) {
      console.error('Error al eliminar especie habilitada:', err);
      setMensaje({ type: 'error', text: 'No se pudo remover la especie.' });
    }
  };

  const filteredAmerbs = amerbs.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      (a.nombre && a.nombre.toLowerCase().includes(term)) ||
      (a.codigoSernapesca && a.codigoSernapesca.toLowerCase().includes(term)) ||
      (a.region && a.region.toLowerCase().includes(term)) ||
      (a.titular && a.titular.toLowerCase().includes(term))
    );
  });

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

      <Grid container spacing={3}>
        {/* Panel izquierdo: Lista de AMERB */}
        <Grid item xs={12} md={5}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: 1,
              borderColor: 'divider',
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TerrainIcon sx={{ color: '#ec4899' }} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Áreas de Manejo (AMERB)
                </Typography>
              </Box>
              <IconButton size="small" onClick={cargarDatosIniciales} disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>

            <TextField
              size="small"
              placeholder="Buscar por nombre, código, región..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <Box sx={{ maxHeight: 520, overflowY: 'auto', pr: 0.5 }}>
                {filteredAmerbs.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                    No se encontraron áreas de manejo.
                  </Typography>
                ) : (
                  filteredAmerbs.map((amerb) => {
                    const isSelected = selectedAmerb?.id === amerb.id;
                    return (
                      <Box
                        key={amerb.id}
                        onClick={() => seleccionarAmerb(amerb)}
                        sx={{
                          p: 1.8,
                          mb: 1,
                          borderRadius: 3,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: '1px solid',
                          borderColor: isSelected ? '#ec4899' : 'divider',
                          bgcolor: isSelected
                            ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(236, 72, 153, 0.15)' : '#fdf2f8')
                            : 'background.paper',
                          '&:hover': {
                            borderColor: '#ec4899',
                            transform: 'translateX(3px)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary' }}>
                            {amerb.nombre}
                          </Typography>
                          {amerb.codigoSernapesca && (
                            <Chip
                              label={amerb.codigoSernapesca}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20, bgcolor: 'divider', fontWeight: 600 }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 13 }} />
                          {amerb.comuna?.nombre ? `${amerb.comuna.nombre}, ` : ''}{amerb.region || amerb.regionModel?.nombre || 'Región no especificada'}
                        </Typography>
                        {amerb.titular && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem', mt: 0.2 }}>
                            Titular: {amerb.titular}
                          </Typography>
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>
            )}
          </Card>
        </Grid>

        {/* Panel derecho: Detalle de AMERB y Especies Habilitadas */}
        <Grid item xs={12} md={7}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: 1,
              borderColor: 'divider',
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {selectedAmerb ? (
              <>
                {/* Cabecera del AMERB seleccionado */}
                <Box sx={{ pb: 2.5, mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary' }}>
                        {selectedAmerb.nombre}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', mt: 0.5 }}>
                        Código Oficial: <strong>{selectedAmerb.codigoSernapesca || 'Sin código'}</strong>
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleOpenModal}
                      sx={{
                        bgcolor: '#ec4899',
                        '&:hover': { bgcolor: '#db2777' },
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontFamily: 'Outfit',
                        fontWeight: 600
                      }}
                    >
                      Habilitar Especie
                    </Button>
                  </Box>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Región</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAmerb.region || selectedAmerb.regionModel?.nombre || '—'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Comuna</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAmerb.comuna?.nombre || '—'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Superficie</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAmerb.superficieHectareas ? `${selectedAmerb.superficieHectareas} ha` : '—'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Estado</Typography>
                      <Chip
                        label={selectedAmerb.estado || 'VIGENTE'}
                        size="small"
                        color={selectedAmerb.estado === 'CADUCADA' ? 'error' : 'success'}
                        sx={{ fontSize: '0.7rem', height: 22, fontWeight: 700 }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Grilla de especies habilitadas */}
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AssignmentTurnedInIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                      Especies Habilitadas por Resolución Oficial
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.85rem' }}>
                    Solo las especies aquí listadas pueden declararse y acumular cuota en esta AMERB. Si no se registra ninguna especie, rige la regla comodín (todas las especies autorizadas de forma general).
                  </Typography>

                  {loadingHabilitadas ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : habilitadas.length === 0 ? (
                    <Box
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'background.default'),
                        border: '1px dashed',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No hay restricciones específicas de especie registradas para esta área de manejo.
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        (Aplica regla general para todas las especies autorizadas en la región)
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50') }}>
                            <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Resolución</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Estado</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {habilitadas.map((item) => (
                            <TableRow key={item.id} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PhishingIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'Inter' }}>
                                    {item.especie?.nombre || 'Especie ID ' + item.especie?.id}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>
                                  {item.resolucion || 'Sin resolución específica'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={item.activo ? 'Habilitada' : 'Suspendida'}
                                  size="small"
                                  color={item.activo ? 'success' : 'default'}
                                  sx={{ fontSize: '0.7rem', height: 20, fontWeight: 700 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Remover autorización">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleEliminarHabilitada(item.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Seleccione un Área de Manejo en el panel izquierdo para gestionar sus especies habilitadas.
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Modal para Habilitar Especie */}
      <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          Habilitar Especie en {selectedAmerb?.nombre}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Especie Autorizada *</InputLabel>
              <Select
                value={formEspecieId}
                label="Especie Autorizada *"
                onChange={(e) => setFormEspecieId(e.target.value)}
              >
                {especies.map((esp) => (
                  <MenuItem key={esp.id} value={esp.id}>
                    {esp.nombre} {esp.nombreCientifico ? `(${esp.nombreCientifico})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Resolución / Decreto Subpesca"
              placeholder="Ej: Res. Ex. Nº 142/2024"
              value={formResolucion}
              onChange={(e) => setFormResolucion(e.target.value)}
              helperText="Indique el acto administrativo oficial que autoriza la extracción de la especie en esta AMERB."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setModalOpen(false)} disabled={saving} sx={{ fontFamily: 'Inter' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardarEspecie}
            disabled={saving || !formEspecieId}
            sx={{
              bgcolor: '#ec4899',
              '&:hover': { bgcolor: '#db2777' },
              fontFamily: 'Outfit',
              fontWeight: 600
            }}
          >
            {saving ? <CircularProgress size={20} /> : 'Guardar Autorización'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
