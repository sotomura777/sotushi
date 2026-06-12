import { useEffect, useRef } from "react";
import guia from "@conteudo/cronicas/asma-guia.json";
import { useEstadoLocal } from "@/lib/persistencia";

// Guia teórico da Asma — 10 separadores fiéis ao original.
// Os painéis vêm inteiros do conteúdo (HTML); toda a interatividade do original
// (sub-separadores aninhados, degraus, tracks, flips, filtros e pesquisas) é
// replicada por delegação de eventos, como nos sub-separadores cz-* da Dor Abdominal.
// Os painéis ficam todos montados (como na página original) para preservar o estado.
export default function AsmaGuia({ voltar }) {
  const [tab, setTab] = useEstadoLocal("medguia:asma:guia:tab", 0);
  const raizRef = useRef(null);
  const filtroComp = useRef("all");
  const mudarTab = (i) => setTab(i); // sem scroll: mudar de aba não deve mexer na página

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  // contador inicial do glossário ("N termos")
  useEffect(() => {
    const raiz = raizRef.current;
    const contador = raiz?.querySelector("#gloss-count");
    if (contador) contador.textContent = raiz.querySelectorAll("#gloss-grid .gloss-card").length + " termos";
  }, []);

  // ── pesquisas e filtros (réplica do JS original) ──
  const aplicarFiltroComp = (raiz) => {
    const inp = raiz.querySelector("#search-comparacao");
    const tabela = raiz.querySelector("#comp-table");
    if (!inp || !tabela) return;
    const q = inp.value.trim().toLowerCase();
    let visiveis = 0;
    tabela.querySelectorAll("tbody tr").forEach((r) => {
      const okClasse = filtroComp.current === "all" || r.dataset.class === filtroComp.current;
      const okTexto = q.length < 2 || ((r.dataset.search || "") + " " + r.textContent).toLowerCase().includes(q);
      const mostra = okClasse && okTexto;
      r.classList.toggle("hidden", !mostra);
      if (mostra) visiveis++;
    });
    const nores = raiz.querySelector("#comp-nores");
    if (nores) nores.style.display = visiveis === 0 ? "" : "none";
  };

  const pesquisarTratamento = (raiz, valor) => {
    const painel = raiz.querySelector("#tratamento");
    const msg = raiz.querySelector("#search-tratamento-msg");
    if (!painel || !msg) return;
    const subpaneis = painel.querySelectorAll(".subpanel");
    const nav = painel.querySelector(".subtabs");
    const q = valor.trim().toLowerCase();
    if (q.length < 3) {
      subpaneis.forEach((sp) => {
        sp.querySelectorAll(".pharma-card, .tx-recap, .info-card, .highlight-box, .dose-row, .prose li").forEach((el) => {
          el.style.display = "";
          el.style.background = "";
        });
      });
      // repõe só o subpainel do sub-separador ativo (o original deixava todos abertos)
      const ativo = nav?.querySelector(".subtab.active")?.dataset.sub;
      subpaneis.forEach((sp) => sp.classList.toggle("active", sp.getAttribute("data-sub") === ativo));
      if (nav) nav.style.display = "";
      msg.textContent = "";
      return;
    }
    subpaneis.forEach((sp) => sp.classList.add("active"));
    if (nav) nav.style.display = "none";
    let hits = 0;
    painel.querySelectorAll(".pharma-card, .tx-recap, .info-card, .highlight-box, .prose li").forEach((c) => {
      const texto = (c.innerText || c.textContent || "").toLowerCase();
      if (texto.includes(q)) { c.style.display = ""; hits++; }
      else c.style.display = "none";
    });
    msg.textContent = hits === 0 ? `Nenhum resultado para "${valor.trim()}"` : hits + " resultado(s)";
  };

  const pesquisarGlossario = (raiz, valor) => {
    const grelha = raiz.querySelector("#gloss-grid");
    const nores = raiz.querySelector("#gloss-nores");
    const contador = raiz.querySelector("#gloss-count");
    if (!grelha) return;
    const cards = grelha.querySelectorAll(".gloss-card");
    const categorias = grelha.querySelectorAll(".gloss-category-inline");
    const q = valor.trim().toLowerCase();
    if (q.length < 2) {
      cards.forEach((c) => c.classList.remove("hidden"));
      categorias.forEach((c) => { c.style.display = ""; });
      if (nores) nores.style.display = "none";
      if (contador) contador.textContent = cards.length + " termos";
      return;
    }
    let visiveis = 0;
    cards.forEach((c) => {
      const mostra = ((c.dataset.terms || "") + " " + c.textContent).toLowerCase().includes(q);
      c.classList.toggle("hidden", !mostra);
      if (mostra) visiveis++;
    });
    categorias.forEach((c) => { c.style.display = "none"; });
    if (nores) nores.style.display = visiveis === 0 ? "" : "none";
    if (contador) contador.textContent = visiveis + " de " + cards.length + " termos";
  };

  const onInput = (e) => {
    const raiz = raizRef.current;
    if (e.target.id === "search-tratamento") pesquisarTratamento(raiz, e.target.value);
    else if (e.target.id === "search-comparacao") aplicarFiltroComp(raiz);
    else if (e.target.id === "search-glossario") pesquisarGlossario(raiz, e.target.value);
  };

  const onClick = (e) => {
    const t = e.target;
    const raiz = raizRef.current;

    // sub-separadores (genérico; :scope > .subpanel suporta o nível aninhado dos Princípios)
    const subtab = t.closest(".subtab");
    if (subtab) {
      const nav = subtab.closest(".subtabs");
      nav.querySelectorAll(".subtab").forEach((b) => b.classList.toggle("active", b === subtab));
      nav.parentElement.querySelectorAll(":scope > .subpanel").forEach((p) =>
        p.classList.toggle("active", p.getAttribute("data-sub") === subtab.dataset.sub));
      return;
    }

    // navegação por degraus
    const stepBtn = t.closest(".step-btn");
    if (stepBtn) {
      const seccao = stepBtn.closest(".section");
      stepBtn.closest(".step-nav").querySelectorAll(".step-btn").forEach((b) => b.classList.toggle("active", b === stepBtn));
      seccao.querySelectorAll(".step-panel").forEach((p) =>
        p.classList.toggle("active", p.getAttribute("data-step") === stepBtn.dataset.step));
      return;
    }

    // Track 1 vs Track 2
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

    // favorito visual dos cards de fármacos
    const estrela = t.closest(".pc-star");
    if (estrela) {
      estrela.classList.toggle("saved");
      estrela.textContent = estrela.classList.contains("saved") ? "★" : "☆";
      return;
    }

    // flip dos cards de fármacos (toque, como no original do guia)
    const pharma = t.closest(".pharma-inner");
    if (pharma && !t.closest("a")) {
      pharma.parentElement.classList.toggle("flipped");
      return;
    }

    // filtros da tabela de comparação
    const filtroBtn = t.closest(".comp-filter");
    if (filtroBtn) {
      raiz.querySelectorAll(".comp-filter").forEach((b) => b.classList.toggle("active", b === filtroBtn));
      filtroComp.current = filtroBtn.dataset.filter;
      aplicarFiltroComp(raiz);
    }
  };

  return (
    <div className="ca asma ob-page asma-guia" ref={raizRef} onClick={onClick} onInput={onInput}>
      <button className="ob-voltar" onClick={voltar}>‹ Menu Asma</button>
      <h1 className="ob-titulo">{guia.header.titulo}</h1>
      <p className="ca-hero-sub">{guia.header.subtitulo}</p>

      <div className="ob-tabs">
        {guia.tabs.map((t, i) => (
          <button key={t.id} className={"ob-tab" + (tab === i ? " ativo" : "")} onClick={() => mudarTab(i)}>
            <span className="ob-tabnum">{i + 1}</span>{t.label}
          </button>
        ))}
      </div>

      {guia.tabs.map((t, i) => (
        <div key={t.id} id={t.id} className={"panel" + (tab === i ? " active" : "")} dangerouslySetInnerHTML={{ __html: t.html }} />
      ))}

      {guia.foot && <div className="rodape" dangerouslySetInnerHTML={{ __html: guia.foot }} />}
    </div>
  );
}
