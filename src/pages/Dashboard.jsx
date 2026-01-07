import { Typography, Container, Grid, Box } from '@mui/material';
import StatCard from '../components/dashboard/StatCard';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import DataTable from '../components/dashboard/DataTable';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

export default function Dashboard() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Panel de Gestión Trazalga
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Resumen operativo y métricas clave de rendimiento en tiempo real.
        </Typography>
      </Box>

      {/* Tarjetas de Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Producción Total"
            value="24.5k"
            trend={12}
            icon={BarChartIcon}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Eficiencia Media"
            value="88%"
            trend={-2.4}
            icon={TrendingUpIcon}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Usuarios Activos"
            value="156"
            trend={8.1}
            icon={GroupIcon}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Inventario"
            value="1.2k"
            icon={InventoryIcon}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Gráficos y Tablas */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <PerformanceChart title="Rendimiento Semanal" />
        </Grid>
        <Grid item xs={12} lg={4}>
          {/* Aquí podría ir otro componente pequeño o una barra lateral de actividad */}
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <StatCard
              title="Alertas de Sistema"
              value="3"
              icon={TrendingUpIcon}
              color="#d32f2f"
            />
            <StatCard
              title="Proyectos Nuevos"
              value="12"
              trend={5}
              icon={InventoryIcon}
              color="#0288d1"
            />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <DataTable title="Recursos y Proyectos Recientes" />
        </Grid>
      </Grid>
    </Container>
  );
}