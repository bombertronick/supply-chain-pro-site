import { transformSync } from 'esbuild';
import { readFileSync } from 'fs';
const file = process.argv[2];
if (!file) { console.error('usage: node validate.mjs <file.jsx>'); process.exit(2); }
const src = readFileSync(file, 'utf8');
try {
  transformSync(src, { loader: 'jsx', jsx: 'transform', format: 'esm', sourcefile: file });
  console.log('SYNTAX OK:', file, '(' + src.length + ' chars)');
} catch (e) {
  console.error('SYNTAX ERROR in', file);
  for (const m of (e.errors || [])) {
    const l = m.location ? `${m.location.line}:${m.location.column}` : '?';
    console.error(`  [${l}] ${m.text}`);
    if (m.location?.lineText) console.error('   > ' + m.location.lineText.trim());
  }
  process.exit(1);
}
