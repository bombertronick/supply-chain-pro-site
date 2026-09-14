/* I PEZZI SI MANDANO A LOTTI, E I LOTTI SI SCRIVONO QUI (gen-6.18).

   Perche' esiste. `sql_spezza.mjs` taglia il rilascio in pezzi abbastanza
   piccoli da passare in una chiamata sola; per gen-6.18 sono sessantasette.
   Mandarne sessantasette uno per uno e' sessantasette occasioni di sbagliare
   ordine. A gen-6.17 li ho raggruppati A MANO in sette lotti — cioe' un po'
   diverso ogni volta, che e' esattamente la ragione per cui a gen-6.15 lo
   spezzettamento ha smesso di farsi a mano.

   LE DUE REGOLE CHE UN LOTTO NON PUO' VIOLARE, e sono la ragione del codice
   qui sotto invece di un banale «ogni otto»:
   1. un pezzo che CONTINUA il precedente (`set value = value || …`) non e'
      idempotente e non si puo' separare dal suo capofila: se il lotto prima
      arriva e quello dopo si rimanda, si raddoppia una tessera. Sta nello
      STESSO lotto del suo `insert`.
   2. il CANCELLO (il `select` che ricompone e confronta), lo SWAP, la META e
      il DELETE vanno mandati e LETTI uno per uno: `execute_sql` restituisce
      solo il risultato dell'ultimo statement, e li' il risultato di ognuno e'
      la cosa che si deve guardare. Un lotto per ciascuno, e mai insieme alle
      tessere.

   Uso: node sql_lotti.mjs <tag>-pezzi [pezzi per lotto]   (predefinito 8)
   Scrive <tag>-lotti/L1.sql … e dice cosa contiene ognuno. */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";

const dir = process.argv[2];
const perLotto = +(process.argv[3] || 8);
if (!dir) { console.error("Uso: node sql_lotti.mjs <tag>-pezzi [pezzi per lotto]"); process.exit(1); }

const nomi = readdirSync(dir).filter((f) => /^\d+\.sql$/.test(f)).sort();
if (!nomi.length) { console.error("nessun pezzo in " + dir); process.exit(1); }
const pezzi = nomi.map((f) => ({ f, testo: readFileSync(dir + "/" + f, "utf8") }));

const continua = (p) => /set value = value \|\|/.test(p.testo);
/* «da solo» = il cancello, lo swap, la meta, il delete: tutto cio' che NON e'
   una tessera temporanea da accumulare.
   E si riconosce dalla CHIAVE SCRITTA, non dalla presenza di «app:jsx:src»:
   ogni tessera che copia un pezzo del vecchio porta dentro
   `substr((select value … where key='app:jsx:src'), …)`, cioe' quella stringa
   sta in quasi tutti i pezzi. Prima cercavo li' e mi sono ritrovato 67 lotti
   da un pezzo l'uno — il contrario del lavoro. */
const tessera = (p) => /values\('tmp:/.test(p.testo) || continua(p);
const daSolo = (p) => !tessera(p);

const lotti = [];
let corrente = [];
const chiudi = () => { if (corrente.length) { lotti.push(corrente); corrente = []; } };
for (const p of pezzi) {
  if (daSolo(p)) { chiudi(); lotti.push([p]); continue; }
  /* la regola 1: un pezzo di continuazione non apre mai un lotto */
  if (corrente.length >= perLotto && !continua(p)) chiudi();
  corrente.push(p);
}
chiudi();

const out = dir.replace(/-pezzi$/, "-lotti");
if (existsSync(out)) rmSync(out, { recursive: true });
mkdirSync(out, { recursive: true });
lotti.forEach((l, i) => {
  writeFileSync(`${out}/L${i + 1}.sql`, l.map((p) => p.testo.trim()).join("\n\n") + "\n");
  console.log(`  L${i + 1}: ${l.length} pezzi (${l[0].f}${l.length > 1 ? "…" + l[l.length - 1].f : ""})`
    + (l.length === 1 && daSolo(l[0]) ? "  ← da leggere da solo" : ""));
});
console.log(`\n${pezzi.length} pezzi -> ${lotti.length} lotti in ${out}`);
console.log("Si mandano IN ORDINE, uno per chiamata, UNA VOLTA SOLA. L'audit sta a parte.");
