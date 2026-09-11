/* SPEZZA UN RILASCIO IN PEZZI CHE SI POSSONO MANDARE UNO PER CHIAMATA.

   PERCHE' ESISTE. Il file che esce da sql_diff.mjs non si esegue in un colpo
   solo: execute_sql restituisce solo il risultato dell'ULTIMO statement,
   quindi di tutti gli altri non si saprebbe niente. E le tessere grosse —
   sopra ~2.8 KB di base64 — vanno spezzate e mandate un pezzo per chiamata:
   incollarne due insieme e' il modo in cui a gen-6.11 si e' corrotta una
   tessera su 47. Fino a oggi questo lavoro si faceva a mano dentro il
   rilascio, cioe' un po' diverso ogni volta — ed e' esattamente il genere di
   cosa che questa casa ha gia' pagato una volta (roadmap-md.mjs, gen-5.91).

   DOVE SI SPEZZA, E PERCHE' LI'. Non a meta' del base64: un taglio a caso
   produce quattro caratteri che non sono un gruppo valido, e — peggio — puo'
   tagliare a meta' una lettera accentata, che in UTF-8 sta in due byte.
   convert_from andrebbe in errore o, peggio ancora, non ci andrebbe. Qui si
   taglia il TESTO in punti di codice interi, e ogni pezzo si ricodifica in
   base64 per conto suo: ogni pezzo e' base64 valido E UTF-8 valido da solo.

   NON E' IDEMPOTENTE, ed e' scritto anche nei file che escono: il primo
   pezzo di una tessera e' un insert che sovrascrive, i successivi sono
   «value = value || ...». Rieseguire un append raddoppia quel pezzo. Il
   cancello md5 prima dello swap lo prende — e' il suo mestiere — ma va
   saputo prima, non scoperto dopo.

   L'AUDIT PER TESSERA ESCE DA QUI, e non a mano. PASSAGGIO.md lo pretende a
   ogni rilascio — e' il cancello che a gen-6.11 ha trovato una tessera
   sbagliata su 47 PRIMA di toccare la produzione — ma finora andava scritto
   al momento, cioe' un po' diverso ogni volta. Adesso, se gli si dice qual
   e' il sorgente VECCHIO (quello da cui le tessere «src» tagliano), calcola
   lunghezza e impronta attese di ognuna e scrive audit.sql: una select che
   torna ZERO righe quando tutte e N le tessere in rete sono quelle provate
   in locale, e le nomina quando non lo sono.

   Uso: node sql_spezza.mjs <file.sql> [caratteri per pezzo] [vecchio.jsx]
   Scrive <tag>-pezzi/NNN.sql, numerati nell'ordine in cui vanno mandati,
   piu' <tag>-pezzi/audit.sql se il sorgente vecchio e' stato dato. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const file = process.argv[2];
const MAX = +(process.argv[3] || 1800);   // caratteri di TESTO per pezzo
const vecchioF = process.argv[4];         // il sorgente da cui tagliano le tessere «src»
if (!file || !existsSync(file)) {
  console.error("KO  serve il file: node sql_spezza.mjs <file.sql> [caratteri]");
  process.exit(1);
}
const sorgente = readFileSync(file, "utf8");
const tag = path.basename(file, ".sql");
const fuori = path.join(path.dirname(file), tag + "-pezzi");
rmSync(fuori, { recursive: true, force: true });
mkdirSync(fuori, { recursive: true });

/* gli statement sono separati da «;» a fine riga: e' la forma che scrive
   sql_diff, e non ci sono «;» dentro le stringhe perche' il testo viaggia
   tutto in base64 (sole lettere, numeri, «+», «/» e «=») */
const statement = sorgente.split(";\n").map((s) => s.trim()).filter(Boolean);

const b64 = (t) => Buffer.from(t, "utf8").toString("base64");
const DEC = (t) => `convert_from(decode('${b64(t)}', 'base64'), 'UTF8')`;

const pezzi = [];
for (const st of statement) {
  /* una tessera letterale: insert ... values('<chiave>', convert_from(decode('<b64>','base64'),'UTF8')) */
  const m = st.match(/^insert into kv_store\(key, value\) values\('([^']+)', convert_from\(decode\('([A-Za-z0-9+/=]+)', 'base64'\), 'UTF8'\)\) on conflict \(key\) do update set value=excluded\.value$/);
  if (!m) { pezzi.push(st); continue; }
  const [, chiave, codificato] = m;
  const testo = Buffer.from(codificato, "base64").toString("utf8");
  if (codificato.length <= 2800) { pezzi.push(st); continue; }
  /* si taglia il TESTO per punti di codice, non il base64 per caratteri */
  const punti = [...testo];
  const fette = [];
  for (let i = 0; i < punti.length; i += MAX) fette.push(punti.slice(i, i + MAX).join(""));
  pezzi.push(`insert into kv_store(key, value) values('${chiave}', ${DEC(fette[0])}) on conflict (key) do update set value=excluded.value`);
  for (let i = 1; i < fette.length; i++)
    pezzi.push(`-- ATTENZIONE: questo pezzo NON e' idempotente, va eseguito UNA VOLTA SOLA\nupdate kv_store set value = value || ${DEC(fette[i])} where key='${chiave}'`);
  console.log(`  spezzata ${chiave}: ${codificato.length} caratteri di base64 -> ${fette.length} pezzi`);
}

pezzi.forEach((p, i) => {
  writeFileSync(path.join(fuori, String(i + 1).padStart(3, "0") + ".sql"), p + ";\n");
});

/* ── L'AUDIT PER TESSERA ──
   Si ricostruisce in locale quello che ogni tessera DEVE valere — le «lett»
   dal base64, le «src» tagliando il sorgente vecchio con gli stessi indici —
   e si scrive una select che confronta lunghezza e impronta. Zero righe =
   tutte e N combaciano. */
if (vecchioF && existsSync(vecchioF)) {
  const vecchio = readFileSync(vecchioF, "utf8");
  const atteso = new Map();
  for (const st of pezzi) {
    const corpo = st.split("\n").filter((r) => !r.trim().startsWith("--")).join("\n").trim();
    let m = corpo.match(/^insert into kv_store\(key, value\) values\('([^']+)', convert_from\(decode\('([A-Za-z0-9+/=]+)'/);
    if (m) { atteso.set(m[1], Buffer.from(m[2], "base64").toString("utf8")); continue; }
    m = corpo.match(/^insert into kv_store\(key, value\) values\('([^']+)', substr\(\(select value from kv_store where key='app:jsx:src'\), (\d+), (\d+)\)\)/);
    if (m) { atteso.set(m[1], [...vecchio].slice(+m[2] - 1, +m[2] - 1 + +m[3]).join("")); continue; }
    m = corpo.match(/^update kv_store set value = value \|\| convert_from\(decode\('([A-Za-z0-9+/=]+)'[\s\S]*where key='([^']+)'/);
    if (m) atteso.set(m[2], (atteso.get(m[2]) || "") + Buffer.from(m[1], "base64").toString("utf8"));
  }
  const righe = [...atteso.entries()].sort()
    .map(([k, v]) => `('${k}',${[...v].length},'${crypto.createHash("md5").update(v, "utf8").digest("hex")}')`);
  const sql = `-- ZERO righe = tutte e ${righe.length} le tessere sono quelle provate in locale
with atteso(key, len, md5) as (values ${righe.join(",")}),
vere as (select key, length(value) as len, md5(value) as md5 from kv_store where key like 'tmp:${tag}:p%')
select (select count(*) from atteso) as attese,
       (select count(*) from vere) as in_rete,
       (select count(*) from atteso a join vere v using (key) where v.len = a.len and v.md5 = a.md5) as combaciano,
       (select coalesce(string_agg(k, ', '), 'nessuna') from (
          select a.key as k from atteso a left join vere v using (key) where v.key is null or v.len <> a.len or v.md5 <> a.md5
          union all
          select v.key from vere v left join atteso a using (key) where a.key is null) x) as diverse;
`;
  writeFileSync(path.join(fuori, "audit.sql"), sql);
  console.log(`audit.sql scritto: ${righe.length} tessere con lunghezza e impronta attese`);
} else if (vecchioF) {
  console.log("!! sorgente vecchio non trovato: audit.sql NON scritto");
} else {
  console.log("·· senza il sorgente vecchio non si puo' scrivere l'audit per tessera");
}
console.log(`\n${statement.length} statement -> ${pezzi.length} pezzi in ${fuori}`);
console.log("Si mandano IN ORDINE, uno per chiamata. Gli «update ... value || ...» UNA VOLTA SOLA.");
