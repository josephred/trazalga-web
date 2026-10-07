// src/components/consultas/FichaTrazabilidad.jsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Stack,
  Divider,
  Button,
  Alert,
  AlertTitle,
  Paper,
  Tooltip,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  Share as ShareIcon,
  AccountTree as GraphIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  AccessTime as TimeIcon,
  LocalShipping as TruckIcon,
  Factory as FactoryIcon,
  Phishing as FishIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Scale as ScaleIcon,
  Receipt as ReceiptIcon,
  DirectionsBoat as BoatIcon,
  Person as PersonIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import TrazabilidadDialog from '../dashboard/TrazabilidadDialog';

const SEMAFORO_COLORS = {
  VERDE: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Normal (Verde)' },
  AMARILLO: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Alerta (Amarillo)' },
  ROJO: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'Excedido (Rojo)' },
};

export default function FichaTrazabilidad({ ficha, onVolver }) {
  const [graphOpen, setGraphOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  if (!ficha) return null;

  const { alertas, origenes, comercializadores, planta, tipoConsulta, idConsulta } = ficha;

  const handleCopiarEnlace = () => {
    const url = `${window.location.origin}/consultas/${tipoConsulta}/${idConsulta}`;
    navigator.clipboard.writeText(url);
    setSnackOpen(true);
  };

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
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mt: 2, px: { xs: 1, sm: 2 } }}>
      {/* Barra de Acciones Superior */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
            onClick={onVolver}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Nueva Búsqueda
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
            Ficha de Trazabilidad
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
          <Button
            startIcon={<GraphIcon />}
            variant="contained"
            color="primary"
            size="small"
            onClick={() => setGraphOpen(true)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Ver Grafo
          </Button>
          <Tooltip title="Copiar enlace directo">
            <IconButton
              onClick={handleCopiarEnlace}
              color="primary"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* 1. Franja Superior de Alertas y Retenciones */}
      {alertas && (alertas.totalMarcasActivas > 0 || alertas.hayCargasRetenidas) && (
        <Box sx={{ mb: 3 }}>
          {alertas.hayCargasRetenidas && (
            <Alert
              severity="error"
              icon={<ErrorIcon fontSize="inherit" />}
              sx={{ mb: 1.5, borderRadius: 2, fontWeight: 600 }}
            >
              <AlertTitle sx={{ fontWeight: 800 }}>Carga Retenida en la Cadena</AlertTitle>
              {alertas.motivosRetencion && alertas.motivosRetencion.length > 0
                ? alertas.motivosRetencion.map((m, i) => <div key={i}>• {m}</div>)
                : 'Esta carga cuenta con bloqueo preventivo activo bajo normativa vigente.'}
            </Alert>
          )}

          {alertas.totalMarcasActivas > 0 && !alertas.hayCargasRetenidas && (
            <Alert
              severity="warning"
              icon={<WarningIcon fontSize="inherit" />}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              <AlertTitle sx={{ fontWeight: 800 }}>Marcas Activas Detectadas ({alertas.totalMarcasActivas})</AlertTitle>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {alertas.marcasActivas.map((m, i) => (
                  <Chip
                    key={i}
                    label={`${m.marca}${m.detalle ? `: ${m.detalle}` : ''}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 700, my: 0.3 }}
                  />
                ))}
              </Stack>
            </Alert>
          )}
        </Box>
      )}

      {/* 2. Resumen General del Lote */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
              Especie Principal
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {ficha.especiePredominante || 'No especificada'}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
              Estado Humedad Predominante
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {ficha.humedadPredominante || 'HÚMEDO'}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
              Total Desembarcado en Origen
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {formatKg(ficha.totalKgOrigen)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
              Intermediarios / Destino
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {comercializadores && comercializadores.length > 0
                ? `${comercializadores.length} Comercializador(es)`
                : 'Directo a Planta'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 3. Contenedor de las 3 Tarjetas (Horizontal en Desktop, Apiladas en Mobile) */}
      <Grid container spacing={3}>
        {/* BLOQUE 1: ORIGEN */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header Tarjeta Origen */}
            <Box sx={{ p: 2, bgcolor: (t) => t.palette.mode === 'light' ? '#f0fdf4' : '#064e3b', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FishIcon sx={{ color: '#16a34a' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: (t) => t.palette.mode === 'light' ? '#15803d' : '#86efac' }}>
                  1. Origen / Extracción
                </Typography>
              </Stack>
            </Box>

            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flexGrow: 1 }}>
              {origenes && origenes.length > 0 ? (
                <Stack spacing={2.5}>
                  {origenes.map((orig, i) => (
                    <Box
                      key={`${orig.tipo}-${orig.id}-${i}`}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: orig.consultada ? 'primary.main' : 'divider',
                        bgcolor: orig.consultada ? (t) => t.palette.mode === 'light' ? '#f0f9ff' : '#0c4a6e' : 'background.paper',
                      }}
                    >
                      {/* Distintivo de Consulta vs Misma Carga */}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Chip
                          label={orig.consultada ? 'Declaración Consultada' : 'Misma Carga'}
                          size="small"
                          color={orig.consultada ? 'primary' : 'default'}
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                        <Chip
                          label={orig.tipo}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                        />
                      </Stack>

                      {/* Actor */}
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.2 }}>
                        {orig.nombre || 'Extracción sin nombre'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                        RUT: <strong>{orig.rut || 'No informado'}</strong> · Perfil: {orig.perfil || 'Recolector'}
                      </Typography>

                      {/* Datos de Embarcación / Buzo si es armador */}
                      {orig.tipo === 'ARMADOR' && (orig.embarcacionNombre || orig.embarcacionCodigo) && (
                        <Box sx={{ mb: 1, p: 1, bgcolor: (t) => t.palette.mode === 'light' ? '#f8fafc' : '#1e293b', borderRadius: 1.5 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <BoatIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              Nave: {orig.embarcacionNombre || 'S/N'} {orig.embarcacionCodigo ? `(${orig.embarcacionCodigo})` : ''}
                            </Typography>
                          </Stack>
                          {orig.buzoNombre && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 3 }}>
                              Buzo: {orig.buzoNombre} {orig.buzoCodigo ? `(${orig.buzoCodigo})` : ''}
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Divider sx={{ my: 1 }} />

                      {/* Ubicación y Fechas */}
                      <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Ubicación: <strong>{orig.caleta || 'Sin caleta'}</strong>, {orig.comuna || ''} {orig.region || ''}
                            {orig.varaderoOAmerb ? ` · ${orig.varaderoOAmerb}` : ''}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Extracción: <strong>{formatDate(orig.fechaExtraccion)}</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Declaración: <strong>{formatDate(orig.fechaDeclaracion)} {orig.hora || ''}</strong>
                          </Typography>
                        </Grid>
                      </Grid>

                      {/* Cantidades y Especie */}
                      <Box sx={{ p: 1, bgcolor: (t) => t.palette.mode === 'light' ? '#f1f5f9' : '#334155', borderRadius: 1.5, mb: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {orig.especie || 'Huiro'} ({orig.estadoHumedad || 'Húmedo'})
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {formatKg(orig.desembarqueKg)}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Folios */}
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Folio Origen: <strong>{orig.folioOrigen || 'S/F'}</strong>
                        {orig.folioDesembarque ? ` · Desembarque: ${orig.folioDesembarque}` : ''}
                      </Typography>

                      {/* Retención individual */}
                      {orig.retenida && (
                        <Chip
                          icon={<WarningIcon sx={{ fontSize: '0.9rem !important' }} />}
                          label={orig.motivoBloqueo || 'Carga retenida'}
                          size="small"
                          color="error"
                          sx={{ mt: 1, fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No se encontraron declaraciones de extracción asociadas.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* BLOQUE 2: COMERCIALIZADOR */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header Tarjeta Comercializador */}
            <Box sx={{ p: 2, bgcolor: (t) => t.palette.mode === 'light' ? '#faf5ff' : '#581c87', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TruckIcon sx={{ color: '#9333ea' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: (t) => t.palette.mode === 'light' ? '#7e22ce' : '#d8b4fe' }}>
                  2. Comercializador / Intermediación
                </Typography>
              </Stack>
            </Box>

            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flexGrow: 1 }}>
              {comercializadores && comercializadores.length > 0 ? (
                <Stack spacing={2.5}>
                  {comercializadores.map((com, i) => {
                    const semInfo = SEMAFORO_COLORS[com.semaforo] || SEMAFORO_COLORS.VERDE;

                    return (
                      <Box
                        key={`com-${com.id || i}`}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                        }}
                      >
                        {/* Cabecera del tramo */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Chip
                            label={`Salto ${com.salto || i + 1}`}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                          />
                          {/* Semáforo Res. 3602 */}
                          <Chip
                            icon={<TimeIcon sx={{ fontSize: '0.9rem !important', color: `${semInfo.color} !important` }} />}
                            label={`${com.horasEnBodega !== null && com.horasEnBodega !== undefined ? com.horasEnBodega.toFixed(1) : '0.0'} h en bodega`}
                            size="small"
                            sx={{
                              bgcolor: semInfo.bg,
                              color: semInfo.color,
                              border: `1px solid ${semInfo.border}`,
                              fontWeight: 800,
                              fontSize: '0.75rem',
                            }}
                          />
                        </Stack>

                        {/* Actor */}
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.2 }}>
                          {com.nombre || 'Comercializador'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                          RUT: <strong>{com.rut || 'No informado'}</strong>
                        </Typography>

                        {/* Tiempos en Bodega */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: (t) => t.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
                            mb: 1.5,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                            Recepción: <strong>{formatDate(com.fechaRecepcion)} {com.horaRecepcion || ''}</strong>
                            <Box component="span" sx={{ fontSize: '0.68rem', display: 'block', color: 'text.disabled' }}>
                              (Fecha de la declaración de origen que lo nombra destinatario)
                            </Box>
                          </Typography>

                          {com.despachado ? (
                            <>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                Despacho: <strong>{formatDate(com.fechaDespacho)} {com.horaDespacho || ''}</strong>
                              </Typography>
                              {com.fechaTraslado && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                  Traslado físico: <strong>{formatDate(com.fechaTraslado)}</strong>
                                </Typography>
                              )}
                            </>
                          ) : (
                            <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700, display: 'block', mt: 0.5 }}>
                              • Carga en bodega virtual; aún sin declaración de despacho
                            </Typography>
                          )}
                        </Paper>

                        {/* Transporte y Guías si fue despachado */}
                        {com.despachado && (
                          <Grid container spacing={1} sx={{ mb: 1 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                Patente: <strong>{com.patenteCamion || 'S/P'}</strong>
                                {com.patenteCarro ? ` · Carro: ${com.patenteCarro}` : ''}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                Cantidad: <strong>{formatKg(com.cantidadKg)}</strong>
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                Guía Origen: <strong>{com.docOrigenNumero || 'S/N'}</strong>
                                {com.docDestinoNumero ? ` · Guía Destino: ${com.docDestinoNumero}` : ''}
                              </Typography>
                            </Grid>
                          </Grid>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Venta directa a planta (sin comercializador intermediario).
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* BLOQUE 3: PLANTA DE ABASTECIMIENTO */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header Tarjeta Planta */}
            <Box sx={{ p: 2, bgcolor: (t) => t.palette.mode === 'light' ? '#f0fdfa' : '#134e4a', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FactoryIcon sx={{ color: '#0d9488' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: (t) => t.palette.mode === 'light' ? '#0f766e' : '#5eead4' }}>
                  3. Planta de Abastecimiento
                </Typography>
              </Stack>
            </Box>

            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flexGrow: 1 }}>
              {planta && planta.recepcionada ? (
                <Stack spacing={2}>
                  {/* Nombre y Comuna */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.2 }}>
                      {planta.nombrePlanta || 'Planta de Proceso'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Comuna: <strong>{planta.comuna || 'Sin comuna'}</strong>
                      {planta.codigoSernapesca ? ` · Código: ${planta.codigoSernapesca}` : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Fecha llegada: <strong>{formatDate(planta.fechaLlegada)} {planta.hora || ''}</strong>
                    </Typography>
                  </Box>

                  {/* Pesaje de Entrada (Romana) */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (t) => t.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                        Pesaje de Entrada
                      </Typography>
                      <Chip
                        label={planta.conRomana ? 'Romana Verificada' : 'Sin Romana'}
                        size="small"
                        color={planta.conRomana ? 'success' : 'default'}
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </Stack>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
                      {planta.conRomana ? formatKg(planta.pesoRomanaKg) : formatKg(planta.cantidadDeclarada)}
                    </Typography>

                    {planta.conRomana ? (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Voucher N.º: <strong>{planta.numeroVoucherRomana || 'S/N'}</strong> · Fecha: {formatDate(planta.fechaPesajeRomana)}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Pesaje basado en cantidad declarada por receptor.
                      </Typography>
                    )}
                  </Paper>

                    {/* Estados de Humedad: Origen vs Recepción (T3.3) */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: (t) => t.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                        Estado de Humedad (T3.3)
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Declarado en Origen:
                          </Typography>
                          <Chip
                            label={planta.humedadEstadoOrigen || ficha.humedadPredominante || 'No declarado'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22, mt: 0.3 }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Al Recibir Camión:
                          </Typography>
                          <Chip
                            label={planta.humedadEstadoRecepcion || 'Sin registrar'}
                            size="small"
                            color={planta.humedadEstadoRecepcion && planta.humedadEstadoOrigen && planta.humedadEstadoRecepcion !== planta.humedadEstadoOrigen ? 'warning' : 'primary'}
                            sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22, mt: 0.3 }}
                          />
                        </Grid>
                      </Grid>
                      {planta.humedadHigrometro != null && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.8 }}>
                          Higrómetro en planta: <strong>{planta.humedadHigrometro}%</strong>
                        </Typography>
                      )}
                    </Paper>

                    {/* Variación Física contra el Origen */}
                    {planta.variacionPct !== null && planta.variacionPct !== undefined && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: Math.abs(planta.variacionPct) > 5.0 ? '#fef2f2' : (t) => t.palette.mode === 'light' ? '#f0fdf4' : '#064e3b',
                          border: '1px solid',
                          borderColor: Math.abs(planta.variacionPct) > 5.0 ? '#fecaca' : '#bbf7d0',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'text.primary' }}>
                              Variación Física de Recepción
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {planta.conRomana ? formatKg(planta.pesoRomanaKg) : formatKg(planta.cantidadDeclarada)} vs. {formatKg(ficha.totalKgOrigen)} origen
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              color: Math.abs(planta.variacionPct) > 5.0 ? '#dc2626' : '#16a34a',
                            }}
                          >
                            {planta.variacionPct > 0 ? `+${planta.variacionPct.toFixed(1)}%` : `${planta.variacionPct.toFixed(1)}%`}
                          </Typography>
                        </Stack>
                      </Paper>
                    )}

                    {/* Variación Equivalente en Captura (T3.2 / T3.3) */}
                    {planta.variacionEqPct !== null && planta.variacionEqPct !== undefined && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: Math.abs(planta.variacionEqPct) > 5.0 ? '#fef2f2' : (t) => t.palette.mode === 'light' ? '#eff6ff' : '#1e3a8a',
                          border: '1px solid',
                          borderColor: Math.abs(planta.variacionEqPct) > 5.0 ? '#fecaca' : '#bfdbfe',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'text.primary' }}>
                              Variación Equivalente en Captura
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {formatKg(planta.capturaPlantaTotal)} vs. {formatKg(planta.capturaOrigenTotal)} captura origen
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              color: Math.abs(planta.variacionEqPct) > 5.0 ? '#dc2626' : '#2563eb',
                            }}
                          >
                            {planta.variacionEqPct > 0 ? `+${planta.variacionEqPct.toFixed(1)}%` : `${planta.variacionEqPct.toFixed(1)}%`}
                          </Typography>
                        </Stack>
                      </Paper>
                    )}

                  {/* Documentos y Folios */}
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Folio DAPLA: <strong>{planta.folioDeclaracionAPla || 'S/F'}</strong>
                    {planta.docOrigenNumero ? ` · Guía: ${planta.docOrigenNumero}` : ''}
                  </Typography>
                  {planta.patenteCamion && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Patente camión: <strong>{planta.patenteCamion}</strong>
                    </Typography>
                  )}
                </Stack>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    Aún no recepcionada en planta
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
                    La carga se encuentra en tránsito o en bodega del comercializador.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo de Grafo Interactivo */}
      {graphOpen && (
        <TrazabilidadDialog
          open={graphOpen}
          onClose={() => setGraphOpen(false)}
          declaracionId={idConsulta}
          tipoReporte={tipoConsulta}
          row={{ id: idConsulta, tipoReporte: tipoConsulta }}
        />
      )}

      {/* Snackbar al copiar enlace */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message="Enlace de la ficha copiado al portapapeles"
      />
    </Box>
  );
}
