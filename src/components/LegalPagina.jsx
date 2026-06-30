import privacidade from "@conteudo/legal/privacidade.json";
import termos from "@conteudo/legal/termos.json";
import "./landing.css";

// Visor das páginas legais (Política de Privacidade / Termos). Conteúdo em
// /conteudo/legal/. Usado a partir da Landing.
const DOCS = { privacidade, termos };

export default function LegalPagina({ tipo, dark, onVoltar }) {
  const doc = DOCS[tipo] || privacidade;
  return (
    <div className={"lp lp--legal" + (dark ? " dark" : "")}>
      <div className="lp-legal-wrap">
        <button className="lp-voltar" onClick={onVoltar}>← Voltar</button>
        <h1 className="lp-legal-titulo">{doc.titulo}</h1>
        <p className="lp-legal-data">{doc.atualizado}</p>
        <div className="lp-legal-corpo" dangerouslySetInnerHTML={{ __html: doc.html }} />
      </div>
    </div>
  );
}
