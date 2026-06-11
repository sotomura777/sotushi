import dados from "@conteudo/cronicas/asma-cards.json";
import { useEstadoLocal } from "@/lib/persistencia";
import CardsDeck from "../../urgencia/sintoma/CardsDeck.jsx";

// Cards de estudo da Asma — três baralhos como no original (Crónica / Crise / Pearls),
// cada um com as suas categorias e gestão própria (CardsDeck partilhado: lixo 30 dias,
// edição inline, pesquisa, ordenação, tipos próprios). O badge de severidade dos cards
// de crise vem de sevLabels.
export default function AsmaCards({ voltar }) {
  const [deckId, setDeckId] = useEstadoLocal("medguia:asma:cards:deck", dados.decks[0].id);
  const deck = dados.decks.find((d) => d.id === deckId);

  return (
    <div className="ca asma ob-page asma-cards">
      <button className="ob-voltar" onClick={voltar}>‹ Menu Asma</button>
      <h1 className="ob-titulo">{dados.titulo}</h1>

      <div className="ob-sub">
        {dados.decks.map((d) => (
          <button key={d.id} className={"ob-sub-btn" + (deckId === d.id ? " ativo" : "")} onClick={() => setDeckId(d.id)}>{d.label}</button>
        ))}
      </div>

      <CardsDeck key={deck.id} titulo={deck.label} sub={dados.sub} cats={deck.cats} defaults={deck.defaults}
        sevLabels={dados.sevLabels} prefixo={"medguia:asma:cards:" + deck.id} />
    </div>
  );
}
