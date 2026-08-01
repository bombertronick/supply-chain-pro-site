import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const state = readFileSync("seed-state.json", "utf8");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await p.addInitScript((s) => { const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(()=>{});
await p.waitForTimeout(1000);

// sidebar Profili (click the VISIBLE one; a hidden mobile nav also has it)
const prof = p.getByText("Profili", { exact: true });
const pc = await prof.count();
for (let i = 0; i < pc; i++) { if (await prof.nth(i).isVisible()) { await prof.nth(i).click(); break; } }
await p.waitForTimeout(500);
await p.getByRole("button", { name: /Nuovo profilo/i }).click();
await p.waitForTimeout(600);
const dlg = p.locator(".sc-su");
await dlg.screenshot({ path: "pp-1-default.png" });
console.log("dialog visible:", await dlg.isVisible());

// fill nome
await dlg.getByPlaceholder("Es. Marco").fill("Luca Bianchi");
await p.waitForTimeout(200);
// role is Operatore by default; select a sede
const selCount = await dlg.locator("select").count();
console.log("select count (default operatore):", selCount);
if (selCount) await dlg.locator("select").first().selectOption({ index: 1 }).catch((e)=>console.log("sede select fail", e.message));
await p.waitForTimeout(300);
await dlg.screenshot({ path: "pp-2-operatore-sede.png" });

// color pick (2nd swatch)
await dlg.getByRole("button", { name: /^Colore/ }).nth(1).click().catch((e)=>console.log("color fail", e.message));
// PIN
await dlg.locator('input[type="password"]').fill("5678").catch((e)=>console.log("pin fail", e.message));
await p.waitForTimeout(200);
await dlg.screenshot({ path: "pp-3-filled.png" });

// role switch to Admin, then Laboratorio to see conditional fields
await dlg.getByRole("button", { name: "Admin", exact: true }).click().catch((e)=>console.log("admin role fail", e.message));
await p.waitForTimeout(300); await dlg.screenshot({ path: "pp-4-admin.png" });
await dlg.getByRole("button", { name: "Laboratorio", exact: true }).click().catch(()=>{});
await p.waitForTimeout(300); await dlg.screenshot({ path: "pp-5-lab.png" });
await dlg.getByRole("button", { name: "Operatore", exact: true }).click().catch(()=>{});
await p.waitForTimeout(300);

// try to SAVE (operatore, need sede)
if (await dlg.locator("select").count()) await dlg.locator("select").first().selectOption({ index: 1 }).catch(()=>{});
await dlg.locator('input[type="password"]').fill("5678").catch(()=>{});
await dlg.getByRole("button", { name: /^Salva$/ }).click().catch((e)=>console.log("salva click fail", e.message));
await p.waitForTimeout(1200);

const after = await p.evaluate(async () => {
  const r = await window.storage.get("scp:stato:v1", true); const st = JSON.parse(r.value);
  return { nProfili: st.profili.length, nomi: st.profili.map(x=>x.nome) };
});
console.log("AFTER SAVE:", JSON.stringify(after));
await p.screenshot({ path: "pp-6-after.png", fullPage: true });
console.log("ERRORS:", errs.length, errs.slice(0,10));
await b.close();
