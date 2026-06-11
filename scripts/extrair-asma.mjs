// Extrator do conteúdo clínico do submódulo Asma (HTML originais) → JSON em /conteudo/cronicas.
// Todo o texto clínico vem recortado do original (nunca retranscrito à mão).
// Guia e Algoritmo são HTML estático: fatiam-se os painéis inteiros e a interatividade
// (subtabs, pesquisas, degraus, tracks, flips) fica para handlers delegados no React.
// Saídas: asma.json (menu), asma-guia.json, asma-algoritmo.json, asma-quiz.json,
//         asma-flashcards.json, asma-cards.json.
import fs from "fs";
import vm from "vm";
import path from "path";

const DIR = "/Users/pedroferreira/Downloads/ASma- patologia";
const OUT = "/Users/pedroferreira/Desktop/medguia/conteudo/cronicas";

const homeSrc = fs.readFileSync(path.join(DIR, "asma_home_v3-3.html"), "utf8");
const guiaSrc = fs.readFileSync(path.join(DIR, "ASMA_GUIA-3.html"), "utf8");
const algoSrc = fs.readFileSync(path.join(DIR, "ASMA_ALGORITMO-2.html"), "utf8");
const quizSrc = fs.readFileSync(path.join(DIR, "ASMA CASOS CLINICOS.html"), "utf8");
const flashSrc = fs.readFileSync(path.join(DIR, "ASMA_FLASHCARDS-2.html"), "utf8");
const cardsSrc = fs.readFileSync(path.join(DIR, "CARDS_ASMA.html"), "utf8");

// ── helpers (mesmo padrão do extrair-dor-abdominal) ──
function literalAfter(src, re) {
  const m = re.exec(src);
  if (!m) throw new Error("não encontrado: " + re);
  let i = m.index + m[0].length - 1;
  const open = src[i], close = open === "[" ? "]" : "}";
  let depth = 0, inStr = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j], p = src[j - 1];
    if (inStr) { if (c === inStr && p !== "\\") inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "/" && src[j + 1] === "/") { while (j < src.length && src[j] !== "\n") j++; continue; }
    if (c === "/" && src[j + 1] === "*") { j += 2; while (j < src.length && !(src[j] === "*" && src[j + 1] === "/")) j++; j++; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error("bracket não fechou: " + re);
}
const evalLit = (lit) => vm.runInNewContext("(" + lit + ")", {});
function grab(src, re, label) {
  const m = re.exec(src);
  if (!m) throw new Error("grab falhou: " + (label || re));
  return m[1];
}
const clean = (s) => s.replace(/\s+/g, " ").trim();
const semEm = (s) => s.replace(/<\/?em>/g, "");
// decodificador de entidades para campos de texto simples (o home original usa &oacute; etc.)
const ENT = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  middot: "·", ndash: "–", mdash: "—", hellip: "…", ge: "≥", le: "≤", deg: "°", times: "×", rarr: "→",
  aacute: "á", agrave: "à", atilde: "ã", acirc: "â", eacute: "é", ecirc: "ê", iacute: "í",
  oacute: "ó", otilde: "õ", ocirc: "ô", uacute: "ú", ccedil: "ç",
  Aacute: "Á", Atilde: "Ã", Eacute: "É", Iacute: "Í", Oacute: "Ó", Otilde: "Õ", Uacute: "Ú", Ccedil: "Ç",
};
const ent = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-zA-Z]+\d*);/g, (m, nome) => ENT[nome] ?? m);

// ═══ MENU (home) ═══
function menuCard(cls, destino) {
  const i = homeSrc.indexOf(`class="card ${cls}"`);
  if (i < 0) throw new Error("card do menu não encontrado: " + cls);
  const seg = homeSrc.slice(i, homeSrc.indexOf("</a>", i));
  return {
    destino,
    badge: ent(clean(grab(seg, /class="card-num-badge">([\s\S]*?)<\/span>/, cls + "-badge"))),
    eyebrow: ent(grab(seg, /class="card-eyebrow">([^<]+)</, cls + "-eyebrow")),
    titulo: ent(grab(seg, /class="card-title">([^<]+)</, cls + "-titulo")),
    sub: ent(clean(grab(seg, /class="card-sub">([\s\S]*?)<\/p>/, cls + "-sub"))),
    features: [...seg.matchAll(/<span class="feat-dot"><\/span>([\s\S]*?)<\/div>/g)].map((m) => ent(clean(m[1]))),
    cta: ent(grab(seg, /class="card-cta">([^<]+)</, cls + "-cta")),
  };
}
const menu = {
  pill: ent(clean(grab(homeSrc, /class="hero-pill-text">([\s\S]*?)<\/span>/, "pill"))),
  heroTitulo: ent(clean(semEm(grab(homeSrc, /<h1 class="hero-title">([\s\S]*?)<\/h1>/, "heroTitulo")))),
  heroSub: ent(clean(grab(homeSrc, /class="hero-sub">([\s\S]*?)<\/p>/, "heroSub"))),
  eyebrow: ent(grab(homeSrc, /class="cards-eyebrow">([^<]+)</, "menu-eyebrow")),
  label: ent(clean(semEm(grab(homeSrc, /class="cards-label">([\s\S]*?)<\/div>/, "menu-label")))),
  cartoes: [menuCard("theory", "guia"), menuCard("algo", "algoritmo"), menuCard("cards", "cards"), menuCard("quiz", "quiz")],
  fontesTags: [...homeSrc.matchAll(/class="source-tag">([\s\S]*?)<\/span>/g)].map((m) => ent(clean(m[1]))),
  metaItens: [...homeSrc.matchAll(/class="meta-item">([\s\S]*?)<\/span>/g)].map((m) => clean(m[1])),
  rodape: {
    comoTitulo: ent(grab(homeSrc, /class="footer-title">([^<]+)</, "foot-titulo")),
    comoTexto: ent(clean(grab(homeSrc, /class="footer-body">([\s\S]*?)<\/p>/, "foot-texto"))),
    legal: ent(clean(grab(homeSrc, /class="legal">([\s\S]*?)<\/p>/, "legal"))),
  },
};
if (menu.fontesTags.length !== 3) throw new Error("esperava 3 source-tags, vieram " + menu.fontesTags.length);
if (menu.metaItens.length !== 4) throw new Error("esperava 4 meta-itens, vieram " + menu.metaItens.length);

// ═══ GUIA TEÓRICO: 10 painéis fatiados inteiros (subtabs incluídas → delegação no React) ═══
const guiaTabLabels = [...guiaSrc.matchAll(/<button class="tab[^"]*" data-tab="([a-z]+)"><span class="tab-num">\d+<\/span>\s*([^<]+)<\/button>/g)]
  .map((m) => ({ id: m[1], label: ent(clean(m[2])) }));
if (guiaTabLabels.length !== 10) throw new Error("esperava 10 tabs no guia, vieram " + guiaTabLabels.length);

function fatiarMarcadores(src, re) {
  const idxs = [];
  let m;
  while ((m = re.exec(src))) idxs.push({ at: m.index, attr: m[1] });
  return idxs.map((x, k) => ({ attr: x.attr, html: src.slice(x.at, k + 1 < idxs.length ? idxs[k + 1].at : src.length) }));
}
const innerDe = (html, fimTag) => {
  const ini = html.indexOf(">") + 1;
  const fim = html.lastIndexOf(fimTag);
  if (fim < 0) throw new Error("fecho não encontrado: " + fimTag);
  return html.slice(ini, fim);
};

const guiaCorpo = guiaSrc.slice(guiaSrc.indexOf("<body>"), guiaSrc.indexOf("<script>"));
const guiaPaneis = fatiarMarcadores(guiaCorpo, /<section class="panel[^"]*" id="([a-z]+)">/g);
if (guiaPaneis.length !== 10) throw new Error("esperava 10 panels no guia, vieram " + guiaPaneis.length);

function verificarSemHandlers(html, label) {
  if (/ on(click|input|keyup|change|submit)=/.test(html)) throw new Error("handler inline remanescente em " + label);
  return html;
}
const guiaTabs = guiaPaneis.map((p, i) => {
  if (p.attr !== guiaTabLabels[i].id) throw new Error("ordem painel/tab divergente: " + p.attr);
  return { id: p.attr, label: guiaTabLabels[i].label, html: verificarSemHandlers(innerDe(p.html, "</section>"), "guia-" + p.attr) };
});
const guiaHeader = {
  eyebrow: ent(grab(guiaSrc, /class="eyebrow">([^<]+)</, "guia-eyebrow")),
  titulo: ent(clean(semEm(grab(guiaSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "guia-titulo")))),
  subtitulo: ent(clean(grab(guiaSrc, /class="subtitle">([\s\S]*?)<\/p>/, "guia-sub"))),
};
// rodapé legal do guia (se existir)
const guiaFootM = /<div class="foot">([\s\S]*?)<\/div>/.exec(guiaCorpo.slice(guiaCorpo.lastIndexOf("</section>")));
const guiaFoot = guiaFootM ? clean(guiaFootM[1]) : "";

// contagens de verificação contra o ficheiro real
const contar = (s, re) => (s.match(re) || []).length;
if (contar(guiaTabs.map((t) => t.html).join(""), /class="subpanel/g) !== 40) throw new Error("subpanels do guia ≠ 40");
if (contar(guiaTabs.map((t) => t.html).join(""), /class="pharma-wrap/g) !== 28) throw new Error("pharma-wrap do guia ≠ 28");
if (contar(guiaTabs.find((t) => t.id === "glossario").html, /class="gloss-card/g) !== 30) throw new Error("gloss-cards ≠ 30");
for (const idEsperado of ["search-tratamento", "search-comparacao", "search-glossario", "comp-table", "gloss-grid", "gloss-count"]) {
  if (!guiaTabs.some((t) => t.html.includes(`id="${idEsperado}"`))) throw new Error("id em falta no guia: " + idEsperado);
}

// ═══ ALGORITMO: 3 populações + glossário; onclick → data-* para delegação ═══
function transfAlgo(html, label) {
  let out = html;
  out = out.replace(/ onclick="toggleStep\(this\)"/g, ' data-algo-step="1"');
  out = out.replace(/ onclick="toggleCrBranch\('([a-z]+)',\s*'([a-z]+)'\)"/g, ' data-algo-cr="$1:$2"');
  out = out.replace(/ onclick="openDegrau\((\d)\)"/g, ' data-algo-dg="adult:$1"');
  out = out.replace(/ onclick="openChildDegrau\((\d)\)"/g, ' data-algo-dg="child:$1"');
  out = out.replace(/ onclick="setTab\('(\w+)'\)"/g, ' data-algo-tab="$1"');
  out = out.replace(/ onclick="setChildTab\('(\w+)'\)"/g, ' data-algo-tab="$1"');
  out = out.replace(/ onclick="setPreTab\('(\w+)'\)"/g, ' data-algo-tab="$1"');
  out = out.replace(/ oninput="filterAlgoGloss\(this\.value\)"/g, ' data-algo-gloss-search="1"');
  return verificarSemHandlers(out, label);
}
const algoCorpo = algoSrc.slice(algoSrc.indexOf("<body>"), algoSrc.indexOf("<script>"));
const popBtns = [...algoCorpo.matchAll(/<button class="pop-btn[^"]*" data-pop="([a-z]+)"[^>]*>([\s\S]*?)<\/button>/g)]
  .map((m) => ({ id: m[1], label: ent(clean(m[2])) }));
if (popBtns.length !== 3) throw new Error("esperava 3 pop-btns, vieram " + popBtns.length);

const popsRaw = fatiarMarcadores(algoCorpo, /<div class="pop-content[^"]*" data-pop="([a-z]+)">/g);
if (popsRaw.length !== 3) throw new Error("esperava 3 pop-contents, vieram " + popsRaw.length);
// o último pop termina onde começa o glossário
const idxGloss = popsRaw[2].html.indexOf('<div class="algo-glossary">');
if (idxGloss < 0) throw new Error("algo-glossary não encontrado");
const glossSeg = popsRaw[2].html.slice(idxGloss);
popsRaw[2].html = popsRaw[2].html.slice(0, idxGloss);

const algoPops = popsRaw.map((p, i) => ({
  id: p.attr,
  label: popBtns[i].label,
  html: transfAlgo(innerDe(p.html, "</div>"), "algo-" + p.attr),
}));
const algoGlossHtml = transfAlgo(glossSeg.slice(0, glossSeg.indexOf('<div class="foot">')), "algo-gloss");
const algoFoot = clean(grab(glossSeg, /<div class="foot">([\s\S]*?)<\/div>/, "algo-foot"));

const algoHeader = {
  ribbon: ent(grab(algoSrc, /class="ribbon">([^<]+)</, "ribbon")),
  eyebrow: ent(grab(algoSrc, /class="eyebrow">([^<]+)</, "algo-eyebrow")),
  titulo: ent(clean(semEm(grab(algoSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "algo-titulo")))),
  subtitulo: ent(clean(grab(algoSrc, /class="subtitle">([\s\S]*?)<\/p>/, "algo-sub"))),
  popLabel: ent(grab(algoSrc, /class="pop-filter-label">([^<]+)</, "pop-label")),
};

const algoJunto = algoPops.map((p) => p.html).join("");
if (contar(algoJunto, /data-algo-cr=/g) !== 9) throw new Error("toggleCrBranch ≠ 9");
if (contar(algoJunto, /data-algo-dg="adult:/g) !== 10) throw new Error("openDegrau ≠ 10");
if (contar(algoJunto, /data-algo-dg="child:/g) !== 10) throw new Error("openChildDegrau ≠ 10");
if (contar(algoJunto, /data-algo-step=/g) !== 22) throw new Error("toggleStep ≠ 22");
if (contar(algoJunto, /data-algo-tab=/g) !== 9) throw new Error("setTab ≠ 9");
if (contar(algoJunto, /class="pharma-wrap/g) !== 22) throw new Error("pharma-wrap do algoritmo ≠ 22");
if (contar(algoGlossHtml, /class="algo-gloss-item"/g) !== 33) throw new Error("algo-gloss-items ≠ 33");

// ═══ QUIZ (casos clínicos, formato QuizPNA) ═══
const CASES = evalLit(literalAfter(quizSrc, /const CASES = \[/));
const DEFAULT_TIPS = evalLit(literalAfter(quizSrc, /const DEFAULT_TIPS = \{|const DEFAULT_TIPS=\{/));
if (CASES.length !== 25) throw new Error("esperava 25 casos, vieram " + CASES.length);
if (Object.keys(DEFAULT_TIPS).length !== 5) throw new Error("esperava 5 categorias de dicas");
CASES.forEach((c, i) => {
  if (!c.id || !c.vignette || !c.stem || !Array.isArray(c.options)) throw new Error("caso malformado: " + i);
  if (c.options.filter((o) => o.correct).length !== 1) throw new Error("caso sem resposta única: " + c.id);
});
const quiz = {
  titulo: ent(clean(semEm(grab(quizSrc, /<h1 class="title"[^>]*>([\s\S]*?)<\/h1>/, "quiz-titulo")))),
  sub: ent(clean(grab(quizSrc, /class="subtitle"[^>]*>([\s\S]*?)<\/p>/, "quiz-sub"))),
  dicas: DEFAULT_TIPS,
  dicasEditaveis: true,
  dicasHint: ent(grab(quizSrc, /class="tips-add-hint">([^<]+)</, "tips-hint")),
  casos: CASES,
};

// ═══ FLASHCARDS (2 baralhos com revisão pontuada) ═══
const CRONICA = evalLit(literalAfter(flashSrc, /const CRONICA=\[/));
const AGUDA = evalLit(literalAfter(flashSrc, /const AGUDA=\[/));
const SUBTITLES = evalLit(literalAfter(flashSrc, /const SUBTITLES=\{/));
if (CRONICA.length !== 25) throw new Error("esperava 25 flashcards crónica, vieram " + CRONICA.length);
if (AGUDA.length !== 20) throw new Error("esperava 20 flashcards aguda, vieram " + AGUDA.length);
const flashTabs = [...flashSrc.matchAll(/<button class="tab[^"]*" onclick="switchCat\('(\w+)'\)">([^<]+)</g)]
  .map((m) => ({ id: m[1], label: ent(clean(m[2])) }));
if (flashTabs.length !== 2) throw new Error("esperava 2 tabs de flashcards");
const flashEyebrowM = /class="eyebrow">([^<]+)</.exec(flashSrc);
const flashcards = {
  eyebrow: flashEyebrowM ? ent(flashEyebrowM[1]) : "",
  titulo: ent(clean(semEm(grab(flashSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "flash-titulo")))),
  decks: flashTabs.map((t) => ({
    id: t.id,
    label: t.label,
    subtitle: ent(SUBTITLES[t.id]),
    cards: { cronica: CRONICA, aguda: AGUDA }[t.id],
  })),
};

// ═══ CARDS DE ESTUDO (3 baralhos com sev/sevBadge) ═══
const C_CATS = evalLit(literalAfter(cardsSrc, /var CATS = \{/));
const C_DEFAULTS = evalLit(literalAfter(cardsSrc, /var DEFAULTS = \{/));
const SEV_LABELS = evalLit(literalAfter(cardsSrc, /var sevLabels=\{/));
const esperados = { cronica: 12, crise: 8, pearls: 9 };
for (const [k, n] of Object.entries(esperados)) {
  if ((C_DEFAULTS[k] || []).length !== n) throw new Error(`cards ${k}: esperava ${n}, vieram ${(C_DEFAULTS[k] || []).length}`);
}
const modeBtns = [...cardsSrc.matchAll(/<button class="mode-btn[^"]*" onclick="setMode\('(\w+)'\)">([^<]+)</g)]
  .map((m) => ({ id: m[1], label: ent(clean(m[2])) }));
if (modeBtns.length !== 3) throw new Error("esperava 3 mode-btns");
const cards = {
  eyebrow: ent(grab(cardsSrc, /class="eyebrow">([^<]+)</, "cards-eyebrow")),
  titulo: ent(clean(semEm(grab(cardsSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "cards-titulo")))),
  sub: ent(clean(grab(cardsSrc, /class="subtitle">([\s\S]*?)<\/p>/, "cards-sub"))),
  sevLabels: SEV_LABELS,
  decks: modeBtns.map((m) => ({ id: m.id, label: m.label, cats: C_CATS[m.id], defaults: C_DEFAULTS[m.id] })),
};

// ═══ escrever ═══
const w = (file, obj) => {
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(obj, null, 1) + "\n");
  console.log("✓", file, Math.round(JSON.stringify(obj).length / 1024) + "kB");
};
w("asma.json", { id: "asma", titulo: "Asma", menu });
w("asma-guia.json", { header: guiaHeader, tabs: guiaTabs, foot: guiaFoot });
w("asma-algoritmo.json", { header: algoHeader, pops: algoPops, glossarioHtml: algoGlossHtml, foot: algoFoot });
w("asma-quiz.json", quiz);
w("asma-flashcards.json", flashcards);
w("asma-cards.json", cards);

console.log("\nresumo: guia tabs", guiaTabs.length, "· pops", algoPops.length,
  "· casos", CASES.length, "· dicas", Object.keys(DEFAULT_TIPS).length,
  "· flash", CRONICA.length + "+" + AGUDA.length,
  "· cards", Object.values(esperados).join("/"),
  "· gloss guia 30 · gloss algo 33 · pharma 28+22");
