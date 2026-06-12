// Gera src/modules/cronicas/anemia/estilo.css a partir do CSS dos HTML originais,
// prefixando mecanicamente os seletores (mesma técnica do porte da Asma).
// A ponte de tokens (.anemia) liga as variáveis dos originais aos tokens da app —
// não redefine paleta nem tipografia globais.
import fs from "fs";
import path from "path";

const DIR = "/Users/pedroferreira/Downloads/Anemia ";
const OUT = "/Users/pedroferreira/Desktop/medguia/src/modules/cronicas/anemia/estilo.css";

const FONTES = [
  { file: "anemia_home-3.html", prefix: ".an-home", titulo: "HOME (menu + hubs)" },
  { file: "anemia_guia_v2-2.html", prefix: ".an-guia", titulo: "GUIA TEÓRICO" },
  { file: "anemia_algoritmo_visual-22.html", prefix: ".an-algo", titulo: "ALGORITMO VISUAL" },
  { file: "anemia_estuda_padrao-3.html", prefix: ".an-pad", titulo: "ESTUDA POR PADRÃO" },
  { file: "4- perguntas\\/anemia_casos_padroes-2.html", prefix: ".an-cpq", titulo: "CASOS POR PADRÕES (quiz)" },
];

// seletores globais dos originais que não se portam (reset, layout de página, rotas)
const DROP = /^(:root|html|body|\.wrap|\.atmo|\.route)\b|^\*/;

const keyframesVistos = new Set();

function separarTopo(css) {
  const stmts = [];
  let depth = 0, ini = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === "{") depth++;
    else if (c === "}") {
      if (depth === 0) { ini = i + 1; continue; } // chaveta órfã no original (v22 tem uma) — ignorar
      depth--;
      if (depth === 0) { stmts.push(css.slice(ini, i + 1)); ini = i + 1; }
    }
  }
  return stmts.map((s) => s.trim()).filter(Boolean);
}

function prefixarSeletor(sel, prefix) {
  const s = sel.trim();
  if (DROP.test(s)) return null;
  return prefix + " " + s;
}

function processar(css, prefix) {
  const out = [];
  for (const stmt of separarTopo(css)) {
    if (stmt.startsWith("@keyframes")) {
      const nome = stmt.match(/@keyframes\s+([\w-]+)/)[1];
      if (keyframesVistos.has(nome)) continue;
      keyframesVistos.add(nome);
      out.push(stmt);
      continue;
    }
    if (stmt.startsWith("@media") || stmt.startsWith("@supports")) {
      const abre = stmt.indexOf("{");
      const cond = stmt.slice(0, abre).trim();
      const interior = processar(stmt.slice(abre + 1, stmt.lastIndexOf("}")), prefix);
      if (interior.trim()) out.push(cond + " {\n" + interior + "\n}");
      continue;
    }
    if (stmt.startsWith("@")) { out.push(stmt); continue; }
    const abre = stmt.indexOf("{");
    if (abre < 0) continue;
    const sels = stmt.slice(0, abre).split(",").map((s) => prefixarSeletor(s, prefix)).filter(Boolean);
    if (!sels.length) continue;
    out.push(sels.join(", ") + " " + stmt.slice(abre));
  }
  return out.join("\n");
}

const PONTE = `/* ============================================================================
   Anemia (módulo Patologias) — estilos do submódulo.
   CSS portado mecanicamente dos originais (anemia_home-3 / anemia_casos_padroes-2)
   com seletores prefixados; as variáveis do original são ligadas aos tokens da
   app na ponte .anemia. Não redefine paleta nem tipografia globais.
   GERADO por scripts/gerar-css-anemia.mjs — editar os ajustes manuais só na
   secção final (AJUSTES), que o gerador preserva.
   ============================================================================ */

/* ── Ponte de tokens: original → app (acento vinho do submódulo) ── */
.anemia {
  --acento: #b8425a;
  --bg: transparent;
  --surface: var(--superficie);
  --s2: var(--superficie-2);
  --s3: var(--superficie-2);
  --border: var(--borda);
  --border2: var(--borda-2);
  --text: var(--texto);
  --muted: var(--suave);
  --faint: var(--tenue);
  --radius: var(--raio-lg);
  --radius-sm: var(--raio-sm);
  --radius-xs: 6px;
  --c-primary: var(--acento);
  --c-primary-soft: color-mix(in srgb, var(--acento) 8%, transparent);
  --c-primary-mid: color-mix(in srgb, var(--acento) 18%, transparent);
  --c-primary-strong: #a13651;
  --c-primary-deep: #7c2d3d;
  --c-warning: #f59e0b;
  --c-success: #059669;
  --c-tips: #7c2d3d;
  /* paleta do home */
  --c1: #7c2d3d;
  --c2: var(--acento);
  --c3: #a13651;
  --c4: #d97184;
  --c-soft: color-mix(in srgb, var(--acento) 7%, transparent);
  --c-mid: color-mix(in srgb, var(--acento) 18%, transparent);
}
.dark .anemia {
  --acento: #d97184;
  --c-primary-strong: #e8a3b1;
  --c-primary-deep: #f4cdd5;
  --c3: #d97184;
  --c1: #e8a3b1;
}
`;

const MARCA_AJUSTES = "/* ════ AJUSTES (manuais — preservados pelo gerador) ════ */";
let ajustes = "\n" + MARCA_AJUSTES + "\n";
if (fs.existsSync(OUT)) {
  const atual = fs.readFileSync(OUT, "utf8");
  const i = atual.indexOf(MARCA_AJUSTES);
  if (i >= 0) ajustes = "\n" + atual.slice(i);
}

let corpo = "";
for (const f of FONTES) {
  const src = fs.readFileSync(path.join(DIR, f.file), "utf8");
  let css = src.slice(src.indexOf("<style>") + 7, src.indexOf("</style>"));
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  corpo += `\n/* ════ ${f.titulo} — portado de ${path.basename(f.file)} ════ */\n` + processar(css, f.prefix) + "\n";
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, PONTE + corpo + ajustes);
console.log("✓ estilo.css", Math.round((PONTE + corpo + ajustes).length / 1024) + "kB · keyframes:", [...keyframesVistos].join(", "));
