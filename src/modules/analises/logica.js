// ============================================================================
// LÓGICA DO MÓDULO ANÁLISES
// Funções puras. Os dados (parâmetros, intervalos, interpretações) vêm de
// /conteudo/analises/. Comportamento fiel ao módulo original.
// ============================================================================

// Intervalo de referência de um parâmetro para o sexo escolhido.
export function getIntervalo(p, sexo) {
  const r = p.ref[sexo] || p.ref.M;
  return { min: r[0], max: r[1] };
}

// Estado do valor: 'low' | 'normal' | 'high' | null (sem valor).
export function getEstado(p, valor, sexo) {
  if (valor === "" || valor == null || Number.isNaN(Number(valor))) return null;
  const v = Number(valor);
  const r = getIntervalo(p, sexo);
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

export const ESTADO_INFO = {
  low: { etiqueta: "Baixo", fundo: "#f0f9ff", borda: "#bae6fd", texto: "#0c4a6e" },
  high: { etiqueta: "Alto", fundo: "#fef2f2", borda: "#fecaca", texto: "#991b1b" },
  normal: { etiqueta: "Normal", fundo: "#f0fdf4", borda: "#bbf7d0", texto: "#166534" },
};

// Cores por categoria (apresentação específica deste módulo).
export const CORES_CAT = {
  hemo: "#dc2626",
  bioq: "#0891b2",
  renal: "#0d9488",
  hepa: "#ca8a04",
  tiro: "#7c3aed",
  elec: "#2563eb",
  infl: "#ea580c",
  coag: "#be185d",
  vita: "#059669",
  lipi: "#9333ea",
  urin: "#b45309",
};

export function getCorCat(id) {
  return CORES_CAT[id] || "#64748b";
}
