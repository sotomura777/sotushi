import { useState, useEffect } from "react";
import CalcPediatrica from "./CalcPediatrica";

const Html = ({ className, html }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

const MARCADOR = '<div data-easyf-pedcalc></div>';

// Renderiza o HTML de um painel; se contiver o marcador da calculadora, parte o
// HTML nesse ponto e monta o componente React entre as duas metades.
function Painel({ html, pedCalc }) {
  if (pedCalc && html.includes("data-easyf-pedcalc")) {
    const [antes, depois = ""] = html.split(MARCADOR);
    return (
      <div className="tab-panel active">
        <Html html={antes} />
        <CalcPediatrica pedCalc={pedCalc} />
        <Html html={depois} />
      </div>
    );
  }
  return <Html className="tab-panel active" html={html} />;
}

const iconeRelogio = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);
const iconeLink = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3h7v7" /><line x1="10" y1="14" x2="21" y2="3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>
);

export default function FichaFarmaco({ ficha, cor, onVoltar }) {
  const [tab, setTab] = useState(ficha.tabs[0].id);
  const [subs, setSubs] = useState({}); // { tabId: subId }

  // ao trocar de fármaco, repor no 1.º separador
  useEffect(() => { setTab(ficha.tabs[0].id); setSubs({}); }, [ficha.slug]);

  const tabAtiva = ficha.tabs.find((t) => t.id === tab) || ficha.tabs[0];
  const subId = tabAtiva.subtabs ? (subs[tab] || tabAtiva.subtabs[0].id) : null;
  const subAtiva = tabAtiva.subtabs && tabAtiva.subtabs.find((s) => s.id === subId);
  const setSub = (sid) => setSubs((m) => ({ ...m, [tab]: sid }));

  return (
    <div className="easyf-ficha" style={{ "--cc": cor }}>
      <button className="back-btn" onClick={onVoltar}>‹ Todos os fármacos</button>

      <header className="hero">
        {ficha.hero.pill && <span className="hero-pill">{ficha.hero.pill}</span>}
        <h1 className="hero-title">{ficha.hero.titulo}</h1>
        {ficha.hero.links.length > 0 && (
          <div className="hero-actions">
            {ficha.hero.links.map((l) => (
              <a key={l.href} className="hero-action" href={l.href} target="_blank" rel="noopener noreferrer">
                {iconeLink} {l.label}
              </a>
            ))}
          </div>
        )}
        {ficha.hero.revisao && (
          <div className="hero-review">{iconeRelogio}<span>Última revisão: <b>{ficha.hero.revisao}</b></span></div>
        )}
        {ficha.hero.marcasHtml && <Html className="hero-brands" html={ficha.hero.marcasHtml} />}
        {ficha.hero.tags.length > 0 && (
          <div className="hero-tags">
            {ficha.hero.tags.map((t) => <span key={t} className="hero-tag">{t}</span>)}
          </div>
        )}
      </header>

      <div className="tabs-wrap">
        <div className="tabs">
          {ficha.tabs.map((t) => (
            <button key={t.id} className={"tab-btn" + (t.id === tab ? " active" : "")} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tabAtiva.subtabs ? (
        <div className="tab-panel active">
          <div className="sub-tabs">
            {tabAtiva.subtabs.map((s) => (
              <button key={s.id} className={"sub-tab" + (s.id === subId ? " active" : "")} onClick={() => setSub(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <Painel key={subId} html={subAtiva.html} pedCalc={ficha.pedCalc} />
        </div>
      ) : (
        <Painel key={tab} html={tabAtiva.html} pedCalc={ficha.pedCalc} />
      )}

      {ficha.sourcesHtml && <Html html={ficha.sourcesHtml} />}
    </div>
  );
}
