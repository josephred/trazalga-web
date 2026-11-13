import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';
import {
  Inventory2 as InventoryIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import { getStockEnPlanta } from '../../services/reportesService';
import exportarCsv from '../../utils/exportarCsv';

export default function ReporteStockPlantaTab() {
  const [data, setData] = useState({ lotes: [], totalLotes: 0, totalKg: 0, resumenPorAcopio: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plantaFiltro, setPlantaFiltro] = useState('');
  const [acopioFiltro, setAcopioFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarStock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getStockEnPlanta(null);
      setData({
        lotes: Array.isArray(resp?.lotes) ? resp.lotes : [],
        totalLotes: resp?.totalLotes || 0,
        totalKg: resp?.totalKg || 0,
        resumenPorAcopio: Array.isArray(resp?.resumenPorAcopio) ? resp.resumenPorAcopio : [],
      });
    } catch (err) {
      console.error('Error cargando stock en planta:', err);
      setError('No se pudo cargar el reporte de stock en planta.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarStock();
  }, [cargarStock]);

  const plantasDisponibles = useMemo(() => {
    const map = new Map();
    for (const l of data.lotes) {
      if (l.plantaId != null && !map.has(l.plantaId)) {
        map.set(l.plantaId, l.plantaNombre || `Planta #${l.plantaId}`);
      }
    }
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [data.lotes]);

  const lotesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return data.lotes.filter((l) => {
      if (plantaFiltro && String(l.plantaId) !== String(plantaFiltro)) return false;
      if (acopioFiltro) {
        const acopioActual = l.lugarAcopio || 'Sin especificar';
        if (acopioActual !== acopioFiltro) return false;
      }
      if (!q) return true;
      return (
        (l.loteInterno || '').toLowerCase().includes(q) ||
        (l.folioDeclaracionapla || '').toLowerCase().includes(q) ||
        (l.folioOrigen || '').toLowerCase().includes(q) ||
        (l.lugarAcopio || '').toLowerCase().includes(q) ||
        (l.especieNombre || '').toLowerCase().includes(q) ||
        (l.plantaNombre || '').toLowerCase().includes(q)
      );
    });
  }, [data.lotes, plantaFiltro, acopioFiltro, busqueda]);

  const kgFiltrados = useMemo(
    () => lotesFiltrados.reduce((acc, l) => acc + (Number(l.kgDisponibles) || 0), 0),
    [lotesFiltrados]
  );

  const handleDescargarCsv = () => {
    if (!lotesFiltrados.length) return;
    const headers = [
      'Lote Interno',
      'Folio A-PLA',
      'Folio Origen',
      'Planta',
      'RUT Planta',
      'Lugar de Acopio',
      'Fecha Ingreso',
      'Especie',
      'Humedad',
      'Peso Romana (kg)',
      'Cantidad Declarada (kg)',
      'Stock Disponible (kg)',
    ];
    const rows = lotesFiltrados.map((l) => [
      l.loteInterno || '',
      l.folioDeclaracionapla || '',
      l.folioOrigen || '',
      l.plantaNombre || '',
      l.plantaRut || '',
      l.lugarAcopio || 'Sin especificar',
      l.fechaIngresoPlanta ? new Date(l.fechaIngresoPlanta).toLocaleDateString('es-CL') : '',
      l.especieNombre || '',
      l.humedadNombre || '',
      l.pesoRomanaKg ?? '',
      l.cantidad ?? '',
      l.kgDisponibles ?? 0,
    ]);
    const fechaStr = new Date().toISOString().slice(0, 10);
    exportarCsv({
      filename: `stock_en_planta_${fechaStr}.csv`,
      headers,
      rows,
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              LOTES EN STOCK DISPONIBLE
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', mt: 0.5 }}>
              {lotesFiltrados.length.toLocaleString('es-CL')}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              BIOMASA DISPONIBLE EN PLANTA
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'primary.main', mt: 0.5 }}>
              {Math.round(kgFiltrados).toLocaleString('es-CL')} kg
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              LUGARES DE ACOPIO ACTIVOS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', mt: 0.5 }}>
              {data.resumenPorAcopio.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {data.resumenPorAcopio.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <WarehouseIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 700, mr: 1 }}>
              Stock por acopio:
            </Typography>
            <Chip
              label="Todos"
              size="small"
              clickable
              color={!acopioFiltro ? 'primary' : 'default'}
              onClick={() => setAcopioFiltro('')}
            />
            {data.resumenPorAcopio.map((g) => (
              <Chip
                key={g.lugarAcopio}
                label={`${g.lugarAcopio} · ${g.lotes} lote(s) · ${Number(g.totalKg || 0).toLocaleString('es-CL')} kg`}
                size="small"
                clickable
                color={acopioFiltro === g.lugarAcopio ? 'primary' : 'default'}
                variant={acopioFiltro === g.lugarAcopio ? 'filled' : 'outlined'}
                onClick={() => setAcopioFiltro(acopioFiltro === g.lugarAcopio ? '' : g.lugarAcopio)}
              />
            ))}
          </Stack>
        </Paper>
      )}

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Planta"
              value={plantaFiltro}
              onChange={(e) => setPlantaFiltro(e.target.value)}
            >
              <MenuItem value="">Todas las plantas</MenuItem>
              {plantasDisponibles.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar lote, folio, acopio o especie"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', gap: 1, justifyContent: { sm: 'flex-end' } }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={cargarStock}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDescargarCsv}
              disabled={!lotesFiltrados.length || loading}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : lotesFiltrados.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <InventoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            Sin lotes pendientes de proceso o despacho
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Las recepciones consumidas en Producción o Destino o marcadas como ANULADA no figuran en stock.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700 }}>Lote Interno</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Folio A-PLA</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Planta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lugar de Acopio</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ingreso</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Especie</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Humedad</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Stock (kg)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lotesFiltrados.map((l) => (
                <TableRow key={l.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main' }}>
                    {l.loteInterno || '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {l.folioDeclaracionapla || l.folioOrigen || `#${l.id}`}
                  </TableCell>
                  <TableCell>{l.plantaNombre || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={l.lugarAcopio || 'Sin especificar'}
                      size="small"
                      color={l.lugarAcopio ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {l.fechaIngresoPlanta ? new Date(l.fechaIngresoPlanta).toLocaleDateString('es-CL') : '—'}
                  </TableCell>
                  <TableCell>{l.especieNombre || '—'}</TableCell>
                  <TableCell>{l.humedadNombre || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {Number(l.kgDisponibles || 0).toLocaleString('es-CL')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
