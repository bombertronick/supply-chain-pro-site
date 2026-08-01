import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = s.sedi.find((x) => x.tipo === "laboratorio");
const [FM, RM] = s.sedi.filter((x) => x.tipo === "operatore");
const magLab = s.magazzini.find((m) => m.tipo === "laboratorio");
const lineaFm = s.magazzini.find((m) => m.tipo === "linea-lab");
const [PA, PB, PC] = s.prodotti;
magLab.articoli = [PA, PB, PC].map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 10, par: 12 }));
lineaFm.articoli = [PA, PB].map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 1, par: 3 }));
s.magazzini.push({ id: "mag-linea-rm", sedeId: RM.id, nome: "Linea Pizze rm", tipo: "linea-lab",
  articoli: [PA, PB].map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 2, par: 4 })) });
s.profili = [{ id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#8A63F4",
  magazziniIds: [magLab.id], pinHash: hash("3333") }];
const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await p.goto(URL); await p.waitForTimeout(1600);
await p.getByText("Lab", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "3333") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
await p.waitForTimeout(1600);
await p.getByText("Plancia", { exact: true }).first().click(); await p.waitForTimeout(1200);
await p.getByText("Caselle", { exact: true }).first().click(); await p.waitForTimeout(1200);
console.log("select count:", await p.locator("select").count());
console.log("opzioni:", await p.locator("select").first().innerText().catch(()=>"-"));
console.log("valore ora:", await p.locator("select").first().inputValue().catch(()=>"-"));
await p.locator("select").first().selectOption({ label: lineaFm.nome });
await p.waitForTimeout(1200);
console.log("dopo switch:", await p.locator("select").first().inputValue());
console.log("intestazione:", (await p.locator("body").innerText()).split("\n").slice(0,12).join(" | "));
const nPiu = await p.getByRole("button", { name: "+", exact: true }).count();
console.log("bottoni + :", nPiu);
console.log("CORPO:\n" + (await p.locator("main").innerText()).slice(0, 900));
await p.screenshot({ path: "dbg-pl.png", fullPage: true });
if (nPiu) { await p.getByRole("button", { name: "+", exact: true }).first().click(); await p.waitForTimeout(900); }
const txt = await p.locator("body").innerText();
console.log("=== toast? ===");
console.log(txt.split("\n").filter(l=>/vedi|modific|sede|magazzino/i.test(l)).slice(0,10).join("\n"));
await p.screenshot({ path: "dbg-pl.png", fullPage: true });
await b.close();
