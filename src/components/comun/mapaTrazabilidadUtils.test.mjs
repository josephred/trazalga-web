import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarEntradas,
  construirCapasMapaCadena,
  elegirCoordenadaEndpoint,
  ponderarGrosorFlujo,
  formatearCoordenadaWgs84,
  construirFilasCsvFlujosOrigenDestino,
  construirTrazaFlujoRegional,
  esCoordenadaChileValida,
  HEADERS_COORDENADAS_TRANSACCION,
  mapearCoordenadasTransaccionCsv,
} from './mapaTrazabilidadUtils.js';

test('QM.2: prioriza referencia oficial sobre GPS tanto en origen como en planta y preserva lineasPares', () => {
  const origenes = [
    {
      id: 10,
      tipo: 'RECOLECTOR',
      folioOrigen: 'RO-010',
      nombre: 'Juan Perez',
      geo: {
        referencia: {
          tipo: 'VARADERO',
          id: 77,
          nombre: 'Varadero Totoralillo',
          lat: -30.071,
          lon: -71.375,
          fuente: 'VARADERO_DECLARADO',
        },
        gps: { lat: -30.08, lon: -71.39 },
        distanciaKm: 1.7,
        evaluacion: 'COHERENTE',
      },
    },
  ];
  const comercializadores = [
    {
      id: 50,
      folio: 'COM-050',
      nombre: 'Comercializador Intermedio',
      geo: { gps: { lat: -29.9, lon: -71.25 }, referencia: null, evaluacion: 'COHERENTE' },
    },
  ];
  const planta = {
    id: 20,
    recepcionada: true,
    folio: 'PA-020',
    nombrePlanta: 'Planta Caldera',
    geo: {
      referencia: {
        tipo: 'PLANTA',
        id: 901,
        nombre: 'Planta Caldera Oficial',
        lat: -27.0667,
        lon: -70.8206,
        fuente: 'SERNAPESCA_2026_10',
      },
      gps: { lat: -27.07, lon: -70.83 },
      distanciaKm: 1.0,
      evaluacion: 'COHERENTE',
    },
  };

  const items = normalizarEntradas({ origenes, comercializadores, planta });
  const capas = construirCapasMapaCadena(items);

  // Separa origenes verdes y plantas oficiales en capas distintas
  assert.equal(capas.origenesAgrupados.length, 1);
  assert.equal(capas.plantasReferencia.length, 1);
  assert.equal(capas.plantasReferencia[0].tipo, 'PLANTA');
  assert.equal(capas.plantasReferencia[0].nombre, 'Planta Caldera Oficial');

  // Mantiene lineas punteadas referencia-GPS para ambos
  assert.equal(capas.lineasPares.length, 2);

  // Por defecto ZM.2: traza origen -> comercializador -> planta
  assert.equal(capas.lineasTrazaOrigenDestino.length, 1);
  const traza = capas.lineasTrazaOrigenDestino[0];
  assert.deepEqual(traza.coords, [
    [-30.071, -71.375],
    [-29.9, -71.25],
    [-27.0667, -70.8206],
  ]);
  assert.equal(traza.origen.tipoFuente, 'REFERENCIA');
  assert.equal(traza.destino.tipoFuente, 'REFERENCIA');
  assert.ok(traza.distanciaKm > 330 && traza.distanciaKm < 360);
  assert.equal(capas.avisosTraza.length, 0);

  // Al apagar Pasar por comercializador dibuja tramo directo origen -> planta
  const capasDirecto = construirCapasMapaCadena(items, { pasarPorComercializador: false });
  assert.deepEqual(capasDirecto.lineasTrazaOrigenDestino[0].coords, [
    [-30.071, -71.375],
    [-27.0667, -70.8206],
  ]);
});

test('QM.2: usa GPS declarado como respaldo cuando falta referencia oficial (nodos del modal)', () => {
  const nodos = [
    {
      data: {
        rawNode: {
          id: 1,
          idUnico: 'RECOLECTOR-1',
          tipoNodo: 'RECOLECTOR',
          folio: 'RO-001',
          nombreActor: 'Ana',
          latitud: -29.95,
          longitud: -71.34,
        },
      },
    },
    {
      data: {
        rawNode: {
          id: 2,
          idUnico: 'COMERCIALIZADOR-2',
          tipoNodo: 'COMERCIALIZADOR',
          folio: 'COM-002',
          nombreActor: 'Intermedio',
          latitud: -29.5,
          longitud: -71.1,
        },
      },
    },
    {
      data: {
        rawNode: {
          id: 3,
          idUnico: 'PLANTA_ABASTECIMIENTO-3',
          tipoNodo: 'PLANTA_ABASTECIMIENTO',
          folio: 'PA-003',
          nombreActor: 'Planta sin catastro',
          geo: {
            referencia: null,
            gps: { lat: -27.1, lon: -70.85 },
            evaluacion: 'COHERENTE',
          },
        },
      },
    },
  ];

  const items = normalizarEntradas({ nodos });
  const capas = construirCapasMapaCadena(items);

  assert.equal(capas.plantasReferencia.length, 0);
  assert.equal(capas.lineasTrazaOrigenDestino.length, 1);
  const traza = capas.lineasTrazaOrigenDestino[0];
  assert.deepEqual(traza.coords, [
    [-29.95, -71.34],
    [-29.5, -71.1],
    [-27.1, -70.85],
  ]);
  assert.equal(traza.origen.tipoFuente, 'GPS');
  assert.equal(traza.destino.tipoFuente, 'GPS');
  assert.equal(capas.avisosTraza.length, 0);
});

test('QM.2: múltiples orígenes trazan líneas individuales hacia la planta y reportan faltantes sin ocultar', () => {
  const origenes = [
    {
      id: 1,
      tipo: 'ARMADOR',
      folioOrigen: 'ARM-1',
      nombre: 'Armador Con Caleta',
      geo: {
        referencia: { tipo: 'CALETA', id: 1, nombre: 'Caleta Hornos', lat: -29.62, lon: -71.29, fuente: 'CALETA' },
        gps: null,
        evaluacion: 'SIN_GPS',
      },
    },
    {
      id: 2,
      tipo: 'RECOLECTOR',
      folioOrigen: 'RO-2',
      nombre: 'Recolector Sin Coords',
      geo: { referencia: null, gps: null, evaluacion: 'SIN_GPS' },
    },
  ];
  const planta = {
    id: 9,
    recepcionada: true,
    folioDeclaracionAPla: 'PA-99',
    nombrePlanta: 'Planta Norte',
    geo: {
      referencia: { tipo: 'PLANTA', id: 9, nombre: 'Planta Norte', lat: -27.06, lon: -70.82, fuente: 'MAESTRO_PLANTA' },
      gps: null,
      evaluacion: 'SIN_GPS',
    },
  };

  const items = normalizarEntradas({ origenes, planta });
  const capas = construirCapasMapaCadena(items);

  assert.equal(capas.lineasTrazaOrigenDestino.length, 1);
  assert.equal(capas.lineasTrazaOrigenDestino[0].origen.folio, 'ARM-1');
  assert.equal(capas.avisosTraza.length, 1);
  assert.match(capas.avisosTraza[0], /#RO-2/);
  assert.match(capas.avisosTraza[0], /sin coordenadas de origen ni GPS/i);
});

test('QM.2: planta recepcionada sin coordenadas ni GPS genera aviso explícito y marca sinGpsItems', () => {
  const origenes = [
    {
      id: 1,
      tipo: 'RECOLECTOR',
      folioOrigen: 'RO-1',
      nombre: 'Rec 1',
      geo: {
        referencia: { tipo: 'VARADERO', id: 1, nombre: 'Var 1', lat: -29.9, lon: -71.3 },
        gps: null,
        evaluacion: 'SIN_GPS',
      },
    },
  ];
  const planta = {
    id: 55,
    recepcionada: true,
    folio: 'PA-55',
    nombrePlanta: 'Planta Sin Coordenadas',
    geo: { referencia: null, gps: null, evaluacion: 'SIN_GPS' },
  };

  const items = normalizarEntradas({ origenes, planta });
  const capas = construirCapasMapaCadena(items);

  assert.equal(capas.lineasTrazaOrigenDestino.length, 0);
  assert.equal(capas.sinGpsItems.length, 2);
  assert.equal(capas.avisosTraza.length, 1);
  assert.match(capas.avisosTraza[0], /planta #PA-55 sin coordenadas oficiales ni GPS/i);
});

test('QM.2: cadena aún no recepcionada en planta emite aviso explícito y elegirCoordenadaEndpoint rechaza strings vacíos', () => {
  const origenes = [
    {
      id: 1,
      tipo: 'RECOLECTOR',
      folioOrigen: 'RO-1',
      geo: { gps: { lat: -29.9, lon: -71.3 } },
    },
  ];
  const items = normalizarEntradas({ origenes, planta: { recepcionada: false } });
  const capas = construirCapasMapaCadena(items, { plantaNoRecepcionada: true });

  assert.equal(capas.lineasTrazaOrigenDestino.length, 0);
  assert.equal(capas.avisosTraza.length, 1);
  assert.match(capas.avisosTraza[0], /aún no recepcionada en planta/i);
  assert.equal(elegirCoordenadaEndpoint({ geo: { gps: { lat: '', lon: -71 } } }), null);
});

test('QM.3: ponderarGrosorFlujo escala entre 2.5 y 9 px y formatearCoordenadaWgs84 usa punto decimal', () => {
  assert.equal(ponderarGrosorFlujo(0, 1000), 2.5);
  assert.equal(ponderarGrosorFlujo(1000, 1000), 9);
  const intermedio = ponderarGrosorFlujo(250, 1000);
  assert.ok(intermedio > 2.5 && intermedio < 9);
  assert.equal(formatearCoordenadaWgs84(-29.9533), '-29.953300');
  assert.equal(formatearCoordenadaWgs84('-71,335'), '');
  assert.equal(formatearCoordenadaWgs84(null), '');
});

test('QE.1 / ZE.2: construirFilasCsvFlujosOrigenDestino usa encabezados SIG <=10 chars, incluye comercializador y punto decimal WGS84', () => {
  const { headers, rows } = construirFilasCsvFlujosOrigenDestino([
    {
      origenFolio: 'RO-101',
      origenTipo: 'RECOLECTOR',
      origenFecha: '2026-10-08',
      especie: 'Huiro Negro',
      desembarqueKg: 420.5,
      capturaKg: 450,
      origenNombre: 'Caleta Coquimbo',
      origenLatitud: -29.955651,
      origenLongitud: -71.335132,
      origenFuente: 'REFERENCIA',
      comercializadorFolio: 'DC-88',
      comercializadorLatitud: -29.941234,
      comercializadorLongitud: -71.310001,
      comercializadorFuente: 'GPS_DECLARACION',
      plantaNombre: 'Planta Norte',
      plantaCodigo: 'PLA-01',
      plantaComuna: 'Coquimbo',
      plantaLatitud: -29.91,
      plantaLongitud: -71.25,
      plantaFuente: 'GPS',
      recepcionFolio: 'A-PLA-55',
      recepcionFecha: '2026-10-10',
      pesoRomanaKg: 410,
    },
    {
      origenFolio: 'DA-202',
      origenTipo: 'ARMADOR',
      origenFecha: '2026-10-09',
      especie: 'Huiro Palo',
      desembarqueKg: 300,
      capturaKg: 320,
      origenNombre: 'Caleta Sin Ref',
      origenLatitud: null,
      origenLongitud: null,
      origenFuente: 'SIN_COORDENADAS',
      comercializadorFolio: null,
      plantaNombre: 'Planta Oficial',
      plantaCodigo: 'PLA-02',
      plantaComuna: null,
      plantaLatitud: -30.123456,
      plantaLongitud: -71.654321,
      plantaFuente: 'REFERENCIA',
      recepcionFolio: 'A-PLA-56',
      recepcionFecha: '2026-10-10',
      pesoRomanaKg: 295,
    },
  ]);

  assert.equal(headers.length, 23);
  assert.equal(new Set(headers).size, 23);
  for (const h of headers) {
    assert.match(h, /^[A-Z0-9_]{1,10}$/, `Encabezado invalido para shapefile: ${h}`);
  }
  assert.equal(headers[7], 'LAT_ORI');
  assert.equal(headers[11], 'LAT_COM');
  assert.equal(headers[16], 'COM_PLA');
  assert.equal(headers[17], 'LAT_PLA');
  assert.equal(rows.length, 2);

  assert.equal(rows[0][7], '-29.955651');
  assert.equal(rows[0][8], '-71.335132');
  assert.equal(rows[0][9], 'REFERENCIA');
  assert.equal(rows[0][10], 'DC-88');
  assert.equal(rows[0][11], '-29.941234');
  assert.equal(rows[0][12], '-71.310001');
  assert.equal(rows[0][13], 'GPS_DECLARACION');
  assert.equal(rows[0][16], 'Coquimbo');
  assert.equal(rows[0][17], '-29.910000');
  assert.equal(rows[0][19], 'GPS');
  assert.ok(!rows[0][7].includes(',') && !rows[0][11].includes(',') && !rows[0][17].includes(','));

  assert.equal(rows[1][7], '');
  assert.equal(rows[1][9], 'SIN_COORDENADAS');
  assert.equal(rows[1][10], '');
  assert.equal(rows[1][11], '');
  assert.equal(rows[1][16], '');
  assert.equal(rows[1][17], '-30.123456');
  assert.equal(rows[1][19], 'REFERENCIA');
});

test('QE.2: mapearCoordenadasTransaccionCsv serializa columnas finales origen/destino en punto decimal', () => {
  assert.deepEqual(HEADERS_COORDENADAS_TRANSACCION, [
    'Latitud Origen',
    'Longitud Origen',
    'Latitud Destino',
    'Longitud Destino',
  ]);
  assert.deepEqual(
    mapearCoordenadasTransaccionCsv({
      latitudOrigen: -29.955651,
      longitudOrigen: -71.335132,
      latitudDestino: -27.0667,
      longitudDestino: null,
    }),
    ['-29.955651', '-71.335132', '-27.066700', '']
  );
});

test('ZM.2: construirTrazaFlujoRegional dibuja multi-salto por comercializadores válidos y respalda sin coordenadas', () => {
  assert.equal(esCoordenadaChileValida(-29.95, -71.33), true);
  assert.equal(esCoordenadaChileValida(null, -71.33), false);
  assert.equal(esCoordenadaChileValida(0, 0), false);
  assert.equal(esCoordenadaChileValida(95, -71.33), false);
  assert.equal(esCoordenadaChileValida(-71.33, -29.95), false); // invertida

  const flujoMulti = {
    origen: { latitud: -30.07, longitud: -71.37 },
    planta: { latitud: -27.06, longitud: -70.82 },
    comercializadores: [
      { folio: 'DC-1', latitud: -29.9, longitud: -71.25 },
      { folio: 'DC-2', latitud: null, longitud: null },
      { folio: 'DC-3', latitud: -28.5, longitud: -71.1 },
    ],
  };

  const conCom = construirTrazaFlujoRegional(flujoMulti, { pasarPorComercializador: true });
  assert.deepEqual(conCom.positions, [
    [-30.07, -71.37],
    [-29.9, -71.25],
    [-28.5, -71.1],
    [-27.06, -70.82],
  ]);
  assert.equal(conCom.pasosIntermedios.length, 2);
  assert.equal(conCom.faltaCoordenadaComercializador, true);
  assert.ok(conCom.distanciaKmTotal > 330);

  const sinCom = construirTrazaFlujoRegional(flujoMulti, { pasarPorComercializador: false });
  assert.deepEqual(sinCom.positions, [
    [-30.07, -71.37],
    [-27.06, -70.82],
  ]);
  assert.equal(sinCom.pasosIntermedios.length, 0);
  assert.equal(sinCom.faltaCoordenadaComercializador, false);
});
