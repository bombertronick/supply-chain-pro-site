/* gen-6.08: IL CLIENTE E IL SUO ORDINE.

   CHIESTO DA VALERIO il 1º e il 4 settembre, e ancora il 6 quando ha dovuto
   domandarmi se le sue richieste erano state fatte: registrare il cliente col
   nome e il telefono, take away o consegna, la via OBBLIGATORIA verificabile
   sulle mappe con un tasto, la fascia oraria, il cliente cercabile per
   telefono, e l'ordine rapido per chi e' gia' registrato.

   SCRITTO PRIMA DELLE MODIFICHE, contro gen-6.07 (il build online). Devono
   essere ROSSI: §2 (la pastiglia del cliente non esiste), §3 (asporto),
   §4 (consegna e mappa), §5 (fascia), §6 (registrazione e dedup), §7 (ricerca
   e ordine rapido), §8b (le colonne del CSV), §9 (tetto), §10 (cartellino).
   Sono VERDI ANCHE PRIMA, apposta, i contro-controlli: §1 (chi non ha la cassa
   non vede niente), §8a (telefono e via NON in s.vendite — prima e' verde
   perche' non c'e' proprio niente, dopo dev'essere verde perche' li ho tenuti
   fuori: e' il controllo che difende la scelta, non la novita'), §11 (la pizza
   liscia al banco resta un tocco e non chiede niente a nessuno) e §12 (uno
   stato vecchio senza «clienti» non fa esplodere l'app).

   NIENTE DATI VERI DI CLIENTI QUI DENTRO: i nomi e i numeri sono inventati e
   il repository e' pubblico. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
import { apriServer } from "./servi.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
/* una sezione che esplode (un campo che ancora non esiste) deve CONTARE come
   rossa, non ammazzare il giro: il primo giro si fa su gen-6.07 apposta */
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 100)}`); } };

/* ── IL BANCO ── */
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const artA = linea.articoli[0], artB = linea.articoli[1];
artA.qty = 40; artB.qty = 40;
FM.cassaMagId = linea.id;
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6, aliquota: 10, attivo: true,
    varianti: [], distinta: [{ prodottoId: artA.prodottoId, qty: 1, uomId: artA.uomId }] },
  { id: "li-bib", nome: "Bibita", gruppo: "Bere", prezzo: 2.5, attivo: true,
    varianti: [], distinta: [{ prodottoId: artB.prodottoId, qty: 1, uomId: artB.uomId }] },
];
/* una postazione che reclama le Pizze: serve alla §10 (il cartellino) */
base.postazioni = [{ id: "po-piz", nome: "Pizzeria", sedeId: FM.id, gruppi: ["Pizze"] }];
base.vendite = []; base.giornate = [];

/* CLIENTI FINTI, mai veri: due gia' in rubrica per provare la ricerca e il
   dedup, con il telefono scritto in due modi diversi apposta. */
const IERI = Date.now() - 26 * 3600 * 1000;
base.clienti = [
  { id: "cl-uno", nome: "Cliente Uno", tel: "3401110001", via: "Via delle Prove 1", t: IERI, ultimo: IERI, n: 3 },
  { id: "cl-due", nome: "Cliente Due", tel: "+39 340 111 0002", via: "", t: IERI, ultimo: IERI, n: 1 },
];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  opZero: { id: "pr-o0", nome: "OpZero", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], pinHash: hash("2222") },
  opCassa: { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
  opCucina: { id: "pr-oc", nome: "OpCucina", ruolo: "operatore", sedeId: FM.id, colore: "#10B981",
    magazziniIds: [linea.id], comande: true, postazioniIds: ["po-piz"], pinHash: hash("3333") },
};

const srv = await apriServer();
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (st0, profili, nome, pin) => {
  const st = JSON.parse(JSON.stringify(st0));
  st.profili = profili;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
    /* le mappe non si aprono davvero in un collaudo: si registra DOVE
       sarebbe andato il dito, che e' quello che il controllo deve leggere */
    window.__aperti = [];
    const vero = window.open;
    window.open = (u, ...r) => { window.__aperti.push(String(u)); return vero ? null : null; };
  }, [JSON.stringify(st)]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(srv.url); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1500);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const testoNav = async (p) => (await p.locator('nav[aria-label="Navigazione principale"]').innerText()).replace(/\s+/g, " ");
const stato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const incassa = async (p) => {
  await p.getByRole("button", { name: "Incassa", exact: true }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Registra l'incasso", exact: true }).click();
  await p.waitForTimeout(1400);
};
/* la pastiglia del cliente: una porta sola, sempre lo stesso nome
   accessibile, cosi' i controlli non indovinano dove si tocca */
const apriCliente = async (p) => {
  await p.getByRole("button", { name: /^Chi è, e come lo vuole/ }).click();
  await p.waitForTimeout(500);
};
const chiudiCliente = async (p) => {
  await p.getByRole("button", { name: "Va bene", exact: true }).click();
  await p.waitForTimeout(500);
};
const scrivi = async (p, label, testo) => {
  await p.getByLabel(label, { exact: false }).first().fill(testo);
  await p.waitForTimeout(400);
};

/* ═══ 1. CONTRO-CONTROLLO: chi non ha la cassa non vede nessun cliente ═══ */
console.log("\n— 1. senza «cassa» non c'è nessun cliente da nessuna parte —");
const Z = await apri(base, [PR.opZero], "OpZero", "2222");
await prova("§1", async () => {
  ok(!/Cassa/.test(await testoNav(Z.p)), "la Cassa non è in barra per chi non ce l'ha");
  const t = await testoDi(Z.p);
  ok(!/Cliente Uno/.test(t) && !/3401110001/.test(t),
    "e da nessuna parte si legge un nome o un numero di telefono di un cliente");
});
await Z.ctx.close();

/* ═══ 2. LA PASTIGLIA C'È, PARTE SU «BANCO», E NON COSTA UN FOGLIO ═══ */
console.log("\n— 2. la pastiglia del cliente: chiusa, e dice a parole dov'è —");
const C = await apri(base, [PR.opCassa], "OpCassa", "2222");
await prova("§2", async () => {
  await vaiA(C.p, "Cassa");
  const pill = C.p.getByRole("button", { name: /^Chi è, e come lo vuole/ });
  ok((await pill.count()) > 0, "in Cassa c'è la porta «Chi è, e come lo vuole»");
  ok(/Banco/.test(await pill.first().innerText()),
    "e parte su «Banco»: chi vende al bancone non paga nemmeno un tocco");
  /* la regola di gen-6.04: chiuso non vuol dire muto, ma nemmeno ingombrante */
  const box = await pill.first().boundingBox();
  ok(!!box && box.height <= 56, `la pastiglia è alta ${box ? Math.round(box.height) : "?"} punti, non una fascia`);
});

/* ═══ 3. ASPORTO: IL NOME È OBBLIGATORIO ═══ */
console.log("\n— 3. asporto: senza nome non si incassa, e c'è scritto perché —");
await prova("§3", async () => {
  await C.p.getByRole("button", { name: "Aggiungi Margherita" }).click(); await C.p.waitForTimeout(300);
  await apriCliente(C.p);
  await C.p.getByRole("button", { name: "Asporto", exact: true }).click(); await C.p.waitForTimeout(350);
  ok(/Nome/.test(await testoDi(C.p)), "il foglio chiede il nome");
  await chiudiCliente(C.p);
  await C.p.getByRole("button", { name: "Incassa", exact: true }).click(); await C.p.waitForTimeout(500);
  await C.p.getByRole("button", { name: "Registra l'incasso", exact: true }).click(); await C.p.waitForTimeout(900);
  const t = await testoDi(C.p);
  ok(/serve il nome/i.test(t), "senza nome l'incasso si rifiuta e lo DICE (non un tasto muto)");
  const st = await stato(C.p);
  ok((st.vendite || []).length === 0, "e infatti non è stata registrata nessuna vendita");
  /* e adesso col nome passa */
  await C.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
  await C.p.waitForTimeout(400);
  await apriCliente(C.p);
  await scrivi(C.p, "Nome", "Nome Finto");
  await chiudiCliente(C.p);
  await incassa(C.p);
  const st2 = await stato(C.p);
  const v = (st2.vendite || [])[0];
  ok(!!v && v.cli?.modo === "asporto" && v.cli?.nome === "Nome Finto",
    "col nome la vendita passa e porta «asporto» + il nome");
});

/* ═══ 4. CONSEGNA: LA VIA È OBBLIGATORIA, E SI VERIFICA SULLE MAPPE ═══ */
console.log("\n— 4. consegna: via obbligatoria, col tasto che la apre sulle mappe —");
await prova("§4", async () => {
  await C.p.getByRole("button", { name: "Aggiungi Margherita" }).click(); await C.p.waitForTimeout(300);
  await apriCliente(C.p);
  await C.p.getByRole("button", { name: "Consegna", exact: true }).click(); await C.p.waitForTimeout(350);
  await scrivi(C.p, "Nome", "Altro Finto");
  await chiudiCliente(C.p);
  await C.p.getByRole("button", { name: "Incassa", exact: true }).click(); await C.p.waitForTimeout(500);
  await C.p.getByRole("button", { name: "Registra l'incasso", exact: true }).click(); await C.p.waitForTimeout(900);
  ok(/serve la via/i.test(await testoDi(C.p)),
    "una consegna senza via si rifiuta: promettere una consegna a un indirizzo che non c'è è peggio di un no");
  await C.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
  await C.p.waitForTimeout(400);
  await apriCliente(C.p);
  await scrivi(C.p, "Via e numero", "Via Inventata 42");
  const mappa = C.p.getByRole("button", { name: /mappa/i });
  ok((await mappa.count()) > 0, "col la via scritta compare il tasto che la apre sulle mappe");
  await mappa.first().click(); await C.p.waitForTimeout(500);
  const aperti = await C.p.evaluate(() => window.__aperti || []);
  ok(aperti.some((u) => /maps/.test(u) && /Inventata/.test(u)),
    `il tasto apre una mappa CON DENTRO la via scritta — ha aperto: ${JSON.stringify(aperti).slice(0, 90)}`);
  await chiudiCliente(C.p);
  await incassa(C.p);
  const st = await stato(C.p);
  const v = (st.vendite || [])[0];
  ok(!!v && v.cli?.modo === "consegna", "e la vendita passa, marcata «consegna»");
});

/* ═══ 5. LA FASCIA ORARIA ═══ */
console.log("\n— 5. la fascia oraria: si scrive, viaggia, si rilegge —");
await prova("§5", async () => {
  await C.p.getByRole("button", { name: "Aggiungi Bibita" }).click(); await C.p.waitForTimeout(300);
  await apriCliente(C.p);
  await C.p.getByRole("button", { name: "Asporto", exact: true }).click(); await C.p.waitForTimeout(300);
  await scrivi(C.p, "Nome", "Terzo Finto");
  await scrivi(C.p, "Per le", "21:15");
  await chiudiCliente(C.p);
  const pill = await C.p.getByRole("button", { name: /^Chi è, e come lo vuole/ }).first().innerText();
  ok(/21:15/.test(pill), "la pastiglia chiusa dice l'ora: si legge senza riaprire il foglio");
  await incassa(C.p);
  const st = await stato(C.p);
  const v = (st.vendite || [])[0];
  ok(!!v && v.cli?.fascia === "21:15", "e la fascia è dentro la vendita");
});

/* ═══ 6. IL CLIENTE SI REGISTRA, E NON SI SDOPPIA ═══ */
console.log("\n— 6. il cliente entra in rubrica una volta sola —");
await prova("§6", async () => {
  await C.p.getByRole("button", { name: "Aggiungi Margherita" }).click(); await C.p.waitForTimeout(300);
  await apriCliente(C.p);
  await C.p.getByRole("button", { name: "Asporto", exact: true }).click(); await C.p.waitForTimeout(300);
  await scrivi(C.p, "Nome", "Quarto Finto");
  await scrivi(C.p, "Telefono", "340 111 0009");
  await chiudiCliente(C.p);
  await incassa(C.p);
  const st = await stato(C.p);
  const nuovi = (st.clienti || []).filter((c) => c.nome === "Quarto Finto");
  ok(nuovi.length === 1, `il cliente nuovo è in rubrica una volta sola (ne trovo ${nuovi.length})`);
  ok(nuovi[0]?.n === 1, "col contatore a 1 ordine");
  /* stesso numero scritto in un altro modo: NON deve nascere un doppione.
     Si RIBATTE tutto a mano — senza toccare il candidato che compare — se no
     il riconoscimento passerebbe per l'id e non proverebbe niente sul
     numero, che è il caso vero: la stessa persona che richiama e detta il
     numero in un'altra forma. */
  await C.p.getByRole("button", { name: "Aggiungi Margherita" }).click(); await C.p.waitForTimeout(300);
  await apriCliente(C.p);
  await C.p.getByRole("button", { name: "Asporto", exact: true }).click(); await C.p.waitForTimeout(300);
  await scrivi(C.p, "Telefono", "+39 3401110009");
  await scrivi(C.p, "Nome", "Quarto Finto");
  await chiudiCliente(C.p);
  await incassa(C.p);
  const st2 = await stato(C.p);
  const dopo = (st2.clienti || []).filter((c) => String(c.tel).replace(/\D/g, "").endsWith("3401110009"));
  ok(dopo.length === 1, `«340 111 0009» e «+39 3401110009» sono lo stesso cliente (ne trovo ${dopo.length})`);
  ok(dopo[0]?.n === 2, `e il contatore è salito a 2 — vale ${dopo[0]?.n}`);
});

/* ═══ 7. CERCABILE PER TELEFONO, E L'ORDINE RAPIDO ═══ */
console.log("\n— 7. si cerca per telefono e l'ordine parte già pieno —");
await prova("§7", async () => {
  await C.p.getByRole("button", { name: "Aggiungi Margherita" }).click(); await C.p.waitForTimeout(300);
  await apriCliente(C.p);
  await C.p.getByRole("button", { name: "Consegna", exact: true }).click(); await C.p.waitForTimeout(300);
  await scrivi(C.p, "Telefono", "0001");
  ok(/Cliente Uno/.test(await testoDi(C.p)),
    "battendo quattro cifre del numero compare il cliente già in rubrica");
  await C.p.getByRole("button", { name: /Cliente Uno/ }).first().click(); await C.p.waitForTimeout(500);
  /* i campi si leggono col VALORE, non dal testo della pagina: quello che
     sta dentro un input non compare in innerText, e un controllo che guarda
     nel posto sbagliato è verde per caso o rosso per caso */
  const valore = async (label) => C.p.getByLabel(label, { exact: false }).first().inputValue();
  ok((await valore("Nome")) === "Cliente Uno", "toccandolo si riempie il nome");
  ok((await valore("Via e numero")) === "Via delle Prove 1",
    "e anche la via: l'ordine rapido di chi è già registrato è un tocco");
  await chiudiCliente(C.p);
  await incassa(C.p);
  const st = await stato(C.p);
  const v = (st.vendite || [])[0];
  ok(!!v && v.cli?.id === "cl-uno" && v.cli?.nome === "Cliente Uno",
    "la vendita è legata al cliente che c'era già, non a un gemello nuovo");
  const c1 = (st.clienti || []).find((c) => c.id === "cl-uno");
  ok(c1?.n === 4, `e il suo contatore passa da 3 a 4 — vale ${c1?.n}`);
});

/* ═══ 8. LA PRIVACY: DOVE IL TELEFONO NON DEVE ARRIVARE ═══ */
console.log("\n— 8. telefono e via restano in rubrica, non nelle vendite —");
await prova("§8a", async () => {
  const st = await stato(C.p);
  const crudo = JSON.stringify(st.vendite || []);
  ok(!/0001|0009|Inventata|delle Prove/.test(crudo),
    "in s.vendite non c'è NESSUN numero di telefono e NESSUN indirizzo: solo id, nome e modo");
  ok((st.vendite || []).every((v) => !v.cli || (v.cli.tel === undefined && v.cli.via === undefined)),
    "e il campo «cli» porta i quattro dati che servono e basta");
});
await prova("§8b", async () => {
  /* il CSV: le colonne nuove vanno IN CODA (la regola di gen-6.02) e non
     portano il telefono. Si legge la funzione, non si scarica il file. */
  const sorgente = readFileSync("app-under-test.jsx", "utf8");
  const i = sorgente.indexOf("const esportaVendite");
  const fine = sorgente.indexOf("scaricaCsv(`vendite-", i);
  const corpo = sorgente.slice(i, fine);
  ok(/"Cliente"/.test(corpo) && /"Modo"/.test(corpo), "il CSV esporta «Cliente» e «Modo»");
  ok(!/\.tel\b/.test(corpo) && !/\.via\b/.test(corpo), "e NON esporta né telefono né indirizzo");
  const testata = corpo.slice(corpo.indexOf("[["), corpo.indexOf("]]"));
  ok(testata.indexOf('"Aggiunte"') < testata.indexOf('"Cliente"'),
    "le colonne nuove stanno IN CODA: chi apre in Excel il file di ieri ritrova le prime al loro posto");
});

/* ═══ 9. IL TETTO DELLA RUBRICA ═══ */
console.log("\n— 9. la rubrica ha un tetto, e tiene i più recenti —");
await prova("§9", async () => {
  const grosso = JSON.parse(JSON.stringify(base));
  grosso.clienti = Array.from({ length: 420 }, (_, i) => ({
    id: "cl-x" + i, nome: "Finto " + i, tel: "34099" + String(i).padStart(5, "0"),
    via: "", t: IERI - i * 1000, ultimo: IERI - i * 1000, n: 1,
  }));
  const G = await apri(grosso, [PR.opCassa], "OpCassa", "2222");
  await vaiA(G.p, "Cassa");
  await G.p.getByRole("button", { name: "Aggiungi Bibita" }).click(); await G.p.waitForTimeout(300);
  await apriCliente(G.p);
  await G.p.getByRole("button", { name: "Asporto", exact: true }).click(); await G.p.waitForTimeout(300);
  await scrivi(G.p, "Nome", "Ultimo Finto");
  await scrivi(G.p, "Telefono", "3409988888");
  await chiudiCliente(G.p);
  await incassa(G.p);
  const st = await stato(G.p);
  ok((st.clienti || []).length <= 300, `la rubrica è potata: ${(st.clienti || []).length} clienti, non 421`);
  ok((st.clienti || []).some((c) => c.nome === "Ultimo Finto"),
    "e quello di adesso c'è: si buttano i più vecchi, mai quello che stai servendo");
  ok((st.clienti || []).every((c) => c.ultimo >= (st.clienti || [])[st.clienti.length - 1].ultimo),
    "ordinati dal più recente: il tetto morde in fondo");
  await G.ctx.close();
});

/* ═══ 10. IL CARTELLINO IN POSTAZIONE ═══ */
console.log("\n— 10. in cucina si legge di chi è il sacchetto —");
await prova("§10", async () => {
  const conOrdine = JSON.parse(JSON.stringify(base));
  const t = Date.now() - 60000;
  conOrdine.vendite = [{
    id: "vn-x", t, giorno: new Date(t).toISOString().slice(0, 10), sedeId: FM.id, chi: "OpCassa", n: 7,
    righe: [{ voceId: "li-mar", nome: "Margherita", qty: 2, prezzo: 6, gruppo: "Pizze" }],
    totale: 12, metodo: "contanti", stato: "registrata", scarico: [],
    cli: { id: "cl-uno", nome: "Cliente Uno", modo: "consegna", fascia: "20:45" },
  }];
  const K = await apri(conOrdine, [PR.opCucina], "OpCucina", "3333");
  await vaiA(K.p, "Comande");
  const t2 = await testoDi(K.p);
  ok(/Cliente Uno/.test(t2), "la comanda porta il NOME del cliente");
  ok(/20:45/.test(t2), "e la fascia oraria");
  ok(/#7/.test(t2), "e il numero dello scontrino, che è quello che si urla");
  ok(/Consegna/i.test(t2), "e dice se è una consegna: chi impacchetta lo deve sapere");
  ok(/3401110001|340 111 0001/.test(t2.replace(/ /g, " ")),
    "e il telefono, che si legge dalla RUBRICA — nella vendita non c'è");
  await K.ctx.close();
});

/* ═══ 11. CONTRO-CONTROLLO: al banco non cambia niente ═══ */
console.log("\n— 11. la pizza liscia al banco resta un tocco —");
await prova("§11", async () => {
  const B = await apri(base, [PR.opCassa], "OpCassa", "2222");
  await vaiA(B.p, "Cassa");
  await B.p.getByRole("button", { name: "Aggiungi Margherita" }).click(); await B.p.waitForTimeout(300);
  await incassa(B.p);
  const st = await stato(B.p);
  const v = (st.vendite || [])[0];
  ok(!!v && v.totale === 6, "un conto al banco si batte e si incassa senza toccare il cliente");
  ok(!!v && v.cli === undefined,
    "e la vendita al banco NON porta il campo «cli»: zero byte in più sul canale per il 90% degli scontrini");
  ok(!(st.clienti || []).some((c) => c.nome === ""), "e non nasce nessun cliente vuoto in rubrica");
  await B.ctx.close();
});

/* ═══ 12. CONTRO-CONTROLLO: uno stato vecchio non esplode ═══ */
console.log("\n— 12. un telefono rimasto a gen-6.07 non fa esplodere niente —");
await prova("§12", async () => {
  const vecchio = JSON.parse(JSON.stringify(base));
  delete vecchio.clienti;
  const V = await apri(vecchio, [PR.opCassa], "OpCassa", "2222");
  await vaiA(V.p, "Cassa");
  await V.p.getByRole("button", { name: "Aggiungi Bibita" }).click(); await V.p.waitForTimeout(300);
  await apriCliente(V.p);
  await V.p.getByRole("button", { name: "Asporto", exact: true }).click(); await V.p.waitForTimeout(300);
  await scrivi(V.p, "Nome", "Senza Rubrica");
  await scrivi(V.p, "Telefono", "3407770000");
  await chiudiCliente(V.p);
  await incassa(V.p);
  const st = await stato(V.p);
  ok((st.clienti || []).length === 1, "senza «clienti» nello stato la rubrica nasce da sola");
  ok((st.vendite || []).length === 1, "e la vendita passa lo stesso");
  await V.ctx.close();
});

await C.ctx.close();
await b.close();
await srv.chiudi();

console.log(`\nerrori di pagina: ${errs.length}`);
for (const e of errs.slice(0, 6)) console.log("  ! " + e);
if (errs.length) ko += errs.length;
console.log(ko === 0 ? "\nTUTTI I CONTROLLI PASSATI" : `\n${ko} CONTROLLI FALLITI`);
process.exit(ko ? 1 : 0);
