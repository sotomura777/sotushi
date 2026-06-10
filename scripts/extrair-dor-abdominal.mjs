// Extrator do conteúdo clínico do módulo Dor Abdominal (HTML originais) → JSON em /conteudo/urgencia.
// Todo o texto clínico vem recortado do original (nunca retranscrito à mão).
// Sem extração do rDisc (passo de discussão de hipóteses não se porta — decisão de produto).
// Saídas: dor-abdominal.json (menu+modal+flashcards), dor-abdominal-anamnese.json, dor-abdominal-quiz.json.
import fs from "fs";
import vm from "vm";
import path from "path";

const DIR = "/Users/pedroferreira/Downloads/Dor abdomnal - enviar ";
const OUT = "/Users/pedroferreira/Desktop/medguia/conteudo/urgencia";

const homeSrc = fs.readFileSync(path.join(DIR, "dor abdominal home.html"), "utf8");
const anamSrc = fs.readFileSync(path.join(DIR, "dor_abdominal-3.html"), "utf8");
const quizSrc = fs.readFileSync(path.join(DIR, "dor_abdominal casos PNA.html"), "utf8");
const flashSrc = fs.readFileSync(path.join(DIR, "dor abdominal flahs e cards (3)", "dor_abdominal_flashcards.html"), "utf8");
const chooserSrc = fs.readFileSync(path.join(DIR, "dor abdominal flahs e cards (3)", "dor_abdominal_cards.html"), "utf8");

// ── helpers (mesmo padrão do extrair-cansaco) ──
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
// texto de um alerta condicional: âncora na condição + classe do alerta
function alerta(src, cond, label) {
  const re = new RegExp(cond + String.raw`\)\{?\s*o\+='<div class="(?:inf-alert|alert)[^"]*"[^>]*>([\s\S]*?)<\/div>'`);
  return grab(src, re, label);
}

// ═══ MENU (home) ═══
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
const modalCards = {
  eyebrow: grab(chooserSrc, /class="eyebrow">([^<]+)</, "ch-eyebrow"),
  titulo: clean(grab(chooserSrc, /<h1 class="title">([\s\S]*?)<\/h1>/, "ch-titulo")).replace(/<\/?em>/g, ""),
  sub: grab(chooserSrc, /class="subtitle">([^<]+)</, "ch-sub"),
  opcoes: [...chooserSrc.matchAll(/class="opt-badge[^"]*">([^<]+)<\/[\s\S]*?class="opt-title">([^<]+)<[\s\S]*?class="opt-desc">([^<]+)</g)]
    .map((m) => ({ badge: m[1], nome: m[2], desc: clean(m[3]), cta: "Abrir " + m[2].toLowerCase() })),
};
if (modalCards.opcoes.length !== 2) throw new Error("esperava 2 opções no chooser, vieram " + modalCards.opcoes.length);

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

// ═══ FLASHCARDS ═══
const EXAMPLES = evalLit(literalAfter(flashSrc, /const EXAMPLES=\[/));
if (EXAMPLES.length !== 30) throw new Error("esperava 30 flashcards, vieram " + EXAMPLES.length);
const flashcards = {
  eyebrow: grab(flashSrc, /class="eyebrow">([^<]+)</, "flash-eyebrow"),
  titulo: clean(grab(flashSrc, /<h1 class="title"[^>]*>([\s\S]*?)<\/h1>/, "flash-titulo")).replace(/<\/?em>/g, ""),
  exemplos: EXAMPLES,
};

// ═══ ANAMNESE: dados estruturados ═══
const QUADRANTES = evalLit(literalAfter(anamSrc, /var QUADRANTES=\[/));
const SYMS = evalLit(literalAfter(anamSrc, /var SYMS=\[/));
const ALMS = evalLit(literalAfter(anamSrc, /var ALMS=\[/));
const DRGCLS = evalLit(literalAfter(anamSrc, /var DRGCLS=\[/));
const ANTS = evalLit(literalAfter(anamSrc, /var ANTS=\[/));
const AGE_BUCKETS = evalLit(literalAfter(anamSrc, /var AGE_BUCKETS=\[/));
if (QUADRANTES.length !== 9) throw new Error("esperava 9 quadrantes");
const symCats = evalLit(literalAfter(anamSrc, /var cats=\[/)).map((id) => ({
  id, label: evalLit(literalAfter(anamSrc, /var cl=\{/))[id],
}));

// bloco "doente instável" do passo 0: concatenação das strings hemoHtml dentro do if
const instSeg = anamSrc.slice(anamSrc.indexOf('if(D.hemodin==="instavel"){'), anamSrc.indexOf("return mkCard(\"Construir o caso clínico\""));
const instavelHtml = [...instSeg.matchAll(/hemoHtml\+='([^']*)';/g)].map((m) => m[1]).join("");
if (!instavelHtml.includes("estabilizar ANTES de investigar")) throw new Error("bloco instável incompleto");

// sinais especiais (id, label, como se faz)
const SINAIS_INFO = evalLit(literalAfter(anamSrc, /var SINAIS_INFO = \[/));
if (SINAIS_INFO.length !== 8) throw new Error("esperava 8 sinais especiais");

const ui = {
  intro: {
    comoTitulo: "Como funciona",
    comoTexto: grab(anamSrc, /intro\+='(Constrói um[^']+)';/, "ctx-como"),
    aviso: "<b>⚠ Não introduzir dados de doentes reais.</b>" + grab(anamSrc, /<b>⚠ Não introduzir dados de doentes reais\.<\/b>([^']+)<\/div>'/, "ctx-aviso"),
    faixaHint: grab(anamSrc, /class="hint" style="margin-top:6px">([^<]+)<\/div>/, "ctx-faixa"),
    instavelHtml,
    instavelNota: grab(anamSrc, /inf-alert-y" style="margin-bottom:8px">([^<]+)<\/div>'/, "ctx-inst-nota"),
  },
  caract: {
    socrates: grab(anamSrc, /border-left:3px solid var\(--acc\)">([\s\S]*?)<\/div>';/, "socrates"),
    inicioSubito: alerta(anamSrc, 'D\\.inicio==="subito"', "inicio-subito"),
    inicioGradual: alerta(anamSrc, 'D\\.inicio==="gradual"', "inicio-gradual"),
    durAguda: alerta(anamSrc, 'D\\.dur==="aguda"', "dur-aguda"),
    durSubaguda: alerta(anamSrc, 'D\\.dur==="subaguda"', "dur-subaguda"),
    durCronica: alerta(anamSrc, 'D\\.dur==="cronica"', "dur-cronica"),
    intens7: alerta(anamSrc, 'D\\.intens&&parseInt\\(D\\.intens\\)>=7', "intens-7"),
    tipos: Object.fromEntries(["colica", "continua", "queimor", "facada", "opressiva", "surda"].map((t) => [t, alerta(anamSrc, `has\\(D\\.tipo,"${t}"\\)`, "tipo-" + t)])),
    quadrantes: Object.fromEntries(QUADRANTES.map((q) => [q.id, alerta(anamSrc, `locHas\\("${q.id}"\\)`, "quad-" + q.id)])),
    difusa: alerta(anamSrc, 'D\\.difusa', "quad-difusa"),
    quadVazio: grab(anamSrc, /padding:8px 0;">([^<]+)<\/div>'/, "quad-vazio"),
    irrad: Object.fromEntries(["dorso", "virilha", "ombrod", "ombroe", "retro", "flancos"].map((t) => [t, alerta(anamSrc, `has\\(D\\.irrad,"${t}"\\)`, "irrad-" + t)])),
    padrao: Object.fromEntries(["constante", "intermit", "crescendo", "resolucao"].map((t) => [t, alerta(anamSrc, `D\\.padrao==="${t}"`, "padrao-" + t)])),
    mod: {
      alimAlivia: alerta(anamSrc, 'D\\.mod\\.alim==="alivia"', "mod-alim-a"),
      alimAgrava: alerta(anamSrc, 'D\\.mod\\.alim==="agrava"', "mod-alim-g"),
      jejumAlivia: alerta(anamSrc, 'D\\.mod\\.jejum==="alivia"', "mod-jejum-a"),
      jejumAgrava: alerta(anamSrc, 'D\\.mod\\.jejum==="agrava"', "mod-jejum-g"),
      defecAlivia: alerta(anamSrc, 'D\\.mod\\.defec==="alivia"', "mod-defec-a"),
      defecAgrava: alerta(anamSrc, 'D\\.mod\\.defec==="agrava"', "mod-defec-g"),
      movAgrava: alerta(anamSrc, 'D\\.mod\\.mov==="agrava"', "mod-mov-g"),
      posAlivia: alerta(anamSrc, 'D\\.mod\\.pos==="alivia"', "mod-pos-a"),
      posAgrava: alerta(anamSrc, 'D\\.mod\\.pos==="agrava"', "mod-pos-g"),
    },
  },
  contexto: {
    aviso: grab(anamSrc, /'<div class="alert alert-y" style="margin-bottom:16px">(Há frequentemente[^']+)<\/div>'/, "ctx-aviso2"),
    pergunta: grab(anamSrc, /font-size:14px">(Há algum factor[^<]+)<\/div>/, "ctx-pergunta"),
    perguntaHint: grab(anamSrc, /<div class="hint" style="margin-bottom:10px">(Relação com refeições[^<]+)<\/div>/, "ctx-hint"),
    semCtx: "<b>Sem contexto desencadeante identificado</b>" + grab(anamSrc, /<b>Sem contexto desencadeante identificado<\/b>([^']+)<\/div>'/, "ctx-sem"),
    relLogoapos: alerta(anamSrc, 'D\\.relRef==="logoapos"', "rel-logoapos"),
    relGordura: alerta(anamSrc, 'D\\.relRef==="gordura"', "rel-gordura"),
    relJejum: alerta(anamSrc, 'D\\.relRef==="2_3h"\\|\\|D\\.relRef==="jejum"', "rel-jejum"),
    aines: alerta(anamSrc, 'D\\.ainesRec===true', "aines"),
    alcool: alerta(anamSrc, 'D\\.alcoolRec===true', "alcool"),
    movImobiliza: alerta(anamSrc, 'D\\.movDes==="imobiliza"', "mov-imob"),
    movAgita: alerta(anamSrc, 'D\\.movDes==="agita"', "mov-agita"),
    menstrPeri: alerta(anamSrc, 'D\\.menstr==="peri"', "menstr-peri"),
    menstrMeio: alerta(anamSrc, 'D\\.menstr==="meio"', "menstr-meio"),
  },
  alm: {
    intro: grab(anamSrc, /'<div class="alert alert-r">(Qualquer sinal de alarme[^<]+)<\/div>/, "alm-intro"),
    perdaPonderal: alerta(anamSrc, 'has\\(D\\.alm,"perdaponderal"\\)', "alm-pp"),
  },
  hab: {
    alcExc: grab(anamSrc, /text:"(Álcool excessivo:[^"]+)"/, "hab-alc"),
    tabaco: grab(anamSrc, /text:"(Tabagismo:[^"]+)"/, "hab-tab"),
    dietaGordura: grab(anamSrc, /text:"(Dieta rica em gordura:[^"]+)"/, "hab-gord"),
    dietaPobreFibra: grab(anamSrc, /text:"(Dieta pobre em fibra:[^"]+)"/, "hab-fibra"),
  },
  eo: {
    mucDesc: alerta(anamSrc, 'has\\(D\\.muc,"desc"\\)', "eo-desc"),
    mucDesid: alerta(anamSrc, 'has\\(D\\.muc,"desid"\\)', "eo-desid"),
    mucIct: alerta(anamSrc, 'has\\(D\\.muc,"ict"\\)', "eo-ict"),
    acrArr: alerta(anamSrc, 'D\\.acr\\.r==="arr"', "eo-arr"),
    acrTaq: alerta(anamSrc, 'D\\.acr\\.f==="taq"', "eo-taq"),
    acrBra: alerta(anamSrc, 'D\\.acr\\.f==="bra"', "eo-bra"),
    apMvDim: alerta(anamSrc, 'D\\.apr\\.mv==="dim"', "eo-mv"),
    apCrep: alerta(anamSrc, 'has\\(D\\.apr\\.ra,"Crepitações"\\)', "eo-crep"),
    eoQuadSufixo: grab(anamSrc, />Doloroso em: '\+qs\+'\.([^']+)<\/div>'/, "eo-quad"),
    defesaLocalizada: alerta(anamSrc, 'D\\.defesa==="localizada"', "eo-def-loc"),
    defesaGeneralizada: alerta(anamSrc, 'D\\.defesa==="generalizada"', "eo-def-gen"),
    defesaTabua: alerta(anamSrc, 'D\\.defesa==="tabua"', "eo-def-tab"),
    rhaAum: alerta(anamSrc, 'D\\.rha==="aum"', "eo-rha-aum"),
    rhaDim: alerta(anamSrc, 'D\\.rha==="dim"', "eo-rha-dim"),
    rhaAus: alerta(anamSrc, 'D\\.rha==="aus"', "eo-rha-aus"),
    rhaMet: alerta(anamSrc, 'D\\.rha==="met"', "eo-rha-met"),
    massaPalpavel: alerta(anamSrc, 'has\\(D\\.massa,"Massa palpável"\\)', "eo-massa"),
    hepatomegalia: alerta(anamSrc, 'has\\(D\\.massa,"Hepatomegália"\\)', "eo-hep"),
    esplenomegalia: alerta(anamSrc, 'has\\(D\\.massa,"Esplenomegália"\\)', "eo-esp"),
    massaPulsatil: alerta(anamSrc, 'has\\(D\\.massa,"Massa pulsátil"\\)', "eo-puls"),
    globoVesical: alerta(anamSrc, 'has\\(D\\.massa,"Globo vesical"\\)', "eo-globo"),
    sinaisInfo: SINAIS_INFO,
    sinaisNota: grab(anamSrc, /font-style:italic">(Para cada sinal:[\s\S]*?)<\/div>'/, "eo-sinais-nota"),
    trSangue: alerta(anamSrc, 'D\\.tr==="sangue"', "eo-tr-sangue"),
    trMelena: alerta(anamSrc, 'D\\.tr==="melena"', "eo-tr-melena"),
    trMassa: alerta(anamSrc, 'D\\.tr==="massa"', "eo-tr-massa"),
    trDor: alerta(anamSrc, 'D\\.tr==="dor"', "eo-tr-dor"),
    miEd: alerta(anamSrc, 'D\\.mi\\.ed', "eo-mi-ed"),
    miTvp: alerta(anamSrc, 'D\\.mi\\.tvp', "eo-mi-tvp"),
    obesoOb: alerta(anamSrc, 'D\\.obeso==="ob"', "eo-obeso"),
    peleEquimoses: alerta(anamSrc, 'has\\(D\\.pele,"greyturner"\\)\\|\\|has\\(D\\.pele,"cullen"\\)', "eo-pele"),
  },
  notaIntro: grab(anamSrc, /(Exemplo pedagógico de como a informação[\s\S]*?estruturada\.)/, "nota-intro"),
};

// bibliografia (chamadas src() do rBiblio, com títulos de secção)
const biblioSrcFn = anamSrc.slice(anamSrc.indexOf("function rBiblio()"));
const biblioSecs = [...biblioSrcFn.matchAll(/margin:(?:0 0 10px|24px 0 10px)">([^<]+)<\/div>'/g)].map((m) => m[1]);
const biblioBlocos = biblioSrcFn.split(/margin:(?:0 0 10px|24px 0 10px)">[^<]+<\/div>'/).slice(1);
const reSrcCall = /src\("([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)"\)/g;
const biblio = biblioSecs.map((titulo, i) => ({
  titulo,
  itens: [...biblioBlocos[i].matchAll(reSrcCall)].map((m) => ({ num: m[1], autor: m[2], titulo: m[3], fonte: m[4], tipo: m[5] })),
}));
const totalBiblio = biblio.reduce((s, g) => s + g.itens.length, 0);
if (totalBiblio !== 22) throw new Error("esperava 22 refs na bibliografia, vieram " + totalBiblio);
const biblioNota = clean(grab(biblioSrcFn, /<b>Nota\.<\/b>([\s\S]*?)<\/div>'/, "biblio-nota"));
const biblioTermos = clean(grab(biblioSrcFn, /<b>Termos de uso\.<\/b>([\s\S]*?)<\/div>'/, "biblio-termos"));

// ═══ QUIZ ═══
const CASES = evalLit(literalAfter(quizSrc, /let CASES = \[/));
const CASES2 = evalLit(literalAfter(quizSrc, /const CASES2 = \[/));
const CASES3 = evalLit(literalAfter(quizSrc, /const CASES3 = \[/));
const DEFAULT_TIPS = evalLit(literalAfter(quizSrc, /const DEFAULT_TIPS=\{/));
const casos = [...CASES, ...CASES2, ...CASES3];
if (casos.length !== 50) throw new Error("esperava 50 casos, vieram " + casos.length);
const quiz = {
  titulo: clean(grab(quizSrc, /<h1 class="title"[^>]*>([\s\S]*?)<\/h1>/, "quiz-titulo")).replace(/<\/?em>/g, ""),
  sub: clean(grab(quizSrc, /<p class="subtitle"[^>]*>([\s\S]*?)<\/p>/, "quiz-sub")),
  dicas: DEFAULT_TIPS,
  casos,
};
// disclaimer e onboarding são opcionais neste ficheiro
const disc = /<span style="flex:1">([\s\S]*?)<\/span>/.exec(quizSrc);
if (disc) quiz.disclaimer = clean(disc[1]);
const ob = /class="onboard-eyebrow">([^<]+)</.exec(quizSrc);
if (ob) {
  quiz.onboarding = {
    eyebrow: ob[1],
    titulo: grab(quizSrc, /class="onboard-title">([^<]+)</, "ob-titulo"),
    contexto: clean(grab(quizSrc, /class="onboard-context">\s*([\s\S]*?)<\/div>/, "ob-contexto")),
    passos: [...quizSrc.matchAll(/class="onboard-step-text">([\s\S]*?)<\/div>/g)].map((m) => clean(m[1])),
    cta: grab(quizSrc, /class="onboard-cta"[^>]*>([^<]+)</, "ob-cta"),
  };
}

// ═══ escrever ═══
const principal = { id: "dor_abdominal", titulo: "Dor Abdominal", menu, flashcards };
const anamnese = { ageBuckets: AGE_BUCKETS, quadrantes: QUADRANTES, symCats, syms: SYMS, alms: ALMS, drgcls: DRGCLS, ants: ANTS, ui, biblio: { grupos: biblio, nota: biblioNota, termos: biblioTermos } };

const w = (file, obj) => {
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(obj, null, 1) + "\n");
  console.log("✓", file, Math.round(JSON.stringify(obj).length / 1024) + "kB");
};
w("dor-abdominal.json", principal);
w("dor-abdominal-anamnese.json", anamnese);
w("dor-abdominal-quiz.json", quiz);

console.log("\nresumo: syms", SYMS.length, "· alms", ALMS.length, "· drgcls", DRGCLS.length, "· ants", ANTS.length,
  "· quadrantes", QUADRANTES.length, "· sinais", SINAIS_INFO.length, "· biblio", totalBiblio,
  "· casos", casos.length, "· dicas", Object.keys(DEFAULT_TIPS).length, "· flashcards", EXAMPLES.length,
  "· onboarding", quiz.onboarding ? "sim" : "não", "· disclaimer", quiz.disclaimer ? "sim" : "não");

// ═══ GUIA TEÓRICO (dor_abd_-_guia.html): avaliação do script inteiro com DOM falso ═══
const guiaSrc = fs.readFileSync(path.join(DIR, "dor_abd_-_guia.html"), "utf8");
const scriptJs = guiaSrc.slice(guiaSrc.indexOf("<script>") + 8, guiaSrc.lastIndexOf("</script>"));
const elems = {};
const fakeEl = (id) => elems[id] || (elems[id] = { innerHTML: "", style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, addEventListener() {}, setAttribute() {}, textContent: "" });
const sb = {
  document: {
    getElementById: fakeEl,
    querySelector: () => fakeEl("_q"),
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: () => fakeEl("_c" + Math.random()),
    body: fakeEl("_body"),
  },
  window: { addEventListener() {}, scrollTo() {} },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  setTimeout() {}, alert() {}, confirm: () => false, console,
  encodeURIComponent, navigator: {},
};
sb.window.document = sb.document;
vm.runInNewContext(scriptJs, sb, { timeout: 5000 });
const fullHtml = elems["symptom-page"].innerHTML;
if (!fullHtml || fullHtml.length < 10000) throw new Error("buildDorPage não produziu HTML");

// transformação: interatividade fica para o React; acentos fixos → tokens
function transf(html, label) {
  let out = html;
  out = out.replace(/ onclick="toggleGSec\('[^']*'\)"/g, "");
  out = out.replace(/ onclick="showQuad\(this,\\?'(\w+)\\?'\)"/g, ' data-quad="$1"');
  out = out.replace(/ onclick="[^"]*"/g, "");
  out = out.replace(/stroke="#c2410c"/g, 'stroke="currentColor"');
  out = out.replace(/#c2410c/g, "var(--acento)");
  out = out.replace(/#ea580c/g, "color-mix(in srgb, var(--acento) 80%, #fff)");
  out = out.replace(/rgba\(194,65,12,(0?\.\d+)\)/g, "color-mix(in srgb, var(--acento) calc($1 * 100%), transparent)");
  if (/onclick=/.test(out)) throw new Error("onclick remanescente em " + label);
  return out;
}
function fatiar(html, marker) {
  const out = []; const idxs = []; let m;
  const re = new RegExp(marker, "g");
  while ((m = re.exec(html))) idxs.push({ at: m.index, attr: m[1] });
  for (let k = 0; k < idxs.length; k++) out.push({ attr: idxs[k].attr, html: html.slice(idxs[k].at, k + 1 < idxs.length ? idxs[k + 1].at : html.length) });
  return out;
}
const tabsG = {};
for (const b of fatiar(fullHtml, '<div class="tab-content[^"]*" data-tab-content="(\\d)">')) tabsG[b.attr] = b.html;
const inner = (html) => html.slice(html.indexOf(">") + 1);

// TAB 1: guia teórico (6 painéis)
const gtLabels = [...tabsG["1"].matchAll(/class="gt-stab[^"]*"[^>]*>([^<]+)</g)].map((m) => m[1]);
const gtPanels = fatiar(tabsG["1"], '<div class="gt-panel[^"]*" data-gt="(\\d)">');
if (gtPanels.length !== 6) throw new Error("esperava 6 gt-panels, vieram " + gtPanels.length);
const gt = gtPanels.map((p, i) => ({ label: gtLabels[i], html: transf(inner(p.html).replace(/<\/div>\s*$/, ""), "gt-" + i) }));

// TAB 2: tratamento (4 painéis)
const txLabels = [...tabsG["2"].matchAll(/data-txt="\d"[^>]*>([^<]+)</g)].map((m) => m[1]);
const txPanels = fatiar(tabsG["2"], '<div class="tx-panel[^"]*" data-txp="(\\d)">');
if (txPanels.length !== 4) throw new Error("esperava 4 tx-panels, vieram " + txPanels.length);
const tratamento = { labels: txLabels, paineis: txPanels.map((p, i) => ({ html: transf(inner(p.html), "tx-" + i) })) };

// TAB 6: escalas — Alvarado + AIR interativas + outras
const ALV_ITEMS = evalLit(literalAfter(scriptJs, /var ALV_ITEMS = \[/));
const AIR_ITEMS = evalLit(literalAfter(scriptJs, /var AIR_ITEMS = \[/));
const interps = (seg) => [...seg.matchAll(/total <= (\d+)\)\{ interp='([^']+)'/g)].map((m) => ({ ate: +m[1], label: m[2] }));
const escSeg = scriptJs.slice(scriptJs.indexOf("function escRender"));
const alvSeg = escSeg.slice(escSeg.indexOf("if(id === 'alvarado')"), escSeg.indexOf("var items = AIR_ITEMS"));
const airSeg = escSeg.slice(escSeg.indexOf("var items = AIR_ITEMS"));
const escMeta = (id) => {
  const block = grab(tabsG["6"], new RegExp(`data-escpanel="${id}"[^>]*>([\\s\\S]*?)<div id="${id}-widget">`), "escm-" + id);
  return {
    fonte: grab(block, /letter-spacing:0.08em">Interativa<\/span><span[^>]*>([^<]+)</, id + "-fonte"),
    nome: grab(block, /<h3[^>]*>([^<]+)<\/h3>/, id + "-nome"),
    desc: grab(block, /<p[^>]*>([^<]+)<\/p>/, id + "-desc"),
  };
};
const escalas = {
  alvarado: { ...escMeta("alvarado"), itens: ALV_ITEMS, interp: [...interps(alvSeg), { ate: 10, label: grab(alvSeg, /else\{ interp='([^']+)'/, "alv-last") }] },
  air: { ...escMeta("air"), itens: AIR_ITEMS, interp: [...interps(airSeg), { ate: 12, label: grab(airSeg, /else\{ interp='([^']+)'/, "air-last") }] },
  outrasHtml: transf(grab(tabsG["6"], /<div class="esc-panel" data-escpanel="outras"[^>]*>([\s\S]*)$/, "esc-outras").replace(/<\/div>\s*<\/div>\s*$/, ""), "esc-outras"),
};

// TAB 7: diagnósticos (lista + comparador)
const DX_DATA = sb.DX_DATA, QUAD_DATA = sb.QUAD_DATA, GLOSS = sb.GLOSS;
if (!DX_DATA?.length || !GLOSS?.length) throw new Error("DX_DATA/GLOSS não capturados");
const distinc = [...scriptJs.matchAll(/set\('([^']+)','([^']+)',\s*\n?\s*'([\s\S]*?)'\);/g)].map((m) => ({ a: m[1], b: m[2], tip: m[3].replace(/\\'/g, "'") }));
if (!distinc.length) throw new Error("distinções DDX não capturadas");
const ddxPanelTxt = {
  titulo: grab(scriptJs, /var DDX_PANEL = '<div class="g-card">' \+\s*\n?\s*'<h2[^>]*>([^<]+)</, "ddx-titulo"),
  sub: grab(scriptJs, /DDX_PANEL[\s\S]{0,800}?margin-bottom:18px">([\s\S]*?)<\/p>'/, "ddx-sub"),
  zonaTitulo: grab(scriptJs, /ddx-zone-h"><span>([^<]+)</, "ddx-zona"),
  hint: grab(scriptJs, /ddx-hint">([^<]+)</, "ddx-hint"),
};
const dx = {
  lista: DX_DATA, cats: sb.DDX_CATS, catLabel: sb.DDX_CAT_LABEL, catColor: sb.DDX_CAT_COLOR,
  patterns: sb.DDX_PATTERNS, distincoes: distinc, painel: ddxPanelTxt, max: 5,
};

// TAB 3: cards · TAB 5: glossário · TAB 4: fontes
const cardsMeta = {
  titulo: grab(tabsG["3"], /<h2[^>]*>([^<]+)<\/h2>/, "cards-titulo"),
  sub: grab(tabsG["3"], /<p[^>]*>([^<]+)<\/p>/, "cards-sub"),
  cats: sb.C_CATS, defaults: sb.C_DEFAULTS,
};
if (!cardsMeta.defaults?.length) throw new Error("C_DEFAULTS não capturado");
const glossario = {
  titulo: grab(tabsG["5"], /<h2[^>]*>([^<]+)<\/h2>/, "glos-titulo"),
  sub: grab(tabsG["5"], /<\/h2><p[^>]*>([^<]+)<\/p>/, "glos-sub"),
  termos: GLOSS,
};
const buildSrc = scriptJs.slice(scriptJs.indexOf("function buildDorPage"));
const fontesArea = buildSrc.slice(buildSrc.indexOf('data-tab-content="4">'), buildSrc.indexOf('data-tab-content="3">'));
const fGrupos = fontesArea.split(/<h3 style="[^"]*">/).slice(1).map((bloco) => ({
  titulo: bloco.slice(0, bloco.indexOf("<")),
  itens: [...bloco.matchAll(/fonteCard\("([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)"(?:,\s*"([^"]*)")?\)/g)]
    .map((m) => ({ num: m[1], autores: m[2], titulo: m[3], fonte: m[4], badge: m[5], badgeTipo: m[6].includes("strong") ? "forte" : m[6].includes("weak") ? "fraca" : "condicional", url: m[7] || "" })),
}));
const totalFontes = fGrupos.reduce((s, g) => s + g.itens.length, 0);
if (totalFontes !== 18) throw new Error("esperava 18 fontes, vieram " + totalFontes);
const fontes = {
  intro: clean(grab(tabsG["4"], /<\/h2><p[^>]*>([\s\S]*?)<\/p>/, "fontes-intro")),
  grupos: fGrupos,
  termos: clean((/Termos de uso\.<\/b>([\s\S]*?)<\/div>/.exec(tabsG["4"]) || [, ""])[1]),
};

const guiaJson = {
  guiaSub: clean(grab(fullHtml, /<\/h1><p style="font-size:15px[^>]*>([\s\S]*?)<\/p>/, "guia-sub")),
  quadData: QUAD_DATA,
  gt, tratamento, escalas, dx, cards: cardsMeta, fontes, glossario,
};
w("dor-abdominal-guia.json", guiaJson);
console.log("guia: gt", gt.length, "· tx", txLabels.length, "· dx", DX_DATA.length, "· distinções", distinc.length,
  "· alv", ALV_ITEMS.length, "· air", AIR_ITEMS.length, "· cards", cardsMeta.defaults.length, "· gloss", GLOSS.length, "· fontes", totalFontes);
