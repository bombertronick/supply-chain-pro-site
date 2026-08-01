/* gen-5.64: il tasto Inventario non racconta più il giro di un altro come suo.
   La prova sta in tre situazioni diverse dello stesso tasto. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const UPZ = base.unita.find((u) => u.simbolo === "pz").id;
const [PA] = base.prodotti;

const scena = (inv) => {
  const s = JSON.parse(JSON.stringify(base));
  s.prodotti = [{ ...PA, uomBase: UPZ, fornitoreId: s.fornitori[0].id, categoriaId: s.categorie[0].id }];
  s.sedi = [
    { id: "sede-fm", nome: "Fiumicino", tipo: "operatore" },
    { id: "sede-rm", nome: "Roma", tipo: "operatore" },
  ];
  s.magazzini = [
    { id: "mag-fm", sedeId: "sede-fm", nome: "Secco fm", tipo: "retro",
      articoli: [{ prodottoId: PA.id, uomId: UPZ, qty: 5, par: 8 }] },
    { id: "mag-rm", sedeId: "sede-rm", nome: "Secco rm", tipo: "retro",
      articoli: [{ prodottoId: PA.id, uomId: UPZ, qty: 5, par: 8 }] },
  ];
  s.ordini = []; s.richieste = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
  s.profili = [
    { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
    { id: "pr-fm", nome: "Gigi", ruolo: "operatore", sedeId: "sede-fm", colore: "#3B82F6", pinHash: hash("2222") },
  ];
  if (inv) s.invCorso = inv;
  return s;
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, seme) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(seme));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1600);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  await vaiA(p, "Magazzini");
  return { p, ctx };
};
const tasto = async (p) => (await p.getByRole("button", { name: /Inventario/ }).first().innerText()).replace(/\s+/g, " ").trim();

/* ═══ 1. NESSUN GIRO APERTO ═══ */
console.log("\n— 1. nessuno sta contando —");
const A0 = await apri("Admin", "1234", scena(null));
ok(await tasto(A0.p) === "Inventario", "il tasto dice solo «Inventario»");
await A0.ctx.close();

/* ═══ 2. IL GIRO E' DI GIGI, NON DELL'ADMIN ═══ */
console.log("\n— 2. sta contando la squadra di Gigi —");
const invGigi = { "sede-fm": { id: "inv-1", t: Date.now(), chi: "Gigi", sedeId: "sede-fm",
  magIds: ["mag-fm"], valori: {}, chiusi: ["mag-fm"] } };
const A1 = await apri("Admin", "1234", scena(invGigi));
const t1 = await tasto(A1.p);
console.log("     il tasto dice:", JSON.stringify(t1));
ok(!/1 su 1/.test(t1), "NON dice «1 su 1»: quel giro non è dell'admin e non è a buon punto per lui");
ok(/1 in corso/.test(t1), "dice «1 in corso»: che è la verità");
await A1.p.screenshot({ path: "g564-admin-altrui.png", fullPage: true });
await A1.ctx.close();

/* e Gigi, che il giro ce l'ha davvero, vede il suo avanzamento */
const G1 = await apri("Gigi", "2222", scena(invGigi));
ok(/1 su 1/.test(await tasto(G1.p)), "Gigi invece vede il SUO avanzamento: «1 su 1»");
await G1.ctx.close();

/* ═══ 3. DUE SQUADRE INSIEME ═══ */
console.log("\n— 3. due squadre contano insieme —");
const invDue = {
  "sede-fm": { id: "inv-1", t: Date.now(), chi: "Gigi", sedeId: "sede-fm", magIds: ["mag-fm"], valori: {}, chiusi: [] },
  "sede-rm": { id: "inv-2", t: Date.now(), chi: "Rosa", sedeId: "sede-rm", magIds: ["mag-rm"], valori: {}, chiusi: [] },
};
const A2 = await apri("Admin", "1234", scena(invDue));
ok(/2 in corso/.test(await tasto(A2.p)), "l'admin legge «2 in corso», non l'avanzamento di uno dei due");
await A2.ctx.close();

/* ═══ 4. IL GIRO DELL'ADMIN E' SUO ANCHE SE SCEGLIE UNA SEDE ═══ */
console.log("\n— 4. il giro aperto dall'admin su una sede —");
const invAdmin = { "sede-fm": { id: "inv-3", t: Date.now(), chi: "Admin", sedeId: null,
  magIds: ["mag-fm"], valori: {}, chiusi: [] } };
const A3 = await apri("Admin", "1234", scena(invAdmin));
const t3 = await tasto(A3.p);
console.log("     il tasto dice:", JSON.stringify(t3));
ok(/0 su 1/.test(t3),
  "quello aperto DALL'ADMIN resta suo e mostra l'avanzamento, anche se sta sotto la chiave di una sede");
await A3.ctx.close();

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 5)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
