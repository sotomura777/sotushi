import { useState, useEffect } from "react";
import dados from "@conteudo/cronicas/asma.json";
import quizDados from "@conteudo/cronicas/asma-quiz.json";
import { Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import AsmaGuia from "./AsmaGuia.jsx";
import AsmaAlgoritmo from "./AsmaAlgoritmo.jsx";
import AsmaCards from "./AsmaCards.jsx";
import AsmaFlashcards from "./AsmaFlashcards.jsx";
import QuizPNA from "../../urgencia/sintoma/QuizPNA.jsx";
import "../../urgencia/estilo.css";
import "./estilo.css";

const ICONES_MENU = { guia: "library", algoritmo: "algoritmo", cards: "sparkle", quiz: "bulb" };

function VistaQuiz({ voltar }) {
  return <QuizPNA dados={quizDados} prefixo="medguia:asma:quiz" rotuloVoltar="‹ Menu Asma" classeTema="ca asma" voltar={voltar} />;
}

const SUBVISTAS = { guia: AsmaGuia, algoritmo: AsmaAlgoritmo, cards: AsmaCards, flashcards: AsmaFlashcards, quiz: VistaQuiz };

// Hub do submódulo Asma (módulo Patologias) — menu fiel ao home original.
// O cartão "Cards de estudo" abre um modal de escolha Cards/Flashcards (padrão Dor Abdominal,
// porque o home original não tem entrada própria para os flashcards).
export default function Asma({ accent = "#0891b2" }) {
  const [vista, setVista] = useEstadoLocal("medguia:asma:vista", "menu");
  const [modalCards, setModalCards] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [vista]);

  const abrir = (destino) => {
    if (destino === "cards") { setModalCards(true); return; }
    setVista(destino);
  };
  const escolherModal = (qual) => { setModalCards(false); setVista(qual); };

  const Sub = SUBVISTAS[vista];
  if (Sub) return <Sub voltar={() => setVista("menu")} />;

  const tituloPartes = dados.menu.heroTitulo.split(" ");

  return (
    <div className="ca asma">
      <header className="ca-home">
        <div className="ca-pill">{dados.menu.pill}</div>
        <h1 className="ca-home-titulo">{tituloPartes.slice(0, -1).join(" ")} <em>{tituloPartes.slice(-1)[0]}</em></h1>
        <p className="ca-home-sub">{dados.menu.heroSub}</p>
      </header>

      <div className="ca-home-eyebrow">{dados.menu.eyebrow}</div>
      <h2 className="ca-home-escolhe">{dados.menu.label.split(" ").slice(0, -1).join(" ")} <em>{dados.menu.label.split(" ").slice(-1)[0]}</em></h2>

      <div className="ca-menu-grid">
        {dados.menu.cartoes.map((c) => (
          <button key={c.destino} className="ca-menu-card" onClick={() => abrir(c.destino)}>
            <div className="ca-menu-topo">
              <span className="ca-menu-ico"><Ico name={ICONES_MENU[c.destino]} s={18} /></span>
              <span className="ca-menu-badge">{c.badge}</span>
            </div>
            <div className="ca-menu-eyebrow">{c.eyebrow}</div>
            <div className="ca-menu-titulo">{c.titulo}</div>
            <div className="ca-menu-sub">{c.sub}</div>
            <div className="ca-menu-feats">
              {c.features.map((f, i) => <div key={i} className="ca-menu-feat"><span className="ca-feat-dot" />{f}</div>)}
            </div>
            <div className="ca-menu-cta"><span>{c.cta}</span><span className="ca-menu-seta">→</span></div>
          </button>
        ))}
      </div>

      {modalCards && (
        <div className="ca-modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setModalCards(false); }}>
          <div className="ca-modal">
            <button className="ca-modal-close" onClick={() => setModalCards(false)}>×</button>
            <div className="ca-modal-eyebrow">Espaço de estudo</div>
            <h2 className="ca-modal-titulo">Como queres rever?</h2>
            <p className="ca-modal-sub">Duas formas de estudar a Asma com cards.</p>
            <div className="ca-modal-grid">
              <button className="ca-mo" onClick={() => escolherModal("cards")}>
                <span className="ca-mo-icon"><Ico name="monitor" s={20} /></span>
                <span className="ca-mo-badge">Resumos</span>
                <span className="ca-mo-nome">Cards de estudo</span>
                <span className="ca-mo-desc">Cards editáveis por categoria: crónica, crise e pearls. Cria, apaga e organiza.</span>
                <span className="ca-mo-cta">Abrir cards →</span>
              </button>
              <button className="ca-mo b" onClick={() => escolherModal("flashcards")}>
                <span className="ca-mo-icon"><Ico name="bolt" s={20} /></span>
                <span className="ca-mo-badge">Pergunta‑resposta</span>
                <span className="ca-mo-nome">Flashcards</span>
                <span className="ca-mo-desc">Vinhetas estilo SBA com revisão pontuada: asma crónica e asma aguda.</span>
                <span className="ca-mo-cta">Abrir flashcards →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="asma-fontes-strip">
        {dados.menu.fontesTags.map((t, i) => <span key={i} className="asma-fonte-tag">{t}</span>)}
      </div>
      <div className="asma-meta-strip">
        {dados.menu.metaItens.map((m, i) => <span key={i} className="asma-meta-item" dangerouslySetInnerHTML={{ __html: m }} />)}
      </div>

      <div className="ca-rodape-como">
        <div className="ca-rodape-titulo">{dados.menu.rodape.comoTitulo}</div>
        <p>{dados.menu.rodape.comoTexto}</p>
      </div>
      <div className="rodape">{dados.menu.rodape.legal}</div>
    </div>
  );
}
