import { useState } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, 
  ListItemButton, ListItemIcon, ListItemText, Avatar, Button, IconButton
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
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import sernapescaLogo from '../../assets/sernapesca.png';

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

  // Helper to get current page title
  const getCurrentPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return { title: 'Dashboard Ejecutivo', subtitle: 'Resumen general de indicadores y alertas' };
      case '/consultas': return { title: 'Consultas', subtitle: 'Búsqueda de información en el sistema' };
      case '/alertas': return { title: 'Alertas', subtitle: 'Gestión y monitoreo de alertas' };
      case '/casos': return { title: 'Casos', subtitle: 'Seguimiento de casos registrados' };
      case '/reportes': return { title: 'Reportes', subtitle: 'Generación de reportes de gestión' };
      case '/mapa': return { title: 'Mapa SIG', subtitle: 'Distribución geográfica' };
      case '/administracion': return { title: 'Administración', subtitle: 'Configuración del sistema' };
      case '/ayuda': return { title: 'Ayuda', subtitle: 'Documentación y soporte' };
      default: return { title: 'TRAZALGA', subtitle: '' };
    }
  };

  const { title, subtitle } = getCurrentPageTitle();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      
      {/* ═══════════ SIDEBAR ═══════════ */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#0a192f', // Dark blue as in the image
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Sidebar Header / Logo */}
        <Box sx={{ 
          p: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <img src={sernapescaLogo} alt="Sernapesca" style={{ height: 160 }} />
        </Box>

        {/* Menu Items */}
        <List sx={{ flex: 1, pt: 2 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  onClick={() => navigate(item.path)}
                  sx={{
                    bgcolor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    borderLeft: isActive ? '4px solid #1976d2' : '4px solid transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#64b5f6' : '#a0aec0', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? '#fff' : '#a0aec0'
                      } 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Ayuda Item at Bottom */}
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/ayuda')}>
              <ListItemIcon sx={{ color: '#a0aec0', minWidth: 40 }}>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Ayuda" 
                sx={{ '& .MuiListItemText-primary': { color: '#a0aec0' } }} 
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        
        {/* ═══════════ TOPBAR ═══════════ */}
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: '#fff' }}>
          <Toolbar sx={{ px: 3, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* Topbar Left: System Info */}
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>
                  TRAZALGA
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#555', lineHeight: 1 }}>
                  Portal de Reportería para el Control de<br/>Trazabilidad de Algas Pardas
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#1976d2', fontWeight: 600, mt: 0.5 }}>
                  IV Región de Coquimbo
                </Typography>
              </Box>

              {/* Topbar Center: Page Title */}
              <Box sx={{ borderLeft: '1px solid #e0e0e0', pl: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748', lineHeight: 1.2 }}>
                  {title}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#718096' }}>
                  {subtitle}
                </Typography>
              </Box>
            </Box>

            {/* Topbar Right: Actions & User */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              
              {/* Placeholders for Filters */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<CalendarTodayIcon fontSize="small"/>}
                  sx={{ textTransform: 'none', color: '#555', borderColor: '#ccc' }}
                >
                  05/05/2024 - 12/05/2024
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<FilterListIcon />}
                  sx={{ textTransform: 'none', bgcolor: '#0a192f' }}
                >
                  Filtros
                </Button>
              </Box>

              {/* User Profile */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: '1px solid #e0e0e0', pl: 3 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d3748' }}>
                    Analista Regional
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: '#718096' }}>
                    IV Región
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#0a192f', width: 36, height: 36 }} />
              </Box>

            </Box>
          </Toolbar>
        </AppBar>

        {/* ═══════════ PAGE CONTENT (Outlet) ═══════════ */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
          <Outlet />
        </Box>

      </Box>
    </Box>
  );
}
