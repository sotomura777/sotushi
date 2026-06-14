// ============================================================================
// exportar.js — exportação de dados para CSV, sem dependências. Gera um ficheiro
// e dispara o download no browser. CSV (não PDF) para não juntar libs pesadas;
// abre direto no Excel/Numbers/Sheets.
// ============================================================================
function escapar(v) {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function descarregarCSV(nomeFicheiro, cabecalhos, linhas) {
  const corpo = linhas.map((l) => l.map(escapar).join(",")).join("\n");
  const csv = "﻿" + cabecalhos.join(",") + "\n" + corpo; // BOM → acentos no Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFicheiro;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const dataISO = (ms) => (ms ? new Date(ms).toISOString().slice(0, 16).replace("T", " ") : "");

// respostas → CSV (usado nas Estatísticas)
export function exportarRespostas(respostas, nome = "pna-respostas.csv") {
  descarregarCSV(
    nome,
    ["data", "modo", "especialidade", "tipo_raciocinio", "dificuldade", "correta", "opcao_final", "tempo_s", "n_mudancas"],
    respostas.map((r) => [
      dataISO(r.data), r.modo, r.especialidade, r.tipo_raciocinio, r.dificuldade,
      r.correta ? "sim" : "não", r.opcao_final, Math.round((r.tempo_total_ms || 0) / 1000), r.n_mudancas_resposta || 0,
    ])
  );
}

// sessões → CSV (usado no Histórico)
export function exportarSessoes(sessoes, nome = "pna-simulacoes.csv") {
  descarregarCSV(
    nome,
    ["data", "modo", "ano_simulado", "n_perguntas", "n_acertos", "acerto_pct", "duracao_min"],
    sessoes.map((s) => [
      dataISO(s.data_inicio), s.modo, s.ano_simulado ?? "", s.n_perguntas, s.n_acertos,
      s.n_perguntas ? Math.round((s.n_acertos / s.n_perguntas) * 100) : 0,
      Math.round((s.duracao_ms || 0) / 60000),
    ])
  );
}

// caderno de erros → CSV (usado na Revisão). `caderno` = [{ id, n, opcao, correta, area, titulo }]
export function exportarCaderno(caderno, nome = "pna-caderno-erros.csv") {
  descarregarCSV(
    nome,
    ["pergunta", "area", "vezes_errada", "ultima_resposta", "correta"],
    caderno.map((e) => [e.titulo || e.id, e.area || "", e.n, e.opcao || "", e.correta || ""])
  );
}
