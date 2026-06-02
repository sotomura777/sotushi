// ============================================================================
// ANONIMIZAR — camada local de minimização de dados identificáveis no texto
// livre das notas. Corre 100% no dispositivo; NÃO envia nada para fora.
//
// Reforça o desenho "só iniciais / não identificar":
//  1) mascararIdentificadores — mascara automaticamente sequências de alta
//     confiança (nº de identificação PT). Só atua em sequências longas e
//     isoladas — nunca em números curtos, decimais ou com unidades clínicas.
//  2) detetarNomeProvavel — deteta o que parece um nome próprio e devolve um
//     sinal para um aviso SUAVE (não altera o texto, não bloqueia).
// ============================================================================

import { normalizar } from "@/lib/texto";

export const MASCARA = "●●●●●●●●●"; // ●●●●●●●●●

// ── 1. Máscara de números de identificação (alta confiança) ─────────────────
//
// Padrões portugueses cobertos por uma sequência ISOLADA de 9+ dígitos:
//   · Nº de utente SNS — 9 dígitos
//   · NIF — 9 dígitos (começa em 1,2,3,5,6,8,9)
//   · Telefone — 9 dígitos (começa em 9 ou 2)
// E ainda o formato típico do Cartão de Cidadão (8 díg + 1 díg + 2 letras + 1 díg).
//
// NÃO mascara números curtos, decimais nem com unidades — "11.2", "140/90",
// "8h", "500 mg" têm < 9 dígitos, por isso nunca são tocados.
export function mascararIdentificadores(texto) {
  let out = texto || "";
  let mascarou = false;
  const marca = () => { mascarou = true; return MASCARA; };

  // Cartão de Cidadão completo: 8 díg + 1 díg + 2 letras + 1 díg (com/sem espaços).
  out = out.replace(/\b\d{8}[ ]?\d[ ]?[A-Za-z]{2}[ ]?\d\b/g, marca);

  // Sequência isolada de 9 ou mais dígitos seguidos (sem espaços).
  out = out.replace(/\b\d{9,}\b/g, marca);

  // Sequência isolada de 9 dígitos com espaços a separar grupos de 3 (ex.: SNS "123 456 789").
  out = out.replace(/\b\d{3}[ ]\d{3}[ ]\d{3}\b/g, marca);

  return { texto: out, mascarou };
}

// ── 2. Aviso suave para nomes prováveis (não altera o texto) ────────────────
//
// Allow-list de termos clínicos com palavras capitalizadas, para evitar falsos
// positivos (estes não são nomes de doente).
const TERMOS_CLINICOS = [
  "Sinal de Murphy", "Sinal de Blumberg", "Sinal de Rovsing", "Sinal de McBurney",
  "Sinal de Cullen", "Sinal de Grey Turner", "Sinal de Homans",
  "Escala de Glasgow", "Escala de Coma de Glasgow", "Escala de Borg",
  "Escala de Braden", "Escala de Norton", "Escala de Morse",
  "Manobra de Valsalva", "Manobra de Ortolani", "Manobra de Barlow",
  "Reflexo de Babinski", "Reflexo de Moro",
  "Doença de Crohn", "Doença de Parkinson", "Doença de Alzheimer",
  "Doença de Graves", "Doença de Addison",
  "Síndrome de Cushing", "Síndrome de Down", "Síndrome de Guillain-Barré",
];
const ALLOW = TERMOS_CLINICOS.map(normalizar);

// Palavras comuns capitalizadas que NÃO são nome (quebram a sequência de nome).
const STOP = new Set([
  "doente", "utente", "paciente", "sr", "sra", "dr", "dra",
  "exame", "nota", "diario", "alta", "entrada", "observado", "apresenta",
  "refere", "nega", "mantem", "sem", "com", "hoje", "ontem",
  "hospital", "servico", "urgencia", "internamento", "consulta",
]);

// Conta como "palavra de nome": Inicial maiúscula + pelo menos uma minúscula
// (exclui siglas clínicas em maiúsculas — TAC, RX, PA, SNS).
function ehPalavraNome(palavra) {
  const limpa = (palavra || "").replace(/^[^A-Za-zÀ-ÿ]+|[^A-Za-zÀ-ÿ]+$/g, "");
  if (!/^[A-ZÀ-Þ][a-zà-ÿ'’\-]+$/.test(limpa)) return false;
  return !STOP.has(normalizar(limpa));
}

// Devolve true se houver uma sequência de 2+ palavras capitalizadas consecutivas
// que não corresponda a um termo clínico conhecido (provável nome próprio).
export function detetarNomeProvavel(texto) {
  const palavras = (texto || "").split(/\s+/);
  const sequencias = [];
  let atual = [];
  for (const w of palavras) {
    if (ehPalavraNome(w)) atual.push(w.replace(/^[^A-Za-zÀ-ÿ]+|[^A-Za-zÀ-ÿ]+$/g, ""));
    else { if (atual.length >= 2) sequencias.push(atual.join(" ")); atual = []; }
  }
  if (atual.length >= 2) sequencias.push(atual.join(" "));

  return sequencias.some((seq) => {
    const n = normalizar(seq);
    return !ALLOW.some((termo) => termo.includes(n));
  });
}
