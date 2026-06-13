// Lógica pura do InfetAcesso. Sem conteúdo clínico embutido — recebe os dados.
import { normalizar } from "@/lib/texto";

const semTags = (h) => (h || "").replace(/<[^>]+>/g, " ");

// Blob de pesquisa de uma doença = data-search + título + rótulos + texto dos painéis
// (réplica do original, que filtrava sobre data-search + card.textContent).
export function blobPesquisa(d) {
  return normalizar(d.search + " " + d.title + " " + d.tabs.map((t) => t.label + " " + semTags(t.html)).join(" "));
}

// Filtra as doenças de um sistema pela query (cache do blob via WeakMap).
const cacheBlob = new WeakMap();
export function filtrarDoencas(diseases, query) {
  const q = normalizar(query).trim();
  if (!q) return diseases;
  return diseases.filter((d) => {
    let blob = cacheBlob.get(d);
    if (blob === undefined) { blob = blobPesquisa(d); cacheBlob.set(d, blob); }
    return blob.includes(q);
  });
}

// Centor/McIsaac (portado verbatim do original): score 0–5 → classe + recomendação.
export function recomendacaoCentor(score) {
  if (score <= 1) return { cls: "low", rec: "Baixa probabilidade - não tratar, não testar" };
  if (score <= 3) return { cls: "mid", rec: "Probabilidade intermédia - realizar TDAR (Teste de Deteção Rápida de Antigénio) ou cultura antes de tratar" };
  return { cls: "high", rec: "Alta probabilidade - tratar empiricamente (ou confirmar com TDAR - Teste de Deteção Rápida de Antigénio)" };
}
