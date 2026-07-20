import { useState, useEffect, useRef } from 'react';
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
  PlayArrow as PlayArrowIcon,
  DeleteSweep as DeleteSweepIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import api from '../api/axiosConfig';
import MapaTrayectoUsuario from '../components/dashboard/MapaTrayectoUsuario';
import CuotasExtraccionMaestro from '../components/admin/CuotasExtraccionMaestro';
import VedasEspecieMaestro from '../components/admin/VedasEspecieMaestro';
import FactoryIcon from '@mui/icons-material/Factory';
import ScaleIcon from '@mui/icons-material/Scale';
import BlockIcon from '@mui/icons-material/Block';

// Styled Switch matching IOS visual cues
const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(() => ({
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
        backgroundColor: 'success.main',
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
    backgroundColor: 'divider',
    opacity: 1,
  },
}));

// Premium Styled Slider with gradient highlight
const ModernSlider = styled(Slider)(() => ({
  color: 'secondary.main',
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
    backgroundColor: 'divider',
  },
}));

const getAlertColor = (tipoAlerta) => {
  switch (tipoAlerta) {
    case 'LIMITE_CUOTA':
      return 'warning.main';
    case 'DESVIO_RUTA':
      return 'error.main';
    case 'APLICACION_INACTIVA':
      return 'text.secondary';
    default:
      return 'secondary.main';
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
    color: 'secondary.main',
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
    color: 'success.main',
    icon: <PhishingIcon />,
  },
  {
    key: 'amerb',
    label: 'Áreas de Manejo (AMERB)',
    descripcion: 'Áreas de manejo por región.',
    path: '/sync/sernapesca/amerb',
    color: '#ec4899',
    icon: <TerrainIcon />,
  },
  {
    key: 'plantas',
    label: 'Plantas Destino',
    descripcion: 'Plantas (destinatarios) por región.',
    path: '/sync/sernapesca/plantas',
    color: '#f43f5e',
    icon: <FactoryIcon />,
  },
  {
    key: 'buzos',
    label: 'Buzos',
    descripcion: 'Sincronizar registro de buzos.',
    path: '/sync/sernapesca/buzos',
    color: 'warning.main',
    icon: <PoolIcon />,
  },
  {
    key: 'embarcaciones',
    label: 'Embarcaciones',
    descripcion: 'Sincronizar registro de embarcaciones.',
    path: '/sync/sernapesca/embarcaciones',
    color: '#3b82f6',
    icon: <DirectionsBoatIcon />,
  },
  {
    key: 'usuario-embarcacion',
    label: 'Relación Usuario - Embarcación',
    descripcion: 'Asocia los usuarios con sus embarcaciones de Sernapesca.',
    path: '/sync/sernapesca/usuario-embarcacion',
    color: '#a855f7',
    icon: <LinkIcon />,
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
    } catch (err) {
      console.error(err);
      setMensaje({ type: 'error', text: 'Error al guardar la configuración.' });
    }
  };

  // Polling del avance de la sincronización usuario-embarcación en segundo plano
  const uexPollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (uexPollRef.current) clearInterval(uexPollRef.current);
    };
  }, []);

  const pollUsuarioEmbarcacion = () => {
    if (uexPollRef.current) clearInterval(uexPollRef.current);
    uexPollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('/sync/sernapesca/usuario-embarcacion/estado');
        setSyncResults((prev) => ({
          ...prev,
          usuario_embarcacion: {
            entidad: 'usuario_embarcacion',
            ok: !data.ultimoError,
            obtenidos: data.procesados,
            insertados: data.vinculados,
            actualizados: data.embarcacionesCreadas,
            omitidos: data.omitidos,
            mensaje: data.mensaje,
          },
        }));
        if (!data.enCurso) {
          clearInterval(uexPollRef.current);
          uexPollRef.current = null;
          setMensaje({ type: data.ultimoError ? 'error' : 'success', text: `Relación Usuario-Embarcación — ${data.mensaje}` });
          setTimeout(() => setMensaje(null), 8000);
        }
      } catch {
        clearInterval(uexPollRef.current);
        uexPollRef.current = null;
      }
    }, 4000);
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

      // Si la respuesta incluye la tarea usuario-embarcación (corre en segundo plano),
      // seguimos su avance con el endpoint de estado.
      if (arr.some((r) => r && r.entidad === 'usuario_embarcacion' && r.ok)) {
        pollUsuarioEmbarcacion();
      }

      const customMsg = arr.find(r => r.mensaje)?.mensaje;
      if (customMsg) {
        setMensaje({ type: 'success', text: customMsg });
      } else {
        const insertados = arr.reduce((sum, r) => sum + (r.insertados || 0), 0);
        const obtenidos = arr.reduce((sum, r) => sum + (r.obtenidos || 0), 0);
        const omitidos = arr.reduce((sum, r) => sum + (r.omitidos || 0), 0);
        
        setMensaje({ 
          type: 'success', 
          text: `${task.label}: Se obtuvieron ${obtenidos} registros del API. ${insertados} insertados, ${omitidos} omitidos (ya existentes).` 
        });
      }
      setTimeout(() => setMensaje(null), 8000);
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

  const handleVaciarTablas = async () => {
    if (!window.confirm("¿Estás seguro de que deseas vaciar las tablas de declaraciones y maestros? Esta acción no se puede deshacer.")) {
      return;
    }
    setMensaje(null);
    try {
      setSyncLoading('VACIAR');
      await api.delete('/admin/database/vaciar-tablas');
      setMensaje({ type: 'success', text: 'Tablas maestras y declaraciones vaciadas correctamente.' });
    } catch (error) {
      console.error('Error al vaciar las tablas', error);
      setMensaje({
        type: 'error',
        text: 'Error al vaciar las tablas. Verifica que el backend esté accesible.',
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
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, #0a192f 0%, #172a45 100%)',
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            mb: 4,
            color: '#fff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 3,
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : 'none',
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
              <AdminPanelSettingsIcon sx={{ fontSize: 36, color: 'secondary.main' }} />
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
              <Typography variant="body2" sx={{ fontWeight: 800, color: trackingActivo ? 'success.main' : 'error.main', mt: 0.5 }}>
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
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'secondary.main', mt: 0.5 }}>
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
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'warning.main', mt: 0.5 }}>
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
              border: (theme) => `1px solid ${mensaje.type === 'success' ? (theme.palette.mode === 'dark' ? theme.palette.success.dark : '#a7f3d0') : (theme.palette.mode === 'dark' ? theme.palette.error.dark : '#fecaca')}`,
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
            borderBottom: 1, borderColor: 'divider',
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: 'secondary.main',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              fontFamily: 'Outfit',
              color: 'text.secondary',
              pb: 1.5,
              '&.Mui-selected': {
                color: 'secondary.main',
              },
            },
          }}
        >
          <Tab icon={<TuneIcon sx={{ mr: 1 }} />} iconPosition="start" label="Configuración de Alertas" />
          <Tab icon={<ScaleIcon sx={{ mr: 1 }} />} iconPosition="start" label="Cuotas de Extracción" />
          <Tab icon={<BlockIcon sx={{ mr: 1 }} />} iconPosition="start" label="Vedas de Especies" />
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
                    border: 1, borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    bgcolor: 'background.paper',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                    '&:hover': {
                      borderColor: 'divider',
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
                      bgcolor: config.activo ? getAlertColor(config.tipoAlerta) : 'divider',
                      transition: 'background-color 0.3s ease',
                    }}
                  />

                  <CardContent sx={{ p: 3, flexGrow: 1, pl: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: config.activo ? `${getAlertColor(config.tipoAlerta)}15` : 'divider',
                          color: config.activo ? getAlertColor(config.tipoAlerta) : 'text.disabled',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {getAlertIcon(config.tipoAlerta)}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'Outfit', color: 'text.primary' }}>
                          {config.titulo}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                          Tipo: {config.tipoAlerta}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, mt: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: config.activo ? 'text.primary' : 'text.secondary', fontFamily: 'Inter' }}>
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
                            color: config.activo ? 'success.main' : 'text.secondary',
                            fontFamily: 'Inter',
                          }
                        }}
                      />
                    </Box>

                    {config.tipoAlerta === 'LIMITE_CUOTA' && (
                      <Box sx={{ mt: 3, mb: 1, p: 2.5, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'background.default', border: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontFamily: 'Inter' }}>
                            Umbral de disparo:
                          </Typography>
                          <Typography variant="body2" sx={{ color: config.activo ? 'secondary.main' : 'text.disabled', fontWeight: 800, fontFamily: 'Inter' }}>
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

                  <Box sx={{ p: 2.5, pt: 0, display: 'flex', justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'background.default' }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSave(config)}
                      sx={{
                        bgcolor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.light',
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

        {/* Renderizado de Pestaña 2: Mantenedor de Cuotas de Extracción */}
        {activeTab === 1 && <CuotasExtraccionMaestro />}

        {/* Renderizado de Pestaña 3: Mantenedor de Vedas de Especies */}
        {activeTab === 2 && <VedasEspecieMaestro />}

        {/* Renderizado de Pestaña 4: Consola de Trazabilidad y GPS */}
        {activeTab === 3 && (
          <Grid container spacing={4}>
            {/* Columna Izquierda: Configuración del GPS Móvil */}
            <Grid item xs={12} lg={4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: 1, borderColor: 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderBottom: 1, borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'background.default',
                  }}
                >
                  <GpsFixedIcon sx={{ color: 'secondary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
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
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, fontFamily: 'Inter', lineHeight: 1.6 }}>
                        Habilita o deshabilita la emisión periódica de coordenadas de la aplicación móvil de recolección y ajusta el intervalo de envío a la base de datos.
                      </Typography>

                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: trackingActivo 
                            ? (theme) => theme.palette.mode === 'dark' ? 'success.dark' : '#bbf7d0'
                            : 'divider',
                          bgcolor: trackingActivo 
                            ? (theme) => theme.palette.mode === 'dark' ? 'rgba(22, 163, 74, 0.1)' : '#f0fdf4'
                            : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'background.default',
                          mb: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: trackingActivo ? (theme) => theme.palette.mode === 'dark' ? 'success.light' : '#166534' : 'text.primary', fontFamily: 'Inter' }}>
                            {trackingActivo ? "Rastreo Habilitado" : "Rastreo Inhabilitado"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                            Estado global en teléfonos
                          </Typography>
                        </Box>
                        <IOSSwitch
                          checked={trackingActivo}
                          onChange={(e) => setTrackingActivo(e.target.checked)}
                        />
                      </Box>

                      <Box sx={{ p: 2.5, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'background.default', mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontFamily: 'Inter' }}>
                            Intervalo de actualización:
                          </Typography>
                          <Typography variant="body2" sx={{ color: trackingActivo ? 'secondary.main' : 'text.disabled', fontWeight: 800, fontFamily: 'Inter' }}>
                            cada {trackingInterval} minutos
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2, fontFamily: 'Inter', fontSize: '0.75rem' }}>
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
                        bgcolor: 'secondary.main',
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

        {/* Renderizado de Pestaña 5: Carga de Datos Maestros (Sernapesca) */}
        {activeTab === 4 && (
          <Box>
            {/* Cabecera con acción global */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: 1, borderColor: 'divider',
                bgcolor: 'background.paper',
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
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', mb: 0.5 }}>
                  Poblamiento desde el API de Sernapesca
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', maxWidth: 640, lineHeight: 1.6 }}>
                  Sincroniza las tablas maestras (regiones, comunas, caletas, especies, embarcaciones, buzos y AMERB)
                  consumiendo el servicio público de Sernapesca. Las cargas son idempotentes: puedes repetirlas sin
                  duplicar registros.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={syncLoading === 'VACIAR' ? <CircularProgress size={18} color="inherit" /> : <DeleteSweepIcon />}
                  disabled={!!syncLoading}
                  onClick={handleVaciarTablas}
                  sx={{
                    borderRadius: 2.5,
                    px: 3,
                    py: 1.25,
                    fontFamily: 'Outfit',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {syncLoading === 'VACIAR' ? 'Vaciando...' : 'Vaciar Tablas'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={syncLoading === 'ALL' ? <CircularProgress size={18} color="inherit" /> : <CloudSyncIcon />}
                  disabled={!!syncLoading}
                  onClick={() => runSync({ key: 'ALL', label: 'Todas las tablas', path: '/sync/sernapesca/all' })}
                  sx={{
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.light' },
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
              </Box>
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
                        border: 1, borderColor: 'divider',
                        bgcolor: 'background.paper',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: 'divider',
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
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', fontFamily: 'Outfit', color: 'text.primary' }}>
                            {task.label}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
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
                            borderColor: 'divider',
                            color: 'text.primary',
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
              <Card elevation={0} sx={{ borderRadius: 4, border: 1, borderColor: 'divider', bgcolor: 'background.paper', mt: 4, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'background.default' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
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
                        borderBottom: 1, borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {r.ok ? (
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22 }} />
                        ) : (
                          <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 22 }} />
                        )}
                        <Typography sx={{ fontWeight: 700, fontFamily: 'Inter', color: 'text.primary', textTransform: 'capitalize' }}>
                          {r.entidad.replace(/_/g, ' ')}
                        </Typography>
                      </Box>
                      {r.ok ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip size="small" variant="outlined" label={`Obtenidos: ${r.obtenidos}`} />
                          <Chip size="small" color="success" label={`Insertados: ${r.insertados}`} />
                          {r.actualizados > 0 && <Chip size="small" color="info" label={`Actualizados: ${r.actualizados}`} />}
                          <Chip size="small" sx={{ bgcolor: 'divider', color: 'text.secondary' }} label={`Omitidos: ${r.omitidos}`} />
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'error.main', fontFamily: 'Inter' }}>
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
