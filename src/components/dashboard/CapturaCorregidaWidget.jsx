import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip as MuiTooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Science as ScienceIcon,
  TrendingUp as TrendingUpIcon,
  CompareArrows as CompareArrowsIcon,
  WaterDrop as WaterIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getCapturaCorregida } from '../../services/reportesService';

export default function CapturaCorregidaWidget({ dateRange }) {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const parseDates = () => {
    const filters = {};
    if (dateRange) {
      if (Array.isArray(dateRange)) {
        if (dateRange[0]) filters.startDate = typeof dateRange[0].format === 'function' ? dateRange[0].format('YYYY-MM-DD') : dateRange[0];
        if (dateRange[1]) filters.endDate = typeof dateRange[1].format === 'function' ? dateRange[1].format('YYYY-MM-DD') : dateRange[1];
      } else {
        if (dateRange.startDate) filters.startDate = dateRange.startDate;
        if (dateRange.endDate) filters.endDate = dateRange.endDate;
      }
    }
    return filters;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const filters = parseDates();
        const res = await getCapturaCorregida(filters);
        setData(res);
      } catch (err) {
        console.error('Error cargando captura corregida:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const chartData = (data?.desglose || []).slice(0, 6).map(item => ({
    name: `${item.especie} (${item.humedad})`,
    desembarque: item.desembarqueKg,
    captura: item.capturaKg,
    factor: item.factorPromedio
  }));

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        p: { xs: 2, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)'
      }}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Cabecera */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 3,
                bgcolor: 'rgba(14, 165, 233, 0.12)',
                color: 'secondary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ScienceIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                Captura Biológica Corregida (Indicador 2)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                Balance Físico vs Equivalente Biológico Oficial (congelado por factor vigente)
              </Typography>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: 250 }}>
            <CircularProgress size={36} color="secondary" />
          </Box>
        ) : (
          <>
            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50', border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Desembarque Físico Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                    {(data?.totalDesembarqueKg || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })} <span style={{ fontSize: '0.85rem' }}>kg</span>
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(14, 165, 233, 0.06)', border: 1, borderColor: 'secondary.main' }}>
                  <Typography variant="caption" sx={{ color: 'secondary.dark', fontWeight: 700, display: 'block' }}>
                    Captura Biológica Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'secondary.main', mt: 0.5 }}>
                    {(data?.totalCapturaKg || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })} <span style={{ fontSize: '0.85rem' }}>kg</span>
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50', border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Factor Ponderado Global
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: '#8b5cf6', mt: 0.5 }}>
                    {Number(data?.factorPromedioGlobal || 1).toFixed(3)}x
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Gráfico Comparativo */}
            <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 1.5 }}>
              Comparativa: Desembarque Físico vs Captura Corregida
            </Typography>

            <Box sx={{ width: '100%', height: 200, mb: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}t`} />
                  <Tooltip
                    formatter={(val, name) => [
                      `${val.toLocaleString('es-CL')} kg`,
                      name === 'desembarque' ? 'Desembarque Físico' : 'Captura Corregida'
                    ]}
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 12,
                      border: `1px solid ${theme.palette.divider}`,
                      fontFamily: 'Inter',
                      fontSize: '0.85rem'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '0.75rem', fontFamily: 'Inter' }}
                    formatter={(value) => value === 'desembarque' ? 'Desembarque Físico' : 'Captura Corregida'}
                  />
                  <Bar dataKey="desembarque" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="captura" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {/* Tabla resumen de factores aplicados */}
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, maxHeight: 200 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Especie</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Humedad</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Físico (kg)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Corregido (kg)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="center">Factor Aplicado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.desglose || []).map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 600 }}>{row.especie}</TableCell>
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem' }}>
                        <Chip
                          label={row.humedad}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20, bgcolor: row.humedad.toUpperCase().includes('SEC') ? '#fef3c7' : '#e0f2fe' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem' }} align="right">{row.desembarqueKg?.toLocaleString('es-CL')}</TableCell>
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 700, color: 'secondary.main' }} align="right">{row.capturaKg?.toLocaleString('es-CL')}</TableCell>
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 700 }} align="center">{row.factorPromedio?.toFixed(3)}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
