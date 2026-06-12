// ============================================================================
// LÓGICA — Treino de Anamnese da Cólica Renal (porte exato do genNote do
// original). Funções puras sobre o estado D; textos vêm de @conteudo.
// Sem passo de discussão de hipóteses nem scoring (o original não os tem).
// ============================================================================
import dados from "@conteudo/urgencia/colica-renal-anamnese.json";

const { ageBuckets: AGE_BUCKETS, quadrantes: QUADRANTES, syms: SYMS, ants: ANTS } = dados;
const has = (a, v) => a.indexOf(v) >= 0;
export const PASSOS = [0, 1, 1.5, 2, 3, 4, 5, 6, 7, 9, 10];
const passouPasso = (D, n) => PASSOS.indexOf(D.step) >= PASSOS.indexOf(n);

export function estadoInicial() {
  return {
    step: 0, sexo: "", idade: "", hemodin: "",
    inicio: "", dur: "", durT: "", intens: "", tipo: [], loc: [], difusa: false, irrad: [], padrao: "",
    mod: { alim: null, defec: null, mov: null, pos: null, jejum: null },
    desRec: null, relRef: "", ainesRec: null, alcoolRec: null, movDes: null, menstr: "",
    alm: [], sym: [],
    alc: null, tabac: null, dieta: null, exerc: null,
    cDr: [], nDr: false, dTg: [], ant: [], nAn: false, aTg: [],
    hxFam: { litfam: false, renalfam: false, gotafam: false, det: "" },
    eg: { v: true, o: true, c: true }, muc: [], acr: { r: null, f: null }, apr: { mv: null, ra: [] },
    eoQuad: [], defesa: null, rha: null, massa: [],
    sinaisEsp: { punhod: null, punhoe: null, ureterald: null, ureterale: null, blumberg: null },
    sinaisHow: {}, gen: [], mi: { ed: false, tvp: false }, pele: [], obeso: null,
    sv: { pa: "", fc: "", temp: "", spo2: "", fr: "" },
    plN: "", act: [],
    _symSub: {}, _symFilter: "", _drgFilter: "", _antFilter: "", _excExp: {}, hn: {},
  };
}

export const ageBucket = (D) => AGE_BUCKETS.find((b) => b.k === D.idade) || null;
export const ageNum = (D) => (ageBucket(D) ? ageBucket(D).rep : 0);
export const ageRange = (D) => (ageBucket(D) ? ageBucket(D).r : "");
export const fertil = (D) => D.sexo === "F" && ageNum(D) > 0 && ageNum(D) <= 52;
export const quadLabel = (id) => { const q = QUADRANTES.find((x) => x.id === id); return q ? q.full : id; };
const joinAnd = (arr) => { if (!arr || !arr.length) return ""; if (arr.length === 1) return arr[0]; if (arr.length === 2) return arr[0] + " e " + arr[1]; return arr.slice(0, -1).join(", ") + " e " + arr[arr.length - 1]; };

// ── Exemplo de nota clínica (porte exato do genNote do original) ────────────
export function genNote(D) {
  const p = [];
  let m = "";
  if (D.sexo || D.idade) { m += "Sexo " + (D.sexo === "M" ? "masculino" : "feminino"); if (D.idade) m += ", faixa etária " + ageRange(D); m += ", "; }
  if (D.hemodin === "instavel") m += "hemodinamicamente instável, ";
  m += "com queixa de dor lombo-abdominal (a esclarecer cólica renal)";
  if (D.inicio === "subito") m += " de início súbito";
  else if (D.inicio === "gradual") m += " de início gradual";
  if (D.dur === "aguda") m += ", aguda"; else if (D.dur === "subaguda") m += ", subaguda"; else if (D.dur === "cronica") m += ", crónica";
  if (D.durT) m += " (" + D.durT + ")";
  if (D.difusa) m += ", de localização difusa";
  else if (D.loc.length) m += ", localizada a " + D.loc.map((q) => quadLabel(q).toLowerCase()).join(", ");
  if (D.tipo.length) {
    const tt = { colica: "cólica", continua: "contínua", queimor: "em queimor", facada: "em facada", opressiva: "opressiva", surda: "surda" };
    m += ", de tipo " + D.tipo.map((t) => tt[t] || t).join(" e ");
  }
  if (D.intens) m += ", intensidade " + D.intens + "/10";
  if (D.irrad.length) {
    const ir = { dorso: "o dorso", ombrod: "a escápula direita", ombroe: "a escápula esquerda", virilha: "a virilha", retro: "a região retroesternal", flancos: "os flancos" };
    m += ", com irradiação para " + D.irrad.map((x) => ir[x] || x).join(" e ");
  }
  if (D.padrao) { const pp = { constante: "de padrão constante", intermit: "de padrão intermitente", crescendo: "em crescendo", resolucao: "em resolução" }; m += ", " + pp[D.padrao]; }
  const modAlivia = [], modAgrava = [];
  const modGrp = (k, lbl) => { if (D.mod[k] === "alivia") modAlivia.push(lbl); else if (D.mod[k] === "agrava") modAgrava.push(lbl); };
  modGrp("alim", "com a alimentação"); modGrp("jejum", "em jejum"); modGrp("defec", "com a defecação"); modGrp("mov", "com o movimento"); modGrp("pos", "com a posição");
  if (modAlivia.length || modAgrava.length) {
    m += ". A dor";
    if (modAlivia.length) m += " alivia " + modAlivia.slice(0, -1).join(", ") + (modAlivia.length > 1 ? " e " : "") + modAlivia[modAlivia.length - 1];
    if (modAlivia.length && modAgrava.length) m += ";";
    if (modAgrava.length) m += " agrava " + modAgrava.slice(0, -1).join(", ") + (modAgrava.length > 1 ? " e " : "") + modAgrava[modAgrava.length - 1];
  }
  m += ".";
  if (D.desRec === "sim") {
    const ctx = [];
    if (D.relRef === "desidratacao") ctx.push("desidratação / calor recente");
    if (D.relRef === "esforco") ctx.push("exercício físico intenso recente");
    if (D.relRef === "imobil") ctx.push("imobilização prolongada recente");
    if (D.ainesRec === true) ctx.push("uso recente de AINEs");
    if (D.movDes === "imobiliza") ctx.push("imobiliza-se com a dor");
    if (D.movDes === "agita") ctx.push("agitado, sem encontrar posição");
    if (D.menstr === "peri") ctx.push("dor peri-menstrual");
    if (D.menstr === "meio") ctx.push("dor a meio do ciclo");
    if (ctx.length) m += " Contexto: " + ctx.join("; ") + ".";
  } else if (D.desRec === "nao") {
    m += " Sem factor desencadeante identificado.";
  }
  p.push(m);

  // §2 — Sintomas associados (positivos + negações)
  const symPos = [], symNeg = [];
  SYMS.forEach((it) => {
    if (it.cat === "Gineco" && !fertil(D)) return;
    let labLow = it.l.toLowerCase();
    if (has(D.sym, it.id)) {
      if (it.id === "vomitos" && D._symSub["vomitos"]) {
        const vs = { ocasionais: "ocasionais", persistentes: "persistentes" };
        labLow += " " + (vs[D._symSub["vomitos"]] || "");
      }
      symPos.push(labLow);
    } else {
      symNeg.push(labLow);
    }
  });
  if (symPos.length || symNeg.length) {
    if (symPos.length) p.push("Associadamente refere " + joinAnd(symPos) + ".");
    if (symNeg.length) p.push("Nega " + joinAnd(symNeg) + ".");
  }
  if (D.alc || D.tabac || D.dieta || D.exerc) {
    const hb = [];
    if (D.alc === "nao") hb.push("sem consumo de álcool"); if (D.alc === "social") hb.push("álcool social"); if (D.alc === "regular") hb.push("álcool regular"); if (D.alc === "excessivo") hb.push("álcool excessivo");
    if (D.tabac === "nao") hb.push("não fumador"); if (D.tabac === "ex") hb.push("ex-fumador"); if (D.tabac === "sim") hb.push("fumador");
    if (D.dieta === "equilibrada") hb.push("dieta equilibrada e boa hidratação"); if (D.dieta === "gordura") hb.push("dieta rica em sal e proteína animal"); if (D.dieta === "pobrefibra") hb.push("dieta rica em oxalato"); if (D.dieta === "restritiva") hb.push("baixa ingestão de líquidos");
    if (D.exerc === "sedentario") hb.push("sedentário"); if (D.exerc === "moderado") hb.push("actividade física moderada"); if (D.exerc === "regular") hb.push("actividade física regular");
    if (hb.length) p.push("Hábitos: " + hb.join(", ") + ".");
  }
  if (D.dTg.length || D.cDr.length || D.nDr) {
    let md = "Medicação habitual: ";
    if (D.nDr && !D.dTg.length && !D.cDr.length) md += "sem medicação habitual";
    else { let meds = []; if (D.dTg.length) meds = meds.concat(D.dTg); if (D.cDr.length) meds = meds.concat(D.cDr); md += meds.join(", "); }
    p.push(md + ".");
  }
  if (D.ant.length || D.nAn || D.aTg.length) {
    const lb = D.ant.map((a) => {
      const x = ANTS.filter((xx) => xx.id === a)[0];
      let nm = x ? x.l : a;
      const sb = D._symSub[a];
      if (sb && x && x.sub) { const so = x.sub.filter((z) => z.v === sb)[0]; if (so) nm += " (" + so.l.toLowerCase() + ")"; }
      return nm;
    });
    const all = lb.concat(D.aTg);
    p.push("Antecedentes pessoais: " + (D.nAn && !all.length ? "sem antecedentes relevantes" : all.join(", ")) + ".");
  }
  if (D.hxFam.litfam || D.hxFam.renalfam || D.hxFam.gotafam) {
    const hx = [];
    if (D.hxFam.litfam) hx.push("litíase renal"); if (D.hxFam.renalfam) hx.push("doença renal hereditária"); if (D.hxFam.gotafam) hx.push("gota / hiperuricemia");
    p.push("Antecedentes familiares: " + hx.join(", ") + (D.hxFam.det ? " (" + D.hxFam.det + ")" : "") + ".");
  }
  if (passouPasso(D, 7)) {
    const eo = [];
    const temp = parseFloat((D.sv.temp || "").replace(",", "."));
    let st = "Doente " + (D.eg.v ? "vigil" : "prostrado") + ", " + (D.eg.o ? "orientado" : "confuso") + ", " + (D.eg.c ? "em bom estado geral" : "em mau estado geral");
    if (!isNaN(temp)) st += temp >= 38 ? ", febril" : ", apirético";
    eo.push(st + ".");
    if (D.sv.pa || D.sv.fc || D.sv.temp || D.sv.spo2 || D.sv.fr) {
      const sv = [];
      if (D.sv.pa) sv.push("PA " + D.sv.pa + " mmHg"); if (D.sv.fc) sv.push("FC " + D.sv.fc + " bpm");
      if (D.sv.temp) sv.push("Temp " + D.sv.temp + "°C"); if (D.sv.fr) sv.push("FR " + D.sv.fr + " cpm"); if (D.sv.spo2) sv.push("SpO₂ " + D.sv.spo2 + "%");
      eo.push("Sinais vitais: " + sv.join(", ") + ".");
    }
    eo.push("Mucosas " + [!has(D.muc, "desc") ? "coradas" : "descoradas", !has(D.muc, "desid") ? "hidratadas" : "desidratadas", !has(D.muc, "ict") ? "anictéricas" : "ictéricas"].join(", ") + ".");
    eo.push("AC: " + (D.acr.r === "arr" ? "arrítmico" : "rítmico") + (D.acr.f === "taq" ? ", taquicárdico" : "") + ", sem sopros audíveis.");
    eo.push("AP: " + (D.apr.mv === "dim" ? "murmúrio vesicular diminuído na base" : "murmúrio vesicular mantido") + (D.apr.ra.length ? ", " + D.apr.ra.join(", ").toLowerCase() : ", sem ruídos adventícios") + ".");
    let abd = "Abdómen ";
    const def = D.defesa;
    if (def === "tabua") abd += "em tábua, com contractura generalizada involuntária";
    else if (def === "generalizada") abd += "com peritonismo generalizado (dor à descompressão difusa)";
    else if (def === "localizada") abd += "com defesa localizada";
    else abd += "mole e depressível";
    if (D.eoQuad.length) abd += ", doloroso à palpação " + (D.eoQuad.length > 1 ? "nos quadrantes " : "no quadrante ") + D.eoQuad.map((q) => quadLabel(q).toLowerCase()).join(", ");
    else if (!def || def === "sem") abd += ", indolor à palpação";
    abd += ".";
    eo.push(abd);
    const rhaT = { nl: "Ruídos hidroaéreos normais.", aum: "Ruídos hidroaéreos aumentados.", dim: "Ruídos hidroaéreos diminuídos.", aus: "Ruídos hidroaéreos ausentes.", met: "Ruídos hidroaéreos metálicos (de luta)." };
    if (D.rha) eo.push(rhaT[D.rha]);
    if (D.massa.length) eo.push(D.massa.join(", ") + ".");
    const sgMap = { punhod: "punho-percussão lombar direita", punhoe: "punho-percussão lombar esquerda", ureterald: "pontos ureterais dolorosos à direita", ureterale: "pontos ureterais dolorosos à esquerda", blumberg: "Blumberg" };
    const sPos = [], sNeg = [];
    Object.keys(sgMap).forEach((k) => { if (D.sinaisEsp[k] === "pos") sPos.push(sgMap[k]); else if (D.sinaisEsp[k] === "neg") sNeg.push(sgMap[k]); });
    if (sPos.length) eo.push("Sinais positivos: " + sPos.join(", ") + ".");
    if (sNeg.length) eo.push("Sinais negativos: " + sNeg.join(", ") + ".");
    if (D.gen.length) {
      const gm = { hernia: "hérnia inguinal/femoral", escroto: "dor/edema escrotal" };
      const gp = D.gen.filter((x) => x !== "normal").map((x) => gm[x]);
      if (gp.length) eo.push("Genitália/região inguinal: " + gp.join(", ") + ".");
      else if (has(D.gen, "normal")) eo.push("Genitália e região inguinal sem alterações.");
    }
    if (D.mi.ed || D.mi.tvp) { const mp = []; if (D.mi.ed) mp.push("edema"); if (D.mi.tvp) mp.push("sinais de TVP"); eo.push("Membros inferiores: " + mp.join(", ") + "."); }
    if (D.obeso === "ob") eo.push("Obesidade."); else if (D.obeso === "exc") eo.push("Excesso de peso.");
    if (D.pele.length) { const pl = { greyturner: "sinal de Grey-Turner", cullen: "sinal de Cullen", eritema: "eritema da parede" }; eo.push("Pele: " + D.pele.map((x) => pl[x] || x).join(", ") + "."); }
    p.push("Exame objectivo\n" + eo.join("\n"));
  }
  return p.join("\n\n");
}
