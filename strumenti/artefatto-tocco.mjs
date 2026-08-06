/* La copia pubblicata viene infilata dentro <!doctype><head></head><body>…
   dall'involucro. Qui la impacchetto allo stesso modo e provo a toccarla. */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "fs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const dentro = readFileSync("/tmp/claude-0/-home-user-supply-chain-pro-site/3b7a9078-a41a-5f7a-b2a3-6994efdba952/scratchpad/scegli-lavori-589.html", "utf8");
writeFileSync("/tmp/wrapped.html",
  `<!doctype html><html><head><meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1">
   <style>*,*::before,*::after{box-sizing:border-box}body{margin:0}</style>
   </head><body>${dentro}</body></html>`);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file:///tmp/wrapped.html"); await p.waitForTimeout(800);

ok(await p.locator(".voce").count() === 7, `ci sono le 7 voci (${await p.locator(".voce").count()})`);
const alto = await p.evaluate(() => document.documentElement.scrollHeight);
const fin = await p.evaluate(() => innerHeight);
ok(alto > fin * 2, `la pagina è più lunga dello schermo (${alto} su ${fin})`);
await p.mouse.move(195, 400); await p.mouse.wheel(0, 2000); await p.waitForTimeout(400);
const sceso = await p.evaluate(() => (document.scrollingElement || document.documentElement).scrollTop);
ok(sceso > 500, `scorre col dito (${sceso}px)`);

/* IL PUNTO: si tocca? */
await p.locator(".voce").nth(2).click(); await p.waitForTimeout(300);
const n = (await p.locator(".voce").nth(2).locator(".num").innerText()).trim();
ok(n === "1", `toccando la terza voce prende il numero 1 (dice «${n}»)`);
await p.locator(".voce").nth(0).click(); await p.waitForTimeout(300);
const n2 = (await p.locator(".voce").nth(0).locator(".num").innerText()).trim();
ok(n2 === "2", `e la prima diventa 2 (dice «${n2}»)`);
const msg = await p.locator("#msg").inputValue();
ok(/1\. /.test(msg) && /2\. /.test(msg), "e il messaggio da copiare si è riempito");
ok(!(await p.locator("#copia").isDisabled()), "il tasto Copia è acceso");
ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await p.screenshot({ path: "/tmp/art.png", fullPage: false });
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nSI TOCCA");
