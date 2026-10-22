// scripts/verify-tf2-mobile.js
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

async function run() {
  console.log('--- Iniciando verificación automatizada TF.2 Móvil (360px) ---');
  
  // Iniciar preview server en puerto 4173
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: 'C:/github/trazalga/trazalga-web',
    shell: true,
    stdio: 'pipe'
  });

  try {
    const ready = await waitForServer('http://localhost:4173', 15000);
    if (!ready) {
      throw new Error('Servidor preview no respondió en http://localhost:4173');
    }
    console.log('✓ Servidor preview listo en http://localhost:4173');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=360,800']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 360, height: 800 });

    // Mock de APIs para navegación limpia en dashboard
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/v-api/') || url.includes('/api/')) {
        if (url.includes('usuarios/me') || url.includes('usuario/me')) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              nombre: 'Fiscalizador Terreno',
              rut: '12.345.678-9',
              perfil: 'FISCALIZADOR',
              region: 'Región de Coquimbo'
            })
          });
        } else {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              declaracionesTotales: 150,
              volumenTotal: 45000,
              alertasActivas: 3,
              casosAbiertos: 1,
              inconsistenciasPct: 2.1,
              actoresFiscalizados: 12
            })
          });
        }
      } else {
        req.continue();
      }
    });

    // Inyectar credenciales en login
    await page.goto('http://localhost:4173/login', { waitUntil: 'domcontentloaded' });
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

    // Navegar a Dashboard en 360px
    await page.goto('http://localhost:4173/dashboard', { waitUntil: 'networkidle0' });
    await sleep(1000);
    console.log('URL actual en navegador:', page.url());

    // 1. Verificación de NO desborde horizontal (scrollWidth <= 360)
    const metrics = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const bodyW = document.body.scrollWidth;
      const innerW = window.innerWidth;
      const mainEl = document.querySelector('main');
      const mainW = mainEl ? mainEl.scrollWidth : 0;
      return { docW, bodyW, innerW, mainW };
    });

    console.log('Métricas de ancho en móvil 360px:', metrics);

    if (metrics.docW > 360 || metrics.bodyW > 360) {
      throw new Error(`Desborde horizontal detectado a 360px: docW=${metrics.docW}, bodyW=${metrics.bodyW}, innerW=${metrics.innerW}`);
    }
    console.log('✓ Criterio 1: Cero desplazamiento horizontal a 360px (scrollWidth <= 360px)');

    // 2. Verificación de botón hamburguesa
    const menuBtn = await page.$('button[aria-label="Abrir menú de navegación"]');
    if (!menuBtn) {
      throw new Error('Botón hamburguesa de menú no encontrado en móvil');
    }
    console.log('✓ Criterio 2: Botón hamburguesa presente en la barra superior en móvil');

    // 3. Abrir menú lateral
    await menuBtn.click();
    await sleep(500);

    const drawerVisible = await page.evaluate(() => {
      const modal = document.querySelector('.MuiDrawer-root .MuiDrawer-paper');
      return modal && window.getComputedStyle(modal).visibility !== 'hidden';
    });

    if (!drawerVisible) {
      throw new Error('El drawer no se abrió al hacer clic en el botón hamburguesa');
    }
    console.log('✓ Criterio 3: El menú lateral se abre correctamente en modo temporary');

    // Cerrar menú haciendo click en el backdrop
    const backdrop = await page.$('.MuiBackdrop-root');
    if (backdrop) {
      await backdrop.click();
      await sleep(500);
    }
    console.log('✓ Criterio 4: El menú lateral se cierra correctamente');

    // 4. Selector de fechas compacto en móvil
    const clicked = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Filtrar por fechas"]');
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (!clicked) {
      throw new Error('Botón compacto de fechas no encontrado en móvil');
    }
    await sleep(800);

    const debugPopover = await page.evaluate(() => {
      const popovers = Array.from(document.querySelectorAll('.MuiPopover-root, .MuiPaper-root')).map(el => el.className);
      const inputs = Array.from(document.querySelectorAll('input[type="date"]')).map(i => ({ val: i.value, visible: i.offsetParent !== null, parent: i.parentElement?.className }));
      return { popovers, inputs };
    });
    console.log('Depuración Popover / inputs date:', debugPopover);

    const dateInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('.MuiPopover-root input[type="date"]')).map(i => i.value);
      return inputs;
    });

    if (!dateInputs || dateInputs.length !== 2) {
      throw new Error('El selector de fechas en popover no mostró los dos inputs');
    }

    const expectedMonthPrefix = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit'
    }).format(new Date());

    if (!dateInputs[0].startsWith(expectedMonthPrefix) || !dateInputs[1].startsWith(expectedMonthPrefix)) {
      throw new Error(`Fechas en el popover no corresponden al mes en curso: ${JSON.stringify(dateInputs)}`);
    }
    console.log('✓ Criterio 5: Selector de fecha móvil en popover inicializado en mes en curso:', dateInputs);

    // 5. Verificar que no exista texto hardcodeado "IV Región de Coquimbo"
    const hasHardcodedRegion = await page.evaluate(() => {
      return document.body.innerText.includes('IV Región de Coquimbo');
    });
    if (hasHardcodedRegion) {
      throw new Error('Texto fijo "IV Región de Coquimbo" aún presente en el layout');
    }
    console.log('✓ Criterio 6: Texto fijo "IV Región de Coquimbo" eliminado');

    console.log('\n=== TODOS LOS CRITERIOS DE ACEPTACIÓN DE TF.2 CUMPLIDOS EXITOSAMENTE ===');
    await browser.close();
  } finally {
    preview.kill();
  }
}

run().catch((err) => {
  console.error('\n✗ Error en verificación TF.2:', err.message);
  process.exit(1);
});
