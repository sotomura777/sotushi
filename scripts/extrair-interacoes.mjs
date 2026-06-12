// Extrator do conteúdo clínico do módulo Interações (farmacos-interacoes_1.html) → JSON em /conteudo/interacoes.
// Todo o texto clínico vem recortado do original (nunca retranscrito à mão).
// O original tem marcadores /*D0*/…/*D1*/ (DRUGS) e /*R0*/…/*R1*/ (RULES); as
// restantes constantes (TAG_LABELS, DUP, POPS, LVL, SEV) são single-line.
// Saídas: farmacos.json (base de fármacos, 6 populações cada),
//         regras.json (regras tag-par, labels, duplicações, níveis, severidades),
//         meta.json (disclaimer, bibliografia, links, rodapé, microcopy).
// As cores hex (LVLC, SEV.t/b/bd) NÃO se extraem — são identidade visual e
// vivem no CSS do módulo como classes semânticas.
import fs from "fs";
import vm from "vm";
import path from "path";

const SRC = "/Users/pedroferreira/Desktop/farmacos-interacoes_1.html";
const OUT = "/Users/pedroferreira/Desktop/medguia/conteudo/interacoes";
const html = fs.readFileSync(SRC, "utf8");
fs.mkdirSync(OUT, { recursive: true });

let erros = 0;
const verificar = (nome, real, esperado) => {
  const ok = real === esperado;
  if (!ok) erros++;
  console.log(`${ok ? "✓" : "✗ FALHA"} ${nome}: ${real}${ok ? "" : ` (esperado ${esperado})`}`);
};

// ── helpers ──────────────────────────────────────────────────────────────────
const fatia = (ini, fim) => {
  const a = html.indexOf(ini);
  if (a < 0) throw new Error("marcador não encontrado: " + ini);
  const b = html.indexOf(fim, a + ini.length);
  if (b < 0) throw new Error("marcador de fim não encontrado: " + fim);
  return html.slice(a + ini.length, b);
};
const evalLit = (js) => vm.runInNewContext("(" + js + ")", {});
// constante single-line: `const NOME={...};` → literal avaliado
const constLine = (nome) => {
  const m = html.match(new RegExp("const " + nome + "\\s*=\\s*([\\s\\S]*?);\\n"));
  if (!m) throw new Error("const não encontrada: " + nome);
  return evalLit(m[1]);
};

// ── dados JS ─────────────────────────────────────────────────────────────────
const DRUGS = evalLit("[" + fatia("/*D0*/[", "]/*D1*/") + "]");
const RULES = evalLit("[" + fatia("/*R0*/[", "]/*R1*/") + "]");
const TAG_LABELS = constLine("TAG_LABELS");
const DUP = constLine("DUP");
const POPS = constLine("POPS");
const LVL = constLine("LVL");
const SEV_FULL = constLine("SEV");
const INFOMED = html.match(/const INFOMED="([^"]+)"/)[1];

// severidades sem cores hex (label + ordem)
const SEV = {};
for (const [k, v] of Object.entries(SEV_FULL)) SEV[k] = { l: v.l, r: v.r };

// ── verificações de contagem (contra o ficheiro real) ───────────────────────
const corpoDrugs = fatia("/*D0*/[", "]/*D1*/");
verificar("fármacos extraídos", DRUGS.length, (corpoDrugs.match(/\{id:/g) || []).length);
verificar("ids únicos", new Set(DRUGS.map((d) => d.id)).size, DRUGS.length);
const corpoRules = fatia("/*R0*/[", "]/*R1*/");
verificar("regras extraídas", RULES.length, (corpoRules.match(/\{a:/g) || []).length);
verificar("populações", POPS.length, 6);
verificar("duplicações", DUP.length, (html.match(/const DUP=\[([^\n]*)\]/)[1].match(/\{tag:/g) || []).length);

// integridade: cada fármaco tem as 6 populações com nível conhecido
const semPop = DRUGS.filter((d) => POPS.some((p) => !d[p.k] || !(d[p.k].l in LVL)));
verificar("fármacos com as 6 populações e níveis válidos", DRUGS.length - semPop.length, DRUGS.length);
if (semPop.length) console.log("  → em falta/inválido:", semPop.map((d) => d.inn).join(", "));

// integridade: severidade de cada regra conhecida
verificar("regras com severidade conhecida", RULES.filter((r) => r.sev in SEV).length, RULES.length);

// relatório (não é erro): tags de regras/duplicações sem label ou sem fármacos
const tagsDrogas = new Set(DRUGS.flatMap((d) => d.tags || []));
const semLabel = [...new Set(RULES.flatMap((r) => [r.a, r.b]))].filter((t) => !(t in TAG_LABELS));
if (semLabel.length) console.log("  (aviso) tags de regras sem TAG_LABELS:", semLabel.join(", "));
const dupSemFarmaco = DUP.filter((c) => ![...tagsDrogas].includes(c.tag));
if (dupSemFarmaco.length) console.log("  (aviso) duplicações sem fármaco com a tag:", dupSemFarmaco.map((c) => c.tag).join(", "));

// relatório: HTML embutido nos textos clínicos (decide dangerouslySetInnerHTML na UI)
const comHtml = DRUGS.filter((d) => POPS.some((p) => /<\w+/.test(d[p.k]?.t || "")));
console.log(`  textos de população com HTML embutido: ${comHtml.length}${comHtml.length ? " → " + comHtml.map((d) => d.inn).join(", ") : ""}`);
const regrasComHtml = RULES.filter((r) => /<\w+/.test(r.mec + " " + r.mng));
console.log(`  regras com HTML embutido: ${regrasComHtml.length}`);

// ── textos de enquadramento (recortados do HTML) ─────────────────────────────
const disclaimer = fatia('<div class="disc"><span>&#9888;</span><span>', "</span></div>").trim();
const bibliografia = fatia('<div class="bib-content">', "</div>\n    </details>").trim();
const rodapeAviso = fatia('<span class="big">&#9877; ', "</span>").trim();
const rodapeRefs = fatia('<span class="big">&#9877; Conteúdo para estudo e revisão pessoais. Não destinado a apoio à decisão clínica.</span>\n  ', "<br>").trim();
const rodapeBase = html.match(/<span id="dcount"><\/span>([^<]+)\n<\/footer>/)[1].trim();
verificar("disclaimer começa por «Material de estudo»", disclaimer.startsWith("<b>Material de estudo pessoal.</b>"), true);
verificar("bibliografia com parágrafos", (bibliografia.match(/<p>/g) || []).length >= 10, true);

// ── escrita ──────────────────────────────────────────────────────────────────
const farmacos = [...DRUGS].sort((a, b) => a.inn.localeCompare(b.inn, "pt", { sensitivity: "base" }));
const escrever = (nome, obj) => {
  fs.writeFileSync(path.join(OUT, nome), JSON.stringify(obj, null, 1) + "\n");
  console.log("→", nome);
};

escrever("farmacos.json", { farmacos });
escrever("regras.json", {
  regras: RULES,
  tagLabels: TAG_LABELS,
  duplicacoes: DUP,
  populacoes: POPS,
  niveis: LVL,
  severidades: SEV,
});
escrever("meta.json", {
  nome: "Interações",
  titulo: "Estudo de Interações",
  subtitulo: "notas pessoais de estudo e revisão",
  disclaimer,
  infomed: INFOMED,
  links: [
    { titulo: "Infomed (INFARMED)", url: INFOMED },
    { titulo: "Drugs.com", url: "https://www.drugs.com/" },
  ],
  bibliografia,
  rodape: { aviso: rodapeAviso, referencias: rodapeRefs, base: rodapeBase },
  microcopy: {
    hintMin2: "Adicione pelo menos 2 fármacos para verificar interações entre eles.",
    semInteracoesFarmaco: "Sem interações de classe assinaladas nesta base.",
    semInteracoesCombo: "Sem interações de classe assinaladas nesta base para esta combinação. Confirme sempre num verificador validado e no Infomed.",
    recomendado: "O que está recomendado:",
    duplicacao: "Duplicação terapêutica",
    infomedLink: "Procurar RCM no INFOMED (INFARMED)",
    infomedHint: "Pesquisar por:",
    cuidadosTitulo: "Cuidados por população",
    interacoesTitulo: "Interações relevantes (por classe)",
  },
});

// microcopy verbatim: confirmar que cada frase existe mesmo no original
for (const frase of [
  "Adicione pelo menos 2 fármacos para verificar interações entre eles.",
  "Sem interações de classe assinaladas nesta base.",
  "Sem interações de classe assinaladas nesta base para esta combinação. Confirme sempre num verificador validado e no Infomed.",
  "O que está recomendado:",
  "Duplicação terapêutica",
  "Cuidados por população",
  "Interações relevantes (por classe)",
]) verificar(`microcopy verbatim «${frase.slice(0, 40)}…»`, html.includes(frase), true);

console.log(erros ? `\n✗ ${erros} verificações falharam` : "\n✓ todas as verificações passaram");
process.exit(erros ? 1 : 0);
