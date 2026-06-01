// ============================================================================
// LÓGICA — Farmacologia na Grávida (pura, sem dados clínicos embutidos)
// As funções recebem a lista de medicamentos (importada de @conteudo) como dados.
// ============================================================================
import { normalizar } from "@/lib/texto";

// Lista ordenada de categorias terapêuticas presentes nos dados.
export function categorias(meds) {
  return [...new Set(meds.map((m) => m.category))].sort();
}

// Estatísticas para o cabeçalho (total, contraindicados, alto risco).
export function estatisticas(meds) {
  return {
    total: meds.length,
    critical: meds.filter((m) => m.riskLevel === "critical").length,
    high: meds.filter((m) => m.riskLevel === "high").length,
  };
}

// Verdadeiro se a pesquisa corresponde a alguma alternativa segura do medicamento.
// Usado para auto-expandir o card quando o utilizador procura um fármaco que
// é, ele próprio, uma alternativa segura noutro medicamento.
export function temAlternativaMatch(med, query) {
  const q = normalizar(query);
  if (!q) return false;
  return med.alternatives.some(
    (a) => normalizar(a.name).includes(q) || normalizar(a.safetyNote).includes(q)
  );
}

// Filtra por pesquisa (nome genérico, princípio ativo, categoria, nomes
// comerciais ou alternativas) + categoria + nível de risco.
export function filtrar(meds, { query = "", categoria = "all", risco = "all" } = {}) {
  const q = normalizar(query);
  return meds.filter((m) => {
    const correspondePesquisa =
      !q ||
      normalizar(m.name).includes(q) ||
      normalizar(m.activeIngredient).includes(q) ||
      normalizar(m.category).includes(q) ||
      m.brandNames.some((b) => normalizar(b).includes(q)) ||
      m.alternatives.some(
        (a) => normalizar(a.name).includes(q) || normalizar(a.safetyNote).includes(q)
      );
    const correspondeCategoria = categoria === "all" || m.category === categoria;
    const correspondeRisco = risco === "all" || m.riskLevel === risco;
    return correspondePesquisa && correspondeCategoria && correspondeRisco;
  });
}
