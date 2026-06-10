// ============================================================================
// LÓGICA — Treino de Anamnese da Dor Abdominal (porte exato do genNote do
// original). Funções puras sobre o estado D; textos vêm de @conteudo.
// O passo de discussão de hipóteses não existe (decisão de produto).
// ============================================================================
import dados from "@conteudo/urgencia/dor-abdominal-anamnese.json";

const { ageBuckets: AGE_BUCKETS, quadrantes: QUADRANTES, syms: SYMS, alms: ALMS, ants: ANTS } = dados;
const has = (a, v) => a.indexOf(v) >= 0;

export function estadoInicial() {
  return {
    step: 0, sexo: "", idade: "", hemodin: "",
    inicio: "", dur: "", durT: "", intens: "", tipo: [], loc: [], difusa: false, irrad: [], padrao: "",
    mod: { alim: null, defec: null, mov: null, pos: null, jejum: null },
    desRec: null, relRef: "", ainesRec: null, alcoolRec: null, movDes: null, menstr: "",
    alm: [], sym: [],
    alc: null, tabac: null, dieta: null, exerc: null,
    cDr: [], nDr: false, dTg: [], ant: [], nAn: false, aTg: [],
    hxFam: { neo: false, dii: false, lit: false, det: "" },
    eg: { v: true, o: true, c: true }, muc: [], acr: { r: null, f: null }, apr: { mv: null, ra: [] },
    eoQuad: [], defesa: null, rha: null, massa: [],
    sinaisEsp: { murphy: null, mcburney: null, rovsing: null, blumberg: null, psoas: null, obturador: null, punhod: null, punhoe: null },
    sinaisHow: {}, tr: null, mi: { ed: false, tvp: false }, pele: [], obeso: null,
    sv: { pa: "", fc: "", temp: "", spo2: "", fr: "" },
    _symSub: {}, _symFilter: "", _drgFilter: "", _antFilter: "",
  };
}

export const ageBucket = (D) => AGE_BUCKETS.find((b) => b.k === D.idade) || null;
export const ageNum = (D) => (ageBucket(D) ? ageBucket(D).rep : 0);
export const ageRange = (D) => (ageBucket(D) ? ageBucket(D).r : "");
export const fertil = (D) => D.sexo === "F" && ageNum(D) > 0 && ageNum(D) <= 52;
export const quadLabel = (id) => { const q = QUADRANTES.find((x) => x.id === id); return q ? q.full : id; };

// ── Exemplo de nota clínica (porte exato do genNote) ────────────────────────
export function genNote(D, atePasso) {
  const p = [];
  let m = "";
  if (D.sexo || D.idade) { m += "Sexo " + (D.sexo === "M" ? "masculino" : "feminino"); if (D.idade) m += ", faixa etária " + ageRange(D); m += ", "; }
  if (D.hemodin === "instavel") m += "hemodinamicamente instável, ";
  m += "com queixa de dor abdominal";
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
  if (D.padrao) m += ", " + { constante: "de padrão constante", intermit: "de padrão intermitente", crescendo: "em crescendo", resolucao: "em resolução" }[D.padrao];
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
    if (D.relRef === "gordura") ctx.push("relação com refeição gorda");
    if (D.relRef === "2_3h") ctx.push("dor 2-3h após as refeições");
    if (D.relRef === "jejum") ctx.push("dor em jejum/madrugada");
    if (D.ainesRec === true) ctx.push("uso recente de AINEs");
    if (D.alcoolRec === true) ctx.push("consumo recente de álcool");
    if (D.movDes === "imobiliza") ctx.push("imobiliza-se com a dor");
    if (D.movDes === "agita") ctx.push("agitado, sem encontrar posição");
    if (D.menstr === "peri") ctx.push("dor peri-menstrual");
    if (D.menstr === "meio") ctx.push("dor a meio do ciclo");
    if (ctx.length) m += " Contexto: " + ctx.join("; ") + ".";
  } else if (D.desRec === "nao") {
    m += " Sem factor desencadeante identificado.";
  }
  const ap = [];
  D.sym.forEach((s) => {
    const i = SYMS.find((x) => x.id === s);
    if (i) {
      let lab = i.l.toLowerCase();
      if (s === "vomitos" && D._symSub["vomitos"]) { const vs = { alim: "alimentares", bil: "biliosos", fec: "fecalóides" }; lab += " " + (vs[D._symSub["vomitos"]] || ""); }
      ap.push(lab);
    }
  });
  if (ap.length) m += " Associadamente refere " + ap.join(", ") + ".";
  if (atePasso > 2) {
    const almPos = D.alm.map((a) => { const x = ALMS.find((xx) => xx.id === a); return x ? x.l.toLowerCase() : a; });
    if (almPos.length) m += " Sinais de alarme: " + almPos.join(", ") + ".";
    if (has(D.alm, "perdaponderal")) m += " Perda ponderal não intencional significativa.";
    const ng = ALMS.filter((s) => !has(D.alm, s.id));
    if (ng.length) m += " Nega " + ng.map((s) => s.l.toLowerCase()).join(", ") + ".";
    if (fertil(D) && !has(D.sym, "amen")) m += " Sem atraso menstrual.";
  }
  p.push(m);
  if (D.alc || D.tabac || D.dieta || D.exerc) {
    const hb = [];
    if (D.alc === "nao") hb.push("sem consumo de álcool"); if (D.alc === "social") hb.push("álcool social"); if (D.alc === "regular") hb.push("álcool regular"); if (D.alc === "excessivo") hb.push("álcool excessivo");
    if (D.tabac === "nao") hb.push("não fumador"); if (D.tabac === "ex") hb.push("ex-fumador"); if (D.tabac === "sim") hb.push("fumador");
    if (D.dieta === "equilibrada") hb.push("dieta equilibrada"); if (D.dieta === "gordura") hb.push("dieta rica em gordura"); if (D.dieta === "pobrefibra") hb.push("dieta pobre em fibra"); if (D.dieta === "restritiva") hb.push("dieta restritiva");
    if (D.exerc === "sedentario") hb.push("sedentário"); if (D.exerc === "moderado") hb.push("actividade física moderada"); if (D.exerc === "regular") hb.push("actividade física regular");
    if (hb.length) p.push("Hábitos: " + hb.join(", ") + ".");
  }
  if (D.dTg.length || D.cDr.length || D.nDr) {
    let md = "Medicação habitual: ";
    if (D.nDr && !D.dTg.length && !D.cDr.length) md += "sem medicação habitual";
    else md += [...D.dTg, ...D.cDr].join(", ");
    p.push(md + ".");
  }
  if (D.ant.length || D.nAn || D.aTg.length) {
    const lb = D.ant.map((a) => {
      const x = ANTS.find((xx) => xx.id === a);
      let nm = x ? x.l : a;
      const sb = D._symSub[a];
      if (sb && x && x.sub) { const so = x.sub.find((z) => z.v === sb); if (so) nm += " (" + so.l.toLowerCase() + ")"; }
      return nm;
    });
    const all = lb.concat(D.aTg);
    p.push("Antecedentes pessoais: " + (D.nAn && !all.length ? "sem antecedentes relevantes" : all.join(", ")) + ".");
  }
  if (D.hxFam.neo || D.hxFam.dii || D.hxFam.lit) {
    const hx = [];
    if (D.hxFam.neo) hx.push("neoplasia digestiva"); if (D.hxFam.dii) hx.push("doença inflamatória intestinal"); if (D.hxFam.lit) hx.push("litíase biliar");
    p.push("Antecedentes familiares: " + hx.join(", ") + (D.hxFam.det ? " (" + D.hxFam.det + ")" : "") + ".");
  }
  if (atePasso >= 7) {
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
    const sgMap = { murphy: "Murphy", mcburney: "dor em McBurney", rovsing: "Rovsing", blumberg: "Blumberg", psoas: "psoas", obturador: "obturador", punhod: "punho-percussão lombar direita", punhoe: "punho-percussão lombar esquerda" };
    const sPos = [], sNeg = [];
    Object.keys(sgMap).forEach((k) => { if (D.sinaisEsp[k] === "pos") sPos.push(sgMap[k]); else if (D.sinaisEsp[k] === "neg") sNeg.push(sgMap[k]); });
    if (sPos.length) eo.push("Sinais positivos: " + sPos.join(", ") + ".");
    if (sNeg.length) eo.push("Sinais negativos: " + sNeg.join(", ") + ".");
    const trT = { nl: "Toque rectal sem alterações.", sangue: "Toque rectal com sangue vivo.", melena: "Toque rectal com melenas.", massa: "Toque rectal com massa palpável.", dor: "Toque rectal doloroso / com abaulamento." };
    if (D.tr && D.tr !== "nf") eo.push(trT[D.tr]);
    if (D.mi.ed || D.mi.tvp) { const mp = []; if (D.mi.ed) mp.push("edema"); if (D.mi.tvp) mp.push("sinais de TVP"); eo.push("Membros inferiores: " + mp.join(", ") + "."); }
    if (D.obeso === "ob") eo.push("Obesidade."); else if (D.obeso === "exc") eo.push("Excesso de peso.");
    if (D.pele.length) { const pl = { greyturner: "sinal de Grey-Turner", cullen: "sinal de Cullen", eritema: "eritema da parede" }; eo.push("Pele: " + D.pele.map((x) => pl[x] || x).join(", ") + "."); }
    p.push("Exame objectivo\n" + eo.join("\n"));
  }
  return p.join("\n\n");
}
