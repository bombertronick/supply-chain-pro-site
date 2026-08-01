/* Sostituisce la navigazione fatta a mano — qualunque voce — con la libreria.
   Copre le due forme che ho trovato in giro:
     const X = p.getByText("Voce", { exact: true });
     for (…) { if (await X.nth(i).isVisible()) { await X.nth(i).click(); break; } }
   e la versione corta con .first().click(). */
import { readFileSync, writeFileSync } from "fs";

const VOCI = "Catalogo|Magazzini|Ordini|Plancia|Analisi|Storico|Sedi|Profili|Accessi|Sistema";
const lungo = new RegExp(
  String.raw`(^|\n)([ \t]*)const (\w+) = (\w+)\.getByText\("(${VOCI})",\s*\{\s*exact:\s*true\s*\}\);\n[ \t]*for \(let i = 0; i < await \3\.count\(\); i\+\+\) \{ if \(await \3\.nth\(i\)\.isVisible\(\)\) \{ await \3\.nth\(i\)\.click\(\); break; \} \}`, "g");
const corto = new RegExp(
  String.raw`await ([\w.]+)\.getByText\("(${VOCI})",\s*\{\s*exact:\s*true\s*\}\)\.first\(\)\.click\(\);(\s*await [\w.]+\.waitForTimeout\(\d+\);)?`, "g");

const NOTA = "/* la strada per le voci sotto «Gestione» la sa la libreria condivisa */";

for (const f of process.argv.slice(2)) {
  let s = readFileSync(f, "utf8"), prima = s;
  s = s.replace(lungo, (_m, a, ind, _v, pag, voce) => `${a}${ind}${NOTA}\n${ind}await vaiA(${pag}, "${voce}");`);
  s = s.replace(corto, (_m, pag, voce) => `${NOTA}\nawait vaiA(${pag}, "${voce}");`);
  if (s === prima) { console.log(`${f}: niente da sostituire`); continue; }
  if (!/^import \{ vaiA \}/m.test(s)) {
    const righe = s.split("\n");
    const ultimo = righe.reduce((acc, r, i) => (/^import /.test(r) ? i : acc), -1);
    righe.splice(ultimo + 1, 0, 'import { vaiA } from "./navtest.mjs";');
    s = righe.join("\n");
  }
  writeFileSync(f, s);
  console.log(`${f}: sostituito`);
}
