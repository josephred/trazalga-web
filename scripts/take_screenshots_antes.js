// trazalga-web/scripts/take_screenshots_antes.js
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = 'C:/github/trazalga/Planes/REF20261016/capturas/antes';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1366x768', width: 1366, height: 768 }
];

// Datos ficticios representativos de QA para el lote de 12 a 15 t (ej. 13.500 kg)
const MOCK_LOTE_TRAZABILIDAD = {
  nodos: [
    {
      idUnico: 'REC-101',
      tipoNodo: 'RECOLECTOR',
      folio: 'DR-8812',
      fecha: '2026-10-18',
      hora: '09:30:00',
      cantidad: 4500,
      nombreActor: 'Juan Carlos Morales',
      rutActor: '12.345.678-9',
      nombreDestinatario: 'Comercializadora del Mar SPA',
      especie: 'Huiro Negro (Lessonia berteroana)',
      estadoHumedad: 'HÚMEDO',
      caleta: 'Caleta Coquimbo',
      comuna: 'Coquimbo',
      latitud: -29.9533,
      longitud: -71.3436
    },
    {
      idUnico: 'REC-102',
      tipoNodo: 'RECOLECTOR',
      folio: 'DR-8813',
      fecha: '2026-10-18',
      hora: '10:15:00',
      cantidad: 4200,
      nombreActor: 'Manuel Antonio Rojas',
      rutActor: '13.456.789-0',
      nombreDestinatario: 'Comercializadora del Mar SPA',
      especie: 'Huiro Negro (Lessonia berteroana)',
      estadoHumedad: 'HÚMEDO',
      caleta: 'Caleta Coquimbo',
      comuna: 'Coquimbo',
      latitud: -29.9511,
      longitud: -71.3412
    },
    {
      idUnico: 'REC-103',
      tipoNodo: 'RECOLECTOR',
      folio: 'DR-8814',
      fecha: '2026-10-18',
      hora: '11:00:00',
      cantidad: 4800,
      nombreActor: 'Carlos Alberto Perez',
      rutActor: '14.567.890-1',
      nombreDestinatario: 'Comercializadora del Mar SPA',
      especie: 'Huiro Negro (Lessonia berteroana)',
      estadoHumedad: 'HÚMEDO',
      caleta: 'Caleta Guanaqueros',
      comuna: 'Coquimbo',
      latitud: -30.1982,
      longitud: -71.4215
    },
    {
      idUnico: 'COM-201',
      tipoNodo: 'COMERCIALIZADOR',
      folio: 'DC-4420',
      fecha: '2026-10-19',
      hora: '14:20:00',
      cantidad: 13500,
      nombreActor: 'Comercializadora del Mar SPA',
      rutActor: '76.123.456-7',
      nombreDestinatario: 'Planta Algas del Norte S.A.',
      especie: 'Huiro Negro (Lessonia berteroana)',
      estadoHumedad: 'SEMI HÚMEDO',
      caleta: 'Centro de Acopio Panamericana',
      comuna: 'Coquimbo',
      latitud: -29.9650,
      longitud: -71.3200
    },
    {
      idUnico: 'PLA-301',
      tipoNodo: 'PLANTA_ABASTECIMIENTO',
      folio: 'DPA-1055',
      fecha: '2026-10-20',
      hora: '08:45:00',
      cantidad: 13350,
      nombreActor: 'Planta Algas del Norte S.A.',
      rutActor: '96.888.777-K',
      nombreDestinatario: 'Planta Procesamiento Principal',
      especie: 'Huiro Negro (Lessonia berteroana)',
      estadoHumedad: 'SEMI SECO',
      caleta: 'Sector Industrial La Cantera',
      comuna: 'Coquimbo',
      latitud: -29.9800,
      longitud: -71.3100
    }
  ],
  enlaces: [
    { source: 'REC-101', target: 'COM-201', label: '4.500 kg' },
    { source: 'REC-102', target: 'COM-201', label: '4.200 kg' },
    { source: 'REC-103', target: 'COM-201', label: '4.800 kg' },
    { source: 'COM-201', target: 'PLA-301', label: '13.500 kg (Guía 5512)' }
  ]
};

const MOCK_REPORTES_LISTA = [
  {
    id: 1055,
    folio: 'DPA-1055',
    fecha: '2026-10-20',
    hora: '08:45',
    emisorNombre: 'Comercializadora del Mar SPA',
    emisorRut: '76.123.456-7',
    receptorNombre: 'Planta Algas del Norte S.A.',
    receptorRut: '96.888.777-K',
    especie: 'Huiro Negro',
    cantidad: 13500,
    tipoReporte: 'abastecimiento',
    plantaAbastecimiento: 'Planta Algas del Norte',
    plantaProduccion: '-',
    fechaPlantaAbastecimiento: '2026-10-20'
  },
  {
    id: 4420,
    folio: 'DC-4420',
    fecha: '2026-10-19',
    hora: '14:20',
    emisorNombre: 'Juan Carlos Morales',
    emisorRut: '12.345.678-9',
    receptorNombre: 'Comercializadora del Mar SPA',
    receptorRut: '76.123.456-7',
    especie: 'Huiro Negro',
    cantidad: 4500,
    tipoReporte: 'comercializador',
    plantaAbastecimiento: '-',
    plantaProduccion: '-'
  }
];

const MOCK_FICHA = {
  tipoConsulta: 'RECOLECTOR',
  idConsulta: 8812,
  alertas: {
    totalMarcasActivas: 2,
    hayCargasRetenidas: false,
    marcas: [
      {
        id: 1,
        marca: 'DESEMBARQUE_ATIPICO',
        descripcion: 'Desembarque de 4.500 kg supera umbral estadístico 3-sigma (máx esperado 2.800 kg)',
        indicador: 'Indicador 1',
        estadoGestion: 'PENDIENTE',
        createdAt: '2026-10-18T09:30:00'
      },
      {
        id: 2,
        marca: 'ORIGEN_GEO_INCONSISTENTE',
        descripcion: 'Distancia entre coordenadas GPS (-29.9533, -71.3436) y caleta declarada es de 4.2 km',
        indicador: 'Indicador 9',
        estadoGestion: 'PENDIENTE',
        createdAt: '2026-10-18T09:30:00'
      }
    ],
    retenciones: []
  },
  origenes: [
    {
      tipo: 'RECOLECTOR',
      id: 8812,
      folio: 'DR-8812',
      fechaDeclaracion: '2026-10-18',
      hora: '09:30:00',
      titular: 'Juan Carlos Morales',
      rutTitular: '12.345.678-9',
      caleta: 'Caleta Coquimbo',
      comuna: 'Coquimbo',
      especie: 'Huiro Negro',
      kilos: 4500,
      humedad: 'HÚMEDO',
      latitud: -29.9533,
      longitud: -71.3436
    }
  ],
  comercializadores: [
    {
      id: 4420,
      folio: 'DC-4420',
      fechaDeclaracion: '2026-10-19',
      hora: '14:20:00',
      comercializador: 'Comercializadora del Mar SPA',
      rut: '76.123.456-7',
      chofer: 'Pedro Pol',
      rutChofer: '11.222.333-4',
      patente: 'KLPO00',
      kilos: 13500,
      humedad: 'SEMI HÚMEDO',
      origenUbicacion: 'Coquimbo'
    }
  ],
  planta: {
    id: 1055,
    folio: 'DPA-1055',
    fechaIngreso: '2026-10-20',
    hora: '08:45:00',
    nombrePlanta: 'Planta Algas del Norte S.A.',
    rutPlanta: '96.888.777-K',
    kilosRecepcionados: 13350,
    pesoRomana: 13350,
    voucherRomana: 'VR-2026-9921',
    humedadRecepcion: 'SEMI SECO',
    variacionPesoPct: -1.11,
    semaforo: 'VERDE'
  }
};

const MOCK_HALLAZGOS = [
  {
    id: 101,
    marca: 'DESEMBARQUE_ATIPICO',
    indicador: 'Indicador 1',
    declaracionId: 8812,
    tipoDeclaracion: 'RECOLECTOR',
    actorNombre: 'Juan Carlos Morales',
    actorRut: '12.345.678-9',
    descripcion: 'Volumen 4.500 kg supera umbral de desviación estadística (umbral 2.800 kg)',
    estadoGestion: 'PENDIENTE',
    fechaDeclaracion: '2026-10-18',
    criterioParametro: 'desembarque_atipico_sigma',
    criterioUmbral: 2800.0,
    criterioValor: 4500.0,
    criterioUnidad: 'kg',
    created_at: '2026-10-18 09:35:00'
  },
  {
    id: 102,
    marca: 'ORIGEN_GEO_INCONSISTENTE',
    indicador: 'Indicador 9',
    declaracionId: 8812,
    tipoDeclaracion: 'RECOLECTOR',
    actorNombre: 'Juan Carlos Morales',
    actorRut: '12.345.678-9',
    descripcion: 'Distancia 4.2 km entre GPS capturado y referencia declarada',
    estadoGestion: 'PENDIENTE',
    fechaDeclaracion: '2026-10-18',
    criterioParametro: 'origen_geo_distancia_max_km',
    criterioUmbral: 2.0,
    criterioValor: 4.2,
    criterioUnidad: 'km',
    created_at: '2026-10-18 09:35:10'
  },
  {
    id: 103,
    marca: 'CUOTA_EXCEDIDA',
    indicador: 'Indicador 3',
    declaracionId: 7701,
    tipoDeclaracion: 'RECOLECTOR',
    actorNombre: 'Asociación Gremial Coquimbo',
    actorRut: '65.432.109-8',
    descripcion: 'Consumo supera límite comunal autorizado para el mes',
    estadoGestion: 'PENDIENTE',
    fechaDeclaracion: '2026-10-17',
    criterioParametro: 'cuota_extraccion_kg',
    criterioUmbral: 50000.0,
    criterioValor: 51200.0,
    criterioUnidad: 'kg',
    created_at: '2026-10-17 17:10:00'
  }
];

const MOCK_RESUMEN_HALLAZGOS = {
  totalPendientes: 3,
  totalResueltas: 1,
  totalEnCitacion: 0,
  porMarca: {
    DESEMBARQUE_ATIPICO: 1,
    ORIGEN_GEO_INCONSISTENTE: 1,
    CUOTA_EXCEDIDA: 1
  }
};

const MOCK_RESUMEN_GLOBAL = {
  declaracionesTotales: 14954,
  volumenTotal: 1254300,
  alertasActivas: 3,
  casosAbiertos: 1,
  inconsistenciasPct: 1.8,
  actoresFiscalizados: 342,
  totalArmador: 1572
};

async function main() {
  console.log('Iniciando captura de pantallas antes (TB.3)...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/reportes/trazabilidad/')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_LOTE_TRAZABILIDAD)
        });
      } else if (url.includes('/reportes/resumen-global')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RESUMEN_GLOBAL)
        });
      } else if (url.includes('/reportes?')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_REPORTES_LISTA)
        });
      } else if (url.includes('/consultas/ficha/')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_FICHA)
        });
      } else if (url.includes('/api/declaracion-marcas/resumen')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RESUMEN_HALLAZGOS)
        });
      } else if (url.includes('/api/declaracion-marcas')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_HALLAZGOS)
        });
      } else if (url.includes('/api/public/patentes/')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            patente: 'KLPO00',
            vigente: true,
            fechaHoraDeclaracion: '2026-10-19 14:20:00',
            especie: 'Huiro Negro'
          })
        });
      } else {
        req.continue();
      }
    });

    // Inyectar sesión en localStorage en el dominio local
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const payload = {
        sub: '1',
        perfil: 'FISCALIZADOR',
        nombre: 'Fiscalizador Sernapesca',
        usuarioId: 1,
        exp: Math.floor(Date.now() / 1000) + 86400
      };
      const b64 = btoa(JSON.stringify(payload));
      const token = `fake.${b64}.fake`;
      localStorage.setItem('token', token);
      localStorage.setItem('perfil', 'FISCALIZADOR');
      localStorage.setItem('nombre', 'Fiscalizador Sernapesca');
      localStorage.setItem('usuarioId', '1');
    });

    const screens = [
      {
        id: 'tablero',
        url: 'http://localhost:5173/dashboard',
        readySelector: '.MuiContainer-root',
        action: async () => {
          await sleep(1000);
        }
      },
      {
        id: 'consola_hallazgos',
        url: 'http://localhost:5173/alertas',
        readySelector: 'table',
        action: async () => {
          await sleep(1000);
        }
      },
      {
        id: 'consultas_ficha',
        url: 'http://localhost:5173/consultas/RECOLECTOR/8812',
        readySelector: '.MuiCard-root',
        action: async () => {
          await sleep(1000);
        }
      },
      {
        id: 'reportes_modal_lote',
        url: 'http://localhost:5173/reportes',
        readySelector: '.MuiContainer-root',
        action: async () => {
          // Generar reporte o simular clic en fila para abrir modal sobre lote 13.5 t
          await page.evaluate(() => {
            const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Buscar') || b.innerText.includes('Generar'));
            if (btn) btn.click();
          });
          await sleep(1200);
          // Hacer clic en la primera fila de la tabla para abrir el modal de trazabilidad
          await page.evaluate(() => {
            const firstRow = document.querySelector('tbody tr');
            if (firstRow) firstRow.click();
          });
          await sleep(1500);
        }
      },
      {
        id: 'detalle_declaracion',
        url: 'http://localhost:5173/reportes',
        readySelector: '.MuiContainer-root',
        action: async () => {
          // Asegurar modal abierto y luego abrir panel de detalle
          await page.evaluate(() => {
            const firstRow = document.querySelector('tbody tr');
            if (firstRow) firstRow.click();
          });
          await sleep(1200);
          // Clic en un nodo o botón de ver detalle
          await page.evaluate(() => {
            const detailBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Detalle') || b.title?.includes('detalle'));
            if (detailBtn) detailBtn.click();
          });
          await sleep(1000);
        }
      },
      {
        id: 'consulta_publica',
        url: 'http://localhost:5173/consulta-patente',
        readySelector: 'input',
        action: async () => {
          await page.evaluate(() => {
            const input = document.querySelector('input');
            if (input) {
              input.value = 'KLPO00';
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Consultar') || b.innerText.includes('Buscar'));
            if (btn) btn.click();
          });
          await sleep(1000);
        }
      }
    ];

    for (const vp of VIEWPORTS) {
      console.log(`\n--- Configurando Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      await page.setViewport({ width: vp.width, height: vp.height });

      for (const scr of screens) {
        console.log(`Capturando pantalla: ${scr.id} a ${vp.name}...`);
        await page.goto(scr.url, { waitUntil: 'networkidle0' });
        try {
          if (scr.readySelector) {
            await page.waitForSelector(scr.readySelector, { timeout: 4000 });
          }
        } catch (e) {
          // continuar si timeout suave
        }

        if (scr.action) {
          try {
            await scr.action();
          } catch (e) {
            console.warn(`Aviso en acción de ${scr.id}:`, e.message);
          }
        }

        const filename = `${scr.id}_${vp.name}.png`;
        const filePath = path.join(OUTPUT_DIR, filename);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`✓ Guardada captura: ${filePath}`);
      }
    }

    console.log('\n¡Todas las capturas «antes» (24 archivos) fueron generadas exitosamente!');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Error durante la toma de capturas:', err);
  process.exit(1);
});
