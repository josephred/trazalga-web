import { useState, useEffect, useContext } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, 
  ListItemButton, ListItemIcon, ListItemText, Avatar, Button, IconButton,
  Menu, MenuItem, Divider, Badge, Snackbar, Alert, Popover, Tooltip, useMediaQuery, Chip
} from '@mui/material';
import { 
  Home as HomeIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarTodayIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from '../../theme/ThemeContext';
import sernapescaLogo from '../../assets/sernapesca.png';
import { onMessageListener } from '../../firebase';
import { getPerfil, getNombre, getUsuarioId, getRegion, cerrarSesion, revalidarPerfilServidor } from '../../auth/sesion';
import { puedeVer } from '../../auth/perfiles';
import api from '../../api/axiosConfig';
import { getDefaultDateRange, loadUserDateRange, saveUserDateRange, shiftMonthRange } from '../../utils/fechas';

export { getDefaultDateRange };

const DRAWER_WIDTH_EXPANDED = 240;
const DRAWER_WIDTH_COLLAPSED = 72;
const COLLAPSED_STORAGE_KEY = 'trazalga_sidebar_collapsed';

// TF.6: «Casos» y «Mapa» salen del menú hasta que existan implementaciones oficiales
const menuItems = [
  { text: 'Inicio', icon: <HomeIcon />, path: '/dashboard' },
  { text: 'Consultas', icon: <SearchIcon />, path: '/consultas' },
  { text: 'Alertas', icon: <NotificationsIcon />, path: '/alertas' },
  { text: 'Reportes', icon: <BarChartIcon />, path: '/reportes' },
  { text: 'Administración', icon: <SettingsIcon />, path: '/administracion' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  // Breakpoints responsivos
  // isMobile: teléfonos y pantallas ultra compactas (< 600px / xs)
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // isTabletOrSmall: tablets y pantallas medianas (600px - 1199px / sm & md)
  const isTabletOrSmall = useMediaQuery(theme.breakpoints.between('sm', 'lg'));

  // Estado del drawer temporal en móviles (< 600px)
  const [mobileOpen, setMobileOpen] = useState(false);

  // Estado de colapso a solo íconos (rail) para >= 600px.
  // En pantallas chicas y medianas (< 1200px), por defecto se reduce a solo íconos
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    } catch {
      // Ignorar error de almacenamiento
    }
    return window.innerWidth < 1200;
  });

  // Ajuste automático al cambiar tamaño de pantalla a rango tablet/mediano
  useEffect(() => {
    if (isTabletOrSmall) {
      setCollapsed(true);
    }
  }, [isTabletOrSmall]);

  // Popover fecha en móvil y pantallas medianas
  const [datePopoverEl, setDatePopoverEl] = useState(null);

  // Estados de notificaciones y usuario
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const openNotif = Boolean(notifAnchorEl);
  const [notifications, setNotifications] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', title: '' });

  const usuarioId = getUsuarioId();
  const perfil = getPerfil();
  const nombre = getNombre();
  const [region, setRegion] = useState(() => getRegion());
  const itemsVisibles = menuItems.filter((item) => puedeVer(perfil, item.path));

  useEffect(() => {
    revalidarPerfilServidor(api).then((data) => {
      if (data?.region) {
        setRegion(data.region);
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onMessageListener((payload) => {
      console.log('Notificación recibida en foreground:', payload);
      const title = payload.notification?.title || 'Nueva Notificación';
      const body = payload.notification?.body || '';
      
      setNotifications(prev => [{ title, body, time: new Date().toLocaleTimeString() }, ...prev]);
      setSnackbar({ open: true, title, message: body });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Rango de fechas por defecto: mes en curso en America/Santiago, recordado por usuario
  const [dateRange, setDateRange] = useState(() => loadUserDateRange(usuarioId));

  const handleStartDateChange = (e) => {
    const next = { ...dateRange, startDate: e.target.value };
    setDateRange(next);
    saveUserDateRange(usuarioId, next);
  };
  
  const handleEndDateChange = (e) => {
    const next = { ...dateRange, endDate: e.target.value };
    setDateRange(next);
    saveUserDateRange(usuarioId, next);
  };

  const handleShiftMonth = (offset) => {
    const next = shiftMonthRange(dateRange, offset);
    setDateRange(next);
    saveUserDateRange(usuarioId, next);
  };

  // Conmutador del menú: en móviles abre/cierra el drawer overlay, en escritorio/tablet expande o colapsa a íconos
  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
        } catch {
          // Ignorar error de almacenamiento
        }
        return next;
      });
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotifClick = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  // Helper para título y subtítulo dinámico
  const getCurrentPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return { title: 'Dashboard Ejecutivo', subtitle: 'Resumen general de indicadores y alertas' };
      case '/consultas': return { title: 'Consultas', subtitle: 'Búsqueda puntual en terreno por folio o patente' };
      case '/alertas': return { title: 'Alertas', subtitle: 'Gestión y monitoreo de alertas normativas' };
      case '/casos': return { title: 'Casos', subtitle: 'Seguimiento de casos registrados' };
      case '/reportes': return { title: 'Reportes', subtitle: 'Planillas masivas y relaciones de transporte' };
      case '/mapa': return { title: 'Mapa SIG', subtitle: 'Distribución geográfica del recurso' };
      case '/administracion': return { title: 'Configuración de Parámetros', subtitle: 'Ajustes globales de alertas, cuotas y maestros' };
      case '/ayuda': return { title: 'Ayuda', subtitle: 'Documentación y soporte técnico' };
      default: return { title: 'TRAZALGA', subtitle: 'Portal de Control de Trazabilidad' };
    }
  };

  const { title, subtitle } = getCurrentPageTitle();

  // Ancho efectivo del sidebar permanente
  const currentDrawerWidth = isMobile
    ? 260
    : (collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED);

  // Renderizador unificado del contenido del menú lateral
  const renderSidebarContent = (isTemporaryDrawer = false) => {
    const isIconOnly = !isTemporaryDrawer && collapsed;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Cabecera del Sidebar con Logo e Interacción */}
        <Box 
          sx={{ 
            height: 68,
            minHeight: 68,
            px: isIconOnly ? 1 : 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isIconOnly ? 'center' : 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            bgcolor: 'rgba(0,0,0,0.18)',
            transition: 'padding 200ms ease'
          }}
        >
          {isIconOnly ? (
            <Tooltip title="Expandir menú lateral (TRAZALGA)" placement="right" arrow>
              <Box 
                onClick={handleToggleSidebar} 
                sx={{ 
                  cursor: 'pointer', 
                  p: 0.75, 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 180ms ease, transform 180ms ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.08)',
                    transform: 'scale(1.06)'
                  } 
                }}
              >
                <img 
                  src={sernapescaLogo} 
                  alt="Sernapesca" 
                  style={{ 
                    height: 34, 
                    width: 34, 
                    objectFit: 'contain' 
                  }} 
                />
              </Box>
            </Tooltip>
          ) : (
            <>
              <Box 
                onClick={() => handleNavClick('/dashboard')} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5, 
                  cursor: 'pointer',
                  minWidth: 0,
                  flex: 1
                }}
              >
                <img 
                  src={sernapescaLogo} 
                  alt="Sernapesca" 
                  style={{ 
                    height: 42, 
                    maxHeight: 46, 
                    objectFit: 'contain' 
                  }} 
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography 
                    variant="subtitle1" 
                    noWrap
                    sx={{ 
                      fontWeight: 900, 
                      color: '#fff', 
                      fontFamily: 'Outfit', 
                      lineHeight: 1.1,
                      letterSpacing: '0.6px'
                    }}
                  >
                    TRAZALGA
                  </Typography>
                  <Typography 
                    variant="caption" 
                    noWrap
                    sx={{ 
                      color: '#38bdf8', 
                      fontFamily: 'Inter', 
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      display: 'block',
                      letterSpacing: '0.3px'
                    }}
                  >
                    SERNAPESCA
                  </Typography>
                </Box>
              </Box>

              {/* Botón de cierre en móvil o colapso en escritorio */}
              {isTemporaryDrawer ? (
                <IconButton 
                  onClick={() => setMobileOpen(false)} 
                  size="small" 
                  aria-label="Cerrar menú"
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    bgcolor: 'rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } 
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              ) : (
                <Tooltip title="Contraer a solo íconos" placement="bottom" arrow>
                  <IconButton 
                    onClick={handleToggleSidebar} 
                    size="small" 
                    aria-label="Contraer menú a solo íconos"
                    sx={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      bgcolor: 'rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      p: 0.6,
                      '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } 
                    }}
                  >
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>

        {/* Lista de Navegación Principal */}
        <List sx={{ flex: 1, py: 1.5, px: isIconOnly ? 0.75 : 1.25, overflowY: 'auto' }}>
          {itemsVisibles.map((item) => {
            const isActive = location.pathname === item.path;

            const buttonContent = (
              <ListItemButton 
                onClick={() => handleNavClick(item.path)}
                aria-label={item.text}
                sx={{
                  minHeight: 46,
                  height: 46,
                  justifyContent: isIconOnly ? 'center' : 'flex-start',
                  px: isIconOnly ? 0 : 2,
                  mb: 0.75,
                  borderRadius: '12px',
                  bgcolor: isActive ? 'rgba(14, 165, 233, 0.16)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  border: isActive ? '1px solid rgba(14, 165, 233, 0.35)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 16px rgba(14, 165, 233, 0.2)' : 'none',
                  transition: 'background-color 180ms ease, color 180ms ease, border-color 180ms ease, transform 180ms ease',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(14, 165, 233, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    transform: isIconOnly ? 'scale(1.06)' : 'none',
                    '& .MuiListItemIcon-root': {
                      color: '#38bdf8',
                      transform: 'scale(1.08)',
                    }
                  }
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 0,
                    mr: isIconOnly ? 0 : 1.75,
                    justifyContent: 'center',
                    color: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)', 
                    transition: 'color 180ms ease, transform 180ms ease',
                    '& .MuiSvgIcon-root': {
                      fontSize: 22
                    }
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isIconOnly && (
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      margin: 0,
                      opacity: 1,
                      whiteSpace: 'nowrap',
                      '& .MuiListItemText-primary': { 
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.885rem',
                        fontFamily: 'Outfit',
                        color: isActive ? '#fff' : 'inherit',
                        letterSpacing: '0.2px'
                      } 
                    }} 
                  />
                )}
              </ListItemButton>
            );

            return (
              <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                {isIconOnly ? (
                  <Tooltip 
                    title={item.text} 
                    placement="right" 
                    arrow
                    slotProps={{
                      tooltip: {
                        sx: {
                          bgcolor: '#0f172a',
                          color: '#f8fafc',
                          border: '1px solid rgba(255,255,255,0.15)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                          fontFamily: 'Outfit',
                          fontWeight: 600,
                          fontSize: '0.825rem',
                          px: 1.5,
                          py: 0.75,
                          borderRadius: '8px'
                        }
                      },
                      arrow: { sx: { color: '#0f172a' } }
                    }}
                  >
                    {buttonContent}
                  </Tooltip>
                ) : (
                  buttonContent
                )}
              </ListItem>
            );
          })}
        </List>

        {/* Sección Inferior: Ayuda y Toggle de Expansión */}
        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', p: isIconOnly ? 0.75 : 1.25 }}>
          <ListItem disablePadding sx={{ display: 'block' }}>
            {isIconOnly ? (
              <Tooltip 
                title="Ayuda y Soporte" 
                placement="right" 
                arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: '#0f172a',
                      color: '#f8fafc',
                      border: '1px solid rgba(255,255,255,0.15)',
                      fontFamily: 'Outfit',
                      fontWeight: 600,
                      fontSize: '0.825rem',
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '8px'
                    }
                  },
                  arrow: { sx: { color: '#0f172a' } }
                }}
              >
                <ListItemButton 
                  onClick={() => handleNavClick('/ayuda')}
                  aria-label="Ayuda"
                  sx={{
                    minHeight: 44,
                    height: 44,
                    justifyContent: 'center',
                    px: 0,
                    borderRadius: '12px',
                    color: location.pathname === '/ayuda' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                    bgcolor: location.pathname === '/ayuda' ? 'rgba(14, 165, 233, 0.16)' : 'transparent',
                    border: location.pathname === '/ayuda' ? '1px solid rgba(14, 165, 233, 0.35)' : '1px solid transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      transform: 'scale(1.06)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: location.pathname === '/ayuda' ? '#38bdf8' : 'inherit' }}>
                    <HelpIcon sx={{ fontSize: 22 }} />
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            ) : (
              <ListItemButton 
                onClick={() => handleNavClick('/ayuda')}
                aria-label="Ayuda"
                sx={{
                  minHeight: 44,
                  height: 44,
                  justifyContent: 'flex-start',
                  px: 2,
                  borderRadius: '10px',
                  color: location.pathname === '/ayuda' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  bgcolor: location.pathname === '/ayuda' ? 'rgba(14, 165, 233, 0.16)' : 'transparent',
                  border: location.pathname === '/ayuda' ? '1px solid rgba(14, 165, 233, 0.35)' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    '& .MuiListItemIcon-root': { color: '#38bdf8' }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 1.75, justifyContent: 'center', color: location.pathname === '/ayuda' ? '#38bdf8' : 'rgba(255,255,255,0.7)' }}>
                  <HelpIcon sx={{ fontSize: 22 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Ayuda" 
                  sx={{ 
                    margin: 0,
                    '& .MuiListItemText-primary': { 
                      fontFamily: 'Outfit',
                      fontWeight: location.pathname === '/ayuda' ? 700 : 500,
                      fontSize: '0.885rem',
                    } 
                  }} 
                />
              </ListItemButton>
            )}
          </ListItem>

          {/* Botón rápido para alternar colapso en pantallas de escritorio y tablets */}
          {!isTemporaryDrawer && (
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Tooltip 
                title={collapsed ? "Expandir barra lateral" : "Contraer a solo íconos"} 
                placement="right" 
                arrow 
                disableHoverListener={!collapsed}
              >
                <ListItemButton
                  onClick={handleToggleSidebar}
                  aria-label={collapsed ? "Expandir barra lateral" : "Contraer a solo íconos"}
                  sx={{
                    minHeight: 38,
                    height: 38,
                    justifyContent: isIconOnly ? 'center' : 'flex-start',
                    px: isIconOnly ? 0 : 2,
                    borderRadius: '10px',
                    color: 'rgba(255,255,255,0.5)',
                    transition: 'all 180ms ease',
                    '&:hover': {
                      color: '#fff',
                      bgcolor: 'rgba(255,255,255,0.06)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: isIconOnly ? 0 : 1.75, justifyContent: 'center', color: 'inherit' }}>
                    {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                  </ListItemIcon>
                  {!isIconOnly && (
                    <ListItemText
                      primary="Contraer menú"
                      sx={{
                        margin: 0,
                        '& .MuiListItemText-primary': {
                          fontSize: '0.75rem',
                          fontFamily: 'Inter',
                          color: 'inherit',
                          fontWeight: 600
                        }
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </Box>
          )}
        </Box>

      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        
      {/* ═══════════ SIDEBAR RESPONSIVO ═══════════ */}

      {/* 1. Modo Móvil (< 600px): Drawer temporal desplegable con backdrop blur */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true, // Optimización de renderizado en dispositivos móviles
          }}
          slotProps={{
            backdrop: {
              sx: {
                backdropFilter: 'blur(6px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              width: 270,
              boxSizing: 'border-box',
              bgcolor: theme.palette.mode === 'light' ? '#0a192f' : '#070d18',
              backgroundImage: 'linear-gradient(180deg, #0a192f 0%, #06101e 100%)',
              color: '#fff',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '8px 0 32px rgba(0,0,0,0.3)',
            },
          }}
        >
          {renderSidebarContent(true)}
        </Drawer>
      ) : (
        /* 2. Modo Tablet y Escritorio (>= 600px): Drawer permanente adaptable (72px solo íconos vs 240px expandido) */
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            width: currentDrawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: currentDrawerWidth,
              boxSizing: 'border-box',
              bgcolor: theme.palette.mode === 'light' ? '#0a192f' : '#070d18',
              backgroundImage: theme.palette.mode === 'light'
                ? 'linear-gradient(180deg, #0a192f 0%, #06101e 100%)'
                : 'linear-gradient(180deg, #09101d 0%, #040810 100%)',
              color: '#fff',
              borderRight: '1px solid',
              borderColor: 'divider',
              overflowX: 'hidden',
              transition: theme.transitions.create(['width'], {
                easing: theme.transitions.easing.easeInOut,
                duration: 220,
              }),
              boxShadow: '4px 0 24px rgba(0,0,0,0.06)'
            },
          }}
        >
          {renderSidebarContent(false)}
        </Drawer>
      )}

      {/* ═══════════ ÁREA DE CONTENIDO PRINCIPAL ═══════════ */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh', 
          overflow: 'hidden', 
          position: 'relative',
          width: { 
            xs: '100%', 
            sm: `calc(100% - ${currentDrawerWidth}px)` 
          },
          maxWidth: '100vw',
          transition: theme.transitions.create(['width', 'margin-left'], {
            easing: theme.transitions.easing.easeInOut,
            duration: 220,
          }),
        }}
      >
        
        {/* ═══════════ HEADER (BARRA SUPERIOR CON GLASSMORPHISM) ═══════════ */}
        <AppBar 
          position="static" 
          color="transparent" 
          elevation={0} 
          sx={{ 
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(12px)',
            backgroundImage: 'none',
            zIndex: (t) => t.zIndex.drawer - 1,
          }}
        >
          <Toolbar 
            sx={{ 
              px: { xs: 1.25, sm: 2, md: 3 }, 
              py: 0.75, 
              minHeight: { xs: 56, sm: 64 },
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: 1
            }}
          >
            
            {/* Sección Izquierda: Botón Hamburguesa + Identificador y Título */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5, md: 2 }, minWidth: 0, flex: 1 }}>
              
              {/* Botón de Hamburguesa Inteligente:
                  - En móviles (< 600px): Abre/cierra el drawer overlay
                  - En tablets y pantallas medianas (600px - 1199px) y escritorio: Alterna entre solo íconos (72px) y expandido (240px)
              */}
              <Tooltip title={isMobile ? (mobileOpen ? "Cerrar menú" : "Abrir menú de navegación") : (collapsed ? "Expandir barra lateral" : "Contraer a solo íconos")}>
                <IconButton
                  color="inherit"
                  aria-label={isMobile ? "Abrir menú de navegación" : (collapsed ? "Expandir barra lateral" : "Contraer barra lateral")}
                  edge="start"
                  onClick={handleToggleSidebar}
                  sx={{ 
                    color: 'text.primary',
                    bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    p: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <MenuIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Marca compacta visible en tablets/medianas cuando el sidebar está contraído a íconos */}
              {collapsed && !isMobile && (
                <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 0.5 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 900, 
                      color: 'text.primary', 
                      fontFamily: 'Outfit', 
                      lineHeight: 1,
                      letterSpacing: '0.5px',
                      fontSize: '1.05rem'
                    }}
                  >
                    TRAZALGA
                  </Typography>
                </Box>
              )}

              {/* Título de Página, Subtítulo y Badge Regional */}
              <Box sx={{ 
                borderLeft: { xs: 'none', sm: collapsed ? 1 : 'none', md: 1 }, 
                borderColor: 'divider', 
                pl: { xs: 0, sm: collapsed ? 1.5 : 0, md: 2 },
                minWidth: 0,
                overflow: 'hidden'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="h6" 
                    noWrap
                    sx={{ 
                      fontWeight: 800, 
                      color: 'text.primary', 
                      fontFamily: 'Outfit', 
                      lineHeight: 1.2,
                      fontSize: { xs: '0.95rem', sm: '1.15rem', md: '1.25rem' }
                    }}
                  >
                    {title}
                  </Typography>
                  {region && (
                    <Chip 
                      label={region} 
                      size="small" 
                      sx={{ 
                        height: 22, 
                        fontSize: '0.675rem', 
                        fontWeight: 700, 
                        bgcolor: 'rgba(14, 165, 233, 0.1)', 
                        color: 'secondary.main', 
                        border: '1px solid rgba(14, 165, 233, 0.25)',
                        display: { xs: 'none', md: 'inline-flex' }
                      }} 
                    />
                  )}
                </Box>
                <Typography 
                  noWrap
                  sx={{ 
                    fontSize: { xs: '0.675rem', sm: '0.725rem' }, 
                    color: 'text.secondary', 
                    fontFamily: 'Inter',
                    display: { xs: 'none', md: 'block' }
                  }}
                >
                  {subtitle}
                </Typography>
              </Box>
            </Box>

            {/* Sección Derecha: Acciones Rápidas, Fechas y Perfil de Usuario */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1, md: 1.5 } }}>
              
              {/* Filtro de Fechas:
                  - En pantallas grandes (>= 1200px / lg): Input visual directo integrado en cápsula
                  - En pantallas chicas y medianas (< 1200px): Botón cápsula estilizado que abre popover compacto
              */}
              <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  bgcolor: (t) => t.palette.mode === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.04)', 
                  border: '1px solid',
                  borderColor: 'divider', 
                  borderRadius: '24px', 
                  px: 0.75, 
                  py: 0.35,
                  transition: 'all 0.2s ease',
                  '&:focus-within': {
                    borderColor: 'primary.main'
                  }
                }}>
                  <Tooltip title="Mes anterior">
                    <IconButton 
                      size="small" 
                      onClick={() => handleShiftMonth(-1)}
                      aria-label="Mes anterior"
                      sx={{ 
                        p: 0.4, 
                        color: 'text.secondary',
                        '&:hover': { 
                          color: 'primary.main', 
                          bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' 
                        }
                      }}
                    >
                      <ChevronLeftIcon sx={{ fontSize: '1.15rem' }} />
                    </IconButton>
                  </Tooltip>
                  <CalendarTodayIcon sx={{ color: 'text.secondary', mx: 0.75, fontSize: '0.85rem' }} />
                  <input 
                    type="date" 
                    value={dateRange.startDate} 
                    onChange={handleStartDateChange} 
                    aria-label="Fecha inicio"
                    style={{ 
                      border: 'none', 
                      outline: 'none', 
                      color: theme.palette.text.primary, 
                      fontSize: '0.785rem', 
                      backgroundColor: 'transparent',
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      colorScheme: theme.palette.mode
                    }} 
                  />
                  <Typography sx={{ color: 'text.secondary', mx: 0.5, fontSize: '0.8rem' }}> - </Typography>
                  <input 
                    type="date" 
                    value={dateRange.endDate} 
                    onChange={handleEndDateChange} 
                    aria-label="Fecha fin"
                    style={{ 
                      border: 'none', 
                      outline: 'none', 
                      color: theme.palette.text.primary, 
                      fontSize: '0.785rem', 
                      backgroundColor: 'transparent',
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      colorScheme: theme.palette.mode
                    }} 
                  />
                  <Tooltip title="Mes siguiente">
                    <IconButton 
                      size="small" 
                      onClick={() => handleShiftMonth(1)}
                      aria-label="Mes siguiente"
                      sx={{ 
                        p: 0.4, 
                        color: 'text.secondary',
                        '&:hover': { 
                          color: 'primary.main', 
                          bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' 
                        }
                      }}
                    >
                      <ChevronRightIcon sx={{ fontSize: '1.15rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<FilterListIcon sx={{ fontSize: '0.9rem' }} />}
                  sx={{ 
                    display: { xs: 'none', xl: 'inline-flex' },
                    textTransform: 'none', 
                    bgcolor: 'primary.main', 
                    '&:hover': { bgcolor: 'primary.light' },
                    borderRadius: '24px',
                    px: 2,
                    py: 0.6,
                    fontFamily: 'Outfit',
                    fontSize: '0.8rem',
                    boxShadow: 'none',
                  }}
                >
                  Filtros
                </Button>
              </Box>

              {/* Botón de Fechas Adaptativo para Móviles, Tablets y Pantallas Medianas (< lg) */}
              <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Mes anterior">
                  <IconButton 
                    size="small"
                    onClick={() => handleShiftMonth(-1)}
                    aria-label="Mes anterior"
                    sx={{ 
                      p: 0.4, 
                      color: 'text.secondary',
                      bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <ChevronLeftIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Filtrar por rango de fechas">
                  <Button 
                    size="small"
                    variant="outlined"
                    onClick={(e) => setDatePopoverEl(e.currentTarget)} 
                    startIcon={<CalendarTodayIcon sx={{ fontSize: '0.85rem', color: 'secondary.main' }} />}
                    sx={{ 
                      borderRadius: '20px',
                      textTransform: 'none',
                      px: { xs: 1, sm: 1.5 },
                      py: 0.4,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'text.primary',
                      borderColor: 'divider',
                      bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'
                      }
                    }}
                    aria-label="Filtrar por fechas"
                  >
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                      {dateRange.startDate ? `${dateRange.startDate.slice(5)} al ${dateRange.endDate.slice(5)}` : 'Fechas'}
                    </Box>
                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                      Fechas
                    </Box>
                  </Button>
                </Tooltip>

                <Tooltip title="Mes siguiente">
                  <IconButton 
                    size="small"
                    onClick={() => handleShiftMonth(1)}
                    aria-label="Mes siguiente"
                    sx={{ 
                      p: 0.4, 
                      color: 'text.secondary',
                      bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <ChevronRightIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>

                <Popover
                  open={Boolean(datePopoverEl)}
                  anchorEl={datePopoverEl}
                  onClose={() => setDatePopoverEl(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{
                    paper: {
                      elevation: 6,
                      sx: { 
                        p: 2.5, 
                        mt: 1, 
                        borderRadius: 3, 
                        width: 300, 
                        border: 1, 
                        borderColor: 'divider',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.12)' 
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
                      Rango de Fechas
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Mes anterior">
                        <IconButton 
                          size="small" 
                          onClick={() => handleShiftMonth(-1)}
                          aria-label="Mes anterior"
                          sx={{ p: 0.4 }}
                        >
                          <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mes siguiente">
                        <IconButton 
                          size="small" 
                          onClick={() => handleShiftMonth(1)}
                          aria-label="Mes siguiente"
                          sx={{ p: 0.4 }}
                        >
                          <ChevronRightIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 600 }}>
                        Desde:
                      </Typography>
                      <input 
                        type="date" 
                        value={dateRange.startDate} 
                        onChange={handleStartDateChange} 
                        style={{ 
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${theme.palette.divider}`,
                          color: theme.palette.text.primary, 
                          fontSize: '0.85rem', 
                          backgroundColor: theme.palette.background.default,
                          fontFamily: 'Inter',
                          fontWeight: 600,
                          colorScheme: theme.palette.mode,
                          boxSizing: 'border-box'
                        }} 
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 600 }}>
                        Hasta:
                      </Typography>
                      <input 
                        type="date" 
                        value={dateRange.endDate} 
                        onChange={handleEndDateChange} 
                        style={{ 
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${theme.palette.divider}`,
                          color: theme.palette.text.primary, 
                          fontSize: '0.85rem', 
                          backgroundColor: theme.palette.background.default,
                          fontFamily: 'Inter',
                          fontWeight: 600,
                          colorScheme: theme.palette.mode,
                          boxSizing: 'border-box'
                        }} 
                      />
                    </Box>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={() => setDatePopoverEl(null)} 
                      sx={{ 
                        mt: 0.5, 
                        textTransform: 'none', 
                        fontFamily: 'Outfit',
                        fontWeight: 700,
                        borderRadius: '8px'
                      }}
                    >
                      Aplicar Rango
                    </Button>
                  </Box>
                </Popover>
              </Box>

              {/* Alternador de Tema Claro / Oscuro */}
              <Tooltip title={theme.palette.mode === 'dark' ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
                <IconButton 
                  color="inherit" 
                  onClick={colorMode.toggleColorMode} 
                  sx={{ color: 'text.secondary', p: 0.9 }} 
                  aria-label="Cambiar tema claro/oscuro"
                >
                  {theme.palette.mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              {/* Campana de Notificaciones con Badge */}
              <Tooltip title="Notificaciones">
                <IconButton 
                  color="inherit" 
                  onClick={handleNotifClick} 
                  sx={{ color: 'text.secondary', p: 0.9 }} 
                  aria-label="Notificaciones"
                >
                  <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              {/* Menú de Notificaciones */}
              <Menu
                anchorEl={notifAnchorEl}
                open={openNotif}
                onClose={handleNotifClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{
                  paper: {
                    elevation: 4,
                    sx: { width: 300, maxHeight: 400, mt: 1.5, borderRadius: 3, border: 1, borderColor: 'divider' }
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>Notificaciones</Typography>
                </Box>
                {notifications.length === 0 ? (
                  <MenuItem disabled sx={{ py: 2, fontFamily: 'Inter', fontSize: '0.85rem' }}>No hay notificaciones recientes</MenuItem>
                ) : (
                  notifications.map((notif, index) => (
                    <MenuItem key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>{notif.title}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ width: '100%', fontFamily: 'Inter' }}>{notif.body}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'flex-end', fontSize: '0.65rem', mt: 0.5 }}>{notif.time}</Typography>
                    </MenuItem>
                  ))
                )}
                {notifications.length > 0 && (
                  <Box sx={{ p: 1, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
                    <Button size="small" onClick={() => setNotifications([])} sx={{ textTransform: 'none', fontFamily: 'Outfit' }}>Limpiar todas</Button>
                  </Box>
                )}
              </Menu>

              {/* Perfil del Usuario Responsivo */}
              <Box 
                onClick={handleUserMenuClick}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.25, 
                  borderLeft: { xs: 'none', sm: 1 },
                  borderColor: 'divider', 
                  pl: { xs: 0.5, sm: 1.5 },
                  cursor: 'pointer',
                  py: 0.5,
                  borderRadius: 2,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)',
                    '& .MuiAvatar-root': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              >
                <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary', fontFamily: 'Outfit', lineHeight: 1.1 }}>
                    {nombre || 'Usuario Sernapesca'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'primary.main', fontFamily: 'Inter', fontWeight: 700, mt: 0.25 }}>
                    {perfil || 'CONSULTA'}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    width: 34, 
                    height: 34, 
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.3s',
                    border: '2px solid transparent'
                  }} 
                >
                  {(nombre || 'U').charAt(0).toUpperCase()}
                </Avatar>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{
                  paper: {
                    elevation: 4,
                    sx: {
                      overflow: 'visible',
                      mt: 1.5,
                      borderRadius: 3,
                      border: 1, 
                      borderColor: 'divider',
                      minWidth: 180,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      '&::before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                        borderLeft: 1, 
                        borderTop: 1, 
                        borderColor: 'divider',
                      },
                    },
                  }
                }}
              >
                <MenuItem onClick={() => navigate('/perfil')} sx={{ fontFamily: 'Inter', fontSize: '0.875rem' }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Mi Perfil
                </MenuItem>
                <Divider sx={{ borderColor: 'divider' }} />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main', fontFamily: 'Inter', fontSize: '0.875rem' }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  Cerrar sesión
                </MenuItem>
              </Menu>

            </Box>
          </Toolbar>
        </AppBar>

        {/* ═══════════ CONTENIDO DE PÁGINAS (Outlet) ═══════════ */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            bgcolor: 'background.default', 
            maxWidth: '100%',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <Outlet context={{ dateRange }} />
        </Box>

        {/* Alerta de notificación flotante global */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity="info" 
            sx={{ 
              width: '100%', 
              boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)', 
              borderRadius: 3, 
              border: '1px solid #bfdbfe',
              fontFamily: 'Inter' 
            }}
          >
            <strong style={{ fontFamily: 'Outfit' }}>{snackbar.title}</strong><br/>
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </Box>
  );
}
