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
  Tooltip,
  Tabs,
  Tab,
  LinearProgress
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
  LocationOn as LocationOnIcon,
  Scale as ScaleIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
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

  // Modal para editar centroide / coordenadas GPS
  const [modalCoordOpen, setModalCoordOpen] = useState(false);
  const [coordLat, setCoordLat] = useState('');
  const [coordLon, setCoordLon] = useState('');
  const [savingCoord, setSavingCoord] = useState(false);

  // TM.5: Gestión de Cuotas AMERB
  const [subTab, setSubTab] = useState(0); // 0: Especies Habilitadas, 1: Cuotas AMERB
  const [cuotasAmerb, setCuotasAmerb] = useState([]);
  const [loadingCuotas, setLoadingCuotas] = useState(false);
  const [extraccionTipos, setExtraccionTipos] = useState([]);
  const [modalCuotaOpen, setModalCuotaOpen] = useState(false);
  const [formCuota, setFormCuota] = useState({
    especieId: '',
    extraccionTipoId: '',
    limiteKg: '',
    resolucion: '',
    fechaInicio: '',
    fechaFin: '',
    metrica: 'CAPTURA'
  });
  const [savingCuota, setSavingCuota] = useState(false);
  const [cuotaError, setCuotaError] = useState(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const handleOpenCoordModal = () => {
    if (!selectedAmerb) return;
    setCoordLat(selectedAmerb.latitud != null ? String(selectedAmerb.latitud) : '');
    setCoordLon(selectedAmerb.longitud != null ? String(selectedAmerb.longitud) : '');
    setModalCoordOpen(true);
  };

  const handleGuardarCoordenadas = async () => {
    if (!selectedAmerb) return;
    setSavingCoord(true);
    try {
      const latNum = coordLat.trim() !== '' ? parseFloat(coordLat.replace(',', '.')) : null;
      const lonNum = coordLon.trim() !== '' ? parseFloat(coordLon.replace(',', '.')) : null;

      const payload = {
        ...selectedAmerb,
        latitud: latNum,
        longitud: lonNum
      };

      const res = await api.post('/api/amerbs', payload);
      const updated = res.data || payload;

      setSelectedAmerb(updated);
      setAmerbs(prev => prev.map(a => a.id === updated.id ? updated : a));
      setMensaje({ type: 'success', text: `Coordenadas de centroide actualizadas para ${updated.nombre}.` });
      setModalCoordOpen(false);
    } catch (err) {
      console.error('Error al actualizar coordenadas AMERB:', err);
      setMensaje({ type: 'error', text: 'Error al guardar las coordenadas del AMERB.' });
    } finally {
      setSavingCoord(false);
    }
  };

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      const [resAmerb, resEsp, resMaestros] = await Promise.all([
        api.get('/api/amerbs'),
        api.get('/api/especies'),
        api.get('/api/cuotas/maestros').catch(() => ({ data: {} }))
      ]);
      const dataAmerb = Array.isArray(resAmerb.data) ? resAmerb.data : [];
      setAmerbs(dataAmerb);
      setEspecies(Array.isArray(resEsp.data) ? resEsp.data : []);
      if (resMaestros?.data?.extraccionTipos) {
        setExtraccionTipos(resMaestros.data.extraccionTipos);
      }
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

  const cargarCuotasAmerb = async (amerbId) => {
    if (!amerbId) return;
    setLoadingCuotas(true);
    try {
      const res = await api.get('/api/cuotas/listado', {
        params: { ambito: 'AMERB', amerbId }
      });
      setCuotasAmerb(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al cargar cuotas AMERB:', err);
      setCuotasAmerb([]);
    } finally {
      setLoadingCuotas(false);
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
    cargarCuotasAmerb(amerb.id);
  };

  const handleOpenModal = () => {
    setFormEspecieId('');
    setFormResolucion('');
    setModalOpen(true);
  };

  // Manejador apertura modal cuota AMERB (TM.5)
  const handleOpenModalCuota = () => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const iniStr = `${anio}-01-01`;
    const finStr = `${anio + 1}-12-31`; // Default 24 meses

    setFormCuota({
      especieId: habilitadas.length > 0 && habilitadas[0].especie?.id ? String(habilitadas[0].especie.id) : '',
      extraccionTipoId: extraccionTipos.length > 0 ? String(extraccionTipos[0].id) : '',
      limiteKg: '',
      resolucion: selectedAmerb?.codigoSernapesca ? `Res. Ex. AMERB ${selectedAmerb.codigoSernapesca}` : '',
      fechaInicio: iniStr,
      fechaFin: finStr,
      metrica: 'CAPTURA'
    });
    setCuotaError(null);
    setModalCuotaOpen(true);
  };

  // Guardar cuota AMERB con validación de vigencia <= 24 meses y resolución obligatoria (TM.5)
  const handleGuardarCuotaAmerb = async () => {
    if (!formCuota.especieId) {
      setCuotaError('Debe seleccionar la especie para la cuota.');
      return;
    }
    if (!formCuota.extraccionTipoId) {
      setCuotaError('Debe seleccionar el método de extracción.');
      return;
    }
    const limiteNum = parseFloat(formCuota.limiteKg);
    if (!limiteNum || limiteNum <= 0) {
      setCuotaError('El límite en kg debe ser un número positivo mayor que 0.');
      return;
    }
    if (!formCuota.resolucion || !formCuota.resolucion.trim()) {
      setCuotaError('La resolución oficial de Subpesca es obligatoria para decretar cuota AMERB (TM.5).');
      return;
    }
    if (!formCuota.fechaInicio || !formCuota.fechaFin) {
      setCuotaError('Debe definir la vigencia oficial (fecha inicio y fecha término).');
      return;
    }

    const ini = new Date(formCuota.fechaInicio);
    const fin = new Date(formCuota.fechaFin);
    if (fin < ini) {
      setCuotaError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    // Validación rigurosa de vigencia de hasta 24 meses (TM.5 / D12)
    const diffMonths = (fin.getFullYear() - ini.getFullYear()) * 12 + (fin.getMonth() - ini.getMonth());
    if (diffMonths > 24) {
      setCuotaError(`La vigencia de la cuota AMERB (${diffMonths} meses) excede el máximo permitido de 24 meses.`);
      return;
    }

    setSavingCuota(true);
    setCuotaError(null);
    try {
      const payload = {
        ambito: 'AMERB',
        nivelAgregacion: 'COMUNA',
        amerbId: selectedAmerb.id,
        regionId: selectedAmerb.regionModel?.id || null,
        comunaId: selectedAmerb.comuna?.id || null,
        especieId: Number(formCuota.especieId),
        extraccionTipoId: Number(formCuota.extraccionTipoId),
        limiteKg: limiteNum,
        resolucion: formCuota.resolucion.trim(),
        fechaInicio: formCuota.fechaInicio,
        fechaFin: formCuota.fechaFin,
        periodo: 'ANUAL',
        metrica: formCuota.metrica || 'CAPTURA',
        modoAccion: 'SOLO_ALERTA',
        activo: true
      };

      await api.post('/api/cuotas', payload);
      setMensaje({ type: 'success', text: `Cuota AMERB de ${limiteNum.toLocaleString('es-CL')} kg decretada exitosamente.` });
      setModalCuotaOpen(false);
      cargarCuotasAmerb(selectedAmerb.id);
    } catch (err) {
      console.error('Error al guardar cuota AMERB:', err);
      const msg = err.response?.data?.message || err.message || 'Error al registrar la cuota AMERB.';
      setCuotaError(msg);
    } finally {
      setSavingCuota(false);
    }
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<LocationOnIcon />}
                        onClick={handleOpenCoordModal}
                        sx={{
                          borderColor: '#ec4899',
                          color: '#ec4899',
                          '&:hover': { borderColor: '#db2777', bgcolor: 'rgba(236,72,153,0.06)' },
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontFamily: 'Outfit',
                          fontWeight: 600
                        }}
                      >
                        Centroide GPS
                      </Button>
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
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Centroide Geográfico Oficial (GPS)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: selectedAmerb.latitud != null ? 'text.primary' : 'warning.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOnIcon sx={{ fontSize: 16, color: selectedAmerb.latitud != null ? 'success.main' : 'warning.main' }} />
                        {selectedAmerb.latitud != null && selectedAmerb.longitud != null
                          ? `(${selectedAmerb.latitud.toFixed(4)}, ${selectedAmerb.longitud.toFixed(4)})`
                          : 'Sin coordenadas (Modo degradado: informa sin referencia)'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Pestañas: Especies Habilitadas vs Cuotas AMERB (TM.5) */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
                  <Tabs
                    value={subTab}
                    onChange={(e, val) => setSubTab(val)}
                    textColor="secondary"
                    indicatorColor="secondary"
                  >
                    <Tab
                      icon={<AssignmentTurnedInIcon sx={{ fontSize: 18 }} />}
                      iconPosition="start"
                      label={`Especies Habilitadas (${habilitadas.length})`}
                      sx={{ fontFamily: 'Outfit', fontWeight: 700, textTransform: 'none', fontSize: '0.85rem' }}
                    />
                    <Tab
                      icon={<ScaleIcon sx={{ fontSize: 18 }} />}
                      iconPosition="start"
                      label={`Cuotas AMERB (${cuotasAmerb.length})`}
                      sx={{ fontFamily: 'Outfit', fontWeight: 700, textTransform: 'none', fontSize: '0.85rem' }}
                    />
                  </Tabs>
                </Box>

                {/* SubTab 0: Grilla de especies habilitadas */}
                {subTab === 0 && (
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentTurnedInIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        <Typography variant="subtitle1" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                          Especies Habilitadas por Resolución Oficial
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
                )}

                {/* SubTab 1: Cuotas AMERB (TM.5) */}
                {subTab === 1 && (
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScaleIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
                        <Typography variant="subtitle1" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                          Cuotas Decretadas de {selectedAmerb.nombre}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleOpenModalCuota}
                        sx={{
                          bgcolor: '#8b5cf6',
                          '&:hover': { bgcolor: '#7c3aed' },
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontFamily: 'Outfit',
                          fontWeight: 600
                        }}
                      >
                        Nueva Cuota AMERB
                      </Button>
                    </Box>

                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.85rem' }}>
                      Las cuotas AMERB regulan la extracción exclusiva de organizaciones titulares amparadas por decretos Subpesca. Vigencia autorizada de hasta 24 meses (TM.5).
                    </Typography>

                    {loadingCuotas ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={28} />
                      </Box>
                    ) : cuotasAmerb.length === 0 ? (
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
                          No hay cuotas decretadas para esta área de manejo.
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          Utilice el botón "Nueva Cuota AMERB" para asociar una cuota con resolución oficial y vigencia de hasta 24 meses.
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50') }}>
                              <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie / Método</TableCell>
                              <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Vigencia</TableCell>
                              <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Límite</TableCell>
                              <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Consumo</TableCell>
                              <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Resolución</TableCell>
                              <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Estado</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {cuotasAmerb.map((c) => {
                              const estaCerrada = (c.estado || '').toUpperCase() === 'CERRADA';
                              const limite = c.limiteEfectivo != null ? c.limiteEfectivo : (c.limiteKg || 0);
                              const pct = c.porcentajeUso != null ? c.porcentajeUso : 0;
                              return (
                                <TableRow key={c.id} hover>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                                      {c.especieNombre || 'Sin especie'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {c.extraccionTipoNombre || 'Todos los métodos'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                      {c.vigenciaDescripcion || c.periodo}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                                      {Number(limite).toLocaleString('es-CL')} kg
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                      {(limite / 1000).toFixed(1)} t ({c.metrica || 'CAPTURA'})
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ minWidth: 140 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                        {Number(c.consumoAcumulado || 0).toLocaleString('es-CL')} kg
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: pct >= 100 ? 'error.main' : 'text.secondary', fontWeight: 700 }}>
                                        {pct}%
                                      </Typography>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={Math.min(100, pct)}
                                      color={pct >= 100 ? 'error' : pct >= 80 ? 'warning' : 'primary'}
                                      sx={{ height: 6, borderRadius: 3 }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontSize: '0.82rem', fontFamily: 'Inter' }}>
                                      {c.resolucion || '—'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      icon={estaCerrada ? <LockIcon sx={{ fontSize: 13 }} /> : <LockOpenIcon sx={{ fontSize: 13 }} />}
                                      label={estaCerrada ? 'Cerrada' : 'Abierta'}
                                      size="small"
                                      color={estaCerrada ? 'error' : 'success'}
                                      variant={estaCerrada ? 'filled' : 'outlined'}
                                      sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700 }}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}
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

      {/* Modal para Editar Coordenadas Centroide */}
      <Dialog open={modalCoordOpen} onClose={() => !savingCoord && setModalCoordOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
          Centroide GPS de {selectedAmerb?.nombre}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.85rem' }}>
            Ingrese las coordenadas geográficas oficiales (formato decimal WGS84) del centroide del polígono AMERB para contraste contra GPS móvil (Indicador 9).
          </Typography>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Latitud (°)"
              placeholder="Ej: -29.9533"
              value={coordLat}
              onChange={(e) => setCoordLat(e.target.value)}
              helperText="Formato decimal (ej: -29.9533)"
            />
            <TextField
              fullWidth
              size="small"
              label="Longitud (°)"
              placeholder="Ej: -71.3395"
              value={coordLon}
              onChange={(e) => setCoordLon(e.target.value)}
              helperText="Formato decimal (ej: -71.3395)"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setModalCoordOpen(false)} disabled={savingCoord} sx={{ fontFamily: 'Inter' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardarCoordenadas}
            disabled={savingCoord}
            sx={{
              bgcolor: '#ec4899',
              '&:hover': { bgcolor: '#db2777' },
              fontFamily: 'Outfit',
              fontWeight: 600
            }}
          >
            {savingCoord ? <CircularProgress size={20} /> : 'Guardar Coordenadas'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para Crear Cuota AMERB (TM.5) */}
      <Dialog open={modalCuotaOpen} onClose={() => !savingCuota && setModalCuotaOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScaleIcon sx={{ color: '#8b5cf6' }} />
          Nueva Cuota AMERB: {selectedAmerb?.nombre}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cuotaError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {cuotaError}
              </Alert>
            )}

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Las cuotas de extracción decretadas para AMERB exigen resolución oficial y vigencia de hasta 24 meses (TM.5 / D12).
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Especie Autorizada *</InputLabel>
              <Select
                value={formCuota.especieId}
                label="Especie Autorizada *"
                onChange={(e) => setFormCuota({ ...formCuota, especieId: e.target.value })}
              >
                {/* Priorizar especies habilitadas del AMERB */}
                {habilitadas.length > 0 ? (
                  habilitadas.map((h) => (
                    <MenuItem key={h.especie?.id} value={h.especie?.id}>
                      {h.especie?.nombre} {h.resolucion ? `(Hab. ${h.resolucion})` : ''}
                    </MenuItem>
                  ))
                ) : (
                  especies.map((esp) => (
                    <MenuItem key={esp.id} value={esp.id}>
                      {esp.nombre} {esp.nombreCientifico ? `(${esp.nombreCientifico})` : ''}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Método de Extracción *</InputLabel>
              <Select
                value={formCuota.extraccionTipoId}
                label="Método de Extracción *"
                onChange={(e) => setFormCuota({ ...formCuota, extraccionTipoId: e.target.value })}
              >
                {extraccionTipos.map((et) => (
                  <MenuItem key={et.id} value={et.id}>
                    {et.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              type="number"
              label="Límite Autorizado (kg) *"
              placeholder="Ej: 50000"
              value={formCuota.limiteKg}
              onChange={(e) => setFormCuota({ ...formCuota, limiteKg: e.target.value })}
              helperText={formCuota.limiteKg ? `Equivale a ${(parseFloat(formCuota.limiteKg) / 1000 || 0).toFixed(2)} toneladas` : ''}
            />

            <TextField
              fullWidth
              size="small"
              label="Resolución Oficial Subpesca *"
              placeholder="Ej: Res. Ex. Nº 1892/2026 Subpesca"
              value={formCuota.resolucion}
              onChange={(e) => setFormCuota({ ...formCuota, resolucion: e.target.value })}
              helperText="Obligatoria para amparar legalmente la cuota del área de manejo."
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Inicio *"
                  InputLabelProps={{ shrink: true }}
                  value={formCuota.fechaInicio}
                  onChange={(e) => setFormCuota({ ...formCuota, fechaInicio: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Fin (Máx. 24 meses) *"
                  InputLabelProps={{ shrink: true }}
                  value={formCuota.fechaFin}
                  onChange={(e) => setFormCuota({ ...formCuota, fechaFin: e.target.value })}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth size="small">
              <InputLabel>Métrica de Descuento</InputLabel>
              <Select
                value={formCuota.metrica}
                label="Métrica de Descuento"
                onChange={(e) => setFormCuota({ ...formCuota, metrica: e.target.value })}
              >
                <MenuItem value="CAPTURA">CAPTURA (biológica corregida por factor de humedad)</MenuItem>
                <MenuItem value="DESEMBARQUE">DESEMBARQUE (kilos físicos sin corregir)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setModalCuotaOpen(false)} disabled={savingCuota} sx={{ fontFamily: 'Inter' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardarCuotaAmerb}
            disabled={savingCuota || !formCuota.especieId || !formCuota.limiteKg || !formCuota.resolucion}
            sx={{
              bgcolor: '#8b5cf6',
              '&:hover': { bgcolor: '#7c3aed' },
              fontFamily: 'Outfit',
              fontWeight: 600
            }}
          >
            {savingCuota ? <CircularProgress size={20} /> : 'Guardar Cuota AMERB'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
