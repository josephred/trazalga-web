// src/pages/Login.jsx
import { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Paper } from '@mui/material';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { validateRut } from '../utils/rutValidator';
import { Alert, Snackbar } from '@mui/material';

export default function Login() {
  const [rut, setRut] = useState('');
  const [clave, setClave] = useState('');
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
      // Clean RUT: remove dots/hyphens and the verification digit
      const cleanRut = rut.replace(/[.-]/g, '');
      const rutBody = cleanRut.slice(0, -1);

      const response = await api.post('/auth/login', { rut: rutBody, clave });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (_error) {
      setSnackbar({ open: true, message: "RUT o Clave incorrectos", severity: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e1e1e1ff'
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
            <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Trazalga Reportes
            </Typography>
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
              <TextField
                margin="normal" required fullWidth label="RUT" autoFocus
                value={rut}
                onChange={(e) => {
                  setRut(e.target.value);
                  if (errors.rut) setErrors({ ...errors, rut: '' });
                }}
                error={!!errors.rut}
                helperText={errors.rut}
                disabled={loading}
              />
              <TextField
                margin="normal" required fullWidth label="Clave" type="password"
                value={clave}
                onChange={(e) => {
                  setClave(e.target.value);
                  if (errors.clave) setErrors({ ...errors, clave: '' });
                }}
                error={!!errors.clave}
                helperText={errors.clave}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2, py: 1.5, textTransform: 'none', fontSize: '1.1rem' }}
                disabled={loading}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
              <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
                {__APP_VERSION__}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}