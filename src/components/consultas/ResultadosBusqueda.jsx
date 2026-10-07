// src/components/consultas/ResultadosBusqueda.jsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Grid,
  Stack,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Scale as ScaleIcon,
  ArrowForward as ArrowForwardIcon,
  Sell as TagIcon,
} from '@mui/icons-material';

const TIPO_LABELS = {
  RECOLECTOR: 'Recolector de Orilla',
  ARMADOR: 'Armador Artesanal',
  AREA: 'Área de Manejo (AMERB)',
  COMERCIALIZADOR: 'Comercializador',
  PLANTA_ABASTECIMIENTO: 'Planta de Abastecimiento',
};

const TIPO_COLORS = {
  RECOLECTOR: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  ARMADOR: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  AREA: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  COMERCIALIZADOR: { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' },
  PLANTA_ABASTECIMIENTO: { bg: '#fae8ff', color: '#a21caf', border: '#f5d0fe' },
};

const ESTADO_CHIP = {
  ENVIADA: { label: 'Enviada', color: 'success' },
  APROBADA: { label: 'Aprobada', color: 'success' },
  RECHAZADA: { label: 'Rechazada', color: 'error' },
  ANULADA: { label: 'Anulada', color: 'default' },
  NEGOCIACION: { label: 'En Gestión', color: 'warning' },
};

export default function ResultadosBusqueda({ resultados, onSelect, termino }) {
  if (!resultados || resultados.length === 0) {
    return null;
  }

  const formatKg = (val) => {
    if (val === null || val === undefined) return '0 kg';
    const num = Number(val);
    return isNaN(num) ? `${val} kg` : `${num.toLocaleString('es-CL')} kg`;
  };

  const formatDate = (d) => {
    if (!d) return 'Sin fecha';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return String(d);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', mt: 3, px: { xs: 1, sm: 2 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
          Se encontraron {resultados.length} {resultados.length === 1 ? 'coincidencia' : 'coincidencias'} para «{termino}»
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
          Selecciona una declaración para ver la ficha completa
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {resultados.map((r, idx) => {
          const tipoStyle = TIPO_COLORS[r.tipo] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
          const estadoInfo = ESTADO_CHIP[r.estado] || { label: r.estado || 'Enviada', color: 'default' };

          return (
            <Card
              key={`${r.tipo}-${r.id}-${idx}`}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2.5,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardActionArea
                onClick={() => onSelect && onSelect(r)}
                sx={{ p: { xs: 2, sm: 2.5 } }}
              >
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  {/* Fila superior: Tipo, Campo coincidente y Estado */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mb: 1.5 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip
                        label={TIPO_LABELS[r.tipo] || r.tipo}
                        size="small"
                        sx={{
                          bgcolor: tipoStyle.bg,
                          color: tipoStyle.color,
                          border: `1px solid ${tipoStyle.border}`,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      />
                      <Chip
                        icon={<TagIcon sx={{ fontSize: '0.9rem !important' }} />}
                        label={`${r.campo || 'Coincidencia'}: ${r.valor || ''}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </Stack>
                    <Chip
                      label={estadoInfo.label}
                      color={estadoInfo.color}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  </Stack>

                  {/* Fila central: Actor y Especie */}
                  <Typography variant="h6" sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' }, fontWeight: 800, mb: 0.5 }}>
                    {r.actor || 'Actor sin registrar'}
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1.5 }}>
                    Especie: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{r.especie || 'No informada'}</Box>
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Fila inferior: Metadatos clave y Acción */}
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={6} sm={3}>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <LocationIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500 }} noWrap>
                          {r.comunaOCaleta || 'Sin ubicación'}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <CalendarIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
                          {formatDate(r.fecha)}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <ScaleIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                          {formatKg(r.kg)}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={6} sm={3} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                        sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        <span>Ver ficha</span>
                        <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
