/* I SABOTAGGI DI gen-6.17, CONTATI UNO PER UNO.

   Come si fa, e perche' cosi'. Si parte da una copia INTEGRA del sorgente,
   si rompe UNA cosa sola, si RICOSTRUISCE il pacchetto da quella copia, si
   gira il banco e si contano i rossi. Un sabotaggio che non fa diventare
   rosso niente — un MUTO — non e' un risultato: e' una domanda, e va aperta.
   Quasi sempre e' un buco del banco o una ridondanza vera del codice, e
   tutte e due le volte e' un'informazione che vale piu' di un verde.

   Il diario si scrive SUBITO, un sabotaggio alla volta: se il giro muore a
   meta' resta scritto quello che si e' gia' misurato.

   Uso: node sabotaggi-gen617.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero: un pacchetto
   sabotato lasciato in giro e' il modo di invalidare il censimento dopo. */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-sabotato.jsx";
const DIARIO = "/tmp/diario-sabotaggi-gen617.txt";

/* NOVE SABOTAGGI. I primi cinque rompono la postazione di chi sta solo in
   cassa; il sesto la categoria letta dal magazzino; il settimo e l'ottavo la
   fascia; il nono e il decimo i due muri che dallo schermo non si vedono e
   che per questo hanno una sentinella sul sorgente (§14) — se quella
   sentinella non servisse a niente, questi due sarebbero MUTI, ed e'
   esattamente la domanda che volevo fargli. */
const SABOTAGGI = [
  { n: 1, nome: "l'interruttore non accende niente", attesa: "§1 §2 §3 §4 §5",
    da: `  return profilo?.ruolo !== "admin" && !!profilo?.soloCassa && puoCassa(profilo);`,
    a:  `  return false;` },

  { n: 2, nome: "la barra si tiene la quarta voce «Esci»", attesa: "§2",
    da: `    ...(soloQui ? [] : [{ id: "cassa-esci", nome: "Esci", icona: ArrowLeft, pronta: true,`,
    a:  `    ...(false ? [] : [{ id: "cassa-esci", nome: "Esci", icona: ArrowLeft, pronta: true,` },

  { n: 3, nome: "la lente torna ad aprirgli tutte le porte", attesa: "§3",
    da: `    if (soloCassa(profilo)) return a.d === "cassa";`,
    a:  `    if (false) return a.d === "cassa";` },

  { n: 4, nome: "il «?» torna a offrire Plancia e Panoramica", attesa: "§4",
    da: `          {!soloQui && (<>`,
    a:  `          {true && (<>` },

  { n: 5, nome: "il giro guidato riparte addosso al cassiere", attesa: "§5",
    da: `      if (!soloQui && !localStorage.getItem(k) && !localStorage.getItem("scp:tour:v1")) setGuida(passiPanoramica(NAV));`,
    a:  `      if (!localStorage.getItem(k) && !localStorage.getItem("scp:tour:v1")) setGuida(passiPanoramica(NAV));` },

  { n: 6, nome: "la categoria si legge solo se scritta a mano", attesa: "§6",
    da: `  for (const d of a?.distinta || []) {`,
    a:  `  for (const d of []) {` },

  { n: 7, nome: "la fila unica torna a scorrere di lato", attesa: "§8",
    da: `                  return <div className="flex flex-wrap gap-2 overflow-y-auto sc-scroll"
                    style={{ maxHeight: "6.1rem" }}>{chips.map(unChip)}</div>;`,
    a:  `                  return <div className="flex gap-2 overflow-x-auto">{chips.map(unChip)}</div>;` },

  { n: 8, nome: "i chip tornano in ordine di battute", attesa: "§9",
    da: `        const chips = rv ? aggiunteDelGruppo(rv.gruppo) : aggiunteTutte(stato);`,
    a:  `        const chips = [...(rv ? aggiunteDelGruppo(rv.gruppo) : aggiunteTutte(stato))].reverse();` },

  { n: 9, nome: "il gate di contenuto() perde il muro di riserva", attesa: "§14",
    da: `      (soloQui && vista !== "cassa") ||`,
    a:  `      (false && vista !== "cassa") ||` },

  { n: 10, nome: "le tre voci tornano a cambiare stanza senza cambiare vista", attesa: "§14",
    da: `      attiva: vista === "cassa" && sezCassa === "clienti", azione: () => vaiInCassa("clienti") },`,
    a:  `      attiva: vista === "cassa" && sezCassa === "clienti", azione: () => setSezCassa("clienti") },` },
];

const solo = process.argv[2] ? +process.argv[2] : null;
const vero = readFileSync(VERO, "utf8");
appendFileSync(DIARIO, `\n===== giro del ${new Date().toISOString()} · base ${vero.length} caratteri =====\n`);

for (const sab of SABOTAGGI) {
  if (solo && sab.n !== solo) continue;
  const c = vero.split(sab.da).length - 1;
  if (c !== 1) {
    const riga = `S${sab.n} «${sab.nome}» — NON APPLICABILE: l'ancora compare ${c} volte`;
    console.log("  !!  " + riga);
    appendFileSync(DIARIO, riga + "\n");
    continue;
  }
  writeFileSync(LAVORO, vero.replace(sab.da, sab.a));
  try {
    execFileSync(process.execPath, ["build.mjs", LAVORO], { stdio: "pipe" });
  } catch (e) {
    const riga = `S${sab.n} «${sab.nome}» — IL PACCHETTO NON SI COSTRUISCE (e' un'informazione, non un rosso)`;
    console.log("  !!  " + riga);
    appendFileSync(DIARIO, riga + "\n");
    continue;
  }
  let out = "";
  try {
    out = execFileSync(process.execPath, ["cassa617test.mjs"], {
      encoding: "utf8", env: { ...process.env, SORGENTE: LAVORO }, maxBuffer: 64e6 });
  } catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
  const rossi = (out.match(/^ {2}KO {2}/gm) || []).length;
  const sezioni = [...new Set((out.split("\n").reduce((acc, r) => {
    if (/^— \d+\./.test(r)) acc.sez = "§" + r.match(/^— (\d+)\./)[1];
    if (/^ {2}KO {2}/.test(r) && acc.sez) acc.list.push(acc.sez);
    return acc;
  }, { sez: null, list: [] })).list)].join(" ");
  const esito = rossi === 0 ? "MUTO — DA APRIRE" : `${rossi} rossi in ${sezioni}`;
  const riga = `S${sab.n} «${sab.nome}» — atteso ${sab.attesa} · ${esito}`;
  console.log((rossi === 0 ? "  MUTO " : "  ok  ") + riga);
  appendFileSync(DIARIO, riga + "\n");
}

/* il pacchetto torna quello vero: un pacchetto sabotato dimenticato qui
   invaliderebbe il censimento che viene dopo, e in silenzio */
execFileSync(process.execPath, ["build.mjs", VERO], { stdio: "pipe" });
console.log("\npacchetto ricostruito dal sorgente vero · diario in " + DIARIO);
