import { Typography, Container, Grid, Box } from '@mui/material';
import {
  BarChart as BarChartIcon,
  Inventory as InventoryIcon,
  Group as GroupIcon,
  WarningAmber as WarningIcon,
  CheckCircleOutline as OKIcon
} from '@mui/icons-material';
import StatCard from '../components/dashboard/StatCard';
import IndicadorRecolector from '../components/dashboard/IndicadorRecolector';
import ControlCuotaDiaria from '../components/dashboard/ControlCuotaDiaria';
import ExtraccionVedaWidget from '../components/dashboard/ExtraccionVedaWidget';
import VolumenPorEspecie from '../components/dashboard/VolumenPorEspecie';
import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getResumenGlobal } from '../services/reportesService';


export default function Dashboard() {
  const { dateRange } = useOutletContext() || { dateRange: null };
  const [resumen, setResumen] = useState({
    declaracionesTotales: 0,
    volumenTotal: 0
  });

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const data = await getResumenGlobal(dateRange);
        setResumen(data);
      } catch (error) {
        console.error('Error fetching resumen global:', error);
      }
    };

    fetchResumen();
  }, [dateRange]);

  return (
    <Container maxWidth={false} sx={{ width: '100%', p: 0, minHeight: '85vh' }}>
        
        {/* Encabezado del Dashboard */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '0.95rem' }}>
            Indicadores ejecutivos y resumen general de transacciones registradas en el sistema.
          </Typography>
        </Box>

        {/* Malla de Indicadores Clave (KPIs) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard 
              title="Declaraciones totales" 
              value={resumen.declaracionesTotales.toLocaleString('es-CL')} 
              trend={0} 
              color="#0ea5e9" 
              icon={BarChartIcon} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard 
              title="Volumen total (kg)" 
              value={resumen.volumenTotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })} 
              trend={0} 
              color="#10b981" 
              icon={InventoryIcon} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard title="Alertas activas" value="384" trend={23} color="#f59e0b" icon={BarChartIcon} />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard title="Casos abiertos" value="67" trend={-8} color="#8b5cf6" icon={InventoryIcon} />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard title="% Inconsistencias" value="12,6%" trend={1.8} color="#ef4444" icon={BarChartIcon} />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard title="Actores fiscalizados" value="215" color="#0ea5e9" icon={GroupIcon} />
          </Grid>

          {/* Gráfico Principal de Desembarques y Declaraciones */}
          <Grid item xs={12}>
            <IndicadorRecolector dateRange={dateRange} />
          </Grid>

          {/* Volumen extraído por especie y Control de Cuotas */}
          <Grid item xs={12} md={6}>
            <VolumenPorEspecie dateRange={dateRange} />
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