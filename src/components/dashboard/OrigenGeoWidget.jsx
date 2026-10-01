import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Grid,
  Alert,
  Tooltip
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import MapIcon from '@mui/icons-material/Map';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { getOrigenGeo } from '../../services/reportesService';
import MapaTrayectoUsuario from './MapaTrayectoUsuario';

export default function OrigenGeoWidget({ dateRange }) {
  const [tabIndex, setTabIndex] = useState(0); // 0: Patrones por Usuario, 1: Detalle de Declaraciones
  const [metrics, setMetrics] = useState({
    activo: true,
    totalDeclaracionesEvaluadas: 0,
    totalInconsistencias: 0,
    totalSinGps: 0,
    totalSinReferencia: 0,
    totalMarcadas: 0,
    totalPrecisionBaja: 0,
    usuariosEvaluados: 0,
    usuariosPatronSospechoso: 0,
    rankingUsuarios: [],
    hallazgos: [],
    parametros: {
      distanciaMaxKm: 30,
      precisionMaxM: 500,
      patronPct: 50,
      patronMinDecl: 3
    }
  });

  const [openMapModal, setOpenMapModal] = useState(false);
  const [selectedHallazgo, setSelectedHallazgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          params.startDate = dateRange.startDate;
          params.endDate = dateRange.endDate;
        }

        const data = await getOrigenGeo(params);
        if (data) {
          setMetrics(data);
        }
      } catch (err) {
        console.error('Error al cargar métricas de origen vs GPS:', err);
        setError('No se pudo cargar la información de origen real vs GPS.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const handleOpenMap = (item) => {
    setSelectedHallazgo(item);
    setOpenMapModal(true);
  };

  const handleCloseMap = () => {
    setOpenMapModal(false);
    setSelectedHallazgo(null);
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, borderRadius: 3 }}>
        <CircularProgress size={36} sx={{ color: '#06b6d4' }} />
      </Card>
    );
  }

  const { activo, totalDeclaracionesEvaluadas, totalInconsistencias, totalSinGps, totalSinReferencia, usuariosPatronSospechoso, rankingUsuarios, hallazgos, parametros } = metrics;

  return (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: 1, borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Cabecera del Widget */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: 'rgba(6, 182, 212, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#06b6d4'
              }}
            >
              <LocationOnIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', lineHeight: 1.2 }}>
                Origen Real vs Geolocalización GPS
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                Indicador 9 · Presencialidad y detección de uso de clave por terceros
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {activo ? (
              <Chip
                label={usuariosPatronSospechoso > 0 ? `${usuariosPatronSospechoso} Patrones Sospechosos` : 'Operación Regular'}
                color={usuariosPatronSospechoso > 0 ? 'error' : 'success'}
                size="small"
                sx={{ fontWeight: 600, fontFamily: 'Inter' }}
              />
            ) : (
              <Chip label="Desactivado" size="small" sx={{ fontWeight: 600, fontFamily: 'Inter' }} />
            )}
          </Box>
        </Box>

        {!activo ? (
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2, fontFamily: 'Inter' }}>
            El detector de origen vs GPS se encuentra <strong>desactivado</strong> en la configuración general (<code>origen_geo_activo = false</code>).
          </Alert>
        ) : (
          <>
            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2.5, border: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontFamily: 'Inter', textTransform: 'uppercase' }}>
                    Evaluadas
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary', mt: 0.5 }}>
                    {totalDeclaracionesEvaluadas}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: totalInconsistencias > 0 ? 'rgba(239, 68, 68, 0.05)' : 'background.default',
                    borderRadius: 2.5,
                    border: 1,
                    borderColor: totalInconsistencias > 0 ? 'rgba(239, 68, 68, 0.3)' : 'divider',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="caption" sx={{ color: totalInconsistencias > 0 ? 'error.main' : 'text.secondary', fontWeight: 600, fontFamily: 'Inter', textTransform: 'uppercase' }}>
                    Inconsistencias
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: totalInconsistencias > 0 ? 'error.main' : 'text.primary', mt: 0.5 }}>
                    {totalInconsistencias}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: usuariosPatronSospechoso > 0 ? 'rgba(249, 115, 22, 0.08)' : 'background.default',
                    borderRadius: 2.5,
                    border: 1,
                    borderColor: usuariosPatronSospechoso > 0 ? 'rgba(249, 115, 22, 0.4)' : 'divider',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="caption" sx={{ color: usuariosPatronSospechoso > 0 ? '#f97316' : 'text.secondary', fontWeight: 600, fontFamily: 'Inter', textTransform: 'uppercase' }}>
                    Patrones Sospechosos
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: usuariosPatronSospechoso > 0 ? '#f97316' : 'text.primary', mt: 0.5 }}>
                    {usuariosPatronSospechoso}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2.5, border: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontFamily: 'Inter', textTransform: 'uppercase' }}>
                    Sin GPS / Sin Ref.
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: (totalSinGps + totalSinReferencia) > 0 ? 'text.secondary' : 'text.primary', mt: 0.5 }}>
                    {totalSinGps} / {totalSinReferencia}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Pestañas */}
            <Tabs
              value={tabIndex}
              onChange={(e, val) => setTabIndex(val)}
              sx={{
                mb: 2,
                minHeight: 40,
                '& .MuiTab-root': {
                  minHeight: 40,
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  px: 2
                }
              }}
            >
              <Tab
                icon={<PersonSearchIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Patrones por Usuario (${rankingUsuarios.length})`}
              />
              <Tab
                icon={<WarningAmberIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Inconsistencias Lejanas (${hallazgos.length})`}
              />
            </Tabs>

            <Divider sx={{ mb: 2 }} />

            {/* PESTAÑA 0: Ranking de Usuarios y Patrones */}
            {tabIndex === 0 && (
              <Box>
                {rankingUsuarios.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 44, color: 'success.main', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                      No se registran declaraciones evaluables en el periodo seleccionado.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: 360 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Usuario / RUT</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Total Decl.</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Lejos (&gt;{parametros?.distanciaMaxKm || 30}km)</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>% Lejos</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Mediana Dist.</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Diagnóstico</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rankingUsuarios.map((user) => (
                          <TableRow
                            key={user.usuarioId}
                            hover
                            sx={{
                              bgcolor: user.patronSospechoso ? 'rgba(239, 68, 68, 0.04)' : 'inherit'
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'Inter' }}>
                                {user.usuarioNombre || 'Usuario ' + user.usuarioId}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                                {user.usuarioRut || 'RUT N/D'}
                              </Typography>
                            </TableCell>

                            <TableCell align="center" sx={{ fontFamily: 'Inter', fontWeight: 600 }}>
                              {user.totalDeclaraciones}
                            </TableCell>

                            <TableCell align="center">
                              <Chip
                                label={user.declaracionesLejos}
                                size="small"
                                color={user.declaracionesLejos > 0 ? 'error' : 'default'}
                                variant={user.declaracionesLejos > 0 ? 'filled' : 'outlined'}
                                sx={{ fontWeight: 700, minWidth: 28, height: 22 }}
                              />
                            </TableCell>

                            <TableCell align="center" sx={{ fontFamily: 'Inter' }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: user.porcentajeLejos >= (parametros?.patronPct || 50) ? 'error.main' : 'text.primary'
                                }}
                              >
                                {user.porcentajeLejos}%
                              </Typography>
                            </TableCell>

                            <TableCell align="center" sx={{ fontFamily: 'Inter' }}>
                              {user.medianaDistanciaKm > 0 ? `${user.medianaDistanciaKm} km` : '—'}
                            </TableCell>

                            <TableCell align="center">
                              {user.patronSospechoso ? (
                                <Tooltip title={`Concentra más del ${parametros?.patronPct || 50}% de declaraciones fuera de zona en >= ${parametros?.patronMinDecl || 3} registros.`}>
                                  <Chip
                                    label="Patrón sospechoso"
                                    color="error"
                                    size="small"
                                    sx={{ fontWeight: 700, fontFamily: 'Inter', fontSize: '0.75rem' }}
                                  />
                                </Tooltip>
                              ) : (
                                <Chip
                                  label="Regular"
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 600, fontFamily: 'Inter', fontSize: '0.75rem' }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* PESTAÑA 1: Inconsistencias Lejanas */}
            {tabIndex === 1 && (
              <Box>
                {hallazgos.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 44, color: 'success.main', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                      No se detectaron declaraciones con geolocalización lejana al origen declarado.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: 360 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Folio / Fecha</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Actor</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Origen Declarado</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Distancia</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Precisión / Red</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Estado Marca</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Mapa</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {hallazgos.map((h, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Inter' }}>
                                {h.folio}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                                {h.fechaDeclaracion} {h.hora}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'Inter' }}>
                                {h.usuarioNombre || 'Usuario ' + h.usuarioId}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                                {h.usuarioRut || 'RUT N/D'}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'Inter' }}>
                                {h.refNombre || 'Sin nombre'}
                              </Typography>
                              <Chip
                                label={h.refTipo || 'REFERENCIA'}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, fontFamily: 'Inter' }}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', fontFamily: 'Inter' }}>
                                {h.distanciaKm} km
                              </Typography>
                            </TableCell>

                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ fontFamily: 'Inter', color: h.precisionAceptable ? 'text.secondary' : 'warning.main', fontWeight: 600 }}>
                                  {h.precisionGpsM != null ? `±${h.precisionGpsM} m` : 'N/D'}
                                </Typography>
                                {h.envioOffline && (
                                  <Tooltip title="Declaración realizada sin conexión (modo offline)">
                                    <WifiOffIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>

                            <TableCell align="center">
                              {h.marcaGenerada ? (
                                <Chip
                                  label="ORIGEN_GEO_INCONSISTENTE"
                                  color="error"
                                  size="small"
                                  sx={{ fontWeight: 700, fontFamily: 'Inter', fontSize: '0.7rem' }}
                                />
                              ) : (
                                <Tooltip title="Precisión GPS superior a 500m. Se informa para auditoría pero no genera marca formal.">
                                  <Chip
                                    label="Precisión Baja (&gt;500m)"
                                    color="warning"
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontWeight: 600, fontFamily: 'Inter', fontSize: '0.7rem' }}
                                  />
                                </Tooltip>
                              )}
                            </TableCell>

                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                startIcon={<MapIcon />}
                                onClick={() => handleOpenMap(h)}
                                sx={{ textTransform: 'none', fontFamily: 'Inter', fontWeight: 600, py: 0.2 }}
                              >
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </>
        )}

        {/* Modal de Mapa */}
        <Dialog open={openMapModal} onClose={handleCloseMap} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
            Auditoría Cartográfica: Origen Declarado vs GPS Capturado
          </DialogTitle>
          <DialogContent dividers>
            {selectedHallazgo && (
              <MapaTrayectoUsuario hallazgo={selectedHallazgo} />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseMap} sx={{ fontFamily: 'Inter', fontWeight: 600 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
