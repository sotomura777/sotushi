// ============================================================================
// LÓGICA DA GSA (gasimetria arterial) — interpretação ácido-base.
// Raciocínio e fórmulas portados EXATAMENTE do módulo original.
// Os valores de referência e textos vêm de /conteudo/analises/gsa.json (R, T).
// Funções puras: recebem os valores e as referências; não tocam no DOM.
// ============================================================================

export function getFiO2(opts) {
  if (opts.suporte === "o2") {
    const l = parseFloat(opts.o2l);
    return !Number.isNaN(l) ? Math.min(100, 21 + l * 4) : 21;
  }
  if (opts.suporte === "vm") {
    const f = parseFloat(opts.fio2pct);
    return !Number.isNaN(f) ? f : 21;
  }
  return 21;
}

export function getSupLabel(opts) {
  if (opts.suporte === "o2") return opts.o2l ? "O₂ " + opts.o2l + "L" : "AA";
  if (opts.suporte === "vm") return opts.fio2pct ? "VM FiO₂ " + opts.fio2pct + "%" : "VM";
  return "AA";
}

function nivel(corpo) {
  if (/grave|choque|crítica/.test(corpo)) return "danger";
  if (/[Ee]levado|concomitante|comprometida|hipoxémia/.test(corpo)) return "warning";
  return "ok";
}

// v: {ph,pco2,po2,hco3,lact,na,k,cl,gli,ca,...}  opts:{idade,suporte,o2l,fio2pct}
// R: referencias   T: textos
export function interpretarGSA(v, opts, R, T) {
  const { ph, pco2, po2, hco3, lact, na, k, cl, gli, ca } = v;
  if (ph == null || pco2 == null || hco3 == null) {
    return { erro: "Precisa pelo menos pH, pCO₂ e HCO₃⁻" };
  }
  const idade = opts.idade || 50;
  const fio2 = getFiO2(opts);
  const supLabel = getSupLabel(opts);
  const passos = [];
  let dist = "";

  // STEP 1 — pH
  let s1 = "";
  if (ph < R.ph.min) {
    s1 = "Acidémia (pH " + ph.toFixed(2) + ")";
    if (hco3 < R.hco3.min) { dist = "acid_met"; s1 += ". Acidose metabólica (HCO₃⁻ " + hco3.toFixed(1) + ")."; }
    else if (pco2 > R.pco2.max) { dist = "acid_resp"; s1 += ". Acidose respiratória (pCO₂ " + pco2.toFixed(1) + ")."; }
    else { dist = "acid_mista"; s1 += ". Distúrbio misto provável."; }
  } else if (ph > R.ph.max) {
    s1 = "Alcalémia (pH " + ph.toFixed(2) + ")";
    if (hco3 > R.hco3.max) { dist = "alc_met"; s1 += ". Alcalose metabólica (HCO₃⁻ " + hco3.toFixed(1) + ")."; }
    else if (pco2 < R.pco2.min) { dist = "alc_resp"; s1 += ". Alcalose respiratória (pCO₂ " + pco2.toFixed(1) + ")."; }
    else { dist = "alc_mista"; s1 += ". Distúrbio misto provável."; }
  } else {
    s1 = "pH " + ph.toFixed(2) + " — normal (" + R.ph.min + "–" + R.ph.max + ").";
    if (hco3 < R.hco3.min && pco2 < R.pco2.min) { dist = "comp"; s1 += " Distúrbio compensado (HCO₃⁻↓ + pCO₂↓)."; }
    else if (hco3 > R.hco3.max && pco2 > R.pco2.max) { dist = "comp"; s1 += " Distúrbio compensado (HCO₃⁻↑ + pCO₂↑)."; }
    else s1 += " Sem alterações ácido-base.";
  }
  passos.push({ titulo: "1. O que mostra o pH?", corpo: s1 });

  // STEP 2 — compensação
  let s2 = "";
  if (dist === "acid_met") {
    const e = 1.5 * hco3 + 8;
    s2 = "Fórmula de Winter: pCO₂ esperado = " + e.toFixed(1) + " (±2). Medido: " + pco2.toFixed(1) + ". ";
    if (pco2 > e + 2) s2 += "pCO₂ acima → acidose respiratória concomitante.";
    else if (pco2 < e - 2) s2 += "pCO₂ abaixo → alcalose respiratória concomitante.";
    else s2 += "Compensação adequada.";
  } else if (dist === "alc_met") {
    const e = 0.7 * hco3 + 21;
    s2 = "pCO₂ esperado = " + e.toFixed(1) + " (±2). Medido: " + pco2.toFixed(1) + ". ";
    if (pco2 > e + 2) s2 += "Acidose respiratória concomitante.";
    else if (pco2 < e - 2) s2 += "Alcalose respiratória concomitante.";
    else s2 += "Compensação adequada.";
  } else if (dist === "acid_resp") {
    const hA = 24 + (pco2 - 40) * 0.1, hC = 24 + (pco2 - 40) * 0.35;
    s2 = "Aguda: HCO₃⁻ esperado=" + hA.toFixed(1) + ". Crónica: " + hC.toFixed(1) + ". Medido: " + hco3.toFixed(1) + ". ";
    if (Math.abs(hco3 - hA) <= 2) s2 += "Compatível com aguda.";
    else if (Math.abs(hco3 - hC) <= 2) s2 += "Compatível com crónica.";
    else if (hco3 > hC + 2) s2 += "Alcalose metabólica concomitante.";
    else s2 += "Distúrbio misto.";
  } else if (dist === "alc_resp") {
    const hA = 24 - (40 - pco2) * 0.2, hC = 24 - (40 - pco2) * 0.5;
    s2 = "Aguda: HCO₃⁻ esperado=" + hA.toFixed(1) + ". Crónica: " + hC.toFixed(1) + ". Medido: " + hco3.toFixed(1) + ". ";
    if (Math.abs(hco3 - hA) <= 2) s2 += "Compatível com aguda.";
    else if (Math.abs(hco3 - hC) <= 2) s2 += "Compatível com crónica.";
    else if (hco3 < hC - 2) s2 += "Acidose metabólica concomitante.";
    else s2 += "Distúrbio misto.";
  }
  if (s2) passos.push({ titulo: "2. O corpo está a compensar?", corpo: s2 });

  // STEP 3 — anion gap
  if (na != null && cl != null) {
    const ag = na - (cl + hco3);
    let s3 = "AG = " + ag.toFixed(1) + " (normal " + R.anionGap.min + "-" + R.anionGap.max + "). ";
    if (ag > R.anionGap.max) {
      s3 += "Elevado → " + T.mudpiles + ".";
      const dd = (ag - 12) / (24 - hco3);
      if (!Number.isNaN(dd) && Number.isFinite(dd)) {
        s3 += " Δ/Δ: " + dd.toFixed(2);
        if (dd > 2) s3 += " → alcalose metabólica concomitante.";
        else if (dd < 1) s3 += " → acidose hiperclorrémica concomitante.";
        else s3 += " → acidose AG pura.";
      }
    } else {
      s3 += "Normal.";
      if (dist === "acid_met") s3 += " Acidose sem AG elevado → hiperclorrémica (perdas GI, acidose tubular renal, NaCl 0.9%).";
    }
    passos.push({ titulo: "3. Anion gap", corpo: s3 });
  }

  // STEP 4 — oxigenação
  if (po2 != null) {
    const pAO2 = (fio2 / 100) * (760 - 47) - (pco2 / 0.8);
    const aa = pAO2 - po2;
    const aaN = (idade / 4) + 4;
    const pf = po2 / (fio2 / 100);
    let s4 = "";
    if (opts.suporte === "aa") {
      s4 += "Em ar ambiente (FiO₂ 21%). ";
      if (po2 < R.po2.hipoxemia) s4 += "pO₂ " + po2.toFixed(1) + " — hipoxémia. ";
      else if (po2 < R.po2.limite) s4 += "pO₂ " + po2.toFixed(1) + " — limite inferior. ";
      else s4 += "pO₂ " + po2.toFixed(1) + " — normal. ";
    } else {
      s4 += "Com suporte (" + supLabel + ", FiO₂ ≈" + fio2.toFixed(0) + "%). pO₂ " + po2.toFixed(1) + ". ";
      if (pf < R.pf.ardsLigeiro) s4 += "Oxigenação gravemente comprometida apesar do suporte. ";
      else if (pf < R.pf.normal) s4 += "Oxigenação comprometida. ";
    }
    s4 += "P/F = " + pf.toFixed(0);
    if (pf > R.pf.normal) s4 += " (normal).";
    else if (pf > R.pf.ardsLigeiro) s4 += " (ARDS ligeiro).";
    else if (pf > R.pf.ardsModerado) s4 += " (ARDS moderado).";
    else s4 += " (ARDS grave).";
    s4 += " Gradiente A-a = " + aa.toFixed(1) + " (esperado ≤" + aaN.toFixed(0) + "). ";
    if (aa > aaN + 5) s4 += "Elevado → problema de troca (pneumonia, TEP, fibrose, edema pulmonar).";
    else s4 += "Normal → se hipoxémico: hipoventilação.";
    passos.push({ titulo: "4. Como está a oxigenação?", corpo: s4 });
  }

  // STEP 5 — lactato
  if (lact != null) {
    let sL = "Lactato: " + lact.toFixed(2) + " mmol/L. ";
    if (lact > R.lactato.alarme) sL += "Hipoperfusão significativa → pensar choque.";
    else if (lact > R.lactato.vigiar) sL += "Elevado → monitorizar. Causas: hipoperfusão, convulsões, hepatopatia, metformina.";
    else sL += "Normal.";
    passos.push({ titulo: "5. Lactato", corpo: sL });
  }

  // Electrólitos / metabolitos
  const sE = [];
  if (k != null) {
    if (k > R.k.alto) sE.push("K⁺ " + k.toFixed(2) + " — hipercaliémia" + (k > R.k.criticoAlto ? " crítica (ECG)" : ""));
    else if (k < R.k.baixo) sE.push("K⁺ " + k.toFixed(2) + " — hipocaliémia" + (k < R.k.criticoBaixo ? " crítica" : ""));
  }
  if (na != null) {
    if (na < R.na.baixo) sE.push("Na⁺ " + na.toFixed(0) + " — hiponatrémia" + (na < R.na.grave ? " grave" : ""));
    else if (na > R.na.alto) sE.push("Na⁺ " + na.toFixed(0) + " — hipernatrémia");
  }
  if (ca != null) {
    if (ca < R.ca.baixo) sE.push("Ca²⁺ " + ca.toFixed(2) + " — hipocalcémia");
    else if (ca > R.ca.alto) sE.push("Ca²⁺ " + ca.toFixed(2) + " — hipercalcémia");
  }
  if (gli != null) {
    if (gli > R.glicose.alto) sE.push("Glicose " + gli.toFixed(0) + " — hiperglicémia");
    else if (gli < R.glicose.baixo) sE.push("Glicose " + gli.toFixed(0) + " — hipoglicémia");
  }
  if (sE.length) passos.push({ titulo: "Electrólitos / Metabolitos", corpo: sE.join(". ") + "." });

  // Diagnóstico
  let dx = "";
  if (dist === "acid_met") { dx = "Acidose metabólica"; if (s2.indexOf("adequada") >= 0) dx += " com compensação respiratória adequada"; else if (s2.indexOf("concomitante") >= 0) dx += " + distúrbio respiratório concomitante"; }
  else if (dist === "acid_resp") { dx = "Acidose respiratória"; if (s2.indexOf("aguda") >= 0) dx += " (provável aguda)"; else if (s2.indexOf("crónica") >= 0) dx += " (provável crónica)"; }
  else if (dist === "alc_met") { dx = "Alcalose metabólica"; if (s2.indexOf("adequada") >= 0) dx += " com compensação respiratória adequada"; }
  else if (dist === "alc_resp") { dx = "Alcalose respiratória"; if (s2.indexOf("aguda") >= 0) dx += " (provável aguda)"; else if (s2.indexOf("crónica") >= 0) dx += " (provável crónica)"; }
  else if (dist === "comp") dx = "Distúrbio misto compensado";
  else dx = "Sem alterações ácido-base — GSA normal";

  passos.forEach((p) => (p.nivel = nivel(p.corpo)));

  return { dx, dist, passos, fio2, supLabel, resumo: { ph, pco2, hco3, lact, po2 } };
}
