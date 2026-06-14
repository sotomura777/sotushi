// ============================================================================
// logica-seed.js — gera dados de TREINO SINTÉTICOS para ver os gráficos vivos
// durante o desenvolvimento/revisão. Tudo fica no IndexedDB e apaga-se com
// "Limpar dados de treino". NÃO é conteúdo clínico — são só respostas fictícias
// (sem texto de perguntas). Marcadas com sintetico:true.
// ============================================================================
import { db } from "./db";

const DIA_MS = 86400000;
const LETRAS = ["A", "B", "C", "D", "E"];

// competência-base por área e por tipo (0..1) — só para dar forma aos dados
const AREAS = {
  "Medicina Geral e Familiar": 0.86, Pneumologia: 0.80, Cardiologia: 0.75,
  Endocrinologia: 0.70, Neurologia: 0.68, Pediatria: 0.64,
  "Cirurgia Geral": 0.61, Gastrenterologia: 0.58, Infeciologia: 0.55,
};
const TIPOS = {
  Prevenção: 0.76, Tratamento: 0.74, Diagnóstico: 0.72, Investigação: 0.70,
  Ética: 0.66, Prognóstico: 0.62, Emergência: 0.58,
};
const GUIDELINES = {
  Cardiologia: ["Norma 015/2019 · Fibrilhação auricular", "Norma 020/2017 · HTA"],
  Endocrinologia: ["Norma 052/2011 · Diabetes"],
  Infeciologia: ["Norma 011/2017 · Sépsis"],
  Pediatria: ["PNV 2025 · vacinação"],
};

const rnd = () => Math.random();
const escolha = (arr) => arr[Math.floor(rnd() * arr.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// fator de acerto consoante o tempo (zona ótima ~30-90s; mau acima de 2 min)
function fatorTempo(s) {
  if (s < 30) return 0.95;
  if (s < 90) return 1.06;
  if (s < 120) return 0.9;
  if (s < 180) return 0.78;
  if (s < 240) return 0.62;
  return 0.5;
}

export async function gerarDadosExemplo() {
  const agora = Date.now();
  const hoje = Math.floor(agora / DIA_MS);
  const areas = Object.keys(AREAS);
  const tipos = Object.keys(TIPOS);
  const respostas = [];

  // ~14 sessões nos últimos 32 dias (algumas grandes = "exame", para a fadiga)
  let nSessao = 0;
  for (let s = 0; s < 16; s++) {
    const diasAtras = Math.floor(rnd() * 32);
    const grande = rnd() < 0.3;
    const n = grande ? 60 + Math.floor(rnd() * 90) : 8 + Math.floor(rnd() * 22);
    const horaPico = rnd() < 0.5 ? 13 : escolha([8, 10, 16, 19, 22]);
    const sessaoId = `sintetico-${++nSessao}`;
    const trend = (32 - diasAtras) / 32; // mais recente → melhor (aprendizagem)

    for (let i = 0; i < n; i++) {
      const area = escolha(areas);
      const tipo = escolha(tipos);
      const dif = escolha(["fácil", "média", "difícil"]);

      // tempo (s): mais longo nas difíceis
      const baseT = dif === "fácil" ? 45 : dif === "média" ? 75 : 110;
      const tempoS = clamp(Math.round(baseT + (rnd() - 0.4) * 90), 8, 300);

      // probabilidade de acerto
      let p = 0.5 * AREAS[area] + 0.5 * TIPOS[tipo];
      p += (trend - 0.5) * 0.22;                 // tendência ao longo do tempo
      p -= (i / n) * 0.16;                        // fadiga dentro da sessão
      p *= fatorTempo(tempoS);                    // tempo×acerto
      const hora = clamp(horaPico + Math.floor((rnd() - 0.5) * 4), 6, 23);
      if (hora >= 12 && hora < 15) p += 0.06;
      if (hora >= 21) p -= 0.10;
      p = clamp(p, 0.05, 0.97);

      const correta = rnd() < p;
      const correta_letra = escolha(LETRAS);
      const opcao_final = correta ? correta_letra : escolha(LETRAS.filter((l) => l !== correta_letra));

      // mudança de resposta (~18%), enviesada a certo→errado
      let primeira_opcao = opcao_final;
      let nMud = 0;
      if (rnd() < 0.18) {
        nMud = 1;
        if (!correta && rnd() < 0.62) primeira_opcao = correta_letra;          // certo→errado
        else if (correta) primeira_opcao = escolha(LETRAS.filter((l) => l !== correta_letra)); // errado→certo
        else primeira_opcao = escolha(LETRAS.filter((l) => l !== opcao_final && l !== correta_letra)); // errado→errado
      }

      // timestamp do dia/hora da sessão
      const data = (hoje - diasAtras) * DIA_MS + hora * 3600000 + Math.floor(rnd() * 3600000);

      respostas.push({
        sessao_id: sessaoId, pergunta_id: `sintetico-${area}-${i}-${s}`, modo: grande ? "exame" : "treino",
        opcao_final, primeira_opcao, correta, correta_letra,
        tempo_total_ms: tempoS * 1000, n_mudancas_resposta: nMud, marcou_revisao: false,
        ordem: i, especialidade: area, tipo_raciocinio: tipo, dificuldade: dif,
        guidelines: GUIDELINES[area] ? [escolha(GUIDELINES[area])] : [],
        data, sintetico: true,
      });
    }
  }

  await db.respostas.bulkAdd(respostas);
  return respostas.length;
}
