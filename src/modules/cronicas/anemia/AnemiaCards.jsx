import dados from "@conteudo/cronicas/anemia-cards.json";
import { useEstadoLocal } from "@/lib/persistencia";
import CardsDeck from "../../urgencia/sintoma/CardsDeck.jsx";

// Cards de estudo da Anemia — três baralhos como no original (Microcíticas /
// Normocíticas / Macrocíticas), cada um com as suas categorias e gestão própria
// (CardsDeck partilhado: lixo 30 dias, edição inline, pesquisa, ordenação).
export default function AnemiaCards({ voltar, rotuloVoltar = "‹ Voltar" }) {
  const [deckId, setDeckId] = useEstadoLocal("medguia:anemia:cards:deck", dados.decks[0].id);
  const deck = dados.decks.find((d) => d.id === deckId);

  return (
    <div className="ca anemia ob-page an-cards">
      <button className="ob-voltar" onClick={voltar}>{rotuloVoltar}</button>
      <h1 className="ob-titulo">{dados.titulo}</h1>

      <div className="ob-sub">
        {dados.decks.map((d) => (
          <button key={d.id} className={"ob-sub-btn" + (deckId === d.id ? " ativo" : "")} onClick={() => setDeckId(d.id)}>{d.label}</button>
        ))}
      </div>

      <CardsDeck key={deck.id} titulo={deck.label} sub={dados.sub} cats={deck.cats} defaults={deck.defaults}
        prefixo={"medguia:anemia:cards:" + deck.id} />
    </div>
  );
}
