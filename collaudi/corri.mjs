/* IL LANCIATORE UNICO.

   Due modi, e la differenza conta:

     node corri.mjs a.mjs b.mjs …     — cancello: si ferma al PRIMO rosso.
     node corri.mjs --tutte           — cancello su tutti i file *test.mjs.
     node corri.mjs --censimento      — non si ferma: gira tutto e dice com'e'
                                        messo ognuno. Serve per fare i conti,
                                        non per dare il via libera.

   Il cancello si ferma subito perche' dopo il primo rosso i risultati non
   valgono piu' niente: se una schermata e' rotta, tutto quello che ci passa
   sopra fallisce per traboccamento e il rapporto diventa illeggibile.
   Il censimento invece deve arrivare in fondo per forza: e' li' che si scopre
   quanti file stanno marcendo in silenzio.

   TRE ESITI, non due. «verde» e «rosso» non bastano: un file che gira, esce
   con zero e non stampa nemmeno un controllo e' MUTO, e per mesi l'ho contato
   come verde. Non prova niente. Chiamarlo col suo nome e' tutto il punto. */
import { spawnSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";

/* ── LA BANDIERINA ──
   Il bundle è una risorsa sola e condivisa: se qualcuno lo ricostruisce mentre
   il censimento gira, i file provati prima e quelli dopo hanno provato DUE
   versioni diverse e il risultato non vale niente. Mi è successo tre volte in
   un giorno — sempre perché stavo scrivendo la versione successiva mentre la
   precedente veniva collaudata. Con questa bandierina build.mjs si rifiuta, e
   la possibilità di sbagliare sparisce invece di dover essere ricordata. */
const BANDIERINA = ".censimento-in-corso";

const arg = process.argv.slice(2);
const censimento = arg.includes("--censimento");
const tutti = arg.includes("--tutte") || censimento;
/* navtest.mjs finisce nel filtro per via del nome ma non e' un collaudo: e' la
   libreria che tutti gli altri importano per navigare. Girava, non provava
   niente (giustamente) e mi risultava MUTA a ogni censimento — un falso
   allarme mio che sporcava il conto. */
const NON_COLLAUDI = new Set([
  "navtest.mjs",     // la libreria che tutti importano per navigare
  "render-test.mjs", // fa il giro dell'app e scatta fotografie: e' un attrezzo, non un collaudo
]);
/* ── QUATTRO ESITI, NON TRE ──
   Sette collaudi leggono i dati VERI di produzione: nomi dei prodotti,
   fornitori, ordini, giacenze. Quei file non stanno nel repository — e' un
   repository pubblico — quindi su una macchina che non sia la mia non ci sono.
   Prima diventavano ROSSI, e un rosso che non e' un difetto e' la cosa peggiore
   che si possa mettere in un rapporto automatico: insegna a ignorare i rossi.
   Adesso si chiamano SALTATE e dicono che file gli manca. Non contano come
   difetto, ma non spariscono nemmeno dal conto. */
const DATI_RICHIESTI = {
  "catalogotest.mjs": "stato-vero.json",
  "conv551test.mjs": "stato-vero.json",
  "convtest.mjs": "stato-vero.json",
  "gen552test.mjs": "stato-vero-conv.json",
  "mappatest.mjs": "topologia-vera.json",
  "pesotest.mjs": "topologia-vera.json",
  "ripristinotest.mjs": "topologia-vera.json",
};

const lista = tutti
  ? readdirSync(".").filter((f) => /test\.mjs$/.test(f) && !NON_COLLAUDI.has(f)).sort()
  : arg.filter((a) => !a.startsWith("--"));

if (tutti) { try { writeFileSync(BANDIERINA, String(process.pid)); } catch {} }
const giu = () => { try { if (existsSync(BANDIERINA)) unlinkSync(BANDIERINA); } catch {} };
process.on("exit", giu); process.on("SIGINT", () => { giu(); process.exit(130); });
process.on("SIGTERM", () => { giu(); process.exit(143); });

/* ── L'OUTPUT DEI ROSSI SI CONSERVA ──
   Finora, in censimento, di una suite rossa restava una riga sola. Di una che
   cade solo sotto carico non si riusciva a sapere QUALE controllo fosse
   caduto, e la diagnosi era impossibile. Adesso che il censimento gira di
   notte da solo, questa non e' piu' una scomodita': senza, il rapporto della
   mattina dice «rossa» e nessuno puo' farci niente. */
const CARTELLA_ROSSI = "rossi";
let rossa = null;
const esiti = [];
for (const f of lista) {
  const manca = DATI_RICHIESTI[f];
  if (manca && !existsSync(manca)) {
    esiti.push({ f, nOk: 0, nKo: 0, sec: 0, male: false, muto: false, saltata: manca });
    console.log(`SALTA  ${f.padEnd(22)} manca «${manca}» — i dati veri non stanno nel repository`);
    continue;
  }
  const t0 = Date.now();
  /* IL TETTO DI TEMPO E' PER FILE, non uguale per tutti (31/08, gen-5.98):
     generaletest apre OGNI vista e ogni scheda per tre ruoli su due
     schermi, e l'app e' cresciuta — gen-5.96/97/98 le hanno dato Listino,
     Cassa e Comande da aprire. Misurato due volte il 31/08: 900s non gli
     bastano piu' NEMMENO DA SOLO (35-40 ok, 0 KO, ucciso dal tetto — tempo,
     non difetti). Il tetto degli altri resta stretto: e' il guinzaglio che
     smaschera una suite appesa. */
  const TETTO_MS = { "generaletest.mjs": 1800000 };
  const r = spawnSync("node", [f], { encoding: "utf8", timeout: TETTO_MS[f] || 900000 });
  const out = (r.stdout || "") + (r.stderr || "");
  /* Le suite non parlano tutte la stessa lingua: le piu' nuove stampano
     «  ok  » / «  KO  », le vecchie infilano PASS o CHECK in fondo alla riga.
     Contare solo le prime faceva risultare MUTA una suite che invece prova
     eccome — cioe' esattamente l'errore opposto a quello che voglio evitare. */
  const nOk = (out.match(/^ {2}ok {2}/gm) || []).length + (out.match(/\bPASS\b/g) || []).length;
  const nKo = (out.match(/^ {2}KO {2}/gm) || []).length + (out.match(/\bCHECK\b|\bFAIL\b/g) || []).length;
  const sec = Math.round((Date.now() - t0) / 1000);
  const male = r.status !== 0 || nKo > 0;
  const muto = !male && nOk === 0;
  /* la prima riga utile dell'errore: in un censimento di cinquanta file il
     motivo serve subito, non dopo essere andati a ripescare il log */
  const perche = male
    ? (out.match(/^(?:.*(?:Error|error:|Timeout).*)$/m) || [""])[0].trim().slice(0, 110)
    : "";
  esiti.push({ f, nOk, nKo, sec, male, muto, perche });
  if (male && censimento) {
    try { mkdirSync(CARTELLA_ROSSI, { recursive: true }); writeFileSync(`${CARTELLA_ROSSI}/${f}.txt`, out); } catch {}
  }
  console.log(`${male ? "ROSSA" : muto ? "MUTA " : "verde"}  ${f.padEnd(22)} `
    + `${String(nOk).padStart(3)} ok  ${nKo} KO  ${String(sec).padStart(3)}s`
    + (male && censimento ? `  ← ${perche}` : ""));
  if (male && !censimento) { rossa = { f, out }; break; }
}

if (rossa) {
  console.log(`\n──────── ${rossa.f} ────────\n`);
  console.log(rossa.out.split("\n").slice(-60).join("\n"));
  console.log(`\nFERMO QUI: ${rossa.f} è rossa. Le suite dopo non sono state provate.`);
  process.exit(1);
}

const mute = esiti.filter((e) => e.muto);
const rosse = esiti.filter((e) => e.male);
const saltate = esiti.filter((e) => e.saltata);
const verdi = esiti.filter((e) => !e.male && !e.muto && !e.saltata);
console.log(`\n${verdi.length} verdi (${verdi.reduce((a, e) => a + e.nOk, 0)} controlli veri)`
  + ` · ${mute.length} mute · ${rosse.length} rosse · ${saltate.length} saltate`
  + ` · ${esiti.length} file in tutto`);
if (saltate.length) {
  console.log(`\nSALTATE — non sono difetti: gli manca un file di dati che non sta nel repository:`);
  for (const e of saltate) console.log(`  ${e.f.padEnd(22)} manca «${e.saltata}»`);
}
if (mute.length) {
  console.log(`\nMUTE — girano senza provare niente, escono col verde comunque vada:`);
  for (const e of mute) console.log(`  ${e.f}`);
}
if (rosse.length) {
  console.log(`\nROSSE:`);
  for (const e of rosse) console.log(`  ${e.f.padEnd(22)} ${e.perche}`);
  if (censimento) {
    console.log(`\nL'output completo di ognuna sta in «${CARTELLA_ROSSI}/». Le ultime righe:`);
    for (const e of rosse) {
      console.log(`\n──────── ${e.f} ────────`);
      try {
        const t = readFileSync(`${CARTELLA_ROSSI}/${e.f}.txt`, "utf8").split("\n");
        console.log(t.slice(-25).join("\n"));
      } catch { console.log("  (output non conservato)"); }
    }
  }
}
process.exit(rosse.length ? 1 : 0);
