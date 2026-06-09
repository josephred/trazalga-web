import { Typography, Container, Grid, Box } from '@mui/material';
import {
  BarChart as BarChartIcon,
  Inventory as InventoryIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import StatCard from '../components/dashboard/StatCard';
import IndicadorRecolector from '../components/dashboard/IndicadorRecolector';
import ControlCuotaDiaria from '../components/dashboard/ControlCuotaDiaria';
import ExtraccionVedaWidget from '../components/dashboard/ExtraccionVedaWidget';
import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
// import PerformanceChart from '../components/dashboard/PerformanceChart';

export default function Dashboard() {
  const { dateRange } = useOutletContext() || { dateRange: null };
  const [resumen, setResumen] = useState({
    declaracionesTotales: 0,
    volumenTotal: 0
  });

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        let url = '/v-api/reportes/resumen-global';
        const params = new URLSearchParams();
        
        if (dateRange && dateRange[0]) {
          params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        }
        if (dateRange && dateRange[1]) {
          params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
        }
        
        if (params.toString()) {
          url += '?' + params.toString();
        }

        const response = await axios.get(url);
        setResumen(response.data);
      } catch (error) {
        console.error('Error fetching resumen global:', error);
      }
    };

    fetchResumen();
  }, [dateRange]);

  return (
    <Container maxWidth={false} sx={{ width: '100%', p: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Resumen general de indicadores y alertas.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Real Data Stat Cards */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard 
            title="Declaraciones totales" 
            value={resumen.declaracionesTotales.toLocaleString('es-CL')} 
            trend={0} 
            color="#1976d2" 
            icon={BarChartIcon} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard 
            title="Volumen declarado (kg)" 
            value={resumen.volumenTotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })} 
            trend={0} 
            color="#2e7d32" 
            icon={InventoryIcon} 
          />
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
          <IndicadorRecolector dateRange={dateRange} />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlCuotaDiaria dateRange={dateRange} />
        </Grid>

        <Grid item xs={12} md={6}>
          <ExtraccionVedaWidget dateRange={dateRange} />
        </Grid>
      </Grid>
    </Container>
  );
}