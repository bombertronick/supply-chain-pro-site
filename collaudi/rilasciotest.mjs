/* ── I CANCELLI DELLA CATENA DI RILASCIO ──

   La catena che mette l'app online — sql_diff -> sql_spezza -> sql_lotti — non
   aveva un banco suo. Gli strumenti hanno dei cancelli dentro, ma nessuno
   provava a spegnerli, e uno era gia' stato spento senza che se ne accorgesse
   nessuno: la BILANCIA, il controllo che una zona sostituita lasci parentesi e
   tag JSX in pari come li ha trovati. Viveva nei `genNNN_pairs.mjs`, cioe' nel
   protocollo delle coppie scritte a mano, ed e' rimasta indietro quando
   `sql_diff.mjs` ha sostituito quel protocollo. Venti generazioni senza, e
   nessun rosso: perche' la sua assenza non fa diventare rosso niente.

   Le md5 dicono «il testo e' quello che intendevo», NON «il testo ha senso».
   E' con tutte le md5 verdi che il 2 agosto e' partita una versione a cui
   mancavano una riga di struttura e un tag di chiusura.

   Qui si prova la catena su file finti, minuscoli, in una cartella
   temporanea: il repository non si tocca mai. */
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync, readdirSync } from "fs";
import { createHash } from "crypto";
import { spawnSync } from "child_process";
import path from "path";

let ko = 0;
const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const QUI = path.dirname(new URL(import.meta.url).pathname);
const RAD = [path.resolve(QUI, ".."), QUI].find((d) => existsSync(path.join(d, "strumenti", "sql_diff.mjs")));
if (!RAD) { console.error("KO  non trovo strumenti/sql_diff.mjs"); process.exit(1); }
const STR = path.join(RAD, "strumenti");

const BANCO = "/tmp/banco-rilascio";
const prepara = () => { rmSync(BANCO, { recursive: true, force: true }); mkdirSync(BANCO, { recursive: true }); };
/* spawnSync e non execFileSync: quest'ultimo restituisce SOLO lo stdout quando
   il comando riesce, e lo stderr finisce sul terminale del banco. Al primo giro
   §1c era rossa per questo — l'avviso c'era, stampato davanti ai miei occhi, e
   il banco non poteva vederlo. Era il banco, non l'attrezzo. */
const corri = (args, env = {}) => {
  const r = spawnSync("node", args, { cwd: BANCO, encoding: "utf8", env: { ...process.env, ...env } });
  return { uscita: r.status ?? 1, testo: (r.stdout || "") + (r.stderr || "") };
};

/* un'app finta: piccola, ma con dentro la stessa roba che rompe i controlli
   ingenui — una freccia dentro un attributo JSX, che NON chiude un tag */
const VECCHIO = `const Riga = ({ v }) => (
  <div className="riga">
    <Testo><span>{v}</span></Testo>
    <Campo onCambia={(x) => usa(x)} />
  </div>
);
`;

/* ═══ 1. UNA ZONA CHE NON RIMETTE A POSTO LA STRUTTURA SI RIFIUTA ═══ */
console.log("\n— 1. una zona sbilanciata non diventa un rilascio —");
prepara();
writeFileSync(path.join(BANCO, "vecchio.jsx"), VECCHIO);
writeFileSync(path.join(BANCO, "nuovo.jsx"), VECCHIO.replace("<Testo><span>{v}</span></Testo>", "<Testo><span>{v}</span>"));
let r = corri([path.join(STR, "sql_diff.mjs"), "vecchio.jsx", "nuovo.jsx", "genprova", "gen-9.99"]);
ok(r.uscita !== 0, "sql_diff si ferma invece di scrivere");
ok(/SBILANCIATO|sbilanciate/.test(r.testo), "e dice che la struttura non torna");
ok(/Testo/.test(r.testo), "e nomina il componente rimasto aperto");
ok(!existsSync(path.join(BANCO, "genprova.sql")), "e non lascia nessun .sql per terra");

/* ═══ 1b. CONTRO-CONTROLLO: una zona SANA passa ═══
   Senza questo, §1 sarebbe verde anche con un sql_diff che rifiuta tutto. */
console.log("\n— 1b. contro-controllo: una zona sana passa —");
prepara();
writeFileSync(path.join(BANCO, "vecchio.jsx"), VECCHIO);
writeFileSync(path.join(BANCO, "nuovo.jsx"), VECCHIO.replace("<span>{v}</span>", "<span>{v} pezzi</span>"));
r = corri([path.join(STR, "sql_diff.mjs"), "vecchio.jsx", "nuovo.jsx", "genprova", "gen-9.99"]);
ok(r.uscita === 0, "sql_diff scrive");
ok(existsSync(path.join(BANCO, "genprova.sql")), "e il .sql c'e'");
const sql = existsSync(path.join(BANCO, "genprova.sql")) ? readFileSync(path.join(BANCO, "genprova.sql"), "utf8") : "";
ok(/backup:pre-genprova/.test(sql), "e la prima cosa che fa e' il backup di quello che c'e' online");
/* ── APERTO DAL SABOTAGGIO 5 ──
   Prima qui c'era «almeno due occorrenze di md5(», ed era VERDE PER NIENTE:
   spegnendo il cancello di partenza (and md5(value) = '<vecchia>' -> and 1=1)
   le altre occorrenze restavano e il conto tornava lo stesso. Un'asserzione che
   conta le occorrenze di una parola non sta guardando un cancello: sta
   guardando un vocabolario. Adesso si guarda lo STATEMENT dello swap e si
   pretendono le due impronte VERE, calcolate qui dai file del banco. */
const md5Di = (f) => createHash("md5").update(readFileSync(path.join(BANCO, f), "utf8"), "utf8").digest("hex");
const mV = md5Di("vecchio.jsx"), mN = md5Di("nuovo.jsx");
const swap = (sql.match(/update kv_store set value = \(select string_agg[\s\S]*?;/) || [""])[0];
ok(swap.includes(`md5(value) = '${mV}'`), "e lo swap non parte se in rete non c'e' ESATTAMENTE il sorgente da cui ho fatto il diff");
ok(swap.includes(`= '${mN}'`), "e non parte se le tessere non ricompongono ESATTAMENTE il sorgente nuovo");
ok(sql.includes(`md5(string_agg(value, '' order by key)) = '${mN}'`), "e prima ancora c'e' il cancello che lo verifica SENZA scrivere niente");
ok(/delete from kv_store where key like 'tmp:genprova:p%'/.test(sql), "e si ripulisce le tessere temporanee");

/* ═══ 1c. LO SBILANCIO VOLUTO SI PUO' DICHIARARE ═══
   Un cancello che non si puo' aprire di proposito viene aggirato copiando il
   file a mano, ed e' peggio. Si apre, ma si deve DIRE. */
console.log("\n— 1c. uno sbilancio voluto si dichiara, non si aggira —");
prepara();
writeFileSync(path.join(BANCO, "vecchio.jsx"), VECCHIO);
writeFileSync(path.join(BANCO, "nuovo.jsx"), VECCHIO.replace("<Testo><span>{v}</span></Testo>", "<Testo><span>{v}</span>"));
r = corri([path.join(STR, "sql_diff.mjs"), "vecchio.jsx", "nuovo.jsx", "genprova", "gen-9.99"], { BILANCIA: "avvisa" });
ok(r.uscita === 0, "con BILANCIA=avvisa la catena va avanti");
ok(/avvisa/.test(r.testo), "e lo dice a voce alta invece di tacere");
ok(existsSync(path.join(BANCO, "genprova.sql")), "e il .sql viene scritto");

/* ═══ 2. LA FRECCIA DENTRO UN ATTRIBUTO NON E' UN TAG APERTO ═══
   E' il falso allarme che aveva reso inutile la prima bilancia: tre volte su
   tre gridava al lupo sui pezzi sani. Un controllo che da' falsi allarmi viene
   ignorato, e allora tanto vale non averlo. */
console.log("\n— 2. nessun falso allarme sulle frecce dentro gli attributi —");
prepara();
writeFileSync(path.join(BANCO, "vecchio.jsx"), VECCHIO);
writeFileSync(path.join(BANCO, "nuovo.jsx"), VECCHIO.replace("onCambia={(x) => usa(x)}", "onCambia={(x) => usa(x, 2)} aria-label=\"riga\""));
r = corri([path.join(STR, "sql_diff.mjs"), "vecchio.jsx", "nuovo.jsx", "genprova", "gen-9.99"]);
ok(r.uscita === 0, "una zona piena di frecce passa senza allarmi");
ok(!/SBILANCIATO/.test(r.testo), "e la bilancia non dice niente");

/* ═══ 2b. IL LIMITE DICHIARATO, CON I NUMERI ═══
   La bilancia conta SOLO i componenti maiuscoli. Un </div> o uno </span>
   perso NON viene visto, ed e' una scelta misurata, non una dimenticanza:
   estesa ai minuscoli, sulle zone vere di quattro rilasci (gen-6.17 -> gen-6.21,
   66 zone) da' TRE falsi allarmi — due parole dentro un commento che sembrano
   tag, e un <main> aperto in una zona e chiuso fuori. Un controllo che blocca
   un rilascio e sbaglia il 4,5% delle volte viene aggirato, e allora tanto vale
   non averlo. Questa sezione tiene il limite SCRITTO invece che detto: se un
   giorno diventa rossa, vuol dire che qualcuno ha esteso la bilancia — e allora
   va rifatta la misura dei falsi allarmi prima di tenersela. */
console.log("\n— 2b. limite dichiarato: i tag minuscoli non si contano —");
prepara();
writeFileSync(path.join(BANCO, "vecchio.jsx"), VECCHIO);
writeFileSync(path.join(BANCO, "nuovo.jsx"), VECCHIO.replace("<span>{v}</span>", "<span>{v}"));
r = corri([path.join(STR, "sql_diff.mjs"), "vecchio.jsx", "nuovo.jsx", "genprova", "gen-9.99"]);
ok(r.uscita === 0 && !/SBILANCIATO/.test(r.testo),
  "uno </span> perso passa — LIMITE DICHIARATO E MISURATO, non un difetto");

/* ═══ 3. L'AUDIT PER TESSERA NON PUO' SPARIRE IN SILENZIO ═══
   E' il cancello che a gen-6.11 ha trovato una tessera diversa da quella
   provata in locale. Si scrive solo se a sql_spezza si passa anche il sorgente
   VECCHIO: dimenticarlo non deve poter essere un successo. */
console.log("\n— 3. l'audit per tessera non sparisce in silenzio —");
prepara();
writeFileSync(path.join(BANCO, "vecchio.jsx"), VECCHIO);
writeFileSync(path.join(BANCO, "nuovo.jsx"), VECCHIO.replace("<span>{v}</span>", "<span>{v} pezzi</span>"));
corri([path.join(STR, "sql_diff.mjs"), "vecchio.jsx", "nuovo.jsx", "genprova", "gen-9.99"]);
r = corri([path.join(STR, "sql_spezza.mjs"), "genprova.sql", "1800"]);
ok(r.uscita !== 0, "senza il sorgente vecchio sql_spezza NON esce con successo");
ok(/audit/i.test(r.testo), "e nomina l'audit che non ha scritto");
const senzaAudit = existsSync(path.join(BANCO, "genprova-pezzi", "audit.sql"));
ok(!senzaAudit, "e infatti audit.sql non c'e'");

prepara();
writeFileSync(path.join(BANCO, "vecchio.jsx"), VECCHIO);
writeFileSync(path.join(BANCO, "nuovo.jsx"), VECCHIO.replace("<span>{v}</span>", "<span>{v} pezzi</span>"));
corri([path.join(STR, "sql_diff.mjs"), "vecchio.jsx", "nuovo.jsx", "genprova", "gen-9.99"]);
r = corri([path.join(STR, "sql_spezza.mjs"), "genprova.sql", "1800", "vecchio.jsx"]);
ok(r.uscita === 0, "col sorgente vecchio sql_spezza riesce");
const fAudit = path.join(BANCO, "genprova-pezzi", "audit.sql");
ok(existsSync(fAudit), "e audit.sql c'e'");
if (existsSync(fAudit)) {
  const a = readFileSync(fAudit, "utf8");
  ok(/combaciano/.test(a) && /diverse/.test(a), "e chiede quante combaciano e quali sono diverse");
  ok(/tmp:genprova:p001/.test(a), "e nomina le tessere per chiave");
}

/* ═══ 4. I LOTTI NON MESCOLANO L'ORDINE ═══ */
console.log("\n— 4. i lotti si mandano in ordine —");
r = corri([path.join(STR, "sql_lotti.mjs"), "genprova-pezzi"]);
ok(r.uscita === 0, "sql_lotti raggruppa i pezzi");
const dirLotti = path.join(BANCO, "genprova-lotti");
if (existsSync(dirLotti)) {
  const lotti = readdirSync(dirLotti).filter((f) => /^L\d+\.sql$/.test(f)).sort((a, b) => +a.slice(1) - +b.slice(1));
  ok(lotti.length > 0, `${lotti.length} lotti scritti`);
  const primo = readFileSync(path.join(dirLotti, lotti[0]), "utf8");
  ok(/backup:pre-genprova/.test(primo), "e il PRIMO lotto e' il backup: se salta, salta prima di toccare qualsiasi cosa");
  const ultimo = readFileSync(path.join(dirLotti, lotti[lotti.length - 1]), "utf8");
  ok(/delete from kv_store where key like 'tmp:genprova:p%'/.test(ultimo), "e l'ULTIMO e' la pulizia delle temporanee");
} else ok(false, "la cartella dei lotti non c'e'");

rmSync(BANCO, { recursive: true, force: true });
console.log(`\n${ko ? "!! " + ko + " rosse" : "tutto verde"} — ${ko ? "la catena di rilascio ha un cancello che non morde" : "i cancelli della catena mordono"}`);
process.exit(ko ? 1 : 0);
