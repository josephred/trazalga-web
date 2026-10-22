// scripts/verify-tf5-reportes.js
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

const MOCK_REPORT_DATA = [
  {
    id: 4420,
    folio: 'DC-4420',
    fecha: '2026-10-19',
    hora: '14:20',
    emisorNombre: 'Comercializadora del Mar SPA',
    emisorRut: '76.123.456-7',
    receptorNombre: 'Planta Algas del Norte S.A.',
    receptorRut: '77.888.999-1',
    especie: 'Huiro Negro',
    cantidad: 13500,
    tipoReporte: 4,
    plantaAbastecimiento: 'Planta Algas del Norte',
    fechaComercializador: '2026-10-19',
    plantaProduccion: 'Planta Algas del Norte',
    fechaPlantaAbastecimiento: '2026-10-20'
  },
  {
    id: 8810,
    folio: 'RO-8810',
    fecha: '2026-10-18',
    hora: '09:00',
    emisorNombre: 'Recolector de Algas 1',
    emisorRut: '12.345.670-9',
    receptorNombre: 'Comercializadora del Mar SPA',
    receptorRut: '76.123.456-7',
    especie: 'Huiro Negro',
    cantidad: 1350,
    tipoReporte: 1,
  }
];

const MOCK_TRAZA_4420 = {
  id: 4420,
  tipoReporte: 'COMERCIALIZADOR',
  totalKg: 13500,
  especie: 'Huiro Negro',
  alertas: { totalMarcasActivas: 0, hayCargasRetenidas: false, marcasActivas: [] },
  nodos: [
    {
      id: 'origen-8810',
      type: 'origen',
      data: {
        label: 'Recolector 1',
        tipo: 'RECOLECTOR',
        kg: 1350,
        rut: '12.345.670-9',
        folio: 'RO-8810',
        especie: 'Huiro Negro',
        caleta: 'Caleta Coquimbo',
        latitud: -29.9533,
        longitud: -71.3436
      }
    },
    {
      id: 'com-4420',
      type: 'comercializador',
      data: {
        label: 'Comercializadora del Mar',
        tipo: 'COMERCIALIZADOR',
        kg: 13500,
        rut: '76.123.456-7',
        folio: 'DC-4420',
        chofer: 'Pedro Pol Carrasco',
        patenteCamion: 'KLPO00',
        guiaDespacho: 'GD-99881',
        latitud: -29.9600,
        longitud: -71.3300
      }
    }
  ],
  edges: [
    { id: 'e1', source: 'origen-8810', target: 'com-4420' }
  ]
};

async function run() {
  console.log('--- Iniciando verificación automatizada TF.5 (Reportes: Filtro y Tabla) ---');

  const preview = spawn('npx', ['vite', 'preview', '--port', '4175', '--strictPort'], {
    cwd: 'C:/github/trazalga/trazalga-web',
    shell: true,
    stdio: 'pipe'
  });

  try {
    const ready = await waitForServer('http://localhost:4175', 15000);
    if (!ready) throw new Error('Servidor preview no respondió en http://localhost:4175');
    console.log('✓ Servidor preview listo en http://localhost:4175');

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

      const isApi = url.includes('/v-api/') || url.includes('/api/') || url.includes(':8080');
      if (isApi) {
        console.log('Intercepted API request:', req.method(), url);
      }
      const corsHeaders = {
        'access-control-allow-origin': '*',
        'content-type': 'application/json'
      };

      if (isApi && (url.includes('/reportes/generar') || url.includes('/reportes'))) {
        req.respond({
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify(MOCK_REPORT_DATA)
        });
      } else if (isApi && (url.includes('/trazabilidad/') || url.includes('/grafo'))) {
        req.respond({
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify(MOCK_TRAZA_4420)
        });
      } else if (isApi && (url.includes('/usuarios') || url.includes('/plantas'))) {
        req.respond({
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify([
            { id: 1, nombre: 'Comercializadora del Mar SPA', rut: '76.123.456-7', perfilId: 4, perfilNombre: 'Comercializador' }
          ])
        });
      } else if (isApi) {
        req.respond({
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify({ ok: true, perfil: 'FISCALIZADOR', nombre: 'Fiscalizador Terreno' })
        });
      } else {
        req.continue();
      }
    });

    // Sesión
    await page.goto('http://localhost:4175/login', { waitUntil: 'domcontentloaded' });
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
    console.log('\n--- Probando Reportes a 360x800 px (Móvil) ---');
    await page.setViewport({ width: 360, height: 800 });
    await page.goto('http://localhost:4175/reportes', { waitUntil: 'networkidle0' });
    await sleep(1000);

    // 1. Criterio de desborde horizontal general: scrollWidth <= 360
    const scrollMetrics = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth,
      bodyW: document.body.scrollWidth,
      winW: window.innerWidth
    }));
    console.log('Métricas de ancho en móvil 360px:', scrollMetrics);
    if (scrollMetrics.docW > 360 || scrollMetrics.bodyW > 360) {
      throw new Error(`Desborde horizontal detectado en Reportes: docW=${scrollMetrics.docW}`);
    }
    console.log('✓ Criterio 1: Cero desborde horizontal en Reportes (scrollWidth <= 360)');

    // 2. Filtro: ReportFilter se apila verticalmente bajo sm
    const inputsFound = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input, select, button, .MuiSelect-select')).map(el => ({
        tag: el.tagName,
        id: el.id,
        text: el.innerText || el.value,
        className: el.className
      }))
    );
    console.log('Inputs/Botones encontrados:', inputsFound);

    const filterStacking = await page.evaluate(() => {
      const fInicio = document.querySelector('#filter-fecha-inicio')?.getBoundingClientRect();
      const fFin = document.querySelector('#filter-fecha-fin')?.getBoundingClientRect();
      const fTipo = document.querySelector('#filter-tipo-reporte')?.getBoundingClientRect();
      const btnBuscar = document.querySelector('#btn-generar-reporte')?.getBoundingClientRect();

      if (!fInicio || !fFin || !fTipo || !btnBuscar) {
        return { isStacked: false, missing: true };
      }

      // En móvil, fFin está debajo de fInicio, fTipo debajo de fFin, y btnBuscar debajo
      const isStacked = (fFin.top > fInicio.bottom - 5) &&
                        (fTipo.top > fFin.bottom - 5) &&
                        (btnBuscar.top > fTipo.bottom - 5);

      return {
        isStacked,
        btnWidth: btnBuscar.width,
        btnHeight: btnBuscar.height,
        fInicioTop: fInicio.top,
        fFinTop: fFin.top,
        fTipoTop: fTipo.top,
        btnTop: btnBuscar.top
      };
    });

    console.log('Disposición de ReportFilter en móvil:', filterStacking);
    if (!filterStacking.isStacked) {
      throw new Error('ReportFilter no se apila verticalmente bajo breakpoint sm');
    }
    if (filterStacking.btnWidth < 280) {
      throw new Error(`El botón Buscar no ocupa el ancho en móvil: mide ${filterStacking.btnWidth}px`);
    }
    if (filterStacking.btnHeight < 43) {
      throw new Error(`El botón Buscar tiene altura táctil menor a 44px: ${filterStacking.btnHeight}px`);
    }
    console.log(`✓ Criterio 2: ReportFilter apilado verticalmente bajo sm con botón Buscar a ancho completo (${Math.round(filterStacking.btnWidth)}x${Math.round(filterStacking.btnHeight)} px)`);

    // 3. Ejecutar búsqueda para poblar la tabla con datos
    // Seleccionar tipo de reporte para habilitar botón
    console.log('Abriendo selector de tipo de reporte...');
    await page.click('#filter-tipo-reporte');
    await page.waitForSelector('li.MuiMenuItem-root', { visible: true, timeout: 5000 });
    const menuItems = await page.$$('li.MuiMenuItem-root');
    console.log(`Encontradas ${menuItems.length} opciones en el menú.`);
    if (menuItems.length > 0) {
      await menuItems[0].click();
    }
    await sleep(500);

    // Esperar que el botón Buscar esté habilitado
    await page.waitForSelector('#btn-generar-reporte:not([disabled])', { timeout: 5000 });
    console.log('Haciendo clic en Buscar...');
    await page.click('#btn-generar-reporte');
    await sleep(1500);

    // 4. Tabla: Bajo sm, DataTable se muestra como tarjetas interactivas (no como table con scroll horizontal)
    const debugTexts = await page.evaluate(() => {
      const allText = document.body.innerText;
      const papers = Array.from(document.querySelectorAll('.MuiPaper-root')).map(p => p.innerText.slice(0, 100));
      return { allText: allText.slice(0, 500), papers };
    });
    console.log('Textos en pantalla luego de buscar:', debugTexts);

    const mobileTableStatus = await page.evaluate(() => {
      const hasTable = Boolean(document.querySelector('table.MuiTable-root'));
      const cards = Array.from(document.querySelectorAll('.MuiPaper-root')).filter(p => {
        const text = p.innerText || '';
        return text.includes('ID: #') && text.includes('kg');
      });

      const firstCard = cards[0];
      const cardData = firstCard ? {
        text: firstCard.innerText,
        hasFolio: firstCard.innerText.includes('DC-4420'),
        hasFecha: firstCard.innerText.includes('2026-10-19'),
        hasEmisor: firstCard.innerText.includes('Comercializadora del Mar'),
        hasEspecie: firstCard.innerText.includes('Huiro Negro'),
        hasKg: firstCard.innerText.includes('13.500 kg')
      } : null;

      return {
        hasTable,
        cardsCount: cards.length,
        cardData
      };
    });

    console.log('Estado de DataTable en móvil:', mobileTableStatus);
    if (mobileTableStatus.hasTable) {
      throw new Error('DataTable no debe renderizar elemento <table> en móvil (< sm), debe usar tarjetas');
    }
    if (mobileTableStatus.cardsCount === 0) {
      throw new Error('No se encontraron tarjetas móviles de reporte');
    }
    const cd = mobileTableStatus.cardData;
    if (!cd.hasFolio || !cd.hasFecha || !cd.hasEmisor || !cd.hasEspecie || !cd.hasKg) {
      throw new Error(`La tarjeta móvil no contiene todos los campos requeridos (folio, fecha, emisor, especie, kg): ${JSON.stringify(cd)}`);
    }
    console.log(`✓ Criterio 3: Bajo sm, DataTable se muestra como tarjetas (${mobileTableStatus.cardsCount} tarjetas con folio, fecha, emisor, especie y kg)`);

    // 5. Botón de descarga de CSV ocupa todo el ancho
    const csvBtnMetrics = await page.evaluate(() => {
      const btn = document.querySelector('#btn-descargar-csv');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      const parentRect = btn.parentElement?.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        parentWidth: parentRect?.width,
        isFullWidth: rect.width >= (parentRect?.width || 0) * 0.95
      };
    });

    console.log('Métricas de botón Descargar CSV en móvil:', csvBtnMetrics);
    if (!csvBtnMetrics || !csvBtnMetrics.isFullWidth) {
      throw new Error(`El botón de descarga CSV no ocupa todo el ancho en móvil: ancho=${csvBtnMetrics?.width}px, padre=${csvBtnMetrics?.parentWidth}px`);
    }
    if (csvBtnMetrics.height < 43) {
      throw new Error(`El botón CSV tiene altura menor a 44px: ${csvBtnMetrics.height}px`);
    }
    console.log(`✓ Criterio 4: El botón de CSV ocupa todo el ancho en móvil (${Math.round(csvBtnMetrics.width)}x${Math.round(csvBtnMetrics.height)} px)`);

    // 6. Tocar una tarjeta abre el modal de trazabilidad (TrazabilidadDialog)
    console.log('Tocando tarjeta para abrir TrazabilidadDialog...');
    const cardHandle = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('.MuiPaper-root')).find(p => {
        const text = p.innerText || '';
        return text.includes('ID: #4420') && text.includes('DC-4420');
      });
    });
    if (cardHandle) {
      await cardHandle.click();
    }
    await sleep(1000);

    const dialogStatus = await page.evaluate(() => {
      const dialog = document.querySelector('.MuiDialog-paper');
      if (!dialog) return { open: false };
      const isFullScreen = dialog.classList.contains('MuiDialog-paperFullScreen') ||
                           window.getComputedStyle(dialog).width === `${window.innerWidth}px`;
      const title = dialog.querySelector('h2, .MuiDialogTitle-root')?.innerText;
      return { open: true, isFullScreen, title };
    });

    console.log('Estado de modal al tocar tarjeta:', dialogStatus);
    if (!dialogStatus.open) {
      throw new Error('Al tocar la tarjeta no se abrió el diálogo de trazabilidad');
    }
    console.log('✓ Criterio 5: Tocar una tarjeta abre el modal de trazabilidad');

    // Cerrar el modal
    const closeBtn = await page.$('#btn-cerrar-trazabilidad-dialog');
    if (closeBtn) await closeBtn.click();
    await sleep(500);

    // =========================================================================
    // ETAPA 2: VERIFICACIÓN EN ESCRITORIO (1366x768)
    // =========================================================================
    console.log('\n--- Probando Reportes a 1366x768 px (Escritorio) ---');
    await page.setViewport({ width: 1366, height: 768 });
    await sleep(800);

    const desktopStatus = await page.evaluate(() => {
      const hasTable = Boolean(document.querySelector('table.MuiTable-root'));
      const headerCells = Array.from(document.querySelectorAll('th.MuiTableCell-head')).map(th => th.innerText);
      const csvBtn = document.querySelector('#btn-descargar-csv')?.getBoundingClientRect();
      return {
        hasTable,
        headerCells,
        csvBtnWidth: csvBtn ? csvBtn.width : 0
      };
    });

    console.log('Estado de Reportes en escritorio 1366px:', desktopStatus);
    if (!desktopStatus.hasTable) {
      throw new Error('En escritorio (>= sm) DataTable debe renderizar la vista de tabla con <table>');
    }
    if (!desktopStatus.headerCells.includes('ID/Folio') || !desktopStatus.headerCells.includes('Especie Declarada')) {
      throw new Error('La tabla en escritorio no contiene las columnas requeridas');
    }
    console.log('✓ Criterio 6: En escritorio (1366px) DataTable renderiza la tabla tradicional completa con encabezados');

    console.log('\n=== TODOS LOS CRITERIOS DE ACEPTACIÓN DE TF.5 CUMPLIDOS EXITOSAMENTE ===');
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
  console.error('\n✗ Error en verificación TF.5:', err.message);
  process.exit(1);
});
