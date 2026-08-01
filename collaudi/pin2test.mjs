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
const init = (s) => { if(!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1",s);
  localStorage.setItem("scp:tour:v1","1");
  window.storage={async get(k){const v=localStorage.getItem("db:"+k);return v==null?null:{value:v}},
    async set(k,v){localStorage.setItem("db:"+k,v);return true},async delete(k){localStorage.removeItem("db:"+k);return true}}; };
await ctx.addInitScript(init, JSON.stringify(seed));
const errs = []; ctx.on("page", pg => pg.on("pageerror", e => errs.push(e.message)));

const digita = async (pg, pin) => { for (const d of pin) await pg.getByRole("button",{name:d,exact:true}).first().click(); };
const dentro = async (pg) => (await pg.getByText(/Buongiorno|Buonasera|Buon pomeriggio|Plancia/i).count()) > 0;

/* ── DISPOSITIVO A: l'admin ── */
const A = await ctx.newPage();
await A.goto(URL); await A.waitForTimeout(1500);
await A.getByText("Admin",{exact:false}).first().click(); await A.waitForTimeout(300);
await digita(A,"1234"); await A.waitForTimeout(1400);
ok(await dentro(A), "dispositivo A: admin dentro");

/* ── DISPOSITIVO B: il telefono di Gigi, aperto PRIMA della modifica ── */
const B = await ctx.newPage();
await B.goto(URL); await B.waitForTimeout(1800);
ok((await B.getByText("Gigi",{exact:false}).count()) > 0, "dispositivo B: fermo sulla schermata di accesso");

/* ── A: l'admin cambia il PIN di Gigi ── */
/* «Profili» sta sotto «Gestione» da gen-5.52: la strada la sa navtest.mjs */
await vaiA(A, "Profili");
await A.getByRole("button",{name:"Modifica"}).nth(1).click(); await A.waitForTimeout(800);
await A.locator('input[type="password"]').first().fill("9999"); await A.waitForTimeout(200);
await A.getByRole("button",{name:/salva/i}).first().click(); await A.waitForTimeout(2500);
const db = JSON.parse(await A.evaluate(() => localStorage.getItem("db:scp:stato:v1")));
ok(db.profili.find(x=>x.nome==="Gigi")?.pinHash === hash("9999"), "il PIN nuovo è nel database condiviso");

/* ── A: l'admin crea un profilo NUOVO con PIN 5555 ── */
await A.getByRole("button",{name:/Nuovo profilo/i}).first().click().catch(async()=>{
  await A.getByText("Nuovo profilo").first().click(); });
await A.waitForTimeout(800);
await A.getByPlaceholder("Es. Marco").fill("Pino"); await A.waitForTimeout(200);
/* resto sul ruolo Operatore (predefinito) e scelgo la sede «fm» */
await A.locator("select").last().selectOption({ label: "fm" }).catch(async () => {
  await A.locator("select").last().selectOption({ index: 1 }).catch(()=>console.log("   (sede non scelta)")); });
await A.waitForTimeout(500);
await A.locator('input[type="password"]').first().fill("5555"); await A.waitForTimeout(200);
await A.screenshot({path:"pin2-form-nuovo.png",fullPage:true});
console.log("   FORM:", (await A.locator("body").innerText()).replace(/\n/g," | ").slice(0,700));
await A.getByRole("button",{name:/salva/i}).first().click(); await A.waitForTimeout(2500);
console.log("   DOPO SALVA:", (await A.locator("body").innerText()).replace(/\n/g," | ").slice(0,500));
const db2 = JSON.parse(await A.evaluate(() => localStorage.getItem("db:scp:stato:v1")));
const pino = db2.profili.find(x=>x.nome==="Pino");
ok(!!pino, "il profilo «Pino» è stato creato");
ok(pino?.pinHash === hash("5555"), "«Pino» ha in archivio il PIN che ha messo l'admin");

/* ── B: Gigi, sul telefono rimasto aperto, prova il PIN NUOVO ── */
await B.bringToFront(); await B.waitForTimeout(6000);   // il poller allinea ogni ~3s
console.log("   B vede:", (await B.locator("body").innerText()).replace(/\n/g," | ").slice(0,320));
await B.getByText("Gigi",{exact:false}).first().click(); await B.waitForTimeout(400);
await digita(B,"9999"); await B.waitForTimeout(1800);
ok(await dentro(B), "dispositivo B: Gigi entra col PIN nuovo senza ricaricare l'app");
await B.screenshot({path:"pin2-B.png"});

/* ── un terzo dispositivo, appena aperto: Pino col suo PIN ── */
const dbPrima = JSON.parse(await A.evaluate(() => localStorage.getItem("db:scp:stato:v1")));
console.log("   DB prima di C → profili:", dbPrima.profili.map(x=>x.nome).join(", "), "| rev", dbPrima.rev);
const C = await ctx.newPage();
await C.goto(URL);
/* ── PERCHE' QUESTO COLLAUDO ERA CAPRICCIOSO ──
   Qui c'era un'attesa fissa di 2,5 secondi. Da solo bastava; dentro il
   censimento, con decine di browser che si contendono la macchina, a volte
   no — e il collaudo diventava rosso a caso. E' il peggior tipo di rosso:
   insegna a non fidarsi del rosso. Adesso aspetta che «Pino» ci sia davvero,
   fino a mezzo minuto, e riparte appena compare. */
await C.getByText("Pino", { exact: false }).first().waitFor({ state: "visible", timeout: 30000 });
console.log("   C vede:", (await C.locator("body").innerText()).replace(/\n/g," | ").slice(0,320));
await C.getByText("Pino",{exact:false}).first().click(); await C.waitForTimeout(400);
await digita(C,"5555"); await C.waitForTimeout(1800);
ok(await dentro(C), "dispositivo C: «Pino» entra col PIN messo dall'admin");
await C.screenshot({path:"pin2-C.png"});

ok(errs.length===0, "nessun errore JS" + (errs.length?" → "+errs[0]:""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko?1:0);
