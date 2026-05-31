// ============================================================================
// LÓGICA DO MÓDULO ANÁLISES — funções puras, partilhadas por todas as tabs.
// Os dados clínicos (parâmetros, intervalos, interpretações, padrões) vêm de
// /conteudo/analises/ e são passados como argumento. Aqui só há lógica:
// nenhuma tabela clínica embutida. As funções de teste de padrões (PADROES_TEST)
// são regras booleanas sobre o estado dos parâmetros — o texto clínico de cada
// padrão vive em conteudo/analises/padroes.json.
// ============================================================================

// Intervalo de referência: referência personalizada (uRefs) tem prioridade.
export function getIntervalo(p, sexo, uRefs) {
  if (uRefs && uRefs[p.id]) return uRefs[p.id];
  const r = p.ref[sexo] || p.ref.M;
  return { min: r[0], max: r[1] };
}

// Estado do valor: 'low' | 'normal' | 'high' | null. `force` ('low'/'high')
// força o estado independentemente do valor (botões ↓/↑).
export function getEstado(p, valor, sexo, uRefs, force) {
  if (force === "low" || force === "high") return force;
  if (valor === "" || valor == null || Number.isNaN(Number(valor))) return null;
  const v = Number(valor);
  const r = getIntervalo(p, sexo, uRefs);
  if (v < r.min) return "low";
  if (v > r.max) return "high";
  return "normal";
}

// Texto de interpretação conforme o estado (vem do conteúdo).
export function interpretacao(p, estado) {
  if (estado === "low") return p.lo || null;
  if (estado === "high") return p.hi || null;
  return null;
}

// ── Padrões cruzados ────────────────────────────────────────────────────────

// Mapa de estado a partir dos slots guardados: { id: 'high'|'low'|'normal'|null }
export function construirMapaStatus(slots) {
  const m = {};
  Object.keys(slots || {}).forEach((id) => { m[id] = (slots[id] && slots[id].status) || null; });
  return m;
}

// Valores alterados (com texto lo/hi) entre os parâmetros selecionados.
export function detetarAlterados(ids, slots, params) {
  const out = [];
  ids.forEach((id) => {
    const p = params.find((x) => x.id === id);
    const v = slots[id];
    if (!p || !v || !v.status || v.status === "normal") return;
    const seta = v.status === "high" ? "↑" : "↓";
    const txt = v.status === "high" ? p.hi : p.lo;
    if (txt && txt !== "Informação em breve.") out.push({ id, etiqueta: p.ab + seta, txt });
  });
  return out;
}

// Padrões reconhecidos: percorre os padrões e corre o respetivo teste.
// `padroes` vem de conteudo/analises/padroes.json (cada um com id/nm/ids/txt).
export function detetarPadroes(idsSelecionados, mapaStatus, padroes) {
  const found = [];
  padroes.forEach((pad) => {
    const rel = pad.ids.filter((id) => idsSelecionados.includes(id) && mapaStatus[id]);
    if (rel.length < 1) return;
    const fn = PADROES_TEST[pad.id];
    try { if (fn && fn(mapaStatus)) found.push(pad); } catch { /* ignora */ }
  });
  return found;
}

// URL de pesquisa contextualizada (Google) com todos os valores preenchidos.
export function construirQueryPesquisa(padraoNm, idsSelecionados, slots, params, sexo, uRefs) {
  const parts = [];
  idsSelecionados.forEach((id) => {
    const p = params.find((x) => x.id === id);
    const v = slots[id];
    if (!p || !v || v.val == null || v.val === "") return;
    const ref = getIntervalo(p, sexo, uRefs);
    const status = v.status === "high" ? "elevado" : v.status === "low" ? "baixo" : "normal";
    parts.push(`${p.nm} ${v.val}${p.un ? " " + p.un : ""} (ref ${ref.min}-${ref.max}, ${status})`);
  });
  const q = `Doente com: ${parts.join(", ")}. Padrão identificado: ${padraoNm}. Quais as causas mais prováveis, que exames pedir a seguir e que diagnósticos considerar?`;
  return "https://www.google.com/search?q=" + encodeURIComponent(q);
}

// Texto de transcrição limpo (copiável): "Análises (DD/MM): Hb 11.2 g/dL, …"
export function gerarResumoTexto(ids, valores, params, dataDDMM) {
  const parts = [];
  ids.forEach((id) => {
    const p = params.find((x) => x.id === id);
    const v = valores[id];
    if (!p || !v || v.val == null || v.val === "") return;
    parts.push(`${p.ab} ${v.val}${p.un ? " " + p.un : ""}`);
  });
  return `Análises (${dataDDMM}): ${parts.join(", ")}`;
}

// Fórmulas calculadas automaticamente quando há valores relevantes.
// `valores` = { id: {val} }. ctx = { idade, peso, sexo, hco3 }.
export function calcularFormulas(valores, params, ctx = {}) {
  const num = (id) => { const d = valores[id]; if (!d || d.val == null || d.val === "") return null; const n = Number(d.val); return Number.isNaN(n) ? null : n; };
  const { idade, peso, sexo, hco3 } = ctx;
  const na = num("na"), gli = num("glic"), cl = num("cl"), ur = num("ureia");
  const ca = num("catot"), alb = num("alb"), ast = num("ast"), alt = num("alt");
  const cr = num("creat"), naur = num("naurin"), crur = num("creatuir");
  const out = [];
  if (na != null && gli != null && gli > 100) { const f = gli > 400 ? 2.4 : 1.6; out.push(`Na corr: ${(na + f * (gli - 100) / 100).toFixed(1)} mmol/L`); }
  if (na != null && cl != null && hco3 != null) { const ag = na - (cl + hco3); out.push(`AG: ${ag.toFixed(1)}${ag > 12 ? " (elevado)" : " (normal)"}`); }
  if (ca != null && alb != null && alb < 4) out.push(`Ca corr: ${(ca + 0.8 * (4 - alb)).toFixed(1)} mg/dL`);
  if (ast != null && alt != null && alt > 0) { const r = ast / alt; out.push(`AST/ALT: ${r.toFixed(2)}${r > 2 ? " (sugestivo alcoólica)" : r < 1 ? " (não alcoólica)" : ""}`); }
  if (cr != null && cr > 0 && idade != null && peso != null) { let clcr = (140 - idade) * peso / (72 * cr); if (sexo === "F") clcr *= 0.85; out.push(`ClCr: ${clcr.toFixed(0)} mL/min`); }
  if (na != null && gli != null && ur != null) out.push(`Osm calc: ${(2 * na + gli / 18 + ur / 5.6).toFixed(0)} mOsm/kg`);
  if (naur != null && cr != null && na != null && crur != null && crur > 0 && na > 0) { const fena = naur * cr / (na * crur) * 100; out.push(`FENa: ${fena.toFixed(2)}%${fena < 1 ? " (pré-renal)" : fena > 2 ? " (renal)" : ""}`); }
  return out;
}

// ── Apresentação ────────────────────────────────────────────────────────────

export const ESTADO_INFO = {
  low: { etiqueta: "Baixo", fundo: "#f0f9ff", borda: "#bae6fd", texto: "#0c4a6e" },
  high: { etiqueta: "Alto", fundo: "#fef2f2", borda: "#fecaca", texto: "#991b1b" },
  normal: { etiqueta: "Normal", fundo: "#f0fdf4", borda: "#bbf7d0", texto: "#166534" },
};

export const CORES_CAT = {
  hemo: "#dc2626", bioq: "#0891b2", renal: "#0d9488", hepa: "#ca8a04",
  tiro: "#7c3aed", elec: "#2563eb", infl: "#ea580c", coag: "#be185d",
  vita: "#059669", lipi: "#9333ea", urin: "#b45309",
};
export function getCorCat(id) {
  return CORES_CAT[id] || "#64748b";
}

// ── Testes dos 43 padrões cruzados (regras booleanas sobre o mapa de estado) ──
// Extraídos fielmente do original (via scripts/extrair-analises-v4.mjs).
export const PADROES_TEST = {
  pat0: s=>(s.hb==='low'&&s.leuc==='low'&&s.plaq==='low'),
  pat1: s=>(s.leuc==='low'&&s.plaq==='low'),
  pat2: s=>(s.hb==='low'&&s.plaq==='low'),
  pat3: s=>(s.hb==='low'&&s.leuc==='low'),
  pat4: s=>(s.neut==='low'&&s.plaq==='low'),
  pat5: s=>(s.hb==='low'&&s.vgm==='low'),
  pat6: s=>(s.hb==='low'&&s.vgm==='high'),
  pat7: s=>(s.hb==='low'&&s.vgm==='normal'),
  pat8: s=>(s.hb==='low'&&(s.ferr==='low'||s.fe==='low')),
  pat9: s=>(s.hb==='low'&&(s.ferr==='high'||s.ferr==='normal')&&s.transf==='low'),
  pat10: s=>(s.hb==='low'&&s.vgm==='high'&&(s.b12==='low'||s.folato==='low')),
  pat11: s=>(s.hb==='low'&&(s.ldh==='high'||s.bilind==='high')),
  pat12: s=>(s.ast==='high'&&s.alt==='high'),
  pat13: s=>(s.fa==='high'&&s.ggt==='high'),
  pat14: s=>(s.ast==='high'||s.alt==='high')&&(s.fa==='high'&&s.ggt==='high'),
  pat15: s=>(s.inr==='high'&&s.alb==='low'),
  pat16: s=>(s.creat==='high'&&s.ureia==='high'),
  pat17: s=>(s.creat==='high'&&s.k==='high'),
  pat18: s=>(s.alb==='low'&&s.proturin==='high'),
  pat19: s=>(s.ureia==='high'&&(s.na==='high'||s.htc==='high')),
  pat20: s=>(s.aurico==='high'&&s.creat==='high'),
  pat21: s=>(s.hb==='low'&&s.plaq==='low'&&s.creat==='high'),
  pat22: s=>(s.pcr==='high'&&s.pct==='high'),
  pat23: s=>(s.pcr==='high'&&s.leuc==='high'),
  pat24: s=>(s.linf==='high'&&(s.ast==='high'||s.alt==='high')),
  pat25: s=>(s.eosi==='high'&&s.pcr==='high'),
  pat26: s=>(s.inr==='high'&&(s.plaq==='low'||s.fibr==='low')),
  pat27: s=>(s.ddim==='high'&&s.plaq==='low'),
  pat28: s=>(s.ck==='high'),
  pat29: s=>(s.lipase==='high'),
  pat30: s=>(s.trop==='high'),
  pat31: s=>(s.bnp==='high'||s.ntprobnp==='high'),
  pat32: s=>(s.tsh==='high'&&s.t4l==='low'),
  pat33: s=>(s.tsh==='high'&&s.t4l==='normal'),
  pat34: s=>(s.tsh==='low'&&s.t4l==='high'),
  pat35: s=>(s.tsh==='low'&&s.t4l==='normal'),
  pat36: s=>(s.glic==='high'||s.hba1c==='high'),
  pat37: s=>(s.glic==='low'),
  pat38: s=>(s.catot==='low'&&s.alb==='low'),
  pat39: s=>(s.catot==='high'||s.caion==='high'),
  pat40: s=>(s.mg==='low'&&s.catot==='low'),
  pat41: s=>(s.p==='low'),
  pat42: s=>(s.p==='high'&&s.creat==='high'),
};
