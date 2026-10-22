// scripts/verify-grid.js
// Guarda de integración continua para asegurar que ningún componente utilice
// la API antigua de Grid (item, xs=, sm=, md=, lg=, xl=) eliminada en MUI 7.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

function verify() {
  console.log('--- Verificando componentes Grid para MUI 7 (TF.1) ---');
  const files = walk(SRC_DIR);
  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes('<Grid')) continue;

      const hasItem = /<Grid\s+[^>]*\bitem\b/.test(line);
      const hasOldBps = /<Grid\s+[^>]*\b(xs|sm|md|lg|xl)\s*=/.test(line);

      if (hasItem || hasOldBps) {
        const rel = path.relative(path.resolve(__dirname, '..'), file);
        violations.push({
          file: rel,
          line: i + 1,
          content: line.trim(),
          issue: hasItem && hasOldBps ? 'Usa "item" y props de tamaño heredadas (xs/sm/md/lg/xl)' : hasItem ? 'Usa la prop obsoleta "item"' : 'Usa props de tamaño heredadas sin size={{ ... }}'
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error(`\n❌ Error: Se encontraron ${violations.length} usos de la API obsoleta de Grid:`);
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} [${v.issue}]`);
      console.error(`    ${v.content}`);
    }
    console.error('\nEn MUI 7, <Grid item xs={12} md={6}> debe reemplazarse por <Grid size={{ xs: 12, md: 6 }}>.');
    console.error('Ejecuta "node scripts/migrate-grid.js" para migrar automáticamente.\n');
    process.exit(1);
  }

  console.log('✓ 100% de los componentes Grid verificados: ninguna prop "item" ni "xs/sm/md/lg/xl" encontrada.');
  console.log('✓ Todos los Grids utilizan la API v2 de MUI 7 (size={{ ... }}).');
}

verify();
