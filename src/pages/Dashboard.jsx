import { Typography, Container, Grid, Box } from '@mui/material';
import {
  BarChart as BarChartIcon,
  Inventory as InventoryIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import StatCard from '../components/dashboard/StatCard';
// import PerformanceChart from '../components/dashboard/PerformanceChart';

export default function Dashboard() {
  return (
    <Container maxWidth={false} sx={{ width: '100%', p: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard Ejecutivo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Resumen general de indicadores y alertas.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Placeholder Stat Cards to match the image structure */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Declaraciones totales" value="1.248" trend={12.5} color="#1976d2" icon={BarChartIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Volumen declarado (kg)" value="2.453.620" trend={9.2} color="#2e7d32" icon={InventoryIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Alertas activas" value="384" trend={23} color="#ed6c02" icon={BarChartIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Casos abiertos" value="67" trend={8} color="#9c27b0" icon={InventoryIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="% Inconsistencias" value="12,6%" trend={1.8} color="#0288d1" icon={BarChartIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Actores fiscalizados" value="215" color="#1976d2" icon={GroupIcon} />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ p: 4, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e0e0e0', textAlign: 'center' }}>
            <Typography color="text.secondary">
              Contenido del dashboard ejecutivo (gráficos y mapas) en desarrollo.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}