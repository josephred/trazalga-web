import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosConfig';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
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
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, fontFamily: 'Outfit', color: 'text.primary' }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: '#0369a1', fontFamily: 'Inter', fontWeight: 600 }}>
          Acumulado: {p.acumulado.toLocaleString('es-CL')} kg
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontFamily: 'Inter' }}>
          Del día: {p.volumenDiario.toLocaleString('es-CL')} kg
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function CurvaSnakeWidget({ dateRange }) {
  const theme = useTheme();
  const COLOR_CURVA = theme.palette.secondary.main;
  const [data, setData] = useState({ serie: [], amerbsDisponibles: [], especiesDisponibles: [], limiteKg: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amerbId, setAmerbId] = useState('');
  const [especieId, setEspecieId] = useState('');

  useEffect(() => {
    const fetchCurva = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          params.append('startDate', dateRange.startDate);
          params.append('endDate', dateRange.endDate);
        }
        if (amerbId) params.append('amerbId', amerbId);
        if (especieId) params.append('especieId', especieId);

        const response = await api.get(`/reportes/curva-snake?${params.toString()}`);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching curva snake:', err);
        setError('No se pudo cargar la curva de explotación acumulada.');
      } finally {
        setLoading(false);
      }
    };

    fetchCurva();
  }, [dateRange, amerbId, especieId]);

  if (loading) {
    return (
      <Card elevation={0} sx={{ height: '100%', borderRadius: 4, border: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Card>
    );
  }

  const serie = data.serie || [];
  const limiteKg = data.limiteKg;
  const porcentaje = data.porcentajeCuota;
  const excedido = limiteKg != null && porcentaje != null && porcentaje >= 100;

  // El eje Y debe alcanzar a mostrar la línea de referencia aunque el acumulado sea menor
  const maxAcumulado = serie.length > 0 ? serie[serie.length - 1].acumulado : 0;
  const yMax = limiteKg != null ? Math.max(maxAcumulado, limiteKg) * 1.1 : undefined;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
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
            Curva de Explotación Acumulada (AMERB)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={amerbId}
                onChange={(e) => setAmerbId(e.target.value)}
                displayEmpty
                slotProps={{ input: { sx: { borderRadius: 3, fontFamily: 'Inter', fontSize: '0.85rem' } } }}
              >
                <MenuItem value="" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Todas las AMERB</MenuItem>
                {(data.amerbsDisponibles || []).map((a) => (
                  <MenuItem key={a.id} value={a.id} sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>{a.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={especieId}
                onChange={(e) => setEspecieId(e.target.value)}
                displayEmpty
                slotProps={{ input: { sx: { borderRadius: 3, fontFamily: 'Inter', fontSize: '0.85rem' } } }}
              >
                <MenuItem value="" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Todas las especies</MenuItem>
                {(data.especiesDisponibles || []).map((e) => (
                  <MenuItem key={e.id} value={e.id} sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>{e.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', lineHeight: 1.6 }}>
            Volumen extraído acumulado en el tiempo (tendencia de explotación).
          </Typography>
          {limiteKg != null ? (
            <Chip
              size="small"
              label={`${porcentaje?.toLocaleString('es-CL', { maximumFractionDigits: 1 })}% de la cuota ${data.cuotaPeriodo || ''} (${limiteKg.toLocaleString('es-CL')} kg)`}
              sx={{
                fontFamily: 'Inter', fontWeight: 700, fontSize: '0.72rem',
                bgcolor: excedido ? (theme.palette.mode === 'dark' ? '#450a0a' : '#fef2f2') : porcentaje >= 80 ? (theme.palette.mode === 'dark' ? '#451a03' : '#fffbeb') : (theme.palette.mode === 'dark' ? '#064e3b' : '#f0fdf4'),
                color: excedido ? (theme.palette.mode === 'dark' ? '#fca5a5' : '#b91c1c') : porcentaje >= 80 ? (theme.palette.mode === 'dark' ? '#fde047' : '#b45309') : (theme.palette.mode === 'dark' ? '#6ee7b7' : '#047857'),
                border: '1px solid',
                borderColor: excedido ? (theme.palette.mode === 'dark' ? '#991b1b' : '#fecaca') : porcentaje >= 80 ? (theme.palette.mode === 'dark' ? '#a16207' : '#fde68a') : (theme.palette.mode === 'dark' ? '#047857' : '#bbf7d0')
              }}
            />
          ) : especieId ? (
            <Chip size="small" label="Sin cuota configurada para esta especie" sx={{ fontFamily: 'Inter', fontSize: '0.72rem', bgcolor: 'divider', color: 'text.secondary' }} />
          ) : (
            <Chip size="small" label="Selecciona una especie para ver su cuota" sx={{ fontFamily: 'Inter', fontSize: '0.72rem', bgcolor: 'divider', color: 'text.secondary' }} />
          )}
        </Box>

        <Divider sx={{ mb: 2, borderColor: 'divider' }} />

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', py: 4, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : serie.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
              No hay declaraciones de área de manejo para el filtro seleccionado.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLOR_CURVA} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLOR_CURVA} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontFamily: 'Inter' }}
                  axisLine={{ stroke: theme.palette.divider }}
                  tickLine={false}
                />
                <YAxis
                  domain={yMax ? [0, yMax] : [0, 'auto']}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontFamily: 'Inter' }}
                  axisLine={{ stroke: theme.palette.divider }}
                  tickLine={false}
                  tickFormatter={(v) => v.toLocaleString('es-CL')}
                />
                <Tooltip content={<CustomTooltip />} />
                {limiteKg != null && (
                  <ReferenceLine
                    y={limiteKg}
                    stroke={excedido ? theme.palette.error.main : theme.palette.warning.main}
                    strokeDasharray="6 4"
                    strokeWidth={2}
                    label={{
                      value: `Cuota ${limiteKg.toLocaleString('es-CL')} kg`,
                      position: 'insideTopRight',
                      fill: excedido ? theme.palette.error.main : (theme.palette.mode === 'dark' ? theme.palette.warning.light : '#b45309'),
                      fontSize: 11,
                      fontFamily: 'Inter',
                      fontWeight: 700
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  name="Acumulado (kg)"
                  stroke={COLOR_CURVA}
                  strokeWidth={2.5}
                  fill="url(#colorAcumulado)"
                  dot={false}
                  activeDot={{ r: 5, fill: COLOR_CURVA }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
