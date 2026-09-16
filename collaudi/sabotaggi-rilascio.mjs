/* I SABOTAGGI DEI CANCELLI DI RILASCIO, CONTATI UNO PER UNO.

   `rilasciotest.mjs` prova che i cancelli della catena mordono. Questo file
   prova che il BANCO se ne accorge quando qualcuno li spegne — che e' l'unica
   cosa che rende un banco diverso da una speranza.

   Si copia `strumenti/` e il banco in una cartella temporanea, si spegne UNA
   guardia sola, si gira il banco LA' DENTRO e si contano le rosse. Il
   repository non si tocca mai: non c'e' niente da rimettere a posto, quindi
   non c'e' niente che possa restare rotto se questo file muore a meta'.

   Uso: node sabotaggi-rilascio.mjs [numero] */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, cpSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

const QUI = path.dirname(new URL(import.meta.url).pathname);
const RAD = [path.resolve(QUI, ".."), QUI].find((d) => existsSync(path.join(d, "strumenti", "sql_diff.mjs")));
if (!RAD) { console.error("KO  non trovo strumenti/sql_diff.mjs"); process.exit(1); }

const BASE = "/tmp/rilascio-sabotato";
function alberoIntegro() {
  rmSync(BASE, { recursive: true, force: true });
  mkdirSync(path.join(BASE, "collaudi"), { recursive: true });
  cpSync(path.join(RAD, "strumenti"), path.join(BASE, "strumenti"), { recursive: true });
  cpSync(path.join(QUI, "rilasciotest.mjs"), path.join(BASE, "collaudi", "rilasciotest.mjs"));
}
const leggi = (f) => readFileSync(path.join(BASE, f), "utf8");
const scrivi = (f, t) => writeFileSync(path.join(BASE, f), t);
const sostituisci = (f, da, a) => {
  const t = leggi(f);
  if (!t.includes(da)) throw new Error(`in ${f} non trovo «${da.slice(0, 50)}…»`);
  scrivi(f, t.replace(da, a));
};

const SABOTAGGI = [
  { n: 1, nome: "la bilancia non viene piu' chiamata da sql_diff",
    attesa: "§1 rossa: e' esattamente com'era la catena dal passaggio a sql_diff fino al 16 settembre — venti generazioni senza rete e senza un rosso",
    fai: () => sostituisci("strumenti/sql_diff.mjs",
      "  if (!bilancia(vecchio.slice(z.off, z.off + z.len), z.testo, `zona ${i + 1} di ${zone.length}`)) sbilanciate++;",
      "  void z; void i;") },

  { n: 2, nome: "la bilancia dice sempre che va bene",
    attesa: "§1 rossa: una guardia che non puo' accusare nessuno e' decorazione",
    fai: () => sostituisci("strumenti/bilancia.mjs",
      "export function bilancia(vecchio, nuovo, etichetta) {",
      "export function bilancia(vecchio, nuovo, etichetta) {\n  if (1) return true;") },

  { n: 3, nome: "lo sbilancio ferma la catena anche quando e' dichiarato",
    attesa: "§1c rossa: un cancello che non si puo' aprire di proposito si aggira copiando il file a mano, ed e' peggio che non averlo",
    fai: () => sostituisci("strumenti/sql_diff.mjs", `if (process.env.BILANCIA === "avvisa") {`, `if (false) {`) },

  { n: 4, nome: "sql_spezza torna a uscire con successo senza audit",
    attesa: "§3 rossa: e' com'era fino al 16 settembre — l'audit e' il cancello che a gen-6.11 ha trovato una tessera diversa da quella provata in locale",
    fai: () => sostituisci("strumenti/sql_spezza.mjs", `if (process.env.SENZA_AUDIT !== "1") {`, `if (false) {`) },

  { n: 5, nome: "il .sql non porta piu' il cancello md5 di partenza",
    attesa: "§1b rossa: senza quel cancello lo swap parte anche su una produzione che non e' quella da cui ho fatto il diff",
    fai: () => sostituisci("strumenti/sql_diff.mjs", "  and md5(value) = ${q(md5v)}", "  and 1=1") },

  { n: 6, nome: "le tessere temporanee non si cancellano piu'",
    attesa: "§1b e §4 rosse: le tmp restano in rete e il rilascio dopo ci ricompone sopra",
    fai: () => sostituisci("strumenti/sql_diff.mjs", "L.push(`delete from kv_store where key like 'tmp:${tag}:p%';`);", "L.push(`select 1;`);") },

  { n: 7, nome: "il backup non e' piu' la prima cosa del primo lotto",
    attesa: "§4 rossa: se il backup non e' il primo, quando salta ha gia' toccato qualcosa",
    fai: () => sostituisci("strumenti/sql_diff.mjs",
      "L.push(`insert into kv_store(key, value) select 'backup:pre-${tag}', value from kv_store where key='app:jsx:src'\n  on conflict (key) do update set value=excluded.value;`);",
      "L.push(`-- niente backup`);") },
];

const quale = process.argv[2] ? +process.argv[2] : null;
const daFare = quale ? SABOTAGGI.filter((s) => s.n === quale) : SABOTAGGI;
let muti = 0;

alberoIntegro();
let g = spawnSync("node", [path.join(BASE, "collaudi", "rilasciotest.mjs")], { encoding: "utf8" });
const integro = ((g.stdout || "").match(/^  KO  /gm) || []).length;
console.log(`\ncontrocontrollo — catena integra: ${integro === 0 ? "VERDE" : "!! " + integro + " rosse, i conti sotto non valgono"}`);

for (const s of daFare) {
  alberoIntegro();
  try { s.fai(); } catch (e) { console.log(`\nS${s.n} — ${s.nome}\n   !! non ho potuto sabotare: ${e.message}`); muti++; continue; }
  const r = spawnSync("node", [path.join(BASE, "collaudi", "rilasciotest.mjs")], { encoding: "utf8" });
  const uscita = (r.stdout || "") + (r.stderr || "");
  const righe = uscita.split("\n").filter((x) => x.startsWith("  KO  ")).map((x) => x.slice(6));
  console.log(`\nS${s.n} — ${s.nome}`);
  console.log(`   atteso: ${s.attesa}`);
  console.log(`   esito : ${righe.length === 0 ? "!! MUTO — nessuna rossa: questa guardia non guarda" : righe.length + " rosse"}`);
  for (const x of righe.slice(0, 4)) console.log(`           · ${x}`);
  if (righe.length === 0) muti++;
}

rmSync(BASE, { recursive: true, force: true });
console.log(`\n${daFare.length} sabotaggi · ${muti} muti${muti ? " — UN MUTO VA APERTO" : " — tutte le guardie mordono"}`);
process.exit(muti || integro ? 1 : 0);
