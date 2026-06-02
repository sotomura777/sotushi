// ============================================================================
// LÓGICA — Patologias (pura, sem dados clínicos embutidos).
// Recebe a lista de doenças e o filtro/pesquisa; devolve a lista agrupada.
// ============================================================================
import { normalizar } from "@/lib/texto";

// Filtra por sistema + pesquisa (nome ou nome do sistema) e devolve [[letra, lista]]
// ordenado, com as doenças ordenadas alfabeticamente (locale PT).
export function filtrarAgrupar(doencas, sistemas, { sistema = "all", query = "" } = {}) {
  const q = normalizar(query);
  const nomeSistema = (id) => (sistemas.find((s) => s.id === id) || {}).label || "";
  const filtradas = doencas.filter((d) => {
    if (sistema !== "all" && d.sistema !== sistema) return false;
    if (q && !normalizar(d.nome).includes(q) && !normalizar(nomeSistema(d.sistema)).includes(q)) return false;
    return true;
  });
  filtradas.sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  const grupos = {};
  filtradas.forEach((d) => {
    const l = d.nome[0].toUpperCase();
    (grupos[l] = grupos[l] || []).push(d);
  });
  return { total: filtradas.length, grupos: Object.keys(grupos).sort().map((l) => [l, grupos[l]]) };
}

// Resultados da pesquisa do dropdown (lista plana ordenada).
export function pesquisar(doencas, sistemas, query) {
  const q = normalizar(query);
  if (!q) return [];
  const nomeSistema = (id) => (sistemas.find((s) => s.id === id) || {}).label || "";
  return doencas
    .filter((d) => normalizar(d.nome).includes(q) || normalizar(nomeSistema(d.sistema)).includes(q))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
}
