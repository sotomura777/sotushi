// ============================================================================
// LÓGICA — Calculadora de doses pediátricas. Porte EXATO de calc().
// Doses por peso, com teto máximo. Dados em /conteudo/calculadoras/doses.json
// ============================================================================

export const r1 = (v) => Math.round(v * 10) / 10;

export function calc(peso, e) {
  if (e.fixaMg) return { porToma: e.fixaMg, doseDia: e.fixaMg, nTomas: 1, intH: 24, dias: e.dias, alerta: false, fixa: true };
  let d = e.dose * peso, al = false;
  if (d > e.teto) { d = e.teto; al = true; }
  const n = Math.round(24 / e.intH);
  return { porToma: Math.round((d / n) * 10) / 10, doseDia: Math.round(d * 10) / 10, nTomas: n, intH: e.intH, dias: e.dias, alerta: al, fixa: false };
}
