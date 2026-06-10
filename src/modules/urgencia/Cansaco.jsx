import { useState, useEffect } from "react";
import dados from "@conteudo/urgencia/cansaco.json";
import { Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import CansacoGuia from "./CansacoGuia.jsx";
import CansacoCards from "./CansacoCards.jsx";
import CansacoQuiz from "./CansacoQuiz.jsx";

const ICONES_MENU = { guia: "library", anamnese: "clipboard", cards: "sparkle", quiz: "bulb" };
// "flashcards" é a vista aberta pela opção respetiva do modal de cards.
const SUBVISTAS = { guia: CansacoGuia, flashcards: CansacoCards, quiz: CansacoQuiz };
// atalhos do menu para separadores do guia
const TAB_DESTINO = { guia: 0, anamnese: 4 };
const TAB_CARDS = 3;

export default function Cansaco({ accent = "#e85d4a", voltar }) {
  const [vista, setVista] = useEstadoLocal("medguia:cansaco:vista", "menu");
  const [tabPedida, setTabPedida] = useState(null);
  const [modalCards, setModalCards] = useState(false);

  // repõe o scroll em qualquer mudança de vista — incluindo a entrada inicial
  // com uma vista persistida (senão aterra-se a meio da página anterior)
  useEffect(() => { window.scrollTo({ top: 0 }); }, [vista]);

  // "cards" abre o modal "Como queres estudar?" (como no original)
  const abrir = (destino) => {
    if (destino === "cards") { setModalCards(true); return; }
    if (destino in TAB_DESTINO) { setTabPedida(TAB_DESTINO[destino]); setVista("guia"); }
    else { setTabPedida(null); setVista(destino); }
  };
  const escolherModal = (i) => {
    setModalCards(false);
    if (i === 0) { setTabPedida(TAB_CARDS); setVista("guia"); }
    else setVista("flashcards");
  };

  const Sub = SUBVISTAS[vista];
  if (Sub) return <Sub accent={accent} voltar={() => setVista("menu")} tabInicial={tabPedida} />;

  return (
    <div className="ca">
      <button className="ob-voltar" onClick={voltar}>‹ Voltar</button>

      <header className="ca-home">
        <div className="ca-pill">{dados.menu.pill}</div>
        <h1 className="ca-home-titulo">{dados.titulo.split(" / ")[0]} / <em>{dados.titulo.split(" / ")[1]}.</em></h1>
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
            <div className="ca-modal-eyebrow">{dados.menu.modalCards.eyebrow}</div>
            <h2 className="ca-modal-titulo">{dados.menu.modalCards.titulo}</h2>
            <p className="ca-modal-sub">{dados.menu.modalCards.sub}</p>
            <div className="ca-modal-grid">
              {dados.menu.modalCards.opcoes.map((o, i) => (
                <button key={i} className={"ca-mo" + (i === 1 ? " b" : "")} onClick={() => escolherModal(i)}>
                  <span className="ca-mo-icon"><Ico name={i === 0 ? "monitor" : "bolt"} s={20} /></span>
                  <span className="ca-mo-badge">{o.badge}</span>
                  <span className="ca-mo-nome">{o.nome}</span>
                  <span className="ca-mo-desc">{o.desc}</span>
                  <span className="ca-mo-cta">{o.cta} →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="ca-rodape-como">
        <div className="ca-rodape-titulo">{dados.menu.rodape.comoTitulo}</div>
        <p>{dados.menu.rodape.comoTexto}</p>
      </div>
      <div className="rodape">{dados.menu.rodape.legal}</div>
    </div>
  );
}
