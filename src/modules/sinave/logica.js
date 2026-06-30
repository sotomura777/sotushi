import { normalizar } from "@/lib/texto";

// ============================================================================
// Lógica pura do módulo SINAVE — filtragem, natureza, tags e estatísticas.
// Sem dados embutidos: recebe a lista de doenças e a config como argumentos.
// ============================================================================

// Filtra por pesquisa (nome/agente/critérios, sem acentos) e por tags ativas
// (todas as tags ativas têm de estar presentes — AND).
export function filtrar(doencas, q, ativas) {
  const ql = normalizar(q).trim();
  return doencas.filter((d) => {
    if (ativas.length) {
      for (const k of ativas) if (!d.cats.includes(k)) return false;
    }
    if (!ql) return true;
    const hay = normalizar(`${d.name} ${d.agent} ${d.crit.clin} ${d.crit.lab} ${d.crit.epi}`);
    return hay.includes(ql);
  });
}

// Natureza dominante da doença (primeira da lista NATURE presente em cats).
export function naturezaDe(d, nature) {
  for (const n of nature) if (d.cats.includes(n)) return n;
  return nature[0];
}

// Tags ordenadas por prioridade, opcionalmente limitadas a `max` (+N no fim).
export function tagsDe(d, tagPriority, max) {
  const ordenadas = tagPriority.filter((t) => d.cats.includes(t));
  const visiveis = max ? ordenadas.slice(0, max) : ordenadas;
  const extra = max && ordenadas.length > max ? ordenadas.length - max : 0;
  return { visiveis, extra };
}

// Contagens para a barra de estatísticas.
export function estatisticas(doencas) {
  const tem = (k) => doencas.filter((d) => d.cats.includes(k)).length;
  return [
    { n: doencas.length, l: "Doenças" },
    { n: tem("bact"), l: "Bacterianas" },
    { n: tem("vir"), l: "Virais" },
    { n: doencas.filter((d) => d.cats.includes("par") || d.cats.includes("pri")).length, l: "Parasitárias" },
    { n: tem("crit"), l: "Alto risco" },
  ];
}
