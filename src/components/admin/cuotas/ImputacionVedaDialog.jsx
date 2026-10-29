import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { cuotaService } from '../../../services/cuotaService';

const pad = (n) => String(n).padStart(2, '0');

const rangoMesActual = () => {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth() + 1;
  const ultimo = new Date(y, m, 0).getDate();
  return { desde: `${y}-${pad(m)}-01`, hasta: `${y}-${pad(m)}-${pad(ultimo)}` };
};

const ESTADOS = {
  CRUZADA: { label: (destino) => `Se imputa a ${destino || 'destino'}`, color: 'success' },
  SIN_CUOTA_DESTINO: { label: () => 'Sin cuota de destino', color: 'warning' },
  NO_APLICA: { label: () => 'Vuelve al método declarado', color: 'default' },
};

/**
 * Refinamiento 23-10 · punto 1: imputación cruzada por veda.
 * Recalcula, para un rango de fechas, qué declaraciones de barreteado en veda sin cuota de barreteado
 * se descuentan de la cuota de varado de su comuna y mes. Primero muestra una vista previa.
 */
export default function ImputacionVedaDialog({ open, onClose, onAplicado, metodos = [] }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [rango, setRango] = useState(rangoMesActual);
  const [resumen, setResumen] = useState(null);
  const [rangoResumen, setRangoResumen] = useState(null);
  const [accion, setAccion] = useState(null); // 'previa' | 'aplicar' mientras corre
  const cargando = accion !== null;
  const [error, setError] = useState(null);
  const [aplicado, setAplicado] = useState(null);

  useEffect(() => {
    if (open) {
      setResumen(null);
      setRangoResumen(null);
      setError(null);
      setAplicado(null);
    }
  }, [open]);

  const nombreMetodo = useMemo(() => {
    const porId = new Map((metodos || []).map((m) => [m.id, m.nombre]));
    return (id) => (id == null ? 'Método declarado' : porId.get(id) || `Método #${id}`);
  }, [metodos]);

  const ejecutar = async (aplicar) => {
    if (!rango.desde || !rango.hasta) {
      setError('Indique las fechas desde y hasta.');
      return;
    }
    setAccion(aplicar ? 'aplicar' : 'previa');
    setError(null);
    try {
      const res = await cuotaService.recalcularImputacionCruzada(rango.desde, rango.hasta, aplicar);
      setResumen(res);
      setRangoResumen({ ...rango });
      if (aplicar) {
        setAplicado(res);
        if (onAplicado) onAplicado(res);
      } else {
        setAplicado(null);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo recalcular la imputación por veda.');
    } finally {
      setAccion(null);
    }
  };

  const vistaPreviaVigente =
    resumen && !resumen.aplicado && rangoResumen &&
    rangoResumen.desde === rango.desde && rangoResumen.hasta === rango.hasta;
  const puedeAplicar = vistaPreviaVigente && resumen.cambios > 0 && !cargando;

  return (
    <Dialog open={open} onClose={cargando ? undefined : onClose} fullScreen={fullScreen} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700, pb: 1 }}>
        Imputación por veda
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Si se declara barreteado en un mes en que está en veda y no hay cuota de barreteado para la especie, la comuna
          y el mes, la alerta de veda se mantiene y la captura corregida se descuenta de la cuota de varado. Las
          declaraciones nuevas se imputan al guardarse; aquí se recalculan las que ya están guardadas, por ejemplo después
          de crear o cambiar cuotas o vedas. El método declarado no se modifica.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            type="date"
            size="small"
            label="Desde"
            value={rango.desde}
            onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160, flex: { xs: '1 1 140px', sm: '0 0 auto' } }}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            value={rango.hasta}
            onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160, flex: { xs: '1 1 140px', sm: '0 0 auto' } }}
          />
          <Button
            variant="outlined"
            color="primary"
            onClick={() => ejecutar(false)}
            disabled={cargando}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, minHeight: 40 }}
          >
            {accion === 'previa' ? <CircularProgress size={18} /> : 'Vista previa'}
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {resumen && (
          <>
            <Alert severity={resumen.reglaActiva ? 'info' : 'warning'}>{resumen.mensaje}</Alert>
            {aplicado && (
              <Alert severity="success">
                {aplicado.cambios === 1
                  ? 'Se actualizó 1 declaración.'
                  : `Se actualizaron ${aplicado.cambios} declaraciones.`}{' '}
                Para registrar CUOTA_EXCEDIDA en declaraciones antiguas, recalcule los hallazgos de las cuotas de destino
                desde Control de cuotas.
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" label={`Evaluadas: ${resumen.declaracionesEvaluadas}`} />
              <Chip size="small" color="success" variant="outlined" label={`Imputadas a ${resumen.metodoDestino || 'destino'}: ${resumen.imputacionesCruzadas}`} />
              <Chip size="small" color="warning" variant="outlined" label={`Sin cuota de destino: ${resumen.sinCuotaDestino}`} />
              <Chip size="small" color="secondary" label={`${resumen.aplicado ? 'Cambios aplicados' : 'Cambios'}: ${resumen.cambios}`} />
            </Box>

            {resumen.detalle?.length > 0 ? (
              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 2, maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Folio</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Extracción</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Especie</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Declarado</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Imputación</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Resultado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resumen.detalle.map((it) => {
                      const est = ESTADOS[it.estado] || ESTADOS.NO_APLICA;
                      return (
                        <TableRow key={`${it.tipo}-${it.declaracionId}`} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{it.folio}</Typography>
                            <Typography variant="caption" color="text.secondary">{it.tipo}</Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{it.fechaExtraccion || '—'}</TableCell>
                          <TableCell>{it.especie || '—'}</TableCell>
                          <TableCell>{it.metodoDeclarado || '—'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {it.cambia
                              ? `${nombreMetodo(it.imputacionAnteriorId)} → ${nombreMetodo(it.imputacionNuevaId)}`
                              : nombreMetodo(it.imputacionNuevaId)}
                          </TableCell>
                          <TableCell>
                            <Tooltip describeChild title={it.detalle || ''} disableHoverListener={!it.detalle}>
                              <Chip size="small" color={est.color} label={est.label(resumen.metodoDestino)} />
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay declaraciones cuya imputación cambie en el rango.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={cargando}>
          Cerrar
        </Button>
        <Button
          onClick={() => ejecutar(true)}
          variant="contained"
          color="secondary"
          disabled={!puedeAplicar}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {accion === 'aplicar' ? <CircularProgress size={18} color="inherit" /> : 'Aplicar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
