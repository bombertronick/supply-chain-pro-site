/* Rilascio in un colpo solo fra due versioni qualunque, senza coppie scritte
   a mano: le zone che cambiano le trova «diff», non io.

   Serve quando fra quello che c'è online e quello che deve andarci ci sono più
   generazioni: passare dalla produzione all'ultima versione una alla volta
   significa toccare la produzione più volte, e ogni passaggio è un rischio in
   più per niente — le versioni di mezzo non le ha mai viste nessuno.

   Uso: node sql_diff.mjs <vecchio.jsx> <nuovo.jsx> <tag> <ver>
   Il file .sql che ne esce ha dentro lo stesso cancello md5 di sempre. */
import { readFileSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
import crypto from "crypto";

const [vecchioF, nuovoF, tag, ver] = process.argv.slice(2);
const vecchio = readFileSync(vecchioF, "utf8");
const nuovo = readFileSync(nuovoF, "utf8");

/* diff a righe, zero righe di contorno: voglio solo le zone che cambiano */
let grezzo = "";
try {
  grezzo = execFileSync("diff", ["-U0", vecchioF, nuovoF], { encoding: "utf8", maxBuffer: 64e6 });
} catch (e) { grezzo = e.stdout || ""; }   // diff esce 1 quando ci sono differenze

const righeV = vecchio.split("\n");
const righeN = nuovo.split("\n");
/* offset di inizio di ogni riga del file vecchio, in caratteri */
const inizio = [0];
for (let i = 0; i < righeV.length; i++) inizio.push(inizio[i] + righeV[i].length + 1);

const zone = [];
for (const m of grezzo.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)) {
  const vDa = +m[1], vN = m[2] === undefined ? 1 : +m[2];
  const nDa = +m[3], nN = m[4] === undefined ? 1 : +m[4];
  /* con conteggio 0 «diff» indica la riga PRIMA del punto d'inserimento */
  const da = vN === 0 ? vDa : vDa - 1;              // 0-based
  const testo = nN === 0 ? "" : righeN.slice(nDa - 1, nDa - 1 + nN).join("\n") + "\n";
  zone.push({ off: inizio[da], len: vN === 0 ? 0 : inizio[da + vN] - inizio[da], testo });
}
zone.sort((a, b) => a.off - b.off);
for (let i = 1; i < zone.length; i++)
  if (zone[i].off < zone[i - 1].off + zone[i - 1].len) { console.error("!! zone sovrapposte"); process.exit(1); }

/* ricostruzione locale: se non torna identica non si scrive niente */
let out = "", cur = 0;
for (const z of zone) { out += vecchio.slice(cur, z.off) + z.testo; cur = z.off + z.len; }
out += vecchio.slice(cur);
if (out !== nuovo) {
  console.error("!! la ricostruzione non combacia:", out.length, "contro", nuovo.length);
  process.exit(1);
}

const md5v = crypto.createHash("md5").update(vecchio, "utf8").digest("hex");
const md5n = crypto.createHash("md5").update(nuovo, "utf8").digest("hex");

const righe = [];
let prev = 0;
for (const z of zone) {
  if (z.off > prev) righe.push({ tipo: "src", da: prev + 1, quanti: z.off - prev });
  if (z.testo) righe.push({ tipo: "lett", testo: z.testo });
  prev = z.off + z.len;
}
if (vecchio.length > prev) righe.push({ tipo: "src", da: prev + 1, quanti: vecchio.length - prev });
/* TRE cifre di zero-padding, non due: con piu' di 99 tessere «p100» si
   ordina PRIMA di «p11» e la ricomposizione order-by-key esce mescolata.
   Il cancello md5 lo prende, ma il rilascio fallirebbe — successo davvero
   con gen-5.95, 176 tessere, fermato dal conto prima del cancello. */
righe.forEach((r, i) => { r.k = `tmp:${tag}:p${String(i + 1).padStart(3, "0")}`; });

const q = (s) => "'" + s.replace(/'/g, "''") + "'";
const L = [];
L.push(`-- ${tag}: ${zone.length} zone cambiate, ${righe.length} tessere`);
L.push(`-- ${md5v} (${vecchio.length}) → ${md5n} (${nuovo.length})`);
L.push("");
L.push(`insert into kv_store(key, value) select 'backup:pre-${tag}', value from kv_store where key='app:jsx:src'
  on conflict (key) do update set value=excluded.value;`);
L.push("");
for (const r of righe) {
  /* ── PERCHÉ IN BASE64 E NON IN CHIARO ──
     Il 2 agosto un pezzo conteneva /[\\u0300-\\u036f]/ — la sequenza che in
     JavaScript indica gli accenti da togliere. Nel passaggio verso il server
     quella sequenza e' diventata il CARATTERE vero, e il pezzo salvato non era
     piu' quello provato in locale. Il cancello md5 l'ha preso prima che si
     scrivesse qualcosa, ma il modo di non correre il rischio e' un altro: il
     base64 e' fatto di sole lettere e numeri, e non c'e' niente dentro che
     qualcuno possa interpretare per strada. */
  const v = r.tipo === "src"
    ? `substr((select value from kv_store where key='app:jsx:src'), ${r.da}, ${r.quanti})`
    : `convert_from(decode('${Buffer.from(r.testo, "utf8").toString("base64")}', 'base64'), 'UTF8')`;
  L.push(`insert into kv_store(key, value) values(${q(r.k)}, ${v}) on conflict (key) do update set value=excluded.value;`);
}
L.push("");
L.push(`-- il cancello, PRIMA di scrivere`);
L.push(`select md5(string_agg(value, '' order by key)) as md5_ricomposto,
       length(string_agg(value, '' order by key)) as len_ricomposto,
       md5(string_agg(value, '' order by key)) = ${q(md5n)} as combacia
from kv_store where key like 'tmp:${tag}:p%';`);
L.push("");
L.push(`update kv_store set value = (select string_agg(value, '' order by key) from kv_store where key like 'tmp:${tag}:p%')
where key='app:jsx:src'
  and md5(value) = ${q(md5v)}
  and (select md5(string_agg(value, '' order by key)) from kv_store where key like 'tmp:${tag}:p%') = ${q(md5n)};`);
L.push("");
/* La «meta» si aggiorna SOLO se il sorgente e' davvero cambiato. Senza questa
   condizione, un UPDATE che non ha scritto niente lascerebbe una lunghezza
   dichiarata che non corrisponde a quella vera — ed e' esattamente il caso in
   cui il caricatore rifiuta di partire e l'app non si apre piu'. Con questa,
   l'intero file si puo' eseguire in un colpo solo senza pericolo: se il
   cancello non si apre, non cambia niente da nessuna parte. */
L.push(`update kv_store set value = ${q(JSON.stringify({ len: nuovo.length, ver }))}
where key='app:jsx:meta'
  and (select md5(value) from kv_store where key='app:jsx:src') = ${q(md5n)};`);
L.push("");
L.push(`delete from kv_store where key like 'tmp:${tag}:p%';`);

writeFileSync(`${tag}.sql`, L.join("\n") + "\n");
const pesoLett = righe.filter((r) => r.tipo === "lett").reduce((n, r) => n + r.testo.length, 0);
console.log(`scritto ${tag}.sql — ${zone.length} zone, ${righe.length} tessere, ${pesoLett} caratteri di testo nuovo`);
console.log(`md5 ${md5v} → ${md5n} · len ${vecchio.length} → ${nuovo.length}`);
