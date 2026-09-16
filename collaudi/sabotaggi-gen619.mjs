/* I SABOTAGGI DI gen-6.19, CONTATI UNO PER UNO.

   Come si fa, e perche' cosi'. Si parte da una copia INTEGRA del sorgente, si
   rompe UNA cosa sola, si RICOSTRUISCE il pacchetto da quella copia, si gira
   il banco e si contano i rossi. Un sabotaggio che non fa diventare rosso
   niente — un MUTO — non e' un risultato: e' una domanda, e va aperta.

   PERCHE' QUESTO GIRO. «I gruppi diventano pulsanti» tocca la schermata piu'
   battuta dell'app: se si rompe, non si vende. E soprattutto: da qui in poi
   OTTO banchi arrivano alle celle passando da cassanav.mjs, che i pulsanti li
   da' per buoni. Quell'aiutante rende gli otto banchi CIECHI al difetto «il
   gruppo non si apre»: le uniche sezioni che lo vedono a viso aperto sono §3
   e §6 di gruppitest, e questi sabotaggi servono a dimostrare che quelle due
   sezioni tengono davvero il peso di tutte le altre.

   I NUMERI DELLE SEZIONI sono quelli STAMPATI dal banco, che da gen-6.19
   coincidono coi numeri del disegno (il titolo «— 13.» prima diceva «— 7.»:
   corretto, perche' un diario che attribuisce i rossi alla sezione sbagliata
   e' peggio di un diario che non c'e').

   Il diario si scrive SUBITO, un sabotaggio alla volta: se il giro muore a
   meta' resta scritto quello che si e' gia' misurato.

   Uso: node sabotaggi-gen619.mjs [numero]   (senza numero: tutti)
   Alla fine RICOSTRUISCE il pacchetto dal sorgente vero: un pacchetto
   sabotato lasciato in giro e' il modo di invalidare il censimento dopo. */
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { execFileSync } from "child_process";

const VERO = "../app/app.jsx";
const LAVORO = "/tmp/lavoro-sabotato.jsx";
const DIARIO = "/tmp/diario-sabotaggi-gen619.txt";

const SABOTAGGI = [
  { n: 1, nome: "l'apertura torna alle battute (gruppi[0])", attesa: "§3 §3b §4 §9",
    da: `  const gPartenza = gruppoDiPartenza(voci);`,
    a:  `  const gPartenza = gruppi[0];` },

  /* il PAREGGIO non esiste nel contesto A (Pizze 20, Fritti 4, Dolci 2): la
     sezione che lo interroga vive in un ALTRO banco, dove il listino ha una
     pizza e una bibita e a decidere resta l'ordine scritto da una persona */
  { n: 2, nome: "a parita' di voci decide l'alfabeto, non il listino", attesa: "§8 di postazionecassatest",
    banco: "postazionecassatest.mjs",
    da: `    .sort((a, b) => b.quante - a.quante || a.primo - b.primo)[0]?.g ?? null;`,
    a:  `    .sort((a, b) => b.quante - a.quante || a.g.localeCompare(b.g, "it"))[0]?.g ?? null;` },

  { n: 3, nome: "«Altro» puo' partire aperto", attesa: "§3b",
    da: `  const veri = tutti.filter((x) => x.g !== "Altro");`,
    a:  `  const veri = tutti;` },

  { n: 4, nome: "i pulsanti compaiono anche con un gruppo solo", attesa: "§12",
    da: `  const aFisarmonica = gruppi.length > 1;`,
    a:  `  const aFisarmonica = true;` },

  { n: 5, nome: "il gruppo si chiude a ogni tocco sulla cella", attesa: "§8",
    da: `  const aggiungi = (voce, variante, extra = [], usaMano = true) => {`,
    a:  `  const aggiungi = (voce, variante, extra = [], usaMano = true) => {\n    setGruppoScelto(null);` },

  { n: 6, nome: "via il ripiego quando il gruppo scelto sparisce dal listino", attesa: "§18",
    da: `  const gAperto = gruppi.includes(gruppoScelto) ? gruppoScelto : gPartenza;`,
    a:  `  const gAperto = gruppoScelto ?? gPartenza;` },

  { n: 7, nome: "dopo l'incasso la scelta non si azzera", attesa: "§9",
    da: `       della serata, senza ereditare la barra aperta di quello prima */
    setViva(null); setMano([]); setFasciaSu(false); setGruppoScelto(null);`,
    a:  `       della serata, senza ereditare la barra aperta di quello prima */
    setViva(null); setMano([]); setFasciaSu(false);` },

  { n: 8, nome: "l'esclusivita' si perde: resta aperto anche il gruppo di partenza", attesa: "§6",
    da: `        : gruppi.filter((g) => !aFisarmonica || g === gAperto).map((g) => (`,
    a:  `        : gruppi.filter((g) => !aFisarmonica || g === gAperto || g === gPartenza).map((g) => (` },

  { n: 9, nome: "la griglia non filtra piu' niente: tutti i gruppi aperti", attesa: "§5 §6",
    da: `        : gruppi.filter((g) => !aFisarmonica || g === gAperto).map((g) => (`,
    a:  `        : gruppi.map((g) => (` },

  { n: 10, nome: "via data-nel-gruppo dal pulsante", attesa: "§13",
    da: `              <button key={g} type="button" data-gruppo={g} data-nel-gruppo={n}`,
    a:  `              <button key={g} type="button" data-gruppo={g}` },

  /* il sabotaggio che l'accusa chiedeva: spegne SOLO il numero che si vede,
     lasciando intatto l'attributo. Senza la lettura di innerText in §13
     questo resterebbe muto, e il conto sul pulsante sarebbe una promessa
     scritta solo per i banchi. */
  { n: 11, nome: "via il <Chip> che si VEDE, l'attributo resta", attesa: "§13",
    da: `                {n > 0 && <Chip colore={aperto ? T.sup : T.blu} pieno={!aperto}>{n}</Chip>}`,
    a:  `                {false && <Chip colore={aperto ? T.sup : T.blu} pieno={!aperto}>{n}</Chip>}` },

  { n: 12, nome: "aria-expanded mente: sempre true", attesa: "§2 §6 §14",
    da: `                aria-expanded={aperto} aria-controls={\`griglia-\${g}\`}`,
    a:  `                aria-expanded={true} aria-controls={\`griglia-\${g}\`}` },

  { n: 13, nome: "il bersaglio scende sotto i 44 punti", attesa: "§14",
    da: `                style={{ minHeight: 44, background: aperto ? T.blu : T.sup,`,
    a:  `                style={{ minHeight: 32, background: aperto ? T.blu : T.sup,` },

  { n: 14, nome: "via la clausola «Altro in fondo» (regola di gen-6.00)", attesa: "§10",
    da: `    if ((a === "Altro") !== (b === "Altro")) return a === "Altro" ? 1 : -1;\n`,
    a:  `` },

  { n: 15, nome: "la fila si riordina: l'acceso salta in testa", attesa: "§11",
    da: `            background: "rgba(244,247,254,.94)", backdropFilter: "blur(10px)" }}>
          {gruppi.map((g) => {`,
    a:  `            background: "rgba(244,247,254,.94)", backdropFilter: "blur(10px)" }}>
          {[...gruppi].sort((x, y) => (y === gAperto) - (x === gAperto)).map((g) => {` },

  { n: 16, nome: "la riga dei pulsanti non e' piu' appiccicata", attesa: "§15",
    da: `          style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: 6, paddingBottom: 6,`,
    a:  `          style={{ position: "static", top: 0, zIndex: 20, paddingTop: 6, paddingBottom: 6,` },

  { n: 17, nome: "«torna in cima» non scorre piu' niente", attesa: "§19",
    da: `      s.scrollTop += Math.round(a.getBoundingClientRect().top - s.getBoundingClientRect().top - s.clientTop);`,
    a:  `      void s;` },

  /* il sabotaggio che dimostra che l'aiutante non ha accecato la suite: §6
     tocca il pulsante col selettore CRUDO e non importa mai cassanav.mjs */
  { n: 18, nome: "l'onClick del pulsante non fa niente", attesa: "§6 (e a catena gli 8 banchi migrati)",
    da: `                onClick={() => { setGruppoScelto(g); tornaInCima(); }}`,
    a:  `                onClick={() => {}}` },

  { n: 19, nome: "la scelta sopravvive al cambio di stanza", attesa: "§20",
    da: `  useEffect(() => { setGruppoScelto(null); }, [sez]);\n`,
    a:  `` },

  { n: 20, nome: "via data-gruppo: il contratto con i banchi si rompe", attesa: "§1 §10 (e a catena gli 8 banchi migrati)",
    da: `              <button key={g} type="button" data-gruppo={g} data-nel-gruppo={n}`,
    a:  `              <button key={g} type="button" data-nel-gruppo={n}` },
];

const solo = process.argv[2] ? +process.argv[2] : null;
const vero = readFileSync(VERO, "utf8");
appendFileSync(DIARIO, `\n===== giro del ${new Date().toISOString()} · base ${vero.length} caratteri =====\n`);

for (const sab of SABOTAGGI) {
  if (solo && sab.n !== solo) continue;
  const banco = sab.banco || "gruppitest.mjs";
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
    out = execFileSync(process.execPath, [banco], {
      encoding: "utf8", env: { ...process.env, SORGENTE: LAVORO }, maxBuffer: 64e6 });
  } catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
  const rossi = (out.match(/^ {2}KO {2}/gm) || []).length;
  const sezioni = [...new Set((out.split("\n").reduce((acc, r) => {
    if (/^— \d+[a-z]?\./.test(r)) acc.sez = "§" + r.match(/^— (\d+[a-z]?)\./)[1];
    if (/^ {2}KO {2}/.test(r) && acc.sez) acc.list.push(acc.sez);
    return acc;
  }, { sez: null, list: [] })).list)].join(" ");
  const esito = rossi === 0 ? "MUTO — DA APRIRE" : `${rossi} rossi in ${sezioni}`;
  const riga = `S${sab.n} «${sab.nome}» — banco ${banco} · atteso ${sab.attesa} · ${esito}`;
  console.log((rossi === 0 ? "  MUTO " : "  ok  ") + riga);
  appendFileSync(DIARIO, riga + "\n");
}

/* il pacchetto torna quello vero: un pacchetto sabotato dimenticato qui
   invaliderebbe il censimento che viene dopo, e in silenzio */
execFileSync(process.execPath, ["build.mjs", VERO], { stdio: "pipe" });
console.log("\npacchetto ricostruito dal sorgente vero · diario in " + DIARIO);

/* ═══ I MUTI, DICHIARATI PRIMA DI GIRARE ═══

   MUTO 1 — «lo spaziatore torna ai due numeri fissi di gen-6.09» non fa rosso
   niente QUI. Lo spaziatore non dipende da quale gruppo e' aperto: dipende da
   fasciaSu e da altezzaFascia. §16 protegge «cambiare gruppo non muove
   Incassa», non «lo spaziatore misura»: quella e' guardia di gen-6.09 e vive
   in gen604test §12. Scriverlo qui e non dirlo sarebbe vendere una copertura
   che non c'e'.

   MUTO 2 — «le celle chiuse restano nel DOM ma nascoste» non fa rosso niente,
   ed e' giusto: stessa altezza di pagina, stesso comportamento per il pollice
   e per Playwright. §5 e' scritto sulla RAGGIUNGIBILITA' apposta.

   MUTO 3 — il rimescolamento della fila fra due vendite non ha sezione. Non
   e' una guardia spenta: e' il limite L2 della roadmap, e va letto li'.

   FUORI MACCHINA — S21, «l'aiutante ingoia»: in cassanav.mjs il throw finale
   diventa `return c.first()`. Questa macchina patcha SOLO ../app/app.jsx e
   ricostruisce il pacchetto: un .mjs dentro collaudi/ non ci entra. Va fatto
   a mano, una volta, e messo a diario — dichiararlo e' l'unica alternativa
   onesta a fingere che sia girato. */
