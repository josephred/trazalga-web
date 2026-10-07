// src/pages/Consultas.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FindInPage as FindIcon,
  QrCodeScanner as QrIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import api from '../api/axiosConfig';
import ResultadosBusqueda from '../components/consultas/ResultadosBusqueda';
import FichaTrazabilidad from '../components/consultas/FichaTrazabilidad';

export default function Consultas() {
  const { tipo, id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados de vista
  const [resultados, setResultados] = useState(null);
  const [fichaActual, setFichaActual] = useState(null);
  const [busquedaEjecutada, setBusquedaEjecutada] = useState(false);

  const inputRef = useRef(null);

  // Al montar la página, dar foco automático al campo de búsqueda
  useEffect(() => {
    if (!tipo && !id && inputRef.current) {
      inputRef.current.focus();
    }
  }, [tipo, id]);

  // Si la ruta trae parámetros directos (/consultas/:tipo/:id), cargar la ficha de inmediato
  useEffect(() => {
    if (tipo && id) {
      cargarFichaDirecta(tipo, id);
    } else if (searchParams.get('q')) {
      ejecutarBusqueda(searchParams.get('q'));
    }
  }, [tipo, id]);

  const cargarFichaDirecta = async (t, declId) => {
    setLoading(true);
    setError(null);
    setResultados(null);
    try {
      const res = await api.get(`/consultas/ficha/${t}/${declId}`);
      setFichaActual(res.data);
    } catch (err) {
      console.error('Error al cargar ficha de trazabilidad:', err);
      setError(
        err.response?.status === 404
          ? `No se encontró la declaración ${t} #${declId}`
          : 'Ocurrió un error al cargar la ficha de trazabilidad.'
      );
      setFichaActual(null);
    } finally {
      setLoading(false);
    }
  };

  const ejecutarBusqueda = async (textoABuscar) => {
    const qTerm = (textoABuscar !== undefined ? textoABuscar : query).trim();
    if (!qTerm) return;

    setLoading(true);
    setError(null);
    setFichaActual(null);
    setBusquedaEjecutada(true);

    try {
      const res = await api.get('/consultas/folio', { params: { q: qTerm } });
      const data = res.data || [];

      if (data.length === 1) {
        // Coincidencia única: cargar ficha directamente
        const match = data[0];
        await cargarFichaDirecta(match.tipo, match.id);
        navigate(`/consultas/${match.tipo}/${match.id}`, { replace: false });
      } else {
        // Cero o múltiples coincidencias: mostrar lista
        setResultados(data);
        setFichaActual(null);
      }
    } catch (err) {
      console.error('Error al ejecutar búsqueda por folio:', err);
      setError(
        err.response?.data?.message ||
        'Error al realizar la búsqueda. Por favor intente nuevamente.'
      );
      setResultados(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ejecutarBusqueda();
    }
  };

  const handleSeleccionarResultado = (r) => {
    navigate(`/consultas/${r.tipo}/${r.id}`);
  };

  const handleVolverAlBuscador = () => {
    setFichaActual(null);
    setResultados(null);
    setBusquedaEjecutada(false);
    navigate('/consultas', { replace: false });
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  const handleLimpiar = () => {
    setQuery('');
    setResultados(null);
    setFichaActual(null);
    setBusquedaEjecutada(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        p: { xs: 1.5, sm: 3 },
        boxSizing: 'border-box',
      }}
    >
      {/* Si hay una ficha cargada, renderizarla */}
      {fichaActual ? (
        <FichaTrazabilidad ficha={fichaActual} onVolver={handleVolverAlBuscador} />
      ) : (
        <Box sx={{ maxWidth: 850, mx: 'auto', mt: { xs: 2, sm: 4 } }}>
          {/* Cabecera del Buscador */}
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1 }}>
              <FindIcon sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, color: 'primary.main' }} />
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.2rem' } }}>
                Búsqueda de Trazabilidad
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ color: 'text.secondary', px: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Ingresa un folio de recolección, bote o comercializador, patente de camión o número de guía de despacho.
            </Typography>
          </Box>

          {/* Caja Principal del Buscador */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
              bgcolor: 'background.paper',
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              placeholder="Ej: DA-9090, 4455, ABCD12, DAPLA-3001..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              variant="outlined"
              autoComplete="off"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.5rem' }} />
                  </InputAdornment>
                ),
                endAdornment: query ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleLimpiar} edge="end">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: {
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  borderRadius: 2.5,
                  bgcolor: (t) => t.palette.mode === 'light' ? '#f8fafc' : '#0f172a',
                },
              }}
            />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 2 }}
            >
              {/* Sugerencias Rápidas para Terreno */}
              <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Buscar por:
                </Typography>
                <Chip
                  label="Folio DA"
                  size="small"
                  onClick={() => { setQuery('DA'); inputRef.current?.focus(); }}
                  sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                />
                <Chip
                  label="Guía despacho"
                  size="small"
                  onClick={() => { setQuery('4455'); inputRef.current?.focus(); }}
                  sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                />
                <Chip
                  label="Patente camión"
                  size="small"
                  onClick={() => { setQuery('ABCD12'); inputRef.current?.focus(); }}
                  sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                />
              </Stack>

              <Button
                variant="contained"
                size="large"
                onClick={() => ejecutarBusqueda()}
                disabled={loading || !query.trim()}
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  fontSize: '1rem',
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Buscar'}
              </Button>
            </Stack>
          </Paper>

          {/* Estado de Carga */}
          {loading && (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <CircularProgress size={40} thickness={4} />
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>
                Buscando declaraciones en la cadena de custodia...
              </Typography>
            </Box>
          )}

          {/* Errores */}
          {error && !loading && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Lista de Resultados Múltiples */}
          {!loading && resultados && resultados.length > 1 && (
            <ResultadosBusqueda
              resultados={resultados}
              onSelect={handleSeleccionarResultado}
              termino={query}
            />
          )}

          {/* Cero Resultados */}
          {!loading && busquedaEjecutada && resultados && resultados.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mt: 3,
                textAlign: 'center',
                borderRadius: 3,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: (t) => t.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                No se encontraron resultados para «{query}»
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 500, mx: 'auto' }}>
                Verifica que el número de folio, patente o guía esté escrito correctamente. Si es un código numérico, el sistema busca automáticamente con prefijos oficiales (RO, DA, AC, DAPLA, AMERB).
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}
