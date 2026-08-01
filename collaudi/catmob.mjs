/* gen-5.61: nel Catalogo, sul telefono, la riga sotto al nome si legge tutta.
   La prova non e' «e' piu' larga»: e' che il testo che compare a schermo
   contiene per intero quello che deve dire, senza i tre puntini. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const s = JSON.parse(JSON.stringify(base));
const UPZ = s.unita.find((u) => u.simbolo === "pz").id;
const [PA, PB] = s.prodotti;
s.prodotti = s.prodotti.slice(0, 2).map((p, i) => ({
  ...p, uomBase: UPZ, fornitoreId: s.fornitori[0].id, categoriaId: s.categorie[0].id,
  ...(i === 0 ? { preparato: true } : {}),
}));
s.magazzini = []; s.ordini = []; s.richieste = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
s.profili = [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
/* 360 e' il telefono piu' stretto che ho misurato in giro, non 390: se si
   legge li', si legge dappertutto */
for (const largh of [360, 390]) {
  console.log(`\n— telefono da ${largh} punti —`);
  const ctx = await b.newContext({ viewport: { width: largh, height: 900 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(s));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(largh + ": " + e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1600);
  await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  await vaiA(p, "Catalogo");
  await p.getByText(/^Prodotti · \d+$/).click(); await p.waitForTimeout(700);
  await p.getByText(s.categorie[0].nome, { exact: false }).first().click(); await p.waitForTimeout(700);

  const t = (await p.locator("body").innerText()).replace(/\s+/g, " ");
  ok(/Preparato in laboratorio · base pz/.test(t),
    "del preparato si legge tutto: «Preparato in laboratorio · base pz»");
  ok(!/Preparato in…|Preparato in\.\.\./.test(t), "e non «Preparato in…» tagliato");
  ok(new RegExp(`${s.fornitori[0].nome} · base pz`).test(t),
    `del comprato si legge tutto: «${s.fornitori[0].nome} · base pz»`);
  ok(new RegExp(`${PA.nome}`).test(t) && new RegExp(`${PB.nome}`).test(t),
    "e i due nomi per intero, senza puntini");
  /* la categoria non sparisce: resta nel titolo del gruppo */
  ok((t.match(new RegExp(s.categorie[0].nome, "g")) || []).length >= 1,
    "la categoria si legge ancora, nel titolo del gruppo");
  /* e non e' piu' ripetuta su ogni riga: una volta per il gruppo, non tre */
  const quante = (t.match(new RegExp(s.categorie[0].nome, "g")) || []).length;
  ok(quante <= 2, `senza ripeterla su ogni riga (compare ${quante} volte, non ${2 + 2})`);
  /* niente deve uscire dal bordo dello schermo */
  const largo = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  ok(!largo, "e niente esce di lato dallo schermo");
  await p.screenshot({ path: `g561-catalogo-${largh}.png`, fullPage: true });
  await ctx.close();
}
console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 5)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
