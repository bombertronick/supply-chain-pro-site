import React, { useState, useEffect, useRef } from "react";
import {
  Home, Package, Boxes, Building2, Users, Ruler, Tag, Truck, Plus, Pencil,
  Trash2, Check, X, LogOut, Cloud, CloudOff, RefreshCw, Delete, Lock,
  Sparkles, ClipboardList, ChevronRight, AlertTriangle, FlaskConical,
  Store, ShieldCheck, ArrowLeft, Database, Copy, Upload, Download,
  RotateCcw, History, Save, CheckCheck, KeyRound, UserPlus, Send, Clock,
  BarChart3, TrendingUp, ArrowLeftRight, FileSpreadsheet, PackageCheck, Search, PackageMinus,
  Minus, Gauge, Zap, Gamepad2,
} from "lucide-react";

/* ═══════════════ SUPPLY CHAIN PRO · Gen 1 ═══════════════
   Fondamenta: sync real-time, profili+PIN, shell, CRUD admin.
   Gen 2: prodotti/conversioni, magazzini, conteggi operatore.
   Gen 3: laboratorio, report ordini, backup condivisibile.
   Gen 4: analisi, storico movimenti (kardex), trasferimenti
   fra magazzini ed esportazione CSV.                        */

/* ─────────── TOKEN DI DESIGN (stile Gemini) ─────────── */
const T = {
  bg: "#F4F7FE", sup: "#FFFFFF", bordo: "#E4E9F5",
  ink: "#1B2440", dim: "#5D6B8A", tenue: "#6C7899",
  blu: "#4C8DF6", viola: "#8A63F4", rosa: "#D96AC0",
  verde: "#2FA97C", ambra: "#E8A13C", rosso: "#E25C77", ciano: "#22B8CF", parziale: "#7A6FF0",
  grad: "linear-gradient(135deg,#4C8DF6 0%,#8A63F4 55%,#D96AC0 110%)",
};
const PALETTE = ["#4C8DF6", "#8A63F4", "#D96AC0", "#2FA97C", "#E8A13C", "#E25C77", "#22B8CF", "#7A6FF0"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
html,body{overflow-x:hidden;max-width:100%;overscroll-behavior:none}
/* su iOS la barra del browser compare e scompare: 100dvh segue quel movimento,
   100% no, e il fondo della pagina finiva sotto la barra. Il primo valore resta
   come riserva per i browser che dvh non lo conoscono. */
html,body,#root{height:100%;height:100dvh}
.sc-root{font-family:'Plus Jakarta Sans',system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
.sc-scroll::-webkit-scrollbar{width:8px;height:8px}
.sc-scroll::-webkit-scrollbar-thumb{background:#D6DEF0;border-radius:99px}
.sc-scroll::-webkit-scrollbar-track{background:transparent}
@keyframes scFade{from{opacity:0}to{opacity:1}}
@keyframes scPop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
@keyframes scSu{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
@keyframes scShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
@keyframes scGira{to{transform:rotate(360deg)}}
@keyframes scBlob{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-24px) scale(1.12)}}
@keyframes scPulsa{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes scRiempiX{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes scScorriX{0%{left:2px}50%{left:calc(100% - 14px)}100%{left:2px}}
@keyframes scSaliGiu{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
@keyframes scConta{0%{transform:scale(.55);opacity:0}55%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
@keyframes scFesta{0%{transform:translate(0,0) rotate(0deg) scale(1);opacity:1}100%{transform:translate(var(--fx),var(--fy)) rotate(var(--fr)) scale(.5);opacity:0}}
@keyframes scBrillio{0%,42%{transform:translateX(-130%)}100%{transform:translateX(340%)}}
@keyframes scLampo{0%{box-shadow:0 0 0 0 rgba(47,169,124,.55)}100%{box-shadow:0 0 0 16px rgba(47,169,124,0)}}
@keyframes scTocco{0%{box-shadow:inset 0 0 0 2px rgba(76,141,246,.95)}70%{box-shadow:inset 0 0 0 2px rgba(76,141,246,.55)}100%{box-shadow:inset 0 0 0 2px rgba(76,141,246,0)}}
@keyframes scVola{0%{opacity:0;transform:translateY(14px) scale(.7)}22%{opacity:1;transform:translateY(-4px) scale(1.08)}100%{opacity:0;transform:translateY(-54px) scale(1)}}
@keyframes scTraguardo{0%{transform:scale(1)}35%{transform:scale(1.22)}100%{transform:scale(1)}}
@keyframes scFormiche{to{stroke-dashoffset:-24}}
.sc-fade{animation:scFade .4s ease}
.sc-pop{animation:scPop .3s ease backwards}
.sc-su{animation:scSu .38s cubic-bezier(.2,.9,.3,1) backwards}
/* Da md in su i fogli lasciano libera la fascia dell'intestazione, che da
   gen-5.72 sta sopra di loro. Sul telefono non serve: li' il foglio e' ancorato
   in basso e parte gia' sotto. */
/* La fascia dell'intestazione resta libera a QUALUNQUE larghezza. Da gen-5.72
   l'intestazione sta sopra i fogli, e sul telefono le avevo lasciato solo tre
   pixel di margine: 68 contro 65, misurati in un browser senza barre. Sul
   telefono vero — con la barra dell'indirizzo e la tacca — quei tre pixel non
   ci sono, e il titolo della scheda finiva sotto l'intestazione. Segnalato con
   una fotografia, non trovato da me.
   L'altezza massima adesso e' il 100% del riquadro GIA' scontato della fascia,
   non una percentuale di vh: sul telefono vh conta anche la parte coperta
   dalla barra del browser, ed e' proprio li' che il conto sbagliava.
   La fascia e' 5rem, non 4,2: con 4,2 il margine tornava a essere di due pixel,
   e un margine di due pixel non e' un margine. */
.sc-foglio{padding-top:calc(5rem + env(safe-area-inset-top))}
.sc-foglio>.sc-su{max-height:100%}
@media (min-width:768px){
  .sc-foglio{padding-bottom:2rem}
}
.sc-shake{animation:scShake .4s ease}
.sc-gira{animation:scGira 1.2s linear infinite}
.sc-conta{animation:scConta .34s cubic-bezier(.3,1.4,.5,1) both}
.sc-tocco{animation:scTocco 1.3s ease both}
.sc-vola{animation:scVola 1.25s cubic-bezier(.2,.8,.3,1) both}
.sc-traguardo{animation:scTraguardo .7s cubic-bezier(.3,1.5,.5,1) both}
.sc-formiche{animation:scFormiche .9s linear infinite}
button{cursor:pointer;transition:transform .16s cubic-bezier(.34,1.56,.64,1)}
button:active{transform:scale(.94)}
button:focus-visible,input:focus-visible,select:focus-visible,[role=button]:focus-visible{outline:3px solid #4C8DF680;outline-offset:2px}
input,select{font-family:inherit}
@media (prefers-reduced-motion: reduce){*{animation-duration:.001s!important;transition-duration:.001s!important}}
`;

/* ─────────── UTILITÀ ─────────── */
const uid = (p = "x") => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const fmtQ = (n) => Number((+n).toFixed(2)).toLocaleString("it-IT");
const tempoFa = (t) => {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "adesso";
  if (s < 3600) return `${Math.floor(s / 60)} min fa`;
  if (s < 86400) return `${Math.floor(s / 3600)} h fa`;
  return new Date(t).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};
async function hashPin(pin) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("scp·" + pin));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    let h = 5381;
    for (const c of "scp·" + pin) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
    return "f" + h.toString(16);
  }
}
const clona = (o) => (typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

const RUOLI = {
  admin: { nome: "Admin", colore: T.viola, icona: ShieldCheck },
  laboratorio: { nome: "Laboratorio", colore: T.ciano, icona: FlaskConical },
  operatore: { nome: "Operatore", colore: T.blu, icona: Store },
};
const TIPI_MAG = {
  "linea-lab": { nome: "Linea · rifornita dal laboratorio", breve: "Linea → Lab", colore: T.ciano },
  "linea-retro": { nome: "Linea · rifornita dal retro", breve: "Linea → Retro", colore: T.blu },
  retro: { nome: "Magazzino retro", breve: "Retro", colore: T.ambra },
  laboratorio: { nome: "Magazzino laboratorio", breve: "Laboratorio", colore: T.viola },
};

/* ─────────── ARCHIVIAZIONE E SINCRONIZZAZIONE ───────────
   Un'unica chiave condivisa. Ogni scrittura ri-legge lo stato
   remoto e applica la mutazione sul più recente (rev crescente):
   la finestra di conflitto si riduce a pochi ms.              */
const CHIAVE = "scp:stato:v1";
/* ─────────── LA SPIA LEGGERA ───────────
   Difetto n.6 del consiglio del 2 agosto: «lo storico dei movimenti viaggia
   intero ogni tre secondi». Guardando il ciclo, il peso non era il vero
   problema: il problema era che ogni telefono riscaricava lo stato INTERO
   ogni tre secondi anche quando non era cambiato niente, e solo dopo
   confrontava il numero di revisione. Misurato il 3 agosto sui dati veri:
   169 KB di stato, di cui 81 KB di soli movimenti — cioe' quasi la meta' — e
   quel pacchetto partiva venti volte al minuto per ogni telefono acceso. Fa
   piu' di un giga e mezzo di dati mobili per turno, per persona.
   Adesso accanto allo stato c'e' una chiave che contiene SOLO il numero di
   revisione, venti byte. Il ciclo chiede quella; lo stato intero si scarica
   solo quando c'e' davvero qualcosa di nuovo.
   Due cose che tengono in piedi la cosa anche quando va storta: la spia si
   scrive DOPO lo stato — se fallisce, gli altri telefoni non perdono niente,
   perche' comunque ogni dieci giri si fa una lettura piena — e se la spia non
   c'e' o non si legge, si torna esattamente al comportamento di prima. Una
   scorciatoia che quando si rompe smette di far vedere le novita' sarebbe
   peggio del peso che toglie. */
const CHIAVE_REV = "scp:rev:v1";
const MAX_GIRI_MAGRI = 10;        /* dopo dieci giri leggeri, uno pieno comunque */
const haStorage = () => typeof window !== "undefined" && !!window.storage;

async function leggiRemoto() {
  try {
    const r = await window.storage.get(CHIAVE, true);
    return r && r.value ? JSON.parse(r.value) : null;
  } catch { return null; }
}
async function revRemota() {
  try {
    const r = await window.storage.get(CHIAVE_REV, true);
    const n = r && r.value != null ? Number(r.value) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
}
async function scriviRemoto(stato) {
  try {
    const r = await window.storage.set(CHIAVE, JSON.stringify(stato), true);
    if (!r) return false;
    try { await window.storage.set(CHIAVE_REV, String(stato.rev || 0), true); } catch {}
    return true;
  } catch { return false; }
}

/* ─────────── DATI DIMOSTRATIVI (primo avvio) ─────────── */
async function creaSeed() {
  const U = (id, nome, simbolo) => ({ id, nome, simbolo });
  const unita = [
    U("u-kg", "Chilogrammo", "kg"), U("u-g", "Grammo", "g"), U("u-lt", "Litro", "lt"),
    U("u-pz", "Pezzo", "pz"), U("u-cassa", "Cassa", "cassa"), U("u-vasc", "Vaschetta", "vasc"),
    U("u-sacco", "Sacco", "sacco"), U("u-bott", "Bottiglia", "bott"), U("u-conf", "Confezione", "conf"),
  ];
  const categorie = [
    { id: "cat-freschi", nome: "Freschi", colore: "#2FA97C" },
    { id: "cat-secchi", nome: "Secchi", colore: "#E8A13C" },
    { id: "cat-bevande", nome: "Bevande", colore: "#4C8DF6" },
    { id: "cat-consumo", nome: "Consumabili", colore: "#8A63F4" },
  ];
  const fornitori = [
    { id: "for-agri", nome: "AgriFresh S.r.l." },
    { id: "for-case", nome: "Caseificio Bianchi" },
    { id: "for-beva", nome: "BevaExpress" },
    { id: "for-horeca", nome: "Horeca Supply" },
  ];
  // conv: 1 <unità> = fattore × unità base del prodotto
  const P = (id, nome, categoriaId, fornitoreId, uomBase, conv, uomLavorazione, uomFornitore, uomFornitoreDiretto) =>
    ({ id, nome, categoriaId, fornitoreId, uomBase, conv, uomLavorazione, uomFornitore, uomFornitoreDiretto });
  const prodotti = [
    P("p-pomo", "Pomodori San Marzano", "cat-freschi", "for-agri", "u-kg",
      { "u-cassa": 6, "u-vasc": 1.5, "u-g": 0.001 }, "u-vasc", "u-cassa", "u-cassa"),
    P("p-mozz", "Mozzarella fiordilatte", "cat-freschi", "for-case", "u-kg",
      { "u-pz": 0.125, "u-vasc": 3, "u-g": 0.001 }, "u-vasc", "u-kg", "u-kg"),
    P("p-basi", "Basilico fresco", "cat-freschi", "for-agri", "u-kg",
      { "u-g": 0.001, "u-vasc": 0.25 }, "u-vasc", "u-kg", "u-kg"),
    P("p-fari", "Farina 00", "cat-secchi", "for-horeca", "u-kg",
      { "u-sacco": 25 }, "u-kg", "u-sacco", "u-sacco"),
    P("p-olio", "Olio EVO", "cat-secchi", "for-horeca", "u-lt",
      { "u-bott": 1, "u-sacco": 5 }, "u-lt", "u-bott", "u-bott"),
    P("p-caff", "Caffè in grani", "cat-bevande", "for-beva", "u-kg",
      { "u-conf": 1 }, "u-kg", "u-conf", "u-conf"),
    P("p-acqua", "Acqua naturale 1L", "cat-bevande", "for-beva", "u-pz",
      { "u-cassa": 12 }, "u-pz", "u-cassa", "u-cassa"),
    P("p-tova", "Tovaglioli", "cat-consumo", "for-horeca", "u-pz",
      { "u-conf": 100 }, "u-pz", "u-conf", "u-conf"),
  ];
  const sedi = [
    { id: "sede-lab", nome: "Laboratorio Centrale", tipo: "laboratorio" },
    { id: "sede-tc", nome: "Trattoria Centro", tipo: "operatore", labSedeId: "sede-lab" },
    { id: "sede-bs", nome: "Bistrot Stazione", tipo: "operatore", labSedeId: "sede-lab" },
  ];
  const A = (prodottoId, uomId, par, qty) => ({ prodottoId, uomId, par, qty });
  const magazzini = [
    { id: "mag-lab", sedeId: "sede-lab", nome: "Magazzino Laboratorio", tipo: "laboratorio", articoli: [
      A("p-pomo", "u-cassa", 20, 18), A("p-mozz", "u-kg", 50, 41), A("p-basi", "u-kg", 3, 2.2),
      A("p-fari", "u-sacco", 10, 8), A("p-olio", "u-lt", 40, 31),
    ]},
    { id: "mag-tc-cuc", sedeId: "sede-tc", nome: "Linea Cucina", tipo: "linea-lab", articoli: [
      A("p-pomo", "u-vasc", 12, 9), A("p-mozz", "u-pz", 40, 26), A("p-basi", "u-g", 600, 380),
    ]},
    { id: "mag-tc-retro", sedeId: "sede-tc", nome: "Magazzino Retro", tipo: "retro", articoli: [
      A("p-acqua", "u-cassa", 10, 7), A("p-caff", "u-kg", 12, 9), A("p-tova", "u-conf", 20, 14),
    ]},
    { id: "mag-tc-bar", sedeId: "sede-tc", nome: "Linea Bar", tipo: "linea-retro", rifMagazzinoId: "mag-tc-retro", articoli: [
      A("p-acqua", "u-pz", 48, 30), A("p-caff", "u-kg", 4, 2.5), A("p-tova", "u-pz", 300, 180),
    ]},
    { id: "mag-bs-cuc", sedeId: "sede-bs", nome: "Linea Cucina", tipo: "linea-lab", articoli: [
      A("p-pomo", "u-vasc", 8, 6), A("p-mozz", "u-pz", 24, 20),
    ]},
    { id: "mag-bs-retro", sedeId: "sede-bs", nome: "Magazzino Retro", tipo: "retro", articoli: [
      A("p-acqua", "u-cassa", 6, 5), A("p-tova", "u-conf", 12, 10),
    ]},
    { id: "mag-bs-bar", sedeId: "sede-bs", nome: "Linea Bar", tipo: "linea-retro", rifMagazzinoId: "mag-bs-retro", articoli: [
      A("p-acqua", "u-pz", 36, 28), A("p-tova", "u-pz", 200, 160),
    ]},
  ];
  const profili = [
    { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: await hashPin("1234") },
    { id: "pr-giulia", nome: "Giulia", ruolo: "laboratorio", sedeId: "sede-lab", colore: "#22B8CF", pinHash: await hashPin("1111") },
    { id: "pr-marco", nome: "Marco", ruolo: "operatore", sedeId: "sede-tc", magazziniIds: ["mag-tc-cuc", "mag-tc-bar"], colore: "#4C8DF6", pinHash: await hashPin("2222") },
    { id: "pr-sara", nome: "Sara", ruolo: "operatore", sedeId: "sede-bs", magazziniIds: ["mag-bs-cuc", "mag-bs-bar"], colore: "#D96AC0", pinHash: await hashPin("3333") },
  ];
  return {
    rev: 1, mtime: Date.now(), avvisoDemo: true,
    unita, categorie, fornitori, prodotti, sedi, magazzini, profili,
    richieste: [], ordini: [], codici: [], accessi: [], movimenti: [],
    log: [{ id: uid("l"), t: Date.now(), chi: "Sistema", msg: "Ambiente demo inizializzato" }],
  };
}

/* ─────────── AIUTI SUL DOMINIO ─────────── */
const trova = (arr, id) => arr.find((x) => x.id === id);
const simboloU = (stato, id) => trova(stato.unita, id)?.simbolo || "?";
const fattore = (prod, uomId) => (uomId === prod.uomBase ? 1 : prod.conv?.[uomId] ?? null);
function converti(prod, qty, daUom, aUom) {
  const fDa = fattore(prod, daUom), fA = fattore(prod, aUom);
  if (fDa == null || fA == null) return null;
  return (qty * fDa) / fA;
}
/* ─────────── GASTRONORM: QUELLO CHE NON È OPINIONE ───────────
   «GN 1/6» vuol dire un sesto di una teglia intera: sta scritto nel nome.
   Quindi 1 GN 1/3 = 2 GN 1/6 sempre, in ogni cucina del mondo, e chiedere
   a Valerio di misurarlo sarebbe farlo lavorare per niente. Il peso invece
   dipende da cosa ci metti dentro, e quello va pesato. */
const gnFrazione = (sym) => {
  const m = /^gn\s*(\d+)\s*\/\s*(\d+)$/.exec((sym || "").trim().toLowerCase());
  if (!m) return null;
  const n = +m[1], d = +m[2];
  return d > 0 && n > 0 ? n / d : null;
};
/* L'ancora del peso è un numero di Valerio, non mio: sulle Patate forno ha
   scritto 1 kg = 0,6 GN 1/3, cioè una teglia da un terzo pesa 1,667 kg e una
   intera 5 kg. Da lì scendono tutte le proposte di peso, in proporzione. */
const KG_PER_GN_INTERA = 5;

/* Cosa manca, e come lo si chiede a chi sta in cucina. Ogni casella tenuta
   in un'unità diversa dalla base del prodotto, senza il fattore che le lega,
   diventa una riga qui. */
function coppieConv(stato) {
  const viste = new Set(), out = [];
  for (const m of stato.magazzini) for (const a of m.articoli || []) {
    const p = trova(stato.prodotti, a.prodottoId);
    if (!p || a.uomId === p.uomBase) continue;
    const f = fattore(p, a.uomId);
    /* Entra chi il fattore non ce l'ha, ma anche chi ce l'ha solo perché
       gliel'ho proposto io: finché nessuno l'ha pesato resta da rivedere, e
       deve poterlo fare da qui invece che prodotto per prodotto. */
    if (f != null && !convStimata(p, a.uomId)) continue;
    const k = p.id + "|" + a.uomId;
    if (viste.has(k)) continue;
    viste.add(k);
    out.push({ chiave: k, prod: p, uomId: a.uomId, corrente: f, ...domandaConv(stato, p, a.uomId) });
  }
  return out.sort((x, y) => (x.prod.nome || "").localeCompare(y.prod.nome || ""));
}
/* La domanda giusta è quella a cui si sa rispondere a occhio. «Quanti pezzi
   stanno in un chilo» non lo sa nessuno; «quanto pesa un supplì» lo sanno
   tutti. Il fattore vero lo ricava l'app. */
function domandaConv(stato, prod, uomId) {
  const symA = simboloU(stato, uomId), symB = simboloU(stato, prod.uomBase);
  const fA = gnFrazione(symA), fB = gnFrazione(symB);
  if (fA != null && fB != null) return {
    tipo: "gn", esatta: true, unita: symB, decimali: 3,
    etichetta: `1 ${symA} = quante ${symB}`,
    proposta: fA / fB, nota: "geometria della teglia, non serve pesare",
  };
  if (fB != null && /^kg$/i.test(symA)) return {
    tipo: "kg-teglia", esatta: false, unita: "kg", decimali: 2,
    etichetta: `quanti kg stanno in 1 ${symB}`,
    proposta: KG_PER_GN_INTERA * fB, nota: "stimato in proporzione alle Patate forno",
  };
  if (/^(pz|pezzo)$/i.test(symB) && /^kg$/i.test(symA)) return {
    tipo: "g-pezzo", esatta: false, unita: "g", decimali: 0,
    etichetta: "quanto pesa 1 pezzo, in grammi",
    proposta: 100, nota: "stimato: da correggere con la bilancia",
  };
  return { tipo: "libero", esatta: false, unita: symB, decimali: 3,
    etichetta: `1 ${symA} = quante ${symB}`, proposta: null, nota: null };
}
/* dalla risposta del cuoco al fattore che l'app userà davvero */
function convDaRisposta(tipo, v) {
  if (!(v > 0)) return null;
  if (tipo === "kg-teglia") return 1 / v;      // 1 kg = 1/v teglie
  if (tipo === "g-pezzo") return 1000 / v;     // 1 kg = 1000/v pezzi
  return v;
}
/* e all'indietro, per rimettere in campo un fattore già salvato nella forma
   in cui era stato scritto */
function rispostaDaConv(tipo, f) {
  if (!(f > 0)) return null;
  if (tipo === "kg-teglia") return 1 / f;
  if (tipo === "g-pezzo") return 1000 / f;
  return f;
}
/* le conversioni che l'app ha proposto e nessuno ha ancora confermato con una
   bilancia: restano marcate finché qualcuno non le tocca */
const convStimata = (prod, uomId) => (prod?.convStim || []).includes(uomId);

/* Previsto per giorno: la scorta ideale di una cucina cambia col giorno
   della settimana (idea ereditata da Cucina ERP v10.6). parGiorni = {0..6}
   con 0 = domenica; vuoto = si usa il par standard. */
const parOggi = (a) => {
  const g = new Date().getDay();
  return a.parGiorni && a.parGiorni[g] != null ? a.parGiorni[g] : a.par;
};
const sottoScorta = (m) => m.articoli.filter((a) => a.qty < parOggi(a)).length;

/* ── L'ORDINE DELLE LISTE (gen-5.93) ──
   Chiesto da Valerio: «quando seleziono un prodotto tra le scelte ho bisogno
   di vedere le scelte con una visualizzazione ordinata». Misurato prima di
   correggere: NESSUN punto di scelta ordinava — ogni lista usciva nell'ordine
   in cui i prodotti erano stati creati, che per chi legge e' il caso.
   La regola, una sola per tutta l'app:
   · i PRODOTTI in alfabeto italiano (localeCompare "it"), dentro i gruppi di
     categoria dove i gruppi ci sono;
   · i MAGAZZINI per sede (nell'ordine di stato.sedi) e per nome;
   · le CATEGORIE restano nell'ordine di stato.categorie: quello e' una scelta
     di chi le ha create, usata identica in tutta l'app — alfabetizzarla
     romperebbe un ordine voluto. Le unita' di misura restano com'erano per lo
     stesso motivo: poche, e in un ordine abituale. */
const perNomeIt = (a, b) => (a?.nome || "").localeCompare(b?.nome || "", "it", { sensitivity: "base" });
const ordinaPerNome = (lista) => [...lista].sort(perNomeIt);
const articoliPerNome = (stato, arts) => [...arts].sort((x, y) =>
  (trova(stato.prodotti, x.prodottoId)?.nome || "").localeCompare(
    trova(stato.prodotti, y.prodottoId)?.nome || "", "it", { sensitivity: "base" }));
const magazziniPerSede = (stato, mags) => [...mags].sort((a, b) =>
  stato.sedi.findIndex((x) => x.id === a.sedeId) - stato.sedi.findIndex((x) => x.id === b.sedeId)
  || perNomeIt(a, b));
/* per le tendine di prodotti: gruppi per categoria (optgroup nativi, che il
   telefono mostra come intestazioni), alfabeto dentro ogni gruppo */
function gruppiProdotto(stato, prodotti) {
  const byCat = {};
  for (const p of prodotti) (byCat[p.categoriaId] = byCat[p.categoriaId] || []).push(p);
  const gruppi = [];
  for (const c of stato.categorie) if (byCat[c.id]) {
    gruppi.push({ nome: c.nome, opzioni: ordinaPerNome(byCat[c.id]).map((x) => ({ id: x.id, nome: x.nome })) });
    delete byCat[c.id];
  }
  const resto = Object.values(byCat).flat();
  if (resto.length) gruppi.push({ nome: "Senza categoria", opzioni: ordinaPerNome(resto).map((x) => ({ id: x.id, nome: x.nome })) });
  return gruppi;
}

/* raggruppa articoli per categoria merceologica, nell'ordine di stato.categorie */
function perCategoria(stato, arts) {
  const byCat = {};
  for (const a of arts) {
    const cid = trova(stato.prodotti, a.prodottoId)?.categoriaId || "_";
    (byCat[cid] = byCat[cid] || []).push(a);
  }
  const gruppi = [];
  for (const c of stato.categorie) if (byCat[c.id]) gruppi.push({ cat: c, arts: articoliPerNome(stato, byCat[c.id]) });
  if (byCat["_"]) gruppi.push({ cat: null, arts: articoliPerNome(stato, byCat["_"]) });
  return gruppi;
}
function IntestaCat({ cat, n }) {
  const col = cat?.colore || T.viola;
  return (
    <div className="flex items-center gap-2 mt-1 mb-0.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col }} />
      <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: col }}>{cat?.nome || "Senza categoria"}</span>
      <span className="text-xs font-bold" style={{ color: T.tenue }}>{n}</span>
      <div className="flex-1 h-px" style={{ background: T.bordo }} />
    </div>
  );
}

/* ─────────── GEN 4 · MOVIMENTI (KARDEX) E CSV ───────────
   Ogni variazione di giacenza lascia una traccia: chi, quando,
   quanto e perché. Lo storico è condiviso e limitato alle
   ultime 400 righe per tenere leggero lo stato sincronizzato. */
/* Cosa conta come «uscita vera»: la merce che se n'è andata perché è stata
   usata, non quella che si è spostata da un magazzino all'altro. */
/* «consumo» sta qui dentro e non e' un dettaglio: la farina finita in una
   breccola e' uscita davvero, esattamente come quella contata in linea. Se
   restasse fuori, le soglie consigliate della farina guarderebbero solo gli
   scarti e i conteggi — cioe' quasi niente — e continuerebbero a proporre
   livelli troppo bassi per il magazzino che alimenta il laboratorio. */
const USCITE_STORICO = new Set(["conteggio", "prelievo", "evasione", "scarto", "consumo"]);
const CAUSALI = {
  rettifica: { nome: "Rettifica manuale", colore: T.blu },
  conteggio: { nome: "Conteggio linea", colore: T.viola },
  prelievo: { nome: "Prelievo per linea", colore: T.ambra },
  carico: { nome: "Carico da rifornimento", colore: T.verde },
  evasione: { nome: "Evasione richiesta", colore: T.ciano },
  ricezione: { nome: "Ricezione ordine", colore: T.verde },
  "trasf-out": { nome: "Trasferimento in uscita", colore: T.rosa },
  "trasf-in": { nome: "Trasferimento in entrata", colore: T.verde },
  articolo: { nome: "Impostazione articolo", colore: T.tenue },
  scarto: { nome: "Scarto / spreco", colore: T.rosso },
  plancia: { nome: "Plancia rapida", colore: T.ciano },
  produzione: { nome: "Prodotto in laboratorio", colore: T.verde },
  consumo: { nome: "Usato per produrre", colore: T.ambra },
  /* gen-5.96: lo scarico da vendita in cassa. NON sta in USCITE_STORICO, di
     proposito e con i numeri: a 100 scontrini al giorno sono ~250 uscite/dì,
     il tetto delle 2000 si riempirebbe in 8 giorni buttando via proprio i
     conteggi e i prelievi che nutrono le soglie consigliate (che per parlare
     devono vedere due volte lo stesso giorno della settimana). Le vendite
     hanno il loro secchio in sfoltisciMov, e le soglie per ora NON le
     vedono: e' dichiarato, non dimenticato. */
  vendita: { nome: "Vendita in cassa", colore: T.blu },
};
/* I movimenti non servono tutti alla stessa cosa, e trattarli allo stesso
   modo costava caro due volte.
   Le USCITE vere — conteggi, prelievi, evasioni, scarti — sono la materia
   prima delle soglie consigliate, che per parlare devono vedere lo stesso
   giorno della settimana ripetersi almeno due volte, quindi guardano indietro
   otto settimane. Tutto il resto (carichi, ricezioni, rettifiche) serve solo
   allo storico della singola casella e al grafico di due settimane.
   Prima c'era un tetto unico a 400. In questa cucina si fanno una sessantina
   di movimenti al giorno: il tetto si riempiva in meno di una settimana e
   buttava via proprio lo storico delle uscite, che così non arrivava MAI a
   vedere due volte lo stesso giorno. Le soglie consigliate non potevano
   accendersi nemmeno in teoria.
   Ora i tetti sono due.

   ── CORREZIONE DEL 3 AGOSTO, con i numeri veri sotto gli occhi ──
   Qui c'era scritto che «le uscite sono meno del 3% del traffico». Non e'
   vero, ed e' il tipo di frase che fa dormire tranquilli sul conto sbagliato.
   Misurato sullo stato in produzione: 390 movimenti in sei giorni, di cui
   140 uscite — il 36%, e i soli conteggi sono il 25%. A quel ritmo, in otto
   settimane, le uscite diventano circa milletrecento righe.
   Sulle uscite non c'era NESSUN tetto di numero, solo di eta'. In una
   giornata storta — un inventario che tocca ogni articolo — se ne scrivono
   quante ne vuole senza che niente le fermi. Adesso un tetto c'e', ma alto
   apposta: a duemila non tocca il funzionamento normale (milletrecento), e
   morde solo il caso patologico. Non e' un modo per far dimagrire il
   pacchetto — quello si e' fatto altrove, con la spia leggera qui sopra — e'
   un parapetto perche' una cosa senza limite prima o poi lo trova da sola.
   Il numero non si abbassa senza guardare le soglie consigliate: sotto le
   otto settimane smettono di vedere due volte lo stesso giorno e tacciono. */
const SETT_USCITE = 56;          // giorni di storico uscite che servono alle soglie
const MAX_ALTRI_MOV = 250;       // il resto: quanto basta a storico e grafico
const MAX_USCITE_MOV = 2000;     // parapetto: sopra il fabbisogno vero (~1300)
const GIORNI_MOV_VENDITA = 14;   // al kardex e al grafico bastano; le soglie non le usano
const MAX_MOV_VENDITA = 600;     // ~100 scontrini/di' × 2,5 righe × qualche giorno
/* Quante modifiche gia' registrate lo stato si ricorda (gen-5.81). Serve a
   non contare due volte un salvataggio arrivato di cui si e' persa la
   risposta. Trecento nomi sono circa 4KB su uno stato di 165KB: sotto il
   tre per cento. Non puo' crescere senza tetto, se no diventa il peso che a
   gen-5.77 abbiamo appena tolto dal traffico. Sotto il tetto ci sta un
   turno intero di lavoro di tutta la rete, e un rinvio arriva entro
   qualche secondo: nessun rinvio vero puo' trovare il suo nome scaduto. */
const MAX_APPLICATE = 300;
function sfoltisciMov(lista) {
  const limite = Date.now() - SETT_USCITE * 86400000;
  const limiteVen = Date.now() - GIORNI_MOV_VENDITA * 86400000;
  const out = [];
  let altri = 0, uscite = 0, vendite = 0;
  for (const mv of lista) {
    if (USCITE_STORICO.has(mv.causale) && mv.delta < 0) {
      if (mv.t >= limite && uscite < MAX_USCITE_MOV) { out.push(mv); uscite++; }
    } else if (mv.causale === "vendita") {
      /* il secchio della cassa (gen-5.96): dentro il tetto delle uscite le
         vendite avrebbero affogato i conteggi in otto giorni */
      if (mv.t >= limiteVen && vendite < MAX_MOV_VENDITA) { out.push(mv); vendite++; }
    } else if (altri < MAX_ALTRI_MOV) { out.push(mv); altri++; }
  }
  return out;
}
function registraMov(s, { magId, prodottoId, uomId, delta, dopo, causale, chi, rif }) {
  if (Math.abs(delta) < 1e-9) return;
  s.movimenti = sfoltisciMov([{
    id: uid("mv"), t: Date.now(), magId, prodottoId, uomId,
    delta: +(+delta).toFixed(4), dopo: +(+dopo).toFixed(4), causale, chi: chi || "—", rif,
  }, ...(s.movimenti || [])]);
}
/* ─────────── LA FINESTRA DEGLI ORDINI ───────────
   Gli ordini non venivano sfoltiti mai: nessuno perdeva niente, ma la lista
   cresceva senza fine e a ogni scrittura viaggia intera sul telefono della
   cucina. Le righe ANCORA DA FARE non si toccano mai — sono lavoro, non
   archivio. Di quelle chiuse (ordinate, ricevute) si tengono 45 giorni e al
   massimo 150 righe: a 328 byte per riga sono cinquanta kilobyte nel caso
   peggiore, su uno stato che oggi ne pesa centoquindici. È oltre il mese
   chiesto; per tenerle per sempre ci sono le esportazioni CSV in Sistema.
   Una riga senza data si tiene: non sapere quanti anni ha non è un motivo
   per buttarla. */
const GIORNI_ORDINI = 45;
const MAX_ORDINI_CHIUSI = 150;
/* Chi vede quale riga d'ordine. Stava scritta due volte dentro la vista
   Ordini; ora è una sola, perché la usa anche lo Storico ordini e se le due
   regole divergessero la stessa riga esisterebbe in una pagina e non
   nell'altra — cioè sembrerebbe sparita. */
const ordineVisibile = (profilo, o) =>
  profilo?.ruolo === "admin" ? true
    : profilo?.ruolo === "laboratorio" ? o.tipo === "lab" && o.sedeId === profilo.sedeId
    : o.tipo === "diretto" && o.sedeId === profilo.sedeId;
/* La data di una riga è quella dell'ultima cosa che le è successa: creata,
   segnata come ordinata, ricevuta. È quella che una persona ha in testa
   quando dice «l'ordine di martedì». */
const dataOrdine = (o) => o.tRicezione || o.tOrdine || o.t || 0;
/* Di una riga ricevuta conta quello che è ENTRATO davvero, non quello che era
   stato chiesto: su una consegna parziale «qty» resta l'ordinato e il mancante
   torna da ordinare in una riga nuova. Sommare qty sarebbe contarlo due volte. */
const qtyReale = (o) => (o.stato === "ricevuto" && typeof o.qtyRicevuta === "number") ? o.qtyRicevuta : o.qty;
function sfoltisciOrdini(lista) {
  const limite = Date.now() - GIORNI_ORDINI * 86400000;
  const tutte = (lista || []).filter(Boolean);
  /* Il tetto delle 150 va tolto alle più VECCHIE, non alle ultime dell'array:
     l'ordine della lista non è garantito, e sfoltire per posizione poteva
     buttare una riga di ieri tenendone una di un mese fa. */
  const chiuse = tutte.filter((o) => o.stato !== "da-ordinare" && dataOrdine(o))
    .sort((a, b) => dataOrdine(b) - dataOrdine(a));
  const tenute = new Set(chiuse.slice(0, MAX_ORDINI_CHIUSI).map((o) => o.id));
  return tutte.filter((o) => {
    if (o.stato === "da-ordinare") return true;
    const t = dataOrdine(o);
    if (!t) return true;
    /* La finestra si conta dall'ULTIMA cosa successa alla riga, non dalla sua
       nascita. Prima si guardava «o.t»: un ordine partito 50 giorni fa e
       arrivato ieri spariva dallo storico il giorno dopo la consegna. */
    if (t < limite) return false;
    return tenute.has(o.id);
  });
}
/* ─────────── LA CASSA (gen-5.96) ───────────
   La catena chiesta da Valerio il 31 agosto: cliente → cassa → scarico →
   riordino. Le regole, decise nel piano e qui incise:
   · le vendite NON si cancellano mai (lo storno, quando arrivera', sara' una
     riga contraria — mai una gomma);
   · lo scarico esce SEMPRE dal magazzino di cassa designato della sede,
     anche sotto zero: il negativo al banco e' informazione vera («hai
     venduto piu' di quanto risulta: conta»), il fallback su un altro
     magazzino sarebbe una bugia che falsifica il riordino due volte;
   · tetti dal giorno uno: lo stato viaggia INTERO a ogni scrittura (~170KB)
     e una riga di vendita pesa ~570 byte — senza tetto le vendite sarebbero
     la prima collezione della storia dell'app a crescere di 100+ righe al
     giorno. I totali sopravvivono in s.giornate; per la contabilita' lunga
     c'e' l'export CSV in Sistema, come per gli ordini.
   LIMITE DICHIARATO nel piano: bene fino a ~100 scontrini al giorno su una
   cassa sola. Oltre, la cura vera e' una chiave kv separata con append lato
   server (decisione in roadmap), non un tetto piu' furbo qui. */
const ORE_VENDITE = 48;          // lo storno realistico e' «lo scontrino di ieri sera»
const MAX_VENDITE = 300;         // parapetto sul numero, oltre che sull'eta'
const MAX_GIORNATE_SEDE = 90;    // tre mesi di totali per sede: ~13KB, sostenibili
const giornoDi = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
/* il magazzino da cui esce quello che si vende: quello designato sulla sede,
   o la prima linea della sede — dove sta fisicamente il banco */
function magCassaDi(stato, sedeId) {
  const sede = trova(stato.sedi, sedeId);
  const scelto = sede?.cassaMagId && stato.magazzini.find((m) => m.id === sede.cassaMagId && m.sedeId === sedeId);
  return scelto
    || stato.magazzini.find((m) => m.sedeId === sedeId && m.tipo.startsWith("linea"))
    || stato.magazzini.find((m) => m.sedeId === sedeId)
    || null;
}
/* Da «ho battuto queste voci» a «cosa esce, e da dove». NON tocca niente,
   come calcoloProduzione: prepara righe ridotte a id+numeri. Quello che non
   si puo' scalare (articolo assente dal magazzino di cassa, conversione
   mancante) finisce in `problemi` e NON produce righe: la vendita passa
   comunque — un banco non si ferma sullo stock — ma il buco resta scritto
   sulla riga, non nascosto. */
function calcoloScarico(stato, righeCarrello, sedeId) {
  const out = { righe: [], problemi: [], magId: null };
  const mag = magCassaDi(stato, sedeId);
  if (!mag) { out.problemi.push("Questa sede non ha un magazzino di cassa: niente scarico."); return out; }
  out.magId = mag.id;
  const somme = new Map();
  for (const rc of righeCarrello) {
    for (const ing of rc.distinta || []) {
      const ip = trova(stato.prodotti, ing.prodottoId);
      if (!ip) { out.problemi.push("Un prodotto della distinta non è più a catalogo: la voce di listino va rivista."); continue; }
      const a = (mag.articoli || []).find((x) => x.prodottoId === ing.prodottoId);
      if (!a) { out.problemi.push(`«${ip.nome}» non è nel magazzino di cassa «${mag.nome}»: non lo scalo.`); continue; }
      const serve = (+ing.qty || 0) * rc.qty;
      const q = a.uomId === ing.uomId ? serve : converti(ip, serve, ing.uomId, a.uomId);
      if (q == null) { out.problemi.push(`Manca la conversione di «${ip.nome}» verso l'unità della casella: non lo scalo.`); continue; }
      const k = ing.prodottoId;
      somme.set(k, { prodottoId: ing.prodottoId, magId: mag.id, uomId: a.uomId,
        quanto: +(((somme.get(k)?.quanto) || 0) + q).toFixed(4) });
    }
  }
  out.righe = [...somme.values()].filter((r) => r.quanto > 1e-9);
  return out;
}
function sfoltisciVendite(lista) {
  const limite = Date.now() - ORE_VENDITE * 3600000;
  return (lista || []).filter((v) => v && v.t >= limite)
    .sort((a, b) => b.t - a.t).slice(0, MAX_VENDITE);
}
/* filtro puro come sfoltisciOrdini: il tetto e' PER SEDE, se no con due sedi
   i novanta giorni diventerebbero quarantacinque */
function sfoltisciGiornate(lista) {
  const perSede = new Map();
  const ordinate = (lista || []).filter(Boolean).sort((a, b) => (b.giorno < a.giorno ? -1 : 1));
  return ordinate.filter((g) => {
    const n = perSede.get(g.sedeId) || 0;
    if (n >= MAX_GIORNATE_SEDE) return false;
    perSede.set(g.sedeId, n + 1);
    return true;
  });
}
/* L'applicazione vera, gemella di applicaProduzione: SOLO id e numeri, gia'
   calcolati fuori — id della vendita COMPRESO, perche' questa closure viene
   rieseguita a ogni riallineamento della coda e un uid() qui dentro
   diventerebbe una vendita nuova a ogni replay. Lo scarico non ha clamp:
   sul replay dopo un conflitto la scelta e' comunque stantia, e il negativo
   e' il precedente dichiarato di applicaProduzione. La giornata si aggiorna
   QUI DENTRO, cosi' l'exactly-once del logId copre vendita e totale insieme. */
function applicaVendita(s, v) {
  /* la riga nuova NON passa dal filtro d'eta': una vendita rimasta in coda
     piu' di 48 ore va applicata E vista — la fara' scadere lo sfoltimento
     successivo, non la nascita (revisione gen-5.96) */
  s.vendite = [{ ...v, stato: "registrata" }, ...sfoltisciVendite(s.vendite)].slice(0, MAX_VENDITE);
  for (const r of v.scarico || []) {
    const mm = trova(s.magazzini, r.magId);
    const aa = mm && (mm.articoli || []).find((x) => x.prodottoId === r.prodottoId);
    if (!aa) continue;
    aa.qty = +(aa.qty - r.quanto).toFixed(4);
    registraMov(s, { magId: mm.id, prodottoId: r.prodottoId, uomId: aa.uomId, delta: -r.quanto,
      dopo: aa.qty, causale: "vendita", chi: v.chi });
  }
  const idG = v.giorno + "|" + v.sedeId;
  let g = (s.giornate || []).find((x) => x.id === idG);
  if (!g) {
    g = { id: idG, giorno: v.giorno, sedeId: v.sedeId, totale: 0, nVendite: 0, nStorni: 0,
      metodi: { contanti: 0, carta: 0, altro: 0 } };
    s.giornate = [g, ...(s.giornate || [])];
  }
  g.totale = +(g.totale + v.totale).toFixed(2);
  g.nVendite += 1;
  g.metodi[v.metodo] = +((g.metodi[v.metodo] || 0) + v.totale).toFixed(2);
  s.giornate = sfoltisciGiornate(s.giornate);
}

const numCsv = (n) => String(n ?? "").replace(".", ",");
const dataIt = (t) => new Date(t).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
function scaricaCsv(nomeFile, righe) {
  const esc = (v) => { const s = String(v ?? ""); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const testo = "﻿" + righe.map((r) => r.map(esc).join(";")).join("\r\n");
  const blob = new Blob([testo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nomeFile;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

/* ─────────── GEN 5 · CATALOGO CSV (esporta + importa anagrafica) ───────────
   Un giro completo: esporta i prodotti con categoria, fornitore, unità,
   conversioni e prezzo; ri-importa lo stesso file (corretto in Excel)
   riconoscendo i prodotti per ID (o per nome). Categorie, fornitori e
   unità mancanti vengono creati al volo. Separatore «;» e decimali con
   virgola, come gli altri export. L'import è additivo: non elimina nulla. */
const CATALOGO_INTESTA = ["ID", "Nome", "Categoria", "Fornitore", "UdM base", "Prezzo", "Conversioni", "UdM lavorazione", "UdM fornitore lab", "UdM fornitore diretto"];

const convToCsv = (prod, stato) => Object.entries(prod.conv || {})
  .map(([u, f]) => `${simboloU(stato, u)}=${numCsv(f)}`).join("|");

function esportaCatalogoRighe(stato) {
  const righe = [CATALOGO_INTESTA.slice()];
  for (const p of stato.prodotti) {
    righe.push([
      p.id, p.nome,
      trova(stato.categorie, p.categoriaId)?.nome || "",
      trova(stato.fornitori, p.fornitoreId)?.nome || "",
      simboloU(stato, p.uomBase),
      p.prezzo != null && p.prezzo !== "" ? numCsv(p.prezzo) : "",
      convToCsv(p, stato),
      simboloU(stato, p.uomLavorazione),
      simboloU(stato, p.uomFornitore),
      simboloU(stato, p.uomFornitoreDiretto),
    ]);
  }
  return righe;
}

/* Parser CSV «;» con supporto ai campi fra virgolette (stile Excel). */
function parseCsvTesto(testo) {
  const t = String(testo || "").replace(/^﻿/, "");
  const righe = [];
  let campo = "", riga = [], inQ = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else inQ = false; }
      else campo += c;
    } else if (c === '"') inQ = true;
    else if (c === ";") { riga.push(campo); campo = ""; }
    else if (c === "\n") { riga.push(campo); righe.push(riga); riga = []; campo = ""; }
    else if (c === "\r") { /* ignora */ }
    else campo += c;
  }
  if (campo !== "" || riga.length) { riga.push(campo); righe.push(riga); }
  return righe.filter((r) => r.some((v) => String(v).trim() !== ""));
}

/* Applica il CSV al draft «s» (crea unità/categorie/fornitori mancanti,
   fa upsert dei prodotti per ID o nome). Ritorna un resoconto per l'anteprima.
   È puro rispetto a «s»: eseguibile su una copia per la sola anteprima. */
function applicaCatalogoCsv(s, testo) {
  const rep = { aggiornati: 0, creati: 0, catNuove: [], fornNuovi: [], unitaNuove: [], errori: [], nonToccati: [] };
  const righe = parseCsvTesto(testo);
  if (righe.length < 2) { rep.errori.push("Nessuna riga dati (serve intestazione + almeno un prodotto)"); return rep; }
  const norm = (x) => String(x || "").trim().toLowerCase();
  const intest = righe[0].map(norm);
  const col = (nomi) => { for (const n of nomi) { const i = intest.indexOf(n); if (i >= 0) return i; } return -1; };
  const cID = col(["id"]);
  const cNome = col(["nome", "prodotto"]);
  const cCat = col(["categoria"]);
  const cForn = col(["fornitore"]);
  const cBase = col(["udm base", "unità base", "unita base", "base"]);
  const cPrezzo = col(["prezzo", "prezzo (€/base)", "costo", "prezzo €"]);
  const cConv = col(["conversioni", "conversione"]);
  const cLav = col(["udm lavorazione", "lavorazione"]);
  const cFlab = col(["udm fornitore lab", "fornitore lab"]);
  const cFdir = col(["udm fornitore diretto", "fornitore diretto"]);
  if (cNome < 0) { rep.errori.push("Manca la colonna «Nome»"); return rep; }

  const perNome = (arr, nome) => arr.find((x) => norm(x.nome) === norm(nome));
  const unitaDaSimbolo = (sim) => s.unita.find((u) => norm(u.simbolo) === norm(sim) || norm(u.nome) === norm(sim));
  const creaUnita = (sim) => {
    const nome = String(sim).trim();
    const ex = unitaDaSimbolo(nome);
    if (ex) return ex.id;
    const u = { id: uid("u"), nome, simbolo: nome };
    s.unita.push(u); rep.unitaNuove.push(nome); return u.id;
  };
  const idCategoria = (nome) => {
    if (!nome || !nome.trim()) return s.categorie[0]?.id || "";
    const ex = perNome(s.categorie, nome);
    if (ex) return ex.id;
    const c = { id: uid("cat"), nome: nome.trim(), colore: PALETTE[s.categorie.length % PALETTE.length] };
    s.categorie.push(c); rep.catNuove.push(c.nome); return c.id;
  };
  const idFornitore = (nome) => {
    if (!nome || !nome.trim()) return s.fornitori[0]?.id || "";
    const ex = perNome(s.fornitori, nome);
    if (ex) return ex.id;
    const f = { id: uid("for"), nome: nome.trim() };
    s.fornitori.push(f); rep.fornNuovi.push(f.nome); return f.id;
  };

  /* ── UNA COLONNA CHE NON C'È NON È UNA COLONNA VUOTA ──
     Difetto n.3 del consiglio del 2 agosto. Un listino a due colonne
     (Nome; Prezzo) è un file legittimo — anzi, è esattamente quello che si
     ottiene ripulendo in Excel un export dell'app, cioè quello che questo
     pannello invita a fare. Prima ogni prodotto toccato da un file così
     perdeva l'unità base, TUTTE le conversioni, la categoria e il fornitore,
     e l'anteprima diceva tranquillamente «1 aggiornato, 0 errori». Da quel
     momento 4 buste di grana valevano 4 teglie invece di 12: prelievi,
     richieste e righe d'ordine uscivano tutti col numero sbagliato, e il
     magazzino continuava a mostrare numeri credibili che non volevano più
     dire niente. E non si torna indietro — lo storico fotografa le caselle
     dei magazzini, non i prodotti: serve un ripristino da backup.

     Da qui in poi vale una regola sola: SI SCRIVE SOLO QUELLO CHE IL FILE
     DICHIARA. Su un prodotto nuovo i valori di partenza ci vogliono — non c'è
     niente da rovinare — su uno che esiste già no.

     Restano fuori da questa regola due cose, e le dico invece di lasciarle
     intendere: una colonna che C'È ma con la casella vuota resta autorevole
     (vuol dire «questo prodotto non ha conversioni», non «non lo so»), e il
     prezzo si comporta come si è sempre comportato — una casella vuota lo
     lascia com'è. L'unica eccezione è «UdM base»: una casella vuota lì non
     può voler dire «nessuna unità», perché ogni prodotto ne ha una, quindi si
     tiene quella di adesso e lo si scrive negli avvisi. */
  const NOTE = [[cCat, "categoria"], [cForn, "fornitore"], [cBase, "unità base"],
    [cConv, "conversioni"], [cPrezzo, "prezzo"], [cLav, "unità di lavorazione"],
    [cFlab, "unità fornitore lab"], [cFdir, "unità fornitore diretto"]];
  rep.nonToccati = NOTE.filter(([c]) => c < 0).map(([, n]) => n);

  for (let ri = 1; ri < righe.length; ri++) {
    const r = righe[ri];
    const nome = (cNome >= 0 ? r[cNome] : "").trim();
    if (!nome) { rep.errori.push(`Riga ${ri + 1}: nome mancante, saltata`); continue; }
    const idRiga = cID >= 0 ? (r[cID] || "").trim() : "";
    /* chi si sta aggiornando va saputo PRIMA di decidere cosa scrivere: è
       tutta la differenza fra «metti il valore di partenza» e «non toccare» */
    let esist = idRiga ? trova(s.prodotti, idRiga) : null;
    if (!esist) esist = perNome(s.prodotti, nome);

    const baseSim = (cBase >= 0 ? r[cBase] : "").trim();
    if (cBase >= 0 && !baseSim && esist)
      rep.errori.push(`Riga ${ri + 1}: «UdM base» vuota, tengo quella di adesso`);
    /* serve comunque per leggere le conversioni e le altre unità, anche
       quando non va riscritta */
    const uomBase = baseSim ? creaUnita(baseSim)
      : (esist?.uomBase || s.unita.find((u) => u.simbolo === "pz")?.id || s.unita[0]?.id);

    const dati = { nome };
    if (baseSim || !esist) dati.uomBase = uomBase;
    if (cConv >= 0) {
      const conv = {};
      if (r[cConv]) {
        for (const pezzo of String(r[cConv]).split("|")) {
          const mm = pezzo.match(/^\s*(.+?)\s*[=:]\s*(.+?)\s*$/);
          if (!mm) continue;
          const f = num(mm[2]);
          if (f == null || f <= 0) continue;
          const uu = creaUnita(mm[1]);
          if (uu !== uomBase) conv[uu] = f;
        }
      }
      dati.conv = conv;
    } else if (!esist) dati.conv = {};
    if (cCat >= 0 || !esist) dati.categoriaId = idCategoria(cCat >= 0 ? r[cCat] : "");
    if (cForn >= 0 || !esist) dati.fornitoreId = idFornitore(cForn >= 0 ? r[cForn] : "");

    const ctx = [uomBase, ...Object.keys(dati.conv || esist?.conv || {})];
    const ctxSim = (val, def) => {
      const sim = (val || "").trim();
      if (!sim) return def;
      const u = unitaDaSimbolo(sim);
      return u && ctx.includes(u.id) ? u.id : def;
    };
    if (cLav >= 0 || !esist) dati.uomLavorazione = ctxSim(cLav >= 0 ? r[cLav] : "", uomBase);
    if (cFlab >= 0 || !esist) dati.uomFornitore = ctxSim(cFlab >= 0 ? r[cFlab] : "", uomBase);
    if (cFdir >= 0 || !esist) dati.uomFornitoreDiretto = ctxSim(cFdir >= 0 ? r[cFdir] : "", uomBase);

    const prezzo = cPrezzo >= 0 ? num(r[cPrezzo]) : null;
    if (prezzo != null && prezzo >= 0) dati.prezzo = prezzo;
    if (esist) { Object.assign(esist, dati); rep.aggiornati++; }
    else { s.prodotti.push({ id: uid("p"), ...dati }); rep.creati++; }
  }
  return rep;
}

/* ─────────── GEN 4.1 · ELIMINAZIONE GUIDATA ───────────
   Prima eliminare un elemento in uso era bloccato e chiedeva
   di smontare a mano ogni riferimento. Ora un riepilogo mostra
   cosa è collegato e un solo passaggio esegue la cascata in
   modo coerente per tutta la rete.                          */
function riferimentiProdotto(s, id) {
  return {
    magazzini: s.magazzini.filter((m) => m.articoli.some((a) => a.prodottoId === id)),
    richieste: s.richieste.filter((r) => r.prodottoId === id),
    ordini: s.ordini.filter((o) => o.prodottoId === id),
  };
}
function eliminaProdottoCascata(s, id) {
  s.magazzini.forEach((m) => { m.articoli = m.articoli.filter((a) => a.prodottoId !== id); });
  s.richieste = s.richieste.filter((r) => r.prodottoId !== id);
  s.ordini = s.ordini.filter((o) => o.prodottoId !== id);
  s.movimenti = (s.movimenti || []).filter((mv) => mv.prodottoId !== id);
  s.prodotti = s.prodotti.filter((p) => p.id !== id);
}
function riferimentiMagazzino(s, id) {
  return {
    profili: s.profili.filter((p) => p.magazziniIds?.includes(id)),
    linee: s.magazzini.filter((m) => m.rifMagazzinoId === id),
    richieste: s.richieste.filter((r) => r.daMagazzinoId === id && r.stato === "in-attesa"),
  };
}
function eliminaMagazzinoCascata(s, id) {
  s.profili.forEach((p) => { if (p.magazziniIds) p.magazziniIds = p.magazziniIds.filter((x) => x !== id); });
  s.magazzini.forEach((m) => { if (m.rifMagazzinoId === id) m.rifMagazzinoId = undefined; });
  s.richieste.forEach((r) => {
    if (r.daMagazzinoId === id && r.stato === "in-attesa") { r.stato = "annullata"; r.evasoDa = "Sistema"; r.tEvasione = Date.now(); }
  });
  s.movimenti = (s.movimenti || []).filter((mv) => mv.magId !== id);
  s.magazzini = s.magazzini.filter((m) => m.id !== id);
}
function eliminaSedeCascata(s, id, nuovoLabId) {
  if (nuovoLabId) s.sedi.forEach((x) => { if (x.labSedeId === id) x.labSedeId = nuovoLabId; });
  s.magazzini.filter((m) => m.sedeId === id).map((m) => m.id).forEach((mid) => eliminaMagazzinoCascata(s, mid));
  s.profili = s.profili.filter((p) => p.sedeId !== id);
  s.richieste = s.richieste.filter((r) => r.daSedeId !== id && r.aSedeLabId !== id);
  s.ordini = s.ordini.filter((o) => o.sedeId !== id);
  s.codici = (s.codici || []).filter((c) => !(c.sedeId === id && c.stato === "attivo"));
  s.sedi = s.sedi.filter((x) => x.id !== id);
}

/* ─────────── PRIMITIVI UI ─────────── */
function Scheda({ children, className = "", style, onClick }) {
  return (
    <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter") onClick(); } : undefined}
      className={`rounded-3xl ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ background: T.sup, border: `1px solid ${T.bordo}`, boxShadow: "0 10px 30px -18px rgba(60,90,180,.18)", ...style }}>
      {children}
    </div>
  );
}
function Bottone({ figli, children, variante = "primario", icona: I, onClick, disabilitato, className = "", piccolo }) {
  const stili = {
    primario: { background: T.grad, color: "#fff", border: "none", boxShadow: "0 10px 22px -10px rgba(110,100,244,.55)" },
    tonale: { background: "#EAF0FE", color: T.blu, border: "none" },
    fantasma: { background: "transparent", color: T.dim, border: `1px solid ${T.bordo}` },
    pericolo: { background: "#FCE9EE", color: T.rosso, border: "none" },
  }[variante];
  return (
    <button onClick={onClick} disabled={disabilitato}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all ${piccolo ? "px-3.5 py-2 text-sm" : "px-5 py-3 text-sm"} ${className}`}
      style={{ ...stili, opacity: disabilitato ? 0.45 : 1 }}>
      {I && <I size={piccolo ? 15 : 17} />}{children ?? figli}
    </button>
  );
}
function Chip({ colore = T.blu, children, pieno }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold whitespace-nowrap"
      style={{ fontSize: 11, color: pieno ? "#fff" : colore, background: pieno ? colore : `${colore}18` }}>
      {children}
    </span>
  );
}
function Campo({ label, valore, onCambia, tipo = "text", placeholder, suggerimento, inputMode, maxLength, autoFocus }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>{label}</span>
      <input type={tipo} value={valore} placeholder={placeholder} inputMode={inputMode} maxLength={maxLength}
        autoFocus={autoFocus} onChange={(e) => onCambia(e.target.value)}
        className="w-full rounded-2xl px-4 py-3 text-base font-semibold"
        style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}`, color: T.ink }} />
      {suggerimento && <span className="block text-xs mt-1" style={{ color: T.tenue }}>{suggerimento}</span>}
    </label>
  );
}
function Selettore({ label, valore, onCambia, opzioni, gruppi, placeholder = "Seleziona…" }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>{label}</span>
      <select value={valore || ""} onChange={(e) => onCambia(e.target.value)}
        className="w-full rounded-2xl px-4 py-3 text-base font-semibold appearance-none"
        style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}`, color: valore ? T.ink : T.tenue }}>
        <option value="" disabled>{placeholder}</option>
        {gruppi
          ? gruppi.map((g) => (
              <optgroup key={g.nome} label={g.nome}>
                {g.opzioni.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </optgroup>))
          : (opzioni || []).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
      </select>
    </label>
  );
}
function Segmenti({ valore, onCambia, opzioni }) {
  return (
    <div className="flex gap-1 p-1 rounded-full overflow-x-auto sc-scroll" style={{ background: "#EAEFF9" }}>
      {opzioni.map((o) => (
        <button key={o.id} onClick={() => onCambia(o.id)}
          className="flex-1 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-all"
          style={valore === o.id
            ? { background: T.sup, color: T.ink, boxShadow: "0 4px 12px -4px rgba(60,90,180,.25)" }
            : { background: "transparent", color: T.dim }}>
          {o.nome}
        </button>
      ))}
    </div>
  );
}
function Avatar({ nome, colore, size = 42 }) {
  const iniziali = nome.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center font-extrabold text-white shrink-0"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${colore}, ${colore}AA)`, fontSize: size * 0.38 }}>
      {iniziali}
    </div>
  );
}
function Vuoto({ icona: I = Boxes, titolo, testo, azione }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-10 px-6">
      <div className="rounded-3xl p-4" style={{ background: "#EEF3FE", color: T.blu }}><I size={28} /></div>
      <div className="font-extrabold text-lg" style={{ color: T.ink }}>{titolo}</div>
      <p className="text-sm max-w-xs" style={{ color: T.dim }}>{testo}</p>
      {azione}
    </div>
  );
}
function Foglio({ aperto, titolo, onChiudi, children, larga }) {
  if (!aperto) return null;
  return (
    /* Da gen-5.72 l'intestazione sta SOPRA i fogli, perche' la lente dev'essere
       raggiungibile anche da qui dentro. Conseguenza misurata, non immaginata:
       su un portatile 1440×760 un foglio alto partiva a 30px e il suo TITOLO
       finiva sotto l'intestazione.
       La fascia libera la fa «sc-foglio» nel foglio di stile qui sopra, non una
       classe di Tailwind: il banco di prova usa un CSS precompilato e il
       caricatore di produzione non e' leggibile da qui — una classe nuova
       poteva esserci in un posto e non nell'altro. Il nostro CSS sta dentro il
       codice e vale in tutti e due. */
    <div className="sc-foglio fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(20,28,55,.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onChiudi(); }}>
      <div className={`sc-su w-full ${larga ? "md:max-w-2xl" : "md:max-w-md"} max-h-[92vh] overflow-y-auto sc-scroll rounded-t-3xl md:rounded-3xl p-5 md:p-6`}
        style={{ background: T.sup }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-extrabold" style={{ color: T.ink }}>{titolo}</h3>
          <button onClick={onChiudi} aria-label="Chiudi" className="rounded-full p-2.5"
            style={{ background: "#F0F3FB", color: T.dim }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Conferma({ aperto, titolo, testo, onNo, onSi, testoSi = "Elimina" }) {
  return (
    <Foglio aperto={aperto} titolo={titolo} onChiudi={onNo}>
      <p className="text-sm mb-5" style={{ color: T.dim }}>{testo}</p>
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onNo}>Annulla</Bottone>
        <Bottone variante="pericolo" icona={Trash2} onClick={onSi}>{testoSi}</Bottone>
      </div>
    </Foglio>
  );
}
function StatCard({ icona: I, colore, label, valore, nota }) {
  return (
    <Scheda className="p-4 flex items-center gap-3">
      <div className="rounded-2xl p-3 shrink-0" style={{ background: `${colore}16`, color: colore }}><I size={20} /></div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold leading-none" style={{ color: T.ink }}>{valore}</div>
        {/* niente «truncate»: su un telefono da 360 l'etichetta veniva tagliata
            («Copertu…») e il numero sopra restava senza significato */}
        <div className="text-xs font-bold mt-1 leading-tight" style={{ color: T.dim }}>{label}</div>
        {nota && <div className="text-xs" style={{ color: T.tenue }}>{nota}</div>}
      </div>
    </Scheda>
  );
}
function Intesta({ titolo, sotto, azione }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: T.ink }}>{titolo}</h2>
        {sotto && <p className="text-sm mt-0.5" style={{ color: T.dim }}>{sotto}</p>}
      </div>
      {azione}
    </div>
  );
}
function InArrivo({ titolo, gen, testo }) {
  return (
    <Scheda className="p-8">
      <Vuoto icona={Sparkles} titolo={titolo}
        testo={testo || `Questa sezione arriva nella Generazione ${gen}: scrivi «Continua» per costruirla.`}
        azione={<Chip colore={T.viola}>In arrivo · Gen {gen}</Chip>} />
    </Scheda>
  );
}

/* ─────────── SPIEGA: L'AIUTO CHE SI RICHIUDE (gen-5.95) ───────────
   Un testo d'aiuto che non si puo' togliere insegna a non leggere niente:
   chi conta due volte al giorno attraversava 400 caratteri di istruzioni
   gia' imparate, due volte al giorno, per sempre. Aperto la prima volta;
   richiuso resta richiuso SU QUESTO DISPOSITIVO (come il tour), e al posto
   suo resta una pastiglia col titolo — che e' anche la strada per riaprirlo.
   Se localStorage manca (navigazione privata), resta sempre aperto: meglio
   ripetere che sparire. Lo stato si rilegge nell'inizializzatore, quindi il
   rimontaggio della vista a ogni navigazione non riapre niente.
   NON si usa per: avvisi che portano DATI (offline, righe mancanti),
   conferme, form. Si richiude solo cio' che, una volta imparato, non serve
   piu'. */
const AIUTI_K = "scp:aiuti:v1";
const aiutoChiuso = (id) => { try { return (JSON.parse(localStorage.getItem(AIUTI_K)) || {})[id] === 1; } catch { return false; } };
const aiutoScrivi = (id, chiuso) => { try {
  const v = JSON.parse(localStorage.getItem(AIUTI_K)) || {};
  v[id] = chiuso ? 1 : 0; localStorage.setItem(AIUTI_K, JSON.stringify(v));
} catch {} };
function Spiega({ id, titolo = "Come funziona", colore = T.blu, sfondo = "#EFF4FE", icona: I = Sparkles, children }) {
  const [chiuso, setChiuso] = useState(() => aiutoChiuso(id));
  const cambia = () => setChiuso((c) => { aiutoScrivi(id, !c); return !c; });
  if (chiuso) return (
    <button type="button" onClick={cambia} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 mb-3 text-xs font-bold"
      style={{ background: sfondo, color: colore }}>
      <I size={13} /> {titolo}
    </button>
  );
  return (
    <div className="rounded-2xl px-3.5 py-3 mb-3 flex items-start gap-2.5"
      style={{ background: sfondo, border: `1px solid ${T.bordo}` }}>
      <I size={16} style={{ color: colore }} className="mt-0.5 shrink-0" />
      <div className="flex-1 text-sm min-w-0" style={{ color: T.ink }}>{children}</div>
      <button type="button" onClick={cambia} aria-label={`Chiudi l'aiuto: ${titolo}`}
        className="rounded-full p-2 shrink-0" style={{ background: "#fff", color: T.dim }}><X size={14} /></button>
    </div>
  );
}

/* ─────────── ACCESSO · PROFILI + PIN ─────────── */
function SchermataLogin({ stato, sync, muta, onEntra, auth }) {
  const [vista, setVista] = useState("profili"); // profili | codice | richiesta | attesa
  const [sel, setSel] = useState(null);
  const [pin, setPin] = useState("");
  const [errore, setErrore] = useState(false);
  const [verifica, setVerifica] = useState(false);
  /* registrazione con codice */
  const [codice, setCodice] = useState("");
  const [nome, setNome] = useState("");
  const [pinN, setPinN] = useState("");
  const [pinN2, setPinN2] = useState("");
  const [err, setErr] = useState("");
  /* richiesta di primo accesso */
  const [msg, setMsg] = useState("");
  const [richiestaId, setRichiestaId] = useState(null);

  const premi = async (d) => {
    if (verifica || pin.length >= 4) return;
    const np = pin + d;
    setPin(np);
    if (np.length === 4) {
      setVerifica(true);
      const sbaglia = () => {
        setErrore(true);
        setTimeout(() => { setPin(""); setErrore(false); setVerifica(false); }, 550);
      };
      if (auth) {
        /* verifica del PIN lato server: la sessione nasce solo qui */
        try {
          /* il profilo viaggia insieme al PIN: il server confronta solo
             con quello, cosi' PIN uguali su profili diversi non si
             confondono e nessuno puo' scoprire il PIN altrui */
          const r = await auth.login(np + "\u0001" + sel.id);
          if (r && r.token && r.profiloId === sel.id) return onEntra(r.profiloId);
        } catch {}
        sbaglia();
      } else {
        const h = await hashPin(np);
        if (h === sel.pinHash) onEntra(sel.id);
        else sbaglia();
      }
    }
  };
  const cancella = () => { if (!verifica) setPin((p) => p.slice(0, -1)); };

  const registrati = async () => {
    setErr("");
    if (auth) {
      if (!nome.trim()) return setErr("Inserisci il tuo nome");
      if (!/^\d{4}$/.test(pinN)) return setErr("Il PIN deve avere 4 cifre");
      if (pinN !== pinN2) return setErr("I due PIN non coincidono");
      try {
        const r = await auth.registra(codice, nome.trim(), pinN);
        if (r && r.token && r.profiloId) return onEntra(r.profiloId);
        if (r && r.error === "codice") return setErr("Codice non valido o già utilizzato");
        if (r && r.error === "rate") return setErr("Troppi tentativi: attendi un minuto");
        if (r && r.error === "nome") return setErr("Inserisci il tuo nome");
        if (r && r.error === "pin") return setErr("Il PIN deve avere almeno 4 cifre");
        return setErr("Registrazione non riuscita");
      } catch { return setErr("Registrazione non riuscita, riprova"); }
    }
    const c = (stato.codici || []).find((x) => x.stato === "attivo" && x.codice === normCodice(codice));
    if (!c) return setErr("Codice non valido o già utilizzato");
    if (!nome.trim()) return setErr("Inserisci il tuo nome");
    if (!/^\d{4}$/.test(pinN)) return setErr("Il PIN deve avere 4 cifre");
    if (pinN !== pinN2) return setErr("I due PIN non coincidono");
    const nid = uid("pr");
    const pinHash = await hashPin(pinN);
    const colore = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    muta((s) => {
      s.profili.push({
        id: nid, nome: nome.trim(), ruolo: c.ruolo, colore, pinHash,
        sedeId: c.ruolo === "admin" ? undefined : c.sedeId,
        magazziniIds: c.ruolo === "operatore" ? (c.magazziniIds || []) : undefined,
      });
      const cB = trova(s.codici, c.id);
      if (cB) { cB.stato = "usato"; cB.usatoDa = nome.trim(); cB.tUso = Date.now(); }
      if (c.perRichiestaId) {
        const a = trova(s.accessi, c.perRichiestaId);
        if (a && a.stato === "approvata") a.stato = "completata";
      }
    }, `Nuovo utente «${nome.trim()}» (${RUOLI[c.ruolo].nome}) registrato con codice di invito`);
    onEntra(nid);
  };

  const inviaRichiesta = async () => {
    setErr("");
    if (!nome.trim()) return setErr("Inserisci il tuo nome");
    if (auth) {
      try {
        const r = await auth.richiesta(nome.trim(), msg.trim());
        if (r && r.ok) { setRichiestaId(r.id || "inviata"); setVista("attesa"); return; }
        if (r && r.error === "rate") return setErr("Troppi tentativi: attendi un minuto");
        return setErr("Invio non riuscito");
      } catch { return setErr("Invio non riuscito, riprova"); }
    }
    const rid = uid("acc");
    muta((s) => {
      s.accessi = [{ id: rid, t: Date.now(), nome: nome.trim(), messaggio: msg.trim(), stato: "in-attesa" },
        ...(s.accessi || [])];
    }, `Richiesta di primo accesso ricevuta da «${nome.trim()}»`);
    setRichiestaId(rid);
    setVista("attesa");
  };

  const richiesta = (stato.accessi || []).find((a) => a.id === richiestaId);
  const codRichiesta = richiesta?.codiceId
    ? (stato.codici || []).find((c) => c.id === richiesta.codiceId && c.stato === "attivo")
    : (stato.codici || []).find((c) => c.perRichiestaId === richiestaId && c.stato === "attivo");

  const Indietro = ({ a = "profili" }) => (
    <button onClick={() => { setVista(a); setErr(""); }}
      className="self-start flex items-center gap-1.5 text-sm font-bold rounded-full px-3 py-1.5"
      style={{ color: T.dim, background: "#EDF1FA" }}>
      <ArrowLeft size={15} /> Indietro
    </button>
  );

  return (
    <div className="relative z-10 h-full overflow-y-auto sc-scroll flex flex-col items-center px-5 py-8">
      <div className="sc-fade flex flex-col items-center text-center gap-3 mt-4 mb-8">
        <div className="rounded-3xl p-4" style={{ background: T.grad, boxShadow: "0 18px 40px -16px rgba(120,100,244,.6)" }}>
          <Boxes size={30} color="#fff" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: T.ink }}>Supply Chain Pro</h1>
        <p className="text-sm max-w-sm" style={{ color: T.dim }}>
          Rifornimenti multi-sede in tempo reale: linee, retro, laboratorio e ordini fornitori.
        </p>
      </div>

      {vista === "profili" && !sel && (
        <div className="sc-fade w-full max-w-md flex flex-col gap-3 pb-10">
          {stato.avvisoDemo && !(stato.codici || []).length && (
            <Scheda className="p-4" style={{ background: "#F1EDFE", border: "1px solid #DCD2FA" }}>
              <div className="flex items-start gap-3">
                <Sparkles size={18} style={{ color: T.viola }} className="mt-0.5 shrink-0" />
                <div className="text-sm" style={{ color: T.ink }}>
                  <b>Profili demo creati.</b> PIN: Admin <b>1234</b> · Giulia <b>1111</b> · Marco <b>2222</b> · Sara <b>3333</b>.
                  Per l'uso ufficiale <b>cambia subito questi PIN</b> e invita i nuovi utenti dal pannello Accessi.
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Bottone variante="tonale" piccolo onClick={() => muta((s) => { s.avvisoDemo = false; })}>Ho capito</Bottone>
              </div>
            </Scheda>
          )}

          <div className="text-sm font-extrabold uppercase tracking-wide px-1" style={{ color: T.tenue }}>
            Scegli il tuo profilo
          </div>
          {stato.profili.map((p) => {
            const R = RUOLI[p.ruolo];
            const sede = p.sedeId ? trova(stato.sedi, p.sedeId)?.nome : "Tutte le sedi";
            return (
              <Scheda key={p.id} className="p-4 flex items-center gap-3" onClick={() => { setSel(p); setPin(""); }}>
                <Avatar nome={p.nome} colore={p.colore} size={46} />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold" style={{ color: T.ink }}>{p.nome}</div>
                  <div className="text-xs truncate" style={{ color: T.dim }}>{sede}</div>
                </div>
                <Chip colore={R.colore}><R.icona size={12} /> {R.nome}</Chip>
                <ChevronRight size={18} style={{ color: T.tenue }} />
              </Scheda>
            );
          })}

          <div className="text-sm font-extrabold uppercase tracking-wide px-1 mt-2" style={{ color: T.tenue }}>
            Sei nuovo?
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Bottone icona={KeyRound} onClick={() => { setVista("codice"); setErr(""); }}>Ho un codice</Bottone>
            <Bottone variante="fantasma" icona={UserPlus} onClick={() => { setVista("richiesta"); setErr(""); }}>Richiedi accesso</Bottone>
          </div>

          <p className="text-xs text-center mt-3 leading-relaxed" style={{ color: T.tenue }}>
            {sync === "locale"
              ? "Archiviazione condivisa non disponibile: i dati resteranno solo su questo dispositivo."
              : "Accesso su invito · i dati sono sincronizzati in tempo reale fra gli utenti autorizzati."}
          </p>
        </div>
      )}

      {vista === "profili" && sel && (
        <div className="sc-pop w-full max-w-xs flex flex-col items-center gap-5 pb-10">
          <button onClick={() => { setSel(null); setPin(""); setVerifica(false); }}
            className="self-start flex items-center gap-1.5 text-sm font-bold rounded-full px-3 py-1.5"
            style={{ color: T.dim, background: "#EDF1FA" }}>
            <ArrowLeft size={15} /> Profili
          </button>
          <Avatar nome={sel.nome} colore={sel.colore} size={72} />
          <div className="text-center">
            <div className="text-xl font-extrabold" style={{ color: T.ink }}>{sel.nome}</div>
            <div className="text-sm flex items-center justify-center gap-1.5 mt-0.5" style={{ color: T.dim }}>
              <Lock size={13} /> Inserisci il PIN
            </div>
          </div>

          <div className={`flex gap-3 ${errore ? "sc-shake" : ""}`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="rounded-full transition-all"
                style={{
                  width: 16, height: 16,
                  background: errore ? T.rosso : i < pin.length ? T.blu : "#D8DFF0",
                }} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
              k === "" ? <span key={i} /> : (
                <button key={i} onClick={() => (k === "⌫" ? cancella() : premi(k))}
                  aria-label={k === "⌫" ? "Cancella" : k}
                  className="rounded-2xl py-4 text-2xl font-extrabold flex items-center justify-center"
                  style={{ background: T.sup, border: `1px solid ${T.bordo}`, color: k === "⌫" ? T.dim : T.ink, boxShadow: "0 6px 16px -10px rgba(60,90,180,.25)" }}>
                  {k === "⌫" ? <Delete size={22} /> : k}
                </button>
              ))}
          </div>
          {errore && <div className="text-sm font-bold" style={{ color: T.rosso }}>PIN errato, riprova</div>}
        </div>
      )}

      {vista === "codice" && (
        <div className="sc-pop w-full max-w-sm flex flex-col gap-4 pb-10">
          <Indietro />
          <div className="text-center">
            <div className="text-xl font-extrabold" style={{ color: T.ink }}>Registrati con il codice</div>
            <p className="text-sm mt-1" style={{ color: T.dim }}>
              Il codice univoco ti viene consegnato dall'amministratore.
            </p>
          </div>
          <Campo label="Codice di invito"
            valore={codice.length > 3 ? `${codice.slice(0, 3)}-${codice.slice(3)}` : codice}
            onCambia={(v) => setCodice(normCodice(v).slice(0, 6))} placeholder="ABC-123" autoFocus />
          <Campo label="Il tuo nome" valore={nome} onCambia={setNome} placeholder="Es. Luca" />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Scegli un PIN" valore={pinN} tipo="password" inputMode="numeric" maxLength={4}
              onCambia={(v) => setPinN(v.replace(/\D/g, "").slice(0, 4))} placeholder="4 cifre" />
            <Campo label="Ripeti PIN" valore={pinN2} tipo="password" inputMode="numeric" maxLength={4}
              onCambia={(v) => setPinN2(v.replace(/\D/g, "").slice(0, 4))} placeholder="4 cifre" />
          </div>
          {err && <p className="text-sm font-bold text-center" style={{ color: T.rosso }}>{err}</p>}
          <Bottone icona={Check} onClick={registrati}>Crea il mio profilo</Bottone>
        </div>
      )}

      {vista === "richiesta" && (
        <div className="sc-pop w-full max-w-sm flex flex-col gap-4 pb-10">
          <Indietro />
          <div className="text-center">
            <div className="text-xl font-extrabold" style={{ color: T.ink }}>Richiedi l'accesso</div>
            <p className="text-sm mt-1" style={{ color: T.dim }}>
              L'amministratore vedrà i tuoi dati in tempo reale e potrà approvarti.
            </p>
          </div>
          <Campo label="Il tuo nome" valore={nome} onCambia={setNome} placeholder="Es. Luca" autoFocus />
          <label className="block">
            <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Messaggio (facoltativo)</span>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
              placeholder="Es. Sono il nuovo operatore della sede di…"
              className="w-full rounded-2xl px-4 py-3 text-base font-semibold sc-scroll"
              style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}`, color: T.ink, resize: "none", fontFamily: "inherit" }} />
          </label>
          {err && <p className="text-sm font-bold text-center" style={{ color: T.rosso }}>{err}</p>}
          <Bottone icona={Send} onClick={inviaRichiesta}>Invia richiesta</Bottone>
        </div>
      )}

      {vista === "attesa" && (
        <div className="sc-pop w-full max-w-sm flex flex-col items-center gap-4 text-center pb-10">
          {!richiesta || richiesta.stato === "in-attesa" ? (
            <>
              <div className="rounded-full p-5" style={{ background: "#EFF4FE" }}>
                <Clock size={34} style={{ color: T.blu, animation: "scPulsa 2s ease-in-out infinite" }} />
              </div>
              <div className="text-xl font-extrabold" style={{ color: T.ink }}>Richiesta inviata</div>
              <p className="text-sm" style={{ color: T.dim }}>
                Ciao <b>{richiesta?.nome || nome}</b>: l'amministratore sta ricevendo la tua richiesta.
                Questa schermata si aggiorna da sola quando risponde.
              </p>
              <Bottone variante="fantasma" onClick={() => {
                muta((s) => { s.accessi = (s.accessi || []).filter((a) => a.id !== richiestaId); },
                  "Richiesta di accesso annullata dal richiedente");
                setRichiestaId(null); setVista("profili");
              }}>Annulla richiesta</Bottone>
            </>
          ) : richiesta.stato === "rifiutata" ? (
            <>
              <div className="rounded-full p-5" style={{ background: "#FCE9EE" }}><X size={34} style={{ color: T.rosso }} /></div>
              <div className="text-xl font-extrabold" style={{ color: T.ink }}>Accesso non concesso</div>
              <p className="text-sm" style={{ color: T.dim }}>
                L'amministratore non ha approvato la richiesta. Puoi contattarlo direttamente per chiarimenti.
              </p>
              <Bottone variante="tonale" onClick={() => { setRichiestaId(null); setVista("profili"); }}>Torna all'inizio</Bottone>
            </>
          ) : codRichiesta ? (
            <>
              <div className="rounded-full p-5" style={{ background: "#E4F6EE" }}><Check size={34} style={{ color: T.verde }} /></div>
              <div className="text-xl font-extrabold" style={{ color: T.ink }}>Richiesta approvata!</div>
              <div className="rounded-3xl px-8 py-4 text-3xl font-extrabold tracking-widest"
                style={{ background: T.grad, color: "#fff", fontFamily: "monospace" }}>
                {fmtCodice(codRichiesta.codice)}
              </div>
              <p className="text-sm" style={{ color: T.dim }}>Questo è il tuo codice personale: usalo per creare il profilo.</p>
              <Bottone icona={KeyRound} onClick={() => {
                setCodice(codRichiesta.codice); setNome(richiesta.nome); setErr(""); setVista("codice");
              }}>Continua la registrazione</Bottone>
            </>
          ) : (
            <>
              <div className="rounded-full p-5" style={{ background: "#E4F6EE" }}><Check size={34} style={{ color: T.verde }} /></div>
              <div className="text-xl font-extrabold" style={{ color: T.ink }}>Richiesta approvata</div>
              <p className="text-sm" style={{ color: T.dim }}>
                Il codice risulta già usato o revocato: chiedi all'amministratore di generarne uno nuovo.
              </p>
              <Bottone variante="tonale" icona={KeyRound} onClick={() => { setNome(richiesta.nome); setVista("codice"); }}>
                Ho già un codice</Bottone>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────── STRUTTURA · NAVIGAZIONE ─────────── */
function SincroChip({ sync }) {
  const cfg = {
    ok: [Cloud, T.verde, "Sincronizzato"],
    salvataggio: [RefreshCw, T.blu, "Salvataggio…"],
    offline: [CloudOff, T.ambra, "Riconnessione…"],
    locale: [CloudOff, T.tenue, "Solo locale"],
    init: [RefreshCw, T.tenue, "…"],
  }[sync] || [Cloud, T.tenue, ""];
  const [I, col, testo] = cfg;
  /* ── LA SPIA SI VEDE ANCHE SUL TELEFONO (gen-5.91) ──
     Qui c'era «hidden sm:inline-flex»: la pastiglia spariva sotto i 640px,
     cioe' su OGNI telefono — proprio i dispositivi su cui si conta in
     cantina, dove la rete non c'e'. Chi lavorava non aveva nessun modo di
     sapere che stava salvando solo in locale.
     Sul telefono resta nascosta quando va tutto bene, perche' «Sincronizzato»
     tutto il giorno diventa arredamento e non lo legge piu' nessuno; compare
     quando c'e' qualcosa da sapere, e in quel caso la si vede eccome. */
  const daSapere = sync !== "ok" && sync !== "init";
  return (
    <span className={(daSapere ? "inline-flex" : "hidden sm:inline-flex")
      + " items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"}
      style={{ color: col, background: `${col}16` }}>
      <I size={13} className={sync === "salvataggio" ? "sc-gira" : ""} />
      {testo}
      {sync === "ok" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: col, animation: "scPulsa 2s ease-in-out infinite" }} />}
    </span>
  );
}

/* == TUTORIAL GUIDATO == */
const GUIDA_NAV = {
  home: "La tua base: riepilogo della giornata, avvisi sotto scorta e scorciatoie alle azioni utili.",
  conteggi: "Il cuore per l'operatore: conti quello che vedi in linea e l'app calcola da sola cosa richiedere o ordinare.",
  magazzini: "Linee, retro e laboratorio: qui vedi e gestisci i prodotti e i livelli previsti di ogni magazzino.",
  ordini: "Cosa ordinare, cosa è stato ordinato e cosa è arrivato. Da qui invii l'ordine (anche su WhatsApp) e registri la merce.",
  richieste: "Le richieste che le linee mandano al laboratorio: le evadi indicando quanto invii davvero.",
  plancia: "La rete a colpo d'occhio: chi rifornisce chi, cosa contiene ogni magazzino e cosa gli manca. Da qui si lavora anche su più magazzini insieme.",
  cassa: "Le vendite al cliente: tocchi le voci del listino, incassi, e il magazzino di cassa si scarica da solo secondo la distinta di ogni voce.",
  listino: "Le voci che compaiono in Cassa: nome, prezzo di vendita, varianti e la distinta di cosa scalare dal magazzino a ogni vendita.",
  catalogo: "L'anagrafica di tutta la rete: prodotti, categorie, fornitori, unità e prezzi. Qui c'è «Modifica in blocco», che cambia anche chi fa un prodotto: il laboratorio o un fornitore.",
  analisi: "Numeri e tendenze: copertura scorte, consumi, soglie consigliate dai dati veri e valore della merce ferma.",
  storico: "Tutto quello che è stato fatto, in ordine di tempo, con il tasto per riportare le cose com'erano.",
  "storico-ordini": "Gli ordini già partiti e la merce arrivata davvero, con il conto per fornitore.",
  sedi: "Le tue sedi (pizzerie e locali) e quale laboratorio rifornisce ognuna.",
  profili: "Le persone che accedono, con ruolo e magazzini assegnati.",
  accessi: "Inviti e richieste di primo accesso: generi i codici per far entrare nuove persone.",
  sistema: "Backup, punti di ripristino, export dei dati e stato della sincronizzazione.",
};
const GUIDA_SEZIONE = {
  magazzini: [
    { titolo: "I magazzini", testo: "Ogni scheda è un magazzino (linea, retro o laboratorio). Toccala per aprirlo e vederne i prodotti." },
    { illustra: "riga", titolo: "Dentro il magazzino", testo: "Ogni riga è un prodotto con livello previsto e quantità. La matita lo modifica, il cestino lo toglie, l'orologio mostra lo storico." },
    { illustra: "gestione", titolo: "Gestione rapida", testo: "Il pulsante «Gestione rapida» è il pannello di comando del magazzino, diviso in tre gruppi. AGGIUNGERE: aggiungi più prodotti, oppure copia da un altro magazzino. SPOSTARE: sposta o rimuovi prodotti, trasferisci le scorte. LIVELLI: livello previsto in blocco, soglie per giorno. Sono gli stessi nomi che trovi cercando con la lente in alto." },
    { titolo: "Assegna a più magazzini", testo: "In alto nella lista, «Assegna a più magazzini» mette gli stessi prodotti in più magazzini in una volta sola." },
  ],
  ordini: [
    { titolo: "Da ordinare", testo: "Le righe nascono quando le scorte scendono sotto il livello previsto. «Tutto ordinato» le segna come inviate al fornitore." },
    { titolo: "Da mandare adesso", testo: "La scheda verde in cima raccoglie tutto quello che va spedito, sede per sede: al laboratorio e ai fornitori, in un unico messaggio già scritto. «Vedi il testo» lo mostra prima di mandarlo." },
    { titolo: "Invia l'ordine", testo: "«Report ordine» prepara il testo per il fornitore, diviso per categoria, con il tasto «Invia su WhatsApp». Quello che il laboratorio si fa da sé non ci entra: non si ordina fuori una cosa fatta in casa." },
    { illustra: "arrivo", titolo: "Merce arrivata", testo: "Nella scheda «Ordinati», quando arriva la consegna usa «Tutto arrivato» (o il tastino verde sulla singola riga) per caricare i magazzini con la quantità reale." },
  ],
  conteggi: [
    { titolo: "Scegli il magazzino", testo: "Seleziona la linea o il magazzino che stai controllando." },
    { illustra: "conteggio", titolo: "Conta quello che vedi", testo: "Inserisci le quantità reali: l'app le confronta col livello previsto del giorno e calcola cosa manca." },
    { titolo: "Conferma", testo: "Alla conferma parte in automatico la richiesta al laboratorio o la riga d'ordine. Semplice." },
  ],
  catalogo: [
    { titolo: "Quattro schede", testo: "Unità di misura, Categorie, Fornitori e Prodotti: sono le anagrafiche condivise da tutta la rete." },
    { titolo: "Aggiungi e modifica", testo: "«Aggiungi» crea una voce nuova; la matita modifica quella esistente." },
    { titolo: "Modifica in blocco", testo: "Nella scheda Prodotti, «Modifica in blocco» cambia categoria, fornitore, unità di misura — e anche chi fa il prodotto — a tanti prodotti in una volta." },
    { titolo: "Chi lo fa: il laboratorio o un fornitore", testo: "Un prodotto «fatto in laboratorio» non si compra da nessuno: quando ne manca parte una richiesta al laboratorio invece di una riga d'ordine, e non finisce mai nel testo che mandi al fornitore. Lo marchi da «Modifica in blocco» → «Chi lo fa», anche a venti prodotti in una volta, e allo stesso modo si torna indietro." },
  ],
  richieste: [
    { titolo: "Le richieste dalla linea", testo: "Qui arrivano le richieste che le linee mandano al laboratorio quando sono sotto scorta." },
    { titolo: "Evadi la richiesta", testo: "Indichi quanto invii davvero: la linea si carica esattamente di quello e, se mandi meno, la richiesta resta aperta per il resto." },
  ],
  cassa: [
    { titolo: "La Cassa", testo: "Tocchi una voce e finisce nel conto; se ha varianti scegli quale. «Incassa» chiude il conto con il metodo di pagamento." },
    { titolo: "Il magazzino si scarica da solo", testo: "Ogni voce del listino sa cosa consuma: alla vendita l'app scala il magazzino di cassa della sede. Se il numero va sotto zero non è un errore: significa «hai venduto più di quanto risultava» — è un invito a contare." },
    { titolo: "Niente scontrino fiscale", testo: "Quello lo fa il registratore telematico, come sempre. Qui la vendita serve al magazzino, ai riordini e ai totali di giornata." },
  ],
  listino: [
    { titolo: "Le voci di vendita", testo: "Una voce di listino non è un prodotto di magazzino: una «Margherita» scala farina, mozzarella e pomodoro. Nome, gruppo e prezzo sono quelli che il banco vede in Cassa." },
    { titolo: "La distinta", testo: "Per ogni voce dici cosa esce dal magazzino a ogni vendita, e in che unità. Una voce senza distinta si vende comunque: semplicemente non scala niente." },
    { titolo: "Varianti e IVA", testo: "Le varianti aggiungono o tolgono qualcosa al prezzo («Maxi +1,50»). L'aliquota è solo informativa, per i totali di giornata: lo scontrino fiscale resta al registratore telematico." },
  ],
  /* Le nove qui sotto non c'erano. Nove schermate su quattordici aprivano il
     « ? » su una scheda sola, e la Plancia — che è una voce della barra, non
     un angolo nascosto — rispondeva con la frase «Sezione dell'app.», che non
     spiega niente a nessuno. Una guida assente è meno grave di una sbagliata,
     ma resta una porta che si apre sul vuoto. */
  home: [
    { titolo: "La giornata in una schermata", testo: "In cima c'è quello che serve adesso: cosa è sotto scorta, cosa aspetta di essere ordinato, cosa sta arrivando. Se non c'è niente da fare, non c'è niente scritto: il vuoto qui è una buona notizia, non un errore." },
    { titolo: "Le scorciatoie", testo: "I tasti portano dritti al lavoro del momento — contare, ordinare, ricevere — senza passare dalla barra in basso." },
  ],
  plancia: [
    { illustra: "rete", titolo: "Una mappa, non un elenco", testo: "Ogni riquadro è un magazzino e le frecce dicono chi rifornisce chi: le linee di lavoro prendono dal retro o dal laboratorio, il retro compra dal fornitore." },
    { titolo: "Come sta ognuno", testo: "Il colore dice a colpo d'occhio chi è a livello e chi è sotto scorta, e il numero dice quanti prodotti ci sono dentro. Toccando un riquadro si apre quello che contiene." },
    { titolo: "Si lavora anche da qui", testo: "Dai comandi in alto si spostano prodotti, si cambiano i livelli previsti e si tolgono articoli su più magazzini in una volta, senza entrare in ognuno." },
  ],
  analisi: [
    { titolo: "Copertura scorte", testo: "Dice quanti prodotti sono a livello e quanti sotto, sede per sede. È il numero da guardare per primo: risponde a «stiamo messi bene?»." },
    { titolo: "Le soglie che vengono dai dati", testo: "L'app guarda quanto avete consumato davvero, giorno per giorno, e propone il livello previsto. Resta una proposta: la applichi tu, non si applica da sola." },
    { titolo: "Valore della merce ferma", testo: "Si calcola solo sui prodotti che hanno prezzo e conversione. Quelli senza vengono saltati e contati a parte: un valore inventato sarebbe peggio di nessun valore." },
  ],
  storico: [
    { titolo: "Chi ha fatto cosa", testo: "Ogni modifica lascia una riga con chi l'ha fatta e quando. Serve per capire com'è arrivato un numero dov'è, non per controllare le persone." },
    { titolo: "Riportare indietro", testo: "«Ripristina» rimette le caselle com'erano prima di quella modifica. Se nel frattempo un magazzino è stato eliminato, quelle righe si saltano invece di far fallire tutto il ripristino." },
  ],
  "storico-ordini": [
    { titolo: "Quello che è già stato fatto", testo: "Gli ordini partiti e la merce arrivata — con quanto è arrivato DAVVERO, che non sempre è quanto era stato ordinato." },
    { titolo: "Il conto per fornitore", testo: "Quanto è stato ordinato a ognuno nel periodo scelto. Serve prima di una trattativa, o per capire dove vanno i soldi." },
  ],
  sedi: [
    { titolo: "Le sedi", testo: "Ogni sede è un locale, e il tipo dice se è una pizzeria che lavora o il laboratorio che prepara." },
    { titolo: "Chi rifornisce chi", testo: "A ogni sede si assegna il laboratorio che la serve. Senza quel collegamento un preparato che manca lì non lo chiede a nessuno — e l'app te lo scrive in Ordini invece di stare zitta." },
  ],
  profili: [
    { titolo: "Chi entra e cosa vede", testo: "L'admin vede tutta la rete, l'operatore la sua sede, il laboratorio il suo. I magazzini assegnati restringono ancora: si vede solo quello su cui si lavora." },
    { titolo: "Il PIN", testo: "Sono quattro cifre e si cambiano da qui. Se ne metti uno già usato da un altro profilo l'app te lo dice subito, invece di lasciartelo scoprire quando uno dei due non entra più." },
  ],
  accessi: [
    { titolo: "Far entrare qualcuno", testo: "Generi un codice di invito e glielo dai: la persona sceglie il suo PIN al primo accesso. Tu non lo devi sapere, ed è giusto così." },
    { titolo: "Le richieste in attesa", testo: "Chi prova a entrare senza invito finisce in questa lista: lo approvi o lo rifiuti tu." },
  ],
  sistema: [
    { titolo: "I punti di ripristino", testo: "Sono fotografie dei dati. Se qualcosa va storto si torna a una di quelle, con «Ripristina»." },
    { titolo: "Portare i dati fuori", testo: "Le esportazioni tirano fuori catalogo, movimenti e ordini in file che si aprono con Excel. È anche il modo per tenere per sempre gli ordini più vecchi di 45 giorni, che l'app da sola non conserva." },
    { titolo: "Ricaricare il catalogo", testo: "Dal file si rimettono dentro prodotti, fornitori, conversioni e prezzi in blocco. Prima di scrivere, l'app dice cosa cambierà." },
  ],
};
function passiPanoramica(NAV) {
  const ha = (id) => NAV.some((v) => v.id === id);
  return [
    { illustra: "flusso", titolo: "Benvenuto!", testo: "Supply Chain Pro lavora in 3 mosse: Conta quello che hai, Ordina quello che manca, Ricevi la merce. Ti mostro come, con qualche esempio." },
    { illustra: "rete", titolo: "Come è collegato tutto", testo: "Le linee di lavoro chiedono al laboratorio o attingono dal retro; quando serve parte l'ordine al fornitore. L'app fa i collegamenti e le conversioni da sola." },
    { illustra: "conteggio", titolo: "1 · Conta", testo: "Inserisci quello che vedi in magazzino: l'app lo confronta col livello previsto del giorno e calcola in automatico quanto manca." },
    ...(ha("magazzini") ? [{ sel: `[data-tour="nav-magazzini"]`, attendi: true, titolo: "Prova tu!", testo: "Tocca «Magazzini» qui evidenziato per aprirli davvero. (Se preferisci, puoi saltare questo passo.)" }] : []),
    { illustra: "riga", titolo: "Dentro un magazzino", testo: "Ogni riga è un prodotto con livello previsto e quantità. La matita modifica, il cestino toglie, l'orologio mostra lo storico." },
    { illustra: "gestione", titolo: "Le azioni veloci", testo: "Il tasto «Gestione rapida» raccoglie tutto quello che si fa in blocco, in tre gruppi: Aggiungere, Spostare, Livelli. Le voci che hanno bisogno di prodotti restano visibili anche quando il magazzino è vuoto, spente, e dicono perché." },
    { illustra: "arrivo", titolo: "2 · Ordina  ·  3 · Ricevi", testo: "In «Ordini» premi «Tutto ordinato» e invii al fornitore (anche su WhatsApp). All'arrivo, «Tutto arrivato» carica i magazzini con la quantità reale." },
    { sel: `[data-tour="aiuto"]`, titolo: "Rivedi quando vuoi", testo: "Trovi questa guida — e la guida di ogni singola sezione — toccando il « ? » qui in alto. Buon lavoro!" },
  ];
}

function IllustraGuida({ tipo }) {
  const box = { background: "#F6F8FE", border: `1px solid ${T.bordo}` };
  const cerchio = (Ic, col) => <div className="rounded-2xl p-2.5 shrink-0" style={{ background: col + "1A", color: col }}><Ic size={20} /></div>;
  const mini = (Ic, col) => <span className="rounded-lg p-1.5" style={{ background: col + "18", color: col }}><Ic size={13} /></span>;
  const barra = (pct, col, loop) => <div className="h-3 rounded-full mt-2 overflow-hidden" style={{ background: "#E4E9F5" }}><div className="h-full rounded-full" style={{ width: pct, background: col, transformOrigin: "left", animation: loop ? "scRiempiX 1.6s ease-in-out infinite" : "scRiempiX .9s ease both" }} /></div>;

  if (tipo === "flusso") return (
    <div className="rounded-2xl p-4 mb-3" style={box}>
      <div className="flex items-center justify-around">
        {[[ClipboardList, "Conta", T.blu], [Truck, "Ordina", T.ambra], [PackageCheck, "Ricevi", T.verde]].map(([Ic, l, c], k) => (
          <React.Fragment key={l}>
            <div className="flex flex-col items-center gap-1">{cerchio(Ic, c)}<span className="text-xs font-bold" style={{ color: T.ink }}>{l}</span></div>
            {k < 2 && <ChevronRight size={18} className="animate-pulse" style={{ color: T.tenue }} />}
          </React.Fragment>
        ))}
      </div>
      <div className="relative h-1.5 mt-3 rounded-full" style={{ background: "#E4E9F5" }}>
        <div className="absolute rounded-full" style={{ top: -3, width: 12, height: 12, background: T.blu, boxShadow: `0 2px 6px ${T.blu}88`, animation: "scScorriX 3s ease-in-out infinite" }} />
      </div>
    </div>
  );
  if (tipo === "rete") return (
    <div className="rounded-2xl p-4 flex items-center justify-around mb-3" style={box}>
      <div className="flex flex-col items-center gap-1">{cerchio(ClipboardList, T.blu)}<span className="text-xs font-bold" style={{ color: T.ink }}>Linea</span></div>
      <ChevronRight size={18} className="animate-pulse" style={{ color: T.tenue }} />
      <div className="flex flex-col items-center gap-1">{cerchio(FlaskConical, T.ciano)}<span className="text-xs font-bold" style={{ color: T.ink }}>Lab / Retro</span></div>
      <ChevronRight size={18} className="animate-pulse" style={{ color: T.tenue }} />
      <div className="flex flex-col items-center gap-1">{cerchio(Truck, T.ambra)}<span className="text-xs font-bold" style={{ color: T.ink }}>Fornitore</span></div>
    </div>
  );
  if (tipo === "conteggio") return (
    <div className="rounded-2xl p-4 mb-3" style={box}>
      <div className="flex justify-between text-sm font-bold" style={{ color: T.ink }}><span>Previsto oggi: 10</span><span>Contato: 6</span></div>
      {barra("60%", T.blu)}
      <div className="text-sm font-extrabold mt-2 flex items-center gap-1" style={{ color: T.ambra }}><AlertTriangle size={14} /> Mancano 4 → parte la richiesta</div>
    </div>
  );
  if (tipo === "riga") return (
    <div className="rounded-2xl p-3 mb-3 flex items-center gap-2" style={box}>
      <div className="flex-1 min-w-0"><div className="font-bold text-sm truncate" style={{ color: T.ink }}>Mozzarella</div><div className="text-xs" style={{ color: T.dim }}>Previsto 8 kg</div></div>
      <Chip colore={T.verde}>6 kg</Chip>
      <div className="flex gap-1">{mini(History, T.dim)}{mini(Pencil, T.blu)}{mini(Trash2, T.rosso)}</div>
    </div>
  );
  if (tipo === "gestione") return (
    <div className="rounded-2xl p-3 mb-3 flex flex-col gap-1.5" style={box}>
      {[[Boxes, "Aggiungi più prodotti"], [Copy, "Copia da un magazzino"], [ArrowLeftRight, "Sposta / rimuovi"], [TrendingUp, "Soglie per giorno"]].map(([Ic, l]) => (
        <div key={l} className="flex items-center gap-2 rounded-xl px-2.5 py-1.5" style={{ background: "#fff", border: `1px solid ${T.bordo}` }}>
          <Ic size={15} style={{ color: T.blu }} /><span className="text-xs font-bold" style={{ color: T.ink }}>{l}</span>
        </div>
      ))}
    </div>
  );
  if (tipo === "arrivo") return (
    <div className="rounded-2xl p-4 mb-3" style={box}>
      <div className="flex items-center justify-between text-sm font-bold" style={{ color: T.ink }}><span>Ordinato 10</span><PackageCheck size={16} style={{ color: T.verde }} /><span>Arrivato 10</span></div>
      {barra("100%", T.verde, true)}
      <div className="text-xs mt-2" style={{ color: T.dim }}>«Tutto arrivato» carica il magazzino con la quantità reale.</div>
    </div>
  );
  if (tipo === "soglie") return (
    <div className="rounded-2xl p-4 mb-3 flex items-center justify-around" style={box}>
      <div className="text-center"><div className="text-xs" style={{ color: T.dim }}>Lun–Ven</div><div className="font-extrabold text-lg" style={{ color: T.blu }}>4</div></div>
      <TrendingUp size={18} style={{ color: T.tenue }} />
      <div className="text-center"><div className="text-xs" style={{ color: T.dim }}>Sab–Dom</div><div className="font-extrabold text-lg" style={{ color: T.verde }}>6</div></div>
      <span className="text-xs font-bold" style={{ color: T.tenue }}>(× 1,5)</span>
    </div>
  );
  return null;
}

function GuidaTour({ passi, onFine }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const passo = passi[i] || {};
  useEffect(() => {
    let vivo = true, elTgt = null, onTap = null;
    const inVista = (el) => { const r = el.getBoundingClientRect(); const w = window.innerWidth || 0, h = window.innerHeight || 0; return r.top >= 6 && r.left >= 0 && r.bottom <= h - 6 && r.right <= w; };
    const misura = () => {
      const el = passo.sel ? [...document.querySelectorAll(passo.sel)].find((e) => e.getBoundingClientRect().width > 0) : null;
      if (el) {
        const r = el.getBoundingClientRect(); if (vivo) setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        if (passo.attendi && !onTap) { elTgt = el; onTap = () => { if (vivo) setI((x) => (x < passi.length - 1 ? x + 1 : x)); }; el.addEventListener("click", onTap); }
      } else if (vivo) setRect(null);
    };
    const el0 = passo.sel ? [...document.querySelectorAll(passo.sel)].find((e) => e.getBoundingClientRect().width > 0) : null;
    /* scorri SOLO se l'elemento non è già visibile, e senza centrare in
       orizzontale (evita lo spostamento laterale della pagina). */
    if (el0 && !inVista(el0)) { try { el0.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch {} }
    misura();
    const ts = [setTimeout(misura, 120), setTimeout(misura, 320)];
    window.addEventListener("resize", misura); window.addEventListener("scroll", misura, true);
    return () => { vivo = false; ts.forEach(clearTimeout); window.removeEventListener("resize", misura); window.removeEventListener("scroll", misura, true); if (elTgt && onTap) elTgt.removeEventListener("click", onTap); };
  }, [i]);

  const ultimo = i >= passi.length - 1;
  const H = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardStile = !rect
    ? { top: "50%", transform: "translateY(-50%)" }
    : rect.top < H * 0.5
      ? { bottom: "calc(1rem + env(safe-area-inset-bottom))" }
      : { top: "calc(1rem + env(safe-area-inset-top))" };

  return (
    <div className="fixed inset-0" style={{ zIndex: 80, pointerEvents: "none" }}>
      {!passo.attendi && <div className="fixed inset-0" onClick={onFine} style={{ background: rect ? "transparent" : "rgba(11,20,40,.62)", pointerEvents: "auto" }} />}
      {rect && (
        <div style={{ position: "fixed", top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
          borderRadius: 18, boxShadow: "0 0 0 9999px rgba(11,20,40,.62)", border: `2px solid ${passo.attendi ? T.verde : "#fff"}`, pointerEvents: "none", transition: "all .28s ease",
          animation: passo.attendi ? "scPulsa 1.4s ease-in-out infinite" : "none" }} />
      )}
      <div className="fixed left-3 right-3 mx-auto" style={{ maxWidth: 430, zIndex: 81, pointerEvents: "auto", ...cardStile }}>
        <div className="rounded-3xl p-5 sc-su" style={{ background: "#fff", border: `1px solid ${T.bordo}`, boxShadow: "0 24px 60px -18px rgba(40,60,130,.5)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold" style={{ color: T.blu }}>Passo {i + 1} di {passi.length}</span>
            <button onClick={onFine} className="flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1" style={{ color: T.dim, background: "#F0F3FB" }}>Salta <X size={12} /></button>
          </div>
          {passo.illustra && <IllustraGuida tipo={passo.illustra} />}
          <div className="font-extrabold text-lg" style={{ color: T.ink }}>{passo.titolo}</div>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: T.dim }}>{passo.testo}</p>
          {passo.attendi && (
            <div className="flex items-center gap-2 mt-3 rounded-2xl px-3 py-2 text-sm font-bold animate-pulse" style={{ background: "#E4F6EE", color: T.verde }}>
              <ChevronRight size={16} /> Tocca l'elemento evidenziato per continuare
            </div>
          )}
          <div className="flex gap-1 mt-4 mb-3">
            {passi.map((_, k) => <span key={k} className="h-1.5 rounded-full transition-all" style={{ flex: 1, background: k <= i ? T.blu : "#E4E9F5" }} />)}
          </div>
          <div className="flex gap-2 justify-end">
            {i > 0 && <Bottone variante="fantasma" icona={ArrowLeft} onClick={() => setI(i - 1)}>Indietro</Bottone>}
            {passo.attendi
              ? <Bottone variante="tonale" icona={ChevronRight} onClick={() => (ultimo ? onFine() : setI(i + 1))}>Salta il passo</Bottone>
              : <Bottone icona={ultimo ? Check : ChevronRight} onClick={() => (ultimo ? onFine() : setI(i + 1))}>{ultimo ? "Ho capito" : "Avanti"}</Bottone>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   PLANCIA == la sala di controllo della rete. Quattro viste sugli
   STESSI dati veri dell'app (nessun esempio inventato):
     Rete       -> come i magazzini sono collegati fra loro,
                   dove scorre davvero la merce e quali dati
                   non tornano (i "controlli");
     Struttura  -> cosa sta dentro cosa: sede, magazzino,
                   categoria, prodotto, con il riempimento a
                   ogni livello;
     Settimana  -> i livelli previsti giorno per giorno, con il
                   totale del magazzino e di ogni categoria;
     Caselle    -> la board operativa del singolo magazzino,
                   raggruppata per categoria.
   La selezione e la barra comandi sono condivise: quello che
   scegli in una vista resta scelto nelle altre, e ogni casellina
   a tre stati (vuota / mezza / piena) funziona sempre allo
   stesso modo a qualunque livello dell'albero.
   =========================================================== */
const pctRiemp = (qty, par) => (par > 0 ? qty / par : qty > 0 ? 1 : 0);
const coloreRiemp = (pct) => (pct < 0.5 ? T.rosso : pct < 1 ? T.ambra : T.verde);
const chiaveArt = (magId, prodId) => `${magId}|${prodId}`;
const riempLista = (arts) => (arts.length
  ? arts.reduce((s, a) => s + Math.min(1, pctRiemp(a.qty, parOggi(a))), 0) / arts.length : 0);
const riempMag = (m) => riempLista(m.articoli);
const taglia = (s, n) => ((s || "").length > n ? (s || "").slice(0, n - 1) + "…" : (s || ""));
const statoSelMag = (m, sel) => {
  if (!m.articoli.length) return "vuoto";
  let n = 0;
  for (const a of m.articoli) if (sel.has(chiaveArt(m.id, a.prodottoId))) n++;
  return n === 0 ? "no" : n === m.articoli.length ? "tutti" : "parte";
};
/* prodotti che si muovono solo a pezzi interi (una confezione di bufala
   non si spedisce a metà): il flag sta sul prodotto e vale in tutta la rete */
const soloInteri = (stato, art) => !!trova(stato.prodotti, art.prodottoId)?.soloInteri;
/* un prodotto che si spedisce solo intero non si muove a metà. Quando è un
   BISOGNO si sale al pezzo intero successivo (meglio uno in più che restare a
   secco), quando è un PRELIEVO da una giacenza che non basta si scende al
   pezzo intero precedente (mezza confezione non si può portare via). */
const suInteri = (n) => Math.max(0, Math.ceil((+n || 0) - 1e-6));
const giuInteri = (n) => Math.max(0, Math.floor((+n || 0) + 1e-6));
const parGiorno = (a, d) => (a.parGiorni && a.parGiorni[d] != null ? a.parGiorni[d] : a.par);
const eIntero = (n) => Math.abs(n - Math.round(n)) < 1e-9;
const GIORNI = [["1", "L"], ["2", "M"], ["3", "M"], ["4", "G"], ["5", "V"], ["6", "S"], ["0", "D"]];
const NOMI_GIORNI = { "1": "lunedì", "2": "martedì", "3": "mercoledì", "4": "giovedì", "5": "venerdì", "6": "sabato", "0": "domenica" };
/* vibrazione leggera (solo dove il telefono la supporta) */
const vibra = (ms = 10) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch {} };

/* anteprima: mostra dove finirà il riempimento medio prima di applicare */
function AnteprimaLivello({ da, a }) {
  return (
    <div className="rounded-2xl px-3.5 py-3" style={{ background: "#F6F8FE", border: `1px solid ${T.bordo}` }}>
      <div className="flex items-center justify-between text-xs font-bold mb-1.5" style={{ color: T.dim }}>
        <span>Riempimento medio</span>
        <span style={{ color: T.ink }}>{Math.round(da * 100)}% <span style={{ color: T.tenue }}>→</span> <b style={{ color: coloreRiemp(a) }}>{Math.round(a * 100)}%</b></span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#E4E9F5" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(2, a * 100))}%`, background: coloreRiemp(a), transition: "width .5s cubic-bezier(.4,1.3,.5,1), background .3s" }} />
      </div>
    </div>
  );
}

/* griglia guidata dei livelli giorno per giorno (accetta i decimali) */
function GrigliaGiorni({ gg, setGG, passo, interi }) {
  const val = (d) => { const n = num(gg[d]); return n == null ? 0 : n; };
  const max = Math.max(1, ...GIORNI.map(([d]) => val(d)));
  const cambia = (d, v) => setGG((x) => ({ ...x, [d]: v }));
  const sc = interi ? 1 : passo;   // i prodotti interi si muovono solo di 1
  const scatto = (d, seg) => {
    const grezzo = val(d) + seg * sc;
    const n = Math.max(0, interi ? Math.round(grezzo) : +(grezzo.toFixed(2)));
    vibra(6); cambia(d, String(n).replace(".", ","));
  };
  return (
    <div className="grid grid-cols-7 gap-1">
      {GIORNI.map(([d, lett]) => {
        const v = val(d);
        const vuoto = !gg[d] || String(gg[d]).trim() === "";
        return (
          <div key={d} className="flex flex-col items-center gap-1">
            <span className="text-xs font-extrabold" style={{ color: d === "6" || d === "0" ? T.viola : T.tenue }}>{lett}</span>
            <div className="w-full flex items-end justify-center" style={{ height: 44 }}>
              <div className="w-full rounded-lg" style={{ height: `${vuoto ? 3 : Math.max(6, (v / max) * 44)}px`,
                background: vuoto ? "#E4E9F5" : d === "6" || d === "0" ? T.viola : T.blu, opacity: vuoto ? 1 : 0.55 + 0.45 * (v / max),
                transition: "height .4s cubic-bezier(.4,1.3,.5,1), opacity .3s" }} />
            </div>
            <input value={gg[d] ?? ""} onChange={(e) => cambia(d, puliziaNum(e.target.value))}
              inputMode="decimal" placeholder="–" aria-label={`Livello ${NOMI_GIORNI[d]}`}
              className="w-full rounded-lg px-0.5 py-1.5 text-sm font-bold text-center"
              style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}`, color: T.ink, outline: "none" }} />
            <div className="flex gap-0.5 w-full">
              <button type="button" onClick={() => scatto(d, -1)} aria-label={`Meno ${NOMI_GIORNI[d]}`}
                className="flex-1 rounded-md flex items-center justify-center" style={{ height: 22, background: "#F0F3FB", color: T.dim }}><Minus size={11} /></button>
              <button type="button" onClick={() => scatto(d, 1)} aria-label={`Più ${NOMI_GIORNI[d]}`}
                className="flex-1 rounded-md flex items-center justify-center" style={{ height: 22, background: "#EAF0FE", color: T.blu }}><Plus size={11} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* contatore animato: il numero "corre" fino al valore nuovo */
function useContaFino(v) {
  const [x, setX] = useState(v);
  const prev = useRef(v);
  useEffect(() => {
    const da = prev.current, a = v; prev.current = v;
    if (da === a) return;
    let raf; const t0 = performance.now(); const dur = 550;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3);
      setX(da + (a - da) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [v]);
  return x;
}

/* coriandoli: esplosione festosa quando si "fa il pieno" */
function Coriandoli({ colpo }) {
  const pezzi = React.useMemo(() => Array.from({ length: 20 }, (_, k) => ({
    x: (Math.random() * 2 - 1) * 150, y: -(50 + Math.random() * 150), r: (Math.random() * 2 - 1) * 300,
    c: PALETTE[k % PALETTE.length], d: Math.random() * 0.14, s: 6 + Math.random() * 7,
  })), [colpo]);
  if (!colpo) return null;
  return (
    <div key={colpo} className="pointer-events-none fixed inset-x-0 flex justify-center" style={{ bottom: "42%", zIndex: 60 }}>
      {pezzi.map((p, k) => (
        <span key={k} style={{ position: "absolute", width: p.s, height: p.s, borderRadius: 3, background: p.c,
          "--fx": `${p.x}px`, "--fy": `${p.y}px`, "--fr": `${p.r}deg`,
          animation: `scFesta .95s cubic-bezier(.2,.7,.3,1) ${p.d}s both` }} />
      ))}
    </div>
  );
}

const controlloQ = (a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const off = Math.min(34, len * 0.22);
  return { cx: (a.x + b.x) / 2 - (dy / len) * off, cy: (a.y + b.y) / 2 + (dx / len) * off };
};
const puntoQ = (a, c, b, k) => ({
  x: (1 - k) * (1 - k) * a.x + 2 * (1 - k) * k * c.cx + k * k * b.x,
  y: (1 - k) * (1 - k) * a.y + 2 * (1 - k) * k * c.cy + k * k * b.y,
});

function PlanciaTessera({ prod, cat, qty, par, sym, sel, onSel, onStep, i, interi, tocco, ritardo }) {
  const pct = pctRiemp(qty, par);
  const col = coloreRiemp(pct);
  const largh = Math.max(qty > 0 ? 6 : 0, Math.min(100, pct * 100));
  /* lo scarto dal livello previsto detto in chiaro: e' il numero che
     serve davvero per decidere quanto muovere, senza fare i conti */
  const scarto = +(qty - par).toFixed(2);
  const scartoTxt = !(par > 0) ? "senza soglia"
    : scarto === 0 ? "a livello"
    : scarto < 0 ? `mancano ${fmtQ(-scarto)} ${sym}`
    : `+${fmtQ(scarto)} ${sym}`;
  const scartoCol = !(par > 0) ? T.tenue : scarto === 0 ? T.verde : scarto < 0 ? col : T.blu;
  return (
    <div className="relative rounded-3xl p-3 flex flex-col gap-2.5 sc-pop"
      style={{ background: sel ? "#EEF3FF" : T.sup, border: `2px solid ${sel ? T.blu : T.bordo}`,
        boxShadow: sel ? `0 12px 28px -12px ${T.blu}99` : "0 6px 18px -15px rgba(50,70,140,.55)",
        transform: sel ? "translateY(-3px)" : "none", transition: "border-color .2s, box-shadow .2s, transform .2s",
        animationDelay: `${Math.min(i, 14) * 32}ms` }}>
      {tocco && <span className="sc-tocco absolute inset-0 rounded-3xl pointer-events-none" style={{ animationDelay: `${ritardo || 0}ms` }} />}
      <button type="button" onClick={onSel} className="flex items-start gap-2 w-full" style={{ textAlign: "left" }}>
        <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: cat?.colore || T.viola }} />
        <span className="flex-1 min-w-0 font-extrabold leading-tight" style={{ color: T.ink, minHeight: 34,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{prod?.nome || "—"}</span>
        <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: sel ? T.blu : "#EEF2FB", border: `1.5px solid ${sel ? T.blu : T.bordo}`, transition: "all .2s" }}>
          {sel && <Check size={14} color="#fff" />}
        </span>
      </button>
      <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: "#E9EDF7", animation: pct >= 1 ? "scLampo .8s ease" : "none" }}>
        <div className="h-full rounded-full" style={{ width: `${largh}%`, background: col, transition: "width .5s cubic-bezier(.4,1.3,.5,1)" }} />
        {/* tacca bianca dove sta la soglia: quando sei sopra, vedi di quanto */}
        {par > 0 && pct > 1.02 && (
          <span className="absolute top-0 bottom-0" style={{ left: `${Math.max(4, Math.min(96, 100 / pct))}%`, width: 2, background: "#fff", opacity: 0.9 }} />
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 leading-none">
          <span key={qty} className="sc-conta inline-block text-lg font-extrabold" style={{ color: col }}>{fmtQ(qty)}</span>
          <span className="text-xs font-bold ml-1" style={{ color: T.tenue }}>{" "}di {fmtQ(par)} {sym}</span>
          <span className="flex items-center gap-1 mt-1">
            <span className="font-bold truncate" style={{ color: scartoCol, fontSize: 10 }}>{scartoTxt}</span>
            {/* icona viola == si spedisce solo intero, i +/- vanno di 1 in 1 */}
            {interi && <PackageCheck size={11} style={{ color: T.viola, flexShrink: 0 }} />}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={() => onStep(-1)} aria-label="Diminuisci"
            className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#F0F3FB", color: T.dim }}><Minus size={16} /></button>
          <button type="button" onClick={() => onStep(1)} aria-label="Aumenta"
            className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EAF0FE", color: T.blu }}><Plus size={16} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---- RETE: la topologia vera della rete, leggibile anche con molti
   magazzini. I magazzini sono raggruppati in BANDE per sede (con la
   percentuale di riempimento della sede), i nomi stanno su due righe e
   i collegamenti non si incrociano piu': escono dal bordo destro di chi
   rifornisce, corrono su un BINARIO verticale dedicato alla sede e
   rientrano sempre dal bordo sinistro con una freccia orizzontale.
   Toccando un nodo si ACCENDE il suo percorso spegnendo il resto: e' il
   modo piu diretto per capire "cosa alimenta cosa". ---- */
const spezzaNome = (nome, max = 12) => {
  const par = String(nome || "").split(/\s+/).filter(Boolean);
  const l = ["", ""]; let i = 0;
  for (const p of par) {
    const t = l[i] ? l[i] + " " + p : p;
    if (t.length <= max) { l[i] = t; continue; }
    if (i === 0 && !l[0]) { l[0] = taglia(p, max); continue; }
    if (i === 0) { i = 1; l[1] = taglia(p, max); continue; }
    l[1] = taglia(l[1] + " " + p, max); break;
  }
  return l[1] ? l : [l[0] || "—"];
};
const NW = 92, NH = 50;               // riquadro di un magazzino
const BX = 124, BW = 212;             // riquadro chiaro della sede
const COLX = { laboratorio: 50, retro: 178, "linea-retro": 288, "linea-lab": 288 };

/* Da dove arriva la merce di questo magazzino. Si risolve sempre su tutto lo
   stato, non sui soli magazzini disegnati: così il nome del rifornitore resta
   scritto anche a chi quel magazzino non lo vede in mappa. */
function rifornitoreDi(stato, m) {
  if (m.tipo === "retro") return { verso: "da", nome: "fornitore" };
  if (m.tipo === "laboratorio") return { verso: "serve", nome: "le linee" };
  if (m.tipo === "linea-retro") {
    const r = trova(stato.magazzini, m.rifMagazzinoId)
      || stato.magazzini.find((x) => x.sedeId === m.sedeId && x.tipo === "retro");
    return r ? { verso: "da", nome: r.nome } : { verso: "", nome: "nessun rifornitore" };
  }
  const sede = trova(stato.sedi, m.sedeId);
  const lab = sede?.labSedeId
    && stato.magazzini.find((x) => x.sedeId === sede.labSedeId && x.tipo === "laboratorio");
  return lab ? { verso: "da", nome: lab.nome } : { verso: "", nome: "nessun rifornitore" };
}
/* il riquadro e' largo 92px: ci sta una riga sola e corta. Il numero di
   articoli lascia il posto al rifornitore, che e' l'informazione che mancava;
   il conteggio resta nel riquadro aperto e nella scheda Struttura. */
const rifornitoreBreve = (stato, m) => {
  const r = rifornitoreDi(stato, m);
  return taglia((r.verso ? r.verso + " " : "") + r.nome, 17);
};

/* percorso a gomito con angoli arrotondati: dal bordo destro di "a",
   sul binario verticale mx, dentro il bordo sinistro di "b" */
const gomito = (a, b, mx) => {
  const x0 = a.x + NW / 2, x1 = b.x - NW / 2;
  const s = b.y >= a.y ? 1 : -1;
  const r = Math.min(9, Math.abs(b.y - a.y) / 2, Math.abs(mx - x0), Math.abs(x1 - mx));
  if (!(r > 1.5)) return `M${x0} ${a.y} L${x1} ${b.y}`;
  return `M${x0} ${a.y} H${mx - r} Q${mx} ${a.y} ${mx} ${a.y + s * r} V${b.y - s * r} Q${mx} ${b.y} ${mx + r} ${b.y} H${x1}`;
};
/* punto a frazione k del gomito: serve ai pacchetti in movimento */
const puntoGomito = (a, b, mx, k) => {
  const x0 = a.x + NW / 2, x1 = b.x - NW / 2;
  const p = [[x0, a.y], [mx, a.y], [mx, b.y], [x1, b.y]];
  const d = []; let tot = 0;
  for (let i = 1; i < p.length; i++) {
    const l = Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]);
    d.push(l); tot += l;
  }
  let t = Math.max(0, Math.min(1, k)) * tot;
  for (let i = 0; i < d.length; i++) {
    if (t <= d[i] || i === d.length - 1) {
      const f = d[i] > 0 ? Math.min(1, t / d[i]) : 0;
      return { x: p[i][0] + (p[i + 1][0] - p[i][0]) * f, y: p[i][1] + (p[i + 1][1] - p[i][1]) * f };
    }
    t -= d[i];
  }
  return { x: x1, y: b.y };
};

/* ─────────── CHI VEDE COSA, CHI TOCCA COSA ───────────
   Una regola sola, usata da tutte le schermate, così non può succedere che
   una pagina sia più permissiva di un'altra. */
function sediViste(stato, profilo) {
  if (profilo.ruolo === "admin") return stato.sedi;
  /* il laboratorio guarda anche le sedi operatore che rifornisce */
  return stato.sedi.filter((s) => s.id === profilo.sedeId
    || (profilo.ruolo === "laboratorio" && s.labSedeId === profilo.sedeId));
}
function magazziniVisti(stato, profilo) {
  if (profilo.ruolo === "admin") return stato.magazzini;
  const ok = new Set(sediViste(stato, profilo).map((s) => s.id));
  return stato.magazzini.filter((m) => ok.has(m.sedeId));
}
/* si modifica solo casa propria: le sedi rifornite si vedono e basta */
function puoModificare(profilo, m) {
  return !!m && (profilo.ruolo === "admin" || m.sedeId === profilo.sedeId);
}
/* ── LA STRUTTURA SI TOCCA SOLO CON L'AUTORIZZAZIONE (gen-5.94) ──
   Chiesto da Valerio: «a regime questi 2 profili dovranno solo vedere
   quello che devono fare, non dovranno modificare magazzini senza
   autorizzazione». STRUTTURA vuol dire la forma del magazzino: aggiungere,
   modificare o rimuovere articoli, soglie, livelli previsti, unita',
   spostare in blocco. Il LAVORO DI TUTTI I GIORNI — contare, rettificare
   una giacenza, scartare, trasferire scorte, produrre, evadere, ricevere —
   NON passa da qui e resta a tutti, come prima.
   L'autorizzazione e' un interruttore sul profilo (campo «struttura»),
   che l'admin accende da Gestione › Profili. Un profilo vecchio non ha il
   campo, quindi parte SENZA autorizzazione: e' il verso giusto del
   default — la sicurezza non deve dipendere dal ricordarsi di spegnere. */
function puoStruttura(profilo) {
  return profilo?.ruolo === "admin" || !!profilo?.struttura;
}
/* ── TRE INTERRUTTORI, gen-5.95. Chiesto da Valerio: «le modifiche e la
   gestione generale va lasciata all'admin, gli altri profili possono
   essere autorizzati ma non e' scontato».
   · struttura  = la forma del magazzino (gen-5.94, invariato)
   · correzioni = i numeri: rettifica, scarto, trasferisci, inventario,
                  comandi quantita' in Plancia, annulla, ripristino
   · ordini     = il ciclo d'acquisto: ricalcola, segna ordinato, rimuovi
                  riga, report e testi da mandare, storico ordini
   Il MESTIERE — contare, evadere, produrre, scrivere le dosi, RICEVERE la
   merce — non passa da qui e resta a tutti.
   LA STRUTTURA COMPRENDE LE CORREZIONI: e' una scala, non tre assi — chi
   puo' cambiare la forma puo' a maggior ragione correggere i numeri; il
   contrario produrrebbe schermate a meta' (Soglie senza Riempi).
   Un profilo vecchio non ha i campi: parte tutto spento.
   LIMITE DICHIARATO: muta() non autorizza niente lato server — questi
   muri sono interfaccia. Vale per tutta l'app, da sempre, e va sanato al
   livello giusto (il server), non qui. */
function puoCorreggere(profilo) {
  return puoStruttura(profilo) || !!profilo?.correzioni;
}
function puoOrdinare(profilo) {
  return profilo?.ruolo === "admin" || !!profilo?.ordini;
}
/* il QUARTO interruttore (gen-5.96): battere in cassa e' mestiere DI CHI STA
   IN CASSA, non di tutti — e non e' compreso in nessuno degli altri tre:
   vendere non da' correzioni, ne' ordini, ne' struttura, e viceversa. */
function puoCassa(profilo) {
  return profilo?.ruolo === "admin" || !!profilo?.cassa;
}
/* la scala dei permessi su UN magazzino: pieno > rettifica > lettura.
   Una regola sola per dettaglio, inventario, Plancia e ripristino; l'unica
   specialita' di ruolo che resta e' che il laboratorio e' competente solo
   sui magazzini di tipo laboratorio. */
function permessoSu(profilo, m) {
  if (!m) return "lettura";
  if (profilo.ruolo === "admin") return "pieno";
  if (m.sedeId !== profilo.sedeId) return "lettura";
  if (profilo.ruolo === "laboratorio" && m.tipo !== "laboratorio") return "lettura";
  if (puoStruttura(profilo)) return "pieno";
  if (puoCorreggere(profilo)) return "rettifica";
  return "lettura";
}
/* le linee che questo magazzino laboratorio rifornisce davvero */
function lineeDelLab(stato, mag) {
  if (!mag || mag.tipo !== "laboratorio") return [];
  return stato.magazzini.filter((m) => m.tipo === "linea-lab"
    && trova(stato.sedi, m.sedeId)?.labSedeId === mag.sedeId);
}
/* ...e quelle che quel prodotto ce l'hanno per davvero */
function lineeColProdotto(stato, mag, pid) {
  return lineeDelLab(stato, mag).filter((m) => m.articoli.some((a) => a.prodottoId === pid));
}
/* Toglie il prodotto dal magazzino. Se il magazzino è un laboratorio, il
   prodotto non si fa più: se ne va anche dalle linee che lo aspettavano,
   altrimenti resterebbero a chiedere una cosa che non arriverà mai. */
function togliArticolo(s, magId, pid) {
  const m = trova(s.magazzini, magId); if (!m) return 0;
  m.articoli = m.articoli.filter((x) => x.prodottoId !== pid);
  let n = 0;
  for (const l of lineeDelLab(s, m)) {
    const prima = l.articoli.length;
    l.articoli = l.articoli.filter((x) => x.prodottoId !== pid);
    if (l.articoli.length !== prima) n++;
  }
  return n;
}

/* Chi rifornisce questa linea: l'id del magazzino retro, oppure "_lab".
   È la stessa regola che disegna i collegamenti, così la riga e la freccia
   non possono raccontare due storie diverse. */
function fonteLinea(stato, m) {
  if (m.tipo !== "linea-retro") return "_lab";
  return m.rifMagazzinoId
    || stato.magazzini.find((x) => x.sedeId === m.sedeId && x.tipo === "retro")?.id || null;
}

function costruisciRete(stato, mags) {
  const RH = 62, GAP = 22;
  const labs = mags.filter((m) => m.tipo === "laboratorio");
  const nodi = {}; const bande = [];
  const sedi = stato.sedi.filter((s) => mags.some((m) => m.sedeId === s.id && m.tipo !== "laboratorio"));
  let y = 16;
  for (const s of sedi) {
    const retri = mags.filter((m) => m.sedeId === s.id && m.tipo === "retro");
    const linee = mags.filter((m) => m.sedeId === s.id && (m.tipo === "linea-retro" || m.tipo === "linea-lab"));
    /* Ogni linea va sulla RIGA di chi la rifornisce: la freccia diventa corta
       e la coppia si legge da sola, senza seguire un filo per mezza pagina.
       Le linee servite dal laboratorio stanno in cima, su righe dove la
       colonna dei retro resta vuota: il filo che arriva da sinistra non passa
       più dietro a un magazzino retro — era quello a far sembrare che fosse
       lui a rifornirle. */
    const righe = [];
    for (const l of linee) if (fonteLinea(stato, l) === "_lab") righe.push({ r: null, l });
    for (const r of retri) {
      const sue = linee.filter((x) => fonteLinea(stato, x) === r.id);
      if (!sue.length) { righe.push({ r, l: null }); continue; }
      sue.forEach((x, i) => righe.push({ r: i === 0 ? r : null, l: x }));
    }
    /* linee il cui rifornitore non sta in questa sede: riga propria, senza
       inventare accoppiamenti che non esistono */
    for (const l of linee) if (!righe.some((rg) => rg.l === l)) righe.push({ r: null, l });
    const nr = Math.max(1, righe.length);
    const h = nr * RH + 20;
    bande.push({ id: s.id, nome: s.nome, y, h });
    righe.forEach((rg, i) => {
      const yy = y + 18 + i * RH + 25;
      if (rg.r) nodi[rg.r.id] = { m: rg.r, x: COLX.retro, y: yy, banda: s.id };
      if (rg.l) nodi[rg.l.id] = { m: rg.l, x: COLX["linea-retro"], y: yy, banda: s.id };
    });
    y += h + GAP;
  }
  /* magazzini che non stanno in nessuna sede operativa (es. il retro di
     una sede laboratorio): una banda a parte, senza inventare nulla */
  const orfani = mags.filter((m) => m.tipo !== "laboratorio" && !nodi[m.id]);
  if (orfani.length) {
    const h = orfani.length * RH + 20;
    bande.push({ id: "_altri", nome: "Altri magazzini", y, h });
    orfani.forEach((m, i) => { nodi[m.id] = { m, x: COLX.retro, y: y + 18 + i * RH + 25, banda: "_altri" }; });
    y += h + GAP;
  }
  const H = Math.max(150, y);
  labs.forEach((m, i) => { nodi[m.id] = { m, x: COLX.laboratorio, y: H / 2 + (i - (labs.length - 1) / 2) * RH, banda: "_lab" }; });
  /* un binario verticale per ogni sede: i collegamenti che escono dal
     laboratorio corrono su corsie diverse e non si sovrappongono */
  const corsia = {};
  bande.forEach((bn, i) => { corsia[bn.id] = Math.min(BX - 6, 104 + i * 5); });

  const links = [];
  const agg = (da, a, eti, tipo) => {
    if (!nodi[da] || !nodi[a] || da === a) return;
    if (links.some((l) => l.da === da && l.a === a)) return;
    const A = nodi[da], B = nodi[a];
    const mx = A.x < COLX.retro ? (corsia[B.banda] || BX - 8) : (COLX.retro + COLX["linea-retro"]) / 2;
    links.push({ da, a, eti, mx, tipo });
  };
  for (const m of mags) {
    const sede = trova(stato.sedi, m.sedeId);
    if (m.tipo === "linea-retro") {
      const r = m.rifMagazzinoId || stato.magazzini.find((x) => x.sedeId === m.sedeId && x.tipo === "retro")?.id;
      if (r) agg(r, m.id, "rifornimento", "retro");
    }
    /* dal laboratorio partono SOLO le linee che serve: un magazzino retro si
       riempie ordinando dal fornitore, e disegnarlo appeso al laboratorio
       faceva leggere tutta la mappa al contrario */
    if (m.tipo === "linea-lab" && sede?.labSedeId) {
      const lab = stato.magazzini.find((x) => x.sedeId === sede.labSedeId && x.tipo === "laboratorio");
      if (lab) agg(lab.id, m.id, "rifornimento", "lab");
    }
  }
  return { nodi, bande, links, H };
}

/* pacchetti in movimento: solo sui collegamenti in evidenza, per non
   affollare la mappa quando i magazzini sono molti */
function ParticelleRete({ nodi, links }) {
  const [fase, setFase] = useState(0);
  useEffect(() => {
    const meno = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (meno || !links.length) return;
    let raf; const t0 = performance.now();
    const tick = (ora) => { setFase(((ora - t0) / 2800) % 1); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [links.length]);
  return (
    <g>
      {links.map((l, i) => {
        const a = nodi[l.da], b = nodi[l.a];
        if (!a || !b) return null;
        const k = (fase + i * 0.23) % 1;
        const p = puntoGomito(a, b, l.mx, k);
        const col = TIPI_MAG[b.m.tipo]?.colore || T.blu;
        return (
          <g key={l.da + l.a}>
            <circle cx={p.x} cy={p.y} r="7" fill={col} opacity="0.2" />
            <circle cx={p.x} cy={p.y} r="4" fill={col} />
          </g>
        );
      })}
    </g>
  );
}

/* ---- CONTROLLI: le incoerenze vere dei dati, ognuna con la sua
   selezione pronta. Non inventa problemi: guarda soglie mancanti,
   prodotti interi con numeri a metà, per-giorno inutile e magazzini
   che nessuno rifornisce. ---- */
/* Un prodotto a catalogo che non sta in nessuna casella è invisibile a tutto il
   resto dell'app: nessuno lo conta, non finisce mai in un ordine, l'inventario
   non lo incontra. Se apri la sua scheda l'app te lo dice già, ma nessuno apre
   cento schede: va contato e nominato in un posto dove si guarda.
   Il controllo guarda TUTTI i magazzini e non quelli filtrati a schermo: un
   prodotto che sta in un magazzino di un'altra sede non è dimenticato. */
const prodottiFuori = (stato) => stato.prodotti.filter((p) =>
  !stato.magazzini.some((m) => (m.articoli || []).some((a) => a.prodottoId === p.id)));

function controlli(stato, mags) {
  const out = [];
  const racc = (test) => {
    const k = [];
    for (const m of mags) for (const a of m.articoli) if (test(m, a)) k.push(chiaveArt(m.id, a.prodottoId));
    return k;
  };
  /* Prima di tutto il resto: una casella tenuta in un'unità diversa da quella
     base del prodotto, senza il fattore di conversione, viene contata 1:1.
     È l'errore più insidioso che ci sia in un gestionale di magazzino, perché
     i numeri restano plausibili e nessuno se ne accorge finché non arriva
     l'ordine sbagliato. Va detto per primo e a voce alta. */
  const senzaConv = racc((m, a) => {
    const p = trova(stato.prodotti, a.prodottoId);
    return !!p && a.uomId !== p.uomBase && fattore(p, a.uomId) == null;
  });
  if (senzaConv.length) {
    const coppie = [...new Set(senzaConv.map((k) => {
      const [mid, pid] = k.split("|");
      const p = trova(stato.prodotti, pid);
      if (!p) return null;
      return `${p.nome} (tenuto in ${simboloU(stato, trova(stato.magazzini, mid)
        ?.articoli.find((x) => x.prodottoId === pid)?.uomId)}, base ${simboloU(stato, p.uomBase)})`;
    }).filter(Boolean))];
    out.push({ id: "conv", et: "conversione mancante", col: T.rosso, ic: AlertTriangle, chiavi: senzaConv,
      aiuto: `ATTENZIONE: queste caselle sono tenute in un'unità diversa da quella base del prodotto e manca il fattore che le lega. L'app le conta 1:1, quindi i fabbisogni e gli ordini che ne derivano escono sbagliati. Il fattore si mette in Catalogo, sulla scheda del prodotto. Riguarda: ${coppie.slice(0, 10).join(" · ")}${coppie.length > 10 ? ` e altri ${coppie.length - 10}` : ""}.` });
  }
  /* Una conversione stimata dall'app non è rotta: è provvisoria. Va detto in
     ambra, non in rosso, e va detto finché qualcuno non prende la bilancia. */
  const stimate = racc((m, a) => {
    const p = trova(stato.prodotti, a.prodottoId);
    return !!p && a.uomId !== p.uomBase && convStimata(p, a.uomId);
  });
  if (stimate.length) {
    const nomi = [...new Set(stimate.map((k) => trova(stato.prodotti, k.split("|")[1])?.nome).filter(Boolean))];
    out.push({ id: "convstim", et: "conversione stimata", col: T.ambra, ic: Gauge, chiavi: stimate,
      aiuto: `Queste conversioni le ha proposte l'app, nessuno le ha ancora verificate con una bilancia. I conti tornano, ma sono approssimati: il primo che pesa una teglia o un pezzo puo' correggerli da Catalogo, tasto «Conversioni», e il marchio sparisce. Riguarda: ${nomi.slice(0, 10).join(" · ")}${nomi.length > 10 ? ` e altri ${nomi.length - 10}` : ""}.` });
  }
  const nopar = racc((m, a) => !(parOggi(a) > 0));
  if (nopar.length) out.push({ id: "nopar", et: "senza soglia", col: T.tenue, ic: Ruler, chiavi: nopar,
    aiuto: "Senza livello previsto l'app non puo' dire quando sono sotto scorta. Selezionale e usa «Soglia»." });
  const meta = racc((m, a) => soloInteri(stato, a)
    && (!eIntero(a.qty) || !eIntero(a.par ?? 0) || GIORNI.some(([d]) => !eIntero(parGiorno(a, d) ?? 0))));
  if (meta.length) out.push({ id: "meta", et: "interi a metà", col: T.viola, ic: Sparkles, chiavi: meta,
    aiuto: "Prodotti che si spediscono solo interi ma hanno numeri a metà. Selezionali e usa «Arrotonda»." });
  const rid = racc((m, a) => !!a.parGiorni && GIORNI.every(([d]) => parGiorno(a, d) === a.par));
  if (rid.length) out.push({ id: "rid", et: "per-giorno inutile", col: T.blu, ic: TrendingUp, chiavi: rid,
    aiuto: "Hanno i sette giorni tutti uguali alla soglia base: puoi semplificarli con «Per giorno» e «Svuota tutto»." });
  const fuori = prodottiFuori(stato);
  if (fuori.length) out.push({ id: "fuori", et: "in nessun magazzino", col: T.tenue, ic: Boxes, chiavi: [], n: fuori.length,
    aiuto: `${fuori.length} prodott${fuori.length === 1 ? "o è" : "i sono"} a catalogo ma non ${fuori.length === 1 ? "sta" : "stanno"} in nessuna casella: nessuno li conta, non finiscono mai in un ordine e l'inventario non li incontra. Sono ${fuori.map((p) => p.nome).slice(0, 12).join(" · ")}${fuori.length > 12 ? ` e altri ${fuori.length - 12}` : ""}. In Catalogo, sulla linguetta Prodotti, c'è l'avviso che li mostra da soli: da lì decidi se assegnarli a un magazzino o toglierli.` });
  /* qui non c'e' una casella da correggere: manca il collegamento */
  const senzaRif = mags.filter((m) => {
    if (m.tipo === "laboratorio") return false;
    if (m.tipo === "linea-retro") return !(m.rifMagazzinoId
      || stato.magazzini.some((x) => x.sedeId === m.sedeId && x.tipo === "retro"));
    const sede = trova(stato.sedi, m.sedeId);
    return !(sede?.labSedeId && stato.magazzini.some((x) => x.sedeId === sede.labSedeId && x.tipo === "laboratorio"));
  });
  if (senzaRif.length) out.push({ id: "orfani", et: "senza rifornitore", col: T.ambra, ic: AlertTriangle, chiavi: [], n: senzaRif.length,
    aiuto: `Nessuno li rifornisce, quindi nella mappa restano isolati: ${senzaRif.map((m) => m.nome).join(", ")}. Il collegamento si imposta in Magazzini (sede del laboratorio o magazzino di riferimento).` });
  return out;
}

function PlanciaControlli({ stato, mags, onScegli }) {
  const lista = controlli(stato, mags);
  const [apri, setApri] = useState(null);
  const scelto = lista.find((c) => c.id === apri);
  if (!lista.length) return (
    <div className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 sc-fade"
      style={{ background: "#EAF8F1", border: `1.5px solid ${T.verde}44` }}>
      <span className="rounded-xl p-2 shrink-0 sc-traguardo" style={{ background: `${T.verde}22`, color: T.verde }}><CheckCheck size={16} /></span>
      <span className="flex-1 min-w-0">
        <span className="font-extrabold block" style={{ color: T.ink }}>Dati coerenti</span>
        <span className="text-xs" style={{ color: T.dim }}>Soglie a posto, prodotti interi interi, conversioni complete e ogni magazzino ha il suo rifornitore.</span>
      </span>
    </div>
  );
  return (
    <div className="rounded-2xl p-2.5 flex flex-col gap-2" style={{ background: T.sup, border: `1.5px solid ${T.bordo}` }}>
      <div className="flex items-center gap-1.5 overflow-x-auto sc-scroll">
        <span className="text-xs font-extrabold shrink-0 px-1" style={{ color: T.tenue }}>controlli</span>
        {lista.map((c, i) => {
          const on = apri === c.id;
          return (
            <button key={c.id} onClick={() => { vibra(6); setApri(on ? null : c.id); }}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold shrink-0 sc-pop"
              style={{ animationDelay: `${i * 70}ms`, ...(on
                ? { background: c.col, color: "#fff" }
                : { background: `${c.col}14`, color: c.col, border: `1px solid ${c.col}33` }) }}>
              {/* i controlli che non puntano a caselle portano il loro numero in
                  «n»: senza, la pastiglia usciva senza cifra e diceva solo il
                  problema, non quanto è grosso */}
              <c.ic size={12} />{c.n ?? (c.chiavi.length || "")} {c.et}
            </button>
          );
        })}
      </div>
      {scelto && (
        <div className="sc-su rounded-xl px-3 py-2.5" style={{ background: `${scelto.col}0F`, border: `1px solid ${scelto.col}33` }}>
          <p className="text-xs mb-2" style={{ color: T.dim }}>{scelto.aiuto}</p>
          {scelto.chiavi.length > 0 && (
            <button onClick={() => { onScegli(scelto.chiavi); setApri(null); }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 w-full" style={{ background: scelto.col, color: "#fff", textAlign: "left" }}>
              <Check size={14} />
              <span className="flex-1 text-xs font-extrabold">Seleziona queste {scelto.chiavi.length} caselle</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PlanciaRete({ stato, mags, sel, onSelMag, onApri, onSelSotto, onScegli }) {
  const [fuoco, setFuoco] = useState(null);
  const { nodi, bande, links, H } = costruisciRete(stato, mags);
  if (!mags.length) return <Vuoto icona={Boxes} titolo="Nessun magazzino" testo="Non ci sono magazzini da mostrare." />;
  const nSotto = mags.reduce((n, m) => n + m.articoli.filter((a) => a.qty < parOggi(a)).length, 0);

  /* cosa è collegato al nodo in evidenza */
  const attivi = links.filter((l) => l.da === fuoco || l.a === fuoco);
  const vicini = new Set(attivi.flatMap((l) => [l.da, l.a]));
  const magF = fuoco ? nodi[fuoco]?.m : null;
  const alimenta = attivi.filter((l) => l.da === fuoco).map((l) => nodi[l.a].m.nome);
  const daChi = attivi.filter((l) => l.a === fuoco).map((l) => nodi[l.da].m.nome);
  /* riempimento medio di ogni sede, sugli articoli veri dei suoi magazzini */
  const pienoBanda = {};
  for (const bn of bande) pienoBanda[bn.id] = riempLista(
    Object.values(nodi).filter((n) => n.banda === bn.id).reduce((acc, n) => acc.concat(n.m.articoli), []));

  const tocca = (id) => { vibra(6); if (fuoco === id) onApri(id); else setFuoco(id); };

  return (
    <div className="flex flex-col gap-3">
      {nSotto > 0 && !fuoco && (
        <button onClick={onSelSotto} className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3"
          style={{ background: "#FDF4E7", border: `1.5px solid ${T.ambra}55`, textAlign: "left" }}>
          <span className="rounded-xl p-2 shrink-0" style={{ background: `${T.ambra}22`, color: T.ambra }}><AlertTriangle size={16} /></span>
          <span className="flex-1 min-w-0">
            <span className="font-extrabold block" style={{ color: T.ink }}>{nSotto} caselle sotto scorta in tutta la rete</span>
            <span className="text-xs" style={{ color: T.dim }}>Toccale per selezionarle tutte e rifornirle in un colpo</span>
          </span>
          <ChevronRight size={18} style={{ color: T.ambra }} />
        </button>
      )}

      {!fuoco && <PlanciaControlli stato={stato} mags={mags} onScegli={onScegli} />}

      {/* la legenda: la catena vera, nell'ordine in cui va letta. Ogni voce
          resta tutta d'un pezzo, così sui telefoni stretti va a capo fra una
          voce e l'altra e non in mezzo a un tratteggio */}
      <div className="rounded-2xl px-3 py-2.5" style={{ background: T.sup, border: `1.5px solid ${T.bordo}` }}>
        <div className="text-xs font-extrabold mb-1.5" style={{ color: T.tenue }}>CHI RIFORNISCE CHI</div>
        <div className="flex flex-col gap-1">
          {[{ c: T.viola, d: "7 5", t: "laboratorio → linea" },
            { c: T.ambra, d: "2 4", t: "magazzino retro → linea" },
            { c: T.tenue, d: "", t: "fornitore → magazzino retro (fuori mappa)" }].map((v) => (
            <span key={v.t} className="flex items-center gap-2" style={{ whiteSpace: "nowrap" }}>
              <svg width="26" height="8" className="shrink-0" aria-hidden="true">
                {v.d
                  ? <line x1="1" y1="4" x2="25" y2="4" stroke={v.c} strokeWidth="2.4"
                      strokeDasharray={v.d} strokeLinecap="round" />
                  : <circle cx="13" cy="4" r="2.4" fill={v.c} opacity="0.55" />}
              </svg>
              <span className="text-xs font-bold truncate" style={{ color: T.dim }}>{v.t}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-1 overflow-hidden" style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
        <svg viewBox={`0 0 340 ${H}`} style={{ width: "100%", height: "auto", display: "block", fontFamily: "inherit" }}
          role="img" aria-label="Mappa della rete: sedi, magazzini e collegamenti">
          {/* fondo: tocca il vuoto per spegnere l'evidenza */}
          <rect x="0" y="0" width="340" height={H} fill="transparent" onClick={() => setFuoco(null)} />

          {/* bande delle sedi: il raggruppamento vero dei dati, con il
              riempimento della sede a destra */}
          {bande.map((bn) => (
            <g key={bn.id}>
              <rect x={BX} y={bn.y} width={BW} height={bn.h} rx="16" fill="#fff" opacity="0.72" />
              <rect x={BX} y={bn.y} width={BW} height={bn.h} rx="16" fill="none" stroke="#DCE4F5" strokeWidth="1" />
              <text x={BX + 10} y={bn.y + 13} fontSize="8" fontWeight="800" fill={T.tenue} letterSpacing="0.8">
                {String(bn.nome || "").toUpperCase()}
              </text>
              <text x={BX + BW - 10} y={bn.y + 13} fontSize="8" fontWeight="800" textAnchor="end"
                fill={coloreRiemp(pienoBanda[bn.id] || 0)}>{Math.round((pienoBanda[bn.id] || 0) * 100)}%</text>
            </g>
          ))}

          {/* collegamenti a gomito: partono da destra, rientrano da sinistra */}
          {links.map((l) => {
            const a = nodi[l.da], b = nodi[l.a];
            if (!a || !b) return null;
            const on = !fuoco || l.da === fuoco || l.a === fuoco;
            /* il colore e il tratto dicono CHI rifornisce, non chi riceve:
               viola a trattoni = laboratorio, ambra punteggiato = retro.
               Si distinguono a colpo d'occhio, senza toccare niente. */
            const lab = l.tipo === "lab";
            const col = lab ? T.viola : T.ambra;
            const x0 = a.x + NW / 2, x1 = b.x - NW / 2;
            return (
              <g key={l.da + l.a} style={{ transition: "opacity .3s" }} opacity={on ? 1 : 0.1}>
                <path d={gomito(a, b, l.mx)} fill="none"
                  className={fuoco && on ? "sc-formiche" : ""}
                  stroke={col} strokeOpacity={fuoco && on ? 1 : 0.55}
                  strokeWidth={fuoco && on ? 2.6 : 1.6}
                  strokeDasharray={lab ? "7 5" : "2 4"} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={x0} cy={a.y} r="2.4" fill={col} fillOpacity={fuoco && on ? 1 : 0.55} />
                <path d="M-4 -3.2 L3.4 0 L-4 3.2 Z" fill={col} fillOpacity={fuoco && on ? 1 : 0.55}
                  transform={`translate(${x1 - 4} ${b.y})`} />
              </g>
            );
          })}

          {fuoco && <ParticelleRete nodi={nodi} links={attivi} />}

          {/* nodi */}
          {Object.values(nodi).map(({ m, x, y }) => {
            const meta = TIPI_MAG[m.tipo] || { colore: T.dim, breve: "Magazzino" };
            const st = statoSelMag(m, sel);
            const scelto = st === "tutti" || st === "parte";
            const pieno = riempMag(m);
            const inFuoco = !fuoco || fuoco === m.id || vicini.has(m.id);
            const righe = spezzaNome(m.nome);
            const due = righe.length > 1;
            return (
              <g key={m.id} opacity={inFuoco ? 1 : 0.28} style={{ transition: "opacity .3s" }}>
                {fuoco === m.id && <rect x={x - 50} y={y - 29} width={100} height={58} rx={19} fill={meta.colore} opacity="0.16" />}
                {scelto && fuoco !== m.id && <rect x={x - 49} y={y - 28} width={98} height={56} rx={18} fill={T.blu} opacity="0.12" />}
                <rect x={x - NW / 2} y={y - NH / 2} width={NW} height={NH} rx={15} fill="#fff"
                  stroke={fuoco === m.id ? meta.colore : scelto ? T.blu : meta.colore}
                  strokeWidth={fuoco === m.id ? 2.8 : scelto ? 2.4 : 1.4}
                  onClick={() => tocca(m.id)} style={{ cursor: "pointer", transition: "stroke-width .25s" }} />
                {righe.map((r, k) => (
                  <text key={k} x={x - 40} y={y - 12 + k * 9.5} fontSize="9" fontWeight="800" fill={T.ink}
                    onClick={() => tocca(m.id)} style={{ cursor: "pointer" }}>{r}</text>
                ))}
                <text x={x - 40} y={y + (due ? 8 : 3)} fontSize="7.5" fontWeight="700" fill={meta.colore}>
                  {rifornitoreBreve(stato, m)}
                </text>
                <rect x={x - 40} y={y + (due ? 13 : 8)} width={62} height={4} rx={2} fill="#E4E9F5" />
                <rect x={x - 40} y={y + (due ? 13 : 8)} width={Math.max(2, 62 * pieno)} height={4} rx={2}
                  fill={coloreRiemp(pieno)} style={{ transition: "width .5s, fill .4s" }} />
                <circle cx={x + 31} cy={y - 14} r="13" fill="transparent" onClick={() => onSelMag(m)} style={{ cursor: "pointer" }} />
                <rect x={x + 25} y={y - 20} width={13} height={13} rx={4} pointerEvents="none"
                  fill={st === "tutti" ? T.blu : st === "parte" ? "#BBD0F8" : "#fff"}
                  stroke={scelto ? T.blu : T.tenue} strokeWidth="1.3" />
                {st === "tutti" && <path d={`M${x + 28} ${y - 13.6} l2 2 l4.6 -4.7`} stroke="#fff" strokeWidth="1.8"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />}
              </g>
            );
          })}
        </svg>
      </div>

      {magF ? (
        <div className="rounded-2xl p-3 sc-su" style={{ background: T.sup, border: `1.5px solid ${TIPI_MAG[magF.tipo]?.colore || T.bordo}` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-extrabold flex-1 min-w-0 truncate" style={{ color: T.ink }}>{magF.nome}</span>
            <Chip colore={TIPI_MAG[magF.tipo]?.colore || T.dim}>{TIPI_MAG[magF.tipo]?.breve || "Magazzino"}</Chip>
            <button onClick={() => setFuoco(null)} aria-label="Chiudi evidenza" style={{ color: T.tenue }}><X size={16} /></button>
          </div>
          {daChi.length > 0 && (
            <p className="text-xs mb-1" style={{ color: T.dim }}>
              Rifornito da <b style={{ color: T.ink }}>{daChi.join(", ")}</b>
            </p>
          )}
          {alimenta.length > 0 && (
            <p className="text-xs mb-1" style={{ color: T.dim }}>
              Rifornisce <b style={{ color: T.ink }}>{alimenta.join(", ")}</b>
            </p>
          )}
          {!daChi.length && !alimenta.length && (
            <p className="text-xs mb-1" style={{ color: T.ambra }}>Nessun collegamento configurato per questo magazzino.</p>
          )}
          <div className="flex gap-2 mt-2">
            <Bottone piccolo icona={Gamepad2} onClick={() => onApri(magF.id)}>Apri</Bottone>
            <Bottone piccolo variante="tonale" icona={Check} onClick={() => onSelMag(magF)}>Seleziona tutto</Bottone>
          </div>
        </div>
      ) : (<>
        <div className="flex gap-1.5 flex-wrap">
          {Object.keys(TIPI_MAG).filter((k) => mags.some((m) => m.tipo === k)).map((k) => (
            <span key={k} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: `${TIPI_MAG[k].colore}14`, color: TIPI_MAG[k].colore }}>
              <span className="w-2 h-2 rounded-full" style={{ background: TIPI_MAG[k].colore }} />{TIPI_MAG[k].breve}
            </span>
          ))}
        </div>
        <Spiega id="plancia-rete" titolo="Come si legge la mappa">
          <p className="text-xs" style={{ color: T.dim }}>
            Sotto al nome di ogni riquadro c'è scritto <b>da chi riceve la merce</b>, e le strade sono due,
            separate. Il <b>laboratorio</b> rifornisce le linee collegate a lui, anche di un'altra sede: per
            questo il suo nome resta scritto sotto al riquadro pure quando in mappa non compare. I
            <b>magazzini retro</b> — secco e bevande — non passano dal laboratorio: si riforniscono dal
            fornitore della propria sede, e da lì servono le linee che attingono alla loro scorta. Tocca un
            magazzino per accendere il suo percorso, toccalo di nuovo per aprirlo; la casellina lo seleziona tutto.
          </p>
        </Spiega>
      </>)}
    </div>
  );
}

/* ---- STRUTTURA: cosa sta dentro cosa, sui dati veri ---- */
function PlanciaStruttura({ stato, mags, sel, onArt, onSelMag, onSelSede, onSelLista, onApri }) {
  const [ap, setAp] = useState(() => ({}));
  const cambia = (k) => setAp((x) => ({ ...x, [k]: !x[k] }));
  const sedi = stato.sedi.filter((s) => mags.some((m) => m.sedeId === s.id));
  if (!mags.length) return <Vuoto icona={Boxes} titolo="Nessun magazzino" testo="Non ci sono magazzini da mostrare." />;

  const Freccia = ({ aperto }) => (
    <ChevronRight size={16} style={{ color: T.tenue, transform: aperto ? "rotate(90deg)" : "none", transition: "transform .25s" }} />
  );
  /* una casellina a tre stati: vuota, mezza, piena. La stessa forma a
     ogni livello dell'albero, così il gesto è sempre lo stesso */
  const Casella = ({ st, onClick, etichetta, mis = 24 }) => (
    <button onClick={onClick} aria-label={etichetta} className="rounded-lg flex items-center justify-center shrink-0"
      style={{ width: mis, height: mis,
        background: st === "tutti" ? T.blu : st === "parte" ? "#BBD0F8" : "#fff",
        border: `1.5px solid ${st === "no" || st === "vuoto" ? T.tenue : T.blu}`, transition: "background .2s, border-color .2s" }}>
      {st === "tutti" && <Check size={Math.round(mis * 0.55)} color="#fff" />}
      {st === "parte" && <Minus size={Math.round(mis * 0.55)} color="#fff" />}
    </button>
  );
  /* barra di riempimento riusata a ogni livello */
  const Barra = ({ pieno, alta }) => (
    <span className="block rounded-full" style={{ height: alta || 6, background: "#E4E9F5" }}>
      <span className="block h-full rounded-full" style={{ width: `${Math.max(2, Math.round(pieno * 100))}%`,
        background: coloreRiemp(pieno), transition: "width .55s cubic-bezier(.4,1.3,.5,1), background .4s" }} />
    </span>
  );
  const statoSelLista = (arts, magId) => {
    if (!arts.length) return "vuoto";
    let n = 0;
    for (const a of arts) if (sel.has(chiaveArt(magId, a.prodottoId))) n++;
    return n === 0 ? "no" : n === arts.length ? "tutti" : "parte";
  };
  const statoSelSede = (suoi) => {
    let tot = 0, n = 0;
    for (const m of suoi) for (const a of m.articoli) { tot++; if (sel.has(chiaveArt(m.id, a.prodottoId))) n++; }
    return !tot ? "vuoto" : n === 0 ? "no" : n === tot ? "tutti" : "parte";
  };
  const tutteAperte = sedi.length > 0 && sedi.every((s) => ap[`s${s.id}`]);
  const apriChiudi = () => setAp((x) => { const n = { ...x }; for (const s of sedi) n[`s${s.id}`] = !tutteAperte; return n; });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold" style={{ color: T.tenue }}>
          {sedi.length} {sedi.length === 1 ? "sede" : "sedi"} · {mags.length} magazzin{mags.length === 1 ? "o" : "i"}
        </span>
        <button onClick={apriChiudi} className="rounded-full px-3 py-1.5 text-xs font-bold ml-auto"
          style={{ background: "#EAEFF9", color: T.dim }}>{tutteAperte ? "Chiudi tutto" : "Apri tutto"}</button>
      </div>
      {sedi.map((s, is) => {
        const suoi = mags.filter((m) => m.sedeId === s.id);
        const tuttiArt = suoi.reduce((acc, m) => acc.concat(m.articoli), []);
        const nArt = tuttiArt.length;
        const nSottoS = tuttiArt.filter((a) => a.qty < parOggi(a)).length;
        const pienoS = riempLista(tuttiArt);
        const apS = ap[`s${s.id}`];
        return (
          <div key={s.id} className="rounded-2xl overflow-hidden sc-pop" style={{ border: `1.5px solid ${T.bordo}`,
            background: T.sup, animationDelay: `${Math.min(is, 8) * 45}ms` }}>
            <div className="flex items-center gap-2.5 px-3 py-3">
              <Casella st={statoSelSede(suoi)} onClick={() => onSelSede(suoi)} etichetta={`Seleziona tutta la sede ${s.nome}`} />
              <button onClick={() => cambia(`s${s.id}`)} className="flex items-center gap-2.5 flex-1 min-w-0" style={{ textAlign: "left" }}>
                <span className="rounded-xl p-2 shrink-0" style={{ background: "#EFEAFE", color: T.viola }}><Building2 size={16} /></span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="font-extrabold truncate" style={{ color: T.ink }}>{s.nome}</span>
                    <span className="text-xs font-extrabold shrink-0" style={{ color: coloreRiemp(pienoS) }}>{Math.round(pienoS * 100)}%</span>
                  </span>
                  <span className="text-xs block" style={{ color: T.dim }}>
                    {suoi.length} magazzin{suoi.length === 1 ? "o" : "i"} · {nArt} articol{nArt === 1 ? "o" : "i"}
                    {nSottoS > 0 && <span style={{ color: T.ambra, fontWeight: 800 }}> · {nSottoS} sotto scorta</span>}
                  </span>
                  {/* un segmento per magazzino: si vede subito quale è basso
                      senza aprire niente */}
                  <span className="flex gap-1 mt-1.5">
                    {suoi.map((m) => {
                      const pm = riempMag(m);
                      return (
                        <span key={m.id} className="flex-1 rounded-full overflow-hidden" style={{ height: 7, background: "#E4E9F5" }}>
                          <span className="block h-full rounded-full" style={{ width: `${Math.max(3, Math.round(pm * 100))}%`,
                            background: m.articoli.length ? coloreRiemp(pm) : "#D6DEF0", transition: "width .55s ease" }} />
                        </span>
                      );
                    })}
                  </span>
                </span>
                <Freccia aperto={apS} />
              </button>
            </div>

            {apS && (
              <div className="sc-fade px-2 pb-2 flex flex-col gap-1.5">
                {suoi.map((m, im) => {
                  const meta = TIPI_MAG[m.tipo] || { colore: T.dim, breve: "Magazzino" };
                  const apM = ap[`m${m.id}`];
                  const st = statoSelMag(m, sel);
                  const pieno = riempMag(m);
                  const nSottoM = m.articoli.filter((a) => a.qty < parOggi(a)).length;
                  return (
                    <div key={m.id} className="rounded-2xl sc-su" style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}`,
                      animationDelay: `${Math.min(im, 10) * 35}ms` }}>
                      <div className="flex items-center gap-2 px-2.5 py-2.5">
                        <Casella st={st} onClick={() => onSelMag(m)} etichetta={`Seleziona tutto ${m.nome}`} />
                        <button onClick={() => cambia(`m${m.id}`)} className="flex-1 min-w-0" style={{ textAlign: "left" }}>
                          <span className="flex items-center gap-1.5">
                            <span className="font-bold truncate" style={{ color: T.ink }}>{m.nome}</span>
                            <span className="text-xs font-extrabold shrink-0" style={{ color: coloreRiemp(pieno) }}>{Math.round(pieno * 100)}%</span>
                          </span>
                          <span className="text-xs block" style={{ color: meta.colore }}>
                            {meta.breve} · {m.articoli.length} articol{m.articoli.length === 1 ? "o" : "i"}
                            {nSottoM > 0 ? ` · ${nSottoM} sotto scorta` : ""}
                          </span>
                          <span className="block mt-1.5"><Barra pieno={pieno} /></span>
                        </button>
                        <button onClick={() => onApri(m.id)} aria-label={`Apri ${m.nome}`} className="rounded-xl p-2 shrink-0"
                          style={{ background: "#EAF0FE", color: T.blu }}><Gamepad2 size={15} /></button>
                        <button onClick={() => cambia(`m${m.id}`)} aria-label="Espandi" className="shrink-0"><Freccia aperto={apM} /></button>
                      </div>

                      {apM && (
                        <div className="sc-fade px-2.5 pb-2.5 flex flex-col gap-1.5">
                          {m.articoli.length === 0
                            ? <p className="text-xs py-1" style={{ color: T.tenue }}>Nessun prodotto in questo magazzino.</p>
                            : perCategoria(stato, m.articoli).map(({ cat, arts }, ic) => {
                              const kc = `c${m.id}${cat?.id || "_"}`;
                              const apC = ap[kc];
                              const pienoC = riempLista(arts);
                              const nSottoC = arts.filter((a) => a.qty < parOggi(a)).length;
                              return (
                                <div key={kc} className="rounded-xl sc-su" style={{ background: "#fff", border: `1px solid ${T.bordo}`,
                                  animationDelay: `${Math.min(ic, 10) * 30}ms` }}>
                                  <div className="flex items-center gap-2 px-2.5 py-2">
                                    <Casella st={statoSelLista(arts, m.id)} mis={20} onClick={() => onSelLista(m.id, arts)}
                                      etichetta={`Seleziona categoria ${cat?.nome || "Senza categoria"} in ${m.nome}`} />
                                    <button onClick={() => cambia(kc)} className="flex items-center gap-2 flex-1 min-w-0" style={{ textAlign: "left" }}>
                                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat?.colore || T.viola }} />
                                      <span className="flex-1 min-w-0">
                                        <span className="block text-sm font-bold truncate" style={{ color: T.ink }}>{cat?.nome || "Senza categoria"}</span>
                                        <span className="block mt-1"><Barra pieno={pienoC} alta={4} /></span>
                                      </span>
                                      <span className="text-xs font-extrabold shrink-0" style={{ color: nSottoC ? T.ambra : T.verde }}>
                                        {nSottoC ? `${nSottoC}/${arts.length}` : arts.length}
                                      </span>
                                      <Freccia aperto={apC} />
                                    </button>
                                  </div>
                                  {apC && (
                                    <div className="sc-fade px-2 pb-2 flex flex-col gap-1">
                                      {arts.map((a, ia) => {
                                        const p = trova(stato.prodotti, a.prodottoId);
                                        const on = sel.has(chiaveArt(m.id, a.prodottoId));
                                        const par = parOggi(a);
                                        const pieno2 = pctRiemp(a.qty, par);
                                        const manca = +(par - a.qty).toFixed(2);
                                        return (
                                          <button key={a.prodottoId} onClick={() => onArt(m.id, a.prodottoId)}
                                            className="flex items-center gap-2 rounded-xl px-2.5 py-2 sc-pop"
                                            style={{ textAlign: "left", background: on ? "#EAF0FE" : "#F7F9FE",
                                              border: `1.5px solid ${on ? T.blu : "transparent"}`, animationDelay: `${Math.min(ia, 12) * 22}ms` }}>
                                            <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                              style={{ background: on ? T.blu : "#fff", border: `1.5px solid ${on ? T.blu : T.tenue}` }}>
                                              {on && <Check size={12} color="#fff" />}
                                            </span>
                                            <span className="flex-1 min-w-0">
                                              <span className="block text-sm font-semibold truncate" style={{ color: T.ink }}>{p?.nome || "—"}</span>
                                              {manca > 0 && (
                                                <span className="block font-bold" style={{ color: coloreRiemp(pieno2), fontSize: 10 }}>
                                                  mancano {fmtQ(manca)} {simboloU(stato, a.uomId)}
                                                </span>
                                              )}
                                            </span>
                                            <span className="text-xs font-bold shrink-0" style={{ color: coloreRiemp(pieno2) }}>
                                              {fmtQ(a.qty)}<span style={{ color: T.tenue }}> di {fmtQ(par)} {simboloU(stato, a.uomId)}</span>
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <Spiega id="plancia-struttura" titolo="Come si legge l'albero">
        <p className="text-xs" style={{ color: T.dim }}>
          Le caselline seguono l'albero: sede, magazzino, categoria. Quella mezza piena dice che dentro
          c'è già una parte selezionata. I segmenti sotto il nome della sede sono i suoi magazzini: uno per
          uno, quanto sono pieni.
        </p>
      </Spiega>
    </div>
  );
}

/* ---- CASELLE: la board operativa di un magazzino. Le caselle sono
   raggruppate per categoria: ogni gruppo dice quanto è pieno, quante
   sono sotto scorta e si seleziona tutto insieme. Con molti prodotti i
   gruppi partono chiusi, così la pagina resta leggibile. ---- */
function PlanciaCaselle({ stato, mag, mags, sel, toccati, onArt, onStep, onMagCambia, onSelLista, passo, onPasso }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("tutti");
  const [aperti, setAperti] = useState(null);
  /* tutti i "hook" stanno prima di qualsiasi uscita anticipata: se il
     magazzino sparisce, React deve trovare sempre lo stesso numero di hook */
  const arts = mag ? mag.articoli : [];
  const media = mag ? riempMag(mag) : 0;
  const mediaAnim = useContaFino(media * 100);
  if (!mag) return <Vuoto icona={Boxes} titolo="Nessun magazzino" testo="Non ci sono magazzini da gestire qui." />;
  const nSotto = arts.filter((a) => a.qty < parOggi(a)).length;
  const nZero = arts.filter((a) => a.qty <= 0).length;
  const nScelti = arts.filter((a) => sel.has(chiaveArt(mag.id, a.prodottoId))).length;
  /* se svuoti la selezione mentre il filtro è "solo le selezionate" non
     devi restare bloccato su una lista vuota */
  const filtroOk = filtro === "scelti" && nScelti === 0 ? "tutti" : filtro;
  const filtrati = arts.filter((a) => {
    /* una casella appena cambiata resta in vista per il tempo del lampo:
       così vedi l'effetto prima che il filtro la porti via */
    const tocco = toccati && toccati.has(chiaveArt(mag.id, a.prodottoId));
    if (!tocco) {
      if (filtroOk === "sotto" && a.qty >= parOggi(a)) return false;
      if (filtroOk === "zero" && a.qty > 0) return false;
      if (filtroOk === "scelti" && !sel.has(chiaveArt(mag.id, a.prodottoId))) return false;
    }
    if (!q.trim()) return true;
    const p = trova(stato.prodotti, a.prodottoId);
    return (p?.nome || "").toLowerCase().includes(q.trim().toLowerCase());
  });
  const tuttiVisti = filtrati.length > 0 && filtrati.every((a) => sel.has(chiaveArt(mag.id, a.prodottoId)));
  const gruppi = perCategoria(stato, filtrati);
  const chiaviG = gruppi.map((g) => g.cat?.id || "_");
  const tanti = arts.length > 60;
  const raggruppa = gruppi.length > 1;
  const apertiOk = aperti || new Set(tanti ? chiaviG.slice(0, 1) : chiaviG);
  const cambiaG = (cid) => setAperti(() => { const n = new Set(apertiOk); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });
  const statoSelLista = (lista) => {
    if (!lista.length) return "vuoto";
    let n = 0;
    for (const a of lista) if (sel.has(chiaveArt(mag.id, a.prodottoId))) n++;
    return n === 0 ? "no" : n === lista.length ? "tutti" : "parte";
  };

  const Tessere = ({ lista, base }) => (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
      {lista.map((a, i) => {
        const p = trova(stato.prodotti, a.prodottoId);
        return <PlanciaTessera key={a.prodottoId} i={i} prod={p} cat={trova(stato.categorie, p?.categoriaId)}
          qty={a.qty} par={parOggi(a)} sym={simboloU(stato, a.uomId)} interi={!!p?.soloInteri}
          tocco={toccati && toccati.has(chiaveArt(mag.id, a.prodottoId))} ritardo={Math.min(base + i, 24) * 45}
          sel={sel.has(chiaveArt(mag.id, a.prodottoId))} onSel={() => onArt(mag.id, a.prodottoId)}
          onStep={(d) => onStep(mag.id, a.prodottoId, d * passo)} />;
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <Selettore label="Magazzino" valore={mag.id} onCambia={onMagCambia}
        opzioni={magazziniPerSede(stato, mags).map((m) => ({ id: m.id, nome: m.nome }))} />

      <div className="rounded-3xl p-4 relative overflow-hidden" style={{ background: T.grad, color: "#fff", boxShadow: "0 16px 40px -18px rgba(80,60,180,.7)" }}>
        <div className="absolute inset-y-0 pointer-events-none" style={{ left: 0, width: "45%",
          background: "linear-gradient(105deg, transparent, rgba(255,255,255,.22), transparent)", animation: "scBrillio 3.4s ease-in-out infinite" }} />
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm" style={{ opacity: .9 }}>Riempimento medio</span>
          <span className="font-extrabold text-2xl">{Math.round(mediaAnim)}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.25)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.round(media * 100)}%`, background: "#fff", transition: "width .6s cubic-bezier(.4,1.3,.5,1)" }} />
        </div>
        <div className="flex gap-2 mt-3 text-xs font-bold">
          <span className="rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,.2)" }}>{arts.length} caselle</span>
          <span className="rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,.28)" }}>{nSotto > 0 ? `${nSotto} sotto scorta` : "tutte a livello"}</span>
        </div>
      </div>

      {arts.length === 0 ? (
        <Vuoto icona={Boxes} titolo="Magazzino vuoto" testo="Aggiungi prodotti al magazzino per usarli nella plancia." />
      ) : (<>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 flex-1 min-w-0" style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
            <Search size={16} style={{ color: T.tenue }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca…" className="flex-1 bg-transparent outline-none text-sm font-semibold min-w-0" style={{ color: T.ink }} />
          </div>
          <button onClick={() => filtrati.forEach((a) => {
            const on = sel.has(chiaveArt(mag.id, a.prodottoId));
            if (tuttiVisti ? on : !on) onArt(mag.id, a.prodottoId);
          })} className="rounded-2xl px-3 py-2.5 text-sm font-bold shrink-0" style={{ background: "#EAF0FE", color: T.blu }}>
            {tuttiVisti ? "Nessuno" : "Tutti"}
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap items-center">
          {[["tutti", `Tutte · ${arts.length}`, T.dim], ["sotto", `Sotto scorta · ${nSotto}`, T.ambra],
            ["zero", `A zero · ${nZero}`, T.rosso], ...(nScelti ? [["scelti", `Selezionate · ${nScelti}`, T.blu]] : [])].map(([id, et, col]) => (
            <button key={id} onClick={() => setFiltro(id)} className="rounded-full px-3 py-1.5 text-xs font-bold"
              style={filtroOk === id ? { background: col, color: "#fff" } : { background: `${col}14`, color: col, border: `1px solid ${col}33` }}>{et}</button>
          ))}
          <span className="ml-auto flex items-center gap-1 rounded-full p-0.5" style={{ background: "#EAEFF9" }}>
            <span className="text-xs font-bold px-1.5" style={{ color: T.tenue }}>passo</span>
            {[1, 0.5].map((v) => (
              <button key={v} onClick={() => onPasso(v)} className="rounded-full px-2.5 py-1 text-xs font-extrabold"
                style={passo === v ? { background: T.sup, color: T.blu, boxShadow: "0 3px 8px -3px rgba(60,90,180,.3)" } : { background: "transparent", color: T.dim }}>
                {v === 1 ? "1" : "0,5"}
              </button>
            ))}
          </span>
        </div>

        {raggruppa && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold" style={{ color: T.tenue }}>{gruppi.length} categorie</span>
            <button onClick={() => setAperti(apertiOk.size === chiaviG.length ? new Set() : new Set(chiaviG))}
              className="rounded-full px-3 py-1.5 text-xs font-bold ml-auto" style={{ background: "#EAEFF9", color: T.dim }}>
              {apertiOk.size === chiaviG.length ? "Chiudi tutto" : "Apri tutto"}
            </button>
          </div>
        )}

        {!raggruppa ? <Tessere lista={filtrati} base={0} /> : (() => {
          let scorsi = 0;
          return (
            <div className="flex flex-col gap-2">
              {gruppi.map(({ cat, arts: lista }, ig) => {
                const cid = cat?.id || "_";
                const ap = apertiOk.has(cid);
                const col = cat?.colore || T.viola;
                const pienoC = riempLista(lista);
                const nSottoC = lista.filter((a) => a.qty < parOggi(a)).length;
                const stC = statoSelLista(lista);
                const base = scorsi; scorsi += lista.length;
                return (
                  <div key={cid} className="rounded-2xl overflow-hidden sc-pop" style={{ border: `1.5px solid ${ap ? col + "44" : T.bordo}`,
                    background: T.sup, animationDelay: `${Math.min(ig, 10) * 40}ms` }}>
                    <div className="flex items-center gap-2 px-2.5 py-2.5">
                      <button onClick={() => onSelLista(mag.id, lista)} aria-label={`Seleziona categoria ${cat?.nome || "Senza categoria"}`}
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: stC === "tutti" ? T.blu : stC === "parte" ? "#BBD0F8" : "#fff",
                          border: `1.5px solid ${stC === "no" || stC === "vuoto" ? T.tenue : T.blu}`, transition: "background .2s" }}>
                        {stC === "tutti" && <Check size={13} color="#fff" />}
                        {stC === "parte" && <Minus size={13} color="#fff" />}
                      </button>
                      <button onClick={() => cambiaG(cid)} className="flex items-center gap-2 flex-1 min-w-0" style={{ textAlign: "left" }}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col }} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-extrabold truncate" style={{ color: T.ink }}>{cat?.nome || "Senza categoria"}</span>
                          <span className="block rounded-full mt-1" style={{ height: 5, background: "#E4E9F5" }}>
                            <span className="block h-full rounded-full" style={{ width: `${Math.max(2, Math.round(pienoC * 100))}%`,
                              background: coloreRiemp(pienoC), transition: "width .55s cubic-bezier(.4,1.3,.5,1), background .4s" }} />
                          </span>
                        </span>
                        <span className="text-xs font-extrabold shrink-0" style={{ color: coloreRiemp(pienoC) }}>{Math.round(pienoC * 100)}%</span>
                        <span className="rounded-full px-1.5 text-xs font-extrabold shrink-0"
                          style={{ background: nSottoC ? `${T.ambra}1F` : "#EDF1F9", color: nSottoC ? T.ambra : T.dim }}>
                          {nSottoC ? `${nSottoC}/${lista.length}` : lista.length}
                        </span>
                        <ChevronRight size={16} style={{ color: T.tenue, transform: ap ? "rotate(90deg)" : "none", transition: "transform .25s" }} />
                      </button>
                    </div>
                    {ap && <div className="sc-fade px-2.5 pb-2.5"><Tessere lista={lista} base={base} /></div>}
                  </div>
                );
              })}
            </div>
          );
        })()}
        {filtrati.length === 0 && <p className="text-sm py-3 text-center" style={{ color: T.dim }}>Nessuna casella con questo filtro.</p>}
      </>)}
    </div>
  );
}

/* ---- SETTIMANA: la mappa termica dei livelli previsti, prodotti per
   giorni. Regge anche con molti prodotti: intestazione dei giorni che
   resta incollata in alto con il TOTALE del magazzino giorno per giorno,
   righe raggruppate per categoria con il riepilogo della settimana
   visibile anche a gruppo chiuso, messa a fuoco su un solo giorno,
   selezione per categoria e filtro "solo i selezionati". La scala dei
   colori si calcola su TUTTO il magazzino, così i colori non cambiano
   significato quando filtri. ---- */
function PlanciaSettimana({ stato, mag, mags, sel, toccati, onMagCambia, onSelLista, onRiga, onColonna }) {
  const [gFocus, setGFocus] = useState(null);
  const [soloSel, setSoloSel] = useState(false);
  const [aperti, setAperti] = useState(null);
  if (!mag) return <Vuoto icona={Boxes} titolo="Nessun magazzino" testo="Non ci sono magazzini da gestire qui." />;
  const WN = 104;                    // colonna dei nomi: la stessa a ogni riga
  const tutti = mag.articoli;
  const nSel = tutti.filter((a) => sel.has(chiaveArt(mag.id, a.prodottoId))).length;
  /* se la selezione si svuota il filtro si sgancia da solo: altrimenti
     resti davanti a una lista vuota con il pulsante disattivato */
  const soloSelOk = soloSel && nSel > 0;
  const arts = soloSelOk ? tutti.filter((a) => sel.has(chiaveArt(mag.id, a.prodottoId))) : tutti;
  const gruppi = perCategoria(stato, arts);
  const chiaviG = gruppi.map((g) => g.cat?.id || "_");
  const tante = tutti.length > 24;
  const apertiOk = aperti || new Set(tante ? chiaviG.slice(0, 1) : chiaviG);
  const cambiaG = (cid) => setAperti(() => { const n = new Set(apertiOk); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });
  const maxV = Math.max(1, ...tutti.map((a) => Math.max(...GIORNI.map(([d]) => parGiorno(a, d) || 0))));
  const cella = (v, wknd) => {
    if (!(v > 0)) return { background: "#F1F4FB", color: T.tenue };
    const k = Math.min(1, v / maxV);
    return { background: `rgba(${wknd ? "138,99,244" : "76,141,246"},${(0.16 + 0.62 * k).toFixed(2)})`, color: k > 0.55 ? "#fff" : T.ink };
  };
  /* somme per giorno: del magazzino intero e di ogni categoria. Sono i
     numeri che dicono "quale giorno pesa di piu" senza aprire nulla */
  const somma = (lista, d) => lista.reduce((s, a) => s + (parGiorno(a, d) || 0), 0);
  const totGiorno = {}; for (const [d] of GIORNI) totGiorno[d] = somma(arts, d);
  const sommeCat = gruppi.map(({ arts: l }) => { const o = {}; for (const [d] of GIORNI) o[d] = somma(l, d); return o; });
  const sett = (vals) => GIORNI.reduce((s, [d]) => s + (vals[d] || 0), 0);
  const maxTot = Math.max(1, ...Object.values(totGiorno));
  const maxCat = Math.max(1, ...sommeCat.reduce((acc, o) => acc.concat(Object.values(o)), []));
  /* barra di calore compatta: l'altezza e il colore dicono l'intensita,
     il numero il valore. Serve per confrontare i giorni fra loro */
  const Riepilogo = ({ vals, max, alta }) => (
    <>
      {GIORNI.map(([d]) => {
        const v = vals[d] || 0;
        const k = Math.min(1, v / max);
        const wknd = d === "6" || d === "0";
        const spento = gFocus && gFocus !== d;
        return (
          <span key={d} className="flex-1 rounded-md flex items-center justify-center overflow-hidden relative"
            style={{ height: alta, background: "#EDF1FA", opacity: spento ? 0.3 : 1, transition: "opacity .28s" }}>
            <span className="absolute left-0 right-0 bottom-0" style={{ height: `${Math.max(8, k * 100)}%`,
              background: wknd ? T.viola : T.blu, opacity: 0.18 + 0.5 * k, transition: "height .5s cubic-bezier(.4,1.3,.5,1)" }} />
            <span className="relative font-extrabold" style={{ fontSize: 9.5, color: k > 0.62 ? "#fff" : T.dim }}>
              {v > 0 ? fmtQ(v) : "–"}
            </span>
          </span>
        );
      })}
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      <Selettore label="Magazzino" valore={mag.id} onCambia={onMagCambia}
        opzioni={magazziniPerSede(stato, mags).map((m) => ({ id: m.id, nome: m.nome }))} />

      <div className="flex gap-1.5 flex-wrap items-center">
        <button onClick={() => setSoloSel(!soloSelOk)} disabled={!nSel}
          className="rounded-full px-3 py-1.5 text-xs font-bold"
          style={soloSelOk ? { background: T.blu, color: "#fff" } : { background: nSel ? "#EAF0FE" : "#F0F3FB", color: nSel ? T.blu : T.tenue }}>
          Solo i selezionati{nSel ? ` · ${nSel}` : ""}
        </button>
        {gFocus && (
          <button onClick={() => setGFocus(null)} className="rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: "#F1EBFE", color: T.viola }}>Mostra tutti i giorni</button>
        )}
        {tante && (
          <button onClick={() => setAperti(apertiOk.size === chiaviG.length ? new Set() : new Set(chiaviG))}
            className="rounded-full px-3 py-1.5 text-xs font-bold ml-auto" style={{ background: "#EAEFF9", color: T.dim }}>
            {apertiOk.size === chiaviG.length ? "Chiudi tutto" : "Apri tutto"}
          </button>
        )}
      </div>

      {arts.length === 0 ? (
        <Vuoto icona={Boxes} titolo="Magazzino vuoto" testo="Aggiungi prodotti per vedere la settimana." />
      ) : (<>
        <div className="rounded-3xl overflow-hidden" style={{ border: `1.5px solid ${T.bordo}`, background: T.sup }}>
          <div className="overflow-y-auto sc-scroll" style={{ maxHeight: "58vh" }}>
            {/* intestazione: resta incollata in alto mentre scorri e porta
                con sé il totale del magazzino giorno per giorno */}
            <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#F1F5FD",
              borderBottom: `1px solid ${T.bordo}`, boxShadow: "0 4px 10px -8px rgba(50,70,140,.5)" }}>
              <div className="flex items-center gap-1 px-2 pt-2">
                <span className="text-xs font-extrabold shrink-0" style={{ width: WN, color: T.tenue }}>Prodotto</span>
                {GIORNI.map(([d, l]) => {
                  const on = gFocus === d;
                  return (
                    <button key={d} onClick={() => setGFocus(on ? null : d)} aria-label={`Metti a fuoco ${NOMI_GIORNI[d]}`}
                      className="flex-1 rounded-lg text-xs font-extrabold" style={{ height: 26,
                        background: on ? (d === "6" || d === "0" ? T.viola : T.blu) : "#E7EEFC",
                        color: on ? "#fff" : d === "6" || d === "0" ? T.viola : T.blu,
                        opacity: gFocus && !on ? 0.4 : 1, transition: "all .28s ease" }}>{l}</button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1 px-2 py-1.5">
                <span className="shrink-0 flex items-center gap-1 truncate" style={{ width: WN }}>
                  <span className="font-bold" style={{ fontSize: 10, color: T.tenue }}>magazzino</span>
                  <span className="font-extrabold" style={{ fontSize: 10, color: T.dim }}>{fmtQ(sett(totGiorno))}</span>
                </span>
                <Riepilogo vals={totGiorno} max={maxTot} alta={17} />
              </div>
            </div>

            {gruppi.map(({ cat, arts: righe }, ig) => {
              const cid = cat?.id || "_";
              const ap = apertiOk.has(cid);
              let nS = 0;
              for (const a of righe) if (sel.has(chiaveArt(mag.id, a.prodottoId))) nS++;
              const stC = !righe.length ? "vuoto" : nS === 0 ? "no" : nS === righe.length ? "tutti" : "parte";
              return (
                <div key={cid}>
                  <div style={{ background: "#F2F6FE", borderTop: `1px solid ${T.bordo}`, borderBottom: `1px solid ${T.bordo}` }}>
                    <div className="flex items-center gap-2 px-2 pt-2">
                      <button onClick={() => onSelLista(mag.id, righe)} aria-label={`Seleziona categoria ${cat?.nome || "Senza categoria"}`}
                        className="rounded flex items-center justify-center shrink-0" style={{ width: 17, height: 17,
                          background: stC === "tutti" ? T.blu : stC === "parte" ? "#BBD0F8" : "#fff",
                          border: `1.3px solid ${stC === "no" || stC === "vuoto" ? T.tenue : T.blu}`, transition: "background .2s" }}>
                        {stC === "tutti" && <Check size={11} color="#fff" />}
                        {stC === "parte" && <Minus size={11} color="#fff" />}
                      </button>
                      <button onClick={() => cambiaG(cid)} className="flex items-center gap-1.5 flex-1 min-w-0" style={{ textAlign: "left" }}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat?.colore || T.viola }} />
                        <span className="flex-1 min-w-0 text-xs font-extrabold truncate" style={{ color: T.ink }}>{cat?.nome || "Senza categoria"}</span>
                        {nS > 0 && <span className="text-xs font-extrabold shrink-0" style={{ color: T.blu }}>{nS} scelti</span>}
                        <span className="rounded-full px-1.5 text-xs font-extrabold shrink-0" style={{ background: "#E7EEFC", color: T.blu }}>{righe.length}</span>
                        <ChevronRight size={14} style={{ color: T.tenue, transform: ap ? "rotate(90deg)" : "none", transition: "transform .25s" }} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <span className="shrink-0 flex items-center gap-1 truncate" style={{ width: WN }}>
                        <span className="font-bold" style={{ fontSize: 10, color: T.tenue }}>categoria</span>
                        <span className="font-extrabold" style={{ fontSize: 10, color: T.dim }}>{fmtQ(sett(sommeCat[ig]))}</span>
                      </span>
                      <Riepilogo vals={sommeCat[ig]} max={maxCat} alta={17} />
                    </div>
                  </div>
                  {ap && righe.map((a, i) => {
                    const p = trova(stato.prodotti, a.prodottoId);
                    const inte = !!p?.soloInteri;
                    const scelto = sel.has(chiaveArt(mag.id, a.prodottoId));
                    const tocco = toccati && toccati.has(chiaveArt(mag.id, a.prodottoId));
                    const suo = !!a.parGiorni;
                    return (
                      <button key={a.prodottoId} onClick={() => onRiga(a.prodottoId)}
                        className="relative flex items-center gap-1 w-full px-2 py-1.5 sc-pop"
                        style={{ borderBottom: `1px solid ${T.bordo}`, textAlign: "left",
                          background: scelto ? "#EEF3FF" : "transparent", animationDelay: `${Math.min(i, 10) * 20}ms` }}>
                        {tocco && <span className="sc-tocco absolute inset-0 rounded-lg pointer-events-none" style={{ animationDelay: `${Math.min(i, 24) * 45}ms` }} />}
                        <span className="shrink-0 min-w-0 flex items-center gap-1" style={{ width: WN }}>
                          {scelto && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: T.blu }} />}
                          <span className="min-w-0">
                            <span className="block text-xs font-bold truncate" style={{ color: T.ink }}>{p?.nome || "—"}</span>
                            {inte
                              ? <span className="block font-extrabold" style={{ color: T.viola, fontSize: 9 }}>solo interi</span>
                              : suo ? <span className="block font-bold" style={{ color: T.blu, fontSize: 9 }}>per giorno</span> : null}
                          </span>
                        </span>
                        {GIORNI.map(([d]) => {
                          const v = parGiorno(a, d) || 0;
                          const spento = gFocus && gFocus !== d;
                          return (
                            <span key={d} className="flex-1 rounded-lg flex items-center justify-center text-xs font-extrabold"
                              style={{ height: 30, ...cella(v, d === "6" || d === "0"),
                                opacity: spento ? 0.28 : 1, transition: "background .45s ease, color .3s, opacity .28s" }}>
                              {v > 0 ? fmtQ(v) : "–"}
                            </span>
                          );
                        })}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {gFocus ? (
          <button onClick={() => onColonna(gFocus, nSel > 0)} className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3"
            style={{ background: T.grad, color: "#fff", textAlign: "left", boxShadow: "0 12px 30px -14px rgba(80,60,180,.7)" }}>
            <TrendingUp size={18} />
            <span className="flex-1 min-w-0">
              <span className="font-extrabold block">
                {nSel > 0 ? `Imposta ${NOMI_GIORNI[gFocus]} su ${nSel} selezionati` : `Imposta ${NOMI_GIORNI[gFocus]} su tutti i prodotti`}
              </span>
              <span className="text-xs block" style={{ opacity: .85 }}>
                adesso {NOMI_GIORNI[gFocus]} vale {fmtQ(totGiorno[gFocus] || 0)} in tutto
              </span>
            </span>
            <ChevronRight size={18} />
          </button>
        ) : (
          <Spiega id="plancia-settimana" titolo="Come si legge la settimana">
            <p className="text-xs" style={{ color: T.dim }}>
              La riga chiara in alto è tutto il magazzino giorno per giorno, e ogni categoria ha la sua anche a gruppo
              chiuso: la colonna più alta è il giorno che pesa di più, e il numero accanto all'etichetta è il totale di
              tutta la settimana. Tocca una riga per la settimana di quel prodotto, una lettera in alto per mettere a
              fuoco un giorno, la casellina per prendere tutta la categoria.
            </p>
          </Spiega>
        )}
      </>)}
    </div>
  );
}

function VistaPlancia({ stato, muta, mostraToast, profilo }) {
  const admin = profilo.ruolo === "admin";
  const mags = magazziniVisti(stato, profilo);
  /* le caselle che non sono tue si vedono ma non si selezionano: così tutti
     gli strumenti di gruppo restano al sicuro senza doverli toccare uno a uno */
  /* «scrivibile» e' la scala nuova: per la Plancia basta non essere in
     sola lettura — quantita' con «correzioni», forma con «struttura» */
  const scrivibile = (m) => permessoSu(profilo, m) !== "lettura";
  const mioMag = (mid) => scrivibile(trova(stato.magazzini, mid));
  const nonTuo = () => mostraToast("Questo magazzino è di una sede che rifornisci: lo vedi, non lo modifichi", "errore");
  /* senza «struttura» la Plancia e' UNA stanza: le Caselle, dove si lavora
     sulle quantita'. Rete/Struttura/Settimana sono lettura della forma e
     comandi di forma — e la Settimana per un non autorizzato era fatta di
     righe che sembravano tappabili e non facevano NIENTE (gen-5.95). */
  const soloCaselle = !puoStruttura(profilo);
  const [tabScelta, setTab] = useState(soloCaselle ? "caselle" : "rete");
  const tab = soloCaselle ? "caselle" : tabScelta;
  const [magId, setMagId] = useState(null);
  const [sel, setSel] = useState(() => new Set());
  const [azione, setAzione] = useState(null);   // giacenza | soglia | unita | sposta | giorni
  const [val, setVal] = useState("");
  const [gg, setGG] = useState({});             // livelli per giorno in lavorazione
  const [giorno, setGiorno] = useState("1");    // giorno scelto dalla vista Settimana
  const [passo, setPasso] = useState(1);        // scatto dei +/- (1 oppure 0,5)
  const [gruppo, setGruppo] = useState("quantita");  // famiglia di comandi aperta
  const [annulla, setAnnulla] = useState(null); // istantanea per tornare indietro
  const [toccati, setToccati] = useState(() => new Set()); // cosa è appena cambiato: lampeggia
  const [volo, setVolo] = useState(null);       // contatore che sale dopo un'azione
  const timerTocco = useRef(null);
  const [colpo, setColpo] = useState(0);
  /* aprendo le Caselle si parte da un magazzino tuo: per il laboratorio le
     linee rifornite ci sono, ma non è lì che deve mettere le mani per primo */
  const magCorr = trova(stato.magazzini, magId)
    || mags.find((m) => scrivibile(m)) || mags[0] || null;

  const apri = (id) => { setMagId(id); setTab("caselle"); };
  const selSotto = () => {
    vibra(10);
    const n = new Set();
    for (const m of mags) {
      if (!scrivibile(m)) continue;
      for (const a of m.articoli) if (a.qty < parOggi(a)) n.add(chiaveArt(m.id, a.prodottoId));
    }
    setSel(n);
    mostraToast(`${n.size} caselle sotto scorta selezionate`);
  };
  const toggleArt = (mid, pid) => {
    if (!mioMag(mid)) return nonTuo();
    vibra(6);
    setSel((s) => { const n = new Set(s); const k = chiaveArt(mid, pid); n.has(k) ? n.delete(k) : n.add(k); return n; });
  };
  const toggleMag = (m) => {
    if (!scrivibile(m)) return nonTuo();
    vibra(8);
    setSel((s) => {
      const n = new Set(s); const st = statoSelMag(m, s);
      for (const a of m.articoli) { const k = chiaveArt(m.id, a.prodottoId); if (st === "tutti") n.delete(k); else n.add(k); }
      return n;
    });
  };
  /* prende (o lascia) un pezzo di albero: una categoria dentro un
     magazzino, oppure tutti i magazzini di una sede. Il gesto è sempre
     lo stesso, cambia solo l'insieme */
  const toggleLista = (mid, lista) => {
    if (!mioMag(mid)) return nonTuo();
    vibra(8);
    setSel((s) => {
      const n = new Set(s);
      const tutte = lista.length > 0 && lista.every((a) => s.has(chiaveArt(mid, a.prodottoId)));
      for (const a of lista) { const k = chiaveArt(mid, a.prodottoId); if (tutte) n.delete(k); else n.add(k); }
      return n;
    });
  };
  const toggleSede = (suoi) => {
    vibra(10);
    setSel((s) => {
      const n = new Set(s); const chiavi = [];
      for (const m of suoi) for (const a of m.articoli) chiavi.push(chiaveArt(m.id, a.prodottoId));
      const tutte = chiavi.length > 0 && chiavi.every((k) => s.has(k));
      for (const k of chiavi) { if (tutte) n.delete(k); else n.add(k); }
      return n;
    });
  };
  /* un controllo di coerenza consegna direttamente le caselle da sistemare:
     dal problema all'azione senza cercarle a mano */
  const scegliChiavi = (chiavi) => {
    vibra(10);
    setSel(new Set(chiavi));
    mostraToast(`${chiavi.length} caselle selezionate`);
  };
  const step = (mid, pid, d) => {
    if (!puoCorreggere(profilo))
      return mostraToast("Per correggere le quantita' serve l'autorizzazione dell'admin (Profili)", "errore");
    if (!mioMag(mid)) return nonTuo();
    vibra(8); muta((s) => {
    const m = trova(s.magazzini, mid); const a = m?.articoli.find((x) => x.prodottoId === pid); if (!a) return;
    /* i prodotti da spedire interi si muovono solo a passi di 1 */
    const inte = !!trova(s.prodotti, pid)?.soloInteri;
    const seg = inte ? (d > 0 ? 1 : -1) : d;
    const nuovo = Math.max(0, inte ? Math.round(a.qty + seg) : +(a.qty + seg).toFixed(4)); const delta = nuovo - a.qty; a.qty = nuovo;
    registraMov(s, { magId: mid, prodottoId: pid, uomId: a.uomId, delta, dopo: nuovo, causale: "plancia", chi: profilo?.nome });
  }); };

  /* quante caselle e quanti magazzini sono coinvolti dalla selezione */
  const magsSel = new Set(); for (const k of sel) magsSel.add(k.split("|")[0]);

  /* fotografia dei valori prima di una modifica: serve per l'annulla */
  const istantanea = () => {
    const snap = [];
    for (const k of sel) {
      const [mid, pid] = k.split("|");
      const m = trova(stato.magazzini, mid); const a = m?.articoli.find((x) => x.prodottoId === pid);
      if (a) snap.push({ mid, pid, qty: a.qty, par: a.par, uomId: a.uomId, parGiorni: a.parGiorni ? { ...a.parGiorni } : null });
    }
    return snap;
  };
  const tornaIndietro = () => {
    if (!annulla || !annulla.length) return;
    if (!puoCorreggere(profilo))
      return mostraToast("Per correggere le quantita' serve l'autorizzazione dell'admin (Profili)", "errore");
    /* par, unita' e livelli per giorno sono forma: chi non la tocca in
       avanti non la tocca nemmeno all'indietro — per lui non sono mai
       cambiati, quindi non si perde niente. Deciso FUORI da muta(). */
    const conStruttura = puoStruttura(profilo);
    muta((s) => {
      for (const v of annulla) {
        const m = trova(s.magazzini, v.mid); const a = m?.articoli.find((x) => x.prodottoId === v.pid);
        if (!a || !scrivibile(m)) continue;
        const delta = v.qty - a.qty;
        a.qty = v.qty;
        if (conStruttura) {
          a.par = v.par; a.uomId = v.uomId;
          if (v.parGiorni) a.parGiorni = { ...v.parGiorni }; else delete a.parGiorni;
        }
        if (Math.abs(delta) > 1e-9) registraMov(s, { magId: v.mid, prodottoId: v.pid, uomId: a.uomId, delta, dopo: v.qty, causale: "plancia", chi: profilo?.nome, rif: "annullamento" });
      }
    }, `Annullata l'ultima modifica su ${annulla.length} caselle`);
    mostraToast(`Annullata su ${annulla.length} caselle`);
    vibra(18); setAnnulla(null);
  };

  /* segna le caselle appena cambiate: un lampo blu dice "queste" senza
     che tu debba leggere niente */
  const segnalaTocco = () => {
    setToccati(new Set(sel));
    setVolo({ n: sel.size, k: Date.now() });
    if (timerTocco.current) clearTimeout(timerTocco.current);
    timerTocco.current = setTimeout(() => { setToccati(new Set()); setVolo(null); }, 1600);
  };
  useEffect(() => () => { if (timerTocco.current) clearTimeout(timerTocco.current); }, []);

  /* ── QUANTE NE TOCCA DAVVERO (gen-5.85) ──
     Il muro dei permessi c'e' e tiene: dentro muta() le caselle che non sono
     tue vengono saltate. Ma il messaggio e la riga di storico si costruivano
     su sel.size, cioe' su quante ne avevi SELEZIONATE. Risultato: un profilo
     Laboratorio spuntava tutta la sede, premeva, vedeva il verde e il lampo,
     e nello storico restava scritto per sempre «Riempite 90 caselle». Sul
     magazzino non si era mosso niente.
     Un'app che dice «fatto» per un lavoro che non ha fatto e' peggio di
     un'app che lo rifiuta: chi legge lo storico non ha modo di accorgersene,
     e chi ha premuto va via convinto.
     Il conto si fa QUI e non dentro muta(): quel pezzo puo' essere rieseguito
     quando la coda si riallinea col server, e un contatore li' dentro
     conterebbe due volte. */
  const tocacabili = () => [...sel].filter((k) => {
    const [mid, pid] = k.split("|");
    const m = trova(stato.magazzini, mid);
    return !!m && scrivibile(m) && (m.articoli || []).some((x) => x.prodottoId === pid);
  });

  const AZIONI_STRUTTURA = new Set(["soglia", "giorni", "ungiorno", "interi", "unita", "sposta", "rimuovi"]);
  const applicaSel = (fn, msg) => {
    /* il muro rifatto dentro l'esecutore, non solo sui tasti: un tasto
       nascosto non e' un permesso negato */
    if (!puoCorreggere(profilo))
      { mostraToast("Per correggere le quantita' serve l'autorizzazione dell'admin (Profili)", "errore"); return false; }
    if (AZIONI_STRUTTURA.has(azione) && !puoStruttura(profilo))
      { mostraToast("Per soglie e articoli serve l'autorizzazione dell'admin (Profili)", "errore"); return false; }
    if (!sel.size) { mostraToast("Seleziona prima qualcosa", "errore"); return false; }
    const mie = tocacabili();
    if (!mie.length) {
      mostraToast(sel.size === 1
        ? "Questa casella non c'è più o non è tua: non è cambiato niente"
        : `Nessuna di queste ${sel.size} caselle si può toccare: non è cambiato niente`, "errore");
      return false;
    }
    const fuori = sel.size - mie.length;
    const testo = typeof msg === "function" ? msg(mie.length) : msg;
    setAnnulla(istantanea());
    segnalaTocco();
    muta((s) => {
      for (const k of sel) {
        const [mid, pid] = k.split("|");
        /* secondo controllo, non fidarsi di una selezione vecchia */
        const m = trova(s.magazzini, mid); if (!m || !scrivibile(m)) continue;
        const a = m.articoli.find((x) => x.prodottoId === pid); if (!a) continue;
        fn(s, m, a);
      }
    /* «saltate» e non «non sono tue»: il motivo puo' essere il permesso, ma
       anche che nel frattempo un altro telefono ha tolto quell'articolo. Un
       messaggio che nomina la causa sbagliata manda a cercare dalla parte
       sbagliata, ed e' lo stesso errore del numero gonfiato. */
    }, fuori ? `${testo} · ${fuori} saltate` : testo);
    mostraToast(fuori
      ? `${testo} · ${fuori} saltate: non ci sono più o non sono tue`
      : testo, fuori ? "avviso" : "ok");
    return true;
  };
  const riempi = () => {
    const ok = applicaSel((s, m, a) => {
      const p = parOggi(a); const delta = p - a.qty; a.qty = p;
      registraMov(s, { magId: m.id, prodottoId: a.prodottoId, uomId: a.uomId, delta, dopo: p, causale: "plancia", chi: profilo?.nome });
    }, (n) => `Riempite ${n} caselle al livello previsto`);
    if (ok) { vibra(24); setColpo((c) => c + 1); }
  };
  /* rimette a numeri interi la giacenza — e, SOLO per chi ha la struttura,
     anche soglia e livelli per giorno: quelli sono forma del magazzino, e
     prima di gen-5.95 questo comando li riscriveva pur stando nel gruppo
     Quantita', aperto a tutti. La decisione si prende QUI FUORI, una volta:
     dentro muta() il blocco puo' essere rieseguito alla riconciliazione. */
  const arrotonda = () => {
    const conStruttura = puoStruttura(profilo);
    const ok = applicaSel((s, m, a) => {
      const prima = a.qty;
      a.qty = Math.max(0, Math.round(a.qty || 0));
      if (conStruttura && a.par != null) a.par = Math.max(0, Math.round(a.par));
      if (conStruttura && a.parGiorni) {
        const pg = {};
        for (const d in a.parGiorni) pg[d] = Math.max(0, Math.round(a.parGiorni[d] || 0));
        a.parGiorni = pg;
      }
      const delta = a.qty - prima;
      if (Math.abs(delta) > 1e-9) registraMov(s, { magId: m.id, prodottoId: a.prodottoId, uomId: a.uomId,
        delta, dopo: a.qty, causale: "plancia", chi: profilo?.nome, rif: "arrotondamento" });
    }, (q) => `Arrotondate ${q} caselle a numeri interi`);
    if (ok) vibra(16);
  };
  const azzera = () => {
    const ok = applicaSel((s, m, a) => {
      const delta = -a.qty; a.qty = 0;
      registraMov(s, { magId: m.id, prodottoId: a.prodottoId, uomId: a.uomId, delta, dopo: 0, causale: "plancia", chi: profilo?.nome });
    }, (q) => `Azzerate ${q} caselle`);
    if (ok) vibra(16);
  };
  const spostaVerso = (destId) => {
    /* stesso conto vero: qui pero' contano DUE permessi — quello sui
       magazzini di partenza e quello sulla destinazione. Se la destinazione
       non e' tua non si sposta niente, ed e' bene dirlo invece di annunciare
       uno spostamento che non e' avvenuto. */
    const dest = trova(stato.magazzini, destId);
    if (!dest || !scrivibile(dest)) {
      mostraToast("Quel magazzino non è tuo: non è stato spostato niente", "errore");
      setAzione(null); setVal(""); return;
    }
    const mie = tocacabili().filter((k) => k.split("|")[0] !== destId);
    if (!mie.length) {
      mostraToast("Nessuno di questi articoli si può spostare: non c'è più o non è tuo", "errore");
      setAzione(null); setVal(""); return;
    }
    const n = mie.length, fuori = sel.size - n;
    muta((s) => {
      const mD = trova(s.magazzini, destId); if (!mD || !scrivibile(mD)) return;
      for (const k of sel) {
        const [mid, pid] = k.split("|");
        if (mid === destId) continue;
        const mO = trova(s.magazzini, mid); if (!mO || !scrivibile(mO)) continue;
        const a = mO.articoli.find((x) => x.prodottoId === pid); if (!a) continue;
        const prod = trova(s.prodotti, pid);
        const ex = mD.articoli.find((x) => x.prodottoId === pid);
        if (ex) {
          const conv = converti(prod, a.qty, a.uomId, ex.uomId) ?? a.qty;
          ex.qty = +(ex.qty + conv).toFixed(4);
          if (a.qty > 0) registraMov(s, { magId: destId, prodottoId: pid, uomId: ex.uomId, delta: conv, dopo: ex.qty, causale: "trasferimento", chi: profilo?.nome, rif: `da «${mO.nome}»` });
        } else {
          mD.articoli.push({ ...a });
          if (a.qty > 0) registraMov(s, { magId: destId, prodottoId: pid, uomId: a.uomId, delta: a.qty, dopo: a.qty, causale: "trasferimento", chi: profilo?.nome, rif: `da «${mO.nome}»` });
        }
        if (a.qty > 0) registraMov(s, { magId: mid, prodottoId: pid, uomId: a.uomId, delta: -a.qty, dopo: 0, causale: "trasferimento", chi: profilo?.nome, rif: `a «${mD.nome}»` });
        mO.articoli = mO.articoli.filter((x) => x.prodottoId !== pid);
      }
    }, fuori ? `${n} prodotti spostati · ${fuori} saltati` : `${n} prodotti spostati`);
    mostraToast(fuori ? `${n} spostati · ${fuori} saltati: non ci sono più, non sono tuoi o erano già lì`
      : `${n} prodotti spostati`, fuori ? "avviso" : "ok");
    /* lo spostamento cambia la struttura: la vecchia fotografia non vale piu,
       meglio togliere l'annulla che offrirebbe un ripristino sbagliato */
    setAnnulla(null); setSel(new Set());
  };
  const conferma = () => {
    if (azione === "giacenza" || azione === "soglia") {
      const n = num(val); if (n == null || n < 0) return mostraToast("Inserisci un numero valido", "errore");
      if (vuoleInteri && !eIntero(n)) return mostraToast("Nella selezione ci sono prodotti da spedire interi: usa un numero intero", "errore");
      if (azione === "giacenza") applicaSel((s, m, a) => {
        const delta = n - a.qty; a.qty = n;
        registraMov(s, { magId: m.id, prodottoId: a.prodottoId, uomId: a.uomId, delta, dopo: n, causale: "plancia", chi: profilo?.nome });
      }, (q) => `Giacenza a ${fmtQ(n)} su ${q} caselle`);
      else applicaSel((s, m, a) => { a.par = n; }, (q) => `Livello previsto a ${fmtQ(n)} su ${q} caselle`);
    } else if (azione === "unita") {
      if (!val) return mostraToast("Scegli un'unità", "errore");
      applicaSel((s, m, a) => { a.uomId = val; }, (q) => `Unità aggiornata su ${q} caselle`);
    } else if (azione === "sposta") {
      if (!val) return mostraToast("Scegli il magazzino di destinazione", "errore");
      spostaVerso(val);
    } else if (azione === "giorni") {
      const pg = {}; let alcuno = false;
      for (const [d] of GIORNI) {
        const v = gg[d];
        if (v == null || String(v).trim() === "") continue;
        const n = num(v);
        if (n == null || n < 0) return mostraToast(`Valore non valido per ${NOMI_GIORNI[d]}`, "errore");
        if (vuoleInteri && !eIntero(n)) return mostraToast(`${NOMI_GIORNI[d]}: questo prodotto va spedito intero, usa un numero intero`, "errore");
        pg[d] = n; alcuno = true;
      }
      applicaSel((s, m, a) => { if (alcuno) a.parGiorni = { ...pg }; else delete a.parGiorni; },
        (q) => (alcuno ? `Livelli per giorno su ${q} caselle` : `Tolto il per-giorno su ${q} caselle`));
    } else if (azione === "ungiorno") {
      const n = num(val); if (n == null || n < 0) return mostraToast("Inserisci un numero valido", "errore");
      if (vuoleInteri && !eIntero(n)) return mostraToast("Nella selezione ci sono prodotti da spedire interi: usa un numero intero", "errore");
      applicaSel((s, m, a) => {
        const pg = { ...(a.parGiorni || {}) };
        /* se il prodotto non aveva il per-giorno, gli altri giorni partono dal livello base */
        if (!a.parGiorni) for (const [dd] of GIORNI) pg[dd] = a.par;
        pg[giorno] = n; a.parGiorni = pg;
      }, (q) => `${NOMI_GIORNI[giorno]} a ${fmtQ(n)} su ${q} caselle`);
    } else if (azione === "rimuovi") {
      /* stesso conto vero di applicaSel: «rimuovi» non passa di li' ma ha
         esattamente lo stesso difetto — diceva quante ne avevi scelte. */
      const mie = tocacabili();
      if (!mie.length) {
        mostraToast("Nessuno di questi articoli si può togliere: non c'è più o non è tuo", "errore");
        setAzione(null); setVal(""); return;
      }
      const quante = mie.length, fuori = sel.size - quante;
      const dove = new Set(mie.map((k) => k.split("|")[0])).size;
      /* togliArticolo porta via anche dalle linee rifornite, se il magazzino
         è un laboratorio: è la stessa regola del dettaglio magazzino */
      muta((s) => {
        for (const k of sel) {
          const [mid, pid] = k.split("|");
          if (scrivibile(trova(s.magazzini, mid))) togliArticolo(s, mid, pid);
        }
      }, fuori ? `${quante} articoli rimossi da ${dove} magazzini · ${fuori} saltati`
        : `${quante} articoli rimossi da ${dove} magazzini`);
      mostraToast(fuori ? `${quante} rimossi · ${fuori} saltati: non ci sono più o non sono tuoi`
        : `${quante} articoli rimossi`, fuori ? "avviso" : "ok");
      /* la struttura è cambiata: la vecchia fotografia dell'annulla non vale più */
      setAnnulla(null); setSel(new Set());
    } else if (azione === "interi") {
      if (!val) return mostraToast("Scegli sì o no", "errore");
      const acceso = val === "si";
      applicaSel((s, m, a) => { const p = trova(s.prodotti, a.prodottoId); if (p) { if (acceso) p.soloInteri = true; else delete p.soloInteri; } },
        (q) => (acceso ? `${q} prodotti da spedire solo interi` : `${q} prodotti anche a frazioni`));
    }
    vibra(14);
    setAzione(null); setVal("");
  };

  /* apre la griglia dei giorni partendo da quello che c'è già */
  const apriGiorni = (chiave) => {
    const primo = chiave || [...sel][0]; const init = {};
    if (primo) {
      const [mid, pid] = primo.split("|");
      const m = trova(stato.magazzini, mid); const a = m?.articoli.find((x) => x.prodottoId === pid);
      if (a) {
        if (a.parGiorni) for (const [d] of GIORNI) { if (a.parGiorni[d] != null) init[d] = String(a.parGiorni[d]).replace(".", ","); }
        else for (const [d] of GIORNI) init[d] = String(a.par ?? "").replace(".", ",");
      }
    }
    setGG(init); setAzione("giorni");
  };

  /* Nove bottoni in fila non si leggono: scorrevano fuori schermo e quello
     che cancella stava in mezzo agli altri. Divisi per famiglia se ne vedono
     al massimo quattro alla volta, senza scorrere, e il distruttivo è in
     fondo, in rosso, dove non lo tocchi per sbaglio. Il gruppo si chiama
     «Articoli» e non «Struttura» perché quello è già il nome di una scheda. */
  const GRUPPI = [
    { id: "quantita", t: "Quantità", cmd: [
      { ic: Zap, t: "Riempi", on: riempi, forte: true },
      { ic: Gauge, t: "Giacenza", on: () => { setVal(""); setAzione("giacenza"); } },
      { ic: Sparkles, t: "Arrotonda", on: arrotonda },
      { ic: X, t: "Azzera", on: azzera },
    ] },
    { id: "soglie", t: "Soglie", cmd: [
      { ic: Ruler, t: "Soglia", on: () => { setVal(""); setAzione("soglia"); } },
      { ic: TrendingUp, t: "Per giorno", on: () => apriGiorni() },
      { ic: PackageCheck, t: "Interi", on: () => { setVal(""); setAzione("interi"); } },
    ] },
    { id: "articoli", t: "Articoli", cmd: [
      { ic: Tag, t: "Unità", on: () => { setVal(""); setAzione("unita"); } },
      { ic: ArrowLeftRight, t: "Sposta", on: () => { setVal(""); setAzione("sposta"); } },
      { ic: Trash2, t: "Rimuovi", on: () => setAzione("rimuovi"), rosso: true },
    ] },
  ];
  /* senza autorizzazione alla struttura resta la famiglia delle Quantita':
     riempire, impostare giacenze, arrotondare, azzerare. Soglie e Articoli
     (unita', sposta, rimuovi) sono forma del magazzino, non lavoro del
     giorno. Il filtro sta QUI e non solo sulle pastiglie, cosi' anche
     cmdGruppo non puo' finire su un comando negato. */
  const GRUPPI_MIEI = puoStruttura(profilo) ? GRUPPI : GRUPPI.filter((g) => g.id === "quantita");
  const cmdGruppo = (GRUPPI_MIEI.find((g) => g.id === gruppo) || GRUPPI_MIEI[0]).cmd;
  const titoloAz = { giacenza: "Imposta giacenza", soglia: "Imposta livello previsto", unita: "Cambia unità",
    sposta: "Sposta in un magazzino", giorni: "Livelli giorno per giorno", interi: "Prodotti da spedire interi",
    rimuovi: "Rimuovi gli articoli scelti",
    ungiorno: `Livello di ${NOMI_GIORNI[giorno] || ""}` }[azione] || "";

  /* anteprima: com'è ora la selezione e dove finirebbe con questa azione */
  const artsSel = [];
  for (const k of sel) {
    const [mid, pid] = k.split("|");
    const m = trova(stato.magazzini, mid); const a = m?.articoli.find((x) => x.prodottoId === pid);
    if (a) artsSel.push(a);
  }
  const vuoleInteri = artsSel.some((a) => soloInteri(stato, a));
  const mediaOra = artsSel.length ? artsSel.reduce((s, a) => s + Math.min(1, pctRiemp(a.qty, parOggi(a))), 0) / artsSel.length : 0;
  const nAnt = num(val);
  const mediaPoi = !artsSel.length || nAnt == null || nAnt < 0 ? mediaOra
    : azione === "giacenza" ? artsSel.reduce((s, a) => s + Math.min(1, pctRiemp(nAnt, parOggi(a))), 0) / artsSel.length
    : azione === "soglia" ? artsSel.reduce((s, a) => s + Math.min(1, pctRiemp(a.qty, nAnt)), 0) / artsSel.length
    : mediaOra;

  return (
    <div>
      {/* il chip «beta» e' andato: una schermata usata in produzione da mesi
          non e' una beta, e l'etichetta insegnava solo a diffidare */}
      <Intesta titolo="Plancia" sotto={soloCaselle
        ? "Le caselle del tuo magazzino: riempi, imposta, azzera"
        : "La rete a colpo d'occhio: struttura, livelli e comandi in blocco"} />
      {!soloCaselle && <div className="mb-4">
        <Segmenti valore={tab} onCambia={setTab} opzioni={[
          { id: "rete", nome: "Rete" }, { id: "struttura", nome: "Struttura" },
          { id: "settimana", nome: "Settimana" }, { id: "caselle", nome: "Caselle" },
        ]} /></div>}

      {/* barra di contesto: resta in alto mentre scorri, così non perdi
          mai il punto in cui sei e cosa hai in mano */}
      <div className="flex items-center gap-2 rounded-2xl px-3 py-2 mb-3" style={{ position: "sticky", top: 0, zIndex: 20,
        background: "rgba(244,247,254,.94)", backdropFilter: "blur(10px)", border: `1px solid ${T.bordo}` }}>
        <span className="text-xs font-bold truncate min-w-0 flex-1" style={{ color: T.dim }}>
          {tab === "rete" ? `Rete · ${mags.length} magazzini`
            : tab === "struttura" ? `Struttura · ${stato.sedi.filter((s) => mags.some((m) => m.sedeId === s.id)).length} sedi`
            : magCorr ? `${trova(stato.sedi, magCorr.sedeId)?.nome || "—"} › ${magCorr.nome}` : "—"}
        </span>
        {magCorr && (tab === "settimana" || tab === "caselle") && (() => {
          const pieno = riempMag(magCorr);
          const completo = pieno >= 0.999;
          return (
            <span key={completo ? "ok" : "no"} className={completo ? "sc-traguardo inline-flex" : "inline-flex"}>
              <Chip colore={coloreRiemp(pieno)} pieno={completo}>{Math.round(pieno * 100)}%</Chip>
            </span>
          );
        })()}
        {sel.size > 0 && <Chip colore={T.blu} pieno>{sel.size} scelte</Chip>}
      </div>

      <div key={tab} className="sc-fade" style={{ paddingBottom: sel.size ? 112 : 8 }}>
        {tab === "rete" && <PlanciaRete stato={stato} mags={mags} sel={sel} onSelMag={toggleMag} onApri={apri}
          onSelSotto={selSotto} onScegli={scegliChiavi} />}
        {tab === "struttura" && <PlanciaStruttura stato={stato} mags={mags} sel={sel} onArt={toggleArt} onSelMag={toggleMag}
          onSelSede={toggleSede} onSelLista={toggleLista} onApri={apri} />}
        {tab === "settimana" && <PlanciaSettimana stato={stato} mag={magCorr} mags={mags} sel={sel} toccati={toccati}
          onMagCambia={setMagId} onSelLista={toggleLista}
          onRiga={(pid) => { if (!puoStruttura(profilo)) return;
            const k = chiaveArt(magCorr.id, pid); setSel(new Set([k])); apriGiorni(k); }}
          onColonna={(d, soloSel) => { if (!puoStruttura(profilo)) return;
            if (!soloSel) setSel(new Set(magCorr.articoli.map((a) => chiaveArt(magCorr.id, a.prodottoId))));
            setGiorno(d); setVal(""); setAzione("ungiorno"); }} />}
        {tab === "caselle" && <PlanciaCaselle stato={stato} mag={magCorr} mags={mags} sel={sel} toccati={toccati}
          onArt={toggleArt} onStep={step} onMagCambia={setMagId} onSelLista={toggleLista} passo={passo} onPasso={setPasso} />}
      </div>

      {annulla && annulla.length > 0 && sel.size === 0 && (
        <div className="fixed left-3 right-3 z-40 sc-su" style={{ bottom: "calc(5.4rem + env(safe-area-inset-bottom))", maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
          <button onClick={tornaIndietro} className="w-full flex items-center gap-3 rounded-3xl px-4 py-3"
            style={{ background: "rgba(19,25,48,.96)", backdropFilter: "blur(12px)", boxShadow: "0 18px 44px -14px rgba(10,15,40,.8)", textAlign: "left" }}>
            <RotateCcw size={18} color="#fff" />
            <span className="flex-1 text-white font-extrabold text-sm">Annulla l'ultima modifica</span>
            <span className="text-xs font-bold" style={{ color: "#AEB8D8" }}>{annulla.length} caselle</span>
          </button>
        </div>
      )}

      {volo && (
        <div key={volo.k} className="pointer-events-none fixed inset-x-0 flex justify-center" style={{ bottom: "calc(9.6rem + env(safe-area-inset-bottom))", zIndex: 45 }}>
          <span className="sc-vola rounded-full px-3.5 py-1.5 text-sm font-extrabold flex items-center gap-1.5"
            style={{ background: T.grad, color: "#fff", boxShadow: "0 10px 26px -10px rgba(80,60,180,.75)" }}>
            <Check size={15} />{volo.n} caselle
          </span>
        </div>
      )}

      <Coriandoli colpo={colpo} />

      {sel.size > 0 && (
        <div className="fixed left-3 right-3 z-40 sc-su" style={{ bottom: "calc(5.4rem + env(safe-area-inset-bottom))", maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
          <div className="rounded-3xl p-2.5" style={{ background: "rgba(19,25,48,.96)", backdropFilter: "blur(12px)", boxShadow: "0 18px 44px -14px rgba(10,15,40,.8)" }}>
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-white font-extrabold text-sm">
                {sel.size} caselle<span style={{ color: "#AEB8D8", fontWeight: 700 }}> · {magsSel.size} magazzini</span>
              </span>
              <button onClick={() => setSel(new Set())} className="text-xs font-bold" style={{ color: "#AEB8D8" }}>Deseleziona</button>
            </div>
            <div className="flex gap-1.5 px-1 pb-2">
              {GRUPPI_MIEI.map((g) => (
                <button key={g.id} onClick={() => { vibra(6); setGruppo(g.id); }}
                  className="flex-1 rounded-full py-1.5 text-xs font-extrabold"
                  style={g.id === gruppo
                    ? { background: "rgba(255,255,255,.16)", color: "#fff" }
                    : { background: "transparent", color: "#8E9AC0" }}>{g.t}</button>
              ))}
            </div>
            <div key={gruppo} className="sc-fade flex gap-2 pb-1">
              {cmdGruppo.map((b, k) => (
                <button key={k} onClick={b.on} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 flex-1 min-w-0"
                  style={{ background: b.forte ? T.grad : b.rosso ? "rgba(226,92,119,.22)" : "rgba(255,255,255,.1)",
                    color: b.rosso ? "#FFC3CF" : "#fff" }}>
                  <b.ic size={18} /><span className="text-xs font-bold truncate w-full text-center">{b.t}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Foglio aperto={!!azione} titolo={titoloAz} onChiudi={() => { setAzione(null); setVal(""); }}>
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: T.dim }}>
            Su <b style={{ color: T.ink }}>{sel.size}</b> caselle in <b style={{ color: T.ink }}>{magsSel.size}</b> magazzini.
          </p>
          {(azione === "giacenza" || azione === "soglia") && (<>
            <Campo label={azione === "giacenza" ? "Nuova giacenza" : "Nuovo livello previsto"} valore={val}
              onCambia={(v) => setVal(puliziaNum(v))} inputMode="decimal" placeholder="0" autoFocus
              suggerimento="Puoi usare i decimali: 0,5 vale mezza confezione." />
            <AnteprimaLivello da={mediaOra} a={mediaPoi} />
          </>)}
          {azione === "ungiorno" && (<>
            <Campo label={`Livello previsto di ${NOMI_GIORNI[giorno]}`} valore={val}
              onCambia={(v) => setVal(puliziaNum(v))} inputMode="decimal" placeholder="0" autoFocus
              suggerimento={vuoleInteri ? "Ci sono prodotti da spedire interi: usa un numero intero." : "Gli altri giorni restano come sono."} />
          </>)}
          {azione === "interi" && (<>
            <p className="text-xs -mt-2" style={{ color: T.dim }}>
              Alcuni prodotti si spediscono solo a confezioni intere (una bufala non si manda a metà).
              Segnandoli qui, l'app non accetterà più mezze quantità per loro e i tasti +/- andranno di 1 in 1.
            </p>
            <Selettore label="Si spediscono solo interi?" valore={val} onCambia={setVal}
              opzioni={[{ id: "", nome: "— scegli —" }, { id: "si", nome: "Sì, solo confezioni intere" }, { id: "no", nome: "No, anche mezze quantità" }]} />
          </>)}
          {azione === "giorni" && (<>
            <p className="text-xs -mt-2" style={{ color: T.dim }}>
              Un livello diverso per ogni giorno: lascia vuoto un giorno per non usarlo.
              {vuoleInteri
                ? " Questa selezione contiene prodotti da spedire interi: solo numeri interi, passo 1."
                : ` I decimali valgono (0,5 = mezza confezione). Il passo dei tasti è ${passo === 1 ? "1" : "0,5"}.`}
            </p>
            <GrigliaGiorni gg={gg} setGG={setGG} passo={passo} interi={vuoleInteri} />
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setGG((x) => { const v = x["1"] ?? ""; const n = {}; for (const [d] of GIORNI) n[d] = v; return n; })}
                className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "#EAF0FE", color: T.blu }}>Copia lunedì su tutti</button>
              <button onClick={() => setGG((x) => { const v = x["1"] ?? ""; const n = { ...x }; ["1", "2", "3", "4", "5"].forEach((d) => { n[d] = v; }); return n; })}
                className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "#EAF0FE", color: T.blu }}>Pareggia feriali</button>
              <button onClick={() => setGG((x) => { const v = x["6"] ?? ""; const n = { ...x }; ["6", "0"].forEach((d) => { n[d] = v; }); return n; })}
                className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "#F1EBFE", color: T.viola }}>Pareggia weekend</button>
              <button onClick={() => setPasso(passo === 1 ? 0.5 : 1)}
                className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "#EAEFF9", color: T.dim }}>Passo {passo === 1 ? "0,5" : "1"}</button>
              <button onClick={() => setGG({})}
                className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "#FDEEF1", color: T.rosso }}>Svuota tutto</button>
            </div>
          </>)}
          {azione === "unita" && (
            <Selettore label="Unità di misura (anche GN)" valore={val} onCambia={setVal}
              opzioni={[{ id: "", nome: "— scegli —" }, ...stato.unita.map((u) => ({ id: u.id, nome: labelU(u) }))]} />
          )}
          {azione === "sposta" && (
            /* solo magazzini su cui si può davvero scrivere: offrirne altri
               vorrebbe dire far scegliere una cosa che poi viene rifiutata */
            <Selettore label="Magazzino di destinazione" valore={val} onCambia={setVal}
              opzioni={[{ id: "", nome: "— scegli —" },
                ...magazziniPerSede(stato, mags.filter((m) => scrivibile(m))).map((m) => ({ id: m.id, nome: m.nome }))]} />
          )}
          {azione === "rimuovi" && (() => {
            /* le linee che perderanno il prodotto perché nella selezione c'è un
               magazzino laboratorio: si nominano PRIMA, non dopo */
            const perse = [];
            for (const k of sel) {
              const [mid, pid] = k.split("|");
              for (const l of lineeColProdotto(stato, trova(stato.magazzini, mid), pid))
                if (!perse.includes(l.nome)) perse.push(l.nome);
            }
            return (
              <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl px-3.5 py-3 text-sm font-semibold"
                  style={{ background: "#FCEEF1", color: "#8C2B45", border: `1.5px solid ${T.rosso}55` }}>
                  Togli <b>{sel.size}</b> articoli da <b>{magsSel.size}</b> magazzini.
                  Le loro soglie e i livelli per giorno si perdono. I prodotti restano a catalogo.
                </div>
                {perse.length > 0 && (
                  <div className="rounded-2xl px-3.5 py-3 text-sm font-semibold"
                    style={{ background: "#FFF6E8", color: "#7A4A00", border: `1.5px solid ${T.ambra}` }}>
                    A cascata spariranno anche dalle {perse.length} linee rifornite dal laboratorio: {perse.join(", ")}.
                  </div>
                )}
                <p className="text-xs" style={{ color: T.tenue }}>
                  Se sbagli, in Home lo storico ti fa riportare tutto com'era.
                </p>
              </div>
            );
          })()}
          <PieDiPagina onChiudi={() => { setAzione(null); setVal(""); }} onSalva={conferma}
            testo={azione === "rimuovi" ? `Rimuovi ${sel.size}` : "Applica"} />
        </div>
      </Foglio>
    </div>
  );
}

function Struttura({ stato, profilo, muta, sync, esci, mostraToast, ripristina }) {
  const [vista, setVista] = useState("home");
  const [guida, setGuida] = useState(null);     // tutorial in corso: array di passi
  const [aiuto, setAiuto] = useState(false);    // menù "?" (guida)
  const [cerca, setCerca] = useState(false);    // ricerca globale dall'intestazione
  /* ── QUANDO LA LENTE TI PORTA DA QUALCHE PARTE, QUELLO CHE AVEVI APERTO SI CHIUDE ──
     La lente adesso si raggiunge anche con una scheda aperta. Ma «portarti» in
     una sezione dove sei gia' non cambiava la chiave del contenuto, quindi la
     scheda restava davanti e sembrava che il tocco fosse andato a vuoto: la
     promessa mantenuta a meta' e' peggio di quella non fatta.
     Questo contatore sale a ogni salto fatto DALLA LENTE, e cambiando la chiave
     rimonta il contenuto — le schede aperte se ne vanno con lui. La navigazione
     normale non lo tocca e si comporta esattamente come prima. */
  const [giro, setGiro] = useState(0);
  /* un salto e' per un viaggio solo: chi naviga senza dati AZZERA quelli
     vecchi, cosi' il rientro in una schermata non riapre schede a sorpresa.
     Si legge SOLO negli inizializzatori di useState (la key del contenuto
     rimonta la vista a ogni cambio), mai in un effect. */
  const [salto, setSalto] = useState(null);
  const naviga = (v, dati) => { setSalto(dati || null); setVista(v); };
  const vaiDallaLente = (v) => { setSalto(null); setVista(v); setGiro((g) => g + 1); };
  const nRic = stato.richieste.filter((r) => r.aSedeLabId === profilo.sedeId && r.stato === "in-attesa").length;
  /* il conto delle righe da ordinare accende il badge solo per chi il
     ciclo d'acquisto ce l'ha: per gli altri e' un invito a una porta chiusa */
  const nOrd = (puoOrdinare(profilo) ? stato.ordini : []).filter((o) => o.stato === "da-ordinare" &&
    (profilo.ruolo === "admin" ? true :
      profilo.ruolo === "laboratorio" ? o.tipo === "lab" && o.sedeId === profilo.sedeId :
      o.tipo === "diretto" && o.sedeId === profilo.sedeId)).length;

  const nAcc = (stato.accessi || []).filter((a) => a.stato === "in-attesa").length;

  /* Dieci voci non ci stanno su nessun telefono: se ne vedevano cinque o sei
     e le altre restavano oltre il bordo, raggiungibili solo scorrendo di lato
     senza che niente lo facesse capire. Ora in barra ci sono le cinque che
     si usano durante il servizio — le stesse cinque che hanno da sempre
     operatore e laboratorio — e il resto sta sotto «Gestione».
     Cinque e non sei per una ragione misurata: a 360px con sei voci
     «Magazzini» aveva 56 pixel e ne chiedeva 59, e si leggeva «Magazz…».
     Con cinque ne ha 65: sei di margine, che assorbono anche un carattere
     piu' largo di quello con cui l'ho misurato qui.
     Gestione porta anche il pallino rosso di quello che chiede attenzione.
     L'icona è fra quelle già importate: aggiungerne una nuova vorrebbe dire
     scommettere sulla versione di lucide che il caricatore ha in produzione,
     e se il nome non esiste non si rompe l'icona, si rompe l'app. */
  const NAV = {
    admin: [
      { id: "home", nome: "Home", icona: Home, pronta: true },
      { id: "magazzini", nome: "Magazzini", icona: Boxes, pronta: true },
      { id: "plancia", nome: "Plancia", icona: Gamepad2, pronta: true },
      { id: "ordini", nome: "Ordini", icona: Truck, pronta: true, badge: nOrd },
      { id: "altro", nome: "Gestione", icona: ShieldCheck, pronta: true, badge: nAcc },
    ],
    operatore: [
      { id: "home", nome: "Home", icona: Home, pronta: true },
      { id: "conteggi", nome: "Conteggi", icona: ClipboardList, pronta: true },
      { id: "magazzini", nome: "Magazzini", icona: Boxes, pronta: true },
      { id: "plancia", nome: "Plancia", icona: Gamepad2, pronta: true },
      { id: "ordini", nome: "Ordini", icona: Truck, pronta: true, badge: nOrd },
    ],
    laboratorio: [
      { id: "home", nome: "Home", icona: Home, pronta: true },
      { id: "richieste", nome: "Richieste", icona: FlaskConical, pronta: true, badge: nRic },
      { id: "magazzini", nome: "Magazzini", icona: Boxes, pronta: true },
      { id: "plancia", nome: "Plancia", icona: Gamepad2, pronta: true },
      { id: "ordini", nome: "Ordini", icona: Truck, pronta: true, badge: nOrd },
    ],
  }[profilo.ruolo]
    /* CASSA SCAVALCA PLANCIA (gen-5.96): la barra regge CINQUE voci, misurate
       a gen-5.52 — una sesta rompe «Magazzini» a 360px. Chi ha l'interruttore
       «cassa» durante il servizio sta in cassa, non alla Plancia: la Cassa ne
       prende il posto in barra, e la Plancia resta raggiungibile dalla lente
       per chi ha anche le correzioni. La barra dell'admin non cambia:
       l'admin arriva in Cassa dalla lente. */
    .map((v) => (v.id === "plancia" && profilo.ruolo !== "admin" && puoCassa(profilo)
      ? { id: "cassa", nome: "Cassa", icona: Store, pronta: true } : v))
    /* la Plancia e' un cruscotto di comandi: senza «correzioni» ne'
       «struttura» e' una sala macchine con le leve spente — meglio nessuna
       porta che una porta su una stanza vuota (gen-5.95) */
    .filter((v) => profilo.ruolo === "admin" || v.id !== "plancia" || puoCorreggere(profilo));
  const voceAttiva = NAV.find((n) => n.id === vista) || NAV[0];

  /* primo accesso: avvia la panoramica una volta sola (per dispositivo) */
  useEffect(() => {
    try {
      /* per PROFILO, non per telefono: il secondo operatore sullo stesso
         dispositivo di cucina non aveva mai visto il tour. La chiave vecchia
         resta valida come «gia' visto», cosi' i telefoni esistenti non si
         ributtano nel tour in massa (gen-5.95). */
      const k = "scp:tour:v1:" + profilo.id;
      if (!localStorage.getItem(k) && !localStorage.getItem("scp:tour:v1")) setGuida(passiPanoramica(NAV));
      localStorage.setItem(k, "1");
    } catch {}
  }, []);
  /* Le pagine dentro «Gestione» non sono voci della barra in basso, e
     voceAttiva ripiega sulla prima voce quando non trova la vista: la guida
     di «Storico» si intitolava «Home». Prima si cerca il nome giusto lì. */
  const guidaSezione = (id) => {
    const sez = SEZIONI_ALTRO.find((s) => s.id === id);
    return GUIDA_SEZIONE[id] || [{ titolo: sez?.nome || voceAttiva?.nome || "Sezione",
      testo: sez?.sotto || GUIDA_NAV[id] || "Sezione dell'app." }];
  };
  /* IL NOME CHE STA SUL TASTO.
     Il ripiego di voceAttiva su NAV[0] era stato tappato dentro guidaSezione,
     ma il TASTO del « ? » leggeva ancora voceAttiva: nelle otto pagine dentro
     «Gestione» — che non sono voci della barra — si intitolava «Guida di
     "Home"» e portava l'icona della Home, salvo poi aprire (giustamente) la
     guida del Catalogo o dello Storico. Un nome falso su un tasto è peggio di
     un nome assente: chi legge si fida e non lo tocca. */
  const sezioneQui = SEZIONI_ALTRO.find((s) => s.id === vista);
  /* le viste raggiungibili SENZA stare in barra ne' sotto Gestione: l'admin
     in Cassa dalla lente, e chi ha cassa+correzioni in Plancia (lo swap di
     gen-5.96 gliel'ha tolta dalla barra). Senza questa mappa il ripiego su
     NAV[0] rimetteva «Guida di "Home"» su un tasto che non parla della Home —
     misurato dalla revisione, ed e' esattamente la regressione che il
     commento qui sopra dichiarava sanata. */
  const FUORI_BARRA = { cassa: { nome: "Cassa", icona: Store }, plancia: { nome: "Plancia", icona: Gamepad2 } };
  const fuori = !NAV.some((n) => n.id === vista) && FUORI_BARRA[vista];
  const nomeQui = sezioneQui?.nome || fuori?.nome || voceAttiva?.nome || "questa sezione";
  const IconaQui = sezioneQui?.icona || fuori?.icona || voceAttiva?.icona;

  const contenuto = () => {
    /* il gate difensivo (gen-5.95): finora le viste amministrative erano
       protette solo dal fatto che nessun bottone ci portava — e due porte
       lo smentivano (lo storico dalla Home, lo storico ordini da Ordini).
       Un muro qui vale per ogni porta, comprese quelle di domani. */
    const admin = profilo.ruolo === "admin";
    const chiusa =
      (!admin && ["catalogo", "analisi", "accessi", "memoria", "sistema", "altro", "sedi", "profili", "storico", "listino"].includes(vista)) ||
      (!admin && vista === "storico-ordini" && !puoOrdinare(profilo)) ||
      (!admin && vista === "plancia" && !puoCorreggere(profilo)) ||
      (vista === "cassa" && !puoCassa(profilo)) ||
      (vista === "conteggi" && profilo.ruolo === "laboratorio") ||
      (vista === "richieste" && profilo.ruolo === "operatore");
    if (chiusa) return <Scheda className="p-8"><Vuoto icona={ShieldCheck}
      titolo="Questa sezione non è del tuo profilo"
      testo="Serve un'autorizzazione che questo profilo non ha: la accende un Admin da Gestione, sezione Profili." /></Scheda>;
    if (vista === "home") return <HomeVista stato={stato} profilo={profilo} vaiA={naviga} muta={muta} mostraToast={mostraToast} />;
    if (voceAttiva && !voceAttiva.pronta) return <InArrivo titolo={voceAttiva.nome} gen={voceAttiva.gen} />;
    if (vista === "catalogo") return <VistaCatalogo stato={stato} muta={muta} mostraToast={mostraToast} profilo={profilo} />;
    if (vista === "magazzini") return <VistaMagazzini stato={stato} muta={muta} mostraToast={mostraToast} profilo={profilo} salto={salto} />;
    if (vista === "plancia") return <VistaPlancia stato={stato} muta={muta} mostraToast={mostraToast} profilo={profilo} />;
    if (vista === "analisi") return <VistaAnalisi stato={stato} muta={muta} mostraToast={mostraToast} profilo={profilo} />;
    if (vista === "conteggi") return <VistaConteggi stato={stato} profilo={profilo} muta={muta} mostraToast={mostraToast} sync={sync} />;
    if (vista === "richieste") return <VistaRichieste stato={stato} profilo={profilo} muta={muta} mostraToast={mostraToast} />;
    if (vista === "ordini") return <VistaOrdini stato={stato} profilo={profilo} muta={muta} mostraToast={mostraToast} vaiA={naviga} />;
    if (vista === "cassa") return <VistaCassa stato={stato} profilo={profilo} muta={muta} mostraToast={mostraToast} />;
    if (vista === "listino") return <VistaListino stato={stato} muta={muta} mostraToast={mostraToast} />;
    if (vista === "accessi") return <VistaAccessi stato={stato} profilo={profilo} muta={muta} mostraToast={mostraToast} />;
    if (vista === "memoria") return <VistaMemoria profilo={profilo} mostraToast={mostraToast} />;
    if (vista === "sistema") return <VistaSistema stato={stato} profilo={profilo} sync={sync} muta={muta}
      mostraToast={mostraToast} ripristina={ripristina} />;
    if (vista === "altro") return <VistaAltro stato={stato} vaiA={naviga} nAcc={nAcc} />;
    if (vista === "storico") return <VistaStorico stato={stato} muta={muta} profilo={profilo} mostraToast={mostraToast} />;
    if (vista === "storico-ordini") return <VistaStoricoOrdini stato={stato} profilo={profilo} mostraToast={mostraToast} vaiA={naviga} />;
    if (vista === "sedi") return <VistaSedi stato={stato} muta={muta} mostraToast={mostraToast} />;
    if (vista === "profili") return <VistaProfili stato={stato} muta={muta} mostraToast={mostraToast} profilo={profilo} />;
    return <InArrivo titolo={vista} gen={3} />;
  };

  const VoceNav = ({ v, mobile }) => {
    const attiva = vista === v.id;
    const badge = v.badge || 0;
    return (
      <button onClick={() => naviga(v.id)} data-tour={`nav-${v.id}`}
        className={`flex ${mobile ? "flex-col flex-1 min-w-0 py-2 gap-0.5" : "flex-row w-full px-4 py-3 gap-3"} items-center rounded-2xl font-bold text-xs md:text-sm transition-all`}
        style={{
          color: attiva ? T.blu : T.dim,
          background: attiva ? (mobile ? "transparent" : "#EAF0FE") : "transparent",
        }}>
        <span className={`relative ${mobile && attiva ? "rounded-full px-4 py-1" : ""}`}
          style={mobile && attiva ? { background: "#EAF0FE" } : {}}>
          <span key={attiva ? "on" : "off"} className={attiva ? "sc-conta inline-flex" : "inline-flex"}><v.icona size={mobile ? 20 : 18} /></span>
          {badge > 0 && (
            <span className="absolute rounded-full flex items-center justify-center font-extrabold text-white"
              style={{ top: -6, right: mobile && attiva ? 4 : -8, minWidth: 16, height: 16, fontSize: 9, padding: "0 4px", background: T.rosso }}>
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </span>
        <span className={mobile ? "w-full text-center truncate leading-tight" : ""}
          style={mobile ? { fontSize: 10.5 } : {}}>{v.nome}</span>
        {!mobile && !v.pronta && <Chip colore={T.viola}>G{v.gen}</Chip>}
      </button>
    );
  };

  return (
    <div className="relative z-10 h-full flex flex-col">
      {/* ── L'INTESTAZIONE STA SOPRA LE SCHEDE ──
          La lente e' qui dentro, e finche' l'intestazione stava sotto i Foglio
          (fixed inset-0 z-50) per cercare qualcosa bisognava prima chiudere
          quello che si stava facendo. «Da ogni schermata» era una parola di
          troppo, e l'ho scoperto collaudando gen-5.71.

          Attenzione a dove va messo lo z-index: il primo tentativo l'ho messo
          sul TASTO della lente, e non e' servito a niente. Questa intestazione
          ha backdropFilter, e backdrop-filter crea un contesto di
          impilamento: lo z-index di un figlio resta prigioniero li' dentro e
          non si confronta con i fogli. Va alzata l'intestazione intera.
          60 sta sopra i fogli (50) e sotto il tutorial (80). */}
      <header className="flex items-center gap-3 px-4 md:px-6 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${T.bordo}`, background: "rgba(255,255,255,.75)", backdropFilter: "blur(14px)", paddingTop: "calc(0.75rem + env(safe-area-inset-top))", position: "relative", zIndex: 60 }}>
        <div className="rounded-2xl p-2" style={{ background: T.grad }}><Boxes size={18} color="#fff" /></div>
        <div className="min-w-0">
          <div className="font-extrabold leading-tight" style={{ color: T.ink }}>Supply Chain Pro</div>
          <div className="text-xs hidden sm:block" style={{ color: T.tenue }}>Rete rifornimenti · tempo reale</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SincroChip sync={sync} />
          <button onClick={() => setCerca(true)} aria-label="Cerca un prodotto o una funzione"
            className="rounded-full flex items-center justify-center shrink-0"
            style={{ width: 36, height: 36, background: "#EAF0FE", color: T.blu }}>
            <Search size={17} />
          </button>
          <button onClick={() => setAiuto(true)} aria-label="Guida e tutorial" data-tour="aiuto"
            className="rounded-full flex items-center justify-center font-extrabold shrink-0"
            style={{ width: 36, height: 36, background: "#EAF0FE", color: T.blu, fontSize: 17 }}>?</button>
          <Avatar nome={profilo.nome} colore={profilo.colore} size={36} />
          <button onClick={esci} aria-label="Esci dal profilo" className="rounded-full p-2.5"
            style={{ background: "#F0F3FB", color: T.dim }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden md:flex flex-col gap-1 w-56 shrink-0 p-4"
          style={{ borderRight: `1px solid ${T.bordo}` }}>
          {NAV.map((v) => <VoceNav key={v.id} v={v} />)}
          <div className="mt-auto text-xs leading-relaxed p-2" style={{ color: T.tenue }}>
            Connesso come <b style={{ color: T.dim }}>{profilo.nome}</b><br />
            {RUOLI[profilo.ruolo].nome}{profilo.sedeId ? ` · ${trova(stato.sedi, profilo.sedeId)?.nome}` : ""}
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto sc-scroll px-4 md:px-8 pt-5 md:pb-10"
          style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}>
          <div key={`${vista}#${giro}`} className="sc-fade max-w-5xl mx-auto">{contenuto()}</div>
        </main>
      </div>

      <nav aria-label="Navigazione principale"
        className="md:hidden fixed bottom-3 left-3 right-3 z-40 flex rounded-3xl px-1.5 py-1"
        style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(14px)", border: `1px solid ${T.bordo}`, boxShadow: "0 16px 40px -14px rgba(50,70,140,.35)", bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        {NAV.map((v) => <VoceNav key={v.id} v={v} mobile />)}
      </nav>

      <Foglio aperto={cerca} titolo="Cerca un prodotto o una funzione" onChiudi={() => setCerca(false)} larga>
        {cerca && <RicercaGlobale stato={stato} profilo={profilo}
          onChiudi={() => setCerca(false)} vaiA={vaiDallaLente} />}
      </Foglio>

      <Foglio aperto={aiuto} titolo="Guida e tutorial" onChiudi={() => setAiuto(false)}>
        <div className="flex flex-col gap-2">
          <p className="text-sm mb-1" style={{ color: T.dim }}>Un aiuto veloce, quando vuoi. Puoi sempre saltarlo.</p>
          <button onClick={() => { setAiuto(false); naviga("plancia"); }}
            className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left" style={{ background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
            <span className="rounded-xl p-2.5 shrink-0" style={{ background: "#EAF0FE", color: T.blu }}><Gamepad2 size={18} /></span>
            <span className="flex-1"><span className="font-extrabold block" style={{ color: T.ink }}>Plancia: la rete a colpo d'occhio</span>
              <span className="text-xs" style={{ color: T.dim }}>Come sono collegati i magazzini e cosa contiene ognuno, sui dati veri</span></span>
            <ChevronRight size={18} style={{ color: T.tenue }} />
          </button>
          <button onClick={() => { setAiuto(false); setGuida(passiPanoramica(NAV)); }}
            className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left" style={{ background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
            <span className="rounded-xl p-2.5 shrink-0" style={{ background: T.grad, color: "#fff" }}><Sparkles size={18} /></span>
            <span className="flex-1"><span className="font-extrabold block" style={{ color: T.ink }}>Panoramica completa</span>
              <span className="text-xs" style={{ color: T.dim }}>Un giro guidato di tutte le sezioni dell'app</span></span>
            <ChevronRight size={18} style={{ color: T.tenue }} />
          </button>
          <button onClick={() => { setAiuto(false); setGuida(guidaSezione(vista)); }}
            className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left" style={{ background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
            <span className="rounded-xl p-2.5 shrink-0" style={{ background: "#EAF0FE", color: T.blu }}><IconaQui size={18} /></span>
            <span className="flex-1"><span className="font-extrabold block" style={{ color: T.ink }}>Guida di «{nomeQui}»</span>
              <span className="text-xs" style={{ color: T.dim }}>Come usare la sezione che stai guardando</span></span>
            <ChevronRight size={18} style={{ color: T.tenue }} />
          </button>
        </div>
      </Foglio>
      {guida && <GuidaTour passi={guida} onFine={() => setGuida(null)} />}
    </div>
  );
}

/* ─────────── HOME PER RUOLO ─────────── */
/* ─────────── COSA È CAMBIATO, E COME TORNARE INDIETRO ───────────
   Lo storico finora salvava solo una frase. Per ripristinare una singola
   azione servono i numeri di prima: qui si fotografano le caselle (giacenza,
   soglia, unità, livelli per giorno) prima e dopo, e si tiene solo la
   differenza. Se le caselle toccate sono troppe si salva il conto e basta:
   meglio dire «questa non si può ripristinare» che gonfiare di dati lo stato,
   che viaggia intero a ogni sincronizzazione. */
const MAX_CAMBI = 60;
/* Le differenze si tengono solo per le ultime azioni: sono quelle che si
   sbagliano e si vogliono annullare. Più indietro resta la frase, che non
   pesa niente. Senza questo taglio lo storico pieno faceva crescere lo
   stato di 88 KB — e lo stato viaggia INTERO a ogni sincronizzazione, su
   telefoni che spesso stanno in 4G dentro una cucina. */
const MAX_VOCI_CAMBI = 12;
function sfoltisci(log) {
  return log.map((e, i) => {
    if (i < MAX_VOCI_CAMBI || !e.cambi) return e;
    const { cambi, ...resto } = e;
    return { ...resto, tante: cambi.length };
  });
}
function fotoCaselle(s) {
  const f = {};
  for (const m of s.magazzini || [])
    for (const a of m.articoli || [])
      f[m.id + "|" + a.prodottoId] = [a.qty, a.par, a.uomId, a.parGiorni ? JSON.stringify(a.parGiorni) : 0];
  return f;
}
/* ── LA FOTOGRAFIA DEI PRODOTTI (gen-5.83) ──
   fotoCaselle() guarda solo i magazzini, ed e' stato giusto finche' le
   modifiche vere stavano li'. Ma «Modifica in blocco» tocca i PRODOTTI, e
   quei campi non erano fotografati da nessuno: si premeva «Annulla», l'app
   diceva di averlo fatto, e non cambiava niente. Un annulla che mente e'
   peggio di un annulla che non c'e', perche' la gente ci conta e smette di
   cercare.
   Si fotografano solo i sette campi che una modifica in blocco puo' toccare,
   e nella voce di storico finisce SOLO quello che e' cambiato davvero: lo
   stato viaggia intero a ogni scrittura, e nel luglio scorso il suo peso e'
   gia' stato un difetto vero. */
function fotoProdotti(s) {
  const f = {};
  for (const p of s.prodotti || [])
    f[p.id] = [p.categoriaId || "", p.fornitoreId || "", p.uomBase || "",
      p.preparato ? 1 : 0, JSON.stringify(p.conv || {}),
      JSON.stringify(p.convStim || []), p.soloInteri ? 1 : 0];
  return f;
}
function differenzaProdotti(pri, dop) {
  const c = [];
  for (const k in pri) {
    const X = pri[k], Y = dop[k];
    if (!Y) continue;                    /* prodotto eliminato: se ne occupa altro */
    if (X.some((v, i) => v !== Y[i])) c.push({ k, p: X, d: Y });
  }
  return c;
}
function applicaRipristinoProdotti(s, cambi) {
  let n = 0;
  for (const c of cambi || []) {
    const p = trova(s.prodotti, c.k); if (!p) continue;
    p.categoriaId = c.p[0] || undefined;
    p.fornitoreId = c.p[1] || undefined;
    if (c.p[2]) p.uomBase = c.p[2];
    if (c.p[3]) p.preparato = true; else delete p.preparato;
    try { p.conv = JSON.parse(c.p[4]); } catch { p.conv = {}; }
    try { const st = JSON.parse(c.p[5]); if (st.length) p.convStim = st; else delete p.convStim; } catch {}
    if (c.p[6]) p.soloInteri = true; else delete p.soloInteri;
    n++;
  }
  return n;
}
/* la differenza sui prodotti, scritta in italiano */
function dettaglioCambiProdotti(stato, cambi) {
  const nomeCat = (id) => trova(stato.categorie, id)?.nome || "nessuna";
  const nomeForn = (id) => trova(stato.fornitori, id)?.nome || "nessuno";
  return (cambi || []).map((c) => {
    const r = { prod: trova(stato.prodotti, c.k)?.nome || "prodotto eliminato", righe: [] };
    if (c.p[0] !== c.d[0]) r.righe.push({ et: "categoria", da: nomeCat(c.p[0]), a: nomeCat(c.d[0]) });
    if (c.p[1] !== c.d[1]) r.righe.push({ et: "fornitore", da: nomeForn(c.p[1]), a: nomeForn(c.d[1]) });
    if (c.p[2] !== c.d[2]) r.righe.push({ et: "unità base", da: simboloU(stato, c.p[2]), a: simboloU(stato, c.d[2]) });
    if (c.p[3] !== c.d[3]) r.righe.push({ et: "chi lo fa", da: c.p[3] ? "laboratorio" : "fornitore", a: c.d[3] ? "laboratorio" : "fornitore" });
    if (c.p[4] !== c.d[4]) r.righe.push({ et: "conversioni", da: `${Object.keys(JSON.parse(c.p[4])).length}`, a: `${Object.keys(JSON.parse(c.d[4])).length}` });
    if (c.p[6] !== c.d[6]) r.righe.push({ et: "mezze confezioni", da: c.p[6] ? "no" : "sì", a: c.d[6] ? "no" : "sì" });
    return r;
  });
}
function differenzaCaselle(pri, dop) {
  const c = [];
  for (const k in pri) {
    const X = pri[k], Y = dop[k];
    if (!Y) { c.push({ k, v: "tolta", p: X }); continue; }
    if (X[0] !== Y[0] || X[1] !== Y[1] || X[2] !== Y[2] || X[3] !== Y[3]) c.push({ k, v: "cambiata", p: X, d: Y });
  }
  for (const k in dop) if (!pri[k]) c.push({ k, v: "aggiunta", d: dop[k] });
  return c;
}
/* la voce di storico, con dentro quanto basta per tornare indietro */
function voceLog(m, pri, dopoStato) {
  const v = { id: m.logId, t: m.t, chi: m.chi, msg: m.descr };
  if (!pri) return v;
  const c = differenzaCaselle(pri.caselle || pri, fotoCaselle(dopoStato));
  const cp = pri.prodotti ? differenzaProdotti(pri.prodotti, fotoProdotti(dopoStato)) : [];
  if (cp.length && cp.length <= MAX_CAMBI) v.cambiP = cp;
  else if (cp.length) v.tanteP = cp.length;
  if (!c.length) return v;
  if (c.length > MAX_CAMBI) { v.tante = c.length; return v; }
  v.cambi = c;
  return v;
}
/* Rimette i valori di prima. Torna quante caselle ha davvero toccato: se nel
   frattempo qualcuno ha eliminato un magazzino, quelle righe si saltano
   invece di far fallire tutto il ripristino. */
function applicaRipristino(s, cambi) {
  let n = 0;
  for (const c of cambi || []) {
    const [mid, pid] = c.k.split("|");
    const m = trova(s.magazzini, mid); if (!m) continue;
    const i = m.articoli.findIndex((x) => x.prodottoId === pid);
    if (c.v === "aggiunta") { if (i >= 0) { m.articoli.splice(i, 1); n++; } continue; }
    if (i < 0) m.articoli.push({ prodottoId: pid, qty: 0, par: 0 });
    const art = m.articoli.find((x) => x.prodottoId === pid);
    art.qty = c.p[0]; art.par = c.p[1]; art.uomId = c.p[2];
    if (c.p[3]) art.parGiorni = JSON.parse(c.p[3]); else delete art.parGiorni;
    n++;
  }
  return n;
}
/* la differenza scritta in italiano: «Linea fm · Patate  giacenza 5 → 2» */
function dettaglioCambi(stato, cambi) {
  const sym = (u) => simboloU(stato, u);
  return (cambi || []).map((c) => {
    const [mid, pid] = c.k.split("|");
    const r = {
      mag: trova(stato.magazzini, mid)?.nome || "magazzino eliminato",
      prod: trova(stato.prodotti, pid)?.nome || "prodotto eliminato",
      v: c.v, righe: [],
    };
    if (c.v === "tolta") r.righe.push({ et: "l'articolo", da: `${fmtQ(c.p[0])} ${sym(c.p[2])}`, a: "tolto" });
    else if (c.v === "aggiunta") r.righe.push({ et: "l'articolo", da: "non c'era", a: `${fmtQ(c.d[0])} ${sym(c.d[2])}` });
    else {
      if (c.p[0] !== c.d[0]) r.righe.push({ et: "giacenza", da: fmtQ(c.p[0]), a: fmtQ(c.d[0]) });
      if (c.p[1] !== c.d[1]) r.righe.push({ et: "soglia", da: fmtQ(c.p[1]), a: fmtQ(c.d[1]) });
      if (c.p[2] !== c.d[2]) r.righe.push({ et: "unità", da: sym(c.p[2]), a: sym(c.d[2]) });
      if (c.p[3] !== c.d[3]) r.righe.push({ et: "livelli per giorno", da: c.p[3] ? "impostati" : "nessuno", a: c.d[3] ? "impostati" : "nessuno" });
    }
    return r;
  });
}

/* ─────────── STORICO ───────────
   In Home ne stanno cinque, ed è giusto così. Ma quando devi trovare
   «chi ha azzerato il secco martedì» cinque non bastano: qui ci sono tutte,
   con i filtri per persona, per giorno e per magazzino, e il ripristino su
   ognuna esattamente come in Home. */
function VistaStorico({ stato, muta, profilo, mostraToast }) {
  const [chi, setChi] = useState("tutti");
  const [quando, setQuando] = useState("tutto");
  const [magF, setMagF] = useState("tutti");
  const [q, setQ] = useState("");
  const log = stato.log || [];

  const persone = [...new Set(log.map((e) => e.chi).filter(Boolean))].sort();
  /* i magazzini toccati davvero: filtrare per uno che non compare mai è un
     vicolo cieco, e non va nemmeno offerto */
  const magToccati = [...new Set(log.flatMap((e) => (e.cambi || []).map((c) => c.k.split("|")[0])))]
    .map((id) => trova(stato.magazzini, id)).filter(Boolean)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const inizioGiorno = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const oggi0 = inizioGiorno(Date.now());
  const daQuando = { tutto: 0, oggi: oggi0, ieri: oggi0 - 86400000, settimana: oggi0 - 6 * 86400000 }[quando];

  const filtrato = log.filter((e) => {
    if (chi !== "tutti" && e.chi !== chi) return false;
    if (e.t < daQuando) return false;
    if (quando === "ieri" && e.t >= oggi0) return false;
    if (magF !== "tutti" && !(e.cambi || []).some((c) => c.k.split("|")[0] === magF)) return false;
    if (q.trim() && !(e.msg || "").toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });
  const azzera = () => { setChi("tutti"); setQuando("tutto"); setMagF("tutti"); setQ(""); };
  const filtri = chi !== "tutti" || quando !== "tutto" || magF !== "tutti" || !!q.trim();

  return (
    <div>
      <Intesta titolo="Storico" sotto="Tutto quello che è stato fatto, con il dettaglio e il tasto per tornare indietro"
        azione={filtri ? <Bottone variante="fantasma" icona={X} onClick={azzera}>Togli i filtri</Bottone> : null} />

      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 mb-3"
        style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
        <Search size={16} style={{ color: T.tenue }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca nel testo dell'azione…"
          aria-label="Cerca nello storico" className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold"
          style={{ color: T.ink }} />
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <Segmenti valore={quando} onCambia={setQuando} opzioni={[
          { id: "tutto", nome: "Sempre" }, { id: "oggi", nome: "Oggi" },
          { id: "ieri", nome: "Ieri" }, { id: "settimana", nome: "7 giorni" },
        ]} />
        <div className="flex gap-2 flex-wrap">
          <select value={chi} onChange={(e) => setChi(e.target.value)} aria-label="Filtra per persona"
            className="rounded-full px-3.5 py-2.5 text-sm font-bold flex-1 min-w-0"
            style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink }}>
            <option value="tutti">Chiunque</option>
            {persone.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {magToccati.length > 0 && (
            <select value={magF} onChange={(e) => setMagF(e.target.value)} aria-label="Filtra per magazzino"
              className="rounded-full px-3.5 py-2.5 text-sm font-bold flex-1 min-w-0"
              style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink }}>
              <option value="tutti">Ogni magazzino</option>
              {magToccati.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          )}
        </div>
      </div>

      <Scheda className="p-5">
        <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
          <span className="font-extrabold" style={{ color: T.ink }}>
            {filtrato.length === log.length ? `Tutte le azioni · ${log.length}`
              : `${filtrato.length} su ${log.length}`}
          </span>
          <span className="text-xs" style={{ color: T.tenue }}>
            si conservano le ultime {MAX_CAMBI}, con il dettaglio sulle ultime {MAX_VOCI_CAMBI}
          </span>
        </div>
        {filtrato.length === 0
          ? <Vuoto icona={History} titolo="Nessuna azione con questi filtri"
              testo="Prova ad allargare il periodo, o togli i filtri con il tasto in alto." />
          : <LogLista log={filtrato} n={filtrato.length} stato={stato} muta={muta}
              profilo={profilo} mostraToast={mostraToast} />}
      </Scheda>
    </div>
  );
}

/* ─────────── STORICO ORDINI ───────────
   La vista «Ordini» è un piano di lavoro: dice cosa devo fare adesso, e per
   farlo divide le righe in tre schede per stato. Non è un archivio, e chi
   cercava «quanto ho ordinato la settimana scorsa» non aveva dove guardare.
   Questa pagina è l'archivio.

   Raggruppa le righe come sono state vissute davvero: un fornitore, un
   giorno, uno stato — quello è un ordine. Il conto in cima è per fornitore, e
   dove il prezzo non c'è lo dice invece di scrivere zero: un totale finto è
   peggio di un totale mancante, perché lo si crede.

   Le quantità NON si sommano mai fra prodotti diversi: 3 kg di farina più 2
   cassette di pomodori non fanno «5» di niente. Si contano le righe. */
const PERIODI_ORDINI = { oggi: 1, sette: 7, trenta: 30, tutto: 0 };
const giorno0 = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dataGiorno = (t) => new Date(t).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });
const ETICHETTA_ORD = { "da-ordinare": "Da ordinare", ordinato: "Ordinato", ricevuto: "Ricevuto" };
const COLORE_ORD = { "da-ordinare": T.ambra, ordinato: T.blu, ricevuto: T.verde };

/* Quanto vale una riga: la quantità vera portata in unità base per il prezzo.
   null quando non si sa — e chi chiama deve contarlo, non trattarlo come 0. */
function valoreRigaOrdine(stato, o) {
  const p = trova(stato.prodotti, o.prodottoId);
  if (!p || !(p.prezzo > 0)) return null;
  const q0 = qtyReale(o);
  const q = o.uomId === p.uomBase ? q0 : converti(p, q0, o.uomId, p.uomBase);
  return q == null ? null : q * p.prezzo;
}
function gruppiOrdini(stato, righe) {
  const mappa = new Map();
  for (const o of righe) {
    const t = dataOrdine(o);
    const g0 = giorno0(t);
    const k = `${o.fornitoreId}|${o.stato}|${g0}`;
    let g = mappa.get(k);
    if (!g) { g = { k, fornitoreId: o.fornitoreId, stato: o.stato, t, righe: [], euro: 0, senza: 0 }; mappa.set(k, g); }
    g.righe.push(o);
    if (t > g.t) g.t = t;
    const v = valoreRigaOrdine(stato, o);
    if (v == null) g.senza++; else g.euro += v;
  }
  return [...mappa.values()].sort((a, b) => b.t - a.t);
}

function VistaStoricoOrdini({ stato, profilo, mostraToast, vaiA }) {
  const [periodo, setPeriodo] = useState("trenta");
  const [fornF, setFornF] = useState("tutti");
  const [statoF, setStatoF] = useState("tutti");
  const [q, setQ] = useState("");
  const [aperto, setAperto] = useState(null);

  const miei = (stato.ordini || []).filter((o) => ordineVisibile(profilo, o));
  const gg = PERIODI_ORDINI[periodo];
  const da = gg ? giorno0(Date.now()) - (gg - 1) * 86400000 : 0;
  const cerca = q.trim().toLowerCase();

  /* i fornitori che compaiono davvero fra le TUE righe: filtrare per uno che
     non c'è mai è un vicolo cieco, e non va nemmeno offerto */
  const fornUsati = [...new Set(miei.map((o) => o.fornitoreId))]
    .map((id) => trova(stato.fornitori, id)).filter(Boolean)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const filtrate = miei.filter((o) => {
    if (dataOrdine(o) < da) return false;
    if (fornF !== "tutti" && o.fornitoreId !== fornF) return false;
    if (statoF !== "tutti" && o.stato !== statoF) return false;
    if (cerca && !(trova(stato.prodotti, o.prodottoId)?.nome || "").toLowerCase().includes(cerca)) return false;
    return true;
  });
  const gruppi = gruppiOrdini(stato, filtrate);

  /* il conto per fornitore si costruisce dalle righe, non dall'anagrafica: se
     un fornitore è stato cancellato dopo l'ordine, la sua spesa esiste
     comunque e deve restare nel totale invece di svanire */
  const perForn = (() => {
    const m = new Map();
    for (const o of filtrate) {
      const k = o.fornitoreId || "_ignoto";
      let x = m.get(k);
      if (!x) {
        x = { k, nome: trova(stato.fornitori, o.fornitoreId)?.nome || "Fornitore non più a catalogo",
          righe: 0, prodotti: new Set(), ordini: new Set(), euro: 0, senza: 0 };
        m.set(k, x);
      }
      x.righe++; x.prodotti.add(o.prodottoId);
      x.ordini.add(o.stato + "|" + giorno0(dataOrdine(o)));
      const v = valoreRigaOrdine(stato, o);
      if (v == null) x.senza++; else x.euro += v;
    }
    return [...m.values()].sort((a, b) => b.euro - a.euro || b.righe - a.righe || a.nome.localeCompare(b.nome));
  })();
  const totEuro = perForn.reduce((s, x) => s + x.euro, 0);
  const totSenza = perForn.reduce((s, x) => s + x.senza, 0);

  const filtri = periodo !== "trenta" || fornF !== "tutti" || statoF !== "tutti" || !!q.trim();
  const azzera = () => { setPeriodo("trenta"); setFornF("tutti"); setStatoF("tutti"); setQ(""); };

  /* il CSV è la via per tenere gli ordini oltre la finestra dell'app: il file
     resta sul dispositivo e non scade */
  const esporta = () => {
    if (!filtrate.length) return mostraToast("Niente da scaricare con questi filtri", "errore");
    const righe = [["Data", "Stato", "Tipo", "Sede", "Fornitore", "Prodotto", "Quantità", "UdM",
      "Ordinato (se diverso)", "Valore €", "Creato il", "Ordinato da", "Ordinato il", "Ricevuto da", "Ricevuto il"]];
    for (const o of [...filtrate].sort((a, b) => dataOrdine(b) - dataOrdine(a))) {
      const v = valoreRigaOrdine(stato, o);
      const qr = qtyReale(o);
      righe.push([
        dataIt(dataOrdine(o)), ETICHETTA_ORD[o.stato] || o.stato, o.tipo === "lab" ? "Laboratorio" : "Diretto",
        trova(stato.sedi, o.sedeId)?.nome || "", trova(stato.fornitori, o.fornitoreId)?.nome || "",
        trova(stato.prodotti, o.prodottoId)?.nome || "", numCsv(qr), simboloU(stato, o.uomId),
        Math.abs(qr - o.qty) > 1e-9 ? numCsv(o.qty) : "",
        v == null ? "" : numCsv(Math.round(v * 100) / 100),
        o.t ? dataIt(o.t) : "", o.ordinatoDa || "", o.tOrdine ? dataIt(o.tOrdine) : "",
        o.ricevutoDa || "", o.tRicezione ? dataIt(o.tRicezione) : "",
      ]);
    }
    scaricaCsv(`storico-ordini-${new Date().toISOString().slice(0, 10)}.csv`, righe);
    mostraToast(`${filtrate.length} righe scaricate in CSV`);
  };

  return (
    <div>
      {/* la via di ritorno: chi non è admin non ha «Gestione» nella barra, e
          senza questo tasto resterebbe qui dentro senza una strada indietro */}
      {vaiA && (
        <button onClick={() => vaiA("ordini")}
          className="flex items-center gap-1.5 text-sm font-bold rounded-full px-3 py-2 mb-3 self-start"
          style={{ color: T.dim, background: "#EDF1FA" }}>
          <ArrowLeft size={15} /> Ordini
        </button>
      )}
      <Intesta titolo="Storico ordini" sotto="Quello che è stato ordinato e quello che è arrivato davvero, con il conto per fornitore"
        azione={<div className="flex gap-2 flex-wrap">
          {filtri && <Bottone variante="fantasma" icona={X} onClick={azzera}>Togli i filtri</Bottone>}
          <Bottone variante="tonale" icona={Download} onClick={esporta} disabilitato={!filtrate.length}>Scarica CSV</Bottone>
        </div>} />

      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 mb-3"
        style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
        <Search size={16} style={{ color: T.tenue }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca un prodotto…"
          aria-label="Cerca un prodotto nello storico ordini"
          className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold" style={{ color: T.ink }} />
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <Segmenti valore={periodo} onCambia={setPeriodo} opzioni={[
          { id: "oggi", nome: "Oggi" }, { id: "sette", nome: "7 giorni" },
          { id: "trenta", nome: "30 giorni" }, { id: "tutto", nome: "Sempre" },
        ]} />
        <div className="flex gap-2 flex-wrap">
          {fornUsati.length > 1 && (
            <select value={fornF} onChange={(e) => setFornF(e.target.value)} aria-label="Filtra per fornitore"
              className="rounded-full px-3.5 py-2.5 text-sm font-bold flex-1 min-w-0"
              style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink }}>
              <option value="tutti">Ogni fornitore</option>
              {fornUsati.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          )}
          <select value={statoF} onChange={(e) => setStatoF(e.target.value)} aria-label="Filtra per stato"
            className="rounded-full px-3.5 py-2.5 text-sm font-bold flex-1 min-w-0"
            style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink }}>
            <option value="tutti">Ogni stato</option>
            <option value="da-ordinare">Da ordinare</option>
            <option value="ordinato">Ordinati</option>
            <option value="ricevuto">Ricevuti</option>
          </select>
        </div>
      </div>

      {gruppi.length > 0 && (
        <Scheda className="p-4 mb-3">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2.5">
            <span className="font-extrabold" style={{ color: T.ink }}>Il conto per fornitore</span>
            <span className="text-xs" style={{ color: T.tenue }}>
              {gruppi.length} {gruppi.length === 1 ? "ordine" : "ordini"} · {filtrate.length} {filtrate.length === 1 ? "riga" : "righe"}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {perForn.map((x) => (
              <div key={x.k} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
                style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ color: T.ink }}>{x.nome}</div>
                  <div className="text-xs" style={{ color: T.tenue }}>
                    {x.ordini.size} {x.ordini.size === 1 ? "ordine" : "ordini"} · {x.righe} {x.righe === 1 ? "riga" : "righe"} · {x.prodotti.size} {x.prodotti.size === 1 ? "prodotto" : "prodotti"}
                  </div>
                </div>
                <span className="font-extrabold whitespace-nowrap text-right" style={{ color: x.euro > 0 ? T.ink : T.tenue }}>
                  {x.euro > 0 ? fmtEuro(x.euro) : "—"}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs mt-2.5 leading-relaxed" style={{ color: T.dim }}>
            {totSenza === 0
              ? <>Totale del periodo: <b style={{ color: T.ink }}>{fmtEuro(totEuro)}</b></>
              : totSenza === filtrate.length
                ? <>Quanto è costato <b style={{ color: T.ink }}>non si sa</b>: nessuno di questi prodotti ha un prezzo in Catalogo.
                    Il conto delle righe è comunque esatto — sono i soldi che mancano, non gli ordini.</>
                : <>Totale di quello che si sa: <b style={{ color: T.ink }}>{fmtEuro(totEuro)}</b>
                    {" · "}{totSenza} {totSenza === 1 ? "riga fuori dal conto" : "righe fuori dal conto"}: manca il prezzo o la conversione</>}
          </div>
        </Scheda>
      )}

      <div className="rounded-2xl px-3.5 py-3 mb-3 text-xs leading-relaxed"
        style={{ background: "#FFF6E8", border: "1px solid #F2DCC0", color: "#7A4A00" }}>
        Qui c'è quello che l'app tiene in memoria: le righe chiuse restano <b>{GIORNI_ORDINI} giorni</b> (al
        massimo {MAX_ORDINI_CHIUSI}), poi vengono sfoltite per non appesantirla. Per conservarle più a lungo
        usa «Scarica CSV» qui in alto: il file resta sul telefono o sul computer e non scade.
      </div>

      {gruppi.length === 0 ? (
        <Scheda><Vuoto icona={Truck}
          titolo={miei.length === 0 ? "Nessun ordine da mostrare" : "Niente in questo periodo"}
          testo={miei.length === 0
            ? "Quando si segna un ordine come inviato al fornitore, o si registra la merce arrivata, l'ordine compare qui."
            : "Le tue righe ci sono, ma non in questa finestra: allarga il periodo o togli i filtri."} /></Scheda>
      ) : (
        <div className="flex flex-col gap-2">
          {gruppi.map((g) => {
            const apri = aperto === g.k;
            const col = COLORE_ORD[g.stato] || T.blu;
            return (
              <Scheda key={g.k} className="p-4">
                <button onClick={() => setAperto(apri ? null : g.k)}
                  aria-expanded={apri} className="flex items-center gap-3 w-full text-left">
                  <span className="rounded-2xl p-2.5 shrink-0" style={{ background: `${col}18`, color: col }}>
                    <Truck size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="font-extrabold block truncate" style={{ color: T.ink }}>
                      {trova(stato.fornitori, g.fornitoreId)?.nome || "Fornitore non più a catalogo"}
                    </span>
                    <span className="text-xs block" style={{ color: T.dim }}>
                      {dataGiorno(g.t)} · {g.righe.length} {g.righe.length === 1 ? "riga" : "righe"}
                      {g.euro > 0 ? ` · ${fmtEuro(g.euro)}` : ""}
                    </span>
                  </span>
                  <Chip colore={col}>{ETICHETTA_ORD[g.stato] || g.stato}</Chip>
                  <ChevronRight size={18} style={{ color: T.tenue, transform: apri ? "rotate(90deg)" : "none" }} />
                </button>

                {apri && (
                  <div className="sc-fade flex flex-col gap-1.5 mt-3">
                    {[...g.righe]
                      .sort((a, b) => (trova(stato.prodotti, a.prodottoId)?.nome || "")
                        .localeCompare(trova(stato.prodotti, b.prodottoId)?.nome || ""))
                      .map((o) => {
                        const p = trova(stato.prodotti, o.prodottoId);
                        const v = valoreRigaOrdine(stato, o);
                        const sym = simboloU(stato, o.uomId);
                        const qr = qtyReale(o);
                        const parziale = Math.abs(qr - o.qty) > 1e-9;
                        return (
                          <div key={o.id} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 flex-wrap"
                            style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate" style={{ color: T.ink }}>
                                {p?.nome || "Prodotto non più a catalogo"}
                              </div>
                              <div className="text-xs" style={{ color: T.tenue }}>
                                {trova(stato.sedi, o.sedeId)?.nome || "—"}
                                {o.stato === "ricevuto" && o.ricevutoDa ? ` · ricevuto da ${o.ricevutoDa}` : ""}
                                {o.stato === "ordinato" && o.ordinatoDa ? ` · ordinato da ${o.ordinatoDa}` : ""}
                                {/* una consegna parziale non va nascosta: il resto è
                                    tornato da ordinare in una riga a parte */}
                                {parziale ? ` · ne erano stati ordinati ${fmtQ(o.qty)} ${sym}` : ""}
                              </div>
                            </div>
                            <Chip colore={o.tipo === "lab" ? T.ciano : T.blu}>{o.tipo === "lab" ? "Lab" : "Diretto"}</Chip>
                            <span className="font-extrabold whitespace-nowrap" style={{ color: T.ink }}>
                              {fmtQ(qr)} {sym}
                            </span>
                            <span className="text-xs whitespace-nowrap" style={{ color: v == null ? T.tenue : T.dim }}>
                              {v == null ? "prezzo —" : fmtEuro(v)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </Scheda>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LogLista({ log, n = 6, stato, muta, profilo, mostraToast }) {
  const [apri, setApri] = useState(null);      // quale voce è aperta in dettaglio
  const [chiedi, setChiedi] = useState(null);  // quale voce si sta per ripristinare
  if (!log?.length) return <p className="text-sm" style={{ color: T.tenue }}>Nessuna attività registrata.</p>;

  /* si ripristina solo quello che si potrebbe rifare a mano: se una casella
     è di una sede che non tocchi, il tasto non compare nemmeno */
  /* I prodotti non hanno un magazzino a cui chiedere il permesso: il catalogo
     lo tocca chi puo' toccarlo, ed e' un controllo che sta gia' sulla porta
     della modifica in blocco. Qui si guarda solo che ci sia qualcosa da
     disfare. */
  const puoTornare = (e) => !!((e.cambi?.length || e.cambiP?.length) && stato && muta && profilo
    && puoCorreggere(profilo)
    /* i cambi al CATALOGO (cambiP) sono forma: prima non erano gatati affatto */
    && (!e.cambiP?.length || puoStruttura(profilo))
    && (e.cambi || []).every((c) => permessoSu(profilo, trova(stato.magazzini, c.k.split("|")[0])) !== "lettura"));

  const esegui = (e) => {
    let n = 0, np = 0;
    muta((s) => { n = applicaRipristino(s, e.cambi); np = applicaRipristinoProdotti(s, e.cambiP); },
      `Ripristinato: «${e.msg}» (${e.cambi?.length || 0} caselle e ${e.cambiP?.length || 0} prodotti riportati a prima)`);
    const pezzi = [];
    if (e.cambi?.length) pezzi.push(`${e.cambi.length} caselle`);
    if (e.cambiP?.length) pezzi.push(`${e.cambiP.length} prodotti`);
    mostraToast?.(`Ripristinati: ${pezzi.join(" e ")}`);
    setChiedi(null); setApri(null);
  };

  return (
    <>
    <ul className="flex flex-col">
      {log.slice(0, n).map((e, i) => {
        const aperto = apri === e.id;
        const dett = aperto && e.cambi ? dettaglioCambi(stato, e.cambi) : null;
        const dettP = aperto && e.cambiP ? dettaglioCambiProdotti(stato, e.cambiP) : null;
        return (
        <li key={e.id} className="py-2"
          style={{ borderBottom: i < Math.min(n, log.length) - 1 ? `1px solid ${T.bordo}` : "none" }}>
          <div className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: T.blu }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-snug" style={{ color: T.ink }}>{e.msg}</div>
              <div className="text-xs" style={{ color: T.tenue }}>
                {e.chi} · {tempoFa(e.t)}
                {e.cambi && ` · ${e.cambi.length} caselle`}
                {e.tante && ` · ${e.tante} caselle`}
                {e.cambiP && ` · ${e.cambiP.length} prodotti`}
                {e.tanteP && ` · ${e.tanteP} prodotti`}
              </div>
            </div>
            {(e.cambi || e.tante || e.cambiP || e.tanteP) && stato && (
              <button onClick={() => setApri(aperto ? null : e.id)}
                className="rounded-full px-2.5 py-1 text-xs font-bold shrink-0"
                style={{ background: aperto ? T.blu : "#EAF0FE", color: aperto ? "#fff" : T.blu }}>
                {aperto ? "chiudi" : "vedi cosa"}
              </button>
            )}
          </div>

          {aperto && (dett || dettP) && (
            <div className="sc-fade mt-2 ml-4 rounded-2xl p-2.5" style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
              <div className="flex flex-col gap-1.5" style={{ maxHeight: "40vh", overflowY: "auto" }}>
                {/* «|| []» non e' pignoleria: una modifica in blocco tocca solo i
                    prodotti, quindi «dett» e' null e senza questo il pannello
                    esplodeva lasciando la pagina bianca. Preso dal collaudo. */}
                {(dett || []).map((d, k) => (
                  <div key={k} className="rounded-xl px-2.5 py-2" style={{ background: "#fff", border: `1px solid ${T.bordo}` }}>
                    <div className="text-xs font-extrabold truncate" style={{ color: T.ink }}>{d.prod}</div>
                    <div className="text-xs mb-1 truncate" style={{ color: T.tenue }}>{d.mag}</div>
                    {d.righe.map((r, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold" style={{ color: T.tenue, minWidth: 84 }}>{r.et}</span>
                        <span className="font-extrabold" style={{ color: T.verde }}>{r.da}</span>
                        <span style={{ color: T.tenue }}>→</span>
                        <span className="font-extrabold" style={{ color: d.v === "tolta" ? T.rosso : T.ink }}>{r.a}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {/* e le modifiche ai PRODOTTI, che prima non si vedevano da
                    nessuna parte: una modifica in blocco lasciava una riga di
                    storico che diceva soltanto una data */}
                {(dettP || []).map((d, k) => (
                  <div key={"p" + k} className="rounded-xl px-2.5 py-2" style={{ background: "#fff", border: `1px solid ${T.bordo}` }}>
                    <div className="text-xs font-extrabold truncate" style={{ color: T.ink }}>{d.prod}</div>
                    <div className="text-xs mb-1 truncate" style={{ color: T.tenue }}>scheda del prodotto</div>
                    {d.righe.map((r, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold" style={{ color: T.tenue, minWidth: 84 }}>{r.et}</span>
                        <span className="font-extrabold" style={{ color: T.verde }}>{r.da}</span>
                        <span style={{ color: T.tenue }}>→</span>
                        <span className="font-extrabold" style={{ color: T.ink }}>{r.a}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {puoTornare(e)
                ? <button onClick={() => setChiedi(e)}
                    className="mt-2 w-full rounded-xl px-3 py-2 text-xs font-extrabold flex items-center justify-center gap-1.5"
                    style={{ background: T.blu, color: "#fff" }}>
                    <RotateCcw size={13} />Riporta tutto com'era prima
                  </button>
                : <p className="mt-2 text-xs" style={{ color: T.tenue }}>
                    Questa azione tocca magazzini che non puoi modificare: il ripristino lo può fare l'amministratore.
                  </p>}
            </div>
          )}
          {aperto && !dett && !dettP && (
            <p className="sc-fade mt-2 ml-4 text-xs" style={{ color: T.tenue }}>
              Il dettaglio di questa azione non è più conservato: si tengono le ultime {MAX_VOCI_CAMBI}, per non appesantire l'app.
            </p>
          )}
        </li>
      );})}
    </ul>
    <Conferma aperto={!!chiedi} titolo="Riportare tutto com'era?"
      testo={chiedi ? `${[chiedi.cambi?.length ? `${chiedi.cambi.length} caselle` : "", chiedi.cambiP?.length ? `${chiedi.cambiP.length} prodotti` : ""].filter(Boolean).join(" e ")} toccati da «${chiedi.msg}» tornano ai valori di prima. Anche questo ripristino finisce nello storico, quindi è a sua volta annullabile.` : ""}
      testoSi="Ripristina" onNo={() => setChiedi(null)} onSi={() => esegui(chiedi)} />
    </>
  );
}

function SchedaMagazzino({ m, stato, azione }) {
  const meta = TIPI_MAG[m.tipo];
  const sotto = sottoScorta(m);
  return (
    <Scheda className="p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl p-3 shrink-0" style={{ background: `${meta.colore}14`, color: meta.colore }}>
          <Boxes size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold truncate" style={{ color: T.ink }}>{m.nome}</div>
          <div className="text-xs" style={{ color: T.dim }}>{meta.nome}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Chip colore={T.dim}>{m.articoli.length} articoli</Chip>
        {sotto > 0
          ? <Chip colore={T.ambra}><AlertTriangle size={11} /> {sotto} sotto scorta</Chip>
          : <Chip colore={T.verde}><Check size={11} /> A livello</Chip>}
      </div>
      {azione && <div className="mt-3">{azione}</div>}
    </Scheda>
  );
}

/* Avvisi sotto-scorta: cosa rifornire OGGI (usa il previsto del giorno corrente,
   così sabato/domenica mostrano articoli diversi da lunedì-venerdì). */
function AvvisiScorta({ stato, vaiA }) {
  const oggi = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"][new Date().getDay()];
  const avvisi = stato.magazzini
    .map((m) => ({ m, sede: trova(stato.sedi, m.sedeId), arts: m.articoli.filter((a) => a.qty < parOggi(a)) }))
    .filter((x) => x.arts.length > 0)
    .sort((a, b) => b.arts.length - a.arts.length);
  const tot = avvisi.reduce((s, x) => s + x.arts.length, 0);
  return (
    <Scheda className="p-5 mb-4">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="rounded-2xl p-2.5 shrink-0" style={{ background: `${tot ? T.ambra : T.verde}14`, color: tot ? T.ambra : T.verde }}>
            {tot ? <AlertTriangle size={18} /> : <CheckCheck size={18} />}
          </div>
          <div>
            <div className="font-extrabold" style={{ color: T.ink }}>Da rifornire oggi</div>
            <div className="text-xs" style={{ color: T.dim }}>Livelli di {oggi} · {tot ? `${tot} articoli sotto scorta` : "tutto a livello"}</div>
          </div>
        </div>
        {tot > 0 && <Bottone variante="tonale" piccolo icona={Boxes} onClick={() => vaiA("magazzini")}>Vai ai magazzini</Bottone>}
      </div>
      {tot === 0
        ? <div className="text-sm" style={{ color: T.dim }}>Nessun magazzino sotto la scorta prevista per oggi. Bel lavoro.</div>
        : <div className="flex flex-col gap-2">
            {avvisi.map(({ m, sede, arts }) => (
              <button key={m.id} onClick={() => vaiA("magazzini")}
                className="w-full text-left rounded-2xl p-3 flex items-center gap-3"
                style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ color: T.ink }}>{m.nome}
                    <span className="font-normal" style={{ color: T.tenue }}> · {sede?.nome || "—"}</span></div>
                  <div className="text-xs truncate" style={{ color: T.dim }}>
                    {arts.slice(0, 4).map((a) => trova(stato.prodotti, a.prodottoId)?.nome || "?").join(" · ")}
                    {arts.length > 4 ? ` +${arts.length - 4}` : ""}
                  </div>
                </div>
                <Chip colore={T.ambra}>{arts.length}</Chip>
                <ChevronRight size={16} style={{ color: T.tenue }} />
              </button>
            ))}
          </div>}
    </Scheda>
  );
}

/* ─────────── GESTIONE ───────────
   Non è un cassetto dei rifiuti: è dove sta quello che non si tocca durante
   il servizio. Ogni riga dice cosa contiene, così non serve entrarci per
   ricordarselo. */
const SEZIONI_ALTRO = [
  { id: "catalogo", nome: "Catalogo", icona: Package, col: "#8A63F4",
    sotto: "Prodotti, unità, categorie, fornitori, prezzi e conversioni" },
  { id: "listino", nome: "Listino", icona: Tag, col: "#DB8A2E",
    sotto: "Le voci della Cassa: prezzi di vendita, varianti e cosa scalano dal magazzino" },
  { id: "analisi", nome: "Analisi", icona: BarChart3, col: "#3D7DEA",
    sotto: "Consumi, valore della merce, soglie consigliate dai dati veri" },
  { id: "storico", nome: "Storico", icona: History, col: "#D96AC0",
    sotto: "Tutto quello che è stato fatto, con il tasto per riportarlo com'era" },
  { id: "storico-ordini", nome: "Storico ordini", icona: Truck, col: "#2FA97C",
    sotto: "Gli ordini fatti e la merce arrivata, con il conto per fornitore" },
  { id: "sedi", nome: "Sedi", icona: Building2, col: "#22B8CF",
    sotto: "I punti vendita e il laboratorio che li rifornisce" },
  { id: "profili", nome: "Profili", icona: Users, col: "#E8A13C",
    sotto: "Chi entra nell'app, con quale ruolo e su quali magazzini" },
  { id: "accessi", nome: "Accessi", icona: KeyRound, col: "#D94A66",
    sotto: "Inviti, richieste di accesso in attesa, codici" },
  /* LA MEMORIA (gen-5.92). Chiesta da Valerio: «un'app che faccia da memoria
     per te e per ogni contesto che desidero mantenere per te, e devi essere in
     grado di poter interagire con questa app».
     Sta qui dentro e non altrove per tre ragioni pratiche: ce l'ha gia' sul
     telefono, e' gia' dietro il PIN, e parla gia' con lo stesso deposito da
     cui io leggo. Un'app nuova avrebbe voluto dire un altro indirizzo, un
     altro accesso e un altro posto in cui dimenticarsi le cose. */
  { id: "memoria", nome: "Memoria", icona: Sparkles, col: "#6C7899",
    sotto: "Quello che Claude deve ricordare fra una conversazione e l'altra" },
  { id: "sistema", nome: "Sistema", icona: Database, col: "#4F5D7C",
    sotto: "Backup, esportazioni, importazione del catalogo" },
];
function VistaAltro({ stato, vaiA, nAcc }) {
  return (
    <div>
      <Intesta titolo="Gestione" sotto="Quello che non si tocca durante il servizio: catalogo, analisi, storico, impostazioni" />
      <div className="flex flex-col gap-2">
        {SEZIONI_ALTRO.map((s) => (
          <button key={s.id} onClick={() => vaiA(s.id)}
            className="flex items-center gap-3 rounded-2xl px-3.5 py-3.5 text-left w-full"
            style={{ background: "#fff", border: `1.5px solid ${T.bordo}` }}>
            <span className="rounded-2xl p-2.5 shrink-0" style={{ background: `${s.col}18`, color: s.col }}>
              <s.icona size={18} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="font-extrabold block" style={{ color: T.ink }}>{s.nome}</span>
              <span className="text-xs block" style={{ color: T.dim }}>{s.sotto}</span>
            </span>
            {s.id === "accessi" && nAcc > 0 && <Chip colore={T.rosso}>{nAcc}</Chip>}
            <ChevronRight size={18} style={{ color: T.tenue }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────── CERCA OVUNQUE ───────────
   La domanda vera è «dov'è il guanciale e quanto ne ho», e finora si
   rispondeva entrando magazzino per magazzino. Sta nell'intestazione e non
   nella barra in basso per due motivi: la barra è gia' piena, e una ricerca
   la si vuole da dentro qualunque schermata senza perdere il posto.
   Mostra solo i magazzini che quel profilo puo' vedere: un operatore non
   scopre le giacenze di un'altra sede passando da qui. */
/* ═══════════ LA RICERCA TROVA ANCHE LE FUNZIONI ═══════════

   Da una frase esatta: «devo poter fare tutto senza dovermi ricordare in che
   parte dell'app ho quella determinata funzionalità che mi serve; un centro di
   comando si chiama tale quando controlla tutte le sue periferiche».

   Aveva ragione, e il conto lo dimostrava: mettere un prodotto in un magazzino
   si poteva fare in quattro modi, con quattro nomi diversi, in tre schermate.
   Chi cerca non poteva sapere quale.

   La risposta non e' spostare i tasti — e' avere UN POSTO SOLO che li trova
   tutti per nome, sempre lo stesso, raggiungibile da ogni schermata. Questa
   lente qui e' quel posto.

   Ogni voce porta delle PAROLE: come la cercherebbe una persona, non come si
   chiama nel menu. Chi ha in testa «devo togliere della roba» scrive «togli»,
   non «Sposta o rimuovi prodotti». Se una parola vi manca, aggiungetela: la
   lista e' fatta per crescere. */
const AZIONI = [
  { n: "Aggiungi più prodotti", d: "magazzini", ic: Boxes, k: "mag-aggiungi",
    c: "Magazzini → apri un magazzino → Gestione rapida",
    p: ["aggiungi", "prodotti", "inserire", "mettere", "nuovo", "blocco", "insieme"] },
  { n: "In quali magazzini sta un prodotto", d: "catalogo", ic: Boxes,
    c: "Catalogo → Prodotti → il tasto verde sulla riga",
    p: ["magazzini", "assegnare", "assegna", "dove sta", "dove", "orfano", "nessun magazzino"] },
  { n: "Sposta o rimuovi prodotti", d: "magazzini", ic: ArrowLeftRight, k: "mag-sposta",
    c: "Magazzini → apri un magazzino → Gestione rapida",
    p: ["sposta", "spostare", "rimuovi", "rimuovere", "togli", "togliere", "muovi", "leva"] },
  { n: "Trasferisci le scorte", d: "magazzini", ic: ArrowLeftRight, k: "mag-trasf",
    c: "Magazzini → apri un magazzino → Gestione rapida",
    p: ["trasferisci", "trasferire", "scorte", "quantita", "porta", "sposta quantita"] },
  { n: "Copia da un altro magazzino", d: "magazzini", ic: Copy, k: "mag-copia",
    c: "Magazzini → apri un magazzino → Gestione rapida",
    p: ["copia", "copiare", "duplicare", "stessa lista", "uguale"] },
  { n: "Soglie per giorno", d: "magazzini", ic: TrendingUp, k: "mag-soglie",
    c: "Magazzini → apri un magazzino → Gestione rapida",
    p: ["soglie", "soglia", "giorno", "feriale", "weekend", "sabato", "domenica"] },
  { n: "Livello previsto in blocco", d: "magazzini", ic: Ruler, k: "mag-par",
    c: "Magazzini → apri un magazzino → Gestione rapida",
    p: ["livello", "previsto", "par", "scorta", "blocco", "minimo"] },
  { n: "Ho prodotto (scala gli ingredienti)", d: "magazzini", ic: FlaskConical,
    c: "Magazzini → magazzino di laboratorio → tasto verde sulla riga",
    p: ["prodotto", "produzione", "preparato", "fatto", "ricetta", "ingredienti", "laboratorio"] },
  { n: "Le ricette: le dosi dei preparati", d: "catalogo", ic: FlaskConical,
    c: "Catalogo → Prodotti → Ricette",
    p: ["ricetta", "ricette", "dosi", "dose", "ingredienti", "quanto ci vuole"] },
  { n: "Modifica in blocco: categoria, fornitore, chi lo fa", d: "catalogo", ic: Pencil,
    c: "Catalogo → Prodotti → Modifica in blocco",
    p: ["blocco", "categoria", "fornitore", "unita", "chi lo fa", "preparato", "tanti insieme"] },
  { n: "Prezzi e conversioni dei prodotti", d: "catalogo", ic: Tag,
    c: "Catalogo → Prodotti → matita",
    p: ["prezzo", "prezzi", "costo", "conversione", "conversioni", "quanto costa"] },
  { n: "Report ordine da mandare al fornitore", d: "ordini", ic: Truck, serve: "ordini",
    c: "Ordini → Report ordine",
    p: ["report", "ordine", "ordinare", "fornitore", "whatsapp", "mandare", "inviare"] },
  { n: "Da mandare adesso (tutto, sede per sede)", d: "ordini", ic: Truck, serve: "ordini",
    c: "Ordini → la scheda verde in cima",
    p: ["mandare", "inviare", "whatsapp", "spedire", "adesso", "messaggio"] },
  { n: "Registrare la merce arrivata", d: "ordini", ic: PackageCheck,
    c: "Ordini → scheda «Ordinati» → Tutto arrivato",
    p: ["arrivata", "arrivato", "ricevere", "ricevuto", "consegna", "carico", "bolla"] },
  { n: "Contare quello che c'è", d: "conteggi", ic: ClipboardList,
    c: "Conteggi",
    p: ["contare", "conta", "conteggio", "inventario", "verifica", "quanto c'e"] },
  { n: "Battere una vendita", d: "cassa", ic: Store,
    c: "Cassa",
    p: ["cassa", "vendita", "vendere", "battere", "scontrino", "incasso", "incassare", "cliente", "pos"] },
  { n: "Listino di cassa: prezzi di vendita", d: "listino", ic: Tag,
    c: "Gestione → Listino",
    p: ["listino", "prezzo di vendita", "prezzi", "vendita", "varianti", "iva", "aliquota"] },
  { n: "Copertura, consumi e valore della merce", d: "analisi", ic: TrendingUp,
    c: "Gestione → Analisi",
    p: ["analisi", "copertura", "consumi", "valore", "soldi", "quanto vale", "numeri"] },
  { n: "Soglie consigliate dai consumi veri", d: "analisi", ic: Gauge,
    c: "Gestione → Analisi",
    p: ["soglie consigliate", "previsione", "fabbisogni", "consigli", "proposta"] },
  { n: "Sprechi e scarti", d: "analisi", ic: PackageMinus,
    c: "Gestione → Analisi",
    p: ["spreco", "sprechi", "scarto", "scarti", "buttato", "perso"] },
  { n: "Chi ha fatto cosa, e riportare indietro", d: "storico", ic: History,
    c: "Gestione → Storico",
    p: ["storico", "chi", "quando", "ripristina", "annulla", "torna indietro", "log"] },
  { n: "Ordini fatti e conto per fornitore", d: "storico-ordini", ic: Truck,
    c: "Gestione → Storico ordini",
    p: ["storico ordini", "ordini vecchi", "conto", "quanto ho speso", "fornitore"] },
  { n: "Sedi e quale laboratorio le rifornisce", d: "sedi", ic: Building2,
    c: "Gestione → Sedi",
    p: ["sede", "sedi", "laboratorio", "collegare", "rifornisce", "pizzeria"] },
  { n: "Persone, ruoli e PIN", d: "profili", ic: Users,
    c: "Gestione → Profili",
    p: ["pin", "persone", "ruolo", "profilo", "profili", "chi entra", "password"] },
  { n: "Inviti e richieste di accesso", d: "accessi", ic: KeyRound,
    c: "Gestione → Accessi",
    p: ["invito", "inviti", "codice", "accesso", "far entrare", "nuovo utente"] },
  { n: "Backup, esportazioni e ripristino", d: "sistema", ic: Database,
    c: "Gestione → Sistema",
    p: ["backup", "esporta", "esportazione", "csv", "excel", "ripristino", "salvataggio", "importa"] },
  { n: "La rete a colpo d'occhio", d: "plancia", ic: Gamepad2,
    c: "Plancia",
    p: ["plancia", "mappa", "rete", "colpo d'occhio", "collegamenti", "schema"] },
];

/* ── UNA VOCE SOLA, DUE POSTI ──
   Il menù «Gestione rapida» non riscrive i nomi delle sue voci: li prende da
   qui, dalla stessa tabella che risponde alla lente. Così quello che si legge
   cercando è, parola per parola, quello che si legge nel menù — e non si può
   scollare fra una versione e l'altra, perché il testo è scritto una volta
   sola. Se un nome cambia, cambia in tutti e due i posti insieme. */
const nomeAzione = (k) => (AZIONI.find((a) => a.k === k) || {}).n || "";

/* Trova le funzioni che c'entrano con quello che è stato scritto. Cerca sia nel
   nome sia nelle parole, e senza accenti: chi scrive di fretta scrive «unita»,
   non «unità», e non deve essere punito per questo. */
const senzaAccenti = (s) => (s || "").toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function azioniTrovate(profilo, q) {
  const t = senzaAccenti(q).trim();
  if (t.length < 2) return [];
  /* un operatore non deve trovare porte che poi non può aprire */
  const suo = (a) => {
    if (profilo.ruolo === "admin") return true;
    if (["catalogo", "analisi", "storico", "storico-ordini", "sedi", "profili", "accessi", "sistema", "listino"].includes(a.d)) return false;
    if (a.d === "conteggi") return profilo.ruolo === "operatore";  /* il lab da qui finiva in una schermata vuota */
    if (a.d === "plancia") return puoCorreggere(profilo);
    /* senza questa riga il ripiego finale mostrerebbe la porta della Cassa
       anche a chi non puo' aprirla (gen-5.96) */
    if (a.d === "cassa") return puoCassa(profilo);
    if (a.serve === "ordini") return puoOrdinare(profilo);
    return true;
  };
  return AZIONI.filter(suo).filter((a) =>
    senzaAccenti(a.n).includes(t) || a.p.some((x) => senzaAccenti(x).includes(t) || t.includes(senzaAccenti(x))));
}

function righeRicerca(stato, profilo, q) {
  const testo = (q || "").trim().toLowerCase();
  if (testo.length < 2) return [];
  const mags = magazziniVisti(stato, profilo);
  const out = [];
  for (const p of stato.prodotti) {
    if (!(p.nome || "").toLowerCase().includes(testo)) continue;
    const dove = [];
    let totBase = 0, tuttoConvertibile = true;
    for (const m of mags) {
      const a = (m.articoli || []).find((x) => x.prodottoId === p.id);
      if (!a) continue;
      const q2 = a.uomId === p.uomBase ? a.qty : converti(p, a.qty, a.uomId, p.uomBase);
      if (q2 == null) tuttoConvertibile = false; else totBase += q2;
      dove.push({ mag: m, art: a, sede: trova(stato.sedi, m.sedeId),
        sym: simboloU(stato, a.uomId), sotto: a.qty < parOggi(a),
        stimata: convStimata(p, a.uomId) });
    }
    dove.sort((x, y) => (x.sede?.nome || "").localeCompare(y.sede?.nome || "")
      || x.mag.nome.localeCompare(y.mag.nome));
    out.push({ prod: p, dove, totBase, tuttoConvertibile,
      cat: trova(stato.categorie, p.categoriaId), forn: trova(stato.fornitori, p.fornitoreId) });
  }
  return out.sort((a, b) => (b.dove.length - a.dove.length)
    || (a.prod.nome || "").localeCompare(b.prod.nome || ""));
}

function RicercaGlobale({ stato, profilo, onChiudi, vaiA }) {
  const [q, setQ] = useState("");
  const rif = useRef(null);
  useEffect(() => { const t = setTimeout(() => rif.current?.focus(), 120); return () => clearTimeout(t); }, []);
  const righe = righeRicerca(stato, profilo, q);
  const azioni = azioniTrovate(profilo, q);
  const corto = q.trim().length > 0 && q.trim().length < 2;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-3"
        style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
        <Search size={18} style={{ color: T.tenue }} />
        <input ref={rif} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Un prodotto o una cosa da fare: guanciale, sposta, ordine…"
          aria-label="Cerca un prodotto o una funzione"
          className="flex-1 min-w-0 bg-transparent outline-none text-base font-semibold"
          style={{ color: T.ink }} />
        {q && <button onClick={() => setQ("")} aria-label="Pulisci la ricerca"
          className="rounded-full p-2" style={{ background: "#EAF0FE", color: T.blu }}><X size={14} /></button>}
      </div>

      {!q.trim() && (
        <p className="text-sm" style={{ color: T.dim }}>
          Cerca <b style={{ color: T.ink }}>due cose insieme</b>. Un <b style={{ color: T.ink }}>prodotto</b>:
          ti dice in quali magazzini sta, quanto ce n'è e se è sotto il livello previsto.
          Oppure <b style={{ color: T.ink }}>una cosa da fare</b>: scrivi «sposta», «ordine»,
          «soglie», «backup» e ti ci porta — senza doverti ricordare in che sezione sta.
        </p>
      )}
      {corto && <p className="text-sm" style={{ color: T.tenue }}>Scrivi almeno due lettere.</p>}

      {/* LE FUNZIONI PRIMA DEI PRODOTTI.
          Stanno in cima e non in fondo perche' chi scrive «sposta» sta cercando
          un comando, non un prodotto che si chiama cosi'. Ogni riga dice anche
          la strada per esteso: chi vuole impararla la impara, chi ha fretta
          tocca e ci arriva. */}
      {azioni.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: T.tenue }}>
            {azioni.length === 1 ? "1 funzione" : `${azioni.length} funzioni`}
          </span>
          {azioni.slice(0, 6).map((a) => (
            <button key={a.n} type="button" onClick={() => { onChiudi(); vaiA(a.d); }}
              className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left"
              style={{ background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
              <span className="rounded-xl p-2.5 shrink-0" style={{ background: "#EAF0FE", color: T.blu }}>
                <a.ic size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="font-extrabold block" style={{ color: T.ink }}>{a.n}</span>
                <span className="text-xs block" style={{ color: T.dim }}>{a.c}</span>
              </span>
              <ChevronRight size={18} style={{ color: T.tenue }} />
            </button>
          ))}
        </div>
      )}

      {q.trim().length >= 2 && righe.length === 0 && azioni.length === 0 && (
        <Vuoto icona={Search} titolo="Non trovo né un prodotto né una funzione"
          testo="Prova con un pezzo del nome, o con la parola che useresti tu: «sposta», «ordine», «soglie», «backup»." />
      )}
      {q.trim().length >= 2 && righe.length === 0 && azioni.length > 0 && (
        <p className="text-sm" style={{ color: T.tenue }}>Nessun prodotto con questo nome.</p>
      )}

      <div className="flex flex-col gap-2.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "62vh" }}>
        {righe.map(({ prod, dove, totBase, tuttoConvertibile, cat, forn }) => (
          <div key={prod.id} className="rounded-2xl p-3.5" style={{ background: "#fff", border: `1.5px solid ${T.bordo}` }}>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-extrabold" style={{ color: T.ink }}>{prod.nome}</span>
              {cat && <Chip colore={cat.colore}>{cat.nome}</Chip>}
            </div>
            <div className="text-xs mt-0.5" style={{ color: T.dim }}>
              {/* la ricerca e' l'ultima finestra che diceva ancora il fornitore
                  di un preparato: se qui restasse «Fornitore: Verdure» mentre
                  il Catalogo dice «Preparato in laboratorio», due schermate
                  della stessa app racconterebbero due cose diverse */}
              {preparato(prod) ? "Preparato in laboratorio"
                : forn ? `Fornitore: ${forn.nome}` : "Nessun fornitore indicato"}
              {" · "}
              {dove.length === 0 ? "in nessun magazzino"
                : tuttoConvertibile
                  ? `in tutto ${fmtQ(totBase)} ${simboloU(stato, prod.uomBase)}`
                  : "totale non calcolabile: manca una conversione"}
            </div>

            {dove.length === 0 ? (
              <p className="text-xs mt-2 rounded-xl px-3 py-2" style={{ background: "#FFF6E8", color: "#7A4A00" }}>
                È a catalogo ma non sta in nessun magazzino che puoi vedere.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 mt-2.5">
                {dove.map(({ mag, art, sede, sym, sotto, stimata }) => (
                  <button key={mag.id} onClick={() => { onChiudi(); vaiA("magazzini"); }}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left"
                    style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-bold block truncate" style={{ color: T.ink }}>{mag.nome}</span>
                      {/* questa va a capo invece di troncarsi: è la riga che
                          dice «conversione stimata», e mozzarla a «conve…»
                          nasconde proprio l'avvertenza */}
                      <span className="text-xs block leading-snug" style={{ color: T.tenue }}>
                        {sede?.nome || "—"} · previsto {fmtQ(parOggi(art))} {sym}
                        {stimata && " · conversione stimata"}
                      </span>
                    </span>
                    <Chip colore={sotto ? T.ambra : T.verde}>{fmtQ(art.qty)} {sym}</Chip>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeVista({ stato, profilo, vaiA, muta, mostraToast }) {
  const saluto = (() => {
    const h = new Date().getHours();
    return h < 13 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  })();

  if (profilo.ruolo === "admin") {
    const sottoTot = stato.magazzini.reduce((s, m) => s + sottoScorta(m), 0);
    return (
      <div>
        <Intesta titolo={`${saluto}, ${profilo.nome}`} sotto="Panoramica della rete e delle anagrafiche" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard icona={Building2} colore={T.blu} label="Sedi in rete" valore={stato.sedi.length} />
          <StatCard icona={Package} colore={T.viola} label="Prodotti a catalogo" valore={stato.prodotti.length} />
          <StatCard icona={Users} colore={T.ciano} label="Profili attivi" valore={stato.profili.length} />
          <StatCard icona={AlertTriangle} colore={sottoTot ? T.ambra : T.verde} label="Articoli sotto scorta" valore={sottoTot} />
        </div>
        <AvvisiScorta stato={stato} vaiA={vaiA} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Scheda className="p-5">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <span className="font-extrabold" style={{ color: T.ink }}>Attività recente</span>
              <button onClick={() => vaiA("storico")}
                className="text-xs font-extrabold rounded-full px-3 py-2 shrink-0"
                style={{ background: "#EAF0FE", color: T.blu }}>
                vedi tutto
              </button>
            </div>
            <LogLista log={stato.log} stato={stato} muta={muta} profilo={profilo} mostraToast={mostraToast} />
          </Scheda>
          <Scheda className="p-5">
            <div className="font-extrabold mb-2" style={{ color: T.ink }}>Come funziona la rete</div>
            <ol className="flex flex-col gap-2.5 text-sm" style={{ color: T.dim }}>
              {[
                ["1", "L'operatore conta i magazzini linea assegnati e inserisce ciò che vede rispetto al livello previsto."],
                ["2", "Linea → Laboratorio: la differenza è convertita in unità di lavorazione e diventa una richiesta per il laboratorio."],
                ["3", "Linea → Retro: la differenza è scalata subito dal retro della sede, con conversione automatica."],
                ["4", "I magazzini di riferimento sotto scorta generano report ordine nell'unità di misura di ciascun fornitore."],
              ].map(([n, t]) => (
                <li key={n} className="flex gap-2.5">
                  <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white"
                    style={{ background: T.grad }}>{n}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Chip colore={T.verde}><ShieldCheck size={11} /> Versione ufficiale 1.0 · accesso su invito</Chip>
              <Chip colore={T.blu}><Cloud size={11} /> Sync resiliente · invio garantito</Chip>
            </div>
          </Scheda>
        </div>
      </div>
    );
  }

  if (profilo.ruolo === "operatore") {
    const linee = stato.magazzini.filter((m) => profilo.magazziniIds?.includes(m.id));
    const retro = stato.magazzini.filter((m) => m.sedeId === profilo.sedeId && m.tipo === "retro");
    const miei = [...linee, ...retro];
    const sede = trova(stato.sedi, profilo.sedeId);
    return (
      <div>
        <Intesta titolo={`${saluto}, ${profilo.nome}`}
          sotto={`Sede ${sede?.nome || "—"} · ${linee.length} linee assegnate · ${retro.length} retro`}
          azione={<Bottone icona={ClipboardList} onClick={() => vaiA("conteggi")}>Inizia conteggio</Bottone>} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {miei.length === 0
            ? <Scheda className="md:col-span-2"><Vuoto icona={Boxes} titolo="Nessun magazzino assegnato"
                testo="Chiedi a un Admin di assegnarti i magazzini linea dalla sezione Profili." /></Scheda>
            : miei.map((m) => <SchedaMagazzino key={m.id} m={m} stato={stato}
                azione={<Bottone variante="tonale" piccolo icona={Boxes}
                  onClick={() => vaiA("magazzini", { magId: m.id })}>Apri questo magazzino</Bottone>} />)}
        </div>
        {/* il registro compare solo a chi puo' CORREGGERE (e' anche la via del
            ripristino), e mostra i magazzini SUOI: prima era il log grezzo di
            tutta l'azienda, e Marco leggeva i conteggi di un'altra sede.
            Niente piu' porta sullo storico aziendale (gen-5.95). */}
        {puoCorreggere(profilo) && (() => {
          const idsMiei = new Set(magazziniVisti(stato, profilo).map((m) => m.id));
          const logMiei = (stato.log || []).filter((e) => (e.cambi || []).some((c) => idsMiei.has(c.k.split("|")[0])));
          return (
            <Scheda className="p-5">
              <div className="font-extrabold mb-2" style={{ color: T.ink }}>Attività recente</div>
              <LogLista log={logMiei} n={5} stato={stato} muta={muta} profilo={profilo} mostraToast={mostraToast} />
            </Scheda>
          );
        })()}
      </div>
    );
  }

  /* laboratorio */
  const sede = trova(stato.sedi, profilo.sedeId);
  const magLab = stato.magazzini.filter((m) => m.sedeId === profilo.sedeId);
  const servite = stato.sedi.filter((s) => s.labSedeId === profilo.sedeId);
  const inAttesa = stato.richieste.filter((r) => r.aSedeLabId === profilo.sedeId && r.stato === "in-attesa").length;
  return (
    <div>
      <Intesta titolo={`${saluto}, ${profilo.nome}`}
        sotto={`${sede?.nome || "Laboratorio"} · rifornisce ${servite.length} sedi operatore`}
        azione={<Bottone icona={FlaskConical} onClick={() => vaiA("richieste")}>Apri richieste</Bottone>} />
      {/* le tre statistiche che stavano qui dicevano cose gia' scritte
          altrove: le richieste in attesa sono il badge della barra, il
          numero dei magazzini non cambia mai, il sotto-scorta sta sui Chip
          delle schede qui sotto. Via (gen-5.95): un numero ripetuto e' una
          riga da leggere in piu', non un'informazione in piu'. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {magLab.map((m) => <SchedaMagazzino key={m.id} m={m} stato={stato}
          azione={<Bottone variante="tonale" piccolo icona={Boxes}
            onClick={() => vaiA("magazzini", { magId: m.id })}>Apri questo magazzino</Bottone>} />)}
      </div>
      {puoCorreggere(profilo) && (() => {
        const idsMiei = new Set(magazziniVisti(stato, profilo).map((m) => m.id));
        const logMiei = (stato.log || []).filter((e) => (e.cambi || []).some((c) => idsMiei.has(c.k.split("|")[0])));
        return (
          <Scheda className="p-5">
            <div className="font-extrabold mb-2" style={{ color: T.ink }}>Attività recente</div>
            <LogLista log={logMiei} n={5} stato={stato} muta={muta} profilo={profilo} mostraToast={mostraToast} />
          </Scheda>
        );
      })()}
    </div>
  );
}

/* ─────────── ADMIN · CATALOGO (unità · categorie · fornitori) ─────────── */
const unitaUsata = (s, id) =>
  s.prodotti.some((p) => p.uomBase === id || p.uomLavorazione === id || p.uomFornitore === id ||
    p.uomFornitoreDiretto === id || Object.keys(p.conv || {}).includes(id)) ||
  s.magazzini.some((m) => m.articoli.some((a) => a.uomId === id));
const categoriaUsata = (s, id) => s.prodotti.some((p) => p.categoriaId === id);
/* ─────────── QUANTO È USATA UNA VOCE DELL'ANAGRAFICA ───────────
   Il NUMERO, non i nomi. Da questa schermata serve sapere se una voce si può
   toccare, non chi verrebbe toccato: l'elenco di chi la usa è roba della
   scheda Prodotti. «In uso nella rete» diceva solo sì o no, e con centodue
   prodotti sì-o-no non aiuta a decidere niente. */
function usiUnita(s, id) {
  const prodotti = s.prodotti.filter((p) => p.uomBase === id || p.uomLavorazione === id ||
    p.uomFornitore === id || p.uomFornitoreDiretto === id || Object.keys(p.conv || {}).includes(id)).length;
  const caselle = (s.magazzini || []).reduce((n, m) =>
    n + (m.articoli || []).filter((a) => a.uomId === id).length, 0);
  return { prodotti, caselle, tot: prodotti + caselle };
}
const usiCategoria = (s, id) => s.prodotti.filter((p) => p.categoriaId === id).length;
/* Un fornitore può essere usato anche solo come eccezione di sede: contando
   soltanto fornitoreId, un fornitore vivo su una sola sede risultava «non
   utilizzato» — e da lì a cancellarlo il passo è corto. */
const usiFornitore = (s, id) => s.prodotti.filter((p) => p.fornitoreId === id
  || Object.values(p.fornSede || {}).includes(id)).length;
const quanti = (n, uno, tanti) => `${n} ${n === 1 ? uno : tanti}`;
/* i pezzi che valgono zero si saltano: «0 caselle» è rumore, non un'informazione */
const usiTesto = (u, lungo) => [
  u.prodotti && quanti(u.prodotti, "prodotto", "prodotti"),
  u.caselle && quanti(u.caselle, lungo ? "casella di magazzino" : "casella",
    lungo ? "caselle di magazzino" : "caselle"),
].filter(Boolean).join(" · ");
/* ─────────── CHI FORNISCE COSA, DOVE ───────────
   fornitoreId resta il fornitore abituale del prodotto. fornSede tiene solo
   le eccezioni: {sedeId: fornitoreId}. Tenerlo così, invece di spostare
   tutto in una tabella nuova, vuol dire che i prodotti di oggi continuano a
   funzionare senza toccarli, e che una sede senza eccezioni non pesa niente. */
const fornitoreDi = (prod, sedeId) => (prod?.fornSede?.[sedeId]) || prod?.fornitoreId || null;
/* le eccezioni vere: una sede che punta allo stesso fornitore abituale non è
   un'eccezione, è rumore, e non va né mostrata né salvata */
function eccezioniForn(stato, prod) {
  return Object.entries(prod?.fornSede || {})
    .filter(([sid, fid]) => fid && fid !== prod.fornitoreId
      && trova(stato.sedi, sid) && trova(stato.fornitori, fid))
    .map(([sid, fid]) => ({ sede: trova(stato.sedi, sid), forn: trova(stato.fornitori, fid) }))
    .sort((a, b) => a.sede.nome.localeCompare(b.sede.nome));
}
/* Un fornitore usato SOLO come eccezione in una sede era invisibile a questo
   controllo: si sarebbe potuto cancellare lasciando righe d'ordine orfane. */
const fornitoreUsato = (s, id) => s.prodotti.some((p) => p.fornitoreId === id
  || Object.values(p.fornSede || {}).includes(id));

/* «perEsteso»: in questa riga il nome e la riga sotto possono andare a capo
   una volta invece di essere tagliati coi tre puntini. Si accende dove quel
   testo e' la cosa per cui si e' aperta la schermata — il Catalogo dei
   prodotti — e resta spento altrove, dove i nomi sono corti e una riga sola
   tiene l'elenco fitto e veloce da scorrere. Due righe e non infinite: una
   riga lunghissima farebbe ballare l'altezza delle schede e si perderebbe il
   ritmo dell'elenco. */
const dueRighe = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" };
function Riga({ icona: I, colore = T.blu, titolo, sotto, perEsteso, extra, onDove, onMod, onDel }) {
  return (
    <Scheda className="p-3.5 flex items-center gap-3">
      <div className="rounded-2xl p-2.5 shrink-0" style={{ background: `${colore}14`, color: colore }}><I size={18} /></div>
      <div className="flex-1 min-w-0">
        <div className={perEsteso ? "font-extrabold leading-tight" : "font-extrabold truncate"}
          style={perEsteso ? { color: T.ink, ...dueRighe } : { color: T.ink }}>{titolo}</div>
        {sotto && <div className={perEsteso ? "text-xs leading-snug mt-0.5" : "text-xs truncate"}
          style={perEsteso ? { color: T.dim, ...dueRighe } : { color: T.dim }}>{sotto}</div>}
      </div>
      {extra}
      {/* «Dove sta» viene PRIMA di modifica ed elimina, ed è voluto: è la cosa
          che si fa più spesso subito dopo aver creato un prodotto, ed è quella
          che oggi costringeva a uscire dal Catalogo e andarla a cercare nei
          Magazzini. Le azioni di un oggetto stanno sull'oggetto. */}
      {onDove && <button onClick={onDove} aria-label={`Magazzini di ${titolo}`} className="rounded-full p-2.5"
        style={{ background: "#EAF7F1", color: T.verde }}><Boxes size={15} /></button>}
      {onMod && <button onClick={onMod} aria-label={`Modifica ${titolo}`} className="rounded-full p-2.5"
        style={{ background: "#EAF0FE", color: T.blu }}><Pencil size={15} /></button>}
      {onDel && <button onClick={onDel} aria-label={`Elimina ${titolo}`} className="rounded-full p-2.5"
        style={{ background: "#FCE9EE", color: T.rosso }}><Trash2 size={15} /></button>}
    </Scheda>
  );
}

function SceltaColore({ valore, onCambia }) {
  return (
    <div>
      <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Colore</span>
      <div className="flex gap-2 flex-wrap">
        {PALETTE.map((c) => (
          <button key={c} onClick={() => onCambia(c)} aria-label={`Colore ${c}`}
            className="rounded-full flex items-center justify-center"
            style={{ width: 38, height: 38, background: c, border: valore === c ? "3px solid #fff" : "3px solid transparent", boxShadow: valore === c ? `0 0 0 2.5px ${c}` : "none" }}>
            {valore === c && <Check size={16} color="#fff" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function PieDiPagina({ onChiudi, onSalva, testo = "Salva" }) {
  return (
    <div className="flex gap-2 justify-end mt-5">
      <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
      <Bottone icona={Check} onClick={onSalva}>{testo}</Bottone>
    </div>
  );
}

/* ─────────── ANAGRAFICHE · SI RINOMINA, NON SI RIFÀ ───────────
   Una voce già in uso da centinaia di caselle non è più una riga di elenco: è
   un pezzo di impianto. Rinominarla è innocuo — il collegamento è l'id, non
   il nome — mentre cambiarle il simbolo o spostarle sotto i piedi ai prodotti
   riscrive quello che è già stato battuto a mano. Quindi: quando è in uso, da
   qui si cambia SOLO il nome, e il resto dice perché è bloccato invece di
   sembrare rotto. Chi deve spostare davvero dei prodotti lo fa da Prodotti →
   «Modifica in blocco», dove si vede riga per riga cosa si sta toccando. */
function BloccoInUso({ testo }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl px-3.5 py-3"
      style={{ background: "#FFF6E8", border: "1px solid #F2DCC0" }}>
      <Lock size={15} style={{ color: "#7A4A00" }} className="mt-0.5 shrink-0" />
      <span className="text-xs leading-relaxed" style={{ color: "#7A4A00" }}>{testo}</span>
    </div>
  );
}
function FormUnita({ stato, item, muta, mostraToast, onChiudi }) {
  const [nome, setNome] = useState(item?.nome || "");
  const [simbolo, setSimbolo] = useState(item?.simbolo || "");
  const usi = item && stato ? usiUnita(stato, item.id) : { tot: 0, prodotti: 0, caselle: 0 };
  const bloccato = usi.tot > 0;
  const salva = () => {
    if (!nome.trim()) return mostraToast("Inserisci il nome dell'unità", "errore");
    if (!bloccato && !simbolo.trim()) return mostraToast("Compila nome e simbolo", "errore");
    muta((s) => {
      if (item) {
        const u = trova(s.unita, item.id);
        u.nome = nome.trim();
        /* il simbolo si tocca solo se non lo sta usando nessuno: cambiarlo
           mentre è in uso vorrebbe dire mentire su quantità già scritte */
        if (!bloccato) u.simbolo = simbolo.trim();
      } else s.unita.push({ id: uid("u"), nome: nome.trim(), simbolo: simbolo.trim() });
    }, `Unità «${(bloccato ? item.simbolo : simbolo.trim())}» ${item ? "rinominata" : "creata"}`);
    onChiudi();
  };
  return (<div className="flex flex-col gap-4">
    <Campo label="Nome" valore={nome} onCambia={setNome} placeholder="Es. Chilogrammo" autoFocus />
    {bloccato ? (
      <>
        <div>
          <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Simbolo</span>
          <div className="rounded-2xl px-3.5 py-3 text-sm font-extrabold"
            style={{ background: "#F0F3FB", color: T.dim, border: `1.5px solid ${T.bordo}` }}>{item.simbolo}</div>
        </div>
        <BloccoInUso testo={`Questa unità è in uso su ${usiTesto(usi, true)}: il simbolo compare accanto a quantità già scritte, e cambiarlo le farebbe dire un'altra cosa. Il nome invece si può cambiare quando vuoi.`} />
      </>
    ) : (
      <Campo label="Simbolo" valore={simbolo} onCambia={setSimbolo} placeholder="Es. kg" maxLength={10}
        suggerimento="Comparirà accanto alle quantità in tutta l'app." />
    )}
    <PieDiPagina onChiudi={onChiudi} onSalva={salva} />
  </div>);
}

function FormCategoria({ stato, item, muta, mostraToast, onChiudi }) {
  const [nome, setNome] = useState(item?.nome || "");
  const [colore, setColore] = useState(item?.colore || PALETTE[0]);
  const usi = item && stato ? usiCategoria(stato, item.id) : 0;
  const salva = () => {
    if (!nome.trim()) return mostraToast("Inserisci il nome della categoria", "errore");
    muta((s) => {
      if (item) { const c = trova(s.categorie, item.id); c.nome = nome.trim(); if (!usi) c.colore = colore; }
      else s.categorie.push({ id: uid("cat"), nome: nome.trim(), colore });
    }, `Categoria «${nome.trim()}» ${item ? "rinominata" : "creata"}`);
    onChiudi();
  };
  return (<div className="flex flex-col gap-4">
    <Campo label="Nome" valore={nome} onCambia={setNome} placeholder="Es. Freschi" autoFocus />
    {usi > 0 ? (
      <>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold" style={{ color: T.ink }}>Colore</span>
          <span className="rounded-full" style={{ width: 26, height: 26, background: item.colore || PALETTE[0] }} />
        </div>
        <BloccoInUso testo={`Questa categoria è in uso su ${quanti(usi, "prodotto", "prodotti")}: il colore è come li riconosci a colpo d'occhio nei conteggi e nei magazzini, e cambiarlo di qui li cambierebbe tutti insieme. Da questa schermata si cambia solo il nome.`} />
      </>
    ) : <SceltaColore valore={colore} onCambia={setColore} />}
    <PieDiPagina onChiudi={onChiudi} onSalva={salva} />
  </div>);
}

function FormFornitore({ stato, item, muta, mostraToast, onChiudi }) {
  const [nome, setNome] = useState(item?.nome || "");
  const usi = item && stato ? usiFornitore(stato, item.id) : 0;
  const salva = () => {
    if (!nome.trim()) return mostraToast("Inserisci il nome del fornitore", "errore");
    muta((s) => {
      if (item) trova(s.fornitori, item.id).nome = nome.trim();
      else s.fornitori.push({ id: uid("for"), nome: nome.trim() });
    }, `Fornitore «${nome.trim()}» ${item ? "rinominato" : "creato"}`);
    onChiudi();
  };
  return (<div className="flex flex-col gap-4">
    <Campo label="Ragione sociale" valore={nome} onCambia={setNome} placeholder="Es. AgriFresh S.r.l." autoFocus />
    {usi > 0 && <BloccoInUso testo={`Questo fornitore è in uso su ${quanti(usi, "prodotto", "prodotti")}. Rinominarlo non tocca niente: i prodotti restano collegati. Per cambiare CHI fornisce un prodotto si passa da Prodotti.`} />}
    <PieDiPagina onChiudi={onChiudi} onSalva={salva} />
  </div>);
}

function EliminaGuidata({ stato, tipo, item, muta, mostraToast, onChiudi }) {

  /* ── PRODOTTO · cascata completa in un passaggio ── */
  if (tipo === "prodotti") {
    const refs = riferimentiProdotto(stato, item.id);
    const nRif = refs.magazzini.length + refs.richieste.length + refs.ordini.length;
    if (!nRif) return (
      <div className="flex flex-col gap-4">
        <p className="text-sm" style={{ color: T.dim }}>Nessun riferimento in rete: il prodotto sarà rimosso dal catalogo per tutti gli utenti.</p>
        <div className="flex gap-2 justify-end">
          <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
          <Bottone variante="pericolo" icona={Trash2} onClick={() => {
            muta((s) => { s.prodotti = s.prodotti.filter((x) => x.id !== item.id); }, `Prodotto «${item.nome}» eliminato`);
            onChiudi();
          }}>Elimina</Bottone>
        </div>
      </div>
    );
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm" style={{ color: T.dim }}>
          «{item.nome}» è ancora collegato alla rete. Con l'eliminazione in cascata, in un solo passaggio:
        </p>
        <div className="flex flex-col gap-1.5 text-sm" style={{ color: T.ink }}>
          {refs.magazzini.length > 0 && <div>· esce da <b>{refs.magazzini.length}</b> magazzin{refs.magazzini.length === 1 ? "o" : "i"} ({refs.magazzini.map((m) => m.nome).join(", ")})</div>}
          {refs.richieste.length > 0 && <div>· vengono rimosse <b>{refs.richieste.length}</b> richieste collegate</div>}
          {refs.ordini.length > 0 && <div>· vengono rimosse <b>{refs.ordini.length}</b> righe ordine</div>}
          <div>· lo storico movimenti del prodotto viene ripulito</div>
        </div>
        <p className="text-xs" style={{ color: T.ambra }}>
          Vale per tutta la rete e non è reversibile: se hai dubbi, crea prima un punto di ripristino da Sistema.
        </p>
        <div className="flex gap-2 justify-end">
          <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
          <Bottone variante="pericolo" icona={Trash2} onClick={() => {
            muta((s) => eliminaProdottoCascata(s, item.id),
              `Prodotto «${item.nome}» eliminato in cascata (magazzini, richieste e ordini ripuliti)`);
            mostraToast("Prodotto eliminato con tutti i riferimenti");
            onChiudi();
          }}>Elimina in cascata</Bottone>
        </div>
      </div>
    );
  }

  /* ── CATEGORIA / FORNITORE · sposta i prodotti ed elimina insieme ── */
  if (tipo === "categorie" || tipo === "fornitori") {
    const campo = tipo === "categorie" ? "categoriaId" : "fornitoreId";
    /* Un fornitore puo' essere usato anche solo come eccezione di sede. Se qui
       si guardasse soltanto fornitoreId, un fornitore usato in una sola sede
       risulterebbe «non collegato», verrebbe cancellato senza avvisi, e le
       eccezioni resterebbero a puntare a un fornitore che non esiste piu':
       le righe d'ordine di quella sede finirebbero senza destinatario. */
    const perEccezione = (p) => tipo === "fornitori"
      && Object.values(p.fornSede || {}).includes(item.id);
    const usati = stato.prodotti.filter((p) => p[campo] === item.id || perEccezione(p));
    const nomeTipo = tipo === "categorie" ? "Categoria" : "Fornitore";
    if (!usati.length) return (
      <div className="flex flex-col gap-4">
        <p className="text-sm" style={{ color: T.dim }}>Nessun prodotto collegato: l'elemento sarà rimosso per tutta la rete.</p>
        <div className="flex gap-2 justify-end">
          <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
          <Bottone variante="pericolo" icona={Trash2} onClick={() => {
            muta((s) => { s[tipo] = s[tipo].filter((x) => x.id !== item.id); }, `${nomeTipo} «${item.nome}» eliminato`);
            onChiudi();
          }}>Elimina</Bottone>
        </div>
      </div>
    );
    /* Prima di qui c'era «Sposta ed elimina»: un menù a tendina, un tocco, e
       quarantacinque prodotti cambiavano fornitore senza che si vedesse quali.
       È la cosa più distruttiva dell'app fatta nel posto meno adatto — un
       elenco di anagrafiche, dove uno entra per correggere un nome. Ora questa
       schermata non sposta più niente: dice quanti sono e dove si spostano
       davvero, cioè da Prodotti → «Modifica in blocco», che li mostra uno per
       uno mentre li tocchi. */
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2.5 rounded-2xl px-3.5 py-3"
          style={{ background: "#FFF6E8", border: "1px solid #F2DCC0" }}>
          <Lock size={15} style={{ color: "#7A4A00" }} className="mt-0.5 shrink-0" />
          <span className="text-sm leading-relaxed" style={{ color: "#7A4A00" }}>
            <b>{usati.length}</b> prodott{usati.length === 1 ? "o usa" : "i usano"} «{item.nome}»,
            quindi non si può togliere: resterebbero senza.
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: T.dim }}>
          Da qui si cambia solo il nome. Per spostare quei prodotti
          {tipo === "categorie" ? " su un'altra categoria" : " su un altro fornitore"} vai su
          <b style={{ color: T.ink }}> Catalogo → Prodotti → «Modifica in blocco»</b>: lì scegli quali,
          li vedi mentre li selezioni, e quando «{item.nome}» non lo usa più nessuno il cestino torna
          a funzionare da solo.
        </p>
        <div className="flex justify-end"><Bottone variante="tonale" onClick={onChiudi}>Ho capito</Bottone></div>
      </div>
    );
  }

  /* ── UNITÀ · base matematica delle conversioni: si mostra dove è usata ── */
  const prodottiU = stato.prodotti.filter((p) => p.uomBase === item.id || p.uomLavorazione === item.id ||
    p.uomFornitore === item.id || p.uomFornitoreDiretto === item.id || Object.keys(p.conv || {}).includes(item.id));
  const magU = stato.magazzini.filter((m) => m.articoli.some((a) => a.uomId === item.id));
  if (!prodottiU.length && !magU.length) return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: T.dim }}>L'unità non è usata da nessun prodotto o magazzino: sarà rimossa per tutta la rete.</p>
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone variante="pericolo" icona={Trash2} onClick={() => {
          muta((s) => { s.unita = s.unita.filter((x) => x.id !== item.id); }, `Unità «${item.nome}» eliminata`);
          onChiudi();
        }}>Elimina</Bottone>
      </div>
    </div>
  );
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: T.dim }}>
        Le unità sono la base matematica delle conversioni: eliminarne una in uso corromperebbe quantità e fattori.
        Ecco dove è usata, così sai esattamente cosa modificare prima:
      </p>
      {prodottiU.length > 0 && <div className="text-sm" style={{ color: T.ink }}><b>Prodotti:</b> {prodottiU.map((p) => p.nome).join(", ")}</div>}
      {magU.length > 0 && <div className="text-sm" style={{ color: T.ink }}><b>Magazzini:</b> {magU.map((m) => m.nome).join(", ")}</div>}
      <div className="flex justify-end"><Bottone variante="tonale" onClick={onChiudi}>Ho capito</Bottone></div>
    </div>
  );
}

/* == MODIFICA PRODOTTI IN BLOCCO == */
function FormModificaMulti({ stato, muta, mostraToast, onChiudi }) {
  const [sel, setSel] = useState(() => new Set());
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("tutti");
  /* Il Catalogo ora dice «un fornitore in uso non si toglie: spostali da qui».
     Perché quella strada esista davvero serviva poter dire «fammi vedere i
     prodotti di QUEL fornitore»: con centodue prodotti, cercarli a memoria uno
     per uno non è una strada, è un modo gentile di dire di no. */
  const [filtroF, setFiltroF] = useState("tutti");
  const [campo, setCampo] = useState("categoriaId");
  const [valore, setValore] = useState("");
  /* ── LE CONVERSIONI IN BLOCCO (gen-5.82) ──
     Una conversione non e' un valore che si possa appiccicare a una selezione
     qualunque: dice «uno di questo vale N di quello», e il «quello» e'
     l'unita' BASE del singolo prodotto. Scrivere «1 cassa = 6 kg» su un
     prodotto la cui base e' «pz» non da' un errore, da' un numero sbagliato —
     in silenzio, su tutta la selezione, e si scopre mesi dopo quando un
     ordine arriva sballato.
     Quindi qui l'unita' base si SCEGLIE, e fa da filtro: chi ha un'altra base
     resta fuori e viene contato a schermo prima di premere. Il conto di
     quanti restano fuori e' la parte che rende la cosa usabile senza paura. */
  const [convDa, setConvDa] = useState("");     // «1 di questa…»
  const [convBase, setConvBase] = useState(""); // «…vale N di questa», che e' la base
  const [convQta, setConvQta] = useState("");
  const [convSovr, setConvSovr] = useState(false); // sostituire quelle gia' scritte?
  useEffect(() => { setValore(""); }, [campo]);
  const lista = ordinaPerNome(stato.prodotti).filter((p) =>
    (p.nome || "").toLowerCase().includes(q.trim().toLowerCase()) &&
    (filtro === "tutti" || p.categoriaId === filtro) &&
    (filtroF === "tutti" ? true
      : filtroF === "_prep" ? preparato(p)
      : filtroF === "_senza" ? !p.fornitoreId
      : p.fornitoreId === filtroF));
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const etichetta = { categoriaId: "Categoria", fornitoreId: "Fornitore",
    uomBase: "Unità di misura base", preparato: "Chi lo fa", soloInteri: "Mezze confezioni",
    conv: "Conversione" }[campo];

  /* Chi della selezione riceve davvero la conversione, e chi no. Si calcola
     mentre si guarda, non dopo aver premuto: e' l'unica cosa che distingue
     «assegnare in blocco» da «sparare nel mucchio». */
  const nQta = num(convQta);
  const dentro = campo !== "conv" || !convBase ? []
    : stato.prodotti.filter((p) => sel.has(p.id) && p.uomBase === convBase && p.uomBase !== convDa);
  const fuoriBase = campo !== "conv" || !convBase ? []
    : stato.prodotti.filter((p) => sel.has(p.id) && p.uomBase !== convBase);
  const giaScritta = dentro.filter((p) => (p.conv || {})[convDa] != null);
  const tocca = convSovr ? dentro : dentro.filter((p) => (p.conv || {})[convDa] == null);
  const opzioniValore = campo === "categoriaId" ? stato.categorie
    : campo === "fornitoreId" ? ordinaPerNome(stato.fornitori)
    : campo === "preparato" ? [
      { id: "si", nome: "Lo fa il laboratorio" },
      { id: "no", nome: "Si compra da un fornitore" }]
    : campo === "soloInteri" ? [
      { id: "si", nome: "Solo confezioni intere" },
      { id: "no", nome: "Si possono ordinare quantità spezzate" }]
    : stato.unita.map((u) => ({ id: u.id, nome: labelU(u) }));
  /* Quanti, fra quelli scelti, resterebbero senza nessuno che glieli dà. Si
     conta QUI e non dentro muta(): quel pezzo può essere rieseguito quando la
     coda si riallinea col server, e un contatore lì dentro conterebbe due volte. */
  const orfaniDopo = campo === "preparato" && valore === "no"
    ? stato.prodotti.filter((p) => sel.has(p.id) && !p.fornitoreId).length : 0;

  const salvaConv = () => {
    if (!convDa || !convBase) return mostraToast("Scegli tutte e due le unità", "errore");
    if (convDa === convBase) return mostraToast("Sono la stessa unità: una vale sempre uno", "errore");
    if (!(nQta > 0)) return mostraToast("Scrivi quanto vale, con un numero maggiore di zero", "errore");
    if (!tocca.length) return mostraToast(dentro.length
      ? "Ce l'hanno già tutti: spunta «sostituisci» se la vuoi riscrivere"
      : "Nessuno dei prodotti scelti ha quella unità base", "errore");
    const ids = new Set(tocca.map((p) => p.id));
    const quanti = tocca.length;
    muta((s) => {
      for (const p of s.prodotti) {
        if (!ids.has(p.id)) continue;
        p.conv = { ...(p.conv || {}), [convDa]: nQta };
        /* Questa l'ha scritta una persona guardando la merce, non l'ha
           indovinata l'app: il bollino «stimata» va tolto, se no l'avviso
           delle conversioni da sistemare continua a chiamarla in causa. */
        if ((p.convStim || []).includes(convDa))
          p.convStim = p.convStim.filter((u) => u !== convDa);
      }
    }, `${quanti} prodotti · 1 ${simboloU(stato, convDa)} = ${fmtQ(nQta)} ${simboloU(stato, convBase)}`);
    mostraToast(fuoriBase.length
      ? `${quanti} prodotti aggiornati · ${fuoriBase.length} lasciati stare: altra unità base`
      : `${quanti} prodotti aggiornati`);
    onChiudi();
  };

  const salva = () => {
    if (!sel.size) return mostraToast("Seleziona almeno un prodotto", "errore");
    if (campo === "conv") return salvaConv();
    if (!valore) return mostraToast("Scegli il valore da assegnare", "errore");
    /* stesso conto vero: qui il ciclo gira sui prodotti a catalogo, e uno
       cancellato da un altro telefono non c'e' piu' */
    const quanti = stato.prodotti.filter((x) => sel.has(x.id)).length;
    const fuori = sel.size - quanti;
    if (!quanti) return mostraToast("Nessuno di questi prodotti è più a catalogo", "errore");
    muta((s) => {
      for (const p of s.prodotti) {
        if (!sel.has(p.id)) continue;
        if (campo === "soloInteri") {
          if (valore === "si") p.soloInteri = true; else delete p.soloInteri;
          continue;
        }
        if (campo !== "preparato") { p[campo] = valore; continue; }
        /* La spunta si scrive solo quando è vera, esattamente come nella scheda
           del singolo prodotto: un prodotto comprato non si porta dietro un
           campo che vale «no». E le eccezioni di fornitore per sede se ne vanno:
           su una cosa che fa il laboratorio non c'è nessun fornitore da eccepire. */
        if (valore === "si") { p.preparato = true; p.fornSede = {}; }
        else delete p.preparato;
      }
    }, fuori ? `${quanti} prodotti · ${etichetta} aggiornata · ${fuori} saltati`
      : `${quanti} prodotti · ${etichetta} aggiornata`);
    mostraToast(fuori ? `${quanti} aggiornati · ${fuori} saltati: non sono più a catalogo`
      : orfaniDopo ? `${quanti} aggiornati · ${orfaniDopo} sono rimasti senza fornitore: vanno assegnati`
      : `${quanti} prodotti aggiornati`, (fuori || orfaniDopo) ? "avviso" : "ok");
    onChiudi();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3">
        <Selettore label="Cosa vuoi cambiare" valore={campo} onCambia={setCampo} opzioni={[
          { id: "categoriaId", nome: "Categoria" }, { id: "fornitoreId", nome: "Fornitore" }, { id: "uomBase", nome: "Unità di misura base" },
          { id: "preparato", nome: "Chi lo fa · laboratorio o fornitore" },
          { id: "conv", nome: "Conversione · quanto vale un'unità" },
          { id: "soloInteri", nome: "Mezze confezioni · sì o no" },
        ]} />
        {campo !== "conv" && (
          <Selettore label={`Nuovo valore · ${etichetta}`} valore={valore} onCambia={setValore}
            opzioni={[{ id: "", nome: "— scegli —" }, ...opzioniValore]} />
        )}
        {campo === "conv" && (
          <div className="rounded-2xl p-3 flex flex-col gap-3" style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <Selettore label="Uno di questa…" valore={convDa} onCambia={setConvDa}
                opzioni={[{ id: "", nome: "— scegli —" }, ...stato.unita.map((u) => ({ id: u.id, nome: labelU(u) }))]} />
              <Campo label="…vale" valore={convQta} onCambia={setConvQta} inputMode="decimal" placeholder="es. 6" />
              <Selettore label="di questa, che è la base" valore={convBase} onCambia={setConvBase}
                opzioni={[{ id: "", nome: "— scegli —" }, ...stato.unita.map((u) => ({ id: u.id, nome: labelU(u) }))]} />
            </div>
            <label className="flex items-center gap-2 text-sm font-bold" style={{ color: T.ink }}>
              <input type="checkbox" checked={convSovr} onChange={(e) => setConvSovr(e.target.checked)} />
              Sostituisci anche dove una conversione c'è già
            </label>
            {/* Il conto prima di premere. E' questo che rende la cosa usabile
                senza paura: si vede a chi arriva e a chi no, e perche'. */}
            {convBase ? (
              <div className="text-sm font-semibold leading-relaxed" style={{ color: T.dim }}>
                Si scrive su <b style={{ color: tocca.length ? T.verde : T.ambra }}>{tocca.length}</b> prodotti
                {giaScritta.length > 0 && !convSovr && <> · <b>{giaScritta.length}</b> ce l'hanno già e restano come sono</>}
                {fuoriBase.length > 0 && (
                  <> · <b style={{ color: T.ambra }}>{fuoriBase.length}</b> restano fuori perché la loro
                  unità base non è «{simboloU(stato, convBase)}»</>
                )}
              </div>
            ) : (
              <div className="text-sm font-semibold" style={{ color: T.tenue }}>
                Scegli l'unità base: la conversione andrà <b>solo</b> sui prodotti che ce l'hanno,
                perché su tutti gli altri sarebbe un numero sbagliato.
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
        <Search size={16} style={{ color: T.tenue }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca prodotto…"
          className="flex-1 bg-transparent outline-none text-sm font-semibold" style={{ color: T.ink }} />
      </div>
      <select value={filtroF} onChange={(e) => setFiltroF(e.target.value)} aria-label="Filtra per fornitore"
        className="rounded-full px-3.5 py-2.5 text-sm font-bold w-full"
        style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink }}>
        <option value="tutti">Ogni fornitore</option>
        <option value="_senza">Senza fornitore</option>
        <option value="_prep">Solo quelli fatti in laboratorio</option>
        {ordinaPerNome(stato.fornitori).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
      </select>
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFiltro("tutti")} className="rounded-full px-2.5 py-1 text-xs font-bold"
          style={filtro === "tutti" ? { background: T.grad, color: "#fff" } : { background: T.sup, color: T.dim, border: `1px solid ${T.bordo}` }}>Tutte</button>
        {stato.categorie.map((c) => (
          <button key={c.id} onClick={() => setFiltro(filtro === c.id ? "tutti" : c.id)} className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={filtro === c.id ? { background: c.colore, color: "#fff" } : { background: `${c.colore}14`, color: c.colore, border: `1px solid ${c.colore}33` }}>{c.nome}</button>
        ))}
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold" style={{ color: T.blu }}>{sel.size} selezionati</span>
        <div className="flex gap-2">
          <button onClick={() => setSel((s) => new Set([...s, ...lista.map((p) => p.id)]))} className="text-xs font-bold" style={{ color: T.blu }}>Tutti ({lista.length})</button>
          <button onClick={() => setSel((s) => { const n = new Set(s); lista.forEach((p) => n.delete(p.id)); return n; })} className="text-xs font-bold" style={{ color: T.tenue }}>Nessuno</button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "40vh" }}>
        {lista.length === 0 ? <p className="text-sm py-2 text-center" style={{ color: T.dim }}>Nessun prodotto.</p>
          : lista.map((p) => {
            const on = sel.has(p.id); const cat = trova(stato.categorie, p.categoriaId);
            return (
              <button key={p.id} type="button" onClick={() => toggle(p.id)} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left"
                style={{ background: on ? "#EAF0FE" : "#F7F9FE", border: `1.5px solid ${on ? T.blu : T.bordo}` }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? T.blu : "#fff", border: `1.5px solid ${on ? T.blu : T.tenue}` }}>
                  {on && <Check size={13} color="#fff" />}
                </span>
                <span className="flex-1 min-w-0 font-bold truncate" style={{ color: T.ink }}>{p.nome}</span>
                {/* senza questa targhetta si sceglie alla cieca: non si vede com'è
                    adesso, e si rischia di riscrivere sopra a quello che era giusto */}
                {preparato(p) && <Chip colore={T.viola}>in casa</Chip>}
                {cat && <Chip colore={cat.colore}>{cat.nome}</Chip>}
              </button>
            );
          })}
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={Check} onClick={salva}
          disabilitato={!sel.size || (campo === "conv" ? !(tocca.length && nQta > 0) : !valore)}>
          {campo === "conv" ? `Applica a ${tocca.length || ""}` : `Applica a ${sel.size || ""}`}</Bottone>
      </div>
    </div>
  );
}

/* ─────────── QUANTO VALE QUELLO CHE C'È DENTRO ───────────
   Il prezzo è per unità BASE del prodotto, quindi la giacenza va convertita
   prima di moltiplicare. Se manca il prezzo o manca la conversione non si
   inventa un numero: quella riga si salta e si dice quante ne sono state
   saltate. Un valore inventato in un magazzino è peggio di nessun valore. */
function valoreMag(stato, m) {
  let tot = 0, senzaPrezzo = 0, senzaConv = 0, contate = 0;
  for (const a of m.articoli || []) {
    const p = trova(stato.prodotti, a.prodottoId);
    if (!p || !(p.prezzo > 0)) { senzaPrezzo++; continue; }
    const q = a.uomId === p.uomBase ? a.qty : converti(p, a.qty, a.uomId, p.uomBase);
    if (q == null) { senzaConv++; continue; }
    tot += q * p.prezzo; contate++;
  }
  return { tot, senzaPrezzo, senzaConv, contate };
}
function valoreRete(stato, mags) {
  return (mags || []).reduce((acc, m) => {
    const v = valoreMag(stato, m);
    return { tot: acc.tot + v.tot, senzaPrezzo: acc.senzaPrezzo + v.senzaPrezzo,
      senzaConv: acc.senzaConv + v.senzaConv, contate: acc.contate + v.contate };
  }, { tot: 0, senzaPrezzo: 0, senzaConv: 0, contate: 0 });
}
const fmtEuro = (n) => "€ " + (Math.round(n * 100) / 100).toLocaleString("it-IT",
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ─────────── LE DOSI, UNA DIETRO L'ALTRA ───────────
   La macchina delle ricette è in piedi da gen-5.68 e funziona: il laboratorio
   segna «ho prodotto venti breccole» e l'app scala farina, pecorino e
   guanciale dai magazzini della sua sede. Solo che in catalogo di ricette ce
   ne sono ZERO, quindi non scala niente — e la ragione non è la pigrizia di
   nessuno: le dosi si scrivono aprendo la scheda del singolo prodotto, una
   alla volta, in mezzo a categoria, fornitore, unità, conversioni e prezzo.
   Per venti preparati vuol dire venti aperture, venti ricerche, venti
   salvataggi, con la ricetta che è l'ultima cosa in fondo alla scheda.

   Qui invece si sta fermi su una schermata e si va avanti: «per fare 1 di
   questo serve…», salva, prossimo. Chi ha il quaderno delle ricette davanti
   deve poter finire in mezz'ora senza mai cercare niente.

   Due scelte che vale la pena dichiarare.
   La prima: si salva a ogni passaggio, non alla fine. Una sessione di dieci
   ricette che si perde perché il telefono si spegne non la rifà nessuno.
   La seconda: da qui si può marcare un prodotto come «lo fa il laboratorio»
   mentre gli si scrive la ricetta. Sembra fuori posto, e invece è il motivo
   per cui questa schermata oggi non sarebbe utile a niente: in catalogo i
   preparati sono zero, e mandare la persona in un'altra schermata a marcarli
   prima di poter cominciare vorrebbe dire far fallire il lavoro sul primo
   passo. Scrivere la ricetta di una cosa È dire che la si fa in casa. */
function FormRicette({ stato, muta, mostraToast, onChiudi }) {
  const preparati = ordinaPerNome(stato.prodotti).filter((p) => preparato(p));
  const [i, setI] = useState(() => {
    /* si riparte dal primo che NON ha ancora le dosi: chi riapre la
       schermata vuole continuare, non ricominciare */
    const k = preparati.findIndex((p) => !conRicetta(p));
    return k >= 0 ? k : 0;
  });
  const [q, setQ] = useState("");
  const prod = preparati[i] || null;

  /* la bozza della ricetta del prodotto su cui si è adesso */
  const [resa, setResa] = useState("");
  const [uomResa, setUomResa] = useState("");
  const [ing, setIng] = useState([]);
  const [tocco, setTocco] = useState(false);
  const carica = (p) => {
    setResa(p?.ricetta?.resa != null ? String(p.ricetta.resa).replace(".", ",") : "");
    setUomResa(p?.ricetta?.uomResa || p?.uomLavorazione || p?.uomBase || "");
    setIng((p?.ricetta?.ingredienti || []).map((x) => ({
      prodottoId: x.prodottoId, qty: String(x.qty).replace(".", ","), uomId: x.uomId })));
    setTocco(false);
  };
  const idRif = prod?.id;
  useEffect(() => { carica(prod); /* eslint-disable-next-line */ }, [idRif]);

  const unitaDi = (p) => {
    /* le unità che hanno senso per QUEL prodotto: la sua base e quelle per
       cui esiste una conversione. Offrire tutte le unità del catalogo vuol
       dire offrire numeri che l'app poi non sa convertire. */
    const ids = [p?.uomBase, ...Object.keys(p?.conv || {})].filter(Boolean);
    return [...new Set(ids)].map((id) => ({ id, nome: labelU(trova(stato.unita, id)) }));
  };

  const salva = (poi) => {
    if (!prod) return;
    const r = num(resa);
    if (r == null || r <= 0) return mostraToast("Scrivi quanto ne esce: senza la resa non si scala niente", "errore");
    const pulite = [];
    for (const x of ing) {
      if (!x.prodottoId) continue;
      const n = num(x.qty);
      if (n == null || n <= 0) {
        const nome = trova(stato.prodotti, x.prodottoId)?.nome || "un ingrediente";
        return mostraToast(`Manca la quantità di «${nome}»`, "errore");
      }
      pulite.push({ prodottoId: x.prodottoId, qty: n, uomId: x.uomId });
    }
    if (!pulite.length) return mostraToast("Serve almeno un ingrediente", "errore");
    muta((s) => {
      const p = trova(s.prodotti, prod.id); if (!p) return;
      p.preparato = true;
      p.ricetta = { resa: r, uomResa: uomResa || p.uomBase, ingredienti: pulite };
    }, `Ricetta di «${prod.nome}»: ${pulite.length} ingredienti per ${fmtQ(r)}`);
    mostraToast(`«${prod.nome}» a posto`);
    if (poi === "avanti") {
      /* si salta al prossimo SENZA ricetta, non semplicemente al successivo:
         chi sta riempiendo vuole andare dove manca */
      const dopo = preparati.findIndex((p, k) => k > i && !conRicetta(p));
      setI(dopo >= 0 ? dopo : Math.min(i + 1, preparati.length - 1));
    } else onChiudi();
  };

  /* ── nessun preparato: è il caso di oggi, e va preso di petto ── */
  const trovati = q.trim().length >= 2
    ? ordinaPerNome(stato.prodotti).filter((p) => !preparato(p)
        && (p.nome || "").toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : [];
  const marca = (p) => {
    muta((s) => { const b = trova(s.prodotti, p.id); if (b) b.preparato = true; },
      `«${p.nome}» lo fa il laboratorio`);
    setQ("");
    mostraToast(`«${p.nome}» adesso lo fa il laboratorio: scrivi le dosi`);
  };

  const fatte = preparati.filter(conRicetta).length;
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl px-3.5 py-3 text-sm"
        style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}`, color: T.dim }}>
        Le dosi servono a una cosa sola, ma importante: quando il laboratorio segna
        <b style={{ color: T.ink }}> «ho prodotto»</b>, gli ingredienti si scalano da soli.
        Senza, la quantità sale e il magazzino continua a dire che c'è roba che non c'è.
        {preparati.length > 0 && <> <b style={{ color: T.ink }}>{fatte} su {preparati.length}</b> ce l'hanno già.</>}
      </div>

      {/* Cercare un prodotto e marcarlo sta qui sopra e non in fondo perché
          oggi i preparati sono zero: senza questo, la schermata si apre vuota
          e non c'è niente da fare. */}
      <div>
        <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
          style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
          <Search size={16} style={{ color: T.tenue }} />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Aggiungi un prodotto che fate voi…" aria-label="Cerca un prodotto da marcare come fatto in laboratorio"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold"
            style={{ color: T.ink }} />
        </div>
        {trovati.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {trovati.map((p) => (
              <button key={p.id} type="button" onClick={() => marca(p)}
                className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left"
                style={{ background: "#EFF7F3", border: "1px solid #CFEADD" }}>
                <FlaskConical size={14} style={{ color: T.verde }} />
                <span className="flex-1 min-w-0 truncate font-bold text-sm" style={{ color: T.ink }}>{p.nome}</span>
                <span className="text-xs font-bold shrink-0" style={{ color: T.verde }}>lo facciamo noi</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!prod ? (
        <p className="text-sm" style={{ color: T.ambra }}>
          In catalogo non c'è ancora nessun prodotto marcato come <b>fatto in laboratorio</b>.
          Cercalo qui sopra: marcarlo e scrivergli le dosi si fa in un gesto solo.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setI(Math.max(0, i - 1))}
              aria-label="Preparato precedente" className="rounded-full p-2.5 shrink-0"
              style={{ background: "#EAF0FE", color: T.blu, opacity: i === 0 ? .4 : 1 }}>
              <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /></button>
            <div className="flex-1 min-w-0 text-center">
              <div className="font-extrabold truncate" style={{ color: T.ink }}>{prod.nome}</div>
              <div className="text-xs" style={{ color: T.tenue }}>
                {i + 1} di {preparati.length}{conRicetta(prod) ? " · le dosi ci sono già" : " · dosi da scrivere"}
              </div>
            </div>
            <button type="button" onClick={() => setI(Math.min(preparati.length - 1, i + 1))}
              aria-label="Preparato successivo" className="rounded-full p-2.5 shrink-0"
              style={{ background: "#EAF0FE", color: T.blu, opacity: i >= preparati.length - 1 ? .4 : 1 }}>
              <ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Campo label="Ne escono" valore={resa} onCambia={(v) => { setResa(puliziaNum(v)); setTocco(true); }}
              inputMode="decimal" placeholder="20" />
            <Selettore label="di" valore={uomResa || prod.uomBase}
              onCambia={(v) => { setUomResa(v); setTocco(true); }} opzioni={unitaDi(prod)} />
          </div>

          <div className="flex flex-col gap-2">
            {ing.map((r, k) => (
              <div key={k} className="flex gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <Selettore label={k === 0 ? "Ci vuole" : ""} valore={r.prodottoId}
                    onCambia={(v) => { setIng(ing.map((x, j) => (j === k
                      ? { ...x, prodottoId: v, uomId: trova(stato.prodotti, v)?.uomBase || x.uomId } : x))); setTocco(true); }}
                    gruppi={gruppiProdotto(stato, stato.prodotti.filter((x) => x.id !== prod.id))}
                    placeholder="— scegli —" />
                </div>
                <div style={{ width: 88 }}>
                  <Campo label={k === 0 ? "quanto" : ""} valore={r.qty}
                    onCambia={(v) => { setIng(ing.map((x, j) => (j === k ? { ...x, qty: puliziaNum(v) } : x))); setTocco(true); }}
                    inputMode="decimal" placeholder="0" />
                </div>
                <div style={{ width: 104 }}>
                  <Selettore label={k === 0 ? "unità" : ""} valore={r.uomId}
                    onCambia={(v) => { setIng(ing.map((x, j) => (j === k ? { ...x, uomId: v } : x))); setTocco(true); }}
                    opzioni={r.prodottoId ? unitaDi(trova(stato.prodotti, r.prodottoId))
                      : stato.unita.map((u) => ({ id: u.id, nome: labelU(u) }))} />
                </div>
                <button type="button" onClick={() => { setIng(ing.filter((_, j) => j !== k)); setTocco(true); }}
                  aria-label="Togli ingrediente" className="rounded-full p-2.5 mb-0.5"
                  style={{ background: "#FCE9EE", color: T.rosso }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Bottone piccolo variante="tonale" icona={Plus}
              onClick={() => { setIng([...ing, { prodottoId: "", qty: "", uomId: prod.uomBase }]); setTocco(true); }}>
              Aggiungi ingrediente
            </Bottone>
          </div>

          {/* Le pastiglie in fondo servono a due cose: saltare dove si vuole, e
              far vedere quanto manca. Un elenco che si accorcia a vista è la
              ragione per cui uno finisce invece di smettere a metà. */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {preparati.map((p, k) => (
              <button key={p.id} type="button" onClick={() => setI(k)}
                aria-label={`Vai a ${p.nome}`}
                className="rounded-full px-2.5 py-1 text-xs font-bold"
                style={{
                  background: k === i ? T.blu : conRicetta(p) ? "#E4F6EE" : "#F1F4FB",
                  color: k === i ? "#fff" : conRicetta(p) ? T.verde : T.tenue,
                }}>
                {conRicetta(p) ? "✓ " : ""}{p.nome}
              </button>
            ))}
          </div>

          <div className="flex gap-2 justify-end mt-2 flex-wrap">
            <Bottone variante="fantasma" onClick={onChiudi}>Chiudi</Bottone>
            <Bottone variante="tonale" icona={Check} onClick={() => salva("chiudi")} disabilitato={!tocco && conRicetta(prod)}>
              Salva
            </Bottone>
            <Bottone icona={ChevronRight} onClick={() => salva("avanti")}>Salva e vai al prossimo</Bottone>
          </div>
        </>
      )}
    </div>
  );
}

/* Un campo per prodotto, tutti nella stessa schermata: mettere 102 prezzi
   entrando e uscendo da 102 schede non lo farebbe nessuno. */
function FormPrezzi({ stato, muta, mostraToast, onChiudi }) {
  const [q, setQ] = useState("");
  const [soloVuoti, setSoloVuoti] = useState(true);
  const [val, setVal] = useState(() => {
    const v = {}; for (const p of stato.prodotti) v[p.id] = p.prezzo > 0 ? String(p.prezzo).replace(".", ",") : "";
    return v;
  });
  const lista = ordinaPerNome(stato.prodotti).filter((p) =>
    (p.nome || "").toLowerCase().includes(q.trim().toLowerCase())
    && (!soloVuoti || !(p.prezzo > 0)));
  const quanti = stato.prodotti.filter((p) => !(p.prezzo > 0)).length;
  const salva = () => {
    const cambi = [];
    for (const p of stato.prodotti) {
      const grezzo = (val[p.id] || "").trim();
      const n = grezzo === "" ? null : num(grezzo);
      if (grezzo !== "" && (n == null || n < 0)) return mostraToast(`Prezzo non valido su «${p.nome}»`, "errore");
      const ora = p.prezzo > 0 ? p.prezzo : null;
      if (n !== ora) cambi.push([p.id, n]);
    }
    if (!cambi.length) return mostraToast("Nessun prezzo cambiato", "avviso");
    muta((s) => {
      for (const [id, n] of cambi) {
        const p = trova(s.prodotti, id); if (!p) continue;
        if (n == null) delete p.prezzo; else p.prezzo = n;
      }
    }, `${cambi.length} prezzi aggiornati`);
    mostraToast(`${cambi.length} prezzi salvati`);
    onChiudi();
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: T.dim }}>
        Il prezzo va messo per <b style={{ color: T.ink }}>unità base</b> del prodotto: è così
        che l'app calcola quanto vale la merce ferma. Puoi lasciare vuoto quello che non sai.
      </p>
      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
        style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
        <Search size={16} style={{ color: T.tenue }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca prodotto…"
          aria-label="Cerca prodotto" className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold"
          style={{ color: T.ink }} />
      </div>
      <button type="button" onClick={() => setSoloVuoti((v) => !v)}
        className="self-start rounded-full px-3 py-2 text-xs font-extrabold"
        style={soloVuoti ? { background: T.blu, color: "#fff" } : { background: "#EAF0FE", color: T.blu }}>
        {soloVuoti ? `Solo i ${quanti} senza prezzo` : "Tutti i prodotti"}
      </button>
      <div className="flex flex-col gap-1.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "46vh" }}>
        {lista.length === 0 && <p className="text-sm font-semibold" style={{ color: T.verde }}>
          Nessun prodotto da compilare qui.</p>}
        {lista.map((p) => (
          <div key={p.id} className="flex items-center gap-2.5 rounded-2xl px-3 py-2"
            style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
            <span className="flex-1 min-w-0">
              <span className="block font-bold truncate text-sm" style={{ color: T.ink }}>{p.nome}</span>
              <span className="block text-xs" style={{ color: T.tenue }}>per {simboloU(stato, p.uomBase)}</span>
            </span>
            <span className="text-sm font-bold shrink-0" style={{ color: T.tenue }}>€</span>
            <input value={val[p.id] ?? ""} inputMode="decimal" aria-label={`Prezzo di ${p.nome}`}
              onChange={(e) => setVal((v) => ({ ...v, [p.id]: puliziaNum(e.target.value) }))}
              placeholder="—" className="w-20 shrink-0 rounded-xl px-2.5 py-2 text-sm font-bold text-right"
              style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink, outline: "none" }} />
          </div>
        ))}
      </div>
      <PieDiPagina onChiudi={onChiudi} onSalva={salva} testo="Salva i prezzi" />
    </div>
  );
}

/* ─────────── TUTTE LE CONVERSIONI IN UNA SCHERMATA ─────────── */
function FormConversioni({ stato, muta, mostraToast, onChiudi }) {
  const coppie = coppieConv(stato);
  const [q, setQ] = useState("");
  const [val, setVal] = useState(() => {
    const v = {};
    for (const c of coppie) {
      const base = c.corrente != null ? rispostaDaConv(c.tipo, c.corrente) : c.proposta;
      v[c.chiave] = base == null ? "" : String(+base.toFixed(c.decimali)).replace(".", ",");
    }
    return v;
  });
  const [tocc, setTocc] = useState(() => new Set());
  const lista = coppie.filter((c) => (c.prod.nome || "").toLowerCase().includes(q.trim().toLowerCase()));
  const nEsatte = coppie.filter((c) => c.esatta).length;

  const scrivi = (c, testo) => {
    setVal((v) => ({ ...v, [c.chiave]: puliziaNum(testo) }));
    setTocc((t) => new Set(t).add(c.chiave));
  };
  const salva = () => {
    const cambi = [];
    for (const c of coppie) {
      const grezzo = (val[c.chiave] || "").trim();
      if (grezzo === "") continue;
      const n = num(grezzo);
      if (n == null || n <= 0) return mostraToast(`Numero non valido su «${c.prod.nome}»`, "errore");
      const f = convDaRisposta(c.tipo, n);
      if (f == null || !isFinite(f)) return mostraToast(`Numero non valido su «${c.prod.nome}»`, "errore");
      /* stimata = l'ha proposta l'app e nessuno l'ha toccata. Le geometriche
         non sono stime: quelle sono vere e basta. */
      cambi.push([c.prod.id, c.uomId, +f.toFixed(6), !c.esatta && !tocc.has(c.chiave)]);
    }
    if (!cambi.length) return mostraToast("Nessuna conversione da salvare", "avviso");
    const nStim = cambi.filter((x) => x[3]).length;
    muta((s) => {
      for (const [pid, uom, f, stim] of cambi) {
        const p = trova(s.prodotti, pid); if (!p) continue;
        p.conv = { ...(p.conv || {}), [uom]: f };
        const set = new Set(p.convStim || []);
        if (stim) set.add(uom); else set.delete(uom);
        if (set.size) p.convStim = [...set]; else delete p.convStim;
      }
    }, `${cambi.length} conversioni impostate${nStim ? ` (${nStim} stimate dall'app)` : ""}`);
    mostraToast(nStim ? `${cambi.length} salvate · ${nStim} da confermare con la bilancia`
      : `${cambi.length} conversioni salvate`);
    onChiudi();
  };

  if (!coppie.length) return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold" style={{ color: T.verde }}>
        Non c'è niente da sistemare: ogni casella tenuta in un'unità diversa da
        quella base del prodotto ha il suo fattore, e nessuno è più una stima.
      </p>
      <div className="flex justify-end"><Bottone variante="fantasma" onClick={onChiudi}>Chiudi</Bottone></div>
    </div>
  );
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: T.dim }}>
        Queste caselle sono tenute in un'unità diversa da quella base del prodotto.
        Dove il numero che le lega <b style={{ color: T.ink }}>manca</b>, l'app le conta
        1:1 e gli ordini escono sbagliati; dove l'ho <b style={{ color: T.ink }}>stimato
        io</b>, i conti tornano ma sono approssimati. Rispondi come risponderesti a
        voce: i conti li faccio io.
      </p>
      {nEsatte > 0 && (
        <div className="rounded-2xl px-3.5 py-2.5 text-xs" style={{ background: "#EFF7F3", border: "1px solid #CFEADD", color: T.ink }}>
          <b>{nEsatte}</b> {nEsatte === 1 ? "è già esatta" : "sono già esatte"}: fra teglie Gastronorm il
          rapporto sta nel nome (1 GN 1/3 = 2 GN 1/6), non c'è niente da pesare.
        </div>
      )}
      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
        style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
        <Search size={16} style={{ color: T.tenue }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca prodotto…"
          aria-label="Cerca prodotto" className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold"
          style={{ color: T.ink }} />
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "44vh" }}>
        {lista.length === 0 && <p className="text-sm font-semibold" style={{ color: T.dim }}>Nessun prodotto con questo nome.</p>}
        {lista.map((c) => (
          <div key={c.chiave} className="rounded-2xl px-3 py-2.5"
            style={{ background: "#F7F9FE", border: `1px solid ${c.esatta ? "#CFEADD" : T.bordo}` }}>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-sm" style={{ color: T.ink }}>{c.prod.nome}</span>
              {c.esatta && <Chip colore={T.verde}>esatta</Chip>}
            </div>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="flex-1 min-w-0 text-xs" style={{ color: T.dim }}>{c.etichetta}</span>
              <input value={val[c.chiave] ?? ""} inputMode="decimal"
                aria-label={`${c.etichetta} per ${c.prod.nome}`}
                onChange={(e) => scrivi(c, e.target.value)}
                placeholder="—" className="w-20 shrink-0 rounded-xl px-2.5 py-2 text-sm font-bold text-right"
                style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink, outline: "none" }} />
              <span className="text-xs font-bold shrink-0 w-6" style={{ color: T.tenue }}>{c.unita}</span>
            </div>
            {!tocc.has(c.chiave) && (c.corrente != null
              ? <div className="text-xs mt-1" style={{ color: T.ambra }}>stimato dall'app: pesane uno e correggi</div>
              : c.nota && <div className="text-xs mt-1" style={{ color: c.esatta ? T.verde : T.ambra }}>{c.nota}</div>)}
          </div>
        ))}
      </div>
      <PieDiPagina onChiudi={onChiudi} onSalva={salva} testo={`Salva ${coppie.length} conversioni`} />
    </div>
  );
}

function VistaCatalogo({ stato, muta, mostraToast, profilo }) {
  const [tab, setTab] = useState("unita");
  const [modal, setModal] = useState(null);   // {tipo, item?}
  const [del, setDel] = useState(null);       // {tipo, item}
  const [bulk, setBulk] = useState(false);    // modifica prodotti in blocco
  const [prezzi, setPrezzi] = useState(false);       // prezzi, uno per uno ma tutti insieme
  const [ricette, setRicette] = useState(false);     // le dosi, un preparato dietro l'altro
  const [conversioni, setConversioni] = useState(false);  // i fattori mancanti, tutti in una volta
  const [catAperte, setCatAperte] = useState(() => new Set());  // categorie aperte nell'elenco
  const [soloFuori, setSoloFuori] = useState(false);  // solo i prodotti in nessun magazzino
  const [dove, setDove] = useState(null);             // "in quali magazzini sta" di un prodotto

  const etichette = { unita: "unità di misura", categorie: "categoria", fornitori: "fornitore", prodotti: "prodotto" };
  const [q, setQ] = useState("");
  const cerca = (n) => (n || "").toLowerCase().includes(q.trim().toLowerCase());
  const unitaF = stato.unita.filter((u) => cerca(u.nome) || cerca(u.simbolo));
  const categorieF = stato.categorie.filter((c) => cerca(c.nome));
  const fornitoriF = ordinaPerNome(stato.fornitori).filter((f) => cerca(f.nome));
  const fuoriMag = prodottiFuori(stato);
  const idFuori = new Set(fuoriMag.map((p) => p.id));
  /* il filtro vale solo finché ci sono prodotti fuori: se li sistema tutti
     mentre il filtro è acceso, l'avviso col tasto per spegnerlo sparisce e
     l'elenco resterebbe vuoto senza una via d'uscita */
  const filtroFuori = soloFuori && fuoriMag.length > 0;
  const prodottiF = stato.prodotti.filter((p) => cerca(p.nome) && (!filtroFuori || idFuori.has(p.id)));
  const conteggio = { unita: unitaF.length, categorie: categorieF.length, fornitori: fornitoriF.length, prodotti: prodottiF.length }[tab];
  const filtrata = !!q.trim();
  const nConvMancanti = coppieConv(stato).length;

  const normSim = (x) => (x || "").toLowerCase().replace(/\s+/g, "");
  const GN_SET = ["1/1", "1/2", "1/3", "1/4", "1/6", "1/9", "2/3", "2/1"];
  const gnMancanti = GN_SET.filter((g) => !stato.unita.some((u) => normSim(u.simbolo) === normSim(`GN ${g}`)));
  const creaGN = () => {
    if (!gnMancanti.length) return mostraToast("Le unità Gastronorm ci sono già", "avviso");
    muta((s) => {
      for (const g of gnMancanti) s.unita.push({ id: uid("u"), nome: `Gastronorm ${g}`, simbolo: `GN ${g}` });
    }, `${gnMancanti.length} unità Gastronorm aggiunte`);
    mostraToast(`Aggiunte ${gnMancanti.length} unità Gastronorm`);
  };

  return (
    <div>
      <Intesta titolo="Catalogo" sotto="Anagrafiche condivise da tutta la rete"
        azione={<div className="flex gap-2 flex-wrap">
          {tab === "unita" && gnMancanti.length > 0 && (
            <Bottone variante="tonale" icona={Ruler} onClick={creaGN}>Aggiungi set Gastronorm</Bottone>
          )}
          {tab === "prodotti" && stato.prodotti.length > 1 && (
            <Bottone variante="tonale" icona={Pencil} onClick={() => setBulk(true)}>Modifica in blocco</Bottone>
          )}
          {tab === "prodotti" && stato.prodotti.length > 0 && (
            <Bottone variante="tonale" icona={FlaskConical} onClick={() => setRicette(true)}>Ricette</Bottone>
          )}
          {tab === "prodotti" && stato.prodotti.length > 0 && (
            <Bottone variante="tonale" icona={TrendingUp} onClick={() => setPrezzi(true)}>Prezzi</Bottone>
          )}
          {tab === "prodotti" && nConvMancanti > 0 && (
            <Bottone variante="tonale" icona={ArrowLeftRight} onClick={() => setConversioni(true)}>
              Conversioni · {nConvMancanti}
            </Bottone>
          )}
          <Bottone icona={Plus} onClick={() => setModal({ tipo: tab })}>Aggiungi</Bottone>
        </div>} />
      <div className="mb-4">
        <Segmenti valore={tab} onCambia={(v) => { setTab(v); setQ(""); setSoloFuori(false); }} opzioni={[
          { id: "unita", nome: `Unità · ${stato.unita.length}` },
          { id: "categorie", nome: `Categorie · ${stato.categorie.length}` },
          { id: "fornitori", nome: `Fornitori · ${stato.fornitori.length}` },
          { id: "prodotti", nome: `Prodotti · ${stato.prodotti.length}` },
        ]} />
      </div>

      {/* appiccicata in alto: con cento prodotti, scorrendo si perdeva e
          toccava tornare su ogni volta per cambiare ricerca */}
      <div className="sticky z-10 flex items-center gap-2.5 rounded-2xl px-4 py-2.5 mb-3"
        style={{ top: 0, background: T.sup, border: `1.5px solid ${T.bordo}`,
          boxShadow: "0 8px 18px -14px rgba(20,30,60,.6)" }}>
        <Search size={17} style={{ color: T.tenue }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} inputMode="search"
          placeholder={`Cerca ${etichette[tab]}…`} aria-label="Cerca nel catalogo"
          className="flex-1 min-w-0 text-base font-semibold"
          style={{ color: T.ink, outline: "none", border: "none", background: "transparent" }} />
        {q && <button onClick={() => setQ("")} aria-label="Pulisci ricerca" className="rounded-full p-2.5"
          style={{ background: "#E7ECF7", color: T.dim }}><X size={13} /></button>}
      </div>
      {/* Le pastiglie che filtravano per categoria stavano qui: da quando i
          prodotti sono raggruppati, toccare l'intestazione di un gruppo fa la
          stessa identica cosa. Due comandi per lo stesso gesto confondono e
          basta, e su un telefono costavano due righe di schermo. */}
      {/* L'avviso sta qui e non solo nella Plancia perché è qui che si aggiusta:
          un tocco e l'elenco mostra solo quelli, con accanto i comandi per
          modificarli o toglierli. Assegnarli da solo a un magazzino a caso non
          lo faccio: quale sia il magazzino giusto lo sa solo chi cucina. */}
      {tab === "prodotti" && fuoriMag.length > 0 && (
        <div className="rounded-2xl px-3.5 py-3 mb-3" style={{ background: "#F1F4FB", border: `1.5px solid ${T.bordo}` }}>
          <div className="text-sm font-bold" style={{ color: T.ink }}>
            {fuoriMag.length} {fuoriMag.length === 1 ? "prodotto non sta" : "prodotti non stanno"} in nessun magazzino
          </div>
          <div className="text-xs mt-0.5" style={{ color: T.dim }}>
            Nessuno li conta, non finiscono mai in un ordine e l'inventario non li incontra.
            Vanno assegnati a un magazzino, o togli quelli che non usi più.
          </div>
          {/* IL RIMEDIO STA DENTRO IL MESSAGGIO.
              Prima qui c'era un tasto solo, e filtrava: l'avviso diceva «vanno
              assegnati a un magazzino» e poi ti lasciava a guardarli. Il tasto
              che li assegna esisteva, ma stava in Magazzini. Un cartello che
              nomina un problema deve portare con sé la strada per risolverlo,
              se no e' solo un rimprovero. */}
          <div className="flex gap-2 flex-wrap mt-2">
            <button onClick={() => setDove(fuoriMag[0])}
              className="rounded-full px-3 py-2 text-xs font-extrabold"
              style={{ background: T.verde, color: "#fff" }}>
              Assegna «{fuoriMag[0]?.nome}» adesso
            </button>
            <button onClick={() => setSoloFuori((v) => !v)}
              className="rounded-full px-3 py-2 text-xs font-extrabold"
              style={filtroFuori
                ? { background: T.blu, color: "#fff" }
                : { background: "#E7ECF7", color: T.blu }}>
              {filtroFuori ? "Mostra tutti i prodotti" : `Mostra solo questi ${fuoriMag.length}`}
            </button>
          </div>
        </div>
      )}
      {(filtrata || filtroFuori) && (
        <div className="text-sm font-bold mb-2 px-1" style={{ color: T.dim }}>
          {conteggio} {conteggio === 1 ? "risultato" : "risultati"}
          {filtroFuori && tab === "prodotti" && " · solo quelli in nessun magazzino"}
        </div>
      )}

      {filtrata && conteggio === 0 && (
        <Vuoto icona={Search} titolo="Nessun risultato" testo={`Nessun ${etichette[tab]} corrisponde ai filtri.`} />
      )}

      <div key={tab} className="sc-fade flex flex-col gap-2">
        {/* Ogni riga dice se è in uso e SU QUANTI, non su chi: il numero basta
            per sapere se si può toccare, e i nomi sarebbero un elenco che
            nessuno legge su un telefono. Il cestino compare solo su quello che
            non è collegato a niente: se è in uso, aprirlo spiega perché. */}
        {tab === "unita" && unitaF.map((u) => {
          const usi = usiUnita(stato, u.id);
          return (
            <Riga key={u.id} icona={Ruler} colore={T.blu} titolo={u.nome}
              sotto={usi.tot ? `In uso · ${usiTesto(usi)}` : "Non ancora utilizzata"}
              extra={<Chip colore={T.blu}>{u.simbolo}</Chip>}
              onMod={() => setModal({ tipo: "unita", item: u })}
              onDel={() => setDel({ tipo: "unita", item: u })} />
          );
        })}

        {tab === "categorie" && categorieF.map((c) => {
          const n = usiCategoria(stato, c.id);
          return (
            <Riga key={c.id} icona={Tag} colore={c.colore} titolo={c.nome}
              sotto={n ? `In uso · ${quanti(n, "prodotto", "prodotti")}` : "Non ancora utilizzata"}
              onMod={() => setModal({ tipo: "categorie", item: c })}
              onDel={() => setDel({ tipo: "categorie", item: c })} />
          );
        })}

        {tab === "fornitori" && fornitoriF.map((f) => {
          const n = usiFornitore(stato, f.id);
          return (
            <Riga key={f.id} icona={Truck} colore={T.ambra} titolo={f.nome}
              sotto={n ? `In uso · ${quanti(n, "prodotto", "prodotti")}` : "Non ancora utilizzato"}
              onMod={() => setModal({ tipo: "fornitori", item: f })}
              onDel={() => setDel({ tipo: "fornitori", item: f })} />
          );
        })}

        {tab === "prodotti" && (() => {
          /* Centodue prodotti uno sotto l'altro non si leggono su un telefono.
             Si raggruppano per categoria e si aprono uno alla volta, come nei
             magazzini. Mentre cerchi però si aprono da soli: nascondere un
             risultato di ricerca sarebbe solo un dispetto. */
          /* anche il filtro «solo quelli in nessun magazzino» apre i gruppi: se
             no si toccava il tasto e restavano solo le intestazioni chiuse,
             cioè sembrava che non facesse niente */
          const cercando = !!q.trim() || filtroFuori;
          const gruppi = [];
          for (const c of stato.categorie) {
            const dentro = ordinaPerNome(prodottiF).filter((p) => p.categoriaId === c.id);
            if (dentro.length) gruppi.push({ cat: c, prod: dentro });
          }
          const orfani = ordinaPerNome(prodottiF).filter((p) => !trova(stato.categorie, p.categoriaId));
          if (orfani.length) gruppi.push({ cat: null, prod: orfani });
          const riga = (p) => {
            const cat = trova(stato.categorie, p.categoriaId);
            const forn = trova(stato.fornitori, p.fornitoreId);
            const ecc = eccezioniForn(stato, p);
            /* di un preparato il fornitore non si scrive: non ne ha uno, e un
               «—» al suo posto sembrerebbe un dato mancante da riempire */
            const chi = preparato(p)
              ? "Preparato in laboratorio"
              : `${forn?.nome || "—"}${ecc.length ? ` (+${ecc.length} sede${ecc.length > 1 ? " diverse" : " diversa"})` : ""}`;
            return (
              /* ── PERCHE' QUI NON C'E' PIU' LA TARGHETTA DELLA CATEGORIA ──
                 Su un telefono da 390 punti questa riga aveva circa cento punti
                 per il nome e la riga sotto: «Verdure · base pz · 2 conv.»
                 diventava «Verdure · ba…» e il nome «Patate forno» diventava
                 «Patate f…». Il posto però non mancava: se ne andava un terzo
                 in una targhetta che ripeteva parola per parola l'intestazione
                 del gruppo a due centimetri sopra. I prodotti qui stanno SEMPRE
                 dentro il loro gruppo di categoria — anche mentre cerchi, che i
                 gruppi si aprono ma restano — quindi quella targhetta non ha
                 mai aggiunto niente. Tolta lei, il nome e la riga sotto hanno
                 il doppio dello spazio, e la categoria si legge lo stesso: nel
                 titolo del gruppo, e nel colore dell'icona qui a sinistra. */
              <Riga key={p.id} icona={Package} colore={cat?.colore || T.viola} titolo={p.nome}
                sotto={`${chi} · base ${simboloU(stato, p.uomBase)} · ${Object.keys(p.conv || {}).length} conv.${p.prezzo ? ` · € ${fmtQ(p.prezzo)}` : ""}`}
                perEsteso
                onDove={() => setDove(p)}
                onMod={() => setModal({ tipo: "prodotti", item: p })}
                onDel={() => setDel({ tipo: "prodotti", item: p })} />
            );
          };
          return gruppi.map(({ cat, prod }) => {
            const cid = cat?.id || "_";
            const aperto = cercando || catAperte.has(cid);
            const col = cat?.colore || T.tenue;
            return (
              <div key={cid} className="flex flex-col gap-2">
                <button type="button" aria-expanded={aperto}
                  onClick={() => setCatAperte((s) => {
                    const n = new Set(s); n.has(cid) ? n.delete(cid) : n.add(cid); return n; })}
                  className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 w-full text-left"
                  style={{ background: `${col}12`, border: `1.5px solid ${col}33` }}>
                  <span className="rounded-xl p-2 shrink-0" style={{ background: `${col}22`, color: col }}>
                    <Tag size={15} />
                  </span>
                  <span className="flex-1 min-w-0 font-extrabold truncate" style={{ color: T.ink }}>
                    {cat?.nome || "Senza categoria"}
                  </span>
                  <Chip colore={col}>{prod.length}</Chip>
                  <ChevronRight size={18} style={{ color: col, transition: "transform .2s",
                    transform: aperto ? "rotate(90deg)" : "none" }} />
                </button>
                {aperto && prod.map(riga)}
              </div>
            );
          });
        })()}
      </div>

      <Foglio aperto={!!modal} titolo={modal ? `${modal.item ? "Modifica" : "Nuovo"} ${etichette[modal.tipo]}` : ""}
        onChiudi={() => setModal(null)} larga={modal?.tipo === "prodotti"}>
        {modal?.tipo === "unita" && <FormUnita key={modal.item?.id || "n"} stato={stato} item={modal.item}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setModal(null)} />}
        {modal?.tipo === "categorie" && <FormCategoria key={modal.item?.id || "n"} stato={stato} item={modal.item}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setModal(null)} />}
        {modal?.tipo === "fornitori" && <FormFornitore key={modal.item?.id || "n"} stato={stato} item={modal.item}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setModal(null)} />}
        {modal?.tipo === "prodotti" && <FormProdotto key={modal.item?.id || "n"} stato={stato} item={modal.item}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setModal(null)} />}
      </Foglio>
      <Foglio aperto={!!del} titolo={del ? `Eliminare «${del.item.nome}»?` : ""} onChiudi={() => setDel(null)}>
        {del && <EliminaGuidata key={del.item.id} stato={stato} tipo={del.tipo} item={del.item}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setDel(null)} />}
      </Foglio>
      <Foglio aperto={ricette} titolo="Le dosi delle ricette" onChiudi={() => setRicette(false)} larga>
        {ricette && <FormRicette stato={stato} muta={muta} mostraToast={mostraToast} onChiudi={() => setRicette(false)} />}
      </Foglio>
      <Foglio aperto={prezzi} titolo="Prezzi dei prodotti" onChiudi={() => setPrezzi(false)} larga>
        {prezzi && <FormPrezzi stato={stato} muta={muta} mostraToast={mostraToast} onChiudi={() => setPrezzi(false)} />}
      </Foglio>

      <Foglio aperto={conversioni} titolo="Conversioni da sistemare" onChiudi={() => setConversioni(false)} larga>
        {conversioni && <FormConversioni stato={stato} muta={muta} mostraToast={mostraToast} onChiudi={() => setConversioni(false)} />}
      </Foglio>

      <Foglio aperto={!!dove} titolo={`In quali magazzini sta «${dove?.nome || ""}»`} onChiudi={() => setDove(null)} larga>
        {dove && <FormDoveSta key={dove.id} stato={stato} prod={dove} muta={muta}
          mostraToast={mostraToast} onChiudi={() => setDove(null)} profilo={profilo} />}
      </Foglio>
      <Foglio aperto={bulk} titolo="Modifica prodotti in blocco" onChiudi={() => setBulk(false)} larga>
        {bulk && <FormModificaMulti stato={stato} muta={muta} mostraToast={mostraToast} onChiudi={() => setBulk(false)} />}
      </Foglio>
    </div>
  );
}

/* ─────────── ADMIN · SEDI ─────────── */
function FormSede({ stato, item, muta, mostraToast, onChiudi }) {
  const lab = stato.sedi.filter((s) => s.tipo === "laboratorio");
  const [nome, setNome] = useState(item?.nome || "");
  const [tipo, setTipo] = useState(item?.tipo || "operatore");
  const [labId, setLabId] = useState(item?.labSedeId || lab[0]?.id || "");
  /* il magazzino di cassa (gen-5.96): da dove esce quello che si vende.
     Si sceglie solo modificando una sede esistente — alla creazione i
     magazzini non ci sono ancora — e senza scelta vale la prima linea. */
  const [cassaMagId, setCassaMagId] = useState(item?.cassaMagId || "");
  const magSede = item ? stato.magazzini.filter((m) => m.sedeId === item.id) : [];
  const salva = () => {
    if (!nome.trim()) return mostraToast("Inserisci il nome della sede", "errore");
    if (tipo === "operatore" && !labId) return mostraToast("Crea prima una sede laboratorio di riferimento", "errore");
    muta((s) => {
      if (item) {
        const x = trova(s.sedi, item.id);
        x.nome = nome.trim();
        if (x.tipo === "operatore") x.labSedeId = labId;
        x.cassaMagId = cassaMagId || undefined;
      } else {
        s.sedi.push({ id: uid("sede"), nome: nome.trim(), tipo, ...(tipo === "operatore" ? { labSedeId: labId } : {}) });
      }
    }, `Sede «${nome.trim()}» ${item ? "aggiornata" : "creata"}`);
    onChiudi();
  };
  return (<div className="flex flex-col gap-4">
    <Campo label="Nome sede" valore={nome} onCambia={setNome} placeholder="Es. Trattoria Centro" autoFocus />
    {!item && (
      <div>
        <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Tipo di sede</span>
        <Segmenti valore={tipo} onCambia={setTipo} opzioni={[
          { id: "operatore", nome: "Operatore" }, { id: "laboratorio", nome: "Laboratorio" },
        ]} />
      </div>
    )}
    {(item ? item.tipo : tipo) === "operatore" && (
      lab.length
        ? <Selettore label="Rifornita dal laboratorio" valore={labId} onCambia={setLabId} opzioni={lab} />
        : <p className="text-sm font-semibold" style={{ color: T.ambra }}>
            Nessuna sede laboratorio disponibile: creane una prima.</p>
    )}
    {item && magSede.length > 0 && (
      <Selettore label="Magazzino di cassa" valore={cassaMagId} onCambia={setCassaMagId}
        opzioni={magSede} placeholder="La prima linea della sede (predefinito)" />
    )}
    <PieDiPagina onChiudi={onChiudi} onSalva={salva} />
  </div>);
}

function EliminaSede({ stato, sede, muta, mostraToast, onChiudi }) {
  const [nuovoLabId, setNuovoLabId] = useState("");
  const mag = stato.magazzini.filter((m) => m.sedeId === sede.id);
  const prof = stato.profili.filter((p) => p.sedeId === sede.id);
  const servite = stato.sedi.filter((x) => x.labSedeId === sede.id);
  const rich = stato.richieste.filter((r) => r.daSedeId === sede.id || r.aSedeLabId === sede.id);
  const ord = stato.ordini.filter((o) => o.sedeId === sede.id);
  const altriLab = stato.sedi.filter((x) => x.tipo === "laboratorio" && x.id !== sede.id);
  const nRif = mag.length + prof.length + servite.length + rich.length + ord.length;

  if (servite.length && !altriLab.length) return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: T.ambra }}>
        Questo laboratorio rifornisce {servite.map((x) => x.nome).join(", ")} e non esiste un altro laboratorio
        a cui spostarle: crea prima la nuova sede laboratorio, poi torna qui.
      </p>
      <div className="flex justify-end"><Bottone variante="tonale" onClick={onChiudi}>Ho capito</Bottone></div>
    </div>
  );

  const esegui = () => {
    if (servite.length && !nuovoLabId) return mostraToast("Scegli il laboratorio a cui spostare le sedi servite", "errore");
    muta((s) => eliminaSedeCascata(s, sede.id, nuovoLabId || undefined),
      `Sede «${sede.nome}» eliminata${nRif ? " in cascata (magazzini, profili, richieste e ordini sistemati)" : ""}`);
    mostraToast("Sede eliminata");
    onChiudi();
  };

  return (
    <div className="flex flex-col gap-4">
      {nRif === 0
        ? <p className="text-sm" style={{ color: T.dim }}>La sede non ha collegamenti: sarà rimossa per tutta la rete.</p>
        : (<>
          <p className="text-sm" style={{ color: T.dim }}>«{sede.nome}» è ancora collegata alla rete. In un solo passaggio:</p>
          <div className="flex flex-col gap-1.5 text-sm" style={{ color: T.ink }}>
            {mag.length > 0 && <div>· vengono rimossi <b>{mag.length}</b> magazzin{mag.length === 1 ? "o" : "i"} con articoli e storico ({mag.map((m) => m.nome).join(", ")})</div>}
            {prof.length > 0 && <div>· vengono rimossi <b>{prof.length}</b> profil{prof.length === 1 ? "o" : "i"} ({prof.map((p) => p.nome).join(", ")})</div>}
            {rich.length > 0 && <div>· spariscono <b>{rich.length}</b> richieste collegate</div>}
            {ord.length > 0 && <div>· spariscono <b>{ord.length}</b> righe ordine</div>}
            {servite.length > 0 && <div>· le sedi servite ({servite.map((x) => x.nome).join(", ")}) passano al laboratorio che scegli qui sotto</div>}
          </div>
          {servite.length > 0 && (
            <Selettore label="Nuovo laboratorio per le sedi servite" valore={nuovoLabId}
              onCambia={setNuovoLabId} opzioni={altriLab} />
          )}
          <p className="text-xs" style={{ color: T.ambra }}>
            Vale per tutta la rete e non è reversibile: se hai dubbi, crea prima un punto di ripristino da Sistema.
          </p>
        </>)}
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone variante="pericolo" icona={Trash2} disabilitato={servite.length > 0 && !nuovoLabId}
          onClick={esegui}>{nRif ? "Elimina in cascata" : "Elimina"}</Bottone>
      </div>
    </div>
  );
}

function VistaSedi({ stato, muta, mostraToast }) {
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const lab = stato.sedi.filter((s) => s.tipo === "laboratorio");
  const ops = stato.sedi.filter((s) => s.tipo === "operatore");

  const CartaSede = ({ sede }) => {
    const isLab = sede.tipo === "laboratorio";
    const mag = stato.magazzini.filter((m) => m.sedeId === sede.id);
    const servite = ops.filter((o) => o.labSedeId === sede.id);
    const rifornita = trova(stato.sedi, sede.labSedeId);
    return (
      <Scheda className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl p-3 shrink-0"
            style={{ background: isLab ? "#E7F7FA" : "#EAF0FE", color: isLab ? T.ciano : T.blu }}>
            {isLab ? <FlaskConical size={20} /> : <Store size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-lg leading-tight" style={{ color: T.ink }}>{sede.nome}</div>
            <div className="text-xs mt-0.5" style={{ color: T.dim }}>
              {isLab
                ? `Rifornisce ${servite.length} sedi operatore`
                : `Rifornita da ${rifornita?.nome || "—"}`}
            </div>
          </div>
          <Chip colore={isLab ? T.ciano : T.blu}>{isLab ? "Laboratorio" : "Operatore"}</Chip>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {isLab && servite.map((o) => <Chip key={o.id} colore={T.blu}><Store size={11} /> {o.nome}</Chip>)}
          {mag.map((m) => <Chip key={m.id} colore={TIPI_MAG[m.tipo].colore}>{m.nome}</Chip>)}
          {mag.length === 0 && <span className="text-xs" style={{ color: T.tenue }}>Nessun magazzino: crealo dal pannello Magazzini</span>}
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Bottone variante="tonale" piccolo icona={Pencil} onClick={() => setModal({ item: sede })}>Modifica</Bottone>
          <Bottone variante="pericolo" piccolo icona={Trash2} onClick={() => setDel(sede)}>Elimina</Bottone>
        </div>
      </Scheda>
    );
  };

  return (
    <div>
      <Intesta titolo="Sedi" sotto="Laboratori e sedi operatore, logicamente separati ma collegati"
        azione={<Bottone icona={Plus} onClick={() => setModal({})}>Nuova sede</Bottone>} />
      <div className="text-sm font-extrabold uppercase tracking-wide mb-2" style={{ color: T.tenue }}>Laboratori</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {lab.map((s) => <CartaSede key={s.id} sede={s} />)}
        {lab.length === 0 && <Scheda className="md:col-span-2"><Vuoto icona={FlaskConical}
          titolo="Nessun laboratorio" testo="Crea una sede laboratorio: sarà il punto di rifornimento delle sedi operatore." /></Scheda>}
      </div>
      <div className="text-sm font-extrabold uppercase tracking-wide mb-2" style={{ color: T.tenue }}>Sedi operatore</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ops.map((s) => <CartaSede key={s.id} sede={s} />)}
        {ops.length === 0 && <Scheda className="md:col-span-2"><Vuoto icona={Store}
          titolo="Nessuna sede operatore" testo="Aggiungi le sedi dove si trovano linee e magazzini retro." /></Scheda>}
      </div>

      <Foglio aperto={!!modal} titolo={modal?.item ? "Modifica sede" : "Nuova sede"} onChiudi={() => setModal(null)}>
        {modal && <FormSede key={modal.item?.id || "n"} stato={stato} item={modal.item}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setModal(null)} />}
      </Foglio>
      <Foglio aperto={!!del} titolo={del ? `Eliminare «${del.nome}»?` : ""} onChiudi={() => setDel(null)}>
        {del && <EliminaSede key={del.id} stato={stato} sede={del} muta={muta}
          mostraToast={mostraToast} onChiudi={() => setDel(null)} />}
      </Foglio>
    </div>
  );
}

/* ─────────── ADMIN · PROFILI ─────────── */
function FormProfilo({ stato, item, muta, mostraToast, onChiudi }) {
  const [nome, setNome] = useState(item?.nome || "");
  const [ruolo, setRuolo] = useState(item?.ruolo || "operatore");
  const [colore, setColore] = useState(item?.colore || PALETTE[Math.floor(Math.random() * PALETTE.length)]);
  const [sedeId, setSedeId] = useState(item?.sedeId || "");
  const [magIds, setMagIds] = useState(item?.magazziniIds || []);
  const [struttura, setStruttura] = useState(!!item?.struttura);
  const [correzioni, setCorrezioni] = useState(!!item?.correzioni);
  const [ordini, setOrdini] = useState(!!item?.ordini);
  const [cassa, setCassa] = useState(!!item?.cassa);
  const [pin, setPin] = useState("");

  const sediOk = stato.sedi.filter((s) => (ruolo === "laboratorio" ? s.tipo === "laboratorio" : s.tipo === "operatore"));
  const lineeSede = stato.magazzini.filter((m) => m.sedeId === sedeId && m.tipo.startsWith("linea"));
  const cambiaRuolo = (r) => { setRuolo(r); setSedeId(""); setMagIds([]); };
  const toggleMag = (id) => setMagIds((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  /* commento dal vivo sotto al campo: chi scrive deve vedere subito se
     quello che sta digitando diventerà davvero il nuovo PIN */
  const pinKo = !!pin && (/\D/.test(pin) || pin.length !== 4);
  const pinOk = /^\d{4}$/.test(pin);
  const pinAvviso = !pin
    ? (item ? "Lascialo vuoto per non cambiare il PIN." : "Si entra da una tastiera numerica: quattro cifre.")
    : /\D/.test(pin) ? "Solo numeri: niente lettere, spazi o simboli."
    : pin.length !== 4 ? `${pin.length} cifre: devono essere esattamente 4.`
    : "Va bene. Ricordati di comunicarlo alla persona.";

  const salva = async () => {
    if (!nome.trim()) return mostraToast("Inserisci il nome", "errore");
    if (ruolo !== "admin" && !sedeId) return mostraToast("Seleziona la sede del profilo", "errore");
    if (pinKo) return mostraToast(/\D/.test(pin)
      ? "Il PIN accetta solo numeri: quattro cifre" : "Il PIN deve avere esattamente quattro cifre", "errore");
    if (!item && !pinOk) return mostraToast("Imposta un PIN di 4 cifre", "errore");
    const pinHash = pin ? await hashPin(pin) : item.pinHash;
    muta((s) => {
      const dati = {
        nome: nome.trim(), ruolo, colore, pinHash,
        sedeId: ruolo === "admin" ? undefined : sedeId,
        magazziniIds: ruolo === "operatore" ? magIds : undefined,
        struttura: ruolo === "admin" ? undefined : (struttura || undefined),
        correzioni: ruolo === "admin" ? undefined : (correzioni || undefined),
        ordini: ruolo === "admin" ? undefined : (ordini || undefined),
        cassa: ruolo === "admin" ? undefined : (cassa || undefined),
      };
      if (item) Object.assign(trova(s.profili, item.id), dati);
      else s.profili.push({ id: uid("pr"), ...dati });
    }, `Profilo «${nome.trim()}» ${item ? (pin ? "aggiornato, con PIN nuovo" : "aggiornato") : "creato"}`);
    if (item && pin) mostraToast(`Nuovo PIN attivo per «${nome.trim()}»`);
    onChiudi();
  };

  return (<div className="flex flex-col gap-4">
    <Campo label="Nome" valore={nome} onCambia={setNome} placeholder="Es. Marco" autoFocus />
    <div>
      <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Ruolo</span>
      <Segmenti valore={ruolo} onCambia={cambiaRuolo} opzioni={[
        { id: "operatore", nome: "Operatore" }, { id: "laboratorio", nome: "Laboratorio" }, { id: "admin", nome: "Admin" },
      ]} />
    </div>
    {ruolo !== "admin" && (
      sediOk.length
        ? <Selettore label={ruolo === "laboratorio" ? "Sede laboratorio" : "Sede operatore"}
            valore={sedeId} onCambia={(v) => { setSedeId(v); setMagIds([]); }} opzioni={sediOk} />
        : <p className="text-sm font-semibold" style={{ color: T.ambra }}>Nessuna sede di questo tipo: creala prima da «Sedi».</p>
    )}
    {ruolo === "operatore" && sedeId && (
      <div>
        <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Magazzini linea assegnati</span>
        {lineeSede.length === 0
          ? <p className="text-sm" style={{ color: T.tenue }}>Questa sede non ha ancora magazzini linea: creali dal pannello Magazzini.</p>
          : <div className="flex flex-wrap gap-2">
              {lineeSede.map((m) => {
                const sel = magIds.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggleMag(m.id)}
                    className="rounded-full px-3.5 py-2 text-sm font-bold flex items-center gap-1.5"
                    style={sel
                      ? { background: T.grad, color: "#fff" }
                      : { background: "#F0F3FB", color: T.dim, border: `1px solid ${T.bordo}` }}>
                    {sel && <Check size={13} />}{m.nome}
                  </button>
                );
              })}
            </div>}
      </div>
    )}
    {ruolo !== "admin" && (() => {
      /* i TRE interruttori (gen-5.95), la stessa grafica del primo: di
         solito restano spenti — il mestiere non passa da qui */
      const InterruttoreAut = ({ acceso, onCambia, titolo, sotto }) => (
        <button type="button" onClick={onCambia} aria-pressed={acceso}
          className="flex items-start gap-3 rounded-2xl px-3.5 py-3 text-left w-full"
          style={acceso
            ? { background: "#EAF0FE", border: `1.5px solid ${T.blu}` }
            : { background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: acceso ? T.blu : "#fff", border: `1.5px solid ${acceso ? T.blu : T.tenue}` }}>
            {acceso && <Check size={13} color="#fff" />}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-extrabold" style={{ color: T.ink }}>{titolo}</span>
            <span className="block text-xs mt-0.5" style={{ color: T.dim }}>{sotto}</span>
          </span>
        </button>
      );
      return (
        <div className="flex flex-col gap-2">
          <span className="block text-sm font-bold" style={{ color: T.ink }}>
            Autorizzazioni <span className="font-normal" style={{ color: T.tenue }}>· di solito restano spente</span>
          </span>
          <InterruttoreAut acceso={correzioni} onCambia={() => setCorrezioni((v) => !v)}
            titolo="Può correggere le quantità"
            sotto="Rettifiche, scarti, trasferimenti, inventario e comandi quantità in Plancia. Contare, produrre, evadere e ricevere la merce restano comunque a tutti." />
          <InterruttoreAut acceso={ordini} onCambia={() => setOrdini((v) => !v)}
            titolo="Può gestire gli ordini"
            sotto="Ricalcolo dei fabbisogni, segnare ordinato, togliere righe, report e testi da mandare. Ricevere la merce arrivata resta a tutti." />
          <InterruttoreAut acceso={cassa} onCambia={() => setCassa((v) => !v)}
            titolo="Può battere in cassa"
            sotto="La vista Cassa: vendite al cliente con scarico automatico dal magazzino di cassa della sede. In barra prende il posto della Plancia. Non comprende correzioni né ordini." />
          <InterruttoreAut acceso={struttura} onCambia={() => setStruttura((v) => !v)}
            titolo="Può modificare la struttura dei magazzini"
            sotto="Aggiungere e togliere articoli, soglie, livelli previsti, unità, spostare in blocco. Comprende anche le correzioni delle quantità." />
        </div>
      );
    })()}
    <SceltaColore valore={colore} onCambia={setColore} />
    <Campo label={item ? "Nuovo PIN · 4 cifre (facoltativo)" : "PIN di accesso · 4 cifre"} valore={pin}
      onCambia={(v) => setPin(v.slice(0, 16))} tipo="password"
      inputMode="numeric" maxLength={16}
      suggerimento={<span style={{ color: pinKo ? T.rosso : pinOk ? T.verde : T.tenue, fontWeight: pinKo ? 700 : 400 }}>{pinAvviso}</span>}
      placeholder={item ? "lascia vuoto per non cambiarlo" : "es. 4821"} />
    <PieDiPagina onChiudi={onChiudi} onSalva={salva} />
  </div>);
}

function VistaProfili({ stato, muta, mostraToast, profilo }) {
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);

  const elimina = () => {
    const p = del;
    if (p.id === profilo.id) { setDel(null); return mostraToast("Non puoi eliminare il profilo con cui sei connesso", "errore"); }
    if (p.ruolo === "admin" && stato.profili.filter((x) => x.ruolo === "admin").length <= 1) {
      setDel(null); return mostraToast("Deve restare almeno un profilo Admin", "errore");
    }
    muta((s) => { s.profili = s.profili.filter((x) => x.id !== p.id); }, `Profilo «${p.nome}» eliminato`);
    setDel(null);
  };

  return (
    <div>
      <Intesta titolo="Profili" sotto="Accessi con PIN: admin, laboratorio e operatori con magazzini assegnati"
        azione={<Bottone icona={Plus} onClick={() => setModal({})}>Nuovo profilo</Bottone>} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {stato.profili.map((p) => {
          const R = RUOLI[p.ruolo];
          const sede = p.sedeId ? trova(stato.sedi, p.sedeId) : null;
          return (
            <Scheda key={p.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar nome={p.nome} colore={p.colore} size={46} />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold truncate" style={{ color: T.ink }}>
                    {p.nome}{p.id === profilo.id && <span className="text-xs font-bold" style={{ color: T.tenue }}> · tu</span>}
                  </div>
                  <div className="text-xs truncate" style={{ color: T.dim }}>{sede?.nome || "Tutte le sedi"}</div>
                </div>
                <Chip colore={R.colore}><R.icona size={12} /> {R.nome}</Chip>
              </div>
              {p.ruolo === "operatore" && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(p.magazziniIds || []).map((id) => {
                    const m = trova(stato.magazzini, id);
                    return m ? <Chip key={id} colore={TIPI_MAG[m.tipo].colore}>{m.nome}</Chip> : null;
                  })}
                  {!(p.magazziniIds || []).length &&
                    <span className="text-xs" style={{ color: T.tenue }}>Nessun magazzino assegnato</span>}
                </div>
              )}
              <div className="flex gap-2 justify-end mt-3">
                <Bottone variante="tonale" piccolo icona={Pencil} onClick={() => setModal({ item: p })}>Modifica</Bottone>
                <Bottone variante="pericolo" piccolo icona={Trash2} onClick={() => setDel(p)}>Elimina</Bottone>
              </div>
            </Scheda>
          );
        })}
      </div>

      <Foglio aperto={!!modal} titolo={modal?.item ? `Modifica ${modal.item.nome}` : "Nuovo profilo"} onChiudi={() => setModal(null)}>
        {modal && <FormProfilo key={modal.item?.id || "n"} stato={stato} item={modal.item}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setModal(null)} />}
      </Foglio>
      <Conferma aperto={!!del} titolo={`Eliminare «${del?.nome}»?`}
        testo="Il profilo non potrà più accedere all'app." onNo={() => setDel(null)} onSi={elimina} />
    </div>
  );
}

/* ═══════════════ GENERAZIONE 2 ═══════════════ */
const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
const puliziaNum = (v) => v.replace(/[^\d.,]/g, "");
/* Nel conteggio di linea il segno meno vuol dire qualcosa: «non ne ho, e me ne
   serve piu' del previsto». In tutti gli altri campi (prezzi, soglie, conteggio
   d'inventario) un meno non ha senso e puliziaNum lo butta via: per questo sono
   due funzioni separate e non un parametro. Il meno vale solo in testa. */
const puliziaNumNeg = (v) => {
  const s = String(v).replace(/[^\d.,-]/g, "");
  return (s.startsWith("-") ? "-" : "") + s.replace(/-/g, "");
};
const unitaProdotto = (stato, prod) =>
  [prod.uomBase, ...Object.keys(prod.conv || {})].map((id) => trova(stato.unita, id)).filter(Boolean);
const labelU = (u) => `${u.nome} (${u.simbolo})`;
const prodottoUsato = (s, id) =>
  s.magazzini.some((m) => m.articoli.some((a) => a.prodottoId === id)) ||
  s.richieste.some((r) => r.prodottoId === id) || s.ordini.some((o) => o.prodottoId === id);

/* ─────────── QUELLO CHE NON SI COMPRA, SI PREPARA ───────────
   Certi prodotti non hanno un fornitore perché non si comprano: si fanno in
   laboratorio mettendo insieme altri prodotti. Obbligarli ad averne uno non è
   un dettaglio di anagrafica, è una bugia che si propaga: nasce una riga
   d'ordine indirizzata a qualcuno che quella cosa non la venderà mai, finisce
   nel report che si manda al fornitore, e il giorno che metti i prezzi ti fa
   «spendere» soldi che non hai speso. Da qui in giù la regola è una sola: per
   un preparato non nasce MAI un ordine a un fornitore. */
const preparato = (p) => !!p?.preparato;

/* ═══════════════ LE RICETTE ═══════════════

   Una ricetta dice due cose: quanto ne esce (la RESA) e cosa ci vuole per
   quella resa (gli INGREDIENTI). Da qui si ricava tutto il resto per
   proporzione — se la ricetta fa 20 pezzi con 1 kg di farina, farne 30 ne
   consuma 1,5.

   La regola che conta, e che e' stata una scelta esplicita: gli ingredienti
   si scalano SOLO quando qualcuno dice «ho prodotto». Mai da una correzione a
   mano della giacenza. Alzare un numero a mano vuol dire tante cose diverse —
   ho ricontato, ne e' arrivata dell'altra, avevo sbagliato ieri — e solo una
   di quelle e' «l'ho appena fatto». Indovinare quale sarebbe scalare farina
   che nessuno ha usato. */
const conRicetta = (p) => !!(p?.ricetta && p.ricetta.resa > 0 && (p.ricetta.ingredienti || []).length);

/* Da «ne ho fatti N» all'elenco di cosa esce, e da dove.
   NON tocca niente: prepara solo il conto, perche' quel conto va MOSTRATO
   prima di essere applicato. Chi produce deve poter vedere «la farina la
   prendo dal Secco fm» e dire di no PRIMA che i numeri si muovano. Un
   automatismo che scala di nascosto è indistinguibile da un errore. */
function calcoloProduzione(stato, { magProd, prod, quanto, uomFatto }) {
  const out = { righe: [], problemi: [], fattore: 0 };
  if (!conRicetta(prod)) {
    out.problemi.push("Non c'è una ricetta per questo prodotto: la quantità sale, ma non si scala nessun ingrediente.");
    return out;
  }
  const r = prod.ricetta;
  const inResa = uomFatto === r.uomResa ? quanto : converti(prod, quanto, uomFatto, r.uomResa);
  if (inResa == null) {
    out.problemi.push("Manca la conversione fra l'unità del magazzino e quella della ricetta: non so a quante ricette corrisponde.");
    return out;
  }
  out.fattore = inResa / r.resa;
  for (const ing of r.ingredienti) {
    const ip = trova(stato.prodotti, ing.prodottoId);
    if (!ip) { out.problemi.push("Un ingrediente della ricetta non è più a catalogo: la ricetta va rivista."); continue; }
    const serve = ing.qty * out.fattore;
    /* Da dove esce: un magazzino della STESSA sede che ce l'ha davvero.
       Fra più candidati vince chi ne ha abbastanza; se nessuno ne ha
       abbastanza, chi ne ha di più. Non si spezza il prelievo fra due
       magazzini: meglio un'uscita sola e leggibile che due mezze da
       ricostruire poi nello storico. */
    let scelto = null, art = null, meglio = -Infinity, quantoScalare = 0;
    for (const m of stato.magazzini) {
      if (m.sedeId !== magProd?.sedeId) continue;
      const a = (m.articoli || []).find((x) => x.prodottoId === ing.prodottoId);
      if (!a) continue;
      const q = a.uomId === ing.uomId ? serve : converti(ip, serve, ing.uomId, a.uomId);
      if (q == null) continue;
      const punti = (a.qty - q >= -1e-9 ? 1e9 : 0) + a.qty;
      if (punti > meglio) { meglio = punti; scelto = m; art = a; quantoScalare = q; }
    }
    if (!scelto) {
      out.problemi.push(`«${ip.nome}» non lo trovo in nessun magazzino di questa sede (o manca la conversione): non lo scalo da nessuna parte.`);
      continue;
    }
    out.righe.push({ prodottoId: ip.id, nome: ip.nome, magId: scelto.id, magNome: scelto.nome,
      quanto: quantoScalare, uomId: art.uomId, prima: art.qty, dopo: +(art.qty - quantoScalare).toFixed(4),
      bastava: art.qty - quantoScalare >= -1e-9 });
  }
  return out;
}

/* L'applicazione vera. Prende SOLO identificatori e numeri — niente
   riferimenti presi dallo stato di fuori: questo pezzo gira su una copia, e
   puo' essere rieseguito quando la coda si riallinea col server. */
function applicaProduzione(s, { magId, prodottoId, quanto, righe, chi, nomeProd }) {
  const m = trova(s.magazzini, magId);
  const a = m && (m.articoli || []).find((x) => x.prodottoId === prodottoId);
  if (!a) return;
  a.qty = +(a.qty + quanto).toFixed(4);
  registraMov(s, { magId: m.id, prodottoId, uomId: a.uomId, delta: quanto, dopo: a.qty, causale: "produzione", chi });
  for (const r of righe || []) {
    const mm = trova(s.magazzini, r.magId);
    const aa = mm && (mm.articoli || []).find((x) => x.prodottoId === r.prodottoId);
    if (!aa) continue;
    aa.qty = +(aa.qty - r.quanto).toFixed(4);
    registraMov(s, { magId: mm.id, prodottoId: r.prodottoId, uomId: aa.uomId, delta: -r.quanto,
      dopo: aa.qty, causale: "consumo", chi, rif: nomeProd });
  }
}

/* La richiesta che parte da un magazzino di RETRO. È la stessa cosa che manda
   una linea quando è sotto scorta — stessi campi, stessa coda del laboratorio,
   stessa evasione — solo che parte da un retro invece che da una linea. Se una
   richiesta per quel prodotto è già in attesa si aggiorna quella: due
   richieste per la stessa cosa fanno arrivare il doppio della merce. */
function chiediAlLaboratorio(bozza, prod, artR, sedeId, magR) {
  const mag = magR || bozza.magazzini.find((m) => (m.articoli || []).includes(artR));
  const vecchia = (bozza.richieste || []).find((r) => r.stato === "in-attesa"
    && r.prodottoId === prod.id && r.daMagazzinoId === mag?.id);
  const deficit = Math.max(0, parOggi(artR) - artR.qty);
  if (deficit <= 1e-9) {
    /* rientrato: una richiesta aperta per una cosa che non manca più va tolta,
       se no il laboratorio prepara roba che nessuno aspetta */
    if (vecchia) bozza.richieste = bozza.richieste.filter((r) => r !== vecchia);
    return 0;
  }
  const sede = trova(bozza.sedi, sedeId);
  /* Senza un laboratorio a cui chiedere non si inventa un destinatario: la
     richiesta non la vedrebbe nessuno. Meglio non crearla — la scorta bassa
     resta comunque visibile dai magazzini. */
  if (!sede?.labSedeId || !mag) return 0;
  const uomLav = prod.uomLavorazione || prod.uomBase;
  const grezzo = converti(prod, deficit, artR.uomId, uomLav) ?? deficit;
  const qty = prod.soloInteri ? suInteri(grezzo) : grezzo;
  if (qty <= 1e-9) return 0;
  const riga = {
    id: vecchia?.id || uid("ric"), t: Date.now(), daSedeId: sedeId, aSedeLabId: sede.labSedeId,
    daMagazzinoId: mag.id, magNome: mag.nome, prodottoId: prod.id,
    qty, uomId: uomLav, qtyLinea: deficit, uomLineaId: artR.uomId,
    stato: "in-attesa", creataDa: "fabbisogno automatico",
  };
  if (vecchia) Object.assign(vecchia, riga); else bozza.richieste.unshift(riga);
  return qty;
}

/* ─────────── QUELLO CHE È GIÀ PARTITO E NON È ANCORA ARRIVATO ───────────
   Il difetto n.1 del consiglio del 2 agosto, e l'unico che costava soldi tutti
   i giorni. Il retro ha bisogno di 8 kg di farina, parte l'ordine, lo si segna
   «ordinato». Il giorno dopo la merce non è ancora arrivata — quindi in
   magazzino non c'è, quindi il fabbisogno è ancora 8 — e ogni «Ricalcola»,
   ogni conteggio di linea che attinge dal retro, ogni evasione del laboratorio
   rifaceva la domanda da capo accanto a quella già partita. Al fornitore se ne
   chiedevano 16 per un bisogno di 8.

   La riga in stato «ordinato» è esattamente la merce in viaggio: partita, non
   ancora scaricata. Quelle «ricevute» hanno già caricato il magazzino, quindi
   stanno già dentro artR.qty e sottrarle sarebbe l'errore opposto — ordinare
   di meno. Quelle «da ordinare» non sono partite: sono la riga che stiamo per
   riscrivere.

   Ogni riga porta la SUA unità di misura, che può non essere più quella di
   oggi se nel frattempo è cambiata l'unità del fornitore. Se non si sa
   convertirla NON si sottrae: fra i due sbagli possibili, ordinare due volte
   costa dei soldi, non ordinare abbastanza ferma la cucina.

   E per la stessa ragione la fiducia in una riga «ordinato» SCADE. Nessuno
   obbliga a registrare una consegna: basta che una volta ci si dimentichi, e
   quella riga resterebbe lì a dire «tranquillo, sta arrivando» per sempre —
   il prodotto smetterebbe di comparire negli ordini e l'unico modo per
   accorgersene sarebbe la cucina che rimane a secco. Dopo GIORNI_IN_VIAGGIO
   la riga non fa più da tappo: l'app torna a chiederla, com'era prima di
   questa correzione. Ordinare due volte una cosa che tarda da una settimana
   costa dei soldi; non ordinarla mai più costa il servizio. Il numero è
   scritto qui in un posto solo apposta: se i fornitori sono più lenti, si
   cambia questo. */
const GIORNI_IN_VIAGGIO = 7;
const giaInViaggio = (bozza, prod, sedeId, tipo, uom) => {
  const limite = Date.now() - GIORNI_IN_VIAGGIO * 86400000;
  return (bozza.ordini || []).reduce((tot, o) => {
    if (o.stato !== "ordinato" || o.tipo !== tipo || o.sedeId !== sedeId || o.prodottoId !== prod.id) return tot;
    if ((o.tOrdine || o.t || 0) < limite) return tot;
    const q = o.uomId === uom ? o.qty : converti(prod, o.qty, o.uomId, uom);
    return q == null ? tot : tot + q;
  }, 0);
};

/* Di righe «da ordinare» per la stessa cosa ce ne deve essere UNA. Prima di
   questa correzione se ne potevano formare due — due ordini partiti per lo
   stesso fabbisogno, consegnati tutti e due a metà, due residui — e il
   ricalcolo ne aggiornava solo la prima: l'altra restava lì per sempre a
   chiedere merce che non serviva. Qui si tiene la prima e si tolgono le altre,
   così i doppioni già in giro si riassorbono al primo ricalcolo invece di
   restare a vita. Si scorre all'indietro perché togliere una riga più avanti
   non sposta quelle che devono ancora essere guardate. */
function unicaRigaAperta(bozza, prod, sedeId, tipo) {
  let tenuta = -1;
  for (let i = bozza.ordini.length - 1; i >= 0; i--) {
    const o = bozza.ordini[i];
    if (o.tipo !== tipo || o.sedeId !== sedeId || o.prodottoId !== prod.id || o.stato !== "da-ordinare") continue;
    if (tenuta >= 0) bozza.ordini.splice(tenuta, 1);
    tenuta = i;
  }
  return tenuta;
}

/* aggiorna la riga d'ordine «diretto» in base al deficit del retro */
function aggiornaOrdineDiretto(bozza, prod, artR, sedeId, magR, conta) {
  const uom = prod.uomFornitoreDiretto || prod.uomBase;
  const deficit = Math.max(0, parOggi(artR) - artR.qty);
  const conv = converti(prod, deficit, artR.uomId, uom) ?? deficit;
  const viaggio = giaInViaggio(bozza, prod, sedeId, "diretto", uom);
  const qty = Math.ceil(conv - viaggio - 1e-9);
  const idx = unicaRigaAperta(bozza, prod, sedeId, "diretto");
  /* Un preparato il retro non lo ordina: lo chiede al laboratorio, come farebbe
     una linea. E se una riga d'ordine era rimasta lì da prima della spunta va
     tolta: tenerla vorrebbe dire portarsi dietro un acquisto che nessuno farà. */
  if (preparato(prod)) {
    if (idx >= 0) bozza.ordini.splice(idx, 1);
    return chiediAlLaboratorio(bozza, prod, artR, sedeId, magR);
  }
  if (qty <= 0) {
    /* «serve, ma è già in arrivo» non è la stessa cosa di «non serve»: chi
       preme Ricalcola e non vede comparire niente deve sapere quale dei due è,
       se no va a riordinare a mano ed è come se il difetto ci fosse ancora. */
    if (conta && conv > 1e-9 && viaggio > 1e-9) conta.inArrivo++;
    if (idx >= 0) bozza.ordini.splice(idx, 1);
    return 0;
  }
  const riga = {
    id: idx >= 0 ? bozza.ordini[idx].id : uid("ord"), t: Date.now(), tipo: "diretto",
    sedeId, prodottoId: prod.id, fornitoreId: fornitoreDi(prod, sedeId), qty, uomId: uom, stato: "da-ordinare",
  };
  if (idx >= 0) bozza.ordini[idx] = riga; else bozza.ordini.unshift(riga);
  return qty;
}

/* ─────────── EDITOR PRODOTTO (conversioni + UdM di contesto) ─────────── */
function FormProdotto({ stato, item, muta, mostraToast, onChiudi }) {
  const [nome, setNome] = useState(item?.nome || "");
  const [categoriaId, setCategoriaId] = useState(item?.categoriaId || stato.categorie[0]?.id || "");
  const [fornitoreId, setFornitoreId] = useState(item?.fornitoreId || stato.fornitori[0]?.id || "");
  const [prep, setPrep] = useState(!!item?.preparato);
  const [fornSede, setFornSede] = useState(() => ({ ...(item?.fornSede || {}) }));
  const [ricResa, setRicResa] = useState(item?.ricetta?.resa != null ? String(item.ricetta.resa) : "");
  const [ricUom, setRicUom] = useState(item?.ricetta?.uomResa || "");
  const [ricIng, setRicIng] = useState(() => (item?.ricetta?.ingredienti || [])
    .map((x) => ({ prodottoId: x.prodottoId, qty: String(x.qty), uomId: x.uomId })));
  const nEcc = Object.entries(fornSede).filter(([sid, fid]) => fid && fid !== fornitoreId
    && trova(stato.sedi, sid)).length;
  const [uomBase, setUomBase] = useState(item?.uomBase || stato.unita[0]?.id || "");
  const [conv, setConv] = useState(item ? Object.entries(item.conv || {}).map(([uomId, f]) => ({ uomId, f: String(f) })) : []);
  const [uomLav, setUomLav] = useState(item?.uomLavorazione || "");
  const [uomForn, setUomForn] = useState(item?.uomFornitore || "");
  const [uomFornDir, setUomFornDir] = useState(item?.uomFornitoreDiretto || "");
  const [prezzo, setPrezzo] = useState(item?.prezzo != null ? String(item.prezzo) : "");

  const idsCtx = [uomBase, ...conv.map((c) => c.uomId)].filter(Boolean);
  const opzCtx = idsCtx.map((id) => trova(stato.unita, id)).filter(Boolean).map((u) => ({ id: u.id, nome: labelU(u) }));
  const liberi = stato.unita.filter((u) => u.id !== uomBase && !conv.some((c) => c.uomId === u.id));
  const simBase = simboloU(stato, uomBase);

  const aggConv = () => liberi.length && setConv((v) => [...v, { uomId: liberi[0].id, f: "" }]);
  const setRiga = (i, patch) => setConv((v) => v.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const salva = () => {
    if (!nome.trim()) return mostraToast("Inserisci il nome del prodotto", "errore");
    /* a un preparato il fornitore non si chiede: non ce l'ha */
    if (!categoriaId || !uomBase) return mostraToast("Categoria e UdM base sono obbligatorie", "errore");
    if (!prep && !fornitoreId) return mostraToast("Scegli il fornitore, oppure segnalo come preparato in laboratorio", "errore");
    const convObj = {};
    for (const r of conv) {
      const f = num(r.f);
      if (!r.uomId || f == null || f <= 0) return mostraToast("Ogni conversione richiede unità e fattore > 0", "errore");
      convObj[r.uomId] = f;
    }
    const ok = (id) => (idsCtx.includes(id) ? id : uomBase);
    muta((s) => {
      const dati = {
        nome: nome.trim(), categoriaId, fornitoreId, uomBase, conv: convObj,
        /* la spunta si scrive solo quando è vera: così un prodotto comprato
           resta esattamente com'era prima, senza un campo in più che vale
           «no» — e chi legge i dati non deve chiedersi cosa significhi */
        ...(prep ? { preparato: true } : {}),
        /* La ricetta si scrive solo se e' completa e su un preparato. Una
           ricetta a meta' — resa senza ingredienti, o un ingrediente senza
           quantita' — sarebbe peggio di nessuna: farebbe scalare numeri
           sbagliati con l'aria di essere a posto. Quindi o e' intera o non
           c'e'. E se la spunta «si prepara in laboratorio» viene tolta, la
           ricetta se ne va con lei: non ha piu' niente da dire. */
        ricetta: (() => {
          if (!prep) return undefined;
          const resa = num(ricResa);
          const ing = ricIng
            .map((r) => ({ prodottoId: r.prodottoId, qty: num(r.qty), uomId: r.uomId }))
            .filter((r) => r.prodottoId && r.qty > 0 && r.uomId);
          if (!(resa > 0) || !ing.length) return undefined;
          return { resa, uomResa: ok(ricUom || uomBase), ingredienti: ing };
        })(),
        /* si salvano solo le eccezioni vere: quello che coincide col
           fornitore abituale sparisce, se no domani cambi l'abituale e resti
           con dei sosia che non seguono piu' niente. Su un preparato non ne
           esistono proprio: non c'è nessun fornitore da eccepire. */
        fornSede: prep ? {} : Object.fromEntries(Object.entries(fornSede)
          .filter(([sid, fid]) => fid && fid !== fornitoreId && trova(stato.sedi, sid))),
        uomLavorazione: ok(uomLav || uomBase), uomFornitore: ok(uomForn || uomBase),
        uomFornitoreDiretto: ok(uomFornDir || uomBase),
        prezzo: num(prezzo) ?? 0,
      };
      if (item) Object.assign(trova(s.prodotti, item.id), dati);
      else s.prodotti.push({ id: uid("p"), ...dati });
    }, `Prodotto «${nome.trim()}» ${item ? "aggiornato" : "creato"}`);
    onChiudi();
  };

  return (
    <div className="flex flex-col gap-4">
      <Campo label="Nome prodotto" valore={nome} onCambia={setNome} placeholder="Es. Pomodori San Marzano" autoFocus />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Selettore label="Categoria" valore={categoriaId} onCambia={setCategoriaId} opzioni={stato.categorie} />
        {!prep && <Selettore label="Fornitore abituale" valore={fornitoreId} onCambia={setFornitoreId} opzioni={ordinaPerNome(stato.fornitori)} />}
      </div>

      {/* La spunta che dice «questo non si compra». Sta subito sotto la
          categoria perché è la prima cosa da decidere: cambia tutto il resto
          della scheda e cambia dove finisce il prodotto quando manca. */}
      <button type="button" onClick={() => setPrep((v) => !v)} aria-pressed={prep}
        className="flex items-start gap-3 rounded-2xl px-3.5 py-3 text-left w-full"
        style={prep
          ? { background: "#EAF7F1", border: `1.5px solid ${T.verde}` }
          : { background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
        <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: prep ? T.verde : "#fff", border: `1.5px solid ${prep ? T.verde : T.tenue}` }}>
          {prep && <Check size={13} color="#fff" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="font-extrabold block" style={{ color: T.ink }}>Si prepara in laboratorio</span>
          <span className="text-xs block leading-relaxed" style={{ color: T.dim }}>
            {prep
              ? "Non ha un fornitore e non finirà mai in un ordine d'acquisto. Quando manca in una linea o in un retro parte una richiesta al laboratorio; quando manca in laboratorio compare fra le cose da preparare."
              : "Spuntalo per quello che fate voi mettendo insieme altri prodotti: supplì, breccole, ripassati. Senza questa spunta l'app è costretta a inventargli un fornitore."}
          </span>
        </span>
      </button>

      {/* ── LA RICETTA ──
          Compare solo sui preparati, perche' solo lì vuol dire qualcosa. Il
          modello e' due numeri e una lista: quanto ne esce, e cosa ci vuole
          per quella quantità. Tutto il resto si ricava per proporzione, così
          non serve riscrivere la ricetta per fare mezza teglia. */}
      {prep && (
        <div>
          <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: T.ink }}>La ricetta</span>
            <span className="text-xs" style={{ color: T.tenue }}>
              {ricIng.length === 0 ? "nessun ingrediente" : ricIng.length === 1 ? "1 ingrediente" : `${ricIng.length} ingredienti`}
            </span>
          </div>
          <p className="text-xs mb-2 leading-relaxed" style={{ color: T.dim }}>
            Serve per una cosa sola, ma importante: quando il laboratorio segna «ho prodotto»,
            gli ingredienti si scalano da soli dai magazzini della sua sede. Senza ricetta la
            quantità sale e basta, e il magazzino continua a dire che c'è roba che non c'è.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Campo label="Ne escono" valore={ricResa} onCambia={(v) => setRicResa(puliziaNum(v))}
              inputMode="decimal" placeholder="20" />
            <Selettore label="di" valore={ricUom || uomBase} onCambia={setRicUom}
              opzioni={idsCtx.map((id) => ({ id, nome: labelU(trova(stato.unita, id)) }))} />
          </div>
          <div className="flex flex-col gap-2">
            {ricIng.map((r, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <Selettore label={i === 0 ? "Ci vuole" : ""} valore={r.prodottoId}
                    onCambia={(v) => setRicIng(ricIng.map((x, j) => (j === i
                      ? { ...x, prodottoId: v, uomId: trova(stato.prodotti, v)?.uomBase || x.uomId }
                      : x)))}
                    gruppi={gruppiProdotto(stato, stato.prodotti.filter((x) => x.id !== item?.id))}
                    placeholder="— scegli —" />
                </div>
                <div style={{ width: 92 }}>
                  <Campo label={i === 0 ? "quanto" : ""} valore={r.qty}
                    onCambia={(v) => setRicIng(ricIng.map((x, j) => (j === i ? { ...x, qty: puliziaNum(v) } : x)))}
                    inputMode="decimal" placeholder="0" />
                </div>
                <div style={{ width: 108 }}>
                  <Selettore label={i === 0 ? "unità" : ""} valore={r.uomId}
                    onCambia={(v) => setRicIng(ricIng.map((x, j) => (j === i ? { ...x, uomId: v } : x)))}
                    opzioni={stato.unita.map((u) => ({ id: u.id, nome: labelU(u) }))} />
                </div>
                <button type="button" onClick={() => setRicIng(ricIng.filter((_, j) => j !== i))}
                  aria-label="Togli ingrediente" className="rounded-full p-2.5 mb-0.5"
                  style={{ background: "#FCE9EE", color: T.rosso }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <Bottone piccolo variante="tonale" icona={Plus}
              onClick={() => setRicIng([...ricIng, { prodottoId: "", qty: "", uomId: stato.unita[0]?.id || "" }])}>
              Aggiungi ingrediente
            </Bottone>
          </div>
        </div>
      )}

      {!prep && stato.sedi.length > 1 && (
        <div>
          <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: T.ink }}>Dove si compra altrove</span>
            <span className="text-xs" style={{ color: T.tenue }}>
              {nEcc === 0 ? "nessuna eccezione" : nEcc === 1 ? "1 sede diversa" : `${nEcc} sedi diverse`}
            </span>
          </div>
          <p className="text-xs mb-2" style={{ color: T.dim }}>
            Lascia «come sopra» dove vale il fornitore abituale. Serve quando la stessa
            cosa si compra da due parti diverse: gli ordini escono già indirizzati bene.
          </p>
          <div className="flex flex-col gap-1.5">
            {stato.sedi.map((sd) => (
              <div key={sd.id} className="flex items-center gap-2.5 rounded-2xl px-3 py-2"
                style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
                <span className="flex-1 min-w-0 text-sm font-bold truncate" style={{ color: T.ink }}>{sd.nome}</span>
                <select value={fornSede[sd.id] || ""} aria-label={`Fornitore per ${sd.nome}`}
                  onChange={(e) => setFornSede((v) => ({ ...v, [sd.id]: e.target.value }))}
                  className="rounded-xl px-2.5 py-2 text-sm font-bold shrink-0"
                  style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink, maxWidth: "58%" }}>
                  <option value="">come sopra</option>
                  {ordinaPerNome(stato.fornitori).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
      <Selettore label="Unità di misura base" valore={uomBase}
        onCambia={(v) => { setUomBase(v); setConv((c) => c.filter((r) => r.uomId !== v)); }}
        opzioni={stato.unita.map((u) => ({ id: u.id, nome: labelU(u) }))} />

      <Campo label={`Prezzo d'acquisto (€ per ${simBase})`} valore={prezzo}
        onCambia={(v) => setPrezzo(puliziaNum(v))} inputMode="decimal" placeholder="Es. 3,50"
        suggerimento="Costo per unità base · usato per valore di magazzino e food cost. Lascia vuoto se non lo sai." />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold" style={{ color: T.ink }}>Conversioni</span>
          <Bottone variante="tonale" piccolo icona={Plus} onClick={aggConv} disabilitato={!liberi.length}>Aggiungi</Bottone>
        </div>
        <p className="text-xs mb-2" style={{ color: T.tenue }}>1 unità elencata = fattore × {simBase}</p>
        <div className="flex flex-col gap-2">
          {conv.length === 0 && <p className="text-sm" style={{ color: T.tenue }}>Nessuna conversione: il prodotto usa solo {simBase}.</p>}
          {conv.map((r, i) => {
            const scelte = stato.unita.filter((u) => u.id !== uomBase &&
              (u.id === r.uomId || !conv.some((c, j) => j !== i && c.uomId === u.id)));
            return (
              <div key={i} className="flex items-center gap-2">
                <select value={r.uomId} onChange={(e) => setRiga(i, { uomId: e.target.value })}
                  className="flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold min-w-0"
                  style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}`, color: T.ink }}>
                  {scelte.map((u) => <option key={u.id} value={u.id}>{labelU(u)}</option>)}
                </select>
                <span className="text-sm font-bold shrink-0" style={{ color: T.dim }}>=</span>
                <input value={r.f} onChange={(e) => setRiga(i, { f: puliziaNum(e.target.value) })}
                  inputMode="decimal" placeholder="0" aria-label="Fattore"
                  className="w-20 rounded-2xl px-3 py-2.5 text-sm font-bold text-center"
                  style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}`, color: T.ink }} />
                <span className="text-sm font-bold shrink-0 w-10" style={{ color: T.dim }}>{simBase}</span>
                <button onClick={() => setConv((v) => v.filter((_, j) => j !== i))} aria-label="Rimuovi conversione"
                  className="rounded-full p-2 shrink-0" style={{ background: "#FCE9EE", color: T.rosso }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Selettore label="UdM lavorazione" valore={uomLav || uomBase} onCambia={setUomLav} opzioni={opzCtx} />
        <Selettore label="UdM fornitore (lab)" valore={uomForn || uomBase} onCambia={setUomForn} opzioni={opzCtx} />
        <Selettore label="UdM fornitore diretto" valore={uomFornDir || uomBase} onCambia={setUomFornDir} opzioni={opzCtx} />
      </div>
      <p className="text-xs -mt-2" style={{ color: T.tenue }}>
        Lavorazione: ciò che vede il laboratorio · Fornitore (lab): report acquisti del laboratorio ·
        Fornitore diretto: report acquisti della sede operatore.
      </p>
      <PieDiPagina onChiudi={onChiudi} onSalva={salva} />
    </div>
  );
}

/* ─────────── GESTIONE MAGAZZINI ─────────── */
function FormMagazzino({ stato, item, muta, mostraToast, onChiudi, sedeFissa }) {
  const [nome, setNome] = useState(item?.nome || "");
  const [sedeId, setSedeId] = useState(item?.sedeId || sedeFissa || stato.sedi[0]?.id || "");
  const sede = trova(stato.sedi, sedeId);
  const tipi = sede ? (sede.tipo === "laboratorio" ? ["laboratorio"] : ["linea-lab", "linea-retro", "retro"]) : [];
  const [tipo, setTipo] = useState(item?.tipo || tipi[0] || "linea-lab");
  const retroSede = stato.magazzini.filter((m) => m.sedeId === sedeId && m.tipo === "retro" && m.id !== item?.id);
  const [rifId, setRifId] = useState(item?.rifMagazzinoId || retroSede[0]?.id || "");
  const tipoOk = tipi.includes(tipo) ? tipo : tipi[0];

  const salva = () => {
    if (!nome.trim()) return mostraToast("Inserisci il nome del magazzino", "errore");
    if (!sedeId) return mostraToast("Seleziona la sede", "errore");
    if (tipoOk === "linea-retro" && !rifId) return mostraToast("Crea prima un magazzino retro in questa sede", "errore");
    muta((s) => {
      const dati = { nome: nome.trim(), sedeId, tipo: tipoOk, rifMagazzinoId: tipoOk === "linea-retro" ? rifId : undefined };
      if (item) {
        if (item.sedeId !== sedeId) {
          s.magazzini.forEach((x) => { if (x.rifMagazzinoId === item.id) x.rifMagazzinoId = undefined; });
          s.profili.forEach((p) => { if (p.magazziniIds) p.magazziniIds = p.magazziniIds.filter((x) => x !== item.id); });
        }
        Object.assign(trova(s.magazzini, item.id), dati);
      } else s.magazzini.push({ id: uid("mag"), ...dati, articoli: [] });
    }, `Magazzino «${nome.trim()}» ${item ? "aggiornato" : "creato"}`);
    onChiudi();
  };

  return (
    <div className="flex flex-col gap-4">
      <Campo label="Nome magazzino" valore={nome} onCambia={setNome} placeholder="Es. Linea Cucina" autoFocus />
      <Selettore label="Sede" valore={sedeId} onCambia={(v) => { setSedeId(v); setRifId(""); }} opzioni={stato.sedi} />
      {item && item.sedeId !== sedeId && (
        <p className="text-xs -mt-2" style={{ color: T.ambra }}>
          Cambiando sede, il magazzino verrà tolto dalle assegnazioni operatore e dai riferimenti retro della sede attuale.
        </p>
      )}
      <Selettore label="Tipo di magazzino" valore={tipoOk} onCambia={setTipo}
        opzioni={tipi.map((t) => ({ id: t, nome: TIPI_MAG[t].nome }))} />
      {tipoOk === "linea-retro" && (
        retroSede.length
          ? <Selettore label="Retro di riferimento" valore={rifId} onCambia={setRifId} opzioni={retroSede} />
          : <p className="text-sm font-semibold" style={{ color: T.ambra }}>Nessun retro in questa sede: creane uno prima.</p>
      )}
      <PieDiPagina onChiudi={onChiudi} onSalva={salva} />
    </div>
  );
}

function FormArticolo({ stato, mag, art, muta, mostraToast, onChiudi, profilo }) {
  const disponibili = ordinaPerNome(stato.prodotti).filter((p) => !mag.articoli.some((a) => a.prodottoId === p.id));
  const [prodottoId, setProdottoId] = useState(art?.prodottoId || disponibili[0]?.id || "");
  const prod = trova(stato.prodotti, prodottoId);
  /* unità del prodotto + eventuali unità Gastronorm (per comunicare col laboratorio) */
  const uomProd = prod ? unitaProdotto(stato, prod) : [];
  const uomGN = prod ? stato.unita.filter((u) => /^gn\b/i.test((u.simbolo || "").trim()) && !uomProd.some((x) => x.id === u.id)) : [];
  const uomOpz = [...uomProd, ...uomGN];
  const [uomId, setUomId] = useState(art?.uomId || prod?.uomBase || "");
  const [par, setPar] = useState(art ? String(art.par) : "");
  const [qty, setQty] = useState(art ? String(art.qty) : "");
  const [pg, setPg] = useState(() => art?.parGiorni
    ? Object.fromEntries(Object.entries(art.parGiorni).map(([k, v]) => [k, String(v)])) : {});
  const uomOk = uomOpz.some((u) => u.id === uomId) ? uomId : prod?.uomBase;

  /* fasce rapide: compilano più giorni in un colpo (feriale / weekend) */
  const setFascia = (giorni, val) => setPg((v) => { const n = { ...v }; giorni.forEach((d) => { n[d] = val; }); return n; });
  const valFascia = (giorni) => { const vv = giorni.map((d) => pg[d] ?? ""); return vv.every((x) => x === vv[0]) ? vv[0] : ""; };

  const salva = () => {
    const nPar = num(par), nQty = num(qty);
    if (!prodottoId) return mostraToast("Seleziona un prodotto", "errore");
    if (nPar == null || nPar < 0 || nQty == null || nQty < 0)
      return mostraToast("Livello previsto e quantità devono essere numeri validi", "errore");
    const pgNum = {};
    Object.entries(pg).forEach(([g, v]) => { const n = num(v); if (n != null && n >= 0 && String(v).trim() !== "") pgNum[g] = n; });
    const parGiorni = Object.keys(pgNum).length ? pgNum : undefined;
    muta((s) => {
      const m = trova(s.magazzini, mag.id);
      if (art) {
        const a = m.articoli.find((x) => x.prodottoId === art.prodottoId);
        const prima = a.uomId === uomOk ? a.qty : null;
        Object.assign(a, { uomId: uomOk, par: nPar, qty: nQty, parGiorni });
        if (prima != null) registraMov(s, { magId: mag.id, prodottoId: a.prodottoId, uomId: uomOk, delta: nQty - prima, dopo: nQty, causale: "articolo", chi: profilo?.nome });
      } else {
        m.articoli.push({ prodottoId, uomId: uomOk, par: nPar, qty: nQty, parGiorni });
        registraMov(s, { magId: mag.id, prodottoId, uomId: uomOk, delta: nQty, dopo: nQty, causale: "articolo", chi: profilo?.nome });
      }
    }, `${trova(stato.prodotti, prodottoId)?.nome} ${art ? "aggiornato" : "aggiunto"} in «${mag.nome}»`);
    onChiudi();
  };

  return (
    <div className="flex flex-col gap-4">
      {art
        ? <p className="text-base font-extrabold" style={{ color: T.ink }}>{prod?.nome}</p>
        : disponibili.length
          ? <Selettore label="Prodotto" valore={prodottoId}
              onCambia={(v) => { setProdottoId(v); const p = trova(stato.prodotti, v); setUomId(p?.uomBase || ""); }}
              gruppi={gruppiProdotto(stato, disponibili)} />
          : <p className="text-sm font-semibold" style={{ color: T.ambra }}>Tutti i prodotti sono già presenti qui.</p>}
      {prod && (<>
        <Selettore label="Unità di misura in questo magazzino" valore={uomOk} onCambia={setUomId}
          opzioni={uomOpz.map((u) => ({ id: u.id, nome: labelU(u) }))} />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Livello previsto (par)" valore={par} onCambia={(v) => setPar(puliziaNum(v))}
            inputMode="decimal" placeholder="0" />
          <Campo label="Quantità attuale" valore={qty} onCambia={(v) => setQty(puliziaNum(v))}
            inputMode="decimal" placeholder="0" />
        </div>
        <div>
          <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Previsto per giorno (opzionale)</span>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <Campo label="Feriale · Lun–Ven" valore={valFascia(["1", "2", "3", "4", "5"])}
              onCambia={(v) => setFascia(["1", "2", "3", "4", "5"], puliziaNum(v))} inputMode="decimal" placeholder="–" />
            <Campo label="Weekend · Sab–Dom" valore={valFascia(["6", "0"])}
              onCambia={(v) => setFascia(["6", "0"], puliziaNum(v))} inputMode="decimal" placeholder="–" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[["1","L"],["2","M"],["3","M"],["4","G"],["5","V"],["6","S"],["0","D"]].map(([d, g]) => (
              <label key={d} className="text-center">
                <span className="block text-xs font-bold" style={{ color: T.tenue }}>{g}</span>
                <input value={pg[d] ?? ""} onChange={(e) => setPg((v) => ({ ...v, [d]: puliziaNum(e.target.value) }))}
                  inputMode="decimal" placeholder="–" aria-label={`Previsto ${g}`}
                  className="w-full rounded-xl px-1 py-2 text-sm font-bold text-center"
                  style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}`, color: T.ink }} />
              </label>
            ))}
          </div>
          <span className="block text-xs mt-1" style={{ color: T.tenue }}>
            Compila «Feriale» e «Weekend» per riempire in fretta, poi rifinisci il singolo giorno qui sopra. Vuoto = livello standard. Conteggi, sotto scorta e ordini usano il valore del giorno corrente.
          </span>
        </div>
      </>)}
      <PieDiPagina onChiudi={onChiudi} onSalva={salva} />
    </div>
  );
}

function FormRettifica({ stato, mag, art, muta, mostraToast, onChiudi, profilo }) {
  const p = trova(stato.prodotti, art.prodottoId);
  const sym = simboloU(stato, art.uomId);
  const [qty, setQty] = useState(String(art.qty));
  const passo = (d) => setQty((v) => String(Math.max(0, +(((num(v) ?? 0) + d)).toFixed(2))));
  const salva = () => {
    const n = num(qty);
    if (n == null || n < 0) return mostraToast("Inserisci una quantità valida", "errore");
    muta((s) => {
      const m = trova(s.magazzini, mag.id);
      const a = m?.articoli.find((x) => x.prodottoId === art.prodottoId);
      if (!a) return;
      const prima = a.qty;
      a.qty = n;
      registraMov(s, { magId: mag.id, prodottoId: a.prodottoId, uomId: a.uomId, delta: n - prima, dopo: n, causale: "rettifica", chi: profilo?.nome });
    }, `Rettifica «${p?.nome}» in «${mag.nome}»: ${fmtQ(art.qty)} → ${fmtQ(n)} ${sym}`);
    onChiudi();
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl px-3.5 py-3" style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
        <div className="font-extrabold" style={{ color: T.ink }}>{p?.nome}</div>
        <div className="text-sm mt-0.5" style={{ color: T.dim }}>
          Previsto oggi {fmtQ(parOggi(art))} {sym} · registrato {fmtQ(art.qty)} {sym}
        </div>
      </div>
      <div>
        <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Quantità reale contata</span>
        <div className="flex items-center gap-2">
          <button onClick={() => passo(-1)} aria-label="Diminuisci"
            className="rounded-2xl px-4 py-3 text-xl font-extrabold" style={{ background: "#F0F3FB", color: T.ink }}>−</button>
          <input value={qty} onChange={(e) => setQty(puliziaNum(e.target.value))} inputMode="decimal"
            aria-label="Quantità" className="flex-1 min-w-0 rounded-2xl px-3 py-3 text-xl font-extrabold text-center"
            style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}`, color: T.ink }} />
          <span className="text-sm font-bold w-10" style={{ color: T.dim }}>{sym}</span>
          <button onClick={() => passo(1)} aria-label="Aumenta"
            className="rounded-2xl px-4 py-3 text-xl font-extrabold" style={{ background: "#F0F3FB", color: T.ink }}>+</button>
        </div>
      </div>
      <PieDiPagina onChiudi={onChiudi} onSalva={salva} testo="Registra rettifica" />
    </div>
  );
}

/* == HO PRODOTTO — il gesto che scala gli ingredienti ==
   Tre cose, in quest'ordine, e l'ordine e' la sostanza:
     1. quanto ne hai fatto
     2. COSA ESCE, scritto per esteso, magazzino per magazzino, PRIMA di
        confermare — con quanto c'era e quanto resta
     3. solo dopo, il tasto che tocca i numeri
   Se qualcosa non torna (manca l'ingrediente, manca la conversione, non ce
   n'e' abbastanza) si dice qui, in chiaro, e si lascia decidere. */
function FormProduzione({ stato, mag, art, muta, mostraToast, onChiudi, profilo, suggerito }) {
  const prod = trova(stato.prodotti, art.prodottoId);
  /* se si arriva dal piano di lavoro il numero e' gia' scritto: chi apre la
     scheda sa gia' quanti gliene servono, riscriverlo e' solo un passaggio in
     piu' in cui si puo' sbagliare. Resta modificabile: e' un suggerimento. */
  const [qty, setQty] = useState(() => (suggerito > 0 ? String(suggerito).replace(".", ",") : ""));
  /* ── LA RICETTA SI SCRIVE DA QUI ──
     Segnalato da Valerio: «serve poter confermare la preparazione dei prodotti
     che vengono lavorati con piu' prodotti nel laboratorio». Il tasto per
     confermare c'era gia'; quello che mancava e' che per dieci preparati su
     dodici la conferma era VUOTA — nessuna ricetta, quindi la quantita' saliva
     e nessun ingrediente scendeva.
     E la ricetta il laboratorio non poteva scriverla: sta dentro il Catalogo,
     che e' sotto «Gestione», e nella barra del laboratorio «Gestione» non c'e'.
     Le dosi le sa chi ha la pentola in mano, e finivano dietro un permesso che
     quella persona non ha. Adesso si scrivono qui, nel momento in cui servono,
     senza aprire il Catalogo a chi non deve toccarlo. */
  const [scrivi, setScrivi] = useState(false);
  const [ricResa, setRicResa] = useState(() =>
    prod?.ricetta?.resa != null ? String(prod.ricetta.resa).replace(".", ",") : "");
  const [ricUom, setRicUom] = useState(() => prod?.ricetta?.uomResa || art.uomId);
  const [ricIng, setRicIng] = useState(() => (prod?.ricetta?.ingredienti || [])
    .map((x) => ({ prodottoId: x.prodottoId, qty: String(x.qty).replace(".", ","), uomId: x.uomId })));
  const n = num(qty);
  const sym = simboloU(stato, art.uomId);
  const calc = n > 0 ? calcoloProduzione(stato, { magProd: mag, prod, quanto: n, uomFatto: art.uomId })
    : { righe: [], problemi: [], fattore: 0 };
  const scoperti = calc.righe.filter((r) => !r.bastava);

  const salva = () => {
    if (!(n > 0)) return mostraToast("Scrivi quanto ne hai prodotto", "errore");
    const righe = calc.righe.map((r) => ({ prodottoId: r.prodottoId, magId: r.magId, quanto: r.quanto }));
    muta((s) => applicaProduzione(s, { magId: mag.id, prodottoId: art.prodottoId, quanto: n,
      righe, chi: profilo?.nome, nomeProd: prod?.nome }),
      `Prodotti ${fmtQ(n)} ${sym} di «${prod?.nome}» in «${mag.nome}»`);
    mostraToast(calc.righe.length
      ? `+${fmtQ(n)} ${sym} · ${calc.righe.length} ingredienti scalati`
      : `+${fmtQ(n)} ${sym} caricati`);
    onChiudi();
  };

  /* Stesse regole del Catalogo, e per la stessa ragione: o la ricetta e'
     intera o non si scrive. Una resa senza ingredienti, o un ingrediente
     senza quantita', farebbe scalare numeri sbagliati con l'aria di essere a
     posto — peggio del non avere niente. */
  const bozza = () => {
    const resa = num(ricResa);
    const ing = ricIng
      .map((r) => ({ prodottoId: r.prodottoId, qty: num(r.qty), uomId: r.uomId }))
      .filter((r) => r.prodottoId && r.qty > 0 && r.uomId);
    return { resa, ing, buona: resa > 0 && ing.length > 0 };
  };
  const salvaRicetta = () => {
    const { resa, ing, buona } = bozza();
    if (!buona) return mostraToast(
      !(resa > 0) ? "Scrivi quanto ne esce per una volta" : "Aggiungi almeno un ingrediente con la quantità",
      "errore");
    muta((s) => {
      const p = trova(s.prodotti, art.prodottoId);
      if (!p) return;
      p.preparato = true;
      p.ricetta = { resa, uomResa: ricUom || art.uomId, ingredienti: ing };
    }, `Ricetta di «${prod?.nome}»: ${ing.length} ingredienti per ${fmtQ(resa)} ${simboloU(stato, ricUom || art.uomId)}`);
    setScrivi(false);
    mostraToast(`Ricetta salvata · ${ing.length} ingredienti`);
  };

  return (
    <div className="flex flex-col gap-3">
      <Campo label={`Quanto ne hai prodotto? (${sym})`} valore={qty} onCambia={(v) => setQty(puliziaNum(v))}
        inputMode="decimal" placeholder="0" autoFocus
        suggerimento={conRicetta(prod)
          ? `La ricetta ne fa ${fmtQ(prod.ricetta.resa)} ${simboloU(stato, prod.ricetta.uomResa)} per volta.`
          : undefined} />

      {/* ── QUANDO LA RICETTA NON C'È ──
          Prima qui c'era una riga grigia sotto il campo: «Nessuna ricetta
          impostata: si carica la quantità e basta». Diceva il vero e non
          serviva a niente — chi la leggeva non aveva nessun posto dove
          andare, perche' il Catalogo il laboratorio non ce l'ha. */}
      {!conRicetta(prod) && !scrivi && (
        <div className="rounded-2xl px-3.5 py-3 text-sm" style={{ background: "#FFF6E8", border: `1px solid ${T.ambra}55`, color: T.ink }}>
          <div className="font-extrabold mb-1">Questo si fa con altri prodotti?</div>
          <div style={{ color: T.dim }} className="text-xs leading-relaxed mb-2">
            Finché non c'è scritto cosa ci vuole, confermare alza la quantità di
            «{prod?.nome}» e <b>non scala niente</b>: i magazzini continuano a dire che
            c'è roba che hai già usato. Scrivilo una volta e da qui in poi si scala da solo.
          </div>
          <div className="flex justify-end">
            <Bottone piccolo variante="tonale" icona={FlaskConical} onClick={() => {
              if (!ricResa) setRicResa(String(n > 0 ? n : 1).replace(".", ","));
              if (!ricIng.length) setRicIng([{ prodottoId: "", qty: "", uomId: "" }]);
              setScrivi(true);
            }}>Scrivi cosa ci vuole</Bottone>
          </div>
        </div>
      )}

      {scrivi && (
        <div className="rounded-2xl p-3" style={{ background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
          <div className="font-extrabold text-sm mb-1" style={{ color: T.ink }}>Cosa ci vuole per «{prod?.nome}»</div>
          <p className="text-xs mb-2 leading-relaxed" style={{ color: T.dim }}>
            Scrivilo per una volta sola: quanto ne esce e cosa ci vuole. Il resto lo fa
            l'app in proporzione — per mezza teglia non serve riscrivere niente.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Campo label="Ne escono" valore={ricResa} onCambia={(v) => setRicResa(puliziaNum(v))}
              inputMode="decimal" placeholder="1" />
            <Selettore label="di" valore={ricUom} onCambia={setRicUom}
              opzioni={stato.unita.map((u) => ({ id: u.id, nome: labelU(u) }))} />
          </div>
          <div className="flex flex-col gap-2">
            {ricIng.map((r, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <Selettore label={i === 0 ? "Ci vuole" : ""} valore={r.prodottoId}
                    onCambia={(v) => setRicIng(ricIng.map((x, j) => (j === i
                      ? { ...x, prodottoId: v, uomId: trova(stato.prodotti, v)?.uomBase || x.uomId }
                      : x)))}
                    gruppi={gruppiProdotto(stato, stato.prodotti.filter((x) => x.id !== art.prodottoId))}
                    placeholder="— scegli —" />
                </div>
                <div style={{ width: 88 }}>
                  <Campo label={i === 0 ? "quanto" : ""} valore={r.qty}
                    onCambia={(v) => setRicIng(ricIng.map((x, j) => (j === i ? { ...x, qty: puliziaNum(v) } : x)))}
                    inputMode="decimal" placeholder="0" />
                </div>
                <div style={{ width: 104 }}>
                  <Selettore label={i === 0 ? "unità" : ""} valore={r.uomId}
                    onCambia={(v) => setRicIng(ricIng.map((x, j) => (j === i ? { ...x, uomId: v } : x)))}
                    opzioni={stato.unita.map((u) => ({ id: u.id, nome: labelU(u) }))} />
                </div>
                <button type="button" onClick={() => setRicIng(ricIng.filter((_, j) => j !== i))}
                  aria-label="Togli ingrediente" className="rounded-full p-2.5 mb-0.5"
                  style={{ background: "#FCE9EE", color: T.rosso }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center gap-2 mt-2 flex-wrap">
            <Bottone piccolo variante="tonale" icona={Plus}
              onClick={() => setRicIng([...ricIng, { prodottoId: "", qty: "", uomId: "" }])}>
              Aggiungi ingrediente
            </Bottone>
            <div className="flex gap-2">
              <Bottone piccolo variante="fantasma" onClick={() => setScrivi(false)}>Lascia stare</Bottone>
              <Bottone piccolo icona={Check} onClick={salvaRicetta} disabilitato={!bozza().buona}>
                Salva la ricetta
              </Bottone>
            </div>
          </div>
        </div>
      )}

      {/* «non c'è una ricetta» adesso lo dice il riquadro qui sopra, che oltre
          a dirlo offre di rimediare: ripeterlo qui sarebbe lo stesso avviso
          due volte, e il secondo senza via d'uscita. */}
      {conRicetta(prod) && calc.problemi.length > 0 && (
        <div className="rounded-2xl px-3.5 py-3 text-sm" style={{ background: "#FFF6E8", border: `1px solid ${T.ambra}55`, color: T.ink }}>
          {calc.problemi.map((t, i) => <div key={i} className="font-semibold">{t}</div>)}
        </div>
      )}

      {calc.righe.length > 0 && (
        <div className="rounded-2xl p-3" style={{ background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
          <div className="font-extrabold text-sm mb-2" style={{ color: T.ink }}>
            Esce dai magazzini {calc.fattore !== 1 ? `(${fmtQ(calc.fattore)} volte la ricetta)` : ""}
          </div>
          <div className="flex flex-col gap-1.5">
            {calc.righe.map((r) => (
              <div key={r.prodottoId} className="flex items-center gap-2 text-sm flex-wrap">
                <span className="font-bold flex-1 min-w-0 truncate" style={{ color: T.ink }}>{r.nome}</span>
                <span className="font-extrabold whitespace-nowrap" style={{ color: r.bastava ? T.ambra : T.rosso }}>
                  −{fmtQ(r.quanto)} {simboloU(stato, r.uomId)}
                </span>
                <span className="w-full text-xs" style={{ color: r.bastava ? T.dim : T.rosso }}>
                  da «{r.magNome}» · {fmtQ(r.prima)} → {fmtQ(r.dopo)}
                  {!r.bastava && " — non ce n'è abbastanza: il magazzino va sotto zero"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {scoperti.length > 0 && (
        <div className="rounded-2xl px-3.5 py-3 text-sm font-semibold" style={{ background: "#FCEEF1", border: `1px solid ${T.rosso}55`, color: T.rosso }}>
          {scoperti.length === 1 ? "Un ingrediente non basta" : `${scoperti.length} ingredienti non bastano`}: se confermi, il numero
          va sotto zero. Vuol dire che la giacenza era già sbagliata prima — la produzione l'ha solo fatta venire fuori.
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={FlaskConical} onClick={salva} disabilitato={!(n > 0)}>Ho prodotto</Bottone>
      </div>
    </div>
  );
}

const MOTIVI_SCARTO = ["Scaduto", "Danneggiato", "Errore prep.", "Fine turno", "Altro"];
function FormScarto({ stato, mag, art, muta, mostraToast, onChiudi, profilo }) {
  const p = trova(stato.prodotti, art.prodottoId);
  const sym = simboloU(stato, art.uomId);
  const [qty, setQty] = useState("");
  const [motivo, setMotivo] = useState(MOTIVI_SCARTO[0]);
  const [nota, setNota] = useState("");
  const salva = () => {
    const n = num(qty);
    if (n == null || n <= 0) return mostraToast("Inserisci la quantità da scartare", "errore");
    if (n > art.qty + 1e-9) return mostraToast(`In giacenza ci sono solo ${fmtQ(art.qty)} ${sym}`, "errore");
    muta((s) => {
      const m = trova(s.magazzini, mag.id);
      const a = m?.articoli.find((x) => x.prodottoId === art.prodottoId);
      if (!a) return;
      a.qty = +(a.qty - n).toFixed(4);
      const causaleTxt = motivo + (nota.trim() ? ` · ${nota.trim()}` : "");
      registraMov(s, { magId: mag.id, prodottoId: a.prodottoId, uomId: a.uomId, delta: -n, dopo: a.qty, causale: "scarto", chi: profilo?.nome, rif: causaleTxt });
    }, `Scarto «${p?.nome}» in «${mag.nome}»: ${fmtQ(n)} ${sym} (${motivo})`);
    mostraToast("Scarto registrato");
    onChiudi();
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl px-3.5 py-3" style={{ background: "#FCEEF1", border: `1px solid ${T.bordo}` }}>
        <div className="font-extrabold" style={{ color: T.ink }}>{p?.nome}</div>
        <div className="text-sm mt-0.5" style={{ color: T.dim }}>In giacenza {fmtQ(art.qty)} {sym}</div>
      </div>
      <Campo label={`Quantità scartata (${sym})`} valore={qty} onCambia={(v) => setQty(puliziaNum(v))}
        inputMode="decimal" placeholder="0" autoFocus />
      <div>
        <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Motivo</span>
        <div className="flex gap-2 flex-wrap">
          {MOTIVI_SCARTO.map((mm) => (
            <button key={mm} type="button" onClick={() => setMotivo(mm)}
              className="rounded-full px-3 py-1.5 text-xs font-bold"
              style={motivo === mm ? { background: T.rosso, color: "#fff" } : { background: "#F6F8FE", color: T.dim, border: `1px solid ${T.bordo}` }}>
              {mm}
            </button>
          ))}
        </div>
      </div>
      <Campo label="Nota (opzionale)" valore={nota} onCambia={setNota} placeholder="Dettaglio…" />
      <PieDiPagina onChiudi={onChiudi} onSalva={salva} testo="Registra scarto" />
    </div>
  );
}

function MovimentiArticolo({ stato, mag, art }) {
  const p = trova(stato.prodotti, art.prodottoId);
  const movs = (stato.movimenti || []).filter((m) => m.magId === mag.id && m.prodottoId === art.prodottoId);
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl px-3.5 py-3" style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
        <div className="font-extrabold" style={{ color: T.ink }}>{p?.nome}</div>
        <div className="text-sm mt-0.5" style={{ color: T.dim }}>
          Giacenza attuale {fmtQ(art.qty)} {simboloU(stato, art.uomId)} · previsto oggi {fmtQ(parOggi(art))} {simboloU(stato, art.uomId)}
        </div>
      </div>
      {movs.length === 0
        ? <Vuoto icona={History} titolo="Nessun movimento registrato"
            testo="Lo storico parte da adesso: conteggi, rettifiche, evasioni e trasferimenti di questo articolo verranno tracciati qui." />
        : (
          <div className="flex flex-col gap-1.5">
            {movs.map((m) => {
              const c = CAUSALI[m.causale] || { nome: m.causale, colore: T.dim };
              const pos = m.delta > 0;
              return (
                <div key={m.id} className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 flex-wrap"
                  style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: T.ink }}>{c.nome}{m.rif ? ` · ${m.rif}` : ""}</div>
                    <div className="text-xs" style={{ color: T.tenue }}>{m.chi} · {tempoFa(m.t)}</div>
                  </div>
                  <span className="font-extrabold whitespace-nowrap" style={{ color: pos ? T.verde : T.rosso }}>
                    {pos ? "+" : "−"}{fmtQ(Math.abs(m.delta))} {simboloU(stato, m.uomId)}
                  </span>
                  <Chip colore={c.colore}>saldo {fmtQ(m.dopo)}</Chip>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

function FormTrasferimento({ stato, mag, muta, mostraToast, onChiudi, profilo }) {
  const conQta = articoliPerNome(stato, mag.articoli).filter((a) => a.qty > 0);
  const [prodottoId, setProdottoId] = useState(conQta[0]?.prodottoId || "");
  const art = mag.articoli.find((a) => a.prodottoId === prodottoId);
  const prod = trova(stato.prodotti, prodottoId);
  const admin = profilo?.ruolo === "admin";
  const dest = magazziniPerSede(stato, stato.magazzini).filter((m) => m.id !== mag.id && (admin || m.sedeId === profilo?.sedeId));
  const [destId, setDestId] = useState("");
  const magDest = trova(stato.magazzini, destId);
  const artDest = magDest?.articoli.find((a) => a.prodottoId === prodottoId);
  const [qta, setQta] = useState("");
  const sym = art ? simboloU(stato, art.uomId) : "";
  const n = num(qta);
  const eqDest = art && prod && n != null && artDest ? converti(prod, n, art.uomId, artDest.uomId) : null;

  const conferma = () => {
    if (!art || !prod) return mostraToast("Seleziona un articolo", "errore");
    if (!magDest) return mostraToast("Seleziona il magazzino di destinazione", "errore");
    if (n == null || n <= 0) return mostraToast("Inserisci una quantità valida", "errore");
    if (n > art.qty + 1e-9) return mostraToast(`Disponibili solo ${fmtQ(art.qty)} ${sym}`, "errore");
    muta((s) => {
      const mO = trova(s.magazzini, mag.id);
      const aO = mO?.articoli.find((x) => x.prodottoId === prodottoId);
      const mD = trova(s.magazzini, destId);
      const pB = trova(s.prodotti, prodottoId);
      if (!aO || !mD || !pB || n > aO.qty + 1e-9) return;
      aO.qty = +(aO.qty - n).toFixed(4);
      let aD = mD.articoli.find((x) => x.prodottoId === prodottoId);
      if (!aD) { aD = { prodottoId, uomId: aO.uomId, par: 0, qty: 0 }; mD.articoli.push(aD); }
      const ricevuto = converti(pB, n, aO.uomId, aD.uomId) ?? n;
      aD.qty = +(aD.qty + ricevuto).toFixed(4);
      registraMov(s, { magId: mO.id, prodottoId, uomId: aO.uomId, delta: -n, dopo: aO.qty, causale: "trasf-out", chi: profilo?.nome, rif: `verso «${mD.nome}»` });
      registraMov(s, { magId: mD.id, prodottoId, uomId: aD.uomId, delta: ricevuto, dopo: aD.qty, causale: "trasf-in", chi: profilo?.nome, rif: `da «${mO.nome}»` });
    }, `Trasferimento «${prod.nome}»: ${fmtQ(n)} ${sym} da «${mag.nome}» a «${magDest.nome}»`);
    mostraToast("Trasferimento registrato");
    onChiudi();
  };

  if (!conQta.length) return <p className="text-sm" style={{ color: T.dim }}>Nessun articolo con giacenza disponibile in questo magazzino.</p>;

  return (
    <div className="flex flex-col gap-4">
      <Selettore label="Articolo da trasferire" valore={prodottoId} onCambia={(v) => { setProdottoId(v); setQta(""); }}
        opzioni={conQta.map((a) => ({ id: a.prodottoId, nome: trova(stato.prodotti, a.prodottoId)?.nome || "—" }))} />
      {art && <p className="text-sm -mt-2" style={{ color: T.dim }}>Disponibili <b>{fmtQ(art.qty)} {sym}</b> in «{mag.nome}».</p>}
      <Selettore label="Magazzino di destinazione" valore={destId} onCambia={setDestId}
        opzioni={dest.map((m) => ({ id: m.id, nome: `${m.nome} · ${trova(stato.sedi, m.sedeId)?.nome || ""}` }))} />
      <Campo label={`Quantità da trasferire (${sym})`} valore={qta} onCambia={(v) => setQta(puliziaNum(v))}
        inputMode="decimal" placeholder="0"
        suggerimento={magDest && !artDest
          ? "L'articolo non esiste a destinazione: sarà creato con livello previsto 0."
          : eqDest != null && artDest && artDest.uomId !== art?.uomId
            ? `A destinazione arriveranno ≈ ${fmtQ(eqDest)} ${simboloU(stato, artDest.uomId)}.`
            : undefined} />
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={ArrowLeftRight} onClick={conferma} disabilitato={!destId || !(n > 0)}>Trasferisci</Bottone>
      </div>
    </div>
  );
}

/* == AGGIUNTA MULTIPLA: più prodotti in un magazzino == */
function FormAggiungiMulti({ stato, mag, muta, mostraToast, onChiudi, profilo }) {
  const disponibili = ordinaPerNome(stato.prodotti).filter((p) => !mag.articoli.some((a) => a.prodottoId === p.id));
  const [sel, setSel] = useState(() => new Set());
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("tutti");
  const [par, setPar] = useState("");
  const lista = disponibili.filter((p) =>
    (p.nome || "").toLowerCase().includes(q.trim().toLowerCase()) &&
    (filtro === "tutti" || p.categoriaId === filtro));
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const salva = () => {
    if (!sel.size) return mostraToast("Seleziona almeno un prodotto", "errore");
    const nPar = num(par) ?? 0;
    if (nPar < 0) return mostraToast("Livello previsto non valido", "errore");
    /* qui il ciclo salta chi e' GIA' nel magazzino: se un altro telefono ce
       l'ha appena messo, non lo si aggiunge due volte — giusto — ma dirlo
       aggiunto sarebbe falso */
    const quanti = stato.prodotti.filter((x) => sel.has(x.id)
      && !mag.articoli.some((a) => a.prodottoId === x.id)).length;
    const fuori = sel.size - quanti;
    if (!quanti) return mostraToast("Sono già tutti in questo magazzino", "errore");
    muta((s) => {
      const m = trova(s.magazzini, mag.id);
      for (const p of s.prodotti) {
        if (!sel.has(p.id) || m.articoli.some((a) => a.prodottoId === p.id)) continue;
        m.articoli.push({ prodottoId: p.id, uomId: p.uomBase, par: nPar, qty: 0 });
        registraMov(s, { magId: m.id, prodottoId: p.id, uomId: p.uomBase, delta: 0, dopo: 0, causale: "articolo", chi: profilo?.nome });
      }
    }, fuori ? `${quanti} prodotti aggiunti in «${mag.nome}» · ${fuori} c'erano già`
      : `${quanti} prodotti aggiunti in «${mag.nome}»`);
    mostraToast(fuori ? `${quanti} aggiunti · ${fuori} c'erano già`
      : `${quanti} prodotti aggiunti · livello e quantità da rifinire`, fuori ? "avviso" : "ok");
    onChiudi();
  };

  if (!disponibili.length) return <p className="text-sm font-semibold" style={{ color: T.ambra }}>Tutti i prodotti a catalogo sono già presenti in questo magazzino.</p>;
  return (
    <div className="flex flex-col gap-3">
      <Campo label="Livello previsto per tutti (par di partenza)" valore={par} onCambia={(v) => setPar(puliziaNum(v))}
        inputMode="decimal" placeholder="0" suggerimento="Vale per tutti i prodotti scelti; poi puoi rifinire il singolo dalla matita." />
      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
        <Search size={16} style={{ color: T.tenue }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca prodotto…"
          className="flex-1 bg-transparent outline-none text-sm font-semibold" style={{ color: T.ink }} />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFiltro("tutti")} className="rounded-full px-2.5 py-1 text-xs font-bold"
          style={filtro === "tutti" ? { background: T.grad, color: "#fff" } : { background: T.sup, color: T.dim, border: `1px solid ${T.bordo}` }}>Tutte</button>
        {stato.categorie.map((c) => (
          <button key={c.id} onClick={() => setFiltro(filtro === c.id ? "tutti" : c.id)} className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={filtro === c.id ? { background: c.colore, color: "#fff" } : { background: `${c.colore}14`, color: c.colore, border: `1px solid ${c.colore}33` }}>{c.nome}</button>
        ))}
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold" style={{ color: T.blu }}>{sel.size} selezionati</span>
        <div className="flex gap-2">
          <button onClick={() => setSel((s) => new Set([...s, ...lista.map((p) => p.id)]))} className="text-xs font-bold" style={{ color: T.blu }}>Tutti ({lista.length})</button>
          <button onClick={() => setSel((s) => { const n = new Set(s); lista.forEach((p) => n.delete(p.id)); return n; })} className="text-xs font-bold" style={{ color: T.tenue }}>Nessuno</button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "42vh" }}>
        {lista.length === 0 ? <p className="text-sm py-2 text-center" style={{ color: T.dim }}>Nessun prodotto.</p>
          : lista.map((p) => {
            const on = sel.has(p.id); const cat = trova(stato.categorie, p.categoriaId);
            return (
              <button key={p.id} type="button" onClick={() => toggle(p.id)} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left"
                style={{ background: on ? "#EAF0FE" : "#F7F9FE", border: `1.5px solid ${on ? T.blu : T.bordo}` }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? T.blu : "#fff", border: `1.5px solid ${on ? T.blu : T.tenue}` }}>
                  {on && <Check size={13} color="#fff" />}
                </span>
                <span className="flex-1 min-w-0 font-bold truncate" style={{ color: T.ink }}>{p.nome}</span>
                {cat && <Chip colore={cat.colore}>{cat.nome}</Chip>}
              </button>
            );
          })}
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={Plus} onClick={salva} disabilitato={!sel.size}>Aggiungi{sel.size ? ` ${sel.size}` : ""}</Bottone>
      </div>
    </div>
  );
}

/* == COPIA PRODOTTI da un altro magazzino == */
function FormCopiaMagazzino({ stato, mag, muta, mostraToast, onChiudi, profilo }) {
  const fonti = magazziniPerSede(stato, stato.magazzini).filter((m) => m.id !== mag.id && m.articoli.length);
  const [fonteId, setFonteId] = useState(fonti[0]?.id || "");
  const [soloMancanti, setSoloMancanti] = useState(true);
  const fonte = trova(stato.magazzini, fonteId);
  const daCopiare = fonte ? fonte.articoli.filter((a) => !soloMancanti || !mag.articoli.some((x) => x.prodottoId === a.prodottoId)) : [];

  const salva = () => {
    if (!fonte || !daCopiare.length) return mostraToast("Niente da copiare", "errore");
    let agg = 0, aggiorn = 0;
    muta((s) => {
      const m = trova(s.magazzini, mag.id);
      const src = trova(s.magazzini, fonteId);
      for (const a of src.articoli) {
        const ex = m.articoli.find((x) => x.prodottoId === a.prodottoId);
        if (ex) {
          if (soloMancanti) continue;
          ex.par = a.par; ex.parGiorni = a.parGiorni; aggiorn++;
        } else {
          m.articoli.push({ prodottoId: a.prodottoId, uomId: a.uomId, par: a.par, qty: 0, parGiorni: a.parGiorni });
          registraMov(s, { magId: m.id, prodottoId: a.prodottoId, uomId: a.uomId, delta: 0, dopo: 0, causale: "articolo", chi: profilo?.nome });
          agg++;
        }
      }
    }, `Prodotti copiati da «${fonte.nome}» in «${mag.nome}»`);
    mostraToast(`${agg} aggiunti${aggiorn ? ` · ${aggiorn} aggiornati` : ""} (quantità a 0, da contare)`);
    onChiudi();
  };

  if (!fonti.length) return <p className="text-sm font-semibold" style={{ color: T.ambra }}>Nessun altro magazzino con prodotti da cui copiare.</p>;
  return (
    <div className="flex flex-col gap-4">
      <Selettore label="Copia i prodotti da" valore={fonteId} onCambia={setFonteId}
        opzioni={fonti.map((m) => ({ id: m.id, nome: `${m.nome} (${m.articoli.length} prodotti)` }))} />
      <button onClick={() => setSoloMancanti((v) => !v)} className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left"
        style={{ background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
        <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: soloMancanti ? T.blu : "#fff", border: `1.5px solid ${soloMancanti ? T.blu : T.tenue}` }}>
          {soloMancanti && <Check size={13} color="#fff" />}
        </span>
        <span className="flex-1 text-sm" style={{ color: T.ink }}>
          <b>Solo prodotti mancanti</b> — non tocca quelli già presenti qui (consigliato)
        </span>
      </button>
      <div className="rounded-2xl px-3.5 py-3 text-sm" style={{ background: "#EFF7F3", border: "1px solid #CFEADD", color: T.ink }}>
        Verranno {soloMancanti ? "aggiunti" : "copiati/aggiornati"} <b style={{ color: T.verde }}>{daCopiare.length}</b> prodotti
        (con il loro livello previsto e le soglie per giorno). La <b>quantità parte da 0</b>: la conti tu.
      </div>
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={Copy} onClick={salva} disabilitato={!daCopiare.length}>Copia {daCopiare.length}</Bottone>
      </div>
    </div>
  );
}

/* == SOGLIE PER GIORNO in blocco (moltiplicatore) == */
function FormSoglieMulti({ stato, mag, muta, mostraToast, onChiudi }) {
  const [sel, setSel] = useState(() => new Set(mag.articoli.map((a) => a.prodottoId)));
  const [ff, setFf] = useState("1");
  const [fw, setFw] = useState("1.5");
  const r2 = (x) => Math.round(x * 100) / 100;
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const salva = () => {
    const nff = num(ff), nfw = num(fw);
    if (nff == null || nff < 0 || nfw == null || nfw < 0) return mostraToast("Moltiplicatori non validi", "errore");
    if (!sel.size) return mostraToast("Seleziona almeno un prodotto", "errore");
    const quanti = mag.articoli.filter((a) => sel.has(a.prodottoId)).length;
    const fuori = sel.size - quanti;
    if (!quanti) return mostraToast("Nessuno di questi prodotti è più in questo magazzino", "errore");
    muta((s) => {
      const m = trova(s.magazzini, mag.id);
      for (const a of m.articoli) {
        if (!sel.has(a.prodottoId)) continue;
        if (nff === 1 && nfw === 1) { delete a.parGiorni; continue; }
        const base = a.par || 0;
        const fer = r2(base * nff), wk = r2(base * nfw);
        a.parGiorni = { "1": fer, "2": fer, "3": fer, "4": fer, "5": fer, "6": wk, "0": wk };
      }
    }, fuori ? `Soglie per giorno aggiornate su ${quanti} prodotti in «${mag.nome}» · ${fuori} saltati`
      : `Soglie per giorno aggiornate su ${quanti} prodotti in «${mag.nome}»`);
    mostraToast(fuori ? `${quanti} aggiornati · ${fuori} saltati: non ci sono più in questo magazzino`
      : nff === 1 && nfw === 1 ? "Soglie per giorno azzerate (livello unico)" : `Soglie per giorno impostate su ${quanti} prodotti`,
      fuori ? "avviso" : "ok");
    onChiudi();
  };

  if (!mag.articoli.length) return <p className="text-sm font-semibold" style={{ color: T.ambra }}>Nessun prodotto in questo magazzino.</p>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: T.dim }}>
        Imposta le soglie in base al <b>livello previsto</b> di ogni prodotto, senza digitarle una a una:
        i giorni feriali diventano <b>livello × feriale</b>, il weekend <b>livello × weekend</b>.
        (Metti entrambi a <b>1</b> per tornare al livello unico.)
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Feriale · ×" valore={ff} onCambia={(v) => setFf(puliziaNum(v))} inputMode="decimal" placeholder="1" />
        <Campo label="Weekend · ×" valore={fw} onCambia={(v) => setFw(puliziaNum(v))} inputMode="decimal" placeholder="1.5" />
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold" style={{ color: T.blu }}>{sel.size} / {mag.articoli.length} prodotti</span>
        <div className="flex gap-2">
          <button onClick={() => setSel(new Set(mag.articoli.map((a) => a.prodottoId)))} className="text-xs font-bold" style={{ color: T.blu }}>Tutti</button>
          <button onClick={() => setSel(new Set())} className="text-xs font-bold" style={{ color: T.tenue }}>Nessuno</button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "38vh" }}>
        {articoliPerNome(stato, mag.articoli).map((a) => {
          const p = trova(stato.prodotti, a.prodottoId); const on = sel.has(a.prodottoId);
          const sym = simboloU(stato, a.uomId);
          const nff = num(ff) ?? 1, nfw = num(fw) ?? 1;
          return (
            <button key={a.prodottoId} type="button" onClick={() => toggle(a.prodottoId)} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left"
              style={{ background: on ? "#EAF0FE" : "#F7F9FE", border: `1.5px solid ${on ? T.blu : T.bordo}` }}>
              <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? T.blu : "#fff", border: `1.5px solid ${on ? T.blu : T.tenue}` }}>
                {on && <Check size={13} color="#fff" />}
              </span>
              <span className="flex-1 min-w-0"><span className="font-bold truncate block" style={{ color: T.ink }}>{p?.nome || "—"}</span>
                <span className="text-xs" style={{ color: T.tenue }}>base {fmtQ(a.par || 0)} {sym} → fer {fmtQ(r2((a.par || 0) * nff))} · wk {fmtQ(r2((a.par || 0) * nfw))}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={TrendingUp} onClick={salva} disabilitato={!sel.size}>Applica</Bottone>
      </div>
    </div>
  );
}

/* == LIVELLO PREVISTO (par) in blocco, anche in Gastronorm == */
function FormParMulti({ stato, mag, muta, mostraToast, onChiudi }) {
  const [sel, setSel] = useState(() => new Set());
  const [q, setQ] = useState("");
  const [par, setPar] = useState("");
  const [uom, setUom] = useState("");
  const lista = articoliPerNome(stato, mag.articoli).filter((a) => {
    const p = trova(stato.prodotti, a.prodottoId);
    return (p?.nome || "").toLowerCase().includes(q.trim().toLowerCase());
  });
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const salva = () => {
    if (!sel.size) return mostraToast("Seleziona almeno un prodotto", "errore");
    const cambiaPar = par.trim() !== "";
    const nPar = cambiaPar ? num(par) : null;
    if (cambiaPar && (nPar == null || nPar < 0)) return mostraToast("Livello previsto non valido", "errore");
    if (!cambiaPar && !uom) return mostraToast("Imposta un livello o un'unità (o entrambi)", "errore");
    /* ── IL CONTO VERO, COME NELLA PLANCIA (gen-5.90) ──
       Il ciclo qui sotto salta in silenzio le righe che non trova piu', ma il
       messaggio contava la SELEZIONE. Da gen-5.80 due telefoni lavorano
       davvero insieme: fra lo spuntare e il premere, un altro puo' aver tolto
       quella riga. Un'app che dice «fatto» su cose che non ha toccato e'
       peggio di una che rifiuta — chi ha premuto va via convinto, e chi legge
       lo storico non ha modo di accorgersene. */
    const quanti = mag.articoli.filter((a) => sel.has(a.prodottoId)).length;
    const fuori = sel.size - quanti;
    if (!quanti) return mostraToast("Nessuno di questi prodotti è più in questo magazzino", "errore");
    muta((s) => {
      const m = trova(s.magazzini, mag.id);
      for (const a of m.articoli) {
        if (!sel.has(a.prodottoId)) continue;
        if (cambiaPar) a.par = nPar;
        if (uom) a.uomId = uom;
      }
    }, fuori ? `Livello previsto aggiornato su ${quanti} prodotti in «${mag.nome}» · ${fuori} saltati`
      : `Livello previsto aggiornato su ${quanti} prodotti in «${mag.nome}»`);
    mostraToast(fuori ? `Aggiornati ${quanti} · ${fuori} saltati: non ci sono più in questo magazzino`
      : `Aggiornati ${quanti} prodotti`, fuori ? "avviso" : "ok");
    onChiudi();
  };

  if (!mag.articoli.length) return <p className="text-sm font-semibold" style={{ color: T.ambra }}>Nessun prodotto in questo magazzino.</p>;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3">
        <Campo label="Nuovo livello previsto (vuoto = non cambiarlo)" valore={par} onCambia={(v) => setPar(puliziaNum(v))}
          inputMode="decimal" placeholder="es. 2" />
        <Selettore label="Unità di misura (opzionale, es. GN 1/6)" valore={uom} onCambia={setUom}
          opzioni={[{ id: "", nome: "— non cambiare —" }, ...stato.unita.map((u) => ({ id: u.id, nome: labelU(u) }))]} />
      </div>
      <div className="rounded-2xl px-3.5 py-2.5 text-xs" style={{ background: "#EFF7F3", border: "1px solid #CFEADD", color: T.ink }}>
        Per comunicare col laboratorio in Gastronorm, imposta l'unità su <b>GN 1/6</b> (o la misura giusta) e il livello, es. «2 · GN 1/6».
      </div>
      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
        <Search size={16} style={{ color: T.tenue }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca prodotto…"
          className="flex-1 bg-transparent outline-none text-sm font-semibold" style={{ color: T.ink }} />
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold" style={{ color: T.blu }}>{sel.size} selezionati</span>
        <div className="flex gap-2">
          <button onClick={() => setSel((s) => new Set([...s, ...lista.map((a) => a.prodottoId)]))} className="text-xs font-bold" style={{ color: T.blu }}>Tutti ({lista.length})</button>
          <button onClick={() => setSel((s) => { const n = new Set(s); lista.forEach((a) => n.delete(a.prodottoId)); return n; })} className="text-xs font-bold" style={{ color: T.tenue }}>Nessuno</button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "38vh" }}>
        {lista.map((a) => {
          const p = trova(stato.prodotti, a.prodottoId); const on = sel.has(a.prodottoId);
          return (
            <button key={a.prodottoId} type="button" onClick={() => toggle(a.prodottoId)} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left"
              style={{ background: on ? "#EAF0FE" : "#F7F9FE", border: `1.5px solid ${on ? T.blu : T.bordo}` }}>
              <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? T.blu : "#fff", border: `1.5px solid ${on ? T.blu : T.tenue}` }}>
                {on && <Check size={13} color="#fff" />}
              </span>
              <span className="flex-1 min-w-0 font-bold truncate" style={{ color: T.ink }}>{p?.nome || "—"}</span>
              <Chip colore={T.dim}>{fmtQ(a.par || 0)} {simboloU(stato, a.uomId)}</Chip>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={Check} onClick={salva} disabilitato={!sel.size}>Applica</Bottone>
      </div>
    </div>
  );
}

/* == SPOSTA / RIMUOVI prodotti in blocco == */
function FormSpostaMulti({ stato, mag, muta, mostraToast, onChiudi, profilo }) {
  const [sel, setSel] = useState(() => new Set());
  const [q, setQ] = useState("");
  /* solo destinazioni su cui si ha permesso PIENO: prima l'elenco offriva
     TUTTI i magazzini, comprese le sedi altrui — offrire cio' che poi va
     rifiutato e' il difetto, non la protezione */
  const altri = magazziniPerSede(stato, stato.magazzini.filter((m) => permessoSu(profilo, m) === "pieno")).filter((m) => m.id !== mag.id);
  const [destId, setDestId] = useState(altri[0]?.id || "");
  const lista = articoliPerNome(stato, mag.articoli).filter((a) => {
    const p = trova(stato.prodotti, a.prodottoId);
    return (p?.nome || "").toLowerCase().includes(q.trim().toLowerCase());
  });
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const dest = trova(stato.magazzini, destId);

  const sposta = () => {
    if (!sel.size) return mostraToast("Seleziona almeno un prodotto", "errore");
    if (!dest) return mostraToast("Scegli il magazzino di destinazione", "errore");
    if (permessoSu(profilo, dest) !== "pieno")
      return mostraToast("Quel magazzino non e' di tua competenza: scegli una destinazione tua", "errore");
    /* stesso conto vero: qui il ciclo fa «if (!a) continue» sulle righe che
       non trova, e il messaggio le contava lo stesso */
    const quanti = mag.articoli.filter((a) => sel.has(a.prodottoId)).length;
    const fuori = sel.size - quanti;
    if (!quanti) return mostraToast("Nessuno di questi prodotti è più in questo magazzino", "errore");
    muta((s) => {
      const m = trova(s.magazzini, mag.id);
      const d = trova(s.magazzini, destId);
      for (const pid of [...sel]) {
        const a = m.articoli.find((x) => x.prodottoId === pid);
        if (!a) continue;
        const p = trova(s.prodotti, pid);
        const ex = d.articoli.find((x) => x.prodottoId === pid);
        if (ex) {
          const conv = p ? (converti(p, a.qty, a.uomId, ex.uomId) ?? a.qty) : a.qty;
          if (a.qty > 0) { ex.qty = +(ex.qty + conv).toFixed(4); registraMov(s, { magId: d.id, prodottoId: pid, uomId: ex.uomId, delta: conv, dopo: ex.qty, causale: "trasferimento", chi: profilo?.nome, rif: `da «${m.nome}»` }); }
        } else {
          d.articoli.push({ prodottoId: pid, uomId: a.uomId, par: a.par, qty: a.qty, parGiorni: a.parGiorni });
          if (a.qty > 0) registraMov(s, { magId: d.id, prodottoId: pid, uomId: a.uomId, delta: a.qty, dopo: a.qty, causale: "trasferimento", chi: profilo?.nome, rif: `da «${m.nome}»` });
        }
        if (a.qty > 0) registraMov(s, { magId: m.id, prodottoId: pid, uomId: a.uomId, delta: -a.qty, dopo: 0, causale: "trasferimento", chi: profilo?.nome, rif: `a «${d.nome}»` });
      }
      m.articoli = m.articoli.filter((x) => !sel.has(x.prodottoId));
    }, fuori ? `${quanti} prodotti spostati da «${mag.nome}» a «${dest.nome}» · ${fuori} saltati`
      : `${quanti} prodotti spostati da «${mag.nome}» a «${dest.nome}»`);
    mostraToast(fuori ? `${quanti} spostati · ${fuori} saltati: non ci sono più qui`
      : `${quanti} prodotti spostati in «${dest.nome}»`, fuori ? "avviso" : "ok");
    onChiudi();
  };

  const linee = lineeDelLab(stato, mag);
  const rimuovi = () => {
    if (!sel.size) return mostraToast("Seleziona almeno un prodotto", "errore");
    /* la sesta, che nel giro del 5 agosto non avevo contato: togliArticolo
       non trova la riga e restituisce zero senza dire niente, e il messaggio
       contava la selezione */
    const quanti = mag.articoli.filter((a) => sel.has(a.prodottoId)).length;
    const fuori = sel.size - quanti;
    if (!quanti) return mostraToast("Nessuno di questi prodotti è più in questo magazzino", "errore");
    muta((s) => { for (const pid of sel) togliArticolo(s, mag.id, pid); },
      (linee.length
        ? `${quanti} prodotti rimossi da «${mag.nome}» e dalle linee rifornite`
        : `${quanti} prodotti rimossi da «${mag.nome}»`) + (fuori ? ` · ${fuori} saltati` : ""));
    mostraToast(fuori ? `${quanti} rimossi · ${fuori} saltati: non c'erano più`
      : linee.length
      ? `${quanti} prodotti rimossi, qui e nelle linee rifornite`
      : `${quanti} prodotti rimossi (restano a catalogo)`, fuori ? "avviso" : "ok");
    onChiudi();
  };

  if (!mag.articoli.length) return <p className="text-sm font-semibold" style={{ color: T.ambra }}>Nessun prodotto in questo magazzino.</p>;
  return (
    <div className="flex flex-col gap-3">
      {linee.length > 0 && (
        <div className="rounded-2xl px-3.5 py-3 text-sm font-semibold"
          style={{ background: "#FFF6E8", color: "#7A4A00", border: `1.5px solid ${T.ambra}` }}>
          Questo è un magazzino laboratorio: quello che togli qui sparisce anche
          dalle {linee.length} linee che rifornisci ({linee.map((l) => l.nome).join(", ")}),
          con le loro soglie. Lo spostamento invece non le tocca.
        </div>
      )}
      {altri.length > 0 && (
        <Selettore label="Sposta verso" valore={destId} onCambia={setDestId}
          opzioni={altri.map((m) => ({ id: m.id, nome: `${m.nome} (${m.articoli.length})` }))} />
      )}
      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
        <Search size={16} style={{ color: T.tenue }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca prodotto…"
          className="flex-1 bg-transparent outline-none text-sm font-semibold" style={{ color: T.ink }} />
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold" style={{ color: T.blu }}>{sel.size} selezionati</span>
        <div className="flex gap-2">
          <button onClick={() => setSel((s) => new Set([...s, ...lista.map((a) => a.prodottoId)]))} className="text-xs font-bold" style={{ color: T.blu }}>Tutti ({lista.length})</button>
          <button onClick={() => setSel((s) => { const n = new Set(s); lista.forEach((a) => n.delete(a.prodottoId)); return n; })} className="text-xs font-bold" style={{ color: T.tenue }}>Nessuno</button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "40vh" }}>
        {lista.map((a) => {
          const p = trova(stato.prodotti, a.prodottoId); const on = sel.has(a.prodottoId);
          return (
            <button key={a.prodottoId} type="button" onClick={() => toggle(a.prodottoId)} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left"
              style={{ background: on ? "#EAF0FE" : "#F7F9FE", border: `1.5px solid ${on ? T.blu : T.bordo}` }}>
              <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? T.blu : "#fff", border: `1.5px solid ${on ? T.blu : T.tenue}` }}>
                {on && <Check size={13} color="#fff" />}
              </span>
              <span className="flex-1 min-w-0 font-bold truncate" style={{ color: T.ink }}>{p?.nome || "—"}</span>
              <Chip colore={T.dim}>{fmtQ(a.qty)} {simboloU(stato, a.uomId)}</Chip>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 justify-end pt-1 flex-wrap">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone variante="pericolo" icona={Trash2} onClick={rimuovi} disabilitato={!sel.size}>Rimuovi</Bottone>
        {altri.length > 0 && <Bottone icona={ArrowLeftRight} onClick={sposta} disabilitato={!sel.size}>Sposta{sel.size ? ` ${sel.size}` : ""}</Bottone>}
      </div>
    </div>
  );
}

function MagazzinoDettaglio({ stato, mag, muta, mostraToast, permesso = "pieno", onChiudi, profilo }) {
  const [formArt, setFormArt] = useState(null);   // {art?} | null · solo permesso pieno
  const [rett, setRett] = useState(null);         // articolo in rettifica
  const [delArt, setDelArt] = useState(null);
  const [kardex, setKardex] = useState(null);   // articolo con storico aperto
  const [scarto, setScarto] = useState(null);   // articolo per registrazione scarto
  const [trasf, setTrasf] = useState(false);    // trasferimento fra magazzini
  const [multi, setMulti] = useState(false);    // aggiunta multipla di prodotti
  const [copia, setCopia] = useState(false);    // copia prodotti da altro magazzino
  const [soglie, setSoglie] = useState(false);  // soglie per giorno in blocco
  const [sposta, setSposta] = useState(false);  // sposta/rimuovi prodotti in blocco
  const [parMulti, setParMulti] = useState(false); // livello previsto in blocco (anche Gastronorm)
  const [menu, setMenu] = useState(false);      // menù "Gestione rapida"
  const [produz, setProduz] = useState(null);   // "ho prodotto" su un preparato
  const [q, setQ] = useState("");               // ricerca articolo nel magazzino
  const meta = TIPI_MAG[mag.tipo];
  const sede = trova(stato.sedi, mag.sedeId);
  const rif = mag.rifMagazzinoId ? trova(stato.magazzini, mag.rifMagazzinoId) : null;
  const retro = mag.tipo === "linea-retro"
    ? (rif || stato.magazzini.find((m) => m.sedeId === mag.sedeId && m.tipo === "retro"))
    : null;
  const artFiltrati = mag.articoli.filter((a) => {
    if (!q.trim()) return true;
    const p = trova(stato.prodotti, a.prodottoId);
    return (p?.nome || "").toLowerCase().includes(q.trim().toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Chip colore={meta.colore}>{meta.nome}</Chip>
        <Chip colore={T.dim}>{sede?.nome}</Chip>
        {retro && <Chip colore={T.ambra}>Rif: {retro.nome}</Chip>}
        {permesso === "rettifica" && <Chip colore={T.blu}>Rettifica giacenze</Chip>}
        {profilo.ruolo === "admin" && (() => {
          /* quanto vale quello che c'e' qui dentro — solo all'admin: il
             valore economico e' controllo di gestione, non lavoro di linea.
             Se non si puo' calcolare non si mostra un numero a caso */
          const v = valoreMag(stato, mag);
          if (v.contate === 0) return null;
          const mancanti = v.senzaPrezzo + v.senzaConv;
          return (
            <Chip colore={T.verde}>
              {fmtEuro(v.tot)}{mancanti > 0 ? ` · ${mancanti} senza prezzo` : ""}
            </Chip>
          );
        })()}
      </div>

      {mag.articoli.length === 0 ? (
        <Vuoto icona={Package} titolo="Magazzino vuoto"
          testo={permesso === "pieno" ? "Aggiungi i prodotti con livello previsto e quantità." : "Nessun articolo presente."} />
      ) : (
        <div className="flex flex-col gap-2">
          {mag.articoli.length > 6 && (
            <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
              style={{ background: "#EEF2FB", border: `1px solid ${T.bordo}` }}>
              <Search size={16} style={{ color: T.tenue }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Cerca fra ${mag.articoli.length} articoli…`}
                className="flex-1 bg-transparent outline-none text-sm font-semibold" style={{ color: T.ink }} />
              {q && <button onClick={() => setQ("")} aria-label="Pulisci ricerca" style={{ color: T.tenue }}><X size={16} /></button>}
              <span className="text-xs font-bold shrink-0" style={{ color: T.tenue }}>{artFiltrati.length}/{mag.articoli.length}</span>
            </div>
          )}
          {artFiltrati.length === 0
            ? <p className="text-sm py-2 text-center" style={{ color: T.dim }}>Nessun articolo trovato per «{q}».</p>
            : perCategoria(stato, artFiltrati).map(({ cat, arts }) => (
            <div key={cat?.id || "_"} className="flex flex-col gap-2">
              <IntestaCat cat={cat} n={arts.length} />
              {arts.map((a) => {
            const p = trova(stato.prodotti, a.prodottoId);
            const sym = simboloU(stato, a.uomId);
            const sotto = a.qty < parOggi(a);
            const artR = retro?.articoli.find((x) => x.prodottoId === a.prodottoId);
            const eqLinea = artR && p ? converti(p, artR.qty, artR.uomId, a.uomId) : null;
            return (
              /* Sul telefono i quattro tondini si prendevano la riga e al nome
                 restavano 47 pixel: «Pachino no condito» diventava «Pach…».
                 Da qui in giù i comandi vanno a capo, e il nome ha la riga
                 tutta per sé. Da tablet in su resta com'era. */
              <div key={a.prodottoId} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-2xl px-3.5 py-3"
                style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ color: T.ink }}>{p?.nome || "—"}</div>
                  <div className="text-xs" style={{ color: T.dim }}>Previsto {fmtQ(parOggi(a))} {sym}</div>
                  {retro && (
                    artR
                      ? <div className="text-xs" style={{ color: T.tenue }}>
                          Retro: {fmtQ(artR.qty)} {simboloU(stato, artR.uomId)}
                          {eqLinea != null && <> ≈ {fmtQ(eqLinea)} {sym}</>}
                        </div>
                      : <div className="text-xs font-semibold" style={{ color: T.ambra }}>Assente nel retro</div>
                  )}
                </div>
                <div className="flex items-center gap-2 justify-end shrink-0">
                <Chip colore={sotto ? T.ambra : T.verde}>{fmtQ(a.qty)} {sym}</Chip>
                <button onClick={() => setKardex(a)} aria-label={`Storico ${p?.nome}`}
                  className="rounded-full p-2.5" style={{ background: "#F0F3FB", color: T.dim }}><History size={14} /></button>
                {/* «Ho prodotto» compare solo dove ha senso: su un preparato, in un
                    magazzino di laboratorio, a chi può toccare le giacenze. Su una
                    linea o su un retro non c'entra niente — lì i preparati arrivano,
                    non si fanno. */}
                {(permesso !== "lettura" || profilo.ruolo === "laboratorio") && mag.tipo === "laboratorio" && preparato(p) && (
                  <button onClick={() => setProduz(a)} aria-label={`Ho prodotto ${p?.nome}`}
                    className="rounded-full p-2.5" style={{ background: "#E8F6F0", color: T.verde }}><FlaskConical size={14} /></button>
                )}
                {permesso !== "lettura" && (
                  <button onClick={() => setScarto(a)} aria-label={`Scarto ${p?.nome}`}
                    className="rounded-full p-2.5" style={{ background: "#FCEEF1", color: T.rosso }}><PackageMinus size={14} /></button>
                )}
                {permesso === "pieno" && (<>
                  <button onClick={() => setFormArt({ art: a })} aria-label={`Modifica ${p?.nome}`}
                    className="rounded-full p-2.5" style={{ background: "#EAF0FE", color: T.blu }}><Pencil size={14} /></button>
                  <button onClick={() => setDelArt(a)} aria-label={`Rimuovi ${p?.nome}`}
                    className="rounded-full p-2.5" style={{ background: "#FCE9EE", color: T.rosso }}><Trash2 size={14} /></button>
                </>)}
                {permesso === "rettifica" && (
                  <button onClick={() => setRett(a)} aria-label={`Rettifica ${p?.nome}`}
                    className="rounded-full p-2.5" style={{ background: "#EAF0FE", color: T.blu }}><Pencil size={14} /></button>
                )}
                </div>
              </div>
            );
          })}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4 flex-wrap">
        {permesso === "rettifica" && mag.articoli.length > 0 && (
          <Bottone variante="tonale" icona={ArrowLeftRight} onClick={() => setTrasf(true)}>Trasferisci scorte</Bottone>
        )}
        {permesso === "pieno" && (
          <Bottone variante="tonale" icona={Sparkles} onClick={() => setMenu(true)} data-tour="mag-gestione">Gestione rapida</Bottone>
        )}
        {permesso === "pieno" && <Bottone icona={Plus} onClick={() => setFormArt({})}>Aggiungi articolo</Bottone>}
      </div>

      <Foglio aperto={menu} titolo="Gestione rapida" onChiudi={() => setMenu(false)}>
        {/* ── TRE GRUPPI, E LE STESSE IDENTICHE PAROLE DELLA RICERCA ──
            Prima era una fila piatta di sei voci in ordine di quando le ho
            scritte, e per trovarne una bisognava leggerle tutte. Adesso sono
            in tre gruppi con l'intestazione: si aggiunge, si sposta, si
            regolano i livelli. Un elenco di sei cose senza titoli è una lista;
            con i titoli è un pannello di comando.

            I nomi non sono scritti qui: arrivano da AZIONI tramite nomeAzione,
            la stessa tabella che risponde alla lente della ricerca. Quello che
            si legge cercando è parola per parola quello che si legge qui.

            E le voci che hanno bisogno di prodotti non spariscono più quando il
            magazzino è vuoto: restano al loro posto, spente, e dicono perché.
            Una funzione che sparisce è una funzione da ricordare a memoria —
            ed è esattamente la fatica che questo lavoro doveva togliere. */}
        <div className="flex flex-col gap-3">
          {[
            { g: "Aggiungere", voci: [
              { k: "mag-aggiungi", ic: Boxes, d: "Tanti prodotti insieme, con un livello di partenza", on: () => setMulti(true) },
              { k: "mag-copia", ic: Copy, d: "La stessa lista, con gli stessi livelli", on: () => setCopia(true) },
            ] },
            { g: "Spostare", voci: [
              { k: "mag-sposta", ic: ArrowLeftRight, d: "In un altro magazzino, oppure togli e basta", on: () => setSposta(true), serveRoba: true },
              { k: "mag-trasf", ic: ArrowLeftRight, d: "Solo le quantità, verso un altro magazzino", on: () => setTrasf(true), serveRoba: true },
            ] },
            { g: "Livelli", voci: [
              { k: "mag-par", ic: Ruler, d: "La soglia prevista, anche in Gastronorm", on: () => setParMulti(true), serveRoba: true },
              { k: "mag-soglie", ic: TrendingUp, d: "Feriale e weekend, su tanti prodotti insieme", on: () => setSoglie(true), serveRoba: true },
            ] },
          ].map((gruppo) => (
            <div key={gruppo.g} className="flex flex-col gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: T.tenue }}>{gruppo.g}</span>
              {gruppo.voci.map((a) => {
                const spenta = !!a.serveRoba && mag.articoli.length === 0;
                return (
                  <button key={a.k} type="button" data-azione={a.k}
                    onClick={() => {
                      if (spenta) { mostraToast("Questo magazzino è ancora vuoto: prima aggiungi dei prodotti", "avviso"); return; }
                      setMenu(false); a.on();
                    }}
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left"
                    style={{ background: spenta ? "#F4F5F8" : "#F7F9FE", border: `1.5px solid ${T.bordo}`, opacity: spenta ? 0.66 : 1 }}>
                    <span className="rounded-xl p-2.5 shrink-0" style={{ background: spenta ? "#ECEEF3" : "#EAF0FE", color: spenta ? T.tenue : T.blu }}><a.ic size={18} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="font-extrabold block" style={{ color: spenta ? T.dim : T.ink }}>{nomeAzione(a.k)}</span>
                      <span className="text-xs" style={{ color: T.dim }}>{spenta ? "Serve almeno un prodotto qui dentro" : a.d}</span>
                    </span>
                    <ChevronRight size={18} style={{ color: T.tenue }} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Foglio>

      <Foglio aperto={!!formArt} titolo={formArt?.art ? "Modifica articolo" : "Aggiungi articolo"} onChiudi={() => setFormArt(null)}>
        {formArt && <FormArticolo key={formArt.art?.prodottoId || "n"} stato={stato} mag={mag} art={formArt.art}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setFormArt(null)} profilo={profilo} />}
      </Foglio>
      <Foglio aperto={multi} titolo={nomeAzione("mag-aggiungi")} onChiudi={() => setMulti(false)} larga>
        {multi && <FormAggiungiMulti stato={stato} mag={mag} muta={muta} mostraToast={mostraToast} onChiudi={() => setMulti(false)} profilo={profilo} />}
      </Foglio>
      <Foglio aperto={copia} titolo={nomeAzione("mag-copia")} onChiudi={() => setCopia(false)}>
        {copia && <FormCopiaMagazzino stato={stato} mag={mag} muta={muta} mostraToast={mostraToast} onChiudi={() => setCopia(false)} profilo={profilo} />}
      </Foglio>
      <Foglio aperto={soglie} titolo={nomeAzione("mag-soglie")} onChiudi={() => setSoglie(false)} larga>
        {soglie && <FormSoglieMulti stato={stato} mag={mag} muta={muta} mostraToast={mostraToast} onChiudi={() => setSoglie(false)} />}
      </Foglio>
      <Foglio aperto={sposta} titolo={nomeAzione("mag-sposta")} onChiudi={() => setSposta(false)} larga>
        {sposta && <FormSpostaMulti stato={stato} mag={mag} muta={muta} mostraToast={mostraToast} onChiudi={() => setSposta(false)} profilo={profilo} />}
      </Foglio>
      <Foglio aperto={parMulti} titolo={nomeAzione("mag-par")} onChiudi={() => setParMulti(false)} larga>
        {parMulti && <FormParMulti stato={stato} mag={mag} muta={muta} mostraToast={mostraToast} onChiudi={() => setParMulti(false)} />}
      </Foglio>
      <Foglio aperto={!!produz} titolo={`Ho prodotto · ${trova(stato.prodotti, produz?.prodottoId)?.nome || ""}`} onChiudi={() => setProduz(null)}>
        {produz && <FormProduzione key={produz.prodottoId} stato={stato} mag={mag} art={produz}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setProduz(null)} profilo={profilo} />}
      </Foglio>
      <Foglio aperto={!!rett} titolo="Rettifica giacenza" onChiudi={() => setRett(null)}>
        {rett && <FormRettifica key={rett.prodottoId} stato={stato} mag={mag} art={rett}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setRett(null)} profilo={profilo} />}
      </Foglio>
      <Foglio aperto={!!scarto} titolo="Registra scarto" onChiudi={() => setScarto(null)}>
        {scarto && <FormScarto key={scarto.prodottoId} stato={stato} mag={mag} art={scarto}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setScarto(null)} profilo={profilo} />}
      </Foglio>
      <Foglio aperto={!!kardex} titolo="Storico movimenti" onChiudi={() => setKardex(null)} larga>
        {kardex && <MovimentiArticolo stato={stato} mag={mag}
          art={mag.articoli.find((x) => x.prodottoId === kardex.prodottoId) || kardex} />}
      </Foglio>
      <Foglio aperto={trasf} titolo={nomeAzione("mag-trasf")} onChiudi={() => setTrasf(false)}>
        {trasf && <FormTrasferimento stato={stato} mag={mag} muta={muta} mostraToast={mostraToast}
          profilo={profilo} onChiudi={() => setTrasf(false)} />}
      </Foglio>
      {(() => {
        /* Dal laboratorio il prodotto non se ne va da solo: si porta dietro le
           linee che lo aspettavano. Prima di confermare si leggono i nomi, uno
           per uno, perché è una cosa che tocca il lavoro di altre persone. */
        const nomeArt = trova(stato.prodotti, delArt?.prodottoId || "")?.nome;
        const giu = delArt ? lineeColProdotto(stato, mag, delArt.prodottoId) : [];
        const elenco = giu.map((l) => `«${l.nome}» (${trova(stato.sedi, l.sedeId)?.nome || "—"})`).join(", ");
        return (
          <Conferma aperto={!!delArt} titolo={`Rimuovere «${nomeArt}»?`}
            testo={giu.length
              ? `Sarà tolto da «${mag.nome}» e anche dalle ${giu.length} linee che rifornisci: ${elenco}. Le loro soglie andranno perse. Il prodotto resta a catalogo.`
              : "L'articolo sarà tolto da questo magazzino (il prodotto resta a catalogo)."}
            onNo={() => setDelArt(null)}
            testoSi={giu.length ? `Rimuovi da ${giu.length + 1} magazzini` : "Rimuovi"}
            onSi={() => {
              const pid = delArt.prodottoId;
              muta((s) => { togliArticolo(s, mag.id, pid); },
                giu.length
                  ? `«${nomeArt}» rimosso da «${mag.nome}» e dalle ${giu.length} linee rifornite: ${elenco}`
                  : `Articolo rimosso da «${mag.nome}»`);
              mostraToast(giu.length
                ? `Rimosso qui e da ${giu.length} linee`
                : "Articolo rimosso");
              setDelArt(null);
            }} />
        );
      })()}
    </div>
  );
}

function EliminaMagazzino({ stato, mag, muta, mostraToast, onChiudi }) {
  const refs = riferimentiMagazzino(stato, mag.id);
  const nRif = refs.profili.length + refs.linee.length + refs.richieste.length;
  const esegui = () => {
    muta((s) => eliminaMagazzinoCascata(s, mag.id),
      `Magazzino «${mag.nome}» eliminato${nRif ? " in cascata (assegnazioni, riferimenti e richieste sistemati)" : ""}`);
    mostraToast("Magazzino eliminato");
    onChiudi();
  };
  return (
    <div className="flex flex-col gap-4">
      {nRif === 0
        ? <p className="text-sm" style={{ color: T.dim }}>
            Il magazzino e i suoi {mag.articoli.length} articoli saranno rimossi per tutta la rete.
          </p>
        : (<>
          <p className="text-sm" style={{ color: T.dim }}>«{mag.nome}» è ancora collegato alla rete. In un solo passaggio:</p>
          <div className="flex flex-col gap-1.5 text-sm" style={{ color: T.ink }}>
            {refs.profili.length > 0 && <div>· viene tolto dalle assegnazioni di <b>{refs.profili.map((p) => p.nome).join(", ")}</b></div>}
            {refs.linee.length > 0 && <div>· <b>{refs.linee.map((m) => m.nome).join(", ")}</b> perde il retro di riferimento (userà un altro retro della sede, se esiste)</div>}
            {refs.richieste.length > 0 && <div>· <b>{refs.richieste.length}</b> richieste in attesa vengono annullate</div>}
            <div>· articoli e storico movimenti del magazzino vengono rimossi</div>
          </div>
          <p className="text-xs" style={{ color: T.ambra }}>
            Vale per tutta la rete e non è reversibile: se hai dubbi, crea prima un punto di ripristino da Sistema.
          </p>
        </>)}
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone variante="pericolo" icona={Trash2} onClick={esegui}>{nRif ? "Elimina in cascata" : "Elimina"}</Bottone>
      </div>
    </div>
  );
}

/* == ASSEGNA prodotti a PIÙ magazzini insieme == */
/* == IN QUALI MAGAZZINI STA — un prodotto si porta dietro i suoi posti ==

   Nasce da una frase precisa: «se mi capita di aggiungere un prodotto non devo
   fare il giro dell'app per andare a inserirlo in un magazzino». Aveva ragione,
   e il conto era peggio di così: mettere un prodotto in un magazzino si poteva
   fare in QUATTRO modi, con quattro nomi diversi, in tre schermate diverse
   («Assegna a più magazzini», «Aggiungi articolo», «Aggiungi più prodotti»,
   «Copia da un magazzino»). Nessuno dei quattro stava dove sta il prodotto.

   Peggio ancora: il Catalogo scriveva «questi prodotti vanno assegnati a un
   magazzino» e teneva l'unico tasto che li assegna in un'altra sezione. Un
   messaggio che nomina un problema e non porta il rimedio con sé è un cartello
   stradale senza la strada.

   Qui la regola è una: la spunta dice DOVE STA, e si può togliere solo se
   quella giacenza è a zero. Togliere un magazzino con della roba dentro
   vorrebbe dire far sparire delle quantità vere con una spunta, e per quello
   c'è «Sposta o rimuovi», che almeno lo dice. */
function FormDoveSta({ stato, prod, muta, mostraToast, onChiudi, profilo }) {
  const mags = magazziniPerSede(stato, stato.magazzini).filter((m) => puoModificare(profilo, m));
  const dentro = (m) => (m.articoli || []).find((a) => a.prodottoId === prod.id);
  const conRoba = new Set(mags.filter((m) => { const a = dentro(m); return a && Math.abs(a.qty) > 1e-9; }).map((m) => m.id));
  const [sel, setSel] = useState(() => new Set(mags.filter((m) => dentro(m)).map((m) => m.id)));
  const [par, setPar] = useState("");
  const eraDentro = new Set(mags.filter((m) => dentro(m)).map((m) => m.id));

  const toggle = (m) => {
    if (sel.has(m.id) && conRoba.has(m.id)) {
      return mostraToast(`«${m.nome}» ha ancora della merce: svuotalo o usa «Sposta o rimuovi»`, "avviso");
    }
    setSel((s) => { const n = new Set(s); n.has(m.id) ? n.delete(m.id) : n.add(m.id); return n; });
  };

  const daAggiungere = [...sel].filter((id) => !eraDentro.has(id));
  const daTogliere = [...eraDentro].filter((id) => !sel.has(id));

  const salva = () => {
    if (!daAggiungere.length && !daTogliere.length) return mostraToast("Non è cambiato niente", "avviso");
    const nPar = num(par) ?? 0;
    if (nPar < 0) return mostraToast("Livello previsto non valido", "errore");
    muta((s) => {
      for (const id of daAggiungere) {
        const m = trova(s.magazzini, id);
        if (!m || m.articoli.some((a) => a.prodottoId === prod.id)) continue;
        m.articoli.push({ prodottoId: prod.id, uomId: prod.uomBase, par: nPar, qty: 0 });
      }
      for (const id of daTogliere) {
        const m = trova(s.magazzini, id);
        if (!m) continue;
        const i = m.articoli.findIndex((a) => a.prodottoId === prod.id);
        /* seconda rete: anche qui si controlla la giacenza, perché fra
           l'apertura del foglio e il salvataggio qualcuno può aver contato */
        if (i >= 0 && Math.abs(m.articoli[i].qty) <= 1e-9) m.articoli.splice(i, 1);
      }
    }, `«${prod.nome}»: ${daAggiungere.length} magazzini in più, ${daTogliere.length} in meno`);
    mostraToast(daTogliere.length
      ? `${daAggiungere.length} aggiunti · ${daTogliere.length} tolti`
      : `«${prod.nome}» ora sta in ${sel.size} ${sel.size === 1 ? "magazzino" : "magazzini"}`);
    onChiudi();
  };

  if (!mags.length) return <p className="text-sm font-semibold" style={{ color: T.ambra }}>Non hai magazzini su cui puoi lavorare.</p>;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: T.dim }}>
        Spunta i magazzini dove questo prodotto deve stare. Quelli nuovi entrano a
        <b> quantità zero</b>: la conti tu la prima volta.
      </p>
      {daAggiungere.length > 0 && (
        <Campo label="Livello previsto per i nuovi" valore={par} onCambia={(v) => setPar(puliziaNum(v))}
          inputMode="decimal" placeholder="0"
          suggerimento="Vale solo per i magazzini che stai aggiungendo adesso; quelli che c'erano già non si toccano." />
      )}
      <div className="flex flex-col gap-1.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "46vh" }}>
        {mags.map((m) => {
          const on = sel.has(m.id);
          const a = dentro(m);
          const bloccato = on && conRoba.has(m.id);
          const sede = trova(stato.sedi, m.sedeId);
          return (
            <button key={m.id} type="button" onClick={() => toggle(m)}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left"
              style={{ background: on ? "#EAF7F1" : "#F7F9FE", border: `1.5px solid ${on ? T.verde : T.bordo}` }}>
              <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: on ? T.verde : "#fff", border: `1.5px solid ${on ? T.verde : T.tenue}` }}>
                {on && <Check size={13} color="#fff" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="font-bold truncate block" style={{ color: T.ink }}>{m.nome}</span>
                <span className="text-xs" style={{ color: bloccato ? T.ambra : T.tenue }}>
                  {sede?.nome || "—"} · {m.tipo}
                  {a ? ` · c'è: ${fmtQ(a.qty)} ${simboloU(stato, a.uomId)}` : ""}
                  {bloccato ? " · non si toglie con della merce dentro" : ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={Check} onClick={salva} disabilitato={!daAggiungere.length && !daTogliere.length}>
          {daTogliere.length ? `Salva (+${daAggiungere.length} / −${daTogliere.length})` : `Salva${daAggiungere.length ? ` (+${daAggiungere.length})` : ""}`}
        </Bottone>
      </div>
    </div>
  );
}

function FormAssegnaMulti({ stato, muta, mostraToast, onChiudi, profilo }) {
  const [selP, setSelP] = useState(() => new Set());
  const [selM, setSelM] = useState(() => new Set());
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("tutti");
  const [par, setPar] = useState("");
  const listaP = ordinaPerNome(stato.prodotti).filter((p) =>
    (p.nome || "").toLowerCase().includes(q.trim().toLowerCase()) &&
    (filtro === "tutti" || p.categoriaId === filtro));
  const toggleP = (id) => setSelP((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleM = (id) => setSelM((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const salva = () => {
    if (!selP.size) return mostraToast("Seleziona almeno un prodotto", "errore");
    if (!selM.size) return mostraToast("Seleziona almeno un magazzino", "errore");
    const nPar = num(par) ?? 0;
    if (nPar < 0) return mostraToast("Livello previsto non valido", "errore");
    let tot = 0;
    muta((s) => {
      for (const mid of [...selM]) {
        const m = trova(s.magazzini, mid);
        if (!m) continue;
        for (const pid of [...selP]) {
          if (m.articoli.some((a) => a.prodottoId === pid)) continue;
          const p = trova(s.prodotti, pid);
          if (!p) continue;
          m.articoli.push({ prodottoId: pid, uomId: p.uomBase, par: nPar, qty: 0 });
          registraMov(s, { magId: m.id, prodottoId: pid, uomId: p.uomBase, delta: 0, dopo: 0, causale: "articolo", chi: profilo?.nome });
          tot++;
        }
      }
    }, `${selP.size} prodotti assegnati a ${selM.size} magazzini`);
    mostraToast(tot ? `${tot} assegnazioni create (quantità a 0, da contare)` : "Erano già tutti presenti");
    onChiudi();
  };

  return (
    <div className="flex flex-col gap-3">
      <Campo label="Livello previsto di partenza (per tutti)" valore={par} onCambia={(v) => setPar(puliziaNum(v))}
        inputMode="decimal" placeholder="0" />
      <div>
        <span className="block text-sm font-extrabold mb-1.5" style={{ color: T.ink }}>1. Prodotti da assegnare</span>
        <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 mb-2" style={{ background: "#F6F8FE", border: `1.5px solid ${T.bordo}` }}>
          <Search size={16} style={{ color: T.tenue }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca prodotto…"
            className="flex-1 bg-transparent outline-none text-sm font-semibold" style={{ color: T.ink }} />
        </div>
        <div className="flex gap-1.5 flex-wrap mb-2">
          <button onClick={() => setFiltro("tutti")} className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={filtro === "tutti" ? { background: T.grad, color: "#fff" } : { background: T.sup, color: T.dim, border: `1px solid ${T.bordo}` }}>Tutte</button>
          {stato.categorie.map((c) => (
            <button key={c.id} onClick={() => setFiltro(filtro === c.id ? "tutti" : c.id)} className="rounded-full px-2.5 py-1 text-xs font-bold"
              style={filtro === c.id ? { background: c.colore, color: "#fff" } : { background: `${c.colore}14`, color: c.colore, border: `1px solid ${c.colore}33` }}>{c.nome}</button>
          ))}
        </div>
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-sm font-bold" style={{ color: T.blu }}>{selP.size} prodotti</span>
          <div className="flex gap-2">
            <button onClick={() => setSelP((s) => new Set([...s, ...listaP.map((p) => p.id)]))} className="text-xs font-bold" style={{ color: T.blu }}>Tutti ({listaP.length})</button>
            <button onClick={() => setSelP((s) => { const n = new Set(s); listaP.forEach((p) => n.delete(p.id)); return n; })} className="text-xs font-bold" style={{ color: T.tenue }}>Nessuno</button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "26vh" }}>
          {listaP.map((p) => {
            const on = selP.has(p.id); const cat = trova(stato.categorie, p.categoriaId);
            return (
              <button key={p.id} type="button" onClick={() => toggleP(p.id)} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left"
                style={{ background: on ? "#EAF0FE" : "#F7F9FE", border: `1.5px solid ${on ? T.blu : T.bordo}` }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? T.blu : "#fff", border: `1.5px solid ${on ? T.blu : T.tenue}` }}>
                  {on && <Check size={13} color="#fff" />}
                </span>
                <span className="flex-1 min-w-0 font-bold truncate" style={{ color: T.ink }}>{p.nome}</span>
                {cat && <Chip colore={cat.colore}>{cat.nome}</Chip>}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <span className="block text-sm font-extrabold mb-1.5" style={{ color: T.ink }}>2. In quali magazzini</span>
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-sm font-bold" style={{ color: T.viola }}>{selM.size} magazzini</span>
          <div className="flex gap-2">
            <button onClick={() => setSelM(new Set(stato.magazzini.map((m) => m.id)))} className="text-xs font-bold" style={{ color: T.viola }}>Tutti ({stato.magazzini.length})</button>
            <button onClick={() => setSelM(new Set())} className="text-xs font-bold" style={{ color: T.tenue }}>Nessuno</button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "22vh" }}>
          {magazziniPerSede(stato, stato.magazzini).map((m) => {
            const on = selM.has(m.id); const sede = trova(stato.sedi, m.sedeId); const meta = TIPI_MAG[m.tipo];
            return (
              <button key={m.id} type="button" onClick={() => toggleM(m.id)} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left"
                style={{ background: on ? "#F1EDFE" : "#F7F9FE", border: `1.5px solid ${on ? T.viola : T.bordo}` }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? T.viola : "#fff", border: `1.5px solid ${on ? T.viola : T.tenue}` }}>
                  {on && <Check size={13} color="#fff" />}
                </span>
                <span className="flex-1 min-w-0"><span className="font-bold truncate block" style={{ color: T.ink }}>{m.nome}</span>
                  <span className="text-xs" style={{ color: T.tenue }}>{sede?.nome} · {meta?.nome}</span></span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={Check} onClick={salva} disabilitato={!selP.size || !selM.size}>Assegna</Bottone>
      </div>
    </div>
  );
}

/* ─────────── INVENTARIO GUIDATO ───────────
   Un inventario non è un conteggio di linea: il conteggio serve a far partire
   richieste e ordini, l'inventario serve a rimettere i numeri dell'app
   d'accordo con lo scaffale. Per questo scrive «rettifica» e non «conteggio»,
   e non genera nessun ordine: se lo facesse, il giro d'inventario riempirebbe
   la lista della spesa di roba che nessuno ha chiesto.
   Lo stato sta dentro i dati sincronizzati, non nella schermata: così puoi
   chiudere l'app a metà e riprendere, e due persone possono contare due
   magazzini diversi nello stesso momento vedendo l'avanzamento dell'altra. */
const chiaveInv = (magId, pid) => magId + "|" + pid;
/* ─────────── UN INVENTARIO PER SEDE ───────────
   Prima ce n'era uno solo per tutta l'azienda: se Fiumicino ne apriva uno,
   Roma entrava dentro quello di Fiumicino e non trovava nessuno dei suoi
   magazzini da contare, quindi doveva aspettare. Ora la chiave è la sede, così
   le due squadre non si pestano i piedi, e resta vero il pregio di prima: due
   persone della STESSA sede contano due magazzini diversi vedendo l'avanzamento
   l'una dell'altra. Chi non ha una sede (l'admin) ha la sua chiave a parte. */
const chiaveSedeInv = (profilo) => profilo?.sedeId || "_tutte";
/* «chiave» si passa quando chi guarda ha scelto una sede: l'admin non ne ha una
   sua, e senza questo parametro finirebbe sempre e solo sulla sessione «tutte». */
function invDi(stato, profilo, chiave) {
  const mio = (stato.invCorso || {})[chiave || chiaveSedeInv(profilo)];
  if (mio) return mio;
  /* Un inventario aperto con la versione precedente sta ancora nel vecchio
     campo unico. Lo lascio vedere e chiudere a chi ha i suoi magazzini: alla
     chiusura passa da sé al nuovo schema, e nessuno perde un giro di conta. */
  const vecchio = stato.inventario;
  if (vecchio && (vecchio.magIds || []).some((id) => {
    const m = trova(stato.magazzini, id);
    return m && permessoSu(profilo, m) !== "lettura";
  })) return vecchio;
  return null;
}
/* I magazzini già dentro l'inventario di qualcun altro. Lo stesso magazzino in
   due inventari aperti vuol dire due conteggi che si sovrascrivono a vicenda,
   e chi chiude per ultimo vince senza che nessuno lo sappia. */
function magOccupati(stato, profilo, chiave) {
  const mia = chiave || chiaveSedeInv(profilo);
  const mio = invDi(stato, profilo, mia);
  const out = new Set();
  for (const [k, v] of Object.entries(stato.invCorso || {})) {
    if (k === mia) continue;
    for (const id of v.magIds || []) out.add(id);
  }
  if (stato.inventario && stato.inventario !== mio) {
    for (const id of stato.inventario.magIds || []) out.add(id);
  }
  return out;
}
/* chi lo sta tenendo aperto, per poterlo dire con un nome invece che «qualcuno» */
function chiTiene(stato, magId) {
  for (const v of Object.values(stato.invCorso || {})) {
    if ((v.magIds || []).includes(magId)) return v.chi;
  }
  if ((stato.inventario?.magIds || []).includes(magId)) return stato.inventario.chi;
  return null;
}
/* Chiudere la sessione giusta: quella della sede se c'è, se no la vecchia
   sessione unica. Senza questo distinguo, chiudere un inventario ereditato
   lascerebbe il vecchio campo lì per sempre e l'app crederebbe di averne uno
   aperto in eterno. */
function chiudiSessioneInv(s, chiave) {
  if (s.invCorso && s.invCorso[chiave]) {
    delete s.invCorso[chiave];
    if (!Object.keys(s.invCorso).length) delete s.invCorso;
  } else {
    delete s.inventario;
  }
}
function avanzamentoInv(inv, mag) {
  const arts = mag.articoli || [];
  const contati = arts.filter((a) => inv?.valori?.[chiaveInv(mag.id, a.prodottoId)] != null).length;
  return { contati, totale: arts.length, chiuso: (inv?.chiusi || []).includes(mag.id) };
}
/* Solo le differenze vere. Una casella contata uguale a quella registrata non
   è una differenza e non deve produrre un movimento: se no ogni inventario
   lascia dietro centinaia di righe da zero che non dicono niente. */
function differenzeInv(stato, inv) {
  const out = [];
  for (const mid of inv?.magIds || []) {
    const mag = trova(stato.magazzini, mid);
    if (!mag) continue;
    for (const a of mag.articoli || []) {
      const v = inv.valori?.[chiaveInv(mid, a.prodottoId)];
      if (v == null) continue;
      const prod = trova(stato.prodotti, a.prodottoId);
      const dopo = prod?.soloInteri ? Math.max(0, Math.round(v)) : v;
      const delta = +(dopo - a.qty).toFixed(4);
      if (Math.abs(delta) < 1e-9) continue;
      /* il valore della differenza si dice solo se si sa: prezzo e conversione
         devono esserci entrambi, se no il numero sarebbe inventato */
      let euro = null;
      if (prod?.prezzo > 0) {
        const base = a.uomId === prod.uomBase ? delta : converti(prod, delta, a.uomId, prod.uomBase);
        if (base != null) euro = base * prod.prezzo;
      }
      out.push({ mag, art: a, prod, prima: a.qty, dopo, delta, euro,
        sym: simboloU(stato, a.uomId) });
    }
  }
  return out.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}

/* ─────────── IL FOGLIO DI UN INVENTARIO CHIUSO ───────────
   Chiudendo un inventario restavano solo le rettifiche sparse nello storico e
   una riga di riepilogo: per capire dove sparisce la merce serve invece il
   foglio di quel giorno, differenza per differenza. Il foglio sta nei dati
   sincronizzati, e quei dati viaggiano sul 4G della cucina a ogni scrittura: lo
   stato oggi pesa un centinaio di kilobyte, e sei fogli da centocinquanta righe
   se ne prenderebbero altri sessanta. Per questo si tengono gli ultimi quattro
   inventari e al massimo centoventi differenze per foglio — nel caso peggiore
   trentamila byte, in pratica poche centinaia — dicendo quante differenze
   restano fuori invece di tagliarle in silenzio. Quelle ci sono comunque tutte
   nello storico dei movimenti: qui si perde il foglio, non il dato. */
const MAX_FOGLI_INV = 4;
const MAX_RIGHE_FOGLIO = 120;
const dataFoglio = (t) => new Date(t).toLocaleDateString("it-IT",
  { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
/* Il foglio salvato tiene solo gli id, non i nomi: nomi, unità e prezzi si
   rileggono adesso, come fa il resto dell'app. Se un prodotto è stato cancellato
   dal catalogo dopo, il foglio lo dice invece di far sparire la riga. */
function righeFoglio(stato, f) {
  return (f?.righe || []).map((r) => {
    const prod = trova(stato.prodotti, r.p);
    const mag = trova(stato.magazzini, r.m);
    const delta = +(r.a - r.da).toFixed(4);
    let euro = null;
    if (prod?.prezzo > 0) {
      const base = r.u === prod.uomBase ? delta : converti(prod, delta, r.u, prod.uomBase);
      if (base != null) euro = base * prod.prezzo;
    }
    return { nome: prod?.nome || "prodotto non piu' a catalogo",
      magNome: mag?.nome || "magazzino rimosso", sym: simboloU(stato, r.u),
      prima: r.da, dopo: r.a, delta, euro };
  }).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}

function VistaInventario({ stato, profilo, muta, mostraToast, onChiudi }) {
  /* ── L'ADMIN SCEGLIE LA SEDE ──
     Chi ha una sede lavora sulla sua e non deve scegliere niente. L'admin non ne
     ha una: prima il suo inventario si prendeva tutti i magazzini liberi delle
     due sedi insieme, e finché era aperto le squadre non potevano aprire il loro.
     Ora sceglie, e la sessione è quella DELLA SEDE: se Fiumicino ha già il suo
     aperto, l'admin ci entra dentro invece di aprirne un secondo. */
  const [sedeScelta, setSedeScelta] = useState(null);
  const sceglibili = profilo.sedeId ? [] : sediViste(stato, profilo)
    .filter((sd) => stato.magazzini.some((m) => m.sedeId === sd.id && permessoSu(profilo, m) !== "lettura"));
  const chiave = profilo.sedeId || sedeScelta || "_tutte";
  const inv = invDi(stato, profilo, chiave);
  const deveScegliere = !profilo.sedeId && sceglibili.length > 1 && !sedeScelta && !inv;
  /* i miei magazzini, meno quelli che stanno già nell'inventario di un altro */
  const occupati = magOccupati(stato, profilo, chiave);
  const tutti = magazziniVisti(stato, profilo)
    .filter((m) => permessoSu(profilo, m) !== "lettura")
    /* se l'admin ha scelto una sede, il giro è quello di quella sede e basta */
    .filter((m) => chiave === "_tutte" || m.sedeId === chiave);
  const mios = tutti.filter((m) => !occupati.has(m.id));
  const bloccati = tutti.filter((m) => occupati.has(m.id));
  const [magId, setMagId] = useState(null);
  const [chiediFine, setChiediFine] = useState(false);
  const [chiediAnnulla, setChiediAnnulla] = useState(false);
  const [bozza, setBozza] = useState({});      // quello che si sta scrivendo adesso
  const [storia, setStoria] = useState(false); // gli inventari già chiusi
  const [apertoF, setApertoF] = useState(null);
  const mag = trova(stato.magazzini, magId);
  const fogli = stato.inventari || [];

  const inclusi = (inv?.magIds || []).map((id) => trova(stato.magazzini, id)).filter(Boolean)
    .filter((m) => permessoSu(profilo, m) !== "lettura");
  const diff = inv ? differenzeInv(stato, inv) : [];
  const tuttiChiusi = inclusi.length > 0 && inclusi.every((m) => (inv.chiusi || []).includes(m.id));

  const avvia = () => {
    /* il muro anche qui, non solo sul tasto di VistaMagazzini */
    if (!puoCorreggere(profilo))
      return mostraToast("Per l'inventario serve l'autorizzazione dell'admin (Profili)", "errore");
    if (!mios.length) return mostraToast("Non hai magazzini da inventariare", "errore");
    const n = mios.length;
    muta((s) => {
      /* i liberi si ricontano qui dentro sui dati appena riletti: nel frattempo
         l'altra sede può aver aperto il suo inventario, e partire con un elenco
         vecchio vorrebbe dire prendersi un magazzino che ora è di un altro */
      const occ = magOccupati(s, profilo, chiave);
      const liberi = magazziniVisti(s, profilo)
        .filter((m) => permessoSu(profilo, m) !== "lettura" && !occ.has(m.id))
        /* il filtro della sede va rifatto ANCHE qui dentro: fuori serve a
           disegnare la schermata, qui a decidere cosa entra davvero nella
           sessione. Senza, l'admin che ha scelto una sede si portava dentro
           anche i magazzini dell'altra e il filtro sembrava funzionare solo
           perché a schermo non si vedevano. */
        .filter((m) => chiave === "_tutte" || m.sedeId === chiave);
      if (!liberi.length) return;
      const per = s.invCorso || {};
      per[chiave] = { id: uid("inv"), t: Date.now(), chi: profilo.nome,
        sedeId: profilo.sedeId || null, magIds: liberi.map((m) => m.id), valori: {}, chiusi: [] };
      s.invCorso = per;
    }, `Inventario avviato da ${profilo.nome} su ${n} magazzin${n === 1 ? "o" : "i"}`);
    mostraToast(`Inventario avviato: ${n} magazzin${n === 1 ? "o" : "i"} da contare`);
  };

  /* si salva quando si esce dal magazzino, non a ogni cifra battuta: una
     sincronizzazione per tasto premuto sul 4G della cucina è insostenibile */
  const salvaBozza = (chiudi) => {
    const voci = Object.entries(bozza).map(([pid, testo]) => [pid, num(testo)])
      .filter(([, n]) => n != null && n >= 0);
    if (!voci.length && !chiudi) { setMagId(null); setBozza({}); return; }
    muta((s) => {
      const iv = (s.invCorso || {})[chiave] || s.inventario;
      if (!iv) return;
      for (const [pid, n] of voci) iv.valori[chiaveInv(magId, pid)] = n;
      if (chiudi && !(iv.chiusi || []).includes(magId)) {
        iv.chiusi = [...(iv.chiusi || []), magId];
      }
    }, chiudi ? `Inventario: «${mag.nome}» segnato come fatto (${voci.length} contate)`
      : `Inventario: ${voci.length} conteggi salvati in «${mag.nome}»`);
    mostraToast(chiudi ? `«${mag.nome}» fatto` : `${voci.length} salvate`);
    setMagId(null); setBozza({});
  };

  const concludi = () => {
    const n = diff.length;
    muta((s) => {
      const iv = (s.invCorso || {})[chiave] || s.inventario;
      if (!iv) return;
      /* le righe del foglio si raccolgono qui dentro e non in una variabile di
         fuori: muta può rieseguire il blocco dopo aver riletto i dati, e una
         lista di fuori si riempirebbe due volte */
      const righe = [];
      let troncate = 0;
      for (const mid of iv.magIds || []) {
        const m = trova(s.magazzini, mid);
        if (!m) continue;
        for (const a of m.articoli || []) {
          const v = iv.valori?.[chiaveInv(mid, a.prodottoId)];
          if (v == null) continue;
          const prod = trova(s.prodotti, a.prodottoId);
          const dopo = prod?.soloInteri ? Math.max(0, Math.round(v)) : v;
          if (Math.abs(dopo - a.qty) < 1e-9) continue;
          const prima = a.qty;
          a.qty = dopo;
          registraMov(s, { magId: m.id, prodottoId: a.prodottoId, uomId: a.uomId,
            delta: dopo - prima, dopo, causale: "rettifica", chi: profilo.nome,
            rif: "inventario" });
          if (righe.length < MAX_RIGHE_FOGLIO) righe.push({ m: mid, p: a.prodottoId, u: a.uomId, da: prima, a: dopo });
          else troncate++;
        }
      }
      /* il foglio resta anche dopo la chiusura: senza, un inventario chiuso non
         si può più rileggere e resta solo la polvere delle rettifiche */
      const foglio = { id: iv.id, t: iv.t, tFine: Date.now(), chi: iv.chi,
        chiusoDa: profilo.nome, magIds: iv.magIds,
        contate: Object.keys(iv.valori || {}).length, righe };
      if (troncate) foglio.troncate = troncate;
      s.inventari = [foglio, ...(s.inventari || []).filter((x) => x.id !== foglio.id)]
        .slice(0, MAX_FOGLI_INV);
      chiudiSessioneInv(s, chiave);
    }, `Inventario chiuso da ${profilo.nome}: ${n} giacenze corrette`);
    mostraToast(n ? `${n} giacenze corrette · il foglio resta negli inventari chiusi`
      : "Inventario chiuso: nessuna differenza");
    setChiediFine(false);
    onChiudi();
  };

  const annulla = () => {
    muta((s) => { chiudiSessioneInv(s, chiave); }, `Inventario annullato da ${profilo.nome}`);
    mostraToast("Inventario annullato: nessuna giacenza toccata");
    setChiediAnnulla(false);
    onChiudi();
  };

  /* ── l'admin sceglie su quale sede fare il giro ── */
  if (deveScegliere) return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: T.dim }}>
        Tu vedi tutte le sedi, quindi scegli su quale fare il giro. Se una squadra
        ha già aperto il suo inventario, entri nel suo invece di aprirne un altro:
        lo stesso magazzino contato due volte finirebbe col numero di chi chiude
        per ultimo.
      </p>
      {sceglibili.map((sd) => {
        const suoi = stato.magazzini.filter((m) => m.sedeId === sd.id && permessoSu(profilo, m) !== "lettura");
        const aperto = (stato.invCorso || {})[sd.id];
        const fatti = aperto ? (aperto.chiusi || []).length : 0;
        return (
          <button key={sd.id} onClick={() => setSedeScelta(sd.id)}
            className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left w-full"
            style={{ background: "#fff", border: `1.5px solid ${aperto ? T.viola : T.bordo}` }}>
            <span className="rounded-2xl p-2.5 shrink-0"
              style={{ background: aperto ? "#F1EDFE" : "#EDF1FA", color: aperto ? T.viola : T.dim }}>
              <Boxes size={18} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="font-extrabold block leading-tight" style={{ color: T.ink }}>{sd.nome}</span>
              <span className="text-xs block leading-tight" style={{ color: T.dim }}>
                {aperto
                  ? `in corso, iniziato da ${aperto.chi} · ${fatti} su ${(aperto.magIds || []).length} fatti`
                  : `${suoi.length} magazzin${suoi.length === 1 ? "o" : "i"} · ${suoi.reduce((n, m) => n + (m.articoli || []).length, 0)} caselle`}
              </span>
            </span>
            {aperto && <Chip colore={T.viola}>in corso</Chip>}
            <ChevronRight size={18} className="shrink-0" style={{ color: T.tenue }} />
          </button>
        );
      })}
      <button onClick={() => setSedeScelta("_tutte")}
        className="rounded-2xl px-3.5 py-3 text-left w-full text-sm"
        style={{ background: "#F7F9FE", border: `1.5px solid ${T.bordo}`, color: T.dim }}>
        <b style={{ color: T.ink }}>Tutte le sedi in un giro solo</b> — comodo se conti da solo,
        ma mentre è aperto le squadre non possono aprire il loro.
      </button>
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" icona={History} onClick={() => setStoria(true)}>Inventari chiusi</Bottone>
        <Bottone variante="fantasma" onClick={onChiudi}>Chiudi</Bottone>
      </div>
    </div>
  );

  /* ── gli inventari già chiusi, uno per uno ── */
  if (storia) return (
    <div className="flex flex-col gap-3">
      <button onClick={() => { setStoria(false); setApertoF(null); }}
        className="flex items-center gap-1.5 text-sm font-bold rounded-full px-3 py-2 self-start"
        style={{ color: T.dim, background: "#EDF1FA" }}>
        <ArrowLeft size={15} /> Indietro
      </button>
      <p className="text-sm" style={{ color: T.dim }}>
        {fogli.length === 0
          ? "Non c'è ancora nessun inventario chiuso: il primo che chiudi resta qui."
          : `Tocca un giorno per vedere differenza per differenza cosa è cambiato. Si tengono gli ultimi ${MAX_FOGLI_INV} inventari.`}
      </p>
      <div className="flex flex-col gap-2" style={{ maxHeight: "58vh", overflowY: "auto" }}>
        {fogli.map((f) => {
          const righe = righeFoglio(stato, f);
          const conE = righe.filter((r) => r.euro != null);
          const euroF = conE.reduce((n, r) => n + r.euro, 0);
          const dentro = apertoF === f.id;
          return (
            <div key={f.id} className="rounded-2xl" style={{ background: "#fff", border: `1.5px solid ${T.bordo}` }}>
              <button onClick={() => setApertoF(dentro ? null : f.id)}
                aria-expanded={dentro}
                className="flex items-center gap-3 px-3.5 py-3 text-left w-full">
                <span className="rounded-2xl p-2.5 shrink-0" style={{ background: "#F1EDFE", color: T.viola }}>
                  <ClipboardList size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="font-extrabold block leading-tight" style={{ color: T.ink }}>
                    {dataFoglio(f.tFine || f.t)}
                  </span>
                  <span className="text-xs block leading-tight" style={{ color: T.dim }}>
                    {f.chi}{f.chiusoDa && f.chiusoDa !== f.chi ? `, chiuso da ${f.chiusoDa}` : ""}
                    {" · "}{f.contate} contate · {righe.length} {righe.length === 1 ? "differenza" : "differenze"}
                  </span>
                </span>
                {conE.length > 0 && <Chip colore={euroF < 0 ? T.rosso : T.verde}>{fmtEuro(euroF)}</Chip>}
                <ChevronRight size={18} className="shrink-0" style={{ color: T.tenue,
                  transform: dentro ? "rotate(90deg)" : "none", transition: "transform .18s" }} />
              </button>
              {dentro && (
                <div className="px-3.5 pb-3 flex flex-col gap-1">
                  {righe.length === 0
                    ? <p className="text-xs" style={{ color: T.verde }}>
                        Nessuna differenza: quel giorno i numeri dell'app erano giusti.
                      </p>
                    : righe.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs rounded-xl px-2.5 py-1.5"
                        style={{ background: "#F7F9FE" }}>
                        <span className="flex-1 min-w-0">
                          <b className="block leading-tight" style={{ color: T.ink }}>{r.nome}</b>
                          <span className="block leading-tight" style={{ color: T.tenue }}>{r.magNome}</span>
                        </span>
                        <span className="shrink-0" style={{ color: T.tenue }}>{fmtQ(r.prima)}</span>
                        <span className="shrink-0" style={{ color: T.tenue }}>→</span>
                        <b className="shrink-0" style={{ color: r.delta < 0 ? T.rosso : T.verde }}>
                          {fmtQ(r.dopo)} {r.sym}
                        </b>
                        {r.euro != null && <span className="shrink-0" style={{ color: r.euro < 0 ? T.rosso : T.verde }}>
                          {fmtEuro(r.euro)}</span>}
                      </div>
                    ))}
                  {f.troncate > 0 && (
                    <p className="text-xs mt-1" style={{ color: "#7A4A00" }}>
                      Altre {f.troncate} differenze non stanno nel foglio: il limite è {MAX_RIGHE_FOGLIO}
                      {" "}righe. Le trovi comunque nello Storico dei movimenti.
                    </p>
                  )}
                  {conE.length > 0 && conE.length < righe.length && (
                    <p className="text-xs" style={{ color: T.tenue }}>
                      {righe.length - conE.length} righe senza valore in euro: manca il prezzo o la conversione.
                    </p>
                  )}
                  {conE.length === 0 && righe.length > 0 && (
                    <p className="text-xs" style={{ color: T.tenue }}>
                      Il valore in euro non si può calcolare: manca il prezzo.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── non c'è nessun inventario in corso ── */
  if (!inv) return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: T.dim }}>
        Ti porta <b style={{ color: T.ink }}>magazzino per magazzino</b>, tiene il conto di
        cosa hai già fatto anche se chiudi l'app, e alla fine ti mostra le differenze
        prima di scriverle.
      </p>
      <div className="rounded-2xl px-3.5 py-3 text-sm" style={{ background: "#EFF7F3", border: "1px solid #CFEADD", color: T.ink }}>
        Non è il conteggio di linea: l'inventario <b>corregge le giacenze</b> e non
        fa partire né richieste né ordini.
      </div>
      <div className="rounded-2xl px-3.5 py-3" style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
        <div className="text-sm font-bold mb-1" style={{ color: T.ink }}>
          {mios.length} magazzin{mios.length === 1 ? "o" : "i"} ·{" "}
          {mios.reduce((n, m) => n + (m.articoli || []).length, 0)} caselle
        </div>
        <div className="text-xs" style={{ color: T.dim }}>{mios.map((m) => m.nome).join(" · ") || "nessuno"}</div>
      </div>
      {/* Un magazzino che sta già nell'inventario di un altro resta fuori dal
          tuo: due conteggi sulla stessa casella si sovrascriverebbero e vince
          chi chiude per ultimo. Meglio dirlo, col nome di chi lo tiene. */}
      {bloccati.length > 0 && (
        <div className="rounded-2xl px-3.5 py-3 text-sm"
          style={{ background: "#FFF6E8", border: "1px solid #F2DCC0", color: "#7A4A00" }}>
          {bloccati.length === 1 ? "Un magazzino resta" : `${bloccati.length} magazzini restano`} fuori:
          {" "}{bloccati.map((m) => `«${m.nome}»${chiTiene(stato, m.id) ? ` (lo sta contando ${chiTiene(stato, m.id)})` : ""}`).join(", ")}.
          {" "}Li conterai quando l'altro inventario è chiuso: la stessa casella contata due
          volte in due giri diversi finirebbe col numero di chi chiude per ultimo.
        </div>
      )}
      <button onClick={() => setStoria(true)}
        className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left w-full"
        style={{ background: "#fff", border: `1.5px solid ${T.bordo}` }}>
        <span className="rounded-2xl p-2.5 shrink-0" style={{ background: "#F1EDFE", color: T.viola }}>
          <History size={18} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="font-extrabold block leading-tight" style={{ color: T.ink }}>Inventari chiusi</span>
          <span className="text-xs block leading-tight" style={{ color: T.dim }}>
            {fogli.length === 0 ? "ancora nessuno"
              : `${fogli.length} ${fogli.length === 1 ? "foglio" : "fogli"} · l'ultimo ${tempoFa(fogli[0].tFine || fogli[0].t)}`}
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0" style={{ color: T.tenue }} />
      </button>
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onChiudi}>Chiudi</Bottone>
        <Bottone icona={ClipboardList} onClick={avvia} disabilitato={!mios.length}>Avvia inventario</Bottone>
      </div>
    </div>
  );

  /* ── dentro un magazzino: si conta ── */
  if (mag) {
    const arts = perCategoria(stato, mag.articoli || []);
    const scritte = Object.values(bozza).filter((v) => num(v) != null).length;
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl px-3.5 py-3" style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
          <div className="font-extrabold" style={{ color: T.ink }}>{mag.nome}</div>
          <div className="text-xs mt-0.5" style={{ color: T.dim }}>
            Scrivi quello che vedi. Quello che lasci vuoto resta com'è: non viene toccato.
          </div>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto sc-scroll pr-1" style={{ maxHeight: "52vh" }}>
          {arts.map(({ cat, arts: righe }) => (
            <div key={cat?.id || "_"}>
              <IntestaCat cat={cat} n={righe.length} />
              {righe.map((a) => {
                const prod = trova(stato.prodotti, a.prodottoId);
                const k = chiaveInv(mag.id, a.prodottoId);
                const gia = inv.valori?.[k];
                const val = bozza[a.prodottoId] ?? (gia != null ? String(gia).replace(".", ",") : "");
                return (
                  <div key={a.prodottoId} className="flex items-center gap-2 rounded-2xl px-3 py-2 mb-1.5"
                    style={{ background: gia != null ? "#EFF7F3" : "#F7F9FE",
                      border: `1px solid ${gia != null ? "#CFEADD" : T.bordo}` }}>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold leading-tight" style={{ color: T.ink }}>{prod?.nome || "—"}</span>
                      <span className="block text-xs" style={{ color: T.tenue }}>
                        l'app dice {fmtQ(a.qty)} {simboloU(stato, a.uomId)}
                      </span>
                    </span>
                    <input value={val} inputMode="decimal"
                      aria-label={`Contato di ${prod?.nome} in ${mag.nome}`}
                      onChange={(e) => setBozza((v) => ({ ...v, [a.prodottoId]: puliziaNum(e.target.value) }))}
                      placeholder="—" className="w-20 shrink-0 rounded-xl px-2.5 py-2 text-base font-bold text-center"
                      style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink, outline: "none" }} />
                    <span className="text-xs font-bold shrink-0 w-9" style={{ color: T.dim }}>{simboloU(stato, a.uomId)}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end flex-wrap">
          <Bottone variante="fantasma" icona={ArrowLeft} onClick={() => salvaBozza(false)}>
            {scritte ? `Salva e torna (${scritte})` : "Torna indietro"}
          </Bottone>
          <Bottone icona={Check} onClick={() => salvaBozza(true)}>Magazzino fatto</Bottone>
        </div>
      </div>
    );
  }

  /* ── l'elenco dei magazzini, con l'avanzamento ── */
  const contateTot = inclusi.reduce((n, m) => n + avanzamentoInv(inv, m).contati, 0);
  const caselleTot = inclusi.reduce((n, m) => n + (m.articoli || []).length, 0);
  const euroTot = diff.reduce((n, d) => n + (d.euro || 0), 0);
  const conEuro = diff.filter((d) => d.euro != null).length;
  const nonFatti = inclusi.length - (inv.chiusi || []).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl px-3.5 py-3" style={{ background: "#F1EDFE", border: "1px solid #DCD2FA" }}>
        <div className="font-extrabold" style={{ color: T.ink }}>
          Iniziato da {inv.chi} · {tempoFa(inv.t)}
        </div>
        <div className="text-xs mt-0.5" style={{ color: T.dim }}>
          {contateTot} caselle contate su {caselleTot} · {(inv.chiusi || []).length} magazzin{(inv.chiusi || []).length === 1 ? "o" : "i"} su {inclusi.length}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {inclusi.map((m) => {
          const av = avanzamentoInv(inv, m);
          const meta = TIPI_MAG[m.tipo];
          return (
            <button key={m.id} onClick={() => { setMagId(m.id); setBozza({}); }}
              className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left w-full"
              style={{ background: av.chiuso ? "#EFF7F3" : "#fff",
                border: `1.5px solid ${av.chiuso ? "#CFEADD" : T.bordo}` }}>
              <span className="rounded-2xl p-2.5 shrink-0" style={{ background: `${meta.colore}18`, color: meta.colore }}>
                {av.chiuso ? <Check size={18} /> : <Boxes size={18} />}
              </span>
              <span className="flex-1 min-w-0">
                {/* va a capo invece di troncarsi: «Magazzino consumabili»
                    diventava «Magazzino consu…» e due magazzini con lo stesso
                    inizio non si distinguevano piu' */}
                <span className="font-extrabold block leading-tight" style={{ color: T.ink }}>{m.nome}</span>
                <span className="text-xs block" style={{ color: T.dim }}>
                  {trova(stato.sedi, m.sedeId)?.nome} · {av.contati} su {av.totale} contate
                </span>
              </span>
              {av.chiuso && <Chip colore={T.verde}>fatto</Chip>}
              <ChevronRight size={18} style={{ color: T.tenue }} />
            </button>
          );
        })}
      </div>

      {diff.length > 0 && (
        <div className="rounded-2xl px-3.5 py-3" style={{ background: "#FFF6E8", border: "1px solid #F2DCC0" }}>
          <div className="font-extrabold text-sm" style={{ color: "#7A4A00" }}>
            {diff.length} {diff.length === 1 ? "differenza" : "differenze"} finora
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#7A4A00" }}>
            {conEuro > 0
              ? `Valore della differenza: ${fmtEuro(euroTot)}${conEuro < diff.length ? ` · ${diff.length - conEuro} senza prezzo` : ""}`
              : "Il valore non si può calcolare: manca il prezzo"}
          </div>
          <div className="flex flex-col gap-1 mt-2" style={{ maxHeight: "26vh", overflowY: "auto" }}>
            {diff.slice(0, 40).map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs rounded-xl px-2.5 py-1.5"
                style={{ background: "#fff" }}>
                <span className="flex-1 min-w-0">
                  <b className="block leading-tight" style={{ color: T.ink }}>{d.prod?.nome || "—"}</b>
                  <span className="block leading-tight" style={{ color: T.tenue }}>{d.mag.nome}</span>
                </span>
                <span style={{ color: T.tenue }}>{fmtQ(d.prima)}</span>
                <span style={{ color: T.tenue }}>→</span>
                <b style={{ color: d.delta < 0 ? T.rosso : T.verde }}>{fmtQ(d.dopo)} {d.sym}</b>
              </div>
            ))}
            {diff.length > 40 && (
              <div className="text-xs px-2.5" style={{ color: "#7A4A00" }}>
                e altre {diff.length - 40}: le vedrai tutte nello storico
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end flex-wrap">
        <Bottone variante="fantasma" icona={History} onClick={() => setStoria(true)}>Inventari chiusi</Bottone>
        <Bottone variante="fantasma" icona={X} onClick={() => setChiediAnnulla(true)}>Annulla inventario</Bottone>
        <Bottone variante="fantasma" onClick={onChiudi}>Continua dopo</Bottone>
        <Bottone icona={Check} onClick={() => setChiediFine(true)}>
          {tuttiChiusi ? "Chiudi inventario" : "Chiudi comunque"}
        </Bottone>
      </div>

      <Conferma aperto={chiediFine}
        titolo={diff.length ? `Correggere ${diff.length} giacenze?` : "Chiudere l'inventario?"}
        testo={diff.length
          ? `Le giacenze passano a quello che hai contato${conEuro > 0 ? `, per un valore di ${fmtEuro(euroTot)}` : ""}. ${tuttiChiusi ? "" : `Attenzione: ${nonFatti} magazzin${nonFatti === 1 ? "o non l'hai" : "i non li hai"} ancora segnat${nonFatti === 1 ? "o" : "i"} come fatt${nonFatti === 1 ? "o" : "i"}, e quello che non hai contato resta com'è. `}Il foglio di questo inventario resta negli inventari chiusi, e ogni correzione finisce nello storico e si può riportare indietro.`
          : "Non hai trovato differenze: si chiude senza toccare niente, e il foglio resta a dire che quel giorno era tutto giusto."}
        testoSi={diff.length ? `Correggi ${diff.length}` : "Chiudi"}
        onNo={() => setChiediFine(false)} onSi={concludi} />
      <Conferma aperto={chiediAnnulla} titolo="Buttare via l'inventario?"
        testo="Si perdono tutti i conteggi fatti finora. Le giacenze NON vengono toccate: restano quelle di prima."
        testoSi="Butta via" onNo={() => setChiediAnnulla(false)} onSi={annulla} />
    </div>
  );
}

function VistaMagazzini({ stato, muta, mostraToast, profilo, salto }) {

  const admin = profilo.ruolo === "admin";
  /* il laboratorio apre su «tutte»: la prima cosa che deve vedere è a chi
     sta mandando la roba, non solo il proprio scaffale.
     «salto» arriva dalla Home («Apri questo magazzino»): si legge SOLO qui
     negli inizializzatori — la vista viene rimontata a ogni navigazione,
     quindi il dato e' sempre fresco e non serve nessun effect. */
  const [filtro, setFiltro] = useState(() => {
    const m = salto?.magId && trova(stato.magazzini, salto.magId);
    if (m) return m.sedeId;
    return admin || profilo.ruolo === "laboratorio" ? "tutte" : profilo.sedeId;
  });
  const [apertoId, setApertoId] = useState(salto?.magId ?? null);
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [assegna, setAssegna] = useState(false);   // assegna prodotti a più magazzini
  const [inventario, setInventario] = useState(false);  // giro d'inventario guidato

  const visti = magazziniVisti(stato, profilo);
  /* l'inventario si offre solo su quello che quel profilo puo' davvero
     correggere: contare un magazzino che poi non puoi scrivere e' una beffa */
  const inventariabili = visti.filter((m) => permessoSu(profilo, m) !== "lettura");
  /* ── IL TASTO NON PARLA A NOME D'ALTRI ──
     L'admin non ha una sede, quindi un inventario «suo» per sede non esiste.
     Prima, se una squadra stava contando, il tasto pescava la PRIMA sessione
     aperta che trovava — di chiunque fosse — e ne mostrava l'avanzamento:
     «Inventario · 1 su 1», come se il giro fosse dell'admin e fosse a un passo
     dalla fine. Toccandolo si apriva invece «su quale sede vuoi fare il giro?»,
     perché quel conteggio non era mai stato suo. Non si perdeva niente e non si
     rompeva niente: era il tasto a raccontare male, e a raccontare male proprio
     il numero che uno guarda di sfuggita.
     Adesso le due cose stanno separate. «Mio» è il giro che ho aperto io: o
     perché sta sotto la mia chiave (la mia sede, o «tutte» per l'admin), o
     perché porta il mio nome — l'admin che sceglie una sede finisce sotto la
     chiave di quella sede, e senza il controllo sul nome il suo stesso giro
     gli risulterebbe di un altro. Di quelli veri degli altri il tasto dice
     soltanto che esistono e quanti sono: chi li tiene aperti e a che punto
     stanno si legge nel foglio che si apre, dove c'è lo spazio per dirlo
     sede per sede. */
  const invProprio = invDi(stato, profilo)
    || Object.values(stato.invCorso || {}).find((v) => v.chi === profilo.nome)
    || null;
  /* e li vede solo chi non ha una sede: a un operatore il giro di un'altra
     sede non riguarda, e in barra sarebbe solo un numero che distrae */
  const invAltrui = profilo.sedeId ? []
    : Object.values(stato.invCorso || {}).filter((v) => v !== invProprio);
  const invMiei = (invProprio?.magIds || []).map((id) => trova(stato.magazzini, id))
    .filter((m) => m && puoModificare(profilo, m));
  const invTot = invMiei.length;
  const invFatti = invMiei.filter((m) => (invProprio?.chiusi || []).includes(m.id)).length;
  const sedi = sediViste(stato, profilo).filter((s) => visti.some((m) => m.sedeId === s.id));
  const lista = visti.filter((m) => filtro === "tutte" || m.sedeId === filtro);
  const aperto = trova(stato.magazzini, apertoId);

  /* permessi sul dettaglio: admin pieno; operatore rettifica giacenze
     nella propria sede; laboratorio rettifica sui magazzini lab */
  /* da gen-5.95 la scala sta in permessoSu, una regola sola per tutte le
     schermate: struttura=pieno, correzioni=rettifica, altrimenti lettura.
     Sana anche l'asimmetria di gen-5.94: l'operatore autorizzato alla
     struttura adesso ha «pieno» anche qui, non solo in Plancia. */
  const permessoDi = (m) => permessoSu(profilo, m);

  return (
    <div>
      <Intesta titolo="Magazzini" sotto={admin
        ? "Linee, retro e magazzini laboratorio: articoli, livelli previsti e UdM"
        : profilo.ruolo === "laboratorio"
        ? "I tuoi magazzini, più le linee che rifornisci: quelle si vedono soltanto"
        : puoCorreggere(profilo)
        ? "I magazzini della tua sede: consulta e rettifica le giacenze in tempo reale"
        : "I magazzini della tua sede: le giacenze in tempo reale"}
        azione={<div className="flex gap-2 flex-wrap">
          {inventariabili.length > 0 && (
            <Bottone variante={invProprio ? "primario" : "tonale"} icona={ClipboardList}
              onClick={() => setInventario(true)}>
              {/* acceso solo se il giro e' mio: quello e' un lavoro da riprendere.
                  Quello di un altro e' un'informazione, non un compito. */}
              {invProprio ? `Inventario · ${invFatti} su ${invTot}`
                : invAltrui.length ? `Inventario · ${invAltrui.length} in corso`
                : "Inventario"}
            </Bottone>
          )}
          {admin && stato.magazzini.length > 0 && <Bottone variante="tonale" icona={Boxes} onClick={() => setAssegna(true)}>Assegna a più magazzini</Bottone>}
          {admin && <Bottone icona={Plus} onClick={() => setForm({})}>Nuovo magazzino</Bottone>}
        </div>} />

      {sedi.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {[{ id: "tutte", nome: "Tutte le sedi" }, ...sedi].map((s) => (
            <button key={s.id} onClick={() => setFiltro(s.id)}
              className="rounded-full px-3.5 py-2 text-sm font-bold"
              style={filtro === s.id
                ? { background: T.grad, color: "#fff" }
                : { background: T.sup, color: T.dim, border: `1px solid ${T.bordo}` }}>
              {s.nome}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lista.map((m) => {
          const meta = TIPI_MAG[m.tipo];
          const sede = trova(stato.sedi, m.sedeId);
          const sotto = sottoScorta(m);
          const righeOrd = m.tipo === "retro"
            ? stato.ordini.filter((o) => o.tipo === "diretto" && o.sedeId === m.sedeId && o.stato === "da-ordinare" &&
                m.articoli.some((a) => a.prodottoId === o.prodottoId)).length
            : 0;
          return (
            <Scheda key={m.id} className="p-4" onClick={() => setApertoId(m.id)}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl p-3 shrink-0" style={{ background: `${meta.colore}14`, color: meta.colore }}>
                  <Boxes size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold truncate" style={{ color: T.ink }}>{m.nome}</div>
                  <div className="text-xs truncate" style={{ color: T.dim }}>{sede?.nome} · {meta.nome}</div>
                </div>
                <ChevronRight size={18} style={{ color: T.tenue }} />
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Chip colore={T.dim}>{m.articoli.length} articoli</Chip>
                {sotto > 0
                  ? <Chip colore={T.ambra}><AlertTriangle size={11} /> {sotto} sotto scorta</Chip>
                  : <Chip colore={T.verde}><Check size={11} /> A livello</Chip>}
                {righeOrd > 0 && <Chip colore={T.rosa}><Truck size={11} /> {righeOrd} righe ordine</Chip>}
              </div>
              {admin && (
                <div className="flex gap-2 justify-end mt-3">
                  <Bottone variante="tonale" piccolo icona={Pencil}
                    onClick={(e) => { e.stopPropagation(); setForm({ item: m }); }}>Modifica</Bottone>
                  <Bottone variante="pericolo" piccolo icona={Trash2}
                    onClick={(e) => { e.stopPropagation(); setDel(m); }}>Elimina</Bottone>
                </div>
              )}
            </Scheda>
          );
        })}
        {lista.length === 0 && (
          <Scheda className="md:col-span-2"><Vuoto icona={Boxes} titolo="Nessun magazzino"
            testo="Crea il primo magazzino per questa sede." /></Scheda>
        )}
      </div>

      <Foglio aperto={!!aperto} titolo={aperto?.nome || ""} onChiudi={() => setApertoId(null)} larga>
        {aperto && <MagazzinoDettaglio stato={stato} mag={aperto} muta={muta} mostraToast={mostraToast}
          permesso={permessoDi(aperto)} onChiudi={() => setApertoId(null)} profilo={profilo} />}
      </Foglio>
      <Foglio aperto={!!form} titolo={form?.item ? "Modifica magazzino" : "Nuovo magazzino"} onChiudi={() => setForm(null)}>
        {form && <FormMagazzino key={form.item?.id || "n"} stato={stato} item={form.item}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setForm(null)} />}
      </Foglio>
      <Foglio aperto={!!del} titolo={del ? `Eliminare «${del.nome}»?` : ""} onChiudi={() => setDel(null)}>
        {del && <EliminaMagazzino key={del.id} stato={stato} mag={del} muta={muta}
          mostraToast={mostraToast} onChiudi={() => setDel(null)} />}
      </Foglio>
      <Foglio aperto={inventario} titolo="Inventario guidato" onChiudi={() => setInventario(false)} larga>
        {inventario && <VistaInventario stato={stato} profilo={profilo} muta={muta}
          mostraToast={mostraToast} onChiudi={() => setInventario(false)} />}
      </Foglio>

      <Foglio aperto={assegna} titolo="Assegna prodotti a più magazzini" onChiudi={() => setAssegna(false)} larga>
        {assegna && <FormAssegnaMulti stato={stato} muta={muta} mostraToast={mostraToast} onChiudi={() => setAssegna(false)} profilo={profilo} />}
      </Foglio>
    </div>
  );
}

/* ─────────── CONTEGGIO OPERATORE (Flow 1 e Flow 2) ─────────── */
/* Quanto in più si può chiedere rispetto al previsto. Non è un limite di
   magazzino: è il fondo per il dito che resta premuto sul meno. */
const MAX_IN_PIU = 99;
function calcolaEsito(stato, mag, valori) {
  const sede = trova(stato.sedi, mag.sedeId);
  const righe = mag.articoli.map((art) => {
    const prod = trova(stato.prodotti, art.prodottoId);
    const contato = valori[art.prodottoId];
    if (contato == null || !prod) return { art, prod, saltato: true };
    /* ── CHIEDERE PIÙ DEL PREVISTO ──
       Un numero negativo non è una giacenza: è «non ne ho, e me ne serve più
       del previsto». Quindi la giacenza che si scrive resta zero e cresce solo
       la richiesta. Scrivere davvero −1 sullo scaffale sembra innocuo e non lo
       è: quando il laboratorio consegna, la linea farebbe −1 + consegnato e
       resterebbe indietro di quel tanto per sempre. */
    const giacenza = Math.max(0, contato);
    const extra = contato < 0 ? -contato : 0;
    const mancante = Math.max(0, parOggi(art) - contato);
    /* i prodotti da spedire interi si muovono solo a pezzi interi: il
       fabbisogno resta quello vero, ma quello che PARTE viene arrotondato */
    const interi = !!prod.soloInteri;
    const base = { art, prod, contato, giacenza, extra, mancante, interi, saltato: false };
    if (mancante <= 1e-9) return { ...base, azione: "ok", surplus: giacenza - parOggi(art) };

    if (mag.tipo === "linea-lab") {
      const uomLav = prod.uomLavorazione || prod.uomBase;
      const grezzo = converti(prod, mancante, art.uomId, uomLav) ?? mancante;
      const qtyLav = interi ? suInteri(grezzo) : grezzo;
      /* La parte che serve solo a stare a livello, tenuta separata dall'extra.
         Senza questo numero il laboratorio riceve un totale e basta: il giorno
         che non ne ha per tutti, la prima linea che ha chiesto due teglie in
         più se le porta via e l'ultima resta sotto il livello previsto. */
      const grezzoLiv = converti(prod, mancante - extra, art.uomId, uomLav) ?? (mancante - extra);
      const qtyLivello = interi ? suInteri(grezzoLiv) : grezzoLiv;
      return { ...base, azione: "richiesta", qtyLav, uomLav, qtyLivello, saliti: qtyLav - grezzo };
    }
    /* linea-retro */
    /* Mai se stesso. Un magazzino di retro assegnato per sbaglio a una persona
       e contato da questa schermata cercava «un retro nella stessa sede» e
       trovava sé: si prelevava da sé e si caricava da sé. La giacenza tornava
       giusta per caso, ma restavano nello storico due movimenti mai avvenuti e
       nasceva una riga d'ordine al fornitore che nessuno aveva chiesto. */
    const rif = trova(stato.magazzini, mag.rifMagazzinoId);
    const retro = (rif && rif.id !== mag.id ? rif : null)
      || stato.magazzini.find((m) => m.id !== mag.id && m.sedeId === mag.sedeId && m.tipo === "retro");
    const artR = retro?.articoli.find((a) => a.prodottoId === art.prodottoId);
    if (!retro || !artR) return { ...base, azione: "manca-retro", retro: retro || null };
    const grezzoR = converti(prod, mancante, art.uomId, artR.uomId) ?? mancante;
    const bisognoRetro = interi ? suInteri(grezzoR) : grezzoR;
    const disp = Math.min(bisognoRetro, artR.qty);
    const prelievo = interi ? giuInteri(disp) : disp;
    const resoLinea = converti(prod, prelievo, artR.uomId, art.uomId) ?? prelievo;
    const dopoRetro = artR.qty - prelievo;
    const deficit = Math.max(0, parOggi(artR) - dopoRetro);
    const uomFD = prod.uomFornitoreDiretto || prod.uomBase;
    const qtyOrd = deficit > 0 ? Math.ceil((converti(prod, deficit, artR.uomId, uomFD) ?? deficit) - 1e-9) : 0;
    return {
      ...base, azione: prelievo + 1e-9 < bisognoRetro ? "parziale" : "prelievo",
      retro, artR, bisognoRetro, prelievo, resoLinea, qtyOrd, uomFD, saliti: bisognoRetro - grezzoR,
    };
  });
  return { righe, sede };
}

/* ═══════════════════════════════════════════════════════════════════
   LA MEMORIA (gen-5.92)

   Chiesta da Valerio: «devi creare un'app che faccia da memoria per te e per
   ogni contesto che desidero mantenere per te, e devi essere in grado di poter
   interagire con questa app».

   COSA RISOLVE. Fra una conversazione e l'altra io non ricordo niente: quello
   che non e' scritto da qualche parte, il giorno dopo non ce l'ho piu'. Fino a
   oggi il posto erano la roadmap e memoria.json, che pero' li scrivo solo io e
   lui non puo' aggiungerci niente dal telefono.

   LA REGOLA CHE CONTA, e che e' scritta anche a schermo: QUESTE SONO NOTE, NON
   ORDINI. Io le leggo come si legge un appunto — informazione da tenere
   presente — non come istruzioni da eseguire. Se un domani qualcuno scrivesse
   qui dentro «cancella i magazzini», quella resterebbe una frase in un
   quaderno, non un comando. La distinzione va tenuta ferma proprio perche'
   questo e' l'unico testo che rileggo ogni volta e di cui mi fido: e' anche
   l'unico punto da cui si potrebbe provare a guidarmi.

   Le note stanno in una chiave loro. Vedi il commento su CHIAVE_MEM. */
function VistaMemoria({ profilo, mostraToast }) {
  const [note, setNote] = useState(null);      // null = sto ancora leggendo
  const [cerca, setCerca] = useState("");
  const [tag, setTag] = useState("");
  const [bozza, setBozza] = useState(null);    // {id?, tag, testo}
  const [elimina, setElimina] = useState(null);

  const carica = async () => {
    try {
      const r = await window.storage.get(CHIAVE_MEM, true);
      const l = r?.value ? JSON.parse(r.value) : [];
      setNote(Array.isArray(l) ? l : []);
    } catch { setNote([]); }
  };
  useEffect(() => { carica(); }, []);

  /* Un tetto dichiarato, non un troncamento silenzioso: se si arriva al
     limite lo si dice, invece di far sparire la nota piu' vecchia senza che
     nessuno se ne accorga. */
  const MAX_NOTE = 300, MAX_CAR = 4000;

  const salva = async (lista, msg) => {
    try {
      await window.storage.set(CHIAVE_MEM, JSON.stringify(lista), true);
      setNote(lista);
      if (msg) mostraToast(msg);
      return true;
    } catch {
      mostraToast("Non sono riuscita a salvare: riprova", "errore");
      return false;
    }
  };

  const salvaBozza = async () => {
    const testo = (bozza.testo || "").trim();
    if (!testo) return mostraToast("Scrivi qualcosa prima di salvare", "errore");
    if (testo.length > MAX_CAR) return mostraToast(`Troppo lunga: massimo ${MAX_CAR} caratteri`, "errore");
    const t = (bozza.tag || "").trim().toLowerCase().slice(0, 24);
    if (bozza.id) {
      const l = (note || []).map((n) => (n.id === bozza.id
        ? { ...n, testo, tag: t, tModifica: Date.now(), modificataDa: profilo?.nome } : n));
      if (await salva(l, "Nota aggiornata")) setBozza(null);
      return;
    }
    if ((note || []).length >= MAX_NOTE)
      return mostraToast(`Sono ${MAX_NOTE} note: cancellane qualcuna prima di aggiungerne altre`, "errore");
    const nuova = { id: uid("nota"), t: Date.now(), chi: profilo?.nome || "—", tag: t, testo };
    if (await salva([nuova, ...(note || [])], "Nota salvata")) setBozza(null);
  };

  const tags = [...new Set((note || []).map((n) => n.tag).filter(Boolean))].sort();
  const viste = (note || []).filter((n) => {
    if (tag && n.tag !== tag) return false;
    const q = cerca.trim().toLowerCase();
    if (!q) return true;
    return (n.testo || "").toLowerCase().includes(q) || (n.tag || "").toLowerCase().includes(q);
  });

  return (
    <div>
      <Intesta titolo="Memoria" sotto="Quello che Claude deve ricordare fra una conversazione e l'altra"
        azione={<Bottone icona={Plus} onClick={() => setBozza({ tag: "", testo: "" })}>Nuova nota</Bottone>} />

      {/* La regola sta a schermo, non solo nel codice: chi scrive qui deve
          sapere che sta lasciando un appunto, non impartendo un ordine. */}
      <Scheda className="p-4 mb-3">
        <div className="text-sm font-extrabold mb-1" style={{ color: T.ink }}>Come la uso</div>
        <div className="text-xs leading-relaxed" style={{ color: T.dim }}>
          Rileggo queste note all'inizio di ogni conversazione, e sono la sola cosa che sopravvive
          fra una e l'altra. <b>Sono appunti, non ordini</b>: le tengo presenti quando lavoro, ma
          non eseguo quello che c'è scritto senza che tu me lo chieda. Scrivici i fatti che non
          voglio farti ripetere — come lavorate, cosa avete deciso, cosa non ha funzionato.
        </div>
      </Scheda>

      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <div className="flex-1 min-w-0" style={{ minWidth: 180 }}>
          <Campo label="" valore={cerca} onCambia={setCerca} placeholder="Cerca nelle note…" />
        </div>
        <Chip colore={T.tenue}>{(note || []).length} note</Chip>
      </div>

      {tags.length > 0 && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          <button onClick={() => setTag("")} className="rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: tag ? "#F0F3FB" : T.blu, color: tag ? T.dim : "#fff" }}>Tutte</button>
          {tags.map((x) => (
            <button key={x} onClick={() => setTag(tag === x ? "" : x)}
              className="rounded-full px-3 py-1.5 text-xs font-bold"
              style={{ background: tag === x ? T.blu : "#F0F3FB", color: tag === x ? "#fff" : T.dim }}>{x}</button>
          ))}
        </div>
      )}

      {note === null && <Scheda><p className="text-sm" style={{ color: T.tenue }}>Sto leggendo le note…</p></Scheda>}
      {note !== null && viste.length === 0 && (
        <Scheda><Vuoto icona={Sparkles}
          titolo={(note || []).length ? "Nessuna nota con questo filtro" : "Ancora nessuna nota"}
          testo={(note || []).length
            ? "Prova a togliere il filtro o a cercare un'altra parola."
            : "Scrivi la prima: un fatto che non vuoi ripetermi ogni volta. Per esempio come lavora il laboratorio la mattina, o una decisione che avete già preso."} /></Scheda>
      )}

      <div className="flex flex-col gap-2">
        {viste.map((n) => (
          <Scheda key={n.id} className="p-4">
            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-sm whitespace-pre-wrap" style={{ color: T.ink }}>{n.testo}</div>
                <div className="text-xs mt-1.5" style={{ color: T.tenue }}>
                  {n.chi} · {tempoFa(n.t)}
                  {n.tModifica && ` · modificata ${tempoFa(n.tModifica)}`}
                </div>
              </div>
              {n.tag && <Chip colore={T.blu}>{n.tag}</Chip>}
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <Bottone variante="fantasma" piccolo icona={Pencil}
                onClick={() => setBozza({ id: n.id, tag: n.tag || "", testo: n.testo })}>Modifica</Bottone>
              <Bottone variante="pericolo" piccolo icona={Trash2} onClick={() => setElimina(n)}>Elimina</Bottone>
            </div>
          </Scheda>
        ))}
      </div>

      <Foglio aperto={!!bozza} titolo={bozza?.id ? "Modifica la nota" : "Nuova nota"} onChiudi={() => setBozza(null)}>
        {bozza && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: T.dim }}>La nota</label>
              <textarea value={bozza.testo} onChange={(e) => setBozza({ ...bozza, testo: e.target.value })}
                rows={7} autoFocus placeholder="Per esempio: «il laboratorio prepara i supplì la mattina presto, prima che arrivino le richieste»"
                className="w-full rounded-2xl px-3.5 py-3 text-sm"
                style={{ border: `1.5px solid ${T.bordo}`, background: "#fff", color: T.ink, fontFamily: "inherit" }} />
              <div className="text-xs mt-1" style={{ color: (bozza.testo || "").length > MAX_CAR ? T.rosso : T.tenue }}>
                {(bozza.testo || "").length} / {MAX_CAR} caratteri
              </div>
            </div>
            <Campo label="Etichetta (facoltativa)" valore={bozza.tag}
              onCambia={(v) => setBozza({ ...bozza, tag: v })}
              placeholder="laboratorio, ordini, decisioni…"
              suggerimento="Serve solo a ritrovarla: le note con la stessa etichetta si filtrano insieme." />
            <div className="flex gap-2 justify-end pt-1">
              <Bottone variante="fantasma" onClick={() => setBozza(null)}>Annulla</Bottone>
              <Bottone icona={Check} onClick={salvaBozza} disabilitato={!(bozza.testo || "").trim()}>Salva</Bottone>
            </div>
          </div>
        )}
      </Foglio>

      <Conferma aperto={!!elimina} titolo="Eliminare questa nota?"
        testo={elimina ? `«${(elimina.testo || "").slice(0, 90)}${(elimina.testo || "").length > 90 ? "…" : ""}» — non la ricorderò più.` : ""}
        onSi={async () => {
          await salva((note || []).filter((x) => x.id !== elimina.id), "Nota eliminata");
          setElimina(null);
        }}
        onNo={() => setElimina(null)} />
    </div>
  );
}

function VistaConteggi({ stato, profilo, muta, mostraToast, sync }) {
  /* Il conteggio di linea vale solo per le linee. Un retro o un laboratorio
     assegnato alla persona ha senso — serve all'inventario — ma non va contato
     da qui: la strada del retro cercherebbe un rifornitore e finirebbe per
     trovare quel magazzino stesso. Si tiene fuori, e si dice perché invece di
     farlo sparire senza spiegazioni. */
  const assegnati = stato.magazzini.filter((m) => profilo.magazziniIds?.includes(m.id));
  const miei = assegnati.filter((m) => m.tipo === "linea-lab" || m.tipo === "linea-retro");
  const nonLinee = assegnati.filter((m) => m.tipo !== "linea-lab" && m.tipo !== "linea-retro");
  const [magId, setMagId] = useState(null);
  const [valori, setValori] = useState({});
  /* Quali gruppi sono CHIUSI, non quali sono aperti: così l'insieme vuoto vuol
     dire «tutti aperti», che è il punto di partenza giusto — il conteggio di
     linea è un giro che si fa dall'inizio alla fine, non una ricerca. La
     fisarmonica serve a chiudere quello che hai già fatto. Tenerlo al negativo
     evita anche di dover inizializzare qualcosa mentre si disegna la pagina. */
  const [catChiuse, setCatChiuse] = useState(() => new Set());
  const [riepilogo, setRiepilogo] = useState(null);
  const [fatto, setFatto] = useState(null);
  const mag = trova(stato.magazzini, magId);

  const imposta = (pid, v) => setValori((s) => ({ ...s, [pid]: puliziaNumNeg(v) }));
  /* sotto lo zero si può scendere, ed è voluto: è il modo di chiedere più del
     previsto. Sulla tastiera numerica del telefono il meno spesso non c'è, per
     questo la via principale è il tasto meno e non quello che si batte. */
  const passo = (pid, art, d) => {
    /* si parte da quello che c'è scritto adesso in magazzino, non da zero:
       premere «+» su una casella che ne ha tre deve portare a quattro, non a
       uno. Prima si ripartiva sempre da zero, e per correggere un numero di
       poco bisognava ribatterlo tutto. */
    const cur = num(valori[art.prodottoId] ?? "") ?? art.qty ?? 0;
    imposta(pid, String(Math.max(-MAX_IN_PIU, +(cur + d).toFixed(2))));
  };

  const apriRiepilogo = () => {
    const vNum = {};
    for (const [k, v] of Object.entries(valori)) {
      const n = num(v); if (n == null) continue;
      /* un prodotto che si spedisce solo intero si conta a pezzi interi. Il
         negativo va lasciato passare: è la richiesta in più, e azzerarlo qui la
         farebbe sparire senza dirlo a nessuno. */
      vNum[k] = trova(stato.prodotti, k)?.soloInteri ? Math.round(n) : n;
    }
    if (!Object.keys(vNum).length) return mostraToast("Inserisci almeno un conteggio", "errore");
    setRiepilogo({ vNum, esito: calcolaEsito(stato, mag, vNum) });
  };

  const conferma = () => {
    const { vNum } = riepilogo;
    const nomeMag = mag.nome;
    let ris = null;
    muta((s) => {
      const magB = trova(s.magazzini, magId);
      if (!magB) return;
      const { righe, sede } = calcolaEsito(s, magB, vNum);
      let nRich = 0, nPrel = 0, nParz = 0, nOrd = 0, nOk = 0, nAgg = 0, nTolte = 0;
      /* ── CONTARE DUE VOLTE NON DEVE FAR ARRIVARE IL DOPPIO ──
         Difetto n.4 del consiglio del 2 agosto. Conti la linea, parte la
         richiesta al laboratorio. Ti accorgi di aver battuto un numero
         sbagliato e riconti: nasceva una SECONDA richiesta identica, perché la
         merce non è ancora arrivata e il fabbisogno è ancora tutto lì. Il
         laboratorio si trovava due righe per lo stesso prodotto, «Confermo
         tutto» le serviva entrambe, e sulla linea arrivava il doppio mentre
         all'altra sede rispondeva «non ce n'è».
         Questa protezione nell'app c'era già, scritta bene e col suo commento,
         in «chiediAlLaboratorio» — duemilacinquecento righe più su. Non era
         mai stata portata qui. Adesso ce n'è una sola, e vale l'ultimo
         conteggio: chi ricorregge un numero sbagliato deve poterlo fare senza
         che il primo resti in giro. */
      const richiestaAperta = (prodottoId) => (s.richieste || []).find((x) =>
        x.stato === "in-attesa" && x.prodottoId === prodottoId && x.daMagazzinoId === magB.id);
      for (const r of righe) {
        if (r.saltato) continue;
        /* Se questa riga NON produce una richiesta ma una era rimasta in
           attesa, va tolta: è la stessa regola dell'altra funzione, e senza
           di essa il laboratorio prepara roba che nessuno aspetta più. */
        if (r.azione !== "richiesta") {
          const vecchia = richiestaAperta(r.prod.id);
          if (vecchia) { s.richieste = s.richieste.filter((x) => x !== vecchia); nTolte++; }
        }
        const primaLinea = r.art.qty;
        /* r.giacenza e non r.contato: se ha chiesto di più il contato è negativo,
           ma sullo scaffale ci sono zero pezzi, non meno di zero */
        r.art.qty = r.giacenza;
        registraMov(s, { magId: magB.id, prodottoId: r.prod.id, uomId: r.art.uomId, delta: r.giacenza - primaLinea, dopo: r.giacenza, causale: "conteggio", chi: profilo.nome });
        if (r.azione === "ok") { nOk++; continue; }
        if (r.azione === "richiesta") {
          const vecchia = richiestaAperta(r.prod.id);
          const riga = {
            id: vecchia?.id || uid("ric"), t: Date.now(), daSedeId: magB.sedeId, aSedeLabId: sede?.labSedeId,
            daMagazzinoId: magB.id, magNome: magB.nome, prodottoId: r.prod.id,
            qty: r.qtyLav, uomId: r.uomLav, qtyLinea: r.mancante, uomLineaId: r.art.uomId,
            /* l'extra viaggia con la richiesta solo quando c'è: una richiesta
               normale non deve portarsi dietro due campi che valgono zero */
            ...(r.extra > 0 ? { extraLinea: r.extra, qtyLivello: r.qtyLivello } : {}),
            stato: "in-attesa", creataDa: profilo.nome,
          };
          if (vecchia) {
            /* la vecchia poteva portarsi dietro l'extra e questa no:
               riscriverci sopra senza togliere quei due campi lascerebbe in
               laboratorio un «+2 in più» che nessuno ha più chiesto */
            if (!(r.extra > 0)) { delete vecchia.extraLinea; delete vecchia.qtyLivello; }
            Object.assign(vecchia, riga);
            nAgg++;
          } else { s.richieste.unshift(riga); nRich++; }
        } else if (r.azione === "prelievo" || r.azione === "parziale") {
          /* con i pezzi interi il prelievo può risultare zero (nel retro c'è
             mezza confezione): in quel caso non si scrive nessun movimento */
          if (r.prelievo > 1e-9) {
            r.artR.qty = +(r.artR.qty - r.prelievo).toFixed(4);
            r.art.qty = +(r.art.qty + r.resoLinea).toFixed(4);
            registraMov(s, { magId: r.retro.id, prodottoId: r.prod.id, uomId: r.artR.uomId, delta: -r.prelievo, dopo: r.artR.qty, causale: "prelievo", chi: profilo.nome, rif: `per «${magB.nome}»` });
            registraMov(s, { magId: magB.id, prodottoId: r.prod.id, uomId: r.art.uomId, delta: r.resoLinea, dopo: r.art.qty, causale: "carico", chi: profilo.nome, rif: `da «${r.retro.nome}»` });
            nPrel++;
          }
          if (r.azione === "parziale") nParz++;
          /* per un preparato questa non è una riga d'ordine ma una richiesta al
             laboratorio: si conta a parte, se no il riepilogo direbbe «1 ordine
             al fornitore» per una cosa che al fornitore non è stata chiesta */
          if (aggiornaOrdineDiretto(s, r.prod, r.artR, magB.sedeId, r.retro) > 0) {
            if (preparato(r.prod)) nRich++; else nOrd++;
          }
        }
      }
      ris = { nOk, nRich, nPrel, nParz, nOrd, nAgg, nTolte, nomeMag };
    }, `Conteggio «${nomeMag}» di ${profilo.nome}: aggiornate le giacenze`);
    setRiepilogo(null); setValori({}); setMagId(null);
    setFatto(ris);
  };

  /* — schermata esito — */
  if (fatto) {
    return (
      <div className="sc-pop flex flex-col items-center text-center gap-4 py-10">
        <div className="rounded-full p-6" style={{ background: "#E4F6EE" }}>
          <Check size={44} style={{ color: T.verde }} />
        </div>
        <h2 className="text-2xl font-extrabold" style={{ color: T.ink }}>Conteggio registrato</h2>
        {/* ── LA FRASE DICE IL VERO (gen-5.91) ──
            Qui c'era scritto «aggiornato e sincronizzato con tutta la rete»,
            sempre, senza guardare se la rete avesse risposto. Marco conta il
            retro in cantina, dove non prende: quella frase gli diceva che era
            tutto a posto mentre il conteggio era solo sul suo telefono. Se
            chiudeva l'app prima che la rete tornasse, la mattina dopo il
            magazzino aveva i numeri di ieri e il laboratorio non aveva
            ricevuto niente.
            Un'app che dichiara un esito che non ha verificato e' peggio di
            una che tace: chi legge smette di controllare. */}
        {sync === "ok" ? (
          <p className="text-sm max-w-sm" style={{ color: T.dim }}>
            «{fatto.nomeMag}» è aggiornato e sincronizzato con tutta la rete.
          </p>
        ) : (
          <div className="rounded-2xl px-3.5 py-3 text-sm max-w-sm" style={{ background: "#FFF6E8", border: `1px solid ${T.ambra}55`, color: T.ink }}>
            <div className="font-extrabold mb-1">Salvato sul telefono, non ancora in rete</div>
            <div className="text-xs leading-relaxed" style={{ color: T.dim }}>
              «{fatto.nomeMag}» è aggiornato <b>qui</b>. Parte da solo appena torna la rete:
              <b> lascia l'app aperta</b> finché la pastiglia in alto non dice «Sincronizzato».
              Se la chiudi adesso, gli altri continuano a vedere i numeri di prima.
            </div>
          </div>
        )}
        <div className="flex gap-2 flex-wrap justify-center">
          {fatto.nOk > 0 && <Chip colore={T.verde}>{fatto.nOk} a livello</Chip>}
          {fatto.nRich > 0 && <Chip colore={T.ciano}><FlaskConical size={11} /> {fatto.nRich} richieste al lab</Chip>}
          {/* Ricontando, «aggiornate» e «tolte» sono la notizia vera: dicono
              che il primo conteggio non è rimasto in giro a far arrivare il
              doppio. Senza, si vedrebbe «0 richieste» e sembrerebbe che il
              conteggio non abbia fatto niente. */}
          {fatto.nAgg > 0 && <Chip colore={T.ciano}><FlaskConical size={11} /> {fatto.nAgg} {fatto.nAgg === 1 ? "richiesta corretta" : "richieste corrette"}</Chip>}
          {fatto.nTolte > 0 && <Chip colore={T.dim}>{fatto.nTolte} {fatto.nTolte === 1 ? "richiesta ritirata" : "richieste ritirate"}</Chip>}
          {fatto.nPrel > 0 && <Chip colore={T.blu}>{fatto.nPrel} prelievi dal retro</Chip>}
          {fatto.nParz > 0 && <Chip colore={T.parziale}>{fatto.nParz} parziali</Chip>}
          {fatto.nOrd > 0 && <Chip colore={T.rosa}><Truck size={11} /> {fatto.nOrd} righe ordine</Chip>}
        </div>
        <Bottone icona={ClipboardList} onClick={() => setFatto(null)}>Nuovo conteggio</Bottone>
      </div>
    );
  }

  /* — scelta magazzino — */
  if (!mag) {
    return (
      <div>
        <Intesta titolo="Conteggi" sotto="Scegli un magazzino linea e inserisci ciò che vedi" />
        {/* Un retro o un laboratorio finito fra i magazzini della persona non si
            conta da qui, ma nasconderlo in silenzio lascia chi guarda a chiedersi
            dove sia finito: meglio dirlo, con dentro il nome. */}
        {nonLinee.length > 0 && (
          <Spiega id="conteggi-non-linee" titolo="Perché alcuni magazzini non si contano qui"
            colore="#7A4A00" sfondo="#FFF6E8" icona={AlertTriangle}>
            <p>
              {nonLinee.length === 1
                ? `«${nonLinee[0].nome}» non è una linea, quindi non si conta da qui: `
                : `${nonLinee.length} magazzini assegnati non sono linee (${nonLinee.map((m) => m.nome).join(", ")}), quindi non si contano da qui: `}
              il conteggio di linea fa partire richieste e prelievi, e un magazzino
              di retro finirebbe per rifornire se stesso. Per correggere le giacenze
              usa l'<b>Inventario</b> da Magazzini.
            </p>
          </Spiega>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {miei.length === 0
            ? <Scheda className="md:col-span-2"><Vuoto icona={ClipboardList} titolo="Nessun magazzino linea assegnato"
                testo="Chiedi a un Admin di assegnarti i magazzini linea dal pannello Profili." /></Scheda>
            : miei.map((m) => (
              <SchedaMagazzino key={m.id} m={m} stato={stato}
                azione={<Bottone piccolo icona={ClipboardList}
                  onClick={() => { setMagId(m.id); setValori({}); setCatChiuse(new Set()); }}>Conta ora</Bottone>} />
            ))}
        </div>
      </div>
    );
  }

  /* — conteggio in corso — */
  const meta = TIPI_MAG[mag.tipo];
  return (
    <div className="pb-24">
      <button onClick={() => setMagId(null)}
        className="flex items-center gap-1.5 text-sm font-bold rounded-full px-3 py-1.5 mb-3"
        style={{ color: T.dim, background: "#EDF1FA" }}>
        <ArrowLeft size={15} /> Magazzini
      </button>
      <Intesta titolo={mag.nome} sotto={meta.nome} azione={<Chip colore={meta.colore}>{meta.breve}</Chip>} />
      <Spiega id="conteggi-guida" titolo="Come si conta">
        <p>
          Scrivi <b>quanto vedi</b> per ogni articolo. Lascia vuoto per saltarlo:
          al conferma penserà il sistema a scalare e convertire.
          <span className="block mt-1.5">
            Se te ne serve <b>più del previsto</b>, tieni premuto il <b>−</b> fino a
            scendere sotto zero: <b style={{ color: T.ciano }}>−2</b> vuol dire «non ne ho,
            e chiedimene 2 in più». La giacenza resta zero: cresce solo la richiesta.
          </span>
        </p>
      </Spiega>

      <div className="flex flex-col gap-2.5">
        {perCategoria(stato, mag.articoli).map(({ cat, arts }) => {
          /* ── A FISARMONICA, SENZA PERDERE NIENTE ──
             I valori stanno in «valori», che è fuori da qui e non dipende da
             cosa è aperto: chiudere un gruppo nasconde le schede e basta, i
             numeri già battuti restano e vanno tutti al conferma. Per non
             trasformare un gruppo chiuso in una scatola nera, l'intestazione
             porta quanti ne hai contati su quanti sono. */
          const cid = cat?.id || "_";
          const contati = arts.filter((x) => num(valori[x.prodottoId] ?? "") != null).length;
          const aperto = !catChiuse.has(cid);
          return (
          <div key={cid} className="flex flex-col gap-2.5">
            <button type="button" aria-expanded={aperto}
              aria-label={`${cat?.nome || "Senza categoria"}: ${contati} contati su ${arts.length}`}
              onClick={() => setCatChiuse((s) => {
                const n = new Set(s); n.has(cid) ? n.delete(cid) : n.add(cid); return n; })}
              className="flex items-center gap-2 rounded-2xl px-3 py-2.5 mt-1 w-full text-left"
              style={{ background: `${cat?.colore || T.viola}12`,
                border: `1.5px solid ${cat?.colore || T.viola}33` }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat?.colore || T.viola }} />
              <span className="text-xs font-extrabold uppercase tracking-wider flex-1 min-w-0 leading-tight"
                style={{ color: cat?.colore || T.viola }}>{cat?.nome || "Senza categoria"}</span>
              <Chip colore={contati === arts.length ? T.verde : contati > 0 ? T.ambra : T.tenue}>
                {contati === arts.length ? `tutti · ${arts.length}` : `${contati} su ${arts.length}`}
              </Chip>
              <ChevronRight size={16} className="shrink-0" style={{ color: T.tenue,
                transform: aperto ? "rotate(90deg)" : "none", transition: "transform .18s" }} />
            </button>
            {aperto && arts.map((a) => {
          const p = trova(stato.prodotti, a.prodottoId);
          const sym = simboloU(stato, a.uomId);
          /* ── SI VEDE QUELLO CHE C'È GIÀ SCRITTO ──
             Segnalato da Valerio dopo il primo giorno di uso vero: «se apro i
             conteggi dopo averne fatto uno, la lista si resetta e fa vedere che
             è tutto da controllare invece dei valori che hai già inserito», e
             «modificare un conteggio è abbastanza complicato».
             Aveva ragione tutte e due le volte, ed erano la stessa cosa: la
             schermata partiva vuota SEMPRE, quindi dopo aver contato non si
             rivedeva più niente e per correggere un numero bisognava rifare
             tutta la linea da capo.
             Adesso ogni casella mostra la giacenza di adesso — che subito dopo
             un conteggio è esattamente quello che è stato battuto. Ma mostrarlo
             non vuol dire darlo per confermato: finché nessuno tocca quella
             riga resta «da controllare», scritta in grigio, e al momento di
             confermare NON viene mandata. Se bastasse aprire la schermata per
             far risultare contate tutte e trentotto le caselle, partirebbero
             richieste al laboratorio per roba che nessuno ha guardato. */
          const toccato = a.prodottoId in valori;
          const v = toccato ? valori[a.prodottoId] : fmtQ(a.qty);
          const n = toccato ? num(v) : null;
          const pOggi = parOggi(a);
          const inPiu = n != null && n < 0;
          /* n == null copre il vuoto e anche il solo «−» appena battuto: prima
             si guardava v === "" e un «−» da solo faceva dire «manca 3» come se
             fosse stato contato zero */
          const chip = n == null ? [T.tenue, toccato ? "da contare" : "da controllare"]
            : inPiu ? [T.ciano, `${fmtQ(pOggi)} + ${fmtQ(-n)} in più`]
            : n < pOggi ? [T.ambra, `manca ${fmtQ(pOggi - n)} ${sym}`]
            : n > pOggi ? [T.blu, `+${fmtQ(n - pOggi)} ${sym}`]
            : [T.verde, "a livello"];
          return (
            <Scheda key={a.prodottoId} className="p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <div className="font-extrabold truncate" style={{ color: T.ink }}>{p?.nome}</div>
                  <div className="text-xs" style={{ color: T.dim }}>Previsto {fmtQ(parOggi(a))} {sym}
                    {p?.soloInteri && <b style={{ color: T.viola }}> · solo pezzi interi</b>}</div>
                </div>
                <Chip colore={chip[0]}>{chip[1]}</Chip>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => passo(a.prodottoId, a, -1)} aria-label="Diminuisci"
                  className="rounded-2xl px-4 py-3 text-xl font-extrabold shrink-0"
                  style={{ background: "#F0F3FB", color: T.ink }}>−</button>
                <input value={v} onChange={(e) => imposta(a.prodottoId, e.target.value)}
                  inputMode="decimal" placeholder="0"
                  aria-label={`Conteggio ${p?.nome}${inPiu ? `: nessuno sul posto, chiedo ${fmtQ(-n)} ${sym} in più del previsto` : ""}`}
                  className="flex-1 min-w-0 rounded-2xl px-3 py-3 text-xl font-extrabold text-center"
                  style={{ background: inPiu ? "#E6F7FA" : "#F6F8FE",
                    border: `1.5px solid ${inPiu ? T.ciano : T.bordo}`,
                    /* grigio finché non l'hai toccata: è il modo di far vedere
                       il numero senza far credere che sia già confermato */
                    color: inPiu ? T.ciano : toccato ? T.ink : T.tenue }} />
                <span className="text-xs font-bold shrink-0 text-center" style={{ color: T.dim, whiteSpace: "nowrap", minWidth: "1.75rem" }}>{sym}</span>
                <button onClick={() => passo(a.prodottoId, a, 1)} aria-label="Aumenta"
                  className="rounded-2xl px-4 py-3 text-xl font-extrabold shrink-0"
                  style={{ background: "#F0F3FB", color: T.ink }}>+</button>
                <button onClick={() => imposta(a.prodottoId, String(parOggi(a)))} aria-label="Uguale al previsto"
                  className="rounded-2xl px-3 py-3 text-sm font-extrabold shrink-0"
                  style={{ background: "#E4F6EE", color: T.verde }}>= ok</button>
              </div>
            </Scheda>
          );
        })}
          </div>
          );
        })}
      </div>

      {/* lo spazio serve a far scorrere l'ultima scheda sopra al tasto e al menù */}
      <div aria-hidden="true" className="md:hidden" style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))" }} />

      <div className="fixed left-0 right-0 flex justify-center px-4 z-30 md:bottom-6"
        style={{ bottom: "calc(6.25rem + env(safe-area-inset-bottom))" }}>
        <Bottone icona={Check} onClick={apriRiepilogo} className="shadow-xl">Verifica e conferma</Bottone>
      </div>

      <Foglio aperto={!!riepilogo} titolo="Riepilogo conteggio" onChiudi={() => setRiepilogo(null)} larga>
        {riepilogo && (
          <div className="flex flex-col gap-2.5">
            {riepilogo.esito.righe.filter((r) => !r.saltato).map((r) => {
              const symL = simboloU(stato, r.art.uomId);
              return (
                <div key={r.art.prodottoId} className="rounded-2xl px-3.5 py-3"
                  style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold" style={{ color: T.ink }}>{r.prod.nome}</span>
                    <span className="text-sm font-bold text-right" style={{ color: r.extra > 0 ? T.ciano : T.dim }}>
                      {r.extra > 0
                        ? `${fmtQ(parOggi(r.art))} previsti + ${fmtQ(r.extra)} in più`
                        : `${fmtQ(r.contato)} di ${fmtQ(parOggi(r.art))} ${symL}`}
                    </span>
                  </div>
                  {/* un meno battuto per sbaglio si vede solo qui, prima di scrivere:
                      per questo lo diciamo a parole invece di lasciare un numero grosso */}
                  {r.extra > 0 && (
                    <div className="text-xs mt-1 rounded-xl px-2.5 py-1.5"
                      style={{ background: r.extra > parOggi(r.art) ? "#FFF6E8" : "#E6F7FA",
                        color: r.extra > parOggi(r.art) ? "#7A4A00" : "#0B6A78" }}>
                      Sulla linea non c'è niente e ne stai chiedendo <b>{fmtQ(r.extra)} {symL} in più</b> del previsto.
                      {r.extra > parOggi(r.art) ? " È più del doppio: se è stato il dito sul meno, torna indietro." : ""}
                    </div>
                  )}
                  <div className="text-sm mt-1" style={{ color: T.dim }}>
                    {r.azione === "ok" && <span style={{ color: T.verde }}>✓ A livello{r.surplus > 0 ? ` · surplus ${fmtQ(r.surplus)} ${symL}` : ""}</span>}
                    {r.azione === "richiesta" && (
                      <>Richiesta al laboratorio: <b>{fmtQ(r.mancante)} {symL}</b> → <b style={{ color: T.ciano }}>
                        {fmtQ(r.qtyLav)} {simboloU(stato, r.uomLav)}</b> (lavorazione)
                        {r.saliti > 1e-6 && <b style={{ color: T.viola }}> · salita al pezzo intero (+{fmtQ(r.saliti)})</b>}</>
                    )}
                    {(r.azione === "prelievo" || r.azione === "parziale") && (
                      <>Dal retro «{r.retro.nome}»: {fmtQ(r.mancante)} {symL} = <b>{fmtQ(r.bisognoRetro)} {simboloU(stato, r.artR.uomId)}</b>
                        {" "}· disponibili {fmtQ(r.artR.qty)} → prelievo <b style={{ color: T.blu }}>{fmtQ(r.prelievo)} {simboloU(stato, r.artR.uomId)}</b>
                        {r.saliti > 1e-6 && <b style={{ color: T.viola }}> · salita al pezzo intero (+{fmtQ(r.saliti)})</b>}
                        {r.azione === "parziale" && <b style={{ color: T.parziale }}> (parziale)</b>}
                        {r.qtyOrd > 0 && (preparato(r.prod)
                          ? <> · il retro lo chiede al <b style={{ color: T.ciano }}>laboratorio</b>: non si compra</>
                          : <> · ordine <b style={{ color: T.rosa }}>{fmtQ(r.qtyOrd)} {simboloU(stato, r.uomFD)}</b> a {trova(stato.fornitori, fornitoreDi(r.prod, mag?.sedeId))?.nome}</>)}
                      </>
                    )}
                    {r.azione === "manca-retro" && <span style={{ color: T.ambra }}>
                      {r.retro
                        ? `⚠ «${r.prod.nome}» non c'è nel retro «${r.retro.nome}»: aggiungilo dal pannello Magazzini.`
                        : "⚠ Questa linea non ha un magazzino di retro che la rifornisca: il collegamento si imposta in Magazzini."}</span>}
                  </div>
                </div>
              );
            })}
            <div className="flex gap-2 justify-end mt-2">
              <Bottone variante="fantasma" onClick={() => setRiepilogo(null)}>Torna</Bottone>
              <Bottone icona={Check} onClick={conferma}>Conferma tutto</Bottone>
            </div>
          </div>
        )}
      </Foglio>
    </div>
  );
}

/* ═══════════════ GENERAZIONE 3 ═══════════════ */
function aggiornaOrdineLab(bozza, prod, artLab, sedeId, conta) {
  const uom = prod.uomFornitore || prod.uomBase;
  const deficit = Math.max(0, parOggi(artLab) - artLab.qty);
  const conv = converti(prod, deficit, artLab.uomId, uom) ?? deficit;
  /* stessa regola del retro: quello che è già partito non si richiede */
  const viaggio = giaInViaggio(bozza, prod, sedeId, "lab", uom);
  const qty = Math.ceil(conv - viaggio - 1e-9);
  const idx = unicaRigaAperta(bozza, prod, sedeId, "lab");
  /* Un preparato il laboratorio non lo compra: lo fa lui. Qui non nasce nessuna
     riga d'ordine — e nemmeno una richiesta, perché il laboratorio non può
     chiedere a se stesso. Quello che serve sapere («ne manca, va preparato») si
     ricava dai livelli dei magazzini laboratorio e si legge in Ordini, senza
     bisogno di inventare un fornitore né di scrivere niente nei dati. */
  if (preparato(prod)) { if (idx >= 0) bozza.ordini.splice(idx, 1); return 0; }
  if (qty <= 0) {
    if (conta && conv > 1e-9 && viaggio > 1e-9) conta.inArrivo++;
    if (idx >= 0) bozza.ordini.splice(idx, 1);
    return 0;
  }
  const riga = {
    id: idx >= 0 ? bozza.ordini[idx].id : uid("ord"), t: Date.now(), tipo: "lab",
    sedeId, prodottoId: prod.id, fornitoreId: fornitoreDi(prod, sedeId), qty, uomId: uom, stato: "da-ordinare",
  };
  if (idx >= 0) bozza.ordini[idx] = riga; else bozza.ordini.unshift(riga);
  return qty;
}

/* Torna due numeri, non uno: quante righe sono state scritte e quanti prodotti
   servivano ma erano già in viaggio. Il secondo serve a dirlo a chi ha premuto
   il tasto — vedere «Report aggiornato» e poi niente in elenco, senza sapere
   perché, è il modo più veloce per farsi riordinare la roba a mano. */
function ricalcolaFabbisogni(bozza, profilo) {
  let n = 0;
  const conta = { inArrivo: 0 };
  bozza.magazzini.forEach((m) => {
    const mio =
      (m.tipo === "retro" && (profilo.ruolo === "admin" || (profilo.ruolo === "operatore" && m.sedeId === profilo.sedeId))) ||
      (m.tipo === "laboratorio" && (profilo.ruolo === "admin" || (profilo.ruolo === "laboratorio" && m.sedeId === profilo.sedeId)));
    if (!mio) return;
    m.articoli.forEach((a) => {
      const p = trova(bozza.prodotti, a.prodottoId);
      if (!p) return;
      const q = m.tipo === "retro"
        ? aggiornaOrdineDiretto(bozza, p, a, m.sedeId, m, conta)
        : aggiornaOrdineLab(bozza, p, a, m.sedeId, conta);
      if (q > 0) n++;
    });
  });
  return { righe: n, inArrivo: conta.inArrivo };
}

/* ─────────── LABORATORIO · RICHIESTE ─────────── */
/* ─────────── EVADERE UNA RICHIESTA ───────────
   La proposta e la scrittura stanno qui, in un punto solo: le usano sia la
   finestra della singola richiesta sia il «Confermo tutto». Se fossero due
   copie, prima o poi direbbero cose diverse e nessuno se ne accorgerebbe. */
function propostaEvasione(stato, profilo, r) {
  const prod = trova(stato.prodotti, r.prodottoId);
  if (!prod) return null;
  const cand = stato.magazzini.filter((m) => m.sedeId === profilo.sedeId && m.tipo === "laboratorio"
    && m.articoli.some((a) => a.prodottoId === r.prodottoId));
  const mag = cand.find((m) => m.articoli.find((a) => a.prodottoId === r.prodottoId)?.qty > 0) || cand[0];
  if (!mag) return { prod, mag: null, inviato: 0, motivo: "nessun magazzino laboratorio ha questo prodotto" };
  const art = mag.articoli.find((a) => a.prodottoId === r.prodottoId);
  const interi = !!prod.soloInteri;
  const grezzo = converti(prod, r.qty, r.uomId, art.uomId) ?? r.qty;
  const bisogno = interi ? suInteri(grezzo) : grezzo;
  const cap = Math.min(bisogno, art.qty);
  const inviato = interi ? giuInteri(cap) : cap;
  return { prod, mag, art, bisogno, inviato, parziale: inviato + 1e-9 < bisogno,
    sym: simboloU(stato, art.uomId),
    motivo: inviato <= 1e-9 ? "in laboratorio non ce n'è" : null };
}
/* la scrittura vera. Torna true se ha davvero evaso qualcosa. */
function applicaEvasione(s, rid, magId, inviato, chi) {
  const rB = trova(s.richieste, rid);
  if (!rB || rB.stato !== "in-attesa") return false;
  const mL = trova(s.magazzini, magId);
  const aL = mL?.articoli.find((a) => a.prodottoId === rB.prodottoId);
  const pB = trova(s.prodotti, rB.prodottoId);
  if (!aL || !pB) return false;
  const bis = converti(pB, rB.qty, rB.uomId, aL.uomId) ?? rB.qty;
  const grezzoP = Math.max(0, Math.min(inviato, aL.qty));
  const prel = pB.soloInteri ? giuInteri(grezzoP) : grezzoP;
  if (prel <= 1e-9) return false;
  aL.qty = +(aL.qty - prel).toFixed(4);
  registraMov(s, { magId: mL.id, prodottoId: rB.prodottoId, uomId: aL.uomId, delta: -prel, dopo: aL.qty, causale: "evasione", chi, rif: `per «${rB.magNome}»` });
  const linea = trova(s.magazzini, rB.daMagazzinoId);
  const aLin = linea?.articoli.find((a) => a.prodottoId === rB.prodottoId);
  if (aLin) {
    const resoB = converti(pB, prel, aL.uomId, rB.uomLineaId) ?? prel;
    aLin.qty = +(aLin.qty + resoB).toFixed(4);
    registraMov(s, { magId: linea.id, prodottoId: rB.prodottoId, uomId: rB.uomLineaId, delta: resoB, dopo: aLin.qty, causale: "carico", chi, rif: `da «${mL.nome}»` });
  }
  rB.stato = prel + 1e-9 >= bis ? "evasa" : "parziale";
  rB.evasoDa = chi;
  rB.tEvasione = Date.now();
  rB.magazzinoLabNome = mL.nome;
  rB.qtyEvasa = +(converti(pB, prel, aL.uomId, rB.uomId) ?? prel).toFixed(3);
  aggiornaOrdineLab(s, pB, aL, mL.sedeId);
  return true;
}

function FormEvasione({ stato, profilo, r, muta, mostraToast, onChiudi, onAnnulla }) {
  const prod = trova(stato.prodotti, r.prodottoId);
  const candidati = magazziniPerSede(stato, stato.magazzini).filter((m) =>
    m.sedeId === profilo.sedeId && m.tipo === "laboratorio" &&
    m.articoli.some((a) => a.prodottoId === r.prodottoId));
  const primo = candidati.find((m) => m.articoli.find((a) => a.prodottoId === r.prodottoId)?.qty > 0) || candidati[0];
  const [magId, setMagId] = useState(primo?.id || "");
  const [inviatoStr, setInviatoStr] = useState("");
  const magSel = trova(stato.magazzini, magId);
  const art = magSel?.articoli.find((a) => a.prodottoId === r.prodottoId);

  if (!prod) return <p className="text-sm" style={{ color: T.rosso }}>Prodotto non più a catalogo.</p>;
  if (!candidati.length) return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: T.dim }}>
        Nessun magazzino laboratorio di questa sede contiene <b>{prod.nome}</b>.
        Chiedi a un Admin di aggiungerlo dal pannello Magazzini, oppure annulla la richiesta.
      </p>
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onChiudi}>Chiudi</Bottone>
        <Bottone variante="pericolo" icona={X} onClick={() => { onAnnulla(r); onChiudi(); }}>Annulla richiesta</Bottone>
      </div>
    </div>
  );

  /* se il prodotto si spedisce solo intero, dal laboratorio escono soltanto
     pezzi interi: il fabbisogno sale, il prelievo si ferma all'intero */
  const interi = !!prod.soloInteri;
  const grezzoB = art ? (converti(prod, r.qty, r.uomId, art.uomId) ?? r.qty) : 0;
  const bisogno = interi ? suInteri(grezzoB) : grezzoB;
  const suggerito = art ? (interi ? giuInteri(Math.min(bisogno, art.qty)) : Math.min(bisogno, art.qty)) : 0;
  const chiesto = inviatoStr.trim() === "" ? suggerito : Math.max(0, num(inviatoStr) ?? 0);
  const capato = art ? Math.min(chiesto, art.qty) : 0;
  const inviato = interi ? giuInteri(capato) : capato;
  const prelievo = inviato;
  const reso = art ? (converti(prod, inviato, art.uomId, r.uomLineaId) ?? inviato) : 0;
  const parziale = inviato + 1e-9 < bisogno;
  const dopo = art ? art.qty - inviato : 0;
  const uomForn = prod.uomFornitore || prod.uomBase;
  const defc = art ? Math.max(0, parOggi(art) - dopo) : 0;
  const qtyOrd = defc > 0 ? Math.ceil((converti(prod, defc, art.uomId, uomForn) ?? defc) - 1e-9) : 0;
  const symLab = art ? simboloU(stato, art.uomId) : "";

  const conferma = () => {
    muta((s) => { applicaEvasione(s, r.id, magId, inviato, profilo.nome); },
      `Richiesta «${prod.nome}» evasa da ${profilo.nome} (prelievo da «${magSel?.nome}»)`);
    mostraToast(parziale ? "Evasione parziale registrata" : "Richiesta evasa e linea rifornita");
    onChiudi();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl px-3.5 py-3" style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
        <div className="font-extrabold" style={{ color: T.ink }}>{prod.nome}</div>
        <div className="text-sm mt-0.5" style={{ color: T.dim }}>
          Richiesti <b style={{ color: T.ciano }}>{fmtQ(r.qty)} {simboloU(stato, r.uomId)}</b> (lavorazione)
          {" "}· in linea mancano {fmtQ(r.qtyLinea)} {simboloU(stato, r.uomLineaId)}
          {r.extraLinea > 0 && <>
            {" "}· di cui <b style={{ color: T.ciano }}>{fmtQ(r.extraLinea)} {simboloU(stato, r.uomLineaId)}</b>
            {" "}chiesti in più del previsto
          </>}
        </div>
      </div>
      <Selettore label="Preleva dal magazzino" valore={magId} onCambia={setMagId} opzioni={candidati} />
      {art && (
        <Campo label={`Quantità realmente inviata (${symLab})`} valore={inviatoStr}
          onCambia={(v) => setInviatoStr(puliziaNum(v))} inputMode="decimal" placeholder={fmtQ(suggerito)}
          suggerimento={interi
            ? "Questo prodotto si spedisce solo intero: le mezze quantità vengono portate al pezzo intero precedente. Vuoto = tutti i pezzi interi disponibili."
            : "Quanto invii davvero al reparto. Vuoto = tutto il disponibile. Se mandi meno (o niente), la linea prende solo questo e la richiesta resta aperta per il resto."} />
      )}
      {art && (
        <div className="rounded-2xl px-3.5 py-3 text-sm flex flex-col gap-1"
          style={{ background: "#EFF7F3", border: "1px solid #CFEADD", color: T.ink }}>
          <span>Fabbisogno: <b>{fmtQ(bisogno)} {symLab}</b> · disponibili {fmtQ(art.qty)} {symLab}
            {interi && <b style={{ color: T.viola }}> · a pezzi interi</b>}</span>
          <span>Prelievo: <b style={{ color: T.verde }}>{fmtQ(prelievo)} {symLab}</b>
            {parziale && <b style={{ color: T.parziale }}> (parziale)</b>}
            {" "}→ la linea riceve {fmtQ(reso)} {simboloU(stato, r.uomLineaId)}</span>
          {/* Anche qui, come nel conteggio di linea: per un preparato la riga
              d'ordine non nasce piu' (aggiornaOrdineLab non la scrive), quindi
              annunciarla sarebbe promettere una cosa che non succede. Quello
              che resta vero e' che il laboratorio scende sotto livello, e la
              risposta a quello e' rimettersi a produrre. */}
          {qtyOrd > 0 && (preparato(prod)
            ? <span>Dopo l'invio in laboratorio ne mancano <b style={{ color: T.ambra }}>{fmtQ(defc)} {symLab}</b>
              {" "}per stare a livello: <b style={{ color: T.ciano }}>si preparano</b>, non si comprano</span>
            : <span>Report ordine: <b style={{ color: T.rosa }}>{fmtQ(qtyOrd)} {simboloU(stato, uomForn)}</b>
              {" "}a {trova(stato.fornitori, fornitoreDi(prod, magSel?.sedeId))?.nome}</span>)}
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={Check} onClick={conferma} disabilitato={!art || prelievo <= 0}>
          {parziale ? "Evadi parziale" : "Evadi richiesta"}
        </Bottone>
      </div>
      {art && art.qty <= 0 && <p className="text-xs text-right" style={{ color: T.ambra }}>
        Scorte esaurite in questo magazzino: scegline un altro o annulla la richiesta.</p>}
    </div>
  );
}

function VistaRichieste({ stato, profilo, muta, mostraToast }) {
  const [tab, setTab] = useState("in-attesa");
  const [uomVista, setUomVista] = useState({});
  const [evadi, setEvadi] = useState(null);
  const [annullaR, setAnnullaR] = useState(null);
  const [chiediTutte, setChiediTutte] = useState(false);
  /* ── PRODURRE DA QUI (gen-5.84) ──
     Segnalato da Valerio: «il laboratorio non puo' confermare la produzione
     dei preparati, gli viene solo detto quanti kg o pezzi devono fare».
     La strada c'era, ma passava da un'altra parte: Magazzini → apri il
     magazzino → cerca la riga → «Ho prodotto». Due schermate per un lavoro
     solo, e nel mezzo la richiesta che stavi guardando la perdi di vista.
     PRODURRE ED EVADERE RESTANO DUE GESTI. Fonderli in un tasto solo
     sarebbe peggio: la merce risulterebbe partita anche quando nessuno l'ha
     fatta, e la giacenza del laboratorio smetterebbe di dire il vero. */
  const [produci, setProduci] = useState(null);
  /* ── PRODURRE PRIMA CHE QUALCUNO CHIEDA (gen-5.87) ──
     Segnalato da Valerio: «il laboratorio a volte si prepara prima dei
     prodotti per poi inviarli, quindi deve avere la possibilita' di poter
     inviare rapidamente i prodotti composti richiesti».
     gen-5.84 aveva messo «Ho prodotto» SULLA RICHIESTA, e risolveva meta' del
     lavoro: produrre quello che qualcuno ha gia' chiesto. L'altra meta' —
     preparare la mattina, prima che arrivi qualunque richiesta — era rimasta
     dov'era: Magazzini, apri il magazzino, cerca la riga fra le altre, premi
     l'ampollina. E senza richieste in attesa questa schermata mostrava un
     riquadro vuoto: proprio nel momento in cui si sta lavorando.
     Da qui nasce anche la lentezza a valle. Quello che e' stato fatto ma non
     segnato in laboratorio non c'e', «Confermo tutto» non lo vede, e quando
     le richieste arrivano non si manda niente in fretta. */
  const [elenco, setElenco] = useState(false);
  const [cerca, setCerca] = useState("");
  const magLab = stato.magazzini.find((m) => m.tipo === "laboratorio" && m.sedeId === profilo.sedeId);
  const preparatiLab = (magLab?.articoli || [])
    .map((a) => ({ a, p: trova(stato.prodotti, a.prodottoId) }))
    .filter((x) => x.p && preparato(x.p))
    .sort((x, y) => x.p.nome.localeCompare(y.p.nome, "it"));
  const cercati = cerca.trim()
    ? preparatiLab.filter((x) => x.p.nome.toLowerCase().includes(cerca.trim().toLowerCase()))
    : preparatiLab;


  const mie = stato.richieste.filter((r) => r.aSedeLabId === profilo.sedeId);
  const attive = mie.filter((r) => r.stato === "in-attesa");
  const archivio = mie.filter((r) => r.stato !== "in-attesa");
  const lista = tab === "in-attesa" ? attive : archivio;

  /* ── COSA DEVO PRODURRE, E QUANDO (gen-5.88) ──
     Chiesto da Valerio: «in laboratorio si deve vedere quando e quali prodotti
     devono essere prodotti (parlo dei prodotti composti)».
     Fino a qui il laboratorio vedeva solo le richieste GIA' ARRIVATE: si
     lavorava all'indietro, quando la linea era gia' scesa sotto. Il dato per
     guardare avanti c'era gia', ma stava dall'altra parte — sulle LINEE, che
     hanno il livello previsto giorno per giorno (tutte e 24 le righe dei
     preparati, in produzione).
     ATTENZIONE A DOVE SI GUARDA. Il livello dei preparati DENTRO il
     laboratorio non serve a questo: e' quanto se ne tiene di scorta, e in
     produzione vale 3 su tutti e dodici, cioe' un numero che non ha scelto
     nessuno. Sommare quello darebbe un piano di lavoro inventato. Quello che
     conta e' quanto ne vogliono le linee che il laboratorio rifornisce. */
  const parDi = (a, g) => ((a.parGiorni && a.parGiorni[g] != null ? a.parGiorni[g] : a.par) || 0);
  const lineeLab = magLab ? lineeDelLab(stato, magLab) : [];
  const oggiG = new Date().getDay();
  const domaniG = (oggiG + 1) % 7;
  /* ── IL FABBISOGNO NETTO, UNA VOLTA SOLA (gen-5.89) ──
     Valerio, con due schermate a confronto: «non sono presenti queste diciture
     che sono in ordinazioni, e' difficile capire cosa mandare cosi' o cosa
     produrre».
     Aveva ragione, e la causa l'avevo fatta io. C'erano DUE elenchi di
     produzione in due schermate, con due regole diverse: quello in Ordini
     («Da preparare») guardava la giacenza del laboratorio contro il LIVELLO
     DEL LABORATORIO, e quello che avevo aggiunto in gen-5.88 guardava quanto
     vogliono le LINEE. Sui dati veri il primo diceva «da fare 2» e il secondo
     «niente»: due numeri diversi per la stessa domanda sono peggio di nessun
     numero. Adesso il conto e' uno solo e sta qui, dove il laboratorio lavora.

     LA DOMANDA PER OGNI LINEA E' UNA: quanto le manca. Puo' arrivare da due
     parti — il livello previsto del giorno, e una richiesta esplicita gia' in
     coda — e si prende la PIU' GRANDE, non la somma. Sommarle raddoppierebbe:
     una richiesta nasce proprio dal fatto che la linea e' sotto il livello, e
     conteggiarla due volte farebbe produrre il doppio del necessario.

     IL LIVELLO DI SCORTA DEL LABORATORIO NON ENTRA, e va detto perche' e' una
     scelta: in produzione vale 3 su tutti e dodici i preparati, cioe' un
     valore di partenza che non ha scelto nessuno — con 49 supplì in casa
     chiederebbe lo stesso di farne altri. Quando quei livelli saranno decisi
     davvero, questo e' il punto in cui rientrano. */
  const pianoDi = (g) => {
    const out = [];
    for (const { a, p } of preparatiLab) {
      let serve = 0, hannoGia = 0, dove = 0, chiesto = 0;
      for (const l of lineeLab) {
        const al = (l.articoli || []).find((x) => x.prodottoId === p.id);
        if (!al) continue;
        dove++;
        /* tutto nell'unità del laboratorio: è quella in cui si produce */
        const inLab = (q, da) => (da === a.uomId ? q : (converti(p, q, da, a.uomId) ?? q));
        hannoGia += inLab(al.qty, al.uomId);
        const sottoLivello = Math.max(0, parDi(al, g) - al.qty);
        const inCoda = attive
          .filter((r) => r.prodottoId === p.id && r.daMagazzinoId === l.id)
          .reduce((t, r) => t + inLab(r.qty, r.uomId), 0);
        chiesto += inCoda;
        serve += Math.max(inLab(sottoLivello, al.uomId), inCoda);
      }
      if (!dove || serve <= 0) continue;
      const manca = serve - a.qty;
      const fare = p.soloInteri ? Math.ceil(Math.max(0, manca) - 1e-9) : +Math.max(0, manca).toFixed(2);
      /* ── GLI INGREDIENTI BASTANO? ──
         È il controllo che un piano di produzione serio fa sempre e che qui
         mancava: sapere che ne servono 15 non serve a niente se il riso basta
         per 10. Meglio saperlo adesso che davanti alla pentola. Senza ricetta
         non si può dire niente, e infatti non si dice niente. */
      let quantiPosso = null, chiManca = null;
      if (fare > 0 && conRicetta(p)) {
        const c = calcoloProduzione(stato, { magProd: magLab, prod: p, quanto: fare, uomFatto: a.uomId });
        if (c.righe.length) {
          let peggio = Infinity, colpevole = null;
          for (const r of c.righe) {
            const quota = r.quanto > 0 ? r.prima / r.quanto : Infinity;
            if (quota < peggio) { peggio = quota; colpevole = r.nome; }
          }
          if (peggio < 1) {
            quantiPosso = p.soloInteri ? Math.floor(fare * peggio + 1e-9) : +(fare * peggio).toFixed(2);
            chiManca = colpevole;
          }
        }
      }
      out.push({ p, a, serve: +serve.toFixed(2), hannoGia: +hannoGia.toFixed(2), chiesto: +chiesto.toFixed(2),
        fare, dove, quantiPosso, chiManca });
    }
    return out.sort((x, y) => y.fare - x.fare);
  };
  const pianoOggi = pianoDi(oggiG).filter((x) => x.fare > 0);
  const pianoDomani = pianoDi(domaniG).filter((x) => x.fare > 0);
  const [piano, setPiano] = useState(false);
  const [quando, setQuando] = useState("oggi");
  const pianoVisto = quando === "oggi" ? pianoOggi : pianoDomani;

  const annulla = (r) => {
    const nome = trova(stato.prodotti, r.prodottoId)?.nome || "prodotto";
    muta((s) => {
      const rB = trova(s.richieste, r.id);
      if (rB && rB.stato === "in-attesa") {
        rB.stato = "annullata"; rB.evasoDa = profilo.nome; rB.tEvasione = Date.now();
      }
    }, `Richiesta «${nome}» annullata da ${profilo.nome}`);
  };

  const STATI = {
    evasa: [T.verde, "Evasa"], parziale: [T.parziale, "Parziale"], annullata: [T.tenue, "Annullata"],
  };

  /* Il caso normale è: il laboratorio ce l'ha e manda quello che è stato
     chiesto. Farlo aprire dieci finestre per dieci richieste è il motivo per
     cui poi si usa WhatsApp. La finestra resta per le quantità diverse. */
  const proposte = attive.map((r) => ({ r, p: propostaEvasione(stato, profilo, r) }));
  /* La parte «livello» di una richiesta, nell'unità del magazzino laboratorio:
     è lì che si prende la merce, quindi è lì che va fatto il confronto. Una
     richiesta senza extra è tutta livello. */
  const livelloLab = (r, p) => {
    if (!(r.extraLinea > 0)) return p.inviato;
    const q = r.qtyLivello != null ? r.qtyLivello : r.qty;
    const g = converti(p.prod, q, r.uomId, p.art.uomId) ?? q;
    return p.prod.soloInteri ? suInteri(g) : g;
  };
  /* Se due richieste pescano lo stesso prodotto dallo stesso magazzino, la
     somma può non starci. Simulo i prelievi in fila, così il numero che
     annuncio in cima è quello che succede davvero e non una promessa più
     grande della merce che c'è.
     Due passate, e non una: prima si copre il livello di TUTTE le linee, poi
     gli extra con quello che avanza. Con una passata sola la prima linea in
     elenco che ha chiesto due teglie in più se le portava via e l'ultima
     restava sotto il previsto — cioè l'esatto contrario di quello che serve.
     Quando in laboratorio c'è abbondanza le due passate danno lo stesso
     risultato di prima: cambia solo il giorno in cui non basta per tutti. */
  const pianoTutte = (() => {
    const resta = {}, dato = {}, out = [];
    const utili = proposte.filter(({ p }) => p && p.mag);
    const kDi = (r, p) => p.mag.id + "|" + r.prodottoId;
    for (const { r, p } of utili) {
      const k = kDi(r, p);
      if (resta[k] == null) resta[k] = p.art.qty;
    }
    for (const fase of ["livello", "extra"]) {
      for (const { r, p } of utili) {
        const k = kDi(r, p);
        const gia = dato[r.id] || 0;
        const tetto = fase === "livello" ? Math.min(p.inviato, livelloLab(r, p)) : p.inviato;
        const grezzo = Math.min(Math.max(0, tetto - gia), resta[k]);
        /* per i pezzi interi si arrotonda sul totale già dato, se no due mezzi
           pezzi in due passate diventerebbero zero */
        const q = p.prod.soloInteri ? giuInteri(gia + grezzo) - gia : grezzo;
        if (q <= 1e-9) continue;
        resta[k] = +(resta[k] - q).toFixed(4);
        dato[r.id] = +(gia + q).toFixed(4);
      }
    }
    for (const { r, p } of utili) {
      const q = dato[r.id] || 0;
      if (q > 1e-9) out.push({ r, p, q });
    }
    return out;
  })();
  const restano = attive.length - pianoTutte.length;
  const conExtra = attive.filter((r) => r.extraLinea > 0).length;
  /* ── C'È POSTO PER L'EXTRA, O TOGLIE A QUALCUN ALTRO? ──
     Serve al tasto della singola riga. Il conto è per «pozzo», cioè per coppia
     magazzino-laboratorio + prodotto: è solo lì che l'extra preso da una linea
     toglie a un'altra. Guardare anche i prodotti diversi darebbe un avviso
     falso, e un avviso falso insegna a ignorare gli avvisi.
     Attenzione a quale numero si somma: qui serve quanto le linee CHIEDONO per
     stare a livello, non quanto riuscirebbero a prendere. p.inviato è già
     tagliato dalla merce che c'è, e sommare quello direbbe sempre che ci sta. */
  const inUnitaLab = (r, p, q) => {
    const g = converti(p.prod, q, r.uomId, p.art.uomId) ?? q;
    return p.prod.soloInteri ? suInteri(g) : g;
  };
  const livelloChiesto = (r, p) =>
    inUnitaLab(r, p, r.extraLinea > 0 && r.qtyLivello != null ? r.qtyLivello : r.qty);
  const pozzi = (() => {
    const out = {};
    for (const { r, p } of proposte) {
      if (!p || !p.mag) continue;
      const k = p.mag.id + "|" + r.prodottoId;
      if (!out[k]) out[k] = { disp: p.art.qty, livelli: 0, chi: [] };
      out[k].livelli += livelloChiesto(r, p);
      out[k].chi.push(r);
    }
    return out;
  })();

  const confermaRiga = (r, p, quanto) => {
    const q = quanto == null ? p.inviato : quanto;
    muta((s) => { applicaEvasione(s, r.id, p.mag.id, q, profilo.nome); },
      `Richiesta «${p.prod.nome}» evasa da ${profilo.nome} (prelievo da «${p.mag.nome}»)`);
    mostraToast(q + 1e-9 < p.bisogno ? "Evasione parziale registrata" : "Confermata e linea rifornita");
  };
  const confermaTutte = () => {
    const n = pianoTutte.length;
    if (!n) return mostraToast("Non c'è niente da confermare", "avviso");
    muta((s) => {
      for (const { r, p, q } of pianoTutte) applicaEvasione(s, r.id, p.mag.id, q, profilo.nome);
    }, `${n} richieste confermate da ${profilo.nome}`);
    mostraToast(`${n} richieste confermate`);
    setChiediTutte(false);
  };

  return (
    <div>
      <Intesta titolo="Richieste" sotto="Prelievi richiesti dalle linee delle sedi che rifornisci" />

      {tab === "in-attesa" && pianoTutte.length > 0 && (
        <button onClick={() => setChiediTutte(true)}
          className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 mb-3 w-full text-left"
          style={{ background: "#E9F7F1", border: `1.5px solid ${T.verde}55` }}>
          <span className="rounded-xl p-2 shrink-0" style={{ background: `${T.verde}22`, color: T.verde }}>
            <CheckCheck size={17} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="font-extrabold block" style={{ color: T.ink }}>
              Confermo tutto · {pianoTutte.length} richieste
            </span>
            <span className="text-xs block" style={{ color: T.dim }}>
              {conExtra > 0
                ? `Prima il livello di tutte le linee, poi gli extra con quello che avanza`
                : "Manda quello che è stato chiesto, prelevando dal laboratorio"}
              {restano > 0 && ` · ${restano} non si può`}
            </span>
          </span>
          <ChevronRight size={18} style={{ color: T.verde }} />
        </button>
      )}

      {/* ── COSA DEVO PRODURRE, E QUANDO ──
          Sta sopra «Ho prodotto» perche' viene prima nel tempo: prima si
          guarda cosa serve, poi si fa. Compare solo se c'e' davvero qualcosa
          da fare, oggi o domani: un riquadro che dice «niente» tutti i giorni
          insegna a non guardarlo. */}
      {(pianoOggi.length > 0 || pianoDomani.length > 0) && (
        <button onClick={() => { setQuando(pianoOggi.length ? "oggi" : "domani"); setPiano(true); }}
          className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 mb-3 w-full text-left"
          style={{ background: "#FFF6E8", border: `1.5px solid ${T.ambra}55` }}>
          <span className="rounded-xl p-2 shrink-0" style={{ background: `${T.ambra}22`, color: T.ambra }}>
            <ClipboardList size={17} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="font-extrabold block" style={{ color: T.ink }}>
              {pianoOggi.length > 0
                ? `Da produrre oggi · ${pianoOggi.length} ${pianoOggi.length === 1 ? "preparato" : "preparati"}`
                : `Oggi sei a posto · domani ne servono ${pianoDomani.length}`}
            </span>
            <span className="text-xs block" style={{ color: T.dim }}>
              {pianoOggi.length > 0
                ? `Contando quello che le linee hanno adesso e quello che c'è in laboratorio${
                    pianoDomani.length > 0 ? ` · domani altri ${pianoDomani.length}` : ""}`
                : "Guarda avanti: così domani mattina non si parte in ritardo"}
            </span>
          </span>
          <ChevronRight size={18} style={{ color: T.ambra }} />
        </button>
      )}

      {/* ── «HO PRODOTTO», ANCHE SENZA UNA RICHIESTA ──
          Sta qui e non sotto Magazzini perche' qui ci sta il laboratorio
          mentre lavora. Resta visibile anche quando non c'e' niente in
          attesa: e' esattamente il momento in cui si prepara per dopo. */}
      {preparatiLab.length > 0 && (
        <button onClick={() => { setCerca(""); setElenco(true); }}
          className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 mb-3 w-full text-left"
          style={{ background: "#EAF6FB", border: `1.5px solid ${T.ciano}55` }}>
          <span className="rounded-xl p-2 shrink-0" style={{ background: `${T.ciano}22`, color: T.ciano }}>
            <FlaskConical size={17} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="font-extrabold block" style={{ color: T.ink }}>Ho prodotto</span>
            <span className="text-xs block" style={{ color: T.dim }}>
              Segna quello che hai preparato, anche se nessuno l'ha ancora chiesto:
              così quando la richiesta arriva parte subito
            </span>
          </span>
          <ChevronRight size={18} style={{ color: T.ciano }} />
        </button>
      )}

      <div className="mb-4">
        <Segmenti valore={tab} onCambia={setTab} opzioni={[
          { id: "in-attesa", nome: `In attesa · ${attive.length}` },
          { id: "archivio", nome: `Archivio · ${archivio.length}` },
        ]} />
      </div>

      <div key={tab} className="sc-fade flex flex-col gap-3">
        {lista.length === 0 && (
          <Scheda><Vuoto icona={FlaskConical}
            titolo={tab === "in-attesa" ? "Nessuna richiesta in attesa" : "Archivio vuoto"}
            testo={tab === "in-attesa"
              ? (preparatiLab.length
                ? "Quando un operatore conta una linea rifornita dal laboratorio, la richiesta apparirà qui in tempo reale. Intanto, se stai preparando per dopo, segnalo con «Ho prodotto» qui sopra: quello che è segnato parte subito quando la richiesta arriva."
                : "Quando un operatore conta una linea rifornita dal laboratorio, la richiesta apparirà qui in tempo reale.")
              : "Le richieste evase, parziali o annullate finiranno qui."} /></Scheda>
        )}
        {lista.map((r) => {
          const prod = trova(stato.prodotti, r.prodottoId);
          if (!prod) return null;
          const sede = trova(stato.sedi, r.daSedeId);
          const sel = uomVista[r.id] || r.uomId;
          const q = converti(prod, r.qty, r.uomId, sel) ?? r.qty;
          const st = STATI[r.stato];
          return (
            <Scheda key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <div className="font-extrabold" style={{ color: T.ink }}>{prod.nome}</div>
                  <div className="text-xs mt-0.5" style={{ color: T.dim }}>
                    {/* «di fabbisogno automatico» non è italiano: quando la
                        richiesta non l'ha scritta una persona si dice come è
                        nata, non a nome di chi */}
                    {sede?.nome} · {r.magNome} · {r.creataDa === "fabbisogno automatico"
                      ? "in automatico, per scorta bassa" : `di ${r.creataDa}`} · {tempoFa(r.t)}
                  </div>
                </div>
                {st && <Chip colore={st[0]}>{st[1]}</Chip>}
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-2xl font-extrabold" style={{ color: T.ciano }}>{fmtQ(q)}</span>
                <select value={sel} onChange={(e) => setUomVista((v) => ({ ...v, [r.id]: e.target.value }))}
                  aria-label="Unità di visualizzazione"
                  className="rounded-full px-3 py-1.5 text-sm font-extrabold"
                  style={{ background: "#E7F7FA", border: "1px solid #C4EAF2", color: T.ciano }}>
                  {unitaProdotto(stato, prod).map((u) => <option key={u.id} value={u.id}>{u.simbolo}</option>)}
                </select>
                {/* L'EQUIVALENZA, sempre a schermo e non da cercare nella
                    tendina. Sua richiesta: «dovrebbero vedere sia i pezzi che
                    sono stati richiesti e a quanti kg corrispondono». Chi
                    lavora ha in mano una bilancia, non un convertitore. */}
                {(() => {
                  const altra = unitaProdotto(stato, prod).find((u) => u.id !== sel);
                  if (!altra) return null;
                  const eq = converti(prod, q, sel, altra.id);
                  if (eq == null) return null;
                  return <Chip colore={T.ciano}>= {fmtQ(eq)} {altra.simbolo}</Chip>;
                })()}
                <Chip colore={T.dim}>linea: {fmtQ(r.qtyLinea)} {simboloU(stato, r.uomLineaId)}</Chip>
                {/* senza questo il laboratorio vede solo il totale e non sa
                    quale parte è il livello e quale è stata chiesta in più */}
                {r.extraLinea > 0 && (
                  <Chip colore={T.ciano}>
                    {fmtQ(r.qtyLinea - r.extraLinea)} di livello + {fmtQ(r.extraLinea)} in più
                  </Chip>
                )}
                {r.stato === "parziale" && <Chip colore={T.parziale}>evase {fmtQ(r.qtyEvasa)} di {fmtQ(r.qty)} {simboloU(stato, r.uomId)}</Chip>}
              </div>

              {tab === "in-attesa" ? (
                (() => {
                  /* «Conferma» manda quello che è stato chiesto senza aprire
                     niente; «Cambia» apre la finestra per una quantità diversa */
                  const pr = propostaEvasione(stato, profilo, r);
                  const ok = pr && pr.mag && pr.inviato > 1e-9;
                  /* Il tasto della singola riga si ferma al livello quando l'extra
                     non ci sta dopo i livelli di tutti quelli che pescano dallo
                     stesso pozzo. «Confermo tutto» fa già così: due strade che
                     sullo stesso gesto si comportano in modo diverso sono il modo
                     più rapido per non fidarsi più dei numeri dell'app. L'extra si
                     può mandare comunque, e la via è «Cambia», che c'era già. */
                  const pz = ok ? pozzi[pr.mag.id + "|" + r.prodottoId] : null;
                  const liv = ok ? livelloChiesto(r, pr) : 0;
                  const extraLab = ok ? Math.max(0, inUnitaLab(r, pr, r.qty) - liv) : 0;
                  const stretto = !!pz && r.extraLinea > 0 && liv > 1e-9 && pz.chi.length > 1
                    && pz.disp + 1e-9 < pz.livelli + extraLab;
                  const altre = stretto ? pz.chi.filter((x) => x.id !== r.id) : [];
                  const tetto = stretto ? Math.min(pr.inviato, liv) : (ok ? pr.inviato : 0);
                  const frenato = ok && tetto + 1e-9 < pr.inviato;
                  return (
                    <div className="mt-3">
                      {!ok && (
                        <div className="text-xs mb-2 rounded-xl px-3 py-2" style={{ background: "#FFF6E8", color: "#7A4A00" }}>
                          Non si può confermare al volo: {pr?.motivo || "manca il prodotto a catalogo"}.
                        </div>
                      )}
                      {frenato && (
                        <div className="text-xs mb-2 rounded-xl px-3 py-2" style={{ background: "#E6F7FA", color: "#0B6A78" }}>
                          Il tasto manda <b>{fmtQ(tetto)} {pr.sym}</b>, cioè il livello: gli altri
                          {" "}<b>{fmtQ(pr.inviato - tetto)} {pr.sym}</b> sono l'extra, e in laboratorio
                          non ce n'è abbastanza anche per il livello di
                          {" "}«{altre[0].magNome}». Se vuoi mandare anche l'extra, usa <b>Cambia</b>.
                        </div>
                      )}
                      {ok && !frenato && pr.parziale && (
                        <div className="text-xs mb-2 rounded-xl px-3 py-2" style={{ background: "#FFF6E8", color: "#7A4A00" }}>
                          In laboratorio ce ne sono {fmtQ(pr.inviato)} {pr.sym} su {fmtQ(pr.bisogno)}: confermando parte parziale.
                        </div>
                      )}
                      <div className="flex gap-2 justify-end flex-wrap">
                        <Bottone variante="fantasma" piccolo icona={X} onClick={() => setAnnullaR(r)}>Annulla</Bottone>
                        {/* «Ho prodotto» sta QUI, dove il laboratorio legge cosa
                            deve fare. Compare solo su un preparato e solo se il
                            magazzino del laboratorio ha quella riga: se non ce
                            l'ha, non c'e' niente da caricare e un tasto che si
                            preme senza effetto sarebbe peggio di un tasto che
                            manca. Resta separato da «Conferma»: prima si fa la
                            merce, poi la si manda. */}
                        {preparato(prod) && magLab
                          && (magLab.articoli || []).some((a) => a.prodottoId === r.prodottoId) && (
                          <Bottone variante="tonale" piccolo icona={FlaskConical}
                            onClick={() => setProduci(r)}>Ho prodotto</Bottone>
                        )}
                        <Bottone variante="tonale" piccolo icona={Pencil} onClick={() => setEvadi(r)}>Cambia</Bottone>
                        {ok && (
                          <Bottone piccolo icona={Check} onClick={() => confermaRiga(r, pr, tetto)}>
                            Conferma {fmtQ(tetto)} {pr.sym}
                          </Bottone>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                r.evasoDa && <div className="text-xs mt-2" style={{ color: T.tenue }}>
                  {r.stato === "annullata" ? "Annullata" : `Evasa da «${r.magazzinoLabNome || "—"}»`} · {r.evasoDa} · {tempoFa(r.tEvasione)}
                </div>
              )}
            </Scheda>
          );
        })}
      </div>

      <Foglio aperto={piano} titolo="Da produrre" onChiudi={() => setPiano(false)}>
        <div className="flex flex-col gap-3">
          <Segmenti valore={quando} onCambia={setQuando} opzioni={[
            { id: "oggi", nome: `Oggi · ${pianoOggi.length}` },
            { id: "domani", nome: `${NOMI_GIORNI[String(domaniG)]} · ${pianoDomani.length}` },
          ]} />
          {/* Il conto di domani non sa cosa verrà consumato da qui a stasera:
              dirlo è meglio che lasciar credere a una precisione che non c'è.
              Un numero che si spaccia per certo, il giorno che sbaglia, si
              porta dietro anche quelli giusti. */}
          {quando === "domani" && (
            <p className="text-xs leading-relaxed" style={{ color: T.dim }}>
              È il livello previsto di {NOMI_GIORNI[String(domaniG)]} sulle linee, meno quello che
              c'è adesso. <b>Non sa cosa verrà consumato da qui a stasera</b>: prendilo come un
              «preparati», non come un numero esatto.
            </p>
          )}
          {pianoVisto.length === 0 && (
            <p className="text-sm font-semibold py-2" style={{ color: T.verde }}>
              {quando === "oggi" ? "Oggi non manca niente: le linee sono a livello."
                : `Per ${NOMI_GIORNI[String(domaniG)]} c'è già tutto.`}
            </p>
          )}
          {pianoVisto.map(({ p, a, fare, serve, hannoGia, chiesto, dove, quantiPosso, chiManca }) => (
            <button key={p.id} onClick={() => { setPiano(false); setProduci({ prodottoId: p.id, quanto: fare }); }}
              className="rounded-2xl px-3.5 py-3 w-full text-left"
              style={{ background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
              <div className="flex items-center gap-2">
                <span className="font-extrabold flex-1 min-w-0 truncate" style={{ color: T.ink }}>{p.nome}</span>
                <Chip colore={T.ambra}>{fmtQ(fare)} {simboloU(stato, a.uomId)}</Chip>
                <ChevronRight size={16} style={{ color: T.dim }} />
              </div>
              {/* il conto in chiaro: chi legge deve poter rifare la somma, se
                  no il numero è un oracolo e non ci si fida */}
              <div className="text-xs mt-1" style={{ color: T.dim }}>
                Manca {fmtQ(serve)} {simboloU(stato, a.uomId)} {dove === 1 ? "a 1 linea" : `su ${dove} linee`}
                {chiesto > 0 && <span> · di cui <b style={{ color: T.ink }}>{fmtQ(chiesto)} già chiesti</b></span>}
                {" "}· in laboratorio {fmtQ(a.qty)}
                {!conRicetta(p) && <span style={{ color: T.ambra, fontWeight: 700 }}> · nessuna ricetta</span>}
              </div>
              {/* il controllo che qui mancava: sapere che ne servono 15 non
                  serve a niente se il riso basta per 10 */}
              {quantiPosso != null && (
                <div className="text-xs mt-1.5 rounded-xl px-2.5 py-1.5 font-bold"
                  style={{ background: "#FCEEF1", color: T.rosso }}>
                  {quantiPosso > 0
                    ? `Gli ingredienti bastano per ${fmtQ(quantiPosso)}: manca «${chiManca}»`
                    : `Non si può farne: manca «${chiManca}»`}
                </div>
              )}
            </button>
          ))}
          {/* una scelta dichiarata, non un silenzio: il livello di scorta del
              laboratorio non entra in questo conto finché vale lo stesso
              numero su tutti i preparati, cioè finché è un valore di partenza
              e non una decisione. */}
          {pianoVisto.length > 0 && (
            <p className="text-xs leading-relaxed" style={{ color: T.tenue }}>
              Il conto guarda <b>quanto manca alle linee</b>. La scorta che il laboratorio tiene per
              sé non ci entra: oggi quel livello vale lo stesso numero su tutti i preparati, quindi
              non è una scelta di nessuno. Quando lo deciderete, si aggiunge qui.
            </p>
          )}
        </div>
      </Foglio>

      {/* l'elenco di quello che il laboratorio puo' aver fatto: si sceglie e
          si va dritti sulla scheda della produzione, che e' la stessa di
          sempre — un solo posto dove i numeri si muovono */}
      <Foglio aperto={elenco} titolo="Ho prodotto · cosa hai fatto?" onChiudi={() => setElenco(false)}>
        <div className="flex flex-col gap-2">
          {preparatiLab.length > 6 && (
            <Campo label="" valore={cerca} onCambia={setCerca} placeholder="Cerca un preparato…" autoFocus />
          )}
          {cercati.length === 0 && (
            <p className="text-sm font-semibold py-2" style={{ color: T.ambra }}>
              Nessun preparato con questo nome.
            </p>
          )}
          {cercati.map(({ a, p }) => {
            /* la giacenza si mostra perche' e' la domanda che uno si fa
               proprio in quel momento: ne ho gia', o parto da zero? */
            const chieste = attive.filter((r) => r.prodottoId === p.id).length;
            return (
              <button key={p.id} onClick={() => { setElenco(false); setProduci({ prodottoId: p.id }); }}
                className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 w-full text-left"
                style={{ background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
                <span className="flex-1 min-w-0">
                  <span className="font-extrabold block truncate" style={{ color: T.ink }}>{p.nome}</span>
                  <span className="text-xs block" style={{ color: T.dim }}>
                    In laboratorio: {fmtQ(a.qty)} {simboloU(stato, a.uomId)}
                    {chieste > 0 && ` · ${chieste === 1 ? "1 richiesta in attesa" : `${chieste} richieste in attesa`}`}
                    {!conRicetta(p) && " · nessuna ricetta: non scalerà ingredienti"}
                  </span>
                </span>
                <ChevronRight size={18} style={{ color: T.dim }} />
              </button>
            );
          })}
        </div>
      </Foglio>

      <Foglio aperto={!!produci} titolo={`Ho prodotto · ${trova(stato.prodotti, produci?.prodottoId)?.nome || ""}`}
        onChiudi={() => setProduci(null)}>
        {produci && magLab && (() => {
          const art = (magLab.articoli || []).find((a) => a.prodottoId === produci.prodottoId);
          if (!art) return null;
          return <FormProduzione stato={stato} mag={magLab} art={art} muta={muta} suggerito={produci.quanto}
            mostraToast={mostraToast} onChiudi={() => setProduci(null)} profilo={profilo} />;
        })()}
      </Foglio>

      <Foglio aperto={!!evadi} titolo="Evadi richiesta" onChiudi={() => setEvadi(null)}>
        {evadi && <FormEvasione key={evadi.id} stato={stato} profilo={profilo} r={evadi}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setEvadi(null)} onAnnulla={annulla} />}
      </Foglio>
      <Conferma aperto={chiediTutte} titolo={`Confermare ${pianoTutte.length} richieste?`}
        testo={`Da ogni magazzino laboratorio parte quello che è stato chiesto, o tutto quello che c'è se non basta. ${restano > 0 ? `Le ${restano} che non si possono evadere restano in attesa. ` : ""}Se sbagli, in Home lo storico ti fa riportare tutto com'era.`}
        testoSi={`Conferma ${pianoTutte.length}`} onNo={() => setChiediTutte(false)} onSi={confermaTutte} />
      <Conferma aperto={!!annullaR} titolo="Annullare la richiesta?"
        testo="La linea resterà sotto il livello previsto finché un nuovo conteggio non la rigenererà."
        onNo={() => setAnnullaR(null)} testoSi="Annulla richiesta"
        onSi={() => { annulla(annullaR); setAnnullaR(null); }} />
    </div>
  );
}

/* ─────────── RICEZIONE MERCE (quantità reale arrivata) ─────────── */
function FormRicezione({ stato, o, profilo, muta, mostraToast, onChiudi }) {
  const prod = trova(stato.prodotti, o.prodottoId);
  const sym = simboloU(stato, o.uomId);
  const tipoMag = o.tipo === "lab" ? "laboratorio" : "retro";
  const magOk = stato.magazzini.find((m) => m.sedeId === o.sedeId && m.tipo === tipoMag &&
    m.articoli.some((a) => a.prodottoId === o.prodottoId));
  const art = magOk?.articoli.find((a) => a.prodottoId === o.prodottoId);
  const sede = trova(stato.sedi, o.sedeId);
  const [qtyStr, setQtyStr] = useState(String(o.qty));
  /* di un prodotto che si spedisce solo intero non arriva mezza confezione */
  const interi = !!prod?.soloInteri;
  const grezzoR = Math.max(0, num(qtyStr) ?? 0);
  const ric = interi ? Math.max(0, Math.round(grezzoR)) : grezzoR;
  const arrivo = art && prod ? (converti(prod, ric, o.uomId, art.uomId) ?? ric) : ric;
  const manca = Math.max(0, o.qty - ric);

  const conferma = () => {
    if (!prod) return mostraToast("Prodotto non più a catalogo", "errore");
    if (!magOk || !art) return mostraToast(`Nessun magazzino ${tipoMag} della sede contiene questo articolo`, "errore");
    muta((s) => {
      const oB = trova(s.ordini, o.id);
      if (!oB || oB.stato !== "ordinato") return;
      const pB = trova(s.prodotti, oB.prodottoId);
      const mB = trova(s.magazzini, magOk.id);
      const aB = mB?.articoli.find((a) => a.prodottoId === oB.prodottoId);
      if (!pB || !aB) return;
      if (ric > 1e-9) {
        const arr = converti(pB, ric, oB.uomId, aB.uomId) ?? ric;
        aB.qty = +(aB.qty + arr).toFixed(4);
        registraMov(s, { magId: mB.id, prodottoId: pB.id, uomId: aB.uomId, delta: arr, dopo: aB.qty,
          causale: "ricezione", chi: profilo?.nome, rif: trova(s.fornitori, oB.fornitoreId)?.nome });
      }
      oB.stato = "ricevuto"; oB.tRicezione = Date.now(); oB.ricevutoDa = profilo?.nome; oB.qtyRicevuta = ric;
      const mancaB = Math.max(0, oB.qty - ric);
      if (mancaB > 1e-9) {
        s.ordini.unshift({ id: uid("ord"), t: Date.now(), tipo: oB.tipo, sedeId: oB.sedeId,
          prodottoId: oB.prodottoId, fornitoreId: oB.fornitoreId, qty: +mancaB.toFixed(4), uomId: oB.uomId,
          stato: "da-ordinare", nota: "residuo non consegnato" });
      }
    }, `Ricezione «${prod.nome}»: ${fmtQ(ric)} ${sym}${manca > 1e-9 ? ` · mancano ${fmtQ(manca)} ${sym} (rimessi da ordinare)` : ""}`);
    mostraToast(ric > 1e-9 ? "Magazzino caricato con la quantità reale" : "Segnato: nulla arrivato, resta da ordinare");
    onChiudi();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl px-3.5 py-3" style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
        <div className="font-extrabold" style={{ color: T.ink }}>{prod?.nome || "—"}</div>
        <div className="text-sm mt-0.5" style={{ color: T.dim }}>
          Ordinati <b>{fmtQ(o.qty)} {sym}</b> a {trova(stato.fornitori, o.fornitoreId)?.nome || "—"} · {sede?.nome}
        </div>
      </div>
      <Campo label={`Quantità realmente arrivata (${sym})`} valore={qtyStr}
        onCambia={(v) => setQtyStr(puliziaNum(v))} inputMode="decimal" placeholder="0" autoFocus
        suggerimento={interi
          ? "Quante confezioni intere sono arrivate davvero: di questo prodotto non arrivano mezze quantità. Se è meno dell'ordine, il resto torna in «da ordinare»."
          : "Quanto è arrivato davvero. Se è meno dell'ordine, il resto torna in «da ordinare»."} />
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => setQtyStr(String(o.qty))} className="rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ background: "#E4F6EE", color: T.verde }}>Tutto ({fmtQ(o.qty)} {sym})</button>
        <button type="button" onClick={() => setQtyStr("0")} className="rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ background: "#FCE9EE", color: T.rosso }}>Niente arrivato</button>
      </div>
      {magOk && art
        ? <div className="rounded-2xl px-3.5 py-3 text-sm" style={{ background: "#EFF7F3", border: "1px solid #CFEADD", color: T.ink }}>
            «{magOk.nome}» si carica di <b style={{ color: T.verde }}>{fmtQ(arrivo)} {simboloU(stato, art.uomId)}</b>
            {manca > 1e-9 && <> · restano <b style={{ color: T.rosa }}>{fmtQ(manca)} {sym}</b> da ordinare</>}
          </div>
        : <p className="text-sm" style={{ color: T.ambra }}>Nessun magazzino {tipoMag} della sede contiene questo articolo.</p>}
      <div className="flex gap-2 justify-end">
        <Bottone variante="fantasma" onClick={onChiudi}>Annulla</Bottone>
        <Bottone icona={PackageCheck} onClick={conferma} disabilitato={!magOk || !art}>Registra ricezione</Bottone>
      </div>
    </div>
  );
}

/* ─────────── REPORT ORDINI ─────────── */
/* ─────────── DA MANDARE ───────────
   Il testo è pensato per WhatsApp: niente tabelle, righe corte, un trattino
   per articolo. Chi lo riceve deve poterlo leggere sul telefono senza zoom. */
/* ─────────── DIVISI PER CATEGORIA, ANCHE QUELLI DEL LABORATORIO ───────────
   Chiesto da chi lo riceve: «anche al laboratorio i prodotti divisi per
   categoria senza che vengano mischiati tutti insieme, almeno anche loro sono
   facilitati nella lettura».

   Aveva ragione due volte. Il «Report ordine» raggruppava per categoria da
   sempre, questo testo no: la stessa persona si trovava in mano due elenchi
   fatti in due modi diversi, a seconda del tasto premuto. Quindi qui va per
   categoria TUTTO — laboratorio e fornitori — non solo il blocco chiesto:
   sistemarne uno e lasciare l'altro sarebbe stato spostare l'incoerenza di un
   posto, non toglierla.

   Le cose senza categoria finiscono in fondo sotto un'intestazione che lo
   dice, invece di sparire in silenzio: quello che non si vede in un ordine e'
   quello che poi manca in cucina. */
function testoDaMandare(stato, sede, righeLab, perForn) {
  const riga = (x) => "- " + (trova(stato.prodotti, x.prodottoId)?.nome || "?")
    + ": " + fmtQ(x.qty) + " " + simboloU(stato, x.uomId);
  const nome = (x) => trova(stato.prodotti, x.prodottoId)?.nome || "";
  const perAlfabeto = (a, b) => nome(a).localeCompare(nome(b));
  const perCategoria = (righe) => {
    const gruppi = stato.categorie
      .map((c) => ({ nome: c.nome,
        items: righe.filter((x) => trova(stato.prodotti, x.prodottoId)?.categoriaId === c.id) }))
      .filter((g) => g.items.length);
    const conCat = new Set(gruppi.flatMap((g) => g.items));
    const fuori = righe.filter((x) => !conCat.has(x));
    if (fuori.length) gruppi.push({ nome: "Senza categoria", items: fuori });
    return gruppi.map((g) => ({ nome: g.nome, items: g.items.slice().sort(perAlfabeto) }));
  };
  const blocco = (r, righe) => {
    for (const g of perCategoria(righe)) {
      r.push("· " + g.nome);
      g.items.forEach((x) => r.push(riga(x)));
    }
  };
  const r = [sede.nome.toUpperCase() + " · " + new Date().toLocaleDateString("it-IT")];
  if (righeLab.length) { r.push("", "AL LABORATORIO"); blocco(r, righeLab); }
  for (const g of perForn) {
    r.push("", g.f ? g.f.nome.toUpperCase() : "SENZA FORNITORE");
    blocco(r, g.righe);
  }
  return r.join("\n");
}

/* ─────────── QUELLO CHE ARRIVA DAL LABORATORIO ───────────
   Le richieste in attesa restano sempre in lista; quelle chiuse spariscono
   dopo una settimana, perché lì serve sapere cosa è appena arrivato, non
   l'archivio: quello sta nella pagina Richieste. */
function RichiesteLab({ stato, righe }) {
  const recenti = righe.filter((r) => r.stato !== "annullata"
    && (r.stato === "in-attesa" || (r.tEvasione || r.t) >= Date.now() - 7 * 86400000));
  if (!recenti.length) return (
    <Scheda><Vuoto icona={FlaskConical} titolo="Niente in viaggio dal laboratorio"
      testo="Le richieste compaiono qui appena una linea viene contata e il fabbisogno parte verso il laboratorio." /></Scheda>);
  const sedi = stato.sedi.filter((s) => recenti.some((r) => r.daSedeId === s.id));
  return (<>
    {sedi.map((s) => {
      const dellaSede = recenti.filter((r) => r.daSedeId === s.id);
      const attesa = dellaSede.filter((r) => r.stato === "in-attesa").length;
      return (
        <Scheda key={s.id} className="p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="font-extrabold flex-1 min-w-0 truncate" style={{ color: T.ink }}>{s.nome}</div>
            {attesa > 0 && <Chip colore={T.ambra}>{attesa} in attesa</Chip>}
            {dellaSede.length - attesa > 0 && <Chip colore={T.verde}>{dellaSede.length - attesa} confermate</Chip>}
          </div>
          <div className="flex flex-col gap-2">
            {dellaSede.map((r) => {
              const p = trova(stato.prodotti, r.prodottoId);
              const sym = simboloU(stato, r.uomId);
              const col = r.stato === "in-attesa" ? T.ambra : r.stato === "parziale" ? T.parziale : T.verde;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
                  style={{ background: "#F7F9FE" }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" style={{ color: T.ink }}>{p?.nome || "—"}</div>
                    <div className="text-xs truncate" style={{ color: T.tenue }}>
                      {r.magNome} · chiesti {fmtQ(r.qty)} {sym}
                    </div>
                  </div>
                  <Chip colore={col}>
                    {r.stato === "in-attesa" ? "in attesa"
                      : r.stato === "parziale" ? `confermati ${fmtQ(r.qtyEvasa)} di ${fmtQ(r.qty)} ${sym}`
                      : `confermati ${fmtQ(r.qty)} ${sym}`}
                  </Chip>
                </div>
              );
            })}
          </div>
        </Scheda>
      );
    })}
  </>);
}

function DaMandare({ stato, profilo, mostraToast }) {
  const [apri, setApri] = useState(null);
  const miaSede = profilo.ruolo === "admin" ? null : profilo.sedeId;
  const blocchi = stato.sedi
    .filter((s) => s.tipo !== "laboratorio" && (!miaSede || s.id === miaSede))
    .map((sede) => {
      const lab = (stato.richieste || []).filter((x) => x.stato === "in-attesa" && x.daSedeId === sede.id);
      /* Stessa regola del report, e per lo stesso motivo: un preparato non si
         compra da nessuno, ma la sua riga «da ordinare» può essere più vecchia
         della spunta. Questi sono gli UNICI DUE punti da cui esce del testo
         diretto a un fornitore — qui e il «Report ordine» — e nessuno dei due
         deve aspettare il «Ricalcola» per smettere di far ordinare fuori una
         cosa che si fa in casa. */
      const ord = (stato.ordini || []).filter((o) => o.stato === "da-ordinare"
        && o.sedeId === sede.id && !preparato(trova(stato.prodotti, o.prodottoId)));
      const perForn = stato.fornitori
        .map((f) => ({ f, righe: ord.filter((o) => o.fornitoreId === f.id) })).filter((g) => g.righe.length);
      const orfane = ord.filter((o) => !stato.fornitori.some((f) => f.id === o.fornitoreId));
      if (orfane.length) perForn.push({ f: null, righe: orfane });
      return { sede, n: lab.length + ord.length, testo: testoDaMandare(stato, sede, lab, perForn) };
    })
    .filter((b) => b.n > 0);
  if (!blocchi.length) return null;

  const copia = (t) => navigator.clipboard?.writeText(t).then(
    () => mostraToast("Copiato: ora incollalo su WhatsApp"),
    () => mostraToast("Apri «Vedi il testo» e copialo a mano", "avviso"));
  const wa = (t) => window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank", "noopener");
  const tutto = blocchi.map((b) => b.testo).join("\n\n———\n\n");

  return (
    <Scheda className="p-4 mb-4" style={{ background: "#F1FBF6", border: `1px solid ${T.verde}44` }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-extrabold" style={{ color: T.ink }}>Da mandare adesso</div>
          <div className="text-xs" style={{ color: T.dim }}>
            Tutto quello che serve, sede per sede: al laboratorio e ai fornitori
          </div>
        </div>
        {blocchi.length > 1 && (
          <div className="flex gap-2">
            <Bottone piccolo variante="tonale" icona={Copy} onClick={() => copia(tutto)}>Copia tutto</Bottone>
            <Bottone piccolo icona={Send} onClick={() => wa(tutto)}>WhatsApp</Bottone>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 mt-3">
        {blocchi.map((b) => (
          <div key={b.sede.id} className="rounded-2xl p-3"
            style={{ background: "#fff", border: `1px solid ${T.bordo}` }}>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-extrabold flex-1 min-w-0 truncate" style={{ color: T.ink }}>{b.sede.nome}</div>
              <Chip colore={T.verde}>{b.n} rig{b.n === 1 ? "a" : "he"}</Chip>
              <Bottone piccolo variante="tonale" icona={Copy} onClick={() => copia(b.testo)}>Copia</Bottone>
              <Bottone piccolo icona={Send} onClick={() => wa(b.testo)}>WhatsApp</Bottone>
            </div>
            <button onClick={() => setApri((v) => (v === b.sede.id ? null : b.sede.id))}
              className="text-xs font-bold mt-1 py-2 px-1 -ml-1" style={{ color: T.blu }}>
              {apri === b.sede.id ? "Nascondi il testo" : "Vedi il testo"}
            </button>
            {apri === b.sede.id && (
              <textarea readOnly value={b.testo} onFocus={(e) => e.target.select()}
                rows={Math.min(20, b.testo.split("\n").length + 1)}
                className="w-full mt-2 rounded-xl p-3 text-sm font-semibold"
                style={{ background: "#F6F8FE", border: `1px solid ${T.bordo}`, color: T.ink }} />
            )}
          </div>
        ))}
      </div>
    </Scheda>
  );
}

function VistaOrdini({ stato, profilo, muta, mostraToast, vaiA }) {
  /* Si apriva SEMPRE su «Da ordinare». Se le righe stavano tutte in «Ricevuti»
     — cioè il caso normale dopo che un ordine è andato a buon fine — chi entrava
     trovava una schermata vuota, uscendo e rientrando la ritrovava vuota, e
     sembrava che gli ordini fatti fossero spariti. Non era vero: erano nella
     scheda accanto. Ora si apre sulla prima scheda che ha qualcosa, e «Da
     ordinare» resta la preferita quando c'è del lavoro da fare. */
  /* senza «ordini» il ciclo d'acquisto non e' suo: restano le schede della
     merce in arrivo (ricevere e' mestiere). Le stesse schede guidano anche
     «primaPiena» e «altrove»: offrire un «vai a Da ordinare» a chi non ha
     la scheda sarebbe una porta dipinta sul muro. */
  const STATI_MIEI = puoOrdinare(profilo) ? ["da-ordinare", "ordinato", "ricevuto"] : ["ordinato", "ricevuto"];
  const primaPiena = (() => {
    const conta = (st) => (stato.ordini || []).filter((o) => ordineVisibile(profilo, o) && o.stato === st).length;
    for (const st of STATI_MIEI) if (conta(st)) return st;
    return STATI_MIEI[0];
  })();
  const [tab, setTab] = useState(primaPiena);
  const [reportAperto, setReportAperto] = useState(false);

  const miei = stato.ordini.filter((o) => ordineVisibile(profilo, o));
  /* il laboratorio vede le richieste delle sedi che serve, l'operatore le
     proprie, l'admin tutte: la stessa regola degli ordini, applicata a monte */
  /* quanto costa l'ordine che stai per mandare: stessa regola del valore di
     magazzino — quello che non si sa non si somma, si conta e si dice */
  const costoDaOrdinare = (() => {
    let tot = 0, senza = 0;
    for (const o of miei) {
      if (o.stato !== "da-ordinare") continue;
      const p = trova(stato.prodotti, o.prodottoId);
      if (!p || !(p.prezzo > 0)) { senza++; continue; }
      const q = o.uomId === p.uomBase ? o.qty : converti(p, o.qty, o.uomId, p.uomBase);
      if (q == null) { senza++; continue; }
      tot += q * p.prezzo;
    }
    return { tot, senza };
  })();
  /* le cose da preparare le vede chi le prepara (il laboratorio, sui suoi
     magazzini) e chi guarda tutto (l'admin). A un operatore di sede non serve:
     non è lui che le fa, e in Ordini avrebbe solo una scheda in più da saltare. */
  /* ── IL BUCO CHE NON SI VEDEVA ──
     Un preparato che manca in una linea o in un retro diventa una richiesta al
     laboratorio. Ma se la sede non ha un laboratorio a cui chiedere, la
     richiesta non nasce: non c'e' nessuno a cui mandarla, e inventargli un
     destinatario sarebbe peggio. Fin qui e' giusto. Quello che NON andava bene
     e' che non lo dicesse a nessuno: niente ordine (giusto, non si compra),
     niente richiesta (giusto, manca il destinatario), e quindi niente del
     tutto. Il prodotto finiva e nessuno lo sapeva.
     Da qui in poi si dice, e si dice dove ci si accorge del guaio — in Ordini —
     nominando la sede, il magazzino e il prodotto. Lo vede l'admin, che e' chi
     puo' rimediare, e la sede stessa, che e' chi rimane a secco. */
  const senzaLaboratorio = (() => {
    const out = [];
    for (const m of stato.magazzini) {
      if (m.tipo === "laboratorio") continue;
      if (profilo.ruolo !== "admin" && m.sedeId !== profilo.sedeId) continue;
      const sede = trova(stato.sedi, m.sedeId);
      /* non basta che la sede punti a un laboratorio: quel laboratorio deve
         anche esistere come magazzino, se no la richiesta parte e non la
         puo' evadere nessuno */
      const haLab = sede?.labSedeId
        && stato.magazzini.some((x) => x.sedeId === sede.labSedeId && x.tipo === "laboratorio");
      if (haLab) continue;
      for (const a of m.articoli || []) {
        const p = trova(stato.prodotti, a.prodottoId);
        if (!p || !preparato(p)) continue;
        const manca = parOggi(a) - a.qty;
        if (manca <= 1e-9) continue;
        out.push({ mag: m, sede, prod: p, art: a, manca });
      }
    }
    return out.sort((x, y) => (x.sede?.nome || "").localeCompare(y.sede?.nome || "")
      || x.prod.nome.localeCompare(y.prod.nome));
  })();
  const richVisibili = (stato.richieste || []).filter((r) =>
    profilo.ruolo === "admin" ? true
      : profilo.ruolo === "laboratorio" ? trova(stato.sedi, r.daSedeId)?.labSedeId === profilo.sedeId
      : r.daSedeId === profilo.sedeId);
  const nLabAttesa = richVisibili.filter((r) => r.stato === "in-attesa").length;
  const righe = miei.filter((o) => o.stato === tab);
  /* Quante righe ci sono nelle ALTRE schede: se questa è vuota bisogna dirlo,
     se no il vuoto si legge come «i miei ordini non ci sono più». */
  const ETICHETTE = { "da-ordinare": "Da ordinare", ordinato: "Ordinati", ricevuto: "Ricevuti" };
  const altrove = STATI_MIEI
    .filter((st) => st !== tab)
    .map((st) => ({ st, n: miei.filter((o) => o.stato === st).length }))
    .filter((x) => x.n > 0);
  const perFornitore = stato.fornitori
    .map((f) => ({ f, righe: righe.filter((o) => o.fornitoreId === f.id) }))
    .filter((g) => g.righe.length);

  /* Report ordine: solo righe «da ordinare», raggruppate per categoria,
     quantità totali aggregate per prodotto (non ridondante), copiabili. */
  /* Un preparato non si compra da nessuno. La riga «da ordinare», però, può
     essere più vecchia della spunta: nasce quando il prodotto era ancora un
     acquisto e sparisce solo al «Ricalcola» successivo. Nel frattempo finiva
     dritta nel testo che si manda al fornitore — cioè si ordinava fuori una
     cosa che ci si fa da soli. Qui non si aspetta il ricalcolo: nel report non
     ci entra, e basta.
     Le righe «lab» invece restano, e non è una svista: quelle sono gli acquisti
     DEL laboratorio a un fornitore vero (hanno un fornitoreId vero), non le
     richieste AL laboratorio, che stanno in un elenco a parte. */
  const daOrdinare = miei.filter((o) => o.stato === "da-ordinare"
    && !preparato(trova(stato.prodotti, o.prodottoId)));
  const reportCat = stato.categorie.map((c) => {
    const agg = {};
    daOrdinare.filter((o) => trova(stato.prodotti, o.prodottoId)?.categoriaId === c.id).forEach((o) => {
      const k = o.prodottoId + "|" + o.uomId;
      if (!agg[k]) agg[k] = { prodottoId: o.prodottoId, uomId: o.uomId, qty: 0 };
      agg[k].qty += o.qty;
    });
    const items = Object.values(agg).sort((a, b) =>
      (trova(stato.prodotti, a.prodottoId)?.nome || "").localeCompare(trova(stato.prodotti, b.prodottoId)?.nome || ""));
    return { c, items };
  }).filter((g) => g.items.length);
  const testoCat = (g) => g.c.nome + "\n" + g.items.map((i) =>
    `${trova(stato.prodotti, i.prodottoId)?.nome}: ${fmtQ(i.qty)} ${simboloU(stato, i.uomId)}`).join("\n");
  const testoTutto = reportCat.map(testoCat).join("\n\n");
  const copia = (t) => navigator.clipboard?.writeText(t).then(
    () => mostraToast("Copiato negli appunti"),
    () => mostraToast("Seleziona e copia a mano", "avviso"));
  const whatsapp = (t) => window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank", "noopener");

  const ricalcola = () => {
    if (!puoOrdinare(profilo))
      return mostraToast("Per gestire gli ordini serve l'autorizzazione dell'admin (Profili)", "errore");
    let esito = { righe: 0, inArrivo: 0 };
    const fatto = muta((s) => { esito = ricalcolaFabbisogni(s, profilo); },
      `Fabbisogni ricalcolati da ${profilo.nome}`);
    if (!fatto) return;
    /* Il silenzio qui è pericoloso: se il fabbisogno è coperto da roba già
       ordinata non compare nessuna riga, e senza una parola sembra che il
       ricalcolo non abbia funzionato. */
    mostraToast(esito.inArrivo
      ? `Report aggiornato · ${esito.inArrivo === 1
          ? "1 prodotto serve ma è già ordinato"
          : `${esito.inArrivo} prodotti servono ma sono già ordinati`}: sono in «Ordinati», non li richiedo`
      : "Report aggiornato dalle scorte attuali");
  };

  const segna = (ids) => {
    if (!puoOrdinare(profilo))
      return mostraToast("Per gestire gli ordini serve l'autorizzazione dell'admin (Profili)", "errore");
    return muta((s) => {
    s.ordini.forEach((o) => { if (ids.includes(o.id)) { o.stato = "ordinato"; o.tOrdine = Date.now(); o.ordinatoDa = profilo.nome; } });
  }, `${ids.length} righe segnate come ordinate da ${profilo.nome}`);
  };

  /* Ricezione in blocco: tutta la merce di un fornitore arrivata come
     ordinata. Carica ogni magazzino di destinazione con la quantità
     ordinata (convertita) e segna le righe ricevute. Le consegne
     parziali si correggono a mano con il tasto sulla singola riga. */
  const riceviTutto = (righe) => {
    const ids = righe.filter((o) => o.stato === "ordinato").map((o) => o.id);
    if (!ids.length) return;
    let caricati = 0, senzaMag = 0;
    muta((s) => {
      for (const id of ids) {
        const oB = trova(s.ordini, id);
        if (!oB || oB.stato !== "ordinato") continue;
        const pB = trova(s.prodotti, oB.prodottoId);
        const tipoMag = oB.tipo === "lab" ? "laboratorio" : "retro";
        const mB = s.magazzini.find((m) => m.sedeId === oB.sedeId && m.tipo === tipoMag &&
          m.articoli.some((a) => a.prodottoId === oB.prodottoId));
        const aB = mB?.articoli.find((a) => a.prodottoId === oB.prodottoId);
        if (!pB || !mB || !aB) { senzaMag++; continue; }
        const arr = converti(pB, oB.qty, oB.uomId, aB.uomId) ?? oB.qty;
        aB.qty = +(aB.qty + arr).toFixed(4);
        registraMov(s, { magId: mB.id, prodottoId: pB.id, uomId: aB.uomId, delta: arr, dopo: aB.qty,
          causale: "ricezione", chi: profilo?.nome, rif: trova(s.fornitori, oB.fornitoreId)?.nome });
        oB.stato = "ricevuto"; oB.tRicezione = Date.now(); oB.ricevutoDa = profilo?.nome; oB.qtyRicevuta = oB.qty;
        caricati++;
      }
    }, `Ricezione in blocco: ${caricati} righe caricate a magazzino da ${profilo.nome}`);
    mostraToast(senzaMag
      ? `${caricati} caricate · ${senzaMag} senza magazzino di destinazione`
      : `${caricati} righe ricevute: magazzini caricati`);
  };

  const [ricezione, setRicezione] = useState(null);

  const rimuovi = (id) => {
    /* prima di gen-5.95 QUESTO era senza nessuna condizione: chiunque
       vedesse una riga poteva cancellarla, in qualunque stato */
    if (!puoOrdinare(profilo))
      return mostraToast("Per gestire gli ordini serve l'autorizzazione dell'admin (Profili)", "errore");
    muta((s) => { s.ordini = s.ordini.filter((o) => o.id !== id); }, "Riga ordine rimossa");
  };

  return (
    <div>
      <Intesta titolo="Ordini" sotto="Report acquisti nelle unità di misura dei fornitori, raggruppati per categoria"
        azione={puoOrdinare(profilo) && <div className="flex gap-2 flex-wrap">
          {/* Lo Storico ordini sta anche sotto «Gestione», ma «Gestione» ce l'ha
              solo l'admin: chi ha l'interruttore «ordini» lo cerca comunque
              qui — accanto agli ordini di adesso. Per gli altri questi tre
              tasti sono gestione, non mestiere (gen-5.95). */}
          {vaiA && <Bottone variante="tonale" icona={History} onClick={() => vaiA("storico-ordini")}>Storico</Bottone>}
          <Bottone variante="tonale" icona={RotateCcw} onClick={ricalcola}>Ricalcola</Bottone>
          <Bottone icona={ClipboardList} onClick={() => setReportAperto(true)} disabilitato={!reportCat.length}>Report ordine</Bottone>
        </div>} />
      {puoOrdinare(profilo) && <DaMandare stato={stato} profilo={profilo} mostraToast={mostraToast} />}

      {/* ── NESSUNO A CUI CHIEDERLO ──
          Rosso e non ambra: l'ambra nell'app vuol dire «sta finendo», e questo
          non e' un livello basso, e' una strada interrotta. Finche' resta cosi'
          quel prodotto non arrivera' mai, per quanto si ricalcoli. */}
      {(profilo.ruolo === "admin" || puoOrdinare(profilo)) && senzaLaboratorio.length > 0 && (
        <Scheda className="p-4 mb-3" style={{ border: `1.5px solid ${T.rosso}55`, background: "#FFF4F6" }}>
          <div className="flex items-center gap-3 flex-wrap mb-2.5">
            <div className="rounded-2xl p-2.5" style={{ background: "#FBDDE4", color: T.rosso }}>
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold" style={{ color: T.ink }}>
                {senzaLaboratorio.length === 1
                  ? "Un preparato non ha nessuno a cui chiederlo"
                  : `${senzaLaboratorio.length} preparati non hanno nessuno a cui chiederli`}
              </div>
              {/* singolare e plurale davvero, non «1 preparati»: il titolo qui
                  sopra si accorda col numero, e se la frase sotto restasse al
                  plurale sembrerebbe scritta dalla macchina */}
              <div className="text-xs" style={{ color: T.dim }}>
                {senzaLaboratorio.length === 1
                  ? "Non si compra e la sede non ha un laboratorio che lo faccia: niente ordine, niente richiesta. Resta fermo finché non gliene assegni uno."
                  : "Non si comprano e la sede non ha un laboratorio che li faccia: niente ordini, niente richieste. Restano fermi finché non gliene assegni uno."}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {senzaLaboratorio.map((x) => (
              <div key={x.mag.id + x.prod.id} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 flex-wrap"
                style={{ background: "#fff", border: `1px solid ${T.bordo}` }}>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ color: T.ink }}>{x.prod.nome}</div>
                  <div className="text-xs" style={{ color: T.tenue }}>
                    {x.sede?.nome || "sede sconosciuta"} · {x.mag.nome}
                  </div>
                </div>
                <span className="font-extrabold whitespace-nowrap" style={{ color: T.rosso }}>
                  ne mancano {fmtQ(x.manca)} {simboloU(stato, x.art.uomId)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2.5" style={{ color: T.dim }}>
            {profilo.ruolo === "admin"
              ? <>Si sistema da <b>Gestione → Sedi</b>: apri la sede e scegli quale laboratorio la
                  rifornisce. Se un laboratorio non c'è ancora, va creato prima da <b>Magazzini</b>.</>
              : <>Da segnalare a un <b>Admin</b>: si sistema da Gestione → Sedi.</>}
          </p>
        </Scheda>
      )}

      {/* ── DOV'È FINITO «DA PREPARARE» ──
          Stava qui e contava contro il livello di scorta del laboratorio — che
          in produzione vale lo stesso numero su tutti e dodici i preparati,
          cioè un valore di partenza e non una decisione. Intanto in Richieste
          ne era nato un secondo, che contava quanto manca alle LINEE. Due
          elenchi in due schermate con due regole diverse: sui dati veri uno
          diceva «da fare 2» e l'altro «niente». Due numeri diversi per la
          stessa domanda sono peggio di nessun numero, quindi ne resta uno, e
          sta dove il laboratorio lavora. */}
      {profilo.ruolo === "laboratorio" && (
        <Scheda className="p-4 mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="rounded-2xl p-2.5" style={{ background: "#E1F5FA", color: T.ciano }}>
              <FlaskConical size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold" style={{ color: T.ink }}>Cosa produrre sta in «Richieste»</div>
              <div className="text-xs" style={{ color: T.dim }}>
                Lì c'è un elenco solo, che conta quanto manca alle linee e dice se gli
                ingredienti bastano. Qui restava un secondo conto che diceva un'altra cosa.
              </div>
            </div>
          </div>
        </Scheda>
      )}

      <div className="mb-4">
        <Segmenti valore={tab} onCambia={setTab} opzioni={[
          { id: "lab", nome: `Al laboratorio · ${nLabAttesa}` },
          ...STATI_MIEI.map((st) => ({ id: st,
            nome: `${{ "da-ordinare": "Da ordinare", ordinato: "Ordinati", ricevuto: "Ricevuti" }[st]} · ${miei.filter((o) => o.stato === st).length}` })),
        ]} />
      </div>

      {profilo.ruolo === "admin" && tab === "da-ordinare" && (costoDaOrdinare.tot > 0 || costoDaOrdinare.senza > 0) && (
        <div className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 mb-3"
          style={{ background: "#F1F8F4", border: `1px solid ${T.verde}33` }}>
          <span className="rounded-xl p-2 shrink-0" style={{ background: `${T.verde}22`, color: T.verde }}>
            <Tag size={16} />
          </span>
          <span className="text-sm min-w-0" style={{ color: T.ink }}>
            {costoDaOrdinare.tot > 0
              ? <>Questo ordine costa circa <b>{fmtEuro(costoDaOrdinare.tot)}</b></>
              : <>Quanto costa non si sa ancora</>}
            {costoDaOrdinare.senza > 0 && (
              <span className="block text-xs" style={{ color: T.dim }}>
                {costoDaOrdinare.senza} righe fuori dal conto: manca il prezzo o la conversione
              </span>
            )}
          </span>
        </div>
      )}
      <div key={tab} className="sc-fade flex flex-col gap-3">
        {tab === "lab" && <RichiesteLab stato={stato} righe={richVisibili} />}
        {/* Prima di dire «non c'è niente»: se c'è qualcosa nelle altre schede va
            detto lì, con un tasto per andarci. È l'unico modo perché un vuoto non
            si legga come «i miei ordini sono spariti». */}
        {tab !== "lab" && perFornitore.length === 0 && altrove.length > 0 && (
          <div className="rounded-2xl px-3.5 py-3 mb-3" style={{ background: "#EFF4FE", border: `1.5px solid ${T.bordo}` }}>
            <div className="text-sm font-bold" style={{ color: T.ink }}>
              Qui non c'è niente, ma i tuoi ordini ci sono
            </div>
            <div className="text-xs mt-0.5" style={{ color: T.dim }}>
              {altrove.map((x) => `${x.n} ${x.n === 1 ? "riga" : "righe"} in «${ETICHETTE[x.st]}»`).join(", ")}.
              Le righe restano per {GIORNI_ORDINI} giorni.
            </div>
            <div className="flex gap-2 flex-wrap mt-2">
              {altrove.map((x) => (
                <button key={x.st} onClick={() => setTab(x.st)}
                  className="rounded-full px-3 py-2 text-xs font-extrabold"
                  style={{ background: T.blu, color: "#fff" }}>
                  Vai a «{ETICHETTE[x.st]}» · {x.n}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* e per chi non ne vede nessuno in nessuna scheda: il perché, invece di
            un vuoto muto. Un operatore non vede gli acquisti del laboratorio. */}
        {tab !== "lab" && miei.length === 0 && (stato.ordini || []).length > 0 && (
          <div className="rounded-2xl px-3.5 py-3 mb-3 text-sm"
            style={{ background: "#FFF6E8", border: "1px solid #F2DCC0", color: "#7A4A00" }}>
            Ci sono {(stato.ordini || []).length} righe d'ordine in azienda, ma nessuna riguarda
            la tua sede: {profilo.ruolo === "laboratorio"
              ? "qui vedi gli acquisti del laboratorio, non quelli delle sedi operative."
              : "qui vedi gli acquisti della tua sede, non quelli del laboratorio."}
            {" "}Non sono spariti: li vede chi li ha fatti, e un Admin li vede tutti.
          </div>
        )}
        {tab !== "lab" && perFornitore.length === 0 && (
          <Scheda><Vuoto icona={Truck}
            titolo={tab === "da-ordinare" ? "Nessun acquisto da fare" : tab === "ordinato" ? "Nessun ordine in attesa di consegna" : "Nessuna merce ricevuta"}
            testo={tab === "da-ordinare"
              ? "Le righe compaiono quando retro o laboratorio scendono sotto il livello previsto. Usa «Ricalcola fabbisogni» per rigenerarle dalle scorte."
              : tab === "ordinato"
                ? "Le righe segnate come ordinate finiranno qui, in attesa che la merce arrivi."
                : "Quando segni un ordine come ricevuto, il magazzino si carica e la riga finisce qui."} /></Scheda>
        )}

        {perFornitore.map(({ f, righe: rf }) => {
          const perCat = stato.categorie
            .map((c) => ({ c, righe: rf.filter((o) => trova(stato.prodotti, o.prodottoId)?.categoriaId === c.id) }))
            .filter((g) => g.righe.length);
          const orfane = rf.filter((o) => !trova(stato.prodotti, o.prodottoId));
          return (
            <Scheda key={f.id} className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="rounded-2xl p-2.5" style={{ background: "#FBF2E4", color: T.ambra }}><Truck size={18} /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold" style={{ color: T.ink }}>{f.nome}</div>
                  <div className="text-xs" style={{ color: T.dim }}>{rf.length} righe</div>
                </div>
                {tab === "da-ordinare" && puoOrdinare(profilo) && (
                  <Bottone variante="tonale" piccolo icona={CheckCheck}
                    onClick={() => segna(rf.map((o) => o.id))}>Tutto ordinato</Bottone>
                )}
                {tab === "ordinato" && (
                  <Bottone variante="tonale" piccolo icona={PackageCheck}
                    onClick={() => riceviTutto(rf)}>Tutto arrivato</Bottone>
                )}
              </div>

              {perCat.map(({ c, righe: rc }) => (
                <div key={c.id} className="mt-3">
                  <Chip colore={c.colore}>{c.nome}</Chip>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {rc.map((o) => {
                      const p = trova(stato.prodotti, o.prodottoId);
                      const sede = trova(stato.sedi, o.sedeId);
                      /* ── IL NUMERO DELLA SCHEDA «RICEVUTI» ──
                         Qui c'era sempre o.qty, cioe' quanto era stato ORDINATO.
                         Nelle prime due schede e' giusto: e' quello il numero che
                         serve. In «Ricevuti» no: se ne ordini 5 e ne arrivano 2,
                         l'app carica 2 in magazzino e rimette 3 da ordinare — e
                         faceva bene — ma la riga continuava a dire 5. Il numero
                         piu' visibile della schermata era l'unico sbagliato.
                         Adesso in «Ricevuti» il numero grande e' quello ARRIVATO,
                         l'unico che dice cosa c'e' davvero sullo scaffale. E la
                         differenza non sparisce: quando i due non coincidono si
                         scrive per intero quanto era stato ordinato e quanto e'
                         tornato da ordinare. Sulle righe vecchie, ricevute prima
                         che l'app registrasse la quantita' reale, qtyReale
                         restituisce l'ordinato e non cambia niente. */
                      const arrivato = qtyReale(o);
                      const manco = tab === "ricevuto" ? Math.max(0, o.qty - arrivato) : 0;
                      const menoDelPrevisto = manco > 1e-9;
                      return (
                        <div key={o.id} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 flex-wrap"
                          style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold truncate" style={{ color: T.ink }}>{p?.nome}</div>
                            <div className="text-xs" style={{ color: T.tenue }}>
                              {sede?.nome}
                              {tab === "ordinato" && o.tOrdine ? ` · ${o.ordinatoDa} · ${tempoFa(o.tOrdine)}` : ""}
                              {tab === "ricevuto" && o.tRicezione ? ` · ricevuto da ${o.ricevutoDa} · ${tempoFa(o.tRicezione)}` : ""}
                            </div>
                          </div>
                          <Chip colore={o.tipo === "lab" ? T.ciano : T.blu}>{o.tipo === "lab" ? "Lab" : "Diretto"}</Chip>
                          <span className="font-extrabold whitespace-nowrap"
                            style={{ color: menoDelPrevisto ? T.ambra : T.ink }}>
                            {fmtQ(arrivato)} {simboloU(stato, o.uomId)}
                          </span>
                          {/* erano 30×30: in cucina, con le mani bagnate, si
                              sbaglia bersaglio. Il minimo comodo è 32. */}
                          {tab === "da-ordinare" && puoOrdinare(profilo) && (
                            <button onClick={() => segna([o.id])} aria-label="Segna come ordinato"
                              className="rounded-full p-2.5 shrink-0" style={{ background: "#E4F6EE", color: T.verde }}>
                              <Check size={16} /></button>
                          )}
                          {tab === "ordinato" && (
                            <button onClick={() => setRicezione(o)} aria-label="Registra la merce arrivata"
                              title="Merce arrivata: registra la quantità reale"
                              className="rounded-full p-2.5 shrink-0" style={{ background: "#E4F6EE", color: T.verde }}>
                              <PackageCheck size={16} /></button>
                          )}
                          {puoOrdinare(profilo) && (
                            <button onClick={() => rimuovi(o.id)} aria-label="Rimuovi riga"
                              className="rounded-full p-2.5 shrink-0" style={{ background: "#FCE9EE", color: T.rosso }}>
                              <Trash2 size={16} /></button>
                          )}
                          {/* a tutta larghezza, in fondo: la riga ha gia' il
                              «vai a capo», e questa spiegazione stretta in una
                              colonna da tre parole diventava una filastrocca
                              verticale. Qui invece si legge come una frase. */}
                          {menoDelPrevisto && (
                            <div className="w-full text-xs font-bold" style={{ color: T.ambra }}>
                              ne erano stati ordinati {fmtQ(o.qty)} {simboloU(stato, o.uomId)}:
                              {" "}{fmtQ(manco)} sono tornati fra quelli da ordinare
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {orfane.length > 0 && <p className="text-xs mt-2" style={{ color: T.tenue }}>
                {orfane.length} righe con prodotto rimosso dal catalogo.</p>}
            </Scheda>
          );
        })}
      </div>

      <Foglio aperto={reportAperto} titolo="Report ordine da inviare" onChiudi={() => setReportAperto(false)} larga>
        <p className="text-sm mb-3" style={{ color: T.dim }}>
          Solo le righe «da ordinare», divise per categoria con quantità totali. Copia la categoria — o inviala su WhatsApp — e mandala al fornitore.
        </p>
        {reportCat.length === 0
          ? <Vuoto icona={ClipboardList} titolo="Niente da ordinare" testo="Nessuna riga «da ordinare» al momento." />
          : <div className="flex flex-col gap-3">
              {reportCat.map((g) => (
                <div key={g.c.id} className="rounded-2xl p-3" style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Chip colore={g.c.colore}>{g.c.nome}</Chip>
                    <div className="flex gap-2">
                      <Bottone variante="tonale" piccolo icona={Copy} onClick={() => copia(testoCat(g))}>Copia</Bottone>
                      <Bottone variante="tonale" piccolo icona={Send} onClick={() => whatsapp(testoCat(g))}>WhatsApp</Bottone>
                    </div>
                  </div>
                  <div className="text-sm" style={{ color: T.ink }}>
                    {g.items.map((i) => (
                      <div key={i.prodottoId + i.uomId} className="flex justify-between gap-3 py-0.5">
                        <span className="truncate">{trova(stato.prodotti, i.prodottoId)?.nome}</span>
                        <span className="font-bold whitespace-nowrap">{fmtQ(i.qty)} {simboloU(stato, i.uomId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-1 flex-wrap">
                <Bottone variante="tonale" icona={Copy} onClick={() => copia(testoTutto)}>Copia tutto</Bottone>
                <Bottone icona={Send} onClick={() => whatsapp(testoTutto)}>Invia su WhatsApp</Bottone>
              </div>
            </div>}
      </Foglio>
      <Foglio aperto={!!ricezione} titolo="Ricezione merce" onChiudi={() => setRicezione(null)}>
        {ricezione && <FormRicezione key={ricezione.id} stato={stato} o={ricezione} profilo={profilo}
          muta={muta} mostraToast={mostraToast} onChiudi={() => setRicezione(null)} />}
      </Foglio>
    </div>
  );
}

/* ─────────── SISTEMA · BACKUP CONDIVISIBILE ─────────── */
/* DOVE VIVE LA MEMORIA. In una chiave SUA, non dentro «scp:stato:v1». Lo
   stato del lavoro ha la coda, il confronto fra revisioni e l'annulla: e' roba
   delicata, e infilarci dentro degli appunti vorrebbe dire far passare ogni
   nota per quel macchinario e mettere a rischio le giacenze per un promemoria.
   Il prezzo, dichiarato: qui vince l'ultimo che scrive. Per degli appunti fra
   due persone va bene; per le giacenze non andrebbe, ed e' il motivo per cui
   stanno separati. */
const CHIAVE_MEM = "mem:v1";
const CHIAVE_INDICE = "scp:backup-indice";
/* ─────────── IL LISTINO (gen-5.96, solo admin) ───────────
   Le voci che il banco vede in Cassa. NON sono i prodotti del catalogo:
   una «Margherita» scala farina, mozzarella e pomodoro — la distinta ha la
   stessa forma degli ingredienti di una ricetta, ed e' la stessa idea. */
function FormVoceListino({ stato, item, muta, mostraToast, onChiudi }) {
  const [nome, setNome] = useState(item?.nome || "");
  const [gruppo, setGruppo] = useState(item?.gruppo || "");
  const [prezzo, setPrezzo] = useState(item?.prezzo != null ? String(item.prezzo) : "");
  const [aliquota, setAliquota] = useState(item?.aliquota != null ? String(item.aliquota) : "");
  const [attivo, setAttivo] = useState(item ? item.attivo !== false : true);
  const [varianti, setVarianti] = useState((item?.varianti || []).map((v) => ({ ...v, delta: String(v.delta) })));
  const [distinta, setDistinta] = useState((item?.distinta || []).map((d) => ({ ...d, qty: String(d.qty) })));

  const toccaVar = (i, campo, v) => setVarianti((xs) => xs.map((x, j) => (j === i ? { ...x, [campo]: v } : x)));
  const toccaDis = (i, campo, v) => setDistinta((xs) => xs.map((x, j) => {
    if (j !== i) return x;
    /* cambiando prodotto l'unita' vecchia puo' non esistere piu': si riparte
       dalla base del prodotto nuovo, mai da un id orfano */
    if (campo === "prodottoId") return { ...x, prodottoId: v, uomId: trova(stato.prodotti, v)?.uomBase || "" };
    return { ...x, [campo]: v };
  }));

  const salva = () => {
    if (!nome.trim()) return mostraToast("Inserisci il nome della voce", "errore");
    const nP = num(prezzo);
    if (nP == null || nP < 0) return mostraToast("Il prezzo di vendita è in euro, zero compreso (un omaggio è legittimo)", "errore");
    const nA = aliquota.trim() === "" ? undefined : num(aliquota);
    if (aliquota.trim() !== "" && (nA == null || nA < 0 || nA > 100)) return mostraToast("L'aliquota è una percentuale fra 0 e 100", "errore");
    const vOk = [];
    for (const v of varianti) {
      if (!v.nome.trim() && v.delta.trim() === "") continue;
      const d = num(v.delta) ?? 0;
      if (!v.nome.trim()) return mostraToast("Ogni variante ha un nome", "errore");
      if (nP + d < 0) return mostraToast(`«${v.nome}»: il prezzo con la variante andrebbe sotto zero`, "errore");
      vOk.push({ id: v.id || uid("va"), nome: v.nome.trim(), delta: d });
    }
    const dOk = [];
    for (const d of distinta) {
      if (!d.prodottoId && d.qty.trim() === "") continue;
      const q = num(d.qty);
      if (!d.prodottoId || q == null || q <= 0 || !d.uomId)
        return mostraToast("Ogni riga della distinta richiede prodotto, quantità e unità", "errore");
      dOk.push({ prodottoId: d.prodottoId, qty: q, uomId: d.uomId });
    }
    const dati = { nome: nome.trim(), gruppo: gruppo.trim(), prezzo: nP,
      aliquota: nA, attivo, varianti: vOk, distinta: dOk };
    /* l'id nasce QUI FUORI, come per le vendite: un uid() dentro la closure
       cambierebbe a ogni replay della coda, e la modifica successiva —
       che ha in mano l'id del primo render — cadrebbe nel vuoto in silenzio
       (trovato dalla revisione di gen-5.96) */
    const nuovoId = item ? null : uid("li");
    muta((s) => {
      if (item) Object.assign(trova(s.listino || [], item.id) || {}, dati);
      else s.listino = [...(s.listino || []), { id: nuovoId, ...dati }];
    }, `Voce di listino «${nome.trim()}» ${item ? "aggiornata" : "creata"}`);
    onChiudi();
  };

  return (<div className="flex flex-col gap-4">
    <Campo label="Nome in cassa" valore={nome} onCambia={setNome} placeholder="Es. Margherita" autoFocus />
    <div className="grid grid-cols-2 gap-3">
      <Campo label="Gruppo" valore={gruppo} onCambia={setGruppo} placeholder="Es. Pizze" />
      <Campo label="Prezzo di vendita (€)" valore={prezzo} onCambia={setPrezzo} inputMode="decimal" placeholder="Es. 8,50"
        suggerimento="IVA inclusa: è il prezzo che paga il cliente." />
    </div>
    <Campo label="Aliquota IVA % · facoltativa" valore={aliquota} onCambia={setAliquota} inputMode="decimal"
      placeholder="Es. 10" suggerimento="Solo informativa, per i totali di giornata: lo scontrino resta al registratore telematico." />
    <button type="button" onClick={() => setAttivo((v) => !v)} aria-pressed={attivo}
      className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left w-full"
      style={attivo ? { background: "#EAF0FE", border: `1.5px solid ${T.blu}` } : { background: "#F7F9FE", border: `1.5px solid ${T.bordo}` }}>
      <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
        style={{ background: attivo ? T.blu : "#fff", border: `1.5px solid ${attivo ? T.blu : T.tenue}` }}>
        {attivo && <Check size={13} color="#fff" />}
      </span>
      <span className="text-sm font-extrabold" style={{ color: T.ink }}>
        {attivo ? "In vendita: il banco la vede" : "Spenta: resta qui, il banco non la vede"}
      </span>
    </button>
    <div>
      <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Varianti <span className="font-normal" style={{ color: T.tenue }}>· cambiano solo il prezzo</span></span>
      <div className="flex flex-col gap-2">
        {varianti.map((v, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={v.nome} onChange={(e) => toccaVar(i, "nome", e.target.value)} placeholder="Es. Maxi"
              aria-label={`Nome della variante ${i + 1}`}
              className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm font-semibold" style={{ border: `1.5px solid ${T.bordo}` }} />
            <input value={v.delta} onChange={(e) => toccaVar(i, "delta", e.target.value)} placeholder="+ €" inputMode="decimal"
              aria-label={`Differenza di prezzo della variante ${i + 1}, in euro`}
              className="w-24 rounded-xl px-3 py-2.5 text-sm font-semibold" style={{ border: `1.5px solid ${T.bordo}` }} />
            <button onClick={() => setVarianti((xs) => xs.filter((_, j) => j !== i))} aria-label={`Togli variante ${v.nome || i + 1}`}
              className="rounded-full p-2 shrink-0" style={{ background: "#FCE9EE", color: T.rosso }}><X size={14} /></button>
          </div>
        ))}
        <Bottone variante="tonale" piccolo icona={Plus} onClick={() => setVarianti((xs) => [...xs, { nome: "", delta: "" }])}>Aggiungi variante</Bottone>
      </div>
    </div>
    <div>
      <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Distinta <span className="font-normal" style={{ color: T.tenue }}>· cosa esce dal magazzino a ogni vendita</span></span>
      <div className="flex flex-col gap-2">
        {distinta.map((d, i) => {
          const prod = trova(stato.prodotti, d.prodottoId);
          return (
            <div key={i} className="flex gap-2 items-center flex-wrap">
              <div className="flex-1 min-w-40"><Selettore valore={d.prodottoId} onCambia={(v) => toccaDis(i, "prodottoId", v)}
                opzioni={[...stato.prodotti].sort((a, b) => a.nome.localeCompare(b.nome, "it"))} placeholder="Prodotto…" /></div>
              <input value={d.qty} onChange={(e) => toccaDis(i, "qty", e.target.value)} placeholder="Qtà" inputMode="decimal"
                aria-label={`Quantità dell'ingrediente ${i + 1}`}
                className="w-20 rounded-xl px-3 py-2.5 text-sm font-semibold" style={{ border: `1.5px solid ${T.bordo}` }} />
              <div className="w-28">{prod
                ? <Selettore valore={d.uomId} onCambia={(v) => toccaDis(i, "uomId", v)}
                    opzioni={unitaProdotto(stato, prod).map((u) => ({ id: u.id, nome: u.simbolo }))} placeholder="UdM" />
                : <span className="text-xs" style={{ color: T.tenue }}>—</span>}</div>
              <button onClick={() => setDistinta((xs) => xs.filter((_, j) => j !== i))} aria-label={`Togli ingrediente ${prod?.nome || i + 1}`}
                className="rounded-full p-2 shrink-0" style={{ background: "#FCE9EE", color: T.rosso }}><X size={14} /></button>
            </div>
          );
        })}
        <Bottone variante="tonale" piccolo icona={Plus} onClick={() => setDistinta((xs) => [...xs, { prodottoId: "", qty: "", uomId: "" }])}>Aggiungi ingrediente</Bottone>
      </div>
      <p className="text-xs mt-1.5" style={{ color: T.tenue }}>Una voce senza distinta si vende comunque: semplicemente non scala niente.</p>
    </div>
    <PieDiPagina onChiudi={onChiudi} onSalva={salva} />
  </div>);
}

function VistaListino({ stato, muta, mostraToast }) {
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const voci = stato.listino || [];
  const gruppi = [...new Set(voci.map((v) => v.gruppo || "Senza gruppo"))].sort((a, b) => a.localeCompare(b, "it"));
  return (
    <div>
      <Intesta titolo="Listino" sotto="Quello che il banco vede in Cassa: prezzi di vendita e cosa scalano dal magazzino"
        azione={<Bottone icona={Plus} onClick={() => setModal({})}>Nuova voce</Bottone>} />
      {voci.length === 0
        ? <Scheda className="p-8"><Vuoto icona={Tag} titolo="Il listino è vuoto"
            testo="Le voci che crei qui compaiono nella Cassa di chi ha l'interruttore «Può battere in cassa»." /></Scheda>
        : gruppi.map((g) => (
          <div key={g} className="mb-4">
            <div className="text-xs font-extrabold uppercase tracking-wide mb-1.5" style={{ color: T.tenue }}>{g}</div>
            <div className="flex flex-col gap-2">
              {voci.filter((v) => (v.gruppo || "Senza gruppo") === g)
                .sort((a, b) => a.nome.localeCompare(b.nome, "it")).map((v) => (
                <Scheda key={v.id} className="p-3 flex items-center gap-3">
                  <span className="flex-1 min-w-0">
                    <span className="font-extrabold block" style={{ color: T.ink }}>{v.nome}</span>
                    <span className="text-xs flex gap-2 flex-wrap mt-0.5" style={{ color: T.dim }}>
                      <b style={{ color: T.ink }}>{fmtEuro(v.prezzo || 0)}</b>
                      {v.aliquota != null && <span>IVA {v.aliquota}%</span>}
                      {(v.varianti || []).length > 0 && <span>{v.varianti.length} variant{v.varianti.length === 1 ? "e" : "i"}</span>}
                      {(v.distinta || []).length > 0
                        ? <span>scala {v.distinta.length} prodott{v.distinta.length === 1 ? "o" : "i"}</span>
                        : <span style={{ color: T.ambra }}>non scala niente</span>}
                    </span>
                  </span>
                  {v.attivo === false && <Chip colore={T.tenue}>spenta</Chip>}
                  <button onClick={() => setModal({ item: v })} aria-label={`Modifica ${v.nome}`}
                    className="rounded-full p-2.5 shrink-0" style={{ background: "#EAF0FE", color: T.blu }}><Pencil size={14} /></button>
                  <button onClick={() => setDel(v)} aria-label={`Rimuovi ${v.nome}`}
                    className="rounded-full p-2.5 shrink-0" style={{ background: "#FCE9EE", color: T.rosso }}><Trash2 size={14} /></button>
                </Scheda>
              ))}
            </div>
          </div>
        ))}
      <Foglio aperto={!!modal} titolo={modal?.item ? "Modifica voce di listino" : "Nuova voce di listino"} onChiudi={() => setModal(null)} larga>
        {modal && <FormVoceListino stato={stato} item={modal.item} muta={muta} mostraToast={mostraToast} onChiudi={() => setModal(null)} />}
      </Foglio>
      <Conferma aperto={!!del} titolo={`Togliere «${del?.nome}» dal listino?`}
        testo="Le vendite già battute non cambiano: portano il nome e il prezzo di quando sono state fatte."
        onNo={() => setDel(null)}
        onSi={() => { muta((s) => { s.listino = (s.listino || []).filter((x) => x.id !== del.id); }, `Voce di listino «${del.nome}» rimossa`); setDel(null); }} />
    </div>
  );
}

/* ─────────── LA CASSA (gen-5.96) ───────────
   Il carrello e' stato LOCALE della vista, di proposito: e' di una persona,
   su un telefono, per un minuto — nello stato condiviso ogni tap sarebbe una
   scrittura di rete e si vedrebbe il conto dell'altra cassa. Il poll che
   aggiorna lo stato non smonta la vista, quindi il conto sopravvive ai
   refresh; cambiando schermata si azzera, ed e' sano cosi' (un conto
   fantasma che riappare dopo un'ora e' peggio). */
function VistaCassa({ stato, profilo, muta, mostraToast }) {
  const sediOp = stato.sedi.filter((x) => x.tipo === "operatore");
  const [sedeId, setSedeId] = useState(profilo.sedeId || sediOp[0]?.id || "");
  const [carrello, setCarrello] = useState([]);
  const [scelta, setScelta] = useState(null);   // voce con varianti in attesa di scelta
  const [incasso, setIncasso] = useState(false);
  const [metodo, setMetodo] = useState("contanti");

  const voci = (stato.listino || []).filter((v) => v.attivo !== false);
  const gruppi = [...new Set(voci.map((v) => v.gruppo || "Altro"))].sort((a, b) => a.localeCompare(b, "it"));
  const magCassa = magCassaDi(stato, sedeId);
  const oggi = giornoDi(Date.now());
  const giornata = (stato.giornate || []).find((x) => x.id === oggi + "|" + sedeId);
  const venditeOggi = (stato.vendite || []).filter((v) => v.sedeId === sedeId && v.giorno === oggi);

  const aggiungi = (voce, variante) => {
    const chiave = voce.id + "|" + (variante?.id || "");
    /* il prezzo si congela QUI: se domani il listino cambia, il conto gia'
       aperto non si muove da solo sotto le dita di chi batte */
    const prezzo = Math.max(0, (+voce.prezzo || 0) + (variante ? +variante.delta || 0 : 0));
    setCarrello((c) => {
      const gia = c.find((r) => r.chiave === chiave);
      if (gia) return c.map((r) => (r.chiave === chiave ? { ...r, qty: r.qty + 1 } : r));
      return [...c, { chiave, voceId: voce.id, varianteId: variante?.id,
        nome: voce.nome + (variante ? " + " + variante.nome : ""), prezzo, qty: 1,
        distinta: (voce.distinta || []).map((d) => ({ ...d })) }];
    });
    setScelta(null);
  };
  const cambia = (chiave, delta) => setCarrello((c) => c
    .map((r) => (r.chiave === chiave ? { ...r, qty: r.qty + delta } : r))
    .filter((r) => r.qty > 0));
  const totale = +carrello.reduce((a, r) => a + r.prezzo * r.qty, 0).toFixed(2);
  const sc = incasso ? calcoloScarico(stato, carrello, sedeId) : null;

  const registra = () => {
    /* un tasto nascosto non e' un permesso negato (regola di gen-5.95) */
    if (!puoCassa(profilo))
      return mostraToast("Per battere in cassa serve l'autorizzazione dell'admin (Profili)", "errore");
    if (!carrello.length) return;
    /* un tasto che non fa nulla e non dice perche' e' il peggio dei due
       mondi: senza sede operatore lo si spiega (revisione gen-5.96) */
    if (!sedeId)
      return mostraToast("La vendita ha bisogno di una sede operatore: creala da Gestione → Sedi", "errore");
    const t = Date.now();
    const scarico = calcoloScarico(stato, carrello, sedeId);
    /* TUTTO calcolato fuori da muta, id compreso: la closure viene rieseguita
       a ogni riallineamento della coda e deve restare pura su (s, dati) */
    const vendita = {
      id: uid("vn"), t, giorno: giornoDi(t), sedeId, chi: profilo.nome,
      righe: carrello.map(({ voceId, varianteId, nome, qty, prezzo }) =>
        ({ voceId, ...(varianteId ? { varianteId } : {}), nome, qty, prezzo })),
      totale, metodo, scarico: scarico.righe,
      ...(scarico.problemi.length ? { problemi: scarico.problemi } : {}),
    };
    muta((s) => applicaVendita(s, vendita), `Vendita in cassa: ${fmtEuro(totale)} (${metodo})`);
    mostraToast(`Incassato ${fmtEuro(totale)}`);
    setCarrello([]); setIncasso(false); setMetodo("contanti");
  };

  return (
    <div>
      <Intesta titolo="Cassa" sotto={!sedeId
        ? "Non c'è una sede operatore: le vendite non si possono battere"
        : magCassa
        ? `Ogni vendita scarica «${magCassa.nome}»`
        : "Questa sede non ha un magazzino: le vendite si registrano senza scarico"} />
      {profilo.ruolo === "admin" && sediOp.length > 1 && (
        <div className="mb-3"><Selettore label="Sede" valore={sedeId} onCambia={(v) => { setSedeId(v); setCarrello([]); }} opzioni={sediOp} /></div>
      )}
      {(giornata || venditeOggi.length > 0) && (
        <Scheda className="p-3.5 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold" style={{ color: T.ink }}>Oggi</span>
            <Chip colore={T.verde} pieno>{fmtEuro(giornata?.totale || 0)}</Chip>
            <span className="text-sm" style={{ color: T.dim }}>{giornata?.nVendite || 0} vendite</span>
            <span className="text-xs" style={{ color: T.tenue }}>
              contanti {fmtEuro(giornata?.metodi?.contanti || 0)} · carta {fmtEuro(giornata?.metodi?.carta || 0)}
              {(giornata?.metodi?.altro || 0) > 0 ? ` · altro ${fmtEuro(giornata.metodi.altro)}` : ""}
            </span>
          </div>
          {venditeOggi.slice(0, 8).map((v) => (
            <div key={v.id} className="flex items-center gap-2 text-xs mt-2 pt-2" style={{ borderTop: `1px solid ${T.bordo}`, color: T.dim }}>
              <span className="font-bold" style={{ color: T.tenue }}>
                {new Date(v.t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="flex-1 min-w-0 truncate">{v.righe.map((r) => `${r.qty}× ${r.nome}`).join(", ")}</span>
              {v.problemi?.length > 0 && <Chip colore={T.ambra}>da contare</Chip>}
              <b style={{ color: T.ink }}>{fmtEuro(v.totale)}</b>
            </div>
          ))}
        </Scheda>
      )}
      {voci.length === 0
        ? <Scheda className="p-8"><Vuoto icona={Store} titolo="Il listino è vuoto"
            testo="Le voci della Cassa le prepara un Admin da Gestione → Listino." /></Scheda>
        : gruppi.map((g) => (
          <div key={g} className="mb-3">
            <div className="text-xs font-extrabold uppercase tracking-wide mb-1.5" style={{ color: T.tenue }}>{g}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {voci.filter((v) => (v.gruppo || "Altro") === g)
                .sort((a, b) => a.nome.localeCompare(b.nome, "it")).map((v) => (
                <button key={v.id} aria-label={`Aggiungi ${v.nome}`}
                  onClick={() => ((v.varianti || []).length ? setScelta(v) : aggiungi(v, null))}
                  className="rounded-2xl px-3 py-3.5 text-left"
                  style={{ background: "#fff", border: `1.5px solid ${T.bordo}` }}>
                  <span className="font-extrabold block text-sm" style={{ color: T.ink }}>{v.nome}</span>
                  <span className="text-xs font-bold" style={{ color: T.blu }}>{fmtEuro(v.prezzo || 0)}
                    {(v.varianti || []).length > 0 && <span style={{ color: T.tenue }}> · varianti</span>}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      {carrello.length > 0 && (
        <Scheda className="p-3.5 mt-1">
          <div className="font-extrabold mb-2" style={{ color: T.ink }}>Il conto</div>
          <div className="flex flex-col gap-2">
            {carrello.map((r) => (
              <div key={r.chiave} className="flex items-center gap-2">
                <span className="flex-1 min-w-0 text-sm font-semibold truncate" style={{ color: T.ink }}>{r.nome}</span>
                <span className="text-xs" style={{ color: T.tenue }}>{fmtEuro(r.prezzo)}</span>
                <button onClick={() => cambia(r.chiave, -1)} aria-label={`Diminuisci ${r.nome}`}
                  className="rounded-full p-2 shrink-0" style={{ background: "#F0F3FB", color: T.dim }}><Minus size={14} /></button>
                <b className="w-6 text-center" style={{ color: T.ink }}>{r.qty}</b>
                <button onClick={() => cambia(r.chiave, +1)} aria-label={`Aumenta ${r.nome}`}
                  className="rounded-full p-2 shrink-0" style={{ background: "#EAF0FE", color: T.blu }}><Plus size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: `1.5px solid ${T.bordo}` }}>
            <button onClick={() => setCarrello([])} aria-label="Svuota il conto"
              className="text-xs font-bold" style={{ color: T.tenue }}>Svuota</button>
            <span className="flex-1 text-right font-extrabold text-lg" style={{ color: T.ink }}>Totale {fmtEuro(totale)}</span>
            <Bottone icona={CheckCheck} onClick={() => setIncasso(true)}>Incassa</Bottone>
          </div>
        </Scheda>
      )}
      <Foglio aperto={!!scelta} titolo={scelta?.nome || ""} onChiudi={() => setScelta(null)}>
        {scelta && (
          <div className="flex flex-col gap-2">
            {/* niente aria-label: il testo visibile e' gia' univoco dentro il
                foglio, e un nome accessibile diverso da quello stampato e' un
                tranello per chi ascolta (revisione gen-5.96) */}
            <button onClick={() => aggiungi(scelta, null)}
              className="rounded-2xl px-3.5 py-3 text-left font-bold" style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink }}>
              Così com'è · {fmtEuro(Math.max(0, +scelta.prezzo || 0))}
            </button>
            {(scelta.varianti || []).map((va) => (
              <button key={va.id} onClick={() => aggiungi(scelta, va)}
                className="rounded-2xl px-3.5 py-3 text-left font-bold" style={{ background: "#fff", border: `1.5px solid ${T.bordo}`, color: T.ink }}>
                {va.nome} · {fmtEuro(Math.max(0, (+scelta.prezzo || 0) + (+va.delta || 0)))}
              </button>
            ))}
          </div>
        )}
      </Foglio>
      <Foglio aperto={incasso} titolo="Incasso" onChiudi={() => setIncasso(false)}>
        <div className="flex flex-col gap-4">
          <div className="text-center font-extrabold text-3xl" style={{ color: T.ink }}>{fmtEuro(totale)}</div>
          {sc && sc.problemi.length > 0 && (
            <div className="rounded-2xl p-3 text-xs" style={{ background: "#FFF6E8", color: "#7A4A00" }}>
              <b>La vendita passa comunque, ma:</b>
              {sc.problemi.map((pr, i) => <div key={i} className="mt-1">· {pr}</div>)}
            </div>
          )}
          <div>
            <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Metodo di pagamento</span>
            <Segmenti valore={metodo} onCambia={setMetodo} opzioni={[
              { id: "contanti", nome: "Contanti" }, { id: "carta", nome: "Carta" }, { id: "altro", nome: "Altro" },
            ]} />
          </div>
          <Bottone icona={CheckCheck} onClick={registra}>Registra l'incasso</Bottone>
        </div>
      </Foglio>
    </div>
  );
}

function VistaSistema({ stato, profilo, sync, muta, mostraToast, ripristina }) {
  const [punti, setPunti] = useState(null);
  const [nota, setNota] = useState("");
  const [creaAperto, setCreaAperto] = useState(false);
  const [espJson, setEspJson] = useState(null);
  const [impAperto, setImpAperto] = useState(false);
  const [impTesto, setImpTesto] = useState("");
  const [impCatAperto, setImpCatAperto] = useState(false);
  const [impCatTesto, setImpCatTesto] = useState("");
  const [impCatRep, setImpCatRep] = useState(null);
  const [azione, setAzione] = useState(null); // {tipo:'ripristina'|'elimina', punto}
  const online = sync !== "locale";

  const caricaIndice = async () => {
    if (!online) return setPunti([]);
    try {
      const r = await window.storage.get(CHIAVE_INDICE, true);
      setPunti(r?.value ? JSON.parse(r.value) : []);
    } catch { setPunti([]); }
  };
  useEffect(() => { caricaIndice(); }, []);

  const salvaIndice = async (lista) => {
    try { await window.storage.set(CHIAVE_INDICE, JSON.stringify(lista), true); } catch {}
    setPunti(lista);
  };

  const creaPunto = async () => {
    if (!online) return;
    if ((punti?.length || 0) >= 10) return mostraToast("Massimo 10 punti: eliminane uno prima", "errore");
    const id = uid("bk");
    const meta = { id, chiave: `scp:backup:${id}`, t: Date.now(), rev: stato.rev, di: profilo.nome, nota: nota.trim() || "Punto di ripristino" };
    try {
      await window.storage.set(meta.chiave, JSON.stringify({ ...meta, dati: stato }), true);
      await salvaIndice([meta, ...(punti || [])]);
      muta(() => {}, `Punto di ripristino «${meta.nota}» creato da ${profilo.nome}`);
      mostraToast("Punto di ripristino salvato e condiviso");
    } catch { mostraToast("Salvataggio non riuscito, riprova", "errore"); }
    setNota(""); setCreaAperto(false);
  };

  const esegui = async () => {
    const { tipo, punto } = azione;
    setAzione(null);
    if (tipo === "elimina") {
      try { await window.storage.delete(punto.chiave, true); } catch {}
      await salvaIndice((punti || []).filter((p) => p.id !== punto.id));
      mostraToast("Punto eliminato");
      return;
    }
    try {
      const r = await window.storage.get(punto.chiave, true);
      const dati = r?.value ? JSON.parse(r.value)?.dati : null;
      if (!dati?.profili || !dati?.sedi) return mostraToast("Punto danneggiato o incompleto", "errore");
      await ripristina(dati, `punto «${punto.nota}»`);
    } catch { mostraToast("Ripristino non riuscito", "errore"); }
  };

  const copia = async () => {
    try { await navigator.clipboard.writeText(espJson); mostraToast("Copiato negli appunti"); }
    catch { mostraToast("Seleziona e copia manualmente il testo", "avviso"); }
  };

  const importa = async () => {
    try {
      const dati = JSON.parse(impTesto);
      if (!Array.isArray(dati?.profili) || !Array.isArray(dati?.sedi) || !Array.isArray(dati?.prodotti))
        return mostraToast("Il testo non è un backup valido di Supply Chain Pro", "errore");
      setImpAperto(false); setImpTesto("");
      await ripristina(dati, "importazione manuale");
    } catch { mostraToast("JSON non valido: controlla il testo incollato", "errore"); }
  };

  const oggiFile = () => new Date().toISOString().slice(0, 10);
  const esportaGiacenze = () => {
    const righe = [["Sede", "Magazzino", "Tipo", "Prodotto", "Categoria", "Fornitore", "UdM", "Previsto", "Quantità", "Sotto scorta"]];
    stato.magazzini.forEach((m) => m.articoli.forEach((a) => {
      const p = trova(stato.prodotti, a.prodottoId);
      righe.push([
        trova(stato.sedi, m.sedeId)?.nome, m.nome, TIPI_MAG[m.tipo]?.breve, p?.nome,
        trova(stato.categorie, p?.categoriaId)?.nome, trova(stato.fornitori, p?.fornitoreId)?.nome,
        simboloU(stato, a.uomId), numCsv(a.par), numCsv(a.qty), a.qty < a.par ? "SÌ" : "NO",
      ]);
    }));
    scaricaCsv(`giacenze-${oggiFile()}.csv`, righe);
    mostraToast("CSV giacenze scaricato");
  };
  const esportaOrdini = () => {
    const righe = [["Stato", "Tipo", "Sede", "Fornitore", "Prodotto", "Quantità", "UdM", "Creato il", "Ordinato da", "Ordinato il"]];
    stato.ordini.forEach((o) => {
      righe.push([
        o.stato, o.tipo === "lab" ? "Laboratorio" : "Diretto", trova(stato.sedi, o.sedeId)?.nome,
        trova(stato.fornitori, o.fornitoreId)?.nome, trova(stato.prodotti, o.prodottoId)?.nome,
        numCsv(o.qty), simboloU(stato, o.uomId), dataIt(o.t), o.ordinatoDa || "", o.tOrdine ? dataIt(o.tOrdine) : "",
      ]);
    });
    scaricaCsv(`ordini-${oggiFile()}.csv`, righe);
    mostraToast("CSV ordini scaricato");
  };
  const esportaMovimenti = () => {
    const righe = [["Data", "Sede", "Magazzino", "Prodotto", "Causale", "Variazione", "Saldo dopo", "UdM", "Utente", "Riferimento"]];
    (stato.movimenti || []).forEach((mv) => {
      const m = trova(stato.magazzini, mv.magId);
      righe.push([
        dataIt(mv.t), trova(stato.sedi, m?.sedeId)?.nome, m?.nome, trova(stato.prodotti, mv.prodottoId)?.nome,
        CAUSALI[mv.causale]?.nome || mv.causale, numCsv(mv.delta), numCsv(mv.dopo),
        simboloU(stato, mv.uomId), mv.chi, mv.rif || "",
      ]);
    });
    scaricaCsv(`movimenti-${oggiFile()}.csv`, righe);
    mostraToast("CSV movimenti scaricato");
  };
  const esportaCatalogo = () => {
    scaricaCsv(`catalogo-${oggiFile()}.csv`, esportaCatalogoRighe(stato));
    mostraToast("CSV catalogo scaricato");
  };
  /* le vendite hanno un tetto di 48 ore nello stato: QUESTO export e la
     tabella delle giornate sono il modo di tenerle per sempre (gen-5.96) */
  const esportaVendite = () => {
    const righe = [["Data", "Sede", "Operatore", "Voce", "Quantità", "Prezzo unitario", "Totale riga", "Metodo", "Stato", "Scontrino"]];
    (stato.vendite || []).forEach((v) => v.righe.forEach((r) => {
      righe.push([dataIt(v.t), trova(stato.sedi, v.sedeId)?.nome, v.chi, r.nome,
        numCsv(r.qty), numCsv(r.prezzo), numCsv(+(r.qty * r.prezzo).toFixed(2)), v.metodo, v.stato, v.id]);
    }));
    righe.push([]);
    righe.push(["Giornata", "Sede", "", "", "Vendite", "", "Totale", "Contanti", "Carta", "Altro"]);
    (stato.giornate || []).forEach((g) => {
      righe.push([g.giorno, trova(stato.sedi, g.sedeId)?.nome, "", "", numCsv(g.nVendite), "",
        numCsv(g.totale), numCsv(g.metodi?.contanti || 0), numCsv(g.metodi?.carta || 0), numCsv(g.metodi?.altro || 0)]);
    });
    scaricaCsv(`vendite-${oggiFile()}.csv`, righe);
    /* la finestra va DETTA dove si esporta, o l'export settimanale perde
       cinque giorni di dettaglio in silenzio (revisione gen-5.96) */
    mostraToast("CSV vendite: il dettaglio copre le ultime 48 ore, i totali di giornata 90 giorni");
  };
  const analizzaCat = () => {
    if (!impCatTesto.trim()) return mostraToast("Incolla o carica un file CSV", "errore");
    const rep = applicaCatalogoCsv(clona(stato), impCatTesto);
    setImpCatRep(rep);
    if (!rep.aggiornati && !rep.creati) mostraToast("Nessuna riga valida da importare", "errore");
  };
  const applicaCat = () => {
    if (!impCatRep) return;
    muta((s) => { applicaCatalogoCsv(s, impCatTesto); },
      `Import catalogo CSV: ${impCatRep.aggiornati} aggiornati, ${impCatRep.creati} nuovi`);
    mostraToast(`Catalogo importato · ${impCatRep.aggiornati} aggiornati, ${impCatRep.creati} nuovi`);
    setImpCatAperto(false); setImpCatTesto(""); setImpCatRep(null);
  };
  const fileCat = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { setImpCatTesto(String(reader.result || "")); setImpCatRep(null); };
    reader.readAsText(f, "utf-8");
  };

  return (
    <div>
      <Intesta titolo="Sistema" sotto="Backup condivisibili, esportazione e ripristino della rete" />

      <Scheda className="p-5 mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl p-2.5" style={{ background: "#EAF0FE", color: T.blu }}><History size={18} /></div>
            <div>
              <div className="font-extrabold" style={{ color: T.ink }}>Punti di ripristino</div>
              <div className="text-xs" style={{ color: T.tenue }}>Condivisi con tutti gli utenti · max 10</div>
            </div>
          </div>
          <Bottone icona={Save} onClick={() => setCreaAperto(true)} disabilitato={!online}>Crea punto</Bottone>
        </div>
        {!online && <p className="text-sm" style={{ color: T.ambra }}>
          Archiviazione condivisa non disponibile in questa sessione: usa Esporta/Importa qui sotto.</p>}
        {online && punti === null && <p className="text-sm" style={{ color: T.tenue }}>Caricamento…</p>}
        {online && punti?.length === 0 && <p className="text-sm" style={{ color: T.tenue }}>
          Nessun punto ancora: creane uno prima di modifiche importanti.</p>}
        <div className="flex flex-col gap-2">
          {(punti || []).map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 flex-wrap"
              style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate" style={{ color: T.ink }}>{p.nota}</div>
                <div className="text-xs" style={{ color: T.tenue }}>{p.di} · {tempoFa(p.t)}</div>
              </div>
              <Bottone variante="tonale" piccolo icona={RotateCcw}
                onClick={() => setAzione({ tipo: "ripristina", punto: p })}>Ripristina</Bottone>
              <button onClick={() => setAzione({ tipo: "elimina", punto: p })} aria-label="Elimina punto"
                className="rounded-full p-2.5" style={{ background: "#FCE9EE", color: T.rosso }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </Scheda>

      <Scheda className="p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="rounded-2xl p-2.5" style={{ background: "#F1EDFE", color: T.viola }}><Database size={18} /></div>
          <div>
            <div className="font-extrabold" style={{ color: T.ink }}>Esporta e importa</div>
            <div className="text-xs" style={{ color: T.tenue }}>Backup testuale da conservare o condividere fuori dall'app</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Bottone variante="tonale" icona={Download} onClick={() => setEspJson(JSON.stringify(stato, null, 2))}>Esporta JSON</Bottone>
          <Bottone variante="fantasma" icona={Upload} onClick={() => setImpAperto(true)}>Importa JSON</Bottone>
        </div>
      </Scheda>

      <Scheda className="p-5 mt-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="rounded-2xl p-2.5" style={{ background: "#E4F6EE", color: T.verde }}><FileSpreadsheet size={18} /></div>
          <div>
            <div className="font-extrabold" style={{ color: T.ink }}>Esporta CSV</div>
            <div className="text-xs" style={{ color: T.tenue }}>File apribili in Excel o Fogli Google · separatore «;» e decimali con virgola</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Bottone variante="tonale" piccolo icona={Boxes} onClick={esportaGiacenze}>Giacenze</Bottone>
          <Bottone variante="tonale" piccolo icona={Truck} onClick={esportaOrdini}>Ordini</Bottone>
          <Bottone variante="tonale" piccolo icona={History} onClick={esportaMovimenti}>Movimenti</Bottone>
          <Bottone variante="tonale" piccolo icona={Tag} onClick={esportaVendite}>Vendite</Bottone>
        </div>
      </Scheda>

      <Scheda className="p-5 mt-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="rounded-2xl p-2.5" style={{ background: "#EAF0FE", color: T.blu }}><Package size={18} /></div>
          <div>
            <div className="font-extrabold" style={{ color: T.ink }}>Catalogo prodotti (CSV)</div>
            <div className="text-xs" style={{ color: T.tenue }}>Esporta i {stato.prodotti.length} prodotti, correggi in Excel (fornitori, conversioni, prezzi) e re-importa. L'import aggiorna per ID e non elimina nulla.</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Bottone variante="tonale" icona={Download} onClick={esportaCatalogo}>Esporta catalogo</Bottone>
          <Bottone variante="fantasma" icona={Upload} onClick={() => { setImpCatAperto(true); setImpCatTesto(""); setImpCatRep(null); }}>Importa catalogo</Bottone>
        </div>
      </Scheda>

      <Foglio aperto={creaAperto} titolo="Nuovo punto di ripristino" onChiudi={() => setCreaAperto(false)}>
        <div className="flex flex-col gap-4">
          <Campo label="Nota (facoltativa)" valore={nota} onCambia={setNota}
            placeholder="Es. Prima dell'inventario di luglio" autoFocus />
          <PieDiPagina onChiudi={() => setCreaAperto(false)} onSalva={creaPunto} testo="Crea punto" />
        </div>
      </Foglio>

      <Foglio aperto={espJson !== null} titolo="Backup esportato" onChiudi={() => setEspJson(null)} larga>
        <p className="text-sm mb-2" style={{ color: T.dim }}>Copia e conserva questo testo: contiene l'intera rete.</p>
        <textarea readOnly value={espJson || ""} onFocus={(e) => e.target.select()}
          className="w-full rounded-2xl p-3 text-xs sc-scroll" rows={12}
          style={{ background: "#0F1730", color: "#CFE0FF", border: `1px solid ${T.bordo}`, fontFamily: "monospace" }} />
        <div className="flex justify-end mt-3">
          <Bottone icona={Copy} onClick={copia}>Copia tutto</Bottone>
        </div>
      </Foglio>

      <Foglio aperto={impAperto} titolo="Importa backup" onChiudi={() => setImpAperto(false)} larga>
        <p className="text-sm mb-2" style={{ color: T.dim }}>
          Incolla un backup esportato: <b>sostituirà i dati per tutta la rete</b>.
        </p>
        <textarea value={impTesto} onChange={(e) => setImpTesto(e.target.value)} placeholder='{"rev":…}'
          className="w-full rounded-2xl p-3 text-xs sc-scroll" rows={10}
          style={{ background: "#F6F8FE", color: T.ink, border: `1.5px solid ${T.bordo}`, fontFamily: "monospace" }} />
        <div className="flex gap-2 justify-end mt-3">
          <Bottone variante="fantasma" onClick={() => setImpAperto(false)}>Annulla</Bottone>
          <Bottone icona={Upload} onClick={importa} disabilitato={!impTesto.trim()}>Ripristina dati</Bottone>
        </div>
      </Foglio>

      <Foglio aperto={impCatAperto} titolo="Importa catalogo CSV" onChiudi={() => setImpCatAperto(false)} larga>
        <p className="text-sm mb-2" style={{ color: T.dim }}>
          Incolla o carica un CSV del catalogo (stesso formato dell'export). Prima di applicare vedi un'<b>anteprima</b>. L'import <b>non elimina</b> prodotti: aggiorna quelli esistenti (per ID o nome) e aggiunge i nuovi.
        </p>
        <label className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 mb-2 text-sm font-bold cursor-pointer"
          style={{ background: "#EAF0FE", color: T.blu }}>
          <Upload size={15} /> Carica file
          <input type="file" accept=".csv,text/csv" onChange={fileCat} className="hidden" />
        </label>
        <textarea value={impCatTesto} onChange={(e) => { setImpCatTesto(e.target.value); setImpCatRep(null); }}
          placeholder="ID;Nome;Categoria;Fornitore;UdM base;Prezzo;Conversioni;…"
          className="w-full rounded-2xl p-3 text-xs sc-scroll" rows={8}
          style={{ background: "#F6F8FE", color: T.ink, border: `1.5px solid ${T.bordo}`, fontFamily: "monospace" }} />
        {impCatRep && (
          <div className="rounded-2xl p-3 mt-3 text-sm" style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
            <div className="font-bold mb-1" style={{ color: T.ink }}>Anteprima</div>
            <div style={{ color: T.dim }}>
              <span style={{ color: T.verde, fontWeight: 800 }}>{impCatRep.creati}</span> nuovi ·{" "}
              <span style={{ color: T.blu, fontWeight: 800 }}>{impCatRep.aggiornati}</span> aggiornati
            </div>
            {impCatRep.catNuove.length > 0 && <div className="text-xs mt-1" style={{ color: T.dim }}>Nuove categorie: {impCatRep.catNuove.join(", ")}</div>}
            {impCatRep.fornNuovi.length > 0 && <div className="text-xs mt-1" style={{ color: T.dim }}>Nuovi fornitori: {impCatRep.fornNuovi.join(", ")}</div>}
            {impCatRep.unitaNuove.length > 0 && <div className="text-xs mt-1" style={{ color: T.dim }}>Nuove unità: {impCatRep.unitaNuove.join(", ")}</div>}
            {/* Dire cosa il file NON contiene conta più che dire cosa contiene:
                è l'unica informazione che permette di accorgersi di aver
                caricato il file sbagliato PRIMA di premere Applica. */}
            {impCatRep.aggiornati > 0 && impCatRep.nonToccati?.length > 0 && (
              <div className="text-xs mt-2 rounded-xl px-2.5 py-2"
                style={{ background: "#EFF7F3", border: "1px solid #CFEADD", color: T.ink }}>
                Il file non porta <b>{impCatRep.nonToccati.join(", ")}</b>: sui prodotti che
                esistono già <b>queste cose restano come sono</b>, non vengono azzerate.
              </div>
            )}
            {impCatRep.errori.length > 0 && <div className="text-xs mt-1" style={{ color: T.ambra }}>{impCatRep.errori.length} avvisi · {impCatRep.errori.slice(0, 4).join(" · ")}</div>}
          </div>
        )}
        <div className="flex gap-2 justify-end mt-3">
          <Bottone variante="fantasma" onClick={() => setImpCatAperto(false)}>Annulla</Bottone>
          {!impCatRep
            ? <Bottone icona={Search} onClick={analizzaCat} disabilitato={!impCatTesto.trim()}>Analizza</Bottone>
            : <Bottone icona={Check} onClick={applicaCat} disabilitato={!impCatRep.aggiornati && !impCatRep.creati}>Applica ({impCatRep.aggiornati + impCatRep.creati})</Bottone>}
        </div>
      </Foglio>

      <Conferma aperto={!!azione} onNo={() => setAzione(null)} onSi={esegui}
        titolo={azione?.tipo === "ripristina" ? `Ripristinare «${azione?.punto.nota}»?` : `Eliminare «${azione?.punto.nota}»?`}
        testo={azione?.tipo === "ripristina"
          ? "Lo stato attuale sarà sostituito per tutti gli utenti. Crea prima un punto se vuoi poter tornare indietro."
          : "Il punto di ripristino sarà eliminato per tutti."}
        testoSi={azione?.tipo === "ripristina" ? "Ripristina" : "Elimina"} />
    </div>
  );
}

/* ═══════════════ ACCESSI SU INVITO (v1.0 ufficiale) ═══════════════ */
const ALFA_CODICE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const genCodice = (s) => {
  let c;
  do { c = Array.from({ length: 6 }, () => ALFA_CODICE[Math.floor(Math.random() * ALFA_CODICE.length)]).join(""); }
  while ((s.codici || []).some((x) => x.codice === c && x.stato === "attivo"));
  return c;
};
const fmtCodice = (c) => `${c.slice(0, 3)}-${c.slice(3)}`;
const normCodice = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");

function FormCodice({ stato, profilo, richiesta, muta, mostraToast, onChiudi, onCreato }) {
  const [ruolo, setRuolo] = useState("operatore");
  const [sedeId, setSedeId] = useState("");
  const [magIds, setMagIds] = useState([]);
  const [nota, setNota] = useState(richiesta ? `Per ${richiesta.nome}` : "");
  const sediOk = stato.sedi.filter((s) => (ruolo === "laboratorio" ? s.tipo === "laboratorio" : s.tipo === "operatore"));
  const lineeSede = stato.magazzini.filter((m) => m.sedeId === sedeId && m.tipo.startsWith("linea"));

  const genera = () => {
    if (ruolo !== "admin" && !sedeId) return mostraToast("Seleziona la sede per il nuovo utente", "errore");
    const codice = genCodice(stato);
    const id = uid("cod");
    muta((s) => {
      s.codici = [{
        id, codice, t: Date.now(), di: profilo.nome, ruolo,
        sedeId: ruolo === "admin" ? undefined : sedeId,
        magazziniIds: ruolo === "operatore" ? magIds : undefined,
        nota: nota.trim(), stato: "attivo", perRichiestaId: richiesta?.id,
      }, ...(s.codici || [])];
      if (richiesta) {
        const a = trova(s.accessi, richiesta.id);
        if (a) { a.stato = "approvata"; a.codiceId = id; a.gestitaDa = profilo.nome; a.tGestione = Date.now(); }
      }
    }, `Codice di accesso generato da ${profilo.nome}${richiesta ? ` per «${richiesta.nome}»` : ""}`);
    onCreato({ codice, nome: richiesta?.nome, daRichiesta: !!richiesta });
  };

  return (
    <div className="flex flex-col gap-4">
      {richiesta && (
        <div className="rounded-2xl px-3.5 py-3 text-sm" style={{ background: "#EFF4FE", color: T.ink }}>
          Stai approvando <b>{richiesta.nome}</b>{richiesta.messaggio ? <> · «{richiesta.messaggio}»</> : ""} · {tempoFa(richiesta.t)}
        </div>
      )}
      <div>
        <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Ruolo del nuovo utente</span>
        <Segmenti valore={ruolo} onCambia={(r) => { setRuolo(r); setSedeId(""); setMagIds([]); }} opzioni={[
          { id: "operatore", nome: "Operatore" }, { id: "laboratorio", nome: "Laboratorio" }, { id: "admin", nome: "Admin" },
        ]} />
      </div>
      {ruolo !== "admin" && (
        sediOk.length
          ? <Selettore label={ruolo === "laboratorio" ? "Sede laboratorio" : "Sede operatore"}
              valore={sedeId} onCambia={(v) => { setSedeId(v); setMagIds([]); }} opzioni={sediOk} />
          : <p className="text-sm font-semibold" style={{ color: T.ambra }}>Nessuna sede di questo tipo: creala prima da «Sedi».</p>
      )}
      {ruolo === "operatore" && sedeId && lineeSede.length > 0 && (
        <div>
          <span className="block text-sm font-bold mb-1.5" style={{ color: T.ink }}>Magazzini linea assegnati</span>
          <div className="flex flex-wrap gap-2">
            {lineeSede.map((m) => {
              const sel = magIds.includes(m.id);
              return (
                <button key={m.id} onClick={() => setMagIds((v) => (sel ? v.filter((x) => x !== m.id) : [...v, m.id]))}
                  className="rounded-full px-3.5 py-2 text-sm font-bold flex items-center gap-1.5"
                  style={sel ? { background: T.grad, color: "#fff" }
                    : { background: "#F0F3FB", color: T.dim, border: `1px solid ${T.bordo}` }}>
                  {sel && <Check size={13} />}{m.nome}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <Campo label="Nota (facoltativa)" valore={nota} onCambia={setNota} placeholder="Es. Nuovo operatore turno sera" />
      <PieDiPagina onChiudi={onChiudi} onSalva={genera} testo="Genera codice" />
    </div>
  );
}

function VistaAccessi({ stato, profilo, muta, mostraToast }) {
  const [form, setForm] = useState(null);      // {richiesta?}
  const [nuovo, setNuovo] = useState(null);    // codice appena creato
  const [revoca, setRevoca] = useState(null);
  const [rifiuta, setRifiuta] = useState(null);

  const attese = (stato.accessi || []).filter((a) => a.stato === "in-attesa");
  const gestite = (stato.accessi || []).filter((a) => a.stato !== "in-attesa").slice(0, 6);
  const attivi = (stato.codici || []).filter((c) => c.stato === "attivo");
  const usati = (stato.codici || []).filter((c) => c.stato !== "attivo").slice(0, 8);

  const copiaCodice = async (c) => {
    try { await navigator.clipboard.writeText(fmtCodice(c)); mostraToast("Codice copiato negli appunti"); }
    catch { mostraToast(`Codice: ${fmtCodice(c)}`, "avviso"); }
  };

  return (
    <div>
      <Intesta titolo="Accessi" sotto="Chi può entrare lo decidi tu: codici univoci e verifica dei richiedenti"
        azione={<Bottone icona={KeyRound} onClick={() => setForm({})}>Genera codice</Bottone>} />

      {/* richieste di primo accesso */}
      <Scheda className="p-5 mb-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="rounded-2xl p-2.5" style={{ background: "#EAF0FE", color: T.blu }}><UserPlus size={18} /></div>
          <div>
            <div className="font-extrabold" style={{ color: T.ink }}>Richieste di primo accesso</div>
            <div className="text-xs" style={{ color: T.tenue }}>Dati di chi sta provando a connettersi, in tempo reale</div>
          </div>
          {attese.length > 0 && <Chip colore={T.rosso}>{attese.length} in attesa</Chip>}
        </div>
        {attese.length === 0 && <p className="text-sm" style={{ color: T.tenue }}>
          Nessuna richiesta: quando qualcuno apre il link e chiede l'accesso, comparirà qui con nome e messaggio.</p>}
        <div className="flex flex-col gap-2">
          {attese.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl px-3.5 py-3 flex-wrap"
              style={{ background: "#FFF9EF", border: "1px solid #F3E3C3" }}>
              <Avatar nome={a.nome} colore={T.ambra} size={38} />
              <div className="flex-1 min-w-0">
                <div className="font-extrabold truncate" style={{ color: T.ink }}>{a.nome}</div>
                <div className="text-xs truncate" style={{ color: T.dim }}>
                  {a.messaggio || "Nessun messaggio"} · {tempoFa(a.t)}
                </div>
              </div>
              <Bottone piccolo icona={Check} onClick={() => setForm({ richiesta: a })}>Approva</Bottone>
              <Bottone variante="pericolo" piccolo icona={X} onClick={() => setRifiuta(a)}>Rifiuta</Bottone>
            </div>
          ))}
        </div>
        {gestite.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {gestite.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-xs" style={{ color: T.tenue }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                  background: a.stato === "rifiutata" ? T.rosso : a.stato === "completata" ? T.verde : T.blu }} />
                <span className="truncate">{a.nome} · {a.stato} · {a.gestitaDa || "—"} · {tempoFa(a.tGestione || a.t)}</span>
              </div>
            ))}
          </div>
        )}
      </Scheda>

      {/* codici attivi */}
      <Scheda className="p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="rounded-2xl p-2.5" style={{ background: "#F1EDFE", color: T.viola }}><KeyRound size={18} /></div>
          <div>
            <div className="font-extrabold" style={{ color: T.ink }}>Codici di invito attivi</div>
            <div className="text-xs" style={{ color: T.tenue }}>Ogni codice vale per una sola registrazione</div>
          </div>
        </div>
        {attivi.length === 0 && <p className="text-sm" style={{ color: T.tenue }}>
          Nessun codice attivo: generane uno per invitare un nuovo utente.</p>}
        <div className="flex flex-col gap-2">
          {attivi.map((c) => {
            const R = RUOLI[c.ruolo];
            return (
              <div key={c.id} className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 flex-wrap"
                style={{ background: "#F7F9FE", border: `1px solid ${T.bordo}` }}>
                <span className="font-extrabold text-lg tracking-widest" style={{ color: T.ink, fontFamily: "monospace" }}>
                  {fmtCodice(c.codice)}
                </span>
                <Chip colore={R.colore}><R.icona size={12} /> {R.nome}</Chip>
                {c.sedeId && <Chip colore={T.dim}>{trova(stato.sedi, c.sedeId)?.nome}</Chip>}
                <div className="flex-1 min-w-0 text-xs truncate" style={{ color: T.tenue }}>
                  {c.nota || "—"} · {c.di} · {tempoFa(c.t)}
                </div>
                <button onClick={() => copiaCodice(c.codice)} aria-label="Copia codice"
                  className="rounded-full p-2.5" style={{ background: "#EAF0FE", color: T.blu }}><Copy size={14} /></button>
                <button onClick={() => setRevoca(c)} aria-label="Revoca codice"
                  className="rounded-full p-2.5" style={{ background: "#FCE9EE", color: T.rosso }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
        {usati.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {usati.map((c) => (
              <div key={c.id} className="text-xs" style={{ color: T.tenue }}>
                <s>{fmtCodice(c.codice)}</s> · usato da <b>{c.usatoDa}</b> · {tempoFa(c.tUso || c.t)}
              </div>
            ))}
          </div>
        )}
      </Scheda>

      <Foglio aperto={!!form} titolo={form?.richiesta ? "Approva richiesta" : "Nuovo codice di invito"} onChiudi={() => setForm(null)}>
        {form && <FormCodice key={form.richiesta?.id || "n"} stato={stato} profilo={profilo}
          richiesta={form.richiesta} muta={muta} mostraToast={mostraToast}
          onChiudi={() => setForm(null)} onCreato={(n) => { setForm(null); setNuovo(n); }} />}
      </Foglio>

      <Foglio aperto={!!nuovo} titolo="Codice generato" onChiudi={() => setNuovo(null)}>
        {nuovo && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-3xl px-8 py-5 text-3xl font-extrabold tracking-widest"
              style={{ background: T.grad, color: "#fff", fontFamily: "monospace" }}>
              {fmtCodice(nuovo.codice)}
            </div>
            <p className="text-sm max-w-sm" style={{ color: T.dim }}>
              {nuovo.daRichiesta
                ? <>Il codice apparirà automaticamente sulla schermata di <b>{nuovo.nome}</b>, ma puoi anche comunicarglielo tu.</>
                : <>Comunica questo codice al nuovo utente: lo inserirà al primo accesso insieme al suo nome e a un PIN.</>}
            </p>
            <div className="flex gap-2">
              <Bottone variante="tonale" icona={Copy} onClick={() => copiaCodice(nuovo.codice)}>Copia</Bottone>
              <Bottone icona={Check} onClick={() => setNuovo(null)}>Fatto</Bottone>
            </div>
          </div>
        )}
      </Foglio>

      <Conferma aperto={!!revoca} titolo={`Revocare ${revoca ? fmtCodice(revoca.codice) : ""}?`}
        testo="Il codice non sarà più utilizzabile. Se era legato a una richiesta, tornerà in attesa."
        onNo={() => setRevoca(null)} testoSi="Revoca"
        onSi={() => {
          muta((s) => {
            s.codici = (s.codici || []).filter((x) => x.id !== revoca.id);
            if (revoca.perRichiestaId) {
              const a = trova(s.accessi, revoca.perRichiestaId);
              if (a && a.stato === "approvata") { a.stato = "in-attesa"; a.codiceId = undefined; }
            }
          }, `Codice ${fmtCodice(revoca.codice)} revocato da ${profilo.nome}`);
          setRevoca(null);
        }} />
      <Conferma aperto={!!rifiuta} titolo={`Rifiutare «${rifiuta?.nome}»?`}
        testo="Il richiedente vedrà che l'accesso non è stato concesso."
        onNo={() => setRifiuta(null)} testoSi="Rifiuta"
        onSi={() => {
          muta((s) => {
            const a = trova(s.accessi, rifiuta.id);
            if (a) { a.stato = "rifiutata"; a.gestitaDa = profilo.nome; a.tGestione = Date.now(); }
          }, `Richiesta di «${rifiuta.nome}» rifiutata`);
          setRifiuta(null);
        }} />
    </div>
  );
}

/* ─────────── GEN 4 · ANALISI (dashboard admin) ─────────── */
function BarreVerticali({ dati, altezza = 120 }) {
  const max = Math.max(1, ...dati.map((d) => d.val));
  const larg = 100 / dati.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${altezza}`} preserveAspectRatio="none" className="w-full" style={{ height: altezza }} aria-hidden>
        {dati.map((d, i) => {
          const h = (d.val / max) * (altezza - 8);
          return <rect key={i} x={i * larg + larg * 0.18} y={altezza - h} width={larg * 0.64}
            height={Math.max(h, d.val > 0 ? 2 : 0)} rx="2" fill={d.colore || T.blu} opacity="0.9" />;
        })}
      </svg>
      {/* Quattordici date da cinque caratteri in 280px non ci stanno: si
          accavallavano e le ultime uscivano dallo schermo. Se ne mostra una
          ogni tre giorni; la prima resta a sinistra e l'ultima a destra, così
          il periodo si legge lo stesso e niente sborda mai. */}
      <div className="flex justify-between px-0.5 mt-0.5" style={{ fontSize: 9, color: T.tenue, fontWeight: 700 }}>
        {dati.filter((_, i) => i === dati.length - 1 || i % Math.ceil(dati.length / 5) === 0)
          .map((d, i) => <span key={i} style={{ whiteSpace: "nowrap" }}>{d.label}</span>)}
      </div>
    </div>
  );
}
function BarraOrizzontale({ label, val, max, colore, unita }) {
  const pct = max > 0 ? Math.min(100, Math.round((val / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold mb-1">
        <span className="truncate" style={{ color: T.ink }}>{label}</span>
        <span className="shrink-0 ml-2" style={{ color: T.dim }}>{fmtQ(val)}{unita ? ` ${unita}` : ""}</span>
      </div>
      <div className="rounded-full h-2.5 w-full" style={{ background: "#EAEFF9" }}>
        <div className="rounded-full h-2.5" style={{ width: `${pct}%`, background: colore, transition: "width .5s ease" }} />
      </div>
    </div>
  );
}

/* ─────────── SOGLIE CONSIGLIATE ───────────
   Per ogni articolo si guarda quanto è uscito davvero, giorno della settimana
   per giorno della settimana. Serve almeno che quel giorno si sia ripetuto due
   volte: un solo sabato non fa una regola, e l'app in quel caso tace. */
function soglieConsigliate(stato, giorniIndietro = SETT_USCITE) {
  const da = Date.now() - giorniIndietro * 86400000;
  const acc = {};
  for (const m of stato.movimenti || []) {
    if (m.t < da || !USCITE_STORICO.has(m.causale) || m.delta >= 0) continue;
    const dt = new Date(m.t), g = String(dt.getDay());
    const k = m.magId + "|" + m.prodottoId + "|" + g;
    if (!acc[k]) acc[k] = { tot: 0, date: new Set() };
    acc[k].tot += -m.delta;
    acc[k].date.add(dt.toDateString());
  }
  const out = [];
  for (const mg of stato.magazzini) for (const a of mg.articoli) {
    for (const [g] of GIORNI) {
      const v = acc[mg.id + "|" + a.prodottoId + "|" + g];
      if (!v || v.date.size < 2) continue;
      const medio = v.tot / v.date.size;
      const grezzo = medio * 1.15;                 /* un filo di margine sul consumo medio */
      const attuale = parGiorno(a, g) || 0;
      /* si apre bocca solo quando il livello è davvero fuori misura: o ne esce
         piu' di quanto se ne tiene (quel giorno si resta a secco), o se ne tiene
         molto piu' del necessario. In mezzo il livello va bene com'e', e senza
         questo controllo il margine del 15% farebbe salire le soglie all'infinito. */
      if (medio <= attuale && medio >= attuale * 0.6) continue;
      const proposto = eIntero(attuale)
        ? Math.max(1, Math.ceil(grezzo - 1e-9))
        : Math.max(0.1, Math.round(grezzo * 10) / 10);
      /* e comunque solo se la differenza si nota */
      if (Math.abs(proposto - attuale) < Math.max(1, attuale * 0.15)) continue;
      out.push({ mag: mg, art: a, prod: trova(stato.prodotti, a.prodottoId),
        g, attuale, proposto, medio, volte: v.date.size });
    }
  }
  return out.sort((x, y) => Math.abs(y.proposto - y.attuale) - Math.abs(x.proposto - x.attuale));
}

function SoglieConsigliate({ stato, muta, mostraToast, modificabile }) {
  const [apri, setApri] = useState(false);
  const lista = soglieConsigliate(stato);
  if (!lista.length) return null;
  const applica = (righe, etichetta) => {
    muta((s) => {
      for (const r of righe) {
        const mg = trova(s.magazzini, r.mag.id);
        const a = mg?.articoli.find((x) => x.prodottoId === r.art.prodottoId);
        if (!a) continue;
        a.parGiorni = { ...(a.parGiorni || {}) };
        a.parGiorni[r.g] = r.proposto;
      }
    }, etichetta);
    mostraToast(righe.length === 1 ? "Soglia aggiornata" : `${righe.length} soglie aggiornate`);
  };
  const viste = apri ? lista : lista.slice(0, 5);
  return (
    <Scheda className="p-4 mt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-extrabold" style={{ color: T.ink }}>Soglie consigliate</div>
          <div className="text-xs" style={{ color: T.tenue }}>
            Dai consumi veri delle ultime otto settimane, giorno per giorno
          </div>
        </div>
        {modificabile && lista.length > 1 && (
          <Bottone piccolo variante="tonale" icona={Check}
            onClick={() => applica(lista, `Applicate ${lista.length} soglie consigliate`)}>Applica tutte</Bottone>
        )}
      </div>
      <div className="flex flex-col gap-2 mt-3">
        {viste.map((r) => {
          const sym = simboloU(stato, r.art.uomId);
          const su = r.proposto > r.attuale;
          return (
            <div key={r.mag.id + r.art.prodottoId + r.g}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ background: "#F7F9FE" }}>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate" style={{ color: T.ink }}>{r.prod?.nome || "—"}</div>
                <div className="text-xs truncate" style={{ color: T.tenue }}>
                  {r.mag.nome} · {NOMI_GIORNI[r.g]} · ne escono {fmtQ(r.medio)} {sym} in media, su {r.volte} volte
                </div>
              </div>
              <div className="shrink-0 text-right leading-tight">
                <span className="text-sm font-bold" style={{ color: T.tenue }}>{fmtQ(r.attuale)} → </span>
                <span className="text-base font-extrabold" style={{ color: su ? T.ambra : T.verde }}>
                  {fmtQ(r.proposto)}</span>
                <span className="block text-xs" style={{ color: T.tenue }}>{sym}</span>
              </div>
              {modificabile && (
                <Bottone piccolo variante="tonale" onClick={() => applica([r],
                  `Soglia di «${r.prod?.nome}» il ${NOMI_GIORNI[r.g]}: ${fmtQ(r.attuale)} → ${fmtQ(r.proposto)}`)}>Applica</Bottone>
              )}
            </div>
          );
        })}
      </div>
      {lista.length > 5 && (
        <button onClick={() => setApri((v) => !v)} className="text-sm font-bold mt-3" style={{ color: T.blu }}>
          {apri ? "Mostra solo le prime cinque" : `Vedi tutte e ${lista.length}`}
        </button>
      )}
    </Scheda>
  );
}

function VistaAnalisi({ stato, muta, mostraToast, profilo }) {
  const GIORNI = 14;
  const inizioGiorno = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const oggi0 = inizioGiorno(Date.now());
  const giorni = Array.from({ length: GIORNI }, (_, i) => oggi0 - (GIORNI - 1 - i) * 86400000);
  const etichetta = (t) => new Date(t).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });

  const movs = stato.movimenti || [];
  const movGiorno = giorni.map((g) => ({ label: etichetta(g), val: movs.filter((m) => inizioGiorno(m.t) === g).length, colore: T.blu }));
  const richGiorno = giorni.map((g) => ({ label: etichetta(g), val: stato.richieste.filter((r) => inizioGiorno(r.t) === g).length, colore: T.ciano }));

  const copSedi = stato.sedi.map((sede) => {
    const arts = stato.magazzini.filter((m) => m.sedeId === sede.id).flatMap((m) => m.articoli);
    const ok = arts.filter((a) => a.qty >= parOggi(a)).length;
    return { sede, pct: arts.length ? Math.round((ok / arts.length) * 100) : null, vuota: !arts.length };
  });

  const contaProd = {};
  movs.forEach((m) => { contaProd[m.prodottoId] = (contaProd[m.prodottoId] || 0) + 1; });
  const topProd = Object.entries(contaProd)
    .map(([id, n]) => ({ p: trova(stato.prodotti, id), n })).filter((x) => x.p)
    .sort((a, b) => b.n - a.n).slice(0, 5);

  const ordAperti = stato.ordini.filter((o) => o.stato === "da-ordinare");
  const perForn = stato.fornitori
    .map((f) => ({ f, n: ordAperti.filter((o) => o.fornitoreId === f.id).length }))
    .filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 5);

  /* il valore di tutta la rete, con il conto di quello che non si è potuto
     calcolare: senza prezzi «€ 0,00» sarebbe una bugia gentile */
  const vRete = valoreRete(stato, stato.magazzini);
  const artTot = stato.magazzini.reduce((s, m) => s + m.articoli.length, 0);
  const artOk = stato.magazzini.reduce((s, m) => s + m.articoli.filter((a) => a.qty >= parOggi(a)).length, 0);
  const sett = Date.now() - 7 * 86400000;
  const evase7 = stato.richieste.filter((r) => (r.stato === "evasa" || r.stato === "parziale") && (r.tEvasione || r.t) >= sett).length;
  const mov7 = movs.filter((m) => m.t >= sett).length;
  const scarti = movs.filter((m) => m.causale === "scarto");
  const scarti7 = scarti.filter((m) => m.t >= sett);

  /* Previsione fabbisogni: media mobile del consumo registrato per articolo.
     Consumo = uscite (conteggi in calo, prelievi, evasioni, scarti) nella
     finestra; copertura = giacenza / consumo al giorno. */
  const ORIZZONTE = 28;
  const finestraMs = Date.now() - ORIZZONTE * 86400000;
  const USO_PREV = new Set(["conteggio", "prelievo", "evasione", "scarto"]);
  const movPrev = movs.filter((m) => m.t >= finestraMs && USO_PREV.has(m.causale));
  const primoT = movPrev.length ? Math.min(...movPrev.map((m) => m.t)) : Date.now();
  const giorniStorico = Math.max(1, Math.min(ORIZZONTE, Math.round((Date.now() - primoT) / 86400000)));
  const prevArt = [];
  stato.magazzini.forEach((mg) => mg.articoli.forEach((a) => {
    const uscito = movPrev.filter((m) => m.magId === mg.id && m.prodottoId === a.prodottoId)
      .reduce((s, m) => s + Math.max(0, -m.delta), 0);
    if (uscito <= 1e-9) return;
    const consumoGg = uscito / giorniStorico;
    prevArt.push({ art: a, mag: mg, prod: trova(stato.prodotti, a.prodottoId),
      consumoGg, fabSett: consumoGg * 7, coperturaGg: consumoGg > 0 ? a.qty / consumoGg : Infinity });
  }));
  prevArt.sort((x, y) => y.consumoGg - x.consumoGg);
  const prevTop = prevArt.slice(0, 10);

  return (
    <div>
      <Intesta titolo="Analisi" sotto="Andamento della rete: copertura scorte, movimenti e fabbisogni" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icona={TrendingUp} colore={T.blu} label="Movimenti · 7 giorni" valore={mov7} />
        <StatCard icona={Check} colore={artTot && artOk === artTot ? T.verde : T.ambra} label="Copertura scorte"
          valore={`${artTot ? Math.round((artOk / artTot) * 100) : 100}%`} nota={`${artOk} su ${artTot} articoli a livello`} />
        <StatCard icona={FlaskConical} colore={T.ciano} label="Richieste evase · 7 giorni" valore={evase7} />
        <StatCard icona={Truck} colore={T.rosa} label="Righe da ordinare" valore={ordAperti.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Scheda className="p-5">
          <div className="font-extrabold mb-1" style={{ color: T.ink }}>Movimenti al giorno</div>
          <div className="text-xs mb-3" style={{ color: T.tenue }}>Ultimi {GIORNI} giorni · conteggi, prelievi, rettifiche e trasferimenti</div>
          {movs.length === 0
            ? <p className="text-sm py-6 text-center" style={{ color: T.tenue }}>Ancora nessun movimento: il grafico si popola man mano che la rete lavora.</p>
            : <BarreVerticali dati={movGiorno} />}
        </Scheda>
        <Scheda className="p-5">
          <div className="font-extrabold mb-1" style={{ color: T.ink }}>Richieste al laboratorio</div>
          <div className="text-xs mb-3" style={{ color: T.tenue }}>Nuove richieste create al giorno · ultimi {GIORNI} giorni</div>
          {stato.richieste.length === 0
            ? <p className="text-sm py-6 text-center" style={{ color: T.tenue }}>Nessuna richiesta ancora registrata.</p>
            : <BarreVerticali dati={richGiorno} />}
        </Scheda>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Scheda className="p-5">
          <div className="font-extrabold mb-1" style={{ color: T.ink }}>Valore della merce ferma</div>
          <div className="text-xs mb-3" style={{ color: T.tenue }}>
            Giacenze per prezzo, convertite all'unità base di ogni prodotto
          </div>
          {vRete.contate > 0 && (
            <div className="text-3xl font-extrabold leading-none mb-1" style={{ color: T.ink }}>
              {fmtEuro(vRete.tot)}
            </div>
          )}
          {/* Niente «€ 0,00» quando semplicemente non si sa: un numero finto in
              un magazzino fa più danno di un numero che manca. */}
          {vRete.contate === 0 ? (
            <p className="text-sm" style={{ color: T.dim }}>
              Non si può ancora calcolare: <b style={{ color: T.ink }}>nessun prodotto ha un prezzo</b>.
              Si mettono da Catalogo · Prodotti · Prezzi, tutti dalla stessa schermata.
            </p>
          ) : (
            <p className="text-xs" style={{ color: T.dim }}>
              Calcolato su <b style={{ color: T.ink }}>{vRete.contate}</b> caselle.
              {vRete.senzaPrezzo > 0 && <> Escluse <b style={{ color: T.ambra }}>{vRete.senzaPrezzo}</b> senza prezzo.</>}
              {vRete.senzaConv > 0 && <> Escluse <b style={{ color: T.rosso }}>{vRete.senzaConv}</b> senza conversione.</>}
            </p>
          )}
          {(vRete.senzaPrezzo > 0 || vRete.senzaConv > 0) && (
            <div className="mt-3 rounded-2xl px-3 py-2.5 text-xs font-semibold"
              style={{ background: "#FFF6E8", color: "#7A4A00", border: `1px solid ${T.ambra}55` }}>
              Finché mancano prezzi o conversioni il totale è parziale, e lo dice.
            </div>
          )}
        </Scheda>
        <Scheda className="p-5">
          <div className="font-extrabold mb-3" style={{ color: T.ink }}>Copertura per sede</div>
          <div className="flex flex-col gap-3">
            {copSedi.map(({ sede, pct, vuota }) => (
              vuota
                ? <div key={sede.id} className="flex items-center justify-between text-sm py-1" style={{ color: T.tenue }}>
                    <span className="font-bold">{sede.nome}</span><span>nessun magazzino</span>
                  </div>
                : <BarraOrizzontale key={sede.id} label={sede.nome} val={pct} max={100} unita="%"
                    colore={pct >= 90 ? T.verde : pct >= 60 ? T.ambra : T.rosso} />
            ))}
          </div>
        </Scheda>
        <Scheda className="p-5">
          <div className="font-extrabold mb-3" style={{ color: T.ink }}>Prodotti più movimentati</div>
          {topProd.length === 0
            ? <p className="text-sm" style={{ color: T.tenue }}>I dati compaiono dopo i primi movimenti.</p>
            : <div className="flex flex-col gap-3">
                {topProd.map(({ p, n }) => (
                  <BarraOrizzontale key={p.id} label={p.nome} val={n} max={topProd[0].n}
                    colore={trova(stato.categorie, p.categoriaId)?.colore || T.viola} unita="mov." />
                ))}
              </div>}
        </Scheda>
        <Scheda className="p-5">
          <div className="font-extrabold mb-3" style={{ color: T.ink }}>Da ordinare per fornitore</div>
          {perForn.length === 0
            ? <p className="text-sm" style={{ color: T.tenue }}>Nessuna riga d'ordine aperta.</p>
            : <div className="flex flex-col gap-3">
                {perForn.map(({ f, n }) => (
                  <BarraOrizzontale key={f.id} label={f.nome} val={n} max={perForn[0].n} colore={T.ambra} unita="righe" />
                ))}
              </div>}
        </Scheda>
      </div>

      <Scheda className="p-5 mt-4">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="font-extrabold" style={{ color: T.ink }}>Sprechi recenti</div>
          {scarti.length > 0 && <Chip colore={T.rosso}><PackageMinus size={11} /> {scarti7.length} negli ultimi 7 giorni</Chip>}
        </div>
        {scarti.length === 0
          ? <p className="text-sm" style={{ color: T.tenue }}>Nessuno scarto registrato. Registra uno scarto dal dettaglio di un magazzino (bottone rosa sull'articolo): comparirà qui con quantità e motivo.</p>
          : <div className="flex flex-col gap-1.5">
              {scarti.slice(0, 12).map((m) => {
                const p = trova(stato.prodotti, m.prodottoId);
                const mg = trova(stato.magazzini, m.magId);
                return (
                  <div key={m.id} className="flex items-center gap-3 text-sm rounded-xl px-3 py-2" style={{ background: "#FCEEF1" }}>
                    <span className="font-extrabold shrink-0" style={{ color: T.rosso }}>{fmtQ(Math.abs(m.delta))} {simboloU(stato, m.uomId)}</span>
                    <span className="font-semibold truncate" style={{ color: T.ink }}>{p?.nome || "—"}</span>
                    <span className="text-xs truncate" style={{ color: T.dim }}>{m.rif || "—"}{mg ? ` · ${mg.nome}` : ""}</span>
                    <span className="text-xs ml-auto shrink-0" style={{ color: T.tenue }}>{tempoFa(m.t)}</span>
                  </div>
                );
              })}
            </div>}
      </Scheda>

      <Scheda className="p-5 mt-4">
        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
          <div className="font-extrabold" style={{ color: T.ink }}>Previsione fabbisogni</div>
          <Chip colore={T.blu}><TrendingUp size={11} /> storico {giorniStorico} gg</Chip>
        </div>
        <div className="text-xs mb-3" style={{ color: T.tenue }}>
          Stima dal consumo registrato (conteggi in calo, prelievi, evasioni, scarti). Media mobile semplice: più giorni di storico = stima più affidabile.
        </div>
        {prevTop.length === 0
          ? <p className="text-sm" style={{ color: T.tenue }}>Servono più conteggi e movimenti per stimare i fabbisogni: la tabella si popola man mano che la rete lavora.</p>
          : <div className="flex flex-col gap-1.5">
              {prevTop.map(({ art, mag, prod, consumoGg, fabSett, coperturaGg }) => {
                const sym = simboloU(stato, art.uomId);
                const cop = coperturaGg === Infinity ? null : Math.floor(coperturaGg);
                const colCop = cop == null ? T.verde : cop < 3 ? T.rosso : cop < 7 ? T.ambra : T.verde;
                return (
                  <div key={mag.id + art.prodottoId} className="flex items-center gap-3 text-sm rounded-xl px-3 py-2" style={{ background: "#F7F9FE" }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate" style={{ color: T.ink }}>{prod?.nome || "—"}</div>
                      <div className="text-xs truncate" style={{ color: T.tenue }}>{mag.nome} · ~{fmtQ(fabSett)} {sym} a sett.</div>
                    </div>
                    <div className="font-bold shrink-0 text-right leading-tight" style={{ color: T.ink }}>
                      {fmtQ(consumoGg)} {sym}
                      <span className="block text-xs font-normal" style={{ color: T.tenue }}>al giorno</span>
                    </div>
                    <Chip colore={colCop}>{cop == null ? "ok" : `${cop} gg`}</Chip>
                  </div>
                );
              })}
            </div>}
      </Scheda>
      <SoglieConsigliate stato={stato} muta={muta} mostraToast={mostraToast}
        modificabile={profilo?.ruolo === "admin"} />
    </div>
  );
}

/* ─────────── PWA: installabile su iOS e Android, safe-area, icone runtime ───────────
   Il loader su Vercel non ha manifest/meta PWA: li iniettiamo qui a runtime.
   Le icone si disegnano su canvas (PNG data-uri), niente file esterni. */
function disegnaIcona(size) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#4C8DF6"); g.addColorStop(0.55, "#8A63F4"); g.addColorStop(1, "#D96AC0");
  const r = size * 0.22; x.fillStyle = g;
  x.beginPath(); x.moveTo(r, 0);
  x.arcTo(size, 0, size, size, r); x.arcTo(size, size, 0, size, r);
  x.arcTo(0, size, 0, 0, r); x.arcTo(0, 0, size, 0, r); x.closePath(); x.fill();
  /* pacco stilizzato disegnato a mano (niente emoji: evita caratteri astral
     che romperebbero il controllo len del loader) */
  const bw = size * 0.46, bh = size * 0.42, bx = (size - bw) / 2, by = size * 0.30, sp = size * 0.06;
  x.fillStyle = "#fff"; x.fillRect(bx, by, bw, bh);
  x.fillStyle = g;
  x.fillRect(size / 2 - sp / 2, by, sp, bh);
  x.fillRect(bx, by + bh / 2 - sp / 2, bw, sp);
  return c.toDataURL("image/png");
}
function bootstrapPWA() {
  if (typeof document === "undefined" || bootstrapPWA._fatto) return;
  bootstrapPWA._fatto = true;
  try {
    let vp = document.querySelector('meta[name="viewport"]');
    if (!vp) { vp = document.createElement("meta"); vp.name = "viewport"; document.head.appendChild(vp); }
    if (!/viewport-fit/.test(vp.content || "")) vp.content = (vp.content || "width=device-width, initial-scale=1") + ", viewport-fit=cover";
    [["theme-color", "#4C8DF6"], ["apple-mobile-web-app-capable", "yes"], ["mobile-web-app-capable", "yes"],
     ["apple-mobile-web-app-status-bar-style", "default"], ["apple-mobile-web-app-title", "Supply Chain Pro"]]
      .forEach(([n, cnt]) => {
        let m = document.querySelector('meta[name="' + n + '"]');
        if (!m) { m = document.createElement("meta"); m.setAttribute("name", n); document.head.appendChild(m); }
        m.setAttribute("content", cnt);
      });
    const i180 = disegnaIcona(180), i192 = disegnaIcona(192), i512 = disegnaIcona(512);
    const setLink = (rel, href) => {
      let l = document.querySelector('link[rel="' + rel + '"]');
      if (!l) { l = document.createElement("link"); l.rel = rel; document.head.appendChild(l); }
      l.href = href;
    };
    setLink("apple-touch-icon", i180); setLink("icon", i192);
    const manifest = {
      name: "Supply Chain Pro", short_name: "SupplyChain", start_url: ".", scope: ".",
      display: "standalone", orientation: "portrait", background_color: "#F4F7FE", theme_color: "#4C8DF6",
      icons: [{ src: i192, sizes: "192x192", type: "image/png", purpose: "any maskable" },
              { src: i512, sizes: "512x512", type: "image/png", purpose: "any maskable" }],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" }));
    setLink("manifest", url);
  } catch (e) { /* best-effort: se la CSP blocca blob/data, restano meta e safe-area */ }
}

/* ─────────── APP PRINCIPALE ─────────── */
export default function App() {
  const [stato, setStato] = useState(null);
  const [profiloId, setProfiloId] = useState(null);
  const [sync, setSync] = useState("init"); // ok | salvataggio | offline | locale
  const [toast, setToast] = useState(null);
  const statoRef = useRef(null);
  useEffect(() => { statoRef.current = stato; }, [stato]);
  useEffect(() => { bootstrapPWA(); }, []);
  const profiloRef = useRef(null);
  /* Modalità sicura: se il loader espone window.auth, i dati si
     caricano solo DOPO il login (sessione con token lato server).
     Senza window.auth l'app funziona come prima (retrocompatibile). */
  const auth = (typeof window !== "undefined" && window.auth) ? window.auth : null;

  /* ── motore di sincronizzazione resiliente ──
     Ogni modifica entra in coda, si applica subito in locale e viene
     ri-applicata sull'ultimo stato remoto prima di ogni scrittura.
     In caso di errore si riprova con attesa crescente.

     Due telefoni che salvano nello stesso momento (gen-5.80).
     Fra il «leggo com'è adesso» e il «scrivo com'è dopo» passa un giro di
     rete. Se in quel mezzo secondo salva anche un altro, prima il secondo
     arrivato riscriveva tutto sopra e il lavoro del primo spariva senza
     un avviso: un conteggio intero, un carico, una richiesta al
     laboratorio. In cucina, con tre o quattro telefoni accesi, non è un
     caso di scuola.
     Adesso insieme allo stato viaggia revBase, cioè «da quale revisione
     sono partito». Il server accetta la scrittura SOLO se in rete c'è
     ancora quella revisione; se nel frattempo si è mossa, rifiuta.
     Chi viene rifiutato non perde niente: la coda non si svuota mai
     prima della conferma, quindi le sue modifiche si riapplicano sulla
     base aggiornata e si SOMMANO a quelle dell'altro. È la coda a
     rendere la cosa possibile — è per questo che la correzione sta qui
     e non in un «chi arriva dopo vince».                            */
  const modalitaRef = useRef("condivisa");   // condivisa | locale
  const baseRef = useRef(null);              // ultimo stato remoto confermato
  const codaRef = useRef([]);                // mutazioni in attesa di invio
  const inSyncRef = useRef(false);
  const riproveRef = useRef(0);
  const conflittiRef = useRef(0);            // quante volte di fila ha vinto un altro
  const offlineRef = useRef(false);
  const timerRef = useRef(null);
  const diagRef = useRef({});

  const mostraToast = (msg, tipo = "ok") => {
    setToast({ id: uid("t"), msg, tipo });
    setTimeout(() => setToast((t) => (t && t.msg === msg ? null : t)), 2800);
  };

  const normalizza = (s) => ({ codici: [], accessi: [], richieste: [], ordini: [], log: [], movimenti: [], applicate: [],
    listino: [], vendite: [], giornate: [], ...s });

  /* Quante, fra quelle in coda, non risultano ancora registrate in rete. */
  const nuoveInCoda = (base) => {
    const gia = new Set(base?.applicate || []);
    return codaRef.current.filter((m) => !(m.logId && gia.has(m.logId))).length;
  };

  const applicaCoda = (base) => {
    if (!codaRef.current.length) return base;
    const b = clona(base);
    const gia = new Set(b.applicate || []);
    for (const m of codaRef.current) {
      /* Il nome di questa modifica e' gia' scritto nello stato: vuol dire che
         era gia' arrivata e si era persa solo la risposta. Riapplicarla
         conterebbe due volte un «aggiungi 3» — tre teglie prodotte che ne
         diventano sei. Per un «metti a 7» non cambierebbe niente, ed e' per
         questo che il difetto e' rimasto invisibile cosi' a lungo. */
      if (m.logId && gia.has(m.logId)) continue;
      /* la fotografia di prima serve solo se questa mutazione finisce nello
         storico: le altre non hanno niente da ripristinare */
      const pri = m.descr ? { caselle: fotoCaselle(b), prodotti: fotoProdotti(b) } : null;
      try { m.fn(b); } catch (e) { console.warn("Mutazione ignorata per errore:", e); }
      if (m.descr) b.log = sfoltisci([voceLog(m, pri, b), ...(b.log || [])].slice(0, 50));
      if (m.logId) { gia.add(m.logId); b.applicate = [m.logId, ...(b.applicate || [])].slice(0, MAX_APPLICATE); }
    }
    /* la finestra degli ordini si applica qui, dove passa ogni scrittura:
       metterla nei singoli punti che creano ordini vorrebbe dire dimenticarsene
       nel prossimo che si aggiunge */
    b.ordini = sfoltisciOrdini(b.ordini);
    /* e per la stessa identica ragione le vendite e le giornate (gen-5.96):
       la prima stesura le potava solo dentro applicaVendita, e 300 righe
       scadute avrebbero viaggiato in rete finche' qualcuno non batteva la
       vendita successiva — trovato dalla revisione, non da me */
    b.vendite = sfoltisciVendite(b.vendite);
    b.giornate = sfoltisciGiornate(b.giornate);
    return b;
  };

  const pianifica = (ms) => { clearTimeout(timerRef.current); timerRef.current = setTimeout(sincronizza, ms); };

  const sincronizza = async () => {
    /* watchdog: se un ciclo resta appeso oltre 12s, si sblocca da solo */
    if (inSyncRef.current && Date.now() - inSyncRef.current < 12000) return;
    if (modalitaRef.current !== "condivisa" || !codaRef.current.length) { inSyncRef.current = 0; return; }
    inSyncRef.current = Date.now();
    try {
      const letto = await leggiRemoto();
      if (!letto && (baseRef.current?.rev || 0) > 1) throw new Error("lettura non riuscita");
      const remoto = letto ? normalizza(letto) : null;
      /* Si riparte SEMPRE da quello che c'è scritto in rete. Prima si
         teneva la propria copia quando aveva un numero di revisione più
         alto, ma quel numero veniva dall'orologio del telefono: un
         telefono avanti di qualche minuto scartava per principio il
         lavoro di tutti gli altri. La rete è l'unica verità. */
      const base = remoto || baseRef.current || statoRef.current;
      const inviate = codaRef.current.length;
      /* In rete ci sono gia' TUTTE le modifiche che ho in coda: la scrittura
         di prima era arrivata, si era persa solo la risposta. Qui non si
         riscrive niente — riscrivere vorrebbe dire riapplicarle sopra a se
         stesse. Si prende quello che c'e' e si svuota la coda.
         La condizione richiede «remoto», cioe' di aver DAVVERO letto la rete:
         senza quella lettura la mia copia contiene comunque quelle modifiche
         (e' la vista che sto mostrando), e ripiegarci sopra vorrebbe dire
         buttare via il lavoro credendolo gia' salvato. */
      if (remoto && !nuoveInCoda(base)) {
        codaRef.current = codaRef.current.slice(inviate);
        baseRef.current = base; statoRef.current = base; setStato(base);
        riproveRef.current = 0; conflittiRef.current = 0;
        diagRef.current = { ...diagRef.current, ultimoOk: Date.now(), ultimoErrore: null,
          nRitrovate: (diagRef.current.nRitrovate || 0) + 1 };
        if (offlineRef.current) { offlineRef.current = false; mostraToast("Connessione ripristinata: dati allineati in rete"); }
        inSyncRef.current = 0;
        setSync(codaRef.current.length ? "salvataggio" : "ok");
        if (codaRef.current.length) pianifica(80);
        return;
      }
      const nuovo = applicaCoda(base);
      /* rev = contatore semplice, un passo per scrittura: niente più
         orologi, e il numero da cui si è partiti viaggia insieme allo
         stato perché il server possa rifiutare chi arriva secondo. */
      nuovo.revBase = base.rev || 0;
      nuovo.rev = (base.rev || 0) + 1;
      nuovo.mtime = Date.now();
      if (!(await scriviRemoto(nuovo))) {
        /* Distinguere «ha vinto un altro» da «è caduta la linea»: se il
           numero di revisione in rete si è mosso, la rete c'è ed è stata
           una gara persa. Si riprova subito, ripartendo dalla base nuova.
           Se invece non si riesce a saperlo, si tratta come un guasto:
           l'attesa è più lunga, ma non si perde niente lo stesso. */
        const rr = await revRemota();
        if (rr != null && rr !== (base.rev || 0))
          throw Object.assign(new Error("ha salvato prima un altro telefono"), { conflitto: true });
        throw new Error("scrittura non riuscita");
      }
      conflittiRef.current = 0;
      codaRef.current = codaRef.current.slice(inviate);
      baseRef.current = nuovo;
      const vista = codaRef.current.length ? applicaCoda(nuovo) : nuovo;
      statoRef.current = vista; setStato(vista);
      riproveRef.current = 0;
      diagRef.current = { ...diagRef.current, ultimoOk: Date.now(), ultimoErrore: null };
      if (offlineRef.current) { offlineRef.current = false; mostraToast("Connessione ripristinata: dati allineati in rete"); }
      inSyncRef.current = 0;
      if (codaRef.current.length) pianifica(80); else setSync("ok");
    } catch (e) {
      inSyncRef.current = 0;
      if (e?.conflitto) {
        /* La coda NON si svuota: le stesse modifiche si riapplicano sulla
           base aggiornata, quindi si sommano a quelle dell'altro invece di
           cancellarle. L'attesa è corta e casuale, se no due telefoni che
           riprovano insieme continuano a ripestarsi i piedi. */
        conflittiRef.current += 1;
        diagRef.current = {
          ...diagRef.current, nConflitti: (diagRef.current.nConflitti || 0) + 1,
          ultimoConflitto: Date.now(),
        };
        setSync("salvataggio");
        pianifica(90 + Math.random() * 260 + Math.min(1500, 150 * Math.max(0, conflittiRef.current - 3)));
        return;
      }
      conflittiRef.current = 0;
      riproveRef.current += 1;
      diagRef.current = {
        ...diagRef.current, nErrori: (diagRef.current.nErrori || 0) + 1,
        ultimoErrore: { t: Date.now(), msg: e?.message || "errore sconosciuto" },
      };
      if (riproveRef.current >= 3 && !offlineRef.current) {
        offlineRef.current = true;
        setSync("offline");
        mostraToast("Connessione instabile: le modifiche verranno inviate appena possibile", "avviso");
      }
      pianifica(Math.min(8000, 500 * 2 ** (riproveRef.current - 1)) + Math.random() * 300);
    }
  };

  /* mutazione: applicazione locale immediata + invio garantito */
  const muta = (fn, descr) => {
    if (!statoRef.current) return true;
    const m = { fn, descr, chi: profiloRef.current?.nome || "Sistema", t: Date.now(), logId: uid("l") };
    if (modalitaRef.current === "locale") {
      const b = clona(statoRef.current);
      const pri = descr ? { caselle: fotoCaselle(b), prodotti: fotoProdotti(b) } : null;
      try { fn(b); } catch {}
      if (descr) b.log = sfoltisci([voceLog(m, pri, b), ...(b.log || [])].slice(0, 50));
      b.ordini = sfoltisciOrdini(b.ordini);
      b.vendite = sfoltisciVendite(b.vendite);
      b.giornate = sfoltisciGiornate(b.giornate);
      b.rev = (b.rev || 0) + 1; b.mtime = Date.now();
      setStato(b);
      return true;
    }
    codaRef.current.push(m);
    setStato(applicaCoda(baseRef.current || statoRef.current));
    setSync("salvataggio");
    pianifica(0);
    return true;
  };

  /* avvio: carica o inizializza */
  useEffect(() => {
    (async () => {
      if (auth) {
        /* modalità sicura: prima del login si mostra SOLO l'elenco
           dei nomi (niente dati, niente PIN). Lo stato completo si
           carica dentro «entra», dopo l'accesso con token valido. */
        try {
          const lista = await auth.loginList();
          const pre = normalizza({ profili: Array.isArray(lista) ? lista : [], __prelogin: true });
          baseRef.current = null; statoRef.current = pre; setStato(pre); setSync("ok");
        } catch { setSync("offline"); }
        return;
      }
      if (!haStorage()) {
        modalitaRef.current = "locale";
        const s = normalizza(await creaSeed());
        baseRef.current = s; setStato(s); setSync("locale");
        return;
      }
      const letto = await leggiRemoto();
      if (letto) {
        const s = normalizza(letto);
        baseRef.current = s; setStato(s); setSync("ok");
      } else {
        const seed = normalizza(await creaSeed());
        /* dichiara di partire dal nulla: se nel frattempo un altro telefono
           ha creato lo stato, il server rifiuta e i dati veri restano */
        seed.revBase = 0;
        baseRef.current = seed; setStato(seed);
        if (await scriviRemoto(seed)) setSync("ok");
        else {
          setSync("salvataggio");
          codaRef.current.push({ fn: () => {}, chi: "Sistema", t: Date.now(), logId: uid("l") });
          pianifica(800);
        }
      }
    })();
    return () => clearTimeout(timerRef.current);
  }, []);

  /* allineamento continuo (3s, immediato al ritorno sulla scheda) */
  useEffect(() => {
    let giriMagri = 0;
    const aggiorna = async () => {
      if (modalitaRef.current !== "condivisa" || document.hidden || inSyncRef.current || !baseRef.current) return;
      /* Prima si chiede solo il numero di revisione: venti byte invece di
         centosettanta kilobyte. Se non e' cambiato niente si esce di qui.
         Il giro leggero non si fa piu' di dieci volte di fila: l'undicesimo
         scarica comunque tutto, cosi' anche se la spia rimanesse indietro il
         ritardo massimo e' mezzo minuto, non «per sempre». */
      if (giriMagri < MAX_GIRI_MAGRI) {
        const rr = await revRemota();
        if (rr != null && rr <= (baseRef.current.rev || 0)) { giriMagri++; return; }
      }
      giriMagri = 0;
      const letto = await leggiRemoto();
      if (!letto) return;
      const r = normalizza(letto);
      /* Si accettano SOLO revisioni più nuove: una lettura stantia o
         in cache (rev più vecchia) subito dopo una scrittura faceva
         tornare indietro la vista (evasioni e ordini «spariti»).
         La rev è un contatore che sale di uno a ogni scrittura andata a
         buon fine, quindi più alta = più nuova, sempre e per tutti. */
      if ((r.rev || 0) > (baseRef.current.rev || 0)) {
        baseRef.current = r;
        setStato(codaRef.current.length ? applicaCoda(r) : r);
      }
    };
    const id = setInterval(aggiorna, 2600 + Math.floor(Math.random() * 900));
    const suFocus = () => { if (!document.hidden) aggiorna(); };
    document.addEventListener("visibilitychange", suFocus);
    window.addEventListener("focus", suFocus);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", suFocus);
      window.removeEventListener("focus", suFocus);
    };
  }, []);

  const profilo = stato?.profili.find((p) => p.id === profiloId) || null;
  useEffect(() => { profiloRef.current = profilo; }, [profilo]);

  /* accesso: in modalità sicura carica lo stato completo (ora il
     token è valido); in modalità classica imposta solo il profilo. */
  const entra = async (pid) => {
    if (auth) {
      try {
        const letto = await leggiRemoto();
        const s = letto ? normalizza(letto) : normalizza({ profili: statoRef.current?.profili || [] });
        baseRef.current = s; statoRef.current = s; setStato(s); setSync("ok");
      } catch {}
    }
    setProfiloId(pid);
  };
  const esci = async () => {
    setProfiloId(null);
    if (auth) {
      try { await auth.logout(); } catch {}
      try {
        const lista = await auth.loginList();
        const pre = normalizza({ profili: Array.isArray(lista) ? lista : [], __prelogin: true });
        baseRef.current = null; statoRef.current = pre; setStato(pre);
      } catch {}
    }
  };

  /* ripristino completo (backup / importazione): passa dalla stessa coda */
  const ripristina = async (dati, origine) => {
    const pulito = normalizza(clona(dati));
    const m = {
      fn: (s) => { for (const k of Object.keys(s)) delete s[k]; Object.assign(s, clona(pulito)); },
      descr: `Dati ripristinati (${origine})`,
      chi: profiloRef.current?.nome || "Sistema", t: Date.now(), logId: uid("l"),
    };
    if (modalitaRef.current === "locale") {
      const b = clona(pulito);
      b.log = [{ id: m.logId, t: m.t, chi: m.chi, msg: m.descr }, ...(b.log || [])].slice(0, 50);
      b.rev = (statoRef.current?.rev || 0) + 1;
      baseRef.current = b; setStato(b);
      mostraToast("Dati ripristinati");
      return;
    }
    codaRef.current = [m];
    setStato(applicaCoda(baseRef.current || statoRef.current));
    setSync("salvataggio");
    pianifica(0);
    mostraToast("Ripristino avviato: distribuzione in corso a tutta la rete");
  };

  if (!stato) {
    return (
      <div className="sc-root h-screen flex flex-col items-center justify-center gap-4" style={{ background: T.bg }}>
        <style>{CSS}</style>
        <div className="rounded-3xl p-5 sc-pop" style={{ background: T.grad }}><Boxes size={30} color="#fff" /></div>
        <div className="font-extrabold text-lg" style={{ color: T.ink }}>Supply Chain Pro</div>
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: T.dim }}>
          <RefreshCw size={15} className="sc-gira" /> Sincronizzazione in corso…
        </div>
      </div>
    );
  }

  return (
    <div className="sc-root h-screen w-full overflow-hidden relative" style={{ background: T.bg, color: T.ink }}>
      <style>{CSS}</style>
      {/* sfondo morbido animato */}
      <div aria-hidden className="pointer-events-none absolute rounded-full"
        style={{ width: 420, height: 420, top: -140, right: -120, background: "radial-gradient(circle,#4C8DF62E,transparent 65%)", filter: "blur(10px)", animation: "scBlob 14s ease-in-out infinite" }} />
      <div aria-hidden className="pointer-events-none absolute rounded-full"
        style={{ width: 380, height: 380, bottom: -140, left: -120, background: "radial-gradient(circle,#D96AC024,transparent 65%)", filter: "blur(10px)", animation: "scBlob 18s ease-in-out infinite reverse" }} />

      {!profilo ? (
        <SchermataLogin stato={stato} sync={sync} muta={muta} onEntra={entra} auth={auth} />
      ) : (
        <Struttura stato={stato} profilo={profilo} muta={muta} sync={sync}
          esci={esci} mostraToast={mostraToast} ripristina={ripristina} />
      )}

      {toast && (
        <div className="sc-pop fixed left-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 font-bold text-sm"
          style={{
            bottom: 96, transform: "translateX(-50%)", color: "#fff",
            backgroundColor: toast.tipo === "errore" ? T.rosso : toast.tipo === "avviso" ? T.ambra : "#2B3355",
            boxShadow: "0 14px 30px -12px rgba(30,40,80,.45)", maxWidth: "88vw",
          }}>
          {toast.tipo === "errore" ? <AlertTriangle size={15} /> : <Check size={15} />}
          <span className="truncate">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
