// src/pages/ConsultaPatentePublica.jsx
import { useState } from 'react';
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import sernapescaLogo from '../assets/sernapesca.png';

export default function ConsultaPatentePublica() {
  const [patenteInput, setPatenteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  const navigate = useNavigate();

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
      <Container maxWidth="md">
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
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 620, mx: 'auto' }}>
              Verifique en tiempo real la vigencia y legalidad del traslado de algas pardas por camión o carro de arrastre, conforme a la normativa pesquera de trazabilidad.
            </Typography>
          </Box>

          {/* Formulario de Consulta */}
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleConsultar(); }}>
            <Grid container spacing={2} alignItems="center" justifyContent="center">
              <Grid item xs={12} sm={8} md={7}>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    id="patente-input"
                    label="Placa Patente (Camión o Carro)"
                    placeholder="Ej: ABCD12 o AB1234"
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
            elevation={4}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: '#ffffff',
              boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
              mb: 3,
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

            {/* Ficha de Detalles Operativos (Sin Datos Personales) */}
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
                          {resultado.vigente ? '● Dentro del límite de 48 horas' : '● Supera el límite de 48 horas'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            )}
          </Paper>
        )}

        {/* Declaración de Privacidad y Cumplimiento Normativo (T10.2 / T10.3) */}
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
              Esta consulta pública muestra exclusivamente datos de trazabilidad operativa y legalidad de la carga de alga transportada. En cumplimiento de la normativa de protección de datos personales y comerciales, este servicio <strong>no exhibe nombres de conductores, RUTs, teléfonos ni datos personales de comercializadores</strong>. Toda consulta queda registrada de manera anónima con fines de auditoría y prevención de abusos.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
