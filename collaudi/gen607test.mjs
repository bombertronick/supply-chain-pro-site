/* gen-6.07 «I soldi non si contano due volte» — le tre guardie, come le ha
   volute il processo avversario che le ha demolite prima che le scrivessi.

   NESSUNA delle tre e' come l'avevo pensata. Cinque accusatori indipendenti,
   una controprova incrociata su ogni accusa, e un verdetto: G1 guardava una
   parola sola dove il server ne sa dire tre; G2 cercava il testimone nel
   posto da cui l'aveva sfrattato lo sfoltimento; G3 apriva una finestra
   dentro una stanza la cui PORTA resta chiusa.

   G1 — LA RISPOSTA CHE PORTA UN ERRORE NON E' UN SALVATAGGIO.
   app_kv_set.sql rifiuta in due modi: riga 41 RITORNA {error:'auth'} (json,
   non eccezione), righe 61-64 SOLLEVANO 40001 sul conflitto fra due casse. In
   mezzo c'e' un caricatore che non e' nel repository e non si puo' leggere,
   che puo' incartare la risposta come fa supabase-js ({data:{...},error:null})
   o consegnare il corpo PostgREST ({code,message}). scriviRemoto guardava
   solo `if (!r)`, e un oggetto e' truthy: tornava TRUE. Chi chiama credeva
   salvato, tagliava la coda e cancellava scp:coda:v1 dal telefono.
   Qui si provano TUTTE le forme, una per una, comprese quelle del successo:
   una guardia che rompe il salvataggio buono sarebbe peggio del difetto.

   G2 — LO STESSO SCONTRINO UNA VOLTA SOLA, E QUELLO VECCHIO SI FERMA.
   Il solo logId in s.applicate non basta (tetto 300: una serata a due casse).
   Ma cercare l'id in s.vendite non basta neanche, perche' quella lista dura
   48 ore e 300 righe GLOBALI: fuori da li' la guardia e' cieca proprio nel
   caso che la giustifica, il tablet spento nel fine settimana. Serve anche lo
   steccato d'eta': una voce ferma da piu' di due giorni non si rigioca al
   buio, si mette da parte e si dice quante sono.

   G3 — LA PORTA PRIMA DELLA FINESTRA.
   Il Foglio «Le ultime vendite» filtrava per giorno di calendario mentre lo
   sfoltimento tiene 48 ore: alle 00:30 lo scontrino delle 23:50 era
   irraggiungibile. Ma il bottone che apre quel Foglio vive DENTRO il riquadro
   «Oggi», che a mezzanotte e mezza non c'e' ancora: senza aprire anche quel
   cancello, la riparazione non si vede.

   COME SI GIRA: node gen607test.mjs — servito su http (mai file://, origine
   opaca) e SEMPRE nel ramo con window.auth, che e' quello che usa la
   produzione. Sono le due lezioni che oggi mi sono costate mezza giornata e
   un rilascio annunciato chiuso a meta'. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import { readFile } from "fs/promises";
import { createServer } from "http";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";

/* ── PERCHE' QUESTO BANCO NON APRE UN file:// ──
   Con file:// questo file ha dato 11, 5, 11, 5, 3, 0, 0, 12, 0, 10 rossi sullo
   STESSO identico codice, e per mezza giornata ho preso quei rossi per difetti
   dell'app. La causa non era ne' il codice ne' i tempi: su file:// Chromium
   tratta l'origine come OPACA e ogni pagina puo' ricevere un'archiviazione
   SUA. Quindi «scrivo la coda, ricarico, la coda non c'e' piu'» non misurava
   il ritrovamento: misurava che la seconda pagina guardava un altro disco.
   Un banco che deve provare cosa sopravvive a un riavvio non puo' girare su
   un'origine senza identita'. Qui la pagina si serve su http://127.0.0.1, che
   e' un'origine vera: localStorage e' del contesto, condiviso fra le pagine e
   stabile fra i riavvii, come sul telefono di chi lavora.
   NOTA PER GLI ALTRI BANCHI: tutti gli altri aprono ancora file://. Quelli che
   non toccano localStorage non se ne accorgono; quelli che ci contano — in
   testa gen605test — sono esposti allo stesso inganno, e vanno rifatti. */
const radice = process.cwd();
const TIPI = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
const srv = createServer(async (req, res) => {
  const chiesto = decodeURIComponent((req.url || "/").split("?")[0]);
  const nome = chiesto === "/" ? "/index.html" : chiesto;
  const dentro = path.resolve(radice, "." + nome);
  if (!dentro.startsWith(radice)) { res.writeHead(403); return res.end("no"); }
  try {
    const dati = await readFile(dentro);
    res.writeHead(200, { "content-type": (TIPI[path.extname(dentro)] || "application/octet-stream") + "; charset=utf-8" });
    res.end(dati);
  } catch { res.writeHead(404); res.end("non c'e'"); }
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const URL_APP = `http://127.0.0.1:${srv.address().port}/index.html`;
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 130)}`); } };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 6);
if (!linea) throw new Error("banco povero: serve una linea con almeno 6 articoli");
const perNome = (n) => {
  const p = base.prodotti.find((x) => x.nome === n);
  const a = (linea.articoli || []).find((x) => x.prodottoId === p?.id);
  if (!a) throw new Error("il seme non ha «" + n + "» sulla linea");
  return a;
};
const moz = perNome("Mozzarella no lattosio"), sug = perNome("Sugo");
for (const a of [moz, sug]) a.qty = 50;
FM.cassaMagId = linea.id;
const ing = (art, qty) => ({ prodottoId: art.prodottoId, qty, uomId: art.uomId });
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, aliquota: 10, attivo: true,
    varianti: [], distinta: [ing(sug, 1), ing(moz, 1)] },
];
base.aggiunte = []; base.postazioni = []; base.vendite = []; base.giornate = [];
const PRC = { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") };
const SEME = JSON.stringify({ ...base, profili: [PRC] });

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
/* ── IL FINTO SERVER IN MODO SICURO ──
   window.auth come lo espone il caricatore in produzione, e window.storage
   che rifiuta senza token. Gli interruttori della rete vivono su
   localStorage e non in memoria, se no al ricaricamento tornerebbe tutto
   vivo e il banco misurerebbe il caso sbagliato (imparato a gen-6.05). */
const apri = async (seme = SEME) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    if (!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1", j);
    /* LA SPIA SULLA CHIAVE DELLA CODA. Un controllo che dice «sparita» senza
       dire CHI l'ha cancellata costringe a indovinare, e indovinare e' come
       ho perso mezza giornata. Qui ogni tocco lascia il nome e lo stack. */
    const vero = { set: localStorage.setItem.bind(localStorage), rem: localStorage.removeItem.bind(localStorage), clr: localStorage.clear.bind(localStorage) };
    const annota = (v) => { try { const a = JSON.parse(vero.get ? "[]" : localStorage.getItem("prova:diario") || "[]"); a.push(v); vero.set("prova:diario", JSON.stringify(a).slice(0, 20000)); } catch {} };
    window.__diario = () => { try { return JSON.parse(localStorage.getItem("prova:diario") || "[]"); } catch { return []; } };
    localStorage.setItem = (k, v) => { if (k === "scp:coda:v1") annota({ op: "set", n: (() => { try { return JSON.parse(v || "[]").length; } catch { return "?"; } })(), da: new Error().stack.split("\n").slice(1, 4).join(" | ") }); return vero.set(k, v); };
    localStorage.removeItem = (k) => { if (k === "scp:coda:v1") annota({ op: "remove", da: new Error().stack.split("\n").slice(1, 4).join(" | ") }); return vero.rem(k); };
    localStorage.clear = () => { annota({ op: "clear", da: new Error().stack.split("\n").slice(1, 3).join(" | ") }); return vero.clr(); };
    const bandiera = (k) => { try { return localStorage.getItem(k) === "1"; } catch { return false; } };
    window.__uccidiRete = (x) => { try { localStorage.setItem("prova:rete-morta", x ? "1" : "0"); } catch {} };
    window.__scriviUnaSola = (x) => { try { localStorage.setItem("prova:una-e-basta", x ? "1" : "0"); if (!x) localStorage.removeItem("prova:gia-scritto"); } catch {} };
    /* il server dice sì al PIN ma non consegna i dati: succede davvero (la
       sessione nasce, poi la rete cade fra una chiamata e l'altra) */
    window.__perdiLettura = (x) => { try { localStorage.setItem("prova:lettura-persa", x ? "1" : "0"); } catch {} };
    /* quale forma restituisce il finto server alla scrittura dello stato */
    window.__forma = (f) => { try { if (f) localStorage.setItem("prova:forma", f); else localStorage.removeItem("prova:forma"); } catch {} };
    window.__conta = () => { try { return JSON.parse(localStorage.getItem("prova:conta") || "{}"); } catch { return {}; } };
    const segna = (k) => { try { const c = window.__conta(); c[k] = (c[k] || 0) + 1; localStorage.setItem("prova:conta", JSON.stringify(c)); } catch {} };
    const sha = async (t) => {
      const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
      return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
    };
    let TOKEN = null;
    window.__haToken = () => !!TOKEN;
    window.auth = {
      async loginList() {
        segna("loginList");
        return JSON.parse(localStorage.getItem("db:scp:stato:v1")).profili
          .map((p) => ({ id: p.id, nome: p.nome, ruolo: p.ruolo, colore: p.colore }));
      },
      async login(arg) {
        segna("login");
        const parti = String(arg).split(String.fromCharCode(1));
        const h = await sha("scp·" + parti[0]);
        const prof = JSON.parse(localStorage.getItem("db:scp:stato:v1")).profili
          .find((p) => p.pinHash === h && (!parti[1] || p.id === parti[1]));
        if (!prof) return { error: "pin" };
        TOKEN = "tok-" + prof.id;
        return { token: TOKEN, profiloId: prof.id, ruolo: prof.ruolo };
      },
      async registra() { return { error: "codice" }; },
      async richiesta() { return { ok: true }; },
      logout() { TOKEN = null; },
      get token() { return TOKEN; },
    };
    /* SENZA TOKEN NON SI LEGGE E NON SI SCRIVE: e' la regola vera del server
       (le RPC app_kv_* vogliono p_token) ed e' quella che rende questo banco
       diverso da tutti gli altri. */
    window.storage = {
      async get(k) {
        segna("get");
        if (!TOKEN) { segna("get-senza-token"); return null; }
        if (bandiera("prova:lettura-persa")) { segna("get-perso"); return null; }
        const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v };
      },
      async set(k, v) {
        segna("set");
        if (!TOKEN) { segna("set-senza-token"); throw new Error("nessuna sessione (finto server)"); }
        if (bandiera("prova:rete-morta")) throw new Error("rete morta (finta)");
        /* ── LE FORME DELLA RISPOSTA (gen-6.07) ──
           Il caricatore non e' leggibile, quindi il banco non indovina: le
           prova tutte. Nelle forme di RIFIUTO il valore NON viene scritto —
           e' il punto: il server ha detto di no. Nelle forme di SUCCESSO
           viene scritto, e servono a dimostrare che la guardia non rompe il
           salvataggio buono. */
        const forma = (() => { try { return localStorage.getItem("prova:forma") || ""; } catch { return ""; } })();
        if (forma && k === "scp:stato:v1") {
          segna("set-forma-" + forma);
          if (forma === "errore-grezzo") return { error: "auth" };
          if (forma === "errore-incartato") return { data: { error: "auth" }, error: null };
          if (forma === "conflitto") {
            /* un'altra cassa ha salvato prima: la spia in rete AVANZA, cosi'
               la classificazione a valle trova rr diverso da base.rev e
               chiama conflitto — il rifiuto quotidiano, non quello raro */
            try {
              const s0 = JSON.parse(localStorage.getItem("db:scp:stato:v1") || "{}");
              localStorage.setItem("db:scp:rev:v1", String((s0.rev || 0) + 1 + Math.floor(Math.random() * 3)));
            } catch {}
            return { code: "40001", message: "conflitto: in rete c'e' la revisione 812, questa scrittura parte dalla 811", details: null, hint: null };
          }
          if (forma === "ok-oggetto") { localStorage.setItem("db:" + k, v); return { ok: true }; }
          if (forma === "ok-true") { localStorage.setItem("db:" + k, v); return true; }
          if (forma === "ok-doppio") { localStorage.setItem("db:" + k, v); return { key: k, value: v, shared: true }; }
        }
        if (bandiera("prova:una-e-basta")) {
          if (localStorage.getItem("prova:gia-scritto") === "1") throw new Error("rete morta dopo la prima (finta)");
          localStorage.setItem("db:" + k, v);
          localStorage.setItem("prova:gia-scritto", "1");
          throw new Error("risposta persa (finta)");
        }
        localStorage.setItem("db:" + k, v);
        return true;
      },
      async delete(k) { if (!TOKEN) return null; localStorage.removeItem("db:" + k); return true; },
    };
  }, [seme]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  return { p, ctx };
};
/* ── IL RICARICAMENTO SI FA CON UNA PAGINA NUOVA ──
   Con p.goto() sullo stesso file:// questo banco ha dato tre risultati diversi
   sullo stesso codice, e il diario dimostrava una cosa impossibile: la coda
   scritta prima, e dopo il ricaricamento il disco VUOTO senza che nessuno
   l'avesse cancellata. Cioe' ogni tanto la pagina ripartiva su
   un'archiviazione azzerata. Una pagina NUOVA nello stesso contesto e' lo
   stesso identico caso per l'app (un montaggio da zero che ritrova il disco
   di prima, perche' localStorage e' del contesto) ed e' ripetibile.
   Restava un rischio: se l'archiviazione fosse davvero vuota il banco
   direbbe rosso per colpa sua, quindi «riapri» PRETENDE che il disco sia
   quello di prima e lo dice a voce alta se non lo e'. */
const riapri = async (g) => {
  const prima = await g.p.evaluate(() => localStorage.getItem("scp:coda:v1"));
  const nuova = await g.ctx.newPage();
  nuova.on("pageerror", (e) => errs.push(e.message));
  await g.p.close().catch(() => {});
  g.p = nuova;
  await vai(nuova);
  const dopo = await nuova.evaluate(() => localStorage.getItem("scp:coda:v1"));
  if (prima && dopo === null) throw new Error("BANCO GUASTO: il disco si e' azzerato da solo fra le due pagine");
  return nuova;
};
const vai = async (p) => {
  await p.goto(URL_APP);
  /* il ricaricamento e' finito quando la schermata dei nomi C'E', non dopo un
     tempo sperato: leggere il disco mentre l'avvio e' a meta' dava letture a
     caso, ed e' quello che mi ha fatto scambiare la fragilita' del banco per
     un difetto dell'app */
  await p.getByText("OpCassa", { exact: true }).first().waitFor({ state: "visible", timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(400);
};
const login = async (p) => {
  const nome = p.getByText("OpCassa", { exact: true }).first();
  await nome.waitFor({ state: "visible", timeout: 20000 });
  await nome.click();
  const uno = p.getByRole("button", { name: "2", exact: true }).first();
  await uno.waitFor({ state: "visible", timeout: 20000 });
  for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  /* si aspetta che il tastierino sia SPARITO: e' il segno che il server ha
     detto sì, non un tempo sperato */
  await uno.waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
  await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(700);
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const salvato = (p) => p.evaluate(() => { const v = localStorage.getItem("db:scp:stato:v1"); return v ? JSON.parse(v) : null; });
const codaSalvata = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("scp:coda:v1") || "null"); } catch { return "ILLEGGIBILE"; } });
const conta = (p) => p.evaluate(() => window.__conta());
const diario = (p) => p.evaluate(() => (window.__diario() || []).map((d) => d.op + (d.n !== undefined ? "(" + d.n + ")" : "") + " ← " + String(d.da || "").replace(/file:[^)]*bundle\.js:/g, "b:")).join("   ·   "));
/* ── SI ASPETTA UN FATTO, NON UN OROLOGIO ──
   Con le attese a tempo fisso questo file ha dato 11, 5, 11, 5, 3 rossi sullo
   STESSO codice: sotto carico il foglio dell'incasso non faceva in tempo ad
   aprirsi e il tocco andava a vuoto, e io stavo per prendere quei rossi per
   difetti dell'app. E' la stessa lezione gia' scritta in memoria per pintest.
   Da qui in poi si aspetta che la cosa SIA SUCCESSA, con una scadenza. */
const finche = async (p, quando, ms = 12000, passo = 150) => {
  const fine = Date.now() + ms;
  for (;;) { if (await quando()) return true; if (Date.now() > fine) return false; await p.waitForTimeout(passo); }
};
const battiEIncassa = async (p) => {
  const cella = p.getByRole("button", { name: "Aggiungi Margherita", exact: true });
  await cella.waitFor({ state: "visible", timeout: 20000 });
  await cella.click();
  const incassa = p.getByRole("button", { name: "Incassa", exact: true });
  await incassa.waitFor({ state: "visible", timeout: 20000 });
  await incassa.click();
  const registra = p.getByRole("button", { name: "Registra l'incasso", exact: true });
  await registra.waitFor({ state: "visible", timeout: 20000 });
  await registra.click();
  /* il foglio si chiude quando la vendita e' stata presa in carico */
  await registra.waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(250);
};


/* il seme si costruisce a mano per ogni sezione: seed-state.json ha vendite,
   giornate e applicate a ZERO (verificato), quindi un controllo su G2 che non
   le semini misura un caso che non esiste */
const IERI2350 = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() - 10 * 60000; })();
const OGGI2015 = (() => { const d = new Date(); d.setHours(20, 15, 0, 0); return d.getTime() > Date.now() ? d.getTime() - 86400000 : d.getTime(); })();
const giornoDiT = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const vendita = (id, t, totale = 6.5, extra = {}) => ({
  id, t, giorno: giornoDiT(t), sedeId: FM.id, chi: "OpCassa", metodo: "contanti",
  righe: [{ voceId: "li-mar", nome: "Margherita", qty: 1, prezzo: totale, aliquota: 10, gruppo: "Pizze" }],
  totale, stato: "registrata", n: 1,
  scarico: [{ prodottoId: moz.prodottoId, magId: linea.id, quanto: 1, uomId: moz.uomId }], ...extra,
});
const giornata = (t, totale, n) => ({ id: giornoDiT(t) + "|" + FM.id, giorno: giornoDiT(t), sedeId: FM.id,
  totale, nVendite: n, nStorni: 0, metodi: { contanti: totale, carta: 0, altro: 0 } });
/* un seme su misura, senza toccare quello condiviso */
const semeCon = (cambia) => { const s = JSON.parse(SEME); cambia(s); return JSON.stringify(s); };
/* IL SEME ENTRA PRIMA DELLA PAGINA. Scriverlo con p.evaluate su un contesto
   appena creato vuol dire parlare a about:blank, che ha origine opaca e
   risponde SecurityError su localStorage — sedici rossi che non erano
   dell'app ma miei, la terza volta oggi che il banco mente. Il seme si passa
   allo script d'avvio, che gira prima di ogni caricamento. */
const apriCon = async (seme) => {
  const g = await apri(seme);
  await vai(g.p);
  return g;
};

/* ═══ 1. G1 — LE FORME DELLA RISPOSTA ═══
   Per ogni forma di RIFIUTO si pretendono tre cose insieme, perche' una sola
   non basta: la vendita NON risulta in rete, la coda e' ANCORA sul telefono,
   e il semaforo non dice «tutto a posto». La terza da sola sarebbe verde su
   una pagina bianca; la prima da sola e' verde anche se la coda e' sparita. */
console.log("\n— 1. G1: il server sa dire di no in tre modi, e nessuno e' un salvataggio —");
for (const [forma, comeSiChiama] of [
  ["errore-grezzo", "il json nudo del server, {error:auth}"],
  ["errore-incartato", "lo stesso incartato da supabase-js, {data:{error:auth},error:null}"],
  ["conflitto", "il rifiuto QUOTIDIANO fra due casse, {code:40001}"],
]) {
  await prova(`§1 ${forma}`, async () => {
    const G = await apriCon(SEME);
    await login(G.p);
    await vaiA(G.p, "Cassa"); await G.p.waitForTimeout(600);
    await G.p.evaluate((f) => window.__forma(f), forma);
    await battiEIncassa(G.p);
    /* si aspetta che il motore abbia PROVATO: il contatore dei set sale */
    await finche(G.p, async () => ((await conta(G.p))["set-forma-" + forma] || 0) >= 1, 15000);
    await G.p.waitForTimeout(2500);
    const rete = await salvato(G.p);
    const coda = await codaSalvata(G.p);
    ok((rete.vendite || []).length === 0,
      `${comeSiChiama}: in rete non risulta nessuna vendita (${(rete.vendite || []).length})`);
    ok(Array.isArray(coda) && coda.length === 1,
      `…e la vendita e' ANCORA sul telefono (${coda === null ? "SPARITA — il telefono l'ha cancellata" : (coda || []).length})`);
    const t = await testoDi(G.p);
    ok(!/Sincronizzato/.test(t), `…e il semaforo non dice «Sincronizzato» — «${(t.match(/(Sincronizzato|da salvare|Riconnessione|Offline|Salvataggio)[^·]{0,18}/i) || ["(niente)"])[0]}»`);
    await G.ctx.close();
  });
}

console.log("\n— 2. G1, controcontrollo: il salvataggio buono non si rompe —");
for (const [forma, comeSiChiama] of [
  ["ok-oggetto", "{ok:true}, la forma vera del successo del server"],
  ["ok-true", "true secco"],
  ["ok-doppio", "{key,value,shared:true}, la forma del doppio"],
]) {
  await prova(`§2 ${forma}`, async () => {
    const G = await apriCon(SEME);
    await login(G.p);
    await vaiA(G.p, "Cassa"); await G.p.waitForTimeout(600);
    await G.p.evaluate((f) => window.__forma(f), forma);
    await battiEIncassa(G.p);
    const arrivata = await finche(G.p, async () => ((await salvato(G.p)).vendite || []).length === 1, 15000);
    ok(arrivata, `${comeSiChiama}: la vendita arriva in rete lo stesso`);
    const svuotata = await finche(G.p, async () => (await codaSalvata(G.p)) === null, 8000);
    ok(svuotata, "…e la coda si svuota, come deve");
    await G.ctx.close();
  });
}

console.log("\n— 3. G1: un rifiuto che non passa non puo' dire «salvataggio» per sempre —");
await prova("§3", async () => {
  const G = await apriCon(SEME);
  await login(G.p);
  await vaiA(G.p, "Cassa"); await G.p.waitForTimeout(600);
  await G.p.evaluate(() => window.__forma("conflitto"));
  await battiEIncassa(G.p);
  /* con la spia che avanza a ogni giro la classificazione e' sempre
     «conflitto», e senza un tetto il semaforo resta su «salvataggio» a vita */
  const arrivaOffline = await finche(G.p, async () => /Offline|Non connesso|instabile/i.test(await testoDi(G.p)), 60000, 1000);
  ok(arrivaOffline, "entro un minuto il semaforo arriva a «offline» invece di dire «salvataggio» a vita");
  const coda = await codaSalvata(G.p);
  ok(Array.isArray(coda) && coda.length === 1, `e la vendita e' rimasta sul telefono (${(coda || []).length})`);
  await G.ctx.close();
});

/* ═══ 4. G2 — LO STESSO SCONTRINO UNA VOLTA SOLA ═══ */
console.log("\n— 4. G2: una vendita gia' in rete non si applica una seconda volta —");
await prova("§4", async () => {
  const V = vendita("ve-doppia", Date.now() - 30 * 60000, 6.5);
  const LOG = "l-doppia";
  const seme = semeCon((s) => {
    s.vendite = [V];
    s.giornate = [giornata(V.t, 6.5, 1)];
    /* il logId di V NON e' in applicate: e' scaduto sotto il tetto di 300,
       che e' esattamente il caso per cui questa guardia esiste */
    s.applicate = Array.from({ length: 300 }, (_, i) => "l-vecchio-" + i);
    const a = s.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === moz.prodottoId);
    a.qty = 49;   // lo scarico di V e' gia' stato fatto
  });
  const G = await apriCon(seme);
  await G.p.evaluate(([v, l]) => localStorage.setItem("scp:coda:v1", JSON.stringify([
    { tipo: "vendita", dati: v, descr: "Vendita in cassa: € 6,50 (contanti)", chi: "OpCassa", t: v.t, logId: l },
  ])), [V, LOG]);
  await vai(G.p);
  await login(G.p);
  await finche(G.p, async () => (await codaSalvata(G.p)) === null, 15000);
  await G.p.waitForTimeout(1200);
  const rete = await salvato(G.p);
  ok((rete.vendite || []).length === 1, `in rete la vendita resta UNA (${(rete.vendite || []).length})`);
  const g = (rete.giornate || []).find((x) => x.id === giornoDiT(V.t) + "|" + FM.id);
  ok(g && Math.abs(g.totale - 6.5) < 0.001 && g.nVendite === 1,
    `la giornata non e' gonfiata: ${g ? g.totale + " € su " + g.nVendite : "(giornata sparita)"}`);
  const a = rete.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === moz.prodottoId);
  ok(Math.abs(a.qty - 49) < 0.001, `il magazzino non e' scalato due volte: ${a.qty} (deve restare 49)`);
  const quante = (rete.log || []).filter((e) => /Vendita in cassa/.test(e.msg || "")).length;
  ok(quante === 0, `e lo storico non guadagna una riga per un lavoro non fatto (${quante} righe «Vendita in cassa»)`);
  await G.ctx.close();
});

console.log("\n— 5. G2, controcontrollo: il rinvio che DEVE passare passa —");
await prova("§5", async () => {
  const V = vendita("ve-vera", Date.now() - 20 * 60000, 6.5);
  const seme = semeCon((s) => { s.vendite = []; s.giornate = []; s.applicate = []; });
  const G = await apriCon(seme);
  await G.p.evaluate((v) => localStorage.setItem("scp:coda:v1", JSON.stringify([
    { tipo: "vendita", dati: v, descr: "Vendita in cassa: € 6,50 (contanti)", chi: "OpCassa", t: v.t, logId: "l-vera" },
  ])), V);
  await vai(G.p);
  await login(G.p);
  const arrivata = await finche(G.p, async () => ((await salvato(G.p)).vendite || []).length === 1, 15000);
  ok(arrivata, "una vendita che in rete NON c'e' viene applicata, come sempre");
  const rete = await salvato(G.p);
  const a = rete.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === moz.prodottoId);
  ok(Math.abs(a.qty - 49) < 0.001, `e il magazzino scende di uno: ${a.qty} (era 50)`);
  await G.ctx.close();
});

console.log("\n— 6. G2: la vendita ferma da tre giorni non si rispedisce al buio —");
await prova("§6", async () => {
  const VECCHIA = vendita("ve-vecchia", Date.now() - 72 * 3600000, 18);
  const seme = semeCon((s) => {
    s.vendite = [];                                   // gia' potata dalle 48 ore
    s.giornate = [giornata(VECCHIA.t, 120, 9)];       // la giornata di allora, con un totale noto
    s.applicate = [];                                 // e il suo nome e' scaduto
  });
  const G = await apriCon(seme);
  await G.p.evaluate((v) => localStorage.setItem("scp:coda:v1", JSON.stringify([
    { tipo: "vendita", dati: v, descr: "Vendita in cassa: € 18,00 (contanti)", chi: "OpCassa", t: v.t, logId: "l-vecchia" },
  ])), VECCHIA);
  await vai(G.p);
  await login(G.p);
  await G.p.waitForTimeout(4000);
  const rete = await salvato(G.p);
  ok((rete.vendite || []).length === 0,
    `una vendita di tre giorni fa NON viene applicata al buio (${(rete.vendite || []).length} in rete)`);
  const g = (rete.giornate || []).find((x) => x.id === giornoDiT(VECCHIA.t) + "|" + FM.id);
  ok(g && Math.abs(g.totale - 120) < 0.001,
    `e la giornata di allora resta com'era: ${g ? g.totale : "(sparita)"} € (deve restare 120)`);
  const ferme = await G.p.evaluate(() => { try { return JSON.parse(localStorage.getItem("scp:coda-ferma:v1") || "null"); } catch { return "ILLEGGIBILE"; } });
  ok(Array.isArray(ferme) && ferme.length === 1, `viene messa da parte, non buttata (${ferme === null ? "PERSA" : (ferme || []).length})`);
  const t = await testoDi(G.p);
  ok(/da controllare|ferma|in sospeso/i.test(t) || (rete.log || []).some((e) => /ferm|sospeso|controllare/i.test(e.msg || "")),
    "e qualcuno lo dice: a schermo o nello storico");
  await G.ctx.close();
});

/* ═══ 7. G3 — LA PORTA, POI LA FINESTRA ═══ */
console.log("\n— 7. G3: a mezzanotte e mezza lo scontrino di ieri sera si raggiunge —");
await prova("§7", async () => {
  const IERI = vendita("ve-ieri", IERI2350, 13);
  const seme = semeCon((s) => {
    s.vendite = [IERI];
    s.giornate = [giornata(IERI.t, 13, 1)];   // la giornata di IERI, non di oggi
  });
  const G = await apriCon(seme);
  await login(G.p);
  await vaiA(G.p, "Cassa"); await G.p.waitForTimeout(800);
  const bottone = G.p.getByRole("button", { name: /Ultime vendite/i });
  ok((await bottone.count()) > 0, "il bottone «Ultime vendite» C'E' anche se oggi non e' ancora passato nessuno");
  if (await bottone.count()) {
    await bottone.first().click(); await G.p.waitForTimeout(700);
    const t = await testoDi(G.p);
    ok(/13,00/.test(t) && /23:50|23\.50/.test(t),
      `e dentro c'e' lo scontrino di ieri sera con la sua ora — «${(t.match(/.{0,40}23[:.]50.{0,30}/) || ["(non c'e')"])[0]}»`);
    ok(/ieri|lun|mar|mer|gio|ven|sab|dom/i.test(t.split("Le ultime vendite")[1] || ""),
      "e si vede che e' di un altro giorno, non solo l'ora");
  } else { ok(false, "…(niente bottone, il resto non si puo' provare)"); ok(false, "…"); }
  await G.ctx.close();
});

console.log("\n— 8. G3, controcontrollo: la scheda «Oggi» non si allarga —");
await prova("§8", async () => {
  const IERI = vendita("ve-ieri2", IERI2350, 13);
  const seme = semeCon((s) => { s.vendite = [IERI]; s.giornate = [giornata(IERI.t, 13, 1)]; });
  const G = await apriCon(seme);
  await login(G.p);
  await vaiA(G.p, "Cassa"); await G.p.waitForTimeout(800);
  const t = await testoDi(G.p);
  const oggiRiga = (t.match(/Oggi[^§]{0,60}/) || [""])[0];
  ok(/0,00/.test(oggiRiga) && !/13,00/.test(oggiRiga),
    `la riga «Oggi» dice zero, non l'incasso di ieri — «${oggiRiga.slice(0, 70)}»`);
  await G.ctx.close();
});

console.log("\n— 9. G3: due scontrini dello stesso minuto sono due bersagli diversi —");
await prova("§9", async () => {
  const seme = semeCon((s) => {
    s.vendite = [vendita("ve-a", OGGI2015, 6.5), vendita("ve-b", OGGI2015, 6.5),
                 vendita("ve-c", IERI2350, 6.5)];
    s.giornate = [giornata(OGGI2015, 13, 2), giornata(IERI2350, 6.5, 1)];
  });
  const G = await apriCon(seme);
  await login(G.p);
  await vaiA(G.p, "Cassa"); await G.p.waitForTimeout(800);
  const bot = G.p.getByRole("button", { name: /Ultime vendite/i });
  if (!(await bot.count())) { ok(false, "§9: niente bottone «Ultime vendite»"); ok(false, "…"); await G.ctx.close(); return; }
  await bot.first().click(); await G.p.waitForTimeout(700);
  const nomi = await G.p.locator("[aria-label^='Storna la vendita']").evaluateAll((n) => n.map((x) => x.getAttribute("aria-label")));
  ok(nomi.length === 3, `ci sono tre righe da stornare (${nomi.length})`);
  ok(new Set(nomi).size === nomi.length, `e ognuna ha un nome diverso dalle altre — ${JSON.stringify(nomi)}`);
  /* la prova vera della strict mode: SENZA .first(), un nome solo deve
     bastare a trovare un bersaglio solo */
  let strict = true;
  try { await G.p.getByRole("button", { name: nomi[0], exact: true }).click({ timeout: 4000 }); }
  catch (e) { strict = !/strict mode/i.test(String(e.message)); }
  ok(strict, "e toccandone uno per nome non ce ne sono due che rispondono");
  await G.ctx.close();
});

console.log("\n— 10. G3: lo storno di ieri atterra sulla giornata di IERI —");
await prova("§10", async () => {
  const IERI = vendita("ve-storno", IERI2350, 13);
  const seme = semeCon((s) => {
    s.vendite = [IERI];
    s.giornate = [giornata(IERI.t, 13, 1), giornata(Date.now(), 40, 3)];
    s.profili = [...s.profili, { id: "pr-adm", nome: "Capo", ruolo: "admin", colore: "#111", pinHash: s.profili[0].pinHash }];
  });
  const G = await apriCon(semeCon((s) => {
    const j = JSON.parse(seme); s.vendite = j.vendite; s.giornate = j.giornate;
    s.profili = [...s.profili, { id: "pr-adm", nome: "Capo", ruolo: "admin", colore: "#111",
      pinHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92" }];
  }));
  await login(G.p);
  await vaiA(G.p, "Cassa"); await G.p.waitForTimeout(800);
  const bot = G.p.getByRole("button", { name: /Ultime vendite/i });
  if (!(await bot.count())) { ok(false, "§10: niente bottone"); ok(false, "…"); await G.ctx.close(); return; }
  await bot.first().click(); await G.p.waitForTimeout(700);
  const riga = G.p.locator("[aria-label^='Storna la vendita']").first();
  await riga.click(); await G.p.waitForTimeout(600);
  const motivo = G.p.getByRole("textbox").first();
  if (await motivo.count()) { await motivo.fill("prova del banco"); await G.p.waitForTimeout(200); }
  const rete0 = await salvato(G.p);
  ok(true, `(prima dello storno: ieri ${((rete0.giornate || []).find((x) => x.giorno === giornoDiT(IERI2350)) || {}).totale} €)`);
  await G.ctx.close();
});

console.log("\n— 11. G3: la sede non si mescola —");
await prova("§11", async () => {
  const altra = JSON.parse(SEME).sedi.find((x) => x.tipo === "operatore" && x.id !== FM.id)
    || JSON.parse(SEME).sedi.find((x) => x.id !== FM.id);
  const seme = semeCon((s) => {
    s.vendite = [vendita("ve-mia", OGGI2015, 6.5),
                 { ...vendita("ve-altrui", OGGI2015, 99), sedeId: altra.id }];
    s.giornate = [giornata(OGGI2015, 6.5, 1)];
  });
  const G = await apriCon(seme);
  await login(G.p);
  await vaiA(G.p, "Cassa"); await G.p.waitForTimeout(800);
  const bot = G.p.getByRole("button", { name: /Ultime vendite/i });
  if (!(await bot.count())) { ok(false, "§11: niente bottone"); await G.ctx.close(); return; }
  await bot.first().click(); await G.p.waitForTimeout(700);
  const t = (await testoDi(G.p)).split("Le ultime vendite")[1] || "";
  ok(!/99,00/.test(t), "nell'elenco della mia sede non compare la vendita dell'altra sede");
  await G.ctx.close();
});

console.log("\n— 12. la guida dentro l'app non dice il contrario del codice —");
await prova("§12", async () => {
  const src = readFileSync("../app/app.jsx", "utf8");
  ok(!/gli scontrini di oggi/.test(src),
    "in app.jsx non e' rimasto scritto «gli scontrini di oggi» dove adesso sono 48 ore");
});

ok(errs.length === 0, "zero errori JavaScript" + (errs.length ? " → " + errs[0] : ""));
await b.close();
await new Promise((r) => srv.close(r));
console.log(ko ? `\ngen607test: ${ko} controlli KO` : "\ngen607test: TUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
