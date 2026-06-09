import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Switch, 
  Slider, 
  FormControlLabel, 
  Button,
  Grid,
  Alert
} from '@mui/material';
import api from '../api/axiosConfig';

export default function Administracion() {
  const [configuraciones, setConfiguraciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    fetchConfiguraciones();
  }, []);

  const fetchConfiguraciones = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/configuracion-alertas');
      setConfiguraciones(data);
    } catch (error) {
      console.error("Error cargando configuraciones", error);
      setMensaje({ type: 'error', text: 'Error al cargar las configuraciones de alertas.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = (id, currentVal) => {
    setConfiguraciones(prev => prev.map(c => 
      c.id === id ? { ...c, activo: !currentVal } : c
    ));
  };

  const handleSliderChange = (id, newValue) => {
    setConfiguraciones(prev => prev.map(c => 
      c.id === id ? { ...c, umbral: newValue } : c
    ));
  };

  const handleSave = async (config) => {
    try {
      await api.put(`/configuracion-alertas/${config.id}`, config);
      setMensaje({ type: 'success', text: 'Configuración guardada correctamente.' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error al guardar la configuración.' });
    }
  };

  if (loading) {
    return <Typography sx={{ p: 3 }}>Cargando configuraciones...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Administración del Sistema
      </Typography>
      
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Configuración de Notificaciones (Push)
      </Typography>

      {mensaje && (
        <Alert severity={mensaje.type} sx={{ mb: 2 }}>
          {mensaje.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {configuraciones.map((config) => (
          <Grid item xs={12} md={6} key={config.id}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {config.titulo}
                </Typography>
                <Box sx={{ mt: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={config.activo} 
                        onChange={() => handleToggleActivo(config.id, config.activo)}
                        color="primary" 
                      />
                    }
                    label={config.activo ? "Alerta Activada" : "Alerta Desactivada"}
                  />
                </Box>
                
                {config.tipoAlerta === 'LIMITE_CUOTA' && (
                  <Box sx={{ mt: 3, mb: 2, px: 2 }}>
                    <Typography gutterBottom>
                      Umbral de disparo: {config.umbral}% de la cuota
                    </Typography>
                    <Slider
                      value={config.umbral || 80}
                      onChange={(e, val) => handleSliderChange(config.id, val)}
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={10}
                      max={100}
                      disabled={!config.activo}
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => handleSave(config)}
                  >
                    Guardar Cambios
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
