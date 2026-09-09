/* gen-6.14 «Lo sfratto ordinato» — TESSERA 0 del disegno della ricevuta
   (progetti/finestra-cieca.md:54-57), da spedire PER PRIMA e DA SOLA.

   IL DIFETTO, VIVO SU gen-6.13 E MISURATO QUI. Contro il doppione ci sono due
   testimoni: il logId in s.applicate e l'id della vendita in s.vendite. Il
   primo ha un tetto (MAX_APPLICATE) e scade; il secondo dovrebbe reggere. Ma
   applicaVendita ANTEPONE la riga nuova e poi taglia per POSIZIONE:

     s.vendite = [{ ...vend }, ...sfoltisciVendite(s.vendite)].slice(0, MAX_VENDITE);

   sfoltisciVendite consegna la lista ordinata per t DECRESCENTE, quindi lo
   slice morde la CODA, cioe' la riga PIU' VECCHIA rimasta. La riga anteposta,
   pero', porta il suo t VECCHIO (voluto: una vendita rimasta in coda va
   applicata E vista). Su lista piena, rigiocare una vendita vecchia SFRATTA
   UNA RIGA PIU' RECENTE — che da quel momento non ha piu' nessun testimone.

   LA SCENA, tutta dentro UN SOLO applicaCoda e con UN SOLO telefono:
   coda = [V (36 ore fa, mai spedita), W (20 ore fa, atterrata ma risposta
   persa)]; s.vendite piena con la riga di W come piu' vecchia; il logId di W
   scaduto sotto il tetto. Si applica V: la sua riga entra in testa col t di 36
   ore fa e il taglio butta W. Si applica W: la guardia cerca il suo id in
   s.vendite, non lo trova piu', e W VIENE CONTATA DUE VOLTE — giornata
   gonfiata, magazzino sceso due volte, una riga di storico in piu'.

   LA CURA: ordinare per t PRIMA di tagliare, in tutti e due i punti (la
   vendita e la riga contraria dello storno), cosi' lo sfratto tocca sempre la
   riga piu' vecchia. Il filtro d'eta' esce da quelle due righe — lo rifanno
   comunque i tre blocchi di potatura a ogni scrittura — quindi l'unica cosa
   che cambia e' QUALE riga viene sfrattata.

   PERCHE' IL BANCO SEMINA 300 RIGHE. Non collauda un tetto: serve la scena
   vera, perche' e' cosi' che il secondo testimone muore in servizio. Tutte e
   300 stanno SOTTO le 48 ore, se no sfoltisciVendite le pota per eta' e la
   lista non e' piena. E dopo il giro si PRETENDE che il tetto abbia morso.

   COME SI GIRA: node sfrattotest.mjs — servito su http, ramo window.auth.
   SORGENTE=... per i controlli sul testo. */
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


/* ═══ 1. LA SCENA DEL DIFETTO ═══ */
console.log("\n— 1. il rigioco di una vendita vecchia non deve sfrattare una piu' recente —");
await prova("§1", async () => {
  const T_W = Date.now() - 20 * H;          // atterrata, risposta persa
  const T_V = Date.now() - 36 * H;          // mai spedita
  const W = vendita("ve-w", T_W, 68, { scarico: scaricoDi(moz) });
  const V = vendita("ve-v", T_V, 25, { scarico: scaricoDi(sug) });
  const seme = semeCon((s) => {
    /* la lista PIENA: W la piu' vecchia, 299 righe piu' recenti di lei, tutte
       dentro le 48 ore. L'ordine nel seme non conta: la prima scrittura la
       riordina; conta che W abbia il t minimo. */
    s.vendite = [W, ...Array.from({ length: 299 }, (_, i) =>
      vendita("ve-dopo-" + i, T_W + (i + 1) * 4 * 60000, 6.5, { scarico: [] }))];
    /* la giornata di W la conta gia': e' arrivata */
    s.giornate = [giornata(T_W, 200, 12)];
    /* il logId di W NON c'e' piu': e' il caso che questa tessera riguarda —
       il primo testimone e' gia' morto per tetto, il secondo e' la riga */
    s.applicate = Array.from({ length: 1200 }, (_, i) => "l-altri-" + i);
    const a = s.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === moz.prodottoId);
    a.qty = 49;                              // lo scarico di W e' gia' stato fatto
  });
  const G = await apriCon(seme);
  /* la coda del telefono: prima V (piu' vecchia), poi W — l'ordine di
     inserimento, che e' quello con cui applicaCoda le rigioca */
  await mettiInCoda(G.p, [voceVendita(V, "l-v"), voceVendita(W, "l-w")]);
  await vai(G.p);
  await login(G.p);
  await finche(G.p, async () => (await codaSalvata(G.p)) === null, 20000);
  await G.p.waitForTimeout(1500);
  const rete = await salvato(G.p);

  /* V e W possono cadere nello STESSO giorno o in due, secondo l'ora in cui
     gira il banco: l'atteso si calcola, non si scrive a mano. Se cadono
     insieme, la giornata di W deve crescere di V (25 €) e di NIENTE altro. */
  const insieme = giornoDiT(T_W) === giornoDiT(T_V);
  const attesoTot = insieme ? 225 : 200;
  const attesoN = insieme ? 13 : 12;
  const gW = (rete.giornate || []).find((x) => x.id === giornoDiT(T_W) + "|" + FM.id);
  ok(gW && Math.abs(gW.totale - attesoTot) < 0.001 && gW.nVendite === attesoN,
    `la giornata di W non e' gonfiata: ${gW ? gW.totale + " € su " + gW.nVendite : "(sparita)"} (deve dire ${attesoTot} € su ${attesoN}${insieme ? ", cioe' i 200 di prima piu' i 25 di V" : ""})`);
  ok(Math.abs(qtyDi(rete, moz) - 49) < 0.001,
    `il magazzino di W non scende due volte: mozzarella ${qtyDi(rete, moz)} (deve restare 49)`);
  const righeW = righeStorico(rete, /Vendita in cassa: 68,00/);
  ok(righeW === 0, `e lo storico non guadagna una riga per una vendita gia' arrivata (${righeW})`);
  /* ATTENZIONE, e va scritto o il prossimo lo legge male: questi due controlli
     sulla LISTA sono verdi anche col difetto addosso, e per un motivo storto —
     W viene sfrattata da V, poi RIAPPLICATA (che e' il difetto), e la sua riga
     rientra in testa buttando fuori V. La lista finisce giusta proprio perche'
     il doppione e' avvenuto. Restano qui come cintura sulla forma della lista;
     chi misura il difetto sono la giornata, il magazzino e lo storico. */
  ok((rete.vendite || []).some((x) => x && x.id === "ve-w"),
    "la riga di W e' in lista (cintura: verde anche col difetto, vedi commento)");

  /* CONTROPROVA NELLO STESSO GIRO: V, che non era mai arrivata, DEVE passare.
     Senza questa meta' si potrebbe far verde spegnendo il rigioco. */
  const gV = (rete.giornate || []).find((x) => x.id === giornoDiT(T_V) + "|" + FM.id);
  const attesoV = insieme ? attesoTot : 25;
  ok(gV && Math.abs(gV.totale - attesoV) < 0.001,
    `V invece e' stata applicata: la sua giornata dice ${gV ? gV.totale + " €" : "(non c'e')"} (deve dire ${attesoV} €)`);
  ok(Math.abs(qtyDi(rete, sug) - 49) < 0.001, `e il suo ingrediente e' sceso: sugo ${qtyDi(rete, sug)} (era 50)`);
  ok((rete.applicate || []).includes("l-v") && (rete.applicate || []).includes("l-w"),
    "tutte e due le voci risultano gestite: nessuna e' rimasta in coda");

  /* IL TETTO HA DAVVERO MORSO: se la lista non fosse piena, questa sezione
     sarebbe verde per assenza di scena. */
  ok((rete.vendite || []).length === 300, `la lista e' ancora piena (${(rete.vendite || []).length} righe)`);
  ok(!(rete.vendite || []).some((x) => x && x.id === "ve-v"),
    "e la riga sfrattata e' quella PIU' VECCHIA, cioe' V: e' lei a uscire, non W");
  await G.ctx.close();
});

/* ═══ 2. CONTROPROVA: SENZA LA VENDITA VECCHIA NON SUCCEDE NIENTE ═══
   Serve a dimostrare che il rosso di §1 viene dallo SFRATTO e non dal fatto
   che il logId di W sia scaduto: con la sola W in coda, la guardia sul dato
   basta e basta gia' oggi. */
console.log("\n— 2. la stessa scena senza la vendita vecchia: W non si ribatte comunque —");
await prova("§2", async () => {
  const T_W = Date.now() - 20 * H;
  const W = vendita("ve-w2", T_W, 68, { scarico: scaricoDi(moz) });
  const seme = semeCon((s) => {
    s.vendite = [W, ...Array.from({ length: 299 }, (_, i) =>
      vendita("ve-dopo2-" + i, T_W + (i + 1) * 4 * 60000, 6.5, { scarico: [] }))];
    s.giornate = [giornata(T_W, 200, 12)];
    s.applicate = Array.from({ length: 1200 }, (_, i) => "l-altri2-" + i);
    const a = s.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === moz.prodottoId);
    a.qty = 49;
  });
  const G = await apriCon(seme);
  await mettiInCoda(G.p, [voceVendita(W, "l-w2")]);
  await vai(G.p);
  await login(G.p);
  await finche(G.p, async () => (await codaSalvata(G.p)) === null, 20000);
  await G.p.waitForTimeout(1200);
  const rete = await salvato(G.p);
  const gW = (rete.giornate || []).find((x) => x.id === giornoDiT(T_W) + "|" + FM.id);
  ok(gW && Math.abs(gW.totale - 200) < 0.001, `la giornata resta a 200 € (${gW ? gW.totale : "(sparita)"})`);
  ok(Math.abs(qtyDi(rete, moz) - 49) < 0.001, `e la mozzarella resta 49 (${qtyDi(rete, moz)})`);
  await G.ctx.close();
});

/* ═══ 3. LO STORNO: LA STESSA RIGA, LA STESSA CURA ═══
   La riga contraria porta t = adesso, quindi non puo' mai essere la piu'
   vecchia: qui l'ordinamento e' cintura, non bretelle. Ma la sezione serve a
   provare che la riparazione non ROMPE lo storno, che e' l'altra meta'. */
console.log("\n— 3. lo storno continua a funzionare, e non sfratta niente di recente —");
await prova("§3", async () => {
  const T_ORIG = Date.now() - 30 * 60000;
  const ORIG = vendita("ve-da-stornare", T_ORIG, 68, { scarico: scaricoDi(moz) });
  const seme = semeCon((s) => {
    s.vendite = [ORIG, ...Array.from({ length: 299 }, (_, i) =>
      vendita("ve-dopo3-" + i, Date.now() - 20 * H + (i + 1) * 4 * 60000, 6.5, { scarico: [] }))];
    s.giornate = [giornata(T_ORIG, 268, 13)];
    const a = s.magazzini.find((m) => m.id === linea.id).articoli.find((x) => x.prodottoId === moz.prodottoId);
    a.qty = 49;
  });
  const G = await apriCon(seme);
  const t = Date.now() - 60000;
  await mettiInCoda(G.p, [{ tipo: "storno", chi: "OpCassa", t, logId: "l-storno", descr: "Storno di 68,00 €: sbagliato",
    dati: { stornoId: "vn-1", origId: ORIG.id, t, motivo: "sbagliato", chi: "OpCassa", autorizzataDa: "OpCassa" } }]);
  await vai(G.p);
  await login(G.p);
  await finche(G.p, async () => (await codaSalvata(G.p)) === null, 20000);
  await G.p.waitForTimeout(1200);
  const rete = await salvato(G.p);
  ok(Math.abs(qtyDi(rete, moz) - 50) < 0.001, `la merce torna in magazzino: mozzarella ${qtyDi(rete, moz)} (era 49)`);
  const orig = (rete.vendite || []).find((v) => v && v.id === ORIG.id);
  ok(orig && orig.stato === "stornata", `l'originale e' marcata stornata (${orig ? orig.stato : "SPARITA"})`);
  ok((rete.vendite || []).some((v) => v && v.id === "vn-1"), "e la riga contraria e' in lista");
  ok((rete.vendite || []).length === 300, `la lista resta piena (${(rete.vendite || []).length})`);
  await G.ctx.close();
});

/* ═══ 4. IL TESTO DICE CHE SI ORDINA PRIMA DI TAGLIARE ═══ */
console.log("\n— 4. l'ordinamento sta nel codice, in tutti e due i punti —");
await prova("§4", async () => {
  const src = readFileSync(SORGENTE, "utf8");
  /* si legge l'ISTRUZIONE INTERA, da «s.vendite = [» al punto e virgola, non
     la riga: la riparazione la manda a capo, e un controllo per riga sarebbe
     rosso su un codice giusto — che e' esattamente quello che ha fatto al
     primo giro. */
  const righe = [];
  for (let i = 0; (i = src.indexOf("s.vendite = [", i)) >= 0; ) {
    const fine = src.indexOf(";", i);
    righe.push(src.slice(i, fine + 1));
    i = fine + 1;
  }
  ok(righe.length === 2, `i punti che rifanno la lista sono due (trovati ${righe.length})`);
  const conOrdine = righe.filter((r) => /\.sort\(\(a, b\) => b\.t - a\.t\)/.test(r) && /slice\(0, MAX_VENDITE\)/.test(r));
  ok(conOrdine.length === righe.length && righe.length > 0,
    `e tutti e due ordinano per t PRIMA di tagliare (${conOrdine.length} su ${righe.length})`);
  const conFiltro = righe.filter((r) => /typeof v\.t === "number"/.test(r));
  ok(conFiltro.length === righe.length,
    `e tutti e due scartano le righe senza data, che l'ordinamento non saprebbe mettere (${conFiltro.length} su ${righe.length})`);
  /* la potatura per eta' non sparisce: si sposta dove passa ogni scrittura */
  const blocchi = (src.match(/b\.vendite = sfoltisciVendite\(/g) || []).length;
  ok(blocchi === 3, `e la potatura per eta' resta nei tre blocchi di scrittura (${blocchi})`);
});

await b.close();
srv.close();
if (errs.length) { console.log("\nErrori di pagina:", [...new Set(errs)].slice(0, 5).join(" | ")); ko += errs.length; }
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
