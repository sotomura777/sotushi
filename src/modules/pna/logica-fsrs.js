// ============================================================================
// logica-fsrs.js — repetição espaçada via a biblioteca ts-fsrs (não reinventar).
// Guarda/atualiza um "card" por pergunta e gera o feed de revisão, a curva de
// retenção e a previsão de carga. Tudo puro (sem React, sem IndexedDB): recebe
// os cards e devolve dados; a persistência fica no db.js.
// ============================================================================
import { fsrs, generatorParameters, createEmptyCard, Rating, State } from "ts-fsrs";

const f = fsrs(generatorParameters({ enable_fuzz: false }));
const DIA = 86400000;
const GRADE = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy };

// datas vindas do IndexedDB podem ser strings/Date — normalizar para a lib
function norm(card) {
  return { ...card, due: new Date(card.due), last_review: card.last_review ? new Date(card.last_review) : undefined };
}
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function novoCard(perguntaId, agora = Date.now()) {
  return { pergunta_id: perguntaId, ...createEmptyCard(new Date(agora)) };
}

export function aplicarGrade(card, grade, agora = Date.now()) {
  const res = f.next(norm(card), new Date(agora), GRADE[grade]);
  return { pergunta_id: card.pergunta_id, ...res.card };
}

// dias até à próxima revisão para cada grau (pré-visualização nos botões)
export function intervalosPreview(card, agora = Date.now()) {
  const base = card ? norm(card) : createEmptyCard(new Date(agora));
  const log = f.repeat(base, new Date(agora));
  const dias = (g) => (log[g].card.due.getTime() - agora) / DIA;
  return { again: dias(Rating.Again), hard: dias(Rating.Hard), good: dias(Rating.Good), easy: dias(Rating.Easy) };
}

export function retrievability(card, agora = Date.now()) {
  return f.get_retrievability(norm(card), new Date(agora), false);
}

// feed de hoje: críticas / manutenção / novas (devolve ids de pergunta)
export function gerarFeed(cards, perguntas, agora = Date.now(), limiteNovas = 10) {
  const byId = {};
  cards.forEach((c) => (byId[c.pergunta_id] = c));
  const criticas = [], manutencao = [];
  for (const c of cards) {
    if (new Date(c.due).getTime() > agora) continue;
    const r = retrievability(c, agora);
    if (c.state === State.Relearning || c.lapses > 0 || r < 0.7) criticas.push(c.pergunta_id);
    else manutencao.push(c.pergunta_id);
  }
  const novas = perguntas.filter((p) => !byId[p.id]).map((p) => p.id).slice(0, limiteNovas);
  return { criticas, manutencao, novas, byId };
}

// previsão dos próximos 7 dias (nº de cards a vencer por dia; dia 0 inclui atrasados)
export function prever7Dias(cards, agora = Date.now()) {
  const hoje = Math.floor(agora / DIA);
  const out = Array.from({ length: 7 }, () => 0);
  for (const c of cards) {
    const d = Math.floor(new Date(c.due).getTime() / DIA) - hoje;
    if (d <= 0) out[0] += 1; else if (d < 7) out[d] += 1;
  }
  return out;
}

// curva de retenção média dos cards a vencer: com revisão hoje vs. sem revisão
export function curvaRetencao(cards, agora = Date.now(), dias = 14) {
  const due = cards.filter((c) => new Date(c.due).getTime() <= agora);
  const base = due.length ? due : cards;
  if (!base.length) return [];
  const revistos = base.map((c) => aplicarGrade(c, "good", agora));
  const pts = [];
  for (let d = 0; d <= dias; d++) {
    const t = agora + d * DIA;
    pts.push({ d, sem: media(base.map((c) => retrievability(c, t))), com: media(revistos.map((c) => retrievability(c, t))) });
  }
  return pts;
}
