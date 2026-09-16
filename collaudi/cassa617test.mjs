/* gen-6.17: LA CASSA FA LA CASSA — scritto PRIMA del codice, contro gen-6.16.

   TRE RICHIESTE DI VALERIO del 13 settembre, con parole sue:
   1. «la cassa ancora vede le altre sezioni che non le interessano» e
      «la cassa puo' solo utilizzare le funzionalita' della cassa»;
   2. «le aggiunte hanno una barra poco utile, va risistemata … che fa vedere
      le aggiunte categorizzate e in ordine alfabetico», e «le aggiunte sono
      sempre gli ingredienti presenti nel magazzino … non dovrei neanche
      riscriverle e categorizzarle perche' l'ho gia' fatto»;
   3. «con zero categorie va in ordine alfabetico».

   IL CONTRATTO, fissato qui, e il codice si adegua.

   · «Sta solo in cassa» e' un INTERRUTTORE del profilo, acceso dall'admin da
     Gestione → Profili — non una deduzione da quello che il profilo NON ha.
     In quest'app struttura, correzioni, ordini e cassa sono tutti
     interruttori espliciti: dedurre un quinto da un'assenza vorrebbe dire
     che il giorno che l'admin assegna una linea al cassiere, quella persona
     perde i Conteggi senza che nessuno abbia spento niente.
   · chi ce l'ha acceso atterra in Cassa e la sua barra e' quella della Cassa,
     a TRE voci: Battere · Clienti · Giornata. L'uscita NON e' una quarta
     voce: e' il bottone che sta gia' in intestazione. Due bottoni con lo
     stesso nome accessibile sulla stessa schermata sono una trappola per chi
     legge e per i banchi (autorizzazionitest lo cerca senza «.first()»).
   · le tre voci NAVIGANO. Oggi chiamano solo setSezCassa, e finche' la barra
     della Cassa esiste solo dentro la Cassa non si vede; con la barra fissa,
     una voce che si accende e non porta da nessuna parte e' esattamente la
     «porta che non apre niente» che questa casa vieta.
   · la lente gli offre SOLO la porta della Cassa, e il «?» non gli offre ne'
     la Plancia (che per lui e' una porta chiusa) ne' la Panoramica (che
     racconta Conta · Ordina · Ricevi a chi non conta e non ordina).
   · il giro guidato non parte da solo.
   · LA CATEGORIA DELL'AGGIUNTA SI LEGGE DAL MAGAZZINO: se non e' scritta, si
     prende dalla categoria del primo prodotto della sua distinta. Quella
     scritta a mano vince sempre: e' una scelta esplicita, la distinta e' il
     ripiego.
   · LA FASCIA VA A CAPO invece di scorrere di lato, e SENZA categorie
     l'ordine e' ALFABETICO, non per battute.

   CONTRO gen-6.16 DEVONO ESSERE ROSSI: §1 §2 §3 §4 §5 §6 §8 §9 §14 — diciotto
   controlli, misurati il 13 settembre prima di scrivere una riga di codice.
   §2b NO, ed e' una correzione al primo giro: credevo fosse un rosso, e non
   lo e'. Su gen-6.16 la barra della Cassa esiste SOLO dentro la Cassa,
   quindi «vista» e' gia' giusta e setSezCassa basta; il difetto — tre voci
   che si accendono senza portare da nessuna parte — si apre soltanto quando
   quella barra diventa fissa. Resta un contro-controllo con un mestiere
   vero: che cambiando le voci da setSezCassa a una navigazione, la
   navigazione continui a funzionare.
   VERDI ANCHE PRIMA, apposta — sono i contro-controlli, senza i quali i
   rossi non proverebbero niente: §7 (la categoria scritta vince: senza
   questo, «leggi dalla distinta» potrebbe essere scritto come «leggi SOLO
   dalla distinta» e buttare via il lavoro di chi l'ha scritta), §10 (l'admin
   non cambia di una virgola), §11 (un operatore con «cassa» ma SENZA
   l'interruttore nuovo e' identico a oggi: e' quello che impedisce di
   spacciare per riparazione un permesso tolto a tutti), §12 (battere una
   Margherita resta UN tocco), §13 (la fascia chiusa costa gli stessi 48 px:
   la lezione di gen-6.04, che non si paga due volte).

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

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const artA = linea.articoli[0]; artA.qty = 60;
FM.cassaMagId = linea.id;

/* DUE PRODOTTI DI CATEGORIE DIVERSE, presi dal catalogo vero del seme: la
   categoria dell'aggiunta deve poter arrivare DA LI'. Se il seme cambia e
   non ce ne sono due di categorie diverse, il banco lo dice invece di
   misurare una cosa che non c'e'. */
const catDi = (p) => (base.categorie.find((c) => c.id === p.categoriaId) || {}).nome || "";
const prodConCat = base.prodotti.filter((p) => catDi(p));
const pUno = prodConCat[0];
const pDue = prodConCat.find((p) => catDi(p) !== catDi(pUno));
if (!pUno || !pDue) throw new Error("banco povero: servono due prodotti di categorie diverse");
const CAT_UNO = catDi(pUno), CAT_DUE = catDi(pDue);

base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6, attivo: true, varianti: [],
    distinta: [{ prodottoId: artA.prodottoId, qty: 1, uomId: artA.uomId }] },
];
base.postazioni = []; base.vendite = []; base.giornate = []; base.clienti = [];

/* ── SEME «ALFA»: nessuna categoria da nessuna parte, quindi FILA UNICA.
     I nomi sono scelti perche' l'alfabeto e le battute diano ordini DIVERSI:
     «Zucchine» e' la piu' battuta e in alfabeto sta ULTIMA. Se coincidessero,
     §9 sarebbe verde comunque e non proverebbe niente.
     OTTO aggiunte e non tre: a 390px su una riga sola non ci stanno, ed e'
     esattamente la condizione in cui si vede se vanno a capo (§8). */
const alfa = JSON.parse(JSON.stringify(base));
alfa.aggiunte = ["Acciughe", "Bufala", "Cipolla", "Funghi", "Olive", "Patate", "Salsiccia", "Zucchine"]
  .map((n, i) => ({ id: "ag-" + i, nome: n, prezzo: 1 + i * 0.1, attivo: true, gruppi: ["Pizze"], distinta: [] }));
const IERI = Date.now() - 3600 * 1000;
alfa.vendite = [{
  id: "vn-v", t: IERI, giorno: new Date(IERI).toISOString().slice(0, 10), sedeId: FM.id,
  chi: "OpCassa", n: 1, totale: 0, metodo: "contanti", stato: "registrata", scarico: [],
  righe: [{ voceId: "li-mar", nome: "Margherita", qty: 9, prezzo: 0, gruppo: "Pizze",
    agg: [{ id: "ag-7", nome: "Zucchine", prezzo: 1.7 }] }],
}];

/* ── SEME «CAT»: la categoria arriva DALLA DISTINTA per una, ed e' SCRITTA
     per l'altra. Sono i due casi di §6 e §7, e stanno nello stesso seme
     apposta: cosi' la divisione in categorie e' viva in tutti e due. */
const cat = JSON.parse(JSON.stringify(base));
cat.aggiunte = [
  /* niente categoria scritta, ma una distinta che punta a un prodotto che ce
     l'ha: oggi finisce in «Altro», dopo la riparazione sotto CAT_UNO */
  { id: "ag-dis", nome: "Dalmagazzino", prezzo: 1, attivo: true, gruppi: ["Pizze"],
    distinta: [{ prodottoId: pUno.id, qty: 1, uomId: pUno.uomBase }] },
  /* categoria SCRITTA che NON e' quella del prodotto della sua distinta:
     e' l'unico modo di provare che lo scritto vince davvero */
  { id: "ag-scr", nome: "Scrittaamano", prezzo: 1, attivo: true, gruppi: ["Pizze"], categoria: "Salumi",
    distinta: [{ prodottoId: pDue.id, qty: 1, uomId: pDue.uomBase }] },
];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  /* l'interruttore nuovo. Su gen-6.16 e' un campo sconosciuto: viene
     ignorato, e il profilo si comporta come un cassiere qualunque — ed e'
     proprio per questo che i rossi di §1-§5 sono rossi VERI. */
  solo: { id: "pr-so", nome: "SoloCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, soloCassa: true, pinHash: hash("2222") },
  /* lo stesso profilo SENZA l'interruttore: il contro-controllo di §11 */
  misto: { id: "pr-mi", nome: "MistoCassa", ruolo: "operatore", sedeId: FM.id, colore: "#10B981",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("3333") },
};

const srv = await apriServer();
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];

/* «conTour: true» NON mette la chiave che salta il giro guidato: serve a §5
   e a §10, che il giro guidato lo devono guardare in faccia. */
const apri = async (st0, profili, nome, pin, conTour = false) => {
  const st = JSON.parse(JSON.stringify(st0));
  st.profili = profili;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j, salta]) => {
    try { if (salta) localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, [JSON.stringify(st), !conTour]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(srv.url); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1600);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const barra = (p) => p.evaluate(() => [...document.querySelectorAll('nav[aria-label="Navigazione principale"] button, nav[aria-label="Navigazione principale"] a')]
  .map((x) => x.textContent.trim()).filter(Boolean));
const apriFascia = async (p) => { await p.locator('[data-fascia-chiusa="1"] button').first().click(); await p.waitForTimeout(500); };
const chipInOrdine = (p) => p.evaluate(() =>
  [...document.querySelectorAll('[data-fascia="1"] [data-agg]')].map((e) => e.getAttribute("data-agg")));
const lente = async (p, q) => {
  await p.getByRole("button", { name: /Cerca un prodotto o una funzione/i }).first().click();
  await p.waitForTimeout(450);
  await p.getByRole("textbox").first().fill(q); await p.waitForTimeout(700);
};
const chiudiLente = async (p) => { await p.keyboard.press("Escape").catch(() => {}); await p.waitForTimeout(400); };
/* ── LA CASSA SI APRE COME LA APRIREBBE UNA PERSONA ──
   Se la barra dice «Cassa» si tocca quella; se dice «Battere», dentro ci
   siamo gia'. Serve perche' §2b, §6-§9 e §12-§13 misurano cose che stanno
   DENTRO la Cassa: senza, su gen-6.16 sarebbero rosse perche' il profilo e'
   atterrato in Home — cioe' rosse per il motivo di §1, non per il loro. Un
   rosso preso in prestito non prova niente, esattamente come un verde. */
const entraInCassa = async (p) => {
  const voci = await barra(p);
  if (voci.some((v) => /battere/i.test(v))) return;
  const c = p.locator('nav[aria-label="Navigazione principale"]').getByRole("button", { name: /Cassa/i });
  if (await c.count()) { await c.first().click(); await p.waitForTimeout(1000); }
};

/* ═══ 1-5. LA POSTAZIONE DI CHI STA SOLO IN CASSA ═══ */
const S = await apri(alfa, [PR.solo, PR.admin], "SoloCassa", "2222");

console.log("\n— 1. chi sta solo in cassa ATTERRA in cassa —");
await prova("§1", async () => {
  const t = await testoDi(S.p);
  ok(/Margherita/.test(t), "appena entrato ha davanti la griglia del listino, non la Home");
  ok(!/Inizia conteggio/.test(t), "e non «Inizia conteggio»: il conteggio non e' il suo mestiere");
});

console.log("\n— 2. la barra e' quella della Cassa, e ha TRE voci —");
await prova("§2", async () => {
  const voci = await barra(S.p);
  const ha = (n) => voci.some((v) => v.toLowerCase().includes(n));
  ok(ha("battere") && ha("clienti") && ha("giornata"),
    `ci sono Battere, Clienti e Giornata — barra: ${JSON.stringify(voci)}`);
  ok(!ha("magazzin") && !ha("conteggi") && !ha("ordini") && !ha("home"),
    `e NON ci sono le voci che non le interessano — barra: ${JSON.stringify(voci)}`);
  /* la quarta voce NON c'e': l'uscita e' quella dell'intestazione, e due
     bottoni con lo stesso nome sulla stessa schermata sono una trappola */
  ok(!ha("esci"), `nessuna voce «Esci» in barra: l'uscita e' in alto — barra: ${JSON.stringify(voci)}`);
  ok(voci.length === 3, `tre voci esatte, non quattro — ne trovo ${voci.length}`);
  /* e l'uscita vera c'e' ed e' UNA SOLA */
  const quante = await S.p.getByRole("button", { name: "Esci dal profilo" }).count();
  ok(quante === 1, `il bottone «Esci dal profilo» e' uno solo in tutta la schermata — ne trovo ${quante}`);
});

console.log("\n— 2b. le tre voci NAVIGANO davvero —");
await prova("§2b", async () => {
  await entraInCassa(S.p);
  await S.p.getByRole("button", { name: /Clienti/i }).first().click(); await S.p.waitForTimeout(700);
  ok(/rubrica|clienti/i.test(await testoDi(S.p)), "«Clienti» apre la rubrica");
  await S.p.getByRole("button", { name: /Battere/i }).first().click(); await S.p.waitForTimeout(700);
  ok(/Margherita/.test(await testoDi(S.p)), "e «Battere» riporta sulla griglia");
});

console.log("\n— 3. la lente gli offre SOLO la porta della Cassa —");
await prova("§3", async () => {
  await lente(S.p, "vendita");
  ok(/Battere una vendita/.test(await testoDi(S.p)), "la sua porta c'e': «Battere una vendita»");
  await S.p.getByRole("textbox").first().fill("comande"); await S.p.waitForTimeout(700);
  ok(!/comande in cucina/i.test(await testoDi(S.p)), "«Le comande in cucina» non gli viene offerta");
  await S.p.getByRole("textbox").first().fill("magazzin"); await S.p.waitForTimeout(700);
  const t = await testoDi(S.p);
  ok(!/Copia da un magazzino|Soglie per giorno|Aggiungi pi[uù] prodotti/i.test(t),
    "e nemmeno le porte di magazzino");
  await S.p.getByRole("textbox").first().fill("contare"); await S.p.waitForTimeout(700);
  ok(!/Contare quello che c/i.test(await testoDi(S.p)), "ne' «Contare quello che c'e'»");
  await chiudiLente(S.p);
});

console.log("\n— 4. il «?» non gli apre porte chiuse —");
await prova("§4", async () => {
  await S.p.getByRole("button", { name: /Guida e tutorial/i }).first().click(); await S.p.waitForTimeout(600);
  const t = await testoDi(S.p);
  ok(!/Plancia: la rete a colpo d/i.test(t),
    "niente «Plancia»: per lui e' una porta chiusa, e una porta chiusa offerta e' una trappola");
  ok(!/Panoramica completa/i.test(t),
    "niente «Panoramica completa»: racconta Conta · Ordina · Ricevi a chi non conta e non ordina");
  ok(/Guida di .?Cassa/i.test(t), "resta la guida della sua stanza: «Guida di «Cassa»»");
  await chiudiLente(S.p);
});
await S.ctx.close();

console.log("\n— 5. il giro guidato non parte da solo —");
await prova("§5", async () => {
  const T5 = await apri(alfa, [PR.solo, PR.admin], "SoloCassa", "2222", true);
  const t = await testoDi(T5.p);
  ok(!/Benvenuto!/.test(t) && !/Supply Chain Pro lavora in 3 mosse/.test(t),
    "nessun giro guidato addosso a chi fa un mestiere solo");
  ok(/Margherita/.test(t), "e davanti ha la sua griglia");
  await T5.ctx.close();
});

/* ═══ 6-7. LA CATEGORIA SI LEGGE DAL MAGAZZINO ═══ */
const C = await apri(cat, [PR.solo, PR.admin], "SoloCassa", "2222");
const dentroCat = (p) => p.evaluate(() => {
  const out = {};
  for (const g of document.querySelectorAll('[data-fascia="1"] [data-cat]'))
    out[g.getAttribute("data-cat")] = [...g.querySelectorAll("[data-agg]")].map((e) => e.getAttribute("data-agg"));
  return out;
});

console.log("\n— 6. senza categoria scritta la prende dal prodotto della distinta —");
await prova("§6", async () => {
  await entraInCassa(C.p);
  await apriFascia(C.p);
  const d = await dentroCat(C.p);
  ok((d[CAT_UNO] || []).includes("Dalmagazzino"),
    `«Dalmagazzino» sta sotto «${CAT_UNO}», la categoria del prodotto che scala — trovato ${JSON.stringify(d)}`);
  ok(!(d["Altro"] || []).includes("Dalmagazzino"),
    "e NON sotto «Altro»: la categoria Valerio l'ha gia' scritta, sul prodotto");
});

console.log("\n— 7. CONTRO-CONTROLLO: la categoria scritta a mano vince —");
await prova("§7", async () => {
  const d = await dentroCat(C.p);
  ok((d["Salumi"] || []).includes("Scrittaamano"),
    `«Scrittaamano» resta sotto «Salumi», quella scritta — trovato ${JSON.stringify(d)}`);
  /* senza questa riga il controllo qui sotto sarebbe verde anche su una
     fascia VUOTA: «non sta sotto X» e' vero pure quando non sta da nessuna
     parte. Prima si pretende di aver visto la fascia piena. */
  ok(Object.keys(d).length >= 2, `la fascia e' divisa in categorie — trovato ${JSON.stringify(d)}`);
  ok(!(d[CAT_DUE] || []).includes("Scrittaamano"),
    `e non finisce sotto «${CAT_DUE}», che e' la categoria del suo prodotto: una scelta esplicita non si scavalca`);
});
await C.ctx.close();

/* ═══ 8-9. LA FASCIA: VA A CAPO, E IN ALFABETO ═══ */
const A = await apri(alfa, [PR.solo, PR.admin], "SoloCassa", "2222");

console.log("\n— 8. i chip vanno a capo invece di scorrere di lato —");
await prova("§8", async () => {
  await entraInCassa(A.p);
  await apriFascia(A.p);
  const righe = await A.p.evaluate(() => {
    const c = [...document.querySelectorAll('[data-fascia="1"] [data-agg]')];
    return [...new Set(c.map((e) => Math.round(e.getBoundingClientRect().top)))].length;
  });
  ok(righe >= 2, `otto ingredienti su 390px stanno su piu' righe — ne conto ${righe}`);
  /* e non scorrono di lato: ne' la pagina, ne' la loro fascia */
  const lato = await A.p.evaluate(() => {
    const f = document.querySelector('[data-fascia="1"]');
    const dentro = f ? [...f.querySelectorAll("div")].some((d) => d.scrollWidth > d.clientWidth + 1) : true;
    const m = document.querySelector("main") || document.documentElement;
    return { dentro, pagina: m.scrollWidth > m.clientWidth + 1 };
  });
  ok(!lato.dentro, "dentro la fascia non c'e' piu' niente che scorra in orizzontale");
  ok(!lato.pagina, "e la pagina non scorre di lato");
  /* il tetto resta: la lezione di gen-6.04 (209px su 844 erano troppi) */
  const h = await A.p.evaluate(() => {
    const f = document.querySelector('[data-fascia="1"]');
    return f ? Math.round(f.getBoundingClientRect().height) : 0;
  });
  ok(h > 0 && h <= 209, `e la fascia aperta non sfonda il tetto di gen-6.04 — alta ${h} px`);
});

console.log("\n— 9. senza categorie l'ordine e' ALFABETICO, non per battute —");
await prova("§9", async () => {
  const chips = await chipInOrdine(A.p);
  const atteso = ["Acciughe", "Bufala", "Cipolla", "Funghi", "Olive", "Patate", "Salsiccia", "Zucchine"];
  ok(JSON.stringify(chips) === JSON.stringify(atteso),
    `in alfabeto, e «Zucchine» — la piu' battuta — sta ULTIMA. Trovato ${JSON.stringify(chips)}`);
});

console.log("\n— 12. CONTRO-CONTROLLO: la pizza liscia resta UN tocco —");
await prova("§12", async () => {
  await A.p.getByRole("button", { name: "Chiudi gli ingredienti", exact: true }).click().catch(() => {});
  await A.p.waitForTimeout(400);
  await batti(A.p, "Margherita");
  await A.p.waitForTimeout(600);
  ok(/€ 6,00/.test(await testoDi(A.p)), "un tocco sulla cella e la Margherita e' nel conto");
});

console.log("\n— 13. CONTRO-CONTROLLO: la fascia chiusa costa gli stessi 48 px —");
await prova("§13", async () => {
  const h = await A.p.evaluate(() => {
    const c = document.querySelector('[data-fascia-chiusa="1"] button');
    return c ? Math.round(c.getBoundingClientRect().height) : 0;
  });
  ok(h >= 44 && h <= 56, `la pastiglia chiusa e' alta ${h} px: come prima, un dito e non di piu'`);
});
await A.ctx.close();

/* ═══ 10-11. CHI NON DEVE CAMBIARE, NON CAMBIA ═══ */
console.log("\n— 10. CONTRO-CONTROLLO: l'admin non cambia di una virgola —");
await prova("§10", async () => {
  const AD = await apri(alfa, [PR.admin], "Admin", "1234", true);
  const voci = await barra(AD.p);
  ok(voci.length === 5 && voci.some((v) => /home/i.test(v)) && voci.some((v) => /magazzin/i.test(v)),
    `la barra dell'admin resta a cinque voci — ${JSON.stringify(voci)}`);
  ok(/Benvenuto!/.test(await testoDi(AD.p)), "e il giro guidato gli parte come sempre");
  await AD.ctx.close();
});

console.log("\n— 11. CONTRO-CONTROLLO: cassa SENZA l'interruttore e' identica a oggi —");
await prova("§11", async () => {
  const M = await apri(alfa, [PR.misto, PR.admin], "MistoCassa", "3333");
  const voci = await barra(M.p);
  const ha = (n) => voci.some((v) => v.toLowerCase().includes(n));
  ok(ha("home") && ha("conteggi") && ha("magazzin") && ha("cassa") && ha("ordini"),
    `chi ha «cassa» e basta tiene tutta la sua barra — ${JSON.stringify(voci)}`);
  ok(/Inizia conteggio/.test(await testoDi(M.p)),
    "e atterra sulla Home col suo conteggio: non gli e' stato tolto niente");
  await M.ctx.close();
});

/* ═══ 14. I DUE MURI CHE NON SI VEDONO ═══
   Due riparazioni di gen-6.17 non hanno una porta da cui provarle col dito,
   ed e' voluto: sono muri di riserva. Il gate di contenuto() serve alle porte
   di DOMANI — la lente e il «?» oggi sono gia' filtrati, quindi dallo schermo
   non c'e' modo di arrivarci; e le tre voci che navigano si vedrebbero solo
   da una stanza che non e' la Cassa, dove per costruzione non si arriva.
   Un muro senza sentinella pero' si sbriciola al primo che passa di li' fra
   sei mesi: due sabotaggi (togliere il gate, rimettere setSezCassa) non
   farebbero arrossire niente, e un sabotaggio MUTO in questa casa non si
   ignora mai. Quindi si guarda il SORGENTE, come fa gen603test col motore.
   E' un controllo debole — vede il testo, non il comportamento — ma puo'
   diventare rosso, che e' l'unica cosa che lo distingue da un ornamento. */
console.log("\n— 14. i due muri che non si vedono dallo schermo —");
await prova("§14", async () => {
  /* IL SORGENTE IN PROVA, non quello del repository. I due sabotaggi su §14
     sono usciti MUTI al primo giro proprio per questo: sabotaggi-gen617
     scrive la copia rotta in /tmp e ci costruisce il pacchetto, ma §14
     leggeva «../app/app.jsx», cioe' il file INTEGRO — e diceva verde su un
     muro che non c'era piu'. E' la stessa convenzione di spietest:87 e
     gen606test, e non averla usata era mio. Un muto vale piu' di un rosso:
     questo l'ha trovato. */
  const app = readFileSync(process.env.SORGENTE || "../app/app.jsx", "utf8");
  const i = app.indexOf("const chiusa =");
  const gate = i > 0 ? app.slice(i, i + 900) : "";
  ok(/soloQui && vista !== "cassa"/.test(gate),
    "il gate di contenuto() chiude ogni vista che non sia la Cassa a chi sta solo in cassa");
  const j = app.indexOf("const BARRA_CASSA = [");
  const barraSrc = j > 0 ? app.slice(j, app.indexOf("];", j)) : "";
  const quante = (barraSrc.match(/vaiInCassa\(/g) || []).length;
  ok(quante === 3, `e le tre voci NAVIGANO: ${quante} chiamate a vaiInCassa fra Battere, Clienti e Giornata`);
  ok(barraSrc.length > 100 && !/azione: \(\) => setSezCassa\(/.test(barraSrc),
    "nessuna voce si limita piu' a cambiare stanza senza cambiare vista");
});

console.log(`\nerrori di pagina: ${errs.length}${errs.length ? " — " + errs[0] : ""}`);
ok(errs.length === 0, "zero errori JavaScript in tutto il giro");
await b.close(); await srv.chiudi();
console.log(ko ? `\ncassa617test: ${ko} CONTROLLI FALLITI` : "\ncassa617test: TUTTI I CONTROLLI PASSATI");
process.exit(ko === 0 ? 0 : 1);
