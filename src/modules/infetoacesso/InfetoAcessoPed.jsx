import dados from "@conteudo/infetoacesso/pediatria.json";
import GuiaInfecoes from "./GuiaInfecoes.jsx";

// InfetAcesso Ped — versão pediátrica (+ vista de doses e FAB de cálculo).
export default function InfetoAcessoPed({ onVoltar }) {
  return <GuiaInfecoes dados={dados} variante="ped" onVoltar={onVoltar} />;
}
