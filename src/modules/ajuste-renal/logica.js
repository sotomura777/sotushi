// ============================================================================
// LÓGICA DO MÓDULO AJUSTE RENAL
// Funções puras, sem dados clínicos embutidos. Os dados vêm de
// /conteudo/ajuste-renal/. Comportamento idêntico ao módulo original.
// ============================================================================

// Dado um fármaco e uma TFG, devolve a nota de ajuste correspondente.
export function getAjuste(farmaco, tfg) {
  for (const regra of farmaco.adjust) {
    if (tfg >= regra.min && tfg <= regra.max) return regra.note;
  }
  return "Sem dados disponíveis";
}

// Infere a gravidade a partir do TEXTO da nota.
// CONVENÇÃO (importante para quem edita o conteúdo):
//   ⛔  ou "Contraindicado" / "Suspender"                  -> danger  (vermelho)
//   ⚠️  ou "Não recomendado" / "Evitar" / "Não deve"        -> warning (laranja)
//       "Sem ajuste" / "Sem necessidade"                    -> safe    (verde)
//   qualquer outra coisa                                    -> caution (azul)
export function getGravidade(nota) {
  if (nota.includes("⛔") || nota.includes("Contraindicado") || nota.includes("Suspender")) return "danger";
  if (nota.includes("⚠️") || nota.includes("Não recomendado") || nota.includes("Evitar") || nota.includes("Não deve")) return "warning";
  if (nota.includes("Sem ajuste") || nota.includes("Sem necessidade")) return "safe";
  return "caution";
}

// Devolve o estádio DRC para uma dada TFG, a partir da tabela do meta.json.
// A tabela está ordenada por `min` decrescente; devolve o primeiro estádio
// cujo limiar a TFG atinge.
export function getEstadio(tfg, estadios) {
  if (tfg === null || Number.isNaN(tfg)) return null;
  for (const e of estadios) {
    if (tfg >= e.min) return e;
  }
  return null;
}

// Cores por categoria (apresentação específica deste módulo).
// Categorias não listadas recebem uma cor neutra.
export const CAT_CORES = {
  "Anti-Hipertensores": "#2563eb",
  "Anti-Dislipidémicos": "#7c3aed",
  "Anti-Diabéticos": "#0891b2",
  "Psicofármacos": "#be185d",
  "Analgésicos": "#dc2626",
  "Anticoagulantes": "#ea580c",
  "Antibióticos": "#059669",
  "Outros": "#4b5563",
};

export function getCatCor(cat) {
  return CAT_CORES[cat] || "#4b5563";
}
