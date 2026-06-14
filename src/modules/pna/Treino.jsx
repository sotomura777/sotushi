import { useState, useRef, useEffect } from "react";
import PerguntaCard from "./PerguntaCard";
import { guardarEvento, guardarResposta, obterFsrsCard, guardarFsrsCard } from "./db";
import { novoCard, aplicarGrade, intervalosPreview } from "./logica-fsrs";

// ============================================================================
// Treino — modo de estudo com feedback imediato. Captura eventos
// (abriu/selecionou/submeteu) e, após a resposta, mostra a explicação + os 4
// botões FSRS (Errei/Difícil/Bom/Fácil) que agendam a repetição espaçada.
// ============================================================================
let contadorSessao = 0;

const fmtInt = (d) => {
  if (d < 1) return "<1d";
  if (d < 30) return `${Math.round(d)}d`;
  if (d < 365) return `${Math.round(d / 30)}m`;
  return `${Math.round(d / 365)}a`;
};
const GRAUS = [
  { g: "again", t: "Errei", cls: "hc5" },
  { g: "hard", t: "Difícil", cls: "hc4" },
  { g: "good", t: "Bom", cls: "hc2" },
  { g: "easy", t: "Fácil", cls: "hc1" },
];

export default function Treino({ perguntas, onFim }) {
  const [idx, setIdx] = useState(0);
  const [selecao, setSelecao] = useState(null);
  const [submetida, setSubmetida] = useState(false);
  const [preview, setPreview] = useState(null);
  const sessaoId = useRef("treino-" + Date.now() + "-" + ++contadorSessao);
  const abertoEm = useRef(Date.now());
  const nMudancas = useRef(0);
  const primeira = useRef(null);

  const pergunta = perguntas[idx];

  useEffect(() => {
    abertoEm.current = Date.now();
    nMudancas.current = 0;
    primeira.current = null;
    setPreview(null);
    guardarEvento({ sessao_id: sessaoId.current, pergunta_id: pergunta.id, modo: "treino", evento_tipo: "abriu", opcao: null, t_relativo_ms: 0 });
  }, [pergunta.id]);

  const escolher = (letra) => {
    if (submetida) return;
    if (primeira.current === null) primeira.current = letra;
    if (selecao !== null && selecao !== letra) nMudancas.current += 1;
    setSelecao(letra);
    guardarEvento({ sessao_id: sessaoId.current, pergunta_id: pergunta.id, modo: "treino", evento_tipo: "selecionou", opcao: letra, t_relativo_ms: Date.now() - abertoEm.current });
  };

  const submeter = async () => {
    if (selecao === null || submetida) return;
    const tempo = Date.now() - abertoEm.current;
    const correta = selecao === pergunta.correta;
    guardarEvento({ sessao_id: sessaoId.current, pergunta_id: pergunta.id, modo: "treino", evento_tipo: "submeteu", opcao: selecao, t_relativo_ms: tempo });
    const tx = pergunta.taxonomia || {};
    guardarResposta({
      sessao_id: sessaoId.current, pergunta_id: pergunta.id, modo: "treino",
      opcao_final: selecao, primeira_opcao: primeira.current, correta, correta_letra: pergunta.correta,
      tempo_total_ms: tempo, n_mudancas_resposta: nMudancas.current, marcou_revisao: false, ordem: idx,
      especialidade: tx.especialidade, tipo_raciocinio: tx.tipo_raciocinio,
      dificuldade: pergunta.dificuldade, guidelines: pergunta.guidelines_fonte || [],
    });
    setSubmetida(true);
    const card = await obterFsrsCard(pergunta.id);
    setPreview(intervalosPreview(card, Date.now()));
  };

  const avancar = () => {
    if (idx + 1 >= perguntas.length) { onFim?.(); return; }
    setIdx(idx + 1);
    setSelecao(null);
    setSubmetida(false);
  };

  const gradear = async (grade) => {
    const card = (await obterFsrsCard(pergunta.id)) || novoCard(pergunta.id);
    await guardarFsrsCard(aplicarGrade(card, grade, Date.now()));
    avancar();
  };

  return (
    <>
      <div className="pna-treino-topo">
        <button className="pna-link" onClick={onFim}>← Terminar</button>
        <span className="pna-treino-prog">{idx + 1} / {perguntas.length}</span>
      </div>

      <div className="cartao" style={{ padding: 16 }}>
        <PerguntaCard
          pergunta={pergunta}
          opcaoSelecionada={selecao}
          modo={submetida ? "treino_depois" : "treino_antes"}
          onClicar={escolher}
        />
      </div>

      {!submetida ? (
        <div className="pna-treino-acoes">
          <button className="pna-btn" onClick={submeter} disabled={selecao === null}>Confirmar resposta</button>
        </div>
      ) : (
        <>
          <p className="pna-fsrs-lbl">Quão bem sabias? <span>agenda a próxima revisão</span></p>
          <div className="pna-fsrs">
            {GRAUS.map((b) => (
              <button key={b.g} className={"pna-fsrs-btn " + b.cls} onClick={() => gradear(b.g)}>
                <span className="t">{b.t}</span>
                {preview && <span className="d">{fmtInt(preview[b.g])}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
