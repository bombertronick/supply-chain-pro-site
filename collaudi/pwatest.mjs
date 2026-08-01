/* L'APP INSTALLATA SUL TELEFONO.

   Era una sonda: stampava il contenuto di <head> e usciva col verde qualunque
   cosa ci fosse scritto — anche «undefined» dappertutto. Ora controlla.

   Quello che c'e' qui dentro si rompe in silenzio piu' di ogni altra cosa:
   nessuno se ne accorge finche' qualcuno non aggiunge l'app alla schermata
   Home e si ritrova un rettangolo bianco senza nome, oppure la barra in basso
   finita sotto la tacca dell'iPhone. Non da' errore, non da' schermata rossa:
   funziona tutto, e' solo inservibile. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const state = readFileSync("seed-state.json", "utf8");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 900 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await p.addInitScript((s) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  const m = new Map(); m.set("scp:stato:v1", s);
  window.storage = {
    async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
    async set(k, v) { m.set(k, v); return true; },
    async delete(k) { m.delete(k); return true; },
  };
}, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1400);

/* ═══ 1. LA TESTA DEL DOCUMENTO ═══ */
console.log("\n— 1. cosa dichiara la pagina —");
const head = await p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  return {
    viewport: q('meta[name="viewport"]')?.content || "",
    theme: q('meta[name="theme-color"]')?.content || "",
    appleCapable: q('meta[name="apple-mobile-web-app-capable"]')?.content || "",
    appleTitle: q('meta[name="apple-mobile-web-app-title"]')?.content || "",
    appleIcon: q('link[rel="apple-touch-icon"]')?.href || "",
    favicon: q('link[rel="icon"]')?.href || "",
    manifestHref: q('link[rel="manifest"]')?.href || "",
  };
});
ok(/viewport-fit=cover/.test(head.viewport),
  "«viewport-fit=cover»: la pagina si prende anche i bordi tondi e la tacca");
ok(/^#[0-9A-Fa-f]{6}$/.test(head.theme), `il colore della barra di sistema e' dichiarato (${head.theme})`);
ok(head.appleCapable === "yes", "su iPhone parte a schermo intero, senza la barra di Safari");
ok(head.appleTitle === "Supply Chain Pro", `il nome sotto l'icona e' «${head.appleTitle}», non l'indirizzo del sito`);
/* le icone devono essere dentro il file: l'app gira anche senza rete, e
   un'icona presa da fuori sarebbe un quadrato vuoto proprio quando serve */
ok(head.appleIcon.startsWith("data:image/png"), "l'icona iPhone e' dentro il file, non la va a prendere in rete");
ok(head.favicon.startsWith("data:image/png"), "e cosi' quella della scheda del browser");
ok(head.manifestHref.startsWith("blob:"), "il manifesto e' costruito al volo, senza chiedere niente al server");

/* ═══ 2. IL MANIFESTO ═══ */
console.log("\n— 2. cosa dice il manifesto —");
const man = await p.evaluate(async () => {
  const l = document.querySelector('link[rel="manifest"]');
  if (!l) return null;
  const j = await (await fetch(l.href)).json();
  return { name: j.name, short: j.short_name, display: j.display,
    nIcons: j.icons?.length || 0, tipi: (j.icons || []).map((i) => i.type),
    misure: (j.icons || []).map((i) => i.sizes), theme: j.theme_color, bg: j.background_color };
});
ok(!!man, "il manifesto c'e' e si legge");
ok(man?.name === "Supply Chain Pro", `si chiama «${man?.name}»`);
ok(man?.display === "standalone", "si apre come un'app, non dentro il browser");
ok((man?.nIcons || 0) >= 2, `porta ${man?.nIcons} icone: una piccola e una grande (${(man?.misure || []).join(", ")})`);
ok((man?.tipi || []).every((t) => t === "image/png"), "tutte PNG: le capiscono sia iPhone sia Android");
ok(man?.theme === head.theme,
  "il colore del manifesto e quello della pagina dicono la stessa cosa: altrimenti la barra cambia colore all'avvio");

/* ═══ 3. LA TACCA E LA BARRA IN BASSO ═══ */
console.log("\n— 3. lo spazio dei bordi —");
const st = await p.evaluate(() => {
  const h = document.querySelector("header");
  const nav = document.querySelector('nav[aria-label="Navigazione principale"]');
  return { header: h?.style?.paddingTop || "", nav: nav?.style?.bottom || "" };
});
ok(/env\(safe-area-inset-top\)/.test(st.header),
  "l'intestazione si scansa dalla tacca (" + st.header + ")");
ok(/env\(safe-area-inset-bottom\)/.test(st.nav),
  "la barra dei tasti sta sopra la strisciolina dell'iPhone (" + st.nav + ")");

ok(errs.length === 0, "nessun errore di pagina" + (errs.length ? ": " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
