/* I SABOTAGGI DEI MESTIERI UNICI (gen-6.23 · gen-6.24), CONTATI UNO PER UNO.

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

   S8 E S9 SONO IL CUORE DI GEN-6.24: rimettono il `&& length > 0` che i due
   predicati avevano fino a gen-6.23. Sembrava prudenza ed era la
   contraddizione che ha ucciso il primo disegno — l'assegnazione tornava a
   decidere il permesso, cioe' la deduzione vietata, solo al contrario.

   S15 NON E' UN DOPPIONE DI S14: scrive la guardia del giro guidato in un
   modo che tiene VERDE §23 e rosso §23c. E' la prova che il controllo sui
   conteggi non e' decorativo, e che §23 da sola sarebbe verde-per-assenza.

   S17 E' IL MUTO APERTO: toglie la cascata della postazione cancellata, che
   nessuna schermata puo' vedere. §30 la misura dove vive, nel documento.

   Uso: node sabotaggi-mestiereunico.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero. */
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-mestiereunico.jsx";
const DIARIO = "/tmp/diario-sabotaggi-mestiereunico.txt";
const BANCO = "mestiereunicotest.mjs";

/* i due predicati, come li ha lasciati gen-6.24: l'interruttore e basta */
const CORPO_POST = `  return profilo?.ruolo !== "admin" && !!profilo?.soloPostazioni;`;
const CORPO_CONT = `  return profilo?.ruolo !== "admin" && !!profilo?.soloConteggi;`;
/* la guardia del giro guidato, riga intera */
const TOUR = `      if (!unico && !localStorage.getItem(k) && !localStorage.getItem("scp:tour:v1")) setGuida(passiPanoramica(NAV));`;
/* la cascata di gen-6.24, corpo esatto dentro il Conferma della postazione */
const CASCATA = `          for (const pr of s.profili || []) {
            if (!(pr.postazioniIds || []).includes(delPost.id)) continue;
            const resta = pr.postazioniIds.filter((x) => x !== delPost.id);
            pr.postazioniIds = resta.length ? resta : undefined;
          }
`;

const SABOTAGGI = [
  { n: 1, nome: "l'interruttore delle postazioni non conta piu' niente",
    attese: ["§1", "§2", "§20", "§21", "§22", "§23", "§27", "§27b"],
    perche: "il profilo torna a vedere tutto come prima. NON §3: quella e' la sentinella del MURO, e il muro S1 non lo tocca",
    da: CORPO_POST,
    a: `  return false;` },

  { n: 2, nome: "l'interruttore dei conteggi non conta piu' niente",
    attese: ["§4", "§5", "§24", "§28", "§28b", "§22c", "§23c"],
    perche: "lo stesso per i conteggi. NON §6, per la stessa ragione di §3 in S1. §24d resta verde apposta: senza mestiere le righe tornano a tutti",
    da: CORPO_CONT,
    a: `  return false;` },

  { n: 3, nome: "il mestiere si DEDUCE dall'assegnazione invece di leggerlo dall'interruttore",
    attese: ["§10", "§21b", "§23b", "§27", "§27b"],
    perche: "§10 e' il guardiano della regola «non si deduce»: il profilo con le postazioni ma SENZA interruttore perderebbe le sue voci, e nessuno avrebbe spento niente. §21b e §23b sono i suoi contro-controlli, e cadono con lui",
    da: CORPO_POST,
    a: `  return profilo?.ruolo !== "admin" && (profilo?.postazioniIds || []).length > 0;` },

  { n: 4, nome: "la barra delle postazioni si riprende le altre voci",
    attese: ["§2", "§27"],
    perche: "«vede solo le comande» vuol dire che le altre non ci sono, non che sono piu' in la'",
    da: `  const BARRA_POSTAZIONI = [{ id: "comande", nome: "Comande", icona: CheckCheck, pronta: true }];`,
    a: `  const BARRA_POSTAZIONI = [{ id: "home", nome: "Home", icona: Home, pronta: true }, { id: "comande", nome: "Comande", icona: CheckCheck, pronta: true }];` },

  { n: 5, nome: "si atterra sulla Home invece che dentro il proprio mestiere",
    attese: ["§1", "§4", "§27b", "§28b"],
    perche: "chi ha una stanza sola non deve passare da un indice — e finisce davanti al MURO invece che dentro la sua stanza. NON §27 ne' §28: quelle guardano la BARRA, che S5 non tocca — e' §27b/§28b a guardare dentro la stanza. Avevo scritto anche §27 e §28, e la misura mi ha corretto: e' esattamente il lavoro che questa lista fa",
    da: `useState(soloQui ? "cassa" : soloPost ? "comande" : soloCont ? "conteggi" : "home")`,
    a: `useState(soloQui ? "cassa" : "home")` },

  { n: 6, nome: "via il muro: le altre stanze restano aperte dalle porte di domani",
    attese: ["§3", "§6"],
    perche: "le due sentinelle sul sorgente, unica guardia di quelle righe: il muro vale anche per le porte di domani",
    da: `      (soloPost && vista !== "comande") ||
      (soloCont && vista !== "conteggi") ||`,
    a: `` },

  { n: 7, nome: "le Comande tornano a essere un regalo del posto vuoto",
    attese: ["§7"],
    perche: "il profilo senza nessuna postazione assegnata se le ritrova in barra — e' il guasto che Valerio ha visto sul profilo «Luca»",
    da: `      && (profilo.postazioniIds || []).length > 0\n`,
    a: `` },

  /* ── gen-6.24 ── */
  { n: 8, nome: "il mestiere delle postazioni torna appeso alla LUNGHEZZA della lista",
    attese: ["§27", "§27b"],
    perche: "cancellata l'ultima postazione il predicato cade, e al ragazzo si riapre addosso tutta l'app che nessuno gli aveva acceso",
    da: CORPO_POST,
    a: `  return profilo?.ruolo !== "admin" && !!profilo?.soloPostazioni && (profilo?.postazioniIds || []).length > 0;` },

  { n: 9, nome: "il mestiere dei conteggi torna appeso alla LUNGHEZZA della lista",
    attese: ["§28", "§28b"],
    perche: "come S8, dal lato dei magazzini",
    da: CORPO_CONT,
    a: `  return profilo?.ruolo !== "admin" && !!profilo?.soloConteggi && (profilo?.magazziniIds || []).length > 0;` },

  { n: 10, nome: "la lente delle AZIONI torna a chiedere solo «sta in cassa?»",
    attese: ["§20", "§24"],
    perche: "e' la meta' che gen-6.23 non aveva portato: al pizzaiolo la lente offriva ancora Trasferisci, Conta, Aggiungi prodotti",
    da: `    const solo = mestiereUnico(profilo);
    if (solo) return a.d === solo;`,
    a: `    if (soloCassa(profilo)) return a.d === "cassa";` },

  { n: 11, nome: "la lente delle RIGHE torna a chiedere solo «sta in cassa?»",
    attese: ["§21"],
    perche: "al pizzaiolo tornano le righe dei prodotti, e ognuna porta un bottone sui Magazzini che per lui e' murato. §24d resta verde: la riga giusta tocca solo la cassa",
    da: `  const solo = mestiereUnico(profilo);
  if (solo && solo !== "conteggi") return [];`,
    a: `  if (soloCassa(profilo)) return [];` },

  { n: 12, nome: "la lente delle RIGHE si porta via anche chi CONTA",
    attese: ["§24d"],
    perche: "la simmetria che la MISURA ha bocciato — per un contatore quelle righe sono il lavoro, non una porta",
    da: `  if (solo && solo !== "conteggi") return [];`,
    a: `  if (solo) return [];` },

  { n: 13, nome: "il tasto « ? » torna a nominare la sola cassa",
    attese: ["§22", "§22c"],
    perche: "Plancia e panoramica ricompaiono a chi ha una stanza sola",
    da: `          {!unico && (<>`,
    a: `          {!soloQui && (<>` },

  { n: 14, nome: "il giro guidato torna a nominare la sola cassa",
    attese: ["§23", "§23c"],
    perche: "la perdita piu' grave perche' e' MUTA — sette schermate partono addosso da sole al primo accesso",
    da: TOUR,
    a: TOUR.replace("!unico", "!soloQui") },

  { n: 15, nome: "il giro guidato nomina due mestieri su tre (postazioni si', conteggi no)",
    attese: ["§23c"],
    perche: "§23 resta VERDE: e' la prova che §23c non e' un doppione e che §23 da sola sarebbe verde-per-assenza",
    da: TOUR,
    a: TOUR.replace("!unico", "!soloQui && !soloPost") },

  { n: 16, nome: "l'interruttore gia' acceso torna a nascondersi con la lista vuota",
    attese: ["§29"],
    perche: "e' il guasto che rendeva l'interruttore IMPOSSIBILE DA SPEGNERE — Valerio non lo vedeva nemmeno",
    da: `          {(postIds.length > 0 || soloPosti) && (`,
    a: `          {postIds.length > 0 && (` },

  { n: 17, nome: "via la cascata: la postazione cancellata resta appesa nei profili",
    attese: ["§30"],
    perche: "IL MUTO APERTO: nessuna schermata puo' vederlo (ed e' giusto cosi', da gen-6.24 la lunghezza non decide piu' niente), quindi §30 va a misurarlo nel DOCUMENTO",
    da: CASCATA,
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
  try { out = execFileSync(process.execPath, [BANCO], { encoding: "utf8", maxBuffer: 16e6, env: { ...process.env, SORGENTE: LAVORO } }); }
  catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
  /* il § si legge DALLA RIGA ROSSA, non dall'intestazione della sezione:
     un'intestazione copre piu' controlli e mentirebbe sul nome (gen-6.24) */
  const rosse = out.split("\n").filter((l) => /^ {2}KO {2}/.test(l));
  const viste = [...new Set(rosse.map((l) => (l.match(/^ {2}KO {2}(§[0-9a-z]+)/) || [])[1] || "§?"))];
  /* ── L'ATTESA SI CONFRONTA, NON SI RACCONTA (gen-6.24) ──
     Il primo giro di questa campagna l'ha scoperto da solo: S1 prometteva
     «§3 rossa» e §3 non e' MAI diventata rossa — S1 non tocca il muro, e §3
     e' la sentinella del muro. Nessuno se n'era accorto perche' il verdetto
     guardava solo «rossi > 0»: un'attesa che nessuno confronta non e'
     un'attesa, e' una didascalia. Adesso `attese` e' una lista di §, la
     macchina la confronta con quella misurata, e una differenza in un verso
     o nell'altro vale «da guardare» esattamente come un muto.
     MANCANTE = la promessa non mantenuta (il controllo che dovevo far
     arrossire e' rimasto verde: o il sabotaggio non morde li', o quel
     controllo e' cieco). IN PIU' = un rosso che non avevo previsto: non e'
     un guasto di per se', ma va capito prima di chiamarlo «come atteso». */
  const attese = sab.attese || [];
  const manca = attese.filter((x) => !viste.includes(x));
  const extra = viste.filter((x) => !attese.includes(x));
  const buono = rosse.length > 0 && manca.length === 0 && extra.length === 0;
  buono ? buoni++ : cattivi++;
  const scarto = [manca.length ? `MANCANTE ${manca.join(" ")}` : "", extra.length ? `IN PIU' ${extra.join(" ")}` : ""].filter(Boolean).join(" · ");
  const riga = `S${sab.n} «${sab.nome}» — ${rosse.length === 0 ? "MUTO — DA APRIRE" : `${rosse.length} rossi in ${viste.join(" ")}`}${scarto ? " · " + scarto : ""} · ${sab.perche}`;
  console.log((buono ? "  ok  " : "  !!  ") + riga);
  appendFileSync(DIARIO, riga + "\n");
}
console.log("\nrimetto il pacchetto vero...");
execFileSync(process.execPath, ["build.mjs", VERO], { stdio: "pipe" });
console.log(`${buoni} come attesi, ${cattivi} da guardare · diario in ${DIARIO}`);
process.exit(cattivi ? 1 : 0);
