// ============================================================================
// LÓGICA — Ajuste Renal (pura, sem dados clínicos embutidos)
// As funções recebem a lista de fármacos (importada de @conteudo) como dados.
// Cada fármaco tem L[6]: o estado/nota para cada um dos 6 escalões de TFG.
// ============================================================================
import { normalizar } from "@/lib/texto";

// Grupos terapêuticos presentes nos dados, pela ordem de 1.ª aparição
// (mantém o agrupamento clínico do conteúdo, não alfabético).
export function grupos(farmacos) {
  return [...new Set(farmacos.map((f) => f.group))];
}

// Filtra por pesquisa (nome ou classe) + grupos selecionados + ocultar "sem
// ajuste" no escalão atual.
export function filtrar(farmacos, { query = "", gruposSel = [], ocultarOk = false, escalao = 0 } = {}) {
  const q = normalizar(query);
  const sel = new Set(gruposSel);
  return farmacos.filter((f) => {
    if (q && !normalizar(f.name).includes(q) && !normalizar(f.class).includes(q)) return false;
    if (sel.size > 0 && !sel.has(f.group)) return false;
    if (ocultarOk && f.L[escalao].s === "ok") return false;
    return true;
  });
}

// Contagem por estado no escalão atual, respeitando pesquisa e grupos
// (mas ignorando "ocultar OK", para o contador OK continuar a fazer sentido).
export function contagens(farmacos, { query = "", gruposSel = [], escalao = 0 } = {}) {
  const q = normalizar(query);
  const sel = new Set(gruposSel);
  const c = { ok: 0, adjust: 0, caution: 0, ci: 0 };
  for (const f of farmacos) {
    if (q && !normalizar(f.name).includes(q) && !normalizar(f.class).includes(q)) continue;
    if (sel.size > 0 && !sel.has(f.group)) continue;
    c[f.L[escalao].s]++;
  }
  return c;
}

// Agrupa os fármacos filtrados por (grupo · classe), preservando a ordem do conteúdo.
export function agrupar(farmacos) {
  const mapa = new Map();
  for (const f of farmacos) {
    const chave = f.group + "|" + f.class;
    if (!mapa.has(chave)) mapa.set(chave, { group: f.group, class: f.class, farmacos: [] });
    mapa.get(chave).farmacos.push(f);
  }
  return [...mapa.values()];
}
