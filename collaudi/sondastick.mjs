/* La ricerca del Catalogo è appiccicata in cima o no? Il controllo passava su
   gen-5.54 e cade su gen-5.55: prima di dare la colpa alla modifica voglio
   sapere quanto c'era da scorrere in quel momento. Se prima non c'era niente da
   scorrere, il controllo passava perché non provava nulla. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
s.profili = [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
    async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(150); }
await p.waitForTimeout(1600);
await vaiA(p, "Catalogo");
await p.getByText(/^Prodotti · /).first().click(); await p.waitForTimeout(900);
await p.locator('input[aria-label="Cerca nel catalogo"]').fill("guanciale");
await p.waitForTimeout(800);

const misura = async (et) => console.log(et, JSON.stringify(await p.evaluate(() => {
  const c = document.querySelector('input[aria-label="Cerca nel catalogo"]');
  const m = document.querySelector("main");
  const box = c.closest("div").getBoundingClientRect();
  return { campoY: Math.round(box.top), boxAltezza: Math.round(box.height),
    scrollTop: Math.round(m.scrollTop), scrollH: Math.round(m.scrollHeight),
    clientH: Math.round(m.clientHeight), mainTop: Math.round(m.getBoundingClientRect().top),
    posizione: getComputedStyle(c.closest("div")).position };
})));
await misura("prima ");
await p.evaluate(() => { document.querySelector("main").scrollTop = 500; });
await p.waitForTimeout(600);
await misura("dopo  ");

console.log(JSON.stringify(await p.evaluate(() => {
  const campo = document.querySelector('input[aria-label="Cerca nel catalogo"]');
  const box = campo.closest("div");
  const st = getComputedStyle(box);
  /* chi è il vero contenitore che scorre, e cosa c'è in mezzo */
  const catena = [];
  for (let el = box.parentElement; el && el !== document.body; el = el.parentElement) {
    const s2 = getComputedStyle(el);
    catena.push({ tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 40),
      overflowY: s2.overflowY, h: Math.round(el.clientHeight), scrollH: Math.round(el.scrollHeight),
      transform: s2.transform === "none" ? "-" : "sì" });
  }
  const main = document.querySelector("main");
  return { posizione: st.position, top: st.top,
    scorribile: main ? Math.round(main.scrollHeight - main.clientHeight) : null,
    docScorribile: Math.round(document.documentElement.scrollHeight - document.documentElement.clientHeight),
    catena: catena.slice(0, 5) };
}), null, 1));
await b.close();
