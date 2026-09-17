/* ── CHI HA CONFERMATO, E QUANDO (gen-6.23) ──

   Parole di Valerio, 17 settembre: «mi servirebbe semplificare la
   visualizzazione delle richieste al laboratorio, mi immagino che ogni volta
   che faccio una richiesta compaia data, ora e operatore che ha confermato la
   richiesta».

   DOV'E': la scheda «Al laboratorio» dentro Ordini — la lista che Valerio ha
   fotografato, quella coi chip «confermati 25 pz». Nel codice e' RichiesteLab.

   IL DATO C'E' GIA' E NON SI TOCCA IL MODELLO: applicaEvasione scrive
   r.evasoDa (il nome) e r.tEvasione (l'istante) su tutte e tre le strade di
   chiusura. Mancava solo mostrarlo: la riga del lato linea diceva magazzino e
   quantita', e basta.

   ROSSE PER COSTRUZIONE contro gen-6.22/6.23-senza-cura:
   §1 (su una richiesta confermata compaiono data, ora e il nome di chi l'ha
   confermata), §2 (su una in attesa compaiono data, ora e chi l'ha chiesta),
   §3 («fabbisogno automatico» non e' una persona e non si scrive «di
   fabbisogno automatico»: si dice come e' nata).

   CONTRO-CONTROLLI, verdi PRIMA e DOPO:
   §10 (i chip «confermati N» restano dov'erano: si AGGIUNGE, non si
   sostituisce), §11 (la riga in attesa resta ambra e dice «in attesa»).

   NIENTE DATI VERI: nomi e prodotti presi dal seme di prova. NIENTE RETE VERA. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import crypto from "crypto";
import { apriServer } from "./servi.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 130)}`); } };

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = st.sedi.find((x) => x.tipo === "operatore");
const LAB = st.sedi.find((x) => x.tipo === "laboratorio");
if (!FM || !LAB) throw new Error("banco povero: servono una sede operatore e un laboratorio");
const linea = st.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con due articoli");
const a1 = linea.articoli[0], a2 = linea.articoli[1];

/* TRE ISTANTI DIVERSI, tutti dentro la finestra dei sette giorni che il lato
   linea mostra: se uno cadesse fuori la riga sparirebbe e il rosso sarebbe
   preso in prestito. */
const ORA = Date.now();
const T_CONF = ORA - 2 * 3600 * 1000;      // confermata due ore fa
const T_CHIESTA = ORA - 5 * 3600 * 1000;   // chiesta cinque ore fa
const T_AUTO = ORA - 4 * 3600 * 1000;

st.richieste = [
  { id: "ric-1", t: T_CHIESTA - 3600 * 1000, daSedeId: FM.id, aSedeLabId: LAB.id,
    daMagazzinoId: linea.id, magNome: linea.nome, prodottoId: a1.prodottoId, qty: 6, uomId: a1.uomId,
    stato: "evasa", creataDa: "Anna", qtyEvasa: 6,
    evasoDa: "Marco", tEvasione: T_CONF, magazzinoLabNome: "Cella lab" },
  { id: "ric-2", t: T_CHIESTA, daSedeId: FM.id, aSedeLabId: LAB.id,
    daMagazzinoId: linea.id, magNome: linea.nome, prodottoId: a2.prodottoId, qty: 4, uomId: a2.uomId,
    stato: "in-attesa", creataDa: "Anna" },
  { id: "ric-3", t: T_AUTO, daSedeId: FM.id, aSedeLabId: LAB.id,
    daMagazzinoId: linea.id, magNome: linea.nome, prodottoId: a1.prodottoId, qty: 2, uomId: a1.uomId,
    stato: "in-attesa", creataDa: "fabbisogno automatico" },
];
st.ordini = []; st.vendite = []; st.giornate = []; st.postazioni = []; st.clienti = [];
st.profili = [{ id: "pr-op", nome: "OpLinea", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], pinHash: hash("2222") }];

const srv = await apriServer();
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  localStorage.setItem("db:scp:stato:v1", j);
  window.storage = {
    async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
    async delete(k) { localStorage.removeItem("db:" + k); return true; },
  };
}, JSON.stringify(st));
const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(srv.url); await p.waitForTimeout(1400);
await p.getByText("OpLinea", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
await p.waitForTimeout(1700);

/* si arriva dove si arriva a mano: barra → Ordini → scheda «Al laboratorio» */
await p.locator('nav[aria-label="Navigazione principale"]').getByRole("button", { name: /Ordini/i }).first().click();
await p.waitForTimeout(900);
const schedaLab = p.getByText(/Al laboratorio/i).first();
if (await schedaLab.count()) { await schedaLab.click(); await p.waitForTimeout(700); }

/* LA DATA ATTESA SI CALCOLA NELLO STESSO MOTORE che la disegna: il banco gira
   in Node e la pagina in Chromium, e un fuso diverso farebbe fallire un
   confronto giusto. */
const dataDi = (t) => p.evaluate((t) => new Date(t).toLocaleString("it-IT",
  { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }), t);
const testo = async () => (await p.locator("body").innerText()).replace(/\s+/g, " ");

console.log("\n— 0. la scena e' quella che dico —");
const t0 = await testo();
ok(/Al laboratorio/i.test(t0), "sono nella scheda «Al laboratorio» dentro Ordini");
ok(/confermati/i.test(t0), "e le tre richieste sono in lista (c'e' almeno un «confermati»)");

console.log("\n— 1. su una richiesta confermata: data, ora e chi l'ha confermata —");
await prova("§1", async () => {
  const t = await testo();
  const quando = await dataDi(T_CONF);
  ok(t.includes(quando), `c'e' la data e l'ora della conferma («${quando}»)`);
  ok(/Marco/.test(t), "c'e' il nome di chi l'ha confermata (Marco)");
});

console.log("\n— 2. su una in attesa: quando e' stata chiesta, e da chi —");
await prova("§2", async () => {
  const t = await testo();
  const quando = await dataDi(T_CHIESTA);
  ok(t.includes(quando), `c'e' la data e l'ora della richiesta («${quando}»)`);
  ok(/Anna/.test(t), "c'e' il nome di chi l'ha chiesta (Anna)");
});

console.log("\n— 3. «fabbisogno automatico» non e' una persona —");
await prova("§3", async () => {
  const t = await testo();
  ok(!/di fabbisogno automatico/i.test(t),
    "non si scrive «di fabbisogno automatico»: non e' italiano e non e' nessuno");
  ok(/in automatico/i.test(t),
    "si dice come e' nata: «in automatico, per scorta bassa»");
});

console.log("\n— 4. la firma si LEGGE: non e' tagliata a meta' —");
await prova("§4", async () => {
  /* IL BANCO LEGGE innerText, e innerText NON SA del taglio: `truncate` e'
     CSS, il testo resta tutto nel nodo. Una data tagliata a meta' passerebbe
     §1 e §2 senza fare una piega. Percio' qui si misura il NODO: se il
     contenuto e' piu' largo della scatola, la riga e' tagliata. */
  const m = await p.evaluate(() => [...document.querySelectorAll('[data-firma="1"]')]
    .map((e) => ({ tagliata: e.scrollWidth > e.clientWidth + 1, largo: e.scrollWidth, scatola: e.clientWidth })));
  ok(m.length === 3, `le tre richieste hanno tutte la loro firma (ne trovo ${m.length})`);
  const tagliate = m.filter((x) => x.tagliata);
  ok(tagliate.length === 0,
    `nessuna firma e' tagliata dal bordo (${tagliate.length} tagliate su ${m.length}${tagliate[0] ? `, la prima ${tagliate[0].largo}px in una scatola da ${tagliate[0].scatola}` : ""})`);
});

console.log("\n— 5. e il laboratorio dice una DATA, non «3 ore fa» —");
await prova("§5", async () => {
  /* LA PAGINA DEL LABORATORIO NON E' RAGGIUNGIBILE DA QUESTO PROFILO: e' di
     un altro ruolo, e montarne una seconda scena intera per una riga sarebbe
     sproporzionato. Si prova sul SORGENTE, come cassa617test §14 con i suoi
     due muri: e' una sentinella, e dice per iscritto che lo e'. */
  const src = readFileSync(process.env.SORGENTE || "app-under-test.jsx", "utf8");
  const riga = (src.split("\n").find((l) => l.includes("Evasa da") && l.includes("r.evasoDa")) || "");
  ok(!!riga, "la riga dell'archivio del laboratorio esiste ancora");
  ok(riga.includes("dataIt(r.tEvasione)"),
    `l'archivio del laboratorio scrive una data intera con dataIt (letto: ${riga.trim().slice(-42)})`);
  ok(!riga.includes("tempoFa(r.tEvasione)"),
    "e non piu' un tempo relativo: a fine serata «5 ore fa» non si ricostruisce");
});

console.log("\n— 10-11. e quello che c'era prima resta dov'era —");
await prova("§10", async () => {
  const t = await testo();
  ok(/confermati 6/i.test(t), "il chip «confermati 6» c'e' ancora: si AGGIUNGE, non si sostituisce");
  ok(/in attesa/i.test(t), "e la riga non evasa dice ancora «in attesa»");
});
await prova("§11", async () => {
  const t = await testo();
  ok(new RegExp(linea.nome.slice(0, 12)).test(t), `il magazzino di partenza («${linea.nome}») resta scritto`);
});

console.log("\n— 12. nessun errore di pagina —");
ok(errs.length === 0, `nessuna eccezione in pagina${errs.length ? " — " + errs[0].slice(0, 90) : ""}`);

await b.close(); await srv.chiudi();
console.log(ko ? `\nrichiestefirmatest: ${ko} CONTROLLI FALLITI` : "\nrichiestefirmatest: TUTTI I CONTROLLI PASSATI");
process.exit(ko === 0 ? 0 : 1);
