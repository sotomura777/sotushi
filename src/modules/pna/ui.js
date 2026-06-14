// ============================================================================
// ui.js — utilitários de apresentação partilhados pelos ecrãs do PNA
// (cor por taxa de acerto, abreviaturas dos tipos de raciocínio).
// ============================================================================

// classe de cor (escala verde→vermelho do heatmap) a partir de uma taxa 0..1.
export function classeTaxa(t) {
  if (t == null) return "hc0";
  if (t >= 0.85) return "hc1";
  if (t >= 0.70) return "hc2";
  if (t >= 0.55) return "hc3";
  if (t >= 0.40) return "hc4";
  return "hc5";
}

// abreviaturas dos tipos de raciocínio (cabeçalho do heatmap)
export const ABREV_TIPO = {
  Diagnóstico: "Diag", Tratamento: "Trat", Investigação: "Inv",
  Prognóstico: "Prog", Prevenção: "Prev", Emergência: "Emerg", Ética: "Ética",
};
