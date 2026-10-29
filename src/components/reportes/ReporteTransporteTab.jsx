// src/components/reportes/ReporteTransporteTab.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  WarningAmber as WarningIcon,
  LocalShipping as TruckIcon,
  Info as InfoIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';
import exportarCsv from '../../utils/exportarCsv';

export default function ReporteTransporteTab({ dateRange: propDateRange }) {
  const outletCtx = useOutletContext?.() || {};
  const dateRange = propDateRange || outletCtx.dateRange || null;

  const [patente, setPatente] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [relaciones, setRelaciones] = useState([]);
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    cargarReporte();
  }, [dateRange?.startDate, dateRange?.endDate]);

  const cargarReporte = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reportes/transporte/relaciones', {
        params: {
          desde: dateRange?.startDate || undefined,
          hasta: dateRange?.endDate || undefined,
          patente: patente.trim() || undefined,
        },
      });
      setRelaciones(res.data?.filas || []);
      setAvisos(res.data?.avisos || []);
    } catch (err) {
      console.error('Error cargando reporte de transporte:', err);
      setError('Error al obtener reporte de relaciones de transporte.');
      setRelaciones([]);
      setAvisos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarCsv = () => {
    if (!relaciones || relaciones.length === 0) return;

    const headers = [
      'Transportista',
      'RUT Transportista',
      'Patente',
      'Tipo Vehículo',
      'Comercializador',
      'RUT Comercializador',
      'Viajes',
      'Kilos Declarados',
      'Plantas Destino',
      'Primera Fecha',
      'Última Fecha',
    ];

    const rows = relaciones.map((r) => [
      r.transportistaNombre || '',
      r.transportistaRut || '',
      r.vehiculoPatente || '',
      r.tipoVehiculo || '',
      r.comercializadorNombre || '',
      r.comercializadorRut || '',
      r.viajes || 0,
      r.kilos || 0,
      (r.plantasDestino || []).join('; '),
      r.primeraFecha ? new Date(r.primeraFecha).toLocaleDateString('es-CL') : '',
      r.ultimaFecha ? new Date(r.ultimaFecha).toLocaleDateString('es-CL') : '',
    ]);

    const fechaStr = new Date().toISOString().slice(0, 10);
    exportarCsv({
      filename: `reporte_relaciones_transporte_${fechaStr}.csv`,
      headers,
      rows,
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Filtros */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {dateRange?.startDate && dateRange?.endDate && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Chip
                icon={<CalendarIcon sx={{ fontSize: '1rem !important' }} />}
                label={`Período: ${dateRange.startDate} al ${dateRange.endDate}`}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  fontFamily: 'Inter',
                  fontSize: '0.8rem',
                  py: 2,
                  px: 1,
                  width: '100%',
                  justifyContent: 'flex-start',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(14, 165, 233, 0.12)' : '#f0f9ff',
                  color: 'primary.main',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(14, 165, 233, 0.3)' : '#bae6fd',
                }}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: dateRange?.startDate ? 5 : 9 }}>
            <TextField
              fullWidth
              size="small"
              label="Filtrar por Patente"
              placeholder="Ej: ABCD12"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  cargarReporte();
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={cargarReporte}
              disabled={loading}
              sx={{ fontWeight: 700, py: 1 }}
            >
              Consultar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Avisos Informativos (no crean hallazgos) */}
      {avisos.length > 0 && (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {avisos.map((av, i) => (
            <Alert
              key={i}
              severity="info"
              icon={<InfoIcon />}
              sx={{ borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {av.titulo} ({av.entidadReferencia})
              </Typography>
              <Typography variant="body2">{av.detalle}</Typography>
            </Alert>
          ))}
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabla de Relaciones */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Consultando relaciones de transporte...
          </Typography>
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Relaciones Transportista × Vehículo × Comercializador ({relaciones.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDescargarCsv}
              disabled={relaciones.length === 0}
              sx={{ fontWeight: 700 }}
            >
              Descargar CSV
            </Button>
          </Box>

          <TableContainer sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Transportista / Chofer</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Vehículo / Patente</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Comercializador</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Viajes</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Kilos</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Plantas Destino</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Última Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {relaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No se registraron relaciones de transporte en el período consultado.
                    </TableCell>
                  </TableRow>
                ) : (
                  relaciones.map((r, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {r.transportistaNombre}
                        </Typography>
                        {r.transportistaRut && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {r.transportistaRut}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={r.vehiculoPatente}
                          size="small"
                          sx={{ fontFamily: 'monospace', fontWeight: 800 }}
                        />
                        {r.tipoVehiculo && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                            {r.tipoVehiculo}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {r.comercializadorNombre}
                        </Typography>
                        {r.comercializadorRut && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {r.comercializadorRut}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {r.viajes}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {Number(r.kilos).toLocaleString('es-CL')} kg
                      </TableCell>
                      <TableCell>
                        {(r.plantasDestino || []).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        {r.ultimaFecha ? new Date(r.ultimaFecha).toLocaleDateString('es-CL') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
