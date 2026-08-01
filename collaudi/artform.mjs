import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe=["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const state=readFileSync("seed-state.json","utf8");
const b=await chromium.launch({executablePath:exe,args:["--no-sandbox"]});
const p=await b.newPage({viewport:{width:1200,height:900}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.addInitScript((s)=>{const m=new Map();m.set("scp:stato:v1",s);window.storage={async get(k){return m.has(k)?{value:m.get(k)}:null},async set(k,v){m.set(k,v);return true},async delete(k){m.delete(k);return true}};},state);
await p.goto("file://"+path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin",{exact:false}).first().click(); await p.waitForTimeout(400);
for(const d of "1234") await p.getByRole("button",{name:d,exact:true}).first().click().catch(()=>{});
await p.waitForTimeout(1000);
const nav=p.getByText("Magazzini",{exact:true}); const n=await nav.count();
for(let i=0;i<n;i++){if(await nav.nth(i).isVisible()){await nav.nth(i).click();break;}}
await p.waitForTimeout(700);
// open first magazzino card
await p.getByText("Magazzino consumabili",{exact:false}).first().click().catch(()=>{});
await p.waitForTimeout(700);
// find an edit-article pencil (aria-label contains "Modifica")
const editBtn=p.getByRole("button",{name:"Modifica Cartoni pizza"}).first();
await editBtn.click().catch((e)=>console.log("edit click fail",e.message));
await p.waitForTimeout(700);
const hasFeriale=await p.getByText("Feriale",{exact:false}).count();
const hasWeekend=await p.getByText("Weekend",{exact:false}).count();
console.log("Feriale field:",hasFeriale>0,"| Weekend field:",hasWeekend>0,"| pageerrors:",errs.length,errs.slice(0,3));
await p.screenshot({path:"artform.png",fullPage:false});
await b.close();
