/* I SABOTAGGI DI gen-6.22, CONTATI UNO PER UNO.

   Stessa macchina di gen-6.21: si parte da una copia INTEGRA del sorgente, si
   rompe UNA cosa sola, si RICOSTRUISCE il pacchetto da quella copia, si gira
   il banco e si contano i rossi. Un MUTO non e' un risultato: e' una domanda,
   e va aperta. Quando il muto e' il risultato giusto va DICHIARATO PRIMA di
   girare (campo `muto`), col perche' dentro.

   IL BANCO DI CASA E' protocollotest.mjs, sezioni 16..21b: sono le sette
   scene delle schede gemelle, e quattro di loro (§18, §19, §20, §21, §21b)
   sono nate ROSSE sul codice online di gen-6.21 prima che la cura esistesse.

   UNA COSA CHE QUESTA GENERAZIONE HA IMPARATO DAL PRIMO GIRO: §19 era VERDE
   sul codice non curato perche' aspettava sei secondi e il backoff dell'altra
   scheda ne vuole otto. Un'attesa a tempo misura la fortuna: adesso la
   sezione chiude la scheda che disturba e CONTA le scritture dell'altra
   prima di guardare il disco. Il rosso e' arrivato al primo colpo dopo.

   Uso: node sabotaggi-gen622.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero. */
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-sabotato.jsx";
const PASSATO = "/tmp/sorgente-passata.jsx";
const DIARIO = "/tmp/diario-sabotaggi-gen622.txt";
const FAMIGLIA = "16,16b,18,19,20,21,21b";
/* LE DUE SEZIONI DI REGRESSIONE, e non sono un di piu': §1 e §7b pretendono che
   dopo la consegna la chiave scp:coda:v1 sia SPARITA. Sono le sole che guardano
   il disco DOPO che la coda si e' svuotata, cioe' il posto dove una voce
   adottata e non presa in carico resta attaccata per sempre. Al primo giro S3
   era MUTO con la sola FAMIGLIA: il difetto c'era, ma nessuna delle sette
   scene nuove lo poteva vedere — lo vedono le due vecchie. Il muto era del
   filtro delle sezioni, non del codice. */
const CON_REGRESSIONE = "1,7b," + FAMIGLIA;

const SABOTAGGI = [
  { n: 1, nome: "la fusione non fonde: le voci dell'altra scheda tornano a sparire",
    attesa: "§16, §18 e §19 rosse: e' il difetto che questa generazione chiude, rimesso esattamente com'era in gen-6.21",
    sezioni: FAMIGLIA,
    da: `        if (Array.isArray(dentro))\n          altrui = dentro.filter((m) => m && m.tipo && m.logId && !mieRef.current.has(m.logId));`,
    a: `        if (Array.isArray(dentro))\n          altrui = [];` },

  { n: 2, nome: "la fusione non riconosce le PROPRIE: ogni giro se le rimette dentro",
    attesa: "rossa almeno §18, che pretende TRE voci sul disco e non una di piu', e §21b, che pretende il numero esatto nel rifiuto del ripristino. E' la meta' della fusione che nessuno guarda: senza il filtro la chiave cresce a ogni specchiaCoda",
    sezioni: FAMIGLIA,
    da: `          altrui = dentro.filter((m) => m && m.tipo && m.logId && !mieRef.current.has(m.logId));`,
    a: `          altrui = dentro.filter((m) => m && m.tipo && m.logId);` },

  { n: 3, nome: "la presa in carico all'ADOZIONE non si fa",
    attesa: "§1 e §7b rosse: la voce adottata dal disco non entra nel registro, quindi la fusione se la ritrova come «altrui» e la RIMETTE sul disco per sempre — la chiave non si toglie piu'. I soldi restano giusti perche' c'e' la ricevuta di gen-6.20 a coprire il rigioco, ed e' esattamente per questo che serve una sezione che guardi il DISCO",
    sezioni: CON_REGRESSIONE,
    da: `          for (const m of buone) if (m.logId) mieRef.current.add(m.logId);\n          ritrovate = fresche.length;`,
    a: `          ritrovate = fresche.length;` },

  { n: 4, nome: "la presa in carico in specchiaCoda non si fa",
    attesa: "§1 e §7b rosse, per la stessa ragione di S3 dall'altro capo: la voce nata qui non entra nel registro e la fusione la rimette sul disco dopo averla consegnata",
    sezioni: CON_REGRESSIONE,
    da: `    for (const m of salvabili) if (m.logId) mieRef.current.add(m.logId);\n    scriviCoda(salvabili);`,
    a: `    scriviCoda(salvabili);` },

  { n: 5, nome: "il dedup delle ferme spento: si torna alla concatenazione pura",
    attesa: "§20 rossa: la stessa ferma finisce due volte fra le messe da parte, e l'annuncio all'ingresso somma due volte gli stessi euro",
    sezioni: FAMIGLIA,
    da: `              const nuoveFerme = ferme.filter((m) => !(m.logId && avanti.some((x) => x && x.logId === m.logId)));\n              if (nuoveFerme.length)\n                localStorage.setItem(CHIAVE_FERMA, JSON.stringify([...avanti, ...nuoveFerme].slice(-50)));`,
    a: `              localStorage.setItem(CHIAVE_FERMA, JSON.stringify([...avanti, ...ferme].slice(-50)));` },

  { n: 6, nome: "il ripristino torna a contare solo la coda di questa scheda",
    attesa: "§21 rossa: B ripristina mentre un'altra scheda ha un incasso in mano, e quell'incasso si rigiochera' senza ricevuta",
    sezioni: FAMIGLIA,
    da: `    const inFila = codaRef.current.length + fuoriDaMe();`,
    a: `    const inFila = codaRef.current.length;` },

  { n: 7, nome: "fuoriDaMe conta anche le voci di questa scheda",
    attesa: "§21b rossa: il rifiuto direbbe TRE dove sono DUE, perche' la voce di casa sta in memoria E sul disco. E' l'unica sezione che guarda il numero da vicino, ed e' nata per questo sabotaggio",
    sezioni: "21,21b",
    da: `        return dentro.filter((m) => m && m.tipo && m.logId && !mieRef.current.has(m.logId)).length;`,
    a: `        return dentro.filter((m) => m && m.tipo).length;` },

  { n: 8, nome: "nella fusione le mie passano davanti alle altrui",
    attesa: "MUTO, ed e' dichiarato: applicaCoda rigioca nell'ordine dell'array, e in tutte e sette le scene le voci in gara sono INDIPENDENTI — scontrini di casse diverse. L'ordine conta solo fra una vendita e il suo storno, e quella coppia nasce e muore dentro la stessa scheda (§10), dove il taglio non la separa mai. La riga sta li' perche' il giorno che due schede si scambieranno una coppia il verso sia gia' giusto, non perche' oggi ripari qualcosa",
    muto: true, sezioni: FAMIGLIA,
    da: `      const tutte = [...altrui, ...miei];`,
    a: `      const tutte = [...miei, ...altrui];` },
];

const arg = process.argv[2] ? Number(process.argv[2]) : null;
const vero = readFileSync(VERO, "utf8");
appendFileSync(DIARIO, `\n=== giro del ${new Date().toISOString()} ===\n`);
console.log(`sabotaggi di gen-6.22 — ${arg ? "solo S" + arg : SABOTAGGI.length + " da girare"}\n`);

for (const sab of SABOTAGGI) {
  if (arg && sab.n !== arg) continue;
  const banco = sab.banco || "protocollotest.mjs";
  const bersaglio = sab.file || null;
  const testoVero = bersaglio ? readFileSync(bersaglio, "utf8") : vero;
  const c = testoVero.split(sab.da).length - 1;
  if (c !== 1) {
    const riga = `S${sab.n} «${sab.nome}» — NON APPLICABILE: l'ancora compare ${c} volte`;
    console.log("  !!  " + riga); appendFileSync(DIARIO, riga + "\n");
    continue;
  }
  const rotto = testoVero.replace(sab.da, sab.a);
  let out = "", saltato = null, daCostruire = null;
  if (bersaglio) {
    writeFileSync(bersaglio, rotto);
    if (sab.sorgenteGit) {
      try {
        writeFileSync(PASSATO, execFileSync("git", ["show", sab.sorgenteGit], { cwd: "..", encoding: "utf8", maxBuffer: 64e6 }));
        daCostruire = PASSATO;
      } catch (e) { saltato = "la revisione passata non si legge: " + e.message; }
    }
  } else { writeFileSync(LAVORO, rotto); daCostruire = LAVORO; }
  if (!saltato && daCostruire) {
    try { execFileSync(process.execPath, ["build.mjs", daCostruire], { stdio: "pipe" }); }
    catch { saltato = "IL PACCHETTO NON SI COSTRUISCE (e' un'informazione, non un rosso)"; }
  }
  if (!saltato) {
    try {
      out = execFileSync(process.execPath, [banco], {
        encoding: "utf8", maxBuffer: 64e6,
        env: { ...process.env, SORGENTE: daCostruire || VERO,
          ...(sab.sezioni ? { SEZIONI: sab.sezioni } : {}) } });
    } catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
  }
  if (bersaglio) writeFileSync(bersaglio, testoVero);
  if (saltato) {
    const riga = `S${sab.n} «${sab.nome}» — ${saltato}`;
    console.log("  !!  " + riga); appendFileSync(DIARIO, riga + "\n");
    continue;
  }
  const rossi = (out.match(/^ {2}KO {2}/gm) || []).length;
  const sezioni = [...new Set((out.split("\n").reduce((acc, r) => {
    if (/^— \d+[a-z]?\./.test(r)) acc.sez = "§" + r.match(/^— (\d+[a-z]?)\./)[1];
    if (/^ {2}KO {2}/.test(r) && acc.sez) acc.list.push(acc.sez);
    return acc;
  }, { sez: null, list: [] })).list)].join(" ");
  const esito = rossi === 0
    ? (sab.muto ? "MUTO, ed era dichiarato" : "MUTO — DA APRIRE")
    : `${rossi} rossi in ${sezioni || "(sezioni non intestate)"}`;
  const buono = sab.muto ? rossi === 0 : rossi > 0;
  const dove = (bersaglio ? "banco " + banco + " (sabotato il banco)" : "banco " + banco)
    + (sab.sorgenteGit ? " · su " + sab.sorgenteGit : "")
    + (sab.sezioni ? ` · sezioni ${sab.sezioni}` : " · giro intero");
  const riga = `S${sab.n} «${sab.nome}» — ${dove} · atteso ${sab.attesa} · ${esito}`;
  console.log((buono ? "  ok  " : "  !!  ") + riga);
  appendFileSync(DIARIO, riga + "\n");
}

execFileSync(process.execPath, ["build.mjs", VERO], { stdio: "pipe" });
console.log("\npacchetto ricostruito dal sorgente vero · diario in " + DIARIO);
