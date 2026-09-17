/* I SABOTAGGI DELLA FIRMA SULLE RICHIESTE (gen-6.23), CONTATI UNO PER UNO.

   Si parte da una copia INTEGRA del sorgente, si rompe UNA cosa sola, si
   RICOSTRUISCE il pacchetto da quella copia, si gira richiestefirmatest.mjs e
   si contano i rossi. Un MUTO non e' un risultato: e' una domanda, e va aperta.

   S4 MERITA UNA RIGA: rimette `truncate` sulla firma. E' il sabotaggio che
   nessun controllo avrebbe preso fino a stamattina, perche' il taglio e' CSS e
   innerText non lo vede — §1 e §2 resterebbero verdi su una data tagliata a
   meta'. §4 misura il nodo invece del testo, ed e' li' per questo.

   Uso: node sabotaggi-richiestefirma.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero. */
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-richiestefirma.jsx";
const DIARIO = "/tmp/diario-sabotaggi-richiestefirma.txt";
const BANCO = "richiestefirmatest.mjs";

const SABOTAGGI = [
  { n: 1, nome: "via la firma: la riga torna a dire solo magazzino e quantita'",
    attesa: "§1, §2 e §3 rosse: e' esattamente com'era prima della cura. §4 NO, e va detto: l'elemento c'e' ancora, e' solo nascosto, quindi non risulta tagliato — §4 misura il taglio, non la presenza",
    da: `                    <div data-firma="1" className="text-xs leading-tight mt-0.5" style={{ color: T.tenue }}>`,
    a: `                    <div data-firma="1" className="text-xs leading-tight mt-0.5" style={{ color: T.tenue, display: "none" }}>` },

  { n: 2, nome: "la conferma dice «2 ore fa» invece della data",
    attesa: "§1 rossa: a fine serata un tempo relativo non si ricostruisce",
    da: `confermata il {dataIt(r.tEvasione || r.t)}`,
    a: `confermata il {tempoFa(r.tEvasione || r.t)}` },

  { n: 3, nome: "«fabbisogno automatico» viene trattato come una persona",
    attesa: "§3 rossa: si leggerebbe «da fabbisogno automatico», che non e' italiano e non e' nessuno",
    da: `{r.creataDa === "fabbisogno automatico"
                            ? "in automatico, per scorta bassa" : \`da \${r.creataDa || "—"}\`}`,
    a: `{\`da \${r.creataDa || "—"}\`}` },

  { n: 4, nome: "la firma torna tagliata dal bordo (truncate)",
    attesa: "§4 rossa: §1 e §2 resterebbero VERDE, perche' innerText non sa del taglio — e' il motivo per cui §4 esiste",
    da: `<div data-firma="1" className="text-xs leading-tight mt-0.5"`,
    a: `<div data-firma="1" className="text-xs truncate mt-0.5"` },

  { n: 5, nome: "l'archivio del laboratorio torna a «3 ore fa»",
    attesa: "§5 rossa: e' la sentinella sul sorgente, l'unica guardia di quella riga",
    da: `· {dataIt(r.tEvasione)}`,
    a: `· {tempoFa(r.tEvasione)}` },
];

const arg = process.argv[2] ? Number(process.argv[2]) : null;
const vero = readFileSync(VERO, "utf8");
appendFileSync(DIARIO, `\n=== giro del ${new Date().toISOString()} ===\n`);
console.log(`sabotaggi della firma sulle richieste — ${arg ? "solo S" + arg : SABOTAGGI.length + " da girare"}\n`);
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
