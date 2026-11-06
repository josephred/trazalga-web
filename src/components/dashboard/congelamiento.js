// Refinamiento 30-10 · punto 3: declaraciones de origen que se pueden congelar por una alerta.
const TIPOS_ORIGEN = ['RECOLECTOR', 'ARMADOR', 'AREA'];

/** ¿La fila de la Consola corresponde a una declaración de origen que se puede congelar? */
export const esDeclaracionOrigen = (tipo, id) =>
  id != null && TIPOS_ORIGEN.includes(String(tipo || '').toUpperCase());
