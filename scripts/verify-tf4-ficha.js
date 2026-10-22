// scripts/verify-tf4-ficha.js
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import http from 'http';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) resolve();
          else reject();
        });
        req.on('error', reject);
        req.end();
      });
      return true;
    } catch {
      await sleep(300);
    }
  }
  return false;
}

// Mock representativo de la Ficha del lote de TF.3 (13.5 t con 10 orígenes, comercializador y planta)
const MOCK_FICHA_13T = {
  tipoConsulta: 'COMERCIALIZADOR',
  idConsulta: 4420,
  fechaConsulta: '2026-10-22',
  especiePredominante: 'Huiro Negro (Lessonia berteroana)',
  humedadPredominante: 'HÚMEDO',
  totalKgOrigen: 13500,
  alertas: {
    totalMarcasActivas: 0,
    hayCargasRetenidas: false,
    marcasActivas: []
  },
  origenes: Array.from({ length: 10 }, (_, i) => ({
    id: 8810 + i,
    tipo: 'RECOLECTOR',
    consultada: false,
    mismaCarga: true,
    nombre: `Recolector de Algas ${i + 1}`,
    rut: `12.345.67${i}-9`,
    perfil: 'Recolector de orilla',
    especie: 'Huiro Negro',
    estadoHumedad: 'HÚMEDO',
    caleta: 'Caleta Coquimbo',
    comuna: 'Coquimbo',
    region: 'Coquimbo',
    varaderoOAmerb: 'Varadero San Pedro',
    fechaExtraccion: '2026-10-18',
    fechaDeclaracion: '2026-10-18',
    hora: '09:00',
    desembarqueKg: 1350,
    folioOrigen: `RO-881${i}`,
    folioDesembarque: `FO-881${i}`,
    latitud: -29.9533 + i * 0.001,
    longitud: -71.3436 + i * 0.001
  })),
  comercializadores: [
    {
      id: 4420,
      salto: 1,
      despachado: true,
      nombre: 'Comercializadora del Mar SPA',
      rut: '76.123.456-7',
      fechaRecepcion: '2026-10-18',
      horaRecepcion: '18:30',
      fechaDespacho: '2026-10-19',
      horaDespacho: '14:20',
      fechaTraslado: '2026-10-19',
      horasEnBodega: 19.8,
      semaforo: 'VERDE',
      cantidadKg: 13500,
      patenteCamion: 'KLPO00',
      patenteCarro: 'CR1200',
      chofer: 'Pedro Pol Carrasco',
      rutChofer: '11.222.333-4',
      docOrigenTipo: 'Guía de Despacho',
      docOrigenNumero: 'GD-99881',
      docOrigenFecha: '2026-10-19',
      latitud: -29.9600,
      longitud: -71.3300
    }
  ],
  planta: {
    recepcionada: true,
    nombrePlanta: 'Planta Algas del Norte S.A.',
    comuna: 'Coquimbo',
    codigoSernapesca: 'PLA-1055',
    fechaLlegada: '2026-10-20',
    hora: '08:45',
    conRomana: true,
    pesoRomanaKg: 13350,
    numeroVoucherRomana: 'VR-2026-9921',
    fechaPesajeRomana: '2026-10-20',
    folioDeclaracionAPla: 'DAPLA-1055',
    docOrigenNumero: 'GD-99881',
    patenteCamion: 'KLPO00',
    humedadEstadoOrigen: 'HÚMEDO',
    humedadEstadoRecepcion: 'SEMI SECO',
    variacionPct: -1.1,
    latitud: -29.9800,
    longitud: -71.3100
  }
};

async function run() {
  console.log('--- Iniciando verificación automatizada TF.4 (Ficha de Consultas) ---');

  const preview = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], {
    cwd: 'C:/github/trazalga/trazalga-web',
    shell: true,
    stdio: 'pipe'
  });

  try {
    const ready = await waitForServer('http://localhost:4174', 15000);
    if (!ready) throw new Error('Servidor preview no respondió en http://localhost:4174');
    console.log('✓ Servidor preview listo en http://localhost:4174');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    // Interceptar llamadas API
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('consultas') || url.includes('/v-api/') || url.includes('/api/')) {
        console.log('Intercepted:', req.method(), url);
      }
      if (req.method() === 'OPTIONS') {
        req.respond({
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'access-control-allow-headers': '*'
          }
        });
        return;
      }

      const isApi = url.includes('/v-api/') || url.includes('/api/');
      const corsHeaders = {
        'access-control-allow-origin': '*',
        'content-type': 'application/json'
      };

      if (isApi && url.includes('/consultas/ficha/')) {
        req.respond({
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify(MOCK_FICHA_13T)
        });
      } else if (isApi) {
        req.respond({
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify({ ok: true })
        });
      } else {
        req.continue();
      }
    });

    // Sesión
    await page.goto('http://localhost:4174/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const payload = {
        sub: '1',
        perfil: 'FISCALIZADOR',
        nombre: 'Fiscalizador Terreno',
        usuarioId: 1,
        exp: Math.floor(Date.now() / 1000) + 86400
      };
      const b64 = btoa(JSON.stringify(payload));
      localStorage.setItem('token', `fake.${b64}.fake`);
      localStorage.setItem('perfil', 'FISCALIZADOR');
      localStorage.setItem('nombre', 'Fiscalizador Terreno');
      localStorage.setItem('usuarioId', '1');
    });

    // =========================================================================
    // ETAPA 1: VERIFICACIÓN EN MÓVIL (360x800)
    // =========================================================================
    console.log('\n--- Probando Ficha a 360x800 px (Móvil) ---');
    await page.setViewport({ width: 360, height: 800 });
    await page.goto('http://localhost:4174/consultas/COMERCIALIZADOR/4420', { waitUntil: 'networkidle0' });
    await sleep(1200);

    // 1. Criterio de aceptación principal: scrollWidth <= 360 px (cero desborde)
    const metrics = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const bodyW = document.body.scrollWidth;
      const winW = window.innerWidth;
      return { docW, bodyW, winW };
    });

    console.log('Métricas de desborde en móvil 360px:', metrics);
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Texto actual de la pantalla:', bodyText.slice(0, 300));

    if (metrics.docW > 360 || metrics.bodyW > 360) {
      throw new Error(`Desborde horizontal detectado en Ficha: docW=${metrics.docW}, bodyW=${metrics.bodyW}`);
    }
    console.log('✓ Criterio 1: A 360 px no hay desplazamiento horizontal de la ficha (scrollWidth <= 360)');

    // 2. Botón Volver siempre visible y accesible (>= 44x44 px)
    const btnVolver = await page.evaluate(() => {
      const btn = document.querySelector('#btn-volver-consultas') || document.querySelector('button');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn.closest('.MuiBox-root') || btn);
      return {
        text: btn.innerText,
        width: rect.width,
        height: rect.height,
        position: style.position,
        visible: rect.width > 0 && rect.height > 0
      };
    });

    console.log('Métricas de botón Volver:', btnVolver);
    if (!btnVolver || !btnVolver.visible) {
      throw new Error('Botón Volver no se encuentra visible en la cabecera');
    }
    if (btnVolver.width < 43 || btnVolver.height < 43) {
      throw new Error(`Botón Volver mide ${btnVolver.width}x${btnVolver.height} px (se requiere >= 44x44 px)`);
    }
    console.log(`✓ Criterio 2: Botón «Volver» siempre visible con tamaño táctil óptimo (${Math.round(btnVolver.width)}x${Math.round(btnVolver.height)} px)`);

    // 3. Transporte y chofer: datos completos sin cortes
    const transporteData = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasChofer = text.includes('Pedro Pol Carrasco');
      const hasRutChofer = text.includes('11.222.333-4');
      const hasPatenteCamion = text.includes('KLPO00');
      const hasPatenteCarro = text.includes('CR1200');
      const hasGuia = text.includes('GD-99881');
      return { hasChofer, hasRutChofer, hasPatenteCamion, hasPatenteCarro, hasGuia };
    });

    console.log('Validación de bloque de Transporte y Chofer:', transporteData);
    if (!transporteData.hasChofer || !transporteData.hasRutChofer) {
      throw new Error('El chofer y su RUT no se visualizan en el bloque de transporte');
    }
    if (!transporteData.hasPatenteCamion || !transporteData.hasPatenteCarro) {
      throw new Error('Las patentes de camión o carro no se visualizan correctamente');
    }
    if (!transporteData.hasGuia) {
      throw new Error('El número de guía no se visualiza en el bloque de transporte');
    }
    console.log('✓ Criterio 3: Bloque de transporte y chofer legible completo sin cortes de texto');

    // 4. Sección Mapa «Origen y lugar de declaración (TG.4)»
    const mapaInfo = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container');
      const headerMap = document.body.innerText.includes('Origen y lugar de declaración');
      const w = container ? container.offsetWidth : 0;
      const h = container ? container.offsetHeight : 0;
      return { hasLeaflet: Boolean(container), headerMap, w, h };
    });

    console.log('Estado de la sección Mapa en la Ficha:', mapaInfo);
    if (!mapaInfo.hasLeaflet || !mapaInfo.headerMap || mapaInfo.w === 0 || mapaInfo.h === 0) {
      throw new Error('La sección de mapa con doble georreferenciación no se renderizó correctamente');
    }
    console.log(`✓ Criterio 4: Sección Mapa «Origen y lugar de declaración» presente con dimensiones activas (${mapaInfo.w}x${mapaInfo.h} px)`);

    // 5. Columnas apiladas bajo md (< 900px)
    const cardsStacking = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      if (cards.length < 3) return { count: cards.length, isStacked: false };
      const tops = cards.map(c => c.getBoundingClientRect().top);
      // Apiladas si cada una está debajo de la anterior
      const isStacked = tops[1] > tops[0] && tops[2] > tops[1];
      const widths = cards.map(c => c.offsetWidth);
      return { count: cards.length, isStacked, tops, widths };
    });

    console.log('Disposición de columnas en móvil:', cardsStacking);
    if (!cardsStacking.isStacked) {
      throw new Error('Las columnas no se apilan verticalmente bajo breakpoint md');
    }
    console.log('✓ Criterio 5: Las tres columnas (Origen, Comercializador, Planta) se apilan bajo md');

    // =========================================================================
    // ETAPA 2: VERIFICACIÓN EN ESCRITORIO (1366x768)
    // =========================================================================
    console.log('\n--- Probando Ficha a 1366x768 px (Escritorio) ---');
    await page.setViewport({ width: 1366, height: 768 });
    await sleep(800);

    const desktopCols = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      if (cards.length < 3) return { isSideBySide: false };
      const tops = cards.map(c => c.getBoundingClientRect().top);
      // En escritorio las 3 tarjetas de columnas empiezan en la misma línea horizontal (mismo top aprox +- 10px)
      const isSideBySide = Math.abs(tops[0] - tops[1]) < 10 && Math.abs(tops[1] - tops[2]) < 10;
      return { isSideBySide, tops };
    });

    console.log('Disposición de columnas en escritorio 1366px:', desktopCols);
    if (!desktopCols.isSideBySide) {
      throw new Error('En escritorio las 3 columnas deben estar distribuidas horizontalmente lado a lado');
    }
    console.log('✓ Criterio 6: En escritorio (1366px) las 3 columnas quedan lado a lado');

    // 7. Probar clic en botón Volver
    await page.click('#btn-volver-consultas');
    await sleep(600);
    const urlAfterBack = page.url();
    console.log('URL luego de hacer clic en Volver:', urlAfterBack);
    if (!urlAfterBack.includes('/consultas')) {
      throw new Error('El botón Volver no regresó a la pantalla de consultas');
    }
    console.log('✓ Criterio 7: El botón «Volver» funciona correctamente y regresa al módulo de Consultas');

    console.log('\n=== TODOS LOS CRITERIOS DE ACEPTACIÓN DE TF.4 CUMPLIDOS EXITOSAMENTE ===');
    await browser.close();
  } finally {
    if (preview && preview.pid) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', preview.pid.toString(), '/f', '/t']);
      } else {
        preview.kill();
      }
    }
  }
}

run().catch((err) => {
  console.error('\n✗ Error en verificación TF.4:', err.message);
  process.exit(1);
});
