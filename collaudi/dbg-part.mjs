import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 900 }, isMobile: true, hasTouch: true });
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1300);
const nav = p.getByText("Plancia", { exact: true });
for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(800);
console.log("sedi", st.sedi.map(s=>`${s.nome}/${s.tipo}/lab=${s.labSedeId||"-"}`).join(" | "));
console.log("mags", st.magazzini.map(m=>`${m.nome}/${m.tipo}/sede=${m.sedeId}`).join(" | "));
const info = await p.evaluate(() => {
  const svg = document.querySelector('svg[aria-label^="Mappa della rete"]');
  return { rects92: svg.querySelectorAll('rect[width="92"]').length,
           paths: svg.querySelectorAll('path').length,
           circles: [...svg.querySelectorAll('circle')].map(c=>c.getAttribute("r")) };
});
console.log("prima del tocco:", JSON.stringify(info));
await p.evaluate(() => { const r = document.querySelector('svg[aria-label^="Mappa della rete"] rect[width="92"]'); r.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
await p.waitForTimeout(600);
const info2 = await p.evaluate(() => {
  const svg = document.querySelector('svg[aria-label^="Mappa della rete"]');
  return { circles: [...svg.querySelectorAll('circle')].map(c=>c.getAttribute("r")+"@"+c.getAttribute("cx")),
           formiche: document.querySelectorAll(".sc-formiche").length,
           scheda: document.body.innerText.includes("Rifornito da") || document.body.innerText.includes("Rifornisce") };
});
console.log("dopo il tocco:", JSON.stringify(info2));
await p.screenshot({ path: "dbg-rete.png", fullPage: false });
await b.close();
