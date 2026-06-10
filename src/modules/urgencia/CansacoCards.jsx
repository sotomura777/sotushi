import dados from "@conteudo/urgencia/cansaco.json";
import CardsDeck from "./sintoma/CardsDeck.jsx";
import Flashcards from "./sintoma/Flashcards.jsx";

// embutido (separador "Cards" do guia): biblioteca de cards. Vista própria: flashcards.
export default function CansacoCards({ accent, voltar, embutido = false }) {
  if (embutido) {
    return <CardsDeck titulo={dados.cards.titulo} sub={dados.cards.sub} cats={dados.cards.cats} defaults={dados.cards.defaults} prefixo="medguia:cansaco:cards" />;
  }
  return (
    <div className="ca ob-page">
      <button className="ob-voltar" onClick={voltar}>‹ Menu Cansaço</button>
      <h1 className="ob-titulo">{dados.flashcards.titulo}</h1>
      <p className="ca-hero-sub">{dados.flashcards.eyebrow}</p>
      <Flashcards dados={dados.flashcards} prefixo="medguia:cansaco:flash" />
    </div>
  );
}
