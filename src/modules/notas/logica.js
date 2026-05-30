// ============================================================================
// LÓGICA — Notas clínicas.
// REGRA DE SEGURANÇA: o nome inserido é convertido em INICIAIS.
// O nome completo nunca é guardado em lado nenhum — só as iniciais.
// (O armazenamento encriptado e a sincronização são tratados pelo backend.)
// ============================================================================

const CONECTORES = new Set(["de", "da", "do", "dos", "das", "e"]);

// "João Pedro Silva" -> "J.P.S."   ·  "Maria de Sousa" -> "M.S."
export function paraIniciais(nome) {
  const partes = (nome || "").trim().split(/\s+/).filter(Boolean);
  const letras = partes
    .filter((p) => !CONECTORES.has(p.toLowerCase()))
    .map((p) => p[0])
    .filter(Boolean)
    .map((c) => c.toUpperCase());
  return letras.length ? letras.join(".") + "." : "";
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function hojeISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
