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
const prof=p.getByText("Profili",{exact:true}); const pc=await prof.count();
for(let i=0;i<pc;i++){ if(await prof.nth(i).isVisible()){ await prof.nth(i).click(); break; } }
await p.waitForTimeout(500);
await p.getByRole("button",{name:/Nuovo profilo/i}).click();
await p.waitForTimeout(900);
const walk = await p.evaluate(()=>{
  // find the fixed overlay (parent of .sc-su)
  const panel=document.querySelector(".sc-su");
  const overlay=panel?.parentElement;
  const out=[];
  let el=overlay;
  while(el && el!==document.documentElement){
    const cs=getComputedStyle(el);
    const flagged = (cs.transform!=="none")||(cs.filter!=="none")||(cs.perspective!=="none")||(cs.willChange!=="auto")||(cs.contain!=="none")||(cs.backdropFilter&&cs.backdropFilter!=="none");
    out.push({
      tag: el.tagName, cls: (el.className||"").toString().slice(0,60),
      position: cs.position,
      transform: cs.transform, filter: cs.filter, willChange: cs.willChange, perspective: cs.perspective, contain: cs.contain,
      FLAG: flagged
    });
    el=el.parentElement;
  }
  const ov = overlay ? { cls:(overlay.className||"").toString(), pos:getComputedStyle(overlay).position, rect: (()=>{const b=overlay.getBoundingClientRect();return{top:Math.round(b.top),left:Math.round(b.left),w:Math.round(b.width),h:Math.round(b.height)};})() } : null;
  return { overlay: ov, ancestors: out };
});
console.log(JSON.stringify(walk,null,2));
await b.close();
