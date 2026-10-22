import { useState, useEffect, useContext } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, 
  ListItemButton, ListItemIcon, ListItemText, Avatar, Button, IconButton,
  Menu, MenuItem, Divider, Badge, Snackbar, Alert, Popover, Tooltip, useMediaQuery
} from '@mui/material';
import { 
  Home as HomeIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Folder as FolderIcon,
  BarChart as BarChartIcon,
  LocationOn as LocationIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarTodayIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from '../../theme/ThemeContext';
import sernapescaLogo from '../../assets/sernapesca.png';
import { onMessageListener } from '../../firebase';
import { getPerfil, getNombre, getUsuarioId, getRegion, cerrarSesion, revalidarPerfilServidor } from '../../auth/sesion';
import { puedeVer } from '../../auth/perfiles';
import api from '../../api/axiosConfig';

const drawerWidth = 240;

const menuItems = [
  { text: 'Inicio', icon: <HomeIcon />, path: '/dashboard' },
  { text: 'Consultas', icon: <SearchIcon />, path: '/consultas' },
  { text: 'Alertas', icon: <NotificationsIcon />, path: '/alertas' },
  { text: 'Casos', icon: <FolderIcon />, path: '/casos' },
  { text: 'Reportes', icon: <BarChartIcon />, path: '/reportes' },
  { text: 'Mapa', icon: <LocationIcon />, path: '/mapa' },
  { text: 'Administración', icon: <SettingsIcon />, path: '/administracion' },
];

import { getDefaultDateRange, loadUserDateRange, saveUserDateRange } from '../../utils/fechas';

export { getDefaultDateRange };

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const colorMode = useContext(ColorModeContext);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Popover fecha en móvil
  const [datePopoverEl, setDatePopoverEl] = useState(null);

  // Notifications State
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

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
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

  // Helper to get current page title
  const getCurrentPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return { title: 'Dashboard Ejecutivo', subtitle: 'Resumen general de indicadores y alertas' };
      case '/consultas': return { title: 'Consultas', subtitle: 'Búsqueda puntual en terreno por folio o patente' };
      case '/alertas': return { title: 'Alertas', subtitle: 'Gestión y monitoreo de alertas' };
      case '/casos': return { title: 'Casos', subtitle: 'Seguimiento de casos registrados' };
      case '/reportes': return { title: 'Reportes', subtitle: 'Planillas masivas de transacciones para fiscalización' };
      case '/mapa': return { title: 'Mapa SIG', subtitle: 'Distribución geográfica del recurso' };
      case '/administracion': return { title: 'Configuración de Parámetros', subtitle: 'Ajustes globales de alertas y rastreo móvil' };
      case '/ayuda': return { title: 'Ayuda', subtitle: 'Documentación y soporte técnico' };
      default: return { title: 'TRAZALGA', subtitle: '' };
    }
  };

  const { title, subtitle } = getCurrentPageTitle();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        
        {/* ═══════════ SIDEBAR (MENÚ LATERAL RESPONSIVO) ═══════════ */}
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Optimiza renderizado en dispositivos móviles
          }}
          sx={{
            width: isMobile ? 'auto' : drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: theme.palette.mode === 'light' ? 'primary.main' : 'background.paper',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {/* Header del Menú / Logo (< 60px en móvil vs escritorio) */}
          <Box sx={{ 
            p: { xs: 1.25, md: 2 }, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            bgcolor: 'rgba(0,0,0,0.12)',
            minHeight: { xs: 58, md: 120 }
          }}>
            <img 
              src={sernapescaLogo} 
              alt="Sernapesca" 
              style={{ 
                height: isMobile ? 48 : 100, 
                maxHeight: isMobile ? 54 : 120, 
                objectFit: 'contain',
                transition: 'all 0.2s ease'
              }} 
            />
          </Box>

          {/* Enlaces del Menú */}
          <List sx={{ flex: 1, pt: 1.5, px: 0 }}>
            {itemsVisibles.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton 
                    onClick={() => handleNavClick(item.path)}
                    sx={{
                      py: 1.25,
                      px: 3,
                      bgcolor: isActive ? 'rgba(14, 165, 233, 0.12)' : 'transparent',
                      borderLeft: isActive ? '4px solid #0ea5e9' : '4px solid transparent',
                      color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.04)',
                        color: '#fff',
                        pl: 3.5,
                        '& .MuiListItemIcon-root': {
                          color: 'secondary.main',
                        }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: isActive ? 'secondary.main' : 'rgba(255, 255, 255, 0.6)', 
                      minWidth: 36,
                      transition: 'color 0.2s ease',
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      sx={{ 
                        margin: 0,
                        '& .MuiListItemText-primary': { 
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '0.9rem',
                          fontFamily: 'Outfit',
                        } 
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {/* Item Ayuda al final */}
          <List sx={{ px: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavClick('/ayuda')}
                sx={{
                  py: 1.25,
                  px: 3,
                  color: location.pathname === '/ayuda' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                  bgcolor: location.pathname === '/ayuda' ? 'rgba(14, 165, 233, 0.12)' : 'transparent',
                  borderLeft: location.pathname === '/ayuda' ? '4px solid #0ea5e9' : '4px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                    color: '#fff',
                    pl: 3.5,
                    '& .MuiListItemIcon-root': {
                      color: 'secondary.main',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === '/ayuda' ? 'secondary.main' : 'rgba(255, 255, 255, 0.6)', minWidth: 36 }}>
                  <HelpIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Ayuda" 
                  sx={{ 
                    margin: 0,
                    '& .MuiListItemText-primary': { 
                      fontFamily: 'Outfit',
                      fontWeight: location.pathname === '/ayuda' ? 700 : 500,
                      fontSize: '0.9rem',
                    } 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

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
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            maxWidth: '100vw'
          }}
        >
          
          {/* ═══════════ HEADER (BARRA SUPERIOR RESPONSIVA) ═══════════ */}
          <AppBar 
            position="static" 
            color="transparent" 
            elevation={0} 
            sx={{ 
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              backgroundImage: 'none',
            }}
          >
            <Toolbar 
              sx={{ 
                px: { xs: 1.5, sm: 2.5, md: 3 }, 
                py: 1, 
                minHeight: { xs: 56, sm: 64 },
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: 1
              }}
            >
              
              {/* Sección Izquierda: Botón Menú Móvil + Marca / Título */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2, md: 3 }, minWidth: 0, flex: 1 }}>
                
                {/* Botón hamburguesa visible bajo md */}
                <IconButton
                  color="inherit"
                  aria-label="Abrir menú de navegación"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ 
                    display: { xs: 'flex', md: 'none' }, 
                    color: 'text.primary',
                    p: 1
                  }}
                >
                  <MenuIcon />
                </IconButton>

                {/* Marca visible en md en adelante */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit', lineHeight: 1.1, letterSpacing: '0.5px' }}>
                    TRAZALGA
                  </Typography>
                  <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', fontFamily: 'Inter', lineHeight: 1.2, mt: 0.25 }}>
                    Portal de Control de Trazabilidad<br/>de Algas Pardas
                  </Typography>
                  {region && (
                    <Typography sx={{ fontSize: '0.625rem', color: 'secondary.main', fontWeight: 700, fontFamily: 'Inter', mt: 0.5 }}>
                      {region}
                    </Typography>
                  )}
                </Box>

                {/* Título de Página y Subtítulo */}
                <Box sx={{ 
                  borderLeft: { xs: 'none', md: 1 }, 
                  borderColor: 'divider', 
                  pl: { xs: 0, md: 3 },
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <Typography 
                    variant="h6" 
                    noWrap
                    sx={{ 
                      fontWeight: 800, 
                      color: 'text.primary', 
                      fontFamily: 'Outfit', 
                      lineHeight: 1.2,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    {title}
                  </Typography>
                  <Typography 
                    noWrap
                    sx={{ 
                      fontSize: { xs: '0.675rem', sm: '0.725rem' }, 
                      color: 'text.secondary', 
                      fontFamily: 'Inter',
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    {subtitle}
                  </Typography>
                </Box>
              </Box>

              {/* Sección Derecha: Acciones Rápidas y Usuario */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5, md: 2 } }}>
                
                {/* Filtro de Fecha Rápido (Desktop >= md) */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    bgcolor: 'background.default', 
                    border: '1px solid',
                    borderColor: 'divider', 
                    borderRadius: '24px', 
                    px: 2, 
                    py: 0.5,
                    transition: 'border-color 0.2s',
                    '&:focus-within': {
                      borderColor: 'primary.main'
                    }
                  }}>
                    <CalendarTodayIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '0.9rem' }} />
                    <input 
                      type="date" 
                      value={dateRange.startDate} 
                      onChange={handleStartDateChange} 
                      aria-label="Fecha inicio"
                      style={{ 
                        border: 'none', 
                        outline: 'none', 
                        color: theme.palette.text.primary, 
                        fontSize: '0.8rem', 
                        backgroundColor: 'transparent',
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        colorScheme: theme.palette.mode
                      }} 
                    />
                    <Typography sx={{ color: 'text.secondary', mx: 1, fontSize: '0.8rem' }}> - </Typography>
                    <input 
                      type="date" 
                      value={dateRange.endDate} 
                      onChange={handleEndDateChange} 
                      aria-label="Fecha fin"
                      style={{ 
                        border: 'none', 
                        outline: 'none', 
                        color: theme.palette.text.primary, 
                        fontSize: '0.8rem', 
                        backgroundColor: 'transparent',
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        colorScheme: theme.palette.mode
                      }} 
                    />
                  </Box>
                  <Button 
                    variant="contained" 
                    size="small" 
                    startIcon={<FilterListIcon />}
                    sx={{ 
                      display: { xs: 'none', lg: 'inline-flex' },
                      textTransform: 'none', 
                      bgcolor: 'primary.main', 
                      '&:hover': { bgcolor: 'primary.light' },
                      borderRadius: '24px',
                      px: 2.5,
                      py: 0.75,
                      fontFamily: 'Outfit',
                      fontSize: '0.825rem',
                      boxShadow: 'none',
                    }}
                  >
                    Filtros
                  </Button>
                </Box>

                {/* Filtro de Fecha Móvil (< md): Botón compacto con Popover */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <IconButton 
                    color="inherit" 
                    onClick={(e) => setDatePopoverEl(e.currentTarget)} 
                    sx={{ color: 'text.secondary' }}
                    aria-label="Filtrar por fechas"
                  >
                    <CalendarTodayIcon fontSize="small" />
                  </IconButton>

                  <Popover
                    open={Boolean(datePopoverEl)}
                    anchorEl={datePopoverEl}
                    onClose={() => setDatePopoverEl(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{
                      paper: {
                        elevation: 4,
                        sx: { p: 2, mt: 1, borderRadius: 2, width: 280, border: 1, borderColor: 'divider' }
                      }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1.5 }}>
                      Rango de Fechas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Desde:
                        </Typography>
                        <input 
                          type="date" 
                          value={dateRange.startDate} 
                          onChange={handleStartDateChange} 
                          style={{ 
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
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
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Hasta:
                        </Typography>
                        <input 
                          type="date" 
                          value={dateRange.endDate} 
                          onChange={handleEndDateChange} 
                          style={{ 
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
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
                        sx={{ mt: 0.5, textTransform: 'none', fontFamily: 'Outfit' }}
                      >
                        Listo
                      </Button>
                    </Box>
                  </Popover>
                </Box>

                {/* Toggle Modo Oscuro/Claro */}
                <IconButton color="inherit" onClick={colorMode.toggleColorMode} sx={{ color: 'text.secondary' }} aria-label="Cambiar tema claro/oscuro">
                  {theme.palette.mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </IconButton>

                {/* Campana de Notificaciones */}
                <IconButton color="inherit" onClick={handleNotifClick} sx={{ color: 'text.secondary' }} aria-label="Notificaciones">
                  <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon fontSize="small" />
                  </Badge>
                </IconButton>
                
                {/* Popover / Menú Notificaciones */}
                <Menu
                  anchorEl={notifAnchorEl}
                  open={openNotif}
                  onClose={handleNotifClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  slotProps={{
                    paper: {
                      elevation: 3,
                      sx: { width: 300, maxHeight: 400, mt: 1.5, borderRadius: 3, border: 1, borderColor: 'divider' }
                    }
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Notificaciones</Typography>
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

                {/* Perfil del Usuario */}
                <Box 
                  onClick={handleUserMenuClick}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    borderLeft: { xs: 'none', sm: 1 },
                    borderColor: 'divider', 
                    pl: { xs: 0.5, sm: 2 },
                    cursor: 'pointer',
                    '&:hover': {
                      '& .MuiAvatar-root': {
                        borderColor: 'primary.main',
                      }
                    }
                  }}
                >
                  <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary', fontFamily: 'Outfit' }}>
                      {nombre || 'Usuario Sernapesca'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'primary.main', fontFamily: 'Inter', fontWeight: 700 }}>
                      {perfil || 'CONSULTA'}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      width: 34, 
                      height: 34, 
                      fontSize: '0.85rem',
                      transition: 'all 0.3s',
                      border: '2px solid transparent'
                    }} 
                  />
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
                      elevation: 3,
                      sx: {
                        overflow: 'visible',
                        mt: 1.5,
                        borderRadius: 3,
                        border: 1, borderColor: 'divider',
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
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: { xs: 1.5, sm: 2, md: 3 }, bgcolor: 'background.default', maxWidth: '100%' }}>
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
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', 
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
