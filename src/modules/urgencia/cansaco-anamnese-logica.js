// ============================================================================
// LÓGICA — Treino de Anamnese do Cansaço (porte EXATO do scoring + genNote
// do HTML original). Funções puras sobre o estado D; textos vêm de @conteudo.
// Correções de IDs face ao original (referiam opções inexistentes do EO):
// abd "hepm/espm/mass"→"hepato/espleno/massa", ra "crep"→"Crepitações",
// obeso true/false→"ob"/"nl". Pele "rash"/"foto" mantidos como no original
// (o EO não tem essas opções — regras ficam inertes, como no HTML).
// ============================================================================
import dados from "@conteudo/urgencia/cansaco-anamnese.json";

const { ageBuckets: AGE_BUCKETS, syms: SYMS, alms: ALMS, drgcls: DRGCLS, ants: ANTS, ui } = dados;
const DISC = ui.disc;

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
    expCard: null, almOpen: false,
  };
}

// ── Helpers (espelham os do original) ───────────────────────────────────────
export const ageBucket = (D) => AGE_BUCKETS.find((b) => b.k === D.idade) || null;
export const ageNum = (D) => (ageBucket(D) ? ageBucket(D).rep : 0);
export const ageRange = (D) => (ageBucket(D) ? ageBucket(D).r : "");
export const sonoInsuf = (D) => { const v = parseFloat((D.sonoH || "").replace(",", ".")); return !isNaN(v) && v < 6; };
export const cafExc = (D) => parseInt((D.caf || "").replace(/[^0-9]/g, "")) >= 4;
export const getDrCls = (drug) => { const c = DRGCLS.filter((x) => x.drugs.indexOf(drug) >= 0); return c.length ? c[0].cls : "Outro"; };

// ── Motor de hipóteses (porte exato do rDisc) ───────────────────────────────
export function pontuar(D) {
  const age = ageNum(D);
  const sI = sonoInsuf(D);
  const cE = cafExc(D);

  const sym = (id) => has(D.sym, id);
  const alm = (id) => has(D.alm, id);
  const ant = (id) => has(D.ant, id);
  const drg = (cls) => D.cDr.some((d) => DRGCLS.some((x) => x.cls === cls && x.drugs.indexOf(d) >= 0));

  const H = [];

  // ── Depressão ──
  (() => {
    const card = sym("humor"), aned = sym("aned");
    const pos = [], neg = []; let scor = 0, fail = false;
    if (card) { pos.push("humor deprimido"); scor += 4; }
    if (aned) { pos.push(D._symSub["aned"] === "total" ? "anedonia total" : "anedonia parcial"); scor += D._symSub["aned"] === "total" ? 4 : 2; }
    if (sym("inson") && (D._symSub["inson"] === "term" || D._symSub["inson"] === "mist")) { pos.push("insónia terminal"); scor += 2; }
    else if (sym("inson")) { pos.push("insónia"); scor += 1; }
    if (sym("ano")) { pos.push("anorexia"); scor += 2; }
    if (sym("concen")) { pos.push("dificuldade de concentração"); scor += 2; }
    if (sym("libido")) { pos.push("perda de libido"); scor += 2; }
    if (sym("irrit")) { pos.push("irritabilidade"); scor += 1; }
    if (sym("hipson")) { pos.push("hipersónia (depressão atípica)"); scor += 2; }
    if (D.padrao === "manha") { pos.push("pior de manhã (padrão típico)"); scor += 2; }
    if (ant("dep")) { const subT = D._symSub["dep"]; pos.push("episódio depressivo prévio" + (subT === "recorr" ? " recorrente" : subT === "dist" ? " (distimia)" : "")); scor += subT === "recorr" ? 3 : 2; }
    if (D.dur === "cronica") { pos.push("evolução crónica"); scor += 1; }
    if (D.repouso === false) { pos.push("não melhora com repouso"); scor += 1; }
    if (!card) neg.push("sem humor deprimido");
    if (!aned) neg.push("sem anedonia");
    if (!sym("inson") && D.sonoQ !== "mau") neg.push("sono sem alteração");
    if (sym("icalor")) neg.push("intolerância ao calor (sugere o contrário, hipertireoidismo)");
    const hasCard = card || aned;
    if (!hasCard && pos.length < 2) return;
    if (!hasCard) fail = true;
    const triade = card && aned && sym("inson");
    if (scor >= 3 || (!hasCard && pos.length >= 2)) {
      H.push({ id: "dep", l: "Depressão major", scor, pos, neg, fail, triade: triade ? DISC.triades.dep : null, failMsg: fail ? DISC.failMsgs.dep : null });
    }
  })();

  // ── Ansiedade ──
  (() => {
    const card = sym("ansied");
    const pos = [], neg = []; let scor = 0, fail = false;
    if (card) { pos.push("ansiedade/preocupação"); scor += 4; }
    if (sym("palp")) { pos.push("palpitações"); scor += 2; }
    if (sym("inson") && D._symSub["inson"] === "ini") { pos.push("insónia inicial"); scor += 2; }
    else if (sym("inson")) { pos.push("insónia"); scor += 1; }
    if (sym("irrit")) { pos.push("irritabilidade"); scor += 1; }
    if (sym("concen")) { pos.push("dificuldade de concentração"); scor += 1; }
    if (D.acr.f === "taq") { pos.push("taquicardia ao EO"); scor += 1; }
    if (cE) { pos.push("cafeína excessiva (agrava)"); scor += 1; }
    if (D.dur === "cronica") { pos.push("evolução crónica"); scor += 1; }
    if (!card) neg.push("sem queixa ansiosa referida");
    if (sym("icalor")) neg.push("intolerância ao calor (pensar hipertireoidismo)");
    if (!card && pos.length < 2) return;
    if (!card) fail = true;
    if (scor >= 3 || (!card && pos.length >= 2)) {
      H.push({ id: "ans", l: "Perturbação de ansiedade", scor, pos, neg, fail, failMsg: fail ? DISC.failMsgs.ans : null });
    }
  })();

  // ── SAOS ──
  (() => {
    const card = sym("ronco") || sym("apneia") || sym("sdiur");
    const pos = [], neg = []; let scor = 0, fail = false;
    if (sym("ronco")) { pos.push("roncopatia"); scor += 3; }
    if (sym("apneia")) { pos.push("apneias testemunhadas"); scor += 4; }
    if (sym("sdiur")) { pos.push("sonolência diurna"); scor += 3; }
    if (sym("snrep")) { pos.push("sono não reparador"); scor += 2; }
    if (sym("hipson")) { pos.push("hipersónia (dorme muito mas cansado)"); scor += 2; }
    if (sym("cefal") && D._symSub["cefal"] === "mat") { pos.push("cefaleias matinais"); scor += 2; }
    if (sym("concen")) { pos.push("dificuldade de concentração (fragmentação do sono)"); scor += 1; }
    if (D.obeso === "ob") { pos.push("obesidade"); scor += 2; }
    if (age >= 50) { pos.push("idade ≥50 anos"); scor += 1; }
    if (D.sexo === "M") { pos.push("sexo masculino"); scor += 1; }
    if (ant("hta")) { pos.push("HTA (pode ser refractária por SAOS)"); scor += 1; }
    if (ant("fa")) { pos.push("fibrilhação auricular (associação reconhecida)"); scor += 1; }
    if (ant("saos")) { pos.push("SAOS diagnosticada"); scor += 3; }
    if (!sym("ronco")) neg.push("sem roncopatia");
    if (!sym("apneia")) neg.push("sem apneias testemunhadas");
    if (!sym("sdiur")) neg.push("sem sonolência diurna");
    if (D.obeso === "nl") neg.push("sem obesidade");
    if (!card && pos.length < 2) return;
    if (!card) fail = true;
    const triade = sym("ronco") && sym("apneia") && sym("sdiur");
    if (scor >= 3 || (!card && pos.length >= 2)) {
      H.push({ id: "saos", l: "SAOS", scor, pos, neg, fail, triade: triade ? DISC.triades.saos : null, failMsg: fail ? DISC.failMsgs.saos : null });
    }
  })();

  // ── Hipotiroidismo ──
  (() => {
    const card = sym("ifrio") || sym("pseca") || sym("qcab") || sym("obst") || sym("ppeso") || sym("edfac") || D.tir === "tir_boc" || D.tir === "tir_nod";
    const pos = [], neg = []; let scor = 0, fail = false;
    if (sym("ifrio")) { pos.push("intolerância ao frio"); scor += 3; }
    if (sym("pseca")) { pos.push("pele seca"); scor += 2; }
    if (sym("qcab")) { pos.push("queda de cabelo"); scor += 2; }
    if (sym("obst")) { pos.push("obstipação"); scor += 2; }
    if (sym("ppeso")) { pos.push("aumento de peso"); scor += 2; }
    if (sym("edfac")) { pos.push("edema facial"); scor += 3; }
    if (sym("menor")) { pos.push("menorragia (hipo causa alterações menstruais)"); scor += 1; }
    if (sym("concen")) { pos.push("lentificação cognitiva"); scor += 1; }
    if (sym("humor")) { pos.push("humor deprimido (hipo mimetiza depressão)"); scor += 1; }
    if (D.acr.f === "bra") { pos.push("bradicardia"); scor += 2; }
    if (D.tir === "tir_boc" || D.tir === "tir_nod") { pos.push("bócio/nódulo palpável"); scor += 3; }
    if (D.sexo === "F" && age >= 40) { pos.push("mulher ≥40 (risco aumentado autoimune tiroideia)"); scor += 1; }
    if (ant("hip")) { pos.push("hipotiroidismo prévio"); scor += 4; }
    if (D.hxFam && D.hxFam.tir) { pos.push("hist. familiar tiroideia"); scor += 1; }
    if (sym("icalor")) neg.push("intolerância ao calor (sugere o contrário)");
    if (D.acr.f === "taq") neg.push("taquicardia (sugere o contrário)");
    if (sym("ppni") && D._symSub["ppni"] === "nint") neg.push("perda de peso (sugere hipertireoidismo)");
    if (!card) { if (pos.length < 2) return; fail = true; }
    const triade = sym("ifrio") && sym("pseca") && (sym("obst") || sym("qcab"));
    if (scor >= 3 || (!card && pos.length >= 2)) {
      H.push({ id: "hipo", l: "Hipotiroidismo", scor, pos, neg, fail, triade: triade ? DISC.triades.hipo : null, failMsg: fail ? DISC.failMsgs.hipo : null });
    }
  })();

  // ── Anemia ──
  (() => {
    const pos = [], neg = []; let scor = 0;
    if (has(D.muc, "desc")) { pos.push("mucosas descoradas"); scor += 4; }
    if (sym("palp")) { pos.push("palpitações"); scor += 1; }
    if (sym("disp") && D._symSub["disp"] === "esf") { pos.push("dispneia de esforço"); scor += 2; }
    if (sym("pinq")) { pos.push("pernas inquietas (sugestivo de défice ferro)"); scor += 2; }
    if (sym("menor")) { pos.push("menorragia (causa frequente em mulher pré-menopausa)"); scor += 3; }
    if (D.dieta === "veg_ns") { pos.push("vegetariano/vegan sem suplementação"); scor += 2; }
    if (D.dieta === "restritiva") { pos.push("dieta restritiva"); scor += 1; }
    if (D.alc === "excessivo") { pos.push("álcool excessivo (défice B12/folato)"); scor += 1; }
    if (ant("anemia")) { pos.push("anemia conhecida"); scor += 3; }
    if (ant("hip")) { pos.push("hipotiroidismo (anemia macrocítica frequente)"); scor += 1; }
    if (ant("irc")) { pos.push("IRC (défice de eritropoetina)"); scor += 2; }
    if (ant("neoP")) { pos.push("neoplasia prévia (anemia de doença crónica)"); scor += 1; }
    if (sym("sangf")) { pos.push("sangue nas fezes"); scor += 3; }
    if (D.padrao === "fimdia") { pos.push("pior ao fim do dia (típico de causa orgânica)"); scor += 1; }
    if (!has(D.muc, "desc")) neg.push("mucosas coradas");
    if (!sym("palp") && !sym("disp")) neg.push("sem palpitações nem dispneia");
    if (D.dieta === "equilibrada" && !sym("menor") && !sym("sangf")) neg.push("dieta equilibrada, sem perdas evidentes");
    if (scor >= 3) H.push({ id: "anem", l: "Anemia", scor, pos, neg, fail: false });
  })();

  // ── DM descompensada ──
  (() => {
    if (!ant("dm")) return;
    const pos = ["diabetes nos antecedentes"], neg = []; let scor = 4;
    if (sym("poliu")) { pos.push("poliúria"); scor += 2; }
    if (sym("polid")) { pos.push("polidipsia"); scor += 2; }
    if (sym("ppni") && D._symSub["ppni"] === "nint") { pos.push("perda de peso não intencional"); scor += 2; }
    if (sym("parest")) { pos.push("parestesias"); scor += 1; }
    if (sym("altvis")) { pos.push("alterações visuais"); scor += 1; }
    H.push({ id: "dm", l: "Diabetes descompensada", scor, pos, neg, fail: false });
  })();

  // ── IC ──
  (() => {
    const hasIcAP = ant("ic");
    if (age < 50 && !hasIcAP) return;
    const pos = [], neg = []; let scor = 0;
    if (sym("orto")) { pos.push("ortopneia"); scor += 4; }
    if (sym("dpn")) { pos.push("dispneia paroxística nocturna"); scor += 4; }
    if (sym("edem") && (D._symSub["edem"] === "mi" || D._symSub["edem"] === "gen")) { pos.push("edemas dos membros inferiores"); scor += 3; }
    if (sym("disp") && D._symSub["disp"] === "esf") { pos.push("dispneia de esforço"); scor += 2; }
    if (has(D.apr.ra, "Crepitações")) { pos.push("crepitações basais"); scor += 3; }
    if (D.acr.s === "sim") { pos.push("sopro auscultado"); scor += 2; }
    if (D.padrao === "fimdia") { pos.push("pior ao fim do dia (típico orgânico)"); scor += 1; }
    if (hasIcAP) { pos.push("IC nos antecedentes"); scor += 4; }
    if (ant("fa")) { pos.push("fibrilhação auricular"); scor += 2; }
    if (ant("hta")) { pos.push("HTA (factor de risco)"); scor += 1; }
    if (ant("dm")) { pos.push("DM (factor de risco, sobretudo IC-FEp)"); scor += 1; }
    if (ant("irc")) { pos.push("IRC (síndrome cardiorrenal)"); scor += 1; }
    if (age >= 70) { pos.push("idade ≥70 anos"); scor += 1; }
    if (!sym("orto")) neg.push("sem ortopneia");
    if (!sym("dpn")) neg.push("sem dispneia paroxística nocturna");
    if (!sym("edem")) neg.push("sem edemas");
    const hasCardSym = sym("orto") || sym("dpn") || sym("edem");
    if (!hasCardSym && !hasIcAP) return;
    const triade = sym("orto") && sym("dpn") && sym("edem");
    if (scor >= 3) {
      H.push({ id: "ic", l: "Insuficiência cardíaca", scor, pos, neg, fail: false, triade: triade ? DISC.triades.ic : null });
    }
  })();

  // ── Neoplasia ──
  (() => {
    const pos = [], neg = []; let scor = 0;
    let sintomasB = 1; // cansaço já conta
    if (alm("ppe")) { pos.push("perda ponderal > 5%"); scor += 4; sintomasB++; }
    if (alm("sudn")) { pos.push("sudorese nocturna"); scor += 4; sintomasB++; }
    if (alm("febp")) { pos.push("febre persistente"); scor += 3; sintomasB++; }
    if (alm("adeno")) { pos.push("adenopatias suspeitas"); scor += 4; }
    if (sym("ano")) { pos.push("anorexia"); scor += 2; }
    if (sym("sangf")) { pos.push("sangue nas fezes"); scor += 3; }
    if (has(D.abd, "hepato")) { pos.push("hepatomegalia"); scor += 2; }
    if (has(D.abd, "espleno")) { pos.push("esplenomegalia"); scor += 2; }
    if (has(D.abd, "massa")) { pos.push("massa abdominal palpável"); scor += 4; }
    if (D.adeno.length) { pos.push("adenopatias ao EO"); scor += 3; }
    if (ant("neoP")) { pos.push("neoplasia prévia"); scor += 3; }
    if (D.hxFam && D.hxFam.neo) { pos.push("hist. familiar neoplasia"); scor += 1; }
    if (age >= 65) { pos.push("idade ≥65 anos"); scor += 1; }
    if (age >= 70 && D.sexo === "M") { pos.push("homem ≥70 anos (White 2025)"); scor += 2; }
    if (D.dur === "cronica") { pos.push("evolução crónica/arrastada"); scor += 1; }
    if (!alm("ppe") && !alm("sudn") && !alm("febp") && !alm("adeno")) neg.push("sem alarmes constitucionais");
    if (age < 40 && !ant("neoP")) neg.push("idade jovem sem antecedentes");
    if (D.dur === "aguda") neg.push("início recente (atípico para neoplasia)");
    if (age < 40 && !ant("neoP") && pos.length < 2) return;
    if (scor < 3) return;
    let nota = null;
    if (age < 40 && sintomasB >= 2) nota = DISC.notas.neoJovem;
    else if (age >= 70 && D.sexo === "M" && !alm("ppe") && !alm("sudn") && !alm("febp") && !alm("adeno")) nota = DISC.notas.neoIdoso;
    else if (sintomasB >= 3) nota = DISC.notas.neoB;
    const triade = sintomasB >= 3 ? DISC.triades.neo : null;
    H.push({ id: "neo", l: age < 40 && sintomasB >= 2 ? "Linfoma / doença linfoproliferativa" : "Suspeita de neoplasia", scor, pos, neg, fail: false, triade, nota });
  })();

  // ── Causa medicamentosa ──
  (() => {
    if (D.nDr || !D.cDr.length) return;
    const pos = [], neg = []; let scor = 0;
    const classes = DRGCLS.filter((cls) => drg(cls.cls)).map((c) => c.cls);
    if (!classes.length) return;
    classes.forEach((c) => { pos.push(c.toLowerCase()); scor += 3; });
    if (classes.length >= 2) { pos.push("polimedicação relevante (≥2 classes)"); scor += 2; }
    if (age >= 65) { pos.push("idoso (mais sensível a efeitos adversos)"); scor += 1; }
    if (D.dur === "aguda") { pos.push("início recente (relação temporal possível)"); scor += 1; }
    H.push({ id: "farm", l: "Causa medicamentosa", scor, pos, neg, fail: false });
  })();

  // ── Doença autoimune ──
  (() => {
    const pos = [], neg = []; let scor = 0;
    if (sym("artr")) { pos.push("artralgias"); scor += 2; }
    if (sym("rigid")) { pos.push("rigidez matinal > 30 min"); scor += 3; }
    if (sym("mialg")) { pos.push("mialgias"); scor += 1; }
    if (sym("qcab")) { pos.push("queda de cabelo"); scor += 1; }
    if (has(D.pele, "rash")) { pos.push("rash cutâneo"); scor += 3; }
    if (has(D.pele, "foto")) { pos.push("fotossensibilidade"); scor += 2; }
    if (ant("les")) { pos.push("LES nos antecedentes"); scor += 4; }
    if (ant("ar")) { pos.push("AR nos antecedentes"); scor += 4; }
    if (D.hxFam && D.hxFam.auto) { pos.push("hist. familiar autoimune"); scor += 1; }
    if (D.sexo === "F" && age < 50 && (has(D.pele, "rash") || has(D.pele, "foto"))) { pos.push("mulher jovem com manifestações cutâneas (suspeita LES)"); scor += 2; }
    if (age >= 50 && sym("rigid") && sym("mialg") && D._symSub["mialg"] === "prox") { pos.push(">50 anos com rigidez de cintura (suspeita polimialgia reumática)"); scor += 3; }
    if (!sym("artr") && !sym("rigid")) neg.push("sem queixas articulares");
    if (!has(D.pele, "rash")) neg.push("sem rash");
    if (scor < 3) return;
    H.push({ id: "auto", l: "Doença autoimune", scor, pos, neg, fail: false });
  })();

  // ── EM/SFC ──
  (() => {
    const pem = sym("pem");
    const cron6m = D.dur === "cronica" && parseFloat((D.durT || "").replace(",", ".")) >= 6;
    if (!pem && !(cron6m && D.repouso === false)) return;
    const pos = [], neg = []; let scor = 0;
    if (pem) { pos.push("mal-estar pós-esforço (PEM)"); scor += 5; }
    if (cron6m) { pos.push("evolução > 6 meses"); scor += 2; }
    if (D.repouso === false) { pos.push("não melhora com repouso"); scor += 2; }
    if (sym("snrep")) { pos.push("sono não reparador"); scor += 2; }
    if (sym("concen")) { pos.push("brain fog (dificuldade de concentração)"); scor += 2; }
    if (sym("mialg") && D._symSub["mialg"] === "dif") { pos.push("dor difusa"); scor += 1; }
    if (D.infRec === "sim") { pos.push("infecção viral prévia"); scor += 1; }
    if (!pem) neg.push("sem mal-estar pós-esforço");
    if (D.repouso === true) neg.push("melhora com repouso (atípico para EM/SFC)");
    if (D.dur === "aguda") neg.push("evolução aguda (atípica)");
    if (scor >= 4) H.push({ id: "em", l: "EM/SFC (encefalomielite miálgica / síndrome de fadiga crónica)", scor, pos, neg, fail: false });
  })();

  // ── Pós-infecciosa genérica ──
  (() => {
    if (D.infRec !== "sim") return;
    const hasMono = D.infRash === true || (D.infAdeno === true && D.infOque === "amig");
    if (hasMono || D.infExpo === true || D.infIct === true || (D.infOque === "covid" && (D.infQuando === "1-3m" || D.infQuando === "3m"))) return;
    const pos = ["infecção recente referida"]; let scor = 3;
    if (D.infQuando === "1-2sem") pos.push("infecção há 1-2 semanas (evolução esperada)");
    if (D.infQuando === "2-4sem") { pos.push("fadiga > 2-4 semanas pós-infecção"); scor += 1; }
    if (D.infQuando === "1-3m") { pos.push("fadiga > 1 mês pós-infecção"); scor += 2; }
    if (D.infQuando === "3m") { pos.push("fadiga prolongada > 3 meses"); scor += 3; }
    H.push({ id: "pinf", l: "Fadiga pós-infecciosa", scor, pos, neg: [], fail: false });
  })();

  // ── Mononucleose ──
  (() => {
    if (D.infRec !== "sim") return;
    const hasRash = D.infRash === true;
    const hasMonoSign = D.infAdeno === true && (D.infOque === "amig" || D.infOque === "outra") && age >= 15 && age <= 30;
    if (!hasRash && !hasMonoSign) return;
    const pos = [], neg = []; let scor = 4;
    if (hasRash) { pos.push("rash com amoxicilina (altamente sugestivo de EBV)"); scor += 4; }
    if (D.infOque === "amig") { pos.push("amigdalite recente"); scor += 2; }
    if (D.infAdeno === true) { pos.push("adenopatias cervicais"); scor += 2; }
    if (age >= 15 && age <= 30) { pos.push("faixa etária típica (15-30 anos)"); scor += 1; }
    if (has(D.abd, "espleno")) { pos.push("esplenomegalia ao EO (clássico)"); scor += 3; }
    if (has(D.abd, "hepato")) { pos.push("hepatomegalia ao EO"); scor += 2; }
    if (D.infIct === true) { pos.push("icterícia ligeira (hepatite associada frequente)"); scor += 2; }
    if (age > 30) neg.push("fora da faixa etária típica");
    H.push({ id: "mono", l: "Mononucleose (EBV)", scor, pos, neg, fail: false, nota: DISC.notas.mono });
  })();

  // ── VIH ──
  (() => {
    if (D.infRec !== "sim" || D.infExpo !== true) return;
    const pos = ["exposição de risco referida"]; let scor = 5;
    if (D.infQuando === "1-2sem" || D.infQuando === "2-4sem") { pos.push("quadro viral agudo recente (primoinfecção)"); scor += 2; }
    if (alm("febp")) { pos.push("febre persistente"); scor += 1; }
    if (alm("adeno")) { pos.push("adenopatias"); scor += 2; }
    if (alm("ppe")) { pos.push("perda ponderal"); scor += 1; }
    if (has(D.pele, "rash")) { pos.push("rash cutâneo"); scor += 1; }
    H.push({ id: "vih", l: "VIH (primoinfecção ou crónico)", scor, pos, neg: [], fail: false, nota: DISC.notas.vih });
  })();

  // ── Hepatite vírica ──
  (() => {
    if (D.infRec !== "sim" || D.infIct !== true) return;
    const pos = ["icterícia pós-infecção"]; let scor = 5;
    if (D.alc === "excessivo") { pos.push("álcool excessivo"); scor += 2; }
    if (D.infExpo === true) { pos.push("exposição de risco"); scor += 2; }
    if (has(D.abd, "hepato")) { pos.push("hepatomegalia"); scor += 2; }
    if (ant("hep")) { pos.push("hepatite crónica conhecida"); scor += 3; }
    H.push({ id: "hep", l: "Hepatite vírica", scor, pos, neg: [], fail: false, nota: DISC.notas.hep });
  })();

  // ── Long COVID ──
  (() => {
    if (D.infRec !== "sim" || D.infOque !== "covid") return;
    if (D.infQuando !== "1-3m" && D.infQuando !== "3m") return;
    const pos = ["COVID-19 confirmado", "fadiga " + (D.infQuando === "1-3m" ? "1-3 meses" : "> 3 meses") + " pós-COVID"];
    let scor = 5;
    if (sym("pem")) { pos.push("mal-estar pós-esforço"); scor += 3; }
    if (sym("concen")) { pos.push("brain fog"); scor += 2; }
    if (sym("disp")) { pos.push("dispneia residual"); scor += 1; }
    if (sym("palp")) { pos.push("palpitações"); scor += 1; }
    H.push({ id: "lc", l: "Long COVID", scor, pos, neg: [], fail: false, nota: DISC.notas.lc });
  })();

  // ── Funcionais ──
  (() => {
    if (!(sI || D.sonoQ === "mau")) return;
    const pos = []; let scor = 3;
    if (sI) { pos.push("sono < 6h/noite"); scor += 2; }
    if (D.sonoQ === "mau") { pos.push("sono não reparador"); scor += 2; }
    H.push({ id: "func_sono", l: "Privação de sono", func: true, scor, pos, neg: [], fail: false });
  })();
  (() => {
    if (D.exe !== "sedentario") return;
    const pos = ["sedentarismo"]; let scor = 3;
    if (sym("disp") && D._symSub["disp"] === "esf") { pos.push("dispneia ao mínimo esforço (descondicionamento)"); scor += 2; }
    H.push({ id: "func_sed", l: "Sedentarismo / descondicionamento", func: true, scor, pos, neg: [], fail: false });
  })();
  (() => {
    if (!cE) return;
    const pos = ["consumo elevado de cafeína"]; let scor = 3;
    if (sym("inson")) { pos.push("insónia associada"); scor += 2; }
    if (sym("ansied")) { pos.push("ansiedade associada"); scor += 1; }
    H.push({ id: "func_caf", l: "Cafeína excessiva", func: true, scor, pos, neg: [], fail: false });
  })();
  (() => {
    if (D.alc !== "excessivo") return;
    const pos = ["álcool excessivo"]; let scor = 3;
    if (D.sonoQ === "mau") { pos.push("sono fragmentado (álcool reduz REM)"); scor += 1; }
    if (sym("humor")) { pos.push("humor deprimido associado"); scor += 1; }
    H.push({ id: "func_alc", l: "Álcool problemático", func: true, scor, pos, neg: [], fail: false });
  })();
  (() => {
    if (D.dieta !== "veg_ns" && D.dieta !== "restritiva") return;
    const pos = []; let scor = 3;
    if (D.dieta === "veg_ns") pos.push("vegetariano/vegan sem suplementação");
    if (D.dieta === "restritiva") pos.push("dieta restritiva");
    if (has(D.muc, "desc")) { pos.push("mucosas descoradas"); scor += 2; }
    H.push({ id: "func_diet", l: "Dieta inadequada / défices nutricionais", func: true, scor, pos, neg: [], fail: false });
  })();
  (() => {
    if (D.exe !== "excessivo") return;
    const pos = ["exercício excessivo sem recuperação"]; let scor = 3;
    if (sym("inson")) { pos.push("insónia"); scor += 1; }
    if (sym("irrit")) { pos.push("irritabilidade"); scor += 1; }
    H.push({ id: "func_over", l: "Overtraining", func: true, scor, pos, neg: [], fail: false });
  })();
  (() => {
    if (sym("humor") || sym("aned")) return;
    if (!sym("ansied")) return;
    const pos = ["sintomas de sobrecarga (ansiedade)"]; let scor = 2;
    if (sym("irrit")) { pos.push("irritabilidade"); scor += 1; }
    if (sym("inson")) { pos.push("insónia"); scor += 1; }
    if (sym("concen")) { pos.push("dificuldade de concentração"); scor += 1; }
    if (scor >= 3) H.push({ id: "func_burn", l: "Sobrecarga / burnout", func: true, scor, pos, neg: [], fail: false });
  })();

  // ── ordenar + factores contribuintes ──
  const isContrib = (d) => d.func === true || d.id === "farm";
  const organicH = H.filter((x) => !isContrib(x));
  const contribH = H.filter(isContrib);
  const passing = organicH.filter((x) => !x.fail).sort((a, b) => b.scor - a.scor);
  const failing = organicH.filter((x) => x.fail).sort((a, b) => b.scor - a.scor);
  const ordered = passing.concat(failing);

  const factores = [];
  contribH.forEach((d) => {
    if (d.id === "farm") return;
    const ex = DISC.habExpl[d.id];
    if (ex) factores.push({ tipo: "hab", name: ex.name, txt: ex.txt, id: d.id });
  });
  if (contribH.some((x) => x.id === "farm")) {
    DRGCLS.forEach((cls) => {
      if (drg(cls.cls)) factores.push({ tipo: "farm", name: cls.cls, txt: DISC.farmExpl[cls.cls] || cls.mech, id: "farm_" + cls.cls });
    });
  }
  D.ant.forEach((a) => {
    const ex = DISC.antExpl[a];
    if (ex) factores.push({ tipo: "ant", name: ex.name, txt: ex.txt, id: "ant_" + a });
  });

  return { ordered, factores };
}

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
