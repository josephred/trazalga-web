import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Close as CloseIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  ErrorOutline as ErrorIcon,
  HelpOutline as HelpIcon,
  Public as PublicIcon,
  PlaylistAddCheck as ApplyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { importarCoordenadas, getCoberturaCoordenadas } from '../../services/adminService';

const ESTADO_CONFIG = {
  CALZADA: { label: 'Calzada', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  AMBIGUA: { label: 'Ambigua', color: 'warning', icon: <WarningIcon fontSize="small" /> },
  FUERA_DE_RANGO: { label: 'Fuera de Rango', color: 'error', icon: <ErrorIcon fontSize="small" /> },
  SIN_CALCE: { label: 'Sin Calce', color: 'default', icon: <HelpIcon fontSize="small" /> },
  EN_CONFLICTO: { label: 'En Conflicto', color: 'secondary', icon: <WarningIcon fontSize="small" /> }
};

export default function ImportarCoordenadasDialog({ open, onClose, onImportacionExitosa }) {
  const [tabActual, setTabActual] = useState(0);
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [forzar, setForzar] = useState(false);

  // Cobertura georreferencial
  const [cobertura, setCobertura] = useState(null);
  const [loadingCobertura, setLoadingCobertura] = useState(false);

  useEffect(() => {
    if (open) {
      cargarCobertura();
    } else {
      // Limpiar estado al cerrar
      setResultado(null);
      setArchivo(null);
      setMensaje(null);
      setForzar(false);
      setTabActual(0);
    }
  }, [open]);

  const cargarCobertura = async () => {
    setLoadingCobertura(true);
    try {
      const data = await getCoberturaCoordenadas();
      setCobertura(data);
    } catch (err) {
      console.error('Error al cargar cobertura:', err);
    } finally {
      setLoadingCobertura(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivo(file);
      setResultado(null);
      setMensaje(null);
    }
  };

  const procesarVistaPrevia = async () => {
    if (!archivo) return;
    setLoading(true);
    setMensaje(null);
    try {
      const res = await importarCoordenadas(archivo, false, forzar);
      setResultado(res);
      if (res.calzadas === 0 && res.totalFilas > 0) {
        setMensaje({ type: 'warning', text: 'No se encontraron filas coincidentes para aplicar.' });
      }
    } catch (err) {
      console.error('Error al procesar vista previa:', err);
      setMensaje({ type: 'error', text: 'Error al procesar la planilla. Verifique el formato CSV.' });
    } finally {
      setLoading(false);
    }
  };

  const aplicarImportacion = async () => {
    if (!archivo) return;
    setLoading(true);
    setMensaje(null);
    try {
      const res = await importarCoordenadas(archivo, true, forzar);
      setResultado(res);
      setMensaje({
        type: 'success',
        text: `Se aplicaron correctamente las coordenadas de ${res.aplicadas} registros en la base de datos.`
      });
      cargarCobertura();
      if (onImportacionExitosa) {
        onImportacionExitosa();
      }
    } catch (err) {
      console.error('Error al aplicar coordenadas:', err);
      setMensaje({ type: 'error', text: 'Error al guardar los cambios en la base de datos.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PublicIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
              Carga y Cobertura de Coordenadas (TG.1)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Importación masiva verificable para Caletas, Varaderos y AMERB
            </Typography>
          </Box>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            minWidth: 44,
            minHeight: 44,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: 'background.default' }}>
        <Tabs value={tabActual} onChange={(e, val) => setTabActual(val)}>
          <Tab label="Importar Planilla CSV" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Cobertura Georreferencial" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
        {mensaje && (
          <Alert severity={mensaje.type} sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setMensaje(null)}>
            {mensaje.text}
          </Alert>
        )}

        {tabActual === 0 && (
          <Box>
            {/* Sección de Selección de Archivo */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: archivo ? 'primary.main' : 'divider',
                bgcolor: archivo ? 'action.hover' : 'background.paper',
                textAlign: 'center'
              }}
            >
              <UploadFileIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {archivo ? archivo.name : 'Seleccione o arrastre la planilla CSV de coordenadas'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Columnas requeridas: tipo (CALETA|VARADERO|AMERB), nombre, comuna, region, latitud, longitud. Opcionales: codigo, datum, fuente.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  sx={{ minHeight: 44, borderRadius: 2 }}
                >
                  Examinar Archivo
                  <input type="file" accept=".csv,text/csv,text/plain" hidden onChange={handleFileChange} />
                </Button>
                {archivo && (
                  <Button
                    variant="contained"
                    onClick={procesarVistaPrevia}
                    disabled={loading}
                    sx={{ minHeight: 44, borderRadius: 2 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Generar Vista Previa'}
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Resumen de la Vista Previa */}
            {resultado && (
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 1.5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{resultado.totalFilas}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Filas</Typography>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 1.5, borderColor: 'success.main' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>{resultado.calzadas}</Typography>
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>Calzadas</Typography>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 1.5, borderColor: 'warning.main' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>{resultado.ambiguas}</Typography>
                      <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>Ambiguas</Typography>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 1.5, borderColor: 'error.main' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>{resultado.fueraDeRango}</Typography>
                      <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>Fuera Rango</Typography>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 1.5, borderColor: 'secondary.main' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>{resultado.enConflicto}</Typography>
                      <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 600 }}>En Conflicto</Typography>
                    </Card>
                  </Grid>
                </Grid>

                {/* Si hay conflictos manuales, ofrecer checkbox para forzar */}
                {resultado.enConflicto > 0 && (
                  <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    Se detectaron {resultado.enConflicto} fila(s) con coordenadas editadas manualmente de forma previa.
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={forzar}
                          onChange={(e) => setForzar(e.target.checked)}
                          color="secondary"
                        />
                      }
                      label="Forzar sobreescritura de coordenadas manuales existentes"
                      sx={{ display: 'block', mt: 1 }}
                    />
                  </Alert>
                )}

                {/* Tabla de Resultados de la Planilla */}
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 360 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fila</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Identificador / Nombre</TableCell>
                        <TableCell>Comuna / Región</TableCell>
                        <TableCell>Coordenadas (Lat, Lon)</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Detalle / Motivo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resultado.filas.map((f) => {
                        const conf = ESTADO_CONFIG[f.estado] || ESTADO_CONFIG.SIN_CALCE;
                        return (
                          <TableRow key={f.numeroFila} hover>
                            <TableCell>{f.numeroFila}</TableCell>
                            <TableCell><Chip label={f.tipo} size="small" variant="outlined" /></TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{f.nombreOriginal || f.codigoOriginal}</TableCell>
                            <TableCell>{f.comunaOriginal || '-'} / {f.regionOriginal || '-'}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {f.latitudNormalizada != null && f.longitudNormalizada != null
                                ? `${f.latitudNormalizada.toFixed(4)}, ${f.longitudNormalizada.toFixed(4)}`
                                : `${f.latitudOriginal || '-'}, ${f.longitudOriginal || '-'}`}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={conf.label}
                                color={conf.color}
                                size="small"
                                icon={conf.icon}
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                              {f.mensaje}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}

        {tabActual === 1 && (
          <Box>
            {loadingCobertura ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : cobertura ? (
              <Box>
                {/* Resumen Global */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark' }}>COBERTURA TOTAL</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', my: 0.5 }}>
                        {cobertura.porcentajeTotal}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {cobertura.totalConGps} de {cobertura.totalEntidades} entidades georreferenciadas
                      </Typography>
                      <LinearProgress variant="determinate" value={cobertura.porcentajeTotal} sx={{ mt: 1, borderRadius: 1 }} />
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>CALETAS</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, my: 0.5 }}>
                        {cobertura.porcentajeCaletas}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {cobertura.caletasConGps} de {cobertura.totalCaletas} caletas
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>VARADEROS</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, my: 0.5 }}>
                        {cobertura.porcentajeVaraderos}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {cobertura.varaderosConGps} de {cobertura.totalVaraderos} varaderos
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>AMERB</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, my: 0.5 }}>
                        {cobertura.porcentajeAmerb}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {cobertura.amerbConGps} de {cobertura.totalAmerb} áreas de manejo
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                {/* Desglose por Región */}
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Cobertura por Región Administrativa
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Región</TableCell>
                        <TableCell align="center">Caletas con GPS</TableCell>
                        <TableCell align="center">Varaderos con GPS</TableCell>
                        <TableCell align="center">AMERB con GPS</TableCell>
                        <TableCell align="center">Total GPS</TableCell>
                        <TableCell align="right">% Cobertura</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cobertura.porRegion.map((r) => (
                        <TableRow key={r.regionId} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{r.regionNombre}</TableCell>
                          <TableCell align="center">{r.caletasConGps} / {r.totalCaletas}</TableCell>
                          <TableCell align="center">{r.varaderosConGps} / {r.totalVaraderos}</TableCell>
                          <TableCell align="center">{r.amerbConGps} / {r.totalAmerb}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>{r.totalConGps} / {r.totalEntidades}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${r.porcentajeCobertura}%`}
                              size="small"
                              color={r.porcentajeCobertura >= 80 ? 'success' : r.porcentajeCobertura >= 50 ? 'warning' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : null}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ minHeight: 44, px: 3, borderRadius: 2 }}>
          Cerrar
        </Button>
        {tabActual === 0 && resultado && !resultado.aplicado && resultado.calzadas > 0 && (
          <Button
            variant="contained"
            color="success"
            startIcon={<ApplyIcon />}
            onClick={aplicarImportacion}
            disabled={loading}
            sx={{ minHeight: 44, px: 3, borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : `Aplicar ${resultado.calzadas + (forzar ? resultado.enConflicto : 0)} Coordenadas a BD`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
