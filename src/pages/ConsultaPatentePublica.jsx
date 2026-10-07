// src/pages/ConsultaPatentePublica.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Cancel,
  WarningAmber,
  Shield,
  LocalShipping,
  ArrowBack,
  AccessTime,
  Place,
  Inventory2,
  ReceiptLong,
  InfoOutlined,
  DirectionsCar,
  Refresh,
  Clear,
  Person,
  Scale,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import sernapescaLogo from '../assets/sernapesca.png';

export default function ConsultaPatentePublica() {
  const [patenteInput, setPatenteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  // Estado para la tabla de camiones de comerciantes
  const [camionesComerciantes, setCamionesComerciantes] = useState([]);
  const [loadingComerciantes, setLoadingComerciantes] = useState(true);
  const [errorComerciantes, setErrorComerciantes] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchCardRef = useRef(null);
  const resultadoRef = useRef(null);

  // Normalización estricta en el cliente (elimina guiones, espacios y convierte a mayúsculas)
  const handleInputChange = (e) => {
    const raw = e.target.value || '';
    const clean = raw.toUpperCase().replace(/[\s-]/g, '');
    setPatenteInput(clean);
    if (errorMsg) setErrorMsg('');
    if (rateLimited) setRateLimited(false);
  };

  const handleConsultar = async (patenteToQuery) => {
    const target = (patenteToQuery || patenteInput || '').trim();
    if (!target) {
      setErrorMsg('Por favor ingrese una placa patente para consultar.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setRateLimited(false);
    setResultado(null);

    try {
      const response = await api.get(`/public/patentes/${target}`);
      setResultado(response.data);
      // Auto-scroll hacia el resultado
      setTimeout(() => {
        if (resultadoRef.current) {
          resultadoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setRateLimited(true);
        setErrorMsg('Límite de consultas por minuto alcanzado. Por favor, espere 60 segundos antes de intentar nuevamente.');
      } else {
        setErrorMsg(err.response?.data?.message || 'No fue posible completar la consulta. Verifique su conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConsultar();
    }
  };

  // Cargar camiones de comerciantes desde la base de datos
  const cargarCamionesComerciantes = async () => {
    setLoadingComerciantes(true);
    setErrorComerciantes('');
    try {
      const res = await api.get('/public/patentes/comerciantes');
      setCamionesComerciantes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al cargar patentes de comerciantes:', err);
      setErrorComerciantes('No fue posible cargar el listado de patentes de comerciantes desde la base de datos.');
    } finally {
      setLoadingComerciantes(false);
    }
  };

  useEffect(() => {
    cargarCamionesComerciantes();
  }, []);

  // Si viene ?patente= en la URL, ejecutar consulta automáticamente
  useEffect(() => {
    const paramPatente = searchParams.get('patente');
    if (paramPatente) {
      const clean = paramPatente.toUpperCase().replace(/[\s-]/g, '');
      setPatenteInput(clean);
      handleConsultar(clean);
    }
  }, [searchParams]);

  // Selección directa desde la tabla para consultar
  const handleSeleccionarPatente = (pat) => {
    const clean = (pat || '').toUpperCase().replace(/[\s-]/g, '');
    setPatenteInput(clean);
    handleConsultar(clean);
    if (searchCardRef.current) {
      searchCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filtrado reactivo en la tabla
  const camionesFiltrados = useMemo(() => {
    if (!filtroTexto.trim()) return camionesComerciantes;
    const q = filtroTexto.toLowerCase().trim();
    return camionesComerciantes.filter((c) => {
      return (
        (c.patente && c.patente.toLowerCase().includes(q)) ||
        (c.patenteCarro && c.patenteCarro.toLowerCase().includes(q)) ||
        (c.comerciante && c.comerciante.toLowerCase().includes(q)) ||
        (c.rutComerciante && c.rutComerciante.toLowerCase().includes(q)) ||
        (c.chofer && c.chofer.toLowerCase().includes(q)) ||
        (c.rutChofer && c.rutChofer.toLowerCase().includes(q)) ||
        (c.especie && c.especie.toLowerCase().includes(q)) ||
        (c.comunaOrigen && c.comunaOrigen.toLowerCase().includes(q)) ||
        (c.destino && c.destino.toLowerCase().includes(q)) ||
        (c.vehiculo && c.vehiculo.toLowerCase().includes(q)) ||
        (c.folio && c.folio.toLowerCase().includes(q))
      );
    });
  }, [camionesComerciantes, filtroTexto]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f1f5f9',
        py: { xs: 3, md: 5 },
        px: 2,
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(26, 58, 92, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(76, 175, 80, 0.05) 0px, transparent 50%)',
      }}
    >
      <Container maxWidth="lg">
        {/* Barra superior de navegación / identidad */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/login')}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: '#1a3a5c',
              '&:hover': { bgcolor: 'rgba(26, 58, 92, 0.08)' },
            }}
          >
            Volver al Ingreso
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src={sernapescaLogo}
              alt="Sernapesca"
              sx={{ height: 38, objectFit: 'contain' }}
            />
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 900, color: '#1a3a5c', lineHeight: 1.1 }}>
                TRAZ<span style={{ color: '#4caf50' }}>ALGA</span>
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                CONSULTA CIUDADANA
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Tarjeta principal de búsqueda */}
        <Paper
          ref={searchCardRef}
          elevation={3}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            bgcolor: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            mb: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: '#e0f2fe',
                color: '#0284c7',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <LocalShipping sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
              Consulta Pública de Patentes de Transporte
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 640, mx: 'auto' }}>
              Verifique en tiempo real la vigencia y legalidad del traslado de algas pardas por camión o carro de arrastre, conforme a la normativa pesquera de trazabilidad.
            </Typography>
          </Box>

          {/* Formulario de Consulta */}
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleConsultar(); }}>
            <Grid container spacing={2} alignItems="center" justifyContent="center">
              <Grid item xs={12} sm={8} md={6}>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    id="patente-input"
                    label="Placa Patente (Camión o Carro)"
                    placeholder="Ej: ZZXX00 o LLKK99"
                    value={patenteInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    inputProps={{
                      maxLength: 10,
                      style: {
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        fontFamily: 'monospace, sans-serif',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <DirectionsCar sx={{ color: '#64748b', mr: 1, fontSize: 24 }} />
                      ),
                    }}
                    helperText="Formato estándar chileno (se normaliza automáticamente)"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={4} md={3}>
                <Button
                  fullWidth
                  id="btn-consultar-patente"
                  variant="contained"
                  size="large"
                  onClick={() => handleConsultar()}
                  disabled={loading || !patenteInput.trim()}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
                  sx={{
                    py: 1.8,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: '#1a3a5c',
                    boxShadow: '0 4px 12px rgba(26,58,92,0.25)',
                    '&:hover': { bgcolor: '#15304d' },
                  }}
                >
                  {loading ? 'Consultando...' : 'Consultar'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Mensajes de error / Rate limit */}
          {errorMsg && (
            <Alert
              severity={rateLimited ? 'warning' : 'error'}
              icon={rateLimited ? <WarningAmber /> : undefined}
              sx={{ mt: 3, borderRadius: 2 }}
            >
              {errorMsg}
            </Alert>
          )}
        </Paper>

        {/* ======================================================== */}
        {/* RESULTADO DE LA CONSULTA */}
        {/* ======================================================== */}
        {resultado && (
          <Paper
            ref={resultadoRef}
            elevation={4}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: '#ffffff',
              boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
              mb: 4,
            }}
          >
            {/* Banner de Estado Prominente */}
            {resultado.vigente ? (
              <Box
                sx={{
                  bgcolor: '#15803d',
                  color: '#ffffff',
                  p: { xs: 2.5, md: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  backgroundImage: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
                }}
              >
                <CheckCircle sx={{ fontSize: { xs: 44, md: 54 }, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>
                      TRASLADO VIGENTE
                    </Typography>
                    <Chip
                      label="AUTORIZADO"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
                    La patente <strong>{resultado.patente}</strong> cuenta con un movimiento de transporte de algas registrado y autorizado dentro del plazo reglamentario ({resultado.horasTranscurridas} hrs transcurridas).
                  </Typography>
                </Box>
              </Box>
            ) : resultado.sinRegistros ? (
              <Box
                sx={{
                  bgcolor: '#b91c1c',
                  color: '#ffffff',
                  p: { xs: 2.5, md: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  backgroundImage: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                }}
              >
                <Cancel sx={{ fontSize: { xs: 44, md: 54 }, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>
                      SIN REGISTROS EN EL SISTEMA
                    </Typography>
                    <Chip
                      label="NO REGISTRADA"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
                    La patente <strong>{resultado.patente}</strong> no registra ninguna declaración de traslado de algas en el sistema oficial de TrazAlga.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  bgcolor: '#c2410c',
                  color: '#ffffff',
                  p: { xs: 2.5, md: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  backgroundImage: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
                }}
              >
                <WarningAmber sx={{ fontSize: { xs: 44, md: 54 }, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>
                      SIN MOVIMIENTO VIGENTE
                    </Typography>
                    <Chip
                      label="PLAZO VENCIDO"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
                    El último movimiento registrado para la patente <strong>{resultado.patente}</strong> ocurrió hace {resultado.horasTranscurridas} horas, superando el límite de vigencia autorizado.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Ficha de Detalles Operativos */}
            {!resultado.sinRegistros && (
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Detalle del Último Movimiento Registrado
                </Typography>

                <Grid container spacing={2}>
                  {/* Patente */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Placa Patente
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                        {resultado.patente}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Folio */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Folio Documento
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {resultado.folio || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Especie */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Especie Declarada
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {resultado.especie || 'Alga Parda'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Kilos aproximados */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Volumen Aproximado
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                        {resultado.kg ? `${Number(resultado.kg).toLocaleString('es-CL')} kg` : '0 kg'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Comuna de Origen */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Place sx={{ color: '#0284c7', mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Comuna / Zona de Origen
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {resultado.comunaOrigen || 'Origen Acreditado'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Destino Autorizado */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Inventory2 sx={{ color: '#16a34a', mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Destino Declarado
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {resultado.destino || 'Planta de Procesamiento Autorizada'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Fecha y Hora del movimiento */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <AccessTime sx={{ color: '#f59e0b', mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Fecha y Hora de Salida / Registro
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {resultado.fechaHoraMovimiento ? new Date(resultado.fechaHoraMovimiento).toLocaleString('es-CL', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          }) : 'N/A'}
                        </Typography>
                        {!resultado.horaInformada && (
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', display: 'block' }}>
                            (Hora no precisada en origen; calculada de forma conservadora a las 00:00)
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>

                  {/* Horas Transcurridas */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <ReceiptLong sx={{ color: '#64748b', mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Antigüedad del Movimiento
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {resultado.horasTranscurridas} horas transcurridas
                        </Typography>
                        <Typography variant="caption" sx={{ color: resultado.vigente ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
                          {resultado.vigente ? '● Dentro del límite de vigencia reglamentario' : '● Supera el límite de vigencia reglamentario'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            )}
          </Paper>
        )}

        {/* ======================================================== */}
        {/* TABLA DE PATENTES DE CAMIONES DE COMERCIANTES REGISTRADOS */}
        {/* ======================================================== */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            bgcolor: '#ffffff',
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.07)',
            mb: 4,
          }}
        >
          {/* Cabecera de la sección */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #bbf7d0',
                }}
              >
                <LocalShipping sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  Patentes de Camiones de Comerciantes Registrados
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Vehículos y camiones de transporte registrados en la base de datos de trazabilidad pesquera
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
              <TextField
                size="small"
                placeholder="Buscar por patente, comerciante, chofer, especie..."
                value={filtroTexto}
                onChange={(e) => {
                  setFiltroTexto(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: filtroTexto ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setFiltroTexto('')}>
                        <Clear sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  minWidth: { xs: '100%', md: 320 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                  },
                }}
              />

              <Tooltip title="Actualizar lista desde la base de datos">
                <span>
                  <IconButton
                    onClick={cargarCamionesComerciantes}
                    disabled={loadingComerciantes}
                    sx={{
                      bgcolor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      '&:hover': { bgcolor: '#e2e8f0' },
                    }}
                  >
                    <Refresh sx={{ fontSize: 20, color: '#1a3a5c' }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>

          {/* Estado de error de carga */}
          {errorComerciantes && (
            <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
              {errorComerciantes}
            </Alert>
          )}

          {/* Tabla de Resultados */}
          {loadingComerciantes ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
              <CircularProgress size={36} sx={{ color: '#1a3a5c' }} />
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                Cargando vehículos y patentes de comerciantes...
              </Typography>
            </Box>
          ) : camionesFiltrados.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
              <LocalShipping sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#475569' }}>
                {filtroTexto ? 'No se encontraron patentes que coincidan con la búsqueda' : 'No hay patentes de camiones registradas'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 440, mx: 'auto', mt: 0.5 }}>
                {filtroTexto ? 'Intente con otro término o borre el filtro para ver todos los registros.' : 'Aún no se han registrado movimientos de transporte para comercializadores en el sistema.'}
              </Typography>
              {filtroTexto && (
                <Button
                  size="small"
                  onClick={() => setFiltroTexto('')}
                  sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700 }}
                >
                  Limpiar filtro de búsqueda
                </Button>
              )}
            </Box>
          ) : (
            <>
              <TableContainer
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  overflow: 'auto',
                }}
              >
                <Table size="medium">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Patente / Carro
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Comerciante
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Vehículo / Chofer
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Última Carga
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Origen → Destino
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Último Movimiento
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Vigencia
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Acción
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {camionesFiltrados
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((item, idx) => (
                        <TableRow
                          key={`${item.patente}-${idx}`}
                          hover
                          sx={{
                            transition: 'background-color 0.15s ease',
                            '&:hover': { bgcolor: '#f8fafc' },
                          }}
                        >
                          {/* Placa Patente */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                              <Tooltip title="Haga clic para consultar la vigencia de esta patente" arrow>
                                <Box
                                  onClick={() => handleSeleccionarPatente(item.patente)}
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.8,
                                    bgcolor: '#ffffff',
                                    border: '2px solid #0f172a',
                                    borderRadius: 1.2,
                                    px: 1.2,
                                    py: 0.4,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      bgcolor: '#0f172a',
                                      color: '#ffffff',
                                      transform: 'translateY(-1px)',
                                      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                      '& .pat-txt': { color: '#ffffff' },
                                      '& .pat-ico': { color: '#38bdf8' },
                                    },
                                  }}
                                >
                                  <DirectionsCar className="pat-ico" sx={{ fontSize: 16, color: '#0f172a' }} />
                                  <Typography
                                    className="pat-txt"
                                    sx={{
                                      fontFamily: 'monospace, sans-serif',
                                      fontWeight: 900,
                                      fontSize: '0.92rem',
                                      letterSpacing: '1.5px',
                                      color: '#0f172a',
                                    }}
                                  >
                                    {item.patente}
                                  </Typography>
                                </Box>
                              </Tooltip>

                              {item.patenteCarro && (
                                <Tooltip title="Patente de carro de arrastre / acoplado">
                                  <Box
                                    onClick={() => handleSeleccionarPatente(item.patenteCarro)}
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      bgcolor: '#f1f5f9',
                                      border: '1px dashed #64748b',
                                      borderRadius: 1,
                                      px: 0.8,
                                      py: 0.2,
                                      cursor: 'pointer',
                                      '&:hover': { bgcolor: '#e2e8f0' },
                                    }}
                                  >
                                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                                      Carro:
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.74rem', color: '#0f172a' }}>
                                      {item.patenteCarro}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>

                          {/* Comerciante */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                {item.comerciante || 'Comerciante'}
                              </Typography>
                              {item.rutComerciante && (
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                  RUT: {item.rutComerciante}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>

                          {/* Vehículo / Chofer */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                                {item.vehiculo || 'Camión'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Person sx={{ fontSize: 13 }} />
                                {item.chofer || 'Chofer no informado'}
                                {item.rutChofer ? ` (${item.rutChofer})` : ''}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Carga */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Chip
                                label={item.especie || 'Alga'}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.7rem',
                                  bgcolor: '#f1f5f9',
                                  color: '#0f172a',
                                  borderRadius: 1,
                                  width: 'fit-content',
                                  mb: 0.4,
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                {item.kg ? `${Number(item.kg).toLocaleString('es-CL')} kg` : '0 kg'}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Origen → Destino */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                <Place sx={{ fontSize: 14, color: '#0284c7' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                  {item.comunaOrigen || 'Origen acreditado'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                <Inventory2 sx={{ fontSize: 14, color: '#16a34a' }} />
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                                  {item.destino || 'Planta de destino'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Último Movimiento */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                                {item.fechaHoraMovimiento ? new Date(item.fechaHoraMovimiento).toLocaleString('es-CL', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                }) : 'N/A'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Folio: {item.folio || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Vigencia */}
                          <TableCell align="center">
                            {item.vigente ? (
                              <Tooltip title={`Registrado hace ${item.horasTranscurridas} hrs (dentro del plazo reglamentario)`}>
                                <Chip
                                  icon={<CheckCircle sx={{ fontSize: 14, color: '#15803d !important' }} />}
                                  label="VIGENTE"
                                  size="small"
                                  sx={{
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    bgcolor: 'rgba(21, 128, 61, 0.1)',
                                    color: '#15803d',
                                    border: '1px solid rgba(21, 128, 61, 0.3)',
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip title={`Registrado hace ${item.horasTranscurridas} hrs (supera el límite de vigencia)`}>
                                <Chip
                                  icon={<WarningAmber sx={{ fontSize: 14, color: '#c2410c !important' }} />}
                                  label="PLAZO VENCIDO"
                                  size="small"
                                  sx={{
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    bgcolor: 'rgba(194, 65, 12, 0.1)',
                                    color: '#c2410c',
                                    border: '1px solid rgba(194, 65, 12, 0.3)',
                                  }}
                                />
                              </Tooltip>
                            )}
                          </TableCell>

                          {/* Acción */}
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Search sx={{ fontSize: 15 }} />}
                              onClick={() => handleSeleccionarPatente(item.patente)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.76rem',
                                borderRadius: 1.5,
                                borderColor: '#1a3a5c',
                                color: '#1a3a5c',
                                px: 1.5,
                                py: 0.5,
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                  bgcolor: '#1a3a5c',
                                  color: '#ffffff',
                                  borderColor: '#1a3a5c',
                                },
                              }}
                            >
                              Consultar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={camionesFiltrados.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
                sx={{
                  borderTop: '1px solid #f1f5f9',
                  color: '#64748b',
                  fontSize: '0.82rem',
                }}
              />
            </>
          )}
        </Paper>

        {/* Declaración de Privacidad y Cumplimiento Normativo */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Shield sx={{ color: '#0369a1', fontSize: 26, mt: 0.3, flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
              Protección de Datos y Privacidad Ciudadana
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.6 }}>
              Esta consulta pública muestra exclusivamente datos de trazabilidad operativa y legalidad de la carga de alga transportada. En cumplimiento de la normativa de protección de datos personales y comerciales, el resultado individual de verificación ciudadana <strong>no exhibe nombres de conductores, RUTs, teléfonos ni datos personales de comercializadores</strong>. Toda consulta queda registrada de manera anónima con fines de auditoría y prevención de abusos.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
