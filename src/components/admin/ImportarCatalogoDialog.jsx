import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  PlaylistAddCheck as ApplyIcon,
  UploadFile as UploadFileIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { importarCatalogoProductos } from '../../services/adminService';

const ESTADO_CONFIG = {
  NUEVO: { label: 'Nuevo', color: 'success' },
  ACTUALIZADO: { label: 'Actualizado', color: 'info' },
  SIN_CAMBIO: { label: 'Sin cambio', color: 'default' },
  RECURSO: { label: 'Recurso', color: 'primary' },
  POR_REVISAR: { label: 'Por revisar', color: 'warning' },
};

export default function ImportarCatalogoDialog({ open, onClose, onImportacionExitosa }) {
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    if (!open) {
      setArchivo(null);
      setResultado(null);
      setMensaje(null);
    }
  }, [open]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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
      const res = await importarCatalogoProductos(archivo, false);
      setResultado(res);
      if (res.porRevisar > 0) {
        setMensaje({
          type: 'warning',
          text: `Se detectaron ${res.porRevisar} fila(s) «por revisar»; esas filas no se importarán hasta corregirse.`,
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al procesar el archivo. Verifique formato CSV (codigo;nombre) o XLSX.';
      setMensaje({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const aplicarImportacion = async () => {
    if (!archivo) return;
    setLoading(true);
    setMensaje(null);
    try {
      const res = await importarCatalogoProductos(archivo, true);
      setResultado(res);
      setMensaje({
        type: 'success',
        text: `Catálogo aplicado: ${res.nuevos} nuevo(s), ${res.actualizados} actualizado(s), ${res.sinCambio} sin cambio, ${res.recursos} recurso(s). Fuente: ${res.fuente}.`,
      });
      if (onImportacionExitosa) {
        onImportacionExitosa();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al aplicar el catálogo oficial en la base de datos.';
      setMensaje({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const puedeAplicar =
    resultado &&
    !resultado.aplicado &&
    (resultado.nuevos > 0 || resultado.actualizados > 0 || resultado.recursos > 0);

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CategoryIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Importar Catálogo Oficial Sernapesca
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Acepta Excel (.xlsx, primera hoja) o CSV (codigo;nombre) con vista previa previa a guardar
            </Typography>
          </Box>
        </Box>
        <IconButton aria-label="Cerrar" onClick={onClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {mensaje && (
          <Alert severity={mensaje.type} sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setMensaje(null)}>
            {mensaje.text}
          </Alert>
        )}

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
            textAlign: 'center',
          }}
        >
          <UploadFileIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {archivo ? archivo.name : 'Seleccione la planilla oficial (.xlsx o .csv)'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Columnas esperadas: Código Recurso/Producto y Nombre Recurso/Producto. Las filas de recurso vinculan la especie y los formatos se validan con las 8 partes oficiales.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={loading} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Examinar archivo
              <input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={handleFileChange} />
            </Button>
            {archivo && (
              <Button variant="contained" onClick={procesarVistaPrevia} disabled={loading} sx={{ textTransform: 'none', borderRadius: 2 }}>
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Generar vista previa'}
              </Button>
            )}
          </Box>
        </Paper>

        {resultado && (
          <Box>
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 6, sm: 2 }}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{resultado.totalFilas}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total filas</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, borderColor: 'success.main' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>{resultado.nuevos}</Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>Nuevos</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, borderColor: 'info.main' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>{resultado.actualizados}</Typography>
                  <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 600 }}>Actualizados</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{resultado.sinCambio}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Sin cambio</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, borderColor: 'primary.main' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{resultado.recursos}</Typography>
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>Recursos</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, borderColor: resultado.porRevisar > 0 ? 'warning.main' : 'divider' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: resultado.porRevisar > 0 ? 'warning.main' : 'text.secondary' }}>
                    {resultado.porRevisar}
                  </Typography>
                  <Typography variant="caption" sx={{ color: resultado.porRevisar > 0 ? 'warning.main' : 'text.secondary', fontWeight: 600 }}>
                    Por revisar
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {resultado.descartadosDuplicados > 0 && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Se descartaron {resultado.descartadosDuplicados} fila(s) con código repetido dentro de la hoja.
              </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 340, mb: 2.5 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Fila</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Especie</TableCell>
                    <TableCell>Presentación</TableCell>
                    <TableCell>Calibre</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Detalle / Motivo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultado.filas.map((f) => {
                    const conf = ESTADO_CONFIG[f.estado] || ESTADO_CONFIG.POR_REVISAR;
                    return (
                      <TableRow key={`${f.numeroFila}-${f.codigo}`} hover>
                        <TableCell>{f.numeroFila}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{f.codigo || '—'}</TableCell>
                        <TableCell>{f.especieNombre || '—'}</TableCell>
                        <TableCell>{f.presentacion || (f.tipo === 'RECURSO' ? 'Recurso' : '—')}</TableCell>
                        <TableCell>{f.calibre || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={conf.label}
                            color={conf.color}
                            size="small"
                            icon={f.estado === 'POR_REVISAR' ? <WarningIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
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

            {resultado.localesNoEnCatalogo && resultado.localesNoEnCatalogo.length > 0 && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Productos locales no presentes en el catálogo ({resultado.localesNoEnCatalogo.length})
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                  No se desactivan automáticamente al importar (D45). Si corresponde retirar formatos heredados, puedes desactivarlos manualmente desde la tabla principal:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {resultado.localesNoEnCatalogo.map((p) => (
                    <Chip
                      key={p.id}
                      size="small"
                      variant="outlined"
                      label={`${p.nombre} (${p.codigo || 'sin código'} · ${p.activo !== false ? 'activo' : 'inactivo'} · ${p.usosTotales ?? 0} usos)`}
                    />
                  ))}
                </Box>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between' }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none', borderRadius: 2 }}>
          Cerrar
        </Button>
        {puedeAplicar && (
          <Button
            variant="contained"
            color="success"
            startIcon={<ApplyIcon />}
            onClick={aplicarImportacion}
            disabled={loading}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : `Aplicar ${resultado.nuevos + resultado.actualizados} formato(s) y ${resultado.recursos} recurso(s)`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
