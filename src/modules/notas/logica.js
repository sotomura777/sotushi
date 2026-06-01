// ============================================================================
// LÓGICA — Notas clínicas (funções puras, sem UI nem dados clínicos embutidos).
// REGRA DE SEGURANÇA: o nome inserido é convertido em INICIAIS e o nome
// completo nunca é guardado em lado nenhum — só as iniciais.
// (Armazenamento encriptado e sincronização: Fase 3, no backend.)
// ============================================================================

import { normalizar } from "@/lib/texto";

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
  return "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function hojeISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// "2026-05-14" -> "14/05/2026"
export function fmtData(d) {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}

// ISO -> "agora mesmo" / "há 12 min" / "há 3h" / "14/05/2026"
export function fmtRelativo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return "agora mesmo";
  if (diff < 60) return `há ${diff} min`;
  if (diff < 1440) return `há ${Math.floor(diff / 60)}h`;
  return fmtData(iso.split("T")[0]);
}

// Deteta sequências numéricas longas (possível identificador de doente).
export function temSequenciaNumerica(texto) {
  return /\d{5,}/.test(texto || "");
}

// Limita corridas de algarismos a `max` (impede nº de processo/identificadores).
// Devolve { texto, cortou } — `cortou` indica se houve algum corte (para avisar).
export function limitarDigitos(texto, max = 4) {
  const t = texto || "";
  const limpo = t.replace(new RegExp(`\\d{${max + 1},}`, "g"), (m) => m.slice(0, max));
  return { texto: limpo, cortou: limpo !== t };
}
export function ocultarSequencias(texto) {
  return (texto || "").replace(/\d{5,}/g, "[REMOVIDO]");
}

// Ordem entre tipos de nota com a mesma data (admissão antes de diário, etc.).
const ORDEM_KIND = { admissao: 0, alta: 0, antigo: 1, normal: 2, diario: 2, rosa: 3 };
export function kindOrder(kind) {
  return ORDEM_KIND[kind] ?? 2;
}

// Cria uma nota nova já com timestamps.
export function criarNota(kind, texto = "", data) {
  const ts = new Date().toISOString();
  return { id: uid(), data: data || hojeISO(), criadoEm: ts, atualizadoEm: ts, kind, feito: false, texto };
}

// Ordena notas: a fixada primeiro, depois data desc, depois tipo. Filtra por pesquisa.
export function ordenarNotas(notas, fixadaId, query) {
  const arr = [...(notas || [])].sort((a, b) => {
    if (fixadaId && a.id === fixadaId) return -1;
    if (fixadaId && b.id === fixadaId) return 1;
    if (b.data !== a.data) return b.data.localeCompare(a.data);
    return kindOrder(a.kind) - kindOrder(b.kind);
  });
  const q = normalizar(query).trim();
  return q ? arr.filter((n) => normalizar(n.texto).includes(q)) : arr;
}

// Agrupa notas (já ordenadas) por data, para mostrar separadores.
export function agruparPorData(notas) {
  const grupos = [];
  for (const n of notas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.data === n.data) ultimo.notas.push(n);
    else grupos.push({ data: n.data, notas: [n] });
  }
  return grupos;
}
