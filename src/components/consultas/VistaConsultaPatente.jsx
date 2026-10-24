// src/components/consultas/VistaConsultaPatente.jsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  AccessTime as AccessTimeIcon,
  LocalShipping as TruckIcon,
  HelpOutline as HelpIcon,
  Receipt as ReceiptIcon,
  Scale as ScaleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowForwardIcon,
  Factory as FactoryIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function VistaConsultaPatente({ data, onVolver }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!data) return null;

  const { patente, estadoActual, vehiculo, movimientos = [] } = data;
  const estado = estadoActual?.estado || 'SIN_REGISTROS';

  const formatKg = (val) => {
    if (val === null || val === undefined) return '0 kg';
    const num = Number(val);
    return isNaN(num) ? `${val} kg` : `${num.toLocaleString('es-CL')} kg`;
  };

  const formatDateTime = (val) => {
    if (!val) return '-';
    try {
      const d = new Date(val);
      return d.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(val);
    }
  };

  const formatDate = (val) => {
    if (!val) return '-';
    try {
      const d = new Date(val);
      return d.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return String(val);
    }
  };

  const renderBannerEstado = () => {
    switch (estado) {
      case 'AUTORIZADO':
        return (
          <Paper
            elevation={2}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              bgcolor: '#15803d',
              color: '#ffffff',
              backgroundImage: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: { xs: 40, sm: 48 }, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                  <Chip
                    label={patente}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.22)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                    }}
                  />
                  <Chip
                    label="AUTORIZADO"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.25)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                    }}
                  />
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 900, fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
                  Vehículo con traslado de algas autorizado
                </Typography>
                <Grid container spacing={1.5} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
                      Autorización:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {formatDateTime(estadoActual.fechaHoraAutorizacion)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
                      Comuna destino:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {estadoActual.comunaDestino || 'Comuna no informada'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
                      Tipo de alga:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {estadoActual.tipoAlga || 'Alga parda'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Paper>
        );

      case 'RETENIDO':
        return (
          <Paper
            elevation={2}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              bgcolor: '#b91c1c',
              color: '#ffffff',
              backgroundImage: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <WarningIcon sx={{ fontSize: { xs: 40, sm: 48 }, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                  <Chip
                    label={patente}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.22)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                    }}
                  />
                  <Chip
                    label="CARGA RETENIDA"
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff', fontWeight: 800 }}
                  />
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 900, fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
                  Traslado retenido por hallazgo normativo
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
                  {estadoActual.motivoRetencion || 'La carga asociada presenta medidas de bloqueo preventivo activas.'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        );

      case 'FINALIZADO':
        return (
          <Paper
            elevation={2}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              bgcolor: '#0369a1',
              color: '#ffffff',
              backgroundImage: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <FactoryIcon sx={{ fontSize: { xs: 40, sm: 48 }, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                  <Chip
                    label={patente}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.22)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                    }}
                  />
                  <Chip
                    label="FINALIZADO EN PLANTA"
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff', fontWeight: 800 }}
                  />
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 900, fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
                  Traslado finalizado (recibido en planta)
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
                  Recibido en <strong>{estadoActual.nombrePlantaRecepcion || 'Planta'}</strong> el{' '}
                  {formatDateTime(estadoActual.fechaHoraRecepcion)}.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        );

      case 'VENCIDO':
        return (
          <Paper
            elevation={2}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              bgcolor: '#c2410c',
              color: '#ffffff',
              backgroundImage: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <AccessTimeIcon sx={{ fontSize: { xs: 40, sm: 48 }, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                  <Chip
                    label={patente}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.22)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                    }}
                  />
                  <Chip
                    label="PLAZO VENCIDO"
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff', fontWeight: 800 }}
                  />
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 900, fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
                  Traslado con plazo de vigencia expirado
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
                  El movimiento superó la ventana normativa de vigencia desde su salida (
                  {formatDateTime(estadoActual.fechaHoraSalida || estadoActual.fechaHoraAutorizacion)}).
                </Typography>
              </Box>
            </Stack>
          </Paper>
        );

      default:
        return (
          <Paper
            elevation={2}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              bgcolor: '#475569',
              color: '#ffffff',
              backgroundImage: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <HelpIcon sx={{ fontSize: { xs: 40, sm: 48 }, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                  <Chip
                    label={patente}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.22)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                    }}
                  />
                  <Chip
                    label="SIN REGISTROS"
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff', fontWeight: 800 }}
                  />
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 900, fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
                  No registra un traslado de algas autorizado vigente
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
                  Esta patente no presenta movimientos de transporte en curso en el sistema.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        );
    }
  };

  const handleVerFicha = (mov) => {
    if (mov.enlaceFicha) {
      navigate(mov.enlaceFicha);
    } else {
      navigate(`/consultas/${mov.tipo}/${mov.id}`);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Botón Volver */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onVolver}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            color: 'text.secondary',
            minHeight: 44,
          }}
        >
          Volver a la búsqueda
        </Button>
      </Box>

      {/* Banner de Estado Prominente */}
      {renderBannerEstado()}

      {/* Tarjeta de Nómina de Vehículo (si existe) */}
      {vehiculo && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (t) => (t.palette.mode === 'light' ? '#f8fafc' : '#1e293b'),
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <CarIcon sx={{ color: '#0284c7' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Ficha del Vehículo en Nómina
            </Typography>
          </Stack>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Tipo
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {vehiculo.tipo || 'CAMIÓN'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Comercializadores
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {vehiculo.totalComercializadores || 0}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Primera operación
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {formatDate(vehiculo.primeraVezEn)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Última operación
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {formatDate(vehiculo.ultimaVezEn)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Sección de Movimientos */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Movimientos Registrados ({movimientos.length})
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Traza exhaustiva de despachos y recepciones para fiscalización
            </Typography>
          </Box>
        </Stack>

        {movimientos.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2.5,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              No se registran movimientos para la patente {patente} en el período consultado.
            </Typography>
          </Paper>
        ) : isMobile ? (
          /* Vista Móvil: Tarjetas apiladas */
          <Stack spacing={2}>
            {movimientos.map((m, idx) => (
              <Card
                key={`${m.tipo}-${m.id}-${idx}`}
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2.5,
                  p: 2,
                }}
              >
                <CardContent sx={{ p: '0 !important' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Chip
                      label={m.folioSecundario || m.folioOrigen || `#${m.id}`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22 }}
                    />
                    <Chip
                      label={m.estadoMovimiento || 'EN_TRANSITO'}
                      size="small"
                      color={
                        m.estadoMovimiento === 'RECIBIDO'
                          ? 'success'
                          : m.estadoMovimiento === 'RETENIDO'
                          ? 'error'
                          : 'warning'
                      }
                      sx={{ fontWeight: 800, fontSize: '0.68rem', height: 20 }}
                    />
                  </Stack>

                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                    {m.comercializadorNombre || 'Comercializador'}
                  </Typography>
                  {m.comercializadorRut && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                      RUT: {m.comercializadorRut}
                    </Typography>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Fecha salida:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {formatDateTime(m.fechaHoraSalida || m.fechaDeclaracion)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Carga transportada:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatKg(m.kilos)} ({m.especies || 'Alga'})
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Chofer y Guía:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {m.choferDeclarado || 'Chofer S/D'}
                        {m.docNumero ? ` · Guía: ${m.docNumero}` : ''}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Destino:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {m.destinoNombre || 'Destino'} ({m.destinoComuna || 'S/C'})
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Marcas de fiscalización */}
                  {m.marcas && m.marcas.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 1.5 }}>
                      {m.marcas.map((mk, i) => (
                        <Chip
                          key={i}
                          label={mk.marca}
                          size="small"
                          color="warning"
                          sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }}
                        />
                      ))}
                    </Stack>
                  )}

                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => handleVerFicha(m)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      minHeight: 40,
                    }}
                  >
                    Ver Ficha Completa
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          /* Vista Escritorio: Tabla */
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: (t) => (t.palette.mode === 'light' ? '#f8fafc' : '#1e293b') }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Salida / Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Folio / Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Comercializador / Chofer</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Destino</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Carga (kg)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>
                    Acción
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movimientos.map((m, idx) => (
                  <TableRow key={`${m.tipo}-${m.id}-${idx}`} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatDateTime(m.fechaHoraSalida || m.fechaDeclaracion)}
                      </Typography>
                      {m.docNumero && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Guía #{m.docNumero}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={m.folioSecundario || m.folioOrigen || `#${m.id}`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 800, fontSize: '0.7rem', height: 22 }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {m.tipo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {m.comercializadorNombre || 'Comercializador'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Chofer: {m.choferDeclarado || 'S/D'} {m.choferRut ? `(${m.choferRut})` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {m.destinoNombre || 'Destino'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {m.destinoComuna || 'Comuna no informada'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {formatKg(m.kilos)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {m.especies || 'Alga'} ({m.estadoHumedad || 'HÚMEDO'})
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={m.estadoMovimiento || 'EN_TRANSITO'}
                        size="small"
                        color={
                          m.estadoMovimiento === 'RECIBIDO'
                            ? 'success'
                            : m.estadoMovimiento === 'RETENIDO'
                            ? 'error'
                            : 'warning'
                        }
                        sx={{ fontWeight: 800, fontSize: '0.68rem', height: 20 }}
                      />
                      {m.recepcionPlantaNombre && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Planta: {m.recepcionPlantaNombre}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleVerFicha(m)}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
                      >
                        Ver Ficha
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
