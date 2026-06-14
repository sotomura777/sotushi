import { useState, useRef, useEffect, useCallback } from "react";
import { Ico } from "@/components/icones";
import PerguntaCard from "./PerguntaCard";
import MapaNavegacao from "./MapaNavegacao";
import { guardarEvento, guardarRespostas, guardarSessao } from "./db";

// ============================================================================
// Exame — simulação cronometrada, sem feedback durante a prova. Captura todos
// os eventos (abriu/selecionou/marcou/submeteu), permite marcar e navegar, tem
// mapa de navegação e atalhos de teclado (A-E, Espaço, Enter, ←/→). Ao submeter
// grava a sessão + respostas no IndexedDB e devolve o resultado.
// ============================================================================
const LETRAS = ["A", "B", "C", "D", "E"];

function fmt(s) {
  if (s < 0) s = 0;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}:${String(ss).padStart(2, "0")}`;
}

export default function Exame({ perguntas, anoSimulado, tempoPorPerguntaS, onSair, onFim }) {
  const duracaoS = tempoPorPerguntaS
    ? perguntas.length * tempoPorPerguntaS
    : perguntas.reduce((s, p) => s + (p.tempo_medio_esperado_s || 90), 0);
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState({});   // qid -> letra
  const [marcadas, setMarcadas] = useState(() => new Set());
  const [restante, setRestante] = useState(duracaoS);
  const [mapa, setMapa] = useState(false);

  const primeiras = useRef({});       // qid -> primeira letra escolhida
  const mudancas = useRef({});        // qid -> nº de mudanças
  const tempos = useRef({});          // qid -> ms acumulados
  const entrouEm = useRef(Date.now());
  const abertas = useRef(new Set());
  const sessaoId = useRef("exame-" + Date.now());
  const inicio = useRef(Date.now());
  const submetido = useRef(false);

  const pergunta = perguntas[idx];

  // regista "abriu" quando uma pergunta é vista pela primeira vez
  useEffect(() => {
    entrouEm.current = Date.now();
    if (!abertas.current.has(pergunta.id)) {
      abertas.current.add(pergunta.id);
      guardarEvento({ sessao_id: sessaoId.current, pergunta_id: pergunta.id, modo: "exame", evento_tipo: "abriu", opcao: null, t_relativo_ms: 0 });
    }
  }, [pergunta.id]);

  const acumularTempo = () => {
    const qid = pergunta.id;
    tempos.current[qid] = (tempos.current[qid] || 0) + (Date.now() - entrouEm.current);
    entrouEm.current = Date.now();
  };

  const irPara = (i) => {
    if (i < 0 || i >= perguntas.length) return;
    acumularTempo();
    setMapa(false);
    setIdx(i);
  };

  const escolher = (letra) => {
    const qid = pergunta.id;
    if (primeiras.current[qid] == null) primeiras.current[qid] = letra;
    else if (respostas[qid] && respostas[qid] !== letra) mudancas.current[qid] = (mudancas.current[qid] || 0) + 1;
    setRespostas((r) => ({ ...r, [qid]: letra }));
    guardarEvento({ sessao_id: sessaoId.current, pergunta_id: qid, modo: "exame", evento_tipo: "selecionou", opcao: letra, t_relativo_ms: Date.now() - entrouEm.current });
  };

  const alternarMarca = () => {
    const qid = pergunta.id;
    setMarcadas((s) => {
      const n = new Set(s);
      const marcou = !n.has(qid);
      marcou ? n.add(qid) : n.delete(qid);
      guardarEvento({ sessao_id: sessaoId.current, pergunta_id: qid, modo: "exame", evento_tipo: marcou ? "marcou" : "desmarcou", opcao: null, t_relativo_ms: Date.now() - entrouEm.current });
      return n;
    });
  };

  const submeter = useCallback(async () => {
    if (submetido.current) return;
    submetido.current = true;
    acumularTempo();
    const tempoTotalMs = Date.now() - inicio.current;
    const respArr = [];
    perguntas.forEach((p, i) => {
      const letra = respostas[p.id];
      if (letra == null) return; // em branco não gera resposta (mas conta p/ score)
      const tx = p.taxonomia || {};
      respArr.push({
        sessao_id: sessaoId.current, pergunta_id: p.id, modo: "exame",
        opcao_final: letra, primeira_opcao: primeiras.current[p.id] ?? letra, correta: letra === p.correta, correta_letra: p.correta,
        tempo_total_ms: tempos.current[p.id] || 0, n_mudancas_resposta: mudancas.current[p.id] || 0,
        marcou_revisao: marcadas.has(p.id), ordem: i,
        especialidade: tx.especialidade, tipo_raciocinio: tx.tipo_raciocinio,
        dificuldade: p.dificuldade, guidelines: p.guidelines_fonte || [],
      });
    });
    const acertos = respArr.filter((r) => r.correta).length;
    await guardarRespostas(respArr);
    await guardarSessao({
      id: sessaoId.current, modo: "exame", ano_simulado: anoSimulado || null,
      data_inicio: inicio.current, data_fim: Date.now(),
      n_perguntas: perguntas.length, n_acertos: acertos, duracao_ms: tempoTotalMs, estado: "concluida",
    });
    onFim({ respostas: respArr, perguntas, nTotal: perguntas.length, nAcertos: acertos, scoreTaxa: perguntas.length ? acertos / perguntas.length : 0, tempoTotalMs, duracaoS, marcadas: [...marcadas], anoSimulado });
  }, [respostas, marcadas, perguntas, anoSimulado, duracaoS, onFim]);

  // temporizador
  useEffect(() => {
    const t = setInterval(() => setRestante((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (restante === 0) submeter(); }, [restante, submeter]);

  // atalhos de teclado
  useEffect(() => {
    if (mapa) return undefined;
    const h = (e) => {
      const k = e.key.toUpperCase();
      if (LETRAS.includes(k)) { escolher(k); }
      else if (e.key === " ") { e.preventDefault(); alternarMarca(); }
      else if (e.key === "Enter") { irPara(idx + 1); }
      else if (e.key === "ArrowRight") { irPara(idx + 1); }
      else if (e.key === "ArrowLeft") { irPara(idx - 1); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const sair = () => { if (window.confirm("Sair do exame? O progresso desta simulação não fica guardado.")) onSair(); };

  if (mapa) {
    const respondidasN = perguntas.filter((p) => respostas[p.id] != null).length;
    const decorridoS = Math.round((Date.now() - inicio.current) / 1000);
    const ritmo = respondidasN ? Math.round(decorridoS / respondidasN) : 0;
    return (
      <MapaNavegacao
        perguntas={perguntas} idxAtual={idx} respostas={respostas} marcadas={marcadas}
        ritmoS={ritmo} restanteFmt={fmt(restante)}
        onIr={irPara} onVoltar={() => setMapa(false)} onSubmeter={submeter}
      />
    );
  }

  const nMarcadas = marcadas.size;
  const progresso = ((idx + 1) / perguntas.length) * 100;

  return (
    <>
      <div className="cartao pna-exame-bar">
        <div className="pna-exame-bar-topo">
          <div className="pna-exame-bar-esq">
            <button className="pna-exame-sair" onClick={sair}><Ico name="close" s={15} /> Sair</button>
            <div>
              <p className="pna-exame-eyebrow">{anoSimulado ? `Simulação PNA ${anoSimulado}` : "Simulação"}</p>
              <p className="pna-exame-prog">Pergunta {idx + 1} / {perguntas.length}</p>
            </div>
          </div>
          <div className="pna-exame-bar-dir">
            {nMarcadas > 0 && <span className="pna-exame-flags"><Ico name="starFill" s={13} /> {nMarcadas}</span>}
            <div style={{ textAlign: "right" }}>
              <p className="pna-exame-eyebrow">Tempo restante</p>
              <p className={"pna-exame-tempo" + (restante < 300 ? " urgente" : "")}>{fmt(restante)}</p>
            </div>
            <button className="pna-exame-grid" onClick={() => { acumularTempo(); setMapa(true); }} aria-label="Mapa de navegação"><Ico name="grelha" s={18} /></button>
          </div>
        </div>
        <div className="pna-exame-barra"><i style={{ width: progresso + "%" }} /></div>
      </div>

      <div className="cartao" style={{ padding: 16 }}>
        <PerguntaCard
          pergunta={pergunta}
          opcaoSelecionada={respostas[pergunta.id] ?? null}
          modo="exame"
          mostrarArea={false}
          onClicar={escolher}
          marcada={marcadas.has(pergunta.id)}
          onMarcar={alternarMarca}
        />
      </div>

      <div className="pna-exame-nav">
        <button className="pna-btn-sec" onClick={alternarMarca}>
          <Ico name={marcadas.has(pergunta.id) ? "starFill" : "star"} s={14} /> {marcadas.has(pergunta.id) ? "Marcada" : "Marcar para rever"}
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="pna-btn-sec" onClick={() => irPara(idx - 1)} disabled={idx === 0}>← Anterior</button>
          {idx + 1 < perguntas.length
            ? <button className="pna-btn" onClick={() => irPara(idx + 1)}>Próxima →</button>
            : <button className="pna-btn" onClick={() => setMapa(true)}>Rever e submeter →</button>}
        </div>
      </div>

      <p className="pna-exame-atalhos">
        <kbd>A</kbd>–<kbd>E</kbd> responder · <kbd>espaço</kbd> marcar · <kbd>↵</kbd> próxima · auto-guardado
      </p>
    </>
  );
}
