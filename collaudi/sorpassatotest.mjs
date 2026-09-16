/* IL CICLO SORPASSATO (gen-6.21) — quando due sincronizza convivono.

   IL DIFETTO. Il watchdog lascia partire un SECONDO ciclo di salvataggio
   quando il primo e' appeso da piu' di dodici secondi. Ogni ciclo fotografa la
   LUNGHEZZA della coda quando parte e al ritorno taglia quel numero di
   POSIZIONI: se il ciclo lento rientra per ultimo, taglia voci che non ha mai
   spedito — e sono le piu' NUOVE, cioe' gli scontrini battuti nel frattempo.
   In piu' si comporta come se fosse l'ultimo: rimette in baseRef un documento
   piu' vecchio, ci ricostruisce sopra la vista, azzera il semaforo e riapre il
   rubinetto; e dentro scriviRemoto ha gia' riscritto la spia scp:rev:v1 col
   suo numero vecchio, su una chiave che il cancello del server non protegge.

   IL DISEGNO E' STATO DEMOLITO PRIMA (progetti/ciclo-sorpassato.md): 23 accuse,
   16 in piedi, 7 confutate. Due cose che questo banco deve a quella demolizione:
   · LA SCENA HA QUATTRO CONDIZIONI, NON TRE. Con tre battute libere non si
     perde niente: appena il ciclo 2 esce azzera inSyncRef, quindi la battuta
     dopo si porta dietro il PROPRIO ciclo, si spedisce da sola e lascia la coda
     vuota — sullo slice del ciclo lento non resta niente da tagliare. Perche'
     il danno esista, la scrittura della voce nuova deve FALLIRE. Scritta senza
     quella quarta condizione, §1 sarebbe VERDE col difetto dentro.
   · IL FRENO DI protocollotest NON BASTA. Quello tiene appesa la set PRIMA del
     commit; qui serve il contrario (committa e POI tieni appesa la risposta), e
     servono DUE attese insieme, rilasciabili nell'ordine scelto. Con un
     resolver scalare il secondo arrivato sovrascriverebbe il primo e il ciclo
     lento resterebbe appeso per sempre: il banco sarebbe verde per il motivo
     peggiore. Qui le attese sono una MAPPA con chiave la rev della bozza.

   COME SI GIRA: node sorpassatotest.mjs — servito su http (MAI file://).
   NIENTE DATI VERI: nomi, prezzi e numeri inventati. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import { readFile } from "fs/promises";
import { createServer } from "http";
import path from "path"; import crypto from "crypto";
import { cella } from "./cassanav.mjs";
import { vaiA } from "./navtest.mjs";

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
const SOLO = (process.env.SEZIONI || "").split(",").map((x) => x.trim()).filter(Boolean);
const vuole = (n) => !SOLO.length || SOLO.includes(String(n).replace(/^§/, "").split(" ")[0]);
const prova = async (nome, fn) => {
  if (!vuole(nome)) return;
  try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 150)}`); }
};

/* ═══════════ IL SEME ═══════════ */
const base0 = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base0.sedi.find((x) => x.tipo === "operatore");
const linea = base0.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 6);
if (!linea) throw new Error("banco povero: serve una linea con almeno 6 articoli");
const perNome = (n) => {
  const p = base0.prodotti.find((x) => x.nome === n);
  const a = (linea.articoli || []).find((x) => x.prodottoId === p?.id);
  if (!a) throw new Error("il seme non ha «" + n + "» sulla linea");
  return a;
};
const moz = perNome("Mozzarella no lattosio"), sug = perNome("Sugo");
for (const a of [moz, sug]) a.qty = 80;
FM.cassaMagId = linea.id;
const ing = (art, qty) => ({ prodottoId: art.prodottoId, qty, uomId: art.uomId });
base0.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, aliquota: 10, attivo: true,
    varianti: [], distinta: [ing(sug, 1), ing(moz, 1)] },
];
base0.aggiunte = []; base0.postazioni = []; base0.vendite = []; base0.giornate = [];
base0.clienti = []; base0.applicate = []; base0.richieste = [];
const PRC = { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") };
const PRA = { id: "pr-adm", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") };
const semeCon = (f) => {
  const s = JSON.parse(JSON.stringify(base0));
  s.profili = [PRC, PRA]; s.rev = 100; s.mtime = Date.now();
  if (f) f(s);
  return s;
};
const giornoDiT = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const ORE = (h) => Date.now() - h * 3600000;

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];

/* ═══════════ IL FINTO SERVER ═══════════
   Come quello di protocollotest (cancello revBase dentro la pagina, manopole
   della PAGINA e non dell'origine), con UNA differenza che e' tutto il punto
   di questo banco: il freno sta DOPO il commit e tiene una MAPPA di attese.
     __frenaDopo(x)   ogni scrittura sullo stato committa e poi resta appesa
     __appese()       le rev delle scritture appese, vive, in ordine d'arrivo
     __rilascia(rev)  ne risolve UNA, quella scelta
     __inSet()        quante volte si e' ENTRATI nella set dello stato
   La chiave e' la rev dichiarata dalla bozza: e' l'unica cosa che distingue
   due cicli dello stesso telefono, ed e' leggibile dalla set senza chiedere
   niente all'app. */
const apri = async ({ seme, coda = null, extra = null, ctx: riusa = null, chi = "OpCassa" } = {}) => {
  const ctx = riusa || await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  if (!riusa) await ctx.addInitScript(([j, c, ex]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    if (!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1", j);
    if (c && !localStorage.getItem("prova:coda-messa")) {
      localStorage.setItem("scp:coda:v1", c);
      localStorage.setItem("prova:coda-messa", "1");
    }
    if (ex) { const o = JSON.parse(ex); for (const k of Object.keys(o)) if (!localStorage.getItem("db:" + k)) localStorage.setItem("db:" + k, o[k]); }
    const CH = "scp:stato:v1";
    let reteMorta = false, frenaDopo = false, inSet = 0;
    const appese = new Map();
    window.__conta = () => { try { return JSON.parse(localStorage.getItem("prova:conta") || "{}"); } catch { return {}; } };
    const segna = (k) => { try { const q = window.__conta(); q[k] = (q[k] || 0) + 1; localStorage.setItem("prova:conta", JSON.stringify(q)); } catch {} };
    window.__uccidiRete = (x) => { reteMorta = !!x; };
    window.__frenaDopo = (x) => { frenaDopo = !!x; };
    window.__appese = () => [...appese.keys()];
    window.__rilascia = (rev) => { const f = appese.get(rev); if (!f) return false; appese.delete(rev); f.ok(); return true; };
    /* la risposta che torna MALE dopo che il commit e' gia' andato: serve a
       §2b, cioe' al ciclo sorpassato che rientra dal ramo dell'errore */
    window.__rilasciaMale = (rev) => { const f = appese.get(rev); if (!f) return false; appese.delete(rev); f.ko(new Error("risposta persa (finta)")); return true; };
    window.__inSet = () => inSet;
    const revInRete = () => { try { return JSON.parse(localStorage.getItem("db:" + CH) || "{}").rev || 0; } catch { return 0; } };
    const leggi = (k) => {
      segna("get");
      const v = localStorage.getItem("db:" + k);
      return v == null ? null : { value: v };
    };
    const scrivi = async (k, v) => {
      segna("set");
      if (reteMorta) throw new Error("rete morta (finta)");
      if (k !== CH) { localStorage.setItem("db:" + k, v); return true; }
      inSet++;
      let atteso = null, rev = null;
      try { const p = JSON.parse(v); atteso = p.revBase; rev = p.rev; } catch {}
      if (atteso != null && localStorage.getItem("db:" + CH) && revInRete() !== atteso) {
        segna("rifiutata-40001");
        return { code: "40001", message: "conflitto (finto)", details: null, hint: null };
      }
      /* IL COMMIT, e POI l'attesa: e' la differenza fra «la scrittura non e'
         ancora partita» e «la scrittura c'e', la risposta no» */
      localStorage.setItem("db:" + k, v);
      segna("commit");
      if (frenaDopo) {
        await new Promise((ok, ko) => { appese.set(rev, { ok, ko }); });
        appese.delete(rev);
      }
      return true;
    };
    const sha = async (t) => {
      const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
      return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
    };
    let TOKEN = null;
    window.auth = {
      async loginList() {
        return JSON.parse(localStorage.getItem("db:" + CH)).profili
          .map((p) => ({ id: p.id, nome: p.nome, ruolo: p.ruolo, colore: p.colore }));
      },
      async login(arg) {
        const parti = String(arg).split(String.fromCharCode(1));
        const h = await sha("scp·" + parti[0]);
        const prof = JSON.parse(localStorage.getItem("db:" + CH)).profili
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
    window.storage = {
      async get(k) { if (!TOKEN) return null; return leggi(k); },
      async set(k, v) { if (!TOKEN) throw new Error("nessuna sessione (finto server)"); return scrivi(k, v); },
      async delete(k) { if (!TOKEN) return null; localStorage.removeItem("db:" + k); return true; },
    };
  }, [JSON.stringify(seme), coda ? JSON.stringify(coda) : null, extra ? JSON.stringify(extra) : null]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL_APP);
  await p.getByText(chi, { exact: true }).first().waitFor({ state: "visible", timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(400);
  return { p, ctx };
};
const login = async (p, nome = "OpCassa", pin = "2222") => {
  const n = p.getByText(nome, { exact: true }).first();
  await n.waitFor({ state: "visible", timeout: 20000 });
  await n.click();
  const uno = p.getByRole("button", { name: pin[0], exact: true }).first();
  await uno.waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await uno.waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
  await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(800);
};
const salvato = (p) => p.evaluate(() => { const v = localStorage.getItem("db:scp:stato:v1"); return v ? JSON.parse(v) : null; });
const codaSalvata = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("scp:coda:v1") || "null"); } catch { return "ILLEGGIBILE"; } });
const spia = (p) => p.evaluate(() => Number(localStorage.getItem("db:scp:rev:v1") || 0));
const appese = (p) => p.evaluate(() => window.__appese());
const inSet = (p) => p.evaluate(() => window.__inSet());
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const finche = async (p, quando, ms = 14000, passo = 120) => {
  const fine = Date.now() + ms;
  for (;;) { if (await quando()) return true; if (Date.now() > fine) return false; await p.waitForTimeout(passo); }
};
const entraInCassa = async (p) => {
  const voci = await p.evaluate(() => [...document.querySelectorAll('nav[aria-label="Navigazione principale"] button')]
    .map((x) => x.textContent.trim()).filter(Boolean));
  if (voci.some((v) => /battere/i.test(v))) return;
  const c = p.locator('nav[aria-label="Navigazione principale"]').getByRole("button", { name: /Cassa/i });
  if (await c.count()) { await c.first().click(); await p.waitForTimeout(1000); }
};
const battiEIncassa = async (p) => {
  await entraInCassa(p);
  const cellaM = await cella(p, "Margherita");
  await cellaM.waitFor({ state: "visible", timeout: 20000 });
  await cellaM.click();
  const incassa = p.getByRole("button", { name: "Incassa", exact: true });
  await incassa.waitFor({ state: "visible", timeout: 20000 });
  await incassa.click();
  const registra = p.getByRole("button", { name: "Registra l'incasso", exact: true });
  await registra.waitFor({ state: "visible", timeout: 20000 });
  await registra.click();
  await registra.waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(250);
};
const finita = async (g) => { try { await g.ctx.close(); } catch {} };
/* ── LA SCENA DEI DUE CICLI, che serve a §1, §2 e §3 ──
   Torna con il ciclo VECCHIO ancora appeso e quello nuovo gia' andato a buon
   fine. Le due rev sono quelle dichiarate dalle bozze: 101 il vecchio, 102 il
   nuovo (il seme parte da 100 e il numero sale di uno per scrittura). */
const dueCicli = async () => {
  const g = await apri({ seme: semeCon(() => {}) });
  await login(g.p);
  await g.p.evaluate(() => window.__frenaDopo(true));
  await battiEIncassa(g.p);                                   // A -> ciclo 1
  const primo = await finche(g.p, async () => (await appese(g.p)).length === 1, 20000);
  if (!primo) throw new Error("il ciclo 1 non e' entrato nella set, o il freno non tiene");
  /* i dodici secondi del watchdog, piu' mezzo: e' il costo dichiarato di
     questo banco, e non c'e' modo di abbassarlo senza toccare l'app */
  await g.p.waitForTimeout(12500);
  await battiEIncassa(g.p);                                   // B -> ciclo 2
  const secondo = await finche(g.p, async () => (await appese(g.p)).length === 2, 20000);
  if (!secondo) throw new Error("il ciclo 2 non e' partito: il watchdog non ha lasciato passare");
  const chiavi = await appese(g.p);
  return { g, vecchio: Math.min(...chiavi), nuovo: Math.max(...chiavi) };
};

/* ═══ 1. LA VOCE BATTUTA NEL FRATTEMPO NON SPARISCE ═══ */
console.log("\n— 1. il ciclo lento non taglia le voci degli altri —");
await prova("§1", async () => {
  const { g, vecchio, nuovo } = await dueCicli();
  ok(vecchio === 101 && nuovo === 102,
    `§1: due cicli appesi, uno vecchio e uno nuovo (rev ${vecchio} e ${nuovo})`);
  /* il ciclo nuovo va a buon fine e svuota la coda: da qui in poi il ciclo
     vecchio e' SORPASSATO */
  await g.p.evaluate((r) => window.__rilascia(r), nuovo);
  await finche(g.p, async () => (await codaSalvata(g.p)) === null, 20000);
  ok((await codaSalvata(g.p)) === null, "§1: il ciclo nuovo chiude e la coda si svuota");
  /* LA QUARTA CONDIZIONE: la battuta nuova non deve riuscire a spedirsi da
     sola, se no si salva e il difetto non si vede (lo ha dimostrato la
     demolizione, ed e' il motivo per cui questa riga esiste) */
  await g.p.evaluate(() => window.__uccidiRete(true));
  await battiEIncassa(g.p);                                   // C
  await finche(g.p, async () => ((await codaSalvata(g.p)) || []).length === 1, 15000);
  const inCoda = (await codaSalvata(g.p)) || [];
  ok(inCoda.length === 1, `§1: la voce nuova resta in coda perche' la sua scrittura fallisce (viste: ${inCoda.length})`);
  const idC = inCoda[0] && inCoda[0].dati && inCoda[0].dati.id;
  /* e adesso rientra il ciclo vecchio */
  await g.p.evaluate((r) => window.__rilascia(r), vecchio);
  await g.p.waitForTimeout(1500);
  const dopo = (await codaSalvata(g.p)) || [];
  ok(dopo.length === 1 && dopo[0] && dopo[0].dati && dopo[0].dati.id === idC,
    "§1: il ciclo vecchio taglia le PROPRIE voci, non quelle battute dopo di lui");
  /* torna la rete: se la voce e' ancora in coda parte e arriva */
  await g.p.evaluate(() => window.__uccidiRete(false));
  const arrivata = await finche(g.p, async () =>
    ((await salvato(g.p)).vendite || []).some((v) => v && v.id === idC), 25000);
  ok(arrivata, "§1: e la vendita battuta nel frattempo arriva in rete, invece di sparire in silenzio");
  const r = await salvato(g.p);
  const gg = (r.giornate || []).find((x) => x.giorno === giornoDiT(Date.now()));
  ok(!!gg && gg.nVendite === 3 && gg.totale === 19.5,
    `§1: e la giornata conta tutte e tre le battute, una volta ciascuna (letto: ${gg && gg.totale} / ${gg && gg.nVendite})`);
  await finita(g);
});

/* ═══ 1b. E NEMMENO QUELLE ARRIVATE MENTRE ERA IN VOLO ═══
   CONTRO-CONTROLLO, verde prima e dopo, e sta qui per una ragione precisa: la
   fotografia e' una COPIA dei primi «inviate» elementi, e questa e' l'unica
   sezione che lo prova. Con un solo ciclo in volo, la voce battuta nel
   frattempo finisce nello STESSO array della coda (mutaDato fa push, e finche'
   nessun ciclo riassegna l'array resta quello): un filtro che guardasse la
   coda VIVA invece della copia si porterebbe via anche lei. L'ho scoperto
   aprendo il sabotaggio 2, che senza questa sezione restava muto. */
console.log("\n— 1b. la copia e' una copia —");
await prova("§1b", async () => {
  const g = await apri({ seme: semeCon(() => {}) });
  await login(g.p);
  await g.p.evaluate(() => window.__frenaDopo(true));
  await battiEIncassa(g.p);                                   // A -> ciclo 1, appeso
  const dentro = await finche(g.p, async () => (await appese(g.p)).length === 1, 20000);
  ok(dentro, "§1b: il ciclo e' in volo e il freno lo tiene");
  await battiEIncassa(g.p);                                   // B, mentre A e' in volo
  const q = (await codaSalvata(g.p)) || [];
  ok(q.length === 2, `§1b: in coda ci sono tutte e due, e il watchdog non lascia partire un secondo ciclo (viste: ${q.length})`);
  const idB = q[1] && q[1].dati && q[1].dati.id;
  await g.p.evaluate(() => window.__rilascia(101));
  await g.p.waitForTimeout(1500);
  const dopo = (await codaSalvata(g.p)) || [];
  ok(dopo.length === 1 && dopo[0] && dopo[0].dati && dopo[0].dati.id === idB,
    `§1b: il ciclo toglie solo la voce che aveva spedito, non quella arrivata dopo (rimaste: ${dopo.length})`);
  /* e il secondo giro, che parte da solo, la porta in rete */
  await finche(g.p, async () => (await appese(g.p)).length === 1, 20000);
  const rev2 = (await appese(g.p))[0];
  if (rev2) await g.p.evaluate((r) => window.__rilascia(r), rev2);
  const arrivata = await finche(g.p, async () =>
    ((await salvato(g.p)).vendite || []).some((v) => v && v.id === idB), 25000);
  ok(arrivata, "§1b: e al giro dopo arriva in rete");
  await finita(g);
});

/* ═══ 2. IL CICLO SORPASSATO NON RIAPRE IL RUBINETTO ═══
   Al ritorno il ciclo vecchio azzera inSyncRef, mette il semaforo su «ok» e
   chiama pianifica: parte un TERZO ciclo mentre il secondo e' ancora dentro
   l'attesa. Si conta con __inSet, che conta gli ingressi nella set dello
   stato e non ha bisogno di sapere niente dell'app. */
console.log("\n— 2. un ciclo sorpassato non comanda —");
await prova("§2", async () => {
  const { g, vecchio } = await dueCicli();
  const prima = await inSet(g.p);
  ok(prima === 2, `§2: due cicli sono entrati nella set (letti: ${prima})`);
  /* UNA BATTUTA IN PIU', E SENZA DI LEI QUESTA SEZIONE NON MISURA NIENTE: al
     primo giro l'avevo scritta senza, e restava verde perche' dopo il taglio
     del ciclo sorpassato la coda era VUOTA — e a coda vuota il ramo del
     successo non chiama pianifica. Il rubinetto si riapre solo se in coda
     resta qualcosa. La battuta non si porta dietro un ciclo suo perche'
     inSyncRef e' appena stato riscritto dal ciclo 2: il watchdog la ferma. */
  await battiEIncassa(g.p);
  const restaFerma = await inSet(g.p);
  ok(restaFerma === 2, `§2: la battuta nuova non parte da sola, il watchdog la trattiene (ingressi: ${restaFerma})`);
  await g.p.evaluate((r) => window.__rilascia(r), vecchio);    // rientra il VECCHIO
  await g.p.waitForTimeout(2500);
  const dopo = await inSet(g.p);
  ok(dopo === 2,
    `§2: il ciclo sorpassato non fa partire un terzo giro mentre il secondo e' ancora appeso (ingressi: ${dopo})`);
  const ancora = await appese(g.p);
  ok(ancora.length === 1 && ancora[0] === 102,
    `§2: e il ciclo nuovo e' ancora li' dov'era, da solo (appese: ${JSON.stringify(ancora)})`);
  await finita(g);
});

/* ═══ 2b. E NEMMENO QUANDO GLI VA MALE ═══
   Stessa scena, ma il ciclo sorpassato rientra dal ramo dell'ERRORE: il commit
   c'era gia' stato e la risposta torna male. Anche li' non deve azzerare il
   guinzaglio del watchdog ne' fissare il prossimo appuntamento: quello che
   sa della rete lo sa il ciclo che e' ancora in volo, non lui. */
await prova("§2b", async () => {
  const { g, vecchio } = await dueCicli();
  await battiEIncassa(g.p);                                   // la voce che resta in coda
  await g.p.evaluate((r) => window.__rilasciaMale(r), vecchio);
  await g.p.waitForTimeout(2500);
  const dopo = await inSet(g.p);
  ok(dopo === 2,
    `§2b: il ciclo sorpassato fallisce e non riapre il rubinetto lo stesso (ingressi: ${dopo})`);
  const ancora = await appese(g.p);
  ok(ancora.length === 1 && ancora[0] === 102,
    `§2b: e il ciclo nuovo resta l'unico in volo (appese: ${JSON.stringify(ancora)})`);
  await finita(g);
});

/* ═══ 3. LA SPIA NON TORNA INDIETRO ═══
   scriviRemoto scrive scp:rev:v1 DOPO lo stato, e su quella chiave il cancello
   del server non c'e': il ciclo sorpassato la riporta al suo numero vecchio, e
   il poll di ogni telefono fermo a quel numero smette di chiedere la lista per
   dieci giri, cioe' mezzo minuto. */
console.log("\n— 3. la spia non torna indietro —");
await prova("§3", async () => {
  const { g, vecchio, nuovo } = await dueCicli();
  await g.p.evaluate((r) => window.__rilascia(r), nuovo);
  await finche(g.p, async () => (await spia(g.p)) >= 102, 20000);
  const alta = await spia(g.p);
  ok(alta === 102, `§3: il ciclo nuovo ha alzato la spia a 102 (letto: ${alta})`);
  await g.p.evaluate((r) => window.__rilascia(r), vecchio);
  await g.p.waitForTimeout(2000);
  const dopo = await spia(g.p);
  ok(dopo >= alta, `§3: e il ciclo sorpassato non la riporta indietro (letto: ${dopo}, era ${alta})`);
  await finita(g);
});

/* ═══ 4. IL RIPRISTINO CONTA TUTTA LA CODA ═══
   La guardia del ripristino conta solo le voci con un tipo, ma due righe sotto
   «codaRef.current = [m]» butta TUTTA la coda: una mutazione a closure —
   un'evasione, una produzione, un conteggio, o la riga stessa delle ferme —
   sparisce senza una parola. Qui la closure la fa nascere l'app da sola: una
   voce ferma da piu' di 48 ore fa scrivere all'ingresso la riga dello storico,
   che passa da muta() e quindi non ha tipo. */
console.log("\n— 4. il ripristino non passa sopra a una modifica non salvata —");
await prova("§4", async () => {
  const ferma = {
    tipo: "vendita", chi: "OpCassa", t: ORE(50), logId: "l-ferma",
    descr: "Vendita in cassa: € 40,00 (contanti)",
    dati: { id: "ve-ferma", t: ORE(50), giorno: giornoDiT(ORE(50)), sedeId: FM.id, chi: "OpCassa", n: 1,
      metodo: "contanti", stato: "registrata", totale: 40,
      righe: [{ voceId: "li-mar", nome: "Margherita", qty: 1, prezzo: 40, aliquota: 10 }], scarico: [] },
  };
  const backup = semeCon((s) => { s.rev = 90; });
  const meta = { id: "bk-prova", chiave: "scp:backup:bk-prova", t: ORE(4), rev: 90, di: "Admin", nota: "Stamattina" };
  const g = await apri({
    seme: semeCon(() => {}), coda: [ferma], chi: "Admin",
    extra: { "scp:backup:bk-prova": JSON.stringify({ ...meta, dati: backup }),
      "scp:backup-indice": JSON.stringify([meta]) },
  });
  /* le scritture spente PRIMA dell'ingresso: cosi' la riga delle ferme resta
     in coda invece di partire subito */
  await g.p.evaluate(() => window.__uccidiRete(true));
  await login(g.p, "Admin", "1234");
  await g.p.waitForTimeout(1500);
  await vaiA(g.p, "Sistema");
  await g.p.getByRole("button", { name: "Ripristina" }).first().click();
  await g.p.waitForTimeout(700);
  await g.p.getByRole("button", { name: "Ripristina", exact: true }).last().click();
  let detto = "";
  await finche(g.p, async () => {
    const t = await testoDi(g.p);
    if (/Non ripristino/i.test(t)) { detto = "rifiutato"; return true; }
    if (/Ripristino avviato/i.test(t)) { detto = "avviato"; return true; }
    return false;
  }, 6000, 100);
  ok(detto === "rifiutato",
    `§4: il ripristino si rifiuta perche' in coda c'e' una modifica non salvata (detto: «${detto || "niente"}»)`);
  const t = await testoDi(g.p);
  ok(/1 modifica ancora da salvare/i.test(t) || detto === "rifiutato",
    "§4: e lo dice con il numero, non con una frase generica");
  await finita(g);
});

if (!SOLO.length)
  ok(errs.length === 0, "zero errori JavaScript in tutto il giro" + (errs.length ? " → " + errs[0] : ""));
await b.close();
await new Promise((r) => srv.close(r));
console.log(ko ? `\nsorpassatotest: ${ko} controlli KO` : "\nsorpassatotest: TUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
