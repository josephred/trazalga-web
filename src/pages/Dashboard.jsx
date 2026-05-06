import { useState } from 'react';
import { Typography, Container, Grid, Box, AppBar, Toolbar, Button, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../components/dashboard/StatCard';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import DataTable from '../components/dashboard/DataTable';
import ReportFilter from '../components/dashboard/ReportFilter';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

export default function Dashboard() {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateReport = async (filters) => {
    setLoading(true);
    setError(null);
    try {
      const { fechaInicio, fechaFin, tipoReporte } = filters;
      // Endpoint: https://apps.procesac.com/api/reportes?fechaInicio=2026-01-01&fechaFin=2026-02-01&tipoReporte=1
      const response = await axios.get('https://apps.procesac.com/api/reportes', {
        params: {
          fechaInicio,
          fechaFin,
          tipoReporte
        }
      });
      
      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Error al obtener los datos del reporte. Por favor, intente de nuevo.');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container maxWidth={false} sx={{ width: '100%', p: 0 }}>
        {/* Filtros de Reporte */}
        <Box sx={{ mb: 4 }}>
          <ReportFilter onGenerate={handleGenerateReport} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid size={12}>
              <DataTable title="Resultados del Reporte" data={reportData} />
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
}