/* I SABOTAGGI DEL CANCELLO DEI DOCUMENTI, CONTATI UNO PER UNO.

   `coerenzatest.mjs` sorveglia i DOCUMENTI, non il codice: quindi la copia
   integra da sabotare non e' il sorgente ma un ALBERO di documenti. Si copia
   l'albero vero in una cartella temporanea, si rompe UNA cosa sola, si gira il
   banco LA' DENTRO e si contano le rosse.

   Un MUTO non e' un risultato: e' una domanda, e va aperta. Se un sabotaggio
   non fa diventare rosso niente, quella guardia non sta guardando.

   NON TOCCA MAI IL REPOSITORY: l'albero vero si legge e basta. E' l'unico
   sabotatore di casa che puo' dirlo, e lo dice perche' gli altri lavorano sul
   file vero e lo rimettono a posto — qui non serve nemmeno rimetterlo.

   Uso: node sabotaggi-coerenza.mjs [numero]   (senza numero: tutti) */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, cpSync, readdirSync } from "fs";
import { execFileSync } from "child_process";
import path from "path";

const QUI = path.dirname(new URL(import.meta.url).pathname);
const RAD = [path.resolve(QUI, ".."), QUI].find((d) => existsSync(path.join(d, "PASSAGGIO.md")));
if (!RAD) { console.error("KO  non trovo la radice del repository"); process.exit(1); }

const src = readFileSync(path.join(RAD, "app", "app.jsx"), "utf8");
const VER = (src.match(/const VERSIONE = "(gen-\d+\.\d+)"/) || [])[1];
const TAG = "gen" + VER.replace("gen-", "").replace(".", "");

/* i numeri veri, presi dalla sorgente: servono a costruire i sabotaggi che
   cambiano UNA cifra sola invece di scrivere un valore a caso */
const { createHash } = await import("crypto");
const MD5 = createHash("md5").update(src, "utf8").digest("hex");
const LEN = String(src.length);
const storpia = (s) => s.slice(0, -1) + (s.slice(-1) === "a" ? "b" : "a");

const BASE = "/tmp/coerenza-sabotata";

function alberoIntegro() {
  rmSync(BASE, { recursive: true, force: true });
  mkdirSync(path.join(BASE, "app"), { recursive: true });
  mkdirSync(path.join(BASE, "collaudi"), { recursive: true });
  mkdirSync(path.join(BASE, "strumenti"), { recursive: true });
  for (const f of ["PASSAGGIO.md", "CONSEGNA.md", "README.md", "memoria.json", "roadmap.html", "CLAUDE.md", "index.html"])
    if (existsSync(path.join(RAD, f))) cpSync(path.join(RAD, f), path.join(BASE, f));
  cpSync(path.join(RAD, "app", "app.jsx"), path.join(BASE, "app", "app.jsx"));
  cpSync(path.join(QUI, "coerenzatest.mjs"), path.join(BASE, "collaudi", "coerenzatest.mjs"));
  /* §9 conta i banchi sul disco: nell'albero finto ce ne sarebbe UNO, e il
     controcontrollo nascerebbe rosso per un non-difetto — cioe' la trappola che
     questa casa ha gia' pagato due volte. Si copiano i NOMI di tutti i banchi
     come file vuoti: il conto torna e non si trascina dentro nessun codice. */
  for (const f of readdirSync(QUI).filter((x) => /test\.mjs$/.test(x) && x !== "coerenzatest.mjs"))
    writeFileSync(path.join(BASE, "collaudi", f), "");
  const sql = path.join(RAD, "strumenti", TAG + ".sql");
  if (existsSync(sql)) cpSync(sql, path.join(BASE, "strumenti", TAG + ".sql"));
}

const leggi = (f) => readFileSync(path.join(BASE, f), "utf8");
const scrivi = (f, t) => writeFileSync(path.join(BASE, f), t);
const sostituisci = (f, da, a) => {
  const t = leggi(f);
  if (!t.includes(da)) throw new Error(`in ${f} non trovo «${da.slice(0, 60)}…»`);
  scrivi(f, t.replace(da, a));
};

const SABOTAGGI = [
  { n: 1, nome: "la VERSIONE del sorgente sale senza che i documenti lo sappiano",
    attesa: "molte rosse: cambiando app.jsx cambiano len e md5, e nessuno dei quattro posti lo sa piu'. E' il caso «ho alzato VERSIONE e ho dimenticato i documenti»",
    fai: () => sostituisci("app/app.jsx", `const VERSIONE = "${VER}"`, `const VERSIONE = "gen-9.99"`) },

  { n: 2, nome: "in PASSAGGIO.md la len ha una cifra sbagliata",
    attesa: "§2 rossa sulla len di PASSAGGIO",
    fai: () => sostituisci("PASSAGGIO.md", `len ${LEN}`, `len ${LEN.slice(0, -1)}${(+LEN.slice(-1) + 1) % 10}`) },

  { n: 3, nome: "in PASSAGGIO.md la md5 ha un carattere sbagliato",
    attesa: "§2 rossa sulla md5 di PASSAGGIO — e' il refuso a lunghezza invariata che il 9 settembre e' costato una voce di dispensa",
    fai: () => sostituisci("PASSAGGIO.md", MD5, storpia(MD5)) },

  { n: 4, nome: "in memoria.json → online la md5 ha un carattere sbagliato",
    attesa: "§2 rossa su online.md5",
    fai: () => { const m = JSON.parse(leggi("memoria.json")); m.online.md5 = storpia(m.online.md5); scrivi("memoria.json", JSON.stringify(m, null, 1)); } },

  { n: 5, nome: "in memoria.json → chiusi[0] la frase «PRODUZIONE» ha la md5 sbagliata",
    attesa: "§2 rossa. E' IL SABOTAGGIO CHE CONTA DI PIU': memoriatest §5 confronta questa frase con online.md5, cioe' DUE COPIE SCRITTE DALLA STESSA MANO, e resta verde se sbagliano insieme. Qui si confronta con la sorgente",
    /* NON chiusi[0]: dal 16 settembre in testa ci sono i lavori di soli
       collaudi, che la frase «PRODUZIONE» non ce l'hanno. Va colpito l'ultimo
       lavoro SPEDITO, che e' quello che §2 legge davvero — e infatti al primo
       giro dopo quel cambio questo sabotaggio e' uscito MUTO. Un sabotaggio che
       colpisce il posto sbagliato assolve la guardia senza averla provata. */
    fai: () => { const m = JSON.parse(leggi("memoria.json"));
                 const v = m.chiusi.find((g) => !g.soloCollaudi);
                 v.cosa = v.cosa.replace(MD5, storpia(MD5));
                 scrivi("memoria.json", JSON.stringify(m, null, 1)); } },

  { n: 6, nome: "la roadmap dice che in cucina gira un'altra generazione",
    attesa: "§2 rossa su «In cucina» — e' il documento che legge l'utente",
    fai: () => sostituisci("roadmap.html", `<dt>In cucina</dt>`, `<dt>In cucina</dt>`) || sostituisci("roadmap.html", `<dd><b>${VER}</b>`, `<dd><b>gen-9.99</b>`) },

  { n: 7, nome: "un carattere astrale dentro app.jsx",
    attesa: "§1 rossa sugli astrali, piu' len e md5: il caricatore rifiuterebbe e l'app non partirebbe per nessuno",
    fai: () => scrivi("app/app.jsx", leggi("app/app.jsx") + "\n/* \u{1F355} */\n") },

  { n: 8, nome: "il primo messaggio manda a un checkpoint che non e' l'ultimo",
    attesa: "§3 rossa. E' IL DIFETTO VERO trovato il 16 settembre: una sessione nuova ripartiva dallo stato della generazione precedente",
    fai: () => { const t = leggi("PASSAGGIO.md"); const u = (t.match(/\*\*Dispensa\*\*:[^`]*`(chk-[a-z0-9-]+)`/) || [])[1];
                 scrivi("PASSAGGIO.md", t.replace(new RegExp("`" + u + "`(?![^]*\\*\\*Dispensa\\*\\*)"), "`chk-19700101`")); } },

  { n: 9, nome: "il .sql del rilascio non e' stato conservato",
    attesa: "§4 rossa. E' successo davvero per gen-6.20 e gen-6.21, e non l'ha detto nessuno per due generazioni",
    fai: () => rmSync(path.join(BASE, "strumenti", TAG + ".sql"), { force: true }) },

  { n: 10, nome: "il censimento di questa generazione non e' scritto",
    attesa: "§5 rossa: senza quella riga non si sa se il censimento e' mai stato fatto",
    fai: () => { const t = leggi("PASSAGGIO.md"); const r = t.split("\n").find((x) => x.includes(VER) && /verdi/.test(x));
                 scrivi("PASSAGGIO.md", t.replace(r, "")); } },

  { n: 11, nome: "CONSEGNA.md perde il cartello di documento storico",
    attesa: "§6 rossa: torna a dichiarare al presente di essere allineato a gen-5.73, che e' la prima cosa che legge chi riparte",
    fai: () => sostituisci("CONSEGNA.md", "DOCUMENTO STORICO", "documento di ieri") },

  { n: 12, nome: "la bussola sparisce",
    attesa: "§7 rossa: senza CLAUDE.md una sessione nuova si tiene quello iniettato dal repository superato, che non nomina mai questo",
    fai: () => rmSync(path.join(BASE, "CLAUDE.md"), { force: true }) },

  { n: 13, nome: "la bussola indica il repository superato",
    attesa: "§7 rosse TRE volte (manda a PASSAGGIO, nomina app/app.jsx, non nomina src/app.jsx): e' il modo in cui il difetto tornerebbe da solo, con un CLAUDE.md che esiste ma manda nel posto sbagliato",
    fai: () => scrivi("CLAUDE.md", "# Supply Chain Pro\n\nTutta l'app vive in src/app.jsx (~3.700 righe).\n") },

  { n: 14, nome: "la bussola dichiara un numero di banchi sbagliato",
    attesa: "§9 rossa: un numero scritto a mano in un documento invecchia a ogni generazione — questo e' passato da 108 a 115 in cinque giorni",
    fai: () => { const t = leggi("CLAUDE.md"); const m = t.match(/(\d+) banchi/);
                 scrivi("CLAUDE.md", t.replace(m[0], (+m[1] + 7) + " banchi")); } },

  { n: 15, nome: "la vetrina pubblica torna a fermarsi a una serie vecchia",
    attesa: "§10 rossa: e' la faccia pubblica del progetto, e il 16 settembre si fermava a «Gen 4» mentre in cucina girava gen-6.21 — ventuno generazioni dopo",
    fai: () => { const t = leggi("index.html");
                 scrivi("index.html", t.replace(/<div class="gen"><b>Gen [56] ·[\s\S]*?<\/div>\n?/g, "")); } },

  { n: 16, nome: "il conto a parole della vetrina non combacia piu' con le voci",
    attesa: "§10 rossa: «Sei generazioni» sopra un elenco che ne ha altre e' il modo in cui quella frase e' invecchiata la prima volta",
    fai: () => sostituisci("index.html", "Sei generazioni di sviluppo", "Nove generazioni di sviluppo") },
];

const quale = process.argv[2] ? +process.argv[2] : null;
const daFare = quale ? SABOTAGGI.filter((s) => s.n === quale) : SABOTAGGI;
let muti = 0;

/* controcontrollo: l'albero integro deve essere VERDE, se no i conti di sotto
   non vogliono dire niente */
alberoIntegro();
let integro = 0;
try { execFileSync("node", [path.join(BASE, "collaudi", "coerenzatest.mjs")], { encoding: "utf8" }); }
catch (e) { integro = ((e.stdout || "").match(/^  KO  /gm) || []).length || 1; }
console.log(`\ncontrocontrollo — albero integro: ${integro === 0 ? "VERDE" : "!! " + integro + " rosse, i conti sotto non valgono"}`);

for (const s of daFare) {
  alberoIntegro();
  try { s.fai(); } catch (e) { console.log(`\nS${s.n} — ${s.nome}\n   !! non ho potuto sabotare: ${e.message}`); muti++; continue; }
  let rosse = 0, uscita = "";
  try { uscita = execFileSync("node", [path.join(BASE, "collaudi", "coerenzatest.mjs")], { encoding: "utf8" }); }
  catch (e) { uscita = e.stdout || ""; }
  rosse = (uscita.match(/^  KO  /gm) || []).length;
  const righe = uscita.split("\n").filter((r) => r.startsWith("  KO  ")).map((r) => r.slice(6));
  console.log(`\nS${s.n} — ${s.nome}`);
  console.log(`   atteso: ${s.attesa}`);
  console.log(`   esito : ${rosse === 0 ? "!! MUTO — nessuna rossa: questa guardia non guarda" : rosse + " rosse"}`);
  for (const r of righe.slice(0, 4)) console.log(`           · ${r}`);
  if (rosse === 0) muti++;
}

rmSync(BASE, { recursive: true, force: true });
console.log(`\n${daFare.length} sabotaggi · ${muti} muti${muti ? " — UN MUTO VA APERTO, non dichiarato a posteriori" : " — tutte le guardie mordono"}`);
process.exit(muti || integro ? 1 : 0);
