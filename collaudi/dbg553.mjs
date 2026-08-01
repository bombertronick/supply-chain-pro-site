import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
const [FM, RM] = s.sedi.filter((x) => x.tipo === "operatore");
const [PA] = s.prodotti;
const F1 = s.fornitori[0], F2 = s.fornitori[1];
/* PA usa F2 SOLO come eccezione su rm; nessun prodotto ha F2 come abituale */
for (const p of s.prodotti) p.fornitoreId = F1.id;
PA.fornSede = { [RM.id]: F2.id };
s.profili = [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(150); }
await p.waitForTimeout(1800);
await vaiA(p, "Catalogo");
await p.getByText(/^Fornitori · /).first().click(); await p.waitForTimeout(900);
const bottoni = await p.evaluate(() => [...document.querySelectorAll("[aria-label]")]
  .map((e) => e.getAttribute("aria-label")).filter((a) => /Rimuovi|Modifica/.test(a)));
console.log("etichette trovate:", JSON.stringify(bottoni));
const target = `Rimuovi ${F2.nome}`;
console.log("cerco:", target, "→", bottoni.includes(target) ? "c'è" : "NON c'è");
if (bottoni.includes(target)) {
  await p.locator(`[aria-label="${target}"]`).first().click();
  await p.waitForTimeout(1200);
  const fg = p.locator(".fixed.inset-0.z-50").last();
  console.log("--- foglio ---");
  console.log((await fg.innerText().catch(() => "(nessun foglio)")).slice(0, 700));
}
await p.screenshot({ path: "dbg553.png", fullPage: true });
await b.close();
