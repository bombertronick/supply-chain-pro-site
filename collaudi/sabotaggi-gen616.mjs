/* I SABOTAGGI DI gen-6.15, CONTATI UNO PER UNO.

   Come si fa, e perche' cosi'. Si parte da una copia INTEGRA del sorgente,
   si rompe UNA cosa sola, si RICOSTRUISCE il pacchetto da quella copia, si
   gira il banco e si contano i rossi. Un sabotaggio che non fa diventare
   rosso niente — un MUTO — non e' un risultato: e' una domanda, e va aperta.
   Quasi sempre e' un buco del banco o una ridondanza vera del codice, e
   tutte e due le volte e' un'informazione che vale piu' di un verde.

   Il diario si scrive SUBITO, un sabotaggio alla volta: se il giro muore a
   meta' resta scritto quello che si e' gia' misurato.

   Uso: node sabotaggi-gen615.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero: un pacchetto
   sabotato lasciato in giro e' il modo di invalidare il censimento dopo. */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-sabotato.jsx";
const DIARIO = "/tmp/diario-sabotaggi-gen616.txt";

/* ogni sabotaggio: nome, cosa rompe, e la sezione che DEVE accorgersene */
/* I SABOTAGGI DI gen-6.16 — IL GUSCIO.
   Tre riparazioni, e per ognuna la domanda e' la stessa: se la tolgo, il
   banco se ne accorge? Piu' due che provano il verso opposto — che la
   difesa nuova non abbia murato qualcosa che funzionava. */
const SABOTAGGI = [
  { n: 1, nome: "il guscio torna senza marchio", attesa: "§9",
    da: `normalizza({ profili: statoRef.current?.profili || [], __guscio: true })`,
    a:  `normalizza({ profili: statoRef.current?.profili || [] })` },

  { n: 2, nome: "via la guardia sulla base", attesa: "§9",
    da: `      if (base && (base.__guscio || base.__prelogin))
        throw new Error("base non attendibile: non si e' letta la rete");`,
    a:  `      if (false)
        throw new Error("base non attendibile: non si e' letta la rete");` },

  { n: 3, nome: "la guardia guarda solo baseRef, non la base scelta", attesa: "§9",
    da: `      if (base && (base.__guscio || base.__prelogin))`,
    a:  `      if (baseRef.current && (baseRef.current.__guscio || baseRef.current.__prelogin))` },

  { n: 4, nome: "la pastiglia torna a dire «ok» senza aver letto", attesa: "§9",
    da: `        setSync(!letto ? "offline" : (codaRef.current.length ? "salvataggio" : "ok"));`,
    a:  `        setSync(codaRef.current.length ? "salvataggio" : "ok");` },

  /* IL VERSO OPPOSTO. Una difesa che scatta sempre non e' una difesa, e' un
     muro: questi due devono far arrossire i CONTROCONTROLLI, non i controlli. */
  { n: 5, nome: "la guardia scatta anche su una base buona (muro)", attesa: "§9b o §8",
    da: `      if (base && (base.__guscio || base.__prelogin))`,
    a:  `      if (base)` },

  { n: 6, nome: "il marchio finisce anche sullo stato letto dalla rete", attesa: "§9b o §8",
    da: `        const s = letto ? normalizza(letto) : normalizza({ profili: statoRef.current?.profili || [], __guscio: true });`,
    a:  `        const s = normalizza(letto ? { ...letto, __guscio: true } : { profili: statoRef.current?.profili || [], __guscio: true });` },
];

const solo = process.argv[2] ? +process.argv[2] : null;
const vero = readFileSync(VERO, "utf8");
appendFileSync(DIARIO, `\n===== giro del ${new Date().toISOString()} · base ${vero.length} caratteri =====\n`);

for (const sab of SABOTAGGI) {
  if (solo && sab.n !== solo) continue;
  const c = vero.split(sab.da).length - 1;
  if (c !== 1) {
    const riga = `S${sab.n} «${sab.nome}» — NON APPLICABILE: l'ancora compare ${c} volte`;
    console.log("  !!  " + riga);
    appendFileSync(DIARIO, riga + "\n");
    continue;
  }
  writeFileSync(LAVORO, vero.replace(sab.da, sab.a));
  try {
    execFileSync(process.execPath, ["build.mjs", LAVORO], { stdio: "pipe" });
  } catch (e) {
    const riga = `S${sab.n} «${sab.nome}» — IL PACCHETTO NON SI COSTRUISCE (e' un'informazione, non un rosso)`;
    console.log("  !!  " + riga);
    appendFileSync(DIARIO, riga + "\n");
    continue;
  }
  let out = "";
  try {
    out = execFileSync(process.execPath, ["gen606test.mjs"], {
      encoding: "utf8", env: { ...process.env, SORGENTE: LAVORO }, maxBuffer: 64e6 });
  } catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
  const rossi = (out.match(/^ {2}KO {2}/gm) || []).length;
  const sezioni = [...new Set((out.split("\n").reduce((acc, r) => {
    if (/^— \d+\./.test(r)) acc.sez = "§" + r.match(/^— (\d+)\./)[1];
    if (/^ {2}KO {2}/.test(r) && acc.sez) acc.list.push(acc.sez);
    return acc;
  }, { sez: null, list: [] })).list)].join(" ");
  const esito = rossi === 0 ? "MUTO — DA APRIRE" : `${rossi} rossi in ${sezioni}`;
  const riga = `S${sab.n} «${sab.nome}» — atteso ${sab.attesa} · ${esito}`;
  console.log((rossi === 0 ? "  MUTO " : "  ok  ") + riga);
  appendFileSync(DIARIO, riga + "\n");
}

/* il pacchetto torna quello vero: un pacchetto sabotato dimenticato qui
   invaliderebbe il censimento che viene dopo, e in silenzio */
execFileSync(process.execPath, ["build.mjs", VERO], { stdio: "pipe" });
console.log("\npacchetto ricostruito dal sorgente vero · diario in " + DIARIO);
