import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';

const StatCard = ({ title, value, icon: Icon, trend, color }) => {
    /* eslint-disable */
    const isPositive = trend > 0;

    return (
        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {value}
                        </Typography>
                        {trend !== undefined && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: isPositive ? 'success.main' : 'error.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    mt: 0.5,
                                    fontWeight: 'medium'
                                }}
                            >
                                {isPositive ? '+' : ''}{trend}% vs mes pasado
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: `${color}15`,
                            color: color,
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Icon fontSize="large" />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default StatCard;
