/* roadmap.md nasce da roadmap.html, non a mano.

   PERCHE' ESISTE QUESTO FILE. Fino a gen-5.91 la versione in markdown la
   rigeneravo con uno scriptino scritto al momento dentro il rilascio: ogni
   volta un po' diverso, e infatti sotto ogni titolo era rimasto un «__»
   vuoto — le etichette non le trovava e nessuno se n'era accorto. Uno
   strumento che vive solo dentro un comando non si puo' correggere, perche'
   la volta dopo non c'e' piu'.

   Regola che ne esce: la roadmap ha UNA sorgente (roadmap.html) e tutto il
   resto si deriva. Se le due si scrivono a mano tutte e due, il giorno che
   divergono non si sa quale delle due ha ragione. */
import { readFileSync, writeFileSync } from "fs";

const h = readFileSync("roadmap.html", "utf8");

/* il testo di un pezzo di html, senza i tag e senza gli spazi doppi che
   l'andare a capo del sorgente si porta dietro */
const testo = (s) => s
  /* i tag in linea (<b>, <em>, <code>) si tolgono SENZA lasciare uno spazio:
     mettercelo produceva «memoria.json :» e «Due versioni :», cioe' la
     punteggiatura staccata dalla parola. Solo <br> vale come spazio. */
  .replace(/<br\s*\/?>/gi, " ")
  .replace(/<[^>]+>/g, "")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/\s+/g, " ").trim();

const voci = (idElenco) => {
  const blocco = h.split(`id="${idElenco}"`)[1] || "";
  const fine = blocco.indexOf("</section>");
  return [...(fine < 0 ? blocco : blocco.slice(0, fine))
    .matchAll(/<button[^>]*class="voce"[\s\S]*?<\/button>/g)]
    .map((m) => m[0])
    .map((b) => ({
      titolo: testo((b.match(/class="titolo"[^>]*>([\s\S]*?)<\/span>/) || [, ""])[1]),
      desc: testo((b.match(/<p class="desc">([\s\S]*?)<\/p>/) || [, ""])[1]),
      /* le etichette: erano queste che il vecchio scriptino non trovava */
      tag: [...b.matchAll(/<span class="tag [^"]*">([\s\S]*?)<\/span>/g)].map((t) => testo(t[1])),
    }));
};

const dd = [...h.matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)]
  .map((m) => [testo(m[1]), testo(m[2])]);
const quando = testo((h.match(/class="occhiello">([\s\S]*?)<\/p>/) || [, ""])[1])
  .replace(/^Supply Chain Pro · /, "");
const cucina = (dd.find(([t]) => /cucina/i.test(t))?.[1] || "").match(/gen-5\.\d+/)?.[0] || "?";

const difetti = voci("lista-difetti");
const altro = voci("lista-altro");
let n = 0;
const scheda = (v) => `### ${++n}. ${v.titolo}\n\n` +
  (v.tag.length ? `_${v.tag.join(" · ")}_\n\n` : "") + `${v.desc}\n`;

const md = [
  "# Supply Chain Pro · scegli l'ordine dei lavori",
  "",
  `_${quando.charAt(0).toUpperCase() + quando.slice(1)} · in cucina gira **${cucina}**_`,
  "",
  "> **Per scegliere:** rispondimi in chat con i numeri nell'ordine che vuoi.",
  "",
  "## Dove siamo adesso",
  "",
  ...dd.flatMap(([t, d]) => [`**${t}** — ${d}`, ""]),
  "---",
  "",
  /* zero difetti non e' un caso da nascondere: e' la notizia. Il titolo lo
     dice, invece di lasciare una sezione vuota che sembra un errore. */
  ...(difetti.length
    ? [`## ${difetti.length === 1 ? "Il difetto da scegliere" : "I difetti da scegliere"}`, "",
       ...difetti.map(scheda)]
    : ["## Difetti da scegliere: nessuno", "",
       "Quelli del consiglio sono chiusi, e con loro i due trovati strada facendo.", ""]),
  "---",
  "",
  "## Le migliorie da scegliere",
  "",
  ...altro.map(scheda),
].join("\n");

writeFileSync("roadmap.md", md.replace(/\n{3,}/g, "\n\n"));
console.log(`roadmap.md: ${difetti.length} difetti, ${altro.length} migliorie, cucina ${cucina}`);
const vuote = [...difetti, ...altro].filter((v) => !v.titolo || !v.desc || !v.tag.length);
if (vuote.length) { console.error("KO  voci senza titolo, testo o etichette:", vuote); process.exit(1); }
