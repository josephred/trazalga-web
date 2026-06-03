import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosConfig';

export default function IndicadorRecolector() {
  const [data, setData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('Diario');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIndicadores = async () => {
      try {
        const response = await api.get('/reportes/indicadores-recolector');
        const d = response.data;
        const chartData = [
          {
            name: 'Diario',
            declaraciones: d.declaracionesDiarias,
            desembarque: d.totalDiario
          },
          {
            name: 'Semanal',
            declaraciones: d.declaracionesSemanales,
            desembarque: d.totalSemanal
          },
          {
            name: 'Mensual',
            declaraciones: d.declaracionesMensuales,
            desembarque: d.totalMensual
          }
        ];
        setData(chartData);
      } catch (err) {
        console.error('Error fetching indicadores:', err);
        setError('No se pudieron cargar los indicadores del recolector.');
      } finally {
        setLoading(false);
      }
    };

    fetchIndicadores();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const filteredData = data.filter(item => item.name === selectedPeriod);

  return (
    <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="#1a3a5c">
            Indicadores de Recolector: Declaraciones vs Desembarques
          </Typography>
          <Tabs
            value={selectedPeriod}
            onChange={(e, newValue) => setSelectedPeriod(newValue)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: '36px',
              height: '36px',
              '& .MuiTab-root': {
                minHeight: '36px',
                height: '36px',
                px: 2.5,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }
            }}
          >
            <Tab label="Diario" value="Diario" />
            <Tab label="Semanal" value="Semanal" />
            <Tab label="Mensual" value="Mensual" />
          </Tabs>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Nº Declaraciones realizadas y Total de desembarques declarados (Kg) para el periodo seleccionado.
        </Typography>
        <Box sx={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="declaraciones" name="Nº Declaraciones" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={50} />
              <Bar yAxisId="right" dataKey="desembarque" name="Total Desembarque (Kg)" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
