import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·"+p,"utf8").digest("hex");
let ko = 0; const ok = (c,m) => { console.log((c?"  ok  ":"  KO  ")+m); if(!c) ko++; };

const seed = JSON.parse(readFileSync("seed-state.json","utf8"));
seed.profili = [
  {...seed.profili[0], id:"pr-admin", nome:"Admin", ruolo:"admin", pinHash:hash("1234")},
  {...seed.profili[1], id:"pr-gigi", nome:"Gigi", ruolo:"laboratorio",
   sedeId:seed.sedi.find(s=>s.tipo==="laboratorio")?.id, pinHash:hash("1111")},
];
const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({executablePath:exe,args:["--no-sandbox"]});
const ctx = await b.newContext({viewport:{width:1280,height:950}});
/* 31/08/2026 — lo script di init gira anche sull'about:blank che Playwright
   apre prima del goto: lì l'origine è opaca e leggere localStorage tira
   SecurityError. Non è un difetto dell'app (in app.jsx i tocchi a
   localStorage sono tutti dentro try/catch): si vedeva solo qui perché
   ctx.on("page") aggancia il listener in tempo per sentirlo. */
await ctx.addInitScript((s)=>{ try { if(!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1",s); localStorage.setItem("scp:tour:v1","1");
 window.storage={async get(k){const v=localStorage.getItem("db:"+k);return v==null?null:{value:v}},
   async set(k,v){localStorage.setItem("db:"+k,v);return true},async delete(k){localStorage.removeItem("db:"+k);return true}};} catch {} }, JSON.stringify(seed));
const errs = []; ctx.on("page", pg => pg.on("pageerror", e => errs.push(e.message)));
const p = await ctx.newPage();
const db = async () => JSON.parse(await p.evaluate(()=>localStorage.getItem("db:scp:stato:v1")));
const gigiHash = async () => (await db()).profili.find(x=>x.nome==="Gigi").pinHash;

await p.goto(URL); await p.waitForTimeout(1500);
await p.getByText("Admin",{exact:false}).first().click(); await p.waitForTimeout(300);
for (const d of "1234") { await p.getByRole("button",{name:d,exact:true}).first().click(); await p.waitForTimeout(180); }
await p.waitForTimeout(1400);
/* «Profili» sta sotto «Gestione» da gen-5.52: la strada la sa navtest.mjs */
await vaiA(p, "Profili");
const apriGigi = async () => { await p.getByRole("button",{name:"Modifica"}).nth(1).click(); await p.waitForTimeout(800); };
const campo = () => p.locator('input[type="password"]').first();
const salva = async () => { await p.getByRole("button",{name:/salva/i}).first().click(); await p.waitForTimeout(1500); };
const formAperto = async () => (await p.locator('input[type="password"]').count()) > 0;

/* 1. una parola: il campo la tiene e avverte, il salvataggio si rifiuta */
await apriGigi();
await campo().fill("GigiPizza"); await p.waitForTimeout(400);
ok(await campo().inputValue() === "GigiPizza", "il campo NON butta più via le lettere mentre scrivo");
ok((await p.locator("body").innerText()).includes("Solo numeri"), "avvisa sotto al campo: «Solo numeri…»");
await salva();
ok(await formAperto(), "il salvataggio viene rifiutato e la scheda resta aperta");
ok(await gigiHash() === hash("1111"), "il PIN in archivio non è stato toccato");

/* 2. troppe cifre: stessa storia, ma con il conteggio */
await campo().fill("20260728"); await p.waitForTimeout(400);
ok((await p.locator("body").innerText()).includes("8 cifre"), "conta le cifre: «8 cifre: devono essere esattamente 4»");
await salva();
ok(await formAperto(), "anche con 8 cifre il salvataggio si rifiuta");
ok(await gigiHash() === hash("1111"), "PIN ancora intatto");

/* 3. quattro cifre: passa, e lo dice */
await campo().fill("4821"); await p.waitForTimeout(400);
ok((await p.locator("body").innerText()).includes("Ricordati di comunicarlo"), "conferma dal vivo che il PIN va bene");
await salva();
ok(!(await formAperto()), "la scheda si chiude: salvato");
ok(await gigiHash() === hash("4821"), "in archivio c'è il PIN NUOVO");
ok((await p.locator("body").innerText()).includes("Nuovo PIN attivo"), "avvisa che il PIN è cambiato davvero");
const log = (await db()).log[0]?.msg || "";
ok(/PIN nuovo/.test(log), "lo storico distingue il cambio PIN: «" + log + "»");

/* 4. campo vuoto = nessun cambio (si modifica solo il nome) */
await apriGigi();
await p.getByPlaceholder("Es. Marco").fill("Gigi"); await p.waitForTimeout(200);
await salva();
ok(await gigiHash() === hash("4821"), "lasciando il campo vuoto il PIN resta quello nuovo");

/* 5. la prova vera: Gigi entra col PIN messo dall'admin */
const prima = await db();
console.log("   profili in archivio:", prima.profili.map(x=>x.nome+"="+x.pinHash.slice(0,8)).join(", "),
            "| atteso 4821 =", hash("4821").slice(0,8));
await p.goto(URL); await p.waitForTimeout(1600);
console.log("   hash visto dalla pagina dopo il reload:", await p.evaluate(()=>{
  const s = JSON.parse(localStorage.getItem("db:scp:stato:v1"));
  return s.profili.map(x=>x.nome+"="+String(x.pinHash).slice(0,8)).join(", "); }));
await p.getByText("Gigi",{exact:false}).first().click(); await p.waitForTimeout(400);
for (const d of "4821") { await p.getByRole("button",{name:d,exact:true}).first().click(); await p.waitForTimeout(180); }
await p.waitForTimeout(2200);
console.log("   schermo:", (await p.locator("body").innerText()).replace(/\n/g," | ").slice(0,260));
ok((await p.getByText(/Buongiorno|Buonasera|Buon pomeriggio|Plancia/i).count()) > 0,
   "Gigi entra con il PIN deciso dall'admin");
await p.screenshot({path:"pin535-dentro.png"});

ok(errs.length===0, "nessun errore JS" + (errs.length?" → "+errs[0]:""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko?1:0);
