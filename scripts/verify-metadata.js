/**
 * RX.3: Test automatizado de sincronización y validación del Catálogo de Indicadores
 * Verifica que todos los parámetros {{clave}}, marcas, tablas y columnas citados
 * en indicadoresMetadata.js existan y sean válidos en el backend de TrazAlga,
 * conectando el catálogo con el contrato formal de backend-config-keys.json.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import { INDICADORES_METADATA, DEFAULT_CONFIG_VALUES } from '../src/components/dashboard/indicadoresMetadata.js';

console.log('--- Iniciando verificación de catálogo (RX.3) ---');

// 0. Cargar contrato formal de claves del backend (desacopla de la autovalidación)
const backendKeysPath = new URL('../src/config/backend-config-keys.json', import.meta.url);
const backendConfig = JSON.parse(fs.readFileSync(backendKeysPath, 'utf-8'));
const BACKEND_CONFIG_KEYS = new Set(backendConfig.keys);

// 1. Marcas oficiales permitidas en declaracion_marca
const VALID_MARCAS = new Set([
  'EN_VEDA',
  'LED_EXCEDIDO',
  'DESEMBARQUE_ATIPICO',
  'CUOTA_EXCEDIDA',
  'POSTERIOR_CIERRE'
]);

// 2. Términos expresamente prohibidos / obsoletos según plan RX.3
const FORBIDDEN_TOKENS = [
  'PESO_FUERA_UMBRAL',
  'factor_conversion_guardado'
];

// 3. Tablas válidas de la base de datos de TrazAlga (esquema JPA / MySQL)
const VALID_TABLES = new Set([
  'declaracion_recolector',
  'declaracion_armador',
  'declaracion_area',
  'declaracion_comercializador',
  'declaracion_planta_abastecimiento',
  'declaracion_planta_produccion',
  'declaracion_planta_destino',
  'declaracion_marca',
  'veda_especie',
  'cuota_extraccion',
  'limite_extraccion_diario_config',
  'factor_conversion',
  'macrozona_region',
  'configuracion_general',
  'configuracion_auditoria'
]);

// Extraer todos los textos del catálogo
function collectAllStrings(obj) {
  let strings = [];
  if (typeof obj === 'string') {
    strings.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      strings = strings.concat(collectAllStrings(item));
    }
  } else if (obj && typeof obj === 'object') {
    for (const val of Object.values(obj)) {
      strings = strings.concat(collectAllStrings(val));
    }
  }
  return strings;
}

const allTexts = collectAllStrings(INDICADORES_METADATA);
const fullTextCorpus = allTexts.join('\n');

// =========================================================================
// TEST 1: Prohibición explícita de términos obsoletos (Criterio RX.3)
// =========================================================================
console.log('[TEST 1] Verificando ausencia de términos obsoletos...');
for (const forbidden of FORBIDDEN_TOKENS) {
  const found = fullTextCorpus.includes(forbidden);
  assert.strictEqual(
    found,
    false,
    `FALLO RX.3: Se detectó el término prohibido u obsoleto "${forbidden}" en el catálogo de metadatos.`
  );
}
console.log('✓ Ningún término prohibido (PESO_FUERA_UMBRAL, factor_conversion_guardado) encontrado.');

// =========================================================================
// TEST 2: Marcadores {{clave}} validados contra contrato de Backend
// =========================================================================
console.log('[TEST 2] Verificando marcadores {{clave}} contra contrato de backend (backend-config-keys.json)...');
const placeholderRegex = /\{\{\s*([a-zA-Z0-9_]+)(?::([^}]+))?\s*\}\}/g;
let match;
const extractedKeys = new Set();

while ((match = placeholderRegex.exec(fullTextCorpus)) !== null) {
  const key = match[1];
  extractedKeys.add(key);
  assert.ok(
    BACKEND_CONFIG_KEYS.has(key),
    `FALLO RX.3: El marcador {{${key}}} citado en el catálogo no existe en el contrato del backend (backend-config-keys.json ni configuracion_general).`
  );
}

// Validar que DEFAULT_CONFIG_VALUES esté sincronizado con el backend sin claves huérfanas
for (const key of Object.keys(DEFAULT_CONFIG_VALUES)) {
  assert.ok(
    BACKEND_CONFIG_KEYS.has(key),
    `FALLO RX.3: La clave "${key}" en DEFAULT_CONFIG_VALUES del frontend no existe en el backend.`
  );
}

assert.strictEqual(
  Object.keys(DEFAULT_CONFIG_VALUES).length,
  BACKEND_CONFIG_KEYS.size,
  `FALLO RX.3: Desincronización en número de claves entre frontend (${Object.keys(DEFAULT_CONFIG_VALUES).length}) y backend (${BACKEND_CONFIG_KEYS.size}).`
);
console.log(`✓ ${extractedKeys.size} marcadores en texto y ${BACKEND_CONFIG_KEYS.size} claves sincronizadas exactamente con el backend.`);

// =========================================================================
// TEST 3: Marcas oficiales citadas en el texto del catálogo (sin tautologías)
// =========================================================================
console.log('[TEST 3] Verificando marcas normativas citadas en el corpus del catálogo...');

// Extraer menciones de marcas contextuales en el catálogo
const marcaCitationRegex = /(?:marca(?:s)?(?:\s+(?:oficial|activa|normativa|de))?)\s+([A-Z0-9_]+)/gi;
const citedMarcas = new Set();
let marcaMatch;
while ((marcaMatch = marcaCitationRegex.exec(fullTextCorpus)) !== null) {
  const token = marcaMatch[1];
  if (token.includes('_') || VALID_MARCAS.has(token)) {
    citedMarcas.add(token);
  }
}

// Validar que cada marca citada sea una marca legal válida
assert.ok(citedMarcas.size > 0, 'FALLO RX.3: No se detectaron citas a marcas normativas en el catálogo.');
for (const marca of citedMarcas) {
  assert.ok(
    VALID_MARCAS.has(marca),
    `FALLO RX.3: La marca "${marca}" citada en el catálogo no es una marca válida permitida.`
  );
}

// Validar que las 5 marcas oficiales estén cubiertas en el catálogo
for (const officialMarca of VALID_MARCAS) {
  assert.ok(
    fullTextCorpus.includes(officialMarca),
    `FALLO RX.3: La marca oficial "${officialMarca}" debe estar presente y explicada en el catálogo de metadatos.`
  );
}
console.log(`✓ ${citedMarcas.size} citas de marcas validadas y las 5 marcas oficiales están debidamente documentadas.`);

// =========================================================================
// TEST 4: Tablas referenciadas en fuentesDatos
// =========================================================================
console.log('[TEST 4] Verificando tablas de base de datos citadas en fuentesDatos...');
let tableCount = 0;
for (const [indKey, ind] of Object.entries(INDICADORES_METADATA)) {
  if (ind.fuentesDatos) {
    const tableMatches = ind.fuentesDatos.match(/`([a-z0-9_]+)`/g) || [];
    for (const rawTbl of tableMatches) {
      const tbl = rawTbl.replace(/`/g, '');
      if (tbl.startsWith('declaracion_') || tbl.includes('veda') || tbl.includes('cuota') || tbl.includes('limite') || tbl.includes('factor')) {
        assert.ok(
          VALID_TABLES.has(tbl),
          `FALLO RX.3 en indicador "${indKey}": La tabla \`${tbl}\` citada en fuentesDatos no existe en la base de datos.`
        );
        tableCount++;
      }
    }
  }
}
console.log(`✓ ${tableCount} menciones a tablas de base de datos verificadas contra el esquema.`);

// =========================================================================
// TEST 5: Existencia y estructura de los 9 indicadores oficiales
// =========================================================================
console.log('[TEST 5] Verificando presencia de los 9 indicadores oficiales de la sesión 11-sep...');
const REQUIRED_INDICATORS = [
  'desembarqueFisico',        // Indicador 1
  'capturaCorregida',         // Indicador 2
  'controlCuotas',            // Indicador 3
  'limiteDiarioLed',          // Indicador 4
  'controlVedas',             // Indicador 5
  'variacionPeso',            // Indicador 6
  'retencionBodega',          // Indicador 7
  'integracionHumedadTiempo', // Indicador 8
  'perfiladorRiesgo'          // Indicador 9
];

for (const reqId of REQUIRED_INDICATORS) {
  const item = INDICADORES_METADATA[reqId];
  assert.ok(item, `FALLO RX.3: Falta la ficha del indicador requerido "${reqId}".`);
  assert.ok(item.nombre, `El indicador "${reqId}" no tiene nombre definido.`);
  assert.ok(item.formula, `El indicador "${reqId}" no tiene fórmula definida.`);
  assert.ok(item.criterioFiscalizacion, `El indicador "${reqId}" no tiene criterio de fiscalización definido.`);
}
console.log('✓ Los 9 indicadores requeridos están presentes con ficha completa.');

console.log('--- Suite RX.3 completada exitosamente sin errores ---');
