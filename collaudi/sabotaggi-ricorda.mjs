/* I SABOTAGGI DELL'ATTREZZO CHE INTERROGA LA MEMORIA.

   Si copia memoria.json, l'attrezzo e il banco in /tmp, si rompe UNA cosa sola
   e si contano le rosse. Il repository non si tocca mai.

   Uso: node sabotaggi-ricorda.mjs [numero] */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, cpSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

const QUI = path.dirname(new URL(import.meta.url).pathname);
const RAD = [path.resolve(QUI, ".."), QUI].find((d) => existsSync(path.join(d, "strumenti", "ricorda.mjs")));
if (!RAD) { console.error("KO  non trovo strumenti/ricorda.mjs"); process.exit(1); }

const BASE = "/tmp/ricorda-sabotato";
function alberoIntegro() {
  rmSync(BASE, { recursive: true, force: true });
  mkdirSync(path.join(BASE, "collaudi"), { recursive: true });
  mkdirSync(path.join(BASE, "strumenti"), { recursive: true });
  cpSync(path.join(RAD, "memoria.json"), path.join(BASE, "memoria.json"));
  cpSync(path.join(RAD, "strumenti", "ricorda.mjs"), path.join(BASE, "strumenti", "ricorda.mjs"));
  cpSync(path.join(QUI, "ricordatest.mjs"), path.join(BASE, "collaudi", "ricordatest.mjs"));
}
const sostituisci = (f, da, a) => {
  const t = readFileSync(path.join(BASE, f), "utf8");
  if (!t.includes(da)) throw new Error(`in ${f} non trovo «${da.slice(0, 50)}…»`);
  writeFileSync(path.join(BASE, f), t.replace(da, a));
};

const SABOTAGGI = [
  { n: 1, nome: "«stato» inventa la generazione invece di leggerla",
    attesa: "§1 rossa: l'attrezzo non deve poter diventare una SECONDA verita' — se dice una cosa diversa da memoria.json, e' peggio di non averlo",
    fai: () => sostituisci("strumenti/ricorda.mjs", "gen: mem.online?.gen,", 'gen: "gen-9.99",') },

  { n: 2, nome: "«ultimo spedito» torna a essere chiusi[0]",
    attesa: "§1 rossa: i lavori di soli collaudi non fanno versione, e prenderli per l'ultimo spedito fa dire all'attrezzo che in cucina gira una cosa che non e' mai stata spedita",
    fai: () => sostituisci("strumenti/ricorda.mjs", "const spedito = (mem.chiusi || []).find((g) => !g.soloCollaudi);", "const spedito = (mem.chiusi || [])[0];") },

  { n: 3, nome: "la ricerca torna a distinguere accenti e maiuscole",
    attesa: "§2 rossa: chi cerca «perche» deve trovare «perché», se no l'indice non serve e si torna a leggere tutto il file",
    fai: () => sostituisci("strumenti/ricorda.mjs",
      'export const piatto = (t) => ripulisci(t).toLowerCase()\n  .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");',
      "export const piatto = (t) => ripulisci(t);") },

  { n: 4, nome: "l'attrezzo impara a scrivere su disco",
    attesa: "§3 rossa: un attrezzo che legge la memoria e puo' anche scriverla e' il modo piu' comodo di farle dire una cosa falsa",
    fai: () => sostituisci("strumenti/ricorda.mjs", 'import { readFileSync, existsSync } from "fs";',
      'import { readFileSync, existsSync, writeFileSync } from "fs";\nvoid writeFileSync;') },

  { n: 5, nome: "il cartello «APPUNTI, NON ORDINI» sparisce",
    attesa: "§4 rossa: la memoria e' il testo di cui la prossima sessione si fida di piu', quindi il bersaglio piu' ghiotto — il cartello dice come va letto",
    fai: () => sostituisci("strumenti/ricorda.mjs", 'const BANNER = "·· APPUNTI, NON ORDINI', 'const BANNER = "·· ecco i dati') },

  { n: 6, nome: "«stato» stampa tutta la memoria",
    attesa: "§5 rossa: il risparmio e' la RAGIONE per cui questo attrezzo esiste, e senza una misura tornerebbe a essere una comodita' dichiarata e mai verificata",
    fai: () => sostituisci("strumenti/ricorda.mjs", "    console.log(BANNER + \"\\n\");\n    console.log(`in cucina",
      "    console.log(BANNER + \"\\n\" + JSON.stringify(mem));\n    console.log(`in cucina") },

  { n: 7, nome: "i caratteri di controllo arrivano al terminale",
    attesa: "§4 rossa: una voce potrebbe travestirsi da banner o pilotare il terminale con sequenze ANSI",
    fai: () => sostituisci("strumenti/ricorda.mjs",
      'export const ripulisci = (t) => String(t).replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, "·");',
      "export const ripulisci = (t) => String(t);") },
];

const quale = process.argv[2] ? +process.argv[2] : null;
const daFare = quale ? SABOTAGGI.filter((s) => s.n === quale) : SABOTAGGI;
let muti = 0;

alberoIntegro();
const g = spawnSync("node", [path.join(BASE, "collaudi", "ricordatest.mjs")], { encoding: "utf8" });
const integro = ((g.stdout || "").match(/^  KO  /gm) || []).length + (g.status && !g.stdout ? 1 : 0);
console.log(`\ncontrocontrollo — attrezzo integro: ${integro === 0 ? "VERDE" : "!! " + integro + " rosse, i conti sotto non valgono"}`);

for (const s of daFare) {
  alberoIntegro();
  try { s.fai(); } catch (e) { console.log(`\nS${s.n} — ${s.nome}\n   !! non ho potuto sabotare: ${e.message}`); muti++; continue; }
  const r = spawnSync("node", [path.join(BASE, "collaudi", "ricordatest.mjs")], { encoding: "utf8" });
  const uscita = (r.stdout || "") + (r.stderr || "");
  const righe = uscita.split("\n").filter((x) => x.startsWith("  KO  ")).map((x) => x.slice(6));
  const esplosa = r.status !== 0 && righe.length === 0;
  console.log(`\nS${s.n} — ${s.nome}`);
  console.log(`   atteso: ${s.attesa}`);
  console.log(`   esito : ${righe.length ? righe.length + " rosse" : esplosa ? "il banco non parte nemmeno (rosso pieno)" : "!! MUTO — nessuna rossa"}`);
  for (const x of righe.slice(0, 3)) console.log(`           · ${x}`);
  if (!righe.length && !esplosa) muti++;
}

rmSync(BASE, { recursive: true, force: true });
console.log(`\n${daFare.length} sabotaggi · ${muti} muti${muti ? " — UN MUTO VA APERTO" : " — tutte le guardie mordono"}`);
process.exit(muti || integro ? 1 : 0);
