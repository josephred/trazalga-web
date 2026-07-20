import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  DirectionsRun as DirectionsRunIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getUsuarios } from '../../services/usuarioService';
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
      const data = await getUsuarios();
      if (data) {
        setUsuarios(data);
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
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: 1, borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: 1, borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'background.default',
        }}
      >
        <MapIcon sx={{ color: 'secondary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
          Trayectoria de Usuario (Mapa)
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Filtra por usuario y rango de fechas para visualizar su historial de ubicaciones en el mapa interactivo.
        </Typography>

        {/* Filtros de Búsqueda */}
        <Grid container spacing={2.5} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={4.5}>
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
                  InputProps={{
                    ...params.InputProps,
                    sx: { borderRadius: 3, fontFamily: 'Inter' }
                  }}
                  InputLabelProps={{
                    sx: { fontFamily: 'Inter' }
                  }}
                />
              )}
              sx={{ minWidth: 200 }} // Ancho mínimo de al menos 200px
              noOptionsText="No se encontraron usuarios"
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              label="Fecha Inicio"
              type="datetime-local"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{
                shrink: true,
                sx: { fontFamily: 'Inter' }
              }}
              InputProps={{
                sx: { borderRadius: 3, fontFamily: 'Inter' }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              label="Fecha Fin"
              type="datetime-local"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{
                shrink: true,
                sx: { fontFamily: 'Inter' }
              }}
              InputProps={{
                sx: { borderRadius: 3, fontFamily: 'Inter' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={2.5}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleBuscarTrayecto}
              disabled={loading}
              startIcon={loading ? null : <SearchIcon />}
              sx={{
                height: '56px',
                borderRadius: 3,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.light',
                },
                boxShadow: 'none',
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Buscar Ruta'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert 
            severity={error.includes("No se encontraron") ? "info" : "error"} 
            sx={{ 
              mb: 3, 
              borderRadius: 3, 
              fontFamily: 'Inter',
              border: `1px solid ${error.includes("No se encontraron") ? '#bfdbfe' : '#fecaca'}`,
            }}
          >
            {error}
          </Alert>
        )}

        {/* Contenedor del Mapa Leaflet */}
        <Box 
          sx={{ 
            height: 520, 
            width: '100%', 
            borderRadius: 4, 
            overflow: 'hidden', 
            border: 1, borderColor: 'divider',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
            position: 'relative'
          }}
        >
          {/* Tarjeta de Resumen Flotante sobre el Mapa */}
          {trayecto.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 1000,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: 1, borderColor: 'divider',
                borderRadius: 3,
                p: 2,
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                maxWidth: 240,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontFamily: 'Outfit' }}>
                <DirectionsRunIcon fontSize="small" sx={{ color: 'secondary.main' }} />
                Resumen de Trayecto
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem', mb: 0.5, fontFamily: 'Inter' }}>
                <strong>Puntos:</strong> {trayecto.length} registrados
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem', mb: 0.5, fontFamily: 'Inter' }}>
                <strong>Inicio:</strong> {new Date(trayecto[0].fechaRegistro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({new Date(trayecto[0].fechaRegistro).toLocaleDateString([], {day: '2-digit', month: '2-digit'})})
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem', fontFamily: 'Inter' }}>
                <strong>Término:</strong> {new Date(trayecto[trayecto.length - 1].fechaRegistro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({new Date(trayecto[trayecto.length - 1].fechaRegistro).toLocaleDateString([], {day: '2-digit', month: '2-digit'})})
              </Typography>
            </Box>
          )}

          <MapContainer 
            key={`${center[0]}-${center[1]}`} 
            center={center} 
            zoom={trayecto.length > 0 ? 14 : 5} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {trayecto.length > 0 && (
              <>
                <Polyline positions={getPolylinePositions()} color="#2563eb" weight={5} opacity={0.85} />
                
                {/* Marcador de Inicio */}
                <Marker position={[trayecto[0].latitud, trayecto[0].longitud]}>
                  <Popup>
                    <Box sx={{ p: 0.5, fontFamily: 'Inter' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#16a34a' }}>Punto de Inicio</Typography>
                      <Typography variant="caption" display="block">Fecha: {new Date(trayecto[0].fechaRegistro).toLocaleString()}</Typography>
                      <Typography variant="caption" display="block">Precisión GPS: {trayecto[0].precisionGps ? `${Math.round(trayecto[0].precisionGps)}m` : 'N/A'}</Typography>
                    </Box>
                  </Popup>
                </Marker>
 
                {/* Marcador de Fin */}
                {trayecto.length > 1 && (
                  <Marker position={[trayecto[trayecto.length - 1].latitud, trayecto[trayecto.length - 1].longitud]}>
                    <Popup>
                      <Box sx={{ p: 0.5, fontFamily: 'Inter' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.dark' }}>Último Punto Registrado</Typography>
                        <Typography variant="caption" display="block">Fecha: {new Date(trayecto[trayecto.length - 1].fechaRegistro).toLocaleString()}</Typography>
                        <Typography variant="caption" display="block">Precisión GPS: {trayecto[trayecto.length - 1].precisionGps ? `${Math.round(trayecto[trayecto.length - 1].precisionGps)}m` : 'N/A'}</Typography>
                      </Box>
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
