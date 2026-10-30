import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Grass as GrassIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getSubreporteHuiroPalo } from '../../services/reportesService';

const COLOR_CAPTURA = '#0ea5e9';
const COLOR_SUBREPORTE = '#d97706';

const kg = (v, dec = 0) =>
  (Number(v) || 0).toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const pct = (v) => (Number(v) || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 });

const minus = (s) => (s ? String(s).toLowerCase() : '');

const parseDates = (dateRange) => {
  const filters = {};
  if (!dateRange) return filters;
  const fmt = (d) => (d && typeof d.format === 'function' ? d.format('YYYY-MM-DD') : d);
  if (Array.isArray(dateRange)) {
    if (dateRange[0]) filters.startDate = fmt(dateRange[0]);
    if (dateRange[1]) filters.endDate = fmt(dateRange[1]);
  } else {
    if (dateRange.startDate) filters.startDate = dateRange.startDate;
    if (dateRange.endDate) filters.endDate = dateRange.endDate;
  }
  return filters;
};

/** Texto de la fórmula vigente: «captura sin fronda × 22 %» o «× 22/78 (28,2 %)». */
export const textoFormula = (data) => {
  if (!data) return '';
  const p = Number(data.factorPct) || 0;
  if (data.formula === 'SOBRE_TOTAL') {
    return `Captura sin fronda × ${pct(p)}/${pct(100 - p)} (${pct((data.multiplicador || 0) * 100)} %): la fronda es el ${pct(p)} % del total`;
  }
  return `Captura sin fronda × ${pct(p)} %`;
};

function Kpi({ titulo, valor, destacado, color, nota }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        height: '100%',
        border: 1,
        borderColor: destacado ? color : 'divider',
        bgcolor: (t) =>
          destacado ? 'rgba(217, 119, 6, 0.07)' : t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50',
      }}
    >
      <Typography variant="caption" sx={{ color: destacado ? color : 'text.secondary', fontWeight: 700, display: 'block' }}>
        {titulo}
      </Typography>
      <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: destacado ? color : 'text.primary', mt: 0.5 }}>
        {valor} <span style={{ fontSize: '0.85rem' }}>kg</span>
      </Typography>
      {nota && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
          {nota}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Refinamiento 23-10 · punto 3: Subreporte Huiro Palo.
 * Estima la fronda no declarada cuando el huiro palo barreteado se declara «sin fronda».
 */
export default function SubreporteHuiroPaloWidget({ dateRange }) {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState('comuna');

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getSubreporteHuiroPalo(parseDates(dateRange));
        if (vigente) setData(res);
      } catch (e) {
        console.error('Error cargando el Subreporte Huiro Palo:', e);
        if (vigente) setError(e?.response?.data?.message || 'No se pudo cargar el Subreporte Huiro Palo.');
      } finally {
        if (vigente) setLoading(false);
      }
    };
    cargar();
    return () => {
      vigente = false;
    };
  }, [dateRange]);

  const operativo = data?.activo && data?.configuracionValida;
  const grupos = (vista === 'mes' ? data?.porMes : vista === 'perfil' ? data?.porPerfil : data?.porComuna) || [];
  const chartData = grupos.slice(0, 10).map((g) => ({
    name: g.etiqueta,
    captura: g.capturaSinFrondaKg,
    subreporte: g.subreporteKg,
  }));
  const etiquetaVista = vista === 'mes' ? 'Mes' : vista === 'perfil' ? 'Declarante' : 'Comuna';
  const descripcion = data
    ? `${minus(data.especie)} ${minus(data.metodo)} declarado ${minus(data.composicion)}`
    : 'huiro palo barreteado declarado sin fronda';

  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 4,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        p: { xs: 2, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
      }}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Cabecera */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 3,
              bgcolor: 'rgba(217, 119, 6, 0.12)',
              color: COLOR_SUBREPORTE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GrassIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              Subreporte Huiro Palo
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
              Fronda no declarada en el {descripcion} (IFOP: {pct(data?.factorPct ?? 22)} % de la captura biológica)
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: 220 }}>
            <CircularProgress size={36} sx={{ color: COLOR_SUBREPORTE }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
        ) : !operativo ? (
          <Alert severity="warning" sx={{ borderRadius: 3 }}>
            {data?.mensaje || 'El Subreporte Huiro Palo no está disponible.'}
          </Alert>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Kpi
                  titulo="Captura declarada sin fronda"
                  valor={kg(data.capturaSinFrondaKg)}
                  nota={`${kg(data.declaraciones)} ${data.declaraciones === 1 ? 'declaración' : 'declaraciones'}`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Kpi
                  titulo="Fronda no declarada (estimada)"
                  valor={kg(data.subreporteKg)}
                  destacado
                  color={COLOR_SUBREPORTE}
                  nota={textoFormula(data)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Kpi
                  titulo="Captura biológica total estimada"
                  valor={kg(data.capturaEstimadaKg)}
                  nota="Sin fronda + fronda no declarada"
                />
              </Grid>
            </Grid>

            {data.declaracionesSinComposicion > 0 && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
                {kg(data.declaracionesSinComposicion)}{' '}
                {data.declaracionesSinComposicion === 1 ? 'declaración' : 'declaraciones'} de {minus(data.especie)}{' '}
                {minus(data.metodo)} sin composición informada ({kg(data.capturaSinComposicionKg)} kg) no{' '}
                {data.declaracionesSinComposicion === 1 ? 'entra' : 'entran'} en el cálculo.
              </Alert>
            )}

            {data.declaraciones === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                {data.mensaje || 'No hay declaraciones en el rango.'}
              </Typography>
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                    Captura sin fronda y fronda no declarada por {etiquetaVista.toLowerCase()}
                  </Typography>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={vista}
                    onChange={(_, v) => v && setVista(v)}
                    aria-label="Agrupar por"
                  >
                    <ToggleButton value="comuna" sx={{ textTransform: 'none', px: 1.5 }}>Comuna</ToggleButton>
                    <ToggleButton value="mes" sx={{ textTransform: 'none', px: 1.5 }}>Mes</ToggleButton>
                    <ToggleButton value="perfil" sx={{ textTransform: 'none', px: 1.5 }}>Declarante</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box sx={{ width: '100%', height: 220, mb: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} interval={0} />
                      <YAxis
                        stroke={theme.palette.text.secondary}
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} t` : `${v}`)}
                      />
                      <Tooltip
                        formatter={(v, name) => [`${kg(v, 2)} kg`, name === 'captura' ? 'Captura sin fronda' : 'Fronda no declarada']}
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          borderRadius: 12,
                          border: `1px solid ${theme.palette.divider}`,
                          fontFamily: 'Inter',
                          fontSize: '0.85rem',
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ fontSize: '0.75rem', fontFamily: 'Inter' }}
                        formatter={(v) => (v === 'captura' ? 'Captura sin fronda' : 'Fronda no declarada')}
                      />
                      <Bar dataKey="captura" stackId="t" fill={COLOR_CAPTURA} />
                      <Bar dataKey="subreporte" stackId="t" fill={COLOR_SUBREPORTE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, maxHeight: 240 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>{etiquetaVista}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit', display: { xs: 'none', sm: 'table-cell' } }} align="right">
                          Declaraciones
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Sin fronda (kg)</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }} align="right">Fronda no decl. (kg)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grupos.map((g) => (
                        <TableRow key={g.clave} hover>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 600 }}>{g.etiqueta}</TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', display: { xs: 'none', sm: 'table-cell' } }} align="right">
                            {kg(g.declaraciones)}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem' }} align="right">{kg(g.capturaSinFrondaKg, 2)}</TableCell>
                          <TableCell sx={{ fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 700, color: COLOR_SUBREPORTE }} align="right">
                            {kg(g.subreporteKg, 2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, pr: 4 }}>
              <Chip size="small" variant="outlined" label={`Fecha: ${data.criterioFecha === 'DECLARACION' ? 'declaración' : 'extracción'}`} />
              {data.declaracionesOtraComposicion > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Otra composición (no aplica): ${kg(data.declaracionesOtraComposicion)} decl. · ${kg(data.capturaOtraComposicionKg)} kg`}
                />
              )}
              <Chip size="small" variant="outlined" label="Estimación informativa: no descuenta cuotas" />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
