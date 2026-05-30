// ============================================================================
// LÓGICA — Abordagem à obstipação. Porte EXATO de buildResultObstipacao.
// Recebe as respostas (OA) e o percurso (OPath). Devolve dados estruturados.
// Dados (steps, antecedentes, meds) em /conteudo/urgencia/obstipacao.json
// ============================================================================

export function gerarResultado(OA, steps) {
  const oHas = (id, v) => (OA[id] || []).some((x) => x.val === v);
  const oGetFl = (id) => (OA[id] || []).filter((x) => x.flagged);
  const oGetSafe = (id) => (OA[id] || []).filter((x) => !x.flagged && !String(x.val).startsWith("nenhum") && x.val !== "normal_eo");

  const tipo = OA.tipo?.[0]?.val || "cronica";
  const isCronica = tipo === "cronica";
  const tipoLabel = { novo: "aguda (novo início)", agravamento: "subaguda (agravamento de obstipação prévia)", cronica: "crónica" }[tipo] || tipo;

  const alarmesFl = oGetFl("alarme");
  const sxSafe = oGetSafe("sx");
  const medsSel = (OA["meds"] || []).filter((m) => m !== "nenhuma");
  const apRel = oGetSafe("ap_rel");
  const outrosAp = OA["outros_ap"] || [];
  const eoFl = oGetFl("eo");
  const eoSafe = oGetSafe("eo");

  const sxMap = { distensao_sx: "distensão abdominal", dor_abd: "dor abdominal", nauseas: "náuseas", alternancia: "alternância com diarreia", esforco: "esforço evacuatório marcado", incompl: "sensação de evacuação incompleta", manobras: "necessidade de manobras manuais" };
  const apMap = { hipotir: "hipotiroidismo", dm: "diabetes mellitus", drc: "doença renal crónica", parkinson: "doença de Parkinson", em: "esclerose múltipla", dep: "depressão/ansiedade", neoplasia: "neoplasia conhecida", cir_abd: "cirurgia abdominal prévia" };
  const alarmeMapAguda = { paragem_gases: "paragem de gases e fezes", distensao: "distensão abdominal progressiva", vomitos: "vómitos", rectorragi_ag: "rectorragia aguda abundante", febre_dor: "febre com dor abdominal localizada" };
  const alarmeMapCronica = { massa: "massa abdominal ou rectal palpável", rectorragi_cr: "rectorragia", perda_peso: "perda de peso involuntária", anemia: "anemia ferropénica", alt_transito: "alteração recente e súbita do trânsito", idade50: "início após os 50 anos sem rastreio", hx_familiar: "história familiar de CCR ou DII" };
  const alarmeMap = isCronica ? alarmeMapCronica : alarmeMapAguda;

  // ── NOTA CLÍNICA
  let note = `Doente que recorre por <span class="pos">obstipação ${tipoLabel}</span>.`;
  const alarmesList = alarmesFl.map((a) => alarmeMap[a.val]).filter(Boolean);
  if (alarmesList.length) note += ` <span class="urg">Associa sinais de alarme: ${alarmesList.join(", ")}.</span>`;
  const sxList = sxSafe.map((s) => sxMap[s.val]).filter(Boolean);
  if (sxList.length) note += ` Associa ${sxList.join(", ")}.`;
  if (!alarmesList.length) {
    const negaList = isCronica
      ? ["massa abdominal ou rectal palpável", "rectorragia", "perda de peso involuntária", "anemia ferropénica", "alteração recente e súbita do trânsito"]
      : ["paragem de gases", "distensão abdominal progressiva", "vómitos", "rectorragia abundante", "febre com dor localizada"];
    note += ` <span class="neg">Nega sinais de alarme, nomeadamente: ${negaList.join(", ")}.</span>`;
  }
  if (medsSel.length) note += ` Faz medicação com potencial obstipante: <span class="wa">${medsSel.map((m) => m.split(" (")[0]).join(", ")}</span>.`;
  const apList = apRel.map((a) => apMap[a.val]).filter(Boolean);
  const allAP = [...apList, ...outrosAp];
  if (allAP.length) note += ` AP: <span class="wa">${allAP.join(", ")}</span>.`;
  else note += ` <span class="neg">Sem antecedentes relevantes conhecidos.</span>`;

  const eoNormal = oHas("eo", "normal_eo") || eoSafe.length === 0;
  const defesa = oHas("eo", "defesa");
  const massaEO = oHas("eo", "massa_eo");
  const touqueAlt = oHas("eo", "toque_alt");
  note += " EO: ";
  if (eoNormal && eoFl.length === 0) {
    note += `<span class="neg">Abdómen mole, depressível, indolor, sem massas palpáveis, sem defesa ou peritonismo. Ruídos intestinais presentes.</span>`;
  } else {
    const eoAlts = [];
    if (defesa) eoAlts.push(`<span class="urg">defesa/peritonismo presente</span>`);
    if (massaEO) eoAlts.push(`<span class="urg">massa palpável</span>`);
    if (touqueAlt) eoAlts.push(`<span class="urg">toque rectal alterado</span>`);
    if (oHas("eo", "distensao_eo")) eoAlts.push(`<span class="wa">distensão abdominal</span>`);
    if (oHas("eo", "dor_palp")) eoAlts.push(`<span class="wa">dor à palpação</span>`);
    if (oHas("eo", "ri_alt")) eoAlts.push(`<span class="wa">ruídos intestinais alterados</span>`);
    note += eoAlts.join(", ") + ".";
    if (!defesa && !massaEO) note += ` <span class="neg">Sem defesa ou peritonismo.</span>`;
  }

  // ── EXCLUSÕES
  const excluir = [];
  if (isCronica || tipo === "agravamento") {
    if (oHas("alarme", "massa") || massaEO) excluir.push({ u: "red", name: "Neoplasia colorretal / massa abdominal", sinais: "Massa palpável identificada", action: "TAC abdominopélvica · Referenciação urgente a gastroenterologia / cirurgia" });
    if (oHas("alarme", "rectorragi_cr")) excluir.push({ u: "red", name: "Patologia colorretal grave (neoplasia, DII)", sinais: "Rectorragia", action: "Colonoscopia · Via verde oncológica se >45 anos ou outros sinais de alarme" });
    if (oHas("alarme", "perda_peso") || oHas("alarme", "anemia")) excluir.push({ u: "red", name: "Neoplasia / patologia sistémica grave", sinais: [oHas("alarme", "perda_peso") ? "perda de peso" : "", oHas("alarme", "anemia") ? "anemia ferropénica" : ""].filter(Boolean).join(", "), action: "Hemograma · VS · LDH · CEA · TAC toraco-abdomino-pélvica · Colonoscopia" });
  }
  if (!isCronica) {
    const triade = oHas("alarme", "paragem_gases") || oHas("alarme", "distensao") || oHas("alarme", "vomitos");
    if (triade || defesa) excluir.push({ u: "red", name: "Oclusão intestinal / emergência cirúrgica", sinais: [oHas("alarme", "paragem_gases") ? "paragem de gases e fezes" : "", oHas("alarme", "distensao") ? "distensão abdominal" : "", oHas("alarme", "vomitos") ? "vómitos" : "", defesa ? "defesa/peritonismo" : ""].filter(Boolean).join(", "), action: "Rx abdómen urgente (pé e deitado) · TAC abdominopélvica com contraste · Avaliação cirúrgica urgente" });
    if (oHas("alarme", "rectorragi_ag")) excluir.push({ u: "red", name: "Hemorragia digestiva baixa", sinais: "Rectorragia aguda abundante", action: "Hemograma urgente · Estabilização hemodinâmica · Colonoscopia urgente ou angio-TAC" });
    if (oHas("alarme", "febre_dor")) excluir.push({ u: "orange", name: "Diverticulite aguda / abcesso / apendicite", sinais: "Febre com dor abdominal localizada", action: "Analítica com PCR e leucograma · TAC abdominopélvica" });
  }
  if (medsSel.length) excluir.push({ u: "orange", name: "Causa farmacológica", sinais: "Medicação obstipante: " + medsSel.map((m) => m.split(" (")[0]).join(", "), action: "Avaliar suspensão, redução de dose ou substituição por alternativa" });
  if (oHas("ap_rel", "hipotir")) excluir.push({ u: "orange", name: "Hipotiroidismo", sinais: "Antecedente de hipotiroidismo", action: "TSH · Verificar controlo" });
  if (oHas("ap_rel", "dm")) excluir.push({ u: "orange", name: "Neuropatia autonómica diabética", sinais: "DM conhecida", action: "Glicemia · HbA1c · Avaliar controlo metabólico" });
  if (oHas("ap_rel", "drc")) excluir.push({ u: "orange", name: "Uremia (DRC)", sinais: "DRC conhecida", action: "Creatinina · TFG · Ajuste de medicação" });
  if (oHas("ap_rel", "neoplasia")) excluir.push({ u: "red", name: "Complicação/progressão oncológica", sinais: "Neoplasia conhecida", action: "Contactar equipa de oncologia · Excluir oclusão por neoplasia" });
  if (defesa) excluir.push({ u: "red", name: "Peritonismo · causa cirúrgica", sinais: "Defesa/peritonismo ao EO", action: "TAC urgente com contraste IV · Avaliação cirúrgica imediata" });
  if (touqueAlt) excluir.push({ u: "orange", name: "Impactação fecal / massa rectal", sinais: "Toque rectal alterado", action: "Avaliar impactação · Desimpactação se necessário · Colonoscopia se massa" });

  // ── DIAGNÓSTICOS
  const dx = [];
  if (!excluir.some((e) => e.u === "red")) {
    if (medsSel.length) dx.push({ name: "Obstipação de causa farmacológica", prob: "Medicação obstipante identificada como causa mais provável e mais reversível.", exames: "Revisão da medicação", fazer: "Suspender/substituir/reduzir fármaco causador · Iniciar medidas não farmacológicas · Laxante osmótico se necessário" });
    if (oHas("ap_rel", "hipotir") || oHas("ap_rel", "dm") || oHas("ap_rel", "drc")) dx.push({ name: "Obstipação de causa secundária (metabólica/sistémica)", prob: "Causa secundária identificada nos antecedentes.", exames: "TSH · HbA1c · TFG · Ionograma conforme suspeita", fazer: "Tratar a causa base em paralelo com tratamento sintomático" });
    if (isCronica && !medsSel.length && apRel.length === 0) dx.push({ name: "Obstipação crónica funcional", prob: "Sem causa secundária óbvia identificada. Considerar subtipo funcional.", exames: "Sem exames adicionais inicialmente · Estudo de trânsito e manometria se refratária", fazer: "Medidas não farmacológicas + laxante osmótico (PEG 1ª linha) · Reavaliar em 4-6 semanas" });
    if (!isCronica && !medsSel.length) dx.push({ name: "Obstipação aguda/subaguda de causa situacional", prob: "Novo início sem causa farmacológica ou secundária identificada · possivelmente situacional.", exames: "Analítica se suspeita metabólica (TSH, cálcio, ionograma)", fazer: "Medidas não farmacológicas · Laxante osmótico ou estimulante em SOS · Reavaliar" });
  }

  // ── TRATAMENTO
  const tx = [];
  tx.push({ cat: "Medidas não farmacológicas (sempre primeiro)", items: ["Fibra 20-30g/dia (introduzir gradualmente com hidratação adequada)", "≥1,5-2L de água/dia", "Atividade física ≥150 min/semana", "Reflexo gastrocólico: tentar após refeições · banco para os pés"] });
  if (!excluir.some((e) => e.u === "red")) {
    tx.push({ cat: "Farmacologia 1ª linha (se sem resposta a não farmacológico)", items: ["PEG (Macrogol): 1-3 saquetas/dia, ex: ao pequeno-almoço", "Alternativa: Óxido de magnésio 400-500mg/dia (evitar em DRC)"] });
    tx.push({ cat: "Farmacologia 2ª linha (resgate ou curto prazo)", items: ["Bisacodilo 5-10mg ao deitar (efeito em 6-12h)", "Sene 8,6-17,2mg ao deitar", "Usar <4 semanas ou intermitentemente"] });
  }

  return { note, excluir, dx, tx };
}
