/* ── IL CANCELLO DEI DOCUMENTI: nessuna verità parallela ──

   PERCHÉ ESISTE, e sono fatti misurati il 16 settembre, non timori.

   In questa casa gli stessi tre numeri — la lunghezza del sorgente, la sua
   impronta md5 e il nome della generazione — sono ricopiati A MANO in QUATTRO
   posti (PASSAGGIO.md, memoria.json→online, la frase «PRODUZIONE: len N, md5
   HEX» dentro memoria.json→chiusi[0].cosa, e roadmap.html). Nessuno strumento
   li genera. L'unico controllo che ne guardava due — memoriatest §5 — confronta
   DUE COPIE SCRITTE DALLA STESSA MANO, non la sorgente: se chi ricopia sbaglia
   nello stesso modo in tutti e due i posti, resta verde.

   E il giorno in cui è nato questo file, il ricopiato era già sbagliato in un
   punto che conta più di tutti: il «primo messaggio da incollare nella sessione
   nuova», in cima a PASSAGGIO.md, mandava a leggere il checkpoint di dispensa
   `chk-20260915-sera` — che quattordici righe più sotto lo stesso documento
   dichiara essere il PENULTIMO. Una sessione nuova che eseguiva quel messaggio
   alla lettera ripartiva dallo stato della generazione PRECEDENTE, e non se ne
   accorgeva nessuno perché nessuno confrontava le due righe.

   Non è «serve un documento più ordinato». La roadmap era ordinata e integra
   anche il giorno in cui è diventata falsa (è la lezione scritta in cima a
   memoriatest.mjs). Quello che serve è qualcosa che DIVENTA ROSSO. Questo file.

   LA REGOLA CHE LO GOVERNA: la sorgente è `app/app.jsx`, e basta. Ogni
   documento che ripete uno dei suoi numeri sta facendo una DICHIARAZIONE, e
   una dichiarazione si verifica. Qui non si verifica un documento contro un
   altro documento: si verifica ogni documento contro la cosa.

   COSA NON PUÒ FARE, dichiarato: non parla con la produzione. Il proxy blocca
   *.supabase.co e questo file gira anche nella CI di GitHub, dove una chiave
   non ci sarà mai. Verifica che i DOCUMENTI dicano quello che dice
   `app/app.jsx`; che `app/app.jsx` sia identico alla produzione lo dimostra il
   cancello md5 del rilascio, e quello vive dentro una sessione. Sono due
   cancelli diversi e servono tutti e due. */
import { readFileSync, existsSync, readdirSync } from "fs";
import { createHash } from "crypto";
import path from "path";

let ko = 0;
const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* la radice si cerca, non si dà per scontata: in CI si gira da «collaudi/»,
   sul banco i file sono affiancati (stessa ragione scritta in memoriatest) */
const QUI = path.dirname(new URL(import.meta.url).pathname);
const RAD = [path.resolve(QUI, ".."), QUI, path.resolve(".."), path.resolve(".")]
  .find((d) => existsSync(path.join(d, "PASSAGGIO.md")) && existsSync(path.join(d, "app", "app.jsx")));
if (!RAD) { console.error("KO  non trovo PASSAGGIO.md e app/app.jsx: cercati accanto a " + QUI); process.exit(1); }
const leggi = (f) => readFileSync(path.join(RAD, f), "utf8");
const c_e = (f) => existsSync(path.join(RAD, f));

/* ═══ 1. LA SORGENTE — è lei la verità, e si misura ═══ */
console.log("\n— 1. la sorgente: quello che app/app.jsx è davvero —");
const src = leggi("app/app.jsx");
const VERO = {
  len: src.length,
  md5: createHash("md5").update(src, "utf8").digest("hex"),
  ver: (src.match(/const VERSIONE = "([^"]+)"/) || [])[1],
};
ok(!!VERO.ver, `app.jsx dichiara una VERSIONE («${VERO.ver}»)`);
ok(/^gen-\d+\.\d+$/.test(VERO.ver || ""), `ed è scritta nella forma di casa, gen-N.NN`);
console.log(`      len ${VERO.len} · md5 ${VERO.md5} · ${VERO.ver}`);

/* la prima regola del caricatore, quella che spegne l'app per tutti:
   zero caratteri fuori dal piano base. Costa un giro sul file e va fatta qui,
   perché a mano è un passo che si può dimenticare e non lo dice nessuno. */
let astrali = 0, primoAstrale = null;
for (const c of src) if (c.codePointAt(0) > 0xFFFF) { astrali++; if (!primoAstrale) primoAstrale = c; }
ok(astrali === 0, `zero caratteri astrali${astrali ? ` — ce ne sono ${astrali}, il primo è «${primoAstrale}»: IL CARICATORE RIFIUTA` : ""}`);

/* ═══ 2. LE DICHIARAZIONI COMBACIANO CON LA SORGENTE ═══ */
console.log("\n— 2. i quattro posti che ripetono quei numeri a mano —");
const P = leggi("PASSAGGIO.md");
const mP = P.match(/\*\*Produzione\*\*:\s*(gen-\d+\.\d+),\s*`app:jsx:src`\s*len\s*(\d+),\s*md5\s*\n?\s*`([a-f0-9]{32})`/);
ok(!!mP, "PASSAGGIO.md dichiara produzione, len e md5 nella forma attesa");
if (mP) {
  ok(mP[1] === VERO.ver, `PASSAGGIO.md → versione (dice ${mP[1]})`);
  ok(+mP[2] === VERO.len, `PASSAGGIO.md → len (dice ${mP[2]})`);
  ok(mP[3] === VERO.md5, `PASSAGGIO.md → md5 (dice ${mP[3].slice(0, 8)}…)`);
}
/* il meta è la SECONDA regola del caricatore: len in caratteri, non in byte */
const mMeta = P.match(/meta\s*`?\{"len":(\d+),"ver":"(gen-\d+\.\d+)"\}`?/);
ok(!!mMeta, "PASSAGGIO.md dichiara il meta del caricatore");
if (mMeta) {
  ok(+mMeta[1] === VERO.len, `il meta dichiara la len vera (dice ${mMeta[1]})`);
  ok(mMeta[2] === VERO.ver, `e la versione vera (dice ${mMeta[2]})`);
}

const mem = JSON.parse(leggi("memoria.json"));
ok(mem.online?.len === VERO.len, `memoria.json → online.len (dice ${mem.online?.len})`);
ok(mem.online?.md5 === VERO.md5, `memoria.json → online.md5 (dice ${String(mem.online?.md5).slice(0, 8)}…)`);
/* NON chiusi[0], ma l'ultimo lavoro che ha SPEDITO qualcosa: i lavori di soli
   collaudi (soloCollaudi) chiudono voci ma non fanno una versione nuova, e la
   frase «PRODUZIONE» non ce l'hanno — e' la stessa regola di memoriatest §5.
   Scritto prima che mordesse: il primo lavoro soloCollaudi che finiva in testa
   avrebbe reso questa sezione rossa senza che niente fosse sbagliato. */
const spedito = (mem.chiusi || []).find((g) => !g.soloCollaudi);
const c0 = spedito?.cosa || "";
const mM = c0.match(/PRODUZIONE: len (\d+), md5 ([a-f0-9]{32})/);
ok(!!mM, `memoria.json → l\u0027ultimo lavoro spedito (${spedito?.gen}) porta la frase «PRODUZIONE: len N, md5 HEX»`);
if (mM) {
  ok(+mM[1] === VERO.len, `e la sua len è quella vera (dice ${mM[1]})`);
  ok(mM[2] === VERO.md5, `e la sua md5 è quella vera (dice ${mM[2].slice(0, 8)}…)`);
}
const R = leggi("roadmap.html");
const cucina = (R.match(/<dt>In cucina<\/dt>\s*<dd><b>(gen-\d+\.\d+)<\/b>/) || [])[1];
ok(cucina === VERO.ver, `roadmap.html → «In cucina» (dice ${cucina})`);

/* ═══ 3. IL PUNTATORE DELLA DISPENSA ═══
   Le due righe stanno nello stesso file a quaranta righe di distanza e
   dicevano due voci diverse. È il difetto che ha fatto nascere questo banco. */
console.log("\n— 3. il primo messaggio manda a leggere l'ULTIMO checkpoint —");
const daIncollare = (P.match(/## Il primo messaggio da incollare[\s\S]*?(?=\n## )/) || [""])[0];
const vociCitate = [...daIncollare.matchAll(/`(chk-[a-z0-9-]+)`/g)].map((m) => m[1]);
const ultimaDichiarata = (P.match(/\*\*Dispensa\*\*:[^`]*`(chk-[a-z0-9-]+)`/) || [])[1];
ok(vociCitate.length > 0, `il messaggio nomina un checkpoint (${vociCitate.join(", ") || "NESSUNO"})`);
ok(!!ultimaDichiarata, `la sezione Dispensa dichiara qual è l'ultimo (${ultimaDichiarata})`);
ok(vociCitate.includes(ultimaDichiarata),
  `e sono LO STESSO: il messaggio dice «${vociCitate[0]}», la sezione dice «${ultimaDichiarata}»`);

/* ═══ 4. IL DOCUMENTO DEL RILASCIO ESISTE ═══
   .gitignore:34-36 lo impone con parole sue: «Il .sql invece SI salva — è il
   documento di cosa è stato spedito in produzione, e va riletto anni dopo».
   Per gen-6.20 e gen-6.21 non era stato fatto, e non lo diceva nessuno. */
console.log("\n— 4. il .sql di questa generazione è conservato —");
const tag = "gen" + (VERO.ver || "").replace("gen-", "").replace(".", "");
const fSql = path.join("strumenti", tag + ".sql");
ok(c_e(fSql), `${fSql} esiste`);
if (c_e(fSql)) {
  const sql = leggi(fSql);
  ok(sql.includes(VERO.md5), `e il suo cancello nomina la md5 di arrivo vera`);
  ok(/^-- gen\d+: \d+ zone cambiate, \d+ tessere/m.test(sql), `e porta in testa il conto di zone e tessere`);
}

/* ═══ 5. IL CENSIMENTO DI QUESTA GENERAZIONE È SCRITTO ═══ */
console.log("\n— 5. il censimento di questa generazione è registrato —");
const rigaCens = P.split("\n").find((r) => r.includes(VERO.ver) && /verdi/.test(r));
ok(!!rigaCens, `PASSAGGIO.md porta la riga di censimento di ${VERO.ver}`);
if (rigaCens) {
  const n = rigaCens.match(/(\d+) verdi \/ (\d+) controlli/);
  ok(!!n, `e dice quanti verdi e quanti controlli (${n ? n[1] + " / " + n[2] : "non si capisce"})`);
}

/* ═══ 6. NESSUN DOCUMENTO DICHIARA UNA GENERAZIONE CHE NON ESISTE PIÙ ═══
   Un documento può parlare del passato: deve solo DIRLO, in cima, con le
   parole «DOCUMENTO STORICO». Quello che non può fare è dire al presente una
   cosa falsa, perché è la prima cosa che legge chi riparte. */
console.log("\n— 6. nessun documento si dichiara allineato a una generazione morta —");
const MARCA = "DOCUMENTO STORICO";
for (const f of ["PASSAGGIO.md", "CONSEGNA.md", "README.md"]) {
  if (!c_e(f)) continue;
  const t = leggi(f);
  const storico = t.split("\n").slice(0, 15).join("\n").includes(MARCA);
  const pretese = [
    ...t.matchAll(/allineat[ao]\s+a\s*\n?\s*(gen-\d+\.\d+)/gi),
    ...t.matchAll(/\*\*In produzione:\s*(gen-\d+\.\d+)/gi),
  ].map((m) => m[1]);
  const sbagliate = [...new Set(pretese.filter((g) => g !== VERO.ver))];
  /* il messaggio deve dire la verita' ANCHE quando e' verde: una riga verde che
     racconta il caso rosso e' un modo di smettere di leggere i rapporti */
  const perche = sbagliate.length === 0 ? "nessuna pretesa scaduta"
    : storico ? `nomina ${sbagliate.join(", ")}, ma porta il cartello «${MARCA}»: parla del passato e lo dichiara`
    : `dice di essere allineato a ${sbagliate.join(", ")} e NON porta il cartello «${MARCA}»`;
  ok(storico || sbagliate.length === 0, `${f}: ${perche}`);
}

/* ═══ 7. LA BUSSOLA ═══
   Il 16 settembre questo repository non aveva nessun CLAUDE.md, e quello che
   una sessione si trova iniettato descrive un ALTRO repository, superato, che
   non nomina mai questo. Una sessione nuova, senza qualcuno che glielo dica,
   lavora sul progetto sbagliato. */
console.log("\n— 7. chi arriva trova la bussola —");
ok(c_e("CLAUDE.md"), "esiste un CLAUDE.md nella radice del repository");
if (c_e("CLAUDE.md")) {
  const C = leggi("CLAUDE.md");
  ok(C.includes("PASSAGGIO.md"), "e manda a PASSAGGIO.md");
  ok(C.includes("app/app.jsx"), "e nomina la sorgente vera, app/app.jsx");
  ok(!/src\/app\.jsx/.test(C), "e NON nomina src/app.jsx, che è il repository superato");
}

/* ═══ 8. I BANCHI CHE ESISTONO SONO QUELLI CHE IL CENSIMENTO CONTA ═══ */
console.log("\n— 8. il conto dei banchi —");
const dirColl = existsSync(path.join(RAD, "collaudi")) ? path.join(RAD, "collaudi") : RAD;
const banchi = readdirSync(dirColl).filter((f) => /test\.mjs$/.test(f) && !["navtest.mjs", "render-test.mjs"].includes(f));
ok(banchi.length > 0, `${banchi.length} banchi sul disco`);
ok(banchi.includes("coerenzatest.mjs"), "e questo file è fra quelli che il censimento raccoglie");

console.log(`\n${ko ? "!! " + ko + " rosse" : "tutto verde"} — ${ko ? "coerenza ROTTA" : "i documenti dicono quello che dice la sorgente"}`);
process.exit(ko ? 1 : 0);
