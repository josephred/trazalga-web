// src/pages/Login.jsx
import { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Paper } from '@mui/material';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [rut, setRut] = useState('');
  const [clave, setClave] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Ajusta este endpoint al real de tu backend
      const response = await api.post('/auth/login', { rut, clave });
      
      // Guardamos el token que devuelve el backend
      localStorage.setItem('token', response.data.token); 
      
      navigate('/dashboard');
    } catch (error) {
      alert('Error al iniciar sesión: ' + error.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center">
            Trazalga Web
          </Typography>
          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
            <TextField
              margin="normal" required fullWidth label="RUT" autoFocus
              value={rut} onChange={(e) => setRut(e.target.value)}
            />
            <TextField
              margin="normal" required fullWidth label="Clave" type="password"
              value={clave} onChange={(e) => setClave(e.target.value)}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Ingresar
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}