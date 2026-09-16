import { readFileSync, writeFileSync, existsSync } from "fs";
import { bilancia } from "./bilancia.mjs";
const src = readFileSync("app-gen570.jsx", "utf8");
const numeri = ["05", "10", "20", "30", "40", "50", "60", "70", "80", "90", "92", "94"];
let ok = true;
const pezzi = [];
for (const n of numeri) {
  const a = readFileSync(`h571/${n}a.txt`, "utf8");
  const b = readFileSync(`h571/${n}b.txt`, "utf8");
  const c = src.split(a).length - 1;
  if (c !== 1) { console.log(`!! hunk ${n}: ${c} occorrenze di 'a' (ne serve 1)`); ok = false; continue; }
  if (!bilancia(a, b, n)) ok = false;
  const off = src.indexOf(a);
  pezzi.push({ n, off, len: a.length, b });
  console.log(`hunk ${n}: offset ${off}, ${a.length} → ${b.length} byte`);
}
/* sovrapposizioni */
pezzi.sort((x, y) => x.off - y.off);
for (let i = 1; i < pezzi.length; i++) {
  if (pezzi[i].off < pezzi[i - 1].off + pezzi[i - 1].len) {
    console.log(`!! hunk ${pezzi[i].n} si sovrappone a ${pezzi[i - 1].n}`); ok = false;
  }
}
if (!ok) process.exit(1);
/* ricostruzione locale */
let out = "", cur = 0;
for (const p of pezzi) { out += src.slice(cur, p.off) + p.b; cur = p.off + p.len; }
out += src.slice(cur);
if (!existsSync("app-gen571.jsx")) { writeFileSync("app-gen571.jsx", out); console.log("scritto app-gen571.jsx"); }
const atteso = readFileSync("app-gen571.jsx", "utf8");
console.log("ricostruzione identica a app-gen571.jsx:", out === atteso, "| len", out.length);
if (out !== atteso) process.exit(1);
/* pezzi per il deploy: substr() di Postgres è 1-based */
console.log("\n-- coordinate (1-based) --");
let prev = 0; const righe = [];
pezzi.forEach((p, i) => {
  if (p.off > prev) righe.push({ k: `p${String(righe.length + 1).padStart(2, "0")}`, tipo: "src", da: prev + 1, quanti: p.off - prev });
  righe.push({ k: `p${String(righe.length + 1).padStart(2, "0")}`, tipo: "lett", testo: p.b });
  prev = p.off + p.len;
});
righe.push({ k: `p${String(righe.length + 1).padStart(2, "0")}`, tipo: "src", da: prev + 1, quanti: src.length - prev });
for (const r of righe) console.log(r.tipo === "src" ? `${r.k}: substr(src, ${r.da}, ${r.quanti})` : `${r.k}: LETTERALE ${JSON.stringify(r.testo)}`);
