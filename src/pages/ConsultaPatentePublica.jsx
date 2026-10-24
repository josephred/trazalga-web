// src/pages/ConsultaPatentePublica.jsx
import { useState, useEffect, useRef } from 'react';
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
  CardContent,
  Link,
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Cancel,
  WarningAmber,
  LocalShipping,
  ArrowBack,
  AccessTime,
  DirectionsCar,
  LocationOn,
  Spa,
} from '@mui/icons-material';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import api from '../api/axiosConfig';
import sernapescaLogo from '../assets/sernapesca.png';

export default function ConsultaPatentePublica() {
  const [patenteInput, setPatenteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

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

  // Si viene ?patente= en la URL, ejecutar consulta automáticamente
  useEffect(() => {
    const paramPatente = searchParams.get('patente');
    if (paramPatente) {
      const clean = paramPatente.toUpperCase().replace(/[\s-]/g, '');
      setPatenteInput(clean);
      handleConsultar(clean);
    }
  }, [searchParams]);

  const esAutorizado = resultado && (resultado.resultado === 'AUTORIZADO' || resultado.vigente === true);
  const patenteActiva = (resultado?.patente || patenteInput || '').trim();
  const linkFiscalizador = patenteActiva
    ? `/login?next=${encodeURIComponent(`/consultas/patente/${patenteActiva}`)}`
    : '/login?next=%2Fconsultas';

  const textoProteccion = resultado?.texto && String(resultado.texto).trim() !== ''
    ? String(resultado.texto).trim()
    : '';
  const graficaArchivo = resultado?.grafica && String(resultado.grafica).trim() !== ''
    ? String(resultado.grafica).trim()
    : '';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f1f5f9',
        py: { xs: 2.5, md: 5 },
        px: { xs: 1.5, sm: 2 },
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(26, 58, 92, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(76, 175, 80, 0.05) 0px, transparent 50%)',
      }}
    >
      <Container maxWidth="md" disableGutters sx={{ px: { xs: 0.5, sm: 2 } }}>
        {/* Barra superior de navegación / identidad */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/login')}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: '#1a3a5c',
              minHeight: 44,
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
              sx={{ height: 36, objectFit: 'contain' }}
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
            p: { xs: 2.5, md: 4 },
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
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Consulta Pública de Patentes de Transporte
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 600, mx: 'auto' }}>
              Verifique si un camión o carro cuenta con traslado de algas pardas autorizado vigente.
            </Typography>
          </Box>

          {/* Formulario de Consulta */}
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleConsultar(); }}>
            <Grid container spacing={2} alignItems="center" justifyContent="center">
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  id="patente-input"
                  label="Placa Patente (Camión o Carro)"
                  placeholder="Ej: ABCD12"
                  value={patenteInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  inputProps={{
                    maxLength: 10,
                    style: {
                      fontSize: '1.2rem',
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
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Button
                  fullWidth
                  id="btn-consultar-patente"
                  variant="contained"
                  size="large"
                  onClick={() => handleConsultar()}
                  disabled={loading || !patenteInput.trim()}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
                  sx={{
                    py: 1.7,
                    minHeight: 48,
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
        {/* RESULTADO DE LA CONSULTA (TN.3) */}
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
              mb: 3,
            }}
          >
            {esAutorizado ? (
              <>
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
                  <CheckCircle sx={{ fontSize: { xs: 42, md: 52 }, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                      <Chip
                        label={resultado.patente}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.22)',
                          color: '#fff',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                        }}
                      />
                      <Chip
                        label="AUTORIZADO"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.25)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                        }}
                      />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, fontSize: { xs: '1.15rem', sm: '1.4rem' }, lineHeight: 1.25 }}>
                      Vehículo con traslado de algas autorizado
                    </Typography>
                  </Box>
                </Box>

                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <AccessTime sx={{ fontSize: 18, color: '#0284c7' }} />
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                            Fecha y hora de autorización
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {resultado.fechaHoraAutorizacion
                            ? new Date(resultado.fechaHoraAutorizacion).toLocaleString('es-CL', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <LocationOn sx={{ fontSize: 18, color: '#16a34a' }} />
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                            Comuna de destino
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', wordBreak: 'break-word' }}>
                          {resultado.comunaDestino || 'Comuna no informada'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Spa sx={{ fontSize: 18, color: '#0d9488' }} />
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                            Tipo de alga
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', wordBreak: 'break-word' }}>
                          {resultado.tipoAlga || 'Alga parda'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </>
            ) : (
              <Box
                sx={{
                  bgcolor: '#475569',
                  color: '#ffffff',
                  p: { xs: 2.5, md: 3.5 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  backgroundImage: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                }}
              >
                <Cancel sx={{ fontSize: { xs: 42, md: 52 }, flexShrink: 0, color: '#cbd5e1' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Chip
                    label={resultado.patente || patenteActiva}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.18)',
                      color: '#fff',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      mb: 0.8,
                    }}
                  />
                  <Typography variant="h5" sx={{ fontWeight: 900, fontSize: { xs: '1.15rem', sm: '1.4rem' }, lineHeight: 1.25 }}>
                    No registra un traslado de algas autorizado vigente
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* Sección opcional de texto y gráfica de protección del recurso (D1: oculta si ambos vienen vacíos) */}
        {(textoProteccion || graficaArchivo) && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              mb: 3,
            }}
          >
            {textoProteccion && (
              <Typography variant="body1" sx={{ color: '#1e293b', lineHeight: 1.6, mb: graficaArchivo ? 2 : 0 }}>
                {textoProteccion}
              </Typography>
            )}
            {graficaArchivo && (
              <Box
                component="img"
                src={`/consulta-publica/${graficaArchivo}`}
                alt="Protección del recurso"
                sx={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 2 }}
              />
            )}
          </Paper>
        )}

        {/* Enlace para fiscalizadores (TN.3) */}
        <Box sx={{ textAlign: 'center', mt: 2, mb: 4 }}>
          <Link
            component={RouterLink}
            to={linkFiscalizador}
            underline="hover"
            sx={{
              fontWeight: 700,
              color: '#1a3a5c',
              fontSize: '0.92rem',
              display: 'inline-block',
              py: 1,
            }}
          >
            ¿Es fiscalizador? Ingrese para ver la traza completa
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
