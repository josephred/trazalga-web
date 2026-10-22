// src/utils/fechas.js
// Utilidades de rango de fechas para TRAZALGA.
// Asegura zona horaria America/Santiago y persistencia en localStorage con try/catch defensivo.

/**
 * Calcula dinámicamente el rango de fechas por defecto:
 * Día 1 del mes en curso hasta la fecha actual en zona horaria America/Santiago.
 * Sin fechas fijas/hardcodeadas en el código fuente.
 */
export function getDefaultDateRange() {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;

    return {
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${day}`,
    };
  } catch (e) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return {
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${day}`,
    };
  }
}

/**
 * Carga el rango de fechas almacenado para un usuario específico desde localStorage.
 * Si no existe o falla la lectura, retorna el rango por defecto del mes en curso.
 */
export function loadUserDateRange(usuarioId) {
  try {
    const key = `trazalga_date_range_${usuarioId || 'default'}`;
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.startDate && parsed?.endDate) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error al leer rango de fechas desde localStorage:', e);
  }
  return getDefaultDateRange();
}

/**
 * Persiste el rango de fechas seleccionado por el usuario en localStorage.
 * Envuelto en try/catch para evitar excepciones de storage quota o entornos restringidos.
 */
export function saveUserDateRange(usuarioId, range) {
  try {
    if (typeof localStorage !== 'undefined' && range) {
      const key = `trazalga_date_range_${usuarioId || 'default'}`;
      localStorage.setItem(key, JSON.stringify(range));
    }
  } catch (e) {
    console.warn('Error al persistir rango de fechas en localStorage:', e);
  }
}
