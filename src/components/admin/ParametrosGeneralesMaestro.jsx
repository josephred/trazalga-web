import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Switch,
  Slider,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Tune as TuneIcon,
  Scale as ScaleIcon,
  Phishing as PhishingIcon,
  Block as BlockIcon,
  LocalShipping as LocalShippingIcon,
  Science as ScienceIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';
import { invalidateConfiguracionGeneralCache } from '../dashboard/IndicadorHelpDialog';

export default function ParametrosGeneralesMaestro() {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarParametros();
  }, []);

  const cargarParametros = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/configuracion-general');
      const mapa = {};
      if (Array.isArray(data)) {
        data.forEach((item) => {
          mapa[item.clave] = item.valor;
        });
      }
      setConfigs(mapa);
    } catch (err) {
      console.error('Error cargando parámetros generales:', err);
      setMensaje({ type: 'error', text: 'Error al cargar los parámetros del servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const handleValorChange = (clave, valor) => {
    setConfigs((prev) => ({ ...prev, [clave]: String(valor) }));
  };

  const handleGuardarParametro = async (clave) => {
    try {
      setSavingKey(clave);
      setMensaje(null);
      await api.put(`/api/configuracion-general/${clave}`, {
        clave,
        valor: configs[clave] ?? '',
      });
      invalidateConfiguracionGeneralCache();
      setMensaje({ type: 'success', text: `Parámetro "${clave}" actualizado correctamente.` });
      setTimeout(() => setMensaje(null), 3500);
    } catch (err) {
      console.error(`Error al guardar parámetro ${clave}:`, err);
      setMensaje({ type: 'error', text: `Error al actualizar "${clave}".` });
    } finally {
      setSavingKey(null);
    }
  };

  const handleGuardarCategoria = async (claves) => {
    try {
      setSavingKey('CAT');
      setMensaje(null);
      for (const k of claves) {
        await api.put(`/api/configuracion-general/${k}`, {
          clave: k,
          valor: configs[k] ?? '',
        });
      }
      invalidateConfiguracionGeneralCache();
      setMensaje({ type: 'success', text: 'Parámetros de la categoría guardados exitosamente.' });
      setTimeout(() => setMensaje(null), 4000);
    } catch (err) {
      console.error('Error al guardar categoría:', err);
      setMensaje({ type: 'error', text: 'Error al actualizar algunos parámetros.' });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={36} color="secondary" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {mensaje && (
        <Alert severity={mensaje.type} sx={{ borderRadius: 2 }} onClose={() => setMensaje(null)}>
          {mensaje.text}
        </Alert>
      )}

      {/* SECCIÓN 1: Desembarque Físico (Indicador 1) */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PhishingIcon color="secondary" />
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                Indicador 1: Parámetros Operativos de Desembarque
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<SaveIcon />}
              onClick={() =>
                handleGuardarCategoria([
                  'desembarque_unidad_base',
                  'desembarque_umbral_atipico_kg',
                  'desembarque_fuente_recolector_activa',
                  'desembarque_fuente_armador_activa',
                  'desembarque_fuente_area_activa',
                ])
              }
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Guardar Sección
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
            Controla las fuentes de extracción contabilizadas en los reportes de volumen y el umbral para detectar anomalías de pesaje físico.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Unidad Base de Medida"
                value={configs['desembarque_unidad_base'] || 'kg'}
                disabled
                helperText="Bloqueada en kg por norma técnica pesquera."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Umbral Desembarque Atípico (kg)"
                value={configs['desembarque_umbral_atipico_kg'] || '5000'}
                onChange={(e) => handleValorChange('desembarque_umbral_atipico_kg', e.target.value)}
                helperText="Dispara marca de auditoría informativa DESEMBARQUE_ATIPICO."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                Fuentes Computadas en Dashboard:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configs['desembarque_fuente_recolector_activa'] === 'true'}
                      onChange={(e) =>
                        handleValorChange('desembarque_fuente_recolector_activa', e.target.checked ? 'true' : 'false')
                      }
                      color="secondary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Recolectores de Orilla</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={configs['desembarque_fuente_armador_activa'] === 'true'}
                      onChange={(e) =>
                        handleValorChange('desembarque_fuente_armador_activa', e.target.checked ? 'true' : 'false')
                      }
                      color="secondary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Embarcaciones de Armador</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={configs['desembarque_fuente_area_activa'] === 'true'}
                      onChange={(e) =>
                        handleValorChange('desembarque_fuente_area_activa', e.target.checked ? 'true' : 'false')
                      }
                      color="secondary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Áreas de Manejo (AMERB)</Typography>}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* SECCIÓN 2: Captura Corregida y Respaldo de Factores (Indicador 2) */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ScienceIcon color="secondary" />
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                Indicador 2: Políticas de Captura Corregida sin Factor Vigente
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<SaveIcon />}
              onClick={() =>
                handleGuardarCategoria(['captura_politica_sin_factor', 'captura_factor_default'])
              }
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Guardar Sección
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Determina el comportamiento del servidor cuando ingresa una declaración para una combinación de especie y humedad que no posee factor vigente registrado.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Política en Ausencia de Factor"
                value={configs['captura_politica_sin_factor'] || 'USAR_DEFAULT'}
                onChange={(e) => handleValorChange('captura_politica_sin_factor', e.target.value)}
                helperText="USAR_DEFAULT aplica el factor de respaldo; RECHAZAR_DECLARACION rechaza con error 422."
              >
                <MenuItem value="USAR_DEFAULT">USAR_DEFAULT (Aplicar factor de respaldo)</MenuItem>
                <MenuItem value="RECHAZAR_DECLARACION">RECHAZAR_DECLARACION (Bloquear declaración)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                inputProps={{ step: '0.0001', min: '0.1' }}
                label="Factor de Respaldo por Defecto"
                value={configs['captura_factor_default'] || '1.0000'}
                onChange={(e) => handleValorChange('captura_factor_default', e.target.value)}
                helperText="Se aplica sólo cuando la política es USAR_DEFAULT."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* SECCIÓN 3: Cuotas de Extracción y Exceso (Indicador 3) */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ScaleIcon color="secondary" />
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                Indicador 3: Políticas de Alerta y Fiscalización de Cuotas
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<SaveIcon />}
              onClick={() =>
                handleGuardarCategoria([
                  'cuota_umbral_restante_pct',
                  'cuota_desvio_velocidad_pct',
                  'cuota_dias_previos_expiracion',
                  'cuota_accion_post_cierre',
                  'cuota_accion_exceso_limite',
                ])
              }
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Guardar Sección
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                Umbral Saldo Restante Crítico: {configs['cuota_umbral_restante_pct'] || '10.0'}%
              </Typography>
              <Slider
                value={parseFloat(configs['cuota_umbral_restante_pct'] || '10.0')}
                onChange={(e, val) => handleValorChange('cuota_umbral_restante_pct', val)}
                min={1}
                max={30}
                step={0.5}
                valueLabelDisplay="auto"
                color="secondary"
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Alerta preventiva a las 06:00 AM si el saldo cae bajo este %.
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                Desvío Velocidad de Consumo: {configs['cuota_desvio_velocidad_pct'] || '25.0'}%
              </Typography>
              <Slider
                value={parseFloat(configs['cuota_desvio_velocidad_pct'] || '25.0')}
                onChange={(e, val) => handleValorChange('cuota_desvio_velocidad_pct', val)}
                min={5}
                max={50}
                step={1}
                valueLabelDisplay="auto"
                color="warning"
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Diferencia entre % tiempo transcurrido y % cuota consumida.
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Días Previos Aviso Expiración"
                value={configs['cuota_dias_previos_expiracion'] || '5'}
                onChange={(e) => handleValorChange('cuota_dias_previos_expiracion', e.target.value)}
                helperText="Días antes del fin de vigencia de la cuota."
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Acción ante Exceso de Límite"
                value={configs['cuota_accion_exceso_limite'] || 'ALERTA_EXCESO'}
                onChange={(e) => handleValorChange('cuota_accion_exceso_limite', e.target.value)}
                helperText="ALERTA_EXCESO marca y notifica; BLOQUEO_DECLARACION rechaza con 422."
              >
                <MenuItem value="ALERTA_EXCESO">ALERTA_EXCESO (Marca y notifica)</MenuItem>
                <MenuItem value="BLOQUEO_DECLARACION">BLOQUEO_DECLARACION (Rechaza 422)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Acción ante Declaración Posterior a Cierre"
                value={configs['cuota_accion_post_cierre'] || 'ALERTA_CRITICA'}
                onChange={(e) => handleValorChange('cuota_accion_post_cierre', e.target.value)}
                helperText="Acción cuando una cuota se encuentra administrativamente CERRADA."
              >
                <MenuItem value="ALERTA_CRITICA">ALERTA_CRITICA (Registra POSTERIOR_CIERRE y notifica)</MenuItem>
                <MenuItem value="BLOQUEO_TOTAL">BLOQUEO_TOTAL (Rechazo total estricto HTTP 422)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* SECCIÓN 4: Control de Vedas (Indicador 5) */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <BlockIcon color="error" />
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                Indicador 5: Políticas Globales de Control de Vedas
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<SaveIcon />}
              onClick={() =>
                handleGuardarCategoria(['veda_modo_operacion', 'veda_dias_aviso_previo'])
              }
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Guardar Sección
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Modo de Operación ante Infracción de Veda"
                value={configs['veda_modo_operacion'] || 'BLOQUEO_ESTRICTO'}
                onChange={(e) => handleValorChange('veda_modo_operacion', e.target.value)}
                helperText="BLOQUEO_ESTRICTO rechaza con 422; ALERTA_FISCALIZACION guarda, marca EN_VEDA y notifica."
              >
                <MenuItem value="BLOQUEO_ESTRICTO">BLOQUEO_ESTRICTO (HTTP 422 - Rechazo sin persistencia)</MenuItem>
                <MenuItem value="ALERTA_FISCALIZACION">ALERTA_FISCALIZACION (Permite registro con marca de fiscalización)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Días Previos Aviso Inicio de Veda"
                value={configs['veda_dias_aviso_previo'] || '7'}
                onChange={(e) => handleValorChange('veda_dias_aviso_previo', e.target.value)}
                helperText="Días de anticipación para notificar el inicio de una veda en el cron diario."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* SECCIÓN 5: Cadena de Custodia, Variación de Peso y Retención (Indicador 6) */}
      <Card elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocalShippingIcon color="secondary" />
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                Indicador 6: Parámetros Biofísicos y Cadena de Custodia (Trazabilidad Lote)
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<SaveIcon />}
              onClick={() =>
                handleGuardarCategoria([
                  'variacion_peso_umbral_general_pct',
                  'retencion_bodega_activo',
                  'retencion_bodega_dias_amarilla',
                  'retencion_bodega_dias_naranja',
                  'retencion_bodega_dias_roja',
                  'retencion_bodega_estados_sujetos',
                  'bio_perdida_activo',
                  'bio_humedo_dias_minimos_transito',
                  'bio_humedo_merma_minima_pct',
                  'bio_seco_merma_maxima_pct',
                ])
              }
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Guardar Sección
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Parámetros para evaluar discrepancias de peso entre Origen, Comercializador y Planta de Producción, tiempos de permanencia en bodega virtual y reglas de pérdida biológica.
          </Typography>

          <Grid container spacing={3}>
            {/* Tolerancia general */}
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                Tolerancia General de Variación de Peso: {configs['variacion_peso_umbral_general_pct'] || '5.0'}%
              </Typography>
              <Slider
                value={parseFloat(configs['variacion_peso_umbral_general_pct'] || '5.0')}
                onChange={(e, val) => handleValorChange('variacion_peso_umbral_general_pct', val)}
                min={1}
                max={25}
                step={0.5}
                valueLabelDisplay="auto"
                color="secondary"
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Margen tolerable entre pesaje de origen y recepción en planta.
              </Typography>
            </Grid>

            {/* Retención de Bodega */}
            <Grid item xs={12} sm={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Semáforo de Retención en Bodega Virtual:
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configs['retencion_bodega_activo'] === 'true'}
                      onChange={(e) =>
                        handleValorChange('retencion_bodega_activo', e.target.checked ? 'true' : 'false')
                      }
                      color="secondary"
                    />
                  }
                  label={<Typography variant="body2">Control Activo</Typography>}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <TextField
                  type="number"
                  label="Alerta Amarilla (Días)"
                  value={configs['retencion_bodega_dias_amarilla'] || '3'}
                  onChange={(e) => handleValorChange('retencion_bodega_dias_amarilla', e.target.value)}
                  size="small"
                />
                <TextField
                  type="number"
                  label="Alerta Naranja (Días)"
                  value={configs['retencion_bodega_dias_naranja'] || '5'}
                  onChange={(e) => handleValorChange('retencion_bodega_dias_naranja', e.target.value)}
                  size="small"
                />
                <TextField
                  type="number"
                  label="Alerta Roja (Días Máx.)"
                  value={configs['retencion_bodega_dias_roja'] || '7'}
                  onChange={(e) => handleValorChange('retencion_bodega_dias_roja', e.target.value)}
                  size="small"
                />
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Estados de Humedad Sujetos al Control de Bodega"
                value={configs['retencion_bodega_estados_sujetos'] || 'HUMEDO'}
                onChange={(e) => handleValorChange('retencion_bodega_estados_sujetos', e.target.value)}
                helperText="Lista separada por coma (ej. HUMEDO, SEMI-SECO)"
                sx={{ mt: 2 }}
              />
            </Grid>

            {/* Consistencia Biológica */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Reglas de Pérdida y Merma Biológica Consistente:
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configs['bio_perdida_activo'] === 'true'}
                      onChange={(e) =>
                        handleValorChange('bio_perdida_activo', e.target.checked ? 'true' : 'false')
                      }
                      color="secondary"
                    />
                  }
                  label={<Typography variant="body2">Validación Biológica Activa</Typography>}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Días Mínimos Tránsito Húmedo"
                    value={configs['bio_humedo_dias_minimos_transito'] || '3'}
                    onChange={(e) => handleValorChange('bio_humedo_dias_minimos_transito', e.target.value)}
                    helperText="Días desde los cuales se exige evaporación obligatoria."
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ step: '0.5' }}
                    label="Merma Mínima Esperada en Húmedo (%)"
                    value={configs['bio_humedo_merma_minima_pct'] || '5.0'}
                    onChange={(e) => handleValorChange('bio_humedo_merma_minima_pct', e.target.value)}
                    helperText="Si la merma es menor (o hay ganancia), alerta fraude."
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ step: '0.5' }}
                    label="Merma Máxima Tolerable en Seco (%)"
                    value={configs['bio_seco_merma_maxima_pct'] || '3.0'}
                    onChange={(e) => handleValorChange('bio_seco_merma_maxima_pct', e.target.value)}
                    helperText="El alga seca no debe perder peso significativo."
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
