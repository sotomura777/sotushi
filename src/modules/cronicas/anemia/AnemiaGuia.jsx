import { useEffect, useRef } from "react";
import guia from "@conteudo/cronicas/anemia-guia.json";
import { useEstadoLocal } from "@/lib/persistencia";

// Guia teórico da Anemia — 7 separadores fiéis ao original (padrão AsmaGuia).
// Os painéis vêm inteiros do conteúdo (HTML); a interatividade do original
// (sub-separadores em dois níveis, acordeões, pesquisas de FAQs e glossário)
// é replicada por delegação de eventos. Os painéis ficam todos montados
// (como na página original) para preservar o estado.
export default function AnemiaGuia({ voltar, rotuloVoltar = "‹ Menu Anemia" }) {
  const [tab, setTab] = useEstadoLocal("medguia:anemia:guia:tab", 0);
  const raizRef = useRef(null);
  const mudarTab = (i) => setTab(i); // sem scroll: mudar de aba não deve mexer na página

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  // ── pesquisas (réplica do JS original) ──
  const pesquisarFaqs = (raiz, valor) => {
    const painel = raiz.querySelector("#faqs");
    const msg = raiz.querySelector("#search-faqs-msg");
    if (!painel || !msg) return;
    const itens = painel.querySelectorAll(".accordion-item");
    const q = valor.trim().toLowerCase();
    if (q.length < 3) { itens.forEach((c) => { c.style.display = ""; }); msg.textContent = ""; return; }
    let hits = 0;
    itens.forEach((c) => {
      const texto = (c.innerText || "").toLowerCase();
      if (texto.includes(q)) { c.style.display = ""; hits++; }
      else c.style.display = "none";
    });
    msg.textContent = hits === 0 ? `Nenhum resultado para "${valor.trim()}"` : hits + " resultado(s)";
  };

  const pesquisarGlossario = (raiz, valor) => {
    const contador = raiz.querySelector("#gloss-count");
    const cards = raiz.querySelectorAll("#gloss-grid .gloss-card");
    const q = valor.toLowerCase().trim();
    let visiveis = 0;
    cards.forEach((c) => {
      if (q.length < 2) { c.classList.remove("hidden"); visiveis++; return; }
      const termos = (c.dataset.terms || "") + " " + c.textContent.toLowerCase();
      const mostra = termos.includes(q);
      c.classList.toggle("hidden", !mostra);
      if (mostra) visiveis++;
    });
    if (contador) contador.textContent = q.length >= 2 ? visiveis + " resultados" : "";
  };

  const onInput = (e) => {
    const raiz = raizRef.current;
    if (e.target.id === "search-faqs") pesquisarFaqs(raiz, e.target.value);
    else if (e.target.id === "search-glossario") pesquisarGlossario(raiz, e.target.value);
  };

  const onClick = (e) => {
    const t = e.target;

    // sub-sub-separadores (dois sabores no original: data-ssub e data-sub, ambos
    // delimitados ao .subpanel mais próximo)
    const subsubtab = t.closest(".subsubtab");
    if (subsubtab) {
      const escopo = subsubtab.closest(".subpanel");
      if (!escopo) return;
      const attr = subsubtab.dataset.ssub !== undefined ? "ssub" : "sub";
      const alvo = subsubtab.dataset[attr];
      escopo.querySelectorAll(".subsubtab").forEach((b) => b.classList.toggle("active", b === subsubtab));
      escopo.querySelectorAll(".subsubpanel").forEach((p) =>
        p.classList.toggle("active", p.getAttribute("data-" + attr) === alvo));
      return;
    }

    // sub-separadores (delimitados ao painel; :scope > .subpanel preserva os aninhados)
    const subtab = t.closest(".subtab");
    if (subtab) {
      const nav = subtab.closest(".subtabs");
      nav.querySelectorAll(".subtab").forEach((b) => b.classList.toggle("active", b === subtab));
      nav.parentElement.querySelectorAll(":scope > .subpanel").forEach((p) =>
        p.classList.toggle("active", p.getAttribute("data-sub") === subtab.dataset.sub));
      return;
    }

    // acordeões
    const cabecalho = t.closest(".accordion-header");
    if (cabecalho) cabecalho.parentElement.classList.toggle("open");
  };

  return (
    <div className="ca anemia ob-page an-guia" ref={raizRef} onClick={onClick} onInput={onInput}>
      <button className="ob-voltar" onClick={voltar}>{rotuloVoltar}</button>
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
    </div>
  );
}
