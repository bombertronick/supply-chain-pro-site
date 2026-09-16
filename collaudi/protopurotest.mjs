/* LA RICEVUTA DI CONSEGNA, PROVATA NUDA (gen-6.20).

   Le due funzioni che decidono se un incasso esce dalla coda sono PURE, e si
   provano senza browser: la tabella di verita' completa costa un secondo,
   mentre la stessa copertura su Playwright costerebbe venti minuti e sarebbe
   piu' fragile. Il disegno lo chiede per primo (progetti/finestra-cieca.md,
   COLLAUDI punto 18) e ha ragione: qui si vede la forma della decisione, di
   la' si vede il giro.

   ROSSO SU gen-6.19 PER IL MOTIVO GIUSTO: le due funzioni non esistono ancora,
   quindi la libreria non si costruisce e OGNI controllo di questo file e'
   rosso con scritto perche'. Non e' un'eccezione ingoiata: e' il rosso.

   PERCHE' LA LIBRERIA SE LA COSTRUISCE DA SOLO. mkprotolib.mjs entra in
   LIBRERIE di build.mjs solo NEL COMMIT DEL CODICE. Prima di allora,
   mettercelo fermerebbe ogni build — compresa quella che serve a registrare i
   rossi del banco col browser. */
import { execFileSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

let ko = 0;
const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* la libreria si rifa' SEMPRE dal sorgente in prova: una proto-lib.cjs
   dimenticata da un giro di ieri darebbe verde su codice che non esiste piu' */
const SORGENTE = process.env.SORGENTE || "../app/app.jsx";
let L = null, perche = "";
try {
  execFileSync(process.execPath, ["mkprotolib.mjs", SORGENTE], { stdio: "pipe" });
  delete require.cache[require.resolve("./proto-lib.cjs")];
  L = require("./proto-lib.cjs");
} catch (e) {
  perche = String(e.stderr || e.message || e).split("\n").filter(Boolean).slice(-2).join(" · ");
}

if (!L) {
  console.log("\n— la libreria non si costruisce: le funzioni non ci sono —");
  ok(false, `«consegnata» e «sfoltisciScritture» non esistono ancora in ${SORGENTE} — ${perche.slice(0, 200)}`);
  console.log(`\nprotopurotest: ${ko} CONTROLLI FALLITI`);
  process.exit(ko ? 1 : 0);
}

const C = L.consegnata, S = L.sfoltisciScritture;

/* ═══════════ 1. LA TABELLA DI VERITA' DI «consegnata» ═══════════ */
console.log("\n— 1. consegnata: la tabella di verità, riga per riga —");
const M = (x) => ({ scritture: x });
const v = (mitt, prot) => ({ mitt, prot, logId: "l-x" });

ok(C(M({ D: 100 }), v("D", 100)) === true,
  "SLOT UGUALE AL PROT: è il caso VERO — il mio slot contiene esattamente il numero che ho stampato");
ok(C(M({ D: 101 }), v("D", 100)) === true, "e uno slot più alto vale altrettanto: ho scritto ancora dopo");
ok(C(M({ D: 99 }), v("D", 100)) === false, "uno slot più basso NON dimostra niente: si rigioca");
ok(C(M({ E: 100 }), v("D", 100)) === false,
  "il numero di un ALTRO mittente non fa da garante per me: è il cuore del protocollo");
ok(C(M({}), v("D", 100)) === false, "mappa vuota: non so, quindi mi comporto come prima della ricevuta");
ok(C(M({ D: 100 }), { prot: 100 }) === false, "una voce senza mittente non dichiara niente");
ok(C(M({ D: 100 }), { mitt: "D" }) === false, "e nemmeno una senza protocollo: è la voce mai tentata");
ok(C(M({ D: 100 }), null) === false, "né una voce che non c'è");

console.log("\n— 2. e le forme sporche non possono dichiarare consegnato niente —");
for (const [nome, base] of [["mappa assente", {}], ["scritture null", M(null)],
  ["scritture stringa", M("100")], ["scritture array", M([100])], ["base null", null],
  ["base senza niente", undefined]])
  ok(C(base, v("D", 100)) === false, `${nome}: false`);
ok(C(M({ D: "cento" }), v("D", 100)) === false, "uno slot che non è un numero non conta");
ok(C(M({ D: NaN }), v("D", 100)) === false, "e nemmeno un NaN");
ok(C(M({ D: 100 }), { mitt: "D", prot: "cento" }) === false, "un prot che non è un numero: si rigioca");
ok(C(M({ D: 100 }), { mitt: "D", prot: NaN }) === false, "idem per NaN");
ok(C(M({ D: -5 }), { mitt: "D", prot: -10 }) === true, "i negativi si confrontano come numeri, senza casi speciali");
/* «"__proto__" in {}» è VERO: con `in` una voce di coda corrotta sul disco
   dichiarerebbe consegnato sé stessa. hasOwnProperty non ci casca. */
ok(C(M({ D: 100 }), v("__proto__", 1)) === false,
  "«__proto__» non è uno slot: una voce corrotta sul disco non può autocertificarsi");
ok(C(M({ D: 100 }), v("constructor", 1)) === false, "e nemmeno «constructor»");
ok(C(M({ D: 100 }), v("toString", 1)) === false, "e nemmeno «toString»");
/* e una mappa costruita da JSON.parse porta davvero le chiavi come proprie */
ok(C(JSON.parse('{"scritture":{"D":100}}'), v("D", 100)) === true,
  "una mappa arrivata da JSON.parse funziona: è la forma in cui arriva davvero");

/* ═══════════ 3. LA POTATURA, CHE NON DEVE SFRATTARE LA RICEVUTA CHE SERVE ══ */
console.log("\n— 3. sfoltisciScritture: pota per VALORE, non per orologio —");
const N = L.MAX_SCRITTURE, MIEI = L.MAX_MIEI;
ok(Number.isFinite(N) && N >= 10, `MAX_SCRITTURE è un numero dichiarato — ${N}`);
ok(Number.isFinite(MIEI) && MIEI >= 2 && MIEI < N, `e MAX_MIEI sta dentro — ${MIEI}`);

const tanti = {};
for (let i = 0; i < N + 5; i++) tanti["dev" + i + "·c" + i] = 1000 + i;
const potata = S(tanti, "devX·cX");
ok(Object.keys(potata).length === N, `${N + 5} mittenti diventano ${N} — ${Object.keys(potata).length}`);
ok(potata["dev" + (N + 4) + "·c" + (N + 4)] === 1000 + N + 4, "e restano i valori PIÙ ALTI");
ok(potata["dev0·c0"] === undefined, "il più basso esce");

ok(JSON.stringify(S(null, "d·c")) === "{}" && JSON.stringify(S("x", "d·c")) === "{}"
  && JSON.stringify(S([1, 2], "d·c")) === "{}",
  "una mappa sporca diventa una mappa vuota, non un'eccezione");
const sporca = S({ "a·1": 5, "b·1": "no", "c·1": null, "d·1": 7, __proto__: 99 }, "z·1");
ok(Object.keys(sporca).length === 2 && sporca["a·1"] === 5 && sporca["d·1"] === 7,
  `i valori non numerici spariscono senza portarsi via gli altri — ${JSON.stringify(sporca)}`);
ok(!Object.prototype.hasOwnProperty.call(sporca, "__proto__"), "e «__proto__» non entra mai nella mappa potata");
ok(S({ "a·1": "12" }, "z·1")["a·1"] === 12, "una stringa numerica si normalizza a numero");

console.log("\n— 4. e la ricevuta del MIO dispositivo non esce per prima —");
/* È il difetto che la demolizione ha trovato nel disegno del 9 settembre: con
   la potatura per sola rev decrescente, il primo slot a uscire è quello che
   tace da più tempo — cioè il telefono spento con una vendita in coda, che è
   l'unico caso in cui la ricevuta serve davvero. */
const affollata = { "mio·c1": 1 };            // la mia, vecchissima
for (let i = 0; i < N + 10; i++) affollata["altro" + i + "·c" + i] = 9000 + i;
const con = S(affollata, "mio·c1");
ok(con["mio·c1"] === 1,
  "la mia ricevuta resta anche se è la più vecchia di tutte: è quella che mi serve");
ok(Object.keys(con).length === N, `e il tetto tiene lo stesso — ${Object.keys(con).length}`);

const mieTante = {};
for (let i = 0; i < MIEI + 4; i++) mieTante["mio·c" + i] = 10 + i;
for (let i = 0; i < N; i++) mieTante["altro" + i + "·c" + i] = 9000 + i;
const con2 = S(mieTante, "mio·c0");
const quanteMie = Object.keys(con2).filter((k) => k.startsWith("mio·")).length;
ok(quanteMie <= MIEI, `ma i miei slot non mangiano la mappa: al massimo ${MIEI} in corsia preferenziale — ${quanteMie}`);
ok(quanteMie >= 1, "e almeno uno c'è sempre");
ok(con2["mio·c" + (MIEI + 3)] === 10 + MIEI + 3, "e sono i miei PIÙ RECENTI a restare");

console.log("\n— 5. senza un mittente dichiarato si pota come prima —");
const senza = S(affollata, "");
ok(Object.keys(senza).length === N && senza["mio·c1"] === undefined,
  "nessuna corsia preferenziale se non so chi sono: è il caso della navigazione privata");

/* ═══════════ 6. IL GIRO CHIUSO: TIMBRO -> POTATURA -> VERDETTO ═══════════ */
console.log("\n— 6. il giro chiuso: quello che timbro oggi lo riconosco domani —");
let mappa = {};
const mio = "dev-A·car-1";
for (let rev = 1; rev <= 5; rev++) mappa = S({ ...mappa, [mio]: rev }, mio);
ok(C({ scritture: mappa }, v(mio, 5)) === true, "l'ultima scrittura si riconosce");
ok(C({ scritture: mappa }, v(mio, 3)) === true, "e anche una più vecchia dello stesso mittente");
ok(C({ scritture: mappa }, v(mio, 6)) === false, "una che non è ancora atterrata no");
/* e la prova che il tetto non morde MAI il mio giro, che è la promessa del §4 */
let piena = {};
for (let i = 0; i < N + 30; i++) piena["altro" + i + "·c" + i] = 50000 + i;
piena = S({ ...piena, [mio]: 7 }, mio);
ok(C({ scritture: piena }, v(mio, 7)) === true,
  "anche con la mappa piena di sconosciuti, la mia ricevuta si legge ancora");

console.log(`\nprotopurotest: ${ko ? ko + " CONTROLLI FALLITI" : "TUTTI I CONTROLLI PASSATI"}`);
process.exit(ko ? 1 : 0);
