/* I SABOTAGGI DELLA CASSA SU TABLET (gen-6.23), CONTATI UNO PER UNO.

   Stessa macchina delle altre generazioni: si parte da una copia INTEGRA del
   sorgente, si rompe UNA cosa sola, si RICOSTRUISCE il pacchetto da quella
   copia, si gira cassatablettest.mjs e si contano i rossi. Un MUTO non e' un
   risultato: e' una domanda, e va aperta.

   PERCHE' CINQUE E NON QUATTRO: il quinto (via l'appiccicato del conto) e'
   nato da un buco trovato mentre scrivevo. Il codice aveva una riga — il
   conto `sticky top-2` — che NESSUN controllo poteva far diventare rossa,
   perche' a schermo fermo il conto si vede comunque: sta in cima alla sua
   colonna. Serviva scorrere. Da li' e' nata §1b, e solo dopo questo
   sabotaggio ha avuto qualcosa da rompere.

   Uso: node sabotaggi-cassatablet.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero. */
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-cassatablet.jsx";
const DIARIO = "/tmp/diario-sabotaggi-cassatablet.txt";
const BANCO = "cassatablettest.mjs";

const STILE_FASCIA = `style={{ left: colonna ? colonna.left : 12, right: colonna ? colonna.right : 12,
              bottom: colonna ? 12 : "calc(5.4rem + env(safe-area-inset-bottom))" }}>`;

const SABOTAGGI = [
  { n: 1, nome: "via le due colonne: la Cassa torna una colonna sola anche sul tablet",
    attesa: "§1, §1b e §4 rosse: «Incassa» torna sotto il bordo dello schermo",
    da: `<div className={grande ? "flex gap-3 items-start" : ""}>`,
    a: `<div className={""}>` },

  { n: 2, nome: "il conto va a SINISTRA invece che a destra",
    attesa: "§4 rossa: il pollice batte sul listino, l'occhio va a fine riga",
    da: `grande ? "flex gap-3 items-start" : ""`,
    a: `grande ? "flex flex-row-reverse gap-3 items-start" : ""` },

  { n: 3, nome: "la fascia non segue piu' la colonna e torna larga quanto lo schermo",
    attesa: "§3 rossa (e §2): e' la lastra che copriva tre file di pizze e il conto",
    da: STILE_FASCIA,
    a: `style={{ left: 12, right: 12, bottom: "calc(5.4rem + env(safe-area-inset-bottom))" }}>`,
    tutte: true },

  { n: 4, nome: "la soglia sparisce: anche il telefono prende le due colonne",
    attesa: "§11 rossa: a 390px il conto finirebbe in una colonna da 360, e il telefono non deve cambiare di un pixel",
    da: `window.innerWidth >= 1024`,
    a: `window.innerWidth >= 0` },

  { n: 5, nome: "il conto non e' piu' appiccicato in alto",
    attesa: "§1b rossa: a schermo fermo non cambia niente, ma appena si scorre il listino il totale scivola via",
    da: `grande ? "w-[360px] shrink-0 sticky top-2" : ""`,
    a: `grande ? "w-[360px] shrink-0" : ""` },
];

const arg = process.argv[2] ? Number(process.argv[2]) : null;
const vero = readFileSync(VERO, "utf8");
appendFileSync(DIARIO, `\n=== giro del ${new Date().toISOString()} ===\n`);
console.log(`sabotaggi della Cassa su tablet — ${arg ? "solo S" + arg : SABOTAGGI.length + " da girare"}\n`);
let buoni = 0, cattivi = 0;
for (const sab of SABOTAGGI) {
  if (arg && sab.n !== arg) continue;
  const quante = vero.split(sab.da).length - 1;
  const attese = sab.tutte ? 2 : 1;
  if (quante !== attese) {
    const riga = `S${sab.n} «${sab.nome}» — NON APPLICABILE: l'ancora compare ${quante} volte invece di ${attese}`;
    console.log("  !!  " + riga); appendFileSync(DIARIO, riga + "\n"); cattivi++; continue;
  }
  writeFileSync(LAVORO, sab.tutte ? vero.split(sab.da).join(sab.a) : vero.replace(sab.da, sab.a));
  try { execFileSync(process.execPath, ["build.mjs", LAVORO], { stdio: "pipe" }); }
  catch (e) {
    const riga = `S${sab.n} «${sab.nome}» — IL PACCHETTO NON SI COSTRUISCE (e' un'informazione, non un rosso)`;
    console.log("  !!  " + riga); appendFileSync(DIARIO, riga + "\n"); cattivi++; continue;
  }
  let out = "";
  try { out = execFileSync(process.execPath, [BANCO], { encoding: "utf8", maxBuffer: 16e6 }); }
  catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
  const rossi = (out.match(/^ {2}KO {2}/gm) || []).length;
  const sez = [...new Set(out.split("\n").reduce((a, l) => {
    /* «— 2-3. la fascia…» non e' «— 2.»: con l'ancora vecchia questa riga non
       veniva riconosciuta e i rossi finivano attribuiti alla sezione PRIMA.
       Il rosso c'era, il cartello mentiva. */
    const m = l.match(/^— ([^.]+)\./); if (m) a.s = "§" + m[1].trim();
    if (/^ {2}KO {2}/.test(l) && a.s) a.l.push(a.s);
    return a;
  }, { s: null, l: [] }).l)].join(" ");
  const buono = rossi > 0;
  buono ? buoni++ : cattivi++;
  const riga = `S${sab.n} «${sab.nome}» — atteso ${sab.attesa} · ${rossi === 0 ? "MUTO — DA APRIRE" : `${rossi} rossi in ${sez}`}`;
  console.log((buono ? "  ok  " : "  !!  ") + riga);
  appendFileSync(DIARIO, riga + "\n");
}
console.log("\nrimetto il pacchetto vero...");
execFileSync(process.execPath, ["build.mjs", VERO], { stdio: "pipe" });
console.log(`${buoni} come attesi, ${cattivi} da guardare · diario in ${DIARIO}`);
process.exit(cattivi ? 1 : 0);
