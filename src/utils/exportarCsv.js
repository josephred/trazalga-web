/**
 * Utilidad unificada para exportación de datos a planillas CSV (T2.6).
 *
 * Características para compatibilidad total con Microsoft Excel en español:
 * 1. BOM UTF-8 ('\uFEFF') al inicio para que Excel reconozca tildes, diéresis y la 'ñ' automáticamente.
 * 2. Separador de columnas punto y coma (';'), requerido por el estándar regional en español.
 * 3. Escapado estricto de comillas dobles (" -> "") y encapsulación de texto según RFC 4180.
 *
 * Soporta dos firmas de llamada:
 *   exportarCsv({ filename, headers, rows })
 *   exportarCsv(filename, headers, rows)
 *
 * @param {string|Object} optionsOrFilename Nombre del archivo o mapa de configuración
 * @param {Array<string>} [headersParam] Lista de encabezados de columnas
 * @param {Array<Array<any>>} [rowsParam] Filas con los datos ya ordenados por columna
 */
export function exportarCsv(optionsOrFilename, headersParam, rowsParam) {
  let filename = 'reporte_trazalga.csv';
  let headers = [];
  let rows = [];

  if (typeof optionsOrFilename === 'object' && optionsOrFilename !== null) {
    filename = optionsOrFilename.filename || optionsOrFilename.nombreArchivo || filename;
    headers = optionsOrFilename.headers || optionsOrFilename.encabezados || [];
    rows = optionsOrFilename.rows || optionsOrFilename.filas || [];
  } else {
    filename = optionsOrFilename || filename;
    headers = headersParam || [];
    rows = rowsParam || [];
  }

  if (!filename.toLowerCase().endsWith('.csv')) {
    filename += '.csv';
  }

  const escaparCampo = (valor) => {
    if (valor === null || valor === undefined) {
      return '""';
    }
    const str = String(valor);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const lineas = [];

  // 1. Encabezados
  if (headers && headers.length > 0) {
    lineas.push(headers.map(escaparCampo).join(';'));
  }

  // 2. Filas de datos
  for (const fila of rows) {
    if (Array.isArray(fila)) {
      lineas.push(fila.map(escaparCampo).join(';'));
    }
  }

  // 3. Contenido con BOM UTF-8 y salto de línea estándar CRLF para Excel
  const bom = '\uFEFF';
  const csvContent = bom + lineas.join('\r\n');

  // 4. Descarga mediante Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default exportarCsv;
