import { useState } from 'react';
import { Typography, Container, Grid, Box, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import DataTable from '../components/dashboard/DataTable';
import ReportFilter from '../components/dashboard/ReportFilter';

export default function Reportes() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateReport = async (filters) => {
    setLoading(true);
    setError(null);
    try {
      const { fechaInicio, fechaFin, tipoReporte } = filters;
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
    <Container maxWidth={false} sx={{ width: '100%', p: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Generación de Reportes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Seleccione los filtros para generar el reporte de trazabilidad.
        </Typography>
      </Box>

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
          <Grid item xs={12}>
            <DataTable title="Resultados del Reporte" data={reportData} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
