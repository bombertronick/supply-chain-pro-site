/* I SABOTAGGI DEI MESTIERI UNICI (gen-6.23), CONTATI UNO PER UNO.

   Si parte da una copia INTEGRA del sorgente, si rompe UNA cosa sola, si
   RICOSTRUISCE il pacchetto da quella copia, si gira mestiereunicotest.mjs e
   si contano i rossi. Un MUTO non e' un risultato: e' una domanda, e va aperta.

   S3 MERITA UNA RIGA: fa DEDURRE il mestiere dall'assegnazione, invece di
   leggerlo dall'interruttore. E' la scelta che questa casa ha respinto per
   iscritto (app.jsx, sopra soloPostazioni), ed e' anche la lettura piu'
   comoda delle parole di Valerio «ogni profilo deve vedere solo cio' che gli
   si assegna». Comoda e sbagliata: con la deduzione un profilo perde voci
   senza che nessuno abbia spento niente. §10 e' il guardiano, e S3 serve a
   dimostrare che il guardiano e' sveglio.

   Uso: node sabotaggi-mestiereunico.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero. */
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-mestiereunico.jsx";
const DIARIO = "/tmp/diario-sabotaggi-mestiereunico.txt";
const BANCO = "mestiereunicotest.mjs";

const CORPO_POST = `  return profilo?.ruolo !== "admin" && !!profilo?.soloPostazioni && (profilo?.postazioniIds || []).length > 0;`;

const SABOTAGGI = [
  { n: 1, nome: "l'interruttore delle postazioni non conta piu' niente",
    attesa: "§1, §2 e §3 rosse: il profilo torna a vedere tutto come prima",
    da: CORPO_POST,
    a: `  return false;` },

  { n: 2, nome: "l'interruttore dei conteggi non conta piu' niente",
    attesa: "§4, §5 e §6 rosse",
    da: `  return profilo?.ruolo !== "admin" && !!profilo?.soloConteggi && (profilo?.magazziniIds || []).length > 0;`,
    a: `  return false;` },

  { n: 3, nome: "il mestiere si DEDUCE dall'assegnazione invece di leggerlo dall'interruttore",
    attesa: "§10 rossa: il profilo con le postazioni assegnate ma SENZA interruttore perderebbe le sue voci, e nessuno avrebbe spento niente",
    da: CORPO_POST,
    a: `  return profilo?.ruolo !== "admin" && (profilo?.postazioniIds || []).length > 0;` },

  { n: 4, nome: "la barra delle postazioni si riprende le altre voci",
    attesa: "§2 rossa: «vede solo le comande» vuol dire che le altre non ci sono, non che sono piu' in la'",
    da: `  const BARRA_POSTAZIONI = [{ id: "comande", nome: "Comande", icona: CheckCheck, pronta: true }];`,
    a: `  const BARRA_POSTAZIONI = [{ id: "home", nome: "Home", icona: Home, pronta: true }, { id: "comande", nome: "Comande", icona: CheckCheck, pronta: true }];` },

  { n: 5, nome: "si atterra sulla Home invece che dentro il proprio mestiere",
    attesa: "§1 e §4 rosse: chi ha una stanza sola non deve passare da un indice",
    da: `useState(soloQui ? "cassa" : soloPost ? "comande" : soloCont ? "conteggi" : "home")`,
    a: `useState(soloQui ? "cassa" : "home")` },

  { n: 6, nome: "via il muro: le altre stanze restano aperte dalle porte di domani",
    attesa: "§3 e §6 rosse: sono le due sentinelle sul sorgente, l'unica guardia di quelle righe",
    da: `      (soloPost && vista !== "comande") ||
      (soloCont && vista !== "conteggi") ||`,
    a: `` },

  { n: 7, nome: "le Comande tornano a essere un regalo del posto vuoto",
    attesa: "§7 rossa: il profilo senza nessuna postazione assegnata se le ritrova in barra — e' il guasto che Valerio ha visto sul profilo «Luca»",
    da: `      && (profilo.postazioniIds || []).length > 0\n`,
    a: `` },
];

const arg = process.argv[2] ? Number(process.argv[2]) : null;
const vero = readFileSync(VERO, "utf8");
appendFileSync(DIARIO, `\n=== giro del ${new Date().toISOString()} ===\n`);
console.log(`sabotaggi dei mestieri unici — ${arg ? "solo S" + arg : SABOTAGGI.length + " da girare"}\n`);
let buoni = 0, cattivi = 0;
for (const sab of SABOTAGGI) {
  if (arg && sab.n !== arg) continue;
  const quante = vero.split(sab.da).length - 1;
  if (quante !== 1) {
    const riga = `S${sab.n} «${sab.nome}» — NON APPLICABILE: l'ancora compare ${quante} volte`;
    console.log("  !!  " + riga); appendFileSync(DIARIO, riga + "\n"); cattivi++; continue;
  }
  writeFileSync(LAVORO, vero.replace(sab.da, sab.a));
  try { execFileSync(process.execPath, ["build.mjs", LAVORO], { stdio: "pipe" }); }
  catch { const riga = `S${sab.n} «${sab.nome}» — IL PACCHETTO NON SI COSTRUISCE (informazione, non un rosso)`;
    console.log("  !!  " + riga); appendFileSync(DIARIO, riga + "\n"); cattivi++; continue; }
  let out = "";
  try { out = execFileSync(process.execPath, [BANCO], { encoding: "utf8", maxBuffer: 16e6 }); }
  catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
  const rossi = (out.match(/^ {2}KO {2}/gm) || []).length;
  const sez = [...new Set(out.split("\n").reduce((a, l) => {
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
