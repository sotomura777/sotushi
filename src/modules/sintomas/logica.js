import { normalizar } from "@/lib/texto";

// ============================================================================
// Lógica pura do módulo Sintomas — contagens por sistema e pesquisa.
// Sem dados embutidos: recebe sistemas + mapa de sintomas como argumento.
// ============================================================================

export function listarSistemas(sistemas, sintomasPorSistema) {
  return sistemas.map((s) => {
    const lista = sintomasPorSistema[s.id] || [];
    return { ...s, total: lista.length, ativos: lista.filter((x) => x.estado === "ativo").length };
  });
}

// Pesquisa por nome de sintoma ou por sistema (nome/descrição).
// Devolve [{ sintoma, sistema }] com os ativos primeiro, depois alfabético.
export function pesquisar(query, sistemas, sintomasPorSistema) {
  const q = normalizar(query).trim();
  if (!q) return [];
  const out = [];
  sistemas.forEach((s) => {
    const sysMatch = normalizar(s.nome).includes(q) || normalizar(s.desc).includes(q);
    (sintomasPorSistema[s.id] || []).forEach((sint) => {
      if (normalizar(sint.nome).includes(q) || sysMatch) out.push({ sintoma: sint, sistema: s });
    });
  });
  out.sort((a, b) => {
    const aa = a.sintoma.estado === "ativo", ba = b.sintoma.estado === "ativo";
    if (aa && !ba) return -1;
    if (!aa && ba) return 1;
    return a.sintoma.nome.localeCompare(b.sintoma.nome, "pt");
  });
  return out;
}
