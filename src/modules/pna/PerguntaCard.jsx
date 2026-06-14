import { Ico } from "@/components/icones";

// ============================================================================
// PerguntaCard — apresentação de uma pergunta (vinheta + lead-in + opções).
// Partilhado entre Treino e Exame. Componente "burro": recebe estado e callbacks.
//   modo: "exame"         → escolher, sem revelar nada
//         "treino_antes"  → idem (antes de submeter)
//         "treino_depois" → revela correta/erradas + explicações
// ============================================================================
export default function PerguntaCard({ pergunta, opcaoSelecionada, modo, onClicar, marcada, onMarcar, mostrarArea = true }) {
  const revelado = modo === "treino_depois";

  return (
    <div className="pna-pergunta">
      <div className="pna-pergunta-cab">
        <span className="pna-pergunta-area">
          {mostrarArea
            ? (pergunta.taxonomia?.especialidade || "") + (pergunta.taxonomia?.subarea ? ` · ${pergunta.taxonomia.subarea}` : "")
            : "Vinheta clínica"}
        </span>
        {onMarcar && (
          <button className={"pna-marcar" + (marcada ? " ativo" : "")} onClick={onMarcar} aria-label="Marcar para rever">
            <Ico name={marcada ? "starFill" : "star"} s={16} />
          </button>
        )}
      </div>

      <p className="pna-vinheta">{pergunta.vinheta}</p>
      <p className="pna-leadin">{pergunta.lead_in}</p>

      <div className="pna-opcoes">
        {pergunta.opcoes.map((o) => {
          const escolhida = opcaoSelecionada === o.letra;
          const correta = pergunta.correta === o.letra;
          let cls = "pna-opcao";
          if (revelado) {
            if (correta) cls += " pna-opcao--correta";
            else if (escolhida) cls += " pna-opcao--errada";
            else cls += " pna-opcao--dim";
          } else if (escolhida) {
            cls += " pna-opcao--escolhida";
          }
          return (
            <button key={o.letra} className={cls} onClick={() => !revelado && onClicar?.(o.letra)} disabled={revelado}>
              <span className="pna-opcao-letra">{o.letra}</span>
              <span className="pna-opcao-texto">{o.texto}</span>
              {revelado && correta && <span className="pna-opcao-ic"><Ico name="check" s={15} /></span>}
              {revelado && escolhida && !correta && <span className="pna-opcao-ic"><Ico name="close" s={15} /></span>}
            </button>
          );
        })}
      </div>

      {revelado && (
        <div className="pna-explicacao">
          <p className="pna-explicacao-titulo">
            {opcaoSelecionada === pergunta.correta ? "Certo" : "A resposta correta é " + pergunta.correta}
          </p>
          <p className="pna-explicacao-texto">{pergunta.explicacao_global}</p>
        </div>
      )}
    </div>
  );
}
