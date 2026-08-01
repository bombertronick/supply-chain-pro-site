import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* tre profili, due con lo STESSO PIN: adesso devono entrare tutti, ognuno in sé */
const seed = JSON.parse(readFileSync("seed-state.json", "utf8"));
const lab = seed.sedi.find((s) => s.tipo === "laboratorio")?.id;
const op = seed.sedi.find((s) => s.tipo === "operatore")?.id;
seed.profili = [
  { ...seed.profili[0], id: "pr-admin", nome: "Admin", ruolo: "admin", pinHash: hash("1234") },
  { ...seed.profili[1], id: "pr-op1", nome: "Operatore", ruolo: "operatore", sedeId: op, magazziniIds: [], pinHash: hash("1111") },
  { ...seed.profili[1], id: "pr-gigi", nome: "Gigi", ruolo: "laboratorio", sedeId: lab, pinHash: hash("1111") },
];
const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });

/* finto server che riproduce app_login come l'ho scritta in Postgres */
const initAuth = (s) => {
  if (!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1", s);
  localStorage.setItem("scp:tour:v1", "1");
  window.__chiamate = [];
  const sha = async (t) => {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  };
  let TOKEN = null;
  window.auth = {
    async loginList() {
      return JSON.parse(localStorage.getItem("db:scp:stato:v1")).profili
        .map((p) => ({ id: p.id, nome: p.nome, ruolo: p.ruolo, colore: p.colore }));
    },
    async login(arg) {
      window.__chiamate.push(String(arg));
      const parti = String(arg).split(String.fromCharCode(1));
      const pin = parti[0], id = parti[1] || null;
      const h = await sha("scp·" + pin);
      const prof = JSON.parse(localStorage.getItem("db:scp:stato:v1")).profili
        .find((p) => p.pinHash === h && (!id || p.id === id));
      if (!prof) return { error: "pin" };
      TOKEN = "tok-" + prof.id;
      return { token: TOKEN, profiloId: prof.id, ruolo: prof.ruolo };
    },
    async registra() { return { error: "codice" }; },
    async richiesta() { return { ok: true }; },
    logout() { TOKEN = null; },
    get token() { return TOKEN; },
  };
  window.storage = {
    async get(k) { if (!TOKEN) return null; const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { if (!TOKEN) return null; localStorage.setItem("db:" + k, v); return true; },
    async delete(k) { if (!TOKEN) return null; localStorage.removeItem("db:" + k); return true; },
  };
};

const apri = async () => {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 950 } });
  await ctx.addInitScript(initAuth, JSON.stringify(seed));
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(1800);
  if (process.env.DBG) console.log("   pagina:", (await p.locator("body").innerText()).replace(/\n/g," | ").slice(0,260), "| errs:", errs[0]||"-");
  return { ctx, p, errs };
};
const digita = async (p, pin) => {
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(170); }
  await p.waitForTimeout(1700);
};
const entra = async (nome, pin) => {
  const { ctx, p, errs } = await apri();
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  await digita(p, pin);
  const dentro = (await p.locator("body").innerText()).match(/Connesso come ([^\n]+)/)?.[1] || null;
  const chiamate = await p.evaluate(() => window.__chiamate);
  await ctx.close();
  return { dentro, chiamate, errs };
};

const a = await entra("Operatore", "1111");
ok(a.chiamate[0]?.includes("pr-op1"), "l'app manda al server anche il profilo scelto");
ok(a.dentro === "Operatore", "«Operatore» entra come sé stesso → " + a.dentro);

const g = await entra("Gigi", "1111");
ok(g.dentro === "Gigi", "«Gigi» entra come sé stesso con lo STESSO PIN → " + g.dentro);
ok(g.errs.length === 0, "nessun errore JS");

const x = await entra("Gigi", "1234");
ok(x.dentro === null, "con il PIN di un altro profilo non si entra");

/* e nella gestione profili non deve più comparire nessuna spia */
const { ctx, p } = await apri();
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
await digita(p, "1234");
/* «Profili» sta sotto «Gestione» da gen-5.52: la strada la sa navtest.mjs */
await vaiA(p, "Profili");
ok(!/non riesc\w* ad accedere/.test(await p.locator("body").innerText()),
  "sparito l'avviso che elencava i profili bloccati");
await p.getByRole("button", { name: "Modifica" }).nth(2).click(); await p.waitForTimeout(800);
await p.locator('input[type="password"]').first().fill("1234"); await p.waitForTimeout(300);
await p.getByRole("button", { name: /salva/i }).first().click(); await p.waitForTimeout(1700);
ok(!/già di «/.test(await p.locator("body").innerText()),
  "salvando un PIN uguale a quello di un altro NON si rivela di chi è");
const db = JSON.parse(await p.evaluate(() => localStorage.getItem("db:scp:stato:v1")));
ok(db.profili.find((y) => y.id === "pr-gigi").pinHash === hash("1234"), "il PIN viene accettato senza obiezioni");
await p.screenshot({ path: "pin537-profili.png", fullPage: true });
await ctx.close();

await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
