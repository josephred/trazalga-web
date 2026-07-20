import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import api from '../../api/axiosConfig';

export default function CasosAbiertosWidget({ dateRange }) {
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const fetchCasos = async () => {
      try {
        setLoading(true);
        let queryParams = '';
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          queryParams = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        }
        
        const response = await api.get(`/reportes/casos-abiertos${queryParams}`);
        setDetalle(response.data);
      } catch (err) {
        console.error('Error fetching casos abiertos:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCasos();
  }, [dateRange]);

  const casosAbiertos = detalle.filter(c => c.estado === 'NEGOCIACION' || c.estado === 'RECHAZADA');
  const hasCasos = casosAbiertos.length > 0;

  if (loading) {
    return (
      <Card 
        elevation={0}
        sx={{ 
          height: '100%', 
          borderRadius: 4, 
          border: 1, borderColor: 'divider',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 250 
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4, 
        border: '1px solid',
        borderColor: hasCasos ? '#d8b4fe' : 'divider', // purple border if cases exist
        background: hasCasos 
          ? (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(180deg, #3b0764 0%, #1e293b 100%)' : 'linear-gradient(180deg, #faf5ff 0%, #ffffff 100%)'
          : 'background.paper',
        boxShadow: hasCasos 
          ? '0 10px 15px -3px rgba(168, 85, 247, 0.04)' 
          : '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: hasCasos
            ? '0 12px 25px -3px rgba(168, 85, 247, 0.08)'
            : '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
          borderColor: hasCasos ? '#a855f7' : 'divider',
        }
      }}
    >
      {hasCasos && (
        <Box 
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            bgcolor: '#a855f7' // purple indicator
          }}
        />
      )}

      <CardContent sx={{ p: 3, pl: hasCasos ? 4 : 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <ReportProblemIcon sx={{ mr: 1, color: hasCasos ? '#a855f7' : 'text.disabled' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary' }}>
            Casos de Rechazo / Negociación
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'Inter', lineHeight: 1.6 }}>
          Declaraciones rechazadas o en proceso de negociación, junto con sus motivos y actores involucrados.
        </Typography>
        
        <Divider sx={{ mb: 2.5, borderColor: hasCasos ? '#f3e8ff' : 'divider' }} />

        {error ? (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontFamily: 'Inter' }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
            
            {hasCasos ? (
              <Box sx={{ mb: 2 }}>
                {casosAbiertos.slice(0, 3).map((caso, index) => (
                  <Box key={caso.id + '-' + index} sx={{ mb: 1.5, p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontFamily: 'Inter' }}>
                        Folio: {caso.folio}
                      </Typography>
                      <Chip 
                        label={caso.estado} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem', 
                          fontWeight: 700,
                          bgcolor: caso.estado === 'RECHAZADA' ? 'error.light' : '#fef3c7',
                          color: caso.estado === 'RECHAZADA' ? 'error.main' : '#d97706'
                        }} 
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      De: {caso.declarante} &rarr; Para: {caso.destinatario}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.primary', fontStyle: 'italic' }}>
                      "{caso.motivo}"
                    </Typography>
                  </Box>
                ))}
                {casosAbiertos.length > 3 && (
                  <Typography variant="caption" sx={{ color: '#a855f7', textAlign: 'center', display: 'block', mt: 1 }}>
                    + {casosAbiertos.length - 3} casos más
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Inter', fontStyle: 'italic' }}>
                  No hay casos abiertos registrados en este periodo.
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 'auto' }}>
              <Button 
                variant="contained" 
                onClick={() => setOpenModal(true)}
                disabled={!hasCasos}
                sx={{ 
                  bgcolor: hasCasos ? '#a855f7' : 'primary.main',
                  '&:hover': {
                    bgcolor: hasCasos ? '#9333ea' : 'primary.light',
                  },
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontFamily: 'Outfit',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  boxShadow: 'none',
                  '&.Mui-disabled': {
                    bgcolor: 'divider',
                    color: 'text.disabled'
                  }
                }}
              >
                Ver Lista Completa
              </Button>
            </Box>
          </Box>
        )}

        {/* Modal de Detalle */}
        <Dialog 
          open={openModal} 
          onClose={() => setOpenModal(false)} 
          maxWidth="md" 
          fullWidth
          slotProps={{
            paper: {
              sx: { borderRadius: 4, overflow: 'hidden' }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', p: 3 }}>
            Detalle de Casos (Rechazos y Negociaciones)
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, borderColor: 'divider' }}>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="medium" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Folio</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Declarante</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Destinatario</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Motivo / Último Mensaje</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', bgcolor: 'background.default', fontFamily: 'Outfit', borderBottom: 2, borderColor: 'divider' }}>Fecha Mensaje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {casosAbiertos.map((row, idx) => (
                    <TableRow 
                      key={row.id + '-' + idx}
                      sx={{ 
                        '&:hover': { bgcolor: 'background.default' }, 
                        transition: 'background-color 0.2s ease' 
                      }}
                    >
                      <TableCell sx={{ py: 1.5, fontFamily: 'Inter', fontWeight: 600 }}>{row.folio}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip 
                          label={row.estado} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 700,
                            bgcolor: row.estado === 'RECHAZADA' ? 'error.light' : '#fef3c7',
                            color: row.estado === 'RECHAZADA' ? 'error.main' : '#d97706'
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.declarante}</TableCell>
                      <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>{row.destinatario}</TableCell>
                      <TableCell sx={{ py: 1.5, fontFamily: 'Inter', fontStyle: 'italic', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.motivo}>
                        "{row.motivo}"
                      </TableCell>
                      <TableCell sx={{ py: 1.5, fontFamily: 'Inter' }}>
                        {row.fechaMensaje ? new Date(row.fechaMensaje).toLocaleDateString('es-CL') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
            <Button 
              onClick={() => setOpenModal(false)}
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                textTransform: 'none',
                color: 'text.secondary'
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
