// ============================================================================
// exportar-conteudo-rag.mjs — extrai TODA a matéria teórica de /conteudo para
// um formato pronto a alimentar um RAG. Read-only: lê /conteudo, escreve em
// /conteudo-rag (derivado, descartável). Sem dependências.
//
//   node scripts/exportar-conteudo-rag.mjs
//
// Produz:
//   conteudo-rag/medguia-conteudo.jsonl   ← 1 documento por linha {id,modulo,ficheiro,titulo,texto}
//   conteudo-rag/<modulo>.md              ← versão legível por módulo (para inspeção)
//
// Estratégia: cada ficheiro JSON vira N documentos (um por elemento, se a raiz
// for uma lista; senão um por ficheiro). De cada documento extrai-se TODO o
// texto (strings), com o HTML limpo. Não inclui doses/limiares numéricos isolados
// — só o texto; a teoria vive nas strings (txt, html, note, subtitulo, …).
// ============================================================================
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const CONTEUDO = join(RAIZ, "conteudo");
const SAIDA = join(RAIZ, "conteudo-rag");

// chaves cujo valor NÃO é teoria (ligações, ids técnicos, estilo)
const IGNORAR_CHAVE = new Set([
  "href", "src", "slug", "id", "classeKey", "key", "color", "accent", "bg",
  "gradiente", "icon", "style", "class", "data-sub", "links", "ids", "pos",
]);
const CHAVES_TITULO = ["titulo", "title", "nome", "nm", "name", "dci", "label", "eyebrow"];

// avisos/boilerplate repetidos que não são matéria (ruído para o RAG)
const RUIDO = [
  /material (teórico )?de referência/i,
  /material exclusivamente educativo/i,
  /material de estudo/i,
  /não constitui apoio à decisão/i,
  /não usar em decisões clínicas/i,
  /não se destina a apoiar decisões/i,
  /ferramenta de estudo e treino/i,
];
const ehRuido = (l) => l.length < 260 && RUIDO.some((r) => r.test(l));

// tamanho-alvo de cada pedaço (~1000 tokens ≈ 4000 caracteres)
const MAX_CHARS = 4000;

// parte uma lista de linhas em pedaços de ~MAX_CHARS, sem cortar linhas a meio
function chunkar(linhas, max = MAX_CHARS) {
  const chunks = [];
  let buf = [], len = 0;
  for (const l of linhas) {
    if (len + l.length > max && buf.length) { chunks.push(buf.join("\n")); buf = []; len = 0; }
    buf.push(l); len += l.length + 1;
  }
  if (buf.length) chunks.push(buf.join("\n"));
  return chunks;
}

function limparHtml(s) {
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&middot;/g, "·").replace(/&times;/g, "×")
    .replace(/&rarr;/g, "→").replace(/&ge;/g, "≥").replace(/&le;/g, "≤")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*\n\s*/g, "\n")
    .trim();
}

// recolhe recursivamente todo o texto de um valor
function recolherTexto(valor, chave, out) {
  if (valor == null) return;
  if (typeof valor === "string") {
    if (IGNORAR_CHAVE.has(chave)) return;
    if (/^https?:\/\//i.test(valor)) return;
    const t = /[<>]/.test(valor) ? limparHtml(valor) : valor.trim();
    if (t.length > 1) out.push(t);
    return;
  }
  if (Array.isArray(valor)) {
    for (const v of valor) recolherTexto(v, chave, out);
    return;
  }
  if (typeof valor === "object") {
    for (const [k, v] of Object.entries(valor)) {
      if (IGNORAR_CHAVE.has(k)) continue;
      recolherTexto(v, k, out);
    }
  }
}

function tituloDe(registo, fallback) {
  if (registo && typeof registo === "object") {
    for (const k of CHAVES_TITULO) if (typeof registo[k] === "string") return registo[k];
    for (const sub of ["header", "hero", "meta"]) {
      const h = registo[sub];
      if (h && typeof h === "object") for (const k of CHAVES_TITULO) if (typeof h[k] === "string") return h[k];
    }
  }
  return fallback;
}

function lerJson(caminho) {
  const txt = readFileSync(caminho, "utf8");
  if (caminho.endsWith(".jsonl")) {
    return txt.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
  }
  return JSON.parse(txt);
}

function* ficheirosConteudo(dir) {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) { yield* ficheirosConteudo(p); continue; }
    if (/\.(json|jsonl)$/.test(nome) && !/leia-?me/i.test(nome)) yield p;
  }
}

// ── execução ─────────────────────────────────────────────────────────────────
rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });

const docs = [];
const porModulo = {};

for (const caminho of ficheirosConteudo(CONTEUDO)) {
  const rel = relative(CONTEUDO, caminho);              // ex.: cronicas/anemia-guia.json
  const modulo = rel.split("/")[0];
  const ficheiro = rel.replace(/\\/g, "/");
  let dados;
  try { dados = lerJson(caminho); } catch (e) { console.warn("Ignorado (JSON inválido):", rel, e.message); continue; }

  const registos = Array.isArray(dados) ? dados : [dados];
  registos.forEach((reg, i) => {
    const out = [];
    recolherTexto(reg, "", out);

    // achatar em linhas; tirar ruído (avisos repetidos) e duplicados seguidos
    const linhas = [];
    let anterior = null;
    for (const bloco of out) {
      for (let l of bloco.split("\n")) {
        l = l.trim();
        if (!l || ehRuido(l) || l === anterior) continue;
        linhas.push(l);
        anterior = l;
      }
    }
    if (linhas.join(" ").length < 20) return;            // ignora registos vazios/técnicos

    const titulo = tituloDe(reg, `${modulo} · ${ficheiro}`);
    const baseId = `${modulo}/${ficheiro.replace(/\.[^.]+$/, "")}${registos.length > 1 ? "#" + (reg?.id ?? i) : ""}`;
    const pedacos = chunkar(linhas);                     // parte os grandes em ~1000 tokens
    pedacos.forEach((texto, k) => {
      const multi = pedacos.length > 1;
      const doc = {
        id: multi ? `${baseId}·p${k + 1}` : baseId,
        modulo, ficheiro,
        titulo: multi ? `${titulo} (${k + 1}/${pedacos.length})` : titulo,
        texto,
      };
      docs.push(doc);
      (porModulo[modulo] ||= []).push(doc);
    });
  });
}

// JSONL (1 doc por linha)
writeFileSync(join(SAIDA, "medguia-conteudo.jsonl"), docs.map((d) => JSON.stringify(d)).join("\n") + "\n");

// .md por módulo (inspeção humana)
for (const [modulo, lista] of Object.entries(porModulo)) {
  const md = lista.map((d) => `## ${d.titulo}\n\n_${d.ficheiro}_\n\n${d.texto}\n`).join("\n---\n\n");
  writeFileSync(join(SAIDA, `${modulo}.md`), `# ${modulo}\n\n${md}`);
}

const chars = docs.reduce((a, d) => a + d.texto.length, 0);
console.log(`✓ ${docs.length} documentos · ~${Math.round(chars / 1000)}k caracteres (~${Math.round(chars / 4000)}k tokens)`);
console.log(`  por módulo:`, Object.fromEntries(Object.entries(porModulo).map(([m, l]) => [m, l.length])));
console.log(`  → conteudo-rag/medguia-conteudo.jsonl + um .md por módulo`);
