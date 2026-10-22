import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TablePagination,
    Box,
    Paper,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    InboxOutlined as EmptyIcon,
    ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

const DataTable = ({ title, data = [], onRowClick, actions }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Paginación lógica
    const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const hasExtendedTraceability = data.length > 0 && 'plantaAbastecimiento' in data[0];

    // Función auxiliar para colorear chips de especie con tonos pastel elegantes
    const getSpeciesColor = (especie) => {
        const name = (especie || '').toLowerCase();
        if (name.includes('huiro') || name.includes('negro')) {
            return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' }; // Verde suave
        }
        if (name.includes('luga')) {
            return { bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8' }; // Rosa suave
        }
        return { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' }; // Azul suave
    };

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 4,
                border: 1, borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                width: '100%',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    p: { xs: 2, sm: 2.5 },
                    px: { xs: 2.5, sm: 3 },
                    borderBottom: 1, borderColor: 'divider',
                    bgcolor: 'background.default',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
                        {title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>
                        Planilla masiva ({data.length.toLocaleString('es-CL')} {data.length === 1 ? 'registro' : 'registros'})
                    </Typography>
                </Box>
                {actions && (
                    <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        {actions}
                    </Box>
                )}
            </Box>

            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                {isMobile ? (
                    <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row) => {
                                const chipColors = getSpeciesColor(row.especie);
                                return (
                                    <Paper
                                        key={row.id}
                                        elevation={0}
                                        onClick={() => onRowClick && onRowClick(row)}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: (theme) => theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
                                            cursor: onRowClick ? 'pointer' : 'default',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                bgcolor: (theme) => theme.palette.mode === 'light' ? '#f0f9ff' : '#0c4a6e',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                            },
                                            '&:active': {
                                                transform: 'scale(0.99)',
                                            },
                                        }}
                                    >
                                        {/* Cabecera: Folio e ID + Fecha */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'Outfit' }}>
                                                    {row.folio || `ID: ${row.id}`}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem', fontFamily: 'Inter' }}>
                                                    ID: #{row.id}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', fontFamily: 'Inter' }}>
                                                    {row.fecha || '-'}
                                                </Typography>
                                                {row.hora && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontFamily: 'Inter' }}>
                                                        {row.hora}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Emisor y Destinatario */}
                                        <Box sx={{ mb: 1.5, py: 1, px: 1.2, bgcolor: (t) => t.palette.mode === 'light' ? '#f8fafc' : '#0f172a', borderRadius: 2 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem', wordBreak: 'break-word', fontFamily: 'Inter' }}>
                                                {row.emisorNombre || 'Emisor sin nombre'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem', fontFamily: 'Inter' }}>
                                                RUT: {row.emisorRut || 'No informado'}
                                            </Typography>
                                            {row.receptorNombre && (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3, fontSize: '0.72rem', wordBreak: 'break-word', fontFamily: 'Inter' }}>
                                                    Destino: <strong>{row.receptorNombre}</strong>
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* Pie: Especie y Cantidad */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Chip
                                                label={row.especie || 'Sin especie'}
                                                size="small"
                                                sx={{
                                                    fontWeight: 600,
                                                    bgcolor: chipColors.bg,
                                                    color: chipColors.text,
                                                    borderColor: chipColors.border,
                                                    borderWidth: '1px',
                                                    borderStyle: 'solid',
                                                    fontFamily: 'Outfit',
                                                    fontSize: '0.72rem',
                                                    borderRadius: '6px',
                                                }}
                                            />
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'secondary.main', fontFamily: 'Outfit' }}>
                                                    {row.cantidad?.toLocaleString('es-CL')} kg
                                                </Typography>
                                                <ChevronRightIcon sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
                                            </Box>
                                        </Box>
                                    </Paper>
                                );
                            })
                        ) : (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <EmptyIcon sx={{ fontSize: 48, color: 'divider', mb: 1.5 }} />
                                <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600, fontFamily: 'Outfit' }}>
                                    No se encontraron transacciones
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5, fontFamily: 'Inter' }}>
                                    Ajusta los filtros de fecha o tipo de reporte y vuelve a buscar.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 650 }} aria-label="report table" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', borderBottom: 2, borderColor: 'divider', fontFamily: 'Outfit', py: 2 }}>ID/Folio</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', borderBottom: 2, borderColor: 'divider', fontFamily: 'Outfit', py: 2 }}>Fecha de Emisión</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', borderBottom: 2, borderColor: 'divider', fontFamily: 'Outfit', py: 2 }}>Emisor</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', borderBottom: 2, borderColor: 'divider', fontFamily: 'Outfit', py: 2 }}>Comerciante</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', borderBottom: 2, borderColor: 'divider', fontFamily: 'Outfit', py: 2 }}>Especie Declarada</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', borderBottom: 2, borderColor: 'divider', fontFamily: 'Outfit', py: 2 }} align="right">Cantidad (kg)</TableCell>
                                    {hasExtendedTraceability && (
                                        <>
                                            <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', borderBottom: 2, borderColor: 'divider', fontFamily: 'Outfit', py: 2 }}>Planta Abast.</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', borderBottom: 2, borderColor: 'divider', fontFamily: 'Outfit', py: 2 }}>Fecha Comerc.</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', borderBottom: 2, borderColor: 'divider', fontFamily: 'Outfit', py: 2 }}>Planta Prod.</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', borderBottom: 2, borderColor: 'divider', fontFamily: 'Outfit', py: 2 }}>Fecha P. Destino.</TableCell>
                                        </>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => {
                                        const chipColors = getSpeciesColor(row.especie);
                                        return (
                                            <TableRow
                                                key={row.id}
                                                onClick={() => onRowClick && onRowClick(row)}
                                                sx={{
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    '&:hover': { backgroundColor: 'background.default' },
                                                    cursor: onRowClick ? 'pointer' : 'default',
                                                    transition: 'background-color 0.2s ease',
                                                }}
                                            >
                                                <TableCell sx={{ py: 1.8 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontFamily: 'Inter' }}>
                                                        ID: {row.id}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontFamily: 'Inter', fontWeight: 500 }}>
                                                        Folio: {row.folio}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.8 }}>
                                                    <Typography variant="body2" sx={{ color: 'text.primary', fontFamily: 'Inter', fontWeight: 500 }}>{row.fecha}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>{row.hora}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.8 }}>
                                                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontFamily: 'Inter' }}>{row.emisorNombre}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>RUT: {row.emisorRut}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.8 }}>
                                                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontFamily: 'Inter' }}>{row.receptorNombre}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Inter' }}>RUT: {row.receptorRut}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.8 }}>
                                                    <Chip
                                                        label={row.especie}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 600,
                                                            bgcolor: chipColors.bg,
                                                            color: chipColors.text,
                                                            borderColor: chipColors.border,
                                                            borderWidth: '1px',
                                                            borderStyle: 'solid',
                                                            fontFamily: 'Outfit',
                                                            fontSize: '0.75rem',
                                                            borderRadius: '6px',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1.8 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'secondary.main', fontFamily: 'Outfit', fontSize: '0.95rem' }}>
                                                        {row.cantidad?.toLocaleString('es-CL')}
                                                    </Typography>
                                                </TableCell>
                                                {hasExtendedTraceability && (
                                                    <>
                                                        <TableCell sx={{ py: 1.8 }}>
                                                            <Typography variant="body2" sx={{ color: 'text.primary', fontFamily: 'Inter' }}>{row.plantaAbastecimiento || '-'}</Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ py: 1.8 }}>
                                                            <Typography variant="body2" sx={{ color: 'text.primary', fontFamily: 'Inter' }}>{row.fechaComercializador ? new Date(row.fechaComercializador).toLocaleDateString() : '-'}</Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ py: 1.8 }}>
                                                            <Typography variant="body2" sx={{ color: 'text.primary', fontFamily: 'Inter' }}>{row.plantaProduccion || '-'}</Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ py: 1.8 }}>
                                                            <Typography variant="body2" sx={{ color: 'text.primary', fontFamily: 'Inter' }}>{row.fechaPlantaAbastecimiento ? new Date(row.fechaPlantaAbastecimiento).toLocaleDateString() : '-'}</Typography>
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={hasExtendedTraceability ? 10 : 6} align="center" sx={{ py: 8 }}>
                                            <EmptyIcon sx={{ fontSize: 48, color: 'divider', mb: 1.5 }} />
                                            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600, fontFamily: 'Outfit' }}>
                                                No se encontraron transacciones
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5, fontFamily: 'Inter' }}>
                                                Ajusta los filtros de fecha o tipo de reporte y vuelve a buscar.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <TablePagination
                    rowsPerPageOptions={[10, 20, 50]}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    sx={{
                        borderTop: 1, borderColor: 'divider',
                        bgcolor: 'background.default',
                        fontFamily: 'Inter',
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            margin: 0,
                            fontFamily: 'Inter',
                            fontSize: '0.825rem',
                        }
                    }}
                />
            </CardContent>
        </Card>
    );
};

export default DataTable;
