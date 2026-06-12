import { Fragment, useEffect } from "react";
import dados from "@conteudo/cronicas/anemia.json";
import quizDados from "@conteudo/cronicas/anemia-casos.json";
import { Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import AnemiaGuia from "./AnemiaGuia.jsx";
import AnemiaAlgoritmo from "./AnemiaAlgoritmo.jsx";
import AnemiaPadroes from "./AnemiaPadroes.jsx";
import AnemiaCards from "./AnemiaCards.jsx";
import AnemiaFlashcards from "./AnemiaFlashcards.jsx";
import AnemiaCasosPadroes from "./AnemiaCasosPadroes.jsx";
import QuizPNA from "../../urgencia/sintoma/QuizPNA.jsx";
import "../../urgencia/estilo.css";
import "./estilo.css";

// classes de cor do home original por destino do cartão
const CLS_MENU = { guia: "theory", algoritmo: "algo", cards: "cards", casos: "quiz" };
const ICONES_MENU = { guia: "livro", algoritmo: "algoritmo", cards: "monitor", casos: "tarefa" };
const ICONES_SUB = {
  "algoritmo-visual": "fluxograma", "estuda-padrao": "grelha",
  cards: "monitor", flashcards: "cartoes",
  "casos-gerais": "documento", "casos-padroes": "alvo",
};
// cada vista-folha volta para o hub de onde se abre ("hub-<id>", para não colidir
// com a folha "cards", que tem o mesmo nome do hub); o guia abre direto do menu
const PAI = {
  guia: "menu",
  "algoritmo-visual": "hub-algoritmo", "estuda-padrao": "hub-algoritmo",
  "casos-gerais": "hub-casos", "casos-padroes": "hub-casos",
  cards: "hub-cards", flashcards: "hub-cards",
};
const ROTULO_HUB = { menu: "‹ Menu Anemia", "hub-algoritmo": "‹ Algoritmo", "hub-casos": "‹ Casos clínicos", "hub-cards": "‹ Cards de estudo" };

function VistaCasosGerais({ voltar }) {
  return <QuizPNA dados={quizDados} prefixo="medguia:anemia:quiz" rotuloVoltar="‹ Casos clínicos" classeTema="ca anemia" voltar={voltar} />;
}

const SUBVISTAS = {
  guia: AnemiaGuia,
  "algoritmo-visual": AnemiaAlgoritmo,
  "estuda-padrao": AnemiaPadroes,
  cards: AnemiaCards,
  flashcards: AnemiaFlashcards,
  "casos-gerais": VistaCasosGerais,
  "casos-padroes": AnemiaCasosPadroes,
};

const seta = (
  <span className="card-arrow">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
  </span>
);

// Hub do submódulo Anemia (módulo Patologias) — home fiel ao original: 4 cartões,
// em que Cards e Casos abrem hubs próprios com 2 subcartões cada (rotas do original).
// Guia teórico e Algoritmo ainda não foram portados → cartões "Em breve".
export default function Anemia({ accent = "#b8425a" }) {
  const [vista, setVista] = useEstadoLocal("medguia:anemia:vista", "menu");

  useEffect(() => { window.scrollTo({ top: 0 }); }, [vista]);

  const Sub = SUBVISTAS[vista];
  if (Sub) return <Sub voltar={() => setVista(PAI[vista])} rotuloVoltar={ROTULO_HUB[PAI[vista]]} />;

  // ── vista de hub (Cards de estudo / Casos clínicos) ──
  const hub = vista.startsWith("hub-") ? dados.hubs[vista.slice(4)] : null;
  if (hub) {
    const tituloPartes = hub.titulo.split(" ");
    return (
      <div className="ca anemia an-home">
        <div className="crumb">
          <button className="crumb-btn" onClick={() => setVista("menu")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Voltar
          </button>
          <span className="crumb-sep">/</span>
          <span>{dados.titulo}</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-here">{hub.crumb}</span>
        </div>

        <div className="hub-header">
          <div className="hub-eyebrow">{hub.eyebrow}</div>
          <h2 className="hub-title">{tituloPartes.slice(0, -1).join(" ")} <em>{tituloPartes.slice(-1)[0]}</em></h2>
          <p className="hub-sub">{hub.sub}</p>
        </div>

        <div className="subcards-grid">
          {hub.subcards.map((s) => (
            <button key={s.destino} className="subcard" onClick={() => setVista(s.destino)}>
              <div className="card-stripe" style={{ background: s.stripe }} />
              <div className="card-body">
                <div className="subcard-icon-bg"><Ico name={ICONES_SUB[s.destino]} s={26} /></div>
                <span className={"subcard-tag" + (s.tagExt ? " ext" : "")}>{s.tag}</span>
                <h3 className="subcard-title">{s.titulo}</h3>
                <p className="subcard-sub">{s.sub}</p>
                <div className="card-footer"><span className="card-cta">{s.cta}</span>{seta}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── home (menu) ──
  const tituloPartes = dados.menu.heroTitulo.split(" ");
  const labelPartes = dados.menu.label.split(" ");

  return (
    <div className="ca anemia an-home">
      <header className="hero">
        <div className="hero-pill">
          <span className="hero-pill-dot" />
          <span className="hero-pill-text">{dados.menu.pill}</span>
        </div>
        <h1 className="hero-title">{tituloPartes.slice(0, -1).join(" ")} <em>{tituloPartes.slice(-1)[0]}</em></h1>
        <p className="hero-sub">{dados.menu.heroSub}</p>
      </header>

      <div className="cards-header">
        <div className="cards-eyebrow">{dados.menu.eyebrow}</div>
        <div className="cards-label">{labelPartes.slice(0, -1).join(" ")} <em>{labelPartes.slice(-1)[0]}</em></div>
      </div>

      <div className="cards-grid">
        {dados.menu.cartoes.map((c) => (
          <button key={c.destino} className={"card " + CLS_MENU[c.destino] + (c.disponivel ? "" : " an-card-off")}
            onClick={() => { if (c.disponivel) setVista(c.destino === "guia" ? "guia" : "hub-" + c.destino); }}>
            <div className="card-stripe" />
            <div className="card-body">
              <div className="card-header-row">
                <div className="card-icon-bg"><Ico name={ICONES_MENU[c.destino]} s={20} /></div>
                <span className="card-num-badge">{c.badge}</span>
              </div>
              <div className="card-eyebrow">{c.eyebrow}</div>
              <h3 className="card-title">{c.titulo}</h3>
              <p className="card-sub">{c.sub}</p>
              <div className="card-features">
                {c.features.map((f, i) => <div key={i} className="feat"><span className="feat-dot" />{f}</div>)}
              </div>
              <div className="card-footer">
                <span className="card-cta">{c.disponivel ? c.cta : "Em breve"}</span>
                {c.disponivel && seta}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="sources-strip">
        {dados.menu.fontesTags.map((t, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="source-sep">·</span>}
            <span className="source-tag">{t}</span>
          </Fragment>
        ))}
      </div>
      <div className="meta-strip">
        {dados.menu.metaItens.map((m, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="meta-sep">·</span>}
            <span className="meta-item" dangerouslySetInnerHTML={{ __html: m }} />
          </Fragment>
        ))}
      </div>

      <footer className="page-footer">
        <div>
          <div className="footer-title">{dados.menu.rodape.comoTitulo}</div>
          <p className="footer-body">{dados.menu.rodape.comoTexto}</p>
        </div>
        <p className="legal">{dados.menu.rodape.legal}</p>
      </footer>
    </div>
  );
}
