import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = readFileSync("seed-state.json", "utf8");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 880 }, isMobile: true, hasTouch: true });
const errs = [];
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, st);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);

// open help "?" then the flow map
await p.locator('[data-tour="aiuto"]').click(); await p.waitForTimeout(500);
const voceOk = await p.getByText("Mappa dei flussi (animata)").count() > 0;
console.log("voce nel menu aiuto:", voceOk ? "PASS" : "CHECK");
await p.getByText("Mappa dei flussi (animata)").click(); await p.waitForTimeout(900);

const svgOk = await p.locator('svg[aria-label^="Schema animato"]').count() > 0;
const passoOk = await p.getByText(/Passo \d+ di \d+/).count() > 0;
console.log("schema svg:", svgOk ? "PASS" : "CHECK", "| narrazione:", passoOk ? "PASS" : "CHECK");
await p.screenshot({ path: "flussi-1-banco.png" });

// verify the packet actually moves (animation is live)
const pos = async () => p.evaluate(() => {
  const g = document.querySelector('svg[aria-label^="Schema animato"] g[transform^="translate"]');
  return g ? g.getAttribute("transform") : null;
});
// wait until we are on a step that has a travelling packet
let mosso = false, primo = null;
for (let i = 0; i < 40; i++) {
  const a = await pos();
  if (a) { if (primo === null) primo = a; else if (a !== primo) { mosso = true; break; } }
  await p.waitForTimeout(120);
}
console.log("pacchetto in movimento:", mosso ? "PASS" : "CHECK");
await p.screenshot({ path: "flussi-2-pacchetto.png" });

// step dots navigation
await p.getByRole("button", { name: "Vai al passo 3" }).click(); await p.waitForTimeout(500);
const p3 = await p.getByText("Passo 3 di").count() > 0;
console.log("navigazione a passo 3:", p3 ? "PASS" : "CHECK");

// pause button
await p.getByRole("button", { name: "Pausa" }).click(); await p.waitForTimeout(400);
const inPausa = await p.getByRole("button", { name: "Riprendi" }).count() > 0;
console.log("pausa:", inPausa ? "PASS" : "CHECK");
await p.getByRole("button", { name: "Riprendi" }).click(); await p.waitForTimeout(300);

// switch through all four flows
const tabs = ["Laboratorio", "Fornitore", "Trasferimento"];
let tabOk = true;
for (const t of tabs) {
  await p.getByRole("button", { name: t, exact: true }).click(); await p.waitForTimeout(700);
  const ok = await p.locator('svg[aria-label^="Schema animato"]').count() > 0
    && await p.getByText("Passo 1 di").count() + await p.getByText(/Passo \d+ di/).count() > 0;
  if (!ok) tabOk = false;
  await p.screenshot({ path: `flussi-3-${t.toLowerCase()}.png` });
}
console.log("tutti i 4 flussi:", tabOk ? "PASS" : "CHECK");

console.log("errs", errs.length, errs.slice(0, 4));
console.log("RESULT:", voceOk && svgOk && passoOk && mosso && p3 && inPausa && tabOk && errs.length === 0 ? "PASS" : "CHECK");
await b.close();
