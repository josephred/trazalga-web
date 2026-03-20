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
    Paper,
    Chip,
    TablePagination
} from '@mui/material';

const DataTable = ({ title, data = [] }) => {
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

    return (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                    {title}
                </Typography>
                <TableContainer sx={{ mt: 2 }}>
                    <Table sx={{ minWidth: 650 }} aria-label="report table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ID/Folio</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Fecha</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Emisor</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Receptor</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Especie</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }} align="right">Cantidad</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f9f9f9' } }}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                ID: {row.id}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {row.folio}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{row.fecha}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.hora}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{row.emisorNombre}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.emisorRut}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{row.receptorNombre}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.receptorRut}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={row.especie} size="small" variant="outlined" sx={{ fontWeight: 'medium' }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="bold">
                                                {row.cantidad?.toLocaleString('es-CL')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No se encontraron registros para los filtros seleccionados.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 50]}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Registros por página:"
                    sx={{
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            margin: 0
                        }
                    }}
                />
            </CardContent>
        </Card>
    );
};

export default DataTable;
