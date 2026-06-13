// Lógica pura do EasyFarm — sem dados clínicos embutidos. Recebe o conteúdo
// (importado de @conteudo/easyfarm) como argumento. Porta de farmacos-v4.html
// (facets/filtered) e da calculadora pediátrica (renderPedTable).
import { normalizar } from "@/lib/texto";

// ── ÍNDICE: facetas e filtragem ──────────────────────────────────────────────

// Conta ocorrências por sistema, classe (chave→{label,count}) e indicação.
export function facetas(farmacos) {
  const sistemas = new Map();
  const classes = new Map();
  const indicacoes = new Map();
  for (const f of farmacos) {
    sistemas.set(f.sistema, (sistemas.get(f.sistema) || 0) + 1);
    const c = classes.get(f.classeKey) || { label: f.classe, count: 0 };
    c.count++;
    classes.set(f.classeKey, c);
    for (const i of f.indicacoes) indicacoes.set(i, (indicacoes.get(i) || 0) + 1);
  }
  return {
    sistemas: [...sistemas].map(([nome, count]) => ({ nome, count })),
    classes: [...classes].map(([key, v]) => ({ key, label: v.label, count: v.count })),
    indicacoes: [...indicacoes].map(([nome, count]) => ({ nome, count })),
  };
}

// Filtra por pesquisa livre (DCI, classe, marcas, indicações) + filtros aplicados
// (conjuntos de sistema / classeKey / indicação). Vazio = sem restrição.
export function filtrarFarmacos(farmacos, { query = "", sistema, classe, indicacao } = {}) {
  const q = normalizar(query).trim();
  const temSistema = sistema && sistema.size;
  const temClasse = classe && classe.size;
  const temIndic = indicacao && indicacao.size;
  return farmacos.filter((f) => {
    if (temSistema && !sistema.has(f.sistema)) return false;
    if (temClasse && !classe.has(f.classeKey)) return false;
    if (temIndic && !f.indicacoes.some((i) => indicacao.has(i))) return false;
    if (q) {
      const alvo = normalizar(`${f.dci} ${f.classe} ${f.marcas.join(" ")} ${f.indicacoes.join(" ")}`);
      if (!alvo.includes(q)) return false;
    }
    return true;
  });
}

// ── CALCULADORA PEDIÁTRICA ───────────────────────────────────────────────────
// Aritmética simples (verificável de cabeça): volume = peso × dose/concentração;
// máximo diário = peso × maxDiaMgKg. Não é dispositivo médico (ver CLAUDE.md).

const virgula = (n, casas) => n.toFixed(casas).replace(".", ",");

// Devolve { formula, contexto, freq, linhas[] } para a concentração/dose escolhidas.
export function tabelaPediatrica(pedCalc, conc, doseVal) {
  const dose = pedCalc.doses.find((d) => d.val === doseVal) || pedCalc.doses[0];
  const factor = dose.val / conc; // mL por kg
  const linhas = pedCalc.pesos.map((peso) => {
    const mg = peso * dose.val;
    const mL = peso * factor;
    const maxMg = peso * pedCalc.maxDiaMgKg;
    const maxMl = peso * (pedCalc.maxDiaMgKg / conc);
    return {
      peso,
      dose: `${mg} mg`,
      volume: `${virgula(mL, 1)} mL`,
      freq: dose.freq,
      maximo: `${maxMg} mg ≈ ${virgula(maxMl, 1)} mL`,
    };
  });
  return {
    formula: `Volume (mL) = Peso (kg) × ${virgula(factor, 2)}`,
    contexto: dose.contexto,
    freq: dose.freq,
    linhas,
  };
}
