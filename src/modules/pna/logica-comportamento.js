// ============================================================================
// logica-comportamento.js — análise dos padrões de resposta. A peça mais
// valiosa do módulo. Tudo puro: recebe as respostas (que trazem primeira_opcao,
// opcao_final, correta, tempo, ordem, data) e devolve números + insights.
// ============================================================================

// ── Mudança de resposta (certo→errado vs errado→certo) ───────────────────────
export function mudancaResposta(respostas) {
  let mudou = 0, certoErrado = 0, erradoCerto = 0, igual = 0;
  for (const r of respostas) {
    if (r.primeira_opcao == null || r.opcao_final == null) continue;
    if (r.primeira_opcao === r.opcao_final) continue;
    mudou += 1;
    // letra correta conhecida (correta_letra); senão infere-se pelo resultado final
    const primCerta = r.correta_letra
      ? r.primeira_opcao === r.correta_letra
      : !r.correta; // se a final está errada, a primeira (diferente) pode ter sido a certa
    const finalCerta = r.correta;
    if (primCerta && !finalCerta) certoErrado += 1;
    else if (!primCerta && finalCerta) erradoCerto += 1;
    else igual += 1;
  }
  const total = respostas.length;
  return {
    mudou,
    pctMudou: total ? mudou / total : 0,
    certoErrado,
    erradoCerto,
    igual,
    pctCertoErrado: mudou ? certoErrado / mudou : 0,
    pctErradoCerto: mudou ? erradoCerto / mudou : 0,
  };
}

// ── Tempo vs acerto (baldes de tempo) ────────────────────────────────────────
const BALDES = [
  { label: "<30s", min: 0, max: 30 },
  { label: "30-60s", min: 30, max: 60 },
  { label: "60-90s", min: 60, max: 90 },
  { label: "90-120s", min: 90, max: 120 },
  { label: "120-180s", min: 120, max: 180 },
  { label: "180-240s", min: 180, max: 240 },
  { label: ">240s", min: 240, max: Infinity },
];
export function tempoVsAcerto(respostas) {
  const out = BALDES.map((b) => ({ ...b, total: 0, acertos: 0 }));
  for (const r of respostas) {
    const s = (r.tempo_total_ms || 0) / 1000;
    const b = out.find((x) => s >= x.min && s < x.max);
    if (!b) continue;
    b.total += 1;
    if (r.correta) b.acertos += 1;
  }
  return out.map((b) => ({ label: b.label, total: b.total, taxa: b.total ? b.acertos / b.total : null }));
}

// ── Fadiga (acerto por posição dentro da sessão) ─────────────────────────────
export function fadiga(respostas, tamBalde = 50) {
  const baldes = {};
  for (const r of respostas) {
    if (r.ordem == null) continue;
    const k = Math.floor(r.ordem / tamBalde);
    const b = (baldes[k] ||= { total: 0, acertos: 0 });
    b.total += 1;
    if (r.correta) b.acertos += 1;
  }
  return Object.entries(baldes)
    .map(([k, b]) => ({
      label: `${k * tamBalde + 1}-${(Number(k) + 1) * tamBalde}`,
      total: b.total,
      taxa: b.total ? b.acertos / b.total : null,
    }))
    .sort((a, b) => parseInt(a.label) - parseInt(b.label));
}

// ── Hora do dia (6 faixas) ───────────────────────────────────────────────────
const FAIXAS = [
  { label: "6-9h", min: 6, max: 9 },
  { label: "9-12h", min: 9, max: 12 },
  { label: "12-15h", min: 12, max: 15 },
  { label: "15-18h", min: 15, max: 18 },
  { label: "18-21h", min: 18, max: 21 },
  { label: "21-0h", min: 21, max: 24 },
];
export function performancePorHora(respostas) {
  const out = FAIXAS.map((f) => ({ ...f, total: 0, acertos: 0 }));
  for (const r of respostas) {
    const h = new Date(r.data || 0).getHours();
    const f = out.find((x) => h >= x.min && h < x.max);
    if (!f) continue;
    f.total += 1;
    if (r.correta) f.acertos += 1;
  }
  return out.map((f) => ({ label: f.label, total: f.total, taxa: f.total ? f.acertos / f.total : null }));
}

// ── Insights textuais a partir dos padrões ───────────────────────────────────
export function detectarPadroes(respostas) {
  const padroes = [];
  const m = mudancaResposta(respostas);
  if (m.mudou >= 8 && m.pctCertoErrado >= 0.55) {
    padroes.push({
      tipo: "mau",
      titulo: "Mudas a resposta a teu favor… ao contrário.",
      texto: `Em ${Math.round(m.pctCertoErrado * 100)}% das vezes que mudas, passas de certo para errado. Confia mais na primeira intuição.`,
    });
  }
  const tva = tempoVsAcerto(respostas);
  const lento = tva.filter((b) => [">240s", "180-240s"].includes(b.label) && b.taxa != null);
  if (lento.length && lento.every((b) => b.taxa < 0.5)) {
    padroes.push({
      tipo: "aviso",
      titulo: "Quando demoras muito, costumas errar.",
      texto: "Acima de ~2 minutos o acerto cai. Considera marcar essas perguntas e voltar no fim.",
    });
  }
  const fad = fadiga(respostas);
  if (fad.length >= 2) {
    const primeiro = fad[0].taxa, ultimo = fad[fad.length - 1].taxa;
    if (primeiro != null && ultimo != null && primeiro - ultimo >= 0.1) {
      padroes.push({
        tipo: "aviso",
        titulo: "Cais ao longo da prova.",
        texto: `Perdes ${Math.round((primeiro - ultimo) * 100)} pontos percentuais do início para o fim. Faz pausas planeadas.`,
      });
    }
  }
  const horas = performancePorHora(respostas).filter((h) => h.total >= 3 && h.taxa != null);
  if (horas.length) {
    const melhor = horas.reduce((a, b) => (b.taxa > a.taxa ? b : a));
    padroes.push({ tipo: "bom", titulo: `Rendes melhor às ${melhor.label}.`, texto: "Marca o teu estudo sério para essa janela." });
  }
  return padroes;
}
