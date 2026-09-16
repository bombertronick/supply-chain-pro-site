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
const DIARIO = "/tmp/diario-sabotaggi-gen615.txt";

/* ogni sabotaggio: nome, cosa rompe, e la sezione che DEVE accorgersene */
const SABOTAGGI = [
  { n: 1, nome: "storna() non rilegge piu' il dato vivo", attesa: "§2",
    da: `    const viva = (stato.vendite || []).find((v) => v.id === stornoDi.id);
    if (!viva || viva.stato !== "registrata") {
      setStornoDi(null); setMotivo(""); setPinA("");
      return mostraToast("Questo scontrino non è più stornabile: l'ha già stornato un'altra cassa", "errore");
    }
`, a: "" },
  { n: 2, nome: "il ramo locale di mutaDato torna a buttare l'esito", attesa: "§1",
    da: `      let esito;
      try { esito = ESECUTORI[tipo](b, dati); } catch {}
      if (descr && esito !== false) b.log`,
    a: `      try { ESECUTORI[tipo](b, dati); } catch {}
      if (descr) b.log` },
  { n: 3, nome: "il ramo locale di muta torna a buttare l'esito", attesa: "§1",
    da: `      let esito;
      try { esito = fn(b); } catch {}
      if (descr && esito !== false) b.log`,
    a: `      try { fn(b); } catch {}
      if (descr) b.log` },
  { n: 4, nome: "l'export delle vendite torna scoperto", attesa: "§5",
    da: `    (stato.vendite || []).forEach((v) => (v.righe || []).forEach((r) => {`,
    a: `    (stato.vendite || []).forEach((v) => v.righe.forEach((r) => {` },
  { n: 5, nome: "la riga di vendita in Cassa torna scoperta", attesa: "§5",
    da: `{(v.righe || []).map((r) => \`\${r.qty}× \${r.nome}\`).join(", ")}</span>`,
    a: `{v.righe.map((r) => \`\${r.qty}× \${r.nome}\`).join(", ")}</span>` },
  { n: 6, nome: "«telefoni» esce dai default di normalizza", attesa: "§7",
    da: `    telefoni: {}, ...s });`, a: `    ...s });` },
  { n: 7, nome: "il battito non si timbra piu'", attesa: "§6 e §10",
    da: `    stato.telefoni = battito(stato.telefoni, stato.rev);\n`, a: "" },
  { n: 8, nome: "il tetto dei telefoni pota al contrario", attesa: "§6",
    da: `    .sort((a, b) => (b[1].r || 0) - (a[1].r || 0))
    .slice(0, MAX_TELEFONI);`,
    a: `    .sort((a, b) => (a[1].r || 0) - (b[1].r || 0))
    .slice(0, MAX_TELEFONI);` },
  { n: 9, nome: "la soglia dell'ambra diventa irraggiungibile", attesa: "§9",
    da: `const SOGLIA_VISTA_FERMA = MAX_GIRI_MAGRI * POLL_MAX_MS + 12000;`,
    a: `const SOGLIA_VISTA_FERMA = MAX_GIRI_MAGRI * POLL_MAX_MS * 100;` },
  { n: 10, nome: "l'eta' della lista si congela (via il tic)", attesa: "§9",
    da: `    const id = setInterval(() => tic((n) => (n + 1) % 1000000), 5000);
    return () => clearInterval(id);`,
    a: `    return () => {};` },
  { n: 11, nome: "la scheda smette di dire quello che non sa", attesa: "§8",
    da: `lista non è «aggiornato»: è <b>non aggiornato</b>, perché non si sa.`,
    a: `lista non c'è.` },
  { n: 12, nome: "il ripristino torna a resuscitare i telefoni del backup", attesa: "§11",
    da: `      fn: (s) => { const tel = telefoniDi(s); for (const k of Object.keys(s)) delete s[k];
        Object.assign(s, clona(pulito)); s.telefoni = tel; },`,
    a: `      fn: (s) => { for (const k of Object.keys(s)) delete s[k]; Object.assign(s, clona(pulito)); },` },
  { n: 13, nome: "il lettore difensivo della mappa smette di difendere", attesa: "§7",
    da: `const telefoniDi = (s) => {
  const m = s && s.telefoni;
  if (!m || typeof m !== "object" || Array.isArray(m)) return {};
  const buone = Object.entries(m).filter(([, r]) => r && typeof r === "object" && typeof r.v === "string");
  return Object.fromEntries(buone);
};`,
    a: `const telefoniDi = (s) => (s && s.telefoni) || {};` },
  { n: 14, nome: "il poll torna a timbrare la lista su un giro magro", attesa: "§9 o §8",
    da: `          diagRef.current = { ...diagRef.current, ultimaSpia: Date.now(), giriMagri };`,
    a: `          diagRef.current = { ...diagRef.current, ultimaRete: Date.now(), ultimaSpia: Date.now(), giriMagri };` },
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
    out = execFileSync(process.execPath, ["spietest.mjs"], {
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
