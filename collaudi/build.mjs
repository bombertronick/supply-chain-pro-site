import { build } from "esbuild";
import { copyFileSync, statSync } from "fs";
import { execFileSync } from "child_process";

import { existsSync } from "fs";
/* Se c'è un censimento in corso, ricostruire il bundle glielo rovina a metà:
   i file già provati hanno visto una versione, quelli dopo un'altra, e il
   verde finale non prova niente. Meglio un rifiuto secco che un rapporto che
   sembra buono. Si forza con --anche-sotto-censimento, se si sa cosa si fa. */
if (existsSync(".censimento-in-corso") && !process.argv.includes("--anche-sotto-censimento")) {
  console.error("RIFIUTO: c'è un censimento in corso — ricostruire adesso lo invaliderebbe.");
  console.error("         Aspetta che finisca, oppure fermalo, oppure --anche-sotto-censimento.");
  process.exit(2);
}
const target = process.argv[2] || "../app-prod.jsx";
copyFileSync(target, "./app-under-test.jsx");

/* ── IL FOGLIO DI STILE SI RIFÀ OGNI VOLTA ──
   Fino al 2 agosto «tw.css» era un file costruito una volta, il 30 luglio, e
   mai piu' toccato. Le classi grafiche nuove scritte dopo quella data nel
   banco di prova NON C'ERANO: quegli elementi venivano misurati senza il loro
   aspetto, e i collaudi che guardano dove finiscono le cose stavano guardando
   una pagina diversa da quella vera. Non e' esploso niente per fortuna, non
   per costruzione — ed e' il tipo di buco che si scopre solo quando ha gia'
   fatto danno.
   Adesso il foglio si ricostruisce dal sorgente in prova a ogni pacchetto: non
   puo' piu' invecchiare, e chi clona il repository ne ottiene uno giusto senza
   sapere che esiste. */
const tw = ["./node_modules/.bin/tailwindcss", "./node_modules/tailwindcss/lib/cli.js"]
  .find(existsSync);
try {
  if (tw && tw.endsWith(".js")) {
    execFileSync(process.execPath, [tw, "-i", "tw-input.css", "-o", "tw.css",
      "--content", "./app-under-test.jsx,./index.html", "--minify"], { stdio: "pipe" });
  } else if (tw) {
    execFileSync(tw, ["-i", "tw-input.css", "-o", "tw.css",
      "--content", "./app-under-test.jsx,./index.html", "--minify"], { stdio: "pipe" });
  } else {
    execFileSync("npx", ["tailwindcss", "-i", "tw-input.css", "-o", "tw.css",
      "--content", "./app-under-test.jsx,./index.html", "--minify"], { stdio: "pipe" });
  }
  const kb = (statSync("tw.css").size / 1024).toFixed(0);
  console.log(`STILE OK  tw.css rifatto dal sorgente in prova (${kb}KB)`);
} catch (e) {
  console.error("STILE FALLITO: non sono riuscito a rifare tw.css.");
  console.error("  Senza, le schermate si misurano senza il loro aspetto e i collaudi");
  console.error("  che guardano dove finiscono le cose non provano niente.");
  console.error("  " + (e.stderr?.toString().split("\n")[0] || e.message));
  process.exit(3);
}

/* ── LE LIBRERIE DI LOGICA SI RIFANNO ANCHE LORO ──
   Cinque collaudi non guardano le schermate: chiamano direttamente le funzioni
   dell'app — conversioni, interi, rete, pesi, controlli — attraverso una
   libreria costruita dal sorgente. Quelle librerie erano ferme al 29 luglio.
   Non conoscevano ne' «calcoloProduzione» ne' «AZIONI»: per nove giorni quei
   cinque collaudi hanno dato verde sulla logica di prima, cioe' su codice che
   non esisteva piu'. Erano verdi per il motivo sbagliato.
   Adesso si rifanno dal sorgente in prova insieme al pacchetto. Se una
   funzione che un collaudo si aspetta e' sparita, questo passo FALLISCE — ed
   e' l'informazione giusta, molto meglio di un verde che non vuol dire
   niente. */
const LIBRERIE = ["mkconvlib", "mkcontrollilib", "mkinterilib", "mkpesolib", "mkretelib", "mktestlib"];
for (const g of LIBRERIE) {
  if (!existsSync(`${g}.mjs`)) continue;
  try {
    execFileSync(process.execPath, [`${g}.mjs`, "./app-under-test.jsx"], { stdio: "pipe" });
  } catch (e) {
    console.error(`LIBRERIA FALLITA: ${g}.mjs non riesce a costruirsi dal sorgente in prova.`);
    console.error("  Di solito vuol dire che una funzione che un collaudo si aspetta non c'e' piu'");
    console.error("  o ha cambiato nome. Va sistemato il collaudo, non aggirato questo passo.");
    console.error("  " + (e.stderr?.toString().split("\n").filter(Boolean).slice(-2).join(" · ") || e.message));
    process.exit(4);
  }
}
console.log(`LOGICA OK  ${LIBRERIE.length} librerie rifatte dal sorgente in prova`);

try {
  const r = await build({
    entryPoints: ["entry.jsx"],
    bundle: true,
    outfile: "bundle.js",
    loader: { ".jsx": "jsx" },
    jsx: "transform",
    format: "iife",
    platform: "browser",
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
    metafile: true,
  });
  const out = r.metafile.outputs["bundle.js"];
  console.log("BUNDLE OK from", target, "->", (out.bytes / 1024).toFixed(0) + "KB");
  if (r.warnings.length) {
    console.log("warnings:", r.warnings.length);
    for (const w of r.warnings.slice(0, 10)) console.log("  ", w.text, w.location ? `(${w.location.file}:${w.location.line})` : "");
  }
} catch (e) {
  console.error("BUNDLE FAILED from", target);
  for (const m of (e.errors || [])) {
    const l = m.location ? `${m.location.file}:${m.location.line}:${m.location.column}` : "?";
    console.error(`  [${l}] ${m.text}`);
    if (m.location?.lineText) console.error("   > " + m.location.lineText.trim());
  }
  process.exit(1);
}
