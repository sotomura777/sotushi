// LÓGICA — Biblioteca de cards (pura, sem dados embutidos).
// Os mapas (tipos/especialidades) são passados como argumento.

export function uid() {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// "HTA, 1ª linha" -> ["HTA", "1ª LINHA"]
export function parseTags(s) {
  return (s || "").split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
}

// tag 0 -> cor da especialidade · tag 1 -> cor do tipo · 2+ -> cinzento
export function gerarTagColors(tags, corEsp, corTipo) {
  return (tags || []).map((_, i) => (i === 0 ? corEsp : i === 1 ? corTipo : "#475569"));
}

export function filtrar(cards, { filtroTipo, filtroEsp, favOnly }) {
  return (cards || []).filter(
    (c) =>
      (filtroTipo === "Todos" || c.tipo === filtroTipo) &&
      (filtroEsp === "Todas" || c.especialidade === filtroEsp) &&
      (!favOnly || c.favorito)
  );
}

// Agrupa por especialidade (se porEspecialidade) ou por tipo.
export function agrupar(cards, porEspecialidade, ESP, TIPOS) {
  const grupos = {};
  for (const c of cards) {
    const k = porEspecialidade ? c.especialidade : c.tipo;
    (grupos[k] = grupos[k] || []).push(c);
  }
  return Object.keys(grupos).map((k) => {
    const m = porEspecialidade ? ESP[k] : TIPOS[k];
    return { chave: k, label: porEspecialidade ? (m?.label || k) : k, cor: m?.cor || "#475569", cards: grupos[k] };
  });
}

// Especialidades que têm cards (cruzando com o filtro de tipo e favoritos).
export function especialidadesComCards(cards, { filtroTipo, favOnly }) {
  const set = new Set();
  for (const c of cards) {
    if ((filtroTipo === "Todos" || c.tipo === filtroTipo) && (!favOnly || c.favorito)) set.add(c.especialidade);
  }
  return set;
}
