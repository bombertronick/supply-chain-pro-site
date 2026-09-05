import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { apriServer } from "./servi.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* stato ridotto: una linea con l'unità dal simbolo più lungo che l'app usi
   davvero — «GN 1/3» è quella che sullo schermo di Valerio andava a capo */
const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
let gn13 = s.unita.find((u) => /^GN 1\/3$/.test(u.simbolo));
if (!gn13) { gn13 = { id: "u-gn13", nome: "Teglia GN 1/3", simbolo: "GN 1/3" }; s.unita.push(gn13); }
const mag = s.magazzini.find((m) => m.tipo.startsWith("linea"));
mag.articoli = mag.articoli.slice(0, 8).map((a) => ({ ...a, uomId: gn13.id, qty: 0, par: 2 }));
s.profili = [{ id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: mag.sedeId, colore: "#E8A13C",
  magazziniIds: [mag.id], pinHash: hash("2222") }];

/* i telefoni veri, con la loro tacca in basso */
const SCHERMI = [
  { nome: "iPhone SE", w: 375, h: 667, sotto: 0 },
  { nome: "iPhone 15 Pro", w: 393, h: 852, sotto: 34 },
  { nome: "iPhone 15 Pro Max", w: 430, h: 932, sotto: 34 },
  { nome: "Android compatto", w: 360, h: 740, sotto: 24 },
  { nome: "Pixel 8", w: 412, h: 915, sotto: 24 },
];
/* SERVITO SU HTTP, NON APERTO DA DISCO (5 settembre 2026). Questo collaudo
   fa vivere lo stato attraverso un ricaricamento (o fra due pagine) usando
   localStorage, e su file:// Chromium tratta l'origine come OPACA: ogni pagina
   puo' ricevere un'archiviazione SUA. Nel censimento di gen-6.06 pin2test e'
   uscita rossa esattamente per questo — il secondo telefono guardava un altro
   magazzino — e da sola passava tre volte su tre. Un'origine vera toglie di
   mezzo la domanda. Vedi servi.mjs. */
const srv = await apriServer();
const URL = srv.url;
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];

for (const sc of SCHERMI) {
  const ctx = await b.newContext({ viewport: { width: sc.w, height: sc.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j);
    localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(s));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(sc.nome + ": " + e.message));
  await p.goto(URL); await p.waitForTimeout(1500);
  await p.getByText("Op", { exact: true }).first().click(); await p.waitForTimeout(300);
  for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(150); }
  await p.waitForTimeout(1500);
  await p.locator("nav").getByText("Conteggi", { exact: true }).first().click(); await p.waitForTimeout(900);
  await p.getByRole("button", { name: "Conta ora" }).first().click();
  await p.waitForTimeout(1200);
  /* sostituisco env(safe-area-inset-bottom) con il valore del telefono */
  await p.evaluate((sotto) => {
    for (const el of document.querySelectorAll("*")) {
      const st = el.getAttribute("style");
      if (st && st.includes("env(safe-area-inset-bottom)"))
        el.setAttribute("style", st.replace(/env\(safe-area-inset-bottom\)/g, sotto + "px"));
    }
  }, sc.sotto);
  await p.waitForTimeout(400);

  const q = await p.evaluate(() => {
    const r = (el) => el ? el.getBoundingClientRect() : null;
    const nav = document.querySelector("nav");
    const btn = [...document.querySelectorAll("button")].find((x) => /Verifica e conferma/.test(x.textContent));
    const unita = [...document.querySelectorAll("span")].filter((x) => /^GN /.test(x.textContent.trim()));
    const righe = [...document.querySelectorAll("input[inputmode=decimal]")];
    let capo = 0, fuori = 0;
    for (const u of unita) if (u.getBoundingClientRect().height > 24) capo++;
    for (const i of righe) { const b = i.getBoundingClientRect(); if (b.right > innerWidth || b.left < 0) fuori++; }
    const doc = document.documentElement;
    const rn = r(nav), rb = r(btn);
    return { nav: rn && { top: rn.top, bottom: rn.bottom, height: rn.height },
      btn: rb && { top: rb.top, bottom: rb.bottom, height: rb.height },
      capo, fuori, unita: unita.length,
      largo: doc.scrollWidth > doc.clientWidth + 1, vw: innerWidth, vh: innerHeight };
  });

  const gap = q.nav && q.btn ? Math.round(q.nav.top - q.btn.bottom) : null;
  ok(q.capo === 0, `${sc.nome}: nessuna unità va a capo (${q.unita} misurate)`);
  ok(q.fuori === 0, `${sc.nome}: nessuna riga esce dallo schermo`);
  ok(!q.largo, `${sc.nome}: niente scorrimento orizzontale`);
  ok(gap !== null && gap >= 0, `${sc.nome}: il tasto «Verifica e conferma» sta sopra al menù (${gap}px di margine)`);
  await p.screenshot({ path: "schermi-" + sc.w + ".png" });
  await ctx.close();
}

/* e l'ultima scheda deve poter arrivare sopra i due elementi fissi */
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
await p.goto(URL); await p.waitForTimeout(1500);
await p.getByText("Op", { exact: true }).first().click(); await p.waitForTimeout(300);
for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(150); }
await p.waitForTimeout(1500);
await p.locator("nav").getByText("Conteggi", { exact: true }).first().click(); await p.waitForTimeout(900);
await p.getByRole("button", { name: "Conta ora" }).first().click();
await p.waitForTimeout(1200);
await p.evaluate((sotto) => {
  for (const el of document.querySelectorAll("*")) {
    const st = el.getAttribute("style");
    if (st && st.includes("env(safe-area-inset-bottom)"))
      el.setAttribute("style", st.replace(/env\(safe-area-inset-bottom\)/g, sotto + "px"));
  }
}, 34);
await p.evaluate(() => { const m = document.querySelector("main"); m.scrollTop = m.scrollHeight; });
await p.waitForTimeout(700);
const fondo = await p.evaluate(() => {
  const carte = [...document.querySelectorAll("input[inputmode=decimal]")];
  const ultima = carte[carte.length - 1].getBoundingClientRect();
  const btn = [...document.querySelectorAll("button")].find((x) => /Verifica e conferma/.test(x.textContent));
  return { sotto: Math.round(btn.getBoundingClientRect().top - ultima.bottom) };
});
ok(fondo.sotto >= 0, "scorrendo in fondo, l'ultima riga resta sopra al tasto (" + fondo.sotto + "px)");
await p.screenshot({ path: "schermi-fondo.png" });
await ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
await srv.chiudi();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
