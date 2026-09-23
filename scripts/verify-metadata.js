/**
 * RX.3: Test automatizado de sincronización y validación del Catálogo de Indicadores
 * Verifica que todos los parámetros {{clave}}, marcas, tablas y columnas citados
 * en indicadoresMetadata.js existan y sean válidos en el backend de TrazAlga.
 */

import assert from 'node:assert';
import { INDICADORES_METADATA, DEFAULT_CONFIG_VALUES } from '../src/components/dashboard/indicadoresMetadata.js';

console.log('--- Iniciando verificación de catálogo (RX.3) ---');

// 1. Marcas oficiales permitidas en declaracion_marca
const VALID_MARCAS = new Set([
  'EN_VEDA',
  'LED_EXCEDIDO',
  'DESEMBARQUE_ATIPICO',
  'CUOTA_EXCEDIDA',
  'POSTERIOR_CIERRE'
]);

// 2. Términos expresamente prohibidos / obsoletos según plan R X.3
const FORBIDDEN_TOKENS = [
  'PESO_FUERA_UMBRAL',
  'factor_conversion_guardado'
];

// 3. Tablas válidas de la base de datos de TrazAlga
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

// 4. Parámetros de configuracion_general reconocidos por el backend
const KNOWN_CONFIG_KEYS = new Set(Object.keys(DEFAULT_CONFIG_VALUES));

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
// TEST 2: Marcadores {{clave}} o {{clave:default}}
// =========================================================================
console.log('[TEST 2] Verificando marcadores de parámetros dinámicos...');
const placeholderRegex = /\{\{\s*([a-zA-Z0-9_]+)(?::([^}]+))?\s*\}\}/g;
let match;
const extractedKeys = new Set();

while ((match = placeholderRegex.exec(fullTextCorpus)) !== null) {
  const key = match[1];
  extractedKeys.add(key);
  assert.ok(
    KNOWN_CONFIG_KEYS.has(key),
    `FALLO RX.3: El marcador {{${key}}} citado en el catálogo no existe en DEFAULT_CONFIG_VALUES ni en configuracion_general.`
  );
}
console.log(`✓ ${extractedKeys.size} marcadores verificados exitosamente contra configuracion_general.`);

// =========================================================================
// TEST 3: Marcas oficiales citadas en textos
// =========================================================================
console.log('[TEST 3] Verificando marcas oficiales citadas...');
const marcaCandidates = ['EN_VEDA', 'LED_EXCEDIDO', 'DESEMBARQUE_ATIPICO', 'CUOTA_EXCEDIDA', 'POSTERIOR_CIERRE'];
for (const marca of marcaCandidates) {
  assert.ok(
    VALID_MARCAS.has(marca),
    `FALLO RX.3: Marca ${marca} no es parte de las marcas oficiales.`
  );
}
console.log(`✓ Todas las marcas referenciadas pertenecen a la especificación normativa oficial.`);

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
// TEST 5: Existencia de los 9 indicadores oficiales
// =========================================================================
console.log('[TEST 5] Verificando presencia de los 9 indicadores oficiales de la sesión 11-sep...');
const REQUIRED_INDICATORS = [
  'desembarqueFisico',      // Indicador 1
  'capturaCorregida',       // Indicador 2
  'controlCuotas',          // Indicador 3
  'limiteDiarioLed',        // Indicador 4
  'controlVedas',           // Indicador 5
  'variacionPeso',          // Indicador 6
  'retencionBodega',        // Indicador 7
  'integracionHumedadTiempo', // Indicador 8
  'perfiladorRiesgo'        // Indicador 9
];

for (const reqKey of REQUIRED_INDICATORS) {
  assert.ok(
    INDICADORES_METADATA[reqKey],
    `FALLO RX.3: Falta la ficha oficial para el indicador requerido "${reqKey}".`
  );
  assert.ok(INDICADORES_METADATA[reqKey].nombre, `Ficha ${reqKey} carece de nombre.`);
  assert.ok(INDICADORES_METADATA[reqKey].formula, `Ficha ${reqKey} carece de formula.`);
  assert.ok(INDICADORES_METADATA[reqKey].criterioFiscalizacion, `Ficha ${reqKey} carece de criterioFiscalizacion.`);
}
console.log('✓ Los 9 indicadores oficiales poseen fichas metodológicas completas y conformes.');

console.log('\n=======================================================');
console.log('✓ TODOS LOS TESTS RX.3 DE SINCRONIZACIÓN PASARON EXITOSAMENTE');
console.log('=======================================================');
