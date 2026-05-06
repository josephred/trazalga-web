// src/pages/Login.jsx
import { useState } from 'react';
import { Box, TextField, Button, Typography, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Lock, HelpOutline, MenuBook, Language, Warning, BarChart, CheckCircle, VerifiedUser, Security, Analytics } from '@mui/icons-material';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { validateRut } from '../utils/rutValidator';
import { Alert, Snackbar } from '@mui/material';
import sernapescaLogo from '../assets/sernapesca.png';
import loginBarco from '../assets/login_barco.png';

export default function Login() {
  const [rut, setRut] = useState('');
  const [clave, setClave] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ rut: '', clave: '' });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    let newErrors = { rut: '', clave: '' };
    let isValid = true;
    if (!rut) { newErrors.rut = 'El RUT es obligatorio'; isValid = false; }
    else if (!validateRut(rut)) { newErrors.rut = 'RUT no válido'; isValid = false; }
    if (!clave) { newErrors.clave = 'La clave es obligatoria'; isValid = false; }

    setErrors(newErrors);
    if (!isValid) return;

    setLoading(true);
    try {
      const cleanRut = rut.replace(/[.-]/g, '');
      const rutBody = cleanRut.slice(0, -1);

      const response = await api.post('/auth/login', { rut: rutBody, clave });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error en Login:', error);
      setSnackbar({ open: true, message: "RUT o Clave incorrectos", severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const featureItems = [
    { icon: <Language sx={{ fontSize: 32, color: '#fff' }} />, label: 'Trazabilidad completa' },
    { icon: <Warning sx={{ fontSize: 32, color: '#fff' }} />, label: 'Control y fiscalización' },
    { icon: <Analytics sx={{ fontSize: 32, color: '#fff' }} />, label: 'Información confiable' },
    { icon: <Security sx={{ fontSize: 32, color: '#fff' }} />, label: 'Cumplimiento normativo' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f0f4f8' }}>
      {/* ═══════════ TOP BAR ═══════════ */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: '#fff', px: { xs: 2, md: 4 }, py: 1.5,
        borderBottom: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box component="img" src={sernapescaLogo} alt="Sernapesca" sx={{ height: { xs: 50, md: 65 } }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', md: '1.4rem' }, color: '#1a1a1a', letterSpacing: 0.5 }}>
              TRAZALGA
            </Typography>
            <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' }, color: '#555', lineHeight: 1.3 }}>
              Portal de Reportería para el Control de Trazabilidad de Algas Pardas
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#1565c0', fontWeight: 700 }}>
              IV Región de Coquimbo
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: '#555', '&:hover': { color: '#1565c0' } }}>
            <HelpOutline sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: '0.85rem' }}>Ayuda</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: '#555', '&:hover': { color: '#1565c0' } }}>
            <MenuBook sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: '0.85rem' }}>Manual de usuario</Typography>
          </Box>
        </Box>
      </Box>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
          alignItems: 'stretch',
          position: 'relative',
          bgcolor: '#fff',
          borderRadius: 0,
          overflow: 'hidden',
          boxShadow: 'none',
        }}>
          {/* ─── BACKGROUND IMAGE LAYER ─── */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '80%',
            height: '100%',
            backgroundImage: `url(${loginBarco})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            pointerEvents: 'none',
          }} />

          {/* ─── GRADIENT OVERLAY ─── */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '80%',
            height: '100%',
            background: 'linear-gradient(to right, transparent 80%, #fff 100%), linear-gradient(to bottom, transparent 80%, #fff 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }} />

          {/* ─── LEFT PANEL: Hero ─── */}
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            bgcolor: 'transparent',
            minHeight: { xs: 350, md: 600 },
          }}>
            <Box sx={{ p: { xs: 3, md: 5 }, flex: 1 }}>
              {/* Logo + Title */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                {/* Trazalga icon circle */}
                <Box sx={{
                  width: 90, height: 90, borderRadius: '50%',
                  border: '3px solid #1a3a5c',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: '#fff',
                  flexShrink: 0,
                }}>
                  <Typography sx={{ fontSize: 40 }}>🌿</Typography>
                </Box>
                <Box>
                  <Typography sx={{
                    fontSize: { xs: '2rem', md: '2.8rem' },
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: 2,
                  }}>
                    <span style={{ color: '#1a3a5c' }}>TRAZ</span>
                    <span style={{ color: '#4caf50' }}>ALGA</span>
                  </Typography>
                  <Typography sx={{
                    fontSize: { xs: '0.65rem', md: '0.78rem' },
                    fontWeight: 700,
                    color: '#555',
                    letterSpacing: 3,
                    mt: 0.5,
                  }}>
                    CONTROL Y TRAZABILIDAD DE ALGAS PARDAS
                  </Typography>
                </Box>
              </Box>

              {/* Description */}
              <Typography sx={{
                fontSize: '0.92rem',
                color: '#4a5568',
                lineHeight: 1.7,
                mb: 3,
                maxWidth: 480,
              }}>
                Sistema de reportería y monitoreo que permite gestionar la trazabilidad de algas
                pardas desde su extracción hasta su destino final, asegurando el cumplimiento
                normativo y la sustentabilidad de la actividad.
              </Typography>
            </Box>

            <Box sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'space-between',
              bgcolor: 'rgba(26, 58, 92, 0.92)',
              px: 3, py: 2,
              m: 4,
              borderRadius: 0,
              width: 'fit-content',
              maxWidth: 550,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              position: 'relative',
              zIndex: 2,
            }}>
              {featureItems.map((item, index) => (
                <Box 
                  key={index} 
                  component="a"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 0.5, 
                    flex: 1, 
                    px: 1.5,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      filter: 'brightness(1.2)',
                    }
                  }}
                >
                  <Box sx={{ color: '#fff', transform: 'scale(0.8)' }}>{item.icon}</Box>
                  <Typography sx={{ color: '#fff', fontSize: '0.6rem', textAlign: 'center', fontWeight: 600, lineHeight: 1.2 }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* ─── RIGHT PANEL: Login Form ─── */}
          <Box sx={{
            width: { xs: '90%', md: 380 },
            bgcolor: '#fff',
            borderRadius: 0,
            p: { xs: 3, md: 5 },
            m: { xs: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            alignSelf: 'center',
            position: 'relative',
            zIndex: 2,
          }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#1a1a1a', textAlign: 'center', mb: 0.5 }}>
              Iniciar sesión
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center', mb: 3 }}>
              Ingrese sus credenciales para acceder al sistema.
            </Typography>

            <Box component="form" onSubmit={handleLogin}>
              {/* Usuario */}
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', mb: 0.8 }}>
                Usuario
              </Typography>
              <TextField
                fullWidth
                placeholder="Ingrese su usuario"
                size="small"
                value={rut}
                onChange={(e) => {
                  setRut(e.target.value);
                  if (errors.rut) setErrors({ ...errors, rut: '' });
                }}
                error={!!errors.rut}
                helperText={errors.rut}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ fontSize: 18, color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: '#1565c0 !important' },
                  }
                }}
                sx={{ mb: 2.5 }}
              />

              {/* Contraseña */}
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', mb: 0.8 }}>
                Contraseña
              </Typography>
              <TextField
                fullWidth
                placeholder="Ingrese su contraseña"
                size="small"
                type={showPassword ? 'text' : 'password'}
                value={clave}
                onChange={(e) => {
                  setClave(e.target.value);
                  if (errors.clave) setErrors({ ...errors, clave: '' });
                }}
                error={!!errors.clave}
                helperText={errors.clave}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ fontSize: 18, color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18, color: '#9ca3af' }} /> : <Visibility sx={{ fontSize: 18, color: '#9ca3af' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: '#1565c0 !important' },
                  }
                }}
                sx={{ mb: 3 }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<Lock sx={{ fontSize: 18 }} />}
                sx={{
                  py: 1.4,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: '#1a3a5c',
                  boxShadow: '0 4px 12px rgba(26,58,92,0.3)',
                  '&:hover': { bgcolor: '#15304d' },
                }}
              >
                {loading ? 'Ingresando...' : 'Ingresar al sistema'}
              </Button>

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2.5 }}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#e5e7eb' }} />
                <Typography sx={{ mx: 2, fontSize: '0.8rem', color: '#9ca3af' }}>o</Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#e5e7eb' }} />
              </Box>

              {/* ClaveÚnica Button */}
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  py: 1.2,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  borderColor: '#e5e7eb',
                  color: '#374151',
                  '&:hover': { borderColor: '#1565c0', bgcolor: '#f0f7ff' },
                }}
              >
                ⏻&nbsp;&nbsp;Iniciar sesión con ClaveÚnica
              </Button>

              {/* Forgot password */}
              <Typography sx={{
                textAlign: 'center', mt: 2,
                fontSize: '0.85rem', color: '#1565c0',
                cursor: 'pointer', fontWeight: 600,
                '&:hover': { textDecoration: 'underline' },
              }}>
                ¿Olvidó su contraseña?
              </Typography>

              {/* Footer notice */}
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 0.8, mt: 4, flexDirection: 'column',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <VerifiedUser sx={{ fontSize: 16, color: '#22c55e' }} />
                  <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                    Acceso restringido a usuarios autorizados.
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                  Todas las acciones son registradas y monitoreadas.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}