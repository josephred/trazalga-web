import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  LinearProgress,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  PhoneAndroid as PhoneAndroidIcon,
  WarningAmber as WarningAmberIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  SystemUpdate as SystemUpdateIcon,
  Sensors as SensorsIcon,
} from '@mui/icons-material';
import { getVersionesApp } from '../../services/adminService';

/**
 * Componente de observabilidad de versiones móviles (TP.1).
 * Muestra el conteo de plantas con versiones desactualizadas (< 1.1.0),
 * lista desplegable de usuarios que deben actualizar y distribución de versiones.
 */
export default function MonitoreoVersionesApp() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [desplegarLista, setDesplegarLista] = useState(false);
  const [perfilFiltro, setPerfilFiltro] = useState(''); // '' para todos, o 'PLANTA'

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getVersionesApp(perfilFiltro || undefined);
      setData(response);
    } catch (err) {
      console.error('Error al cargar versiones de app:', err);
      setError('No se pudo obtener el estado de versiones móviles. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [perfilFiltro]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const plantasDesactualizadas = data?.plantasConAppAnteriorA110 || [];
  const totalPlantasDesactualizadas = data?.totalPlantasAnterioresA110 || 0;
  const distribucion = data?.distribucionVersiones || {};
  const totalDispositivos = Object.values(distribucion).reduce((a, b) => a + b, 0);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        mb: 4,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2.5,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
            }}
          >
            <PhoneAndroidIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}>
              Monitoreo de Versiones App Móvil (TP.1)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
              Telemetría de versiones reportadas por operadores y plantas en cada recepción
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={perfilFiltro === 'PLANTA' ? 'Solo Plantas' : 'Todos los Perfiles'}
            size="small"
            color="primary"
            variant="outlined"
            onClick={() => setPerfilFiltro(prev => prev === 'PLANTA' ? '' : 'PLANTA')}
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />
          <Tooltip title="Actualizar datos de telemetría">
            <IconButton onClick={cargarDatos} disabled={loading} size="small" color="primary">
              {loading ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Tarjeta de Alerta de Plantas Desactualizadas */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: totalPlantasDesactualizadas > 0 ? 'warning.main' : 'success.main',
                bgcolor: totalPlantasDesactualizadas > 0
                  ? (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(254, 243, 199, 0.5)'
                  : (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(209, 250, 229, 0.5)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {totalPlantasDesactualizadas > 0 ? (
                      <WarningAmberIcon color="warning" />
                    ) : (
                      <CheckCircleOutlineIcon color="success" />
                    )}
                    <Typography variant="subtitle1" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                      Plantas con app anterior a 1.1.0
                    </Typography>
                  </Box>
                  <Chip
                    label={totalPlantasDesactualizadas > 0 ? `${totalPlantasDesactualizadas} por actualizar` : '100% al día'}
                    size="small"
                    color={totalPlantasDesactualizadas > 0 ? 'warning' : 'success'}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  {totalPlantasDesactualizadas > 0
                    ? `Se detectaron ${totalPlantasDesactualizadas} usuario(s) de planta registrando con versiones móviles previas a la 1.1.0. Esto puede causar inconsistencias con la validación de romana y voucher.`
                    : 'Todas las plantas conectadas reportan versión 1.1.0 o superior. Sistema alineado con romana y vouchers desacoplados.'}
                </Typography>
              </Box>

              {totalPlantasDesactualizadas > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    endIcon={desplegarLista ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    onClick={() => setDesplegarLista(!desplegarLista)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    {desplegarLista ? 'Ocultar listado de plantas' : `Ver ${totalPlantasDesactualizadas} planta(s) a actualizar`}
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Panel de Distribución de Versiones */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.5)',
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SensorsIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                    Distribución de Versiones
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Total: {totalDispositivos} registros
                </Typography>
              </Box>

              {Object.keys(distribucion).length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 2 }}>
                  Aún no se registran versiones móviles vía X-App-Version.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {Object.entries(distribucion).map(([version, count]) => {
                    const porcentaje = totalDispositivos > 0 ? Math.round((count / totalDispositivos) * 100) : 0;
                    const esVigente = version >= '1.1.0' && version !== 'Sin versión';
                    return (
                      <Box key={version}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={version}
                              size="small"
                              color={esVigente ? 'success' : 'warning'}
                              variant="outlined"
                              sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                            />
                            {esVigente && (
                              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                                (Vigente)
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {count} ({porcentaje}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={porcentaje}
                          color={esVigente ? 'success' : 'warning'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Desplegable de Plantas que deben actualizar */}
        <Collapse in={desplegarLista && totalPlantasDesactualizadas > 0}>
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 1.5, color: 'warning.dark' }}>
              Plantas detectadas con versiones anteriores a 1.1.0
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>RUT</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Nombre / Razón Social</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Perfil</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Versión Actual</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Última Actividad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plantasDesactualizadas.map((p) => (
                    <TableRow key={p.id || p.rut}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.rut}</TableCell>
                      <TableCell>{p.nombreCompleto || 'Sin nombre'}</TableCell>
                      <TableCell>{p.perfilNombre || 'PLANTA'}</TableCell>
                      <TableCell>
                        <Chip
                          label={p.appVersion || 'Sin versión'}
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 700, height: 20 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {p.appVersionAt ? new Date(p.appVersionAt).toLocaleString('es-CL') : 'No registrada'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
