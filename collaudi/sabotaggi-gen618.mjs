/* I SABOTAGGI DI gen-6.18, CONTATI UNO PER UNO.

   Come si fa, e perche' cosi'. Si parte da una copia INTEGRA del sorgente,
   si rompe UNA cosa sola, si RICOSTRUISCE il pacchetto da quella copia, si
   gira il banco e si contano i rossi. Un sabotaggio che non fa diventare
   rosso niente — un MUTO — non e' un risultato: e' una domanda, e va aperta.
   Quasi sempre e' un buco del banco o una ridondanza vera del codice, e
   tutte e due le volte e' un'informazione che vale piu' di un verde.

   PERCHE' QUESTO GIRO CONTA PIU' DEGLI ALTRI. «L'esaurito» non e' una
   schermata: e' una regola che vive in SEI porte diverse piu' un esecutore.
   Sei guardie scritte e non esercitate sarebbero peggio di nessuna guardia,
   perche' sembrerebbero protezione. Qui si chiede a ognuna di dimostrare che
   qualcuno se ne accorgerebbe.

   Il diario si scrive SUBITO, un sabotaggio alla volta: se il giro muore a
   meta' resta scritto quello che si e' gia' misurato.

   Uso: node sabotaggi-gen618.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero: un pacchetto
   sabotato lasciato in giro e' il modo di invalidare il censimento dopo. */
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-sabotato.jsx";
const DIARIO = "/tmp/diario-sabotaggi-gen618.txt";

const SABOTAGGI = [
  { n: 1, nome: "l'esecutore non e' registrato: la scrittura non parte", attesa: "§3 e a catena",
    da: `const ESECUTORI = { vendita: applicaVendita, storno: applicaStorno, spunta: applicaComanda,
  esaurito: applicaEsaurito };`,
    a:  `const ESECUTORI = { vendita: applicaVendita, storno: applicaStorno, spunta: applicaComanda };` },

  { n: 2, nome: "lo steccato d'eta' non scatta piu'", attesa: "§19",
    da: `  if (d.t && Date.now() - d.t > ORE_ESAURITO * 3600000) return false;`,
    a:  `  if (false) return false;` },

  { n: 3, nome: "PORTA 1: un'esaurita si puo' prendere in mano", attesa: "§6",
    da: `      if (ag?.esaurito && !mano.includes(agId)) return rifiutaEsaurita(ag);`,
    a:  `      if (false) return rifiutaEsaurita(ag);` },

  { n: 4, nome: "PORTA 2: il chip la mette sulla riga viva", attesa: "§5",
    da: `    if (ag?.esaurito && !ids.includes(agId)) return rifiutaEsaurita(ag);`,
    a:  `    if (false) return rifiutaEsaurita(ag);` },

  { n: 5, nome: "PORTA 3: il foglio di scelta la fa passare", attesa: "§20",
    da: `    const scelte = spuntate.filter((a) => !a.esaurito || eraGia.includes(a.id));`,
    a:  `    const scelte = spuntate;` },

  { n: 6, nome: "PORTA 4: la mano la porta sul piatto", attesa: "§7",
    da: `    const daMano    = usaMano ? ammesse.filter((a) => mano.includes(a.id) && !a.esaurito) : [];`,
    a:  `    const daMano    = usaMano ? ammesse.filter((a) => mano.includes(a.id)) : [];` },

  { n: 7, nome: "PORTA 4b: esce dalla mano in silenzio", attesa: "§7",
    da: `    const fuoriPerEsaurito = usaMano ? mano.filter((id) => ammesse.some((a) => a.id === id && a.esaurito)) : [];`,
    a:  `    const fuoriPerEsaurito = [];` },

  /* §21 e NON §6: §6 non la interroga nemmeno — li' la Bufala e' gia' esaurita
     quando la si prova a prendere, quindi la PRIMA porta la ferma. Questo
     sabotaggio e' uscito MUTO al primo giro e aveva ragione lui. */
  { n: 8, nome: "PORTA 6: la cella con le varianti la semina dalla mano", attesa: "§21",
    da: `                    ? apriScelta(v, aggiunteDelGruppo(gruppoDi(v)).filter((a) => mano.includes(a.id) && !a.esaurito).map((a) => a.id))`,
    a:  `                    ? apriScelta(v, aggiunteDelGruppo(gruppoDi(v)).filter((a) => mano.includes(a.id)).map((a) => a.id))` },

  { n: 9, nome: "l'ordine torna al solo alfabeto", attesa: "§4 §4b",
    da: `const ordineAgg = (a, b) => (!!a.esaurito - !!b.esaurito) || a.nome.localeCompare(b.nome, "it");`,
    a:  `const ordineAgg = (a, b) => a.nome.localeCompare(b.nome, "it");` },

  { n: 10, nome: "l'editor ricancella il campo al Salva", attesa: "§8",
    da: `        ? lista.map((x) => (x.id === dati.id ? { ...dati, ...(x.esaurito ? { esaurito: true } : {}) } : x))`,
    a:  `        ? lista.map((x) => (x.id === dati.id ? dati : x))` },

  { n: 11, nome: "il chip esaurito si veste da disponibile", attesa: "§4",
    da: `                  const fuori = !!a.esaurito && !giu;`,
    a:  `                  const fuori = false;` },

  { n: 12, nome: "il bottone non apre piu' il Foglio", attesa: "§2 §3 e a catena",
    da: `                <button onClick={() => setEsauritiSu(true)} aria-label="Ingredienti esauriti" data-esauriti="1"`,
    a:  `                <button onClick={() => {}} aria-label="Ingredienti esauriti" data-esauriti="1"` },
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
    out = execFileSync(process.execPath, ["esauritotest.mjs"], {
      encoding: "utf8", env: { ...process.env, SORGENTE: LAVORO }, maxBuffer: 64e6 });
  } catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
  const rossi = (out.match(/^ {2}KO {2}/gm) || []).length;
  /* «4b» e' una sezione come le altre: la lettera fa parte del nome. Col
     vecchio `\d+` la riga «— 4b.» non veniva riconosciuta e i suoi rossi
     finivano attribuiti alla sezione precedente. */
  const sezioni = [...new Set((out.split("\n").reduce((acc, r) => {
    if (/^— \d+[a-z]?\./.test(r)) acc.sez = "§" + r.match(/^— (\d+[a-z]?)\./)[1];
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
