import { useState, useEffect, useRef } from 'react';
import {
    Card, CardContent, Typography, Box, TextField, MenuItem,
    Button, Stack, Divider, Chip, InputAdornment, IconButton, Grid,
    Autocomplete, CircularProgress, createFilterOptions
} from '@mui/material';
import {
    FilterList as FilterIcon,
    CalendarMonth as CalendarIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { getUsuarios, getPlantas } from '../../services/usuarioService';

// ── Tipos de Reporte ──────────────────────────────────────────────
const REPORT_TYPES = [
    { id: 1, label: 'Recolector', perfilIds: [1, 8, 9, 10, 11] },
    { id: 2, label: 'Armador', perfilIds: [2, 10] },
    { id: 3, label: 'Área de Manejo', perfilIds: [3, 11] },
    { id: 4, label: 'Comercializador', perfilIds: [4, 12, 13] },
    { id: 5, label: 'Planta Abastecimiento', perfilIds: [5, 12, 13], isPlanta: true },
    { id: 6, label: 'Planta Producción', perfilIds: [6, 13], isPlanta: true },
    { id: 7, label: 'Planta Destino', perfilIds: [7], isPlanta: true },
];

const PERFIL_LABELS = {
    1: 'Recolector',
    2: 'Armador',
    3: 'Área de Manejo',
    4: 'Comercializador',
    5: 'Planta Abastecimiento',
    6: 'Planta Producción',
    7: 'Planta Destino',
    8: 'Buzo',
    9: 'Buzo / Recolector',
    10: 'Buzo / Recolector / Armador',
    11: 'Recolector / AMERB',
    12: 'Comercializador / P. Abast.',
    13: 'Comercializador / P. Abast. / P. Prod.',
};

// Filtro rápido con límite de 100 items mostrados para máximo rendimiento de renderizado
const customFilterOptions = createFilterOptions({
    limit: 100,
    matchFrom: 'any',
    stringify: (option) => `${option.nombre} ${option.rut} ${option.perfilNombre || ''}`,
});

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

const ReportFilter = ({ onGenerate }) => {
    const [fechaInicio, setFechaInicio] = useState(thirtyDaysAgo());
    const [fechaFin, setFechaFin] = useState(today());
    const [tipoReporte, setTipoReporte] = useState('');
    const [selectedActor, setSelectedActor] = useState(null);
    const [subOptions, setSubOptions] = useState([]);
    const [loadingSub, setLoadingSub] = useState(false);
    const [allUsers, setAllUsers] = useState(null);
    const [allPlantas, setAllPlantas] = useState(null);

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

    // Precargar usuarios y plantas al montar el componente
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            try {
                const [usersData, plantasData] = await Promise.all([
                    getUsuarios(),
                    getPlantas()
                ]);
                if (isMounted) {
                    setAllUsers(usersData || []);
                    setAllPlantas(plantasData || []);
                }
            } catch (err) {
                console.error('Error cargando actores para filtros:', err);
                if (isMounted) {
                    setAllUsers([]);
                    setAllPlantas([]);
                }
            }
        };
        loadInitialData();
        return () => { isMounted = false; };
    }, []);

    // Cuando cambia el tipo de reporte o los datos maestros se cargan
    useEffect(() => {
        if (!tipoReporte) {
            setSubOptions([]);
            setSelectedActor(null);
            setLoadingSub(false);
            return;
        }

        setSelectedActor(null);

        // Si aún no se cargan los datos maestros, indicar estado de carga
        if (!allUsers) {
            setLoadingSub(true);
            return;
        }

        setLoadingSub(true);

        const currentTypeConfig = REPORT_TYPES.find(t => t.id === tipoReporte);
        const pids = currentTypeConfig?.perfilIds || [];
        const isPlantaType = !!currentTypeConfig?.isPlanta;

        // Filtrar usuarios del perfil correspondiente
        const filteredUsers = allUsers.filter(u => {
            const pid = u.perfil?.id;
            const pnom = (u.perfil?.nombre || '').toUpperCase();
            return pids.includes(pid) || (
                tipoReporte === 1 ? (pnom.includes('RECOLECTOR') || pnom.includes('BUZO')) :
                tipoReporte === 2 ? pnom.includes('ARMADOR') :
                tipoReporte === 3 ? (pnom.includes('AMERB') || pnom.includes('AREA') || pnom.includes('ÁREA')) :
                tipoReporte === 4 ? pnom.includes('COMER') :
                pnom.includes('PLANTA')
            );
        });

        const options = filteredUsers.map(u => {
            const nombreCompleto = [u.nombres, u.apellidop, u.apellidom].filter(Boolean).join(' ').trim() || 'Sin Nombre';
            return {
                id: u.id,
                rut: u.rut || '',
                nombre: nombreCompleto,
                perfilId: u.perfil?.id,
                perfilNombre: u.perfil?.nombre || PERFIL_LABELS[u.perfil?.id] || currentTypeConfig?.label || 'Actor'
            };
        });

        // Si es tipo de planta, enriquecer con plantas maestras registradas
        if (isPlantaType && allPlantas && allPlantas.length > 0) {
            const existingRuts = new Set(options.map(o => o.rut?.toLowerCase().trim()));
            allPlantas.forEach(p => {
                const pRut = p.rut ? p.rut.trim() : '';
                if (pRut && !existingRuts.has(pRut.toLowerCase())) {
                    options.push({
                        id: `planta-${p.id}`,
                        rut: pRut,
                        nombre: p.nombre || 'Planta',
                        perfilNombre: 'Planta Registrada'
                    });
                    existingRuts.add(pRut.toLowerCase());
                }
            });
        }

        // Ordenar alfabéticamente por nombre
        options.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

        setSubOptions(options);
        setLoadingSub(false);
    }, [tipoReporte, allUsers, allPlantas]);

    const handleGenerar = () => {
        if (onGenerate) {
            onGenerate({
                fechaInicio,
                fechaFin,
                tipoReporte,
                subSeleccion: selectedActor ? selectedActor.id : '',
                rut: selectedActor ? selectedActor.rut : '',
                actorNombre: selectedActor ? selectedActor.nombre : '',
            });
        }
    };

    const selectedType = REPORT_TYPES.find(t => t.id === tipoReporte);
    const actorLabel = selectedType ? selectedType.label : 'Actor / Entidad';
    const isFormValid = fechaInicio && fechaFin && tipoReporte;

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 4,
                border: 1, borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                width: '100%',
                overflow: 'visible',
            }}
        >
            <CardContent sx={{ p: 3 }}>
                {/* Header de la sección de filtros */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 2,
                    }}
                >
                    <FilterIcon sx={{ color: 'secondary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: 'text.primary', m: 0 }}>
                        Filtros de Reporte
                    </Typography>
                </Box>

                <Divider sx={{ mb: 3, borderColor: 'divider' }} />

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

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: '1fr 1fr',
                            md: 'repeat(2, 1fr)',
                            lg: '1fr 1fr 1.15fr 1.35fr auto',
                        },
                        gap: 2,
                        alignItems: 'center',
                    }}
                >
                    {/* Fecha Inicio */}
                    <Box>
                        <TextField
                            id="filter-fecha-inicio"
                            label="Fecha Inicio"
                            type="text"
                            value={fechaInicio}
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    onClick: () => openPicker(inputInicioRef),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openPicker(inputInicioRef); }}>
                                                <CalendarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 3, cursor: 'pointer', fontFamily: 'Inter' }
                                },
                                inputLabel: {
                                    sx: { fontFamily: 'Inter' }
                                }
                            }}
                            fullWidth
                            size="small"
                        />
                    </Box>

                    {/* Fecha Fin */}
                    <Box>
                        <TextField
                            id="filter-fecha-fin"
                            label="Fecha Fin"
                            type="text"
                            value={fechaFin}
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    onClick: () => openPicker(inputFinRef),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openPicker(inputFinRef); }}>
                                                <CalendarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 3, cursor: 'pointer', fontFamily: 'Inter' }
                                },
                                inputLabel: {
                                    sx: { fontFamily: 'Inter' }
                                }
                            }}
                            fullWidth
                            size="small"
                        />
                    </Box>

                    {/* Tipo de Reporte */}
                    <Box>
                        <TextField
                            id="filter-tipo-reporte"
                            select
                            label="Tipo de Reporte"
                            value={tipoReporte}
                            onChange={(e) => setTipoReporte(e.target.value)}
                            fullWidth
                            size="small"
                            slotProps={{
                                input: {
                                    sx: { borderRadius: 3, fontFamily: 'Inter' }
                                },
                                inputLabel: {
                                    sx: { fontFamily: 'Inter' }
                                }
                            }}
                        >
                            {REPORT_TYPES.map((type) => (
                                <MenuItem key={type.id} value={type.id} sx={{ fontFamily: 'Inter' }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <Chip
                                            label={type.id}
                                            size="small"
                                            sx={{
                                                minWidth: 24,
                                                height: 20,
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                backgroundColor: 'secondary.main',
                                                color: 'white',
                                                fontFamily: 'Outfit',
                                            }}
                                        />
                                        <span style={{ fontSize: '0.9rem', color: 'text.primary' }}>{type.label}</span>
                                    </Stack>
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    {/* Sub-Seleccion (Actor / Entidad con Buscador en tiempo real y Notched Label idéntico) */}
                    <Box>
                        <Autocomplete
                            id="filter-sub-seleccion"
                            size="small"
                            fullWidth
                            disabled={!tipoReporte || loadingSub}
                            options={subOptions}
                            value={selectedActor}
                            onChange={(event, newValue) => setSelectedActor(newValue)}
                            getOptionLabel={(option) => {
                                if (!option) return '';
                                if (typeof option === 'string') return option;
                                return `${option.nombre} (${option.rut})`;
                            }}
                            isOptionEqualToValue={(option, value) => {
                                if (!option || !value) return false;
                                return option.rut === value.rut || option.id === value.id;
                            }}
                            filterOptions={customFilterOptions}
                            loading={loadingSub}
                            loadingText="Cargando listado..."
                            noOptionsText={loadingSub ? "Cargando..." : "Sin coincidencias"}
                            clearOnEscape
                            slotProps={{
                                paper: {
                                    elevation: 6,
                                    sx: {
                                        borderRadius: 3,
                                        mt: 1,
                                        border: 1,
                                        borderColor: 'divider',
                                        minWidth: { xs: '100%', sm: 300, md: 340 },
                                        maxHeight: 320,
                                    }
                                }
                            }}
                            renderOption={(props, option) => {
                                const { key, ...otherProps } = props;
                                return (
                                    <Box
                                        component="li"
                                        key={key || `${option.id}-${option.rut}`}
                                        {...otherProps}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start !important',
                                            py: 1,
                                            px: 1.75,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            '&:last-child': { borderBottom: 'none' },
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 600,
                                                color: 'text.primary',
                                                fontFamily: 'Inter',
                                                fontSize: '0.85rem',
                                                lineHeight: 1.3
                                            }}
                                        >
                                            {option.nombre}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <Chip
                                                label={`RUT: ${option.rut}`}
                                                size="small"
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    fontFamily: 'Inter',
                                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                                                    color: 'text.primary',
                                                    borderRadius: 1,
                                                }}
                                            />
                                            {option.perfilNombre && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: 'text.secondary',
                                                        fontSize: '0.72rem',
                                                        fontFamily: 'Inter',
                                                    }}
                                                >
                                                    {option.perfilNombre}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    id="filter-sub-seleccion"
                                    label={actorLabel}
                                    placeholder={
                                        !tipoReporte
                                            ? "Seleccione tipo primero"
                                            : loadingSub
                                            ? "Cargando..."
                                            : "Todos o escribir para buscar..."
                                    }
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{
                                        ...params.InputLabelProps,
                                        shrink: true,
                                        sx: { fontFamily: 'Inter' }
                                    }}
                                    InputProps={{
                                        ...params.InputProps,
                                        sx: {
                                            ...params.InputProps?.sx,
                                            borderRadius: 3,
                                            fontFamily: 'Inter',
                                            fontSize: '0.875rem',
                                        },
                                        endAdornment: (
                                            <>
                                                {loadingSub ? <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} /> : null}
                                                {params.InputProps?.endAdornment}
                                            </>
                                        )
                                    }}
                                />
                            )}
                        />
                    </Box>

                    {/* Botón Generar */}
                    <Box sx={{ display: 'flex', justifyContent: 'stretch' }}>
                        <Button
                            id="btn-generar-reporte"
                            variant="contained"
                            disabled={!isFormValid}
                            onClick={handleGenerar}
                            startIcon={<SearchIcon />}
                            sx={{
                                height: '40px',
                                px: 3,
                                minWidth: 120,
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontFamily: 'Outfit',
                                bgcolor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.light',
                                },
                                boxShadow: 'none',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Buscar
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ReportFilter;
