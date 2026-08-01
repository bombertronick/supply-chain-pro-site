/* gen-5.63: un preparato in una sede senza laboratorio non sparisce piu'.

   Il punto NON e' far partire una richiesta: non c'e' nessuno a cui mandarla,
   e inventargli un destinatario sarebbe peggio del silenzio. Il punto e' che
   il silenzio smetta di essere silenzio. Quindi provo due cose insieme:
     1. che continui a non nascere niente (nessun ordine, nessuna richiesta)
     2. che l'app lo dica, con dentro sede, magazzino e prodotto
   E accanto tengo una sede col laboratorio, come testimone: se sparisse
   l'avviso anche li', vorrebbe dire che ho acceso una luce che non serve. */
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

const scena = () => {
  const s = JSON.parse(JSON.stringify(base));
  s.prodotti = [{ ...PA, uomBase: UPZ, fornitoreId: s.fornitori[0].id,
    categoriaId: s.categorie[0].id, preparato: true }];
  /* tre sedi: il laboratorio, una sede collegata (testimone) e una scollegata */
  s.sedi = [
    { id: "sede-lab", nome: "Portuense", tipo: "laboratorio" },
    { id: "sede-ok", nome: "Fiumicino", tipo: "operatore", labSedeId: "sede-lab" },
    { id: "sede-orfana", nome: "Ostia", tipo: "operatore" },
  ];
  s.magazzini = [
    { id: "mag-lab", sedeId: "sede-lab", nome: "Magazzino centrale", tipo: "laboratorio",
      articoli: [{ prodottoId: PA.id, uomId: UPZ, qty: 50, par: 50 }] },
    { id: "mag-ok", sedeId: "sede-ok", nome: "Secco fiumicino", tipo: "retro",
      articoli: [{ prodottoId: PA.id, uomId: UPZ, qty: 1, par: 6 }] },
    { id: "mag-orfano", sedeId: "sede-orfana", nome: "Secco ostia", tipo: "retro",
      articoli: [{ prodottoId: PA.id, uomId: UPZ, qty: 2, par: 9 }] },
  ];
  s.ordini = []; s.richieste = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
  s.profili = [
    { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
    { id: "pr-ostia", nome: "Ostia", ruolo: "operatore", sedeId: "sede-orfana", colore: "#3B82F6", pinHash: hash("2222") },
    { id: "pr-fiu", nome: "Fiumi", ruolo: "operatore", sedeId: "sede-ok", colore: "#22B8CF", pinHash: hash("3333") },
  ];
  return s;
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(scena()));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1600);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  await vaiA(p, "Ordini");
  return { p, ctx };
};
const testo = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");

/* ═══ 1. L'ADMIN: ricalcola e guarda ═══ */
console.log("\n— 1. l'admin ricalcola —");
const A = await apri("Admin", "1234");
await A.p.getByRole("button", { name: /Ricalcola/ }).click(); await A.p.waitForTimeout(2200);
const d = await A.p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));

ok(!(d.ordini || []).some((o) => o.stato === "da-ordinare"),
  "nessuna riga d'ordine: un preparato non si compra, da nessuna delle due sedi");
const ricOk = (d.richieste || []).filter((r) => r.daSedeId === "sede-ok");
const ricOrf = (d.richieste || []).filter((r) => r.daSedeId === "sede-orfana");
ok(ricOk.length === 1, "la sede COL laboratorio manda la sua richiesta (testimone)");
ok(ricOrf.length === 0, "quella SENZA non ne manda nessuna: non c'e' nessuno a cui mandarla");

const t = await testo(A.p);
ok(/non ha nessuno a cui chiederlo/.test(t), "e adesso l'app lo dice, invece di tacere");
ok(/Ostia/.test(t), "nominando la sede rimasta scollegata");
ok(/Secco ostia/.test(t), "e il magazzino dov'e' sotto");
ok(new RegExp(`${PA.nome}`).test(t), "e il prodotto");
ok(/ne mancano 7 pz/.test(t), "con quanto ne manca (9 − 2 = 7)");
ok(/Gestione → Sedi/.test(t), "e dove si rimedia");
/* il testimone non deve finire nell'avviso */
ok(!new RegExp(`chiederlo[\\s\\S]{0,400}Secco fiumicino`).test(t),
  "senza tirarci dentro la sede che il laboratorio ce l'ha");
await A.p.screenshot({ path: "g563-avviso.png", fullPage: true });
await A.ctx.close();

/* ═══ 2. CHI LO VEDE ═══ */
console.log("\n— 2. chi lo vede —");
const O = await apri("Ostia", "2222");
ok(/non ha nessuno a cui chiederlo/.test(await testo(O.p)),
  "la sede rimasta a secco lo vede: e' lei che resta senza");
await O.ctx.close();
const F = await apri("Fiumi", "3333");
ok(!/non ha nessuno a cui chiederlo/.test(await testo(F.p)),
  "l'altra sede no: non e' un problema suo");
await F.ctx.close();

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 5)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
