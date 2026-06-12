// Lógica pura do módulo Interações. Sem tabelas clínicas embutidas — os dados
// (fármacos, regras, labels, severidades) chegam sempre como argumentos.
// Portada verbatim do original (suggest / interForDrug / renderCheck).
import { normalizar } from "@/lib/texto";

// Índice de pesquisa: uma entrada por DCI e uma por cada nome comercial.
export function entradasPesquisa(farmacos) {
  const entradas = [];
  for (const d of farmacos) {
    entradas.push({ id: d.id, texto: d.inn, tipo: "dci" });
    for (const b of d.brands || []) entradas.push({ id: d.id, texto: b, tipo: "marca", inn: d.inn });
  }
  return entradas;
}

// Sugestões: prefixo primeiro, depois inclusão; sem repetir fármaco; máx. 8.
export function sugerir(entradas, q) {
  q = normalizar(q).trim();
  if (!q) return [];
  const prefixo = [], inclui = [];
  for (const e of entradas) {
    const n = normalizar(e.texto);
    if (n.startsWith(q)) prefixo.push(e);
    else if (n.includes(q)) inclui.push(e);
  }
  const vistos = new Set(), out = [];
  for (const e of [...prefixo, ...inclui]) {
    if (vistos.has(e.id)) continue;
    vistos.add(e.id);
    out.push(e);
    if (out.length >= 8) break;
  }
  return out;
}

// Interações de classe de um fármaco: para cada regra em que participa por um
// só lado, o parceiro é a outra tag; guarda-se a pior severidade por parceiro.
export function interacoesDoFarmaco(d, regras, tagLabels, severidades) {
  const porParceiro = {};
  for (const r of regras) {
    const a = d.tags.includes(r.a), b = d.tags.includes(r.b);
    let parceiro = null;
    if (a && !b) parceiro = r.b;
    else if (b && !a) parceiro = r.a;
    if (!parceiro) continue;
    const lbl = tagLabels[parceiro] || parceiro;
    const atual = porParceiro[lbl];
    if (!atual || severidades[r.sev].r < severidades[atual.sev].r)
      porParceiro[lbl] = { parceiro: lbl, sev: r.sev, mec: r.mec, mng: r.mng };
  }
  return Object.values(porParceiro).sort((x, y) => severidades[x.sev].r - severidades[y.sev].r);
}

// Verificação entre os fármacos selecionados: duplicações terapêuticas
// (≥2 com a mesma tag de classe) + interações par-a-par, ordenadas por severidade.
export function verificarSelecao(selecionados, regras, duplicacoes, severidades) {
  const dups = [];
  for (const cl of duplicacoes) {
    const m = selecionados.filter((d) => d.tags.includes(cl.tag));
    if (m.length >= 2) dups.push({ label: cl.label, nomes: m.map((x) => x.inn) });
  }
  const encontradas = [];
  for (let i = 0; i < selecionados.length; i++) {
    for (let j = i + 1; j < selecionados.length; j++) {
      const A = selecionados[i], B = selecionados[j];
      for (const r of regras) {
        const cruza = (A.tags.includes(r.a) && B.tags.includes(r.b)) ||
                      (A.tags.includes(r.b) && B.tags.includes(r.a));
        if (cruza) encontradas.push({ a: A.inn, b: B.inn, sev: r.sev, mec: r.mec, mng: r.mng });
      }
    }
  }
  encontradas.sort((x, y) => severidades[x.sev].r - severidades[y.sev].r);
  return { dups, encontradas };
}
