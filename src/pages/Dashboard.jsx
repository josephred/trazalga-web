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
import DesembarqueFisicoWidget from '../components/dashboard/DesembarqueFisicoWidget';
import CapturaCorregidaWidget from '../components/dashboard/CapturaCorregidaWidget';
import ControlCuotaDiaria from '../components/dashboard/ControlCuotaDiaria';
import LimiteExtraccionDiarioWidget from '../components/dashboard/LimiteExtraccionDiarioWidget';
import ExtraccionVedaWidget from '../components/dashboard/ExtraccionVedaWidget';
import VariacionPesoWidget from '../components/dashboard/VariacionPesoWidget';
import RetencionBodegaWidget from '../components/dashboard/RetencionBodegaWidget';
import DobleOperacionWidget from '../components/dashboard/DobleOperacionWidget';
import TiempoValidacionWidget from '../components/dashboard/TiempoValidacionWidget';
import CasosAbiertosWidget from '../components/dashboard/CasosAbiertosWidget';
import CurvaSnakeWidget from '../components/dashboard/CurvaSnakeWidget';
import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getResumenGlobal } from '../services/reportesService';


import IndicadorHelpButton from '../components/dashboard/IndicadorHelpButton';

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
              helpKey="declaracionesTotales"
              dateRange={dateRange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="Volumen total (kg)"
              value={(resumen.volumenTotal || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
              color='success.main'
              icon={InventoryIcon}
              subtitle="Desembarque declarado"
              helpKey="volumenTotal"
              dateRange={dateRange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="Alertas activas"
              value={(resumen.alertasActivas || 0).toLocaleString('es-CL')}
              color='warning.main'
              icon={WarningIcon}
              subtitle="En veda + peso fuera de umbral"
              helpKey="alertasActivas"
              dateRange={dateRange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="Casos abiertos"
              value={(resumen.casosAbiertos || 0).toLocaleString('es-CL')}
              color="#8b5cf6"
              icon={InventoryIcon}
              subtitle="En negociación o rechazadas"
              helpKey="casosAbiertosKPI"
              dateRange={dateRange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="% Inconsistencias"
              value={`${(resumen.inconsistenciasPct || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`}
              color='error.main'
              icon={BarChartIcon}
              subtitle="En veda o rechazadas"
              helpKey="inconsistenciasPct"
              dateRange={dateRange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="Actores fiscalizados"
              value={(resumen.actoresFiscalizados || 0).toLocaleString('es-CL')}
              color='secondary.main'
              icon={GroupIcon}
              subtitle="Con declaraciones en el período"
              helpKey="actoresFiscalizados"
              dateRange={dateRange}
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
              helpKey="declRecolector"
              dateRange={dateRange}
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
              helpKey="viajesArmador"
              dateRange={dateRange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3}>
            <StatCard
              title="Decl. Área de Manejo"
              value={(resumen.totalArea || 0).toLocaleString('es-CL')}
              color="#3b82f6"
              icon={InventoryIcon}
              subtitle="Total de documentos"
              helpKey="declArea"
              dateRange={dateRange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3}>
            <StatCard
              title="Decl. Comercializador"
              value={(resumen.totalComercializador || 0).toLocaleString('es-CL')}
              color="#8b5cf6"
              icon={InventoryIcon}
              subtitle="Total de documentos"
              helpKey="declComercializador"
              dateRange={dateRange}
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
              helpKey="volumenComprado"
              dateRange={dateRange}
            />
          </Grid>

          {/* Gráfico Principal de Desembarques y Declaraciones */}
          <Grid item xs={12}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <IndicadorRecolector dateRange={dateRange} />
              <IndicadorHelpButton helpKey="evolucionDesembarque" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>

          {/* Indicador 1: Desembarque Físico */}
          <Grid item xs={12}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <DesembarqueFisicoWidget dateRange={dateRange} />
              <IndicadorHelpButton helpKey="desembarqueFisico" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>

          {/* Indicador 2: Captura Corregida e Indicador 3: Control de Cuotas */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <CapturaCorregidaWidget dateRange={dateRange} />
              <IndicadorHelpButton helpKey="capturaCorregida" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <ControlCuotaDiaria dateRange={dateRange} />
              <IndicadorHelpButton helpKey="controlCuotas" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>

          {/* Indicador 4: Límite Diario (LED) e Indicador 5: Control de Vedas */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <LimiteExtraccionDiarioWidget dateRange={dateRange} />
              <IndicadorHelpButton helpKey="limiteDiarioLed" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <ExtraccionVedaWidget dateRange={dateRange} />
              <IndicadorHelpButton helpKey="controlVedas" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>

          {/* Indicador 6: Trazabilidad de Peso y Retención en Bodega Virtual */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <VariacionPesoWidget dateRange={dateRange} />
              <IndicadorHelpButton helpKey="variacionPeso" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <RetencionBodegaWidget />
              <IndicadorHelpButton helpKey="retencionBodega" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <TiempoValidacionWidget dateRange={dateRange} />
              <IndicadorHelpButton helpKey="tiempoValidacion" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <CasosAbiertosWidget dateRange={dateRange} />
              <IndicadorHelpButton helpKey="casosAbiertos" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <DobleOperacionWidget dateRange={dateRange} />
              <IndicadorHelpButton helpKey="dobleOperacion" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>

          {/* Curva Snake acumulada (AMERB) — ancho completo */}
          <Grid item xs={12}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <CurvaSnakeWidget dateRange={dateRange} />
              <IndicadorHelpButton helpKey="curvaSnake" dateRange={dateRange} sx={{ bottom: 12, right: 12 }} />
            </Box>
          </Grid>
        </Grid>
      </Container>
  );
}