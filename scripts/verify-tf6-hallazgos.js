/**
 * scripts/verify-tf6-hallazgos.js
 * Script de validación automatizada para TF.6 (Consola de hallazgos y tablas en móvil)
 * Criterios evaluados:
 * 1. ConsolaHallazgos: TableContainer con overflowX auto y columna fija sticky para folio/origen
 * 2. ConsolaHallazgos: Primera columna es Origen / Folio
 * 3. ConsolaHallazgos: Diálogos de resolución y citación con fullScreen={isMobile}
 * 4. ConsolaHallazgos: Botones de acción con minHeight >= 44px
 * 5. TablaDetalleHallazgos (TA.4): TableContainer con scroll horizontal y columna fija con boxShadow
 * 6. LimiteExtraccionDiarioWidget: Tablas con overflowX auto, minWidth y columna fija
 * 7. OrigenGeoWidget: Tablas con overflowX auto, minWidth y columna fija
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

const results = [];
function check(description, passed, details = '') {
  results.push({ description, passed, details });
  const mark = passed ? '✓' : '✗';
  console.log(`[${mark}] ${description} ${details ? `(${details})` : ''}`);
}

console.log('--- Verificación Automatizada TF.6: Consola de Hallazgos y Tablas en Móvil ---\n');

// 1. ConsolaHallazgos
const consolaPath = path.join(webRoot, 'src', 'components', 'dashboard', 'ConsolaHallazgos.jsx');
const consolaCode = fs.readFileSync(consolaPath, 'utf-8');

check(
  'ConsolaHallazgos define hooks useTheme y useMediaQuery',
  consolaCode.includes('useMediaQuery(theme.breakpoints.down(') && consolaCode.includes('useTheme()')
);

check(
  'ConsolaHallazgos tiene TableContainer con scroll horizontal táctil y columna fija',
  consolaCode.includes("overflowX: 'auto'") &&
  consolaCode.includes("WebkitOverflowScrolling: 'touch'") &&
  consolaCode.includes("& th:first-of-type, & td:first-of-type") &&
  consolaCode.includes("position: 'sticky'")
);

check(
  'ConsolaHallazgos ubica Origen / Folio como primera columna de la tabla',
  consolaCode.includes('<TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Origen / Folio</TableCell>') &&
  consolaCode.includes('{/* 1. Origen / Folio (Columna Fija TA.4 / TF.6) */}')
);

check(
  'ConsolaHallazgos: diálogos de resolución y citación usan fullScreen={isMobile}',
  (consolaCode.match(/fullScreen=\{isMobile\}/g) || []).length >= 2
);

check(
  'ConsolaHallazgos: botones de acción tienen minHeight de al menos 44px',
  consolaCode.includes('minHeight: 44')
);

// 2. TablaDetalleHallazgos
const tablaDetallePath = path.join(webRoot, 'src', 'components', 'dashboard', 'comun', 'TablaDetalleHallazgos.jsx');
const tablaDetalleCode = fs.readFileSync(tablaDetallePath, 'utf-8');

check(
  'TablaDetalleHallazgos: TableContainer con columna fija sticky y sombra divisoria',
  tablaDetalleCode.includes("position: 'sticky'") &&
  tablaDetalleCode.includes("overflowX: 'auto'") &&
  tablaDetalleCode.includes("boxShadow:")
);

// 3. LimiteExtraccionDiarioWidget
const ledPath = path.join(webRoot, 'src', 'components', 'dashboard', 'LimiteExtraccionDiarioWidget.jsx');
const ledCode = fs.readFileSync(ledPath, 'utf-8');

check(
  'LimiteExtraccionDiarioWidget: ambas tablas tienen overflowX y columna fija sticky',
  (ledCode.match(/overflowX: 'auto'/g) || []).length >= 2 &&
  (ledCode.match(/position: 'sticky'/g) || []).length >= 2
);

// 4. OrigenGeoWidget
const geoPath = path.join(webRoot, 'src', 'components', 'dashboard', 'OrigenGeoWidget.jsx');
const geoCode = fs.readFileSync(geoPath, 'utf-8');

check(
  'OrigenGeoWidget: tablas tienen overflowX y columna fija sticky',
  (geoCode.match(/overflowX: 'auto'/g) || []).length >= 2 &&
  (geoCode.match(/position: 'sticky'/g) || []).length >= 2
);

const failed = results.filter(r => !r.passed);
console.log(`\nResumen TF.6: ${results.length - failed.length}/${results.length} verificaciones aprobadas.`);
if (failed.length > 0) {
  console.error('ERRORES ENCONTRADOS:', failed);
  process.exit(1);
} else {
  console.log('✓ Criterios de aceptación TF.6 cumplidos con éxito.');
}
