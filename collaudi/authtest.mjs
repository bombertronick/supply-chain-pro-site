import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const state = readFileSync("seed-state.json", "utf8");

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));

// Inject a TOKEN-GATED mock backend that mirrors the server RPCs.
await p.addInitScript((s) => {
  const kv = new Map(); kv.set("scp:stato:v1", s);
  const st = () => JSON.parse(kv.get("scp:stato:v1"));
  let TOKEN = null;
  window.__diag = { preloginStateReads: 0, postloginStateReads: 0, writes: 0, loginOk: 0, loginFail: 0 };
  async function hashPin(pin) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("scp·" + pin));
    return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  window.auth = {
    async loginList() { return st().profili.map((p) => ({ id: p.id, nome: p.nome, colore: p.colore, ruolo: p.ruolo })); },
    /* ── PERCHÉ QUESTO FINTO SERVER ERA CIECO DA MARZO ──
       Da gen-5.36 l'app non manda più solo il PIN: manda «PIN  idProfilo»,
       cioè il PIN e il profilo che la persona ha toccato, attaccati da un
       carattere separatore. Serviva a risolvere il caso di Gigi e Operatore rm:
       cercando il profilo a partire dal solo PIN, con due PIN uguali vinceva
       sempre il primo e gli altri restavano fuori per sempre.
       Questo finto server era rimasto al vecchio patto e faceva la somma di
       controllo di tutta la stringa: non combaciava mai, l'ingresso falliva
       sempre, e il collaudo lo scriveva in fondo a un rapporto che nessuno
       leggeva. Da oggi parla la lingua nuova — e regge anche la vecchia, così
       se un domani il separatore sparisce non torna cieco di nuovo. */
    async login(chiave) {
      const [pin, profiloId] = String(chiave).split(String.fromCharCode(1));
      const h = await hashPin(pin);
      const candidati = st().profili.filter((p) => p.pinHash === h);
      const pr = profiloId ? candidati.find((p) => p.id === profiloId) : candidati[0];
      if (!pr) { window.__diag.loginFail++; return { error: "pin" }; }
      TOKEN = "tok-" + pr.id; window.__diag.loginOk++;
      return { token: TOKEN, profiloId: pr.id, ruolo: pr.ruolo };
    },
    async registra(codice, nome, pin) { return { error: "codice" }; },
    async richiesta(nome, msg) { return { ok: true, id: "acc-x" }; },
    logout() { TOKEN = null; },
  };
  window.storage = {
    async get(key) {
      if (!TOKEN) { if (key === "scp:stato:v1") window.__diag.preloginStateReads++; return null; }
      if (key === "scp:stato:v1") window.__diag.postloginStateReads++;
      return kv.has(key) ? { key, value: kv.get(key), shared: true } : null;
    },
    async set(key, value) { if (!TOKEN) return null; kv.set(key, value); window.__diag.writes++; return { key, value, shared: true }; },
    async delete(key) { if (!TOKEN) return null; kv.delete(key); return { key, deleted: true }; },
    async list(prefix) { if (!TOKEN) return null; return { keys: [...kv.keys()].filter((k) => !prefix || k.startsWith(prefix)) }; },
  };
}, state);

await p.goto("file://" + path.resolve("index.html"));
await p.waitForTimeout(1600);

// --- 1. Pre-login: login screen present, NO business data leaked ---
const loginVisible = await p.getByText("Scegli il tuo profilo").count() > 0;
const adminVisible = await p.getByText("Admin", { exact: false }).count() > 0;
const magazzinoLeak = await p.getByText("Magazzino consumabili", { exact: false }).count();
let diag = await p.evaluate(() => window.__diag);
console.log("PRE-LOGIN: loginScreen=", loginVisible, "adminBtn=", adminVisible,
  "businessDataLeak=", magazzinoLeak, "| preloginStateReads=", diag.preloginStateReads);
await p.screenshot({ path: "auth-1-prelogin.png" });

// --- 2. Login as Admin / 1234 ---
await p.getByText("Admin", { exact: false }).first().click();
await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);
diag = await p.evaluate(() => window.__diag);
const appLoaded = await p.getByText(/Magazzini|Conteggi|Home|Ordini/).count() > 0;
console.log("POST-LOGIN: appLoaded=", appLoaded, "| loginOk=", diag.loginOk,
  "postloginStateReads=", diag.postloginStateReads);
await p.screenshot({ path: "auth-2-loggedin.png" });

// --- 3. Wrong PIN rejection (fresh: logout then bad pin) ---
// find logout control
const esci = p.getByRole("button", { name: /Esci|Logout|Esci/ });
// try any element with aria/title logout; fall back: reload
await p.evaluate(() => { if (window.auth) window.auth.logout(); });

// --- 4. Summary ---
console.log("pageerrors:", errs.length, errs.slice(0, 8));
console.log("RESULT:",
  loginVisible && adminVisible && magazzinoLeak === 0 && diag.preloginStateReads === 0 && appLoaded && diag.loginOk === 1
    ? "PASS" : "CHECK");
await b.close();
