/* I SABOTAGGI DI gen-6.21, CONTATI UNO PER UNO.

   Si parte da una copia INTEGRA del sorgente, si rompe UNA cosa sola, si
   RICOSTRUISCE il pacchetto da quella copia, si gira il banco e si contano i
   rossi. Un MUTO non e' un risultato: e' una domanda, e va aperta. Quando il
   muto e' il risultato giusto va DICHIARATO PRIMA di girare (campo `muto`),
   col perche' dentro: un muto spiegato dopo e' una scusa.

   DUE COSE CHE QUESTA MACCHINA SA FARE IN PIU' DI QUELLA DI gen-6.20:
   · `file` — sabota il BANCO invece dell'app (e lo rimette a posto sempre,
     anche se il giro esplode);
   · `sorgenteGit` — costruisce il pacchetto da una revisione PASSATA. Serve a
     S9, che e' l'unico modo di dimostrare che la quarta condizione della scena
     di §1 e' portante: la si toglie dal banco e si gira contro il codice NON
     curato, dove il difetto c'e'. Se in quelle condizioni §1 resta verde, la
     scena senza quella riga non prova niente — ed e' esattamente quello che la
     demolizione del disegno aveva scoperto a tavolino.

   Uso: node sabotaggi-gen621.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero. */
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-sabotato.jsx";
const PASSATO = "/tmp/sorgente-passata.jsx";
const DIARIO = "/tmp/diario-sabotaggi-gen621.txt";

const TAGLIO_OK = `      codaRef.current = codaRef.current.filter((m) => !partite.includes(m));
      specchiaCoda();                          // salvate: lo specchio si accorcia con la coda`;

const SABOTAGGI = [
  { n: 1, nome: "il taglio torna per POSIZIONE nel ramo del successo",
    attesa: "§1 rossa: e' il difetto che questa generazione chiude", sezioni: "1",
    da: `      codaRef.current = codaRef.current.filter((m) => !partite.includes(m));\n      specchiaCoda();                          // salvate`,
    a: `      codaRef.current = codaRef.current.slice(inviate);\n      specchiaCoda();                          // salvate` },

  { n: 2, nome: "la fotografia non e' una fotografia (si punta alla coda viva)",
    attesa: "§1b rossa: e' l'unica sezione che prova che la fotografia e' una COPIA. Al primo giro l'avevo puntato su §1 ed era MUTO, perche' li' in mezzo un altro ciclo riassegna l'array della coda e la voce nuova finisce in un array diverso: con un ciclo solo in volo, invece, il push cade nello STESSO array e un filtro sulla coda viva se la porta via",
    sezioni: "1,1b,2",
    da: `      const partite = codaRef.current.slice(0, inviate);`,
    a: `      const partite = codaRef.current;` },

  { n: 3, nome: "il taglio torna per POSIZIONE anche nella scorciatoia",
    attesa: "MUTO, ed e' dichiarato: fra «inviate» e quel ramo non c'e' nessun await, quindi «partite» e' tutta la coda e le due forme sono identiche. La riga sta li' per avere UNA regola sola, non perche' ripari qualcosa — e questo sabotaggio e' il modo di tenerlo scritto invece che detto",
    muto: true, sezioni: "1,2,2b,3,4",
    da: `        codaRef.current = codaRef.current.filter((m) => !partite.includes(m));\n        specchiaCoda();`,
    a: `        codaRef.current = codaRef.current.slice(inviate);\n        specchiaCoda();` },

  { n: 4, nome: "via la guardia del giro dal ramo del successo",
    attesa: "§2 rossa: il ciclo sorpassato riapre il rubinetto e parte un terzo giro", sezioni: "2,2b,1",
    da: `      if (mio !== giroRef.current) return;\n      conflittiRef.current = 0;`,
    a: `      conflittiRef.current = 0;` },

  { n: 5, nome: "via la guardia del giro dal ramo dell'errore",
    attesa: "§2b rossa e §2 verde: e' la meta' che si vede solo quando il ciclo sorpassato rientra male",
    sezioni: "2,2b",
    da: `      if (mio !== giroRef.current) return;\n      inSyncRef.current = 0;`,
    a: `      inSyncRef.current = 0;` },

  { n: 6, nome: "via la guardia del giro dalla scorciatoia",
    attesa: "MUTO, e dichiarato: nessuna sezione mette un ciclo SORPASSATO dentro la scorciatoia (ci vorrebbe che la sua lettura trovasse gia' tutto in rete). E' difesa in profondita': sta li' perche' i tre punti che concludono un ciclo dicano la stessa cosa, e il giorno che qualcuno scrivera' quella scena diventera' rossa da sola",
    muto: true, sezioni: "1,2,2b,3,4",
    da: `        if (mio !== giroRef.current) return;\n        baseRef.current = base;`,
    a: `        baseRef.current = base;` },

  { n: 7, nome: "il numero di giro non si incrementa: ogni ciclo si crede l'ultimo",
    attesa: "§2 e §2b rosse", sezioni: "2,2b",
    da: `    const mio = ++giroRef.current;`,
    a: `    const mio = giroRef.current;` },

  { n: 8, nome: "la spia torna a scriversi sempre, anche all'indietro",
    attesa: "§3 rossa", sezioni: "3",
    da: `    if ((stato.rev || 0) > spiaScritta) {\n      try {\n        await window.storage.set(CHIAVE_REV, String(stato.rev || 0), true);\n        spiaScritta = stato.rev || 0;\n      } catch {}\n    }`,
    a: `    try { await window.storage.set(CHIAVE_REV, String(stato.rev || 0), true); } catch {}` },

  { n: 9, nome: "il ripristino torna a contare solo le voci con un tipo",
    attesa: "§4 rossa", sezioni: "4",
    da: `    const inFila = codaRef.current.length;`,
    a: `    const inFila = codaRef.current.filter((m) => m.tipo).length;` },

  { n: 10, nome: "via la quarta condizione dalla scena di §1, contro il codice NON curato",
    attesa: "NON muta, e misurato due volte: su gen-6.20 resta UN rosso (la riga interna «taglia le proprie voci»), ma le DUE asserzioni che parlano di SOLDI — la vendita in rete e la giornata — restano VERDI col difetto dentro, perche' senza quella riga la voce nuova si spedisce da sola e non si perde niente. Sul codice curato e' tutta verde. Cioe': senza la quarta condizione §1 smette di misurare un incasso che sparisce e misura un dettaglio della coda. La riga resta, e questo sabotaggio e' la sua lapide",
    file: "sorpassatotest.mjs", sorgenteGit: "57dcca9:app/app.jsx", sezioni: "1",
    da: `  await g.p.evaluate(() => window.__uccidiRete(true));\n  await battiEIncassa(g.p);                                   // C`,
    a: `  await battiEIncassa(g.p);                                   // C` },

  { n: 11, nome: "il freno del banco torna PRIMA del commit",
    attesa: "§1 deve cambiare esito: se resta verde, l'attrezzo non sta mettendo in scena «la scrittura c'e', la risposta no» e tutto il banco misura un'altra cosa",
    file: "sorpassatotest.mjs", sezioni: "1",
    da: `      localStorage.setItem("db:" + k, v);\n      segna("commit");\n      if (frenaDopo) {`,
    a: `      segna("commit");\n      if (frenaDopo) {` },
];

const arg = process.argv[2] ? Number(process.argv[2]) : null;
const vero = readFileSync(VERO, "utf8");
appendFileSync(DIARIO, `\n=== giro del ${new Date().toISOString()} ===\n`);
console.log(`sabotaggi di gen-6.21 — ${arg ? "solo S" + arg : SABOTAGGI.length + " da girare"}\n`);

for (const sab of SABOTAGGI) {
  if (arg && sab.n !== arg) continue;
  const banco = sab.banco || "sorpassatotest.mjs";
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
