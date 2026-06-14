// ============================================================================
// db.js — acesso ao IndexedDB do módulo PNA (via Dexie).
// O estado pessoal (respostas, eventos, sessões, FSRS, marcações) vive aqui,
// localmente no dispositivo. A sincronização cifrada chega na Fase 3 do roadmap
// global — a forma das tabelas mantém-se, por isso migrar será trivial.
//
// Expomos funções tipadas, nunca a instância crua, para o resto do módulo não
// depender da API do Dexie.
// ============================================================================
import Dexie from "dexie";

const db = new Dexie("medguia_pna");

// Esquema completo desde já (evita migrações ao crescer). Só os índices que
// precisamos de consultar entram na string; os outros campos guardam-se na mesma.
db.version(1).stores({
  eventos: "++id, sessao_id, pergunta_id, modo, evento_tipo, t_absoluto",
  respostas: "++id, sessao_id, pergunta_id, modo, correta, data",
  sessoes: "id, modo, estado, data_inicio",
  fsrs: "pergunta_id, due, state",
  marcacoes: "pergunta_id, data_marcacao",
  presets: "++id, nome",
});
// v2: remove o índice `correta` (booleano não é chave válida no IndexedDB —
// era ignorado em silêncio). Filtramos por correta em JS, não por índice.
// Migração automática do Dexie, sem transformação de dados.
db.version(2).stores({
  eventos: "++id, sessao_id, pergunta_id, modo, evento_tipo, t_absoluto",
  respostas: "++id, sessao_id, pergunta_id, modo, data",
  sessoes: "id, modo, estado, data_inicio",
  fsrs: "pergunta_id, due, state",
  marcacoes: "pergunta_id, data_marcacao",
  presets: "++id, nome",
});

// ── Eventos (fonte primária da análise comportamental) ───────────────────────
export function guardarEvento(ev) {
  return db.eventos.add({ t_absoluto: Date.now(), ...ev });
}

// ── Respostas finais ─────────────────────────────────────────────────────────
export function guardarResposta(r) {
  return db.respostas.add({ data: Date.now(), ...r });
}
export function guardarRespostas(arr) {
  const agora = Date.now();
  return db.respostas.bulkAdd(arr.map((r) => ({ data: agora, ...r })));
}
export function obterRespostas() {
  return db.respostas.toArray();
}
export function contarRespostas() {
  return db.respostas.count();
}

// ── Sessões ──────────────────────────────────────────────────────────────────
export function guardarSessao(s) {
  return db.sessoes.put(s);
}
export function listarSessoes() {
  return db.sessoes.toArray();
}

// ── Presets do utilizador (Construtor) ───────────────────────────────────────
export function guardarPreset(p) {
  return db.presets.add({ data_criacao: Date.now(), vezes_usado: 0, ...p });
}
export function listarPresets() {
  return db.presets.toArray();
}
export function apagarPreset(id) {
  return db.presets.delete(id);
}

// ── FSRS (estado de repetição espaçada por pergunta) ─────────────────────────
export function obterFsrs() {
  return db.fsrs.toArray();
}
export function obterFsrsCard(perguntaId) {
  return db.fsrs.get(perguntaId);
}
export function guardarFsrsCard(card) {
  return db.fsrs.put(card);
}

// ── Reset (apaga TODOS os dados de treino deste dispositivo) ─────────────────
export async function limparDados() {
  await Promise.all([
    db.eventos.clear(),
    db.respostas.clear(),
    db.sessoes.clear(),
    db.fsrs.clear(),
    db.marcacoes.clear(),
  ]);
}

export { db };
