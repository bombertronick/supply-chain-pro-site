import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const state = readFileSync("seed-state.json", "utf8");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await p.addInitScript((s) => { const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1300);

const welcome = await p.getByText("Benvenuto!", { exact: false }).count() > 0;
// illustration "flusso" renders labels Conta / Ordina / Ricevi
const illustr = await p.getByText("Conta", { exact: true }).count() > 0 && await p.getByText("Ricevi", { exact: true }).count() > 0;
console.log("welcome:", welcome, "| flusso illustration:", illustr);
await p.screenshot({ path: "tut2-1-welcome.png" });
// advance to the "Prova tu!" step (steps 1->4): Avanti x3
for (let k = 0; k < 3; k++) { await p.getByRole("button", { name: /Avanti/ }).click(); await p.waitForTimeout(450); }
const provaTu = await p.getByText("Prova tu!", { exact: false }).count() > 0;
const hint = await p.getByText(/Tocca l'elemento evidenziato/).count() > 0;
console.log("reached hands-on step:", provaTu, "| tap hint shown:", hint);
await p.screenshot({ path: "tut2-2-provatu.png" });
// tap the highlighted Magazzini nav (visible one)
await p.evaluate(() => { const el = [...document.querySelectorAll('[data-tour="nav-magazzini"]')].find((e) => e.getBoundingClientRect().width > 0); el && el.click(); });
await p.waitForTimeout(700);
const advanced = await p.getByText("Dentro un magazzino", { exact: false }).count() > 0;
const onMag = await p.getByText(/Assegna a più magazzini/).count() > 0; // navigated to Magazzini
console.log("tap advanced tour:", advanced, "| navigated to Magazzini:", onMag);
await p.screenshot({ path: "tut2-3-after-tap.png" });
// finish/skip
await p.getByRole("button", { name: /Salta/ }).first().click().catch(()=>{}); await p.waitForTimeout(300);

// section guide via "?" (should include illustration)
await p.locator('[data-tour="aiuto"]').click(); await p.waitForTimeout(300);
await p.getByText(/Guida di «/).first().click(); await p.waitForTimeout(400);
const secStep = await p.getByText(/Passo 1 di/).count() > 0;
console.log("section guide opened:", secStep);

console.log("pageerrors:", errs.length, errs.slice(0, 8));
console.log("RESULT:", welcome && illustr && provaTu && hint && advanced && onMag && secStep && errs.length === 0 ? "PASS" : "CHECK");
await b.close();
