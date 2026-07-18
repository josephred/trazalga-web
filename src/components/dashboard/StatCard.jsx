import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';

const StatCard = ({ title, value, icon: Icon, trend, color, subtitle }) => {

    // Obtener colores y flechas de tendencia para el diseño de píldora
    const getTrendBadge = (val) => {
        if (val > 0) {
            return {
                bg: '#e6fbf1',
                text: '#10b981',
                border: '#a7f3d0',
                symbol: '↑',
                prefix: '+'
            };
        }
        if (val < 0) {
            return {
                bg: '#fef2f2',
                text: '#ef4444',
                border: '#fecaca',
                symbol: '↓',
                prefix: ''
            };
        }
        return {
            bg: '#f1f5f9',
            text: '#64748b',
            border: '#e2e8f0',
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
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 20px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
                    borderColor: '#cbd5e1',
                }
            }}
        >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Box>
                        <Typography 
                            variant="subtitle2" 
                            sx={{ 
                                color: '#64748b', 
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
                                color: '#0f172a',
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
                                    color: '#94a3b8',
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
        </Card>
    );
};

export default StatCard;
