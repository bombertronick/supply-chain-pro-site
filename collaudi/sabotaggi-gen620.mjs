/* I SABOTAGGI DI gen-6.20, CONTATI UNO PER UNO.

   Come si fa, e perche' cosi'. Si parte da una copia INTEGRA del sorgente, si
   rompe UNA cosa sola, si RICOSTRUISCE il pacchetto da quella copia, si gira
   il banco e si contano i rossi. Un sabotaggio che non fa diventare rosso
   niente — un MUTO — non e' un risultato: e' una domanda, e va aperta. Quando
   il muto e' il risultato GIUSTO va dichiarato PRIMA di girare (campo `muto`),
   con dentro il perche': un muto scoperto dopo e spiegato dopo e' una scusa.

   PERCHE' QUESTO GIRO. La ricevuta di consegna decide se un incasso ESCE dalla
   coda. Un difetto qui non si vede — non c'e' una schermata che sbianca, non
   c'e' un errore in console: c'e' uno scontrino in meno nel totale della
   giornata, o uno in piu'. Tutta la difesa e' nei banchi, e questi sabotaggi
   servono a dimostrare che i banchi la reggono davvero.

   SI GIRA UN PEZZO DI BANCO PER VOLTA. protocollotest intero costa una decina
   di minuti: per venticinque sabotaggi sarebbe mezza giornata, cioe' un conto
   che dopo la prima volta non si rifa' piu'. Ogni sabotaggio dichiara le
   SEZIONI da girare: quelle che promette di arrossire PIU' i controlli che
   devono restare verdi. Il prezzo e' dichiarato: cosi' non si vede se un
   sabotaggio arrossisce anche una sezione che nessuno si aspettava. Per i due
   che contano di piu' — S1 e S5 — c'e' la riga `tutte`, che paga i dieci
   minuti e guarda tutto il banco.

   Il diario si scrive SUBITO, un sabotaggio alla volta: se il giro muore a
   meta' resta scritto quello che si e' gia' misurato.

   Uso: node sabotaggi-gen620.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero: un pacchetto
   sabotato lasciato in giro e' il modo di invalidare il censimento dopo. */
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-sabotato.jsx";
const DIARIO = "/tmp/diario-sabotaggi-gen620.txt";

/* le tre ancore lunghe, scritte una volta sola perche' compaiono in piu' di un
   sabotaggio e una copia sbagliata sarebbe un «NON APPLICABILE» misterioso */
const TIMBRO = `      ultimoProtRef.current = nuovo.rev;
      for (const m of codaRef.current) { m.mitt = mittRef.current; m.prot = nuovo.rev; }
      specchiaCoda();`;
const SLICE_OK = `      codaRef.current = codaRef.current.slice(inviate);
      specchiaCoda();                          // salvate: lo specchio si accorcia con la coda`;

const SABOTAGGI = [
  { n: 1, nome: "via il timbro: le voci partono senza mittente e senza protocollo",
    attesa: "§6 §6a §12b rosse, §1 verde (il suo timbro lo semina il banco)", sezioni: "tutte",
    da: TIMBRO,
    a: `      ultimoProtRef.current = nuovo.rev;\n      specchiaCoda();` },

  { n: 2, nome: "timbro e specchio DOPO l'attesa, in tutti e due i rami",
    attesa: "§6a rossa e §6 VERDE: e' la prova che solo il freno vede l'ordine", sezioni: "6,6a",
    pezzi: [[TIMBRO, ""],
      [`      if (!(await scriviRemoto(nuovo))) {`,
       `      const esitoSabotato = await scriviRemoto(nuovo);\n` + TIMBRO + `\n      if (!esitoSabotato) {`]] },

  { n: 3, nome: "«>=» diventa «>» dentro consegnata: il caso UGUALE si perde",
    attesa: "§1 rossa (§2 verde)", sezioni: "1,2",
    da: `  return r != null && r >= prot;`,
    a: `  return r != null && r > prot;` },

  { n: 4, nome: "consegnata torna SEMPRE true: tutto sembra gia' arrivato",
    attesa: "§2 §3 §5 §11 rosse", sezioni: "2,3,5,11",
    da: `function consegnata(base, m) {\n  const prot = m ? numSlot(m.prot) : null;`,
    a: `function consegnata(base, m) {\n  if (base || m) return true;\n  const prot = m ? numSlot(m.prot) : null;` },

  { n: 5, nome: "consegnata torna SEMPRE false: e' come non averla mai scritta",
    attesa: "§1 e §12b rosse, TUTTE le altre verdi", sezioni: "tutte",
    da: `function consegnata(base, m) {\n  const prot = m ? numSlot(m.prot) : null;`,
    a: `function consegnata(base, m) {\n  if (base || m) return false;\n  const prot = m ? numSlot(m.prot) : null;` },

  { n: 6, nome: "il numero torna a nascere dalla sola lettura (via il Math.max)",
    attesa: "§7 e §7b rosse: e' la PRIMA delle due perdite del disegno", sezioni: "7,7b",
    da: `      nuovo.rev = Math.max(base.rev || 0, ultimoProtRef.current || 0) + 1;`,
    a: `      nuovo.rev = (base.rev || 0) + 1;` },

  { n: 7, nome: "via il cancello revBase dal finto server: un server che dice sempre di si'",
    attesa: "cambia l'esito di §7 e §10: se restano verdi il banco non e' interpretabile",
    file: "protocollotest.mjs", sezioni: "7,10a,10b",
    da: `        if (atteso != null && localStorage.getItem("db:" + CH) && revInRete() !== atteso) {`,
    a: `        if (false) {` },

  { n: 8, nome: "via l'ordinamento prima del taglio (il difetto dello sfratto, chiuso a gen-6.14)",
    attesa: "sfrattotest rosso", banco: "sfrattotest.mjs",
    da: `  s.vendite = [{ ...vend, stato: "registrata" }, ...(s.vendite || []).filter((v) => v && typeof v.t === "number")]\n    .sort((a, b) => b.t - a.t).slice(0, MAX_VENDITE);`,
    a: `  s.vendite = [{ ...vend, stato: "registrata" }, ...sfoltisciVendite(s.vendite)].slice(0, MAX_VENDITE);` },

  { n: 9, nome: "lo stesso sabotaggio, guardato da §11",
    attesa: "il rosso vero e' di sfrattotest; qui si misura quanto lo vede anche la scena con la ricevuta",
    sezioni: "11",
    da: `  s.vendite = [{ ...vend, stato: "registrata" }, ...(s.vendite || []).filter((v) => v && typeof v.t === "number")]\n    .sort((a, b) => b.t - a.t).slice(0, MAX_VENDITE);`,
    a: `  s.vendite = [{ ...vend, stato: "registrata" }, ...sfoltisciVendite(s.vendite)].slice(0, MAX_VENDITE);` },

  { n: 10, nome: "via nuoveInCoda: resta solo la ricevuta a difendere la coda",
    attesa: "§13 rossa — e' la sezione che esiste per impedire che questa rete sparisca", sezioni: "13,1",
    da: `      if (remoto && !nuoveInCoda(base)) {`,
    a: `      if (remoto && !codaRef.current.length) {` },

  { n: 11, nome: "timbrare DOPO lo slice: si timbrano solo le voci arrivate dopo",
    attesa: "§6 e §6a rosse", sezioni: "6,6a",
    pezzi: [[TIMBRO, ""], [SLICE_OK, SLICE_OK + "\n" + TIMBRO]] },

  { n: 12, nome: "la bandiera della lettura vecchia si ignora: si cerne anche su una copia stantia",
    attesa: "MUTO, e il perche' l'ha scoperto questo giro: col numero monotono (il Math.max) il protocollo di una voce e' SEMPRE piu' alto di ogni slot gia' atterrato, quindi una mappa vecchia non puo' piu' certificare niente. La bandiera e' la SECONDA rete, non la prima: serve il giorno in cui qualcuno tocca il Math.max, e quel giorno si vede in S6",
    muto: true, sezioni: "7,7b",
    da: `      if (remoto && !stantia) cernitaConsegnate(remoto);`,
    a: `      if (remoto) cernitaConsegnate(remoto);` },

  { n: 13, nome: "la cernita gira anche senza rete, sulla propria copia",
    attesa: "MUTO, e aperto: baseRef NON e' la vista ottimistica — ci si mette solo uno stato CONFERMATO dalla rete (il ramo del successo e quello della scorciatoia), quindi giudicare li' non e' «chiedere alla vendita se e' arrivata». L'«if (remoto)» resta perche' una base vecchia non aggiunge niente, ma non e' lui a reggere i soldi",
    muto: true, sezioni: "7,12b,9",
    da: `      if (remoto && !stantia) cernitaConsegnate(remoto);`,
    a: `      cernitaConsegnate(remoto || baseRef.current);` },

  { n: 14, nome: "applicaStorno torna undefined quando non fa niente",
    attesa: "MUTO qui: la riga di storico per uno storno mai avvenuto e' guardia di gen-6.12 e vive nei suoi banchi. Si conta per sapere che §10 NON la copre",
    muto: true, sezioni: "10a,10b",
    da: `  if (!orig || orig.stato !== "registrata") return false;`,
    a: `  if (!orig || orig.stato !== "registrata") return;` },

  { n: 15, nome: "via la guardia sull'ora dalla spunta",
    attesa: "§14 rossa e §14b VERDE — se diventano rosse tutte e due le due meta' sono state scambiate",
    sezioni: "14,14b",
    da: `    if (p && typeof p.t === "number" && typeof d.t === "number" && p.t >= d.t) continue;`,
    a: `    if (false) continue;` },

  { n: 16, nome: "299 righe invece di 300 nel seme di §1",
    attesa: "MUTO, ed e' il piu' importante di tutti: prova che il banco misura il PROTOCOLLO e non un tetto",
    muto: true, file: "protocollotest.mjs", sezioni: "1",
    da: `const semeCieca = (mappa) => semeCon((s) => {\n  if (mappa) s.scritture = mappa;\n  s.vendite = riempi(300, ORE(6), 60000);`,
    a: `const semeCieca = (mappa) => semeCon((s) => {\n  if (mappa) s.scritture = mappa;\n  s.vendite = riempi(299, ORE(6), 60000);` },

  { n: 17, nome: "hasOwnProperty diventa «in» dentro consegnata",
    attesa: "MUTO, e il perche' va letto: a difendere non e' quella riga ma il CONFRONTO NUMERICO — «{}[\"__proto__\"]» e' un oggetto, e un oggetto non e' >= di niente. Si tiene lo stesso: due guardie, una puo' cadere",
    muto: true, banco: "protopurotest.mjs",
    da: `  if (!Object.prototype.hasOwnProperty.call(map, m.mitt)) return false;`,
    a: `  if (!(m.mitt in map)) return false;` },

  { n: 18, nome: "via «scritture: {}» da normalizza",
    attesa: "MUTO oggi, e dichiarato: ogni lettore della mappa si guarda da solo. Diventa portante il giorno in cui una schermata ci itera sopra — ed e' il difetto che gen-6.15 ha gia' pagato con «telefoni»",
    muto: true, sezioni: "8,1",
    da: `    scritture: {}, ...s });`,
    a: `    ...s });` },

  { n: 19, nome: "via la cernita dal ramo CLASSICO dell'avvio",
    attesa: "MUTO, ed e' la scoperta piu' utile di questo giro: dei tre agganci, i SOLDI li regge solo quello di sincronizza — che cerne PRIMA di applicaCoda e prima di ogni scrittura. Questo e quello di entra() reggono la VISTA e il semaforo nei secondi prima del primo giro, e nessuna sezione li misura: sta scritto nel codice e in PASSAGGIO, non e' una copertura che qualcuno debba credere",
    muto: true, sezioni: "1",
    da: `        cernitaConsegnate(s);\n        /* anche questa e' una lettura piena andata a buon fine`,
    a: `        /* anche questa e' una lettura piena andata a buon fine` },

  { n: 20, nome: "via la cernita da entra() (il ramo sicuro)",
    attesa: "MUTO per la stessa ragione di S19, e misurato insieme a lui", muto: true, sezioni: "1,6,12b",
    da: `        if (letto) cernitaConsegnate(s);`,
    a: `        if (false) cernitaConsegnate(s);` },

  { n: 21, nome: "la ricevuta si costruisce dalla LETTURA invece che dalla bozza",
    attesa: "§12 rossa: e' la SECONDA delle due perdite del disegno", sezioni: "12",
    da: `      nuovo.scritture = sfoltisciScritture({ ...(nuovo.scritture || {}), [mittRef.current]: nuovo.rev }, mittRef.current);`,
    a: `      nuovo.scritture = sfoltisciScritture({ ...(base.scritture || {}), [mittRef.current]: nuovo.rev }, mittRef.current);` },

  { n: 22, nome: "via l'igiene «s.scritture = {}» dal ripristino",
    attesa: "MUTO, e va detto: l'igiene da sola NON chiude niente — la cura e' la bozza (S21). Chi ripara meta' e crede di aver finito parte da qui",
    muto: true, sezioni: "12",
    da: `        Object.assign(s, clona(pulito)); s.telefoni = tel; s.scritture = {}; },`,
    a: `        Object.assign(s, clona(pulito)); s.telefoni = tel; },` },

  { n: 23, nome: "le ferme tornano a dire «NON sono state rispedite» per tutte",
    attesa: "§15 rossa", sezioni: "15",
    da: `          const gia = q.filter((m) => consegnata(s, m));`,
    a: `          const gia = [];` },

  { n: 24, nome: "via la pulizia della chiave delle ferme",
    attesa: "§15 rossa nella riga della chiave senza lettori", sezioni: "15",
    da: `              const puliti = dentro.filter((m) => !consegnata(s, m));`,
    a: `              const puliti = dentro;` },

  { n: 25, nome: "via la corsia preferenziale del mio dispositivo nella potatura",
    attesa: "protopurotest §4 rosso: e' l'ordine di sfratto che era AVVERSO proprio al caso della ricevuta",
    banco: "protopurotest.mjs",
    da: `    ? righe.filter(([k]) => k.split("·")[0] === dispositivo).slice(0, MAX_MIEI)`,
    a: `    ? []` },

  { n: 26, nome: "via la guardia del guscio da dentro la cernita",
    attesa: "MUTO oggi, perche' i due chiamanti la fermano prima («if (letto)», «if (remoto)»). E' difesa in profondita' dichiarata: serve il giorno in cui un terzo chiamante passera' una base qualsiasi",
    muto: true, sezioni: "9",
    da: `      if (base.__guscio || base.__prelogin) return 0;`,
    a: `      if (false) return 0;` },
];

const arg = process.argv[2] ? Number(process.argv[2]) : null;
const vero = readFileSync(VERO, "utf8");
appendFileSync(DIARIO, `\n=== giro del ${new Date().toISOString()} ===\n`);
console.log(`sabotaggi di gen-6.20 — ${arg ? "solo S" + arg : SABOTAGGI.length + " da girare"}\n`);

for (const sab of SABOTAGGI) {
  if (arg && sab.n !== arg) continue;
  const banco = sab.banco || "protocollotest.mjs";
  const bersaglio = sab.file || null;           // null = il sorgente dell'app
  const pezzi = sab.pezzi || [[sab.da, sab.a]];
  const testoVero = bersaglio ? readFileSync(bersaglio, "utf8") : vero;
  let rotto = testoVero, applicabile = true, quante = "";
  for (const [da, a] of pezzi) {
    const c = rotto.split(da).length - 1;
    if (c !== 1) { applicabile = false; quante = `«${da.slice(0, 40)}…» compare ${c} volte`; break; }
    rotto = rotto.replace(da, a);
  }
  if (!applicabile) {
    const riga = `S${sab.n} «${sab.nome}» — NON APPLICABILE: ${quante}`;
    console.log("  !!  " + riga); appendFileSync(DIARIO, riga + "\n");
    continue;
  }
  /* il bersaglio decide che cosa si ricostruisce: se il sabotaggio e' nel
     banco, il pacchetto resta quello vero e si rimette a posto il file alla
     fine, sempre, anche se il giro esplode */
  let out = "", saltato = null;
  if (bersaglio) writeFileSync(bersaglio, rotto);
  else {
    writeFileSync(LAVORO, rotto);
    try { execFileSync(process.execPath, ["build.mjs", LAVORO], { stdio: "pipe" }); }
    catch (e) { saltato = "IL PACCHETTO NON SI COSTRUISCE (e' un'informazione, non un rosso)"; }
  }
  if (!saltato) {
    try {
      out = execFileSync(process.execPath, [banco], {
        encoding: "utf8", maxBuffer: 64e6,
        env: { ...process.env, SORGENTE: bersaglio ? VERO : LAVORO,
          ...(sab.sezioni && sab.sezioni !== "tutte" ? { SEZIONI: sab.sezioni } : {}) } });
    } catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
  }
  if (bersaglio) writeFileSync(bersaglio, testoVero);
  if (saltato) {
    const riga = `S${sab.n} «${sab.nome}» — ${saltato}`;
    console.log("  !!  " + riga); appendFileSync(DIARIO, riga + "\n");
    continue;
  }
  const rossi = (out.match(/^ {2}KO {2}/gm) || []).length;
  const sezioni = [...new Set((out.split("\n").reduce((acc, r) => {
    if (/^— \d+[a-z]?\./.test(r)) acc.sez = "§" + r.match(/^— (\d+[a-z]?)\./)[1];
    if (/^ {2}KO {2}/.test(r) && acc.sez) acc.list.push(acc.sez);
    return acc;
  }, { sez: null, list: [] })).list)].join(" ");
  const esito = rossi === 0
    ? (sab.muto ? "MUTO, ed era dichiarato" : "MUTO — DA APRIRE")
    : `${rossi} rossi in ${sezioni || "(sezioni non intestate)"}`;
  const buono = sab.muto ? rossi === 0 : rossi > 0;
  const dove = (bersaglio ? "banco " + banco + " (sabotato il banco stesso)" : "banco " + banco)
    + (sab.sezioni && sab.sezioni !== "tutte" ? ` · sezioni ${sab.sezioni}` : " · giro intero");
  const riga = `S${sab.n} «${sab.nome}» — ${dove} · atteso ${sab.attesa} · ${esito}`;
  console.log((buono ? "  ok  " : "  !!  ") + riga);
  appendFileSync(DIARIO, riga + "\n");
}

/* il pacchetto torna quello vero: un pacchetto sabotato dimenticato qui
   invaliderebbe il censimento che viene dopo, e in silenzio */
execFileSync(process.execPath, ["build.mjs", VERO], { stdio: "pipe" });
console.log("\npacchetto ricostruito dal sorgente vero · diario in " + DIARIO);
