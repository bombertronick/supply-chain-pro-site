/* due cose viste negli screenshot di gen-5.50: le voci del menù in basso che
   si toccano fra loro, e i nomi dei prodotti tagliati dentro il magazzino.
   Qui si misurano, sui dati veri, prima di metterle in roadmap. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("stato-vero.json", "utf8"));
const s = { ...st, richieste: [], ordini: [], movimenti: [], log: [], codici: [], accessi: [],
  profili: [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }] };

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });

for (const W of [360, 390, 412]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
    window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
  }, JSON.stringify(s));
  const p = await ctx.newPage();
  await p.goto(URL); await p.waitForTimeout(1500);
  await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(150); }
  await p.waitForTimeout(1700);

  /* 1. il menù in basso */
  const nav = await p.evaluate(() => {
    const n = document.querySelector("nav");
    if (!n) return null;
    const voci = [...n.querySelectorAll("button, a")].map((el) => {
      const r = el.getBoundingClientRect();
      const t = (el.textContent || "").trim();
      return { t, x: Math.round(r.left), w: Math.round(r.width), dx: Math.round(r.right) };
    }).filter((v) => v.w > 0);
    /* etichette che si toccano: meno di 4px di aria fra una e l'altra */
    const vicine = [];
    for (let i = 1; i < voci.length; i++) {
      const gap = voci[i].x - voci[i - 1].dx;
      if (gap < 4) vicine.push(`«${voci[i - 1].t}»↔«${voci[i].t}» ${gap}px`);
    }
    const fuori = voci.filter((v) => v.dx > innerWidth + 1).map((v) => `«${v.t}»`);
    const scorre = n.scrollWidth > n.clientWidth + 1;
    return { n: voci.length, vicine, fuori, scorre, larghezze: voci.map((v) => v.w) };
  });
  console.log(`\n${W}px · menù in basso: ${nav.n} voci`);
  console.log(`   attaccate: ${nav.vicine.length ? nav.vicine.join(", ") : "nessuna"}`);
  console.log(`   fuori schermo: ${nav.fuori.length ? nav.fuori.join(", ") : "nessuna"}${nav.scorre ? " (la barra scorre)" : ""}`);

  /* 2. i nomi dentro il magazzino */
  await p.locator("nav").getByText("Magazzini", { exact: true }).first().click(); await p.waitForTimeout(1200);
  /* apro davvero la scheda di un magazzino: è lì che si vedevano i nomi mozzi */
  const nomeMag = s.magazzini.find((m) => (m.articoli || []).length > 6)?.nome;
  await p.getByText(nomeMag, { exact: true }).first().click();
  await p.waitForTimeout(1500);
  /* srotolo il primo gruppo di categoria, se ce n'è */
  const g = p.locator('button[aria-expanded="false"]');
  if (await g.count()) { await g.first().click(); await p.waitForTimeout(700); }
  console.log(`   scheda aperta: «${nomeMag}»`);
  const tag = await p.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("div,span")) {
      if (el.children.length) continue;
      const s = getComputedStyle(el);
      if (s.textOverflow !== "ellipsis" && !el.className.includes("truncate")) continue;
      if (el.scrollWidth > el.clientWidth + 1) {
        out.push(`«${(el.textContent || "").trim()}» ${el.clientWidth}px per ${el.scrollWidth}px`);
      }
    }
    return [...new Set(out)].slice(0, 8);
  });
  console.log(`   nomi tagliati nel magazzino: ${tag.length}`);
  for (const t of tag) console.log("      " + t);
  await p.screenshot({ path: `dbg550-${W}.png`, fullPage: false });
  await ctx.close();
}
await b.close();
