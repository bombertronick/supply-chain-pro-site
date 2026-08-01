import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const mag = st.magazzini.find((m) => m.articoli.length >= 2) || st.magazzini[0];
const state = JSON.stringify(st);
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
await p.addInitScript((s) => { const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1100);
await p.screenshot({ path: "ux-home.png" });
const nav = p.getByText("Magazzini", { exact: true });
for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(600);
await p.getByText(mag.nome, { exact: false }).first().click(); await p.waitForTimeout(700);
// scroll the sheet to the bottom to see the button row
await p.locator(".sc-su").last().evaluate((el) => el.scrollTo(0, el.scrollHeight)).catch(()=>{});
await p.waitForTimeout(400);
await p.screenshot({ path: "ux-magdetail.png" });
await b.close();
console.log("shots done");
