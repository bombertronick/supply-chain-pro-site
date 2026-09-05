/* SONDA (non un collaudo): chi cancella scp:coda:v1 al ricaricamento, in modo sicuro? */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 6);
const perNome = (n) => { const p = base.prodotti.find((x) => x.nome === n); return linea.articoli.find((x) => x.prodottoId === p?.id); };
const moz = perNome("Mozzarella no lattosio"), sug = perNome("Sugo");
for (const a of [moz, sug]) a.qty = 50;
FM.cassaMagId = linea.id;
base.listino = [{ id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, attivo: true, varianti: [],
  distinta: [{ prodottoId: sug.prodottoId, qty: 1, uomId: sug.uomId }, { prodottoId: moz.prodottoId, qty: 1, uomId: moz.uomId }] }];
base.aggiunte = []; base.postazioni = []; base.vendite = []; base.giornate = [];
const PRC = { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") };
const SEME = JSON.stringify({ ...base, profili: [PRC] });
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(([j]) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  if (!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1", j);
  window.__diario = [];
  /* SPIA su localStorage: chi tocca scp:coda:v1 lascia il nome e lo stack */
  const orig = { set: localStorage.setItem.bind(localStorage), rem: localStorage.removeItem.bind(localStorage), clr: localStorage.clear.bind(localStorage) };
  localStorage.setItem = (k, v) => { if (k === "scp:coda:v1") window.__diario.push({ op: "set", n: JSON.parse(v||"[]").length, st: new Error().stack.split("\n").slice(1,4).join(" | ") }); return orig.set(k, v); };
  localStorage.removeItem = (k) => { if (k === "scp:coda:v1") window.__diario.push({ op: "remove", st: new Error().stack.split("\n").slice(1,4).join(" | ") }); return orig.rem(k); };
  localStorage.clear = () => { window.__diario.push({ op: "clear" }); return orig.clr(); };
  const bandiera = (k) => { try { return localStorage.getItem(k) === "1"; } catch { return false; } };
  window.__uccidiRete = (x) => { try { orig.set("prova:rete-morta", x ? "1" : "0"); } catch {} };
  const sha = async (t) => { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
    return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join(""); };
  let TOKEN = null;
  window.auth = {
    async loginList() { return JSON.parse(localStorage.getItem("db:scp:stato:v1")).profili.map((p) => ({ id: p.id, nome: p.nome, ruolo: p.ruolo, colore: p.colore })); },
    async login(arg) { const parti = String(arg).split(String.fromCharCode(1)); const h = await sha("scp·" + parti[0]);
      const prof = JSON.parse(localStorage.getItem("db:scp:stato:v1")).profili.find((p) => p.pinHash === h && (!parti[1] || p.id === parti[1]));
      if (!prof) return { error: "pin" }; TOKEN = "tok"; return { token: TOKEN, profiloId: prof.id, ruolo: prof.ruolo }; },
    async registra() { return { error: "codice" }; }, async richiesta() { return { ok: true }; },
    logout() { TOKEN = null; }, get token() { return TOKEN; },
  };
  window.storage = {
    async get(k) { if (!TOKEN) return null; const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { if (!TOKEN) throw new Error("nessuna sessione"); if (bandiera("prova:rete-morta")) throw new Error("rete morta");
      orig.set("db:" + k, v); return true; },
    async delete(k) { if (!TOKEN) return null; localStorage.removeItem("db:" + k); return true; },
  };
}, [SEME]);
const p = await ctx.newPage();
const URL = "file://" + path.resolve("index.html");
const coda = () => p.evaluate(() => localStorage.getItem("scp:coda:v1"));
const diario = () => p.evaluate(() => window.__diario);
const login = async () => { await p.getByText("OpCassa", { exact: true }).first().click().catch(()=>{});
  await p.waitForTimeout(400); for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click().catch(()=>{}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1500); };
await p.goto(URL); await p.waitForTimeout(1500); await login();
const nav = p.getByText("Cassa", { exact: true }); for (let i=0;i<await nav.count();i++) if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
await p.waitForTimeout(900);
await p.evaluate(() => window.__uccidiRete(true));
await p.getByRole("button", { name: "Aggiungi Margherita", exact: true }).click(); await p.waitForTimeout(300);
await p.getByRole("button", { name: "Incassa", exact: true }).click(); await p.waitForTimeout(600);
await p.getByRole("button", { name: "Registra l'incasso", exact: true }).click(); await p.waitForTimeout(3000);
console.log("PRIMA del ricaricamento · coda:", coda ? (await coda()) ? "presente" : "ASSENTE" : "?");
console.log("  diario:", JSON.stringify(await diario(), null, 1).slice(0, 900));
await p.goto(URL); await p.waitForTimeout(500);
console.log("\n+0,5s dopo il ricaricamento · coda:", (await coda()) ? "presente" : "ASSENTE");
await p.waitForTimeout(4000);
console.log("+4,5s dopo il ricaricamento · coda:", (await coda()) ? "presente" : "ASSENTE");
console.log("  diario dopo:", JSON.stringify(await diario(), null, 1).slice(0, 1200));
await b.close();
