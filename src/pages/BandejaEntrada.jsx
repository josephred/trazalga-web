import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

export default function BandejaEntrada() {
    const [declaraciones, setDeclaraciones] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // El ID 9583 es el ejemplo que usamos antes
                const res = await api.get('/bandeja-entrada/destinatario/9583');
                setDeclaraciones(res.data);
            } catch (error) {
                console.error("Error cargando bandeja", error);
            }
        };
        cargarDatos();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <Typography variant="h4" gutterBottom>Declaraciones Recibidas (Trazabilidad)</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow style={{ backgroundColor: '#eee' }}>
                            <TableCell>Folio</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Origen (Quién envía)</TableCell>
                            <TableCell>Especie</TableCell>
                            <TableCell>Cantidad (Kg)</TableCell>
                            <TableCell>Fecha</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {declaraciones.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{row.folioPrincipal}</TableCell>
                                <TableCell>{row.tipoDeclaracion}</TableCell>
                                <TableCell>{row.nombreOriginador} ({row.perfilOriginador})</TableCell>
                                <TableCell>{row.nombreEspecie}</TableCell>
                                <TableCell>{row.cantidad}</TableCell>
                                <TableCell>{new Date(row.fechaDeclaracion).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}