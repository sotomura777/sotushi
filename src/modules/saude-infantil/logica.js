// ============================================================================
// LÓGICA — Vigilância Infantil (núcleo + M-CHAT)
// Funções puras. Dados em /conteudo/saude-infantil/. Fiel ao original.
// ============================================================================

// Fases etárias (do FC original)
export const FASES = {
  bebe: { label: "Bebé · 0–24 meses", cor: "#92400e", bg: "rgba(251,191,36,.15)" },
  crian: { label: "Criança · 2–9 anos", cor: "#065f46", bg: "rgba(52,211,153,.15)" },
  jov: { label: "Jovem · 10–18 anos", cor: "#5b21b6", bg: "rgba(167,139,250,.15)" },
};

// Tints dos ícones dos itens (chaves de cor do original)
export const CORES_ITEM = {
  sky: "#e0f2fe", lav: "#ede9fe", mint: "#d1fae5",
  peach: "#ffedd5", sun: "#fef9c3", rose: "#ffe4e6",
};

// Cor/etiqueta de uma linha de alerta (red/orange/green)
export const ALERTA_INFO = {
  red: { fundo: "#fef2f2", borda: "#fecaca", texto: "#991b1b" },
  orange: { fundo: "#fffbeb", borda: "#fde68a", texto: "#92400e" },
  green: { fundo: "#f0fdf4", borda: "#bbf7d0", texto: "#166534" },
};

// Classe/cor da etiqueta de urgência no detalhe de um alerta
export function corUrgencia(urgencia) {
  if (!urgencia) return ALERTA_INFO.green;
  if (urgencia.indexOf("Urgência") >= 0 || urgencia.indexOf("URGENTE") >= 0) return ALERTA_INFO.red;
  if (urgencia.indexOf("Prioritário") >= 0) return ALERTA_INFO.orange;
  if (urgencia.indexOf("Programado") >= 0) return { fundo: "#f5f3ff", borda: "#ddd6fe", texto: "#5b21b6" };
  return ALERTA_INFO.green;
}

// ---- M-CHAT-R/F: interpretação do score total ----
// O questionário oficial (perguntas + folha de pontuação) é aplicado fora da app,
// no recurso oficial dos autores. Aqui só se interpreta o score total (0-20),
// com os limiares de risco validados. Devolve null se o score for inválido.
export function interpretarScoreMCHAT(scoreBruto) {
  const score = Math.round(Number(scoreBruto));
  if (Number.isNaN(score) || score < 0 || score > 20) return null;

  if (score <= 2)
    return {
      score, cor: "#059669", etiqueta: "Risco baixo",
      interpretacao: `Score ${score}/20 — abaixo do limiar de risco. Desenvolvimento social adequado para rastreio de PEA.`,
      conduta: "Continuar vigilância nas consultas habituais. Repetir M-CHAT aos 24 meses se surgir preocupação clínica.",
    };
  if (score <= 7)
    return {
      score, cor: "#d97706", etiqueta: "Risco intermédio — aplicar Follow-Up",
      interpretacao: `Score ${score}/20 — risco intermédio. Confirmar com entrevista de Follow-Up antes de referenciar.`,
      conduta: "Aplicar entrevista de Follow-Up (M-CHAT-R/F). Se Follow-Up positivo (3 ou mais itens confirmados): referenciação programada a Desenvolvimento Pediátrico (4-8 semanas).",
      aPedir: "Rastreio auditivo, avaliação de linguagem.",
    };
  return {
    score, cor: "#dc2626", etiqueta: "Risco elevado — referenciação programada",
    interpretacao: `Score ${score}/20 — risco elevado. Score acima do limiar de alto risco (maior que 7).`,
    conduta: "Referenciação programada a Desenvolvimento Pediátrico (4-8 semanas). Não esperar pelo Follow-Up — score alto tem baixa taxa de falsos positivos.",
    aPedir: "Rastreio auditivo, avaliação de linguagem, observação de Desenvolvimento.",
  };
}
