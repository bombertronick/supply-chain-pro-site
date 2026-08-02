/* Genera l'SQL di un rilascio a pezzi, invece di scriverlo a mano.
   Uso: node sql_deploy.mjs <vecchio.jsx> <hNNN> <nuovo.jsx> <tag>
   dove <tag> e' per esempio gen571 (serve per le chiavi tmp e il backup).

   Perche' esiste: le coordinate le calcolava una persona leggendo un elenco,
   e il 30 luglio un pezzo e' partito lungo un byte in meno. Il cancello md5 lo
   ha preso, ma il modo di non sbagliare e' non contare a mano. */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import crypto from "crypto";

const [vecchioF, cart, nuovoF, tag] = process.argv.slice(2);
const src = readFileSync(vecchioF, "utf8");
const atteso = readFileSync(nuovoF, "utf8");
const numeri = [...new Set(readdirSync(cart).map((f) => f.replace(/[ab]\.txt$/, "")))]
  .filter((n) => n).sort();

const pezzi = [];
for (const n of numeri) {
  const a = readFileSync(`${cart}/${n}a.txt`, "utf8");
  const b = readFileSync(`${cart}/${n}b.txt`, "utf8");
  if (src.split(a).length - 1 !== 1) { console.error(`!! hunk ${n} non e' unico`); process.exit(1); }
  pezzi.push({ n, off: src.indexOf(a), len: a.length, b });
}
pezzi.sort((x, y) => x.off - y.off);
for (let i = 1; i < pezzi.length; i++)
  if (pezzi[i].off < pezzi[i - 1].off + pezzi[i - 1].len) { console.error("!! sovrapposizione"); process.exit(1); }

let out = "", cur = 0;
for (const p of pezzi) { out += src.slice(cur, p.off) + p.b; cur = p.off + p.len; }
out += src.slice(cur);
if (out !== atteso) { console.error("!! la ricostruzione locale non combacia"); process.exit(1); }

const md5v = crypto.createHash("md5").update(src, "utf8").digest("hex");
const md5n = crypto.createHash("md5").update(atteso, "utf8").digest("hex");

/* le righe: alternanza fra pezzi presi dal vecchio e pezzi nuovi */
const righe = [];
let prev = 0;
for (const p of pezzi) {
  if (p.off > prev) righe.push({ tipo: "src", da: prev + 1, quanti: p.off - prev });
  righe.push({ tipo: "lett", testo: p.b });
  prev = p.off + p.len;
}
if (src.length > prev) righe.push({ tipo: "src", da: prev + 1, quanti: src.length - prev });
righe.forEach((r, i) => { r.k = `tmp:${tag}:p${String(i + 1).padStart(2, "0")}`; });

const q = (s) => "'" + s.replace(/'/g, "''") + "'";
const L = [];
L.push(`-- ${tag}: ${pezzi.length} pezzi sostituiti, ${righe.length} tessere`);
L.push(`-- vecchio md5 ${md5v} (${src.length}) → nuovo md5 ${md5n} (${atteso.length})`);
L.push("");
L.push(`-- 1) backup`);
L.push(`insert into kv_store(key, value) select 'backup:pre-${tag}', value from kv_store where key='app:jsx:src'\n  on conflict (key) do update set value=excluded.value;`);
L.push("");
L.push(`-- 2) le tessere`);
for (const r of righe) {
  const v = r.tipo === "src"
    ? `substr((select value from kv_store where key='app:jsx:src'), ${r.da}, ${r.quanti})`
    : q(r.testo);
  L.push(`insert into kv_store(key, value) values(${q(r.k)}, ${v}) on conflict (key) do update set value=excluded.value;`);
}
L.push("");
L.push(`-- 3) il cancello: NON scrivere se la ricomposizione non e' quella provata in locale`);
L.push(`select md5(string_agg(value, '' order by key)) as md5_ricomposto,
       length(string_agg(value, '' order by key)) as len_ricomposto,
       md5(string_agg(value, '' order by key)) = ${q(md5n)} as combacia
from kv_store where key like 'tmp:${tag}:p%';`);
L.push("");
L.push(`-- 4) la scrittura, condizionata alle due md5`);
L.push(`update kv_store set value = (select string_agg(value, '' order by key) from kv_store where key like 'tmp:${tag}:p%')
where key='app:jsx:src'
  and md5(value) = ${q(md5v)}
  and (select md5(string_agg(value, '' order by key)) from kv_store where key like 'tmp:${tag}:p%') = ${q(md5n)};`);
L.push("");
L.push(`-- 5) meta`);
L.push(`update kv_store set value = ${q(JSON.stringify({ len: atteso.length, ver: "gen-5." + tag.slice(-2) }))} where key='app:jsx:meta';`);
L.push("");
L.push(`-- 6) via le tessere`);
L.push(`delete from kv_store where key like 'tmp:${tag}:p%';`);

writeFileSync(`${tag}.sql`, L.join("\n") + "\n");
console.log(`scritto ${tag}.sql — ${righe.length} tessere, md5 ${md5v} → ${md5n}, len ${src.length} → ${atteso.length}`);
