/* La memoria non deve poter invecchiare in silenzio.

   IL FATTO CHE HA FATTO NASCERE QUESTO FILE. Il 3 agosto ho corretto il
   doppio conteggio in gen-5.76. Non ho tolto la voce dalla lista da
   scegliere. Il 4 agosto Valerio l'ha scelta, e ha speso una scelta — una
   delle tre che mi da' per volta — per un lavoro gia' online.

   La lezione NON e' «serve un archivio piu' robusto». La roadmap era in
   git, integra, ricommittata a ogni generazione: non si era persa niente.
   Era diventata FALSA. Un posto piu' sicuro dove tenerla non avrebbe
   cambiato una virgola, perche' il problema non era il ricordo, era che
   nessuno lo rileggeva contro la realta'.

   Quello che serviva era qualcosa che DIVENTA ROSSO. Questo file.

   Regge su un principio solo: la roadmap (per Valerio, in prosa) e
   memoria.json (per la macchina) dicono la stessa cosa in due lingue. Se
   le due lingue smettono di combaciare, una delle due sta mentendo, e non
   si sa quale — quindi si ferma tutto. E' scomodo di proposito: la
   scomodita' e' l'unico modo che ho di ricordarmene. */
import { readFileSync } from "fs";
import { chromium } from "playwright";
import { existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* La radice si cerca invece di darla per scontata: in CI questo file gira da
   «collaudi/» e la roadmap sta un piano sopra, sul banco di prova invece sono
   affiancati. Dare per buono uno dei due voleva dire un rosso che parla della
   posizione dei file e non di quello che il collaudo deve dire. */
const QUI = path.dirname(new URL(import.meta.url).pathname);
const RAD = [path.resolve(QUI, ".."), QUI, path.resolve(".."), path.resolve(".")]
  .find((d) => existsSync(path.join(d, "memoria.json")) && existsSync(path.join(d, "roadmap.html")));
if (!RAD) { console.error("KO  non trovo memoria.json e roadmap.html: cercati accanto a " + QUI); process.exit(1); }
const mem = JSON.parse(readFileSync(path.join(RAD, "memoria.json"), "utf8"));
/* i collaudi stanno in «collaudi/» nel repository e affiancati sul banco */
const provaC_e = (f) => existsSync(path.join(RAD, "collaudi", f)) || existsSync(path.join(RAD, f));

/* ═══ 1. LE DUE LINGUE DICONO LE STESSE VOCI ═══ */
console.log("\n— 1. la roadmap e la memoria elencano le stesse voci —");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + path.join(RAD, "roadmap.html"));
await p.waitForTimeout(400);
const inPagina = await p.evaluate(() => ({
  difetti: [...document.querySelectorAll("#lista-difetti .voce")].map((x) => x.dataset.id),
  altro: [...document.querySelectorAll("#lista-altro .voce")].map((x) => x.dataset.id),
  cucina: (document.querySelector(".stato dd")?.textContent || "").match(/gen-5\.\d+/)?.[0] || null,
}));
const vistiInPagina = [...inPagina.difetti, ...inPagina.altro].sort();
const vistiInMemoria = mem.aperti.map((v) => v.id).sort();
ok(JSON.stringify(vistiInPagina) === JSON.stringify(vistiInMemoria),
  `stesse voci di qua e di la' (pagina ${vistiInPagina.length}, memoria ${vistiInMemoria.length})`);
if (JSON.stringify(vistiInPagina) !== JSON.stringify(vistiInMemoria)) {
  console.log("      solo in pagina:", vistiInPagina.filter((x) => !vistiInMemoria.includes(x)));
  console.log("      solo in memoria:", vistiInMemoria.filter((x) => !vistiInPagina.includes(x)));
}
/* anche i due elenchi separati, se no una voce puo' passare da un lato
   all'altro senza che nessuno se ne accorga */
for (const dove of ["difetti", "altro"])
  ok(JSON.stringify(inPagina[dove].sort()) ===
     JSON.stringify(mem.aperti.filter((v) => v.dove === dove).map((v) => v.id).sort()),
    `e stanno nello stesso elenco («${dove}»)`);

/* ═══ 2. IL CONTROLLO CHE SAREBBE SERVITO IL 3 AGOSTO ═══
   Niente puo' essere allo stesso tempo «gia' chiuso» e «ancora da
   scegliere». E' esattamente quello che era successo: doppia-richiesta
   chiusa da gen-5.76 e ancora nella lista da scegliere il giorno dopo. */
console.log("\n— 2. niente e' insieme «gia' fatto» e «ancora da scegliere» —");
const chiusi = new Set(mem.chiusi.flatMap((g) => g.chiude));
const zombi = mem.aperti.map((v) => v.id).filter((id) => chiusi.has(id));
ok(zombi.length === 0,
  zombi.length ? `VOCI GIA' ONLINE ANCORA NELLA LISTA: ${zombi.join(", ")}` :
                 `nessuna voce zombi (${chiusi.size} chiuse, ${mem.aperti.length} aperte)`);

/* ═══ 3. OGNI COSA CHIUSA PORTA IL NOME DELLA PROVA CHE LA REGGE ═══
   «Fatto» senza una prova che lo dimostri e' una promessa, non un fatto. */
console.log("\n— 3. ogni lavoro chiuso dice quale collaudo lo dimostra —");
let senzaProva = [];
for (const g of mem.chiusi) {
  if (!g.prova) { senzaProva.push(g.gen); continue; }
  if (!provaC_e(g.prova)) senzaProva.push(`${g.gen} (${g.prova} non c'e')`);
}
ok(senzaProva.length === 0,
  senzaProva.length ? `senza prova: ${senzaProva.join(", ")}` :
                      `tutti e ${mem.chiusi.length} hanno un collaudo che esiste`);

/* ═══ 4. LE VOCI APERTE: O UNA PROVA CHE C'È, O IL PERCHÉ NO ═══
   Una prova mancante e' ammessa — molte di queste voci sono cose che
   MANCANO, e l'assenza di una schermata mai specificata non si puo'
   dimostrare rossa. Quello che NON e' ammesso e' tacere sul perche'. */
console.log("\n— 4. le voci aperte o hanno la prova o dicono perche' no —");
const mute = mem.aperti.filter((v) => !v.prova && !v._prova_perche);
ok(mute.length === 0,
  mute.length ? `voci che non dicono perche' non hanno una prova: ${mute.map((v) => v.id).join(", ")}` :
                "nessuna voce muta");
const conProva = mem.aperti.filter((v) => v.prova);
for (const v of conProva)
  ok(provaC_e(v.prova), `«${v.id}» punta a ${v.prova}, che esiste`);
if (!conProva.length)
  console.log("  ··  oggi nessuna voce aperta ha ancora una prova scritta (e lo dichiara)");

/* ═══ 5. LA GENERAZIONE È LA STESSA NELLE DUE LINGUE ═══ */
console.log("\n— 5. la generazione in cucina e' la stessa di qua e di la' —");
ok(inPagina.cucina === mem.online.gen,
  `la roadmap dice «${inPagina.cucina}», la memoria «${mem.online.gen}»`);
/* Si guarda l'ultimo lavoro che ha SPEDITO qualcosa nell'app. I lavori sui
   collaudi chiudono voci della roadmap ma non fanno una versione nuova: se
   contassero anche loro, questo controllo diventerebbe rosso per un motivo
   che non c'entra niente con quello che gira in cucina. */
const ultimoSpedito = mem.chiusi.find((g) => !g.soloCollaudi);
ok(ultimoSpedito?.gen === mem.online.gen,
  `e l'ultimo lavoro spedito e' proprio quello online (${ultimoSpedito?.gen})`);
const soloColl = mem.chiusi.filter((g) => g.soloCollaudi);
ok(soloColl.every((g) => g._soloCollaudi_perche),
  `e i ${soloColl.length} lavori di soli collaudi dicono perche' non fanno versione`);

/* ═══ 6. QUELLO CHE HO SBAGLIATO RESTA SCRITTO ═══
   Se sparisce la riga, sparisce anche il motivo per cui non lo rifaccio. */
console.log("\n— 6. le cose che ho detto sbagliate restano scritte —");
ok(Array.isArray(mem.sbagliato) && mem.sbagliato.length > 0,
  `ci sono ${mem.sbagliato?.length || 0} correzioni annotate`);
ok(mem.sbagliato.every((c) => c.quando && c.dicevo && c.invece),
  "e ognuna dice quando, cosa dicevo e come stanno le cose");
ok(Array.isArray(mem.regole) && mem.regole.length >= 5,
  `e ${mem.regole?.length || 0} regole di Valerio su come lavorare`);

console.log("\nerrori di pagina:", errs.length);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
