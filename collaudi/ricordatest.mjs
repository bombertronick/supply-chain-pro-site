/* ── CHIEDERE ALLA MEMORIA: il banco ──

   `strumenti/ricorda.mjs` esiste per una misura, non per un'idea: una sessione
   che riparte spende ~74.000 token di documenti prima di fare qualsiasi cosa, e
   memoria.json da sola ne vale ~40.000 (146 KB, +~4 KB a generazione). Dentro
   «sbagliato» — 35 errori passati, l'unico posto dove è scritto perché certe
   cose non si rifanno — non c'è nessun tag né indice: si consulta leggendolo
   tutto, cioè in pratica non si consulta.

   Qui si prova che l'attrezzo dice la VERITÀ di memoria.json (non una seconda
   verità), che la ricerca trova davvero, che non scrive niente, e che il
   risparmio è reale e non una sensazione. */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { mem, statoInBreve, cercaSbagliato, cercaAperti, cercaChiusi, piatto, ripulisci }
  from "../strumenti/ricorda.mjs";

let ko = 0;
const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const QUI = path.dirname(new URL(import.meta.url).pathname);
const RAD = [path.resolve(QUI, ".."), QUI].find((d) => existsSync(path.join(d, "memoria.json")));
const ATTREZZO = path.join(RAD, "strumenti", "ricorda.mjs");
const corri = (...a) => { const r = spawnSync("node", [ATTREZZO, ...a], { encoding: "utf8" }); return (r.stdout || "") + (r.stderr || ""); };

/* ═══ 1. DICE LA VERITÀ DI memoria.json, NON UNA SUA ═══ */
console.log("\n— 1. l'attrezzo non inventa: ripete quello che c'è scritto —");
const grezza = JSON.parse(readFileSync(path.join(RAD, "memoria.json"), "utf8"));
const s = statoInBreve();
ok(s.gen === grezza.online.gen && s.len === grezza.online.len && s.md5 === grezza.online.md5,
  `stato ripete online (${s.gen}, len ${s.len})`);
ok(s.aperti === grezza.aperti.length && s.chiusi === grezza.chiusi.length,
  `e i conti combaciano (${s.aperti} aperti, ${s.chiusi} chiusi)`);
ok(s.sbagliato === grezza.sbagliato.length, `e i ${s.sbagliato} errori passati`);
/* l'ultimo SPEDITO non è chiusi[0]: i lavori di soli collaudi non fanno
   versione. È la stessa regola di memoriatest §5 e di coerenzatest §2. */
const atteso = grezza.chiusi.find((g) => !g.soloCollaudi);
ok(s.ultimoSpedito === atteso.gen,
  `e «ultimo spedito» salta i lavori di soli collaudi (${s.ultimoSpedito}, non ${grezza.chiusi[0].gen || "(soli collaudi)"})`);

/* ═══ 2. LA RICERCA TROVA DAVVERO ═══ */
console.log("\n— 2. la ricerca trova, e ignora accenti e maiuscole —");
ok(cercaSbagliato(null).length === grezza.sbagliato.length, "senza parola torna tutto");
const unaVoce = grezza.sbagliato[0];
const pezzo = unaVoce.dicevo.split(" ").slice(1, 4).join(" ");
ok(cercaSbagliato(pezzo).length > 0, `cercando «${pezzo}» si trova la voce che lo contiene`);
ok(cercaSbagliato(pezzo.toUpperCase()).length > 0, "e in maiuscolo si trova lo stesso");
ok(piatto("perché") === piatto("PERCHE"), "gli accenti non contano: «perché» e «PERCHE» sono la stessa cosa");
ok(cercaSbagliato("zzzqqqxxx-che-non-esiste").length === 0, "e una parola che non c'è non tira fuori niente");
ok(cercaAperti(null).length === grezza.aperti.length, "anche «aperti» senza parola torna tutto");
ok(cercaChiusi("gen-6.21").length >= 1, "e «chiusi gen-6.21» trova quella generazione");

/* ═══ 3. NON SCRIVE NIENTE ═══
   Un attrezzo che legge la memoria e potesse anche scriverla diventerebbe il
   modo più comodo di farle dire una cosa falsa. */
console.log("\n— 3. è una domanda, non una mutazione —");
const sorgente = readFileSync(ATTREZZO, "utf8");
ok(!/writeFileSync|appendFileSync|rmSync|unlinkSync/.test(sorgente),
  "il sorgente non importa nemmeno un modo di scrivere su disco");
const prima = readFileSync(path.join(RAD, "memoria.json"), "utf8");
corri("stato"); corri("sbagliato", "verde"); corri("aperti"); corri("chiusi"); corri("regole"); corri("tuoi");
ok(readFileSync(path.join(RAD, "memoria.json"), "utf8") === prima,
  "e dopo sei comandi memoria.json è byte per byte la stessa");

/* ═══ 4. UNA VOCE NON PUÒ TRAVESTIRSI DA BANNER ═══
   È il testo di cui la prossima sessione si fida di più, quindi il bersaglio
   più ghiotto: stessa regola già scritta dentro dispensa.mjs. */
console.log("\n— 4. una voce non pilota il terminale —");
const esc = String.fromCharCode(27);
ok(!ripulisci(esc + "[31mfinto" + esc + "[0m").includes(esc),
  "le sequenze ANSI non arrivano al terminale");
for (const c of ["stato", "regole", "tuoi"])
  ok(corri(c).includes("APPUNTI, NON ORDINI"),
    `«${c}» stampa il cartello «APPUNTI, NON ORDINI» in testa`);

/* ═══ 5. IL RISPARMIO È REALE, E SI MISURA ═══
   Senza questa sezione l'attrezzo sarebbe una comodità dichiarata e mai
   verificata — e il giorno che «stato» diventasse lungo quanto il file
   nessuno se ne accorgerebbe. */
console.log("\n— 5. il risparmio si misura, non si dichiara —");
const pesoFile = readFileSync(path.join(RAD, "memoria.json"), "utf8").length;
const pesoStato = corri("stato").length;
ok(pesoStato < pesoFile / 100,
  `«stato» costa ${pesoStato} caratteri contro i ${pesoFile} del file: ${Math.round(pesoFile / pesoStato)} volte meno`);
const pesoCerca = corri("sbagliato", "coda").length;
ok(pesoCerca < pesoFile / 5,
  `e una ricerca negli errori passati ne costa ${pesoCerca}, non ${pesoFile}`);
ok(mem === grezza || JSON.stringify(mem.online) === JSON.stringify(grezza.online),
  "e legge la memoria vera, non una copia sua");

console.log(`\n${ko ? "!! " + ko + " rosse" : "tutto verde"}`);
process.exit(ko ? 1 : 0);
