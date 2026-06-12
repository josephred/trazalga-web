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
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../api/axiosConfig';
import MapaTrayectoUsuario from '../components/dashboard/MapaTrayectoUsuario';

export default function Administracion() {
  const [configuraciones, setConfiguraciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  // Estados para configuración general (Rastreo GPS)
  const [trackingActivo, setTrackingActivo] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState(5);
  const [loadingTracking, setLoadingTracking] = useState(true);

  useEffect(() => {
    fetchConfiguraciones();
    fetchGeneralConfigs();
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

  const fetchGeneralConfigs = async () => {
    try {
      setLoadingTracking(true);
      const { data } = await api.get('/configuracion-general');
      const rastreo = data.find(c => c.clave === 'rastreo_activo');
      const intervalo = data.find(c => c.clave === 'intervalo_rastreo_minutos');
      if (rastreo) {
        setTrackingActivo(rastreo.valor === 'true');
      }
      if (intervalo) {
        setTrackingInterval(parseInt(intervalo.valor) || 5);
      }
    } catch (error) {
      console.error("Error cargando configuración de rastreo", error);
    } finally {
      setLoadingTracking(false);
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

  const handleSaveTracking = async () => {
    try {
      setMensaje(null);
      await api.put(`/configuracion-general/rastreo_activo`, {
        clave: 'rastreo_activo',
        valor: trackingActivo ? 'true' : 'false'
      });
      await api.put(`/configuracion-general/intervalo_rastreo_minutos`, {
        clave: 'intervalo_rastreo_minutos',
        valor: trackingInterval.toString()
      });
      setMensaje({ type: 'success', text: 'Configuración de rastreo guardada correctamente.' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      console.error("Error al guardar configuración de rastreo", error);
      setMensaje({ type: 'error', text: 'Error al guardar la configuración de rastreo.' });
    }
  };

  if (loading) {
    return <Typography sx={{ p: 3 }}>Cargando configuraciones...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" color="text.primary" sx={{ mb: 4, fontWeight: 'bold' }}>
        Administración del Sistema
      </Typography>

      {mensaje && (
        <Alert severity={mensaje.type} sx={{ mb: 3 }}>
          {mensaje.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Panel de alertas push */}
        {configuraciones.map((config) => (
          <Grid item xs={12} md={6} key={config.id}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" color="text.primary" gutterBottom>
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
                    <Typography color="text.secondary" gutterBottom>
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

        {/* Tarjeta de Rastreo GPS */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" color="text.primary" gutterBottom>
                Rastreo de Ubicación GPS (App Móvil)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configura si la aplicación móvil registrará periódicamente la posición geográfica de los usuarios para trazabilidad.
              </Typography>

              {loadingTracking ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={trackingActivo}
                          onChange={(e) => setTrackingActivo(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={trackingActivo ? "Rastreo de Ubicación Activado" : "Rastreo de Ubicación Desactivado"}
                    />
                  </Box>

                  <Box sx={{ mt: 3, mb: 2, px: 2 }}>
                    <Typography color="text.secondary" gutterBottom>
                      Frecuencia de actualización: cada {trackingInterval} minutos
                    </Typography>
                    <Slider
                      value={trackingInterval}
                      onChange={(e, val) => setTrackingInterval(val)}
                      valueLabelDisplay="auto"
                      step={1}
                      marks={[
                        { value: 1, label: '1m' },
                        { value: 5, label: '5m' },
                        { value: 10, label: '10m' },
                        { value: 15, label: '15m' },
                        { value: 30, label: '30m' },
                        { value: 60, label: '60m' }
                      ]}
                      min={1}
                      max={60}
                      disabled={!trackingActivo}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveTracking}
                    >
                      Guardar Cambios Rastreo
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Mapa de Trayectoria */}
        <Grid item xs={12}>
          <MapaTrayectoUsuario />
        </Grid>

      </Grid>
    </Box>
  );
}
