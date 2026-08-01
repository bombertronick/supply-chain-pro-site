/* Per ogni collaudo rosso: la riga di codice che si e' piantata e su cosa.
   Serve a smistare venti guasti in tre mucchi — «nome cambiato», «schermata
   che non esiste piu'», «bug vero dell'app» — senza aprirli uno per uno. */
import { spawnSync } from "child_process";
import { readFileSync } from "fs";

const rosse = process.argv.slice(2);
for (const f of rosse) {
  const r = spawnSync("node", [f], { encoding: "utf8", timeout: 300000 });
  const out = ((r.stdout || "") + (r.stderr || "")).replace(/\[\d+m/g, "");
  const aspetta = (out.match(/waiting for (.+)/) || [])[1] || "";
  const riga = (out.match(new RegExp(f.replace(".", "\\.") + ":(\\d+)")) || [])[1];
  let codice = "";
  if (riga) {
    const righe = readFileSync(f, "utf8").split("\n");
    codice = (righe[+riga - 1] || "").trim().slice(0, 120);
  }
  const nKo = (out.match(/^ {2}KO {2}(.*)$/gm) || []).map((s) => s.slice(6).trim());
  console.log(`\n■ ${f}${riga ? "  (riga " + riga + ")" : ""}`);
  if (aspetta) console.log(`  aspettava: ${aspetta.trim().slice(0, 130)}`);
  if (codice) console.log(`  codice:    ${codice}`);
  for (const k of nKo.slice(0, 4)) console.log(`  KO:        ${k.slice(0, 120)}`);
  if (!aspetta && !nKo.length) {
    const err = (out.match(/^.*(?:Error|error:).*$/m) || [""])[0].trim().slice(0, 130);
    if (err) console.log(`  errore:    ${err}`);
  }
}
