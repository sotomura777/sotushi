import { useEffect, useRef, useState } from "react";
import dados from "@conteudo/cronicas/anemia-algoritmo.json";
import { useEstadoLocal } from "@/lib/persistencia";

// Calculadoras do original (texto e fórmulas recortados do JS do anemia_algoritmo_visual-22):
// rácio de Thomas (sTfR / log10 ferritina) em três contextos e IRC (índice de reticulócitos
// corrigido). A delegação identifica a calculadora pelo id do input.
const CALCS = {
  thomas: { ids: ["thomas-stfr", "thomas-fer"], resultado: "thomas-result", vazio: "Preenche valores para calcular", tipo: "thomas", variante: "geral" },
  "thomas-inline": { ids: ["thomas-stfr-inline", "thomas-fer-inline"], resultado: "thomas-result-inline", vazio: "Preenche valores", tipo: "thomas", variante: "geral" },
  "thomas-normo": { ids: ["thomas-stfr-normo", "thomas-fer-normo"], resultado: "thomas-result-normo", vazio: "Preenche valores", tipo: "thomas", variante: "normo" },
  "irc-inline": { ids: ["irc-ret-inline", "irc-hb-inline", "irc-hbnorm-inline"], resultado: "irc-result-inline", vazio: "Preenche valores", tipo: "irc" },
};
const INTERP_THOMAS = {
  geral: (r) => (r > 2 ? "<b>&gt; 2</b> · componente <b>ferropénico</b> (mesmo em inflamação)"
    : r < 1 ? "<b>&lt; 1</b> · padrão de <b>doença crónica</b> pura"
    : "<b>1–2</b> · zona indeterminada"),
  normo: (r) => (r > 2 ? "<b>&gt; 2</b> · <b>anemia mista</b> (ferropénica + inflamatória)"
    : r < 1 ? "<b>&lt; 1</b> · <b>doença crónica pura</b>"
    : "<b>1–2</b> · zona indeterminada · rever esfregaço"),
};

function calcularEm(raiz, calc) {
  const valores = calc.ids.map((id) => parseFloat(raiz.querySelector("#" + id)?.value));
  const res = raiz.querySelector("#" + calc.resultado);
  if (!res) return;
  if (valores.some((v) => !v) || (calc.tipo === "thomas" && valores[1] <= 0)) {
    res.className = "tool-result empty";
    res.textContent = calc.vazio;
    return;
  }
  res.className = "tool-result";
  if (calc.tipo === "thomas") {
    const ratio = valores[0] / Math.log10(valores[1]);
    res.innerHTML = `<div class="tool-result-value">Thomas = ${ratio.toFixed(2)}</div><div class="tool-result-text">${INTERP_THOMAS[calc.variante](ratio)}</div>`;
  } else {
    const [ret, hb, hbnorm] = valores;
    const mf = hb < 7 ? 2.5 : hb < 9 ? 2 : hb < 11 ? 1.5 : 1;
    const irc = (ret * (hb / hbnorm)) / mf;
    const interp = irc > 2 ? "<b>&gt; 2</b> · resposta medular adequada" : "<b>&lt; 2</b> · padrão hipoproliferativo";
    res.innerHTML = `<div class="tool-result-value">IRC = ${irc.toFixed(2)}</div><div class="tool-result-text">${interp} (FM: ${mf})</div>`;
  }
}

// Algoritmo visual da Anemia — fiel ao original: 3 fluxogramas por morfologia
// (adulto micro/normo/macro), ramos expansíveis por chip, atalhos para as linhas
// das tabelas de causas, mini-calculadoras laterais e painel flutuante de
// valores de referência. Os painéis ficam montados para preservar o estado.
export default function AnemiaAlgoritmo({ voltar, rotuloVoltar = "‹ Algoritmo" }) {
  const [pop, setPop] = useEstadoLocal("medguia:anemia:algoritmo:pop", dados.pops[0].id);
  const [refAberto, setRefAberto] = useState(false);
  const raizRef = useRef(null);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  const mudarPop = (id) => {
    setPop(id);
    const raiz = raizRef.current;
    raiz.querySelectorAll(".fc-branch-col.expanded, .fc-branch-col.collapsed").forEach((c) =>
      c.classList.remove("expanded", "collapsed"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onClick = (e) => {
    const raiz = raizRef.current;
    const t = e.target;

    // atalho "ver na tabela de causas"
    const causaBtn = t.closest("[data-an-cause]");
    if (causaBtn) {
      const linha = raiz.querySelector(`tr[data-cause="${causaBtn.dataset.anCause}"]`);
      if (!linha) return;
      linha.scrollIntoView({ behavior: "smooth", block: "center" });
      raiz.querySelectorAll("tr.flash-row").forEach((r) => r.classList.remove("flash-row"));
      void linha.offsetWidth;
      linha.classList.add("flash-row");
      setTimeout(() => linha.classList.remove("flash-row"), 2400);
      return;
    }

    // mini-calculadora lateral
    const sideBtn = t.closest("[data-an-sidecalc]");
    if (sideBtn) {
      const calc = sideBtn.parentElement.querySelector(".side-calc");
      if (!calc) return;
      const aberto = calc.classList.toggle("open");
      sideBtn.setAttribute("aria-expanded", aberto ? "true" : "false");
      if (aberto) {
        const inp = calc.querySelector("input");
        if (inp) setTimeout(() => inp.focus(), 100);
      }
      return;
    }

    // atalho para a calculadora de Thomas principal
    if (t.closest("[data-an-thomas]")) {
      const el = raiz.querySelector("#thomas-calc");
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
      setTimeout(() => raiz.querySelector("#thomas-stfr")?.focus(), 600);
      return;
    }

    // chips expansíveis dos ramos do fluxograma (réplica do handler do original)
    const chip = t.closest(".chip");
    if (chip) {
      if (t.closest("button, a, input")) return;
      const col = chip.closest(".fc-branch-col");
      if (!col) return;
      const ramo = col.parentElement;
      if (!ramo || !ramo.matches(".fc-branch")) return;
      const irmas = Array.from(ramo.children).filter((el) => el.matches(".fc-branch-col"));
      const estavaExpandida = col.classList.contains("expanded");
      irmas.forEach((s) => s.classList.remove("expanded", "collapsed"));
      if (!estavaExpandida) {
        col.classList.add("expanded");
        irmas.forEach((s) => { if (s !== col) s.classList.add("collapsed"); });
      }
    }
  };

  const onInput = (e) => {
    const id = e.target.id;
    const calc = Object.values(CALCS).find((c) => c.ids.includes(id));
    if (calc) calcularEm(raizRef.current, calc);
  };

  return (
    <div className="ca anemia ob-page an-algo" ref={raizRef} onClick={onClick} onInput={onInput}>
      <button className="ob-voltar" onClick={voltar}>{rotuloVoltar}</button>
      <div className="ribbon">{dados.header.ribbon}</div>
      <h1 className="ob-titulo">{dados.header.titulo}</h1>
      <p className="ca-hero-sub" dangerouslySetInnerHTML={{ __html: dados.header.subtitulo }} />
      <div className="ob-aviso" dangerouslySetInnerHTML={{ __html: dados.header.legalBanner }} />

      <div className="pop-tabs">
        {dados.pops.map((p) => (
          <button key={p.id} className={"pop-tab" + (pop === p.id ? " active" : "")} data-pop={p.id}
            onClick={() => mudarPop(p.id)} dangerouslySetInnerHTML={{ __html: p.labelHtml }} />
        ))}
      </div>

      {dados.pops.map((p) => (
        <div key={p.id} id={"pop-" + p.id} className={"pop-content" + (pop === p.id ? " active" : "")}
          dangerouslySetInnerHTML={{ __html: p.html }} />
      ))}

      <div className="rodape" dangerouslySetInnerHTML={{ __html: dados.foot }} />

      <button className="ref-fab" title={dados.ref.titulo} onClick={() => setRefAberto((a) => !a)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>
      </button>
      <div className={"ref-panel" + (refAberto ? " open" : "")}>
        <div className="ref-panel-head">
          <span className="ref-panel-title">{dados.ref.titulo}</span>
          <button className="ref-panel-close" onClick={() => setRefAberto(false)}>×</button>
        </div>
        <div dangerouslySetInnerHTML={{ __html: dados.ref.html }} />
      </div>
    </div>
  );
}
