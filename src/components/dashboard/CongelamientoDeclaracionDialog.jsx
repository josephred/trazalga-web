import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import api from '../../api/axiosConfig';

const fmt = (v) =>
  v ? new Date(v).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/**
 * Refinamiento 30-10 · punto 3: una declaración de origen con alerta de veda o de cuota queda congelada
 * para su dueño. Aquí el fiscalizador ve el estado y, con motivo y n.º de acta de verificación física,
 * autoriza una edición o elimina la declaración (queda un respaldo con sus marcas).
 */
export default function CongelamientoDeclaracionDialog({ open, onClose, declaracionTipo, declaracionId, folio, puedeActuar, onCambio }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const tipo = String(declaracionTipo || '').toUpperCase();

  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [acta, setActa] = useState('');
  const [horas, setHoras] = useState('48');
  const [confirmaEliminar, setConfirmaEliminar] = useState(false);
  const [accion, setAccion] = useState(null); // 'editar' | 'eliminar'
  const [eliminada, setEliminada] = useState(false);

  const cargar = useCallback(async () => {
    if (!open || !declaracionId) return;
    setCargando(true);
    setError(null);
    try {
      const res = await api.get(`/api/declaraciones/${tipo}/${declaracionId}/edicion`);
      setEstado(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo consultar el estado de la declaración.');
    } finally {
      setCargando(false);
    }
  }, [open, tipo, declaracionId]);

  useEffect(() => {
    if (open) {
      setEstado(null);
      setExito(null);
      setMotivo('');
      setActa('');
      setHoras('48');
      setConfirmaEliminar(false);
      setEliminada(false);
      cargar();
    }
  }, [open, cargar]);

  const textosValidos = motivo.trim().length >= 5 && acta.trim().length > 0;

  const ejecutar = async (tipoAccion) => {
    setAccion(tipoAccion);
    setError(null);
    setExito(null);
    try {
      const url = `/api/declaraciones/${tipo}/${declaracionId}/${tipoAccion === 'editar' ? 'autorizar-edicion' : 'eliminar'}`;
      const body = { motivo: motivo.trim(), actaVerificacion: acta.trim() };
      if (tipoAccion === 'editar') body.horas = Number(horas) || undefined;
      const res = await api.post(url, body);
      setExito(res.data?.message || 'Listo.');
      if (tipoAccion === 'eliminar') {
        setEliminada(true);
      } else {
        await cargar();
      }
      if (onCambio) onCambio(tipoAccion);
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo completar la acción.');
    } finally {
      setAccion(null);
    }
  };

  const ocupado = accion !== null;
  const tieneCongelantes = estado?.marcasCongelantes?.length > 0;

  return (
    <Dialog open={open} onClose={ocupado ? undefined : onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700, pb: 1 }}>
        Congelamiento de la declaración
        <Typography variant="body2" color="text.secondary">
          {tipo} #{declaracionId}
          {folio ? ` · Folio ${folio}` : ''}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {cargando && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {exito && <Alert severity="success">{exito}</Alert>}

        {estado && !eliminada && (
          <>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {estado.congelada ? (
                <Chip color="error" label="Congelada: el usuario no puede modificarla ni eliminarla" />
              ) : estado.autorizacionEdicionVigente ? (
                <Chip color="warning" label="Edición autorizada, pendiente de uso" />
              ) : (
                <Chip color="success" variant="outlined" label="Sin congelamiento" />
              )}
              {(estado.marcasCongelantes || []).map((m) => (
                <Chip key={m.marca} size="small" variant="outlined" color="error" label={m.marca} />
              ))}
            </Box>
            {estado.motivo && (
              <Typography variant="body2" color="text.secondary">
                {estado.motivo}
              </Typography>
            )}

            {estado.autorizaciones?.length > 0 && (
              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Acta</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Autorizada</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Vence / usada</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {estado.autorizaciones.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.tipo === 'EDICION' ? 'Edición' : 'Eliminación'}</Typography>
                          <Typography variant="caption" color="text.secondary">{a.motivo}</Typography>
                        </TableCell>
                        <TableCell>{a.actaVerificacion}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {fmt(a.autorizadoEn)}
                          <Typography variant="caption" color="text.secondary" display="block">{a.autorizadoPorRut || ''}</Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{a.usadaEn ? `Usada ${fmt(a.usadaEn)}` : `Vence ${fmt(a.venceEn)}`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {puedeActuar && tieneCongelantes ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Procedimiento de fiscalización
                </Typography>
                <TextField
                  label="Motivo"
                  size="small"
                  multiline
                  minRows={2}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  inputProps={{ maxLength: 500 }}
                  helperText="Qué se verificó y por qué se autoriza (mínimo 5 caracteres)."
                />
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    label="N.º de acta de verificación"
                    size="small"
                    value={acta}
                    onChange={(e) => setActa(e.target.value)}
                    inputProps={{ maxLength: 120 }}
                    sx={{ flex: '1 1 200px' }}
                  />
                  <TextField
                    label="Plazo para editar (horas)"
                    size="small"
                    type="number"
                    value={horas}
                    onChange={(e) => setHoras(e.target.value)}
                    inputProps={{ min: 1, max: 720 }}
                    sx={{ flex: '0 1 170px' }}
                  />
                </Box>
                <FormControlLabel
                  control={<Checkbox size="small" checked={confirmaEliminar} onChange={(e) => setConfirmaEliminar(e.target.checked)} />}
                  label={
                    <Typography variant="body2">
                      Confirmo que quiero eliminar la declaración (se guarda un respaldo con sus marcas).
                    </Typography>
                  }
                />
              </Stack>
            ) : puedeActuar ? (
              <Alert severity="info">La declaración no tiene alertas que la congelen: su dueño puede modificarla.</Alert>
            ) : null}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose} color="inherit" disabled={ocupado}>
          Cerrar
        </Button>
        {puedeActuar && tieneCongelantes && !eliminada && (
          <>
            <Button
              color="error"
              variant="outlined"
              disabled={!textosValidos || !confirmaEliminar || ocupado}
              onClick={() => ejecutar('eliminar')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {accion === 'eliminar' ? <CircularProgress size={18} color="inherit" /> : 'Eliminar declaración'}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              disabled={!textosValidos || ocupado || !estado?.congelada}
              onClick={() => ejecutar('editar')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {accion === 'editar' ? <CircularProgress size={18} color="inherit" /> : 'Autorizar edición'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
