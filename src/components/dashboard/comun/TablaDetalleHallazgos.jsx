import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { exportarCsv } from '../../../utils/exportarCsv';
import { useDetallePaginado } from '../../../hooks/useDetallePaginado';

/**
 * Componente unificado de tabla de detalle para hallazgos y widgets (TA.4).
 * Soporta paginación remota o datos locales, exportación a CSV con BOM y punto y coma,
 * chips de filtro rápido, diseño adaptativo para pantallas pequeñas (360px con folio fijo)
 * y navegación a fichas de trazabilidad.
 */
export default function TablaDetalleHallazgos({
  titulo,
  subtitulo,
  columnas = [],
  filtrosChip = [],
  fetcher,
  data: propData,
  total: propTotal,
  loading: propLoading,
  exportarNombre = 'detalle_hallazgos',
  onFilaClick,
  vacio = 'No hay registros que coincidan con los criterios seleccionados.',
  maxHeight = 360,
  paginacion = true,
  filtroComponent = null,
  initialPageSize = 20
}) {
  const navigate = useNavigate();

  // Si no se pasa propData, se utiliza el hook con el fetcher
  const hookResult = useDetallePaginado({
    fetcher: propData ? null : fetcher,
    staticData: propData || null,
    initialPageSize
  });

  const [localPage, setLocalPage] = useState(0);
  const [localPageSize, setLocalPageSize] = useState(initialPageSize);

  const esModoRemoto = !propData && Boolean(fetcher);

  const rows = esModoRemoto ? hookResult.data : (propData || []);
  const totalRows = esModoRemoto ? hookResult.total : (propTotal ?? (propData?.length || 0));
  const isLoading = propLoading !== undefined ? propLoading : hookResult.loading;
  const errorMsg = hookResult.error;

  // En modo cliente con paginación local
  const paginatedRows = useMemo(() => {
    if (esModoRemoto || !paginacion) {
      return rows;
    }
    const start = localPage * localPageSize;
    return rows.slice(start, start + localPageSize);
  }, [rows, esModoRemoto, paginacion, localPage, localPageSize]);

  const handleChangePage = (event, newPage) => {
    if (esModoRemoto) {
      hookResult.setPage(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newSize = parseInt(event.target.value, 10);
    if (esModoRemoto) {
      hookResult.setPageSize(newSize);
      hookResult.setPage(0);
    } else {
      setLocalPageSize(newSize);
      setLocalPage(0);
    }
  };

  const handleRowClick = (row) => {
    if (onFilaClick) {
      onFilaClick(row);
      return;
    }

    // Navegación por defecto a la ficha de consulta si existen tipo e id
    const tipo = row.declaracionTipo || row.tipo;
    const id = row.declaracionId || row.id;
    if (tipo && id) {
      navigate(`/consultas/${tipo.toLowerCase()}/${id}`);
    }
  };

  const handleExportCsv = () => {
    if (!rows || rows.length === 0) return;

    const visibleHeaders = columnas.map((c) => c.label);
    const extraHeaders = ['Criterio Parámetro', 'Criterio Umbral', 'Criterio Valor', 'Criterio Unidad', 'Criterio Detalle'];
    const allHeaders = [...visibleHeaders, ...extraHeaders];

    const csvRows = rows.map((row) => {
      const visibleData = columnas.map((col) => {
        const val = row[col.id];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      });

      const extraData = [
        row.criterioParametro || '',
        row.criterioUmbral || '',
        row.criterioValor || '',
        row.criterioUnidad || '',
        row.criterioTexto || row.detalle || ''
      ];

      return [...visibleData, ...extraData];
    });

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    exportarCsv({
      filename: `${exportarNombre}_${timestamp}.csv`,
      headers: allHeaders,
      rows: csvRows
    });
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Barra de cabecera, filtros rápidos y exportación */}
      {(titulo || filtrosChip?.length > 0 || filtroComponent || Boolean(exportarNombre)) && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            mb: 1.5
          }}
        >
          {/* Título y subtítulo */}
          {titulo && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                {titulo}
              </Typography>
              {subtitulo && (
                <Typography variant="caption" sx={{ fontFamily: 'Inter', color: 'text.secondary' }}>
                  {subtitulo}
                </Typography>
              )}
            </Box>
          )}

          {/* Chips de filtro rápido */}
          {filtrosChip && filtrosChip.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
              {filtrosChip.map((chip, idx) => (
                <Chip
                  key={chip.id || idx}
                  size="small"
                  clickable={Boolean(chip.onClick)}
                  label={chip.label}
                  color={chip.color || (chip.activo ? 'primary' : 'default')}
                  variant={chip.variant || (chip.activo ? 'filled' : 'outlined')}
                  icon={chip.icon}
                  onClick={chip.onClick}
                  sx={{
                    fontSize: '0.68rem',
                    height: 24,
                    fontWeight: chip.activo ? 700 : 500,
                    ...chip.sx
                  }}
                />
              ))}
            </Box>
          )}

          {/* Componente de filtro custom */}
          {filtroComponent}

          {/* Botones de acción (Refrescar y Exportar CSV) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
            {esModoRemoto && (
              <Tooltip title="Actualizar datos">
                <IconButton size="small" onClick={hookResult.refetch} disabled={isLoading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Exportar a planilla Excel (CSV con UTF-8 y ;) ">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileDownloadIcon fontSize="small" />}
                  onClick={handleExportCsv}
                  disabled={rows.length === 0 || isLoading}
                  sx={{
                    fontSize: '0.75rem',
                    fontFamily: 'Inter',
                    textTransform: 'none',
                    py: 0.25,
                    px: 1.25,
                    borderRadius: 2
                  }}
                >
                  Exportar CSV
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Alerta de error si ocurre */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem' }}>
          {errorMsg}
        </Alert>
      )}

      {/* Contenedor de la tabla con scroll horizontal propio y columna fija */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          maxHeight: maxHeight,
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          // Garantiza que en pantallas estrechas (360px) la columna 1 quede fija
          '& th:first-of-type, & td:first-of-type': {
            position: 'sticky',
            left: 0,
            zIndex: 2,
            bgcolor: 'background.paper',
            boxShadow: (t) => `2px 0 4px -1px ${t.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)'}`,
          },
          '& thead th:first-of-type': {
            zIndex: 3,
            bgcolor: 'background.default',
            boxShadow: (t) => `2px 0 4px -1px ${t.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)'}`,
          }
        }}
      >
        <Table size="small" stickyHeader sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              {columnas.map((col, idx) => (
                <TableCell
                  key={col.id || idx}
                  align={col.align || 'left'}
                  sx={{
                    fontWeight: 700,
                    fontFamily: 'Outfit',
                    fontSize: '0.8rem',
                    bgcolor: 'background.default',
                    whiteSpace: 'nowrap',
                    ...(col.width ? { width: col.width } : {})
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columnas.length} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={26} sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontSize: '0.75rem' }}>
                    Cargando información...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnas.length}
                  align="center"
                  sx={{ py: 3, color: 'text.secondary', fontFamily: 'Inter', fontSize: '0.82rem' }}
                >
                  {typeof vacio === 'string' ? vacio : vacio}
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, rowIdx) => (
                <TableRow
                  key={row.id || rowIdx}
                  hover
                  onClick={() => handleRowClick(row)}
                  sx={{
                    cursor: onFilaClick || row.declaracionId ? 'pointer' : 'default',
                    ...(row.rowSx ? row.rowSx : {})
                  }}
                >
                  {columnas.map((col, colIdx) => (
                    <TableCell
                      key={col.id || colIdx}
                      align={col.align || 'left'}
                      sx={{
                        fontSize: '0.8rem',
                        fontFamily: col.mono ? 'monospace' : 'Inter',
                        fontWeight: col.mono ? 700 : 400,
                        whiteSpace: col.wrap ? 'normal' : 'nowrap',
                        ...(col.cellSx ? col.cellSx(row) : {})
                      }}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      {paginacion && totalRows > 0 && (
        <TablePagination
          component="div"
          count={totalRows}
          page={esModoRemoto ? hookResult.page : localPage}
          onPageChange={handleChangePage}
          rowsPerPage={esModoRemoto ? hookResult.pageSize : localPageSize}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
          sx={{
            '.MuiTablePagination-toolbar': { minHeight: 36, px: 1 },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.72rem', fontFamily: 'Inter' }
          }}
        />
      )}
    </Box>
  );
}
