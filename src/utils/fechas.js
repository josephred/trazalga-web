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
  } catch (_e) {
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

/**
 * Desplaza el rango de fechas un número de meses (offset: -1 para mes anterior, +1 para mes siguiente).
 * Retorna el rango completo del mes destino (del 1 al último día del mes en formato YYYY-MM-DD).
 * Ejemplo: si startDate es 2026-10-01 y endDate es 2026-10-31, avanzar 1 mes (+1)
 * resulta en startDate 2026-11-01 y endDate 2026-11-30.
 */
export function shiftMonthRange(currentRange, offset = 1) {
  const baseStr = currentRange?.startDate || currentRange?.endDate;
  let year, month;
  if (baseStr && typeof baseStr === 'string') {
    const parts = baseStr.split('-').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      year = parts[0];
      month = parts[1];
    }
  }
  if (!year || !month) {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  // targetDate con día 1 para evitar desbordamientos de días (ej. 31 al sumar 1 mes)
  const targetDate = new Date(year, month - 1 + offset, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1;

  // Día 0 del mes siguiente da el último día del mes objetivo en Date()
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();

  const mm = String(targetMonth).padStart(2, '0');
  const ddEnd = String(lastDay).padStart(2, '0');

  return {
    startDate: `${targetYear}-${mm}-01`,
    endDate: `${targetYear}-${mm}-${ddEnd}`,
  };
}
