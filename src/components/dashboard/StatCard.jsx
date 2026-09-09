import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import IndicadorHelpButton from './IndicadorHelpButton';

const StatCard = ({ title, value, icon: Icon, trend, color, subtitle, helpKey, dateRange }) => {

    // Obtener colores y flechas de tendencia para el diseño de píldora
    const getTrendBadge = (val) => {
        if (val > 0) {
            return {
                bg: '#e6fbf1',
                text: 'success.main',
                border: '#a7f3d0',
                symbol: '↑',
                prefix: '+'
            };
        }
        if (val < 0) {
            return {
                bg: '#fef2f2',
                text: 'error.main',
                border: '#fecaca',
                symbol: '↓',
                prefix: ''
            };
        }
        return {
            bg: 'divider',
            text: 'text.secondary',
            border: 'divider',
            symbol: '→',
            prefix: ''
        };
    };

    const badge = getTrendBadge(trend);

    return (
        <Card 
            elevation={0}
            sx={{ 
                height: '100%', 
                borderRadius: 4, 
                position: 'relative',
                border: 1, borderColor: 'divider',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
                    borderColor: 'divider',
                }
            }}
        >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Box>
                        <Typography 
                            variant="subtitle2" 
                            sx={{ 
                                color: 'text.secondary', 
                                fontWeight: 600, 
                                fontFamily: 'Inter',
                                textTransform: 'uppercase',
                                fontSize: '0.65rem',
                                letterSpacing: 0.5,
                                mb: 0.5
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 800, 
                                fontFamily: 'Outfit', 
                                color: 'text.primary',
                                lineHeight: 1.1
                            }}
                        >
                            {value}
                        </Typography>
                        
                        {trend !== undefined && trend !== null && (
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mt: 1.5,
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: '6px',
                                    bgcolor: badge.bg,
                                    color: badge.text,
                                    border: `1px solid ${badge.border}`,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    fontFamily: 'Inter'
                                }}
                            >
                                <span>{badge.symbol}</span>
                                <span>{badge.prefix}{trend}% vs mes anterior</span>
                            </Box>
                        )}

                        {(trend === undefined || trend === null) && subtitle && (
                            <Typography
                                sx={{
                                    mt: 1.25,
                                    color: 'text.disabled',
                                    fontFamily: 'Inter',
                                    fontSize: '0.7rem',
                                    fontWeight: 500
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {Icon && (
                        <Box
                            sx={{
                                backgroundColor: `${color}12`,
                                color: color,
                                borderRadius: 3,
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${color}20`
                            }}
                        >
                            <Icon sx={{ fontSize: 26 }} />
                        </Box>
                    )}
                </Stack>
            </CardContent>
            <IndicadorHelpButton helpKey={helpKey || title} dateRange={dateRange} sx={{ bottom: 8, right: 8 }} />
        </Card>
    );
};

export default StatCard;
