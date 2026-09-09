/* gen-6.12 «I testimoni bastano» — la finestra cieca dell'exactly-once,
   misurata sul codice VIVO di gen-6.11 e chiusa qui.

   IL DIFETTO (#40). Contro il doppione ci sono due testimoni: il logId in
   s.applicate e l'id della vendita in s.vendite. Poi c'e' lo steccato d'eta'
   (ORE_VENDITE = 48): una voce piu' vecchia si mette da parte, una piu'
   giovane si rigioca. La promessa implicita e' che ENTRO le 48 ore almeno un
   testimone sia ancora vivo. Non e' vero:
   - s.applicate teneva 300 nomi, e in rete si scrive ~350-450 volte al giorno
     (misurato in produzione: 300 nomi = 5.700 caratteri, 19 l'uno). Un nome
     scade in meno di un giorno.
   - s.vendite tiene 48 ore MA anche 300 righe: sopra ~150 scontrini al giorno
     la riga esce prima delle 48 ore.
   Fra «tutti e due i testimoni morti» e «steccato delle 48 ore» resta una
   finestra: il tablet che ha inviato uno scontrino perdendo la risposta e si
   riaccende il giorno dopo LO RIBATTE, e nessuna riga lo dice.

   LA CURA di questa generazione non e' un testimone nuovo (quello e' il
   progetto della ricevuta, progetti/finestra-cieca.md): e' rendere VERA la
   premessa del codice. MAX_APPLICATE sale da 300 a 1200, che a ~400
   scritture al giorno copre tre giorni, piu' delle 48 ore dello steccato.
   Costa ~17.000 caratteri in piu' a ogni salvataggio: dichiarato.

   Questo banco non semina «applicate» gia' tagliata: lascia che sia l'app a
   tagliarla con la propria scrittura, come succede in produzione. E non
   guarda «la riga non c'e'» — verde per caso, perche' la riga vecchia viene
   comunque potata — guarda la GIORNATA, il MAGAZZINO e lo STORICO, che sono
   i tre posti dove il doppione lascia il segno.

   COME SI GIRA: node testimonitest.mjs — servito su http, ramo window.auth
   (le due lezioni di gen607test). SORGENTE=... per i controlli sul testo. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import { readFile } from "fs/promises";
import { createServer } from "http";
import path from "path"; import crypto from "crypto";

const radice = process.cwd();
const SORGENTE = process.env.SORGENTE || path.resolve("../app/app.jsx");
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
base.aggiunte = []; base.postazioni = []; base.vendite = []; base.giornate = []; base.applicate = []; base.log = [];
const PRC = { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") };
const SEME = JSON.stringify({ ...base, profili: [PRC] });

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
/* il finto server in modo sicuro: window.auth e window.storage che rifiuta
   senza token, come le RPC vere. Niente forme di risposta qui: quelle sono
   il mestiere di gen607test. */
const apri = async (seme = SEME) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    if (!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1", j);
    const sha = async (t) => {
      const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
      return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
    };
    let TOKEN = null;
    window.auth = {
      async loginList() {
        return JSON.parse(localStorage.getItem("db:scp:stato:v1")).profili
          .map((p) => ({ id: p.id, nome: p.nome, ruolo: p.ruolo, colore: p.colore }));
      },
      async login(arg) {
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
    window.storage = {
      async get(k) {
        if (!TOKEN) return null;
        const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v };
      },
      async set(k, v) {
        if (!TOKEN) throw new Error("nessuna sessione (finto server)");
        localStorage.setItem("db:" + k, v);
        return { ok: true };
      },
      async delete(k) { if (!TOKEN) return null; localStorage.removeItem("db:" + k); return true; },
    };
  }, [seme]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  return { p, ctx };
};
const vai = async (p) => {
  await p.goto(URL_APP);
  await p.getByText("OpCassa", { exact: true }).first().waitFor({ state: "visible", timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(400);
};
/* il ricaricamento si fa con una pagina NUOVA nello stesso contesto: e' un
   montaggio da zero che ritrova il disco di prima (lezione di gen607test) */
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
const login = async (p) => {
  const nome = p.getByText("OpCassa", { exact: true }).first();
  await nome.waitFor({ state: "visible", timeout: 20000 });
  await nome.click();
  const uno = p.getByRole("button", { name: "2", exact: true }).first();
  await uno.waitFor({ state: "visible", timeout: 20000 });
  for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await uno.waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
  await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(700);
};
const salvato = (p) => p.evaluate(() => { const v = localStorage.getItem("db:scp:stato:v1"); return v ? JSON.parse(v) : null; });
const codaSalvata = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("scp:coda:v1") || "null"); } catch { return "ILLEGGIBILE"; } });
const ferme = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("scp:coda-ferma:v1") || "null"); } catch { return "ILLEGGIBILE"; } });
const mettiInCoda = (p, voci) => p.evaluate((v) => localStorage.setItem("scp:coda:v1", JSON.stringify(v)), voci);
const finche = async (p, quando, ms = 12000, passo = 150) => {
  const fine = Date.now() + ms;
  for (;;) { if (await quando()) return true; if (Date.now() > fine) return false; await p.waitForTimeout(passo); }
};
const giornoDiT = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const scaricoDi = (art) => [{ prodottoId: art.prodottoId, magId: linea.id, quanto: 1, uomId: art.uomId }];
const vendita = (id, t, totale = 6.5, extra = {}) => ({
  id, t, giorno: giornoDiT(t), sedeId: FM.id, chi: "OpCassa", metodo: "contanti",
  righe: [{ voceId: "li-mar", nome: "Margherita", qty: 1, prezzo: totale, aliquota: 10, gruppo: "Pizze" }],
  totale, stato: "registrata", n: 1, scarico: scaricoDi(moz), ...extra,
});
const giornata = (t, totale, n) => ({ id: giornoDiT(t) + "|" + FM.id, giorno: giornoDiT(t), sedeId: FM.id,
  totale, nVendite: n, nStorni: 0, metodi: { contanti: totale, carta: 0, altro: 0 } });
const voceVendita = (v, logId) => ({ tipo: "vendita", dati: v, descr: `Vendita in cassa: ${v.totale.toFixed(2).replace(".", ",")} € (contanti)`, chi: "OpCassa", t: v.t, logId });
const semeCon = (cambia) => { const s = JSON.parse(SEME); cambia(s); return JSON.stringify(s); };
const apriCon = async (seme) => { const g = await apri(seme); await vai(g.p); return g; };
const qtyDi = (rete, art) => rete.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === art.prodottoId).qty;
const righeStorico = (rete, re) => (rete.log || []).filter((e) => re.test(e.msg || "")).length;
const H = 3600000;

/* ═══ 1. LA FINESTRA CIECA, COME SUCCEDE DAVVERO ═══
   Tablet B ha inviato lo scontrino delle 36 ore fa e ha perso la risposta;
   poi e' rimasto spento. Nel frattempo la rete ha scritto 500 volte e ha
   battuto 300 scontrini. Qui la rete e' UNA scrittura dell'app (basta quella
   a far scattare i tetti), poi B si riaccende con la sua voce in coda. */
console.log("\n— 1. uno scontrino di 36 ore fa, con 500 scritture sopra, non si ribatte —");
await prova("§1", async () => {
  const T_FERMA = Date.now() - 36 * H;
  const FERMA = vendita("ve-ferma", T_FERMA, 18);
  const NUOVA = vendita("ve-nuova", Date.now() - 2 * 60000, 6.5, { scarico: scaricoDi(sug) });
  const seme = semeCon((s) => {
    /* 300 scontrini piu' recenti di FERMA, tutti dentro le 48 ore, piu' FERMA
       in fondo: alla prima scrittura dell'app il tetto delle 300 righe la fa
       cadere — e' l'app a spegnere il secondo testimone, non il seme */
    s.vendite = [...Array.from({ length: 300 }, (_, i) => vendita("ve-dopo-" + i, T_FERMA + (i + 1) * 5 * 60000, 6.5, { scarico: [] })), FERMA];
    s.giornate = [giornata(T_FERMA, 120, 9)];
    /* 500 nomi piu' recenti sopra quello di FERMA, 499 sotto: con un tetto a
       300 il primo taglio dell'app lo cancella, con 1200 resta */
    s.applicate = [...Array.from({ length: 500 }, (_, i) => "l-dopo-" + i), "l-ferma", ...Array.from({ length: 499 }, (_, i) => "l-prima-" + i)];
    const a = s.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === moz.prodottoId);
    a.qty = 49;   // lo scarico di FERMA e' gia' stato fatto, 36 ore fa
  });
  const G = await apriCon(seme);
  /* prima scrittura: una vendita nuova, che deve passare */
  await mettiInCoda(G.p, [voceVendita(NUOVA, "l-nuova")]);
  await vai(G.p);
  await login(G.p);
  const passata = await finche(G.p, async () => (await codaSalvata(G.p)) === null, 15000);
  await G.p.waitForTimeout(800);
  let rete = await salvato(G.p);
  ok(passata && (rete.vendite || []).some((v) => v.id === "ve-nuova"), "controcontrollo: la vendita di due minuti fa passa");
  ok(Math.abs(qtyDi(rete, sug) - 49) < 0.001, `…e scarica il suo ingrediente: sugo ${qtyDi(rete, sug)} (era 50)`);
  ok((rete.applicate || [])[0] === "l-nuova", "…e il suo nome e' in testa ai gia' fatti");
  ok(!(rete.vendite || []).some((v) => v.id === "ve-ferma"),
    "il tetto delle 300 righe ha fatto cadere lo scontrino di 36 ore fa da s.vendite (secondo testimone spento DALL'APP)");
  ok((rete.applicate || []).includes("l-ferma"),
    `il nome dello scontrino di 36 ore fa, con 500 scritture piu' recenti sopra, e' ANCORA fra i gia' fatti (${(rete.applicate || []).includes("l-ferma") ? "c'e'" : "SCADUTO: la memoria tiene " + (rete.applicate || []).length + " nomi"})`);
  ok((rete.applicate || []).length >= 1001,
    `la memoria dei gia' fatti tiene almeno 1001 nomi dopo la scrittura (${(rete.applicate || []).length})`);
  /* B si riaccende con la sua voce di 36 ore fa: dentro lo steccato delle 48
     ore, quindi si rigioca — e l'unico che puo' fermarla e' il nome */
  await mettiInCoda(G.p, [voceVendita(FERMA, "l-ferma")]);
  await riapri(G);
  await login(G.p);
  await finche(G.p, async () => (await codaSalvata(G.p)) === null, 15000);
  await G.p.waitForTimeout(1500);
  rete = await salvato(G.p);
  const g = (rete.giornate || []).find((x) => x.id === giornoDiT(T_FERMA) + "|" + FM.id);
  ok(g && Math.abs(g.totale - 120) < 0.001 && g.nVendite === 9,
    `la giornata di allora non e' gonfiata: ${g ? g.totale + " € su " + g.nVendite : "(sparita)"} (deve restare 120 € su 9)`);
  ok(Math.abs(qtyDi(rete, moz) - 49) < 0.001, `il magazzino non e' scalato due volte: mozzarella ${qtyDi(rete, moz)} (deve restare 49)`);
  const righe = righeStorico(rete, /Vendita in cassa: 18,00/);
  ok(righe === 0, `e lo storico non guadagna una riga per un lavoro gia' fatto (${righe} righe «Vendita in cassa: 18,00 €»)`);
  const f = await ferme(G.p);
  ok(f === null, `e la cura non e' «ferma tutto»: la voce di 36 ore e' dentro le 48, non va messa da parte (ferme: ${f === null ? "nessuna" : JSON.stringify(f).slice(0, 40)})`);
  await G.ctx.close();
});

/* ═══ 2. IL TETTO C'E' ANCORA, ED E' LARGO QUANTO SERVE ═══ */
console.log("\n— 2. la memoria e' larga ma non infinita —");
await prova("§2", async () => {
  const NUOVA = vendita("ve-nuova2", Date.now() - 60000, 6.5, { scarico: [] });
  const seme = semeCon((s) => { s.applicate = Array.from({ length: 1500 }, (_, i) => "l-tanti-" + i); });
  const G = await apriCon(seme);
  await mettiInCoda(G.p, [voceVendita(NUOVA, "l-nuova2")]);
  await vai(G.p);
  await login(G.p);
  await finche(G.p, async () => (await codaSalvata(G.p)) === null, 15000);
  await G.p.waitForTimeout(800);
  const rete = await salvato(G.p);
  const n = (rete.applicate || []).length;
  ok(n >= 1000, `dopo una scrittura la memoria tiene almeno 1000 nomi (${n}): a ~400 scritture al giorno sono piu' delle 48 ore dello steccato`);
  ok(n < 1500, `…ma i 1500 seminati sono stati tagliati (${n}): il tetto esiste ancora`);
  ok((rete.applicate || [])[0] === "l-nuova2", "…e il nome nuovo sta in testa, i tagli cadono in coda");
  await G.ctx.close();
});

console.log("\n— 3. il tetto scritto nel codice dice il vero —");
await prova("§3", async () => {
  const src = readFileSync(SORGENTE, "utf8");
  const m = /\nconst MAX_APPLICATE = (\d+);/.exec(src);
  const n = m ? +m[1] : null;
  ok(n != null && n >= 1000 && n <= 2000, `MAX_APPLICATE e' fra 1000 e 2000 (${n})`);
  const ore = /\nconst ORE_VENDITE = (\d+);/.exec(src);
  const h = ore ? +ore[1] : null;
  /* la premessa da rendere vera: a 400 scritture al giorno il nome deve
     vivere piu' dello steccato d'eta' */
  ok(n != null && h != null && n / 400 * 24 > h,
    `a 400 scritture al giorno un nome vive ${n != null ? (n / 400 * 24).toFixed(0) : "?"} ore, piu' delle ${h} dello steccato`);
  const sopra = m ? src.slice(Math.max(0, m.index - 1400), m.index) : "";
  ok(/ORE_VENDITE|48 ore|quarantotto/.test(sopra), "e il commento accanto al tetto lo lega allo steccato delle 48 ore");
  ok(!/MAX_APPLICATE = 300\b/.test(src), "nessun commento dice ancora «MAX_APPLICATE = 300»");
});

/* ═══ 4. CHI NON FA NIENTE NON LASCIA RIGHE ═══
   applicaVendita gia' torna false quando salta; storno e spunta tornavano
   undefined, e applicaCoda scriveva la riga di storico lo stesso: «Storno di
   6,50 €» per uno storno mai avvenuto. */
console.log("\n— 4. uno storno su una vendita che non c'e' non scrive «Storno» nello storico —");
await prova("§4", async () => {
  const seme = semeCon((s) => { s.vendite = []; s.giornate = []; });
  const G = await apriCon(seme);
  const t = Date.now() - 60000;
  await mettiInCoda(G.p, [{ tipo: "storno", chi: "OpCassa", t, logId: "l-storno-vuoto", descr: "Storno di 6,50 €: cliente andato via",
    dati: { stornoId: "vn-vuoto", origId: "ve-inesistente", t, motivo: "cliente andato via", chi: "OpCassa", autorizzataDa: "OpCassa" } }]);
  await vai(G.p);
  await login(G.p);
  await finche(G.p, async () => (await codaSalvata(G.p)) === null, 15000);
  await G.p.waitForTimeout(800);
  const rete = await salvato(G.p);
  const righe = righeStorico(rete, /Storno di/);
  ok(righe === 0, `nessuna riga «Storno di» per uno storno che non ha stornato niente (${righe})`);
  ok((rete.vendite || []).length === 0, `e nessuna riga contraria in s.vendite (${(rete.vendite || []).length})`);
  ok((rete.applicate || []).includes("l-storno-vuoto"), "ma il nome viene timbrato lo stesso: la voce e' stata gestita, non persa");
  await G.ctx.close();
});

console.log("\n— 5. controcontrollo: lo storno vero scrive la riga e rimette la merce —");
await prova("§5", async () => {
  const V = vendita("ve-da-stornare", Date.now() - 30 * 60000, 6.5);
  const seme = semeCon((s) => {
    s.vendite = [V]; s.giornate = [giornata(V.t, 6.5, 1)];
    const a = s.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === moz.prodottoId);
    a.qty = 49;
  });
  const G = await apriCon(seme);
  const t = Date.now() - 60000;
  await mettiInCoda(G.p, [{ tipo: "storno", chi: "OpCassa", t, logId: "l-storno-vero", descr: "Storno di 6,50 €: sbagliato",
    dati: { stornoId: "vn-vero", origId: V.id, t, motivo: "sbagliato", chi: "OpCassa", autorizzataDa: "OpCassa" } }]);
  await vai(G.p);
  await login(G.p);
  await finche(G.p, async () => (await codaSalvata(G.p)) === null, 15000);
  await G.p.waitForTimeout(800);
  const rete = await salvato(G.p);
  ok(righeStorico(rete, /Storno di/) === 1, `una riga «Storno di» nello storico (${righeStorico(rete, /Storno di/)})`);
  ok(Math.abs(qtyDi(rete, moz) - 50) < 0.001, `la mozzarella torna a 50 (${qtyDi(rete, moz)})`);
  const orig = (rete.vendite || []).find((v) => v.id === V.id);
  ok(orig && orig.stato === "stornata", `l'originale e' marcata stornata (${orig ? orig.stato : "sparita"})`);
  await G.ctx.close();
});

console.log("\n— 6. anche la spunta di cucina riferisce quando non fa niente —");
await prova("§6", async () => {
  const src = readFileSync(SORGENTE, "utf8");
  const guardie = [
    ['applicaStorno', /function applicaStorno\(s, d\) \{\n  const orig = [^\n]*\n  if \(!orig \|\| orig\.stato !== "registrata"\) return false;/],
    ['applicaComanda', /function applicaComanda\(s, d\) \{\n  const v = [^\n]*\n  if \(!v \|\| v\.stato !== "registrata"\) return false;/],
  ];
  for (const [nome, re] of guardie) ok(re.test(src), `${nome}: la guardia torna false, non undefined`);
});

await b.close();
srv.close();
if (errs.length) { console.log("\nErrori di pagina:", [...new Set(errs)].slice(0, 5).join(" | ")); ko += errs.length; }
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
