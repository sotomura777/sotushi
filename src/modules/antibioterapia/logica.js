// ============================================================================
// LÓGICA DO MÓDULO ANTIBIOTERAPIA AMBULATÓRIO
// Funções puras. O conteúdo clínico vem de /conteudo/antibioterapia/.
// ============================================================================

// Cor de cada especialidade (apresentação), mapeada pelo nome de cor do conteúdo.
export const CORES = {
  blue: "#5b9cf6",
  green: "#4ecb87",
  teal: "#2dd4bf",
  purple: "#a78bfa",
  orange: "#fb923c",
  pink: "#f472b6",
  amber: "#f0a842",
  red: "#f87171",
  slate: "#64748b",
};

export function corEspecialidade(esp) {
  return (esp && CORES[esp.color]) || "#64748b";
}

// Estilo do aviso "viral_note" conforme o prefixo do texto.
export function estiloViralNote(texto) {
  if (!texto) return "info";
  if (texto.startsWith("🟢")) return "viral";
  if (texto.startsWith("⚠️")) return "warning";
  return "info";
}

// Etiquetas automáticas a partir do texto de uma observação (mesma lógica do original).
export function etiquetasObs(texto) {
  const t = [];
  if (/gravidez|grávida|grávidas|contraindicad/i.test(texto)) t.push({ rotulo: "Gravidez", tipo: "gravidez" });
  if (/SINAVE|notificaç/i.test(texto)) t.push({ rotulo: "SINAVE", tipo: "sinave" });
  if (/referenciaç|referenciar|hospital|urgência|internamento/i.test(texto)) t.push({ rotulo: "Referenciação", tipo: "ref" });
  if (/novidade|Ed\. 1\.3|introduzido|retirad/i.test(texto)) t.push({ rotulo: "Ed. 1.3", tipo: "novo" });
  if (/atenção|cuidado|apenas|NÃO|não deve/i.test(texto)) t.push({ rotulo: "Atenção", tipo: "alerta" });
  return t;
}

// Extrai as dicas clínicas de uma patologia (defensivo quanto à forma).
export function getDicas(patologia) {
  const tips = (patologia && patologia.tips) || {};
  return { semMelhoria: tips.no_improvement || [], mimics: tips.mimics || [] };
}
