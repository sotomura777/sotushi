// Extrator dos dados clínicos do Análises v4 (HTML single-file) → JSON em /conteudo.
// Separa CONTEÚDO (texto clínico → /conteudo) de LÓGICA (funções test → fica p/ logica.js).
// Não altera parametros.json: extrai o P do v4 para um ficheiro à parte só para comparar.
import fs from "fs";
import vm from "vm";
import path from "path";

const HTML_PATH = "/Users/pedroferreira/Desktop/analises/analises-v4.html";
const CONTEUDO = "/Users/pedroferreira/Desktop/medguia/conteudo/analises";
const SCRIPTS = "/Users/pedroferreira/Desktop/medguia/scripts";
const html = fs.readFileSync(HTML_PATH, "utf8");

// Faz bracket-matching a partir do bracket de abertura (último char do match `re`).
function literalAfter(src, re) {
  const m = re.exec(src);
  if (!m) throw new Error("não encontrado: " + re);
  let i = m.index + m[0].length - 1; // aponta ao '[' ou '{'
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

const CATS = evalLit(literalAfter(html, /const\s+CATS\s*=\s*\[/));
const P = evalLit(literalAfter(html, /const\s+P\s*=\s*\[/));
const PATS = evalLit(literalAfter(html, /const\s+PATS\s*=\s*\[/));
const PARAM_INFO = evalLit(literalAfter(html, /const\s+PARAM_INFO\s*=\s*\{/));
const DEF_MODELS = evalLit(literalAfter(html, /var\s+DEF_MODELS\s*=\s*\[/));
const CARDS = evalLit(literalAfter(html, /cards\s*=\s*\[/)); // exemplos dentro de initCards()

// Bibliografia (está em HTML) — delimitar à secção vw-biblio
const bibStart = html.indexOf('id="vw-biblio"');
const bibSection = html.slice(bibStart, bibStart + 2500);
const bibMatch = bibSection.match(/color:var\(--tx2\)">([^<]*)</);
const discMatch = bibSection.match(/class="disc"[^>]*>([\s\S]*?)<\/div>/);
const biblio = {
  fontes: (bibMatch ? bibMatch[1] : "").split(";").map((s) => s.trim()).filter(Boolean),
  nota: discMatch ? discMatch[1].replace(/\s+/g, " ").trim() : "",
};

// PATS: texto clínico → JSON ; funções test → ficheiro à parte (porto para logica.js)
const padroes = PATS.map((p, i) => ({ id: "pat" + i, nm: p.nm, ids: p.ids, txt: p.txt }));
const testes = PATS.map((p, i) => `  pat${i}: ${p.test.toString()},   // ${p.nm}`).join("\n");

// Escrever conteúdo clínico
const w = (dir, file, obj) => fs.writeFileSync(path.join(dir, file), JSON.stringify(obj, null, 1) + "\n");
w(CONTEUDO, "param_info.json", PARAM_INFO);
w(CONTEUDO, "padroes.json", padroes);
w(CONTEUDO, "modelos.json", DEF_MODELS);
w(CONTEUDO, "flashcards.json", CARDS);
w(CONTEUDO, "biblio.json", biblio);
// Para comparação / porte (NÃO em /conteudo)
w(SCRIPTS, "_p_v4.json", P);
fs.writeFileSync(path.join(SCRIPTS, "_padroes_test.txt"), "// Porta para src/modules/analises/logica.js — PADROES_TEST\nexport const PADROES_TEST = {\n" + testes + "\n};\n");

// ── Relatório ──
const meta = JSON.parse(fs.readFileSync(path.join(CONTEUDO, "meta.json"), "utf8"));
const paramsAtuais = JSON.parse(fs.readFileSync(path.join(CONTEUDO, "parametros.json"), "utf8"));
const arrAtuais = Array.isArray(paramsAtuais) ? paramsAtuais : (paramsAtuais.parametros || Object.values(paramsAtuais)[0]);
const idsAtuais = new Set(arrAtuais.map((x) => x.id));
const idsV4 = new Set(P.map((x) => x.id));
const soV4 = [...idsV4].filter((x) => !idsAtuais.has(x));
const soAtuais = [...idsAtuais].filter((x) => !idsV4.has(x));

console.log("════════ EXTRAÇÃO ANÁLISES v4 ════════");
console.log(`CATS (categorias): v4=${CATS.length}  meta.json=${meta.categorias.length}`);
console.log(`P (parâmetros):    v4=${P.length}  parametros.json=${arrAtuais.length}`);
console.log(`  só no v4: ${soV4.length ? soV4.join(", ") : "—"}`);
console.log(`  só no nosso: ${soAtuais.length ? soAtuais.join(", ") : "—"}`);
console.log(`PARAM_INFO (explicações): ${Object.keys(PARAM_INFO).length}`);
console.log(`PATS (padrões cruzados):  ${padroes.length}`);
console.log(`DEF_MODELS (modelos):     ${DEF_MODELS.length}  → ${DEF_MODELS.map((m) => m.nm + "(" + m.ps.length + ")").join(", ")}`);
console.log(`Flashcards (exemplos):    ${CARDS.length}`);
console.log(`Bibliografia (fontes):    ${biblio.fontes.length}`);
console.log("\nEscrito em /conteudo/analises: param_info.json, padroes.json, modelos.json, flashcards.json, biblio.json");
console.log("Escrito em /scripts (tooling): _p_v4.json (p/ comparar), _padroes_test.txt (p/ porte de lógica)");
