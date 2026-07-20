import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, FormControl, Select, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosConfig';

// Custom Tooltip component for a premium look
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          border: 1, borderColor: 'divider',
          borderRadius: 3,
          p: 1.5,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, fontFamily: 'Outfit', color: 'text.primary' }}>
          Fecha: {label}
        </Typography>
        {payload.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.fill }} />
            <Typography variant="caption" sx={{ color: 'text.primary', fontFamily: 'Inter', fontWeight: 600 }}>
              {item.name}:
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.primary', fontFamily: 'Outfit', fontWeight: 800, ml: 'auto' }}>
              {item.value.toLocaleString('es-CL')}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

export default function IndicadorRecolector({ dateRange }) {
  const theme = useTheme();
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: 3, 
          fontFamily: 'Inter', 
          border: '1px solid #fecaca' 
        }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Card 
      elevation={0}
      sx={{ 
        mb: 4, 
        borderRadius: 4, 
        border: 1, borderColor: 'divider',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
          borderColor: 'divider',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
            Evolución de Declaraciones y Desembarques
          </Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={chartView}
              onChange={(e) => setChartView(e.target.value)}
              displayEmpty
              slotProps={{
                input: {
                  sx: { borderRadius: 3, fontFamily: 'Inter', fontSize: '0.875rem' }
                }
              }}
            >
              <MenuItem value="ambos" sx={{ fontFamily: 'Inter', fontSize: '0.875rem' }}>Ambos Indicadores</MenuItem>
              <MenuItem value="declaraciones" sx={{ fontFamily: 'Inter', fontSize: '0.875rem' }}>Solo Declaraciones</MenuItem>
              <MenuItem value="desembarques" sx={{ fontFamily: 'Inter', fontSize: '0.875rem' }}>Solo Desembarques</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Evolución diaria del Nº de Declaraciones y Total de Desembarques (Kg) (Incluye Recolectores, Armadores y Áreas de Manejo).
        </Typography>

        <Box sx={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontFamily: 'Inter' }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                tick={{ fill: theme.palette.secondary.main, fontSize: 11, fontFamily: 'Inter' }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={false}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fill: theme.palette.success.main, fontSize: 11, fontFamily: 'Inter' }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(241, 245, 249, 0.4)' }} />
              <Legend 
                wrapperStyle={{ fontFamily: 'Outfit', fontSize: '0.85rem', paddingTop: '15px' }}
                iconType="circle"
                iconSize={8}
              />
              {(chartView === 'ambos' || chartView === 'declaraciones') && (
                <Bar yAxisId="left" dataKey="declaraciones" name="Nº Declaraciones" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} barSize={28} />
              )}
              {(chartView === 'ambos' || chartView === 'desembarques') && (
                <Bar yAxisId="right" dataKey="desembarque" name="Total Desembarque (Kg)" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} barSize={28} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
