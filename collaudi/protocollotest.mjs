/* LA RICEVUTA DI CONSEGNA (gen-6.20) — il banco col browser.

   IL DIFETTO CHE CHIUDE (#40, «la finestra cieca dell'exactly-once»). Quando la
   rete fa le bizze, una vendita resta in coda e si rigioca. Per sapere se era
   gia' arrivata, oggi l'app la CERCA in liste potate: s.applicate (MAX_APPLICATE
   = 1200) e s.vendite (MAX_VENDITE = 300 piu' 48 ore). Nelle serate piene quelle
   liste si consumano, il telefono non sa piu', rigioca, e lo scontrino si conta
   DUE VOLTE nel totale della giornata. Da gen-6.20 ogni scrittura parte con un
   numero di protocollo e lo stato porta una mappa {mittente: ultima rev sua}: al
   ritorno il telefono legge il PROPRIO slot, e se copre il numero stampato la
   voce e' DIMOSTRATA consegnata. Niente orologi, niente liste potate.

   ═══ QUESTO BANCO E' SCRITTO SULLA CORREZIONE, NON SUL DISEGNO ═══
   Il disegno di record e' del 9 settembre (progetti/finestra-cieca.md) ed e'
   stato rimesso sotto processo contro gen-6.19: 33 accuse, 14 ALTE, zero
   confutate. Le sezioni qui sotto seguono «LA CORREZIONE DEL 15 SETTEMBRE» in
   fondo a quel file. In particolare, e va detto prima di leggere:
   · §1 gira in DUE contesti, con e senza window.auth, con UN SOLO corpo. Il
     disegno prescriveva solo l'intestatura di gen607test, cioe' window.auth, e
     con window.auth l'avvio esce al ramo sicuro: l'aggancio sul ramo CLASSICO
     sarebbe nato senza un solo collaudo che lo veda cernere qualcosa.
   · §1b esiste perche' §1 semina mitt e prot SUL DISCO: il ritrovamento li porta
     in coda intatti e il timbro dell'app non viene esercitato nemmeno una volta.
     Senza §1b, cancellare il timbro lascerebbe §1 verde in tutte le asserzioni.
   · §6a usa il FRENO. Leggere scp:coda:v1 a ciclo finito NON distingue «timbro
     prima dell'attesa» da «timbro subito dopo»: e' soddisfatto da tutte e due, e
     il secondo e' esattamente la posizione sbagliata. Col freno la set resta
     appesa e si legge il disco DALLA PAGINA VIVA, mentre il ciclo e'
     dimostrabilmente fermo dentro l'await.
   · §7 e §12 sono le due PERDITE che la demolizione ha trovato nel disegno: il
     numero costruito sull'ultima rev confermata invece che sull'ultimo protocollo
     stampato, e la ricevuta costruita dalla lettura invece che dalla bozza. Tutte
     e due, sul disegno non corretto, fanno sparire un incasso vero.
   · NON si pretende «rete.vendite.length === 300» dopo il giro. Quella riga si
     INVERTE: con la tessera montata la voce e' consegnata, la coda si svuota,
     sincronizza non scrive e la lista resta com'era; su gen-6.19 la voce si
     rigioca e 299+1 fa 300. Premierebbe il difetto. La fedelta' della scena si
     prova sul SEME, prima che la pagina parta.

   COME SI GIRA: node protocollotest.mjs — servito su http (MAI file://: su
   origine opaca ogni pagina puo' ricevere un'archiviazione sua, ed e' la lezione
   scritta col sangue in gen607test.mjs:47-58). NIENTE DATI VERI: nomi, prezzi e
   numeri inventati. */
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
/* ── SI PUO' GIRARE UNA SEZIONE SOLA, E SERVE AI SABOTAGGI ──
   Il giro intero costa una decina di minuti: moltiplicato per venti sabotaggi
   farebbe mezza giornata, e un conto dei sabotaggi che nessuno ha il tempo di
   rifare e' un conto che dopo il primo giro non si rifa' piu'. Con
   SEZIONI=6,6a si gira solo quello che il sabotaggio promette di arrossire,
   piu' i controlli che devono restare verdi. SENZA la variabile gira tutto, e
   il censimento non sa nemmeno che esista. */
const SOLO = (process.env.SEZIONI || "").split(",").map((x) => x.trim()).filter(Boolean);
const vuole = (nome) => {
  if (!SOLO.length) return true;
  const t = String(nome).replace(/^§/, "").split(" ")[0];
  return SOLO.includes(t) || SOLO.includes(String(nome).replace(/^§/, ""));
};
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
for (const a of [moz, sug]) a.qty = 50;
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

const giornoDiT = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
/* ── L'ORA SI AGGANCIA AL GIORNO, NON ALL'OROLOGIO (la trappola di mezzanotte,
     chiusa a gen-6.18 dentro spietest): «N ore fa» alle 00:35 e' IERI, e un
     controllo che semina cosi' diventa rosso novanta minuti ogni notte. ── */
const oraDiOggi = (minutiFa) => {
  const m = new Date(); m.setHours(0, 1, 0, 0);
  return Math.max(Date.now() - minutiFa * 60000, m.getTime());
};
const vendita = (id, t, totale) => ({
  id, t, giorno: giornoDiT(t), sedeId: FM.id, chi: "OpCassa", n: 1, metodo: "contanti",
  stato: "registrata", totale, righe: [{ voceId: "li-mar", nome: "Margherita", qty: 1, prezzo: totale, aliquota: 10 }],
  scarico: [{ magId: linea.id, prodottoId: moz.prodottoId, quanto: 1, uomId: moz.uomId }],
});
const giornata = (t, totale, n) => ({ id: giornoDiT(t) + "|" + FM.id, giorno: giornoDiT(t), sedeId: FM.id,
  totale, nVendite: n, nStorni: 0, metodi: { contanti: totale, carta: 0, altro: 0 } });
/* ── LE 300 RIGHE SERVONO ALLA FEDELTA' DELLA SCENA, NON AL MECCANISMO ──
   E' cosi' che i due testimoni muoiono in servizio vero: la lista si consuma e
   la guardia di applicaVendita diventa cieca. Il protocollo pero' non guarda
   NESSUNA lista: §1 resta verde anche seminando s.vendite = []. Chi legge deve
   saperlo, se no crede che questo banco stia collaudando un tetto. */
const riempi = (n, daT, passoMs) => Array.from({ length: n }, (_, i) => vendita("ve-riemp-" + i, daT + i * passoMs, 1));

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];

/* ═══════════ IL FINTO SERVER ═══════════
   Cinque cose che nessun banco esistente sa fare, e senza le quali meta' delle
   sezioni qui sotto misurerebbero altro. Tutte e cinque sono manopole della
   PAGINA, non dell'origine: §12, §12b e §14 aprono due schermi nello stesso
   contesto e devono poter spegnere la rete a uno solo dei due.
   (a) IL CANCELLO revBase. gen607test scrive sempre e comunque: su quel server
       ogni scrittura riesce, quindi qualunque sezione sul protocollo misurerebbe
       un server che dice sempre di si'. Le sei righe sono quelle gia' verdi di
       duetelefonitest.mjs:48-55, portate DENTRO la pagina.
   (b) __perdiRisposta(n): la scrittura ATTERRA e al telefono si risponde di no,
       n volte. Il __scriviUnaSola di gen607test fa solo il primo colpo e poi
       lascia la rete morta per sempre, che non basta.
   (c) __revStantia(n): a storage.get si consegna la copia dello stato com'era n
       scritture fa. Nessuno dei 111 banchi sa farlo — sanno far fallire la rete
       e perdere la risposta, non consegnare una copia vecchia.
   (d) __frena()/__rilascia() piu' __inSet(): la set resta APPESA e si puo'
       leggere il disco dalla pagina viva mentre il ciclo e' fermo dentro
       l'await. E' l'unico modo di distinguere «timbro prima dell'attesa» da
       «timbro subito dopo», ed e' la meta' del rischio che il disegno diceva di
       proteggere e non proteggeva.
   (e) __uccidiLettura(x): il get LANCIA. E' l'unico modo di far nascere il
       GUSCIO di gen-6.16 (app.jsx:16986-16987) dentro entra(), cioe' la base
       marcata su cui la cernita non deve giudicare niente (§9). */
const apri = async ({ seme, coda = null, auth = true, ctx: riusa = null, extra = null, disco = null, chi = "OpCassa" } = {}) => {
  const ctx = riusa || await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  if (!riusa) await ctx.addInitScript(([j, c, conAuth, ex, di]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    if (!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1", j);
    if (c && !localStorage.getItem("prova:coda-messa")) {
      localStorage.setItem("scp:coda:v1", c);
      localStorage.setItem("prova:coda-messa", "1");
    }
    /* altre chiavi del finto server (i punti di ripristino di §12) e altre
       chiavi del disco del telefono (le ferme di §15): si scrivono solo se
       non ci sono gia', cosi' una pagina nuova nello stesso contesto non
       cancella quello che la prima ha fatto */
    if (ex) { const o = JSON.parse(ex); for (const k of Object.keys(o)) if (!localStorage.getItem("db:" + k)) localStorage.setItem("db:" + k, o[k]); }
    if (di) { const o = JSON.parse(di); for (const k of Object.keys(o)) if (!localStorage.getItem(k)) localStorage.setItem(k, o[k]); }
    const CH = "scp:stato:v1";
    /* ── LE MANOPOLE SONO DELLA PAGINA, NON DELL'ORIGINE ──
       Rete morta, lettura morta, risposta persa, lettura stantia e freno sono
       variabili di QUESTO caricamento e non chiavi di localStorage. Due
       ragioni, e la seconda vale piu' della prima:
       · §12, §12b e §14 aprono DUE pagine nello stesso contesto e devono
         spegnere la rete a UNO solo dei due schermi; con le bandiere sul disco
         spegnerebbero tutti e due e la scena non esisterebbe;
       · e' anche la verita' del mondo: la connessione ce l'ha il telefono, non
         il negozio.
       Restano sul disco condiviso le due cose che descrivono il SERVER e non
       il telefono: i contatori (prova:conta) e la pellicola delle scritture
       (prova:foto), da cui esce la copia vecchia di __revStantia. */
    let reteMorta = false, letturaMorta = false, perdi = 0, stantia = 0, frenata = false, inSet = 0, atteso_ = null;
    let mutoDopo = false;
    window.__conta = () => { try { return JSON.parse(localStorage.getItem("prova:conta") || "{}"); } catch { return {}; } };
    const segna = (k) => { try { const q = window.__conta(); q[k] = (q[k] || 0) + 1; localStorage.setItem("prova:conta", JSON.stringify(q)); } catch {} };
    window.__uccidiRete = (x) => { reteMorta = !!x; };          /* le scritture rifiutate */
    window.__uccidiLettura = (x) => { letturaMorta = !!x; };    /* il get lancia: e' cosi' che nasce un guscio */
    window.__perdiRisposta = (n) => { perdi = n || 0; };        /* (b) atterra e risponde di no, n volte */
    window.__revStantia = (n) => { stantia = n || 0; };         /* (c) il get consegna la copia di n scritture fa */
    window.__frena = () => { frenata = true; };                 /* (d) la set su CHIAVE resta appesa */
    window.__rilascia = () => { frenata = false; if (atteso_) { const f = atteso_; atteso_ = null; f(); } };
    window.__inSet = () => inSet;
    /* (f) __mutoDopoPersa(): appena una scrittura atterra e la risposta si
       perde, il telefono diventa CIECO anche in lettura. Non e' un lusso: senza,
       la riprova che parte mezzo secondo dopo RITIMBRA la coda con un numero
       piu' alto, e da quel momento nessuno slot vecchio puo' piu' certificare
       niente — cioe' la scena che serve a §12 si ripara da sola prima di
       esistere. E' anche il caso vero: la linea cade proprio mentre si salva. */
    window.__mutoDopoPersa = (x) => { mutoDopo = !!x; };
    /* la fotografia dello stato PRIMA di ogni scrittura: e' da qui che esce la
       copia vecchia di __revStantia. Sta sul disco perche' e' la storia del
       SERVER, e due pagine devono vederne una sola. */
    const scatta = (v) => {
      try {
        const a = JSON.parse(localStorage.getItem("prova:foto") || "[]");
        a.push(v); localStorage.setItem("prova:foto", JSON.stringify(a.slice(-12)));
      } catch {}
    };
    const revInRete = () => { try { return JSON.parse(localStorage.getItem("db:" + CH) || "{}").rev || 0; } catch { return 0; } };

    const leggi = (k) => {
      segna("get");
      if (letturaMorta) throw new Error("lettura morta (finta)");
      if (k === CH && stantia > 0) {
        segna("get-stantia");
        try {
          const a = JSON.parse(localStorage.getItem("prova:foto") || "[]");
          const v = a[Math.max(0, a.length - stantia)];
          if (v != null) return { value: v };
        } catch {}
      }
      const v = localStorage.getItem("db:" + k);
      return v == null ? null : { value: v };
    };
    const scrivi = async (k, v) => {
      segna("set");
      if (reteMorta) throw new Error("rete morta (finta)");
      if (k === CH) {
        inSet++;
        if (frenata) await new Promise((r) => { atteso_ = r; });
        /* (a) IL CANCELLO revBase, le sei righe di duetelefonitest */
        let atteso = null; try { atteso = JSON.parse(v).revBase; } catch {}
        if (atteso != null && localStorage.getItem("db:" + CH) && revInRete() !== atteso) {
          segna("rifiutata-40001");
          return { code: "40001", message: "conflitto (finto)", details: null, hint: null };
        }
        scatta(localStorage.getItem("db:" + CH));
      }
      localStorage.setItem("db:" + k, v);
      if (k === CH && perdi > 0) {
        perdi--;
        if (mutoDopo) letturaMorta = true;
        segna("atterrata-senza-risposta");
        /* la scrittura E' passata; al telefono si risponde di no, e la spia
           scp:rev:v1 resta indietro perche' scriviRemoto la scrive DOPO */
        throw new Error("risposta persa (finta)");
      }
      return true;
    };

    if (conAuth) {
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
    } else {
      window.storage = {
        async get(k) { return leggi(k); },
        async set(k, v) { return scrivi(k, v); },
        async delete(k) { localStorage.removeItem("db:" + k); return true; },
      };
    }
  }, [JSON.stringify(seme), coda ? JSON.stringify(coda) : null, !!auth,
      extra ? JSON.stringify(extra) : null, disco ? JSON.stringify(disco) : null]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await vai(p, chi);
  return { p, ctx };
};
async function vai(p, chi = "OpCassa") {
  await p.goto(URL_APP);
  await p.getByText(chi, { exact: true }).first().waitFor({ state: "visible", timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(400);
}
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
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const salvato = (p) => p.evaluate(() => { const v = localStorage.getItem("db:scp:stato:v1"); return v ? JSON.parse(v) : null; });
const codaSalvata = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("scp:coda:v1") || "null"); } catch { return "ILLEGGIBILE"; } });
const fermeSalvate = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("scp:coda-ferma:v1") || "[]"); } catch { return "ILLEGGIBILE"; } });
const finche = async (p, quando, ms = 14000, passo = 150) => {
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
/* il ricaricamento si fa con una PAGINA NUOVA nello stesso contesto: e' lo
   stesso caso per l'app (un montaggio da zero che ritrova il disco di prima) ed
   e' ripetibile, mentre p.goto sullo stesso file:// non lo era (gen607test) */
const riapri = async (g) => {
  const prima = await g.p.evaluate(() => localStorage.getItem("scp:coda:v1"));
  const nuova = await g.ctx.newPage();
  nuova.on("pageerror", (e) => errs.push(e.message));
  await g.p.close().catch(() => {});
  g.p = nuova;
  await vai(nuova);
  const dopo = await nuova.evaluate(() => localStorage.getItem("scp:coda:v1"));
  if (prima && dopo === null) throw new Error("BANCO GUASTO: il disco si e' azzerato fra le due pagine");
  return nuova;
};

/* ═══════════ ATTREZZI DELLE SEZIONI ═══════════ */
/* ORE e MIN sono CRUDE, senza l'aggancio a mezzanotte di oraDiOggi: qui il
   dato e' l'ETA' della voce (lo steccato delle 48 ore, la lista che si
   consuma), non il giorno di calendario. Il «giorno» di ogni vendita esce
   comunque dal suo t, quindi la giornata e la riga restano coerenti fra loro
   anche quando il t cade ieri o l'altro ieri — che e' esattamente il caso che
   queste sezioni devono mettere in scena. */
const ORE = (h) => Date.now() - h * 3600000;
const MIN = (m) => Date.now() - m * 60000;
const semeCon = (f) => {
  const s = JSON.parse(JSON.stringify(base0));
  s.profili = [PRC, PRA];
  s.rev = 100; s.mtime = Date.now();
  if (f) f(s);
  return s;
};
const euroIt = (n) => n.toFixed(2).replace(".", ",");
const voceVendita = (v, extra = {}) => ({
  tipo: "vendita", dati: v, descr: `Vendita in cassa: € ${euroIt(v.totale)} (contanti)`,
  chi: "OpCassa", t: v.t, logId: "l-" + v.id, ...extra,
});
const voceStorno = (orig, extra = {}) => ({
  tipo: "storno",
  dati: { origId: orig.id, stornoId: "st-" + orig.id, t: MIN(1), chi: "OpCassa",
    motivo: "battuta due volte", autorizzataDa: "Admin" },
  descr: `Storno di € ${euroIt(orig.totale)}: battuta due volte`,
  chi: "OpCassa", t: MIN(1), logId: "l-st-" + orig.id, ...extra,
});
const finti = (n) => Array.from({ length: n }, (_, i) => "l-finta-" + i);
const qtyDi = (r, pid) => {
  const m = (r.magazzini || []).find((x) => x.id === linea.id);
  const a = m && (m.articoli || []).find((x) => x.prodottoId === pid);
  return a ? a.qty : null;
};
const giornDi = (r, t) => (r.giornate || []).find((g) => g.id === giornoDiT(t) + "|" + FM.id) || null;
const logDi = (r) => (r.log || []).map((x) => x.msg || "").join(" | ");
const conta = (p) => p.evaluate(() => window.__conta());
const finita = async (g) => { try { await g.ctx.close(); } catch {} };
const quante = (r, id) => (r.vendite || []).filter((v) => v && v.id === id).length;

/* la scena di §1, §2 e §5: liste PIENE (il tetto consumato, che e' il difetto
   40 nella vita vera) e una vendita di 36 ore in coda, gia' atterrata */
const t36 = ORE(36);
const Vcieca = vendita("ve-cieca", t36, 33);
const semeCieca = (mappa) => semeCon((s) => {
  if (mappa) s.scritture = mappa;
  s.vendite = riempi(300, ORE(6), 60000);
  s.applicate = finti(300);
  s.giornate = [giornata(t36, 120, 9)];
});
const codaCieca = (extra = {}) => [voceVendita(Vcieca, { mitt: "dev-D", prot: 100, logId: "l-cieca", ...extra })];

/* ═══ 1. CONSEGNATA — il caso che oggi fa uscire i soldi due volte ═══
   UN SOLO CORPO, DUE CONTESTI. Il disegno prescriveva solo l'intestatura di
   gen607test, cioe' window.auth; ma con window.auth l'IIFE d'avvio esce al
   ramo sicuro (app.jsx:16851 -> 16863) e il ramo CLASSICO (16880-16891), dove
   va il terzo aggancio, non viene MAI eseguito. Contati il 15 settembre: 111
   file *test.mjs, 7 con window.auth e 93 senza, e dei 93 nessuno semina una
   coda timbrata. Un aggancio senza un collaudo che lo veda cernere qualcosa
   e' un aggancio che si puo' cancellare restando verdi. */
console.log("\n— 1. la voce gia' atterrata esce dalla coda senza rigiocarsi —");
const corpo1 = async (conAuth) => {
  const eti = conAuth ? "sicuro" : "classico";
  const g = await apri({ seme: semeCieca({ "dev-D": 100 }), coda: codaCieca(), auth: conAuth });
  await login(g.p);
  await finche(g.p, async () => (await codaSalvata(g.p)) === null, 15000);
  await g.p.waitForTimeout(1200);      /* se una scrittura partisse lo stesso, qui si vede */
  const r = await salvato(g.p);
  ok(!(r.applicate || []).includes("l-cieca"),
    `§1 (${eti}): «l-cieca» NON entra in applicate — si guarda il TIMBRO, non «la riga non c'e' in rete», che sarebbe verde per caso`);
  const gg = giornDi(r, t36);
  ok(!!gg && gg.totale === 120 && gg.nVendite === 9,
    `§1 (${eti}): la giornata di 36 ore fa resta 120,00 e 9 vendite (letto: ${gg && gg.totale} / ${gg && gg.nVendite})`);
  ok(qtyDi(r, moz.prodottoId) === 50, `§1 (${eti}): il magazzino non scende di un altro pezzo`);
  ok((await codaSalvata(g.p)) === null, `§1 (${eti}): la voce esce anche dal disco`);
  ok(((await fermeSalvate(g.p)) || []).length === 0,
    `§1 (${eti}): scp:coda-ferma:v1 resta VUOTA — un incasso gia' in cassa non si manda «a mano»`);
  ok(!/Vendita in cassa/.test(logDi(r)), `§1 (${eti}): nessuna riga «Vendita in cassa» nuova nello storico`);
  await finita(g);
};
await prova("§1 sicuro", () => corpo1(true));
await prova("§1 classico", () => corpo1(false));

/* ═══ 1b. IL TIMBRO E' DELL'APP, NON DEL BANCO ═══
   §1 semina mitt e prot SUL DISCO: il ritrovamento li porta in coda intatti e
   il `for` del timbro non gira nemmeno una volta. Senza questa sezione,
   cancellare il timbro lascerebbe §1 verde in tutte le sue asserzioni. */
console.log("\n— 1b. il numero lo stampa l'app —");
await prova("§1b", async () => {
  const g = await apri({ seme: semeCieca({ "dev-D": 100 }) });
  await login(g.p);
  await g.p.evaluate(() => window.__uccidiRete(true));
  await battiEIncassa(g.p);
  await battiEIncassa(g.p);
  const c = await finche(g.p, async () => {
    const q = await codaSalvata(g.p);
    return Array.isArray(q) && q.length === 2 && q.every((m) => m && m.mitt && m.prot);
  }, 20000);
  ok(c, "§1b: il timbro arriva sul disco anche quando la rete rifiuta la scrittura");
  const q = (await codaSalvata(g.p)) || [];
  const mitt = [...new Set(q.map((m) => m && m.mitt))];
  ok(mitt.length === 1 && mitt[0] != null,
    `§1b: un caricamento, un mittente solo (visti: ${mitt.length}) — e uno vero, se no «tutti undefined» sarebbe verde per caso`);
  ok(mitt[0] !== "dev-D" && mitt[0] != null,
    "§1b: e il mittente NON e' quello del seme — e' questa riga che dimostra che il numero l'ha messo l'app");
  const r = await salvato(g.p);
  ok(q.length === 2 && q.every((m) => Number(m.prot) > (r.rev || 0)),
    "§1b: il protocollo e' piu' alto della rev in rete: nessuno puo' averlo gia' fatto atterrare");
  ok(new Set(q.map((m) => m && m.prot)).size === 1 && q[0] && q[0].prot != null,
    "§1b: le due voci portano lo STESSO numero — la ricevuta certifica la SCRITTURA, non la singola voce");
  await finita(g);
});

/* ═══ 2. NON CONSEGNATA — il contro-controllo che vieta «nel dubbio ferma» ═══ */
console.log("\n— 2. slot indietro: la vendita si applica —");
await prova("§2", async () => {
  const g = await apri({ seme: semeCieca({ "dev-D": 99 }), coda: codaCieca() });
  await login(g.p);
  await finche(g.p, async () => ((await salvato(g.p)).applicate || []).includes("l-cieca"), 25000);
  const r = await salvato(g.p);
  ok((r.applicate || []).includes("l-cieca"), "§2: lo slot dice 99 e il timbro 100: NON consegnata, si rigioca");
  const gg = giornDi(r, t36);
  ok(!!gg && gg.totale === 153 && gg.nVendite === 10,
    `§2: la giornata sale ESATTAMENTE del suo totale, una volta (letto: ${gg && gg.totale} / ${gg && gg.nVendite})`);
  ok(qtyDi(r, moz.prodottoId) === 49, "§2: e il magazzino scende di uno");
  await finita(g);
});

/* ═══ 3. MAI TENTATA — la trappola che l'orizzonte chiudeva con l'eta' ═══ */
console.log("\n— 3. la voce di due minuti fa —");
await prova("§3", async () => {
  const Vnuova = vendita("ve-appena", MIN(2), 12);
  const g = await apri({ seme: semeCieca({ "dev-D": 100 }),
    coda: [voceVendita(Vnuova, { logId: "l-appena" })] });
  await login(g.p);
  await finche(g.p, async () => quante(await salvato(g.p), "ve-appena") === 1, 25000);
  const r = await salvato(g.p);
  ok(quante(r, "ve-appena") === 1, "§3: senza prot non e' mai partita: si rigioca e arriva in rete");
  ok(qtyDi(r, moz.prodottoId) === 49, "§3: e il magazzino scende di uno");
  ok((r.applicate || []).includes("l-appena"), "§3: col suo nome in applicate, che e' la rete di sicurezza di oggi");
  await finita(g);
});

/* ═══ 4. SLOT ASSENTE = COMPORTAMENTO DI OGGI ═══
   Mappa nuova, nessuno slot: la decisione torna allo steccato d'eta' e alle
   due guardie sul dato. Mai peggio di oggi, mai un parcheggio inventato. */
console.log("\n— 4. «non si sa» non vuol dire «buttala» —");
await prova("§4", async () => {
  const Vgia = vendita("ve-gia", MIN(30), 20);
  const Vmai = vendita("ve-mai", MIN(25), 15);
  const g = await apri({
    seme: semeCon((s) => {
      s.scritture = {};
      s.vendite = [Vgia, ...riempi(50, ORE(6), 60000)];
      s.applicate = finti(50);
      s.giornate = [{ id: giornoDiT(Vgia.t) + "|" + FM.id, giorno: giornoDiT(Vgia.t), sedeId: FM.id,
        totale: 20, nVendite: 1, nStorni: 0, metodi: { contanti: 20, carta: 0, altro: 0 } }];
    }),
    coda: [voceVendita(Vgia, { mitt: "dev-D", prot: 100, logId: "l-gia" }),
      voceVendita(Vmai, { mitt: "dev-D", prot: 100, logId: "l-mai" })],
  });
  await login(g.p);
  await finche(g.p, async () => (await codaSalvata(g.p)) === null, 25000);
  const r = await salvato(g.p);
  const gg = giornDi(r, Vgia.t);
  ok(!!gg && gg.totale === 35 && gg.nVendite === 2,
    `§4: la giornata sale SOLO della voce mai arrivata (20 + 15), non di quella gia' in rete (letto: ${gg && gg.totale} / ${gg && gg.nVendite})`);
  ok(quante(r, "ve-gia") === 1, "§4: la riga gia' in rete resta una sola — la guardia sul dato fa il suo mestiere");
  ok(quante(r, "ve-mai") === 1, "§4: e quella mai arrivata si rigioca lo stesso");
  await finita(g);
});

/* ═══ 5. IL NUMERO GLOBALE NON E' IL MIO NUMERO ═══ */
console.log("\n— 5. un altro telefono non fa da garante per me —");
await prova("§5", async () => {
  const g = await apri({ seme: semeCieca({ "dev-E": 100, "dev-D": 99 }), coda: codaCieca() });
  await login(g.p);
  await finche(g.p, async () => ((await salvato(g.p)).applicate || []).includes("l-cieca"), 25000);
  const r = await salvato(g.p);
  ok((r.applicate || []).includes("l-cieca"),
    "§5: «dev-E» e' a 100 ma il mio slot dice 99: si rigioca — il confronto e' sullo slot del MITTENTE, non sulla rev");
  const gg = giornDi(r, t36);
  ok(!!gg && gg.nVendite === 10, "§5: e la vendita entra una volta sola");
  await finita(g);
});

/* ═══ 6. LA RISPOSTA PERSA SI CHIUDE DA SOLA ═══
   E' il caso per cui il protocollo esiste: la scrittura atterra, il telefono
   riceve un no, e dopo un riavvio deve poter chiedere «la mia 812 e'
   atterrata?». Oggi la risposta la danno solo i due testimoni potati. */
console.log("\n— 6. la scrittura atterrata e la risposta persa —");
await prova("§6", async () => {
  let g = await apri({ seme: semeCon((s) => { s.scritture = {}; }) });
  await login(g.p);
  /* la stantia si accende INSIEME alla risposta persa, e non e' un secondo
     difetto: e' il modo di tenere il telefono cieco senza gare col cronometro.
     Senza, la riprova che parte mezzo secondo dopo legge fresco, trova il
     logId in applicate e chiude il caso con la scorciatoia — e la prima meta'
     di questa sezione misurerebbe una coda gia' svuotata invece del timbro.
     La pellicola e' vuota prima della battuta, quindi la scrittura che DEVE
     atterrare legge comunque fresco. */
  await g.p.evaluate(() => { window.__perdiRisposta(1); window.__revStantia(1); });
  await battiEIncassa(g.p);
  const atterrata = await finche(g.p, async () => ((await salvato(g.p)).vendite || []).length === 1, 20000);
  ok(atterrata, "§6: la scrittura E' atterrata (la scena: il server ha scritto, il telefono ha ricevuto un no)");
  ok(((await conta(g.p))["atterrata-senza-risposta"] || 0) === 1,
    "§6: e la risposta si e' persa ESATTAMENTE una volta — se questa non e' 1, l'attrezzo (b) non sta facendo il suo mestiere");
  const q = (await codaSalvata(g.p)) || [];
  ok(q.length === 1 && q[0] && q[0].mitt && q[0].prot,
    "§6: sul disco la voce porta mitt e prot: al risveglio si potra' chiedere se e' atterrata");
  const rete1 = await salvato(g.p);
  const idV = (rete1.vendite || [])[0] && rete1.vendite[0].id;
  /* IL RIAVVIO. Da qui in poi il telefono non ha piu' nessuna memoria in RAM:
     tutto quello che sa e' scritto su scp:coda:v1. La pagina nuova nasce col
     suo finto server pulito, quindi la stantia muore col caricamento. */
  await riapri(g);
  await login(g.p);
  await finche(g.p, async () => (await codaSalvata(g.p)) === null, 25000);
  await g.p.waitForTimeout(1200);
  const r = await salvato(g.p);
  ok(quante(r, idV) === 1, `§6: dopo il riavvio la vendita e' in rete UNA volta sola (trovate: ${quante(r, idV)})`);
  const gg = giornDi(r, rete1.vendite[0].t);
  ok(!!gg && gg.nVendite === 1 && gg.totale === 6.5,
    `§6: la giornata cresce ESATTAMENTE una volta (letto: ${gg && gg.totale} / ${gg && gg.nVendite})`);
  ok(((await fermeSalvate(g.p)) || []).length === 0, "§6: e niente finisce nelle ferme");
  await finita(g);
});

/* ═══ 6a. IL NUMERO VA SUL DISCO PRIMA DELL'ATTESA ═══
   §6 legge scp:coda:v1 a ciclo FINITO, quindi e' soddisfatta da qualunque
   posizione del timbro che venga eseguita — compresa quella subito DOPO
   l'await, che e' esattamente la posizione che il disegno dichiara sbagliata.
   Col freno la set resta appesa e il disco si legge DALLA PAGINA VIVA, mentre
   il ciclo e' dimostrabilmente fermo dentro l'attesa. E' l'unica sezione che
   misura l'ORDINE invece del contenuto. */
console.log("\n— 6a. il freno: si legge il disco mentre la scrittura e' appesa —");
await prova("§6a", async () => {
  const g = await apri({ seme: semeCon((s) => { s.scritture = {}; }) });
  await login(g.p);
  await g.p.evaluate(() => window.__frena());
  await battiEIncassa(g.p);
  const dentro = await finche(g.p, async () => (await g.p.evaluate(() => window.__inSet())) >= 1, 20000);
  ok(dentro, "§6a: il ciclo e' ENTRATO nella set e ci sta dentro (il freno tiene)");
  const q = (await codaSalvata(g.p)) || [];
  ok(q.length === 1 && q[0] && q[0].mitt && q[0].prot,
    "§6a: e il disco porta GIA' mitt e prot: il timbro sta PRIMA dell'attesa, non dopo");
  const r0 = await salvato(g.p);
  ok((r0.vendite || []).length === 0, "§6a: mentre in rete non e' ancora atterrato niente — la prova che il ciclo e' fermo li'");
  await g.p.evaluate(() => window.__rilascia());
  await finche(g.p, async () => (await codaSalvata(g.p)) === null, 20000);
  const r = await salvato(g.p);
  ok((r.vendite || []).length === 1, "§6a: rilasciato il freno, la vendita atterra una volta sola");
  await finita(g);
});

/* ═══ 7. LA LETTURA STANTIA — LA PRIMA DELLE DUE PERDITE ═══
   Il disegno costruiva il numero su «l'ultima rev che ho fatto atterrare», che
   NON e' conoscibile: lo slot in rete avanza a ogni ATTERRAGGIO, compresi
   quelli la cui risposta si e' persa — che e' l'unico caso per cui la ricevuta
   esiste. Con quel ref, il secondo scontrino prende un numero GIA' usato, e al
   primo giro fresco il proprio slot testimonia per lui: esce dalla coda senza
   essere mai partito. Un incasso vero che sparisce, col pallino verde.
   QUESTA SEZIONE E' VERDE SU gen-6.19, e per un'altra ragione: nuoveInCoda
   conta la voce perche' il suo logId non e' in applicate. Il rosso, quando
   arriva, non e' un difetto di oggi: e' il difetto di una tessera mal fatta.
   La stantia si accende PRIMA della battuta e non dopo, ed e' deliberato: la
   pellicola e' vuota finche' non c'e' una scrittura, quindi la prima scrittura
   legge fresco comunque, e la RIPROVA — quella che oggi chiuderebbe il caso
   con la scorciatoia — legge la copia di prima. Niente gare col cronometro. */
console.log("\n— 7. il numero costruito sulla lettura vecchia —");
await prova("§7", async () => {
  const g = await apri({ seme: semeCon((s) => { s.scritture = {}; }) });
  await login(g.p);
  await g.p.evaluate(() => { window.__perdiRisposta(1); window.__revStantia(1); });
  await battiEIncassa(g.p);
  const atterrata = await finche(g.p, async () => ((await salvato(g.p)).vendite || []).length === 1, 20000);
  ok(atterrata, "§7: la prima vendita atterra e la risposta si perde (e' lei a mettere in rete lo slot)");
  await g.p.waitForTimeout(2500);
  ok(((await codaSalvata(g.p)) || []).length === 1,
    "§7: finche' la lettura e' vecchia la prima vendita RESTA in coda: il telefono non sa di avercela fatta");
  /* il secondo scontrino nasce mentre la lettura e' ancora vecchia: e' lui che
     nel disegno non corretto si prende il numero gia' usato */
  await battiEIncassa(g.p);
  await g.p.waitForTimeout(2500);
  ok(((await codaSalvata(g.p)) || []).length === 2, "§7: e la seconda gli sta accanto, nessuna delle due si perde");
  await g.p.evaluate(() => window.__revStantia(0));
  await finche(g.p, async () => ((await salvato(g.p)).vendite || []).length === 2, 30000);
  const r = await salvato(g.p);
  ok((r.vendite || []).length === 2,
    `§7: tornata fresca la lettura, in rete ci sono DUE vendite — la seconda non e' sparita (trovate: ${(r.vendite || []).length})`);
  const gg = giornDi(r, Date.now());
  ok(!!gg && gg.nVendite === 2 && gg.totale === 13,
    `§7: e la giornata le conta tutte e due, una volta ciascuna (letto: ${gg && gg.totale} / ${gg && gg.nVendite})`);
  await finita(g);
});

/* ═══ 7b. LA REV IN RETE SCENDE PER DAVVERO ═══
   Database ricostruito, riga cancellata, seme nuovo che nasce con rev 1: oggi
   il telefono scrive revBase 1 su una rete a rev 1, il cancello accetta e la
   situazione si cura da sola. Una tessera 7 che LANCIA su remoto.rev <
   baseRef.rev trasformerebbe questo caso in un tablet che non scrive piu' per
   tutta la serata, con la coda che finisce nello steccato delle 48 ore, cioe'
   in una chiave senza lettori. Verde oggi, deve restare verde. */
console.log("\n— 7b. la rete torna indietro davvero: la cassa continua a scrivere —");
await prova("§7b", async () => {
  const g = await apri({ seme: semeCon((s) => { s.scritture = {}; }) });
  await login(g.p);
  await battiEIncassa(g.p);
  await finche(g.p, async () => ((await salvato(g.p)).vendite || []).length === 1, 20000);
  const revPrima = (await salvato(g.p)).rev || 0;
  await g.p.evaluate(() => {
    const v = JSON.parse(localStorage.getItem("db:scp:stato:v1"));
    v.rev = 1; v.revBase = 0;
    localStorage.setItem("db:scp:stato:v1", JSON.stringify(v));
    localStorage.setItem("db:scp:rev:v1", "1");
  });
  await battiEIncassa(g.p);
  const passata = await finche(g.p, async () => ((await salvato(g.p)).vendite || []).length === 2, 30000);
  ok(passata, "§7b: la seconda vendita atterra lo stesso: una rev piu' bassa non e' un motivo per smettere di scrivere");
  const r = await salvato(g.p);
  /* E IL NUMERO NON TORNA INDIETRO CON LEI. La scrittura passa perche' revBase
     e' quello vero (1) e il cancello guarda solo quello; il PROTOCOLLO invece
     riparte da dove ero arrivato io, se no il mio slot vecchio — 101 in una
     rete che adesso conta 2 — testimonierebbe per scritture future che non
     sono mai partite. E' la meta' della cura che il pavimento di sincronizza
     tiene in piedi da solo. */
  ok((r.rev || 0) > revPrima,
    `§7b: e il mio protocollo non torna MAI indietro, nemmeno quando la rete lo fa (prima ${revPrima}, adesso ${r.rev})`);
  ok((await codaSalvata(g.p)) === null, "§7b: la coda si e' svuotata: niente steccato, niente chiave senza lettori");
  await finita(g);
});

/* ═══ 8. FLOTTA MISTA ═══
   Fra due scritture del telefono nuovo si infila un telefono VECCHIO: rilegge,
   non sa niente di «scritture», e riscrive col revBase giusto. E' la prova sul
   banco — non a parole — che la riparazione avanza per dispositivo, senza
   nessun momento in cui la flotta debba essere allineata. */
console.log("\n— 8. un telefono a gen-6.19 in mezzo ai nuovi —");
await prova("§8", async () => {
  const g = await apri({ seme: semeCon((s) => { s.scritture = { "dev-vecchio": 5 }; }) });
  await login(g.p);
  await battiEIncassa(g.p);
  await finche(g.p, async () => ((await salvato(g.p)).vendite || []).length === 1, 20000);
  const prima = await salvato(g.p);
  const mioPrima = Object.keys(prima.scritture || {}).filter((k) => k !== "dev-vecchio")[0] || null;
  /* il telefono vecchio: legge, aggiunge una riga sua, riscrive col revBase
     corretto. Passa dallo stesso cancello di tutti. */
  const passato = await g.p.evaluate(async () => {
    const v = JSON.parse(localStorage.getItem("db:scp:stato:v1"));
    v.revBase = v.rev; v.rev = (v.rev || 0) + 1;
    v.log = [{ id: "l-vecchio", t: Date.now(), chi: "Tablet vecchio", msg: "Scrittura di un telefono che non conosce le ricevute" },
      ...(v.log || [])];
    const r = await window.storage.set("scp:stato:v1", JSON.stringify(v), true);
    return r === true;
  });
  ok(passato, "§8: la scrittura del telefono vecchio passa il cancello (revBase giusto)");
  const dopo = await salvato(g.p);
  ok((dopo.scritture || {})["dev-vecchio"] === 5,
    "§8: la mappa attraversa INTATTA un client che non la conosce (e' «...s» di normalizza, misurato invece che dichiarato)");
  ok(mioPrima != null && (dopo.scritture || {})[mioPrima] != null,
    "§8: e lo slot del telefono nuovo sopravvive alla scrittura del vecchio");
  await battiEIncassa(g.p);
  await finche(g.p, async () => ((await salvato(g.p)).vendite || []).length === 2, 25000);
  const fine = await salvato(g.p);
  ok(mioPrima != null && Number((fine.scritture || {})[mioPrima]) > Number((prima.scritture || {})[mioPrima]),
    "§8: dopo il giro il mio numero e' CRESCIUTO: il contatore resta monotono anche con la flotta mista");
  ok((fine.vendite || []).length === 2, "§8: e le due vendite sono in rete una volta ciascuna");
  await finita(g);
});

/* ═══ 9. LA MAPPA SABOTATA, E IL GUSCIO ═══
   La tabella di verita' completa di `consegnata` sta in protopurotest.mjs, che
   non paga venti secondi di browser per riga. Qui si prova la sola cosa che il
   banco puro non puo' provare: che con una mappa sporca l'APP non cade e non
   perde una voce. Tre forme bastano, e sono le tre che arrivano da un JSON
   scritto da un altro: una stringa, un array, e la chiave «__proto__» insieme
   a una voce di coda che dice di chiamarsi «__proto__». */
console.log("\n— 9. mappe sporche e basi non attendibili —");
const FORME = [
  ["una stringa", "sono una stringa"],
  ["un array", []],
  ["__proto__ e un valore non numerico", JSON.parse(String.raw`{"__proto__":999,"dev-D":"boh"}`)],
];
for (const [nome, mappa] of FORME) {
  await prova(`§9 ${nome}`, async () => {
    const quanti = errs.length;
    const Vsp = vendita("ve-sporca", MIN(40), 9);
    const g = await apri({
      seme: semeCon((s) => { s.scritture = mappa; }),
      coda: [voceVendita(Vsp, { mitt: "dev-D", prot: 100, logId: "l-sporca" })],
    });
    await login(g.p);
    const fatto = await finche(g.p, async () => quante(await salvato(g.p), "ve-sporca") === 1, 30000);
    ok(fatto, `§9 (${nome}): con la mappa sporca la voce non sparisce: si rigioca`);
    ok(errs.length === quanti, `§9 (${nome}): e l'app non cade (zero errori JavaScript in questa sezione)`);
    await finita(g);
  });
}
/* LA VOCE CORROTTA, E CONTRO UNA MAPPA NORMALE. «"__proto__" in {}» e' vero:
   con `in` al posto di hasOwnProperty, una voce arrivata dal disco con
   mitt: "__proto__" si autocertificherebbe contro QUALUNQUE mappa. La scena
   giusta e' questa — mappa pulita, voce corrotta — e non «una mappa che porta
   davvero uno slot chiamato __proto__»: quello non sarebbe piu' un abuso della
   voce, sarebbe uno slot che qualcuno ha scritto, e infatti sfoltisciScritture
   lo butta via da ogni mappa che l'app scrive. */
await prova("§9 voce corrotta", async () => {
  const g = await apri({
    seme: semeCon((s) => { s.scritture = { "dev-D": 100 }; }),
    coda: [voceVendita(vendita("ve-proto", MIN(39), 4), { mitt: "__proto__", prot: 1, logId: "l-proto" })],
  });
  await login(g.p);
  const fatto = await finche(g.p, async () => quante(await salvato(g.p), "ve-proto") === 1, 30000);
  ok(fatto, "§9 (voce corrotta): «__proto__» non e' uno slot di questa mappa: la voce si rigioca invece di autocertificarsi");
  await finita(g);
});

/* IL GUSCIO. Quando il PIN passa e i dati no, baseRef porta un guscio marcato
   (gen-6.16, app.jsx:16986-16987): liste vuote piu' i soli nomi. Su una base
   cosi' non si giudica NIENTE — e' la stessa disciplina della guardia di
   sincronizza, e qui si misura invece di dichiararla. */
await prova("§9 guscio", async () => {
  const g = await apri({ seme: semeCieca({ "dev-D": 100 }), coda: codaCieca() });
  await g.p.evaluate(() => window.__uccidiLettura(true));
  await login(g.p);
  await g.p.waitForTimeout(2000);
  ok(((await codaSalvata(g.p)) || []).length === 1,
    "§9 (guscio): la lettura e' fallita, la base e' un guscio: la voce NON viene giudicata e resta in coda");
  await g.p.evaluate(() => window.__uccidiLettura(false));
  /* una battuta nuova rimette in moto il ciclo (dopo un guscio non c'e'
     nessuna pianificazione in piedi: e' il comportamento di gen-6.16). Ma
     prima si ASPETTA che la vista vera sia arrivata: sul guscio il listino e'
     vuoto, e una cella che non c'e' farebbe fallire la sezione per il motivo
     sbagliato — «Margherita non esiste» invece di «la cernita ha sbagliato». */
  await entraInCassa(g.p);
  /* si aspetta la GRIGLIA, non la cella: un riferimento crudo a «Aggiungi
     Margherita» qui dentro sarebbe un tocco fuori dalla porta unica, e
     gruppitest §22 lo conta — giustamente, perche' la regola non distingue un
     tocco da un'attesa e non deve: e' il contratto di cassanav.mjs. */
  await finche(g.p, async () => (await g.p.locator("[data-griglia]").count()) > 0, 20000);
  await battiEIncassa(g.p);
  await finche(g.p, async () => (await codaSalvata(g.p)) === null, 30000);
  const r = await salvato(g.p);
  ok(!(r.applicate || []).includes("l-cieca"),
    "§9 (guscio): tornata la rete vera, la voce gia' atterrata esce senza rigiocarsi");
  ok((r.vendite || []).some((v) => v.totale === 6.5),
    "§9 (guscio): e la battuta nuova, che invece non e' mai partita, arriva in rete");
  await finita(g);
});

/* ═══ 10. LA COPPIA VENDITA + STORNO ═══
   Chiude l'accusa piu' sottile di tutte: «lo storno esce subito, quindi il suo
   rigioco al buio non raddoppia niente» e' FALSA dentro la stessa coda, perche'
   applicaVendita rimette la riga «registrata» e la guardia di applicaStorno
   torna ad aprirsi. Il protocollo non ha bisogno di sapere che lavoro
   trasporta: la coppia era nella stessa scrittura, quindi o e' consegnata
   tutta o si rigioca tutta.
   LA SCENA E' QUELLA VERA, non una comoda: le liste si sono CONSUMATE (300
   righe nuove, 300 nomi nuovi), quindi ne' la riga ne' il logId sono piu' in
   rete. E' l'unica scena in cui la coppia rigiocata fa davvero danno. */
console.log("\n— 10. la vendita e il suo storno viaggiano insieme —");
const Vcop = vendita("ve-coppia", MIN(90), 33);
const semeCoppia = (slot) => semeCon((s) => {
  s.scritture = { "dev-D": slot };
  s.vendite = riempi(300, ORE(6), 60000);
  s.applicate = finti(300);
  s.giornate = [{ id: giornoDiT(Vcop.t) + "|" + FM.id, giorno: giornoDiT(Vcop.t), sedeId: FM.id,
    totale: 0, nVendite: 1, nStorni: 1, metodi: { contanti: 0, carta: 0, altro: 0 } }];
});
const codaCoppia = (prot) => [voceVendita(Vcop, { mitt: "dev-D", prot, logId: "l-cop" }),
  voceStorno(Vcop, { mitt: "dev-D", prot, logId: "l-cop-st" })];
await prova("§10a", async () => {
  const g = await apri({ seme: semeCoppia(100), coda: codaCoppia(100) });
  await login(g.p);
  await finche(g.p, async () => (await codaSalvata(g.p)) === null, 25000);
  await g.p.waitForTimeout(1200);
  const r = await salvato(g.p);
  const gg = giornDi(r, Vcop.t);
  ok(!!gg && gg.nVendite === 1 && gg.nStorni === 1 && gg.totale === 0,
    `§10a: consegnate tutte e due: la giornata non si muove (letto: ${gg && gg.totale} / ${gg && gg.nVendite} / ${gg && gg.nStorni})`);
  ok(quante(r, "ve-coppia") === 0, "§10a: e non ricompare una riga che le liste avevano gia' potato");
  ok(!/Storno di/.test(logDi(r)), "§10a: nessuna seconda riga «Storno di» nello storico");
  await finita(g);
});
await prova("§10b", async () => {
  const g = await apri({ seme: semeCoppia(99), coda: codaCoppia(140) });
  await login(g.p);
  await finche(g.p, async () => (await codaSalvata(g.p)) === null, 25000);
  const r = await salvato(g.p);
  const gg = giornDi(r, Vcop.t);
  ok(!!gg && gg.nVendite === 2 && gg.nStorni === 2 && gg.totale === 0,
    `§10b: non consegnate: si rigiocano tutte e due e il netto e' zero (letto: ${gg && gg.totale} / ${gg && gg.nVendite} / ${gg && gg.nStorni})`);
  const orig = (r.vendite || []).find((v) => v.id === "ve-coppia");
  ok(!!orig && orig.stato === "stornata", "§10b: la vendita rientra e lo storno la trova: resta marcata «stornata»");
  ok(/Storno di/.test(logDi(r)), "§10b: e la riga dello storno nello storico c'e', perche' il lavoro e' stato fatto davvero");
  await finita(g);
});

/* ═══ 11. LA RICEVUTA NON RIAPRE L'INVARIANTE DELLO SFRATTO ═══
   La riparazione dello sfratto e' online da gen-6.14 (app.jsx:927-928 e
   984-985) e il suo rosso vive in collaudi/sfrattotest.mjs. Questa sezione NON
   e' quel rosso: fa girare la RICEVUTA dentro la scena dello sfratto — W porta
   un timbro con lo slot indietro, quindi si rigioca per davvero — e pretende
   che l'invariante regga lo stesso. Verde oggi, verde dopo. */
console.log("\n— 11. lo sfratto, con una voce timbrata in mezzo —");
await prova("§11", async () => {
  const W = vendita("ve-W", ORE(20), 68);
  /* 46 e non 36, e la ragione e' la stessa della trappola di mezzanotte: fra
     le 14 e le 24 «20 ore fa» e «36 ore fa» cadono nello STESSO giorno di
     calendario, le due giornate diventano una sola e questa sezione sarebbe
     rossa dieci ore su ventiquattro. Ventisei ore di distanza cadono in giorni
     diversi sempre, e 46 sta ancora dentro lo steccato delle 48. */
  const V1s = vendita("ve-V1", ORE(46), 41);
  const g = await apri({
    seme: semeCon((s) => {
      s.scritture = { "dev-D": 100 };
      /* 300 righe esatte, e la piu' VECCHIA e' quella di W */
      s.vendite = [W, ...riempi(299, ORE(6), 60000)];
      s.applicate = finti(300);
      s.giornate = [{ id: giornoDiT(W.t) + "|" + FM.id, giorno: giornoDiT(W.t), sedeId: FM.id,
        totale: 68, nVendite: 1, nStorni: 0, metodi: { contanti: 68, carta: 0, altro: 0 } }];
    }),
    coda: [voceVendita(V1s, { logId: "l-V1" }),
      voceVendita(W, { mitt: "dev-D", prot: 140, logId: "l-W" })],
  });
  await login(g.p);
  await finche(g.p, async () => (await codaSalvata(g.p)) === null, 30000);
  const r = await salvato(g.p);
  const gW = giornDi(r, W.t), gV = giornDi(r, V1s.t);
  ok(!!gW && gW.totale === 68 && gW.nVendite === 1,
    `§11: la giornata di W resta 68,00 e una vendita: il rigioco di V1 non l'ha sfrattata (letto: ${gW && gW.totale} / ${gW && gW.nVendite})`);
  ok(!!gV && gV.totale === 41 && gV.nVendite === 1,
    `§11: e quella di V1 nasce col suo totale, una volta sola (letto: ${gV && gV.totale} / ${gV && gV.nVendite})`);
  ok(quante(r, "ve-W") === 1, "§11: una sola riga di W in rete");
  ok((r.vendite || []).length === 300, `§11: la lista resta al suo tetto (righe: ${(r.vendite || []).length})`);
  await finita(g);
});

/* ═══ 12. IL RIPRISTINO NON FA SPARIRE LA VENDITA — LA SECONDA PERDITA ═══
   Il disegno costruiva la mappa da `base`, cioe' dalla LETTURA di rete, e la
   riga girava DOPO applicaCoda: se dentro la coda c'e' un ripristino, la sua
   fn cancella ogni chiave della bozza e rimette il backup — ma la mappa viva
   veniva rimessa sopra, e lo slot sopravviveva al ripristino. Da li' la voce
   di un altro telefono usciva dalla coda certificata da uno slot che parlava
   di dati non piu' esistenti.
   L'INVARIANTE: la ricevuta certifica i dati che stanno in QUESTA bozza,
   quindi si costruisce solo dalla bozza che verra' scritta.
   DUE PAGINE VIVE nello stesso contesto, e in quest'ordine: B si monta per
   PRIMA, con la coda vuota, se no il ritrovamento le mette in mano la coda di
   A e la guardia del ripristino (app.jsx:17056) la ferma — giustamente.
   NOTA sul disco: quando B scrive, il suo specchiaCoda riscrive scp:coda:v1
   dalla PROPRIA coda e cancella quello di A. E' il difetto preesistente delle
   schede gemelle, non ha niente a che fare con questa tessera, e per questo
   dopo il ripristino qui si guarda la RETE e non il disco. */
console.log("\n— 12. il ripristino di un altro telefono —");
await prova("§12", async () => {
  const backup = semeCon((s) => { s.rev = 90; });
  const meta = { id: "bk-prova", chiave: "scp:backup:bk-prova", t: MIN(240), rev: 90, di: "Admin", nota: "Stamattina" };
  const B = await apri({
    seme: semeCon((s) => { s.scritture = {}; }),
    extra: { "scp:backup:bk-prova": JSON.stringify({ ...meta, dati: backup }),
      "scp:backup-indice": JSON.stringify([meta]) },
    chi: "Admin",
  });
  await login(B.p, "Admin", "1234");
  const pA = await B.ctx.newPage();
  pA.on("pageerror", (e) => errs.push(e.message));
  await vai(pA);
  await login(pA, "OpCassa", "2222");
  /* A AMMUTOLISCE NELL'ISTANTE IN CUI LA RISPOSTA SI PERDE, e senza questo la
     scena non esiste: la riprova che parte mezzo secondo dopo RITIMBRA la coda
     con un numero piu' alto di ogni slot gia' in rete, e da quel momento
     nessuna mappa vecchia — nemmeno una rimessa in piedi da un ripristino —
     puo' piu' certificare quella voce. L'ha dimostrato il sabotaggio 21: con la
     sola lettura stantia questa sezione restava VERDE anche con la ricevuta
     costruita dalla lettura, cioe' era verde per il motivo sbagliato. */
  await pA.evaluate(() => { window.__mutoDopoPersa(true); window.__perdiRisposta(1); });
  await battiEIncassa(pA);
  const atterrata = await finche(pA, async () => ((await salvato(pA)).vendite || []).length === 1, 20000);
  ok(atterrata, "§12: la vendita di A atterra e la risposta si perde (in rete restano la riga, il logId e lo slot di A)");
  const rete1 = await salvato(pA);
  const idV = ((rete1.vendite || [])[0] || {}).id;
  const inCoda = (await codaSalvata(pA)) || [];
  ok(inCoda.length === 1, "§12: e resta in coda su A, che non sa di avercela fatta");
  const protA = inCoda[0] && inCoda[0].prot;
  ok(protA == null || Number(protA) <= ((await salvato(pA)).rev || 0),
    `§12: col telefono muto il numero della voce resta quello dell'atterraggio (prot ${protA}, rev in rete ${(await salvato(pA)).rev}) — se sale, la scena si e' riparata da sola e la sezione non prova piu' niente`);
  await vaiA(B.p, "Sistema");
  await B.p.getByRole("button", { name: "Ripristina" }).first().click();
  await B.p.waitForTimeout(700);
  await B.p.getByRole("button", { name: "Ripristina", exact: true }).last().click();
  const tornato = await finche(B.p, async () => ((await salvato(B.p)).vendite || []).length === 0, 30000);
  ok(tornato, "§12: il ripristino di B rimette in rete lo stato di stamattina");
  await pA.evaluate(() => window.__uccidiLettura(false));
  const salva = await finche(pA, async () => quante(await salvato(pA), idV) === 1, 30000);
  ok(salva && idV != null,
    "§12: la vendita di A NON sparisce: nessuno slot puo' certificare dati che il ripristino ha portato via");
  const r = await salvato(pA);
  const gg = giornDi(r, Date.now());
  ok(!!gg && gg.nVendite === 1 && gg.totale === 6.5,
    `§12: e ci rientra una volta sola (letto: ${gg && gg.totale} / ${gg && gg.nVendite})`);
  await finita(B);
});

/* ═══ 12b. LA SCHEDA GEMELLA ═══
   CHIAVE_CODA e' dell'ORIGINE: l'app installata e il sito aperto nel browser
   ripescano ENTRAMBE le stesse voci e non si vedono fra loro (zero
   BroadcastChannel, zero navigator.locks, zero storage-event in tutto il
   file). Se la copia della seconda scheda e' stata presa DOPO il primo timbro,
   porta mitt e prot e il filtro la riconosce: e' questo che si misura qui.
   LE LISTE SI CONSUMANO A MANO, e non e' una scorciatoia: battere trecento
   scontrini veri in un banco costerebbe dieci minuti per misurare esattamente
   la stessa cosa — che i due testimoni di oggi (il logId in applicate, la riga
   in vendite) sono FINITI, che e' la premessa del difetto 40.
   L'altra meta' — la copia presa PRIMA del primo timbro — non e' riparabile da
   questa tessera (serve l'affido della coda fra schede) ed e' una voce di
   roadmap sua, non una sezione verde per finta. */
console.log("\n— 12b. due schede, un disco solo —");
await prova("§12b", async () => {
  const g1 = await apri({ seme: semeCon((s) => { s.scritture = {}; }) });
  await login(g1.p);
  await g1.p.evaluate(() => window.__uccidiRete(true));
  await battiEIncassa(g1.p);
  const timbrata = await finche(g1.p, async () => {
    const q = await codaSalvata(g1.p);
    return Array.isArray(q) && q.length === 1 && !!q[0].mitt && !!q[0].prot;
  }, 20000);
  ok(timbrata, "§12b: la scheda 1 timbra la voce sul disco anche se in rete non e' ancora atterrato niente");
  const p2 = await g1.ctx.newPage();
  p2.on("pageerror", (e) => errs.push(e.message));
  await vai(p2);
  await p2.waitForTimeout(600);
  await g1.p.evaluate(() => window.__uccidiRete(false));
  const consegnata = await finche(g1.p, async () => ((await salvato(g1.p)).vendite || []).length === 1, 25000);
  ok(consegnata, "§12b: torna la rete e la scheda 1 consegna");
  await g1.p.evaluate(() => {
    const v = JSON.parse(localStorage.getItem("db:scp:stato:v1"));
    v.applicate = []; v.vendite = []; v.rev = (v.rev || 0) + 1;
    localStorage.setItem("db:scp:stato:v1", JSON.stringify(v));
  });
  await login(p2, "OpCassa", "2222");
  await p2.waitForTimeout(4000);
  const r = await salvato(p2);
  const gg = giornDi(r, Date.now());
  ok(!!gg && gg.nVendite === 1 && gg.totale === 6.5,
    `§12b: la scheda gemella NON rigioca: la giornata cresce una volta sola (letto: ${gg && gg.totale} / ${gg && gg.nVendite})`);
  ok((r.vendite || []).length === 0,
    "§12b: e non ricompare in rete una riga che le liste avevano gia' potato");
  await finita(g1);
});

/* ═══ 13. nuoveInCoda RESTA, E SI PROVA CHE RESTA ═══
   Una coda scritta da una versione senza ricevuta e ritrovata da una che ce
   l'ha: nessun prot, ma il logId gia' in rete. Senza questa sezione, togliere
   nuoveInCoda non farebbe arrossire NIENTE in tutto il banco — ed e' cosi' che
   una rete di sicurezza sparisce fra sei mesi senza che nessuno se ne accorga.
   Due reti indipendenti che sbagliano in modi diversi valgono piu' di una rete
   elegante. */
console.log("\n— 13. la rete di sicurezza di oggi non si tocca —");
await prova("§13", async () => {
  const Vgia2 = vendita("ve-gia2", MIN(20), 7);
  const g = await apri({
    seme: semeCon((s) => {
      s.scritture = { "dev-D": 100 };
      s.vendite = [Vgia2];
      s.applicate = ["l-gia2", ...finti(50)];
    }),
    coda: [voceVendita(Vgia2, { logId: "l-gia2" })],
  });
  await login(g.p);
  await finche(g.p, async () => (await codaSalvata(g.p)) === null, 25000);
  await g.p.waitForTimeout(1500);
  const r = await salvato(g.p);
  ok((r.rev || 0) === 100, `§13: la coda si svuota SENZA una scrittura nuova: la rev in rete non si muove (letto: ${r.rev})`);
  ok(quante(r, "ve-gia2") === 1, "§13: e la vendita resta una sola");
  await finita(g);
});

/* ═══ 14. LE COMANDE: IL RIGIOCO CHE DISTRUGGE LAVORO ═══
   applicaComanda non guarda MAI l'ora: `delete f[g]` e `f[g] = {t, chi}` sono
   un last-write-wins in cui vince l'ULTIMO RIGIOCATO, e d.t e' congelato al
   momento del dito. Un «Riporta in coda» battuto al buio e rigiocato tre ore
   dopo cancella una spunta piu' RECENTE fatta da un altro schermo sulla stessa
   postazione: la comanda riappare in coda ed escono due pizze gia' consegnate.
   DUE SCHERMI, UN DISPOSITIVO SOLO: la sedia sta in localStorage (e' del
   dispositivo, non del profilo), quindi B si siede e A nasce gia' seduto —
   che e' esattamente la scena di due tablet appesi alla stessa postazione. */
console.log("\n— 14. la spunta vecchia contro il lavoro recente —");
const PRO = { id: "pr-cuoco", nome: "Cuoco", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], pinHash: hash("3333") };
const semeComande = () => {
  const Vcom = vendita("ve-com", MIN(6), 6.5);
  Vcom.righe = [{ voceId: "li-mar", nome: "Margherita", qty: 1, prezzo: 6.5, aliquota: 10, gruppo: "Pizze" }];
  return semeCon((s) => {
    s.scritture = {};
    s.profili = [PRO, PRA];
    s.postazioni = [{ id: "po-piz", nome: "Pizzeria", sedeId: "", gruppi: ["Pizze"] }];
    s.vendite = [Vcom];
  });
};
const fatteDi = (r) => (((r.vendite || [])[0] || {}).fatte) || {};
const aiFornelli = async (p) => {
  await vaiA(p, "Comande");
  const sedia = p.getByRole("button", { name: /Siediti a Pizzeria/ });
  if (await sedia.count()) { await sedia.first().click(); await p.waitForTimeout(500); }
};
await prova("§14", async () => {
  const B = await apri({ seme: semeComande(), chi: "Cuoco" });
  await login(B.p, "Cuoco", "3333");
  await aiFornelli(B.p);
  const pA = await B.ctx.newPage();
  pA.on("pageerror", (e) => errs.push(e.message));
  await vai(pA, "Cuoco");
  await login(pA, "Cuoco", "3333");
  await aiFornelli(pA);
  /* A al buio: «Fatto» e poi «Riporta in coda». Due voci in coda, la seconda
     con togli. */
  await pA.evaluate(() => window.__uccidiRete(true));
  await pA.getByRole("button", { name: /Fatta la comanda/ }).first().click();
  await pA.waitForTimeout(900);
  await pA.getByRole("button", { name: /Riporta in coda/ }).first().click();
  await pA.waitForTimeout(900);
  const q = (await codaSalvata(pA)) || [];
  ok(q.length === 2 && q[0].tipo === "spunta" && q[1] && q[1].dati && q[1].dati.togli === true,
    `§14: sul disco di A ci sono due spunte, la seconda con togli (viste: ${q.length})`);
  /* B, con la rete, spunta la STESSA comanda dopo di lui */
  await B.p.getByRole("button", { name: /Fatta la comanda/ }).first().click();
  await finche(B.p, async () => !!fatteDi(await salvato(B.p)).Pizze, 20000);
  ok(!!fatteDi(await salvato(B.p)).Pizze, "§14: la spunta di B, piu' recente, e' in rete");
  /* A rientra e rigioca le sue due voci vecchie */
  await pA.evaluate(() => window.__uccidiRete(false));
  await finche(pA, async () => (await codaSalvata(pA)) === null, 30000);
  await pA.waitForTimeout(1200);
  const r = await salvato(pA);
  ok(!!fatteDi(r).Pizze,
    "§14: dopo il rientro di A la spunta di B e' ANCORA in rete: una spunta piu' vecchia non cancella lavoro piu' recente");
  await finita(B);
});
/* IL LIMITE DICHIARATO, e si tiene visibile con un verde invece che con un
   rosso che nessuno potrebbe togliere. La guardia chiude il verso «una spunta
   vecchia non cancella lavoro recente»; non chiude il rovescio, perche' dopo
   un «Riporta in coda» legittimo la riga non c'e' piu' (delete) e un «Fatto»
   vecchio rigiocato la fa RINASCERE. Chiuderlo vuol dire una lapide
   {t, chi, tolto: 1} invece di una cancellazione, cioe' un campo in piu' per
   ogni gruppo spuntato su una collezione che viaggia INTERA a ogni
   salvataggio, su un'app il cui collo di bottiglia numero uno e' il traffico.
   Si dichiara l'asimmetria invece di pagarla. IL GIORNO IN CUI QUALCUNO SCRIVE
   LA LAPIDE, QUESTA ASSERZIONE VA INVERTITA: e' la sua sveglia. */
await prova("§14b", async () => {
  const B = await apri({ seme: semeComande(), chi: "Cuoco" });
  await login(B.p, "Cuoco", "3333");
  await aiFornelli(B.p);
  const pA = await B.ctx.newPage();
  pA.on("pageerror", (e) => errs.push(e.message));
  await vai(pA, "Cuoco");
  await login(pA, "Cuoco", "3333");
  await aiFornelli(pA);
  await pA.evaluate(() => window.__uccidiRete(true));
  await pA.getByRole("button", { name: /Fatta la comanda/ }).first().click();
  await pA.waitForTimeout(900);
  /* B, dopo, spunta e poi RIPORTA IN CODA: in rete la riga viene cancellata */
  await B.p.getByRole("button", { name: /Fatta la comanda/ }).first().click();
  await finche(B.p, async () => !!fatteDi(await salvato(B.p)).Pizze, 20000);
  await B.p.getByRole("button", { name: /Riporta in coda/ }).first().click();
  await finche(B.p, async () => !fatteDi(await salvato(B.p)).Pizze, 20000);
  ok(!fatteDi(await salvato(B.p)).Pizze, "§14b: B rimette la comanda in coda e in rete la riga sparisce");
  await pA.evaluate(() => window.__uccidiRete(false));
  await finche(pA, async () => (await codaSalvata(pA)) === null, 30000);
  await pA.waitForTimeout(1200);
  const r = await salvato(pA);
  ok(!!fatteDi(r).Pizze,
    "§14b: IL LIMITE DICHIARATO — senza una lapide sul «togli», il «Fatto» vecchio di A fa rinascere la spunta. Il giorno della lapide questa riga si INVERTE");
  await finita(B);
});

/* ═══ 15. LE FERME NON DICONO UNA COSA FALSA ═══
   Lo steccato d'eta' vive nel ritrovamento, SOPRA il bivio: taglia prima che
   qualunque slot sia consultabile, e li' ha ragione. Ma l'ANNUNCIO gira molto
   piu' tardi, dentro entra(), e la sua guardia pretende gia' `letto`: lo stato
   di rete e' in mano. Cosi' oggi la frase entra nello storico CONDIVISO
   dichiarando «NON sono state rispedite, vanno controllate a mano» per voci
   che il testimone nuovo dimostrerebbe atterrate — e con dentro gli euro di
   tutte. E' la stessa classe di «bugia su carta» che gen-6.07 tratta gia' come
   un difetto.
   E la stessa cernita rilegge CHIAVE_FERMA: quella chiave ha zero lettori e
   `.slice(-50)` butta le piu' vecchie, quindi una voce dimostrata consegnata
   ci resterebbe per sempre. */
console.log("\n— 15. quello che si ferma si dice, ma senza bugie —");
await prova("§15", async () => {
  const Fa = vendita("ve-ferma-a", ORE(50), 40);      /* dimostrata consegnata */
  const Fb = vendita("ve-ferma-b", ORE(51), 12.5);    /* davvero da controllare */
  const Fvecchia = vendita("ve-ferma-v", ORE(72), 5); /* gia' parcheggiata da un giro precedente */
  const g = await apri({
    seme: semeCon((s) => { s.scritture = { "dev-D": 100 }; }),
    coda: [voceVendita(Fa, { mitt: "dev-D", prot: 100, logId: "l-fa" }),
      voceVendita(Fb, { mitt: "dev-D", prot: 140, logId: "l-fb" })],
    disco: { "scp:coda-ferma:v1": JSON.stringify([voceVendita(Fvecchia, { mitt: "dev-D", prot: 90, logId: "l-fv" })]) },
  });
  await login(g.p);
  await finche(g.p, async () => /ferm/i.test(logDi(await salvato(g.p))), 25000);
  const r = await salvato(g.p);
  const riga = (r.log || []).map((x) => x.msg || "").find((m) => /ferm/i.test(m)) || "";
  ok(/gia' in rete|già in rete|risultano in rete/i.test(riga),
    `§15: la frase distingue quelle che il protocollo DIMOSTRA arrivate (letto: «${riga.slice(0, 160)}»)`);
  ok(/a mano/i.test(riga) && /12,50/.test(riga) && !/52,50/.test(riga),
    "§15: e gli euro sono solo quelli da controllare davvero, non la somma di tutto");
  const ferme = (await fermeSalvate(g.p)) || [];
  ok(Array.isArray(ferme) && !ferme.some((m) => m && m.logId === "l-fa") && !ferme.some((m) => m && m.logId === "l-fv"),
    `§15: e la chiave senza lettori si ripulisce delle dimostrate (restate: ${Array.isArray(ferme) ? ferme.length : "?"})`);
  ok(Array.isArray(ferme) && ferme.some((m) => m && m.logId === "l-fb"),
    "§15: mentre quella non consegnata ci resta: e' l'unica che qualcuno deve guardare");
  await finita(g);
});

if (!SOLO.length)
  ok(errs.length === 0, "zero errori JavaScript in tutto il giro" + (errs.length ? " → " + errs[0] : ""));
await b.close();
await new Promise((r) => srv.close(r));
console.log(ko ? `\nprotocollotest: ${ko} controlli KO` : "\nprotocollotest: TUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
