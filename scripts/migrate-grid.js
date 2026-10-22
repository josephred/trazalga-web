// scripts/migrate-grid.js
// Migración automática de Grid v1 (item, xs, sm, md, lg, xl) a Grid v2 (size={{ ... }}) para MUI 7.
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

function transformTag(fullTag) {
  if (!fullTag.startsWith('<Grid') || (!fullTag.includes('item') && !/\b(xs|sm|md|lg|xl)=/.test(fullTag))) {
    return fullTag;
  }

  const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
  const sizes = [];
  let tagContent = fullTag;

  for (const bp of breakpoints) {
    // Coincide con bp={12}, bp="12", bp={'12'}, etc.
    const regex = new RegExp(`\\b${bp}\\s*=\\s*(?:\\{([^}]+)\\}|"([^"]+)"|'([^']+)')\\s*`);
    const match = tagContent.match(regex);
    if (match) {
      const val = (match[1] || match[2] || match[3]).trim();
      sizes.push(`${bp}: ${val}`);
      tagContent = tagContent.replace(regex, '');
    }
  }

  // Quitar la prop 'item'
  tagContent = tagContent.replace(/\bitem\b\s*/g, '');

  // Si encontramos breakpoints, armar size={{ ... }}
  if (sizes.length > 0) {
    const sizeProp = `size={{ ${sizes.join(', ')} }} `;
    tagContent = tagContent.replace(/^<Grid\s*/, `<Grid ${sizeProp}`);
  }

  // Normalizar espacios múltiples
  tagContent = tagContent.replace(/\s{2,}/g, ' ');
  tagContent = tagContent.replace(/\s+>/, '>');
  tagContent = tagContent.replace(/\s+\/>/, ' />');

  return tagContent;
}

function migrate() {
  const files = walk(SRC_DIR);
  let totalMigratedFiles = 0;
  let totalTagsMigrated = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    let tagsInFile = 0;

    const modified = original.replace(/<Grid\s+[^>]+>/g, (tag) => {
      const transformed = transformTag(tag);
      if (transformed !== tag) {
        tagsInFile++;
      }
      return transformed;
    });

    if (tagsInFile > 0) {
      fs.writeFileSync(file, modified, 'utf8');
      totalMigratedFiles++;
      totalTagsMigrated += tagsInFile;
      const rel = path.relative(path.resolve(__dirname, '..'), file);
      console.log(`✓ ${rel} (${tagsInFile} etiquetas Grid migradas)`);
    }
  }

  console.log(`\nMigración finalizada con éxito: ${totalTagsMigrated} etiquetas migradas en ${totalMigratedFiles} archivos.`);
}

migrate();
