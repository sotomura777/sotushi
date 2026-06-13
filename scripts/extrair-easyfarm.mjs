// Extrator do EasyFarm (Guia de Fármacos) → JSON em /conteudo/easyfarm.
// Os HTML são estáticos: o conteúdo clínico vive no markup. Recortamos cada painel
// verbatim (nunca retranscrito), preservando cards, tabelas, notas, tips, acordeões,
// alertas e bibliografia. A interatividade é reconstruída no motor (React):
//   - separadores e sub-separadores  → estado React (labels extraídos aqui)
//   - acordeões de indicação         → convertidos para <details>/<summary>
//   - toggle "Linguagem simples"      → convertido para <details>
//   - calculadora pediátrica          → marcador <div data-easyf-pedcalc> + params em JSON
// Saídas: meta.json (índice + classes) e <slug>.json por fármaco.
import fs from "fs";
import path from "path";
import vm from "vm";

const DIR = "/Users/pedroferreira/Desktop/EasyFarm";
const OUT = "/Users/pedroferreira/Desktop/medguia/conteudo/easyfarm";
fs.mkdirSync(OUT, { recursive: true });

let erros = 0;
const verificar = (nome, real, esperado) => {
  const ok = real === esperado;
  if (!ok) erros++;
  console.log(`${ok ? "✓" : "✗ FALHA"} ${nome}: ${real}${ok ? "" : ` (esperado ${esperado})`}`);
};

// ── slicer de tags balanceadas ───────────────────────────────────────────────
// A partir de um índice que aponta para "<tag", devolve "<tag>…</tag>" completo.
function sliceTag(html, startIdx, tag = "div") {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, "gi");
  re.lastIndex = startIdx;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0].toLowerCase() === `</${tag}>`) {
      depth--;
      if (depth === 0) return html.slice(startIdx, re.lastIndex);
    } else depth++;
  }
  throw new Error(`<${tag}> não fechada em ${startIdx}`);
}
const innerOf = (slice, tag = "div") =>
  slice.replace(new RegExp(`^<${tag}\\b[^>]*>`, "i"), "").replace(new RegExp(`</${tag}>\\s*$`, "i"), "").trim();

// posições onde começa um "<tag class="classe"…" (classe tem de terminar em espaço/aspa)
function* posClasse(html, classe, tag = "div", ini = 0, fim = html.length) {
  const re = new RegExp(`<${tag}\\b[^>]*class="${classe}(?=[ "])`, "gi");
  re.lastIndex = ini;
  let m;
  while ((m = re.exec(html)) && m.index < fim) yield m.index;
}
const primeira = (it) => { for (const x of it) return x; return -1; };
const ent = (s) => s
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
// para campos de TEXTO (renderizados como texto em React): tira tags e descodifica entidades.
const txt = (s) => ent(s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
const attr = (frag, nome) => { const m = frag.match(new RegExp(`${nome}="([^"]*)"`)); return m ? m[1] : ""; };
// remove handlers inline (onclick…): em React rebentariam (as funções do original não existem).
const semHandlers = (h) => h.replace(/\s+on[a-z]+="[^"]*"/gi, "");

// ── conversão dos acordeões .indication-item → <details> ─────────────────────
// Original: <div class="indication-item"><div class="indication-header" onclick…>
//   <span class="indication-name">…</span><svg class="indication-chevron">…</svg></div>
//   <div class="indication-body"><div class="indication-body-inner">…</div></div></div>
// Resultado: <details class="indication-item"><summary class="indication-header">…</summary>
//   <div class="indication-body-inner">…</div></details>   (sem JS, CSS roda o chevron)
function converterIndicacoes(html) {
  let n = 0;
  let out = html;
  let guard = 0;
  while (true) {
    const idx = primeira(posClasse(out, "indication-item"));
    if (idx === -1) break;
    if (++guard > 500) throw new Error("loop de indication-item");
    const item = sliceTag(out, idx, "div");
    const headIdx = item.search(/<div\b[^>]*class="indication-header(?=[ "])/i);
    const head = sliceTag(item, headIdx, "div");
    const headInner = innerOf(head, "div"); // contém .indication-name + .indication-chevron
    const bodyIdx = item.search(/<div\b[^>]*class="indication-body(?=[ "])/i);
    const body = sliceTag(item, bodyIdx, "div");
    // o body tem 1 filho: .indication-body-inner (mantemos verbatim)
    const innerIdx = body.search(/<div\b[^>]*class="indication-body-inner(?=[ "])/i);
    const innerSlice = sliceTag(body, innerIdx, "div");
    const det = `<details class="indication-item"><summary class="indication-header">${headInner}</summary>${innerSlice}</details>`;
    out = out.slice(0, idx) + det + out.slice(idx + item.length);
    n++;
  }
  return { html: out, n };
}

// ── conversão do toggle "Linguagem simples" → <details> ──────────────────────
// Original: <div class="decode-toggle"><button class="decode-btn" onclick…>…
//   <span>Linguagem simples</span><span class="decode-switch">OFF</span></button></div>
//   <div class="decode-section">…</div>
// Resultado: <details class="easyf-decode"><summary class="decode-btn">… Linguagem simples</summary>…</details>
function converterDecode(html) {
  const tIdx = primeira(posClasse(html, "decode-toggle"));
  if (tIdx === -1) return { html, n: 0 };
  const toggle = sliceTag(html, tIdx, "div");
  // a secção vem logo a seguir ao toggle
  const after = tIdx + toggle.length;
  const sIdx = html.indexOf('<div class="decode-section', after);
  if (sIdx === -1) throw new Error("decode-section não encontrada");
  const section = sliceTag(html, sIdx, "div");
  const sectionInner = innerOf(section, "div");
  // ícone + rótulo do botão (sem o switch OFF/ON, que era estado JS)
  const btn = toggle.match(/<button[^>]*class="decode-btn"[^>]*>([\s\S]*?)<\/button>/i);
  let label = btn ? btn[1] : "Linguagem simples";
  label = label.replace(/<span class="decode-switch"[\s\S]*?<\/span>/i, "").trim();
  const det = `<details class="easyf-decode"><summary class="decode-btn">${label}</summary><div class="decode-section card">${sectionInner}</div></details>`;
  return { html: html.slice(0, tIdx) + det + html.slice(sIdx + section.length), n: 1 };
}

// ── extração da calculadora pediátrica (params do <script>) ──────────────────
function extrairPedCalc(htmlPanel, scriptTxt) {
  // toggles (concentração e dose) — do HTML do painel
  const toggles = (tipo) =>
    [...htmlPanel.matchAll(new RegExp(`data-pedbtn="${tipo}"\\s+data-val="([^"]+)"[^>]*>([^<]+)</button>`, "gi"))]
      .map((m) => ({ val: Number(m[1]), label: txt(m[2]) }));
  const concentracoes = toggles("conc");
  const doses = toggles("dose");
  if (!concentracoes.length || !doses.length) throw new Error("ped: toggles não encontrados");

  const pesosM = scriptTxt.match(/PED_WEIGHTS\s*=\s*\[([^\]]+)\]/);
  const pesos = pesosM ? pesosM[1].split(",").map((s) => Number(s.trim())) : [];
  // máx mg/kg/dia: de PED_MAX_PER_DAY ou do `maxMg = w * N`
  const maxM = scriptTxt.match(/PED_MAX_PER_DAY\s*=\s*(\d+)/) || scriptTxt.match(/maxMg\s*=\s*w\s*\*\s*(\d+)/);
  const maxDiaMgKg = maxM ? Number(maxM[1]) : 0;
  if (!pesos.length || !maxDiaMgKg) throw new Error("ped: pesos/máx não encontrados");

  // contexto por dose: ctx = dose === <doses[0]> ? 'A' : 'B'
  const ctxM = scriptTxt.match(/ctx\s*=\s*dose\s*===\s*\d+\s*\?\s*'([\s\S]*?)'\s*:\s*'([\s\S]*?)'/);
  // frequência por dose (paracetamol) OU célula constante (ibuprofeno)
  const freqTern = scriptTxt.match(/freq\s*=\s*dose\s*===\s*\d+\s*\?\s*'([^']*)'\s*:\s*'([^']*)'/);
  let freqConst = "";
  if (!freqTern) {
    const cell = scriptTxt.match(/<td>\s*(\d\s*\/\s*\d\s*h[^<{}]*?)\s*<\/td>/i);
    freqConst = cell ? cell[1].trim() : "";
  }
  const dosesOut = doses.map((d, i) => ({
    val: d.val,
    label: d.label,
    contexto: ctxM ? (i === 0 ? ctxM[1] : ctxM[2]) : "",
    freq: freqTern ? (i === 0 ? freqTern[1] : freqTern[2]) : freqConst,
  }));
  if (dosesOut.some((d) => !d.contexto || !d.freq)) throw new Error("ped: contexto/freq em falta");

  return { pesos, maxDiaMgKg, concentracoes, doses: dosesOut };
}

// substitui a região dinâmica do calculador por um marcador <div data-easyf-pedcalc>
function inserirMarcadorPed(html) {
  const gIdx = primeira(posClasse(html, "ped-toggle-group"));
  if (gIdx === -1) return { html, marcou: false };
  // fim = fecho do <div class="table-scroll"> que contém #ped-tbody
  const tbodyIdx = html.indexOf('id="ped-tbody"');
  const scrollIdx = html.lastIndexOf('<div class="table-scroll"', tbodyIdx);
  const scroll = sliceTag(html, scrollIdx, "div");
  const fim = scrollIdx + scroll.length;
  return { html: html.slice(0, gIdx) + '<div data-easyf-pedcalc></div>' + html.slice(fim), marcou: true };
}

// ── pipeline de transformação de um HTML de painel ───────────────────────────
function transformarPainel(html, acc) {
  let h = html;
  const dec = converterDecode(h); h = dec.html; acc.decode += dec.n;
  const ind = converterIndicacoes(h); h = ind.html; acc.indic += ind.n;
  const ped = inserirMarcadorPed(h); h = ped.html; if (ped.marcou) acc.pedMarcadores++;
  h = semHandlers(h);
  return h;
}

// ── extrai uma ficha de fármaco ──────────────────────────────────────────────
function extrairFicha(slug, dci, classeKey) {
  const raw = fs.readFileSync(path.join(DIR, slug + ".html"), "utf8");
  const bodyM = raw.match(/<body>([\s\S]*?)<\/body>/i);
  const body = bodyM[1];
  const scriptM = raw.match(/<script>([\s\S]*?)<\/script>/i);
  const scriptTxt = scriptM ? scriptM[1] : "";
  const acc = { decode: 0, indic: 0, pedMarcadores: 0 };

  // ── HERO ──
  const heroSlice = sliceTag(body, body.search(/<header\b[^>]*class="hero"/i), "header");
  const pill = txt((heroSlice.match(/<span class="hero-pill">([\s\S]*?)<\/span>/i) || [, ""])[1]);
  const titulo = txt((heroSlice.match(/<h1 class="hero-title">([\s\S]*?)<\/h1>/i) || [, ""])[1]);
  const links = [...heroSlice.matchAll(/<a class="hero-action"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ href: m[1], label: txt(m[2]) }));
  const revisao = txt((heroSlice.match(/<div class="hero-review">[\s\S]*?<b>([\s\S]*?)<\/b>/i) || [, ""])[1]);
  const marcasHtml = semHandlers(innerOf(sliceTag(heroSlice, heroSlice.search(/<div\b[^>]*class="hero-brands"/i), "div"), "div"));
  const tags = [...heroSlice.matchAll(/<span class="hero-tag">([\s\S]*?)<\/span>/gi)].map((m) => txt(m[1]));

  // ── SEPARADORES (labels) ──
  const tabsSlice = sliceTag(body, body.search(/<div\b[^>]*class="tabs"(?![-])/i), "div");
  const labels = [...tabsSlice.matchAll(/<button class="tab-btn[^"]*"[^>]*>([\s\S]*?)<\/button>/gi)].map((m) => txt(m[1]));

  // ── PAINÉIS (tab-panel, por data-panel) ──
  const tabs = [];
  let pedCalc = null;
  let i = 0;
  for (const p of posClasse(body, "tab-panel")) {
    const slice = sliceTag(body, p, "div");
    const head = slice.slice(0, slice.indexOf(">") + 1);
    const panelN = Number(attr(head, "data-panel"));
    const label = labels[panelN] ?? labels[i] ?? `Tab ${panelN}`;
    const id = `t${panelN}`;
    let inner = innerOf(slice, "div");

    // calculadora pediátrica (params) antes de marcar — só onde existe
    if (/id="ped-tbody"/.test(inner)) pedCalc = extrairPedCalc(inner, scriptTxt);

    // tem sub-separadores?
    const subIdx = inner.search(/<div\b[^>]*class="sub-tabs"/i);
    if (subIdx !== -1) {
      const subTabsSlice = sliceTag(inner, subIdx, "div");
      const subLabels = [...subTabsSlice.matchAll(/<button class="sub-tab[^"]*"[^>]*>([\s\S]*?)<\/button>/gi)].map((m) => txt(m[1]));
      const subtabs = [];
      let j = 0;
      for (const sp of posClasse(inner, "sub-panel")) {
        const spSlice = sliceTag(inner, sp, "div");
        const spN = Number(attr(spSlice.slice(0, spSlice.indexOf(">") + 1), "data-sub"));
        const spInner = innerOf(spSlice, "div");
        subtabs.push({ id: `s${spN}`, label: subLabels[spN] ?? `Sub ${spN}`, html: transformarPainel(spInner, acc) });
        j++;
      }
      if (subtabs.length !== subLabels.length) throw new Error(`${slug} t${panelN}: sub-tabs≠sub-panels (${subLabels.length}≠${subtabs.length})`);
      tabs.push({ id, label, subtabs });
    } else {
      tabs.push({ id, label, html: transformarPainel(inner, acc) });
    }
    i++;
  }

  // ── BIBLIOGRAFIA ──
  const srcIdx = body.search(/<section\b[^>]*class="sources"/i);
  const sourcesHtml = srcIdx === -1 ? "" : semHandlers(sliceTag(body, srcIdx, "section"));

  const ficha = {
    slug, dci, classeKey,
    hero: { pill, titulo, marcasHtml, tags, links, revisao },
    tabs,
    pedCalc,
    sourcesHtml,
  };
  return { ficha, acc, nTabs: tabs.length };
}

// ── ÍNDICE (farmacos-v4.html) ────────────────────────────────────────────────
const idxRaw = fs.readFileSync(path.join(DIR, "farmacos-v4.html"), "utf8");
const grab = (nome, abre, fecha) => {
  const m = idxRaw.match(new RegExp(`const ${nome}\\s*=\\s*(\\${abre}[\\s\\S]*?\\n\\${fecha});`));
  if (!m) throw new Error(`índice: ${nome} não encontrado`);
  return vm.runInNewContext("(" + m[1] + ")");
};
const CLASS_STYLE = grab("CLASS_STYLE", "{", "}");
const DETAIL_PAGES = grab("DETAIL_PAGES", "{", "}");
const DRUGS = grab("DRUGS", "[", "]");

// conteúdo expandido do "Saber mais" (disclaimer) — sem o botão de fechar
const dispIdx = idxRaw.search(/<div class="disclaimer-expanded-inner">/i);
let disclaimerExpandedHtml = "";
if (dispIdx !== -1) {
  disclaimerExpandedHtml = innerOf(sliceTag(idxRaw, dispIdx, "div"), "div")
    .replace(/<button class="disclaimer-close"[\s\S]*?<\/button>/i, "")
    .trim();
  disclaimerExpandedHtml = semHandlers(disclaimerExpandedHtml);
}

const slugDe = (dci) => (DETAIL_PAGES[dci] || "").replace(/\.html$/, "");
const farmacos = DRUGS.map((d) => ({
  dci: d.dci,
  slug: slugDe(d.dci),
  classe: d.classe,
  classeKey: d.classeKey,
  sistema: d.sistema,
  marcas: d.marcas,
  indicacoes: d.indicacoes,
}));

const meta = {
  nome: "EasyFarm",
  titulo: "Guia de Fármacos",
  subtitulo: "Fichas completas: mecanismo, posologia, formulações e segurança",
  disclaimer: "Conteúdo educativo. Não substitui o julgamento clínico nem o RCM em vigor. Verificar sempre o Infomed do INFARMED.",
  disclaimerExpandedHtml,
  classStyle: CLASS_STYLE,
  farmacos,
};

// ── EXECUÇÃO ─────────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 1) + "\n");
console.log(`→ meta.json (${farmacos.length} fármacos)`);
verificar("fármacos no índice", farmacos.length, 11);
verificar("fármacos com slug", farmacos.filter((f) => f.slug).length, 11);

let totalIndic = 0, totalPed = 0;
for (const f of farmacos) {
  const { ficha, acc, nTabs } = extrairFicha(f.slug, f.dci, f.classeKey);
  fs.writeFileSync(path.join(OUT, f.slug + ".json"), JSON.stringify(ficha, null, 1) + "\n");
  const handlers = JSON.stringify(ficha).match(/on[a-z]+=\\"/gi);
  if (handlers) { erros++; console.log(`✗ ${f.slug}: ${handlers.length} handlers residuais`); }
  if (nTabs !== 5) { erros++; console.log(`✗ ${f.slug}: ${nTabs} tabs (esperado 5)`); }
  totalIndic += acc.indic; totalPed += acc.pedMarcadores;
  console.log(`→ ${f.slug}.json · ${nTabs} tabs · ${acc.indic} acordeões · ${acc.decode} decode · ped:${ficha.pedCalc ? "sim" : "—"}`);
}
verificar("calculadoras pediátricas", totalPed, 2);
console.log(`Total acordeões convertidos: ${totalIndic}`);

if (erros) { console.error(`\n✗ ${erros} falha(s).`); process.exit(1); }
console.log("\n✓ Extração concluída sem erros.");
