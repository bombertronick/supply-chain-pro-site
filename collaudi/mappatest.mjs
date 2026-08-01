/* La mappa dei rifornimenti, misurata sulla topologia vera di Valerio:
   un laboratorio (Magazzino centrale) e due sedi con Secco, Bevande e
   quattro linee ciascuna. Qui non si guarda il disegno a occhio: si
   controllano le coordinate che il disegno userà. */
import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lib = require("./rete-lib.cjs");

let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const stato = JSON.parse(readFileSync("topologia-vera.json", "utf8"));
const mags = stato.magazzini;
const { nodi, bande, links } = lib.costruisciRete(stato, mags);
const nome = (id) => nodi[id]?.m.nome || id;
const COLX = lib.COLX;

console.log("\n— com'è disposta la mappa —");
for (const bn of bande) {
  console.log("  fascia " + bn.nome + ":");
  const dentro = Object.values(nodi).filter((n) => n.banda === bn.id);
  const righe = {};
  for (const n of dentro) (righe[n.y] = righe[n.y] || []).push(n);
  for (const y of Object.keys(righe).sort((a, b) => a - b)) {
    const r = righe[y];
    const retro = r.find((n) => n.x === COLX.retro);
    const linea = r.find((n) => n.x === COLX["linea-retro"]);
    console.log("    y=" + String(Math.round(y)).padStart(4) + "  "
      + (retro ? retro.m.nome : "—").padEnd(22) + " | " + (linea ? linea.m.nome : "—"));
  }
}
console.log("");

/* ── 1. chi rifornisce e chi riceve stanno sulla STESSA riga ── */
const daRetro = links.filter((l) => l.tipo === "retro");
ok(daRetro.length === 4, `ci sono 4 rifornimenti da magazzino retro (${daRetro.length})`);
/* Un retro che rifornisce più linee sta sulla riga della prima; le altre
   vanno su righe dove la colonna dei retro resta vuota, così non nasce
   nessuna coppia falsa. In ogni caso la freccia parte dal riquadro giusto. */
for (const l of daRetro) {
  const stessaRiga = nodi[l.da].y === nodi[l.a].y;
  const slotVuoto = !Object.values(nodi).some((n) => n.x === COLX.retro && n.y === nodi[l.a].y);
  ok(stessaRiga || slotVuoto,
    stessaRiga
      ? `«${nome(l.da)}» è affiancato a «${nome(l.a)}», che rifornisce`
      : `«${nome(l.a)}» sta su una riga libera: «${nome(l.da)}» ne rifornisce già un'altra`);
}

/* L'invariante che conta davvero: il tratto verticale di OGNI collegamento
   corre fuori dalla colonna dei retro. È questo che impedisce a un filo di
   passare dietro a un riquadro e far leggere la mappa al contrario. */
const sx = COLX.retro - lib.NW / 2, dx = COLX.retro + lib.NW / 2;
for (const l of links)
  ok(l.mx < sx || l.mx > dx,
    `il tratto verticale verso «${nome(l.a)}» passa fuori dai riquadri retro (x=${l.mx}, colonna ${sx}–${dx})`);

/* ── 2. i collegamenti del laboratorio non passano dietro a nessun retro ── */
const daLab = links.filter((l) => l.tipo === "lab");
ok(daLab.length === 4, `il laboratorio rifornisce 4 linee (${daLab.length})`);
/* il filo entra orizzontalmente all'altezza della linea: se a quell'altezza
   c'è un riquadro retro, il filo ci passa dentro e si legge al contrario */
const retriPerY = {};
for (const n of Object.values(nodi)) if (n.x === COLX.retro) retriPerY[n.y] = n.m.nome;
for (const l of daLab) {
  const y = nodi[l.a].y;
  ok(!retriPerY[y], `il filo verso «${nome(l.a)}» non attraversa nessun retro`
    + (retriPerY[y] ? ` — ci passa dentro «${retriPerY[y]}»` : ""));
}

/* ── 3. il caso preciso che aveva segnalato ── */
ok(nodi["lfritti-fm"].y !== nodi["bevande-fm"].y,
  "«Linea fritti fm» NON è più affiancata a «Bevande fm», che non la rifornisce");
ok(nodi["secco-fm"].y === nodi["lsecco-fm"].y,
  "«Secco fm» invece è affiancato a «Linea secco fm», che rifornisce davvero");

/* ── 4. nessuna coppia sbagliata in tutta la mappa ── */
let accoppiate = 0, sbagliate = 0;
for (const n of Object.values(nodi)) {
  if (n.x !== COLX["linea-retro"]) continue;
  const affianco = Object.values(nodi).find((x) => x.x === COLX.retro && x.y === n.y);
  if (!affianco) continue;
  accoppiate++;
  if (!links.some((l) => l.da === affianco.m.id && l.a === n.m.id)) {
    sbagliate++; console.log("      coppia falsa:", affianco.m.nome, "→", n.m.nome);
  }
}
ok(sbagliate === 0, `ogni riquadro affiancato a una linea la rifornisce davvero (${accoppiate} coppie, ${sbagliate} false)`);

/* ── 5. ogni linea ha il suo rifornitore, e uno solo ── */
for (const m of mags.filter((x) => x.tipo.startsWith("linea"))) {
  const entranti = links.filter((l) => l.a === m.id);
  ok(entranti.length === 1, `«${m.nome}» ha un solo rifornitore (${entranti.length})`);
}
/* ── 6. i retro non sono riforniti da nessuno dentro la mappa ── */
for (const m of mags.filter((x) => x.tipo === "retro"))
  ok(!links.some((l) => l.a === m.id), `«${m.nome}» non risulta rifornito dal laboratorio: viene dal fornitore`);

/* ── 7. i due tipi di collegamento sono distinguibili ── */
ok(links.every((l) => l.tipo === "lab" || l.tipo === "retro"),
  "ogni collegamento sa da che tipo di rifornitore arriva, così può avere il suo colore");

/* ── 8. tutti i magazzini sono disegnati ── */
ok(Object.keys(nodi).length === mags.length,
  `tutti i ${mags.length} magazzini hanno un posto sulla mappa (${Object.keys(nodi).length})`);

console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
