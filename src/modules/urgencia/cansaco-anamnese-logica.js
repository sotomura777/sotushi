// ============================================================================
// LÓGICA — Treino de Anamnese do Cansaço (porte exato do genNote do original).
// Funções puras sobre o estado D; textos vêm de @conteudo.
// O passo de discussão de hipóteses não existe (decisão de produto).
// ============================================================================
import dados from "@conteudo/urgencia/cansaco-anamnese.json";

const { ageBuckets: AGE_BUCKETS, syms: SYMS, alms: ALMS, drgcls: DRGCLS, ants: ANTS } = dados;

const has = (a, v) => a.indexOf(v) >= 0;

// ── Estado inicial (espelha o objecto D do original) ────────────────────────
export function estadoInicial() {
  return {
    step: 0, sexo: "", idade: "", tipo: [], dur: "", durT: "", grav: "", padrao: "", repouso: null,
    infRec: null, infQuando: "", infOque: "", infAB: null, infRash: null, infAdeno: null, infIct: null, infExpo: null,
    alm: [], sym: [], sonoH: "", sonoQ: null, caf: "", alc: null, exe: null, dieta: null,
    cDr: [], nDr: false, dTg: [], ant: [], nAn: false, aTg: [],
    hxFam: { tir: false, auto: false, neo: false, det: "" },
    eg: { v: true, o: true, c: true }, muc: [], acr: { r: null, f: null, s: null }, apr: { mv: null, ra: [] },
    abd: [], tir: null, adeno: [], mi: { ed: false, tvp: false }, pele: [], obeso: null,
    sv: { pa: "", fc: "", temp: "", spo2: "" },
    _symSub: {}, _pesoAnt: "", _pesoAct: "",
  };
}

// ── Helpers (espelham os do original) ───────────────────────────────────────
export const ageBucket = (D) => AGE_BUCKETS.find((b) => b.k === D.idade) || null;
export const ageNum = (D) => (ageBucket(D) ? ageBucket(D).rep : 0);
export const ageRange = (D) => (ageBucket(D) ? ageBucket(D).r : "");
export const sonoInsuf = (D) => { const v = parseFloat((D.sonoH || "").replace(",", ".")); return !isNaN(v) && v < 6; };
export const cafExc = (D) => parseInt((D.caf || "").replace(/[^0-9]/g, "")) >= 4;
export const getDrCls = (drug) => { const c = DRGCLS.filter((x) => x.drugs.indexOf(drug) >= 0); return c.length ? c[0].cls : "Outro"; };

// ── Exemplo de nota clínica (porte exato do genNote) ────────────────────────
export function genNote(D, atePasso) {
  const p = [];
  let m = "Caso clínico fictício";
  if (D.sexo || D.idade) { m += " — sexo " + (D.sexo === "M" ? "masculino" : "feminino"); if (D.idade) m += ", faixa etária " + ageRange(D); m += ","; }
  m += " com queixa de cansaço/fadiga";
  if (D.dur === "aguda") { m += " de início recente"; if (D.durT) m += " (" + D.durT + " semanas)"; }
  else if (D.dur === "cronica") { m += " crónica"; if (D.durT) m += " (" + D.durT + " meses de evolução)"; }
  if (D.infRec === "sim") {
    m += ", no contexto de quadro infeccioso recente";
    const infDesc = [];
    if (D.infOque === "amig") infDesc.push("amigdalite/faringite");
    if (D.infOque === "gripe") infDesc.push("síndrome gripal");
    if (D.infOque === "covid") infDesc.push("COVID-19");
    if (D.infOque === "gastro") infDesc.push("gastroenterite");
    if (D.infOque === "outra") infDesc.push("infecção viral inespecífica");
    if (infDesc.length) m += " (" + infDesc.join(", ");
    if (D.infQuando === "1-2sem") m += ", há 1-2 semanas";
    if (D.infQuando === "2-4sem") m += ", há 2-4 semanas";
    if (D.infQuando === "1-3m") m += ", há 1-3 meses";
    if (D.infQuando === "3m") m += ", há mais de 3 meses";
    if (infDesc.length) m += ")";
    if (D.infAB === true) { m += ", medicado com antibiótico"; if (D.infRash === true) m += " (rash cutâneo com amoxicilina — sugestivo de mononucleose)"; }
    if (D.infAdeno === true) m += ", com adenopatias cervicais";
    if (D.infIct === true) m += ", com icterícia";
    if (D.infExpo === true) m += ", com exposição de risco";
  }
  if (D.tipo.length) {
    const tt = { verdadeira: "fadiga verdadeira", sonolencia: "sonolência diurna excessiva", dispneia: "intolerância ao esforço com dispneia", fraqueza: "fraqueza muscular" };
    m += ", caracterizada como " + D.tipo.map((t) => tt[t] || t).join(" e ");
  }
  if (has(D.tipo, "fraqueza")) {
    const fd = [];
    if (D.fraqDist) fd.push({ prox: "proximal", dist: "distal", gen: "generalizada" }[D.fraqDist]);
    if (D.fraqSim) fd.push({ sim: "simétrica", assim: "assimétrica" }[D.fraqSim]);
    if (D.fraqProg) fd.push({ est: "estável", prog: "progressiva" }[D.fraqProg]);
    if (fd.length) m += " (" + fd.join(", ") + ")";
  }
  if (D.grav) m += ", gravidade " + D.grav + "/10";
  if (D.padrao) m += ", " + { manha: "pior de manhã", fimdia: "pior ao final do dia", constante: "constante", flutuante: "flutuante" }[D.padrao];
  if (D.repouso === false) m += ", sem melhoria com repouso";
  else if (D.repouso === true) m += ", com melhoria parcial com repouso";
  const ap = D.sym.map((s) => SYMS.find((x) => x.id === s)).filter(Boolean).map((i) => i.l.toLowerCase());
  if (ap.length) m += ". Refere " + ap.join(", ");
  m += ".";
  if (atePasso > 2) {
    const almPos = D.alm.map((a) => { const x = ALMS.find((xx) => xx.id === a); return x ? x.l.toLowerCase() : a; });
    if (almPos.length) m += " Sinais de alarme: " + almPos.join(", ") + ".";
    if (has(D.alm, "ppe") && D._pesoAnt && D._pesoAct) {
      const pa = parseFloat(D._pesoAnt.replace(",", ".")), pc = parseFloat(D._pesoAct.replace(",", "."));
      if (!isNaN(pa) && !isNaN(pc) && pa > 0) m += " Perda ponderal estimada: " + pa + "kg → " + pc + "kg (" + (((pa - pc) / pa) * 100).toFixed(1) + "%).";
    }
    const ng = ALMS.filter((s) => !has(D.alm, s.id));
    if (ng.length) m += " Nega " + ng.map((s) => s.l.toLowerCase()).join(", ") + ".";
  }
  p.push("Motivo de consulta\n" + m);
  if (D.sonoH || D.sonoQ || D.caf || D.alc || D.exe || D.dieta) {
    const hb = [];
    if (D.sonoH) hb.push("sono: " + D.sonoH + "h/noite");
    if (D.sonoQ === "bom") hb.push("sono reparador"); if (D.sonoQ === "mau") hb.push("sono não reparador"); if (D.sonoQ === "variavel") hb.push("qualidade variável");
    if (D.caf) hb.push("cafeína: " + D.caf + " cafés/dia");
    if (D.alc === "nao") hb.push("sem álcool"); if (D.alc === "social") hb.push("álcool social"); if (D.alc === "regular") hb.push("álcool regular"); if (D.alc === "excessivo") hb.push("álcool excessivo");
    if (D.exe === "sedentario") hb.push("sedentário"); if (D.exe === "moderado") hb.push("actividade moderada"); if (D.exe === "regular") hb.push("actividade regular"); if (D.exe === "excessivo") hb.push("exercício excessivo");
    if (D.dieta === "equilibrada") hb.push("dieta equilibrada"); if (D.dieta === "restritiva") hb.push("dieta restritiva"); if (D.dieta === "veg_ns") hb.push("vegetariano sem suplementação"); if (D.dieta === "veg_s") hb.push("vegetariano com suplementação");
    if (hb.length) p.push("Hábitos: " + hb.join(", ") + ".");
  }
  if (D.dTg.length || D.cDr.length || D.nDr) {
    let md = "Medicação habitual: ";
    if (D.nDr && !D.dTg.length) md += "sem medicação habitual";
    else if (D.dTg.length) md += D.dTg.join(", ");
    if (D.cDr.length) md += (D.dTg.length ? ". Fármacos com perfil de fadiga: " : "fármacos com perfil de fadiga: ") + D.cDr.join(", ");
    p.push(md + ".");
  }
  if (D.ant.length || D.nAn || D.aTg.length) {
    const lb = D.ant.map((a) => { const x = ANTS.find((xx) => xx.id === a); return x ? x.l : a; });
    p.push("Antecedentes Pessoais: " + (D.nAn && !lb.concat(D.aTg).length ? "sem antecedentes relevantes" : lb.concat(D.aTg).join(", ")) + ".");
  }
  if (D.hxFam.tir || D.hxFam.auto || D.hxFam.neo) {
    const hx = [];
    if (D.hxFam.tir) hx.push("doença tiroideia"); if (D.hxFam.auto) hx.push("doença autoimune"); if (D.hxFam.neo) hx.push("neoplasia");
    p.push("Antecedentes Familiares: " + hx.join(", ") + (D.hxFam.det ? " (" + D.hxFam.det + ")" : "") + ".");
  }
  if (atePasso >= 7) {
    const eo = [];
    let st = "Hemodinamicamente estável";
    if (!D.sv.temp || parseFloat(D.sv.temp.replace(",", ".")) < 37.5) st += ", apirético";
    eo.push(st + ".");
    if (D.sv.pa || D.sv.fc || D.sv.temp || D.sv.spo2) {
      const sv = [];
      if (D.sv.pa) sv.push("PA " + D.sv.pa + " mmHg"); if (D.sv.fc) sv.push("FC " + D.sv.fc + " bpm");
      if (D.sv.temp) sv.push("Temp " + D.sv.temp + "°C"); if (D.sv.spo2) sv.push("SpO₂ " + D.sv.spo2 + "%");
      eo.push("Sinais vitais: " + sv.join(", ") + ".");
    }
    eo.push([D.eg.v ? "Vigil" : "Não vigil", D.eg.o ? "orientado" : "desorientado", D.eg.c ? "consciente" : "alt. consciência"].join(", ") + ".");
    eo.push("Mucosas " + [!has(D.muc, "desc") ? "coradas" : "descoradas", !has(D.muc, "desid") ? "hidratadas" : "desidratadas", !has(D.muc, "cian") ? "acianóticas" : "cianóticas", !has(D.muc, "ict") ? "anictéricas" : "ictéricas"].join(", ") + ".");
    eo.push("AC: S1 e S2 " + (D.acr.r === "arr" ? "arrítmicos" : "rítmicos") + (D.acr.f === "taq" ? ", taquicárdico" : D.acr.f === "bra" ? ", bradicárdico" : ", regulares") + (D.acr.s === "sim" ? ", com sopro" : ", sem sopros") + ".");
    eo.push("AP: " + (D.apr.mv === "dim" ? "MV diminuído" : "MV global mantido") + (D.apr.ra.length ? ", " + D.apr.ra.join(", ").toLowerCase() : ", sem ruídos adventícios") + ".");
    const ab = [];
    if (has(D.abd, "hepato")) ab.push("hepatomegália"); if (has(D.abd, "espleno")) ab.push("esplenomegália");
    if (has(D.abd, "massa")) ab.push("massa palpável"); if (has(D.abd, "ascite")) ab.push("ascite");
    eo.push("Abdómen mole, depressível, indolor" + (ab.length ? ", " + ab.join(", ") : ", sem organomegálias") + ".");
    eo.push(D.tir === "tir_boc" ? "Tiróide: bócio palpável." : D.tir === "tir_nod" ? "Tiróide: nódulo palpável." : "Tiróide sem alterações.");
    eo.push(D.adeno.length ? "Adenopatias: " + D.adeno.join(", ").toLowerCase() + "." : "Sem adenopatias palpáveis.");
    if (!D.mi.ed && !D.mi.tvp) eo.push("MIs sem edema, sem sinais TVP.");
    else { const mp = []; if (D.mi.ed) mp.push("edema"); if (D.mi.tvp) mp.push("sinais TVP"); eo.push("MIs: " + mp.join(", ") + "."); }
    if (D.obeso === "ob") eo.push("Obesidade."); else if (D.obeso === "exc") eo.push("Excesso de peso.");
    eo.push(D.pele.length ? "Pele: " + D.pele.join(", ").toLowerCase() + "." : "Sem alterações cutâneas.");
    p.push("Exame Objectivo\n" + eo.join("\n"));
  }
  return p.join("\n\n");
}
