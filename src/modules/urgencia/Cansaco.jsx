import dados from "@conteudo/urgencia/cansaco.json";
import { Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import CansacoGuia from "./CansacoGuia.jsx";
import CansacoCards from "./CansacoCards.jsx";
import CansacoQuiz from "./CansacoQuiz.jsx";
import CansacoAnamnese from "./CansacoAnamnese.jsx";

const ICONES_MENU = { guia: "library", anamnese: "clipboard", cards: "sparkle", quiz: "bulb" };
const SUBVISTAS = { guia: CansacoGuia, anamnese: CansacoAnamnese, cards: CansacoCards, quiz: CansacoQuiz };

export default function Cansaco({ accent = "#e85d4a", voltar }) {
  const [vista, setVista] = useEstadoLocal("medguia:cansaco:vista", "menu");

  const Sub = SUBVISTAS[vista];
  if (Sub) return <Sub accent={accent} voltar={() => setVista("menu")} />;

  return (
    <div className="ca" style={{ "--acento": accent }}>
      <button className="ob-voltar" onClick={voltar}>‹ Voltar</button>

      <div className="ca-pill">{dados.menu.pill}</div>
      <h1 className="ob-titulo">{dados.titulo}</h1>
      <p className="ca-hero-sub">{dados.menu.heroSub}</p>

      <div className="ca-menu-label">
        <span className="ca-menu-eyebrow">{dados.menu.eyebrow}</span>
        {dados.menu.label}
      </div>

      <div className="ca-menu-grid">
        {dados.menu.cartoes.map((c) => {
          const ativo = !!SUBVISTAS[c.destino];
          return (
            <button key={c.destino} className={"ca-menu-card" + (ativo ? "" : " off")} disabled={!ativo} onClick={() => ativo && setVista(c.destino)}>
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
              <div className="ca-menu-cta">{ativo ? c.cta + " ›" : "Em breve"}</div>
            </button>
          );
        })}
      </div>

      <div className="ca-rodape-como">
        <div className="ca-rodape-titulo">{dados.menu.rodape.comoTitulo}</div>
        <p>{dados.menu.rodape.comoTexto}</p>
      </div>
      <div className="rodape">{dados.menu.rodape.legal}</div>
    </div>
  );
}
