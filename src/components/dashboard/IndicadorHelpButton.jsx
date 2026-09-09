import React, { useState } from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import { getIndicadorMetadata } from './indicadoresMetadata';
import IndicadorHelpDialog from './IndicadorHelpDialog';

export default function IndicadorHelpButton({ helpKey, dateRange, sx = {} }) {
  const [open, setOpen] = useState(false);
  const metadata = getIndicadorMetadata(helpKey);

  if (!metadata) return null;

  return (
    <>
      <Tooltip title="¿Cómo se calcula este indicador? (Detalle técnico y de negocio)" arrow placement="top">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          aria-label={`Ayuda y metodología para ${metadata.nombre}`}
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 26,
            height: 26,
            minWidth: 26,
            borderRadius: '50%',
            color: 'text.secondary',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            border: 1,
            borderColor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: 'secondary.main',
              color: '#ffffff',
              borderColor: 'secondary.main',
              transform: 'scale(1.18)',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)'
            },
            ...sx
          }}
        >
          <HelpIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <IndicadorHelpDialog
        open={open}
        onClose={() => setOpen(false)}
        indicador={metadata}
        dateRange={dateRange}
      />
    </>
  );
}
