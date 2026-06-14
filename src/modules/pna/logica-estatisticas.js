// ============================================================================
// logica-estatisticas.js — agregações puras sobre as respostas finais.
// Sem React, sem IndexedDB. As respostas trazem as etiquetas desnormalizadas
// (especialidade, tipo_raciocinio, dificuldade, guidelines), por isso qualquer
// corte é direto. É aqui que se vê a vantagem da estrutura: um eixo novo é só
// mais uma função de uma linha.
// ============================================================================

const DIA_MS = 86400000;

// ── Filtro temporal ──────────────────────────────────────────────────────────
// janela: 7 | 30 | 90 | "tudo"
export function filtrarPorJanela(respostas, janela, agora = Date.now()) {
  if (janela === "tudo" || !janela) return respostas;
  const corte = agora - janela * DIA_MS;
  return respostas.filter((r) => (r.data || 0) >= corte);
}

// ── Resumo global ────────────────────────────────────────────────────────────
export function resumo(respostas) {
  const total = respostas.length;
  const acertos = respostas.filter((r) => r.correta).length;
  const tempoMs = respostas.reduce((s, r) => s + (r.tempo_total_ms || 0), 0);
  return {
    total,
    acertos,
    taxa: total ? acertos / total : 0,
    tempoMedioS: total ? Math.round(tempoMs / total / 1000) : 0,
  };
}

// delta entre o período atual e o anterior do mesmo tamanho (para os "+4 pp")
export function resumoComDelta(respostas, janela, agora = Date.now()) {
  const atual = filtrarPorJanela(respostas, janela, agora);
  const ra = resumo(atual);
  if (janela === "tudo" || !janela) return { ...ra, dTotal: null, dTaxa: null, dTempo: null };
  const inicioAtual = agora - janela * DIA_MS;
  const anteriores = respostas.filter((r) => (r.data || 0) >= inicioAtual - janela * DIA_MS && (r.data || 0) < inicioAtual);
  const rp = resumo(anteriores);
  return {
    ...ra,
    dTotal: ra.total - rp.total,
    dTaxa: rp.total ? Math.round((ra.taxa - rp.taxa) * 100) : null, // pontos percentuais
    dTempo: rp.total ? ra.tempoMedioS - rp.tempoMedioS : null,
  };
}

// ── Acerto agrupado por um campo desnormalizado ──────────────────────────────
export function acertoPorCampo(respostas, campo) {
  const grupos = {};
  for (const r of respostas) {
    const chave = r[campo];
    if (!chave) continue;
    const g = (grupos[chave] ||= { total: 0, acertos: 0 });
    g.total += 1;
    if (r.correta) g.acertos += 1;
  }
  return Object.entries(grupos)
    .map(([nome, g]) => ({ nome, total: g.total, acertos: g.acertos, taxa: g.acertos / g.total }))
    .sort((a, b) => b.total - a.total);
}

export const acertoPorArea = (respostas) => acertoPorCampo(respostas, "especialidade");
export const acertoPorTipo = (respostas) => acertoPorCampo(respostas, "tipo_raciocinio");

// piores áreas (mínimo de n respostas para contar) — para "áreas a trabalhar"
export function areasAMelhorar(respostas, minN = 1, limite = 3) {
  return acertoPorArea(respostas)
    .filter((a) => a.total >= minN)
    .sort((a, b) => a.taxa - b.taxa)
    .slice(0, limite);
}

// ── Streak (dias consecutivos com ≥1 resposta, até hoje) ─────────────────────
export function streak(respostas, agora = Date.now()) {
  if (!respostas.length) return { atual: 0, recorde: 0 };
  const dias = new Set(respostas.map((r) => Math.floor((r.data || 0) / DIA_MS)));
  const hoje = Math.floor(agora / DIA_MS);
  // streak atual: conta para trás a partir de hoje (ou ontem)
  let atual = 0;
  let d = dias.has(hoje) ? hoje : hoje - 1;
  while (dias.has(d)) { atual += 1; d -= 1; }
  // recorde: maior sequência em todo o histórico
  const ordenados = [...dias].sort((a, b) => a - b);
  let recorde = 1, run = 1;
  for (let i = 1; i < ordenados.length; i++) {
    run = ordenados[i] === ordenados[i - 1] + 1 ? run + 1 : 1;
    if (run > recorde) recorde = run;
  }
  return { atual, recorde: Math.max(recorde, atual) };
}

// ── Evolução temporal (por dia: taxa, tempo médio, volume) ───────────────────
export function evolucaoTemporal(respostas, janela = 30, agora = Date.now()) {
  const dias = janela === "tudo" ? 60 : janela;
  const hoje = Math.floor(agora / DIA_MS);
  const baldes = {};
  for (const r of respostas) {
    const dia = Math.floor((r.data || 0) / DIA_MS);
    if (dia < hoje - dias + 1) continue;
    const b = (baldes[dia] ||= { total: 0, acertos: 0, tempoMs: 0 });
    b.total += 1;
    if (r.correta) b.acertos += 1;
    b.tempoMs += r.tempo_total_ms || 0;
  }
  const out = [];
  for (let dia = hoje - dias + 1; dia <= hoje; dia++) {
    const b = baldes[dia];
    out.push({
      dia,
      data: dia * DIA_MS,
      volume: b ? b.total : 0,
      taxa: b && b.total ? b.acertos / b.total : null,
      tempoMedioS: b && b.total ? Math.round(b.tempoMs / b.total / 1000) : null,
    });
  }
  return out;
}

// ── Heatmap área × tipo de raciocínio ────────────────────────────────────────
// Devolve { areas:[{nome, total, taxa, celulas:[{tipo, total, taxa}]}], tipos:[...] }
export function heatmap(respostas, especialidades, tipos) {
  const m = {};
  const areasComDados = new Set();
  for (const r of respostas) {
    const a = r.especialidade, t = r.tipo_raciocinio;
    if (!a || !t) continue;
    areasComDados.add(a);
    const cel = ((m[a] ||= {})[t] ||= { total: 0, acertos: 0 });
    cel.total += 1;
    if (r.correta) cel.acertos += 1;
  }
  const areas = especialidades
    .filter((a) => areasComDados.has(a))
    .map((a) => {
      let total = 0, acertos = 0;
      const celulas = tipos.map((t) => {
        const c = m[a]?.[t];
        if (c) { total += c.total; acertos += c.acertos; }
        return { tipo: t, total: c?.total || 0, taxa: c && c.total ? c.acertos / c.total : null };
      });
      return { nome: a, total, taxa: total ? acertos / total : null, celulas };
    })
    .sort((x, y) => y.total - x.total);
  return { areas, tipos };
}

// ── Por norma DGS / guideline ────────────────────────────────────────────────
export function acertoPorGuideline(respostas) {
  const grupos = {};
  for (const r of respostas) {
    for (const g of r.guidelines || []) {
      const x = (grupos[g] ||= { total: 0, acertos: 0 });
      x.total += 1;
      if (r.correta) x.acertos += 1;
    }
  }
  return Object.entries(grupos)
    .map(([nome, g]) => ({ nome, total: g.total, acertos: g.acertos, taxa: g.acertos / g.total }))
    .sort((a, b) => b.total - a.total);
}
