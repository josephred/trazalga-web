import { useState } from 'react';
import { Typography, Container, Grid, Box, CircularProgress, Alert } from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import { getReportes } from '../services/reportesService';
import DataTable from '../components/dashboard/DataTable';
import ReportFilter from '../components/dashboard/ReportFilter';
import TrazabilidadDialog from '../components/dashboard/TrazabilidadDialog';


export default function Reportes() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleGenerateReport = async (filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReportes(filters);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Error al obtener los datos del reporte. Por favor, intente de nuevo.');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (row) => {
    if (row && row.id && row.tipoReporte) {
      setSelectedRow(row);
      setDialogOpen(true);
    }
  };

  // Calcular KPIs en tiempo real de los datos del reporte cargado
  const totalVolume = reportData.reduce((sum, row) => sum + (Number(row.cantidad) || 0), 0);

  return (
    <Container maxWidth={false} sx={{ width: '100%', p: 0, minHeight: '85vh' }}>
        
        {/* Cabecera Premium estilo Banner con KPIs Dinámicos */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0a192f 0%, #172a45 100%)',
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            mb: 4,
            color: '#fff',
            boxShadow: '0 10px 30px rgba(10, 25, 47, 0.08)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 3,
          }}
        >
          {/* Círculos abstractos de fondo */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              background: 'rgba(14, 165, 233, 0.15)',
              borderRadius: '50%',
              filter: 'blur(30px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -50,
              left: '50%',
              width: 180,
              height: 180,
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '50%',
              filter: 'blur(40px)',
            }}
          />

          <Box sx={{ zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <AssessmentIcon sx={{ fontSize: 36, color: 'secondary.main' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', m: 0 }}>
                Módulo de Reportes y Trazabilidad
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 650, fontFamily: 'Inter', lineHeight: 1.6 }}>
              Consulta, analiza y fiscaliza las transacciones declaradas de algas pardas. Filtra por fechas y actores de la cadena para auditar el origen y destino del recurso.
            </Typography>
          </Box>

          {/* Micro KPI Widgets Dinámicos */}
          <Box sx={{ display: 'flex', gap: 2, zIndex: 1, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 3,
                px: 2.5,
                py: 1.5,
                textAlign: 'center',
                flexGrow: 1,
                minWidth: 120,
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.6, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Declaraciones
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                {reportData.length.toLocaleString('es-CL')} docs
              </Typography>
            </Box>
            
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 3,
                px: 2.5,
                py: 1.5,
                textAlign: 'center',
                flexGrow: 1,
                minWidth: 120,
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.6, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Cantidad Total
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'secondary.main', mt: 0.5 }}>
                {totalVolume.toLocaleString('es-CL')} kg
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Filtros de Reporte */}
        <Box sx={{ mb: 4 }}>
          <ReportFilter onGenerate={handleGenerateReport} />
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              fontFamily: 'Inter',
              border: '1px solid #fecaca',
              boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
            }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
            <CircularProgress size={45} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
              Generando reporte de transacciones...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ width: '100%', '& .MuiCard-root': { width: '100%' } }}>
                  <DataTable title="Resultados del Reporte de Trazabilidad" data={reportData} onRowClick={handleRowClick} />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {selectedRow && (
          <TrazabilidadDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            declaracionId={selectedRow.id}
            tipoReporte={selectedRow.tipoReporte}
            row={selectedRow}
          />
        )}
      </Container>
  );
}
