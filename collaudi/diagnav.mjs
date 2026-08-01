import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe=["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const state=readFileSync("seed-state.json","utf8");
const b=await chromium.launch({executablePath:exe,args:["--no-sandbox"]});
const p=await b.newPage({viewport:{width:448,height:950}});
await p.addInitScript((s)=>{const m=new Map();m.set("scp:stato:v1",s);window.storage={async get(k){return m.has(k)?{value:m.get(k)}:null},async set(k,v){m.set(k,v);return true},async delete(k){m.delete(k);return true}};},state);
await p.goto("file://"+path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin",{exact:false}).first().click(); await p.waitForTimeout(400);
for(const d of "1234") await p.getByRole("button",{name:d,exact:true}).first().click().catch(()=>{});
await p.waitForTimeout(1000);
const prof=p.getByText("Profili",{exact:true}); const pc=await prof.count();
for(let i=0;i<pc;i++){if(await prof.nth(i).isVisible()){await prof.nth(i).click();break;}}
await p.waitForTimeout(500);
await p.getByRole("button",{name:/Nuovo profilo/i}).click(); await p.waitForTimeout(500);
const dlg=p.locator(".sc-su");
await dlg.getByPlaceholder("Es. Marco").fill("Cicci");
await dlg.getByRole("button",{name:"Laboratorio",exact:true}).click(); await p.waitForTimeout(400);
const info=await p.evaluate(()=>{
  const r=(el)=>{if(!el)return null;const b=el.getBoundingClientRect();return{top:Math.round(b.top),bottom:Math.round(b.bottom)};};
  const salva=[...document.querySelectorAll("button")].find(x=>x.textContent.trim()==="Salva");
  const nav=document.querySelector("nav");
  // is salva actually covered? elementFromPoint at salva center
  let covered=null;
  if(salva){const bb=salva.getBoundingClientRect();const el=document.elementFromPoint(bb.left+bb.width/2, bb.top+bb.height/2); covered = el ? (el.closest("nav")?"NAV":(el.textContent||"").trim().slice(0,20)) : "none";}
  return {viewport:{h:innerHeight}, salvaRect:r(salva), navRect:r(nav), atSalvaCenter:covered};
});
console.log(JSON.stringify(info,null,2));
await p.screenshot({path:"navbug.png",fullPage:false});
await b.close();
