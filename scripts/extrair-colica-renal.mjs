// Extrator do conteúdo clínico do submódulo Cólica Renal (HTML originais) → JSON em /conteudo/urgencia.
// Todo o texto clínico vem recortado do original (nunca retranscrito à mão).
// Submódulo da Urgência, molde da Dor Abdominal. Sem passo de discussão de hipóteses
// e sem scoring de DDx (o original não os tem — é treino de exclusão + nota).
// Saídas (faseado): colica-renal.json (menu+flashcards), colica-renal-quiz.json,
//                   colica-renal-guia.json, colica-renal-anamnese.json.
import fs from "fs";
import vm from "vm";
import path from "path";

const DIR = "/Users/pedroferreira/Desktop/Cólica Renal ";
const OUT = "/Users/pedroferreira/Desktop/medguia/conteudo/urgencia";

const homeSrc = fs.readFileSync(path.join(DIR, "colica_renal_home.html"), "utf8");
const flashSrc = fs.readFileSync(path.join(DIR, "colica_renal_flashcards.html"), "utf8");
const quizSrc = fs.readFileSync(path.join(DIR, "colica_renal_casos.html"), "utf8");
const guiaSrc = fs.readFileSync(path.join(DIR, "colica_renal_guia.html"), "utf8");
const anamSrc = fs.readFileSync(path.join(DIR, "colica_renal_anamnese.html"), "utf8");

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
const ent = (s) => s.replace(/&middot;/g, "·").replace(/&amp;/g, "&");

// ═══ MENU (home) ═══
function menuCard(cls, destino) {
  const i = homeSrc.indexOf(`class="card ${cls}"`);
  if (i < 0) throw new Error("card do menu não encontrado: " + cls);
  const seg = homeSrc.slice(i, homeSrc.indexOf("</a>", i));
  return {
    destino,
    badge: ent(clean(grab(seg, /class="card-num-badge">([\s\S]*?)<\/span>/, cls + "-badge"))),
    eyebrow: grab(seg, /class="card-eyebrow">([^<]+)</, cls + "-eyebrow"),
    titulo: grab(seg, /class="card-title">([^<]+)</, cls + "-titulo"),
    sub: ent(clean(grab(seg, /class="card-sub">([\s\S]*?)<\/p>/, cls + "-sub"))),
    features: [...seg.matchAll(/<span class="feat-dot"><\/span>([\s\S]*?)<\/div>/g)].map((m) => ent(clean(m[1]))),
    cta: grab(seg, /class="card-cta">([^<]+)</, cls + "-cta"),
  };
}
// modal "Cards de estudo" (embutido no home): 2 opções (cards do guia / flashcards)
const modalSeg = homeSrc.slice(homeSrc.indexOf('id="cards-modal"'));
const modalCards = {
  eyebrow: ent(grab(modalSeg, /class="modal-eyebrow">([^<]+)</, "modal-eyebrow")),
  titulo: ent(clean(grab(modalSeg, /class="modal-title">([\s\S]*?)<\/h2>/, "modal-titulo")).replace(/<\/?em>/g, "")),
  sub: ent(grab(modalSeg, /class="modal-sub">([^<]+)</, "modal-sub")),
  opcoes: [...modalSeg.matchAll(/class="mo-badge">([^<]+)<\/span>\s*<div class="mo-name">([^<]+)<\/div>\s*<div class="mo-desc">([\s\S]*?)<\/div>/g)]
    .map((m) => ({ badge: ent(m[1]), nome: ent(m[2]), desc: ent(clean(m[3])), cta: "Abrir " + m[2].toLowerCase() })),
};
if (modalCards.opcoes.length !== 2) throw new Error("esperava 2 opções no modal, vieram " + modalCards.opcoes.length);

const menu = {
  pill: ent(clean(grab(homeSrc, /class="hero-pill-text">([\s\S]*?)<\/span>/, "pill"))),
  modalCards,
  heroSub: ent(clean(grab(homeSrc, /class="hero-sub">([\s\S]*?)<\/p>/, "heroSub"))),
  eyebrow: grab(homeSrc, /class="cards-eyebrow">([^<]+)</, "menu-eyebrow"),
  label: ent(clean(grab(homeSrc, /class="cards-label">([\s\S]*?)<\/div>/, "menu-label")).replace(/<\/?em>/g, "")),
  cartoes: [menuCard("theory", "guia"), menuCard("anamnese", "anamnese"), menuCard("cards", "cards"), menuCard("quiz", "quiz")],
  rodape: {
    comoTitulo: grab(homeSrc, /class="footer-title">([^<]+)</, "foot-titulo"),
    comoTexto: ent(clean(grab(homeSrc, /class="footer-body">([\s\S]*?)<\/p>/, "foot-texto"))),
    legal: ent(clean(grab(homeSrc, /class="legal">([\s\S]*?)<\/p>/, "legal"))),
  },
};

// ═══ FLASHCARDS ═══
const EXAMPLES = evalLit(literalAfter(flashSrc, /const EXAMPLES=\[/));
if (EXAMPLES.length !== 28) throw new Error("esperava 28 flashcards, vieram " + EXAMPLES.length);
EXAMPLES.forEach((c, i) => { if (!c.q || !c.a) throw new Error("flashcard " + i + " incompleto"); });
const flashcards = {
  eyebrow: grab(flashSrc, /class="eyebrow">([^<]+)</, "flash-eyebrow"),
  titulo: ent(clean(grab(flashSrc, /<h1 class="title"[^>]*>([\s\S]*?)<\/h1>/, "flash-titulo")).replace(/<\/?em>/g, "")),
  exemplos: EXAMPLES,
};

// ═══ QUIZ (casos PNA) ═══
const CASES = evalLit(literalAfter(quizSrc, /let CASES = \[/));
const DEFAULT_TIPS = evalLit(literalAfter(quizSrc, /const DEFAULT_TIPS=\{/));
if (CASES.length !== 24) throw new Error("esperava 24 casos, vieram " + CASES.length);
CASES.forEach((c) => {
  if (!c.id || !c.vignette || !c.stem || !Array.isArray(c.options)) throw new Error("caso malformado: " + c.id);
  if (c.options.filter((o) => o.correct).length !== 1) throw new Error("caso sem resposta única: " + c.id);
});
const nDicas = Object.values(DEFAULT_TIPS).reduce((s, a) => s + a.length, 0);
const quiz = {
  titulo: ent(clean(grab(quizSrc, /<h1 class="title"[^>]*>([\s\S]*?)<\/h1>/, "quiz-titulo")).replace(/<\/?em>/g, "")),
  sub: ent(clean(grab(quizSrc, /<p class="subtitle"[^>]*>([\s\S]*?)<\/p>/, "quiz-sub"))),
  dicas: DEFAULT_TIPS,
  dicasEditaveis: true,
  dicasHint: "Carrega Enter no fim de uma dica para adicionar nova. Clica no texto para editar.",
  casos: CASES,
};

// ═══ GUIA TEÓRICO (HTML estático + vars) ═══
// remove handlers de navegação/interatividade (tratados em React/delegação)
function transfGuia(html, label) {
  let out = html
    .replace(/ onclick="[^"]*"/g, "")
    .replace(/ oninput="[^"]*"/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  if (/onclick=|oninput=/.test(out)) throw new Error("handler remanescente em " + label);
  return out.trim();
}
// fatia um segmento por marcador (regex com 1 grupo de captura do atributo)
function fatiar(seg, markerRe) {
  const idxs = []; let m;
  const re = new RegExp(markerRe, "g");
  while ((m = re.exec(seg))) idxs.push({ at: m.index, attr: m[1] });
  return idxs.map((x, k) => ({ attr: x.attr, html: seg.slice(x.at, k + 1 < idxs.length ? idxs[k + 1].at : seg.length) }));
}
// interior de um <div ...>...</div>: remove a tag de abertura e o último </div>
const interior = (html) => html.slice(html.indexOf(">") + 1).replace(/<\/div>\s*$/, "").trim();

const guiaVars = (re) => evalLit(literalAfter(guiaSrc, re));
const QUAD = guiaVars(/var QUAD=\[/);
const QUAD_DATA = guiaVars(/var QUAD_DATA=\{/);
const DX = guiaVars(/var DX=\[/);
const SRC = guiaVars(/var SRC=\[/);
const GLOSS = guiaVars(/var GLOSS=\[/);
const C_CATS = guiaVars(/var C_CATS=\{/);
const C_DEFAULTS = guiaVars(/var C_DEFAULTS=\[/);
if (QUAD.length !== 9) throw new Error("esperava 9 quadrantes, vieram " + QUAD.length);
if (DX.length !== 16) throw new Error("esperava 16 diagnósticos, vieram " + DX.length);
if (GLOSS.length !== 33) throw new Error("esperava 33 termos no glossário, vieram " + GLOSS.length);
if (C_DEFAULTS.length !== 16) throw new Error("esperava 16 cards, vieram " + C_DEFAULTS.length);
C_DEFAULTS.forEach((c, i) => {
  for (const k of ["cat", "title", "sub", "sections", "backHtml"]) if (c[k] === undefined) throw new Error(`card ${i} sem ${k}`);
  if (!C_CATS[c.cat]) throw new Error(`card ${i} com cat desconhecida: ${c.cat}`);
});

// quad cells (réplica da geração original, sem onclick — delegação no componente)
const quadCellsHtml = QUAD.map((q) => `<div class="qcell" data-q="${q.id}">${q.l}<span class="qf">${q.f}</span></div>`).join("");
// accordion de diagnósticos (réplica da geração original, sem onclick)
const chev = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
const dxListHtml = '<div class="dx-list">' + DX.map((d, i) => {
  const body =
    `<div class="dx-row"><span class="dx-row-label">Clínica / pistas</span><br>${d.pistas}</div>` +
    `<div class="dx-row"><span class="dx-row-label">Exame</span><br>${d.exame}</div>` +
    `<div class="dx-row"><span class="dx-row-label">Investigação</span><br>${d.invest}</div>` +
    `<div class="dx-row${d.a ? " alarm" : ""}"><span class="dx-row-label">Conduta</span><br>${d.conduta}</div>`;
  return `<div class="dx-card" data-dx="${i}"><div class="dx-card-h"><div><div class="dx-card-title">${d.t}</div>` +
    `<div class="dx-card-sub">${d.s}</div></div><div class="dx-card-chev">${chev}</div></div>` +
    `<div class="dx-card-body">${body}</div></div>`;
}).join("") + "</div>";

const corpo = guiaSrc.slice(guiaSrc.indexOf("<body>"), guiaSrc.indexOf("<script>"));
// TAB 1 — Guia Teórico: 7 sub-painéis (gt)
const tab1 = corpo.slice(corpo.indexOf('data-tab-content="1">'), corpo.indexOf('data-tab-content="2">'));
const gtSub = [...tab1.matchAll(/class="gt-stab[^"]*"[^>]*>([^<]+)</g)].map((m) => m[1].trim());
const gtPanels = fatiar(tab1, '<div class="gt-panel[^"]*" data-gt="(\\d)">');
if (gtPanels.length !== 7) throw new Error("esperava 7 gt-panels, vieram " + gtPanels.length);
const gt = gtPanels.map((p, i) => {
  let html = interior(p.html);
  if (i === 1) html = html.replace(/<div class="quad-grid" id="quadGrid"><\/div>/, `<div class="quad-grid">${quadCellsHtml}</div>`);
  if (i === 4) html = html.replace(/<div id="dxList"><\/div>/, dxListHtml);
  return { label: gtSub[i], html: transfGuia(html, "gt-" + i) };
});

// TAB 2 — Tratamento: 5 sub-painéis (tr); o tr0 (Analgesia) tem 4 sub-sub (an)
const tab2 = corpo.slice(corpo.indexOf('data-tab-content="2">'), corpo.indexOf('data-tab-content="4">'));
const trSub = [...tab2.matchAll(/class="gt-stab[^"]*"[^>]*onclick="switchTr[^>]*>([^<]+)</g)].map((m) => m[1].trim());
const trPanels = fatiar(tab2, '<div class="gt-panel[^"]*" data-tr="(\\d)">');
if (trPanels.length !== 5) throw new Error("esperava 5 tr-panels, vieram " + trPanels.length);
const tratamento = {
  labels: trSub,
  paineis: trPanels.map((p, i) => {
    if (i === 0) {
      const anSub = [...p.html.matchAll(/class="an-stab[^"]*"[^>]*>([^<]+)</g)].map((m) => m[1].trim());
      const anPanels = fatiar(p.html, '<div class="an-panel[^"]*" data-an="(\\d)">');
      if (anPanels.length !== 4) throw new Error("esperava 4 an-panels, vieram " + anPanels.length);
      return { analgesia: true, labels: anSub, paineis: anPanels.map((a, j) => ({ html: transfGuia(interior(a.html), "an-" + j) })) };
    }
    return { html: transfGuia(interior(p.html), "tr-" + i) };
  }),
};

// TAB 5 — Fontes (SRC agrupado por grp)
const fonteGrupos = [];
for (const it of SRC) {
  let g = fonteGrupos.find((x) => x.titulo === it.grp);
  if (!g) { g = { titulo: it.grp, itens: [] }; fonteGrupos.push(g); }
  g.itens.push({ titulo: it.ti, autores: it.au, fonte: it.jo, badge: it.bt, badgeTipo: it.bc.replace("fonte-badge-", "").replace("strong", "forte").replace("conditional", "condicional").replace("weak", "fraca"), url: it.url || "" });
}
const totalFontes = fonteGrupos.reduce((s, g) => s + g.itens.length, 0);
const fontesIntro = clean(grab(corpo, /data-tab-content="5">[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/, "fontes-intro"));

// TAB 6 — Glossário (GLOSS) + cabeçalho
const glosTit = grab(corpo, /data-tab-content="6">[\s\S]*?<h2[^>]*>([^<]+)</, "glos-tit");
const glosSub = grab(corpo, /data-tab-content="6">[\s\S]*?<h2[^>]*>[^<]+<\/h2>\s*<p[^>]*>([^<]+)</, "glos-sub");

// cabeçalho do guia: o original não tem subtítulo próprio — reusa o do home
const guiaSub = menu.heroSub;

const guiaJson = {
  guiaSub,
  gt,
  tratamento,
  diagnosticos: { quadData: QUAD_DATA },
  cards: { titulo: "Cards de estudo", sub: "Os 16 diagnósticos do guia em cards de revisão — clínica, investigação e tratamento.", cats: C_CATS, defaults: C_DEFAULTS },
  fontes: { intro: fontesIntro, grupos: fonteGrupos },
  glossario: { titulo: glosTit, sub: glosSub, termos: GLOSS },
};

// ═══ ANAMNESE ═══
const anam = (re) => evalLit(literalAfter(anamSrc, re));
const A_QUADRANTES = anam(/var QUADRANTES=\[/);
const A_SYMS = anam(/var SYMS=\[/);
const A_ALMS = anam(/var ALMS=\[/);
const A_DRGCLS = anam(/var DRGCLS=\[/);
const A_ANTS = anam(/var ANTS=\[/);
const A_STONE = anam(/var STONE_INFO=\{/);
const A_AGE = anam(/var AGE_BUCKETS=\[/);
const A_EXC = anam(/var EXC_CARDS=\[/);
const A_SINAIS = anam(/var SINAIS_INFO = \[/);
const A_CL = anam(/var cl=\{/);
if (A_SYMS.length !== 21) throw new Error("esperava 21 sintomas, vieram " + A_SYMS.length);
if (A_ALMS.length !== 8) throw new Error("esperava 8 alarmes, vieram " + A_ALMS.length);
if (A_EXC.length !== 4) throw new Error("esperava 4 EXC_CARDS, vieram " + A_EXC.length);
if (A_SINAIS.length !== 5) throw new Error("esperava 5 sinais especiais, vieram " + A_SINAIS.length);
if (A_ANTS.length !== 14) throw new Error("esperava 14 antecedentes, vieram " + A_ANTS.length);

// categorias de sintomas (ordem + label)
const symCats = ["Urin", "GI", "Gineco", "Sist", "Cardio"].map((id) => ({ id, label: A_CL[id] }));

// extrai o texto de um alerta condicional: âncora na condição + classe inf-alert/alert
function alerta(cond, label) {
  const re = new RegExp(cond + String.raw`\)\{?\s*o\+='<div class="(?:inf-alert|alert)[^"]*"[^>]*>([\s\S]*?)<\/div>'`);
  return grab(anamSrc, re, label);
}
const tiposPar = ["colica", "continua", "queimor", "facada", "opressiva", "surda"];
const quadIds = A_QUADRANTES.map((q) => q.id);
const irradPar = ["dorso", "virilha", "ombrod", "ombroe", "retro", "flancos"];
const padraoPar = ["constante", "intermit", "crescendo", "resolucao"];

const ui = {
  intro: {
    comoTitulo: "Como funciona",
    comoTexto: grab(anamSrc, /(Constrói um <b>caso clínico fictício<\/b>[\s\S]*?)';/, "como-texto"),
    aviso: "<b>⚠ Não introduzir dados de doentes reais.</b>" + grab(anamSrc, /<b>⚠ Não introduzir dados de doentes reais\.<\/b>([\s\S]*?)<\/div>'/, "aviso"),
  },
  caract: {
    socrates: grab(anamSrc, /inf-alert-y" style="margin-bottom:18px[^>]*>([\s\S]*?)<\/div>'/, "socrates"),
    inicioSubito: alerta('D\\.inicio==="subito"', "inicio-subito"),
    inicioGradual: alerta('D\\.inicio==="gradual"', "inicio-gradual"),
    durAguda: alerta('D\\.dur==="aguda"', "dur-aguda"),
    durSubaguda: alerta('D\\.dur==="subaguda"', "dur-subaguda"),
    durCronica: alerta('D\\.dur==="cronica"', "dur-cronica"),
    intens7: alerta('D\\.intens&&parseInt\\(D\\.intens\\)>=7', "intens7"),
    tipos: Object.fromEntries(tiposPar.map((t) => [t, alerta(`has\\(D\\.tipo,"${t}"\\)`, "tipo-" + t)])),
    quadrantes: Object.fromEntries(quadIds.map((q) => [q, alerta(`locHas\\("${q}"\\)`, "quad-" + q)])),
    difusa: alerta('D\\.difusa', "difusa"),
    irrad: Object.fromEntries(irradPar.map((t) => [t, alerta(`has\\(D\\.irrad,"${t}"\\)`, "irrad-" + t)])),
    padrao: Object.fromEntries(padraoPar.map((t) => [t, alerta(`D\\.padrao==="${t}"`, "padrao-" + t)])),
    mod: {
      alimAlivia: alerta('D\\.mod\\.alim==="alivia"', "mod-alim-a"),
      alimAgrava: alerta('D\\.mod\\.alim==="agrava"', "mod-alim-g"),
      jejumAlivia: alerta('D\\.mod\\.jejum==="alivia"', "mod-jejum-a"),
      jejumAgrava: alerta('D\\.mod\\.jejum==="agrava"', "mod-jejum-g"),
      defecAlivia: alerta('D\\.mod\\.defec==="alivia"', "mod-defec-a"),
      defecAgrava: alerta('D\\.mod\\.defec==="agrava"', "mod-defec-g"),
      movAgrava: alerta('D\\.mod\\.mov==="agrava"', "mod-mov-g"),
      posAlivia: alerta('D\\.mod\\.pos==="alivia"', "mod-pos-a"),
      posAgrava: alerta('D\\.mod\\.pos==="agrava"', "mod-pos-g"),
    },
  },
  contexto: {
    aviso: grab(anamSrc, /class="alert alert-y" style="margin-bottom:16px">(Há frequentemente[\s\S]*?)<\/div>/, "ctx-aviso"),
    pergunta: grab(anamSrc, /font-size:14px">(Há algum factor[^<]+)<\/div>/, "ctx-pergunta"),
    perguntaHint: grab(anamSrc, /class="hint" style="margin-bottom:10px">(Desidratação[^<]+)<\/div>/, "ctx-hint"),
    semCtx: "<b>Sem contexto desencadeante identificado</b>" + grab(anamSrc, /<b>Sem contexto desencadeante identificado<\/b>([\s\S]*?)<\/div>'/, "ctx-sem"),
    relDesidratacao: alerta('D\\.relRef==="desidratacao"', "rel-desid"),
    relEsforco: alerta('D\\.relRef==="esforco"', "rel-esforco"),
    relImobil: alerta('D\\.relRef==="imobil"', "rel-imobil"),
    aines: alerta('D\\.ainesRec===true', "aines"),
    movAgita: alerta('D\\.movDes==="agita"', "mov-agita"),
    movImobiliza: alerta('D\\.movDes==="imobiliza"', "mov-imob"),
    menstrPeri: alerta('D\\.menstr==="peri"', "menstr-peri"),
    menstrMeio: alerta('D\\.menstr==="meio"', "menstr-meio"),
  },
  alm: {
    intro: grab(anamSrc, /var o='<div class="exc-intro">([\s\S]*?)<\/div>';/, "alm-intro"),
    nota: grab(anamSrc, /inf-alert-y" style="margin-top:16px;font-size:12px">([\s\S]*?)<\/div>'/, "alm-nota"),
  },
  sym: { intro: grab(anamSrc, /function rSymAssoc\(\)\{\s*var o='<div class="exc-intro">([\s\S]*?)<\/div>';/, "sym-intro") },
  hab: {
    intro: grab(anamSrc, /function rHab[\s\S]*?font-style:italic[^>]*>([^<]+)<\/div>/, "hab-intro"),
    alcExc: grab(anamSrc, /D\.alc==="excessivo"\?\{good:false,text:"([^"]+)"\}/, "hab-alc"),
    tabaco: grab(anamSrc, /D\.tabac==="sim"\?\{good:false,text:"([^"]+)"\}/, "hab-tab"),
    dietaGordura: grab(anamSrc, /D\.dieta==="gordura"\?\{good:false,text:"([^"]+)"\}/, "hab-gord"),
    dietaOxalato: grab(anamSrc, /D\.dieta==="pobrefibra"\?\{good:false,text:"([^"]+)"\}/, "hab-oxal"),
    dietaLiquidos: grab(anamSrc, /D\.dieta==="restritiva"\?\{good:false,text:"([^"]+)"\}/, "hab-liq"),
  },
  med: { intro: grab(anamSrc, /function rMed[\s\S]*?font-style:italic[^>]*>([^<]+)<\/div>/, "med-intro") },
  ant: { intro: grab(anamSrc, /function rAnt[\s\S]*?font-style:italic[^>]*>([^<]+)<\/div>/, "ant-intro") },
  eo: {
    intro: grab(anamSrc, /function rEO[\s\S]*?font-style:italic[^>]*>([^<]+)<\/div>/, "eo-intro"),
    svHint: grab(anamSrc, /class="hint" style="margin-top:6px">(A febre é característica[^<]+)<\/div>/, "eo-svhint"),
    mucDesc: alerta('has\\(D\\.muc,"desc"\\)', "muc-desc"),
    mucDesid: alerta('has\\(D\\.muc,"desid"\\)', "muc-desid"),
    mucIct: alerta('has\\(D\\.muc,"ict"\\)', "muc-ict"),
    acrArr: alerta('D\\.acr\\.r==="arr"', "acr-arr"),
    acrTaq: alerta('D\\.acr\\.f==="taq"', "acr-taq"),
    acrBra: alerta('D\\.acr\\.f==="bra"', "acr-bra"),
    apMvDim: alerta('D\\.apr\\.mv==="dim"', "ap-mv"),
    apCrep: alerta('has\\(D\\.apr\\.ra,"Crepitações"\\)', "ap-crep"),
    eoQuadSufixo: grab(anamSrc, /Doloroso em: '\+qs\+'([\s\S]*?)<\/div>'/, "eo-quad-suf"),
    defesaSem: alerta('D\\.defesa==="sem"', "def-sem"),
    defesaLocalizada: alerta('D\\.defesa==="localizada"', "def-loc"),
    defesaGeneralizada: alerta('D\\.defesa==="generalizada"', "def-gen"),
    defesaTabua: alerta('D\\.defesa==="tabua"', "def-tab"),
    rhaAlta: alerta('D\\.rha==="aum"\\|\\|D\\.rha==="met"', "rha-alta"),
    rhaBaixa: alerta('D\\.rha==="dim"\\|\\|D\\.rha==="aus"', "rha-baixa"),
    massaPulsatil: alerta('has\\(D\\.massa,"Massa pulsátil"\\)', "massa-puls"),
    massaRim: alerta('has\\(D\\.massa,"Rim palpável / hidronefrose"\\)', "massa-rim"),
    massaGlobo: alerta('has\\(D\\.massa,"Globo vesical"\\)', "massa-globo"),
    massaPalpavel: alerta('has\\(D\\.massa,"Massa palpável"\\)', "massa-palp"),
    sinaisNota: grab(anamSrc, /Para cada sinal: marca se está <b>positivo<\/b>([\s\S]*?)<\/div>'/, "sinais-nota"),
    sinaisInfo: A_SINAIS,
    genIntro: grab(anamSrc, /font-style:italic">(A irradiação da cólica renal[^<]+)<\/div>/, "gen-intro"),
    genHernia: alerta('has\\(D\\.gen,"hernia"\\)', "gen-hernia"),
    genEscroto: alerta('has\\(D\\.gen,"escroto"\\)', "gen-escroto"),
    miEd: alerta('D\\.mi\\.ed', "mi-ed"),
    miTvp: alerta('D\\.mi\\.tvp', "mi-tvp"),
    obesoOb: alerta('D\\.obeso==="ob"', "obeso-ob"),
    peleEquimoses: alerta('has\\(D\\.pele,"greyturner"\\)\\|\\|has\\(D\\.pele,"cullen"\\)', "pele"),
  },
  notaIntro: grab(anamSrc, /(Exemplo pedagógico de como a informação[\s\S]*?)['<]/, "nota-intro").replace(/\\'/g, "'").trim(),
};

// bibliografia (chamadas src() do rBiblio)
const biblioFn = anamSrc.slice(anamSrc.indexOf("function rBiblio()"));
const biblioSecs = [...biblioFn.matchAll(/margin:(?:0 0 10px|24px 0 10px)[^>]*>([^<]+)<\/div>'/g)].map((m) => m[1]);
const biblioBlocos = biblioFn.split(/margin:(?:0 0 10px|24px 0 10px)[^>]*>[^<]+<\/div>'/).slice(1);
const reSrc = /src\("([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)"\)/g;
const biblio = biblioSecs.map((titulo, i) => ({
  titulo,
  itens: [...(biblioBlocos[i] || "").matchAll(reSrc)].map((m) => ({ num: m[1], autor: m[2], titulo: m[3], fonte: m[4], tipo: m[5] })),
}));
const totalBiblio = biblio.reduce((s, g) => s + g.itens.length, 0);
if (totalBiblio !== 13) throw new Error("esperava 13 refs na bibliografia, vieram " + totalBiblio);
const biblioNota = clean(grab(biblioFn, /<b>Nota\.<\/b>([\s\S]*?)<\/div>'/, "biblio-nota"));
const biblioTermos = clean(grab(biblioFn, /<b>Termos de uso\.<\/b>([\s\S]*?)<\/div>'/, "biblio-termos"));

const anamnese = {
  ageBuckets: A_AGE, quadrantes: A_QUADRANTES, symCats, syms: A_SYMS, alms: A_ALMS,
  drgcls: A_DRGCLS, ants: A_ANTS, stoneInfo: A_STONE, excCards: A_EXC, ui,
  biblio: { grupos: biblio, nota: biblioNota, termos: biblioTermos },
};

// verificação: nenhum alerta ficou vazio
(function verAlertas(o, p = "ui") {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string") { if (!v.trim()) throw new Error("alerta vazio: " + p + "." + k); }
    else if (v && typeof v === "object" && !Array.isArray(v)) verAlertas(v, p + "." + k);
  }
})(ui);

// ═══ escrever ═══
const w = (file, obj) => {
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(obj, null, 1) + "\n");
  console.log("✓", file, Math.round(JSON.stringify(obj).length / 1024) + "kB");
};
w("colica-renal.json", { id: "colica_renal", titulo: "Cólica Renal", menu, flashcards });
w("colica-renal-quiz.json", quiz);
w("colica-renal-guia.json", guiaJson);
w("colica-renal-anamnese.json", anamnese);

console.log("\nresumo F1: flashcards", EXAMPLES.length, "· casos", CASES.length,
  "· dicas", Object.keys(DEFAULT_TIPS).length + " cats / " + nDicas, "· cartões menu", menu.cartoes.length);
console.log("resumo F2 guia: gt", gt.length, "· tratamento", trSub.length, "(analgesia " + tratamento.paineis[0].paineis.length + ")",
  "· dx", DX.length, "· quad", QUAD.length, "· fontes", totalFontes + "/" + fonteGrupos.length + "grp",
  "· gloss", GLOSS.length, "· cards", C_DEFAULTS.length);
console.log("resumo F3 anamnese: syms", A_SYMS.length, "· alms", A_ALMS.length, "· drgcls", A_DRGCLS.length,
  "· ants", A_ANTS.length, "· excCards", A_EXC.length, "· sinais", A_SINAIS.length, "· biblio", totalBiblio,
  "· age", A_AGE.length, "· stone", Object.keys(A_STONE).length);
