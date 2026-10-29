// scripts/test-tf2-dates.js
import { getDefaultDateRange, loadUserDateRange, saveUserDateRange, shiftMonthRange } from '../src/utils/fechas.js';

const range = getDefaultDateRange();
console.log('Resultado getDefaultDateRange():', range);

// Validaciones
const nowSantiago = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).formatToParts(new Date());

const y = nowSantiago.find(p => p.type === 'year')?.value;
const m = nowSantiago.find(p => p.type === 'month')?.value;
const d = nowSantiago.find(p => p.type === 'day')?.value;

const expectedStart = `${y}-${m}-01`;
const expectedEnd = `${y}-${m}-${d}`;

if (range.startDate !== expectedStart || range.endDate !== expectedEnd) {
  console.error(`ERROR: Rango obtenido (${JSON.stringify(range)}) no coincide con lo esperado (${expectedStart} a ${expectedEnd})`);
  process.exit(1);
}

console.log('✓ getDefaultDateRange() calcula correctamente el mes en curso en America/Santiago:', expectedStart, 'a', expectedEnd);

// Mock de localStorage
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Prueba 1: Carga por defecto si no hay nada guardado
const defaultLoaded = loadUserDateRange('usr_test_1');
if (defaultLoaded.startDate !== expectedStart || defaultLoaded.endDate !== expectedEnd) {
  console.error('ERROR: loadUserDateRange no devolvió el rango por defecto');
  process.exit(1);
}
console.log('✓ loadUserDateRange() retorna mes en curso cuando no hay datos previos');

// Prueba 2: Guardar y recargar rango por usuario
const customRange = { startDate: '2026-09-15', endDate: '2026-10-05' };
saveUserDateRange('usr_test_1', customRange);
const loadedUser1 = loadUserDateRange('usr_test_1');
const loadedUser2 = loadUserDateRange('usr_test_2');

if (loadedUser1.startDate !== '2026-09-15' || loadedUser1.endDate !== '2026-10-05') {
  console.error('ERROR: No se recuperó el rango guardado para usuario 1');
  process.exit(1);
}
if (loadedUser2.startDate !== expectedStart) {
  console.error('ERROR: El usuario 2 debió recibir el rango por defecto');
  process.exit(1);
}
console.log('✓ saveUserDateRange() persiste correctamente por usuario en localStorage');

// Prueba 3: Tolerancia a excepciones de localStorage (try/catch)
globalThis.localStorage.getItem = () => { throw new Error('QuotaExceeded simulated'); };
globalThis.localStorage.setItem = () => { throw new Error('QuotaExceeded simulated'); };

const safeRange = loadUserDateRange('usr_falla');
if (!safeRange.startDate || !safeRange.endDate) {
  console.error('ERROR: Falló el fallback ante error de localStorage');
  process.exit(1);
}
saveUserDateRange('usr_falla', customRange); // No debe lanzar excepción
console.log('✓ Manejo seguro con try/catch ante fallos en localStorage comprobado exitosamente');

// Prueba 4: shiftMonthRange (+1 mes y -1 mes)
// Ejemplo solicitado por el usuario: de 2026-10-01 a 2026-10-31 con '>' (+1) -> 2026-11-01 a 2026-11-30
const octRange = { startDate: '2026-10-01', endDate: '2026-10-31' };
const novRange = shiftMonthRange(octRange, 1);
if (novRange.startDate !== '2026-11-01' || novRange.endDate !== '2026-11-30') {
  console.error('ERROR: shiftMonthRange (+1) falló para octubre a noviembre:', novRange);
  process.exit(1);
}
console.log('✓ shiftMonthRange (+1) avanza de 2026-10-01...2026-10-31 a 2026-11-01...2026-11-30');

// Retroceder (< / -1) desde noviembre a octubre
const backToOct = shiftMonthRange(novRange, -1);
if (backToOct.startDate !== '2026-10-01' || backToOct.endDate !== '2026-10-31') {
  console.error('ERROR: shiftMonthRange (-1) falló de vuelta a octubre:', backToOct);
  process.exit(1);
}
console.log('✓ shiftMonthRange (-1) retrocede de 2026-11-01...2026-11-30 a 2026-10-01...2026-10-31');

// Cambio de año hacia adelante (diciembre 2026 -> enero 2027)
const decRange = { startDate: '2026-12-01', endDate: '2026-12-31' };
const jan2027 = shiftMonthRange(decRange, 1);
if (jan2027.startDate !== '2027-01-01' || jan2027.endDate !== '2027-01-31') {
  console.error('ERROR: shiftMonthRange (+1) falló en cruce de año:', jan2027);
  process.exit(1);
}
console.log('✓ shiftMonthRange cruza de año correctamente (2026-12 a 2027-01)');

// Febrero en año bisiesto (2028: 29 días)
const jan2028 = { startDate: '2028-01-01', endDate: '2028-01-31' };
const feb2028 = shiftMonthRange(jan2028, 1);
if (feb2028.startDate !== '2028-02-01' || feb2028.endDate !== '2028-02-29') {
  console.error('ERROR: shiftMonthRange falló en año bisiesto 2028:', feb2028);
  process.exit(1);
}
console.log('✓ shiftMonthRange calcula correctamente febrero en año bisiesto (29 días)');
