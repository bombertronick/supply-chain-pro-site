/* I SABOTAGGI DEL SECONDO CANCELLO DELLA DISPENSA.

   Il cancello nuovo (16 settembre) pretende che le voci VECCHIE del file siano
   esattamente quelle in rete. Qui si spegne, una cosa per volta, e si conta
   quante rosse fa uscire da dispensatest. Si lavora su una copia in /tmp: il
   repository non si tocca mai.

   Uso: node sabotaggi-dispensa.mjs [numero] */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, cpSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

const QUI = path.dirname(new URL(import.meta.url).pathname);
const RAD = [path.resolve(QUI, ".."), QUI].find((d) => existsSync(path.join(d, "strumenti", "dispensa.mjs")));
if (!RAD) { console.error("KO  non trovo strumenti/dispensa.mjs"); process.exit(1); }

const BASE = "/tmp/dispensa-sabotata";
function alberoIntegro() {
  rmSync(BASE, { recursive: true, force: true });
  mkdirSync(path.join(BASE, "collaudi"), { recursive: true });
  mkdirSync(path.join(BASE, "strumenti"), { recursive: true });
  cpSync(path.join(RAD, "strumenti", "dispensa.mjs"), path.join(BASE, "strumenti", "dispensa.mjs"));
  cpSync(path.join(QUI, "dispensatest.mjs"), path.join(BASE, "collaudi", "dispensatest.mjs"));
}
const sostituisci = (f, da, a) => {
  const t = readFileSync(path.join(BASE, f), "utf8");
  if (!t.includes(da)) throw new Error(`in ${f} non trovo «${da.slice(0, 50)}…»`);
  writeFileSync(path.join(BASE, f), t.replace(da, a));
};

const SABOTAGGI = [
  { n: 1, nome: "il cancello guarda di nuovo solo la revisione",
    attesa: "§6 rossa: e' com'era fino al 16 settembre — un refuso nel titolo di una voce vecchia riscriveva l'indice di tutti, in modo irreversibile e con l'esito verde",
    fai: () => sostituisci("strumenti/dispensa.mjs",
      "    and md5((value::jsonb->'voci')::text) = md5(((${b64(vecchie)})::jsonb)::text)\n", "") },

  { n: 2, nome: "i due esiti tornano a essere uno solo",
    attesa: "§6 rossa: «un altro ha scritto prima» e «hai ricopiato male» mandano a cercare persone diverse, e dirli con la stessa frase fa perdere il pomeriggio a chi legge",
    fai: () => sostituisci("strumenti/dispensa.mjs", "  else 'SNAPSHOT DIVERSO:", "  else 'CONFLITTO: boh, qualcosa —") },

  { n: 3, nome: "le voci vecchie viaggiano in chiaro invece che in base64",
    attesa: "§4 rossa: il 2 agosto un pezzo conteneva /[\\u0300-\\u036f]/ e in chiaro l'SQL si rompeva",
    fai: () => sostituisci("strumenti/dispensa.mjs", "md5(((${b64(vecchie)})::jsonb)::text)", "md5(((${q(vecchie)})::jsonb)::text)") },

  { n: 4, nome: "il cancello si spezza in due statement",
    attesa: "§3 e §6 rosse: fra i due ci sarebbe uno stato intermedio, che e' esattamente il difetto r131 gia' pagato una volta",
    fai: () => sostituisci("strumenti/dispensa.mjs", ")${dentro}\nselect case when exists", ");\n${dentro}\nselect case when exists") },

  { n: 5, nome: "«ultima» prende la voce col timestamp piu' alto invece dell'ultima in fila",
    attesa: "§7 rossa: i «t» sono stati scritti a mano piu' di una volta e in rete oggi NON sono monotoni — chk-20260915 ha un t piu' basso di chk-20260914",
    fai: () => sostituisci("strumenti/dispensa.mjs", "(value::jsonb->'voci'->-1->>'id') as ultima", "(value::jsonb->'voci'->0->>'id') as ultima") },

  { n: 6, nome: "«verifica» diventa una mutazione",
    attesa: "§8 rossa: un comando che si chiama «verifica» e scrive e' una trappola",
    fai: () => sostituisci("strumenti/dispensa.mjs", "export const sqlVerifica = () => `select string_agg(",
      "export const sqlVerifica = () => `update kv_store set value = value where false; select string_agg(") },
];

const quale = process.argv[2] ? +process.argv[2] : null;
const daFare = quale ? SABOTAGGI.filter((s) => s.n === quale) : SABOTAGGI;
let muti = 0;

alberoIntegro();
const g = spawnSync("node", [path.join(BASE, "collaudi", "dispensatest.mjs")], { encoding: "utf8" });
const integro = ((g.stdout || "").match(/^  KO  /gm) || []).length + (g.status ? (g.stdout ? 0 : 1) : 0);
console.log(`\ncontrocontrollo — dispensa integra: ${integro === 0 ? "VERDE" : "!! " + integro + " rosse, i conti sotto non valgono"}`);

for (const s of daFare) {
  alberoIntegro();
  try { s.fai(); } catch (e) { console.log(`\nS${s.n} — ${s.nome}\n   !! non ho potuto sabotare: ${e.message}`); muti++; continue; }
  const r = spawnSync("node", [path.join(BASE, "collaudi", "dispensatest.mjs")], { encoding: "utf8" });
  const uscita = (r.stdout || "") + (r.stderr || "");
  const righe = uscita.split("\n").filter((x) => x.startsWith("  KO  ")).map((x) => x.slice(6));
  /* un modulo che non si carica piu' e' il rosso piu' forte che esista: il
     banco non parte nemmeno. Va contato, se no risulta muto per finta. */
  const esplosa = r.status !== 0 && righe.length === 0;
  console.log(`\nS${s.n} — ${s.nome}`);
  console.log(`   atteso: ${s.attesa}`);
  console.log(`   esito : ${righe.length ? righe.length + " rosse" : esplosa ? "il banco non parte nemmeno (rosso pieno)" : "!! MUTO — nessuna rossa"}`);
  for (const x of righe.slice(0, 3)) console.log(`           · ${x}`);
  if (!righe.length && !esplosa) muti++;
}

rmSync(BASE, { recursive: true, force: true });
console.log(`\n${daFare.length} sabotaggi · ${muti} muti${muti ? " — UN MUTO VA APERTO" : " — tutte le guardie mordono"}`);
process.exit(muti || integro ? 1 : 0);
