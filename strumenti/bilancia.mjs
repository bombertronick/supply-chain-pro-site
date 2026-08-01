/* ── IL CONTROLLO CHE MI E' MANCATO ──
   Stanotte ho sostituito un pezzo di JSX e nel farlo ho perso due righe di
   struttura: la riga che apriva la condizione e il tag di chiusura. Il file si
   e' ricostruito byte per byte come volevo — le mie md5 combaciavano tutte —
   perche' le md5 dicono «il testo e' quello che intendevo», non «il testo ha
   senso». E il compilatore non ha protestato.
   Questo controllo guarda una cosa sola ma la guarda bene: dentro un pezzo
   sostituito, parentesi tonde, graffe e tag JSX devono restare in pari come
   erano prima. Se il vecchio pezzo apriva due tag e ne chiudeva due, anche il
   nuovo deve farlo. Non capisce il codice: conta. Ma e' esattamente il tipo di
   sbaglio che mi e' sfuggito. */
const conta = (s, apre, chiude) =>
  (s.split(apre).length - 1) - (s.split(chiude).length - 1);

/* ── DOVE FINISCE DAVVERO UN TAG ──
   La prima versione usava un'espressione regolare con [^>]*?, cioe' «tutto
   fino al primo >». Sembra ragionevole e non lo e': dentro gli attributi JSX
   ci sono le FRECCE delle funzioni — onCambia={(v) => setQty(v)} — e quel >
   non chiude niente. Risultato: ogni <Campo ... /> con una freccia dentro
   veniva contato come tag APERTO, e il controllo gridava al lupo su pezzi
   sani. Tre volte su tre, sui pezzi delle ricette.
   Un controllo che dà falsi allarmi viene ignorato, e allora tanto vale non
   averlo. Quindi adesso si scorre a mano tenendo conto di virgolette e
   graffe, e si guarda se il carattere prima del > di chiusura e' una barra. */
function tagJsx(s) {
  const saldo = {};
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "<") continue;
    let j = i + 1;
    const chiusura = s[j] === "/";
    if (chiusura) j++;
    if (!/[A-Z]/.test(s[j] || "")) continue;      // solo i componenti, non <div>
    let nome = "";
    while (j < s.length && /[\w.]/.test(s[j])) nome += s[j++];
    let graffe = 0, virg = null, autochiuso = false, k = j;
    for (; k < s.length; k++) {
      const c = s[k];
      if (virg) { if (c === "\\") k++; else if (c === virg) virg = null; continue; }
      if (c === '"' || c === "'" || c === "`") { virg = c; continue; }
      if (c === "{") { graffe++; continue; }
      if (c === "}") { graffe--; continue; }
      if (graffe > 0) continue;
      if (c === ">") {
        let z = k - 1;
        while (z > j && /\s/.test(s[z])) z--;
        autochiuso = s[z] === "/";
        break;
      }
    }
    if (k >= s.length) continue;                  // tag che non finisce dentro il pezzo
    i = k;
    if (!autochiuso) saldo[nome] = (saldo[nome] || 0) + (chiusura ? -1 : 1);
  }
  return saldo;
}

export function bilancia(vecchio, nuovo, etichetta) {
  const guai = [];
  for (const [apre, chiude, nome] of [["(", ")", "tonde"], ["{", "}", "graffe"], ["[", "]", "quadre"]]) {
    const a = conta(vecchio, apre, chiude), b = conta(nuovo, apre, chiude);
    if (a !== b) guai.push(`${nome}: il vecchio ne lascia aperte ${a}, il nuovo ${b}`);
  }
  const ta = tagJsx(vecchio), tb = tagJsx(nuovo);
  for (const nome of new Set([...Object.keys(ta), ...Object.keys(tb)])) {
    const a = ta[nome] || 0, b = tb[nome] || 0;
    if (a !== b) guai.push(`<${nome}>: il vecchio ne lascia aperti ${a}, il nuovo ${b}`);
  }
  if (guai.length) {
    console.log(`\n!! SBILANCIATO — hunk ${etichetta}`);
    for (const g of guai) console.log("     " + g);
    console.log("   Un pezzo sostituito deve lasciare la struttura come l'ha trovata.");
    console.log("   Se lo sbilancio e' voluto, il pezzo va allargato fino a comprendere");
    console.log("   anche la parte che lo riequilibra.");
  }
  return guai.length === 0;
}
