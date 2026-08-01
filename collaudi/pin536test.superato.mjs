import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·"+p,"utf8").digest("hex");
let ko = 0; const ok = (c,m) => { console.log((c?"  ok  ":"  KO  ")+m); if(!c) ko++; };

/* riproduco la situazione vera: tre profili con lo STESSO PIN */
const seed = JSON.parse(readFileSync("seed-state.json","utf8"));
const lab = seed.sedi.find(s=>s.tipo==="laboratorio")?.id;
const op  = seed.sedi.find(s=>s.tipo==="operatore")?.id;
seed.profili = [
  {...seed.profili[0], id:"pr-admin", nome:"Admin", ruolo:"admin", pinHash:hash("1234")},
  {...seed.profili[1], id:"pr-op1", nome:"Operatore", ruolo:"operatore", sedeId:op, magazziniIds:[], pinHash:hash("1111")},
  {...seed.profili[1], id:"pr-op2", nome:"Operatore rm", ruolo:"operatore", sedeId:op, magazziniIds:[], pinHash:hash("1111")},
  {...seed.profili[1], id:"pr-gigi", nome:"Gigi", ruolo:"laboratorio", sedeId:lab, pinHash:hash("1111")},
];
const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({executablePath:exe,args:["--no-sandbox"]});
const ctx = await b.newContext({viewport:{width:1280,height:950}});
await ctx.addInitScript((s)=>{ if(!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1",s);
 localStorage.setItem("scp:tour:v1","1");
 window.storage={async get(k){const v=localStorage.getItem("db:"+k);return v==null?null:{value:v}},
   async set(k,v){localStorage.setItem("db:"+k,v);return true},async delete(k){localStorage.removeItem("db:"+k);return true}};}, JSON.stringify(seed));
const errs=[]; ctx.on("page",pg=>pg.on("pageerror",e=>errs.push(e.message)));
const p = await ctx.newPage();
await p.goto(URL); await p.waitForTimeout(1500);
await p.getByText("Admin",{exact:false}).first().click(); await p.waitForTimeout(300);
for (const d of "1234") { await p.getByRole("button",{name:d,exact:true}).first().click(); await p.waitForTimeout(160); }
await p.waitForTimeout(1400);
/* «Profili» sta sotto «Gestione» da gen-5.52: la strada la sa navtest.mjs */
await vaiA(p, "Profili");
const testo = async () => await p.locator("body").innerText();

/* 1. l'avviso in cima elenca chi è rimasto fuori */
const t1 = await testo();
ok(/non riescono ad accedere/.test(t1), "in cima ai Profili compare l'avviso di blocco");
ok(t1.includes("«Operatore rm»") && t1.includes("«Gigi»"), "elenca proprio i due bloccati: Operatore rm e Gigi");
ok(!/«Operatore»,/.test(t1.split("non riescono")[1]?.slice(0,120) || ""), "non accusa il primo, che invece entra");
await p.screenshot({path:"pin536-avviso.png",fullPage:true});

/* 2. non si può salvare un PIN già di un altro */
await p.getByRole("button",{name:"Modifica"}).nth(3).click(); await p.waitForTimeout(800);
await p.locator('input[type="password"]').first().fill("1234"); await p.waitForTimeout(300);
await p.getByRole("button",{name:/salva/i}).first().click(); await p.waitForTimeout(1200);
const t2 = await testo();
ok(/già di «Admin»/.test(t2), "rifiuta il PIN di un altro e dice di chi è: «già di «Admin»»");
ok((await p.locator('input[type="password"]').count()) > 0, "la scheda resta aperta per correggere");
const db1 = JSON.parse(await p.evaluate(()=>localStorage.getItem("db:scp:stato:v1")));
ok(db1.profili.find(x=>x.id==="pr-gigi").pinHash === hash("1111"), "niente è stato scritto");

/* 3. con un PIN suo, passa e l'avviso si accorcia */
await p.locator('input[type="password"]').first().fill("7788"); await p.waitForTimeout(300);
await p.getByRole("button",{name:/salva/i}).first().click(); await p.waitForTimeout(1800);
const db2 = JSON.parse(await p.evaluate(()=>localStorage.getItem("db:scp:stato:v1")));
ok(db2.profili.find(x=>x.id==="pr-gigi").pinHash === hash("7788"), "il PIN nuovo e unico viene salvato");
const t3 = await testo();
ok(!t3.includes("«Gigi»") || !/non riesc/.test(t3.split("«Gigi»")[0].slice(-200)), "Gigi sparisce dall'avviso");
ok(/Un profilo non riesce ad accedere/.test(t3), "resta segnalato solo «Operatore rm»");
await p.screenshot({path:"pin536-dopo.png",fullPage:true});

ok(errs.length===0, "nessun errore JS" + (errs.length?" → "+errs[0]:""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko?1:0);
