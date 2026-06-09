import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, FormControl, Select, MenuItem } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosConfig';

export default function IndicadorRecolector({ dateRange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState('ambos');

  useEffect(() => {
    const fetchIndicadores = async () => {
      try {
        let queryParams = '';
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          queryParams = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        }
        const response = await api.get(`/reportes/indicadores-recolector${queryParams}`);
        const d = response.data;
        const chartData = d.map(item => ({
          name: item.fecha,
          declaraciones: item.declaracionesDiarias,
          desembarque: item.totalDiario
        }));
        setData(chartData);
      } catch (err) {
        console.error('Error fetching indicadores:', err);
        setError('No se pudieron cargar los indicadores del recolector.');
      } finally {
        setLoading(false);
      }
    };

    fetchIndicadores();
  }, [dateRange]);

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

  return (
    <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="#1a3a5c">
            Evolución de Declaraciones y Desembarques
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={chartView}
              onChange={(e) => setChartView(e.target.value)}
              displayEmpty
            >
              <MenuItem value="ambos">Ambos</MenuItem>
              <MenuItem value="declaraciones">Solo Declaraciones</MenuItem>
              <MenuItem value="desembarques">Solo Desembarques</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Evolución diaria del Nº de Declaraciones y Total de Desembarques (Kg) (Incluye Recolectores, Armadores y Áreas de Manejo).
        </Typography>
        <Box sx={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              {(chartView === 'ambos' || chartView === 'declaraciones') && (
                <Bar yAxisId="left" dataKey="declaraciones" name="Nº Declaraciones" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={50} />
              )}
              {(chartView === 'ambos' || chartView === 'desembarques') && (
                <Bar yAxisId="right" dataKey="desembarque" name="Total Desembarque (Kg)" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={50} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
