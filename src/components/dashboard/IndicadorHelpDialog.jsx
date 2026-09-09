import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Grid,
  Divider,
  Paper,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  HelpOutline as HelpIcon,
  Scale as ScaleIcon,
  Science as ScienceIcon,
  CalendarMonth as CalendarIcon,
  Storage as StorageIcon,
  Functions as FunctionsIcon,
  Gavel as GavelIcon,
  WaterDrop as WaterDropIcon,
  CheckCircleOutline as CheckIcon,
  InfoOutlined as InfoIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';
import { interpolateMetadata } from './indicadoresMetadata';

// Cache en memoria para la sesión del navegador
let configuracionGeneralCache = null;
let fetchConfigPromise = null;

export function invalidateConfiguracionGeneralCache() {
  configuracionGeneralCache = null;
  fetchConfigPromise = null;
}

export default function IndicadorHelpDialog({ open, onClose, indicador, dateRange, configs }) {
  const [loadedConfigs, setLoadedConfigs] = useState(configuracionGeneralCache || {});
  const [isLiveSync, setIsLiveSync] = useState(Boolean(configuracionGeneralCache));

  useEffect(() => {
    if (!open) return;

    if (configs && Object.keys(configs).length > 0) {
      setLoadedConfigs(configs);
      setIsLiveSync(true);
      return;
    }

    if (configuracionGeneralCache) {
      setLoadedConfigs(configuracionGeneralCache);
      setIsLiveSync(true);
      return;
    }

    if (!fetchConfigPromise) {
      fetchConfigPromise = api
        .get('/api/configuracion-general')
        .then(({ data }) => {
          const mapa = {};
          if (Array.isArray(data)) {
            data.forEach((item) => {
              if (item && item.clave) {
                mapa[item.clave] = item.valor;
              }
            });
          }
          configuracionGeneralCache = mapa;
          return mapa;
        })
        .catch((err) => {
          console.warn('No se pudo cargar configuracion general en IndicadorHelpDialog:', err);
          return {};
        })
        .finally(() => {
          fetchConfigPromise = null;
        });
    }

    fetchConfigPromise.then((mapa) => {
      if (mapa && Object.keys(mapa).length > 0) {
        setLoadedConfigs(mapa);
        setIsLiveSync(true);
      }
    });
  }, [open, configs]);

  const activeIndicador = useMemo(() => {
    if (!indicador) return null;
    return interpolateMetadata(indicador, loadedConfigs);
  }, [indicador, loadedConfigs]);

  if (!open || !activeIndicador) return null;

  const formatDateRange = () => {
    if (!dateRange) return 'Histórico completo (sin filtro de fechas)';
    if (Array.isArray(dateRange)) {
      const s = dateRange[0]
        ? typeof dateRange[0].format === 'function'
          ? dateRange[0].format('DD/MM/YYYY')
          : String(dateRange[0]).slice(0, 10)
        : null;
      const e = dateRange[1]
        ? typeof dateRange[1].format === 'function'
          ? dateRange[1].format('DD/MM/YYYY')
          : String(dateRange[1]).slice(0, 10)
        : null;
      if (s && e) return `${s} al ${e}`;
      if (s) return `Desde ${s}`;
      if (e) return `Hasta ${e}`;
    }
    if (dateRange.startDate && dateRange.endDate) {
      return `${dateRange.startDate} al ${dateRange.endDate}`;
    }
    return 'Período activo en panel';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: { xs: 1, sm: 2 },
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: 1,
          borderColor: 'divider',
          backgroundImage: 'none',
        },
      }}
    >
      {/* Cabecera */}
      <DialogTitle
        sx={{
          p: 2,
          pb: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 3,
              bgcolor: (theme) => `${activeIndicador.color || theme.palette.secondary.main}18`,
              color: activeIndicador.color || 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 1,
              borderColor: `${activeIndicador.color || '#0ea5e9'}30`,
            }}
          >
            <HelpIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              {activeIndicador.codigo && (
                <Chip
                  label={activeIndicador.codigo}
                  size="small"
                  sx={{
                    fontFamily: 'Outfit',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                    color: 'text.primary',
                  }}
                />
              )}
              <Chip
                label={activeIndicador.categoria || 'Indicador de Trazabilidad'}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '0.7rem' }}
              />
              <Tooltip
                title={
                  isLiveSync
                    ? 'Parámetros sincronizados dinámicamente desde el panel de Administración'
                    : 'Valores normativos oficiales cargados por defecto'
                }
                arrow
              >
                <Chip
                  icon={<SyncIcon sx={{ fontSize: '13px !important' }} />}
                  label={isLiveSync ? 'Parámetros en Vivo' : 'Valores Normativos'}
                  size="small"
                  color={isLiveSync ? 'success' : 'default'}
                  variant="outlined"
                  sx={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.68rem' }}
                />
              </Tooltip>
            </Box>
            <Typography
              variant="h6"
              sx={{ fontFamily: 'Outfit', fontWeight: 800, lineHeight: 1.2, color: 'text.primary' }}
            >
              {activeIndicador.nombre}
            </Typography>
            {activeIndicador.subtitulo && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                {activeIndicador.subtitulo}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Banner de Rango Temporal Activo */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            px: 2,
            borderRadius: 3,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(14, 165, 233, 0.08)'
                : 'rgba(14, 165, 233, 0.05)',
            border: 1,
            borderColor: 'rgba(14, 165, 233, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
            <Typography
              variant="body2"
              sx={{ fontFamily: 'Inter', fontWeight: 600, color: 'text.primary', fontSize: '0.82rem' }}
            >
              Período Activo de Cálculo:
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'secondary.main', fontSize: '0.85rem' }}
            >
              {formatDateRange()}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
            Los valores mostrados en este indicador corresponden a este intervalo
          </Typography>
        </Paper>

        {/* Sección 1: Concepto de Negocio */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: 'Outfit',
              fontWeight: 700,
              color: 'text.primary',
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <InfoIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
            1. ¿Qué representa este indicador? (Visión de Negocio)
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'grey.50',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontFamily: 'Inter', lineHeight: 1.65, fontSize: '0.88rem' }}
            >
              {activeIndicador.resumenNegocio}
            </Typography>
          </Paper>
        </Box>

        {/* Sección 2: Ficha Técnica de Cálculo (Cuadrícula 2x2) */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: 'Outfit',
              fontWeight: 700,
              color: 'text.primary',
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <FunctionsIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
            2. Especificación Técnica de Cálculo
          </Typography>
          <Grid container spacing={1.5}>
            {/* Métrica Base */}
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  borderRadius: 3,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <ScaleIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'Outfit',
                      textTransform: 'uppercase',
                      color: 'primary.main',
                      letterSpacing: 0.5,
                    }}
                  >
                    Métrica Base Utilizada
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'Inter', color: 'text.primary', fontSize: '0.83rem', lineHeight: 1.5 }}
                >
                  {activeIndicador.metricaBase}
                </Typography>
              </Paper>
            </Grid>

            {/* Humedad y Factor */}
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  borderRadius: 3,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <WaterDropIcon sx={{ fontSize: 17, color: 'info.main' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'Outfit',
                      textTransform: 'uppercase',
                      color: 'info.main',
                      letterSpacing: 0.5,
                    }}
                  >
                    Estado de Humedad & Factores
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'Inter', color: 'text.primary', fontSize: '0.83rem', lineHeight: 1.5 }}
                >
                  {activeIndicador.humedadFactor}
                </Typography>
              </Paper>
            </Grid>

            {/* Fuentes de Datos */}
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  borderRadius: 3,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <StorageIcon sx={{ fontSize: 17, color: 'secondary.main' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'Outfit',
                      textTransform: 'uppercase',
                      color: 'secondary.main',
                      letterSpacing: 0.5,
                    }}
                  >
                    Tablas y Fuentes en Base de Datos
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'Inter', color: 'text.secondary', fontSize: '0.82rem', lineHeight: 1.5 }}
                >
                  {activeIndicador.fuentesDatos}
                </Typography>
              </Paper>
            </Grid>

            {/* Criterio de Fiscalización */}
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  borderRadius: 3,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <GavelIcon sx={{ fontSize: 17, color: 'warning.main' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'Outfit',
                      textTransform: 'uppercase',
                      color: 'warning.main',
                      letterSpacing: 0.5,
                    }}
                  >
                    Criterio de Fiscalización / Alerta
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'Inter', color: 'text.secondary', fontSize: '0.82rem', lineHeight: 1.5 }}
                >
                  {activeIndicador.criterioFiscalizacion}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Sección 3: Fórmula Matemática / Expresión Algorítmica */}
        {activeIndicador.formula && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary', mb: 1 }}>
              3. Fórmula Matemática / Algoritmo de Agregación
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#1e293b'),
                color: '#f8fafc',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                border: 1,
                borderColor: 'divider',
                overflowX: 'auto',
              }}
            >
              <code>{activeIndicador.formula}</code>
            </Paper>
          </Box>
        )}

        {/* Sección 4: Preguntas Frecuentes (si existen) */}
        {activeIndicador.preguntasFrecuentes && activeIndicador.preguntasFrecuentes.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary', mb: 1 }}>
              Preguntas Frecuentes de Interpretación
            </Typography>
            <Stack spacing={1}>
              {activeIndicador.preguntasFrecuentes.map((faq, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50',
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', mb: 0.5 }}
                  >
                    • {faq.pregunta}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter', display: 'block' }}>
                    {faq.respuesta}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={onClose}
          sx={{
            borderRadius: 2.5,
            textTransform: 'none',
            fontFamily: 'Outfit',
            fontWeight: 700,
            px: 3,
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
