import { useEffect, useRef } from "react";
import algo from "@conteudo/cronicas/asma-algoritmo.json";
import { useEstadoLocal } from "@/lib/persistencia";

// Algoritmo interativo da Asma — fluxograma do diagnóstico ao tratamento, fiel ao original.
// 3 populações (adulto · 6–11 anos · pré-escolar), cada uma com Diagnóstico/Tratamento/Crise.
// As populações ficam todas montadas (como na página original) e a interatividade dos
// blobs HTML (separadores, degraus, ramos da crise, chips do fluxograma, flips, glossário)
// é replicada por delegação, a partir dos atributos data-* gerados pelo extrator.
export default function AsmaAlgoritmo({ voltar }) {
  const [pop, setPop] = useEstadoLocal("medguia:asma:algoritmo:pop", "adult");
  const raizRef = useRef(null);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  const ativarMainTab = (btn) => {
    const popEl = btn.closest(".pop-content");
    const navBtns = [...btn.closest(".main-tabs").querySelectorAll(".main-tab")];
    const idx = navBtns.indexOf(btn);
    navBtns.forEach((b, i) => b.classList.toggle("active", i === idx));
    [...popEl.querySelectorAll(":scope > .tab-content")].forEach((c, i) => c.classList.toggle("active", i === idx));
  };

  // abrir um degrau: garante a população e o separador Tratamento, e ativa o degrau n
  const abrirDegrau = (raiz, p, n) => {
    if (p !== pop) setPop(p);
    const popEl = raiz.querySelector(`.pop-content[data-pop="${p}"]`);
    if (!popEl) return;
    const navBtns = [...popEl.querySelector(".main-tabs").querySelectorAll(".main-tab")];
    navBtns.forEach((b, i) => b.classList.toggle("active", i === 1));
    [...popEl.querySelectorAll(":scope > .tab-content")].forEach((c, i) => c.classList.toggle("active", i === 1));
    popEl.querySelectorAll(".dg-tab").forEach((b) => b.classList.toggle("active", (b.dataset.dg || b.dataset.cdg) === n));
    popEl.querySelectorAll(".dg-content").forEach((c) => c.classList.toggle("active", c.id.endsWith("-" + n)));
    setTimeout(() => {
      const alvo = popEl.querySelector('[id^="dg-tabs"]');
      if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // acordeão dos ramos da crise (ligeira/grave/paragem) — um aberto de cada vez
  const toggleCrise = (raiz, p, sev) => {
    const painel = raiz.querySelector(`#cr-${p}-${sev}`);
    if (!painel) return;
    const estavaAberto = painel.classList.contains("open");
    ["mild", "severe", "arrest"].forEach((s) => {
      raiz.querySelector(`#cr-${p}-${s}`)?.classList.remove("open");
      raiz.querySelector(`#cr-btn-${p}-${s}`)?.classList.remove("open");
    });
    if (!estavaAberto) {
      painel.classList.add("open");
      raiz.querySelector(`#cr-btn-${p}-${sev}`)?.classList.add("open");
      setTimeout(() => painel.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  };

  const onClick = (e) => {
    const t = e.target;
    const raiz = raizRef.current;

    const mainTab = t.closest("[data-algo-tab]");
    if (mainTab) { ativarMainTab(mainTab); return; }

    const dg = t.closest("[data-algo-dg]");
    if (dg) { const [p, n] = dg.dataset.algoDg.split(":"); abrirDegrau(raiz, p, n); return; }

    const cr = t.closest("[data-algo-cr]");
    if (cr) { const [p, sev] = cr.dataset.algoCr.split(":"); toggleCrise(raiz, p, sev); return; }

    const step = t.closest("[data-algo-step]");
    if (step) { step.classList.toggle("open"); return; }

    // Track 1 vs Track 2 dentro dos degraus
    const trackBtn = t.closest(".track-btn");
    if (trackBtn) {
      const toggle = trackBtn.closest(".track-toggle");
      const stepId = toggle.dataset.stepTrack;
      toggle.querySelectorAll(".track-btn").forEach((b) => b.classList.toggle("active", b === trackBtn));
      raiz.querySelectorAll(`[data-step-track-panel^="${stepId}-"]`).forEach((p) => p.classList.remove("active"));
      const painel = raiz.querySelector(`[data-step-track-panel="${stepId}-${trackBtn.dataset.track}"]`);
      if (painel) painel.classList.add("active");
      return;
    }

    // chips dos ramos do fluxograma: expandir um, encolher os irmãos
    const chip = t.closest(".chip");
    if (chip) {
      const col = chip.parentElement;
      if (!col || !col.classList.contains("fc-branch-col")) return;
      const linha = col.parentElement;
      if (!linha || !linha.hasAttribute("data-branch")) return;
      const estavaExpandido = col.classList.contains("expanded");
      linha.querySelectorAll(":scope > .fc-branch-col").forEach((c) => c.classList.remove("expanded", "collapsed"));
      if (!estavaExpandido) {
        col.classList.add("expanded");
        linha.querySelectorAll(":scope > .fc-branch-col").forEach((c) => { if (c !== col) c.classList.add("collapsed"); });
      }
    }
  };

  // flip dos cards de fármacos — no algoritmo é com duplo toque e só se houver verso
  const onDoubleClick = (e) => {
    const pharma = e.target.closest(".pharma-inner");
    if (!pharma || e.target.closest("a")) return;
    const verso = pharma.querySelector(".pharma-back");
    if (!verso || !verso.textContent.trim()) return;
    pharma.parentElement.classList.toggle("flipped");
  };

  const onInput = (e) => {
    if (!e.target.matches("[data-algo-gloss-search]")) return;
    const raiz = raizRef.current;
    const termo = e.target.value.trim().toLowerCase();
    raiz.querySelectorAll(".algo-gloss-item").forEach((item) =>
      item.classList.toggle("hidden", !(!termo || item.textContent.toLowerCase().includes(termo))));
    const visiveis = raiz.querySelectorAll(".algo-gloss-item:not(.hidden)").length;
    const nores = raiz.querySelector("#algoGlossNores");
    if (nores) nores.style.display = visiveis === 0 && termo ? "block" : "none";
  };

  return (
    <div className="ca asma ob-page asma-algo" ref={raizRef} onClick={onClick} onDoubleClick={onDoubleClick} onInput={onInput}>
      <div className="asma-ribbon">{algo.header.ribbon}</div>
      <button className="ob-voltar" onClick={voltar}>‹ Menu Asma</button>
      <h1 className="ob-titulo">{algo.header.titulo}</h1>
      <p className="ca-hero-sub">{algo.header.subtitulo}</p>

      <div className="pop-filter">
        <div className="pop-filter-label">{algo.header.popLabel}</div>
        <div className="pop-filter-tabs">
          {algo.pops.map((p) => (
            <button key={p.id} className={"pop-btn" + (pop === p.id ? " active" : "")} onClick={() => { setPop(p.id); window.scrollTo({ top: 0 }); }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {algo.pops.map((p) => (
        <div key={p.id} className={"pop-content" + (pop === p.id ? " active" : "")} data-pop={p.id} dangerouslySetInnerHTML={{ __html: p.html }} />
      ))}

      <div dangerouslySetInnerHTML={{ __html: algo.glossarioHtml }} />
      <div className="rodape" dangerouslySetInnerHTML={{ __html: algo.foot }} />
    </div>
  );
}
