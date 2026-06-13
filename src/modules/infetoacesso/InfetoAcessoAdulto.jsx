import dados from "@conteudo/infetoacesso/adulto.json";
import GuiaInfecoes from "./GuiaInfecoes.jsx";

// InfetAcesso (adulto) — guia de antibioterapia em ambulatório por sistema/doença.
export default function InfetoAcessoAdulto({ onVoltar }) {
  return <GuiaInfecoes dados={dados} variante="adulto" onVoltar={onVoltar} />;
}
