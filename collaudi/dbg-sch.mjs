import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
const gn13 = s.unita.find((u) => /1\/3/.test(u.simbolo)) || s.unita[0];
const mag = s.magazzini.find((m) => m.tipo.startsWith("linea"));
console.log("unita scelta:", JSON.stringify(gn13), "| mag:", mag.id, mag.nome, mag.tipo, "art", mag.articoli.length);
mag.articoli = mag.articoli.slice(0, 8).map((a) => ({ ...a, uomId: gn13.id, qty: 0, par: 2 }));
s.profili = [{ id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: mag.sedeId, colore: "#E8A13C",
  magazziniIds: [mag.id], pinHash: hash("2222") }];
const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await p.goto(URL); await p.waitForTimeout(1500);
await p.getByText("Op", { exact: true }).first().click(); await p.waitForTimeout(300);
for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
await p.waitForTimeout(1600);
console.log("=== dopo login ===\n" + (await p.locator("body").innerText()).slice(0, 700));
await p.screenshot({ path: "dbg-a.png" });
const nav = await p.locator("nav").count();
console.log("nav count:", nav, "| voci:", await p.locator("nav").first().innerText().catch(()=>"-"));
await p.locator("nav").getByText("Conteggi", { exact: true }).first().click().catch((e)=>console.log("click conteggi KO", e.message));
await p.waitForTimeout(1000);
console.log("=== conteggi ===\n" + (await p.locator("body").innerText()).slice(0, 900));
await p.screenshot({ path: "dbg-b.png" });
console.log("cerco mag:", mag.nome, "->", await p.getByText(mag.nome, { exact: false }).count());
await p.getByText(mag.nome, { exact: false }).first().click().catch((e)=>console.log("click mag KO", e.message));
await p.waitForTimeout(1300);
console.log("=== dentro ===\n" + (await p.locator("body").innerText()).slice(0, 900));
console.log("input decimal:", await p.locator("input[inputmode=decimal]").count());
console.log("input any:", await p.locator("input").count());
await p.screenshot({ path: "dbg-c.png" });
await b.close();
