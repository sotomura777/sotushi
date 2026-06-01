// ============================================================================
// LÓGICA — Algoritmo da Obstipação (porte EXATO do scoring + genNote do HTML).
// Funções puras sobre o estado D; tabelas/planos/textos vêm de @conteudo.
// ============================================================================
import dados from "@conteudo/urgencia/obstipacao-algoritmo.json";

const { sintomas: SYMS, alarmesCronicos: ALMS, alarmesAgudos: ACUT, farmacosClasses: DRGCLS,
  antecedentes: ANTS, toqueRectal: TROPT, analitica: ANALY, bristol: BRIS,
  imgRx: IMG_RX, imgTc: IMG_TC, colRes: COL_RES, quadranteNome: QNOME, diagnosticos: DXM } = dados;

// ── Estado inicial (espelha o objecto D do original) ────────────────────────
export function estadoInicial() {
  return {
    step: 0, ctx: "", sexo: "", idade: "", unst: null, uDet: [], unstAct: [],
    dur: "", durT: "", frq: "", frqDias: "", bri: "", gas: null, gasDias: "", sym: [], alm: [], acu: [], recTipo: null,
    cDr: [], nDr: false, dTg: [], ant: [], nAn: false, aTg: [], hxFam: { ccr: false, dii: false, det: "" },
    agu: "", exe: null, fib: null, rep: null, tab: null,
    eg: { v: true, o: true, c: true }, muc: [], acr: { r: null, f: null, s: null }, apr: { mv: null, ra: [] },
    abd: [], rha: [], distGr: null, trO: false, trF: [], mi: { ed: false, tvp: false },
    sv: { pa: "", fc: "", temp: "", spo2: "" }, abdQ: null,
    pvT: null, anR: {}, anV: {}, anSel: [], rxR: [], tcR: null, colR: null, act: [], plN: "",
    nEdit: false, nTxt: "",
  };
}

// ── Helpers (espelham os do original) ───────────────────────────────────────
const has = (a, v) => a.indexOf(v) >= 0;
export const isSU = (D) => D.ctx === "acamado";
export const mxS = (D) => (isSU(D) ? 10 : 9);
export const eStep = (D) => (isSU(D) ? D.step : (D.step === 0 ? 0 : D.step + 1));
export const anyAlm = (D) => D.alm.length > 0 || D.acu.length > 0 || has(D.abd, "defesa") || has(D.abd, "massa") || has(D.trF, "mre") || has(D.trF, "str");
export function hasDrCls(D, cls) {
  return D.cDr.some((d) => { const c = DRGCLS.filter((x) => x.drugs.indexOf(d) >= 0); return c.length && c[0].cls === cls; });
}
export function getDrCls(drug) {
  const c = DRGCLS.filter((x) => x.drugs.indexOf(drug) >= 0); return c.length ? c[0].cls : "Outro";
}
const numK = (D, k) => (D.anV[k] ? parseFloat(D.anV[k].replace(",", ".")) : NaN);

// ── Motor de scoring (14 diagnósticos, pesos e thresholds exatos) ───────────
export function pontuar(D) {
  const age50 = parseInt(D.idade) >= 50;
  const hasFec = has(D.trF, "fec");
  const hasFdu = has(D.trF, "fdu");
  const hasObstr = has(D.acu, "par") || has(D.acu, "tri") || has(D.rha, "aus") || has(D.rha, "met") || D.gas === "aus";
  const hasMassa = has(D.alm, "mas") || has(D.abd, "massa") || has(D.trF, "mre");
  const isEmerg = isSU(D) && D.unst;
  const bris12 = D.bri === "1" || D.bri === "2";
  const hasFebre = D.sv.temp && parseFloat(D.sv.temp.replace(",", ".")) >= 37.5;
  const dx = [];

  // 1. EMERGÊNCIA CIRÚRGICA
  let scEmerg = 0; const rEmerg = [];
  if (has(D.abd, "defesa")) { scEmerg += 10; rEmerg.push("peritonismo/defesa"); }
  if (isEmerg) { scEmerg += 8; rEmerg.push("instabilidade hemodinâmica"); }
  if (has(D.sym, "vfc") || has(D.acu, "vfc2")) { scEmerg += 10; rEmerg.push("vómitos fecalóides"); }
  if (has(D.acu, "rab")) { scEmerg += 8; rEmerg.push("rectorragia abundante"); }
  if (has(D.abd, "defesa") && hasFebre) { scEmerg += 3; rEmerg.push("peritonismo + febre"); }
  if (!D.eg.c || !D.eg.v) { scEmerg += 3; rEmerg.push("alt. consciência"); }
  const paLow = D.sv.pa && parseInt(D.sv.pa) < 90;
  if (numK(D, "K") > 5.0) { scEmerg += 2; rEmerg.push("hipercaliemia (risco arritmia)"); }
  if (paLow) { scEmerg += 3; rEmerg.push("PA <90 mmHg"); }
  if (scEmerg > 0) dx.push({ id: "emerg", sc: scEmerg, r: rEmerg, plano: has(D.abd, "defesa") ? DXM.emerg.planoDefesa : DXM.emerg.planoSemDefesa });

  // 2. OBSTRUÇÃO INTESTINAL
  let scObs = 0; const rObs = [];
  if (has(D.acu, "par")) { scObs += 5; rObs.push("paragem de gases e fezes"); }
  if (has(D.acu, "tri")) { scObs += 5; rObs.push("tríade oclusiva"); }
  if (has(D.rha, "met")) { scObs += 4; rObs.push("RHA metálicos"); }
  if (has(D.rha, "aus")) { scObs += 4; rObs.push("RHA ausentes"); }
  if (D.gas === "aus") { scObs += 3; rObs.push("ausência de gases" + (D.gasDias ? " há " + D.gasDias + " dias" : "")); }
  if (has(D.abd, "dist") && (has(D.sym, "vma") || has(D.sym, "vbi"))) { scObs += 3; rObs.push("distensão + vómitos"); }
  if (has(D.sym, "vbi")) { scObs += 2; rObs.push("vómitos biliares (obstrução?)"); }
  if (has(D.rha, "dim")) { scObs += 2; rObs.push("RHA diminuídos"); }
  if (D.distGr === "marcada") { scObs += 2; rObs.push("distensão marcada"); }
  if (has(D.ant, "cir") && D.dur === "aguda") { scObs += 2; rObs.push("cirurgia abdominal prévia"); }
  if (has(D.sym, "vfc") || has(D.acu, "vfc2")) { scObs += 3; rObs.push("vómitos fecalóides"); }
  if (has(D.ant, "neo")) { scObs += 2; rObs.push("neoplasia colorretal prévia"); }
  if (has(D.ant, "dii")) { scObs += 1; rObs.push("DII (estenoses?)"); }
  if (has(D.sym, "nau")) { scObs += 1; rObs.push("náuseas"); }
  if (has(D.sym, "vma")) { scObs += 1; rObs.push("vómitos alimentares"); }
  if (has(D.abd, "timp")) { scObs += 1; rObs.push("timpanismo"); }
  if (!has(D.acu, "par") && D.gas !== "aus") { scObs -= 3; rObs.push("sem paragem gases"); }
  if (!has(D.abd, "dist")) { scObs -= 2; rObs.push("sem distensao"); }
  if (has(D.rha, "pres") && !has(D.rha, "met") && !has(D.rha, "aus") && !has(D.rha, "dim")) { scObs -= 2; rObs.push("RHA normais"); }
  if (scObs >= 3) dx.push({ id: "obstr", sc: scObs, r: rObs, plano: DXM.obstr.plano });

  // 2b. ÍLEUS PARALÍTICO / PSEUDO-OBSTRUÇÃO
  let scIle = 0; const rIle = [];
  if (has(D.rha, "aus")) { scIle += 4; rIle.push("RHA ausentes"); }
  if (has(D.rha, "dim")) { scIle += 3; rIle.push("RHA diminuídos"); }
  if (!has(D.rha, "met")) { scIle += 2; rIle.push("sem RHA metálicos"); }
  if (isSU(D)) { scIle += 3; rIle.push("acamado/internado"); }
  if (has(D.ant, "cir")) { scIle += 3; rIle.push("cirurgia abdominal (pós-operatório?)"); }
  if (hasDrCls(D, "Opióides")) { scIle += 2; rIle.push("opióides"); }
  if (hasDrCls(D, "Anticolinérgicos")) { scIle += 1; rIle.push("anticolinérgicos"); }
  if (has(D.abd, "dist")) { scIle += 1; rIle.push("distensão"); }
  if (D.distGr === "marcada") { scIle += 1; rIle.push("distensão marcada"); }
  if (numK(D, "K") < 3.5) { scIle += 2; rIle.push("hipocaliemia"); }
  if (numK(D, "Ca") > 10.5) { scIle += 1; rIle.push("hipercalcemia"); }
  if (has(D.sym, "nau")) { scIle += 1; rIle.push("náuseas"); }
  if (!has(D.acu, "par")) { scIle += 1; rIle.push("sem paragem completa"); }
  if (has(D.rha, "met")) { scIle -= 4; rIle.push("RHA metalicos = mecanica, nao ileus"); }
  if (!isSU(D) && !has(D.ant, "cir") && !hasDrCls(D, "Opióides")) { scIle -= 3; rIle.push("sem contexto tipico (internado/cirurgia/opioides)"); }
  if (has(D.rha, "pres") && !has(D.rha, "aus") && !has(D.rha, "dim")) { scIle -= 3; rIle.push("RHA presentes normais"); }
  if (scIle >= 5) dx.push({ id: "ileus", sc: scIle, r: rIle, plano: DXM.ileus.plano });

  // 3. FECALOMA
  let scFec = 0; const rFec = [];
  if (hasFec) { scFec += 6; rFec.push("fecaloma ao toque rectal"); }
  if (hasFdu) { scFec += 3; rFec.push("fezes duras na ampola"); }
  if (has(D.trF, "ach")) { scFec += 2; rFec.push("ampola cheia"); }
  if (isSU(D)) { scFec += 2; rFec.push("doente acamado/internado"); }
  if (hasDrCls(D, "Opióides")) { scFec += 2; rFec.push("opióides"); }
  if (D.frq.indexOf("Não evacua") >= 0) { scFec += 2; rFec.push("não evacua há dias"); }
  if (has(D.abd, "dist")) { scFec += 1; rFec.push("distensão"); }
  if (D.distGr === "marcada") { scFec += 1; rFec.push("distensão marcada"); }
  if (has(D.rha, "dim")) { scFec += 1; rFec.push("RHA diminuídos"); }
  if (D.exe === "sedentario") { scFec += 1; rFec.push("sedentário"); }
  if (parseInt(D.idade) >= 70) { scFec += 1; rFec.push("idade ≥70"); }
  if (hasDrCls(D, "Anticolinérgicos")) { scFec += 1; rFec.push("anticolinérgicos"); }
  if (hasDrCls(D, "Bloq. canais cálcio")) { scFec += 1; rFec.push("BCC"); }
  if (hasDrCls(D, "Ferro oral")) { scFec += 1; rFec.push("ferro oral"); }
  if (has(D.ant, "hip")) { scFec += 1; rFec.push("hipotiroidismo"); }
  if (has(D.ant, "drc")) { scFec += 1; rFec.push("DRC"); }
  if (has(D.ant, "lm")) { scFec += 2; rFec.push("lesão medular"); }
  if (has(D.ant, "prk")) { scFec += 1; rFec.push("D. Parkinson"); }
  if (!D.eg.c || !D.eg.v) { scFec += 1; rFec.push("alt. consciência (não reporta)"); }
  if (has(D.sym, "icf")) { scFec += 2; rFec.push("incontinência (overflow?)"); }
  if (isSU(D) && has(D.sym, "dia")) { scFec += 2; rFec.push("diarreia em internado (overflow?)"); }
  if (D.trO && !has(D.trF, "fec") && !has(D.trF, "fdu") && !has(D.trF, "ach")) { scFec -= 4; rFec.push("TR normal (sem fecaloma/fezes duras/ampola cheia)"); }
  if (!isSU(D) && !hasDrCls(D, "Opióides") && parseInt(D.idade) < 70) { scFec -= 2; rFec.push("sem contexto tipico"); }
  if (scFec >= 3) dx.push({ id: "fecal", sc: scFec, r: rFec, plano: hasFec ? DXM.fecal.planoComFecaloma : DXM.fecal.planoSemFecaloma });

  // 4. NEOPLASIA (suspeita)
  let scNeo = 0; const rNeo = [];
  if (has(D.trF, "mre")) { scNeo += 8; rNeo.push("massa rectal ao TR"); }
  if (has(D.abd, "massa")) { scNeo += 6; rNeo.push("massa abdominal palpável"); }
  if (has(D.alm, "ppe")) { scNeo += 4; rNeo.push("perda ponderal >5%"); }
  if (has(D.alm, "afe")) { scNeo += 3; rNeo.push("anemia ferropénica"); }
  if (has(D.alm, "rec") && D.recTipo === "hqz") { scNeo += 2; rNeo.push("hematoquézias"); }
  if (has(D.alm, "rec") && D.recTipo === "sof") { scNeo += 3; rNeo.push("sangue oculto +"); }
  if (has(D.sym, "ano") && has(D.alm, "ppe")) { scNeo += 2; rNeo.push("anorexia + perda peso"); }
  if (has(D.alm, "atr") && age50) { scNeo += 2; rNeo.push("alt. trânsito recente >50a"); }
  if (D.hxFam.ccr) { scNeo += 2; rNeo.push("hx familiar CCR"); }
  if (has(D.sym, "ten")) { scNeo += 2; rNeo.push("tenesmo (massa rectal?)"); }
  if (has(D.ant, "dii")) { scNeo += 1; rNeo.push("DII (factor risco CCR)"); }
  if (age50 && D.dur === "cronica" && !anyAlm(D)) { scNeo += 1; rNeo.push("obstipação de novo >50"); }
  if (D.recTipo === "mel") { scNeo += 2; rNeo.push("melenas (cólon direito?)"); }
  if (has(D.sym, "sli")) { scNeo += 1; rNeo.push("sangue ao limpar recorrente"); }
  if (has(D.sym, "ano")) { scNeo += 1; rNeo.push("anorexia"); }
  if (has(D.sym, "ppni")) { scNeo += 1; rNeo.push("perda peso (sub-5%)"); }
  if (has(D.abd, "organo")) { scNeo += 1; rNeo.push("organomegália (metástases?)"); }
  if (age50 && (D.bri === "5" || D.bri === "6" || D.bri === "7")) { scNeo += 1; rNeo.push("diarreia em >50 anos"); }
  if (has(D.muc, "desc")) { scNeo += 1; rNeo.push("mucosas descoradas (anemia?)"); }
  if (!hasMassa && !has(D.alm, "rec") && !has(D.alm, "afe") && !has(D.alm, "ppe") && !has(D.trF, "str")) { scNeo -= 3; rNeo.push("sem massa/sangue/perda peso"); }
  if (parseInt(D.idade) < 40 && !D.hxFam.ccr) { scNeo -= 2; rNeo.push("jovem sem hx familiar"); }
  if (scNeo >= 4) dx.push({ id: "neo", sc: scNeo, r: rNeo, plano: (has(D.alm, "rec") && D.recTipo === "mel") ? DXM.neo.planoMelenas : DXM.neo.planoColono });

  // 4b. ISQUEMIA INTESTINAL
  let scIsq = 0; const rIsq = [];
  if (has(D.abd, "defesa")) { scIsq += 4; rIsq.push("peritonismo"); }
  if (has(D.rha, "aus")) { scIsq += 3; rIsq.push("RHA ausentes"); }
  if (hasFebre) { scIsq += 2; rIsq.push("febre"); }
  if (has(D.sym, "feb")) { scIsq += 2; rIsq.push("febre"); }
  if (D.acr.f === "taq") { scIsq += 1; rIsq.push("taquicardia"); }
  if (has(D.abd, "dor") && D.abdQ) { scIsq += 1; rIsq.push("dor localizada"); }
  if (has(D.muc, "desc")) { scIsq += 1; rIsq.push("mucosas descoradas"); }
  if (age50) { scIsq += 1; rIsq.push(">50 anos"); }
  if (parseInt(D.idade) >= 70) { scIsq += 1; rIsq.push(">70 anos"); }
  if (D.acr.r === "arr") { scIsq += 3; rIsq.push("arritmia/FA (risco embolismo)"); }
  if (has(D.ant, "fa")) { scIsq += 3; rIsq.push("FA nos antecedentes"); }
  if (has(D.ant, "hta")) { scIsq += 1; rIsq.push("HTA"); }
  if (has(D.ant, "dm")) { scIsq += 1; rIsq.push("diabetes"); }
  if (has(D.ant, "dlp")) { scIsq += 1; rIsq.push("dislipidemia"); }
  if (has(D.ant, "dap")) { scIsq += 2; rIsq.push("doença arterial periférica"); }
  if (D.tab === "sim") { scIsq += 2; rIsq.push("tabagismo activo"); }
  if (has(D.alm, "rec") && D.recTipo === "hqz") { scIsq += 1; rIsq.push("hematoquézias (isquemia pode sangrar)"); }
  if (!has(D.sym, "dab") && !has(D.abd, "dor")) { scIsq -= 6; rIsq.push("SEM dor abdominal (muito improvavel)"); }
  if (!has(D.ant, "fa") && D.acr.r !== "arr" && !has(D.ant, "hta") && !has(D.ant, "dm") && !has(D.ant, "dlp") && !has(D.ant, "dap") && D.tab !== "sim") { scIsq -= 4; rIsq.push("sem factores risco vasculares"); }
  if (!has(D.rha, "aus")) { scIsq -= 2; rIsq.push("RHA nao ausentes"); }
  if (scIsq >= 5) dx.push({ id: "isquemia", sc: scIsq, r: rIsq, plano: DXM.isquemia.plano });

  // 4c. PERITONITE
  let scPer = 0; const rPer = [];
  if (has(D.abd, "defesa")) { scPer += 5; rPer.push("defesa/peritonismo"); }
  if (hasFebre || has(D.sym, "feb")) { scPer += 3; rPer.push("febre"); }
  if (has(D.rha, "aus")) { scPer += 3; rPer.push("RHA ausentes"); }
  if (D.acr.f === "taq") { scPer += 1; rPer.push("taquicardia"); }
  if (isEmerg) { scPer += 2; rPer.push("instável"); }
  if (scPer >= 6 && !has(D.abd, "defesa")) scPer = 0; // peritonite precisa de defesa
  if (scPer >= 6) dx.push({ id: "perit", sc: scPer, r: rPer, plano: DXM.perit.plano });

  // 5. DIVERTICULITE
  let scDiv = 0; const rDiv = [];
  if (D.abdQ === "fie") { scDiv += 3; rDiv.push("dor na FIE"); }
  if (has(D.sym, "feb") || has(D.acu, "fed") || hasFebre) { scDiv += 3; rDiv.push("febre"); }
  if (D.dur === "aguda") { scDiv += 1; rDiv.push("aguda"); }
  if (age50) { scDiv += 1; rDiv.push(">50 anos"); }
  if (D.abdQ === "fie" && has(D.abd, "defesa")) { scDiv += 2; rDiv.push("defesa na FIE (complicada?)"); }
  if (D.abdQ !== "fie" && !has(D.abd, "dor")) { scDiv -= 4; rDiv.push("sem dor FIE (quase exclui)"); }
  if (!hasFebre && !has(D.sym, "feb") && !has(D.acu, "fed")) { scDiv -= 2; rDiv.push("sem febre"); }
  if (scDiv >= 4) dx.push({ id: "divert", sc: scDiv, r: rDiv, plano: DXM.divert.plano });

  // 6. DISSINERGIA PÉLVICA
  let scDis = 0; const rDis = [];
  if (has(D.sym, "man")) { scDis += 4; rDis.push("manobras digitais"); }
  if (has(D.sym, "blq")) { scDis += 4; rDis.push("bloqueio anorrectal"); }
  if (has(D.trF, "tau")) { scDis += 3; rDis.push("tónus aumentado ao TR"); }
  if (has(D.sym, "inc")) { scDis += 2; rDis.push("evacuação incompleta"); }
  if (has(D.trF, "ach")) { scDis += 1; rDis.push("ampola cheia"); }
  if (D.dur === "cronica") { scDis += 1; rDis.push("crónica"); }
  if (has(D.sym, "esf")) { scDis += 1; rDis.push("esforço evacuatório"); }
  if (has(D.sym, "dev")) { scDis += 1; rDis.push("dor ao evacuar"); }
  if (D.rep === "sim") { scDis += 1; rDis.push("reprime urgência"); }
  if (D.sexo === "F") { scDis += 1; rDis.push("sexo feminino (mais frequente)"); }
  if (!has(D.sym, "man") && !has(D.sym, "blq")) { scDis -= 3; rDis.push("sem manobras digitais/bloqueio"); }
  if (has(D.trF, "avz")) { scDis -= 2; rDis.push("ampola vazia = problema proximal, nao pelvico"); }
  if (scDis >= 4) dx.push({ id: "dissin", sc: scDis, r: rDis, plano: DXM.dissin.plano });

  // 7. SII-O
  let scSII = 0; const rSII = [];
  if (has(D.sym, "dab")) { scSII += 3; rSII.push("dor abdominal"); }
  if (has(D.sym, "alt")) { scSII += 3; rSII.push("alternância diarreia/obstipação"); }
  if (has(D.sym, "dis")) { scSII += 2; rSII.push("distensão"); }
  if (has(D.sym, "fla")) { scSII += 1; rSII.push("flatulência"); }
  if (D.gas === "aum") { scSII += 1; rSII.push("gases aumentados"); }
  if (D.dur === "cronica") { scSII += 1; rSII.push("crónica"); }
  if (!anyAlm(D)) { scSII += 2; rSII.push("sem alarmes"); }
  if (has(D.sym, "enf")) { scSII += 1; rSII.push("enfartamento"); }
  if (parseInt(D.idade) < 40) { scSII += 1; rSII.push("jovem (<40 anos)"); }
  if (!has(D.sym, "dab")) { scSII -= 3; rSII.push("sem dor abdominal (obrigatoria Roma IV)"); }
  if (D.dur === "aguda") { scSII -= 3; rSII.push("aguda (SII e cronico)"); }
  if (anyAlm(D)) { scSII -= 3; rSII.push("tem sinais alarme"); }
  if (scSII >= 5) dx.push({ id: "sii", sc: scSII, r: rSII, plano: DXM.sii.plano });

  // 8. OBSTIPAÇÃO FUNCIONAL
  let scFunc = 0; const rFunc = [];
  if (D.dur === "cronica") { scFunc += 2; rFunc.push("crónica"); }
  if (bris12) { scFunc += 2; rFunc.push("Bristol 1-2"); }
  if (has(D.sym, "esf")) { scFunc += 2; rFunc.push("esforço evacuatório"); }
  if (D.frq && D.frq !== "1x/dia" && D.frq !== "1x/2 dias") { scFunc += 1; rFunc.push("frequência reduzida"); }
  if (!anyAlm(D)) { scFunc += 2; rFunc.push("sem alarmes"); }
  if (D.exe === "sedentario") { scFunc += 1; rFunc.push("sedentário"); }
  if (D.fib === "nao") { scFunc += 1; rFunc.push("fibra insuficiente"); }
  if (D.rep === "sim") { scFunc += 1; rFunc.push("reprime urgência"); }
  if (has(D.sym, "inc")) { scFunc += 1; rFunc.push("evacuação incompleta"); }
  if (D.agu && parseFloat(D.agu.replace(",", ".")) < 1.5) { scFunc += 1; rFunc.push("hidratação insuficiente"); }
  if (scFunc >= 3) dx.push({ id: "func", sc: scFunc, r: rFunc, plano: DXM.func.plano });

  // 9. CAUSA MEDICAMENTOSA
  let scMed = 0; const rMed = [];
  if (hasDrCls(D, "Opióides")) { scMed += 4; rMed.push("opióides (receptores µ → reduzem peristaltismo)"); }
  if (hasDrCls(D, "Antidepressivos tricíclicos")) { scMed += 3; rMed.push("ADT (anticolinérgico → reduz contracções)"); }
  if (hasDrCls(D, "Anticolinérgicos")) { scMed += 3; rMed.push("anticolinérgicos (bloqueiam acetilcolina)"); }
  if (hasDrCls(D, "Bloq. canais cálcio")) { scMed += 2; rMed.push("BCC (reduzem contratilidade muscular)"); }
  if (hasDrCls(D, "Ferro oral")) { scMed += 2; rMed.push("ferro oral (altera flora, irrita mucosa)"); }
  if (hasDrCls(D, "Antipsicóticos")) { scMed += 2; rMed.push("antipsicóticos (anticolinérgico + sedação)"); }
  if (hasDrCls(D, "Anti-parkinsónicos")) { scMed += 2; rMed.push("anti-parkinsónicos"); }
  if (hasDrCls(D, "Suplementos de cálcio")) { scMed += 1; rMed.push("cálcio (reduz excitabilidade muscular)"); }
  if (hasDrCls(D, "Antidiarreicos")) { scMed += 2; rMed.push("loperamida (receptores µ intestinais)"); }
  if (hasDrCls(D, "Outros")) { scMed += 1; rMed.push("outros fármacos obstipantes"); }
  if (scMed >= 2 && !hasFec && !hasObstr) dx.push({ id: "medic", sc: scMed, r: rMed, plano: DXM.medic.plano });

  // 10. CAUSA ENDÓCRINA/METABÓLICA
  let scEndo = 0; const rEndo = [];
  if (has(D.ant, "hip")) { scEndo += 3; rEndo.push("hipotiroidismo (trânsito lento, secreções reduzidas)"); }
  if (has(D.ant, "dm")) { scEndo += 2; rEndo.push("diabetes (neuropatia autonómica → dismotilidade)"); }
  if (has(D.ant, "hca")) { scEndo += 3; rEndo.push("hipercalcemia (reduz excitabilidade muscular)"); }
  if (has(D.ant, "drc")) { scEndo += 2; rEndo.push("DRC (uremia → dismotilidade)"); }
  if (has(D.ant, "prk")) { scEndo += 3; rEndo.push("D. Parkinson (disf. autonómica precoce)"); }
  if (has(D.ant, "em")) { scEndo += 2; rEndo.push("Esclerose Múltipla (intestino neurogénico)"); }
  if (has(D.ant, "lm")) { scEndo += 3; rEndo.push("Lesão Medular (intestino neurogénico)"); }
  if (has(D.ant, "avc")) { scEndo += 2; rEndo.push("AVC (controlo autonómico)"); }
  if (has(D.ant, "dep")) { scEndo += 1; rEndo.push("Depressão (reduz actividade)"); }
  if (has(D.ant, "escl")) { scEndo += 2; rEndo.push("Esclerodermia (fibrose intestinal)"); }
  if (scEndo >= 2 && !hasFec && !hasObstr) dx.push({ id: "endo", sc: scEndo, r: rEndo, plano: DXM.endo.plano });

  // Ordenar por score descendente
  dx.sort((a, b) => b.sc - a.sc);
  if (dx.length === 0) dx.push({ id: "indet", sc: 0, r: ["dados insuficientes ou quadro inespecífico"], plano: DXM.indet.plano });

  // Anexar metadata (label, cor, info)
  return dx.map((d) => ({ ...d, l: DXM[d.id].l, cor: DXM[d.id].cor, info: DXM[d.id].info }));
}

// ── Geração da nota clínica (porte exato de genNote) ────────────────────────
export function gerarNota(D) {
  const p = [];
  let m = "Doente";
  if (D.sexo || D.idade) { m += " do sexo " + (D.sexo === "M" ? "masculino" : D.sexo === "F" ? "feminino" : "não especificado"); if (D.idade) m += ", " + D.idade + " anos"; m += ","; }
  m += D.ctx === "ambulatorio" ? " vem por queixas de obstipação" : D.ctx === "acamado" ? " no leito, avaliado por quadro de obstipação" : " avaliado por obstipação";
  if (D.dur === "aguda") { m += " aguda"; if (D.durT) m += " (" + D.durT + " semanas de evolução)"; }
  else if (D.dur === "cronica") { m += " crónica"; if (D.durT) m += " (" + D.durT + " meses de evolução)"; }
  const dp = []; if (D.frq) { if (D.frq.indexOf("Não evacua") === 0) dp.push("não evacua há " + (D.frqDias || "vários") + " dias"); else dp.push("frequência evacuatória de " + D.frq); }
  if (D.bri) { const b = BRIS.filter((x) => x.v === D.bri)[0]; if (b) dp.push("consistência Bristol " + b.l + " (" + b.d.toLowerCase() + ")"); }
  if (dp.length) m += ", com " + dp.join(" e ");
  const ap = [];
  D.sym.forEach((s) => { const i = SYMS.filter((x) => x.id === s)[0]; if (i) ap.push(i.l.toLowerCase()); });
  D.alm.forEach((s) => { const i = ALMS.filter((x) => x.id === s)[0]; if (i) { let txt = i.l.toLowerCase(); if (s === "rec" && D.recTipo) { const tipos = { hqz: " (hematoquézias)", mel: " (melenas)", sof: " (sangue oculto positivo)" }; txt += tipos[D.recTipo] || ""; } ap.push(txt); } });
  D.acu.forEach((s) => { const i = ACUT.filter((x) => x.id === s)[0]; if (i) ap.push(i.l.toLowerCase()); });
  if (D.gas === "aus") ap.push("ausência de emissão de gases" + (D.gasDias ? " há " + D.gasDias + " dias" : ""));
  if (D.gas === "aum") ap.push("flatulência aumentada");
  if (D.gas === "dim") ap.push("gases diminuídos");
  if (ap.length) m += ". Refere associado " + ap.join(", ");
  m += ".";
  const ng = ALMS.filter((s) => !has(D.alm, s.id));
  if (D.step > 2) {
    if (D.dur === "aguda") {
      const acNeg = [];
      if (!has(D.acu, "par") && !has(D.sym, "vfc")) acNeg.push("paragem de gases e fezes");
      if (!has(D.acu, "per") && !has(D.abd, "defesa")) acNeg.push("peritonismo");
      if (!has(D.acu, "rab")) acNeg.push("rectorragia abundante");
      if (!has(D.sym, "vfc") && !has(D.acu, "vfc2")) acNeg.push("vómitos fecalóides");
      if (!has(D.sym, "feb") && !has(D.acu, "fed")) acNeg.push("febre");
      if (acNeg.length) m += " Nega " + acNeg.join(", ") + ".";
    } else if (ng.length) m += " Nega " + ng.map((s) => s.l.toLowerCase()).join(", ") + ".";
  }
  if (isSU(D)) {
    if (D.unst === true) { const unstNames = { hipo: "hipotensão", taqui: "taquicardia", choque: "sinais de choque", desid: "desidratação severa", cons: "alteração da consciência" }; const unstList = D.uDet.map((u) => unstNames[u] || u); m += " Hemodinamicamente instável" + (unstList.length ? " (" + unstList.join(", ") + ")" : "") + "."; }
    else m += " Hemodinamicamente estável." + (!D.sv.temp || parseFloat(D.sv.temp.replace(",", ".")) < 37.5 ? " Apirético." : "");
  }
  p.push("Motivo de consulta\n" + m);

  if (D.agu || D.exe || D.fib !== null) { const hb = []; if (D.agu) hb.push("ingestão hídrica: " + D.agu); if (D.exe) hb.push(D.exe === "sedentario" ? "sedentário" : D.exe === "moderado" ? "actividade moderada" : "actividade regular"); if (D.fib === "sim") hb.push("dieta rica em fibra"); if (D.fib === "nao") hb.push("dieta pobre em fibra"); if (D.rep === "sim") hb.push("reprime urgência defecatória"); if (D.tab === "sim") hb.push("fumador activo"); if (D.tab === "ex") hb.push("ex-fumador"); if (hb.length) p.push("Hábitos: " + hb.join(", ") + "."); }

  if (D.dTg.length || D.cDr.length || D.nDr) { let md = "Medicação habitual: "; if (D.dTg.length) md += D.dTg.join(", "); else if (D.nDr) md += "sem medicação habitual"; if (D.cDr.length) { if (D.dTg.length) md += ". Fármacos com perfil obstipante: "; else md += "fármacos com perfil obstipante: "; md += D.cDr.join(", "); } p.push(md + "."); }

  if (D.ant.length || D.nAn || D.aTg.length) { const lb = D.ant.map((a) => { const x = ANTS.filter((xx) => xx.id === a)[0]; return x ? x.l : a; }); const al = lb.concat(D.aTg); p.push("Antecedentes Pessoais: " + (D.nAn && !al.length ? "sem antecedentes relevantes" : al.join(", ")) + "."); }
  if (D.hxFam.ccr || D.hxFam.dii) { const hxParts = []; if (D.hxFam.ccr) hxParts.push("história familiar de carcinoma colorretal"); if (D.hxFam.dii) hxParts.push("história familiar de DII"); let hxStr = "Antecedentes Familiares: " + hxParts.join(", "); if (D.hxFam.det) hxStr += " (" + D.hxFam.det + ")"; p.push(hxStr + "."); }

  if (isSU(D) && D.unst && D.unstAct.length) p.push("Estabilização\n" + "Realizado: " + D.unstAct.join(", ") + ".");

  const eoS = isSU(D) ? 8 : 7;
  if (D.step >= eoS) {
    const eo = [];
    if (!isSU(D)) { let stLine = "Hemodinamicamente estável"; if (!D.sv.temp || parseFloat(D.sv.temp.replace(",", ".")) < 37.5) stLine += ", apirético"; stLine += "."; eo.push(stLine); }
    if (D.sv.pa || D.sv.fc || D.sv.temp || D.sv.spo2) { const svP = []; if (D.sv.pa) svP.push("PA " + D.sv.pa + " mmHg"); if (D.sv.fc) svP.push("FC " + D.sv.fc + " bpm"); if (D.sv.temp) svP.push("Temp " + D.sv.temp + "°C"); if (D.sv.spo2) svP.push("SpO₂ " + D.sv.spo2 + "%"); eo.push("Sinais vitais: " + svP.join(", ") + "."); }
    const egP = [(D.eg.v ? "vigil" : "não vigil"), (D.eg.o ? "orientado" : "desorientado"), (D.eg.c ? "consciente" : "alt. consciência")];
    const egStr = egP.join(", "); eo.push(egStr.charAt(0).toUpperCase() + egStr.slice(1) + ".");
    const mu = [!has(D.muc, "desc") ? "coradas" : "descoradas", !has(D.muc, "desid") ? "hidratadas" : "desidratadas", !has(D.muc, "cian") ? "acianóticas" : "cianóticas", !has(D.muc, "ict") ? "anictéricas" : "ictéricas"];
    eo.push("Mucosas " + mu.join(", ") + ".");
    eo.push("AC: S1 e S2 " + (D.acr.r === "arr" ? "arrítmicos" : "rítmicos") + (D.acr.f === "taq" ? ", taquicárdico" : D.acr.f === "bra" ? ", bradicárdico" : ", regulares") + (D.acr.s === "sim" ? ", com sopro" : ", sem sopros") + ".");
    eo.push("AP: " + (D.apr.mv === "dim" ? "MV diminuído" : "MV global mantido") + (D.apr.ra.length ? ", " + D.apr.ra.join(", ").toLowerCase() : ", sem ruídos adventícios") + ".");
    const abdP = [has(D.abd, "dist") ? "distendido" + (D.distGr ? " (" + D.distGr + ")" : "") : "mole, depressível"];
    if (has(D.abd, "timp")) abdP.push("timpanizado");
    if (has(D.abd, "dor")) { abdP.push("doloroso à palpação" + (D.abdQ === "difusa" ? " (dor difusa)" : D.abdQ ? (" no " + (QNOME[D.abdQ] || "")) : "")); } else abdP.push("indolor");
    if (!has(D.abd, "massa")) abdP.push("sem massas"); else abdP.push("massa palpável");
    if (!has(D.abd, "defesa")) abdP.push("sem defesa"); else abdP.push("com defesa/peritonismo");
    const rhaT = []; if (has(D.rha, "aus")) rhaT.push("ausentes"); if (has(D.rha, "dim")) rhaT.push("diminuídos"); if (has(D.rha, "aum")) rhaT.push("aumentados"); if (has(D.rha, "met")) rhaT.push("metálicos");
    eo.push("Abdómen: " + abdP.join(", ") + ". RHA " + (rhaT.length ? rhaT.join(", ") : "presentes") + ".");
    if (D.trO && !D.trF.length) eo.push("TR sem alterações.");
    if (D.trO && D.trF.length) eo.push("TR: " + D.trF.map((f) => { const o = TROPT.filter((oo) => oo.id === f)[0]; return o ? o.l.toLowerCase() : f; }).join("; ") + ".");
    if (!D.mi.ed && !D.mi.tvp) eo.push("MIs sem edema, sem sinais TVP.");
    else { const mp = []; if (D.mi.ed) mp.push("edema"); if (D.mi.tvp) mp.push("sinais TVP"); eo.push("MIs: " + mp.join(", ") + "."); }
    p.push("Exame Objectivo\n" + eo.join("\n"));
  }

  const rS = isSU(D) ? 9 : 8;
  if (D.step >= rS) {
    const mcdts = [];
    const today = new Date();
    const dateStr = String(today.getDate()).padStart(2, "0") + "/" + String(today.getMonth() + 1).padStart(2, "0");
    const anaValues = [];
    ANALY.forEach((grp) => grp.items.forEach((a) => { if (!has(D.anSel, a.k)) return; const val = D.anV[a.k]; if (val && val.trim()) anaValues.push(a.k + " " + val.trim() + " " + a.u); }));
    if (has(D.anSel, "SOF")) { if (D.anR.SOF === "ps") anaValues.push("SOF positivo"); if (D.anR.SOF === "ng") anaValues.push("SOF negativo"); }
    if (anaValues.length) mcdts.push("Análises (" + dateStr + "): " + anaValues.join(", ") + ".");
    if (D.rxR.length) { const rxL = D.rxR.map((r) => { const x = IMG_RX.filter((i) => i[0] === r)[0]; return x ? x[1] : r; }); mcdts.push("Rx abdómen (" + dateStr + "): " + rxL.join(", ") + "."); }
    if (D.tcR) { const tc = IMG_TC.filter((x) => x[0] === D.tcR)[0]; if (tc) mcdts.push("TC abdominal (" + dateStr + "): " + tc[1] + "."); }
    if (D.colR) { const cl = COL_RES.filter((x) => x[0] === D.colR)[0]; if (cl) mcdts.push("Colonoscopia (" + dateStr + "): " + cl[1] + "."); }
    if (mcdts.length) p.push("MCDTs\n" + mcdts.join("\n"));
    if (D.act.length) p.push("Durante o internamento realizou: " + D.act.join(", ") + ".");
    if (D.plN.trim()) p.push("Plano\n" + D.plN.trim());
  }
  return p.join("\n\n");
}
