// Extrator do conteúdo clínico do módulo Ajuste Renal (nova versão autocontida)
// → JSON em /conteudo/ajuste-renal. Todo o texto clínico vem recortado do
// RenalDoseAdjustment.jsx (nunca retranscrito à mão).
// Esta versão substitui a anterior (131 fármacos, formato min/max) por uma mais
// completa: 178 fármacos × 6 escalões de TFG, com 4 estados (ok/adjust/caution/ci).
// Saídas: farmacos.json (os fármacos) e meta.json (escalões, estados, textos).
import fs from "fs";
import vm from "vm";
import path from "path";

const SRC = "/Users/pedroferreira/Desktop/RenalDoseAdjustment.jsx";
const OUT = "/Users/pedroferreira/Desktop/medguia/conteudo/ajuste-renal";

const src = fs.readFileSync(SRC, "utf8");

// extrai o literal de array/objeto que começa logo a seguir ao marcador
function literalAfter(re) {
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
// Array(6).fill(...) é JS válido → avaliar com Array disponível no sandbox
const evalLit = (lit) => vm.runInNewContext("(" + lit + ")", { Array });
function grab(re, label) {
  const m = re.exec(src);
  if (!m) throw new Error("grab falhou: " + (label || re));
  return m[1].trim();
}

// ── FÁRMACOS ──
const DRUGS = evalLit(literalAfter(/const DRUGS = \[/));
if (DRUGS.length !== 178) throw new Error("esperava 178 fármacos, vieram " + DRUGS.length);
const ESTADOS_VALIDOS = new Set(["ok", "adjust", "caution", "ci"]);
DRUGS.forEach((d, i) => {
  for (const campo of ["class", "group", "name", "dose", "L"])
    if (d[campo] === undefined) throw new Error(`fármaco ${i} (${d.name || "?"}) sem campo ${campo}`);
  if (!Array.isArray(d.L) || d.L.length !== 6) throw new Error(`fármaco ${d.name} sem 6 escalões`);
  d.L.forEach((nivel, k) => {
    if (!ESTADOS_VALIDOS.has(nivel.s)) throw new Error(`fármaco ${d.name}[${k}] com estado inválido: ${nivel.s}`);
    if (typeof nivel.t !== "string" || !nivel.t.trim()) throw new Error(`fármaco ${d.name}[${k}] sem texto`);
  });
});
const grupos = [...new Set(DRUGS.map((d) => d.group))];
const classes = [...new Set(DRUGS.map((d) => d.class))];

// ── ESCALÕES de TFG ──
const TFG_RANGES = evalLit(literalAfter(/const TFG_RANGES = \[/));
if (TFG_RANGES.length !== 6) throw new Error("esperava 6 escalões, vieram " + TFG_RANGES.length);

// ── ESTADOS (só os textos; cores/ícones são apresentação, ficam no /src) ──
const estados = ["ok", "adjust", "caution", "ci"].map((k) => ({
  key: k,
  label: grab(new RegExp(`${k}:\\s*\\{\\s*label:\\s*"([^"]+)"`), "estado-" + k),
  short: grab(new RegExp(`${k}:\\s*\\{\\s*label:\\s*"[^"]+",\\s*short:\\s*"([^"]+)"`), "estado-short-" + k),
}));

// ── TEXTOS do cabeçalho e rodapé ──
const titulo = grab(/<h1[^>]*>\s*([^<]+?)\s*<\/h1>/, "titulo");
const subtitulo = grab(/<p style=\{\{ fontSize: 13[^}]*\}\}>\s*([^<]+?)\s*<\/p>/, "subtitulo");
const disclaimer = grab(/<strong>Ferramenta de estudo\.<\/strong>([\s\S]*?)<\/div>/, "disclaimer")
  .replace(/<\/?strong>/g, "").replace(/\s+/g, " ").trim();
const bibliografia = grab(/<strong>Bibliografia consultada:<\/strong>\s*([\s\S]*?)<\/div>/, "bibliografia")
  .replace(/\s+/g, " ").trim();

const meta = {
  nome: "Ajuste Renal",
  titulo,
  subtitulo,
  eyebrow: "Ferramenta de estudo",
  escaloes: TFG_RANGES,
  estados,
  disclaimer: "Ferramenta de estudo." + (disclaimer.startsWith(" ") ? disclaimer : " " + disclaimer),
  bibliografia,
};

// ── escrever ──
fs.writeFileSync(path.join(OUT, "farmacos.json"), JSON.stringify(DRUGS, null, 1) + "\n");
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 2) + "\n");

console.log("✓ farmacos.json", DRUGS.length, "fármacos ·", Math.round(JSON.stringify(DRUGS).length / 1024) + "kB");
console.log("✓ meta.json · escalões", TFG_RANGES.length, "· estados", estados.map((e) => e.key).join("/"));
console.log("  grupos:", grupos.length, "·", grupos.join(", "));
console.log("  classes:", classes.length);
console.log("  título:", titulo);
console.log("  estados:", estados.map((e) => `${e.key}=${e.label}`).join(" · "));
