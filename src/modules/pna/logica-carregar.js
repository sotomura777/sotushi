// ============================================================================
// logica-carregar.js — lê o banco de perguntas (perguntas.jsonl) e valida cada
// item contra a taxonomia. Função pura: recebe o texto cru e a taxonomia,
// devolve { perguntas, erros }. Perguntas inválidas são rejeitadas (e contadas
// em `erros`) — nunca entram na app.
//
// O .jsonl não é importável como módulo, por isso o PNA.jsx importa-o com `?raw`
// (texto) e passa-o aqui. Honra o contrato do pipeline (um JSON por linha).
// ============================================================================

const LETRAS = ["A", "B", "C", "D", "E"];

export function validarPergunta(q, taxonomia) {
  const erros = [];
  if (!q || typeof q !== "object") return ["não é objeto"];
  if (!q.id) erros.push("sem id");
  if (!q.vinheta) erros.push("sem vinheta");
  if (!q.lead_in) erros.push("sem lead_in");
  if (!Array.isArray(q.opcoes) || q.opcoes.length < 2) erros.push("opções inválidas");
  if (!q.correta || !LETRAS.includes(q.correta)) erros.push("correta inválida");
  else if (Array.isArray(q.opcoes) && !q.opcoes.some((o) => o.letra === q.correta))
    erros.push("correta não corresponde a nenhuma opção");

  const tx = q.taxonomia || {};
  if (!taxonomia.especialidades.includes(tx.especialidade))
    erros.push(`especialidade fora da taxonomia: ${tx.especialidade}`);
  if (tx.tipo_raciocinio && !taxonomia.tipos_raciocinio.includes(tx.tipo_raciocinio))
    erros.push(`tipo_raciocinio fora da taxonomia: ${tx.tipo_raciocinio}`);
  // subarea é opcional; só valida se a especialidade tiver subáreas declaradas
  const subs = taxonomia.subareas?.[tx.especialidade];
  if (tx.subarea && subs && !subs.includes(tx.subarea))
    erros.push(`subarea fora da taxonomia: ${tx.subarea}`);
  if (q.dificuldade && !taxonomia.dificuldades.includes(q.dificuldade))
    erros.push(`dificuldade fora da taxonomia: ${q.dificuldade}`);

  return erros;
}

export function carregarPerguntas(textoJsonl, taxonomia) {
  const perguntas = [];
  const erros = [];
  const linhas = String(textoJsonl).split("\n").map((l) => l.trim()).filter(Boolean);

  for (const linha of linhas) {
    let q;
    try {
      q = JSON.parse(linha);
    } catch {
      erros.push({ linha: linha.slice(0, 60), motivo: "JSON inválido" });
      continue;
    }
    const probl = validarPergunta(q, taxonomia);
    if (probl.length) {
      erros.push({ id: q.id || "?", motivo: probl.join("; ") });
      continue;
    }
    perguntas.push(q);
  }
  return { perguntas, erros };
}
