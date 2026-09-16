/* gen-6.18: L'ESAURITO — scritto PRIMA del codice, contro gen-6.17.

   LA RICHIESTA. Valerio, 13 settembre, rispondendo alla mia domanda 1: «La
   cassa puo' solo utilizzare le funzionalita' della cassa, PUO' SCEGLIERE GLI
   INGREDIENTI DISPONIBILI, E QUELLI ESAURITI». E dalla roadmap, parole sue:
   «l'ingrediente finito AVVISA, NON BLOCCA — chi sta al banco sa cose che il
   magazzino non sa».

   IL CONTRATTO, fissato qui, e il codice si adegua.
   · e' la CASSA che dichiara «stasera e' finito», non il magazzino che lo
     deduce da una giacenza: la bufala puo' essere a 3 kg ed essere finita
     perche' e' caduta;
   · `aggiunta.esaurito: true`, assente = disponibile. DIVERSO da `attivo`:
     quello e' l'admin che la toglie dal menu per sempre;
   · si scrive con un ESECUTORE (`mutaDato`), non con una closure: e' un gesto
     di servizio fatto proprio quando la rete non c'e', e la coda di `muta`
     non sopravvive al ricaricamento;
   · LA GUARDIA STA IN UN POSTO SOLO, `giraAgg`, e rifiuta solo cio' che e'
     NUOVO: `levaDaRiga` E' `giraAgg`, quindi una guardia in testa
     bloccherebbe anche la ×;
   · le porte da cui un'aggiunta entra su un piatto sono SEI, non cinque: la
     sesta e' la CELLA di una voce con varianti, che pre-semina il Foglio di
     scelta DALLA MANO (app.jsx:14257) con `da = null`.

   COME E' STATO SCRITTO. Il disegno e' passato da quattro revisori
   indipendenti: 34 accuse, otto gravi, e tre rimedi che avevo scritto io sono
   stati CORRETTI da uno scettico — il compare-and-set era un ABA che falliva
   nello scenario per cui l'avevo messo; il filtro `TIPI_SOLDI` sul cancello
   del ripristino avrebbe riaperto un buco chiuso a gen-6.10; e il bottone
   «sempre in intestazione, accorciando il sottotitolo» non liberava un pixel,
   perche' titolo e sottotitolo stanno nella STESSA colonna.

   CONTRO gen-6.17 DEVONO ESSERE ROSSI: §1 §2 §3 §4 §4b §5 §6 §7 §8 §9 §10.
   (§9 misura la convergenza sul MECCANISMO — valore assoluto e «return
   false» quando non cambia niente — invece che con due telefoni: la gara
   vera la prova gia' duetelefonitest sulla regola revBase, e qui serve la
   meta' che quel banco non guarda, cioe' che il dato sia idempotente.)
   VERDI ANCHE PRIMA, apposta — sono i contro-controlli, e senza di loro i
   rossi non provano niente: §11 (la × toglie un'esaurita gia' sulla riga:
   la cosa che oggi funziona e che una guardia sbagliata romperebbe), §12
   (un'esaurita gia' sulla riga RESTA quando ne aggiungo un'altra), §13 (il
   CHIP leva un'esaurita dalla riga viva), §14 (il CHIP lascia un'esaurita che
   si ha in mano, e le altre restano in mano — per la riga viva la × e'
   un'altra strada, PER LA MANO NO), §15 (Salva non tocca gli altri campi),
   §16 (la pizza liscia resta UN tocco), §17 (la fascia chiusa costa 48 px),
   §18 (niente sborda a 360 px).

   NIENTE DATI VERI: nomi e prezzi inventati. NIENTE RETE VERA. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import crypto from "crypto";
import { apriServer } from "./servi.mjs";
import { batti } from "./cassanav.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 130)}`); } };
const dormi = (ms) => new Promise((r) => setTimeout(r, ms));

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const artA = linea.articoli[0]; artA.qty = 80;
FM.cassaMagId = linea.id;

/* due prodotti di categorie DIVERSE, per il seme a categorie di §4b */
const catDi = (p) => (base.categorie.find((c) => c.id === p.categoriaId) || {}).nome || "";
const conCat = base.prodotti.filter((p) => catDi(p));
const pUno = conCat[0], pDue = conCat.find((p) => catDi(p) !== catDi(conCat[0]));
if (!pUno || !pDue) throw new Error("banco povero: servono due prodotti di categorie diverse");
const CAT_UNO = catDi(pUno);

base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6, attivo: true, varianti: [],
    distinta: [{ prodottoId: artA.prodottoId, qty: 1, uomId: artA.uomId }] },
  /* CON varianti: e' l'unica cella che passa dalla SESTA PORTA (§6) */
  { id: "li-cap", nome: "Capricciosa", gruppo: "Pizze", prezzo: 8, attivo: true,
    varianti: [{ id: "v-max", nome: "Maxi", delta: 2 }], distinta: [] },
];
base.postazioni = []; base.vendite = []; base.giornate = []; base.clienti = [];

/* ── IL SEME A FILA UNICA (niente categorie, niente distinte).
     «Bufala» e' la SECONDA in alfabeto, non l'ultima: se l'esaurita fosse gia'
     ultima per nome, «in fondo» e «in alfabeto» coinciderebbero e §4 sarebbe
     verde comunque. E' la trappola che cassa617test:97 si e' gia' scritta
     addosso, e qui la evito apposta. */
const NOMI = ["Acciughe", "Bufala", "Cipolla", "Funghi", "Olive"];
const fila = JSON.parse(JSON.stringify(base));
fila.aggiunte = NOMI.map((n, i) => ({ id: "ag-" + i, nome: n, prezzo: 1 + i * 0.5,
  attivo: true, gruppi: ["Pizze"], distinta: [] }));
const AG_BUF = "ag-1";   // Bufala
const AG_FUN = "ag-3";   // Funghi

/* lo stesso seme con la Bufala GIA' segnata: serve ai contro-controlli, che
   su gen-6.17 devono essere verdi perche' il campo viene semplicemente
   ignorato, e su gen-6.18 devono restare verdi perche' la guardia rifiuta
   solo cio' che e' NUOVO */
const filaSegnata = JSON.parse(JSON.stringify(fila));
filaSegnata.aggiunte.find((a) => a.id === AG_BUF).esaurito = true;

/* ── IL SEME A CATEGORIE, per §4b: senza questo meta' della regola
     dell'ordine non e' provata, perche' perCategoria RI-ORDINA per nome */
const cate = JSON.parse(JSON.stringify(base));
cate.aggiunte = [
  { id: "ag-c1", nome: "Bufala", prezzo: 2, attivo: true, gruppi: ["Pizze"], esaurito: true,
    distinta: [{ prodottoId: pUno.id, qty: 1, uomId: pUno.uomBase }] },
  { id: "ag-c2", nome: "Cipolla", prezzo: 1, attivo: true, gruppi: ["Pizze"],
    distinta: [{ prodottoId: pUno.id, qty: 1, uomId: pUno.uomBase }] },
  { id: "ag-c3", nome: "Salame", prezzo: 2, attivo: true, gruppi: ["Pizze"], categoria: "Salumi", distinta: [] },
];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  cassa: { id: "pr-c", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
};

const srv = await apriServer();
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];

/* `coda` semina «scp:coda:v1» PRIMA che la pagina parta: e' l'unico modo di
   riprodurre un telefono che riapre con del lavoro rimasto su disco, ed e' la
   stessa strada di gen607test. Serve a §19 e a nessun altro. */
const apri = async (st0, profili, nome, pin, larghezza = 390, coda = null) => {
  const st = JSON.parse(JSON.stringify(st0));
  st.profili = profili;
  const ctx = await b.newContext({ viewport: { width: larghezza, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j, c]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    if (c) localStorage.setItem("scp:coda:v1", c);
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, [JSON.stringify(st), coda ? JSON.stringify(coda) : null]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(srv.url); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1600);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const salvato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1") || "null"));
const barra = (p) => p.evaluate(() => [...document.querySelectorAll('nav[aria-label="Navigazione principale"] button')]
  .map((x) => x.textContent.trim()).filter(Boolean));
/* la Cassa si apre come la aprirebbe una persona: la barra di chi ha «cassa»
   dice «Cassa», e dentro dice «Battere» */
const entraInCassa = async (p) => {
  const voci = await barra(p);
  if (voci.some((v) => /battere/i.test(v))) return;
  const c = p.locator('nav[aria-label="Navigazione principale"]').getByRole("button", { name: /Cassa/i });
  if (await c.count()) { await c.first().click(); await p.waitForTimeout(1000); }
};
const apriFascia = async (p) => {
  const chiusa = p.locator('[data-fascia-chiusa="1"] button');
  if (await chiusa.count()) { await chiusa.first().click(); await p.waitForTimeout(500); }
};
const chipInOrdine = (p) => p.evaluate(() =>
  [...document.querySelectorAll('[data-fascia="1"] [data-agg]')].map((e) => e.getAttribute("data-agg")));
const bottoneEsauriti = (p) => p.locator('[data-fascia="1"] [data-esauriti="1"]');
/* ── COME SI GUARDA IL CONTO, e perche' non col nome composto ──
   Da gen-6.03 la riga battuta porta il nome BASE («Margherita») e gli
   ingredienti stanno in SOTTO-RIGHE («+ Funghi») con la loro ×: cercare
   «Margherita + Funghi» nel testo della pagina non trova niente, e al primo
   giro mi ha dato tre rossi finti su tre contro-controlli. Si guarda la
   sotto-riga, che e' quello che il dito vede. */
const suRiga = async (p, nome) =>
  (await p.getByRole("button", { name: new RegExp("Riga: leva " + nome) }).count()) > 0;
/* il testo della sola INTESTAZIONE della fascia: «In mano: …» sta li', e
   cercarlo nel body intero pesca anche i nomi dei chip (secondo rosso finto) */
const inMano = (p) => p.evaluate(() => {
  const f = document.querySelector('[data-fascia="1"], [data-fascia-chiusa="1"]');
  if (!f) return "";
  /* IL TITOLO, non tutta la fascia. Al primo giro leggevo il textContent
     dell'intera fascia e il ritaglio «In mano: …» sconfinava nei nomi dei
     chip: «In mano: Funghi, Olive … Acciughe … Bufala» — e il controllo
     diceva che la Bufala era ancora in mano quando era gia' stata posata. */
  const t = f.querySelector(".font-extrabold");
  return t ? (t.textContent || "").replace(/\s+/g, " ").trim() : "";
});

/* ═══════════ I ROSSI ═══════════ */
const A = await apri(fila, [PR.cassa, PR.admin], "OpCassa", "2222");
await entraInCassa(A.p);

console.log("\n— 1. nell'intestazione della fascia c'e' il bottone degli esauriti —");
await prova("§1", async () => {
  await apriFascia(A.p);
  ok((await bottoneEsauriti(A.p).count()) === 1,
    "a mano vuota, nell'intestazione della fascia aperta, c'e' un bottone «Ingredienti esauriti»");
  const box = await bottoneEsauriti(A.p).first().boundingBox().catch(() => null);
  ok(!!box && box.height >= 43.5 && box.width >= 43.5,
    `ed e' un bersaglio da 44 punti — ${box ? Math.round(box.width) + "×" + Math.round(box.height) : "assente"}`);
});

console.log("\n— 2. il bottone apre un Foglio con una riga per ingrediente —");
await prova("§2", async () => {
  await bottoneEsauriti(A.p).first().click(); await A.p.waitForTimeout(700);
  const righe = await A.p.locator('[data-esa-riga]').count();
  ok(righe === NOMI.length, `il Foglio elenca tutti e ${NOMI.length} gli ingredienti — ne trovo ${righe}`);
  const t = await testoDi(A.p);
  ok(NOMI.every((n) => t.includes(n)), "e li nomina tutti");
});

console.log("\n— 3. l'interruttore scrive in rete, e lascia una riga di storico —");
await prova("§3", async () => {
  await A.p.locator(`[data-esa-riga="${AG_BUF}"] button`).first().click();
  await A.p.waitForTimeout(1800);
  const st = await salvato(A.p);
  const buf = (st?.aggiunte || []).find((a) => a.id === AG_BUF);
  ok(!!buf && buf.esaurito === true, `«Bufala» e' segnata esaurita in rete — vale ${JSON.stringify(buf?.esaurito)}`);
  const altre = (st?.aggiunte || []).filter((a) => a.id !== AG_BUF);
  ok(altre.every((a) => a.esaurito === undefined),
    "e le altre non hanno il campo: assente = disponibile, zero byte per chi non e' finito");
  ok((st?.log || []).some((e) => /esaurit/i.test(e.msg || "")),
    `e nello storico c'e' una riga che lo dice — ${JSON.stringify((st?.log || [])[0]?.msg || null)}`);
});

console.log("\n— 4. nella fila unica l'esaurita sta IN FONDO, e si vede barrata —");
await prova("§4", async () => {
  await A.p.getByRole("button", { name: /Chiudi|Va bene|Fatto/i }).last().click().catch(() => {});
  await A.p.waitForTimeout(600);
  await apriFascia(A.p);
  const chips = await chipInOrdine(A.p);
  ok(JSON.stringify(chips) === JSON.stringify(["Acciughe", "Cipolla", "Funghi", "Olive", "Bufala"]),
    `«Bufala» — seconda in alfabeto — sta ULTIMA perche' e' esaurita. Trovato ${JSON.stringify(chips)}`);
  const barrato = await A.p.evaluate(() => {
    const e = document.querySelector('[data-fascia="1"] [data-agg="Bufala"]');
    return e ? getComputedStyle(e).textDecorationLine : null;
  });
  ok(/line-through/.test(barrato || ""), `e il suo chip e' barrato — text-decoration: ${barrato}`);
});

console.log("\n— 5. toccare un chip esaurito non lo mette, e dice perche' —");
await prova("§5", async () => {
  await batti(A.p, "Margherita");
  await A.p.waitForTimeout(600);
  await apriFascia(A.p);
  await A.p.locator('[data-fascia="1"] [data-agg="Bufala"]').first().click();
  await A.p.waitForTimeout(700);
  ok(!(await suRiga(A.p, "Bufala")), "la Bufala NON finisce sul piatto");
  const t = await testoDi(A.p);
  ok(/non si mette/i.test(t), `e l'app dice perche' — ${/non si mette/i.test(t) ? "c'e' il messaggio" : "nessun messaggio"}`);
  /* il rifiuto NON deve uscire vestito da conferma: solo «errore» cambia
     l'icona in AlertTriangle, ed e' gia' il tipo del rifiuto gemello
     «X non va su Y: resta in mano» */
  const fondo = await A.p.evaluate(() => {
    const d = [...document.querySelectorAll("div")].find((x) => /non si mette/i.test(x.textContent || "") && x.className.includes("sc-pop"));
    return d ? getComputedStyle(d).backgroundColor : null;
  });
  /* IL NUMERO SI LEGGE DAL FILE, non si tira a indovinare: la prima volta
     avevo scritto «214|217|215» a memoria e il controllo e' diventato rosso
     su un toast che era gia' giusto. T.rosso e' #E25C77 (app.jsx:27), il
     fondo neutro e' #2B3355 e l'ambra #E8A13C: bastano i due estremi per
     distinguere un rifiuto da una conferma. */
  ok(fondo === "rgb(226, 92, 119)", `e il toast e' rosso (T.rosso), non una spunta su fondo scuro — ${fondo}`);
});
await A.ctx.close();

console.log("\n— 6. LA SESTA PORTA: la cella con le varianti, con l'esaurita in mano —");
await prova("§6", async () => {
  const S = await apri(filaSegnata, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(S.p);
  await apriFascia(S.p);
  /* la Bufala e' gia' esaurita: non si puo' prendere in mano. Ci si mette
     un'altra cosa, e si prova che la Bufala non entri lo stesso dal Foglio. */
  await S.p.locator('[data-fascia="1"] [data-agg="Funghi"]').first().click();
  await S.p.waitForTimeout(500);
  await S.p.locator('[data-fascia="1"] [data-agg="Bufala"]').first().click();
  await S.p.waitForTimeout(500);
  /* PORTA 1, la mano. Sta qui e non in una sezione sua perche' e' proprio il
     gesto che prepara la sesta porta: senza queste due righe la prima guardia
     non avrebbe nessun testimone, e il sabotaggio che la spegne resterebbe
     MUTO — scritta, e mai provata. */
  ok(!/Bufala/.test(await inMano(S.p)),
    `la Bufala esaurita non entra in mano — «${(await inMano(S.p)).slice(0, 70)}»`);
  ok(/non si mette/i.test(await testoDi(S.p)), "e il rifiuto e' detto, non silenzioso");
  /* la cella di una voce CON varianti apre il Foglio di scelta pre-seminato
     dalla mano: e' il punto che il primo disegno dava per sicuro */
  await batti(S.p, "Capricciosa");
  await S.p.waitForTimeout(700);
  /* dentro il FOGLIO, non in tutta la pagina: i chip della fascia hanno anche
     loro aria-pressed, e al primo giro me li sono ritrovati nell'elenco */
  const spuntate = await S.p.evaluate(() => {
    const f = document.querySelector(".sc-foglio");
    if (!f) return ["NESSUN FOGLIO"];
    return [...f.querySelectorAll('button[aria-pressed="true"]')].map((e) => e.textContent.trim());
  });
  ok(!spuntate.some((x) => /Bufala/.test(x)),
    `il Foglio NON nasce con la Bufala gia' spuntata — spuntate: ${JSON.stringify(spuntate)}`);
  await S.p.getByRole("button", { name: /Maxi/ }).first().click(); await S.p.waitForTimeout(700);
  ok(!(await suRiga(S.p, "Bufala")),
    `e la Capricciosa Maxi esce senza Bufala — Capricciosa ${/Capricciosa/.test(await testoDi(S.p)) ? "nel conto" : "manca"}`);
  await S.ctx.close();
});

console.log("\n— 7. la mano non porta un'esaurita sul piatto, e non sparisce in silenzio —");
await prova("§7", async () => {
  const M = await apri(fila, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(M.p);
  await apriFascia(M.p);
  await M.p.locator('[data-fascia="1"] [data-agg="Bufala"]').first().click();
  await M.p.waitForTimeout(500);
  ok(/Bufala/.test(await inMano(M.p)), "prima: la Bufala e' in mano (non e' ancora esaurita)");
  /* adesso la segna: la mano tiene una cosa che nel frattempo e' finita */
  await bottoneEsauriti(M.p).first().click().catch(() => {});
  await M.p.waitForTimeout(700);
  await M.p.locator(`[data-esa-riga="${AG_BUF}"] button`).first().click().catch(() => {});
  await M.p.waitForTimeout(1200);
  await M.p.getByRole("button", { name: /Chiudi|Va bene|Fatto/i }).last().click().catch(() => {});
  await M.p.waitForTimeout(500);
  await batti(M.p, "Margherita");
  await M.p.waitForTimeout(800);
  ok(!(await suRiga(M.p, "Bufala")), "la Bufala non sale sul piatto");
  ok(/tolta dalla mano/i.test(await testoDi(M.p)), "e l'app lo DICE invece di farla sparire in silenzio");
  await M.ctx.close();
});

console.log("\n— 8. Salva nell'editor non cancella l'esaurito —");
await prova("§8", async () => {
  const G = await apri(filaSegnata, [PR.admin], "Admin", "1234");
  const vaiA = (await import("./navtest.mjs")).vaiA;
  await vaiA(G.p, "Listino");
  await G.p.getByRole("button", { name: /Modifica l'aggiunta Bufala/ }).first().click();
  await G.p.waitForTimeout(700);
  await G.p.getByRole("button", { name: "Salva", exact: true }).first().click();
  await G.p.waitForTimeout(1800);
  const st = await salvato(G.p);
  const buf = (st?.aggiunte || []).find((a) => a.id === AG_BUF);
  ok(!!buf && buf.esaurito === true,
    `dopo un Salva dall'editor la Bufala e' ANCORA esaurita — vale ${JSON.stringify(buf?.esaurito)}`);
  await G.ctx.close();
});

console.log("\n— 4b. anche DENTRO le categorie l'esaurita sta in fondo —");
await prova("§4b", async () => {
  const C = await apri(cate, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(C.p);
  await apriFascia(C.p);
  const dentro = await C.p.evaluate(() => {
    const o = {};
    for (const g of document.querySelectorAll('[data-fascia="1"] [data-cat]'))
      o[g.getAttribute("data-cat")] = [...g.querySelectorAll("[data-agg]")].map((e) => e.getAttribute("data-agg"));
    return o;
  });
  const suoi = dentro[CAT_UNO] || [];
  ok(JSON.stringify(suoi) === JSON.stringify(["Cipolla", "Bufala"]),
    `sotto «${CAT_UNO}»: Cipolla e poi Bufala, che e' esaurita. Trovato ${JSON.stringify(dentro)}`);
  await C.ctx.close();
});

console.log("\n— 10. il Foglio degli esauriti sta SOPRA la barra di navigazione —");
await prova("§10", async () => {
  const Z = await apri(fila, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(Z.p);
  await apriFascia(Z.p);
  await bottoneEsauriti(Z.p).first().click(); await Z.p.waitForTimeout(700);
  const sopra = await Z.p.evaluate(() => {
    const f = document.querySelector(".sc-foglio");
    const nav = document.querySelector('nav[aria-label="Navigazione principale"]');
    if (!f || !nav) return null;
    /* chi dipinge sopra: si chiede al documento chi c'e' nel punto in cui i
       due si sovrappongono, invece di dedurlo dagli z-index */
    const r = nav.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { dentroIlFoglio: !!(el && f.contains(el)) };
  });
  ok(!!sopra && sopra.dentroIlFoglio,
    "nel punto della barra, quello che riceve il tocco appartiene al Foglio: il Foglio ci sta sopra");
  await Z.ctx.close();
});

/* ═══════════ I CONTRO-CONTROLLI: verdi PRIMA e DOPO ═══════════ */
const V = await apri(filaSegnata, [PR.cassa, PR.admin], "OpCassa", "2222");
await entraInCassa(V.p);

console.log("\n— 11. CONTRO-CONTROLLO: la × toglie un'esaurita gia' sulla riga —");
await prova("§11", async () => {
  /* si compone la riga col Foglio di scelta, che su gen-6.17 la spunta
     ancora: quello che conta e' che la × sappia toglierla */
  await batti(V.p, "Margherita");
  await V.p.waitForTimeout(500);
  await V.p.getByRole("button", { name: /Lavora su Margherita/ }).first().click().catch(() => {});
  await V.p.waitForTimeout(600);
  await apriFascia(V.p);
  await V.p.locator('[data-fascia="1"] [data-agg="Funghi"]').first().click();
  await V.p.waitForTimeout(700);
  ok(await suRiga(V.p, "Funghi"), "preparata: la Margherita ha i Funghi nella sua sotto-riga");
  const x = V.p.getByRole("button", { name: /Riga: leva Funghi/ }).first();
  ok((await x.count()) > 0, "la × della sotto-riga c'e'");
  await x.click(); await V.p.waitForTimeout(700);
  ok(!(await suRiga(V.p, "Funghi")), "e toglie l'ingrediente dalla riga");
});

console.log("\n— 12. CONTRO-CONTROLLO: un'esaurita GIA' sulla riga resta quando ne aggiungo un'altra —");
await prova("§12", async () => {
  /* e' il controllo che impedisce il rimedio sbagliato. Un filtro cieco
     dentro «aggiungi» sugli extra strapperebbe in silenzio l'ingrediente
     esaurito GIA' sulla riga nel momento in cui se ne aggiunge un altro —
     cioe' farebbe scendere il prezzo di nascosto, che e' esattamente quello
     che giraAgg evita gia' per la variante sparita. La regola e' «si rifiuta
     cio' che e' NUOVO, si conserva cio' che la riga ha gia'». */
  const R = await apri(fila, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(R.p);
  await apriFascia(R.p);
  /* prima la Bufala va sulla riga (non e' ancora esaurita) */
  await batti(R.p, "Margherita");
  await R.p.waitForTimeout(500);
  await R.p.locator('[data-fascia="1"] [data-agg="Bufala"]').first().click();
  await R.p.waitForTimeout(700);
  ok(await suRiga(R.p, "Bufala"), "preparata: la Margherita ha la Bufala nella sua sotto-riga");
  /* adesso la Bufala diventa esaurita, e si aggiunge un ALTRO ingrediente */
  await bottoneEsauriti(R.p).first().click().catch(() => {});
  await R.p.waitForTimeout(700);
  await R.p.locator(`[data-esa-riga="${AG_BUF}"] button`).first().click().catch(() => {});
  await R.p.waitForTimeout(1200);
  await R.p.getByRole("button", { name: /Chiudi|Va bene|Fatto/i }).last().click().catch(() => {});
  await R.p.waitForTimeout(500);
  await apriFascia(R.p);
  await R.p.locator('[data-fascia="1"] [data-agg="Funghi"]').first().click();
  await R.p.waitForTimeout(800);
  const conBuf = await suRiga(R.p, "Bufala"), conFun = await suRiga(R.p, "Funghi");
  ok(conBuf && conFun,
    `la Bufala e' ANCORA sulla riga accanto ai Funghi: non si strappa quello che c'era — Bufala ${conBuf ? "c'e'" : "SPARITA"}, Funghi ${conFun ? "ci sono" : "mancano"}`);
  await R.ctx.close();
});

console.log("\n— 9. segnare due volte la stessa cosa non scrive due righe di storico —");
await prova("§9", async () => {
  /* la convergenza fra due casse, misurata sul MECCANISMO invece che con due
     telefoni: l'esecutore scrive un valore ASSOLUTO e torna false quando non
     cambia niente, quindi la seconda cassa che segna la stessa cosa non
     aggiunge una riga di storico e non ribalta il valore. Con un toggle
     sarebbe tornata DISPONIBILE e il log avrebbe detto due volte «segnata
     esaurita». La gara vera fra due telefoni la prova gia' duetelefonitest
     sulla regola revBase; qui si prova che il DATO e' idempotente, che e' la
     meta' che quel banco non guarda. */
  const D = await apri(filaSegnata, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(D.p);
  const righePrima = ((await salvato(D.p))?.log || []).filter((e) => /esaurit/i.test(e.msg || "")).length;
  await apriFascia(D.p);
  await bottoneEsauriti(D.p).first().click(); await D.p.waitForTimeout(700);
  /* la riga dice gia' «esaurita»: segnarla di nuovo non deve fare niente.
     Si tocca il bottone che la segna esaurita, non quello che la libera. */
  const gia = await D.p.locator(`[data-esa-riga="${AG_BUF}"]`).getAttribute("data-esa-stato");
  ok(gia === "esaurito", `il Foglio sa gia' che la Bufala e' esaurita — dice «${gia}»`);
  const st = await salvato(D.p);
  const buf = (st?.aggiunte || []).find((a) => a.id === AG_BUF);
  ok(buf?.esaurito === true, "e in rete e' rimasta esaurita");
  const righeDopo = (st?.log || []).filter((e) => /esaurit/i.test(e.msg || "")).length;
  ok(righeDopo === righePrima,
    `e aprire il Foglio non ha scritto nessuna riga di storico — ${righePrima} prima, ${righeDopo} dopo`);
  await D.ctx.close();
});

console.log("\n— 13. CONTRO-CONTROLLO: il CHIP leva dalla riga viva —");
await prova("§13", async () => {
  await V.p.getByRole("button", { name: /Lavora su Margherita/ }).first().click().catch(() => {});
  await V.p.waitForTimeout(500);
  await apriFascia(V.p);
  await V.p.locator('[data-fascia="1"] [data-agg="Olive"]').first().click();
  await V.p.waitForTimeout(700);
  ok(await suRiga(V.p, "Olive"), "messe le Olive dal chip");
  await V.p.locator('[data-fascia="1"] [data-agg="Olive"]').first().click();
  await V.p.waitForTimeout(700);
  ok(!(await suRiga(V.p, "Olive")), "e lo stesso chip le leva: il chip fa tutti e due i versi");
});

console.log("\n— 14. CONTRO-CONTROLLO: il CHIP lascia un'esaurita che si ha in mano —");
await prova("§14", async () => {
  /* e' l'unico che copre il buco vero: per la riga viva la × resta
     un'altra strada, PER LA MANO NO. Se il chip morisse su un'esaurita,
     una presa in mano PRIMA non si potrebbe piu' lasciare. */
  const H = await apri(fila, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(H.p);
  await apriFascia(H.p);
  for (const n of ["Bufala", "Funghi", "Olive"]) {
    await H.p.locator(`[data-fascia="1"] [data-agg="${n}"]`).first().click();
    await H.p.waitForTimeout(400);
  }
  ok(/Bufala/.test(await inMano(H.p)), "tre ingredienti in mano, Bufala compresa");
  /* adesso la Bufala diventa esaurita mentre e' in mano */
  await bottoneEsauriti(H.p).first().click().catch(() => {});
  await H.p.waitForTimeout(700);
  await H.p.locator(`[data-esa-riga="${AG_BUF}"] button`).first().click().catch(() => {});
  await H.p.waitForTimeout(1200);
  await H.p.getByRole("button", { name: /Chiudi|Va bene|Fatto/i }).last().click().catch(() => {});
  await H.p.waitForTimeout(500);
  await apriFascia(H.p);
  await H.p.locator('[data-fascia="1"] [data-agg="Bufala"]').first().click();
  await H.p.waitForTimeout(700);
  const mano = await inMano(H.p);
  ok(!/Bufala/.test(mano), `il chip la LASCIA: esaurita o no, quello che si ha in mano si posa — «${mano.slice(0, 70)}»`);
  ok(/Funghi/.test(mano) && /Olive/.test(mano), `e le altre due restano in mano — «${mano.slice(0, 70)}»`);
  await H.ctx.close();
});

console.log("\n— 15. CONTRO-CONTROLLO: Salva non tocca gli altri campi —");
await prova("§15", async () => {
  const E = await apri(filaSegnata, [PR.admin], "Admin", "1234");
  const vaiA = (await import("./navtest.mjs")).vaiA;
  await vaiA(E.p, "Listino");
  const prima = (await salvato(E.p))?.aggiunte.find((a) => a.id === AG_BUF);
  await E.p.getByRole("button", { name: /Modifica l'aggiunta Bufala/ }).first().click();
  await E.p.waitForTimeout(700);
  await E.p.getByRole("textbox", { name: /Categoria/i }).first().fill("Sottaceti");
  await E.p.waitForTimeout(300);
  await E.p.getByRole("button", { name: "Salva", exact: true }).first().click();
  await E.p.waitForTimeout(1800);
  const dopo = (await salvato(E.p))?.aggiunte.find((a) => a.id === AG_BUF);
  ok(dopo?.categoria === "Sottaceti", `la categoria e' cambiata — «${dopo?.categoria}»`);
  ok(dopo?.prezzo === prima?.prezzo && JSON.stringify(dopo?.gruppi) === JSON.stringify(prima?.gruppi),
    `e prezzo e gruppi sono quelli di prima — ${dopo?.prezzo} / ${JSON.stringify(dopo?.gruppi)}`);
  await E.ctx.close();
});

console.log("\n— 16. CONTRO-CONTROLLO: la pizza liscia resta UN tocco —");
await prova("§16", async () => {
  await batti(V.p, "Margherita");
  await V.p.waitForTimeout(600);
  ok(/€ 6,00/.test(await testoDi(V.p)), "un tocco sulla cella e la Margherita e' nel conto");
});

console.log("\n— 17. CONTRO-CONTROLLO: la fascia chiusa costa gli stessi 48 px —");
await prova("§17", async () => {
  await V.p.getByRole("button", { name: "Chiudi gli ingredienti", exact: true }).click().catch(() => {});
  await V.p.waitForTimeout(500);
  const h = await V.p.evaluate(() => {
    const c = document.querySelector('[data-fascia-chiusa="1"] button');
    return c ? Math.round(c.getBoundingClientRect().height) : 0;
  });
  ok(h >= 44 && h <= 56, `la pastiglia chiusa e' alta ${h} px: come prima`);
});
await V.ctx.close();

console.log("\n— 18. CONTRO-CONTROLLO: a 360 px niente sborda —");
await prova("§18", async () => {
  const P = await apri(fila, [PR.cassa, PR.admin], "OpCassa", "2222", 360);
  await entraInCassa(P.p);
  await apriFascia(P.p);
  /* il caso peggiore e' la MANO PIENA: li' ci sono «Lascia», la porta degli
     esauriti e la ×, tre bersagli da 44 punti sulla stessa riga, e il titolo
     e' il piu' lungo che esista («In mano: Bufala, Funghi»). Il disegno
     voleva togliere la porta proprio qui; §7 e §14 hanno dimostrato che e'
     il momento in cui serve di piu' — la Bufala e' IN MANO quando dal forno
     gridano che e' finita. Quindi la porta resta e si MISURA che niente
     sbordi, invece di prevederlo. */
  await P.p.locator('[data-fascia="1"] [data-agg="Funghi"]').first().click();
  await P.p.waitForTimeout(600);
  const m = await P.p.evaluate(() => {
    const f = document.querySelector('[data-fascia="1"]');
    if (!f) return null;
    const r = f.getBoundingClientRect();
    const fuori = [...f.querySelectorAll("button, span")].filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && (b.right > r.right + 1 || b.left < r.left - 1);
    }).length;
    return { fuori, largo: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
  });
  ok(!!m && m.fuori === 0, `niente sborda dai bordi della fascia a 360 px — ${m ? m.fuori : "?"} elementi fuori`);
  ok(!!m && !m.largo, "e la pagina non scorre in orizzontale");
  await P.ctx.close();
});

console.log("\n— 19. TESTIMONE: un «esaurito» di otto ore fa non riscrive l'oggi —");
await prova("§19", async () => {
  /* QUESTO CONTROLLO NON POTEVA ESSERE ROSSO SU gen-6.17, e va detto: li' il
     tipo «esaurito» non esisteva e il motore scartava la voce comunque. Sta
     qui come TESTIMONE dello steccato d'eta' dentro l'esecutore, che senza di
     lui resterebbe scritto e mai provato — ed e' la difesa piu' delicata di
     tutta la generazione: un valore ASSOLUTO non puo' sapere di essere
     vecchio, e senza steccato un segno messo ieri sera riscriverebbe
     stamattina, col frigo appena rifornito.
     Otto ore: passa lo steccato generale della coda (48 ore, ORE_VENDITE) e
     NON passa quello dell'esaurito (6 ore). Il verso in cui sbaglia e' quello
     giusto — scartare lascia l'ingrediente disponibile. */
  const ORE8 = Date.now() - 8 * 3600000;
  const W = await apri(fila, [PR.cassa, PR.admin], "OpCassa", "2222", 390, [
    { tipo: "esaurito", dati: { id: AG_BUF, val: true, t: ORE8 },
      descr: "Esaurita: «Bufala» non si mette più sui piatti", chi: "OpCassa", t: ORE8, logId: "l-vecchio" },
  ]);
  await W.p.waitForTimeout(2500);
  const st = await salvato(W.p);
  const buf = (st?.aggiunte || []).find((a) => a.id === AG_BUF);
  ok(buf?.esaurito === undefined,
    `la Bufala e' rimasta DISPONIBILE: un segno di otto ore fa non si rigioca — vale ${JSON.stringify(buf?.esaurito)}`);
  await entraInCassa(W.p);
  await apriFascia(W.p);
  const chips = await chipInOrdine(W.p);
  ok(JSON.stringify(chips) === JSON.stringify(NOMI),
    `e nella fascia sta al suo posto in alfabeto — ${JSON.stringify(chips)}`);
  await W.ctx.close();
});

console.log("\n— 20. TESTIMONE: la terza porta, quella del foglio di scelta —");
await prova("§20", async () => {
  /* Le altre cinque porte si aprono dal chip o dalla cella; questa dal
     FOGLIO, che ha chip suoi. Ci si arriva dalla pastiglia «Formato: …» di
     una riga gia' nel conto — l'unica strada che porta anche `rigaDa`, cioe'
     il caso in cui bisogna CONSERVARE quello che la riga ha gia' e rifiutare
     solo quello che e' nuovo. Senza questa sezione la porta 3 non avrebbe
     nessun testimone. */
  const Q = await apri(filaSegnata, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(Q.p);
  await batti(Q.p, "Capricciosa");
  await Q.p.waitForTimeout(700);
  await Q.p.getByRole("button", { name: /Così com'è/ }).first().click();
  await Q.p.waitForTimeout(800);
  await Q.p.getByRole("button", { name: /Cambia formato di/ }).first().click();
  await Q.p.waitForTimeout(800);
  const chip = Q.p.locator(".sc-foglio").getByRole("button", { name: /^Metti Bufala$/ });
  ok((await chip.count()) > 0, "nel foglio di scelta il chip della Bufala c'e' ancora: e' un bottone vero");
  await chip.first().click(); await Q.p.waitForTimeout(400);
  await Q.p.getByRole("button", { name: /Maxi/ }).first().click();
  await Q.p.waitForTimeout(900);
  ok(!(await suRiga(Q.p, "Bufala")), "ma dal foglio l'esaurita non sale sul piatto");
  ok(/non si mette/i.test(await testoDi(Q.p)), "e l'app dice perche', invece di toglierla in silenzio");
  await Q.ctx.close();
});

console.log("\n— 21. TESTIMONE: la sesta porta, con l'esaurita che finisce MENTRE e' in mano —");
await prova("§21", async () => {
  /* APERTO UN MUTO, e vale piu' di un rosso. Credevo che §6 provasse la sesta
     porta; il sabotaggio che la spegne e' rimasto MUTO e aveva ragione: in §6
     la Bufala e' GIA' esaurita quando la si prova a prendere, quindi la PRIMA
     porta la ferma e la sesta non viene nemmeno interrogata. Spenta, il banco
     restava verde — cioe' la sesta porta era scritta e mai provata, che e'
     esattamente la cosa da cui questa generazione e' nata.
     La sesta porta serve nell'UNICO caso in cui un'esaurita puo' davvero stare
     in mano: ci e' finita quando era ancora disponibile, e il forno grida dopo.
     §6 resta, perche' prova la porta 1 e il caso di tutti i giorni. */
  const X = await apri(fila, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(X.p);
  await apriFascia(X.p);
  for (const nm of ["Bufala", "Funghi"]) {
    await X.p.locator(`[data-fascia="1"] [data-agg="${nm}"]`).first().click();
    await X.p.waitForTimeout(400);
  }
  ok(/Bufala/.test(await inMano(X.p)), "preparata: Bufala e Funghi in mano, la Bufala e' ancora disponibile");
  await bottoneEsauriti(X.p).first().click(); await X.p.waitForTimeout(700);
  await X.p.locator(`[data-esa-riga="${AG_BUF}"] button`).first().click();
  await X.p.waitForTimeout(1200);
  await X.p.getByRole("button", { name: /Chiudi|Va bene|Fatto/i }).last().click().catch(() => {});
  await X.p.waitForTimeout(500);
  /* la CELLA di una voce CON varianti: e' lei che semina il Foglio dalla mano */
  await batti(X.p, "Capricciosa");
  await X.p.waitForTimeout(800);
  const spuntate = await X.p.evaluate(() => {
    const f = document.querySelector(".sc-foglio");
    if (!f) return ["NESSUN FOGLIO"];
    return [...f.querySelectorAll('button[aria-pressed="true"]')].map((e) => e.textContent.trim());
  });
  ok(!spuntate.some((x) => /Bufala/.test(x)),
    `il Foglio NON nasce con la Bufala spuntata — spuntate: ${JSON.stringify(spuntate)}`);
  ok(spuntate.some((x) => /Funghi/.test(x)),
    `ma i Funghi si': la mano si semina ancora, si toglie solo cio' che e' finito — ${JSON.stringify(spuntate)}`);
  await X.p.getByRole("button", { name: /Maxi/ }).first().click();
  await X.p.waitForTimeout(900);
  ok(!(await suRiga(X.p, "Bufala")), "e la Capricciosa Maxi esce senza Bufala");
  ok(await suRiga(X.p, "Funghi"), "ma coi Funghi sopra");
  await X.ctx.close();
});

console.log(`\nerrori di pagina: ${errs.length}${errs.length ? " — " + errs[0] : ""}`);
ok(errs.length === 0, "zero errori JavaScript in tutto il giro");
await b.close(); await srv.chiudi();
console.log(ko ? `\nesauritotest: ${ko} CONTROLLI FALLITI` : "\nesauritotest: TUTTI I CONTROLLI PASSATI");
process.exit(ko === 0 ? 0 : 1);
