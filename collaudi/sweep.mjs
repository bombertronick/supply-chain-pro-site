/* Passata larga: entra con ogni ruolo, visita ogni schermata su un telefono
   stretto e segnala errori JS, roba che esce dallo schermo, testo tagliato e
   tocchi troppo piccoli per un dito. Non corregge niente: elenca. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const topo = JSON.parse(readFileSync("topologia-vera.json", "utf8"));
const s = { ...base, sedi: topo.sedi, magazzini: topo.magazzini.map((m) => ({ ...m })) };
const PR = base.prodotti;
s.magazzini.forEach((m, k) => {
  m.articoli = PR.slice(0, 11 + (k % 25)).map((p, i) => ({
    prodottoId: p.id, uomId: p.uomBase, par: 4, qty: i % 6 }));
});
const LAB = topo.sedi[0], FM = topo.sedi[1];
s.profili = [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  { id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF", pinHash: hash("3333") },
  { id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#E8A13C",
    magazziniIds: [s.magazzini.find((m) => m.sedeId === FM.id).id], pinHash: hash("2222") },
];
/* un po' di traffico vero, così le pagine non sono tutte vuote */
s.richieste = PR.slice(0, 5).map((p, i) => ({ id: "r" + i, t: Date.now() - i * 3600000,
  daSedeId: FM.id, aSedeLabId: LAB.id, prodottoId: p.id, qty: i + 1, uomId: p.uomBase,
  magNome: "Linea fm", stato: i % 3 === 0 ? "evasa" : "in-attesa", ...(i % 3 === 0 ? { tEvasione: Date.now() } : {}) }));
s.ordini = PR.slice(0, 4).map((p, i) => ({ id: "o" + i, t: Date.now() - i * 7200000, tipo: "diretto",
  sedeId: FM.id, prodottoId: p.id, fornitoreId: base.fornitori[0].id, qty: (i + 1) * 3,
  uomId: p.uomBase, stato: i % 2 ? "ordinato" : "da-ordinare" }));

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const trovati = [];
const nota = (dove, che) => { trovati.push({ dove, che }); console.log("  ⚠ " + dove + " — " + che); };

/* misura la pagina: cosa sborda, cosa è tagliato, cosa è troppo piccolo */
const ispeziona = (p, dove) => p.evaluate((dove) => {
  const out = [];
  const W = innerWidth;
  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth + 1)
    out.push(`la pagina scorre in orizzontale (${doc.scrollWidth} > ${doc.clientWidth})`);
  const visto = new Set();
  for (const el of document.querySelectorAll("main *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const st = getComputedStyle(el);
    if (st.visibility === "hidden" || st.display === "none") continue;
    /* esce dal bordo destro dello schermo */
    if (r.right > W + 1 && !el.closest("[class*=overflow-x-auto]")) {
      const k = "fuori:" + (el.textContent || "").trim().slice(0, 30);
      if (!visto.has(k)) { visto.add(k);
        out.push(`esce a destra di ${Math.round(r.right - W)}px: «${(el.textContent || "").trim().slice(0, 40)}»`); }
    }
    /* testo tagliato in verticale: il contenuto è più alto della scatola */
    if (el.children.length === 0 && el.scrollHeight > r.height + 2 && st.overflow !== "visible") {
      const k = "tagliato:" + (el.textContent || "").trim().slice(0, 30);
      if (!visto.has(k)) { visto.add(k);
        out.push(`testo tagliato: «${(el.textContent || "").trim().slice(0, 40)}»`); }
    }
  }
  /* bersagli da toccare troppo piccoli: sotto i 32px un dito sbaglia */
  const piccoli = [];
  for (const el of document.querySelectorAll("button,[role=button],a")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.height < 32 || r.width < 32) {
      const et = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24);
      if (et) piccoli.push(`${et} (${Math.round(r.width)}×${Math.round(r.height)})`);
    }
  }
  if (piccoli.length) out.push(`${piccoli.length} tasti sotto i 32px: ${[...new Set(piccoli)].slice(0, 6).join(", ")}`);
  return out;
}, dove);

const VOCI = ["Home", "Catalogo", "Magazzini", "Plancia", "Ordini", "Analisi", "Sistema", "Conteggi", "Richieste"];

for (const { nome, pin } of [{ nome: "Admin", pin: "1234" }, { nome: "Lab", pin: "3333" }, { nome: "Op", pin: "2222" }]) {
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
    window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
  }, JSON.stringify(s));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => nota(nome, "ERRORE JS: " + e.message));
  p.on("console", (m) => { if (m.type() === "error") nota(nome, "console: " + m.text().slice(0, 120)); });
  await p.goto(URL); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(150); }
  await p.waitForTimeout(1700);

  console.log(`\n── ${nome} ──`);
  for (const voce of VOCI) {
    const nav = p.locator("nav").getByText(voce, { exact: true });
    if (!(await nav.count())) continue;
    await nav.first().click().catch(() => {});
    await p.waitForTimeout(1200);
    for (const g of await ispeziona(p, voce)) nota(`${nome} · ${voce}`, g);
    await p.screenshot({ path: `sweep-${nome}-${voce}.png`, fullPage: true }).catch(() => {});
  }
  await ctx.close();
}

await b.close();
console.log(`\n${trovati.length} segnalazioni in totale`);
