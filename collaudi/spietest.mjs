/* gen-6.15 «Le spie che mancano» — il RESTO del PASSO 1 del pavimento del
   traffico (progetti/pavimento-traffico.md, ORDINE DEI RILASCI punto 2 e
   IL CLIENT §2 e §4). Le voci (1) «gli esecutori riferiscono» e (4) «lo
   steccato guarda i fatti» sono gia' online da gen-6.12: qui ci sono le
   altre sei.

   ATTENZIONE AI NUMERI DI RIGA DEL DOCUMENTO: sono sfasati di ~+22/+26
   rispetto al file di oggi. Qui si cerca sempre la STRINGA, mai la riga.

   COSA PRENDE, PUNTO PER PUNTO.

   §2 — IL DIFETTO CHE SI VERIFICA IL SABATO SERA. Il Foglio dello Storno si
   apre su uno SNAPSHOT (`stornoDi`, uno useState) e `storna()` controlla
   solo `if (!stornoDi) return;`. Se nel frattempo un'altra cassa storna lo
   stesso scontrino, chi ha il Foglio aperto tocca «Conferma» e vede
   «Stornato»: il toast a valle di mutaDato e' INCONDIZIONATO. Il
   `return false` dentro applicaStorno (gen-6.12) tiene pulito il registro,
   ma lascia in piedi il gesto e la bugia sullo schermo. Non serve nessun
   conflitto per riprodurlo, e nessun collaudo lo aveva mai provato.

   §3 — IL CONTROCONTROLLO OBBLIGATORIO. Uno storno onesto deve continuare a
   passare. Senza questa sezione si sarebbe solo spenta una funzione.

   §4 — IL CONTRATTO DEGLI ESECUTORI, senza browser. I tre devono riferire
   «false» quando non fanno niente. E' la rete sotto a §2.

   §1 — QUELLO CHE SI PUO' SOLO LEGGERE, E PERCHE'. Il ramo LOCALE di
   mutaDato (quello che gira quando window.storage non c'e') butta via
   l'esito dell'esecutore: `try { ESECUTORI[tipo](b, dati); } catch {}` e poi
   `if (descr)`. Il ramo di rete, in applicaCoda, fa
   `if (m.descr && esito !== false)`. La differenza e' vera e va chiusa, ma
   NON e' osservabile dal browser: in modo locale lo stato viene da
   creaSeed(), non dal disco, quindi non si puo' seminare una vendita gia'
   stornata; e con la guardia di §2 addosso storna() non arriva nemmeno a
   chiamare mutaDato. E' difesa in profondita', come lo era il return false
   di gen-6.12, e qui si misura per quello che e': un controllo sul TESTO
   che pretende che i due rami abbiano la stessa regola. Sta scritto, cosi'
   chi legge non lo scambia per una misura.

   §5 — L'EXPORT DELLE VENDITE. La riga esterna e' protetta da `|| []`, la
   riga INTERNA no: una vendita senza `righe` fa cadere l'export con un
   TypeError e il file non esce. Il banco semina esattamente quella riga.

   §6 — IL BATTITO DI VERSIONE. «IL RISCHIO PIU' GROSSO» del documento:
   l'ordine dei rilasci esiste solo nel repository, un telefono entra in
   servizio col codice nuovo quando QUEL telefono ricarica. Senza battito
   non si sa quanti mancano e ogni criterio di accettazione e' verde per
   assenza. Si pretende: dopo un salvataggio vero la riga c'e', col numero
   di VERSIONE e con la revisione a cui e' stata lasciata; e il tetto pota
   la riga con la revisione piu' BASSA, mai una a caso.
   QUELLO CHE QUESTO BANCO NON PROVA, e lo dice invece di lasciarlo credere:
   la scena «due dispositivi, due righe» qui non esiste. Il finto server e'
   un guscio sul localStorage della pagina, e scp:disp:v1 sta nello stesso
   posto: due pagine dello stesso contesto hanno lo stesso id, due contesti
   hanno due id ma anche due server separati. L'unico banco che regge due
   telefoni su un negozio solo e' duetelefonitest, col negozio lato Node.
   Il tetto e la potatura si provano dove sono veri, cioe' sulla funzione,
   con la libreria.

   §7 — normalizza porta «telefoni» fra i default. Se manca, la prima
   schermata che ci itera muore su uno stato scritto da un bundle vecchio.

   §8 e §9 — LE DUE SPIE NUOVE, E LA PROVA CHE NON SONO CONGELATE. Una spia
   che mostra il valore del primo disegno e' peggio di nessuna spia. Il
   banco SOSPENDE la rete e pretende che l'eta' SALGA: e' l'unico modo di
   dimostrare che il numero e' vivo senza appendersi all'orologio.
   La soglia dell'ambra si LEGGE dal sorgente (spie-lib), non si riscrive
   qui: il giorno che qualcuno la cambia il banco si ritara invece di
   arrossire a sproposito.

   §10 — I BANCHI CHE DEVONO RESTARE VERI. Il documento (I COLLAUDI §11)
   elenca cosa non deve rompersi: qui si tiene fermo il numero dei tre
   blocchi gemelli di potatura dentro applicaCoda, che potaturatest §9 conta.

   COME SI GIRA: node spietest.mjs — servito su http, ramo window.auth con
   token, MAI file:// (un'origine opaca ha dato dieci risultati diversi sullo
   stesso codice: gen606test.mjs:47-61). SORGENTE=<file> per i controlli sul
   testo, insieme a «node build.mjs <file>». */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import { readFile } from "fs/promises";
import { createServer } from "http";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";

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

/* la libreria si costruisce col pacchetto (build.mjs), ed e' difensiva:
   i pezzi che non esistono ancora arrivano come null, non come esplosione */
const { SPIE } = await import("./spie-lib.cjs").then((m) => m.default || m);

/* ── il seme: una linea con due ingredienti, una voce a listino, un Admin ── */
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
/* TRE PROFILI, E NON E' PIGRIZIA: la barra la decide il ruolo. La barra
   dell'admin NON ha ne' Cassa ne' Comande — ci si arriva dalla lente, e sta
   scritto nel codice (app.jsx, «l'admin arriva in Cassa dalla lente»). Un
   operatore con l'interruttore «cassa» ha Cassa al posto della Plancia; un
   operatore SENZA cassa e senza correzioni ha Comande. Sistema invece e'
   dell'admin. Quindi ogni sezione entra con chi quella porta ce l'ha.
   L'Admin serve anche quando non entra: senza un admin col PIN il Foglio
   dello storno non mostra il campo del PIN (guardia adminConPin) e il
   cassiere non potrebbe confermare niente. */
const PRA = { id: "pr-a", nome: "AdminBanco", ruolo: "admin", colore: "#7C5CF0", pinHash: hash("1234") };
const PRC = { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") };
const PRK = { id: "pr-ku", nome: "OpCucina", ruolo: "operatore", sedeId: FM.id, colore: "#2FA97C",
  magazziniIds: [linea.id], pinHash: hash("3333") };
const SEME = JSON.stringify({ ...base, profili: [PRA, PRC, PRK] });

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
/* Il finto server, in modo sicuro (window.auth + token), con UN interruttore
   in piu' rispetto a sfrattotest: __sospendi. Da quel momento ogni lettura
   dalla rete resta appesa per sempre — e' l'unico modo di far invecchiare
   l'eta' di una vista in modo deterministico, senza toccare l'orologio del
   browser (toccarlo falserebbe tutto il resto dell'app). */
const apri = async (seme = SEME) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    if (!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1", j);
    /* LA SPIA DELLA REVISIONE C'E' ANCHE QUI, come nel caricatore vero.
       Senza, revRemota torna sempre null, il giro leggero non scatta mai e
       «giri leggeri consecutivi» resta inchiodato a zero: la scheda
       diagnostica avrebbe un campo verde per assenza, cioe' una spia che
       non si accende mai e che nessuno saprebbe leggere. */
    try {
      if (!localStorage.getItem("db:scp:rev:v1"))
        localStorage.setItem("db:scp:rev:v1", String(JSON.parse(j).rev || 0));
    } catch {}
    const sha = async (t) => {
      const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
      return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
    };
    let TOKEN = null;
    window.__sospendi = false;
    /* __soloSpia: la chiave della revisione continua a rispondere, tutto il
       resto resta appeso. Serve a §12, e il perche' sta scritto la'. */
    window.__soloSpia = false;
    const appeso = () => new Promise(() => {});
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
        if (window.__sospendi) return appeso();
        if (window.__soloSpia && k !== "scp:rev:v1") return appeso();
        if (!TOKEN) return null;
        const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v };
      },
      async set(k, v) {
        if (window.__sospendi) return appeso();
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
  await p.getByText("AdminBanco", { exact: true }).first().waitFor({ state: "visible", timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(400);
};
const login = async (p, chi = "AdminBanco", pin = "1234") => {
  const nome = p.getByText(chi, { exact: true }).first();
  await nome.waitFor({ state: "visible", timeout: 20000 });
  await nome.click();
  const primo = p.getByRole("button", { name: pin[0], exact: true }).first();
  await primo.waitFor({ state: "visible", timeout: 20000 });
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await primo.waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
  await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(700);
};
/* il cassiere non e' admin: lo storno gli chiede il PIN di un Admin, ed e'
   la strada vera — quella che passa dall'await di hashPin */
const confermaStorno = async (p, motivo) => {
  await p.getByPlaceholder("Es. errore di battitura").fill(motivo);
  await p.waitForTimeout(150);
  const pinA = p.getByLabel("PIN di un Admin");
  if (await pinA.count()) { await pinA.first().fill("1234"); await p.waitForTimeout(150); }
  await p.getByRole("button", { name: "Conferma lo storno", exact: true }).click();
};
const salvato = (p) => p.evaluate(() => { const v = localStorage.getItem("db:scp:stato:v1"); return v ? JSON.parse(v) : null; });
/* si scrive in rete SENZA passare dall'app: e' l'altra cassa */
const scriviInRete = (p, cambia) => p.evaluate((f) => {
  const s = JSON.parse(localStorage.getItem("db:scp:stato:v1"));
  // eslint-disable-next-line no-new-func
  new Function("s", f)(s);
  s.rev = (s.rev || 0) + 1; s.mtime = Date.now();
  localStorage.setItem("db:scp:stato:v1", JSON.stringify(s));
  localStorage.setItem("db:scp:rev:v1", String(s.rev));
  return s.rev;
}, cambia);
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const finche = async (p, quando, ms = 12000, passo = 200) => {
  const fine = Date.now() + ms;
  for (;;) { if (await quando()) return true; if (Date.now() > fine) return false; await p.waitForTimeout(passo); }
};
const giornoDiT = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const scaricoDi = (art) => [{ prodottoId: art.prodottoId, magId: linea.id, quanto: 1, uomId: art.uomId }];
const vendita = (id, t, totale = 6.5, extra = {}) => ({
  id, t, giorno: giornoDiT(t), sedeId: FM.id, chi: "AdminBanco", metodo: "contanti",
  righe: [{ voceId: "li-mar", nome: "Margherita", qty: 1, prezzo: totale, aliquota: 10, gruppo: "Pizze" }],
  totale, stato: "registrata", n: 1, scarico: scaricoDi(moz), ...extra,
});
const giornata = (t, totale, n) => ({ id: giornoDiT(t) + "|" + FM.id, giorno: giornoDiT(t), sedeId: FM.id,
  totale, nVendite: n, nStorni: 0, metodi: { contanti: totale, carta: 0, altro: 0 } });
const semeCon = (cambia) => { const s = JSON.parse(SEME); cambia(s); return JSON.stringify(s); };
const apriCon = async (seme) => { const g = await apri(seme); await vai(g.p); return g; };
const qtyDi = (rete, art) => rete.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === art.prodottoId).qty;
const righeStorico = (rete, re) => (rete.log || []).filter((e) => re.test(e.msg || "")).length;
const src = readFileSync(SORGENTE, "utf8");
/* il corpo di una funzione di primo livello, presa per nome: serve ai
   controlli sul testo, che senza confini pescherebbero righe di altrove */
const corpoDi = (nome) => {
  const i = src.indexOf(nome);
  if (i < 0) return "";
  return src.slice(i, i + 4000);
};

/* ═══ 1. QUELLO CHE SI PUO' SOLO LEGGERE ═══
   Il ramo LOCALE di mutaDato e il ramo di rete devono avere la stessa
   regola. Non e' una misura: e' un controllo sul testo, e il perche' sta
   nell'intestazione di questo file. */
console.log("\n— 1. i TRE posti che eseguono una mutazione hanno la stessa regola sull'esito —");
await prova("§1", async () => {
  const mutaDato = corpoDi("const mutaDato = (tipo, dati, descr)");
  ok(!!mutaDato, "il ramo locale di mutaDato si trova nel sorgente");
  ok(/let esito[\s\S]{0,400}ESECUTORI\[tipo\]\(b, dati\)/.test(mutaDato),
    "il ramo locale di mutaDato RACCOGLIE l'esito invece di buttarlo");
  ok(/if \(descr && esito !== false\)/.test(mutaDato),
    "e scrive la riga di storico solo se l'esecutore non ha detto «false»");
  /* il gemello, quindici righe sopra: identico riga per riga, e applicaCoda
     li tratta come uno solo (accetta sia m.fn sia il tipo). Lasciarne fuori
     uno vorrebbe dire due rami locali che si comportano in due modi. */
  const mutaLoc = corpoDi("const muta = (fn, descr)");
  ok(/let esito[\s\S]{0,400}esito = fn\(b\)/.test(mutaLoc),
    "e anche il ramo locale di muta, il suo gemello, raccoglie l'esito");
  ok(/if \(descr && esito !== false\)/.test(mutaLoc),
    "con la stessa condizione: la regola e' UNA, non due");
  const coda = corpoDi("const applicaCoda = (base)");
  ok(/if \(m\.descr && esito !== false\)/.test(coda),
    "controcontrollo: il ramo di rete ha ancora la sua (e' il modello, da gen-6.07)");
});

/* ═══ 2. IL FOGLIO APERTO SU UNO SNAPSHOT ═══
   Il caso che si verifica il sabato sera, e che nessun banco provava. */
console.log("\n— 2. storno confermato su uno scontrino che nel frattempo e' gia' stato stornato —");
await prova("§2", async () => {
  const T = Date.now() - 90 * 60000;
  const V = vendita("ve-gara", T, 6.5);
  const seme = semeCon((s) => {
    s.vendite = [V];
    s.giornate = [giornata(T, 6.5, 1)];
    const a = s.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === moz.prodottoId);
    a.qty = 49;                       // lo scarico della vendita e' gia' stato fatto
  });
  const G = await apriCon(seme);
  await login(G.p, "OpCassa", "2222");
  await vaiA(G.p, "Cassa");
  /* «Ultime vendite» sta nella riga «Oggi» della stanza di partenza, non
     dentro «Giornata»: e' il cancello che gen-6.07 ha allargato apposta */
  await G.p.getByRole("button", { name: "Ultime vendite" }).first().click();
  await G.p.waitForTimeout(600);
  await G.p.getByRole("button", { name: /^Storna la vendita/ }).first().click();
  await G.p.waitForTimeout(500);
  ok(/Motivo dello storno/.test(await testoDi(G.p)), "il Foglio dello storno e' aperto");
  await G.p.getByPlaceholder("Es. errore di battitura").fill("prova di gara");
  await G.p.waitForTimeout(200);

  /* ── L'ALTRA CASSA ── storna lo stesso scontrino mentre questo Foglio e'
     aperto. Si scrive in rete e si aspetta che il poll dell'app se ne
     accorga: non si tocca lo stato dell'app da fuori. */
  await scriviInRete(G.p, `
    const v = s.vendite.find((x) => x.id === "ve-gara");
    v.stato = "stornata"; v.stornoId = "vn-altra";
    s.vendite.unshift({ id: "vn-altra", t: Date.now(), giorno: v.giorno, sedeId: v.sedeId,
      chi: "AltraCassa", stato: "storno", origId: v.id, motivo: "prima io",
      righe: v.righe.map((x) => ({ ...x })), totale: -v.totale, metodo: v.metodo, scarico: [] });
    const a = s.magazzini.find((m) => m.id === "${linea.id}").articoli.find((x) => x.prodottoId === "${moz.prodottoId}");
    a.qty = 50;
    const g = s.giornate.find((x) => x.id === "${giornoDiT(T)}|${FM.id}");
    g.totale = 0; g.nStorni = 1;
  `);
  /* ── COME SI SA CHE L'APP SE N'E' ACCORTA ──
     La prima stesura cercava «/prima io|storno/i» nel testo della pagina, e
     pescava «Motivo dello storno» — l'etichetta del Foglio che e' aperto da
     prima. Era vera da subito: il banco cliccava PRIMA che la revisione
     nuova arrivasse, e poi dava la colpa al codice. Un rilevatore che e'
     vero anche quando non e' successo niente non e' un rilevatore.
     Il segno buono e' dietro il Foglio, nella riga «Oggi»: la giornata
     guadagna «1 storni», che prima non c'era. Quella stringa esiste solo
     se lo stato nuovo e' entrato. */
  const arrivato = await finche(G.p, async () => {
    const r = await G.p.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("db:scp:stato:v1"));
      return s.vendite.find((x) => x.id === "ve-gara")?.stato;
    });
    if (r !== "stornata") return false;
    return /1 storni/.test(await testoDi(G.p));
  }, 20000);
  ok(arrivato, "l'app ha ricevuto dalla rete lo storno dell'altra cassa");

  /* ── QUALE RIGA MISURA, E QUALI SONO CINTURA ──
     Solo le prime due pretese qui sotto (niente toast «Stornato», e il
     Foglio che si chiude) misurano la guardia nuova. Le altre — storico,
     magazzino, riga contraria, giornata — sono VERDI ANCHE SU gen-6.14,
     perche' applicaStorno riferisce «false» da gen-6.12 e applicaCoda non
     scrive la riga di storico per un esito falso. Stanno qui come cintura:
     dimostrano che la guardia nuova non ha rotto la rete di sotto. Chi legge
     il tabellone non deve scambiarle per la misura. */
  const primaLog = righeStorico(await salvato(G.p), /Storno di/);
  const pinA = G.p.getByLabel("PIN di un Admin");
  if (await pinA.count()) { await pinA.first().fill("1234"); await G.p.waitForTimeout(150); }
  await G.p.getByRole("button", { name: "Conferma lo storno", exact: true }).click();
  await G.p.waitForTimeout(1800);
  const testo = await testoDi(G.p);
  ok(!/\bStornato\b/.test(testo),
    `LA MISURA: non dice «Stornato» per un lavoro che non ha fatto (${/\bStornato\b/.test(testo) ? "l'ha detto" : "ok"})`);
  /* il Foglio si chiude anche su gen-6.14 (storna() fa setStornoDi(null) in
     fondo comunque): quello che cambia e' COSA si legge mentre si chiude —
     prima «Stornato», adesso il motivo vero. Questa e' la seconda misura. */
  ok(/non è più stornabile/.test(testo),
    "LA MISURA: e dice perche', invece di lasciar credere che sia andata");
  ok(!/Motivo dello storno/.test(testo),
    "cintura: il Foglio si chiude e non resta li' come se si potesse riprovare");
  const rete = await salvato(G.p);
  ok(righeStorico(rete, /Storno di/) === primaLog,
    `e lo storico non guadagna una riga (${righeStorico(rete, /Storno di/)} contro ${primaLog})`);
  ok(Math.abs(qtyDi(rete, moz) - 50) < 0.001,
    `e la merce non torna in magazzino due volte: mozzarella ${qtyDi(rete, moz)} (deve restare 50)`);
  const contro = (rete.vendite || []).filter((x) => x.origId === "ve-gara" && x.stato === "storno");
  ok(contro.length === 1, `e la riga contraria resta UNA sola (${contro.length})`);
  const g = (rete.giornate || []).find((x) => x.id === giornoDiT(T) + "|" + FM.id);
  ok(g && Math.abs(g.totale - 0) < 0.001 && g.nStorni === 1,
    `e la giornata non scende due volte: ${g ? g.totale + " € con " + g.nStorni + " storni" : "(giornata sparita)"}`);
  await G.ctx.close();
});

/* ═══ 3. IL CONTROCONTROLLO OBBLIGATORIO ═══
   Senza questo si e' solo spenta una funzione. */
console.log("\n— 3. controcontrollo: uno storno onesto passa, come sempre —");
await prova("§3", async () => {
  const T = Date.now() - 60 * 60000;
  const V = vendita("ve-onesta", T, 6.5);
  const seme = semeCon((s) => {
    s.vendite = [V];
    s.giornate = [giornata(T, 6.5, 1)];
    const a = s.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === moz.prodottoId);
    a.qty = 49;
  });
  const G = await apriCon(seme);
  await login(G.p, "OpCassa", "2222");
  await vaiA(G.p, "Cassa");
  /* «Ultime vendite» sta nella riga «Oggi» della stanza di partenza, non
     dentro «Giornata»: e' il cancello che gen-6.07 ha allargato apposta */
  await G.p.getByRole("button", { name: "Ultime vendite" }).first().click();
  await G.p.waitForTimeout(600);
  await G.p.getByRole("button", { name: /^Storna la vendita/ }).first().click();
  await G.p.waitForTimeout(500);
  await confermaStorno(G.p, "errore di battitura");
  await G.p.waitForTimeout(2000);
  ok(/\bStornato\b/.test(await testoDi(G.p)), "dice «Stornato», perche' lo storno e' avvenuto davvero");
  const arrivata = await finche(G.p, async () => {
    const r = await salvato(G.p);
    return (r.vendite || []).some((x) => x.origId === "ve-onesta" && x.stato === "storno");
  }, 12000);
  ok(arrivata, "e la riga contraria arriva in rete");
  const rete = await salvato(G.p);
  ok((rete.vendite || []).find((x) => x.id === "ve-onesta")?.stato === "stornata",
    "l'originale e' marcata stornata");
  ok(Math.abs(qtyDi(rete, moz) - 50) < 0.001, `la merce torna in magazzino: mozzarella ${qtyDi(rete, moz)} (era 49)`);
  ok(righeStorico(rete, /Storno di/) === 1, `e lo storico scrive la riga, una sola (${righeStorico(rete, /Storno di/)})`);
  await G.ctx.close();
});

/* ═══ 4. IL CONTRATTO DEGLI ESECUTORI ═══
   Senza browser, sulle funzioni vere estratte dal sorgente in prova. */
console.log("\n— 4. i tre esecutori riferiscono «false» quando non fanno niente —");
await prova("§4", async () => {
  const E = SPIE.ESECUTORI;
  ok(!!E && !!E.storno && !!E.spunta && !!E.vendita, "i tre esecutori si leggono dalla libreria");
  if (!E) return;
  const stanza = () => ({ vendite: [{ ...vendita("ve-x", Date.now() - 3600000), stato: "stornata" }],
    giornate: [], magazzini: [], movimenti: [], log: [] });
  const s1 = stanza();
  ok(E.storno(s1, { stornoId: "vn-1", origId: "ve-x", t: Date.now(), motivo: "m", chi: "c" }) === false,
    "storno su una vendita gia' stornata: false");
  const s2 = stanza();
  ok(E.spunta(s2, { venditaId: "ve-x", postId: "po-1", chi: "c" }) === false,
    "spunta su una vendita gia' stornata: false");
  const s3 = { vendite: [vendita("ve-y", Date.now() - 3600000)], giornate: [], magazzini: [], movimenti: [], log: [] };
  ok(E.vendita(s3, vendita("ve-y", Date.now() - 3600000)) === false,
    "vendita gia' presente in lista: false");
  const s4 = { vendite: [], giornate: [], magazzini: [], movimenti: [], log: [] };
  ok(E.vendita(s4, vendita("ve-z", Date.now() - 3600000)) !== false,
    "controcontrollo: una vendita nuova NON dice false (se no si e' spento tutto)");
});

/* ═══ 5. L'EXPORT DELLE VENDITE NON CADE SU UNA RIGA SENZA «righe» ═══ */
console.log("\n— 5. l'export delle vendite regge una riga senza «righe» —");
await prova("§5", async () => {
  const T = Date.now() - 30 * 60000;
  const seme = semeCon((s) => {
    s.vendite = [vendita("ve-buona", T, 6.5), { ...vendita("ve-rotta", T - 60000, 6.5), righe: undefined }];
    s.giornate = [giornata(T, 13, 2)];
  });
  const G = await apriCon(seme);
  await login(G.p);
  await vaiA(G.p, "Sistema");
  const primaErrori = errs.length;
  const scarico = G.p.waitForEvent("download", { timeout: 8000 }).catch(() => null);
  await G.p.getByRole("button", { name: "Vendite", exact: true }).first().click();
  const file = await scarico;
  ok(!!file, `il file esce lo stesso (${file ? await file.suggestedFilename() : "nessun file"})`);
  ok(errs.length === primaErrori, `e nessun errore di pagina (${errs.length - primaErrori})`);
  if (file) {
    const dove = await file.path();
    const testo = dove ? readFileSync(dove, "utf8") : "";
    ok(/Margherita/.test(testo), "e dentro c'e' la vendita buona: la riga rotta non porta via anche lei");
  }
  await G.ctx.close();
  /* LA META' CHE FA PIU' MALE. La stessa lettura non protetta vive in altri
     due punti: la riga di vendita (che disegna sia «Ultime vendite» sia la
     stanza «Giornata») e il Foglio dello Storno. Li' una vendita senza
     «righe» non manca un CSV: sbianca la Cassa. Qui si apre quella porta. */
  const C = await apriCon(seme);
  await login(C.p, "OpCassa", "2222");
  const primaC = errs.length;
  await vaiA(C.p, "Cassa");
  await C.p.getByRole("button", { name: "Ultime vendite" }).first().click();
  await C.p.waitForTimeout(900);
  ok(errs.length === primaC,
    `«Ultime vendite» si apre con la vendita malata in lista, senza sbiancare (${errs.length - primaC} errori)`);
  ok(/Margherita/.test(await testoDi(C.p)), "e la vendita buona si legge lo stesso");
  await C.ctx.close();
});

/* ═══ 6. IL BATTITO DI VERSIONE ═══ */
console.log("\n— 6. il battito di versione: chi scrive lascia il suo numero —");
await prova("§6", async () => {
  ok(typeof SPIE.battito === "function", "la funzione «battito» esiste nel sorgente");
  ok(Number.isInteger(SPIE.MAX_TELEFONI) && SPIE.MAX_TELEFONI > 0,
    `e il tetto dei telefoni e' un numero (${SPIE.MAX_TELEFONI})`);
  if (typeof SPIE.battito === "function") {
    /* IL FINTO DISCO, E PERCHE' SERVE. Senza un id di dispositivo il battito
       non timbra e non pota — e' la scelta giusta per un browser che rifiuta
       lo storage: meglio un assente onesto che dieci fantasmi. Ma qui gira
       node, dove localStorage non esiste, quindi senza questo guscio il
       tetto non si potrebbe misurare affatto: il banco misurerebbe il ramo
       «niente disco» credendo di misurare la potatura. */
    const disco = {};
    globalThis.localStorage = {
      getItem: (k) => (k in disco ? disco[k] : null),
      setItem: (k, v) => { disco[k] = String(v); },
      removeItem: (k) => { delete disco[k]; },
    };
    /* il tetto morde sulla riga con la REVISIONE piu' bassa, non su una a
       caso: le seminate hanno r crescente, quindi «d-0» e' quella da sfrattare */
    const vecchi = {};
    for (let i = 0; i < SPIE.MAX_TELEFONI + 4; i++) vecchi["d-" + i] = { v: "gen-0.01", r: 10 + i, t: 1000 + i };
    const dopo = SPIE.battito(vecchi, 9999);
    ok(Object.keys(dopo).length === SPIE.MAX_TELEFONI,
      `il tetto pota: ${Object.keys(dopo).length} righe su ${Object.keys(vecchi).length + 1} (seminate + la mia)`);
    ok(!dopo["d-0"], "e la riga sfrattata e' quella con la revisione PIU' BASSA, non una a caso");
    const mia = Object.entries(dopo).find(([, r]) => r.r === 9999);
    ok(!!mia && mia[1].v === SPIE.VERSIONE,
      "e la riga di chi ha appena scritto c'e' sempre: non ci si sfratta da soli");
    delete globalThis.localStorage;
    /* IL RAMO «NIENTE DISCO» NON SI PUO' MISURARE QUI, e va detto invece di
       fingere: l'id si risolve UNA VOLTA per caricamento e resta in cache,
       quindi togliere il disco adesso non lo rimette in discussione — ed e'
       esattamente il comportamento voluto. Qui resta un controllo sul TESTO:
       il ripiego esiste e non timbra. Un id rifabbricato a ogni salvataggio
       riempirebbe il tetto da solo in dieci scritture e sfratterebbe tutti i
       telefoni veri. */
    const corpo = corpoDi("function idDispositivo()") + corpoDi("function battito(tel, rev)");
    ok(/catch \{ idDisp = null; \}/.test(corpo) && /if \(!id\) return/.test(corpo),
      "cintura sul testo: senza disco l'id e' null e il battito non timbra");
  }
  const G = await apriCon(SEME);
  await login(G.p, "OpCassa", "2222");
  /* una scrittura qualunque: si batte una vendita dalla Cassa */
  await vaiA(G.p, "Cassa");
  await G.p.getByRole("button", { name: "Aggiungi Margherita" }).first().click();
  await G.p.waitForTimeout(500);
  await G.p.getByRole("button", { name: "Incassa", exact: true }).click();
  await G.p.waitForTimeout(600);
  await G.p.getByRole("button", { name: "Registra l'incasso", exact: true }).click();
  const scritto = await finche(G.p, async () => ((await salvato(G.p))?.vendite || []).length > 0, 15000);
  ok(scritto, "la vendita e' arrivata in rete");
  const rete = await salvato(G.p);
  const tel = rete?.telefoni || {};
  const righe = Object.values(tel);
  ok(righe.length === 1, `in rete c'e' UNA riga di battito (${righe.length})`);
  ok(righe[0]?.v === SPIE.VERSIONE, `e porta la versione di questo codice (${righe[0]?.v} contro ${SPIE.VERSIONE})`);
  ok(Number.isFinite(righe[0]?.t) && Math.abs(Date.now() - righe[0].t) < 120000,
    "e l'ora e' quella di adesso, non una inventata");
  await G.ctx.close();
});

/* ═══ 7. normalizza PORTA «telefoni» ═══
   Se manca, la prima schermata che ci itera muore su uno stato scritto da
   un bundle vecchio — che e' la flotta mista di cui parla il documento. */
console.log("\n— 7. «telefoni» sta fra i default di normalizza —");
await prova("§7", async () => {
  const norm = corpoDi("const normalizza = (s) =>");
  ok(/telefoni:/.test(norm.split("...s")[0] || ""),
    "«telefoni» e' fra i default, PRIMA di «...s» (se no sovrascriverebbe il dato vero)");
  /* e la prova vera: uno stato scritto da un bundle vecchio, senza il campo */
  const seme = semeCon((s) => { delete s.telefoni; s.vendite = []; });
  const G = await apriCon(seme);
  await login(G.p);
  const primaErrori = errs.length;
  await vaiA(G.p, "Sistema");
  await G.p.waitForTimeout(900);
  ok(errs.length === primaErrori,
    `Sistema si apre su uno stato senza «telefoni» senza cadere (${errs.length - primaErrori} errori)`);
  await G.ctx.close();
  /* ── LE FORME SPORCHE, CHE ARRIVANO DAVVERO ──
     «...s» in normalizza lascia passare qualunque cosa, e «Importa JSON»
     accetta un testo incollato a mano validando tre array e basta. Un
     «telefoni»: null farebbe esplodere Object.entries e sbiancare proprio
     VistaSistema, cioe' la schermata da cui si ripara un backup sbagliato.
     Stessa prova che il disegno della ricevuta pretende per la sua mappa
     gemella: null, stringa, array, valori non oggetto, e la chiave
     «__proto__». Zero errori di pagina, e la scheda si disegna lo stesso. */
  for (const [nome, forma] of [["null", null], ["una stringa", "boh"], ["un array", [1, 2]],
    ["valori non oggetto", { "d-1": 7, "d-2": null }],
    /* «__proto__» va costruito da JSON, non da un letterale: in un letterale
       imposta il PROTOTIPO e non lascia nessuna chiave propria, cioe' il
       banco proverebbe un caso che non esiste. Da JSON.parse invece la
       chiave propria c'e', sopravvive a stringify, e arriva davvero dentro
       Object.entries — che e' il caso da provare. */
    ["la chiave __proto__", JSON.parse(String.raw`{"__proto__":{"v":"gen-0.01","r":1,"t":1},"d-3":{"v":"gen-6.15","r":2,"t":1}}`)]]) {
    const sp = semeCon((x) => { x.telefoni = forma; x.vendite = []; });
    const H = await apriCon(sp);
    await login(H.p);
    const pre = errs.length;
    await vaiA(H.p, "Sistema");
    await H.p.waitForTimeout(900);
    const testo = await testoDi(H.p);
    ok(errs.length === pre && /telefoni che hanno salvato/i.test(testo),
      `«telefoni» = ${nome}: Sistema si disegna lo stesso (${errs.length - pre} errori)`);
    await H.ctx.close();
  }
});

/* ═══ 8. LA SCHEDA DIAGNOSTICA IN SISTEMA ═══
   diagRef e' scritto in sei punti e non e' letto da nessuna riga di tutto il
   repository. Qui si pretende che sia letto, e che il numero sia VIVO. */
console.log("\n— 8. la scheda diagnostica legge diagRef, e non mostra un valore congelato —");
await prova("§8", async () => {
  const G = await apriCon(SEME);
  await login(G.p);
  await vaiA(G.p, "Sistema");
  await G.p.waitForTimeout(1200);
  const testo = await testoDi(G.p);
  ok(/allineamento/i.test(testo), "la scheda c'e' e parla dell'ultimo allineamento");
  ok(/giri leggeri/i.test(testo), "e dice i giri leggeri consecutivi, su quanti");
  /* e non e' un'etichetta: con la spia della revisione ferma, i giri leggeri
     salgono davvero. Se restasse a zero la scheda avrebbe un campo che non
     si accende mai — verde per assenza */
  const magri = await finche(G.p, async () => {
    const m = (await testoDi(G.p)).match(/giri leggeri consecutivi:\s*(\d+)/i);
    return m && +m[1] > 0;
  }, 14000, 500);
  ok(magri, "e i giri leggeri SALGONO: e' una misura, non un'etichetta");
  ok(/conflitt/i.test(testo) && /error/i.test(testo), "e i conflitti e gli errori");
  /* la spia deve dire anche quello che NON sa: una lista di telefoni che
     conta solo chi ha scritto e' una lista che mente per omissione */
  ok(/non aggiornato/i.test(testo),
    "e dichiara che «assente» vuol dire NON aggiornato, mai il contrario");
  /* VIVO, non congelato: si sospende la rete e l'eta' deve salire */
  const eta = async () => {
    const t = await testoDi(G.p);
    const m = t.match(/allineamento[^0-9]{0,40}(\d+)\s*s/i);
    return m ? +m[1] : null;
  };
  const prima = await eta();
  ok(prima != null, `l'eta' dell'ultimo allineamento si legge come numero (${prima})`);
  await G.p.evaluate(() => { window.__sospendi = true; });
  const cresciuta = await finche(G.p, async () => {
    const ora = await eta();
    return ora != null && prima != null && ora > prima + 3;
  }, 20000, 500);
  ok(cresciuta, "e con la rete sospesa SALE: il numero e' vivo, non quello del primo disegno");
  await G.ctx.close();
});

/* ═══ 9. L'ETA' DELLA LISTA IN CIMA A COMANDE ═══
   «La riga che rende rilasciabile il passo 4 in una pizzeria aperta»
   (progetti/pavimento-traffico.md, I LIMITI ACCETTATI §4). Oggi la cucina
   non puo' distinguere «non c'e' niente» da «non lo so da tre minuti». */
console.log("\n— 9. Comande dice da quanto e' ferma la lista, e va in ambra oltre soglia —");
await prova("§9", async () => {
  /* IL TETTO UMANO — trovato aprendo il sabotaggio S9 dell'11 settembre, che
     e' uscito MUTO e che senza questo tetto ci mette 59 minuti a dirlo.
     Leggere la soglia dal sorgente e' giusto: evita di arrossire il giorno che
     qualcuno la cambia per un buon motivo. Ma un metro che prende la propria
     aspettativa DAL CODICE CHE MISURA non puo', per costruzione, accorgersi
     che quel codice e' cambiato. Portata la soglia a un'ora, il banco si e'
     ritarato a un'ora, ha aspettato un'ora, e ha detto VERDE: perfettamente
     d'accordo con l'app su un numero che in cucina non serve a niente.
     E il secondo danno era peggiore del primo: la pazienza si calcolava dalla
     soglia LETTA, quindi chiunque tocchi quella costante puo' fermare il banco
     per un'ora — e un banco fermo un'ora si legge come APPESO, e chi lo legge
     cosi' lo ammazza, perdendo il giro di sabotaggi intero. Ci sono passato.
     Quindi: la soglia continua a leggersi dal sorgente, ma deve stare dentro
     una banda DICHIARATA QUI, e la pazienza si tetta in orologio vero. Una
     spia che si accende dopo due minuti non e' una spia: in cucina due minuti
     senza sapere sono gia' troppi. Se un domani la soglia vera va oltre, il
     banco diventa rosso QUI e chiede conto, invece di ritararsi in silenzio. */
  const TETTO_UMANO = 120000;
  ok(Number.isFinite(SPIE.SOGLIA_VISTA_FERMA) && SPIE.SOGLIA_VISTA_FERMA > 0
     && SPIE.SOGLIA_VISTA_FERMA <= TETTO_UMANO,
    `la soglia si legge dal sorgente (${SPIE.SOGLIA_VISTA_FERMA} ms) e sta dentro il tetto umano (${TETTO_UMANO} ms)`);
  const seme = semeCon((s) => {
    s.postazioni = [{ id: "po-1", nome: "Forno", gruppi: ["Pizze"], sedeId: FM.id }];
  });
  const G = await apriCon(seme);
  await login(G.p, "OpCucina", "3333");
  await vaiA(G.p, "Comande");
  await G.p.waitForTimeout(1200);
  /* ci si SIEDE: senza una sedia la schermata e' «Scegli la tua postazione»
     e il vuoto della coda non si vede nemmeno */
  await G.p.getByRole("button", { name: /Siediti a Forno/ }).first().click().catch(() => {});
  await G.p.waitForTimeout(900);
  const riga = G.p.locator("[data-eta-vista]").first();
  ok((await riga.count()) > 0, "la riga dell'eta' della vista c'e', in cima a Comande");
  const leggi = async () => {
    const n = await riga.getAttribute("data-eta-vista").catch(() => null);
    return n == null ? null : +n;
  };
  const prima = await leggi();
  ok(prima != null && prima >= 0, `e porta l'eta' in secondi (${prima})`);
  /* la riga c'e' anche quando non c'e' NIENTE da fare: e' tutto il punto */
  ok(/nessuna comanda in coda/i.test(await testoDi(G.p)),
    "e c'e' anche a coda vuota, dove il vuoto da solo non dice niente");
  await G.p.evaluate(() => { window.__sospendi = true; });
  /* la pazienza NON si calcola dalla soglia letta: si tetta in orologio vero */
  const soglia = Math.min(Math.ceil((SPIE.SOGLIA_VISTA_FERMA || 47000) / 1000),
                          Math.ceil(TETTO_UMANO / 1000));
  const ambra = await finche(G.p, async () => {
    const n = await leggi();
    if (n == null || n <= soglia) return false;
    const cl = await riga.getAttribute("data-eta-ferma").catch(() => null);
    return cl === "1";
  }, (soglia + 25) * 1000, 1000);
  ok(ambra, `con la rete sospesa l'eta' supera la soglia (${soglia} s) e la riga lo dichiara`);
  await G.ctx.close();
});

/* ═══ 11. IL RIPRISTINO NON RIPORTA INDIETRO LA LISTA DEI TELEFONI ═══
   Il battito non e' un dato di dominio, e' una spia di ADESSO. Il punto di
   ripristino congela lo stato INTERO, e «ripristina» cancella ogni chiave
   della bozza e ci mette sopra il backup: senza la riga che lo conserva, un
   backup di tre settimane fa resusciterebbe righe con la versione di allora
   — e la scheda accuserebbe di essere indietro telefoni che nel frattempo
   hanno ricaricato, proprio nel minuto in cui qualcuno la guarda davvero.
   Questa sezione e' nata da un sabotaggio MUTO: togliendo quella riga non
   diventava rosso niente. */
console.log("\n— 11. un ripristino non resuscita i telefoni del backup —");
await prova("§11", async () => {
  const VECCHIO = { "d-fantasma": { v: "gen-0.01", r: 1, t: Date.now() - 21 * 24 * 3600000 } };
  const seme = semeCon((x) => { x.vendite = []; x.telefoni = {}; });
  const dentro = JSON.parse(seme);
  const G = await apriCon(seme);   // apre DAVVERO la pagina: senza, localStorage non esiste
  /* il punto di ripristino: l'indice piu' la copia, come li scrive l'app */
  await G.p.evaluate(([ind, corpo]) => {
    localStorage.setItem("db:scp:backup-indice", ind);
    localStorage.setItem("db:scp:backup:bk-prova", corpo);
  }, [JSON.stringify([{ id: "bk-prova", chiave: "scp:backup:bk-prova", nota: "prova del banco", di: "AdminBanco", t: Date.now() - 1000 }]),
      JSON.stringify({ id: "bk-prova", chiave: "scp:backup:bk-prova", nota: "prova del banco", di: "AdminBanco", t: Date.now() - 1000,
        dati: { ...dentro, telefoni: VECCHIO } })]);
  await login(G.p);
  /* una scrittura vera, cosi' questo dispositivo entra in lista */
  await vaiA(G.p, "Cassa").catch(() => {});
  await vaiA(G.p, "Sistema");
  await G.p.waitForTimeout(800);
  await G.p.getByRole("button", { name: "Ripristina", exact: true }).first().click();
  await G.p.waitForTimeout(500);
  await G.p.getByRole("button", { name: "Ripristina", exact: true }).last().click();
  const fatto = await finche(G.p, async () => {
    const r = await salvato(G.p);
    return !!(r && r.log || []).length >= 0 && (await testoDi(G.p)).length > 0;
  }, 12000);
  ok(fatto, "il ripristino e' partito");
  await G.p.waitForTimeout(2500);
  const rete = await salvato(G.p);
  const tel = rete?.telefoni || {};
  ok(!tel["d-fantasma"],
    `il telefono del backup NON torna in vita (${Object.keys(tel).join(", ") || "lista vuota"})`);
  ok(Object.values(tel).every((r) => r.v === SPIE.VERSIONE),
    "e in lista restano solo righe della versione di adesso");
  await G.ctx.close();
});

/* ═══ 10. I BANCHI CHE DEVONO RESTARE VERI ═══
   Il documento (I COLLAUDI §11) elenca cosa il disegno non deve rompere.
   Qui si tiene fermo il numero che potaturatest §9 conta: se il battito
   fosse finito dentro applicaCoda, quel banco sarebbe diventato rosso da
   un'altra parte e nessuno avrebbe saputo perche'. */
console.log("\n— 10. il disegno non tocca quello che il documento dichiara intoccabile —");
await prova("§10", async () => {
  const blocchi = (src.match(/b\.clienti = sfoltisciClienti\(/g) || []).length;
  ok(blocchi === 3, `i tre blocchi gemelli di potatura sono ancora tre (${blocchi})`);
  const coda = corpoDi("const applicaCoda = (base)");
  ok(!/telefoni/.test(coda),
    "e il battito NON e' finito dentro applicaCoda: sta dove nasce la revisione nuova");
  /* il timbro sta dentro scriviRemoto, che e' l'imbuto VERO: sincronizza
     non e' l'unico che scrive: il seed del primo avvio scrive da un'altra
     parte, e li' un timbro mancante sarebbe passato inosservato */
  const scrivi = src.slice(src.indexOf("async function scriviRemoto(stato)"), src.indexOf("async function scriviRemoto(stato)") + 900);
  ok(/battito\(/.test(scrivi), "il battito si timbra dentro scriviRemoto, da cui passano TUTTE le scritture");
});

/* ═══ 12. LA BUGIA CON LA LINEA IN PIEDI ═══
   Trovato aprendo il sabotaggio S14 dell'11 settembre, uscito MUTO — e il
   muto valeva piu' del sabotaggio, perche' S14 rimette esattamente l'errore
   che i cinque revisori mi avevano fatto togliere dal disegno.
   §8 e §9 dimostrano che il numero e' vivo TAGLIANDO la linea: con
   __sospendi ogni lettura resta appesa, quindi non succede nessun giro — ne'
   magro ne' pieno — e il timbro sbagliato non ha nemmeno l'occasione di
   scattare. Ma la bugia che questo rilascio esiste per togliere vive con la
   LINEA IN PIEDI: il giro magro chiede venti byte, la lista non la chiede
   nessuno, e timbrare «confermata adesso» li' e' precisamente il risveglio
   da schermo spento che scrive «aggiornata adesso» sul tablet ripreso in
   mano dopo venti minuti.
   Un metro che stacca tutto prova «nessun contatto». Il difetto e'
   «contatto, ma solo quello che non chiede la lista». */
console.log("\n— 12. con la linea in piedi ma la lista mai chiesta, l'eta' sale lo stesso —");
await prova("§12", async () => {
  const G = await apriCon(SEME);
  await login(G.p);
  await vaiA(G.p, "Sistema");
  await G.p.waitForTimeout(1200);
  const eta = async () => {
    const m = (await testoDi(G.p)).match(/allineamento[^0-9]{0,40}(\d+)\s*s/i);
    return m ? +m[1] : null;
  };
  const magri = async () => {
    const m = (await testoDi(G.p)).match(/giri leggeri consecutivi:\s*(\d+)/i);
    return m ? +m[1] : null;
  };
  await G.p.evaluate(() => { window.__soloSpia = true; });
  /* PRIMA il testimone, o tutto il resto sarebbe verde per assenza: se
     __soloSpia non facesse niente non ci sarebbe nessun giro magro, l'eta'
     salirebbe comunque, e il controllo passerebbe senza aver provato niente.
     E' lo stesso errore di «__proto__» scritto come letterale. */
  const contatto = await finche(G.p, async () => (await magri()) >= 2, 30000, 700);
  ok(contatto, "la linea E' in piedi: i giri magri salgono, la chiave da venti byte risponde");
  /* e con la linea in piedi l'eta' dell'ultimo allineamento sale lo stesso,
     perche' un giro magro non ha CHIESTO la lista: non conferma niente */
  const salita = await finche(G.p, async () => (await eta()) > 8, 30000, 700);
  ok(salita, "e l'eta' dell'ultimo allineamento supera gli 8 s: il giro magro non la timbra");
  await G.ctx.close();
  /* e la stessa cosa sulla riga di Comande, che e' dove la legge la cucina */
  const seme = semeCon((s) => {
    s.postazioni = [{ id: "po-1", nome: "Forno", gruppi: ["Pizze"], sedeId: FM.id }];
  });
  const H = await apriCon(seme);
  await login(H.p, "OpCucina", "3333");
  await vaiA(H.p, "Comande");
  await H.p.waitForTimeout(1200);
  await H.p.getByRole("button", { name: /Siediti a Forno/ }).first().click().catch(() => {});
  await H.p.waitForTimeout(900);
  const riga = H.p.locator("[data-eta-vista]").first();
  ok((await riga.count()) > 0, "la riga dell'eta' c'e' anche qui");
  await H.p.evaluate(() => { window.__soloSpia = true; });
  const su = await finche(H.p, async () => {
    const n = await riga.getAttribute("data-eta-vista").catch(() => null);
    return n != null && +n > 8;
  }, 30000, 700);
  ok(su, "e in cima a Comande l'eta' supera gli 8 s con la linea in piedi");
  await H.ctx.close();
});

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 6)) console.log("   ·", e.slice(0, 160));
await b.close();
srv.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
