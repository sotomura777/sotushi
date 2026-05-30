// ============================================================================
// TOKENS DE DESIGN — fonte única de verdade para estilos calculados em JS.
//
// A base neutra (fundos, texto, bordas), tipografia e raios estão em
// src/styles.css como variáveis CSS (var(--fundo), etc.), porque são usadas
// por classes. Aqui ficam apenas os valores que o JavaScript precisa de
// manipular dinamicamente — sobretudo as cores semânticas de gravidade, às
// quais a app aplica transparência (ex.: `${cor}10`) em tempo de execução.
//
// Mudar uma cor de gravidade aqui muda-a em todos os módulos.
// ============================================================================

export const GRAVIDADE = {
  danger: { fundo: "#fef2f2", borda: "#fecaca", texto: "#991b1b", etiqueta: "CI" },
  warning: { fundo: "#fffbeb", borda: "#fde68a", texto: "#92400e", etiqueta: "Cuidado" },
  caution: { fundo: "#f0f9ff", borda: "#bae6fd", texto: "#0c4a6e", etiqueta: "Ajustar" },
  safe: { fundo: "#f0fdf4", borda: "#bbf7d0", texto: "#166534", etiqueta: "OK" },
};

// Cor neutra usada por componentes em JS quando precisam de um valor literal
// (em vez de uma variável CSS). Mantida em sincronia com src/styles.css.
export const NEUTRO = {
  borda: "#e2e8f0",
  suave: "#64748b",
  tenue: "#94a3b8",
};
