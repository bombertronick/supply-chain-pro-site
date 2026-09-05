/* gen-6.06: il ritrovamento della coda arriva DAVVERO, anche col login sicuro.

   IL DIFETTO, e come l'ho trovato. gen-6.05 doveva fare due cose: SCRIVERE la
   coda sul telefono e RITROVARLA alla riaccensione. La prima funziona in
   produzione. La seconda no, e non me n'ero accorto.
   L'app si avvia in due modi (app.jsx, l'effetto di montaggio):
     · MODO CLASSICO — niente window.auth: si legge la rete e si va;
     · MODO SICURO — window.auth c'e': prima del login si mostra SOLO l'elenco
       dei nomi, e lo stato vero si carica dentro entra(), dopo il login.
   Il ritrovamento l'ho scritto DOPO il bivio, cioe' solo nel ramo classico;
   il ramo sicuro fa «return» prima di arrivarci, ed entra() legge la rete ma
   non rilegge scp:coda:v1 e non rigioca la coda.
   LA PRODUZIONE GIRA IN MODO SICURO: verificato sul database, esistono
   app_login / app_sess_valida / app_bootstrap e app_sessione ha 327 righe
   (107 negli ultimi sette giorni). Quindi in produzione la coda si scrive e
   non si rilegge: il difetto che avevo annunciato chiuso e' chiuso a meta'.

   PERCHE' IL BANCO NON L'HA VISTO, che e' la parte che conta. gen605test
   costruisce una rete finta SENZA window.auth: trentadue controlli verdi sul
   ramo che la produzione non usa. Un banco che non riproduce la strada vera
   non prova niente, e i verdi danno fiducia — che e' peggio del silenzio.
   Questo file esiste per chiudere QUEL buco, non solo per riparare il codice:
   e' il primo collaudo dell'app che finge il login sicuro. Il finto server
   e' modellato su pin537test (stessa forma di window.auth) piu' la regola
   che in produzione e' vera e cambia tutto: SENZA TOKEN LA CHIAVE NON SI
   LEGGE E NON SI SCRIVE (le RPC app_kv_* vogliono p_token).

   IL CONTRATTO (i nomi si fissano qui, il codice si adegua):
   · il ritrovamento sta PRIMA del bivio fra i due modi: non dipende dalla
     rete, quindi non ha ragione di stare dentro un ramo;
   · al montaggio in modo sicuro si ripesca la coda e si accende la spia, ma
     NON si tenta di scrivere: senza token la scrittura non puo' riuscire, e
     tre tentativi falliti manderebbero l'app in «offline» sulla schermata
     dei nomi, prima ancora che qualcuno abbia sbagliato qualcosa;
   · entra() rigioca la coda sullo stato appena letto e fa partire l'invio.

   SCRITTO PRIMA DELLA RIPARAZIONE. Contro gen-6.05 devono essere ROSSI il
   §2 (la vendita non torna), il §3 (la spia tace) e il §5 (non riparte da
   sola). Contro-controlli VERDI anche su gen-6.05: §1 (siamo sulla strada
   giusta), §4 (non si va offline prima del login), §7 (il mestiere fermo). */
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
const apri = async () => {
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
  }, [SEME]);
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

/* ═══ 1. LA STRADA VERA: siamo davvero sul ramo del login sicuro ═══ */
console.log("\n— 1. il banco prova la strada che la produzione usa davvero —");
const Z = await apri();
const A = { p: Z.p, ctx: Z.ctx };
await prova("§1", async () => {
  await vai(A.p);
  const c0 = await conta(A.p);
  ok((c0.loginList || 0) >= 1, `prima del login l'app chiede l'elenco dei nomi al server (loginList ×${c0.loginList || 0}): è il ramo sicuro`);
  const pre = await testoDi(A.p);
  ok(/OpCassa/.test(pre), "e il nome si vede");
  ok(!/Margherita/.test(pre), "ma i dati no: prima del login lo stato vero non è stato caricato");
  ok(!(await A.p.evaluate(() => window.__haToken())), "e non c'è ancora nessun token");
  await login(A.p);
  const c1 = await conta(A.p);
  ok((c1.login || 0) >= 1, `il PIN è stato verificato dal server (login ×${c1.login || 0}), non in locale`);
  ok(await A.p.evaluate(() => window.__haToken()), "adesso il token c'è: la sessione è nata sul server");
  await vaiA(A.p, "Cassa"); await A.p.waitForTimeout(700);
  ok(/Margherita/.test(await testoDi(A.p)), "e in Cassa il listino si vede: lo stato è arrivato dentro entra()");
});

/* ═══ 2. IL MOMENTO DELLA VERITÀ: rete morta, ricarico, la vendita deve tornare ═══ */
console.log("\n— 2. rete morta, pagina ricaricata: la vendita è ancora lì —");
await prova("§2", async () => {
  await A.p.evaluate(() => window.__uccidiRete(true));
  await battiEIncassa(A.p);
  /* si aspetta che la coda sia SCRITTA su disco, non un tempo a caso */
  await finche(A.p, async () => (await codaSalvata(A.p) || []).length === 1);
  const coda = await codaSalvata(A.p);
  ok(Array.isArray(coda) && coda.length === 1,
    `la vendita è salvata sul telefono — ${Array.isArray(coda) ? coda.length : String(coda)} voce`);
  ok(Array.isArray(coda) && coda[0] && coda[0].tipo === "vendita" && coda[0].logId,
    "ed è un DATO col suo logId, rigiocabile");
  const st0 = await salvato(A.p);
  ok(!(st0.vendite || []).length, "in rete non è arrivata (la rete è morta): è il caso che conta");

  /* il telefono si ricarica: blocco, batteria, iOS che sospende la scheda */
  await riapri(A);
  const dopoRicarica = await codaSalvata(A.p);
  ok(Array.isArray(dopoRicarica) && dopoRicarica.length === 1,
    `dopo il ricaricamento la voce è ancora sul disco — ${JSON.stringify(dopoRicarica) === "null" ? "SPARITA · chi l'ha toccata: " + (await diario(A.p) || "(nessuno: allora non è mai stata scritta su QUESTO contesto)") : (Array.isArray(dopoRicarica) ? dopoRicarica.length + " voce" : String(dopoRicarica))}`);
  await login(A.p);
  await vaiA(A.p, "Cassa"); await A.p.waitForTimeout(900);
  const t = await testoDi(A.p);
  /* L'OSSERVABILE DEVE ESSERE SUO. Qui prima guardavo «6,50», che e' anche il
     PREZZO stampato sulla cella del listino: era verde comunque, cioe' un
     verde falso proprio nel controllo piu' importante del file. «1 vendite»
     lo scrive solo la scheda «Oggi», e solo se la giornata esiste. */
  ok(/1 vendite/.test(t),
    `e la vendita è di nuovo nel conto della giornata: il cassiere la vede e non la ribatte — «${(t.match(/Oggi.{0,40}/) || ["(nessuna scheda Oggi)"])[0]}»`);
  ok(/da salvare/.test(t), "e la spia dice che è ancora da mandare");
});

/* ═══ 3. LA SPIA PARLA ANCHE PRIMA DEL LOGIN ═══ */
console.log("\n— 3. chi riprende in mano il telefono lo sa subito —");
await prova("§3", async () => {
  await riapri(A);
  const pre = await testoDi(A.p);
  ok(/1 vendita da salvare/.test(pre),
    `sulla schermata dei nomi c'è scritto quante ne aspettano — «${(pre.match(/.{0,4}\d+ vendit\w+ da salvare.{0,30}/) || ["(niente)"])[0]}»`);
  ok((await A.p.locator("[data-da-salvare]").count()) === 1, "ed è un cartello suo, non una parola persa nel testo");
  ok(/partono da sole/.test(pre), "e dice anche cosa succederà, non solo che c'è un problema");
});

/* ═══ 4. CONTRO-CONTROLLO: prima del login NON si va offline ═══ */
console.log("\n— 4. ma non si mette a bussare a una porta che non può aprire —");
await prova("§4", async () => {
  await A.p.evaluate(() => window.__uccidiRete(false));   // la rete torna VIVA
  await riapri(A);
  await A.p.waitForTimeout(3200);                          // il tempo di tre tentativi
  const c = await conta(A.p);
  ok(!(c["set-senza-token"] > 0),
    `prima del login non ha provato NESSUNA scrittura (senza token non potrebbe riuscire) — tentativi: ${c["set-senza-token"] || 0}`);
  const pre = await testoDi(A.p);
  ok(!/Connessione instabile|offline|Riconnessione/i.test(pre),
    "e non dice «offline» sulla schermata dei nomi, dove nessuno ha ancora sbagliato niente");
  ok(/1 vendita da salvare/.test(pre), "la spia però continua a dire che c'è una vendita in attesa");
});

/* ═══ 5. AL LOGIN LA CODA PARTE DA SOLA, E ARRIVA UNA VOLTA SOLA ═══ */
console.log("\n— 5. si entra, e quello che era rimasto parte —");
await prova("§5", async () => {
  await login(A.p);
  /* si aspetta che la coda sia PARTITA, non un tempo a caso */
  const partita = await finche(A.p, async () => {
    const c = await codaSalvata(A.p); return c == null || (Array.isArray(c) && c.length === 0);
  });
  ok(partita, "entrando, la coda parte da sola (senza che nessuno la solleciti)");
  /* la scheda «Oggi» vive in Cassa: leggerla dalla Home diceva sempre
     «nessuna scheda Oggi», che e' un rosso mio, non dell'app */
  await vaiA(A.p, "Cassa"); await A.p.waitForTimeout(800);
  const st = await salvato(A.p);
  const ven = (st.vendite || []).filter((v) => v.stato === "registrata");
  ok(ven.length === 1, `la vendita è arrivata in rete UNA volta sola — ${ven.length}`);
  ok(ven[0] && Math.abs(ven[0].totale - 6.5) < 1e-9, `col suo totale (${ven[0] && ven[0].totale})`);
  const art = (st.magazzini.find((m) => m.id === linea.id).articoli || []).find((a) => a.prodottoId === moz.prodottoId);
  ok(art && Math.abs(art.qty - 49) < 1e-9, `e il magazzino è sceso di UNO: la mozzarella è a ${art && art.qty} (era 50)`);
  const coda = await codaSalvata(A.p);
  ok(coda == null || (Array.isArray(coda) && coda.length === 0), `e la coda si è svuotata — ${JSON.stringify(coda)}`);
  const t5 = await testoDi(A.p);
  ok(!/da salvare/.test(t5), "la spia in ambra si spegne");
  ok(/1 vendite/.test(t5), `e la giornata resta di una vendita sola — «${(t5.match(/Oggi.{0,40}/) || ["(nessuna scheda Oggi)"])[0]}»`);
});
await A.ctx.close();

/* ═══ 6. NIENTE DOPPIONI: la scrittura arriva, la risposta si perde ═══ */
console.log("\n— 6. la rete bugiarda: ha scritto ma non l'ha detto —");
const B = await apri();
await prova("§6", async () => {
  await vai(B.p); await login(B.p);
  await vaiA(B.p, "Cassa"); await B.p.waitForTimeout(700);
  await B.p.evaluate(() => window.__scriviUnaSola(true));
  await battiEIncassa(B.p);
  /* la scrittura ARRIVA (e la risposta si perde): si aspetta che sia arrivata */
  await finche(B.p, async () => ((await salvato(B.p)).vendite || []).length === 1);
  /* poi che il client se ne accorga da solo e svuoti la coda */
  await finche(B.p, async () => { const c = await codaSalvata(B.p); return c == null || (Array.isArray(c) && c.length === 0); });
  const st0 = await salvato(B.p);
  ok((st0.vendite || []).length === 1, `la vendita è ARRIVATA in rete (${(st0.vendite || []).length}) benché il client non lo sappia`);
  /* QUI HO PRETESO IL CONTRARIO DI QUELLO CHE E' GIUSTO. Volevo la coda
     ancora piena, e invece gen-6.05 fa la cosa buona: al giro dopo rilegge la
     rete, vede che le sue modifiche ci sono gia' (nuoveInCoda == 0) e svuota
     la coda SENZA riscrivere. Il caso «ha scritto e non l'ha detto» si chiude
     da solo. Quello che va provato non e' che la coda resti, e' che il conto
     NON raddoppi — sotto. */
  const coda = await codaSalvata(B.p);
  ok(coda == null || (Array.isArray(coda) && coda.length === 0),
    `il client si accorge da solo che la scrittura era arrivata e svuota la coda senza riscrivere — ${JSON.stringify(coda)}`);

  const stPrima = await salvato(B.p);
  console.log(`      ·· prima del ricaricamento: rev ${stPrima.rev}, vendite ${(stPrima.vendite || []).length}`);
  await riapri(B);
  await B.p.evaluate(() => window.__scriviUnaSola(false));   // la rete torna sana
  const stDopoRic = await salvato(B.p);
  console.log(`      ·· dopo il ricaricamento, prima del login: rev ${stDopoRic.rev}, vendite ${(stDopoRic.vendite || []).length}`);
  await login(B.p);
  await vaiA(B.p, "Cassa"); await B.p.waitForTimeout(900);
  const st = await salvato(B.p);
  console.log(`      ·· dopo il login: rev ${st.rev}, vendite ${(st.vendite || []).length}, coda ${JSON.stringify(await codaSalvata(B.p))}`);
  const ven = (st.vendite || []).filter((v) => v.stato === "registrata");
  ok(ven.length === 1, `dopo il ricaricamento la vendita resta UNA — ${ven.length}`);
  const art = (st.magazzini.find((m) => m.id === linea.id).articoli || []).find((a) => a.prodottoId === moz.prodottoId);
  ok(art && Math.abs(art.qty - 49) < 1e-9, `e il magazzino è sceso di UNO, non di due: ${art && art.qty} (era 50)`);
  const t = await testoDi(B.p);
  ok(/1 vendite/.test(t) && !/2 vendite/.test(t),
    `e la giornata conta UNA vendita, non due — «${(t.match(/Oggi.{0,40}/) || ["(nessuna scheda Oggi)"])[0]}»`);
});
await B.ctx.close();

/* ═══ 7. CONTRO-CONTROLLO: senza niente da salvare, tutto come prima ═══ */
console.log("\n— 7. col servizio normale non cambia una virgola —");
const C = await apri();
await prova("§7", async () => {
  await vai(C.p); await login(C.p);
  await vaiA(C.p, "Cassa"); await C.p.waitForTimeout(700);
  await battiEIncassa(C.p);
  await finche(C.p, async () => ((await salvato(C.p)).vendite || []).length === 1);
  ok(!/da salvare/.test(await testoDi(C.p)), "con la rete buona la spia non compare mai");
  const coda = await codaSalvata(C.p);
  ok(coda == null || (Array.isArray(coda) && coda.length === 0), `e sul telefono non resta niente — ${JSON.stringify(coda)}`);
  await riapri(C); await login(C.p);
  await vaiA(C.p, "Cassa"); await C.p.waitForTimeout(900);
  const st = await salvato(C.p);
  ok((st.vendite || []).filter((v) => v.stato === "registrata").length === 1,
    "e dopo un ricaricamento pulito la vendita resta una sola");
  ok(!/da salvare/.test(await testoDi(C.p)), "e niente spia: il ritrovamento a vuoto non inventa lavoro");
});
await C.ctx.close();

/* ═══ 8. IL LOGIN RIESCE MA I DATI NO: non si rigioca sul niente ═══
   Questa sezione esiste perche' un sabotaggio e' rimasto MUTO: togliendo la
   guardia «solo se la lettura e' riuscita» nessun controllo se ne accorgeva.
   Non era ridondanza, era un buco del banco — e il caso che copre e' il
   peggiore di tutti: se si rigiocasse la vendita sul guscio dei soli nomi,
   la vista sarebbe falsa E la scrittura che parte porterebbe in rete uno
   stato senza magazzini, cancellando tutto a tutti. */
console.log("\n— 8. il server dice sì al PIN ma non consegna i dati —");
const D = await apri();
await prova("§8", async () => {
  await vai(D.p); await login(D.p);
  await vaiA(D.p, "Cassa"); await D.p.waitForTimeout(700);
  await D.p.evaluate(() => window.__uccidiRete(true));
  await battiEIncassa(D.p);
  await finche(D.p, async () => (await codaSalvata(D.p) || []).length === 1);
  const prima = await salvato(D.p);
  const magPrima = (prima.magazzini || []).length;
  ok(magPrima > 0, `in rete ci sono ${magPrima} magazzini, e devono restarci`);

  /* si riparte, e stavolta il PIN passa ma i dati non arrivano */
  await riapri(D);
  await D.p.evaluate(() => { window.__uccidiRete(false); window.__perdiLettura(true); });
  await login(D.p);
  await D.p.waitForTimeout(3500);
  const t = await testoDi(D.p);
  ok(!/1 vendite/.test(t),
    `non si inventa una giornata su uno stato che non ha letto — «${(t.match(/Oggi.{0,40}/) || ["(nessuna scheda Oggi)"])[0]}»`);
  const dopo = await salvato(D.p);
  ok((dopo.magazzini || []).length === magPrima,
    `e in rete i magazzini sono ancora ${(dopo.magazzini || []).length} (erano ${magPrima}): non ha scritto un guscio sopra i dati veri`);
  ok(((dopo.vendite || []).length) === ((prima.vendite || []).length),
    "e non ha scritto la vendita su uno stato costruito sul niente");
  const coda = await codaSalvata(D.p);
  ok(Array.isArray(coda) && coda.length === 1, `la vendita resta in coda, non si perde — ${JSON.stringify(coda) === "null" ? "SPARITA" : (coda || []).length}`);
  ok(/1 vendita da salvare/.test(t) || /da salvare/.test(t), "e la spia continua a dirlo");
});
await D.ctx.close();

ok(errs.length === 0, "zero errori JavaScript" + (errs.length ? " → " + errs[0] : ""));
await b.close();
await new Promise((r) => srv.close(r));
console.log(ko ? `\ngen606test: ${ko} controlli KO` : "\ngen606test: TUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
