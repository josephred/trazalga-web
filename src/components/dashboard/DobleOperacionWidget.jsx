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
  Alert
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExploreIcon from '@mui/icons-material/Explore';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MapIcon from '@mui/icons-material/Map';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getDobleOperacion, getDobleOperacionGeo } from '../../services/reportesService';
import MapaTrayectoUsuario from './MapaTrayectoUsuario';

export default function DobleOperacionWidget({ dateRange }) {
  const [tabIndex, setTabIndex] = useState(0); // 0: Geográfica (nueva, por defecto), 1: ALA / AMERB

  // Estado pestaña ALA / AMERB (existente)
  const [metricsAla, setMetricsAla] = useState({ totalCoincidencias: 0, detalle: [] });
  const [openModalAla, setOpenModalAla] = useState(false);

  // Estado pestaña Geográfica (T8.3)
  const [metricsGeo, setMetricsGeo] = useState({
    activo: true,
    totalHallazgos: 0,
    hallazgos: [],
    sinGeolocalizacion: 0,
    totalDeclaraciones: 0,
    parametros: {}
  });
  const [openModalGeo, setOpenModalGeo] = useState(false);
  const [selectedHallazgo, setSelectedHallazgo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filters = (dateRange && dateRange.startDate && dateRange.endDate)
          ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
          : {};

        const [resGeo, resAla] = await Promise.all([
          getDobleOperacionGeo(filters).catch(err => {
            console.error('Error fetching doble operacion geo:', err);
            return { activo: true, totalHallazgos: 0, hallazgos: [], sinGeolocalizacion: 0, totalDeclaraciones: 0 };
          }),
          getDobleOperacion(filters).catch(err => {
            console.error('Error fetching doble operacion ala:', err);
            return { totalCoincidencias: 0, detalle: [] };
          })
        ]);

        setMetricsGeo(resGeo || { activo: true, totalHallazgos: 0, hallazgos: [], sinGeolocalizacion: 0, totalDeclaraciones: 0 });
        setMetricsAla(resAla || { totalCoincidencias: 0, detalle: [] });
      } catch (err) {
        console.error('Error general en DobleOperacionWidget:', err);
        setError(err.message || 'Error desconocido al cargar métricas');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const hasInfractionsGeo = metricsGeo.activo && (metricsGeo.totalHallazgos > 0);
  const hasInfractionsAla = (metricsAla.totalCoincidencias || 0) > 0;
  const currentHasInfractions = tabIndex === 0 ? hasInfractionsGeo : hasInfractionsAla;

  const handleOpenMapa = (hallazgo) => {
    setSelectedHallazgo(hallazgo);
  };

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
          minHeight: 280 
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4, 
        border: '1px solid',
        borderColor: currentHasInfractions ? 'error.light' : 'divider',
        background: currentHasInfractions 
          ? (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(180deg, #450a0a 0%, #1e293b 100%)' : 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)' 
          : 'background.paper',
        boxShadow: currentHasInfractions 
          ? '0 10px 15px -3px rgba(239, 68, 68, 0.04)' 
          : '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: currentHasInfractions
            ? '0 12px 25px -3px rgba(239, 68, 68, 0.08)'
            : '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
          borderColor: currentHasInfractions ? 'error.main' : 'divider',
        }
      }}
    >
      {/* Indicador visual lateral rojo si hay infracciones */}
      {currentHasInfractions && (
        <Box 
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            bgcolor: 'error.main'
          }}
        />
      )}

      <CardContent sx={{ p: 3, pl: currentHasInfractions ? 4 : 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Cabecera y Tabs */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningAmberIcon sx={{ mr: 1, color: currentHasInfractions ? 'error.main' : 'warning.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
              Control de Doble Operación
            </Typography>
          </Box>
        </Box>

        {/* Selector de Pestañas: Geográfica (por defecto) vs ALA / AMERB */}
        <Tabs
          value={tabIndex}
          onChange={(e, val) => setTabIndex(val)}
          sx={{
            minHeight: 40,
            mb: 2,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 40,
              py: 0.5,
              textTransform: 'none',
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: '0.88rem',
            }
          }}
        >
          <Tab 
            icon={<ExploreIcon fontSize="small" />} 
            iconPosition="start" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <span>Geográfica</span>
                {hasInfractionsGeo && (
                  <Chip 
                    label={metricsGeo.totalHallazgos} 
                    size="small" 
                    color="error" 
                    sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700 }} 
                  />
                )}
              </Box>
            } 
          />
          <Tab 
            icon={<CompareArrowsIcon fontSize="small" />} 
            iconPosition="start" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <span>ALA / AMERB</span>
                {hasInfractionsAla && (
                  <Chip 
                    label={metricsAla.totalCoincidencias} 
                    size="small" 
                    color="error" 
                    sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700 }} 
                  />
                )}
              </Box>
            } 
          />
        </Tabs>

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : tabIndex === 0 ? (
          /* =========================================================================
             PESTAÑA 0: DETECCIÓN GEOTEMPORAL (T8.1 - T8.3)
             ========================================================================= */
          !metricsGeo.activo ? (
            <Alert severity="info" sx={{ my: 2, borderRadius: 3, fontFamily: 'Inter' }}>
              El control geotemporal de doble operación se encuentra <strong>desactivado</strong> en la configuración general (<code>doble_op_activo = false</code>).
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'Inter', lineHeight: 1.5 }}>
                Detección espaciotemporal: identifica declaraciones consecutivas del mismo actor en caletas distantes con velocidades o intervalos físicamente inverosímiles (presunción de uso de clave por terceros).
              </Typography>

              {/* KPIs de la pestaña Geográfica */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ 
                    p: 1.8, 
                    borderRadius: 3, 
                    bgcolor: hasInfractionsGeo ? 'rgba(239, 68, 68, 0.08)' : 'background.default',
                    border: 1,
                    borderColor: hasInfractionsGeo ? 'error.light' : 'divider',
                    textAlign: 'center' 
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: hasInfractionsGeo ? 'error.main' : 'text.primary' }}>
                      {metricsGeo.totalHallazgos || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'Inter' }}>
                      Inconsistencias Críticas
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Box sx={{ p: 1.8, borderRadius: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
                      {metricsGeo.totalDeclaraciones || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', fontFamily: 'Inter' }}>
                      Declaraciones con GPS
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Box sx={{ p: 1.8, borderRadius: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.secondary' }}>
                      {metricsGeo.sinGeolocalizacion || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', fontFamily: 'Inter' }}>
                      Sin Geolocalización
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Botón Ver Detalle Geográfico */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Button 
                  variant="contained" 
                  onClick={() => setOpenModalGeo(true)}
                  disabled={!metricsGeo.hallazgos || metricsGeo.hallazgos.length === 0}
                  startIcon={<ExploreIcon />}
                  sx={{ 
                    bgcolor: hasInfractionsGeo ? 'error.main' : 'primary.main',
                    '&:hover': {
                      bgcolor: hasInfractionsGeo ? 'error.dark' : 'primary.light',
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'divider',
                      color: 'text.disabled'
                    },
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontFamily: 'Outfit',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    boxShadow: 'none'
                  }}
                >
                  Ver Hallazgos Geográficos ({metricsGeo.totalHallazgos || 0})
                </Button>
              </Box>
            </Box>
          )
        ) : (
          /* =========================================================================
             PESTAÑA 1: ALA / AMERB (Doble Imputación tradicional conservada)
             ========================================================================= */
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'Inter', lineHeight: 1.5 }}>
              Posibles duplicidades: mismo actor, especie y día declarados en Área de Libre Acceso y en Área de Manejo con volúmenes similares.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    fontFamily: 'Outfit', 
                    color: hasInfractionsAla ? 'error.main' : 'text.primary' 
                  }}
                >
                  {metricsAla.totalCoincidencias || 0}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'Inter' }}>
                  Coincidencias ALA / AMERB
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={() => setOpenModalAla(true)}
                disabled={(metricsAla.totalCoincidencias || 0) === 0}
                startIcon={<CompareArrowsIcon />}
                sx={{ 
                  bgcolor: hasInfractionsAla ? 'error.main' : 'primary.main',
                  '&:hover': {
                    bgcolor: hasInfractionsAla ? 'error.dark' : 'primary.light',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'divider',
                    color: 'text.disabled'
                  },
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontFamily: 'Outfit',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  boxShadow: 'none'
                }}
              >
                Ver Detalle ALA / AMERB
              </Button>
            </Box>
          </Box>
        )}

        {/* Modal de Detalle Geográfico con Tabla y Mapa */}
        <Dialog 
          open={openModalGeo} 
          onClose={() => setOpenModalGeo(false)} 
          maxWidth="lg" 
          fullWidth
          slotProps={{
            paper: {
              sx: { borderRadius: 4, overflow: 'hidden' }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', p: 3 }}>
            Hallazgos Geotemporales de Doble Operación (Inconsistencia de Trayecto)
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2.5, borderColor: 'divider' }}>
            {(!metricsGeo.hallazgos || metricsGeo.hallazgos.length === 0) ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                  No se detectaron inconsistencias espaciotemporales para el período seleccionado.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Usuario Declarante</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Declaración A (Origen)</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }}>Declaración B (Consecutiva)</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Distancia</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Intervalo (Δt)</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="right">Velocidad Implícita</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default' }} align="center">Mapa</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metricsGeo.hallazgos.map((h, idx) => (
                      <TableRow 
                        key={idx}
                        sx={{ 
                          '&:hover': { bgcolor: 'background.default' }, 
                          transition: 'background-color 0.2s ease' 
                        }}
                      >
                        <TableCell sx={{ py: 1.2, fontFamily: 'Inter' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{h.usuarioNombre || 'Usuario'}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>{h.usuarioRut || 'RUT N/D'}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Inter' }}>
                          <Typography variant="body2">{h.declaracionA?.folio}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {h.declaracionA?.tipo} • {h.declaracionA?.hora}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Inter' }}>
                          <Typography variant="body2">{h.declaracionB?.folio}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {h.declaracionB?.tipo} • {h.declaracionB?.hora}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Outfit', fontWeight: 600 }} align="right">
                          {h.distanciaKm} km
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Outfit', fontWeight: 600 }} align="right">
                          {h.tiempoMinutos} min
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontFamily: 'Outfit', fontWeight: 700, color: 'error.main' }} align="right">
                          <Chip 
                            label={`${h.velocidadKmh} km/h`} 
                            size="small" 
                            color="error" 
                            variant="outlined" 
                            sx={{ fontWeight: 700, fontFamily: 'Outfit' }} 
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1.2 }} align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<MapIcon />}
                            onClick={() => handleOpenMapa(h)}
                            sx={{ 
                              textTransform: 'none', 
                              borderRadius: 2, 
                              fontFamily: 'Outfit',
                              fontSize: '0.78rem',
                              py: 0.4
                            }}
                          >
                            Ver Trayecto
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
            <Button 
              onClick={() => setOpenModalGeo(false)}
              sx={{ fontFamily: 'Outfit', fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Mapa de Trayecto específico para el hallazgo */}
        <Dialog
          open={Boolean(selectedHallazgo)}
          onClose={() => setSelectedHallazgo(null)}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: { borderRadius: 4, overflow: 'hidden' }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit', bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
            Mapa de Trayecto: Inconsistencia Geotemporal
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            {selectedHallazgo && (
              <MapaTrayectoUsuario hallazgo={selectedHallazgo} />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
            <Button 
              onClick={() => setSelectedHallazgo(null)}
              sx={{ fontFamily: 'Outfit', fontWeight: 600, textTransform: 'none' }}
            >
              Cerrar Mapa
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Detalle ALA / AMERB (conservado) */}
        <Dialog 
          open={openModalAla} 
          onClose={() => setOpenModalAla(false)} 
          maxWidth="lg" 
          fullWidth
          slotProps={{
            paper: {
              sx: { borderRadius: 4, overflow: 'hidden' }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', p: 3 }}>
            Detalle de Coincidencias ALA / AMERB (Mismo Actor, Especie y Día)
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, borderColor: 'divider' }}>
            {(!metricsAla.detalle || metricsAla.detalle.length === 0) ? (
              <Typography sx={{ p: 4, color: 'text.secondary', fontFamily: 'Inter', textAlign: 'center' }}>
                No se detectaron posibles dobles operaciones ALA/AMERB para este periodo.
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Actor</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Especie</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Origen ALA</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }} align="right">Kg ALA</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }} align="right">Kg AMERB</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }} align="right">Δ%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metricsAla.detalle.map((row, idx) => (
                      <TableRow 
                        key={idx}
                        sx={{ 
                          '&:hover': { bgcolor: 'background.default' }, 
                          transition: 'background-color 0.2s ease' 
                        }}
                      >
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{new Date(row.fecha).toLocaleDateString('es-CL')}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>
                          {row.actor}
                          <Typography variant="caption" display="block" sx={{ color: 'text.disabled' }}>
                            {row.rut}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.especie}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.tipoAla}</TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Outfit', fontWeight: 600 }} align="right">
                          {((row && row.kgAla) || 0).toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Outfit', fontWeight: 600 }} align="right">
                          {((row && row.kgAmerb) || 0).toLocaleString('es-CL')}
                          <Typography variant="caption" display="block" sx={{ color: 'text.disabled', fontFamily: 'Inter', fontWeight: 400 }}>
                            {row.amerb}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontFamily: 'Outfit', fontWeight: 700, color: 'error.main' }} align="right">
                          {row.variacionPct > 0 ? `+${row.variacionPct}` : row.variacionPct}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
            <Button 
              onClick={() => setOpenModalAla(false)}
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                textTransform: 'none',
                color: 'text.secondary'
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
