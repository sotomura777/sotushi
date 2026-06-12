// Extrator do conteúdo clínico do submódulo Anemia (HTML originais) → JSON em /conteudo/cronicas.
// Todo o texto clínico vem recortado do original (nunca retranscrito à mão).
// Guia teórico e Algoritmo visual são HTML estático: fatiam-se os painéis inteiros e a
// interatividade (subtabs, acordeões, pesquisas, chips, calculadoras) fica para handlers
// delegados no React. O Estuda-por-padrão tem TYPES próprios (16, com dc-normo) — o quiz
// de casos-por-padrões usa os seus (15, do próprio ficheiro).
// Saídas: anemia.json (menu+hubs), anemia-guia.json, anemia-algoritmo.json,
//         anemia-padroes.json, anemia-casos.json, anemia-casos-padroes.json,
//         anemia-flashcards.json, anemia-cards.json.
import fs from "fs";
import vm from "vm";
import path from "path";

const DIR = "/Users/pedroferreira/Downloads/Anemia ";
const OUT = "/Users/pedroferreira/Desktop/medguia/conteudo/cronicas";

const homeSrc = fs.readFileSync(path.join(DIR, "anemia_home-3.html"), "utf8");
const guiaSrc = fs.readFileSync(path.join(DIR, "anemia_guia_v2-2.html"), "utf8");
const algoSrc = fs.readFileSync(path.join(DIR, "anemia_algoritmo_visual-22.html"), "utf8");
const padraoSrc = fs.readFileSync(path.join(DIR, "anemia_estuda_padrao-3.html"), "utf8");
const cardsSrc = fs.readFileSync(path.join(DIR, "3- cards+flahs/CARDS_ANEMIA_v2.html"), "utf8");
const flashSrc = fs.readFileSync(path.join(DIR, "3- cards+flahs/anemia_flashcards.html"), "utf8");
const casosSrc = fs.readFileSync(path.join(DIR, "4- perguntas\\/anemia_casos_gerais-2.html"), "utf8");
const cpadroesSrc = fs.readFileSync(path.join(DIR, "4- perguntas\\/anemia_casos_padroes-2.html"), "utf8");

// ── helpers (mesmo padrão do extrair-asma) ──
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
const contar = (s, re) => (s.match(re) || []).length;
function verificarSemHandlers(html, label) {
  if (/ on(click|input|keyup|change|submit)=/.test(html)) throw new Error("handler inline remanescente em " + label);
  return html;
}
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

// ═══ MENU (home): 4 cartões + hubs de cards e casos (2 subcartões cada) ═══
const rotaHome = homeSrc.slice(homeSrc.indexOf('data-route="home"'), homeSrc.indexOf('data-route="algoritmo"'));
function menuCard(cls, destino, disponivel) {
  const i = rotaHome.indexOf(`class="card ${cls}"`);
  if (i < 0) throw new Error("card do menu não encontrado: " + cls);
  const fim = rotaHome.indexOf('class="card-footer"', i);
  const seg = rotaHome.slice(i, rotaHome.indexOf("</div>", rotaHome.indexOf("card-arrow", fim)));
  return {
    destino,
    disponivel,
    badge: clean(grab(seg, /class="card-num-badge">([\s\S]*?)<\/span>/, cls + "-badge")),
    eyebrow: grab(seg, /class="card-eyebrow">([^<]+)</, cls + "-eyebrow"),
    titulo: grab(seg, /class="card-title">([^<]+)</, cls + "-titulo"),
    sub: clean(grab(seg, /class="card-sub">([\s\S]*?)<\/p>/, cls + "-sub")),
    features: [...seg.matchAll(/<span class="feat-dot"><\/span>([\s\S]*?)<\/div>/g)].map((m) => clean(m[1])),
    cta: grab(seg, /class="card-cta">([^<]+)</, cls + "-cta"),
  };
}
// hubs: subcartões identificados pelo href do original → destino interno
const DESTINOS_HREF = {
  "anemia_algoritmo_visual.html": "algoritmo-visual",
  "anemia_estuda_padrao.html": "estuda-padrao",
  "CARDS_ANEMIA_v2.html": "cards",
  "anemia_flashcards.html": "flashcards",
  "anemia_casos_gerais.html": "casos-gerais",
  "anemia_casos_padroes.html": "casos-padroes",
};
function hub(rota, proxima) {
  const ini = homeSrc.indexOf(`data-route="${rota}"`);
  if (ini < 0) throw new Error("rota não encontrada: " + rota);
  const fim = proxima ? homeSrc.indexOf(`data-route="${proxima}"`) : homeSrc.indexOf("</div>\n\n</div>\n\n<script>");
  const seg = homeSrc.slice(ini, fim > ini ? fim : undefined);
  const subcards = [...seg.matchAll(/<a href="([^"]+)" class="subcard">([\s\S]*?)<\/a>/g)].map(([, href, corpo]) => ({
    destino: DESTINOS_HREF[href] ?? (() => { throw new Error("href sem destino: " + href); })(),
    stripe: grab(corpo, /class="card-stripe" style="background:([^"]+)"/, rota + "-stripe"),
    tag: clean(grab(corpo, /class="subcard-tag[^"]*">([\s\S]*?)<\/span>/, rota + "-tag")),
    tagExt: /class="subcard-tag ext"/.test(corpo),
    titulo: grab(corpo, /class="subcard-title">([^<]+)</, rota + "-titulo"),
    sub: clean(grab(corpo, /class="subcard-sub">([\s\S]*?)<\/p>/, rota + "-sub")),
    cta: grab(corpo, /class="card-cta">([^<]+)</, rota + "-cta"),
  }));
  if (subcards.length !== 2) throw new Error(`hub ${rota}: esperava 2 subcartões, vieram ${subcards.length}`);
  return {
    crumb: grab(seg, /class="crumb-here">([^<]+)</, rota + "-crumb"),
    eyebrow: grab(seg, /class="hub-eyebrow">([^<]+)</, rota + "-eyebrow"),
    titulo: clean(semEm(grab(seg, /class="hub-title">([\s\S]*?)<\/h2>/, rota + "-titulo"))),
    sub: clean(grab(seg, /class="hub-sub">([\s\S]*?)<\/p>/, rota + "-sub")),
    subcards,
  };
}
const menu = {
  pill: clean(grab(rotaHome, /class="hero-pill-text">([\s\S]*?)<\/span>/, "pill")),
  heroTitulo: clean(semEm(grab(rotaHome, /<h1 class="hero-title">([\s\S]*?)<\/h1>/, "heroTitulo"))),
  heroSub: clean(grab(rotaHome, /class="hero-sub">([\s\S]*?)<\/p>/, "heroSub")),
  eyebrow: grab(rotaHome, /class="cards-eyebrow">([^<]+)</, "menu-eyebrow"),
  label: clean(semEm(grab(rotaHome, /class="cards-label">([\s\S]*?)<\/div>/, "menu-label"))),
  cartoes: [
    menuCard("theory", "guia", true),
    menuCard("algo", "algoritmo", true),
    menuCard("cards", "cards", true),
    menuCard("quiz", "casos", true),
  ],
  fontesTags: [...rotaHome.matchAll(/class="source-tag">([\s\S]*?)<\/span>/g)].map((m) => clean(m[1])),
  metaItens: [...rotaHome.matchAll(/class="meta-item">([\s\S]*?)<\/span>/g)].map((m) => clean(m[1])),
  rodape: {
    comoTitulo: grab(rotaHome, /class="footer-title">([^<]+)</, "foot-titulo"),
    comoTexto: clean(grab(rotaHome, /class="footer-body">([\s\S]*?)<\/p>/, "foot-texto")),
    legal: clean(grab(rotaHome, /class="legal">([\s\S]*?)<\/p>/, "legal")),
  },
};
const hubs = { algoritmo: hub("algoritmo", "casos"), casos: hub("casos", "cards"), cards: hub("cards", null) };
if (menu.fontesTags.length !== 4) throw new Error("esperava 4 source-tags, vieram " + menu.fontesTags.length);
if (menu.metaItens.length !== 4) throw new Error("esperava 4 meta-itens, vieram " + menu.metaItens.length);
for (const c of menu.cartoes) if (c.features.length !== 4) throw new Error("cartão " + c.destino + " sem 4 features");

// ═══ GUIA TEÓRICO: 7 painéis fatiados inteiros (interatividade → delegação no React) ═══
const guiaTabLabels = [...guiaSrc.matchAll(/<button class="tab[^"]*" data-tab="([a-z]+)"><span class="tab-num">\d+<\/span>\s*([\s\S]*?)<\/button>/g)]
  .map((m) => ({ id: m[1], label: clean(m[2]).replace(/&amp;/g, "&") }));
if (guiaTabLabels.length !== 7) throw new Error("esperava 7 tabs no guia, vieram " + guiaTabLabels.length);

const guiaCorpo = guiaSrc.slice(guiaSrc.indexOf("<body>"), guiaSrc.indexOf("<script>"));
const guiaPaneis = fatiarMarcadores(guiaCorpo, /<section class="panel[^"]*" id="([a-z]+)">/g);
if (guiaPaneis.length !== 7) throw new Error("esperava 7 panels no guia, vieram " + guiaPaneis.length);

const guiaTabs = guiaPaneis.map((p, i) => {
  if (p.attr !== guiaTabLabels[i].id) throw new Error("ordem painel/tab divergente: " + p.attr);
  return { id: p.attr, label: guiaTabLabels[i].label, html: verificarSemHandlers(innerDe(p.html, "</section>"), "guia-" + p.attr) };
});
const guiaHeader = {
  eyebrow: grab(guiaSrc, /class="eyebrow">([^<]+)</, "guia-eyebrow"),
  titulo: clean(semEm(grab(guiaSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "guia-titulo"))),
  subtitulo: clean(grab(guiaSrc, /class="subtitle">([\s\S]*?)<\/p>/, "guia-sub")),
};

const guiaJunto = guiaTabs.map((t) => t.html).join("");
if (contar(guiaJunto, /class="subpanel/g) !== 16) throw new Error("subpanels do guia ≠ 16");
if (contar(guiaJunto, /class="subsubpanel/g) !== 30) throw new Error("subsubpanels do guia ≠ 30");
if (contar(guiaJunto, /class="accordion-item/g) !== 10) throw new Error("accordion-items do guia ≠ 10");
if (contar(guiaTabs.find((t) => t.id === "glossario").html, /class="gloss-card/g) !== 17) throw new Error("gloss-cards ≠ 17");
for (const idEsperado of ["search-faqs", "search-faqs-msg", "search-glossario", "gloss-grid", "gloss-count"]) {
  if (!guiaTabs.some((t) => t.html.includes(`id="${idEsperado}"`))) throw new Error("id em falta no guia: " + idEsperado);
}

// ═══ ALGORITMO VISUAL: 3 morfologias fatiadas; onclick → data-* para delegação ═══
function transfAlgo(html, label) {
  let out = html;
  out = out.replace(/ onclick="scrollToCause\('([a-z0-9-]+)'\)"/g, ' data-an-cause="$1"');
  out = out.replace(/ onclick="scrollToThomas\(\)"/g, ' data-an-thomas="1"');
  out = out.replace(/ onclick="toggleSideCalc\(this\)"/g, ' data-an-sidecalc="1"');
  // calculadoras: a delegação no React identifica pelo id do input — remover só o atributo
  out = out.replace(/ oninput="calc(IRCInline|IRC|ThomasNormo|ThomasInline|Thomas)\(\)"/g, "");
  return verificarSemHandlers(out, label);
}
const algoCorpo = algoSrc.slice(algoSrc.indexOf("<body>"), algoSrc.indexOf("<script>"));
const popBtns = [...algoCorpo.matchAll(/<button class="pop-tab[^"]*" data-pop="([a-z-]+)"[^>]*>([\s\S]*?)<\/button>/g)]
  .map((m) => ({ id: m[1], labelHtml: clean(m[2]) }));
if (popBtns.length !== 3) throw new Error("esperava 3 pop-tabs, vieram " + popBtns.length);

const popsRaw = fatiarMarcadores(algoCorpo, /<div class="pop-content[^"]*" id="pop-([a-z-]+)">/g);
if (popsRaw.length !== 3) throw new Error("esperava 3 pop-contents, vieram " + popsRaw.length);
// o último pop termina onde começa o foot
const idxFoot = popsRaw[2].html.indexOf('<div class="foot">');
if (idxFoot < 0) throw new Error("foot do algoritmo não encontrado");
const footSeg = popsRaw[2].html.slice(idxFoot);
popsRaw[2].html = popsRaw[2].html.slice(0, idxFoot);

const algoPops = popsRaw.map((p, i) => {
  if (p.attr !== popBtns[i].id) throw new Error("ordem pop/btn divergente: " + p.attr);
  return { id: p.attr, labelHtml: popBtns[i].labelHtml, html: transfAlgo(innerDe(p.html, "</div>"), "algo-" + p.attr) };
});
const algoFoot = clean(grab(footSeg, /<div class="foot">([\s\S]*?)<\/div>/, "algo-foot"));

const algoHeader = {
  ribbon: clean(grab(algoSrc, /class="ribbon">([\s\S]*?)<\/div>/, "ribbon").replace(/<svg[\s\S]*?<\/svg>/, "")),
  eyebrow: grab(algoSrc, /class="eyebrow">([^<]+)</, "algo-eyebrow"),
  titulo: clean(semEm(grab(algoSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "algo-titulo"))),
  subtitulo: clean(grab(algoSrc, /class="subtitle">([\s\S]*?)<\/p>/, "algo-sub")),
  legalBanner: clean(grab(algoSrc, /class="legal-banner">[\s\S]*?<div>([\s\S]*?)<\/div>/, "legal-banner")),
};

// painel de valores de referência do algoritmo (próprio; o do quiz vem do outro ficheiro)
const algoRefSeg = grab(algoSrc, /<div class="ref-panel" id="ref-panel">([\s\S]*?)<\/div>\s*<\/body>/, "algo-ref-panel");
const algoRef = {
  titulo: grab(algoRefSeg, /class="ref-panel-title">([^<]+)</, "algo-ref-titulo"),
  html: verificarSemHandlers(algoRefSeg.slice(algoRefSeg.indexOf('<div class="ref-section">')), "algo-ref"),
};

const algoJunto = algoPops.map((p) => p.html).join("");
if (contar(algoJunto, /data-an-cause=/g) !== 34) throw new Error("scrollToCause ≠ 34");
if (contar(algoJunto, /data-an-sidecalc=/g) !== 3) throw new Error("toggleSideCalc ≠ 3");
if (contar(algoJunto, /data-cause=/g) !== 28) throw new Error("linhas data-cause ≠ 28");
if (contar(algoJunto, /class="chip[ "]/g) !== 43) throw new Error("chips ≠ 43");
if (contar(algoJunto, /data-branch/g) !== 15) throw new Error("data-branch ≠ 15");
for (const id of ["thomas-stfr", "thomas-fer", "thomas-result", "thomas-stfr-inline", "thomas-fer-inline",
  "thomas-result-inline", "thomas-stfr-normo", "thomas-fer-normo", "thomas-result-normo",
  "irc-ret-inline", "irc-hb-inline", "irc-hbnorm-inline", "irc-result-inline", "thomas-calc"]) {
  if (!algoJunto.includes(`id="${id}"`)) throw new Error("id de calculadora em falta: " + id);
}

// ═══ ESTUDA POR PADRÃO: 16 tipos + distinções pairwise + strings de UI do original ═══
const P_TYPES = vm.runInNewContext("(" + literalAfter(padraoSrc, /const TYPES = \[/) + ")", {});
const P_DIST = vm.runInNewContext("(" + literalAfter(padraoSrc, /const DISTINCTIONS = \{/) + ")",
  { pairKey: (a, b) => [a, b].sort().join("|") });
if (P_TYPES.length !== 16) throw new Error("esperava 16 tipos no estuda-padrão, vieram " + P_TYPES.length);
P_TYPES.forEach((t) => {
  for (const c of ["id", "cat", "catLabel", "name", "meta", "pattern", "mechanism", "case"])
    if (t[c] === undefined) throw new Error(`tipo ${t.id || "?"} sem campo ${c}`);
});
for (const k of Object.keys(P_DIST)) {
  const [a, b] = k.split("|");
  if (!P_TYPES.some((t) => t.id === a) || !P_TYPES.some((t) => t.id === b))
    throw new Error("distinção com tipo desconhecido: " + k);
}
const P_MAX = parseInt(grab(padraoSrc, /const MAX_SELECT = (\d+);/, "max-select"), 10);
const padraoScript = padraoSrc.slice(padraoSrc.indexOf("<script>"));
const padroes = {
  eyebrow: grab(padraoSrc, /class="eyebrow">([^<]+)</, "padrao-eyebrow"),
  titulo: clean(semEm(grab(padraoSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "padrao-titulo"))),
  subtitulo: clean(grab(padraoSrc, /class="subtitle">([\s\S]*?)<\/p>/, "padrao-sub")),
  maxSelect: P_MAX,
  zona: {
    titulo: grab(padraoSrc, /class="selected-zone-header">\s*<span>([^<]+)</, "zona-titulo"),
    hint0: grab(padraoSrc, /class="compare-hint" id="compare-hint">([^<]+)</, "zona-hint0"),
    hint1: grab(padraoScript, /compareHintEl\.textContent = '([^']+)';/, "zona-hint1"),
    hintN: grab(padraoScript, /compareHintEl\.textContent = `([^`]+)`;/, "zona-hintN").replace("${selectedIds.length}", "{n}"),
  },
  labels: {
    padrao: grab(padraoScript, /📊 ([^<]+)<\/div>/, "lbl-padrao"),
    mecanismo: grab(padraoScript, /⚙️ ([^<]+)<\/div>/, "lbl-mecanismo"),
    caso: grab(padraoScript, /📝 ([^<]+)<\/div>/, "lbl-caso"),
    distinguir: grab(padraoScript, /🔍 ([^<]+)<\/div>/, "lbl-distinguir"),
    ladoALado: grab(padraoScript, /📊 (Padrões[^<]+)<\/div>/, "lbl-lado"),
    parametro: grab(padraoScript, /<tr><th>([^<]+)<\/th>\$\{types/, "lbl-parametro"),
    comparacao: grab(padraoScript, /class="detail-head-eyebrow">(Comparação[^$]*)\$\{types\.length\} tipos<\/div>/, "lbl-comparacao") + "{n} tipos",
    naoCarat: grab(padraoScript, /font-size: 11\.5px;">([^<]+)<\/span>/, "lbl-naocarat"),
    notaNaoCarat: clean(grab(padraoScript, /font-style: italic;">("não característico"[^<]+)<\/div>/, "lbl-nota")),
  },
  catLabels: vm.runInNewContext("(" + grab(padraoScript, /const catLabels = (\{[^}]+\});/, "catLabels") + ")", {}),
  fallbackDiffCat: grab(padraoScript, /tip = `(<b>VGM separa<\/b>[^`]+)`;/, "fallback-diff")
    .replace("${a.name}", "{a}").replace("${b.name}", "{b}")
    .replace("${catLabels[a.cat]}", "{catA}").replace("${catLabels[b.cat]}", "{catB}"),
  fallbackSameCat: grab(padraoScript, /tip = `(Ambas [^`]+)`;/, "fallback-same")
    .replace("${catLabels[a.cat]}", "{cat}"),
  tipos: P_TYPES,
  distincoes: P_DIST,
};
if (!padroes.labels.ladoALado || padroes.labels.padrao === padroes.labels.ladoALado)
  throw new Error("labels lado-a-lado/padrão trocados");

// ═══ CASOS POR PADRÕES (quiz): TYPES + EXTRA_QUIZ + painel de valores de referência ═══
const TYPES = evalLit(literalAfter(cpadroesSrc, /const TYPES = \[/));
const EXTRA_QUIZ = evalLit(literalAfter(cpadroesSrc, /const EXTRA_QUIZ = \[/));
if (TYPES.length !== 15) throw new Error("esperava 15 tipos, vieram " + TYPES.length);
if (EXTRA_QUIZ.length !== 5) throw new Error("esperava 5 extra-quiz, vieram " + EXTRA_QUIZ.length);
TYPES.forEach((t) => {
  for (const c of ["id", "cat", "catLabel", "name", "meta", "mechanism", "quizCaseLabs"])
    if (t[c] === undefined) throw new Error(`tipo ${t.id || "?"} sem campo ${c}`);
});
EXTRA_QUIZ.forEach((q) => { if (!TYPES.some((t) => t.id === q.typeId)) throw new Error("extra-quiz com typeId desconhecido: " + q.typeId); });
const nCats = { micro: 5, normo: 6, macro: 4 };
for (const [c, n] of Object.entries(nCats))
  if (TYPES.filter((t) => t.cat === c).length !== n) throw new Error(`tipos ${c} ≠ ${n}`);

// painel de valores de referência (flutuante, do original)
const refSeg = grab(cpadroesSrc, /<div class="ref-panel" id="ref-panel">([\s\S]*?)<\/div>\s*<\/body>/, "ref-panel");
const ref = {
  titulo: grab(refSeg, /class="ref-panel-title">([^<]+)</, "ref-titulo"),
  html: verificarSemHandlers(refSeg.slice(refSeg.indexOf('<div class="ref-section">')), "ref-panel"),
};
if ((ref.html.match(/class="ref-section"/g) || []).length !== 5) throw new Error("ref-sections ≠ 5");

// o quiz só usa estes campos dos tipos (o resto pertence ao "estuda por padrão", fora do âmbito)
const tipos = TYPES.map((t) => ({
  id: t.id, cat: t.cat, catLabel: t.catLabel, name: t.name, meta: t.meta,
  mechanism: t.mechanism, quizCaseLabs: t.quizCaseLabs,
}));
const casosPadroes = {
  eyebrow: grab(cpadroesSrc, /class="eyebrow">([^<]+)</, "cpadroes-eyebrow"),
  titulo: clean(semEm(grab(cpadroesSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "cpadroes-titulo"))),
  subtitulo: clean(grab(cpadroesSrc, /class="subtitle">([\s\S]*?)<\/p>/, "cpadroes-sub")),
  pergunta: clean(grab(cpadroesSrc, /class="quiz-question">([^<]+?)<\/div>/, "cpadroes-pergunta")),
  tipos,
  extraQuiz: EXTRA_QUIZ,
  ref,
};

// ═══ CASOS GERAIS (formato QuizPNA) ═══
const CASES = evalLit(literalAfter(casosSrc, /const CASES = \[/));
const DEFAULT_TIPS = evalLit(literalAfter(casosSrc, /const DEFAULT_TIPS = \{/));
if (CASES.length !== 30) throw new Error("esperava 30 casos, vieram " + CASES.length);
if (Object.keys(DEFAULT_TIPS).length !== 6) throw new Error("esperava 6 categorias de dicas, vieram " + Object.keys(DEFAULT_TIPS).length);
CASES.forEach((c, i) => {
  if (!c.id || !c.vignette || !c.stem || !Array.isArray(c.options)) throw new Error("caso malformado: " + i);
  if (c.options.length !== 5) throw new Error("caso sem 5 opções: " + c.id);
  if (c.options.filter((o) => o.correct).length !== 1) throw new Error("caso sem resposta única: " + c.id);
});
const casos = {
  titulo: clean(semEm(grab(casosSrc, /<h1 class="title"[^>]*>([\s\S]*?)<\/h1>/, "casos-titulo"))),
  sub: clean(grab(casosSrc, /class="subtitle"[^>]*>([\s\S]*?)<\/p>/, "casos-sub")),
  dicas: DEFAULT_TIPS,
  dicasEditaveis: true,
  dicasHint: grab(casosSrc, /class="tips-add-hint">([^<]+)</, "tips-hint"),
  casos: CASES,
};

// ═══ FLASHCARDS (3 baralhos por morfologia, q/a/e) ═══
const CARDS_DATA = evalLit(literalAfter(flashSrc, /const CARDS_DATA = \{/));
const flashTabs = [...flashSrc.matchAll(/<button class="tab[^"]*" onclick="setCat\('(\w+)'\)">([^<]+)</g)]
  .map((m) => ({ id: m[1], label: clean(m[2]) }));
if (flashTabs.length !== 3) throw new Error("esperava 3 tabs de flashcards, vieram " + flashTabs.length);
for (const t of flashTabs) {
  if (!Array.isArray(CARDS_DATA[t.id])) throw new Error("flashcards sem baralho: " + t.id);
  if (CARDS_DATA[t.id].length !== 15) throw new Error(`flashcards ${t.id} ≠ 15`);
  CARDS_DATA[t.id].forEach((c, i) => { if (!c.q || !c.a || !c.e) throw new Error(`flashcard ${t.id}[${i}] incompleto`); });
}
const flashcards = {
  eyebrow: grab(flashSrc, /class="eyebrow">([^<]+)</, "flash-eyebrow"),
  titulo: clean(semEm(grab(flashSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "flash-titulo"))),
  decks: flashTabs.map((t) => ({ id: t.id, label: t.label, cards: CARDS_DATA[t.id] })),
};

// ═══ CARDS DE ESTUDO (3 baralhos por morfologia, formato CardsDeck) ═══
const C_CATS = evalLit(literalAfter(cardsSrc, /var CATS = \{/));
const C_DEFAULTS = evalLit(literalAfter(cardsSrc, /var DEFAULTS = \{/));
const esperados = { micro: 5, normo: 6, macro: 4 };
for (const [k, n] of Object.entries(esperados)) {
  if ((C_DEFAULTS[k] || []).length !== n) throw new Error(`cards ${k}: esperava ${n}, vieram ${(C_DEFAULTS[k] || []).length}`);
  C_DEFAULTS[k].forEach((c, i) => {
    for (const campo of ["cat", "title", "sub", "sections", "backTitle", "backHtml"])
      if (c[campo] === undefined) throw new Error(`card ${k}[${i}] sem ${campo}`);
    if (!C_CATS[k][c.cat]) throw new Error(`card ${k}[${i}] com cat desconhecida: ${c.cat}`);
  });
}
const modeBtns = [...cardsSrc.matchAll(/<button class="mode-btn[^"]*" onclick="setMode\('(\w+)'\)">([^<]+)</g)]
  .map((m) => ({ id: m[1], label: clean(m[2]) }));
if (modeBtns.length !== 3) throw new Error("esperava 3 mode-btns, vieram " + modeBtns.length);
const cards = {
  eyebrow: grab(cardsSrc, /class="eyebrow">([^<]+)</, "cards-eyebrow"),
  titulo: clean(semEm(grab(cardsSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "cards-titulo"))),
  sub: clean(grab(cardsSrc, /class="subtitle">([\s\S]*?)<\/p>/, "cards-sub")),
  decks: modeBtns.map((m) => ({ id: m.id, label: m.label, cats: C_CATS[m.id], defaults: C_DEFAULTS[m.id] })),
};

// ═══ escrever ═══
const w = (file, obj) => {
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(obj, null, 1) + "\n");
  console.log("✓", file, Math.round(JSON.stringify(obj).length / 1024) + "kB");
};
w("anemia.json", { id: "anemia", titulo: "Anemia", menu, hubs });
w("anemia-guia.json", { header: guiaHeader, tabs: guiaTabs });
w("anemia-algoritmo.json", { header: algoHeader, pops: algoPops, foot: algoFoot, ref: algoRef });
w("anemia-padroes.json", padroes);
w("anemia-casos.json", casos);
w("anemia-casos-padroes.json", casosPadroes);
w("anemia-flashcards.json", flashcards);
w("anemia-cards.json", cards);

console.log("\nresumo: guia tabs", guiaTabs.length, "· pops", algoPops.length,
  "· tipos estuda", P_TYPES.length, "· distinções", Object.keys(P_DIST).length,
  "· casos", CASES.length, "· dicas", Object.keys(DEFAULT_TIPS).length,
  "· tipos quiz", tipos.length, "+", EXTRA_QUIZ.length, "extra",
  "· flash", flashTabs.map((t) => CARDS_DATA[t.id].length).join("+"),
  "· cards", Object.values(esperados).join("/"));
