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
  CircularProgress,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  AdminPanelSettings as AdminPanelSettingsIcon,
  NotificationsActive as NotificationsActiveIcon,
  GpsFixed as GpsFixedIcon,
  GpsOff as GpsOffIcon,
  Map as MapIcon,
  Save as SaveIcon,
  Tune as TuneIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  CloudSync as CloudSyncIcon,
  Public as PublicIcon,
  Category as CategoryIcon,
  Phishing as PhishingIcon,
  DirectionsBoat as DirectionsBoatIcon,
  Pool as PoolIcon,
  Terrain as TerrainIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import api from '../api/axiosConfig';
import MapaTrayectoUsuario from '../components/dashboard/MapaTrayectoUsuario';


// Styled Switch matching IOS visual cues
const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#10b981',
        opacity: 1,
        border: 0,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: '#cbd5e1',
    opacity: 1,
  },
}));

// Premium Styled Slider with gradient highlight
const ModernSlider = styled(Slider)(({ theme }) => ({
  color: '#0ea5e9',
  height: 6,
  '& .MuiSlider-track': {
    border: 'none',
    background: 'linear-gradient(90deg, #10b981 0%, #0ea5e9 100%)',
  },
  '& .MuiSlider-thumb': {
    height: 18,
    width: 18,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    '&:hover, &.Mui-active': {
      boxShadow: '0px 0px 0px 8px rgba(14, 165, 233, 0.16)',
    },
  },
  '& .MuiSlider-rail': {
    opacity: 0.28,
    backgroundColor: '#cbd5e1',
  },
}));

const getAlertColor = (tipoAlerta) => {
  switch (tipoAlerta) {
    case 'LIMITE_CUOTA':
      return '#f59e0b';
    case 'DESVIO_RUTA':
      return '#ef4444';
    case 'APLICACION_INACTIVA':
      return '#64748b';
    default:
      return '#0ea5e9';
  }
};

const getAlertIcon = (tipoAlerta) => {
  switch (tipoAlerta) {
    case 'LIMITE_CUOTA':
      return <SpeedIcon sx={{ fontSize: 24 }} />;
    case 'DESVIO_RUTA':
      return <TrendingUpIcon sx={{ fontSize: 24 }} />;
    case 'APLICACION_INACTIVA':
      return <GpsOffIcon sx={{ fontSize: 24 }} />;
    default:
      return <NotificationsActiveIcon sx={{ fontSize: 24 }} />;
  }
};

// Tareas de poblamiento de datos maestros desde el API de Sernapesca
// (consumen los endpoints POST /sync/sernapesca/* del backend).
const SYNC_TASKS = [
  {
    key: 'regiones',
    label: 'Regiones, Comunas y Caletas',
    descripcion: 'Jerarquía geográfica completa.',
    path: '/sync/sernapesca/regiones',
    color: '#0ea5e9',
    icon: <PublicIcon />,
  },
  {
    key: 'tipos-extraccion',
    label: 'Tipos de Extracción',
    descripcion: 'Métodos de recolección.',
    path: '/sync/sernapesca/tipos-extraccion',
    color: '#8b5cf6',
    icon: <CategoryIcon />,
  },
  {
    key: 'especies',
    label: 'Especies',
    descripcion: 'Especies autorizadas para recolección.',
    path: '/sync/sernapesca/especies',
    color: '#10b981',
    icon: <PhishingIcon />,
  },
  {
    key: 'embarcaciones',
    label: 'Embarcaciones',
    descripcion: 'Naves por región (puede tardar).',
    path: '/sync/sernapesca/embarcaciones',
    color: '#f59e0b',
    icon: <DirectionsBoatIcon />,
  },
  {
    key: 'buzos',
    label: 'Buzos / Recolectores',
    descripcion: 'Recolectores de orilla por región.',
    path: '/sync/sernapesca/buzos',
    color: '#06b6d4',
    icon: <PoolIcon />,
  },
  {
    key: 'amerb',
    label: 'Áreas de Manejo (AMERB)',
    descripcion: 'Áreas de manejo por región.',
    path: '/sync/sernapesca/amerb',
    color: '#ec4899',
    icon: <TerrainIcon />,
  },
];

export default function Administracion() {
  const [configuraciones, setConfiguraciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Estado del poblamiento de datos maestros (pestaña Sernapesca)
  const [syncResults, setSyncResults] = useState({});
  const [syncLoading, setSyncLoading] = useState(null); // key de la tarea en curso, o 'ALL'

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
      setMensaje({ type: 'success', text: `Configuración de alerta "${config.titulo}" guardada correctamente.` });
      setTimeout(() => setMensaje(null), 4000);
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error al guardar la configuración.' });
    }
  };

  // Ejecuta una tarea de poblamiento (o "todas") y guarda el resumen por entidad.
  const runSync = async (task) => {
    if (syncLoading) return;
    setSyncLoading(task.key);
    setMensaje(null);
    try {
      const { data } = await api.post(task.path);
      const arr = Array.isArray(data) ? data : [data];
      setSyncResults((prev) => {
        const next = { ...prev };
        arr.forEach((r) => {
          if (r && r.entidad) next[r.entidad] = r;
        });
        return next;
      });
      const insertados = arr.reduce((sum, r) => sum + (r.insertados || 0), 0);
      setMensaje({ type: 'success', text: `${task.label}: ${insertados} registro(s) insertado(s).` });
      setTimeout(() => setMensaje(null), 5000);
    } catch (error) {
      console.error('Error en poblamiento Sernapesca', error);
      setMensaje({
        type: 'error',
        text: `Error al cargar "${task.label}". Verifica que el backend y el API de Sernapesca estén accesibles.`,
      });
    } finally {
      setSyncLoading(null);
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
      setTimeout(() => setMensaje(null), 4000);
    } catch (error) {
      console.error("Error al guardar configuración de rastreo", error);
      setMensaje({ type: 'error', text: 'Error al guardar la configuración de rastreo.' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
        <CircularProgress size={50} color="primary" />
        <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
          Cargando panel de administración...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: 'background.default', minHeight: '85vh' }}>
        
        {/* Banner de Cabecera Premium */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0a192f 0%, #172a45 100%)',
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            mb: 4,
            color: '#fff',
            boxShadow: '0 10px 30px rgba(10, 25, 47, 0.08)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 3,
          }}
        >
          {/* Círculos abstractos de fondo */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              background: 'rgba(14, 165, 233, 0.15)',
              borderRadius: '50%',
              filter: 'blur(30px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -50,
              left: '50%',
              width: 180,
              height: 180,
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '50%',
              filter: 'blur(40px)',
            }}
          />

          <Box sx={{ zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <AdminPanelSettingsIcon sx={{ fontSize: 36, color: '#0ea5e9' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', m: 0 }}>
                Administración del Sistema
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 650, fontFamily: 'Inter', lineHeight: 1.6 }}>
              Ajusta los parámetros globales de rastreo satelital, cuotas de extracción y personaliza la sensibilidad de las alertas automáticas del ecosistema Trazalga.
            </Typography>
          </Box>

          {/* Micro KPI Widgets */}
          <Box sx={{ display: 'flex', gap: 2, zIndex: 1, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 3,
                px: 2.5,
                py: 1.5,
                textAlign: 'center',
                flexGrow: 1,
                minWidth: 110,
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.6, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Servicio GPS
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: trackingActivo ? '#10b981' : '#ef4444', mt: 0.5 }}>
                {trackingActivo ? 'ACTIVO' : 'INACTIVO'}
              </Typography>
            </Box>
            
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 3,
                px: 2.5,
                py: 1.5,
                textAlign: 'center',
                flexGrow: 1,
                minWidth: 110,
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.6, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Intervalo
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0ea5e9', mt: 0.5 }}>
                {trackingInterval} min
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 3,
                px: 2.5,
                py: 1.5,
                textAlign: 'center',
                flexGrow: 1,
                minWidth: 110,
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.6, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Alertas
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#f59e0b', mt: 0.5 }}>
                {configuraciones.filter(c => c.activo).length} / {configuraciones.length}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Notificaciones / Mensajes */}
        {mensaje && (
          <Alert
            severity={mensaje.type}
            sx={{
              mb: 4,
              borderRadius: 3,
              fontFamily: 'Inter',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              border: `1px solid ${mensaje.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            }}
          >
            {mensaje.text}
          </Alert>
        )}

        {/* Pestañas de Navegación del Panel */}
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            mb: 4,
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: '#0ea5e9',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              fontFamily: 'Outfit',
              color: '#64748b',
              pb: 1.5,
              '&.Mui-selected': {
                color: '#0ea5e9',
              },
            },
          }}
        >
          <Tab icon={<TuneIcon sx={{ mr: 1 }} />} iconPosition="start" label="Configuración de Alertas" />
          <Tab icon={<MapIcon sx={{ mr: 1 }} />} iconPosition="start" label="Consola de Trazabilidad y GPS" />
          <Tab icon={<CloudSyncIcon sx={{ mr: 1 }} />} iconPosition="start" label="Carga de Datos Maestros" />
        </Tabs>

        {/* Renderizado de Pestaña 1: Configuración de Alertas */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {configuraciones.map((config) => (
              <Grid item xs={12} md={6} key={config.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    bgcolor: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                    '&:hover': {
                      borderColor: '#cbd5e1',
                      boxShadow: '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* Borde sutil del color del disparador al lado izquierdo */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 5,
                      bgcolor: config.activo ? getAlertColor(config.tipoAlerta) : '#cbd5e1',
                      transition: 'background-color 0.3s ease',
                    }}
                  />

                  <CardContent sx={{ p: 3, flexGrow: 1, pl: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: config.activo ? `${getAlertColor(config.tipoAlerta)}15` : '#f1f5f9',
                          color: config.activo ? getAlertColor(config.tipoAlerta) : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {getAlertIcon(config.tipoAlerta)}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'Outfit', color: '#0f172a' }}>
                          {config.titulo}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'Inter' }}>
                          Tipo: {config.tipoAlerta}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, mt: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: config.activo ? '#0f172a' : '#64748b', fontFamily: 'Inter' }}>
                        Estado de la alerta:
                      </Typography>
                      <FormControlLabel
                        control={
                          <IOSSwitch
                            checked={config.activo}
                            onChange={() => handleToggleActivo(config.id, config.activo)}
                          />
                        }
                        label={config.activo ? "Activa" : "Inactiva"}
                        labelPlacement="start"
                        sx={{
                          m: 0,
                          '& .MuiFormControlLabel-label': {
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            mr: 1.5,
                            color: config.activo ? '#10b981' : '#64748b',
                            fontFamily: 'Inter',
                          }
                        }}
                      />
                    </Box>

                    {config.tipoAlerta === 'LIMITE_CUOTA' && (
                      <Box sx={{ mt: 3, mb: 1, p: 2.5, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontFamily: 'Inter' }}>
                            Umbral de disparo:
                          </Typography>
                          <Typography variant="body2" sx={{ color: config.activo ? '#0ea5e9' : '#94a3b8', fontWeight: 800, fontFamily: 'Inter' }}>
                            {config.umbral || 80}% de la cuota
                          </Typography>
                        </Box>
                        <ModernSlider
                          value={config.umbral || 80}
                          onChange={(e, val) => handleSliderChange(config.id, val)}
                          valueLabelDisplay="auto"
                          step={5}
                          min={10}
                          max={100}
                          disabled={!config.activo}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    )}
                  </CardContent>

                  <Box sx={{ p: 2.5, pt: 0, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', bgcolor: '#fbfbfb' }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSave(config)}
                      sx={{
                        bgcolor: '#0a192f',
                        '&:hover': {
                          bgcolor: '#172a45',
                        },
                        boxShadow: 'none',
                        borderRadius: 2.5,
                        px: 2.5,
                        py: 1,
                        fontFamily: 'Outfit',
                      }}
                    >
                      Guardar Configuración
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Renderizado de Pestaña 2: Consola de Trazabilidad y GPS */}
        {activeTab === 1 && (
          <Grid container spacing={4}>
            {/* Columna Izquierda: Configuración del GPS Móvil */}
            <Grid item xs={12} lg={4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    bgcolor: '#fbfbfb',
                  }}
                >
                  <GpsFixedIcon sx={{ color: '#0ea5e9' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a' }}>
                    Parámetros de Rastreo
                  </Typography>
                </Box>

                {loadingTracking ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, p: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 3, fontFamily: 'Inter', lineHeight: 1.6 }}>
                        Habilita o deshabilita la emisión periódica de coordenadas de la aplicación móvil de recolección y ajusta el intervalo de envío a la base de datos.
                      </Typography>

                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: trackingActivo ? '#bbf7d0' : '#e2e8f0',
                          bgcolor: trackingActivo ? '#f0fdf4' : '#f8fafc',
                          mb: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: trackingActivo ? '#166534' : '#475569', fontFamily: 'Inter' }}>
                            {trackingActivo ? "Rastreo Habilitado" : "Rastreo Inhabilitado"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'Inter' }}>
                            Estado global en teléfonos
                          </Typography>
                        </Box>
                        <IOSSwitch
                          checked={trackingActivo}
                          onChange={(e) => setTrackingActivo(e.target.checked)}
                        />
                      </Box>

                      <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontFamily: 'Inter' }}>
                            Intervalo de actualización:
                          </Typography>
                          <Typography variant="body2" sx={{ color: trackingActivo ? '#0ea5e9' : '#94a3b8', fontWeight: 800, fontFamily: 'Inter' }}>
                            cada {trackingInterval} minutos
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2, fontFamily: 'Inter', fontSize: '0.75rem' }}>
                          Menor frecuencia ahorra batería en el móvil del recolector.
                        </Typography>
                        <ModernSlider
                          value={trackingInterval}
                          onChange={(e, val) => setTrackingInterval(val)}
                          valueLabelDisplay="auto"
                          step={1}
                          marks={[
                            { value: 1, label: '1m' },
                            { value: 15, label: '15m' },
                            { value: 30, label: '30m' },
                            { value: 45, label: '45m' },
                            { value: 60, label: '60m' }
                          ]}
                          min={1}
                          max={60}
                          disabled={!trackingActivo}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveTracking}
                      sx={{
                        bgcolor: '#0ea5e9',
                        '&:hover': {
                          bgcolor: '#0284c7',
                        },
                        py: 1.5,
                        borderRadius: 3,
                        boxShadow: '0 4px 14px rgba(14, 165, 233, 0.2)',
                        fontFamily: 'Outfit',
                        fontSize: '0.95rem',
                      }}
                    >
                      Guardar Configuración GPS
                    </Button>
                  </CardContent>
                )}
              </Card>
            </Grid>

            {/* Columna Derecha: Mapa y buscador de trayectoria */}
            <Grid item xs={12} lg={8}>
              <MapaTrayectoUsuario />
            </Grid>
          </Grid>
        )}

        {/* Renderizado de Pestaña 3: Carga de Datos Maestros (Sernapesca) */}
        {activeTab === 2 && (
          <Box>
            {/* Cabecera con acción global */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                p: { xs: 2.5, md: 3 },
                mb: 4,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a', mb: 0.5 }}>
                  Poblamiento desde el API de Sernapesca
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', maxWidth: 640, lineHeight: 1.6 }}>
                  Sincroniza las tablas maestras (regiones, comunas, caletas, especies, embarcaciones, buzos y AMERB)
                  consumiendo el servicio público de Sernapesca. Las cargas son idempotentes: puedes repetirlas sin
                  duplicar registros.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={syncLoading === 'ALL' ? <CircularProgress size={18} color="inherit" /> : <CloudSyncIcon />}
                disabled={!!syncLoading}
                onClick={() => runSync({ key: 'ALL', label: 'Todas las tablas', path: '/sync/sernapesca/all' })}
                sx={{
                  bgcolor: '#0a192f',
                  '&:hover': { bgcolor: '#172a45' },
                  boxShadow: 'none',
                  borderRadius: 2.5,
                  px: 3,
                  py: 1.25,
                  fontFamily: 'Outfit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {syncLoading === 'ALL' ? 'Cargando todo...' : 'Cargar Todo'}
              </Button>
            </Card>

            {/* Tarjetas por tabla */}
            <Grid container spacing={3}>
              {SYNC_TASKS.map((task) => {
                const isLoading = syncLoading === task.key;
                return (
                  <Grid item xs={12} sm={6} lg={4} key={task.key}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 4,
                        border: '1px solid #e2e8f0',
                        bgcolor: '#ffffff',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: '#cbd5e1',
                          boxShadow: '0 12px 20px -3px rgba(0,0,0,0.04)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              bgcolor: `${task.color}15`,
                              color: task.color,
                              display: 'flex',
                            }}
                          >
                            {task.icon}
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', fontFamily: 'Outfit', color: '#0f172a' }}>
                            {task.label}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter' }}>
                          {task.descripcion}
                        </Typography>
                      </CardContent>
                      <Box sx={{ p: 2.5, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                          disabled={!!syncLoading}
                          onClick={() => runSync(task)}
                          sx={{
                            borderRadius: 2.5,
                            py: 1,
                            fontFamily: 'Outfit',
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: '#e2e8f0',
                            color: '#0f172a',
                            '&:hover': { borderColor: task.color, color: task.color, bgcolor: `${task.color}08` },
                          }}
                        >
                          {isLoading ? 'Cargando...' : 'Cargar'}
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Resumen de resultados */}
            {Object.keys(syncResults).length > 0 && (
              <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff', mt: 4, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid #f1f5f9', bgcolor: '#fbfbfb' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a' }}>
                    Resumen de la última carga
                  </Typography>
                </Box>
                <Box>
                  {Object.values(syncResults).map((r) => (
                    <Box
                      key={r.entidad}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 1.5,
                        py: 1.75,
                        px: 2.5,
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {r.ok ? (
                          <CheckCircleIcon sx={{ color: '#10b981', fontSize: 22 }} />
                        ) : (
                          <ErrorOutlineIcon sx={{ color: '#ef4444', fontSize: 22 }} />
                        )}
                        <Typography sx={{ fontWeight: 700, fontFamily: 'Inter', color: '#0f172a', textTransform: 'capitalize' }}>
                          {r.entidad.replace(/_/g, ' ')}
                        </Typography>
                      </Box>
                      {r.ok ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip size="small" variant="outlined" label={`Obtenidos: ${r.obtenidos}`} />
                          <Chip size="small" color="success" label={`Insertados: ${r.insertados}`} />
                          {r.actualizados > 0 && <Chip size="small" color="info" label={`Actualizados: ${r.actualizados}`} />}
                          <Chip size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b' }} label={`Omitidos: ${r.omitidos}`} />
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#ef4444', fontFamily: 'Inter' }}>
                          {r.mensaje || 'No disponible'}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Card>
            )}
          </Box>
        )}

      </Box>
  );
}
