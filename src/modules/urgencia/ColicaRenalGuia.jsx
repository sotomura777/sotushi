import { useState, useMemo, useEffect } from "react";
import dados from "@conteudo/urgencia/colica-renal.json";
import guia from "@conteudo/urgencia/colica-renal-guia.json";
import { useEstadoLocal } from "@/lib/persistencia";
import { useAtalhosNumericos } from "@/lib/atalhos";
import { normalizar } from "@/lib/texto";
import ColicaRenalAnamnese from "./ColicaRenalAnamnese.jsx";
import CardsDeck from "./sintoma/CardsDeck.jsx";

const TABS = ["Guia Teórico", "Tratamento", "Cards", "Anamnese", "Fontes", "Glossário"];

// HTML do conteúdo com a interatividade do original por delegação:
// accordion de diagnósticos (.dx-card-h) e grelha de quadrantes (.qcell → #quadInfo).
function Html({ html, className }) {
  const onClick = (e) => {
    const raiz = e.currentTarget;
    const h = e.target.closest(".dx-card-h");
    if (h) {
      const card = h.closest(".dx-card");
      const abrir = !card.classList.contains("open");
      raiz.querySelectorAll(".dx-card").forEach((c) => c.classList.remove("open"));
      if (abrir) card.classList.add("open");
      return;
    }
    const q = e.target.closest(".qcell");
    if (q) {
      const info = raiz.querySelector("#quadInfo");
      if (!info) return;
      const liga = !q.classList.contains("on");
      raiz.querySelectorAll(".qcell").forEach((c) => c.classList.remove("on"));
      if (!liga) { info.innerHTML = "Selecciona um quadrante para ver as pistas clínicas."; return; }
      q.classList.add("on");
      const d = guia.diagnosticos.quadData[q.getAttribute("data-q")];
      if (d) info.innerHTML = `<b>${d.t}</b><br><span style="display:block;margin-top:6px">${d.tip}</span>`;
    }
  };
  return <div className={"ca-guia cr-guia " + (className || "")} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function ColicaRenalGuia({ voltar, tabInicial }) {
  const [tab, setTab] = useEstadoLocal("medguia:colica-renal:guia:tab", 0);
  const [gt, setGt] = useState(0);
  const [tx, setTx] = useState(0);
  const [an, setAn] = useState(0);
  const [glosQuery, setGlosQuery] = useState("");
  const mudarTab = (i) => setTab(i); // sem scroll: mudar de aba não deve mexer na página
  useAtalhosNumericos(TABS.length, mudarTab);
  useEffect(() => { if (tabInicial != null) mudarTab(tabInicial); }, [tabInicial]); // eslint-disable-line react-hooks/exhaustive-deps

  const termos = useMemo(() => {
    const q = normalizar(glosQuery).trim();
    if (q.length < 2) return guia.glossario.termos;
    return guia.glossario.termos.filter((t) => normalizar(t.term + " " + t.full + " " + t.desc).includes(q));
  }, [glosQuery]);

  const trAtual = guia.tratamento.paineis[tx];

  return (
    <div className="ca cr ob-page">
      <button className="ob-voltar" onClick={voltar}>‹ Menu Cólica Renal</button>
      <h1 className="ob-titulo">{dados.titulo}</h1>
      <p className="ca-hero-sub">{guia.guiaSub}</p>

      <div className="ob-tabs">
        {TABS.map((t, i) => (
          <button key={i} className={"ob-tab" + (tab === i ? " ativo" : "")} onClick={() => mudarTab(i)}>
            <span className="ob-tabnum">{i + 1}</span>{t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <>
          <div className="ob-sub">
            {guia.gt.map((g, i) => (
              <button key={i} className={"ob-sub-btn" + (gt === i ? " ativo" : "")} onClick={() => setGt(i)}>{g.label}</button>
            ))}
          </div>
          <Html html={guia.gt[gt].html} />
        </>
      )}

      {tab === 1 && (
        <>
          <div className="ob-sub">
            {guia.tratamento.labels.map((l, i) => (
              <button key={i} className={"ob-sub-btn" + (tx === i ? " ativo" : "")} onClick={() => { setTx(i); setAn(0); }}>{l}</button>
            ))}
          </div>
          {trAtual.analgesia ? (
            <>
              <div className="ob-sub cr-subsub">
                {trAtual.labels.map((l, i) => (
                  <button key={i} className={"ob-sub-btn" + (an === i ? " ativo" : "")} onClick={() => setAn(i)}>{l}</button>
                ))}
              </div>
              <Html html={trAtual.paineis[an].html} />
            </>
          ) : (
            <Html html={trAtual.html} />
          )}
        </>
      )}

      {tab === 2 && <CardsDeck titulo={guia.cards.titulo} sub={guia.cards.sub} cats={guia.cards.cats} defaults={guia.cards.defaults} prefixo="medguia:colica-renal:cards" />}

      {tab === 3 && <ColicaRenalAnamnese embutido />}

      {tab === 4 && (
        <>
          <div className="ob-aviso" dangerouslySetInnerHTML={{ __html: guia.fontes.intro }} />
          {guia.fontes.grupos.map((g, gi) => (
            <div key={gi}>
              <div className="ob-section-label">{g.titulo}</div>
              <div className="ca-fontes-grid">
                {g.itens.map((f, i) => (
                  <a key={i} className="ca-fonte-card" href={f.url || "https://www.google.com/search?q=" + encodeURIComponent(f.titulo + " " + f.autores)} target="_blank" rel="noopener noreferrer">
                    <span className={"ca-fonte-badge " + f.badgeTipo}>{f.badge}</span>
                    <span className="ca-fonte-titulo">{f.titulo}</span>
                    <span className="ca-fonte-autores">{f.autores}</span>
                    <span className="ca-fonte-revista">{f.fonte}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 5 && (
        <>
          <div className="ob-section-label">{guia.glossario.titulo}</div>
          <p className="ca-lead">{guia.glossario.sub}</p>
          <input className="campo" style={{ width: "100%", marginBottom: 14 }} placeholder="Pesquisar sigla ou termo…" value={glosQuery} onChange={(e) => setGlosQuery(e.target.value)} />
          {termos.length === 0 && <div className="ob-faq-vazio">Nenhum termo encontrado.</div>}
          <div className="ca-glos-lista">
            {termos.map((t, i) => (
              <div key={i} className="ca-glos-item">
                <div className="ca-glos-topo">
                  <span className="ca-glos-term">{t.term}</span>
                  <span className="ca-glos-cat">{t.cat}</span>
                </div>
                {t.full && t.full !== t.term && <div className="ca-glos-full">{t.full}</div>}
                <div className="ca-glos-desc" dangerouslySetInnerHTML={{ __html: t.desc }} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
