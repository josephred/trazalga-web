import { useState, useEffect, useRef } from 'react';
import {
    Card, CardContent, Typography, Box, TextField, MenuItem,
    Button, Stack, Divider, Chip, InputAdornment, IconButton, Grid
} from '@mui/material';
import {
    FilterList as FilterIcon,
    CalendarMonth as CalendarIcon,
    Description as ReportIcon,
    Search as SearchIcon
} from '@mui/icons-material';

// ── Tipos de Reporte ──────────────────────────────────────────────
const REPORT_TYPES = [
    { id: 1, label: 'Recolector', endpoint: '/recolectores' },
    { id: 2, label: 'Armador', endpoint: '/armadores' },
    { id: 3, label: 'Área de Manejo', endpoint: '/areas-manejo' },
    { id: 4, label: 'Comercializador', endpoint: '/comercializadores' },
    { id: 5, label: 'Planta Abastecimiento', endpoint: '/plantas-abastecimiento' },
    { id: 6, label: 'Planta Producción', endpoint: '/plantas-produccion' },
    { id: 7, label: 'Planta Destino', endpoint: '/plantas-destino' },
];

// ── Datos mock por tipo (se reemplazarán por llamadas a la API) ──
const MOCK_SUB_OPTIONS = {
    1: [
        { id: 101, nombre: 'Recolector Juan Pérez' },
        { id: 102, nombre: 'Recolector María López' },
        { id: 103, nombre: 'Recolector Carlos Díaz' },
    ],
    2: [
        { id: 201, nombre: 'Armador Norte' },
        { id: 202, nombre: 'Armador Sur' },
    ],
    3: [
        { id: 301, nombre: 'Área Caleta Chica' },
        { id: 302, nombre: 'Área Bahía Grande' },
    ],
    4: [
        { id: 401, nombre: 'Comercializador Algas Chile' },
        { id: 402, nombre: 'Comercializador Pacific Trade' },
    ],
    5: [
        { id: 501, nombre: 'Planta Abast. Valparaíso' },
        { id: 502, nombre: 'Planta Abast. Coquimbo' },
    ],
    6: [
        { id: 601, nombre: 'Planta Prod. Los Andes' },
        { id: 602, nombre: 'Planta Prod. Santiago' },
    ],
    7: [
        { id: 701, nombre: 'Planta Dest. Antofagasta' },
        { id: 702, nombre: 'Planta Dest. Iquique' },
    ],
};

// ── Helper: fecha local en formato YYYY-MM-DD ─────────────────────
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const today = () => formatDate(new Date());
const thirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDate(d);
};

// ══════════════════════════════════════════════════════════════════
//  Componente ReportFilter
// ══════════════════════════════════════════════════════════════════
const ReportFilter = ({ onGenerate }) => {
    const [fechaInicio, setFechaInicio] = useState(thirtyDaysAgo());
    const [fechaFin, setFechaFin] = useState(today());
    const [tipoReporte, setTipoReporte] = useState('');
    const [subSeleccion, setSubSeleccion] = useState('');
    const [subOptions, setSubOptions] = useState([]);
    const [loadingSub, setLoadingSub] = useState(false);

    // Referencias para los inputs ocultos de fecha
    const inputInicioRef = useRef(null);
    const inputFinRef = useRef(null);

    const openPicker = (ref) => {
        if (ref.current && typeof ref.current.showPicker === 'function') {
            ref.current.showPicker();
        } else if (ref.current) {
            ref.current.focus();
            ref.current.click();
        }
    };

    // Cuando cambia el tipo de reporte, carga las opciones del sub-selector
    useEffect(() => {
        if (!tipoReporte) {
            setSubOptions([]);
            setSubSeleccion('');
            return;
        }

        setLoadingSub(true);
        setSubSeleccion('');

        // Simula una llamada a la API con un pequeño delay
        const timeout = setTimeout(() => {
            const options = MOCK_SUB_OPTIONS[tipoReporte] || [];
            setSubOptions(options);
            setLoadingSub(false);
        }, 300);

        return () => clearTimeout(timeout);
    }, [tipoReporte]);

    const handleGenerar = () => {
        if (onGenerate) {
            onGenerate({
                fechaInicio,
                fechaFin,
                tipoReporte,
                subSeleccion,
            });
        }
    };

    const selectedType = REPORT_TYPES.find(t => t.id === tipoReporte);
    const isFormValid = fechaInicio && fechaFin && tipoReporte;

    return (
        <Card
            sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                width: '100%',
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'visible',
            }}
        >
            <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <FilterIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        Filtros de Reporte
                    </Typography>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Inputs nativos ocultos para disparar el calendario */}
                <input
                    type="date"
                    ref={inputInicioRef}
                    style={{ opacity: 0, position: 'absolute', zIndex: -1, width: 0, height: 0 }}
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                />
                <input
                    type="date"
                    ref={inputFinRef}
                    style={{ opacity: 0, position: 'absolute', zIndex: -1, width: 0, height: 0 }}
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    min={fechaInicio}
                />

                <Grid container spacing={2} alignItems="flex-end">
                    {/* Fecha Inicio */}
                    <Grid item xs={12} md={6} lg={2}>
                        <TextField
                            id="filter-fecha-inicio"
                            label="Fecha Inicio"
                            type="text"
                            value={fechaInicio}
                            readOnly
                            onClick={() => openPicker(inputInicioRef)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openPicker(inputInicioRef); }}>
                                            <CalendarIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2, cursor: 'pointer' }
                            }}
                            fullWidth
                            size="small"
                        />
                    </Grid>

                    {/* Fecha Fin */}
                    <Grid item xs={12} md={6} lg={2}>
                        <TextField
                            id="filter-fecha-fin"
                            label="Fecha Fin"
                            type="text"
                            value={fechaFin}
                            readOnly
                            onClick={() => openPicker(inputFinRef)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openPicker(inputFinRef); }}>
                                            <CalendarIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2, cursor: 'pointer' }
                            }}
                            fullWidth
                            size="small"
                        />
                    </Grid>

                    {/* Tipo de Reporte */}
                    <Grid item xs={12} md={4} lg={3}>
                        <TextField
                            id="filter-tipo-reporte"
                            select
                            label="Tipo de Reporte"
                            value={tipoReporte}
                            onChange={(e) => setTipoReporte(e.target.value)}
                            fullWidth
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                minWidth: { lg: 200 }
                            }}
                        >
                            {REPORT_TYPES.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Chip
                                            label={type.id}
                                            size="small"
                                            sx={{
                                                minWidth: 28,
                                                height: 22,
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                backgroundColor: 'primary.main',
                                                color: 'white',
                                            }}
                                        />
                                        <span>{type.label}</span>
                                    </Stack>
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Sub-Seleccion (Solo si hay tipo seleccionado) */}
                    <Grid item xs={12} md={4} lg={3}>
                        <TextField
                            id="filter-sub-seleccion"
                            select
                            label={loadingSub ? 'Cargando...' : `Seleccionar ${selectedType?.label || ''}`}
                            value={subSeleccion}
                            onChange={(e) => setSubSeleccion(e.target.value)}
                            fullWidth
                            size="small"
                            disabled={!tipoReporte || loadingSub || subOptions.length === 0}
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                minWidth: { lg: 200 }
                            }}
                        >
                            {subOptions.map((opt) => (
                                <MenuItem key={opt.id} value={opt.id}>
                                    {opt.nombre}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Botón Generar */}
                    <Grid item xs={12} md={4} lg={2}>
                        <Button
                            id="btn-generar-reporte"
                            variant="contained"
                            fullWidth
                            disabled={!isFormValid}
                            onClick={handleGenerar}
                            sx={{
                                height: '40px', // Alineado con TextField size="small"
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)',
                                '&:hover': {
                                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                                },
                            }}
                        >
                            Generar Reporte
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default ReportFilter;
