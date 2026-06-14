// ============================================================================
// logica-posicao.js — "em que lugar terias ficado" face às PNAs OFICIAIS.
// Compara só com dados públicos da ACSS (historico-oficial.json), NUNCA com
// outros utilizadores da app. Se os percentis não estiverem publicados,
// aproxima por distribuição normal (média + desvio padrão).
// ============================================================================

// função de distribuição normal acumulada (aproximação de Abramowitz-Stegun)
function phi(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

// percentil (0..1) do score num ano oficial
export function percentilNoAno(score, ano) {
  if (!ano) return null;
  if (ano.percentis) {
    const entradas = Object.entries(ano.percentis)
      .map(([k, v]) => [Number(k.replace(/^p/, "")) / 100, v])
      .sort((a, b) => a[1] - b[1]);
    // interpola entre os percentis publicados
    if (score <= entradas[0][1]) return entradas[0][0];
    if (score >= entradas[entradas.length - 1][1]) return entradas[entradas.length - 1][0];
    for (let i = 1; i < entradas.length; i++) {
      const [pa, va] = entradas[i - 1], [pb, vb] = entradas[i];
      if (score <= vb) return pa + ((score - va) / (vb - va)) * (pb - pa);
    }
  }
  if (ano.media != null && ano.desvio_padrao) {
    return phi((score - ano.media) / ano.desvio_padrao);
  }
  return null;
}

// lugar estimado (1 = melhor) num ano com N candidatos
export function lugarNoAno(score, ano) {
  const pct = percentilNoAno(score, ano);
  if (pct == null || !ano.candidatos) return null;
  return Math.max(1, Math.round((1 - pct) * ano.candidatos));
}

// melhor posição histórica do utilizador em todos os anos disponíveis
export function melhorPosicao(score, historico) {
  const anos = historico?.anos || {};
  const chaves = Object.keys(anos);
  if (!chaves.length) return null; // sem dados ACSS → estado vazio
  let melhor = null;
  for (const k of chaves) {
    const pct = percentilNoAno(score, anos[k]);
    const lugar = lugarNoAno(score, anos[k]);
    if (pct == null) continue;
    if (!melhor || pct > melhor.percentil) melhor = { ano: k, percentil: pct, lugar, candidatos: anos[k].candidatos };
  }
  return melhor;
}
