/* Sostituisce la navigazione fatta a mano verso «Profili» con la chiamata alla
   libreria condivisa. Da gen-5.52 quella voce non e' piu' in barra ma sotto
   «Gestione»: sei collaudi se l'erano scritta per conto proprio e sono
   diventati ciechi tutti insieme il giorno che l'ho spostata. */
import { readFileSync, writeFileSync } from "fs";

const NOTA = '/* «Profili» sta sotto «Gestione» da gen-5.52: la strada la sa navtest.mjs */';
const re = /await (\w+)\.getByText\("Profili",\s*\{\s*exact:\s*true\s*\}\)\.first\(\)\.click\(\)(?:\.catch\(\(\) => \{\}\))?;(?:\s*await \w+\.waitForTimeout\(\d+\);)?/g;

for (const f of process.argv.slice(2)) {
  let s = readFileSync(f, "utf8");
  const prima = s;
  s = s.replace(re, (_m, pag) => `${NOTA}\nawait vaiA(${pag}, "Profili");`);
  if (s === prima) { console.log(`${f}: nessuna sostituzione`); continue; }
  if (!/navtest\.mjs/.test(s)) {
    s = s.replace(/^import path from "path";$/m, 'import path from "path";\nimport { vaiA } from "./navtest.mjs";');
  }
  writeFileSync(f, s);
  console.log(`${f}: ok`);
}
