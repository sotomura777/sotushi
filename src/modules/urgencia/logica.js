// ============================================================================
// LÓGICA — Índice de Urgência (sintomas + suspeitas). Fiel ao renderList original.
// ============================================================================

export function normalizar(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Filtra e agrupa os itens.
// opts: { filtro: 'todas'|'favoritos'|<sistema>, favoritos:[ids], query }
export function filtrarItens(itens, sistemas, opts) {
  const { filtro, favoritos, query } = opts;
  let r = itens.filter((s) => {
    if (filtro === "favoritos") return favoritos.includes(s.id);
    if (filtro !== "todas") return s.sys === filtro;
    return true;
  });

  const q = (query || "").trim();
  if (q.length >= 2) {
    const qn = normalizar(q);
    r = r.filter((s) => {
      const hay = [s.name, ...(s.search || []), ...(s.tags || []), sistemas[s.sys]?.label || ""].join(" ");
      return normalizar(hay).includes(qn);
    });
  }

  r.sort((a, b) => a.name.localeCompare(b.name, "pt"));

  const grupos = {};
  r.forEach((s) => {
    const letra = normalizar(s.name).charAt(0).toUpperCase();
    (grupos[letra] = grupos[letra] || []).push(s);
  });

  return { total: r.length, grupos: Object.keys(grupos).sort().map((l) => [l, grupos[l]]) };
}
