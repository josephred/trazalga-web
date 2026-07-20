import { Typography, Container, Grid, Box } from '@mui/material';
import {
  BarChart as BarChartIcon,
  Inventory as InventoryIcon,
  Group as GroupIcon,
  WarningAmber as WarningIcon,
  CheckCircleOutline as OKIcon,
  DirectionsBoat as BoatIcon
} from '@mui/icons-material';
import StatCard from '../components/dashboard/StatCard';
import IndicadorRecolector from '../components/dashboard/IndicadorRecolector';
import ControlCuotaDiaria from '../components/dashboard/ControlCuotaDiaria';
import ExtraccionVedaWidget from '../components/dashboard/ExtraccionVedaWidget';
import DobleOperacionWidget from '../components/dashboard/DobleOperacionWidget';
import VolumenPorEspecie from '../components/dashboard/VolumenPorEspecie';
import TiempoValidacionWidget from '../components/dashboard/TiempoValidacionWidget';
import VariacionPesoWidget from '../components/dashboard/VariacionPesoWidget';
import CasosAbiertosWidget from '../components/dashboard/CasosAbiertosWidget';
import CurvaSnakeWidget from '../components/dashboard/CurvaSnakeWidget';
import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getResumenGlobal } from '../services/reportesService';


export default function Dashboard() {
  const { dateRange } = useOutletContext() || { dateRange: null };
  const [resumen, setResumen] = useState({
    declaracionesTotales: 0,
    volumenTotal: 0,
    alertasActivas: 0,
    casosAbiertos: 0,
    inconsistenciasPct: 0,
    actoresFiscalizados: 0
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

  // Nº viajes del armador = nº de declaraciones de armador (1 declaración = 1 viaje).
  // Promedio diario para dar la periodicidad "Diario" que pide la planilla.
  const viajesArmador = resumen.totalArmador || 0;
  const diasRango = (dateRange && dateRange.startDate && dateRange.endDate)
    ? Math.max(1, Math.floor(
        (new Date(dateRange.endDate + 'T00:00:00') - new Date(dateRange.startDate + 'T00:00:00')) / 86400000) + 1)
    : null;
  const viajesPorDia = diasRango ? Math.round((viajesArmador / diasRango) * 10) / 10 : null;

  return (
    <Container maxWidth={false} sx={{ width: '100%', p: 0, minHeight: '85vh' }}>
        
        {/* Encabezado del Dashboard */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontSize: '0.95rem' }}>
            Indicadores ejecutivos y resumen general de transacciones registradas en el sistema.
          </Typography>
        </Box>

        {/* Malla de Indicadores Clave (KPIs) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="Declaraciones totales"
              value={(resumen.declaracionesTotales || 0).toLocaleString('es-CL')}
              color='secondary.main'
              icon={BarChartIcon}
              subtitle="Toda la cadena de suministro"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="Volumen total (kg)"
              value={(resumen.volumenTotal || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
              color='success.main'
              icon={InventoryIcon}
              subtitle="Desembarque declarado"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="Alertas activas"
              value={(resumen.alertasActivas || 0).toLocaleString('es-CL')}
              color='warning.main'
              icon={WarningIcon}
              subtitle="En veda + peso fuera de umbral"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="Casos abiertos"
              value={(resumen.casosAbiertos || 0).toLocaleString('es-CL')}
              color="#8b5cf6"
              icon={InventoryIcon}
              subtitle="En negociación o rechazadas"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="% Inconsistencias"
              value={`${(resumen.inconsistenciasPct || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`}
              color='error.main'
              icon={BarChartIcon}
              subtitle="En veda o rechazadas"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="Actores fiscalizados"
              value={(resumen.actoresFiscalizados || 0).toLocaleString('es-CL')}
              color='secondary.main'
              icon={GroupIcon}
              subtitle="Con declaraciones en el período"
            />
          </Grid>

          {/* Sub-indicadores por perfil */}
          <Grid item xs={12} sm={6} md={3} lg={3}>
            <StatCard
              title="Decl. Recolector"
              value={(resumen.totalRecolector || 0).toLocaleString('es-CL')}
              color="#3b82f6"
              icon={InventoryIcon}
              subtitle="Total de documentos"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3}>
            <StatCard
              title="Nº Viajes (Armador)"
              value={viajesArmador.toLocaleString('es-CL')}
              color="#0891b2"
              icon={BoatIcon}
              subtitle={viajesPorDia != null
                ? `1 declaración = 1 viaje · ~${viajesPorDia.toLocaleString('es-CL')}/día`
                : '1 declaración = 1 viaje'}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3}>
            <StatCard
              title="Decl. Área de Manejo"
              value={(resumen.totalArea || 0).toLocaleString('es-CL')}
              color="#3b82f6"
              icon={InventoryIcon}
              subtitle="Total de documentos"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3}>
            <StatCard
              title="Decl. Comercializador"
              value={(resumen.totalComercializador || 0).toLocaleString('es-CL')}
              color="#8b5cf6"
              icon={InventoryIcon}
              subtitle="Total de documentos"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3}>
            <StatCard
              title="Volumen Comprado (Comercializador)"
              value={`${(resumen.volumenComprado || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })} kg`}
              color="#8b5cf6"
              icon={InventoryIcon}
              subtitle={diasRango
                ? `Kg adquiridos · ~${Math.round((resumen.volumenComprado || 0) / diasRango).toLocaleString('es-CL')} kg/día`
                : 'Kg adquiridos en el período'}
            />
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

          <Grid item xs={12} md={6}>
            <TiempoValidacionWidget dateRange={dateRange} />
          </Grid>

          <Grid item xs={12} md={6}>
            <VariacionPesoWidget dateRange={dateRange} />
          </Grid>

          <Grid item xs={12} md={6}>
            <CasosAbiertosWidget dateRange={dateRange} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DobleOperacionWidget dateRange={dateRange} />
          </Grid>

          {/* Curva Snake acumulada (AMERB) — ancho completo */}
          <Grid item xs={12}>
            <CurvaSnakeWidget dateRange={dateRange} />
          </Grid>
        </Grid>
      </Container>
  );
}