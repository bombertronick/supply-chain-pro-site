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
await ctx.addInitScript((s)=>{ localStorage.setItem("db:scp:stato:v1",s); localStorage.setItem("scp:tour:v1","1");
 window.storage={async get(k){const v=localStorage.getItem("db:"+k);return v==null?null:{value:v}},
   async set(k,v){localStorage.setItem("db:"+k,v);return true},async delete(k){localStorage.removeItem("db:"+k);return true}};}, JSON.stringify(seed));
const p = await ctx.newPage();
await p.goto(URL); await p.waitForTimeout(1500);
await p.getByText("Admin",{exact:false}).first().click(); await p.waitForTimeout(300);
for (const d of "1234") await p.getByRole("button",{name:d,exact:true}).first().click();
await p.waitForTimeout(1400);
/* «Profili» sta sotto «Gestione» da gen-5.52: la strada la sa navtest.mjs */
await vaiA(p, "Profili");

/* l'admin apre Gigi e scrive una PAROLA come password */
await p.getByRole("button",{name:"Modifica"}).nth(1).click(); await p.waitForTimeout(800);
const campo = p.locator('input[type="password"]').first();
await campo.fill("GigiPizza");
await p.waitForTimeout(300);
const rimasto = await campo.inputValue();
ok(rimasto === "", `scrivendo «GigiPizza» nel campo resta: «${rimasto}» (le lettere spariscono senza dirlo)`);

await p.getByRole("button",{name:/salva/i}).first().click(); await p.waitForTimeout(1800);
const testo = await p.locator("body").innerText();
ok(/aggiornato/i.test(testo), "l'app annuncia comunque «Profilo aggiornato»");
const db = JSON.parse(await p.evaluate(()=>localStorage.getItem("db:scp:stato:v1")));
const g = db.profili.find(x=>x.nome==="Gigi");
ok(g.pinHash === hash("1111"), "MA in archivio il PIN è rimasto quello VECCHIO: la modifica non è avvenuta");

/* seconda prova: una password lunga viene tagliata alle prime 4 cifre */
await p.getByRole("button",{name:"Modifica"}).nth(1).click(); await p.waitForTimeout(800);
const campo2 = p.locator('input[type="password"]').first();
await campo2.fill("20260728");
await p.waitForTimeout(300);
const rimasto2 = await campo2.inputValue();
ok(rimasto2 === "2026", `scrivendo «20260728» resta solo «${rimasto2}»: le altre cifre vengono tagliate`);
await p.getByRole("button",{name:/salva/i}).first().click(); await p.waitForTimeout(1800);
const db2 = JSON.parse(await p.evaluate(()=>localStorage.getItem("db:scp:stato:v1")));
ok(db2.profili.find(x=>x.nome==="Gigi").pinHash === hash("2026"),
   "il PIN salvato è «le prime 4 cifre», non quello che l'admin credeva di aver messo");

await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\nipotesi CONFERMATA su tutti i punti");
process.exit(ko?1:0);
