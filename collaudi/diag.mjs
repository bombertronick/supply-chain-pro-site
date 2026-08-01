import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const state = readFileSync("seed-state.json","utf8");
const b = await chromium.launch({ executablePath: exe, args:["--no-sandbox"] });
const p = await b.newPage({ viewport:{ width:440, height:850 } });
await p.addInitScript((s)=>{const m=new Map();m.set("scp:stato:v1",s);window.storage={async get(k){return m.has(k)?{value:m.get(k)}:null},async set(k,v){m.set(k,v);return true},async delete(k){m.delete(k);return true}};},state);
await p.goto("file://"+path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin",{exact:false}).first().click(); await p.waitForTimeout(400);
for(const d of "1234") await p.getByRole("button",{name:d,exact:true}).first().click().catch(()=>{});
await p.waitForTimeout(1000);
// open profiles: click visible "Profili"
const prof=p.getByText("Profili",{exact:true}); const pc=await prof.count();
for(let i=0;i<pc;i++){ if(await prof.nth(i).isVisible()){ await prof.nth(i).click(); break; } }
await p.waitForTimeout(500);
await p.getByRole("button",{name:/Nuovo profilo/i}).click();
await p.waitForTimeout(900);
const diag = await p.evaluate(()=>{
  const panel=document.querySelector(".sc-su");
  const title=panel?.querySelector("h3");
  const nome=panel?.querySelector('input');
  const r=(el)=>{ if(!el) return null; const b=el.getBoundingClientRect(); return {top:Math.round(b.top),bottom:Math.round(b.bottom),h:Math.round(b.height)}; };
  return {
    viewport:{w:innerWidth,h:innerHeight},
    panel: panel?{scrollTop:panel.scrollTop, scrollHeight:panel.scrollHeight, clientHeight:panel.clientHeight, rect:r(panel)}:null,
    titleRect: r(title), titleText:title?.textContent,
    nomeRect: r(nome), activeEl: document.activeElement?.tagName+" "+(document.activeElement?.placeholder||"")
  };
});
console.log(JSON.stringify(diag,null,2));
await p.screenshot({path:"diag-fullpage.png", fullPage:false});
await b.close();
