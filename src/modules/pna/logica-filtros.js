// ============================================================================
// logica-filtros.js — aplica os filtros do Construtor sobre o banco de perguntas.
// Puro: recebe o banco, os filtros e um resumo do histórico pessoal; devolve a
// lista filtrada/ordenada. O histórico pessoal vem do IndexedDB (calculado no
// componente) para suportar "só erradas", "nunca vistas", "marcadas".
// ============================================================================

export const filtrosVazios = () => ({
  especialidades: new Set(),
  subareas: new Set(),
  tipos: new Set(),
  dificuldades: new Set(),
  guidelines: new Set(),
  historico: "qualquer", // qualquer | nunca | erradas | marcadas
});

// hist: { vistas:Set<id>, erradas:Set<id>, marcadas:Set<id>, errosPorId:{id:n} }
export function filtrarPerguntas(banco, f, hist = {}) {
  const { vistas = new Set(), erradas = new Set(), marcadas = new Set() } = hist;
  return banco.filter((q) => {
    const tx = q.taxonomia || {};
    if (f.especialidades.size && !f.especialidades.has(tx.especialidade)) return false;
    if (f.subareas.size && !f.subareas.has(tx.subarea)) return false;
    if (f.tipos.size && !f.tipos.has(tx.tipo_raciocinio)) return false;
    if (f.dificuldades.size && !f.dificuldades.has(q.dificuldade)) return false;
    if (f.guidelines.size && !(q.guidelines_fonte || []).some((g) => f.guidelines.has(g))) return false;
    if (f.historico === "nunca" && vistas.has(q.id)) return false;
    if (f.historico === "erradas" && !erradas.has(q.id)) return false;
    if (f.historico === "marcadas" && !marcadas.has(q.id)) return false;
    return true;
  });
}

export function ordenar(perguntas, ordem, hist = {}) {
  const arr = [...perguntas];
  if (ordem === "mais_errada") {
    const e = hist.errosPorId || {};
    return arr.sort((a, b) => (e[b.id] || 0) - (e[a.id] || 0));
  }
  if (ordem === "antiga") {
    // nunca vistas primeiro, depois as restantes
    const vistas = hist.vistas || new Set();
    return arr.sort((a, b) => (vistas.has(a.id) ? 1 : 0) - (vistas.has(b.id) ? 1 : 0));
  }
  // aleatória (Fisher-Yates)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function contarPorDificuldade(perguntas) {
  const c = { fácil: 0, média: 0, difícil: 0 };
  for (const q of perguntas) if (c[q.dificuldade] != null) c[q.dificuldade] += 1;
  return c;
}

// montar a sessão final: filtra, ordena e corta ao nº pedido
export function montarSessao(banco, f, hist, ordem, n) {
  const filtradas = ordenar(filtrarPerguntas(banco, f, hist), ordem, hist);
  return filtradas.slice(0, Math.min(n, filtradas.length));
}

export function gerarSugestao(f, total) {
  if (total === 0) return "Nenhuma pergunta corresponde a estes filtros. Alarga os critérios.";
  const partes = [];
  if (f.historico === "erradas") partes.push("só as que erraste");
  if (f.dificuldades.size === 1 && f.dificuldades.has("difícil")) partes.push("só difíceis");
  if (f.especialidades.size === 1) partes.push(`focado em ${[...f.especialidades][0]}`);
  if (!partes.length) return null;
  return `Combinação ${partes.join(" + ")}. Exigente — bom para apertar onde dói.`;
}
