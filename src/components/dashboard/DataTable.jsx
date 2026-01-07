import React from 'react';
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
    Chip
} from '@mui/material';

const rows = [
    { id: 1, name: 'Proyecto Algas A', status: 'Activo', date: '2023-10-01', efficiency: '95%' },
    { id: 2, name: 'Suministro Beta', status: 'Pendiente', date: '2023-10-05', efficiency: '82%' },
    { id: 3, name: 'Control Gamma', status: 'Completado', date: '2023-09-28', efficiency: '100%' },
    { id: 4, name: 'Expansión Delta', status: 'Activo', date: '2023-10-10', efficiency: '78%' },
    { id: 5, name: 'Optimización Zeta', status: 'Error', date: '2023-10-12', efficiency: '45%' },
];

const getStatusColor = (status) => {
    switch (status) {
        case 'Activo': return 'primary';
        case 'Completado': return 'success';
        case 'Pendiente': return 'warning';
        case 'Error': return 'error';
        default: return 'default';
    }
};

const DataTable = ({ title }) => {
    return (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                    {title}
                </Typography>
                <TableContainer sx={{ mt: 2 }}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Nombre</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Fecha</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }} align="right">Eficiencia</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f9f9f9' } }}
                                >
                                    <TableCell component="th" scope="row" fontWeight="medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.status}
                                            color={getStatusColor(row.status)}
                                            size="small"
                                            sx={{ fontWeight: 'bold', borderRadius: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell color="text.secondary">{row.date}</TableCell>
                                    <TableCell align="right" fontWeight="bold">{row.efficiency}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default DataTable;
