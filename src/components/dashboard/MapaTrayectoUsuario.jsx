import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Autocomplete
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import api from '../../api/axiosConfig';

// Fix para los iconos de leaflet en react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapaTrayectoUsuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState('');
  
  // Set default dates: 7 days ago to current time
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 7);
  defaultStart.setHours(0, 0, 0, 0);
  const defaultEnd = new Date();

  // For datetime-local input, format needs to be YYYY-MM-DDTHH:mm
  const formatForInput = (date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const [fechaInicio, setFechaInicio] = useState(formatForInput(defaultStart));
  const [fechaFin, setFechaFin] = useState(formatForInput(defaultEnd));

  const [trayecto, setTrayecto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      // Usamos el proxy /v-core que apunta directo a la raiz del backend
      const res = await axios.get('/v-core/usuario');
      if (res.data) {
        setUsuarios(res.data);
      }
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
      setError("No se pudo cargar la lista de usuarios.");
    }
  };

  const handleBuscarTrayecto = async () => {
    if (!selectedUsuario) {
      setError("Debe seleccionar un usuario.");
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setError("Debe seleccionar fecha de inicio y fin.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTrayecto([]);

      const msDesde = new Date(fechaInicio).getTime();
      const msHasta = new Date(fechaFin).getTime();

      if (msDesde >= msHasta) {
        setError("La fecha de inicio debe ser menor a la fecha de fin.");
        setLoading(false);
        return;
      }

      const res = await api.get(`/historial-ubicacion/usuario/${selectedUsuario}/trayecto?desde=${msDesde}&hasta=${msHasta}`);
      
      if (res.data && res.data.length > 0) {
        setTrayecto(res.data);
      } else {
        setError("No se encontraron registros de ubicación para los filtros seleccionados.");
      }
    } catch (err) {
      console.error("Error al buscar trayecto:", err);
      setError("Ocurrió un error al intentar obtener la trayectoria.");
    } finally {
      setLoading(false);
    }
  };

  const getPolylinePositions = () => {
    return trayecto.map(punto => [punto.latitud, punto.longitud]);
  };

  // Centro del mapa por defecto o primera posicion del trayecto
  const center = trayecto.length > 0 
    ? [trayecto[0].latitud, trayecto[0].longitud] 
    : [-33.45694, -70.64827]; // Centro de Santiago de Chile por defecto

  return (
    <Card elevation={3} sx={{ borderRadius: 2, mt: 4 }}>
      <CardContent>
        <Typography variant="h6" color="text.primary" gutterBottom>
          Trayectoria de Usuario (Mapa)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Filtra por usuario y rango de fechas para visualizar su historial de ubicaciones en el mapa.
        </Typography>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={usuarios}
              getOptionLabel={(option) => `${option.rut} - ${option.nombres} ${option.apellidop}`}
              value={usuarios.find(u => u.id === selectedUsuario) || null}
              onChange={(event, newValue) => {
                setSelectedUsuario(newValue ? newValue.id : '');
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Buscar y Seleccionar Usuario" 
                  variant="outlined" 
                />
              )}
              sx={{ minWidth: 250 }}
              noOptionsText="No se encontraron usuarios"
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Fecha Inicio"
              type="datetime-local"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Fecha Fin"
              type="datetime-local"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleBuscarTrayecto}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Buscar'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity={error.includes("No se encontraron") ? "info" : "error"} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ height: 700, width: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #ccc' }}>
          {/* Es importante proveer una prop key vinculada al centro para que el mapa se re-centre si cambia mucho la ruta */}
          <MapContainer 
            key={`${center[0]}-${center[1]}`} 
            center={center} 
            zoom={trayecto.length > 0 ? 14 : 5} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {trayecto.length > 0 && (
              <>
                <Polyline positions={getPolylinePositions()} color="blue" weight={4} opacity={0.7} />
                
                {/* Marcador de Inicio */}
                <Marker position={[trayecto[0].latitud, trayecto[0].longitud]}>
                  <Popup>
                    <strong>Punto de Inicio</strong><br/>
                    Fecha: {new Date(trayecto[0].fechaRegistro).toLocaleString()}<br/>
                    Precisión GPS: {trayecto[0].precisionGps ? `${Math.round(trayecto[0].precisionGps)}m` : 'N/A'}
                  </Popup>
                </Marker>

                {/* Marcador de Fin */}
                {trayecto.length > 1 && (
                  <Marker position={[trayecto[trayecto.length - 1].latitud, trayecto[trayecto.length - 1].longitud]}>
                    <Popup>
                      <strong>Último Punto</strong><br/>
                      Fecha: {new Date(trayecto[trayecto.length - 1].fechaRegistro).toLocaleString()}<br/>
                      Precisión GPS: {trayecto[trayecto.length - 1].precisionGps ? `${Math.round(trayecto[trayecto.length - 1].precisionGps)}m` : 'N/A'}
                    </Popup>
                  </Marker>
                )}
              </>
            )}
          </MapContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
