// ============================================================================
// LÓGICA — Curvas de crescimento (OMS). Método LMS. Fiel ao original.
// Dados (AGE_MONTHS, LMS_W/H/HC) em /conteudo/saude-infantil/crescimento.json
// ============================================================================

// Interpola os parâmetros L, M, S de uma tabela para uma idade (meses).
export function getLMS2(T, s, age) {
  const keys = Object.keys(T[s]).map(Number).sort((a, b) => a - b);
  const a = Math.max(0, Math.min(age, 228));
  let k0 = keys[0], k1 = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] <= a && keys[i + 1] >= a) { k0 = keys[i]; k1 = keys[i + 1]; break; }
  }
  if (k0 === k1) { const r = T[s][k0]; return { L: r[0], M: r[1], S: r[2] }; }
  const t = (a - k0) / (k1 - k0), r0 = T[s][k0], r1 = T[s][k1];
  return { L: r0[0] + (r1[0] - r0[0]) * t, M: r0[1] + (r1[1] - r0[1]) * t, S: r0[2] + (r1[2] - r0[2]) * t };
}

export function zToVal(L, M, S, z) { return L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L); }
export function valToZ(L, M, S, X) { return L === 0 ? Math.log(X / M) / S : (Math.pow(X / M, L) - 1) / (L * S); }

// z-score → percentil (aproximação de erf)
export function zToP2(z) {
  const s = z < 0 ? -1 : 1, p = 0.3275911;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const t = 1 / (1 + p * Math.abs(z));
  const e = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  return Math.round(Math.min(99, Math.max(1, (0.5 * (1 + s * e)) * 100)));
}

export function interpPercText(tipo, p) {
  if (p < 3) return { t: "Abaixo do P3", d: tipo === "imc" ? "Magreza — avaliar causa" : "Abaixo do esperado — investigar", c: "#dc2626" };
  if (p <= 10) return { t: "P3 a P10", d: "Faixa baixa — monitorizar tendência", c: "#d97706" };
  if (p <= 85) return { t: "Normal", d: tipo === "imc" ? "IMC normal para a idade e sexo" : "Dentro do intervalo normal (P10-P85)", c: "#059669" };
  if (p <= 97) return { t: "P85 a P97", d: tipo === "imc" ? "Excesso de peso — orientar alimentação e atividade física" : "Valor elevado — avaliar em conjunto com outros parâmetros", c: "#d97706" };
  return { t: tipo === "imc" ? "Obesidade — acima de P97" : "Acima do P97", d: tipo === "imc" ? "Referenciação a Pediatria/Nutrição. Investigar comorbilidades." : "Valor muito elevado", c: "#dc2626" };
}

function refCurve(table, sexo, zVal, ageStart, ageEnd, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const age = ageStart + (ageEnd - ageStart) * i / steps;
    const lms = getLMS2(table, sexo, age);
    pts.push({ x: age, y: zToVal(lms.L, lms.M, lms.S, zVal) });
  }
  return pts;
}

// Constrói o SVG do gráfico (porta de drawGrowthChart; devolve string).
export function construirGraficoSVG(table, sexo, dataPoints, title, ageStart, ageEnd, W = 320) {
  const H = 220, PAD = { top: 20, right: 30, bottom: 36, left: 40 };
  const CW = W - PAD.left - PAD.right, CH = H - PAD.top - PAD.bottom;
  const REFS = [
    { z: -1.88, p: "P3", c: "#fca5a5", dash: "4,3" },
    { z: -1.04, p: "P15", c: "#fdba74", dash: "3,3" },
    { z: 0, p: "P50", c: "#86efac", dash: "0" },
    { z: 1.04, p: "P85", c: "#fdba74", dash: "3,3" },
    { z: 1.88, p: "P97", c: "#fca5a5", dash: "4,3" },
  ];
  let yMin = Infinity, yMax = -Infinity;
  REFS.forEach((r) => [ageStart, ageEnd].forEach((age) => { const lms = getLMS2(table, sexo, age); const v = zToVal(lms.L, lms.M, lms.S, r.z); if (v < yMin) yMin = v; if (v > yMax) yMax = v; }));
  dataPoints.forEach((d) => { if (d.y > 0) { if (d.y < yMin) yMin = d.y; if (d.y > yMax) yMax = d.y; } });
  const yPad = (yMax - yMin) * 0.1; yMin = Math.max(0, yMin - yPad); yMax = yMax + yPad;
  const sx = (a) => PAD.left + (a - ageStart) / (ageEnd - ageStart) * CW;
  const sy = (v) => PAD.top + CH - (v - yMin) / (yMax - yMin) * CH;
  const polyline = (pts, c, dash, w) => {
    const d = pts.map((p, i) => (i === 0 ? "M" : "L") + sx(p.x).toFixed(1) + "," + sy(p.y).toFixed(1)).join(" ");
    const da = dash !== "0" ? ` stroke-dasharray='${dash}'` : "";
    return `<path d='${d}' fill='none' stroke='${c}' stroke-width='${w || 1.5}'${da}/>`;
  };
  let grid = "", xlab = "", ylab = "";
  for (let i = 0; i <= 5; i++) { const yv = yMin + (yMax - yMin) * i / 5; const yp = sy(yv); grid += `<line x1='${PAD.left}' y1='${yp.toFixed(1)}' x2='${PAD.left + CW}' y2='${yp.toFixed(1)}' stroke='#f0f0ee' stroke-width='1'/>`; ylab += `<text x='${PAD.left - 4}' y='${(yp + 4).toFixed(1)}' text-anchor='end' font-size='9' fill='#a8a29e'>${yv.toFixed(1)}</text>`; }
  let xTicks = ageEnd <= 24 ? [0, 3, 6, 9, 12, 15, 18, 21, 24] : ageEnd <= 60 ? [0, 12, 24, 36, 48, 60] : [0, 24, 48, 72, 96, 120, 144, 168, 192, 216];
  xTicks = xTicks.filter((t) => t >= ageStart && t <= ageEnd);
  xTicks.forEach((t) => { const xp = sx(t); const lb = t < 24 ? t + "M" : (t / 12) + "A"; xlab += `<line x1='${xp.toFixed(1)}' y1='${PAD.top + CH}' x2='${xp.toFixed(1)}' y2='${PAD.top + CH + 4}' stroke='#d6d3d1' stroke-width='1'/><text x='${xp.toFixed(1)}' y='${PAD.top + CH + 14}' text-anchor='middle' font-size='9' fill='#a8a29e'>${lb}</text>`; });
  let refSVG = "";
  REFS.forEach((r) => { const pts = refCurve(table, sexo, r.z, ageStart, ageEnd, 60); refSVG += polyline(pts, r.c, r.dash, 1.5); const lp = pts[pts.length - 1]; refSVG += `<text x='${sx(lp.x) + 2}' y='${(sy(lp.y) + 4).toFixed(1)}' font-size='8' fill='${r.c}' font-weight='600'>${r.p}</text>`; });
  let dataSVG = "";
  const valid = dataPoints.filter((d) => d.y > 0 && d.x >= ageStart && d.x <= ageEnd);
  if (valid.length > 1) { const lp2 = valid.map((p, i) => (i === 0 ? "M" : "L") + sx(p.x).toFixed(1) + "," + sy(p.y).toFixed(1)).join(" "); dataSVG += `<path d='${lp2}' fill='none' stroke='#1c1917' stroke-width='2' stroke-linecap='round'/>`; }
  valid.forEach((d) => { const lms = getLMS2(table, sexo, d.x); const pp = zToP2(valToZ(lms.L, lms.M, lms.S, d.y)); const dc = pp < 3 || pp > 97 ? "#dc2626" : pp < 10 || pp > 90 ? "#d97706" : "#059669"; const cx = sx(d.x).toFixed(1); const cy = sy(d.y).toFixed(1); dataSVG += `<circle cx='${cx}' cy='${cy}' r='4' fill='${dc}' stroke='white' stroke-width='1.5'/><text x='${cx}' y='${parseFloat(cy) - 8}' text-anchor='middle' font-size='8' fill='${dc}' font-weight='700'>P${pp}</text>`; });
  return `<svg viewBox='0 0 ${W} ${H}' xmlns='http://www.w3.org/2000/svg' style='width:100%;height:auto;display:block'><rect width='${W}' height='${H}' fill='white' rx='8'/><text x='${PAD.left + CW / 2}' y='14' text-anchor='middle' font-size='10' fill='#78716c' font-weight='700' font-family='Plus Jakarta Sans,sans-serif'>${title}</text>${grid}${xlab}${ylab}<line x1='${PAD.left}' y1='${PAD.top}' x2='${PAD.left}' y2='${PAD.top + CH}' stroke='#d6d3d1' stroke-width='1.5'/><line x1='${PAD.left}' y1='${PAD.top + CH}' x2='${PAD.left + CW}' y2='${PAD.top + CH}' stroke='#d6d3d1' stroke-width='1.5'/>${refSVG}${dataSVG}</svg>`;
}
