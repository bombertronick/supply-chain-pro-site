import { build } from "esbuild";
import { copyFileSync } from "fs";

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
