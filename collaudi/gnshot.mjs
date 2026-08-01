import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const gnId = "u-gn16";
st.unita.push({ id: gnId, nome: "Gastronorm 1/6", simbolo: "GN 1/6" });
const A = st.magazzini.find((m) => m.articoli.length >= 2);
A.articoli.slice(0, 4).forEach((a) => { a.uomId = gnId; a.par = 2; });
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 880 }, isMobile: true, hasTouch: true });
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1100);
// Magazzini
const nav = p.getByText("Magazzini", { exact: true });
for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(600);
await p.getByText(A.nome, { exact: false }).first().click(); await p.waitForTimeout(700);
await p.screenshot({ path: "gn-1-warehouse.png" });
// open Gestione rapida to show new menu entry
await p.getByRole("button", { name: /Gestione rapida/ }).click(); await p.waitForTimeout(500);
await p.screenshot({ path: "gn-2-menu.png" });
await p.getByText("Livello previsto in blocco", { exact: false }).first().click(); await p.waitForTimeout(500);
await p.screenshot({ path: "gn-3-parform.png" });
await b.close();
console.log("shots done");
