// Extrator dos guias InfetAcesso (Adulto + Pediatria) → JSON em /conteudo/infetoacesso.
// Os HTML são estáticos: o conteúdo clínico vive no markup. Recortamos cada painel
// verbatim (nunca retranscrito), preservando tabelas, atb-blocks, badges AWaRe e alertas.
// Estrutura: sistema → doença → abas. A pediatria acrescenta a vista "doses" + popover.
// Saídas: adulto.json e pediatria.json (sistemas, meta home/rodapé, e doses na ped).
import fs from "fs";
import path from "path";

const DIR = "/Users/pedroferreira/Desktop/Guia antibioterapia";
const OUT = "/Users/pedroferreira/Desktop/medguia/conteudo/infetoacesso";
fs.mkdirSync(OUT, { recursive: true });

let erros = 0;
const verificar = (nome, real, esperado) => {
  const ok = real === esperado;
  if (!ok) erros++;
  console.log(`${ok ? "✓" : "✗ FALHA"} ${nome}: ${real}${ok ? "" : ` (esperado ${esperado})`}`);
};

// ── slicer de divs balanceadas ───────────────────────────────────────────────
// A partir de um índice que aponta para um "<div", devolve "<div>…</div>" completo.
function sliceDiv(html, startIdx) {
  const re = /<div\b|<\/div>/gi;
  re.lastIndex = startIdx;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0].toLowerCase() === "</div>") {
      depth--;
      if (depth === 0) return html.slice(startIdx, re.lastIndex);
    } else depth++;
  }
  throw new Error("div não fechada em " + startIdx);
}
// interior de um slice "<div ...>…</div>"
const innerDiv = (slice) => slice.replace(/^<div\b[^>]*>/i, "").replace(/<\/div>\s*$/i, "").trim();
// todas as posições onde começa um <div com determinada classe
function* posClasse(html, classe, regiaoIni = 0, regiaoFim = html.length) {
  // o nome da classe tem de terminar aqui (seguido de espaço ou aspa) — senão
  // "sys-card" casaria dentro de "sys-card-inner", "card" dentro de "card-header", etc.
  const re = new RegExp(`<div class="${classe}(?=[ "])`, "gi");
  re.lastIndex = regiaoIni;
  let m;
  while ((m = re.exec(html)) && m.index < regiaoFim) yield m.index;
}
const txt = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
// remove handlers inline (onclick…): em React via dangerouslySetInnerHTML rebentariam
// (as funções do original não existem); a interatividade é reconstruída no motor.
// Mantém data-* (usados na delegação do Centor), style e href.
const semHandlers = (h) => h.replace(/\s+on[a-z]+="[^"]*"/gi, "");
const attr = (frag, nome) => { const m = frag.match(new RegExp(`${nome}="([^"]*)"`)); return m ? m[1] : ""; };

// ── extrai uma doença (card) ─────────────────────────────────────────────────
function extrairDoenca(cardSlice) {
  const head = cardSlice.match(/^<div class="card"\s+id="([^"]+)"([^>]*)>/i);
  const id = head ? head[1] : "";
  const search = attr(head ? head[2] : "", "data-search");
  const icon = (cardSlice.match(/<div class="card-icon">([\s\S]*?)<\/div>/i) || [, ""])[1].trim();
  const title = txt((cardSlice.match(/<div class="card-title">([\s\S]*?)<\/div>/i) || [, ""])[1]);

  // bloco das abas (botões data-tab → label, por ordem)
  const tabsIni = cardSlice.search(/<div class="tabs">/i);
  const tabsSlice = sliceDiv(cardSlice, tabsIni);
  const botoes = [...tabsSlice.matchAll(/data-tab="([^"]+)"[^>]*>([\s\S]*?)<\/button>/gi)]
    .map((b) => ({ id: b[1], label: txt(b[2]) }));

  // painéis (cada tab-panel id → interior verbatim)
  const paineis = {};
  for (const p of posClasse(cardSlice, "tab-panel")) {
    const slice = sliceDiv(cardSlice, p);
    const pid = attr(slice.slice(0, slice.indexOf(">") + 1), "id");
    const active = /^<div class="tab-panel active"/i.test(slice);
    paineis[pid] = { html: semHandlers(innerDiv(slice)), active };
  }

  // casar abas com painéis (ordem das abas)
  const tabs = botoes.map((b) => {
    if (!paineis[b.id]) throw new Error(`aba sem painel: ${id} / ${b.id}`);
    return { id: b.id, label: b.label, active: !!paineis[b.id].active, html: paineis[b.id].html };
  });
  if (tabs.length !== botoes.length || tabs.length !== Object.keys(paineis).length)
    throw new Error(`abas≠painéis em ${id}: ${botoes.length} botões, ${Object.keys(paineis).length} painéis`);

  return { id, icon, title, search, tabs };
}

// ── extrai um ficheiro completo ──────────────────────────────────────────────
function extrairFicheiro(html, { sistemasEsperados, doencasEsperadas, comDoses }) {
  // Vistas delimitadas por IRMÃOS (início da vista seguinte), não por contagem de divs:
  // a fonte tem nesting tolerado-pelo-browser (ex.: a vista ORL tem 1 </div> em falta),
  // que faria o slice balanceado transbordar para a vista seguinte.
  const fimGlobal = html.search(/<script/i);
  const marks = [...html.matchAll(/<div class="view(?: active)?" id="(view-[^"]+)">/gi)];
  const regiao = {};
  marks.forEach((m, i) => {
    regiao[m[1].replace("view-", "")] = html.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : fimGlobal);
  });

  // home: sys-cards (ordem, nome, label, icon, bubbles). Ignora o cartão doses-rainbow.
  const homeSlice = regiao.home;
  const sistemas = [];
  for (const p of posClasse(homeSlice, "sys-card")) {
    const slice = sliceDiv(homeSlice, p);
    const classes = (slice.match(/^<div class="([^"]+)"/i) || [, ""])[1];
    if (/doses-rainbow/.test(classes)) continue; // cartão especial das doses (ped)
    const sysId = classes.split(/\s+/).find((c) => c !== "sys-card");
    const icon = txt((slice.match(/<div class="sys-icon">([\s\S]*?)<\/div>/i) || [, ""])[1]);
    const nome = txt((slice.match(/<div class="sys-card-title">([\s\S]*?)<\/div>/i) || [, ""])[1]);
    const label = txt((slice.match(/<div class="sys-card-label">([\s\S]*?)<\/div>/i) || [, ""])[1]);
    const bubbles = [...slice.matchAll(/showSystem\('[^']+','([^']+)'\)"[^>]*>([\s\S]*?)<\/span>/gi)]
      .map((b) => ({ doencaId: b[1], label: txt(b[2]) }));
    sistemas.push({ id: sysId, icon, nome, label, bubbles, diseases: [] });
  }

  // cada vista de sistema → detail-title + doenças (cartões dentro da região da vista)
  for (const s of sistemas) {
    const viewSlice = regiao[s.id];
    if (!viewSlice) throw new Error("vista não encontrada: " + s.id);
    s.detailTitle = txt((viewSlice.match(/<span class="detail-title">([\s\S]*?)<\/span>/i) || [, ""])[1]);
    for (const cp of posClasse(viewSlice, "card")) {
      // só cartões de doença: <div class="card" id=...> (não card-header/body/etc.)
      if (!/^<div class="card"\s+id=/i.test(viewSlice.slice(cp, cp + 40))) continue;
      s.diseases.push(extrairDoenca(sliceDiv(viewSlice, cp)));
    }
  }

  // meta: home header + footer
  const meta = {
    titulo: txt((homeSlice.match(/<header class="page-header">[\s\S]*?<h1>([\s\S]*?)<\/h1>/i) || [, ""])[1]),
    subtitulo: txt((homeSlice.match(/<header class="page-header">[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i) || [, ""])[1]),
    sectionLabel: txt((homeSlice.match(/<div class="section-label"><h2>([\s\S]*?)<\/h2>/i) || [, ""])[1]),
  };
  // rodapé (1.º footer page-footer) verbatim
  const fIni = html.search(/<footer class="page-footer">/i);
  const fEnd = html.indexOf("</footer>", fIni) + "</footer>".length;
  meta.footerHtml = html.slice(fIni, fEnd).trim();

  const out = { meta, sistemas };

  // pediatria: vista doses + popover de cálculo
  if (comDoses) {
    const dIni = html.search(/<div class="view" id="view-doses">/i);
    out.doses = { html: semHandlers(innerDiv(sliceDiv(html, dIni))) };
    const popIni = html.search(/<div class="dose-calc-popover" id="doseCalcPopover">/i);
    out.doseCalcPopover = semHandlers(innerDiv(sliceDiv(html, popIni)));
  }

  // ── verificações ──
  const tag = comDoses ? "ped" : "adulto";
  verificar(`[${tag}] sistemas`, sistemas.length, sistemasEsperados);
  const totalDoencas = sistemas.reduce((n, s) => n + s.diseases.length, 0);
  verificar(`[${tag}] doenças`, totalDoencas, doencasEsperadas);
  const ids = sistemas.flatMap((s) => s.diseases.map((d) => d.id));
  verificar(`[${tag}] ids de doença únicos`, new Set(ids).size, ids.length);
  // bubbles apontam para doenças existentes
  const idSet = new Set(ids);
  const bubblesOrfas = sistemas.flatMap((s) => s.bubbles.filter((b) => !idSet.has(b.doencaId)).map((b) => `${s.id}:${b.doencaId}`));
  verificar(`[${tag}] bubbles órfãs`, bubblesOrfas.length, 0);
  if (bubblesOrfas.length) console.log("   →", bubblesOrfas.join(", "));
  // toda a doença tem ≥1 aba; relatório de HTML embutido
  const semAba = sistemas.flatMap((s) => s.diseases.filter((d) => !d.tabs.length).map((d) => d.id));
  verificar(`[${tag}] doenças com ≥1 aba`, totalDoencas - semAba.length, totalDoencas);
  const totalAbas = sistemas.reduce((n, s) => n + s.diseases.reduce((m, d) => m + d.tabs.length, 0), 0);
  const totalBadges = (html.match(/badge-(access|watch|reserve)/gi) || []).length;
  console.log(`   [${tag}] ${totalAbas} abas, ${totalBadges} badges AWaRe, footer ${meta.footerHtml.length} chars`);

  return out;
}

// ── correr ───────────────────────────────────────────────────────────────────
const adultoHtml = fs.readFileSync(path.join(DIR, "index-adulto-5.html"), "utf8");
const pedHtml = fs.readFileSync(path.join(DIR, "index-pediatria-4.html"), "utf8");

const adulto = extrairFicheiro(adultoHtml, { sistemasEsperados: 7, doencasEsperadas: 39, comDoses: false });
const ped = extrairFicheiro(pedHtml, { sistemasEsperados: 6, doencasEsperadas: 20, comDoses: true });

const escrever = (nome, obj) => {
  fs.writeFileSync(path.join(OUT, nome), JSON.stringify(obj, null, 1) + "\n");
  console.log("→", nome, `(${(fs.statSync(path.join(OUT, nome)).size / 1024).toFixed(0)} KB)`);
};
escrever("adulto.json", adulto);
escrever("pediatria.json", ped);

console.log(erros ? `\n✗ ${erros} verificações falharam` : "\n✓ todas as verificações passaram");
process.exit(erros ? 1 : 0);
