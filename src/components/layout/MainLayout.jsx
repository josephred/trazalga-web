import { useState, useEffect } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, 
  ListItemButton, ListItemIcon, ListItemText, Avatar, Button, IconButton,
  Menu, MenuItem, Divider, Badge, Snackbar, Alert
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
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import sernapescaLogo from '../../assets/sernapesca.png';
import { onMessageListener } from '../../firebase';

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


export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Notifications State
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const openNotif = Boolean(notifAnchorEl);
  const [notifications, setNotifications] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', title: '' });

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

  // Inicializa desde el día 1 del mes actual hasta hoy (en fecha local, no UTC)
  const [dateRange, setDateRange] = useState(() => {
    const formatoLocal = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hoy = new Date();
    return {
      startDate: formatoLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      endDate: formatoLocal(hoy)
    };
  });

  const handleStartDateChange = (e) => {
    setDateRange({ ...dateRange, startDate: e.target.value });
  };
  
  const handleEndDateChange = (e) => {
    setDateRange({ ...dateRange, endDate: e.target.value });
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Helper to get current page title
  const getCurrentPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return { title: 'Dashboard Ejecutivo', subtitle: 'Resumen general de indicadores y alertas' };
      case '/consultas': return { title: 'Consultas', subtitle: 'Búsqueda de información en el sistema' };
      case '/alertas': return { title: 'Alertas', subtitle: 'Gestión y monitoreo de alertas' };
      case '/casos': return { title: 'Casos', subtitle: 'Seguimiento de casos registrados' };
      case '/reportes': return { title: 'Reportes y Trazabilidad', subtitle: 'Consulta de transacciones históricas' };
      case '/mapa': return { title: 'Mapa SIG', subtitle: 'Distribución geográfica del recurso' };
      case '/administracion': return { title: 'Configuración de Parámetros', subtitle: 'Ajustes globales de alertas y rastreo móvil' };
      case '/ayuda': return { title: 'Ayuda', subtitle: 'Documentación y soporte técnico' };
      default: return { title: 'TRAZALGA', subtitle: '' };
    }
  };

  const { title, subtitle } = getCurrentPageTitle();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        
        {/* ═══════════ SIDEBAR (MENÚ LATERAL) ═══════════ */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, #050d1a 0%, #0a192f 50%, #020c1b 100%)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid rgba(255, 255, 255, 0.04)',
            },
          }}
        >
          {/* Header del Menú / Logo */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            bgcolor: 'rgba(0,0,0,0.12)'
          }}>
            <img src={sernapescaLogo} alt="Sernapesca" style={{ height: 130, objectFit: 'contain' }} />
          </Box>

          {/* Enlaces del Menú */}
          <List sx={{ flex: 1, pt: 2, px: 0 }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton 
                    onClick={() => navigate(item.path)}
                    sx={{
                      py: 1.5,
                      px: 3,
                      bgcolor: isActive ? 'rgba(14, 165, 233, 0.12)' : 'transparent',
                      borderLeft: isActive ? '4px solid #0ea5e9' : '4px solid transparent',
                      color: isActive ? '#fff' : '#94a3b8',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.04)',
                        color: '#fff',
                        pl: 3.5, // Micro-animación de deslizamiento
                        '& .MuiListItemIcon-root': {
                          color: '#0ea5e9',
                        }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: isActive ? '#0ea5e9' : '#64748b', 
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
                onClick={() => navigate('/ayuda')}
                sx={{
                  py: 1.5,
                  px: 3,
                  color: location.pathname === '/ayuda' ? '#fff' : '#64748b',
                  bgcolor: location.pathname === '/ayuda' ? 'rgba(14, 165, 233, 0.12)' : 'transparent',
                  borderLeft: location.pathname === '/ayuda' ? '4px solid #0ea5e9' : '4px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                    color: '#fff',
                    pl: 3.5,
                    '& .MuiListItemIcon-root': {
                      color: '#0ea5e9',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === '/ayuda' ? '#0ea5e9' : '#64748b', minWidth: 36 }}>
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
        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
          
          {/* ═══════════ HEADER (BARRA SUPERIOR) ═══════════ */}
          <AppBar 
            position="static" 
            color="transparent" 
            elevation={0} 
            sx={{ 
              borderBottom: '1px solid #f1f5f9', 
              bgcolor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Toolbar sx={{ px: 3, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              
              {/* Sección Izquierda: Marca y Región */}
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0a192f', fontFamily: 'Outfit', lineHeight: 1.1, letterSpacing: '0.5px' }}>
                    TRAZALGA
                  </Typography>
                  <Typography sx={{ fontSize: '0.625rem', color: '#64748b', fontFamily: 'Inter', lineHeight: 1.2, mt: 0.25 }}>
                    Portal de Control de Trazabilidad<br/>de Algas Pardas
                  </Typography>
                  <Typography sx={{ fontSize: '0.625rem', color: '#0ea5e9', fontWeight: 700, fontFamily: 'Inter', mt: 0.5 }}>
                    IV Región de Coquimbo
                  </Typography>
                </Box>

                {/* Título de Página y Subtítulo */}
                <Box sx={{ borderLeft: '1px solid #e2e8f0', pl: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit', lineHeight: 1.2 }}>
                    {title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.725rem', color: '#64748b', fontFamily: 'Inter' }}>
                    {subtitle}
                  </Typography>
                </Box>
              </Box>

              {/* Sección Derecha: Acciones Rápidas y Usuario */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                
                {/* Filtro de Fecha Rápido */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    bgcolor: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '24px', 
                    px: 2, 
                    py: 0.5,
                    transition: 'border-color 0.2s',
                    '&:focus-within': {
                      borderColor: '#cbd5e1'
                    }
                  }}>
                    <CalendarTodayIcon sx={{ color: '#64748b', mr: 1, fontSize: '0.9rem' }} />
                    <input 
                      type="date" 
                      value={dateRange.startDate} 
                      onChange={handleStartDateChange} 
                      style={{ 
                        border: 'none', 
                        outline: 'none', 
                        color: '#334155', 
                        fontSize: '0.8rem', 
                        backgroundColor: 'transparent',
                        fontFamily: 'Inter',
                        fontWeight: 600,
                      }} 
                    />
                    <Typography sx={{ color: '#94a3b8', mx: 1, fontSize: '0.8rem' }}> - </Typography>
                    <input 
                      type="date" 
                      value={dateRange.endDate} 
                      onChange={handleEndDateChange} 
                      style={{ 
                        border: 'none', 
                        outline: 'none', 
                        color: '#334155', 
                        fontSize: '0.8rem', 
                        backgroundColor: 'transparent',
                        fontFamily: 'Inter',
                        fontWeight: 600,
                      }} 
                    />
                  </Box>
                  <Button 
                    variant="contained" 
                    size="small" 
                    startIcon={<FilterListIcon />}
                    sx={{ 
                      textTransform: 'none', 
                      bgcolor: '#0a192f', 
                      '&:hover': { bgcolor: '#172a45' },
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

                {/* Campana de Notificaciones */}
                <IconButton color="inherit" onClick={handleNotifClick} sx={{ color: '#64748b' }}>
                  <Badge badgeContent={notifications.length} color="error" slotProps={{ badge: { sx: { bgcolor: '#ef4444' } } }}>
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                
                <Menu
                  anchorEl={notifAnchorEl}
                  open={openNotif}
                  onClose={handleNotifClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  slotProps={{
                    paper: {
                      elevation: 3,
                      sx: { width: 300, maxHeight: 400, mt: 1.5, borderRadius: 3, border: '1px solid #e2e8f0' }
                    }
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Notificaciones</Typography>
                  </Box>
                  {notifications.length === 0 ? (
                    <MenuItem disabled sx={{ py: 2, fontFamily: 'Inter', fontSize: '0.85rem' }}>No hay notificaciones recientes</MenuItem>
                  ) : (
                    notifications.map((notif, index) => (
                      <MenuItem key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>{notif.title}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ width: '100%', fontFamily: 'Inter' }}>{notif.body}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', alignSelf: 'flex-end', fontSize: '0.65rem', mt: 0.5 }}>{notif.time}</Typography>
                      </MenuItem>
                    ))
                  )}
                  {notifications.length > 0 && (
                    <Box sx={{ p: 1, textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
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
                    borderLeft: '1px solid #f1f5f9', 
                    pl: 3,
                    cursor: 'pointer',
                    '&:hover': {
                      '& .MuiAvatar-root': {
                        borderColor: '#0ea5e9',
                      }
                    }
                  }}
                >
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit' }}>
                      Analista Regional
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'Inter' }}>
                      IV Región
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: '#0a192f', 
                      width: 36, 
                      height: 36, 
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
                        border: '1px solid #e2e8f0',
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
                          borderLeft: '1px solid #e2e8f0',
                          borderTop: '1px solid #e2e8f0',
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
                  <Divider sx={{ borderColor: '#f1f5f9' }} />
                  <MenuItem onClick={handleLogout} sx={{ color: '#ef4444', fontFamily: 'Inter', fontSize: '0.875rem' }}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} />
                    </ListItemIcon>
                    Cerrar sesión
                  </MenuItem>
                </Menu>

              </Box>
            </Toolbar>
          </AppBar>

          {/* ═══════════ CONTENIDO DE PÁGINAS (Outlet) ═══════════ */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, bgcolor: '#f8fafc' }}>
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
