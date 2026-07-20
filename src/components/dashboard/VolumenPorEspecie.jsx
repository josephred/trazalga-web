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
  MenuItem
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, Cell, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosConfig';

const MAX_ESPECIES = 8;
const COLOR_BARRA = '#059669';
const COLOR_OTRAS = 'text.disabled';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
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
          {d.especie}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.primary', fontFamily: 'Inter' }}>
          Volumen: <strong>{d.volumenKg.toLocaleString('es-CL', { maximumFractionDigits: 0 })} kg</strong> ({d.porcentaje}%)
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.primary', fontFamily: 'Inter' }}>
          Declaraciones: <strong>{d.declaraciones.toLocaleString('es-CL')}</strong>
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function VolumenPorEspecie({ dateRange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perfil, setPerfil] = useState('TODOS');

  useEffect(() => {
    const fetchVolumen = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          params.append('startDate', dateRange.startDate);
          params.append('endDate', dateRange.endDate);
        }
        params.append('perfil', perfil);

        const response = await api.get(`/reportes/volumen-por-especie?${params.toString()}`);
        const rows = response.data || [];

        const totalKg = rows.reduce((acc, r) => acc + (r.volumenKg || 0), 0);

        // Top N especies; el resto se agrupa en "Otras"
        const top = rows.slice(0, MAX_ESPECIES);
        const resto = rows.slice(MAX_ESPECIES);
        if (resto.length > 0) {
          top.push({
            especie: `Otras (${resto.length})`,
            volumenKg: resto.reduce((acc, r) => acc + (r.volumenKg || 0), 0),
            declaraciones: resto.reduce((acc, r) => acc + (r.declaraciones || 0), 0),
            esOtras: true
          });
        }

        setData(top.map(r => ({
          ...r,
          porcentaje: totalKg > 0 ? Math.round((r.volumenKg / totalKg) * 1000) / 10 : 0
        })));
        setError(null);
      } catch (err) {
        console.error('Error fetching volumen por especie:', err);
        setError('No se pudo cargar el volumen extraído por especie.');
      } finally {
        setLoading(false);
      }
    };

    fetchVolumen();
  }, [dateRange, perfil]);

  if (loading) {
    return (
      <Card
        elevation={0}
        sx={{
          height: '100%',
          borderRadius: 4,
          border: 1, borderColor: 'divider',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 250
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  const chartHeight = Math.max(220, data.length * 38 + 30);

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
            Volumen Extraído por Especie
          </Typography>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              displayEmpty
              slotProps={{
                input: {
                  sx: { borderRadius: 3, fontFamily: 'Inter', fontSize: '0.85rem' }
                }
              }}
            >
              <MenuItem value="TODOS" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Todos los perfiles</MenuItem>
              <MenuItem value="RECOLECTOR" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Recolector</MenuItem>
              <MenuItem value="ARMADOR" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Armador</MenuItem>
              <MenuItem value="AREA" sx={{ fontFamily: 'Inter', fontSize: '0.85rem' }}>Área Manejo</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Cantidad declarada (kg) por recurso en el periodo seleccionado.
        </Typography>
        <Divider sx={{ mb: 2, borderColor: 'divider' }} />

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', py: 4, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : data.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
              No hay declaraciones registradas para este periodo/perfil.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 70, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke='divider' horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'text.secondary', fontSize: 11, fontFamily: 'Inter' }}
                  axisLine={{ stroke: 'divider' }}
                  tickLine={false}
                  tickFormatter={(v) => v.toLocaleString('es-CL')}
                />
                <YAxis
                  type="category"
                  dataKey="especie"
                  width={130}
                  tick={{ fill: 'text.primary', fontSize: 11, fontFamily: 'Inter' }}
                  axisLine={{ stroke: 'divider' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                <Bar dataKey="volumenKg" name="Volumen (kg)" barSize={18} radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.esOtras ? COLOR_OTRAS : COLOR_BARRA} />
                  ))}
                  <LabelList
                    dataKey="volumenKg"
                    position="right"
                    formatter={(v) => `${v.toLocaleString('es-CL', { maximumFractionDigits: 0 })} kg`}
                    style={{ fill: 'text.primary', fontSize: 11, fontFamily: 'Inter', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
