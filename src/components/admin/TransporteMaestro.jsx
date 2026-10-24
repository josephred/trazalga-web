// src/components/admin/TransporteMaestro.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  LocalShipping as TruckIcon,
  Person as PersonIcon,
  WarningAmber as WarningIcon,
  CallMerge as MergeIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';
import { getPerfil } from '../../auth/sesion';

export default function TransporteMaestro() {
  const perfil = getPerfil();
  const esAdmin = perfil ? String(perfil).toUpperCase().includes('ADMIN') : false;

  const [subTab, setSubTab] = useState(0); // 0: Choferes, 1: Vehículos, 2: Revisar, 3: Duplicados
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // Datos
  const [choferes, setChoferes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [candidatos, setCandidatos] = useState([]);

  // Modales
  const [detalleChofer, setDetalleChofer] = useState(null);
  const [modalEditar, setModalEditar] = useState({ open: false, id: null, nombreActual: '' });
  const [modalFusion, setModalFusion] = useState({ open: false, origenId: null, destinoId: null, motivo: '' });
  const [reconstruyendo, setReconstruyendo] = useState(false);
  const [informeReconstruccion, setInformeReconstruccion] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [subTab]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      if (subTab === 0) {
        const res = await api.get('/transporte/transportistas', { params: { q: query || undefined } });
        setChoferes(res.data || []);
      } else if (subTab === 1) {
        const res = await api.get('/transporte/vehiculos', { params: { q: query || undefined } });
        setVehiculos(res.data || []);
      } else if (subTab === 2) {
        const res = await api.get('/transporte/transportistas', { params: { estado: 'REVISAR' } });
        setPendientes(res.data || []);
      } else if (subTab === 3) {
        const res = await api.get('/transporte/transportistas/candidatos');
        setCandidatos(res.data || []);
      }
    } catch (err) {
      console.error('Error cargando transporte:', err);
      setError('Error al obtener datos de transporte del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = () => {
    cargarDatos();
  };

  const handleLimpiarBusqueda = () => {
    setQuery('');
    setTimeout(() => cargarDatos(), 50);
  };

  const verDetalleChofer = async (id) => {
    try {
      const res = await api.get(`/transporte/transportistas/${id}`);
      setDetalleChofer(res.data);
    } catch (err) {
      console.error('Error al ver detalle:', err);
    }
  };

  const handleGuardarNombre = async () => {
    if (!modalEditar.nombreActual.trim()) return;
    try {
      await api.put(`/admin/transporte/transportistas/${modalEditar.id}`, {
        nombreCanonico: modalEditar.nombreActual.trim(),
      });
      setExito('Nombre canónico actualizado correctamente.');
      setModalEditar({ open: false, id: null, nombreActual: '' });
      cargarDatos();
    } catch (err) {
      setError('Error al actualizar nombre canónico.');
    }
  };

  const handleConfirmarChofer = async (id) => {
    try {
      await api.put(`/admin/transporte/transportistas/${id}`, { confirmar: true });
      setExito('Chofer confirmado como ACTIVO.');
      cargarDatos();
    } catch (err) {
      setError('Error al confirmar chofer.');
    }
  };

  const handleEjecutarFusion = async () => {
    if (!modalFusion.motivo.trim()) {
      setError('Debe indicar un motivo para la fusión.');
      return;
    }
    try {
      await api.post(`/admin/transporte/transportistas/${modalFusion.destinoId}/fusionar`, {
        origenId: modalFusion.origenId,
        motivo: modalFusion.motivo.trim(),
      });
      setExito('Fusión completada exitosamente.');
      setModalFusion({ open: false, origenId: null, destinoId: null, motivo: '' });
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al ejecutar fusión.');
    }
  };

  const handleReconstruirNomina = async () => {
    setReconstruyendo(true);
    setError(null);
    try {
      const res = await api.post('/admin/transporte/reconstruir');
      setInformeReconstruccion(res.data);
      setExito('Reconstrucción de nómina finalizada.');
      cargarDatos();
    } catch (err) {
      setError('Error al reconstruir nómina histórica.');
    } finally {
      setReconstruyendo(false);
    }
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2 } }}>
      {/* Cabecera y acciones */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Nómina de Transportistas y Vehículos
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Registro unificado de choferes, vehículos, alias declarados y candidatos a fusión (TT.1–TT.5).
          </Typography>
        </Box>

        {esAdmin && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={reconstruyendo ? <CircularProgress size={18} /> : <BuildIcon />}
            onClick={handleReconstruirNomina}
            disabled={reconstruyendo}
            sx={{ fontWeight: 700 }}
          >
            {reconstruyendo ? 'Reconstruyendo...' : 'Reconstruir Nómina Histórica'}
          </Button>
        )}
      </Stack>

      {/* Avisos */}
      {exito && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setExito(null)}>
          {exito}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Informe de reconstrucción */}
      {informeReconstruccion && (
        <Paper sx={{ p: 2, mb: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Resultado de Reconstrucción Histórica
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Despachos procesados:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {informeReconstruccion.declaracionesComercializadorProcesadas}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Recepciones procesadas:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {informeReconstruccion.declaracionesPlantaProcesadas}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Transportistas con RUT:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {informeReconstruccion.transportistasCreadosConRut}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Vehículos creados:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {informeReconstruccion.vehiculosCreados}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Selector de sub-vistas */}
      <Tabs
        value={subTab}
        onChange={(_, val) => setSubTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab icon={<PersonIcon />} iconPosition="start" label="Choferes" sx={{ fontWeight: 700 }} />
        <Tab icon={<TruckIcon />} iconPosition="start" label="Vehículos" sx={{ fontWeight: 700 }} />
        <Tab icon={<WarningIcon />} iconPosition="start" label="Pendientes de Revisión" sx={{ fontWeight: 700 }} />
        <Tab icon={<MergeIcon />} iconPosition="start" label="Posibles Duplicados" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* Buscador (para Choferes y Vehículos) */}
      {(subTab === 0 || subTab === 1) && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, maxWidth: 500 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={subTab === 0 ? "Buscar por RUT o nombre..." : "Buscar por patente..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleLimpiarBusqueda}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <Button variant="contained" size="small" onClick={handleBuscar} sx={{ fontWeight: 700 }}>
            Buscar
          </Button>
        </Stack>
      )}

      {/* Contenido según vista */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress size={36} />
        </Box>
      ) : subTab === 0 ? (
        /* VISTA 1: CHOFERES */
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Nombre Canónico</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>RUT</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {choferes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No se encontraron choferes registrados.
                  </TableCell>
                </TableRow>
              ) : (
                choferes.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>#{c.id}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{c.nombreCanonico}</TableCell>
                    <TableCell>{c.rut || <Chip label="Sin RUT" size="small" variant="outlined" />}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.estado}
                        size="small"
                        color={c.estado === 'ACTIVO' ? 'success' : c.estado === 'REVISAR' ? 'warning' : 'default'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => verDetalleChofer(c.id)}>
                        Ver detalle
                      </Button>
                      {esAdmin && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setModalEditar({ open: true, id: c.id, nombreActual: c.nombreCanonico })}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : subTab === 1 ? (
        /* VISTA 2: VEHÍCULOS */
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Patente</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Formato Válido</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Usado como Camión</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Usado como Rampla</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tipo Vehículo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehiculos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No se encontraron vehículos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                vehiculos.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{v.patente}</TableCell>
                    <TableCell>
                      <Chip
                        label={v.formatoValido ? 'Válido' : 'Inválido'}
                        size="small"
                        color={v.formatoValido ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{v.usadoComoCamion ? 'Sí' : 'No'}</TableCell>
                    <TableCell>{v.usadoComoRampla ? 'Sí' : 'No'}</TableCell>
                    <TableCell>{v.tipoVehiculo || 'No informado'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : subTab === 2 ? (
        /* VISTA 3: PENDIENTES DE REVISIÓN */
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Nombre Declarado</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>RUT Declarado</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Comercializador Ámbito</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No hay choferes pendientes de revisión.
                  </TableCell>
                </TableRow>
              ) : (
                pendientes.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>#{p.id}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{p.nombreCanonico}</TableCell>
                    <TableCell>{p.rut || 'Sin RUT'}</TableCell>
                    <TableCell>Comercializador #{p.comercializadorRef || '-'}</TableCell>
                    <TableCell align="right">
                      {esAdmin && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleConfirmarChofer(p.id)}
                        >
                          Confirmar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* VISTA 4: POSIBLES DUPLICADOS */
        <Stack spacing={2}>
          {candidatos.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary', border: '1px solid', borderColor: 'divider' }}>
              No se encontraron candidatos a fusión de nombres o duplicados.
            </Paper>
          ) : (
            candidatos.map((cand, idx) => (
              <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Chip
                          label={cand.motivoCandidatura}
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Similitud: {(cand.similitud * 100).toFixed(1)}%
                        </Typography>
                      </Stack>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            A: {cand.nombreCanonicoA} (#{cand.idA})
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            RUT: {cand.rutA || 'Sin RUT'} | Estado: {cand.estadoA}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            B: {cand.nombreCanonicoB} (#{cand.idB})
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            RUT: {cand.rutB || 'Sin RUT'} | Estado: {cand.estadoB}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {esAdmin && (
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<MergeIcon />}
                        onClick={() => setModalFusion({
                          open: true,
                          origenId: cand.idB,
                          destinoId: cand.idA,
                          motivo: `Fusión de «${cand.nombreCanonicoB}» en «${cand.nombreCanonicoA}» por similitud (${cand.motivoCandidatura})`
                        })}
                        sx={{ fontWeight: 700 }}
                      >
                        Fusionar B en A
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}

      {/* Modal Detalle Chofer */}
      <Dialog open={!!detalleChofer} onClose={() => setDetalleChofer(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Detalle del Transportista #{detalleChofer?.transportista?.id}
        </DialogTitle>
        <DialogContent dividers>
          {detalleChofer && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {detalleChofer.transportista.nombreCanonico}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  RUT: {detalleChofer.transportista.rut || 'No informado'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Estado: {detalleChofer.transportista.estado}
                </Typography>
              </Box>
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Alias Declarados Registrados:
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Texto Declarado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Veces</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalleChofer.aliases?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.nombreDeclarado}</TableCell>
                      <TableCell>{a.veces}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalleChofer(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Editar Nombre Canónico */}
      <Dialog open={modalEditar.open} onClose={() => setModalEditar({ open: false, id: null, nombreActual: '' })}>
        <DialogTitle sx={{ fontWeight: 800 }}>Editar Nombre Canónico</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            size="small"
            label="Nombre Canónico"
            value={modalEditar.nombreActual}
            onChange={(e) => setModalEditar({ ...modalEditar, nombreActual: e.target.value })}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalEditar({ open: false, id: null, nombreActual: '' })}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardarNombre}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Fusión */}
      <Dialog open={modalFusion.open} onClose={() => setModalFusion({ open: false, origenId: null, destinoId: null, motivo: '' })}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmar Fusión de Transportistas</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Esta acción reasignará las declaraciones del transportista origen (#{modalFusion.origenId}) al destino (#{modalFusion.destinoId}), consolidando sus alias. El transportista origen quedará en estado FUSIONADO. Los textos declarados originalmente no serán modificados.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Motivo de la Fusión"
            value={modalFusion.motivo}
            onChange={(e) => setModalFusion({ ...modalFusion, motivo: e.target.value })}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalFusion({ open: false, origenId: null, destinoId: null, motivo: '' })}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={handleEjecutarFusion}>Confirmar Fusión</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
