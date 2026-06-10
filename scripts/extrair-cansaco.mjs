// Extrator do conteúdo clínico do módulo Cansaço (5 HTML single-file) → JSON em /conteudo/urgencia.
// Todo o texto clínico vem avaliado/recortado do original (nunca retranscrito à mão).
// Saídas: cansaco.json (guia+cards+flashcards+fontes+glossário+menu),
//         cansaco-anamnese.json (dados do treino), cansaco-quiz.json (casos+dicas).
import fs from "fs";
import vm from "vm";
import path from "path";

const DIR = "/Users/pedroferreira/Downloads/casanaço - sintoma";
const OUT = "/Users/pedroferreira/Desktop/medguia/conteudo/urgencia";
const TMP = "/tmp/cansaco-extract";
fs.mkdirSync(TMP, { recursive: true });

const guiaSrc = fs.readFileSync(path.join(DIR, "cansaço guia + cards .html"), "utf8");
const homeSrc = fs.readFileSync(path.join(DIR, "cansaço home.html"), "utf8");
const anamSrc = fs.readFileSync(path.join(DIR, "anamnese-v3-4-2.html"), "utf8");
const quizSrc = fs.readFileSync(path.join(DIR, "cansaco_quiz_pna-3.html"), "utf8");
const flashSrc = fs.readFileSync(path.join(DIR, "cansaco_flashcards.html"), "utf8");

// ── helpers (mesmo padrão do extrair-analises-v4) ──
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

function functionSource(src, name) {
  const idx = src.indexOf("function " + name);
  if (idx < 0) throw new Error("função não encontrada: " + name);
  const start = src.indexOf("{", idx);
  let depth = 0, inStr = null;
  for (let j = start; j < src.length; j++) {
    const c = src[j], p = src[j - 1];
    if (inStr) { if (c === inStr && p !== "\\") inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "/" && src[j + 1] === "/") { while (j < src.length && src[j] !== "\n") j++; continue; }
    if (c === "/" && src[j + 1] === "*") { j += 2; while (j < src.length && !(src[j] === "*" && src[j + 1] === "/")) j++; j++; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(idx, j + 1); }
  }
  throw new Error("função não fechou: " + name);
}

// extrai 1.º grupo de um regex ou rebenta (fidelidade: nada pode falhar em silêncio)
function grab(src, re, label) {
  const m = re.exec(src);
  if (!m) throw new Error("grab falhou: " + (label || re));
  return m[1];
}
const clean = (s) => s.replace(/\s+/g, " ").trim();

// ═══ 1. HTML do guia: avaliar buildCansacoPage e fatiar por tab ═══
const buildFn = functionSource(guiaSrc, "buildCansacoPage");
const sandbox = { encodeURIComponent };
vm.runInNewContext(buildFn + "; this.__html = buildCansacoPage({}, {});", sandbox);
const fullHtml = sandbox.__html;

function sliceBlocks(html, marker) {
  const out = [];
  const idxs = [];
  let m;
  const re = new RegExp(marker, "g");
  while ((m = re.exec(html))) idxs.push({ at: m.index, attr: m[1] });
  for (let k = 0; k < idxs.length; k++) {
    const start = idxs[k].at;
    const end = k + 1 < idxs.length ? idxs[k + 1].at : html.length;
    out.push({ attr: idxs[k].attr, html: html.slice(start, end) });
  }
  return out;
}
const tabs = {};
for (const b of sliceBlocks(fullHtml, '<div class="tab-content[^"]*" data-tab-content="(\\d)">'))
  tabs[b.attr] = b.html;

// remove o invólucro exterior de um bloco (até ao primeiro > e o(s) </div> finais em excesso)
function inner(html, opens) {
  let s = html.slice(html.indexOf(">") + 1);
  // corta divs de fecho órfãos no fim (fechos do wrapper)
  for (let i = 0; i < opens; i++) s = s.replace(/<\/div>\s*$/, "");
  return s.trim();
}

// ── transformação de estilos inline → classes (mapa exaustivo; estilo desconhecido = erro) ──
const STYLE_MAP = {
  "background:rgba(76,29,149,0.04);": "ca-ac-soft",
  "background:rgba(76,29,149,0.06);border-left-color:#4c1d95;": "ca-ac-soft ca-bl-a",
  "background:rgba(76,29,149,0.06);border-left-color:#4c1d95;color:#4c1d95;": "ca-ac-soft ca-bl-a ca-ac-text",
  "background:rgba(76,29,149,0.04);border-left-color:#7c3aed;": "ca-ac-soft ca-bl-a2",
  "background:rgba(76,29,149,0.05);border-left-color:#4c1d95;margin-bottom:24px": "ca-ac-soft ca-bl-a ca-mb24",
  "border-left-color:#4c1d95;": "ca-bl-a",
  "border-left-color:#7c3aed;": "ca-bl-a2",
  "margin-top:24px": "ca-mt24",
  "margin-top:8px": "ca-mt8",
  "margin-bottom:12px": "ca-mb12",
  "font-family:'DM Serif Display',serif;font-size:22px;font-weight:400;color:var(--text);margin-bottom:6px;line-height:1.2;": "",
  "font-size:13px;color:var(--muted);line-height:1.55;margin-bottom:16px": "ca-lead",
  "font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:16px": "ca-lead",
  "margin-top:8px;font-size:14px;color:#4c1d95;": "ca-h3",
  "margin-top:28px;font-size:14px;color:#4c1d95;": "ca-h3 ca-mt28",
  "background:#fdf6e8;border:1px solid #e8d8a0;border-radius:10px;padding:12px 14px;margin-top:28px;font-size:11.5px;line-height:1.6;color:#7a5d09;text-align:justify": "ca-termos",
};
function transformHtml(html, label) {
  let out = html;
  // onclick de acordeões sai (o React trata por delegação)
  out = out.replace(/ onclick="toggleGSec\('[^']*'\)"/g, "");
  // SVGs com stroke roxo fixo → currentColor (cor vem do CSS)
  out = out.replace(/stroke="#4c1d95"/g, 'stroke="currentColor"');
  out = out.replace(/style="([^"]*)"/g, (full, st) => {
    if (!(st in STYLE_MAP)) throw new Error(`estilo não mapeado em ${label}: ${st}`);
    const cls = STYLE_MAP[st];
    return cls ? `data-cls="${cls}"` : "";
  });
  // funde data-cls com class existente
  out = out.replace(/class="([^"]*)"\s+data-cls="([^"]*)"/g, 'class="$1 $2"');
  out = out.replace(/data-cls="([^"]*)"/g, 'class="$1"');
  return out;
}

// ── TAB 1: Guia Teórico (6 painéis) ──
const gtLabels = [...tabs["1"].matchAll(/onclick="switchGtTab\(\d\)">([^<]+)</g)].map((m) => m[1]);
const gtIds = ["definicao", "causas", "alarmes", "diagnosticos", "exame", "investigacao"];
const gtPanels = sliceBlocks(tabs["1"], '<div class="gt-panel[^"]*" data-gt="(\\d)">');
if (gtPanels.length !== 6) throw new Error("esperava 6 gt-panels, vieram " + gtPanels.length);
const guia = gtPanels.map((p, i) => ({
  id: gtIds[i], label: gtLabels[i],
  html: transformHtml(inner(p.html, i === gtPanels.length - 1 ? 2 : 1), "gt-" + gtIds[i]),
}));

// ── TAB 2: Tratamento (intro + 3 sub-painéis) ──
const txIntroRaw = tabs["2"].slice(tabs["2"].indexOf('<div class="g-card">'), tabs["2"].indexOf('<div class="tx-subtabs"'));
const txLabels = [...tabs["2"].matchAll(/data-txt="\d">([^<]+)</g)].map((m) => m[1]);
const txPanels = sliceBlocks(tabs["2"], '<div class="tx-panel[^"]*" data-txp="(\\d)">');
if (txPanels.length !== 3) throw new Error("esperava 3 tx-panels, vieram " + txPanels.length);
const tratamento = {
  introHtml: transformHtml(txIntroRaw.trim(), "tx-intro"),
  paineis: txPanels.map((p, i) => ({
    label: txLabels[i],
    html: transformHtml(inner(p.html, i === txPanels.length - 1 ? 1 : 0), "tx-" + i),
  })),
};

// ── TAB 6: Escalas (3 interativas estruturadas + outras) ──
const PHQ9_ITEMS = evalLit(literalAfter(guiaSrc, /var\s+PHQ9_ITEMS\s*=\s*\[/));
const PHQ9_OPTS = evalLit(literalAfter(guiaSrc, /var\s+PHQ9_OPTS\s*=\s*\[/));
const GAD7_ITEMS = evalLit(literalAfter(guiaSrc, /var\s+GAD7_ITEMS\s*=\s*\[/));
const GAD7_OPTS = evalLit(literalAfter(guiaSrc, /var\s+GAD7_OPTS\s*=\s*\[/));
const PHQ15_ITEMS = evalLit(literalAfter(guiaSrc, /var\s+PHQ15_ITEMS\s*=\s*\[/));
const PHQ15_OPTS = evalLit(literalAfter(guiaSrc, /var\s+PHQ15_OPTS\s*=\s*\[/));

// cabeçalhos dos painéis interativos (badge fonte, nome, descrição)
function escPanelMeta(id) {
  const block = grab(tabs["6"], new RegExp(`<div class="esc-panel[^"]*" data-escpanel="${id}"[^>]*>([\\s\\S]*?)<div id="${id}-widget">`), "esc-" + id);
  return {
    fonte: grab(block, /letter-spacing:0.08em">Interativa<\/span><span[^>]*>([^<]+)<\/span>/, id + "-fonte"),
    nome: grab(block, /<h3[^>]*>([^<]+)<\/h3>/, id + "-nome"),
    desc: grab(block, /<p[^>]*>([^<]+)<\/p>/, id + "-desc"),
  };
}
// interpretação/cut-offs: extraídos do código de escRender (texto vem do original)
const escRenderSrc = functionSource(guiaSrc, "escRender");
function interpsFor(id, maxes) {
  // pares (threshold, label) lidos das cadeias if/else do original
  const seg = grab(escRenderSrc, id === "phq9" ? /if\(id === 'phq9'\)\{([\s\S]*?)\} else if/ : id === "gad7" ? /else if\(id === 'gad7'\)\{([\s\S]*?)\} else \{/ : /else \{\s*(if\(total[\s\S]*?)\}\s*html \+= '<div style="margin-top:16px/, id + "-interp");
  const pairs = [...seg.matchAll(/total <= (\d+)\)\{ interp='([^']+)'/g)].map((m) => ({ ate: +m[1], label: m[2] }));
  const last = grab(seg, /else\{ interp='([^']+)'/, id + "-interp-last");
  pairs.push({ ate: maxes, label: last });
  return pairs;
}
function cutoffsFor(id) {
  const re = id === "phq9"
    ? /phq9'\)\{\s*\n?\s*html \+= '<div style="margin-top:10px[^>]*><b>Cut-offs:<\/b>([^<]+)<\/div>'/
    : id === "gad7"
      ? /gad7'\)\{\s*\n?\s*html \+= '<div style="margin-top:10px[^>]*><b>Cut-offs:<\/b>([^<]+)<\/div>'/
      : /\} else \{\s*\n?\s*html \+= '<div style="margin-top:10px[^>]*><b>Cut-offs:<\/b>([^<]+)<\/div>'/;
  return clean(grab(escRenderSrc, re, id + "-cutoffs"));
}
const avisoQ9 = clean(grab(escRenderSrc, /<b>⚠ Atenção — Pergunta 9 positiva\.<\/b>([^<]+)<\/div>/, "q9-aviso"));
const cabecalhoPerguntas = { phq9: grab(escRenderSrc, /'<div>'\+\(id==='phq15'\?'[^']*':'([^']*)'\)/, "hdr-2sem"), phq15: grab(escRenderSrc, /id==='phq15'\?'([^']*)':'/, "hdr-4sem") };

const interativas = [
  { id: "phq9", tab: "PHQ-9", ...escPanelMeta("phq9"), itens: PHQ9_ITEMS, opcoes: PHQ9_OPTS, max: 27, cabecalho: cabecalhoPerguntas.phq9, interp: interpsFor("phq9", 27), cutoffs: cutoffsFor("phq9"), avisoQ9 },
  { id: "gad7", tab: "GAD-7", ...escPanelMeta("gad7"), itens: GAD7_ITEMS, opcoes: GAD7_OPTS, max: 21, cabecalho: cabecalhoPerguntas.phq9, interp: interpsFor("gad7", 21), cutoffs: cutoffsFor("gad7") },
  { id: "phq15", tab: "PHQ-15", ...escPanelMeta("phq15"), itens: PHQ15_ITEMS, opcoes: PHQ15_OPTS, max: 30, cabecalho: cabecalhoPerguntas.phq15, interp: interpsFor("phq15", 30), cutoffs: cutoffsFor("phq15") },
];

// painel "outras escalas" → estruturado
const outrasBlock = grab(tabs["6"], /<div class="esc-panel" data-escpanel="outras"[^>]*>([\s\S]*)$/, "outras");
const outras = {
  intro: clean(grab(outrasBlock, /<p[^>]*>([\s\S]*?)<\/p>/, "outras-intro")),
  cards: [...outrasBlock.matchAll(/<a href="([^"]+)"[^>]*>(?:<div[^>]*>([^<]*)<\/div>)<div[^>]*>([^<]*)<\/div><div[^>]*>([\s\S]*?)<\/div><div[^>]*><b>Cut-offs?:<\/b>([^<]*)<\/div>/g)]
    .map((m) => ({ url: m[1], eyebrow: m[2], nome: m[3], desc: clean(m[4]), cutoffs: clean(m[5]) })),
};
if (outras.cards.length !== 4) throw new Error("esperava 4 cards de outras escalas, vieram " + outras.cards.length);

const escalas = {
  titulo: grab(tabs["6"], /<h2[^>]*>([^<]+)<\/h2>/, "esc-titulo"),
  sub: grab(tabs["6"], /<\/h2><p[^>]*>([^<]+)<\/p>/, "esc-sub"),
  interativas, outras,
};

// ── TAB 4: Fontes (estruturado a partir das chamadas fonteCard) ──
const fontesArea = guiaSrc.slice(guiaSrc.indexOf('data-tab-content="4">'), guiaSrc.indexOf("/* TAB 5"));
const grupoTitulos = [...fontesArea.matchAll(/<h3 style="[^"]*">([^<]+)<\/h3>/g)].map((m) => m[1]);
const grupoBlocos = fontesArea.split(/<h3 style="[^"]*">[^<]+<\/h3>/).slice(1);
if (grupoTitulos.length !== grupoBlocos.length) throw new Error("fontes: títulos vs blocos");
const reFonteCall = /fonteCard\("([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)"\)/g;
const fontesGrupos = grupoTitulos.map((titulo, i) => ({
  titulo,
  itens: [...grupoBlocos[i].matchAll(reFonteCall)].map((m) => ({
    num: m[1], autores: m[2], titulo: m[3], fonte: m[4], badge: m[5],
    badgeTipo: m[6] === "fonte-badge-strong" ? "forte" : m[6] === "fonte-badge-weak" ? "fraca" : "condicional",
    url: m[7],
  })),
}));
const totalFontes = fontesGrupos.reduce((s, g) => s + g.itens.length, 0);
if (totalFontes !== 20) throw new Error("esperava 20 fontes, vieram " + totalFontes);
const fontes = {
  intro: clean(grab(tabs["4"], /<\/h2><p[^>]*>([\s\S]*?)<\/p>/, "fontes-intro")),
  nota: clean(grab(tabs["4"], /<div class="g-alert g-alert-a"[^>]*>([\s\S]*?)<\/div>/, "fontes-nota")),
  grupos: fontesGrupos,
  termos: clean(grab(tabs["4"], /<b>Termos de uso\.<\/b>([\s\S]*?)<\/div>/, "fontes-termos")),
};

// ── TAB 5: Glossário ──
const GLOSS = evalLit(literalAfter(guiaSrc, /var\s+GLOSS\s*=\s*\[/));
const glossario = {
  titulo: grab(tabs["5"], /<h2[^>]*>([^<]+)<\/h2>/, "glos-titulo"),
  sub: grab(tabs["5"], /<\/h2><p[^>]*>([^<]+)<\/p>/, "glos-sub"),
  termos: GLOSS,
};

// ── Cards (tab 3) + Flashcards ──
const C_CATS = evalLit(literalAfter(guiaSrc, /var\s+C_CATS\s*=\s*\{/));
const C_DEFAULTS = evalLit(literalAfter(guiaSrc, /var\s+C_DEFAULTS\s*=\s*\[/));
const cardsMeta = {
  titulo: grab(tabs["3"], /line-height:1.2;">([^<]+)<\/h2>/, "cards-titulo"),
  sub: grab(tabs["3"], /<p[^>]*>([^<]+)<\/p>/, "cards-sub"),
};
const EXAMPLES = evalLit(literalAfter(flashSrc, /const\s+EXAMPLES\s*=\s*\[/));
const flashIntro = {
  eyebrow: grab(flashSrc, /class="eyebrow">([^<]+)</, "flash-eyebrow"),
  titulo: clean(grab(flashSrc, /<h1 class="title"[^>]*>([\s\S]*?)<\/h1>/, "flash-titulo")).replace(/<\/?em>/g, ""),
};

// ── Home: menu (4 cartões) + rodapé ──
function menuCard(cls, destino) {
  const i = homeSrc.indexOf(`class="card ${cls}"`);
  if (i < 0) throw new Error("card do menu não encontrado: " + cls);
  const seg = homeSrc.slice(i, homeSrc.indexOf("</a>", i));
  return {
    destino,
    badge: clean(grab(seg, /class="card-num-badge">([\s\S]*?)<\/span>/, cls + "-badge")).replace(/&middot;/g, "·"),
    eyebrow: grab(seg, /class="card-eyebrow">([^<]+)</, cls + "-eyebrow"),
    titulo: grab(seg, /class="card-title">([^<]+)</, cls + "-titulo"),
    sub: clean(grab(seg, /class="card-sub">([\s\S]*?)<\/p>/, cls + "-sub")),
    features: [...seg.matchAll(/<span class="feat-dot"><\/span>([\s\S]*?)<\/div>/g)].map((m) => clean(m[1]).replace(/&middot;/g, "·")),
    cta: grab(seg, /class="card-cta">([^<]+)</, cls + "-cta"),
  };
}
// modal "Como queres estudar?" (cartão Cards do menu)
const moCards = [...homeSrc.matchAll(/class="mo-badge">([^<]+)<\/span>\s*<div class="mo-name">([^<]+)<\/div>\s*<div class="mo-desc">([^<]+)<\/div>[\s\S]*?class="mo-cta">([^<]+)</g)]
  .map((m) => ({ badge: m[1], nome: m[2], desc: clean(m[3]), cta: m[4] }));
if (moCards.length !== 2) throw new Error("esperava 2 opções no modal de cards, vieram " + moCards.length);
const modalCards = {
  eyebrow: grab(homeSrc, /class="modal-eyebrow">([^<]+)</, "modal-eyebrow"),
  titulo: clean(grab(homeSrc, /class="modal-title">([\s\S]*?)<\/h2>/, "modal-titulo")).replace(/<\/?em>/g, ""),
  sub: grab(homeSrc, /class="modal-sub">([^<]+)</, "modal-sub"),
  opcoes: moCards,
};

const menu = {
  pill: clean(grab(homeSrc, /class="hero-pill-text">([\s\S]*?)<\/span>/, "pill")).replace(/&middot;/g, "·").replace(/&amp;/g, "&"),
  modalCards,
  heroSub: clean(grab(homeSrc, /class="hero-sub">([\s\S]*?)<\/p>/, "heroSub")),
  eyebrow: grab(homeSrc, /class="cards-eyebrow">([^<]+)</, "menu-eyebrow"),
  label: clean(grab(homeSrc, /class="cards-label">([\s\S]*?)<\/div>/, "menu-label")).replace(/<\/?em>/g, ""),
  cartoes: [menuCard("theory", "guia"), menuCard("anamnese", "anamnese"), menuCard("cards", "cards"), menuCard("quiz", "quiz")],
  rodape: {
    comoTitulo: grab(homeSrc, /class="footer-title">([^<]+)</, "foot-titulo"),
    comoTexto: clean(grab(homeSrc, /class="footer-body">([\s\S]*?)<\/p>/, "foot-texto")),
    legal: clean(grab(homeSrc, /class="legal">([\s\S]*?)<\/p>/, "legal")).replace(/&middot;/g, "·"),
  },
};

// subtítulo da página do guia (no buildCansacoPage)
const guiaSub = clean(grab(fullHtml, /<\/h1><p style="font-size:14px[^>]*>([\s\S]*?)<\/p>/, "guia-sub"));

// ═══ cansaco.json ═══
const cansaco = {
  id: "cansaco",
  titulo: "Cansaço / Fadiga",
  menu,
  guiaSub,
  guia,
  tratamento,
  escalas,
  cards: { ...cardsMeta, cats: C_CATS, defaults: C_DEFAULTS },
  flashcards: { ...flashIntro, exemplos: EXAMPLES },
  fontes,
  glossario,
};

// ═══ cansaco-anamnese.json ═══
const SYMS = evalLit(literalAfter(anamSrc, /var\s+SYMS\s*=\s*\[/));
const ALMS = evalLit(literalAfter(anamSrc, /var\s+ALMS\s*=\s*\[/));
const DRGCLS = evalLit(literalAfter(anamSrc, /var\s+DRGCLS\s*=\s*\[/));
const ANTS = evalLit(literalAfter(anamSrc, /var\s+ANTS\s*=\s*\[/));
const AGE_BUCKETS = evalLit(literalAfter(anamSrc, /var\s+AGE_BUCKETS\s*=\s*\[/));
const symCatsIds = evalLit(literalAfter(anamSrc, /var\s+cats\s*=\s*\[/));
const symCatsLabels = evalLit(literalAfter(anamSrc, /var\s+cl\s*=\s*\{/));

// bibliografia (chamadas src() do rBiblio) com os títulos de secção
const biblioSrcFn = functionSource(anamSrc, "rBiblio");
const biblioSecs = [...biblioSrcFn.matchAll(/margin:(?:0 0 10px|24px 0 10px)">([^<]+)<\/div>'/g)].map((m) => m[1]);
const biblioBlocos = biblioSrcFn.split(/margin:(?:0 0 10px|24px 0 10px)">[^<]+<\/div>'/).slice(1);
const reSrcCall = /src\("([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)"\)/g;
const biblio = biblioSecs.map((titulo, i) => ({
  titulo,
  itens: [...biblioBlocos[i].matchAll(reSrcCall)].map((m) => ({ num: m[1], autor: m[2], titulo: m[3], fonte: m[4], tipo: m[5] })),
}));
const totalBiblio = biblio.reduce((s, g) => s + g.itens.length, 0);
if (totalBiblio !== 20) throw new Error("esperava 20 refs na bibliografia da anamnese, vieram " + totalBiblio);
const biblioNota = clean(grab(biblioSrcFn, /<b>Nota\.<\/b>([\s\S]*?)<\/div>'/, "biblio-nota"));
const biblioTermos = clean(grab(biblioSrcFn, /<b>Termos de uso\.<\/b>([\s\S]*?)<\/div>'/, "biblio-termos"));

// ── textos clínicos embutidos no código dos passos (extraídos, nunca retranscritos) ──
// literal equilibrado a partir de um índice arbitrário (para arrays/objetos inline)
function literalAtMarker(src, marker) {
  // recua até ao "[" que abre o array onde o marker está
  const at = src.indexOf(marker);
  if (at < 0) throw new Error("marker não encontrado: " + marker);
  let i = at;
  while (i >= 0 && src[i] !== "[") i--;
  const open = src[i], close = open === "[" ? "]" : "}";
  let depth = 0, inStr = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j], p = src[j - 1];
    if (inStr) { if (c === inStr && p !== "\\") inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error("literal não fechou: " + marker);
}
const desc = (s) => s.replace(/\\'/g, "'"); // strings JS tinham apóstrofes escapadas

const ui = {
  intro: {
    comoTitulo: "Como funciona",
    comoTexto: grab(anamSrc, /intro\+='(Constrói um[^']+)';/, "ctx-como"),
    aviso: grab(anamSrc, /border-radius:8px;line-height:1\.55"><b>(⚠ Não introduzir dados de doentes reais\.)<\/b>([^']+)<\/div>'/, "ctx-aviso") +
      grab(anamSrc, /border-radius:8px;line-height:1\.55"><b>⚠ Não introduzir dados de doentes reais\.<\/b>([^']+)<\/div>'/, "ctx-aviso2"),
    faixaHint: grab(anamSrc, /class="hint" style="margin-top:6px">([^<]+)<\/div>/, "ctx-faixa"),
  },
  caract: {
    tipos: evalLit(literalAtMarker(anamSrc, '{v:"verdadeira",l:"Fadiga verdadeira"')),
    fraqProx: grab(anamSrc, /fraqDist==="prox"\)o\+='<div class="alert alert-y"[^>]*>([^']+)<\/div>'/, "fraq-prox"),
    fraqDist: grab(anamSrc, /fraqDist==="dist"\)o\+='<div class="alert alert-y"[^>]*>([^']+)<\/div>'/, "fraq-dist"),
    fraqGen: grab(anamSrc, /fraqDist==="gen"\)o\+='<div class="alert alert-y"[^>]*>([^']+)<\/div>'/, "fraq-gen"),
    fraqAssim: grab(anamSrc, /fraqSim==="assim"\)o\+='<div class="alert alert-r"[^>]*>([^']+)<\/div>'/, "fraq-assim"),
    fraqSim: grab(anamSrc, /fraqSim==="sim"\)o\+='<div class="alert alert-y"[^>]*>([^']+)<\/div>'/, "fraq-sim"),
    fraqProg: grab(anamSrc, /fraqProg==="prog"\)o\+='<div class="alert alert-r"[^>]*>([^']+)<\/div>'/, "fraq-prog"),
    fraqEst: grab(anamSrc, /fraqProg==="est"\)o\+='<div class="alert alert-y"[^>]*>([^']+)<\/div>'/, "fraq-est"),
    padraoManha: grab(anamSrc, /padrao==="manha"\)o\+='<div class="alert alert-y"[^>]*>([^']+)<\/div>'/, "padrao-manha"),
    padraoFimdia: grab(anamSrc, /padrao==="fimdia"\)o\+='<div class="alert alert-y"[^>]*>([^']+)<\/div>'/, "padrao-fimdia"),
    repousoNao: grab(anamSrc, /repouso===false\)o\+='<div class="alert alert-r"[^>]*>([^']+)<\/div>'/, "repouso-nao"),
  },
  infRec: {
    aviso: grab(anamSrc, /'<div class="alert alert-y" style="margin-bottom:16px">([^']+)<\/div>'/, "inf-aviso"),
    pergunta: grab(anamSrc, /font-size:14px">([^<]+)<\/div><div class="hint" style="margin-bottom:10px">/, "inf-pergunta"),
    perguntaHint: grab(anamSrc, /<div class="hint" style="margin-bottom:10px">([^<]+)<\/div>/, "inf-hint"),
    semInf: "<b>Sem quadro infeccioso recente</b>" + grab(anamSrc, /<b>Sem quadro infeccioso recente<\/b>([^']+)<\/div>'/, "inf-sem"),
    quandoOpts: evalLit(literalAtMarker(anamSrc, '{v:"1-2sem",l:"1-2 semanas"}')),
    oqueOpts: evalLit(literalAtMarker(anamSrc, '{v:"amig",l:"Amigdalite / Faringite"}')),
    alerta3m: grab(anamSrc, /infQuando==="3m"\)o\+='<div class="inf-alert inf-alert-r"[^>]*>([^']+)<\/div>'/, "inf-3m"),
    alertaRash: grab(anamSrc, /infRash===true\)o\+='<div class="inf-alert inf-alert-r"[^>]*>([^']+)<\/div>'/, "inf-rash"),
    alertaAdeno: grab(anamSrc, /infAdeno===true&&\(D\.infOque==="amig"\|\|D\.infOque==="outra"\)\)o\+='<div class="inf-alert inf-alert-y"[^>]*>([^']+)<\/div>'/, "inf-adeno"),
    alertaIct: grab(anamSrc, /infIct===true\)o\+='<div class="inf-alert inf-alert-r"[^>]*>([^']+)<\/div>'/, "inf-ict"),
    alertaExpo: grab(anamSrc, /infExpo===true\)o\+='<div class="inf-alert inf-alert-r"[^>]*>([^']+)<\/div>'/, "inf-expo"),
    combinados: [...anamSrc.matchAll(/alerts\.push\(\{cls:"inf-alert-y",txt:"([^"]+)"\}\)/g)].map((m) => m[1]),
  },
  hab: {
    sonoInsuf: grab(anamSrc, />(Insuficiente\. Recomendado[^<]+)<\/div>'/, "hab-sono"),
    sonoHiper: grab(anamSrc, />(Hipersónia \(>9h\)[^<]+)<\/div>'/, "hab-hiper"),
    sonoMau: grab(anamSrc, /text:"(Sono não reparador:[^"]+)"/, "hab-sonoq"),
    alcExc: grab(anamSrc, /text:"(Álcool excessivo:[^"]+)"/, "hab-alc"),
    sedentario: grab(anamSrc, /text:"(Sedentarismo:[^"]+)"/, "hab-sed"),
    overtraining: grab(anamSrc, /text:"(Overtraining:[^"]+)"/, "hab-over"),
    vegSemSupl: grab(anamSrc, /text:"(Risco défice B12[^"]+)"/, "hab-veg"),
    restritiva: grab(anamSrc, /text:"(Risco défices múltiplos[^"]+)"/, "hab-restr"),
  },
  eo: {
    mucDesc: grab(anamSrc, /has\(D\.muc,"desc"\)\)o\+='<div class="alert alert-r"[^>]*>([^<]+)<\/div>'/, "eo-mucdesc"),
    mucIct: grab(anamSrc, /has\(D\.muc,"ict"\)\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-mucict"),
    acrArr: grab(anamSrc, /D\.acr\.r==="arr"\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-arr"),
    acrTaq: grab(anamSrc, /D\.acr\.f==="taq"\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-taq"),
    acrBra: grab(anamSrc, /D\.acr\.f==="bra"\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-bra"),
    acrSopro: grab(anamSrc, /D\.acr\.s==="sim"\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-sopro"),
    apCrep: grab(anamSrc, /has\(D\.apr\.ra,"Crepitações"\)\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-crep"),
    apMvDim: grab(anamSrc, /D\.apr\.mv==="dim"\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-mv"),
    abdHepato: grab(anamSrc, /has\(D\.abd,"hepato"\)\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-hep"),
    abdEspleno: grab(anamSrc, /has\(D\.abd,"espleno"\)\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-esp"),
    abdMassa: grab(anamSrc, /has\(D\.abd,"massa"\)\)o\+='<div class="alert alert-r"[^>]*>([^<]+)<\/div>'/, "eo-massa"),
    abdAscite: grab(anamSrc, /has\(D\.abd,"ascite"\)\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-ascite"),
    tirAlt: grab(anamSrc, /tir==="tir_boc"\|\|D\.tir==="tir_nod"\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-tir"),
    adenoSupra: grab(anamSrc, /has\(D\.adeno,"Supraclaviculares"\)\)o\+='<div class="alert alert-r"[^>]*>([^<]+)<\/div>'/, "eo-supra"),
    adenoCerv: grab(anamSrc, /has\(D\.adeno,"Cervicais"\)\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-cerv"),
    adenoOutras: grab(anamSrc, /has\(D\.adeno,"Axilares"\)\|\|has\(D\.adeno,"Inguinais"\)\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-axil"),
    miEd: grab(anamSrc, /D\.mi\.ed\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-edema"),
    miTvp: grab(anamSrc, /D\.mi\.tvp\)o\+='<div class="alert alert-r"[^>]*>([^<]+)<\/div>'/, "eo-tvp"),
    obesoOb: grab(anamSrc, /D\.obeso==="ob"\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-obeso"),
    peleHiper: grab(anamSrc, /has\(D\.pele,"Hiperpigmentação"\)\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-hiper"),
    pelePet: grab(anamSrc, /has\(D\.pele,"Petéquias"\)\)o\+='<div class="alert alert-r"[^>]*>([^<]+)<\/div>'/, "eo-pet"),
    peleIct: grab(anamSrc, /has\(D\.pele,"Icterícia"\)\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-pict"),
    peleXer: grab(anamSrc, /has\(D\.pele,"Xerose"\)\)o\+='<div class="alert alert-y"[^>]*>([^<]+)<\/div>'/, "eo-xer"),
  },
  disc: {
    disclaimer: grab(anamSrc, /text-align:justify">(As hipóteses abaixo[\s\S]*?)<\/div>';/, "disc-disclaimer"),
    almLabels: evalLit(literalAfter(anamSrc, /var almLabels=\{/)),
    almHints: evalLit(literalAfter(anamSrc, /var almHints=\{/)),
    almIntro: grab(anamSrc, /(Um sinal de alarme isolado[\s\S]*?justifica investigação dirigida\.)/, "disc-alm-intro"),
    semHipoteses: grab(anamSrc, /(Com os dados que recolheste[\s\S]*?álcool e cafeína\.)/, "disc-sem"),
    header: grab(anamSrc, /(Hipóteses a considerar com base[\s\S]*?abrir o detalhe\.)/, "disc-header"),
    factoresTitulo: "Factores que podem contribuir",
    factoresSub: grab(anamSrc, /(Hábitos, medicação e antecedentes que ajudam[\s\S]*?ponderadas\.)/, "disc-fact-sub"),
    habExpl: evalLit(literalAfter(anamSrc, /var habExpl=\{/)),
    farmExpl: evalLit(literalAfter(anamSrc, /var farmExpl=\{/)),
    antExpl: evalLit(literalAfter(anamSrc, /var antExpl=\{/)),
    q10Titulo: "⚗ Coenzima Q10 — para conhecimento",
    q10Texto: desc(grab(anamSrc, /(Uma meta-análise de 13 RCTs[\s\S]*?relevante para conhecer\.)/, "disc-q10")),
    failMsgs: {
      dep: grab(anamSrc, /"(Não cumpre critério DSM-5[^"]+)"/, "fail-dep"),
      ans: grab(anamSrc, /"(Não cumpre critério essencial[^"]+)"/, "fail-ans"),
      saos: grab(anamSrc, /"(Não tem nenhum sintoma cardinal de SAOS[^"]+)"/, "fail-saos"),
      hipo: grab(anamSrc, /"(Sem sintomas cardinais clássicos[^"]+)"/, "fail-hipo"),
    },
    triades: {
      dep: grab(anamSrc, /"(Tríade depressiva[^"]+)"/, "tri-dep"),
      saos: grab(anamSrc, /"(Tríade clássica de SAOS[^"]+)"/, "tri-saos"),
      hipo: grab(anamSrc, /"(Tríade sugestiva de hipotiroidismo[^"]+)"/, "tri-hipo"),
      ic: grab(anamSrc, /"(Tríade clássica de IC esquerda[^"]+)"/, "tri-ic"),
      neo: grab(anamSrc, /"(Tríade de sintomas B \(cansaço[^"]+)"/, "tri-neo"),
    },
    notas: {
      neoJovem: grab(anamSrc, /nota = "(Em doente jovem[^"]+)"/, "nota-neo-jovem"),
      neoIdoso: grab(anamSrc, /nota = "(Homem ≥70 anos[^"]+)"/, "nota-neo-idoso"),
      neoB: grab(anamSrc, /nota = "(Tríade de sintomas B: linfoma[^"]+)"/, "nota-neo-b"),
      mono: grab(anamSrc, /nota:"(Rash com amoxicilina não é alergia[^"]+)"/, "nota-mono"),
      vih: grab(anamSrc, /nota:"(Pedir serologia 4\.ª geração[^"]+)"/, "nota-vih"),
      hep: grab(anamSrc, /nota:"(Pedir AST, ALT, bilirrubina[^"]+)"/, "nota-hep"),
      lc: grab(anamSrc, /nota:"(Diagnóstico clínico de exclusão\. Se mal-estar[^"]+)"/, "nota-lc"),
    },
    dxDetailFallback: grab(anamSrc, /(Detalhe educativo desta entidade em preparação\.)/, "disc-fallback"),
  },
  dxFull: evalLit(literalAfter(anamSrc, /var DXFULL_ANAM = \{/)),
  notaIntro: grab(anamSrc, /(Exemplo pedagógico de como a informação[\s\S]*?estruturada\.)/, "nota-intro"),
};
if (ui.infRec.combinados.length !== 3) throw new Error("esperava 3 alertas combinados infRec, vieram " + ui.infRec.combinados.length);
if (Object.keys(ui.dxFull).length !== 23) throw new Error("esperava 23 entradas DXFULL, vieram " + Object.keys(ui.dxFull).length);

const anamnese = {
  ageBuckets: AGE_BUCKETS,
  symCats: symCatsIds.map((id) => ({ id, label: symCatsLabels[id] })),
  syms: SYMS,
  alms: ALMS,
  drgcls: DRGCLS,
  ants: ANTS,
  ui,
  biblio: { grupos: biblio, nota: biblioNota, termos: biblioTermos },
};

// ═══ cansaco-quiz.json ═══
const CASES = evalLit(literalAfter(quizSrc, /const\s+CASES\s*=\s*\[/));
const DEFAULT_TIPS = evalLit(literalAfter(quizSrc, /const\s+DEFAULT_TIPS\s*=\s*\{/));
const onboardBlock = grab(quizSrc, /<div class="onboard-modal">([\s\S]*?)<\/div>\s*<\/div>\s*<div class="wrap">/, "onboard");
const onboarding = {
  eyebrow: grab(onboardBlock, /class="onboard-eyebrow">([^<]+)</, "ob-eyebrow"),
  titulo: grab(onboardBlock, /class="onboard-title">([^<]+)</, "ob-titulo"),
  contexto: clean(grab(onboardBlock, /class="onboard-context">\s*([\s\S]*?)<\/div>/, "ob-contexto")),
  passos: [...onboardBlock.matchAll(/class="onboard-step-text">([\s\S]*?)<\/div>/g)].map((m) => clean(m[1])),
  cta: grab(onboardBlock, /class="onboard-cta"[^>]*>([^<]+)</, "ob-cta"),
};
if (onboarding.passos.length !== 4) throw new Error("onboarding: esperava 4 passos");
const quiz = {
  titulo: clean(grab(quizSrc, /<h1 class="title"[^>]*>([\s\S]*?)<\/h1>/, "quiz-titulo")).replace(/<\/?em>/g, ""),
  sub: clean(grab(quizSrc, /<p class="subtitle"[^>]*>([\s\S]*?)<\/p>/, "quiz-sub")),
  disclaimer: clean(grab(quizSrc, /<span style="flex:1">([\s\S]*?)<\/span>/, "quiz-disc")),
  onboarding,
  dicas: DEFAULT_TIPS,
  casos: CASES,
};

// ═══ escrever ═══
const w = (file, obj) => {
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(obj, null, 1) + "\n");
  console.log("✓", file, Math.round(JSON.stringify(obj).length / 1024) + "kB");
};
w("cansaco.json", cansaco);
w("cansaco-anamnese.json", anamnese);
w("cansaco-quiz.json", quiz);

console.log("\nresumo: guia", guia.length, "painéis · tratamento", tratamento.paineis.length,
  "· escalas", interativas.length, "+", outras.cards.length, "· fontes", totalFontes,
  "· glossário", GLOSS.length, "· cards", C_DEFAULTS.length, "· flashcards", EXAMPLES.length,
  "· quiz", CASES.length, "· anamnese syms", SYMS.length, "· biblio", totalBiblio);
