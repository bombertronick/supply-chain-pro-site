/* LE AZIONI IN BLOCCO DEL MAGAZZINO — e il tasto che si apriva sul vuoto.

   Questo file era una sonda che stampava righe senza mai bocciare niente, e
   da mesi si fermava a meta' con un errore. L'avevo messo da parte pensando
   fosse lui a essere vecchio. Non lo era: aveva ragione.

   IL DIFETTO CHE HA TROVATO. «Gestione rapida» e' un foglio che si apre
   dentro un altro foglio (la scheda del magazzino). Il foglio di sopra
   restava agganciato al riquadro di quello di sotto invece che allo schermo,
   quindi il suo elenco sbordava fuori dalla propria area sensibile. Le voci
   finite fuori non erano finte: si vedevano, erano scritte in nero, avevano
   la freccina a destra. Solo che il dito non le prendeva — prendeva lo sfondo
   del foglio di sotto, e lo sfondo chiude tutto. Sul telefono si toccava
   «Aggiungi più prodotti» e ci si ritrovava nell'elenco dei magazzini, senza
   un messaggio, senza niente: sembrava un tocco andato a vuoto.

   Erano MORTE tre voci su sei sul telefono (le prime tre) e tre su sei sul
   computer (la prima e le ultime due).

   Percio' il primo controllo qui sotto non guarda cosa fanno i tasti: guarda
   che si possano premere. E' l'unica cosa che il collaudo di prima non
   guardava, ed e' l'unica che era rotta. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const scena = () => {
  const s = JSON.parse(JSON.stringify(base));
  const m = s.magazzini.find((x) => x.articoli.length >= 1) || s.magazzini[0];
  m.articoli = m.articoli.slice(0, 1);
  m.articoli[0].par = 4;              // il prodotto che c'era gia': non deve essere toccato
  delete m.articoli[0].parGiorni;
  return { s, magId: m.id, magNome: m.nome, gia: m.articoli[0].prodottoId, nProdotti: s.prodotti.length };
};
const { magId, magNome, gia, nProdotti } = scena();
const VOCI = ["Aggiungi più prodotti", "Copia da un magazzino", "Sposta o rimuovi prodotti",
  "Livello previsto in blocco", "Soglie per giorno", "Trasferisci scorte"];

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (w, h) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript((j) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    const m = new Map(); m.set("scp:stato:v1", j);
    window.storage = {
      async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
      async set(k, v) { m.set(k, v); return true; },
      async delete(k) { m.delete(k); return true; },
    };
  }, JSON.stringify(scena().s));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1400);
  await vaiA(p, "Magazzini"); await p.waitForTimeout(700);
  await p.getByText(magNome, { exact: false }).locator("visible=true").first().click();
  await p.getByRole("button", { name: /Gestione rapida/ }).waitFor({ state: "visible", timeout: 30000 });
  return { p, ctx };
};
const gestioneRapida = async (p) => {
  await p.getByRole("button", { name: /Gestione rapida/ }).click();
  await p.getByRole("button", { name: /^Aggiungi più prodotti/ }).last()
    .waitFor({ state: "visible", timeout: 30000 });
  await p.waitForTimeout(400);
};
/* chi si prende il tocco al centro del tasto: il tasto stesso, o qualcos'altro? */
const chiPrendeIlTocco = async (p, loc) => {
  const bx = await loc.boundingBox();
  if (!bx) return "(tasto non disegnato)";
  return await p.evaluate(({ x, y }) => {
    const e = document.elementFromPoint(x, y);
    const bt = e && e.closest("button");
    return bt ? (bt.innerText || "").split("\n")[0] : "lo sfondo del foglio di sotto";
  }, { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 });
};
const leggi = (p) => p.evaluate(async (id) => {
  const r = await window.storage.get("scp:stato:v1", true);
  const s = JSON.parse(r.value);
  const m = s.magazzini.find((x) => x.id === id);
  return { articoli: m.articoli.map((a) => ({ id: a.prodottoId, par: a.par, pg: a.parGiorni })),
    log: (s.log || []).map((v) => (v.msg || "") + " · " + (v.chi || "")),
    nMov: (s.movimenti || []).length };
}, magId);

/* ═══ 1. SI POSSONO PREMERE? (su tutti e due gli schermi) ═══ */
for (const [w, h, nome] of [[390, 844, "telefono"], [1200, 950, "computer"]]) {
  console.log(`\n— 1. «Gestione rapida» sul ${nome} (${w}×${h}) —`);
  const { p, ctx } = await apri(w, h);
  await gestioneRapida(p);

  /* la causa, presa alla radice: il foglio deve stare agganciato allo SCHERMO */
  const quadro = await p.evaluate(() => {
    const f = [...document.querySelectorAll(".fixed.inset-0")];
    const d = f[f.length - 1];
    const r = d.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight };
  });
  ok(quadro.w === quadro.vw && quadro.h === quadro.vh,
    `il foglio copre tutto lo schermo (${quadro.w}×${quadro.h} su ${quadro.vw}×${quadro.vh}), non solo il riquadro sotto`);

  for (const v of VOCI) {
    const loc = p.getByRole("button", { name: new RegExp("^" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).last();
    const chi = await chiPrendeIlTocco(p, loc);
    ok(chi.startsWith(v), `«${v}» prende il tocco` + (chi.startsWith(v) ? "" : ` — invece lo prende: ${chi}`));
  }

  /* e il tocco vero non deve chiudere tutto in faccia all'utente */
  const l0 = p.getByRole("button", { name: /^Aggiungi più prodotti/ }).last();
  const bx = await l0.boundingBox();
  await p.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2);
  await p.waitForTimeout(800);
  const t = (await p.locator("body").innerText()).replace(/\s+/g, " ");
  ok(/Livello previsto per tutti/.test(t),
    "toccandolo si apre davvero «Aggiungi più prodotti», invece di richiudere tutto");
  await ctx.close();
}

/* ═══ 2. AGGIUNGI PIÙ PRODOTTI ═══ */
console.log("\n— 2. aggiungere tanti prodotti in una volta —");
const { p, ctx } = await apri(390, 844);
await gestioneRapida(p);
await p.getByRole("button", { name: /^Aggiungi più prodotti/ }).last().click();
await p.getByText("Livello previsto per tutti", { exact: false }).waitFor({ state: "visible", timeout: 30000 });
await p.getByPlaceholder("0", { exact: true }).last().fill("5");
await p.getByRole("button", { name: new RegExp(`^Tutti \\(${nProdotti - 1}\\)$`) }).click();
await p.waitForTimeout(300);
ok(await p.getByText(`${nProdotti - 1} selezionati`, { exact: false }).count() > 0,
  `«Tutti» ne seleziona ${nProdotti - 1}: tutti quelli che qui non c'erano`);
await p.getByRole("button", { name: new RegExp(`^Aggiungi ${nProdotti - 1}$`) }).click();
await p.waitForTimeout(1000);

const d2 = await leggi(p);
ok(d2.articoli.length === nProdotti,
  `il magazzino passa da 1 a ${nProdotti} prodotti`);
const nuovi = d2.articoli.filter((a) => a.id !== gia);
ok(nuovi.every((a) => a.par === 5), `i ${nuovi.length} nuovi partono tutti dal livello 5, come chiesto`);
ok(d2.articoli.find((a) => a.id === gia)?.par === 4,
  "e quello che c'era gia' resta a 4: non gli riscrive sopra il livello");
/* Nello STORICO ci finisce una riga sola, non 102: e' giusto cosi'. Le
   giacenze non si muovono (i prodotti entrano a quantita' zero, da contare),
   quindi il registro dei movimenti resta pulito — chi lo legge cerca merce
   che si e' spostata, non prodotti messi in elenco. Il fatto e' scritto una
   volta, con chi l'ha fatto. */
ok(d2.log.some((r) => r.startsWith(`${nProdotti - 1} prodotti aggiunti in «${magNome}»`)),
  `lo storico scrive «${nProdotti - 1} prodotti aggiunti in «${magNome}»»`);
ok(d2.log.some((r) => r.includes(`prodotti aggiunti in «${magNome}» · Admin`)),
  "col nome di chi l'ha fatto");
ok(d2.nMov === 0,
  "e il registro dei movimenti resta vuoto: entrano a quantita' zero, non e' merce che si e' spostata");

/* ═══ 3. SOGLIE PER GIORNO IN BLOCCO ═══ */
console.log("\n— 3. feriale ×1, weekend ×2 —");
await gestioneRapida(p);
await p.getByRole("button", { name: /^Soglie per giorno/ }).last().click();
await p.getByText("Feriale", { exact: false }).first().waitFor({ state: "visible", timeout: 30000 });
await p.getByPlaceholder("1", { exact: true }).last().fill("1");
await p.getByPlaceholder("1.5", { exact: true }).last().fill("2");
await p.waitForTimeout(300);
await p.getByRole("button", { name: /^Applica$/ }).click();
await p.waitForTimeout(1000);

const d3 = await leggi(p);
const conPg = d3.articoli.filter((a) => a.pg);
ok(conPg.length === nProdotti, `tutti e ${nProdotti} i prodotti ricevono le soglie per giorno`);
const g = d3.articoli.find((a) => a.id === gia)?.pg;
ok(g && [1, 2, 3, 4, 5].every((k) => g[k] === 4),
  "il prodotto a livello 4: da lunedi' a venerdi' resta 4 (×1)");
ok(g && g["6"] === 8 && g["0"] === 8,
  "sabato e domenica diventa 8 (×2) — e il weekend e' sabato+domenica, non solo domenica");
const n5 = d3.articoli.find((a) => a.id !== gia && a.par === 5)?.pg;
ok(n5 && n5["1"] === 5 && n5["6"] === 10,
  "e chi sta a livello 5 fa 5 nei feriali e 10 nel weekend: il conto parte dal suo livello, non da uno solo per tutti");

/* ═══ 4. TORNARE INDIETRO ═══ */
console.log("\n— 4. rimettere 1 e 1 per tornare al livello unico —");
await gestioneRapida(p);
await p.getByRole("button", { name: /^Soglie per giorno/ }).last().click();
await p.getByText("Feriale", { exact: false }).first().waitFor({ state: "visible", timeout: 30000 });
await p.getByPlaceholder("1", { exact: true }).last().fill("1");
await p.getByPlaceholder("1.5", { exact: true }).last().fill("1");
await p.waitForTimeout(300);
await p.getByRole("button", { name: /^Applica$/ }).click();
await p.waitForTimeout(1000);

const d4 = await leggi(p);
ok(d4.articoli.every((a) => !a.pg),
  "con 1 e 1 le soglie per giorno spariscono del tutto, come promette la schermata");
ok(d4.articoli.find((a) => a.id === gia)?.par === 4 && d4.articoli.filter((a) => a.par === 5).length === nProdotti - 1,
  "e i livelli di partenza restano quelli: torna indietro senza portarsi via altro");

await p.screenshot({ path: "bulk2-final.png" });
await ctx.close();
console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 5)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
